# Datacore Component Best Practices

This guide outlines essential standards for developing high-performance, sync-resilient components within the Datacore ecosystem.

> [!IMPORTANT]
> **Building a new visual component?** Always start with the boilerplate found in `[DATACORE_COMPONENT_TEMPLATE](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/_RESOURCES/agents/DATACORE_COMPONENT_TEMPLATE.md)` to ensure correct memory management of WebGL/Three.js contexts during React hot-reloads.


## 🤖 Multi-Agent Workflow
**Standard Operating Procedure for AI Agents**:

> **Adopts the [[_RESOURCES/DATACORE/76 NextWebsite/_resources/agents/RALPH_WIGGUM|Ralph Wiggum Methodology]]**:
> *Stateless loops, File-System Memory, and Fresh Starts.*

1.  **START (Coordinator)**:
    *   Analyzes the request.
    *   **MUST** create a task file: `_resources/agents/tasks/[ID]_[TITLE].md`.
    *   Delegates to Planner.
2.  **PLAN (Planner)**:
    *   **MUST** read `PROJECT_CONTEXT.md` and this file.
    *   Reads the specific task file from `_resources/agents/tasks/`.
    *   Creates/Updates `_resources/agents/implementation/implementation_plan.md`.
    *   **STOP**: Wait for user/coordinator approval.
3.  **BUILD (Developer)**:
    *   Executes the plan.
    *   Strict adherence to `BEST_PRACTICES.md`.
4.  **VERIFY (Reviewer)**:
    *   Validates functionality and code quality.
    *   **CRITICAL**: Updates `walkthrough.md`.
5.  **SECURE (Security)**: Checks for path traversals and hardcoded secrets.
6.  **IMPROVE (Reviewer)**:
    *   **VERY LAST STEP**: Updates THIS file or agent prompts with new learnings.
    *   *Goal*: Make the next iteration faster and less error-prone.

*Always assume you are part of this chain. If you are starting fresh, check `task.md` to see where the previous agent left off.*



## 🚀 Performance & Mobile First
- **Lazy Loading**: Use `dc.require` only when needed. Avoid heavy imports at the top level.
- **Efficient State**: Avoid frequent `setState` calls during background tasks. Use `useMemo` and `useCallback` for expensive operations.
- **Native Bridges**: On mobile, use standard Capacitor/WebView intents where possible instead of fighting binary execution.

## 📦 Modular Architecture
- **Component Breakdown**:
    - `src/components/`: Reusable UI parts.
    - `src/hooks/`: Business logic and data fetching.
    - `src/utils/`: Generic helpers.
    - `src/styles/`: Design tokens and component styles.
- **View Factory**: The main `index.jsx` should act as a factory that loads dependencies, manages the Full-tab lifecycle, and returns the root `ViewComponent`.

## 🖥️ Full-tab Integration
- **Edge-to-Edge UI**: Components should use the "Full-tab" lifecycle to occupy the entire Obsidian tab, hiding default margins and padding.
- **Lifecycle Management**: Implement `useEffect` in the factory `index.jsx` to move the component to the `.view-content` wrapper and cleanup on unmount.
- **Reload Support**: Always include a manual "Reload" button to rebuild the component state without reloading the entire Obsidian app.
- **Status Bar Toggle**: When entering "Full-tab" mode, explicitly hide Obsidian's bottom status bar (`.app-container .status-bar`) to achieve true edge-to-edge immersion, and restore it on unmount.

## 🔌 Viewer Files
- **Viewer Component Syntax**: Datacore viewer files (e.g. `D.q.component.viewer.md`) MUST use the `datacorejsx` codeblock syntax to properly interact with routing and `src/index.jsx`. Do NOT use standard `dataviewjs`.
    - ❌ ````dataviewjs`
      `const req = await dc.require(fPath + '/src/index.jsx');`
      `req.View({ dc: dc, container: this.container, isFullTab: true });`
    - ✅ ````datacorejsx`
      `const activeFile = dc.resolvePath("D.q.component.viewer");`
      `const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));`
      `const { View } = await dc.require(folderPath + "/src/index.jsx");`
      `return await View({ folderPath, dc });`

