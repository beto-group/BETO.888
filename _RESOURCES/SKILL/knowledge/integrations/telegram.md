# Telegram Integration & MCP Best Practices

## 1. Telegram Bot Mode (gramjs)
To integrate Telegram Bots directly into a Datacore component without a backend server:
- Use `gramjs` (npm: `telegram`) which supports MTProto.
- Authenticate using `API_ID`, `API_HASH`, and `BOT_TOKEN`.
- **Method**: Use `client.start({ botAuthToken: token })` or equivalent custom auth flow.
- **Session**: Store session strings securely or use file-based sessions if local IO is permitted.

## 2. Secure Storage (Keychain)
Obsidian provides a secure way to store credentials.
- **API**: Use `dc.app.secretStorage` directly.
- **Methods**: `setSecret(key, value)` and `getSecret(key)`.
- **Naming Convention**: Always prefix keys with `dc-` (e.g., `dc-telegram-creds`) to avoid conflicts and ensure proper scoping.
- **Handling**: Always stringify JSON payloads before saving.

## 3. Communication Bridge (Main App <-> Popup Window)
When building detached windows (Electron `BrowserWindow`):
- **Path Mismatch**: The detached window uses **Absolute Paths** (e.g., `/Volumes/...`). The Main App (Obsidian) usually uses **Relative Paths** via `app.vault.adapter`.
- **The Fix**: In the Main App (MCPBridge), verify the path type before writing.
  - If reading from `fs` worked (absolute path), write back using `fs`.
  - **CRITICAL**: If the path is relative or `fs` fails, **ALWAYS** fallback to `dc.app.vault.adapter.write()`. Using `fs.writeFileSync` with a relative path writes to the Electron App Bundle (CWD), not the Vault, causing silent sync failures.
- **Pattern**: Polling a shared JSON file (`_resources/mcp/mcp_commands.json`) is a robust way to communicate.

## 4. LocalStorage in Detached Windows
- **Restriction**: Modern Electron implementations block `localStorage` access in `data:` URIs (`data:text/html,...`).
- **Impact**: Libraries like `gramjs`/TelegramClient **will fail to connect** because they rely on storage.
- **Solution**: 
  1. Generate your HTML string.
  2. Write it to a temporary file (e.g., `dashboard.html`).
  3. Load it via `win.loadFile(path)` to get a `file://` origin.
  ```javascript
  const fs = require('fs');
  const tempPath = path.join(props.folderPath, 'temp.html');
  fs.writeFileSync(tempPath, html);
  win.loadFile(tempPath); // Grants storage access
  ```

## 5. Safe Agent & Command Interception
- **Risk**: The "Safe Agent" loop (in `index.jsx`) designed to handle crashes often polls the same `mcp_commands.json` file.
- **Bug**: If the Safe Agent indiscriminately marks all commands as `executed: true` (to clear the queue), it will "eat" commands intended for the main logic (e.g., `save_creds`).
- **Fix**: **Allowlist** only specific recovery commands in the Safe Agent.
  ```javascript
  const SAFE_ACTIONS = ['reload', 'open_settings'];
  if (SAFE_ACTIONS.includes(cmd.action)) { ...mark executed... }
  ```

## 6. Browser Bundle (Webpack) - CRITICAL
The standard `gramjs` npm package **does not work** in Datacore/Browser environments out of the box due to Node.js dependencies (`fs`, `net`, `crypto`).
- **Solution**: You MUST build a **single-file browser bundle** using `webpack`.
- **Config**: 
    - Use `resolve.fallback` to polyfill `path`, `os`, `crypto`, `stream`, `buffer`, `util`, `assert`, `constants`.
    - Use `webpack.ProvidePlugin` to inject `process` and `Buffer`.
    - Set `fs`, `net`, `tls`, `child_process` to `false`.
- **Loading**: Use the `Vault` adapter to read the bundle and inject it via a `<script>` tag.
- **Cache Busting**: If you update the bundle or loader, **rename the loader file** (e.g., `telegramClient_v2.js` -> `_v3.js`) to force the browser to drop the cached version.

## 7. Tabs in Detached Windows
Inline event handlers in HTML strings (e.g., `onclick="showTab('tab')"`) fail in detached Electron windows due to scope isolation.
- **Fix**: Attach functions explicitly to `window` in your injected script **at the very top**.
    ```javascript
    window.showTab = function(tab, btn) { ... }
    ```
- **Usage**:
    ```html
    <button onclick="window.showTab('activity', this)">Activity</button>
    ```
- **Error Handling**: Add `window.onerror` at the top of your injected script to catch and alert crashes that would otherwise be silent.

## 8. Connection Loop Prevention (v3)
When using self-reloading agents or detached windows, always check the current connection status from `_resources/mcp/mcp_state.json` before calling `connect()`.
- **Pattern**: 
    1. Read state file.
    2. If `telegram.status === 'online'`, skip connection and just sync the feed.
    3. Only trigger `startTgLogin()` if explicitly offline or requested by the user.
- **Safe Disconnect**: Always implement a `disconnect()` method that calls `client.disconnect()` and clears internal references to allow clean state transitions.
 
## 9. Two-Way MCP Integration (telegram-mcp)
While the "Bot Mode" (above) is isolated to a single Datacore project, the **MCP User Mode** enables global interaction with the Antigravity agent chat.
- **Tool**: `telegram-mcp` (Global Node.js server).
- **Feature**: Authenticates as a **Human User** (User Mode) rather than a bot.
- **Auth Flow**: Run `telegram-mcp auth` via the System Terminal. It requires a phone number, OTP, and 2FA password.
- **Config**: The server is wired into the master `mcp_config.json` at `~/.gemini/antigravity/mcp_config.json`.
- **Capability**: This mode allows the agent to read your human chats, respond to messages, and maintain a two-way sync that "Bots" cannot typically access due to Telegram's privacy restrictions.
    - **Tools Exposed**: `read_telegram_chats`, `send_telegram_message`, `get_telegram_contact`, etc.
- **Architecture**:
    - **Local Bridge**: `mcp_commands.json` (Obsidian-specific actions).
    - **Global MCP**: `telegram-mcp` (Account-level communication).

