---
name: beto-dev
description: Technical development patterns for Beto Datacore Components, including Datacore API usage, React patterns, and Hybrid Compatibility.
---

# Beto Development Skills

This skill covers the technical implementation details for building high-performance Datacore components.

## ⚡ Datacore Logic & Syntax

### Viewer Syntax (Important)
Viewer files (e.g., `D.q.component.viewer.md`) **MUST** use the `datacorejsx` codeblock syntax to properly interact with routing. Do NOT use standard `dataviewjs`.

```markdown
✅ ````datacorejsx
const activeFile = dc.resolvePath("D.q.component.viewer");
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```

### ES Module Limitations
`dc.require` does **NOT** support ES6 `import`/`export` statements or `module.exports`.
- ❌ `export const CONFIG = { ... };`
- ✅ `const CONFIG = { ... }; return { CONFIG };`
- ✅ `const { View } = await dc.require(path + '/src/index.jsx');`

### Datacore Module Pattern
When creating multi-file components, use a functional return at the end of `.js` or `.jsx` files to export logic.
```javascript
// src/utils.js
const myUtil = () => { ... };
return { myUtil };
```

### Library Factory Pattern (Implicit Dependencies)
When a secondary file depends on a library (like Three.js) that is loaded asynchronously in the main view, use a **Factory Pattern** to inject the dependency.
```javascript
// src/physics.js
return (THREE) => {
  const { Vector2 } = THREE;
  return {
    resolve: (a, b) => { ... }
  };
};

// src/index.jsx (Main View)
const physicsFactory = await dc.require(folderPath + "/src/physics.js");
...
const { resolve } = physicsFactory(window.THREE);
```

### JSX String Interpolation
When writing React JSX components containing Javascript string template literals, **NEVER** escape the backticks or dollar signs. Datacore's local Babel transpiler expects standard unescaped template literals.

---

---

## 📱 Reactive UI Architecture (Grid System)

To ensure Datacore components scale across mobile, desktop, and large displays (TV), follow the **12-Column Grid Methodology**.

### The 12-Column Standard
- **Desktop/TV (> 1024px)**: 12 Columns
- **Tablet (600px - 1024px)**: 8 Columns
- **Mobile (< 600px)**: 4 Columns

### Implementation Pattern
Define your grid in `styles.jsx` and inject media queries via a `<style>` block in your component:

