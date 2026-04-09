const { React, useMemo } = dc;

function CinematicIntro(props) {
    const {
        frame = 0,
        introText = "ESSENCIAL MISSION",
        subText = "PRESENTS",
        color = "#8b5cf6"
    } = props;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    // 1. PHASED ANIMATION (300 frames total)
    // Stage 1: Logo Pulse (0-100)
    // Stage 2: Text Reveal (60-180)
    // Stage 3: Fade Out (240-300)

    const logoOpacity = clamp(frame / 60, 0, 1) * (1 - clamp((frame - 240) / 60, 0, 1));
    const textOpacity = clamp((frame - 60) / 60, 0, 1) * (1 - clamp((frame - 240) / 60, 0, 1));
    const textGlitch = Math.sin(frame * 0.4) > 0.98 ? 2 : 0; // Slower jitter

    // Logo Engine (Frame Accurate)
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

    const STYLES = {
        container: {
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        },
        noise: {
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
            pointerEvents: 'none',
            zIndex: 5
        },
        logoWrapper: {
            opacity: logoOpacity,
            transform: `scale(${0.9 + (frame / 1500)})`,
            marginBottom: '40px'
        },
        textContainer: {
            textAlign: 'center',
            opacity: textOpacity,
            transform: `translateX(${textGlitch}px)`
        },
        introTitle: {
            fontSize: '18px',
            fontWeight: '300',
            letterSpacing: '1.2em',
            color: '#fff',
            margin: '0 0 10px 0',
            textTransform: 'uppercase',
            marginLeft: '1.2em' // Offset for letter tracking
        },
        presentText: {
            fontSize: '12px',
            fontWeight: '900',
            color: color,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            textShadow: `0 0 10px ${color}88`
        }
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.noise} />

            <div style={STYLES.logoWrapper}>
                <svg width="240" height="240" viewBox="0 0 1920 1920" fill="none">
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

            <div style={STYLES.textContainer}>
                <div style={STYLES.introTitle}>{introText}</div>
                <div style={STYLES.presentText}>{subText}</div>
            </div>
        </div>
    );
}

CinematicIntro.metadata = [
    { id: 'introText', type: 'text', default: 'ESSENCIAL MISSION' },
    { id: 'subText', type: 'text', default: 'PRESENTS' },
    { id: 'color', type: 'color', default: '#8b5cf6' }
];

return { CinematicIntro };
