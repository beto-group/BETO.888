


# ViewComponent

```jsx
const { useEffect, useRef, useState } = dc;

// --- UTILITY FUNCTIONS & COMPONENTS ---
function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }
const ICONS = {
    BELL: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <defs>
        <style>
            @keyframes bell-swing {
                0%, 100% { transform: rotate(0); }
                10%, 30%, 50%, 70%, 90% { transform: rotate(14deg); }
                20%, 40%, 60%, 80% { transform: rotate(-14deg); }
            }
            @keyframes clapper-move {
                0%, 100% { transform: rotate(0); }
                10%, 30%, 50%, 70%, 90% { transform: rotate(10deg); }
                20%, 40%, 60%, 80% { transform: rotate(-10deg); }
            }
            @keyframes pulse-glow {
                0% { transform: scale(0.8); opacity: 0; }
                50% { opacity: 0.3; }
                100% { transform: scale(1.4); opacity: 0; }
            }
        </style>
    </defs>
    <circle class="pulse-circle" cx="12" cy="12" r="10" fill="var(--interactive-accent)" opacity="0" style="transform-origin: center;"/>
    <g class="bell-body">
        <path class="svg-elem-1" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path class="clapper svg-elem-2" d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </g>
</svg>`,
    HEART: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    KOFI: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.584 6.334C22.259 5.864 21.706 5.633 21.119 5.633H5.733C5.146 5.633 4.593 5.864 4.268 6.334C3.618 7.274 4.076 8.124 4.076 8.124L5.617 13.337C6.014 14.577 7.158 15.367 8.449 15.367H15.62C16.911 15.367 18.055 14.577 18.452 13.337L20 8.124C20 8.124 20.458 7.274 19.808 6.334H22.584zM7.525 16.5C6.865 16.5 6.33 17.035 6.33 17.695V19.06C6.33 19.72 6.865 20.255 7.525 20.255H16.545C17.205 20.255 17.74 19.72 17.74 19.06V17.695C17.74 17.035 17.205 16.5 16.545 16.5H7.525z"></path></svg>`,
    PATREON: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15.385 0.23C11.246 0.23 7.854 3.621 7.854 7.76C7.854 11.899 11.246 15.29 15.385 15.29C19.524 15.29 22.915 11.899 22.915 7.76C22.915 3.621 19.523 0.23 15.385 0.23zM1.085 23.77H5.56V0.23H1.085V23.77z"></path></svg>`,
    CHECKLIST: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h10M8 12h10M8 18h10M4 6h.01M4 12h.01M4 18h.01"/></svg>`,
    X_CLOSE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const AnimatedIcon = ({ svgString, isActive, isInView }) => {
    const iconRef = useRef(null);
    const [hasRevealed, setHasRevealed] = useState(false);
    const DURATION = 1.0;

    useEffect(() => {
        const container = iconRef.current;
        if (!container || !svgString) return;

        // Use a unique class to scope animations and prevent style conflicts
        const uniqueClass = "animated-icon-" + Math.random().toString(36).substr(2, 9);
        container.classList.add(uniqueClass);
        container.innerHTML = svgString;

        const svgElement = container.querySelector('svg');
        if (!svgElement) return;

        // Setup for initial "drawing" animation
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

        // Add dynamic styles for the active state
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            .${uniqueClass} .bell-body { transform-origin: top center; }
            .${uniqueClass} .clapper { transform-origin: top center; }

            .${uniqueClass}.is-active .bell-body { animation: bell-swing 2.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
            .${uniqueClass}.is-active .clapper { animation: clapper-move 2.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; animation-delay: -0.1s; }
            .${uniqueClass}.is-active .pulse-circle { animation: pulse-glow 2.5s ease-out infinite; }
        `;
        svgElement.appendChild(styleSheet);

    }, [svgString]);

    useEffect(() => {
        // Trigger initial "drawing" animation when component is in view
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
        // Toggle the active animation class based on props
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
// --- UPDATER LOGIC ---
// =================================================================================

const GITHUB_OWNER = 'beto-group';
const GITHUB_REPO = 'BETO.888';
const GITHUB_BRANCH = 'yellow-3';
const LOG_PREFIX = '[VaultUpdater]';
const FILENAME = 'CHANGE LOG.md';
const BINARY_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov', 'pdf', 'woff', 'woff2', 'ttf', 'otf']);

function compareSemVer(a, b) { const partsA = a.split('.').map(Number); const partsB = b.split('.').map(Number); const len = Math.max(partsA.length, partsB.length); for (let i = 0; i < len; i++) { const numA = partsA[i] || 0; const numB = partsB[i] || 0; if (numA > numB) return 1; if (numA < numB) return -1; } return 0; }
function parseVersionFromYaml(markdownContent) { if (!markdownContent) return null; const yamlMatch = markdownContent.match(/^---\s*([\s\S]*?)\s*---/); if (!yamlMatch) return null; const yaml = yamlMatch[1]; const versionMatch = yaml.match(/^version:\s*["']?(.+?)["']?$/m); return versionMatch ? versionMatch[1] : null; }
function parseLatestChangelogEntry(markdownContent) { if (!markdownContent) return null; try { const footerMarker = '>[!example]- GENERAL INFO'; const footerIndex = markdownContent.indexOf(footerMarker); let content = footerIndex !== -1 ? markdownContent.substring(0, footerIndex) : markdownContent; const firstEntryIndex = content.search(/^## [A-Z]+-\d+/m); if (firstEntryIndex === -1) return null; content = content.substring(firstEntryIndex); const entries = content.split(/\n----\n/); return entries[0].trim(); } catch (error) { console.error(`${LOG_PREFIX} Failed to parse changelog:`, error); return "Could not parse changelog. Please check the `CHANGE LOG.md` file."; } }

async function checkForUpdates() { try { const remoteUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${encodeURIComponent(FILENAME)}?cache-bust=${new Date().getTime()}`; const response = await requestUrl({ url: remoteUrl, method: 'GET' }); if (response.status !== 200) { throw new Error(`Failed to fetch ${FILENAME}. Status: ${response.status}`); } const remoteContent = response.text; const remoteVersion = parseVersionFromYaml(remoteContent); if (!remoteVersion) throw new Error(`Could not find version in remote ${FILENAME}`); let localVersion = '0.0.0'; const localFile = dc.app.vault.getAbstractFileByPath(FILENAME); if (localFile) { const localContent = await dc.app.vault.read(localFile); localVersion = parseVersionFromYaml(localContent) || '0.0.0'; } const updateAvailable = compareSemVer(remoteVersion, localVersion) > 0; return { updateAvailable, remoteVersion, localVersion, remoteContent }; } catch (error) { console.error(`${LOG_PREFIX} Error during update check:`, error); new Notice("Could not check for updates. See console for details.", 4000); return { updateAvailable: false, remoteVersion: 'unknown', localVersion: 'unknown', remoteContent: null }; } }

async function downloadLatestFromRepo(onProgress, getIsCancelled) {
    const treeUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1&cache-bust=${new Date().getTime()}`;
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
        if (getIsCancelled && getIsCancelled()) {
            console.log(`${LOG_PREFIX} Update cancelled by user.`);
            return null;
        }

        const batch = filesToDownload.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (file) => {
            try {
                const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
                const contentUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${encodedPath}?cache-bust=${new Date().getTime()}`;

                const extension = file.path.split('.').pop().toLowerCase();
                const isBinary = BINARY_EXTENSIONS.has(extension);

                const contentResponse = await requestUrl({ url: contentUrl, method: 'GET' });
                if (contentResponse.status !== 200) {
                    console.error(`${LOG_PREFIX} Failed to download file: ${file.path} (Status: ${contentResponse.status})`);
                    return null;
                }

                const content = isBinary ? contentResponse.arrayBuffer : contentResponse.text;
                return { path: file.path, content, isBinary };
            } catch (error) {
                console.error(`${LOG_PREFIX} Failed to download file: ${file.path}`, error);
                return null;
            } finally {
                downloadedCount++;
                if (onProgress) onProgress({ current: downloadedCount, total: totalFiles, status: `Downloading...` });
            }
        });

        const results = (await Promise.all(batchPromises)).filter(Boolean);
        downloadedFiles.push(...results);
    }

    const wasCancelled = getIsCancelled && getIsCancelled();
    if (downloadedFiles.length !== filesToDownload.length && !wasCancelled) {
        new Notice("Warning: Some files failed to download. Check console for details.", 4000);
    }

    return downloadedFiles;
}


