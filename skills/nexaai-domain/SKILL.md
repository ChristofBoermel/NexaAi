---
name: nexaai-domain
description: NexaAi Domain-Logik, Matching-Regeln und DSGVO-Anforderungen
---

# NexaAi Domain Skill

Regeln zur Business-Logik unseres Matching-Systems.

## Regeln

### Match-Score-Berechnung immer über die Postgres-Function

**Impact:** CRITICAL

Match-Score wird ausschließlich in der `match_score()` Postgres-Function berechnet, nie im App-Code. Grund: der Score muss deterministisch sein und in RLS-Policies nutzbar.

**Falsch:**
```typescript
// Im Frontend
const score = calculateMatchScore(seeker, job)
```

**Richtig:**
```typescript
const { data } = await supabase
  .rpc('match_score', { seeker_id, job_id })
```

### Anonymisierung ist Standard, nicht Ausnahme

**Impact:** CRITICAL

Bewerber-Profile werden IMMER anonymisiert dargestellt, außer wenn ein bestätigter Match vorliegt. Kein Feature darf das umgehen.

Die Anonymisierung passiert auf View-Ebene (`recruiter_candidate_view`), nicht im App-Code. Das heißt: RLS auf der View liefert automatisch die anonymisierten Daten.

**Vor dem Match sichtbar:**
- Anonymer Anzeigename ("Senior Developer #4521")
- Skills mit Level
- Berufserfahrung in Jahren
- Gehaltsvorstellung
- Region (Hamburg, kein exakter Stadtteil)

**Nach dem Match zusätzlich sichtbar:**
- Echter Name
- Echte E-Mail
- Vollständiger Lebenslauf

### DeepSeek-Calls nur aus Edge Functions mit PII-Stripping

**Impact:** CRITICAL

DeepSeek läuft in China. Vor jedem Call: personenbezogene Daten strippen (Name, exakte Adresse, Geburtsdatum). Wenn PII nötig ist: Fallback auf Mistral EU.

**Falsch:**
```typescript
// Im Client oder Edge Function
await deepseek.chat({
  messages: [{ role: 'user', content: fullCV }]  // enthält Name, Adresse
})
```

**Richtig:**
```typescript
// In Edge Function
const stripped = stripPII(fullCV)
await deepseek.chat({
  messages: [{ role: 'user', content: stripped }]
})
```

### KI-Ergebnisse müssen vom User bestätigt werden

**Impact:** HIGH

Kein KI-generierter Inhalt (Lebenslauf, Job-Anzeige) wird ohne explizite User-Bestätigung veröffentlicht. Grund: DSGVO Art. 22 und Qualitätskontrolle.

**Muster:**
1. KI generiert Draft
2. User sieht Preview
3. User klickt "Bestätigen" oder editiert
4. Erst dann Persist

### Audit-Log für sensible Aktionen

**Impact:** HIGH

Folgende Aktionen werden in `audit_log` Tabelle protokolliert:
- Bewerber-Profil angesehen (welcher Recruiter, welches Profil, wann)
- Match erstellt oder gelöscht
- KI-Generierung (welches Modell, welche Prompt-Version)
- Zahlungs-Events (Stripe)
- DSGVO-Aktionen (Export, Löschung)

Das Log-Schreiben passiert in Postgres-Triggern, nicht im App-Code. Grund: App-Code kann vergessen werden, Trigger nicht.

### Automatisierte Entscheidungen sind zurückweisbar

**Impact:** HIGH (DSGVO Art. 22)

Kein automatischer Reject nur durch Algorithmus. Der Matching-Threshold filtert nur, entscheidet nicht. Die finale "Match ja/nein" Entscheidung liegt immer bei einem menschlichen Recruiter.

Praktisch: der User sieht auch bei Threshold-Unterschreitung nicht "abgelehnt", sondern der Job erscheint einfach nicht in seinem Feed. Andersrum kann der Recruiter Bewerber unterhalb des Thresholds bewusst anschauen wenn er will.

### Prompts sind versioniert

**Impact:** MEDIUM

Alle Prompts für KI-Calls leben in `packages/prompts/*.ts` als Konstanten. Beim Ändern eines Prompts wird die Version-Nummer im Kommentar hochgezählt und im audit_log mit gespeichert.

**Beispiel:**
```typescript
// packages/prompts/cv-generation.ts
export const CV_GENERATION_PROMPT_V3 = `
Du bist ein professioneller Lebenslauf-Autor. ...
`
export const CV_GENERATION_PROMPT_VERSION = 3
```
