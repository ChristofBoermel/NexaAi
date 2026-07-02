# Cross-Machine Setup: Windows und Linux parallel nutzen

Dieses Dokument beschreibt wie du von deinem Windows-PC und deinem Arch-Laptop auf demselben NexaAi-Projekt arbeitest, ohne Chaos zu produzieren.

## Grundprinzip: Git ist die einzige Wahrheit

Der Sync zwischen deinen Rechnern läuft über GitHub. Keine Dropbox, kein Syncthing, kein Cloud-Ordner. Grund: Code-Sync über Non-Git-Tools führt zu Konflikten und File-Locking-Problemen.

**Regel:**
- Vor Arbeitsbeginn: `git pull`
- Vor Rechner-Wechsel: `git commit && git push` (auch bei WIP)
- Wechsel mitten in einer Änderung: `git stash push -m "WIP mobile onboarding" && git push` und drüben `git pull && git stash pop`

## Was ins Git kommt und was nicht

### Committed (im Git):
- Aller Code (`apps/`, `packages/`)
- Alle Skills (`skills/`)
- Alle Docs (`docs/`)
- `CLAUDE.md`, `AGENTS.md`
- `package.json`, `pnpm-lock.yaml`, `turbo.json`
- `.env.example` (nur Platzhalter)
- `.nvmrc`, `.editorconfig`, `.gitattributes`
- `scripts/` (Setup-Scripts)

### Gitignored:
- `.env.local` (Secrets, per Rechner unterschiedlich möglich)
- `node_modules/`
- `.next/`, `dist/`, `.turbo/`
- `.expo/`
- `*.log`
- `.DS_Store`, `Thumbs.db`
- IDE-spezifisch: `.vscode/`, `.idea/` (außer wenn team-shared)

## Konsistente Versionen sicherstellen

Damit auf beiden Rechnern die gleichen Versionen laufen:

### Node.js Version

Wir legen fest: **Node 22 LTS** auf beiden Rechnern.

