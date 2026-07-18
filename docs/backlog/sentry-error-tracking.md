# Sentry Error-Tracking

**Priorität:** P1
**Wer:** codex
**Status:** in-progress

## Ziel
Crashes und unerwartete Fehler vom Mobile-Client an Sentry senden, damit wir bei User-Tests wissen was schiefgeht.

## Warum jetzt
Bevor wir echte Nutzer testen lassen, brauchen wir Sichtbarkeit auf Client-Fehler. Ohne Sentry sehen wir nur was Christof selbst reproduziert.

## Scope
- Sentry Free-Tier Account anlegen, Projekt "nexaai-mobile" erstellen, DSN holen
- `@sentry/react-native` installieren
- Sentry-Init in `apps/mobile/src/app/_layout.tsx` vor SessionProvider
- DSN aus `EXPO_PUBLIC_SENTRY_DSN` env
- `.env.example` erweitern
- Test-Crash-Button in Dev-Menu (nur wenn `__DEV__`)
- EAS-Rebuild triggern und neuen APK-Link generieren

## Betroffene Dateien
- `apps/mobile/package.json` (neue Deps)
- `apps/mobile/src/app/_layout.tsx` (init)
- `apps/mobile/src/lib/sentry.ts` (neue Datei mit Wrapper)
- `apps/mobile/src/components/ui/error-boundary.tsx` (fehler an Sentry weiterreichen)
- `.env.example`

## Akzeptanzkriterien
- [ ] `EXPO_PUBLIC_SENTRY_DSN` in `.env.example` dokumentiert
- [ ] Sentry-Init im Root-Layout vor SessionProvider
- [ ] Ein absichtlicher Crash landet im Sentry-Dashboard
- [ ] ErrorBoundary meldet Fehler an Sentry statt nur `console.warn`
- [ ] EAS-Rebuild fertig, neuer APK-Link im HANDOFF.md

## Grenzen
- Kein Performance-Monitoring, kein Session-Replay (Free-Tier)
- DSGVO-Fussnote in `docs/dsgvo.md` ergänzen, was gesendet wird
