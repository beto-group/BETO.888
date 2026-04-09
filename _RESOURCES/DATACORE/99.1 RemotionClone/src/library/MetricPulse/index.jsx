const { React } = dc;

function MetricPulse(props) {
    const {
        frame = 0,
        value = 99.9,
        label = "SYSTEM UPTIME",
        unit = "%",
        color = "#3b82f6"
    } = props;

    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    // 1. Counter Animation (0-90f)
    const countProgress = easeOutQuart(clamp(frame / 90, 0, 1));
    const displayValue = (value * countProgress).toFixed(1);

    // 2. Pulse Animation
    const pulse = Math.sin(frame * 0.1) * 0.5 + 0.5;
    const circleScale = 1 + (pulse * 0.1);

    // 3. Ring Rotation
    const rotation = frame * 1;

    const STYLES = {
        container: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            fontFamily: "'Roboto Mono', monospace",
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
        },
        inner: {
            textAlign: 'center',
            zIndex: 10
        },
        value: {
            fontSize: '120px',
            fontWeight: 'bold',
            lineHeight: '1',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            textShadow: `0 0 40px ${color}44`
        },
        unit: {
            fontSize: '40px',
            marginLeft: '10px',
            opacity: 0.7
        },
        label: {
            fontSize: '20px',
            letterSpacing: '4px',
            marginTop: '10px',
            opacity: 0.6,
            textTransform: 'uppercase'
        },
        ring: {
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            border: `2px dashed ${color}33`,
            transform: `rotate(${rotation}deg) scale(${circleScale})`,
            transition: 'none'
        },
        ringSolid: {
            position: 'absolute',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            border: `1px solid ${color}66`,
            opacity: 0.3 + (pulse * 0.2),
            transform: `scale(${1.2 - (pulse * 0.1)})`,
        }
    };

    return (
        <div style={STYLES.container}>
            {/* Tech Rings */}
            <div style={STYLES.ring} />
            <div style={STYLES.ringSolid} />

            <div style={STYLES.inner}>
                <div style={STYLES.value}>
                    {displayValue}
                    <span style={STYLES.unit}>{unit}</span>
                </div>
                <div style={STYLES.label}>{label}</div>
            </div>

            {/* Background Glow */}
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
                zIndex: 1
            }} />
        </div>
    );
}

MetricPulse.metadata = [
    { id: 'value', type: 'number', default: 99.9 },
    { id: 'label', type: 'text', default: 'SYSTEM UPTIME' },
    { id: 'unit', type: 'text', default: '%' },
    { id: 'color', type: 'color', default: '#3b82f6' }
];

return { MetricPulse };
