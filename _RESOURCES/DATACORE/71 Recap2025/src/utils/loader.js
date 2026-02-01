
/**
 * Advanced Resource Loader
 * Adapted from D.q.loadscript.component.md
 * Handles caching, deduplication, and execution of scripts and data.
 */

// Global promise tracker to prevent duplicate concurrent loads
if (typeof window !== 'undefined') {
    window.__scriptPromises = window.__scriptPromises || {};
}

/**
 * Loads a script from a URL or local path with caching.
 * @param {object} dc - Datacore context
 * @param {string} src - URL or path
 * @param {object} options - { type: 'script'|'module', globalName: string, cache: boolean }
 */
export async function loadScript(dc, src, options = {}) {
    const {
        type = 'script',
        globalName = null,
        cache = true
    } = options;

    // Validation
    if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
        console.warn("[Loader] DC context missing, attempting generic fetch (no cache)");
        // Fallback for non-datacore environments (unlikely but safe)
        if (globalName && window[globalName]) return window[globalName];
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    const adapter = dc.app.vault.adapter;
    const cacheDir = ".datacore/script_cache";
    const isUrl = /^https?:\/\//.test(src);

    // 1. Check Global
    if (globalName && window[globalName]) {
        return type === 'module' ? window[globalName] : Promise.resolve();
    }

    // 2. Check Deduplication Promise
    const promiseKey = `${type}:${src}`;
    if (window.__scriptPromises[promiseKey]) {
        return window.__scriptPromises[promiseKey];
    }

    // 3. Main Load Logic
    const loadPromise = (async () => {
        try {
            let scriptContent = null;

            if (isUrl) {
                const safeFilename = src.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_') + '.js';
                const cachePath = `${cacheDir}/${safeFilename}`;

                // Try Cache
                if (cache && await adapter.exists(cachePath)) {
                    try {
                        scriptContent = await adapter.read(cachePath);
                    } catch (e) {
                        console.warn(`[Loader] Cache read failed for ${src}`, e);
                    }
                }

                // Fetch if needed
                if (!scriptContent) {
                    console.log(`[Loader] Fetching ${src}`);
                    const res = await fetch(src);
                    if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.status}`);
                    scriptContent = await res.text();

                    // Write Cache
                    if (cache) {
                        if (!(await adapter.exists(cacheDir))) await adapter.mkdir(cacheDir);
                        await adapter.write(cachePath, scriptContent);
                    }
                }
            } else {
                // Local file - Use Smart Lookup
                let resolved = src;
                if (dc.resolvePath) {
                    const found = dc.resolvePath(src);
                    if (found) resolved = found;
                }

                // Final check to prevent read errors
                if (await adapter.exists(resolved)) {
                    scriptContent = await adapter.read(resolved);
                } else {
                    console.warn(`[Loader] Local file not found: ${src} (resolved: ${resolved})`);
                    throw new Error(`Local file not found: ${src}`);
                }
            }

            // Execute
            if (type === 'module') {
                const blob = new Blob([scriptContent], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                try {
                    const mod = await import(blobUrl);
                    if (globalName) window[globalName] = mod;
                    return mod;
                } finally {
                    URL.revokeObjectURL(blobUrl);
                }
            } else {
                const script = document.createElement('script');
                script.textContent = scriptContent;
                document.body.appendChild(script);
                if (globalName && !window[globalName]) {
                    // Give it a tick?
                    // Usually sync.
                }
                return script;
            }

        } catch (e) {
            console.error(`[Loader] Failed to load ${src}`, e);
            throw e;
        } finally {
            delete window.__scriptPromises[promiseKey];
        }
    })();

    window.__scriptPromises[promiseKey] = loadPromise;
    return loadPromise;
}

/**
 * Fetches JSON/Text data with caching.
 * Useful for large datasets like TopoJSON.
 */
export async function loadData(dc, src) {
    if (!dc) return fetch(src).then(r => r.text()); // Fallback

    const adapter = dc.app.vault.adapter;
    const cacheDir = ".datacore/data_cache";
    const safeFilename = src.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_');
    const cachePath = `${cacheDir}/${safeFilename}`;

    // Try Cache
    if (await adapter.exists(cachePath)) {
        console.log(`[Loader] Data cache hit: ${src}`);
        return adapter.read(cachePath);
    }

    // Fetch
    console.log(`[Loader] Fetching data: ${src}`);
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch data ${src}`);
    const text = await res.text();

    // Cache
    if (!(await adapter.exists(cacheDir))) await adapter.mkdir(cacheDir);
    await adapter.write(cachePath, text);

    return text;
}
