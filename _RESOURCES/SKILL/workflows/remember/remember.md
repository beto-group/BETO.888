---
description: Start of session synchronization. Load the active task context and current goals.
---

# /remember Session Synchronization

Use this workflow at the start of every session or when switching task context to ensure the agent is aligned with the "Master Brain's" active state.

## 1. Localize the Brain
1.  **Read**: `_RESOURCES/SKILL/memory/active/current-goal.md`.
2.  **Read**: `_RESOURCES/SKILL/memory/active/session-context.md`.
3.  **Cross-Check**: Verify if the `task.md` in the current working directory matches the global goal.

## 2. Orient to Context
Identify the following from the Master Brain:
- **Active Goal**: What is the overarching objective for the current sprint?
- **Session State**: What specific technical variables (Session IDs, active hooks) are in play?
- **Recent Lessons**: Any "Harvested" insights from the current session that haven't been fully baked into long-term knowledge yet?

## 3. Resume
Update the current `task.md` (or create one) to reflect the alignment with the Master Brain and proceed with the next logical step.

---

// turbo-all
