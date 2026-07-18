# Recruiter Web-Admin (grosser Chunk)

**Priorität:** P2
**Wer:** unassigned
**Status:** open

## Ziel
Company-Nutzer können sich anmelden, Firma anlegen, Jobs erstellen, Kandidaten swipen und Matches freigeben. Das ersetzt die Dev-Auto-Trigger.

## Warum jetzt
Ohne echte Recruiter ist die App nur eine Demo. Kein Umsatz möglich.

## Scope
Riesig — braucht eigenen Plan-File. Grobe Chunks:
1. `apps/admin` Setup: Next.js 16 App-Router, Tailwind CSS 4, `@supabase/ssr`, `next-safe-action`
2. Auth-Flow im Admin (Magic-Link + Password)
3. Company-Onboarding: Legal-Name, VAT-ID, Adresse, Stripe-Customer
4. Job-Erstellung: Formular mit Zod + `job_criteria` picker (Skills-Autocomplete)
5. Kandidaten-Feed für Recruiter (spiegelbildlich zum Seeker-Feed)
6. Match-Freigabe UI (statt Auto-Approve)
7. Stripe-Subscription-Setup

## Betroffene Dateien
- Ganzer `apps/admin` Sub-Baum
- Migration 0009: RLS-Policies für Recruiter-Zugriff auf jobs/matches
- Neue Edge-Function `create-company-with-stripe`

## Akzeptanzkriterien
Detaillierter Plan-File wird geschrieben bevor Codex/Claude anfängt.

## Grenzen für V1
- Nur 1 Recruiter pro Company (Multi-User später)
- Kein Team-Feature
- Kein White-Label
- Nur Deutschland (VAT, DSGVO)

## Abhängigkeiten
- Stripe-Account
- Domain (für Vercel-Deploy)
- Sinnvoll erst wenn Arbeitnehmer-Flow rock-solid ist
