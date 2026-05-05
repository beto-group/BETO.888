
# MediaResolver

```jsx
const { IMG_EXTS, VID_EXTS, loadScript, normalizeVaultPath } = await dc.require(dc.headerLink(dc.resolvePath("src/utils/CommonUtils.md"), "CommonUtils"));

const MediaResolver = (() => {
    // Persistent cache across component mounts
    const pathCache = new Map(); // filename -> full path
    const resourceCache = new Map(); // path -> resource URL
    let filesIndexed = false;
    let fileIndex = null;
    
    let isIndexing = false;
    let pendingResolve = null;

    // Async chunked indexer
    const buildIndexChunked = async () => {
        if (filesIndexed && fileIndex) return fileIndex;
        if (isIndexing) return pendingResolve;

        isIndexing = true;
        const files = dc.app.vault.getFiles();
        const tempIndex = {
            byName: new Map(),
            byPath: new Map(),
            mediaFiles: []
        };
        const mediaExts = new Set([...IMG_EXTS, ...VID_EXTS].map(e => e.toLowerCase()));
        
        const startTime = performance.now();

        pendingResolve = new Promise(async (resolve) => {
            let cursor = 0;
            const CHUNK_SIZE = 800;

            const nextChunk = () => {
                const end = Math.min(cursor + CHUNK_SIZE, files.length);
                for (; cursor < end; cursor++) {
                    const file = files[cursor];
                    const nameLower = file.name.toLowerCase();
                    const pathLower = file.path.toLowerCase();
                    
                    if (!tempIndex.byName.has(nameLower)) tempIndex.byName.set(nameLower, []);
                    tempIndex.byName.get(nameLower).push(file);
                    tempIndex.byPath.set(pathLower, file);
                    
                    const ext = file.extension?.toLowerCase();
                    if (ext && mediaExts.has(ext)) tempIndex.mediaFiles.push(file);
                }

                if (cursor < files.length) {
                    // Update partial index so early lookups might work
                    fileIndex = tempIndex;
                    setTimeout(nextChunk, 1);
                } else {
                    fileIndex = tempIndex;
                    filesIndexed = true;
                    isIndexing = false;
                    resolve(fileIndex);
                }
            };
            nextChunk();
        });

        return pendingResolve;
    };

    // Synchronous fallback (blocks main thread)
    const buildIndexSync = () => {
        if (filesIndexed && fileIndex) return fileIndex;
        
        const startTime = performance.now();
        const files = dc.app.vault.getFiles();
        const index = { byName: new Map(), byPath: new Map(), mediaFiles: [] };
        const mediaExts = new Set([...IMG_EXTS, ...VID_EXTS].map(e => e.toLowerCase()));
        
        for (const file of files) {
            const nameLower = file.name.toLowerCase();
            const pathLower = file.path.toLowerCase();
            if (!index.byName.has(nameLower)) index.byName.set(nameLower, []);
            index.byName.get(nameLower).push(file);
            index.byPath.set(pathLower, file);
            const ext = file.extension?.toLowerCase();
            if (ext && mediaExts.has(ext)) index.mediaFiles.push(file);
        }
        
        fileIndex = index;
        filesIndexed = true;
        return fileIndex;
    };

    // Pre-warm the index asynchronously
    const preWarm = () => {
        if (filesIndexed || isIndexing) return;
        buildIndexChunked();
    };
    
    const safeGetPath = (f) => {
        if (!f) return null;
        try {
            return dc.app.vault.getResourcePath(f);
        } catch (e) {
            return `app://obsidian.rc/${encodeURIComponent(f.path)}?${Date.now()}`;
        }
    };
    
    // Fast path resolution (consumes an existing or sync index)
    const resolveFast = (query, opts = {}, manualIndex = null) => {
        const q = normalizeVaultPath(query);
        if (!q) return null;
        
        // --- PHASE 1: DIRECT TARGETED LOOKUP (O(1)) ---
        // If we have a path-like query, try direct abstraction first
        try {
            const directFile = dc.app.vault.getAbstractFileByPath(q);
            if (directFile && directFile.extension) return directFile;
        } catch (_) {}

        const preferDir = opts.preferDir ? normalizeVaultPath(opts.preferDir).replace(/\/$/, '') : '';
        if (preferDir) {
            try {
                const withDir = `${preferDir}/${q.split('/').pop()}`;
                const dirFile = dc.app.vault.getAbstractFileByPath(withDir);
                if (dirFile && dirFile.extension) return dirFile;
            } catch (_) {}
        }

        // --- PHASE 2: INDEXED LOOKUP (O(Log N)) ---
        const index = manualIndex || (filesIndexed ? fileIndex : null);
        if (!index) return null; // Avoid triggering sync build in fast path
        
        const preferExts = opts.preferExts || [...IMG_EXTS, ...VID_EXTS];
        
        // Try exact path in index
        const exactFile = index.byPath.get(q.toLowerCase());
        if (exactFile) return exactFile;
        
        // Try by name with extensions
        const hasExt = /\.[a-z0-9]+$/i.test(q);
        const baseName = hasExt ? q.replace(/\.[^/.]+$/, '') : q;
        const fileName = baseName.split('/').pop();
        
        const exts = hasExt ? [q.split('.').pop()] : preferExts;
        
        for (const ext of exts) {
            const fullName = `${fileName}.${ext}`.toLowerCase();
            const candidates = index.byName.get(fullName);
            
            if (candidates && candidates.length > 0) {
                // 1. Try Preferred Directory
                if (preferDir && candidates.length > 1) {
                    const inPreferredDir = candidates.find(f => 
                        f.path.toLowerCase().startsWith(preferDir.toLowerCase())
                    );
                    if (inPreferredDir) {
                        return inPreferredDir;
                    }
                }
                
                // 2. Try to avoid "copy" folders if multiple exist
                if (candidates.length > 1) {
                    const nonCopy = candidates.find(f => !f.path.toLowerCase().includes(' copy'));
                    if (nonCopy) {
                        return nonCopy;
                    }
                }

                // 3. Fallback to first candidate
                const chosen = candidates[0];
                return chosen;
            }
        }
        
        // FAILED to resolve
        return null;
    };
    
    // Batch resolution for parallel loading
    const resolveBatch = async (queries) => {
        const results = [];
        // Only trigger index build if direct lookups fail for everything
        const resolveOne = (q, o) => {
            const direct = resolveFast(q, o, null);
            if (direct) return direct;
            return null;
        };

        const firstPass = queries.map(({query, opts}) => resolveOne(query, opts));
        if (firstPass.every(f => f !== null)) {
            return firstPass.map(f => safeGetPath(f));
        }

        // Second pass: Use index for anything missing
        const index = await buildIndexChunked();

        for (let i = 0; i < queries.length; i++) {
            if (firstPass[i]) {
                const rPath = safeGetPath(firstPass[i]);
                results.push(rPath);
                continue;
            }
            
            const file = resolveFast(queries[i].query, queries[i].opts, index);
            if (file) {
                const rPath = safeGetPath(file);
                results.push(rPath);
            } else {
                results.push(null);
            }
        }
        
        return results;
    };
    
    // Main resolver function
    const resolve = async (query, opts = {}) => {
        if (!query) return null;
        
        const cacheKey = `${query}|${JSON.stringify(opts)}`;
        
        // Check cache
        if (resourceCache.has(cacheKey)) {
            return resourceCache.get(cacheKey);
        }
        
        // Build index (async)
        const index = await buildIndexChunked();
        
        // Fast resolution
        const file = resolveFast(query, opts, index);
        if (file) {
            const resourcePath = safeGetPath(file);
            resourceCache.set(cacheKey, resourcePath);
            return resourcePath;
        }
        
        // Fallback to fuzzy search only if really needed
        if (opts.allowFuzzy !== false) {
            const result = await getMediaResourcePath(query, { ...opts, skipIndex: true });
            if (result) resourceCache.set(cacheKey, result);
            return result;
        }
        
        return null;
    };
    
    // Clear cache (useful for vault changes)
    const clearCache = () => {
        pathCache.clear();
        resourceCache.clear();
        filesIndexed = false;
        fileIndex = null;
    };
    
    // Listen for vault changes
    if (dc.app?.vault) {
        const vault = dc.app.vault;
        ['create', 'delete', 'rename'].forEach(event => {
            vault.on(event, clearCache);
        });
    }
    
    return { resolve, resolveBatch, clearCache, buildIndex: buildIndexSync, preWarm };
})();

