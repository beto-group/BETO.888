


# ViewComponent

```jsx
const { useEffect, useRef, useState, useCallback } = dc;

// --- DOM Traversal Utilities ---
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

// =================================================
// HELPER FUNCTIONS
// =================================================

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

// =================================================
// MAIN COMPONENT
// =================================================

function DatacoreImporter() {
    const uniqueWrapperClass = useRef(
        "importer-wrapper-" + Math.random().toString(36).substr(2, 9)
    ).current;

    const [components, setComponents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showVaultSelector, setShowVaultSelector] = useState(null); // null or component path
    const [isImporting, setIsImporting] = useState(false);
    const [customPath, setCustomPath] = useState("_RESOURCES/DATACORE");
    const [showSuccessScreen, setShowSuccessScreen] = useState(null); // { componentName, keyword, version, viewerCode }
    const [loadingViewer, setLoadingViewer] = useState(false);

    // Parse showcase file to get all components
    const parseShowcaseContent = useCallback((markdownContent, basePath) => {
        const lines = markdownContent.split("\n");
        const allComponents = [];
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
                currentCategory = { name: displayName, color: color };
            } else if (componentMatch && currentCategory) {
                const name = componentMatch[1];
                const path = decodeURIComponent(componentMatch[2]);
                const tagsRaw = componentMatch[3] || "";

                const hasNewTag = tagsRaw.includes("{ NEW }");
                const hasPrototypeTag = tagsRaw.includes("{ PROTOTYPE }");
                const hasFeaturedTag =
                    tagsRaw.includes("{ FEATURE }") || tagsRaw.includes("{ FEATURED }");

                allComponents.push({
                    name: name.replace(/ { ?(NEW|FEATURED?|PROTOTYPE) ?}/g, "").trim(),
                    path: `${basePath}/${path}`,
                    category: currentCategory.name,
                    categoryColor: currentCategory.color,
                    isNew: hasNewTag,
                    isPrototype: hasPrototypeTag,
                    isFeatured: hasFeaturedTag,
                });
            }
        }
        return allComponents;
    }, []);
    
    const getAvailableVaults = useCallback(() => {
        const vaults = [];
        
        if (!dc.app.vault?.adapter?.basePath) {
            return [{ name: 'Current Vault', path: '', isCurrent: true }];
        }
        
        const currentVaultPath = dc.app.vault.adapter.basePath;
        const currentVaultName = dc.app.vault.getName();
        
        try {
            // Use Electron remote API (sanctioned by Obsidian for plugins)
            if (window.require) {
                const electron = window.require('electron');
                
                if (electron.remote) {
                    const app = electron.remote.app;
                    const path = electron.remote.require('path');
                    const fs = electron.remote.require('fs');
                    
                    // userData path is already the obsidian config directory
                    // macOS: ~/Library/Application Support/obsidian
                    // Windows: %APPDATA%/obsidian
                    // Linux: ~/.config/obsidian
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
        
        // Fallback to current vault
        if (vaults.length === 0) {
            vaults.push({ 
                name: currentVaultName, 
                path: currentVaultPath, 
                isCurrent: true 
            });
        }
        
        console.log("Available vaults:", vaults);
        return vaults;
    }, []);

    // Import component to vault
    const handleImportToVault = async (componentPath, targetVault) => {
        console.log("Starting import:", { componentPath, targetVault });
        
        if (!componentPath) {
            new Notice("Component path not found", 3000);
            return;
        }

        setIsImporting(true);
        setShowVaultSelector(null);

        try {
            // componentPath might include the .md file, extract just the folder
            // e.g., "_RESOURCES/DATACORE/3 BasicView/BASIC VIEW v3.md" -> "_RESOURCES/DATACORE/3 BasicView"
            let sourcePath = componentPath;
            let componentFileName = null;
            if (componentPath.endsWith('.md')) {
                // Extract filename before removing it
                componentFileName = componentPath.substring(componentPath.lastIndexOf('/') + 1);
                // Remove the filename to get just the folder
                sourcePath = componentPath.substring(0, componentPath.lastIndexOf('/'));
            }
            
            // Extract just the folder name for destination
            const folderMatch = sourcePath.match(/(\d+\s+[^\/]+)$/);
            if (!folderMatch) {
                throw new Error("Could not determine component folder name");
            }
            const folderName = folderMatch[1];

            console.log("Source path:", sourcePath);
            console.log("Folder name:", folderName);
            console.log("Component file name:", componentFileName);

            // Check if source folder exists
            const sourceFolder = dc.app.vault.getAbstractFileByPath(sourcePath);
            if (!sourceFolder) {
                throw new Error(`Source folder not found: ${sourcePath}`);
            }

            // For current vault, just show a message
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
            console.log("Files to copy:", filesToCopy.length);

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
                    
                    console.log(`[Import] ${isBinary ? '📦 Binary' : '📄 Text'}: ${file.name}`);
                    
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
                        fs.writeFileSync(targetFilePath, Buffer.from(content));
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

            // Extract component info for success screen
            const comp = components.find(c => c.path === componentPath);
            const componentName = comp?.name || "Component";
            
            // Generate keyword from folder name (remove number prefix, emojis, curly braces, and spaces)
            const keyword = folderName
                .replace(/^\d+\s+/, '')  // Remove number prefix (e.g., "13 ")
                .replace(/\{[^}]*\}/g, '')  // Remove anything in curly braces (including emojis)
                .trim()  // Remove leading/trailing whitespace
                .toLowerCase()
                .replace(/\s+/g, '');  // Remove remaining spaces
            
            // Check if component has version (v1, v2, etc) - check both filename and folder
            let versionMatch = componentFileName ? componentFileName.match(/\sv(\d+)\.md$/i) : null;
            if (!versionMatch) {
                versionMatch = folderName.match(/\.v(\d+)$/i);
            }
            const version = versionMatch ? `v${versionMatch[1]}` : null;
            
            // Fetch the viewer codeblock
            setLoadingViewer(true);
            try {
                console.log("=== DEBUG: Starting viewer fetch ===");
                console.log("Component info:", { componentName, keyword, version, folderName });
                
                // Build the viewer file name with D.q. prefix
                const viewerFileName = version 
                    ? `D.q.${keyword}.viewer.${version}.md`
                    : `D.q.${keyword}.viewer.md`;
                
                // IMPORTANT: Use sourcePath (works for both main and local showcases)
                const viewerPath = `${sourcePath}/${viewerFileName}`;
                console.log("Looking for viewer at:", viewerPath);
                
                let viewerCode = null;
                
                // Try to find the viewer file
                const viewerFile = dc.app.vault.getAbstractFileByPath(viewerPath);
                console.log("Viewer file found?", !!viewerFile);
                
                if (viewerFile) {
                    console.log("Viewer file details:", {
                        path: viewerFile.path,
                        name: viewerFile.name,
                        extension: viewerFile.extension
                    });
                    
                    try {
                        const content = await dc.app.vault.read(viewerFile);
                        console.log("File content length:", content.length);
                        console.log("First 200 chars:", content.substring(0, 200));
                        
                        // Extract codeblock from the markdown file
                        const codeblockMatch = content.match(/```(?:datacorejsx|jsx)?\n([\s\S]*?)```/);
                        console.log("Codeblock match found?", !!codeblockMatch);
                        
                        if (codeblockMatch) {
                            viewerCode = codeblockMatch[1].trim();
                            console.log("Extracted viewer code length:", viewerCode.length);
                            console.log("First 100 chars of viewer code:", viewerCode.substring(0, 100));
                        } else {
                            console.log("No codeblock pattern matched. Trying alternative patterns...");
                            
                            // Try without language specifier
                            const altMatch = content.match(/```\n([\s\S]*?)```/);
                            if (altMatch) {
                                viewerCode = altMatch[1].trim();
                                console.log("Found code with alternative pattern, length:", viewerCode.length);
                            }
                        }
                    } catch (err) {
                        console.error("Failed to read viewer file:", err);
                    }
                } else {
                    console.log("Viewer file not found. Trying to list files in folder...");
                    
                    // Try to find what files exist in the folder - use sourcePath
                    const folder = dc.app.vault.getAbstractFileByPath(sourcePath);
                    if (folder && folder.children) {
                        console.log("Files in folder:", folder.children.map(f => f.name));
                        
                        // Look for any .viewer file
                        const viewerFiles = folder.children.filter(f => 
                            f.name.includes('.viewer') && f.extension === 'md'
                        );
                        console.log("Found viewer files:", viewerFiles.map(f => f.name));
                        
                        if (viewerFiles.length > 0) {
                            const firstViewer = viewerFiles[0];
                            console.log("Attempting to read first viewer file:", firstViewer.path);
                            
                            try {
                                const content = await dc.app.vault.read(firstViewer);
                                const codeblockMatch = content.match(/```(?:datacorejsx|jsx)?\n([\s\S]*?)```/);
                                if (codeblockMatch) {
                                    viewerCode = codeblockMatch[1].trim();
                                    console.log("Successfully extracted code from alternative viewer file");
                                }
                            } catch (err) {
                                console.error("Failed to read alternative viewer:", err);
                            }
                        }
                    }
                }
                
                console.log("=== DEBUG: Final viewer code status ===");
                console.log("Viewer code found?", !!viewerCode);
                if (viewerCode) {
                    console.log("Viewer code preview (first 200 chars):", viewerCode.substring(0, 200));
                }
                
                // Show success screen with viewer code
                setShowSuccessScreen({
                    componentName,
                    keyword,
                    version,
                    targetVault: targetVault.name,
                    viewerCode
                });
            } catch (err) {
                console.error("Failed to fetch viewer code:", err);
                // Show success screen without viewer code
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

    // Load components on mount
    useEffect(() => {
        const loadComponents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Try main showcase first
                let showcasePath = "_RESOURCES/DATACORE/DATACORE.showcase.md";
                let file = dc.app.vault.getAbstractFileByPath(showcasePath);
                let isLocalShowcase = false;
                
                // If not found, try local showcase using dc.resolvePath
                if (!file) {
                    console.log("Main showcase not found, trying local showcase...");
                    const componentPath = dc.resolvePath("D.q.datacoreimporter.component");
                    console.log("Component path from resolvePath:", componentPath);
                    
                    // Strip the filename to get just the directory
                    const componentDir = componentPath.substring(0, componentPath.lastIndexOf("/"));
                    showcasePath = componentDir + "/_resources/datacore/EXAMPLE.datacore.showcase.md";
                    
                    console.log("Looking for local showcase at:", showcasePath);
                    file = dc.app.vault.getAbstractFileByPath(showcasePath);
                    isLocalShowcase = true;
                    
                    if (!file) {
                        throw new Error("Showcase file not found. Tried:\n1. \"_RESOURCES/DATACORE/DATACORE.showcase.md\"\n2. \"" + showcasePath + "\"");
                    }
                }
                
                const basePath = showcasePath.substring(0, showcasePath.lastIndexOf("/"));
                const content = await dc.app.vault.read(file);
                const parsedComponents = parseShowcaseContent(content, basePath);
                
                // Handle local showcase: component files are in basePath, not _RESOURCES/DATACORE
                if (isLocalShowcase) {
                    // For local showcase, components are stored alongside the showcase file
                    // basePath is like: "_RESOURCES/DATACORE/53 Dashboard888/_resources/datacore"
                    // We want component paths to be: "_RESOURCES/DATACORE/53 Dashboard888/_resources/datacore/15 D3JSTest"
                    console.log("Using local showcase, components will be imported from:", basePath);
                    // Component paths are already correct from parseShowcaseContent
                } else {
                    // Main showcase: paths are already correct (_RESOURCES/DATACORE/XX ComponentName)
                    console.log("Using main showcase, components in _RESOURCES/DATACORE");
                }
                
                setComponents(parsedComponents);
                setIsLoading(false);
            } catch (e) {
                setError(e.message);
                setIsLoading(false);
            }
        };
        loadComponents();
    }, [parseShowcaseContent]);

    if (isLoading) {
        return (
            <div className={uniqueWrapperClass} style={{ padding: "40px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", color: "var(--text-muted)" }}>
                    Loading Datacore Components...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={uniqueWrapperClass} style={{ padding: "40px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", color: "var(--text-error)" }}>
                    Error: {error}
                </div>
            </div>
        );
    }

    const availableVaults = getAvailableVaults();

    return (
        <div className={uniqueWrapperClass}>
            <style>{`
                .${uniqueWrapperClass} {
                    --glow: oklch(0.8 0.2 300);
                    --glow-faint: oklch(from var(--glow) l c h / 28%);
                    --glow-med: oklch(from var(--glow) l c h / 16%);
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .${uniqueWrapperClass} .header {
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid var(--glow-faint);
                }
                .${uniqueWrapperClass} .title {
                    font-size: 32px;
                    font-weight: 900;
                    color: var(--glow);
                    margin: 0 0 10px 0;
                    font-variant: small-caps;
                }
                .${uniqueWrapperClass} .subtitle {
                    font-size: 14px;
                    color: var(--text-muted);
                    font-variant: small-caps;
                }
                .${uniqueWrapperClass} .components-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .${uniqueWrapperClass} .component-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--glow-faint);
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }
                .${uniqueWrapperClass} .component-item:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: var(--glow);
                    transform: translateX(4px);
                }
                .${uniqueWrapperClass} .component-info {
                    flex: 1;
                    min-width: 0;
                }
                .${uniqueWrapperClass} .component-name {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text-normal);
                    margin-bottom: 4px;
                }
                .${uniqueWrapperClass} .component-category {
                    font-size: 12px;
                    font-variant: small-caps;
                    letter-spacing: 0.5px;
                }
                .${uniqueWrapperClass} .component-badges {
                    display: flex;
                    gap: 8px;
                    margin-left: 12px;
                }
                .${uniqueWrapperClass} .badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .${uniqueWrapperClass} .badge-new {
                    background: var(--glow);
                    color: #0b0713;
                }
                .${uniqueWrapperClass} .badge-prototype {
                    background: oklch(0.88 0.22 288);
                    color: #0b0713;
                }
                .${uniqueWrapperClass} .badge-featured {
                    background: oklch(0.85 0.2 90);
                    color: #0b0713;
                }
                .${uniqueWrapperClass} .import-btn {
                    position: relative;
                    padding: 10px 18px;
                    background: var(--glow-med);
                    border: 1px solid var(--glow);
                    border-radius: 8px;
                    color: var(--glow);
                    font-size: 13px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    font-variant: small-caps;
                }
                .${uniqueWrapperClass} .import-btn:hover {
                    background: var(--glow);
                    color: #0b0713;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                }
                .${uniqueWrapperClass} .import-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
                .${uniqueWrapperClass} .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(8px);
                    animation: fadeIn 0.2s ease;
                }
                .${uniqueWrapperClass} .modal-panel {
                    background: rgba(18, 12, 22, 0.95);
                    border: 1px solid var(--glow);
                    border-radius: 16px;
                    width: min(90vw, 700px);
                    max-height: 85vh;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
                    animation: slideUp 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                .${uniqueWrapperClass} .modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--glow-faint);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: linear-gradient(180deg, rgba(255,255,255,0.05), transparent);
                }
                .${uniqueWrapperClass} .modal-title {
                    font-size: 20px;
                    font-weight: 900;
                    color: var(--glow);
                    margin: 0;
                    font-variant: small-caps;
                }
                .${uniqueWrapperClass} .modal-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid var(--glow);
                    background: rgba(0, 0, 0, 0.3);
                    color: var(--glow);
                    font-size: 18px;
                    cursor: pointer;
                    display: grid;
                    place-items: center;
                    transition: all 0.2s;
                }
                .${uniqueWrapperClass} .modal-close:hover {
                    background: var(--glow);
                    color: #0b0713;
                    transform: scale(1.1);
                }
                .${uniqueWrapperClass} .modal-content {
                    padding: 24px;
                    overflow-y: auto;
                    flex: 1;
                }
                .${uniqueWrapperClass} .selected-component {
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glow-faint);
                    border-radius: 12px;
                    margin-bottom: 24px;
                }
                .${uniqueWrapperClass} .selected-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-muted);
                    margin-bottom: 8px;
                    font-weight: 700;
                }
                .${uniqueWrapperClass} .selected-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-normal);
                }
                .${uniqueWrapperClass} .path-section {
                    margin-bottom: 24px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 8px;
                    border: 1px solid var(--glow-faint);
                }
                .${uniqueWrapperClass} .path-input-wrapper {
                    margin-bottom: 12px;
                }
                .${uniqueWrapperClass} .path-input {
                    width: 100%;
                    padding: 10px 12px;
                    background: var(--background-primary);
                    border: 1px solid var(--background-modifier-border);
                    border-radius: 6px;
                    color: var(--text-normal);
                    font-family: var(--font-monospace);
                    font-size: 13px;
                    box-sizing: border-box;
                }
                .${uniqueWrapperClass} .path-input:focus {
                    outline: none;
                    border-color: var(--glow);
                    box-shadow: 0 0 0 2px var(--glow-faint);
                }
                .${uniqueWrapperClass} .path-hint {
                    margin-top: 8px;
                    font-size: 12px;
                    color: var(--text-muted);
                }
                .${uniqueWrapperClass} .path-hint code {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: var(--font-monospace);
                    font-size: 11px;
                }
                .${uniqueWrapperClass} .path-presets {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .${uniqueWrapperClass} .preset-label {
                    font-size: 12px;
                    color: var(--text-muted);
                    font-weight: 600;
                }
                .${uniqueWrapperClass} .preset-btn {
                    padding: 6px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--background-modifier-border);
                    border-radius: 4px;
                    color: var(--text-normal);
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .${uniqueWrapperClass} .preset-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--glow);
                }
                .${uniqueWrapperClass} .vault-section {
                    margin-bottom: 24px;
                }
                .${uniqueWrapperClass} .section-title {
                    font-size: 14px;
                    font-weight: 800;
                    color: var(--text-normal);
                    margin: 0 0 16px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-variant: small-caps;
                }
                .${uniqueWrapperClass} .vault-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                }
                .${uniqueWrapperClass} .vault-card {
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 2px solid var(--glow-faint);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                    position: relative;
                }
                .${uniqueWrapperClass} .vault-card:hover:not(.current) {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: var(--glow);
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                }
                .${uniqueWrapperClass} .vault-card.current {
                    opacity: 0.5;
                    cursor: not-allowed;
                    border-style: dashed;
                }
                .${uniqueWrapperClass} .vault-icon {
                    font-size: 32px;
                    margin-bottom: 12px;
                }
                .${uniqueWrapperClass} .vault-card-name {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text-normal);
                    margin-bottom: 8px;
                }
                .${uniqueWrapperClass} .current-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    background: var(--glow-med);
                    border: 1px solid var(--glow);
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    color: var(--glow);
                    margin-bottom: 8px;
                }
                .${uniqueWrapperClass} .vault-card-path {
                    font-size: 11px;
                    color: var(--text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .${uniqueWrapperClass} .modal-info {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--glow-faint);
                    border-radius: 12px;
                    align-items: flex-start;
                }
                .${uniqueWrapperClass} .info-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .${uniqueWrapperClass} .info-text {
                    font-size: 13px;
                    color: var(--text-muted);
                    line-height: 1.6;
                }
                .${uniqueWrapperClass} .info-text code {
                    padding: 2px 6px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                    font-size: 12px;
                    color: var(--glow);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

            <div className="header">
                <h1 className="title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <dc.Icon icon="package" style={{ fontSize: "32px" }} />
                    Datacore Component Importer
                </h1>
                <p className="subtitle">
                    Import datacore components to other vaults • {components.length} components available
                </p>
            </div>

            <div className="components-list">
                {components.map((comp, index) => (
                    <div key={index} className="component-item">
                        <div className="component-info">
                            <div className="component-name">{comp.name}</div>
                            <div 
                                className="component-category" 
                                style={{ color: comp.categoryColor }}
                            >
                                {comp.category}
                            </div>
                        </div>
                        <div className="component-badges">
                            {comp.isNew && <span className="badge badge-new">New</span>}
                            {comp.isPrototype && <span className="badge badge-prototype">Prototype</span>}
                            {comp.isFeatured && <span className="badge badge-featured">Featured</span>}
                        </div>
                        <button
                            className="import-btn"
                            onClick={() => {
                                console.log("Import button clicked for:", comp.path);
                                setShowVaultSelector(comp.path);
                            }}
                            disabled={isImporting}
                            style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            {isImporting ? (
                                <>
                                    <dc.Icon icon="loader-2" style={{ animation: "spin 1s linear infinite" }} />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <dc.Icon icon="package" />
                                    Import to Vault
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Import Modal */}
            {showVaultSelector && (
                <div 
                    className="modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowVaultSelector(null);
                        }
                    }}
                >
                    <div className="modal-panel">
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <dc.Icon icon="package" style={{ fontSize: "20px" }} />
                                Import Component to Vault
                            </h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowVaultSelector(null)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            <div className="selected-component">
                                <div className="selected-label">Selected Component:</div>
                                <div className="selected-name">
                                    {components.find(c => c.path === showVaultSelector)?.name}
                                </div>
                            </div>

                            <div className="path-section">
                                <h3 className="section-title">Target Path</h3>
                                <div className="path-input-wrapper">
                                    <input
                                        type="text"
                                        className="path-input"
                                        value={customPath}
                                        onChange={(e) => setCustomPath(e.target.value)}
                                        placeholder="e.g., _RESOURCES/DATACORE"
                                    />
                                    <div className="path-hint">
                                        Component will be imported to: <code>{customPath}/[ComponentFolder]</code>
                                    </div>
                                </div>
                                <div className="path-presets">
                                    <span className="preset-label">Quick presets:</span>
                                    <button className="preset-btn" onClick={() => setCustomPath("_RESOURCES/DATACORE")}>
                                        Default
                                    </button>
                                    <button className="preset-btn" onClick={() => setCustomPath("Components")}>
                                        Components
                                    </button>
                                    <button className="preset-btn" onClick={() => setCustomPath("Plugins")}>
                                        Plugins
                                    </button>
                                    <button className="preset-btn" onClick={() => setCustomPath("")}>
                                        Root
                                    </button>
                                </div>
                            </div>

                            <div className="vault-section">
                                <h3 className="section-title">Select Target Vault</h3>
                                <div className="vault-grid">
                                    {availableVaults.map((vault, vIndex) => (
                                        <div
                                            key={vIndex}
                                            className={`vault-card ${vault.isCurrent ? 'current' : ''}`}
                                            onClick={() => {
                                                if (!vault.isCurrent) {
                                                    console.log("Vault selected:", vault);
                                                    handleImportToVault(showVaultSelector, vault);
                                                }
                                            }}
                                        >
                                            <div className="vault-icon">
                                                <dc.Icon icon={vault.isCurrent ? "map-pin" : "folder"} />
                                            </div>
                                            <div className="vault-card-name">
                                                {vault.name}
                                            </div>
                                            {vault.isCurrent && (
                                                <div className="current-badge">Current Vault</div>
                                            )}
                                            <div className="vault-card-path">{vault.path}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-info">
                                <div className="info-icon">
                                    <dc.Icon icon="info" style={{ fontSize: "20px" }} />
                                </div>
                                <div className="info-text">
                                    The component folder and all its files will be copied to the target vault. 
                                    Customize the path above to choose the import location. Existing files will be skipped.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal with Viewer Code */}
            {showSuccessScreen && (
                <div 
                    className="modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowSuccessScreen(null);
                        }
                    }}
                >
                    <div className="modal-panel">
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <dc.Icon icon="check-circle" style={{ fontSize: "20px" }} />
                                Import Successful!
                            </h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowSuccessScreen(null)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            <div className="selected-component">
                                <div className="selected-label">Component Imported:</div>
                                <div className="selected-name">
                                    {showSuccessScreen.componentName} → {showSuccessScreen.targetVault}
                                </div>
                            </div>

                            <div style={{ marginBottom: "24px" }}>
                                <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <dc.Icon icon="code" style={{ fontSize: "16px" }} />
                                    {showSuccessScreen.viewerCode ? 'Viewer Code' : 'How to Use This Component'}
                                </h3>
                                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
                                    {showSuccessScreen.viewerCode 
                                        ? `Copy this viewer code to use the ${showSuccessScreen.componentName} component in ${showSuccessScreen.targetVault}:`
                                        : `Use this query to find the component in ${showSuccessScreen.targetVault}:`
                                    }
                                </p>
                                <div style={{
                                    background: "rgba(0, 0, 0, 0.4)",
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--glow-faint)",
                                    fontFamily: "var(--font-monospace)",
                                    fontSize: "12px",
                                    overflowX: "auto",
                                    position: "relative"
                                }}>
                                    <button
                                        onClick={() => {
                                            let code;
                                            if (showSuccessScreen.viewerCode) {
                                                // Wrap viewer code with codeblock markers
                                                code = "```datacorejsx\n" + showSuccessScreen.viewerCode + "\n```";
                                            } else {
                                                // Just copy the query without wrapping
                                                code = "@codeblock AND $file.contains(\"" + showSuccessScreen.keyword + ".viewer" + (showSuccessScreen.version ? "." + showSuccessScreen.version : "") + "\")";
                                            }
                                            navigator.clipboard.writeText(code);
                                            new Notice("Code copied to clipboard!", 2000);
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: "12px",
                                            right: "12px",
                                            padding: "6px 12px",
                                            background: "var(--glow)",
                                            border: "none",
                                            borderRadius: "4px",
                                            color: "#0b0713",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            transition: "transform 0.1s"
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"} 
                                    >
                                        <dc.Icon icon="clipboard" style={{ fontSize: "12px", marginRight: "6px" }} />
                                        Copy
                                    </button>
                                    <pre style={{ 
                                        margin: 0, 
                                        color: "var(--text-normal)",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word"
                                    }}>
{showSuccessScreen.viewerCode || ("Query to find viewer:\n@codeblock AND $file.contains(\"" + showSuccessScreen.keyword + ".viewer" + (showSuccessScreen.version ? "." + showSuccessScreen.version : "") + "\")")}</pre>
                                </div>
                            </div>

                            <div className="modal-info">
                                <div className="info-icon">
                                    <dc.Icon icon="lightbulb" style={{ fontSize: "20px" }} />
                                </div>
                                <div className="info-text">
                                    {showSuccessScreen.viewerCode ? (
                                        <>
                                            <strong>How to use this viewer:</strong><br/>
                                            {"• Copy the code above into a "}
                                            <code>```datacorejsx</code>
                                            {" codeblock in any markdown file"}<br/>
                                            {"• The viewer will automatically render the " + showSuccessScreen.componentName + " component"}<br/>
                                            {"• Component: "}
                                            <code>{showSuccessScreen.keyword + (showSuccessScreen.version ? "." + showSuccessScreen.version : "")}</code>
                                        </>
                                    ) : (
                                        <>
                                            <strong>Component details:</strong><br/>
                                            {"• Keyword: "}<code>{showSuccessScreen.keyword}</code><br/>
                                            {"• Version: "}<code>{showSuccessScreen.version || "latest"}</code><br/>
                                            {"• Use the query above to locate the viewer file"}<br/>
                                            {"• Look for files matching "}
                                            <code>{showSuccessScreen.keyword + ".viewer" + (showSuccessScreen.version ? "." + showSuccessScreen.version : "")}</code>
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

// =================================================================================
//  FULL TAB WRAPPER
// =================================================================================
function DatacoreImporterWithFullTab() {
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        
        const targetPaneContent = findNearestAncestorWithClass(
            container,
            "workspace-leaf-content"
        );
        
        if (!targetPaneContent) {
            setIsFullTab(false);
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
            zIndex: "99999",
            overflow: "auto",
            backgroundColor: "var(--background-primary)",
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
    }, [isFullTab]);

    if (!isFullTab) {
        return (
            <div ref={containerRef} style={{
                padding: "16px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                border: "1px dashed var(--background-modifier-border)",
                borderRadius: "8px",
                backgroundColor: "var(--background-primary-alt)",
            }}>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <dc.Icon icon="package" />
                    Datacore Importer is in compact mode.
                </p>
                <button 
                    onClick={() => setIsFullTab(true)}
                    style={{
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "var(--text-on-accent)",
                        backgroundColor: "var(--interactive-accent)",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Enter Full Tab
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef}>
            <DatacoreImporter />
        </div>
    );
}

return { ViewComponent: DatacoreImporterWithFullTab };
```
