# NexaAi — DSGVO Compliance Design

## Why this document exists

NexaAi processes personal data (names, employment history, salary expectations, location, AI-generated CVs) and makes automated decisions that affect users' job opportunities. This puts it squarely inside the GDPR/DSGVO scope, specifically:

- **Art. 6**: Lawful basis for processing
- **Art. 9**: Special category data (not used in MVP, but skills can imply union membership, health, ethnicity — needs care)
- **Art. 22**: Automated individual decision-making
- **Art. 15-22**: Data subject rights (access, deletion, portability, objection)
- **Art. 32**: Security of processing
- **Art. 33**: Breach notification

This document is not a legal opinion. Get a real DPO review before going to production. But the architecture decisions below make compliance achievable rather than retrofitted.

## Lawful basis

| Processing activity | Lawful basis |
|---|---|
| Seeker creates profile and uses matching | Art. 6(1)(b) — contract performance |
| Recruiter posts jobs and reviews candidates | Art. 6(1)(b) — contract performance |
| Stripe billing | Art. 6(1)(b) — contract performance |
| Audit log of sensitive actions | Art. 6(1)(c) — legal obligation; Art. 6(1)(f) — legitimate interest |
| AI-generated CV draft | Art. 6(1)(a) — explicit consent at CV generation flow |
| Sending DeepSeek skill data for CV generation | Art. 6(1)(a) — explicit consent + Art. 28 DPA with DeepSeek |
| Push notifications | Art. 6(1)(a) — explicit opt-in |
| Product analytics (if added) | Art. 6(1)(a) — explicit opt-in cookie banner |

## Art. 22: Automated decision-making

The matching algorithm is automated decision-making that significantly affects users (whether their profile is shown to an employer). Two mitigations:

1. **Transparency**: The seeker can see, for any job that matched, exactly which criteria contributed to the score. The recruiter can see the same. Both sides see the algorithm's "reasoning."
2. **Human review on request**: A seeker can request a manual review of why they didn't match a job they expected to. Implementation: a button in the app that creates a support ticket, routed to NexaAi staff who can manually inspect criteria and either explain or override.

Override mechanism (post-MVP but architecturally reserved): an admin can set a `manual_match` flag on a (seeker, job) pair that bypasses the threshold filter.

## Data minimization

Pre-match, the recruiter sees:
- Pseudonym (e.g., "Developer #4521")
- Years of experience
- Salary range
- Approved CV markdown (no real name, no employer names visible)
- Match score and breakdown
- Bio (limited to 280 chars, user-controlled)

Pre-match, the seeker sees:
- Company pseudonym (if `show_anonymous = true`) or real name
- Industry, size category
- Job title and description
- Salary range
- Match score breakdown

Post-mutual-match, both sides see real identities and contact info.

PII fields (`profiles.real_name`, `profiles.email`) are stored encrypted via `pgsodium` column-level encryption. Decryption keys live in Supabase Vault. RLS policies only return decrypted values when `matches.is_mutual = true`.

## Data residency

All data hosted in EU (Frankfurt):

- Supabase project: EU-Central-1 region
- Vercel deployment: EU edge regions
- Stripe: EU-resident merchant account (Germany)
- Sentry: EU data residency option enabled
- DeepSeek API: this is the one external transfer

### The DeepSeek problem

DeepSeek's API servers are in China. Sending personal data there triggers Chapter V of GDPR (transfers to third countries without adequacy decision).

**Mitigations:**

1. **Strip PII before sending**: The CV generation Edge Function never sends real names, emails, or specific employer names. It sends structured skill data only: skill slugs, levels, years used, generic role descriptors. The function constructs a German-language CV template that the user then fills with their identity locally on the client.

2. **Explicit consent**: At first CV generation, the user sees a clear notice: "Your skill data (without name or contact info) will be sent to DeepSeek (China) to generate a CV draft. The draft is shown to you before publication. Continue?" — with an alternative option to write the CV manually.

3. **Standard Contractual Clauses (SCCs)**: Sign DeepSeek's DPA + SCCs before going to production. If they don't offer compliant SCCs, switch to an EU-hosted alternative (Mistral, hosted-EU OpenAI via Microsoft Azure EU, or a self-hosted model).

4. **V1 escape hatch**: A toggle in user settings to use only EU-hosted models for CV generation. Default in MVP can be either way depending on what feels honest to communicate at launch.

## Data subject rights

Each right is implemented as an Edge Function callable from the app UI.

### Art. 15 — Right of access (export)

`dsgvo-export` Edge Function:

