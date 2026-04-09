/**
 * Library Loader Utility
 * Simplified logic to load and cache external libraries from CDN.
 */

async function loadLibrary(dc, src, options = {}) {
    const {
        type = 'script',
        globalName = null,
        cache = true
    } = options;

    if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
        throw new Error("Datacore context 'dc' with vault adapter is required.");
    }

    const adapter = dc.app.vault.adapter;
    const cacheDir = ".datacore/script_cache";
    const isUrl = /^https?:\/\//.test(src);

    // Global Deduplication
    if (globalName && window[globalName]) {
        console.log(`[LibraryLoader] ✓ ${globalName} already available`);
        return window[globalName];
    }

    // Promise tracking to prevent concurrent loads
    window.__libPromises = window.__libPromises || {};
    const promiseKey = `${type}:${src}`;

    if (window.__libPromises[promiseKey]) {
        return window.__libPromises[promiseKey];
    }

    const loadPromise = (async () => {
        try {
            let content = null;

            if (isUrl) {
                const safeFilename = src.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_') + '.js';
                const cachePath = `${cacheDir}/${safeFilename}`;

                if (cache && await adapter.exists(cachePath)) {
                    content = await adapter.read(cachePath);
                } else {
                    const response = await fetch(src);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    content = await response.text();

                    if (cache) {
                        if (!(await adapter.exists(cacheDir))) await adapter.mkdir(cacheDir);
                        await adapter.write(cachePath, content);
                    }
                }
            } else {
                if (!(await adapter.exists(src))) throw new Error(`File not found: ${src}`);
                content = await adapter.read(src);
            }

            if (type === 'module') {
                const blob = new Blob([content], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                try {
                    const module = await import(blobUrl);
                    if (globalName) window[globalName] = module;
                    return module;
                } finally {
                    URL.revokeObjectURL(blobUrl);
                }
            } else {
                const script = document.createElement('script');
                script.textContent = content;
                document.body.appendChild(script);
                return window[globalName] || script;
            }
        } finally {
            delete window.__libPromises[promiseKey];
        }
    })();

    window.__libPromises[promiseKey] = loadPromise;
    return loadPromise;
}

return { loadLibrary };
