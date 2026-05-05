/**
 * Component 122 Style System
 * Premium OKLCH-based theme with "Nuclear" edge-to-edge tokens.
 */
const styles = {
    mainWrapper: {
        height: '100%',
        background: '#020205',
        color: '#f8fafc',
        fontFamily: "'JetBrains Mono', 'Inter', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
    },
    header: {
        background: 'rgba(5, 5, 10, 0.7)',
        backdropFilter: 'blur(30px)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
    },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
    title: { 
        fontSize: '16px', 
        fontWeight: '950', 
        letterSpacing: '3px', 
        color: '#6366f1',
        textShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
        textTransform: 'uppercase'
    },
    badge: {
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        color: '#818cf8',
        fontSize: '11px',
        padding: '3px 10px',
        borderRadius: '6px',
        fontWeight: '700',
        letterSpacing: '0.5px'
    },
    dashboard: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '1px',
        background: 'rgba(99, 102, 241, 0.1)', // Grid lines
        overflow: 'hidden'
    },
    mainPanel: {
        background: '#020205',
        overflowY: 'auto',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    sidePanel: {
        background: '#05050a',
        borderLeft: '1px solid rgba(99, 102, 241, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    card: {
        background: 'rgba(15, 23, 42, 0.3)',
        border: '1px solid rgba(99, 102, 241, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.3s ease'
    },
    terminal: {
        flex: 1,
        background: '#000',
        padding: '20px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
        color: '#94a3b8',
        overflowY: 'auto',
        borderTop: '1px solid rgba(99, 102, 241, 0.2)'
    },
    input: {
        background: '#000',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s ease',
        width: '100%'
    },
    button: {
        background: '#6366f1',
        hover: '#818cf8',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: '700',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s ease'
    },
    
    // Animations
    animations: `
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.98) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 4px; }
    `
};

return styles;
