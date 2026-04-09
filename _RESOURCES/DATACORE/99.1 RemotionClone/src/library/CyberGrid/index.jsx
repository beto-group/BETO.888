function CyberGrid({ frame }) {
    const { gridColor, skyColor, speed, horizonY } = CyberGrid.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    const movement = (frame * speed) % 100;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(to bottom, ${skyColor} 0%, #000 50%, #111 100%)`,
            position: 'relative',
            overflow: 'hidden',
            perspective: '1000px'
        }}>
            {/* Horizon Glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: '100%',
                height: '2px',
                background: gridColor,
                boxShadow: `0 0 20px 5px ${gridColor}`,
                zIndex: 10
            }} />

            {/* Sun */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: `linear-gradient(to bottom, #ff00ff, #ffaa00)`,
                transform: 'translateX(-50%)',
                boxShadow: '0 0 60px rgba(255, 0, 255, 0.4)',
                opacity: 0.8
            }} />

            {/* Moving Grid Floor */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '-50%',
                width: '200%',
                height: '100%',
                transform: 'rotateX(80deg)',
                background: `
                    linear-gradient(90deg, transparent 0%, transparent 48%, ${gridColor} 50%, transparent 52%),
                    linear-gradient(180deg, transparent 0%, transparent 48%, ${gridColor} 50%, transparent 52%)
                `,
                backgroundSize: '100px 100px',
                backgroundPosition: `0px ${movement}px`,
                boxShadow: `inset 0 0 100px 50px #000000`, // Fade into black at distance
                opacity: 0.6
            }} />

            {/* Retro Scanline Overlay (Light) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 2px, 3px 100%',
                pointerEvents: 'none',
                zIndex: 20
            }} />
        </div>
    );
}

CyberGrid.metadata = [
    { id: "category", type: "text", default: "background", hidden: true },
    { id: "gridColor", type: "color", default: "#ff00ff", label: "Grid Color" },
    { id: "skyColor", type: "color", default: "#0f0014", label: "Sky Color" },
    { id: "speed", type: "number", default: 2, label: "Speed" },
    { id: "horizonY", type: "number", default: 50, min: 0, max: 100, label: "Horizon %" }
];

return { CyberGrid };
