# NexaAi: Production-Readiness Checkliste

Das hier ist die "was dürfen wir nicht vergessen"-Liste. Strukturiert nach Kategorien mit Priorität:

- **[P0]** = muss vor Launch. Fehlt es, launchen wir nicht.
- **[P1]** = sollte vor Launch. Fehlt es, launchen wir mit Risiko.
- **[P2]** = nach Launch okay. Vor Skalierung nötig.

Ich habe alles zusammengefasst, was Solo-Founder oft vergessen und was dann bei Launch beißt.

## Sicherheit

### Auth

- [P0] E-Mail-Verifikation bei Signup (Supabase Auth macht das nativ, muss aktiviert sein)
- [P0] Password Requirements: mindestens 12 Zeichen, keine gängigen Passwörter (Supabase Auth Setting)
- [P0] Rate Limiting auf Login und Signup (Supabase Auth hat das, muss aktiviert und konfiguriert werden)
- [P0] Session-Timeout: Refresh Token 7 Tage, Access Token 1h
- [P1] CAPTCHA bei Signup (Cloudflare Turnstile ist gratis und DSGVO-konform)
- [P1] Passwort-Reset-Flow getestet und dokumentiert
- [P2] MFA für Recruiter-Accounts (die haben Zugriff auf sensible Bewerber-Daten)

### RLS (Row Level Security)

- [P0] Alle Tabellen haben RLS enabled. Kein `service_role` Zugriff außer in Edge Functions
- [P0] Policies sind mit Kommentaren dokumentiert (WHY diese Policy existiert)
- [P0] Automated Test: für jede Tabelle Testen dass user_a nicht die Daten von user_b sehen kann
- [P1] Regelmäßiger RLS-Audit (monatlich): sind alle neuen Tabellen abgesichert?

### Secrets

- [P0] Nichts geheimes im Repo. Auch nicht in .env.example (nur Platzhalter mit Erklärung)
- [P0] Alle Secrets in Vercel Env Vars (Prod) und Supabase Secrets (Edge Functions)
- [P0] Lokal: `.env.local` in `.gitignore`
- [P0] Git-Hook (pre-commit) der auf potentielle Secrets scannt (via `gitleaks` oder `trufflehog`)
- [P1] Secret-Rotation-Plan: alle 90 Tage manuelles Rotate für Prod-Secrets

### API-Sicherheit

- [P0] Rate Limiting auf allen Edge Functions (per IP oder per User)
- [P0] Alle Endpunkte mit Zod-Schema validieren (Input)
- [P0] Keine Direkt-Aufrufe zu DeepSeek vom Client (nur via Edge Functions)
- [P0] Stripe Webhook Signature Verification zwingend
- [P1] CSP-Header konfigurieren (Content Security Policy) in Next.js
- [P1] CORS strict konfiguriert
- [P2] WAF (Web Application Firewall) via Cloudflare wenn wir viel Traffic bekommen

### Input-Validation

- [P0] Zod-Schema für ALLE Inputs (API, Formulare, Edge Functions)
- [P0] SQL-Injection: Supabase-SDK schützt, aber trotzdem prüfen dass wir keine raw SQL mit User-Input haben
- [P0] XSS: React entkommt per Default, aber `dangerouslySetInnerHTML` verboten
- [P1] File-Upload-Validation: MIME-Type checken, Größe limitieren, keine executable Files

## DSGVO / Rechtliches (Deutschland-spezifisch)

Ich weiß dass du damit vertraut bist, aber hier die Checkliste damit nichts vergessen wird:

### Pflicht-Inhalte auf der Website

- [P0] **Impressum** (§ 5 TMG) mit voller Adresse, Vertretungsberechtigte, Kontakt, Registereintrag wenn GmbH
- [P0] **Datenschutzerklärung** (Art. 13 DSGVO) mit allen Verarbeitern (DeepSeek, Mistral, Stripe, Sentry, PostHog, Vercel, Supabase)
- [P0] **AGB** für die Nutzung (spezifisch Bewerber vs. Arbeitgeber)
- [P1] **Cookie-Banner** wenn wir Analytics einsetzen (PostHog braucht Consent für IP-Speicherung in Deutschland)

