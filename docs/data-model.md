# NexaAi — Data Model

## Overview

This document defines the entities, their relationships, the Row Level Security (RLS) policies that enforce anonymity and access rules, and the migration strategy.

The data model serves three hard requirements:

1. **Bidirectional anonymity** until a mutual match. Neither side sees the other's identity by default.
2. **Auditability** of every reveal, decision, and AI-generated artifact (DSGVO Art. 22).
3. **Performance** of the matching query at MVP scale (up to ~10k profiles, ~1k jobs, ~100 employers).

## Entity overview

```
auth.users (Supabase managed)
    │
    ├──< profiles            (1:1, job seekers and recruiters)
    │       │
    │       └──< seeker_skills (M:N via skills)
    │
    └──< company_members     (recruiter ↔ company)

companies
    │
    ├──< subscriptions       (Stripe)
    └──< jobs
            │
            └──< job_criteria (weighted requirements)

matches  (seeker ↔ job, bidirectional decisions tracked)
    │
    └──< messages            (only when matched = true)

skills   (canonical skill taxonomy)

audit_log (every sensitive read/write)
ai_generations (every CV draft)
```

## Tables

### `profiles`

Every authenticated user has exactly one profile row. Discriminated by `role`.

```sql
create type user_role as enum ('seeker', 'recruiter');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  display_name text,           -- pseudonym shown pre-match (e.g. "Developer #4521")
  real_name text,              -- encrypted, revealed only post-match
  email text,                  -- encrypted, revealed only post-match
  avatar_url text,             -- generic avatar pre-match
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Seeker-specific fields live in `seeker_profiles` (1:1 with profiles where role = 'seeker'):

```sql
create table seeker_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  years_experience int,
  salary_min_eur int,
  salary_max_eur int,
  location_lat double precision,
  location_lon double precision,
  search_radius_km int default 50,
  remote_ok boolean default true,
  current_employer_blocklist uuid[] default '{}',  -- company IDs they don't want to see
  cv_markdown text,                                 -- AI-generated, user-approved CV
  cv_approved_at timestamptz,                       -- null until user approves
  bio text                                          -- short text, max 280 chars
);
```

Recruiter-specific fields live in `recruiter_profiles`:

```sql
create table recruiter_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade
);
```

### `companies`

One row per paying employer. Created during admin onboarding.

```sql
create table companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,       -- shown to seekers post-match
  pseudonym text not null,           -- e.g. "Mittelständler #12" pre-match
  industry text,
  size_category text,                -- '1-10', '11-50', '51-200', '201-1000', '1000+'
  logo_url text,
  vat_id text,
  billing_email text not null,
  stripe_customer_id text unique,
  show_anonymous boolean default true,  -- if false, name visible pre-match
  created_at timestamptz default now()
);
```

### `subscriptions`

Stripe subscription state, mirrored from webhooks.

```sql
create type subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  status subscription_status not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### `skills`

Canonical taxonomy. Seeded with ~500 IT skills for MVP. Extended later via admin tool.

```sql
create table skills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,        -- 'typescript', 'kubernetes'
  display_name text not null,
  category text,                    -- 'language', 'framework', 'tool', 'concept'
  embedding vector(384),            -- pgvector, for fuzzy matching V1
  created_at timestamptz default now()
);
```

### `seeker_skills`

A seeker's skills with self-reported proficiency.

```sql
create type proficiency_level as enum ('beginner', 'intermediate', 'advanced', 'expert');

create table seeker_skills (
  profile_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  level proficiency_level not null,
  years_used numeric(3,1),          -- 2.5 = 2.5 years
  primary key (profile_id, skill_id)
);
```

### `jobs`

Job postings created by recruiters.

```sql
create type job_status as enum ('draft', 'active', 'paused', 'closed');

create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  created_by uuid not null references profiles(id),
  title text not null,
  description text not null,
  status job_status default 'draft',
  match_threshold_pct int not null default 75,  -- 60-100, slider in UI
  location_lat double precision,
  location_lon double precision,
  remote_ok boolean default false,
  salary_min_eur int,
  salary_max_eur int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (match_threshold_pct between 60 and 100)
);
```

### `job_criteria`

Weighted skill requirements for a job. The sum of weights for a job should equal 100, enforced in application code (Postgres trigger optional).

```sql
create table job_criteria (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  skill_id uuid not null references skills(id),
  weight int not null,                          -- 0-100
  min_level proficiency_level not null default 'intermediate',
  is_required boolean default false,            -- if true, failing this skill means score = 0
  unique (job_id, skill_id),
  check (weight between 1 and 100)
);
```

### `matches`

One row per (seeker, job) pair. Tracks both sides' decisions. Mutual match unlocks chat.

```sql
create type swipe_decision as enum ('like', 'pass', 'pending');

create table matches (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references profiles(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  score_pct int not null,                       -- computed at creation
  seeker_decision swipe_decision default 'pending',
  recruiter_decision swipe_decision default 'pending',
  seeker_decided_at timestamptz,
  recruiter_decided_at timestamptz,
  is_mutual boolean generated always as (
    seeker_decision = 'like' and recruiter_decision = 'like'
  ) stored,
  revealed_at timestamptz,                       -- when identities became visible
  created_at timestamptz default now(),
  unique (seeker_id, job_id)
);

create index matches_seeker_active on matches(seeker_id) where seeker_decision = 'pending';
create index matches_recruiter_active on matches(job_id) where recruiter_decision = 'pending';
create index matches_mutual on matches(id) where is_mutual = true;
```

### `messages`

