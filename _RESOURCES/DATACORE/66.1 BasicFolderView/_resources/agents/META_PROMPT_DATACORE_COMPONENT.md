# 🤖 Meta-Prompt: Datacore Component Generator

**Instructions for the User:** 
Reference this file in your prompt (e.g., `@CREATE_DATACORE_COMPONENT.md`), and append what you want to create (e.g., `"@CREATE_DATACORE_COMPONENT.md Create a 3D Periodic Table view"`). 

**Instructions for the AI Assistant:**
You are an expert React and Three.js developer building a "Datacore Component" for Obsidian. A Datacore Component is a React application injected into an Obsidian markdown view. Often, these are immersive, edge-to-edge (Full-Tab) WebGL experiences.

When the user asks you to create a Datacore Component using this meta-prompt, you **MUST** strictly adhere to the following architectural rules, constraints, and boilerplates.

---

## 🏗️ 1. File Structure & Architecture

Every Datacore component must be modular and follow this exact directory structure:

1. **`[COMPONENT_NAME].md`**: The entry point/manifest file. (Contains Datacore properties).
2. **`D.q.[component_name].viewer.md`**: The viewer file containing the `datacorejsx` codeblock that mounts `src/index.jsx`.
3. **`src/index.jsx`**: The async View Factory. Handles the Full-tab lifecycle, loads dependencies, and mounts the React root.
4. **`src/components/[ComponentName].jsx`**: The core React logic and WebGL/Three.js canvas.
5. **`src/styles/styles.jsx`**: Base layout constants and CSS-in-JS design tokens.
6. **`src/utils/domUtils.jsx`**: DOM traversal utilities for Full-Tab wrapping.

---

## 🚨 2. Critical Datacore Rules 

1. **NO ES Modules (`import`/`export`)**: Datacore's local transpiler evaluates code dynamically! You **MUST NOT** use top-level `import` or `export default`. Instead, return components in an object at the bottom of the file (e.g., `return { CubesComponent };`).
2. **Viewer Component Syntax**: Datacore viewer files (`D.q.*.viewer.md`) MUST use the `datacorejsx` codeblock syntax. Use `dc.resolvePath("D.q.*.viewer")` for stable path resolution.
3. **Memory Management (WebGL & Hot-Reloads)**: 
    - **NEVER** store Three.js instances (`Scene`, `Camera`, `Renderer`, `lil-gui`) in React `useState`. Always use a flat `useRef(refs).current` object.
    - **ALWAYS** clean up and `dispose()` geometries/materials/renderers/GUIs in the `useEffect` return cleanup block.
4. **Full-Tab Immersion**: Use the portal breakout pattern in `src/index.jsx` to move the component to `workspace-leaf-content`. Hide the Obsidian status bar (`.app-container .status-bar`) on mount; restore it on unmount.
5. **Dynamic Imports via Import Maps**: Inject a `<script type="importmap">` for bare specifiers (`"three"`, `"three/addons/"`, `"lil-gui"`) before using `loadScript`.
6. **Aesthetics**: "Black on Black on Black". Use absolute black (`#000000`) backgrounds, white (`#ffffff`) text, and purple (`#8b5cf6`) accents.
7. **Component Isolation**: When creating or modifying a component, you **MUST** only create files or make changes directly within the component's own folder (relative to `DATACORE/_RESOURCES/DATACORE/`). Do **NOT** modify other components, root folders, or infrastructure unless explicitly instructed.

---

## 📝 3. Universal Boilerplates

### A. The Viewer (`D.q.[component_name].viewer.md`)
````markdown
```datacorejsx
const activeFile = dc.resolvePath("D.q.[component_name].viewer");
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + '/src/index.jsx');
return await View({ folderPath, dc });
```
````

### B. The Factory (`src/index.jsx`)
```jsx
async function View({ folderPath, dc }) {
  const { useState, useEffect, useRef } = dc;

  // 1. Load Dependencies
  const { findNearestAncestorWithClass, findDirectChildByClass } = await dc.require(folderPath + '/src/utils/domUtils.jsx');
  const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
  const { MyComponent } = await dc.require(folderPath + '/src/components/MyComponent.jsx');
  
  const loadScriptPath = dc.resolvePath('_RESOURCES/DATACORE/28 LoadScript/D.q.loadscript.component.md');
  const loadScriptModule = await dc.require(dc.headerLink(loadScriptPath, 'LoadScriptUpgrade'));
  const loadScript = loadScriptModule.loadScript;

  function ViewComponent() {
    const [key, setKey] = useState(0);
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    useEffect(() => {
      if (!isFullTab) return;
      const container = containerRef.current;
      if (!container) return;

      const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
      if (!targetPaneContent) return;

      const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
      const currentParent = container.parentNode;
      if (!currentParent) return;

      stateRefs.originalParent = currentParent;
      const placeholder = document.createElement("div");
      placeholder.style.display = "none";
      currentParent.insertBefore(placeholder, container.nextSibling || null);
      stateRefs.placeholder = placeholder;

      stateRefs.parentPosition = { element: contentWrapper, original: contentWrapper.style.position };
      if (window.getComputedStyle(contentWrapper).position === 'static') contentWrapper.style.position = "relative";

      contentWrapper.appendChild(container);
      Object.assign(container.style, { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: "9998", overflow: "hidden", backgroundColor: "#000" });

      const statusBar = document.querySelector('.app-container .status-bar');
      if (statusBar) statusBar.style.display = 'none';
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);

      return () => {
        if (stateRefs.placeholder?.parentNode) stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
        if (stateRefs.parentPosition?.element) stateRefs.parentPosition.element.style.position = stateRefs.parentPosition.original || '';
        container.removeAttribute("style");
        if (statusBar) statusBar.style.display = '';
      };
    }, [isFullTab]);

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <MyComponent
          key={key} dc={dc} loadScript={loadScript}
          isFullTab={isFullTab} onToggleFullTab={() => setIsFullTab(!isFullTab)}
          domUtils={{ findNearestAncestorWithClass, findDirectChildByClass }}
          styles={STYLES}
        />
      </div>
    );
  }

  return <ViewComponent />;
}

return { View };
```

