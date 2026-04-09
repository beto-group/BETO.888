# 🧠 Agent Methodology: The Beto Group Standard (v1.0)
// turbo-all

## 1. Core Directives
- **Zero-Fragment Policy**: No `src/components`, `src/styles`, or `src/utils`. All logic MUST live in a single consolidated `.jsx` file.
- **Deep Immersion Standard**: Use `FullTab` reparenting to bypass Obsidian workspace padding and headers.
- **Sterile Brutalism**: Monochromatic, high-density, OKLCH/HSL-based UI. No generic CSS.
- **CLI-First Verification**: Use `obsidian eval` and `obsidian dev:console` for all validation.

## 2. Mandatory Rules

- Rule #1: **Project Awareness**. Always check `_RESOURCES/SKILL/SKILL.md` before starting.
- Rule #2: **Consolidated Master Protocol**. All production components must be single-file. Fragmented sub-directories are BANNED.
- Rule #3: **Query Sanitization**. Metadata queries MUST NOT use the `@` prefix for standard fields (e.g., use `type` not `@type`).
- Rule #4: **Zero Placeholder Policy**. Generate real assets/images via `generate_image`.
- Rule #5: **Automated Publishing**. Use auto-incrementing versions in `manifest.json`.
- Rule #6: **Immersion Standard**. Use `FullTab` DOM reparenting.
- Rule #7: **Consolidated Master Protocol**. (Duplicate for emphasis) All production components MUST be consolidated into a single `.jsx` entry point.
- Rule #8: **Namespace Safety**. NEVER use single-letter variables `h`, `dc`, `d`, or `x` in loop callbacks (e.g., `map((m_msg, i) => ...)`). These are reserved for internal hyperscript and global APIs.
- Rule #9: **Hook Component Protocol**. Datacore functional components MUST be invoked via JSX syntax `<Component />`, never by direct function call.
- Rule #10: **MCP Autonomy Standard**. All components MUST implement the **Safe Agent** recovery framework (Boilerplate 66.6). This includes an inline JS agent polling `mcp_commands.json` to allow for autonomous AI-driven testing and remote UI recovery.
- Rule #11: **Proxy-Aware Naming**. When using `v1internal` synthesis, always use the full-path resource names (e.g., `publishers/google/models/...`) obtained via discovery to bypass version-lock rejections.
- Rule #12: **GitHub-Compatible Linking Standard**. All internal links (showcase or media) MUST use relative paths (e.g., `Folder/%20Name/src/index.jsx`) and URL-encoded spaces (`%20`). Absolute vault root prefixes (e.g., `_RESOURCES/DATACORE/`) are BANNED. Functional components must use the `{index.jsx}` suffix in the link text.
- Rule #13: **Relative Path Recovery & Portability**. All Datacore components MUST implement 'Zero-Hardcode' pathing. In viewer scripts, use `dc.resolvePath("./src/index.jsx")` as an anchor to dynamically derive the base directory. Vault-absolute strings (e.g., `_RESOURCES/DATACORE/Folder Name/...`) are BANNED to ensure portability across different vault roots and folder names.
- Rule #14: **Sterile Brutalism Documentation Layout**. All component documentation MUST follow the strict structural sequence: `YAML Metadata ➔ Title ➔ Description ➔ Does ➔ Can't ➔ ------ ➔ Media ➔ Components`. The `### Media` header is strictly **BANNED**; use a horizontal rule `------` as the separator between content and media.
- Rule #15: **DQL Parser Guard**. To ensure universal component portability and prevent environment-specific parsing failures, all `useQuery` calls MUST prefer simple base-type queries (e.g., `@page`, `@task`, `@file`). Complex logical operations (sorting, limiting, advanced filtering) MUST be performed within a JavaScript `useMemo` layer rather than the DQL string.
- Rule #16: **Session Harness Protocol (Claw-Parity)**. All high-fidelity agents MUST utilize the `_RESOURCES/SKILL/memory/sessions/` structured directory for persistent state rehydration. Sessions MUST follow the `.jsonl` (JSON Lines) format for atomic message persistence, including a `session_meta` record and append-only `message` blocks.
- Rule #17: **Hierarchical Config Resolution**. Runtime settings MUST be loaded using the authoritative precedence chain: `Global (User Home)` ➔ `Vault Root (_RESOURCES/SKILL/settings.json)` ➔ `Local Override (_RESOURCES/SKILL/settings.local.json)`. Bypassing this chain is strictly BANNED for production-grade components.
- Rule #18: **Skills-to-Workflows Standard**. All new skills, procedures, and institutional protocols MUST be added to the `_RESOURCES/SKILL/workflows/` directory. Standalone folders at the SKILL root are strictly **BANNED** to maintain structural sterility.

## 3. MCP Testing Protocol (v1.1)

To enable autonomous testing, the developer agent MUST:
1.  **Inject Command Channel**: Ensure the component root contains a `Safe Agent` polling loop.
2.  **Autonomous Recovery**: Use `mcp_commands.json` to trigger `reload` or `test_run` events during development.
3.  **Vault-Aware Synthesis**: Pass MCP tool definitions (`read_note`, `list_files`) to the local WASM brain to allow the Hub to reason over the vault itself.

---
## 4. Specialized Skills & Handover
- **Media Processing**: See `_RESOURCES/SKILL/workflows/media_converter/SKILL.md` for conversion and Triple-Zone Delivery standards.
- **Showcase Release**: See `_RESOURCES/SKILL/workflows/release/release.md` for standardization and component publishing requirements.

---
*Beto Group LLC | Lead Architect Agent Standard*
