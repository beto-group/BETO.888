# Dashboard & Interface Stability Standard (v1.0)
// turbo-all

> [!IMPORTANT]
> This standard defines the mandatory requirements for complex, multi-panel dashboards (e.g., Keychain Bridge, Dashboards) to ensure they remain stable, readable, and perfectly "fitted" to the Obsidian workspace without breaking the window layout.

## 1. The "No-Push" Directive
A production-grade interface MUST NOT provoke a window-level scrollbar. All content overflow must be internalized.

- **Wrapper Constraint**: The root wrapper must use `height: 100%`, `width: 100%`, and `overflow: hidden`.
- **Flex Inheritance**: The main grid/container must use `flex: 1` to occupy the remaining space and `min-height: 0` to allow children to overflow internally.
- **Internalized Scroll**: Each distinct panel (Operations, Registry, Log) MUST implement its own independent `overflow-y: auto` scroll area.

## 2. Dashboard Structural Pattern
All complex utilities should follow the **Three-Panel Architecture**:
1.  **Panel 1 (Operations)**: Fixed-width or flexible column for primary triggers, settings, and "New Record" forms. 
2.  **Panel 2 (Registry)**: The primary data list. Must have a clear "empty state" and internal scrolling.
3.  **Panel 3 (Activity Log)**: A real-time audit trail. Must handle persistent logging and status indicators.

## 3. High-Contrast Brutalist Tokens
To maintain the **Dossier OS / DataCore** aesthetic, use these tokens exclusively:
- **Primary Accent**: `#4ade80` (Mint Green).
- **Background**: `#000000` (Pure Black).
- **Secondary Surface**: `#0a0a0a` (Matte Gray).
- **Text (Active)**: `#ffffff` (Pure White).
- **Text (Dimmed)**: `opacity: 0.5` or `rgba(255,255,255,0.5)`.
- **Action Buttons**: High-contrast fills. Use color-coded borders (Red for trash, Green for sync).

## 4. Persistent Auditor Pattern
All sensitive or complex transactions MUST be logged to a local file (Audit Trail) to survive session reloads.
- **Path**: Always use `_resources/data/bridge-history.json`.
- **Append Logic**: Prepend new logs to the top of the array, capping at 500-1000 entries.
- **Sync**: Always reload the history file immediately upon "Unlock" or initialization.

## 5. Chrome Suppression (Impeccable Status)
To achieve total immersion (OLED edges), you MUST suppress the default Obsidian UI elements (Chrome) using dynamic CSS injection.

- **Targets**: `.status-bar`, `.view-footer`, `.inline-title`.
- **Exemptions**: `.view-header` (Preserve for tab switching and workspace breadcrumbs unless "Total Nuclear" mode is explicitly requested).
- **Implementation**: Use a `useEffect` inside a `SafeRoot` or the main view to inject and cleanup a unique `<style>` element.

```javascript
/* Mandatory Impeccable Status Pattern */
const styleId = useRef('chrome-suppress-' + Math.random().toString(36).substr(2, 5)).current;
useEffect(() => {
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            .status-bar, .view-footer, .inline-title { display: none !important; }
            .workspace-leaf-content { padding: 0 !important; margin: 0 !important; border-radius: 0 !important; }
        `;
        document.head.appendChild(styleEl);
    }
    return () => {
        const s = document.getElementById(styleId); 
        if (s) s.remove();
    };
}, []);
```

## 6. The "Ghost-Snap" Pattern (Zero-Flicker)
To prevent the jarring "flicker" where a component is visible in its small default state before being reparented to FullTab, you MUST use the **Ghost-Snap Engine**:

1.  **Invisible Initialization**: The root container must start with `visibility: 'hidden'`.
2.  **High-Frequency Polling**: Attempt to seize the `.workspace-leaf` every 10-16ms.
3.  **Visual Reveal**: Only switch to `visibility: 'visible'` AFTER the `.view-content` reparenting and `inset: 0` styling are confirmed.

```javascript
/* Standard Ghost-Snap Implementation */
const [isHijacked, setIsHijacked] = useState(false);

useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const hijack = () => {
        try {
            const leaf = container.closest('.workspace-leaf-content');
            const wrapper = leaf?.querySelector('.view-content') || leaf;
            if (wrapper) {
                // MOVE DOM
                wrapper.appendChild(container);
                
                // HEADER-AWARE OFFSET (No-Push Directive)
                const isLeafTarget = wrapper === leaf;
                
                Object.assign(container.style, { 
                    position: "absolute",
                    top: isLeafTarget ? "var(--header-height, 40px)" : "0px",
                    left: "0", right: "0", bottom: "0",
                    zIndex: 9999, 
                    background: '#000', 
                    visibility: 'visible' 
                });
                setIsHijacked(true);
                return true;
            }
        } catch (e) {}
        return false;
    };
    if (hijack()) return;
    const poller = setInterval(() => { if (hijack()) clearInterval(poller); }, 16);
    return () => clearInterval(poller);
}, []);

// In Render:
return <div ref={containerRef} style={{ visibility: isHijacked ? 'visible' : 'hidden' }}> ... </div>
```

> [!CAUTION]
> **Datacore Restriction**: DO NOT use `useLayoutEffect`. It is currently not exposed by the Datacore environment and will cause a `TypeError`. Always use `useEffect` for the Hijack poller.

---
*Beto Group LLC | Interface & Design Standard*
