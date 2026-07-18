# Handoff an Codex

Diese Datei wird verwendet, wenn Claude sich seinem Usage-Limit nähert. Codex übernimmt die aktuelle Arbeit, damit Christof nicht warten muss, und dokumentiert am Ende in der Sektion **Codex Log** was passiert ist, damit Claude beim Zurückkommen effizient reviewen kann.

## Aktueller Kontext

**Session-Datum:** 2026-07-18
**Approved Plan-File:** `~/.claude/plans/einen-anderen-step-im-composed-quasar.md` (heißt zwar so, ist aber der Feed+Match-Plan).
**Aktueller Milestone:** Arbeitnehmer-Flow bis Feed + Match-Detection Ende-zu-Ende funktional. Alle Migrations (0001–0006) sind auf Dev-DB, matching Edge Function deployed. Christof testet den Flow gleich auf dem Handy.

**Nächster großer Chunk (der jetzt Codex machen soll):** Chat (Realtime-Messaging zwischen Seeker und Recruiter-Simulation).

## Was Claude in dieser Session gemacht hat

Grob-Chronologie:
- Migration 0005: RLS auf jobs/matches/messages/companies/job_criteria; Postgres-Functions `level_rank`, `km_distance`, `match_score` (V1 mit skills 60 % + location 20 % + salary 10 % + availability 10 %), `create_matches_for_seeker`; Dev-only `dev_auto_approve_recruiter` Trigger. **Applied.**
- Migration 0006: Dummy Company + Dummy-Recruiter-Profile + 15 Handwerk-Jobs + `job_criteria`. Session-replication-role wird auf `replica` gesetzt, damit die FK profiles.id -> auth.users(id) für den Dummy-Recruiter nicht zieht. **Applied.**
- Matching Edge Function (`packages/db/supabase/functions/matching/index.ts`): authenticated caller, ruft `create_matches_for_seeker` RPC, gibt `{ createdCount }` zurück. **Deployed.**
- `apps/mobile/src/lib/jobs.ts`: Data-Access-Layer mit `useOpenMatches`, `useMatchDetail`, `runMatchmaking`, `setSeekerDecision`, `useMutualMatchListener` (Realtime auf matches WHERE is_mutual UPDATE für seeker_id).
- Routes: `(app)/search.tsx` (Loading-Screen, 1.5 s Minimum), `(app)/feed.tsx` (react-native-deck-swiper), `(app)/match/[id].tsx` (Match-Notification).
- Feed-Komponenten unter `apps/mobile/src/components/feed/`: `job-card.tsx`, `job-detail-modal.tsx`, `empty-feed.tsx`.
- Home-Update: neue Primary-Buttons "Job-Feed öffnen" + "CV bearbeiten" ghost + "Abmelden" ghost.
- Preview-Screen: `approveCv` navigiert jetzt zu `/(app)/search` statt `/(app)`.
- Editorial-Design-Refactor (imagegen-mobile Skill): Login/Register/Feed/Match/EmptyFeed bekommen cream-Backdrop, caption + display Typo-Variants, Nexa-Navy als Akzent, keine fintech-Pill-Muster.
- Bug-Fixes: `FormScroll` mit `automaticallyAdjustKeyboardInsets`, Modals mit `paddingBottom: 240`, `Autocomplete` FlatList → `.map()` (VirtualizedList-Warning weg), Privacy-Hinweis in `basics.tsx`.

## Was Codex jetzt übernehmen soll (Chat-Chunk)

**Ziel:** Realtime-Chat zwischen Seeker und Recruiter-Sim so bauen, dass er nach einem Mutual-Match direkt öffenbar ist. Recruiter-Antworten simulieren wir mit einem Dev-Only-Trigger (siehe unten), bis der Web-Admin da ist.

**Umfang:**

1. **Migration 0007** (`packages/db/migrations/0007_chat.sql`):
   - Realtime auf `messages` erlauben: `alter publication supabase_realtime add table messages;`
   - Zusätzliche RLS-Policy `update_own_messages` (für `read_at` markieren; SELECT/INSERT sind schon in 0005)
   - Dev-only Trigger `dev_auto_reply_recruiter`: wenn ein Seeker-Message ankommt (sender_id = matches.seeker_id des Matches), erzeugt der Trigger ~2 Sekunden später eine kurze scripted Antwort vom Dummy-Recruiter (00000000-0000-0000-0000-000000000010). Implementierung als `after insert on messages for each row` mit `pg_notify` oder simpel: ein zweites Insert direkt im selben Trigger (mit deterministischer Antwort aus einer kleinen Tabelle `dev_auto_replies`).
   - Auch bypass mit session_replication_role wenn nötig (siehe Muster in 0006)
   - **Nicht pushen** — Claude reviewt und pusht.

