const { useRef, useEffect, useState } = dc;

function VideoShowcase(props) {
    const {
        frame = 0,
        fps = 30,
        isPlaying = true,
        videoSrc = "beto_test_trailer.webm",
        tiltX = 5,
        tiltY = -10,
        scale = 0.9,
        duration = 1420 // Added duration for fade-out logic
    } = props;

    const videoRef = useRef(null);
    const [resolvedSrc, setResolvedSrc] = useState(null);
    const videoFps = fps;

    // 1. Resolve Path - Identical to VideoComponent
    useEffect(() => {
        const baseDir = VideoShowcase._folderPath || '';
        let src = baseDir + '/' + videoSrc;

        const resolve = async () => {
            try {
                const file = dc.app.vault.getAbstractFileByPath(src);
                if (file) {
                    src = dc.app.vault.getResourcePath(file);
                } else {
                    console.log("VideoShowcase: Could not find file object for", src);
                }
            } catch (e) {
                console.error("VideoShowcase: Failed to resolve video path", e);
            }
            setResolvedSrc(src);
        };
        resolve();
    }, [videoSrc]);

    // 2. Playback Sync - Identical to VideoComponent
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

    // --- Animation Logic (Tilt & Glow) ---
    // Fade out in the last 30 frames
    const fadeOutFrame = duration - 30;
    const opacity = frame > fadeOutFrame
        ? Math.max(0, 1 - (frame - fadeOutFrame) / 30)
        : 1;

    const wiggleRotX = (Math.sin(frame * 0.02) * 2);
    const wiggleRotY = (Math.cos(frame * 0.015) * 3);
    const levitateY = (Math.sin(frame * 0.03) * 10);

    const finalTiltX = tiltX + wiggleRotX;
    const finalTiltY = tiltY + wiggleRotY;
    const glowAngle = (frame * 0.5) % 360;
    const glowPulse = 0.8 + Math.sin(frame * 0.1) * 0.2;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '1200px',
            background: 'transparent',
            opacity: opacity
        }}>
            <div
                style={{
                    position: 'relative',
                    width: '80%',
                    aspectRatio: '16/9',
                    transformStyle: 'preserve-3d',
                    transform: `translateY(${levitateY}px) rotateX(${finalTiltX}deg) rotateY(${finalTiltY}deg) scale(${scale})`,
                    transition: 'transform 0.1s ease-out',
                }}
            >
                {/* Visual Decorations (Glow) */}
                <div style={{
                    position: 'absolute',
                    top: '-6px', left: '-6px', right: '-6px', bottom: '-6px',
                    borderRadius: '24px',
                    background: `conic-gradient(from ${glowAngle}deg, #a855f7 0deg, #ed3ef7 60deg, transparent 90deg, transparent 360deg)`,
                    filter: 'blur(16px)',
                    opacity: glowPulse * 0.9,
                    transform: 'translateZ(-15px)',
                    pointerEvents: 'none'
                }} />

                <div style={{
                    position: 'absolute',
                    top: '-2px', left: '-2px', right: '-2px', bottom: '-2px',
                    borderRadius: '18px',
                    background: `conic-gradient(from ${glowAngle}deg, #a855f7 0deg, #ed3ef7 45deg, transparent 60deg, transparent 360deg)`,
                    transform: 'translateZ(-2px)',
                    pointerEvents: 'none'
                }} />

                {/* Main Card Content */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: '#000',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: `0 30px 60px rgba(0,0,0,0.8)`,
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {/* Glossy Reflection */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(125deg, rgba(255,255,255,0.05) 0%, transparent 40%, transparent 100%)',
                        zIndex: 20,
                        pointerEvents: 'none',
                    }} />

                    {/* Video Player */}
                    {resolvedSrc && (
                        <video
                            ref={videoRef}
                            src={resolvedSrc}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                // removed will-change/translateZ preventing rasterization issues on export
                            }}
                            muted
                            playsInline
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

VideoShowcase.metadata = [
    { id: 'videoSrc', type: 'text', default: 'beto_test_trailer.webm' },
    { id: 'isPlaying', type: 'boolean', default: true },
    { id: 'tiltX', type: 'number', default: 5 },
    { id: 'tiltY', type: 'number', default: -10 },
    { id: 'scale', type: 'number', default: 0.9 }
];

return { VideoShowcase };
