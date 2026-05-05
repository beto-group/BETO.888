const { useEffect, useRef, useState, useMemo, useCallback, useReducer, Icon } = dc;

// --- 1. Core & Shared ---
// This section contains global constants, shared state, utility functions, and the web worker logic.
// 
// PERFORMANCE OPTIMIZATION: Parallel Loading Flow
// When user consents, three processes run simultaneously for maximum speed:
// 1. Canvas file loading - loads existing SVG files and renders them immediately
// 2. GitHub sync - downloads new .md files from beto-group/beto.assets (2 concurrent workers)
//    - SMART SYNC: Initial consent triggers immediate pull, then only syncs:
//      • Weekly (every 7 days) if folder contains .md files
//      • Immediately if folder is empty (no .md files present)
//    - Tracks last sync timestamp in consent.json file
// 3. SVG conversion - converts .md files to .svg in background as they're downloaded
//    - DEPENDENCY-AWARE: Files with dependencies convert LAST after independent files
//    - Detects [[file]] references and reorders conversion queue accordingly
// All three processes are non-blocking and update the UI progressively as they complete.
//
// RENDERING OPTIMIZATION: Prevents Duplicate Renders & Smooth Spawning
// - Images cached in globalImageCache with mtime validation
// - requestedSet tracks in-flight requests to prevent duplicate loads
// - Debounced file change detection (500ms) to batch conversion checks
// - Canvas only requests images that aren't cached or already requested
// - High-res bitmaps automatically cleaned when off-screen to save memory
// - Staggered spawn delays (2-3ms per item) for silky smooth cascade effect
// - Viewport-aware loading: only loads visible items first (progressive enhancement)
// - Batch limits: Grid 16 items/frame, Graph 16 items/frame (prevents frame drops)
// - Existing items keep their positions, only new items animate in
//
// GRID MODE PHYSICS: Drag & Throw Individual Images
// - Left-click drag on any image to move it around (no pan key needed)
// - BULLDOZER MODE: Dragged item FORCES through others (never gets pushed back!)
//   • Dragged item is immune to collision forces while being dragged
//   • Only OTHER items receive push forces and are moved out of the way
//   • Result: Smooth plowing through crowds at any speed
// - CONTINUOUS COLLISION DETECTION: Sweeps along drag path every frame
//   • Fixed 15px step size for consistent collision checks
//   • Checks all positions between previous and current cursor location
//   • Pushes ALL items encountered along the entire path
// - STRONG COLLISION FORCES: Scales with drag speed
//   • Base impulse: 1.5x overlap (immediate push from penetration)
//   • Velocity impulse: 0.8x drag speed (faster drag = harder hit)
//   • Separation: 90% of overlap (aggressively clears the path)
// - Hit images fly away with momentum: velocity decay (0.92) + spring force back to grid
// - Pan/zoom still works: Middle/right-click or hold Space + drag
//
// LAG SPIKE PREVENTION: Strategic Yield Points
// - setTimeout(0) yields to UI thread every 2-3 operations
// - GitHub sync: yields every 3 files during download/conversion
// - Conversion: yields before parse, SVG generation, and file write
// - Batch conversion: single worker with yields every 2 files
// - Progress updates throttled (every 2 files) to reduce UI repaints
// - Reduced concurrency: 2 workers instead of 3 for smoother performance

const FOLDER_PATH = "_RESOURCES/ASSETS/888/ASSETS_.A";
const EXPORT_SCALE = 2;
const LOCAL_FONTS_DIR = "_resources/fonts/futura"; // Local fonts cache directory
const LOCAL_FONT_PATH = "_resources/fonts/futura/Futura-CondensedLight.otf"; // Main font file
const REPO_FONTS_PATH = "_RESOURCES/FONTS/futura"; // Repo fonts directory path
const EXPORT_PADDING = 15;
const EXCALIDRAW_CDN_URL = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/+esm";
const EXCALIDRAW_ASSET_PATH = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/prod/";
const LZ_STRING_CDN_URL = "https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js";
const MAX_CONCURRENCY = 1;

// GitHub repo configuration
const GITHUB_REPO_OWNER = "beto-group";
const GITHUB_REPO_NAME = "beto.assets";
const GITHUB_ASSETS_PATH = "ASSETS";
const GITHUB_BRANCH = "main";

const Core = {
    // --- Shared State ---
    globalImageCache: new Map(),
    REMOVED_IMAGES_PATH: ".datacore/image-gallery/removed.json",

    // --- Font Handling ---
    loadFontData: async (log, currentFilePath) => {
        try {
            // Calculate relative font directory based on current file location
            let localFontsDir = LOCAL_FONTS_DIR;
            let localFontPath = LOCAL_FONT_PATH;
            
            if (currentFilePath) {
                // Get directory of current file
                const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
                localFontsDir = `${currentDir}/${LOCAL_FONTS_DIR}`;
                localFontPath = `${currentDir}/${LOCAL_FONT_PATH}`;
            }
            
            // Check if main font exists locally first
            const localExists = await dc.app.vault.adapter.exists(localFontPath);
            
            if (localExists) {
                if (log) log('✅ Font found locally, loading from cache...');
                return await dc.app.vault.adapter.readBinary(localFontPath);
            }
            
            // Font not found locally, fetch entire futura folder from beto.assets repo
            if (log) log('📥 Fonts not found locally, fetching futura folder from beto.assets repo...');
            
            // First, get the directory listing from GitHub API
            const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${REPO_FONTS_PATH}?ref=${GITHUB_BRANCH}`;
            const dirResponse = await fetch(apiUrl);
            
            if (!dirResponse.ok) {
                throw new Error(`Failed to fetch directory listing: ${dirResponse.status} ${dirResponse.statusText}`);
            }
            
            const files = await dirResponse.json();
            
            if (!Array.isArray(files)) {
                throw new Error('Invalid response from GitHub API');
            }
            
            // Create local fonts directory recursively if it doesn't exist
            // Split path and create each part
            const pathParts = localFontsDir.split('/');
            let currentPath = '';
            for (const part of pathParts) {
                if (!part) continue;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                
                if (!(await dc.app.vault.adapter.exists(currentPath))) {
                    if (log) log(`📁 Creating directory: ${currentPath}`);
                    await dc.app.vault.adapter.mkdir(currentPath);
                }
            }
            
            // Download all font files
            let mainFontData = null;
            const downloadPromises = files.map(async (file) => {
                if (file.type === 'file') {
                    try {
                        if (log) log(`  ⬇️  Downloading: ${file.name}`);
                        const response = await fetch(file.download_url);
                        
                        if (!response.ok) {
                            throw new Error(`Failed to download ${file.name}`);
                        }
                        
                        const arrayBuffer = await response.arrayBuffer();
                        const filePath = `${localFontsDir}/${file.name}`;
                        
                        await dc.app.vault.adapter.writeBinary(filePath, arrayBuffer);
                        if (log) log(`  ✅ Saved: ${file.name}`);
                        
                        // If this is the main font file, store it to return
                        if (file.name === 'Futura-CondensedLight.otf') {
                            mainFontData = arrayBuffer;
                        }
                    } catch (error) {
                        if (log) log(`  ❌ Failed to download ${file.name}: ${error.message}`);
                        console.error(`[FontHandler] Error downloading ${file.name}:`, error);
                    }
                }
            });
            
            await Promise.all(downloadPromises);
            
            if (!mainFontData) {
                throw new Error('Main font file (Futura-CondensedLight.otf) not found in repo');
            }
            
            if (log) log(`✅ All fonts cached at: ${localFontsDir}`);
            return mainFontData;
            
        } catch (error) {
            if (log) log(`❌ Error loading fonts: ${error.message}`);
            console.error('[FontHandler] Error loading fonts:', error);
            throw error;
        }
    },

    // --- Persistence Helpers ---
    loadRemovedImagePaths: async () => {
        try {
            if (await dc.app.vault.adapter.exists(Core.REMOVED_IMAGES_PATH)) {
                const content = await dc.app.vault.adapter.read(Core.REMOVED_IMAGES_PATH);
                const paths = JSON.parse(content || "[]");
                return new Set(Array.isArray(paths) ? paths : []);
            }
        } catch (err) {
            console.error("Error loading removed images list:", err);
        }
        return new Set();
    },
    saveRemovedImagePaths: async (removedPathsSet) => {
        try {
            const dir = Core.REMOVED_IMAGES_PATH.substring(0, Core.REMOVED_IMAGES_PATH.lastIndexOf("/"));
            if (!(await dc.app.vault.adapter.exists(dir))) {
                await dc.app.vault.adapter.mkdir(dir);
            }
            const pathsArray = Array.from(removedPathsSet);
            await dc.app.vault.adapter.write(Core.REMOVED_IMAGES_PATH, JSON.stringify(pathsArray, null, 2));
        } catch (err) {
            console.error("Error saving removed images list:", err);
        }
    },

    // --- DOM Helpers ---
    findNearestAncestorWithClass: (element, className) => {
        if (!element) return null;
        let current = element.parentNode;
        while (current) {
            if (current.classList && current.classList.contains(className)) return current;
            current = current.parentNode;
        }
        return null;
    },
    findDirectChildByClass: (parent, className) => {
        if (!parent) return null;
        for (const child of parent.children) {
            if (child.classList && child.classList.contains(className)) return child;
        }
        return null;
    },

    // --- Web Worker Logic ---
    imageWorkerCode: self.onmessage = async (e) => {
        const { type, imagesToLoad } = e.data || {};
        if (type !== 'generate') return;
        const results = {}, transferable = [], fallback = [];
        for (const { path, svgText, targetWidth, targetHeight, isHires } of imagesToLoad) {
            const W = targetWidth || 240, H = targetHeight || 300;
            try {
                const blob = new Blob([svgText], { type: 'image/svg+xml' });
                const bmp = await createImageBitmap(blob);
                const c = new OffscreenCanvas(W, H);
                const ctx = c.getContext('2d', { alpha: true });
                const iw = Math.max(1, bmp.width || 1), ih = Math.max(1, bmp.height || 1);
                const s = Math.min(W / iw, H / ih);
                const dw = Math.max(1, Math.round(iw * s)), dh = Math.max(1, Math.round(ih * s));
                const dx = Math.floor((W - dw) / 2), dy = Math.floor((H - dh) / 2);
                ctx.clearRect(0, 0, W, H);
                ctx.drawImage(bmp, dx, dy, dw, dh);
                const out = c.transferToImageBitmap ? c.transferToImageBitmap() : await createImageBitmap(c);
                results[path] = { bitmap: out, isHires: !!isHires };
                transferable.push(out);
                bmp.close?.();
            } catch (err) {
                fallback.push({ path, svgText, isHires });
            }
        }
        self.postMessage({ type: 'generated', results, fallback }, transferable);
    },

    // --- Placeholder Drawing Function ---
    drawPlaceholder: (ctx, file, x, y, w, h, isError) => {
        ctx.fillStyle = isError ? '#401010' : '#2b1a20';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(200, 180, 220, 0.5)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const name = file.basename.replace('.svg', '');
        const maxChars = Math.floor(w / 7);
        const line1 = name.substring(0, maxChars);
        const line2 = name.length > maxChars ? name.substring(maxChars, maxChars * 2) + (name.length > maxChars * 2 ? '...' : '') : '';
        ctx.fillText(line1, x + w / 2, y + h / 2 - (line2 ? 8 : 0));
        if (line2) { ctx.fillText(line2, x + w / 2, y + h / 2 + 8); }
    },

    // --- GitHub Asset Fetching ---
    GitHub: {
        /**
         * Fetches the list of .md files from the GitHub repo
         * @param {Function} log - Logging function
         * @returns {Promise<Array<{name: string, download_url: string}>>}
         */
        fetchAssetsList: async (log) => {
            const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_ASSETS_PATH}?ref=${GITHUB_BRANCH}`;
            log(`Fetching assets list from GitHub...`);
            
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
                }
                
                const files = await response.json();
                
                // Filter for .md files only
                const mdFiles = files.filter(file => 
                    file.type === 'file' && 
                    file.name.toLowerCase().endsWith('.md') &&
                    file.download_url
                );
                
                log(`Found ${mdFiles.length} .md files in GitHub repo`);
                return mdFiles;
            } catch (error) {
                log(`ERROR fetching from GitHub: ${error.message}`);
                throw error;
            }
        },

        /**
         * Downloads a single file from GitHub and saves it to the vault
         * @param {string} downloadUrl - The raw content URL
         * @param {string} fileName - Name of the file
         * @param {string} targetFolder - Folder path in vault
         * @param {Function} log - Logging function
         * @param {boolean} forceDownload - Force download even if file exists
         * @returns {Promise<{success: boolean, skipped: boolean, filePath: string}>}
         */
        downloadFile: async (downloadUrl, fileName, targetFolder, log, forceDownload = false) => {
            try {
                const filePath = `${targetFolder}/${fileName}`;
                
                // Check if file already exists
                const existingFile = dc.app.vault.getAbstractFileByPath(filePath);
                if (existingFile && !forceDownload) {
                    log(`Skipped (exists): ${fileName}`);
                    return { success: true, skipped: true, filePath };
                }
                
                const response = await fetch(downloadUrl);
                if (!response.ok) {
                    throw new Error(`Failed to download ${fileName}: ${response.status}`);
                }
                
                const content = await response.text();
                
                // Ensure folder exists
                if (!(await dc.app.vault.adapter.exists(targetFolder))) {
                    await dc.app.vault.adapter.mkdir(targetFolder);
                }
                
                if (existingFile) {
                    // Update existing file
                    await dc.app.vault.adapter.write(filePath, content);
                    log(`Updated: ${fileName}`);
                } else {
                    // Create new file
                    await dc.app.vault.create(filePath, content);
                    log(`Downloaded: ${fileName}`);
                }
                
                return { success: true, skipped: false, filePath };
            } catch (error) {
                log(`ERROR downloading ${fileName}: ${error.message}`);
                return { success: false, skipped: false, filePath: null };
            }
        },

        /**
         * Downloads all .md files from GitHub repo to the local folder
         * Downloads and converts in parallel for efficiency with yield points to prevent lag
         * @param {Function} log - Logging function
         * @param {Function} onProgress - Progress callback (downloaded, converted, total, skipped)
         * @param {Object} converterDeps - Converter dependencies {ExcalidrawModule, LZString, fontData}
         * @param {boolean} forceDownload - Force download even if files exist
         * @returns {Promise<{downloaded: number, skipped: number, converted: number, failed: number}>}
         */
        downloadAllAssets: async (log, onProgress, converterDeps, forceDownload = false) => {
            log('Starting GitHub asset sync...');
            
            try {
                // Fetch list of files (yield to prevent blocking)
                await new Promise(resolve => setTimeout(resolve, 0));
                const files = await Core.GitHub.fetchAssetsList(log);
                
                if (files.length === 0) {
                    log('No .md files found in GitHub repo');
                    return { downloaded: 0, skipped: 0, converted: 0, failed: 0 };
                }
                
                let downloadedCount = 0;
                let skippedCount = 0;
                let convertedCount = 0;
                let failedCount = 0;
                let processedCount = 0;
                
                // Process files with limited concurrency and yield points
                const processingQueue = [...files];
                const workers = [];
                
                const worker = async () => {
                    while (processingQueue.length > 0) {
                        const file = processingQueue.shift();
                        if (!file) continue;
                        
                        // Yield to UI thread every 3 files to prevent lag spikes
                        if (processedCount % 3 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 0));
                        }
                        
                        // Step 1: Download (or skip if exists)
                        const downloadResult = await Core.GitHub.downloadFile(
                            file.download_url,
                            file.name,
                            FOLDER_PATH,
                            log,
                            forceDownload
                        );
                        
                        if (downloadResult.success) {
                            if (downloadResult.skipped) {
                                skippedCount++;
                            } else {
                                downloadedCount++;
                            }
                            
                            // Step 2: Convert immediately after download (or if file was skipped but needs conversion)
                            if (downloadResult.filePath && converterDeps) {
                                try {
                                    const svgPath = downloadResult.filePath.replace(/\.md$/i, '.svg');
                                    const svgExists = dc.app.vault.getAbstractFileByPath(svgPath);
                                    
                                    // Convert if SVG doesn't exist or if file was just downloaded
                                    if (!svgExists || !downloadResult.skipped) {
                                        const mdFile = dc.app.vault.getAbstractFileByPath(downloadResult.filePath);
                                        if (mdFile) {
                                            // Yield before heavy conversion operation
                                            await new Promise(resolve => setTimeout(resolve, 0));
                                            
                                            const conversionResult = await Core.Converter.processFileWithLibrary(
                                                downloadResult.filePath,
                                                converterDeps.ExcalidrawModule,
                                                converterDeps.LZString,
                                                converterDeps.fontData,
                                                log
                                            );
                                            
                                            if (conversionResult.success && !conversionResult.skipped) {
                                                convertedCount++;
                                            }
                                        }
                                    } else {
                                        log(`Skipped conversion (SVG exists): ${file.name}`);
                                    }
                                } catch (convError) {
                                    log(`Conversion error for ${file.name}: ${convError.message}`);
                                }
                            }
                        } else {
                            failedCount++;
                        }
                        
                        processedCount++;
                        
                        // Update progress (throttled to prevent too many UI updates)
                        if (onProgress && processedCount % 2 === 0) {
                            const total = files.length;
                            onProgress(downloadedCount + skippedCount + failedCount, convertedCount, total, skippedCount);
                        }
                    }
                };
                
                // Run with limited concurrency (2 parallel workers instead of 3 for smoother performance)
                const concurrency = 2;
                for (let i = 0; i < Math.min(concurrency, files.length); i++) {
                    workers.push(worker());
                }
                
                await Promise.all(workers);
                
                // Final progress update
                if (onProgress) {
                    onProgress(downloadedCount + skippedCount + failedCount, convertedCount, files.length, skippedCount);
                }
                
                log(`Sync complete: ${downloadedCount} downloaded, ${skippedCount} skipped, ${convertedCount} converted, ${failedCount} failed`);
                return { downloaded: downloadedCount, skipped: skippedCount, converted: convertedCount, failed: failedCount };
                
            } catch (error) {
                log(`CRITICAL ERROR during sync: ${error.message}`);
                throw error;
            }
        }
    },

    // --- SVG Conversion Logic (Enhanced from SVGConverter) ---
    Converter: {
        /**
         * Parse Excalidraw data from .md file with proper error handling
         */
        parseExcalidrawData: async (filePath, LZString, log) => {
            const mdContent = await dc.app.vault.adapter.read(filePath);
            
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
                }
            }

            if (!jsonString) {
                // Check if it's an excalidraw file that needs decompression
                if (mdContent.includes("excalidraw-plugin: parsed") || mdContent.includes("# Excalidraw Data")) {
                    return { skipped: true, reason: 'Empty drawing - no elements' };
                }
                return { skipped: true, reason: 'No Excalidraw JSON data found' };
            }

            let sceneData = JSON.parse(jsonString);
            if (!sceneData.elements || sceneData.elements.length === 0) {
                return { skipped: true, reason: 'Empty drawing - no elements' };
            }
            
            return { sceneData };
        },

        /**
         * Fix SVG dimensions for saved files
         */
        fixSVGDimensions: (svgElement) => {
            const viewBox = svgElement.getAttribute('viewBox');
            if (!viewBox) {
                console.warn('[SVGConverter] No viewBox found in SVG');
                return svgElement;
            }
            
            const [x, y, width, height] = viewBox.split(' ').map(Number);
            
            // Set explicit width/height for saved files
            svgElement.setAttribute('width', width);
            svgElement.setAttribute('height', height);
            
            return svgElement;
        },

        /**
         * Embed fonts in SVG for proper display
         */
        embedFontsInSvg: (svgElement, fontData, elements) => {
            try {
                if (!svgElement || !fontData) {
                    return svgElement;
                }

                // Find which font families are actually used
                const usedFonts = new Set();
                if (elements && Array.isArray(elements)) {
                    elements.filter(el => el && el.type === 'text').forEach(el => {
                        if (el.fontFamily) {
                            usedFonts.add(el.fontFamily);
                        }
                    });
                }

                if (usedFonts.size === 0) {
                    return svgElement;
                }

                // Create a <defs> section if it doesn't exist
                let defs = svgElement.querySelector('defs');
                if (!defs) {
                    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                    svgElement.insertBefore(defs, svgElement.firstChild);
                }

                // Create a <style> element for @font-face rules
                const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
                style.setAttribute('type', 'text/css');

                // Convert font data to base64
                const base64 = btoa(String.fromCharCode(...new Uint8Array(fontData)));
                
                // Add @font-face rule
                style.textContent = `
@font-face {
    font-family: 'Futura-CondensedLight';
    src: url(data:font/otf;base64,${base64}) format('opentype');
    font-weight: normal;
    font-style: normal;
}
text {
    font-family: 'Futura-CondensedLight', 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif !important;
}
`;
                
                defs.appendChild(style);
                
                return svgElement;
            } catch (error) {
                console.error('[SVGConverter] Error embedding fonts:', error);
                return svgElement;
            }
        },

        /**
         * Generate SVG preview with enhanced conversion logic
         */
        generateSVGPreview: async (sceneData, ExcalidrawModule, fontData, log) => {
            if (log) {
                log('🚀 Starting SVG generation with enhanced logic');
            }

            // Create a working copy to avoid mutating the original
            const workingSceneData = {
                ...sceneData,
                elements: sceneData.elements ? JSON.parse(JSON.stringify(sceneData.elements)) : [],
                files: sceneData.files || {},
                appState: sceneData.appState || {}
            };

            // Filter out deleted elements
            if (workingSceneData.elements && workingSceneData.elements.length > 0) {
                const originalCount = workingSceneData.elements.length;
                workingSceneData.elements = workingSceneData.elements.filter(el => el.isDeleted !== true);
                const deletedCount = originalCount - workingSceneData.elements.length;
                
                if (log && deletedCount > 0) {
                    log(`   🧹 Filtered out ${deletedCount} deleted elements`);
                }
            }

            // Export configuration
            const exportConfig = {
                elements: workingSceneData.elements,
                appState: {
                    ...workingSceneData.appState,
                    exportBackground: false,
                    viewBackgroundColor: 'transparent',
                    exportScale: EXPORT_SCALE,
                    exportEmbedScene: false
                },
                files: workingSceneData.files || {},
                exportPadding: EXPORT_PADDING,
                getFontData: async () => fontData
            };

            if (log) {
                log(`   📊 Exporting ${workingSceneData.elements.length} elements`);
            }

            // Export SVG
            let finalSvg = await ExcalidrawModule.exportToSvg(exportConfig);

            // Embed fonts
            if (fontData) {
                finalSvg = Core.Converter.embedFontsInSvg(finalSvg, fontData, workingSceneData.elements);
            }

            // Fix dimensions for saved file
            finalSvg = Core.Converter.fixSVGDimensions(finalSvg);

            const svgString = new XMLSerializer().serializeToString(finalSvg);

            if (!svgString || svgString.length < 200) {
                throw new Error("Generated SVG is invalid or too small.");
            }

            return { svgString };
        },

        /**
         * Process a single file with the library (with yield points for smooth performance)
         */
        processFileWithLibrary: async (filePath, ExcalidrawModule, LZString, fontData, log) => {
            try {
                const fileName = filePath.split('/').pop();
                
                // Yield before heavy parsing operation
                await new Promise(resolve => setTimeout(resolve, 0));
                
                // Parse Excalidraw data
                const parseResult = await Core.Converter.parseExcalidrawData(filePath, LZString, log);
                
                if (parseResult.skipped) {
                    log(`⊘ Skipped: ${fileName} - ${parseResult.reason}`);
                    return { success: true, skipped: true, filePath };
                }

                const { sceneData } = parseResult;

                // Yield before SVG generation
                await new Promise(resolve => setTimeout(resolve, 0));

                // Generate SVG with enhanced logic
                const { svgString } = await Core.Converter.generateSVGPreview(
                    sceneData,
                    ExcalidrawModule,
                    fontData,
                    log
                );

                // Yield before file write
                await new Promise(resolve => setTimeout(resolve, 0));

                // Save to file
                const svgPath = filePath.replace(/\.md$/i, '.svg');
                await dc.app.vault.adapter.write(svgPath, svgString);
                
                log(`✔ Converted: ${fileName}`);
                return { success: true, filePath };

            } catch (error) {
                const fileName = filePath.split('/').pop();
                log(`❌ FAIL: ${fileName} - ${error.message}`);
                console.error(`Excalidraw Error on file ${filePath}:`, error);
                return { success: false, error: error.message, filePath };
            }
        },

        loadLegacyScript: (url, globalName) => {
            return new Promise((resolve, reject) => {
                if (window[globalName]) { return resolve(); }
                const script = document.createElement('script');
                script.src = url; script.async = true;
                script.onload = () => { if (window[globalName]) { resolve(); } else { reject(new Error(`Script loaded but global '${globalName}' not found.`)); } };
                script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
                document.head.appendChild(script);
            });
        }
    }
};

