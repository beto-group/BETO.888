# Linting Termination Protocol

The **Linting Termination Protocol** is the final mandatory step in the Beto Datacore agentic workflow. it ensures that every task shipped by an AI agent meets the project's high-fidelity standards.

## 🎯 Objectives
- **Quality Assurance**: Confirm all documentation (`implementation_plan.md`, `walkthrough.md`, `task.md`) is present and meaningful.
- **Agent Hygiene**: Validate that any modified agent profiles follow the YAML and naming conventions.
- **Environment Cleanup**: Ensure no temporary markers or build artifacts are left in the vault.
- **Visual Proof**: Enforce the presence of a visual "Verification Audit" (screenshot) in the walkthrough.

## 🛠 The Mechanism

### 1. The Script: `lint-task.sh`
The orchestration script runs the following checks:
1.  **Documentation Shield**: Verifies the three core markdown files exist.
2.  **Screenshot Audit**: Checks `walkthrough.md` for at least one image/video embed.
3.  **Agent Linting**: Triggers `lint-agents.sh` on the local `_resources/agents` folder.
4.  **MCP Heartbeat**: Warns if a component is missing its live `mcp_state.json`.

### 2. The Workflow: `/terminate`
Agents must execute the `/terminate` workflow as their final action. 
```bash
# Automated execution
bash _RESOURCES/SKILL/scripts/lint-task.sh . _RESOURCES/SKILL
```

## ⚠️ Termination Failure
If the linting script returns a non-zero exit code:
1.  **Do Not Close**: The agent must NOT mark the task as completed in `task.md`.
2.  **Report**: The agent must output the specific errors found by the linter.
3.  **Remediate**: The agent must fix the issues and re-run `/terminate`.

## 📂 Related Files
- [[../../workflows/terminate.md]]
- [[../../scripts/lint-task.sh]]
- [[../../scripts/lint-agents.sh]]
