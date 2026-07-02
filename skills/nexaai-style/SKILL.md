---
name: nexaai-style
description: Code-Style, Commit-Konventionen und Text-Regeln für NexaAi
---

# NexaAi Style Skill

## Regeln

### Keine Em-Dashes anywhere

**Impact:** MEDIUM

Weder in Code-Kommentaren, Commit-Messages, Docs, noch in User-facing Text. Nutze Doppelpunkt, Komma oder Klammer stattdessen.

**Falsch:**
```typescript
// Match wird erstellt — wenn beide swipen
```

**Richtig:**
```typescript
// Match wird erstellt: wenn beide swipen
```

### User-facing Text auf Deutsch

**Impact:** HIGH

Alle Fehlermeldungen, Buttons, Labels sind auf Deutsch. Code-Kommentare bleiben englisch.

**Falsch:**
```typescript
throw new Error('Profile not found')
```

**Richtig:**
```typescript
throw new UserFacingError('Profil nicht gefunden')
// Code-Kommentar bleibt englisch:
// Throws if seeker profile does not exist
```

### Conventional Commits

**Impact:** MEDIUM

Format: `type(scope): description`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`
Scopes: `mobile`, `admin`, `db`, `functions`, `config`, `matching`, `types`

**Beispiele:**
- `feat(mobile): add seeker profile onboarding step 1`
- `fix(db): correct RLS policy on matches table`
- `chore(config): update env var validation`

### File-Naming Konventionen

**Impact:** LOW

- Dateien: kebab-case (`seeker-profile.ts`)
- React-Komponenten-Dateien: PascalCase (`SeekerProfileForm.tsx`)
- Ordner: kebab-case (`seeker-profile/`)

### Import-Order

**Impact:** LOW

Reihenfolge:
1. React/React Native
2. External Libraries
3. Internal Packages (@nexaai/*)
4. Relative Imports
5. Types (mit `type` keyword)

```typescript
import { useState } from 'react'
import { View, Text } from 'react-native'

import { z } from 'zod'
import { useForm } from 'react-hook-form'

import { supabase } from '@nexaai/db'
import { SeekerProfileSchema } from '@nexaai/types'

import { ProfileForm } from './profile-form'

import type { SeekerProfile } from '@nexaai/types'
```

### Kein Semikolon am Zeilenende

**Impact:** LOW

Wir folgen dem modernen JavaScript-Style ohne Semikolons. Prettier ist entsprechend konfiguriert.

**Falsch:**
```typescript
const foo = 42;
export default foo;
```

**Richtig:**
```typescript
const foo = 42
export default foo
```

### Single Quotes statt Double Quotes

**Impact:** LOW

**Falsch:**
```typescript
import { View } from "react-native"
```

**Richtig:**
```typescript
import { View } from 'react-native'
```

Ausnahme: JSX-Attribute nutzen double quotes (React-Konvention).
```tsx
<Text style={{ color: "red" }}>Hallo</Text>
```
