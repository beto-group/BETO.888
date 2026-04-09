const { useState } = dc;

function TopRightControls({ onToggleChat, onToggleHelp }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: '20px',
                display: 'flex',
                gap: '15px',
                zIndex: 9999, // High z-index to catch events
                opacity: isHovered ? 1 : 0, // Fade in on hover
                transition: 'opacity 0.2s',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                width: '200px', // Hit area width
                height: '100px' // Hit area height
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Help / Legend Button */}
            <button
                onClick={onToggleHelp}
                style={buttonStyle}
                title="Keyboard Shortcuts (Legend)"
            >
                <dc.Icon icon="help-circle" style={{ width: '24px', height: '24px' }} />
            </button>

            {/* Chat Toggle Button */}
            <button
                onClick={onToggleChat}
                style={buttonStyle}
                title="Toggle Chat Window"
            >
                <dc.Icon icon="message-circle" style={{ width: '24px', height: '24px' }} />
            </button>
        </div>
    );
}

const buttonStyle = {
    background: '#a076f9',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(160, 118, 249, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
    pointerEvents: 'auto' // Ensure click works inside the container
};

return { TopRightControls };
