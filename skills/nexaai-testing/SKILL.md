---
name: nexaai-testing
description: Test-Strategie und -Patterns für NexaAi
---

# NexaAi Testing Skill

## Regeln

### Was getestet werden muss

**Impact:** HIGH

Diese Bereiche haben Unit-Tests als Pflicht:
- Matching-Algorithmus (`packages/matching`)
- Zod-Schemas (`packages/types`)
- Stripe-Webhook-Handler (`apps/functions/stripe-webhook`)
- DSGVO-Export-Logik (`apps/functions/dsgvo-export`)
- PII-Stripping-Funktionen (`apps/functions/_shared`)

### RLS-Policies müssen Integration-Tests haben

**Impact:** CRITICAL

Für jede Tabelle gibt es einen Test: kann User A die Daten von User B sehen? Antwort muss "nein" sein.

**Muster:**
```typescript
describe('seeker_profiles RLS', () => {
  it('prevents user_a from seeing user_b profile', async () => {
    const clientA = getAuthedClient(userA.token)
    const { data, error } = await clientA
      .from('seeker_profiles')
      .select('*')
      .eq('user_id', userB.id)
    
    expect(data).toEqual([])
  })
})
```

### Test-Namen sprechen aus was passiert

**Impact:** LOW

**Falsch:**
```typescript
it('works', () => { ... })
it('test 1', () => { ... })
```

**Richtig:**
```typescript
it('returns 0 when no skills overlap', () => { ... })
it('caps score at 100 when weights exceed 100%', () => { ... })
```

### Test-Framework

**Impact:** LOW

- **Vitest** für alles außer Mobile (schneller als Jest, native ESM)
- **Jest** nur für React Native (Expo default)
- **Playwright** für Web-E2E (V1, nicht MVP)
- **Detox** für Mobile-E2E (V1, nicht MVP)

### Fixtures und Seeds

**Impact:** MEDIUM

Test-Daten leben in `packages/db/seed/test-fixtures.ts`. Keine hardcoded UUIDs in Tests, immer aus Fixtures.

**Falsch:**
```typescript
const userId = '550e8400-e29b-41d4-a716-446655440000'
```

**Richtig:**
```typescript
import { testFixtures } from '@nexaai/db/seed'
const userId = testFixtures.users.alice.id
```

### E2E Tests kommen später

**Impact:** LOW

Kein Detox oder Playwright im MVP. Manuelles Testen mit TestFlight und Play Internal ist ausreichend. E2E-Tests werden V1-Feature wenn wir echte User haben.

### AAA-Pattern für Tests

**Impact:** LOW

Arrange, Act, Assert - klar durch Leerzeilen getrennt:

```typescript
it('calculates match score correctly', () => {
  // Arrange
  const seeker = testFixtures.seekers.alice
  const job = testFixtures.jobs.seniorDeveloper
  
  // Act
  const score = calculateMatchScore(seeker, job)
  
  // Assert
  expect(score).toBe(85)
})
```
