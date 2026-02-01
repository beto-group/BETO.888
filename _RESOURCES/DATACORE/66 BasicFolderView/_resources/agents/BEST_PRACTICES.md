# Datacore Component Best Practices

This guide outlines essential standards for developing high-performance, sync-resilient components within the Datacore ecosystem.


## 🤖 Multi-Agent Workflow
**Standard Operating Procedure for AI Agents**:

> **Adopts the [[RALPH_WIGGUM|Ralph Wiggum Methodology]]**:
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

## 🔄 Sync & Connectivity
- **Syncthing Aware**: Always assume the device might be offline. Use local storage first and sync in background.
- **Conflict Handling**: Use CRDT (Conflict-free Replicated Data Types) or UUIDs for all primary keys to prevent overlapping ID errors.

## 📂 Path Resolution
- **Absolute Paths**: Always use `dc.resolvePath(dc.basePath)` or carefully strip the filename from `dc.resolvePath(dc.path)` to get the directory. 
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
- **Hardcoded Absolute Paths**: User paths differ across systems. Always resolve dynamically.
- **Blocking the Main Thread**: Long sync operations should be debounced.
- **Ignoring unmounts**: Always return cleanup functions from `useEffect`.
