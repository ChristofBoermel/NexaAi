-- 0011_raw_cvs.sql
-- Private raw CV uploads for one-per-day AI parsing drafts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('raw-cvs', 'raw-cvs', false, 5242880, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf'];

create table raw_cv_uploads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null unique,
  parsed_at timestamptz,
  created_at timestamptz not null default now(),
  check (storage_path = profile_id::text || '/' || id::text || '.pdf')
);

create index raw_cv_uploads_profile_recent on raw_cv_uploads(profile_id, created_at desc);

alter table raw_cv_uploads enable row level security;

-- Users can see their own upload metadata to resume a parse flow after upload.
create policy select_own_raw_cv_uploads on raw_cv_uploads
  for select using (auth.uid() = profile_id);

-- Users can create only upload metadata for their own profile and generated path.
create policy insert_own_raw_cv_uploads on raw_cv_uploads
  for insert with check (auth.uid() = profile_id);

-- Users can update only their own upload metadata, currently parsed_at after a parse.
create policy update_own_raw_cv_uploads on raw_cv_uploads
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Storage objects are private: users can read only files in their own folder.
create policy select_own_raw_cv_objects on storage.objects
  for select using (
    bucket_id = 'raw-cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage uploads are private and constrained to a generated user folder path.
create policy insert_own_raw_cv_objects on storage.objects
  for insert with check (
    bucket_id = 'raw-cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
    and lower(storage.extension(name)) = 'pdf'
  );

-- Storage updates are limited to the owning user so retries cannot replace another CV.
create policy update_own_raw_cv_objects on storage.objects
  for update using (
    bucket_id = 'raw-cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'raw-cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
    and lower(storage.extension(name)) = 'pdf'
  );