// --- 2. Custom Hooks ---

/**
 * A hook to manage the web worker for image rasterization.
 */
const useImageWorker = (imagesToDisplay, onCacheUpdate) => {
    const [worker, setWorker] = useState(null);
    const [error, setError] = useState(null);
    const requestedRef = useRef(new Set());

    useEffect(() => {
        let workerInstance;
        try {
            const src = `self.onmessage = ${Core.imageWorkerCode.toString()}`;
            const blob = new Blob([src], { type: 'application/javascript' });
            workerInstance = new Worker(URL.createObjectURL(blob));
            setWorker(workerInstance);
        } catch (err) {
            console.error("Worker Initialization Failed:", err);
            setError(err.message);
        }
        return () => { if (workerInstance) workerInstance.terminate(); };
    }, []);

    const rasterizeInMain = useCallback((svgText, targetWidth, targetHeight) => {
        const W = 240, H = 300;
        return new Promise((resolve) => { const w = targetWidth || W, h = targetHeight || H; const img = new Image(); const blob = new Blob([svgText], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); img.decoding = 'async'; img.onload = async () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); const iw = Math.max(1, img.naturalWidth || 1), ih = Math.max(1, img.naturalHeight || 1); const s = Math.min(w / iw, h / ih); const dw = Math.max(1, Math.round(iw * s)), dh = Math.max(1, Math.round(ih * s)); const dx = Math.floor((w - dw) / 2), dy = Math.floor((h - dh) / 2); ctx.clearRect(0, 0, w, h); ctx.drawImage(img, dx, dy, dw, dh); URL.revokeObjectURL(url); const bmp = await createImageBitmap(c); resolve(bmp); }; img.onerror = () => { URL.revokeObjectURL(url); resolve(null); }; img.src = url; });
    }, []);

    useEffect(() => {
        if (!worker) return;
        const filesMap = new Map(imagesToDisplay.map(f => [f.path, f]));

        worker.onmessage = async (e) => {
            const { type, results, fallback } = e.data || {};
            if (type !== 'generated') return;
            let updated = false;

            if (results) {
                for (const path in results) {
                    const { bitmap, isHires } = results[path] || {};
                    if (!bitmap) continue;
                    const file = filesMap.get(path);
                    if (!file) continue;
                    const entry = Core.globalImageCache.get(path) || {};
                    if (isHires) { entry.hiresBitmap = bitmap; entry.hiresRequested = false; }
                    else { entry.bitmap = bitmap; entry.error = false; requestedRef.current.delete(path); }
                    entry.mtime = file.stat.mtime;
                    Core.globalImageCache.set(path, entry);
                    updated = true;
                }
            }

            if (fallback && fallback.length) {
                for (const { path, svgText, isHires } of fallback) {
                    const file = filesMap.get(path);
                    if (!file) continue;
                    const bmp = await rasterizeInMain(svgText, isHires ? 1000 : 240, isHires ? 1250 : 300);
                    const entry = Core.globalImageCache.get(path) || {};
                    if (isHires) { entry.hiresBitmap = bmp; entry.hiresRequested = false; }
                    else { entry.bitmap = bmp; entry.error = !bmp; requestedRef.current.delete(path); }
                    entry.mtime = file.stat.mtime;
                    Core.globalImageCache.set(path, entry);
                    updated = true;
                }
            }
            if (updated) onCacheUpdate();
        };
        return () => { if (worker) worker.onmessage = null; };
    }, [worker, imagesToDisplay, rasterizeInMain, onCacheUpdate]);

    const requestImages = useCallback((filesToLoad, isHires = false) => {
        if (!worker || filesToLoad.length === 0) return;

        const newLoads = filesToLoad.filter(f => !requestedRef.current.has(f.path));
        if (newLoads.length === 0) return;

        for (const f of newLoads) requestedRef.current.add(f.path);

        const fetchAndPost = async () => {
            const data = await Promise.all(newLoads.map(async f => ({
                path: f.path, svgText: await dc.app.vault.read(f), isHires,
                targetWidth: isHires ? 1000 : undefined,
                targetHeight: isHires ? 1250 : undefined,
            })));
            if (worker) worker.postMessage({ type: 'generate', imagesToLoad: data });
        };

        if ('requestIdleCallback' in window && !isHires) {
            window.requestIdleCallback(fetchAndPost, { timeout: 300 });
        } else {
            setTimeout(fetchAndPost, isHires ? 0 : 50);
        }
    }, [worker]);

    return { imageCache: Core.globalImageCache, requestImages, workerError: error, requestedSet: requestedRef.current };
};

/**
 * A hook that manages the rendering and interaction logic for the Grid View canvas.
 */
