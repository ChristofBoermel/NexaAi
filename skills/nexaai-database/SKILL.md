---
name: nexaai-database
description: Regeln für Datenbank-Operationen in NexaAi mit Supabase, RLS und Postgres
---

# NexaAi Database Skill

Verbindliche Regeln beim Umgang mit unserer Supabase-Datenbank.

## Regeln

### Immer den richtigen Supabase-Client verwenden

**Impact:** CRITICAL

Nutze niemals den `service_role` oder Secret Key im Client-Code. Der ist ausschließlich für Edge Functions und Server-side Code (Next.js Server Actions, Route Handlers).

**Falsch:**
```typescript
// Im Mobile-App oder Client Component
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY  // NEIN: Secret Key im Client
)
```

**Richtig:**
```typescript
// Im Mobile-App oder Client Component
import { supabase } from '@/lib/supabase'  // nutzt PUBLISHABLE_KEY
```

### Neue Migrations nie zurückrollen

**Impact:** HIGH

Wenn eine Migration schon auf einer Umgebung lief, wird sie nicht mehr geändert. Für Korrekturen: neue Migration schreiben, alte nicht anfassen.

**Falsch:**
```sql
-- migrations/0003_add_seeker_bio.sql
-- Dieses File direkt editieren, obwohl es schon gelaufen ist
```

**Richtig:**
```sql
-- migrations/0007_alter_seeker_bio_length.sql
alter table seeker_profiles alter column bio type text;
```

### RLS-Policies immer mit Kommentar

**Impact:** HIGH

Jede RLS-Policy hat einen Kommentar der erklärt WARUM sie so aussieht. Sonst weiß in 6 Monaten keiner mehr warum.

**Falsch:**
```sql
create policy select_own_profile on seeker_profiles
for select using (auth.uid() = user_id);
```

**Richtig:**
```sql
-- Bewerber sehen nur ihr eigenes Profil, außer bei aktivem Match:
-- der Recruiter sieht das Profil dann über die recruiter_candidate_view
create policy select_own_profile on seeker_profiles
for select using (auth.uid() = user_id);
```

### Keine Raw SQL im App-Code

**Impact:** HIGH

Nutze immer die Supabase-SDK oder Views. Kein raw SQL via `.rpc()` außer für unsere match_score Function.

**Falsch:**
```typescript
const { data } = await supabase.rpc('exec_sql', {
  sql: `select * from jobs where status = '${status}'`
})
```

**Richtig:**
```typescript
const { data } = await supabase
  .from('jobs')
  .select('*')
  .eq('status', status)
```

### Generated Types nutzen

**Impact:** MEDIUM

Nach jeder Migration `supabase gen types typescript` laufen lassen und die generierten Types in `packages/db/types` committen. Nie manuell TypeScript-Types für DB-Zeilen schreiben.

### Soft-Delete statt Hard-Delete

**Impact:** HIGH

Nutzer-Daten werden nicht via DELETE entfernt, sondern via `deleted_at` Timestamp. Ausnahme: DSGVO-Löschung nach der 30-Tage-Frist.

**Falsch:**
```typescript
await supabase.from('seeker_profiles').delete().eq('id', id)
```

**Richtig:**
```typescript
await supabase
  .from('seeker_profiles')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', id)
```

### Realtime nur für Match und Chat

**Impact:** MEDIUM

Supabase Realtime kostet Verbindungen. Wir aktivieren es nur für zwei Tabellen:
- `matches` (User sieht sofort wenn ein neuer Match entsteht)
- `messages` (Chat-Nachrichten in real time)

Nicht für: Profile-Updates, Job-Feed-Updates. Die werden per Pull auf Focus geladen.
