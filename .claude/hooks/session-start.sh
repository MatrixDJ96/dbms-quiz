#!/usr/bin/env bash
# SessionStart hook - loads dynamic context based on where the dev is working.
# Output on stdout is injected as system context for the session.

set -euo pipefail

# === Current branch and module ===
CWD="$(pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$CWD")"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"

echo "## Session context (auto-loaded)"
echo ""
# Show the branch only inside a git repo (this project may not be versioned yet).
if [ -n "$BRANCH" ]; then
  echo "- **Branch**: \`$BRANCH\`"
fi
echo "- **CWD**: \`${CWD#"$REPO_ROOT/"}\`"

# === Git status: modified files ===
if git rev-parse --git-dir > /dev/null 2>&1; then
  CHANGED="$(git status --porcelain | head -10)"
  if [ -n "$CHANGED" ]; then
    echo ""
    echo "- **Modified files**:"
    echo "\`\`\`"
    echo "$CHANGED"
    echo "\`\`\`"
  fi
fi

# === Latest commits ===
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo ""
  echo "- **Last 3 commits on this branch**:"
  echo "\`\`\`"
  git log --oneline -3 2>/dev/null || echo "(no commits)"
  echo "\`\`\`"
fi

# === Current module conventions (if a local CLAUDE.md exists) ===
if [ -f "$CWD/CLAUDE.md" ] && [ "$CWD" != "$REPO_ROOT" ]; then
  echo ""
  echo "- ✓ Local CLAUDE.md present in \`$CWD\` (auto-loaded by Claude)"
fi

# === Context-aware reminders ===
# Example: on a hotfix branch, remind hotfix rules
case "$BRANCH" in
  hotfix/*)
    echo ""
    echo "⚠️ **Hotfix branch**: remember hotfix rules"
    echo "  - minimum necessary patch"
    echo "  - cherry-pick onto main + release branch"
    echo "  - mandatory changelog entry"
    ;;
  release/*)
    echo ""
    echo "⚠️ **Release branch**: critical bugfixes only, no new features"
    ;;
esac

# === Promemoria specifici del progetto ===
echo ""
echo "- ⚠️ Risposta corretta = sempre la PRIMA opzione in RAW_QUESTIONS/RAW_EVENTS (src/App.jsx); shuffle() mescola solo l'ordine a video."
echo "- Nessun test automatico: verifica le modifiche con \`npm run dev\` nel browser."
