
const STYLES = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#09090b',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden'
    },
    header: {
        padding: '20px',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        background: '#18181b',
        flexShrink: 0
    },
    title: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#e4e4e7',
        margin: 0
    },
    searchContainer: {
        flex: 1,
        position: 'relative'
    },
    searchInput: {
        width: '100%',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #3f3f46',
        background: '#27272a',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    adminToggle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        userSelect: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid #3f3f46',
        background: '#27272a',
        fontSize: '13px'
    },
    adminToggleActive: {
        background: '#7f1d1d', // Dark red for warning/admin
        borderColor: '#ef4444',
        color: '#fee2e2'
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '16px'
    },
    appCard: {
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.1s, background 0.2s',
        textAlign: 'center',
        height: '140px',
        position: 'relative'
    },
    appCardHover: {
        background: '#27272a',
        transform: 'translateY(-2px)'
    },
    appIcon: {
        width: '48px',
        height: '48px',
        marginBottom: '12px',
        borderRadius: '10px',
        background: '#3f3f46', // Fallback
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: '#a1a1aa'
    },
    appName: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#e4e4e7',
        wordBreak: 'break-word',
        lineHeight: '1.4',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    },
    loadingOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px'
    },
    spinner: {
        width: '20px',
        height: '20px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }
};

return { STYLES };