const useInteractiveCanvas = ({ containerRef, canvasRef, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, isTransitioning, initialPositions, onTransitionEnd }, isFullTab, onCardClick, imagesToDisplay, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection) => {
    const cameraState = useRef({ camX: 0, camY: 0, vX: 0, vY: 0, zoom: 1, zTarget: 1 });
    const stateRef = useRef({ isSearching, matchingImagePaths, isSelectionMode, selectedPaths }).current;
    Object.assign(stateRef, { isSearching, matchingImagePaths, isSelectionMode, selectedPaths });

    const gridItemsRef = useRef([]);
    const hoveredTileRef = useRef(null);
    const startTimeRef = useRef(performance.now());

    const imagesToDisplayRef = useRef(imagesToDisplay);
    useEffect(() => {
        imagesToDisplayRef.current = imagesToDisplay;
    }, [imagesToDisplay]);


    const canvasSizeRef = useRef({ CW: 1, CH: 1 });
    const worldFromScreen = useCallback((sx, sy) => {
        const { camX, camY, zoom } = cameraState.current;
        const { CW, CH } = canvasSizeRef.current;
        if (zoom === 0 || CW === 0 || CH === 0) return { x: camX, y: camY };
        return { x: (sx - CW / 2) / zoom + camX, y: (sy - CH / 2) / zoom + camY };
    }, []);

    const requestRender = useCallback(() => { onCacheUpdate.current(); }, [onCacheUpdate]);

    useEffect(() => {
        if (isTransitioning && initialPositions) {
            gridItemsRef.current.forEach(item => {
                const pos = initialPositions.get(item.path);
                if (pos) {
                    item.animX = pos.x; item.animY = pos.y;
                    item.vx = (Math.random() - 0.5) * 20;
                    item.vy = (Math.random() - 0.5) * 20;
                    item.usePhysics = true;
                }
            });
            requestRender();
        }
    }, [isTransitioning, initialPositions, requestRender]);

    useEffect(() => {
        const CARD_W = 160, CARD_H = 200, GAP = 80, TILE_W = CARD_W + GAP, TILE_H = CARD_H + GAP;
        const cols = Math.max(1, Math.ceil(Math.sqrt(imagesToDisplay.length)));

        const gridW = cols * TILE_W;
        const gridH = Math.ceil(imagesToDisplay.length / cols) * TILE_H;

        const oldItemsByPath = new Map(gridItemsRef.current.map(item => [item.path, item]));
        const oldItemPositions = new Map(gridItemsRef.current.map((item, index) => [item.path, index]));

        const newGridItems = imagesToDisplay.map((file, i) => {
            const targetI = i % cols;
            const targetJ = Math.floor(i / cols);
            const targetX = targetI * TILE_W + GAP / 2;
            const targetY = targetJ * TILE_H + GAP / 2;
            const oldItem = oldItemsByPath.get(file.path);

            const needsToAnimateIn = !oldItem || oldItemPositions.get(file.path) !== i;

            if (oldItem) {
                oldItem.targetX = targetX;
                oldItem.targetY = targetY;

                // Keep items that just need repositioning (already loaded)
                if (!needsToAnimateIn) {
                    // Item already in correct position, just update position smoothly
                    return oldItem;
                }
                
                // Item needs to move to new position
                const spawnSide = Math.floor(Math.random() * 4);
                switch (spawnSide) {
                    case 0: oldItem.animX = Math.random() * gridW; oldItem.animY = -CARD_H * 2; break;
                    case 1: oldItem.animX = gridW + CARD_W * 2; oldItem.animY = Math.random() * gridH; break;
                    case 2: oldItem.animX = Math.random() * gridW; oldItem.animY = gridH + CARD_H * 2; break;
                    default: oldItem.animX = -CARD_W * 2; oldItem.animY = Math.random() * gridH; break;
                }
                oldItem.scale = 0;
                oldItem.isActivated = false;
                return oldItem;
            } else {
                // New item - spawn with staggered delay for smooth appearance
                let spawnX, spawnY;
                const spawnSide = Math.floor(Math.random() * 4);
                switch (spawnSide) {
                    case 0: spawnX = Math.random() * gridW; spawnY = -CARD_H * 2; break;
                    case 1: spawnX = gridW + CARD_W * 2; spawnY = Math.random() * gridH; break;
                    case 2: spawnX = Math.random() * gridW; spawnY = gridH + CARD_H * 2; break;
                    default: spawnX = -CARD_W * 2; spawnY = Math.random() * gridH; break;
                }

                return {
                    path: file.path, targetX, targetY,
                    animX: spawnX, animY: spawnY,
                    scale: 0,
                    isActivated: false,
                    spawnDelay: i * 2, // Stagger spawn by 2ms per item for smooth cascade
                    vx: 0, vy: 0, // Velocity for physics
                    isDragging: false, // Dragging state
                };
            }
        });
        const newPaths = new Set(imagesToDisplay.map(f => f.path));
        gridItemsRef.current = newGridItems.filter(item => newPaths.has(item.path));
        requestRender();
    }, [imagesToDisplay, requestRender]);

    useEffect(() => {
        if (!stateRef.prevIsSearching && isSearching && matchingImagePaths.size > 0) {
            const CARD_W = 160, CARD_H = 200, GAP = 80, TILE_W = CARD_W + GAP, TILE_H = CARD_H + GAP;
            const cols = Math.max(1, Math.ceil(Math.sqrt(imagesToDisplay.length)));
            const pathToIndexMap = new Map(imagesToDisplay.map((f, i) => [f.path, i]));
            let minI = Infinity, maxI = -Infinity, minJ = Infinity, maxJ = -Infinity;
            matchingImagePaths.forEach(path => {
                const index = pathToIndexMap.get(path);
                if (index !== undefined) {
                    const i = index % cols; const j = Math.floor(index / cols);
                    minI = Math.min(minI, i); maxI = Math.max(maxI, i);
                    minJ = Math.min(minJ, j); maxJ = Math.max(maxJ, j);
                }
            });
            if (isFinite(minI)) {
                const PADDING = 120;
                const resultsLeft = minI * TILE_W; const resultsTop = minJ * TILE_H;
                const resultsWidth = (maxI - minI + 1) * TILE_W; const resultsHeight = (maxJ - minJ + 1) * TILE_H;
                const canvas = canvasRef.current;
                if (cameraState.current && canvas) {
                    const CW = canvas.clientWidth, CH = canvas.clientHeight;
                    const zoomX = CW / (resultsWidth + PADDING); const zoomY = CH / (resultsHeight + PADDING);
                    cameraState.current.zTarget = Math.min(zoomX, zoomY, 3.0);
                    cameraState.current.camX = resultsLeft + resultsWidth / 2;
                    cameraState.current.camY = resultsTop + resultsHeight / 2;
                    interactingUntilRef.current = performance.now() + 400; requestRender();
                }
            }
        } else if (stateRef.prevIsSearching && !isSearching) {
            if (cameraState.current) { cameraState.current.zTarget = 1.0; interactingUntilRef.current = performance.now() + 400; requestRender(); }
        }
        stateRef.prevIsSearching = isSearching;
    }, [isSearching, matchingImagePaths, imagesToDisplay, stateRef, canvasRef, interactingUntilRef, requestRender]);

    useEffect(() => {
        if (resetViewKey > 0 && cameraState.current) {
            const CARD_W = 160, CARD_H = 200, GAP = 80, TILE_W = CARD_W + GAP, TILE_H = CARD_H + GAP;
            const { CW, CH } = canvasSizeRef.current;
            const numImages = imagesToDisplay.length;
            if (numImages === 0 || CW <= 1 || CH <= 1) return;
            const cols = Math.max(1, Math.ceil(Math.sqrt(numImages)));
            const rows = Math.ceil(numImages / cols);
            const gridW = cols * TILE_W; const gridH = rows * TILE_H;
            const PADDING = 80;

            const baseZoom = Math.min(CW / (gridW + PADDING), CH / (gridH + PADDING));
            const targetZoom = Math.min(baseZoom * 1.2, 1.0);

            cameraState.current.camX = gridW / 2; cameraState.current.camY = gridH / 2;
            cameraState.current.zTarget = targetZoom;
            interactingUntilRef.current = performance.now() + 400; requestRender();
        }
    }, [resetViewKey, imagesToDisplay.length, requestRender, interactingUntilRef]);

    useEffect(() => {
        const root = containerRef.current, canvas = canvasRef.current; if (!canvas || !root) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        const back = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
        const bctx = back.getContext('2d', { alpha: false });

        let rafId = 0, running = false, CW = 1, CH = 1, DPR = 1;
        const CARD_W = 160, CARD_H = 200, GAP = 80, TILE_W = CARD_W + GAP, TILE_H = CARD_H + GAP;
        let hoverAnimState = { i: -1, j: -1, strength: 0 };

        let mx = 0, my = 0, dragging = false, dragPointerId = null, panKeyActive = false;
        let anchorWorld = { x: 0, y: 0 }, zoomAnchorWorld = null, zoomAnchorScreen = null;
        let zoomActiveUntil = 0, clickSuppressUntil = 0, dragAccum = 0;

        const internalRequestRender = () => { if (!running) { running = true; rafId = requestAnimationFrame(frame); } };
        onCacheUpdate.current = internalRequestRender;

        const frame = () => {
            const now = performance.now();
            const { camX, camY, vX, vY, zoom, zTarget } = cameraState.current;
            let nextVX = vX, nextVY = vY, nextCamX = camX, nextCamY = camY, nextZoom = zoom;

            const hovered = hoveredTileRef.current?.over ? hoveredTileRef.current : null;
            if (hovered && (hovered.i !== hoverAnimState.i || hovered.j !== hoverAnimState.j)) {
                hoverAnimState.i = hovered.i; hoverAnimState.j = hovered.j;
            }
            const targetStrength = hovered ? 1 : 0;
            hoverAnimState.strength += (targetStrength - hoverAnimState.strength) * 0.15;

            const currentCols = Math.max(1, Math.ceil(Math.sqrt(gridItemsRef.current.length)));
            const currentGridW = currentCols * TILE_W;
            const currentGridH = Math.ceil(gridItemsRef.current.length / currentCols) * TILE_H;

            let isStillAnimating = false;
            const toLoadLowRes = [];
            const localImagesToDisplay = imagesToDisplayRef.current;

            // Progressive loading: only request visible items first, then expand outward
            const camState = cameraState.current;
            const halfW = CW / (2 * camState.zoom), halfH = CH / (2 * camState.zoom);
            const viewBounds = { 
                left: camState.camX - halfW - 500, 
                right: camState.camX + halfW + 500, 
                top: camState.camY - halfH - 500, 
                bottom: camState.camY + halfH + 500 
            };

            // Only request images that aren't already cached or requested (prevents duplicate rendering)
            gridItemsRef.current.forEach((item, index) => {
                // Check if item is near viewport for priority loading
                const isNearViewport = item.targetX >= viewBounds.left && 
                                      item.targetX <= viewBounds.right && 
                                      item.targetY >= viewBounds.top && 
                                      item.targetY <= viewBounds.bottom;

                // Respect spawn delay for smooth cascade effect
                const spawnTime = startTimeRef.current + (item.spawnDelay || 0);
                const canSpawn = now >= spawnTime;
                
                if (!imageCache.has(item.path) && !requestedSet.has(item.path) && isNearViewport && canSpawn) {
                    const file = localImagesToDisplay.find(f => f.path === item.path);
                    if (file) toLoadLowRes.push({ file, priority: isNearViewport ? 0 : 1 });
                }

                if (!item.isActivated && imageCache.has(item.path) && canSpawn) {
                    item.isActivated = true;
                }

                if (item.isActivated) {
                    // Apply physics if item has velocity (from being thrown)
                    if (!item.isDragging && (Math.abs(item.vx) > 0.1 || Math.abs(item.vy) > 0.1)) {
                        // Apply velocity
                        item.animX += item.vx;
                        item.animY += item.vy;
                        
                        // Apply friction
                        item.vx *= 0.92;
                        item.vy *= 0.92;
                        
                        // Spring back towards target with reduced strength while flying
                        const springStrength = 0.01;
                        item.vx += (item.targetX - item.animX) * springStrength;
                        item.vy += (item.targetY - item.animY) * springStrength;
                        
                        // Stop when velocity is very small and near target
                        if (Math.abs(item.vx) < 0.5 && Math.abs(item.vy) < 0.5 && 
                            Math.abs(item.targetX - item.animX) < 5 && Math.abs(item.targetY - item.animY) < 5) {
                            item.vx = 0;
                            item.vy = 0;
                        }
                        
                        isStillAnimating = true;
                    } 
                    // Normal spring animation when not being thrown or dragged
                    else if (!item.isDragging) {
                        item.animX += (item.targetX - item.animX) * 0.08;
                        item.animY += (item.targetY - item.animY) * 0.08;
                    }
                    
                    item.scale += (1 - item.scale) * 0.08;
                }

                if ((item.isActivated && item.scale < 0.99) || Math.abs(item.targetX - item.animX) > 0.1 || Math.abs(item.targetY - item.animY) > 0.1 || !canSpawn || item.isDragging) {
                    isStillAnimating = true;
                }
            });

            // Collision detection: check if dragged or moving items collide with other items
            gridItemsRef.current.forEach((item, idx) => {
                // Only check collisions for items being dragged or with significant velocity
                if (item.isActivated && (item.isDragging || Math.abs(item.vx) > 1 || Math.abs(item.vy) > 1)) {
                    const itemCenterX = item.animX + CARD_W / 2;
                    const itemCenterY = item.animY + CARD_H / 2;
                    
                    gridItemsRef.current.forEach((other, otherIdx) => {
                        if (idx === otherIdx || !other.isActivated || other.isDragging) return;
                        
                        const otherCenterX = other.animX + CARD_W / 2;
                        const otherCenterY = other.animY + CARD_H / 2;
                        
                        // Check collision (using card dimensions for bounding box)
                        const dx = itemCenterX - otherCenterX;
                        const dy = itemCenterY - otherCenterY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDist = (CARD_W + CARD_H) / 3; // Collision threshold
                        
                        if (distance < minDist && distance > 0) {
                            // Collision detected! Transfer momentum
                            const overlap = minDist - distance;
                            const force = overlap / minDist; // Normalized collision force
                            
                            // Direction from item to other
                            const nx = dx / distance;
                            const ny = dy / distance;
                            
                            // Calculate relative velocity (how fast they're approaching)
                            const relVx = item.vx - (other.vx || 0);
                            const relVy = item.vy - (other.vy || 0);
                            const approachSpeed = -(relVx * nx + relVy * ny);
                            
                            if (approachSpeed > 0) {
                                // They're moving towards each other - apply impulse
                                const impulseMagnitude = approachSpeed * force * 0.8; // 0.8 = elasticity
                                
                                // Push the other item away based on collision force
                                other.vx = other.vx || 0;
                                other.vy = other.vy || 0;
                                other.vx -= nx * impulseMagnitude;
                                other.vy -= ny * impulseMagnitude;
                                
                                // If being dragged, apply stronger force based on drag velocity
                                if (item.isDragging) {
                                    const dragForce = Math.sqrt(item.vx * item.vx + item.vy * item.vy) * 0.3;
                                    other.vx -= nx * dragForce;
                                    other.vy -= ny * dragForce;
                                }
                                
                                // Separate items to prevent sticking
                                const separation = overlap * 0.5;
                                other.animX -= nx * separation;
                                other.animY -= ny * separation;
                            }
                        }
                    });
                }
            });

            // Batch load with priority - load visible items first (max 16 at once for smooth performance)
            if (toLoadLowRes.length > 0) {
                toLoadLowRes.sort((a, b) => a.priority - b.priority);
                const filesToLoad = toLoadLowRes.slice(0, 16).map(item => item.file);
                requestImages(filesToLoad, false);
            }

            nextVX *= 0.9; nextVY *= 0.9; nextCamX += nextVX; nextCamY += nextVY; nextZoom += (zTarget - nextZoom) * 0.40;
            if (zoomAnchorWorld && (now < zoomActiveUntil || Math.abs(zTarget - nextZoom) > 1e-3)) { nextCamX = zoomAnchorWorld.x - (zoomAnchorScreen.x - CW / 2) / nextZoom; nextCamY = zoomAnchorWorld.y - (zoomAnchorScreen.y - CH / 2) / nextZoom; } else { zoomAnchorWorld = null; zoomAnchorScreen = null; }
            const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
            nextCamX = clamp(nextCamX, -CW, currentGridW + CW); nextCamY = clamp(nextCamY, -CH, currentGridH + CH);
            cameraState.current = { camX: nextCamX, camY: nextCamY, vX: nextVX, vY: nextVY, zoom: nextZoom, zTarget };
            drawFrame();

            // Check if any items have velocity (for collision physics)
            const hasMovingItems = gridItemsRef.current.some(item => Math.abs(item.vx || 0) > 0.1 || Math.abs(item.vy || 0) > 0.1);
            const moving = isStillAnimating || hasMovingItems || Math.abs(nextVX) > 0.01 || Math.abs(nextVY) > 0.01 || Math.abs(zTarget - nextZoom) > 0.001 || hoverAnimState.strength > 0.01 || (hovered && !stateRef.isSelectionMode);
            if (moving) rafId = requestAnimationFrame(frame); else running = false;
        };

        const drawFrame = () => {
            const now = performance.now();
            bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, back.width, back.height); bctx.setTransform(DPR, 0, 0, DPR, 0, 0); bctx.fillStyle = '#0f0a12'; bctx.fillRect(0, 0, CW, CH);
            const { camX, camY, zoom } = cameraState.current;
            const halfW = CW / (2 * zoom), halfH = CH / (2 * zoom); const view = { left: camX - halfW, right: camX + halfW, top: camY - halfH, bottom: camY + halfH };
            bctx.save(); bctx.translate(CW / 2, CH / 2); bctx.scale(zoom, zoom); bctx.translate(-camX, -camY);
            const toLoadHighRes = [], visibleHiresPaths = new Set();
            let hoveredItemToRedraw = null;
            const currentCols = Math.max(1, Math.ceil(Math.sqrt(gridItemsRef.current.length)));
            const localImagesToDisplay = imagesToDisplayRef.current;

            gridItemsRef.current.forEach((item) => {
                const { animX, animY, scale } = item;
                if (scale < 0.01) return;

                if (animX < view.left - (CARD_W * scale) || animX > view.right + (CARD_W * scale) || animY < view.top - (CARD_H * scale) || animY > view.bottom + (CARD_H * scale)) return;
                const file = localImagesToDisplay.find(f => f.path === item.path);
                if (!file) return;
                let entry = imageCache.get(item.path);
                if (entry && entry.mtime !== file.stat.mtime) { imageCache.delete(item.path); entry = undefined; }
                let pushX = 0, pushY = 0;
                if (hoverAnimState.strength > 0.01) {
                    const hovI = hoverAnimState.i, hovJ = hoverAnimState.j;
                    const idx = localImagesToDisplay.findIndex(f => f.path === item.path);
                    if (idx === -1) return;
                    const i = idx % currentCols, j = Math.floor(idx / currentCols);
                    const dx = i - hovI, dy = j - hovJ;
                    const distSq = dx * dx + dy * dy;
                    if (distSq > 0 && distSq < 16) { const dist = Math.sqrt(distSq); const maxPush = 50; const power = maxPush * hoverAnimState.strength; const pushAmount = power / (distSq + 0.5); pushX = (dx / dist) * pushAmount; pushY = (dy / dist) * pushAmount; }
                }
                const x = animX + pushX; const y = animY + pushY;
                const idx = localImagesToDisplay.findIndex(f => f.path === item.path);
                if (idx === -1) return;
                const i = idx % currentCols, j = Math.floor(idx / currentCols);
                const isHovered = hoveredTileRef.current && hoveredTileRef.current.i === i && hoveredTileRef.current.j === j && hoveredTileRef.current.over;
                const isSelected = stateRef.selectedPaths.has(item.path);
                const hoverScale = isHovered ? Math.min(2.5, 1.0 + 0.2 / zoom) : 1.0;
                const finalScale = scale * hoverScale;
                const drawW = CARD_W * finalScale; const drawH = CARD_H * finalScale;
                const drawX = x - (drawW - CARD_W) / 2; const drawY = y - (drawH - CARD_H) / 2;
                const drawPayload = { file, path: item.path, entry, item, x, y, drawX, drawY, drawW, drawH, isHovered, isSelected };
                if (isHovered) hoveredItemToRedraw = drawPayload; else drawCard(drawPayload);
            });
            if (hoveredItemToRedraw) drawCard(hoveredItemToRedraw);
            function drawCard({ file, path, entry, item, x, y, drawX, drawY, drawW, drawH, isHovered, isSelected }) {
                const isMatch = stateRef.isSearching && stateRef.matchingImagePaths.has(path);
                const isNotMatch = stateRef.isSearching && !isMatch;
                bctx.save();
                if (isNotMatch) { bctx.globalAlpha *= 0.15; }
                const useHires = zoom > 1.4 && entry?.hiresBitmap;
                const bitmapToDraw = useHires ? entry.hiresBitmap : entry?.bitmap;

                if (!bitmapToDraw) {
                    Core.drawPlaceholder(bctx, file, drawX, drawY, drawW, drawH, entry?.error);
                } else {
                    bctx.drawImage(bitmapToDraw, drawX, drawY, drawW, drawH);
                }
                if (useHires) visibleHiresPaths.add(path);

                if (isSelected) { bctx.fillStyle = 'rgba(135, 255, 197, 0.25)'; bctx.fillRect(drawX, drawY, drawW, drawH); bctx.strokeStyle = 'rgba(135, 255, 197, 0.8)'; bctx.lineWidth = 2 / zoom; bctx.strokeRect(drawX, drawY, drawW, drawH); }
                if (isMatch && !isSelected) { bctx.strokeStyle = 'rgba(170, 130, 255, 0.7)'; bctx.lineWidth = 2 / zoom; bctx.strokeRect(drawX - 1, drawY - 1, drawW + 2, drawH + 2); }
                if (isHovered && !stateRef.isSelectionMode && !isSelected) {
                    bctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; bctx.lineWidth = 1.5 / zoom;
                    const pulse = (Math.sin(now / 300) + 1) / 2;
                    const M_SIZE = (8 + pulse * 6) / zoom; const M_OFFSET = -8 / zoom;
                    bctx.beginPath();
                    bctx.moveTo(drawX + M_OFFSET, drawY + M_OFFSET + M_SIZE); bctx.lineTo(drawX + M_OFFSET, drawY + M_OFFSET); bctx.lineTo(drawX + M_OFFSET + M_SIZE, drawY + M_OFFSET);
                    bctx.moveTo(drawX + drawW - M_OFFSET - M_SIZE, drawY + M_OFFSET); bctx.lineTo(drawX + drawW - M_OFFSET, drawY + M_OFFSET); bctx.lineTo(drawX + drawW - M_OFFSET, drawY + M_OFFSET + M_SIZE);
                    bctx.moveTo(drawX + M_OFFSET, drawY + drawH - M_OFFSET - M_SIZE); bctx.lineTo(drawX + M_OFFSET, drawY + drawH - M_OFFSET); bctx.lineTo(drawX + M_OFFSET + M_SIZE, drawY + drawH - M_OFFSET);
                    bctx.moveTo(drawX + drawW - M_OFFSET - M_SIZE, drawY + drawH - M_OFFSET); bctx.lineTo(drawX + drawW - M_OFFSET, drawY + drawH - M_OFFSET); bctx.lineTo(drawX + drawW - M_OFFSET, drawY + drawH - M_OFFSET - M_SIZE);
                    bctx.stroke();
                }
                if (stateRef.isSelectionMode && isHovered && !isSelected) { bctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; bctx.lineWidth = 2 / zoom; bctx.beginPath(); bctx.arc(x + CARD_W / 2, y + CARD_H / 2, 30 / zoom, 0, 2 * Math.PI); bctx.stroke(); }
                if (isSelected) { bctx.fillStyle = 'rgba(135, 255, 197, 0.8)'; bctx.beginPath(); bctx.arc(x + CARD_W / 2, y + CARD_H / 2, 30 / zoom, 0, 2 * Math.PI); bctx.fill(); bctx.strokeStyle = '#0f0a12'; bctx.lineWidth = 2.5 / zoom; bctx.beginPath(); bctx.moveTo(x + CARD_W / 2 - 12 / zoom, y + CARD_H / 2); bctx.lineTo(x + CARD_W / 2 - 4 / zoom, y + CARD_H / 2 + 8 / zoom); bctx.lineTo(x + CARD_W / 2 + 12 / zoom, y + CARD_H / 2 - 7 / zoom); bctx.stroke(); }
                bctx.restore();
                if (zoom > 1.4 && entry?.bitmap && !entry.hiresBitmap && !entry.hiresRequested) { entry.hiresRequested = true; toLoadHighRes.push(file); }
            }
            if (toLoadHighRes.length) { requestImages(toLoadHighRes, true); }
            bctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(back, 0, 0, canvas.width, canvas.height);
            for (const [path, entry] of imageCache.entries()) { if (entry.hiresBitmap && !visibleHiresPaths.has(path)) { entry.hiresBitmap.close?.(); delete entry.hiresBitmap; entry.hiresRequested = false; } }
        };

        const setInteracting = (duration = 200) => { interactingUntilRef.current = performance.now() + duration; };
        const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
        const getTile = (wx, wy) => {
            const currentCols = Math.max(1, Math.ceil(Math.sqrt(gridItemsRef.current.length)));
            const i = Math.floor(wx / TILE_W), j = Math.floor(wy / TILE_H);
            const localX = wx - i * TILE_W, localY = wy - j * TILE_H;
            const over = localX >= GAP / 2 && localX <= GAP / 2 + CARD_W && localY >= GAP / 2 && localY <= GAP / 2 + CARD_H;
            return { i, j, over };
        };
        const sizeToContainer = () => {
            const r = root.getBoundingClientRect(), dpr = Math.min(1.75, window.devicePixelRatio || 1);
            if (CW !== r.width || CH !== r.height || DPR !== dpr) {
                CW = r.width; CH = r.height; DPR = dpr;
                canvasSizeRef.current = { CW, CH };
                canvas.width = Math.max(1, Math.floor(CW * DPR)); canvas.height = Math.max(1, Math.floor(CH * DPR));
                back.width = canvas.width; back.height = canvas.height;

                if (cameraState.current.camX === 0 && CW > 1 && CH > 1 && gridItemsRef.current.length > 0) {
                    const numImages = gridItemsRef.current.length;
                    const cols = Math.max(1, Math.ceil(Math.sqrt(numImages)));
                    const rows = Math.ceil(numImages / cols);
                    const gridW = cols * TILE_W; const gridH = rows * TILE_H;
                    const PADDING = 80;

                    const baseZoom = Math.min(CW / (gridW + PADDING), CH / (gridH + PADDING));
                    const initialZoom = Math.min(baseZoom * 1.2, 1.0);

                    cameraState.current = {
                        camX: gridW / 2, camY: gridH / 2,
                        vX: 0, vY: 0, zoom: initialZoom, zTarget: initialZoom,
                    };
                }
                internalRequestRender();
            }
        };

        const startDragIfAllowed = (e) => { const allow = e.button === 1 || e.button === 2 || panKeyActive; if (!allow) return false; const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; dragging = true; dragPointerId = e.pointerId; anchorWorld = worldFromScreen(mx, my); cameraState.current.vX = 0; cameraState.current.vY = 0; dragAccum = 0; setInteracting(); canvas.setPointerCapture?.(e.pointerId); canvas.style.cursor = 'grabbing'; return true; };
        
        const onPointerDown = (e) => { 
            if (e.target !== canvas || document.querySelector('.panel-wrap') || document.querySelector('.image-gallery-searchbar')?.contains(e.target)) return; 
            if (startDragIfAllowed(e)) { 
                e.preventDefault(); 
                internalRequestRender(); 
            } 
        };
        const onPointerMove = (e) => { 
            const r = canvas.getBoundingClientRect(); 
            const pMx = mx, pMy = my; 
            mx = e.clientX - r.left; 
            my = e.clientY - r.top; 
            
            if (dragging && e.pointerId === dragPointerId) { 
                const { camX: prevX, camY: prevY, zoom } = cameraState.current; 
                let camX = anchorWorld.x - (mx - CW / 2) / zoom; 
                let camY = anchorWorld.y - (my - CH / 2) / zoom; 
                cameraState.current.vX = (camX - prevX) * 0.85; 
                cameraState.current.vY = (camY - prevY) * 0.85; 
                cameraState.current.camX = camX; 
                cameraState.current.camY = camY; 
                dragAccum += Math.hypot(mx - pMx, my - pMy); 
                setInteracting(); 
                internalRequestRender(); 
            } else { 
                const wp = worldFromScreen(mx, my); 
                const hit = getTile(wp.x, wp.y); 
                const old = hoveredTileRef.current; 
                if (hit.i !== old?.i || hit.j !== old?.j || hit.over !== old?.over) { 
                    hoveredTileRef.current = hit; 
                    if (stateRef.isSelectionMode && hit.over) { 
                        canvas.style.cursor = 'pointer'; 
                    } else if (!panKeyActive) { 
                        canvas.style.cursor = 'default'; 
                    } 
                    internalRequestRender(); 
                } 
            } 
        };
        const onPointerUp = (e) => { 
            if (!dragging || e.pointerId !== dragPointerId) return; 
            dragging = false; 
            dragPointerId = null; 
            canvas.releasePointerCapture?.(e.pointerId); 
            canvas.style.cursor = panKeyActive ? 'grab' : (stateRef.isSelectionMode ? 'pointer' : 'default'); 
            clickSuppressUntil = performance.now() + 250; 
            internalRequestRender(); 
        };
        const onPointerLeave = () => { if (hoveredTileRef.current) { hoveredTileRef.current = null; internalRequestRender(); } };
        const onContextMenu = (e) => { e.preventDefault(); };
        const onKeyDown = (e) => { if (e.code === 'Space') { if (!panKeyActive) { panKeyActive = true; if (!dragging) canvas.style.cursor = 'grab'; } } if (e.key === '+' || e.key === '=') { const cx = CW / 2, cy = CH / 2; zoomAnchorScreen = { x: cx, y: cy }; zoomAnchorWorld = worldFromScreen(cx, cy); cameraState.current.zTarget = clamp(cameraState.current.zoom * 1.8, 0.1, 5); zoomActiveUntil = performance.now() + 300; setInteracting(); internalRequestRender(); } if (e.key === '-') { const cx = CW / 2, cy = CH / 2; zoomAnchorScreen = { x: cx, y: cy }; zoomAnchorWorld = worldFromScreen(cx, cy); cameraState.current.zTarget = clamp(cameraState.current.zoom / 1.8, 0.1, 5); zoomActiveUntil = performance.now() + 300; setInteracting(); internalRequestRender(); } };
        const onKeyUp = (e) => { if (e.code === 'Space') { panKeyActive = false; if (!dragging) canvas.style.cursor = stateRef.isSelectionMode ? 'pointer' : 'default'; } };
        const onWheel = (e) => { if (document.querySelector('.panel-wrap') || document.querySelector('.image-gallery-searchbar')?.contains(e.target)) return; const isZoom = e.ctrlKey || e.metaKey; if (isZoom) { e.preventDefault(); const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; const factor = Math.exp(-e.deltaY * 0.0068); const zPrime = clamp(cameraState.current.zoom * factor, 0.1, 5); zoomAnchorScreen = { x: mx, y: my }; zoomAnchorWorld = worldFromScreen(mx, my); cameraState.current.zTarget = zPrime; zoomActiveUntil = performance.now() + 300; setInteracting(); internalRequestRender(); } else { e.preventDefault(); const k = 1 / cameraState.current.zoom; cameraState.current.camX += e.deltaX * k; cameraState.current.camY += e.deltaY * k; cameraState.current.vX = e.deltaX * 0.02 * k; cameraState.current.vY = e.deltaY * 0.02 * k; setInteracting(120); internalRequestRender(); } };
        let gestureLast = 1; const onGestureStart = (e) => { gestureLast = 1; const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; zoomAnchorScreen = { x: mx, y: my }; zoomAnchorWorld = worldFromScreen(mx, my); zoomActiveUntil = performance.now() + 400; }; const onGestureChange = (e) => { const PINCH_SENSITIVITY = 64; const scaleRatio = e.scale / gestureLast; const amplifiedRatio = 2 + (scaleRatio - 1) * PINCH_SENSITIVITY; gestureLast = e.scale; cameraState.current.zTarget = clamp(cameraState.current.zoom * amplifiedRatio, 0.1, 5); setInteracting(); internalRequestRender(); }; const onGestureEnd = () => { zoomActiveUntil = performance.now() + 200; };
        const onClick = async () => {
            if (performance.now() < clickSuppressUntil) return; if (dragAccum > 8) return; const wp = worldFromScreen(mx, my); const hit = getTile(wp.x, wp.y);
            const currentCols = Math.max(1, Math.ceil(Math.sqrt(gridItemsRef.current.length)));
            const idx = hit.j * currentCols + hit.i;
            const localImagesToDisplay = imagesToDisplayRef.current;
            if (!hit.over || idx < 0 || idx >= localImagesToDisplay.length) return;
            const file = localImagesToDisplay[idx];
            if (stateRef.isSelectionMode) { onToggleSelection(file.path); return; }
            if (stateRef.isSearching && !stateRef.matchingImagePaths.has(file.path)) return;
            const cached = imageCache.get(file.path); if (!cached?.bitmap) return;
            const tempCanvas = document.createElement('canvas'); tempCanvas.width = 16; tempCanvas.height = 20; tempCanvas.getContext('2d').drawImage(cached.bitmap, 0, 0, 16, 20);
            const lowResUrl = tempCanvas.toDataURL('image/jpeg', 0.1); const initialBitmap = cached.hiresBitmap || cached.bitmap; onCardClick({ path: file.path, lowResUrl, initialBitmap, i: hit.i, j: hit.j });
        };

        sizeToContainer(); internalRequestRender();
        let resizeRAF = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(resizeRAF); resizeRAF = requestAnimationFrame(sizeToContainer); }); ro.observe(root);

        canvas.addEventListener('pointerdown', onPointerDown); window.addEventListener('pointermove', onPointerMove, { passive: true }); window.addEventListener('pointerup', onPointerUp); canvas.addEventListener('pointerleave', onPointerLeave); canvas.addEventListener('contextmenu', onContextMenu); window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp); canvas.addEventListener('wheel', onWheel, { passive: false }); canvas.addEventListener('gesturestart', onGestureStart); canvas.addEventListener('gesturechange', onGestureChange); canvas.addEventListener('gestureend', onGestureEnd); canvas.addEventListener('click', onClick);
        return () => { ro.disconnect(); onCacheUpdate.current = () => { }; canvas.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointerleave', onPointerLeave); canvas.removeEventListener('contextmenu', onContextMenu); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('gesturestart', onGestureStart); canvas.removeEventListener('gesturechange', onGestureChange); canvas.removeEventListener('gestureend', onGestureEnd); canvas.removeEventListener('click', onClick); running = false; cancelAnimationFrame(rafId); };
    }, [isFullTab, onCardClick, onToggleSelection, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, containerRef, canvasRef, onTransitionEnd]);
};




