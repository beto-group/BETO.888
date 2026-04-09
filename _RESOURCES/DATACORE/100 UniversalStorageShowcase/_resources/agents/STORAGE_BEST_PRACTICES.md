# Storage Best Practices for Agents

This guide outlines the recommended storage strategies for agents and components within the Obsidian/Datacore environment.

## 1. Filesystem (Native & Vault)

| Method | Best Use Case | pros | Cons |
| --- | --- | --- | --- |
| **Vault API** | Markdown notes, user-editable data | Safe, observable, triggers indexing | Slower for massive binary data |
| **Native FS** | External scripts, Large binaries, temp files | Extremely fast, bypasses Obsidian abstraction | Bypasses indexing, risk of path issues |

> [!TIP]
> Always use `vault.adapter` when possible to ensure your changes are reflected in the Obsidian UI and search index.

## 2. Databases

### SQLite (WASM)
- **Best for**: Complex relational data, large datasets (>10k rows).
- **Practice**: Always export the database to a `.db` file in the vault to ensure persistence across sessions.
- **Limit**: Requires loading `sql.js` (large binary).

### IndexedDB
- **Best for**: Performance-critical application state, UI settings.
- **Practice**: Use for "NoSQL" key-value patterns that don't need to be human-readable.

### Metadata Cache
- **Best for**: Reading properties, links, and tags of *existing* notes.
- **Practice**: Treat as Read-Only. If you need to update it, update the `.md` file.

## 3. Web Storage

### LocalStorage
- **Best for**: Simple UI toggles, last-tab state.
- **Limit**: Limited to ~5MB. Not shared across devices unless using LiveSync.

### Cookies
- **Status**: **NOT RECOMMENDED**.
- **Issue**: Restricted on `file://` protocols. Use LocalStorage instead.

## 4. Security

### SecretStorage (OS Keychain)
- **Best for**: API Keys, Passwords, Auth Tokens.
- **Validation**: Keys must be **lowercase letters, numbers, and dashes** only. No underscores!
- **Note**: This data is stored in the OS Keychain (e.g., Apple Keychain), making it invisible to standard backups.

## 5. Sync

### Git
- **Best for**: Collaboration and version history of the "data" folder.
- **Practice**: Use `git add` and `git commit` for specific data milestones.