2. **Zod-Schema** in `packages/types/src/messaging.ts`:
   - `sendMessageSchema` mit `body: z.string().min(1, 'Nachricht darf nicht leer sein').max(2000)`
   - Re-export aus `packages/types/src/index.ts`

3. **Data-Access** in `apps/mobile/src/lib/chat.ts`:
   - Row-Typ `MessageRow`: id, match_id, sender_id, body, read_at, created_at
   - `useMatches(kind: 'mutual')` Hook: alle matches wo `is_mutual = true and seeker_id = auth.uid()`, joined mit job + company
   - `useMessages(matchId)` Hook: fetch alle Messages sortiert nach created_at, plus Realtime-Subscribe auf `postgres_changes INSERT` filter `match_id=eq.<matchId>`. Append neue Rows lokal ohne refetch.
   - `sendMessage(matchId, body)` Mutation: insert in messages, `sender_id: auth.uid()`
   - `markRead(messageIds: string[])`: bulk update `read_at = now()` wo id in list and `read_at is null` und sender_id ≠ auth.uid()

4. **Screens/Routes:**
   - `apps/mobile/src/app/(app)/matches.tsx` — Liste aller Mutual-Matches, tap führt zu Chat.
     - Header: caption "Deine Matches" + display "Wer will mit dir sprechen"
     - List Item: Company display_name, Job-Titel, letzter Message-Preview (optional), unread-Badge
     - Empty-State: caption + display + muted + Link zu Feed
   - `apps/mobile/src/app/(app)/chat/[matchId].tsx` — Chat-Screen.
     - Header: LogoMark klein + Company display_name + Job-Titel
     - Message-Liste (FlatList inverted, damit neueste unten und Scroll intuitiv), Bubbles mit unterschiedlichen bg (seeker: brand-800 rechts, recruiter: cream-100 links). Zeit-Timestamp klein drunter.
     - Composer unten: `TextInput` + Send-Button (Ionicons `send`), FormScroll oder KeyboardAvoidingView damit Keyboard nicht verdeckt.
     - `useMessages(matchId)` für Live-Updates. `markRead` beim Öffnen des Screens für alle noch ungelesenen Recruiter-Messages.

5. **Match-Notification anpassen** (`apps/mobile/src/app/(app)/match/[id].tsx`):
   - Der "Zum Chat (kommt bald)" Button wird enabled und navigiert zu `/(app)/chat/[matchId]`.

6. **Home anpassen** (`apps/mobile/src/app/(app)/index.tsx`):
   - Zusätzlicher Button (zwischen "Job-Feed öffnen" und "CV bearbeiten"): "Deine Matches öffnen" mit `chatbubble-outline` icon, führt zu `/(app)/matches`.

7. **Feed → Match-Screen Übergang** verifizieren: nach Mutual-Match sollte man von Match-Screen direkt in den Chat gehen können und beim ersten Zurückkommen die Recruiter-Auto-Reply schon sehen.

**Regeln (bindend):**

