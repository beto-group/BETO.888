---
icon: layers
---
# Datacore Architecture Patterns

## 1. Module Factory Pattern
Standard ESM `import`/`export` keywords are often restricted by the Datacore evaluation environment, leading to `SyntaxError: Cannot use import statement outside a module`.

### The Pattern
Wrap all modules in an `async function` or a standard function and return an object containing the members. Use `dc.require` for dependency injection.

**index.jsx (Factory Entry)**
```javascript
async function View({ folderPath, dc: dcCtx }) {
    const dcRef = dcCtx || dc;
    // Inject dependencies
    const { Member } = await dcRef.require(folderPath + '/src/utils/helper.js');
    
    function Component() { 
        return <div>{Member}</div>;
    }
    return <Component />;
}
return { View };
```

**Member Module**
```javascript
// No imports here
function Member() { ... }
return { Member };
```

## 2. CSP-Safe Asset Loading
Loading external CSS via `<link>` tags often violates Content Security Policy (CSP) in Obsidian.

### CSS Injection
Instead of linking to external CSS, fetch the CSS text and inject it into a `<style>` tag, or use libraries that support JSS (CSS-in-JS).

### Script Loading
Use the provided `dc.loadScript` or the internal `LoadScript` (Component 28) utility for caching and offline support. 

> [!CAUTION]
> Always verify the `dc` context contains the expected loader. In some environments, it may be `dc.app.loadScript` or required via a specific utility component.

### The Rule
Do NOT `dc.require` or depend on other "building block" components or external `.md` logic files. Instead, localize the necessary utility functions (like `loadScript`) directly into your component's codebase.

## 5. Immersive Layout Patterns (FullTab)
High-fidelity dashboards requiring edge-to-edge rendering must use the **DOM Reparenting** pattern.

### Why CSS Overrides Fail
Obsidian's UI hierarchy is deep. Aggressive CSS targeting the preview sizer often leaves "bleed" from parent padding or headers. 

### The Reparenting Standard
- Move the root element to `.view-content` (outside the markdown preview tree).
- Apply `position: absolute` and `zIndex: 9998`.
- This ensures the component occupies the entire pane boundary, bypassing all internal Obsidian page styling.

## 5. FAQ & Common Debugging

### The "Blank Screen" (Silent Crash)
**Symptom**: The component area is completely blank, and no React error boundary is visible.
**Cause**: Usually a runtime error during the evaluation of a required module (the "Factory Phase"). 
**Fix**: 
- Avoid destructuring `dc` hooks (like `useState`) at the top level of a module. Use `dc.useState` directly inside your components or destructure within the component function.
- Check for missing files in `dc.require`.
- Add `console.log` at the start and end of your modules to track evaluation.

### CSP Violations (Blocked Scripts/Styles)
**Symptom**: Console shows `Refused to load... violates Content Security Policy`.
**Cause**: Obsidian blocks external resource loading by default for security.
**Fix**: 
- **CSS**: `fetch` the CSS text manually and inject it into a `<style>` tag.
- **JS**: Use the `loadScript` utility which fetches and executes the code locally, bypassing direct `<script src>` blocks.

## 6. The Resilient Component (Consolidation)
For complex components that rely on multiple sub-modules (UI, Styles, Utilities), path resolution or `dc.require` delays can sometimes cause blank screens or race conditions.

### The Strategy
When a component faces persistent "Load Failures" or "Blank Screens":
1. **Consolidate**: Merge `styles.jsx`, `Component.jsx`, and helpers into the main `index.jsx`.
2. **Eliminate Requires**: Minimize the number of `await dc.require` calls during the boot phase.
3. **Internalize Utilities**: Instead of requiring global utilities, paste the verified logic (like `loadScript`) directly into the factory.

### Old Code Caching (Persistence Issues)
**Symptom**: You've updated the script, but the console still shows errors from the previous version.
**Cause**: `dc.require` and the browser may cache script evaluation.
**Fix**: 
- Add a dummy edit to the `.viewer.md` file (e.g., a space or a character) and save to trigger a re-evaluation.
- Rename the exported factory function (e.g., `View` -> `View_v2`) and update the `.md` file to force a fresh import.
- Close and reopen the Obsidian leaf/tab.

