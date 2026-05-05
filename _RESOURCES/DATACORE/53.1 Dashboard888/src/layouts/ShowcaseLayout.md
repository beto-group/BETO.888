
# ShowcaseLayout

```jsx
const { useEffect, useRef, useState, useCallback } = dc;
const { Showcase, LoadingScreen } = await dc.require(dc.headerLink(dc.resolvePath("src/components/Shared/HeroComponents.md"), "HeroComponents"));
const { ContentRenderer } = await dc.require(dc.headerLink(dc.resolvePath("src/utils/ContentRenderer.md"), "ContentRenderer"));
const { getMediaResourcePath } = await dc.require(dc.headerLink(dc.resolvePath("src/utils/MediaResolver.md"), "MediaResolver"));

const ShowcaseLayout = ({ 
    tab, 
    navTabs, 
    setSectionWithTransition, 
    setIsMediaFullscreen, 
    setIsModalOpen, 
    styles = {}, 
    OverlayLogo,
    openModal 
}) => {
    const [slides, setSlides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    // --- DATA EXTRACTION (For Modal Details) ---
    const extractDetails = useCallback(async (slide) => {
        if (!slide.fileBasename) return null;
        
        const getDir = (p) => p && p.includes('/') ? p.substring(0, p.lastIndexOf('/') + 1) : "";
        const dataDir = getDir(tab.showcase_data || "");
        const detailsBase = tab.showcase_details_path || dataDir;
        
        // Robust Path Resolution:
        // 1. Try absolute path relative to detailsBase (using only the filename)
        const fileNameOnly = slide.fileBasename.split('/').pop();
        const pathA = `${detailsBase}${fileNameOnly}`;
        
        // 2. Try exactly as written in the link relative to dataDir
        const pathB = `${dataDir}${slide.fileBasename}`;

        let file = dc.app.vault.getAbstractFileByPath(pathA);
        if (!file) file = dc.app.vault.getAbstractFileByPath(pathB);

        if (!file) {
            console.error(`[ShowcaseLayout] Entry not found. Tried:\n- ${pathA}\n- ${pathB}`);
            return null;
        }

        const content = await dc.app.vault.read(file);
        const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/m);
        let fm = {};
        if (yamlMatch) {
            yamlMatch[1].split(/\r?\n/).forEach(line => {
                const [key, ...valParts] = line.split(':');
                if (key && valParts.length > 0) {
                    fm[key.trim()] = valParts.join(':').trim().replace(/^["']|["']$/g, '');
                }
            });
        }

        const renderedHtml = await ContentRenderer.renderMarkdown(content);
        
        // Extract images from content
        const imageRegexG = /!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
        const rawImgs = [];
        let m;
        while ((m = imageRegexG.exec(content)) !== null) rawImgs.push(m[1] || m[2]);

        const imageSlides = (
            await Promise.all(
                rawImgs.map(async (raw) => {
                    const p = await getMediaResourcePath(raw);
                    return p ? { type: "image", src: p } : null;
                })
            )
        ).filter(Boolean);

        // Thumbnail resolution
        const thumbPath = await getMediaResourcePath(
            tab.showcase_thumb_template ? tab.showcase_thumb_template(slide) : `_RESOURCES/IMAGES/${slide.file}.webp`
        );
        
        const allSlides = [];
        if (thumbPath) {
            allSlides.push({ 
                type: "image", 
                src: thumbPath,
                position: (fm.modal_position || fm.media_position || "50% 50%").replace(/"/g, ''),
                scale: !isNaN(parseFloat(fm.modal_scale || fm.media_scale)) ? parseFloat(fm.modal_scale || fm.media_scale) : 1
            });
        }
        allSlides.push(...imageSlides);
        
        // Video resolution logic
        let videoSrc = null;
        if (rawImgs.length) {
            const lastBase = (rawImgs[rawImgs.length - 1].split("/").pop() || "").replace(/\.[^.]+$/, "");
            for (const ext of [".mp4", ".webm", ".mov"]) {
                const vpath = await getMediaResourcePath(`${lastBase}${ext}`);
                if (vpath) { videoSrc = vpath; break; }
            }
        }
        if (videoSrc) {
            allSlides.push({ 
                type: "video", 
                src: videoSrc,
                position: (fm.modal_position || fm.media_position || "50% 50%").replace(/"/g, ''),
                scale: !isNaN(parseFloat(fm.modal_scale || fm.media_scale)) ? parseFloat(fm.modal_scale || fm.media_scale) : 1
            });
        }

        return {
            title: slide.title,
            description: renderedHtml,
            slides: allSlides,
        };
    }, [tab]);

    const onOpenModal = useCallback(async (slide) => {
        // If it's a simple navigation slide (like in Home), just navigate
        if (tab.showcase_data === 'index') {
            setSectionWithTransition(slide.id);
            return;
        }
        
        if (openModal) {
            // Otherwise, open the modal for details
            openModal({ open: true, details: null, loading: true });
            const details = await extractDetails(slide);
            if (mountedRef.current) {
                if (details) {
                    openModal({ open: true, details, loading: false });
                } else {
                    openModal({ open: false, details: null, loading: false });
                }
            }
        }
    }, [tab.showcase_data, setSectionWithTransition, extractDetails, openModal]);

    const slidesRef = useRef(slides);
    useEffect(() => { slidesRef.current = slides; }, [slides]);

    // --- SLIDE LOADING ---
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            if (tab.showcase_data === 'index') {
                const indexSlides = navTabs.filter(t => {
                    const id = (t.id || '').toLowerCase();
                    const title = (t.title || '').toLowerCase();
                    return !id.endsWith('home') && !title.endsWith('home');
                }).map(t => ({
                    ...t,
                    description: t.id === 'docs' ? (
                        <>Further Enhance Your <span className="flicker-text" data-original-text="Knowledge">Knowledge</span></>
                    ) : t.id === 'devlog' ? (
                        <>Monthly Expansions with <span className="new-toy-glow">New Shiny Toys</span></>
                    ) : t.subtitle,
                    flipMedia: t.id === 'devlog'
                }));
                if (mountedRef.current) {
                    setSlides(indexSlides);
                }
            } else if (tab.showcase_data) {
                const file = dc.app.vault.getAbstractFileByPath(tab.showcase_data);
                if (!file) throw new Error(`Showcase data file not found: ${tab.showcase_data}`);
                
                const content = await dc.app.vault.read(file);
                const linkRegex = /^###### \[([^\]]+)\]\(([^)]+)\)/gm;
                const entries = [];
                let match;
                while ((match = linkRegex.exec(content)) !== null) {
                    entries.push({
                        displayName: match[1].trim(),
                        fileName: match[2].trim(),
                    });
                }

                // 1. Initial Map (Fast, no media resolution yet)
                const initialSlides = entries.map((e) => {
                    const nameParts = e.displayName.toLowerCase().split("-");
                    const logNumber = parseInt(nameParts[1], 10);
                    
                    const fullPath = `_OPERATION/PUBLIC/DEVLOG/ITI/${e.fileName.split('/').pop()}`;
                    const file = dc.app.vault.getAbstractFileByPath(fullPath);
                    const fm = file ? (dc.app.metadataCache.getFileCache(file)?.frontmatter || {}) : {};

                    return {
                        id: e.displayName,
                        title: e.displayName,
                        fileBasename: e.fileName,
                        subtitle: fm.subtitle || "",
                        description: fm.description || "",
                        cover: fm.cover,
                        video: fm.video,
                        media_position: (fm.media_position || "50% 50%").replace(/"/g, ''),
                        media_scale: !isNaN(parseFloat(fm.media_scale)) ? parseFloat(fm.media_scale) : 1,
                        modal_position: (fm.modal_position || fm.media_position || "50% 50%").replace(/"/g, ''),
                        modal_scale: !isNaN(parseFloat(fm.modal_scale || fm.media_scale)) ? parseFloat(fm.modal_scale || fm.media_scale) : 1,
                        file: isNaN(logNumber) ? e.displayName : `devlog_${logNumber + 1}`,
                        flipMedia: nameParts[0] === "red",
                    };
                });
                
                if (tab.showcase_data.toLowerCase().includes('devlog')) {
                     initialSlides.sort((a, b) => {
                        const numA = parseInt(a.id.split("-")[1], 10);
                        const numB = parseInt(b.id.split("-")[1], 10);
                        return (numB || 0) - (numA || 0);
                    });
                }

                if (mountedRef.current) {
                    setSlides(initialSlides);
                    if (!silent) setIsLoading(false);
                }
            }
        } catch (e) {
            if (mountedRef.current) setError(e.message);
        } finally {
            if (mountedRef.current && !silent) setIsLoading(false);
        }
    }, [tab.showcase_data, navTabs]);

    useEffect(() => {
        // DEFER TO PREVENT JANK
        const timer = setTimeout(() => {
            if (mountedRef.current) loadData();
        }, 400);

        const onFileChange = async (file) => {
            if (file.path.startsWith("_OPERATION/PUBLIC/DEVLOG/ITI/")) {
                loadData(true); // Silent update for the list
                
                // Use Refs to bypass stale closure
                const currentSlides = slidesRef.current;
                const fileName = file.name;
                
                // Note: With global modal, we don't have direct access to its state here easily
                // but we can at least refresh the list.
            }
        };
        dc.app.metadataCache.on('changed', onFileChange);
        dc.app.vault.on('modify', onFileChange);

        return () => { 
            mountedRef.current = false; 
            dc.app.metadataCache.off('changed', onFileChange);
            dc.app.vault.off('modify', onFileChange);
        };
    }, [tab.showcase_data, navTabs]);

    if (isLoading) {
        return <LoadingScreen label="LOADING" OverlayLogo={OverlayLogo} />;
    }

    if (error) {
        return (
            <div style={{ ...(styles.tile || {}), width: "100%", maxWidth: "1080px", textAlign: "center", alignItems: "center" }}>
                <h2 style={{ ...(styles.h2 || {}), color: "oklch(0.75 0.22 25)" }}>Failed to Load Showcase</h2>
                <p style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap", color: "var(--text-muted)", maxWidth: "600px" }}>{error}</p>
            </div>
        );
    }

    return (
        <>
            <Showcase
                slides={slides}
                onButtonClick={onOpenModal}
                buttonTextTemplate={(title) => tab.showcase_btn_template ? tab.showcase_btn_template(title) : `[ Access ${title} ]`}
                imageDir="_RESOURCES/IMAGES"
                videoDir="_RESOURCES/VIDS"
                getThumbName={(slide) => {
                    if (tab.showcase_data === 'index') return `${slide.file}.webp`;
                    if (tab.showcase_data.toLowerCase().includes('devlog')) return `DEVLOG_${slide.file.split("_")[1]}.webp`;
                    return `${slide.file}.webp`;
                }}
                styles={styles}
            />
        </>
    );
};

return { ShowcaseLayout };

```
