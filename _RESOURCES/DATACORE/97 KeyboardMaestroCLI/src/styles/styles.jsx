const STYLES = {
    fullTabWrapper: {
        position: "relative",
        height: "100%",
        width: "100%",
        backgroundColor: "#000000",
        color: "#ffffff",
        fontFamily: "monospace",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },

    header: {
        padding: "15px 24px",
        borderBottom: "1px solid rgba(139, 92, 246, 0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#050505",
    },

    title: {
        fontSize: "1.1rem",
        fontWeight: "bold",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        margin: 0,
        color: "#8b5cf6",
        textShadow: "0 0 12px rgba(139, 92, 246, 0.3)",
    },

    mainContent: {
        flex: 1,
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: "20px",
        padding: "24px",
        overflow: "hidden",
    },

    sidebar: {
        gridRow: "span 2",
        backgroundColor: "#0a0a0a",
        border: "1px solid rgba(139, 92, 246, 0.1)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
    },

    sidebarHeader: {
        padding: "12px 18px",
        borderBottom: "1px solid rgba(139, 92, 246, 0.1)",
        backgroundColor: "#0d0d0d",
        fontSize: "0.85rem",
        fontWeight: "600",
        textTransform: "uppercase",
        color: "#8b5cf6",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
    },

    favoriteList: {
        flex: 1,
        overflowY: "auto",
        padding: "12px",
    },

    favoriteItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        marginBottom: "8px",
        backgroundColor: "rgba(139, 92, 246, 0.03)",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        border: "1px solid rgba(139, 92, 246, 0.05)",
    },

    favoriteItemHover: {
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        borderColor: "rgba(139, 92, 246, 0.3)",
        transform: "translateX(4px)",
    },

    favoriteName: {
        fontSize: "0.9rem",
        color: "#e0e0e0",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },

    removeBtn: {
        color: "#666",
        border: "none",
        background: "none",
        cursor: "pointer",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
        transition: "all 0.2s",
    },

    removeBtnHover: {
        color: "#ff4444",
        backgroundColor: "rgba(255, 68, 68, 0.1)",
    },

    controlPanel: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        backgroundColor: "#0a0a0a",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid rgba(139, 92, 246, 0.1)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
    },

    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },

    label: {
        fontSize: "0.75rem",
        color: "#666",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },

    input: {
        backgroundColor: "#000",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        color: "#fff",
        padding: "0 14px",
        height: "40px",
        borderRadius: "8px",
        outline: "none",
        fontSize: "0.95rem",
        fontFamily: "monospace",
        transition: "all 0.2s",
        boxSizing: "border-box",
        lineHeight: "40px",
    },

    select: {
        backgroundColor: "#000",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        color: "#fff",
        padding: "0 34px 0 14px",
        height: "40px",
        borderRadius: "8px",
        outline: "none",
        fontSize: "0.95rem",
        fontFamily: "monospace",
        appearance: "none",
        cursor: "pointer",
        boxSizing: "border-box",
        lineHeight: "38px", // Slightly less to account for border
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "12px",
    },

    option: {
        backgroundColor: "#0a0a0a",
        color: "#fff",
    },

    inputFocus: {
        borderColor: "#8b5cf6",
        boxShadow: "0 0 0 2px rgba(139, 92, 246, 0.1)",
    },

    checkboxGroup: {
        display: "flex",
        gap: "20px",
        alignItems: "center",
        gridColumn: "span 2",
        padding: "8px 0",
    },

    checkboxItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        fontSize: "0.9rem",
        color: "#888",
        transition: "color 0.2s",
    },

    terminal: {
        backgroundColor: "#000",
        border: "1px solid rgba(139, 92, 246, 0.1)",
        borderRadius: "12px",
        padding: "16px",
        fontSize: "0.9rem",
        lineHeight: "1.5",
        overflowY: "auto",
        boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)",
        fontFamily: "monospace",
    },

    terminalLine: {
        marginBottom: "6px",
        wordBreak: "break-all",
        display: "flex",
        gap: "10px",
    },

    prompt: {
        color: "#8b5cf6",
        fontWeight: "600",
        opacity: 0.8,
    },

    success: { color: "#8b5cf6" }, // Purple for success too in this theme
    error: { color: "#ff4444" },
    info: { color: "#888" },

    executeButton: {
        gridColumn: "span 2",
        backgroundColor: "#8b5cf6",
        color: "#ffffff",
        border: "none",
        padding: "12px",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: "1px",
        fontSize: "0.9rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },

    executeButtonHover: {
        backgroundColor: "#7c3aed",
        boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
        transform: "translateY(-1px)",
    },

    saveButton: {
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        color: "#8b5cf6",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "0.75rem",
        cursor: "pointer",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontWeight: "600",
        transition: "all 0.2s",
    },

    controlsContainer: {
        display: "flex",
        gap: "12px",
    },

    iconButton: {
        width: "34px",
        height: "34px",
        borderRadius: "8px",
        border: "1px solid rgba(139, 92, 246, 0.1)",
        backgroundColor: "#0d0d0d",
        color: "#8b5cf6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        transition: "all 0.2s",
    },

    iconButtonHover: {
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.05)",
    }
};

return { STYLES };
