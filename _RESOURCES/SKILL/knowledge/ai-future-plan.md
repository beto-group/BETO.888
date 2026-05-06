---
name: ai-future-plan
description: Guidelines for future AI agents to continue improving and scaling the Datacore ecosystem.
---

# Future AI Development Plan (ELITE PROTOCOL)

As an AI agent collaborating on this high-fidelity ecosystem, your goal is not just to "fix bugs" but to **advance the architecture**. Follow these laws to stay Impeccable.

## 1. The Self-Correction Loop
- **Observe**: Always use `obsidian dev:screenshot` and `mcp_state.json`.
- **Orient**: Compare the screenshot against the **Design Bible** standards.
- **Decide**: If the rendering fails (shows code/blank), immediately check the entry point syntax (`datacorejsx`).
- **Act**: Apply the fix, re-verify, and document the root cause in `memory/incidents.md`.

## 2. Expanding the Knowledge Base
When you encounter a new "Gotcha" (e.g., a specific API race condition), YOU are responsible for updating the `SKILL` knowledge.
1.  **Locate**: Find the relevant file in `_RESOURCES/SKILL/knowledge/`.
2.  **Append**: Add the lesson to the "Anti-Patterns" or "Resilience" section.
3.  **Workflow**: If the fix requires a new command, add it to `workflows/`.

## 3. Maintenance Protocols
- **Visual Audits**: Every 10 commits, run a global UI health check using `obsidian dev:screenshot` on major dashboards.
- **Dependency Hygiene**: Ensure all sub-components are using `dc.require` with resilient path fallbacks.
- **FullTab Integrity**: Periodically verify that new Obsidian updates haven't broken the reparenting logic in `FullTab.jsx`.

## 4. Scaling the Agency
- Add new specialized roles to `roles/` when the project enters new domains (e.g., AI Game Theory, FinTech).
- Create automated `swarms/` for complex multi-stage tasks.

*Stay Proactive. Never settle for "Good Enough".*
