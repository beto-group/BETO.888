---
description: Finalize and terminate an agentic task with automated linting and cleanup.
---

# /terminate - Task Completion & Linting Protocol

// turbo-all
Use this workflow to finalize a task. This ensures all documentation is present, linting passes, and the environment is clean.

## 1. Automated Linting
Run the task validator to ensure all mandatory documentation and agent profiles are compliant.
- **Command**: `bash _RESOURCES/SKILL/scripts/lint-task.sh . _RESOURCES/SKILL`

## 2. Evidence Verification
Confirm that the `walkthrough.md` contains the required visual proof of work.
- **Check**: Look for embedded screenshots or recordings in `walkthrough.md`.
- **Visual Audit**: Ensure the final state matches the "Deep Immersion" standard.

## 3. Environment Cleanup
Remove temporary files used during development to maintain vault hygiene.
- **Cleanup**: `rm -f STOP_MARKER` (if used for loops).
- **Hygiene**: `rm -rf _TMP` (if used for repository porting).

## 4. Finalization
Mark the task as completed in the session memory.
- **Task Update**: Mark all items in `task.md` as `[x]`.
- **Termination**: Notify the user: "Task [ID] successfully terminated. All lints passed."

---
*Task completed. Status: Impeccable.*
