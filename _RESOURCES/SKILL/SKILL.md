# 🧠 Agent Methodology: The Beto Group Standard (v1.0)
// turbo-all

## 1. Core Directives
- **The 500-Line Threshold**: Components under 500 lines MUST be consolidated into a single `.jsx` file. Over 500 lines MUST use the modular `src/` directory structure.
- **Deep Immersion Standard**: Use `FullTab` reparenting to bypass Obsidian workspace padding and headers.
- **Sterile Brutalism**: Monochromatic, high-density, OKLCH/HSL-based UI. No generic CSS.
- **CLI-First Verification**: Use `obsidian eval` and `obsidian dev:console` for all validation. This utilizes the **Obsidian CDP (Chrome DevTools Protocol)** bridge for real-time renderer inspection.
- **Root Access Security Protocol**: The capabilities provided by this system are HIGHLY DANGEROUS. Because complete access to the root OS is possible, EVERY AI action, workflow execution, or code generation MUST be evaluated with strict safety consideration to prevent destructive consequences.

## 2. Mandatory Rules

- Rule #1: **Project Awareness**. Always check `_RESOURCES/SKILL/SKILL.md` before starting.
- Rule #2: **Elite Modularity Standard**. Components under 500 lines MUST be consolidated. Over 500 lines MUST use a modular `src/` directory structure. Fragmented sub-directories are BANNED for simple projects.
- Rule #3: **Query Sanitization**. Metadata queries MUST NOT use the `@` prefix for standard fields (e.g., use `type` not `@type`).
- Rule #4: **Zero Placeholder Policy**. Generate real assets/images via `generate_image`.
- Rule #5: **Automated Publishing**. Use auto-incrementing versions in `manifest.json`.
- Rule #6: **Immersion Standard**. Use `FullTab` DOM reparenting.
- Rule #7: **Elite Architecture Protocol**. Follow the modular `src/` pattern for advanced components (>500 lines) to ensure scalability and agent-readability.
- Rule #8: **Namespace Safety**. NEVER use single-letter variables `h`, `dc`, `d`, or `x` in loop callbacks (e.g., `map((m_msg, i) => ...)`). These are reserved for internal hyperscript and global APIs.
- Rule #9: **Hook Component Protocol**. Datacore functional components MUST be invoked via JSX syntax `<Component />`, never by direct function call.
- Rule #10: **MCP Autonomy Standard**. All components MUST implement the **Safe Agent** recovery framework using the [Beto Master Template v5.0](./templates/index.jsx.template). This includes a mandatory inline command loop polling `mcp_commands.json` to allow for autonomous AI-driven testing, remote UI recovery, and tactical snapshots.
- Rule #11: **Proxy-Aware Naming**. When using `v1internal` synthesis, always use the full-path resource names (e.g., `publishers/google/models/...`) obtained via discovery to bypass version-lock rejections.
- Rule #12: **GitHub-Compatible Linking Standard**. All internal links (showcase or media) MUST use relative paths (e.g., `Folder/%20Name/src/index.jsx`) and URL-encoded spaces (`%20`). Absolute vault root prefixes (e.g., `_RESOURCES/DATACORE/`) are BANNED. Functional components must use the `{index.jsx}` suffix in the link text.
- Rule #13: **Zero-Hardcode & Absolute Path Ban**. All Datacore components MUST implement 'Zero-Hardcode' pathing. Vault-absolute strings (e.g., `/Volumes/...` or `C:\...`) are BANNED AT ALL COSTS to ensure 100% portability. In viewer scripts, use `dc.resolvePath()` or relative adapter calls. For cross-process IPC, paths must be dynamically derived from the environment at runtime, never hardcoded into source or generated assets.
- Rule #14: **Agent Knowledge Persistence**. Every component MUST have a corresponding knowledge/handover file in `_RESOURCES/agents`. This file must act as a logic-discovery archive, storing coordinate systems (for UI elements), state patterns, and design tokens. This is mandatory for preserving performance and development speeds across asynchronous agent sessions.
- Rule #15: **Total Folder Self-Containment**. All project-specific logic, components, and assets MUST be contained within the project's own directory.
- Rule #16: **The Beto Foundation Naming**. Every component directory MUST contain a primary entry-point Markdown file named in ALL-CAPS (e.g., `CONTENT SORTER 888.md` inside the `ContentSorter888/` folder). This prevents fuzzy-pathing collisions and provides a clear, distinct UI launchpad.
- Rule #17: **Guided Chain-of-Thought Protocol (Claude-Derived)**. Before generating any substantial architecture, component, or file, the agent MUST use an `<AgentThinking>` XML block to reason about the implementation, evaluate edge cases, and plan the structure. This forces execution planning before token generation.
- Rule #18: **Artifact Strictness (Claude-Derived)**. Agents must strictly categorize output: Substantial, self-contained, or reusable code (>15 lines) MUST be packaged as a standalone component/artifact. Brief snippets, simple explanations, or ephemeral code should remain in the chat to prevent workspace clutter. Use XML tags (e.g., `<ComponentState>`) to clearly delineate boundaries.
- Rule #19: **DQL Parser Guard**. To ensure universal component portability and prevent environment-specific parsing failures, all `useQuery` calls MUST prefer simple base-type queries (e.g., `@page`, `@task`, `@file`). Complex logical operations (sorting, limiting, advanced filtering) MUST be performed within a JavaScript `useMemo` layer rather than the DQL string.
- Rule #20: **Session Harness Protocol (Claw-Parity)**. All high-fidelity agents MUST utilize the `_RESOURCES/SKILL/memory/sessions/` structured directory for persistent state rehydration. Sessions MUST follow the `.jsonl` (JSON Lines) format for atomic message persistence, including a `session_meta` record and append-only `message` blocks.
- Rule #21: **Hierarchical Config Resolution**. Runtime settings MUST be loaded using the authoritative precedence chain: `Global (User Home)` ➔ `Vault Root (_RESOURCES/SKILL/settings.json)` ➔ `Local Override (_RESOURCES/SKILL/settings.local.json)`. Bypassing this chain is strictly BANNED for production-grade components.
- Rule #22: **Skills-to-Workflows Standard**. All new skills, procedures, and institutional protocols MUST be added to the `_RESOURCES/SKILL/workflows/` directory. Standalone folders at the SKILL root are strictly **BANNED** to maintain structural sterility.
- Rule #23: **Intent-to-Workflow Mapping**. Agents MUST automatically map user intent to specific workflows:
    - New Feature/Logic ➔ `engineering/spec-driven-development` ➔ `engineering/planning-and-task-breakdown`
    - Implementation ➔ `engineering/incremental-implementation` + `engineering/test-driven-development`
    - Bugs/Failures ➔ `engineering/debugging-and-error-recovery`
    - Code Review ➔ `engineering/code-review-and-quality`
    - Optimization ➔ `engineering/performance-optimization`
