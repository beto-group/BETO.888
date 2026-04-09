const { React, useRef, useState, useEffect } = dc;

/**
 * ReactToVideoThumbnail
 * A high-energy thumbnail scene focused on "React to Video" capabilities.
 * Features:
 * - Massive "REACT" text with per-letter purple wave & scale animation.
 * - "VIDEO" text triggers glitch effect after the wave passes.
 * - Global "Disappear" glitch effect at the end.
 * - Integrated massive assets (Cat & Logo).
 * - 3D Extrusion Effect for ALL Typography elements.
 */
function ReactToVideoThumbnail(props) {
    const {
        frame = 0,
        fps = 30,
        isPlaying = true
    } = props;

    // Asset Resolution State
    const [assets, setAssets] = useState({ cat: null, logo: null });
    const catVideoRef = useRef(null);

    // --- ANIMATED LOGO LOGIC ---
    const getRot = (f, s = 1, rev = false) => {
        const deg = (f * s * (360 / 300)) % 360;
        return rev ? -deg : deg;
    };
    const rotTopOuter = getRot(frame, 0.5);
    const rotTopInner = getRot(frame, 0.5, true);
    const rotBLOuter = getRot(frame, 0.4, true);
    const rotBLInner = getRot(frame, 0.4);
    const rotBROuter = getRot(frame, 0.6);
    const rotBRInner = getRot(frame, 0.6, true);

    // Resolve Assets
    useEffect(() => {
        const resolve = async () => {
            const baseDir = ReactToVideoThumbnail._folderPath || '';
            const newAssets = { cat: null, logo: null };

            try {
                let catFile = dc.app.vault.getAbstractFileByPath(baseDir + '/cat.webm');
                if (catFile) newAssets.cat = dc.app.vault.getResourcePath(catFile);

                let logoFile = dc.app.vault.getAbstractFileByPath(baseDir + '/obsidian.png');
                if (logoFile) newAssets.logo = dc.app.vault.getResourcePath(logoFile);

                setAssets(newAssets);
            } catch (e) {
                console.error("ReactToVideoThumbnail: Asset resolution error", e);
            }
        };
        resolve();
    }, []);

    // Sync Cat Video Playback - ROBUST SYNC
    useEffect(() => {
        const video = catVideoRef.current;
        const playbackSpeed = 2.0;

        if (video) {
            video.playbackRate = playbackSpeed;

            // Only sync if we have metadata (duration)
            if (video.duration) {
                // Determine where we should be: (Time * Speed) % Duration (for looping)
                const targetTime = ((frame / fps) * playbackSpeed) % video.duration;

                if (isPlaying) {
                    if (video.paused) video.play().catch(() => { });

                    // Allow small drift (0.25s), otherwise snap
                    if (Math.abs(video.currentTime - targetTime) > 0.3) {
                        video.currentTime = targetTime;
                    }
                } else {
                    if (!video.paused) video.pause();
                    // Precise seek when paused
                    if (Math.abs(video.currentTime - targetTime) > 0.05) {
                        video.currentTime = targetTime;
                    }
                }
            }
        }
    }, [frame, isPlaying, fps]);

    // Helper functions
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    // --- 3D HELPER ---
    const create3DShadow = (depth, color, shadowOpacity = 0.6) => {
        let shadow = '';
        for (let i = 1; i <= depth; i++) {
            shadow += `${i}px ${i}px 0px ${color}`;
            if (i < depth) shadow += ', ';
        }
        // Add final drop shadow for grounding
        shadow += `, ${depth + 5}px ${depth + 5}px 30px rgba(0,0,0,${shadowOpacity})`;
        return shadow;
    };

    // --- PHASE 1: REACT WAVE (0 - 120 frames) ---
    // Wave travels across 5 letters. 
    const reactText = "REACT";

    // --- PHASE 2: VIDEO GLITCH (120 - 500 frames) ---
    const glitchStart = 120;
    const isVideoGlitching = frame > glitchStart && frame < 500;

    // --- PHASE 3: GLOBAL DISAPPEAR (500+ frames) ---
    const disappearStart = 500;
    const disappearDuration = 30;
    const isDisappearing = frame > disappearStart;
    const disappearProgress = clamp((frame - disappearStart) / disappearDuration, 0, 1);

    // Global Exit Math
    const globalGlitchTrigger = isDisappearing && Math.random() > 0.5;
    const globalGlitchX = globalGlitchTrigger ? (Math.random() - 0.5) * 40 : 0;
    const globalGlitchSkew = globalGlitchTrigger ? (Math.random() - 0.5) * 20 : 0;
    const blurAmount = isDisappearing ? disappearProgress * 20 : 0;
    const scaleExit = 1 + (disappearProgress * 0.5);
    const opacityExit = 1 - disappearProgress;

    // Render "REACT" letters with wave logic AND 3D Extrusion
    const renderReactLetters = () => {
        return reactText.split('').map((char, index) => {
            // Wave Logic:
            // Calculate a "heat" value for this letter based on frame
            // Peak moves from index 0 to 4 over frames 0-40
            const waveSpeed = 15; // Frames per letter peak (Slower wave)
            const peakFrame = index * waveSpeed + 22; // Start at frame 22 (Delayed by 22 frames)
            const distFromPeak = Math.abs(frame - peakFrame);

            // Effect strength (1.0 = peak, 0.0 = none)
            // Influence window is +/- 15 frames for softer falloff
            let effect = Math.max(0, 1 - (distFromPeak / 15));

            // If dragging on too long or frame > 120, kill it smoothly
            if (frame > 120) effect = 0;

            const scale = 1 + (effect * 0.1);
            const color = effect > 0.5 ? '#a78bfa' : '#e5e5e5'; // Lighter purple flash

            // 3D Shadow Stack generator (Depth 12)
            const depth = 12;
            const shadowColor = effect > 0.5 ? '#5b21b6' : '#525252';
            const shadowStack = create3DShadow(depth, shadowColor);

            return (
                <span key={index} style={{
                    fontSize: '250px', // Massive Base Size
                    fontWeight: '900',
                    fontStyle: 'italic', // Italic helps 3D feel
                    color: color,
                    lineHeight: '0.85',
                    display: 'inline-block',
                    transform: `scale(${scale}) translateY(${effect * -20}px) translateZ(50px)`, // Z-translate for true depth feeling
                    transformOrigin: 'center center',
                    textShadow: shadowStack,
                    letterSpacing: '-8px',
                    transition: 'color 0.1s, text-shadow 0.1s', // Smooth color blend
                    WebkitTextStroke: '2px rgba(255,255,255,0.1)' // Subtle highlight edge
                }}>
                    {char}
                </span>
            );
        });
    };

    // Video Text Glitch Styles + 3D
    // Merge glitch offsets WITH 3D shadow for chaos
    const baseVideoShadow = create3DShadow(10, '#333');

    const videoGlitchStyles = isVideoGlitching ? {
        textShadow: `${(Math.random() - 0.5) * 10}px ${(Math.random() - 0.5) * 10}px 0px #8b5cf6, ${baseVideoShadow}`, // Glitch ON TOP of 3D
        transform: `translateX(${(Math.random() - 0.5) * 5}px) translateZ(20px)`, // Keep Z depth
        color: Math.random() > 0.8 ? '#8b5cf6' : '#fff'
    } : {
        textShadow: baseVideoShadow,
        transform: 'translateZ(20px)' // Base depth
    };

    // Middle Text "TO" 3D Style
    const middleShadow = create3DShadow(6, '#4c1d95'); // Purple extrusion for "TO"

    const STYLES = {
        container: {
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            overflow: 'hidden',
            position: 'relative',
            perspective: '1000px' // Perspective for 3D elements
        },
        borderFrame: {
            position: 'absolute',
            top: '40px',
            left: '40px',
            right: '40px',
            bottom: '40px',
            border: '24px solid #8b5cf6', // Thicker 24px
            boxShadow: `0 0 50px rgba(139, 92, 246, ${0.4 * opacityExit})`,
            zIndex: 10,
            pointerEvents: 'none',
            opacity: opacityExit
        },
        maskLayer: {
            position: 'absolute',
            top: '40px',
            left: '40px',
            right: '40px',
            bottom: '40px',
            overflow: 'hidden',
            zIndex: 5,
            opacity: opacityExit
        },
        contentWrapper: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            position: 'absolute',
            bottom: '150px',
            right: '300px',
            zIndex: 20,
            transform: `scale(${scaleExit}) skew(${globalGlitchSkew}deg) translateX(${globalGlitchX}px)`,
            filter: `blur(${blurAmount}px)`,
            opacity: opacityExit
        },
        letterRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transform: 'rotateY(-15deg) rotateX(10deg)', // Global 3D skew for entire word
            transformStyle: 'preserve-3d'
        },
        subtitleWrapper: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            marginTop: '-15px',
            marginRight: '25px',
            zIndex: 11,
            transform: 'rotateY(-15deg) rotateX(10deg)', // Match main text perspective
            transformStyle: 'preserve-3d'
        },
        middleText: {
            fontSize: '40px',
            fontWeight: '900',
            color: '#8b5cf6',
            textTransform: 'uppercase',
            margin: '0',
            letterSpacing: '2px',
            textShadow: middleShadow, // Applied 3D
            marginRight: '10px',
            transform: 'translateZ(30px)' // Depth for "TO"
        },
        bottomText: {
            fontSize: '60px',
            fontWeight: '900',
            color: '#fff',
            letterSpacing: '12px',
            margin: '5px 0 0 0',
            textTransform: 'uppercase',
            position: 'relative'
            // videoGlitchStyles applied via spread in JSX below
        }
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.borderFrame} />

            {/* Mask Layer for Cat */}
            <div style={STYLES.maskLayer}>
                {assets.cat && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-150px',
                        left: '-250px',
                        width: '1450px',
                        height: 'auto',
                        transform: `scale(${scaleExit})`,
                        filter: `blur(${blurAmount}px)`
                    }}>
                        <video
                            ref={catVideoRef}
                            src={assets.cat}
                            style={{ width: '100%', borderRadius: '12px' }}
                            muted
                            loop
                            playsInline
                        />
                    </div>
                )}
            </div>

            {/* Animated Obsidian Logo (Top Right) */}
            {assets.logo && (
                <div style={{
                    position: 'absolute',
                    top: '60px',
                    right: '110px',
                    width: '400px',
                    height: '400px',
                    zIndex: 5,
                    opacity: opacityExit,
                    transform: `scale(${scaleExit}) translateY(${Math.sin(frame * 0.05) * 10}px)`,
                    filter: `blur(${blurAmount}px)`
                }}>
                    <img
                        src={assets.logo}
                        style={{
                            width: '130%',
                            height: '130%',
                            objectFit: 'contain',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            opacity: 1,
                            zIndex: 1
                        }}
                        alt="Obsidian Logo"
                    />

                    {/* Animated Overlay */}
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 1920 1920"
                        fill="none"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '44%',
                            height: '44%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2,
                            pointerEvents: 'none'
                        }}
                    >
                        <g transform="rotate(240.25 , 960, 688.75) translate(-290 -500.25)">
                            <path fill="#FFF" style={{ transformOrigin: '1277px 1209px', transform: `rotate(${rotTopInner}deg)` }} d="M1276.71,1378.94c-87.06,0-159.64-65.2-168.83-151.66-.99-9.28,5.73-17.6,15.01-18.59,9.29-1.01,17.6,5.73,18.59,15.01,7.36,69.23,65.49,121.44,135.22,121.44,74.99,0,135.99-61,135.99-135.99s-61.01-135.99-135.99-135.99c-18.77,0-36.94,3.75-54,11.14-8.57,3.71-18.51-.23-22.22-8.79-3.71-8.57.23-18.51,8.79-22.22,21.33-9.24,44.01-13.92,67.43-13.92,93.62,0,169.79,76.16,169.79,169.79s-76.16,169.78-169.79,169.78Z" />
                            <path fill="#FFF" style={{ transformOrigin: '1277px 1209px', transform: `rotate(${rotTopOuter}deg)` }} d="M1276.71,1514.18c-144.58,0-270.25-102.73-298.8-244.27-5.54-27.44,12.22-54.18,39.67-59.71,27.41-5.51,54.18,12.22,59.71,39.67,19.05,94.41,102.91,162.94,199.42,162.94,112.18,0,203.44-91.26,203.44-203.44s-91.26-203.44-203.44-203.44c-21.99,0-43.6,3.48-64.23,10.33-26.58,8.82-55.26-5.55-64.09-32.12-8.83-26.57,5.55-55.26,32.12-64.09,30.96-10.29,63.33-15.51,96.21-15.51,168.08,0,304.82,136.74,304.82,304.82s-136.74,304.82-304.82,304.82Z" />
                        </g>
                        <g>
                            <path fill="#FFF" style={{ transformOrigin: '643px 1209px', transform: `rotate(${rotBLInner}deg)` }} d="M643.37,1378.94c-93.62,0-169.78-76.16-169.78-169.78s76.16-169.79,169.78-169.79c23.42,0,46.1,4.68,67.43,13.92,8.56,3.71,12.5,13.66,8.79,22.22-3.71,8.56-13.65,12.5-22.22,8.79-17.06-7.39-35.23-11.14-54-11.14-74.99,0-135.99,61.01-135.99,135.99s61.01,135.99,135.99,135.99c69.73,0,127.87-52.21,135.22-121.44.99-9.28,9.28-16.03,18.59-15.01,9.28.99,16,9.31,15.02,18.59-9.19,86.46-81.77,151.66-168.83,151.66Z" />
                            <path fill="#FFF" style={{ transformOrigin: '643px 1209px', transform: `rotate(${rotBLOuter}deg)` }} d="M643.37,1514.18c-168.08,0-304.82-136.74-304.82-304.82s136.74-304.82,304.82-304.82c32.88,0,65.25,5.22,96.21,15.51,26.57,8.83,40.95,37.53,32.12,64.09s-37.53,40.96-64.09,32.12c-20.63-6.86-42.24-10.33-64.24-10.33-112.18,0-203.44,91.26-203.44,203.44s91.26,203.44,203.44,203.44c96.51,0,180.37-68.53,199.42-162.94,5.54-27.44,32.27-45.22,59.71-39.67,27.44,5.53,45.21,32.27,39.67,59.71-28.55,141.54-154.22,244.27-298.8,244.27Z" />
                        </g>
                        <g>
                            <path fill="#FFF" style={{ transformOrigin: '1277px 1209px', transform: `rotate(${rotBRInner}deg)` }} d="M1276.71,1378.94c-87.06,0-159.64-65.2-168.83-151.66-.99-9.28,5.73-17.6,15.01-18.59,9.29-1.01,17.6,5.73,18.59,15.01,7.36,69.23,65.49,121.44,135.22,121.44,74.99,0,135.99-61,135.99-135.99s-61.01-135.99-135.99-135.99c-18.77,0-36.94,3.75-54,11.14-8.57,3.71-18.51-.23-22.22-8.79-3.71-8.57.23-18.51,8.79-22.22,21.33-9.24,44.01-13.92,67.43-13.92,93.62,0,169.79,76.16,169.79,169.79s-76.16,169.78-169.79,169.78Z" />
                            <path fill="#FFF" style={{ transformOrigin: '1277px 1209px', transform: `rotate(${rotBROuter}deg)` }} d="M1276.71,1514.18c-144.58,0-270.25-102.73-298.8-244.27-5.54-27.44,12.22-54.18,39.67-59.71,27.41-5.51,54.18,12.22,59.71,39.67,19.05,94.41,102.91,162.94,199.42,162.94,112.18,0,203.44-91.26,203.44-203.44s-91.26-203.44-203.44-203.44c-21.99,0-43.6,3.48-64.23,10.33-26.58,8.82-55.26-5.55-64.09-32.12-8.83-26.57,5.55-55.26,32.12-64.09,30.96-10.29,63.33-15.51,96.21-15.51,168.08,0,304.82,136.74,304.82,304.82s-136.74,304.82-304.82,304.82Z" />
                        </g>
                    </svg>
                </div>
            )}

            <div style={STYLES.contentWrapper}>
                <div style={STYLES.letterRow}>
                    {renderReactLetters()}
                </div>

                <div style={STYLES.subtitleWrapper}>
                    <div style={STYLES.middleText}>TO</div>
                    <div style={{ ...STYLES.bottomText, ...videoGlitchStyles }}>
                        VIDEO
                    </div>
                </div>
            </div>
        </div>
    );
}

ReactToVideoThumbnail.metadata = [
    { id: 'text', type: 'text', default: 'REACT' }
];

return { ReactToVideoThumbnail };
