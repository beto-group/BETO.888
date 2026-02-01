const { useEffect, useRef, useState, useMemo } = dc;

const SafeVideoPlayer = ({ src, style, onLoad, active, folderPath, filePath, preload }) => {
    const videoRef = useRef(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Normalize Source
    const cleanSrc = useMemo(() => {
        if (!src || typeof src !== 'string') return null;
        return src.split('?')[0];
    }, [src]);

    // Playback Control Effect
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (active && !preload) {
            video.play().catch(e => {
                // Initial play often fails due to browser policies if not muted, but we are muted.
                // Or just race conditions.
            });
        } else if (preload) {
            video.pause();
        }
    }, [active, preload]);

    // SIMPLEST IMPLEMENTATION: DIRECT RESOURCE PATH
    useEffect(() => {
        if (!active) return;

        // ... (rest of logic)

        const resolveUrl = async () => {
            // 1. Explicit File Path (Best)
            if (filePath) {
                try {
                    const adapter = dc.app.vault.adapter;
                    // getResourcePath returns 'app://.../file.webm?12345'
                    const rawResource = adapter.getResourcePath(filePath);
                    // STRIP QUERY PARAMS - they confuse the demuxer for local files
                    const cleanResource = rawResource.split('?')[0];
                    setVideoUrl(cleanResource);
                    return;
                } catch (e) {
                    console.warn("[SafeVideo] ResourcePath Error", e);
                }
            }

            // 2. Fallback: Folder Path Guessing
            if (folderPath && cleanSrc && !cleanSrc.startsWith('http')) {
                try {
                    const adapter = dc.app.vault.adapter;
                    const fileName = decodeURIComponent(cleanSrc.split('/').pop());
                    // Remove lead slash from folderPath if present for adapter
                    const baseBase = folderPath.startsWith('/') ? folderPath.substring(1) : folderPath;
                    const baseFolder = decodeURIComponent(baseBase);

                    const candidates = [
                        `${baseFolder}/_resources/videos/${fileName}`,
                        `${baseFolder}/_resources/${fileName}`,
                        `${baseFolder}/${fileName}`
                    ];

                    for (const p of candidates) {
                        const relPath = p.replace(/\/\//g, '/').replace(/^\//, ''); // Normalize
                        if (await adapter.exists(relPath)) {
                            const rawResource = adapter.getResourcePath(relPath);
                            const cleanResource = rawResource.split('?')[0];
                            //  console.log(`[SafeVideo] Resolved: ${relPath} -> ${cleanResource}`);
                            setVideoUrl(cleanResource);
                            return;
                        }
                    }
                } catch (e) { }
            }

            // 3. Default (Http / Raw)
            setVideoUrl(cleanSrc);
        };

        resolveUrl();
    }, [cleanSrc, active, folderPath, filePath]);

    if (!active || !videoUrl) {
        return (
            <div style={{ width: '100%', height: '100%', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
                {active && <div style={{ fontSize: '24px', opacity: 0.2 }}>⏳</div>}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000', ...style }}>
            <video
                key={videoUrl}
                ref={videoRef}
                src={videoUrl}
                style={{
                    width: '100%', height: '100%',
                    objectFit: style.objectFit || 'cover',
                    display: 'block'
                }}
                autoPlay={!preload}
                muted loop playsInline
                preload="auto"
                onLoadedData={onLoad}
                onError={(e) => {
                    const err = e.target.error;
                    console.error(`[SafeVideo] Playback Error for ${videoUrl}:`, err);
                    setErrorMsg("Playback Error");
                }}
            />
            {errorMsg && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171' }}>
                    ⚠️ {errorMsg}
                </div>
            )}
        </div>
    );
};

return { SafeVideoPlayer };
