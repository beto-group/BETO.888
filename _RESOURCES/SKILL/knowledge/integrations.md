---
name: integrations
description: External API patterns, LLM integration, webhooks, and local service/plugin communication. Bridges the gap between the vault and the outside world.
---

# Integrations & APIs

This module provides patterns for connecting Datacore to external services, AI models, and local machine APIs.

## LLM Integration

The standard pattern for calling Large Language Models involves secure key management and structured prompts.

### Secure Key Loading
Never hardcode API keys. Store them in `.datacore/.secrets/` and load at runtime.
```javascript
async function loadApiKey(path) {
  if (await dc.app.vault.adapter.exists(path)) {
    return (await dc.app.vault.adapter.read(path)).trim();
  }
}
```

### API Call Pattern
Use `requestUrl` for robust communication with providers like Groq or OpenAI.

### Self-Improving AI Orchestration
For conversational assistants (e.g., [[37 DatacoreQueryBuilder]]), implement a recursive improvement loop:
- **Marker-Based Extraction**: Use regex to detect `[RULE:...]` or `[LIMITATION:...]` in model output.
- **Persistence**: Store extracted rules in a localized Markdown knowledge base.
- **Injection**: Inject the persistent knowledge into the system prompt for subsequent sessions.
- **Few-Shot Persistence**: Save successful queries as standard examples to refine model behavior.

---

## Swarm Intelligence & Multi-Provider Chat

Advanced chat implementations (e.g., [[42 ChatLLM]], [[42.2 AntigravityChat]]) treat LLMs as a distributed resource.

### Multi-Provider Normalization
Bridge disparate APIs (OpenAI, Anthropic, Gemini) with a standard message format: `{ role: 'user' | 'assistant', content: string, images?: string[] }`.
- **Dynamic Discovery**: Fetch availability from `/models` endpoints at runtime to avoid hardcoding stale model IDs.
- **CORS Bypassing**: Always use `dc.requestUrl` (Obsidian bridge) to avoid Cross-Origin blocks when calling provider APIs directly from the browser.

### Node Swarm Rotation
Multiply quota by distributing requests across multiple nodes (accounts).
- **Health Monitoring**: Track 429 (Rate Limit) and 403 (Forbidden) statuses per node.
- **Auto-Rotation**: On node failure, rotate to the next healthy node in the queue and notify the user to refresh the failing node's auth.

---

## Local Service Communication

### Plugin APIs
Other Obsidian plugins can be accessed via `dc.app.plugins.plugins`.
- **Text Extractor:** For OCR and text extraction from images.
- **Dataview:** For legacy data access (where applicable).

### Localhost APIs
Connect to services running on the user's machine (e.g., ActivityWatch).
- Use `fetchApi` wrappers for standard error handling and JSON parsing.

---

## Background & Service Orchestration

### Node.js Worker Singleton Pattern
For complex background connectivity (e.g., Telegram in [[38 Chatbot]]), use the Node.js `child_process` API to spawn independent workers.
- **Persistence**: Store the worker reference in `window.__WORKER_INSTANCE__` to prevent connection loss during component re-mounts.
- **Communication**: Use `worker.stdout.on('data', ...)` and `worker.stdin.write(...)` for bi-directional async message passing.

### Resilient CDN Dependency Loading
Load external libraries (e.g., Tesseract.js in [[41 OCRReader]]) with a caching layer.
- **Cache Pattern**: Before executing a script, download its content from CDN and save it to `.datacore/script_cache/`.
- **Offline Resilience**: Future loads check the cache first, allowing the component to function without internet access.
- **Deduplication**: Track loading promises in a global map (`window.__scriptPromises`) to avoid duplicate fetch requests from multiple instances.

### OCR & Financial Orchestration
Implement multi-stage refinement for document processing (see [[43 ReceiptTracker]]):
- **Iterative OCR**: Use AI to analyze the raw text output of Tesseract.js. If data is ambiguous, the AI suggests specific preprocessing hints (e.g., "enhance contrast", "invert colors") for a recursive second pass.
- **Entity Identification**: Use LLMs (Groq/Vision) to identify merchants, currencies, and totals from unstructured OCR fragments, automatically flagging discrepancies for manual review.

