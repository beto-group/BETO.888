function AuroraLines({ frame }) {
    const { strokeColor, count, amplitude, speed } = AuroraLines.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    const lines = [];
    for (let i = 0; i < count; i++) {
        // Calculate SVG path for each line
        const yOffset = (720 / count) * i;
        const phase = (frame * speed * 0.02) + (i * 0.5);

        // Construct a smooth wave path
        let d = `M -50 ${yOffset}`;
        for (let x = 0; x <= 1280 + 50; x += 40) {
            const y = yOffset + Math.sin((x * 0.005) + phase) * amplitude * Math.sin(frame * 0.01 + i);
            d += ` L ${x} ${y}`;
        }

        lines.push(
            <path
                key={i}
                d={d}
                stroke={strokeColor}
                strokeWidth="2"
                fill="none"
                opacity={0.3 + Math.sin(phase) * 0.2}
            />
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#0a0a0a', // Dark base
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Gradient */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #000000 100%)',
                zIndex: 0
            }} />

            <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', zIndex: 1 }}
                viewBox="0 0 1280 720"
                preserveAspectRatio="none"
            >
                {lines}
            </svg>

            {/* Vignette */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(transparent 60%, rgba(0,0,0,0.6) 100%)',
                zIndex: 2,
                pointerEvents: 'none'
            }} />
        </div>
    );
}

AuroraLines.metadata = [
    { id: "category", type: "text", default: "background", hidden: true },
    { id: "strokeColor", type: "color", default: "#00ffcc", label: "Line Color" },
    { id: "count", type: "number", default: 10, label: "Line Count" },
    { id: "amplitude", type: "number", default: 40, label: "Wave Height" },
    { id: "speed", type: "number", default: 2, label: "Flow Speed" }
];

return { AuroraLines };