Chat messages, only insertable when `matches.is_mutual = true`.

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index messages_match_created on messages(match_id, created_at desc);
```

### `ai_generations`

Audit trail for every AI-generated artifact (CV drafts in MVP).

```sql
create type generation_kind as enum ('cv_draft');

create table ai_generations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind generation_kind not null,
  model text not null,                          -- 'deepseek-chat', 'deepseek-coder'
  input_hash text not null,                     -- hash of structured input, no PII
  output_text text not null,
  approved boolean default false,
  approved_at timestamptz,
  created_at timestamptz default now()
);
```

### `audit_log`

Every sensitive operation logged for DSGVO Art. 22 and incident response.

```sql
create type audit_action as enum (
  'profile_revealed',
  'profile_exported',
  'profile_deleted',
  'match_created',
  'match_revealed',
  'cv_generated',
  'cv_approved',
  'job_published',
  'subscription_changed'
);

create table audit_log (
  id bigserial primary key,
  actor_id uuid references profiles(id) on delete set null,
  subject_id uuid references profiles(id) on delete set null,
  action audit_action not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index audit_log_subject on audit_log(subject_id, created_at desc);
```

## Row Level Security strategy

Every table has RLS enabled. The policies enforce three rules.

### Rule 1: A seeker sees only their own profile, plus jobs

```sql
-- Seekers read only their own profile rows
create policy seeker_own_profile on profiles for select
  using (auth.uid() = id);

-- Seekers read all active jobs (with company info filtered by show_anonymous)
create policy active_jobs_visible on jobs for select
  using (status = 'active');
```

### Rule 2: A recruiter sees seeker profiles only via matches against their company's jobs, and only with identity fields exposed if mutual

This is the anonymity core. A recruiter cannot SELECT * FROM profiles directly. They access seeker data through a **view** that joins matches and filters columns.

```sql
create view recruiter_candidate_view as
select
  p.id,
  case when m.is_mutual then p.display_name else null end as display_name,
  case when m.is_mutual then p.real_name else p.display_name end as visible_name,
  case when m.is_mutual then p.email else null end as visible_email,
  sp.years_experience,
  sp.salary_min_eur,
  sp.salary_max_eur,
  sp.bio,
  sp.cv_markdown,
  m.id as match_id,
  m.score_pct,
  m.is_mutual
from profiles p
join seeker_profiles sp on sp.profile_id = p.id
join matches m on m.seeker_id = p.id
join jobs j on j.id = m.job_id
join recruiter_profiles rp on rp.company_id = j.company_id
where rp.profile_id = auth.uid();
```

The view is queryable only by the recruiter who owns the matching jobs. RLS on the underlying tables blocks direct access.

### Rule 3: Messages are insertable and readable only when match is mutual

```sql
create policy messages_select_mutual on messages for select
  using (
    exists (
      select 1 from matches m
      where m.id = messages.match_id
        and m.is_mutual = true
        and (
          m.seeker_id = auth.uid()
          or exists (
            select 1 from recruiter_profiles rp
            join jobs j on j.company_id = rp.company_id
            where rp.profile_id = auth.uid() and j.id = m.job_id
          )
        )
    )
  );

create policy messages_insert_mutual on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from matches m
      where m.id = messages.match_id and m.is_mutual = true
    )
  );
```

## Encryption strategy

`profiles.real_name` and `profiles.email` are stored using `pgsodium`'s transparent column encryption. Decryption keys are managed by Supabase Vault. The RLS view above only returns decrypted values when `is_mutual = true`. Pre-match, the columns return null.

## Migrations

Migrations live in `packages/db/migrations/` numbered `0001_init.sql`, `0002_skills_seed.sql`, etc.

```
packages/db/
├── migrations/
│   ├── 0001_init.sql                  # All tables, enums, RLS basics
│   ├── 0002_skills_seed.sql           # ~500 IT skills with embeddings
│   ├── 0003_matching_functions.sql    # match_score(), trigger to create matches
│   ├── 0004_rls_policies.sql          # Full RLS policy set
│   ├── 0005_audit_triggers.sql        # Triggers writing to audit_log
│   └── 0006_views.sql                 # recruiter_candidate_view, etc.
├── seed/
│   └── skills.json                    # Source data for 0002
├── types/
│   └── generated.ts                   # `supabase gen types` output
└── package.json
```

Type generation happens in CI after migrations apply. Generated types are committed so apps can build without a running database.

## Indexes worth getting right early

```sql
-- Matching queries
create index seeker_skills_profile on seeker_skills(profile_id);
create index job_criteria_job on job_criteria(job_id);

-- Match feed for seekers (pending decisions, sorted by score)
create index matches_seeker_feed on matches(seeker_id, score_pct desc)
  where seeker_decision = 'pending';

-- Match list for recruiters (per job, sorted by score)
create index matches_recruiter_feed on matches(job_id, score_pct desc)
  where recruiter_decision = 'pending';

-- Chat lookup
create index messages_match_id on messages(match_id, created_at desc);

-- Audit log queries
create index audit_log_actor on audit_log(actor_id, created_at desc);
```

## What we are deliberately NOT modeling in MVP

- Skill-verification tasks (whole tables for tasks, task_attempts, task_results) — V1
- Multi-recruiter companies (company_members junction table) — V1
- Cover letters, additional documents — V2
- Read receipts beyond `messages.read_at` — V2
- Soft-delete (`deleted_at`) instead of hard delete — V2; for MVP DSGVO delete is truly destructive plus audit log entry
- Embeddings for seekers and jobs (pgvector cosine matching) — V1; MVP uses weighted skill overlap
