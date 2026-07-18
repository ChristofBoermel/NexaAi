# CV-Upload und AI-Parse

**Priorität:** P3
**Wer:** unassigned
**Status:** open

## Ziel
User kann eine bestehende CV-PDF hochladen, DeepSeek extrahiert die Felder und pre-fillt den Onboarding-Wizard.

## Warum jetzt
Wer schon einen CV hat, will nicht 15 Felder abtippen. Beschleunigt das Onboarding.

## Scope
- `expo-document-picker` installieren
- Upload zu Supabase-Storage Bucket `raw-cvs` (nur der User sieht seine eigenen Uploads)
- Edge Function `parse-cv`: nimmt Storage-Path, extrahiert Text via PDF-lib, sendet an DeepSeek mit strukturiertem JSON-Prompt
- Response mapped auf `basicsSchema` + `workExperienceSchema[]` + `educationSchema[]`
- User reviewed die vorgeschlagenen Werte im Wizard, kann korrigieren

## Betroffene Dateien
- `apps/mobile/package.json`
- `apps/mobile/src/app/(app)/onboarding/upload.tsx` (neuer optionaler Step)
- Migration 0011: `raw-cvs` Bucket + RLS
- Edge Function `parse-cv/index.ts`
- `packages/prompts/src/cv-parsing.ts` (neuer Prompt)

## Akzeptanzkriterien
- [ ] Upload akzeptiert nur PDFs bis 5 MB
- [ ] Parse liefert Felder mit >70% Genauigkeit auf den beiden Beispiel-PDFs (docs/example_docs)
- [ ] User kann alle Felder editieren bevor speichern
- [ ] Bei Parse-Fehler fällt der Flow auf den normalen Wizard zurück

## Grenzen
- Nur DE-Sprache
- Kein OCR für Scans (nur echte PDFs mit Textlayer)
- Cost-Limit: max 1 Parse pro User pro Tag (Anti-Abuse)
