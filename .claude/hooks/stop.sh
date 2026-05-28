#!/usr/bin/env bash
# Stop hook - runs at session end.
# Self-improvement pattern: saves a session summary to .claude/sessions/
# so a future stop hook (or manual command) can propose CLAUDE.md updates
# based on recurring patterns.
#
# Receives JSON payload on stdin with the reduced session transcript.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SESSIONS_DIR="$REPO_ROOT/.claude/sessions"
mkdir -p "$SESSIONS_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
SESSION_FILE="$SESSIONS_DIR/${TIMESTAMP}-${BRANCH//\//_}.json"

# Save the payload for later analysis
cat > "$SESSION_FILE"

# Keep only the last 50 sessions.
# Sanity check: only prune if SESSIONS_DIR is under the repo root we just resolved.
case "$SESSIONS_DIR" in
  "$REPO_ROOT"/.claude/sessions)
    ls -t "$SESSIONS_DIR"/*.json 2>/dev/null | tail -n +51 | xargs -r rm -f
    ;;
esac

# Suggest periodic review
SESSION_COUNT=$(ls "$SESSIONS_DIR"/*.json 2>/dev/null | wc -l)
if [ "$SESSION_COUNT" -ge 20 ]; then
  LAST_CLAUDE_MD_UPDATE=$(stat -c %Y "$REPO_ROOT/CLAUDE.md" 2>/dev/null || stat -f %m "$REPO_ROOT/CLAUDE.md" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  DAYS_SINCE=$(( (NOW - LAST_CLAUDE_MD_UPDATE) / 86400 ))
  
  if [ "$DAYS_SINCE" -gt 90 ]; then
    echo ""
    echo "💡 CLAUDE.md hasn't been updated in $DAYS_SINCE days and $SESSION_COUNT sessions are logged."
    echo "   Consider a review: \`claude /review-setup\`"
    echo "   (or read the latest sessions in .claude/sessions/ and propose updates)"
  fi
fi
