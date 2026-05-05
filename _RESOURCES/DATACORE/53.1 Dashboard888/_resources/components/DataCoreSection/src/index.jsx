
const { useEffect, useRef, useState, useCallback, useMemo } = dc;

function DataCoreSection(props) {
    const {
        dc,
        setIsSyncing,
        setIsModalOpen,
        DatacorePlayground,
        NFModal,
        MediaResolver,
        VID_EXTS,
        componentMediaCache,
        styles,
        uniqueWrapperClass,
        setIsMediaFullscreen,
        OverlayLogo,
        folderPath,
        
        // Global UI Controls
        openModal,
        closeModal,
        handleImportToVault,
        showVaultSelector,
        setShowVaultSelector,
        showSuccessScreen,
        setShowSuccessScreen,
        isImporting,
        setActiveTab,
        setPlaygroundFilePath
    } = props;

    const [categories, setCategories] = useState([]);
    const [heroItems, setHeroItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const mountedRef = useRef(true);
    const [activeTab, setActiveTab] = useState('showcase'); // New state for active tab
    const [playgroundFilePath, setPlaygroundFilePath] = useState(""); // Sync with playground
    
    // Scroll position persistence
    const mainScrollPositionRef = useRef(0);
    const rowScrollPositionsRef = useRef({});

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

    const fetchAndCacheComponentMedia = useCallback(async (componentPath) => {
        const cached = componentMediaCache.current[componentPath];
        if (cached && !cached.videoFileName) return cached;
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

            // --- RELATIVE-AWARE RESOLUTION ---
            const parentDir = componentPath.substring(0, componentPath.lastIndexOf("/"));
            const queries = mediaFiles.map(raw => ({ 
                query: raw, 
                opts: { preferDir: parentDir } 
            }));
            const resolvedPaths = await MediaResolver.resolveBatch(queries);
            
            const imageSrcs = [];
            let videoSrc = null;
            
            resolvedPaths.forEach((path, idx) => {
                if (!path) return;
                const raw = mediaFiles[idx];
                const isVideo = VID_EXTS.some(ext => raw.toLowerCase().endsWith(`.${ext}`));
                if (isVideo && !videoSrc) {
                    videoSrc = path;
                } else if (!isVideo) {
                    imageSrcs.push(path);
                }
            });
            
            const result = { imageSrcs, videoSrc };
            componentMediaCache.current[componentPath] = result;
            return result;
        } catch (e) { return null; }
    }, [MediaResolver, VID_EXTS]);

    const extractEntryData = useCallback(
        async (componentPath) => {
            const file = dc.app.vault.getAbstractFileByPath(componentPath);
            if (!file) return null;

            const content = await dc.app.vault.read(file);
            
            let ContentRenderer;
            try {
                const res = await dc.require(dc.headerLink(dc.resolvePath("../../../../src/utils/ContentRenderer.md"), "ContentRenderer"));
                ContentRenderer = res.ContentRenderer;
            } catch (e) {
                console.error("Failed to load ContentRenderer:", e);
            }

            const titleMatch = content.match(/^###\s*Tab:\s*(.+)$/m);
            const title = titleMatch
                ? titleMatch[1].trim()
                : content.match(/^#\s*(.+)$/m)?.[1]?.trim() || file.name.replace(/\.md$/, "");

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
                // Filter out media lines as per institutional standard
                const filtered = txt.split(/\n/)
                    .filter(line => 
                        !line.trim().match(/^!\[.*\]\(.*\)$/) && 
                        !line.trim().match(/^!\[\[.*\]\]$/) && 
                        !line.trim().match(/<iframe/i)
                    )
                    .join('\n').trim();

                if (ContentRenderer) {
                    try {
                        return await ContentRenderer.renderMarkdown(filtered, file.path);
                    } catch (e) {
                        console.error("Render failed:", e);
                    }
                }
                return filtered.replace(/\n/g, '<br/>');
            };

            const descMatch = content.match(/-\s*\*\*Description\*\*:\s*([\s\S]*?)(?:\n-{2,}|(?:\n-\s*\*\*)|(?:\n###)|$)/i);
            const rawDescription = descMatch ? stripBaseIndent(descMatch[1]) : "";

            const doesMatch = content.match(/-\s*\*\*Does\*\*:\s*\n([\s\S]*?)(?=\n-\s*\*\*(?:Can(?:'|’)?t)\*\*:|\n##|\n###|\n####|\n#####|\n######|$)/i);
            const rawDoes = doesMatch ? stripBaseIndent(doesMatch[1]).split(/\n/).filter(line => !line.trim().match(/^!\[.*\]\(.*\)$/) && !line.trim().match(/^!\[\[.*\]\]$/) && !line.trim().match(/<iframe/i)).join('\n').trim() : "";

            const cantMatch = content.match(/-\s*\*\*(?:Can(?:'|’)?t)\*\*:\s*\n([\s\S]*?)(?=\n-\s*\*\*|\n##|\n###|\n####|\n#####|\n######|$)/i);
            const rawCant = cantMatch ? stripBaseIndent(cantMatch[1]).split(/\n/).filter(line => !line.trim().match(/^!\[.*\]\(.*\)$/) && !line.trim().match(/^!\[\[.*\]\]$/) && !line.trim().match(/<iframe/i)).join('\n').trim() : "";

            const disclaimerMatch = content.match(/-\s*\*\*Disclaimer\*\*:\s*\n([\s\S]*?)(?=\n-\s*\*\*|\n##|\n###|\n####|\n#####|\n######|$)/i);
            const rawDisclaimer = disclaimerMatch ? stripBaseIndent(disclaimerMatch[1]).split(/\n/).filter(line => !line.trim().match(/^!\[.*\]\(.*\)$/) && !line.trim().match(/^!\[\[.*\]\]$/) && !line.trim().match(/<iframe/i)).join('\n').trim() : "";

            const [description, doesBlock, cantBlock, disclaimerBlock] = await Promise.all([
                render(rawDescription),
                render(rawDoes),
                render(rawCant),
                render(rawDisclaimer)
            ]);

            const comps = [];
            const compRegex = /^###### \[([^\]]+)\]\(([^)]+)\)/gm;
            let c;
            while ((c = compRegex.exec(content)) !== null) {
                comps.push({ name: c[1].trim(), path: decodeURIComponent(c[2]) });
            }
            
            const media = await fetchAndCacheComponentMedia(componentPath);
            const slides = [];
            if (media?.imageSrcs?.length) {
                for (const src of media.imageSrcs)
                    slides.push({ type: "image", src });
            }
            
            const youtubeRegex = /<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([^"]+)"[^>]*>.*?<\/iframe>/i;
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
        [fetchAndCacheComponentMedia, dc]
    );

    useEffect(() => {
        mountedRef.current = true;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const showcasePath = "_RESOURCES/DATACORE/DATACORE.showcase.md";
                const file = dc.app.vault.getAbstractFileByPath(showcasePath);
                if (!file) throw new Error(`Showcase file not found at: "${showcasePath}"`);
                const basePath = showcasePath.substring(0, showcasePath.lastIndexOf("/"));
                const content = await dc.app.vault.read(file);
                const parsedCategories = parseShowcaseContent(content, basePath);
                const allComponents = parsedCategories.flatMap((c) => c.components);
                const featured = allComponents.filter((c) => c.isFeatured);
                if (mountedRef.current) {
                    setCategories(parsedCategories);
                    setHeroItems(featured.length > 0 ? featured : allComponents);
                    setIsLoading(false);
                    setIsSyncing(false);
                }
            } catch (e) { if (mountedRef.current) { setError(e.message); setIsLoading(false); } }
        };
        load();
        return () => { mountedRef.current = false; };
    }, [parseShowcaseContent, setIsSyncing]);
    
    const onOpenModal = useCallback(
        async (comp) => {
            openModal({ 
                comp, 
                loading: true, 
                onTabChange: setActiveTab, 
                onPlaygroundRedirect: setPlaygroundFilePath 
            });
            const details = await extractEntryData(comp.path);
            if (mountedRef.current) {
                openModal({ 
                    comp, 
                    details, 
                    loading: false, 
                    onTabChange: setActiveTab, 
                    onPlaygroundRedirect: setPlaygroundFilePath 
                });
            }
        },
        [extractEntryData, openModal]
    );

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
                            <div key={item.path} className={`nf-hero-slide ${isActive ? "active" : ""}`}>
                                {media?.videoSrc ? (
                                    <video
                                        ref={(el) => { if (el) videoRefs.current[i] = el; }}
                                        src={media.videoSrc}
                                        muted
                                        playsInline
                                        onEnded={advanceToNext}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2rem' }}
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
                <div key={activeItem.path} className="nf-hero-content anim-fade-in-now">
                    <div className="nf-hero-title">{activeItem.name}</div>
                </div>
                {len > 1 && (
                    <>
                        <div className={`nf-edge nf-left-edge ${isHovered ? "nav-visible" : ""}`} onClick={prev}>
                            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                        </div>
                        <div className={`nf-edge nf-right-edge ${isHovered ? "nav-visible" : ""}`} onClick={next}>
                            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const NFCard = ({ comp, onOpenModal }) => {
        const cardRef = useRef(null);
        const [media, setMedia] = useState(componentMediaCache.current[comp.path]);
        const [isHovered, setIsHovered] = useState(false);
        useEffect(() => {
            if (media) return;
            const node = cardRef.current;
            if (!node) return;
            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) { observer.disconnect(); fetchAndCacheComponentMedia(comp.path).then(m => { if (mountedRef.current) setMedia(m); }); }
            }, { threshold: 0.01, rootMargin: '200px' });
            observer.observe(node);
            return () => observer.disconnect();
        }, [comp.path, media]);
        const cardClasses = ['nf-card'];
        if (comp.isNew) cardClasses.push('nf-badge-new');
        if (comp.isPrototype) cardClasses.push('nf-badge-prototype');
        if (comp.isUpgrade) cardClasses.push('nf-badge-upgrade');
        return (
            <div ref={cardRef} className={cardClasses.join(' ')} onClick={() => onOpenModal(comp)} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                <div className="nf-card-media">
                    {isHovered && media?.videoSrc ? <video key={media.videoSrc} src={media.videoSrc} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : media?.imageSrcs?.[0] ? <img key={media.imageSrcs[0]} src={media.imageSrcs[0]} alt={comp.name} /> : <div className="nf-skel" />}
                </div>
                <div className="nf-card-overlay"><div className="nf-card-title">{comp.name}</div></div>
            </div>
        );
    };

    const Row = ({ title, color, items }) => {
        const scrollerRef = useRef(null);
        const [isHovered, setIsHovered] = useState(false);
        const scrollByAmount = (dir) => { if (scrollerRef.current) scrollerRef.current.scrollBy({ left: dir * 400, behavior: "smooth" }); };
        const sortedItems = useMemo(() => [...items].sort((a, b) => b.isNew - a.isNew), [items]);
        return (
            <div className="nf-row">
                <div className="nf-row-header"><h3 className="nf-row-title" style={{ color }}>{title}</h3></div>
                <div className="nf-row-body" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                    <button className={`nf-row-edge nf-row-left-edge ${isHovered ? "nav-visible" : ""}`} onClick={() => scrollByAmount(-1)}><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg></button>
                    <div className="nf-scroller" ref={scrollerRef}>{sortedItems.map((comp) => <NFCard key={comp.path} comp={comp} onOpenModal={onOpenModal} />)}</div>
                    <button className={`nf-row-edge nf-row-right-edge ${isHovered ? "nav-visible" : ""}`} onClick={() => scrollByAmount(1)}><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg></button>
                </div>
            </div>
        );
    };

    const CSS_NF = `
    .${uniqueWrapperClass} .nf-root {
        width: 100%;
        max-width: 1280px;
        display: flex;
        flex-direction: column;
        gap: 28px;
    }
    .${uniqueWrapperClass} .nf-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        border-bottom: 1px solid var(--glow-faint);
    }
    .${uniqueWrapperClass} .nf-tab-button {
        padding: 8px 16px;
        cursor: pointer;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-weight: 600;
        font-size: 16px;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
    }
    .${uniqueWrapperClass} .nf-tab-button.active {
        color: var(--text-normal);
        border-bottom-color: var(--glow);
    }
    .${uniqueWrapperClass} .nf-hero {
        position: relative;
        width: 100%;
        max-height: 60vh;
        min-height: 40vh;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--glow-faint);
        background: var(--background-primary);
        cursor: pointer;
    }
    .${uniqueWrapperClass} .nf-hero-media {
        position: absolute;
        inset: 0;
    }
    .${uniqueWrapperClass} .nf-hero-media img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: var(--media-filter);
    }
    .${uniqueWrapperClass} .nf-hero-slide {
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.4s ease-in-out;
    }
    .${uniqueWrapperClass} .nf-hero-slide.active {
        opacity: 1;
    }
    .${uniqueWrapperClass} .nf-hero-grad {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(var(--background-primary-rgb), 0) 60%, rgba(var(--background-primary-rgb), 0.9) 100%);
        pointer-events: none;
    }
    .${uniqueWrapperClass} .nf-hero-content {
        position: absolute;
        left: 40px;
        bottom: 40px;
        z-index: 2;
        pointer-events: none;
    }
    .${uniqueWrapperClass} .nf-hero-title {
        font-size: 48px;
        font-weight: 900;
        color: var(--glow);
    }
    .${uniqueWrapperClass} .nf-row {
        position: relative;
        width: 100%;
    }
    .${uniqueWrapperClass} .nf-row-header {
        padding: 0 4px 8px 4px;
    }
    .${uniqueWrapperClass} .nf-row-title {
        font-size: 18px;
        font-weight: 800;
        color: var(--text-normal);
        margin: 0;
        font-variant: small-caps;
    }
    .${uniqueWrapperClass} .nf-row-body {
        position: relative;
    }
    .${uniqueWrapperClass} .nf-scroller {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        scroll-behavior: smooth;
        padding: 4px 0 12px 0;
        scrollbar-width: none;
    }
    .${uniqueWrapperClass} .nf-scroller::-webkit-scrollbar {
        display: none;
    }
    .${uniqueWrapperClass} .nf-row-edge {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 40px;
        z-index: 5;
        color: white;
        cursor: pointer;
        border: none;
        background: transparent;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    .${uniqueWrapperClass} .nf-row-edge.nav-visible {
        opacity: 1;
    }
    .${uniqueWrapperClass} .nf-row-left-edge {
        left: 0;
        background: linear-gradient(to right, rgba(0,0,0,0.7), transparent);
    }
    .${uniqueWrapperClass} .nf-row-right-edge {
        right: 0;
        background: linear-gradient(to left, rgba(0,0,0,0.7), transparent);
    }
    .${uniqueWrapperClass} .nf-edge {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 60px;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        background: rgba(0,0,0,0.3);
    }
    .${uniqueWrapperClass} .nf-edge.nav-visible {
        opacity: 1;
    }
    .${uniqueWrapperClass} .nf-left-edge { left: 0; }
    .${uniqueWrapperClass} .nf-right-edge { right: 0; }
    .${uniqueWrapperClass} .nf-edge svg {
        width: 40px;
        height: 40px;
        stroke: white;
        stroke-width: 2;
        fill: none;
    }
    .${uniqueWrapperClass} .nf-card {
        position: relative;
        flex: 0 0 240px;
        aspect-ratio: 16/9;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--glow-faint);
        background: var(--background-primary);
        cursor: pointer;
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .${uniqueWrapperClass} .nf-card:hover {
        transform: scale(1.07);
        z-index: 2;
        border-color: var(--glow);
    }
    .${uniqueWrapperClass} .nf-card-media {
        position: absolute;
        inset: 0;
    }
    .${uniqueWrapperClass} .nf-card-media img,
    .${uniqueWrapperClass} .nf-card-media video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: var(--media-filter);
    }
    .${uniqueWrapperClass} .nf-card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.8) 100%);
        opacity: 0;
        display: flex;
        align-items: flex-end;
        padding: 10px;
        transition: opacity 0.2s ease;
    }
    .${uniqueWrapperClass} .nf-card:hover .nf-card-overlay {
        opacity: 1;
    }
    .${uniqueWrapperClass} .nf-card-title {
        font-size: 12px;
        color: #fff;
        font-weight: 700;
    }
    .${uniqueWrapperClass} .nf-badge-new::after,
    .${uniqueWrapperClass} .nf-badge-prototype::after,
    .${uniqueWrapperClass} .nf-badge-upgrade::after {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 10px;
        font-weight: 900;
        padding: 3px 7px;
        border-radius: 4px;
        z-index: 3;
    }
    .${uniqueWrapperClass} .nf-badge-new::after {
        content: "NEW";
        background: var(--glow);
        color: #0b0713;
    }
    .${uniqueWrapperClass} .nf-badge-prototype::after {
        content: "PROTO";
        background: var(--text-muted);
        color: white;
    }
    .${uniqueWrapperClass} .nf-badge-upgrade::after {
        content: "UPGRADE";
        background: #2a2a2a;
        color: var(--glow);
    }
    .${uniqueWrapperClass} .nf-skel {
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.05);
        animation: nf-pulse 1.5s infinite;
    }
    @keyframes nf-pulse {
        0% { opacity: 0.5; }
        50% { opacity: 0.8; }
        100% { opacity: 0.5; }
    }
    `;

    if (isLoading) return <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--glow)', gap: '32px', width: '100%' }}>{OverlayLogo && <OverlayLogo size={80} animated={true} />}<span style={{ animation: 'pulse 1.5s infinite', fontVariant: 'small-caps', letterSpacing: '4px', fontSize: '14px', opacity: 0.8 }}>[ LOADING ]</span></div>;
    if (error) return <div style={styles.tile}>Error: {error}</div>;
    return (
        <div className="nf-root" style={{ width: "100%" }}>
            <style>{CSS_NF}</style>
            <div className="nf-tabs">
                <button className={`nf-tab-button ${activeTab === 'showcase' ? 'active' : ''}`} onClick={() => setActiveTab('showcase')}>Sʜᴏᴡᴄᴀsᴇ</button>
                <button className={`nf-tab-button ${activeTab === 'playground' ? 'active' : ''}`} onClick={() => setActiveTab('playground')}>Pʟᴀʏɢʀᴏᴜɴᴅ</button>
            </div>
            {activeTab === 'showcase' && (
                <>
                    <HeroCarousel items={heroItems} onOpenModal={onOpenModal} />
                    {categories.map((cat) => <Row key={cat.name} title={cat.name} color={cat.color} items={cat.components} />)}
                </>
            )}
            {activeTab === 'playground' && <DatacorePlayground initialFilePath={playgroundFilePath} />}
        </div>
    );
}

return DataCoreSection;
