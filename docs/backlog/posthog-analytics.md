# PostHog Analytics

**Priorität:** P2
**Wer:** unassigned
**Status:** open

## Ziel
Funnel-Tracking für Onboarding und Feed-Conversion, damit wir sehen wo User abspringen.

## Warum jetzt
Ohne Analytics ist "was funktioniert" reines Bauchgefühl. Wichtig für Product-Market-Fit.

## Scope
- PostHog EU Cloud Account (DSGVO-tauglich)
- `posthog-react-native` installieren
- Consent-Screen im Onboarding: "Analytics-Cookies akzeptieren?"
- Events instrumentieren:
  - `signup_completed`
  - `onboarding_step_completed` mit step-name
  - `cv_approved`
  - `feed_swipe_left`, `feed_swipe_right`
  - `match_created`, `chat_opened`, `message_sent`
- User-Property: `role` (seeker/recruiter), `industry` (aus jobTitle abgeleitet später)

## Betroffene Dateien
- `apps/mobile/package.json`
- `apps/mobile/src/lib/analytics.ts` (neue Datei mit PostHog-Wrapper + consent-check)
- `apps/mobile/src/app/(app)/onboarding/consent.tsx` (neuer Step)
- Alle Screens die Events feuern sollen

## Akzeptanzkriterien
- [ ] Analytics läuft NUR wenn User consented
- [ ] Alle Events landen in PostHog EU Dashboard
- [ ] User kann Consent in Settings zurückziehen
- [ ] DSGVO-Text in `docs/dsgvo.md` ergänzt

## Grenzen
- Kein Session-Replay in V1
- Kein Cross-Device-Tracking (nur ein Device per user)
