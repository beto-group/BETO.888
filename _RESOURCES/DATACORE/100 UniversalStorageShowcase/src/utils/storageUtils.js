/**
 * Universal Storage Aggregator
 * Manages modular storage sub-systems
 */

async function loadStorage(folderPath) {
    const registry = {};

    const modules = [
        { name: 'fs', path: '/src/utils/storage/fsStorage.js', key: 'fsStorage' },
        { name: 'vault', path: '/src/utils/storage/vaultStorage.js', key: 'vaultStorage' },
        { name: 'web', path: '/src/utils/storage/webStorage.js', key: 'webStorage' },
        { name: 'db', path: '/src/utils/storage/dbStorage.js', key: 'dbStorage' },
        { name: 'system', path: '/src/utils/storage/systemStorage.js', key: 'systemStorage' },
        { name: 'secure', path: '/src/utils/storage/secureStorage.js', key: 'secureStorage' },
        { name: 'sync', path: '/src/utils/storage/syncStorage.js', key: 'syncStorage' }
    ];

    for (const mod of modules) {
        try {
            const exported = await dc.require(folderPath + mod.path);
            registry[mod.name] = exported[mod.key];
        } catch (e) {
            console.error(`[StorageAggregator] Failed to load ${mod.name}:`, e);
        }
    }

    return registry;
}

return { loadStorage };
