#!/usr/bin/env bash
#
# Beto Datacore: Session Sync (Rehydration)
#
# Usage: ./scripts/sync.sh [TARGET_COMPONENT_DIRECTORY]
#
# Copies the active memory context from the Master Brain to the 
# target component's local _resources/agents/ folder.

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEMORY_ACTIVE="$SKILL_DIR/memory/active"
TARGET_DIR="${1:-}"

if [ -z "$TARGET_DIR" ]; then
  echo "Error: Target component directory required."
  echo "Usage: $0 [ABSOLUTE_PATH_TO_COMPONENT]"
  exit 1
fi

AGENT_RESOURCES="$TARGET_DIR/_resources/agents"

echo "🧠 Syncing Master Brain Memory to $TARGET_DIR..."

mkdir -p "$AGENT_RESOURCES"

# Sync session context and current goal
cp "$MEMORY_ACTIVE/session-context.md" "$AGENT_RESOURCES/session-context.md"
cp "$MEMORY_ACTIVE/current-goal.md" "$AGENT_RESOURCES/current-goal.md"

# Also sync the CORE_RULES for reference
cp "$SKILL_DIR/roles/CORE_RULES.md" "$AGENT_RESOURCES/CORE_RULES.md"

echo "OK: Agent rehydrated. The component is now ready for autonomous execution."
