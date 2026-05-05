
# CommonUtils

```jsx
const IMG_EXTS = ["webp", "png", "jpg", "jpeg", "svg", "gif"];
const VID_EXTS = ["webm", "mp4", "mov"];

function normalizeVaultPath(input) {
    if (!input) return "";
    let s = String(input).trim();
    s = s.replace(/^\[\[|\]\]$/g, "");
    s = s.replace(/\|.*$/, "");
    s = s.replace(/#.*$/, "");
    s = s
        .replace(/^\/+/, "")
        .replace(/\\/g, "/")
        .replace(/\/{2,}/g, "/");
    try {
        s = decodeURIComponent(s);
    } catch (_) { }
    return s;
}

async function loadScript(dc, src, globalCheck) {
    if (globalCheck && window[globalCheck]) {
        return Promise.resolve();
    }
    const cacheDir = ".datacore/script_cache";
    const isUrl = /^https?:\/\//.test(src);
    if (!isUrl) {
        throw new Error(
            "This loadScript implementation currently only supports caching for external URLs."
        );
    }
    const executeScriptContent = (scriptContent) => {
        try {
            const scriptElement = document.createElement("script");
            scriptElement.textContent = scriptContent;
            document.body.appendChild(scriptElement);
            document.body.removeChild(scriptElement);
        } catch (execError) {
            console.error(`Error executing script content from ${src}:`, execError);
            throw execError;
        }
    };
    return new Promise(async (resolve, reject) => {
        if (!dc || !dc.app?.vault?.adapter) {
            return reject(
                new Error(
                    "Datacore context 'dc' with vault adapter is required for loadScript."
                )
            );
        }
        const adapter = dc.app.vault.adapter;
        try {
            const safeFilename =
                src.replace(/^https?:\/\//, "").replace(/[\/\\?%*:|"<>]/g, "_") + ".js";
            const cachePath = `${cacheDir}/${safeFilename}`;
            let scriptText = null;
            if (await adapter.exists(cachePath)) {
                try {
                    scriptText = await adapter.read(cachePath);
                } catch (readError) {
                    console.warn(
                        `[Cache] Failed to read cached script, re-fetching. Error:`,
                        readError
                    );
                }
            }
            if (scriptText === null) {
                const response = await fetch(src);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${src}`);
                }
                scriptText = await response.text();
                try {
                    if (!(await adapter.exists(cacheDir))) {
                        await adapter.mkdir(cacheDir);
                    }
                    await adapter.write(cachePath, scriptText);
                } catch (writeError) {
                    console.warn(
                        `[Cache] Failed to write script to cache. Error:`,
                        writeError
                    );
                }
            }
            executeScriptContent(scriptText);
            resolve();
        } catch (error) {
            console.error(`Failed to load script ${src}:`, error);
            reject(error);
        }
    });
}

async function fuzzyFindFile(filename) {
    // Only load Fuse.js if it's not already loaded
    if (!window.Fuse) {
        await loadScript(
            dc,
            "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js",
            "Fuse"
        );
    }
    const files = dc.app.vault.getFiles();
    const fuse = new Fuse(files, {
        keys: ["name"],
        includeScore: true,
        threshold: 0.4,
    });
    const results = fuse.search(filename);
    return results.length > 0 ? results[0].item : null;
}

return { IMG_EXTS, VID_EXTS, loadScript, normalizeVaultPath, fuzzyFindFile };
```
