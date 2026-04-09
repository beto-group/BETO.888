function Sequencer({ from = 0, duration = 100, currentFrame, children }) {
    const isVisible = currentFrame >= from && currentFrame < from + duration;

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none' // Allow interaction with layers below if needed
        }}>
            {children}
        </div>
    );
}

return { Sequencer };
