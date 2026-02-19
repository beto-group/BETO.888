/*
# DataCore Embed Service (Global)
This script runs a background service that monitors ALL Excalidraw drawings for DataCore embed metadata.
Embedded components will persist across tab switches and automatically re-render when a drawing is opened.

## Usage:
1. Run this script once. It will stay active in the background.
2. Select an element and run the script again to "Add/Edit" a component.
3. The component stays anchored even if you close and reopen the tab.
*/

if (!ea.verifyMinimumPluginVersion || !ea.verifyMinimumPluginVersion("2.0.0")) {
  new Notice("This script requires a newer version of Excalidraw.");
  return;
}

const dc = window.datacore || app.plugins.plugins["datacore"]?.api;
if (!dc) {
    new Notice("DataCore plugin not found or API not available.");
    return;
}

const CUSTOM_DATA_KEY = "datacoreEmbed";

// -----------------------------------------------------------------------------
// 1) Leaf Manager: Handles overlays for a single Excalidraw Leaf
// -----------------------------------------------------------------------------
class ExcalidrawLeafManager {
    constructor(leaf, service) {
        this.leaf = leaf;
        this.service = service;
        this.container = null;
        this.overlays = new Map(); // elementId -> { container: Div, component: Component, overlay: Div }
        this.lastSync = 0;
        this.init();
    }

    init() {
        const view = this.leaf.view;
        if (!view || typeof view.getViewType !== "function" || view.getViewType() !== "excalidraw") return;
        
        // Use containerEl (root) or contentEl (if defined)
        const root = view.containerEl || view.contentEl;
        if (!root) return;

        const excalidrawContainer = root.querySelector(".excalidraw-container") || root;

        if (getComputedStyle(excalidrawContainer).position === 'static') {
             excalidrawContainer.style.position = "relative";
        }

        let layer = excalidrawContainer.querySelector(".datacore-embed-layer");
        if (!layer) {
            layer = document.createElement("div");
            layer.className = "datacore-embed-layer";
            Object.assign(layer.style, {
                position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
                pointerEvents: "none", zIndex: "1", overflow: "hidden",
                contain: "strict" // Ensure any fixed items in children are clipped to this layer at least
            });

            // Injected global style to force nested component padding to zero
            let style = layer.querySelector("style");
            if (!style) {
                style = document.createElement("style");
                layer.appendChild(style);
            }
            style.textContent = `
                .datacore-embed-item, 
                .datacore-embed-item .view-content,
                .datacore-embed-item .markdown-rendered,
                .datacore-embed-item .markdown-preview-view,
                .datacore-embed-item .markdown-preview-sizer,
                .datacore-embed-item .markdown-preview-section {
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                }
                .datacore-embed-item * {
                    box-sizing: border-box !important;
                }
            `;
            excalidrawContainer.appendChild(layer);
        }
        this.container = layer;
    }

