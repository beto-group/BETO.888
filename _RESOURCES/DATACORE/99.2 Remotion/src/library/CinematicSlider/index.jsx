const { useRef, useEffect, useState, useMemo } = dc;

function CinematicSlider({ frame }) {
    // Configuration
    const CARD_COUNT = 8;
    const RADIUS = 400; // 3D cylinder radius

    // Auto-rotation speed based on frame
    const rotationY = frame * 0.5;

    // Mock Data for "Many Videos"
    const items = useMemo(() => {
        return Array.from({ length: CARD_COUNT }).map((_, i) => ({
            id: i,
            color: `hsl(${i * (360 / CARD_COUNT)}, 70%, 50%)`,
            title: `Video ${i + 1}`
        }));
    }, []);

    // Resolve video path (reusing the one we know exists or a placeholder)
    // We'll use a placeholder URL if local not found, or try to load 'aquarium.webm' from siblings
    // For now, let's just make the "Active" one play a video if possible.
    const [videoSrc, setVideoSrc] = useState(null);

    useEffect(() => {
        async function loadVideo() {
            try {
                // Try to find the one we setup in VideoComponent just in case
                // Or looking for specific 3D assets.
                // Let's rely on the VideoComponent's asset for the demo
                const files = await dc.app.vault.getFiles();
                const vid = files.find(f => f.name === 'aquarium.webm');
                if (vid) {
                    setVideoSrc(dc.app.vault.getResourcePath(vid));
                }
            } catch (e) {
                console.error("CinematicSlider: Video load error", e);
            }
        }
        loadVideo();
    }, []);


    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#050505',
            perspective: '1000px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>

            {/* Main Stage */}
            <div style={{
                position: 'relative',
                width: '300px',
                height: '200px',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${-rotationY}deg)`, // Rotate the whole stage against the items
                transition: 'transform 0.1s linear'
                // We actually want the carousel to spin, so we rotate the container
            }}>
                {items.map((item, i) => {
                    const angle = i * (360 / CARD_COUNT);

                    return (
                        <div key={item.id} style={{
                            position: 'absolute',
                            width: '300px',
                            height: '200px',
                            left: 0,
                            top: 0,
                            // Arrange in circle
                            transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
                            background: `linear-gradient(135deg, rgba(20,20,20,0.9), ${item.color})`,
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backfaceVisibility: 'visible', // readable from back? maybe hidden
                            opacity: 0.9
                        }}>
                            {/* Content */}
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px black' }}>
                                {item.title}
                            </div>

                            {/* If looking roughly at front, maybe show preview? */}

                            {/* Reflection effect */}
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: `linear-gradient(to bottom, ${item.color}, transparent)`,
                                transform: 'scaleY(-1)',
                                opacity: 0.2,
                                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0), rgba(0,0,0,0.5))'
                            }} />

                            {/* Show video on one card just to prove it */}
                            {videoSrc && i === 0 && (
                                <video src={videoSrc} autoPlay loop muted style={{
                                    position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
                                    borderRadius: '12px', zIndex: -1, opacity: 0.6
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Central "Hero" Player Description */}
            <div style={{
                position: 'absolute',
                bottom: '50px',
                color: '#888',
                fontFamily: 'Inter, monospace',
                fontSize: '12px'
            }}>
                CINEMATIC CAROUSEL // FRAME {frame}
            </div>
        </div>
    );
}

CinematicSlider.metadata = [
    { id: 'category', type: 'text', default: 'component' }
];

return { CinematicSlider };
