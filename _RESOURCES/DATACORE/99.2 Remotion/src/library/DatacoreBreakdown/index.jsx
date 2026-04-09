/**
 * DatacoreBreakdown Component
 * High-fidelity visualization of how Datacore components are created.
 */
function DatacoreBreakdown({
    frame,
    fps,
    interpolate,
    spring,
    RemotionReact: R,
    step = 1
}) {
    // Shared animations
    const opacity = (f, start) => interpolate(frame, [start, start + 30], [0, 1], { extrapolateLeft: 'clamp' });
    const scale = (f, start) => spring({ frame: f - start, fps, config: { damping: 10 } });

    const containerStyle = {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0a0a1a',
        fontFamily: "'Outfit', sans-serif"
    };

    const Box = ({ title, desc, color, x, y, start }) => {
        const op = opacity(frame, start);
        const s = scale(frame, start);

        return R.createElement('div', {
            style: {
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: '300px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${color}`,
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                opacity: op,
                transform: `scale(${s}) translate(-50%, -50%)`,
                boxShadow: `0 0 30px ${color}44`
            }
        }, [
            R.createElement('h2', { key: 't', style: { color, margin: '0 0 10px 0', fontSize: '24px' } }, title),
            R.createElement('p', { key: 'd', style: { color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '14px' } }, desc)
        ]);
    };

    const Arrow = ({ fromX, fromY, toX, toY, start, color }) => {
        const progress = interpolate(frame, [start, start + 40], [0, 100], { extrapolateLeft: 'clamp' });

        return R.createElement('div', {
            style: {
                position: 'absolute',
                left: `${fromX}%`,
                top: `${fromY}%`,
                width: `${(toX - fromX) * progress / 100}%`,
                height: '4px',
                background: `linear-gradient(to right, ${color}00, ${color}ff)`,
                transformOrigin: '0 50%',
                zIndex: 0
            }
        });
    };

    return R.createElement('div', { style: containerStyle }, [
        // Title
        R.createElement('h1', {
            key: 'main-title',
            style: {
                position: 'absolute',
                top: '10%',
                fontSize: '48px',
                color: '#ffffff',
                opacity: opacity(frame, 0),
                letterSpacing: '2px'
            }
        }, "HOW DATACORE COMPONENTS WORK"),

        // Step 1: Datacore Agent
        R.createElement(Box, {
            key: 'b1',
            start: 20,
            x: 20,
            y: 50,
            title: "1. AGENT INPUT",
            desc: "The AI agent generates logic and structure based on user requests.",
            color: '#8b5cf6'
        }),

        R.createElement(Arrow, { key: 'a1', start: 60, fromX: 28, fromY: 50, toX: 42, toY: 50, color: '#8b5cf6' }),

        // Step 2: Bridge Logic
        R.createElement(Box, {
            key: 'b2',
            start: 70,
            x: 50,
            y: 50,
            title: "2. THE BRIDGE",
            desc: "Datacore wraps the pure React logic and provides the environment.",
            color: '#ffffff'
        }),

        R.createElement(Arrow, { key: 'a2', start: 110, fromX: 58, fromY: 50, toX: 72, toY: 50, color: '#8b5cf6' }),

        // Step 3: Isolated Rendering
        R.createElement(Box, {
            key: 'b3',
            start: 120,
            x: 80,
            y: 50,
            title: "3. ISOLATED VIZ",
            desc: "The video engine renders absolute 120fps visuals in a pure React sandbox.",
            color: '#ef4444'
        })
    ]);
}

DatacoreBreakdown.metadata = [
    { id: 'category', default: 'foreground' },
    { id: 'step', label: 'Step', type: 'number', default: 1 }
];

return { DatacoreBreakdown };