- Rule #24: **The Elite Production Lifecycle**. Every non-trivial change MUST follow the lifecycle: **DEFINE** (Spec) ➔ **PLAN** (Tasks) ➔ **BUILD** (Code/Test) ➔ **VERIFY** (Triage) ➔ **REVIEW** (Audit) ➔ **SHIP** (Release). Skipping the DEFINE/PLAN phases for "quick fixes" is a violation of the Elite Standard.

## 3. MCP Testing Protocol (v1.1)

To enable autonomous testing, the developer agent MUST:
1.  **Inject Command Channel**: Ensure the component root contains a `Safe Agent` polling loop.
2.  **Autonomous Recovery**: Use `mcp_commands.json` to trigger `reload` or `test_run` events during development.
3.  **Vault-Aware Synthesis**: Pass MCP tool definitions (`read_note`, `list_files`) to the local WASM brain to allow the Hub to reason over the vault itself.

---
## 4. Specialized Skills & Handover
- **Media Processing**: See `_RESOURCES/SKILL/workflows/media_converter/SKILL.md` for conversion and Triple-Zone Delivery standards.
- **Cinematic Framing**: See `_RESOURCES/docs/SYSTEM CUSTOMIZATION.md` for the **Live Framing Studio** architecture and the **Isolated Framing Wrapper** standard (Decoupled Zoom & Position).
- **BRAT Deployment**: See [`_RESOURCES/SKILL/D.q.deploy.brat.md`](./D.q.deploy.brat.md) for the Hardened Handshake Standard.
- **React Synchronization**: See [`_RESOURCES/SKILL/D.q.react.host.sync.md`](./D.q.react.host.sync.md) for Global Identity Hijack and #525 resolution.
- **UI & Dashboard Stability**: See [`_RESOURCES/SKILL/interface/D.q.ui.dashboard.stability.md`](./interface/D.q.ui.dashboard.stability.md) for No-Push layout and internal scrolling.
- **Modular Path Resolution**: See [`_RESOURCES/SKILL/knowledge/architecture/modular-path-resolution.md`](./knowledge/architecture/modular-path-resolution.md) for Elite Pathing Standards and dc.resolvePath compliance.
- **Showcase Release**: See `_RESOURCES/SKILL/workflows/release/release.md` for standardization and component publishing requirements.
- **Obsidian Verification Engine**: See [`_RESOURCES/SKILL/knowledge/architecture/obsidian-verification-engine.md`](./knowledge/architecture/obsidian-verification-engine.md) for CLI & CDP integration standards.

---
## 5. Elite Engineering Workflows (Production-Grade)
These workflows encode the engineering judgment of senior staff architects. They provide structured steps, verification gates, and anti-rationalization checks for the entire development lifecycle.

- **Define (Specs)**: [`engineering/spec-driven-development`](./workflows/engineering/spec-driven-development/SKILL.md), [`engineering/idea-refine`](./workflows/engineering/idea-refine/SKILL.md)
- **Plan (Architecture)**: [`engineering/planning-and-task-breakdown`](./workflows/engineering/planning-and-task-breakdown/SKILL.md)
- **Build (Implementation)**: [`engineering/incremental-implementation`](./workflows/engineering/incremental-implementation/SKILL.md), [`engineering/test-driven-development`](./workflows/engineering/test-driven-development/SKILL.md), [`engineering/source-driven-development`](./workflows/engineering/source-driven-development/SKILL.md)
- **Verify (QA)**: [`engineering/browser-testing-with-devtools`](./workflows/engineering/browser-testing-with-devtools/SKILL.md), [`engineering/debugging-and-error-recovery`](./workflows/engineering/debugging-and-error-recovery/SKILL.md)
- **Review (Audit)**: [`engineering/code-review-and-quality`](./workflows/engineering/code-review-and-quality/SKILL.md), [`engineering/security-and-hardening`](./workflows/engineering/security-and-hardening/SKILL.md), [`engineering/code-simplification`](./workflows/engineering/code-simplification/SKILL.md)
- **Ship (Delivery)**: [`engineering/shipping-and-launch`](./workflows/engineering/shipping-and-launch/SKILL.md), [`engineering/git-workflow-and-versioning`](./workflows/engineering/git-workflow-and-versioning/SKILL.md)

---
*Beto Group LLC | Lead Architect Agent Standard*
