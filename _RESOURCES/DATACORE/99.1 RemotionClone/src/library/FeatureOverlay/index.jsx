const { React } = dc;

function FeatureOverlay(props) {
    const {
        frame = 0,
        title = "SECURE PROTOCOL",
        description = "Advanced end-to-end encryption with zero-trust architecture.",
        color = "#10b981",
        align = "right"
    } = props;

    const easeOutBack = t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    // 1. Slide-in Animation (0-60f)
    const revealProgress = easeOutBack(clamp(frame / 60, 0, 1));
    const offset = 100 - (revealProgress * 100);
    const opacity = clamp(frame / 30, 0, 1);

    // 2. Scanline Animation
    const scanPos = (frame * 2) % 200;

    const STYLES = {
        container: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: align.startsWith('bottom') ? 'flex-end' : 'center',
            justifyContent: align.endsWith('right') ? 'flex-end' : align.endsWith('left') ? 'flex-start' : 'center',
            padding: '60px',
            boxSizing: 'border-box',
            backgroundColor: 'transparent',
            fontFamily: "'Outfit', sans-serif",
            zIndex: 100,
            pointerEvents: 'none'
        },
        card: {
            width: '380px',
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            opacity: opacity,
            transform: `translateX(${align.endsWith('right') ? offset : -offset}px)`,
            position: 'relative',
            overflow: 'hidden',
            pointerEvents: 'auto'
        },
        topLine: {
            width: '40px',
            height: '4px',
            backgroundColor: color,
            borderRadius: '2px',
            marginBottom: '20px'
        },
        title: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '1px',
            margin: '0 0 10px 0',
            textTransform: 'uppercase'
        },
        description: {
            fontSize: '16px',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '0'
        },
        scanline: {
            position: 'absolute',
            top: `${scanPos}%`,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${color}44, transparent)`,
            opacity: 0.5
        }
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.card}>
                <div style={STYLES.scanline} />
                <div style={STYLES.topLine} />
                <h2 style={STYLES.title}>{title}</h2>
                <p style={STYLES.description}>{description}</p>

                {/* Tech Corner Decoration */}
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    width: '20px',
                    height: '20px',
                    borderRight: `2px solid ${color}66`,
                    borderBottom: `2px solid ${color}66`,
                    opacity: 0.5
                }} />
            </div>
        </div>
    );
}

FeatureOverlay.metadata = [
    { id: 'title', type: 'text', default: 'SECURE PROTOCOL' },
    { id: 'description', type: 'text', default: 'Advanced end-to-end encryption with zero-trust architecture.' },
    { id: 'color', type: 'color', default: '#10b981' },
    { id: 'align', type: 'text', default: 'right' }
];

return { FeatureOverlay };