### Auftragsverarbeitungs-Verträge (AVV / DPA)

- [P0] AVV mit Supabase (haben sie als Template)
- [P0] AVV mit Vercel
- [P0] AVV mit Stripe
- [P0] AVV mit Sentry
- [P0] AVV mit PostHog
- [P1] AVV oder SCC mit DeepSeek (schwierig, deswegen Fallback auf Mistral EU planen)

### User-Rechte-Endpunkte

- [P0] **Auskunft** (Art. 15): User kann alle Daten runterladen (JSON)
- [P0] **Löschung** (Art. 17): User kann Account löschen mit 30-Tage-Frist
- [P0] **Datenübertragbarkeit** (Art. 20): Export als portables Format
- [P0] **Widerspruch** (Art. 21): Opt-out aus Matching
- [P1] **Berichtigung** (Art. 16): User kann Daten korrigieren (via normale Profil-Edit-Funktion)

### Datenschutz-Konzepte

- [P0] **Löschkonzept**: was wird nach welcher Zeit automatisch gelöscht?
  - Inaktive Bewerber-Accounts nach 24 Monaten
  - Abgelehnte Bewerbungen nach 6 Monaten
  - Audit-Logs nach 12 Monaten
  - Payment-Daten nach gesetzlicher Frist (10 Jahre)
- [P0] **TOM (Technisch-Organisatorische Maßnahmen)**: dokumentiert für Aufsichtsbehörde
- [P1] **VVT (Verzeichnis der Verarbeitungstätigkeiten)** nach Art. 30 DSGVO

### Automatisierte Entscheidungen (Art. 22)

- [P0] User (Bewerber) muss wissen dass Matching automatisiert läuft
- [P0] Recht auf menschliche Überprüfung bei negativer Automatik-Entscheidung dokumentiert
- [P0] Kein Auto-Reject nur durch Algorithmus (Recruiter muss finale Entscheidung treffen)

### DSGVO-Verstoß-Prozess

- [P1] **Data Breach Notification Playbook**: wer macht was innerhalb der 72h-Frist wenn Datenleck?
  - Wer wird informiert (Aufsichtsbehörde, betroffene User, Investoren)
  - Wie kommunizieren wir
  - Wie stellen wir Ursache fest

## Observability

### Error Tracking

- [P0] **Sentry** in Mobile-App, Web-Admin, Edge Functions
- [P0] Source Maps hochgeladen (sonst Stacktraces unbrauchbar)
- [P0] Alerting: Slack oder E-Mail bei Prod-Fehlern
- [P1] Error-Budgets: max. 1% Error Rate akzeptiert, sonst Rollback

### Analytics

- [P1] **PostHog EU Cloud** für Product-Analytics
- [P1] Tracked Events: Signup, Profile-Completion, Job-Post, Swipe, Match, Chat, Subscription
- [P1] Kein PII in Events (User-ID hashen)
- [P2] Funnels für Onboarding-Completion

### Uptime

- [P1] **Better Stack** oder **UptimeRobot** für Public-Facing URLs
- [P1] Status Page: status.nexaai.de (Better Stack macht das)
- [P1] Ping-Intervall: 1 Minute
- [P1] Alerts: E-Mail an dich, SMS bei Downtime > 5 Minuten

### Logs

- [P1] Strukturierte Logs (JSON) in Edge Functions
- [P1] Log-Retention: 30 Tage default, wichtige Events in Audit-Log-Tabelle länger
- [P2] Log-Aggregation: Supabase + Vercel + Sentry haben eigene, evt. später Better Stack Logs

## Testing

Als Solo-Dev mit KI-Tools kannst du dir mehr Tests leisten als du denkst (opencode schreibt sie).

### Testing-Strategie

