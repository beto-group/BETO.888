

# ViewComponent_v11


```jsx
const { useEffect, useRef, useState, useCallback, useMemo } = dc;



// --- ROBUST PATH RESOLUTION ---
const CURRENT_FILE = dc.resolvePath("ViewComponent.md");
const DASH_ROOT = CURRENT_FILE.split('/').slice(0, -2).join('/');
const resolveDash = (path, header) => dc.headerLink(`${DASH_ROOT}/${path}`, header);

// Force global centering override for any legacy modal leaks
const GLOBAL_STYLE_OVERRIDE = `
    .docs-modal-overlay, .nf-panel-wrap {
        display: flex !important;
        align-items: stretch !important;
        justify-content: center !important;
        padding: 0 !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        margin: 0 !important;
        background: rgba(0,0,0,0.85) !important;
        z-index: 999999 !important;
        overflow: hidden !important;
    }
    .nf-panel {
        margin: 0 auto !important;
        position: relative !important;
        width: 100% !important;
        max-width: 1400px !important;
        height: 100% !important;
        max-height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        border-radius: 0 !important;
    }
    .nf-scroll-area {
        flex: 1 !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
    }
`;


const { ICONS } = await dc.require(resolveDash("src/ICONS.md", "ICONS"));
const { UpdateManager, UpdateIndicator } = await dc.require(resolveDash("src/components/Updater/VaultUpdater.md", "VaultUpdater"));
const { DatacorePlayground } = await dc.require(resolveDash("_resources/components/DatacorePlayground/DATACORE PLAYGROUND.md", "DatacorePlayground"));
const { useDashboardDisplayMode } = await dc.require(resolveDash("src/utils/FullTab.md", "FullTab"));
const { AssetsSection } = await dc.require(resolveDash("src/components/Assets/AssetsSection.md", "AssetsSection"));
const { DataCoreSection } = await dc.require(resolveDash("src/components/DataCore/DataCoreSection.md", "DataCoreSection"));
const { DocsSection, DocsDetailView, parseModuleFileContent } = await dc.require(resolveDash("src/components/Docs/DocsSection.md", "DocsSection"));

// --- NEW MODULAR IMPORTS ---
const { IMG_EXTS, VID_EXTS, loadScript, normalizeVaultPath, fuzzyFindFile } = await dc.require(resolveDash("src/utils/CommonUtils.md", "CommonUtils"));
const { MediaResolver, getMediaResourcePath } = await dc.require(resolveDash("src/utils/MediaResolver.md", "MediaResolver"));
const { ContentRenderer } = await dc.require(resolveDash("src/utils/ContentRenderer.md", "ContentRenderer"));
const { Showcase, MatrixRain, GlobalVideoPlayer, LoadingScreen, OverlayLogo } = await dc.require(resolveDash("src/components/Shared/HeroComponents.md", "HeroComponents"));
const { TOSScreen, isTosApproved, writeTosApproval, subscribeToTosApprovalChanges } = await dc.require(resolveDash("src/utils/TOSManager.md", "TOSManager"));
const { NFModal_v11: NFModal } = await dc.require(resolveDash("src/components/Shared/NFModal.md", "NFModal_v11"));
const { MarkdownViewer } = await dc.require(resolveDash("src/utils/MarkdownViewer.md", "MarkdownViewer"));
const { Home } = await dc.require(resolveDash("src/components/Home/HomeSection.md", "HomeSection"));
const { DevLog } = await dc.require(resolveDash("src/components/Devlog/DevlogSection.md", "DevlogSection"));
const { BoxLayout } = await dc.require(resolveDash("_resources/components/Shared/BoxLayout.md", "BoxLayout"));
const { TabLayout } = await dc.require(resolveDash("_resources/components/Shared/TabLayout.md", "TabLayout"));
const { ShowcaseLayout } = await dc.require(dc.headerLink(dc.resolvePath("src/layouts/ShowcaseLayout.md"), "ShowcaseLayout"));
const { STYLES, generateCSS } = await dc.require(resolveDash("src/utils/DesignSystem.md", "DesignSystem"));
const { RemoteModule } = await dc.require(resolveDash("src/utils/InceptionEngine.md", "InceptionEngine"));
const { SettingsPortal } = await dc.require(resolveDash("src/components/Shared/SettingsPortal.md", "SettingsPortal"));
const { VaultSelector, SuccessScreen, handleImportToVault: importLogic } = await dc.require(resolveDash("src/utils/ComponentImporter.md", "ComponentImporter"));




// --- THE BETO CORE REGISTRY ---
// This enables modularity by decoupling sections from the main switch logic.
const BETO = {
    sections: {
        home: Home,
        devlog: DevLog,
        docs: DocsSection,
        datacore: DataCoreSection,
        assets: AssetsSection
    },
    // Helper to add or override sections dynamically
    register: (id, Component) => {
        BETO.sections[id.toLowerCase()] = Component;
    }
};



// ====================================================================
// ====================================================================
// --- INTELLIGENT MEDIA RESOLVER WITH CACHING ---
// ====================================================================

// ====================================================================
// SELF-CONTAINED SUB-COMPONENTS (Unchanged, unless specified)
// ====================================================================

// ====================================================================
// SELF-CONTAINED SUB-COMPONENTS (Unchanged, unless specified)
// ====================================================================

// MatrixRain moved to modular files.

// GlobalVideoPlayer moved to modular files.


// ====================================================================
// STYLE DEFINITIONS & TOS LOGIC (Unchanged)
// ====================================================================

// TOS Logic moved to src/utils/TOSManager.md
    // TOS Logic moved to src/utils/TOSManager.md

// ====================================================================
// MAIN VIEW COMPONENT
// ====================================================================

function BasicView() {
    const uniqueWrapperClass =
        "terminal-wrapper-" +
        useRef(Math.random().toString(36).substr(2, 9)).current;
    const [displayMode, setDisplayMode] = useState("welcome");
    const [welcomeStep, setWelcomeStep] = useState("intro");
    const [section, setSection] = useState("BETO.home");
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [pendingSection, setPendingSection] = useState(null);
    const [transitionOpacity, setTransitionOpacity] = useState(0);

    const setSectionWithTransition = useCallback((newId) => {
        if (newId === section || isTransitioning) return;
        
        setIsTransitioning(true);
        setTransitionOpacity(1); // Immediate mask trigger
        setPendingSection(newId);
        
        // Swap Section when opaque
        setTimeout(() => {
            setSection(newId);
            // Give the new component one frame to mount, then fade out
            setTimeout(() => {
                setTransitionOpacity(0);
                setTimeout(() => {
                    setIsTransitioning(false);
                    setPendingSection(null);
                }, 250); // Fast Fade-Out
            }, 40); // Fast mount buffer
        }, 180); // Fast Fade-In
    }, [section, isTransitioning]);

    const [globalVideoPlayer, setGlobalVideoPlayer] = useState({
        media: null,
        isVisible: false,
    });
    const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
    const containerRef = useRef(null);
    const componentMediaCache = useRef({});
    const contentLayerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [globalModalState, setGlobalModalState] = useState({
        open: false,
        comp: null,
        details: null,
        loading: false,
        onTabChange: null,
        onPlaygroundRedirect: null
    });
    const [showVaultSelector, setShowVaultSelector] = useState(null);
    const [showSuccessScreen, setShowSuccessScreen] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [customExportPath, setCustomExportPath] = useState("_RESOURCES/DATACORE");
    const [playgroundFilePath, setPlaygroundFilePath] = useState("");
    const scrollPosRef = useRef(0);

    // --- LIFECYCLE ---
    useEffect(() => {
        // Pre-warm media index in background while user is on welcome screen
        if (MediaResolver && MediaResolver.preWarm) {
            MediaResolver.preWarm();
        }
    }, []);

    // Scroll locking for global modal
    useEffect(() => {
        if (globalModalState.open) {
            document.body.style.overflow = 'hidden';
            setIsModalOpen(true);
        } else {
            document.body.style.overflow = '';
            setIsModalOpen(false);
        }
    }, [globalModalState.open]);
    const [hasPassedWelcome, setHasPassedWelcome] = useState(false);
    const [navTabs, setNavTabs] = useState([]);
    const [dashboardTitle, setDashboardTitle] = useState("BETO . 888");
    const [dashboardSubtitle, setDashboardSubtitle] = useState("// Accessing Mainframe... Select enigmas to access.");
    const [dashboardCta, setDashboardCta] = useState("[ PROCEED AT YOUR OWN RISK 🫡 ]");

    // --- THEME STATE & SYNC ---
    const [activeSubTab, setActiveSubTab] = useState(0);

    // Reset sub-tab when main section changes
    useEffect(() => {
        setActiveSubTab(0);
    }, [section]);

    // --- THEME INITIALIZATION (Synchronous to prevent racing) ---
    const isThemeManuallySetRef = useRef(false);
    const [localTheme, setLocalTheme] = useState(() => {
        try {
            const indexPath = "_RESOURCES/DATACORE/53.1 Dashboard888/_resources/content/INDEX.bet8.md";
            const file = dc.app.vault.getAbstractFileByPath(indexPath);
            if (file) {
                const cache = dc.app.metadataCache.getFileCache(file);
                const fm = cache?.frontmatter;
                if (fm && fm.theme) {
                    isThemeManuallySetRef.current = true;
                    return fm.theme === 'light' ? 'theme-light' : 'theme-dark';
                }
            }
        } catch (e) {
            console.error("[BETO] Theme Init Error:", e);
        }
        
        const vaultIsDark = document.body.classList.contains('theme-dark');
        return vaultIsDark ? 'theme-dark' : 'theme-light';
    });

    // Sync localTheme with vault theme (only if not manually set)
    useEffect(() => {
        const syncTheme = () => {
            // IF the theme is manually set OR defined in YAML, we do NOT follow the vault
            if (isThemeManuallySetRef.current) {
                return;
            }
            const isDark = document.body.classList.contains('theme-dark');
            const targetTheme = isDark ? 'theme-dark' : 'theme-light';
            
            setLocalTheme(prev => {
                if (prev !== targetTheme) {
                    return targetTheme;
                }
                return prev;
            });
        };

        const observer = new MutationObserver(syncTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const handleToggleTheme = useCallback(async () => {
        const next = localTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
        setLocalTheme(next);
        isThemeManuallySetRef.current = true;
        
        // Persist to INDEX.bet8.md YAML
        const indexPath = "_RESOURCES/DATACORE/53.1 Dashboard888/_resources/content/INDEX.bet8.md";
        const file = dc.app.vault.getAbstractFileByPath(indexPath);
        if (file) {
            await dc.app.fileManager.processFrontMatter(file, (fm) => {
                fm['theme'] = next === 'theme-dark' ? 'dark' : 'light';
            });
        }
    }, [localTheme]);


    // --- DYNAMIC NAVIGATION & IDENTITY PARSER ---
    useEffect(() => {
        let mounted = true;
        const indexPath = "_RESOURCES/DATACORE/53.1 Dashboard888/_resources/content/INDEX.bet8.md";
        
        const loadNav = async () => {
            const file = dc.app.vault.getAbstractFileByPath(indexPath);
            if (!file) return;

            // 1. Parse Identity (Frontmatter)
            const cache = dc.app.metadataCache.getFileCache(file);
            const fm = cache?.frontmatter;
            if (fm && mounted) {
                if (fm.dashboard_title) setDashboardTitle(fm.dashboard_title);
                if (fm.dashboard_subtitle) setDashboardSubtitle(fm.dashboard_subtitle);
                if (fm.dashboard_cta) setDashboardCta(fm.dashboard_cta);
                if (fm.theme) {
                    const yamlTheme = fm.theme === 'light' ? 'theme-light' : 'theme-dark';
                    setLocalTheme(yamlTheme);
                    isThemeManuallySetRef.current = true;
                }
                
            }

            // 2. Parse Navigation (Markdown Content)
            const content = await dc.app.vault.read(file);
            const lines = content.split('\n');
            const tabs = [];
            let currentTab = null;
            const linkRegex = /###### \[(.*?)\]\((.*?)\)/;
            
            for (let line of lines) {
                line = line.trim();
                if (line.startsWith('## ')) {
                    currentTab = { title: line.substring(3).trim(), id: '' };
                    tabs.push(currentTab);
                } else if (line.startsWith('###### [')) {
                    const match = line.match(linkRegex);
                    if (match) {
                        if (currentTab && !currentTab.id) {
                            // Link associated with current header
                            currentTab.id = match[2].trim();
                        } else {
                            // Standalone link becomes its own tab
                            currentTab = { title: match[1], id: match[2].trim() };
                            tabs.push(currentTab);
                        }
                    }
                } else if (currentTab) {
                    if (line.startsWith('[')) {
                        currentTab.subtitle = line.replace(/^\[|\]$/g, '').trim();
                        currentTab.description = currentTab.subtitle; // fallback
                    } else if (line.startsWith('icon:')) {
                        currentTab.icon = line.substring(5).trim();
                    } else if (line.startsWith('file:')) {
                        currentTab.file = line.substring(5).trim();
                    } else if (line.startsWith('path:')) {
                        currentTab.path = line.substring(5).trim();
                    }
                }
            }

            // 3. Resolve Linked File Frontmatter (for covers, descriptions, etc)
            const parentDir = indexPath.substring(0, indexPath.lastIndexOf("/"));
            for (const tab of tabs) {
                if (!tab.id) continue;
                
                // Try to find the linked file: explicitly provided path OR <id>.md in same dir
                let linkedPath = tab.path;
                if (!linkedPath) {
                    linkedPath = `${parentDir}/${tab.id}.md`;
                }

                const linkedFile = dc.app.vault.getAbstractFileByPath(linkedPath);
                if (linkedFile) {
                    const linkedCache = dc.app.metadataCache.getFileCache(linkedFile);
                    const linkedFm = linkedCache?.frontmatter;
                    if (linkedFm) {
                        // Extract cover image if defined
                        if (linkedFm.cover) tab.cover = linkedFm.cover;
                        if (linkedFm.image) tab.cover = linkedFm.image; // Alias
                        
                        // Extract video if defined
                        if (linkedFm.video) tab.video = linkedFm.video;
                        if (linkedFm.file) tab.file = linkedFm.file;

                        // Extract dynamic description if defined
                        if (linkedFm.description) tab.subtitle = linkedFm.description;

                        // --- NEW: Extract dynamic component path & layout ---
                        if (linkedFm.layout_type) tab.layout_type = linkedFm.layout_type;
                        if (linkedFm.showcase_data) tab.showcase_data = linkedFm.showcase_data;
                        if (linkedFm.showcase_details_path) tab.showcase_details_path = linkedFm.showcase_details_path;
                        
                        if (linkedFm.component_path) {
                            const resolve = (p) => {
                                if (typeof p !== 'string') return p;
                                if (p.startsWith('./') || p.startsWith('../') || !p.startsWith('_RESOURCES')) {
                                    const linkedDir = linkedPath.substring(0, linkedPath.lastIndexOf("/"));
                                    if (p.startsWith('./')) return linkedDir + p.substring(1);
                                    else if (p.startsWith('../')) {
                                        let parts = linkedDir.split('/');
                                        let cpParts = p.split('/');
                                        while (cpParts[0] === '..') {
                                            parts.pop();
                                            cpParts.shift();
                                        }
                                        return parts.join('/') + '/' + cpParts.join('/');
                                    } else {
                                        return linkedDir + '/' + p;
                                    }
                                }
                                return p;
                            };

                            let cp = linkedFm.component_path;
                            if (Array.isArray(cp)) {
                                tab.component_path = cp.map(item => ({
                                    ...item,
                                    path: resolve(item.path)
                                }));
                            } else {
                                tab.component_path = resolve(cp);
                            }
                        }
                    }
                }
            }

            if (mounted) {
                setNavTabs(tabs);
            }
        };

        const handleMetaChange = (file) => {
            if (file.path === indexPath) loadNav();
        };

        loadNav();
        const ref = dc.app.metadataCache.on('changed', handleMetaChange);
        
        return () => { 
            mounted = false; 
            dc.app.metadataCache.offref(ref);
        };
    }, []);

    // --- IMPECCABLE STATUS (CHROME SUPPRESSION) ---
    useEffect(() => {
        const styleId = `impeccable-status-dashboard`;
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.innerHTML = `
                /* Hide Inline Titles */
                .inline-title { display: none !important; }
                
                /* Reclaim Edge-to-Edge Space */
                .workspace-leaf-content { 
                    padding: 0 !important; 
                    margin: 0 !important; 
                    border-radius: 0 !important; 
                }
                
                /* Hide the Obsidian status bar & footer */
                .status-bar, .view-footer { display: none !important; }
            `;
            document.head.appendChild(styleEl);
        }
        return () => {
            const el = document.getElementById(styleId);
            if (el) el.remove();
        };
    }, []);

    useEffect(() => {
        // Pre-warm media index in the background
        if (typeof MediaResolver !== 'undefined' && MediaResolver.preWarm) {
            MediaResolver.preWarm();
        }
    }, []);

    const [isSyncing, setIsSyncing] = useState(false);
    const [isReadyToLoad, setIsReadyToLoad] = useState(false);
    const [isMatrixRainOn, setIsMatrixRainOn] = useState(true);

    const [isUpdateUIOpen, setIsUpdateUIOpen] = useState(false);
    const [isRainToggleHovered, setIsRainToggleHovered] = useState(false);

    const [isMediaFullscreen, setIsMediaFullscreen] = useState(false);

    // Preload media index immediately for fast lookups
    useEffect(() => {
        // Build index in background on mount
        requestIdleCallback(() => {
            MediaResolver.buildIndex();
        }, { timeout: 100 });
    }, []);

    const preloadComponentMedia = useCallback(async (componentPath) => {
        if (componentMediaCache.current[componentPath])
            return componentMediaCache.current[componentPath];
        try {
            const file = dc.app.vault.getAbstractFileByPath(componentPath);
            if (!file) return null;
            const content = await dc.app.vault.read(file);
            const componentDir = componentPath.substring(0, componentPath.lastIndexOf("/"));

            // Use the centralized MediaResolver regex patterns
            const imageRegexG = /!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
            const videoRegexG = /<video[^>]*src="([^"]+)"|<source[^>]*src="([^"]+)"/gi;
            
            const mediaFiles = [];
            let m;
            while ((m = imageRegexG.exec(content)) !== null) mediaFiles.push(m[1] || m[2]);
            while ((m = videoRegexG.exec(content)) !== null) mediaFiles.push(m[1] || m[2]);

            if (mediaFiles.length === 0) return null;

            // Use the high-fidelity batch resolver
            const queries = mediaFiles.map(f => ({ query: f, opts: { preferDir: componentDir } }));
            const resolvedPaths = await MediaResolver.resolveBatch(queries);

            const imageSrcs = [];
            let videoSrc = null;

            resolvedPaths.forEach((path, idx) => {
                if (!path) return;
                const raw = mediaFiles[idx].toLowerCase();
                const isVideo = VID_EXTS.some(ext => raw.endsWith(`.${ext}`));
                const isImage = IMG_EXTS.some(ext => raw.endsWith(`.${ext}`));

                if (isVideo && !videoSrc) {
                    videoSrc = path;
                } else if (isImage) {
                    imageSrcs.push(path);
                    // Native browser preload
                    const img = new Image();
                    img.decoding = "async";
                    img.src = path;
                }
            });

            const youtubeMatch = content.match(/<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([^"]+)"/i);
            const iframeMatch = content.match(/<iframe[^>]*src="([^"]+)"/i);
            
            const details = {
                imageSrcs,
                youtubeId: youtubeMatch ? youtubeMatch[1] : null,
                iframeSrc: !youtubeMatch && iframeMatch ? iframeMatch[1] : null,
                videoSrc,
                rawContent: content,
            };

            componentMediaCache.current[componentPath] = details;
            return details;
        } catch (e) {
            console.error(`[Preload] Failed for ${componentPath}:`, e);
            return null;
        }
    }, []);
    const parseShowcaseForPreload = useCallback(async () => {
        const showcasePath = "_RESOURCES/DATACORE/DATACORE.showcase.md";
        const file = dc.app.vault.getAbstractFileByPath(showcasePath);
        if (!file) return [];
        const basePath = showcasePath.substring(0, showcasePath.lastIndexOf("/"));
        const content = await dc.app.vault.read(file);
        const categories = [];
        const categoryRegex = /^## \*\*(.*)\*\*/;
        const componentLinkRegex = /^###### \[([^\]]+)\]\(([^)]+)\)/;
        let current = null;
        for (const raw of content.split("\n")) {
            const line = raw.trim();
            const cm = line.match(categoryRegex);
            const lm = line.match(componentLinkRegex);
            if (cm) {
                current = [];
                categories.push(current);
            } else if (lm && current) {
                current.push(`${basePath}/${decodeURIComponent(lm[2])}`);
            }
        }
        return categories.flat();
    }, []);
    const preloadShowcaseMedia = useCallback(async (config) => {
        for (const slide of config.slides) {
            try {
                await getMediaResourcePath(`${config.videoDir}/${slide.file}`, {
                    preferDir: config.videoDir,
                    preferExts: VID_EXTS,
                });
                const thumbName = config.getThumbName(slide);
                const thumbPath = await getMediaResourcePath(
                    `${config.imageDir}/${thumbName}`,
                    { preferDir: config.imageDir, preferExts: ["webp", ...IMG_EXTS] }
                );
                if (thumbPath) {
                    const img = new Image();
                    img.decoding = "async";
                    img.src = thumbPath;
                }
            } catch (e) { }
        }
    }, []);
    const preloadStartedRef = useRef(false);
    const startBackgroundPreload = useCallback(async () => {
        if (preloadStartedRef.current) return;
        preloadStartedRef.current = true;
        preloadShowcaseMedia({
            slides: [
                { file: "DOC" },
                { file: "DATACORE" },
                { file: "ASSETS" },
                { file: "DEVLOG" },
            ],
            videoDir: "_RESOURCES/VIDEOS",
            imageDir: "_RESOURCES/IMAGES",
            getThumbName: (slide) => `${slide.file}.webp`,
        });
        preloadShowcaseMedia({
            slides: [
                { file: "devlog_1" },
                { file: "devlog_2" },
                { file: "devlog_3" },
                { file: "devlog_4" },
            ],
            videoDir: "_RESOURCES/VIDEOS",
            imageDir: "_RESOURCES/IMAGES",
            getThumbName: (slide) => `DEVLOG_${slide.file.split("_")[1]}.webp`,
        });
        return new Promise(async (resolve) => {
            const paths = await parseShowcaseForPreload();
            const queue = [...paths];
            const pump = async () => {
                const batch = queue.splice(0, 1);
                if (batch.length > 0) {
                    await Promise.all(batch.map(preloadComponentMedia));
                }
                if (queue.length > 0) {
                    if ("requestIdleCallback" in window) {
                        requestIdleCallback(pump, { timeout: 2000 });
                    } else {
                        setTimeout(pump, 300);
                    }
                } else {
                    resolve();
                }
            };
            setTimeout(pump, 2500);
        });
    }, [parseShowcaseForPreload, preloadComponentMedia, preloadShowcaseMedia]);
    const beginFullTransition = useCallback(() => {
        const reduce = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches;
        if (!reduce) setShowWelcomeOverlay(true);
        setHasPassedWelcome(true);
        setDisplayMode("full");
        if (!reduce) setTimeout(() => setShowWelcomeOverlay(false), 480);
    }, []);

    useEffect(() => {
        if (displayMode === "full" && !preloadStartedRef.current) {
            setIsReadyToLoad(true);
        }
    }, [displayMode]);
    useEffect(() => {
        if (isReadyToLoad) {
            // Don't block the UI - just start preloading in the background
            startBackgroundPreload();
        }
    }, [isReadyToLoad, startBackgroundPreload]);

    // --- MODIFICATION START ---
    // This effect now correctly handles TOS state changes without hijacking the initial load.
    useEffect(() => {
        const unsub = subscribeToTosApprovalChanges((approved) => {
            // Only force the UI back to the TOS screen if the user has ALREADY passed the welcome flow
            // and is in the main application. This handles the case where TOS is revoked during use.
            if (!approved && hasPassedWelcome) {
                setHasPassedWelcome(false); // Reset the flag
                setDisplayMode("welcome");
                setWelcomeStep("tos");
            }
        });

        return () => {
            unsub && unsub();
        };
    }, [hasPassedWelcome]); // Depend on `hasPassedWelcome` to re-evaluate the subscription logic
    // --- MODIFICATION END ---

    useEffect(() => {
        const contentEl = contentLayerRef.current;
        if (contentEl) {
            if (isModalOpen) {
                scrollPosRef.current = contentEl.scrollTop;
                contentEl.style.overflow = "hidden";
            } else {
                contentEl.style.overflow = "auto";
                requestAnimationFrame(() => {
                    contentEl.scrollTop = scrollPosRef.current;
                });
            }
        }
    }, [isModalOpen]);



    const LoadingIndicator = ({ isSyncing, label = "Syncing Data..." }) => {
        const STYLES_SYNC = {
            indicator: {
                position: "fixed",
                top: "12px",
                left: "12px",
                zIndex: "1000",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(16, 10, 24, 0.9)",
                backdropFilter: "blur(5px)",
                border: "1px solid var(--glow-faint)",
                borderRadius: "8px",
                padding: "4px 12px",
                color: "var(--text-muted)",
                fontSize: "12px",
                fontVariant: "small-caps",
                transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
                opacity: isSyncing ? 1 : 0,
                transform: isSyncing ? "translateY(0)" : "translateY(-10px)",
                pointerEvents: isSyncing ? "auto" : "none",
            }
        };
        return (
            <div style={STYLES_SYNC.indicator}>
                <OverlayLogo size={20} animated={isSyncing} />
                <span>{label}</span>
            </div>
        );
    };

    const CSS = generateCSS(uniqueWrapperClass);

    // ====================================================================
    // Tightly-Coupled Sub-components (defined inside to access state)
    // ====================================================================

    const headerContent = useMemo(
        () => (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    textAlign: "center",
                }}
            >
                <h1
                    className="headline glitch-text"
                    style={STYLES.h1}
                    data-text={dashboardTitle}
                >
                    {dashboardTitle}
                </h1>
                {displayMode === "full" && (
                    <>
                        <p className="anim-typewriter" style={STYLES.sub}>
                            {dashboardSubtitle}
                        </p>
                        <div style={STYLES.pillbar}>
                            {navTabs.length > 0 ? (
                                navTabs.map((tab) => (
                                    <span
                                        key={tab.id}
                                        className="pill"
                                        style={STYLES.pill}
                                        data-active={section === tab.id ? 1 : 0}
                                        onClick={() => setSectionWithTransition(tab.id)}
                                    >
                                        {[`[ ${tab.title} ]`]}
                                    </span>
                                ))
                            ) : (
                                <span
                                    className="pill"
                                    style={STYLES.pill}
                                    data-active={section === "home" ? 1 : 0}
                                    onClick={() => setSectionWithTransition("home")}
                                >
                                    [ Loading... ]
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        ),
        [displayMode, navTabs, section, setSectionWithTransition, dashboardTitle, dashboardSubtitle]
    );
    const WelcomeCover = () => {
        const reduce = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches;
        return (
            <div className="welcome-cover">
                <div style={{ ...STYLES.shell }}>
                    <MatrixRain
                        spacingFactor={0}
                        mainColor={localTheme === 'theme-light' ? 'oklch(0.45 0.15 300)' : 'oklch(0.82 0.21 300)'}
                        leadColor={localTheme === 'theme-light' ? 'oklch(0.25 0.1 300)' : 'oklch(0.95 0.08 300)'}
                        fadeColor={localTheme === 'theme-light' ? 'rgba(245, 245, 247, 0.15)' : 'rgba(11, 7, 19, 0.15)'}
                        frequency={0.1}
                    />
                    <div className="fx-stage">
                        <div className="fx-grid"></div>
                        <div className="fx-scanlines"></div>
                        <div className="fx-vignette"></div>
                    </div>
                    <div
                        style={{
                            position: "relative",
                            zIndex: 10,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {headerContent}
                    </div>
                </div>
            </div>
        );
    };

    const openModal = useCallback((data) => {
        setGlobalModalState((prev) => ({
            ...prev,
            isDocs: false,      // Reset docs flag
            isDatacore: false,  // Reset datacore flag
            error: null,        // Clear previous errors
            slides: null,       // Reset slides explicitly to prevent state leak
            details: null,      // Reset details explicitly
            content: null,      // Reset content explicitly
            ...data,
            open: true,
            onTabChange: data.onTabChange || setSection,
            onPlaygroundRedirect: data.onPlaygroundRedirect || setPlaygroundFilePath
        }));
    }, [setSection, setPlaygroundFilePath]);

    const closeModal = useCallback(() => {
        setGlobalModalState(s => ({ ...s, open: false }));
    }, []);

    const handleImportToVault = (componentPath, targetVault) => {
        importLogic({
            componentPath,
            targetVault,
            customExportPath,
            setIsImporting,
            setShowVaultSelector,
            setShowSuccessScreen
        });
    };

    const renderSectionContent = () => {
        // Find the current tab metadata to check for dynamic component_path
        const currentTab = navTabs.find(t => t.id === section);
        const activeId = section.includes('.') ? section.split('.').pop().toLowerCase() : section.toLowerCase();

        // Standardized prop injection set for ALL components (modular or registry-based)
        const universalProps = {
            isActive: true,
            setSection: setSection, 
            setSectionWithTransition: setSectionWithTransition,
            navTabs: navTabs,
            isTransitioning: isTransitioning,
            transitionOpacity: transitionOpacity,
            setIsModalOpen: setIsModalOpen,
            isModalOpen: isModalOpen,
            setIsSyncing: setIsSyncing,
            setIsMediaFullscreen: setIsMediaFullscreen,
            OverlayLogo: OverlayLogo,
            LoadingScreen: LoadingScreen,
            styles: STYLES,
            dc: dc,
            localTheme: localTheme,
            
            // Global UI Controls
            openModal: openModal,
            closeModal: closeModal,
            handleImportToVault: handleImportToVault,
            showVaultSelector: showVaultSelector,
            setShowVaultSelector: setShowVaultSelector,
            showSuccessScreen: showSuccessScreen,
            setShowSuccessScreen: setShowSuccessScreen,
            isImporting: isImporting,
            customExportPath: customExportPath,
            setCustomExportPath: setCustomExportPath,

            // State Bridge for Modal Actions
            setActiveTab: setSection,
            setPlaygroundFilePath: setPlaygroundFilePath,
            playgroundFilePath: playgroundFilePath,

            // Legacy support
            DatacorePlayground: DatacorePlayground,
            NFModal: NFModal,
            MarkdownViewer: MarkdownViewer,
            MediaResolver: MediaResolver,
            VID_EXTS: VID_EXTS,
            ContentRenderer: ContentRenderer,
            componentMediaCache: componentMediaCache,
            uniqueWrapperClass: uniqueWrapperClass,
        };

        // --- THE DYNAMIC LAYOUT ENGINE ---
        if (currentTab) {
            const layoutProps = {
                title: currentTab.title,
                description: currentTab.description,
                cover: currentTab.cover,
                getMediaResourcePath: getMediaResourcePath
            };

            // A. Cinematic Showcase Layout (Home, Devlog, etc.)
            if (currentTab.layout_type === 'showcase') {
                return (
                    <ShowcaseLayout 
                        tab={currentTab}
                        navTabs={navTabs}
                        setSectionWithTransition={setSectionWithTransition}
                        setIsMediaFullscreen={setIsMediaFullscreen}
                        setIsModalOpen={setIsModalOpen}
                        styles={universalProps.styles}
                        OverlayLogo={OverlayLogo}
                        openModal={openModal}
                        closeModal={closeModal}
                    />
                );
            }

            // B. Inception Path (Modular Components)
            if (currentTab.component_path) {
                // Handle Multi-Component Tabbed Layout
                if (Array.isArray(currentTab.component_path)) {
                    const subTabs = currentTab.component_path;
                    const activeSub = subTabs[activeSubTab] || subTabs[0];

                    return (
                        <TabLayout 
                            {...layoutProps}
                            subTabs={subTabs}
                            activeSubTab={activeSubTab}
                            setActiveSubTab={setActiveSubTab}
                        >
                            <RemoteModule 
                                key={activeSub.path}
                                path={activeSub.path} 
                                props={universalProps} 
                                LoadingScreen={LoadingScreen}
                                OverlayLogo={OverlayLogo}
                            />
                        </TabLayout>
                    );
                }

                // Standard Single Component Layout (Box)
                return (
                    <BoxLayout {...layoutProps}>
                        <RemoteModule 
                            path={currentTab.component_path} 
                            props={universalProps} 
                            LoadingScreen={LoadingScreen}
                            OverlayLogo={OverlayLogo}
                        />
                    </BoxLayout>
                );
            }
        }
        
        // 2. SECONDARY: Check the hardcoded BETO registry
        const SectionComponent = BETO.sections[activeId];

        if (SectionComponent) {
            return (
                <SectionComponent {...universalProps} />
            );
        }

        // 3. FALLBACK: Section not found or not configured
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>🧩</div>
                <h2 style={{ color: 'var(--glow)', fontVariant: 'small-caps', letterSpacing: '2px' }}>[ Module Not Found: {activeId.toUpperCase()} ]</h2>
                <p style={{ maxWidth: '500px', margin: '10px auto' }}>This section exists in your navigation index but has no component or path assigned.</p>
                <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(var(--background-primary-rgb), 0.3)', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--glow-faint)' }}>
                    <code style={{ fontSize: '11px', color: 'var(--glow)' }}>component_path: path/to/your/component/index.jsx</code>
                </div>
            </div>
        );
    };

    useDashboardDisplayMode({ displayMode, setDisplayMode, containerRef });
    // TOSScreen moved to src/utils/TOSManager.md
    const WelcomeScreen = ({ onContinue }) => {
        useEffect(() => {
            const handle = () => onContinue();
            window.addEventListener("keydown", handle, { once: true });
            window.addEventListener("click", handle, { once: true });
            return () => {
                window.removeEventListener("keydown", handle);
                window.removeEventListener("click", handle);
            };
        }, [onContinue]);
        const reduce = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches;
        return (
            <div style={{ ...STYLES.shell, cursor: "pointer" }}>
                {!reduce && (
                    <MatrixRain 
                        frequency={0.3} 
                        spacingFactor={2} 
                        fadeColor={localTheme === 'theme-light' ? 'rgba(245, 245, 247, 0.15)' : 'rgba(11, 7, 19, 0.15)'}
                        mainColor={localTheme === 'theme-light' ? 'oklch(0.45 0.15 300)' : 'oklch(0.82 0.21 300)'}
                        leadColor={localTheme === 'theme-light' ? 'oklch(0.25 0.1 300)' : 'oklch(0.95 0.08 300)'}
                    />
                )}
                <div className="fx-stage">
                    <div className="fx-grid"></div>
                    <div className="fx-scanlines"></div>
                    <div className="fx-vignette"></div>
                </div>
                {/* --- MODIFICATION START: Removed the veil --- */}
                {/* <div style={STYLES.veil} /> */}
                {/* --- MODIFICATION END --- */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {headerContent}
                    {/* --- FIX: The rogue MatrixRain component that was here has been removed --- */}
                    <div
                        style={{
                            fontSize: "14px",
                            color: "var(--text-muted)",
                            marginTop: "32px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "24px"
                        }}
                    >
                        <OverlayLogo size={60} animated={true} />
                        <span style={{ animation: reduce ? undefined : "pulse 2s infinite" }}>
                            {dashboardCta}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (displayMode) {
            case "welcome":
                if (welcomeStep === "intro") {
                    return (
                        <WelcomeScreen
                            onContinue={async () => {
                                const ok = await isTosApproved();
                                if (ok) {
                                    beginFullTransition();
                                } else {
                                    setWelcomeStep("tos");
                                }
                            }}
                        />
                    );
                }
                if (welcomeStep === "tos") {
                    return (
                        <TOSScreen
                            onAgree={async () => {
                                await writeTosApproval();
                                beginFullTransition();
                            }}
                            STYLES={STYLES}
                            MatrixRain={MatrixRain}
                            localTheme={localTheme}
                        />
                    );
                }
            case "full":
                return (
                    <div className={`anim-boot-in ${uniqueWrapperClass} ${localTheme}`} style={{ ...STYLES.shell }}>
                        <style>{GLOBAL_STYLE_OVERRIDE}</style>
                        <MatrixRain 
                            frequency={isMatrixRainOn ? 0.5 : 0} 
                            spacingFactor={64} 
                            fadeColor={localTheme === 'theme-light' ? 'rgba(245, 245, 247, 0.15)' : 'rgba(11, 7, 19, 0.15)'}
                            mainColor={localTheme === 'theme-light' ? 'oklch(0.45 0.15 300)' : 'oklch(0.82 0.21 300)'}
                            leadColor={localTheme === 'theme-light' ? 'oklch(0.25 0.1 300)' : 'oklch(0.95 0.08 300)'}
                        />

                        {/* --- Dashboard Controls Group --- */}
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 100,
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                        }}>
                            {!isModalOpen && (
                                <SettingsPortal 
                                    setIsModalOpen={setIsModalOpen} 
                                    localTheme={localTheme}
                                    handleToggleTheme={handleToggleTheme}
                                    isMatrixRainOn={isMatrixRainOn}
                                    setIsMatrixRainOn={setIsMatrixRainOn}
                                    isUpdateUIOpen={isUpdateUIOpen}
                                    setIsUpdateUIOpen={setIsUpdateUIOpen}
                                    UpdateIndicator={UpdateIndicator}
                                />
                            )}
                        </div>

                        {/* Global Modal Controllers (Mounted at top level for stability) */}
                        <UpdateIndicator 
                            variant="modal-only" 
                            setIsModalOpen={setIsModalOpen}
                            externalOpen={isUpdateUIOpen} 
                            setExternalOpen={setIsUpdateUIOpen}
                        />

                        <div
                            ref={contentLayerRef}
                            style={{ 
                                ...STYLES.contentLayer,
                                overflowY: (section || '').toLowerCase().endsWith('home') ? 'hidden' : 'auto',
                                paddingBottom: (section || '').toLowerCase().endsWith('home') ? '0' : '24px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Header stays static above the animated content */}
                            {headerContent}

                            <div
                                key={section}
                                className="anim-fade-in-now"
                                style={{
                                    width: "100%",
                                    height: (section || '').toLowerCase().endsWith('home') ? '100%' : 'auto',
                                    display: "flex",
                                    justifyContent: "center",
                                    minHeight: 0,
                                    flex: 1,
                                    position: 'relative' // Added for scoped masking
                                }}
                            >
                                {renderSectionContent()}
                                
                                {/* Scoped Transition Mask */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: localTheme === 'theme-light' ? 'rgba(255,255,255,1)' : 'rgba(10,6,16,1)',
                                    zIndex: 200,
                                    pointerEvents: 'none',
                                    opacity: transitionOpacity,
                                    transition: 'opacity 0.2s ease-in-out'
                                }} />
                            </div>
                        </div>
                        {showWelcomeOverlay && <WelcomeCover />}
                    </div>
                );
            case "standby":
            default:
                return (
                    <div
                        style={{
                            padding: "16px",
                            border: "1px solid var(--glow-faint)",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                            background: "rgba(10,6,16,0.8)",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                color: "var(--text-muted)",
                                fontSize: "14px",
                            }}
                        >
              // System in standby mode.
                        </p>
                        <button
                            className="btn"
                            style={STYLES.btn}
                            onClick={() => setDisplayMode("full")}
                        >
                            INITIATE FULL UI
                        </button>
                    </div>
                );
        }
    };

    const getAvailableVaults = useCallback(() => {
        const vaults = [];
        const currentVaultPath = dc.app.vault.adapter.basePath || "";
        const currentVaultName = dc.app.vault.getName();
        try {
            if (window.require) {
                const electron = window.require('electron');
                const app = electron.remote?.app || electron.app;
                const path = window.require('path');
                const fs = window.require('fs');
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
        } catch (e) { }
        if (vaults.length === 0) vaults.push({ name: currentVaultName, path: currentVaultPath, isCurrent: true });
        return vaults;
    }, []);

    return (
        <div
            ref={containerRef}
            className={`${uniqueWrapperClass} ${localTheme}`}
            style={{ 
                ...STYLES.wrapper
            }}
        >
            <style>{CSS}</style>
            <LoadingIndicator isSyncing={isSyncing} />
            {renderContent()}
            
            {globalModalState.open && (
                <NFModal 
                    state={globalModalState} 
                    onClose={closeModal} 
                    setShowVaultSelector={setShowVaultSelector} 
                    isImporting={isImporting} 
                    onFullscreenChange={setIsMediaFullscreen}
                    setActiveTab={globalModalState.onTabChange}
                    setPlaygroundFilePath={globalModalState.onPlaygroundRedirect}
                    MarkdownViewer={MarkdownViewer}
                    OverlayLogo={OverlayLogo}
                    localTheme={localTheme}
                    section={section}
                    DocsDetailView={DocsDetailView}
                    parseModuleFileContent={parseModuleFileContent}
                    dc={dc}
                    openModal={openModal}
                    styles={STYLES}
                />
            )}

            <VaultSelector 
                showVaultSelector={showVaultSelector}
                setShowVaultSelector={setShowVaultSelector}
                customExportPath={customExportPath}
                setCustomExportPath={setCustomExportPath}
                getAvailableVaults={getAvailableVaults}
                onImport={handleImportToVault}
            />

            <SuccessScreen 
                showSuccessScreen={showSuccessScreen}
                setShowSuccessScreen={setShowSuccessScreen}
            />

            {globalVideoPlayer.isVisible && (
                <GlobalVideoPlayer
                    media={globalVideoPlayer.media}
                    onClose={() =>
                        setGlobalVideoPlayer({ media: null, isVisible: false })
                    }
                />
            )}
        </div>
    );
}

return { ViewComponent_v11: BasicView };
```






