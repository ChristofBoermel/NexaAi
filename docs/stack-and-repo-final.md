# NexaAi: Finaler Tech Stack und Repo-Struktur (Stand Juni 2026)

## Was seit unserer letzten Planung passiert ist

Wichtige Änderungen die wir einbauen müssen:

### 1. Next.js 15 → 16 (breaking changes)

Next.js 16 ist seit Oktober 2025 stable. Aktuelle Version 16.2.7. Was für uns relevant ist:

- **Turbopack ist jetzt Default-Bundler** für Dev und Build. Kein separater Flag mehr.
- **`middleware.ts` heißt jetzt `proxy.ts`.** Old-Style Files werden silent ignoriert (wichtig!).
- **`params` und `searchParams` sind async.** Muss awaited werden:
  ```typescript
  // ALT (Next.js 15):
  export default function Page({ params }: { params: { id: string } }) {
    return <div>{params.id}</div>
  }
  
  // NEU (Next.js 16):
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <div>{id}</div>
  }
  ```
- **Node.js 20+ required.** Du bist wahrscheinlich schon auf 22 mit Arch, aber CI/CD prüfen.
- **Cache Components** in Beta. Explizites Caching statt implizit. Für unser MVP: default-Verhalten ist fine, wir kümmern uns erst darum wenn Performance-Probleme kommen.
- **React 19.2** ist Peer-Dep. Compatibility mit shadcn/ui geprüft (ok).

**Action:** In `apps/admin/package.json` `next` auf `^16.2.7` setzen. TypeScript-Typen für params anpassen.

### 2. Supabase API-Keys neu

Legacy Keys (`anon` und `service_role`) werden Ende 2026 deprecated. Neue Keys:

- **Publishable Key** (`sb_publishable_xxx`): für Client-Code, ersetzt `anon`
- **Secret Key** (`sb_secret_xxx`): für Server-Code, ersetzt `service_role`

Warum das wichtig ist: wenn wir mit Legacy Keys starten und Anfang 2027 launchen, müssen wir migrieren mitten im Betrieb. Wenn wir jetzt schon die neuen Keys nutzen, sparen wir uns das.

**Action:** Neue Keys aus Supabase Dashboard holen, in `.env.example` als `SUPABASE_PUBLISHABLE_KEY` und `SUPABASE_SECRET_KEY` benennen.

### 3. Expo Session-Storage Update

Best Practice für Expo + Supabase in 2026:

```typescript
// ALT: AsyncStorage nutzen
import AsyncStorage from '@react-native-async-storage/async-storage'

// NEU: expo-sqlite/localStorage
import 'expo-sqlite/localStorage/install'
// Danach ist globales localStorage verfügbar
```

Warum: `expo-sqlite/localStorage` ist zuverlässiger, unterstützt größere Payloads, und funktioniert besser mit Session-Rotation.

## Der finale Stack

Hier ist die verbindliche Version. Alle Versionen sind Juni 2026:

### Frontend Mobile

```json
{
  "expo": "~52.0.0",
  "react": "19.0.0",
  "react-native": "0.79.0",
  "expo-router": "~4.0.0",
  "nativewind": "^4.1.0",
  "expo-secure-store": "~14.0.0",
  "expo-sqlite": "~15.0.0",
  "@supabase/supabase-js": "^2.47.0",
  "zod": "^3.24.0",
  "react-hook-form": "^7.54.0",
  "@tanstack/react-query": "^5.62.0"
}
```

**Kern-Entscheidungen:**
- **Expo Router** über React Navigation direkt. Modernerer file-based Routing, bessere Deep-Links, sauberer.
- **NativeWind 4** über StyleSheet.create. Tailwind-Syntax die alle drei AI-Tools verstehen.
- **React Hook Form** über Formik oder TanStack Form. Am weitesten verbreitet, größte AI-Trainings-Basis.
- **TanStack Query** für Server-State. Kein Zustand-Store für Server-Daten mischen (führt zu stale-data Bugs).

### Frontend Web-Admin

```json
{
  "next": "^16.2.7",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "tailwindcss": "^4.0.0",
  "@supabase/ssr": "^0.6.0",
  "@supabase/supabase-js": "^2.47.0",
  "zod": "^3.24.0",
  "react-hook-form": "^7.54.0",
  "@tanstack/react-query": "^5.62.0",
  "stripe": "^17.5.0",
  "next-safe-action": "^7.10.0"
}
```