### Batch Orchestration & Automation (Batch 13)

- **Workflow Orchestration**: Build complex automation logic in [[50 ActionsManager]] and execute headless runtimes via [[51 ActionsFlows]]. This integration allows for cross-component triggers (e.g., query result -> file rename -> metadata update).
- **Batch Asset Processing**: Combine [[47 RandomFileControls]] (recursive selection) with [[48 SVGConverter]] to perform mass conversion of folder-based diagrams into production-ready, font-embedded SVG assets.
- **Atomic Vault Synchronization**: Integrate [[46 VaultUpdater]] with [[49 MetadataEdit]] to sync remote project state and immediately update local metadata properties (e.g., `v-version`, `v-status`) to reflect the current deployment head.

### Asset Ecosystems & HUDs (Batch 14)

- **HUD Orchestration**: Integrate [[53 Dashboard888]] with [[50 ActionsManager]] to trigger complex workflows directly from a persistent, PiP-enabled heads-up display. Use the `MediaResolver` to instantly refresh HUD assets when they are modified by an action flow.
- **Dynamic Asset Feeding**: Use [[52 AssetsLibrary]]'s GitHub sync engine to feed fresh visual components into [[44 MarkdownParser]]. This creates a self-updating gallery ecosystem where remote design changes are automatically reflected in local documentation.
- **PiP Media Pipelines**: Chain [[45 SVGAnimations]] (generator) with [[53 Dashboard888]] (display) to create a real-time monitor system where animated project status icons are rendered in a background task and pinned to the UI via a floating PiP window.

### Integrated Development & Safety (Batch 15)

- **Live Component Development**: Integrate [[50 ActionsManager]] flows with [[54 DatacorePlayground]] to test custom node logic in real-time. The Playground provides the isolated environment and error-handling necessary for rapid iteration without system instability.
- **Environment Security Auditing**: Use [[55 DatacoreLimitations]] as a pre-flight check before deploying complex integrations from [[48 SVGConverter]] or [[39 DatacoreImporter]]. The audit ensures the target vault has the necessary permissions for the Node.js operations required by these components.
- **Immersive IDE Environments**: Combine [[33.1 CodeEditor]] (text editing) with [[54 DatacorePlayground]] (execution & preview) and [[55 DatacoreLimitations]] (full tab layout) to create a premium, end-to-end development workspace within Obsidian.

### Workspace & Terminal Control (Batch 16)

- **Automated Development Loops**: Chain [[59 HotReloadFiles]] (watcher) with [[57 DatacoreTerminal]] (build engine) and [[54 DatacorePlayground]] (preview) to create a self-healing development cycle where file saves automatically trigger rebuilds and UI refreshes.
- **Dynamic Command Orchestration**: Use [[58 DatacoreCommandManager]] to register custom terminal workflows from [[57 DatacoreTerminal]] as first-class Obsidian commands, allowing terminal-based build scripts to be triggered via the Obsidian Command Palette or hotkeys.
- **Stateful Layout Management**: Integrate [[56 WorkspaceManager]] with complex multi-view components like [[35 ActivityWatchDashboard]] or [[52 AssetsLibrary]] to save and restore specialized "Work Mode" layouts that preserve the spatial context of your research and development activity.
- **Automated Dev-to-Prod Sync**: Mirroring file changes between internal Datacore source and Obsidian's plugin directory via the `HotReloadManager`.
- **External CLI/GUI Bridging**: Integrating Datacore workflows with OS-level development tools (Git, IDEs) through child process orchestration.
- **Visual Feedback Loops**: Using lightweight ASCII animations to indicate system activity or idle states without GPU overhead.

### Infrastructure & Aesthetics (Batch 18 & 19)

