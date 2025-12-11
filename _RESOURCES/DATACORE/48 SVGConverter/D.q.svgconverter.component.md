

# ViewComponent

```jsx
// =================================================================================
//  SETUP: Destructure React/Datacore dependencies
// =================================================================================
const { useState, useCallback, useRef, useEffect, useReducer, useMemo } = dc;

// =================================================================================
//  CONFIGURATION
// =================================================================================
const EXPORT_SCALE = 2; // 2x resolution for higher quality output.

// Font configuration - maps Excalidraw font family IDs to font file names (will be searched via fuzzy search)
// Excalidraw uses numeric IDs: 1=Virgil (hand-drawn), 2=Helvetica (normal), 3=Cascadia (code), 4=Assistant
const FONT_CONFIG = {
    1: "Futura-CondensedLight.otf",  // Virgil (hand-drawn style)
    2: "Futura-CondensedLight.otf",  // Helvetica (normal text)
    3: "Futura-CondensedLight.otf",  // Cascadia (code font)
    4: "Futura-CondensedLight.otf",  // Assistant
    // You can add more font filenames here if needed
    // e.g., 5: "Roboto-Regular.ttf"
};

const EXPORT_PADDING = 10; // Padding (in pixels) around SVG content when exporting. Adjust this value to add more/less whitespace around your images (default: 10px)
const FOLDER_NAME = "svg_samples"; // Folder name to search for (will use fuzzy search)
let FOLDER_PATH = null; // Will be dynamically set after fuzzy search
const MAX_CONCURRENCY = 1; // Manual mode: process one at a time
const MANUAL_MODE = true; // Enable manual preview & approval

// --- CDN URLs ---
// Using jsdelivr CDN which has better availability and browser builds
const REACT_URL = "https://unpkg.com/react@18.2.0/umd/react.production.min.js";
const REACT_DOM_URL = "https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js";
const EXCALIDRAW_UMD_URL = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.17.6/dist/excalidraw.production.min.js";
const EXCALIDRAW_ASSET_PATH = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.17.6/dist/";
const LZ_STRING_CDN_URL = "https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js";

// =================================================================================
//  UTILITY FUNCTIONS (Full Tab Support)
// =================================================================================
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) return current;
        current = current.parentNode;
    }
    return null;
}

function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) return child;
    }
    return null;
}

// =================================================================================
//  SCRIPT LOADING WITH CACHING
// =================================================================================
/**
 * Loads a script either from a URL (with caching) or a local vault path.
 * @param {string} src - The URL or local vault path of the script.
 * @returns {Promise<HTMLScriptElement>} A promise that resolves with the script element when loaded.
 */
async function loadScript(src) {
    const cacheDir = ".datacore/script_cache";
    const isUrl = /^https?:\/\//.test(src);
    
    const executeScriptContent = (scriptContent, resolve, reject, scriptElement) => {
        try {
            scriptElement.textContent = scriptContent;
            document.body.appendChild(scriptElement);
            console.log(`[SVGConverter] Script executed from ${isUrl ? 'cache/network' : 'local path'}: ${src}`);
            resolve(scriptElement);
        } catch (execError) {
            console.error(`[SVGConverter] Error executing script content from ${src}:`, execError);
            reject(execError);
        }
    };
    
    return new Promise(async (resolve, reject) => {
        const scriptElement = document.createElement("script");
        scriptElement.async = true;
        
        if (!app || !app.vault || !app.vault.adapter) {
            return reject(new Error("Vault adapter is required for loadScript."));
        }
        const adapter = app.vault.adapter;
        
        try {
            if (isUrl) {
                // URL Handling (Fetch & Cache)
                const safeFilename = src
                    .replace(/^https?:\/\//, '')
                    .replace(/[\/\\?%*:|"<>]/g, '_') + ".js";
                const cachePath = `${cacheDir}/${safeFilename}`;
                
                let scriptText = null;
                
                // Check if cached file exists
                const cachedExists = await adapter.exists(cachePath);
                
                if (cachedExists) {
                    console.log(`[SVGConverter] Loading script from cache: ${cachePath}`);
                    try {
                        scriptText = await adapter.read(cachePath);
                    } catch (readError) {
                        console.warn(`[SVGConverter] Failed to read cache file ${cachePath}, refetching. Error:`, readError);
                    }
                }
                
                if (scriptText === null) {
                    console.log(`[SVGConverter] Fetching script from network: ${src}`);
                    const response = await fetch(src);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for ${src}`);
                    }
                    scriptText = await response.text();
                    
                    // Write to cache
                    try {
                        if (!(await adapter.exists(cacheDir))) {
                            console.log(`[SVGConverter] Creating script cache directory: ${cacheDir}`);
                            await adapter.mkdir(cacheDir);
                        }
                        console.log(`[SVGConverter] Writing script to cache: ${cachePath}`);
                        await adapter.write(cachePath, scriptText);
                    } catch (writeError) {
                        console.warn(`[SVGConverter] Failed to write script to cache ${cachePath}. Error:`, writeError);
                    }
                }
                executeScriptContent(scriptText, resolve, reject, scriptElement);
                
            } else {
                // Local Vault Path Handling
                console.log(`[SVGConverter] Loading script from local vault path: ${src}`);
                const localFileExists = await adapter.exists(src);
                
                if (!localFileExists) {
                    throw new Error(`Local script file not found: ${src}`);
                }
                
                const scriptText = await adapter.read(src);
                executeScriptContent(scriptText, resolve, reject, scriptElement);
            }
        } catch (error) {
            console.error(`[SVGConverter] Failed to load script ${src}:`, error);
            if (scriptElement.parentNode) {
                scriptElement.parentNode.removeChild(scriptElement);
            }
            reject(error);
        }
    });
}

// =================================================================================
//  FUZZY SEARCH UTILITIES
// =================================================================================
/**
 * Fuzzy search for a file using Fuse.js and the Obsidian file index
 * @param {string} filename - The filename to search for
 * @returns {Promise<TFile|null>} The matched file or null
 */
async function fuzzyFindFile(filename) {
    // Ensure Fuse is loaded (with caching!)
    if (!window.Fuse) {
        await loadScript("https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js");
    }
    
    const files = app.vault.getFiles();
    const fuse = new Fuse(files, {
        keys: ["name"],
        includeScore: true,
        threshold: 0.4,
    });
    
    const results = fuse.search(filename);
    return results.length > 0 ? results[0].item : null;
}

/**
 * Fuzzy search for a folder using Fuse.js
 * @param {string} folderName - The folder name to search for
 * @returns {Promise<TFolder|null>} The matched folder or null
 */
async function fuzzyFindFolder(folderName) {
    // Ensure Fuse is loaded (with caching!)
    if (!window.Fuse) {
        await loadScript("https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js");
    }
    
    const folders = app.vault.getAllLoadedFiles().filter(f => f.children);
    const fuse = new Fuse(folders, {
        keys: ["name"],
        includeScore: true,
        threshold: 0.4,
    });
    
    const results = fuse.search(folderName);
    return results.length > 0 ? results[0].item : null;
}

// =================================================================================
//  THEME & STYLING
// =================================================================================
const THEME = {
    fontFamily: "ui-monospace, 'JetBrains Mono', 'Fira Code', SFMono-Regular, Menlo, monospace",
    colors: {
        background: 'rgba(11, 7, 19, 0.85)', backgroundConsole: 'rgba(10, 6, 16, 0.9)', textNormal: 'oklch(0.9 0.05 300)',
        textMuted: 'oklch(0.65 0.08 300)', textAccent: 'oklch(0.8 0.2 300)', border: 'oklch(0.8 0.2 300 / 28%)',
        accent: 'oklch(0.8 0.2 300)', accentBg: 'oklch(0.8 0.2 300 / 16%)', accentText: '#0b0713',
        error: '#ff5555', success: '#50fa7b', warning: '#f1fa8c',
    },
    shadows: { main: '0 12px 50px rgba(0,0,0,.45)', accent: '0 0 15px oklch(0.8 0.2 300 / 50%)' },
    borderRadius: '8px',
};

// =================================================================================
//  ROBUST DEPENDENCY LOADER (WITH CACHING & FUZZY SEARCH)
// =================================================================================
const DependencyManager = (() => {
    let promise = null;
    let dependencies = null;

    async function load() {
        // Set the asset path BEFORE loading the script. This is critical for Excalidraw.
        window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_ASSET_PATH;

        // Load React first (Excalidraw requires it)
        console.log('[SVGConverter] 🔄 Loading React dependencies...');
        if (!window.React) {
            await loadScript(REACT_URL);
            console.log('[SVGConverter] ✅ React loaded');
        }
        if (!window.ReactDOM) {
            await loadScript(REACT_DOM_URL);
            console.log('[SVGConverter] ✅ ReactDOM loaded');
        }

        // Load scripts using cached loadScript
        console.log('[SVGConverter] 🔄 Loading Excalidraw with caching...');
        const excalidrawPromise = loadScript(EXCALIDRAW_UMD_URL)
            .then(() => {
                console.log('[SVGConverter] 🔍 Script loaded successfully');
                
                // The library loads as webpack chunks - we need to wait a bit and check window.ExcalidrawLib
                return new Promise((resolve) => {
                    // Give webpack time to initialize
                    setTimeout(() => {
                        console.log('[SVGConverter] 🔍 Checking for library after webpack initialization...');
                        
                        // Try to find the library
                        let lib = window.ExcalidrawLib || window.Excalidraw;
                        
                        // If still not found, check if webpack created it under a different structure
                        if (!lib && window.webpackChunkExcalidrawLib) {
                            console.log('[SVGConverter] 🔍 Found webpack chunk, searching for exports...');
                            // Sometimes the library is in the webpack chunks
                            const chunks = window.webpackChunkExcalidrawLib;
                            console.log('[SVGConverter] 🔍 Webpack chunks type:', typeof chunks);
                            console.log('[SVGConverter] 🔍 Is array?:', Array.isArray(chunks));
                        }
                        
                        // Last resort: check ALL window properties for anything with exportToSvg
                        if (!lib) {
                            console.log('[SVGConverter] 🔍 Searching all window properties for exportToSvg...');
                            for (const key in window) {
                                if (window[key] && typeof window[key] === 'object' && window[key].exportToSvg) {
                                    console.log(`[SVGConverter] ✅ Found exportToSvg in window.${key}`);
                                    lib = window[key];
                                    break;
                                }
                            }
                        }
                        
                        if (!lib) {
                            console.error('[SVGConverter] ❌ Library still not found after webpack init');
                            resolve(null);
                            return;
                        }
                        
                        console.log('[SVGConverter] ✅ Found library, checking for exportToSvg...');
                        
                        // Find exportToSvg
                        if (lib.exportToSvg) {
                            resolve(lib);
                        } else if (lib.default && lib.default.exportToSvg) {
                            resolve(lib.default);
                        } else {
                            console.error('[SVGConverter] ❌ Library found but no exportToSvg');
                            console.error('[SVGConverter] 🔍 Available keys:', Object.keys(lib));
                            resolve(null);
                        }
                    }, 500); // Wait 500ms for webpack to initialize
                });
            })
            .then(lib => {
                if (!lib) {
                    throw new Error('Excalidraw library not found after loading script and waiting for webpack');
                }
                if (!lib.exportToSvg) {
                    throw new Error('exportToSvg not found in Excalidraw library');
                }
                console.log('[SVGConverter] ✅ Excalidraw loaded successfully with exportToSvg');
                return lib;
            })
            .catch(err => {
                console.error('[SVGConverter] ❌ Failed to load/validate Excalidraw:', err);
                throw err;
            });
        
        const lzStringPromise = loadScript(LZ_STRING_CDN_URL).then(() => window.LZString);
        
        // Find the svg_samples folder dynamically
        console.log(`[SVGConverter] 📁 Searching for folder: ${FOLDER_NAME}`);
        const folder = await fuzzyFindFolder(FOLDER_NAME);
        if (folder) {
            FOLDER_PATH = folder.path + "/";
            console.log(`[SVGConverter] ✅ Found folder: ${FOLDER_PATH}`);
        } else {
            console.warn(`[SVGConverter] ⚠️ Folder "${FOLDER_NAME}" not found, using fallback`);
            FOLDER_PATH = "_RESOURCES/ASSETS/888/ASSETS_.A/"; // Fallback
        }
        
        // Load all configured fonts in parallel with fuzzy search
        console.log('[SVGConverter] 🔤 Starting font loading with fuzzy search...');
        console.log('[SVGConverter] 🔤 Font configuration:', FONT_CONFIG);
        
        const fontLoadPromises = Object.entries(FONT_CONFIG).map(async ([fontId, fontFilename]) => {
            console.log(`[SVGConverter] � Searching for font: ${fontFilename}`);
            try {
                // Use fuzzy search to find the font file
                const fontFile = await fuzzyFindFile(fontFilename);
                
                if (!fontFile) {
                    throw new Error(`Font file not found: ${fontFilename}`);
                }
                
                const fontPath = fontFile.path;
                console.log(`[SVGConverter] ✅ Found font at: ${fontPath}`);
                
                const data = await app.vault.adapter.readBinary(fontPath);
                console.log(`[SVGConverter] ✅ Font ${fontId} loaded successfully (${data.byteLength} bytes)`);
                return { fontId: parseInt(fontId), fontPath, data, success: true };
            } catch (error) {
                console.error(`[SVGConverter] ❌ Failed to load font ${fontId} (${fontFilename}):`, error);
                return { fontId: parseInt(fontId), fontPath: null, data: null, success: false, error: error.message };
            }
        });

        const [ExcalidrawModule, LZString, ...fontResults] = await Promise.all([
            excalidrawPromise, 
            lzStringPromise, 
            ...fontLoadPromises
        ]);
        
        console.log('[SVGConverter] 🔤 Font loading results:', fontResults);
        
        // Create font data map
        const fontDataMap = {};
        let successCount = 0;
        let failCount = 0;
        
        fontResults.forEach(({ fontId, fontPath, data, success }) => {
            if (data) {
                fontDataMap[fontId] = { path: fontPath, data };
                successCount++;
            } else {
                failCount++;
            }
        });
        
        console.log(`[SVGConverter] 🔤 Font loading summary: ${successCount} loaded, ${failCount} failed`);
        console.log('[SVGConverter] 🔤 Available fonts:', Object.keys(fontDataMap).map(id => `ID ${id}: ${fontDataMap[id].path}`));

        return { ExcalidrawModule, LZString, fontDataMap };
    }

    return {
        get: () => {
            if (dependencies) return Promise.resolve(dependencies);
            if (!promise) {
                promise = load().then(deps => {
                    dependencies = deps;
                    return dependencies;
                });
            }
            return promise;
        }
    };
})();

// =================================================================================
//  DEPENDENCY RESOLUTION
// =================================================================================
async function extractDependencies(filePath) {
    try {
        const mdContent = await app.vault.adapter.read(filePath);
        const dependencies = [];
        
        // Look for embedded files in Excalidraw format
        // Pattern: [[FILENAME.svg]] in the "## Embedded Files" section
        const embeddedFilesRegex = /## Embedded Files\s*([\s\S]*?)(?=\n##|\n%%%|$)/;
        const match = mdContent.match(embeddedFilesRegex);
        
        if (match && match[1]) {
            // Extract all [[filename.svg]] references
            const fileRegex = /\[\[([^\]]+\.svg)\]\]/g;
            let fileMatch;
            while ((fileMatch = fileRegex.exec(match[1])) !== null) {
                dependencies.push(fileMatch[1]);
            }
        }
        
        return dependencies;
    } catch (err) {
        return [];
    }
}

async function extractFileIdMap(filePath) {
    // Extract the mapping of fileId (hash) to filename from "## Embedded Files" section
    try {
        const mdContent = await app.vault.adapter.read(filePath);
        const fileIdMap = {};
        
        // Pattern: fileId: [[filename.svg]]
        const embeddedFilesRegex = /## Embedded Files\s*([\s\S]*?)(?=\n##|\n%%%|$)/;
        const match = mdContent.match(embeddedFilesRegex);
        
        if (match && match[1]) {
            // Extract all fileId: [[filename]] mappings
            const mapRegex = /([a-f0-9]{40}):\s*\[\[([^\]]+\.svg)\]\]/g;
            let mapMatch;
            while ((mapMatch = mapRegex.exec(match[1])) !== null) {
                const fileId = mapMatch[1];
                const filename = mapMatch[2];
                fileIdMap[fileId] = filename;
            }
        }
        
        return fileIdMap;
    } catch (err) {
        return {};
    }
}

async function buildDependencyGraph(files) {
    const graph = new Map();
    const basenames = new Map(); // Map of basename (without .md) to full path
    
    // First pass: build basename lookup
    for (const file of files) {
        const basename = file.path.replace(/\.md$/i, '');
        const filenameOnly = basename.split('/').pop();
        basenames.set(filenameOnly, file.path);
        graph.set(file.path, { deps: [], file });
    }
    
    // Second pass: extract dependencies
    for (const file of files) {
        const deps = await extractDependencies(file.path);
        const resolvedDeps = [];
        
        for (const dep of deps) {
            // Extract just the filename from the full path (e.g., "888/PROJECTS/.../BELIEVE_v01_.A.svg" -> "BELIEVE_v01_.A")
            const filenameOnly = dep.split('/').pop().replace(/\.svg$/i, '');
            const depPath = basenames.get(filenameOnly);
            if (depPath) {
                resolvedDeps.push(depPath);
            }
        }
        
        graph.get(file.path).deps = resolvedDeps;
    }
    
    return graph;
}

function topologicalSort(graph) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();
    
    function visit(path) {
        if (visited.has(path)) return;
        if (visiting.has(path)) {
            // Circular dependency detected - just mark as visited and continue
            visited.add(path);
            return;
        }
        
        visiting.add(path);
        const node = graph.get(path);
        
        if (node && node.deps) {
            for (const dep of node.deps) {
                visit(dep);
            }
        }
        
        visiting.delete(path);
        visited.add(path);
        if (node) sorted.push(node.file);
    }
    
    for (const [path] of graph) {
        visit(path);
    }
    
    return sorted;
}

