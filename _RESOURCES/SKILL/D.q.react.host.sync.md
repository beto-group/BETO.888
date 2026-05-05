# SKILL: Global Identity Hijack (React Sync)

The forensic protocol for synchronizing React runtimes between a DataCore host and a native Obsidian plugin to prevent versioning crashes.

## 🔴 The Problem: Error #525
**Minified React Error #525** (or "A React Element from an older version...") happens when two different React instances (e.g., React 19 vs React 18) try to share the same DOM element or hook context.

In our ecosystem:
- **DataCore Host**: Usually runs **React 18**.
- **Native Plugin**: Might accidentally bundle **React 19** from `node_modules`.

## 🛡️ The "Nuclear Isolation" Strategy
To eliminate #525, the native plugin MUST NOT have its own React runtime. It must "hijack" the one already running in the window.

### 1. Build-Time Alienation
Configure `esbuild` to strictly externalize all React paths. This prevents any React code or internal symbols from entering the `main.js` bundle.

```bash
--external:react \
--external:react-dom \
--external:react/jsx-runtime \
--external:"react-dom/*" \
--jsx=transform
```

### 2. Runtime Identity Hijack
In your `main.tsx` (the native entry point), manually resolve React from the host environment before any components are rendered.

```typescript
// 🛡️ IDENTITY HIJACK
let React, ReactDOM;
try {
    React = window.React;
    ReactDOM = window.ReactDOM;

    // Fallback to Obsidians internal CommonJS loader
    if (!React && typeof require !== 'undefined') React = require('react');
    if (!ReactDOM && typeof require !== 'undefined') {
        try { ReactDOM = require('react-dom/client'); } catch(e) { ReactDOM = require('react-dom'); }
    }
} catch (e) {
    console.error("IDENTITY_CRASH: React not found in host.", e);
}
```

### 3. Unified Rendering
Always use the hijacked `ReactDOM` to create the root, and ensured components use the hijacked `React` via `React.createElement` (or the `jsx=transform` build setting).

```typescript
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App, { ... }));
```

## 🔍 Forensic Verification
If the plugin opens, check the console:
- `[Dossier OS] React Version: 18.2.0` (Target Version)
- If you see `React Version: 19.x.x`, the isolation has leaked and **#525 is imminent.**

---
*Last Update: 2026-04-14*
*Category: React Engineering / Architecture*
