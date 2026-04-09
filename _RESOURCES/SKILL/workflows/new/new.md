---
description: Create a new high-performance Datacore component with premium aesthetics and robust architecture.
---

# /new - Datacore Component Generator

// turbo-all
Use this workflow to generate a premium Datacore component following the Beto High-Fidelity standards.

## 1. Directory Structure
Create a new folder in `_RESOURCES/DATACORE/` with the format: `XXX_Name` (Avoid spaces for path reliability).
- `src/index.jsx` (Use [index.jsx.template](../templates/index.jsx.template))
  - **CRITICAL:** ALL logic (Main component, MCP Bridge, Styles, FullTab) MUST be strictly consolidated into this single `index.jsx` file. Do NOT create multiple `.jsx` files or you will cause ES `import` failures.
- **`deployment/install.sh`** (Optional: Environment bootstrap/setup)
- **`deployment/manifests/`** (Optional: Infrastructure manifests for cloud/local peers)
- `D.q.[name].viewer.md` (Standardized Entry Point)

## 2. Core Prompting Rules
**[CRITICAL STEP]**: Before writing a single line of CSS or UI logic, you MUST read `_RESOURCES/SKILL/knowledge/design-bible/index.md` (The Front End Manifesto). Failure to pass the "AI Slop Test" is unacceptable.

When building the logic, ensure the following are included by default:
- **Aesthetic**: Follow your chosen bold aesthetic direction from the Design Bible. Use OKLCH colors, fluid typography (clamp), and intentional asymmetry. Do not use generic AI palettes.
- **Architecture**: Always use the **Safe Agent Layer** in `index.jsx` to prevent rendering lockups.
- **Verification**: Built-in "MCP Bridge" to allow AI self-verification via `mcp_state.json`.
- **FullTab**: All components must use **DOM Reparenting** (`FullTab.jsx`) by default to ensure a "Nuclear" edge-to-edge experience, bypassing all Obsidian margins and titles.
- **Syntax Warning**: When writing `MainComponent.jsx`, be extremely careful NOT to double-escape template literals.
- **Backtick Warning [NEW]**: When writing `D.q.[name].viewer.md`, **NEVER** use escaped backticks (e.g. `\`\`\``). Use raw backticks only. Escaped backticks will break the Datacore renderer.

## 3. Entry Point Standard (D.q.[name].viewer.md)
The viewer MUST include two blank lines at the top and use the async factory pattern wrapped in a `datacorejsx` block:

````markdown


```datacorejsx
const activeFile = dc.resolvePath("D.q.[name].viewer") || "_RESOURCES/DATACORE/XXX_Name/D.q.[name].viewer";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```
````

## 4. AI Verification Protocol (MANDATORY)
1. **Deploy**: Write files to the target directory.
2. **Open**: `obsidian open path="_RESOURCES/DATACORE/XXX_Name/D.q.[name].viewer.md"`
3. **Verify Heartbeat**: Check `_resources/data/mcp_state.json` exists and shows `status: active`.
4. **Visual Audit (Native CLI)**: 
   - Ensure target folder exists: `mkdir -p _RESOURCES/images/dev`
   - Capture high-res screenshot: `obsidian dev:screenshot path="_RESOURCES/images/dev/[name]_final.png"`
   - **Immersive Audit**: Verify the dashboard touches every pixel of the boundary. **Zero margins** allowed. No Markdown titles visible.
5. **Console Check**: Run `obsidian dev:errors` to ensure no active "Critical Load Error".
61.  **Verification Phase**: Run `obsidian dev:screenshot` and check `mcp_state.json`.
2.  **Termination Protocol**: Run the **[[_RESOURCES/SKILL/workflows/terminate]]** workflow to validate lints and documentation.
3.  **Knowledge Harvest**: Run the **[[_RESOURCES/SKILL/workflows/harvest]]** workflow to capture new architectural patterns or insights.
4.  **Handoff**: Present results with a `walkthrough.md` link and screenshots.
If any step fails, fix and repeat. The task is only "COMPLETED" after a successful `/terminate` run.
