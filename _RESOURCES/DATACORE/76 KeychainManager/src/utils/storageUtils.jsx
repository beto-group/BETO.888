/**
 * Utility to manage the Sidecar Registry (JSON file)
 */

async function getRegistryPath(folderPath) {
    return folderPath + "/src/data/managed-keys.json";
}

async function loadRegistry(folderPath) {
    const path = await getRegistryPath(folderPath);
    try {
        if (await dc.app.vault.adapter.exists(path)) {
            const content = await dc.app.vault.adapter.read(path);
            return JSON.parse(content);
        }
    } catch (e) {
        console.error("Failed to load registry:", e);
    }
    return [];
}

async function saveRegistry(folderPath, secrets) {
    const path = await getRegistryPath(folderPath);
    try {
        await dc.app.vault.adapter.write(path, JSON.stringify(secrets, null, 2));
        return true;
    } catch (e) {
        console.error("Failed to save registry:", e);
        return false;
    }
}

return { loadRegistry, saveRegistry };
