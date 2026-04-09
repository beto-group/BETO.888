#!/usr/bin/env bash
#
# Validates task completion for Beto Datacore agents.
# Checks for implementation_plan.md, walkthrough.md, and runs agent lints.
#
# Usage: ./scripts/lint-task.sh [task_dir] [skill_dir]

set -euo pipefail

TASK_DIR="${1:-.}"
SKILL_DIR="${2:-_RESOURCES/SKILL}"

echo "Linting task in: $TASK_DIR"
echo "Using SKILL at: $SKILL_DIR"

errors=0

check_file() {
  if [[ ! -f "$TASK_DIR/$1" ]]; then
    echo "ERROR: Missing required file '$1'"
    errors=$((errors + 1))
  else
    echo "OK: Found '$1'"
  fi
}

# 1. Check for mandatory documentation
check_file "implementation_plan.md"
check_file "walkthrough.md"
check_file "task.md"

# 2. Check for screenshots in walkthrough
if [[ -f "$TASK_DIR/walkthrough.md" ]]; then
  if ! grep -qE "!\[.*\]\(.*\.(png|jpg|jpeg|gif|webp)\)" "$TASK_DIR/walkthrough.md"; then
    echo "WARN: walkthrough.md might be missing a screenshot/recording"
  fi
fi

# 3. Run agent lints if agents folder exists
if [[ -d "$TASK_DIR/_resources/agents" ]]; then
  echo "Running agent lints..."
  bash "$SKILL_DIR/scripts/lint-agents.sh" "$TASK_DIR/_resources/agents" || errors=$((errors + 1))
fi

# 4. Check for MCP state if it's a component
if [[ -f "$TASK_DIR/src/index.jsx" ]]; then
  # Try to find mcp_state.json in common locations
  if [[ ! -f "$TASK_DIR/_resources/data/mcp_state.json" ]]; then
    echo "WARN: No mcp_state.json found for component. Visual verification might be missing."
  fi
fi

if [[ $errors -gt 0 ]]; then
  echo ""
  echo "FAILED: Task linting found $errors errors."
  exit 1
else
  echo ""
  echo "PASSED: Task documentation and agents are valid."
  exit 0
fi
