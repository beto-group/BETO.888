/**
 * FeatureShowcase Component
 * Demonstrates high-fidelity animations in the isolated Remotion world.
 */
function FeatureShowcase({
    frame,
    fps,
    interpolate,
    spring,
    RemotionReact: R,
    title = "FEATURE SHOWCASE",
    subtitle = "Standard Remotion Architecture"
}) {
    // Animation constants
    const entrance = spring({
        frame,
        fps,
        config: {
            damping: 12,
            stiffness: 100
        }
    });

    const slide = interpolate(frame, [0, 100], [100, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });

    const opacity = interpolate(frame, [0, 30], [0, 1]);

    const containerStyle = {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: '#ffffff',
        textAlign: 'center'
    };

    const titleStyle = {
        fontSize: '120px',
        fontWeight: '900',
        transform: `scale(${entrance}) translateY(${slide}px)`,
        opacity: opacity,
        margin: '0',
        letterSpacing: '-2px',
        textShadow: '0 10px 30px rgba(139, 92, 246, 0.5)'
    };

    const subtitleStyle = {
        fontSize: '32px',
        fontWeight: '400',
        opacity: interpolate(frame, [40, 70], [0, 0.7], { extrapolateLeft: 'clamp' }),
        marginTop: '20px',
        color: '#8b5cf6',
        letterSpacing: '4px',
        textTransform: 'uppercase'
    };

    const lineStyle = {
        width: `${interpolate(frame, [50, 100], [0, 400], { extrapolateLeft: 'clamp' })}px`,
        height: '4px',
        background: '#8b5cf6',
        marginTop: '30px',
        borderRadius: '2px'
    };

    return R.createElement('div', { style: containerStyle }, [
        R.createElement('h1', { key: 'title', style: titleStyle }, title),
        R.createElement('div', { key: 'subtitle', style: subtitleStyle }, subtitle),
        R.createElement('div', { key: 'line', style: lineStyle })
    ]);
}

FeatureShowcase.metadata = [
    { id: 'title', label: 'Title', type: 'text', default: 'FEATURE SHOWCASE' },
    { id: 'subtitle', label: 'Subtitle', type: 'text', default: 'Standard Remotion Architecture' },
    { id: 'category', default: 'foreground' }
];

return { FeatureShowcase };
