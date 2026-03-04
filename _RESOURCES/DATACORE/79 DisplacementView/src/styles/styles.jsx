const STYLES = {
    compactWrapper: {
        padding: '16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #2d2d2d',
        borderRadius: '8px',
        backgroundColor: '#0a0a0a',
        gap: '12px'
    },
    title: {
        margin: 0,
        color: '#a78bfa',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '24px'
    },
    subtitle: {
        margin: 0,
        color: '#9ca3af',
        fontSize: '14px'
    },
    iconButton: {
        padding: '6px',
        borderRadius: '4px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #2d2d2d',
        color: '#8b5cf6',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    },
    fullTabWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#000000',
        overflow: 'hidden',
    },
};

return { STYLES };
