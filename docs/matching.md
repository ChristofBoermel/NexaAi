# NexaAi — Matching Algorithm

## Goals

1. Produce a score from 0 to 100 for any (seeker, job) pair.
2. Respect employer-set threshold: scores below threshold are filtered from feeds.
3. Honor `is_required` criteria as hard filters.
4. Run fast enough that match creation is an immediate database operation, not a background job, at MVP scale.
5. Be implementable as a Postgres function so it can run inside triggers without extra infrastructure.

## V0 (MVP) algorithm: weighted skill overlap

For each `job_criteria` row attached to a job, the seeker either possesses the skill at sufficient level or does not. The score is the weighted sum of satisfied criteria, divided by the total possible weight, expressed as a percentage.

### Pseudocode

```
function match_score(seeker_id, job_id) -> int:
    criteria = SELECT * FROM job_criteria WHERE job_id = job_id
    seeker_skills_map = SELECT skill_id, level, years_used
                       FROM seeker_skills WHERE profile_id = seeker_id

    total_weight = 0
    earned_weight = 0
    required_satisfied = true

    for c in criteria:
        total_weight += c.weight
        if c.skill_id in seeker_skills_map:
            seeker_level = seeker_skills_map[c.skill_id].level
            if level_meets_minimum(seeker_level, c.min_level):
                earned_weight += c.weight
            elif c.is_required:
                required_satisfied = false
        elif c.is_required:
            required_satisfied = false

    if not required_satisfied:
        return 0
    if total_weight == 0:
        return 0
    return round((earned_weight / total_weight) * 100)
```

### Level comparison

```
level_rank = {
  'beginner':     1,
  'intermediate': 2,
  'advanced':     3,
  'expert':       4
}

level_meets_minimum(seeker_level, required_level) =
  level_rank[seeker_level] >= level_rank[required_level]
```

### Postgres implementation

```sql
create or replace function match_score(p_seeker_id uuid, p_job_id uuid)
returns int
language plpgsql
stable
as $$
declare
  v_total_weight int := 0;
  v_earned_weight int := 0;
  v_required_failed boolean := false;
begin
  select
    coalesce(sum(c.weight), 0),
    coalesce(sum(
      case
        when ss.skill_id is not null
         and level_rank(ss.level) >= level_rank(c.min_level)
        then c.weight
        else 0
      end
    ), 0),
    bool_or(
      c.is_required
      and (ss.skill_id is null
           or level_rank(ss.level) < level_rank(c.min_level))
    )
  into v_total_weight, v_earned_weight, v_required_failed
  from job_criteria c
  left join seeker_skills ss
    on ss.skill_id = c.skill_id
   and ss.profile_id = p_seeker_id
  where c.job_id = p_job_id;

  if v_required_failed or v_total_weight = 0 then
    return 0;
  end if;

  return round((v_earned_weight::numeric / v_total_weight) * 100);
end;
$$;

create or replace function level_rank(p_level proficiency_level)
returns int
language sql
immutable
as $$
  select case p_level
    when 'beginner' then 1
    when 'intermediate' then 2
    when 'advanced' then 3
    when 'expert' then 4
  end;
$$;
```

## Worked examples

### Example 1: Mid-level frontend role, threshold 75%

**Job: "Senior React Developer at Mittelständler"**
- Criteria:
  - TypeScript (weight 30, min intermediate, required)
  - React (weight 30, min advanced, required)
  - Next.js (weight 20, min intermediate)
  - GraphQL (weight 10, min beginner)
  - Testing (weight 10, min intermediate)
- Threshold: 75%

**Seeker A**: TypeScript expert (4y), React advanced (3y), Next.js intermediate (2y), no GraphQL, Testing intermediate (1y)
- TypeScript: ✅ +30
- React: ✅ +30
- Next.js: ✅ +20
- GraphQL: ❌ +0
- Testing: ✅ +10
- Required satisfied: ✅
- Score: 90/100 = **90%** → above threshold, surfaces in recruiter feed

**Seeker B**: TypeScript intermediate (2y), React intermediate (2y), Next.js expert (3y), GraphQL advanced (2y), Testing beginner (0.5y)
- TypeScript: ✅ +30
- React: ❌ (intermediate < advanced) → required failed!
- Score: **0%** → filtered out completely

**Seeker C**: TypeScript advanced (3y), React advanced (3y), no Next.js, no GraphQL, no Testing
- TypeScript: ✅ +30
- React: ✅ +30
- Next.js: ❌ +0
- GraphQL: ❌ +0
- Testing: ❌ +0
- Required satisfied: ✅
- Score: 60/100 = **60%** → below threshold, doesn't surface

