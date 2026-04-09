function TechnicalBreakdown(props) {
    const {
        frame = 0,
        fps = 30,
        isPlaying = true,
        interpolate,
        spring,
        RemotionReact = dc.React
    } = props;

    const { useState, useEffect, useRef } = RemotionReact;

    // Use bridged interpolate or fallback
    const interp = interpolate || ((v, i, o) => o[0]);

    // --- CONFIGURATION ---
    const TRANSCRIPT_TIMING = [
        { start: 0, end: 180, title: "INTRO", text: "We just dropped a video editor built entirely inside Obsidian.", icon: "film" },
        { start: 180, end: 360, title: "WORKFLOW", text: "Antigravity flow: Prompt -> Generate -> Hot-load -> Test.", icon: "zap" },
        { start: 360, end: 540, title: "PROTOTYPE", text: "Could we render a Datacore component inside a video canvas?", icon: "code" },
        { start: 540, end: 720, title: "INTERACTIVITY", text: "The Globe isn't a flat file. It's live code running inside the frame.", icon: "globe" },
        { start: 720, end: 900, title: "TRAILER", text: "Proving the concept with a showcase trailer.", icon: "play" },
        { start: 900, end: 1080, title: "OUTRO & 4K", text: "Resolving technical scaling issues for high-res playback.", icon: "monitor" },
        { start: 1080, end: 1260, title: "THUMBNAIL HACK", text: "Frame 0 is the thumbnail. Seamless autoplay on hover.", icon: "image" },
        { start: 1260, end: 1500, title: "EXPORT", text: "Final assembly in DaVinci Resolve. Hybrid pipeline.", icon: "download" }
    ];

    // --- STATE ---
    const [assets, setAssets] = useState({ cat: null, bg: null });
    const catVideoRef = useRef(null);
    const bgVideoRef = useRef(null);

    // --- ASSET RESOLUTION ---
    useEffect(() => {
        const resolve = async () => {
            const newAssets = { cat: null, bg: null };
            const catPaths = [
                (TechnicalBreakdown._folderPath || '') + '/cat_nobg.webm',
                (TechnicalBreakdown._folderPath || '') + '/cat.webm',
                '78 RemotionClone/src/library/ReactToVideoThumbnail/cat.webm'
            ];
            for (const path of catPaths) {
                const f = dc.app.vault.getAbstractFileByPath(path);
                if (f) {
                    newAssets.cat = dc.app.vault.getResourcePath(f);
                    break;
                }
            }
            const bgPaths = [
                (TechnicalBreakdown._folderPath || '') + '/background.webm',
                '78 RemotionClone/src/library/VideoShowcase/beto_test_trailer.webm'
            ];
            for (const path of bgPaths) {
                const f = dc.app.vault.getAbstractFileByPath(path);
                if (f) {
                    newAssets.bg = dc.app.vault.getResourcePath(f);
                    break;
                }
            }
            setAssets(newAssets);
        };
        resolve();
    }, []);

    // --- VIDEO SYNC LOGIC ---
    useEffect(() => {
        const syncVideo = (videoRef, speed = 1.0) => {
            const video = videoRef.current;
            if (video && video.duration) {
                video.playbackRate = speed;
                const targetTime = ((frame / fps) * speed) % video.duration;
                if (isPlaying) {
                    if (video.paused) video.play().catch(() => { });
                    if (Math.abs(video.currentTime - targetTime) > 0.3) {
                        video.currentTime = targetTime;
                    }
                } else {
                    if (!video.paused) video.pause();
                    if (Math.abs(video.currentTime - targetTime) > 0.05) {
                        video.currentTime = targetTime;
                    }
                }
            }
        };
        syncVideo(catVideoRef, 1.5);
        syncVideo(bgVideoRef, 0.8);
    }, [frame, isPlaying, fps]);

    // --- CURRENT SLIDE LOGIC ---
    const activeSlide = TRANSCRIPT_TIMING.find(s => frame >= s.start && Math.max(0, frame) < s.end) || TRANSCRIPT_TIMING[0];
    const slideDuration = activeSlide.end - activeSlide.start;
    const localFrame = frame - activeSlide.start;

    // animations using official interpolate
    const opacity = interp(localFrame, [0, 15, slideDuration - 15, slideDuration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const slideY = interp(localFrame, [0, 15], [20, 0], { extrapolateRight: 'clamp' });

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#0a0a0a',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Outfit', 'Inter', sans-serif"
        }}>
            {/* BACKGROUND */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                {assets.bg && (
                    <video
                        ref={bgVideoRef}
                        src={assets.bg}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        loop
                        playsInline
                    />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #0a0a0a 100%)' }} />
            </div>

            {/* TALKING CAT */}
            <div style={{
                position: 'absolute',
                bottom: '-50px',
                left: '-150px',
                width: '800px',
                height: '800px',
                zIndex: 10,
                transform: `translateY(${slideY}px) rotate(5deg)`,
                opacity
            }}>
                {assets.cat && (
                    <video
                        ref={catVideoRef}
                        src={assets.cat}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
                        muted
                        loop
                        playsInline
                    />
                )}
            </div>

            {/* OVERLAY */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
                pointerEvents: 'none',
                opacity: 0.3,
                zIndex: 100
            }} />
        </div>
    );
}

TechnicalBreakdown.metadata = [
    { id: 'catSource', type: 'text', default: 'cat_nobg.webm (Auto-resolved)' },
    { id: 'bgSource', type: 'text', default: 'background.webm (Auto-resolved)' },
    { id: 'category', type: 'text', default: 'background' }
];

return { TechnicalBreakdown };
