# 🧩 Datacore Global API Reference (v1.0)
// turbo-all

> [!IMPORTANT]
> This document lists the core functions available in the `dc` global object within the Datacore execution environment. Use this to avoid `TypeError` crashes and ensure environment compatibility.

## 1. Core Hooks (Extracted from `dc`)
Only the following hooks are verified to work. DO NOT use `useLayoutEffect`.

- `useState`: Standard React state hook.
- `useEffect`: Standard React side-effect hook. (Mandatory for DOM reparenting).
- `useMemo`: Memoization of expensive calculations or class instances (e.g., manager classes).
- `useCallback`: Memoization of function references.
- `useRef`: Standard React ref hook.

## 2. Global Utilities
- `dc.require(path)`: Async function to load internal components or utilities. Returns a Promise.
- `dc.resolvePath(relPath)`: Resolves a relative path to a vault-absolute path. (Essential for Portability).
- `dc.Icons`: A collection of Lucide icons.
- `dc.Icon`: High-level React component for rendering Lucide icons.
    - Props: `icon` (string), `style` (object).
    - Usage: `<dc.Icon icon="bug" style={{ width: '18px' }} />`

## 3. Environment Handlers
- `dc.app`: Reference to the Obsidian `App` instance.
- `dc.app.vault.adapter.getBasePath()`: Returns the absolute filesystem path of the vault root. (Mandatory for Electron `preload` paths).

---
*Beto Group LLC | Lead Architect Agent Standard*
