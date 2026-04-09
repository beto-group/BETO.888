function SphericalGrid({ frame }) {
    const { gridSize, perspective, color, speed } = SphericalGrid.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    const movement = (frame * speed) % gridSize;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#0a0a0a', // Dark base
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: `${perspective}px`
        }}>
            <div style={{
                width: '200%',
                height: '200%',
                backgroundImage: `
                    radial-gradient(circle, ${color} 1px, transparent 1px),
                    radial-gradient(circle, ${color} 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPosition: `0 0, ${gridSize / 2}px ${gridSize / 2}px`,
                transform: `rotateX(20deg) scale(1.5) translateY(${movement}px)`,
                maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                opacity: 0.4
            }} />

            {/* Vignette */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(transparent 50%, #000 100%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
}

SphericalGrid.metadata = [
    { id: "category", type: "text", default: "background", hidden: true },
    { id: "gridSize", type: "number", default: 60, label: "Grid Size" },
    { id: "perspective", type: "number", default: 800, label: "Perspective (px)" },
    { id: "color", type: "color", default: "#333333", label: "Dot Color" },
    { id: "speed", type: "number", default: 1, label: "Scroll Speed" }
];

return { SphericalGrid };
