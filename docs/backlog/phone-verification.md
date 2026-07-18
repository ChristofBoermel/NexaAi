# Handy-Nummer-Verifikation

**Priorität:** P3
**Wer:** unassigned
**Status:** open

## Ziel
Zusätzlich zur Email-Bestätigung auch Handy-Nummer verifizieren, wie Indeed und StepStone.

## Warum
Reduziert Fake-Accounts und ermöglicht später SMS-basierte Interaktion (Match-Notification, 2FA).

## Scope
- Handy-Feld in `registerSchema` und `basicsSchema` hinzufügen
- Supabase Phone-Auth aktivieren (Dashboard)
- SMS-Provider via Supabase Twilio-Integration
- OTP-Screen im Auth-Flow: nach Email-Confirm kommt "Bestätige deine Handy-Nummer"
- Deep-Link für SMS-Link mit Code

## Betroffene Dateien
- `packages/types/src/auth.ts` (Schema erweitern)
- `apps/mobile/src/app/(auth)/verify-phone.tsx` (neuer Screen)
- Migration mit neuem `phone_verified_at` in profiles

## Akzeptanzkriterien
- [ ] User gibt Handy-Nummer ein
- [ ] SMS mit 6-stelligem Code kommt an
- [ ] Nach Eingabe wird `phone_verified_at` gesetzt
- [ ] Nicht-verifizierte User können Onboarding nicht abschliessen

## Grenzen
- Nur DE-Nummern in V1
- Twilio-Kosten pro SMS (~0.05 EUR) — Cost-Limit setzen

## Referenz
`docs/memory/project-phone-verification.md`