## 🔄 Sync & Connectivity
- **Syncthing Aware**: Always assume the device might be offline. Use local storage first and sync in background.
- **Conflict Handling**: Use CRDT (Conflict-free Replicated Data Types) or UUIDs for all primary keys to prevent overlapping ID errors.

## 📂 Path Resolution
- **Absolute Paths**: Always use `dc.resolvePath(dc.basePath)` or carefully strip the filename from `dc.resolvePath(dc.path)` to get the directory. 
- **Script Require**: When requiring sibling files, ensured you are pointing to the directory, not the `.md` file path.
- **Codeblock Require**: When importing a JS module stored inside a Markdown Codeblock (e.g. `28 LoadScript`), ALWAYS wrap the URL in `dc.headerLink` so Datacore parses the block instead of interpreting the entire markdown file as JS.
    - ❌ `await dc.require('_RESOURCES/File.md', 'LoadScriptUpgrade')` (Fails with "not a JS/TS file")
    - ✅ `await dc.require(dc.headerLink(dc.resolvePath('_RESOURCES/File.md'), 'LoadScriptUpgrade'))`

## 🛠️ Syntax & Environments
- **NO ES MODULES**: Datacore's `dc.require` does NOT support ES6 `import`/`export` statements or CommonJS `module.exports`.
    - ❌ `import anime from 'animejs';`
    - ❌ `export async function View(...) { ... }`
    - ✅ `const { TableComponent } = await dc.require(fPath + '/src/components/TableComponent.jsx');`
    - ✅ `async function View(...) { ... }`... `return { View };` at the end of the file.
- **Path Resolution**: `dc.require` expects paths relative to the vault root.
    - ❌ `require('/absolute/path/to/file.js')` (Fails by appending to base path)
    - ✅ `await dc.require(fPath + '/src/utils/file.js')` (Constructs correct relative path)
- **JSX String Interpolation**: When using tools to write React JSX components containing Javascript string template literals, **NEVER** escape the backticks `\\\`` or the dollar signs `\\$`. Datacore uses a local Babel transpiler and escaping them directly in the write script will result in a `SyntaxError: Unexpected token`. Write them as standard unescaped Javascript template literals.

## 🎨 Aesthetics & Branding
- **Theme Standard**: "Black on Black on Black". Use absolute black `#000000` for backgrounds.
- **Accent Colors**: Use white `#ffffff` for primary text/icons and subtle purple `#8b5cf6` for accents and status indicators.
- **Glassmorphism**: Use semi-transparent backgrounds with blurs for a premium feel.
- **Icons**: MANDATORY use of `dc.Icons` from the IconsPack. 
    - Usage: `<dc.Icon icon="star" style={{ color: '#8b5cf6' }} />`
- **Controls Menu**: Consolidate top-right actions (Reload, Close, Settings) into a single `ControlsMenu` component to keep the UI clean.

## ⚠️ Pitfalls to Avoid
- **Hardcoded Absolute Paths**: User paths differ across systems. Always resolve dynamically.
- **Blocking the Main Thread**: Long sync operations should be debounced.
- **Ignoring unmounts**: Always return cleanup functions from `useEffect`.

## 🌐 Telegram & Networking
- **Secure WebSockets**: When using `gram.js` or similar libraries in this environment, always set `useWSS: true`. Modern secure contexts block insecure `ws://` connections.
- **LocalStorage Access**: Electron windows loaded via `data:` URIs have `null` origin and cannot access `localStorage`. Always use `win.loadFile(tempHtmlPath)` to grant a `file://` origin.
- **Path Resolution**: `fs` methods (like `readFileSync`) require absolute paths from the OS root. `dc.app.vault.adapter` methods use paths relative to the Vault root. Know which API you are using.