// =================================================================================
//  CORE PROCESSING LOGIC (Enhanced with proper SVG sizing)
// =================================================================================
function fixSVGDimensions(svgElement, correctBounds = null) {
    // For saved files: set explicit width/height but keep Excalidraw's viewBox unchanged
    // The viewBox includes space for transforms and positioned content - don't break that!
    
    // Get the current viewBox from Excalidraw's export
    const viewBox = svgElement.getAttribute('viewBox');
    if (!viewBox) {
        console.log('[fixSVGDimensions] WARNING: No viewBox found!');
        return svgElement;
    }
    
    const [x, y, width, height] = viewBox.split(' ').map(Number);
    
    // Set explicit width/height for saved files (makes them render at correct size)
    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);
    
    // DON'T modify viewBox - keep it as Excalidraw set it (includes transform space)
    console.log('[fixSVGDimensions] Set explicit dimensions, kept viewBox:', {
        width: width.toFixed(2),
        height: height.toFixed(2),
        viewBox: viewBox
    });
    
    return svgElement;
}

function makeSVGScalable(svgElement, correctBounds = null) {
    // For preview: make SVG scale to fill container while preserving aspect ratio
    
    // DON'T modify viewBox - Excalidraw sets it correctly with internal transforms!
    // The viewBox includes space for positioned/transformed content
    // We'll use the actual viewBox dimensions for background sizing
    
    // Remove fixed dimensions to allow scaling
    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');
    
    // Add style to make it fill container
    svgElement.setAttribute('style', 'width: 100%; height: 100%; max-width: 100%; max-height: 100%;');
    
    // Preserve aspect ratio
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    return svgElement;
}

// =================================================================================
// FONT EMBEDDING
// =================================================================================
function embedFontsInSvg(svgElement, fontDataMap, elements, log = null) {
    try {
        // Validate inputs
        if (!svgElement) {
            console.error('[SVGConverter] ❌ embedFontsInSvg: svgElement is null');
            if (log) log('      ❌ embedFontsInSvg: svgElement is null', 'error');
            return svgElement;
        }
        
        if (!fontDataMap || Object.keys(fontDataMap).length === 0) {
            console.log('[SVGConverter] 🔤 No fonts loaded, skipping font embedding');
            if (log) log('      🔤 No fonts loaded', 'warning');
            return svgElement;
        }
        
        if (!elements || !Array.isArray(elements)) {
            console.log('[SVGConverter] 🔤 No elements array, skipping font embedding');
            if (log) log('      🔤 No elements array', 'warning');
            return svgElement;
        }
        
        // Find which font families are actually used in the scene
        const usedFontIds = new Set();
        elements.filter(el => el && el.type === 'text').forEach(el => {
            if (el.fontFamily) {
                usedFontIds.add(el.fontFamily);
            }
        });
        
        if (usedFontIds.size === 0) {
            console.log('[SVGConverter] 🔤 No text elements found, skipping font embedding');
            if (log) log('      🔤 No text elements found in normalized elements', 'warning');
            return svgElement;
        }
        
        console.log('[SVGConverter] 🔤 Embedding fonts for IDs:', Array.from(usedFontIds));
        if (log) log(`      🔤 Embedding fonts for IDs: ${Array.from(usedFontIds).join(', ')}`, 'info');
        
        // Create a <defs> section if it doesn't exist
        let defs = svgElement.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svgElement.insertBefore(defs, svgElement.firstChild);
        }
        
        // Create a <style> element for @font-face rules
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.setAttribute('type', 'text/css');
        
        let cssRules = '';
        
        // Map Excalidraw font IDs to our custom font names
        // Use the actual PostScript name from the font file: "Futura-CondensedLight"
        const fontFamilyNames = {
            1: 'Futura-CondensedLight',
            2: 'Futura-CondensedLight',
            3: 'Futura-CondensedLight',
            4: 'Futura-CondensedLight'
        };
        
        // Add @font-face rules for each used font
        usedFontIds.forEach(fontId => {
            try {
                const fontInfo = fontDataMap[fontId];
                if (!fontInfo || !fontInfo.data) {
                    console.warn(`[SVGConverter] ⚠️ No font data for font ID ${fontId}`);
                    return;
                }
                
                // Convert ArrayBuffer to base64
                const bytes = new Uint8Array(fontInfo.data);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                
                const fontFamilyName = fontFamilyNames[fontId] || `CustomFont${fontId}`;
                const fontFormat = fontInfo.path && fontInfo.path.endsWith('.otf') ? 'opentype' : 'truetype';
                
                cssRules += `
@font-face {
    font-family: '${fontFamilyName}';
    src: url(data:font/${fontFormat};base64,${base64}) format('${fontFormat}');
    font-weight: normal;
    font-style: normal;
}
/* Fallback for applications that don't support embedded fonts */
text {
    font-family: '${fontFamilyName}', 'Helvetica Neue Condensed', 'Arial Narrow', 'Futura', 'Helvetica', 'Arial', sans-serif !important;
}
`;
                
                console.log(`[SVGConverter] ✅ Embedded ${fontFamilyName} (${(base64.length / 1024).toFixed(1)} KB)`);
                if (log) log(`         ✅ Embedded ${fontFamilyName} (${(base64.length / 1024).toFixed(1)} KB)`, 'success');
            } catch (fontError) {
                console.error(`[SVGConverter] ❌ Error embedding font ${fontId}:`, fontError);
                if (log) log(`         ❌ Error embedding font ${fontId}: ${fontError.message}`, 'error');
            }
        });
        
        if (cssRules) {
            style.textContent = cssRules;
            defs.appendChild(style);
            console.log('[SVGConverter] ✅ Font embedding complete');
            
            // Also update text elements to ensure they use the embedded font
            const textElements = svgElement.querySelectorAll('text, [font-family]');
            console.log(`[SVGConverter] 🔤 Found ${textElements.length} text elements in SVG`);
            if (log) log(`      🔍 Found ${textElements.length} <text> elements in SVG`, 'info');
            
            let updatedCount = 0;
            textElements.forEach((textEl, idx) => {
                const currentFamily = textEl.getAttribute('font-family');
                const currentStyle = textEl.getAttribute('style');
                const textContent = textEl.textContent?.substring(0, 30);
                
                if (log && idx < 3) { // Log first 3 text elements
                    log(`         Text ${idx + 1}: font="${currentFamily}" text="${textContent}"`, 'info');
                }
                
                // Replace "Local Font" with the actual embedded font name
                // Excalidraw uses "Local Font" as a fallback, but we need to use our embedded font
                if (currentFamily && currentFamily.includes('Local Font')) {
                    // Use the actual PostScript name from the font file
                    const fontFamilyNames = {
                        1: 'Futura-CondensedLight',
                        2: 'Futura-CondensedLight',
                        3: 'Futura-CondensedLight',
                        4: 'Futura-CondensedLight'
                    };
                    
                    // Use the first embedded font (should match the fontFamily ID from elements)
                    const embeddedFontName = Array.from(usedFontIds).map(id => fontFamilyNames[id])[0];
                    textEl.setAttribute('font-family', embeddedFontName);
                    textEl.style.fontFamily = embeddedFontName;
                    updatedCount++;
                    
                    if (log && idx < 3) {
                        log(`            → Changed to: "${embeddedFontName}"`, 'success');
                    }
                } else if (currentFamily) {
                    textEl.style.fontFamily = currentFamily;
                    updatedCount++;
                }
            });
            console.log(`[SVGConverter] 🔤 Updated ${updatedCount} text elements to use embedded fonts`);
            if (log) log(`      ✅ Updated ${updatedCount} text elements`, 'success');
        } else {
            console.warn('[SVGConverter] ⚠️ No CSS rules generated for fonts');
            if (log) log('      ⚠️ No CSS rules generated', 'warning');
        }
        
        return svgElement;
    } catch (error) {
        console.error('[SVGConverter] ❌ Error in embedFontsInSvg:', error);
        // Return original SVG if embedding fails
        return svgElement;
    }
}

async function loadEmbeddedSVGs(sceneData, filePath, log) {
    // Load any embedded SVG files that are referenced in the scene
    log(`🔍 DEBUG: Checking for embedded files...`, 'info');
    
    // Check if there are image elements that need files
    const imageElements = sceneData.elements.filter(el => el.type === 'image');
    
    if (!sceneData.files || Object.keys(sceneData.files).length === 0) {
        if (imageElements.length === 0) {
            log(`   ℹ️ No files object and no image elements`, 'info');
            return sceneData;
        }
        
        // Create files object from image elements
        log(`   ⚠️ No files object found, but ${imageElements.length} image elements exist!`, 'warning');
        log(`   🔧 Creating files object from image element references...`, 'info');
        sceneData.files = {};
    }

    const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
    log(`📁 DEBUG: Current folder: ${folderPath}`, 'info');
    log(`📁 DEBUG: Configured folder: ${FOLDER_PATH}`, 'info');
    
    // Extract fileId to filename mapping from markdown
    log(`🔍 Extracting fileId to filename mapping from markdown...`, 'info');
    const fileIdMap = await extractFileIdMap(filePath);
    const mapSize = Object.keys(fileIdMap).length;
    log(`📋 Found ${mapSize} fileId mappings in markdown`, mapSize > 0 ? 'success' : 'warning');
    if (mapSize > 0) {
        Object.entries(fileIdMap).forEach(([id, name]) => {
            log(`   ${id.substring(0, 12)}: ${name}`, 'info');
        });
    }
    
    const loadedFiles = { ...sceneData.files };
    let loadedCount = 0;
    
    // First, ensure all image elements have corresponding file entries
    log(`🔎 DEBUG: Scanning ${imageElements.length} image elements for file references...`, 'info');
    let skippedCount = 0;
    for (const imgEl of imageElements) {
        const fileId = imgEl.fileId;
        if (!fileId) {
            log(`   ⚠️ Image element ${imgEl.id} has no fileId!`, 'warning');
            continue;
        }
        
        if (!loadedFiles[fileId]) {
            // Use the mapping from markdown to get the filename
            let fileName = fileIdMap[fileId];
            
            if (fileName) {
                log(`   📝 Creating file entry for fileId: ${fileId.substring(0, 12)}...`, 'info');
                log(`      ✓ Found filename in markdown mapping: ${fileName}`, 'success');
                
                // Create placeholder entry that will be filled later
                loadedFiles[fileId] = {
                    id: fileId,
                    name: fileName,
                    dataURL: '',
                    mimeType: 'image/svg+xml',
                    created: Date.now()
                };
            } else {
                // No mapping found - this is likely a ghost/duplicate element
                // Skip it silently to avoid cluttering logs and creating invalid entries
                skippedCount++;
            }
        }
    }
    
    if (skippedCount > 0) {
        log(`   ℹ️ Skipped ${skippedCount} unmapped fileId(s) (likely ghost elements)`, 'info');
    }
    
    log(`🔎 DEBUG: Found ${Object.keys(loadedFiles).length} file entries (after adding image refs)`, 'info');
    
    // CRITICAL: Process loadedFiles (which includes newly created entries), not sceneData.files
    for (const [fileId, fileData] of Object.entries(loadedFiles)) {
        log(`\n   🔹 Processing fileId: ${fileId}`, 'info');
        log(`      - Original fileData keys: ${Object.keys(fileData).join(', ')}`, 'info');
        log(`      - Has dataURL: ${!!fileData.dataURL}`, 'info');
        log(`      - DataURL length: ${fileData.dataURL?.length || 0}`, 'info');
        log(`      - DataURL prefix: ${fileData.dataURL?.substring(0, 50) || 'none'}`, 'info');
        log(`      - MimeType: ${fileData.mimeType || 'unknown'}`, 'info');
        log(`      - Name: ${fileData.name || 'none'}`, 'info');
        
        // Check if file data is missing or incomplete
        if (!fileData.dataURL || fileData.dataURL === '' || fileData.dataURL === 'data:' || fileData.dataURL.length < 100) {
            log(`      ⚠️ File data incomplete or missing, attempting to load...`, 'warning');
            
            // Try to find the corresponding SVG file
            let fileName = fileData.name || fileData.id;
            
            // If no name, try to find it from image elements
            if (!fileName) {
                log(`      🔍 No filename in fileData, searching image elements...`, 'info');
                const imageEl = sceneData.elements.find(el => el.type === 'image' && el.fileId === fileId);
                log(`      - Found matching image element: ${!!imageEl}`, 'info');
                if (imageEl) {
                    log(`      - Image element keys: ${Object.keys(imageEl).join(', ')}`, 'info');
                    log(`      - customData: ${JSON.stringify(imageEl.customData || {}).substring(0, 100)}`, 'info');
                    if (imageEl.customData && imageEl.customData.name) {
                        fileName = imageEl.customData.name;
                        log(`      ✓ Found filename in customData: ${fileName}`, 'success');
                    }
                }
            }
            
            if (fileName) {
                log(`      📄 Working with filename: ${fileName}`, 'info');
                
                // Extract just the filename from full path (e.g., "888/PROJECTS/.../FILE.svg" -> "FILE.svg")
                const fileNameOnly = fileName.split('/').pop();
                log(`      📝 Extracted filename: ${fileNameOnly}`, 'info');
                
                // Ensure .svg extension
                if (!fileNameOnly.endsWith('.svg')) {
                    log(`      ⚡ Adding .svg extension`, 'info');
                    fileName = fileNameOnly + '.svg';
                } else {
                    fileName = fileNameOnly;
                }
                
                // Try multiple locations
                const possiblePaths = [
                    `${folderPath}/${fileName}`,
                    `${FOLDER_PATH}${fileName}`,
                    fileNameOnly // Try just the filename
                ];
                
                log(`      🔎 Trying ${possiblePaths.length} possible paths:`, 'info');
                possiblePaths.forEach((p, i) => log(`         ${i + 1}. ${p}`, 'info'));
                
                let loaded = false;
                for (const svgPath of possiblePaths) {
                    try {
                        log(`      ⏳ Checking: ${svgPath}...`, 'info');
                        const exists = await app.vault.adapter.exists(svgPath);
                        log(`         Exists: ${exists}`, exists ? 'success' : 'warning');
                        
                        if (exists) {
                            log(`      📖 Reading file content...`, 'info');
                            const svgContent = await app.vault.adapter.read(svgPath);
                            log(`         Content length: ${svgContent.length} bytes`, 'success');
                            log(`         First 100 chars: ${svgContent.substring(0, 100)}`, 'info');
                            
                            // Convert SVG to data URL (using proper base64 encoding)
                            log(`      🔄 Encoding to base64...`, 'info');
                            const base64 = btoa(unescape(encodeURIComponent(svgContent)));
                            const dataURL = `data:image/svg+xml;base64,${base64}`;
                            log(`         Encoded length: ${dataURL.length} bytes`, 'success');
                            
                            loadedFiles[fileId] = {
                                ...fileData,
                                dataURL,
                                mimeType: 'image/svg+xml',
                                created: fileData.created || Date.now(),
                                name: fileName
                            };
                            
                            log(`      ✅ SUCCESS: Loaded and encoded ${fileName}`, 'success');
                            log(`         Final fileData keys: ${Object.keys(loadedFiles[fileId]).join(', ')}`, 'success');
                            loadedCount++;
                            loaded = true;
                            break;
                        }
                    } catch (error) {
                        log(`         ✗ Error: ${error.message}`, 'error');
                        // Try next path
                        continue;
                    }
                }
                
                if (!loaded) {
                    log(`      ❌ FAILED: Could not load ${fileName} from any location`, 'error');
                }
            } else {
                log(`      ❌ Cannot determine filename for fileId: ${fileId.substring(0, 12)}`, 'error');
                log(`         fileData dump: ${JSON.stringify(fileData, null, 2)}`, 'error');
            }
        } else {
            // File already has data
            log(`      ✓ File already has valid data (${fileData.dataURL.length} bytes)`, 'success');
            loadedCount++;
        }
    }
    
    log(`\n� SUMMARY: ${loadedCount}/${Object.keys(loadedFiles).length} files ready`, loadedCount === Object.keys(loadedFiles).length ? 'success' : 'warning');
    log(`📦 Final files object keys: ${Object.keys(loadedFiles).join(', ')}`, 'info');
    
    // Clean up: remove any entries that failed to load (no valid dataURL)
    const cleanedFiles = {};
    let removedCount = 0;
    for (const [fileId, fileData] of Object.entries(loadedFiles)) {
        if (fileData.dataURL && fileData.dataURL.length > 100) {
            cleanedFiles[fileId] = fileData;
        } else {
            removedCount++;
        }
    }
    
    if (removedCount > 0) {
        log(`\n🧹 Cleaned up ${removedCount} file(s) with no valid data`, 'info');
    }
    
    return { ...sceneData, files: cleanedFiles };
}

async function parseExcalidrawData(filePath, LZString, log) {
    const mdContent = await app.vault.adapter.read(filePath);
    
    // Try compressed JSON first
    const compressedRegex = /```compressed-json\n([\s\S]*?)\n```/;
    let match = mdContent.match(compressedRegex);
    let jsonString;
    
    if (match && match[1]) {
        jsonString = LZString.decompressFromBase64(match[1].replace(/\s/g, ''));
        if (!jsonString) throw new Error("Decompression failure.");
    } else {
        // Try regular JSON code block
        const fallbackRegex = /```(?:json|excalidraw)\n([\s\S]*?)\n```/;
        match = mdContent.match(fallbackRegex);
        if (match && match[1]) {
            jsonString = match[1];
        } else {
            // Try looking in the %% comment section (Excalidraw plugin format)
            const commentRegex = /%%\n([\s\S]*?)%%/;
            const commentMatch = mdContent.match(commentRegex);
            if (commentMatch && commentMatch[1]) {
                // Look for JSON data in the comment block
                const jsonMatch = commentMatch[1].match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch && jsonMatch[1]) {
                    jsonString = jsonMatch[1];
                }
            }
        }
    }

    if (!jsonString) {
        // Check if it's an excalidraw file that needs decompression
        if (mdContent.includes("excalidraw-plugin: parsed") || mdContent.includes("# Excalidraw Data")) {
            return { skipped: true, reason: 'Excalidraw file needs decompression in Obsidian first' };
        }
        return { skipped: true, reason: 'No Excalidraw JSON data found' };
    }

    let sceneData = JSON.parse(jsonString);
    if (!sceneData.elements || sceneData.elements.length === 0) {
        return { skipped: true, reason: 'Empty drawing - no elements' };
    }
    
    // Load any embedded SVG files
    sceneData = await loadEmbeddedSVGs(sceneData, filePath, log);
    
    return { sceneData };
}

