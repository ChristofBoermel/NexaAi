# Push-Notifications

**Priorität:** P1
**Wer:** unassigned
**Status:** open

## Ziel
Push-Notification bei neuem Mutual-Match und bei neuer Chat-Message, damit der User nicht die App offen haben muss.

## Warum jetzt
Ohne Push muss der User selbst reinschauen. Retention leidet.

## Scope
- `expo-notifications` installieren
- FCM-Setup für Android (kostenlos), APNS-Key von Apple Developer Portal für iOS (später)
- Push-Token beim Signup registrieren, in neuer Tabelle `push_tokens (profile_id, token, platform, created_at)` speichern (Migration 0008)
- Edge-Function `notify` die auf `matches UPDATE` und `messages INSERT` triggert, ruft Expo Push API
- Deep-Link von Notification: Match → `/(app)/match/[id]`, Message → `/(app)/chat/[matchId]`
- Consent-Screen im Onboarding: "Willst du Benachrichtigungen erlauben?"

## Betroffene Dateien
- `apps/mobile/package.json`
- `apps/mobile/src/lib/push.ts` (neue Datei)
- `apps/mobile/src/app/(app)/onboarding/notifications.tsx` (neuer Wizard-Step)
- Migration 0008: `push_tokens` Tabelle + RLS
- Edge Function `notify/index.ts`

## Akzeptanzkriterien
- [ ] User registriert sich, Token wird in `push_tokens` gespeichert
- [ ] Neues Mutual-Match generiert Push mit Company-Name
- [ ] Neue Message generiert Push mit Preview
- [ ] Tap auf Push öffnet richtigen Screen
- [ ] Push-Consent kann in Settings zurückgezogen werden

## Grenzen
- Nur Android für V1 (iOS braucht Apple-Developer-Account)
- Kein Rich-Notification (Buttons, Images)
- Anti-Spam-Throttling: maximal 5 Pushes pro User pro Stunde

## Abhängigkeiten
- EAS-Rebuild
- Google Firebase Console Zugang (Christof)