### C. The Core Component (`src/components/MyComponent.jsx`)
```jsx
function MyComponent(props) {
    const { dc, loadScript, isFullTab, onToggleFullTab, styles, domUtils } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const guiContainerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    const refs = useRef({
        scene: null, camera: null, renderer: null, controls: null,
        animationId: null, gui: null, THREE: null,
        params: { bgColor: '#000000' }
    }).current;

    useEffect(() => {
        let active = true;
        async function init() {
            try {
                let importMap = document.getElementById('three-import-map-template');
                if (!importMap) {
                    importMap = document.createElement('script');
                    importMap.id = 'three-import-map-template';
                    importMap.type = 'importmap';
                    importMap.textContent = JSON.stringify({
                        imports: {
                            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/",
                            "lil-gui": "https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js"
                        }
                    });
                    document.head.appendChild(importMap);
                }
                await new Promise(r => setTimeout(r, 50));

                const THREE = await loadScript(dc, 'https://unpkg.com/three@0.160.0/build/three.module.js', { type: 'module' });
                const orbitModule = await loadScript(dc, 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js', { type: 'module' });
                const OrbitControls = orbitModule.OrbitControls || orbitModule.default?.OrbitControls || orbitModule.default;
                const guiModule = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });
                const GUI = guiModule.GUI || guiModule.default?.GUI || guiModule.default;

                if (!active) return;
                refs.THREE = THREE;

                const container = canvasContainerRef.current;
                container.innerHTML = '';
                let width = container.clientWidth;
                let height = container.clientHeight;
                if (width === 0 || height === 0) {
                    await new Promise(r => setTimeout(r, 500));
                    width = container.clientWidth || 800; height = container.clientHeight || 600;
                }

                const scene = new THREE.Scene(); refs.scene = scene;
                const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000); camera.position.set(10, 10, 10); refs.camera = camera;
                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(width, height); container.appendChild(renderer.domElement); refs.renderer = renderer;
                const controls = new OrbitControls(camera, renderer.domElement); refs.controls = controls;

                if (GUI) {
                    const gui = new GUI({ title: 'Settings', container: guiContainerRef.current });
                    refs.gui = gui;
                    gui.addColor(refs.params, 'bgColor').onChange(c => scene.background.set(c));
                }

                const animate = () => {
                    if (!active) return;
                    refs.animationId = requestAnimationFrame(animate);
                    if (refs.controls) refs.controls.update();
                    renderer.render(scene, camera);
                };
                animate();
                setIsLoaded(true);
            } catch(e) { if(active) setError(e.message); }
        }
        init();
        return () => {
            active = false;
            if (refs.animationId) cancelAnimationFrame(refs.animationId);
            if (refs.gui) refs.gui.destroy();
            try {
                if(refs.renderer) refs.renderer.dispose();
            } catch(e) {}
        };
    }, []);

    return (
        <div style={styles.fullTabWrapper}>
            {!isLoaded && !error && <div style={{ color: "white", padding: "20px" }}>Initializing...</div>}
            <div ref={canvasContainerRef} style={styles.canvas} />
            <div ref={guiContainerRef} style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 100 }} />
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                <button onClick={onToggleFullTab} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white' }}>
                    <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                </button>
            </div>
        </div>
    );
}

return { MyComponent };
```

### D. Styles (`src/styles/styles.jsx`)
```jsx
const STYLES = {
    fullTabWrapper: {
        position: 'relative', width: '100%', height: '100%', backgroundColor: '#000000', overflow: 'hidden'
    },
    canvas: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1
    }
};

return { STYLES };
```

### E. Utilities (`src/utils/domUtils.jsx`)
```jsx
function findNearestAncestorWithClass(element, className) {
  if (!element) return null;
  let current = element.parentNode;
  while (current) {
    if (current.classList && current.classList.contains(className)) return current;
    current = current.parentNode;
  }
  return null;
}

function findDirectChildByClass(parent, className) {
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.classList && child.classList.contains(className)) return child;
  }
  return null;
}

return { findNearestAncestorWithClass, findDirectChildByClass };
```

---

## 🚀 Execution Instructions for AI

When generating the actual component:
1. Review the user's specific request carefully.
2. Outline the 6 files you are creating.
3. Write out the **full implementation** of all files.
4. Always inject the user's specific Three.js/React requirements directly into steps `# 4. Initialize WebGL` and `# 6. Render Loop` of `MainComponent.jsx`, strictly keeping the skeleton provided to ensure WebGL context cleanup and Datacore compatibility.
