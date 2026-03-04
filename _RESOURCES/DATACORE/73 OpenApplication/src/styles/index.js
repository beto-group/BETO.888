
export const STYLES = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#09090b',
        color: '#fafafa',
        fontFamily: 'Inter, -apple-system, sans-serif'
    },
    header: {
        padding: '24px',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    title: {
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.025em'
    },
    searchContainer: {
        position: 'relative'
    },
    searchInput: {
        width: '100%',
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#fafafa',
        fontSize: '0.875rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    },
    controls: {
        display: 'flex',
        gap: '8px'
    },
    adminToggle: {
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        fontSize: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        userSelect: 'none'
    },
    adminToggleActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#ef4444',
        color: '#ef4444'
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '16px'
    },
    appCard: {
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
    },
    appCardHover: {
        borderColor: '#3f3f46',
        backgroundColor: '#27272a',
        transform: 'translateY(-2px)'
    },
    appIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: '#27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#a1a1aa'
    },
    appName: {
        fontSize: '0.75rem',
        fontWeight: 500,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%'
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(9, 9, 11, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
        zIndex: 10
    },
    spinner: {
        width: '24px',
        height: '24px',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderTopColor: '#fafafa',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
    }
};