    sync() {
        const view = this.leaf.view;
        if (!view || !this.container || !view.excalidrawAPI) return;
        
        const api = view.excalidrawAPI;
        const elements = api.getSceneElementsIncludingDeleted().filter(el => !el.isDeleted);
        const embedElements = elements.filter(el => el.customData && el.customData[CUSTOM_DATA_KEY]);
        
        const currentIds = new Set(embedElements.map(e => e.id));
        const zIndexMap = new Map();
        elements.forEach((el, index) => zIndexMap.set(el.id, index));

        const appState = api.getAppState();
        const { scrollX, scrollY, zoom } = appState;

        // 1. Cleanup
        for (const [id, data] of this.overlays) {
            if (!currentIds.has(id)) {
                if (data.component && data.component.unload) data.component.unload();
                if (data.overlay) data.overlay.remove();
                this.overlays.delete(id);
            }
        }

        // 2. Update/Add
        for (const el of embedElements) {
            let data = this.overlays.get(el.id);
            const componentName = el.customData[CUSTOM_DATA_KEY];

            if (!data) {
                const overlay = document.createElement("div");
                overlay.className = "datacore-embed-item workspace-leaf-content component-sandbox-boundary";
                overlay.setAttribute("data-sandbox", "true");
                
                // Use setProperty for !important to override any theme/Obsidian defaults
                overlay.style.setProperty("position", "absolute", "important");
                overlay.style.setProperty("overflow", "hidden", "important");
                overlay.style.setProperty("pointer-events", "auto", "important");
                overlay.style.setProperty("background", "var(--background-primary)", "important");
                overlay.style.setProperty("border", "1px solid var(--background-modifier-border)", "important");
                overlay.style.setProperty("box-shadow", "0 2px 8px rgba(0,0,0,0.1)", "important");
                overlay.style.setProperty("border-radius", "4px", "important");
                overlay.style.setProperty("contain", "strict", "important");
                overlay.style.setProperty("isolation", "isolate", "important");
                overlay.style.setProperty("padding", "0", "important");
                overlay.style.setProperty("margin", "0", "important");
                overlay.style.setProperty("box-sizing", "border-box", "important");

                const innerContent = document.createElement("div");
                innerContent.className = "view-content";
                innerContent.style.setProperty("width", "100%", "important");
                innerContent.style.setProperty("height", "100%", "important");
                innerContent.style.setProperty("overflow", "auto", "important"); // Enable internal scrolling
                innerContent.style.setProperty("position", "absolute", "important");
                innerContent.style.setProperty("top", "0", "important");
                innerContent.style.setProperty("left", "0", "important");
                innerContent.style.setProperty("display", "flex", "important");
                innerContent.style.setProperty("flex-direction", "column", "important");
                innerContent.style.setProperty("padding", "0", "important");
                innerContent.style.setProperty("margin", "0", "important");
                innerContent.style.setProperty("box-sizing", "border-box", "important");
                innerContent.style.setProperty("transform-origin", "0 0", "important"); // Scale from top-left
                
                overlay.appendChild(innerContent);
                this.container.appendChild(overlay);

                let Component = (typeof obsidian !== "undefined" ? obsidian.Component : null) 
                             || (typeof window.obsidian !== "undefined" ? window.obsidian.Component : null);
                if (!Component && ea.obsidian) Component = ea.obsidian.Component;
                if (!Component) Component = class Mock { addChild(){} removeChild(){} load(){} unload(){} };

                const renderComponent = new Component();
                if (renderComponent.load) renderComponent.load();

                data = { container: innerContent, component: renderComponent, overlay: overlay, name: componentName };
                this.overlays.set(el.id, data);

                this.service.renderContent(componentName, innerContent, renderComponent);
            } else if (data.name !== componentName) {
                // Name changed
                data.name = componentName;
                this.service.renderContent(componentName, data.container, data.component);
            }

            // Sync Position & Scale
            const x = (el.x + scrollX) * zoom.value;
            const y = (el.y + scrollY) * zoom.value;
            const w_scaled = el.width * zoom.value;
            const h_scaled = el.height * zoom.value;
            const target = data.overlay;
            const inner = data.container;

            // Outer container (anchor) matches scaled size for clipping
            target.style.width = `${w_scaled}px`;
            target.style.height = `${h_scaled}px`;
            target.style.setProperty("overflow", "hidden", "important"); // Clip inner content
            target.style.transform = `translate(${x}px, ${y}px) rotate(${el.angle}rad)`;
            target.style.transformOrigin = "50% 50%";
            target.style.opacity = (el.opacity / 100).toString();

            // Dynamic Z-Index based on scene order
            // Base 1 to be above canvas (usually 0), + index to respect layer order
            const zIndex = (zIndexMap.get(el.id) || 0) + 1; 
            target.style.zIndex = zIndex.toString();

            // Inner container holds the actual component at its "natural" size
            inner.style.width = `${el.width}px`;
            inner.style.height = `${el.height}px`;
            inner.style.transform = `scale(${zoom.value})`;
            inner.style.transformOrigin = "0 0";
            inner.style.overflow = "hidden"; // Clip content to box

            const viewW = this.container.clientWidth;
            const viewH = this.container.clientHeight;
            target.style.display = (viewW > 0 && (x > viewW || y > viewH || (x+w_scaled) < 0 || (y+h_scaled) < 0)) ? "none" : "block";
        }
    }

    destroy() {
        if (this.container) this.container.remove();
        for (const [id, data] of this.overlays) {
            if (data.component && data.component.unload) data.component.unload();
            if (data.overlay) data.overlay.remove();
        }
        this.overlays.clear();
    }
}

