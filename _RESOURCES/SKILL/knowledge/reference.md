# Component Reference

A catalog of specialized Datacore components and their unique capabilities.

## Query Builders
- [[1 SearchQuery]]: Minimalist real-time search component filtering by file name.
- [[2 BasicQuery]]: Bohemian boilerplate for paginated tables with folder path selection.

## Specialized Browsers
- [[4 TagViewer]]: Hierarchical tag browser that treats tags as folders. Supports drag-and-drop reordering (session-based).
- [[5 CustomFeed]]: Social-media style vertical feed. Features platform-specific iframe "guidelines" for mobile-optimized scaling of YouTube, TikTok, IG, etc.
- [[8 FitnessExplorer]]: Interactive anatomical SVG map. Routes users to specific content feeds based on clicked "hotspots."
- [[9 ContentExplorer888]]: Dynamic radial menu system. Hierarchies are defined by `######` headers in `.namzu.md` files. Supports "Drop to Import" on the center node.
- [[10 Kanban]]: File-driven task board. Syncs visual card order directly back to physical markdown file sections (separated by `---`).

## Admin & Orchestration
- [[6.6 BetoAdminDashboard]]: High-fidelity management suite with multi-tab orchestration. Features an "Elevated Session" security model requiring re-authentication (Password + 2FA) even for logged-in users. Uses a dedicated AES-GCM encrypted gateway for sensitive operations.
- [[6.7 K8sManager]]: "K8s Commander" for controlling VPS infrastructure. Features a 2s heartbeat for real-time pod/node monitoring and a secure "Ghost Admin Key" keychain.
- [[6.7 SecurityComponentCheck]]: Advanced static and dynamic analysis suite. Scans for 13+ security risks (XSS, raw FS, eval) and runs components in an `IframeSandbox` with active permission interception.

