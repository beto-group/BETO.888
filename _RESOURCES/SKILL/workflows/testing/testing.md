# /testing Protocol (v1.0)

This workflow defines the mandatory testing sequence for all Datacore components. Skipping these steps is a violation of the **Consolidated Master Protocol**.

## 1. Syntax Radiography
Before declaring a component "Ready", the agent MUST verify the syntax through the CLI.
- **Command**: `obsidian eval code="require('<component_path>')"`
- **Requirement**: No `SyntaxError` should be returned. If JSX is present, the agent MUST verify that the environment's transpiler is active, or switch to **Hyperscript (`h`)** for maximum sterility.

## 2. Kernel Handshake Pulse
Use the CLI to verify that the kernel logic can instantiate without a UI.
- **Protocol**: Write a standalone `test.js` script that mocks the `dc` global and executes `View()`.
- **Command**: `node test.js` (for logic) or `obsidian eval` (for runtime).

## 3. Safe Agent Command Verification
Verify that the `mcp_commands.json` channel is responsive.
1.  **Write Pulse**: `echo '{ "action": "reload", "executed": false }' > mcp_commands.json`.
2.  **Verify Polling**: Wait 2000ms.
3.  **Check Status**: Verify that `"executed": true` is written back by the background agent.

## 4. Synthesis Telemetry Loop
For networking components (like Clawless Hub), a successful test MUST include:
- A verified `test_discovery` result in `mcp_activity.json`.
- A verified `test_synthesis` status (200 OK) captured via the bridge telemetry.

---
*Beto Group LLC | Lead Architect Agent Standard*
