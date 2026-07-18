# Erledigte Backlog-Items

Wenn eine Aufgabe in `docs/backlog/*.md` abgeschlossen ist, wird die Datei
hierher verschoben und in dieser README verlinkt.

Format:
```
- YYYY-MM-DD [Slug](slug.md) — von <ai-name>, Commit <sha> — Kurz-Notiz
```

## Historie

- 2026-07-19 [push-notifications](push-notifications.md) — von codex+claude — Migration 0008 + Vault-basierte Trigger (0012), notify Edge Function, Expo Push, Consent-Screen. Match-Push und Chat-Push am Handy verifiziert.
- 2026-07-19 [sentry-error-tracking](sentry-error-tracking.md) — von codex+claude — @sentry/react-native Wrapper mit PII-Scrubbing, DSN via EXPO_PUBLIC-Env, Dev-Crash-Button. Event im Sentry-Dashboard verifiziert.
- 2026-07-18 [push-migration-0007](push-migration-0007.md) — von claude — Chat-Migration in Dev-DB applied, Realtime auf messages aktiviert, dev_auto_reply_recruiter Trigger + 4 Auto-Replies verifiziert.

Der Fortschritt vor Einführung dieses Systems steht in den commits
(siehe `git log`) und in den Skills unter `~/.claude/projects/-home-senseless-Projects-NexaAi/memory/`.
