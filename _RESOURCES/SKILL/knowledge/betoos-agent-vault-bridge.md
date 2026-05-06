# BetoOS Agent Architecture (Expert Patterns)

This document codifies the high-performance patterns developed for the BetoOS ERP and related Datacore components. Use these strategies to resolve indexing lag, enable interactive debugging, and execute shell commands within the Obsidian/Datacore runtime.

## 1. The SafeAgent (Interactive Bridge)

**Problem**: Datacore components can become hard to debug if they crash or if the agent needs to "remote control" the UI without full DOM access.

**Solution**: Use a `setInterval` file-poller inside the React lifecycle to watch for a command JSON file in the vault.

### Implementation Pattern (src/index.jsx)
```javascript
function useSafeAgent(data) {
    useEffect(() => {
        const cmdFile = folderPath + "/erp_commands.json";
        const timer = setInterval(async () => {
            const adapter = dc.app.vault.adapter;
            if (!(await adapter.exists(cmdFile))) return;
            const content = await adapter.read(cmdFile);
            const cmd = JSON.parse(content);
            if (cmd && cmd.executed === false) {
                // Execute Action (audit_schema, reload, screenshot)
                cmd.executed = true;
                await adapter.write(cmdFile, JSON.stringify(cmd, null, 2));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [data]);
}
```

## 2. Deep Enrichment Loop (The 100% Fidelity Strategy)

**Problem**: The Datacore `dc.useQuery` index sometimes lags behind physical file updates or omits specific frontmatter keys (like financial data or custom counts).

**Solution**: Use Datacore for **Discovery** (finding the files) but use the **Vault API** for **Enrichment** (reading the physical file content).

### Implementation Pattern (src/erp_main.jsx)
```javascript
useEffect(() => {
    const enrich = async () => {
        const results = [];
        for (const r of rawHits) {
            const file = dc.app.vault.getAbstractFileByPath(r.$path);
            const fm = dc.app.metadataCache.getFileCache(file)?.frontmatter || {};
            // If cache is stale, read directly:
            if (!fm.target_key) {
                const txt = await dc.app.vault.read(file);
                // Regex-parse frontmatter...
            }
            results.push({ path: r.$path, value: fm });
        }
    };
    enrich();
}, [rawHits.length]);
```

## 3. CLIBridge (Shell Integration)

**Problem**: Certain vault operations (like property counts, complex searches, or external script execution) are more robust via the `obsidian` CLI or standard shell commands.

**Solution**: Spawn a `zsh -l -c` process to execute commands. Ensure the PATH includes standard macOS application directories.

### Implementation Pattern
```javascript
var CLI = {
    execute: function(command) {
        return new Promise((resolve) => {
            const spawn = require('child_process').spawn;
            const env = Object.assign({}, process.env, { 
                PATH: "/Applications/Obsidian.app/Contents/MacOS:" + process.env.PATH 
            });
            const child = spawn('/bin/zsh', ['-l', '-c', command], { env });
            // Handle output streams...
        });
    }
};
```

## 4. Federated Data Schemas (Aggregation)

When aggregating data from multiple files, use a `getVal(obj, key)` utility that checks for:
- `obj.value[key]` (Datacore standard)
- `obj[key]` (Flattened index)
- `obj.fm[key]` (Manual enrichment)

This ensures schema-agnostic resilience across different Datacore versions.
