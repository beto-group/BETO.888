## VaultUpdater

```jsx
const { useEffect, useRef, useState, useCallback } = dc;

// =================================================================================
// --- CONSTANTS & HELPERS ---
// =================================================================================

const GITHUB_OWNER = 'beto-group';
const GITHUB_REPO = 'BETO.888';
const LOG_PREFIX = '[VaultUpdater]';
const UPDATE_FILENAME = 'CHANGE LOG.md';
const MANIFEST_FILENAME = '.datacore/update-manifest.json';
const UPDATER_SETTINGS_FILE = '.datacore/updater-settings.json';
const BINARY_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov', 'pdf', 'woff', 'woff2', 'ttf', 'otf']);

const ICONS = {
    BELL: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <defs>
        <style>
            @keyframes bell-swing { 0%, 100% { transform: rotate(0); } 10%, 30%, 50%, 70%, 90% { transform: rotate(14deg); } 20%, 40%, 60%, 80% { transform: rotate(-14deg); } }
            @keyframes clapper-move { 0%, 100% { transform: rotate(0); } 10%, 30%, 50%, 70%, 90% { transform: rotate(10deg); } 20%, 40%, 60%, 80% { transform: rotate(-10deg); } }
            @keyframes pulse-glow { 0% { transform: scale(0.8); opacity: 0; } 50% { opacity: 0.3; } 100% { transform: scale(1.4); opacity: 0; } }
        </style>
    </defs>
    <circle class="pulse-circle" cx="12" cy="12" r="10" fill="var(--interactive-accent)" opacity="0" style="transform-origin: center;"/>
    <g class="bell-body"><path class="svg-elem-1" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path class="clapper svg-elem-2" d="M13.73 21a2 2 0 0 1-3.46 0"></path></g>
</svg>`,
    HEART: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    KOFI: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.584 6.334C22.259 5.864 21.706 5.633 21.119 5.633H5.733C5.146 5.633 4.593 5.864 4.268 6.334C3.618 7.274 4.076 8.124 4.076 8.124L5.617 13.337C6.014 14.577 7.158 15.367 8.449 15.367H15.62C16.911 15.367 18.055 14.577 18.452 13.337L20 8.124C20 8.124 20.458 7.274 19.808 6.334H22.584zM7.525 16.5C6.865 16.5 6.33 17.035 6.33 17.695V19.06C6.33 19.72 6.865 20.255 7.525 20.255H16.545C17.205 20.255 17.74 19.72 17.74 19.06V17.695C17.74 17.035 17.205 16.5 16.545 16.5H7.525z"></path></svg>`,
    CHECKLIST: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h10M8 12h10M8 18h10M4 6h.01M4 12h.01M4 18h.01"/></svg>`,
    X_CLOSE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

function compareSemVer(a, b) {
    // Normalize both versions
    const normalize = (v) => {
        if (!v) return '0.0.0';
        return v.toString().trim().replace(/^["']|["']$/g, '').split('.').map(x => parseInt(x, 10) || 0);
    };
    const partsA = normalize(a);
    const partsB = normalize(b);
    const len = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < len; i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA > numB) return 1;
        if (numA < numB) return -1;
    }
    return 0;
}

