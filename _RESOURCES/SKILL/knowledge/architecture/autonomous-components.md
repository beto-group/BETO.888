---
name: autonomous-components
description: Methodology for Datacore components that manage and verify their own infrastructure via MCP.
---

# Autonomous Component Infrastructure

Datacore components are not just "UI widgets"; they are **portable units of capability**. In an autonomous architecture, a component is responsible for its own environmental requirements and lifecycle.

## 1. The "Baby" Lifecycle
A component is treated as a "Learning Baby" that evolves through iterative testing:
1. **Bootstrap**: The component includes logic to install its own dependencies (e.g., Resilio Sync, Syncthing) using local tools (Brew, NPM, Docker).
2. **Outcome Definition**: The component defines a "Desired Outcome" (e.g., "Files are syncing across devices").
3. **Workflow Verification**: The component uses the **MCP Bridge** to test its own outcome autonomously.
4. **Learning**: Success/Failure data is fed back to the AI Agent to refine the component's internal logic.

## 2. Infrastructure-as-Component (IaC)
Manifests and install scripts should live inside the component's directory:
```
125_Resilio_Manager/
├── src/
│   ├── index.jsx          # UI + Verification Logic
│   └── hooks/             # MCP / API Hooks
├── deployment/
│   ├── install.sh         # Environment Bootstrap
│   └── manifests/         # K8s or Docker manifests
└── memory/
    └── outcomes.md        # Log of test results for AI learning
```

## 3. Verification Protocols via MCP
To ensure a component actually *works*, it must be able to verify host-level state:
- **`process_check`**: Use `run_command` to verify the backup service binary is active.
- **`interface_audit`**: Use `read_browser_page` to verify the service Web UI is responsive.
- **`data_parity`**: Use `read_url_content` or `ls` to verify files are appearing where they should.

## 4. Portability Rules
- **Environment Agnostic**: Avoid hardcoding "Cloud" or "VPS" paths unless specifically requested. Use environment variables or relative paths.
- **Tool Discovery**: Components should first check if a tool exists (e.g., `which rslsync`) before attempting installation.
- **Graceful Failure**: If infra-setup fails, the component must remain usable as a "Status Monitor" while providing clear error data for the Agent to fix.
- **Strictly Atomic (Zero Cross-Linking)**: Under NO CIRCUMSTANCES should a component dynamically require (`dc.require`) or otherwise cross-reference logic from another Datacore component folder. If a utility (like a Keychain manager or UI widget) is needed, it must be **duplicated and installed locally** inside the component's own `src/utils/` folder. A component must be entirely self-contained so that deleting any other folder in the system does not break it.