// Backward compatibility wrapper
async function getMediaResourcePath(filePathOrName, opts = {}) {
    // If not skipping indexing (default call mode), prefer the MediaResolver directly
    if (!opts.skipIndex) {
        return await MediaResolver.resolve(filePathOrName, opts);
    }

    const preferExts = opts.preferExts || [...IMG_EXTS, ...VID_EXTS];
    const preferDir = opts.preferDir
        ? normalizeVaultPath(opts.preferDir).replace(/\/$/, "")
        : "";
    const q = normalizeVaultPath(filePathOrName);
    if (!q) return null;
    const hasExt = /\.[a-z0-9]+$/i.test(q);
    const qBase = hasExt ? q.replace(/\.[^/.]+$/, "") : q;
    const qName = qBase.split("/").pop();
    
    let f = dc.app.vault.getAbstractFileByPath(q);
    if (f) return dc.app.vault.getResourcePath(f);
    
    const dirFromQ = qBase.includes("/")
        ? qBase.split("/").slice(0, -1).join("/")
        : "";
    const dirs = [
        ...new Set([preferDir, dirFromQ].filter(Boolean).map(normalizeVaultPath)),
    ];
    if (!dirs.length) dirs.push("");
    const exts = hasExt ? [q.split(".").pop()] : preferExts;
    for (const dir of dirs) {
        for (const ext of exts) {
            const p = (dir ? `${dir}/` : "") + `${qName}.${ext}`;
            f = dc.app.vault.getAbstractFileByPath(p);
            if (f) return dc.app.vault.getResourcePath(f);
        }
    }
    
    // Fuzzy search fallback (Legacy but stabilized)
    const files = dc.app.vault.getFiles();
    const nameCandidates = hasExt
        ? [qName]
        : exts.map((ext) => `${qName}.${ext}`);
    f = files.find((x) =>
        nameCandidates.some((n) => x.name.toLowerCase() === n.toLowerCase())
    );
    if (f) return dc.app.vault.getResourcePath(f);
    
    await loadScript(
        dc,
        "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js",
        "Fuse"
    );
    try {
        const fuse = new Fuse(files, {
            keys: ["path", "name"],
            threshold: 0.32,
            ignoreLocation: true,
            minMatchCharLength: 2,
        });
        const res = fuse.search(qName);
        if (res?.length) return dc.app.vault.getResourcePath(res[0].item);
    } catch (_) { }
    
    return null;
}

return { MediaResolver, getMediaResourcePath };
```
