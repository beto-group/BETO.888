const { React } = dc;

function TypographyOverlay({ frame }) {
    const scale = 0.9 + Math.min(0.1, frame * 0.002);
    const opacity = Math.min(1, frame / 30);
    const y = 50 - Math.min(50, frame * 0.5); // Slide up

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
        }}>
            <h1 style={{
                fontSize: '120px',
                fontWeight: '900',
                color: '#fff',
                textAlign: 'center',
                lineHeight: '0.9',
                opacity: opacity,
                transform: `scale(${scale}) translateY(${y}px)`,
                letterSpacing: '-4px'
            }}>
                Build Software<br />
                <span style={{
                    background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Faster</span>
            </h1>
        </div>
    );
}

TypographyOverlay.metadata = [
    { id: 'category', type: 'text', default: 'component' }
];

return { TypographyOverlay };
