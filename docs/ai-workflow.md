# AI-Workflow: Claude + opencode/DeepSeek + Codex

## Die Kernfrage: Warum drei Tools?

Weil jedes eine andere Stärke hat und sie sich gegenseitig kompensieren:

- **Claude (ich):** Denken, Planen, Reviewen, Architektur, Debugging von komplexen Problemen. Ich habe den größten Kontext-Rahmen und beste Reasoning-Fähigkeit für schwierige Entscheidungen, bin aber teuer pro Token.
- **opencode + DeepSeek-Coder:** Ausführen, Boilerplate schreiben, Muster wiederholen. Läuft direkt in deinem Neovim, ist billig, schnell, aber blind für den großen Zusammenhang.
- **Codex (OpenAI CLI):** Zweite Meinung, Alternative Perspektiven. Wenn du zwischen zwei Ansätzen schwankst und Claude schon eine Meinung hatte, zeigt dir Codex möglicherweise einen dritten Weg.

Wenn du alle drei richtig einsetzt, hast du effektiv ein 3-Personen-Team. Wenn du sie falsch einsetzt, wiederholst du dich dreimal und wirst wütend.

## Rollenverteilung: Wer macht was

### Claude (ich, via Web-Chat oder Claude Code)

**Primär zuständig für:**
- Architektur-Entscheidungen (welches Modul, welche Trennung, welche Abhängigkeiten)
- Datenmodell-Design und Datenbank-Migrationen
- Sicherheitsrelevante Code-Reviews (Auth, RLS, Zahlungen, DSGVO)
- Code-Reviews von opencode-generierten Änderungen
- Debugging von Problemen die opencode nicht selbst löst
- Dokumentation (README, ADRs, DSGVO-Doku)
- Planung von komplexen Features (mehr als 3 Dateien betroffen)
- Prompt-Engineering für die DeepSeek-Calls im Produkt selbst

**Nicht zuständig für:**
- Boilerplate schreiben (Verschwendung meiner Kapazität)
- Simple CRUD-Endpunkte nach klarem Muster
- Copy-Paste mit kleinen Änderungen
- Formatierung, Linting, Imports sortieren

### opencode + DeepSeek-Coder (Neovim TUI)

**Primär zuständig für:**
- Implementierung nach klarer Spec
- Boilerplate: neue Route-Handler, CRUD-Endpunkte, Formular-Komponenten
- Wiederholende Refactorings (z.B. "füge diesen Import in allen 20 Dateien hinzu")
- Tests schreiben nach vorhandenen Testmustern
- Kleine Bugfixes wenn der Bug klar lokalisiert ist
- Code-Formatierung, Imports, TypeScript-Typen ergänzen

**Nicht zuständig für:**
- Architektur-Entscheidungen (fehlt der Überblick)
- Sicherheitskritischer Code (RLS-Policies, Auth-Logik, Payment-Handling)
- DSGVO-relevanter Code ohne Review
- Neue Features ohne vorheriges Design von Claude

### Codex (OpenAI CLI oder Web)

**Primär zuständig für:**
- Zweite Meinung bei kontroversen Architektur-Fragen
- Alternative Bibliotheks-Vorschläge wenn du unsicher bist
- Sanity-Check bei DSGVO- oder Sicherheits-Entscheidungen
- "Ist das wirklich der Standard-Approach in 2026?"

**Nicht zuständig für:**
- Deine Standard-Implementierungs-Runden (das macht opencode)
- Reviews von opencode-Code (das macht Claude, weil ich die vorherige Diskussion kenne)

**Rhythmus:** Codex einmal pro Woche für einen "War Room" Session zu einer offenen Frage. Nicht bei jedem Feature.

## Der konkrete Workflow: Feature bauen

Am Beispiel "Bewerber-Profil-Erstellung" (Feature aus Woche 2):

### Schritt 1: Design mit Claude (30 Minuten)

Du kommst zu mir und sagst: "Ich baue jetzt die Bewerber-Profil-Erstellung. Bitte designe."

Ich produziere:
- Screen-Liste (5 Schritte)
- Datenfluss (was landet wann in welcher Tabelle)
- Validierungs-Regeln (Zod-Schemata)
- Fehlerfälle und Edge Cases
- Konkrete Dateiliste (welche Datei muss angelegt oder geändert werden)
- Reihenfolge der Implementierung

