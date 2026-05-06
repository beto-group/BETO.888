---
name: beto-anti-patterns
description: Common errors, pitfalls, and anti-patterns to avoid when developing Datacore components.
---

# Beto Anti-Patterns & Troubleshooting

This skill documents common mistakes and "Gotchas" learned from actual development sessions. Review this before debugging "Blank Screens" or "Syntax Errors".

## 🚫 async View Factory Pitfalls

### The "Dangling Try/Catch"
**Error**: `SyntaxError: Unexpected token` or `missing }`
**Cause**: When wrapping dependency loading in `try/catch`, it's easy to accidentally leave a closing brace closing the `function` BEFORE the `catch` block, or creating a mismatch.
**Fix**: Always verify block structure when editing `index.jsx`.

```javascript
// WRONG
async function View() {
    try {
        await dc.require(...)
    // Missing catch or braces closed too early
    return <Component />
}

// CORRECT
async function View() {
    try {
       await dc.require(...)
    } catch (e) {
       return <Error />
    }
    return <Component />
}
```

### Context Loss (`dc is undefined`)
**Error**: `ReferenceError: dc is not defined` or `Cannot read properties of undefined`
**Cause**: Relying on global `dc` visibility inside the View function scope can be flaky depending on how Datacore executes the `eval`.
**Fix**: ALWAYS pass `dc` explicitly from the viewer markdown and accept it in the factory.
```javascript
// Viewer.md
return await View({ folderPath }, dc);

// index.jsx
async function View({ folderPath }, dcOverride) {
    const localDc = dcOverride || window.dc;
}
```

## 📂 File Structure & Naming

### Entry Point Confusion
**Error**: Component not loading when checking `D.q.component.name.md`.
**Rule**: The standard entry point MUST be named `D.q.<name>.viewer.md`.
*   ❌ `D.q.retromorph.game.md`
*   ✅ `D.q.retromorph.viewer.md`
### Local Agent Profile Duplication

**Anti-Pattern**: Copy-pasting `RALPH_WIGGUM.md` or `COORDINATOR.md` into every new component's `_resources/agents` folder.
**Symptom**: Methodology fragmentation; difficulty updating agent rules project-wide. 
**Cause**: Attempting to decentralize coordination logic instead of using the central `SKILL` directory.
**Fix**: Keep all coordination logic, slash commands, and roles in `_RESOURCES/SKILL`. Reference these central files from the component's `task.md` or via specific role adoptions.

### `adapter.mkdir` Non-Recursive Failure
**Error**: `mcp_state.json` fails to write silently, halting state initialization.
**Cause**: Obsidian's `adapter.mkdir` is NOT recursive. Creating `_resources/data` when `_resources` does not exist causes a silent rejection if unhandled.
**Fix**: Explicitly create parent directories in multiple steps before asserting subdirectories.


## 🛠️ Tooling & Edits

### Empty Target Replacement
**Error**: AI Agent fails to apply edits.
**Cause**: Targeting an empty line or "nothing" with `replace_file_content` often fails.
**Fix**: Target a known adjacent line or use `write_to_file` to overwrite if the file is small enough.

