const STYLES = {
    fullTabWrapper: {
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
    },
    overlay: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        pointerEvents: 'none'
    },
    button: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }
};

return { STYLES };
