/**
 * styles.jsx - Premium Beto Aesthetic
 */

const STYLES = {
    mainWrapper: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: '#f8fafc',
        background: 'radial-gradient(circle at top left, #080a12, #020205)',
    },
    header: {
        padding: '20px 40px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 100
    },
    title: {
        fontSize: '18px',
        fontWeight: '700',
        letterSpacing: '0.1em',
        color: '#8b5cf6',
        textTransform: 'uppercase',
    },
    contentScroll: {
        flex: 1,
        overflowY: 'auto',
        padding: '40px',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
    },
    card: {
        background: 'rgba(15, 23, 42, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        borderRadius: '20px',
        padding: '30px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        minWidth: '320px',
        flex: '1',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
    },
    cardTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    inputGroup: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        fontSize: '11px',
        color: '#64748b',
        marginBottom: '6px',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#fff',
        fontSize: '13px',
        outline: 'none',
        transition: 'all 0.2s ease',
    },
    button: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        color: '#fff',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'transform 0.1s ease',
    },
    logArea: {
        width: '100%',
        background: '#020617',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        fontFamily: "'Fira Code', 'Courier New', monospace',",
        fontSize: '12px',
        color: '#a5b4fc',
        maxHeight: '300px',
        overflowY: 'auto',
        marginTop: '24px',
    },
    accentDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#8b5cf6',
        boxShadow: '0 0 10px #8b5cf6',
    },
    stepContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '16px',
    },
    stepItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        fontSize: '12px',
        color: '#94a3b8',
        transition: 'all 0.3s ease',
    },
    stepActive: {
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        color: '#fff',
        boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)',
    },
    stepCompleted: {
        background: 'rgba(34, 197, 94, 0.05)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        color: '#4ade80',
    },
    stepNumber: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 'bold',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: '8px',
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        maxHeight: '400px',
        overflowY: 'auto',
    },
    spot: {
        aspectRatio: '1',
        borderRadius: '4px',
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '8px',
        color: 'rgba(255,255,255,0.3)',
    },
    spotActive: {
        background: '#8b5cf6',
        boxShadow: '0 0 15px #8b5cf6',
        color: '#fff',
        transform: 'scale(1.1)',
        zIndex: '1',
    },
    spotPressed: {
        background: '#4ade80',
        boxShadow: '0 0 10px #4ade80',
        border: '1px solid #4ade80',
        color: '#000',
    },
    spotTarget: {
        background: '#f59e0b',
        boxShadow: '0 0 20px #f59e0b',
        border: '1px solid #fbbf24',
        transform: 'scale(1.2)',
        zIndex: '2',
        color: '#000',
    },
    idTestList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '16px',
    },
    idTestItem: {
        position: 'relative',
        height: '100px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
        padding: '10px',
    },
    idTestCircle: {
        position: 'absolute',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: '#3b82f6',
        boxShadow: '0 0 15px #3b82f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: '5',
    },
    idTestCircleActive: {
        background: '#fbbf24',
        boxShadow: '0 0 25px #fbbf24',
        transform: 'scale(1.3)',
    },
    idTestCircleCompleted: {
        background: '#22c55e',
        boxShadow: '0 0 15px #22c55e',
    },
    screenshotPreview: {
        width: '100%',
        borderRadius: '12px',
        border: '2px solid rgba(139, 92, 246, 0.3)',
        marginTop: '16px',
        overflow: 'hidden',
        background: '#000',
    },
    terminalBox: {
        background: '#0a0a0a',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '12px',
        fontFamily: "'Fira Code', monospace",
        fontSize: '11px',
        color: '#f8fafc',
        marginTop: '10px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
    },
    clickIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '3px solid #ef4444',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: '100',
        animation: 'clickRipple 0.6s ease-out forwards',
    }
};

// Add global keyframes for the pulse
if (typeof document !== 'undefined') {
    const styleId = 'obsidian-automation-keyframes';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @keyframes clickRipple {
                0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; border-width: 8px; }
                100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; border-width: 1px; }
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
}

return { STYLES };
