const { React } = dc;

function GlowingFrame({ frame }) {
    const opacity = Math.min(1, frame / 20); // Fade in over 20 frames

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: opacity
        }}>
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                // Removed visible border as requested - purely structural now
                background: 'transparent'
            }}>
                {/* Content Container */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    zIndex: 1
                }} />
            </div>
        </div>
    );
}

GlowingFrame.metadata = [
    { id: 'category', type: 'text', default: 'component' }
];

return { GlowingFrame };
