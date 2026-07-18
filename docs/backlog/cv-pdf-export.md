# CV als PDF exportieren

**Priorität:** P1
**Wer:** unassigned
**Status:** open

## Ziel
User kann seinen freigegebenen CV als PDF speichern und teilen.

## Warum jetzt
Für Bewerbungen ausserhalb der App will der User seinen strukturierten CV weiternutzen. Aktuell existiert er nur in der App.

## Scope
- `expo-print` installieren
- HTML-Template das dem `CvView` visuell entspricht (Header + Berufserfahrung + Ausbildung + Skills)
- Rendering in `apps/mobile/src/lib/cv-pdf.ts` via `Print.printToFileAsync`
- Button "Als PDF exportieren" auf Home unter dem CV
- Share via `expo-sharing`

## Betroffene Dateien
- `apps/mobile/package.json`
- `apps/mobile/src/lib/cv-pdf.ts` (neue Datei)
- `apps/mobile/src/app/(app)/index.tsx` (Share-Button)
- Falls nötig neue `apps/mobile/src/components/cv/cv-html.ts` mit dem HTML-Template

## Akzeptanzkriterien
- [ ] Button erzeugt eine gültige PDF-Datei auf dem Handy
- [ ] PDF hat die gleichen Sektionen wie `CvView`: Kopf, Berufserfahrung, Ausbildung, Skills
- [ ] Vorname sichtbar, Nachname NICHT (Privacy)
- [ ] Share-Dialog öffnet sich mit sinnvollem Dateinamen (`NexaAi_CV_<vorname>.pdf`)
- [ ] Keine Fonts fehlen im PDF

## Grenzen
- Kein Server-side-PDF (das kommt später wenn wir Preview für Recruiter machen)
- Kein Multi-Language, nur Deutsch
