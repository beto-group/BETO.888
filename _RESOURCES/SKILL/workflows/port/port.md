---
description: Port an external GitHub repository into a Datacore component using the internal vault scratchpad.
---

# /port - Safe GitHub Repository Porter

// turbo-all
Use this workflow to ingest external logic from GitHub into the Datacore environment via the internal `_TMP` folder.

## 1. Retrieval Phase
1. **Internal Clone**: `git clone --depth 1 [REPO_URL] /Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/_RESOURCES/DATACORE/_TMP/datacore_port_temp`
2. **Deep Survey**: Run `find /Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/_RESOURCES/DATACORE/_TMP/datacore_port_temp -maxdepth 2 -not -path '*/.*'` to map the engine's core.
3. **Targeted Extraction**: Identify "soul" files (e.g., `physics.js`, `engine.ts`) for code extraction.

## 2. Implementation Phase
1. **Transpile**: Convert source logic to Datacore-compatible IIFE/Factory patterns.
2. **Vault Write**: Save final `.jsx` and `.md` files directly to `_RESOURCES/DATACORE/[NEW_COMP]`.
3. **AI Verification**: Follow the **AI Verification Protocol** (see [[_RESOURCES/SKILL/workflows/new]]) to ensure the ported component is "Impeccable".

## 3. Mandatory Cleanup (WAIT FOR USER)
**CRITICAL**: Do NOT delete the temporary clone until the user confirms the reproduction is successful.

1. **Wait**: The agent must ask: "Reproduction complete. Is it safe to delete the temporary clone?"
2. **Wipe**: Once approved, run `rm -rf /Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/_RESOURCES/DATACORE/_TMP/datacore_port_temp`.
3. **Hygiene Check**: Ensure no residual artifacts remain in the `_TMP` directory.
