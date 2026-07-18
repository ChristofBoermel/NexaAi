# Resend Domain verifizieren

**Priorität:** P3
**Wer:** unassigned
**Status:** blocked

## Ziel
Eigene Domain (z. B. `nexaai.de`) bei Resend verifizieren, damit Password-Reset und Signup-Confirm-Emails an beliebige Empfänger gesendet werden können.

## Warum
Aktuell darf Resend im Free-Tier nur an Christofs Signup-Email senden. Blockiert Password-Reset für alle anderen User.

## Scope
- Domain bei Resend hinzufügen
- 3-4 DNS-Records setzen (SPF, DKIM, MX) beim Domain-Provider
- Warten auf Verifikation (bis 30 Min)
- Supabase SMTP-Sender-Email auf `noreply@nexaai.de` ändern
- E2E-Test Password-Reset für einen Test-User der nicht Christofs Signup-Email nutzt

## Betroffene Dateien
- Keine im Repo — nur DNS und Supabase-Dashboard-Config

## Akzeptanzkriterien
- [ ] Domain im Resend Dashboard als "verified" markiert
- [ ] Test-Recovery-Email für `test@example.com` kommt an
- [ ] Deep-Link `nexaai://reset-callback` funktioniert wie geplant
- [ ] Signup-Confirm-Email kommt an, Deep-Link öffnet App

## Blockiert durch
Domain muss existieren. Christof besitzt aktuell nur `matsbusiness.co.site`. Kaufentscheidung `nexaai.de` steht aus.

## Referenz
`docs/memory/project-smtp-domain-parked.md` beschreibt den Kontext.