const useGraphCanvas = ({ containerRef, canvasRef, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, nodesRef: nodesRefProp }, isFullTab, onCardClick, imagesToDisplay, a888aTagsMap, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection) => {
    const nodesRef = useRef([]);
    const cameraState = useRef({ camX: 0, camY: 0, vX: 0, vY: 0, zoom: 0.08, zTarget: 0.08 });
    const hoveredNodeRef = useRef(null);
    const draggedNodeRef = useRef(null);
    const effectsRef = useRef([]);
    const stateRef = useRef({}).current;
    Object.assign(stateRef, { isSearching, matchingImagePaths, isSelectionMode, selectedPaths, a888aTagsMap });
    const runPhysics = useRef(true);
    const requestRender = useCallback(() => { onCacheUpdate.current(); }, [onCacheUpdate]);
    const debugLoggedRef = useRef(false);

    useEffect(() => {
        const oldNodesByPath = new Map(nodesRef.current.map(node => [node.file.path, node]));
        const R = Math.sqrt(imagesToDisplay.length) * 160;
        const newNodes = imagesToDisplay.map((file, i) => {
            const oldNode = oldNodesByPath.get(file.path);
            if (oldNode) {
                // Keep existing node position, just update scale target
                oldNode.scaleTarget = 1;
                return oldNode;
            }
            // New node - spawn with staggered animation
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(imagesToDisplay.length) * 100 * (1 + Math.random());
            return {
                file: file,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                vx: 0, vy: 0, w: 160, h: 160,
                scale: 0, scaleTarget: 1,
                spawnDelay: i * 3, // Stagger by 3ms for smooth cascade
                spawnTime: performance.now() + (i * 3),
            };
        });
        const newPaths = new Set(imagesToDisplay.map(f => f.path));
        nodesRef.current = newNodes.filter(node => newPaths.has(node.file.path));
        if (imagesToDisplay.length > 0) {
            runPhysics.current = true;
            requestRender();
        }
    }, [imagesToDisplay, requestRender]);

    useEffect(() => {
        if (resetViewKey > 0 && cameraState.current) {
            cameraState.current.camX = 0;
            cameraState.current.camY = 0;
            cameraState.current.zTarget = 0.5;
            requestRender();
        }
    }, [resetViewKey, requestRender]);

    // Wake physics when search or selection changes
    useEffect(() => {
        if (isSearching || selectedPaths.size > 0) {
            runPhysics.current = true;
            requestRender();
        }
    }, [isSearching, selectedPaths.size, requestRender]);

    useEffect(() => {
        const root = containerRef.current, canvas = canvasRef.current;
        if (!canvas || !root) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        const back = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
        const bctx = back.getContext('2d', { alpha: false });
        let rafId = 0, running = false, CW = 1, CH = 1, DPR = 1;
        const CARD_W = 160, CARD_H = 160;
        let mx = 0, my = 0, dragPointerId = null;
        let clickSuppressUntil = 0, dragAccum = 0;
        let zoomAnchorWorld = null, zoomAnchorScreen = null, zoomActiveUntil = 0;

        const internalRequestRender = () => { if (!running) { running = true; rafId = requestAnimationFrame(frame); } };
        onCacheUpdate.current = internalRequestRender;

        const frame = () => {
            const now = performance.now();
            let { camX, camY, vX, vY, zoom, zTarget } = cameraState.current;
            vX *= 0.9; vY *= 0.9; camX += vX; camY += vY;
            zoom += (zTarget - zoom) * 0.40;
            if (zoomAnchorWorld && (now < zoomActiveUntil || Math.abs(zTarget - zoom) > 1e-3)) {
                camX = zoomAnchorWorld.x - (zoomAnchorScreen.x - CW / 2) / zoom;
                camY = zoomAnchorWorld.y - (zoomAnchorScreen.y - CH / 2) / zoom;
            } else {
                zoomAnchorWorld = null; zoomAnchorScreen = null;
            }
            cameraState.current = { camX, camY, vX, vY, zoom, zTarget };
            const physicsMovement = physicsStep();
            drawFrame();
            if (nodesRefProp) {
                nodesRefProp.current = nodesRef.current;
            }
            const isScaling = nodesRef.current.some(n => Math.abs(n.scale - n.scaleTarget) > 0.01);
            const stillAnimating = physicsMovement > 0.1 || Math.abs(vX) > 0.01 || Math.abs(vY) > 0.01 || Math.abs(zTarget - zoom) > 0.001 || effectsRef.current.length > 0 || isScaling || hoveredNodeRef.current !== null;
            if (stillAnimating) {
                rafId = requestAnimationFrame(frame);
            } else {
                running = false;
            }
        };

        const drawFrame = () => {
            if (!debugLoggedRef.current && nodesRef.current.length > 0 && CW > 1) {
                console.clear();
                
                const { camX, camY, zoom } = cameraState.current;
                
                const firstNode = nodesRef.current[0];
                if (firstNode) {
                    
                    const relX = firstNode.x - camX;
                    const relY = firstNode.y - camY;
                    const screenX = (relX * zoom) + (CW / 2);
                    const screenY = (relY * zoom) + (CH / 2);
                    const nodeRadiusOnScreen = (firstNode.w / 2) * zoom;
                    const cornerTopLeftX = screenX - nodeRadiusOnScreen;
                    const cornerTopLeftY = screenY - nodeRadiusOnScreen;
                    const cornerBottomRightX = screenX + nodeRadiusOnScreen;
                    const cornerBottomRightY = screenY + nodeRadiusOnScreen;
                    
                    if (CW < 100 || CH < 100) {
                        console.error("!!! CRITICAL: Canvas dimensions are too small or zero. This is likely the cause of the top-left issue. The centering math is failing.");
                    }
                }
               
                debugLoggedRef.current = true;
            }

            if (CW < 2 || CH < 2) return;
            const now = performance.now();
            bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, back.width, back.height);
            bctx.setTransform(DPR, 0, 0, DPR, 0, 0); bctx.fillStyle = '#0f0a12'; bctx.fillRect(0, 0, CW, CH);
            const { camX, camY, zoom } = cameraState.current;
            bctx.save();
            bctx.translate(CW / 2, CH / 2);
            bctx.scale(zoom, zoom);
            bctx.translate(-camX, -camY);
            const toLoadLowRes = [], toLoadHighRes = [], visibleHiresPaths = new Set();
            const halfW = CW / (2 * zoom), halfH = CH / (2 * zoom);
            const view = { left: camX - halfW - CARD_W, right: camX + halfW + CARD_W, top: camY - halfH - CARD_H, bottom: camY + halfH + CARD_H };
            bctx.save();
            bctx.globalCompositeOperation = 'lighter';
            const EFFECT_DURATION = 600;
            effectsRef.current = effectsRef.current.filter(eff => {
                const age = now - eff.startTime;
                if (age > EFFECT_DURATION) return false;
                const { node } = eff;
                if (!node) return false;
                const progress = age / EFFECT_DURATION;
                const baseRadius = (node.w * node.scale / 2);
                const radius = baseRadius + progress * 80;
                const alpha = Math.sin(Math.PI * progress) * 0.5;
                const grad = bctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, radius);
                grad.addColorStop(0, `rgba(200, 160, 255, ${alpha})`);
                grad.addColorStop(1, `rgba(200, 160, 255, 0)`);
                bctx.fillStyle = grad;
                bctx.beginPath();
                bctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                bctx.fill();
                return true;
            });
            bctx.restore();
            nodesRef.current.sort((a, b) => a.scale - b.scale);
            nodesRef.current.forEach(node => {
                // Respect spawn delay for smooth cascade
                const canShow = !node.spawnTime || now >= node.spawnTime;
                if (!canShow) return;
                
                const isHovered = hoveredNodeRef.current === node;
                const hoverScaleFactor = Math.min(8.0, 1.8 + 0.8 / zoom);
                node.scaleTarget = isHovered ? hoverScaleFactor : 1.0;
                node.scale += (node.scaleTarget - node.scale) * 0.2;
                const path = node.file.path;
                let entry = imageCache.get(path);
                if (entry && entry.mtime !== node.file.stat.mtime) {
                    entry.bitmap?.close?.();
                    entry.hiresBitmap?.close?.();
                    imageCache.delete(path);
                    entry = undefined;
                }
                const scaledW = node.w * node.scale;
                // Only render nodes in viewport (with some padding for smooth panning)
                if (node.x < view.left - scaledW || node.x > view.right + scaledW || node.y < view.top - scaledW || node.y > view.bottom + scaledW) return;
                
                const isMatch = stateRef.isSearching && stateRef.matchingImagePaths.has(path);
                const isNotMatch = stateRef.isSearching && !isMatch;
                const isSelected = stateRef.selectedPaths.has(path);
                if (isNotMatch) {
                    bctx.save();
                    bctx.globalAlpha = 0.15;
                }
                const useHires = (zoom > 0.6 || isHovered) && entry?.hiresBitmap;
                const bitmapToDraw = useHires ? entry.hiresBitmap : entry?.bitmap;
                bctx.save();
                bctx.beginPath();
                bctx.arc(node.x, node.y, scaledW / 2, 0, Math.PI * 2);
                bctx.clip();
                if (bitmapToDraw) {
                    if (useHires) visibleHiresPaths.add(path);
                    bctx.imageSmoothingEnabled = zoom > 0.6 * 0.9;
                    const IMAGE_PADDING = 0.9;
                    bctx.drawImage(bitmapToDraw, node.x - (scaledW * IMAGE_PADDING) / 2, node.y - (scaledW * IMAGE_PADDING) / 2, scaledW * IMAGE_PADDING, scaledW * IMAGE_PADDING);
                } else {
                    Core.drawPlaceholder(bctx, node.file, node.x - scaledW / 2, node.y - scaledW / 2, scaledW, scaledW, entry?.error);
                    // Only request if not already cached/requested (prevents duplicate loads)
                    if (!requestedSet.has(path)) toLoadLowRes.push(node.file);
                }
                bctx.restore();
                if ((zoom > 0.6 || isHovered) && entry?.bitmap && !entry.hiresBitmap && !entry.hiresRequested) {
                    entry.hiresRequested = true;
                    toLoadHighRes.push(node.file);
                }
                if (isSelected) {
                    bctx.strokeStyle = 'rgba(135, 255, 197, 0.8)';
                    bctx.lineWidth = 3 / zoom;
                    bctx.beginPath();
                    bctx.arc(node.x, node.y, scaledW / 2, 0, Math.PI * 2);
                    bctx.stroke();
                }
                if (isMatch && !isSelected) {
                    bctx.strokeStyle = 'rgba(170, 130, 255, 0.7)';
                    bctx.lineWidth = 3 / zoom;
                    bctx.beginPath();
                    bctx.arc(node.x, node.y, scaledW / 2, 0, Math.PI * 2);
                    bctx.stroke();
                }
                if (isHovered && !isSelected) {
                    bctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    bctx.lineWidth = 2.5 / zoom;
                    const radius = scaledW / 2 + 5 / zoom;
                    for (let i = 0; i < 8; i++) {
                        const rotation = (now / 2000 + i * 0.1) % (Math.PI * 2);
                        const pulse = (Math.sin(now / 350 + i * 0.7) + 1) / 2;
                        const baseArcLength = Math.PI / 24;
                        const arcLength = baseArcLength * (1 + pulse * 1.5);
                        const angle = rotation + i * (Math.PI / 4);
                        bctx.beginPath();
                        bctx.arc(node.x, node.y, radius, angle - arcLength / 2, angle + arcLength / 2);
                        bctx.stroke();
                    }
                }
                if (isNotMatch) {
                    bctx.restore();
                }
            });
            const hoveredNode = hoveredNodeRef.current;
            if (hoveredNode && hoveredNode.scale > 1.05) {
                const alpha = Math.min(1, (hoveredNode.scale - 1) / 0.4);
                const name = hoveredNode.file.basename.replace('.svg', '');
                const tags = stateRef.a888aTagsMap.get(hoveredNode.file.path);
                bctx.font = `${14 / zoom}px sans-serif`;
                bctx.textAlign = 'center';
                bctx.fillStyle = `rgba(230, 210, 255, ${alpha})`;
                bctx.fillText(name, hoveredNode.x, hoveredNode.y + (hoveredNode.h * hoveredNode.scale / 2) + (18 / zoom));
                if (tags && tags.length > 0) {
                    bctx.font = `${12 / zoom}px sans-serif`;
                    bctx.fillStyle = `rgba(200, 180, 220, ${alpha * 0.8})`;
                    bctx.fillText(tags.join(', '), hoveredNode.x, hoveredNode.y + (hoveredNode.h * hoveredNode.scale / 2) + (36 / zoom));
                }
            }
            // Batch load images - limited for performance (prevents duplicate requests)
            if (toLoadLowRes.length) { requestImages(toLoadLowRes.slice(0, 16), false); }
            if (toLoadHighRes.length) { requestImages(toLoadHighRes, true); }
            bctx.restore();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(back, 0, 0, canvas.width, canvas.height);
            // Clean up unused high-res bitmaps to save memory
            for (const [path, entry] of imageCache.entries()) {
                if (entry.hiresBitmap && !visibleHiresPaths.has(path)) {
                    entry.hiresBitmap.close?.();
                    delete entry.hiresBitmap;
                    entry.hiresRequested = false;
                }
            }
        };

        const physicsStep = () => {
            if (!runPhysics.current) return 0;
            const REPULSION = 100000;   // Increased to prevent bundling
            const CENTER_PULL = 0.0008; 
            const FOCUS_PULL = 0.008;    // Much gentler attraction
            const FOCUS_PUSH = 0.0008;   // Minimal push to avoid scattering others too far
            const DAMPING = 0.92; 
            
            const nodes = nodesRef.current;
            const focusActive = stateRef.isSearching || stateRef.selectedPaths.size > 0;

            for (let i = 0; i < nodes.length; i++) {
                const n1 = nodes[i];
                if (n1 === draggedNodeRef.current) continue;
                
                const isMatch = stateRef.isSearching && stateRef.matchingImagePaths.has(n1.file.path);
                const isSelected = stateRef.selectedPaths.has(n1.file.path);
                const isFocus = isMatch || isSelected;
                const isHovered = hoveredNodeRef.current === n1;

                if (isFocus) {
                    n1.vx -= n1.x * FOCUS_PULL;
                    n1.vy -= n1.y * FOCUS_PULL;
                } else {
                    // Skip the center pull/push if we are hovering it, so it stays still for the user
                    if (!isHovered) {
                        n1.vx -= n1.x * CENTER_PULL;
                        n1.vy -= n1.y * CENTER_PULL;
                        // If focusing, push others away to clear center space
                        if (focusActive) {
                            n1.vx += n1.x * FOCUS_PUSH;
                            n1.vy += n1.y * FOCUS_PUSH;
                        }
                    }
                }
                for (let j = i + 1; j < nodes.length; j++) {
                    const n2 = nodes[j];
                    const dx = n1.x - n2.x;
                    const dy = n1.y - n2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    // Use base width for collisions so hovering (scaling) doesn't cause nodes to pop or move
                    const combinedRadius = (n1.w / 2) + (n2.w / 2) + 15;
                    if (dist < combinedRadius && dist > 0) {
                        const overlap = combinedRadius - dist;
                        const moveX = (overlap / 2) * (dx / dist) * 0.7; // Soften overlap correction
                        const moveY = (overlap / 2) * (dy / dist) * 0.7;
                        n1.x += moveX;
                        n1.y += moveY;
                        n2.x -= moveX;
                        n2.y -= moveY;
                    }
                    if (dist > 0) {
                        const force = REPULSION / (dist * dist + 100); // Added offset to prevent extreme forces
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        // Cap maximum force to prevent jittery behavior
                        const maxForce = 5.0;
                        n1.vx += Math.max(-maxForce, Math.min(maxForce, fx));
                        n1.vy += Math.max(-maxForce, Math.min(maxForce, fy));
                        n2.vx -= Math.max(-maxForce, Math.min(maxForce, fx));
                        n2.vy -= Math.max(-maxForce, Math.min(maxForce, fy));
                    }
                }
            }
            let totalMovement = 0;
            for (const node of nodes) {
                if (node === draggedNodeRef.current) continue;
                node.vx *= DAMPING;
                node.vy *= DAMPING;
                // Higher cap to allow nodes to FLY when hit hard! 🚀
                const maxVelocity = 25.0;
                node.vx = Math.max(-maxVelocity, Math.min(maxVelocity, node.vx));
                node.vy = Math.max(-maxVelocity, Math.min(maxVelocity, node.vy));
                node.x += node.vx;
                node.y += node.vy;
                totalMovement += Math.abs(node.vx) + Math.abs(node.vy);
            }
            if (totalMovement < 0.1 && !draggedNodeRef.current && !hoveredNodeRef.current) {
                runPhysics.current = false;
            }
            return totalMovement;
        };

        const setInteracting = (duration = 200) => { interactingUntilRef.current = performance.now() + duration; };
        const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
        const worldFromScreen = (sx, sy, z) => { const k = z ?? cameraState.current.zoom; return { x: (sx - CW / 2) / k + cameraState.current.camX, y: (sy - CH / 2) / k + cameraState.current.camY }; };
        const sizeToContainer = () => { const r = root.getBoundingClientRect(), dpr = Math.min(1.75, window.devicePixelRatio || 1); if (CW !== r.width || CH !== r.height || DPR !== dpr) { CW = r.width; CH = r.height; DPR = dpr; canvas.width = Math.max(1, Math.floor(CW * DPR)); canvas.height = Math.max(1, Math.floor(CH * DPR)); back.width = canvas.width; back.height = canvas.height; internalRequestRender(); } };

        const findNodeAt = (wx, wy) => { const sorted = [...nodesRef.current].sort((a, b) => b.scale - a.scale); for (const n of sorted) { const dx = wx - n.x; const dy = wy - n.y; if (dx * dx + dy * dy < (n.w * n.scale / 2) * (n.w * n.scale / 2)) return n; } return null; };

        // Track dragged node state for collision detection
        let dragLastWorld = null;
        let dragLastTime = 0;
        
        // Helper: Apply collisions along drag path - dragged node pushes others, isn't pushed back
        const applyCollisionsAt = (draggedNode, x, y, vx, vy) => {
            const draggedRadius = (draggedNode.w * draggedNode.scale / 2);
            
            nodesRef.current.forEach((other) => {
                if (other === draggedNode || other.isDragging) return;
                
                const dx = x - other.x;
                const dy = y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const otherRadius = (other.w * other.scale / 2);
                const minDist = draggedRadius + otherRadius;
                
                if (distance < minDist && distance > 0) {
                    const overlap = minDist - distance;
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
                    // Calculate drag speed for force magnitude
                    const dragSpeed = Math.sqrt(vx * vx + vy * vy);
                    
                    // MASSIVE collision forces - LAUNCH nodes based on drag speed! 🚀
                    const baseImpulse = overlap * 8.0; // Much stronger base push
                    const velocityImpulse = dragSpeed * 12.0; // HUGE speed multiplier - fast drags = LAUNCH!
                    const totalImpulse = baseImpulse + velocityImpulse;
                    
                    // ONLY apply force to OTHER node (dragged node stays locked to cursor)
                    other.vx = other.vx || 0;
                    other.vy = other.vy || 0;
                    other.vx -= nx * totalImpulse;
                    other.vy -= ny * totalImpulse;
                    
                    // Push other node away completely
                    const separation = overlap * 1.2;
                    other.x -= nx * separation;
                    other.y -= ny * separation;
                }
            });
        };

        const onPointerDown = (e) => {
            if (e.target !== canvas || document.querySelector('.panel-wrap') || document.querySelector('.image-gallery-searchbar')?.contains(e.target)) return;
            e.preventDefault();
            const r = canvas.getBoundingClientRect();
            mx = e.clientX - r.left;
            my = e.clientY - r.top;
            dragPointerId = e.pointerId;
            dragAccum = 0;
            const wp = worldFromScreen(mx, my);
            const hitNode = findNodeAt(wp.x, wp.y);
            if (hitNode) {
                draggedNodeRef.current = hitNode;
                dragLastWorld = { x: wp.x, y: wp.y };
                dragLastTime = performance.now();
                hitNode.isDragging = true;
                hitNode.vx = 0;
                hitNode.vy = 0;
                runPhysics.current = true;
            }
            canvas.setPointerCapture?.(e.pointerId);
            internalRequestRender();
        };

        const onPointerMove = (e) => {
            if (dragPointerId && e.pointerId !== dragPointerId) return;
            const r = canvas.getBoundingClientRect();
            const pMx = mx, pMy = my;
            mx = e.clientX - r.left;
            my = e.clientY - r.top;
            if (dragPointerId) {
                dragAccum += Math.hypot(mx - pMx, my - pMy);
                if (draggedNodeRef.current) {
                    const draggedNode = draggedNodeRef.current;
                    const wp = worldFromScreen(mx, my);
                    const now = performance.now();
                    const dt = Math.max(1, now - dragLastTime);
                    
                    // Store old position for path sweep
                    const oldX = draggedNode.x;
                    const oldY = draggedNode.y;
                    
                    // IMMEDIATELY update dragged node to cursor (stays locked)
                    draggedNode.x = wp.x;
                    draggedNode.y = wp.y;
                    
                    // Calculate velocity
                    const vx = (wp.x - dragLastWorld.x) / dt * 16;
                    const vy = (wp.y - dragLastWorld.y) / dt * 16;
                    draggedNode.vx = vx;
                    draggedNode.vy = vy;
                    
                    // NOW sweep collision path from old → new position
                    const dx = draggedNode.x - oldX;
                    const dy = draggedNode.y - oldY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const stepSize = 15;
                        const steps = Math.max(1, Math.ceil(distance / stepSize));
                        
                        // Check collisions along the drag path
                        for (let i = 1; i <= steps; i++) {
                            const t = i / steps;
                            const checkX = oldX + dx * t;
                            const checkY = oldY + dy * t;
                            
                            // Apply collisions to other nodes at this position
                            applyCollisionsAt(draggedNode, checkX, checkY, vx, vy);
                        }
                    }
                    
                    dragLastWorld = wp;
                    dragLastTime = now;
                    runPhysics.current = true;
                } else {
                    const dx = (mx - pMx) / cameraState.current.zoom;
                    const dy = (my - pMy) / cameraState.current.zoom;
                    cameraState.current.camX -= dx;
                    cameraState.current.camY -= dy;
                }
            } else {
                const wp = worldFromScreen(mx, my);
                const hitNode = findNodeAt(wp.x, wp.y);
                if (hoveredNodeRef.current !== hitNode) {
                    if (hitNode) {
                        effectsRef.current.push({ node: hitNode, startTime: performance.now() });
                        runPhysics.current = true;
                    }
                    hoveredNodeRef.current = hitNode;
                }
            }
            internalRequestRender();
        };

        const onPointerUp = (e) => {
            if (!dragPointerId || e.pointerId !== dragPointerId) return;
            if (draggedNodeRef.current) {
                draggedNodeRef.current.isDragging = false;
                // Keep velocity for momentum - it will decay naturally in physics
                draggedNodeRef.current = null;
                dragLastWorld = null;
                runPhysics.current = true;
            }
            dragPointerId = null;
            canvas.releasePointerCapture?.(e.pointerId);
            clickSuppressUntil = performance.now() + 250;
            if (dragAccum < 8) {
                onClick();
            }
            internalRequestRender();
        };

        const onPointerLeave = () => { hoveredNodeRef.current = null; internalRequestRender(); };
        const onWheel = (e) => { if (document.querySelector('.panel-wrap') || document.querySelector('.image-gallery-searchbar')?.contains(e.target)) return; const isZoom = e.ctrlKey || e.metaKey; if (isZoom) { e.preventDefault(); const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; const factor = Math.exp(-e.deltaY * 0.0068); const zPrime = clamp(cameraState.current.zoom * factor, 0.05, 5); zoomAnchorScreen = { x: mx, y: my }; zoomAnchorWorld = worldFromScreen(mx, my); cameraState.current.zTarget = zPrime; setInteracting(300); internalRequestRender(); } else { e.preventDefault(); const k = 1 / cameraState.current.zoom; cameraState.current.camX += e.deltaX * k; cameraState.current.camY += e.deltaY * k; cameraState.current.vX = e.deltaX * 0.02 * k; cameraState.current.vY = e.deltaY * 0.02 * k; setInteracting(120); internalRequestRender(); } };
        let gestureLast = 1; const onGestureStart = (e) => { gestureLast = 1; const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; zoomAnchorScreen = { x: mx, y: my }; zoomAnchorWorld = worldFromScreen(mx, my); zoomActiveUntil = performance.now() + 400; }; const onGestureChange = (e) => { const PINCH_SENSITIVITY = 64; const scaleRatio = e.scale / gestureLast; const amplifiedRatio = 2 + (scaleRatio - 1) * PINCH_SENSITIVITY; gestureLast = e.scale; cameraState.current.zTarget = clamp(cameraState.current.zoom * amplifiedRatio, 0.05, 5); setInteracting(); internalRequestRender(); }; const onGestureEnd = () => { zoomActiveUntil = performance.now() + 200; };
        const onClick = async () => { if (performance.now() < clickSuppressUntil) return; const wp = worldFromScreen(mx, my); const hitNode = findNodeAt(wp.x, wp.y); if (!hitNode) return; const file = hitNode.file; if (stateRef.isSelectionMode) { onToggleSelection(file.path); return; } if (stateRef.isSearching && !stateRef.matchingImagePaths.has(file.path)) return; const cached = imageCache.get(file.path); if (!cached?.bitmap) return; const tempCanvas = document.createElement('canvas'); tempCanvas.width = 16; tempCanvas.height = 20; tempCanvas.getContext('2d').drawImage(cached.bitmap, 0, 0, 16, 20); const lowResUrl = tempCanvas.toDataURL('image/jpeg', 0.1); const initialBitmap = cached.hiresBitmap || cached.bitmap; onCardClick({ path: file.path, lowResUrl, initialBitmap }); };

        sizeToContainer();
        internalRequestRender();
        let resizeRAF = 0;
        const ro = new ResizeObserver(() => { cancelAnimationFrame(resizeRAF); resizeRAF = requestAnimationFrame(sizeToContainer); });
        ro.observe(root);

        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointerleave', onPointerLeave);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('gesturestart', onGestureStart);
        canvas.addEventListener('gesturechange', onGestureChange);
        canvas.addEventListener('gestureend', onGestureEnd);

        return () => {
            ro.disconnect();
            onCacheUpdate.current = () => { };
            cancelAnimationFrame(rafId);
            running = false;
            canvas.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointerleave', onPointerLeave);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('gesturestart', onGestureStart);
            canvas.removeEventListener('gesturechange', onGestureChange);
            canvas.removeEventListener('gestureend', onGestureEnd);
        };
    }, [isFullTab, onCardClick, onToggleSelection, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, containerRef, canvasRef, nodesRefProp]);

};

