# Woche 1: Bootstrap 2026 Stack

Vollständiger Plan für die Bootstrap-Session. Läuft in Claude Code im NexaAi-Repo.

Realistische Zeit: 3-4h fokussierte Arbeit. Committen wir an 4 Checkpoints, damit
Rollbacks möglich sind wenn was total schief geht.

## Vor Session-Start (offline)

- Ist mise/volta so konfiguriert dass Node 22 verfügbar ist?
  - Prüfen: `node --version`
  - Falls nicht: `mise install node@22` oder `volta install node@22`
- Ist Supabase CLI installiert?
  - Prüfen: `supabase --version`
  - Falls nicht: `pnpm add -g supabase` oder AUR-Package
- Bist du bei Supabase eingeloggt?
  - Prüfen: `supabase projects list`
  - Falls nicht: `supabase login`

## Phase 1: Pre-flight (10 Min)

Ziel: sicherstellen dass Ausgangsstand sauber ist.

```bash
cd ~/Projects/NexaAi

# 1.1 Aktueller Stand
git status
git log --oneline -3

# 1.2 Sicherstellen dass wir aktuell sind
git pull

# 1.3 Fresh Dependencies (falls Windows-Sync was verändert hat)
pnpm install

# 1.4 Sanity check: sind die 4 packages typechecken clean?
pnpm --filter @nexaai/config typecheck
pnpm --filter @nexaai/types typecheck
pnpm --filter @nexaai/matching typecheck
pnpm --filter @nexaai/db typecheck
pnpm --filter @nexaai/ui typecheck
```

STOP-Kriterium: alle 5 filter-typechecks grün. Sonst debug bevor weiter.

## Phase 2: Root package.json auf 2026 (5 Min)

Ziel: Node 22, pnpm 9.15 als Baseline.

Editieren: `package.json`

Änderung:
```json
"packageManager": "pnpm@9.15.0",
"engines": {
  "node": ">=22.0.0"
}
```

```bash
# 2.1 Change verify
cat package.json | grep -E "(packageManager|node)"

# 2.2 pnpm nutzt die neue Version
corepack use pnpm@9.15.0

# 2.3 Re-install um sicher zu gehen
pnpm install

# 2.4 Nochmal typecheck
pnpm typecheck
```

Erwarte: pnpm ist jetzt 9.15, alle typechecks weiter grün (apps können weiter meckern
wegen leerer tsconfigs, das ist erwartet).

## Phase 3: Supabase Setup verifizieren (15 Min)

Ziel: klarheit welches Projekt wir nutzen und dass wir connected sind.

```bash
# 3.1 Welche Supabase-Projekte hast du?
supabase projects list
```

Entscheidung:

**Fall A: Du hast bereits ein Projekt `nexaai-*`**
- Nimm das für Development
- Später legen wir ein zweites für Production an

**Fall B: Du hast noch kein Projekt**
- Anlegen: `supabase projects create nexaai-dev --region eu-central-1 --org-id <deine-org>`
- Alternative: im Dashboard supabase.com anlegen, dann hier weitermachen

Wichtig: Region MUSS `eu-central-1` (Frankfurt) sein. Kein anderer Ort. DSGVO.

```bash
# 3.2 Repo mit Projekt linken
cd packages/db
supabase link --project-ref <project-ref>

# 3.3 Verifizieren
supabase status
```

Erwarte: Verbindung zeigt aktives Projekt. Wenn nicht: `supabase login` und Projekt-Ref
aus dem Dashboard kopieren (Settings → General → Reference ID).

Notiere dir aus dem Dashboard (Settings → API):
- Project URL: `https://<ref>.supabase.co`
- Publishable Key (`sb_publishable_...`)
- Secret Key (`sb_secret_...`)

Diese kommen später in `.env.local`.

## Phase 4: Migration laufen lassen (10-30 Min)

Ziel: Schema aus `0001_init.sql` ist in der Dev-DB angewendet.

```bash
# 4.1 Wo wir jetzt sind
cd packages/db
pwd

# 4.2 Migration in Supabase-Struktur bringen
# Die Datei liegt in migrations/0001_init.sql, aber Supabase erwartet
# supabase/migrations/. Wir verschieben oder symlinken:

mkdir -p supabase/migrations
cp migrations/0001_init.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_init.sql

# 4.3 Dry-run: was würde die Migration tun?
supabase db diff --local  # zeigt was neu wäre
# oder wenn das nicht geht:
supabase db push --dry-run

# 4.4 Wenn Dry-run OK aussieht: echt anwenden
supabase db push

# 4.5 Verifizieren
supabase db execute "select tablename from pg_tables where schemaname = 'public';"
```