- **K8s Orchestration Pipeline**: Integrates [[67 KubeNexus]] with the **Contabo VPS API**. Uses a node-based canvas to generate SSH-ready deployment scripts, enabling a "Visual DevOps" workflow where infrastructure is designed as a graph and executed via unified SSH shells.
- **Secure Keychain Bridging**: Chains [[67 SecureKeychain]] with macOS system security. Provides an encrypted bridge for storing K8s credentials, where secrets are only "unlocked" into the Datacore environment via TouchID or system password prompts, ensuring high-security session management.
- **Advanced Visual Aesthetics Sync**: Bridges [[67 DisplacementView]] and [[68 DitherPro]] with the project's asset library. Allows for "Shader-Driven Branding" where visual effects are dynamically applied to vault logos and background media, managed through real-time Tweakpane orchestration.
- **Public Data Visualization**: Integrates [[67 ObsidianDownloadStats]] with the **GitHub Release API**. Uses D3.js to transform raw API JSON into interactive market-share visualizations, providing real-time telemetry on the Obsidian plugin ecosystem.

### Utility & Simulation Extensions (Batch 20 & 21)

- **Bulk System Orchestration**: Integrates the local **OS shell (zip)** with the Datacore environment. Bridging the vault's `adapter.basePath` with `child_process` to enable complex file operations (backups, exports) that exceed standard plugin API capabilities (see [[68 FolderZip]]).
- **Persistent Heartbeat Integration**: A pattern for cross-session background tasks. Integrates the Obsidian `Notice` system with a long-running heartbeat loop, enabling status tracking for background syncs or maintenance tasks without requiring a persistent UI leaf (see [[68 OnStartup]]).
- **Modular Plugin Scrapers**: Bridges the **Grayjay Plugin SDK** into the Obsidian environment. Enables dynamic loading of cross-platform scrapers (YouTube, Twitch) via JSON-based configurations, transforming a local vault into a universal media hub (see [[69 GrayjayPlayer]]).
- **Offline CDN Bridge**: Implements a high-latency-resilient script loading pipeline. Integrates remote CDN resources (Mermaid.js, Three.js) into the vault's local storage via a caching utility, ensuring specialized 2D/3D visualizations remain functional during offline work (see [[69 MermaidDiagram]]).

### Gaming & Retro Integration (Batch 22)

