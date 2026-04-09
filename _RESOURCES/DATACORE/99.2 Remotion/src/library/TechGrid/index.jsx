const { React } = dc;

function TechGrid(props) {
    const {
        frame = 0,
        color = "#6366f1",
        opacity = 0.4,
        gridSize = 60
    } = props;

    // Parallax / Movement
    const xOffset = (frame * 0.5) % gridSize;
    const yOffset = (frame * 0.3) % gridSize;

    // Glowing Intersections Logic
    // We'll simulate a few "running" pulses on specified grid lines
    const pulsePos = (frame * 4) % 2000;

    const STYLES = {
        container: {
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            position: 'relative',
            overflow: 'hidden'
        },
        grid: {
            position: 'absolute',
            top: -gridSize,
            left: -gridSize,
            right: -gridSize,
            bottom: -gridSize,
            backgroundImage: `
        linear-gradient(to right, ${color}22 1px, transparent 1px),
        linear-gradient(to bottom, ${color}22 1px, transparent 1px)
      `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundPosition: `${xOffset}px ${yOffset}px`,
            opacity: opacity
        },
        vignette: {
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle, transparent 20%, #000 100%)',
            zIndex: 2
        },
        scanner: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '100px',
            left: `${pulsePos - 500}px`,
            background: `linear-gradient(90deg, transparent, ${color}11, transparent)`,
            transform: 'skewX(-20deg)',
            zIndex: 1
        }
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.grid} />
            <div style={STYLES.scanner} />
            <div style={STYLES.vignette} />

            {/* Dynamic Glowing Dots at intersections */}
            {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: `${((i * 237) + frame * 2) % 100}%`,
                    left: `${((i * 541) + frame * 1) % 100}%`,
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`,
                    opacity: Math.sin(frame * 0.1 + i) * 0.5 + 0.5,
                    zIndex: 1
                }} />
            ))}
        </div>
    );
}

TechGrid.metadata = [
    { id: 'color', type: 'color', default: '#6366f1' },
    { id: 'opacity', type: 'number', default: 0.4 },
    { id: 'gridSize', type: 'number', default: 60 }
];

return { TechGrid };