1. Authenticates the calling user via JWT.
2. Queries every table where the user appears (profiles, seeker_profiles or recruiter_profiles, seeker_skills, matches, messages, ai_generations, audit_log, subscriptions if recruiter).
3. Decrypts PII fields for the requesting user only.
4. Bundles output as a JSON file in Supabase Storage with a signed URL valid for 24 hours.
5. Emails the user the link.
6. Writes `audit_log` entry: action `profile_exported`.

Implementation note: the export must include AI-generated content (CV drafts) and a human-readable explanation of any automated decisions affecting them ("you were shown to company X with score Y because of criteria Z").

### Art. 17 — Right to erasure (delete)

`dsgvo-delete` Edge Function:

1. Authenticates the calling user.
2. Shows a confirmation dialog in the app first ("This action is permanent. Type DELETE to confirm.").
3. Backend:
   - Anonymizes any messages the user sent in matches (replace sender with "deleted_user", keep message body so the other party still has their chat history)
   - Deletes profile, seeker_profile or recruiter_profile, seeker_skills, ai_generations
   - Cascades through matches (FK on delete cascade)
   - Cancels Stripe subscription if recruiter
   - Deletes Supabase auth.users record (cascades the profile)
4. Writes a final `audit_log` entry: action `profile_deleted`, `subject_id` retained for legal hold reasons (logs must survive deletion for compliance).
5. After 30 days, a scheduled job purges the audit entries for this user (statute of limitations for typical claims; adjust based on actual legal advice).

### Art. 20 — Right to portability

Same as export but in a structured machine-readable format (the JSON output is already this).

### Art. 21 — Right to object

A seeker can disable matching globally (status flag on profile). A recruiter can pause all jobs. Both via UI toggles.

## Audit log requirements

Every row in `audit_log` represents an event the company must be able to explain to a regulator or to the data subject themselves. The schema (see `data-model.md`) captures actor, subject, action, metadata, and timestamp.

Audit log entries are append-only. There is no UPDATE or DELETE policy. Even when a user is deleted, their audit log entries are anonymized (actor/subject set to null) but rows persist for the retention period.

## Security architecture

- All connections TLS 1.3, no exceptions.
- Database connections use Postgres role-based auth; the anon and authenticated roles have only the permissions RLS grants.
- Service role key (which bypasses RLS) is used only in Edge Functions, never exposed to clients.
- Stripe webhook signatures are verified before processing.
- DeepSeek API key stored in Supabase Vault, retrieved only by the `cv-generate` Edge Function at runtime.
- Sentry configured to scrub PII from error reports.
- No PII in application logs. Edge Functions log structured events with user IDs only.

## Breach notification

If a data breach is detected (Sentry alert, Supabase intrusion detection, anomalous access pattern):

1. Internal: an `oncall@nexaai.de` alert fires.
2. Within 72 hours of becoming aware: notify the competent supervisory authority (in Hamburg: HmbBfDI).
3. If high risk to data subjects: notify affected users without undue delay.
4. Document the breach in an internal incident log.

This process is not yet implemented in MVP code — it's a runbook the founder follows manually until automation is justified. Add to V1 roadmap.

## What we are deliberately NOT doing in MVP

- Cookie banner / consent management platform: the mobile app has no third-party trackers in MVP. The admin web has only first-party Supabase auth cookies, which don't require consent.
- DPO appointment: not legally required at MVP scale (under regular processing of special category data). Document the decision and revisit at €1M ARR or 50 employees.
- ROPA (Verzeichnis der Verarbeitungstätigkeiten): required from day one for any company processing personal data. A starter template is checked into `docs/ropa.md` (not yet written; mark as a Week 1 deliverable).
- ToS, Privacy Policy, Imprint: drafted by a German lawyer before launch. Placeholders in repo until then.

## Compliance checklist before MVP launch

- [ ] Supabase project provisioned in EU region
- [ ] Vercel project EU-only edge regions configured
- [ ] DeepSeek DPA signed and SCCs in place, OR EU-hosted model alternative ready
- [ ] Privacy Policy drafted by lawyer, published
- [ ] ToS drafted by lawyer, published
- [ ] Imprint (Impressum) per German TMG published
- [ ] Cookie banner if any third-party trackers added
- [ ] All four DSGVO Edge Functions implemented and tested: export, delete, plus the algorithmic transparency endpoint
- [ ] Audit log triggers in place on all sensitive tables
- [ ] Encryption at rest verified for PII columns
- [ ] Breach response runbook documented
- [ ] ROPA template completed and stored
- [ ] DPO assessment documented (likely not required, but record the decision)
