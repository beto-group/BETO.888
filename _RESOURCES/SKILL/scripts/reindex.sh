#!/usr/bin/env bash
#
# Beto Datacore: Brain Re-Indexing Automation (JSONL Ultra-Index v4.0)
#
# Scans the entire SKILL directory and rebuilds brain-index.jsonl with 
# rich metadata, automated workflow detection, and agency manifesto mapping.

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INDEX_FILE="$SKILL_DIR/brain-index.jsonl"

echo "🧠 Beto Brain: Rebuilding JSONL Ultra-Index..."

# Helper to extract description from Markdown YAML frontmatter
get_desc() {
  local file="$1"
  local desc=$(grep -m 1 "^description:" "$file" | sed 's/^description: //')
  if [ -z "$desc" ]; then
    echo "Master knowledge document."
  else
    echo "$desc"
  fi
}

# Clear previous index
> "$INDEX_FILE"

# 1. Metadata Record
echo "{\"type\": \"metadata\", \"protocol\": \"Beto Brain Index v4.0\", \"last_indexed\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" >> "$INDEX_FILE"

# 2. Knowledge Records
for f in "$SKILL_DIR"/knowledge/*.md; do
  name=$(basename "$f" .md)
  path="knowledge/$(basename "$f")"
  desc=$(get_desc "$f")
  echo "{\"type\": \"knowledge\", \"key\": \"$name\", \"path\": \"$path\", \"description\": \"$desc\"}" >> "$INDEX_FILE"
done

# 3. Agency Manifesto Records
for f in "$SKILL_DIR"/agency/*.md; do
  name=$(basename "$f" .md)
  path="agency/$(basename "$f")"
  echo "{\"type\": \"agency\", \"key\": \"$name\", \"path\": \"$path\", \"description\": \"Departmental role library.\"}" >> "$INDEX_FILE"
done

# 4. Workflow Records
for f in "$SKILL_DIR"/workflows/*.md; do
  name=$(basename "$f" .md)
  path="workflows/$(basename "$f")"
  echo "{\"type\": \"workflow\", \"key\": \"/$name\", \"path\": \"$path\", \"description\": \"Slash-command workflow.\"}" >> "$INDEX_FILE"
done

# 5. Specialized Records
echo "{\"type\": \"specialized\", \"key\": \"termination\", \"path\": \"knowledge/automation/linting-termination.md\", \"description\": \"Mandatory quality gate protocol.\"}" >> "$INDEX_FILE"
echo "{\"type\": \"specialized\", \"key\": \"core_rules\", \"path\": \"roles/CORE_RULES.md\", \"description\": \"Unified methodology for all agents.\"}" >> "$INDEX_FILE"

# 6. Template Records
echo "{\"type\": \"template\", \"key\": \"elite_view\", \"path\": \"templates/index.jsx.template\"}" >> "$INDEX_FILE"
echo "{\"type\": \"template\", \"key\": \"component_manifesto\", \"path\": \"templates/component-manifesto.md\"}" >> "$INDEX_FILE"

echo "OK: brain-index.jsonl updated with $(wc -l < "$INDEX_FILE") records."