**Kern-Entscheidungen:**
- **Next.js 16 App Router.** Pages Router ist deprecated für neue Projekte.
- **Tailwind CSS 4** mit Oxide-Engine (deutlich schneller als 3).
- **@supabase/ssr** über @supabase/auth-helpers-nextjs (letzter ist deprecated).
- **next-safe-action** für Server Actions mit Zod-Validierung, macht typsichere Actions einfach.
- **shadcn/ui Komponenten** nach Bedarf (kein Package, sondern per CLI ins Projekt kopieren).

### Backend

```json
{
  "supabase": "hosted on EU/Frankfurt",
  "postgres": "15.x",
  "extensions": ["pgvector", "pgsodium (managed)", "pgcrypto"],
  "auth": "Supabase Auth (native)",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime",
  "edge_functions": "Deno-based"
}
```

**Warum kein separates Backend?** Für MVP-Umfang ist Supabase ausreichend. Edge Functions decken alle Custom-Logik ab (Matching, DeepSeek-Calls, Stripe-Webhooks). Wenn wir später ein separates Node.js oder Go Backend brauchen, ist der Cut relativ sauber weil die Business-Logik in Edge Functions liegt, nicht im Client.

### KI-Integration

```json
{
  "provider_primary": "DeepSeek API",
  "provider_fallback": "Mistral (EU-gehostet)",
  "caller": "nur Edge Functions, nie Client",
  "prompt_management": "packages/prompts (versioned)"
}
```

**Wichtig für DSGVO:**
- DeepSeek liegt in China. Bei Personendaten-Verarbeitung: PII strippen vor dem Call oder Fallback auf Mistral EU.
- Prompts sind versioniert im Code. Kein Prompt-Engineering-Tool wie LangSmith für MVP (adds Vendor-Risiko).

### Zahlungen

```json
{
  "stripe": "^17.5.0",
  "stripe_billing": "für Subscriptions",
  "future_stripe_connect": "V2 wenn Vermittlungshonorar kommt"
}
```

### Deployment

- **Web-Admin:** Vercel EU (Frankfurt Region)
- **Mobile:** EAS Build + TestFlight (iOS) + Play Internal Testing (Android)
- **Datenbank:** Supabase EU Frankfurt (schon eingerichtet)
- **Edge Functions:** Supabase (deployed nach EU)

### Observability (siehe auch production-checklist.md)

- **Errors:** Sentry (EU Instance)
- **Analytics:** PostHog (EU Cloud)
- **Uptime:** Better Stack oder UptimeRobot
- **Logs:** Supabase Logs Explorer + Vercel Logs

## Was wir NICHT nutzen (und warum)

Wichtig für Fokus: hier sind Sachen die in vielen 2026-Setups auftauchen, die wir aber bewusst weglassen.

### Kein Clerk (Auth)

Clerk ist gut aber:
- Extra Vendor + Kosten
- Extra Datenverarbeiter (DSGVO-Vertrag nötig)
- Weniger tight Integration mit Supabase RLS
- Supabase Auth ist ausreichend und battle-tested

### Kein RevenueCat (jetzt)

RevenueCat ist Standard für Consumer-Apps mit In-App-Purchases. Wir haben aber B2B-Abos über Web (Stripe). Wenn wir später eine Bewerber-Consumer-App mit Premium-Features machen, kommt RevenueCat ins Spiel. Nicht jetzt.

### Kein Prisma (ORM)

Für Supabase ist der native SDK besser:
- Prisma Client für Supabase RLS ist umständlich
- Duplicate Schema-Definition (Prisma Schema + SQL Migrations)
- Supabase SDK ist typed via Supabase-Generator

Wir nutzen `supabase gen types typescript` um TS-Typen zu erzeugen.

### Kein Redis / BullMQ

Für MVP zu viel. Supabase hat pg_cron und pg_net für scheduled Jobs, das reicht. Wenn wir später Millionen von Match-Berechnungen queuen müssen, evaluieren wir dann.

### Kein separates GraphQL

REST via Supabase reicht. GraphQL wäre nur sinnvoll wenn wir viele verschiedene Clients hätten. Haben wir nicht.

### Kein Microservices-Setup

Ein Repo, ein Backend, klar. Microservices ohne Team-Boundaries sind Selbstsabotage.

### Kein Redux / Zustand für Server-State

TanStack Query reicht. Zustand nur für rein clientseitiges UI-State (Modal auf/zu, Filter-Selektionen).

## Referenzen: Wie top-tier OSS Projekte es machen

