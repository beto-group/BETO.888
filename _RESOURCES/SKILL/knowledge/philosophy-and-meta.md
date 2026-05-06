---
icon: brain
---
# 🏛️ Philosophy & Meta: The Core Thinking
## KNOWLEDGE
Test results are rendered in a separate Electron window.
- **Why?** It prevents UI reloads from killing your test state.
- **How?** Press **Ctrl+T** or use the `run_tests` MCP command.
- **File**: `src/TestRunner.jsx`

### 2. Native MCP Bridge (Agent Hands & Eyes)
A built-in JSON-RPC bridge for AI Agents. See [[BEST_PRACTICES#🤖 Agent Interaction (Hands & Eyes)|Best Practices]] for full protocol details.

### 3. Modular View Factory
Standardized dependency injection.
- **Pattern**: `src/index.jsx` lazy-loads hooks, styles, and components, then injects them into the `ViewComponent`.
- **Consistency**: All components follow this strict separation of concerns.

## 🧬 Project Structure Reference

| File | Purpose |
|------|---------|
| `src/index.jsx` | View entry point & dependency injector |
| `src/components/MainComponent.jsx` | The core UI of your component |
| `src/components/ControlsMenu.jsx` | Top-level action buttons |
| `src/hooks/useFullTab.jsx` | Shared logic for portal-style rendering |
| `src/TestRunner.jsx` | Detached test window engine |
| `tests/suite.jsx` | Your component's unit tests |
| `skill/` | Instructions and logs for AI collaborators |

## 🛠 Interaction Protocol for Agents
See [[BEST_PRACTICES#🛠 Interaction Protocol for Agents|Best Practices]] for the technical specifications of triggering actions and verifying state.

### 4. Code Generation Pitfalls
When writing code that generates other code (e.g., `TestRunner.jsx` creating an HTML string for a detached window), you **MUST** escape nested template literals.
- **Bad**: `` `<div>${variable}</div>` `` (Parsers will try to evaluate this immediately)
- **Good**: `` `<div>\${variable}</div>` `` (Escaped backticks and variables are preserved for the generated file)
- **Consequence**: Failure to escape causes `SyntaxError: Unexpected token` during Datacore transpilation.

### 5. Security Hardening
AI Agents are powerful but can be dangerous if given unrestricted access.
- **Scope DOM Access**: Never use `document.querySelector` globally in MCP handlers. Pass a `containerRef` from the View to `MCPBridge` and scope queries to `containerRef.current`.
- **Command Allowlist**: Explicitly validate `cmdData.action` against an allowed list (e.g., `['reload', 'click']`). Reject everything else.
- **Sanitize Selectors**: Ensure `click` targets are part of your component's DOM tree.

### 6. Datacore API Limitations
- **Functional Components Only**: `dc` only exposes hooks (`useState`, `useEffect`, etc.) and basic components (`Stack`, `List`, `Card`).
- **No Class Components**: There is no `React.Component` or `preact.Component` exposed. **Error Boundaries are impossible** to implement using the standard `dc` object.
- **Styling**: `styles.jsx` (JS objects) is limited. Prefer injecting `<style>` tags for media queries and pseudo-selectors.
### 7. Modern CSS Architecture
- **Injected Styles**: Do not use inline `style={{ ... }}` objects. They start simple but become unmanageable and perform poorly.
- **Pattern**: 
    1. Define a standard CSS string in `src/styles/theme.css.js`.
    2. Use BEM-like classes (e.g., `.bfv-container`) in components.
    3. Inject it once using the `useTheme` hook in `src/index.jsx`.
- **Benefits**: Enforces consistency, enables pseudo-selectors (`:hover`), and supports media queries for mobile responsiveness.

### 8. Robust Debugging
- **Centralized Manager**: Never leave raw `console.log` calls in production code. Use `src/utils/debugManager.jsx`.
- **Capabilities**:
    - **Toggle**: Globally enable/disable logs via `debugManager.setEnabled(bool)`.
    - **Broadcast**: It automatically pipes logs to the `MCPBridge` for agent visibility (`_resources/mcp/mcp_logs.json`).
    - **Interception**: It patches the global console to capture output from third-party libraries or legacy code.
### 9. Test Window Synchronization
- **Problem**: Detached windows (like the Test Runner) don't automatically refresh when the main view reloads.
- **Solution**: Expose a `reloadTestWindow(folderPath)` function from `TestRunner.jsx` and call it within `handleCodeReload` in `index.jsx`.
- **Implementation**:
    - Use `BrowserWindow.getAllWindows()` to find the existing window by title.
    - Re-run the test suite and regenerate the HTML.
    - Use `win.loadURL` to refresh the content without closing the window.

### 10. Hook Usage in View Factory
- **Critical Rule**: Even when using the dependency injection pattern in `index.jsx`, **ALL hooks (including custom ones like `useTheme`) MUST be called inside the `ViewComponent` function**.
- **Error**: Calling `useTheme` at the top level of `View` (outside `ViewComponent`) causes `TypeError: Cannot read properties of null (reading '__H')`.
- **Correct Pattern**:
    ```javascript
    async function View({ folderPath }) {
        // ... imports ...
        function ViewComponent() {
            useTheme({ css: CSS, folderPath }); // CORRECT: Inside component
            // ...
        }
        return <ViewComponent />;
    }
    ```

### 11. Safe Event Handling in HTML Strings
- **Problem**: Passing complex objects to inline `onclick` handlers (e.g., `onclick="func('${JSON.stringify(obj)}')`) is fragile. Quotes inside the object break the HTML attribute.
- **Solution**: Use `data-attributes` to store the encoded string and read it back.
- **Pattern**:
    ```javascript
    const dataStr = encodeURIComponent(JSON.stringify(complexObj));
    return `
        <div 
            data-payload="${dataStr}" 
            onclick="handle(JSON.parse(decodeURIComponent(this.dataset.payload)))"
        >
            Click Me
        </div>
    `;
    ```

### 12. Absolute Paths in Detached Windows
- **Crucial**: Electron's `require('path')` and `fs` modules in a detached window context often fail with relative paths.
- **Fix**: Always resolve paths using `dc.app.vault.adapter.basePath` **before** generating the HTML/Script for the external window.
- **Example**:
    ```javascript
    const path = require('path'); // Node module
    const basePath = dc.app.vault.adapter.basePath; // Obsidian API
    const fullPath = path.join(basePath, folderPath, '_resources/mcp/mcp_logs.json');
    ```

### 13. Safe Loader & Robust Recovery
- **Problem**: If the `MainComponent` or its dependencies have a syntax error or runtime crash during boot, the entire React tree dies, including the `MCPBridge`. This makes the "Agent Console" useless for remote fixing.
- **Solution**: Use a "Safe Loader" pattern in `index.jsx`.
- **Implementation**:
    1.  **Inline Agent**: Start a minimal, pure-JS MCP agent (using `fs.readFileSync`) *before* any React components load.
    2.  **Lazy Loading**: Wrap the loading of the main application in a `try/catch` block.
    3.  **Crash Screen**: If loading fails, render a fallback UI with the error message.
    4.  **Persistent Connection**: Because the agent started first, the "Agent Console" remains connected. The agent can trigger a view rebuild (`dc.app.workspace.activeLeaf.rebuildView()`) once the code is fixed, allowing recovery without manual intervention.

### 14. Dynamic Documentation Reference
- **Resource**: `_resources/mcp/mcp_schema.json`
- **Pattern**: The Agent Console (Test Runner) reads this JSON file to generate its "Docs" tab.
- **Maintenance**: When adding new MCP actions, update the schema file to ensure the documentation stays in sync automatically.

### 15. Module Loading Pitfalls (dc.require)
- **Problem**: Destructuring from `dc.require` can fail if the module exports multiple functions/components but the `index.jsx` code expects a different structure.
- **Pattern**: When a module like `TestRunner.jsx` exports an object `{ View, spawnTestWindow, reloadTestWindow }`, avoid destructuring just one part if you need the utilities.
- **Correct**:
    ```javascript
    const TestRunner = await dc.require(path);
    // Use as: 
    // <TestRunner.View />
    // TestRunner.spawnTestWindow()
    ```
- **Dangerous**: `const { TestRunner } = await dc.require(path);` (Likely `undefined` if the file doesn't have a `TestRunner` property in its return object).

### 16. Browser-Compatible Libraries
Some Node.js libraries (like `gram.js`) are not browser-compatible by default.
- **Pattern**: Do not rely on `esm.sh` or `unpkg` if the library uses internal `instanceof` checks, as multiple chunks can break class identity.
- **Fix**: Create a customized **Webpack Browser Bundle** with necessary polyfills (`path-browserify`, `stream-browserify`, etc.) and load it as a single script file.
- **Deployment**: Commit the bundled file (e.g., `src/utils/my-lib.bundle.js`) to the repo and load it via `adapter.read()`.

### 17. Cache Busting for Injected Scripts
Datacore/Obsidian views are persistent, and browsers caching injected `<script src="...">` or module imports is extremely aggressive.
- **Problem**: Changing the file content on disk does **NOT** update the running script if the filename remains the same.
- **Solution**: Version your loader files (e.g., `client_v1.js` -> `client_v2.js`) to force a fresh load when major logic changes occur.

### 18. Global Bridge Registry (Stability Pattern)
- **Problem**: In Obsidian/Datacore, components often reload or re-render during development or state changes. If a component manages a long-lived socket connection (like Telegram), each reload creates a *new* connection without closing the old one, leading to "Socket closed" and session collision errors.
- **Solution**: Use a global registry attached to `window`.
- **Implementation**:
    ```javascript
    if (!window.__MCP_TG_REGISTRY__) window.__MCP_TG_REGISTRY__ = {};
    if (window.__MCP_TG_REGISTRY__[folderPath]) {
        bridgeRef.current = window.__MCP_TG_REGISTRY__[folderPath];
        return; // Re-use existing instance
    }
    // Create new and register
    const bridge = new Bridge();
    window.__MCP_TG_REGISTRY__[folderPath] = bridge;
    ```
- **Benefit**: Zero-interruption reloads and guaranteed singleton connections per project path.

### 19. Persistence Awareness in Detached Windows
- **Problem**: Detached Electron windows remain open even if the main Obsidian component leaf is closed. This leads to a "Ghost UI" where buttons like "Send" or "Reload" fail silently because the underlying bridge is dead.
- **Solution**: Implement a heartbeat check.
- **Implementation**:
    1. The main component updates `_resources/mcp/mcp_state.json` with a current `timestamp`.
    2. The detached window polls this file.
    3. If `(Date.now() - timestamp) > 10000`, the window style is updated to show a **"BRIDGE INACTIVE"** warning, disabling interactive elements.
- **Benefit**: Clear user feedback and prevention of orphaned UI states.

### 20. Global MCP Server (telegram-mcp)
Beyond the project-local bridge, we've implemented a **Global MCP Server** for account-level interaction.
- **Configuration**: Managed in `~/.gemini/antigravity/mcp_config.json`.
- **Server Path**: `/Users/blackbird/.nvm/versions/node/v20.19.5/bin/telegram-mcp`.
- **User Authentication**: Unlike the local project bridge (which uses Bots), the global server uses a **User Account**.
- **Privacy**: User tokens allow the agent to see messages and groups that are normally hidden from bots.
- **Two-Way Sync**: Enables the agent to read incoming Telegram messages and reply directly from the Antigravity chat interface, creating a seamless mobile-to-desktop workflow.
### 21. Modularization Strategy (Legacy Conversion)
Converting a monolithic `.md` component to the `src/` directory structure involves several key steps to ensure stability and path safety.
- **Wrapper Pattern**: The main `.md` file should be a minimal wrapper that resolves its own path and passes it to the modular entry point.
- **Factory Export**: Modular sub-files should return their logic/components through an asynchronous IIFE or factory function.
- **Vault-Relative Paths**: Always use absolute-ish vault paths for `dc.require` to avoid "Could not find script" errors.

**Correct Wrapper Template:**
```jsx
const activeFile = dc.resolvePath("MyComponent") || "path/to/MyComponent";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath });
```

### 22. Common Pitfalls & Quick Fixes

| Issue | Symptom | Root Cause | Fix |
|-------|---------|------------|-----|
| **[object Object]** | Text `[object Object]` appears instead of UI. | Wrapper returns a React element instead of a component function. | Ensure your wrapper returns a function: `return () => <MyComp />` or use the async `View` factory. |
| **Path Error** | "Could not find a script at..." | `dc.require` used a relative `./` path which doesn't resolve in Datacore. | Derive `folderPath` from `dc.resolvePath` and use it as a prefix: `folderPath + "/src/..."`. |
| **FullTab Failure** | Component is small/centered and doesn't fill tab. | `useFullTab` reparenting failed to find `.view-content` or `zIndex` was overridden. | Ensure the component root has `id="datacore-component-root"` and check console for "workspace-leaf-content not found". |
| **Dependency Loop** | "Maximum call stack size exceeded" | Two files require each other directly. | Move shared logic to a third file (e.g., `src/utils/logic.js`) and have both files depend on it. |

**Example: Sub-Module Dependency Resolution**
Sub-modules should also resolve the project root to find peers:
```javascript
// src/components/Nodes.jsx
const projectPath = (dc.resolvePath("MyComponent")).split('/').slice(0,-1).join('/');
const UI = await dc.require(projectPath + "/src/components/UI.jsx");
```

---

## TOOLS

## 🛠 Capabilities

### 1. ⚡ Reload Frame
Forces a complete reload of the Datacore component iframe.
- **Use Case**: Applying code changes without closing/opening the view.
- **Internal**: Writes `reload` action.

### 2. ⚙️ Settings
Opens the Obsidian Settings modal.
- **Use Case**: Verifying that the bridge functionality is working and the main app is responsive.

### 3. 🔍 Inspect (DevTools)
Opens the Electron Developer Tools for the iframe.
- **Use Case**: Debugging DOM issues, checking console logs directly, or inspecting network requests.

### 4. ▶ Test (Unit Tests)
Runs the `tests/suite.jsx` test suite.
- **Use Case**: Verifying logic after refactoring.
- **Feedback**: Shows Pass/Fail results directly in the console sidebar.

### 5. 🗑️ Clear History
Wipes the local activity and log history from the JSON files.
- **Use Case**: Starting a fresh debugging session.

### 6. 📚 Docs (Command Reference)
A dynamically generated library of all available MCP commands.
- **Source**: Powered by `mcp_schema.json`.
- **Use Case**: Quick lookup of command syntax and usage examples for agents.

## 🛡️ Robustness: The Safe Loader
The console is supported by a **Safe Loader** pattern in `index.jsx`:
1. **Immediate Agent**: A primitive MCP agent starts *before* React, using pure Node.js `fs`.
2. **Persistence**: Even if the main component crashes (syntax error, runtime exception), the console remains **CONNECTED**.
3. **Recovery**: You can trigger a `reload` from the console to boot the app back up after fixing code.

## 📡 Architecture
The console operates on a **polling loop** (1000ms interval) that watches:
1. `mcp_activity.json`: For actions executed by the main component.
2. `mcp_logs.json`: For console logs captured by the `debugManager`.
3. `mcp_schema.json`: For dynamic documentation generation.

The console is designed to be the "last man standing" in a crash scenario.

---

## roles
- **[[roles/product]]**: Product Managers and Rapid Prototypers.
- **[[roles/marketing]]**: SEO, Content, and Paid Media specialists.
- **[[roles/strategy]]**: Business Analysts and Growth Hackers.
- **[[roles/specialized]]**: Unique roles for niche technical or creative tasks.

## 🛠 How to Use Roles
When starting a complex task, the AI should:
1. **Identify the Domain**: Look into the corresponding folder in `roles/`.
2. **Adopt the Persona**: Read the `.md` file for the specific role (e.g., `engineering-software-architect.md`).
3. **Execute with Expertise**: Follow the specific standards, workflows, and "Thought Patterns" defined in that role's blueprint.

### Dynamic Delegation & Verification
For large-scale projects, the main agent can "delegate" sub-tasks to these specialized roles mentally. **Crucially**, every role-based execution must adhere to the **BetoNexus Prompting Standard**:
1.  **Look for "Impeccable Status"**: Always aim for edge-to-edge rendering and chrome suppression.
2.  **Autonomous Bootstrap**: Components are "babies"; they must install and test themselves.
3.  **Visual Proof First**: Use `obsidian dev:screenshot` and `obsidian dev:dom` at EVERY step. If you haven't seen it, you haven't verified it.
4.  **Cache-Busting Awareness**: If the UI isn't reacting, the script cache is likely stale. Perform the **v10 rename protocol**.

---
*Derived from the Agency-Agents Library. Optimized for Datacore High-Fidelity Infrastructure.*

---

## manifesto
Welcome to **BETO.888**, our evolving creative ecosystem.

## Vision

We aim to create immersive, data-driven, and "blissful" experiences within the Obsidian vault. This environment is built for developers and creators who see their personal knowledge base as a living, breathing application.

## Principles

1. **Analyze Each Creation:** Work is never finished; it is analyzed and distilled.
2. **Extract & Modularize:** Identify reoccurring patterns and extract them into reusable blocks.
3. **Compound Knowledge:** Combine data into massive, traversable sheets to understand behavior at scale.
4. **Digest & Evolve:** Use feedback, discussions, and "vibes" to iterate on the design documentation.

> [!IMPORTANT]
> This ecosystem is constantly evolving. Expect reworks and new patterns as we continue to push the boundaries of what is possible within a knowledge management system.

**Take Care.. We'll be around.. 🫡**

---

## meta-design
To minimize back-and-forth and achieve high-fidelity "wow factor" designs on the first try, agents should follow these prompting and implementation strategies.

## 🧼 Safe Porting & System Hygiene

When using the `/port` workflow:
- **Internal Scratchpad**: **MANDATORY** use of the `_RESOURCES/DATACORE/_TMP` directory for all clones and intermediate artifacts. Never use the system `/tmp/` or root vault folders.
- **Depth 1 Clone**: Always use `--depth 1` to minimize disk usage within the vault.
- **Atomic Cleanup**: The final step of any porting command **MUST** be the recursive deletion of the specific sub-folder created in `_TMP`.
- **No Residuals**: Ensure no hidden `.git` or `.npm` artifacts leak into the final component directory.

## 🚀 Prompting Strategies

When starting a new component task, the agent should include the following in its `implementation_plan.md` to align with the user's high-fidelity expectations:

1. **Aesthetic Anchors**: "Design with a 'Black on Black' glassmorphic aesthetic using #000 backgrounds and semi-transparent cards. Read `knowledge/design-bible/index.md` before proceeding."
2. **Visual Feedback Logic**: "Implement immediate visual feedback for all CDP actions, including reticle centering, scaling, and color transitions (Yellow = Targeting, Green = Complete)."
3. **Mechanical Verification**: "Include a 'Reality Verification' card that echoes raw CLI commands and captures real-time screenshots for visual proof."
4. **Micro-Animations**: "Mandatory use of CSS keyframes for click ripples and status pulses. Consult `knowledge/design-bible/reference/motion-design.md`."

## 🎨 The Front End Manifesto (MANDATORY)
For all pure visual and aesthetic choices (Typography, Grid, Colors, Spacing), you are strictly bound to the laws documented in **`knowledge/design-bible/index.md`**. Never use generic styles or default presets.

## 🏗 Implementation Patterns for First-Pass Success

### 1. The "Verified Action" Loop
Always implement an `addLog` and `setLastRawCommand` utility. Every CLI action should be preceded by a UI state update that tells the user *exactly* what is about to happen.

### 2. Spatially Aware Automation
When building grids or lists for automation (like `111 ObsidianAutomationCDP`):
- Assign `data-id` or `data-spot-id` to every target.
- Use a `useEffect` hook to `scrollIntoView` the active target. This makes the automation "followable" by the user.

### 3. Precision ID Targets
Don't just target containers. Create sub-pixel "Micro-Targets" (circles/reticles) with explicit IDs. This proves that the coordinate mapping and selector logic are accurate.

## 🎨 CSS-in-JS vs Injected Styles
While Datacore uses JS styles, **always inject a `<style>` tag** for globally reusable animations and complex pseudo-selectors. This allows for smoother transitions and more advanced CSS features than raw React style objects.

```javascript
const style = document.createElement('style');
style.innerHTML = `
    @keyframes pulse { ... }
    .my-target:hover { ... }
`;
document.head.appendChild(style);
```

## 📐 Layout Hygiene
- Group controls into logical "Cards".
- Use `backdrop-filter: blur(10px)` consistently for all floating elements.
- Ensure "Maximize/Minimize" functionality works via `useFullTab` to allow for full-view testing.

---

