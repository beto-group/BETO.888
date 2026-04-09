const { useRef, useEffect, useState } = dc;

function VideoComponent({ frame, fps, isPlaying }) {
    const videoRef = useRef(null);
    const [videoSrc, setVideoSrc] = useState(null);
    const videoFps = fps || 30; // Default to 30 if not provided

    useEffect(() => {
        // Resolve path relative to component location
        // _folderPath is injected by the loader in src/index.jsx
        const baseDir = VideoComponent._folderPath || '';
        let src = baseDir + '/aquarium.webm';

        const resolve = async () => {
            try {
                // If path is absolute (starts with /), we might need to make it relative to vault
                // But usually _folderPath from listResult comes as relative in Datacore context if root is vault?
                // Let's try to find it.
                const file = dc.app.vault.getAbstractFileByPath(src);
                if (file) {
                    src = dc.app.vault.getResourcePath(file);
                } else {
                    // Fallback check: maybe it's just the file name if in same folder?
                    // Or just log it
                    console.log("VideoComponent: Could not find file object for", src);
                }
            } catch (e) {
                console.error("Failed to resolve video path", e);
            }
            setVideoSrc(src);
        };
        resolve();
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (video && video.duration) {
            const targetTime = frame / videoFps;

            if (isPlaying) {
                // When playing, trust native playback for smoothness instead of micro-managing currentTime
                if (video.paused) {
                    video.play().catch(e => { /* Autoplay block or interruption */ });
                }

                // Only correct if drift is significant (>0.25s) to prevent jitter
                if (Math.abs(video.currentTime - targetTime) > 0.25) {
                    video.currentTime = targetTime;
                }
            } else {
                // When paused, snap exactly to frame
                if (!video.paused) video.pause();

                // Use small threshold for seeking when paused
                if (Math.abs(video.currentTime - targetTime) > 0.05) {
                    video.currentTime = targetTime;
                }
            }
        }
    }, [frame, isPlaying, videoFps]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000'
        }}>
            {videoSrc && (
                <video
                    ref={videoRef}
                    src={videoSrc}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectFit: 'cover',
                        // removed will-change/translateZ preventing rasterization issues on export
                    }}
                    muted
                    playsInline
                // Loop is managed by frame loop, but good to have
                />
            )}
        </div>
    );
}

VideoComponent.metadata = [
    { id: 'category', type: 'text', default: 'component' }, // Can be 'background' or 'component'
    { id: 'videoSrc', type: 'text', default: 'aquarium.webm' }
];

return { VideoComponent };