async function generateSVGPreview(sceneData, ExcalidrawModule, fontDataMap, forPreview = true, log = null, exportPadding = EXPORT_PADDING, addBackground = false, backgroundColor = '#ffffff') {
    // VERSION MARKER: Code updated with version increment fix - 2025-10-30
    if (log) {
        log('🚀 generateSVGPreview called - VERSION WITH VERSION INCREMENT FIX', 'info');
        log(`   📏 Using export padding: ${exportPadding}px`, 'info');
    }
    
    // Validate ExcalidrawModule
    if (!ExcalidrawModule) {
        const error = 'ExcalidrawModule is null or undefined';
        console.error('[SVGConverter] ❌', error);
        if (log) log(`❌ ${error}`, 'error');
        throw new Error(error);
    }
    
    if (typeof ExcalidrawModule.exportToSvg !== 'function') {
        const error = `ExcalidrawModule.exportToSvg is not a function. Available methods: ${Object.keys(ExcalidrawModule).join(', ')}`;
        console.error('[SVGConverter] ❌', error);
        if (log) log(`❌ ${error}`, 'error');
        throw new Error(error);
    }
    
    // Create a working copy to avoid mutating the original
    const workingSceneData = {
        ...sceneData,
        elements: sceneData.elements ? JSON.parse(JSON.stringify(sceneData.elements)) : [],
        files: sceneData.files || {},
        appState: sceneData.appState || {}
    };
    
    // CRITICAL FIX: Filter out deleted elements
    // Excalidraw files may include deleted elements that should not be rendered
    if (workingSceneData.elements && workingSceneData.elements.length > 0) {
        const originalCount = workingSceneData.elements.length;
        workingSceneData.elements = workingSceneData.elements.filter(el => el.isDeleted !== true);
        const deletedCount = originalCount - workingSceneData.elements.length;
        
        if (log && deletedCount > 0) {
            log(`🧹 Filtered out ${deletedCount} deleted element(s), keeping ${workingSceneData.elements.length}`, 'info');
        }
    }
    
    // DEDUPLICATE IMAGE ELEMENTS: Remove duplicate image elements with same fileId and position
    if (workingSceneData.elements && workingSceneData.elements.length > 0) {
        const imageElements = workingSceneData.elements.filter(el => el.type === 'image');
        if (imageElements.length > 1) {
            const seenImages = new Map();
            const duplicateIds = new Set();
            
            imageElements.forEach(img => {
                const key = `${img.fileId}_${img.x}_${img.y}_${img.width}_${img.height}`;
                if (seenImages.has(key)) {
                    duplicateIds.add(img.id); // Mark as duplicate
                } else {
                    seenImages.set(key, img.id);
                }
            });
            
            if (duplicateIds.size > 0) {
                const beforeDedup = workingSceneData.elements.length;
                workingSceneData.elements = workingSceneData.elements.filter(el => !duplicateIds.has(el.id));
                if (log) {
                    log(`🔍 Removed ${duplicateIds.size} duplicate image element(s)`, 'info');
                }
            }
        }
    }
    
    // CHECK FOR OUTLIERS BEFORE CENTERING
    // This prevents elements scattered across huge coordinates from creating massive canvas
    if (workingSceneData.elements && workingSceneData.elements.length > 0) {
        // Calculate bounds of ORIGINAL elements before any centering
        // IMPORTANT: For line elements, must include points!
        let origMinX = Infinity, origMinY = Infinity, origMaxX = -Infinity, origMaxY = -Infinity;
        workingSceneData.elements.forEach(el => {
            if (el.x !== undefined && el.y !== undefined) {
                if (el.type === 'line' && el.points && el.points.length > 0) {
                    // For lines, check all point coordinates
                    el.points.forEach(p => {
                        const absX = el.x + p[0];
                        const absY = el.y + p[1];
                        origMinX = Math.min(origMinX, absX);
                        origMinY = Math.min(origMinY, absY);
                        origMaxX = Math.max(origMaxX, absX);
                        origMaxY = Math.max(origMaxY, absY);
                    });
                } else {
                    origMinX = Math.min(origMinX, el.x);
                    origMinY = Math.min(origMinY, el.y);
                    origMaxX = Math.max(origMaxX, el.x + (el.width || 0));
                    origMaxY = Math.max(origMaxY, el.y + (el.height || 0));
                }
            }
        });
        
        const origWidth = origMaxX - origMinX;
        const origHeight = origMaxY - origMinY;
        const maxReasonableSize = 10000; // Increased from 5000 to handle large legitimate drawings
        
        if (log) {
            log(`\n🎯 OUTLIER CHECK: Checking original element positions...`, 'info');
            log(`   - Total elements: ${workingSceneData.elements.length}`, 'info');
            log(`   - Original bounds: (${origMinX.toFixed(1)}, ${origMinY.toFixed(1)}) to (${origMaxX.toFixed(1)}, ${origMaxY.toFixed(1)})`, 'info');
            log(`   - Original canvas size: ${origWidth.toFixed(0)} × ${origHeight.toFixed(0)}px`, 'info');
        }
        
        // If canvas is huge, likely has scattered outliers - filter them FIRST
        if (origWidth > maxReasonableSize || origHeight > maxReasonableSize) {
            if (log) {
                log(`\n🚨 SCATTERED ELEMENTS DETECTED (${origWidth.toFixed(0)} × ${origHeight.toFixed(0)}px)`, 'error');
                log(`   🔧 Filtering outliers BEFORE centering...`, 'warn');
            }
            
            // Calculate median position (handle line elements with points)
            const xPositions = workingSceneData.elements.map(el => {
                if (el.type === 'line' && el.points && el.points.length > 0) {
                    const xs = el.points.map(p => p[0]);
                    const minPx = Math.min(...xs);
                    const maxPx = Math.max(...xs);
                    return el.x + (minPx + maxPx) / 2;
                }
                return el.x + (el.width || 0) / 2;
            }).sort((a, b) => a - b);
            
            const yPositions = workingSceneData.elements.map(el => {
                if (el.type === 'line' && el.points && el.points.length > 0) {
                    const ys = el.points.map(p => p[1]);
                    const minPy = Math.min(...ys);
                    const maxPy = Math.max(...ys);
                    return el.y + (minPy + maxPy) / 2;
                }
                return el.y + (el.height || 0) / 2;
            }).sort((a, b) => a - b);
            
            const medianX = xPositions[Math.floor(xPositions.length / 2)];
            const medianY = yPositions[Math.floor(yPositions.length / 2)];
            
            if (log) {
                log(`   - Median position: (${medianX.toFixed(1)}, ${medianY.toFixed(1)})`, 'info');
            }
            
            // Keep elements within reasonable distance from median
            // Use proportional threshold: larger canvas = larger threshold
            // For a 5000px canvas, allow 3000px radius; for 10000px canvas, allow 6000px radius
            const clusterThreshold = Math.max(origWidth, origHeight) * 0.6;
            const clusteredElements = workingSceneData.elements.filter(el => {
                // For line elements, calculate center from points bounding box
                let centerX, centerY;
                if (el.type === 'line' && el.points && el.points.length > 0) {
                    const xs = el.points.map(p => p[0]);
                    const ys = el.points.map(p => p[1]);
                    const minPx = Math.min(...xs);
                    const maxPx = Math.max(...xs);
                    const minPy = Math.min(...ys);
                    const maxPy = Math.max(...ys);
                    centerX = el.x + (minPx + maxPx) / 2;
                    centerY = el.y + (minPy + maxPy) / 2;
                } else {
                    centerX = el.x + (el.width || 0) / 2;
                    centerY = el.y + (el.height || 0) / 2;
                }
                
                const distance = Math.sqrt(
                    Math.pow(centerX - medianX, 2) + Math.pow(centerY - medianY, 2)
                );
                
                if (log && distance > clusterThreshold) {
                    log(`   - 🗑️ Removing outlier: ${el.type} at (${el.x.toFixed(0)}, ${el.y.toFixed(0)}), ${distance.toFixed(0)}px from center`, 'warn');
                }
                
                return distance <= clusterThreshold;
            });
            
            const removedCount = workingSceneData.elements.length - clusteredElements.length;
            workingSceneData.elements = clusteredElements;
            
            if (log) {
                log(`   ✅ Removed ${removedCount} outlier(s), kept ${clusteredElements.length} elements`, 'success');
                log(`   - Kept element types: ${clusteredElements.map(e => e.type).join(', ')}`, 'info');
            }
            
            console.log('[SVGConverter] After outlier filtering:', {
                total: clusteredElements.length,
                types: clusteredElements.reduce((acc, el) => {
                    acc[el.type] = (acc[el.type] || 0) + 1;
                    return acc;
                }, {}),
                firstElement: {
                    type: clusteredElements[0]?.type,
                    isDeleted: clusteredElements[0]?.isDeleted,
                    id: clusteredElements[0]?.id,
                    x: clusteredElements[0]?.x,
                    y: clusteredElements[0]?.y,
                    points: clusteredElements[0]?.points
                },
                deletedCount: clusteredElements.filter(e => e.isDeleted).length
            });
        }
    }
    
    // BOUNDS CALCULATION: Calculate correct bounds, but DON'T center elements
    // (Centering breaks line elements because their points are relative to x/y)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let originalBounds = null;
    
    if (log) {
        log(`\n🔍 BOUNDS CALCULATION START:`, 'info');
        log(`   - workingSceneData.elements exists: ${!!workingSceneData.elements}`, 'info');
        log(`   - Element count: ${workingSceneData.elements?.length || 0}`, 'info');
    }
    
    const showCount = workingSceneData.elements?.length <= 10 ? workingSceneData.elements.length : 5;
    
    if (workingSceneData.elements && workingSceneData.elements.length > 0) {
        // Find the minimum and maximum x and y coordinates
        // Use SIMPLE bounds (el.x + el.width) - the complex line points calculation has bugs
        workingSceneData.elements.forEach((el, idx) => {
            if (el.x !== undefined && el.y !== undefined) {
                // Simple bounds: just use element position and dimensions
                // This works reliably for all element types including lines
                const elMinX = el.x;
                const elMinY = el.y;
                const elMaxX = el.x + (el.width || 0);
                const elMaxY = el.y + (el.height || 0);
                
                if (log && idx < showCount) {
                    log(`   - Element #${idx} (${el.type}): pos=(${el.x.toFixed(1)}, ${el.y.toFixed(1)}) size=(${(el.width || 0).toFixed(1)} × ${(el.height || 0).toFixed(1)})`, 'info');
                }
                
                minX = Math.min(minX, elMinX);
                minY = Math.min(minY, elMinY);
                maxX = Math.max(maxX, elMaxX);
                maxY = Math.max(maxY, elMaxY);
            }
        });
        
        if (log) {
            log(`   ✓ Processed all ${workingSceneData.elements.length} elements for bounds calculation`, 'info');
            log(`   📏 Raw bounds: minX=${minX.toFixed(1)}, maxX=${maxX.toFixed(1)}, width=${(maxX-minX).toFixed(1)}`, 'info');
        }
    }
    
    // Store ORIGINAL bounds - this is the CORRECT calculation
    originalBounds = {
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY,
        width: maxX - minX,
        height: maxY - minY
    };
    
    if (log && workingSceneData.elements) {
        log(`\n📊 ORIGINAL content bounds (CORRECT calculation):`, 'info');
        log(`      - Total elements: ${workingSceneData.elements.length}`, 'info');
        log(`      - Bounds: (${minX.toFixed(1)}, ${minY.toFixed(1)}) to (${maxX.toFixed(1)}, ${maxY.toFixed(1)})`, 'info');
        log(`      - Size: ${(maxX - minX).toFixed(1)} × ${(maxY - minY).toFixed(1)}`, 'info');
        
        // Count elements by type
        const typeCount = {};
        workingSceneData.elements.forEach(el => {
            typeCount[el.type] = (typeCount[el.type] || 0) + 1;
        });
        log(`      - Element types: ${JSON.stringify(typeCount)}`, 'info');
    }
    
    // DON'T CENTER ELEMENTS!
    // Centering breaks line elements because their points array is relative to (x, y)
    // Instead, we'll just fix the viewBox after Excalidraw exports
    if (log) {
        log(`\n🎯 SKIPPING CENTERING (preserves line point coordinates)`, 'info');
        log(`   - Elements will stay at original positions: (${minX.toFixed(1)}, ${minY.toFixed(1)}) to (${maxX.toFixed(1)}, ${maxY.toFixed(1)})`, 'info');
        log(`   - We'll fix viewBox after export to match these coordinates`, 'info');
    }
    
    // No need for final bounds calculation - Excalidraw will handle it correctly now
    // that elements are centered using our correct bounds
    
    if (log) {
        log(`🔧 DEBUG: Preparing to export SVG...`, 'info');
        log(`   - Elements: ${workingSceneData.elements?.length || 0}`, 'info');
        log(`   - Files: ${Object.keys(workingSceneData.files || {}).length}`, 'info');
        log(`   - Export scale: ${EXPORT_SCALE}`, 'info');
        log(`   - For preview: ${forPreview}`, 'info');
        
        // Calculate canvas bounds from elements
        if (workingSceneData.elements && workingSceneData.elements.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            let leftmost = null, rightmost = null, topmost = null, bottommost = null;
            
            workingSceneData.elements.forEach((el, idx) => {
                if (el.x !== undefined && el.y !== undefined) {
                    const elRight = el.x + (el.width || 0);
                    const elBottom = el.y + (el.height || 0);
                    
                    // Track which elements create the bounds
                    if (el.x < minX) {
                        minX = el.x;
                        leftmost = { idx, type: el.type, x: el.x, y: el.y, width: el.width, height: el.height };
                    }
                    if (el.y < minY) {
                        minY = el.y;
                        topmost = { idx, type: el.type, x: el.x, y: el.y, width: el.width, height: el.height };
                    }
                    if (elRight > maxX) {
                        maxX = elRight;
                        rightmost = { idx, type: el.type, x: el.x, y: el.y, width: el.width, height: el.height };
                    }
                    if (elBottom > maxY) {
                        maxY = elBottom;
                        bottommost = { idx, type: el.type, x: el.x, y: el.y, width: el.width, height: el.height };
                    }
                }
            });
            
            const canvasWidth = maxX - minX;
            const canvasHeight = maxY - minY;
            log(`   📐 Canvas bounds (after centering):`, 'info');
            log(`      - Min: (${minX.toFixed(1)}, ${minY.toFixed(1)})`, 'info');
            log(`      - Max: (${maxX.toFixed(1)}, ${maxY.toFixed(1)})`, 'info');
            log(`      - Canvas size: ${canvasWidth.toFixed(1)} × ${canvasHeight.toFixed(1)}`, 'info');
            
            log(`      - ✓ Canvas size: ${canvasWidth.toFixed(1)} × ${canvasHeight.toFixed(1)}`, 'success');
            log(`      - Aspect ratio: ${(canvasWidth / canvasHeight).toFixed(3)}`, 'info');
        }
        
        // Debug image elements sizing
        const imageElements = workingSceneData.elements?.filter(el => el.type === 'image') || [];
        if (imageElements.length > 0) {
            log(`   🖼️ Image elements sizing (after centering):`, 'info');
            imageElements.forEach((el, idx) => {
                log(`      Image #${idx + 1}:`, 'info');
                log(`         - Position: (${el.x}, ${el.y})`, 'info');
                log(`         - Size: ${el.width} × ${el.height}`, 'info');
                log(`         - Aspect ratio: ${(el.width / el.height).toFixed(3)}`, 'info');
                log(`         - Scale: ${el.scale ? `[${el.scale[0]}, ${el.scale[1]}]` : 'none'}`, 'info');
                log(`         - Angle: ${el.angle || 0}°`, 'info');
            });
        }
        
        // Debug files being passed to Excalidraw
        if (workingSceneData.files && Object.keys(workingSceneData.files).length > 0) {
            log(`   📦 Files being passed to Excalidraw export:`, 'info');
            Object.entries(workingSceneData.files).forEach(([fileId, file]) => {
                const hasValidData = file.dataURL && file.dataURL.length > 100;
                log(`      - ${fileId}: ${file.name || 'unnamed'} [${hasValidData ? 'HAS DATA' : 'NO DATA'}]`, hasValidData ? 'success' : 'error');
                if (hasValidData) {
                    log(`         Data size: ${(file.dataURL.length / 1024).toFixed(1)}KB`, 'info');
                }
            });
        }
    }
    
    // Suppress console warnings during SVG generation
    const originalWarn = console.warn;
    const originalError = console.error;
    const warnings = [];
    const errors = [];
    
    console.warn = (...args) => {
        // Capture warnings for debugging
        if (log && !args[0]?.includes?.('font-family') && !args[0]?.includes?.('registered fonts')) {
            warnings.push(args[0]);
        }
        // Suppress font-family warnings from Excalidraw
        if (args[0]?.includes?.('font-family') || args[0]?.includes?.('registered fonts')) {
            return;
        }
        originalWarn(...args);
    };
    console.error = (...args) => {
        // Capture errors for debugging
        if (log && !args[0]?.includes?.('font-family') && !args[0]?.includes?.('registered fonts')) {
            errors.push(args[0]);
        }
        // Suppress font-family errors from Excalidraw
        if (args[0]?.includes?.('font-family') || args[0]?.includes?.('registered fonts')) {
            return;
        }
        originalError(...args);
    };
    
    try {
        //DEBUG: Verify elements were actually modified
        if (log && workingSceneData.elements && workingSceneData.elements.length > 0) {
            const firstEl = workingSceneData.elements[0];
            log(`\n🔍 FINAL CHECK before export:`, 'info');
            log(`   - First element position: (${firstEl.x?.toFixed(1)}, ${firstEl.y?.toFixed(1)})`, 'info');
            log(`   - First element type: ${firstEl.type}`, 'info');
            log(`   - First element version: ${firstEl.version}`, 'info');
            log(`   - Total elements being passed to exportToSvg: ${workingSceneData.elements.length}`, 'info');
        }
        
        // Calculate explicit bounds INCLUDING stroke widths and transforms
        let boundsMinX = Infinity, boundsMinY = Infinity, boundsMaxX = -Infinity, boundsMaxY = -Infinity;
        workingSceneData.elements.forEach(el => {
            if (el.x !== undefined && el.y !== undefined) {
                // Account for stroke width (half on each side)
                const strokeWidth = el.strokeWidth || 1;
                const padding = strokeWidth * 2; // Extra padding for safety
                
                // For line elements, calculate bounds from points
                if (el.type === 'line' && el.points && el.points.length > 0) {
                    const xs = el.points.map(p => el.x + p[0]);
                    const ys = el.points.map(p => el.y + p[1]);
                    boundsMinX = Math.min(boundsMinX, Math.min(...xs) - padding);
                    boundsMinY = Math.min(boundsMinY, Math.min(...ys) - padding);
                    boundsMaxX = Math.max(boundsMaxX, Math.max(...xs) + padding);
                    boundsMaxY = Math.max(boundsMaxY, Math.max(...ys) + padding);
                } else {
                    // For other elements, use x,y,width,height with stroke padding
                    boundsMinX = Math.min(boundsMinX, el.x - padding);
                    boundsMinY = Math.min(boundsMinY, el.y - padding);
                    boundsMaxX = Math.max(boundsMaxX, el.x + (el.width || 0) + padding);
                    boundsMaxY = Math.max(boundsMaxY, el.y + (el.height || 0) + padding);
                }
            }
        });
        
        if (log) {
            log(`   📐 Calculated export bounds (with stroke): (${boundsMinX.toFixed(1)}, ${boundsMinY.toFixed(1)}) to (${boundsMaxX.toFixed(1)}, ${boundsMaxY.toFixed(1)})`, 'info');
            log(`   📐 Canvas size: ${(boundsMaxX - boundsMinX).toFixed(1)} × ${(boundsMaxY - boundsMinY).toFixed(1)}`, 'info');
        }
        
        // ALWAYS export just the drawing content, ignoring canvas position
        // Calculate content bounds from FILTERED elements (workingSceneData)
        // CRITICAL: Must account for line elements with points array!
        let contentMinX = Infinity, contentMinY = Infinity, contentMaxX = -Infinity, contentMaxY = -Infinity;
        workingSceneData.elements.forEach(el => {
            // For line elements, calculate bounds from points
            if (el.type === 'line' && el.points && el.points.length > 0) {
                const xs = el.points.map(p => el.x + p[0]);
                const ys = el.points.map(p => el.y + p[1]);
                contentMinX = Math.min(contentMinX, Math.min(...xs));
                contentMinY = Math.min(contentMinY, Math.min(...ys));
                contentMaxX = Math.max(contentMaxX, Math.max(...xs));
                contentMaxY = Math.max(contentMaxY, Math.max(...ys));
            } else {
                // For other elements, use x,y,width,height
                contentMinX = Math.min(contentMinX, el.x);
                contentMinY = Math.min(contentMinY, el.y);
                contentMaxX = Math.max(contentMaxX, el.x + (el.width || 0));
                contentMaxY = Math.max(contentMaxY, el.y + (el.height || 0));
            }
        });
        
        // Move all FILTERED elements to origin by offsetting their positions
        const offsetX = -contentMinX;
        const offsetY = -contentMinY;
        const normalizedElements = workingSceneData.elements.map((el, idx) => {
            if (el.isDeleted) return el;
            return {
                ...el,
                id: `normalized-${idx}-${Date.now()}`,  // New ID to force fresh calculation
                x: el.x + offsetX,
                y: el.y + offsetY,
                version: 1  // Reset version for "new" element
            };
        });
        
        if (log) {
            log(`   🎯 Normalizing content to origin`, 'info');
            log(`      Original bounds: (${contentMinX.toFixed(0)}, ${contentMinY.toFixed(0)}) to (${contentMaxX.toFixed(0)}, ${contentMaxY.toFixed(0)})`, 'info');
            log(`      Offset applied: (${offsetX.toFixed(0)}, ${offsetY.toFixed(0)})`, 'info');
            log(`      Elements to normalize: ${workingSceneData.elements.length}`, 'info');
            log(`      First element BEFORE: (${workingSceneData.elements[0].x.toFixed(0)}, ${workingSceneData.elements[0].y.toFixed(0)})`, 'info');
            log(`      First element AFTER: (${normalizedElements[0].x.toFixed(0)}, ${normalizedElements[0].y.toFixed(0)})`, 'info');
        }
        
        const exportConfig = {
            elements: normalizedElements,
            appState: { 
                // DON'T spread sceneData.appState - it has bad viewport info!
                // Create fresh appState for normalized elements
                exportBackground: false, 
                viewBackgroundColor: 'transparent', 
                exportScale: EXPORT_SCALE
                // DON'T use exportEmbedScene - it causes Excalidraw to use cached viewport data
            },
            files: sceneData.files || {},
            exportPadding: exportPadding,
        };
        
        if (log) {
            log(`   ⏳ Calling ExcalidrawModule.exportToSvg()...`, 'info');
            log(`   📍 First NORMALIZED element: (${normalizedElements[0]?.x?.toFixed(0)}, ${normalizedElements[0]?.y?.toFixed(0)}) id=${normalizedElements[0]?.id}`, 'info');
        }
        
        const firstEl = normalizedElements[0];  // Use normalized elements for logging!
        const exportCallData = {
            type: firstEl?.type,
            x: firstEl?.x,
            y: firstEl?.y,
            version: firstEl?.version,
            totalElements: normalizedElements.length,
            isDeleted: firstEl?.isDeleted,
            points: firstEl?.points ? `${firstEl.points.length} points` : 'none',
            hasWidth: firstEl?.width !== undefined,
            hasHeight: firstEl?.height !== undefined
        };
        console.log('[SVGConverter] Calling exportToSvg with NORMALIZED first element:', exportCallData);
        
        // Store in global
        if (!window.__svgConverterConsoleLogs) window.__svgConverterConsoleLogs = [];
        window.__svgConverterConsoleLogs.push({ 
            timestamp: Date.now(), 
            type: 'export-call', 
            data: exportCallData 
        });
        
        // SIMPLE EXPORT: Just export everything at once (like AssetsLibrary does)
        // No chunking needed - Excalidraw handles it fine!
        let finalSvg;
        
        if (false) { // Chunking disabled - not needed!
            // Export in chunks and combine
            // CRITICAL: Pass the ORIGINAL bounds to each chunk so they maintain global coordinates
            const chunks = [];
            for (let i = 0; i < workingSceneData.elements.length; i += CHUNK_SIZE) {
                const chunkElements = workingSceneData.elements.slice(i, i + CHUNK_SIZE);
                
                // Pass scrollX/scrollY to maintain global coordinate system
                const chunkConfig = {
                    ...exportConfig,
                    elements: chunkElements,
                    appState: {
                        ...exportConfig.appState,
                        // These help Excalidraw maintain the global coordinate space
                        scrollX: -originalBounds.minX,
                        scrollY: -originalBounds.minY,
                        zoom: { value: 1 }
                    }
                };
                
                if (log) {
                    log(`   - Exporting chunk ${chunks.length + 1}: elements ${i} to ${Math.min(i + CHUNK_SIZE, workingSceneData.elements.length)}`, 'info');
                }
                
                const chunkSvg = await ExcalidrawModule.exportToSvg(chunkConfig);
                chunks.push(chunkSvg);
            }
            
            // Combine chunks into one SVG
            if (log) {
                log(`\n🔗 COMBINING ${chunks.length} CHUNKS:`, 'success');
            }
            
            // Use first chunk as base
            finalSvg = chunks[0].cloneNode(true);
            const baseGroup = finalSvg.querySelector('g');
            
            // Extract paths from other chunks and add to base
            for (let i = 1; i < chunks.length; i++) {
                const chunkPaths = chunks[i].querySelectorAll('path, line, circle, ellipse, text');
                chunkPaths.forEach(path => {
                    baseGroup.appendChild(path.cloneNode(true));
                });
                
                if (log) {
                    log(`   - Added ${chunkPaths.length} elements from chunk ${i + 1}`, 'info');
                }
            }
            
            // Set viewBox to encompass ALL original bounds
            const correctViewBox = `${originalBounds.minX - exportPadding} ${originalBounds.minY - exportPadding} ${originalBounds.width + (exportPadding * 2)} ${originalBounds.height + (exportPadding * 2)}`;
            finalSvg.setAttribute('viewBox', correctViewBox);
            
            // Remove ALL transforms completely - we're using original coordinates with correct viewBox
            const allGroupsWithTransform = finalSvg.querySelectorAll('g[transform]');
            allGroupsWithTransform.forEach(g => {
                g.removeAttribute('transform');
            });
            
            if (log) {
                log(`   ✅ Combined SVG with viewBox: ${correctViewBox}`, 'success');
                log(`   ✅ Completely removed ${allGroupsWithTransform.length} transform attribute(s)`, 'success');
            }
        } else {
            // Standard export for small files
            finalSvg = await ExcalidrawModule.exportToSvg(exportConfig);
        }
        
        // Embed custom fonts in the SVG
        const fontEmbedCheck = {
            hasFontDataMap: !!fontDataMap,
            fontCount: fontDataMap ? Object.keys(fontDataMap).length : 0,
            hasSvg: !!finalSvg,
            hasElements: !!normalizedElements,
            elementCount: normalizedElements ? normalizedElements.length : 0
        };
        console.log('[SVGConverter] 🔤 Font embedding check:', fontEmbedCheck);
        if (log) {
            log(`🔤 Font embedding: ${fontEmbedCheck.fontCount} fonts, ${fontEmbedCheck.elementCount} elements`, 'info');
        }
        
        if (fontDataMap && Object.keys(fontDataMap).length > 0) {
            try {
                if (log) log('   🔤 Embedding fonts in SVG...', 'info');
                finalSvg = embedFontsInSvg(finalSvg, fontDataMap, normalizedElements, log);
                console.log('[SVGConverter] ✅ Fonts embedded in SVG');
                if (log) log('   ✅ Font embedding complete!', 'success');
            } catch (fontError) {
                console.error('[SVGConverter] ❌ Font embedding failed:', fontError);
                if (log) {
                    log(`   ❌ Font embedding failed: ${fontError.message}`, 'error');
                }
            }
        } else {
            console.log('[SVGConverter] 🔤 Skipping font embedding (no fonts loaded)');
            if (log) log('   ⚠️ No fonts loaded, skipping font embedding', 'warning');
        }
        
        const transform = finalSvg.querySelector('g[transform]')?.getAttribute('transform');
        const viewBox = finalSvg.getAttribute('viewBox');
        const svgWidth = finalSvg.getAttribute('width');
        const svgHeight = finalSvg.getAttribute('height');
        
        // Check what's actually in the SVG
        const allGroups = finalSvg.querySelectorAll('g');
        const allPaths = finalSvg.querySelectorAll('path');
        const allLines = finalSvg.querySelectorAll('line');
        const allCircles = finalSvg.querySelectorAll('circle');
        const allEllipses = finalSvg.querySelectorAll('ellipse');
        
        console.log('[SVGConverter] exportToSvg returned:', {
            transform: transform || 'none',
            viewBox,
            size: `${svgWidth}×${svgHeight}`,
            elements: {
                groups: allGroups.length,
                paths: allPaths.length,
                lines: allLines.length,
                circles: allCircles.length,
                ellipses: allEllipses.length
            }
        });
        
        // Store in global
        window.__svgConverterConsoleLogs.push({ 
            timestamp: Date.now(), 
            type: 'export-result', 
            data: { 
                transform, 
                viewBox, 
                width: svgWidth, 
                height: svgHeight,
                elementCounts: {
                    groups: allGroups.length,
                    paths: allPaths.length,
                    lines: allLines.length,
                    circles: allCircles.length,
                    ellipses: allEllipses.length
                }
            } 
        });
        
        if (log) {
            log(`   ✓ SVG DOM element created`, 'success');
            log(`   - Returning modified sceneData with ${workingSceneData.elements.length} elements`, 'info');
            
            // DEBUG: Check the actual SVG transform to see what Excalidraw rendered
            const firstG = finalSvg.querySelector('g[transform]');
            if (firstG) {
                const transform = firstG.getAttribute('transform');
                log(`   🔍 ACTUAL SVG transform (first <g>): ${transform}`, 'info');
                const translateMatch = transform.match(/translate\(([^)]+)\)/);
                if (translateMatch) {
                    log(`   🔍 Translation values: ${translateMatch[1]}`, translateMatch[1].includes('992') ? 'error' : 'success');
                }
            }
            if (warnings.length > 0) {
                log(`   ⚠️ Warnings during export: ${warnings.length}`, 'warning');
                warnings.forEach(w => log(`      - ${w}`, 'warning'));
            }
            if (errors.length > 0) {
                log(`   ❌ Errors during export: ${errors.length}`, 'error');
                errors.forEach(e => log(`      - ${e}`, 'error'));
            }
            
            // Debug SVG dimensions
            const svgWidthDebug = finalSvg.getAttribute('width');
            const svgHeightDebug = finalSvg.getAttribute('height');
            const viewBoxDebug = finalSvg.getAttribute('viewBox');
            log(`   📏 SVG dimensions:`, 'info');
            log(`      - Width attr: ${svgWidthDebug}`, 'info');
            log(`      - Height attr: ${svgHeightDebug}`, 'info');
            log(`      - ViewBox: ${viewBoxDebug || 'none'}`, 'info');
            
            // Check if SVG contains image elements and their dimensions
            const imageElements = finalSvg.querySelectorAll('image');
            log(`   🖼️ SVG contains ${imageElements.length} <image> element(s)`, imageElements.length > 0 ? 'success' : 'warning');
            imageElements.forEach((img, idx) => {
                const href = img.getAttribute('href') || img.getAttribute('xlink:href');
                const hrefPreview = href ? `${href.substring(0, 60)}...` : 'none';
                const imgX = img.getAttribute('x');
                const imgY = img.getAttribute('y');
                const imgW = img.getAttribute('width');
                const imgH = img.getAttribute('height');
                const transform = img.getAttribute('transform');
                log(`      Image #${idx + 1}:`, 'info');
                log(`         - Data: ${hrefPreview}`, 'info');
                log(`         - Position: x=${imgX}, y=${imgY}`, 'info');
                log(`         - Size: w=${imgW}, h=${imgH}`, 'info');
                log(`         - Transform: ${transform || 'none'}`, 'info');
                if (imgW && imgH) {
                    log(`         - Aspect: ${(parseFloat(imgW) / parseFloat(imgH)).toFixed(3)}`, 'info');
                }
            });
        }
        
        // Final SVG info
        if (log) {
            const excalidrawViewBox = finalSvg.getAttribute('viewBox');
            const mainGroup = finalSvg.querySelector('g[transform]');
            const oldTransform = mainGroup?.getAttribute('transform');
            
            log(`\n✅ FINAL SVG (STANDARD):`, 'success');
            log(`   - ViewBox: ${excalidrawViewBox}`, 'info');
            log(`   - Transform: ${oldTransform || 'none'}`, 'info');
            
            // Check if content is likely cropped
            const [, , vbW, vbH] = excalidrawViewBox.split(' ').map(v => parseFloat(v));
            const expectedW = originalBounds.width;
            const expectedH = originalBounds.height;
            const cropPercent = ((expectedW * expectedH) - (vbW * vbH)) / (expectedW * expectedH) * 100;
            
            if (cropPercent > 10) {
                log(`\n⚠️ WARNING: CONTENT LIKELY CROPPED!`, 'error');
                log(`   - Expected size: ${expectedW.toFixed(0)}×${expectedH.toFixed(0)}`, 'error');
                log(`   - Actual viewBox: ${vbW.toFixed(0)}×${vbH.toFixed(0)}`, 'error');
                log(`   - Estimated cropping: ${cropPercent.toFixed(1)}% of content may be missing`, 'error');
                log(`\n💡 WORKAROUND: This is a known Excalidraw library bug with large files.`, 'warning');
                log(`   1. Open this file in Obsidian Excalidraw plugin`, 'info');
                log(`   2. Use Excalidraw's built-in "Export as SVG" option`, 'info');
                log(`   3. Or split your drawing into smaller files (<3000 elements each)`, 'info');
            }
        }
        
        // Use scalable version for preview, fixed version for saving
        // For preview: keep Excalidraw's viewBox (includes transforms/positioning)
        // For saving: fix viewBox to originalBounds (removes padding, sets exact dimensions)
        console.log('[SVGConverter] BEFORE processing - originalBounds:', originalBounds);
        console.log('[SVGConverter] BEFORE processing - viewBox:', finalSvg.getAttribute('viewBox'));
        
        const processedSvg = forPreview ? makeSVGScalable(finalSvg) : fixSVGDimensions(finalSvg, originalBounds);
        
        console.log('[SVGConverter] AFTER processing - viewBox:', processedSvg.getAttribute('viewBox'));
        
        if (log) {
            log(`   🔧 Processing SVG (forPreview: ${forPreview})`, 'info');
            if (!forPreview && originalBounds) {
                log(`      - Using CORRECT bounds: ${originalBounds.width.toFixed(1)}×${originalBounds.height.toFixed(1)}`, 'success');
            }
            log(`      - SVG width attr BEFORE: ${finalSvg.getAttribute('width')}`, 'info');
            log(`      - SVG height attr BEFORE: ${finalSvg.getAttribute('height')}`, 'info');
            log(`      - SVG width attr AFTER: ${processedSvg.getAttribute('width') || 'removed'}`, 'info');
            log(`      - SVG height attr AFTER: ${processedSvg.getAttribute('height') || 'removed'}`, 'info');
            log(`      - SVG viewBox: ${processedSvg.getAttribute('viewBox')}`, 'info');
        }
        
        // Add background if requested - MUST use SVG's actual viewBox!
        if (addBackground) {
            console.log(`[SVGConverter] 🎨 Adding background (forPreview=${forPreview}):`, backgroundColor);
            if (log) log(`   🎨 Adding background (${backgroundColor}, forPreview=${forPreview})...`, 'info');
            
            // CRITICAL: Use the SVG's viewBox dimensions (which Excalidraw sets correctly)
            // The viewBox includes space for all transforms and positioned content
            // Background must match the ENTIRE viewBox to fill the canvas
            let x, y, width, height;
            
            const viewBoxAttr = processedSvg.getAttribute('viewBox');
            if (viewBoxAttr) {
                [x, y, width, height] = viewBoxAttr.split(' ').map(parseFloat);
                console.log(`[SVGConverter] 🎨 Using viewBox dimensions:`, { x, y, width, height });
            } else {
                // Fallback to 100x100 if no viewBox (shouldn't happen)
                [x, y, width, height] = [0, 0, 100, 100];
                console.log(`[SVGConverter] 🎨 WARNING: No viewBox found, using fallback:`, { width, height });
            }
            
            console.log(`[SVGConverter] 🎨 [forPreview=${forPreview}] Background rect:`, { x, y, width, height });
            
            // Create background rectangle with EXACT dimensions from viewBox
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('x', String(x));
            bgRect.setAttribute('y', String(y));
            bgRect.setAttribute('width', String(width));
            bgRect.setAttribute('height', String(height));
            bgRect.setAttribute('fill', backgroundColor);
            bgRect.setAttribute('id', 'user-background');
            
            console.log('[SVGConverter] 🎨 Background rect created with attributes:', {
                x: bgRect.getAttribute('x'),
                y: bgRect.getAttribute('y'),
                width: bgRect.getAttribute('width'),
                height: bgRect.getAttribute('height'),
                fill: bgRect.getAttribute('fill')
            });
            
            // Insert as first child (behind all other elements)
            if (processedSvg.firstChild) {
                processedSvg.insertBefore(bgRect, processedSvg.firstChild);
            } else {
                processedSvg.appendChild(bgRect);
            }
            
            // Verify it was inserted correctly
            const insertedRect = processedSvg.querySelector('#user-background');
            console.log('[SVGConverter] 🎨 Background rect AFTER insertion:', {
                found: !!insertedRect,
                width: insertedRect?.getAttribute('width'),
                height: insertedRect?.getAttribute('height')
            });
            
            console.log('[SVGConverter] ✅ Added background rectangle with FINAL dimensions');
            if (log) log(`      ✅ Background added (${backgroundColor})`, 'success');
        }
        
        const svgString = new XMLSerializer().serializeToString(processedSvg);
        
        if (log) {
            log(`   📏 Final SVG size: ${svgString.length} bytes`, 'success');
            
            // Verify font embedding in output
            const hasFontFace = svgString.includes('@font-face');
            const hasStyleTag = svgString.includes('<style');
            const hasDefs = svgString.includes('<defs');
            if (hasFontFace) {
                log(`   ✅ Font embedding verified in output SVG`, 'success');
            } else if (fontDataMap && Object.keys(fontDataMap).length > 0) {
                log(`   ⚠️ Fonts were loaded but NOT found in output SVG!`, 'warning');
                log(`      - Has <defs>: ${hasDefs}`, 'warning');
                log(`      - Has <style>: ${hasStyleTag}`, 'warning');
            }
        }
        
        if (!svgString || svgString.length < 200) {
            throw new Error("Generated SVG is invalid or too small.");
        }
        
        return { svgString, modifiedSceneData: workingSceneData, correctBounds: originalBounds };
    } finally {
        // Restore original console methods
        console.warn = originalWarn;
        console.error = originalError;
    }
}

