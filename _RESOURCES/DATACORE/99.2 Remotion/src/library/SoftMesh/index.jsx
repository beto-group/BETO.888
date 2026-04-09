function SoftMesh({ frame }) {
    const { color1, color2, color3, speed } = SoftMesh.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    const t = frame * speed * 0.05;

    // Orb positions based on sine waves for smooth drifting
    const orb1 = {
        x: 50 + Math.sin(t) * 30,
        y: 50 + Math.cos(t * 0.8) * 20,
        scale: 1 + Math.sin(t * 0.5) * 0.2
    };

    const orb2 = {
        x: 30 + Math.cos(t * 0.7) * 40,
        y: 80 + Math.sin(t * 0.9) * 30,
        scale: 1.2 + Math.cos(t * 0.3) * 0.3
    };

    const orb3 = {
        x: 80 + Math.sin(t * 0.6) * 30,
        y: 30 + Math.cos(t * 1.1) * 40,
        scale: 0.9 + Math.sin(t * 0.4) * 0.4
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#ffffff', // Light base
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Base */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, #f5f5f7 0%, #e0e0e0 100%)`,
                zIndex: 0
            }} />

            <div style={{
                position: 'absolute',
                inset: 0,
                filter: 'blur(80px)', // Heavy blur mesh effect
                opacity: 0.8,
                zIndex: 1
            }}>
                {/* Orb 1 */}
                <div style={{
                    position: 'absolute',
                    left: `${orb1.x}%`,
                    top: `${orb1.y}%`,
                    width: '600px',
                    height: '600px',
                    background: color1,
                    borderRadius: '50%',
                    transform: `translate(-50%, -50%) scale(${orb1.scale})`,
                    mixBlendMode: 'multiply'
                }} />

                {/* Orb 2 */}
                <div style={{
                    position: 'absolute',
                    left: `${orb2.x}%`,
                    top: `${orb2.y}%`,
                    width: '500px',
                    height: '500px',
                    background: color2,
                    borderRadius: '50%',
                    transform: `translate(-50%, -50%) scale(${orb2.scale})`,
                    mixBlendMode: 'multiply'
                }} />

                {/* Orb 3 */}
                <div style={{
                    position: 'absolute',
                    left: `${orb3.x}%`,
                    top: `${orb3.y}%`,
                    width: '700px',
                    height: '700px',
                    background: color3,
                    borderRadius: '50%',
                    transform: `translate(-50%, -50%) scale(${orb3.scale})`,
                    mixBlendMode: 'multiply'
                }} />
            </div>

            {/* Noise Overlay for texture */}
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.05,
                background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                zIndex: 2,
                pointerEvents: 'none'
            }} />
        </div>
    );
}

SoftMesh.metadata = [
    { id: "category", type: "text", default: "background", hidden: true },
    { id: "color1", type: "color", default: "#aaccff", label: "Orb 1 Color" },
    { id: "color2", type: "color", default: "#ffccaa", label: "Orb 2 Color" },
    { id: "color3", type: "color", default: "#ccffaa", label: "Orb 3 Color" },
    { id: "speed", type: "number", default: 1, label: "Flow Speed" }
];

return { SoftMesh };
