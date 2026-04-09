function DeepSpace({ frame }) {
    const { starCount, speed, depth } = DeepSpace.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    // Deterministic random generator for consistent star placement
    const mulberry32 = (a) => {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    // Generate stars only once (conceptually) or use a fixed seed
    const seed = 12345;
    const random = mulberry32(seed);

    const stars = [];
    for (let i = 0; i < starCount; i++) {
        const xBase = random() * 100; // %
        const yBase = random() * 100; // %
        const size = (random() * 2) + 0.5; // px
        const layer = Math.floor(random() * 3) + 1; // 1 (far), 2 (mid), 3 (close)

        // Parallax movement
        const moveSpeed = (speed * 0.01) * layer;
        const yOffset = (frame * moveSpeed) % 100; // Loop vertically
        const yFinal = (yBase + yOffset) % 100;

        stars.push(
            <div key={i} style={{
                position: 'absolute',
                left: `${xBase}%`,
                top: `${yFinal}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: '#fff',
                borderRadius: '50%',
                opacity: (random() * 0.5) + 0.3,
                boxShadow: size > 1.5 ? `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)` : 'none'
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
            {/* Nebula / Dust Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 30% 20%, rgba(20, 0, 40, 0.4) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(0, 20, 40, 0.3) 0%, transparent 60%)',
                zIndex: 0
            }} />

            {/* Stars */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                {stars}
            </div>

            {/* Subtle vignetting for depth */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(transparent 50%, rgba(0,0,0,0.8) 120%)',
                zIndex: 2,
                pointerEvents: 'none'
            }} />
        </div>
    );
}

DeepSpace.metadata = [
    { id: "category", type: "text", default: "background", hidden: true },
    { id: "starCount", type: "number", default: 200, label: "Star Count" },
    { id: "speed", type: "number", default: 0.5, label: "Drift Speed" },
    { id: "depth", type: "number", default: 1, label: "Depth Factor" }
];

return { DeepSpace };
