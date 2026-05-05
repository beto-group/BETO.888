
# DevlogSection

```jsx
const { useEffect, useRef, useState, useCallback } = dc;
const { Showcase } = await dc.require(dc.headerLink(dc.resolvePath("src/components/Shared/HeroComponents.md"), "HeroComponents"));
const { ContentRenderer } = await dc.require(dc.headerLink(dc.resolvePath("src/utils/ContentRenderer.md"), "ContentRenderer"));
const { MediaResolver, getMediaResourcePath } = await dc.require(dc.headerLink(dc.resolvePath("src/utils/MediaResolver.md"), "MediaResolver"));

const DevLog = ({ setIsSyncing, setIsMediaFullscreen, setIsModalOpen, styles = {}, OverlayLogo, LoadingScreen, openModal }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    const extractDevlogDetails = useCallback(async (slide) => {
        const basePath = "_OPERATION/PUBLIC/DEVLOG/ITI/";
        const fullPath = `${basePath}${slide.fileBasename}`;

        const file = dc.app.vault.getAbstractFileByPath(fullPath);
        if (!file) {
            new Notice(`Could not find devlog file: ${slide.fileBasename}`, 3000);
            return null;
        }

        const fm = dc.app.metadataCache.getFileCache(file)?.frontmatter || {};
        const content = await dc.app.vault.read(file);
        const renderedHtml = await ContentRenderer.renderMarkdown(content);
        
        // Extract internal images from content
        const imageRegexG = /!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
        const rawImgs = [];
        let m;
        while ((m = imageRegexG.exec(content)) !== null)
            rawImgs.push(m[1] || m[2]);

        const imageSlides = (
            await Promise.all(
                rawImgs.map(async (raw) => {
                    const p = await getMediaResourcePath(raw);
                    return p ? { type: "image", src: p } : null;
                })
            )
        ).filter(Boolean);

        const allSlides = [];
        
        // Priority 1: YAML cover/image
        const coverSrc = fm.cover || fm.image || slide.cover;
        if (coverSrc) {
            const p = await getMediaResourcePath(coverSrc);
            if (p) {
                const scl = !isNaN(parseFloat(fm.modal_scale || fm.media_scale || slide.modal_scale)) 
                    ? parseFloat(fm.modal_scale || fm.media_scale || slide.modal_scale) 
                    : 1;
                allSlides.push({ 
                    type: "image", 
                    src: p, 
                    position: fm.modal_position || fm.media_position || slide.modal_position, 
                    scale: scl
                });
            }
        } else {
            // Priority 2: Fallback heuristic thumb
            const thumbPath = await getMediaResourcePath(
                `_RESOURCES/IMAGES/DEVLOG_${slide.file.split("_")[1]}.webp`
            );
            if (thumbPath) {
                allSlides.push({ 
                    type: "image", 
                    src: thumbPath, 
                    position: slide.modal_position, 
                    scale: slide.modal_scale 
                });
            }
        }

        // Add internal images found in content
        allSlides.push(...imageSlides);
        
        // Priority 1: YAML video
        const videoSrcYaml = fm.video || slide.video;
        if (videoSrcYaml) {
            const p = await getMediaResourcePath(videoSrcYaml);
            if (p) {
                const scl = !isNaN(parseFloat(fm.modal_scale || fm.media_scale || slide.modal_scale)) 
                    ? parseFloat(fm.modal_scale || fm.media_scale || slide.modal_scale) 
                    : 1;
                allSlides.push({ 
                    type: "video", 
                    src: p, 
                    position: fm.modal_position || fm.media_position || slide.modal_position, 
                    scale: scl
                });
            }
        } else {
            // Priority 2: Fallback heuristic video (same basename as last image)
            if (rawImgs.length) {
                const lastBase = (
                    rawImgs[rawImgs.length - 1].split("/").pop() || ""
                ).replace(/\.[^.]+$/, "");
                for (const ext of [".mp4", ".webm", ".mov"]) {
                    const candidate = `${lastBase}${ext}`;
                    const vpath = await getMediaResourcePath(candidate);
                    if (vpath) {
                        allSlides.push({ 
                            type: "video", 
                            src: vpath, 
                            position: slide.modal_position, 
                            scale: slide.modal_scale 
                        });
                        break;
                    }
                }
            }
        }

        return {
            title: slide.title,
            description: renderedHtml,
            slides: allSlides,
        };
    }, []);

    const onOpenModal = useCallback(
        async (slide) => {
            if (openModal) {
                openModal({ open: true, details: null, loading: true });
                const details = await extractDevlogDetails(slide);
                if (mountedRef.current) {
                    if (details) {
                        openModal({ open: true, details, loading: false });
                    } else {
                        openModal({ open: false, details: null, loading: false });
                    }
                }
            }
        },
        [extractDevlogDetails, openModal]
    );

    const fetchDevlogList = async () => {
        
        // Only show full loader on first empty mount
        if (logs.length === 0) setIsLoading(true);
        try {
            const MASTER_DEVLOG_PATH = "_OPERATION/PUBLIC/DEVLOG/DEVLOG.md";
            const masterFile = dc.app.vault.getAbstractFileByPath(MASTER_DEVLOG_PATH);
            if (!masterFile) throw new Error(`Master devlog file missing`);
            
            const masterContent = await dc.app.vault.read(masterFile);
            
            const entryLinks = Array.from(masterContent.matchAll(/###### \[([^\]]+)\]\(([^)]+)\)/g)).map(match => ({
                displayName: match[1].trim(),
                fileName: match[2].split('/').pop()
            }));

            if (entryLinks.length === 0) throw new Error("No devlogs found");
            
            // 1. Gather all metadata first
            const preLogs = entryLinks.map(link => {
                const fullPath = `_OPERATION/PUBLIC/DEVLOG/ITI/${link.fileName}`;
                const file = dc.app.vault.getAbstractFileByPath(fullPath);
                const fm = file ? (dc.app.metadataCache.getFileCache(file)?.frontmatter || {}) : {};
                const logNumber = parseInt(link.displayName.toLowerCase().split("-")[1], 10);
                
                return {
                    id: link.displayName,
                    title: link.displayName,
                    fileBasename: link.fileName,
                    fm,
                    logNumber,
                    coverQuery: fm.cover || fm.image || `_RESOURCES/IMAGES/DEVLOG_${logNumber + 1}.webp`
                };
            });

            // 2. Optimistic Update: Show the list with placeholders if covers aren't ready
            const sortedInitial = preLogs.map((p) => ({
                ...p,
                subtitle: p.fm.subtitle || "",
                description: p.fm.description || "",
                cover: null, // Loading state
                video: p.fm.video || null,
                media_position: (p.fm.media_position || "50% 50%").replace(/"/g, ''),
                media_scale: !isNaN(parseFloat(p.fm.media_scale)) ? parseFloat(p.fm.media_scale) : 1,
                modal_position: (p.fm.modal_position || p.fm.media_position || "50% 50%").replace(/"/g, ''),
                modal_scale: !isNaN(parseFloat(p.fm.modal_scale || p.fm.media_scale)) ? parseFloat(p.fm.modal_scale || p.fm.media_scale) : 1,
                file: `devlog_${p.logNumber + 1}`,
                flipMedia: p.id.toLowerCase().startsWith("red"),
            })).sort((a, b) => b.logNumber - a.logNumber);

            if (mountedRef.current) {
                setLogs(sortedInitial);
                setIsLoading(false);
            }

            // 3. Background Resolution: Resolve covers in batches
            const resolveCovers = async () => {
                const mediaStart = performance.now();
                const batches = [];
                for (let i = 0; i < sortedInitial.length; i += 6) {
                    batches.push(sortedInitial.slice(i, i + 6));
                }

                for (const [bIdx, batch] of batches.entries()) {
                    const batchStart = performance.now();
                    const queries = batch.map(p => ({ query: p.coverQuery }));
                    const resolved = await MediaResolver.resolveBatch(queries);
                    if (!mountedRef.current) return;
                    
                    setLogs(current => {
                        const next = [...current];
                        batch.forEach((item, idx) => {
                            const targetIdx = next.findIndex(n => n.id === item.id);
                            if (targetIdx !== -1) {
                                next[targetIdx] = { ...next[targetIdx], cover: resolved[idx] };
                            }
                        });
                        return next;
                    });
                    
                    console.log(`[Devlog] Media Batch ${bIdx + 1} resolved in ${(performance.now() - batchStart).toFixed(2)}ms`);
                    // Yield to browser
                    await new Promise(r => setTimeout(r, 50));
                }
                console.log(`[Devlog] All media resolved in ${(performance.now() - mediaStart).toFixed(2)}ms`);
            };

            if ('requestIdleCallback' in window) {
                requestIdleCallback(resolveCovers);
            } else {
                setTimeout(resolveCovers, 50);
            }

        } catch (e) {
            if (mountedRef.current) {
                setError(e.message);
                setIsLoading(false);
            }
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        // DEFER INITIALIZATION TO PREVENT TRANSITION JANK
        const timer = setTimeout(() => {
            if (mountedRef.current) fetchDevlogList();
        }, 400);

        // Add listener for real-time updates when YAML changes
        const onMetadataChange = (file) => {
            if (file.path.startsWith("_OPERATION/PUBLIC/DEVLOG/ITI/")) {
                fetchDevlogList();
            }
        };
        dc.app.metadataCache.on('changed', onMetadataChange);
        dc.app.vault.on('modify', onMetadataChange);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);
            dc.app.metadataCache.off('changed', onMetadataChange);
            dc.app.vault.off('modify', onMetadataChange);
        };
    }, [setIsSyncing]);

    if (isLoading) {
        return <LoadingScreen label="LOADING" OverlayLogo={OverlayLogo} />;
    }
    if (error) {
        return (
            <div
                style={{
                    ...(styles.tile || {}),
                    width: "100%",
                    maxWidth: "1080px",
                    textAlign: "center",
                    alignItems: "center",
                }}
            >
                <h2 style={{ ...(styles.h2 || {}), color: "oklch(0.75 0.22 25)" }}>
                    Failed to Load Dev Logs
                </h2>
                <p
                    style={{
                        margin: "8px 0 0 0",
                        whiteSpace: "pre-wrap",
                        color: "var(--text-muted)",
                        maxWidth: "600px",
                    }}
                >
                    {error}
                </p>
            </div>
        );
    }

    return (
        <>
            <Showcase
                slides={logs}
                onButtonClick={onOpenModal}
                buttonTextTemplate={(title) => `[ View ${title} Details ]`}
                imageDir="_RESOURCES/IMAGES"
                videoDir="_RESOURCES/VIDEOS"
                getThumbName={(slide) => `DEVLOG_${slide.file.split("_")[1]}.webp`}
                styles={styles}
            />
        </>
    );
};

return { DevLog };

```
