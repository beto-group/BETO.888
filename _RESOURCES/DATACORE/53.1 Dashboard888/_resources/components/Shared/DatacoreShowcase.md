# DatacoreShowcase

```jsx
const { useEffect, useRef, useState, useCallback, useMemo } = dc;

function DatacoreShowcase(props) {
    const {
        dc,
        setIsSyncing,
        setIsModalOpen,
        NFModal,
        MediaResolver,
        VID_EXTS,
        ContentRenderer,
        componentMediaCache,
        styles,
        uniqueWrapperClass,
        OverlayLogo,
        openModal
    } = props;

    const [categories, setCategories] = useState([]);
    const [heroItems, setHeroItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

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
                currentCategory.components.push({
                    name: name.replace(/ { ?(NEW|FEATURED?|PROTOTYPE|UPGRADE) ?}/g, "").trim(),
                    path: `${basePath}/${path}`,
                    isNew: tagsRaw.includes("{ NEW }"),
                    isPrototype: tagsRaw.includes("{ PROTOTYPE }"),
                    isUpgrade: tagsRaw.includes("{ UPGRADE }"),
                    isFeatured: tagsRaw.includes("{ FEATURE }") || tagsRaw.includes("{ FEATURED }"),
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
            const parentDir = componentPath.substring(0, componentPath.lastIndexOf("/"));
            const resolvedPaths = await MediaResolver.resolveBatch(mediaFiles.map(raw => ({ query: raw, opts: { preferDir: parentDir } })));
            const imgPaths = [];
            let videoSrc = null;
            resolvedPaths.forEach((path, idx) => {
                if (!path) return;
                const raw = mediaFiles[idx];
                if (VID_EXTS.some(ext => raw.toLowerCase().endsWith(`.${ext}`)) && !videoSrc) videoSrc = path;
                else imgPaths.push(path);
            });
            const details = { imageSrcs: imgPaths, videoSrc };
            componentMediaCache.current[componentPath] = details;
            return details;
        } catch (e) { return null; }
    }, []);

    const extractEntryData = useCallback(async (componentPath) => {
        const file = dc.app.vault.getAbstractFileByPath(componentPath);
        if (!file) return null;
        const content = await dc.app.vault.read(file);
        const strip = (s) => s ? s.trim() : "";
        
        const titleMatch = content.match(/^###\s*Tab:\s*(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : content.match(/^#\s*(.+)$/m)?.[1]?.trim() || "Entry";
        
        const descMatch = content.match(/-\s*\*\*Description\*\*:\s*([\s\S]*?)(?:\n-{2,}|$)/i);
        const description = descMatch ? await ContentRenderer.renderMarkdown(strip(descMatch[1])) : "";
        
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
            
            // Filter: Only include viewers and components (including src/index.jsx)
            const p = resolvedPath.toLowerCase();
            if (p.includes('.viewer') || p.includes('.component') || p.includes('src/index.jsx')) {
                comps.push({ name: name.trim(), path: resolvedPath });
            }
        }

        const media = await fetchAndCacheComponentMedia(componentPath);
        const slides = [];
        if (media?.imageSrcs?.length) for (const src of media.imageSrcs) slides.push({ type: "image", src });
        if (media?.videoSrc) slides.push({ type: "video", src: media.videoSrc });
        
        return { 
            title, 
            description, 
            comps,
            slides, 
            rawContent: content 
        };
    }, [fetchAndCacheComponentMedia, dc.app.metadataCache, ContentRenderer]);

    useEffect(() => {
        mountedRef.current = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const showcasePath = "_RESOURCES/DATACORE/DATACORE.showcase.md";
                const file = dc.app.vault.getAbstractFileByPath(showcasePath);
                if (!file) throw new Error("Showcase file not found");
                const basePath = showcasePath.substring(0, showcasePath.lastIndexOf("/"));
                const content = await dc.app.vault.read(file);
                const parsedCategories = parseShowcaseContent(content, basePath);
                if (mountedRef.current) {
                    setCategories(parsedCategories);
                    setHeroItems(parsedCategories.flatMap(c => c.components).filter(c => c.isFeatured));
                    setIsLoading(false);
                    if (setIsSyncing) setIsSyncing(false);
                }
            } catch (e) { if (mountedRef.current) { setError(e.message); setIsLoading(false); } }
        };
        load();
        return () => { mountedRef.current = false; };
    }, [parseShowcaseContent, setIsSyncing]);

    const onOpenModal = useCallback(async (comp) => {
        openModal({ comp, loading: true, isDatacore: true, isDocs: false });
        const details = await extractEntryData(comp.path);
        if (mountedRef.current) openModal({ comp, details, loading: false, isDatacore: true, isDocs: false });
    }, [extractEntryData, openModal]);

    const Hero = ({ items }) => {
        const [idx, setIdx] = useState(0);
        if (items.length === 0) return null;
        const activeItem = items[idx];
        return (
            <div className="nf-hero" onClick={() => onOpenModal(activeItem)}>
                <div className="nf-hero-media">
                    {componentMediaCache.current[activeItem.path]?.imageSrcs?.[0] ? <img src={componentMediaCache.current[activeItem.path].imageSrcs[0]} alt={activeItem.name} /> : <div className="nf-skel" />}
                </div>
                <div className="nf-hero-grad" />
                <div className="nf-hero-content"><div className="nf-hero-title">{activeItem.name}</div></div>
            </div>
        );
    };

    const NFCard = ({ comp }) => {
        const [media, setMedia] = useState(componentMediaCache.current[comp.path]);
        useEffect(() => {
            if (!media) fetchAndCacheComponentMedia(comp.path).then(m => { if (mountedRef.current) setMedia(m); });
        }, [comp.path, media]);
        return (
            <div className={`nf-card ${comp.isNew ? 'nf-badge-new' : ''}`} onClick={() => onOpenModal(comp)}>
                <div className="nf-card-media">{media?.imageSrcs?.[0] ? <img src={media.imageSrcs[0]} alt={comp.name} /> : <div className="nf-skel" />}</div>
                <div className="nf-card-overlay"><div className="nf-card-title">{comp.name}</div></div>
            </div>
        );
    };

    const Row = ({ title, color, items }) => (
        <div className="nf-row">
            <div className="nf-row-header"><h3 className="nf-row-title" style={{ color }}>{title}</h3></div>
            <div className="nf-scroller">{items.map(comp => <NFCard key={comp.path} comp={comp} />)}</div>
        </div>
    );

    const CSS = `
        .nf-root { width: 100%; display: flex; flex-direction: column; gap: 28px; }
        .nf-hero { position: relative; width: 100%; height: 40vh; border-radius: 12px; overflow: hidden; border: 1px solid var(--glow-faint); cursor: pointer; }
        .nf-hero-media, .nf-hero-media img { width: 100%; height: 100%; object-fit: contain; }
        .nf-hero-grad { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.8) 100%); }
        .nf-hero-content { position: absolute; left: 40px; bottom: 40px; }
        .nf-hero-title { font-size: 32px; font-weight: 900; color: var(--glow); font-variant: small-caps; }
        .nf-row { width: 100%; }
        .nf-row-title { font-size: 14px; font-weight: 800; margin-bottom: 12px; font-variant: small-caps; letter-spacing: 1px; }
        .nf-scroller { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
        .nf-card { flex: 0 0 200px; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; border: 1px solid var(--glow-faint); cursor: pointer; position: relative; transition: transform 0.2s; }
        .nf-card:hover { transform: scale(1.05); }
        .nf-card-media, .nf-card-media img { width: 100%; height: 100%; object-fit: cover; }
        .nf-card-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%); display: flex; align-items: flex-end; padding: 10px; }
        .nf-card-title { font-size: 11px; color: #fff; font-weight: 700; }
        .nf-badge-new::after { content: "NEW"; position: absolute; top: 8px; right: 8px; background: var(--glow); color: #000; font-size: 9px; font-weight: 900; padding: 2px 5px; border-radius: 3px; }
        .nf-skel { width: 100%; height: 100%; background: rgba(255,255,255,0.05); }
    `;

    if (isLoading) return <div style={{ textAlign: 'center', padding: '40px' }}><OverlayLogo size={40} animated={true} /></div>;

    return (
        <div className="nf-root">
            <style>{CSS}</style>
            <Hero items={heroItems} />
            {categories.map(cat => <Row key={cat.name} title={cat.name} color={cat.color} items={cat.components} />)}
        </div>
    );
}

return { DatacoreShowcase };
```
