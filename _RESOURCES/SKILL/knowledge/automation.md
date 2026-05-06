# Automation & CDP Integration

Datacore components can interact with the Obsidian environment using both the `obsidian` CLI and underlying CDP patterns for UI automation.

## 🕹 Obsidian CLI Commands

The `obsidian` CLI provides several commands specifically for automation and debugging:

### 1. UI Interaction
- `obsidian dev:click selector=".css-selector"`: Simulates a click on a specific element.
- `obsidian dev:click x=100 y=200`: Simulates a click at specific screen coordinates.
- `obsidian dev:mobile on|off`: Toggles mobile emulation mode.

### 2. State & Inspection
- `obsidian dev:dom selector=".target" [text]`: Returns the HTML or text content of a selector.
- `obsidian dev:screenshot path="snap.png"`: Captures a screenshot of the current Obsidian window.
- `obsidian dev:css selector=".target" prop="background-color"`: Inspects CSS properties of an element.

## 🛡️ CDP Reality Verification (Anti-Cheat)

To confirm that automation is actually interacting with the live Obsidian environment, implement the following verification suite:

1.  **Terminal Echoing**: Log the raw CLI command string (e.g., `obsidian dev:click selector="#my-id"`) to the UI before execution.
2.  **Instant Snapshots**: Trigger `obsidian dev:screenshot` and immediately render the resulting image in a verification card. This provides undeniable visual proof of state.
3.  **Live DOM Inspector**: Fetch the current DOM snippet using `obsidian dev:dom` and display it alongside the action to verify synchronization.

## 🎯 Precise Targeting Patterns

### 1. Randomized Grid Sequence
For testing coordinate accuracy across the entire workspace, generate a grid (e.g., 10x10) and iterate through spots in a **randomized order**.
- **Auto-Scroll**: Use `el.scrollIntoView({ block: 'center' })` on targeted spots to ensure the user can follow the action.
- **Visual Indicators**: Render a pulsing "reticle" or "ripple" animation on the targeted UI element to synchronize visual feedback with CDP command execution.

### 2. ID-Based Component Testing
Instead of relying on absolute coordinates, attach unique HTML `id` attributes to sub-elements.
- **Micro-Targets**: Place a small (e.g., 30px) "target circle" with a unique ID inside larger containers. Target the circle ID specifically to verify sub-pixel precision.

## 🏗 Implementation Pattern

To use these in a component, use the `CLIBridge` pattern:

```javascript
class CLIBridge {
    static async execute(command) {
        return new Promise((resolve) => {
            const spawn = require('child_process').spawn;
            const userShell = process.env.SHELL || '/bin/zsh';
            const obsidianPath = '/Applications/Obsidian.app/Contents/MacOS';
            const env = { ...process.env, PATH: `${obsidianPath}:${process.env.PATH}` };

            const child = spawn(userShell, ['-l', '-c', command], { env });
            let out = '';
            child.stdout.on('data', d => out += d);
            child.on('close', () => resolve(out.trim()));
        });
    }
}
```

## ⚠️ Best Practices
- **Rate Limiting**: Avoid rapid-fire automation commands to prevent UI flickering or hang-ups.
- **Async Safety**: Always wrap CLI calls in Promises to avoid blocking the React render cycle.
## 🧠 AI Consciousness (MCP Bridge)
The `MCPBridge` is the standardized gateway for AI agents to interact with Datacore components. See [[BEST_PRACTICES#🤖 Agent Interaction (Hands & Eyes)|Best Practices]] for full protocol details and command reference.

## 🔴 Common Pitfalls

### 1. View Factory Hang (Async Promise)
**Problem**: The component never loads, but console logs show dependencies are ready.
**Cause**: The `.viewer.md` is trying to render the async `View` factory as a React component `<View />`. React cannot render a Promise.
**Solution**: Always `await` the View factory in the viewer manifest:
```javascript
// WRONG
return <View {...} />;

// CORRECT
return await View({ folderPath, dc });
```

### 2. Sub-module Scope
**Problem**: Sub-components or styles fail to find the `dc` context.
**Cause**: Globals like `dc` might not be available in scripts loaded via `dc.require`.
**Solution**: Always pass the `dc` instance from the main `View` down to all child components.
