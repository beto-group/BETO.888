# Architectural Pattern: Universal Hybrid Orchestrator
**Status: ELITE_TACTICAL** // **Version: 1.0.0**

## 1. Context & Objective
When building React-based Obsidian plugins that need to work in both **Datacore (Live-Preview/Eval)** and **Native Plugin (Bundled main.js)** environments, traditional import strategies often fail. This pattern prevents the critical **React Error #130** (Element type is invalid) and "File not found" errors by utilizing a static-force orchestration layer.

## 2. The Core Problem
1. **ESM/CJS Interop**: Bundlers like `esbuild` often wrap hybrid components in `.default` properties or namespace objects. If passed directly to React, these objects cause #130 crashes.
2. **Bundling Erasure**: Dynamic `require()` calls inside functions are ignored by bundlers, causing "File not found" errors at runtime in the Obsidian Electron environment.

## 3. The Implementation Pattern (Native Entry Point)

### A. Static Bundle Force (Top-Level Require)
Always use top-level `require()` or `import` with static paths to ensure `esbuild` includes every dependency in the physical bundle.

```javascript
/* main.jsx (Native Entry) */
const App_Pkg = require('../App.jsx');
const App = App_Pkg.App || App_Pkg.default?.App || App_Pkg.default || App_Pkg;

const NodeGraph_Pkg = require('../components/NodeGraph.jsx');
const NodeGraph = NodeGraph_Pkg.NodeGraph || NodeGraph_Pkg.default?.NodeGraph || NodeGraph_Pkg.default || NodeGraph_Pkg;
```

### B. Dependency Injection Architecture
Decouple components from their environment by passing ALL external dependencies (Hooks, App context, Sub-components) through two specific props: `dc` (Platform) and `modules` (Components).

```javascript
const dc = { useState, useEffect, useRef, app: window.app, Icon: NativeIconShim };
const modules = { NodeGraph, Visuals, Content, DeploymentLogic, ... };

root.render(<App dc={dc} modules={modules} folderPath={projectPath} />);
```

### C. The 14-Point Flight Check
Implement a strict type-check audit in the native `onOpen` lifecycle. This verifies 100% of the dependency graph is valid before any rendering occurs.

```javascript
const requiredKeys = ['App', 'NodeGraph', 'FloatingScene', ...];
const missing = requiredKeys.filter(k => !modules[k]);
const nonFunctions = requiredKeys.filter(k => modules[k] && typeof modules[k] !== 'function');

if (missing.length > 0) throw new Error(`CRITICAL: Missing Modules: ${missing.join(', ')}`);
if (nonFunctions.length > 0) throw new Error(`TYPE: Non-Function Components: ${nonFunctions.join(', ')}`);
console.log("SYSTEM_HEALTH: All core modules verified.");
```

## 4. Component Standards (The Hybrid Bridge)
Every component MUST use a hybrid export footer that supports both Datacore's `eval` return and standard CommonJS `require`.

```javascript
/* MyComponent.jsx */
function MyComponent({ dc, modules, ...props }) {
    // Component Logic
}

const _exports = { MyComponent };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;
```

## 5. Maintenance & Scaling
To add a new component to a system using this pattern:
1. Create the component with the **Hybrid Bridge** footer.
2. Add a static `require` and unpacking line to `main.jsx`.
3. Add the component to the `modules` injection object.
4. Add the component key to the **Flight Check** list.

> [!TIP]
> This pattern ensures that if a component failed to bundle (e.g. syntax error or logic mismatch), the system will fail with a clear "TYPE_FAILURE" log instead of a cryptic React crash.

## 6. Visual Scaling & Responsive Constraints
Native Obsidian tabs and the Datacore view have different container behaviors. Using viewport-relative units (like `80vh` or `100vw`) inside components often causes "Overscaling" in the native plugin.

- **Rule: Parent-Relative Sizing**: Always use `width: '100%'` and `height: '100%'` for inner Canvas or Visual containers. This forces the component to respect the tactical boundaries defined by the layout orchestrator.
- **Rule: Layout-Driven Constraints**: Define size limits (e.g., `maxWidth: 320px`) in the **Parent Layout** (e.g., `FloatingScene.jsx`), not inside the child component.
- **Rule: ResizeObserver Integration**: Use a `ResizeObserver` in the base visual component to accurately capture the parent container's dimensions for WebGL/Canvas rendering.

```javascript
/* Correct Sizing Pattern */
useEffect(() => {
    const obs = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
}, []);
```

## 7. Native Authentication & Keychain Integration
Native plugins often require sensitive credentials (e.g., GitHub Personal Access Tokens) for GitOps deployments. For maximum security and convenience, use the **Native Keychain Grab** fallback.

- **Rule: Double-Layer Auth**: Check local component state/settings first, then fallback to a native keychain query.
- **Protocol: Secure Retrieval**: Use `child_process.execSync` with the macOS `security` command to pull tokens silently during the deployment lifecycle.

```javascript
/* Native Keychain Grab Pattern */
try {
    const { execSync } = require('child_process');
    const service = "GitHub";
    const account = "BETO";
    // Attempt grab via service name or account anchor
    const cmd = `security find-generic-password -s "${service}" -w || security find-generic-password -a "${account}" -s "${service}" -w`;
    const token = execSync(cmd, { encoding: 'utf8' }).trim();
    if (token) {
        console.log("[Deployment] NATIVE_GRAB_SUCCESS");
        return token;
    }
} catch (e) {
    console.warn("[Deployment] NATIVE_GRAB_FAILED");
}
```

> [!CAUTION]
> Always use `execSync` inside deployment lifecycle handlers (which are already async) to ensure the token is available before the Git command sequence begins. This prevents "Sync Race" conditions where the git process starts before the token is returned.
