/**
 * 128_Native_Grab - Design System (OKLCH High-Fidelity)
 * Focused on precision, depth, and "Nuclear" immersion.
 */
const styles = {
    mainWrapper: {
        height: '100%',
        background: '#000',
        color: '#f0f0f0',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none'
    },
    header: {
        background: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(30px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
    },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { 
        fontSize: '12px', 
        fontWeight: '900', 
        letterSpacing: '3px', 
        color: '#8b5cf6',
        textTransform: 'uppercase',
        textShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
    },
    canvas: {
        flex: 1,
        position: 'relative',
        background: 'radial-gradient(circle at center, #111 0%, #000 70%)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    gridOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px), 
                         linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
    },
    draggableElement: (isDragging, x, y) => ({
        position: 'absolute',
        width: '120px',
        height: '120px',
        left: `${x}px`,
        top: `${y}px`,
        background: isDragging 
            ? 'rgba(139, 92, 246, 0.4)' 
            : 'rgba(139, 92, 246, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(139, 92, 246, 0.5)',
        borderRadius: '12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: isDragging ? 'none' : 'all 0.1s ease-out',
        boxShadow: isDragging 
            ? '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.4)' 
            : '0 5px 15px rgba(0,0,0,0.3)',
        zIndex: isDragging ? 200 : 50
    }),
    grabberIcon: {
        width: '24px',
        height: '24px',
        color: '#a78bfa'
    },
    elementLabel: {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#fff',
        opacity: 0.8,
        letterSpacing: '1px'
    },
    coordinates: {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#4ade80',
        zIndex: 100
    },
    terminal: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '300px',
        maxHeight: '150px',
        background: 'rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#94a3b8',
        overflowY: 'auto',
        zIndex: 100
    },
    logLine: { marginBottom: '4px', borderLeft: '2px solid #8b5cf6', paddingLeft: '8px' },
    
    // Global Animations
    animations: `
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
        }
        .native-grab-active {
            border-color: #4ade80 !important;
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.3) !important;
        }
    `
};

return styles;