async function saveSVGFile(filePath, svgString) {
    const svgPath = filePath.replace(/\.md$/i, '.svg');
    await app.vault.adapter.write(svgPath, svgString);
    return svgPath;
}


// =================================================================================
//  HOOK: Full Tab Effect
// =================================================================================
function useFullTabEffect(containerRef, isFullTab) {
    const stateRefs = useRef({}).current;
    
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        
        const timer = setTimeout(() => {
            const targetPane = findNearestAncestorWithClass(container, 'workspace-leaf-content');
            if (!targetPane) return;
            
            const contentWrapper = findDirectChildByClass(targetPane, 'view-content') || targetPane;
            stateRefs.originalParent = container.parentNode;
            stateRefs.placeholder = document.createElement('div');
            
            if (container.parentNode) {
                container.parentNode.insertBefore(stateRefs.placeholder, container);
            }
            
            const originalPosition = window.getComputedStyle(contentWrapper).position;
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position
            };
            
            if (originalPosition === 'static') {
                contentWrapper.style.position = 'relative';
            }
            
            contentWrapper.appendChild(container);
            Object.assign(container.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '9998'
            });
        }, 50);
        
        return () => {
            clearTimeout(timer);
            if (!stateRefs.originalParent || !container) return;
            
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
            } else if (stateRefs.originalParent) {
                stateRefs.originalParent.appendChild(container);
            }
            
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || '';
            }
            
            container.removeAttribute('style');
            Object.keys(stateRefs).forEach(k => delete stateRefs[k]);
        };
    }, [isFullTab, containerRef]);
}