async function getCurrentVaultState(trackedFilePaths) {
    const vaultFiles = [];
    for (const path of trackedFilePaths) {
        try {
            const extension = path.split('.').pop().toLowerCase();
            const isBinary = BINARY_EXTENSIONS.has(extension);
            const content = isBinary
                ? await dc.app.vault.adapter.readBinary(path)
                : await dc.app.vault.adapter.read(path);
            vaultFiles.push({ path, content, isBinary });
        } catch (error) {
            // File doesn't exist locally, which is fine.
        }
    }
    return vaultFiles;
}

function compareVersions(latestFiles, currentFiles) {
    const latestFileMap = new Map(latestFiles.map(f => [f.path, f]));
    const currentFileMap = new Map(currentFiles.map(f => [f.path, f]));
    const newFiles = [];
    const updatedFiles = [];
    const deletedFiles = [];

    for (const [path, latestFile] of latestFileMap.entries()) {
        if (!currentFileMap.has(path)) {
            newFiles.push(latestFile);
        } else {
            const currentFile = currentFileMap.get(path);
            // For binary files, we can't easily compare content.
            // A simple but effective strategy is to just always update them.
            // The `!==` check on ArrayBuffers will almost always be true, achieving this.
            // For text files, this is an accurate content comparison.
            if (currentFile.content !== latestFile.content) {
                updatedFiles.push(latestFile);
            }
        }
    }
    for (const [path, currentFile] of currentFileMap.entries()) {
        if (!latestFileMap.has(path)) {
            deletedFiles.push(currentFile);
        }
    }
    return { newFiles, updatedFiles, deletedFiles };
}

