# DataCoreSection

```jsx
const { useEffect, useRef, useState, useCallback, useMemo } = dc;

function DataCoreSection({
    dc,
    setIsSyncing,
    setIsModalOpen,
    DatacorePlayground,
    NFModal,
    MediaResolver,
    VID_EXTS,
    ContentRenderer,
    componentMediaCache,
    STYLES,
    uniqueWrapperClass,
    setIsMediaFullscreen,
    OverlayLogo,
    openModal,
    closeModal,
    LoadingScreen,
    isModalOpen,
}) {

        const [categories, setCategories] = useState([]);
        const [heroItems, setHeroItems] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
            // DEFER INITIALIZATION TO PREVENT TRANSITION JANK
            const timer = setTimeout(() => {
                if (mountedRef.current) loadData();
            }, 400);
            return () => { clearTimeout(timer); };
        }, []);

        const loadData = async () => {
             try {
                const showcaseContent = await dc.app.vault.read(
                    dc.app.vault.getAbstractFileByPath("_RESOURCES/DATACORE/DATACORE.showcase.md")
                );
                const basePath = "_RESOURCES/DATACORE";
                const cats = parseShowcaseContent(showcaseContent, basePath);
                if (mountedRef.current) {
                    setCategories(cats);
                    const featured = cats.flatMap(c => c.components).filter(c => c.isFeatured);
                    setHeroItems(featured);
                    setIsLoading(false);
                }
            } catch (e) {
                if (mountedRef.current) setError(e.toString());
            }
        };
        const mountedRef = useRef(true);
        const [activeTab, setActiveTab] = useState('showcase'); // New state for active tab
        const [playgroundFilePath, setPlaygroundFilePath] = useState(""); // Sync with playground
        const [showVaultSelector, setShowVaultSelector] = useState(null); // Import modal
        const [isImporting, setIsImporting] = useState(false);
        const [customPath, setCustomPath] = useState("_RESOURCES/DATACORE"); // Remember last used path
        const [showSuccessScreen, setShowSuccessScreen] = useState(null); // { componentName, keyword, version, viewerCode }
        const [loadingViewer, setLoadingViewer] = useState(false);
        
        // Scroll position persistence
        const mainScrollPositionRef = useRef(0);
        const rowScrollPositionsRef = useRef({});
        const showcaseContainerRef = useRef(null);

        const parseShowcaseContent = useCallback((markdownContent, basePath) => {
            const lines = markdownContent.split("\n");
            const parsedCategories = [];
            let currentCategory = null;
            const categoryRegex = /^## \*\*(.*)\*\*/;
            const componentLinkRegex = /^###### \[([^\]]+)\]\(([^)]+)\)(.*)/;
            const colorMap = {
                BLACK: "var(--text-muted)",
                RED: "oklch(0.75 0.22 25)",
                BLUE: "oklch(0.75 0.2 250)",
                YELLOW: "oklch(0.85 0.2 90)",
            };
            for (const line of lines) {
                const trimmed = line.trim();
                const categoryMatch = trimmed.match(categoryRegex);
                const componentMatch = trimmed.match(componentLinkRegex);
                if (categoryMatch) {
                    const rawName = categoryMatch[1];
                    const nameParts = rawName.match(/^(BLACK|RED|BLUE|YELLOW)-(.+)/i);
                    let color = "var(--text-normal)";
                    let displayName = rawName;
                    if (nameParts) {
                        color = colorMap[nameParts[1].toUpperCase()] || color;
                        displayName = nameParts[2].trim();
                    }
                    currentCategory = { name: displayName, color: color, components: [] };
                    parsedCategories.push(currentCategory);
                } else if (componentMatch && currentCategory) {
                    const name = componentMatch[1];
                    const path = decodeURIComponent(componentMatch[2]);
                    const tagsRaw = componentMatch[3] || "";

                    const hasNewTag = tagsRaw.includes("{ NEW }");
                    const hasPrototypeTag = tagsRaw.includes("{ PROTOTYPE }");
                    const hasUpgradeTag = tagsRaw.includes("{ UPGRADE }");
                    const hasFeaturedTag =
                        tagsRaw.includes("{ FEATURE }") || tagsRaw.includes("{ FEATURED }");

                    currentCategory.components.push({
                        name: name.replace(/ { ?(NEW|FEATURED?|PROTOTYPE|UPGRADE) ?}/g, "").trim(),
                        path: `${basePath}/${path}`,
                        isNew: hasNewTag,
                        isPrototype: hasPrototypeTag,
                        isUpgrade: hasUpgradeTag,
                        isFeatured: hasFeaturedTag,
                    });
                }
            }
            return parsedCategories;
        }, []);
        const inflightMediaFetches = useRef(new Map()); // path -> Promise
        const fetchAndCacheComponentMedia = useCallback(async (componentPath, force = false) => {
            if (!force) {
                const cached = componentMediaCache.current[componentPath];
                // Return cache if it exists and is the new format (no videoFileName)
                if (cached && !cached.videoFileName) return cached;
            }
            
            // Avoid duplicate fetches for same path
            if (inflightMediaFetches.current.has(componentPath)) {
                return inflightMediaFetches.current.get(componentPath);
            }

            const fetchPromise = (async () => {
                try {
                    const file = dc.app.vault.getAbstractFileByPath(componentPath);
                    if (!file) return null;
                    const content = await dc.app.vault.read(file);
                    
                    const imageRegexG = /!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
                    const mediaFiles = [];
                    let m;
                    while ((m = imageRegexG.exec(content)) !== null) {
                        const candidate = m[1] || m[2];
                        if (candidate) mediaFiles.push(candidate);
                    }

                    const parentDir = componentPath.substring(0, componentPath.lastIndexOf("/"));
                    const queries = mediaFiles.map(raw => ({ 
                        query: raw, 
                        opts: { preferDir: parentDir } 
                    }));
                    const resolvedPaths = await MediaResolver.resolveBatch(queries);
                    
                    const imgPaths = [];
                    let videoSrc = null;
                    
                    resolvedPaths.forEach((path, idx) => {
                        if (!path) return;
                        const raw = mediaFiles[idx];
                        const lowerRaw = raw.toLowerCase();
                        const isVideo = VID_EXTS.some(ext => lowerRaw.endsWith(`.${ext}`));
                        const isImage = IMG_EXTS.some(ext => lowerRaw.endsWith(`.${ext}`));

                        if (isVideo && !videoSrc) {
                            videoSrc = path;
                        } else if (isImage) {
                            imgPaths.push(path);
                        }
                    });
                    
                    const details = { imageSrcs: imgPaths, videoSrc };
                    componentMediaCache.current[componentPath] = details;
                    return details;
                } catch (e) {
                    return null;
                } finally {
                    inflightMediaFetches.current.delete(componentPath);
                }
            })();

            inflightMediaFetches.current.set(componentPath, fetchPromise);
            return fetchPromise;
        }, []);

        // Import functionality (from DatacoreImporter)
        const getAvailableVaults = useCallback(() => {
            const vaults = [];
            if (!dc.app.vault?.adapter?.basePath) {
                return [{ name: 'Current Vault', path: '', isCurrent: true }];
            }
            const currentVaultPath = dc.app.vault.adapter.basePath;
            const currentVaultName = dc.app.vault.getName();
            try {
                if (window.require) {
                    const electron = window.require('electron');
                    if (electron.remote) {
                        const app = electron.remote.app;
                        const path = electron.remote.require('path');
                        const fs = electron.remote.require('fs');
                        const userDataPath = app.getPath('userData');
                        const obsidianJsonPath = path.join(userDataPath, 'obsidian.json');
                        if (fs.existsSync(obsidianJsonPath)) {
                            const data = JSON.parse(fs.readFileSync(obsidianJsonPath, 'utf8'));
                            if (data.vaults) {
                                Object.entries(data.vaults).forEach(([vaultId, vaultInfo]) => {
                                    const vaultPath = vaultInfo.path;
                                    const isCurrent = vaultPath === currentVaultPath;
                                    const vaultName = isCurrent ? currentVaultName : path.basename(vaultPath);
                                    vaults.push({
                                        id: vaultId,
                                        name: vaultName,
                                        path: vaultPath,
                                        isCurrent: isCurrent,
                                        lastOpened: vaultInfo.ts
                                    });
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Error loading vaults:", e);
            }
            if (vaults.length === 0) {
                vaults.push({ name: currentVaultName, path: currentVaultPath, isCurrent: true });
            }
            return vaults;
        }, []);

        const handleImportToVault = async (componentPath, targetVault) => {
            if (!componentPath) {
                new Notice("Component path not found", 3000);
                return;
            }
            setIsImporting(true);
            setShowVaultSelector(null);
            try {
                // Extract folder name from path
                const folderMatch = componentPath.match(/\d+\s+[^\/]+/);
                if (!folderMatch) {
                    throw new Error("Could not determine component folder name");
                }
                const folderName = folderMatch[0];
                const sourcePath = `_RESOURCES/DATACORE/${folderName}`;

                // Check if source folder exists
                const sourceFolder = dc.app.vault.getAbstractFileByPath(sourcePath);
                if (!sourceFolder) {
                    throw new Error(`Source folder not found: ${sourcePath}`);
                }
                
                if (targetVault.isCurrent) {
                    new Notice("This component is already in the current vault!", 3000);
                    setIsImporting(false);
                    return;
                }
                
                // Get all files recursively
                const getAllFilesInFolder = async (folderPath) => {
                    const files = [];
                    const folder = dc.app.vault.getAbstractFileByPath(folderPath);
                    if (!folder || !folder.children) return files;

                    for (const child of folder.children) {
                        if (child.children) {
                            const subFiles = await getAllFilesInFolder(child.path);
                            files.push(...subFiles);
                        } else {
                            files.push(child);
                        }
                    }
                    return files;
                };

                const filesToCopy = await getAllFilesInFolder(sourcePath);


                if (filesToCopy.length === 0) {
                    throw new Error("No files found in component folder");
                }

                // Check for Node.js fs
                const fs = window.require ? window.require('fs') : null;
                const path = window.require ? window.require('path') : null;
                if (!fs || !path) {
                    throw new Error("File system access not available. Requires Node.js integration.");
                }

                new Notice(`Copying ${filesToCopy.length} files to ${targetVault.name}...`, 3000);

                let copiedCount = 0;
                let skippedCount = 0;

                // Define binary file extensions (all images, fonts, media, archives, 3D models, etc.)
                const binaryExtensions = [
                    // Images
                    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff', 'tif', 'svg', 
                    'avif', 'heic', 'heif', 'jfif', 'pjpeg', 'pjp', 'apng',
                    // Fonts
                    'ttf', 'woff', 'woff2', 'eot', 'otf',
                    // Media
                    'mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv', 'flv', 'wmv',
                    'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
                    // 3D Models
                    'glb', 'gltf', 'obj', 'fbx', 'stl', 'dae', 'ply', '3ds', 'blend',
                    // Documents
                    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                    // Archives
                    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
                    // Executables & Libraries
                    'exe', 'dll', 'so', 'dylib',
                    // Other
                    'bin', 'dat'
                ];

                for (const file of filesToCopy) {
                    try {
                        const isBinary = file.extension && binaryExtensions.includes(file.extension.toLowerCase());
                 
                        
                        // Read as binary or text depending on file type
                        const content = isBinary 
                            ? await dc.app.vault.readBinary(file)
                            : await dc.app.vault.read(file);
                        
                    
                        const relativePath = file.path.replace(sourcePath + '/', '');
                        const targetFilePath = path.join(targetVault.path, customPath, folderName, relativePath);
                        const targetDir = path.dirname(targetFilePath);

                        if (!fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, { recursive: true });
                        }

                        if (fs.existsSync(targetFilePath)) {
                            skippedCount++;
                            continue;
                        }

                        // Write binary or text accordingly
                        if (isBinary) {
                            const buffer = Buffer.from(content);
                            
                            fs.writeFileSync(targetFilePath, buffer);
                        } else {
                            
                            fs.writeFileSync(targetFilePath, content, 'utf8');
                        }
                        
                        copiedCount++;

                        if (copiedCount % 10 === 0) {
                            new Notice(`Copied ${copiedCount}/${filesToCopy.length} files...`, 1000);
                        }
                    } catch (e) {
                        console.error(`Failed to copy ${file.path}:`, e);
                    }
                }

                const message = skippedCount > 0
                    ? `Imported ${copiedCount} files (${skippedCount} skipped) to ${targetVault.name}!`
                    : `Successfully imported ${copiedCount} files to ${targetVault.name}!`;

                new Notice(message, 5000);
                
                const comp = categories.flatMap(c => c.components).find(c => c.path === componentPath);
                const componentName = comp?.name || "Component";
                
                // Extract keyword from folder name (remove number prefix, emojis, curly braces, and spaces)
                const keyword = folderName
                    .replace(/^\d+\s+/, '')  // Remove number prefix (e.g., "13 ")
                    .replace(/\{[^}]*\}/g, '')  // Remove anything in curly braces (including emojis)
                    .trim()  // Remove leading/trailing whitespace
                    .toLowerCase()
                    .replace(/\s+/g, '');  // Remove remaining spaces
                
                // Extract version from the actual FILE name, not folder name
                const fileName = componentPath.split('/').pop();
                // Match patterns like: "v3.md", ".v3.", " v3.", "v3 "
                const versionMatch = fileName.match(/[\s\.]v(\d+)[\s\.]/i) || fileName.match(/v(\d+)\.md$/i);
                const version = versionMatch ? `v${versionMatch[1]}` : null;
                
                // Fetch the viewer codeblock
                setLoadingViewer(true);
                try {
                   
                    
                    // Build the viewer file name with D.q. prefix
                    const viewerFileName = version 
                        ? `D.q.${keyword}.viewer.${version}.md`
                        : `D.q.${keyword}.viewer.md`;
                    
                    // IMPORTANT: Always fetch from the SOURCE vault location, not the custom deployment path
                    const viewerPath = `_RESOURCES/DATACORE/${folderName}/${viewerFileName}`;
       
                    
                    let viewerCode = null;
                    
                    // Try to find the viewer file
                    const viewerFile = dc.app.vault.getAbstractFileByPath(viewerPath);
                  
                    
                    if (viewerFile) {
                    
                        
                        try {
                            const content = await dc.app.vault.read(viewerFile);
                            
                            
                            // Extract codeblock from the markdown file
                            const codeblockMatch = content.match(/```(?:datacorejsx|jsx)?\n([\s\S]*?)```/);
                            
                            if (codeblockMatch) {
                                viewerCode = codeblockMatch[1].trim();
                                
                            } else {
                                
                                
                                // Try without language specifier
                                const altMatch = content.match(/```\n([\s\S]*?)```/);
                                if (altMatch) {
                                    viewerCode = altMatch[1].trim();
                                    
                                }
                            }
                        } catch (err) {
                            console.error("Failed to read viewer file:", err);
                        }
                    } else {
                        
                        
                        // IMPORTANT: Try to find what files exist in the SOURCE folder
                        const folder = dc.app.vault.getAbstractFileByPath(`_RESOURCES/DATACORE/${folderName}`);
                        if (folder && folder.children) {
                            
                            // Look for any .viewer file
                            const viewerFiles = folder.children.filter(f => 
                                f.name.includes('.viewer') && f.extension === 'md'
                            );
                            
                            if (viewerFiles.length > 0) {
                                const firstViewer = viewerFiles[0];
                                
                                
                                try {
                                    const content = await dc.app.vault.read(firstViewer);
                                    const codeblockMatch = content.match(/```(?:datacorejsx|jsx)?\n([\s\S]*?)```/);
                                    if (codeblockMatch) {
                                        viewerCode = codeblockMatch[1].trim();
                                        
                                    }
                                } catch (err) {
                                    console.error("Failed to read alternative viewer:", err);
                                }
                            }
                        }
                    }
                    
                    
                    if (viewerCode) {
                       
                    }
                    
                    setShowSuccessScreen({
                        componentName,
                        keyword,
                        version,
                        targetVault: targetVault.name,
                        viewerCode
                    });
                } catch (err) {
                    console.error("Failed to fetch viewer code:", err);
                    setShowSuccessScreen({
                        componentName,
                        keyword,
                        version,
                        targetVault: targetVault.name,
                        viewerCode: null
                    });
                } finally {
                    setLoadingViewer(false);
                }
            } catch (error) {
                console.error("Import failed:", error);
                new Notice(`Import failed: ${error.message}`, 5000);
            } finally {
                setIsImporting(false);
            }
        };

        const extractEntryData = useCallback(
            async (componentPath) => {
                const file = dc.app.vault.getAbstractFileByPath(componentPath);
                if (!file) return null;

                const content = await dc.app.vault.read(file);
                const titleMatch = content.match(/^###\s*Tab:\s*(.+)$/m);
                const title = titleMatch
                    ? titleMatch[1].trim()
                    : content.match(/^#\s*(.+)$/m)?.[1]?.trim() || "Entry";

                const stripBaseIndent = (str) => {
                    if (!str) return "";
                    const lines = str.split('\n');
                    const firstNonEmpty = lines.find(l => l.trim().length > 0);
                    if (!firstNonEmpty) return str.trim();
                    const indentMatch = firstNonEmpty.match(/^\s*/);
                    const indent = indentMatch ? indentMatch[0] : "";
                    if (!indent) return str.trim();
                    return lines.map(line => line.startsWith(indent) ? line.slice(indent.length) : line.trimStart()).join('\n').trim();
                };

                const render = async (txt) => {
                    if (!txt) return '';
                    const filtered = txt.split(/\n/)
                        .filter(line => 
                            !line.trim().match(/^!\[.*\]\(.*\)$/) && 
                            !line.trim().match(/^!\[\[.*\]\]$/) && 
                            !line.trim().match(/<iframe/i)
                        )
                        .join('\n').trim();
                    return await ContentRenderer.renderMarkdown(filtered);
                };

                const descMatch = content.match(/^\s*-\s*\*\*Description\*\*:\s*([\s\S]*?)(?:\r?\n\s*-{2,}|\r?\n\s*-\s*\*\*|\r?\n\s*###|$)/im);
                const rawDescription = descMatch ? stripBaseIndent(descMatch[1]) : "";

                const doesMatch = content.match(/^\s*-\s*\*\*Does\*\*:\s*\r?\n([\s\S]*?)(?=\r?\n\s*-\s*\*\*(?:Can(?:'|’)?t)\*\*:|\r?\n\s*##|\r?\n\s*###|\r?\n\s*####|\r?\n\s*#####|\r?\n\s*######|$)/im);
                const rawDoes = doesMatch ? stripBaseIndent(doesMatch[1]) : "";

                const cantMatch = content.match(/^\s*-\s*\*\*(?:Can(?:'|’)?t)\*\*:\s*\r?\n([\s\S]*?)(?=\r?\n\s*-\s*\*\*|\r?\n\s*##|\r?\n\s*###|\r?\n\s*####|\r?\n\s*#####|\r?\n\s*######|$)/im);
                const rawCant = cantMatch ? stripBaseIndent(cantMatch[1]) : "";

                const disclaimerMatch = content.match(/^\s*-\s*\*\*Disclaimer\*\*:\s*\r?\n([\s\S]*?)(?=\r?\n\s*-\s*\*\*|\r?\n\s*##|\r?\n\s*###|\r?\n\s*####|\r?\n\s*#####|\r?\n\s*######|$)/im);
                const rawDisclaimer = disclaimerMatch ? stripBaseIndent(disclaimerMatch[1]) : "";

                const [description, doesBlock, cantBlock, disclaimerBlock] = await Promise.all([
                    render(rawDescription),
                    render(rawDoes),
                    render(rawCant),
                    render(rawDisclaimer)
                ]);

                const comps = [];
                // Robust regex: matches ###### followed by space, then either [Name](path) or [[WikiLink]]
                const compRegex = /######\s+(?:\[([^\]]+)\]\(([^)]+)\)|\[\[([^\]|]+)(?:\|([^\]]+))?\]\])/g;
                let c;
                while ((c = compRegex.exec(content)) !== null) {
                    let name, rawPath;
                    if (c[1]) { // Markdown link [name](path)
                        name = c[1];
                        rawPath = decodeURIComponent(c[2]);
                    } else { // Wikilink [[path|name]]
                        rawPath = c[3];
                        name = c[4] || c[3];
                    }
                    
                    const resolvedFile = dc.app.metadataCache.getFirstLinkpathDest(rawPath, componentPath);
                    const resolvedPath = resolvedFile ? resolvedFile.path : rawPath;
                    
                    console.log(`[DataCoreSection] Extracted: ${name} -> ${resolvedPath}`);
                    
                    // Filter: Only include viewers and components (including src/index.jsx)
                    const p = resolvedPath.toLowerCase();
                    if (p.includes('.viewer') || p.includes('.component') || p.includes('src/index.jsx')) {
                        comps.push({ name: name.trim(), path: resolvedPath });
                    }
                }
                console.log(`[DataCoreSection] Final comps for ${title}:`, comps);
                const media = await fetchAndCacheComponentMedia(componentPath);
                
                const slides = [];
                if (media?.imageSrcs?.length) {
                   
                    for (const src of media.imageSrcs)
                        slides.push({ type: "image", src });
                }
                const youtubeRegex =
                    /<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([^"]+)"[^>]*>.*?<\/iframe>/i;
                const iframeRegex = /<iframe[^>]*src="([^"]+)"[^>]*>.*?<\/iframe>/i;
                const yMatch = content.match(youtubeRegex);
                const iMatch = content.match(iframeRegex);
                if (yMatch?.[1]) {
                    slides.push({
                        type: "iframe",
                        src: `https://www.youtube.com/embed/${yMatch[1]}?autoplay=0&mute=0`,
                    });
                } else if (iMatch?.[1]) {
                    slides.push({ type: "iframe", src: iMatch[1] });
                }
                // Add video from cached media (uses basename matching approach)
                if (media?.videoSrc) {
                    
                    slides.push({ type: "video", src: media.videoSrc });
                }
                
                return {
                    title,
                    description,
                    doesBlock,
                    cantBlock,
                    disclaimerBlock,
                    comps,
                    slides,
                    rawContent: content,
                };
            },
            [fetchAndCacheComponentMedia]
        );

        useEffect(() => {
            mountedRef.current = true;
            const run = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const showcasePath = "_RESOURCES/DATACORE/DATACORE.showcase.md";
                    const file = dc.app.vault.getAbstractFileByPath(showcasePath);
                    if (!file)
                        throw new Error(`Showcase file not found at: "${showcasePath}"`);
                    const basePath = showcasePath.substring(
                        0,
                        showcasePath.lastIndexOf("/")
                    );
                    const content = await dc.app.vault.read(file);
                    const parsedCategories = parseShowcaseContent(content, basePath);
                    const allComponents = parsedCategories.flatMap((c) => c.components);
                    const featured = allComponents.filter((c) => c.isFeatured);
                    const itemsForHero = featured.length > 0 ? featured : allComponents;
                    
                    // Show UI immediately with parsed data
                    if (mountedRef.current) {
                        setCategories(parsedCategories);
                        setHeroItems(itemsForHero);
                        setIsLoading(false);
                        setIsSyncing(false);
                    }
                    
                    // Immediately load first visible components (hero + first row)
                    const priorityComponents = [
                        ...itemsForHero.slice(0, 3),
                        ...allComponents.slice(0, 12) // First row typically shows ~8-12 items
                    ];
                    
                    // Remove duplicates
                    const uniquePriority = Array.from(new Set(priorityComponents.map(c => c.path)))
                        .map(path => allComponents.find(c => c.path === path));
                    
                    // Load priority components in parallel batches of 6
                    const loadBatch = async (components) => {
                        const batches = [];
                        for (let i = 0; i < components.length; i += 6) {
                            batches.push(components.slice(i, i + 6));
                        }
                        
                        for (const batch of batches) {
                            await Promise.all(batch.map(comp => 
                                fetchAndCacheComponentMedia(comp.path).catch(() => {})
                            ));
                        }
                    };
                    
                    // Load priority first (blocks briefly but ensures visible content loads)
                    loadBatch(uniquePriority).then(() => {
                        // Then load remaining in background
                        const remaining = allComponents.filter(c => 
                            !uniquePriority.some(p => p.path === c.path)
                        );
                        
                        let loadIndex = 0;
                        const loadNext = () => {
                            if (loadIndex >= remaining.length) return;
                            const batch = remaining.slice(loadIndex, loadIndex + 6);
                            loadIndex += 6;
                            
                            Promise.all(batch.map(comp => 
                                fetchAndCacheComponentMedia(comp.path).catch(() => {})
                            )).finally(() => {
                                if (loadIndex < remaining.length) {
                                    if ('requestIdleCallback' in window) {
                                        requestIdleCallback(loadNext, { timeout: 1000 });
                                    } else {
                                        setTimeout(loadNext, 50);
                                    }
                                }
                            });
                        };
                        
                        if ('requestIdleCallback' in window) {
                            requestIdleCallback(loadNext, { timeout: 100 });
                        } else {
                            setTimeout(loadNext, 50);
                        }
                    });
                } catch (e) {
                    if (mountedRef.current) {
                        setError(e.message);
                        setIsLoading(false);
                    }
                }
            };
            run();
            return () => {
                mountedRef.current = false;
            };
        }, [parseShowcaseContent, fetchAndCacheComponentMedia, setIsSyncing]);
        
        // Lock body scroll when modal is open and restore scroll position when closed
        useEffect(() => {
            if (isModalOpen) {
                // Save scroll position and lock body scroll
                mainScrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.top = `-${mainScrollPositionRef.current}px`;
                document.body.style.width = '100%';
            } else if (mainScrollPositionRef.current > 0) {
                // Restore body scroll and position
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, mainScrollPositionRef.current);
            }
        }, [isModalOpen]);

        // Modal control moved to global state via openModal
        
        const onOpenModal = useCallback(
            async (comp) => {
                if (openModal) {
                    openModal({
                        open: true,
                        comp,
                        details: null,
                        loading: true,
                        isDatacore: true
                    });
                    const details = await extractEntryData(comp.path);
                    if (mountedRef.current) {
                        openModal({ details, loading: false });
                    }
                }
            },
            [extractEntryData, openModal]
        );
        const onCloseModal = useCallback(() => {
            if (closeModal) closeModal();
        }, [closeModal]);
        const HeroCarousel = ({ items, onOpenModal }) => {
            const [idx, setIdx] = useState(0);
            const [isPaused, setIsPaused] = useState(false);
            const [isHovered, setIsHovered] = useState(false);
            const [userInteracted, setUserInteracted] = useState(false);
            const videoRefs = useRef({});
            const len = items.length;
            
            const advanceToNext = useCallback(() => {
                if (len > 1) {
                    setIdx((i) => (i + 1) % len);
                    setUserInteracted(false); // Reset user interaction flag on auto-advance
                }
            }, [len]);
            
            // Play/pause videos based on active index
            useEffect(() => {
                Object.keys(videoRefs.current).forEach((key) => {
                    const videoEl = videoRefs.current[key];
                    if (videoEl) {
                        if (parseInt(key) === idx) {
                            // Always play if user just interacted, or if not paused
                            if (userInteracted || !isPaused) {
                                videoEl.currentTime = 0;
                                videoEl.play().catch(() => {});
                            }
                        } else {
                            videoEl.pause();
                        }
                    }
                });
            }, [idx, isPaused, userInteracted]);
            
            useEffect(() => {
                if (!isPaused && len > 1) {
                    const activeMedia = componentMediaCache.current[items[idx]?.path];
                    // If current slide has video, don't auto-advance (video will trigger advance when it ends)
                    if (activeMedia?.videoSrc) {
                        return;
                    }
                    // For images, auto-advance after 8 seconds
                    const intervalId = setInterval(advanceToNext, 8000);
                    return () => clearInterval(intervalId);
                }
            }, [isPaused, len, idx, items, advanceToNext]);
            
            const advance = (dir) => setIdx((i) => (i + dir + len) % len);
            const prev = (e) => {
                e.stopPropagation();
                setUserInteracted(true);
                advance(-1);
            };
            const next = (e) => {
                e.stopPropagation();
                setUserInteracted(true);
                advance(1);
            };
            if (len === 0) {
                return (
                    <div className="nf-hero">
                        <div className="nf-hero-media">
                            <div className="nf-skel" />
                        </div>
                        <div className="nf-hero-grad" />
                        <div className="nf-hero-content">
                            <div className="nf-hero-title">Datacore Components</div>
                        </div>
                    </div>
                );
            }
            const activeItem = items[idx];
            return (
                <div
                    className="nf-hero"
                    onMouseEnter={() => {
                        setIsPaused(true);
                        setIsHovered(true);
                    }}
                    onMouseLeave={() => {
                        setIsPaused(false);
                        setIsHovered(false);
                    }}
                    onClick={() => onOpenModal(activeItem)}
                >
                    <div className="nf-hero-media">
                        {items.map((item, i) => {
                            const media = componentMediaCache.current[item.path];
                            const isActive = i === idx;
                            return (
                                <div
                                    key={item.path}
                                    className={`nf-hero-slide ${isActive ? "active" : ""}`}
                                >
                                    {media?.videoSrc ? (
                                        <video
                                            ref={(el) => {
                                                if (el) videoRefs.current[i] = el;
                                            }}
                                            src={media.videoSrc}
                                            muted
                                            playsInline
                                            onEnded={() => {
                                                if (isActive) {
                                                    advanceToNext();
                                                }
                                            }}
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                objectFit: 'contain',
                                                padding: '2rem'
                                            }}
                                        />
                                    ) : media?.imageSrcs?.[0] ? (
                                        <img src={media.imageSrcs[0]} alt={item.name} />
                                    ) : (
                                        <div className="nf-skel" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="nf-hero-grad" />
                    <div
                        key={activeItem.path}
                        className="nf-hero-content anim-fade-in-now"
                    >
                        <div className="nf-hero-title">{activeItem.name}</div>
                    </div>
                    {len > 1 && (
                            <>
                                <div
                                    className={`nf-edge nf-left-edge ${isHovered ? "nav-visible" : ""}`}
                                    onClick={prev}
                                    aria-label="Previous"
                                >
                                    <svg viewBox="0 0 24 24">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </div>
                                <div
                                    className={`nf-edge nf-right-edge ${isHovered ? "nav-visible" : ""}`}
                                    onClick={next}
                                    aria-label="Next"
                                >
                                    <svg viewBox="0 0 24 24">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            <div className="nf-hero-dots" style={{ pointerEvents: 'auto' }}>
                                {items.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`nf-dot ${i === idx ? "active" : ""}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserInteracted(true);
                                            setIdx(i);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            );
        };
        const NFCard = ({ comp, onOpenModal }) => {
            const cardRef = useRef(null);
            const videoRef = useRef(null);
            const [media, setMedia] = useState(
                componentMediaCache.current[comp.path]
            );
            const [isHovered, setIsHovered] = useState(false);
            
            useEffect(() => {
                // If already cached, no need for observer
                if (media) return;
                
                const node = cardRef.current;
                if (!node) return;
                
                // Check if already in viewport - if so, load immediately
                const rect = node.getBoundingClientRect();
                const isInViewport = (
                    rect.top < window.innerHeight + 200 &&
                    rect.bottom > -200 &&
                    rect.left < window.innerWidth &&
                    rect.right > 0
                );
                
                if (isInViewport) {
                    // Already visible, load immediately
                    fetchAndCacheComponentMedia(comp.path).then((fetchedMedia) => {
                        if (mountedRef.current) setMedia(fetchedMedia);
                    });
                    return;
                }
                
                // Not visible yet, use intersection observer
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            observer.disconnect();
                            fetchAndCacheComponentMedia(comp.path).then((fetchedMedia) => {
                                if (mountedRef.current) setMedia(fetchedMedia);
                            });
                        }
                    },
                    { threshold: 0.01, rootMargin: '200px' }
                );
                observer.observe(node);
                return () => observer.disconnect();
            }, [comp.path, media]);

            // Control video playback based on hover
            useEffect(() => {
                if (videoRef.current) {
                    if (isHovered) {
                        videoRef.current.play().catch(() => {});
                    } else {
                        videoRef.current.pause();
                        videoRef.current.currentTime = 0;
                    }
                }
            }, [isHovered]);

            // Dynamically build class names for multiple tags
            const cardClasses = ['nf-card'];
            if (comp.isNew) cardClasses.push('nf-badge-new');
            if (comp.isPrototype) cardClasses.push('nf-badge-prototype');
            if (comp.isUpgrade) cardClasses.push('nf-badge-upgrade');

            // Determine what to show: if we have both video and images, show image by default
            // If only video, show video. If only images, show images.
            const hasVideo = !!media?.videoSrc;
            const hasImage = !!(media?.imageSrcs && media.imageSrcs.length > 0 && media.imageSrcs[0]);
            const showVideo = hasVideo && isHovered;
            const showImage = hasImage && (!hasVideo || !isHovered);

            return (
                <div
                    ref={cardRef}
                    className={cardClasses.join(' ')}
                    onClick={() => onOpenModal(comp)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    role="button"
                    tabIndex={0}
                >
                    <div className="nf-card-media">
                        {showVideo && (
                            <video
                                ref={videoRef}
                                key={media.videoSrc}
                                src={media.videoSrc}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                        {showImage && media.imageSrcs[0] && (
                            <img
                                key={media.imageSrcs[0]}
                                src={media.imageSrcs[0]}
                                alt={comp.name}
                                loading="eager"
                                decoding="async"
                                onError={(e) => {
                                    console.warn(`[DataCore] Image load failed for ${comp.name}, retrying...`);
                                    fetchAndCacheComponentMedia(comp.path, true).then((refetched) => {
                                        if (mountedRef.current && refetched) setMedia(refetched);
                                    });
                                }}
                            />
                        )}
                        {!hasVideo && !hasImage && (
                            <div className="nf-skel" />
                        )}
                    </div>
                    <div className="nf-card-overlay">
                        <div className="nf-card-title">{comp.name}</div>
                    </div>
                </div>
            );
        };
        const Row = ({ title, color, items }) => {
            const scrollerRef = useRef(null);
            const [atStart, setAtStart] = useState(true);
            const [atEnd, setAtEnd] = useState(false);
            const [isHovered, setIsHovered] = useState(false);
            
            // Restore scroll position when component mounts
            useEffect(() => {
                const el = scrollerRef.current;
                if (!el) return;
                
                // Restore saved scroll position for this row
                const savedPosition = rowScrollPositionsRef.current[title];
                if (savedPosition !== undefined) {
                    el.scrollLeft = savedPosition;
                }
            }, [title]);
            
            const updateArrows = useCallback(() => {
                const el = scrollerRef.current;
                if (!el) return;
                const s = el.scrollLeft;
                const max = el.scrollWidth - el.clientWidth;
                setAtStart(s <= 1);
                setAtEnd(s >= max - 1);
            }, []);
            const scrollByAmount = (dir) => {
                const el = scrollerRef.current;
                if (!el) return;
                const amount = Math.floor(el.clientWidth * 0.85);
                el.scrollBy({ left: dir * amount, behavior: "smooth" });
            };
            useEffect(() => {
                const el = scrollerRef.current;
                if (!el) return;
                const onScroll = () => {
                    updateArrows();
                    // Save scroll position for this row
                    rowScrollPositionsRef.current[title] = el.scrollLeft;
                };
                el.addEventListener("scroll", onScroll, { passive: true });
                const ro = new ResizeObserver(updateArrows);
                ro.observe(el);
                updateArrows();
                return () => {
                    el.removeEventListener("scroll", onScroll);
                    ro.disconnect();
                };
            }, [updateArrows, title]);
            const sortedItems = useMemo(() => {
                return [...items].sort((a, b) => b.isNew - a.isNew);
            }, [items]);
            return (
                <div className="nf-row">
                    <div className="nf-row-header">
                        <h3 className="nf-row-title" style={{ color }}>
                            {title}
                        </h3>
                    </div>
                    <div
                        className="nf-row-body"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {!atStart && (
                            <button
                                className={`nf-row-edge nf-row-left-edge ${isHovered ? "nav-visible" : ""
                                    }`}
                                onClick={() => scrollByAmount(-1)}
                                aria-label="Scroll left"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ stroke: 'white' }}
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                        )}
                        <div className="nf-scroller" ref={scrollerRef}>
                            {sortedItems.map((comp) => (
                                <NFCard key={comp.path} comp={comp} onOpenModal={onOpenModal} />
                            ))}
                        </div>
                        {!atEnd && (
                            <button
                                className={`nf-row-edge nf-row-right-edge ${isHovered ? "nav-visible" : ""
                                    }`}
                                onClick={() => scrollByAmount(1)}
                                aria-label="Scroll right"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ stroke: 'white' }}
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            );
        };
        const CSS_NF = `
            .${uniqueWrapperClass} .nf-root { width: 100%; max-width: 1280px; display: flex; flex-direction: column; gap: 28px; }
            .${uniqueWrapperClass} .nf-tabs { display: flex; gap: 8px; margin-bottom: 24px; padding: 4px; background: rgba(var(--text-muted-rgb, 128, 128, 128), 0.05); border-radius: 12px; width: fit-content; border: 1px solid var(--glow-faint); }
            .${uniqueWrapperClass} .nf-tab-button { padding: 8px 20px; cursor: pointer; background: transparent; border: none; color: var(--text-muted); font-weight: 700; font-size: 13px; border-radius: 8px; transition: all .25s cubic-bezier(0.4, 0, 0.2, 1); font-variant: small-caps; letter-spacing: 0.1em; }
            .${uniqueWrapperClass} .nf-tab-button:hover { color: var(--text-normal); background: rgba(var(--text-muted-rgb, 128, 128, 128), 0.08); }
            .${uniqueWrapperClass} .nf-tab-button.active { color: var(--text-on-accent); background: var(--glow); box-shadow: 0 4px 12px oklch(from var(--glow) l c h / 20%); }
            
            .${uniqueWrapperClass} .nf-hero { position: relative; width: 100%; max-height: 60vh; min-height: 40vh; border-radius: 12px; overflow: hidden; border: 1px solid var(--glow-faint); background: var(--background-primary); cursor: pointer; max-width: 100%; margin: 0 auto; box-shadow: var(--elev); }
            .${uniqueWrapperClass} .nf-hero-media { position: absolute; inset: 0; background: transparent; }
            .${uniqueWrapperClass} .nf-hero-media img { width: 100%; height: 100%; object-fit: contain; border: 0; filter: var(--media-filter); }
            .${uniqueWrapperClass} .nf-hero-slide { position: absolute; inset: 0; opacity: 0; transition: opacity .4s ease-in-out; will-change: transform, opacity; transform: translate3d(0,0,0); }
            .${uniqueWrapperClass} .nf-hero-slide.active { opacity: 1; }
            .${uniqueWrapperClass} .nf-hero-grad { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(var(--background-primary-rgb), 0) 60%, rgba(var(--background-primary-rgb), 0.9) 100%), linear-gradient(to top, rgba(var(--background-primary-rgb), 0.5) 0%, transparent 30%); pointer-events: none; }
            .${uniqueWrapperClass} .nf-hero-content { position: absolute; left: clamp(16px, 4vw, 40px); bottom: clamp(16px, 4vw, 40px); display: flex; flex-direction: column; gap: 12px; max-width: min(70%, 820px); z-index: 2; pointer-events: none; }
            .${uniqueWrapperClass} .nf-hero-title { font-size: clamp(24px, 4.5vw, 48px); font-weight: 900; letter-spacing: .5px; color: var(--glow); text-shadow: 0 0 12px rgba(var(--background-primary-rgb), 0.8); }
            .${uniqueWrapperClass} .nf-hero-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 3; display: flex; gap: 8px; pointer-events: none; }
            .${uniqueWrapperClass} .nf-dot { width: 10px; height: 10px; border-radius: 50%; background: oklch(from var(--glow) l c h / .28); transition: background .3s ease; }
            .${uniqueWrapperClass} .nf-dot.active { background: var(--glow); }
            
            .${uniqueWrapperClass} .nf-row { position: relative; width: 100%; }
            .${uniqueWrapperClass} .nf-row-header { padding: 0 4px 8px 4px; }
            .${uniqueWrapperClass} .nf-row-title { font-size: 18px; font-weight: 800; color: var(--text-normal); margin: 0; font-variant: small-caps; letter-spacing: 0.5px; }
            .${uniqueWrapperClass} .nf-row-body { position: relative; }
            .${uniqueWrapperClass} .nf-scroller { display: flex; gap: 10px; overflow-x: auto; scroll-behavior: smooth; padding: 4px 0 12px 0; scrollbar-width: none; }
            .${uniqueWrapperClass} .nf-scroller::-webkit-scrollbar { display: none; }
            
            .${uniqueWrapperClass} .nf-row-edge { position: absolute; top: 0; bottom: 0; height: 100%; width: 40px; z-index: 5; color: white; cursor: pointer; border: none; padding: 0; display: flex; align-items: center; justify-content: center; background: transparent; opacity: 0; transition: opacity .3s ease, transform .3s ease; }
            .${uniqueWrapperClass} .nf-row-edge svg { width: 20px; height: 20px; pointer-events: none; }
            .${uniqueWrapperClass} .nf-row-left-edge { left: 0; height: 100%; background: linear-gradient(to right, rgba(0, 0, 0, 0.7), transparent); transform: translateX(-10px); }
            .${uniqueWrapperClass} .nf-row-right-edge { right: 0; height: 100%; background: linear-gradient(to left, rgba(0, 0, 0, 0.7), transparent); transform: translateX(10px); }
            .${uniqueWrapperClass} .nf-row-edge.nav-visible { opacity: 1; transform: translateX(0); }
            
            .${uniqueWrapperClass} .nf-card { position: relative; flex: 0 0 clamp(160px, 22vw, 240px); aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; border: 1px solid var(--glow-faint); background: var(--background-primary); cursor: pointer; transform-origin: center; transition: all .3s cubic-bezier(0.16, 1, 0.3, 1); will-change: transform; transform: translate3d(0, 0, 0); }
            .${uniqueWrapperClass} .nf-card:hover { transform: scale(1.07); border-color: var(--glow); box-shadow: var(--elev); z-index: 2; }
            .${uniqueWrapperClass} .nf-card-media { position: absolute; inset: 0; }
            .${uniqueWrapperClass} .nf-card-media img, .${uniqueWrapperClass} .nf-card-media video { width: 100%; height: 100%; object-fit: contain; filter: var(--media-filter); }
            .${uniqueWrapperClass} .nf-card-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, .8) 100%); opacity: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; padding: 10px; transition: opacity .2s ease; }
            .${uniqueWrapperClass} .nf-card:hover .nf-card-overlay { opacity: 1; }
            .${uniqueWrapperClass} .nf-card-title { font-size: 12px; color: #fff; font-weight: 700; letter-spacing: .2px; }
            
            .${uniqueWrapperClass} .nf-badge-new::after { content: "NEW"; position: absolute; top: 8px; right: 8px; background: var(--glow); color: var(--text-on-accent); font-size: 10px; font-weight: 900; padding: 3px 7px; border-radius: 4px; z-index: 2; }
            .${uniqueWrapperClass} .nf-badge-prototype::after { content: "PROTOTYPE"; position: absolute; top: 8px; left: 8px; background: oklch(0.88 0.22 288); color: #0b0713; font-size: 10px; font-weight: 900; padding: 3px 7px; border-radius: 4px; z-index: 2; }
            .${uniqueWrapperClass} .nf-badge-upgrade::after { content: "UPGRADE"; position: absolute; top: 8px; right: 8px; background: oklch(0.85 0.20 145); color: #0b0713; font-size: 10px; font-weight: 900; padding: 3px 7px; border-radius: 4px; z-index: 2; }
            
            .${uniqueWrapperClass} .nf-skel { width: 100%; height: 100%; background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.12) 37%, rgba(255, 255, 255, 0.06) 63%); background-size: 400% 100%; animation: nf-shimmer 1.2s ease-in-out infinite; }
            @keyframes nf-shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }
            
            .${uniqueWrapperClass} .nf-callout-body ul, .${uniqueWrapperClass} .nf-callout-body ol { margin-left: 1.5em; padding-left: 0; }
            .${uniqueWrapperClass} .nf-callout-body li { margin-bottom: 0.5em; }
            .${uniqueWrapperClass} .nf-callout-body ul ul, .${uniqueWrapperClass} .nf-callout-body ol ol { margin-left: 1.5em; }
            
            .${uniqueWrapperClass} .enigma-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 32px; background: var(--background-primary); position: relative; overflow: hidden; }
            .${uniqueWrapperClass} .enigma-text { font-size: 15px; font-weight: 600; letter-spacing: 2px; color: var(--glow); text-transform: none; font-variant: small-caps; animation: fade-pulse 2s ease-in-out infinite; }
            @keyframes fade-pulse { 0%, 100% { opacity: 0.5 } 50% { opacity: 1 } }
        `;

        if (isLoading) {
            return <LoadingScreen label="DATACORE SYNC" OverlayLogo={OverlayLogo} />;
        }
        if (error) return <div style={STYLES.tile}>Error: {error}</div>;
        return (
            <div className="nf-root" style={{ width: "100%" }}>
                <style>{CSS_NF}</style>
                {/* Tabs */}
                <div className="nf-tabs">
                    <button
                        className={`nf-tab-button ${activeTab === 'showcase' ? 'active' : ''}`}
                        onClick={() => setActiveTab('showcase')}
                    >
                        Sʜᴏᴡᴄᴀsᴇ
                    </button>
                    <button
                        className={`nf-tab-button ${activeTab === 'playground' ? 'active' : ''}`}
                        onClick={() => setActiveTab('playground')}
                    >
                        Pʟᴀʏɢʀᴏᴜɴᴅ
                    </button>
                </div>

                {/* Conditional content based on active tab */}
                {activeTab === 'showcase' && (
                    <>
                        <HeroCarousel items={heroItems} onOpenModal={onOpenModal} />
                        {categories.map((cat) => (
                            <Row
                                key={cat.name}
                                title={cat.name}
                                color={cat.color}
                                items={cat.components}
                            />
                        ))}
                    </>
                )}

                {activeTab === 'playground' && (
                    <DatacorePlayground initialFilePath={playgroundFilePath} />
                )}

                {/* Global NFModal is now managed by ViewComponent */}

                {/* Vault Selector Modal */}
                {showVaultSelector && (
                    <div 
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 2147483646,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(8px)',
                            background: 'rgba(0,0,0,0.75)'
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowVaultSelector(null);
                        }}
                    >
                        <div style={{
                            background: 'rgba(18,12,22,0.95)',
                            border: '1px solid var(--glow)',
                            borderRadius: '16px',
                            width: 'min(90vw, 600px)',
                            maxHeight: '85vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            position: 'relative'
                        }}>
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid var(--glow-faint)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: 900,
                                    color: 'var(--glow)',
                                    margin: 0,
                                    fontVariant: 'small-caps',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <dc.Icon icon="package" style={{ fontSize: '20px' }} />
                                    Import Component to Vault
                                </h2>
                                <button 
                                    onClick={() => setShowVaultSelector(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '14px',
                                        right: '18px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        display: 'grid',
                                        placeItems: 'center',
                                        transition: 'all .2s',
                                        zIndex: 10,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glow-faint)',
                                    borderRadius: '12px',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        fontVariant: 'small-caps',
                                        letterSpacing: '0.5px',
                                        color: 'var(--text-muted)',
                                        marginBottom: '8px',
                                        fontWeight: 700
                                    }}>Selected Component:</div>
                                    <div style={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: 'var(--text-normal)'
                                    }}>
                                        {categories.flatMap(c => c.components).find(c => c.path === showVaultSelector)?.name}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        color: 'var(--text-normal)',
                                        margin: '0 0 16px 0',
                                        fontVariant: 'small-caps',
                                        letterSpacing: '0.5px',
                                        fontVariant: 'small-caps'
                                    }}>Target Path</h3>
                                    <input
                                        type="text"
                                        value={customPath}
                                        onChange={(e) => setCustomPath(e.target.value)}
                                        placeholder="e.g., _RESOURCES/DATACORE"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            background: 'var(--background-primary)',
                                            border: '1px solid var(--background-modifier-border)',
                                            borderRadius: '6px',
                                            color: 'var(--text-normal)',
                                            fontFamily: 'var(--font-monospace)',
                                            fontSize: '13px',
                                            boxSizing: 'border-box',
                                            marginBottom: '8px'
                                        }}
                                    />
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'var(--text-muted)',
                                        marginBottom: '12px'
                                    }}>
                                        Component will be imported to: <code style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: '2px 6px',
                                            borderRadius: '3px',
                                            fontFamily: 'var(--font-monospace)',
                                            fontSize: '11px'
                                        }}>{customPath}/[ComponentFolder]</code>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{
                                            fontSize: '12px',
                                            color: 'var(--text-muted)',
                                            fontWeight: 600
                                        }}>Quick presets:</span>
                                        {['_RESOURCES/DATACORE', 'Components', 'Plugins', ''].map(preset => (
                                            <button 
                                                key={preset}
                                                onClick={() => setCustomPath(preset)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid var(--background-modifier-border)',
                                                    borderRadius: '4px',
                                                    color: 'var(--text-normal)',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {preset || 'Root'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        color: 'var(--text-normal)',
                                        margin: '0 0 16px 0',
                                        fontVariant: 'small-caps',
                                        letterSpacing: '0.5px',
                                        fontVariant: 'small-caps'
                                    }}>Select Target Vault</h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                        gap: '12px'
                                    }}>
                                        {getAvailableVaults().map((vault, vIndex) => (
                                            <div
                                                key={vIndex}
                                                onClick={() => {
                                                    if (!vault.isCurrent) {
                                                        handleImportToVault(showVaultSelector, vault);
                                                    }
                                                }}
                                                style={{
                                                    padding: '20px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: vault.isCurrent ? '2px dashed var(--glow-faint)' : '2px solid var(--glow-faint)',
                                                    borderRadius: '12px',
                                                    cursor: vault.isCurrent ? 'not-allowed' : 'pointer',
                                                    textAlign: 'center',
                                                    opacity: vault.isCurrent ? 0.5 : 1,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                                                    <dc.Icon 
                                                        icon={vault.isCurrent ? 'map-pin' : 'folder'} 
                                                        style={{ fontSize: '32px' }}
                                                    />
                                                </div>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: 700,
                                                    color: 'var(--text-normal)',
                                                    marginBottom: '8px'
                                                }}>
                                                    {vault.name}
                                                </div>
                                                {vault.isCurrent && (
                                                    <div style={{
                                                        display: 'inline-block',
                                                        padding: '4px 10px',
                                                        background: 'var(--glow-med)',
                                                        border: '1px solid var(--glow)',
                                                        borderRadius: '6px',
                                                        fontSize: '10px',
                                                        fontWeight: 900,
                                                        fontVariant: 'small-caps',
                                                        color: 'var(--glow)',
                                                        marginBottom: '8px'
                                                    }}>Current Vault</div>
                                                )}
                                                <div style={{
                                                    fontSize: '11px',
                                                    color: 'var(--text-muted)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>{vault.path}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glow-faint)',
                                    borderRadius: '12px',
                                    alignItems: 'flex-start'
                                }}>
                                    <dc.Icon icon="info" style={{ fontSize: '20px', flexShrink: 0, color: 'var(--glow)' }} />
                                    <div style={{
                                        fontSize: '13px',
                                        color: 'var(--text-muted)',
                                        lineHeight: '1.6'
                                    }}>
                                        The component folder and all its files will be copied to the target vault. Existing files will be skipped.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessScreen && (
                    <div 
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 2147483647,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(8px)',
                            background: 'rgba(0,0,0,0.75)'
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowSuccessScreen(null);
                        }}
                    >
                        <div style={{
                            background: 'rgba(18,12,22,0.95)',
                            border: '1px solid var(--glow)',
                            borderRadius: '16px',
                            width: 'min(90vw, 700px)',
                            maxHeight: '85vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            position: 'relative', // Ensure close button is positioned correctly
                        }}>
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid var(--glow-faint)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: 900,
                                    color: 'var(--glow)',
                                    margin: 0,
                                    fontVariant: 'small-caps',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <dc.Icon icon="check-circle" style={{ fontSize: '20px' }} />
                                    Import Successful!
                                </h2>
                                <button 
                                    onClick={() => setShowSuccessScreen(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '14px',
                                        right: '18px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        display: 'grid',
                                        placeItems: 'center',
                                        transition: 'all .2s',
                                        zIndex: 10,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glow-faint)',
                                    borderRadius: '12px',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        fontVariant: 'small-caps',
                                        letterSpacing: '0.5px',
                                        color: 'var(--text-muted)',
                                        marginBottom: '8px',
                                        fontWeight: 700
                                    }}>Component Imported:</div>
                                    <div style={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: 'var(--text-normal)'
                                    }}>
                                        {showSuccessScreen.componentName} → {showSuccessScreen.targetVault}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        color: 'var(--text-normal)',
                                        margin: '0 0 16px 0',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontVariant: 'small-caps',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <dc.Icon icon="code" style={{ fontSize: '16px', color: 'var(--glow)' }} />
                                        {showSuccessScreen.viewerCode ? 'Viewer Code' : 'How to Use This Component'}
                                    </h3>
                                    <p style={{
                                        fontSize: '13px',
                                        color: 'var(--text-muted)',
                                        marginBottom: '12px'
                                    }}>
                                        {showSuccessScreen.viewerCode 
                                            ? `Copy this viewer code to use the ${showSuccessScreen.componentName} component in ${showSuccessScreen.targetVault}:`
                                            : `Use this query to find the component in ${showSuccessScreen.targetVault}:`
                                        }
                                    </p>
                                    <div style={{
                                        position: 'relative',
                                        background: 'rgba(0,0,0,0.4)',
                                        padding: '40px 16px 16px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--glow-faint)',
                                        fontFamily: 'var(--font-monospace)',
                                        fontSize: '12px',
                                        overflowX: 'auto'
                                    }}>
                                        <button
                                            onClick={() => {
                                                let code;
                                                if (showSuccessScreen.viewerCode) {
                                                    // Wrap viewer code with codeblock markers
                                                    code = `\`\`\`datacorejsx\n${showSuccessScreen.viewerCode}\n\`\`\``;
                                                } else {
                                                    // Just copy the query without wrapping
                                                    code = `@codeblock AND $file.contains("${showSuccessScreen.keyword}.viewer${showSuccessScreen.version ? `.${showSuccessScreen.version}` : ''}")`;
                                                }
                                                navigator.clipboard.writeText(code);
                                                new Notice("Code copied to clipboard!", 2000);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                padding: '6px 12px',
                                                background: 'var(--glow)',
                                                border: 'none',
                                                borderRadius: '4px',
                                                color: 'var(--background-primary)',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <dc.Icon icon="clipboard" style={{ fontSize: '12px' }} />
                                            Copy
                                        </button>
                                        <pre style={{
                                            margin: 0,
                                            color: 'var(--text-normal)',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
{showSuccessScreen.viewerCode || `Query to find viewer:\n@codeblock AND $file.contains("${showSuccessScreen.keyword}.viewer${showSuccessScreen.version ? `.${showSuccessScreen.version}` : ''}")`}
                                        </pre>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glow-faint)',
                                    borderRadius: '12px',
                                    alignItems: 'flex-start'
                                }}>
                                    <dc.Icon icon="lightbulb" style={{ fontSize: '20px', flexShrink: 0, color: 'var(--glow)' }} />
                                    <div style={{
                                        fontSize: '13px',
                                        color: 'var(--text-muted)',
                                        lineHeight: '1.6'
                                    }}>
                                        {showSuccessScreen.viewerCode ? (
                                            <>
                                                <strong>How to use this viewer:</strong><br/>
                                                • Copy the code above into a <code style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontFamily: 'var(--font-monospace)',
                                                    fontSize: '11px'
                                                }}>```datacorejsx</code> codeblock in any markdown file<br/>
                                                • The viewer will automatically render the {showSuccessScreen.componentName} component<br/>
                                                • Component: <code style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontFamily: 'var(--font-monospace)',
                                                    fontSize: '11px'
                                                }}>{showSuccessScreen.keyword}{showSuccessScreen.version ? `.${showSuccessScreen.version}` : ''}</code>
                                            </>
                                        ) : (
                                            <>
                                                <strong>Component details:</strong><br/>
                                                • Keyword: <code style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontFamily: 'var(--font-monospace)',
                                                    fontSize: '11px'
                                                }}>{showSuccessScreen.keyword}</code><br/>
                                                • Version: <code style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontFamily: 'var(--font-monospace)',
                                                    fontSize: '11px'
                                                }}>{showSuccessScreen.version || "latest"}</code><br/>
                                                • Use the query above to locate the viewer file<br/>
                                                • Look for files matching <code style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontFamily: 'var(--font-monospace)',
                                                    fontSize: '11px'
                                                }}>{showSuccessScreen.keyword}.viewer{showSuccessScreen.version ? `.${showSuccessScreen.version}` : ''}</code>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
}

return { DataCoreSection };
```
