# NexaAi — System Architecture

## What NexaAi is

A two-sided mobile-first job matching platform. Job seekers create anonymous skill profiles and swipe through anonymized job postings. Employers post jobs with weighted skill criteria and a configurable match threshold, then review ranked candidate lists. Mutual matches unlock a chat. Employers pay a monthly subscription (placeholder: €1200/month); job seekers use the app free.

The MVP targets a single vertical: IT roles. This constraint exists because the differentiating "skill-verification tasks" feature only works in MVP scope for fields where small tasks can be auto-graded.

## Product surfaces

| Surface | Purpose | Technology |
|---|---|---|
| Mobile app | Swiping, profile management, chat — both seekers and recruiters | Expo + React Native + TypeScript |
| Web admin | Employer onboarding, Stripe billing, job creation, subscription management | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Auth, data, realtime, file storage, custom logic | Supabase (Postgres + Auth + Realtime + Storage + Edge Functions) |

The mobile app is the swipe-and-chat tool for both roles. Recruiters log in on mobile to review matches and chat, but do their setup (company profile, Stripe, job posting) on the web admin. This split exists because form-heavy and billing flows are painful on mobile, and €1200/month buyers expect a real web product.

## High-level architecture

```
┌────────────────────┐     ┌────────────────────┐
│  Expo App          │     │  Next.js Admin     │
│  (seekers +        │     │  (employer setup,  │
│   recruiters)      │     │   billing, jobs)   │
└─────────┬──────────┘     └─────────┬──────────┘
          │                          │
          │ Supabase JS SDK          │ Supabase JS SDK
          │ (auth, queries,          │ (auth, server-side
          │  realtime subs)          │  rendering)
          │                          │
          ▼                          ▼
┌─────────────────────────────────────────────────┐
│              Supabase Project                   │
│                                                 │
│  ┌─────────────┐  ┌──────────────┐              │
│  │  Auth       │  │  Postgres    │              │
│  │  (JWT)      │  │  + RLS       │              │
│  └─────────────┘  │  + pgvector  │              │
│                   └──────────────┘              │
│  ┌─────────────┐  ┌──────────────┐              │
│  │  Realtime   │  │  Storage     │              │
│  │  (chat,     │  │  (avatars,   │              │
│  │   matches)  │  │   logos)     │              │
│  └─────────────┘  └──────────────┘              │
│  ┌─────────────────────────────────────────┐    │
│  │  Edge Functions (Deno/TypeScript)       │    │
│  │  • matching-compute                     │    │
│  │  • cv-generate (calls DeepSeek)         │    │
│  │  • stripe-webhook                       │    │
│  │  • dsgvo-export, dsgvo-delete           │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Stripe   │    │ DeepSeek │    │ Sentry   │
    │ Billing  │    │ API      │    │ logs     │
    └──────────┘    └──────────┘    └──────────┘
```

## Why this stack

**Supabase as the spine.** Postgres with Row Level Security gives us declarative anonymity rules (a profile column is only readable if a mutual match exists). Realtime handles chat and live match notifications without a separate WebSocket service. Auth covers email and OAuth out of the box. Edge Functions handle the few pieces of business logic that don't belong in the database. We are already familiar with this stack from Lebensordner.

**Expo for mobile, not Flutter.** TypeScript across the entire codebase (mobile, web admin, edge functions). AI coding assistants (Claude, DeepSeek-Coder, Codex) are most accurate in JS/TS. OTA updates via EAS Update let us fix bugs without app store review. Existing muscle memory from Lebensordner.

**Next.js for the web admin.** Employers buy on desktop and expect a web product for billing. App Router with server components handles SSR and SEO trivially. Same TypeScript types as the mobile app via shared monorepo packages.

**Stripe Billing (not just Checkout).** €1200/month is a B2B price point. EU customers need proper invoices, VAT handling, and often want to pay by SEPA or invoice rather than card. Stripe Billing covers invoicing; Stripe Tax handles EU VAT automatically.

**DeepSeek as the LLM.** Cheapest competent model for CV generation. Called only from Edge Functions, never from the client, because the API key must not leak and because we may need to swap providers later without an app update.

**No Redis, no Elasticsearch, no microservices, no separate Go backend.** Each of these solves a problem we do not have yet. Postgres + indexes will serve the first 10,000 users comfortably. pgvector handles semantic skill matching when boolean matching gets too rigid. We revisit when scale forces us to.

## Repository structure

