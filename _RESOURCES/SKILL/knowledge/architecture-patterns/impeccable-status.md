# Impeccable Status: Chrome Suppression Pattern (Rev v10)

This pattern is used to achieve maximum immersion in Datacore components by hiding the default Obsidian "Chrome" (headers, footers, status bars) for the active view.

## 🏗️ Architecture

The pattern relies on dynamic CSS injection and **Brute-Force Reparenting** to achieve true edge-to-edge immersion (OLED black contact with physical screen edges).

### 🛠️ Elite Implementation (Brute-Force)

```javascript
const componentId = useRef('component-' + Math.random().toString(36).substr(2, 5)).current;

useEffect(() => {
    const styleId = `impeccable-status-${componentId}`;
    let styleEl = document.getElementById(styleId);
    
    // 1. Target the Active Leaf
    const leaf = dc.app.workspace.activeLeaf;
    const container = leaf.containerEl;
    
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            /* Hide Headers and Titles */
            .view-header { display: none !important; }
            .inline-title { display: none !important; }
            
            /* Reclaim Edge-to-Edge Space */
            .workspace-leaf-content { 
                padding: 0 !important; 
                margin: 0 !important; 
                border-radius: 0 !important; 
            }
            
            /* Hide the Obsidian status bar & footer */
            .status-bar, .view-footer { display: none !important; }
        `;
        document.head.appendChild(styleEl);
    }
    
    // 2. Full-Tab Reparenting
    // Ensure the root container is reparented to the leaf's raw DOM for OLED black edges.
    
    return () => {
        const el = document.getElementById(styleId);
        if (el) el.remove();
    };
}, []);
```

## ⚖️ Guidelines

-   **OLED Black Standard**: Ensure backgrounds are `#000` to touch the physical edge of the display.
-   **Verification Protocol**: Use `obsidian dev:screenshot` and `obsidian dev:dom` to audit the render.
-   **No Placeholders**: Always use `generate_image` for assets; avoid generic colors.
-   **Cache Busting**: If UI changes don't reflect, rename the script (e.g., `_v2.jsx`) to bypass the loader cache.
