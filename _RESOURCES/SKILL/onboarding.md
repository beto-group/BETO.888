# 🤖 Agent Briefing: Chrome Extension Bridge (v1.0)
// turbo-all

> [!IMPORTANT]
> This briefing is required reading for any AI Agent assigned to modify or extend the **Chrome Extension Bridge**. Failure to adhere to the **Lobotomy Protocol** will result in Chromium C++ memory crashes and silent extraction failures.

## 1. The Core Architecture: The "Lobotomy Engine"
The bridge is a **sterile environment** for running packed Manifest V3 extensions inside Electron. 
- **The Problem**: Chromium natively traps `chrome.*` and `browser.*` APIs in rendering isolates, causing `Object could not be cloned` crashes if standard Electron IPC is used.
- **The Solution**: We "Lobotomize" the extension by synchronously injecting a fake API tree (`lobotomy.js`) via an absolute-path **Preload Script**. We sever the background/content script link and replace it with an **IPC State Machine**.

## 2. Critical IPC State Machine (The "Nuke" Interceptor)
When the extension calls `chrome.runtime.sendMessage`, our bridge intercepts the request in `lobotomy.js`.
- **Primary Actions**:
    - `getActiveTab`: MUST return `{ tabId: 1 }`.
    - `getTabInfo`: Returns the spoofed metadata (`window.__BRIDGE_URL__`, etc.).
    - `getReaderModeState`: Returns `isActive: false`.
    - `getPageContent`: Returns the "transfused" HTML from the dashboard.
- **Signature Normalization**: Our interceptor must support both `(message)` and `(extensionId, message)` signatures to accommodate different polyfills.

## 3. UI/UX: The "Ghost-Snap" Pattern
To achieve a premium, distraction-free "Sterile Brutalist" aesthetic:
- **Invisible Initialization**: Components start with `visibility: hidden`.
- **High-Frequency Hijacking**: A `setInterval(..., 16)` poller reparents the bridge DOM. Target carefully:
    - **`.cm-scroller`**: Target this to stay *inside* the editor leaf (preserves the tab header/swapping).
    - **`.view-content`**: Target this for an absolute "Page Erasure" feel (replaces the whole tab content area).
- **Chrome Suppression**: High-specificity CSS is injected to hide global status bars and inline titles, but we **preserve** `.view-header` for workspace utility.

## 4. Telemetry: Universal Mirroring
- **Console Relay**: All child windows (Clipper, Reader, Settings) relay their logs back to the **Tactical Viewer** terminal via the `console-message` event.
- **Debug Freeze**: If `window.__BRIDGE_DEBUG_MODE__` is set, `window.close()` is suppressed. This allows you to inspect failing network states before the window destroys its own DevTools.

## 5. Deployment Protocols
- **Absolute Paths Only**: Electron preloads fail silently with relative paths in an Obsidian vault. Always use `dc.app.vault.adapter.getBasePath()` + the component path.
- **Recursive Spawning**: To support nested settings, the `__BRIDGE_PRELOAD_PATH__` must be passed via `executeJavaScript` to every child window.

---
*Stay Impeccable. Stay Sterile.*
