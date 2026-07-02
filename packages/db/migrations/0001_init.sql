-- 0001_init.sql
-- Schema-only migration: extensions, enums, tables, indexes.
-- No RLS policies, views, functions, or triggers yet.
-- Those come in later migrations (0003, 0004, 0006).
--
-- Note: updated_at columns are populated on insert only.
-- A trigger to maintain them on UPDATE will be added in migration 0005_audit_triggers.sql.

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;   -- gen_random_uuid()
create extension if not exists vector with schema extensions;      -- pgvector for semantic skill matching

-- ============================================================================
-- Enums
-- ============================================================================

create type user_role as enum ('seeker', 'recruiter');

create type subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'
);

create type proficiency_level as enum (
  'beginner', 'intermediate', 'advanced', 'expert'
);

create type job_status as enum ('draft', 'active', 'paused', 'closed');

create type swipe_decision as enum ('like', 'pass', 'pending');

create type generation_kind as enum ('cv_draft');

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

-- ============================================================================
-- Tables
-- ============================================================================

-- profiles -------------------------------------------------------------------
-- Every authenticated user has exactly one profile. Discriminated by role.

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null,
  display_name text,       -- pseudonym shown pre-match (e.g. "Developer #4521")
  real_name    text,       -- PII, will be encrypted via pgsodium in a later migration
  email        text,       -- PII, will be encrypted via pgsodium in a later migration
  avatar_url   text,       -- generic avatar pre-match
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- companies ------------------------------------------------------------------
-- One row per paying employer. Created during admin onboarding.

create table companies (
  id                 uuid primary key default gen_random_uuid(),
  legal_name         text not null,
  display_name       text not null,       -- shown to seekers post-match
  pseudonym          text not null,       -- e.g. "Mittelstaendler #12" pre-match
  industry           text,
  size_category      text,                -- '1-10', '11-50', '51-200', '201-1000', '1000+'
  logo_url           text,
  vat_id             text,
  billing_email      text not null,
  stripe_customer_id text unique,
  show_anonymous     boolean default true, -- if false, name visible pre-match
  created_at         timestamptz default now()
);

-- seeker_profiles ------------------------------------------------------------
-- Seeker-specific fields, 1:1 with profiles where role = 'seeker'.

create table seeker_profiles (
  profile_id                uuid primary key references profiles(id) on delete cascade,
  years_experience          int,
  salary_min_eur            int,
  salary_max_eur            int,
  location_lat              double precision,
  location_lon              double precision,
  search_radius_km          int default 50,
  remote_ok                 boolean default true,
  current_employer_blocklist uuid[] default '{}', -- company IDs they don't want to see
  cv_markdown               text,                 -- AI-generated, user-approved CV
  cv_approved_at            timestamptz,          -- null until user approves
  bio                       text check (char_length(bio) <= 280) -- short text, max 280 chars
);

-- recruiter_profiles ---------------------------------------------------------
-- Recruiter-specific fields, 1:1 with profiles where role = 'recruiter'.

create table recruiter_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade
);

-- subscriptions --------------------------------------------------------------
-- Stripe subscription state, mirrored from webhooks.