- [P0] **TypeScript** überall (kompilierbar = erste Test-Ebene)
- [P0] **Zod-Validation** an allen Grenzen (Runtime-Safety)
- [P1] **Unit Tests** für kritische Business-Logik:
  - Matching-Algorithmus
  - Score-Berechnungen  
  - Stripe-Webhook-Handler
  - DSGVO-Export-Logik
- [P1] **Integration Tests** für RLS-Policies (bereits als P0 erwähnt aber wiederhole hier)
- [P2] **E2E Tests** für kritische User-Flows (später via Detox für Mobile, Playwright für Admin)

### CI/CD

- [P0] **GitHub Actions** Workflow: bei jedem Push und PR
  - `pnpm install`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
- [P0] Merge zu `main` nur wenn CI grün
- [P1] Auto-Deploy `main` zu Staging (auto)
- [P1] Manueller Trigger für Prod-Deploy (via GitHub Action)

## Deployment und Environments

### Environments

- [P0] **Development** (lokal): Supabase Local via CLI, Docker Compose
- [P0] **Staging** (Vercel Preview + Supabase Staging-Projekt): für Investor-Demos, für interne Tests
- [P0] **Production** (Vercel Prod + Supabase Prod): für echte User

**Wichtig:** Staging und Prod haben SEPARATE Supabase-Projekte. Nicht eins mit "test" und "prod" Schemas mischen.

### Deployment-Prozess

- [P0] Alle Environments haben eigene Env-Vars
- [P0] Migrations laufen vor App-Deploy (via GitHub Action)
- [P0] Rollback-Plan: wie deployen wir eine ältere Version wenn was kaputt geht?
  - Vercel: instant rollback per UI
  - Supabase: Migrations sind nicht trivial rückwärts, deswegen additive Migrations bevorzugen
- [P1] Blue-Green oder Rolling Deployments (Vercel macht das automatisch)

### Feature Flags

- [P2] Für MVP verzichten. Später sinnvoll wenn wir mit A/B-Tests starten.

## Backups und Disaster Recovery

### Supabase Backups

- [P0] Daily Automated Backups (Supabase Pro Plan hat das)
- [P0] Point-in-Time Recovery (PITR): letzte 7 Tage minutengenau
- [P1] Manueller Backup-Test: einmal pro Monat wirklich restoren um zu prüfen dass es funktioniert

### Datenverlust-Szenarien

- [P1] Was passiert wenn ein Bewerber-Profil versehentlich gelöscht wird?
  - Antwort: soft-delete Pattern nutzen (deleted_at Spalte statt DELETE)
- [P1] Was passiert wenn Supabase down ist?
  - Antwort: Status Page schaltet automatisch, User sehen "Wartungsfenster"

### Vercel Rollback

- [P0] Instant Rollback via UI (Vercel macht das für uns)

## Kosten-Monitoring

Als Bootstrap-Startup wichtig:

- [P1] **Supabase**: Alert wenn wir 80% des Limits erreichen (DB-Größe, Bandwidth, Compute)
- [P1] **Vercel**: Alert wenn Traffic ungewöhnlich hoch (könnte Angriff sein)
- [P1] **DeepSeek**: Monatliches Budget-Cap (z.B. 100€ Hard-Cap für MVP)
- [P1] **Sentry**: Free Tier hat 5000 Errors/Monat, dann teurer
- [P1] **PostHog**: Free Tier hat 1M Events/Monat, dann teurer

**Empfehlung:** monatliches "Cost Review" (15 Min am Anfang jedes Monats). Kein spontanes 4-stelliges Cloud-Bill.

## Legal & Business (spezifisch für dich als Gründer)

### Vor Launch

- [P0] Klar wer ist die rechtliche Entität? Bist du persönlich Haftbar (Einzelunternehmen) oder gründet ihr eine UG/GmbH?
  - Für ein Recruiting-Tool das mit sensiblen Bewerber-Daten arbeitet: UG mindestens. Bewerbergen können gegen dich als Privatperson klagen.
