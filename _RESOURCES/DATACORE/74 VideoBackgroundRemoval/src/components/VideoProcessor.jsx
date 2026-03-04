const { React, useState, useEffect, useRef } = dc;

function VideoProcessor({ styles, folderPath, ...props }) {
    const STYLES = styles;
    const [videoSrc, setVideoSrc] = useState(null);
    const [blackThreshold, setBlackThreshold] = useState(40);
    const [boundaryThreshold, setBoundaryThreshold] = useState(150);
    const [mode, setMode] = useState('flood'); // 'flood' or 'simple'
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [resolutionScale, setResolutionScale] = useState(1); // 1 = 100%, 0.5 = 50%

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const processorRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // Load Utils
    useEffect(() => {
        const loadUtils = async () => {
            const { removeBackground, fastKeying } = await dc.require(folderPath + "/src/utils/processorUtils.js");
            processorRef.current = { removeBackground, fastKeying };
        };
        loadUtils();
    }, [folderPath]);

    const handleFileChange = (e) => {
        const file = e.type === 'drop' ? e.dataTransfer.files[0] : e.target.files[0];

        if (file) {
            // Check mime type OR common video extensions
            const isVideo = file.type.startsWith('video/') ||
                /\.(mp4|webm|mov|avi|mkv|ogv)$/i.test(file.name);

            if (isVideo) {
                const url = URL.createObjectURL(file);
                setVideoSrc(url);
                setIsProcessing(false);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e);
    };

    const processFrame = () => {
        if (!videoRef.current || !canvasRef.current || !processorRef.current || videoRef.current.paused || videoRef.current.ended) {
            if (isProcessing) requestAnimationFrame(processFrame);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Ensure canvas matches internal video resolution scaled by user preference
        const targetWidth = Math.floor(video.videoWidth * resolutionScale);
        const targetHeight = Math.floor(video.videoHeight * resolutionScale);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (mode === 'flood') {
            processorRef.current.removeBackground(imageData, {
                blackThreshold,
                boundaryThreshold,
                seedPoints: [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]]
            });
        } else {
            processorRef.current.fastKeying(imageData, blackThreshold);
        }

        ctx.putImageData(imageData, 0, 0);

        if (isProcessing) requestAnimationFrame(processFrame);
    };

    useEffect(() => {
        if (isProcessing) {
            requestAnimationFrame(processFrame);
        }
    }, [isProcessing]);

    const toggleProcessing = () => {
        if (!videoSrc) return;
        if (isProcessing) {
            setIsProcessing(false);
            if (!isExporting) videoRef.current.pause();
        } else {
            setIsProcessing(true);
            videoRef.current.play();
        }
    };

    const handleExport = async () => {
        if (!canvasRef.current || !videoSrc) return;

        if (isExporting) {
            if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
            return;
        }

        const video = videoRef.current;

        // Prepare for 100% resolution export
        if (resolutionScale !== 1) {
            setResolutionScale(1);
            await new Promise(r => setTimeout(r, 150)); // Ensure resize completes
        }

        // Seek to start for a full clip export
        video.pause();
        video.currentTime = 0;

        // Wait for seeking to finish
        await new Promise(r => {
            const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                r();
            };
            video.addEventListener('seeked', onSeeked);
            // Fallback for very short seek
            setTimeout(r, 200);
        });

        const canvas = canvasRef.current;
        const stream = canvas.captureStream(30);

        // Use transparent WebM if supported
        const options = { mimeType: 'video/webm; codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
        }

        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `processed-video-${Date.now()}.webm`;
            a.click();
            a.click();
            setIsExporting(false);

            if (!isProcessing) {
                videoRef.current.pause();
            }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsExporting(true);

        // Start processing and playing
        setIsProcessing(true);
        video.play();
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.header}>
                <div style={STYLES.title}>VIDEO BACKGROUND REMOVAL (BETA)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>ID: 79_VBR</div>
                    <div
                        style={{ cursor: 'pointer', opacity: 0.6, display: 'flex' }}
                        onClick={props.onToggleFullTab}
                        title={props.isFullTab ? "Exit Full Mode" : "Enter Full Mode"}
                    >
                        <dc.Icon icon={props.isFullTab ? "minimize" : "maximize"} style={{ width: "16px", height: "16px" }} />
                    </div>
                </div>
            </div>

            <div style={STYLES.content}>
                <div style={STYLES.previewArea}>
                    <div
                        style={{
                            ...STYLES.canvasContainer,
                            border: isDragging ? '2px dashed #8b5cf6' : STYLES.canvasContainer.border,
                            background: isDragging ? 'rgba(139, 92, 246, 0.05)' : STYLES.canvasContainer.background,
                            backgroundImage: isDragging ? 'none' : STYLES.canvasContainer.backgroundImage,
                            transition: 'all 0.2s'
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {!videoSrc && (
                            <div style={{ color: '#444', textAlign: 'center', zIndex: 1 }}>
                                <dc.Icon icon="video" style={{ width: '48px', height: '48px', marginBottom: '10px', opacity: 0.2 }} />
                                <p>Upload a video to start processing</p>
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                display: videoSrc ? 'block' : 'none',
                                zIndex: 2
                            }}
                        />
                        {/* Hidden hidden video element for source */}
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            style={{ display: 'none' }}
                            loop={!isExporting} // Don't loop during export
                            muted
                            playsInline
                            onEnded={() => {
                                if (isExporting && mediaRecorderRef.current) {
                                    mediaRecorderRef.current.stop();
                                }
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={STYLES.button} onClick={() => document.getElementById('vbr-file').click()}>
                            <dc.Icon icon="upload" style={{ width: '16px' }} />
                            {videoSrc ? 'Change Video' : 'Upload Video'}
                        </button>
                        <input id="vbr-file" type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />

                        {videoSrc && (
                            <button
                                style={{ ...STYLES.button, background: isProcessing ? '#ef4444' : '#10b981' }}
                                onClick={toggleProcessing}
                            >
                                <dc.Icon icon={isProcessing ? "pause" : "play"} style={{ width: '16px' }} />
                                {isProcessing ? 'Stop Preview' : 'Start Preview'}
                            </button>
                        )}

                        {videoSrc && (
                            <button
                                style={{ ...STYLES.button, background: isExporting ? '#db2777' : '#ec4899', flex: 1 }}
                                onClick={handleExport}
                            >
                                <dc.Icon icon={isExporting ? "square" : "download"} style={{ width: '16px' }} />
                                {isExporting ? 'Stop Recording' : 'Export WebM'}
                            </button>
                        )}
                    </div>
                </div>

                <div style={STYLES.controlsArea}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Processing Settings</h3>

                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Removal Mode</label>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '8px', borderRadius: '4px' }}
                        >
                            <option value="flood">Boundary-Aware (Flood Fill)</option>
                            <option value="simple">Simple Luma Key (Fast)</option>
                        </select>
                        <span style={{ fontSize: '10px', color: '#666' }}>
                            {mode === 'flood' ? 'Best for preserving internal shadows inside outlines.' : 'Fastest, but removes all black areas including pupils.'}
                        </span>
                    </div>

                    <div style={STYLES.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label style={STYLES.label}>Black Threshold</label>
                            <span style={{ fontSize: '12px', color: '#8b5cf6' }}>{blackThreshold}</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="100"
                            style={STYLES.range}
                            value={blackThreshold}
                            onChange={(e) => setBlackThreshold(parseInt(e.target.value))}
                        />
                        <span style={{ fontSize: '10px', color: '#666' }}>Sensitivity to what counts as "black" background.</span>
                    </div>

                    {mode === 'flood' && (
                        <div style={STYLES.inputGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label style={STYLES.label}>Boundary Threshold</label>
                                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>{boundaryThreshold}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="255"
                                style={STYLES.range}
                                value={boundaryThreshold}
                                onChange={(e) => setBoundaryThreshold(parseInt(e.target.value))}
                            />
                            <span style={{ fontSize: '10px', color: '#666' }}>Brightness required to stop the transparency fill (white outline).</span>
                        </div>
                    )}
                    <div style={STYLES.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label style={STYLES.label}>Preview Resolution</label>
                            <span style={{ fontSize: '12px', color: '#8b5cf6' }}>{Math.round(resolutionScale * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.1" max="1" step="0.1"
                            style={STYLES.range}
                            value={resolutionScale}
                            onChange={(e) => setResolutionScale(parseFloat(e.target.value))}
                        />
                        <span style={{ fontSize: '10px', color: '#666' }}>Lower resolution for faster processing during preview. Exports are always 100%.</span>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '15px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '5px' }}>INFO</div>
                        <div style={{ fontSize: '10px', color: '#999', lineHeight: '1.4' }}>
                            This algorithm uses 4-point connectivity flood fill. It is performance intensive. If processing lags, reduce preview resolution.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

return { VideoProcessor };
