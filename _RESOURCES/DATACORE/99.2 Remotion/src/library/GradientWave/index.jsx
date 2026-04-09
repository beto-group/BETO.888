function GradientWave({ frame }) {
    const { speed, colorStart, colorEnd, complexity } = GradientWave.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    const waves = [];
    const layers = 5;

    for (let i = 0; i < layers; i++) {
        const p = i / (layers - 1); // 0 to 1
        // Interpolate color roughly (simple hex logic not perfect, but good enough for demo)
        // Creating distinct opacity/color bands

        const yBase = 720 - (p * 500) + 100;
        const amplitude = 50 + p * 100;
        const frequency = 0.003 + p * 0.002;
        const phase = (frame * speed * 0.05) + (i * 2);

        let d = `M 0 720 L 0 ${yBase}`;

        for (let x = 0; x <= 1280; x += 40) {
            const noise = Math.sin(x * frequency * complexity + phase) + Math.cos(x * frequency * 0.5 + phase * 0.5);
            const y = yBase + noise * amplitude;
            d += ` L ${x} ${y}`;
        }

        d += ` L 1280 720 Z`;

        waves.push(
            <path
                key={i}
                d={d}
                fill={i % 2 === 0 ? colorStart : colorEnd}
                fillOpacity={0.2 + (p * 0.5)}
                style={{ mixBlendMode: 'screen' }}
            />
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(to bottom, #000000 0%, #1e1b4b 100%)`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1280 720"
                preserveAspectRatio="none"
                style={{ display: 'block' }}
            >
                {waves}
            </svg>

            {/* Grain */}
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.1,
                background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                pointerEvents: 'none'
            }} />
        </div>
    );
}

GradientWave.metadata = [
    { id: "category", type: "text", default: "background", hidden: true },
    { id: "speed", type: "number", default: 1, label: "Speed" },
    { id: "complexity", type: "number", default: 1, label: "Wave Complexity" },
    { id: "colorStart", type: "color", default: "#4f46e5", label: "Color 1" },
    { id: "colorEnd", type: "color", default: "#db2777", label: "Color 2" }
];

return { GradientWave };