Ich empfehle dir folgende OSS Repos als Referenz während wir bauen. Alle sind produktions-taugliche SaaS-Apps mit ähnlichem Stack:

### Cal.com

- **Was es ist:** Open Source Calendly-Alternative.
- **Stack:** Next.js + Prisma + PostgreSQL + tRPC + Turborepo
- **Wofür lernen:** Ihre Monorepo-Struktur, ihre auth-Umsetzung, ihre Stripe-Integration
- **Link:** github.com/calcom/cal.com
- **Achtung:** Sie nutzen Prisma, wir nicht. Aber sonst viel übertragbar.

### Documenso

- **Was es ist:** Open Source DocuSign-Alternative.
- **Stack:** Next.js + Prisma + Postgres + Stripe
- **Wofür lernen:** Ihre PDF-Handling-Patterns, ihre Team/Company-Membership-Struktur, ihre E-Mail-Templates
- **Link:** github.com/documenso/documenso

### Formbricks

- **Was es ist:** Open Source Typeform-Alternative.
- **Stack:** Next.js + Prisma + Postgres
- **Wofür lernen:** Ihre Survey-Building-UX (ähnlich unserer Job-Erstellung), ihre Analytics-Umsetzung, PostHog-Integration
- **Link:** github.com/formbricks/formbricks

### Dub

- **Was es ist:** Open Source Bitly-Alternative (Link-Shortener + Analytics).
- **Stack:** Next.js + Prisma + Postgres + Tinybird
- **Wofür lernen:** Ihre API-Rate-Limiting, ihre Multi-Tenant-Architektur, saubere App-Router-Verwendung
- **Link:** github.com/dubinc/dub

### Für Mobile: Expo Router Examples

- **Link:** github.com/expo/router/tree/main/apps
- **Wofür lernen:** File-based Routing Patterns, Auth-Flows, Deep-Links

**Wichtige Regel:** Kopiere Patterns, nicht Code. Ihre Business-Logik ist irrelevant, ihre Struktur-Entscheidungen sind Gold wert.

## Die finale Repo-Struktur

Aktualisiert basierend auf Best-Practices:

```
nexaai/
├── apps/
│   ├── mobile/                    # Expo React Native App (Bewerber + Recruiter)
│   │   ├── app/                   # Expo Router
│   │   │   ├── (auth)/            # Auth Routes (Login, Signup)
│   │   │   ├── (seeker)/          # Bewerber-Routes
│   │   │   ├── (recruiter)/       # Recruiter-Routes  
│   │   │   ├── _layout.tsx        # Root Layout
│   │   │   └── index.tsx          # Landing/Redirect
│   │   ├── components/            # UI-Komponenten
│   │   ├── hooks/                 # Custom Hooks
│   │   ├── lib/                   # Utilities, Supabase Client
│   │   ├── app.config.ts          # Expo Config
│   │   ├── eas.json               # EAS Build Config
│   │   └── package.json
│   │
│   ├── admin/                     # Next.js 16 Web Admin (für Unternehmen)
│   │   ├── app/                   # App Router
│   │   │   ├── (auth)/            # Auth Routes
│   │   │   ├── (dashboard)/       # Nach-Login-Routes
│   │   │   ├── api/               # Route Handlers (Webhooks etc.)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   ├── proxy.ts               # NEU: früher middleware.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── functions/                 # Supabase Edge Functions
│       ├── matching/              # Match-Berechnung
│       ├── ai-generate-cv/        # CV-Generierung via DeepSeek
│       ├── ai-job-writer/         # Job-Anzeigen KI-Hilfe
│       ├── stripe-webhook/        # Stripe Events
│       ├── dsgvo-export/          # Datenexport-Endpunkt
│       ├── dsgvo-delete/          # Löschungs-Endpunkt
│       └── _shared/               # Utilities für alle Functions
│
├── packages/
│   ├── db/                        # Datenbank-Schema und Migrations
│   │   ├── migrations/            # SQL-Migrations (0001-...)
│   │   ├── seed/                  # Seed-Data (Skills, Sample Jobs)
│   │   ├── types/                 # Generated: supabase gen types
│   │   └── client.ts              # Supabase Client Factory
│   │
│   ├── types/                     # Shared TypeScript Types
│   │   ├── seeker.ts
│   │   ├── job.ts
│   │   ├── match.ts
│   │   └── index.ts
│   │
│   ├── matching/                  # Matching-Logik (nutzbar in Edge Fn und Tests)
│   │   ├── score.ts
│   │   ├── weights.ts
│   │   └── index.ts
│   │
│   ├── prompts/                   # Versioned KI-Prompts
│   │   ├── cv-generation.ts
│   │   ├── job-writer.ts
│   │   └── index.ts
│   │
│   ├── config/                    # Shared Config (Env-Vars, Konstanten)
│   │   ├── env.ts                 # Zod-validated env
│   │   ├── constants.ts
│   │   └── index.ts
│   │
│   └── ui/                        # Wiederverwendbare UI-Bausteine (nur wenn nötig)
│       ├── mobile/                # Für Expo
│       └── web/                   # Für Next.js
│
├── docs/
│   ├── architecture.md            # High-Level (haben wir schon)
│   ├── data-model.md              # (haben wir schon)
│   ├── matching.md                # (haben wir schon)
│   ├── dsgvo.md                   # (haben wir schon)
│   ├── ai-workflow.md             # (kommt neu)
│   ├── features/                  # Feature-Specs für opencode
│   │   └── {feature-name}.md
│   ├── decisions/                 # Architecture Decision Records
│   │   └── YYYY-MM-DD-{topic}.md
│   └── DAILY.md                   # Tägliche Fortschritts-Notizen
│
├── skills/                        # opencode/agent skills
│   ├── database.md
│   ├── mobile-ui.md
│   ├── api.md
│   └── testing.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint + Typecheck + Test
│       ├── deploy-admin.yml       # Vercel Deploy
│       └── deploy-functions.yml   # Supabase Functions Deploy
│
├── AGENTS.md                      # Regeln für alle AI-Agenten (haben wir schon, erweitern)
├── README.md
├── turbo.json                     # Turborepo Config
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── package.json                   # Root
├── tsconfig.base.json             # Shared TS Config
└── .env.example                   # Alle nötigen Env-Vars mit Erklärungen
```

