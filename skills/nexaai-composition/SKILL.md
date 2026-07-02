---
name: nexaai-composition
description: React/React Native Composition-Patterns für NexaAi - keine boolean props, compound components, dependency injection via context, React Compiler defaults, React 19 API
---

# NexaAi Composition Skill

Verbindliche Regeln für Component-Design in `apps/mobile` und `apps/admin`.

Dieser Skill enthält 8 Regeln die auf einer klaren Philosophie beruhen: **Composition über Configuration.** Statt eine Komponente mit vielen Optionen zu bauen, bauen wir kleine Bausteine und komponieren sie.

## Warum diese Regeln

Wir starten NexaAi als Solo-Projekt mit KI-Unterstützung. Das bedeutet: der Code muss lesbar sein für KI-Agenten (die Muster erkennen) und für uns selbst in 6 Monaten (wenn wir nicht mehr wissen was wir dachten). Boolean-Prop-Explosion, monolithische Komponenten, und verstreute State-Logik killen beide.

Die Regeln sind aus dem Lebensordner-Projekt übernommen und dort bewährt.

## Die Regeln (nach Impact geordnet)

### CRITICAL

1. **[Avoid Boolean Prop Proliferation](./rules/architecture-avoid-boolean-props.md)** - Keine `isThread`, `isEditing`, `isDMThread` Props. Composition statt Konfiguration.

### HIGH

2. **[Use Compound Components](./rules/architecture-compound-components.md)** - Struktur komplexer Komponenten als Compound Components mit shared context.

3. **[Lift State into Provider Components](./rules/state-lift-state.md)** - State in Provider Components. Ermöglicht dass Geschwister außerhalb der UI-Hierarchie Zugriff haben.

4. **[Generic Context Interfaces](./rules/state-context-interface.md)** - Context definiert Interface (state/actions/meta). Verschiedene Provider implementieren das gleiche Interface.

5. **[React Compiler Hook Discipline](./rules/react-compiler-global-default-hook-discipline.md)** - Kein `useMemo`, `useCallback`, `React.memo`, `useEffect`, `useRef` by default. Nur bei I/O, Subscription, Imperative Sync.

### MEDIUM

6. **[Explicit Component Variants](./rules/patterns-explicit-variants.md)** - `<ThreadComposer />`, `<EditMessageComposer />`. Nicht `<Composer isThread isEditing />`.

7. **[Decouple State from UI](./rules/state-decouple-implementation.md)** - Provider kennt State-Implementation, UI kennt nur Context-Interface.

8. **[React 19 API](./rules/react19-no-forwardref.md)** - `ref` als normale prop, `use()` statt `useContext()`.

## Wann dieser Skill greift

- Immer beim Erstellen einer React oder React Native Komponente
- Beim Refactoring bestehender Komponenten
- Beim Review von Component-Code
- Wenn eine Komponente mehr als 2-3 boolean Props hat: dieser Skill wird konsultiert und die Komponente wird refactored

## Anwendung auf NexaAi

Konkrete Bereiche wo diese Regeln uns viel Zeit sparen werden:

- **JobCard** (Bewerber sieht Job vs Recruiter sieht Job) - **verwende explicit variants**, nicht boolean props
- **ChatWindow** (Bewerber-Sicht vs Recruiter-Sicht, active vs archived) - **verwende compound components** mit ChatProvider
- **ProfileForm** (Seeker vs Recruiter, Create vs Edit) - **explicit variants** + **lifted state**
- **SwipeStack** (Bewerber-Feed vs Recruiter-Feed) - **compound components**, gleiche UI, verschiedene Provider

## Referenzen

- Basiert auf Patterns aus dem [Lebensordner-Projekt](https://lebensordner.org)
- Kompatibel mit [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills)
- Passt zu React 19 und React Compiler
