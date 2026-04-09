---
description: How to bridge Telegram messages to LiveSync Cluster Hub actions
---

# Telegram LiveSync Bridge Workflow

This workflow enables an agent to act as a bridge between Telegram and the LiveSync Cluster Hub.

### 1. Preparation
- Ensure `telegram-mcp` is available and configured.
- Ensure the **LiveSync Cluster Hub** is open in Obsidian.

### 2. Command Mapping
Map incoming Telegram messages to the following `mcp_commands.json` structure:

| Telegram Command | Action | Payload |
| :--- | :--- | :--- |
| `/status` | `refresh` | `{}` |
| `/scale up` | `scale` | `{"replicas": 1}` |
| `/scale down` | `scale` | `{"replicas": 0}` |
| `/sync toggle <path>` | `sync_toggle` | `{"path": "<path>"}` |
| `/ping` | `ping` | `{}` |

### 3. Execution (The Bridge Loop)
The agent should follow these steps when a message is received:

1. **Identify the Command**: Parse the message text.
2. **Write Command File**:
   - Locate the hub data directory: `/Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/_RESOURCES/DATACORE/130_LiveSync_Cluster_Hub/_resources/data/`
   - Write (overwrite) `mcp_commands.json`:
     ```json
     {
       "action": "<action>",
       "payload": <payload>,
       "executed": false
     }
     ```
3. **Poll for Result**:
   - Wait up to 10 seconds, polling `mcp_commands.json` every 2 seconds.
   - Wait for `executed: true`.
4. **Respond to Telegram**:
   - Once executed, read the `result` from `mcp_commands.json`.
   - Optionally read `mcp_state.json` to provide a full status update.
   - Reply to the Telegram user with the outcome.

### 4. Continuous Monitoring (Optional)
If tasked with "monitoring", the agent should:
- Periodically check `mcp_state.json`.
- If `hytale` or `couch` status changes to `OFFLINE`, alert the Telegram channel.