```
nexaai/
├── apps/
│   ├── mobile/          Expo app (seekers + recruiters)
│   ├── admin/           Next.js employer admin
│   └── functions/       Supabase Edge Functions
├── packages/
│   ├── db/              Migrations, RLS policies, seed data, generated types
│   ├── ui/              Shared components where cross-platform-feasible
│   ├── types/           Shared TypeScript types
│   ├── matching/        Pure-function matching algorithm (used in DB and tests)
│   └── config/          ESLint, TypeScript, Tailwind shared configs
├── docs/
│   ├── architecture.md  This file
│   ├── data-model.md    Entities, relationships, RLS strategy
│   ├── matching.md      Scoring algorithm and examples
│   ├── dsgvo.md         Compliance design
│   └── api.md           Edge Function contracts
├── AGENTS.md            Primary agent rules
├── CLAUDE.md            Symlink to AGENTS.md
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

Turborepo manages the workspace. pnpm is the package manager. This mirrors the Lebensordner pattern.

## Deployment targets

| Component | Where | How |
|---|---|---|
| Supabase project | Supabase managed cloud, EU region (Frankfurt) | Provisioned via Supabase dashboard; migrations via CLI in CI |
| Edge Functions | Deployed with the Supabase project | `supabase functions deploy` from CI |
| Next.js admin | Vercel, EU edge region | Auto-deploy on push to main |
| Expo app | EAS Build, distributed via TestFlight (iOS) and Play Console Internal (Android) initially | Triggered on git tag `v*` |
| Stripe | Stripe dashboard | Test mode until ready for production |

EU hosting is required for DSGVO. Frankfurt region for Supabase, EU edge for Vercel.

## CI/CD

GitHub Actions, four workflows:

1. **`ci.yml`** on every PR: ESLint, TypeScript check, unit tests, build admin, type-check mobile. Required to merge.
2. **`deploy-admin.yml`** on merge to main: deploy Next.js to Vercel (Vercel handles this natively, but the workflow runs migrations first).
3. **`deploy-mobile.yml`** on git tag `v*`: EAS build, submit to TestFlight and Play Console Internal track.
4. **`db-migrate.yml`** on merge to main when `packages/db/migrations` changes: run migrations against staging Supabase, require manual approval for production.

No deploys happen from a developer's laptop. All deploys go through CI.

## Observability

- **Sentry** for mobile and admin crash reporting and performance.
- **Supabase logs** for database, auth, edge function logs.
- **Stripe dashboard** for payment events.
- **PostHog** (self-hosted on Hetzner, optional V2) for product analytics. Skipped in MVP.

## Security and DSGVO

Covered in detail in `docs/dsgvo.md`. Key architectural decisions:

- All data hosted in EU (Frankfurt).
- Sensitive fields (real name, email, employer history) are encrypted at the column level using `pgsodium` and only decrypted when RLS confirms a mutual match has occurred.
- Audit log table records every match reveal, every CV generation, every admin action on a user's data.
- DeepSeek API calls strip PII before sending: the prompt sees only structured skill data, never real names. Output is reviewed by the user before publishing.
- Right-to-delete is a Supabase Edge Function `dsgvo-delete` that cascades through all tables and emits a Stripe customer deletion request.

## Out of scope for MVP

These features are V1 or later. Listed here so agents don't accidentally build them:

- Skill-verification tasks (the "Bewerber löst Mini-Aufgabe" feature) — V1
- AI-generated cover letters — V2
- Video interview integration — V3
- Multi-language support (German only in MVP) — V2
- Employer team accounts (one recruiter per company in MVP) — V1
- Salary prediction, culture fit scoring — V3
- Industry verticals beyond IT — V2+
- Push notifications for new matches — V1
- Native mobile app store distribution (TestFlight + Play Internal only in MVP)

## Estimated MVP timeline

6 to 8 weeks solo, full-time, with agentic coding assistance. Phases:

- **Week 1**: Repo scaffold, Supabase project, auth flows, CI green on empty.
- **Week 2**: Data model implemented, RLS policies, seed data, type generation working.
- **Week 3**: Employer admin: company onboarding, Stripe checkout, job creation form.
- **Week 4**: Mobile app: seeker signup, skill profile, anonymous profile display, basic swipe UI.
- **Week 5**: Matching algorithm in Postgres function, ranked feed for both sides, match creation.
- **Week 6**: Realtime chat after match, DeepSeek CV generation flow.
- **Week 7**: DSGVO endpoints (export, delete), audit logging, polish.
- **Week 8**: Internal testing on TestFlight and Play Internal, bug fixes, prep for first 5 employer pilots.
