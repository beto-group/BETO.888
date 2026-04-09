function GlitchText({ frame }) {
    const { text, fontSize, color, glitchIntensity } = GlitchText.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    // Deterministic pseudo-random based on frame for jitter
    const noise = (f) => Math.sin(f * 938.232) * Math.cos(f * 242.12);

    // Only glitch every few frames or constantly based on intensity
    const isGlitchFrame = Math.abs(noise(frame)) > (1 - glitchIntensity);

    const offsetX = isGlitchFrame ? noise(frame) * 10 : 0;
    const offsetY = isGlitchFrame ? noise(frame + 100) * 5 : 0;

    const redShiftX = isGlitchFrame ? offsetX + 5 : 0;
    const blueShiftX = isGlitchFrame ? offsetX - 5 : 0;

    const baseStyle = {
        fontSize: fontSize + 'px',
        color: color,
        fontFamily: "'Outfit', sans-serif",
        fontWeight: '900',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: '5px'
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Red Channel */}
            <div style={{
                ...baseStyle,
                color: '#ff0055',
                transform: `translate(calc(-50% + ${redShiftX}px), calc(-50% + ${offsetY}px))`,
                opacity: 0.8,
                mixBlendMode: 'screen',
                clipPath: isGlitchFrame ? `inset(${Math.abs(noise(frame) * 50)}% 0 ${Math.abs(noise(frame + 20) * 50)}% 0)` : 'none'
            }}>
                {text}
            </div>

            {/* Blue Channel */}
            <div style={{
                ...baseStyle,
                color: '#00ccff',
                transform: `translate(calc(-50% + ${blueShiftX}px), calc(-50% - ${offsetY}px))`,
                opacity: 0.8,
                mixBlendMode: 'screen',
                clipPath: isGlitchFrame ? `inset(${Math.abs(noise(frame + 10) * 50)}% 0 ${Math.abs(noise(frame + 30) * 50)}% 0)` : 'none'
            }}>
                {text}
            </div>

            {/* Main White Channel */}
            <div style={{
                ...baseStyle,
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                zIndex: 2,
                textShadow: isGlitchFrame ? '0 0 10px rgba(255,255,255,0.8)' : 'none'
            }}>
                {text}
            </div>

            {/* Scanlines Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 3px)',
                pointerEvents: 'none',
                zIndex: 10
            }} />
        </div>
    );
}

// Metadata for the editor to create controls
GlitchText.metadata = [
    { id: "category", type: "text", default: "foreground", hidden: true },
    { id: "text", type: "text", default: "CYBERPUNK", label: "Text Content" },
    { id: "fontSize", type: "number", default: 120, label: "Font Size" },
    { id: "color", type: "color", default: "#ffffff", label: "Color" },
    { id: "glitchIntensity", type: "number", default: 0.3, min: 0, max: 1, step: 0.1, label: "Glitch Intensity" }
];

return { GlitchText };