Am Ende gebe ich dir ein Dokument `docs/features/seeker-profile-creation.md` mit allem drin.

### Schritt 2: Handoff zu opencode

Du öffnest den Neovim, tippst `<leader>oo` und fütterst opencode mit:

> "Lies docs/features/seeker-profile-creation.md und implementiere Schritt 1 (Datei apps/mobile/app/(seeker)/onboarding/step-1-basics.tsx). Halte dich strikt an das Zod-Schema in packages/types/seeker-profile.ts. Frag nach wenn was unklar ist."

opencode implementiert. Wenn er unsicher ist, stoppt er und fragt. Wenn er fertig ist, meldet er "done."

### Schritt 3: Review mit Claude

Du gibst mir den generierten Code oder öffnest einen PR:

> "Claude, review diesen Code. Fokus: hält er sich an das Spec? Sind die RLS-Auswirkungen berücksichtigt?"

Ich reviewe konkret:
- Sicherheits-Issues (nicht validierte Inputs, direkte DB-Calls ohne RLS-Check)
- Abweichung vom Spec
- Fehlende Fehlerbehandlung
- Verstöße gegen unsere Konventionen (Em-Dashes, Import-Order, etc.)

Ich gebe dir eine To-Fix-Liste.

### Schritt 4: opencode korrigiert

Du fütterst opencode mit der To-Fix-Liste. Er korrigiert.

### Schritt 5: Commit

Wenn alles läuft: du machst den Commit selbst mit `git commit -m "feat(mobile): add seeker profile onboarding step 1"`.

Wichtig: **du machst den Commit, nicht die Tools.** Sonst verlierst du das Gefühl was passiert.

### Wann Codex ins Spiel kommt

Nur wenn Claude und opencode uneinig sind. Beispiel:

> Claude sagt: "Nutze React Hook Form."
> opencode/DeepSeek sagt: "TanStack Form ist moderner."
> Du bist unsicher.

Dann Codex fragen: "Für ein React Native Onboarding-Flow mit 5 Schritten und Async-Validierung, was ist heute Standard: React Hook Form oder TanStack Form?"

Codex gibt eine dritte Perspektive. Du entscheidest.

**Regel:** Nicht mehr als 1-2 Codex-Konsultationen pro Woche. Sonst verlierst du dich in Meta-Diskussionen.

## AGENTS.md: Die geteilten Regeln

Wir haben schon eine AGENTS.md im Repo. Die muss aber jetzt erweitert werden, damit auch opencode sie liest. opencode versteht AGENTS.md nativ.

**Zwingende Ergänzungen:**

```markdown
## Regeln für alle AI-Agenten

Bei Aufgaben-Übernahme:
- Lies zuerst /docs/features/{feature-name}.md wenn eine Spec existiert
- Prüfe /packages/types für vorhandene Typen bevor du neue anlegst
- Nutze /packages/config für Env-Vars, nicht direkt process.env
- Wenn du unsicher bist: STOP und frag den Menschen. Rate nicht.

Bei Datenbank-Änderungen:
- KEINE direkten Änderungen an Migrations 0001-0999 (reserviert für Claude)
- Neue Migrations nur nach expliziter Freigabe
- RLS-Policies immer mit Kommentar warum

Bei API-Endpunkten:
- Alle Inputs mit Zod validieren
- Alle Outputs typisiert
- Rate-Limiting per Endpoint dokumentieren

Style:
- Keine Em-Dashes im Code oder Kommentaren
- Deutsche Fehlermeldungen für User-facing Text
- Englische Kommentare im Code

Commits:
- Conventional Commits: feat/fix/chore/docs/refactor/test
- Scope: mobile/admin/db/functions/config
- Beispiel: feat(mobile): add seeker profile onboarding
```

## Skills und opencode-spezifische Konfiguration

opencode unterstützt Skills-Files. Für uns machen diese Sinn:

### `/skills/database.md`

```markdown
# Database Skill

Wenn User nach DB-Operationen fragt:
- Nutze @supabase/supabase-js Client aus packages/db/client.ts
- Nie den service-role Key im Client-Code
- Alle Queries müssen RLS-durchsetzen (kein `service_role` außer in Edge Functions)
- Für Migrations: schreibe Migration-File, führe NICHT selbst aus
```