function parseVersionFromYaml(markdownContent) { 
    if (!markdownContent) return null; 
    const yamlMatch = markdownContent.match(/^---\s*([\s\S]*?)\s*---/); 
    if (!yamlMatch) return null; 
    const yaml = yamlMatch[1]; 
    const versionMatch = yaml.match(/^version:\s*["']?(.+?)["']?\s*$/m); 
    if (!versionMatch) return null;
    let version = versionMatch[1].trim();
    // Remove any remaining quotes
    version = version.replace(/^["']|["']$/g, '');
    return version;
}

function parseLatestChangelogEntry(markdownContent) { 
    if (!markdownContent) return null; 
    try { 
        const footerMarker = '>[!example]- GENERAL INFO'; 
        const footerIndex = markdownContent.indexOf(footerMarker); 
        let content = footerIndex !== -1 ? markdownContent.substring(0, footerIndex) : markdownContent; 
        const firstEntryIndex = content.search(/^## [A-Z]+-\d+/m); 
        if (firstEntryIndex === -1) return null; 
        content = content.substring(firstEntryIndex); 
        const entries = content.split(/\n----\n/); 
        return entries[0].trim(); 
    } catch (error) { 
        console.error(`${LOG_PREFIX} Failed to parse changelog:`, error); 
        return "Could not parse changelog. Please check the `CHANGE LOG.md` file."; 
    } 
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// =================================================================================
// --- SUB-COMPONENTS ---
// =================================================================================

const AnimatedIcon = ({ svgString, isActive, isInView }) => { 
    const iconRef = useRef(null); 
    const [hasRevealed, setHasRevealed] = useState(false); 
    const DURATION = 1.0; 
    
    useEffect(() => { 
        const container = iconRef.current; 
        if (!container || !svgString) return; 
        const uniqueClass = "animated-icon-" + Math.random().toString(36).substr(2, 9); 
        container.classList.add(uniqueClass); 
        container.innerHTML = svgString; 
        const svgElement = container.querySelector('svg'); 
        if (!svgElement) return; 
        
        const paths = svgElement.querySelectorAll('[class*="svg-elem-"]'); 
        paths.forEach((path, index) => { 
            const delay = 0.1 * index; 
            const length = path.getTotalLength(); 
            if (length > 0) { 
                path.style.strokeDasharray = length; 
                path.style.strokeDashoffset = length; 
                path.style.stroke = 'var(--text-normal)'; 
                path.style.strokeWidth = '1.5px'; 
                path.style.fill = 'transparent'; 
                path.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay + (DURATION * 0.2)}s`; 
            } 
        }); 
        
        const styleSheet = document.createElement("style"); 
        styleSheet.innerText = `.${uniqueClass} .bell-body { transform-origin: top center; } .${uniqueClass} .clapper { transform-origin: top center; } .${uniqueClass}.is-active .bell-body { animation: bell-swing 2.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; } .${uniqueClass}.is-active .clapper { animation: clapper-move 2.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; animation-delay: -0.1s; } .${uniqueClass}.is-active .pulse-circle { animation: pulse-glow 2.5s ease-out infinite; }`; 
        svgElement.appendChild(styleSheet); 
    }, [svgString]); 
    
    useEffect(() => { 
        if (isInView && !hasRevealed) { 
            const container = iconRef.current; 
            if (!container) return; 
            const paths = container.querySelectorAll('[class*="svg-elem-"]'); 
            if (paths.length === 0) return; 
            const maxDelay = 0.1 * (paths.length - 1); 
            const totalRevealTime = (DURATION + maxDelay) * 1000; 
            paths.forEach(path => { 
                path.style.strokeDashoffset = '0'; 
                path.style.fill = 'var(--interactive-accent-tint)'; 
            }); 
            setTimeout(() => setHasRevealed(true), totalRevealTime); 
        } 
    }, [isInView, hasRevealed]); 
    
    useEffect(() => { 
        const container = iconRef.current; 
        if (!container) return; 
        if (isActive && hasRevealed) { 
            container.classList.add('is-active'); 
        } else { 
            container.classList.remove('is-active'); 
        } 
    }, [isActive, hasRevealed]); 
    
    return <div ref={iconRef} style={{ width: '100%', height: '100%' }} />; 
};

// =================================================================================
// --- UPDATE LOGIC CORE ---
// =================================================================================

async function checkForUpdates(branch) { 
    try { 
        const remoteUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${branch}/${encodeURIComponent(UPDATE_FILENAME)}?cache-bust=${new Date().getTime()}`; 
        const response = await requestUrl({ url: remoteUrl, method: 'GET' }); 
        if (response.status !== 200) { throw new Error(`Failed to fetch ${UPDATE_FILENAME}. Status: ${response.status}`); } 
        const remoteContent = response.text; 
        const remoteVersion = parseVersionFromYaml(remoteContent); 
        if (!remoteVersion) throw new Error(`Could not find version in remote ${UPDATE_FILENAME}`); 
        let localVersion = '0.0.0'; 
        const localFile = dc.app.vault.getAbstractFileByPath(UPDATE_FILENAME); 
        if (localFile) { 
            const localContent = await dc.app.vault.read(localFile); 
            localVersion = parseVersionFromYaml(localContent) || '0.0.0'; 
        } 
        const comparison = compareSemVer(remoteVersion, localVersion);
        const updateAvailable = comparison > 0;
        let manifest = null; 
        if (updateAvailable) { 
            try { 
                const manifestUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${branch}/${MANIFEST_FILENAME}?cache-bust=${new Date().getTime()}`; 
                const manifestResponse = await requestUrl({ url: manifestUrl, method: 'GET' }); 
                if (manifestResponse.status === 200) { manifest = manifestResponse.json; } 
            } catch (e) { } 
        } 
        return { updateAvailable, remoteVersion, localVersion, remoteContent, manifest }; 
    } catch (error) { 
        console.error(`${LOG_PREFIX} Error during update check:`, error); 
        return { updateAvailable: false, remoteVersion: 'unknown', localVersion: 'unknown', remoteContent: null, manifest: null }; 
    } 
}

async function downloadLatestFromRepo(branch, onProgress, getIsCancelled) { 
    const treeUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${branch}?recursive=1&cache-bust=${new Date().getTime()}`; 
    let treeData; 
    try { 
        const treeResponse = await requestUrl({ url: treeUrl, method: 'GET' }); 
        if (treeResponse.status !== 200) throw new Error(`Failed to fetch file tree. Status: ${treeResponse.status}`); 
        treeData = treeResponse.json; 
        if (!treeData || !treeData.tree) throw new Error("Invalid tree data from GitHub API."); 
    } catch (e) { 
        console.error(`${LOG_PREFIX} Failed to fetch repo file tree.`, e); 
        throw new Error("Could not retrieve file list from repository."); 
    } 
    const filesToDownload = treeData.tree.filter(item => item.type === 'blob'); 
    const totalFiles = filesToDownload.length; 
    if (onProgress) onProgress({ current: 0, total: totalFiles, status: 'Starting download...' }); 
    const downloadedFiles = []; 
    const BATCH_SIZE = 10; 
    let downloadedCount = 0; 
    for (let i = 0; i < totalFiles; i += BATCH_SIZE) { 
        if (getIsCancelled && getIsCancelled()) return null; 
        const batch = filesToDownload.slice(i, i + BATCH_SIZE); 
        const batchPromises = batch.map(async (file) => { 
            try { 
                const encodedPath = file.path.split('/').map(encodeURIComponent).join('/'); 
                const contentUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${branch}/${encodedPath}?cache-bust=${new Date().getTime()}`; 
                const extension = file.path.split('.').pop().toLowerCase(); 
                const isBinary = BINARY_EXTENSIONS.has(extension); 
                const contentResponse = await requestUrl({ url: contentUrl, method: 'GET' }); 
                if (contentResponse.status !== 200) return null; 
                const content = isBinary ? contentResponse.arrayBuffer : contentResponse.text; 
                return { path: file.path, content, isBinary }; 
            } catch (error) { return null; } 
            finally { 
                downloadedCount++; 
                if (onProgress) onProgress({ current: downloadedCount, total: totalFiles, status: `Downloading...` }); 
            } 
        }); 
        const results = (await Promise.all(batchPromises)).filter(Boolean); 
        downloadedFiles.push(...results); 
    } 
    return downloadedFiles; 
}

async function downloadTargetedFiles(branch, filePaths, onProgress, getIsCancelled) { 
    if (!filePaths || filePaths.length === 0) return []; 
    const totalFiles = filePaths.length; 
    if (onProgress) onProgress({ current: 0, total: totalFiles, status: 'Starting targeted download...' }); 
    const downloadedFiles = []; 
    const BATCH_SIZE = 10; 
    let downloadedCount = 0; 
    for (let i = 0; i < totalFiles; i += BATCH_SIZE) { 
        if (getIsCancelled && getIsCancelled()) return null; 
        const batch = filePaths.slice(i, i + BATCH_SIZE); 
        const batchPromises = batch.map(async (path) => { 
            try { 
                const encodedPath = path.split('/').map(encodeURIComponent).join('/'); 
                const contentUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${branch}/${encodedPath}?cache-bust=${new Date().getTime()}`; 
                const extension = path.split('.').pop().toLowerCase(); 
                const isBinary = BINARY_EXTENSIONS.has(extension); 
                const contentResponse = await requestUrl({ url: contentUrl, method: 'GET' }); 
                if (contentResponse.status !== 200) return null; 
                const content = isBinary ? contentResponse.arrayBuffer : contentResponse.text; 
                return { path, content, isBinary }; 
            } catch (error) { return null; } 
            finally { 
                downloadedCount++; 
                if (onProgress) onProgress({ current: downloadedCount, total: totalFiles, status: `Downloading...` }); 
            } 
        }); 
        const results = (await Promise.all(batchPromises)).filter(Boolean); 
        downloadedFiles.push(...results); 
    } 
    return downloadedFiles; 
}

async function getCurrentVaultState(trackedFilePaths) { 
    const vaultFiles = []; 
    for (const path of trackedFilePaths) { 
        try { 
            const extension = path.split('.').pop().toLowerCase(); 
            const isBinary = BINARY_EXTENSIONS.has(extension); 
            const content = isBinary ? await dc.app.vault.adapter.readBinary(path) : await dc.app.vault.adapter.read(path); 
            vaultFiles.push({ path, content, isBinary }); 
        } catch (error) { } 
    } 
    return vaultFiles; 
}

function compareVersions(latestFiles, currentFiles) { 
    const latestFileMap = new Map(latestFiles.map(f => [f.path, f])); 
    const currentFileMap = new Map(currentFiles.map(f => [f.path, f])); 
    const newFiles = []; const updatedFiles = []; const deletedFiles = []; 
    for (const [path, latestFile] of latestFileMap.entries()) { 
        if (!currentFileMap.has(path)) { newFiles.push(latestFile); } 
        else { 
            const currentFile = currentFileMap.get(path); 
            if (currentFile.content !== latestFile.content) { updatedFiles.push(latestFile); } 
        } 
    } 
    for (const [path, currentFile] of currentFileMap.entries()) { 
        if (!latestFileMap.has(path)) { deletedFiles.push(currentFile); } 
    } 
    return { newFiles, updatedFiles, deletedFiles }; 
}

// =================================================================================
// --- UPDATE INDICATOR COMPONENT (Toolbar Icon & Modal Controller) ---
// =================================================================================

const UpdateIndicator = ({ setIsModalOpen, hideButton, variant = "icon", externalOpen, setExternalOpen }) => {
    const [updateStatus, setUpdateStatus] = useState({ available: false, checking: true, version: null });
    const [isUpdateHovered, setIsUpdateHovered] = useState(false);
    const [isUpdateUIOpenInternal, setIsUpdateUIOpenInternal] = useState(false);

    // Sync with external state if provided
    const isUpdateUIOpen = externalOpen !== undefined ? externalOpen : isUpdateUIOpenInternal;
    const setIsUpdateUIOpen = setExternalOpen !== undefined ? setExternalOpen : setIsUpdateUIOpenInternal;

    useEffect(() => {
        if (setIsModalOpen) {
            setIsModalOpen(isUpdateUIOpen);
        }
    }, [isUpdateUIOpen, setIsModalOpen]);

    useEffect(() => {
        const runCheck = async () => {
            const result = await checkForUpdates('main');
            setUpdateStatus({ available: result.updateAvailable, checking: false, version: result.remoteVersion });
        };
        runCheck();
    }, []);

    const renderUpdateModal = () => (
        <div 
            style={{ 
                position: 'fixed', 
                inset: 0, 
                zIndex: 100000, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: 'clamp(16px, 3vw, 32px)',
                backdropFilter: 'blur(20px) saturate(1.4)',
                background: 'rgba(0,0,0,.85)',
                animation: 'nf-fadeIn .35s cubic-bezier(.25,1,.5,1)',
                pointerEvents: 'auto'
            }} 
            onClick={(e) => { e.stopPropagation(); setIsUpdateUIOpen(false); }}
        >
            <div 
                style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    width: 'min(96vw, 800px)', 
                    height: 'min(90vh, 700px)', 
                    position: 'relative', 
                    background: 'linear-gradient(135deg, rgb(15,15,20) 0, rgb(5,2,8) 50%, rgb(15,15,20) 100%)', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    overflow: 'hidden', 
                    boxShadow: '0 30px 120px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.05)',
                    animation: 'nf-scaleIn .35s cubic-bezier(.25,1,.5,1)'
                }} 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={() => setIsUpdateUIOpen(false)} 
                    style={{ 
                        position: 'absolute', 
                        top: '14px', 
                        right: '18px', 
                        border: 'none', 
                        background: 'rgba(255,255,255,0.05)', 
                        color: 'rgba(255,255,255,0.6)', 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        cursor: 'pointer', 
                        display: 'grid', 
                        placeItems: 'center', 
                        zIndex: 15, 
                        transition: 'all .2s' 
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                    <UpdateManager onReloadRequest={() => window.location.reload()} />
                </div>
            </div>
        </div>
    );

    if (variant === "modal-only") {
        return isUpdateUIOpen ? renderUpdateModal() : null;
    }

    if (updateStatus.checking && variant === "icon") return null;

    if (variant === "menu-item") {
        return (
            <div 
                onClick={() => setIsUpdateUIOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                }}
                className="menu-item"
            >
                <div style={{ color: updateStatus.available ? 'var(--interactive-accent)' : 'var(--text-muted)', position: 'relative' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {updateStatus.available && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', background: 'var(--interactive-accent)', borderRadius: '50%', boxShadow: '0 0 8px var(--interactive-accent)', animation: 'pulse-dot 1.5s infinite' }} />}
                </div>
                <span style={{ fontSize: '12px' }}>
                    {updateStatus.checking ? 'Checking Updates...' : updateStatus.available ? 'UPDATE AVAILABLE' : 'SYSTEM UP-TO-DATE'}
                </span>
                
                {isUpdateUIOpen && renderUpdateModal()}
            </div>
        );
    }

    const shouldShowButton = !hideButton || isUpdateUIOpen;

    return (
        <>
            {shouldShowButton && (
                <button
                    title="System Update"
                    onClick={() => setIsUpdateUIOpen(true)}
                    onMouseEnter={() => setIsUpdateHovered(true)}
                    onMouseLeave={() => setIsUpdateHovered(false)}
                    style={{
                        background: 'rgba(var(--background-primary-rgb), 0.6)',
                        border: updateStatus.available ? '1px solid var(--interactive-accent)' : '1px solid var(--glow-faint)',
                        color: updateStatus.available ? 'var(--interactive-accent)' : 'var(--text-muted)',
                        borderRadius: '8px',
                        padding: '6px',
                        width: isUpdateHovered ? '140px' : '36px',
                        height: '36px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontVariant: 'small-caps',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        boxShadow: updateStatus.available ? '0 0 15px rgba(150, 100, 255, 0.3)' : 'none'
                    }}
                >
                    <div style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        {updateStatus.available && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', background: 'var(--interactive-accent)', borderRadius: '50%', boxShadow: '0 0 8px var(--interactive-accent)', animation: 'pulse-dot 1.5s infinite' }} />}
                    </div>
                    {isUpdateHovered && (
                        <span>{updateStatus.available ? `New Update Available` : 'System Up-to-date'}</span>
                    )}
                </button>
            )}

            {isUpdateUIOpen && renderUpdateModal()}

            <style>{`
                @keyframes pulse-dot { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
                @keyframes nf-fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes nf-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </>
    );
};

// =================================================================================
// --- UPDATE MANAGER VIEW (The Main Updater Interface) ---
// =================================================================================

function UpdateManager({ onReloadRequest, autoOpen = false, ...props }) {
    const uniqueWrapperClass = "updater-view-" + useRef(Math.random().toString(36).substr(2, 9)).current;
    const DEFAULT_DEV_BRANCH = 'main';

    const SimpleMarkdownParser = ({ text }) => { 
        if (!text) return null; 
        const markdownStyles = { h3: { fontSize: '1.1em', fontWeight: 600, color: 'var(--text-normal)', marginTop: '15px', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid var(--background-modifier-border)', fontVariant: 'small-caps' }, p: { margin: '0 0 8px 0', lineHeight: '1.5', fontVariant: 'small-caps' }, ul: { margin: '0 0 10px 0', paddingLeft: '20px', listStyleType: 'disc' }, li: { marginBottom: '4px', fontVariant: 'small-caps' }, code: { backgroundColor: 'var(--background-modifier-hover)', borderRadius: '4px', padding: '2px 5px', fontSize: '0.9em', fontFamily: 'var(--font-monospace, monospace)', color: 'var(--text-muted)' } }; 
        const renderLine = (line) => { const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g); return parts.map((part, index) => { if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>; if (part.startsWith('`') && part.endsWith('`')) return <code key={index} style={markdownStyles.code}>{part.slice(1, -1)}</code>; return part; }); }; 
        const elements = []; let listItems = []; 
        const flushList = (key) => { if (listItems.length > 0) { elements.push(<ul key={key} style={markdownStyles.ul}>{listItems}</ul>); listItems = []; } }; 
        text.split('\n').forEach((line, index) => { if (line.startsWith('## ')) { flushList(`ul-${index}`); elements.push(<h3 key={index} style={markdownStyles.h3}>{line.substring(3)}</h3>); } else if (line.startsWith('- ') || line.startsWith('* ')) { listItems.push(<li key={index} style={markdownStyles.li}>{renderLine(line.substring(2))}</li>); } else { flushList(`ul-${index}`); if (line.trim() !== '') elements.push(<p key={index} style={markdownStyles.p}>{renderLine(line)}</p>); } }); 
        flushList('ul-last'); return <>{elements}</>; 
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStage, setModalStage] = useState('checking');
    const [updateStatus, setUpdateStatus] = useState('idle');
    const [updateResult, setUpdateResult] = useState(null);
    const [updateCheck, setUpdateCheck] = useState({ status: 'checking', info: null });
    const [latestChangelog, setLatestChangelog] = useState('');
    const [isChangelogVisible, setIsChangelogVisible] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, status: '' });
    const [selectedBranch, setSelectedBranch] = useState(DEFAULT_DEV_BRANCH);
    const isUpdateCancelled = useRef(false);

    useEffect(() => {
        async function init() {
            const result = await checkForUpdates(selectedBranch);
            setUpdateCheck({ status: 'checked', info: result });
            if (result.remoteContent) setLatestChangelog(parseLatestChangelogEntry(result.remoteContent) || "");
            // Set modal stage based on update availability, regardless of autoOpen
            const targetStage = result.updateAvailable ? 'confirmation' : 'support';
            if (autoOpen) { setModalStage(targetStage); setIsModalOpen(true); }
            else { setModalStage(targetStage); } // Always set the correct stage for manual opens
        }
        init();
    }, [selectedBranch]);

    const handleStartUpdate = async () => { 
        const { manifest, remoteVersion, localVersion } = updateCheck.info; 
        if (manifest && manifest.version !== remoteVersion) { setModalStage('manifest_mismatch'); return; } 
        if (manifest && manifest.fromVersion === localVersion) { 
            setModalStage('bet'); await sleep(1000); setModalStage('processing'); 
            try {
                isUpdateCancelled.current = false; setUpdateStatus('downloading');
                const filesToDownload = [...(manifest.added || []), ...(manifest.modified || [])];
                const downloadedFiles = await downloadTargetedFiles(selectedBranch, filesToDownload, setDownloadProgress, () => isUpdateCancelled.current);
                if (!downloadedFiles) return;
                setUpdateStatus('comparing');
                const currentFiles = await getCurrentVaultState([...(manifest.modified || []), ...(manifest.deleted || [])]);
                const results = { newFiles: downloadedFiles.filter(df => manifest.added.includes(df.path)), updatedFiles: downloadedFiles.filter(df => manifest.modified.includes(df.path)), deletedFiles: (manifest.deleted || []).map(path => ({ path })) };
                await applyChanges(results);
            } catch (e) { console.error(e); setUpdateStatus('error'); }
        } else { setModalStage('full_update_required'); } 
    };

    const handleStartFullUpdate = async () => {
        setModalStage('bet'); await sleep(1000); setModalStage('processing');
        try {
            isUpdateCancelled.current = false; setUpdateStatus('downloading');
            const latestFiles = await downloadLatestFromRepo(selectedBranch, setDownloadProgress, () => isUpdateCancelled.current);
            if (!latestFiles) return;
            setUpdateStatus('comparing');
            const currentFiles = await getCurrentVaultState([...new Set([...latestFiles.map(f => f.path), ...dc.app.vault.getFiles().map(f => f.path)])]);
            const results = compareVersions(latestFiles, currentFiles);
            await applyChanges(results, currentFiles);
        } catch (e) { console.error(e); setUpdateStatus('error'); }
    };

    const applyChanges = async (results, currentFiles = []) => {
        setUpdateStatus('writing');
        const allFilesToWrite = [...results.newFiles, ...results.updatedFiles];
        for (const file of allFilesToWrite) {
            const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
            if (parentDir && !(await dc.app.vault.adapter.exists(parentDir))) await dc.app.vault.createFolder(parentDir);
            if (file.isBinary) await dc.app.vault.adapter.writeBinary(file.path, file.content);
            else await dc.app.vault.adapter.write(file.path, file.content);
        }
        setUpdateResult({ ...results, changelogEntry: latestChangelog, currentFiles });
        setUpdateStatus('success'); setModalStage('results');
    };

    const openExternal = (url) => { 
        // Obsidian-compatible external link opening
        try {
            // Use Obsidian's shell API for external opening
            const electron = require('electron');
            electron.shell.openExternal(url);
        } catch (e) {
            // Fallback for web/other contexts
            try {
                require('open')(url);
            } catch (e2) {
                window.open(url, '_blank');
            }
        }
    };

    const renderContent = () => {
        if (updateCheck.status === 'checking') return <div style={{ textAlign: 'center', padding: '40px' }}><p className="headline">Scanning Repository...</p></div>;
        const info = updateCheck.info;

        switch (modalStage) {
            case 'confirmation': return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <h3 className="headline">Update v{info.remoteVersion} Available</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You are currently on v{info.localVersion}</p>
                    <div style={{ width: '100%', maxHeight: '300px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                        <SimpleMarkdownParser text={latestChangelog} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="secondary-button" onClick={() => onReloadRequest?.()}>Cancel</button>
                        <button className="primary-button" onClick={handleStartUpdate}>Update Now</button>
                    </div>
                </div>
            );
            case 'bet': return <div className="bet-reveal"><h1>BET 🫡</h1></div>;
            case 'processing': return (
                <div style={{ textAlign: 'center' }}>
                    <h3 className="headline">Installing Core Modules...</h3>
                    <div style={{ width: '300px', height: '10px', background: 'var(--background-modifier-border)', borderRadius: '5px', margin: '20px auto', overflow: 'hidden' }}>
                        <div style={{ width: `${(downloadProgress.current/downloadProgress.total)*100}%`, height: '100%', background: 'var(--interactive-accent)', transition: 'width 0.2s' }} />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{updateStatus === 'downloading' ? `Downloading ${downloadProgress.current}/${downloadProgress.total}` : 'Finalizing...'}</p>
                </div>
            );
            case 'results': return (
                <div style={{ textAlign: 'center' }}>
                    <h3 className="headline">System Updated Successfully</h3>
                    <p>Version {info.remoteVersion} is now live.</p>
                    <button className="primary-button" style={{ marginTop: '20px' }} onClick={() => window.location.reload()}>Reboot System</button>
                </div>
            );
            case 'support': return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', justifyContent: 'center', width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h3 className="headline" style={{ fontSize: '1.8em', marginBottom: '12px', letterSpacing: '1px' }}>System Up-To-Date</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1em', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>You are running the latest version of BETO 888.</p>
                    </div>
                    <div style={{ width: '80px', height: '1px', background: 'linear-gradient(90deg, transparent, var(--interactive-accent), transparent)', borderRadius: '1px' }} />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-faint)', fontSize: '0.95em', marginBottom: '16px', fontStyle: 'italic' }}>Want to support the development?</p>
                        <button className="primary-button" onClick={() => openExternal('https://ko-fi.com/betogroup')} style={{ padding: '12px 28px', fontSize: '0.95em' }}>Support Development</button>
                    </div>
                </div>
            );
            case 'full_update_required': return (
                <div style={{ textAlign: 'center' }}>
                    <h3 className="headline">Full Sync Required</h3>
                    <p>Incremental update not possible. Full repository sync needed.</p>
                    <button className="primary-button" style={{ marginTop: '20px' }} onClick={handleStartFullUpdate}>Start Full Sync</button>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className={uniqueWrapperClass} style={{ padding: '40px', color: 'var(--text-normal)', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <style>{`
                .primary-button { background: var(--interactive-accent); color: white; border: none; padding: 10px 24px; borderRadius: 8px; cursor: pointer; font-variant: small-caps; font-weight: bold; transition: all 0.2s ease; }
                .primary-button:hover { background: var(--interactive-accent-alt, var(--interactive-accent)); opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(150, 100, 255, 0.2); }
                .secondary-button { background: transparent; color: var(--text-muted); border: 1px solid var(--glow-faint); padding: 10px 24px; borderRadius: 8px; cursor: pointer; font-variant: small-caps; }
                .headline { color: var(--interactive-accent); font-variant: small-caps; letter-spacing: 2px; }
                .bet-reveal { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
            {renderContent()}
        </div>
    );
}

const UpdateManagerContainer = (props) => {
    const [key, setKey] = useState(0);
    return <UpdateManager key={key} onReloadRequest={() => setKey(k => k + 1)} {...props} />;
};

return { UpdateManager: UpdateManagerContainer, UpdateIndicator };
```
