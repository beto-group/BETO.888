# Current Goal: SKILL Brain Architecture Refactor

## Status: IN_PROGRESS
**Date**: 2026-03-26
**Objective**: Clear separation between volatile "Short-term" memory and persistent "Long-term" knowledge to improve agent reliability and SKILL portability.

## Key Focus
1.  **Memory Separation**: Move all session-specific data to `memory/active/`.
2.  **Purge Protocol**: Create a script to wipe `active/` memory before sharing.
3.  **Context Synchronization**: Implement `/remember` to help agents quickly orient.
4.  **Indexing**: Update `SKILL.md` to define the new brain hierarchy.

---
*Operational State for: beto.datacore*