```javascript
/* styles.jsx */
const STYLES = {
  gridBreakpoints: `
    .grid-container { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
    @media (max-width: 1024px) { .grid-container { grid-template-columns: repeat(8, 1fr); } }
    @media (max-width: 600px) { .grid-container { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
  `,
};
```

### Best Practices
1. **Fluid Scaling**: Use fractional units (`fr`) for grid columns.
2. **Mathematical Hierarchy**: Elements should span `12`, `8`, `6`, or `4` columns on desktop.
3. **Standardize Gaps**: `24px` for desktop, `16px` for mobile.

---

## 🎨 WebGL & High-Fidelity Design

### Things to Avoid
1. **State Instances**: Don't store Three.js instances in `useState`. Use `useRef(refs).current` to avoid redundant renders during hot-reloads.
2. **Context Leak**: ALWAYS `dispose()` geometries, materials, and renderers in your `useEffect` cleanup.
3. **Letterboxing**: When building a Full-Tab component, explicitly hide the `.app-container .status-bar`.
4. **Import Maps**: For Three.js addons (`three/addons/`), inject a `<script type="importmap">` before loading modules to resolve CDN imports correctly.

---

## 🏗️ Datacore Architecture

### View Factory Pattern
All components must use the Async View Factory pattern.
```javascript
// src/index.jsx
async function View({ folderPath }) {
  // 1. Load dependencies
  const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
  
  // 2. Define Component
  function MyComponent() { return <div style={STYLES.container}>...</div>; }
  
  // 3. Return Element (Datacore handles mounting)
  return <MyComponent />;
}
return { View };
```

### Full-Tab Lifecycle
For edge-to-edge "App" experiences:
1.  **Portal**: Move the container to `.view-content`.
2.  **Clean Up**: Restore the parent on unmount.
3.  **Styles**: Set `height: 100%`, `overflow: hidden`, `padding: 0`.
4.  **Immersive UI**: Explicitly hide Obsidian's status bar via `.status-bar { display: none; }` and the `.view-header` of the current tab during mount and restore on unmount. Use the modular `useFullTab` hook for consistent implementation.

## 🛠️ General Obsidian Development

### Obsidian API Patterns
Even in Datacore, you often use the native Obsidian API (`app.*`).
*   **`app.vault`**: File operations (`adapter.read`, `adapter.write`). Note: `fs` requires absolute paths, while `adapter` uses vault-relative paths.
*   **`app.workspace`**: Managing leaves and views.
*   **`app.metadataCache`**: Accessing file frontmatter and tags efficiently.

### Theme Development (CSS)
*   **Variables**: Always use native variables (`--background-primary`, `--text-on-accent`).
*   **BEM**: Use Block-Element-Modifier naming for custom classes (`beto-card__title`).
*   **Scope**: Prefix all CSS variables and classes to avoid collisions (e.g., `.beto-component`).

## bridge Hybrid Compatibility (Web + Obsidian)
To ensure components work in both Obsidian and the Next.js website:
1.  **`isInception` Prop**: Accept this prop to disable full-tab portals when embedded.
2.  **Global Hooks**: Use `dc.useState`, `dc.useEffect` (injected via `window.dc` in browser) instead of importing from `react`.

## 📡 Resilient Sync Patterns
For server-dependent components (Leaderboards, Cloud Saves):
1.  **Offline Queue**: Persist failed uploads to `localStorage`.
2.  **Heartbeat Sync**: Automatically check server health and flush pending queues.
3.  **No-Wipe Safety**: Never let an empty server response (`[]`) clear local state. If `entries.length === 0`, skip the update.

## 🚀 Advanced UI & Sync Patterns

### Developer Hot-Reload
For components that require frequent iteration (like [[3.3 BasicView]]), use a file-based reload loop:
1.  **Read**: `await app.vault.adapter.read(currentPath)`
2.  **Ghost File**: Write to `_RESOURCES/temp/_temp-NAME-TIMESTAMP.md`.
3.  **Trigger**: Open the ghost file to force Datacore to re-parse the source code.
4.  **Cleanup**: Removetemp files on unmount or on the next load.

### File-Driven Kanban/Feed Sync
When syncing UI state (order, edits) back to Markdown:
- **Marker**: Use `#### AENIGMAS` as the data entry point.
- **Split**: Use `---` separators for segments.
- **Mutation**: Use `app.vault.modify` to physically reorder or replace text blocks based on visual drag-and-drop actions.
- **Safety**: Always check for the existence of the original string segment before replacing it to avoid data corruption.

### Iframe "Guidelines" Pattern
For consistent media embeds as seen in [[5 CustomFeed]] and [[6 CustomIframeBuilder]]:
- **Platform Detection**: Use regex to identify YouTube, TikTok, Instagram, etc.
- **Presets**: Maintain a central object of "Guidelines" (width, height, scale, top/left crop offsets) to normalize different social media aspect ratios into a uniform "mobile app" view.

### Radial & SVG Navigation
- **Radial**: Parse nested hierarchies from `######` headers in `.namzu.md` files (see [[9 ContentExplorer888]]).
- **SVG Hotspots**: Embed interactive SVGs where IDs or classes match file names (see [[8 FitnessExplorer]]) for visual routing.

## 🔒 Admin & Security Patterns

### Elevated Sessions
For sensitive interfaces (like [[6.6 BetoAdminDashboard]]), implement a re-authentication requirement:
1.  **Identity Check**: Verify the user has the required `tier` and `role` (e.g., `admin`).
2.  **Force Login**: Even if already logged in via plugin, prompt for Password + 2FA to create a short-lived "Elevated Session."
3.  **Local Isolation**: Store the admin-specific token in `localStorage` separately from the primary app token.

### Action-Oriented Gateway
Instead of standard REST, use a secure action gateway:
- **Single Endpoint**: Send all administrative mutations to `/api/ops`.
- **Action Mapping**: Map internal paths to `_action` strings (e.g., `admin/users/update`).
- **AES-GCM Encryption**: Encrypt the entire JSON payload using a temporary symmetric key fetched from a specialized security endpoint.

### Real-Time Monitoring (SSE/Heartbeat)
- **SSE**: Use for audit logs and security traffic for passive reactivity.
- **Heartbeat**: For infrastructure or server health (e.g., [[6.7 K8sManager]]), use a `setInterval` (e.g., 2000ms) with a try/catch error state to detect "Connection Lost" instantly.

### Infrastructure Control
- **Keychain Integration**: Store sensitive system keys (e.g., Ghost Keys) in a dedicated utility that manages encryption/decryption within the vault context.
- **Direct Scaling**: When implementing resource controls, provide instantaneous +/- feedback loops with optimistic UI updates.

### High-Performance Multimedia
- **Proportional Bounds**: For responsive canvas/SVG animations (e.g., [[13 Aquarium]]), calculate active zones as percentages of the *visible* portion of an `object-fit: cover` container.
- **Ref-Synced Audio**: When using `Tone.js` or the Web Audio API (e.g., [[16 MusicBuilder]]), store mutable state in `useRef` to avoid React re-renders within high-frequency audio callbacks. Rerender only the visual playhead independently.
- **Encapsulated Visualization**: Use unique instance IDs (e.g., `d3js-wrapper-${nanoid()}`) to prevents D3/DOM library selectors from leaking across components.

### Screen Mode Orchestration
When implementing multi-mode displays (e.g., [[17 ViewsControl]]):
1.  **Safe Reparenting**: When moving components across the DOM (for "Fixed" or "FullTab" modes), use a `placeholder` element at the original location to ensure reliable restoration.
2.  **Transition Stabilization**: Always revert to a "Default" state briefly before transitioning between complex modes. Trigger hardware engine resizes (`engine.resize()`) during this stabilized window.
3.  **Native PiP**: Use `canvas.captureStream()` fed into a hidden `<video>` element for true, view-only OS-level Picture-in-Picture.
4.  **External Window Bridge**: For OS-level windows (Electron), implement tri-layer communication: IPC (Primary) -> Window Opener (Secondary) -> LocalStorage (Broad Fallback).
5.  **Command Registry Hijacking**: When total isolation is required (as in [[21 ExternalInputBlocker]]), store `app.commands.commands` in a ref and clear the live object. ALWAYS restore this on `visibilitychange` or `blur`.
6.  **Script Caching**: Use a `loadScript` utility to fetch CDN assets and write to `.datacore/script_cache` to avoid network-dependency in core components.

### 3D & Immersive Patterns
When working with Babylon.js and Havok (see [[22 World888]]):
1.  **Physics-Graphic Sync**: Distinguish between `STATIC` environment meshes and `KINEMATIC` interactive platforms.
2.  **P2P Smoothing**: Use Linear Interpolation (LERP) for remote entity positions to hide `BroadcastChannel` latency.
3.  **Asset Lifecycle**: Use `LoadingConfirmation` components to check local vault cache (`_resources/glb/`) before downloading large 3D models.

### Immersive Data & Interaction (Batch 5)

- **Offline Texture/Asset Caching**: For external assets (e.g., Earth textures), use `adapter.writeBinary` to cache files in `.datacore/` and `adapter.readBinary` + `URL.createObjectURL` for subsequent loads (see [[24.1 MapGlobe]]).
- **Full-Tab Breakout**: To create an "immersive" view within Obsidian, find the nearest `workspace-leaf-content` ancestor and append the component to its `view-content` child, overriding positioning to `absolute 0,0` (see [[23.2 Canvas]]).
- **Projection Morphing**: Use D3 projection mutators to smoothly interpolate between geospatial views (e.g., `geoOrthographic` to `geoEquirectangular`) based on zoom level (see [[24.2 MapGlobe]]).
- **Local-First 3D**: Always use `dc.app.vault.adapter.getResourcePath()` to resolve vault-relative paths (e.g., `_resources/glb/*.glb`) into browser-loadable URLs for engines like Babylon.js or Three.js (see [[25 BabylonLocal]]).
- **Interaction Pass-Through**: For layout tools (like Canvas), implement a "Locked" toggle that selectively toggles `pointer-events: none` on the container while allowing events to hit specific internal `datacore-component` boxes (see [[23.1 Canvas]]).

### Orchestration & Reliability (Batch 6)

- **Advanced Script Loading**: Use `LoadScript` to manage dependencies. Classic scripts load via `document.createElement('script')` while ESM modules use dynamic `import()` or `esm.sh` bridges. Always implement **Offline Caching** for these assets in `.datacore/script_cache`.
- **Global Z-Index Management**: To manage multiple floating windows (PiP), maintain a global `highestZIndex` variable and a `bringToFront` function that Queries `.fresh-pip` elements to find the current max and increments it.
- **Command Registry Hijacking**: For critical flows (Legal/Auth), temporarily store `app.commands.commands` in a ref and set the live object to `{}`. Override `executeCommandById` to block or allow specific system actions (see [[26 LicenseAgreement]]).
- **Input Preemption**: Use document-level `addEventListener` with `{ capture: true }` to intercept and `stopPropagation()` on keys/scroll before they reach the rest of the application.
- **Vault-Synced Metadata**: Use `app.vault.modify` to sync component state back to markdown checklists (`- [ ]` &harr; `- [x]`) for persistent progress tracking across devices.

### Aesthetics & Performance (Batch 7)

- **Canvas Slicing (Jitter)**: Create high-performance text jitter by rendering text to an **Offscreen Canvas** and then using `drawImage(offscreen, 0, sliceY, width, 1, randomOffsetX, sliceY, width, 1)` to draw randomized horizontal offsets in a `requestAnimationFrame` loop (see [[29 FuzzyText]]).
- **Internal Tuning Panels**: For complex visual components, include an `isEditPanelVisible` state that toggles a blurring overlay with sliders to live-tune props like `glitchSpeed`, `fontSize`, and `colors`. This allows "Aesthetic Prototyping" directly in the live view (see [[30 MatrixGlitchWall]]).
- **Fuzzy Media Resolution**: Instead of hard-coding asset paths (e.g., logo SVGs), use `Fuse.js` to search the vault's file index (`app.vault.getFiles()`). This makes components resilient to file re-organization (see [[31 LoadingLogo]]).
- **Singleton Script Loader**: To prevent redundant CDN loads (e.g., loading `marked.js` or `Fuse.js` multiple times), implement a `loadScript` utility that checks a global cache `window._cdnScriptCache` for an existing `Promise` before creating a new `<script>` tag.

### Immersive Data & Interaction (Batch 8)

- **Git-like Logic (Local Versioning)**: For high-stakes editing (e.g., [[33.2 CodeEditor]]), implement a local `.git` mirror using `crypto.subtle.digest('SHA-256')` for content hashing and a JSON-based objects directory to store diff-based or full-file history.
- **Integrated Shell Access**: Components requiring system orchestration (e.g., [[33.3 CodeEditor]]) can use `spawn` to bridge into the user's local shell (e.g., `/bin/zsh` or `powershell.exe`). Always use `{ -l, -c }` flags for login-shell context and handle `SIGINT` for process control.
- **Monaco Iframe Isolation**: To avoid CSS/JS collisions with the Obsidian host, load Monaco Editor inside an iframe and communicate via `postMessage`. Cache types (like `obsidian.d.ts`) locally to provide rich intellisense offline.
- **3D Video Textures**: In Babylon.js cards (e.g., [[34 AnimatedCard]]), use `VideoTexture` on meshes to create dynamic interactive backgrounds. Implement `onPointerEnter/Leave` to sync video playhead with parallax animations.
- **Time-Series Visualization**: Use D3.js with localized SVG isolation (`id="${nanoid()}"`) to render complex ActivityWatch data. Implement `Streamgraph` and `Heatmap` patterns for temporal density analysis (see [[35 ActivityWatchDashboard]]).
- **Web Audio Lifecycle**: For resilient audio (e.g., [[32 SoundPlayer]]), store the `AudioContext` and `bufferSource` in `useRef` to manage playback state independently of React's render loop.

### Immersive Data & Interaction (Batch 9)

- **Safe JSON Serialization (Circular Refs)**: For IDEs showing raw Datacore objects (e.g., [[37 DatacoreQueryBuilder]]), use a `jsonReplacer` that detects keys like `$parent` and returns breadcrumb paths instead of circular references to prevent Crashes.
- **Self-Improving AI Prompts**: Implement "Marker-Based Extraction" in AI components. Use regex to capture `[RULE:...]` or `[LIMITATION:...]` from LLM outputs and persist them to a local Markdown knowledge base (`query_knowledge.md`) for injection into future system prompts.
- **Few-Shot Learning (Local)**: Persist successful user-confirmed queries to `learnings.json` and use them as few-shot examples in the base prompt to optimize the model's syntax accuracy over time.
- **Vault Exploration Wizards**: Build searchable autocomplete helpers (Tags, Folders, Properties) by indexing `app.vault.getFiles()` and filtering based on selected Datacore types (@page, @task).

### External Systems & Automation (Batch 10)

- **Worker Singleton Pattern**: For long-running background tasks (e.g., [[38 Chatbot]]), spawn a standalone Node.js process and store its reference in `window.__WORKER_NAME__` to allow component re-mounting without losing the connection.
- **Cross-Vault Orchestration**: Use Electron's `obsidian.json` context to identify peer vaults and `window.require('fs')` for direct file manipulation outside the primary vault boundary (see [[39 DatacoreImporter]]).
- **Resilient CDN Loading**: Implement a `loadScript` utility that fetches dependencies (e.g., [[41 OCRReader]] with Tesseract.js) from CDNs and caches a local copy in `.datacore/script_cache` for offline resilience.
- **Binary Data URLs**: When rendering vault-resident images in Electron components, read files as Binary (`readBinary`) and convert to Base64 Data URLs to ensure cross-origin compatibility and high-speed rendering.

### Advanced AI Orchestration (Batch 11)

- **Swarm Load Balancing**: Aggregate multiple API accounts into a "Swarm" to multiply throughput and credit limits. Implement auto-rotation on 429 (Rate Limit) or 401 (Auth) errors to ensure zero-downtime availability (see [[42.2 AntigravityChat]]).
- **PKCE Auth Flow**: Use Proof Key for Code Exchange (PKCE) for secure OAuth2 flows within the Obsidian/Electron environment without requiring a backend redirect server.
- **Environmental Context Sniffing**: Automatically scan the `activeLeaf` to extract the current file path, metadata, and content snippets. Inject this "Environmental Awareness" into the system prompt to ground the AI's responses in the user's active workspace.
- **Burn Rate Telemetry**: Implement periodic usage snapshots to calculate "Credits per Hour" (Burn Rate) and predict depletion timestamps based on session intensity.

### System Utilities & Standalone Assets (Batch 12)

- **Delta Vault Updates**: To avoid full vault clones, use JSON-based manifests (`update-manifest.json`) containing lists of `added`, `modified`, and `deleted` paths. Perform targeted downloads of only changed files to minimize bandwidth and network noise (see [[46 VaultUpdater]]).
- **Soft-Delete Archive Pattern**: Instead of permanently deleting vault files, move them to a hidden `.archive/` root. This maintains a verifiable history and allows for granular rollbacks of specific assets after an update cycle.
- **Standalone CSS Animation Generation**: For portable icons and branding, create a utility that parses SVG paths and generates a self-contained `<style>` block with `@keyframes` mapped to `stroke-dashoffset`. This eliminates the need for external CSS files (see [[45 SVGAnimations]]).
- **State-Synced Video Encoding**: To capture data-driven animations (e.g., charts or dynamic icons) as video, use a manual `requestAnimationFrame` loop to control the rendering of a target Canvas. Sync `MediaRecorder` timestamps with data transitions to ensure smooth, frame-perfect exports (see [[45 SVGAnimations]]).
- **Runtime JSX Execution**: Execute live React components embedded in Markdown by bridging Babel's transpiler with Datacore's runtime. Use a `DatacoreJSXRenderer` to sandbox these components while providing access to the `dc` global for vault interaction (see [[44 MarkdownParser]]).
- **Iterative OCR Refinement**: When processing low-quality images (e.g., thermal receipts), implement a multi-pass OCR workflow. Use AI (Groq/Vision) to analyze the initial Tesseract.js output and suggest "Refinement Hints" or preprocessing adjustments for a more accurate second pass.

#### System Orchestration & Mass Editing (Batch 13)

- **Atomic Metadata Mutation**: Use `app.fileManager.processFrontMatter` for atomic, formatting-preserving updates. Batch operations should iterate through file arrays and await individual process calls to ensure vault stability (see [[49 MetadataEdit]]).
- **Topological Action Execution**: In workflow engines, use **Topological Sort** to resolve node dependencies. Implement an adjacency-based data passing system where each node's inputs are collected from the execution outputs of its preceding neighbors (see [[51 ActionsFlows]]).
- **Supplement Injection**: A pattern for non-destructive note assembly where "Supplement" files are dynamically prepended or appended to a target document during a compilation/build phase, enabling modular context injection (see [[47 RandomFileControls]]).

#### Asset Engineering & Progressive UI (Batch 14)

- **Topological Asset Resolution**: When exporting complex graphics, build a dependency graph of embedded files and process them in topological order to ensure child assets are resolved before the parent is finalized (see [[48 SVGConverter]]).
- **Binary Font Embedding**: To create portable SVG files, identify used fonts, fetch binary data from the vault, convert to Base64, and inject them into the SVG via `@font-face` rules (see [[48 SVGConverter]]).
- **Phased Dependency Loading**: Bootstrap complex applications in stages (Phase 1: Styles, Hooks, Native Bridges -> Phase 2: Logic -> Phase 3: AI/Code Resources). Store persistent bridge references (like CDP or shell managers) in the Phase 1 `core` state to ensure they are available to all child components upon mounting.
- **Inferred Property Typing**: When building metadata editors, implement an inference engine that determines Property Types (Checklist, Date, List) by sampling values across a folder selection (see [[49 MetadataEdit]]).

#### High-Fidelity Performance & UX (Batch 15)

- **Bulldozer Physics**: A grid interaction pattern where a dragged item is immune to collision forces but exerts strong impulses on neighbors. Use a fixed-step loop that sweeps along the drag path to ensure "bulldozer" behavior through dense crowds without penetration.
- **Web Worker Rasterization**: Offload SVG-to-Bitmap conversion to a `Web Worker` using `OffscreenCanvas`. This prevents UI jank during mass asset loading and allows for predictive background rendering (see [[52 AssetsLibrary]]).
- **Intelligent Media Resolving**: Implement a centralized `MediaResolver` that builds a custom vault index (`byName`, `byPath`) on first use. Invalidate the index via vault event listeners (`create`, `delete`) and use `RESOURCE_PATH` caching to eliminate redundant lookups.
- **Screen Mode Orchestration**: A pattern for cross-layout persistence where components can transition between "Default", "Window", and "PiP" modes. Implement this by dynamically reparenting the DOM container to `document.body` for overlay modes and back to the parent leaf for default viewing.
- **Phased Parallel Loading**: Run file loads, GitHub syncs, and background conversions simultaneously. Implement "Strategic Yield Points" via `setTimeout(0)` to allow the main thread to remain responsive during high-intensity batch processing.

#### Sandboxing & Execution Safety (Batch 16)

- **Crash-Proof Error Boundaries**: Wrap live-reloading components in a custom `ErrorBoundary` that catches rendering failures and displays a non-destructive `ErrorDisplay`. This prevents a code error in a dynamic sub-component from crashing the host view.
- **Context Hijacking**: When executing code from temporary files (Playground), temporarily override `dc.useCurrentPath` to return the original source file's path. This ensures that `dc.require` and relative path resolutions function correctly within the "hijacked" execution context.
- **Adversarial Audit Loop**: A testing pattern for verifying environment privileges. Systematic probes for Node.js `process` access, `fs` traversal, and `child_process` execution to document and enforce security boundaries.
- **Full Tab Orientation**: An immersive layout pattern where a component takes over the entire workspace leaf. Achieve this by reparenting the container to the `.view-content` div (the parent of the plugin's own wrapper) and setting absolute positioning with `100%` width/height.
- **Monaco Isolation (Iframe Host)**: To prevent library conflicts and style bleeding, host the Monaco Editor inside a dynamically generated `iframe` using a local "host.html" file. Communication is handled via `postMessage`.

#### Workspace & Execution Orchestration (Batch 17)

- **Proxy Plugin Command Registration**: A pattern for dynamic command injection where a minimal "Host Plugin" manages a `data.json` registries of custom JS actions. Commands are executed via `new Function('Notice', 'dc', ...)` to provide scoped access to Obsidian and Datacore APIs.
- **Low-Level Vault Event Hooking**: Use `dc.app.vault.on('raw', callback)` to listen for unparsed filesystem events across the entire vault. This is essential for deep-level hot-reloading and automated development loops.
- **Background Process Emulation**: Manage long-running system tasks using Node's `child_process.spawn`. Implement a "Grouped Execution Block" UI pattern to keep terminal history clean by auto-collapsing background process output and grouping related entries by PID.
- **Recursive Layout Serialization**: Manage complex workspace states by recursively traversing `split`, `tabs`, and `leaf` nodes. Before saving to the core Workspaces plugin, strip transient metadata (IDs/timestamps) to ensure portability.
- **Process Safety (Unmount Hooks)**: Always implement a `SIGTERM` cleanup loop in component `useEffect` return functions to ensure spawned Node.js child processes do not become "zombies" after the UI component is closed.
- **Multi-Manager Orchestration**: Decoupling logic into specialized Managers (HotReload, AutoBuild, NodeJs) within a single component (see [[62 PluginDevSuite]]).
- **Native API Reflection**: Using `require('obsidian')` for deep introspection of the host environment (see [[64 ObsidianSuiteKit]]).
- **Intelligent Log Debouncing**: Summarizing rapid console output to maintain performance and readability.
- **Canvas-Based 3D Emulation**: Implementing 3D point projection and sorting on 2D Canvas for lightweight visual effects (see [[65 AnimatedSphere]]).
- **Dynamic IDE Spawning**: Handling OS-specific shell differences for launching external GUI applications (see [[61 OpenIDE]]).

### Infrastructure & Aesthetics (Batch 18 & 19)

- **Node-based Design Canvas**: Implements an infinite canvas for infrastructure design with recursive grouping and nested view zoom. Uses a custom physics-ready "Bulldozer" drag implementation and adjacency-based link interpolation (see [[67 KubeNexus]]).
- **WebGL Shader Pipelines**: Orchestrates Three.js with custom GLSL shaders for real-time luminance-based displacement. Implements a "Shaders-as-Component" pattern where raw string templates are compiled at runtime with dynamic Uniform bridging (see [[67 DisplacementView]]).
- **Algorithmic 2D Dithering**: Leverages 2D Canvas `getImageData` for high-frequency pixel manipulation across 20+ math-based algorithms (Melting, CRT, Glitch, etc.). Integrates **Tweakpane** for real-time parameter tuning in the Obsidian environment (see [[68 DitherPro]]).
- **MacOS Security Lifecycle**: Bridges the macOS `security` CLI into the Datacore environment. Implements "Session Locking" via dedicated Keychain records and force-prompt (TouchID) triggers for sensitive infrastructure design (see [[67 SecureKeychain]]).
- **Reactive Data Telemetry**: Uses D3.js with automatic `ResizeObserver` lifecycle management to render time-series download data. Features "Market Share" market analysis with normalized bar/line distribution (see [[67 ObsidianDownloadStats]]).

### Utility & Simulation Patterns (Batch 20 & 21)

- **System Command Bridging (Zip)**: Orchestrates vault-relative filesystem operations via Node.js `child_process.exec`. Pattern: `cd` to parent -> set `zip` output to component-local storage -> execute. Use a `Notice`-synced logging array for UI progress (see [[68 FolderZip]]).
- **Background Heartbeat Service**: Implements persistent "Invisible" logic by attaching `setInterval` handles to the `window` object. Features an idempotent initialization check (`window._HANDLE = setInterval(...)`) to prevent duplicate service loops during plugin reloads (see [[68 OnStartup]]).
- **Dynamic Scraper Plugin Orchestration**: Loads modular scraper logic as ESM strings via `dc.require` or `import()`. Pattern: `PluginLoader` -> `fetch(config.json)` -> `eval/require` implementation. Bridges plugin search/detail methods into a unified React UI (see [[69 GrayjayPlayer]]).
- **CDN Script Version Pinning & Caching**: Advanced `loadScript` utility that fetches pinned versions (e.g., `mermaid@10`) and persists the raw string to `.datacore/script_cache/`. Future loads use `Blob URL` instantiation for rapid, offline-first execution (see [[69 MermaidDiagram]]).
- **WebGL Verlet Physics (Cloth)**: Implements 3D physics in GLSL vertex shaders to offload simulation to the GPU. Pattern: Wave functions (`sin(time + uv)`) modulated by a "looseFactor" (`1.0 - uv.y`) to create realistic pinning and wind effects (see [[69 TornCloth]]).
- **Grungy Shader FX**: Fragment shader pattern using multi-octave Simplex Noise (FBM) to generate paper grain, ragged edges, and scratches. Uses luminance-based texture blending to create realistic "worn" or "vintage" aesthetics (see [[69 TornCloth]]).

### Gaming & Retro Simulation Patterns (Batch 22)

- **Wasm Engine Orchestration**: Pattern for hosting large Wasm binaries (e.g. game engines) within React. Features an `importObject` for standard I/O (Draw Screen, Stdout, Stderr) and manual `WebAssembly.Memory` management for high-speed buffer manipulation (see [[70 DoomPlayer]]).
- **Aggressive Input Isolation**: A pattern for completely hijacking the host's keyboard registry. Uses `window.addEventListener('keydown', ..., { capture: true })` with `stopImmediatePropagation()` to intercept game keys before they reach Obsidian/Electron hotkey listeners (see [[70 DoomPlayer]]).
- **Heuristic Memory Discovery (Hunter)**: Finding internal game variables by observing memory deltas over time. Pattern: Capture baseline -> wait 1s -> identify addresses where value increment matches known game tick rate (e.g. 35Hz). Use for auto-discovering health/timer offsets in unknown binaries (see [[70 DoomPlayer]]).
- **Cross-Window Memory Sync**: Using `@electron/remote` to spawn an external diagnostic window that shares memory context via `ipcRenderer`. Features a "Hex Inspector" update loop that broadcasts memory slices only when the external window is active to save resources (see [[70 DoomPlayer]]).
- **Obfuscated Telemetry Pipeline**: Pattern for secure game stat reporting. Uses XOR-based string obfuscation and Base64 encoding to protect telemetry payloads during transit (see [[70 DoomPlayer]]).
- **Instanced WebGL Flow**: Using `InstancedMesh` for high-density visual asset orchestration, managing thousands of parallel sprites with custom GLSL shaders (see [[70 ImageStream]]).
- **Wasm Iframe Patching**: A pattern for hosting complex Wasm suites in isolated iframes by hot-patching official assets for local filesystem execution (see [[71 ImHex]]).
- **Indentation-Aware Parser**: A robust 12-space indented list parser for extracting complex hierarchical data from Markdown (see [[71 Recap2025]]).
- **Cinematic Presentation logic**: Orchestrating letterboxing, vignettes, and smooth zoom-out transitions for immersive presentation states (see [[71 Recap2025]]).
- **Orthographic 3D UI Staging**: Projecting 2D interface layers into 3D space with interactive parallax and spatial animations (see [[71 SceneUI]]).
- **Passive HUD Updates**: A pattern for updating 3D metadata overlay (FPS/Pos) via direct DOM mutation instead of React state to avoid render-cycle lag during WebGL execution (see [[71 SplatHandler]]).
- **Gaussian Splat Orchestration**: Integration of `.ply` splat scenes with orbital controls and smart auto-centering (see [[71 SplatHandler]]).
- **Spatial Grid Physics (Canvas)**: High-performance 2D physics using a 400px spatial grid for broad-phase repulsion checks, enabling 1,000+ interactive nodes on a single Canvas (see [[72 ResourceDashboard]]).
- **Procedural Wireframe Generation**: Real-time re-computation of mesh topology within volumetric primitives (Hexagon, Torus, Pyramid) using random-walk segment logic (see [[72 SignalMesh]]).
- **GLSL Signal Flow Shaders**: Custom fragment shaders for animating high-speed pulses across mesh segments with additive blending (see [[72 SignalMesh]]).
- **Raw OBS WebSocket Auth**: A pattern for implementing the OBS v5 challenge/response handshake using `crypto.js` (SHA256) over standard WebSockets (see [[73 LiveStreamManager]]).
- **Unofficial API Proxy (InnerTube)**: Spawning Node.js child processes to wrap internal service APIs (like YouTube's InnerTube) for high-frequency data fetching without UI blocking (see [[73 LiveStreamManager]]).
- **Electron IPC Bridge Windows**: Patterns for spawning dedicated, always-on-top Electron windows that communicate via `webContents.send` and `ipc-message` to create multi-window task contexts (see [[73 LiveStreamManager]]).
- **Proximity-Revealed UI**: Using global `mousemove` listeners to bridge proximity detection across complex UI layers, revealing controls only when intent is detected (see [[73 LiveStreamManager]]).
- **CPU-based Grid Caching**: Optimizing high-density ASCII rendering by pre-calculating viewport-relative noise and vignette values in flattened arrays to avoid redundant math per frame (see [[73 PerlinMountains]]).
- **Adaptive API Handshaking**: Implementing complex service handshakes (e.g., Twitter Guest Tokens) by mimicking high-level browser headers and origin-specific patterns (see [[73 XManager]]).
- **CSS Alpha Masking**: A performance pattern for complex textures on text using `Webkit-mask-image` with Cloudinary-hosted bitmap alpha-masks instead of heavy Canvas manipulation (see [[74 MaskedText]]).
- **Accumulated Offset Animation**: Simulating infinite forward motion in 3D by incrementing a persistent coordinate offset passed into noise functions, rather than moving the camera (see [[75 ReverseFlight]]).
- **Hybrid Shim Transformation**: A build-time pattern for transforming Datacore-flavored JSX into web-standard ESM. Features **Regex Dependency Lifting** and **Node.js Built-in Stubbing** for browser compatibility (see [[76 NextWebsite]]).
- **Async View Factories**: Mandatory signature: `async function View({ folderPath, dc, ...props })` for unified dependency resolution across local and web environments.
- **Prop Injection Pattern**: Managing cross-environment dependencies by passing hooks/sub-components as props from entry points instead of internal requires.
- **Kinetic Physics & Friction**: A pattern for smooth scrollable streams using `velocity *= friction` and `requestAnimationFrame` for high-frequency coordinate updates (see [[77 CardScanner]]).
- **Real-Time UV Clipping**: Implementing visual state transitions by syncing JS physics with CSS `--clip-path` or mask variables for zero-latency revealing of secondary visual layers (see [[77 CardScanner]]).
- **Boundary-Aware Flood Fill**: A Canvas-based algorithm for removing backgrounds while preserving internal color regions using 4-point connectivity scans on `ImageData` (see [[79 VideoBackgroundRemoval]]).
- **Neural UI Health Monitoring**: Pattern for passive connection tracking using "Latency Dots" and asynchronous model discovery fetches with automatic debouncing (see [[78 NeuralLinkManager]]).
- **Adaptive Cognitive Progression**: A logic pattern for difficulty scaling (e.g., N-level shifts) based on real-time D-prime accuracy and reaction time analysis (see [[81 IQGame]]).
- **Sidecar Registry Pattern**: Using a dedicated JSON file within the component source to manage metadata for sensitive keys/credentials outside of primary frontmatter (see [[82 KeychainManager]]).
- **Polymorphic Game States**: A state machine that swaps entire game engines (logic/rendering) while maintaining unified score/identity context (see [[84 RetroMorphGame]]).
- **Lead-based AI Controllers**: Designing AI "perfect-play" logic using virtual trigger points and "Lookahead Frames" for precise collision avoidance in high-speed loops (see [[84 RetroMorphGame]]).
- **Hybrid Proxy Terminal**: Bridging mobile-native environments (like Termux) into Datacore via WebSocket-based `ttyd` interception and command queueing (see [[85 TermuxMobile]]).
- **Command Queue UX Simulation**: Implementing artificial visual delays in terminal command injection to ensure user legibility during automated script execution (see [[85 TermuxMobile]]).
- **Python PTY Bridging**: Utilizing an embedded Python script and `pty.openpty()` to create a real Pseudo-Terminal on the host system, enabling full TTY interactive behavior for shell-based tools (see [[89 ObsidianCLI]]).
- **VT100/ANSI Terminal Emulation**: A custom parsing logic to translate complex ANSI escape sequences (CSI codes) into rendered React UI states, handling cursor movement and screen clearing (see [[89 ObsidianCLI]]).
- **Persistent Worker Lifecycle**: Archiving background process references (e.g., Node.js child processes) on the global `window` object to ensure connection/service persistence across component re-mounts or view tab switches (see [[89 ObsidianCLI]]).
- **Auto-Maximize Lifecycle Pattern**: Implementing a delayed expansion hook (`useEffect` + timeout) that automatically triggers a Full-Tab takeover shortly after mounting to optimize utility screen real estate (see [[89 ObsidianCLI]]).
- **Temporal Anti-Flicker Smoothing**: Implementing a frame-buffer averaging logic (alpha blending previous luminance data) to reduce visual jitter when translating video streams to high-frequency text-based UI (see [[91 VideoToAscii]]).
- **Matrix-Based Structural Rotation**: Manually applying 2D rotation matrices (`rx = px * cosA - py * sinA`) to vertex/point caches instead of global `canvas.rotate()` calls to ensure constant-width strokes and high-fidelity rendering during complex motion (see [[100 ProceduralSquid]]).
- **Negative Equation Transition Pattern**: Organically reversing "curl" factors in polar angle generation to cause procedural entities (like tentacles) to uncurl and flip sides relative to their movement heading (see [[100 ProceduralSquid]]).
- **Dynamic CSS3D Orchestration**: Combining runtime-loaded animation libraries (`animejs`) with raw CSS3D transforms to create immersive 3D spatial layouts without full WebGL overhead (see [[93 PeriodicTable3D]]).
- **Dynamic PLIST Macro Generation**: Programmatically constructing macOS `.kmmacros` (PLIST XML) files at runtime to bypass static automation limits, enabling dynamic creation of global hotkeys and system-wide scripts (see [[93 KeyboardMaestroCLI]]).
- **AppleScript Reflected State**: Executing `osascript` through `child_process` to query the internal state of non-API GUI applications (parsers, groups, statuses) and reflecting that data into the React UI (see [[93 KeyboardMaestroCLI]]).
- **Safe Agent Recovery Pattern**: A background polling mechanism (using pure Node.js `fs` before React boot) that allows individual components to be reloaded or settings opened via external command files (`mcp_commands.json`), ensuring resilience during UI crashes (see [[107 AiAgentsSwams]]).
- **Detached UI Integration (Electron Popouts)**: Spawning and synchronizing external Electron windows (Test Runner, Agent Console) to offload heavy processing and provide persistent debugging views independent of the main UI lifecycle (see [[107 AiAgentsSwams]]).
- **Global Bridge Registry**: Utilizing a singleton registry on `window` (e.g., `window.__MCP_TG_REGISTRY__`) to ensure persistent connections for socket-based tools (Telegram, MCP) remains stable across component reloads (see [[107 AiAgentsSwams]]).
- **Lock-Free Bridge Pattern**: Utilizing `System.setProperty` as a concurrent JSON-serialized buffer between low-level Java Mixins and high-level JavaScript tick handlers (see [[105 DatacoreNosisUI]]).
- **World-Thread Safety context**: Forcing ECS/Entity mutations into a `server.addPlayerCommand` wrapper to satisfy GraalVM threading constraints (see [[105 DatacoreNosisUI]]).
- **Datacore Component Meta-Prompt**: A standardized directory and file architecture for building high-performance, edge-to-edge React/WebGL components in Obsidian (see [[105 DatacoreNosisUI]]).
- **Go/WASM Headless Brain**: Decoupling complex agentic reasoning (ReAct loops, tool logic) into a Go binary compiled to WASM, while keeping the UX in React/Datacore for seamless Obsidian integration (see [[104 ObsidianClaw]]).
- **Savepoint Runtime Context**: Utilizing the **Ophidian Framework** to create isolated runtime environments (`savepoint`) that satisfy component-level dependencies and provide global service access (see [[105 DatacoreCode]]).
- **Status Bar Edge-to-Edge**: Programmatically toggling Obsidian's `.status-bar` during the "Full-Tab" lifecycle to achieve true interface immersion for management and coding dashboards (see [[103 PicoClawManager]]).
- **Ralph Wiggum Methodology**: A stateless, file-system-first multi-agent coordination protocol for complex system engineering (see [[00_PicoClaw_Agent]]).
- **Bulletproof Engine Hook**: Persistent `useRef` master switches for `requestAnimationFrame` to bypass React state latency in high-speed scrubbing (see [[78 RemotionClone]]).
- **Isolated Player Mounting**: Injecting official React/Remotion trees into Preact views via `createRoot` for engine isolation (see [[78.8 Remotion]]).
- **Programmatic Video Composition**: Using React components as first-class video frame generators with temporal sequencing (see [[78.8 Remotion]]).

### 3D & Math Foundations
When working with raw WebGL (e.g., [[14 GameEngineBuild]]):
1.  **Matrix Orchestration**: Implement 4x4 matrices for Translation/Rotation/Scale to maintain complete control without external 3D libraries.
2.  **Raycasting**: Map 2D screen coordinates to 3D world rays using inverse projection/view matrices for object interaction.
3.  **Pointer Lock**: Use the Browser Pointer Lock API to create immersive "God Mode" or FPS-style controls, toggling `isPaused` state on lock change.

## ⚠️ Critical Rules
*   **No Hooks in Async**: `async function` cannot contain `useState`. Move hooks to the inner component.
*   **Absolute Paths**: Use `dc.resolvePath(dc.basePath)` for shell commands.
*   **Path Resolution**: Use `dc.headerLink` when requiring a JS module stored inside a Markdown codeblock.
*   **Data Integrity**: In file-driven components, ensure valid `---` separators are maintained during string manipulation.
