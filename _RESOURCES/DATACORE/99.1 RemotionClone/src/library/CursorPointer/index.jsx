export const CursorPointer = ({ frame }) => {
    const {
        startX,
        startY,
        endX,
        endY,
        clickFrame,
        color
    } = CursorPointer.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    // Movement Logic
    const duration = clickFrame;
    const progress = Math.min(1, frame / duration);
    // Easing: ease-in-out-sine
    const ease = t => -(Math.cos(Math.PI * t) - 1) / 2;
    const t = ease(progress);

    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;

    // Click Ripple Logic
    const isClicked = frame >= clickFrame;
    const rippleScale = isClicked ? 1 + (frame - clickFrame) * 0.1 : 0;
    const rippleOpacity = isClicked ? Math.max(0, 1 - (frame - clickFrame) * 0.1) : 0;

    // Cursor Pulse on Click
    const cursorScale = isClicked && frame < clickFrame + 5 ? 0.8 : 1;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        }}>
            {/* Ripple Effect */}
            {isClicked && (
                <div style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: `3px solid ${color}`,
                    transform: `translate(-50%, -50%) scale(${rippleScale})`,
                    opacity: rippleOpacity
                }} />
            )}

            {/* Cursor SVG */}
            <div style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `scale(${cursorScale})`,
                transition: 'transform 0.1s'
            }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                        fill={color}
                        stroke="white"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
};

CursorPointer.metadata = [
    { id: "category", type: "text", default: "overlay", hidden: true },
    { id: "startX", type: "number", default: 100, label: "Start X" },
    { id: "startY", type: "number", default: 600, label: "Start Y" },
    { id: "endX", type: "number", default: 600, label: "Target X" },
    { id: "endY", type: "number", default: 400, label: "Target Y" },
    { id: "clickFrame", type: "number", default: 45, label: "Click At Frame" },
    { id: "color", type: "color", default: "#000000", label: "Cursor Color" }
];

export default CursorPointer;
