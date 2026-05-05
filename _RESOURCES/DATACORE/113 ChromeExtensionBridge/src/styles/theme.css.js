/**
 * 105_ChromeExtensionBridge Styles - Retro-Futuristic Tactical
 * Based on Beto Design Bible (OKLCH, Fluid Typography)
 */
const TOKENS = {
    bg: '#050505',
    surface: '#0a0a0f',
    accent: 'oklch(0.7 0.25 300)', // Neon Purple
    accent_dim: 'oklch(0.4 0.1 300)',
    text: 'oklch(0.9 0.02 240)',
    text_dim: 'oklch(0.6 0.02 240)',
    danger: 'oklch(0.6 0.2 20)',
    success: 'oklch(0.7 0.2 150)',
    border: 'rgba(255, 255, 255, 0.05)',
    glow: '0 0 20px oklch(0.7 0.25 300 / 0.2)'
};

const STYLES = {
    container: {
        fontFamily: 'Inter, sans-serif',
        color: TOKENS.text,
        backgroundColor: TOKENS.bg,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        padding: '32px 48px',
        borderBottom: `1px solid ${TOKENS.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    title: {
        margin: 0,
        fontSize: 'clamp(24px, 4vw, 32px)',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        textTransform: 'uppercase',
        color: '#fff',
    },
    subtitle: {
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.4em',
        color: TOKENS.accent,
        textTransform: 'uppercase',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        padding: '48px',
        overflowY: 'auto'
    },
    card: {
        background: TOKENS.surface,
        border: `1px solid ${TOKENS.border}`,
        padding: '24px',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.3s ease',
        cursor: 'default',
        ':hover': {
            borderColor: TOKENS.accent,
            boxShadow: TOKENS.glow
        }
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    extName: {
        fontSize: '14px',
        fontWeight: 800,
        color: '#fff'
    },
    extVersion: {
        fontSize: '10px',
        opacity: 0.5,
        fontFamily: 'monospace'
    },
    statusBadge: (active) => ({
        padding: '4px 10px',
        fontSize: '9px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        borderRadius: '2px',
        backgroundColor: active ? TOKENS.success + '22' : TOKENS.danger + '22',
        color: active ? TOKENS.success : TOKENS.danger,
        border: `1px solid ${active ? TOKENS.success + '44' : TOKENS.danger + '44'}`
    }),
    button: (primary) => ({
        padding: '12px 20px',
        fontSize: '11px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        cursor: 'pointer',
        background: primary ? TOKENS.accent : 'transparent',
        color: primary ? '#000' : TOKENS.text,
        border: primary ? 'none' : `1px solid ${TOKENS.border}`,
        borderRadius: '2px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
    }),
    input: {
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${TOKENS.border}`,
        padding: '12px',
        color: '#fff',
        fontSize: '13px',
        borderRadius: '2px',
        width: '100%',
        boxSizing: 'border-box'
    },
    terminal: {
        margin: '0 48px 48px 48px',
        padding: '20px',
        background: '#000',
        border: `1px solid ${TOKENS.border}`,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '12px',
        color: TOKENS.text_dim,
        height: '150px',
        overflowY: 'auto'
    }
};

return { STYLES, TOKENS };
