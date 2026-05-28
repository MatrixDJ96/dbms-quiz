#!/usr/bin/env bash
# PreToolUse hook - runs before Write/Edit.
# Receives JSON payload on stdin. Exit codes (per https://code.claude.com/docs/en/hooks-guide):
#   0 = allow the tool call to proceed
#   1 = generic non-blocking error (logged, tool call still proceeds)
#   2 = BLOCK the tool call + feed stderr back to the model as guidance
#
# Pattern: block writes to off-limits paths + writes containing problematic patterns.

set -euo pipefail

# Read JSON payload from stdin
PAYLOAD="$(cat)"

# Extract target path (requires jq).
# If jq is missing we cannot parse the payload — fail OPEN (exit 0) with a visible
# stderr warning so the user knows the guard is off. exit 2 would BLOCK every edit
# (per the PreToolUse exit-code semantics above), which is too aggressive for a
# missing-dependency degradation.
if ! command -v jq > /dev/null 2>&1; then
  echo "WARNING: 'jq' is not installed — pre-tool-use guard is DISABLED for this session." >&2
  echo "         Install jq to re-enable, or comment out this hook in .claude/settings.json to silence the warning." >&2
  exit 0
fi

TARGET_PATH="$(echo "$PAYLOAD" | jq -r '.tool_input.file_path // .tool_input.path // empty')"

if [ -z "$TARGET_PATH" ]; then
  exit 0
fi

# === Absolutely off-limits paths ===
case "$TARGET_PATH" in
  *.env|*.env.*)
    echo "BLOCKED: writing to .env files is forbidden. Use .env.example as a template." >&2
    exit 1
    ;;
  */migrations/*.sql)
    # Block only modifications to EXISTING migration files; allow creation of new ones.
    if [ -f "$TARGET_PATH" ]; then
      echo "BLOCKED: '$TARGET_PATH' already exists. Existing migrations must not be modified — create a new migration file instead." >&2
      exit 1
    fi
    ;;
  *.pem|*.key|*.p12|*id_rsa*)
    echo "BLOCKED: writing to key/secret files is forbidden." >&2
    exit 1
    ;;
  */node_modules/*|*/vendor/*|*/.venv/*)
    echo "BLOCKED: writing to dependencies is forbidden. Modify package.json/go.mod/requirements.txt." >&2
    exit 1
    ;;
  */dist/*|*/build/*|*/.next/*)
    echo "BLOCKED: writing to build artifacts. Modify the source, not the output." >&2
    exit 1
    ;;
esac

# === Content check on code files ===
CONTENT="$(echo "$PAYLOAD" | jq -r '.tool_input.content // .tool_input.new_string // empty')"

if [ -n "$CONTENT" ]; then
  # Detect common hardcoded secrets
  if echo "$CONTENT" | grep -qE '(AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{32,}|xox[baprs]-[0-9a-zA-Z-]+)'; then
    echo "BLOCKED: detected hardcoded secret pattern (AWS key / OpenAI key / Slack token). Use an env var." >&2
    exit 1
  fi

  # Detect debug console.log / print in non-test files
  if [[ "$TARGET_PATH" != *test* && "$TARGET_PATH" != *spec* ]]; then
    case "$TARGET_PATH" in
      *.ts|*.tsx|*.js|*.jsx)
        if echo "$CONTENT" | grep -qE '^\s*console\.(log|debug)\('; then
          echo "WARNING: console.log/debug in non-test file. Use the project logger." >&2
          exit 2
        fi
        ;;
    esac
  fi
fi

exit 0