Erwarte: alle 12 Tabellen zurück (profiles, companies, seeker_profiles, recruiter_profiles,
subscriptions, skills, seeker_skills, jobs, job_criteria, matches, messages, ai_generations,
audit_log).

Falls Fehler bei db push:
- Meist Extension-Rechte-Probleme. `pgvector` und `pgcrypto` müssen im Dashboard aktiviert sein
  (Database → Extensions).
- Falls "type user_role already exists": DB nicht clean, im Dashboard SQL-Editor
  ausführen: `drop schema public cascade; create schema public;` (nur DEV!)

### CHECKPOINT 1: Commit

```bash
cd ~/Projects/NexaAi
git add packages/db/supabase packages/db/migrations
git status  # nur die migration + supabase config
git commit -m "chore(db): apply migration 0001_init to dev supabase"
git push
```

## Phase 5: apps/admin re-scaffolden (30-60 Min)

Ziel: eine echte Next.js 16 App in apps/admin/.

```bash
# 5.1 Backup des alten Stands
cd ~/Projects/NexaAi
git mv apps/admin apps/admin-old  # damit git es als rename tracked
git commit -m "chore(admin): stash old placeholder before re-scaffold"

# 5.2 Neue Next.js App scaffolden
cd apps
pnpm create next-app@latest admin --typescript --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*"
```

Erwarte Prompts:
- Would you like to use TypeScript? → **Yes**
- Would you like to use ESLint? → **Yes**
- Would you like to use Tailwind CSS? → **Yes**
- Would you like your code inside a `src/` directory? → **Yes**
- Would you like to use App Router? → **Yes**
- Would you like to use Turbopack for `next dev`? → **Yes**
- Would you like to customize the import alias? → **No**

Nach dem Scaffold:

```bash
# 5.3 In das neue admin
cd admin
ls -la
# Sollte: app/, public/, src/, package.json, tsconfig.json, next.config.ts, tailwind.config.ts, etc.
```

Adjustments für Turborepo (wichtig, sonst funktioniert Workspace nicht):

Editieren: `apps/admin/package.json`

- Name: `"name": "@nexaai/admin"` (statt "admin")
- Version: `"version": "0.0.0"`
- Private: `"private": true`
- Scripts: `typecheck` hinzufügen: `"typecheck": "tsc --noEmit"`
- Dependencies: unsere workspace deps hinzufügen:
  ```json
  "@nexaai/db": "workspace:*",
  "@nexaai/types": "workspace:*",
  "@nexaai/matching": "workspace:*",
  "@nexaai/config": "workspace:*"
  ```
- Supabase-Deps: hinzufügen:
  ```json
  "@supabase/supabase-js": "^2.47.0",
  "@supabase/ssr": "^0.6.0"
  ```

```bash
# 5.4 Installieren
cd ~/Projects/NexaAi
pnpm install

# 5.5 Test dass es baut
pnpm --filter @nexaai/admin build
```

Erwarte: `next build` läuft durch. Kein Type-Fehler.

```bash
# 5.6 Kurz-Test: dev-server startet
pnpm --filter @nexaai/admin dev
# Ctrl+C nach "Ready in ..." Meldung
```

Wenn alles läuft:

```bash
# 5.7 Alte apps/admin-old löschen
rm -rf apps/admin-old
```

### CHECKPOINT 2: Commit

```bash
git add .
git status
git commit -m "feat(admin): re-scaffold with next.js 16 + typescript + tailwind

- Removed placeholder scaffold
- Fresh create-next-app with App Router, TypeScript, Tailwind 4, ESLint
- Added Turborepo workspace deps (@nexaai/*)
- Added Supabase SSR and JS clients"
git push
```

## Phase 6: apps/mobile re-scaffolden (30-60 Min)

Ziel: echte Expo 54 App in apps/mobile/.

```bash
# 6.1 Backup
cd ~/Projects/NexaAi
git mv apps/mobile apps/mobile-old
git commit -m "chore(mobile): stash old placeholder before re-scaffold"

# 6.2 Neue Expo App scaffolden
cd apps
pnpm create expo-app@latest mobile --template default
```

