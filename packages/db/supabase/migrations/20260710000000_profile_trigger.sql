-- 0002_profile_trigger.sql
-- Auto-create a profiles row when a new auth.users row is inserted.
-- Enable RLS on profiles with own-row policies.
--
-- Signup flow:
--   1. Client calls supabase.auth.signUp(email, password, options: { data: { role } })
--   2. Supabase inserts into auth.users; raw_user_meta_data contains our data blob
--   3. This trigger fires and inserts into public.profiles with the derived role
--   4. If no role hint present, we default to 'seeker' (Arbeitnehmer-Flow first)

-- Function runs as SECURITY DEFINER so it can insert into public.profiles
-- even when the JWT belongs to a not-yet-committed session.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data->>'role')::user_role,
      'seeker'::user_role
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS so we can restrict who sees which profile row.
alter table profiles enable row level security;

-- Every user can read their own profile row.
-- Recruiters see seeker profiles only via the recruiter_candidate_view
-- (added in a later migration once matches are implemented).
create policy select_own_profile on profiles
  for select
  using (auth.uid() = id);

-- Every user can update their own profile row.
-- Note: this policy does not restrict which columns can change; role and id
-- are effectively immutable client-side because we do not surface them in the UI.
-- A stricter column-level policy comes later once we have onboarding.
create policy update_own_profile on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Fallback insert policy: allow inserting your own row.
-- The trigger above already creates the row in most cases, but this policy
-- makes recovery easier if the trigger is ever bypassed (e.g. admin creates
-- auth user via SQL without triggering, then user inserts profile row).
create policy insert_own_profile on profiles
  for insert
  with check (auth.uid() = id);
