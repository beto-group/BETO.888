function SaluteOutro(props) {
    const {
        frame = 0,
        fps = 30,
        isPlaying = true,
        videoSrc = "salute.webm",
        interpolate,
        spring,
        RemotionReact = dc.React
    } = props;

    const { useRef, useEffect, useState } = RemotionReact;
    const videoRef = useRef(null);
    const [resolvedSrc, setResolvedSrc] = useState(null);
    const videoFps = fps;

    // Resolve Path
    useEffect(() => {
        const resolve = async () => {
            const baseDir = SaluteOutro._folderPath || '';
            let src = baseDir + '/' + videoSrc;

            try {
                let file = dc.app.vault.getAbstractFileByPath(src);
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

    // Playback Sync
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

    // Animation Logic using bridged API
    const interp = interpolate || ((v, i, o) => o[1]);

    const opacity = interp(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const slnProgress = interp(frame, [60, 120], [0, 1], { extrapolateRight: 'clamp' });

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
                        width: '85%',
                        height: 'auto',
                        minHeight: '85%',
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-25%, -46%)',
                        objectFit: 'cover',
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