- User-facing-Text ist **Deutsch mit echten Umlauten (ü/ä/ö/ß)**, nicht ae/oe/ue.
- Single Quotes für Imports und Strings, Double Quotes nur in JSX-Attributes.
- **Keine trailing Semikolons** am Zeilenende.
- Code-Kommentare in Englisch.
- Filenamen kebab-case, Komponenten PascalCase.
- Import-Order: react/react-native → external libs → @nexaai/* → @/-relative → types.
- **Keine em-dashes** in Code, Kommentaren, Strings. Nutze Doppelpunkt/Komma/ASCII-Dash.
- Skills lesen: `skills/nexaai-style/SKILL.md`, `skills/nexaai-composition/SKILL.md`, `skills/nexaai-database/SKILL.md`.
- Editorial-Design-Sprache: cream-Backdrop für Hero-Bereiche, `Text variant='caption'` als Eyebrow, `variant='display'` als Headline, keine Pill-Spam, keine Emoji-Dekoration.
- Native props (TextInput placeholderTextColor, Switch trackColor etc): nutze Konstanten aus `apps/mobile/src/lib/colors.ts` (`brand[500]` etc), nicht hardcoded Hex.

**Grenzen (was Codex NICHT tut):**

- **Migrations nicht pushen** (`supabase db push` bleibt Claude vorbehalten weil das Dev-DB anfasst).
- **Function nicht deployen** (`supabase functions deploy`).
- **Kein `git push`** — Christof reviewt Claude's Review vor Push.
- **Keine Änderungen an Schema-Migrations 0001-0006** — nur 0007 neu.
- **Keine Änderungen an Auth-Flow** (login, register, password-reset, callbacks).
- **Keine Änderungen an bestehenden Feed-Screens außer Match-Notification "Zum Chat" enablen** — Codex baut Chat NEU dazu, nicht Feed-Umbau.

**Referenzdateien (Muster für Codex):**

- `apps/mobile/src/lib/seeker.ts` und `apps/mobile/src/lib/jobs.ts` — Hook-Muster mit useCallback + useEffect + refetch, plus Realtime-Subscription.
- `apps/mobile/src/app/(app)/onboarding/preview.tsx` — Screen mit FormScroll + Buttons.
- `apps/mobile/src/app/(app)/feed.tsx` — Editorial Layout mit cream-Backdrop.
- `apps/mobile/src/components/feed/job-card.tsx` — Editorial Card-Layout, caption + display + muted Rhythmus.
- `packages/db/migrations/0005_matching_functions.sql` — RLS-Policy und Postgres-Function Muster.
- `packages/db/migrations/0006_dummy_jobs_seed.sql` — session_replication_role Muster für Seed-Migrations.
- `apps/mobile/src/components/ui/text.tsx` — verfügbare Text-Variants.
- `apps/mobile/src/lib/colors.ts` — brand + neutral Konstanten.

**Verification vor Handoff-Ende:**

```bash
pnpm --filter @nexaai/types typecheck
pnpm --filter @nexaai/mobile typecheck
pnpm --filter @nexaai/mobile lint
```

Alle drei müssen grün sein bevor Codex committed.

**Codex committed** die Änderungen mit klaren Messages (`feat(db):`, `feat(types):`, `feat(mobile):`), aber **pusht nicht**. Nach jedem logischen Chunk ein eigener Commit.

## Codex Log

_Wird von Codex ausgefüllt, wenn er die Arbeit übernimmt._

### Sitzung 2026-07-18 13:42
- Chunks abgeschlossen: Migration 0007 Chat, Messaging-Zod-Schema, Mobile Chat-DAL, Matchliste, Chat-Screen, Match-Notification Chat-CTA, Home Match-Button
- Chunks angefangen aber nicht fertig: keine
- Chunks nicht angefangen: keine
- Geänderte Dateien:
  - `packages/types/src/index.ts`
  - `apps/mobile/src/app/(app)/index.tsx`
  - `apps/mobile/src/app/(app)/match/[id].tsx`
  - `docs/HANDOFF.md`
- Neue Dateien:
  - `packages/db/migrations/0007_chat.sql`
  - `packages/types/src/messaging.ts`
  - `apps/mobile/src/lib/chat.ts`
  - `apps/mobile/src/app/(app)/matches.tsx`
  - `apps/mobile/src/app/(app)/chat/[matchId].tsx`
- Commits (mit SHAs): keine, weil Repo-Regel sagt: nur Christof committed
- Verification-Ergebnisse: typecheck ok, lint ok mit bestehenden Warnungen außerhalb der neuen Chat-Dateien
- Bekannte Probleme / offene Fragen: Auto-Reply wird direkt im Trigger erzeugt und bekommt `created_at = now() + interval '2 seconds'`. Eine echte verzögerte Zustellung braucht einen Worker oder Queue-Mechanismus.
- Was Claude beim Zurückkommen zuerst tun sollte: Migration 0007 reviewen und entscheiden, ob die direkte Dev-Auto-Reply reicht oder durch `pg_notify` plus Worker ersetzt werden soll.

**Format** (Codex bitte ausfüllen):

```
### Sitzung <YYYY-MM-DD HH:MM>
- Chunks abgeschlossen: [Liste]
- Chunks angefangen aber nicht fertig: [Liste + wo genau du stehen geblieben bist]
- Chunks nicht angefangen: [Liste]
- Geänderte Dateien: [Bulleted list]
- Neue Dateien: [Bulleted list]
- Commits (mit SHAs): [git log --oneline -N]
- Verification-Ergebnisse: typecheck [ok/fehler], lint [ok/fehler]
- Bekannte Probleme / offene Fragen: [Text]
- Was Claude beim Zurückkommen zuerst tun sollte: [Text]
```