## Developer Tools
- [[3.3 BasicView]]: Development shell providing Full-Tab reparenting and a file-based Hot-Reload system.
- [[11 ImageRender]]: Media processing component with "Fuzzy Media Loading" via `Fuse.js`. Automatically resolves vault icons and JSON animations by name.
- [[12 LottieExperiment]]: Stencil for multi-layered interactive animations with hover-play/pause logic.
- [[14 GameEngineBuild]]: Full WebGL 3D engine implemented without external libraries. Features 4x4 matrix math and 3D Raycasting for object selection/manipulation.
- [[15 D3JSTest]]: Data visualization bridge for D3.js v7. Uses unique instance IDs to isolate SVG contexts.
- [[16 MusicBuilder]]: "DJ Booth" audio workstation using `Tone.js`. Implements "Ref-Synced Audio Loops" to prevent UI jitter during playback.
- [[17 ViewsControl]]: Advanced display orchestrator. Provides multi-mode screen management including Native PiP (OS-level), External Windows (Electron), and Interactive Floating windows with custom resizing/dragging logic.
- [[18 ViewsInceptions]]: Component recursion stencil. Implements a `MutationObserver` "Sandbox Isolation" pattern to prevent nested views from escaping their DOM parent during mode transitions.
- [[19 IframePlayer]]: Responsive media embedder. Features `ResizeObserver` scaling and a "Markdown Section Provider" for inline editing of specific file segments.
- [[20 MarkdownEditor]]: High-fidelity editor with custom `marked.js` rendering. Features a "Fuzzy Media Resolver" for wikilinks and a "Script Caching" utility for offline asset resilience.
- **[[23.1 Canvas]]**: Infinite component canvas with cross-mode persistence and "Locked" interaction pass-through.
- **[[23.2 Canvas]]**: Node-Link graph editor featuring Undo/Redo history and "Full-Tab" breakout logic.
- **[[24.1 MapGlobe]]**: 3D Globe visualization with persistent offline texture caching.
- **[[24.2 MapGlobe]]**: Morphing projection map (Globe &harr; Flat) with geospatial threat clustering.
- **[[24.3 MapGlobe]]**: MapLibre-based vector map with CSP-safe CSS injection and localization.
- **[[25 BabylonLocal]]**: Localized 3D engine hosting with vault-relative GLB asset resolution.
- **[[26 LicenseAgreement]]**: Legal compliance suite with **Command Registry Hijacking** and scroll-to-accept logic.
- **[[27 MiniGame888]]**: High-performance game engine featuring the **FreshPip** draggable window system and global Z-index management.
- **[[28 LoadScript]]**: Core dependency utility for version-pinned loading of classic scripts and ESM modules with offline caching.
- **[[29 FuzzyText]]**: Dynamic text jitter effect using offscreen canvas slicing and intensity-based hovering.
- **[[30 MatrixGlitchWall]]**: High-performance grid-based glitch renderer with built-in parameter tuning (Edit Panel) and smooth color interpolation.
- **[[31 LoadingLogo]]**: The standard Datacore loading UI. Features **Fuzzy Media Resolution** (Fuse.js) to locate branding assets and a singleton script loader.
- [[32 SoundPlayer]]: Audio workstation bridge using the **Web Audio API**. Supports complex playback control and "Full-Tab Mode" breakout for focused listening sessions.
- [[33.1 CodeEditor]]: Component-based Ace Editor implementation with dynamic script loading and lifecycle management.
- [[33.2 CodeEditor]]: Advanced versioning editor featuring a **SHA-256 Git-like History** and a custom **Ace Minimap** for large file navigation.
- [[33.3 CodeEditor]]: Integrated Development Environment (IDE). Features multi-tab Monaco editing, an **Integrated Shell Terminal**, and a custom **GitSuite** for local repo orchestration.
- [[34 AnimatedCard]]: Premium 3D UI component (Babylon.js). Features video-textured meshes and reactive camera-parallax for high-end content presentation.
- [[35 ActivityWatchDashboard]]: High-fidelity analytics suite. Integrates with ActivityWatch APIs and uses D3.js to visualize time-series activity data (Streamgraphs, Calendars).
- [[36 MusicPlayer]]: Comprehensive audio orchestrator. Features playlist sync, PiP mode, and a multi-provider metadata resolver.
- **[[37 DatacoreQueryBuilder]]**: The ultimate Datacore IDE. Features a live query editor with real-time result streaming, intelligent context-aware wizards (tags, folders, properties), and a conversational AI Query Assistant with multi-provider support.
- **[[38 Chatbot]]**: Immersive Telegram interface. Orchestrates a standalone Node.js worker process for resilient background communication and uses Secret Storage for API credentials.
- **[[39 DatacoreImporter]]**: Cross-vault orchestration tool. Uses Electron's internal APIs to identify and copy component assets (text & binary) between distinct Obsidian vaults.
- **[[40 CardPicker]]**: Mystical randomizer. Demonstrates file-based state persistence and proportional UI scaling using dynamic CSS.
- **[[41 OCRReader]]**: Browser-side text extraction. Features a resilient `loadScript` utility with CDN caching and Tesseract.js integration for privacy-focused OCR.
- **[[42 ChatLLM]]**: The "Universal Chat" interface. Orchestrates multiple LLM providers (OpenAI, Gemini, Anthropic, etc.) with dynamic model discovery and native Vision support.
- **[[42.2 AntigravityChat]]**: High-performance "Swarm" interface. Features Node Swarm load balancing (multi-account rotation), PKCE-based secure authentication, and a Phased Background Boot cycle.
- **[[43 ReceiptTracker]]**: Financial orchestration suite. Features iterative OCR refinement (Tesseract.js), real-time AI spending analysis (Groq API), and D3.js merchant/monthly visualizations.
- **[[44 MarkdownParser]]**: Advanced interactive reader. Supports runtime **DatacoreJSX** rendering, an dynamic module catalog with scroll-synced navigation, and visibility-triggered SVG animations.
- **[[45 SVGAnimations]]**: Standalone asset factory. Features a utility for generating self-contained animated SVGs and a state-synced **Video Export Engine** using MediaRecorder and Canvg.
- **[[46 VaultUpdater]]**: Manifest-driven deployment tool. Implements **Delta Updates** via JSON manifests, persistent vault settings, and a "Soft-Delete" archive pattern for version rollback safety.
- **[[47 RandomFileControls]]**: Bulk orchestration suite. Features recursive subfolder compilation, JSON-driven batch renaming, and a **Supplement Injection** system for persistent context prepending.
- **[[48 SVGConverter]]**: High-fidelity asset engine. Features **Topological Dependency Resolution** for embedded SVGs and dynamic **Binary Font Embedding** to ensure portable font rendering in exported files.
- **[[49 MetadataEdit]]**: Frontmatter orchestration tool. Implements **Atomic Metadata Mutation** via `processFrontMatter`, mass-editing across folder selections, and automatic **Property Type Inference**.
- **[[50 ActionsManager]]**: Visual logic builder. Features a phased-loading architecture with **Idle-Priority Resource Caching** and a modular sub-app integration (Chat/Code) for building complex flows.
- **[[51 ActionsFlows]]**: Workflow execution runtime. Executes ActionsManager flows using a **Topological Execution Engine** with adjacency-based data passing and sandboxed JS expression transformation.
- **[[52 AssetsLibrary]]**: High-fidelity asset browser. Implements **Bulldozer Physics** for grid interaction, off-main-thread **Web Worker Rasterization**, and a smart GitHub sync engine for dynamic asset fetching.
- **[[53 Dashboard888]]**: Ultra-premium orchestration hub. Features an **Intelligent Media Resolver** with vault-indexed caching, a multi-mode **Screen Orchestration** system (PiP/Window), and a centralized Markdown-to-HTML rendering engine.
- **[[54 DatacorePlayground]]**: Live development environment. Implements a **Crash-Proof Error Boundary**, **Context Hijacking** for local path resolution in temp files, and an isolated **Monaco Host Iframe**.
- **[[55 DatacoreLimitations]]**: System security audit. Features an **Adversarial Audit Loop** to verify system-level access and a **Full Tab Orientation** pattern for immersive takeover layouts.
- **[[56 WorkspaceManager]]**: Advanced layout orchestrator. Leverages the **Workspaces Core Plugin** via direct instance access, featuring **Recursive Layout Serialization** and a **Virtualized File Browser**.
- **[[57 DatacoreTerminal]]**: Robust terminal emulator. Implements **Background Process Detection**, **Grouped Execution Blocks** for grouped output, and a **Force-Kill Unmount Hook** for process safety.
- **[[58 DatacoreCommandManager]]**: Dynamic command engine. Uses a **Proxy Plugin Pattern** to inject custom JS actions into the Obsidian Command Palette with isolated `new Function` execution.
- **[[59 HotReloadFiles]]**: Real-time development tool. Utilizes **Low-Level Vault Event Hooking** (`vault.on('raw')`) with debounced notifications for automated development loops.
- [[21 ExternalInputBlocker]]: Environment isolation tool. Demonstrates "Command Registry Hijacking" by clearing `app.commands` to prevent any Obsidian hotkey collisions.
- [[22 World888]]: Immersive 3d world (Babylon.js). Integrates Havok physics and a "BroadcastChannel Bridge" for P2P multiplayer sync with movement interpolation (LERP).
- **[[60 GitSuiteManager]]**: Comprehensive Git shell orchestration and history visualization.
- **[[61 OpenIDE]]**: External tool integration and shell-to-GUI application spawning.
- **[[62 PluginDevSuite]]**: Multi-manager plugin lifecycle orchestration (Build, Deploy, Hot-Reload).
- **[[63 IconsPack]]**: Embedded asset exploration and dynamic code snippet generation.
- **[[64 ObsidianSuiteKit]]**: Native Obsidian API reflection and interactive component testing.
- **[[67 DisplacementView]]**: Immersive WebGL-based displacement mapping. Features **three.js** integration with custom shaders, real-time video textures, and a built-in **MediaRecorder** for video export.
- **[[67 KubeNexus]]**: Advanced infrastructure orchestrator. Features a **Node-based Canvas Deployer** for designing K8s clusters, integrated **Contabo Client** for VPS management, and macOS **Security Keychain** integration for session locking.
- **[[67 ObsidianDownloadStats]]**: Data-driven visualization suite. Orchestrates **D3.js** for real-time plugin download tracking, including market share analysis and insider vs. stable community distribution.
- **[[67 SecureKeychain]]**: Low-level macOS **Security CLI** integration. Provides a secure GUI for generic password management with **TouchID/Force-Prompt** support.
- **[[68 DitherPro]]**: Advanced Canvas-based dithering engine. Features 23+ algorithmic modes (Halftone, Glitch, CRT) and real-time **Tweakpane** parameter tuning with SVG shape support.
- **[[68 FolderZip]]**: Bulk system-level compression orchestrator. Features folder picking with blacklisting and real-time progress logging via Node.js `zip -r` bridging.
- **[[68 OnStartup]]**: Persistent background service template. Implements a heartbeat notification cycle and cleanup logic to ensure singleton execution across sessions.
- **[[69 GrayjayPlayer]]**: Universal media plugin player. Orchestrates dynamic scraper plugins (YouTube, etc.) via the Grayjay SDK, featuring search, metadata retrieval, and source resolution.
- **[[69 MermaidDiagram]]**: Advanced interactive diagramming suite. Implements an offline-caching `loadScript` utility for Mermaid.js with SVG pan/zoom interaction and debounced live-rendering.
- **[[69 TornCloth]]**: High-performance 3D physics simulation (Three.js/GLSL). Features a custom **Verlet Integration** vertex shader for cloth physics and a grungy fragment shader for rags/paper textures.
- **[[70 DoomPlayer]]**: Wasm-based game emulation suite. Features a custom Doom (E1M1) engine, **Electron-based Memory Diagnostics** (Hex/Watchlist), aggressive **Input Isolation**, and heuristic **Stat Discovery** patterns.
- **[[70 ImageStream]]**: High-performance WebGL image flow engine. Uses **InstancedMesh** for high-density visual asset orchestration (1,000+ parallel images).
- **[[71 ImHex]]**: Wasm-powered binary analysis suite. Implements an **Iframe Patching** pattern to host complex Wasm apps locally with patched asset URLs.
- **[[71 Recap2025]]**: Cinematic animation tool for yearly recaps. Features a robust **Indentation-Aware Parser** and immersive cinematic mode (Letterboxing/Vignette).
- **[[71 SplatHandler]]**: Gaussian Splatting rendering suite. Features **Interactive PLY Loading**, **Passive HUD Updates** for 60FPS performance, and a **Persistent Drop-Zone** pattern.
- **[[72 OpenBrowser]]**: Universal browser utility. Implements **Command ID Discovery** for browser isolation testing and **Electron Shell Interception** for external link handling.
- **[[72 ResourceDashboard]]**: High-performance grid hub. Features a **Canvas-based Graph View** with **Spatial Grid Physics**, **60FPS Animation Loop**, and **Drag-to-Export** file mutation logic.
- **[[72 SignalMesh]]**: Procedural 3D network visualization. Generates **Volumetric Wireframes** (Sphere, Torus, etc.) with custom **GLSL Signal Flow Shaders** and additive bloom post-processing.
- **[[73 LiveStreamManager]]**: Full-scale broadcast orchestration suite. Integrates **OBS WebSocket v5 (Raw)**, **YouTube InnerTube Proxies**, and **Electron IPC Chat Windows**. Features a **Proximity-Revealed Control Tower** and **Wasm-Bot** intelligence layers.
- **[[73 PerlinMountains]]**: Procedural ASCII terrain engine. Implements **Ridged-Noise Synthesis** (multi-octave) with **CPU-based Grid Caching** and a **Procedural Vignette** system for edge-fading visuals.
- **[[73 XManager]]**: Advanced scraping orchestration for X.com. Features a **Child-Process Adaptive Scraper** with **Guest-Token Handshaking** and **Cookie-based CSRF Extraction** (ct0). Implements **Electron Shell Bypassing** for link navigation.
- **[[74 MaskedText]]**: High-performance typography engine. Uses **CSS Mask-Image Alpha-Blending** to apply weathered grunge textures to live text with zero rendering overhead.
- **[[74 OpenApplication]]**: MacOS system utility. Implements **Admin Privilege Escalation (osascript)** and **Detached Execution** for launching binary packages from Obsidian.
- **[[75 ReverseFlight]]**: Infinite flight engine. Features **Accumulated Offset Logic** for simulated high-speed flight over **Dual-Layer Perlin Terrain** with exponential distance-fog attenuation.
- **[[76 NextWebsite]]**: Full-stack Next.js bridge for deploying Datacore components as standalone web apps.
- **[[77 CardScanner]]**: Kinetic card stream featuring dual-surface physics, real-time UV clipping masking, and generative ASCII content.
- **[[78 NeuralLinkManager]]**: Configuration dashboard for bridging local WASM Brains with cloud LLM providers.
- **[[79 VideoBackgroundRemoval]]**: Client-side video utility using boundary-aware flood fill on Canvas for transparent WebM export.
- [[81 IQGame]]: Working memory training engine implementing adaptive Dual N-Back cognitive logic.
- [[105 DatacoreNosisUI]]: Immersive multi-cluster management dashboard for Hytale and Kubernetes, featuring **Modular Orchestration** and **MCP Service Bridging**.
- [[106 HytaleManager]]: Specialized game server administration suite with support for **Lock-Free Hybrid Scripting** and **Real-Time Log Caching**.
- [[106 JavaDecompiler]]: High-fidelity JAR decompilation utility utilizing the **CFR Engine** and providing an interactive class-tree explorer.
- [[107 AiAgentsSwams]]: Advanced canvas-based agent orchestration interface implementing the **Safe Recovery Pattern** and **Detached Test Engine**. **(PROJECT BOILERPLATE)**
- [[110 UniversalStorageShowcase]]: Comprehensive demonstration of hybrid storage strategies, including **SQLite WASM**, **SecretStorage**, and **Native FS Bridges**.
- [[WebsiteBuilder/DatacoreShim/Registry]]: Core infrastructure for the Hybrid Next.js bridge.

## Visualizers & Simulations
- [[13 Aquarium]]: High-performance "proportional sandbox" for entity animations. Features hardware-accelerated movement and aspect-ratio resilient bounds logic.
- [[6 CustomIframeBuilder]]: UI tool for calculating optimal `scale`, `width`, and `crop` offsets for embedding social media URLs. Exports configuration as JSON.

## Design Patterns
### Marker-Based Splitting
Many components (Kanban, CustomFeed, ContentExplorer) use a standard marker to denote the start of data:
- `#### AENIGMAS` or `##### AENIGMAS`
- Segments are typically separated by `---` (3 or more dashes).

### Naming Conventions
- **.namzu.md**: Files defining navigation hierarchies (headers).
- **.enigmas..md**: Files containing the actual content segments for feeds/kanban.
- **_RESOURCES/temp**: Standard directory for temporary development artifacts.
