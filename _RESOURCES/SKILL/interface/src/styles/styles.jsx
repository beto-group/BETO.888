const STYLES = {
    container: {
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #111111 100%)',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden'
    },
    sidebar: {
        width: '280px',
        background: 'rgba(20, 20, 20, 0.8)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    mainContent: {
        flex: 1,
        padding: '40px',
        overflowY: 'auto',
        position: 'relative'
    },
    glassCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        letterSpacing: '-0.02em',
        marginBottom: '8px',
        background: 'linear-gradient(90deg, #fff, #888)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
    },
    subtitle: {
        fontSize: '14px',
        color: '#888',
        fontFamily: "monospace",
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '30px'
    },
    // New Styles for MCP Dashboard
    splitPane: {
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden'
    },
    navItem: {
        padding: '12px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#888',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    navItemActive: {
        background: 'rgba(255,255,255,0.1)',
        color: '#fff',
        fontWeight: '500'
    },
    codeBlock: {
        background: '#111',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#e6e6e6',
        whiteSpace: 'pre-wrap',
        overflowX: 'auto',
        border: '1px solid #333'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
    }
};

return { STYLES };