// -----------------------------------------------------------------------------
// 2) The Service Engine
// -----------------------------------------------------------------------------
class DataCoreEmbedService {
    constructor() {
        this.leafManagers = new Map(); // Leaf -> Manager
        this.running = true;
        this.init();
    }

    init() {
        this.loop();
        new Notice("DataCore Embed Service Started.");
    }

    loop() {
        if (!this.running) return;
        this.syncAll();
        window.requestAnimationFrame(() => this.loop());
    }

    syncAll() {
        const leaves = app.workspace.getLeavesOfType("excalidraw");
        const currentLeafIds = new Set(leaves.map(l => l.id));

        // Cleanup closed leaves
        for (const [leaf, manager] of this.leafManagers) {
            if (!leaves.includes(leaf)) {
                manager.destroy();
                this.leafManagers.delete(leaf);
            }
        }

        // Sync active leaves
        for (const leaf of leaves) {
            if (!leaf.view) continue;
            let manager = this.leafManagers.get(leaf);
            if (!manager) {
                manager = new ExcalidrawLeafManager(leaf, this);
                this.leafManagers.set(leaf, manager);
            }
            manager.sync();
        }
    }

    async renderContent(name, container, component) {
        const foundFile = app.vault.getMarkdownFiles().find(f => f.name === name || f.name === `${name}.component.md`)
            || app.vault.getMarkdownFiles().find(f => f.name.toLowerCase().includes(name.toLowerCase()) && f.name.endsWith('.md'));

        let code = "";
        if (foundFile) {
            const path = foundFile.path;
            if (path.endsWith(".md")) {
                code = await app.vault.read(foundFile);
            } else {
                code = `\`\`\`datacorejsx\nconst raw = await dc.require("${path}");\nif (raw && (raw.type || raw.$$typeof)) return raw;\nlet Comp = raw; if (raw && typeof raw === 'object') { const keys = Object.keys(raw); if (keys.length > 0) Comp = raw[keys[0]]; }\nif (typeof Comp === 'function') return <div style={{width:'100%', height:'100%', overflow:'hidden'}}><Comp /></div>;\nreturn <div>Unsupported: {typeof Comp}</div>;\n\`\`\``;
            }
        } else { code = `**Component "${name}" not found.**`; }

        let MR = (typeof obsidian !== "undefined" ? obsidian.MarkdownRenderer : null) 
              || (typeof window.obsidian !== "undefined" ? window.obsidian.MarkdownRenderer : null)
              || (ea.obsidian ? ea.obsidian.MarkdownRenderer : null);
        
        if (!MR) return;
        container.innerHTML = "";
        await MR.render(app, code, container, foundFile ? foundFile.path : "/", component);
    }

    stop() {
        this.running = false;
        for (const manager of this.leafManagers.values()) manager.destroy();
        this.leafManagers.clear();
        new Notice("DataCore Embed Service Stopped.");
    }
}

// -----------------------------------------------------------------------------
// 3) Execution Logic
// -----------------------------------------------------------------------------
if (window.DataCoreEmbedServiceInstance) {
    window.DataCoreEmbedServiceInstance.stop();
}

const service = new DataCoreEmbedService();
window.DataCoreEmbedServiceInstance = service;

// If elements selected, handle prompt
const selected = ea.getViewSelectedElements();
if (selected.length > 0) {
    const el = selected[0];
    const current = el.customData?.[CUSTOM_DATA_KEY];
    
    (async () => {
        const name = await utils.inputPrompt("Embed DataCore", "Component name:", current || "");
        if (name !== undefined) {
            const cleanName = name.trim();
            if (cleanName) {
                el.customData = { ...el.customData, [CUSTOM_DATA_KEY]: cleanName };
                Object.assign(el, { strokeColor: "var(--text-muted)", strokeStyle: "dashed", strokeWidth: 1, opacity: 100 });
            } else {
                if (el.customData) delete el.customData[CUSTOM_DATA_KEY];
            }
            await ea.copyViewElementsToEAforEditing([el]);
            await ea.addElementsToView(false, false);
        }
    })();
}
