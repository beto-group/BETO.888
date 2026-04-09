/**
 * DatacoreExplanation Component
 * A high-fidelity component for explaining Datacore capabilities in video format.
 */
function DatacoreExplanation({
    frame,
    fps,
    interpolate,
    spring,
    RemotionReact: R,
    title = "MODULAR ARCHITECTURE",
    desc = "Built for Sync, Performance, and Total Control."
}) {
    const entrance = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 100 }
    });

    const containerStyle = {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '100px',
        background: 'transparent',
        fontFamily: "'Outfit', sans-serif",
        color: '#ffffff'
    };

    const glowStyle = {
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)',
        left: '20%',
        top: '20%',
        zIndex: -1,
        transform: `scale(${1 + Math.sin(frame / 30) * 0.1})`
    };

    return R.createElement('div', { style: containerStyle }, [
        R.createElement('div', { key: 'glow', style: glowStyle }),

        // Purple accent bar
        R.createElement('div', {
            key: 'accent',
            style: {
                width: '120px',
                height: '8px',
                background: '#8b5cf6',
                marginBottom: '40px',
                transform: `scaleX(${entrance})`,
                transformOrigin: 'left'
            }
        }),

        R.createElement('h1', {
            key: 'title',
            style: {
                fontSize: '96px',
                fontWeight: '900',
                margin: '0',
                letterSpacing: '-3px',
                lineHeight: '1',
                opacity: interpolate(frame, [0, 20], [0, 1]),
                transform: `translateX(${interpolate(frame, [0, 20], [-50, 0], { extrapolateRight: 'clamp' })}px)`
            }
        }, title),

        R.createElement('p', {
            key: 'desc',
            style: {
                fontSize: '32px',
                color: 'rgba(255,255,255,0.6)',
                marginTop: '30px',
                maxWidth: '800px',
                lineHeight: '1.4',
                opacity: interpolate(frame, [25, 45], [0, 1]),
                transform: `translateY(${interpolate(frame, [25, 45], [20, 0], { extrapolateRight: 'clamp' })}px)`
            }
        }, desc)
    ]);
}

DatacoreExplanation.metadata = [
    { id: 'category', default: 'foreground' },
    { id: 'title', label: 'Title', type: 'text', default: 'MODULAR ARCHITECTURE' },
    { id: 'desc', label: 'Description', type: 'text', default: 'Built for Sync, Performance, and Total Control.' }
];

return { DatacoreExplanation };