### The JSX Template Literal Double-Escape
**Error**: `SyntaxError: Unexpected token, expected "," (line:col)`
**Cause**: When an AI agent uses `write_to_file` to write a JSX component containing template literals (e.g., `` `3px solid ${color}` ``), the agent sometimes over-escapes the backticks and dollar signs (`` \`3px solid \${color}\` ``) in its string payload. When transpiled by Babel inside Datacore, this throws a hard syntax error.
**Fix**: Agents must write template literals natively without extra backslash escaping when generating JSX React code via tools, OR strictly review their generated string payloads to ensure valid JSX syntax before committing.

### The Stale Screenshot
**Error**: AI Agent presents a screenshot that doesn't match the new code (e.g., showing a red syntax error after the fix was applied).
**Cause**: Datacore's hot-reload might sometimes leave the old error boundary active in the DOM, or the `dev:screenshot` command might execute against a stale view state if the tab wasn't refreshed.
**Fix**: ALWAYS use `obsidian open path="..."` to force a view refresh/re-instantiation immediately BEFORE calling `dev:screenshot`. This ensures the captured image reflects the exact state of the latest code.

## 📡 Networking & State Anti-Patterns

### 1. Aggressive State Overwriting
*   **Anti-Pattern**: Using `setX(newData)` without checking if `newData` is empty or invalid.
*   **Result**: Empty server responses (common during propagation/lag) wipe out valid locally cached data.
*   **Fix**: Always verify `entries.length > 0` before updating global state. Preserve local data on null/empty responses.

### 2. Unprotected Route Exposure
*   **Anti-Pattern**: Referencing destructive endpoints (e.g., `/delete`, `/update-username`) in the public game client.
*   **Result**: Malicious users or accidental logic bugs could compromise leaderboard integrity for all players.
*   **Fix**: Only define and use required read/upload routes. Audit the codebase to ensure no delete-capable logic exists.

### 3. Identity Fragmentation
*   **Anti-Pattern**: Splitting GUIDs or tokens into pieces across different fields or using inconsistently matched protocols.
*   **Result**: Constant protocol mismatches and "Invisible Entry" bugs where the server accepts the score but the client can't find it.
*   **Fix**: Transmit tokens (GUIDs) as unified, verbatim strings. Use exact matching for identity highlight checks.

## 🎨 CSS Layout Anti-Patterns

### 4. Height: 100% in Flex Containers
*   **Anti-Pattern**: Using `height: 100%` on a child element when the parent uses `flex: 1` without an explicit height.
*   **Error**: Component appears as a blank screen (Container height collapses to 0px).
*   **Console Clue**: `💎 [HeroSection] Canvas internal: 800x600, DOM: 1200x0` — DOM height is 0.
*   **Fix**: Use `minHeight: 100vh` instead of `height: 100%` for full-screen embedded components.

```javascript
// ❌ WRONG - height: 100% resolves to 0px
<div style={{ width: '100%', height: '100%', flex: 1 }}>

// ✅ CORRECT - minHeight: 100vh guarantees visibility
<div style={{ width: '100%', minHeight: '100vh', flex: 1 }}>
```

### 5. Editing Generated Files Instead of Source
*   **Anti-Pattern**: Applying fixes directly to `.generated.jsx` files.
*   **Result**: Fixes are wiped out on the next `npm run shim` or rebuild.
*   **Fix**: Always edit the corresponding source file (e.g., `MarkdownRenderer.jsx`, `shim.js`). The build process generates `.generated.jsx` from source.

### 6. Web Shim Registry Key Collision
*   **Anti-Pattern**: Relying only on Registry lookup for component paths without handling nested dependencies.
*   **Error**: `Element type is invalid: expected a string... but got: undefined` when component uses `dc.require` for internal files.
*   **Root Cause**: Path `RetroMorphGame/src/components/HeroSection` matches `RetroMorphGame` in Registry, returns wrong module.
*   **Fix**: Add explicit `if (path.includes('SubComponent'))` checks BEFORE Registry lookup to handle internal dependencies via direct dynamic import.

## 📦 Module & Library Patterns (Datacore Specific)

### 7. Porting ESM Code with `export`
*   **Anti-Pattern**: Directly copying code containing ES6 `export` statements into Datacore `.js` files.
*   **Error**: `SyntaxError: Unexpected token 'export'`
*   **Cause**: `dc.require` evaluates script content inside a function scope. `export` is only valid at the top level of a real module.
*   **Fix**: Remove all `export` keywords. If the file is meant to be a module, use a **return** statement at the end of the file.
```javascript
// ❌ WRONG
export const myConstant = 42;

// ✅ CORRECT (Factory return)
const myConstant = 42;
return { myConstant };
```

### 8. Global Library Race Conditions
*   **Anti-Pattern**: Loading a library (like Three.js) via `loadScript` and immediately requiring a file that expects `window.THREE` to be globally available at the top level.
*   **Error**: `TypeError: Cannot destructure property 'Vector2' of 'window.THREE' as it is undefined.`
*   **Cause**: Scripts are evaluated immediately when `dc.require` is called. If the library isn't loaded yet, top-level accesses fail.
*   **Fix**: Use the **Library Factory Pattern**. Wrap your logic in a function that accepts the library as an argument, and call that function in your main component's `useEffect` after `loadScript` completes.
```javascript
// src/physics.js
return (THREE) => { ... logic ... }

// src/index.jsx
const physicsFactory = await dc.require('physics.js');
useEffect(() => {
  await loadScript(dc, 'three.js');
  const physics = physicsFactory(window.THREE);
}, []);
```