/**
 * A hook to manage dynamic SVG conversion.
 */


const useExcalidrawConverter = (currentFilePath) => {
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [conversionProgress, setConversionProgress] = useState({ processed: 0, total: 0, skipped: 0 });
    const [isConverting, setIsConverting] = useState(false);
    const dependenciesRef = useRef(null);

    // --- CORRECTED ---
    // Switched to the UMD (Universal Module Definition) version of Excalidraw.
    // This version is a single script file designed for direct browser use and avoids module resolution issues.
    const EXCALIDRAW_UMD_URL = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/excalidraw.production.min.js";


    const log = useCallback((message) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 100)]);
    }, []);

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                log('Loading dependencies...');
                window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_ASSET_PATH;

                // --- CORRECTED ---
                // We now load all dependencies using the same robust legacy script loader.
                // The browser's own HTTP cache will handle storing and retrieving the script after the first load.
                const excalidrawPromise = Core.Converter.loadLegacyScript(EXCALIDRAW_UMD_URL, "ExcalidrawLib");
                const lzStringPromise = Core.Converter.loadLegacyScript(LZ_STRING_CDN_URL, "LZString");

                // Wait for scripts to be loaded (fonts will be loaded on-demand when needed)
                await Promise.all([excalidrawPromise, lzStringPromise]);

                // The UMD script attaches the Excalidraw library to window.ExcalidrawLib
                dependenciesRef.current = {
                    ExcalidrawModule: window.ExcalidrawLib,
                    LZString: window.LZString,
                    fontData: null // Will be loaded on-demand when conversion starts
                };

                log('Dependencies loaded successfully.');
                setStatus('ready');
            } catch (err) {
                console.error("Failed to load Excalidraw dependencies:", err);
                log(`ERROR: ${err.message}`);
                setError(err.message);
                setStatus('error');
            }
        };
        loadDependencies();
    }, [log]);

    const runConversionCheck = useCallback(async (onComplete) => {
        if (status !== 'ready' || !dependenciesRef.current) {
            log('Converter not ready.');
            onComplete?.(false);
            return;
        }
        
        // Load fonts on-demand (only when conversion is actually needed)
        if (!dependenciesRef.current.fontData) {
            log('Loading fonts for conversion...');
            try {
                const fontData = await Core.loadFontData(log, currentFilePath);
                dependenciesRef.current.fontData = fontData;
                log('Fonts loaded successfully.');
            } catch (error) {
                log(`Failed to load fonts: ${error.message}`);
                setIsConverting(false);
                onComplete?.(false);
                return;
            }
        }
        
        log('Starting conversion check...');
        setIsConverting(true);
        setConversionProgress({ processed: 0, total: 0, skipped: 0 });

        try {
            // Yield to UI thread before heavy file scanning
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const allFiles = dc.app.vault.getFiles();
            const filesInFolder = allFiles.filter(f => f.path.startsWith(FOLDER_PATH));
            const mdFiles = filesInFolder.filter(f => f.extension === 'md');
            const svgFilesMap = new Map(filesInFolder.filter(f => f.extension === 'svg').map(f => [f.path.replace(/\.svg$/i, ''), f]));

            const filesToConvert = [];
            const MTIME_GRACE_PERIOD_MS = 2000; // 2-second grace period

            for (const mdFile of mdFiles) {
                const basePath = mdFile.path.replace(/\.md$/i, '');
                const correspondingSvg = svgFilesMap.get(basePath);

                if (!correspondingSvg) {
                    // Condition 1: SVG does not exist. Always convert.
                    filesToConvert.push(mdFile);
                    continue;
                }

                // Condition 2 (BUG FIX): MD file is newer than the SVG file, accounting for a grace period.
                // This prevents re-conversion if timestamps are too close together due to fast file writes or filesystem resolution limits.
                if (mdFile.stat.mtime > correspondingSvg.stat.mtime + MTIME_GRACE_PERIOD_MS) {
                    filesToConvert.push(mdFile);
                }
            }

            if (filesToConvert.length === 0) {
                log('All assets are up-to-date.');
                setIsConverting(false);
                onComplete?.(false);
                return;
            }

            log(`Found ${filesToConvert.length} files to convert/update.`);
            setConversionProgress({ processed: 0, total: filesToConvert.length, skipped: 0 });

            // Detect file dependencies (files that reference other files)
            const detectDependencies = async (file) => {
                try {
                    const content = await dc.app.vault.adapter.read(file.path);
                    const dependencies = [];
                    
                    // Look for file references in the content
                    // Matches: [[filename]], ![[filename]], [[folder/filename]]
                    const linkPattern = /\[\[([^\]]+)\]\]/g;
                    let match;
                    while ((match = linkPattern.exec(content)) !== null) {
                        const refPath = match[1];
                        // Check if this references another .md file in our folder
                        const possiblePaths = [
                            `${FOLDER_PATH}/${refPath}.md`,
                            `${FOLDER_PATH}/${refPath}`,
                            refPath.endsWith('.md') ? `${FOLDER_PATH}/${refPath}` : null
                        ].filter(Boolean);
                        
                        for (const possPath of possiblePaths) {
                            if (mdFiles.find(f => f.path === possPath)) {
                                dependencies.push(possPath);
                                break;
                            }
                        }
                    }
                    
                    return dependencies;
                } catch (err) {
                    return [];
                }
            };

            // Build dependency map
            log('Analyzing file dependencies...');
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const dependencyMap = new Map();
            for (const file of filesToConvert) {
                const deps = await detectDependencies(file);
                if (deps.length > 0) {
                    dependencyMap.set(file.path, deps);
                    log(`📎 ${file.basename} depends on ${deps.length} file(s)`);
                }
            }

            // Sort files: independent files first, dependent files last
            const sortedFiles = [];
            const filesWithDeps = [];
            
            for (const file of filesToConvert) {
                if (dependencyMap.has(file.path)) {
                    filesWithDeps.push(file);
                } else {
                    sortedFiles.push(file);
                }
            }
            
            // Add dependent files at the end
            sortedFiles.push(...filesWithDeps);
            
            if (filesWithDeps.length > 0) {
                log(`⏳ ${filesWithDeps.length} file(s) will be converted last (have dependencies)`);
            }

            const queue = [...sortedFiles];
            let processed = 0;
            let skipped = 0;

            const worker = async () => {
                while (queue.length > 0) {
                    const file = queue.shift();
                    if (!file) continue;
                    
                    // Yield every 2 files to prevent lag spikes
                    if (processed % 2 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                    
                    const result = await Core.Converter.processFileWithLibrary(
                        file.path, 
                        dependenciesRef.current.ExcalidrawModule, 
                        dependenciesRef.current.LZString, 
                        dependenciesRef.current.fontData, 
                        log
                    );
                    
                    if (result.skipped) {
                        skipped++;
                    }
                    processed++;
                    
                    // Throttle progress updates to every 2 files
                    if (processed % 2 === 0 || processed === filesToConvert.length) {
                        setConversionProgress({ 
                            processed, 
                            total: filesToConvert.length, 
                            skipped 
                        });
                    }
                }
            };

            // Use single worker to prevent overwhelming the system
            await worker();

            log('Conversion check complete.');
            setIsConverting(false);
            onComplete?.(true);
        } catch (err) {
            console.error('Error during conversion check:', err);
            log(`ERROR: ${err.message}`);
            setIsConverting(false);
            onComplete?.(false);
        }
    }, [status, log]);

    return { status, error, logs, runConversionCheck, converterDeps: dependenciesRef.current, conversionProgress, isConverting };
};

/**
 * A hook to manage GitHub asset synchronization
 */
const useGitHubSync = (converterStatus, converterDeps, hasConsented, CONSENT_FILE_PATH, currentFilePath) => {
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
    const [syncProgress, setSyncProgress] = useState({ processed: 0, converted: 0, total: 0, skipped: 0 });
    const [syncLogs, setSyncLogs] = useState([]);
    const [syncError, setSyncError] = useState(null);
    const hasInitialSyncRef = useRef(false);

    const log = useCallback((message) => {
        setSyncLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 100)]);
    }, []);

    const syncFromGitHub = useCallback(async (forceDownload = false) => {
        if (syncStatus === 'syncing') {
            log('Sync already in progress...');
            return;
        }

        if (!converterDeps) {
            log('Converter not ready yet...');
            return;
        }

        // Load fonts on-demand (only when sync/conversion is actually needed)
        if (!converterDeps.fontData) {
            log('Loading fonts for conversion...');
            try {
                const fontData = await Core.loadFontData(log, currentFilePath);
                converterDeps.fontData = fontData;
                log('Fonts loaded successfully.');
            } catch (error) {
                log(`Failed to load fonts: ${error.message}`);
                setSyncStatus('error');
                setSyncError(error.message);
                return;
            }
        }

        setSyncStatus('syncing');
        setSyncError(null);
        setSyncProgress({ processed: 0, converted: 0, total: 0, skipped: 0 });
        log('Starting GitHub sync in background...');

        try {
            const result = await Core.GitHub.downloadAllAssets(
                log, 
                (processed, converted, total, skipped) => {
                    setSyncProgress({ processed, converted, total, skipped });
                },
                converterDeps,
                forceDownload
            );

            const message = `✅ Sync complete: ${result.downloaded} new, ${result.skipped} existing, ${result.converted} converted`;
            log(message);

            setSyncStatus('success');
        } catch (error) {
            console.error('GitHub sync error:', error);
            log(`ERROR: ${error.message}`);
            setSyncError(error.message);
            setSyncStatus('error');
        }
    }, [syncStatus, log, converterDeps]);

    // Smart auto-sync: Initial consent triggers immediate sync, then weekly or when folder is empty
    useEffect(() => {
        const checkAndSync = async () => {
            if (!hasInitialSyncRef.current && converterStatus === 'ready' && converterDeps && hasConsented) {
                hasInitialSyncRef.current = true;
                
                try {
                    // Check if consent file has lastSync timestamp
                    let shouldSync = false;
                    let reason = '';
                    
                    if (await dc.app.vault.adapter.exists(CONSENT_FILE_PATH)) {
                        const content = await dc.app.vault.adapter.read(CONSENT_FILE_PATH);
                        const data = JSON.parse(content || "{}");
                        
                        if (!data.lastSync) {
                            // First time after consent - always sync
                            shouldSync = true;
                            reason = 'Initial sync after consent';
                        } else {
                            // Check if folder has any .md files
                            const folderExists = await dc.app.vault.adapter.exists(FOLDER_PATH);
                            let hasMdFiles = false;
                            
                            if (folderExists) {
                                const files = await dc.app.vault.adapter.list(FOLDER_PATH);
                                hasMdFiles = files.files.some(f => f.endsWith('.md'));
                            }
                            
                            if (!hasMdFiles) {
                                // Folder is empty or doesn't exist - sync immediately
                                shouldSync = true;
                                reason = 'Folder empty or missing';
                            } else {
                                // Check if a week has passed
                                const lastSyncTime = new Date(data.lastSync).getTime();
                                const weekInMs = 7 * 24 * 60 * 60 * 1000;
                                const now = Date.now();
                                
                                if (now - lastSyncTime >= weekInMs) {
                                    shouldSync = true;
                                    reason = 'Weekly sync (7 days passed)';
                                } else {
                                    log(`⏭️ Skipping sync - last synced ${Math.floor((now - lastSyncTime) / (24 * 60 * 60 * 1000))} days ago`);
                                }
                            }
                        }
                    } else {
                        // No consent file yet (shouldn't happen, but handle it)
                        shouldSync = true;
                        reason = 'First sync (no previous record)';
                    }
                    
                    if (shouldSync) {
                        log(`🔄 ${reason} - syncing from GitHub...`);
                        await syncFromGitHub(false);
                        
                        // Update lastSync timestamp
                        try {
                            const content = await dc.app.vault.adapter.read(CONSENT_FILE_PATH);
                            const data = JSON.parse(content || "{}");
                            data.lastSync = new Date().toISOString();
                            await dc.app.vault.adapter.write(CONSENT_FILE_PATH, JSON.stringify(data, null, 2));
                        } catch (err) {
                            console.error('Error updating lastSync timestamp:', err);
                        }
                    }
                } catch (err) {
                    console.error('Error checking sync conditions:', err);
                    log(`⚠️ Error checking sync: ${err.message}`);
                }
            }
        };
        
        checkAndSync();
    }, [converterStatus, converterDeps, syncFromGitHub, log, hasConsented]);

    return {
        syncStatus,
        syncProgress,
        syncLogs,
        syncError,
        syncFromGitHub
    };
};

// --- 3. View Components ---

/**
 * Renders the Grid View canvas.
 */
const GridView = ({ isFullTab, imagesToDisplay, onCardClick, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, isTransitioning, initialPositions, onTransitionEnd }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    useInteractiveCanvas(
        { containerRef, canvasRef, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, isTransitioning, initialPositions, onTransitionEnd },
        isFullTab, onCardClick, imagesToDisplay, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection
    );

    return (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
            <canvas ref={canvasRef} className="interactive-canvas" />
        </div>
    );
};

/**
 * Renders the Graph View canvas.
 */
const GraphView = ({ isFullTab, imagesToDisplay, onCardClick, a888aTagsMap, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, nodesRef }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    useGraphCanvas(
        { containerRef, canvasRef, imageCache, requestImages, requestedSet, onCacheUpdate, interactingUntilRef, resetViewKey, nodesRef },
        isFullTab, onCardClick, imagesToDisplay, a888aTagsMap, isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection
    );

    return (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
            <canvas ref={canvasRef} className="interactive-canvas" />
        </div>
    );
};

