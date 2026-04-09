const { React, useRef, useEffect, useMemo } = dc;

function PromoEnding(props) {
    const {
        frame = 0,
        title = "JOIN THE FUTURE",
        slogan = "CREATING FACTOTUMS",
        url = "beto.group",
        color = "#8b5cf6" // LiveStreamManager purple
    } = props;

    // --- SHARED HELPERS ---
    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    // --- DETERMINISTIC MATRIX ENGINE ---
    const streamCount = 50;
    const charSet = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890";

    // Seeded random for deterministic streams
    const pseudoRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    // Use useMemo directly from dc/destructured
    const streams = useMemo(() => {
        return Array.from({ length: streamCount }, (_, i) => ({
            x: pseudoRandom(i * 123) * 100, // % width
            yStart: pseudoRandom(i * 456) * 100, // % start height
            speed: 0.15 + pseudoRandom(i * 789) * 0.3,
            length: 8 + Math.floor(pseudoRandom(i * 321) * 18),
            delay: pseudoRandom(i * 654) * 150
        }));
    }, [streamCount]); // Static config

    const renderRain = () => {
        return streams.map((stream, i) => {
            const localFrame = frame - stream.delay;
            if (localFrame < 0) return null;

            // Movement cycles every 300 frames to keep things busy
            const currentY = (stream.yStart + (localFrame * stream.speed)) % 140;

            return (
                <div key={i} style={{ position: 'absolute', left: `${stream.x}%`, top: `${currentY}%`, pointerEvents: 'none' }}>
                    {Array.from({ length: stream.length }).map((_, charIdx) => {
                        const charYOffset = -(charIdx * 1.5);
                        const charAlpha = 1 - (charIdx / stream.length);
                        // Flicker speed based on frame
                        const flickerChar = charSet[Math.floor(pseudoRandom(i + charIdx + Math.floor(frame / 12)) * charSet.length)];

                        return (
                            <div key={charIdx} style={{
                                position: 'absolute',
                                top: `${charYOffset}em`,
                                color: charIdx === 0 ? '#fff' : color,
                                opacity: charAlpha * 0.8, // Increased opacity
                                fontSize: '18px', // Slightly larger
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                                textShadow: charIdx === 0 ? `0 0 15px ${color}` : 'none',
                                whiteSpace: 'nowrap'
                            }}>
                                {flickerChar}
                            </div>
                        );
                    })}
                </div>
            );
        });
    };

    // --- ANIMATION TIMELINE ---
    const revealProgress = easeOutExpo(clamp(frame / 60, 0, 1));
    const containerOpacity = revealProgress;
    const containerScale = 0.95 + (revealProgress * 0.05);

    // --- LOGO ENGINE (Frame Accurate) ---
    const getRot = (f, s = 1, rev = false) => {
        const deg = (f * s * (360 / 300)) % 360;
        return rev ? -deg : deg;
    };
    const rotTopOuter = getRot(frame, 1);
    const rotTopInner = getRot(frame, 1, true);
    const rotBLOuter = getRot(frame, 0.8, true);
    const rotBLInner = getRot(frame, 0.8);
    const rotBROuter = getRot(frame, 1.2);
    const rotBRInner = getRot(frame, 1.2, true);

    const logoSize = 180;

    const STYLES = {
        container: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            fontFamily: "'Inter', sans-serif",
            color: '#fff',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            opacity: containerOpacity,
            transform: `scale(${containerScale})`,
        },
        matrixOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
            maskImage: 'radial-gradient(circle, #fff 0%, transparent 90%)'
        },
        centralZone: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
        },
        logoWrapper: {
            marginBottom: '40px',
            opacity: revealProgress,
            transform: `translateY(${20 - (revealProgress * 20)}px)`,
        },
        title: {
            fontSize: '24px',
            fontWeight: '400',
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            color: '#71717a',
            marginBottom: '10px',
            opacity: clamp((frame - 30) / 30, 0, 1),
        },
        url: {
            fontSize: '110px',
            fontWeight: '900',
            letterSpacing: '-0.02em',
            lineHeight: '0.9',
            color: '#ffffff',
            textShadow: `0 0 60px rgba(139, 92, 246, 0.4)`,
            margin: '0',
            opacity: clamp((frame - 40) / 40, 0, 1),
        },
        slogan: {
            fontSize: '14px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.8em',
            color: color,
            marginTop: '20px',
            opacity: clamp((frame - 50) / 30, 0, 1),
            textShadow: `0 0 10px ${color}44`,
            marginLeft: '0.8em'
        },
        glassPanel: {
            marginTop: '60px',
            padding: '24px 48px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            opacity: clamp((frame - 60) / 40, 0, 1),
            transform: `translateY(${10 - (clamp((frame - 60) / 40, 0, 1) * 10)}px)`,
        },
        accentLine: {
            width: '2px',
            height: '40px',
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}`
        },
        availableText: {
            fontSize: '11px',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '0.2em',
            textTransform: 'uppercase'
        }
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.matrixOverlay}>
                {renderRain()}
            </div>

            <div style={STYLES.centralZone}>
                <div style={STYLES.logoWrapper}>
                    <svg width={logoSize} height={logoSize} viewBox="0 0 1920 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
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

                <div style={STYLES.title}>{title}</div>
                <div style={STYLES.url}>{url}</div>
                <div style={STYLES.slogan}>{slogan}</div>

                <div style={STYLES.glassPanel}>
                    <div style={STYLES.accentLine} />
                    <div style={STYLES.availableText}>Available in 2026</div>
                    <div style={STYLES.accentLine} />
                </div>
            </div>
        </div>
    );
}

PromoEnding.metadata = [
    { id: 'title', type: 'text', default: 'JOIN THE FUTURE' },
    { id: 'slogan', type: 'text', default: 'CREATING FACTOTUMS' },
    { id: 'url', type: 'text', default: 'beto.group' },
    { id: 'color', type: 'color', default: '#8b5cf6' }
];

return { PromoEnding };
