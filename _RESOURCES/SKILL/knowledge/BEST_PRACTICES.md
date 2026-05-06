# Datacore Boilerplate Best Practices

This boilerplate is designed for **High Performance**, **Self-Correcting Agents**, and **Modular Architecture**.

## 🏗 Project Structure
- `src/index.jsx`: Entry point and View Factory. Handles dependency injection and layout.
- `src/components/`: Pure UI components.
- `src/hooks/`: Reusable logic (FullTab, Sync, etc.).
- `src/styles/`: Global styles and design tokens.
- `src/TestRunner.jsx`: Real-time, detached unit test engine.
- `tests/suite.jsx`: Component-specific test logic.

## 🤖 Agent Interaction (Hands & Eyes)
Every component MUST include the `MCPBridge.jsx` to allow AI agents to verify and control the UI autonomously.

### 🧤 The Hands (Commands)
Agents can write to `mcp_commands.json` to trigger actions:
- `reload`: Rebuilds the component to pick up code changes.
- `screenshot`: Captures a focused visual of the component.
- `click`: Simulates a DOM interaction via selector.
- `run_tests`: Spawns the unit test debugger.
- `devtools`: Opens Obsidian's inspector.
- `ping`: Verifies bridge responsiveness and connection health.

### 👁 The Eyes (Observation)
Agents monitor the following to verify state:
- `mcp_state.json`: Current UI health and status.
- `mcp_screenshot.png`: Visual verification.
- `tests/latest_results.json`: Proof of technical correctness.

### 🛡 Absolute Verification Protocol (CRITICAL)
Before marking a UI task as "COMPLETED", the agent MUST perform a visual audit:
1.  **Capture**: Run `obsidian dev:screenshot` at EVERY major creation step.
2.  **Audit**: View the screenshot file immediately to verify rendering.
3.  **Validate**: Confirm the image contains the expected UI. If the image shows plain code or an empty screen, the verification has FAILED.
4.  **Proof**: Document the audit result (with embed links) in the final walkthrough.

### 🎛 CDP & Native Autonomous Verification
Agents MUST leverage both CDP and Native Node APIs for for real-time state verification:
1.  **Console Monitoring**: Use `obsidian dev:console` after a `reload` to verify API handshakes.
2.  **DOM Inspection**: Use `obsidian dev:dom selector=".your-class" all=true` to confirm successful rendering.
3.  **Native Execution**: Use `require('child_process')` in Datacore for robust, terminal-fidelity commands (e.g., `pgrep`, `lsof`).
4.  **Cache-Busting Protocol**: If `dc.require` sub-modules fail to update, RENAME the file (e.g., `_v2.jsx`) and update the `require` call.
5.  **Self-Correction**: If logs show errors (e.g., 401 Unauthorized), fix the code and re-verify BEFORE notifying the user.

*Always assume you are part of this chain. If you are starting fresh, check `task.md` to see where the previous agent left off.*

## 🧭 Vault Navigation & Modification (Obsidian CLI)
**Command Line Efficiency**:
To interact with the vault via the official **Obsidian CLI**, use the `obsidian` command with URI parameters.
- **Navigation**:
    - Open File: `obsidian "obsidian://open?vault=VaultName&file=path/to/file.md"`
    - Open Vault: `obsidian "obsidian://open?vault=VaultName"`
    - New Note: `obsidian "obsidian://new?vault=VaultName&name=NewNote&content=Hello"`
- **Search**:
    - Global Search: `obsidian "obsidian://search?vault=VaultName&query=MyQuery"`
- **Why?**: The official CLI uses URI actions to trigger the app's internal logic directly, ensuring all plugins and metadata caches are correctly synchronized.




## 🚨 Essential Workflow Protocol (Step 0)
**Before starting any task**, always insure the **Agent Console** is open and active.
1.  **Open Console**: Use `Ctrl+T` or trigger `{"action": "run_tests"}` via MCP.
2.  **Verify Connection**: Check that the console shows "ONLINE" and responds to `ping`.
3.  **Why?**: This console is your lifeline. If the main view crashes, this console allows you to fix it without manual intervention.

## ⚖️ Development Standards
1.  **Stateless Components**: Keep UI components pure; move logic to hooks.
2.  **Test-Driven Execution**: Never push a change without running the test suite via the `run_tests` command.
3.  **DPR Awareness**: Always account for Device Pixel Ratio when performing visual captures.
4.  **Cleanup**: Always detach event listeners and close external windows in `useEffect` cleanups.
5.  **Checkpointed Logging Protocol (CRITICAL)**: Always include verbose `console.log` and `console.error` calls at major architectural checkpoints (API boundaries, hook state changes, complex logic branches). This ensures visibility during remote debugging via user logs.

## 🧠 Agent-User Symbiosis: Prompting Standards
To achieve "Impeccable" outcomes, follow these interaction standards:

### 📥 For the User (How to Prompt)
1.  **Mention the "Impeccable" Goal**: Explicitly ask the agent to hit "Impeccable Status" (edge-to-edge, chrome-free) from the start.
2.  **Request "Step-by-Step Proof"**: Ask the agent to take `dev:screenshot` at *every* major creation step, not just the end.
3.  **Autonomous Mandate**: Tell the agent: "Treat this component as a baby; it must be able to test and bootstrap itself."
4.  **Audit Request**: Ask the agent to "Auditing the DOM" or "Perform a visual audit" before sharing work.

### 📤 For the Agent (What to Look Out For)
1.  **The Cache Trap**: Always check if your changes are reflected. If not, immediately use the **v10 rename protocol**.
2.  **Native Over Script**: If a shell script fails, use `require('child_process')` natively in the component logic.
3.  **Human setup blocks**: If a service requires manual registration (like Resilio), design a "Waiting for User" UI phase.
4.  **GPU Transparency**: Ensure backgrounds are OLED-ready (`#000`) for absolute edge contact.

---

## 🏗 Modular & Autonomous Conversion Best Practices
1.  **Baby Component Pattern**: Treat components as self-managing "babies." They must test themselves, collect their own operational data, and report outcomes autonomously.
2.  **Shared Utils First**: Always extract logic to `src/utils/logic.js` before modularizing UI.
3.  **SafeView Loading**: Use the `SafeView` pattern in `index.jsx` to catch syntax errors in sub-modules. 
4.  **Path Derivation**: Never hardcode folder paths. Use `dc.resolvePath` and pass `folderPath` down.
5.  **Cache-Busting Enforcement**: Always use versioned filenames (e.g., `MainComponent_v1.jsx`) for components to prevent loading stale code from the `dc.require` cache.
6.  **FullTab Immersion**: Always use **Brute-Force DOM Reparenting** to achieve a true edge-to-edge layout. This is the validated professional standard for "Impeccable Status."
7.  **Data Bifurcation (Performance)**: For components with large datasets (e.g., 800+ node graphs), NEVER embed the data directly in the `.viewer.md` code block. 
    - **Protocol**: 
        1. Write data to an external `.json` file.
        2. Use `dc.app.vault.adapter.read` inside the viewer to fetch it asynchronously.
        3. This prevents "Scroll-to-Load" blocking and ensures the viewer remains responsive.
