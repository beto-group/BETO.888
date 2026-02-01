const STYLES = {
  fullTabWrapper: {
    position: "relative",
    height: "100%",
    width: "100%",
    background: "linear-gradient(135deg, var(--background-secondary), var(--background-primary))",
    color: "var(--text-normal)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  // Controls Container (Top Right)
  controlsContainer: {
    position: "absolute",
    top: "0",
    right: "0",
    padding: "20px",
    display: "flex",
    gap: "10px",
    zIndex: 100,
    transition: "opacity 0.3s ease",
  },

  // Icon Button Style (Base)
  iconButton: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-secondary-alt)",
    color: "var(--text-muted)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    padding: 0,
  },
  iconButtonHover: {
    backgroundColor: "var(--interactive-accent)",
    color: "var(--text-on-accent)",
    border: "1px solid var(--interactive-accent)",
    transform: "scale(1.05)",
  },

  // Dropdown Menu
  dropdown: {
    position: "absolute",
    top: "100%",
    right: "0",
    marginTop: "8px",
    backgroundColor: "var(--background-primary-alt)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    width: "140px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 101, // Above controls
  },
  dropdownItem: {
    padding: "10px 12px",
    fontSize: "13px",
    color: "var(--text-normal)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "background 0.2s",
  },
  dropdownItemHover: {
    backgroundColor: "var(--background-modifier-hover)",
    color: "var(--text-accent)",
  },

  // Compact mode styles
  compactWrapper: {
    padding: "16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    border: "1px dashed var(--background-modifier-border)",
    borderRadius: "8px",
    backgroundColor: "var(--background-primary-alt)",
  },
  compactText: {
    margin: 0,
    color: "var(--text-muted)",
    fontSize: "14px"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px"
  },
  button: {
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--text-on-accent)",
    backgroundColor: "var(--interactive-accent)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  secondaryButton: {
    backgroundColor: "var(--background-modifier-hover)",
    color: "var(--text-muted)",
  },

  // Typography
  title: {
    fontSize: "2em",
    fontWeight: "700",
    marginBottom: "10px",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "1.1em",
    color: "var(--text-muted)",
    maxWidth: "400px",
    textAlign: "center",
    lineHeight: "1.5",
  }
};

return { STYLES };