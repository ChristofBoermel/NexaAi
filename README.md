# NexaAi Setup Bundle

Dieses Verzeichnis enthält alle Files die du in dein NexaAi-Repo einbauen musst.

## Was ist drin

```
nexaai-setup/
├── README.md                          # Diese Datei
├── CLAUDE.md                          # Root Instructions für Claude Code
├── AGENTS.md                          # Root Instructions für opencode/Codex/andere
├── skills/                            # Alle Custom Skills
│   ├── nexaai-composition/
│   │   ├── SKILL.md                   # Manifest der 8 Composition-Regeln
│   │   └── rules/                     # Die 8 Rule-Files aus Lebensordner
│   ├── nexaai-database/SKILL.md
│   ├── nexaai-domain/SKILL.md
│   ├── nexaai-style/SKILL.md
│   └── nexaai-testing/SKILL.md
├── docs/
│   └── cross-machine-setup.md         # Windows+Linux Sync-Anleitung
└── scripts/
    ├── setup.sh                       # Linux / WSL / Git Bash
    └── setup.ps1                      # Native Windows PowerShell
```

## Installation in dein Repo

### Option A: In den vorhandenen NexaAi-Ordner kopieren

```bash
# Linux/WSL/Git Bash:
cd ~/Projects/NexaAi
cp -r /pfad/zu/nexaai-setup/* .
cp /pfad/zu/nexaai-setup/CLAUDE.md .
cp /pfad/zu/nexaai-setup/AGENTS.md .

git add .
git status  # prüfen was neu ist
```

```powershell
# Windows PowerShell:
cd D:\Projects\NexaAi
Copy-Item -Path "D:\Downloads\nexaai-setup\*" -Destination "." -Recurse -Force

git add .
git status
```

### Option B: Setup-Script laufen lassen

```bash
# Linux/WSL:
cd ~/Projects/NexaAi
bash scripts/setup.sh
```

```powershell
# Windows:
cd D:\Projects\NexaAi
.\scripts\setup.ps1
```

Das Script:
- Prüft Prerequisites (Node 22+, pnpm, git)
- Erstellt .env.local aus .env.example
- Installiert Dependencies
- Installiert externe Skills (Vercel + Anthropic)
- Verifiziert dass alle wichtigen Files da sind

## Nächste Schritte nach Setup

1. `.env.local` mit echten Secrets füllen (aus Supabase Dashboard etc.)
2. Ersten Commit machen: `git add . && git commit -m "chore: add agent skills and cross-machine setup"`
3. Push: `git push`
4. Auf zweitem Rechner: `git pull && bash scripts/setup.sh` (bzw. `.\scripts\setup.ps1`)
5. Erste Claude Code Session öffnen und mit CLAUDE.md-Verweis starten

## Weiter mit dem eigentlichen Bauen

Nach dem Setup kannst du mit den 10 Schritten aus `docs/stack-and-repo-final.md` starten:

1. Package-Versionen updaten (Next.js 16, React 19, etc.)
2. Neue Supabase-Keys generieren und einsetzen
3. `middleware.ts` → `proxy.ts` (falls schon angelegt)
4. AGENTS.md ist schon updated ✓
5. skills/ ist schon da ✓
6. docs/features/, docs/decisions/, docs/DAILY.md anlegen
7. 5 SQL-Fixes an 0001_init.sql anwenden
8. Migration laufen lassen
9. Erste Feature-Spec schreiben
10. Woche 2 (Auth + Profile) starten

