# Push Migration 0007 + Function-Deploy

**Priorität:** P0
**Wer:** claude
**Status:** open
**Blockiert durch:** —

## Ziel
Chat-Migration in die Dev-DB pushen, damit der Realtime-Chat funktioniert.

## Warum jetzt
Codex hat den ganzen Chat-Stack gebaut. Ohne die Migration in der DB ist der Chat nicht testbar.

## Scope
- Copy `packages/db/migrations/0007_chat.sql` → `packages/db/supabase/migrations/YYYYMMDDHHMMSS_chat.sql`
- Dry-run
- Apply
- Verify: `messages` in `supabase_realtime` publication, `dev_auto_replies` mit 4 Zeilen, `dev_auto_reply_recruiter` Trigger vorhanden

## Betroffene Dateien
- `packages/db/migrations/0007_chat.sql` (schon geschrieben)
- `packages/db/supabase/migrations/*_chat.sql` (Copy anlegen)

## Akzeptanzkriterien
- [ ] Migration erfolgreich applied
- [ ] `supabase db query --linked "select tablename from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages';"` liefert eine Zeile
- [ ] `supabase db query --linked "select count(*) from dev_auto_replies;"` = 4
- [ ] `supabase db query --linked "select tgname from pg_trigger where tgname = 'dev_auto_reply_recruiter';"` liefert eine Zeile
- [ ] Kein Function-Deploy nötig (der Chat nutzt keine Edge Function)

## Approach
Standard `supabase db push --yes` nach Copy. Christof's OK vor Push holen falls Auto-Classifier blockt.

## Follow-ups nach Erledigung
- Feed-Chat-E2E-Test kann starten
- Datei nach `done/` verschieben
