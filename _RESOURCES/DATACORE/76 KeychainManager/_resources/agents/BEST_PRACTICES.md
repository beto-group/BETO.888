# Datacore Component Best Practices

This guide outlines essential standards for developing high-performance, sync-resilient components within the Datacore ecosystem.


## 🤖 Multi-Agent Workflow
**Standard Operating Procedure for AI Agents**:

> **Adopts the [[_RESOURCES/DATACORE/82 KeychainManager/_resources/agents/RALPH_WIGGUM|Ralph Wiggum Methodology]]**:
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
    - **One Component per File**: (NEW) Every functional component should reside in its own `.jsx` file to ensure clarity and allow for modular `dc.require` calls.
    - `src/components/`: Reusable UI parts.
    - `src/hooks/`: Business logic and data fetching.
    - `src/utils/`: Generic helpers.
    - `src/styles/`: Design tokens and component styles.
- **View Factory**: The main `index.jsx` should act as a factory that loads dependencies, manages the Full-tab lifecycle, and returns the root `ViewComponent`.

## 🖥️ Full-tab Integration
- **Edge-to-Edge UI**: Components should use the "Full-tab" lifecycle to occupy the entire Obsidian tab, hiding default margins and padding.
- **Lifecycle Management**: Implement `useEffect` in the factory `index.jsx` to move the component to the `.view-content` wrapper and cleanup on unmount.
- **Reload Support**: Always include a manual "Reload" button to rebuild the component state without reloading the entire Obsidian app.

## 🔄 Sync & Connectivity
- **Syncthing Aware**: Always assume the device might be offline. Use local storage first and sync in background.
- **Conflict Handling**: Use CRDT (Conflict-free Replicated Data Types) or UUIDs for all primary keys to prevent overlapping ID errors.

## 📂 Path & Script Resolution
- **Absolute Paths**: Always use `dc.resolvePath(dc.basePath)` or carefully strip the filename from `dc.resolvePath(dc.path)` to get the directory. 
- **Standardized Script Loading**: (NEW) For external libraries (CDNs), **MUST** use the `loadScript` utility from `D.q.loadscript.component.md`. This handles caching and ensures libraries aren't loaded multiple times.
- **Script Require**: When requiring sibling files, ensured you are pointing to the directory, not the `.md` file path.

## 🛠️ Syntax & Environments
- **NO EXPORTS**: Datacore's `dc.require` does NOT support ES6 `export` statements. 
    - ❌ `export async function View(...) { ... }`
    - ✅ `async function View(...) { ... }`... `return { View };` at the end of the file.

## 🎨 Aesthetics & Branding
- **Theme Standard**: "Black on Black on Black". Use absolute black `#000000` for backgrounds.
- **Accent Colors**: Use white `#ffffff` for primary text/icons and subtle purple `#8b5cf6` for accents and status indicators.
- **Glassmorphism**: Use semi-transparent backgrounds with blurs for a premium feel.
- **Icons**: MANDATORY use of `dc.Icons` from the IconsPack. 
    - Usage: `<dc.Icon icon="star" style={{ color: '#8b5cf6' }} />`
- **Controls Menu**: Consolidate top-right actions (Reload, Close, Settings) into a single `ControlsMenu` component to keep the UI clean.

## ⚠️ Pitfalls to Avoid
- **Hooks in Async Functions**: (CRITICAL) Never use React hooks (`useState`, `useEffect`, etc.) inside an `async` function. This causes the `__H` null error because hooks require a synchronous execution context. Move hook logic into a synchronous sub-component instead. (See [TROUBLESHOOTING.md](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/_resources/agents/TROUBLESHOOTING.md))
- **Hardcoded Absolute Paths**: User paths differ across systems. Always resolve dynamically.
- **Blocking the Main Thread**: Long sync operations should be debounced.
- **Ignoring unmounts**: Always return cleanup functions from `useEffect`.

## 🆕 New Component Initialization
1.  **Factory -> Component Pattern**: To avoid `__H` hook errors:
    -   `src/index.jsx` MUST export an `async function View({ folderPath })`.
    -   Inside `View`, define a `function InternalComponent() { ... }` that holds all hooks.
    -   `return <InternalComponent />` from `View`.
