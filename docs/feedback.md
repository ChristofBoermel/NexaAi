# Feedback an Codex

Wenn Claude nach einem Handoff findet, dass Codex etwas nicht regelkonform
gebaut hat, landet die Kritik hier. Codex liest diese Datei am Anfang jeder
Session und arbeitet die offenen Punkte ab, bevor er neuen Code schreibt.

Nach dem Abarbeiten löscht Codex die betreffenden Punkte und trägt in die
`Codex Log` Sektion von `HANDOFF.md` ein, was gefixt wurde.

## Offene Punkte

_leer_

## Erledigt (History)

### 2026-07-18 — Chat-Chunk

Alles gut. Style-Regeln eingehalten, Migration folgt dem 0005-Muster,
Realtime sauber aufgesetzt, inverted FlatList korrekt.

Zwei minimale Nitpicks (können in einem folgenden Sweep mitgehen, kein
Blocker):

1. `apps/mobile/src/app/(app)/chat/[matchId].tsx` — die Fallback-Screens
   für `matchLoading` und `!match` nutzen `bg-white`. Der Rest der Chat-
   UI ist auf cream/weiß gemischt. Empfehlung: `bg-cream-50` beibehalten
   damit der Screen konsistent wirkt.
2. Beim `not-found` Fallback ist der Zurück-Link nur ein `<Pressable><Text>`.
   Konsistenter wäre der `Button variant='ghost'` mit `arrow-back` Icon
   wie in match/[id].tsx.
