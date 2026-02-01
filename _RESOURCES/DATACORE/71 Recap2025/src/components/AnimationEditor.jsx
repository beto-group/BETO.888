
const { useState, useRef, useEffect } = dc;

function AnimationEditor() {
    const [videoSrc, setVideoSrc] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
    };

    // Animation Loop Overlay
    useEffect(() => {
        if (!isAnimating || !canvasRef.current || !videoRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        let animationId;
        let startTime = Date.now();

        const render = () => {
            if (!canvasRef.current) return;

            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            const elapsedTime = (Date.now() - startTime) / 1000; // seconds

            ctx.clearRect(0, 0, width, height);

            // Simple bouncy ball animation synced with nothing in particular for now
            const x = (Math.sin(elapsedTime * 2) + 1) * (width / 2);
            const y = (Math.cos(elapsedTime * 3) + 1) * (height / 2);

            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.fill();

            // Text overlay
            ctx.font = '24px Inter';
            ctx.fillStyle = 'white';
            ctx.fillText("Overlay Layer", 20, 40);

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationId);
    }, [isAnimating]);

    // Sync Video and Canvas Size
    const handleVideoLoaded = () => {
        if (videoRef.current && canvasRef.current) {
            canvasRef.current.width = videoRef.current.clientWidth;
            canvasRef.current.height = videoRef.current.clientHeight;
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    style={{ color: '#fff' }}
                />
                <button
                    onClick={() => setIsAnimating(!isAnimating)}
                    disabled={!videoSrc}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        background: isAnimating ? '#ff4444' : '#44ff44',
                        color: '#000',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {isAnimating ? 'Stop Overlay' : 'Start Overlay'}
                </button>
            </div>

            <div style={{
                position: 'relative',
                width: '80%',
                maxWidth: '800px',
                border: '1px solid #333',
                background: '#111',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {!videoSrc && <p style={{ color: '#666' }}>Load a video to begin</p>}

                {videoSrc && (
                    <>
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            controls
                            onLoadedMetadata={handleVideoLoaded}
                            style={{ width: '100%', height: '100%', display: 'block' }}
                        />
                        <canvas
                            ref={canvasRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none' // Allow clicks to pass through to video controls
                            }}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

return { AnimationEditor };
