-- 0005_matching_functions.sql
-- Enable RLS on jobs/matches/messages/companies/job_criteria.
-- Add Postgres functions for the V1 matching algorithm
-- (skills 60% + location 20% + salary 10% + availability 10%).
-- Auto-approve trigger on matches for the dummy-recruiter simulation.

-- ============================================================================
-- RLS: jobs + job_criteria + companies (public read for active/pseudonym)
-- ============================================================================

alter table jobs enable row level security;

create policy select_active_jobs on jobs
  for select using (status = 'active');

alter table job_criteria enable row level security;

create policy select_criteria_of_active_jobs on job_criteria
  for select using (
    exists (
      select 1 from jobs j
      where j.id = job_criteria.job_id and j.status = 'active'
    )
  );

alter table companies enable row level security;

-- Seekers can read companies to render the pseudonym on job cards.
-- The display_name / logo_url reveal is a UI decision (only shown post-mutual-match),
-- not enforced at RLS level for MVP simplicity.
create policy select_all_companies on companies
  for select using (true);

-- ============================================================================
-- RLS: matches + messages (seeker-side; recruiter policies come with web admin)
-- ============================================================================

alter table matches enable row level security;

create policy select_own_matches on matches
  for select using (auth.uid() = seeker_id);

create policy update_own_matches on matches
  for update using (auth.uid() = seeker_id) with check (auth.uid() = seeker_id);

-- INSERT on matches is done by the matching function (SECURITY DEFINER).
-- No client-side insert policy needed.

alter table messages enable row level security;

-- Seeker can read messages of matches they own, and send messages as themselves.
create policy select_own_messages on messages
  for select using (
    exists (
      select 1 from matches m
      where m.id = messages.match_id and m.seeker_id = auth.uid()
    )
  );

create policy insert_own_messages on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from matches m
      where m.id = messages.match_id and m.seeker_id = auth.uid()
    )
  );

-- ============================================================================
-- Helper: level_rank maps proficiency_level enum to 1..4
-- ============================================================================

create or replace function public.level_rank(p_level proficiency_level)
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

-- ============================================================================
-- Helper: Haversine distance in kilometers
-- ============================================================================

create or replace function public.km_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns numeric
language sql
immutable
as $$
  select case
    when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null::numeric
    else round(
      (6371.0 * 2 * asin(
        sqrt(
          sin(radians((lat2 - lat1) / 2)) ^ 2
          + cos(radians(lat1)) * cos(radians(lat2))
            * sin(radians((lon2 - lon1) / 2)) ^ 2
        )
      ))::numeric,
      2
    )
  end;
$$;

-- ============================================================================
-- match_score V1: skills (60) + location (20) + salary (10) + availability (10).
-- Required skills act as a hard filter (returns 0 if any missing).
-- ============================================================================

create or replace function public.match_score(p_seeker_id uuid, p_job_id uuid)
returns int
language plpgsql
stable
as $$
declare
  v_total_weight int := 0;
  v_earned_weight int := 0;
  v_required_failed boolean := false;

  v_skill_score numeric := 0;
  v_location_score numeric := 0;
  v_salary_score numeric := 0;
  v_availability_score numeric := 0;

  v_seeker record;
  v_job record;
  v_distance numeric;
  v_days_until_available int;