- [P0] Gewerbeanmeldung
- [P0] Steuerlich klar (Umsatzsteuer-ID, Kleinunternehmerregelung nein weil B2B)
- [P1] Berufshaftpflichtversicherung (IT-Beratung/-Entwicklung)
- [P1] Cyber-Versicherung (Data-Breach-Kosten sind schnell 5-stellig)

### Verträge

- [P0] AGB für Bewerber (Nutzungsbedingungen der App)
- [P0] AGB für Unternehmen (mit Abo-Kündigungsfristen, SLA falls versprochen, Haftung)
- [P0] Datenschutzhinweise separat pro Rolle
- [P1] Co-Founder-Vertrag mit deinem Partner (vor Investor-Termin!)
- [P1] Vesting-Vereinbarung (Standard: 4 Jahre, 1 Jahr Cliff)

## Support und User-Kommunikation

### Kommunikationskanäle

- [P1] Support-Email (support@nexaai.de) mit Auto-Antwort
- [P1] In-App-Feedback-Button (Hilfe / Bug melden)
- [P2] Live-Chat (später via Intercom oder Crisp) - nicht MVP

### Nutzer-Onboarding

- [P0] Willkommens-E-Mail nach Signup
- [P0] E-Mail bei Match (mit Deep-Link zum Chat)
- [P1] E-Mail-Sequenzen für inaktive User (Reaktivierung)
- [P1] Wichtig: Alle E-Mails müssen unsubscribe-Link haben (§ 7 UWG)

### E-Mail-Versand

- [P0] Nicht über Supabase-Default (limitiert). Nutze **Resend** oder **Postmark** (beide EU-Optionen).
- [P0] Transactional E-Mails vs Marketing E-Mails getrennt
- [P0] SPF, DKIM, DMARC richtig konfigurieren (sonst Spam-Ordner)

## Marketing und Growth (nach Launch)

Nur zur Übersicht, nicht Fokus für MVP:

- [P2] Website nexaai.de mit Landing Page
- [P2] Blog für SEO (Ranking auf "IT-Recruiting Hamburg", "Zerspanungsmechaniker finden", etc.)
- [P2] LinkedIn-Präsenz
- [P2] Case Studies der ersten erfolgreichen Matches

## Hamburg-Spezifisch (Region)

- [P1] Handelsregister-Eintrag Hamburg
- [P1] IHK-Mitgliedschaft (Pflicht wenn GmbH)
- [P1] Kontakte zu Hamburg Startup Hub (Kickstart, HHIT, betahaus)
- [P2] Bewerbung IFB Hamburg InnoRampUp Förderung (bis 150k€ als Zuschuss)

## Was ich für dich vorbereiten kann

Sobald wir starten:

1. Setup GitHub Actions CI-Pipeline
2. Sentry-Integration in allen drei Apps
3. PostHog-Setup mit ersten Events
4. Env-Vars-Validierung mit Zod in packages/config
5. Docker Compose für lokale Entwicklung
6. Migration-Runner Skript mit Rollback-Fähigkeit
7. E-Mail-Templates (Deutsch, transactional)
8. Impressum + Datenschutzerklärung Vorlage (aber echten Anwalt drüberschauen lassen!)
9. AVV-Vorlagen anfordern und ausfüllen

## Was du selbst machen musst

Was nicht Code ist und was ich dir nicht abnehmen kann:

1. UG oder GmbH gründen (Notar-Termin)
2. Gewerbe anmelden
3. Bankkonto für Firma
4. Steuerberater engagieren
5. Anwalt für AGB und Datenschutz (Standard 500-1500€)
6. Versicherungen abschließen
7. AVVs mit Vendors gegenzeichnen
8. Co-Founder-Vertrag mit Partner

**Zeitschätzung für den nicht-Code-Kram:** 4-6 Wochen wenn du dranbleibst. Kann parallel zum Coding laufen.