## 7. The Internal Reference Law (Preventing Silent Crashes)
In the Datacore evaluation environment, global variables like `dc` may not always be available in the global scope during the file's evaluation phase. Relying on them directly can cause a `ReferenceError` that hangs the entire factory.

### The Problem
```javascript
// BAD: Will crash if 'dc' is not in the global scope during evaluation
async function View({ dc: dcCtx }) {
    const dcRef = dcCtx || dc; 
    // ...
}
```

### The Fix
Always treat the passed `dcCtx` as the primary source of truth and use defensive checks to avoid accessing a non-existent global `dc`.

```javascript
// GOOD: Safe and resilient
async function View({ dc: dcCtx }) {
    const dcRef = dcCtx;
    if (!dcRef) throw new Error("Datacore context (dc) was not provided to the factory.");
    
    // Now destructure from the safe reference
    const { useState, useEffect } = dcRef;
    // ...
}
```

---

## 8. Application Flow & Routing

### Controller Pattern
The recommended strategy for multi-screen apps (e.g., `ReceiptTracker`).
- A parent component manages a `view` state (e.g., 'list', 'edit', 'settings').
- Child views are dynamically loaded and rendered based on the active state.

### App Shell vs. Orchestrator
To avoid z-index and stacking context issues (common with `position: fixed`):
- **App Shell:** Render persistent UI (Navbar, Sidebar) in the top-level React layout (`WebsiteBuilder.jsx`).
- **Orchestrator:** Use Markdown (`INDEX.md`) to define routing, configuration, and body content, but not structural elements.
- **Safe Mode Transition:** When implementing complex view switching (e.g., [[17 ViewsControl]]), always implement a "Cleanup -> Stabilize -> Activate" pipeline. Clean up previous DOM listeners, revert to a default state to allow the ResizeObserver to settle, and then apply the new structural mode.

### Routing & Navigation
- **Wiki-Link Support**: For compatibility with Obsidian's properties editor, use **Quoted Wiki-Links** in frontmatter lists (e.g., `- "[[HOME]]"`).
- **File-Based Inference**: Route `[[PLAY]]` automatically to `PLAY.md`. To render a complex component for that route, create a wrapper `PLAY.md` that directs to the component: `{component: Arena}`.

---

## 9. State Management

- **Local (`useState`):** For UI-level interactions.
- **Persistent (`loadState`/`saveState`):** For user data, settings, and progress.
- **High-Frequency (`useRef`):** For loops requiring 60FPS or real-time audio (e.g., [[14 GameEngineBuild]], [[16 MusicBuilder]]). Store mutable state in `useRef` and trigger React renders only for visual feedback (Playheads, OS-level HUDs).

---

## 10. Component Complexity Levels

Established patterns for organizing Datacore components based on their complexity.

### 🟢 Simple Components (Atomic/Utility)
- **Use Case**: Single-purpose tools, simple data viewers.
- **Folder Structure**: Manifest, Viewer Block, and `src/` containing `index.jsx`, `styles/styles.jsx`, and `utils/domUtils.jsx`.

### 🟠 Interactive Components (Modular)
- **Use Case**: UI-heavy tools with complex interactions.
- **Folder Structure**: Adds `src/components/` for logic-heavy and pure UI separation, and `src/utils/coreUtils.js`.

### 🔴 Monolithic Components (Full-Scale Apps)
- **Use Case**: WebGL environments, full dashboards, multi-file logic.
- **Folder Structure**: Adds `_resources/` for static assets, `tests/`, and dedicated `hooks/` for lifecycle extraction.

> [!TIP]
> **Evolutionary Tip:** Start small. If your `index.jsx` exceeds 300 lines, extract logic into `hooks/` or `components/`.

---

## 11. Relative Pathing & Portability
With the shift toward modular folder structures, avoid all absolute vault paths.

- **Standard**: Always use `dc.resolvePath()` for internal asset lookups.
- **Deep Nesting**: Modules in `src/` should use `../` to reference resources in the parent project directory.
- **Master Index**: When scanning for modules, resolve the master file first and derive the `basePath` from it to keep child lookups relative.

See the full **[Modular Path Resolution Standard](./architecture/modular-path-resolution.md)** for implementation details.