- **Legacy Engine Emulation**: Bridges classic C/C++ game engines into the vault via **WebAssembly**. Integrates raw filesystem `read/write` for save games and assets with browser-based rendering loops, transforming a note-taking app into a high-performance simulation host (see [[70 DoomPlayer]]).
- **Diagnostic Window Orchestration**: Integrates **@electron/remote** to provide an externalized service UI. This pattern separates the core simulation (in-tab) from complex diagnostic/admin tools (external window), ensuring UI responsiveness during heavy Wasm execution (see [[70 DoomPlayer]]).
- **Secure Telemetry Bridging**: Integrates game-level events with internal Datacore state APIs using encrypted payloads for cross-vault sync (see [[70 DoomPlayer]]).
- **Painless Wasm Suite Hosting**: A pattern for integrating large third-party Wasm applications by mapping remote assets to local vault paths within an isolated iframe (see [[71 ImHex]]).
- **High-Density GPU Orchestration**: Using Three.js InstancedMesh for high-performance visual flows that handle hundreds of media sources with zero UI jank (see [[70 ImageStream]]).
- **Interactive Spatial Prototypes**: Using orthographic 3D cameras to transform static 2D designs into immersive spatial scenes (see [[71 SceneUI]]).
- **Command ID Discovery**: Dynamically scanning `app.commands` for specialized view types (Surfing, WebViewer) to bridge browser-isolation boundaries (see [[72 OpenBrowser]]).
- **Electron Shell Interception**: Patterns for bypassing internal window handling to force external system browser execution (see [[72 OpenBrowser]]).
- **Drag-to-Export File Mutation**: A pattern for exporting Canvas-based graph data to Markdown by injecting serialized entries after specific file headers matching node labels (see [[72 ResourceDashboard]]).
- **Cross-Process Broadcast Orchestration**: Bridging Obsidian, OBS, and YouTube APIs into a single workspace leaf for real-time live operations (see [[73 LiveStreamManager]]).
- **Vault-Backed Chat History**: A pattern for real-time serialization of streaming data (Chat/Logs) into vault-resident Markdown files for persistent indexed search (see [[73 LiveStreamManager]]).
- **Wasm-Bot Command Intelligence**: Integrating AI logic into streaming chats via local model execution or API bridges, managed through the Datacore environment (see [[73 LiveStreamManager]]).
- **System Admin Escalation**: Patterns for executing system commands with administrator privileges from Obsidian using `osascript -e "do shell script ... with administrator privileges"` (see [[74 OpenApplication]]).
- **Private API Proxying**: Bridging restricted web APIs via CLI-based scraper scripts that handle complex authentication headers and CSRF tokens (see [[73 XManager]]).
- **Static Export Pipeline**: Orchestrating Next.js `output: export` builds for deployment to Cloudflare Pages. Features **GitHub Automation** for repo creation, commit, and push directly from Datacore (see [[76 NextWebsite]]).
- **Dynamic Manifest Swapper**: A web-integration pattern for Per-Component PWAs. Dynamically updates the `manifest.json` link in the document head based on the active tab/game to allow targeted "Add to Home Screen" experiences (see [[76 NextWebsite]]).
- **Native Secret Injection**: A security pattern where sensitive tokens (GitHub, Cloudflare) are fetched from the native OS Keychain via `dc.app.secretStorage` and injected into the build-time environment variables (see [[76 NextWebsite]]).
- **Physics-to-Display Mapping**: Pattern for binding JS physics engines (velocity/friction) to CSS properties (clipping/masking) for interactive sensory experiences (see [[77 CardScanner]]).
- **Neural Bridge Persistence**: Patterns for managing LLM provider state across sessions using `localStorage` vs. `app.secretStorage` for secure web integration (see [[78 NeuralLinkManager]]).
- **Resolution-Adaptive Processing**: Integrating high-intensity image/video logic (Flood Fill) with user-selectable resolution scales to ensure performance parity across varying hardware (see [[79 VideoBackgroundRemoval]]).
- **Multi-Modal Hook System**: Patterns for syncing visual, auditory (TTS), and haptic feedback within a unified state machine for high-precision UX (see [[81 IQGame]]).
- **Keychain-to-Server Mapping**: Synchronizing local macOS security records with remote infrastructure management keys via a Sidecar Registry (see [[82 KeychainManager]]).
- **Cross-Environment Terminal Bridge**: Dynamically shifting between native Node.js process orchestration (Desktop) and WebSocket-based proxying (Mobile) within a single UI abstraction (see [[85 TermuxMobile]]).
- **Server-Offline Resilience**: Implementing "No-Wipe" safety checks that preserve local game high-scores if the global leaderboard heartbeat fails (see [[84 RetroMorphGame]]).
- **Remote Terminal Command Injection**: Using a persistent Telegram bridge to execute shell commands remotely via a "Remote PTY" pattern, where incoming messages are treated as interactive shell inputs (see [[89 ObsidianCLI]]).
- **Interactive Suggestion Polls**: Parsing the output of a CLI tool for subcommand suggestions and automatically generating Telegram Polls to allow one-tap remote command refinement (see [[89 ObsidianCLI]]).
- **File-Path Interception & Upflow**: Detecting specific file paths (e.g., generated screenshots or log files) in terminal output and automatically uploading the actual binary file via a Telegram worker bridge (see [[89 ObsidianCLI]]).
- **Interactive Wizard Console Bridge**: Mapping GUI-based setup wizard steps to automated terminal command injection, providing users with real-time log feedback during complex system configuration (see [[92 OpenclawSetup]]).
- **Runtime Dependency Inlining**: Utilizing a centralized `LoadScript` utility to fetch and execute heavy modular libraries (like `p5.js` or `animejs`) from global CDNs only when the component mounts to minimize initial vault footprint (see [[93 PeriodicTable3D]], [[100 ProceduralSquid]]).
- **External Automation Bridge (AppleScript)**: Deep-linking Obsidian/Datacore to macOS automation suites (Keyboard Maestro/Shortcuts) via `osascript` to trigger OS-level workflows (keystrokes, app control) from a web-based UI (see [[93 KeyboardMaestroCLI]]).
- **CLI Binary Orchestration**: Direct interaction with application binaries inside the `/Applications` folder via shell flags to trigger specific internal functions (e.g., executing macros by name/UID) with zero latency (see [[93 KeyboardMaestroCLI]]).
- **Universal Storage Abstraction**: Strategies for multi-layer data persistence in hybrid apps, mixing Vault API (indexing), Native FS (performance), and SQLite WASM (relational data) (see [[110 UniversalStorageShowcase]]).
- **MCP Native Bridge**: Implementation of a light JSON-RPC based "Hands & Eyes" protocol for AI agents to interact with React components through command files (`mcp_commands.json` / `mcp_state.json`) (see [[107 AiAgentsSwams]]).
- **CFR Decompiler JAR integration**: Wrapping and executing specialized Java binaries (`cfr.jar`) via `child_process` to provide source-level insights from compiled assets (see [[106 JavaDecompiler]]).
- **Hytale Server Orchestration**: Complex K3s pod management utilizing resource tuning (-Xmx 2G overhead), dynamic OAuth caching, and AOT cache invalidation (see [[106 HytaleManager]]).
- **Hyxin-Hyscript Bridge**: Deep-level integration using Java Mixins to inject events into a JavaScript logic layer via property-polling (see [[105 DatacoreNosisUI]]).
- **VCN Hardware Port Bridging**: Bypassing Kubernetes UDP NAT bottlenecks by using `hostNetwork` binding to specific edge-firewall authorized ports (30520) (see [[106 HytaleManager]]).
- **Infrastructure Manager API**: Bridging Datacore dashboards to external cluster management endpoints (PicoClaw) for real-time resource orchestration and job spawning (see [[103 PicoClawManager]]).
- **IDE Service Bridge**: Wrapping complex IDE functionalities (Monaco, File Tree, Search) into modular services within the Datacore environment (see [[105 DatacoreCode]]).
- **App Shell Stacking Context**: Moving structural components (Navbars, Controls) to the top-level layout in the **WebsiteBuilder** to prevent clipping or z-index errors caused by Markdown rendering wrappers (see [[00_PicoClaw_Agent]]).
- **Dynamic Import Map Injection**: Injecting `<script type="importmap">` at runtime to resolve complex remote ESM dependencies like Three.js addons (see [[100 ProceduralSquid]]).
- **Hybrid Shim Bridge**: Dynamic loading of official engine libraries (`esm.sh/remotion`) at runtime to extend Datacore's base capabilities (see [[78.8 Remotion]]).
- **Cross-Library Signal Sync**: Synchronizing frame-exact state between the Datacore Preact UI and an isolated official React rendering layer (see [[78.8 Remotion]]).

