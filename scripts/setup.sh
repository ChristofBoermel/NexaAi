#!/usr/bin/env bash
# NexaAi Setup Script - Linux, macOS, WSL, Git Bash
# Idempotent: kann mehrfach laufen ohne Schaden

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=========================================="
echo "NexaAi Setup - $(date)"
echo "Repo Root: $REPO_ROOT"
echo "=========================================="

# 1. Prerequisites Check
echo ""
echo "==> Checking prerequisites..."

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "  FEHLT: $1"
        echo "  Bitte installier $1 und dann Script nochmal laufen lassen."
        return 1
    else
        echo "  OK:    $1 ($($1 --version 2>&1 | head -1))"
    fi
}

MISSING=0
check_command "node" || MISSING=1
check_command "pnpm" || MISSING=1
check_command "git" || MISSING=1
check_command "npx" || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo ""
    echo "Installationshinweise:"
    echo "  Node.js 22 LTS via Volta: https://volta.sh"
    echo "  pnpm 9.15.0:              npm install -g pnpm@9.15.0"
    echo "  Git:                      https://git-scm.com"
    exit 1
fi

# Node Version Check
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 22 ]; then
    echo "  WARNUNG: Node $NODE_MAJOR ist zu alt. Wir brauchen Node 22+."
    echo "  Update mit: volta install node@22"
    exit 1
fi

# 2. Git Config for Cross-Platform
echo ""
echo "==> Setting up Git config (local repo)..."

git config core.autocrlf input
git config core.eol lf
echo "  OK: Line endings set to LF"

# 3. .env.local from .env.example
echo ""
echo "==> Setting up environment variables..."

if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "  OK: .env.local erzeugt aus .env.example"
    echo "  WICHTIG: Trage die echten Secrets in .env.local ein!"
else
    if [ -f ".env.local" ]; then
        echo "  OK: .env.local existiert bereits"
    else
        echo "  WARNUNG: keine .env.example gefunden. Skip."
    fi
fi

# 4. Install Dependencies
echo ""
echo "==> Installing dependencies with pnpm..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo "  OK: Dependencies installiert"

# 5. Install External Skills
echo ""
echo "==> Installing external agent skills..."

# Prüfe ob claude-code installiert ist
AGENTS_TO_INSTALL=""
if command -v claude &> /dev/null; then
    AGENTS_TO_INSTALL="$AGENTS_TO_INSTALL -a claude-code"
    echo "  Detected: Claude Code"
fi
if command -v opencode &> /dev/null; then
    AGENTS_TO_INSTALL="$AGENTS_TO_INSTALL -a opencode"
    echo "  Detected: opencode"
fi
if command -v codex &> /dev/null; then
    AGENTS_TO_INSTALL="$AGENTS_TO_INSTALL -a codex"
    echo "  Detected: Codex"
fi

if [ -z "$AGENTS_TO_INSTALL" ]; then
    echo "  WARNUNG: Keine unterstützten Agenten gefunden (Claude Code, opencode, Codex)"
    echo "  Skills werden nicht installiert. Installiere sie manuell später mit:"
    echo "    npx skills add vercel-labs/agent-skills --skill react-best-practices"
else
    echo "  Installing skills for:$AGENTS_TO_INSTALL"
    
    # Install skills - continues on failure so other skills still install
    npx --yes skills add vercel-labs/agent-skills --skill react-best-practices $AGENTS_TO_INSTALL -y 2>/dev/null || echo "    react-best-practices: failed or already installed"
    npx --yes skills add vercel-labs/agent-skills --skill react-native-skills $AGENTS_TO_INSTALL -y 2>/dev/null || echo "    react-native-skills: failed or already installed"
    npx --yes skills add vercel-labs/agent-skills --skill web-design-guidelines $AGENTS_TO_INSTALL -y 2>/dev/null || echo "    web-design-guidelines: failed or already installed"
    npx --yes skills add anthropics/skills --skill frontend-design $AGENTS_TO_INSTALL -y 2>/dev/null || echo "    frontend-design: failed or already installed"
    
    echo "  OK: External skills installation complete"
fi

# 6. CLAUDE.md Symlink Check
echo ""
echo "==> Verifying CLAUDE.md..."
if [ -f "CLAUDE.md" ]; then
    echo "  OK: CLAUDE.md exists"
else
    echo "  WARNUNG: CLAUDE.md fehlt. Claude Code Session könnte weniger informiert starten."
fi

# 7. Skills Verification
echo ""
echo "==> Verifying custom skills..."

REQUIRED_SKILLS=(
    "skills/nexaai-composition/SKILL.md"
    "skills/nexaai-database/SKILL.md"
    "skills/nexaai-domain/SKILL.md"
    "skills/nexaai-style/SKILL.md"
    "skills/nexaai-testing/SKILL.md"
)

for skill in "${REQUIRED_SKILLS[@]}"; do
    if [ -f "$skill" ]; then
        echo "  OK: $skill"
    else
        echo "  FEHLT: $skill"
    fi
done

# 8. Docs Verification
echo ""
echo "==> Verifying documentation..."

REQUIRED_DOCS=(
    "docs/architecture.md"
    "docs/data-model.md"
    "docs/matching.md"
    "docs/dsgvo.md"
    "docs/ai-workflow.md"
    "docs/production-checklist.md"
    "docs/cross-machine-setup.md"
    "AGENTS.md"
    "CLAUDE.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  OK: $doc"
    else
        echo "  FEHLT: $doc"
    fi
done

# 9. Summary
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Nächste Schritte:"
echo "  1. .env.local mit echten Secrets füllen"
echo "  2. Falls neu: Claude Code Session starten und CLAUDE.md lesen lassen"
echo "  3. Migration 0001_init.sql anschauen (5 Fixes noch offen!)"
echo ""
echo "Cross-Machine Sync:"
echo "  Vor Rechner-Wechsel: git commit && git push"
echo "  Nach Rechner-Wechsel: git pull"
echo ""
