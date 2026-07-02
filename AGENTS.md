# NexaAi Agent Instructions

Diese Datei gilt für alle KI-Agenten die in diesem Repo arbeiten: opencode, Codex, Cursor, Cline, oder andere. Claude Code hat zusätzlich `CLAUDE.md` als Erweiterung.

## Skills verfügbar

Bevor du eine Aufgabe angehst: prüfe welche der folgenden Skills relevant sind und lies sie:

### NexaAi-eigene Skills (`skills/`)

- `nexaai-composition` - React/React Native Composition-Patterns (**immer bei Komponenten**)
- `nexaai-database` - Supabase, RLS, Migrations
- `nexaai-domain` - Matching-Logik, DSGVO, KI-Integration
- `nexaai-style` - Code-Style und User-facing Text (**immer**)
- `nexaai-testing` - Test-Patterns

### Externe Skills (installiert via `npx skills add`)

- `react-best-practices` (Vercel) - für `apps/admin/`
- `react-native-skills` (Vercel) - für `apps/mobile/`
- `web-design-guidelines` (Vercel) - UI-Konsistenz
- `frontend-design` (Anthropic) - Design-System

## Task-Workflow

1. Lies die relevanten Skills bevor du anfängst
2. Wenn `docs/features/{feature-name}.md` existiert: lies die Spec zuerst
3. Prüfe `packages/types` für vorhandene Types bevor du neue anlegst
4. Nutze `packages/config` für Env-Vars, nicht direkt `process.env`
5. Wenn du unsicher bist: STOP und frag den Menschen. Rate nicht.

## Datenbank-Regeln

- KEINE direkten Änderungen an bereits gelaufenen Migrations
- Neue Migrations nur nach expliziter Freigabe
- RLS-Policies immer mit Kommentar warum
- Nach jeder Migration `supabase gen types typescript` laufen lassen
- Siehe `skills/nexaai-database/SKILL.md`

## API-Regeln

- Alle Inputs mit Zod validieren
- Alle Outputs typisiert
- Rate-Limiting per Endpoint dokumentieren
- Web-Admin: Next.js 16 Route Handlers unter `apps/admin/app/api/`
- Mobile-facing: Supabase Edge Functions unter `apps/functions/`

## Style

- Keine Em-Dashes anywhere
- User-facing Text auf Deutsch, Code-Kommentare auf Englisch
- Prettier: single quotes, no semicolons
- Siehe `skills/nexaai-style/SKILL.md`

## Composition-Regeln (kritisch)

- Keine boolean-prop-explosion (`isThread`, `isEditing`)
- Compound Components mit shared Context bevorzugen
- State via Provider lifted, nicht in Komponenten trapped
- React 19: kein forwardRef, `use()` statt `useContext()`
- React Compiler: kein manuelles `useMemo`, `useCallback`, `React.memo` by default
- Siehe `skills/nexaai-composition/SKILL.md`

## Commit-Regeln

- Format: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`
- Scopes: `mobile`, `admin`, `db`, `functions`, `config`, `matching`, `types`
- **Du machst KEINE Commits selbst.** Nur Christof committed.

## Referenz-Dokumente

- `docs/architecture.md` - System-Übersicht
- `docs/data-model.md` - Datenbank-Schema
- `docs/matching.md` - Matching-Algorithmus
- `docs/dsgvo.md` - Datenschutz-Konzept
- `docs/ai-workflow.md` - Wie die drei KI-Tools zusammenarbeiten
- `docs/production-checklist.md` - Vor Launch nicht vergessen
- `docs/cross-machine-setup.md` - Windows/Linux Cross-Setup