// =================================================================================
//  COMPONENT: Welcome Page & EnigmaticGlyphs
// =================================================================================
function WelcomeView({ onProceed }) {
    const containerStyle = { height: "100%", width: "100%", padding: "40px", border: `1px solid ${THEME.colors.border}`, borderRadius: THEME.borderRadius, background: THEME.colors.background, backdropFilter: 'blur(4px)', color: THEME.colors.textNormal, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', userSelect: 'none', boxShadow: THEME.shadows.main, fontFamily: THEME.fontFamily };
    const h1Style = { marginBottom: '15px', fontWeight: 700, fontSize: '2.5em', color: THEME.colors.accent, textShadow: THEME.shadows.accent, fontVariant: 'small-caps', letterSpacing: '1.5px' };
    const pStyle = { color: THEME.colors.textMuted, margin: 0, lineHeight: 1.6, maxWidth: '450px', fontSize: '16px' };
    const buttonStyle = { padding: '12px 30px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: 'transparent', color: THEME.colors.accent, border: `1px solid ${THEME.colors.border}`, borderRadius: '6px', marginTop: '40px', transition: 'all 0.2s ease' };
    return ( <div style={containerStyle}> <h1 style={h1Style}>Matrix Attunement</h1> <p style={pStyle}>A one-time synchronization is required to calibrate the asset reality-matrix.</p> <button onClick={onProceed} style={buttonStyle} onMouseOver={e => { e.currentTarget.style.background = THEME.colors.accent; e.currentTarget.style.color = THEME.colors.accentText; e.currentTarget.style.boxShadow = THEME.shadows.accent; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = THEME.colors.accent; e.currentTarget.style.boxShadow = 'none'; }}> Begin Attunement </button> </div> );
}
function EnigmaticGlyphs({ progress, count = 7 }) {
    const activeCount = Math.floor((progress / 100) * count);
    const accentColor = THEME.colors.accent;
    const glyphs = Array.from({ length: count }).map((_, index) => {
        const isActive = index < activeCount;
        const isPulsing = index === activeCount && progress < 100;
        const style = { display: 'inline-block', margin: '0 10px', fontSize: '28px', color: isActive ? accentColor : THEME.colors.textMuted, textShadow: isActive ? `0 0 12px ${accentColor}` : 'none', transition: 'color 0.5s ease, text-shadow 0.5s ease', animation: isPulsing ? 'pulse 1.5s infinite ease-in-out' : 'none' };
        return <span key={index} style={style}>✧</span>;
    });
    const keyframes = ` @keyframes pulse { 0% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.6; transform: scale(1); } } `;
    return ( <div> <style>{keyframes}</style> <div style={{ margin: '40px 0' }}>{glyphs}</div> </div> );
}


// =================================================================================
//  COMPONENT: SVG Preview with Direct DOM Updates (Optimized)
// =================================================================================
function SVGPreviewContainer({ svgPreview, currentFile, dependencyGraph, fileQueue, currentIndex }) {
    const svgContainerRef = useRef(null);
    const prevSvgRef = useRef(null);
    
    const previewContainerStyle = useMemo(() => ({ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        border: `1px solid ${THEME.colors.border}`, 
        borderRadius: '6px', 
        background: 'rgba(255, 255, 255, 0.02)', 
        padding: '20px', 
        overflow: 'auto',
        position: 'relative'
    }), []);
    
    const svgBoxStyle = useMemo(() => ({
        width: 'min(500px, 85%)',
        height: 'min(500px, 45vh)',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px dashed ${THEME.colors.border}`,
        borderRadius: '4px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.2)',
        overflow: 'visible',
        position: 'relative'
    }), []);

    // Only update SVG container when SVG actually changes (direct DOM manipulation)
    useEffect(() => {
        if (svgContainerRef.current && svgPreview?.svgString && prevSvgRef.current !== svgPreview.svgString) {
            svgContainerRef.current.innerHTML = svgPreview.svgString;
            prevSvgRef.current = svgPreview.svgString;
        }
    }, [svgPreview?.svgString]);

    if (!svgPreview) {
        return (
            <div style={previewContainerStyle}>
                <p style={{ color: THEME.colors.textMuted, fontStyle: 'italic' }}>
                    Processing...
                </p>
            </div>
        );
    }

    return (
        <div style={previewContainerStyle}>
            <div style={{ marginBottom: '15px', textAlign: 'center', width: '100%' }}>
                <h3 style={{ color: THEME.colors.textNormal, margin: 0, marginBottom: '5px' }}>
                    {currentFile}
                </h3>
                <p style={{ color: THEME.colors.textMuted, fontSize: '12px', margin: 0 }}>
                    {svgPreview.skipped ? `Skipped: ${svgPreview.reason}` : 
                     svgPreview.error ? `Error: ${svgPreview.errorMessage}` : 
                     'Review the SVG output below'}
                </p>
                {dependencyGraph && fileQueue[currentIndex] && (() => {
                    const filePath = fileQueue[currentIndex];
                    const node = dependencyGraph.get(filePath);
                    if (node && node.deps && node.deps.length > 0) {
                        const depNames = node.deps.map(p => p.split('/').pop().replace(/\.md$/, '.svg'));
                        return (
                            <p style={{ color: THEME.colors.accent, fontSize: '11px', margin: '5px 0 0 0', fontStyle: 'italic' }}>
                                📦 Requires: {depNames.join(', ')}
                            </p>
                        );
                    }
                    return null;
                })()}
            </div>
            <div 
                ref={svgContainerRef}
                className="svg-preview-container"
                style={svgBoxStyle}
            />
        </div>
    );
}

// =================================================================================
//  COMPONENT: Debug Console (Optimized)
// =================================================================================
function DebugConsole({ logs, showDebugConsole, onToggle, onCopyLog }) {
    const logContainerRef = useRef(null);
    
    // Only auto-scroll when new logs are added
    useEffect(() => {
        if (logContainerRef.current && showDebugConsole) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs.length, showDebugConsole]);

    const colorMap = useMemo(() => ({ 
        error: THEME.colors.error, 
        success: THEME.colors.success, 
        warning: THEME.colors.warning, 
        info: THEME.colors.textNormal 
    }), []);

    return (
        <div style={{ marginTop: '15px', borderTop: `1px solid ${THEME.colors.border}`, paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
                <button 
                    onClick={onToggle} 
                    style={{ 
                        background: 'transparent', 
                        border: `1px solid ${THEME.colors.border}`, 
                        borderRadius: '4px',
                        color: THEME.colors.accent, 
                        cursor: 'pointer', 
                        fontSize: '12px', 
                        padding: '6px 12px',
                        fontWeight: 600,
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = THEME.colors.accentBg}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                    {showDebugConsole ? '▼ Hide Log' : '▶ Show Log'} ({logs.length})
                </button>
                <button 
                    onClick={onCopyLog}
                    style={{ 
                        background: 'transparent', 
                        border: `1px solid ${THEME.colors.border}`, 
                        borderRadius: '4px',
                        color: THEME.colors.textMuted, 
                        cursor: 'pointer', 
                        fontSize: '11px', 
                        padding: '6px 12px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.background = THEME.colors.accentBg;
                        e.currentTarget.style.color = THEME.colors.accent;
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = THEME.colors.textMuted;
                    }}
                >
                    📋 Copy Log
                </button>
            </div>
            {showDebugConsole && (
                <div 
                    ref={logContainerRef}
                    style={{ 
                        height: '200px', 
                        background: THEME.colors.backgroundConsole, 
                        border: `1px solid ${THEME.colors.border}`, 
                        borderRadius: '6px', 
                        padding: '12px', 
                        overflowY: 'auto', 
                        fontSize: '11px',
                        fontFamily: 'ui-monospace, monospace',
                        lineHeight: '1.6'
                    }}>
                    {logs.length === 0 && (
                        <div style={{ color: THEME.colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingTop: '20px' }}>
                            No logs yet...
                        </div>
                    )}
                    {logs.map((l, i) => (
                        <div 
                            key={`${l.t}-${i}`} 
                            style={{ 
                                marginBottom: '6px',
                                paddingBottom: '6px',
                                borderBottom: i < logs.length - 1 ? `1px solid ${THEME.colors.border}40` : 'none',
                                display: 'flex',
                                gap: '10px'
                            }}
                        >
                            <span style={{ 
                                color: THEME.colors.textMuted, 
                                fontSize: '10px',
                                flexShrink: 0,
                                opacity: 0.7
                            }}>
                                {new Date(l.t).toLocaleTimeString()}
                            </span>
                            <span style={{ 
                                color: colorMap[l.kind] || colorMap.info,
                                wordBreak: 'break-word',
                                flex: 1
                            }}>
                                {l.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =================================================================================
//  COMPONENT: ManualProcessorView (Manual Preview & Approval)
// =================================================================================
const MAX_LOG_ENTRIES = 1000;
function logReducer(state, action) {
    switch (action.type) { 
        case 'ADD_LOG': return [...state, { t: Date.now(), ...action.payload }].slice(-MAX_LOG_ENTRIES); // Add to END, keep last N
        case 'CLEAR_LOGS': return []; 
        default: return state; 
    }
}

function ManualProcessorView({ onComplete }) {
    const [phase, setPhase] = useState('loading'); // loading, ready, processing, preview, complete
    const [currentFile, setCurrentFile] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [svgPreview, setSvgPreview] = useState(null);
    const [fileQueue, setFileQueue] = useState([]);
    const [dependencyGraph, setDependencyGraph] = useState(null);
    const [stats, setStats] = useState({ processed: 0, skipped: 0, errors: 0 });
    const [logs, dispatchLog] = useReducer(logReducer, []);
    const [showDebugConsole, setShowDebugConsole] = useState(true); // Default to showing console for debugging
    const [autoProcess, setAutoProcess] = useState(false); // Auto-process mode
    const [pausedOnError, setPausedOnError] = useState(false); // Paused due to error
    const [processHistory, setProcessHistory] = useState([]); // Track processed files for back navigation
    const [lastProcessedData, setLastProcessedData] = useState(null); // Store last processed SVG data
    const [exportPadding, setExportPadding] = useState(EXPORT_PADDING); // Configurable padding
    const [addBackground, setAddBackground] = useState(false); // Toggle for adding background
    const [backgroundColor, setBackgroundColor] = useState('#000000'); // Background color (default black)
    const depsRef = useRef(null);
    const hasStartedRef = useRef(false);
    const isProcessingRef = useRef(false); // Guard against duplicate processing

    const log = useCallback((message, kind = 'info') => { 
        dispatchLog({ type: 'ADD_LOG', payload: { kind, message } }); 
    }, []);

    // Initialize dependencies and file queue
    useEffect(() => {
        const init = async () => {
            try {
                hasStartedRef.current = false; // Reset on init
                log('🔧 Loading core modules...', 'info');
                const deps = await DependencyManager.get();
                
                // DEBUG: Check what we got back
                console.log('[SVGConverter] 🔍 Dependencies loaded:', {
                    hasExcalidraw: !!deps.ExcalidrawModule,
                    hasLZString: !!deps.LZString,
                    hasFontDataMap: !!deps.fontDataMap,
                    fontDataMapKeys: deps.fontDataMap ? Object.keys(deps.fontDataMap) : 'undefined',
                    fontDataMapType: typeof deps.fontDataMap
                });
                
                depsRef.current = deps;
                log('✅ Modules loaded successfully.', 'success');
                
                if (deps.fontDataMap) {
                    const fontCount = Object.keys(deps.fontDataMap).length;
                    log(`🔤 Loaded ${fontCount} font(s): ${Object.keys(deps.fontDataMap).join(', ')}`, 'info');
                } else {
                    log('⚠️ No fonts loaded! fontDataMap is undefined', 'warning');
                }

                // Get files to process
                const allFiles = (await app.vault.adapter.list(FOLDER_PATH)).files;
                const toProcess = allFiles.filter(f => 
                    f.toLowerCase().endsWith('.md') && 
                    !allFiles.includes(f.replace(/\.md$/i, '.svg'))
                ).map(path => ({ path }));

                if (toProcess.length === 0) {
                    log('No files to process. All files already converted.', 'success');
                    setPhase('complete');
                    return;
                }

                // Build dependency graph and sort
                log('Analyzing dependencies...', 'info');
                const graph = await buildDependencyGraph(toProcess);
                const sorted = topologicalSort(graph);
                const sortedPaths = sorted.map(f => f.path);
                
                // Count files with dependencies
                let filesWithDeps = 0;
                let filesNoDeps = 0;
                for (const [path, node] of graph) {
                    if (node.deps && node.deps.length > 0) {
                        filesWithDeps++;
                    } else {
                        filesNoDeps++;
                    }
                }
                
                setDependencyGraph(graph);
                log(`✅ Found ${sortedPaths.length} files (${filesNoDeps} standalone, ${filesWithDeps} with deps)`, 'success');
                log(`📋 Order: standalone files first, then dependent files`, 'info');
                
                // Only log files WITH dependencies (not all 888 files!)
                if (filesWithDeps > 0) {
                    log(`📦 Files with dependencies:`, 'info');
                    let dependentCount = 0;
                    for (const [path, node] of graph) {
                        if (node.deps && node.deps.length > 0) {
                            dependentCount++;
                            if (dependentCount <= 10) { // Only show first 10
                                const fileName = path.split('/').pop();
                                const depNames = node.deps.map(d => d.split('/').pop().replace(/\.md$/, ''));
                                log(`  ${fileName} → [${depNames.slice(0, 3).join(', ')}${depNames.length > 3 ? '...' : ''}]`, 'info');
                            }
                        }
                    }
                    if (dependentCount > 10) {
                        log(`  ... and ${dependentCount - 10} more`, 'info');
                    }
                }
                
                setFileQueue(sortedPaths);
                setPhase('ready');
            } catch (error) {
                console.error('[SVGConverter] ❌ Initialization error:', error);
                console.error('[SVGConverter] ❌ Error stack:', error.stack);
                log(`❌ Initialization failed: ${error.message}`, 'error');
                if (error.stack) {
                    log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`, 'error');
                }
                setPhase('error');
            }
        };
        init();
    }, [log]);

    // Process next file
    const processNextFile = useCallback(async () => {
        // Guard against duplicate calls
        if (isProcessingRef.current) {
            log('⚠️ Already processing, skipping duplicate call', 'warning');
            return;
        }
        
        if (currentIndex >= fileQueue.length) {
            setPhase('complete');
            log('All files processed!', 'success');
            return;
        }

        isProcessingRef.current = true;
        
        const filePath = fileQueue[currentIndex];
        const fileName = filePath.split('/').pop();
        setCurrentFile(fileName);
        setPhase('processing');
        
        log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
        log(`📄 Processing file ${currentIndex + 1}/${fileQueue.length}: ${fileName}`, 'info');
        log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');

        try {
            const { ExcalidrawModule, LZString, fontDataMap } = depsRef.current;
            
            // Check if dependencies exist
            if (dependencyGraph) {
                const node = dependencyGraph.get(filePath);
                if (node && node.deps && node.deps.length > 0) {
                    log(`🔍 This file requires ${node.deps.length} dependencies:`, 'info');
                    const missingDeps = [];
                    const foundDeps = [];
                    const depFilesToProcess = [];
                    
                    for (const depPath of node.deps) {
                        const depSvgPath = depPath.replace(/\.md$/i, '.svg');
                        const exists = await app.vault.adapter.exists(depSvgPath);
                        const depName = depPath.split('/').pop().replace(/\.md$/, '.svg');
                        const depMdName = depPath.split('/').pop();
                        
                        if (!exists) {
                            missingDeps.push(depName);
                            depFilesToProcess.push({ mdPath: depPath, mdName: depMdName, svgName: depName });
                            log(`  ✗ MISSING: ${depName}`, 'error');
                        } else {
                            foundDeps.push(depName);
                            log(`  ✓ FOUND: ${depName}`, 'success');
                        }
                    }
                    
                    if (missingDeps.length > 0) {
                        log(`⚠️ ${fileName} needs ${missingDeps.length} dependencies to be processed first`, 'warning');
                        log(`   Missing: ${missingDeps.join(', ')}`, 'info');
                        
                        // Find the dependency files in the queue that haven't been processed yet
                        const unprocessedDeps = depFilesToProcess.filter(dep => {
                            const depIndex = fileQueue.findIndex(f => f.path === dep.mdPath);
                            return depIndex > currentIndex; // It's ahead in the queue
                        });
                        
                        if (unprocessedDeps.length > 0) {
                            log(`🔄 Moving ${unprocessedDeps.length} unprocessed dependencies to front of queue...`, 'info');
                            
                            // Remove dependencies from their current positions and insert them before current file
                            const depsToMove = [];
                            for (const dep of unprocessedDeps) {
                                const depIndex = fileQueue.findIndex(f => f.path === dep.mdPath);
                                if (depIndex > currentIndex) {
                                    depsToMove.push(fileQueue[depIndex]);
                                }
                            }
                            
                            // Remove them from queue
                            for (const dep of depsToMove) {
                                const idx = fileQueue.findIndex(f => f.path === dep.path);
                                if (idx > currentIndex) {
                                    fileQueue.splice(idx, 1);
                                }
                            }
                            
                            // Insert them right after current position
                            fileQueue.splice(currentIndex + 1, 0, ...depsToMove);
                            
                            log(`   → ${depsToMove.map(d => d.path.split('/').pop()).join(', ')} will be processed next`, 'success');
                            
                            // Skip current file - it will be reprocessed after dependencies
                            log(`⏭️ Skipping ${fileName} for now - will retry after dependencies`, 'info');
                            
                            // Move current file to after the dependencies
                            const currentFile = fileQueue[currentIndex];
                            fileQueue.splice(currentIndex, 1);
                            fileQueue.splice(currentIndex + depsToMove.length, 0, currentFile);
                            
                            // Process next file (which is now the first dependency)
                            processNextFile();
                            return;
                        } else {
                            // Dependencies should have been processed but SVGs don't exist - real error
                            log(`❌ Cannot process ${fileName} - dependencies were processed but SVGs missing`, 'error');
                            setSvgPreview({ 
                                svgString: `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="100%" height="100%" fill="#1a1a1a"/>
                                    <text x="50%" y="30%" text-anchor="middle" fill="#f1fa8c" font-size="16" font-family="monospace">
                                        Missing Dependencies
                                    </text>
                                    <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="12" font-family="monospace">
                                        ${fileName}
                                    </text>
                                    <text x="50%" y="70%" text-anchor="middle" fill="#666" font-size="10" font-family="monospace">
                                        Needs: ${missingDeps.slice(0, 2).join(', ')}${missingDeps.length > 2 ? '...' : ''}
                                    </text>
                                </svg>`, 
                                filePath, 
                                skipped: true,
                                reason: `Missing dependencies: ${missingDeps.join(', ')}`
                            });
                            setPhase('preview');
                            return;
                        }
                    } else {
                        log(`✅ All ${foundDeps.length} dependencies are available!`, 'success');
                    }
                } else {
                    log(`📌 This is a standalone file (no dependencies)`, 'info');
                }
            }
            
            // Parse the file
            log(`🔄 Parsing Excalidraw data...`, 'info');
            const parseResult = await parseExcalidrawData(filePath, LZString, log);
            
            if (parseResult.skipped) {
                log(`⚠️ Skipped: ${fileName} - ${parseResult.reason}`, 'warning');
                // Show preview even for skipped files so user can see what's wrong
                setSvgPreview({ 
                    svgString: `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="#1a1a1a"/>
                        <text x="50%" y="40%" text-anchor="middle" fill="#888" font-size="16" font-family="monospace">
                            Skipped: ${parseResult.reason}
                        </text>
                        <text x="50%" y="60%" text-anchor="middle" fill="#666" font-size="12" font-family="monospace">
                            ${fileName}
                        </text>
                    </svg>`, 
                    filePath, 
                    skipped: true,
                    reason: parseResult.reason
                });
                setPhase('preview');
                return;
            }

            log(`✅ Parsed successfully! Found ${parseResult.sceneData.elements.length} elements`, 'success');
            
            // Debug: Show all element types
            const elementTypes = {};
            parseResult.sceneData.elements.forEach(el => {
                elementTypes[el.type] = (elementTypes[el.type] || 0) + 1;
            });
            log(`📊 Element types breakdown: ${Object.entries(elementTypes).map(([type, count]) => `${type}:${count}`).join(', ')}`, 'info');
            
            // Check for embedded files in scene data
            const embeddedFiles = parseResult.sceneData.files || {};
            const embeddedCount = Object.keys(embeddedFiles).length;
            if (embeddedCount > 0) {
                log(`\n📎 Scene contains ${embeddedCount} embedded file(s)`, 'info');
                Object.keys(embeddedFiles).forEach(fileId => {
                    const file = embeddedFiles[fileId];
                    const hasData = file.dataURL && file.dataURL.length > 100;
                    const dataPreview = file.dataURL ? `${file.dataURL.substring(0, 60)}...` : 'none';
                    log(`   🔹 FileId: ${fileId}`, 'info');
                    log(`      - Name: ${file.name || 'unnamed'}`, 'info');
                    log(`      - MimeType: ${file.mimeType || 'unknown'}`, 'info');
                    log(`      - Has valid data: ${hasData ? '✅ YES' : '❌ NO'}`, hasData ? 'success' : 'error');
                    log(`      - Data preview: ${dataPreview}`, 'info');
                });
                
                // Check which elements use these files
                const imageElements = parseResult.sceneData.elements.filter(el => el.type === 'image');
                if (imageElements.length > 0) {
                    log(`\n🖼️ Found ${imageElements.length} image element(s) in scene:`, 'info');
                    imageElements.forEach((el, idx) => {
                        const fileRef = el.fileId;
                        const hasFile = embeddedFiles[fileRef];
                        const fileHasData = hasFile && hasFile.dataURL && hasFile.dataURL.length > 100;
                        log(`   🖼️ Image #${idx + 1}:`, 'info');
                        log(`      - Element ID: ${el.id}`, 'info');
                        log(`      - FileId reference: ${fileRef || 'NONE!'}`, fileRef ? 'info' : 'error');
                        log(`      - File exists in files object: ${hasFile ? '✅' : '❌'}`, hasFile ? 'success' : 'error');
                        log(`      - File has valid data: ${fileHasData ? '✅' : '❌'}`, fileHasData ? 'success' : 'error');
                        log(`      - Position: x=${el.x}, y=${el.y}`, 'info');
                        log(`      - Size: w=${el.width}, h=${el.height}`, 'info');
                        log(`      - Status: ${el.status || 'unknown'}`, 'info');
                        if (hasFile && !fileHasData) {
                            log(`      ⚠️ WARNING: File exists but has no/invalid data!`, 'warning');
                        }
                        if (!hasFile && fileRef) {
                            log(`      ⚠️ WARNING: Image references fileId that doesn't exist!`, 'error');
                        }
                    });
                }
            } else {
                log(`ℹ️ No embedded files in this scene`, 'info');
            }

            // Generate SVG preview
            log(`\n🎨 Generating SVG preview with ${embeddedCount} file(s)...`, 'info');
            const { svgString, modifiedSceneData, correctBounds } = await generateSVGPreview(parseResult.sceneData, ExcalidrawModule, fontDataMap, true, log, exportPadding, addBackground, backgroundColor);
            log(`✅ SVG generated! Size: ${Math.round(svgString.length / 1024)}KB`, 'success');
            
            setSvgPreview({ svgString, filePath, sceneData: modifiedSceneData, correctBounds });
            setPhase('preview');
            log(`👀 Preview ready for review!`, 'success');

        } catch (error) {
            log(`❌ ERROR: ${fileName}: ${error.message}`, 'error');
            log(`📍 Stack: ${error.stack}`, 'error');
            
            // If auto-processing, pause on error
            if (autoProcess) {
                log(`⏸️ Auto-process PAUSED due to error. Review and choose to Continue or Stop.`, 'warning');
                setPausedOnError(true);
            }
            
            // Show error preview so user can see what went wrong
            setSvgPreview({ 
                svgString: `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#1a0a0a"/>
                    <text x="50%" y="30%" text-anchor="middle" fill="#ff6666" font-size="16" font-family="monospace">
                        Error Processing File
                    </text>
                    <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="12" font-family="monospace">
                        ${fileName}
                    </text>
                    <text x="50%" y="70%" text-anchor="middle" fill="#666" font-size="10" font-family="monospace">
                        ${error.message.substring(0, 50)}
                    </text>
                </svg>`, 
                filePath, 
                error: true,
                errorMessage: error.message
            });
            setStats(s => ({ ...s, errors: s.errors + 1 }));
            setPhase('preview');
        } finally {
            // Always reset processing guard
            isProcessingRef.current = false;
        }
    }, [currentIndex, fileQueue, dependencyGraph, log, autoProcess]);

    // Handle approval
    const handleApprove = useCallback(async () => {
        if (!svgPreview || !svgPreview.sceneData) return;
        
        const fileName = svgPreview.filePath.split('/').pop();
        log(`\n💾 User approved: ${fileName}`, 'success');
        
        try {
            // SIMPLE: Use the preview SVG string (the one that displays correctly with fonts!)
            log(`🔄 Regenerating SVG with FIXED dimensions for saving...`, 'info');
            
            // Regenerate the SVG with forPreview=FALSE to get fixed dimensions
            const { ExcalidrawModule, fontDataMap } = depsRef.current;
            const { svgString: finalSvgString } = await generateSVGPreview(
                svgPreview.sceneData, 
                ExcalidrawModule, 
                fontDataMap, 
                false, // forPreview=FALSE for saving!
                log, 
                exportPadding,
                addBackground,
                backgroundColor
            );
            
            log(`   Generated save version: ${(finalSvgString.length / 1024).toFixed(1)}KB`, 'success');
            
            // VERIFY: Check if fonts are still in the final string
            const hasFontFaceInSave = finalSvgString.includes('@font-face');
            const hasBase64InSave = finalSvgString.includes('data:font/');
            const hasFuturaInSave = finalSvgString.includes("'Futura'");
            log(`   🔍 Verification: @font-face=${hasFontFaceInSave}, base64=${hasBase64InSave}, Futura=${hasFuturaInSave}`, hasFontFaceInSave ? 'success' : 'warning');
            
            log(`💾 Writing to file system...`, 'info');
            const savedPath = await saveSVGFile(svgPreview.filePath, finalSvgString);
            log(`✅ SAVED: ${savedPath.split('/').pop()} (${Math.round(finalSvgString.length / 1024)}KB)`, 'success');
            setStats(s => ({ ...s, processed: s.processed + 1 }));
            
            // Save to history and lastProcessedData
            const processedEntry = {
                fileName,
                filePath: svgPreview.filePath,
                svgString: finalSvgString,
                sceneData: svgPreview.sceneData,
                timestamp: Date.now(),
                index: currentIndex
            };
            setProcessHistory(prev => [...prev, processedEntry]);
            setLastProcessedData(processedEntry);
            log(`📚 Added to history (${processHistory.length + 1} total)`, 'info');
        } catch (error) {
            log(`❌ Save failed: ${error.message}`, 'error');
            log(`📍 Error stack: ${error.stack}`, 'error');
            setStats(s => ({ ...s, errors: s.errors + 1 }));
            
            // If auto-processing, pause on save error
            if (autoProcess) {
                log(`⏸️ Auto-process PAUSED due to save error.`, 'warning');
                setPausedOnError(true);
                return; // Don't continue to next file
            }
        }

        // Move to next and load it
        setSvgPreview(null);
        isProcessingRef.current = false;
        
        // Clear error pause if continuing
        if (pausedOnError) {
            setPausedOnError(false);
        }
        
        setCurrentIndex(prev => {
            const nextIndex = prev + 1;
            log(`\n➡️ Moving to next file (${nextIndex + 1}/${fileQueue.length})...`, 'info');
            return nextIndex;
        });
        
        // Trigger next processing after state settles
        setTimeout(() => {
            setPhase('processing');
        }, 150);
    }, [svgPreview, fileQueue.length, log, autoProcess, pausedOnError, currentIndex, processHistory.length]);

    // Handle skip
    const handleSkip = useCallback(() => {
        const fileName = svgPreview?.filePath.split('/').pop() || currentFile;
        
        // Update stats based on preview type
        if (svgPreview?.error) {
            log(`\n⏭️ User skipped error: ${fileName}`, 'warning');
        } else if (svgPreview?.skipped) {
            setStats(s => ({ ...s, skipped: s.skipped + 1 }));
            log(`\n⏭️ User skipped: ${fileName} - ${svgPreview.reason}`, 'warning');
        } else {
            setStats(s => ({ ...s, skipped: s.skipped + 1 }));
            log(`\n⏭️ User manually skipped: ${fileName}`, 'warning');
        }
        
        setSvgPreview(null);
        isProcessingRef.current = false;
        
        // Clear error pause if continuing
        if (pausedOnError) {
            setPausedOnError(false);
        }
        
        setCurrentIndex(prev => {
            const nextIndex = prev + 1;
            log(`➡️ Moving to next file (${nextIndex + 1}/${fileQueue.length})...`, 'info');
            return nextIndex;
        });
        
        // Trigger next processing after state settles
        setTimeout(() => {
            setPhase('processing');
        }, 150);
    }, [svgPreview, currentFile, fileQueue.length, log, pausedOnError]);

    // Auto-process ONLY the first file, then wait for manual approval
    useEffect(() => {
        if (phase === 'ready' && currentIndex === 0 && !hasStartedRef.current && fileQueue.length > 0) {
            hasStartedRef.current = true;
            log(`🚀 Starting processing with first file...`, 'info');
            // Use timeout to avoid any potential double-triggering
            setTimeout(() => processNextFile(), 50);
        }
    }, [phase]); // ONLY depend on phase to avoid re-runs
    
    // Trigger processing when phase changes to 'processing' (from button clicks)
    useEffect(() => {
        if (phase === 'processing' && !isProcessingRef.current) {
            processNextFile();
        }
    }, [phase, processNextFile]);
    
    // Auto-continue: If in auto-process mode, not paused, and preview is ready
    useEffect(() => {
        if (autoProcess && !pausedOnError && phase === 'preview' && svgPreview) {
            // Auto-approve if no error, or auto-skip if error/skipped
            if (svgPreview.error || svgPreview.skipped) {
                log(`⚡ Auto-process: Skipping ${svgPreview.filePath.split('/').pop()}`, 'info');
                setTimeout(() => handleSkip(), 500); // Small delay to show preview
            } else {
                log(`⚡ Auto-process: Approving ${svgPreview.filePath.split('/').pop()}`, 'info');
                setTimeout(() => handleApprove(), 500); // Small delay to show preview
            }
        }
    }, [autoProcess, pausedOnError, phase, svgPreview, handleSkip, handleApprove, log]);

    // Regenerate preview when padding or background settings change (debounced)
    const prevPaddingRef = useRef(exportPadding);
    const prevBackgroundRef = useRef({ add: addBackground, color: backgroundColor });
    useEffect(() => {
        // Check if any setting actually changed (not on mount or other updates)
        const paddingChanged = prevPaddingRef.current !== exportPadding;
        const backgroundChanged = prevBackgroundRef.current.add !== addBackground || prevBackgroundRef.current.color !== backgroundColor;
        
        if (!paddingChanged && !backgroundChanged) {
            return;
        }
        
        prevPaddingRef.current = exportPadding;
        prevBackgroundRef.current = { add: addBackground, color: backgroundColor };
        
        // Only regenerate if we have a current preview and we're in preview phase
        if (phase === 'preview' && svgPreview && svgPreview.sceneData && !svgPreview.error && !svgPreview.skipped) {
            // Debounce the regeneration to avoid excessive calls when user is typing
            const timeoutId = setTimeout(() => {
                const changes = [];
                if (paddingChanged) changes.push(`padding: ${exportPadding}px`);
                if (backgroundChanged) changes.push(`background: ${addBackground ? backgroundColor : 'none'}`);
                log(`🔄 Settings changed (${changes.join(', ')}) - regenerating preview...`, 'info');
                
                const { ExcalidrawModule, fontDataMap } = depsRef.current;
                generateSVGPreview(svgPreview.sceneData, ExcalidrawModule, fontDataMap, true, log, exportPadding, addBackground, backgroundColor)
                    .then(({ svgString }) => {
                        setSvgPreview(prev => ({
                            ...prev,
                            svgString
                        }));
                        log(`✅ Preview updated!`, 'success');
                    })
                    .catch(error => {
                        log(`❌ Failed to regenerate preview: ${error.message}`, 'error');
                    });
            }, 300); // 300ms debounce delay
            
            return () => clearTimeout(timeoutId);
        }
    }, [exportPadding, addBackground, backgroundColor]); // Trigger when any setting changes

    // Memoize static styles to prevent recreation on every render
    const containerStyle = useMemo(() => ({ 
        height: "100%", width: "100%", padding: "20px", 
        border: `1px solid ${THEME.colors.border}`, 
        borderRadius: THEME.borderRadius, 
        background: THEME.colors.background, 
        backdropFilter: 'blur(4px)', 
        color: THEME.colors.textNormal, 
        display: 'flex', flexDirection: 'column', 
        fontFamily: THEME.fontFamily, 
        overflow: 'hidden' 
    }), []);

    const headerStyle = useMemo(() => ({ 
        marginBottom: '20px', 
        borderBottom: `1px solid ${THEME.colors.border}`, 
        paddingBottom: '15px' 
    }), []);

    const buttonStyle = useMemo(() => ({ 
        padding: '10px 25px', 
        fontSize: '14px', 
        fontWeight: 700, 
        cursor: 'pointer', 
        border: `1px solid ${THEME.colors.border}`, 
        borderRadius: '6px', 
        marginRight: '10px',
        transition: 'all 0.2s ease'
    }), []);

    const approveStyle = useMemo(() => ({ 
        ...buttonStyle, 
        background: THEME.colors.accent, 
        color: THEME.colors.accentText 
    }), [buttonStyle]);

    const skipStyle = useMemo(() => ({ 
        ...buttonStyle, 
        background: 'transparent', 
        color: THEME.colors.textMuted 
    }), [buttonStyle]);

    const handleCopyLog = useCallback(() => {
        const logText = logs.map(l => 
            `[${new Date(l.t).toLocaleTimeString()}] ${l.kind.toUpperCase()}: ${l.message}`
        ).join('\n');
        navigator.clipboard.writeText(logText);
        log('📋 Log copied to clipboard!', 'success');
    }, [logs, log]);

    const handleSaveTempSVG = useCallback(async () => {
        if (!svgPreview || !svgPreview.svgString) {
            log('❌ No SVG to save', 'error');
            return;
        }
        
        try {
            const tempPath = currentFile.replace(/\.md$/i, '.DEBUG.svg');
            await app.vault.adapter.write(tempPath, svgPreview.svgString);
            log(`💾 Saved debug SVG to: ${tempPath}`, 'success');
            log(`   Open this file to inspect the actual SVG output`, 'info');
        } catch (err) {
            log(`❌ Failed to save debug SVG: ${err.message}`, 'error');
        }
    }, [svgPreview, currentFile, log]);

    const handleVerifySavedFile = useCallback(async () => {
        if (!lastProcessedData) {
            log('❌ No processed file to verify', 'error');
            return;
        }
        
        try {
            const svgPath = lastProcessedData.filePath.replace(/\.md$/i, '.svg');
            log(`🔍 Reading saved file from disk: ${svgPath}`, 'info');
            
            const savedContent = await app.vault.adapter.read(svgPath);
            
            // Analyze what's actually on disk
            const hasFontFace = savedContent.includes('@font-face');
            const hasBase64 = savedContent.includes('data:font/');
            const hasAssistant = savedContent.includes("'Assistant'");
            const fileSize = savedContent.length;
            
            log(`\n📁 SAVED FILE ON DISK VERIFICATION:`, 'info');
            log(`   - File size: ${Math.round(fileSize / 1024)}KB`, 'success');
            log(`   - Contains @font-face: ${hasFontFace ? '✅ YES' : '❌ NO'}`, hasFontFace ? 'success' : 'error');
            log(`   - Contains base64 font: ${hasBase64 ? '✅ YES' : '❌ NO'}`, hasBase64 ? 'success' : 'error');
            log(`   - Contains Assistant font: ${hasAssistant ? '✅ YES' : '❌ NO'}`, hasAssistant ? 'success' : 'error');
            
            // Compare with what we think we saved
            const memorySize = lastProcessedData.svgString.length;
            const sizeMatch = Math.abs(fileSize - memorySize) < 100;
            log(`   - Size matches memory: ${sizeMatch ? '✅ YES' : '❌ NO'}`, sizeMatch ? 'success' : 'warning');
            log(`      Memory: ${Math.round(memorySize / 1024)}KB, Disk: ${Math.round(fileSize / 1024)}KB`, 'info');
            
            if (!hasFontFace) {
                log(`\n❌ CRITICAL: Fonts are MISSING from saved file!`, 'error');
                log(`   This means fonts were lost during file write operation`, 'error');
            } else {
                log(`\n✅ SUCCESS: Fonts ARE present in saved file`, 'success');
            }
            
        } catch (err) {
            log(`❌ Failed to verify saved file: ${err.message}`, 'error');
        }
    }, [lastProcessedData, log]);

    const handleCopyDebugReport = useCallback(() => {
        if (!svgPreview || !svgPreview.sceneData) {
            log('❌ No preview data available to debug', 'error');
            return;
        }
        
        const elements = svgPreview.sceneData.elements || [];
        const files = svgPreview.sceneData.files || {};
        
        // Calculate bounds (simple x/y/width/height - not accounting for line points)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        elements.forEach(el => {
            if (el.x !== undefined && el.y !== undefined) {
                minX = Math.min(minX, el.x);
                minY = Math.min(minY, el.y);
                maxX = Math.max(maxX, el.x + (el.width || 0));
                maxY = Math.max(maxY, el.y + (el.height || 0));
            }
        });
        
        // Calculate bounds with LINE POINTS (accurate)
        let accurateMinX = Infinity, accurateMinY = Infinity, accurateMaxX = -Infinity, accurateMaxY = -Infinity;
        elements.forEach(el => {
            if (el.x !== undefined && el.y !== undefined) {
                const strokeWidth = el.strokeWidth || 1;
                const strokePadding = strokeWidth / 2;
                
                if (el.type === 'line' && el.points && el.points.length > 0) {
                    const xs = el.points.map(p => el.x + p[0]);
                    const ys = el.points.map(p => el.y + p[1]);
                    accurateMinX = Math.min(accurateMinX, Math.min(...xs) - strokePadding);
                    accurateMinY = Math.min(accurateMinY, Math.min(...ys) - strokePadding);
                    accurateMaxX = Math.max(accurateMaxX, Math.max(...xs) + strokePadding);
                    accurateMaxY = Math.max(accurateMaxY, Math.max(...ys) + strokePadding);
                } else {
                    accurateMinX = Math.min(accurateMinX, el.x - strokePadding);
                    accurateMinY = Math.min(accurateMinY, el.y - strokePadding);
                    accurateMaxX = Math.max(accurateMaxX, el.x + (el.width || 0) + strokePadding);
                    accurateMaxY = Math.max(accurateMaxY, el.y + (el.height || 0) + strokePadding);
                }
            }
        });
        
        // Element type breakdown
        const elementTypes = elements.reduce((acc, el) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
        }, {});
        
        // Sample first 5 elements with full details
        const sampleElements = elements.slice(0, 5).map(el => {
            const sample = {
                type: el.type,
                position: `(${el.x?.toFixed(1)}, ${el.y?.toFixed(1)})`,
                version: el.version,
                strokeWidth: el.strokeWidth
            };
            
            if (el.type === 'line' && el.points) {
                const xs = el.points.map(p => el.x + p[0]);
                const ys = el.points.map(p => el.y + p[1]);
                sample.pointCount = el.points.length;
                sample.pointBounds = {
                    xRange: `[${Math.min(...xs).toFixed(1)}, ${Math.max(...xs).toFixed(1)}]`,
                    yRange: `[${Math.min(...ys).toFixed(1)}, ${Math.max(...ys).toFixed(1)}]`
                };
            } else if (el.width !== undefined || el.height !== undefined) {
                sample.size = `${(el.width || 0).toFixed(1)}×${(el.height || 0).toFixed(1)}`;
            }
            
            return sample;
        });
        
        // Image elements details
        const imageElements = elements.filter(el => el.type === 'image').map(img => ({
            id: img.id.substring(0, 12),
            fileId: img.fileId?.substring(0, 12) || 'none',
            position: `(${img.x?.toFixed(1)}, ${img.y?.toFixed(1)})`,
            size: `${img.width?.toFixed(1)}×${img.height?.toFixed(1)}`,
            angle: img.angle || 0,
            hasFile: !!files[img.fileId],
            fileHasData: !!(files[img.fileId]?.dataURL)
        }));
        
        // Text elements details (for font debugging)
        const textElements = elements.filter(el => el.type === 'text').map(txt => ({
            id: txt.id.substring(0, 12),
            text: txt.text?.substring(0, 50) || '',
            fontFamily: txt.fontFamily,
            fontSize: txt.fontSize,
            position: `(${txt.x?.toFixed(1)}, ${txt.y?.toFixed(1)})`,
            isDeleted: txt.isDeleted
        }));
        
        // Get browser console logs
        const consoleHistory = window.__svgConverterConsoleLogs || [];
        
        // Get font info from dependencies
        const fontInfo = depsRef.current?.fontDataMap ? {
            loaded: true,
            fontCount: Object.keys(depsRef.current.fontDataMap).length,
            fontIds: Object.keys(depsRef.current.fontDataMap),
            fontPaths: Object.values(depsRef.current.fontDataMap).map(f => f.path)
        } : {
            loaded: false,
            error: 'fontDataMap not available in depsRef'
        };
        
        const debugReport = {
            fileName: currentFile,
            timestamp: new Date().toISOString(),
            exportPadding: exportPadding,
            fontConfiguration: fontInfo,
            sceneMetrics: {
                totalElements: elements.length,
                elementTypes: elementTypes,
                boundsSimple: {
                    min: `(${minX.toFixed(1)}, ${minY.toFixed(1)})`,
                    max: `(${maxX.toFixed(1)}, ${maxY.toFixed(1)})`,
                    width: (maxX - minX).toFixed(1),
                    height: (maxY - minY).toFixed(1)
                },
                boundsAccurate: {
                    min: `(${accurateMinX.toFixed(1)}, ${accurateMinY.toFixed(1)})`,
                    max: `(${accurateMaxX.toFixed(1)}, ${accurateMaxY.toFixed(1)})`,
                    width: (accurateMaxX - accurateMinX).toFixed(1),
                    height: (accurateMaxY - accurateMinY).toFixed(1),
                    note: 'Includes line points and stroke width'
                }
            },
            sampleElements: sampleElements,
            imageElements: imageElements,
            textElements: textElements,
            svgOutput: {
                size: svgPreview.svgString?.length || 0,
                sizeKB: Math.round((svgPreview.svgString?.length || 0) / 1024),
                viewBox: svgPreview.svgString?.match(/viewBox="([^"]+)"/)?.[1] || 'not found',
                dimensions: {
                    width: svgPreview.svgString?.match(/<svg[^>]*\swidth="([^"]+)"/)?.[1] || 'not set (scalable)',
                    height: svgPreview.svgString?.match(/<svg[^>]*\sheight="([^"]+)"/)?.[1] || 'not set (scalable)'
                }
            },
            browserConsoleLogs: consoleHistory.slice(-10),
            allLogs: logs.map(l => `[${l.kind}] ${l.message}`)  // ALL logs, not just recent
        };
        
        navigator.clipboard.writeText(JSON.stringify(debugReport, null, 2));
        log('📋 Debug report copied to clipboard!', 'success');
        log(`   Elements: ${debugReport.sceneMetrics.totalElements} | Images: ${imageElements.length} | Canvas: ${debugReport.sceneMetrics.boundsAccurate.width}×${debugReport.sceneMetrics.boundsAccurate.height}`, 'info');
    }, [svgPreview, currentFile, exportPadding, logs, log]);

    const handleCopyLastProcessed = useCallback(async () => {
        if (!lastProcessedData) {
            log('❌ No processed data available to copy', 'error');
            return;
        }
        
        const svgString = lastProcessedData.svgString;
        
        // Analyze SVG structure IN MEMORY
        const hasFontFace = svgString.includes('@font-face');
        const hasStyleTag = svgString.includes('<style');
        const hasDefs = svgString.includes('<defs');
        const hasBase64Font = svgString.includes('data:font/');
        
        // Extract font information
        const fontFaceMatches = svgString.match(/@font-face\s*{[^}]+}/g) || [];
        const fontFamilies = svgString.match(/font-family:\s*['"]([^'"]+)['"]/g) || [];
        
        // Extract text elements
        const textMatches = svgString.match(/<text[^>]*>/g) || [];
        const textFontFamilies = textMatches.map(t => {
            const match = t.match(/font-family="([^"]+)"/);
            return match ? match[1] : 'none';
        });
        
        // Get element counts
        const elementTypes = lastProcessedData.sceneData.elements.reduce((acc, el) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
        }, {});
        
        const textElements = lastProcessedData.sceneData.elements.filter(el => el.type === 'text');
        
        // Calculate expected dimensions from scene elements
        const elements = lastProcessedData.sceneData.elements || [];
        let expectedMinX = Infinity, expectedMinY = Infinity, expectedMaxX = -Infinity, expectedMaxY = -Infinity;
        elements.forEach(el => {
            if (!el || el.isDeleted) return;
            const x1 = el.x || 0;
            const y1 = el.y || 0;
            const x2 = x1 + (el.width || 0);
            const y2 = y1 + (el.height || 0);
            expectedMinX = Math.min(expectedMinX, x1);
            expectedMinY = Math.min(expectedMinY, y1);
            expectedMaxX = Math.max(expectedMaxX, x2);
            expectedMaxY = Math.max(expectedMaxY, y2);
        });
        const expectedWidth = expectedMaxX - expectedMinX;
        const expectedHeight = expectedMaxY - expectedMinY;
        
        const actualWidth = parseFloat(svgString.match(/width="([^"]+)"/)?.[1] || 0);
        const actualHeight = parseFloat(svgString.match(/height="([^"]+)"/)?.[1] || 0);
        const dimensionMatch = Math.abs(actualWidth - expectedWidth) < 10 && Math.abs(actualHeight - expectedHeight) < 10;
        
        // READ SAVED FILE FROM DISK
        let diskAnalysis = null;
        try {
            const svgPath = lastProcessedData.filePath.replace(/\.md$/i, '.svg');
            const savedContent = await app.vault.adapter.read(svgPath);
            
            const diskHasFontFace = savedContent.includes('@font-face');
            const diskHasBase64 = savedContent.includes('data:font/');
            const diskHasAssistant = savedContent.includes("'Assistant'");
            const diskSize = savedContent.length;
            const diskWidth = parseFloat(savedContent.match(/width="([^"]+)"/)?.[1] || 0);
            const diskHeight = parseFloat(savedContent.match(/height="([^"]+)"/)?.[1] || 0);
            
            const sizeMatch = Math.abs(diskSize - svgString.length) < 100;
            const dimensionsMatchDisk = Math.abs(diskWidth - actualWidth) < 1 && Math.abs(diskHeight - actualHeight) < 1;
            
            diskAnalysis = {
                accessible: true,
                path: svgPath,
                fileSize: diskSize,
                fileSizeKB: Math.round(diskSize / 1024),
                hasFontFace: diskHasFontFace,
                hasBase64Font: diskHasBase64,
                hasAssistantFont: diskHasAssistant,
                dimensions: {
                    width: diskWidth,
                    height: diskHeight
                },
                verification: {
                    sizeMatchesMemory: sizeMatch,
                    dimensionsMatchMemory: dimensionsMatchDisk,
                    fontsMatch: diskHasFontFace === hasFontFace,
                    overall: sizeMatch && dimensionsMatchDisk && (diskHasFontFace === hasFontFace)
                        ? '✅ DISK file matches memory perfectly'
                        : '❌ DISK file differs from memory'
                },
                issues: []
            };
            
            // Identify specific issues
            if (!sizeMatch) {
                diskAnalysis.issues.push(`Size mismatch: Memory ${Math.round(svgString.length/1024)}KB vs Disk ${Math.round(diskSize/1024)}KB`);
            }
            if (!dimensionsMatchDisk) {
                diskAnalysis.issues.push(`Dimensions differ: Memory ${actualWidth}×${actualHeight} vs Disk ${diskWidth}×${diskHeight}`);
            }
            if (hasFontFace && !diskHasFontFace) {
                diskAnalysis.issues.push('❌ CRITICAL: Fonts in memory but MISSING from disk file!');
            }
            if (!hasFontFace && diskHasFontFace) {
                diskAnalysis.issues.push('Fonts on disk but not in memory (unusual)');
            }
            
        } catch (err) {
            diskAnalysis = {
                accessible: false,
                error: err.message,
                note: 'Could not read saved file from disk'
            };
        }
        
        const report = {
            file: {
                name: lastProcessedData.fileName,
                path: lastProcessedData.filePath,
                timestamp: new Date(lastProcessedData.timestamp).toISOString()
            },
            memory: {
                totalSize: svgString.length,
                sizeKB: Math.round(svgString.length / 1024),
                dimensions: {
                    width: actualWidth,
                    height: actualHeight,
                    viewBox: svgString.match(/viewBox="([^"]+)"/)?.[1] || 'not set',
                    expectedWidth: expectedWidth.toFixed(1),
                    expectedHeight: expectedHeight.toFixed(1),
                    dimensionsCorrect: dimensionMatch ? '✅ Match expected' : '❌ WRONG dimensions'
                }
            },
            disk: diskAnalysis,
            elements: {
                total: lastProcessedData.sceneData.elements.length,
                byType: elementTypes,
                textElements: textElements.length
            },
            fonts: {
                inMemory: {
                    embedded: hasFontFace,
                    hasStyleTag: hasStyleTag,
                    hasDefs: hasDefs,
                    hasBase64Data: hasBase64Font,
                    fontFaceRulesCount: fontFaceMatches.length,
                    fontFaceRules: fontFaceMatches.slice(0, 2).map(rule => rule.substring(0, 120) + '...'),
                    textElementFonts: [...new Set(textFontFamilies)],
                    sceneTextFonts: [...new Set(textElements.map(el => el.fontFamily))]
                },
                analysis: diskAnalysis?.accessible 
                    ? (diskAnalysis.hasFontFace 
                        ? '✅ Fonts successfully saved to disk' 
                        : '❌ Fonts MISSING from saved file')
                    : (hasFontFace 
                        ? '⚠️ Fonts in memory, disk check failed' 
                        : '❌ No fonts in memory')
            },
            svgPreview: svgString.substring(0, 600) + '\n...[truncated]...'
        };
        
        navigator.clipboard.writeText(JSON.stringify(report, null, 2));
        
        const status = diskAnalysis?.accessible 
            ? (diskAnalysis.verification.overall ? '✅ Perfect' : '⚠️ Issues found')
            : '⚠️ Disk check failed';
        
        log(`📋 Copied complete SVG analysis for: ${lastProcessedData.fileName}`, 'success');
        log(`   Memory: ${report.memory.sizeKB}KB | ${report.elements.total} elements | Fonts: ${report.fonts.inMemory.embedded ? '✅' : '❌'}`, 'info');
        if (diskAnalysis?.accessible) {
            log(`   Disk: ${diskAnalysis.fileSizeKB}KB | Fonts: ${diskAnalysis.hasFontFace ? '✅' : '❌'} | Status: ${status}`, diskAnalysis.verification.overall ? 'success' : 'warning');
            if (diskAnalysis.issues.length > 0) {
                diskAnalysis.issues.forEach(issue => log(`      - ${issue}`, 'error'));
            }
        }
    }, [lastProcessedData, log]);

    const handleGoBack = useCallback(() => {
        if (processHistory.length === 0) {
            log('❌ No history to go back to', 'error');
            return;
        }
        
        // Stop auto-process if active
        if (autoProcess) {
            setAutoProcess(false);
            log('⏸️ Auto-process stopped for manual review', 'warning');
        }
        
        // Get the last processed item
        const lastItem = processHistory[processHistory.length - 1];
        log(`\n⬅️ Going back to review: ${lastItem.fileName}`, 'info');
        
        // Set the current index to that file
        setCurrentIndex(lastItem.index);
        
        // Re-generate preview from stored sceneData
        const { ExcalidrawModule, fontDataMap } = depsRef.current;
        generateSVGPreview(lastItem.sceneData, ExcalidrawModule, fontDataMap, true, log, exportPadding, addBackground, backgroundColor)
            .then(({ svgString }) => {
                setSvgPreview({ 
                    svgString, 
                    filePath: lastItem.filePath, 
                    sceneData: lastItem.sceneData,
                    reviewMode: true // Flag to indicate this is a review
                });
                setPhase('preview');
                log(`✅ Review mode enabled for: ${lastItem.fileName}`, 'success');
            })
            .catch(error => {
                log(`❌ Failed to load preview: ${error.message}`, 'error');
            });
        
        // Remove from history (so we don't keep going back to the same one)
        setProcessHistory(prev => prev.slice(0, -1));
    }, [processHistory, log, autoProcess]);

    if (phase === 'loading') {
        return (
            <div style={containerStyle}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ color: THEME.colors.accent, marginBottom: '15px' }}>Initializing...</h2>
                    <p style={{ color: THEME.colors.textMuted }}>Loading dependencies...</p>
                </div>
            </div>
        );
    }

    if (phase === 'complete' || phase === 'error') {
        return (
            <div style={containerStyle}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ color: phase === 'error' ? THEME.colors.error : THEME.colors.accent, marginBottom: '15px' }}>
                        {phase === 'error' ? 'Initialization Failed' : 'Processing Complete'}
                    </h2>
                    <p style={{ color: THEME.colors.textMuted, marginBottom: '20px' }}>
                        Processed: {stats.processed} | Skipped: {stats.skipped} | Errors: {stats.errors}
                    </p>
                    <button onClick={onComplete} style={approveStyle}>Done</button>
                </div>
            </div>
        );
    }

    const progress = fileQueue.length > 0 ? Math.round((currentIndex / fileQueue.length) * 100) : 0;

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ color: THEME.colors.accent, margin: 0 }}>
                        SVG Converter - Manual Mode
                    </h2>
                    <span style={{ 
                        fontSize: '12px', 
                        color: phase === 'processing' ? THEME.colors.warning : THEME.colors.success,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {phase === 'processing' ? '⚙️ Processing...' : phase === 'preview' ? '👁️ Review' : phase === 'ready' ? '⏸️ Ready' : ''}
                    </span>
                </div>
                {currentFile && (
                    <div style={{ 
                        fontSize: '14px', 
                        color: THEME.colors.textNormal, 
                        marginBottom: '8px',
                        fontWeight: 600,
                        padding: '8px 12px',
                        background: THEME.colors.accentBg,
                        borderRadius: '4px',
                        border: `1px solid ${THEME.colors.border}`
                    }}>
                        📄 Current: <span style={{ color: THEME.colors.accent }}>{currentFile}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: THEME.colors.textMuted, marginBottom: '8px' }}>
                    <span>Progress: {currentIndex + 1} / {fileQueue.length} ({progress}%)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label htmlFor="padding-input" style={{ fontSize: '12px', color: THEME.colors.textMuted }}>
                            Padding:
                        </label>
                        <input 
                            id="padding-input"
                            type="number" 
                            min="0" 
                            max="100" 
                            value={exportPadding} 
                            onChange={(e) => {
                                const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                setExportPadding(val);
                            }}
                            onFocus={(e) => e.target.select()}
                            style={{ 
                                width: '60px', 
                                padding: '4px 8px', 
                                background: THEME.colors.backgroundConsole, 
                                border: `1px solid ${THEME.colors.border}`, 
                                borderRadius: '4px', 
                                color: THEME.colors.textNormal,
                                fontSize: '12px',
                                transition: 'border-color 0.2s ease'
                            }}
                            title="Padding around SVG content (0-100px). Preview updates automatically."
                        />
                        <span style={{ fontSize: '11px', color: THEME.colors.textMuted }}>px</span>
                    </div>
                    <span>✅ {stats.processed} | ⏭️ {stats.skipped} | ❌ {stats.errors}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', fontSize: '13px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: THEME.colors.textMuted }}>
                        <input 
                            type="checkbox" 
                            checked={addBackground} 
                            onChange={(e) => setAddBackground(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        Add Background
                    </label>
                    {addBackground && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <label htmlFor="bg-color-input" style={{ fontSize: '12px', color: THEME.colors.textMuted }}>
                                Color:
                            </label>
                            <input 
                                id="bg-color-input"
                                type="color" 
                                value={backgroundColor} 
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                style={{ 
                                    width: '40px',
                                    height: '28px',
                                    padding: '2px',
                                    background: THEME.colors.backgroundConsole, 
                                    border: `1px solid ${THEME.colors.border}`, 
                                    borderRadius: '4px', 
                                    cursor: 'pointer'
                                }}
                                title="Choose background color for SVG export"
                            />
                            <span style={{ 
                                fontSize: '11px', 
                                color: THEME.colors.textMuted,
                                fontFamily: 'monospace',
                                background: THEME.colors.backgroundConsole,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: `1px solid ${THEME.colors.border}`
                            }}>
                                {backgroundColor}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Area - Only the SVG container re-renders */}
            {phase === 'preview' && (
                <SVGPreviewContainer 
                    svgPreview={svgPreview}
                    currentFile={currentFile}
                    dependencyGraph={dependencyGraph}
                    fileQueue={fileQueue}
                    currentIndex={currentIndex}
                />
            )}

            {(phase === 'processing' || phase === 'ready') && !svgPreview && (
                <SVGPreviewContainer 
                    svgPreview={null}
                    currentFile={currentFile}
                    dependencyGraph={dependencyGraph}
                    fileQueue={fileQueue}
                    currentIndex={currentIndex}
                />
            )}
            
            {/* Action buttons - Always rendered to prevent layout shifts */}
            {phase === 'preview' && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* All action buttons in one row - always present, visibility controlled */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button 
                            onClick={handleApprove} 
                            style={{
                                ...approveStyle,
                                display: (svgPreview && !svgPreview.skipped && !svgPreview.error) ? 'inline-block' : 'none'
                            }}
                        >
                            {pausedOnError ? '✓ Continue After Error' : (svgPreview?.reviewMode ? 'Re-Save' : 'Approve & Save')}
                        </button>
                        <button onClick={handleSkip} style={skipStyle}>
                            {pausedOnError ? '⏭️ Skip & Continue' : (svgPreview && (svgPreview.skipped || svgPreview.error) ? 'Continue' : 'Skip')}
                        </button>
                        <button 
                            onClick={() => { setAutoProcess(false); log('⏸️ Auto-process STOPPED by user', 'warning'); }} 
                            style={{ 
                                ...skipStyle, 
                                background: '#ff6b6b', 
                                color: '#fff',
                                display: (autoProcess && !pausedOnError) ? 'inline-block' : 'none'
                            }}
                        >
                            ⏸️ Stop Auto-Process
                        </button>
                        <button 
                            onClick={() => { 
                                setAutoProcess(true); 
                                log(`⚡ AUTO-PROCESS MODE ENABLED - Will auto-approve good files and skip errors/missing deps`, 'success');
                                log(`   ⏸️ Will pause if an error occurs for you to examine`, 'info');
                            }} 
                            style={{ 
                                ...approveStyle, 
                                background: THEME.colors.accent,
                                fontSize: '12px',
                                padding: '10px 20px',
                                display: (!autoProcess && !pausedOnError) ? 'inline-block' : 'none'
                            }}
                        >
                            ⚡ Enable Auto-Process
                        </button>
                        <button 
                            onClick={handleGoBack} 
                            style={{ 
                                ...buttonStyle, 
                                background: '#6c7086',
                                color: THEME.colors.textNormal,
                                fontSize: '11px',
                                padding: '8px 14px',
                                display: (processHistory.length > 0 && !autoProcess) ? 'inline-block' : 'none'
                            }}
                        >
                            ⬅️ Back ({processHistory.length})
                        </button>
                        <button 
                            onClick={handleCopyLastProcessed} 
                            style={{ 
                                ...buttonStyle, 
                                background: '#45475a',
                                color: THEME.colors.textMuted,
                                fontSize: '11px',
                                padding: '8px 14px',
                                display: lastProcessedData ? 'inline-block' : 'none'
                            }}
                            title="Copy complete analysis: memory + disk verification + fonts"
                        >
                            � Copy Last
                        </button>
                        <button 
                            onClick={handleCopyDebugReport} 
                            style={{ 
                                ...buttonStyle, 
                                background: '#7f5af0',
                                color: '#fff',
                                fontSize: '11px',
                                padding: '8px 14px'
                            }}
                            title="Copy compact debug report with element metrics and SVG info"
                        >
                            🔍 Debug Report
                        </button>
                        <button 
                            onClick={handleSaveTempSVG} 
                            style={{ 
                                ...buttonStyle, 
                                background: '#ff006e',
                                color: '#fff',
                                fontSize: '11px',
                                padding: '8px 14px',
                                display: svgPreview ? 'inline-block' : 'none'
                            }}
                            title="Save current SVG to .DEBUG.svg file for inspection"
                        >
                            💾 Save Debug SVG
                        </button>
                    </div>
                        
                    {pausedOnError && (
                        <div style={{ 
                            textAlign: 'center', 
                            color: THEME.colors.warning, 
                            fontSize: '12px',
                            padding: '10px',
                            background: `${THEME.colors.warning}15`,
                            borderRadius: '6px'
                        }}>
                            ⚠️ Auto-process PAUSED due to error. Review above and choose to Continue or Stop.
                        </div>
                    )}
                    
                    {svgPreview?.reviewMode && (
                        <div style={{ 
                            textAlign: 'center', 
                            color: '#89b4fa', 
                            fontSize: '12px',
                            padding: '10px',
                            background: '#89b4fa15',
                            borderRadius: '6px'
                        }}>
                            🔍 Review Mode - You're viewing a previously processed file
                        </div>
                    )}
                    
                    {autoProcess && !pausedOnError && (
                        <div style={{ 
                            textAlign: 'center', 
                            color: THEME.colors.success, 
                            fontSize: '11px',
                            opacity: 0.8
                        }}>
                            ⚡ Auto-processing enabled - will pause on errors
                        </div>
                    )}
                </div>
            )}

            {/* Debug Console - Memoized to prevent unnecessary re-renders */}
            <DebugConsole 
                logs={logs}
                showDebugConsole={showDebugConsole}
                onToggle={() => setShowDebugConsole(!showDebugConsole)}
                onCopyLog={handleCopyLog}
            />
        </div>
    );
}