begin
  -- 1. Skill overlap and required-skill hard filter
  select
    coalesce(sum(c.weight), 0),
    coalesce(sum(
      case
        when ss.skill_id is not null
         and public.level_rank(ss.level) >= public.level_rank(c.min_level)
        then c.weight
        else 0
      end
    ), 0),
    coalesce(bool_or(
      c.is_required
      and (ss.skill_id is null
           or public.level_rank(ss.level) < public.level_rank(c.min_level))
    ), false)
  into v_total_weight, v_earned_weight, v_required_failed
  from job_criteria c
  left join seeker_skills ss
    on ss.skill_id = c.skill_id
   and ss.profile_id = p_seeker_id
  where c.job_id = p_job_id;

  if v_required_failed then
    return 0;
  end if;

  if v_total_weight > 0 then
    v_skill_score := (v_earned_weight::numeric / v_total_weight) * 100;
  else
    -- No criteria at all: treat as full skill match.
    v_skill_score := 100;
  end if;

  -- 2. Seeker + job snapshot fields
  select
    sp.location_lat, sp.location_lon, sp.search_radius_km, sp.remote_ok,
    sp.salary_expectation_eur, sp.available_from
  into v_seeker
  from seeker_profiles sp
  where sp.profile_id = p_seeker_id;

  select
    j.location_lat, j.location_lon, j.remote_ok,
    j.salary_min_eur, j.salary_max_eur
  into v_job
  from jobs j
  where j.id = p_job_id;

  -- 3. Location score: full credit if either side allows remote or seeker within radius
  if v_job.remote_ok or v_seeker.remote_ok then
    v_location_score := 100;
  elsif v_seeker.location_lat is null or v_job.location_lat is null then
    v_location_score := 50;  -- unknown location: neutral
  else
    v_distance := public.km_distance(
      v_seeker.location_lat, v_seeker.location_lon,
      v_job.location_lat, v_job.location_lon
    );
    if v_distance is null then
      v_location_score := 50;
    elsif v_distance <= coalesce(v_seeker.search_radius_km, 50) then
      -- linear from 100 at 0 km to 60 at radius
      v_location_score := 100 - (v_distance / coalesce(v_seeker.search_radius_km, 50)) * 40;
    else
      v_location_score := 20;
    end if;
  end if;

  -- 4. Salary score: full credit inside job's range, decay towards the edges
  if v_seeker.salary_expectation_eur is null then
    v_salary_score := 80;  -- seeker did not commit, mildly positive
  elsif v_job.salary_min_eur is null and v_job.salary_max_eur is null then
    v_salary_score := 80;
  else
    if v_seeker.salary_expectation_eur between coalesce(v_job.salary_min_eur, 0)
                                          and coalesce(v_job.salary_max_eur, 999999)
    then
      v_salary_score := 100;
    elsif v_seeker.salary_expectation_eur < coalesce(v_job.salary_min_eur, 0) then
      -- seeker asks less than job's minimum: still a fit but conservative
      v_salary_score := 90;
    else
      -- seeker asks more than job's maximum: penalise proportionally
      declare
        gap numeric := v_seeker.salary_expectation_eur - v_job.salary_max_eur;
      begin
        v_salary_score := greatest(0, 100 - (gap / 100));
      end;
    end if;
  end if;

  -- 5. Availability score: 100 if already available, linear decay for future
  if v_seeker.available_from is null then
    v_availability_score := 80;  -- unknown: mildly positive
  else
    v_days_until_available := greatest(
      0,
      v_seeker.available_from - current_date
    );
    if v_days_until_available <= 90 then
      v_availability_score := 100;
    elsif v_days_until_available <= 180 then
      v_availability_score := 100 - (v_days_until_available - 90) * (40.0 / 90);
    else
      v_availability_score := 50;
    end if;
  end if;

  -- Weighted sum, clamped to 0..100
  return greatest(0, least(100, round(
    v_skill_score * 0.60
    + v_location_score * 0.20
    + v_salary_score * 0.10
    + v_availability_score * 0.10
  )::int));
end;
$$;

-- ============================================================================
-- create_matches_for_seeker: iterate active jobs, insert matches above threshold
-- ============================================================================

create or replace function public.create_matches_for_seeker(
  p_seeker_id uuid,
  p_limit int default 20
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  with candidate as (
    select
      j.id as job_id,
      j.match_threshold_pct,
      public.match_score(p_seeker_id, j.id) as score
    from jobs j
    where j.status = 'active'
  ),
  qualified as (
    select job_id, score
    from candidate
    where score >= match_threshold_pct
    order by score desc
    limit p_limit
  ),
  inserted as (
    insert into matches (seeker_id, job_id, score_pct)
    select p_seeker_id, job_id, score
    from qualified
    on conflict (seeker_id, job_id) do update
      set score_pct = excluded.score_pct
    returning 1
  )
  select count(*) into v_count from inserted;

  return v_count;
end;
$$;

-- ============================================================================
-- DEV-ONLY: auto-approve trigger on matches.
-- When a seeker likes a job, immediately mark the recruiter as also having
-- liked. This simulates the recruiter side while the web admin is not yet
-- implemented. Remove this trigger once real recruiters can decide.
-- ============================================================================

create or replace function public.auto_approve_recruiter_side()
returns trigger
language plpgsql
as $$
begin
  if NEW.seeker_decision = 'like' and NEW.recruiter_decision <> 'like' then
    NEW.recruiter_decision := 'like';
    NEW.recruiter_decided_at := now();
  end if;
  return NEW;
end;
$$;

drop trigger if exists dev_auto_approve_recruiter on matches;

create trigger dev_auto_approve_recruiter
  before update of seeker_decision on matches
  for each row execute function public.auto_approve_recruiter_side();