Der default template gibt uns Expo Router 5, TypeScript, Sensible Defaults.

```bash
# 6.3 In das neue mobile
cd mobile
ls -la
# Sollte: app/, assets/, package.json, app.json, tsconfig.json, etc.
```

Adjustments für Turborepo:

Editieren: `apps/mobile/package.json`

- Name: `"name": "@nexaai/mobile"`
- Version: `"version": "0.0.0"`
- Private: `"private": true`
- Scripts: `typecheck` hinzufügen: `"typecheck": "tsc --noEmit"`, `lint` anpassen falls nötig
- Dependencies: workspace deps:
  ```json
  "@nexaai/db": "workspace:*",
  "@nexaai/types": "workspace:*",
  "@nexaai/matching": "workspace:*",
  "@nexaai/config": "workspace:*"
  ```
- Supabase + Storage:
  ```json
  "@supabase/supabase-js": "^2.47.0",
  "expo-secure-store": "~14.0.0"
  ```

NativeWind Setup (aus Tailwind für React Native):

```bash
cd apps/mobile
pnpm add nativewind@^4.1.0
pnpm add -D tailwindcss@^3.4.0  # NativeWind 4 will erstmal Tailwind 3
```

`apps/mobile/tailwind.config.js` anlegen:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
}
```

`apps/mobile/babel.config.js` anpassen (falls existiert):
```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  }
}
```

`apps/mobile/global.css` erstellen:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

In `apps/mobile/app/_layout.tsx` erste Zeile:
```tsx
import '../global.css'
```

```bash
# 6.4 Installieren
cd ~/Projects/NexaAi
pnpm install

# 6.5 Test dass typecheck läuft
pnpm --filter @nexaai/mobile typecheck

# 6.6 Kurz-Test dev-server
pnpm --filter @nexaai/mobile start
# Wenn du 'w' drückst, sollte web-preview starten. Ctrl+C danach.
```

Wenn alles läuft:

```bash
# 6.7 Alte apps/mobile-old löschen
rm -rf apps/mobile-old
```

### CHECKPOINT 3: Commit

```bash
git add .
git status
git commit -m "feat(mobile): re-scaffold with expo 54 + expo router 5 + nativewind

