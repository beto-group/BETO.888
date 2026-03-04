const STYLES = {
    fullTabWrapper: {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    canvas: {
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0
    },
    controls: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
        zIndex: 10,
    },
    button: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    },
    guiContainer: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 100,
    }
};

return { STYLES };
