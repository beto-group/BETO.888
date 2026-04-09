function CinematicTitle(props) {
    const {
        text = "GLOBAL CONNECTIVITY",
        subtext = "REDESIGNED FOR THE FUTURE",
        color = "#a855f7",
        fontSize = "64px",
        frame = 0,
        interpolate,
        spring,
        RemotionReact: R = dc.React
    } = props;

    // 1. Glitch Animation (0-40f)
    const isGlitching = frame < 40 && Math.random() > 0.8;
    const glitchOffset = isGlitching ? (Math.random() - 0.5) * 10 : 0;
    const glitchOpacity = isGlitching ? 0.6 : 1;

    // Using interpolate for opacity if available, otherwise fallback
    const interp = interpolate || ((v, i, o) => o[1]); // Fallback

    const entryOpacity = interp(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    // 2. Tracking Animation (0-150f)
    const letterSpacing = interp(frame, [0, 150], [2, 14], { extrapolateRight: 'clamp' });

    // 3. Subtext Reveal (40-100f)
    const subtextOpacity = interp(frame, [40, 100], [0, 1], { extrapolateRight: 'clamp' });
    const subtextY = interp(frame, [40, 100], [20, 0], { extrapolateRight: 'clamp' });

    // 4. Global Pulse (Glow)
    const pulse = 0.8 + Math.sin(frame * 0.05) * 0.2;

    const STYLES = {
        container: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            color: '#fff',
            textAlign: 'center',
            padding: '40px',
            boxSizing: 'border-box',
            overflow: 'hidden'
        },
        title: {
            fontSize: fontSize,
            fontWeight: '900',
            letterSpacing: `${letterSpacing}px`,
            color: color,
            opacity: entryOpacity * glitchOpacity,
            transform: `translateX(${glitchOffset}px)`,
            textShadow: `0 0 ${20 * pulse}px ${color}66`,
            margin: '0',
            lineHeight: '1.1',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            transition: 'none'
        },
        subtext: {
            fontSize: '18px',
            fontWeight: '400',
            letterSpacing: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: '20px',
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
        },
        glitchOverlay: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            pointerEvents: 'none',
            display: isGlitching ? 'block' : 'none'
        }
    };

    return (
        <div style={STYLES.container}>
            <h1 style={STYLES.title}>{text}</h1>
            <div style={STYLES.subtext}>{subtext}</div>

            {/* Dynamic Glitch Elements */}
            {isGlitching && (
                <div style={{
                    ...STYLES.title,
                    ...STYLES.glitchOverlay,
                    color: '#00f2ff',
                    left: `calc(50% + ${Math.random() * 20}px)`,
                    opacity: 0.3,
                    zIndex: -1
                }}>{text}</div>
            )}
        </div>
    );
}

CinematicTitle.metadata = [
    { id: 'text', type: 'text', default: 'GLOBAL CONNECTIVITY' },
    { id: 'subtext', type: 'text', default: 'REDESIGNED FOR THE FUTURE' },
    { id: 'color', type: 'color', default: '#a855f7' },
    { id: 'fontSize', type: 'text', default: '80px' }
];

return { CinematicTitle };
