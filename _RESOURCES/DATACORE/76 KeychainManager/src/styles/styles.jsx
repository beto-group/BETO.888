const STYLES = {
    fullTabWrapper: {
        position: "relative",
        height: "100%",
        width: "100%",
        background: "#020202", // Even darker background for contrast
        color: "#f0f0f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "'Inter', -apple-system, sans-serif",
    },

    compactWrapper: {
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "14px",
    },
    compactText: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#fff",
    },

    container: {
        width: '100%',
        maxWidth: '1200px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 40px',
        gap: '40px',
        boxSizing: 'border-box',
        overflowY: 'auto',
    },

    headerData: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        paddingBottom: '40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },

    title: {
        fontSize: "4rem",
        fontWeight: "900",
        margin: 0,
        letterSpacing: "-0.06em",
        lineHeight: 0.9,
        color: "#fff",
    },
    subtitle: {
        fontSize: "1.2rem",
        color: "rgba(255, 255, 255, 0.5)",
        fontWeight: "400",
    },

    mainGrid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 450px) 1fr',
        gap: '48px',
        width: '100%',
        alignItems: 'start',
    },

    glassCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
    },

    cardHeader: {
        padding: '24px 32px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: '0.9rem',
        fontWeight: '900',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
    },

    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.02)',
        }
    },

    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '32px',
    },
    inputLabel: {
        fontSize: '0.8rem',
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: '4px',
    },
    input: {
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '18px 22px',
        color: '#fff',
        fontSize: '1.1rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        '&:focus': {
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.2)',
        }
    },

    // --- ULTRA VISIBILITY BUTTONS ---
    buttonPrimary: (disabled) => ({
        background: disabled ? 'rgba(255, 255, 255, 0.05)' : '#4ade80', // Vibrant Green
        color: disabled ? 'rgba(255, 255, 255, 0.2)' : '#000',
        border: 'none',
        borderRadius: '18px',
        padding: '20px 32px',
        fontWeight: '900',
        fontSize: '1.2rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: disabled ? 'none' : '0 12px 24px -6px rgba(42, 254, 131, 0.4)', // Glowing shadow
        width: '100%',
        transform: disabled ? 'none' : 'scale(1)',
        '&:active': {
            transform: 'scale(0.97)',
        }
    }),

    buttonSecondary: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 24px',
        fontWeight: '800',
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },

    iconButton: {
        background: 'rgba(239, 68, 68, 0.1)',
        border: 'none',
        color: '#fca5a5',
        cursor: 'pointer',
        padding: '12px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
        }
    },

    alert: {
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '24px',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#86efac',
        fontSize: '1.1rem',
        lineHeight: '1.6',
        width: '100%',
        boxSizing: 'border-box',
    },

    secretList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '8px 0',
        width: '100%',
    },

    buttonPrimarySmall: {
        background: '#4ade80',
        color: '#000',
        border: 'none',
        borderRadius: '12px',
        padding: '10px 20px',
        fontWeight: '900',
        fontSize: '0.85rem',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 16px -4px rgba(42, 254, 131, 0.3)',
    },

    resultPanel: {
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    resultCode: {
        background: '#000',
        padding: '28px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#4ade80',
        fontSize: '1.3rem',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        wordBreak: 'break-all',
        lineHeight: '1.7',
        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)',
    },

    badge: (status) => ({
        display: 'inline-flex',
        alignItems: 'center',
        padding: '10px 24px',
        borderRadius: '50px',
        fontSize: '0.85rem',
        fontWeight: '900',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        background: status === 'ENCRYPTED' ? 'rgba(42, 254, 131, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        color: status === 'ENCRYPTED' ? '#4ade80' : 'rgba(255, 255, 255, 0.5)',
        border: `1px solid ${status === 'ENCRYPTED' ? 'rgba(42, 254, 131, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
    })
};

return { STYLES };
