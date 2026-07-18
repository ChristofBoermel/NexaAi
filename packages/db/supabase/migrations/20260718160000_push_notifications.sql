-- 0008_push_notifications.sql
-- Push tokens, delivery audit, and async database webhooks for notification fanout.

create extension if not exists pg_net with schema extensions;

create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  enabled boolean not null default true,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index push_tokens_profile_enabled on push_tokens(profile_id)
  where enabled = true and revoked_at is null;

create table notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  target_profile_id uuid not null references profiles(id) on delete cascade,
  push_token_id uuid references push_tokens(id) on delete set null,
  event_kind text not null check (event_kind in ('match', 'message')),
  related_match_id uuid references matches(id) on delete cascade,
  expo_ticket_id text,
  status text not null,
  error_code text,
  created_at timestamptz not null default now()
);

create index notification_deliveries_target_recent
  on notification_deliveries(target_profile_id, created_at desc);

alter table push_tokens enable row level security;
alter table notification_deliveries enable row level security;

-- Users can read their own device tokens to show notification state in app settings.
create policy select_own_push_tokens on push_tokens
  for select using (auth.uid() = profile_id);

-- Users can register only tokens attached to their own profile, never for another user.
create policy insert_own_push_tokens on push_tokens
  for insert with check (auth.uid() = profile_id);

-- Users can update only their own tokens, mainly to refresh last_seen_at or revoke a device.
create policy update_own_push_tokens on push_tokens
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Delivery rows are operational logs. Users may read only their own delivery status.
create policy select_own_notification_deliveries on notification_deliveries
  for select using (auth.uid() = target_profile_id);

create or replace function public.enqueue_match_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text := current_setting('app.settings.supabase_url', true);
  v_secret text := current_setting('app.settings.function_webhook_secret', true);
begin
  if NEW.is_mutual is not true or coalesce(OLD.is_mutual, false) is true then
    return NEW;
  end if;

  if coalesce(v_url, '') = '' then
    return NEW;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nexaai-webhook-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object(
      'type', 'match',
      'matchId', NEW.id,
      'targetProfileId', NEW.seeker_id
    )
  );

  return NEW;
end;
$$;

drop trigger if exists notify_mutual_match on matches;

create trigger notify_mutual_match
  after update on matches
  for each row execute function public.enqueue_match_notification();

create or replace function public.enqueue_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text := current_setting('app.settings.supabase_url', true);
  v_secret text := current_setting('app.settings.function_webhook_secret', true);
  v_match record;
  v_target_profile_id uuid;
begin
  select m.id, m.seeker_id, j.created_by as recruiter_id
  into v_match
  from matches m
  join jobs j on j.id = m.job_id
  where m.id = NEW.match_id and m.is_mutual = true;

  if v_match.id is null then
    return NEW;
  end if;

  if NEW.sender_id = v_match.seeker_id then
    v_target_profile_id := v_match.recruiter_id;
  else
    v_target_profile_id := v_match.seeker_id;
  end if;

  if v_target_profile_id is null or v_target_profile_id = NEW.sender_id then
    return NEW;
  end if;

  if coalesce(v_url, '') = '' then
    return NEW;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nexaai-webhook-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object(
      'type', 'message',
      'matchId', NEW.match_id,
      'messageId', NEW.id,
      'senderId', NEW.sender_id,
      'targetProfileId', v_target_profile_id
    )
  );

  return NEW;
end;
$$;

drop trigger if exists notify_chat_message on messages;

create trigger notify_chat_message
  after insert on messages
  for each row execute function public.enqueue_message_notification();
