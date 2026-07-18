-- 0007_chat.sql
-- Enable realtime chat and add the dev-only recruiter auto-reply.

-- ============================================================================
-- Realtime
-- ============================================================================

alter publication supabase_realtime add table messages;

-- ============================================================================
-- RLS: seekers can mark recruiter messages as read in their own matches.
-- ============================================================================

-- Seekers may update unread recruiter messages in their own matches so the app
-- can mark conversations as read. They cannot update their own sent messages
-- through this policy.
create policy update_own_messages on messages
  for update using (
    sender_id <> auth.uid()
    and exists (
      select 1 from matches m
      where m.id = messages.match_id and m.seeker_id = auth.uid()
    )
  ) with check (
    sender_id <> auth.uid()
    and exists (
      select 1 from matches m
      where m.id = messages.match_id and m.seeker_id = auth.uid()
    )
  );

-- ============================================================================
-- DEV-ONLY: deterministic recruiter replies.
-- Simulates the recruiter side until the web admin exists.
-- ============================================================================

create table dev_auto_replies (
  id int primary key,
  body text not null
);

insert into dev_auto_replies (id, body) values
  (1, 'Danke für deine Nachricht. Ich schaue mir dein Profil direkt an.'),
  (2, 'Klingt gut. Welche Starttermine würden für dich passen?'),
  (3, 'Sehr spannend. Hast du diese Woche Zeit für ein kurzes Gespräch?'),
  (4, 'Danke dir. Ich melde mich gleich mit einem konkreten Vorschlag.')
on conflict (id) do update set body = excluded.body;

create or replace function public.dev_auto_reply_recruiter_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seeker_id uuid;
  v_reply_body text;
  v_reply_count int;
begin
  select m.seeker_id
  into v_seeker_id
  from matches m
  where m.id = NEW.match_id and m.is_mutual = true;

  if v_seeker_id is null or NEW.sender_id <> v_seeker_id then
    return NEW;
  end if;

  select count(*)
  into v_reply_count
  from messages msg
  where msg.match_id = NEW.match_id
    and msg.sender_id = '00000000-0000-0000-0000-000000000010';

  select r.body
  into v_reply_body
  from dev_auto_replies r
  where r.id = (v_reply_count % 4) + 1;

  insert into messages (match_id, sender_id, body, created_at)
  values (
    NEW.match_id,
    '00000000-0000-0000-0000-000000000010',
    v_reply_body,
    now() + interval '2 seconds'
  );

  return NEW;
end;
$$;

drop trigger if exists dev_auto_reply_recruiter on messages;

create trigger dev_auto_reply_recruiter
  after insert on messages
  for each row execute function public.dev_auto_reply_recruiter_message();
