# NexaAi Backlog

Dieser Ordner ist die Single-Source-of-Truth für alle offenen und erledigten
Arbeiten am Projekt. Jede AI (Claude, Codex, opencode, DeepSeek) liest die
Datei bevor sie mit neuer Arbeit anfängt, damit nichts doppelt gemacht wird
oder Bereiche kollidieren.

## Regeln

1. **Neuer Wunsch → neue `.md`** in diesem Ordner. Der Slug ist kebab-case,
   die Datei enthält:
   - **Ziel** (ein Satz)
   - **Warum jetzt / Begründung**
   - **Scope** (was ist drin, was ist raus)
   - **Betroffene Dateien / Bereiche**
   - **Akzeptanzkriterien** (Bulleted, testbar)
   - **Blockiert durch** (falls Abhängigkeit)
   - **Vorschlag Approach** (Kurzform, nicht der volle Plan)
   - **Wer** (`claude`, `codex`, `unassigned`)
   - **Priorität** (P0=blocker jetzt, P1=next-up, P2=soon, P3=someday)

2. **Diese README.md ist der Index.** Jede AI aktualisiert die Tabelle
   unten wenn sie eine `.md` neu anlegt, ihren Status ändert, oder eine
   Aufgabe abschließt.

3. **Fertige Aufgabe → move nach `done/`.** In dem File wird oben
   `Abgeschlossen: YYYY-MM-DD von <ai-name>` ergänzt plus Kurz-Notiz was
   umgesetzt wurde und Verweis auf den relevanten Commit.

4. **Konflikt-Vermeidung:** Bevor eine AI eine Aufgabe startet, ändert
   sie das `Wer` Feld auf ihren Namen und trägt in dieser README den
   Status auf `in-progress` ein. Kollidiert das mit einer anderen AI, ist
   die spätere Änderung ungültig.

## Aktueller Stand

| Priorität | Slug | Ziel | Wer | Status |
|-----------|------|------|-----|--------|
| P0 | [push-migration-0007](push-migration-0007.md) | Chat-Migration + FN-Deploy auf Dev-DB | claude | open |
| P1 | [feed-chat-e2e-test](feed-chat-e2e-test.md) | Ende-zu-Ende-Test Feed → Match → Chat auf Handy | christof | open |
| P1 | [sentry-error-tracking](sentry-error-tracking.md) | Crashes vom Handy an Sentry senden | unassigned | open |
| P1 | [cv-pdf-export](cv-pdf-export.md) | User kann CV als PDF exportieren | unassigned | open |
| P1 | [push-notifications](push-notifications.md) | Push für neue Matches und Chat-Messages | unassigned | open |
| P2 | [recruiter-web-admin](recruiter-web-admin.md) | Company-Onboarding und Job-Erstellung im Admin | unassigned | open |
| P2 | [remove-dev-triggers](remove-dev-triggers.md) | dev_auto_approve + dev_auto_reply raus wenn Recruiter live | unassigned | blocked |
| P2 | [posthog-analytics](posthog-analytics.md) | Funnel-Tracking nach Consent-Screen | unassigned | open |
| P3 | [cv-upload-parse](cv-upload-parse.md) | PDF-Upload + DeepSeek-Parse als Alternative zum Wizard | unassigned | open |
| P3 | [smtp-domain-verify](smtp-domain-verify.md) | Resend-Domain verifizieren, Password-Reset E2E fixen | unassigned | blocked |
| P3 | [phone-verification](phone-verification.md) | Handy-Nummer-Bestätigung wie Indeed/StepStone | unassigned | open |

## Erledigt

Wenn eine Aufgabe fertig ist, wird die Zeile hier oben entfernt und die
Datei nach `done/` verschoben. Der Verweis auf die Erledigung findet sich
dann dort.

Übersicht der bereits erledigten Aufgaben liegt im `done/README.md`.
