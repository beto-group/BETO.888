const { useRef, useEffect, useState } = dc;

/**
 * SaluteOutro: A clean, borderless video player for the finale.
 * Refactored for pure 1:1 pixel mapping (no scale transforms) to maximize export quality.
 */
function SaluteOutro(props) {
    const {
        frame = 0,
        fps = 30,
        isPlaying = true,
        videoSrc = "salute.webm",
    } = props;

    const videoRef = useRef(null);
    const [resolvedSrc, setResolvedSrc] = useState(null);
    const videoFps = fps;

    // 1. Resolve Path - Identical to VideoComponent
    useEffect(() => {
        const resolve = async () => {
            const baseDir = SaluteOutro._folderPath || '';
            let src = baseDir + '/' + videoSrc;

            try {
                // Try direct path first
                let file = dc.app.vault.getAbstractFileByPath(src);

                // Fallback: try global search if not found
                if (!file) {
                    file = dc.app.vault.getAbstractFileByPath(videoSrc);
                }

                if (file) {
                    setResolvedSrc(dc.app.vault.getResourcePath(file));
                }
            } catch (e) {
                console.error("SaluteOutro: Resolution error", e);
            }
        };
        resolve();
    }, [videoSrc]);

    // 2. Playback Sync - EXACT sync from VideoComponent
    useEffect(() => {
        const video = videoRef.current;
        if (video && video.duration) {
            const targetTime = frame / videoFps;

            if (isPlaying) {
                if (video.paused) {
                    video.play().catch(e => { });
                }
                if (Math.abs(video.currentTime - targetTime) > 0.25) {
                    video.currentTime = targetTime;
                }
            } else {
                if (!video.paused) video.pause();
                if (Math.abs(video.currentTime - targetTime) > 0.05) {
                    video.currentTime = targetTime;
                }
            }
        }
    }, [frame, isPlaying, videoFps]);

    // 3. Animation Logic
    const opacity = Math.min(frame / 30, 1);
    const slnProgress = Math.min(Math.max((frame - 60) / 60, 0), 1);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            opacity,
            fontFamily: "'Outfit', sans-serif",
            overflow: 'hidden',
            position: 'relative'
        }}>
            {resolvedSrc && (
                <video
                    ref={videoRef}
                    src={resolvedSrc}
                    style={{
                        // Use pure sizing and object-position to frame the video
                        // allowing 1:1 pixel rendering without CSS scale transforms
                        width: '120%', // Zoom in (replacing scale 0.85 logic mostly inverse but adjusted)
                        // Actually, previous scale was 0.85 (zoomed OUT), so width should be smaller?
                        // Wait, scale(0.85) shrinks it. So 100% width becomes 85% visual width.
                        // To achieve the same framing without transform scale:
                        // If we want it smaller, we set width < 100%.
                        // BUT, to center pixel-perfectly, we'll use object position.

                        // Wait, if it was scale(0.85), it was shrinking the video to 85% of its size.
                        // And center-shifted by 25%.

                        // Let's try to map the transform logic to native object-fit sizing
                        // transform: scale(0.85) translateX(25%) translateY(4%)
                        // This means the video was smaller and shifted right and down.

                        width: '85%',
                        height: 'auto',
                        minHeight: '85%',

                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        // Simulate the translate offset + centering
                        // translateX(25%) moves it 25% of its width to right.
                        // translateY(4%) moves it 4% of its height down.

                        // Standard center is translate(-50%, -50%).
                        // We add 25% to X -> translate(-25%, -50%)
                        // We add 4% to Y -> translate(-50%, -46%)
                        transform: 'translate(-25%, -46%)',

                        objectFit: 'cover',
                        // filter: 'drop-shadow(0 0 60px rgba(0,0,0,0.8))' // Removed for sharp 4K export
                    }}
                    muted
                    playsInline
                />
            )}

            {/* Premium SLN Call to Action Bar */}
            <div style={{
                position: 'absolute',
                bottom: '100px',
                left: '50%',
                transform: `translateX(-50%) translateY(${(1 - slnProgress) * 20}px)`,

                display: 'flex',
                gap: '40px',
                opacity: slnProgress,
                alignItems: 'center',
                padding: '18px 50px',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(30px) saturate(200%)',
                borderRadius: '100px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                transition: 'all 0.3s ease',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                    <dc.Icon icon="bell" style={{ width: '22px', height: '22px', color: '#a855f7' }} />
                    <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '1px' }}>SUBSCRIBE</span>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                    <dc.Icon icon="heart" style={{ width: '22px', height: '22px', color: '#f43f5e' }} />
                    <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '1px' }}>LIKE</span>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                    <dc.Icon icon="bell-ring" style={{ width: '22px', height: '22px', color: '#fbbf24' }} />
                    <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '1px' }}>NOTIFY</span>
                </div>
            </div>
        </div>
    );
}

SaluteOutro.metadata = [
    { id: 'videoSrc', type: 'text', default: 'salute.webm' },
    { id: 'isPlaying', type: 'boolean', default: true }
];

return { SaluteOutro };