// =================================================================================
//  MAIN CONTAINER (With Full Tab Toggle)
// =================================================================================
function MainContainer({ onAutomationComplete }) {
    const [currentView, setCurrentView] = useState('welcome');
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const uniqueWrapperClass = "svg-converter-" + useRef(Math.random().toString(36).substr(2, 9)).current;
    
    useFullTabEffect(containerRef, isFullTab);
    
    const handleComplete = () => {
        setCurrentView('done');
        setTimeout(() => { if (onAutomationComplete) onAutomationComplete(); }, 1200);
    };
    
    const handleExitFullTab = (e) => {
        e.stopPropagation();
        setIsFullTab(false);
    };
    
    const handleEnterFullTab = () => setIsFullTab(true);
    
    const compactWrapperStyle = {
        padding: "16px", boxSizing: "border-box", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "12px", border: `1px dashed ${THEME.colors.border}`,
        borderRadius: "8px", background: THEME.colors.background,
    };
    
    const buttonStyle = {
        padding: "8px 16px", fontSize: "12px", fontWeight: "500",
        background: THEME.colors.accent, color: THEME.colors.accentText,
        border: "none", borderRadius: "6px", cursor: "pointer",
    };
    
    const doneContainerStyle = { height:"100%", width:"100%", padding:"30px", border:`1px solid ${THEME.colors.border}`, borderRadius:THEME.borderRadius, background:THEME.colors.background, backdropFilter: 'blur(4px)', color:THEME.colors.textNormal, display:'flex', flexDirection:'column', alignItems:'center', justifyContent: 'center', userSelect: 'none', boxShadow: THEME.shadows.main, fontFamily: THEME.fontFamily };
    const doneH1Style = { color: THEME.colors.accent, textShadow: THEME.shadows.accent, fontWeight: 700, fontSize: '2.5em', fontVariant: 'small-caps', letterSpacing: '1.5px' };
    const donePStyle = { color: THEME.colors.textMuted, marginTop: '15px', fontSize: '1.1em' };
    
    const iconStyle = {
        position: "absolute", top: "15px", right: "20px",
        fontSize: "14px", color: THEME.colors.textMuted, userSelect: "none",
        cursor: "pointer", opacity: 0, transform: "scale(0.9)",
        transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out",
        zIndex: 10,
    };
    
    const hoverStyle = `
        .${uniqueWrapperClass}:hover .subtle-icon {
            opacity: 0.7;
            transform: scale(1);
        }
    `;

    // If not in full tab mode, show compact view
    if (!isFullTab) {
        return (
            <div ref={containerRef} style={compactWrapperStyle}>
                <p style={{ margin: 0, color: THEME.colors.textMuted, fontSize: "14px" }}>
                    SVG Converter (Compact Mode)
                </p>
                <button style={buttonStyle} onClick={handleEnterFullTab}>
                    Enter Full Tab
                </button>
            </div>
        );
    }

    // Full tab mode rendering
    return (
        <div ref={containerRef}>
            <style>{hoverStyle}</style>
            <div className={uniqueWrapperClass} style={{ position: 'relative', height: '100%', width: '100%' }}>
                <span 
                    style={iconStyle} 
                    className="subtle-icon" 
                    title="Exit Full Tab" 
                    onClick={handleExitFullTab}
                >
                    &lt;/&gt;
                </span>
                {currentView === 'welcome' && <WelcomeView onProceed={() => setCurrentView('processing')} />}
                {currentView === 'processing' && <ManualProcessorView onComplete={handleComplete} />}
                {currentView === 'done' && (
                    <div style={doneContainerStyle}>
                        <h1 style={doneH1Style}>Processing Complete</h1>
                        <p style={donePStyle}>All SVG conversions have been reviewed.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

return { MainView: MainContainer };
```


