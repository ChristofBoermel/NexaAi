# Feed + Chat Ende-zu-Ende Test

**Priorität:** P1
**Wer:** christof
**Status:** open
**Blockiert durch:** push-migration-0007

## Ziel
Kompletten Arbeitnehmer-Flow auf dem Handy durchspielen: Register → Onboarding → CV freigeben → Feed → Swipe → Match → Chat → Auto-Reply.

## Warum jetzt
Bevor wir am Recruiter-Web-Admin arbeiten, muss der Arbeitnehmer-Flow rund laufen.

## Scope
- Frisch registrierter oder existierender User mit approved CV
- Feed-Cards sollen erscheinen (Skills müssen zu einigen der 15 Handwerk-Jobs passen, sonst kein Match)
- Right-Swipe → Match-Notification (dank Auto-Approve-Trigger)
- Match-Screen → Chat öffnen
- Nachricht schreiben → Recruiter antwortet nach ~2s (Auto-Reply-Trigger)
- Auf Home hat User "Deine Matches öffnen" Button, öffnet Liste der Chats

## Akzeptanzkriterien
- [ ] Feed hat mindestens 3 Cards für einen Handwerker-User (SHK oder Elektro Skills)
- [ ] Match-Notification-Screen erscheint innerhalb 2s nach Right-Swipe
- [ ] Chat-Screen zeigt Company-Name, Job-Titel, empty state anfangs
- [ ] Nach Senden einer Message erscheint Auto-Reply
- [ ] Matches-Liste zeigt Latest-Message-Preview
- [ ] Unread-Badge verschwindet nach Öffnen des Chats

## Bekannte Risiken
- Wenn User nur IT-Skills gewählt hat, keine Matches → das ist kein Bug, sondern korrekter Algorithmus. Test-User braucht Handwerk-Skills.
- Realtime-Subscription kann durch Netzwerk-Wechsel unterbrochen werden. Nicht Blocker für V1.

## Follow-ups
Fehler dokumentieren in `docs/feedback.md` oder als neue Backlog-Items anlegen.
