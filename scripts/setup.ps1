# NexaAi Setup Script - Native Windows PowerShell
# Idempotent: kann mehrfach laufen ohne Schaden
# Nutzung: .\scripts\setup.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host "=========================================="
Write-Host "NexaAi Setup - $(Get-Date)"
Write-Host "Repo Root: $RepoRoot"
Write-Host "=========================================="

# 1. Prerequisites Check
Write-Host ""
Write-Host "==> Checking prerequisites..."

function Test-Command {
    param([string]$Command)
    
    try {
        $null = Get-Command $Command -ErrorAction Stop
        $version = & $Command --version 2>&1 | Select-Object -First 1
        Write-Host "  OK:    $Command ($version)"
        return $true
    } catch {
        Write-Host "  FEHLT: $Command" -ForegroundColor Red
        return $false
    }
}

$Missing = $false
if (-not (Test-Command "node")) { $Missing = $true }
if (-not (Test-Command "pnpm")) { $Missing = $true }
if (-not (Test-Command "git"))  { $Missing = $true }
if (-not (Test-Command "npx"))  { $Missing = $true }

if ($Missing) {
    Write-Host ""
    Write-Host "Installationshinweise:" -ForegroundColor Yellow
    Write-Host "  Node.js 22 LTS via Volta: https://volta.sh"
    Write-Host "  pnpm 9.15.0:              npm install -g pnpm@9.15.0"
    Write-Host "  Git for Windows:          https://git-scm.com"
    exit 1
}

# Node Version Check
$NodeMajor = [int](node -e "console.log(process.versions.node.split('.')[0])")
if ($NodeMajor -lt 22) {
    Write-Host "  WARNUNG: Node $NodeMajor ist zu alt. Wir brauchen Node 22+." -ForegroundColor Red
    Write-Host "  Update mit: volta install node@22"
    exit 1
}

# 2. Git Config for Cross-Platform
Write-Host ""
Write-Host "==> Setting up Git config (local repo)..."

git config core.autocrlf true
git config core.eol lf
Write-Host "  OK: Line endings set to LF with autocrlf true"

# 3. .env.local from .env.example
Write-Host ""
Write-Host "==> Setting up environment variables..."

if ((-not (Test-Path ".env.local")) -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "  OK: .env.local erzeugt aus .env.example"
    Write-Host "  WICHTIG: Trage die echten Secrets in .env.local ein!" -ForegroundColor Yellow
} elseif (Test-Path ".env.local") {
    Write-Host "  OK: .env.local existiert bereits"
} else {
    Write-Host "  WARNUNG: keine .env.example gefunden. Skip." -ForegroundColor Yellow
}

# 4. Install Dependencies
Write-Host ""
Write-Host "==> Installing dependencies with pnpm..."
try {
    pnpm install --frozen-lockfile 2>$null
} catch {
    pnpm install
}
Write-Host "  OK: Dependencies installiert"

# 5. Install External Skills
Write-Host ""
Write-Host "==> Installing external agent skills..."

$AgentsToInstall = @()
if (Get-Command "claude" -ErrorAction SilentlyContinue) {
    $AgentsToInstall += "-a", "claude-code"
    Write-Host "  Detected: Claude Code"
}
if (Get-Command "opencode" -ErrorAction SilentlyContinue) {
    $AgentsToInstall += "-a", "opencode"
    Write-Host "  Detected: opencode"
}
if (Get-Command "codex" -ErrorAction SilentlyContinue) {
    $AgentsToInstall += "-a", "codex"
    Write-Host "  Detected: Codex"
}

if ($AgentsToInstall.Count -eq 0) {
    Write-Host "  WARNUNG: Keine unterstützten Agenten gefunden" -ForegroundColor Yellow
    Write-Host "  Installiere Skills später manuell mit npx skills add"
} else {
    Write-Host "  Installing skills for: $($AgentsToInstall -join ' ')"
    
    $Skills = @(
        @{ Repo = "vercel-labs/agent-skills"; Skill = "react-best-practices" },
        @{ Repo = "vercel-labs/agent-skills"; Skill = "react-native-skills" },
        @{ Repo = "vercel-labs/agent-skills"; Skill = "web-design-guidelines" },
        @{ Repo = "anthropics/skills"; Skill = "frontend-design" }
    )
    
    foreach ($s in $Skills) {
        try {
            & npx --yes skills add $s.Repo --skill $s.Skill @AgentsToInstall -y 2>$null
            Write-Host "    OK: $($s.Skill)"
        } catch {
            Write-Host "    SKIP: $($s.Skill) (failed or already installed)"
        }
    }
}

# 6. CLAUDE.md Check
Write-Host ""
Write-Host "==> Verifying CLAUDE.md..."
if (Test-Path "CLAUDE.md") {
    Write-Host "  OK: CLAUDE.md exists"
} else {
    Write-Host "  WARNUNG: CLAUDE.md fehlt." -ForegroundColor Yellow
}

# 7. Skills Verification
Write-Host ""
Write-Host "==> Verifying custom skills..."

$RequiredSkills = @(
    "skills/nexaai-composition/SKILL.md",
    "skills/nexaai-database/SKILL.md",
    "skills/nexaai-domain/SKILL.md",
    "skills/nexaai-style/SKILL.md",
    "skills/nexaai-testing/SKILL.md"
)

foreach ($skill in $RequiredSkills) {
    if (Test-Path $skill) {
        Write-Host "  OK: $skill"
    } else {
        Write-Host "  FEHLT: $skill" -ForegroundColor Red
    }
}

# 8. Docs Verification
Write-Host ""
Write-Host "==> Verifying documentation..."

$RequiredDocs = @(
    "docs/architecture.md",
    "docs/data-model.md",
    "docs/matching.md",
    "docs/dsgvo.md",
    "docs/ai-workflow.md",
    "docs/production-checklist.md",
    "docs/cross-machine-setup.md",
    "AGENTS.md",
    "CLAUDE.md"
)

foreach ($doc in $RequiredDocs) {
    if (Test-Path $doc) {
        Write-Host "  OK: $doc"
    } else {
        Write-Host "  FEHLT: $doc" -ForegroundColor Red
    }
}

# 9. Summary
Write-Host ""
Write-Host "=========================================="
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host ""
Write-Host "Nächste Schritte:"
Write-Host "  1. .env.local mit echten Secrets füllen"
Write-Host "  2. Falls neu: Claude Code Session starten und CLAUDE.md lesen lassen"
Write-Host "  3. Migration 0001_init.sql anschauen (5 Fixes noch offen!)"
Write-Host ""
Write-Host "Cross-Machine Sync:"
Write-Host "  Vor Rechner-Wechsel: git commit && git push"
Write-Host "  Nach Rechner-Wechsel: git pull"
Write-Host ""
