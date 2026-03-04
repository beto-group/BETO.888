const styles = {
    fullTabWrapper: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: '0',
        backgroundColor: '#000000',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
    },
    canvas: {
        width: '100%',
        height: '100%',
        display: 'block',
        flex: 1,
        position: 'relative'
    },
    header: {
        padding: "20px 30px",
        borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
        backgroundColor: "rgba(10, 10, 10, 0.8)",
        backdropFilter: "blur(10px)",
        zIndex: 10
    },
    title: {
        margin: 0,
        fontSize: "1.8rem",
        fontWeight: "300",
        letterSpacing: "4px",
        textTransform: "uppercase",
        color: "#ffffff",
        textShadow: "0 0 15px rgba(139, 92, 246, 0.5)"
    },
    subtitle: {
        margin: "8px 0 0 0",
        fontSize: "0.8rem",
        color: "#8b5cf6",
        letterSpacing: "2px"
    },
    tooltip: {
        position: "absolute",
        textAlign: "center",
        width: "auto",
        minWidth: "120px",
        padding: "8px",
        font: "12px monospace",
        background: "rgba(0, 0, 0, 0.8)",
        border: "1px solid #8b5cf6",
        borderRadius: "4px",
        pointerEvents: "none",
        color: "#fff",
        zIndex: 100,
        position: 'absolute',
        opacity: 0,
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        border: '1px solid rgba(139, 92, 246, 0.5)',
        borderRadius: '5px',
        padding: '10px',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '12px',
        pointerEvents: 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000 // Added very high z-index to ensure visibility
    },
    button: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 20,
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: "all 0.2s"
    },
    scrollablePanel: `
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #050505;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.3);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.6);
        }
    `
};

return { styles };
