
const tokens = {
    primary: 'oklch(65.41% 0.176 285.34)',
    bg: 'oklch(14.5% 0.012 285.34)',
    surface: 'rgba(15, 23, 42, 0.6)',
    border: 'rgba(139, 92, 246, 0.15)',
    textDim: 'oklch(70% 0.01 285.34)',
    textBright: 'oklch(95% 0.005 285.34)',
    accentGold: 'oklch(80% 0.15 85)',
    accentPink: 'oklch(75% 0.18 330)',
    accentGreen: 'oklch(75% 0.18 150)'
};

const themeStyles = `
:root {
    --ng-primary: ${tokens.primary};
    --ng-bg: ${tokens.bg};
    --ng-surface: ${tokens.surface};
    --ng-border: ${tokens.border};
    --ng-text-dim: ${tokens.textDim};
    --ng-text-bright: ${tokens.textBright};
    --ng-accent-gold: ${tokens.accentGold};
    --ng-accent-pink: ${tokens.accentPink};
    --ng-accent-green: ${tokens.accentGreen};
}

.ng-root {
    height: 100%;
    background: var(--ng-bg);
    color: var(--ng-text-bright);
    font-family: 'Outfit', 'Inter', sans-serif;
    display: flex;
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
}

.ng-root * { box-sizing: border-box; }

.ng-sidebar {
    width: 400px;
    flex-shrink: 0;
    border-right: 1px solid var(--ng-border);
    background: rgba(10, 10, 15, 0.8);
    display: flex;
    flex-direction: column;
    height: 100%;
    backdrop-filter: blur(20px);
}

.ng-content {
    flex: 1;
    min-width: 0;
    padding: 50px;
    display: flex;
    flex-direction: column;
    gap: 35px;
    overflow-y: auto;
}

.ng-header {
    padding: 25px 35px;
    border-bottom: 1px solid var(--ng-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ng-btn {
    padding: 16px 32px;
    background: var(--ng-primary);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 900;
    letter-spacing: 1px;
    transition: all 0.2s;
    text-transform: uppercase;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.ng-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
}

.ng-btn:active {
    transform: translateY(0);
}

.ng-btn.active {
    background: oklch(60% 0.18 20);
}

.ng-btn-small {
    padding: 8px 16px;
    font-size: 10px;
}

.ng-card {
    background: var(--ng-surface);
    border-radius: 20px;
    padding: 28px;
    border: 1px solid var(--ng-border);
    backdrop-filter: blur(16px);
    position: relative;
    overflow: hidden;
    min-width: 0;
}

.ng-card-title {
    font-size: 10px;
    color: var(--ng-text-dim);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.ng-metric-label {
    font-size: 42px;
    font-weight: 900;
    color: var(--ng-primary);
    font-family: 'JetBrains Mono', monospace;
}

.ng-code-block {
    margin: 0;
    background: rgba(0,0,0,0.4);
    border-radius: 12px;
    padding: 25px;
    border: 1px solid var(--ng-border);
    color: var(--ng-accent-green);
    font-size: 11px;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: 'JetBrains Mono', monospace;
}

/* Tooltip & Highlighter Styles */
.ng-highlighter {
    position: fixed;
    border: 2px solid var(--ng-primary);
    background: rgba(139,92,246,0.1);
    z-index: 999998;
    pointer-events: none;
    border-radius: 4px;
}

.ng-tooltip {
    position: fixed;
    padding: 10px 16px;
    background: rgba(15,23,42,0.95);
    border: 1px solid var(--ng-border);
    color: #fff;
    borderRadius: 10px;
    fontSize: 11px;
    zIndex: 1000000;
    pointerEvents: none;
    fontFamily: 'JetBrains Mono', monospace;
}
`;

return { themeStyles, tokens };