---

## 🤖 OpenClaw Ecosystem

Guidelines for the OpenClaw agentic bridge.

### Model Selection
- **Recommended**: `google/gemini-2.5-flash`.
- **Note**: Standard Gemini 1.5 models may return 404 in certain configurations; the `2.5-flash` model is the local stability standard.

### Secret Management
OpenClaw disallows storing raw API keys in the main config.
- **auth-profiles.json**: Secrets are stored in `~/.openclaw/agents/main/agent/auth-profiles.json`.
- **Reference**: The `openclaw.json` file merely references the profile mode (e.g., `mode: "api_key"`).

### Setup Automation
Use the `--gemini-api-key` and `--anthropic-api-key` flags during `openclaw onboard` to automatically populate these profiles.

### Gateway Configuration
Always run the gateway with `--force` to automatically resolve port conflicts:
```bash
openclaw gateway --force
```

### Channel Management
To add a Telegram channel via the CLI:
```bash
openclaw channels add --channel telegram --token "YOUR_BOT_TOKEN"
```

---

## Webhooks & Serverless
- **`sendToWebhook(url, data)`**: A "fire-and-forget" pattern using `no-cors` for simple one-way notifications or logging event dispatching.

> [!IMPORTANT]
> This module covers a rapidly evolving tech stack. Implementation details for specific AI models should be verified against current vendor documentation.
