# Datacore Component Best Practices

This guide outlines essential standards for developing high-performance, sync-resilient components within the Datacore ecosystem.


## 🤖 Multi-Agent Workflow
**Standard Operating Procedure for AI Agents**:

> **Adopts the [[_RESOURCES/DATACORE/99.1 RemotionClone/_resources/agents/RALPH_WIGGUM|Ralph Wiggum Methodology]]**:
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
- **Architectural Stability**: (NEW) Define configuration objects (like `FORMATS` or `THEME_CONFIG`) **OUTSIDE** the component function. This prevents them from being redefined on every render, which improves performance and avoids triggering unnecessary `useEffect` or hook cycles.

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
## Error: Component or Scene Not Appearing
- **Cause**: Datacore/Obsidian file system indexing delay or lack of file system watchers.
- **Solution**: 
    1. **Force Re-scan**: Implement a `Refresh` button 🔄 that triggers a manual `adapter.list()` of the directory.
    2. **Check Paths**: Ensure you are not working in a "copy" folder while checking the original project.
    3. **Metadata Check**: Verify `category` is present.
- **Script Require**: When requiring sibling files, ensured you are pointing to the directory, not the `.md` file path.

## 📦 Standard Component Pattern
- **Export Syntax**: (CRITICAL) Every library component **MUST** end with `return { ComponentName };`. This allows the host `dc.require` to destructure and register it in the drawing registry.
- **Prop Mapping**: Components should merge incoming props from `.json` scenes with their defaults from `metadata`.
    ```javascript
    const { speed, color } = Component.metadata.reduce((acc, item) => {
        acc[item.id] = props[item.id] !== undefined ? props[item.id] : item.default;
        return acc;
    }, {});
    ```
- **Layering**: Ensure `z-index` is exposed in high-level renderer wrappers like `Sequencer` to allow manual override of layer order.

## 🛠️ Syntax & Environments
- **NO ES6 EXPORTS**: Datacore's runtime does NOT support `export` keywords.
    - ❌ `export default Component`
    - ✅ `function Component(...) { ... }` ... `return { Component };`

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
- **Flexbox Compression**: (NEW) When rendering a fixed-aspect-ratio element (like the video stage) inside a `display: flex` container, always apply `flex-shrink: 0`. This prevents the container from compressing the element into an incorrect aspect ratio (like forcing a 16:9 stage into a square).
## Error: Invisible Layers / Missing Assets
- **Contrast Collision**: Using `PureWhiteBackground` with white text components. Check your `color` props in `SlackAd.json`.
- **Z-Index Shadowing**: Background layers accidentally overlapping foregrounds. Ensure `zIndex: 0` for background components.
- **ReferenceError: [var] is not defined**: Check your `map()` loops. Often occurs when using `(item, index)` indices for `key` or `zIndex` without declaring `index` in the argument list.
- **CSS Units in JS**: (NEW) Always provide explicit units (e.g., `px`, `%`) for dimension properties in React/Preact `style` objects. Unitless values are often ignored or cause inconsistent behavior across different browser environments.
