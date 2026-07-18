-- 0012_reapply_vault_triggers.sql
-- Repair: migration 0008 (push_notifications) has an earlier timestamp in the
-- supabase folder than 0009 (notify_trigger_vault), so 0008 executed after
-- 0009 and reverted the two notify functions to the app.settings.* variant
-- which cannot be populated on hosted Supabase. Reapply the vault-backed
-- versions so both triggers actually reach the notify Edge Function.

create extension if not exists supabase_vault with schema vault;

create or replace function public.enqueue_match_notification()
returns trigger
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_url text;
  v_secret text;
begin
  if NEW.is_mutual is not true or coalesce(OLD.is_mutual, false) is true then
    return NEW;
  end if;

  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'nexaai_supabase_url'
  limit 1;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'nexaai_function_webhook_secret'
  limit 1;

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

create or replace function public.enqueue_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_url text;
  v_secret text;
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

  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'nexaai_supabase_url'
  limit 1;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'nexaai_function_webhook_secret'
  limit 1;

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
