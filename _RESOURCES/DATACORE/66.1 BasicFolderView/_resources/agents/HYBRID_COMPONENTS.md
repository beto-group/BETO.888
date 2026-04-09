# Hybrid Components: Datacore & Next.js

## 13. Markdown Orchestration & App Shells

When using a Markdown file (e.g., `INDEX.md`) to drive the site layout ("Orchestrator Pattern"), be careful with **Fixed Positioning** and **Stacking Contexts**.

### The Problem
If you render your `Navbar` (with `position: fixed`) inside a `MarkdownRenderer` component, it is often wrapped in a `div` or placed deep in the DOM tree. This can cause z-index issues or clipping if parent elements have `transform`, `filter`, or `overflow`.

For example, `MarkdownRenderer` often wraps components in a container to provide margins:
```jsx
// Inside MarkdownRenderer
<div style={{ margin: '30px 0' }}>
   <Navbar /> 
</div>
```
This wrapper creates a new stacking context or positioning constraint that can break `position: fixed`.

### The Solution: App Shell Pattern
Render structural components like `Navbar` explicitly in your React Layout (`WebsiteBuilder.jsx`) rather than orchestrating them via Markdown.

1.  **Orchestrator (`INDEX.md`)**: Use it to define constraints, routing, and the *body content*.
    ```yaml
    ---
    defaultRoute: HOME
    navigation:
      - "[[HOME]]"
      - "[[GAMES]]"
    ---
    {component: PageRouter}
    {component: Footer}
    ```
2.  **App Shell (`WebsiteBuilder.jsx`)**: Render the persistent interface elements.
    ```jsx
    // GOOD: App Shell (Robust)
    <div style={STYLES.container}>
        <Navbar navItems={parsedNavItems} /> {/* Persistent, top-level, high z-index */}
        <MarkdownRenderer content={activePageContent} />
    </div>
    ```

## 14. Robust Obsidian Routing

To ensure your repository remains compatible with Obsidian's native properties editor while driving a React application, follow these guidelines.

### Wiki-Link Navigation
Use **Quoted Wiki-Links** in your frontmatter lists. This parses correctly as valid YAML (string array) while retaining Obsidian's ability to update links if files are renamed.

```yaml
# GOOD: Valid YAML, Obsidian-friendly
navigation:
  - "[[HOME]]"
  - "[[GAMES]]"
  - "[[Category/Page|Label]]"
```

### Route Inference & Wrappers
Avoid complex `routes` objects in frontmatter which are hard to edit in Obsidian's UI. Instead, use **File-Based Inference** and **Wrapper Files**.

1.  **Inference**: `[[PLAY]]` automatically maps to `PLAY.md`.
2.  **Wrappers**: If mapped to `PLAY.md`, but you want to render a complex React Component (like an Arena), create `PLAY.md` with:
    ```markdown
    ---
    ---
    {component: Arena}
    ```
    This keeps the `INDEX.md` configuration clean and purely text-based.

## 15. Dynamic ESM & WebGL (Three.js) Workflows

When implementing complex libraries like Three.js that rely heavily on native ESM imports (e.g. `import * as THREE from 'three'`), you must handle module resolution carefully for both Datacore and Web targets.

### The Problem
Traditional bundlers or simple scripts (`<script src="...">`) fail when the library internally imports other remote files asynchronously. For example, Three.js addons (`three/addons/...`) expect the browser to resolve bare specifiers seamlessly. 

### The Solution: Import Maps & Async Loading (LoadScript)
To make your hybrid components bulletproof:

1.  **Inject Import Maps**: In your component's initialization (`useEffect`), dynamically inject an `<script type="importmap">` into the document head before loading the dependencies. This tells the browser how to resolve "three" and "three/addons/".
    ```javascript
    let importMap = document.getElementById('three-import-map');
    if (!importMap) {
        importMap = document.createElement('script');
        importMap.id = 'three-import-map';
        importMap.type = 'importmap';
        importMap.textContent = JSON.stringify({
        imports: {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
        });
        document.head.appendChild(importMap);
    }
    ```

2.  **Use Datacore LoadScript**: Always use `28 LoadScript` with `{ type: 'module' }` to fetch the dependencies. Datacore `loadScript` ensures modules are cached locally for offline functionality and deduplicated during simultaneous loads.
    ```javascript
    // In your View Factory:
    const loadScriptModule = await dc.require(dc.headerLink(dc.resolvePath('_RESOURCES/DATACORE/28 LoadScript/D.q.loadscript.component.md'), 'LoadScriptUpgrade'));
    const loadScript = loadScriptModule.loadScript;
    // Pass loadScript as a prop to your React component

    // Inside your component's useEffect:
    const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });
    ```
    *Note: Always use `dc.headerLink` + `dc.resolvePath` to securely target the LoadScript code block inside the Datacore Markdown file.*

3.  **Strict State Management for WebGL**: 
    - Keep *all* Three.js mutable objects (Scene, Camera, Renderer, active Animation Frame ID) within a React `useRef`. 
    - Never place them in `useState`.
    - Handle **ESM Exports** robustly:
      ```javascript
      const guiModule = await loadScript(dc, '...', { type: 'module' });
      const GUI = guiModule.GUI || guiModule.default?.GUI || guiModule.default;
      ```
    - **Portal Breakout**: In complex layouts, portal the component to `workspace-leaf-content` via `index.jsx` to avoid container clipping.