- Removed placeholder scaffold
- Fresh create-expo-app with TypeScript and file-based routing
- Added Turborepo workspace deps (@nexaai/*)
- Added Supabase JS client and expo-secure-store
- NativeWind 4 configured for React Native styling"
git push
```

## Phase 7: apps/functions Setup (15-30 Min)

Ziel: Edge Function Grundstruktur, ein Stub Function der deploybar ist.

```bash
cd packages/db
supabase functions new matching
```

Das erzeugt `supabase/functions/matching/index.ts`. Wir bewegen das an die richtige Stelle:

```bash
cd ~/Projects/NexaAi
mkdir -p apps/functions/matching
mv packages/db/supabase/functions/matching/index.ts apps/functions/matching/index.ts
rmdir packages/db/supabase/functions/matching packages/db/supabase/functions
```

Editieren: `apps/functions/matching/index.ts` - Deno-Style Handler:

```typescript
// matching Edge Function
// Berechnet Match-Scores zwischen einem Bewerber und relevanten Jobs.
// Wird vom Mobile-App aufgerufen wenn Bewerber sein Feed öffnet.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: 'matching function stub' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

`apps/functions/deno.json` prüfen und ggf anlegen:
```json
{
  "compilerOptions": {
    "lib": ["deno.window"],
    "strict": true
  }
}
```

```bash
# 7.1 Deploy test (kostet nichts, funktion ist im dev-projekt)
cd packages/db
supabase functions deploy matching --project-ref <dev-project-ref>
```

Erwarte: deploy successful, URL wird gedruckt.

Test:
```bash
curl -X POST https://<ref>.supabase.co/functions/v1/matching \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json"
```

Sollte zurückkommen: `{"message":"matching function stub"}`.

## Phase 8: Workspace-Deps neu verkabeln (15 Min)

Ziel: die neuen Apps können `@nexaai/*` importieren und typechecken das sauber.

Test-Import in admin:

Editieren: `apps/admin/src/app/page.tsx`

Am Anfang einfügen:
```tsx
import { TYPES_PLACEHOLDER } from '@nexaai/types'

console.log(TYPES_PLACEHOLDER)
```

```bash
pnpm --filter @nexaai/admin typecheck
```

Erwarte: grün. Wenn Fehler "Cannot find module '@nexaai/types'":
- `tsconfig.json` in apps/admin muss `paths` gesetzt haben. Prüfen und ggf. hinzufügen.

Danach Import wieder entfernen (war nur Test).

Test-Import in mobile:

Editieren: `apps/mobile/app/index.tsx`

Am Anfang:
```tsx
import { TYPES_PLACEHOLDER } from '@nexaai/types'
```

```bash
pnpm --filter @nexaai/mobile typecheck
```

Erwarte: grün. Wenn Fehler ähnlich fixen. Danach Import wieder raus.

## Phase 9: .env.example schreiben (10 Min)

Datei erstellen: `~/Projects/NexaAi/.env.example`

```bash
# Supabase - Publishable Key (public, für Client)
# Aus Supabase Dashboard > Settings > API Keys
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx

# Supabase - Secret Key (private, nur für Edge Functions und Server Actions)
SUPABASE_SECRET_KEY=sb_secret_xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# DeepSeek AI
DEEPSEEK_API_KEY=sk-xxxxx

# Mistral (Fallback für DSGVO-sensitive Aufgaben in EU)
MISTRAL_API_KEY=xxxxx

# Node
NODE_ENV=development
```

Dann eigene `.env.local` aus dem Template befüllen (mit echten Werten für Dev-Projekt):

```bash
cp .env.example .env.local
# Manuell editieren mit echten Werten aus Supabase Dashboard
```

## Phase 10: Final Sanity Check (15 Min)

Ziel: alles läuft zusammen.

```bash
# 10.1 Fresh install (falls was zwischendurch gecached ist)
cd ~/Projects/NexaAi
rm -rf node_modules
find . -name "node_modules" -type d -not -path "*/node_modules/*" -prune -exec rm -rf {} +
pnpm install

# 10.2 Global typecheck
pnpm typecheck

# 10.3 Lint (kann Warnungen haben, keine Errors)
pnpm lint 2>&1 | tail -30

# 10.4 Test-Build von admin
pnpm --filter @nexaai/admin build

# 10.5 Kurz mobile starten (nur bis Ready-Meldung)
pnpm --filter @nexaai/mobile start
# 'q' zum Beenden
```

Erwarte: alles grün oder nur Warnungen. Echte Errors: STOP und melden.

### CHECKPOINT 4: Final Commit

```bash
git add .
git status
git commit -m "feat: bootstrap 2026 stack complete

- Root: Node 22, pnpm 9.15
- Admin app: Next.js 16 with Turbopack, Tailwind 4, App Router
- Mobile app: Expo 54 with Expo Router 5, NativeWind 4
- Functions: matching stub deployed to dev supabase
- All workspace deps (@nexaai/*) wired and importable
- .env.example documented
- Migration 0001 applied to dev database"
git push
```

## Was danach als nächstes kommt (Woche 2)

Nicht heute. Aber zum Ausblick:

- **Auth-Flow im Admin:** Supabase Auth mit Passwort und Magic Link
- **Company Onboarding:** Firma anlegen, VAT, Adresse
- **Stripe Setup:** Customer + erste Subscription
- **Erste Job-Erstellung im Admin:** Formular mit Zod-Validation

Dazu gibt es dann eine eigene Session mit einem eigenen Plan.

## Bei Fehlern generell

- Wenn was schief geht: STOP, nicht rumfrickeln
- Screenshot / Terminal-Output kopieren
- Zurück zum letzten Checkpoint via `git reset --hard HEAD` oder `git reset --hard <commit>`
- Im Web-Chat Claude fragen (sinnvoll wenn komplexer Debug)
- Sonst weiter im Claude Code Session

## Style-Erinnerung

Alle Regeln aus:
- `skills/nexaai-style/SKILL.md` (keine Em-Dashes, deutsche User-Texte)
- `skills/nexaai-database/SKILL.md` (nie service_role im Client)
- `skills/nexaai-composition/SKILL.md` (composition-Patterns wenn Komponenten kommen)

Auch bei Boilerplate: keine Ausrede sie zu ignorieren.
