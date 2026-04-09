const STYLES = {
  fullTabWrapper: {
    padding: "40px",
    boxSizing: "border-box",
    height: "100%",
    width: "100%",
    background: "linear-gradient(135deg, var(--background-secondary), var(--background-primary))",
    color: "var(--text-normal)",
    overflowY: "auto",
    position: "relative",
    alignContent: "start",
  },

  // Responsive Grid Settings (to be used with inline style merging or class logic)
  // These will be applied via the <style> block in BasicComponent
  gridBreakpoints: `
    .grid-container {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 24px;
      width: 100%;
    }
    /* Desktop / TV */
    @media (min-width: 1025px) {
      .grid-span-12 { grid-column: span 12; }
      .grid-span-8 { grid-column: span 8; }
      .grid-span-6 { grid-column: span 6; }
      .grid-span-4 { grid-column: span 4; }
    }
    /* Tablet */
    @media (max-width: 1024px) {
      .grid-container { grid-template-columns: repeat(8, 1fr); }
      .grid-span-12, .grid-span-8 { grid-column: span 8; }
      .grid-span-6, .grid-span-4 { grid-column: span 4; }
    }
    /* Mobile */
    @media (max-width: 600px) {
      .grid-container { grid-template-columns: repeat(4, 1fr); gap: 16px; }
      .grid-span-12, .grid-span-8, .grid-span-6, .grid-span-4 { grid-column: span 4; }
    }
  `,

  // Controls Container (Top Right)
  controlsContainer: {
    position: "fixed",
    top: "20px",
    right: "20px",
    display: "flex",
    gap: "10px",
    zIndex: 1000,
    transition: "opacity 0.3s ease",
  },

  // ... (rest of the styles)
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
    alignItems: "stretch",
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
    fontSize: "2.5em",
    fontWeight: "800",
    margin: "0",
    letterSpacing: "-0.04em",
    gridColumn: "span 12",
  },
  subtitle: {
    fontSize: "1.2em",
    color: "var(--text-muted)",
    margin: "0",
    lineHeight: "1.4",
    gridColumn: "span 12",
  },
  card: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  }
};

return { STYLES };