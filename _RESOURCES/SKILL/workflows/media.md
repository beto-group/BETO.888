---
description: Media Conversion Workflow (v1.8.7)
---

This workflow defines the standard procedure for converting visual assets into BetoOS-optimized formats (WEBP/WEBM).

// turbo
1. **Initiate Media Conversion**
Execute the conversion command via the obsidian eval bridge:
```zsh
obsidian eval code="window.CliLab.execute('media', '{\"path\": \"SOURCE_PATH\", \"targetPath\": \"TARGET_PATH\"}')"
```

2. **Monitor Telemetry**
Wait for the Datacore UI to report "COMPLETED".

3. **Nuclear Verification**
Verify the output size across the Triple-Zone Delivery path (Desktop, Sibling, Vault).
Expected Size format: `Size: [X.X]M`

4. **Vault Integration**
Move the finalized assets into the component's `_resources/` folder and update the markdown documentation.

---
*Beto Group LLC | Operations Standardized.*