### `/skills/mobile-ui.md`

```markdown
# Mobile UI Skill

Wenn User nach Screens fragt:
- NativeWind für Styling, keine StyleSheet.create
- Expo Router für Navigation, keine React Navigation direkt
- Alle Screens haben SafeAreaView aus react-native-safe-area-context
- Loading und Error States sind Pflicht
- Dark Mode Support ab Tag 1 (bg-white dark:bg-slate-900)
```

### `/skills/api.md`

```markdown
# API Skill

Wenn User nach neuen API-Endpunkten fragt:
- Web-Admin: Next.js 16 Route Handlers unter apps/admin/app/api/
- Mobile-facing: Supabase Edge Functions unter apps/functions/
- Immer Zod-Schema am Anfang
- Immer Auth-Check als erstes
- Fehler-Response als { error: string, code: string }
- Erfolgreiches Response als { data: T }
```

## Häufige Anti-Muster (vermeiden)

### 1. "Ich frag mal alle drei was sie denken"

Nein. Erst planen mit einem (Claude), dann ausführen mit einem (opencode). Wenn du drei Meinungen parallel fragst, verwirren sie sich gegenseitig und du blockierst dich.

### 2. "opencode soll direkt commiten"

Nein. Du machst den Commit. Du hast die Verantwortung. AI-Tools committen zu lassen führt dazu, dass du nicht mehr weißt was in deinem Repo passiert.

### 3. "Claude soll Boilerplate schreiben"

Verschwendung. Claude ist teuer pro Token. Formular-Komponenten die 10x fast gleich aussehen macht opencode viel besser.

### 4. "opencode soll Architektur entscheiden"

Gefährlich. opencode/DeepSeek hat begrenzten Kontext und keine Erinnerung an vorherige Diskussionen. Er wird lokal optimieren und global suboptimal entscheiden.

### 5. "Codex reviewt Code von opencode"

Sinnlos. Codex kennt die Diskussion nicht die dazu geführt hat. Reviews macht Claude.

### 6. Kontext-Wechsel ohne Übergabe

Wenn du morgens mit opencode arbeitest, mittags zu Claude wechselst, nachmittags wieder zu opencode: schreib zwischendurch was passiert ist auf. Sonst redest du beide Tools in dieselbe Sache rein ohne dass sie wissen was der andere gemacht hat.

## Praktischer Tages-Rhythmus

Ein Vorschlag wie du deinen Tag strukturieren kannst wenn du 4-6 Stunden am Projekt hast:

**Anker 1 (60-90 Min): Planning mit Claude**
- Feature des Tages festlegen
- Spec bekommen
- Fragen klären

**Anker 2 (2-3h): Implementation mit opencode**
- Spec abarbeiten
- Bei Blockern: kurz Claude fragen und zurück zu opencode

**Anker 3 (30 Min): Review mit Claude**
- Diff zeigen
- Fix-Liste bekommen
- opencode weiterlaufen lassen oder selbst korrigieren

**Anker 4 (15 Min): Commit + Doku**
- Commit machen
- Kurzes Update in docs/DAILY.md was heute passiert ist

**Anker 5 (falls Zeit, wöchentlich): Codex War Room**
- Eine offene Frage der Woche
- 15-20 Min Perspektive holen
- Entscheidung dokumentieren in docs/decisions/{datum}-{thema}.md

## Was ich dir konkret liefern kann

Wenn du soweit bist:

1. **Ich schreibe die erweiterte AGENTS.md** die auch opencode korrekt liest
2. **Ich lege die skills/ Struktur an** mit den drei genannten Dateien
3. **Ich schreibe pro Feature eine detaillierte Spec** bevor opencode dran darf
4. **Ich reviewe alle Änderungen** die opencode generiert
5. **Ich helfe dir bei Codex-Fragen** wenn du dritte Meinung brauchst

Was du liefern musst:
1. **Disziplin bei der Übergabe** (keine gemischten Sessions)
2. **Die Commits selbst machen** (nicht Tools)
3. **docs/DAILY.md pflegen** (auch wenn nur 3 Sätze pro Tag)
4. **Zeitliche Anker** (nicht "wann immer ich Bock habe" sondern feste Blöcke)
