# Dev-Trigger entfernen wenn Recruiter live sind

**Priorität:** P2
**Wer:** unassigned
**Status:** blocked

## Ziel
`dev_auto_approve_recruiter` und `dev_auto_reply_recruiter` Trigger entfernen, sobald echte Recruiter im System agieren.

## Warum
Die Trigger simulieren die Recruiter-Seite. Sobald echte Recruiter existieren, würden sie den Flow verzerren:
- Auto-Approve verhindert dass Recruiter tatsächlich freigeben
- Auto-Reply spammt Chats mit Fake-Messages

## Scope
- Migration 0010 (Nummer je nach Reihenfolge): `drop trigger`, `drop function`, `drop table dev_auto_replies`
- Dummy-Company löschen oder als "Test-Firma" markieren

## Akzeptanzkriterien
- [ ] Kein `dev_auto_approve_recruiter` in pg_trigger
- [ ] Kein `dev_auto_reply_recruiter` in pg_trigger
- [ ] Keine `dev_auto_replies` Tabelle
- [ ] Existierende matches mit fake recruiter_decision werden auf 'pending' zurückgesetzt oder gelöscht

## Blockiert durch
`recruiter-web-admin` — dieser Chunk kommt erst wenn echte Recruiter Freigaben machen können.
