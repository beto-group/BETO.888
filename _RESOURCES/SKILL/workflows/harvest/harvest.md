---
description: Harvest new knowledge, patterns, and troubleshooting steps into the central SKILL knowledge base.
---

# /harvest Knowledge Extraction Protocol

Use this workflow at the end of a milestone or task to ensure "AHA!" moments and new architectural patterns are preserved.

## 1. Knowledge Audit
Review the current task documents and implementation:
- **`task.md` & `walkthrough.md`**: What was actually accomplished? 
- **Code Diffs**: Are there new reusable patterns or components?
- **Roadblocks**: What did we struggle with? What "Gotcha" was discovered?

## 2. Categorization & Extraction
Identify which central knowledge file should be updated:

### 🏛 Architecture & Infrastructure
- **Pattern**: A new system-wide rule or structural approach.
- **Action**: Update `SKILL/knowledge/architecture.md` or `SKILL/knowledge/automation.md`.
- **Example**: "Linting Termination Protocol" or "CDP-based UI verification".

### 🎨 Design & Aesthetics
- **Pattern**: A new visual style, CSS trick, or component interaction.
- **Action**: Update `SKILL/knowledge/design-bible/index.md` or `SKILL/knowledge/design.md`.
- **Example**: "Edge-to-edge rendering with zero margins".

### 💻 Development & API
- **Pattern**: A new JS helper, hook, or third-party library integration.
- **Action**: Update `SKILL/knowledge/development.md`.
- **Example**: `useFullTab` refinement for Obsidian v2.

### ⚠️ Anti-Patterns & Troubleshooting
- **Pattern**: Common errors, race conditions, or "what NOT to do".
- **Action**: Update `SKILL/knowledge/anti-patterns.md`.
- **Example**: "Multiple socket connections on reload".

## 3. Implementation
1.  **Draft Snippet**: Create a concise "Knowledge Item" following the format of the target file.
2.  **Inject**: Use `replace_file_content` to append the lesson. Use headers like `### [Date/Feature]` or add to specific category lists.
3.  **Cross-Reference**: If the knowledge is critical, update the **"Structure Overview"** in `SKILL/SKILL.md`.

## 4. Verification
- Verify that the added knowledge is searchable and well-formatted.
- Confirm with the USER that the extracted knowledge accurately represents the session's insights.

---

// turbo-all