const ConverterLoadingView = ({ logs, syncStatus, syncProgress, syncLogs }) => {
    const allLogs = useMemo(() => {
        // Combine converter logs and sync logs, most recent first
        const combined = [...syncLogs, ...logs];
        return combined.slice(0, 100); // Limit to 100 most recent
    }, [logs, syncLogs]);

    const progressText = useMemo(() => {
        if (syncStatus === 'syncing') {
            const { processed, converted, total, skipped } = syncProgress;
            if (total > 0) {
                return `Processing: ${processed}/${total} files • ${converted} converted • ${skipped} skipped`;
            }
            return 'Fetching file list from GitHub...';
        }
        return 'Loading Excalidraw libraries and preparing for SVG conversion...';
    }, [syncStatus, syncProgress]);

    return (
        <div style={{ padding: '20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f0a12' }}>
            <h3 style={{ color: '#d1bfff' }}>
                {syncStatus === 'syncing' ? '🔄 Syncing Assets...' : '⚙️ Initializing Asset Engine...'}
            </h3>
            <p style={{ color: '#8a7c9c', fontSize: '13px', maxWidth: '500px', lineHeight: '1.6' }}>
                {progressText}
            </p>
            {syncStatus === 'syncing' && syncProgress.total > 0 && (
                <div style={{ width: '80%', maxWidth: '500px', marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                        <span>Downloaded: {syncProgress.processed - syncProgress.skipped}</span>
                        <span>Converted: {syncProgress.converted}</span>
                        <span>Skipped: {syncProgress.skipped}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${(syncProgress.processed / syncProgress.total) * 100}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #8758FF, #C77DF2)',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>
            )}
            <div style={{ height: '200px', width: 'clamp(300px, 80%, 600px)', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', borderRadius: '6px', padding: '10px', overflowY: 'auto', fontSize: '11px', textAlign: 'left', fontFamily: 'monospace', color: '#aaa', marginTop: '20px' }}>
                {allLogs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
};

const ConverterErrorView = ({ error }) => (
    <div style={{ padding: '20px', textAlign: 'center', color: '#ff8a8a', background: '#0f0a12', height: '100%', display: 'grid', placeContent: 'center' }}>
        <h3>Critical Initialization Error</h3>
        <p>Could not load required libraries for Excalidraw conversion.</p>
        <p style={{ color: '#aaa', fontSize: '12px', marginTop: '10px', fontFamily: 'monospace' }}>{error}</p>
    </div>
);

const BackgroundSyncNotification = ({ syncStatus, syncProgress, onDismiss, notificationIndex }) => {
    if (syncStatus !== 'syncing') return null;

    const { processed, converted, total, skipped } = syncProgress;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

    return (
        <div style={{
            position: 'fixed',
            top: `${20 + (notificationIndex * 120)}px`,
            right: '20px',
            zIndex: 10000,
            background: 'rgba(24, 15, 28, 0.98)',
            border: '1px solid rgba(135, 88, 255, 0.5)',
            borderRadius: '8px',
            padding: '12px 16px',
            minWidth: '340px',
            maxWidth: '400px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7), 0 0 30px rgba(135, 88, 255, 0.15)',
            animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'top 0.3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8758FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                    </svg>
                    <span style={{ color: '#d1bfff', fontSize: '13px', fontWeight: '600' }}>
                        GitHub Sync
                    </span>
                </div>
                {onDismiss && (
                    <button 
                        onClick={onDismiss}
                        style={{
                            all: 'unset',
                            cursor: 'pointer',
                            color: '#666',
                            fontSize: '20px',
                            lineHeight: '1',
                            padding: '0 4px',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#aaa'}
                        onMouseLeave={(e) => e.target.style.color = '#666'}
                        title="Dismiss (continues in background)"
                    >×</button>
                )}
            </div>
            
            <div style={{ fontSize: '11px', color: '#9a92b0', marginBottom: '8px' }}>
                {total > 0 ? `${processed}/${total} files (${percentage}%)` : 'Fetching file list...'}
            </div>

            {total > 0 && (
                <>
                    <div style={{ 
                        height: '4px', 
                        background: 'rgba(0,0,0,0.4)', 
                        borderRadius: '2px', 
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        <div style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #8758FF, #C77DF2)',
                            transition: 'width 0.3s ease',
                            borderRadius: '2px'
                        }}></div>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        fontSize: '10px', 
                        color: '#777',
                        justifyContent: 'flex-start',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#8758FF' }}>✓</span> {converted} converted
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#4CAF50' }}>↓</span> {processed - skipped} new
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#666' }}>⊘</span> {skipped} skipped
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};

const BackgroundConversionNotification = ({ isConverting, conversionProgress, onDismiss, notificationIndex }) => {
    if (!isConverting) return null;

    const { processed, total, skipped } = conversionProgress;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    const converted = processed - skipped;

    return (
        <div style={{
            position: 'fixed',
            top: `${20 + (notificationIndex * 120)}px`,
            right: '20px',
            zIndex: 10000,
            background: 'rgba(24, 15, 28, 0.98)',
            border: '1px solid rgba(255, 167, 38, 0.5)',
            borderRadius: '8px',
            padding: '12px 16px',
            minWidth: '340px',
            maxWidth: '400px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 167, 38, 0.15)',
            animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'top 0.3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFA726" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    <span style={{ color: '#ffd1a7', fontSize: '13px', fontWeight: '600' }}>
                        SVG Conversion
                    </span>
                </div>
                {onDismiss && (
                    <button 
                        onClick={onDismiss}
                        style={{
                            all: 'unset',
                            cursor: 'pointer',
                            color: '#666',
                            fontSize: '20px',
                            lineHeight: '1',
                            padding: '0 4px',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#aaa'}
                        onMouseLeave={(e) => e.target.style.color = '#666'}
                        title="Dismiss (continues in background)"
                    >×</button>
                )}
            </div>
            
            <div style={{ fontSize: '11px', color: '#c4a897', marginBottom: '8px' }}>
                {total > 0 ? `${processed}/${total} files (${percentage}%)` : 'Scanning files...'}
            </div>

            {total > 0 && (
                <>
                    <div style={{ 
                        height: '4px', 
                        background: 'rgba(0,0,0,0.4)', 
                        borderRadius: '2px', 
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        <div style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #FFA726, #FFB74D)',
                            transition: 'width 0.3s ease',
                            borderRadius: '2px'
                        }}></div>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        fontSize: '10px', 
                        color: '#777',
                        justifyContent: 'flex-start',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#FFA726' }}>✓</span> {converted} converted
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#666' }}>⊘</span> {skipped} skipped
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};


// --- 4. UI Components ---

const DropdownBase = ({ buttonContent, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false); } };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="dropdown-container" ref={dropdownRef}>
            <button className="dropdown-btn" onClick={() => setIsOpen(!isOpen)}>
                {buttonContent(isOpen)}
            </button>
            {isOpen && <div className="dropdown-menu">{children(setIsOpen)}</div>}
        </div>
    );
};

const SortDropdown = ({ options, value, onChange }) => {
    const selectedOption = options.find(opt => opt.value === value);
    return (
        <DropdownBase buttonContent={(isOpen) => (
            <>
                <Icon icon="align-left" size={14} />
                <span>{selectedOption?.label || 'Sort By'}</span>
                <Icon icon="chevron-down" size={10} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </>
        )}>
            {(setIsOpen) => options.map(option => (
                <div key={option.value} className={`dropdown-item ${value === option.value ? 'active' : ''}`} onClick={() => { onChange(option.value); setIsOpen(false); }}>
                    {option.label}
                </div>
            ))}
        </DropdownBase>
    );
};

const ViewDropdown = ({ value, onChange }) => {
    const options = [
        { value: 'grid', label: 'Grid', icon: <Icon icon="layout-grid" size={14} /> },
        { value: 'graph', label: 'Graph', icon: <Icon icon="share-2" size={14} /> }
    ];
    const selectedOption = options.find(opt => opt.value === value);
    return (
        <DropdownBase buttonContent={(isOpen) => (
            <>
                {selectedOption.icon}
                <Icon icon="chevron-down" size={10} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </>
        )}>
            {(setIsOpen) => options.map(option => (
                <div key={option.value} className={`dropdown-item with-icon ${value === option.value ? 'active' : ''}`} onClick={() => { onChange(option.value); setIsOpen(false); }}>
                    {option.icon} <span>{option.label}</span>
                </div>
            ))}
        </DropdownBase>
    );
};

const TagsPanel = ({ tags, onTagClick, onClose }) => {
    if (!tags || tags.length === 0) {
        return <div className="tags-panel">No tags found.</div>;
    }
    return (
        <div className="tags-panel">
            {tags.map(tag => (
                <button key={tag} className="tag-btn" onClick={() => onTagClick(tag)}>
                    {tag}
                </button>
            ))}
        </div>
    );
};

const SearchBar = ({ searchTerm, onSearchChange, onClear, onInputMount, sortOption, onSortChange, sortOptions, viewType, onViewChange, isSelectionMode, onToggleSelectionMode, allTags, onTagClick, onResetView, onSyncGitHub, syncStatus }) => {
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isFocused, setIsFocused] = useState(false);
    const [isTagsPanelOpen, setIsTagsPanelOpen] = useState(false);
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0, moveHandler: null, upHandler: null });
    const barRef = useRef(null);
    const localInputRef = useRef(null);
    const STORAGE_KEY = 'image-gallery-searchbar-pos';
    useEffect(() => { if (localInputRef.current && onInputMount) { onInputMount(localInputRef.current); } }, [onInputMount]);

    useEffect(() => {
        try {
            const savedPos = localStorage.getItem(STORAGE_KEY);
            if (savedPos) { setPosition(JSON.parse(savedPos)); }
        } catch (e) {
            console.error("Could not load search bar position:", e);
        }
    }, []);

    useEffect(() => { const ref = dragRef.current; return () => { window.removeEventListener('pointermove', ref.moveHandler); window.removeEventListener('pointerup', ref.upHandler); }; }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (barRef.current && !barRef.current.contains(event.target)) {
                setIsFocused(false);
                setIsTagsPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onPointerDown = (e) => {
        if (e.target.closest('input') || e.target.closest('button') || e.target.closest('.dropdown-container')) return;
        e.stopPropagation();
        const moveHandler = (moveEvent) => {
            if (!dragRef.current.isDragging) return;
            const dx = moveEvent.clientX - dragRef.current.startX;
            const dy = moveEvent.clientY - dragRef.current.startY;
            setPosition({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy });
        };
        const upHandler = () => {
            dragRef.current.isDragging = false;
            setPosition(currentPos => {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPos));
                } catch (e) {
                    console.error("Could not save search bar position:", e);
                }
                return currentPos;
            });
            window.removeEventListener('pointermove', moveHandler);
            window.removeEventListener('pointerup', upHandler);
        };
        dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialX: position.x, initialY: position.y };
        window.addEventListener('pointermove', moveHandler);
        window.addEventListener('pointerup', upHandler);
    };
    const isCollapsed = !isFocused && !searchTerm && !isSelectionMode;
    const handleBarClick = (e) => {
        if (isCollapsed) {
            setIsFocused(true);
            localInputRef.current?.focus();
        } else if (e.target.closest('.action-menu-icon')) {
            setIsFocused(false);
            setIsTagsPanelOpen(false);
        }
    };
    const handleTagButtonClick = (tag) => {
        onTagClick(tag);
        setIsTagsPanelOpen(false);
        setIsFocused(true);
    };
    return (
        <div ref={barRef} className={`image-gallery-searchbar ${isCollapsed ? 'collapsed' : ''}`} style={{ transform: `translate(${position.x}px, ${position.y}px)` }} onClick={handleBarClick}>
            <div className="action-menu-icon" onPointerDown={onPointerDown} title="Drag to move controls">
                <Icon icon="sliders-horizontal" size={16} />
            </div>
            <div className="search-bar-divider"></div>
            <ViewDropdown value={viewType} onChange={onViewChange} />
            <div className="search-bar-divider"></div>
            <input ref={localInputRef} type="text" placeholder="Search..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} onFocus={() => setIsFocused(true)} />
            {searchTerm && (<button className="clear-btn" onClick={onClear}><Icon icon="x" size={12} /></button>)}
            <div className="search-bar-divider"></div>
            <SortDropdown options={sortOptions} value={sortOption} onChange={onSortChange} />
            <div className="search-bar-divider"></div>
            <button className="select-btn" onClick={onResetView} title="Reset View"><Icon icon="rotate-ccw" size={16} /></button>
            <div className="search-bar-divider"></div>
            <button 
                className={`select-btn ${syncStatus === 'syncing' ? 'active' : ''}`} 
                onClick={onSyncGitHub} 
                disabled={syncStatus === 'syncing'}
                title="Sync from GitHub"
            >
                <Icon icon="refresh-cw" size={16} style={{ animation: syncStatus === 'syncing' ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <div className="search-bar-divider"></div>
            <button className={`select-btn tag-btn-toggle ${isTagsPanelOpen ? 'active' : ''}`} onClick={() => setIsTagsPanelOpen(!isTagsPanelOpen)} title="Browse Tags"><Icon icon="tag" size={16} /></button>
            <div className="search-bar-divider"></div>
            <button className={`select-btn ${isSelectionMode ? 'active' : ''}`} onClick={onToggleSelectionMode} title="Toggle Selection Mode"><Icon icon="check-square" size={16} /></button>

            {isTagsPanelOpen && <TagsPanel tags={allTags} onTagClick={handleTagButtonClick} />}
        </div>
    );
};

const MassEditPanel = ({ selectedCount, onApplyPreset, onApplyA888a, onApplyCustom, onClear, onClose }) => {
    const [key, setKey] = useState('data-tag');
    const [value, setValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const panelRef = useRef(null);

    const onPointerDown = (e) => {
        if (e.target.closest('input') || e.target.closest('button')) return;
        e.stopPropagation();
        dragRef.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y
        };
        const moveHandler = (moveEvent) => {
            if (!dragRef.current.isDragging) return;
            const dx = moveEvent.clientX - dragRef.current.startX;
            const dy = moveEvent.clientY - dragRef.current.startY;
            setPosition({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy });
        };
        const upHandler = () => {
            dragRef.current.isDragging = false;
            window.removeEventListener('pointermove', moveHandler);
            window.removeEventListener('pointerup', upHandler);
        };
        window.addEventListener('pointermove', moveHandler);
        window.addEventListener('pointerup', upHandler);
    };

    const handleApply = async () => {
        setIsProcessing(true);
        await onApplyCustom(key, value);
        setIsProcessing(false);
    };

    return (
        <div 
            ref={panelRef} 
            className={`mass-edit-panel ${isProcessing ? 'processing' : ''}`} 
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onPointerDown={onPointerDown}
        >
            <div className="mass-edit-header">
                <Icon icon={isProcessing ? "loader" : "edit-3"} size={14} className={isProcessing ? "spin" : ""} />
                <h3>{isProcessing ? "Processing Assets..." : `${selectedCount} Asset${selectedCount > 1 ? 's' : ''}`}</h3>
                {!isProcessing && <button onClick={onClose} className="close-btn"><Icon icon="x" size={16} /></button>}
            </div>
            <div className="mass-edit-body">
                <div className="mass-edit-section">
                    <label>A888a Presets</label>
                    <div className="mass-edit-presets">
                        <button disabled={isProcessing} className="preset-btn" onClick={() => onApplyA888a('hot+')}>hot+</button>
                        <button disabled={isProcessing} className="preset-btn" onClick={() => onApplyA888a('one')}>one</button>
                    </div>
                </div>
                <div className="mass-edit-section">
                    <label>Tag Presets</label>
                    <div className="mass-edit-presets">
                        <button disabled={isProcessing} className="preset-btn" onClick={() => onApplyPreset('hot+')}>hot+</button>
                        <button disabled={isProcessing} className="preset-btn" onClick={() => onApplyPreset('old')}>old</button>
                    </div>
                </div>
                <div className="mass-edit-divider"></div>
                <div className="mass-edit-section custom-prop">
                    <div className="input-row">
                        <input disabled={isProcessing} type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="Property" />
                        <input disabled={isProcessing} type="text" value={value} onChange={e => setValue(e.target.value)} placeholder="Value" />
                    </div>
                </div>
            </div>
            <div className="mass-edit-footer">
                <button disabled={isProcessing} className="mass-btn ghost" onClick={onClear}>Clear</button>
                <button disabled={isProcessing || !key.trim()} className="mass-btn primary" onClick={handleApply}>
                    {isProcessing ? "Working..." : "Apply"}
                </button>
            </div>
        </div>
    );
};

const ProgressiveImage = ({ lowResSrc, initialBitmap, highResPath, alt }) => {
    const [highResSvgUrl, setHighResSvgUrl] = useState(null);
    const canvasRef = useRef(null);
    useEffect(() => {
        setHighResSvgUrl(null);
        const canvas = canvasRef.current;
        if (canvas && initialBitmap) {
            canvas.width = initialBitmap.width;
            canvas.height = initialBitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(initialBitmap, 0, 0);
        }
    }, [initialBitmap]);
    useEffect(() => {
        let isCancelled = false; let objectUrl = null;
        const loadHighRes = async () => {
            try {
                const file = dc.app.vault.getAbstractFileByPath(highResPath);
                if (!file) return;
                const svgText = await dc.app.vault.read(file);
                const blob = new Blob([svgText], { type: 'image/svg+xml' });
                objectUrl = URL.createObjectURL(blob);
                if (!isCancelled) { setHighResSvgUrl(objectUrl); }
            } catch (err) { console.error("Failed to load high-res image:", err); }
        };
        loadHighRes();
        return () => { isCancelled = true; if (objectUrl) { URL.revokeObjectURL(objectUrl); } };
    }, [highResPath]);
    const isFinal = !!highResSvgUrl;
    return (
        <div className="progressive-image-container">
            <img src={lowResSrc} alt={alt} className="panel-img low-res" style={{ opacity: isFinal ? 0 : 1 }} />
            <canvas ref={canvasRef} className="panel-img med-res" style={{ opacity: isFinal ? 0 : 1 }} />
            {highResSvgUrl && (<img src={highResSvgUrl} alt={alt} className="panel-img high-res" style={{ opacity: isFinal ? 1 : 0 }} />)}
        </div>
    );
};

const ZoomableImage = ({ lowResUrl, initialBitmap, highResPath, alt }) => {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [panning, setPanning] = useState(false);
    const last = useRef({ x: 0, y: 0 });
    const MIN = 1, MAX = 8;
    useEffect(() => { setScale(1); setPos({ x: 0, y: 0 }); }, [highResPath]);
    useEffect(() => { if (contentRef.current) { contentRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${scale})`; } }, [scale, pos]);
    const zoomAt = (factor, cx, cy) => {
        const rect = containerRef.current.getBoundingClientRect();
        const mx = cx === undefined ? rect.width / 2 : cx - rect.left;
        const my = cy === undefined ? rect.height / 2 : cy - rect.top;
        const prev = scale; const next = Math.max(MIN, Math.min(MAX, prev * factor)); const s = next / prev;
        const dx = (pos.x - (mx - rect.width / 2)) * s + (mx - rect.width / 2);
        const dy = (pos.y - (my - rect.height / 2)) * s + (my - rect.height / 2);
        setScale(next); setPos({ x: dx, y: dy });
    };
    const onWheel = (e) => { e.preventDefault(); if (e.ctrlKey || e.metaKey) { const factor = Math.exp(-e.deltaY * 0.0015); zoomAt(factor, e.clientX, e.clientY); } else { setPos((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY })); } };
    const onPointerDown = (e) => { if (e.target.closest('button')) return; setPanning(true); last.current = { x: e.clientX, y: e.clientY }; containerRef.current.setPointerCapture?.(e.pointerId); };
    const onPointerMove = (e) => { if (!panning) return; const dx = e.clientX - last.current.x; const dy = e.clientY - last.current.y; last.current = { x: e.clientX, y: e.clientY }; setPos((p) => ({ x: p.x + dx, y: p.y + dy })); };
    const onPointerUp = (e) => { if (!panning) return; setPanning(false); containerRef.current.releasePointerCapture?.(e.pointerId); };
    const handleZoomIn = (e) => { e.stopPropagation(); zoomAt(1.4); };
    const handleZoomOut = (e) => { e.stopPropagation(); zoomAt(1 / 1.4); };
    const handleReset = (e) => { e.stopPropagation(); setScale(1); setPos({ x: 0, y: 0 }); };
    return (
        <div ref={containerRef} className="zoom-container" onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onDoubleClick={(e) => zoomAt(1.5, e.clientX, e.clientY)}>
            <div ref={contentRef} className="zoom-content-wrapper">
                <ProgressiveImage lowResSrc={lowResUrl} initialBitmap={initialBitmap} highResPath={highResPath} alt={alt} />
            </div>
            <div className="zoom-controls">
                <button className="panel-icon-btn" onClick={handleZoomOut} title="Zoom Out"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                <button className="panel-icon-btn" onClick={handleReset} title="Reset Zoom"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg></button>
                <button className="panel-icon-btn" onClick={handleZoomIn} title="Zoom In"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
            </div>
        </div>
    );
};


const viewStyling = `
/* --- STYLES --- */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.spin { animation: spin 1s linear infinite; }
.mass-edit-panel.processing { opacity: 0.9; cursor: wait; pointer-events: none; }
@keyframes slideInRight {
    from { 
        opacity: 0;
        transform: translateX(100px);
    }
    to { 
        opacity: 1;
        transform: translateX(0);
    }
}
@keyframes nf-dropdownIn {
    from { 
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
    }
    to { 
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
.tags-panel { position: absolute; top: 110%; left: 0; max-height: 300px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 8px; width: 400px; background: rgba(30, 20, 35, 0.9); border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 12px; z-index: 20; }
.tag-btn { all: unset; box-sizing: border-box; cursor: pointer; padding: 6px 12px; border-radius: 14px; background: rgba(255,255,255,0.1); font-size: 13px; transition: all .2s; }
.tag-btn:hover { background: rgba(135, 88, 255, 0.4); color: white; }
.tag-btn-toggle.active { color: #87ffc5; background: rgba(135, 255, 197, 0.15); box-shadow: 0 0 8px rgba(135, 255, 197, 0.5); }
.full-tab-wrapper { position: relative; height: 100%; width: 100%; background: #0f0a12; border-radius: 10px; overflow: hidden; }
.mini-canvas-wrapper { position: relative; height: 650px; width: 100%; background: #0f0a12; border-radius: 10px; overflow: hidden; border: 1px solid rgba(200, 160, 255, 0.2); }
.fullscreen-toggle-btn { 
    all: unset; 
    box-sizing: border-box;
    position: absolute; 
    top: 14px; 
    right: 18px; 
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    color: rgba(255, 255, 255, 0.7); 
    cursor: pointer; 
    transition: all .2s cubic-bezier(0.4, 0, 0.2, 1); 
    z-index: 10; 
    pointer-events: auto;
    display: grid;
    place-items: center;
}
.fullscreen-toggle-btn:hover { 
    background: rgba(255, 255, 255, 0.12); 
    color: white; 
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.interactive-canvas { display: block; width: 100%; height: 100%; cursor: default; touch-action: none; background-color: #0f0a12; }
.overlay { position: absolute; inset: 0; pointer-events: none; }
.subtle-icon { position: absolute; top: 14px; right: 18px; color: rgba(200, 180, 220, 0.6); cursor: pointer; opacity: 0.5; transform: scale(.95); transition: all .2s; z-index: 10; pointer-events: auto; }
.full-tab-wrapper:hover .subtle-icon { opacity: 1; transform: scale(1); }
.fullscreen-active { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 9998; }
.panel-wrap { box-sizing: border-box; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(12px) saturate(1.2); pointer-events: auto; animation: fadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1); z-index: 100; padding: 2.5rem; }
.panel { display: flex; flex-direction: column; width: min(100%, 95vw); max-width: 1200px; height: min(100%, 90vh); background: rgba(24, 15, 28, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; box-shadow: 0 0 80px -20px rgba(200, 160, 255, 0.3); animation: scaleIn 0.4s cubic-bezier(0.25, 1, 0.5, 1); overflow: hidden; }
.panel-img-box { flex-grow: 1; position: relative; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03), transparent 70%); }
.panel-img { display: block; width: 100%; height: 100%; object-fit: contain; }
.panel-controls { display: flex; align-items: center; gap: 16px; padding: 12px 24px; border-top: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
.panel-info { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.panel-title { font-size: 16px; font-weight: 600; color: rgba(230, 210, 255, 0.95); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.panel-row { font-size: 12px; color: rgba(200, 180, 220, 0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.panel-tags { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 4px; }
.panel-tag { background: rgba(255, 255, 255, 0.1); color: rgba(200, 180, 220, 0.8); padding: 3px 8px; font-size: 11px; border-radius: 10px; font-weight: 500; }
.btn-group { display: flex; gap: 10px; }
.panel-icon-btn { all: unset; box-sizing: border-box; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.05); color: rgba(200, 180, 220, 0.6); cursor: pointer; transition: all 0.2s; }
.panel-icon-btn:hover { background: rgba(255,255,255,0.1); color: rgba(230, 210, 255, 0.95); }
.panel-icon-btn.danger:hover { color: #ff8080; }
.panel-icon-btn.active { color: #87ffc5; }
.compact-wrapper { padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border: 1px dashed var(--background-modifier-border); border-radius: 8px; background-color: var(--background-primary-alt); }
.compact-controls .btn { padding: 10px 14px; font-size: 12px; border-radius: 12px; border: 1px solid rgba(200, 160, 255, .35); background: rgba(22, 15, 28, .9); color: rgb(200, 160, 255); }
.compact-controls .btn.ghost { border-color: rgba(200, 160, 255, .2); background: transparent; color: rgba(200, 160, 255, .85); }
.zoom-container { position: relative; width: 100%; height: 100%; overflow: hidden; cursor: grab; }
.zoom-container:active { cursor: grabbing; }
.zoom-content-wrapper { width: 100%; height: 100%; will-change: transform; transform-origin: center center; position: relative; }
.zoom-controls { position: absolute; right: 16px; bottom: 16px; display: flex; gap: 8px; pointer-events: auto; background: rgba(24, 15, 28, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 4px; backdrop-filter: blur(8px); }
.progressive-image-container { width: 100%; height: 100%; }
.progressive-image-container .panel-img { position: absolute; top:0; left:0; width:100%; height:100%; will-change: opacity; transition: opacity 0.4s ease-in-out; padding: 16px; box-sizing: border-box; }
.progressive-image-container .low-res { filter: blur(12px); transform: scale(1.05); }
.progressive-image-container .med-res { object-fit: contain; }
.progressive-image-container .high-res { opacity: 0; }
@keyframes glow-animation { 0% { box-shadow: 0 0 8px rgba(170, 130, 255, 0.4); } 50% { box-shadow: 0 0 16px rgba(170, 130, 255, 0.7); } 100% { box-shadow: 0 0 8px rgba(170, 130, 255, 0.4); } }
.image-gallery-searchbar {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, rgba(28, 22, 42, 0.9) 0%, rgba(18, 12, 28, 0.95) 100%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(24px) saturate(1.8);
    z-index: 9999 !important;
    touch-action: none;
    user-select: none;
    pointer-events: auto !important;
    border-radius: 22px;
    padding: 6px 10px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.image-gallery-searchbar.collapsed { width: 44px; height: 44px; box-sizing: border-box; cursor: pointer; animation: glow-animation 3s infinite ease-in-out; padding: 0; border-radius: 50%; }
.image-gallery-searchbar.collapsed:hover { box-shadow: 0 0 24px rgba(170, 130, 255, 0.6); transform: scale(1.05); }
.image-gallery-searchbar > * { transition: opacity 0.2s, width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s; }
.image-gallery-searchbar .action-menu-icon { color: rgba(255, 255, 255, 0.7); flex-shrink: 0; cursor: move; box-sizing: border-box; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; transition: all 0.2s; }
.image-gallery-searchbar .action-menu-icon:hover { background: rgba(255,255,255,0.08); color: white; }
.image-gallery-searchbar.collapsed .action-menu-icon { color: white; width: 100%; height: 100%; }
.image-gallery-searchbar input { 
    all: unset; 
    width: 140px; 
    color: white; 
    cursor: text; 
    user-select: text; 
    padding: 0 8px; 
    font-size: 13px; 
    font-weight: 500;
    background: transparent !important;
}
.image-gallery-searchbar input:focus {
    background: transparent !important;
    outline: none !important;
}
.image-gallery-searchbar input::placeholder { color: rgba(255,255,255,0.4); }
.image-gallery-searchbar.collapsed > *:not(.action-menu-icon) { width: 0; opacity: 0; pointer-events: none; white-space: nowrap; transform: scaleX(0); margin-left: -8px; }
.image-gallery-searchbar .clear-btn { all: unset; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.1); color: white; cursor: pointer; transition: all 0.2s; }
.image-gallery-searchbar .clear-btn:hover { background: rgba(255,255,255,0.2); }
.image-gallery-searchbar .select-btn { all: unset; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.2s; }
.image-gallery-searchbar .select-btn:hover { background: rgba(255,255,255,0.12); color: white; transform: translateY(-1px); }
.image-gallery-searchbar .select-btn.active { color: #4ade80; background: rgba(74, 222, 128, 0.15); box-shadow: 0 0 15px rgba(74, 222, 128, 0.4); }
.search-bar-divider { width: 1px; height: 20px; background: rgba(255, 255, 255, 0.08); margin: 0 4px; }
.dropdown-container, .dropdown-menu, .select-btn { pointer-events: auto; }
.dropdown-container { position: relative; }
.dropdown-btn { all: unset; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 18px; background: rgba(255,255,255,0.04); color: rgba(255, 255, 255, 0.8); cursor: pointer; transition: all .2s; font-size: 12px; font-weight: 600; font-variant: small-caps; }
.dropdown-btn:hover { background: rgba(255,255,255,0.1); color: white; }
.dropdown-menu { position: absolute; top: calc(100% + 10px); left: 0; background: rgba(22, 15, 32, 0.98); border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(24px) saturate(1.8); border-radius: 14px; padding: 6px; z-index: 20; min-width: 190px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); animation: nf-dropdownIn 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
.dropdown-item { padding: 10px 14px; border-radius: 10px; cursor: pointer; color: rgba(255, 255, 255, 0.7); font-size: 12px; font-weight: 500; font-variant: small-caps; transition: all 0.2s; }
.dropdown-item.with-icon { display: flex; align-items: center; gap: 10px; }
.dropdown-item:hover { background: rgba(255,255,255,0.08); color: white; }
.dropdown-item.active { background: rgba(255, 255, 255, 0.12); color: white; font-weight: 700; }
.search-no-results { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 12px 20px; background: rgba(24, 15, 28, 0.85); border-radius: 8px; color: #ccc; z-index: 5; }
.mass-edit-panel { 
    position: absolute; 
    bottom: 30px;
    right: 30px;
    width: 320px; 
    background: linear-gradient(135deg, rgba(28, 22, 42, 0.95) 0%, rgba(18, 12, 28, 0.98) 100%);
    border: 1px solid rgba(255, 255, 255, 0.12); 
    border-radius: 16px; 
    backdrop-filter: blur(24px) saturate(1.8); 
    z-index: 200; 
    pointer-events: auto; 
    animation: nf-dropdownIn 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    color: white; 
    box-shadow: 0 30px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05);
    overflow: hidden;
    cursor: move;
}
.mass-edit-header { 
    display: flex; 
    align-items: center; 
    gap: 10px;
    padding: 12px 16px; 
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.08); 
}
.mass-edit-header h3 { 
    margin: 0; 
    font-size: 13px; 
    font-weight: 700;
    font-variant: small-caps;
    letter-spacing: 0.5px;
    flex-grow: 1;
    color: rgba(255,255,255,0.9);
}
.mass-edit-header .close-btn { 
    all: unset; 
    cursor: pointer; 
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: rgba(255,255,255,0.5); 
    transition: all 0.2s;
}
.mass-edit-header .close-btn:hover {
    background: rgba(255,255,255,0.08);
    color: white;
}
.mass-edit-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.mass-edit-section { display: flex; flex-direction: column; gap: 8px; }
.mass-edit-section label { font-size: 11px; font-weight: 600; font-variant: small-caps; color: rgba(255,255,255,0.4); letter-spacing: 0.3px; }
.mass-edit-presets { display: flex; gap: 6px; }
.preset-btn { 
    all: unset;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    transition: all 0.2s;
}
.preset-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.2);
    color: white;
}
.mass-edit-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 2px 0; }
.input-row { display: flex; gap: 8px; }
.input-row input { 
    width: 50%; 
    box-sizing: border-box; 
    background: rgba(0,0,0,0.25); 
    border: 1px solid rgba(255,255,255,0.1); 
    color: white; 
    padding: 8px 10px; 
    border-radius: 8px; 
    font-size: 12px;
    transition: all 0.2s;
}
.input-row input:focus {
    border-color: rgba(135, 88, 255, 0.5);
    background: rgba(0,0,0,0.4);
    outline: none;
}
.mass-edit-footer { 
    display: flex; 
    gap: 8px; 
    padding: 12px 16px; 
    background: rgba(0,0,0,0.15);
    border-top: 1px solid rgba(255,255,255,0.08);
}
.mass-btn {
    all: unset;
    cursor: pointer;
    flex: 1;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    font-variant: small-caps;
    transition: all 0.2s;
}
.mass-btn.ghost {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
}
.mass-btn.ghost:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}
.mass-btn.primary {
    background: linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}
.mass-btn.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(109, 40, 217, 0.4);
}
.mass-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }

/* --- LIGHT MODE UI OVERRIDES --- */
[class*="theme-light"].mini-canvas-wrapper,
[class*="theme-light"] .mini-canvas-wrapper,
.theme-light.mini-canvas-wrapper,
.theme-light .mini-canvas-wrapper,
[class*="theme-light"].full-tab-wrapper,
[class*="theme-light"] .full-tab-wrapper,
.theme-light.full-tab-wrapper,
.theme-light .full-tab-wrapper {
    background: #f0f0f4 !important;
    border-color: rgba(0, 0, 0, 0.08);
}

[class*="theme-light"] .interactive-canvas,
.theme-light .interactive-canvas { 
    background-color: #0f0a12 !important; 
    filter: invert(1) hue-rotate(180deg) brightness(1.05);
}

[class*="theme-light"] .image-gallery-searchbar { 
    background: #ffffff !important; 
    border: 1px solid rgba(0, 0, 0, 0.06) !important; 
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important; 
    pointer-events: auto !important;
}
[class*="theme-light"] .image-gallery-searchbar input { 
    color: #1a1a1a !important; 
    font-weight: 500; 
    background: transparent !important;
}
[class*="theme-light"] .image-gallery-searchbar input:focus {
    background: transparent !important;
}
[class*="theme-light"] .image-gallery-searchbar .action-menu-icon { color: rgba(0, 0, 0, 0.4) !important; }
[class*="theme-light"] .dropdown-btn { 
    background: #fcfcfd !important; 
    color: #1a1a1a !important; 
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
}
[class*="theme-light"] .fullscreen-toggle-btn { 
    background: #ffffff !important; 
    border: 1px solid rgba(0, 0, 0, 0.08) !important; 
    color: rgba(0, 0, 0, 0.5) !important; 
}

[class*="theme-light"] .image-gallery-searchbar .select-btn { 
    background: rgba(0, 0, 0, 0.03) !important; 
    color: rgba(0, 0, 0, 0.5) !important; 
}
[class*="theme-light"] .image-gallery-searchbar .select-btn:hover { 
    background: rgba(0, 0, 0, 0.08) !important; 
    color: #000 !important; 
}
[class*="theme-light"] .image-gallery-searchbar .select-btn.active { 
    color: #059669 !important; 
    background: rgba(16, 185, 129, 0.1) !important; 
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.2) !important;
}

[class*="theme-light"] .dropdown-menu {
    background: #ffffff !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12) !important;
}
[class*="theme-light"] .dropdown-item {
    color: #444 !important;
}
[class*="theme-light"] .dropdown-item:hover {
    background: rgba(0, 0, 0, 0.04) !important;
    color: #000 !important;
}

[class*="theme-light"] .panel { 
    background: #ffffff !important; 
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
}
[class*="theme-light"] .panel-controls {
    background: #fcfcfd !important;
    border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
}
[class*="theme-light"] .panel-title { color: #1a1a1a !important; }
[class*="theme-light"] .panel-row { color: #666 !important; }
[class*="theme-light"] .panel-icon-btn {
    background: rgba(0, 0, 0, 0.04) !important;
    color: rgba(0, 0, 0, 0.6) !important;
}
[class*="theme-light"] .panel-icon-btn:hover {
    background: rgba(0, 0, 0, 0.08) !important;
    color: #000 !important;
}

/* --- TAGS & MASS EDIT PANELS --- */
[class*="theme-light"] .tags-panel {
    background: #ffffff !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
    color: #1a1a1a !important;
}
[class*="theme-light"] .tag-btn {
    background: rgba(0, 0, 0, 0.05) !important;
    color: #444 !important;
}
[class*="theme-light"] .tag-btn:hover {
    background: rgba(0, 0, 0, 0.1) !important;
    color: #000 !important;
}

[class*="theme-light"] .mass-edit-panel {
    background: #ffffff !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
}
[class*="theme-light"] .mass-edit-panel h3,
[class*="theme-light"] .mass-edit-section label {
    color: #1a1a1a !important;
}
[class*="theme-light"] .input-row input {
    background: #f3f3f5 !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    color: #1a1a1a !important;
}
[class*="theme-light"] .input-row input:focus {
    border-color: #8b5cf6 !important;
    background: #ffffff !important;
}
[class*="theme-light"] .mass-btn.ghost {
    background: rgba(0, 0, 0, 0.05) !important;
    color: #444 !important;
}
[class*="theme-light"] .mass-btn.ghost:hover {
    background: rgba(0, 0, 0, 0.1) !important;
    color: #000 !important;
}
`;


const ConsentScreen = ({ onAccept }) => {
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter') {
                onAccept();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [onAccept]);

    const style = `
    /* -- Animation Keyframes -- */
    @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes glow-pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
        50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.2); }
    }

    /* -- Main Styles -- */
    .consent-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000000;
        color: #ffffff;
        font-family: monospace;
        overflow: hidden;
    }
    
    .consent-wrap:before {
        content: "";
        position: absolute;
        inset: 0;
        background: 
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.015), transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.015), transparent 50%);
        pointer-events: none;
    }
    
    .consent-card {
        position: relative;
        width: min(700px, 90vw);
        background: #0a0a0a;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 0;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.9);
        animation: fade-in-up 0.8s ease-out;
        overflow: hidden;
    }
    
    .consent-card:before {
        content: "";
        position: absolute;
        top: 0;
        left: -200%;
        width: 200%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent);
        animation: shimmer 3s ease-in-out infinite;
    }
    
    .consent-header {
        padding: 40px 36px 32px 36px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.01) 0%, transparent 100%);
    }
    
    .consent-title-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 18px;
    }
    
    .consent-icon-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        color: rgba(139, 92, 246, 0.6);
        animation: float 4s ease-in-out infinite;
    }
    
    .consent-title {
        font-size: 26px;
        font-weight: 300;
        color: rgba(255, 255, 255, 0.95);
        letter-spacing: 1px;
        margin: 0;
    }
    
    .consent-subtitle {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.3);
        line-height: 1.8;
        margin: 0;
        font-weight: 300;
    }
    
    .consent-body {
        padding: 32px 36px;
    }
    
    .consent-section {
        margin-bottom: 32px;
    }
    
    .consent-section:last-child {
        margin-bottom: 0;
    }
    
    .consent-section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 11px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 16px;
    }
    
    .consent-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
    }
    
    .consent-info-item {
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 8px;
        padding: 18px 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        transition: all 0.3s ease;
    }
    
    .consent-info-item:hover {
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(139, 92, 246, 0.15);
    }
    
    .consent-info-icon {
        color: rgba(255, 255, 255, 0.2);
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    .consent-info-content {
        flex: 1;
        min-width: 0;
    }
    
    .consent-info-label {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }
    
    .consent-info-value {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 400;
    }
    
    .consent-feature-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .consent-feature-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 12px;
        background: rgba(255, 255, 255, 0.008);
        border: 1px solid rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        transition: all 0.3s ease;
    }
    
    .consent-feature-item:hover {
        background: rgba(255, 255, 255, 0.015);
        border-color: rgba(255, 255, 255, 0.06);
    }
    
    .consent-feature-icon {
        color: rgba(255, 255, 255, 0.2);
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    .consent-feature-text {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.6;
        font-weight: 300;
    }
    
    .consent-github-box {
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        animation: glow-pulse 4s ease-in-out infinite;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .consent-github-box:hover {
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(139, 92, 246, 0.2);
        box-shadow: 0 0 30px rgba(139, 92, 246, 0.08);
    }
    
    .consent-github-icon {
        color: rgba(139, 92, 246, 0.5);
        flex-shrink: 0;
        transition: all 0.3s ease;
    }
    
    .consent-github-box:hover .consent-github-icon {
        color: rgba(139, 92, 246, 0.7);
        transform: scale(1.05);
    }
    
    .consent-github-content {
        flex: 1;
        min-width: 0;
    }
    
    .consent-github-label {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 8px;
    }
    
    .consent-github-repo {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 6px;
        font-weight: 400;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: color 0.3s ease;
    }
    
    .consent-github-box:hover .consent-github-repo {
        color: rgba(255, 255, 255, 1);
    }
    
    .consent-github-link-icon {
        opacity: 0;
        transform: translateX(-5px);
        transition: all 0.3s ease;
    }
    
    .consent-github-box:hover .consent-github-link-icon {
        opacity: 0.6;
        transform: translateX(0);
    }
    
    .consent-github-desc {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.35);
        line-height: 1.5;
        font-weight: 300;
    }
    
    .consent-footer {
        padding: 24px 36px;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.005);
    }
    
    .consent-hint {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.25);
    }
    
    .consent-kbd {
        padding: 5px 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 4px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        font-weight: 500;
    }
    
    .consent-btn {
        all: unset;
        box-sizing: border-box;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 32px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
        font-size: 13px;
        letter-spacing: 0.5px;
        transition: all 0.3s ease;
    }
    
    .consent-btn:hover {
        background: rgba(139, 92, 246, 0.08);
        border-color: rgba(139, 92, 246, 0.2);
        box-shadow: 0 0 30px rgba(139, 92, 246, 0.1);
        transform: translateY(-2px);
        color: rgba(255, 255, 255, 1);
    }
    
    .consent-btn:active {
        transform: translateY(0);
    }
    `;

    return (
        <div className="consent-wrap">
            <style>{style}</style>
            <div className="consent-card">
                <div className="consent-header">
                    <div className="consent-title-row">
                        <div className="consent-icon-badge">
                            <dc.Icon icon="layers" style={{ width: '26px', height: '26px' }} />
                        </div>
                        <h2 className="consent-title">Asset Synchronization</h2>
                    </div>
                    <p className="consent-subtitle">
                        Establish connection to the distributed asset repository. This process retrieves vectorized drawings from remote storage and prepares them for local visualization.
                    </p>
                </div>

                <div className="consent-body">
                    <div className="consent-section">
                        <div className="consent-section-title">
                            <dc.Icon icon="activity" style={{ width: '12px', height: '12px' }} />
                            <span>Resource Parameters</span>
                        </div>
                        <div className="consent-info-grid">
                            <div className="consent-info-item">
                                <dc.Icon icon="clock" className="consent-info-icon" style={{ width: '18px', height: '18px' }} />
                                <div className="consent-info-content">
                                    <div className="consent-info-label">Estimated Time</div>
                                    <div className="consent-info-value">&lt; 5 Minutes</div>
                                </div>
                            </div>
                            <div className="consent-info-item">
                                <dc.Icon icon="database" className="consent-info-icon" style={{ width: '18px', height: '18px' }} />
                                <div className="consent-info-content">
                                    <div className="consent-info-label">Local Storage</div>
                                    <div className="consent-info-value">&lt; 1 GB</div>
                                </div>
                            </div>
                            <div className="consent-info-item">
                                <dc.Icon icon="shield" className="consent-info-icon" style={{ width: '18px', height: '18px' }} />
                                <div className="consent-info-content">
                                    <div className="consent-info-label">Processing</div>
                                    <div className="consent-info-value">Client-Side</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="consent-section">
                        <div className="consent-section-title">
                            <dc.Icon icon="git-branch" style={{ width: '12px', height: '12px' }} />
                            <span>Synchronization Protocol</span>
                        </div>
                        <div className="consent-feature-list">
                            <div className="consent-feature-item">
                                <dc.Icon icon="server" className="consent-feature-icon" style={{ width: '16px', height: '16px' }} />
                                <span className="consent-feature-text">
                                    Establish secure connection to remote asset repository
                                </span>
                            </div>
                            <div className="consent-feature-item">
                                <dc.Icon icon="file-code" className="consent-feature-icon" style={{ width: '16px', height: '16px' }} />
                                <span className="consent-feature-text">
                                    Parse compressed vector data from markdown containers
                                </span>
                            </div>
                            <div className="consent-feature-item">
                                <dc.Icon icon="grid" className="consent-feature-icon" style={{ width: '16px', height: '16px' }} />
                                <span className="consent-feature-text">
                                    Transform raw elements into scalable vector graphics
                                </span>
                            </div>
                            <div className="consent-feature-item">
                                <dc.Icon icon="eye" className="consent-feature-icon" style={{ width: '16px', height: '16px' }} />
                                <span className="consent-feature-text">
                                    Generate optimized preview thumbnails with embedded typography
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="consent-section">
                        <div className="consent-section-title">
                            <dc.Icon icon="package" style={{ width: '12px', height: '12px' }} />
                            <span>Remote Source</span>
                        </div>
                        <div 
                            className="consent-github-box"
                            onClick={() => window.open('https://github.com/beto-group/beto.assets', '_blank')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    window.open('https://github.com/beto-group/beto.assets', '_blank');
                                }
                            }}
                        >
                            <dc.Icon icon="github" className="consent-github-icon" style={{ width: '36px', height: '36px' }} />
                            <div className="consent-github-content">
                                <div className="consent-github-label">Repository</div>
                                <div className="consent-github-repo">
                                    beto-group/beto.assets
                                    <dc.Icon icon="external-link" className="consent-github-link-icon" style={{ width: '14px', height: '14px' }} />
                                </div>
                                <div className="consent-github-desc">
                                    Centralized asset repository serving a wide range of visual resources across the BETO.888 platform ecosystem
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="consent-footer">
                    <div className="consent-hint">
                        <dc.Icon icon="corner-down-left" style={{ width: '13px', height: '13px' }} />
                        <span>Press <kbd className="consent-kbd">Enter</kbd> to initialize</span>
                    </div>
                    <button className="consent-btn" onClick={onAccept}>
                        <dc.Icon icon="zap" style={{ width: '15px', height: '15px' }} />
                        Begin Synchronization
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 5. Main Component (Corrected and Integrated) ---

// DOM Traversal Utilities for Full-Tab Mode
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}

function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) {
            return child;
        }
    }
    return null;
}

// Full-Tab Effect Hook
function useFullscreenEffect(containerRef, isFullscreen, localTheme) {
    const stateRefs = useRef({}).current;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Apply theme to container itself so it stays themed when moved in DOM
        if (localTheme) {
            container.classList.add(localTheme);
            // Remove the opposite theme just in case
            container.classList.remove(localTheme === 'theme-light' ? 'theme-dark' : 'theme-light');
        }

        if (!isFullscreen) return;

        const targetPaneContent = findNearestAncestorWithClass(
            container,
            "workspace-leaf-content"
        );
        
        if (!targetPaneContent) {
            return;
        }

        const contentWrapper =
            findDirectChildByClass(targetPaneContent, "view-content") ||
            targetPaneContent;

        stateRefs.originalParent = container.parentNode;
        stateRefs.placeholder = document.createElement("div");
        stateRefs.placeholder.style.display = "none";
        container.parentNode.insertBefore(stateRefs.placeholder, container);

        stateRefs.parentPositionInfo = {
            element: contentWrapper,
            original: window.getComputedStyle(contentWrapper).position,
        };

        if (stateRefs.parentPositionInfo.original === "static") {
            contentWrapper.style.position = "relative";
        }

        contentWrapper.appendChild(container);

        Object.assign(container.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "9998",
            overflow: "auto",
        });

        return () => {
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(
                    container,
                    stateRefs.placeholder
                );
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.original === "static"
                        ? ""
                        : stateRefs.parentPositionInfo.original;
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
        };
    }, [isFullscreen, localTheme]);
}

const AssetsLibrary = (props) => {
    const { OverlayLogo, LoadingScreen, localTheme, folderPath } = props;
    // Path to store the consent confirmation
    const CONSENT_FILE_PATH = ".datacore/image-gallery/consent.json";
    
    // Get current file path to determine relative font directory
    const currentFilePath = folderPath ? folderPath + '/src/index.jsx' : dc.useCurrentPath();

    // State now starts at null to indicate we're checking for consent
    const [hasConsented, setHasConsented] = useState(null);
    const [panel, setPanel] = useState(null);
    const [removedImages, setRemovedImages] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('path_asc');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPaths, setSelectedPaths] = useState(new Set());
    const [viewType, setViewType] = useState('grid');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fileListVersion, setFileListVersion] = useState(0);
    const [resetViewKey, setResetViewKey] = useState(0);
    const [showSyncNotification, setShowSyncNotification] = useState(true);
    const [showConversionNotification, setShowConversionNotification] = useState(true);

    const [imageFiles, setImageFiles] = useState(null);
    const [potentialMdFileCount, setPotentialMdFileCount] = useState(0);

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionInitialPositions, setTransitionInitialPositions] = useState(null);
    const graphNodesRef = useRef(null);

    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const interactingUntilRef = useRef(0);
    const onCacheUpdateRef = useRef(() => { });
    const isBulkEditingRef = useRef(false);
    const [bulkEditProgress, setBulkEditProgress] = useState(null);

    // Apply full-tab effect when in fullscreen mode
    useFullscreenEffect(containerRef, isFullscreen, localTheme);

    const { status: converterStatus, error: converterError, logs: converterLogs, runConversionCheck, converterDeps, conversionProgress, isConverting } = useExcalidrawConverter(currentFilePath);
    
    // Initialize GitHub sync hook with converter dependencies and consent status
    const { syncStatus, syncProgress, syncLogs, syncError, syncFromGitHub } = useGitHubSync(converterStatus, converterDeps, hasConsented, CONSENT_FILE_PATH, currentFilePath);

    // Show notification when sync starts (must come after syncStatus is defined)
    useEffect(() => {
        if (syncStatus === 'syncing') {
            setShowSyncNotification(true);
        }
    }, [syncStatus]);

    // Show notification when conversion starts
    useEffect(() => {
        if (isConverting) {
            setShowConversionNotification(true);
        }
    }, [isConverting]);

    // Check for persisted consent status when the component mounts
    useEffect(() => {
        const checkConsent = async () => {
            try {
                if (await dc.app.vault.adapter.exists(CONSENT_FILE_PATH)) {
                    const content = await dc.app.vault.adapter.read(CONSENT_FILE_PATH);
                    const data = JSON.parse(content || "{}");
                    setHasConsented(data.consented === true);
                } else {
                    setHasConsented(false);
                }
            } catch (err) {
                console.error("Error checking consent status:", err);
                setHasConsented(false); // Default to false if there's an error
            }
        };
        checkConsent();
    }, []);

    // This function now saves the consent to a file and updates the state
    const handleConsent = async () => {
        try {
            const dir = CONSENT_FILE_PATH.substring(0, CONSENT_FILE_PATH.lastIndexOf("/"));
            if (!(await dc.app.vault.adapter.exists(dir))) {
                await dc.app.vault.adapter.mkdir(dir);
            }
            await dc.app.vault.adapter.write(CONSENT_FILE_PATH, JSON.stringify({ consented: true }, null, 2));
            setHasConsented(true);
            
            // Immediately trigger sync and conversion in parallel with file loading
            // This happens automatically via the useEffect hooks, no need to wait
        } catch (err) {
            console.error("Error saving consent:", err);
            // Allow the user to proceed for the current session even if saving fails
            setHasConsented(true);
        }
    };


    // Trigger initial conversion check in parallel with file loading and GitHub sync
    useEffect(() => {
        if (!hasConsented) return;
        if (converterStatus === 'ready') {
            // Non-blocking - runs in background while canvas loads
            runConversionCheck((newFilesCreated) => {
                if (newFilesCreated) {
                    setFileListVersion(v => v + 1);
                }
            });
        }
    }, [converterStatus, runConversionCheck, hasConsented]);

    // Watch for file changes with debouncing to prevent duplicate triggers
    useEffect(() => {
        if (!hasConsented || converterStatus !== 'ready') return;
        
        let debounceTimer = null;
        const pendingFiles = new Set();
        
        const handleFileChange = (file) => {
            if (isBulkEditingRef.current) return;
            if (file.path.startsWith(FOLDER_PATH) && file.extension === 'md') {
                // Add to pending set to deduplicate
                pendingFiles.add(file.path);
                
                // Clear existing timer
                if (debounceTimer) clearTimeout(debounceTimer);
                
                // Set new timer - only trigger once after 500ms of no changes
                debounceTimer = setTimeout(() => {
                    if (pendingFiles.size > 0) {
                        
                        pendingFiles.clear();
                        runConversionCheck((newFilesCreated) => {
                            if (newFilesCreated) {
                                setFileListVersion(v => v + 1);
                            }
                        });
                    }
                }, 500);
            }
        };
        
        const eventRef = dc.app.metadataCache.on('changed', handleFileChange);
        return () => {
            dc.app.metadataCache.offref(eventRef);
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [converterStatus, runConversionCheck, hasConsented]);

    const sortOptions = [{ value: "path_asc", label: "Path (A-Z)" }, { value: "path_desc", label: "Path (Z-A)" }, { value: "name_asc", label: "Name (A-Z)" }, { value: "name_desc", label: "Name (Z-A)" }, { value: "mtime_desc", label: "Date Modified (Newest)" }, { value: "mtime_asc", label: "Date Modified (Oldest)" }, { value: "ctime_desc", label: "Date Created (Newest)" }, { value: "ctime_asc", label: "Date Created (Oldest)" }, { value: "size_desc", label: "Size (Largest)" }, { value: "size_asc", label: "Size (Smallest)" }];

    // Load files immediately and continuously update as sync/conversion completes
    useEffect(() => {
        if (!hasConsented) return;
        
        const loadFiles = async () => {
            try {
                const allFiles = dc.app.vault.getFiles();
                const filesInPath = allFiles.filter(file => file.path.startsWith(FOLDER_PATH));

                const svgFiles = filesInPath.filter(file => file.extension === 'svg');
                const mdFiles = new Set(filesInPath.filter(f => f.extension === 'md').map(f => f.path.replace(/\.md$/i, '')));
                const svgBasePaths = new Set(svgFiles.map(f => f.path.replace(/\.svg$/i, '')));

                let potentialCount = 0;
                for (const mdBasePath of mdFiles) {
                    if (!svgBasePaths.has(mdBasePath)) {
                        potentialCount++;
                    }
                }
                setPotentialMdFileCount(potentialCount);
                
                // Only set files that actually exist on disk to avoid ENOENT errors
                const existingSvgFiles = [];
                for (const file of svgFiles) {
                    // Verify file actually exists before adding to list
                    try {
                        const exists = await dc.app.vault.adapter.exists(file.path);
                        if (exists) {
                            existingSvgFiles.push(file);
                        }
                    } catch (err) {
                        // Skip files that can't be verified
                        console.debug(`[Assets Library] Skipping unverified file: ${file.path}`);
                    }
                }
                setImageFiles(existingSvgFiles);

            } catch (e) {
                console.error("[Image Gallery] CRITICAL ERROR during file search:", e);
                setImageFiles([]);
                setPotentialMdFileCount(0);
            }
        };
        
        // Load files immediately - doesn't wait for sync/conversion
        loadFiles();
    }, [fileListVersion, hasConsented]);

    const visibleImageFiles = useMemo(() => {
        if (!imageFiles) return [];
        if (!removedImages || removedImages.size === 0) return imageFiles;
        return imageFiles.filter(f => !removedImages.has(f.path));
    }, [imageFiles, removedImages]);

    const sortedAndVisibleImageFiles = useMemo(() => {
        const [key, direction] = sortOption.split('_');
        const sorted = [...visibleImageFiles];
        sorted.sort((a, b) => { let valA, valB; switch (key) { case 'mtime': valA = a.stat.mtime; valB = b.stat.mtime; break; case 'ctime': valA = a.stat.ctime; valB = b.stat.ctime; break; case 'size': valA = a.stat.size; valB = b.stat.size; break; case 'name': valA = a.basename.toLowerCase(); valB = b.basename.toLowerCase(); break; default: valA = a.path.toLowerCase(); valB = b.path.toLowerCase(); break; } if (typeof valA === 'string') { return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA); } else { return direction === 'asc' ? valA - valB : valB - valA; } });
        return sorted;
    }, [visibleImageFiles, sortOption]);

    const [imageTagsMap, setImageTagsMap] = useState(new Map());
    useEffect(() => {
        if (!hasConsented) return;
        const timer = setTimeout(() => {
            const map = new Map();
            const pathToMdPath = (svgPath) => svgPath.replace(/\.svg$/i, '.md');
            const tagKeys = ['A888a', 'data-aaa-tags', 'tags'];
            for (const file of visibleImageFiles) {
                const mdPath = pathToMdPath(file.path);
                const mdFile = dc.app.vault.getAbstractFileByPath(mdPath);
                if (mdFile) {
                    const cache = dc.app.metadataCache.getFileCache(mdFile);
                    const fm = cache?.frontmatter;
                    if (fm) {
                        const fileTags = new Set();
                        tagKeys.forEach(key => {
                            const val = fm[key];
                            if (val) {
                                const tagsToAdd = Array.isArray(val) ? val : String(val).split(/, ?/);
                                tagsToAdd.forEach(tag => { if (typeof tag === 'string' && tag.trim()) fileTags.add(tag.trim()); });
                            }
                        });
                        if (fileTags.size > 0) map.set(file.path, Array.from(fileTags));
                    }
                }
            }
            setImageTagsMap(map);
        }, 100);
        return () => clearTimeout(timer);
    }, [visibleImageFiles, hasConsented]);

    const matchingImagePaths = useMemo(() => {
        if (!searchTerm) return new Set();
        const lowerCaseTerm = searchTerm.toLowerCase();
        const filtered = sortedAndVisibleImageFiles.filter(file => {
            if (file.path.toLowerCase().includes(lowerCaseTerm)) return true;
            const tags = imageTagsMap.get(file.path);
            if (tags) { return tags.some(tag => tag.toLowerCase().includes(lowerCaseTerm)); }
            return false;
        });
        return new Set(filtered.map(f => f.path));
    }, [sortedAndVisibleImageFiles, searchTerm, imageTagsMap]);

    const isSearching = searchTerm.length > 0;

    const { imageCache, requestImages, workerError, requestedSet } = useImageWorker(sortedAndVisibleImageFiles, () => onCacheUpdateRef.current());
    const bgQueueRef = useRef([]);
    const bgRunningRef = useRef(false);
    const cancelledRef = useRef(false);

    const startBackgroundPreload = useCallback(() => {
        if (bgRunningRef.current) return;
        bgRunningRef.current = true;
        cancelledRef.current = false;
        const schedule = (fn) => ('requestIdleCallback' in window) ? window.requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 200);
        const refill = () => {
            const queuedOrRequested = new Set([...bgQueueRef.current.map(f => f.path), ...requestedSet]);
            for (const f of sortedAndVisibleImageFiles) { if (!queuedOrRequested.has(f.path) && !imageCache.has(f.path)) { bgQueueRef.current.push(f); } }
        };
        const pump = async () => {
            if (cancelledRef.current) { bgRunningRef.current = false; return; }
            if (performance.now() < interactingUntilRef.current) { schedule(pump); return; }
            refill();
            const batch = [];
            while (bgQueueRef.current.length > 0 && batch.length < 24) {
                const f = bgQueueRef.current.shift();
                if (!f || imageCache.has(f.path) || requestedSet.has(f.path)) continue;
                batch.push(f);
            }
            if (batch.length > 0) requestImages(batch, false);
            if (bgQueueRef.current.length === 0 && Array.from(requestedSet).every(p => imageCache.has(p))) { bgRunningRef.current = false; return; }
            schedule(pump);
        };
        schedule(pump);
    }, [sortedAndVisibleImageFiles, requestImages, imageCache, requestedSet]);

    useEffect(() => {
        if (!hasConsented) return;
        startBackgroundPreload();
        const visListener = () => { if (document.visibilityState === 'visible') startBackgroundPreload(); };
        document.addEventListener('visibilitychange', visListener);
        return () => { cancelledRef.current = true; document.removeEventListener('visibilitychange', visListener); };
    }, [startBackgroundPreload, hasConsented]);

    const allUniqueTags = useMemo(() => {
        const tagSet = new Set();
        for (const tags of imageTagsMap.values()) {
            for (const tag of tags) { tagSet.add(tag); }
        }
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    }, [imageTagsMap]);

    const pathToMdPath = (svgPath) => svgPath.replace(/\.svg$/i, '.md');
    const onCardClick = useCallback(async (panelData) => {
        if (!imageFiles) return;
        const mdPath = pathToMdPath(panelData.path);
        const mdFile = dc.app.vault.getAbstractFileByPath(mdPath);
        let tags = [];
        if (mdFile) {
            const cache = dc.app.metadataCache.getFileCache(mdFile);
            const fm = cache?.frontmatter;
            if (fm) {
                const tagSet = new Set();
                ['tags', 'A888a', 'data-aaa-tags'].forEach(key => {
                    const val = fm[key];
                    if (val) { (Array.isArray(val) ? val : String(val).split(/, ?/)).forEach(tag => { if (typeof tag === 'string' && tag.trim()) tagSet.add(tag.trim()); }); }
                });
                tags = Array.from(tagSet);
            }
        }
        setPanel({ ...panelData, tags });
    }, [imageFiles]);

    const handleViewChange = useCallback((newView) => {
        if (viewType === 'graph' && newView === 'grid' && graphNodesRef.current) {
            const positions = new Map(
                graphNodesRef.current.map(node => [node.file.path, { x: node.x, y: node.y }])
            );
            setTransitionInitialPositions(positions);
            setIsTransitioning(true);
        } else {
            setTransitionInitialPositions(null);
        }
        setViewType(newView);
    }, [viewType]);

    const handleTransitionEnd = useCallback(() => {
        setIsTransitioning(false);
        setTransitionInitialPositions(null);
    }, []);

    const handleTagSearch = useCallback((tag) => {
        if (searchTerm === tag) { setSearchTerm(''); }
        else { setSearchTerm(tag); }
    }, [searchTerm]);

    const handleToggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    const handleToggleSelection = useCallback((path) => { const newSelection = new Set(selectedPaths); if (newSelection.has(path)) { newSelection.delete(path); } else { newSelection.add(path); } setSelectedPaths(newSelection); }, [selectedPaths]);
    const handleToggleSelectionMode = () => { if (isSelectionMode) { setSelectedPaths(new Set()); } setIsSelectionMode(!isSelectionMode); };
    useEffect(() => { const handleKeydown = (e) => { if (e.key === "Escape") { if (panel) { setPanel(null); } else if (isFullscreen) { setIsFullscreen(false); } else if (selectedPaths.size > 0) { setSelectedPaths(new Set()); } else if (isSelectionMode) { setIsSelectionMode(false); } else if (searchTerm) { setSearchTerm(''); } } }; window.addEventListener("keydown", handleKeydown); return () => window.removeEventListener("keydown", handleKeydown); }, [panel, searchTerm, isSelectionMode, selectedPaths, isFullscreen]);
    useEffect(() => { const handleSearchShortcut = (e) => { if (e.key === 'f' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); searchInputRef.current?.focus(); } }; window.addEventListener('keydown', handleSearchShortcut); return () => window.removeEventListener('keydown', handleSearchShortcut); }, []);

    useEffect(() => {
        if (!hasConsented) return;
        Core.loadRemovedImagePaths().then(setRemovedImages);
    }, [hasConsented]);

    const ensureMarkdownTwin = async (svgPath) => {
        const mdPath = pathToMdPath(svgPath);
        let mdFile = dc.app.vault.getAbstractFileByPath(mdPath);
        if (!mdFile || mdFile.extension !== 'md') {
            try { await dc.app.vault.create(mdPath, `---\n---\n`); mdFile = dc.app.vault.getAbstractFileByPath(mdPath); }
            catch (e) { console.error(`Failed to create ${mdPath}:`, e); return null; }
        }
        return mdFile;
    };
    const modifyFrontmatter = async (paths, modificationFn) => {
        if (!paths || paths.size === 0) return;
        isBulkEditingRef.current = true;
        const pathArray = Array.from(paths);
        const total = pathArray.length;
        
        try {
            // Process in small batches to avoid OS file handle limits and keep UI responsive
            const batchSize = 10;
            for (let i = 0; i < pathArray.length; i += batchSize) {
                const batch = pathArray.slice(i, i + batchSize);
                await Promise.all(batch.map(async (svgPath) => {
                    const mdFile = await ensureMarkdownTwin(svgPath);
                    if (mdFile) {
                        return dc.app.fileManager.processFrontMatter(mdFile, modificationFn);
                    }
                }));
                // Yield to main thread
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        } catch (err) { 
            console.error("Error during mass frontmatter edit:", err); 
        } finally {
            isBulkEditingRef.current = false;
            setSelectedPaths(new Set()); 
            setIsSelectionMode(false); 
            // Single refresh after all changes are done
            setFileListVersion(v => v + 1);
        }
    };
    const handleApplyListPreset = async (listKey, presetValue) => { await modifyFrontmatter(selectedPaths, (fm) => { fm[listKey] = fm[listKey] || []; if (!Array.isArray(fm[listKey])) { fm[listKey] = [fm[listKey]]; } const set = new Set(fm[listKey]); set.add(presetValue); fm[listKey] = Array.from(set); }); };
    const handleApplyPreset = async (presetValue) => { await handleApplyListPreset('data-aaa-tags', presetValue); };
    const handleApplyA888a = async (presetValue) => { await handleApplyListPreset('A888a', presetValue); };
    const handleApplyCustom = async (key, value) => { if (!key.trim()) return; await modifyFrontmatter(selectedPaths, (fm) => { fm[key.trim()] = value.trim(); }); };
    
    const handleToggleHide = () => { 
        if (!panel?.path) return; 
        const e = new Set(removedImages); 
        e.has(panel.path) ? e.delete(panel.path) : e.add(panel.path); 
        setRemovedImages(e); 
        Core.saveRemovedImagePaths(e); 
    };
    const restoreAllHidden = async () => { 
        const e = new Set(); 
        setRemovedImages(e); 
        await Core.saveRemovedImagePaths(e); 
    };
    const handleRetryConversion = async () => {
        if (!panel?.path || !converterDeps) return;
        
        // Get the .md file path from the .svg path
        const mdPath = panel.path.replace(/\.svg$/i, '.md');
        
        try {
            // Check if .md file exists
            const mdFile = dc.app.vault.getAbstractFileByPath(mdPath);
            if (!mdFile) {
                console.error('Source .md file not found:', mdPath);
                return;
            }
            
            // Clear the old image from cache before conversion
            Core.globalImageCache.delete(panel.path);
            
            // Run conversion
            
            const result = await Core.Converter.processFileWithLibrary(
                mdPath,
                converterDeps.ExcalidrawModule,
                converterDeps.LZString,
                converterDeps.fontData,
            );
            
            if (result.success) {
                
                // Wait a moment for file system to update
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Clear cache again to ensure fresh load
                Core.globalImageCache.delete(panel.path);
                
                // Refresh file list to show updated SVG
                setFileListVersion(v => v + 1);
                
                // Trigger cache update to re-render canvas
                if (onCacheUpdateRef.current) {
                    onCacheUpdateRef.current();
                }
                
                // Update the panel with fresh image data
                const svgFile = dc.app.vault.getAbstractFileByPath(panel.path);
                if (svgFile) {
                    // Force reload the image by creating a new panel object
                    setPanel(prev => prev ? { ...prev, path: prev.path } : null);
                }
            } else {
                console.error('Conversion failed');
            }
        } catch (err) {
            console.error('Error during retry conversion:', err);
        }
    };
    const handleCopyMarkdown = () => { 
        if (!panel?.path) return; 
        const e = panel.path.split("/").pop().replace(".svg", ""); 
        navigator.clipboard.writeText(`![[${e}]]`); 
    };
    const handleCopySvgContent = async () => { 
        if (!panel?.path || !imageFiles) return; 
        const e = imageFiles.find(e => e.path === panel.path); 
        if (!e) return; 
        const t = await dc.app.vault.read(e); 
        navigator.clipboard.writeText(t); 
    };
    const handleCopyFile = async () => { 
        if (!panel?.path || !imageFiles) return; 
        try { 
            const e = imageFiles.find(e => e.path === panel.path); 
            if (!e) throw new Error("File not found"); 
            const t = await dc.app.vault.read(e);
            const r = (new DOMParser).parseFromString(t, "image/svg+xml");
            const s = r.documentElement; 
            if (s.tagName.toLowerCase().includes("parsererror")) throw new Error("Failed to parse SVG."); 
            if (!s.getAttribute("width") || !s.getAttribute("height")) { 
                const e = s.getAttribute("viewBox"); 
                if (e) { 
                    const t = e.trim().split(/\s+/); 
                    if (t.length === 4) {
                        if (!s.getAttribute("width")) s.setAttribute("width", t[2]);
                        if (!s.getAttribute("height")) s.setAttribute("height", t[3]);
                    }
                } 
            } 
            const a = (new XMLSerializer).serializeToString(r);
            const o = new Blob([a], { type: "image/svg+xml" }); 
            await navigator.clipboard.write([new ClipboardItem({ "image/svg+xml": o })]); 
        } catch (e) { 
            console.error("Failed to copy file:", e); 
        } 
    };

    // While checking for consent, render a blank screen to avoid flicker
    if (hasConsented === null) {
        return <div style={{ height: '100%', width: '100%', background: localTheme === 'theme-light' ? '#f0f0f4' : '#0f0a12' }}></div>;
    }

    // If consent has not been given, show the consent screen
    if (!hasConsented) {
        return <ConsentScreen onAccept={handleConsent} />;
    }

    if (converterStatus === 'loading') {
        return <ConverterLoadingView logs={converterLogs} syncStatus="idle" syncProgress={{ processed: 0, converted: 0, total: 0, skipped: 0 }} syncLogs={[]} />;
    }
    if (converterStatus === 'error') {
        return <ConverterErrorView error={converterError} />;
    }

    if (imageFiles === null) {
        return (
            <div style={{ 
                height: '70vh', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '32px',
                color: 'var(--glow)',
                width: '100%'
            }}>
                {OverlayLogo && <OverlayLogo size={80} animated={true} />}
                <span style={{ 
                    animation: 'pulse 1.5s infinite', 
                    fontVariant: 'small-caps', 
                    letterSpacing: '4px',
                    fontSize: '14px',
                    opacity: 0.8
                }}>[ LOADING ]</span>
            </div>
        );
    }

    if (workerError) { return (<div style={{ padding: '16px', textAlign: 'center' }}><p style={{ color: '#ff8a8a' }}>Worker Failed</p><p style={{ color: '#aaa', fontSize: '12px' }}>{workerError}</p></div>) }

    if (imageFiles.length === 0 && potentialMdFileCount === 0 && isFullscreen) {
        return (
            <div style={{ padding: '16px', textAlign: 'center', height: '100%', display: 'grid', placeContent: 'center' }}>
                <p>No SVG or Excalidraw files found in</p>
                <p style={{ color: '#888', fontSize: '12px' }}>{FOLDER_PATH}</p>
                <p style={{ color: '#aaa', fontSize: '12px', marginTop: '20px' }}>Add .svg or .md Excalidraw files to this folder to see them here.</p>
            </div>
        );
    }

    if (visibleImageFiles.length === 0 && imageFiles.length > 0 && isFullscreen) { return (<div style={{ padding: '16px', textAlign: 'center' }}><p>All images hidden.</p><button className="btn" onClick={restoreAllHidden}>Restore All</button></div>) }

    const viewProps = {
        isFullTab: isFullscreen, onCardClick, imagesToDisplay: sortedAndVisibleImageFiles,
        a888aTagsMap: imageTagsMap,
        isSearching, matchingImagePaths, isSelectionMode, selectedPaths, onToggleSelection: handleToggleSelection,
        imageCache, requestImages, requestedSet, onCacheUpdate: onCacheUpdateRef, interactingUntilRef,
        resetViewKey
    };

    return (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
            <style>{`${viewStyling}`}</style>
            
            {/* Background Notifications - stacked vertically */}
            {showSyncNotification && (
                <BackgroundSyncNotification 
                    syncStatus={syncStatus} 
                    syncProgress={syncProgress}
                    onDismiss={() => setShowSyncNotification(false)}
                    notificationIndex={0}
                />
            )}
            
            {showConversionNotification && (
                <BackgroundConversionNotification 
                    isConverting={isConverting} 
                    conversionProgress={conversionProgress}
                    onDismiss={() => setShowConversionNotification(false)}
                    notificationIndex={showSyncNotification && syncStatus === 'syncing' ? 1 : 0}
                />
            )}
            
            <div className={isFullscreen ? "full-tab-wrapper" : "mini-canvas-wrapper"}>
                <button 
                    className="fullscreen-toggle-btn" 
                    onClick={handleToggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Icon icon="minimize-2" size={20} /> : <Icon icon="maximize-2" size={20} />}
                </button>
                
                {viewType === 'grid' && <GridView {...viewProps} isTransitioning={isTransitioning} initialPositions={transitionInitialPositions} onTransitionEnd={handleTransitionEnd} />}
                {viewType === 'graph' && <GraphView {...viewProps} nodesRef={graphNodesRef} />}

                <div className="overlay">
                    <SearchBar
                        onInputMount={(node) => searchInputRef.current = node}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onClear={() => setSearchTerm('')}
                        sortOption={sortOption}
                        onSortChange={setSortOption}
                        sortOptions={sortOptions}
                        viewType={viewType}
                        onViewChange={handleViewChange}
                        isSelectionMode={isSelectionMode}
                        onToggleSelectionMode={handleToggleSelectionMode}
                        allTags={allUniqueTags}
                        onTagClick={handleTagSearch}
                        onResetView={() => setResetViewKey(k => k + 1)}
                        onSyncGitHub={syncFromGitHub}
                        syncStatus={syncStatus}
                    />
                    {isSearching && matchingImagePaths.size === 0 && (<div className="search-no-results">No results for "{searchTerm}"</div>)}
                    {isSelectionMode && selectedPaths.size > 0 && (
                        <MassEditPanel selectedCount={selectedPaths.size} onApplyPreset={handleApplyPreset} onApplyA888a={handleApplyA888a} onApplyCustom={handleApplyCustom} onClear={() => setSelectedPaths(new Set())} onClose={handleToggleSelectionMode} />
                    )}
                    {panel && (
                        <div className="panel-wrap" onClick={(e) => { if (e.target === e.currentTarget) setPanel(null); }}>
                            <div className="panel">
                                <div className="panel-img-box"><ZoomableImage lowResUrl={panel.lowResUrl} initialBitmap={panel.initialBitmap} highResPath={panel.path} alt={panel.path} /></div>
                                <div className="panel-controls">
                                    <div className="panel-info">
                                        <div className="panel-title">{panel.path.split('/').pop().replace('.svg', '')}</div>
                                        <div className="panel-row">Path: {panel.path}</div>
                                        {panel.tags && panel.tags.length > 0 && (<div className="panel-tags">{panel.tags.map(tag => <span key={tag} className="panel-tag">{tag}</span>)}</div>)}
                                    </div>
                                    <div className="btn-group">
                                        <button className="panel-icon-btn" onClick={handleCopyMarkdown} title="Copy Markdown Link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg></button>
                                        <button className="panel-icon-btn" onClick={handleCopySvgContent} title="Copy SVG Content"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></button>
                                        <button className="panel-icon-btn" onClick={handleCopyFile} title="Copy File"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                                        <button className="panel-icon-btn" onClick={handleRetryConversion} title="Retry Conversion"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg></button>
                                        {removedImages.has(panel.path) ? (<button className="panel-icon-btn active" onClick={handleToggleHide} title="Unhide Image"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>) : (<button className="panel-icon-btn danger" onClick={handleToggleHide} title="Hide Image"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg></button>)}
                                        <button className="panel-icon-btn" onClick={() => setPanel(null)} title="Close Panel (Esc)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

return AssetsLibrary;