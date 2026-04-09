const CSS = `
/* 
  66.6 BasicFolderView - Core Theme 
  Scoped with BEM-like naming: .bfv-*
*/

:root {
  --bfv-bg: #0a0a0a;
  --bfv-card-bg: #151515;
  --bfv-text: #e0e0e0;
  --bfv-text-muted: #888;
  --bfv-border: #222;
  --bfv-accent: #8b5cf6;
  --bfv-accent-hover: #7c3aed;
  --bfv-danger: #ef4444;
  --bfv-success: #22c55e;
  --bfv-font: 'Inter', system-ui, sans-serif;
  --bfv-radius: 8px;
  --bfv-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 12-Column Grid Core */
.bfv-container {
  font-family: var(--bfv-font);
  color: var(--bfv-text);
  background-color: var(--bfv-bg);
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: min-content;
  gap: 24px;
  align-content: start;
  padding: 40px;
  position: relative;
  overflow-y: auto;
  box-sizing: border-box;
}

.bfv-container * {
  box-sizing: border-box;
}

/* Responsive Grid Utility Classes */
.grid-span-12 { grid-column: span 12; }
.grid-span-8 { grid-column: span 8; }
.grid-span-6 { grid-column: span 6; }
.grid-span-4 { grid-column: span 4; }

/* Tablet Breakpoint (8 Columns) */
@media (max-width: 1024px) {
  .bfv-container {
    grid-template-columns: repeat(8, 1fr);
    padding: 32px;
  }
  .grid-span-12, .grid-span-8 { grid-column: span 8; }
  .grid-span-6, .grid-span-4 { grid-column: span 4; }
}

/* Mobile Breakpoint (4 Columns) */
@media (max-width: 600px) {
  .bfv-container {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 24px;
  }
  .grid-span-12, .grid-span-8, .grid-span-6, .grid-span-4 { grid-column: span 4; }
}

/* Typography */
.bfv-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #fff, #aaa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: left;
  grid-column: span 12;
}

.bfv-text {
  font-size: 1.1rem;
  line-height: 1.5;
  color: var(--bfv-text-muted);
  text-align: left;
  margin-bottom: 2rem;
  grid-column: span 12;
}

/* Info Box / Card Implementation */
.bfv-info-box {
  padding: 1.5rem;
  border: 1px solid var(--bfv-border);
  border-radius: var(--bfv-radius);
  background: var(--bfv-card-bg);
  box-shadow: var(--bfv-shadow);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
  min-height: 140px;
}

.bfv-info-box:hover {
  transform: translateY(-2px);
  border-color: var(--bfv-accent);
}

/* Controls Menu - Stealth Mode */
.bfv-controls {
  position: fixed;
  top: 0;
  right: 0;
  padding: 20px;
  display: flex;
  gap: 8px;
  z-index: 2000;
  opacity: 0;
  transform: translateY(-8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;
}

/* Show ONLY when hovering the top-right corner area (captured by large padding) */
.bfv-controls:hover {
  opacity: 1;
  transform: translateY(0);
}

/* Keep visible when a child button is hovered to prevent flickering */
.bfv-controls:hover {
    pointer-events: auto;
    opacity: 1;
}

.bfv-control-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--bfv-border);
  border-radius: var(--bfv-radius);
  padding: 8px 12px;
  cursor: pointer;
  color: var(--bfv-text);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  min-width: 36px;
  min-height: 36px;
}

.bfv-control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--bfv-text);
  transform: translateY(-1px);
}

.bfv-control-btn:active {
  transform: translateY(0);
}

.bfv-control-btn.accent { color: var(--bfv-accent); border-color: rgba(139, 92, 246, 0.3); }
.bfv-control-btn.accent:hover { background: rgba(139, 92, 246, 0.1); border-color: var(--bfv-accent); }

.bfv-control-btn.danger { color: var(--bfv-danger); border-color: rgba(239, 68, 68, 0.3); }
.bfv-control-btn.danger:hover { background: rgba(239, 68, 68, 0.1); border-color: var(--bfv-danger); }

/* Mobile Responsiveness */
@media (max-width: 600px) {
  .bfv-title { font-size: 1.5rem; }
  
  .bfv-controls {
    top: auto;
    bottom: 20px;
    right: 50%;
    transform: translateX(50%);
    background: rgba(0,0,0,0.8);
    padding: 8px;
    border-radius: 99px;
    border: 1px solid var(--bfv-border);
    backdrop-filter: blur(10px);
  }

  .bfv-control-btn {
    padding: 12px; /* Larger touch targets */
    border: none;
    background: transparent;
  }
}
`;

return { CSS };
