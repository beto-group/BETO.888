const { React } = dc;

function CursorPointer(props) {
    const {
        frame = 0,
        interpolate,
        spring,
        fps = 30
    } = props;

    // Animation: Follow a path
    const interp = interpolate || ((v, i, o) => o[1]);

    const progress = Math.min(1, frame / 100);
    const x = 50 + Math.sin(progress * Math.PI * 2) * 30;
    const y = 50 + Math.cos(progress * Math.PI * 2) * 20;

    const isClicking = (frame > 45 && frame < 55) || (frame > 95);
    const scale = isClicking ? 0.8 : 1;

    return (
        <div style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            zIndex: 1000,
            pointerEvents: 'none',
            transition: 'transform 0.1s ease'
        }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round" />
            </svg>

            {isClicking && (
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.5)',
                    transform: 'translate(-25%, -25%)',
                    animation: 'ripple 0.4s ease-out forwards'
                }} />
            )}

            <style>{`
                @keyframes ripple {
                    0% { transform: translate(-25%, -25%) scale(0.5); opacity: 1; }
                    100% { transform: translate(-25%, -25%) scale(2); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

CursorPointer.metadata = [
    { id: "category", type: "text", default: "ui", hidden: true }
];

return { CursorPointer };
