function ParticleField({ frame }) {
    const { particleCount, color, speed } = ParticleField.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    // Deterministic Random (Mulberry32)
    const mulberry32 = (a) => {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    const seed = 8888;
    const random = mulberry32(seed);

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
        // Initial random state
        const xInit = random() * 100;
        const yInit = random() * 100;
        const size = random() * 4 + 1;
        const speedVar = random() * 0.5 + 0.5;
        const angle = random() * Math.PI * 2;

        // Movement Logic
        const t = frame * speed * speedVar;

        // Flow field simulation (simple curl noise approximation)
        const xOffset = Math.sin(t * 0.05 + yInit * 0.1) * 20;
        const yOffset = Math.cos(t * 0.03 + xInit * 0.1) * 20;

        // Wrap around logic is tricky in React render, so we keep it confined or drifting
        const xFinal = (xInit + xOffset + 100) % 100;
        const yFinal = (yInit - (t * 0.1) + 100) % 100; // Drift Upwards

        const opacity = Math.sin((t * 0.1) + i) * 0.5 + 0.5;

        particles.push(
            <div key={i} style={{
                position: 'absolute',
                left: `${xFinal}%`,
                top: `${yFinal}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: color,
                borderRadius: '50%',
                opacity: opacity * 0.8,
                boxShadow: `0 0 ${size * 2}px ${color}`
            }} />
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#000000',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Dark Void Gradient */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 120%, #1a1b2e 0%, #000000 70%)',
                zIndex: 0
            }} />

            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                {particles}
            </div>

            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.5) 100%)',
                zIndex: 2,
                pointerEvents: 'none'
            }} />
        </div>
    );
}

ParticleField.metadata = [
    { id: "category", type: "text", default: "background", hidden: true },
    { id: "particleCount", type: "number", default: 100, label: "Count" },
    { id: "color", type: "color", default: "#ffffff", label: "Color" },
    { id: "speed", type: "number", default: 1, label: "Speed" }
];

return { ParticleField };
