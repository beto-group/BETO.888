const STYLES = {
    fullTabWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#000000',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#ffffff',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '10px',
        lineHeight: '0.8'
    },
    canvasContainer: {
        width: '100%',
        height: '100%',
        display: 'block'
    },
    guiContainer: {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 100,
        maxHeight: '90vh',
        overflowY: 'auto'
    }
};

return { STYLES };