- Windows: [Volta](https://volta.sh) installieren, dann `volta install node@22`
- Linux (Arch): via `nvm` oder `mise`
- Alternative: `.nvmrc` File im Repo Root mit Inhalt `22`

### pnpm Version

Im Root `package.json`:

```json
{
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=22"
  }
}
```

Damit warnt jedes `pnpm`-Command wenn die falsche Version läuft.

### Line Endings

Wichtigster Cross-Platform-Pain-Point. `.gitattributes` im Repo Root:

```
* text=auto eol=lf
*.sh text eol=lf
*.bat text eol=crlf
*.ps1 text eol=crlf
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.mov binary
*.mp4 binary
*.mp3 binary
*.flv binary
*.fla binary
*.swf binary
*.gz binary
*.zip binary
*.7z binary
*.ttf binary
*.eot binary
*.woff binary
*.woff2 binary
*.pyc binary
*.pdf binary
```

Und Git-Config auf beiden Rechnern:

**Windows:**
```powershell
git config --global core.autocrlf true
git config --global core.eol lf
```

**Linux:**
```bash
git config --global core.autocrlf input
git config --global core.eol lf
```

## Windows-spezifische Vorbereitung

### Empfohlen: WSL2 nutzen

Der sauberste Weg: **WSL2 auf Windows** installieren. Dann läuft alles wie auf deinem Arch-Laptop, gleiche Terminal-Befehle, gleiche Tools.

```powershell
# In PowerShell als Admin
wsl --install
# Neustart, dann:
wsl --install -d Ubuntu-24.04
```

Nach dem Setup: alle Repo-Arbeit passiert innerhalb WSL, nicht native Windows. Files liegen unter `\\wsl$\Ubuntu-24.04\home\christof\Projects\NexaAi`.

**Vorteil:** identisches Setup auf beiden Rechnern. Alle Scripts, alle Commands, alle Tools identisch.
**Nachteil:** ein bisschen Einrichtungs-Zeit (2h).

### Alternative: Native Windows

Wenn du WSL2 nicht willst:

- **Git for Windows** installieren (bringt Git Bash mit)
- **PowerShell 7** (nicht die default Windows PowerShell 5.1)
- **Node.js via Volta**
- **Windows Terminal** als Terminal-Emulator (nicht das default cmd.exe)
- Für Docker: **Docker Desktop for Windows**

Terminal-Empfehlung: Git Bash für POSIX-Scripts, PowerShell für Windows-spezifisches.

## Setup-Anleitung pro Rechner

### Erstsetup Linux (Arch)

Auf deinem Arch-Laptop, wenn NexaAi noch nicht clone-t ist:

```bash
cd ~/Projects
git clone git@github.com:DEIN-USER/NexaAi.git
cd NexaAi
bash scripts/setup.sh
```

### Erstsetup Windows

**Mit WSL2 (empfohlen):**
```bash
# In WSL Terminal
cd ~/Projects
git clone git@github.com:DEIN-USER/NexaAi.git
cd NexaAi
bash scripts/setup.sh
```

**Native Windows (mit PowerShell 7):**
```powershell
cd D:\Projects
git clone git@github.com:DEIN-USER/NexaAi.git
cd NexaAi
.\scripts\setup.ps1
```

## Sync-Workflow im Alltag

### Vor Arbeitsbeginn (jeder Rechner, jedes Mal)

```bash
cd ~/Projects/NexaAi  # oder D:\Projects\NexaAi
git pull
pnpm install  # nur wenn package.json geändert wurde
```

### Zwischen-Wechsel (Rechner-A → Rechner-B)

Auf Rechner-A:
```bash
git add .
git commit -m "wip: onboarding form validation"
git push
```

Auf Rechner-B:
```bash
git pull
```

Bei WIP: nutze `git commit --no-verify` um lint-hooks zu skippen, aber nur bei WIP-Commits die du gleich rebase-en willst.

### Best Practice: WIP-Branch

Für halb-fertige Arbeit einen WIP-Branch:

```bash
git checkout -b wip/mobile-onboarding
git commit -am "wip: mobile onboarding step 3"
git push -u origin wip/mobile-onboarding

# Am anderen Rechner:
git fetch
git checkout wip/mobile-onboarding
git pull
```

## Env-Vars pro Rechner

Jeder Rechner hat seine eigene `.env.local`, die nicht gecommitted wird. Beim Setup wird sie aus `.env.example` erzeugt und du füllst die Secrets ein.

**Regel:** wenn du eine neue Env-Var brauchst, dokumentiere sie in `.env.example` mit Kommentar. Sonst weißt du am anderen Rechner nicht was fehlt.

**Beispiel `.env.example`:**
```bash
# Supabase - Publishable Key (public, für Client)
# Bekommst du im Supabase Dashboard > Settings > API Keys
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx

# Supabase - Secret Key (private, für Edge Functions und Server)
SUPABASE_SECRET_KEY=sb_secret_xxxxx

# ... etc
```

## Skills-Sync

Deine `skills/` Ordner sind im Git. Beim Clone hast du sie automatisch auf beiden Rechnern.

Externe Skills (via `npx skills add`) landen in `.claude/skills/` und `.opencode/skills/`. Diese Ordner **committen wir auch**, damit beide Rechner die gleiche Version haben ohne erneuten Install.

Wenn du eine externe Skill aktualisierst:
```bash
# Am Rechner-A
npx skills add vercel-labs/agent-skills --skill react-best-practices --update
git add .claude/skills/ .opencode/skills/
git commit -m "chore(skills): update react-best-practices"
git push

# Am Rechner-B
git pull
```

## Häufige Fehler und Lösungen

### "different lockfile versions"

Ursache: `pnpm-lock.yaml` wurde auf einem Rechner geändert, aber nicht gepusht.

Lösung:
```bash
git pull
pnpm install
```

Falls Konflikt: den Konflikt manuell auflösen (meistens: den neueren nehmen) und dann `pnpm install` laufen lassen.

### "line endings" Warnungen bei Git

Ursache: `.gitattributes` fehlt oder autocrlf falsch.

Lösung: siehe "Line Endings" Section oben.

### "command not found: pnpm" auf Windows

Ursache: Volta nicht installiert oder PATH nicht aktualisiert.

Lösung: PowerShell neustarten oder `refreshenv` in cmd.

### Symlink-Probleme auf Windows

Ursache: Windows braucht Admin-Rechte für Symlinks.

Lösung: Developer Mode in Windows-Einstellungen aktivieren, oder in WSL arbeiten.

### Supabase CLI läuft nicht auf Windows

Ursache: Supabase CLI hat Windows-spezifische Bugs.

Lösung: In WSL laufen lassen. `supabase migration new` etc. via WSL Terminal.

## Empfehlung für dich (Chris)

Basierend auf deiner Situation:

1. **Installier WSL2 auf Windows** (einmalig 2h Setup, spart dir für immer Cross-Platform-Kopfschmerzen)
2. **Nutze VS Code als Editor auf beiden Rechnern** (mit Remote-WSL Extension auf Windows, direkt auf Linux)
3. **Alternative:** wenn du bei LazyVim bleiben willst, dann eben LazyVim auch in WSL installieren. Deine dotfiles kannst du als eigenes Repo committen und auf beiden Rechnern clonen.
4. **Halte Volta oder mise auf beiden Rechnern** für Node/pnpm Version-Management
5. **Nutze die gleiche Shell** auf beiden (Bash oder Zsh, gleiche Config)
6. **SSH-Key auf beiden Rechnern**, damit `git push/pull` ohne Passwort geht
7. **Push-Commit-Push nach jeder Session**, auch bei WIP

## Vor dem Wechsel: Checkliste

Immer wenn du den Rechner wechselst:

- [ ] Alle offenen Files gespeichert
- [ ] `git status` prüfen (nichts vergessen?)
- [ ] `git commit` (auch WIP)
- [ ] `git push`
- [ ] Screenshot vom aktuellen Stand (optional, hilft beim Weiterarbeiten)
- [ ] In `docs/DAILY.md` kurz notieren wo du bist

## Am neuen Rechner: Checkliste

- [ ] `git pull`
- [ ] `pnpm install` (nur wenn nötig)
- [ ] `docs/DAILY.md` lesen wo du warst
- [ ] Weitermachen
