# Obsidian Verification Engine: CLI & CDP Integration (v1.0)

## 1. Overview
The Beto Group utilizes a specialized `obsidian` CLI that leverages the **Chrome DevTools Protocol (CDP)** to interact directly with the running Obsidian instance. This provides "Agent Eyes" into the renderer process, allowing for real-time verification of Datacore components, DOM states, and runtime logic.

## 2. Core Command Set

### `obsidian eval` (The Logic Probe)
Used to execute arbitrary JavaScript within the Obsidian environment.
- **Usage**: `obsidian eval code="dc.resolvePath('some/file.md')"`
- **Verification**: Use this to check if a variable exists, if a path resolves, or to trigger internal component methods.

### `obsidian dev:console` (The Telemetry Capture)
Captures and filters the Obsidian developer console.
- **Usage**: `obsidian dev:console level=error`
- **Verification**: Essential for catching silent failures in functional components (e.g., Datacore rendering errors that don't crash the app).

### `obsidian dev:dom` (The UI Validator)
Queries the live DOM of the active tab.
- **Usage**: `obsidian dev:dom selector=".datacore-view-container" text`
- **Verification**: Confirms that components are actually rendered and contain the expected data.

### `obsidian dev:screenshot` (Visual Proof)
Captures the current visual state of Obsidian.
- **Usage**: `obsidian dev:screenshot path="verification_snapshot.png"`
- **Verification**: Zero-placeholder policy requirement. Provides visual confirmation of "Elite UI" standards.

## 3. The CDP Protocol Bridge (`dev:cdp`)
For advanced orchestration, the `dev:cdp` command allows direct access to any Chrome DevTools Protocol method.
- **Method**: `obsidian dev:cdp method=Runtime.evaluate params='{"expression": "window.app.vault.getName()"}'`
- **Utility**: Allows the agent to perform low-level debugging, network interception, and performance profiling without relying on high-level CLI abstractions.

## 4. Integration with Datacore Testing
When testing a Datacore component:
1.  **Open Tab**: `obsidian tab:open file="Path/To/Component.md"`
2.  **Clear Console**: `obsidian dev:console clear`
3.  **Inspect DOM**: `obsidian dev:dom selector="h1" text`
4.  **Verify Errors**: `obsidian dev:console level=error`

---
*Beto Group LLC | Lead Architect Agent Standard*