// =================================================================================
// --- Main View Component ---
// =================================================================================
// =================================================================================
// --- Main View Component ---
// =================================================================================
function BasicView({ onReloadRequest }) {
    const uniqueWrapperClass = "interactive-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;

    const SimpleMarkdownParser = ({ text }) => { if (!text) return null; const markdownStyles = { h3: { fontSize: '1.1em', fontWeight: 600, color: 'var(--text-normal)', marginTop: '15px', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid var(--background-modifier-border)', fontVariant: 'small-caps' }, p: { margin: '0 0 8px 0', lineHeight: '1.5', fontVariant: 'small-caps' }, ul: { margin: '0 0 10px 0', paddingLeft: '20px', listStyleType: 'disc' }, li: { marginBottom: '4px', fontVariant: 'small-caps' }, code: { backgroundColor: 'var(--background-modifier-hover)', borderRadius: '4px', padding: '2px 5px', fontSize: '0.9em', fontFamily: 'var(--font-monospace, monospace)', color: 'var(--text-muted)' } }; const renderLine = (line) => { const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g); return parts.map((part, index) => { if (part.startsWith('**') && part.endsWith('**')) { return <strong key={index}>{part.slice(2, -2)}</strong>; } if (part.startsWith('`') && part.endsWith('`')) { return <code key={index} style={markdownStyles.code}>{part.slice(1, -1)}</code>; } return part; }); }; const elements = []; let listItems = []; const flushList = (key) => { if (listItems.length > 0) { elements.push(<ul key={key} style={markdownStyles.ul}>{listItems}</ul>); listItems = []; } }; text.split('\n').forEach((line, index) => { if (line.startsWith('## ')) { flushList(`ul-${index}`); elements.push(<h3 key={index} style={markdownStyles.h3}>{line.substring(3)}</h3>); } else if (line.startsWith('- ') || line.startsWith('* ')) { listItems.push(<li key={index} style={markdownStyles.li}>{renderLine(line.substring(2))}</li>); } else { flushList(`ul-${index}`); if (line.trim() !== '') { elements.push(<p key={index} style={markdownStyles.p}>{renderLine(line)}</p>); } } }); flushList('ul-last'); return <>{elements}</>; };

    const STYLES = {
        injectedStyles: `
      .${uniqueWrapperClass}:hover .subtle-icon, .${uniqueWrapperClass}:hover .reload-button { opacity: 0.7; transform: scale(1); }
      .promo-banner:hover { transform: scale(1.02); box-shadow: 0 0 90px -15px rgba(200, 160, 255, 0.4); }
      .reload-button:hover { background-color: var(--background-modifier-hover); opacity: 1; transform: scale(1.05); }
      .reload-button:active { transform: scale(0.95); }
      .changelog-toggle:hover { background-color: var(--background-modifier-hover); border-color: var(--background-modifier-border-hover); }
      .changelog-content::-webkit-scrollbar { width: 6px; }
      .changelog-content::-webkit-scrollbar-track { background: transparent; }
      .changelog-content::-webkit-scrollbar-thumb { background-color: rgba(150, 100, 255, 0.3); border-radius: 10px; }
      .changelog-content::-webkit-scrollbar-thumb:hover { background-color: rgba(150, 100, 255, 0.5); }
      .support-button:hover { background-color: var(--background-modifier-hover); border-color: var(--interactive-accent-hover); }
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes scaleIn { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      .modal-fade-in { animation: fadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1); } .modal-scale-in { animation: scaleIn 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
      @keyframes betReveal { 0% { opacity: 0; transform: scale(0.7) rotate(-10deg); } 70% { opacity: 1; transform: scale(1.1) rotate(5deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
      .bet-reveal { animation: betReveal 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }`,
        fullTabWrapper: { position: 'relative', height: "100%", width: "100%", padding: "20px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "25px", backgroundColor: "var(--background-secondary)", border: "1px solid var(--background-modifier-border)", borderRadius: "8px", color: "var(--text-normal)", transition: "background-color 0.2s ease", },
        icon: { position: "absolute", top: "15px", right: "20px", fontFamily: "monospace", fontSize: "14px", color: "var(--text-faint)", userSelect: "none", cursor: "pointer", opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out", zIndex: 10, },
        reloadButton: { position: "absolute", top: "12px", right: "50px", zIndex: 10, width: "30px", height: "30px", borderRadius: "50%", border: "none", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", color: "var(--text-faint)", backgroundColor: 'transparent', outline: "none", padding: 0, opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease", },
        promoBanner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: "20px 30px", borderRadius: "16px", width: 'min(100%, 500px)', background: 'rgba(24, 15, 28, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 0 80px -20px rgba(200, 160, 255, 0.3)', cursor: 'pointer', transition: 'transform 0.3s ease, box-shadow 0.3s ease', },
        promoIconContainer: { width: '48px', height: '48px', flexShrink: 0, },
        bannerTextContainer: { textAlign: 'left', },
        bannerTitle: { margin: '0 0 5px 0', fontSize: '1.2em', fontWeight: 600, color: 'var(--text-normal)', fontVariant: 'small-caps' },
        bannerText: { margin: 0, color: 'var(--text-muted)', fontSize: '0.9em', fontVariant: 'small-caps' },
        modalOverlay: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px) saturate(1.2)', zIndex: 9999, },
        modalContent: { display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: 'min(100%, 95vw)', maxWidth: '500px', minHeight: '220px', justifyContent: 'center', padding: '30px', boxSizing: 'border-box', background: 'rgba(24, 15, 28, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', boxShadow: '0 0 80px -20px rgba(200, 160, 255, 0.3)', overflow: 'hidden', textAlign: 'left' },
        modalTitle: { margin: 0, fontSize: '1.5em', fontWeight: 600, color: 'var(--text-normal)', textAlign: 'center', fontVariant: 'small-caps' },
        modalText: { margin: '0 0 10px 0', color: 'var(--text-muted)', textAlign: 'center', fontVariant: 'small-caps' },
        changelogContent: { backgroundColor: 'var(--background-primary)', border: '1px solid var(--interactive-accent)', borderRadius: '8px', padding: '15px', width: '100%', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-monospace, monospace)', fontSize: '13px', color: 'var(--text-normal)', transition: 'max-height 0.4s ease-in-out, opacity 0.4s ease', },
        changelogToggle: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', borderRadius: '6px', backgroundColor: 'transparent', transition: 'background-color 0.2s ease, border-color 0.2s ease', width: '100%', border: '1px solid var(--background-modifier-border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px', justifyContent: 'space-between', fontVariant: 'small-caps' },
        hoverRevealText: { color: 'var(--text-faint)', fontSize: '12px', fontStyle: 'italic', height: '15px', textAlign: 'center', transition: 'opacity 0.3s ease, transform 0.3s ease', opacity: 0, transform: 'translateY(5px)', fontVariant: 'small-caps' },
        betText: { fontSize: '3.5em', fontWeight: 'bold', color: 'var(--text-normal)', userSelect: 'none', fontVariant: 'small-caps' },
        buttonGroup: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" },
        button: { padding: "8px 16px", fontSize: "12px", fontWeight: "500", color: "var(--text-on-accent)", backgroundColor: "var(--interactive-accent)", border: "none", borderRadius: "6px", cursor: "pointer", fontVariant: 'small-caps' },
        secondaryButton: { backgroundColor: "var(--background-modifier-hover)", color: "var(--text-muted)", },
        fileChangesContainer: { width: '100%', backgroundColor: 'var(--background-secondary)', border: '1px solid var(--interactive-accent)', borderRadius: '12px', padding: '15px 20px', fontFamily: 'var(--font-monospace)', marginTop: '10px' },
        fileChangeHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 8px', backgroundColor: 'var(--background-modifier-hover)', borderRadius: '6px', marginBottom: '10px' },
        iconButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'background-color 0.2s, color 0.2s' },
        fileChangeCategoryTitle: { fontWeight: '600', color: 'var(--text-normal)', margin: '10px 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px', fontVariant: 'small-caps', fontSize: '1.1em' },
        fileChangeList: { listStyleType: 'none', padding: 0, margin: 0 },
        fileChangeListItem: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', color: 'var(--text-accent)', fontSize: '0.95em', position: 'relative', padding: '2px 0' },
        fileChangeListItemSelectable: { cursor: 'pointer' },
        fileChangePath: { cursor: 'pointer', flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        fileChangePrefix: { fontWeight: 'bold', fontFamily: 'monospace' },
        fileInfoPreview: { position: 'absolute', bottom: '100%', left: '15px', marginBottom: '5px', backgroundColor: 'var(--background-secondary)', color: 'var(--text-normal)', padding: '5px 10px', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 1000, whiteSpace: 'nowrap', fontSize: '12px' },
        supportButtonContainer: { display: 'flex', gap: '20px', justifyContent: 'center', width: '100%', marginTop: '15px' },
        supportButton: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', border: '1px solid var(--background-modifier-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: 'var(--background-primary-alt)', color: 'var(--text-normal)', transition: 'all 0.2s ease', padding: '10px' },
        supportButtonIcon: { width: '48px', height: '48px', marginBottom: '10px' },
        supportButtonText: { fontVariant: 'small-caps', fontWeight: '500' },
        previewModalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, backdropFilter: 'blur(5px)', },
        previewModalContent: { backgroundColor: 'var(--background-secondary)', border: '1px solid var(--background-modifier-border)', borderRadius: '12px', boxShadow: '0 5px 25px rgba(0,0,0,0.5)', width: 'clamp(300px, 80vw, 900px)', height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        previewModalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid var(--background-modifier-border)', flexShrink: 0, backgroundColor: 'var(--background-primary-alt)' },
        previewModalTitle: { fontFamily: 'var(--font-monospace)', fontSize: '14px', color: 'var(--text-normal)' },
        previewModalCloseButton: { background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1, padding: '0 5px' },
        previewModalBody: { padding: '15px', overflow: 'auto', flexGrow: 1, backgroundColor: 'var(--background-primary)', margin: 0, },
        previewModalCode: { whiteSpace: 'pre', fontFamily: 'var(--font-monospace)', fontSize: '13px', color: 'var(--text-normal)', },
        progressBarContainer: { width: '80%', height: '12px', backgroundColor: 'var(--background-modifier-border)', borderRadius: '6px', overflow: 'hidden', marginTop: '10px' },
        progressBar: { height: '100%', width: '0%', backgroundColor: 'var(--interactive-accent)', transition: 'width 0.2s ease-out' },
        progressText: { marginTop: '8px', color: 'var(--text-muted)', fontSize: '12px', fontVariant: 'small-caps' }
    };

    const [isFullTab, setIsFullTab] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStage, setModalStage] = useState('confirmation');
    const [isConfirmHovered, setIsConfirmHovered] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('idle');
    const [updateResult, setUpdateResult] = useState(null);
    const [updateCheck, setUpdateCheck] = useState({ status: 'checking', info: null });
    const [latestChangelog, setLatestChangelog] = useState('');
    const [isChangelogVisible, setIsChangelogVisible] = useState(false);
    const [isFileChangesVisible, setIsFileChangesVisible] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, status: '' });
    // *** THIS LINE WAS MISSING ***
    const isUpdateCancelled = useRef(false);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    useEffect(() => { const container = containerRef.current; if (!container) return; if (isFullTab) { if (!container.parentNode) { setTimeout(() => setIsFullTab(true), 50); return; } const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content'); if (!targetPaneContent) { console.error("[BasicView] Full tab mode failed."); setIsFullTab(false); return; } const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent; stateRefs.originalParent = container.parentNode; stateRefs.placeholder = document.createElement('div'); stateRefs.placeholder.style.display = 'none'; container.parentNode.insertBefore(stateRefs.placeholder, container); const computedParentPosition = window.getComputedStyle(contentWrapper).position; stateRefs.parentPositionInfo = { element: contentWrapper, originalInlinePosition: contentWrapper.style.position }; if (computedParentPosition === 'static') { contentWrapper.style.position = "relative"; } contentWrapper.appendChild(container); Object.assign(container.style, { position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: "9998", overflow: "auto" }); } return () => { if (!stateRefs.originalParent) return; if (stateRefs.placeholder?.parentNode) { stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder); } else { stateRefs.originalParent.appendChild(container); } if (stateRefs.parentPositionInfo?.element) { stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || ''; } container.removeAttribute("style"); Object.keys(stateRefs).forEach(key => stateRefs[key] = null); }; }, [isFullTab]);
    useEffect(() => { if (!isModalOpen) return; const handleKeyDown = (event) => { if (event.key === 'Escape') { handleCloseModal(); } }; document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [isModalOpen]);
    useEffect(() => { async function doUpdateCheck() { const result = await checkForUpdates(); setUpdateCheck({ status: 'checked', info: result }); if (result.remoteContent) { setLatestChangelog(parseLatestChangelogEntry(result.remoteContent) || "Could not parse changelog entry."); } } doUpdateCheck(); }, []);

    const handleOpenUpdateModal = async () => {
        new Notice('Re-checking for updates...', 2000);
        const result = await checkForUpdates();
        setUpdateCheck({ status: 'checked', info: result });
        if (result.remoteContent) { setLatestChangelog(parseLatestChangelogEntry(result.remoteContent) || "Could not parse changelog entry."); }
        if (result.updateAvailable) { setIsChangelogVisible(false); setModalStage('confirmation'); setIsModalOpen(true); }
        else { new Notice('You are already up-to-date!', 4000); handleOpenSupportModal(); }
    };

    const handleOpenSupportModal = () => {
        setModalStage('support');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsFullTab(false);
        setIsMultiSelectMode(false);
        setSelectedFiles([]);
    };

    const handleExitFullTab = (e) => {
        e.stopPropagation();
        handleCloseModal();
    };

    const handleEnterAndOpenModal = () => {
        setIsFullTab(true);
        if (updateCheck.info?.updateAvailable) {
            handleOpenUpdateModal();
        } else {
            handleOpenSupportModal();
        }
    };

    const handleCancelUpdate = () => {
        isUpdateCancelled.current = true;
        new Notice("Update cancelled.", 3000);
        handleCloseModal();
    };


    const handleStartUpdate = async () => {
        isUpdateCancelled.current = false;
        setModalStage('bet');
        await sleep(1000);
        try {
            setModalStage('processing');
            setUpdateStatus('downloading');
            const latestFiles = await downloadLatestFromRepo(setDownloadProgress, () => isUpdateCancelled.current);
            if (latestFiles === null) return; // Update was cancelled

            setUpdateStatus('comparing');
            const changelogFile = latestFiles.find(f => f.path === FILENAME);
            const changelogEntry = changelogFile ? parseLatestChangelogEntry(changelogFile.content) : null;
            const allFilePaths = [...new Set([...latestFiles.map(f => f.path), ...dc.app.vault.getFiles().map(f => f.path)])];
            const currentFiles = await getCurrentVaultState(allFilePaths);
            const results = compareVersions(latestFiles, currentFiles);

            const TOS_APPROVAL_FILE = '_OPERATION/PUBLIC/INFO/DISCLAIMERS/TOS/TERMS OF SERVICE.approval.md';
            const SPECIAL_ASSET_PATH = '_RESOURCES/ASSETS/888/ASSETS_.A/';
            const DATACORE_PATH = '.datacore/';

            const filteredResults = {
                newFiles: results.newFiles.filter(f =>
                    f.path !== TOS_APPROVAL_FILE &&
                    (!f.path.startsWith(SPECIAL_ASSET_PATH) || f.path.endsWith('.md'))
                ),
                updatedFiles: results.updatedFiles.filter(f =>
                    f.path !== TOS_APPROVAL_FILE &&
                    !f.path.startsWith(DATACORE_PATH) &&
                    (!f.path.startsWith(SPECIAL_ASSET_PATH) || f.path.endsWith('.md'))
                ),
                deletedFiles: results.deletedFiles.filter(f =>
                    f.path !== TOS_APPROVAL_FILE &&
                    !f.path.startsWith(DATACORE_PATH) &&
                    (!f.path.startsWith(SPECIAL_ASSET_PATH) || f.path.endsWith('.md'))
                ),
            };

            setUpdateResult({ ...filteredResults, changelogEntry, currentFiles });
            setUpdateStatus('writing');

            const allFilesToWrite = [...filteredResults.newFiles, ...filteredResults.updatedFiles];
            for (const file of allFilesToWrite) {
                const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
                if (parentDir && !await dc.app.vault.adapter.exists(parentDir)) {
                    await dc.app.vault.createFolder(parentDir);
                }
                if (file.isBinary) {
                    await dc.app.vault.adapter.writeBinary(file.path, file.content);
                } else {
                    await dc.app.vault.adapter.write(file.path, file.content);
                }
            }

            // --- NEW ARCHIVE LOGIC (Replaces Deletion) ---
            const ARCHIVE_ROOT = '.archive';
            for (const file of filteredResults.deletedFiles) {
                const fileToArchive = dc.app.vault.getAbstractFileByPath(file.path);
                if (fileToArchive) {
                    const newPath = `${ARCHIVE_ROOT}/${file.path}`;
                    const archiveParentDir = newPath.substring(0, newPath.lastIndexOf('/'));

                    // Ensure the destination directory exists, creating it recursively
                    if (archiveParentDir && !(await dc.app.vault.adapter.exists(archiveParentDir))) {
                        await dc.app.vault.adapter.mkdir(archiveParentDir);
                    }

                    // Move the file to the archive
                    await dc.app.vault.rename(fileToArchive, newPath);
                }
            }
            // --- END OF ARCHIVE LOGIC ---

            new Notice(`Update to v${updateCheck.info.remoteVersion} complete!`, 5000);
            setUpdateStatus('success');
            setModalStage('results');
        } catch (error) {
            if (!isUpdateCancelled.current) {
                console.error("Update process failed:", error);
                setUpdateStatus('error');
                new Notice("Update process failed. Check the console for details.", 5000);
                handleCloseModal();
            }
        }
    };

    const handleRevertChanges = async (filesToRevertPaths) => {
        if (!updateResult || filesToRevertPaths.length === 0) return;
        const { newFiles, updatedFiles, deletedFiles, currentFiles } = updateResult;
        try {
            for (const filePath of filesToRevertPaths) {
                const isNew = newFiles.some(f => f.path === filePath);
                const isUpdated = updatedFiles.some(f => f.path === filePath);
                const isDeleted = deletedFiles.some(f => f.path === filePath);

                if (isNew) {
                    const fileToDelete = dc.app.vault.getAbstractFileByPath(filePath);
                    if (fileToDelete) await dc.app.vault.delete(fileToDelete);
                } else if (isUpdated || isDeleted) {
                    const originalFile = currentFiles.find(f => f.path === filePath);
                    if (originalFile) {
                        const parentDir = originalFile.path.substring(0, originalFile.path.lastIndexOf('/'));
                        if (parentDir && !(await dc.app.vault.adapter.exists(parentDir))) {
                            await dc.app.vault.createFolder(parentDir);
                        }
                        if (originalFile.isBinary) {
                            await dc.app.vault.adapter.writeBinary(originalFile.path, originalFile.content);
                        } else {
                            await dc.app.vault.adapter.write(originalFile.path, originalFile.content);
                        }
                    }
                }
            }
            new Notice(`${filesToRevertPaths.length} file(s) reverted.`, 4000);
            handleCloseModal();
        } catch (error) {
            console.error("Failed to revert changes:", error);
            new Notice("Error reverting files. See console for details.", 5000);
        }
    };

    const FilePreviewModal = ({ file, onClose }) => { useEffect(() => { const handleEsc = (event) => { if (event.key === 'Escape') { onClose(); } }; window.addEventListener('keydown', handleEsc); return () => window.removeEventListener('keydown', handleEsc); }, [onClose]); if (!file) return null; const isBinary = BINARY_EXTENSIONS.has(file.path.split('.').pop().toLowerCase()); return (<div style={STYLES.previewModalOverlay} className="modal-fade-in" onClick={onClose}> <div style={STYLES.previewModalContent} className="modal-scale-in" onClick={e => e.stopPropagation()}> <div style={STYLES.previewModalHeader}> <span style={STYLES.previewModalTitle}>{file.path}</span> <button style={STYLES.previewModalCloseButton} onClick={onClose}>&times;</button> </div> <pre style={STYLES.previewModalBody}> <code style={STYLES.previewModalCode}>{isBinary ? '(Binary file, cannot be previewed)' : (file.content || '(File is new and empty or content is unavailable)')}</code> </pre> </div> </div>); };

    const CollapsibleSection = ({ title, children, isVisible, onToggle }) => (<div style={{ width: '100%', marginBottom: '10px' }}> <button style={STYLES.changelogToggle} onClick={onToggle} className="changelog-toggle"> <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{title}</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isVisible ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}><polyline points="15 6 9 12 15 18"></polyline></svg> </button> {isVisible && (<div className="changelog-content" style={{ ...STYLES.changelogContent, maxHeight: '25vh', marginTop: '10px' }}> {children} </div>)} </div>);

    const renderModalContent = () => {
        switch (modalStage) {
            case 'confirmation': return (<> <h3 style={STYLES.modalTitle}>Confirm Update</h3> <p style={STYLES.modalText}>You are about to update from <b>v{updateCheck.info.localVersion}</b> to <b>v{updateCheck.info.remoteVersion}</b>.</p> <CollapsibleSection title="View what's new" isVisible={isChangelogVisible} onToggle={() => setIsChangelogVisible(!isChangelogVisible)}> <SimpleMarkdownParser text={latestChangelog} /> </CollapsibleSection> <div style={STYLES.buttonGroup}> <button style={{ ...STYLES.button, ...STYLES.secondaryButton }} onClick={handleCloseModal}>Cancel</button> <button style={{ ...STYLES.button, ...STYLES.secondaryButton }} onClick={() => window.open(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`, '_blank')}>View on GitHub</button> <button style={STYLES.button} onClick={handleStartUpdate} onMouseEnter={() => setIsConfirmHovered(true)} onMouseLeave={() => setIsConfirmHovered(false)}>Confirm Update</button> </div> <p style={{ ...STYLES.hoverRevealText, opacity: isConfirmHovered ? 1 : 0, transform: isConfirmHovered ? 'translateY(0)' : 'translateY(5px)' }}>bro you trust me ?</p> </>);
            case 'bet': return <div className="bet-reveal"><h1 style={STYLES.betText}>BET 🫡</h1></div>;
            case 'processing':
                const progressPercentage = downloadProgress.total > 0 ? (downloadProgress.current / downloadProgress.total) * 100 : 0;
                let statusText = 'Preparing...';
                if (updateStatus === 'downloading') { statusText = `Downloading files... (${downloadProgress.current}/${downloadProgress.total})`; }
                else if (updateStatus === 'comparing') { statusText = 'Comparing versions...'; }
                else if (updateStatus === 'writing') { statusText = 'Writing files to vault...'; }
                return (<> <h3 style={STYLES.modalTitle}>Upgrading...</h3> <div style={STYLES.progressBarContainer}> <div style={{ ...STYLES.progressBar, width: `${progressPercentage}%` }} /> </div> <p style={STYLES.progressText}>{statusText}</p> <div style={{ ...STYLES.buttonGroup, marginTop: '15px' }}> <button style={{ ...STYLES.button, ...STYLES.secondaryButton }} onClick={handleCancelUpdate}>Cancel</button> </div> </>);
            case 'results':
                const { newFiles = [], updatedFiles = [], deletedFiles = [], changelogEntry } = updateResult || {};
                const excludedFiles = ['.obsidian/workspace.json'];
                const filtered = {
                    updated: updatedFiles.filter(f => !excludedFiles.includes(f.path)),
                    added: newFiles.filter(f => !excludedFiles.includes(f.path)),
                    deleted: deletedFiles.filter(f => !excludedFiles.includes(f.path)),
                };
                const allChangedFiles = [...filtered.updated, ...filtered.added, ...filtered.deleted];
                const FileLink = ({ file, type }) => {
                    const [isHovering, setIsHovering] = useState(false);
                    const symbols = { added: '+', updated: '=', deleted: '-' };
                    const handlePreviewClick = (e) => {
                        e.stopPropagation();
                        setFilePreview({ path: file.path, content: file.content });
                    };
                    return (<li style={{ ...STYLES.fileChangeListItem, ...(isMultiSelectMode && STYLES.fileChangeListItemSelectable) }} onClick={isMultiSelectMode ? () => setSelectedFiles(prev => prev.includes(file.path) ? prev.filter(p => p !== file.path) : [...prev, file.path]) : handlePreviewClick} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
                        {isHovering && <div style={STYLES.fileInfoPreview}>{file.path}</div>}
                        {isMultiSelectMode && <input type="checkbox" readOnly checked={selectedFiles.includes(file.path)} style={{ flexShrink: 0 }} />}
                        <span style={{ ...STYLES.fileChangePrefix, flexShrink: 0, cursor: 'pointer' }} onClick={handlePreviewClick}>{symbols[type]}</span>
                        <span style={STYLES.fileChangePath} onClick={handlePreviewClick}>{file.path}</span>
                    </li>);
                };
                return (<> <h3 style={STYLES.modalTitle}>Update to v{updateCheck.info.remoteVersion} Complete!</h3> <CollapsibleSection title="What's New" isVisible={isChangelogVisible} onToggle={() => setIsChangelogVisible(!isChangelogVisible)}> <SimpleMarkdownParser text={changelogEntry || "No changelog entry found."} /> </CollapsibleSection> <CollapsibleSection title="File Changes" isVisible={isFileChangesVisible} onToggle={() => setIsFileChangesVisible(!isFileChangesVisible)}> <div style={{ ...STYLES.fileChangesContainer, border: 'none', padding: 0, marginTop: 0 }}> <div style={STYLES.fileChangeHeader}> {isMultiSelectMode ? (<> <input type="checkbox" onChange={(e) => setSelectedFiles(e.target.checked ? allChangedFiles.map(f => f.path) : [])} checked={selectedFiles.length === allChangedFiles.length && allChangedFiles.length > 0} id="select-all-checkbox" /> <label htmlFor="select-all-checkbox" style={{ cursor: 'pointer', fontVariant: 'small-caps' }}>Select All</label> <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}> {selectedFiles.length > 0 && <button style={{ ...STYLES.button, ...STYLES.secondaryButton, padding: '4px 10px', fontSize: '11px' }} onClick={() => handleRevertChanges(selectedFiles)}>Revert ({selectedFiles.length})</button>} <button onClick={() => { setIsMultiSelectMode(false); setSelectedFiles([]); }} className="icon-button" style={STYLES.iconButton} title="Cancel Selection"><div style={{ width: '16px', height: '16px' }} dangerouslySetInnerHTML={{ __html: ICONS.X_CLOSE }} /></button> </div> </>) : (<> <h4 style={{ ...STYLES.fileChangeCategoryTitle, margin: 0, flexGrow: 1, fontSize: '1em' }}>Summary</h4> {allChangedFiles.length > 0 && <button onClick={() => setIsMultiSelectMode(true)} className="icon-button" style={STYLES.iconButton} title="Select files to revert"><div style={{ width: '18px', height: '18px' }} dangerouslySetInnerHTML={{ __html: ICONS.CHECKLIST }} /></button>} </>)} </div> {filtered.updated.length > 0 && <><h4 style={STYLES.fileChangeCategoryTitle}>Modified</h4><ul style={STYLES.fileChangeList}>{filtered.updated.map((f, i) => <FileLink key={`mod-${i}`} file={f} type="updated" />)}</ul></>} {filtered.added.length > 0 && <><h4 style={STYLES.fileChangeCategoryTitle}>Added</h4><ul style={STYLES.fileChangeList}>{filtered.added.map((f, i) => <FileLink key={`new-${i}`} file={f} type="added" />)}</ul></>} {filtered.deleted.length > 0 && <><h4 style={STYLES.fileChangeCategoryTitle}>Deleted</h4><ul style={STYLES.fileChangeList}>{filtered.deleted.map((f, i) => <FileLink key={`del-${i}`} file={f} type="deleted" />)}</ul></>} </div> </CollapsibleSection> <div style={{ ...STYLES.buttonGroup, marginTop: '15px' }}> <button style={STYLES.button} onClick={handleCloseModal}>Done</button> </div> </>);
            case 'support': return (<> <h3 style={STYLES.modalTitle}>Support the Developer</h3> <p style={STYLES.modalText}>If you find this tool helpful, please consider supporting its development.</p> <div style={STYLES.supportButtonContainer}> <button className="support-button" style={STYLES.supportButton} onClick={() => window.open('https://ko-fi.com/betogroup', '_blank')}> <div style={STYLES.supportButtonIcon} dangerouslySetInnerHTML={{ __html: ICONS.KOFI }}></div> <span style={STYLES.supportButtonText}>Ko-fi</span> </button> </div> <div style={{ ...STYLES.buttonGroup, marginTop: '20px' }}> <button style={{ ...STYLES.button, ...STYLES.secondaryButton }} onClick={handleCloseModal}>Maybe Later</button> </div> </>);
            default: return null;
        }
    }

    const Banner = ({ onClick }) => {
        if (updateCheck.status === 'checking') { return (<div style={{ ...STYLES.promoBanner, opacity: 0.7, cursor: 'default' }}><div style={STYLES.promoIconContainer}><AnimatedIcon svgString={ICONS.BELL} isActive={false} isInView={true} /></div><div style={STYLES.bannerTextContainer}><h3 style={STYLES.bannerTitle}>Checking for Updates...</h3><p style={STYLES.bannerText}>Please wait a moment.</p></div></div>); }
        if (updateCheck.info?.updateAvailable) { return (<div style={STYLES.promoBanner} className="promo-banner" onClick={onClick}><div style={STYLES.promoIconContainer}><AnimatedIcon svgString={ICONS.BELL} isActive={true} isInView={true} /></div><div style={STYLES.bannerTextContainer}><h3 style={STYLES.bannerTitle}>{`Update Available: v${updateCheck.info.remoteVersion}`}</h3><p style={STYLES.bannerText}>{`You are on v${updateCheck.info.localVersion}. Click to upgrade.`}</p></div></div>); }
        return (<div style={STYLES.promoBanner} className="promo-banner" onClick={onClick}><div style={STYLES.promoIconContainer}><AnimatedIcon svgString={ICONS.HEART} isActive={true} isInView={true} /></div><div style={STYLES.bannerTextContainer}><h3 style={STYLES.bannerTitle}>You Are Up-To-Date!</h3><p style={STYLES.bannerText}>Consider supporting the developer.</p></div></div>);
    };

    return (
        <div ref={containerRef}>
            <style>{STYLES.injectedStyles} {`.icon-button:hover { background-color: var(--background-modifier-border); color: var(--text-normal); }`}</style>
            {filePreview && <FilePreviewModal file={filePreview} onClose={() => setFilePreview(null)} />}

            {isFullTab ? (
                <div style={STYLES.fullTabWrapper} className={uniqueWrapperClass}>
                    <span style={STYLES.icon} className="subtle-icon" title="Exit Full Tab" onClick={handleExitFullTab}>&lt;/&gt;</span>
                    <button onClick={onReloadRequest} className="reload-button" style={STYLES.reloadButton} aria-label="Reload Component" title="Reload Component">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(60deg)' }}><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                    </button>
                    {isModalOpen && <div style={STYLES.modalOverlay} className="modal-fade-in" onClick={handleCloseModal}><div style={STYLES.modalContent} className="modal-scale-in" onClick={e => e.stopPropagation()}>{renderModalContent()}</div></div>}
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                    <Banner onClick={handleEnterAndOpenModal} />
                </div>
            )}
        </div>
    );
};


function BasicViewContainer() {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleHardReset = () => { new Notice('Reloading component...'); setRefreshKey(prevKey => prevKey + 1); };
    return <BasicView key={refreshKey} onReloadRequest={handleHardReset} />;
}

return { UpdateManager: BasicViewContainer };
```