2.  **Dynamic Path Passing**: 
    -   Calculate `folderPath` in the **Viewer MD file** (`activeFile.substring(...)`).
    -   Pass it as a prop: `View({ folderPath })`.
    -   Do NOT try to calculate paths inside `src/index.jsx` (it lacks context).
3.  **Destructuring Imports**: 
    -   Use `const { useState, useEffect } = dc;`
    -   Use `const { useState, useEffect } = dc;`
    -   Avoid `const { useState } = React;` as `React` global might be undefined.

## 📐 Full-Tab & Standard UI Patterns
(Ref: `66 BasicFolderView`, `82 KeychainManager`)

### 1. The "Dual Mode" Pattern
Components MUST support both **Compact Mode** (embedded in a note) and **Full Tab Mode** (fullscreen).
-   **Prop**: `isFullTab` (boolean), `onToggleFullTab` (function).
-   **Render**: 
    -   `if (!isFullTab)` -> Return a simple header/banner with an "Enter Full Mode" button.
    -   `else` -> Return the full application UI.

### 2. Standard Controls
-   **ControlsMenu**: Create `src/components/ControlsMenu.jsx` for top-right actions (Reload, Close/Minimize).
-   **Hover Visibility**: Use CSS to make controls fade in on hover for a cleaner look.

### 3. Lifecycle & Portal
The `src/index.jsx` MUST handle the DOM manipulation to break out of the markdown container:
-   **Placeholder**: Insert a hidden div to hold the spot in the note.
-   **Append to `.view-content`**: Move the component container to the root view content for edge-to-edge rendering.
-   **Cleanup**: Restoration of the original parent on unmount is CRITICAL.

### 4. Styles
-   **Variables**: Use Obsidian's native CSS variables (`var(--background-primary)`, `var(--text-normal)`) for seamless theming.
-   **Structure**: `src/styles/styles.jsx` should export a `STYLES` object.

### 5. Standard Props
-   **styles**: The component should accept `styles` (lowercase) as a prop.
    -   `index.jsx`: `<Component styles={STYLES} />`
    -   `Component.jsx`: `({ styles: STYLES })` (Destructure and alias if needed).
-   **ControlsMenu**: Pass the component class/function, not an instance.

## 🔐 Keychain & SecretStorage
(Ref: `82 KeychainManager`)
Obsidian 1.11+ provides a native `SecretStorage` mechanism for handling encrypted data (API Keys, Tokens).

### 1. Direct Access (Inspection)
- **Object**: `dc.app.secretStorage.secrets`
- **Listing**: Unlike standard `SecretStorage` docs, you CAN list keys via `Object.keys(dc.app.secretStorage.secrets)`.
- **Structure**: `{ [keyName]: "sealed_blob_..." }`
- **CRYPTO OFFLINE (WARNING)**: If `dc.app.shard` is missing, `secretStorage.secrets` will store data as **Plaintext**. Always verify engine availability before storing production keys.

### 2. Native Operations (SecretStorage v1.11.4+)
For most cases, use the high-level native methods on `dc.app.secretStorage`. These handle encryption via the OS (DPAPI/Keychain) automatically.

```javascript
const storage = dc.app.secretStorage;

/* LIST */
const keys = await storage.listSecrets();

/* SET */
await storage.setSecret("my-key", "sensitive-value");

/* GET */
const val = await storage.getSecret("my-key");
```

**Note**: Use `dc.app.shard` only if you need low-level cryptographic control or custom capability requests. For simple key/value storage, use the high-level API shown above.

### 3. Design Tokens for Keychain
- **Access IDs**: Always use a descriptive `accessId` prefix (e.g., `datacore-openai`).
- **Persistence**: Sidecar JSON registry files are UNNECESSARY for SecretStorage keys because they are natively listed in `secrets`.
- **Security**: Never log decrypted values to the console. Display them in the UI only when explicitly requested by the user, and clear them on component unmount.

