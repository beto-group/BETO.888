#!/usr/bin/env bash
#
# Beto Datacore: Memory Purge Utility
#
# Instantly wipes the volatile "Short-term" memory from the SKILL brain.
# Use this before sharing or distributing the SKILL folder.
#
# Usage: ./scripts/purge-memory.sh

set -euo pipefail

# Determine SKILL root
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEMORY_ACTIVE_DIR="$SKILL_DIR/memory/active"

echo "🧹 Beto Brain: Purging short-term memory..."

if [[ -d "$MEMORY_ACTIVE_DIR" ]]; then
  # Remove all files but keep the directory
  find "$MEMORY_ACTIVE_DIR" -type f -delete
  echo "OK: $MEMORY_ACTIVE_DIR is now clean (Volatile state cleared)."
else
  echo "WARN: Memory active directory not found at $MEMORY_ACTIVE_DIR"
fi

echo "🚀 SKILL folder is now distribution-ready."
