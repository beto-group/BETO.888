/**
 * storageUtils.js
 * Handles persistence for KM CLI tool.
 * folderPath is vault-relative (e.g. "_RESOURCES/DATACORE/93 KeyboardMaestroCLI")
 * We resolve it to an absolute path using dc.app.vault.adapter.getBasePath().
 */

function getAbsolutePath(folderPath) {
    try {
        const vaultRoot = dc.app.vault.adapter.getBasePath();
        return vaultRoot + '/' + folderPath + '/_resources/config.json';
    } catch (e) {
        console.error("[KM-CLI] Could not resolve vault base path:", e);
        return null;
    }
}

async function loadConfig(folderPath) {
    const configPath = getAbsolutePath(folderPath);
    if (!configPath) return { favorites: [] };

    try {
        const fs = require('fs');
        console.log("[KM-CLI] Loading config from:", configPath);
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const parsed = JSON.parse(data);
            console.log("[KM-CLI] Loaded", parsed.favorites?.length ?? 0, "favorites");
            return parsed;
        } else {
            console.warn("[KM-CLI] config.json not found at:", configPath);
        }
    } catch (error) {
        console.error("[KM-CLI] Failed to load config:", error);
    }
    return { favorites: [] };
}

async function saveConfig(folderPath, config) {
    const configPath = getAbsolutePath(folderPath);
    if (!configPath) return { success: false, error: "Could not resolve config path" };

    try {
        const fs = require('fs');
        const jsonStr = JSON.stringify(config, null, 2);
        fs.writeFileSync(configPath, jsonStr, 'utf8');
        console.log("[KM-CLI] Config saved.");
        return { success: true };
    } catch (error) {
        console.error("[KM-CLI] Failed to save config:", error);
        return { success: false, error: error.message };
    }
}

return { loadConfig, saveConfig };