create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  company_id             uuid not null references companies(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_price_id        text not null,
  status                 subscription_status not null,
  current_period_start   timestamptz not null,
  current_period_end     timestamptz not null,
  cancel_at_period_end   boolean default false,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- skills ---------------------------------------------------------------------
-- Canonical skill taxonomy. Seeded with ~500 IT skills for MVP.

create table skills (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,      -- 'typescript', 'kubernetes'
  display_name text not null,
  category     text,                      -- 'language', 'framework', 'tool', 'concept'
  embedding    vector(384),               -- pgvector, for fuzzy matching V1
  created_at   timestamptz default now()
);

-- seeker_skills --------------------------------------------------------------
-- A seeker's skills with self-reported proficiency.

create table seeker_skills (
  profile_id uuid references profiles(id) on delete cascade,
  skill_id   uuid references skills(id) on delete cascade,
  level      proficiency_level not null,
  years_used numeric(3,1),                -- e.g. 2.5 = 2.5 years
  primary key (profile_id, skill_id)
);

-- jobs -----------------------------------------------------------------------
-- Job postings created by recruiters.

create table jobs (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies(id) on delete cascade,
  created_by          uuid not null references profiles(id),
  title               text not null,
  description         text not null,
  status              job_status default 'draft',
  match_threshold_pct int not null default 75,
  location_lat        double precision,
  location_lon        double precision,
  remote_ok           boolean default false,
  salary_min_eur      int,
  salary_max_eur      int,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  check (match_threshold_pct between 60 and 100)
);

-- job_criteria ---------------------------------------------------------------
-- Weighted skill requirements for a job. Sum of weights should equal 100,
-- enforced in application code.

create table job_criteria (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references jobs(id) on delete cascade,
  skill_id    uuid not null references skills(id),
  weight      int not null,               -- 1-100
  min_level   proficiency_level not null default 'intermediate',
  is_required boolean default false,      -- if true, failing this skill means score = 0
  unique (job_id, skill_id),
  check (weight between 1 and 100)
);

-- matches --------------------------------------------------------------------
-- One row per (seeker, job) pair. Tracks both sides' decisions.
-- Mutual match (both liked) unlocks chat.

create table matches (
  id                  uuid primary key default gen_random_uuid(),
  seeker_id           uuid not null references profiles(id) on delete cascade,
  job_id              uuid not null references jobs(id) on delete cascade,
  score_pct           int not null check (score_pct between 0 and 100),
  seeker_decision     swipe_decision default 'pending',
  recruiter_decision  swipe_decision default 'pending',
  seeker_decided_at   timestamptz,
  recruiter_decided_at timestamptz,
  is_mutual           boolean generated always as (
    seeker_decision = 'like' and recruiter_decision = 'like'
  ) stored,
  revealed_at         timestamptz,         -- when identities became visible
  created_at          timestamptz default now(),
  unique (seeker_id, job_id)
);

-- messages -------------------------------------------------------------------
-- Chat messages, only insertable when matches.is_mutual = true.

create table messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  sender_id  uuid not null references profiles(id),
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz default now()
);

-- ai_generations -------------------------------------------------------------
-- Audit trail for every AI-generated artifact (CV drafts in MVP).

create table ai_generations (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  kind        generation_kind not null,
  model       text not null,               -- 'deepseek-chat', 'deepseek-coder'
  input_hash  text not null,               -- hash of structured input, no PII
  output_text text not null,
  approved    boolean default false,
  approved_at timestamptz,
  created_at  timestamptz default now()
);

-- audit_log ------------------------------------------------------------------
-- Every sensitive operation logged for DSGVO Art. 22 and incident response.
-- Append-only: no UPDATE or DELETE policy.

create table audit_log (
  id         bigserial primary key,
  actor_id   uuid references profiles(id) on delete set null,
  subject_id uuid references profiles(id) on delete set null,
  action     audit_action not null,
  metadata   jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Matching queries
create index seeker_skills_profile on seeker_skills(profile_id);
create index job_criteria_job on job_criteria(job_id);

-- Match feed for seekers: pending decisions, sorted by score
create index matches_seeker_active on matches(seeker_id) where seeker_decision = 'pending';
create index matches_seeker_feed on matches(seeker_id, score_pct desc)
  where seeker_decision = 'pending';

-- Match list for recruiters: per job, sorted by score
create index matches_recruiter_active on matches(job_id) where recruiter_decision = 'pending';
create index matches_recruiter_feed on matches(job_id, score_pct desc)
  where recruiter_decision = 'pending';

-- Filter on mutual matches
create index matches_mutual on matches(id) where is_mutual = true;

-- Chat lookup
create index messages_match_created on messages(match_id, created_at desc);

-- Audit log queries
create index audit_log_subject on audit_log(subject_id, created_at desc);
create index audit_log_actor on audit_log(actor_id, created_at desc);
