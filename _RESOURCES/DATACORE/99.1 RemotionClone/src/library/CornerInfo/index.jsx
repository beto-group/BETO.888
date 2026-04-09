const { React } = dc;

/**
 * CornerInfo: A subtle, corner-locked information overlay.
 * Fixed to ensure alignment logic works perfectly in Datacore.
 */
function CornerInfo(props) {
    const {
        frame = 0,
        title = "END RESULT",
        description = "Production ready output from the core engine.",
        color = "#a855f7",
        align = "left" // Default to left now since that's what we want
    } = props;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    // --- Animation Logic ---
    const progress = clamp(frame / 60, 0, 1);
    const opacity = progress;
    const translateY = (1 - progress) * 15;

    const STYLES = {
        wrapper: {
            position: 'absolute',
            bottom: '60px',
            // Explicitly set one side to auto to prevent conflicting positions
            left: align === 'left' ? '60px' : 'auto',
            right: align === 'left' ? 'auto' : '60px',
            width: '300px',
            zIndex: 1000,
            pointerEvents: 'none',
        },
        container: {
            padding: '20px 24px',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            opacity,
            transform: `translateY(${translateY}px)`,
            pointerEvents: 'auto',
            fontFamily: "'Outfit', sans-serif",
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        },
        accent: {
            position: 'absolute',
            top: '22px',
            left: '0',
            width: '3px',
            height: '24px',
            backgroundColor: color,
            borderRadius: '0 2px 2px 0',
            boxShadow: `0 0 10px ${color}66`
        },
        title: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            paddingLeft: '12px',
        },
        description: {
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.55)',
            margin: 0,
            lineHeight: '1.4',
            paddingLeft: '12px',
        }
    };

    return (
        <div style={STYLES.wrapper}>
            <div style={STYLES.container}>
                <div style={STYLES.accent} />
                <h3 style={STYLES.title}>{title}</h3>
                <p style={STYLES.description}>{description}</p>
            </div>
        </div>
    );
}

CornerInfo.metadata = [
    { id: 'title', type: 'text', default: 'END RESULT' },
    { id: 'description', type: 'text', default: 'Production ready output from the core engine.' },
    { id: 'color', type: 'color', default: '#a855f7' },
    { id: 'align', type: 'text', default: 'left' }
];

return { CornerInfo };
