function GeometricFlow({ frame }) {
    const { speed, intensity } = GeometricFlow.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    const t = frame * speed * 0.02;

    const shapes = [
        { size: 600, x: 30, y: 40, color: 'rgba(139, 92, 246, 0.4)', rotateSpeed: 0.05 },
        { size: 500, x: 70, y: 60, color: 'rgba(236, 72, 153, 0.4)', rotateSpeed: -0.03 },
        { size: 400, x: 50, y: 50, color: 'rgba(59, 130, 246, 0.4)', rotateSpeed: 0.08 },
        { size: 300, x: 80, y: 20, color: 'rgba(16, 185, 129, 0.4)', rotateSpeed: -0.06 }
    ];

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Base Gradient */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                zIndex: 0
            }} />

            {/* Glassmorphic Shapes */}
            {shapes.map((shape, i) => {
                const rotation = t * shape.rotateSpeed * 100;
                const swayX = Math.sin(t + i) * 30 * intensity;
                const swayY = Math.cos(t + i * 1.5) * 30 * intensity;

                return (
                    <div key={i} style={{
                        position: 'absolute',
                        left: `${shape.x}%`,
                        top: `${shape.y}%`,
                        width: `${shape.size}px`,
                        height: `${shape.size}px`,
                        background: shape.color,
                        borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%', // Organic blob shape
                        transform: `translate(-50%, -50%) translate(${swayX}px, ${swayY}px) rotate(${rotation}deg)`,
                        filter: 'blur(60px)',
                        zIndex: 1
                    }} />
                );
            })}

            {/* Frosted Glass Overlay - Noise */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backdropFilter: 'blur(20px)',
                opacity: 0.3,
                zIndex: 2,
                background: 'rgba(255,255,255,0.1)'
            }} />
        </div>
    );
}

GeometricFlow.metadata = [
    { id: "category", type: "text", default: "background", hidden: true },
    { id: "speed", type: "number", default: 1, label: "Flow Speed" },
    { id: "intensity", type: "number", default: 1, label: "Movement Range" }
];

return { GeometricFlow };