### Example 2: Strict large-company role, threshold 100%

**Job: "Zerspanungsmechaniker bei Großkonzern"**
- Criteria (illustrative — IT-only in MVP, but shows the principle):
  - CNC Programming (weight 40, min advanced, required)
  - Materialkunde (weight 30, min intermediate, required)
  - Qualitätsprüfung (weight 30, min intermediate, required)
- Threshold: 100%

Only candidates with all three skills at the required levels pass. Anyone missing one criterion gets either 0 (required failed) or below 100% (filtered by threshold). This is the "100% strict" big-company mode the founder envisioned.

## When match rows are created

A match row is inserted into `matches` when:

1. A new job is published (status changes to 'active') → compute scores for all seekers, insert rows where score ≥ threshold.
2. A new seeker profile is completed → compute scores against all active jobs, insert rows where score ≥ threshold.
3. A seeker updates their skills → recompute against all active jobs.
4. A job changes its criteria or threshold → recompute against all seekers.

These run in Edge Functions triggered by Postgres `LISTEN/NOTIFY` channels or by direct calls from the apps after the relevant mutation.

### Match creation function

```sql
create or replace function create_matches_for_job(p_job_id uuid)
returns int
language plpgsql
as $$
declare
  v_threshold int;
  v_count int := 0;
begin
  select match_threshold_pct into v_threshold from jobs where id = p_job_id;

  insert into matches (seeker_id, job_id, score_pct)
  select
    sp.profile_id,
    p_job_id,
    match_score(sp.profile_id, p_job_id) as score
  from seeker_profiles sp
  where match_score(sp.profile_id, p_job_id) >= v_threshold
  on conflict (seeker_id, job_id) do update
    set score_pct = excluded.score_pct;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
```

A similar function `create_matches_for_seeker(p_seeker_id uuid)` runs in the other direction.

## Performance budget

At MVP scale (10k profiles × 1k active jobs = 10M potential pairs):

- A single `match_score()` call: ~5ms with proper indexes (one indexed join, small criterion count per job).
- `create_matches_for_job` for one new job: scans 10k profiles × 5ms = 50 seconds worst case. Acceptable as an async Edge Function run, NOT acceptable inline in a request.
- `create_matches_for_seeker` for one new seeker: 1k jobs × 5ms = 5 seconds. Acceptable.

**Decision**: Match creation runs in Edge Functions, never inline. The mobile/admin app shows a "we're finding your matches" state for new jobs and new profiles. Real-time subscription on the `matches` table populates the feed as scores arrive.

## V1 extensions (post-MVP)

These are deliberately out of scope for MVP but documented so the schema supports them:

### Semantic skill matching with pgvector

When a job requires "React" but a seeker only listed "Preact", the V0 algorithm gives 0 credit. V1 fixes this:

- Each skill has an embedding (already in `skills.embedding`).
- For unmatched job criteria, find the seeker's closest skill via cosine similarity.
- If similarity > 0.85 and the seeker's level meets the minimum, award partial credit (e.g., 70% of the criterion weight).

This requires computing seeker and job "skill embeddings" by averaging or summing component embeddings. Reserved for V1.

### Distance and remote scoring

Currently, location and remote-ok are not part of the score. V1 adds:

- If job is on-site and seeker is outside search_radius_km, multiply score by 0.5.
- If job is remote-ok, no distance penalty.
- Bonus: seeker's remote_ok preference matches job's remote_ok = +5% score boost.

### Salary alignment

If job salary range and seeker expectation overlap: no change. If they don't overlap: multiply score by 0.7. Avoids wasting both sides' time on impossible deals.

### Anti-spam: throttling

A recruiter cannot post 1000 jobs to flood seeker feeds. V1: per-company job posting limits tied to subscription tier. MVP single-tier: max 20 active jobs per company.

## Testing strategy

The matching function is implemented twice:

1. **In Postgres** (`match_score`) — used in production.
2. **In TypeScript** (`packages/matching/`) — used in unit tests and shared with mobile/admin for client-side preview ("show me how this job would match me").

Both implementations are tested against a shared fixture set in `packages/matching/__tests__/fixtures.json`. The fixtures include the worked examples above plus edge cases:

- Empty criteria → score = 0 (avoid divide-by-zero)
- All required failed → score = 0
- Weights summing to non-100 → still works, normalizes correctly
- Seeker has skills not in criteria → ignored, no bonus
- Multiple skills at different levels → level comparison correct

CI runs both test suites. If they diverge, build fails.