## Naming-Konventionen

- **Dateien:** kebab-case für alles außer React-Komponenten (`seeker-profile.ts`, aber `SeekerProfile.tsx`)
- **Ordner:** kebab-case (`seeker-profile/`)
- **Datenbank-Tabellen:** snake_case, plural (`seeker_profiles`, `job_criteria`)
- **Datenbank-Spalten:** snake_case (`created_at`, `match_score`)
- **TypeScript-Typen:** PascalCase (`SeekerProfile`, `JobCriteria`)
- **Enums:** PascalCase mit UPPER_CASE Values (`Status.ACTIVE`)
- **React-Komponenten:** PascalCase (`SeekerProfileForm`)
- **Hooks:** camelCase mit `use`-Prefix (`useSeekerProfile`)
- **Konstanten:** UPPER_SNAKE_CASE (`MAX_JOBS_PER_COMPANY`)

## Package-Abhängigkeiten (welches Package darf was importieren)

Wichtig für saubere Struktur:

```
config       → keine Abhängigkeiten (Basis)
types        → config
db           → config, types
matching     → config, types, db
prompts      → config, types
ui           → config, types

apps/mobile     → alles außer apps/*
apps/admin      → alles außer apps/*
apps/functions  → alles außer apps/*
```

**Regel:** Apps importieren aus Packages, nicht andersrum. Packages importieren nicht aus Apps.

## Env-Variablen (was wir brauchen)

Zu setzen in `.env.example`:

```bash
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Supabase (server-only)
SUPABASE_SECRET_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# DeepSeek
DEEPSEEK_API_KEY=

# Mistral (Fallback für DSGVO)
MISTRAL_API_KEY=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Node
NODE_ENV=development
```

## Was jetzt konkret passieren muss

**Reihenfolge der Umsetzung, damit wir alles richtig aufsetzen:**

1. **Package-Versionen updaten** in allen `package.json` Files auf 2026-Stand (Next.js 16, etc.)
2. **Supabase neue Keys generieren** und in .env.example dokumentieren
3. **`middleware.ts` → `proxy.ts`** in apps/admin (falls schon angelegt)
4. **AGENTS.md erweitern** mit den Regeln aus ai-workflow.md
5. **skills/ Ordner anlegen** mit den 3-4 initialen Skills
6. **docs/features/ und docs/decisions/ anlegen** (leer, wird beim Bauen befüllt)
7. **docs/DAILY.md anlegen** (dein tägliches Log)
8. **5 SQL-Fixes an 0001_init.sql** anwenden (steht noch aus!)
9. **Migration laufen lassen** `pnpm --filter @nexaai/db db:migrate`
10. **Dann erst:** Woche 2 (Auth + Profile) starten
