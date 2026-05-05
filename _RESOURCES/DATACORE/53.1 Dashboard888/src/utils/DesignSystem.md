
# DesignSystem

```jsx
const STYLES = {
    wrapper: {
        position: "relative",
        height: "100%",
        width: "100%",
        fontFamily:
            "ui-monospace, 'JetBrains Mono', 'Fira Code', SFMono-Regular, Menlo, monospace",
    },
    shell: {
        position: "relative",
        height: "100%",
        width: "100%",
        background: "transparent",
        color: "var(--text-normal)",
        overflow: "hidden",
    },
    contentLayer: {
        position: "relative",
        zIndex: 3,
        width: "100%",
        height: "100%",
        padding: "24px",
        paddingTop: "clamp(2rem, 8vh, 6rem)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "64px",
        overflowY: "auto",
    },
    veil: {
        position: "absolute",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        background:
            "radial-gradient(1200px 700px at 50% -10%, rgba(var(--background-primary-rgb), 0.58), rgba(var(--background-primary-rgb), 0.40) 35%, rgba(var(--background-primary-rgb), 0.62) 100%)",
    },
    h1: { fontSize: "33px", fontWeight: 800, letterSpacing: "1.5px", margin: 0 },
    h2: { fontSize: "16px", fontWeight: 700, margin: 0 },
    sub: {
        fontSize: "13px",
        color: "var(--text-muted)",
        margin: 0,
        textAlign: "center",
        maxWidth: "760px",
        fontStyle: "italic",
        whiteSpace: "nowrap",
        overflow: "hidden",
        borderRight: "2px solid var(--glow-faint)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        width: "100%",
        maxWidth: "1280px",
        justifyContent: "center",
    },
    card: {
        position: "relative",
        borderRadius: "8px",
        border: "1px solid var(--glow-faint)",
        background: "rgba(var(--background-primary-alt-rgb), 0.74)",
        backdropFilter: "blur(4px)",
        cursor: "pointer",
        boxShadow: "0 12px 50px rgba(0,0,0,.45)",
        overflow: "hidden",
        height: "160px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        willChange: "transform",
    },
    pillbar: {
        display: "inline-flex",
        gap: "4px",
        border: "1px solid var(--glow-faint)",
        padding: "4px",
        borderRadius: "8px",
        background: "rgba(var(--background-primary-rgb), 0.6)",
        backdropFilter: "blur(3px)",
    },
    pill: {
        fontSize: "12px",
        padding: "6px 10px",
        cursor: "pointer",
        userSelect: "none",
        lineHeight: 1,
        whiteSpace: "nowrap",
    },
    btn: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid var(--glow)",
        background: "var(--glow-med)",
        color: "var(--text-on-accent)",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
    },
    tile: {
        padding: "14px",
        borderRadius: "8px",
        border: "1px solid var(--glow-faint)",
        background: "rgba(var(--background-primary-alt-rgb), 0.74)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: "0 12px 50px rgba(0,0,0,.45)",
    },
    logEntry: {
        display: "flex",
        alignItems: "baseline",
        gap: "12px",
        padding: "4px 0",
        borderBottom: "1px solid rgba(var(--glow-rgb), 0.1)",
    },
    categoryHeader: {
        fontSize: "20px",
        color: "var(--glow)",
        width: "100%",
        maxWidth: "1280px",
        textAlign: "left",
        borderBottom: "1px solid var(--glow-faint)",
        paddingBottom: "12px",
        marginBottom: "4px",
    },
    homeShowcase: {
        display: "flex",
        width: "100%",
        maxWidth: "1280px",
        maxHeight: "50vh",
        minHeight: "33vh",
        background: "var(--background-primary)",
        borderRadius: "12px",
        border: "1px solid var(--border-hero)",
        outline: "1px solid var(--glow-faint)",
        outlineOffset: "2px",
        margin: "4px",
        overflow: "hidden",
        boxShadow: "var(--elev)",
    },
    showcaseFeatured: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "clamp(1.5rem, 4vw, 3rem)",
    },
    showcaseMedia: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
    },
    showcaseMediaAsset: { width: "100%", height: "100%", objectFit: "contain" },
    showcaseMediaOverlay: {
        position: "absolute",
        inset: 0,
        background:
            "linear-gradient(to top, rgba(var(--background-primary-rgb), 0.9) 15%, rgba(var(--background-primary-rgb), 0.4) 50%, transparent 80%)",
        zIndex: 1,
    },
    showcaseContent: {
        position: "relative",
        zIndex: 2,
        color: "var(--text-normal)",
        maxWidth: "85%",
    },
    showcaseNav: {
        width: "350px",
        background: "rgba(var(--background-primary-alt-rgb), 0.5)",
        backdropFilter: "blur(20px)",
        borderLeft: "1px solid var(--glow-faint)",
        display: "flex",
        flexDirection: "column",
    },
    showcaseNavItem: {
        position: "relative",
        display: "flex",
        gap: "12px",
        padding: "16px",
        cursor: "pointer",
        borderBottom: "1px solid var(--glow-faint)",
        borderTop: "1px solid var(--glow-faint)",
        overflow: "hidden",
        background: "rgba(var(--background-primary-alt-rgb), 0.2)",
        flexGrow: 1,
        alignItems: "center",
    },
    navItemThumb: {
        width: "100px",
        height: "56px",
        objectFit: "cover",
        borderRadius: "4px",
        filter: "grayscale(50%)",
        transition: "filter 0.3s ease",
    },
    navItemText: {
        flex: 1,
        color: "var(--text-normal)",
        opacity: 0.6,
        transition: "all 0.3s ease",
    },
    navProgress: {
        position: "absolute",
        bottom: 0,
        left: 0,
        height: "3px",
        background: "var(--glow)",
        width: "100%",
        transform: "scaleX(0)",
        transformOrigin: "left",
        willChange: "transform",
    },
};

const generateCSS = (uniqueWrapperClass) => {
    return `
    .${uniqueWrapperClass} {
        /* Base / Dark Theme Defaults */
        --background-primary: #0b0713;
        --background-primary-rgb: 11, 7, 19;
        --background-primary-alt: #100a18;
        --background-primary-alt-rgb: 16, 10, 24;
        --surface-primary: #1a1622;
        --text-normal: #e1e1e1;
        --text-muted: #a0a0a0;
        --text-muted-rgb: 160, 160, 160;
        --text-faint: #606060;
        --text-bright: #ffffff;
        --text-bright-rgb: 255, 255, 255;
        --glow: oklch(0.82 0.21 300);
        --glow-med: oklch(from var(--glow) l c h / 60%);
        --glow-faint: oklch(from var(--glow) l c h / 20%);
        --glow-accent-purple: oklch(0.65 0.25 300);
        --elev: 0 10px 40px rgba(0,0,0,0.5);
        --ease-out: cubic-bezier(0.25, 1, 0.5, 1);
        --media-filter: none;
        --text-on-accent: #0b0713;
        --border-hero: var(--glow-faint);
        
        background: var(--background-primary);
        color: var(--text-normal);
        font-variant: small-caps;
        transition: background 0.3s ease, color 0.3s ease;
    }

    .${uniqueWrapperClass}.theme-light {
        --background-primary: #f5f5f7;
        --background-primary-rgb: 245, 245, 247;
        --background-primary-alt: #ffffff;
        --background-primary-alt-rgb: 255, 255, 255;
        --surface-primary: #ffffff;
        --text-normal: #1d1d1f;
        --text-muted: #86868b;
        --text-muted-rgb: 134, 134, 139;
        --text-faint: #b0b0b0;
        --text-bright: #000000;
        --text-bright-rgb: 0, 0, 0;
        --glow: oklch(0.45 0.15 300); 
        --glow-med: oklch(from var(--glow) l c h / 60%);
        --glow-faint: oklch(from var(--glow) l c h / 10%);
        --glow-accent-purple: oklch(0.45 0.25 300);
        --elev: 0 10px 40px rgba(0,0,0,0.08);
        --media-filter: invert(1) hue-rotate(180deg) brightness(1.1);
        --text-on-accent: #ffffff;
        --border-hero: rgba(var(--background-primary-alt-rgb), 0.8);
    }

    /* Main Content Styles */
    .${uniqueWrapperClass} .fx-stage {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
    }

    .${uniqueWrapperClass} .glitch-text {
        position: relative;
        display: inline-block;
    }

    .${uniqueWrapperClass} .glitch-text::before, .${uniqueWrapperClass} .glitch-text::after {
        content: attr(data-text);
        position: absolute;
        inset: 0;
        pointer-events: none;
        color: var(--glow);
        background: transparent;
    }

    .${uniqueWrapperClass} .glitch-text::before {
        left: 2px;
        text-shadow: 2px 0 var(--glow-accent-purple);
        clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
        animation: glitch-anim1 3.5s infinite linear alternate-reverse;
    }

    .${uniqueWrapperClass} .glitch-text::after {
        left: -2px;
        text-shadow: -2px 0 oklch(from var(--glow-accent-purple) l c h / 70%);
        clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
        animation: glitch-anim2 4s infinite linear alternate-reverse;
    }

    .${uniqueWrapperClass} .headline {
        color: var(--glow);
        animation: textFlicker 5s linear infinite;
    }

    .${uniqueWrapperClass} .btn:hover {
        background: var(--glow);
        color: #0b0713;
        box-shadow: var(--elev);
        transform: translateY(-2px);
    }

    @keyframes textFlicker {
        0%, 100% { opacity: 1; }
        2% { opacity: .85; }
        4% { opacity: 1; }
        6% { opacity: .55; }
        8% { opacity: 1; }
    }

    @keyframes glitch-anim1 {
        0% { clip-path: polygon(0 2%, 100% 2%, 100% 33%, 0 33%); }
        50% { clip-path: polygon(0 40%, 100% 40%, 100% 60%, 0 60%); }
        100% { clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%); }
    }

    @keyframes glitch-anim2 {
        0% { clip-path: polygon(0 67%, 100% 67%, 100% 90%, 0 90%); }
        50% { clip-path: polygon(0 10%, 100% 10%, 100% 28%, 0 28%); }
        100% { clip-path: polygon(0 15%, 100% 15%, 100% 33%, 0 33%); }
    }

    .${uniqueWrapperClass} .homeShowcase {
        display: grid;
        grid-template-columns: minmax(0, 1fr) clamp(280px, 30%, 400px);
        grid-template-rows: minmax(0, 1fr);
        width: 100%;
        max-width: 1280px;
        max-height: 50vh;
        min-height: 33vh;
        border: 1px solid var(--glow-faint);
        border-radius: 12px;
        overflow: hidden;
        gap: 0;
    }

    .${uniqueWrapperClass} .showcaseFeatured {
        min-width: 0;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justifyContent: flex-end;
        padding: clamp(1.5rem, 4vw, 3rem);
    }

    .${uniqueWrapperClass} .showcaseContent > p {
        transition: opacity 0.3s ease, max-height 0.3s ease, margin 0.3s ease;
        max-height: 100px;
    }

    .${uniqueWrapperClass} .showcaseNav {
        background: rgba(var(--background-primary-alt-rgb), 0.5);
        backdrop-filter: blur(20px);
        overflow: hidden;
        position: relative;
        touch-action: none;
        border-left: 1px solid var(--glow-faint);
    }

    .${uniqueWrapperClass} .showcaseNav-track {
        display: flex;
        flex-direction: column;
        will-change: transform;
    }

    .${uniqueWrapperClass} .showcaseNavItem {
        position: relative;
        display: flex;
        gap: 12px;
        padding: 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--glow-faint);
        border-top: 1px solid var(--glow-faint);
        align-items: center;
        transition: background 0.3s ease;
        flex-shrink: 0;
    }

    .${uniqueWrapperClass} .navItemThumb {
        width: 100px;
        height: 56px;
        object-fit: cover;
        border-radius: 4px;
        filter: grayscale(50%);
        transition: filter 0.3s ease, transform 0.3s ease;
        flex-shrink: 0;
    }

    .${uniqueWrapperClass} .navItemText {
        flex: 1;
        color: var(--text-muted);
        transition: color 0.3s ease;
        min-width: 0;
    }

    .${uniqueWrapperClass} .navProgress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: var(--glow);
        width: 100%;
        transform-origin: left;
        will-change: transform;
        transform: scaleX(0);
    }

    .${uniqueWrapperClass} .showcaseNavItem:hover, .${uniqueWrapperClass} .showcaseNavItem.is-active {
        background: rgba(var(--background-primary-alt-rgb), 0.6);
    }

    .${uniqueWrapperClass} .showcaseNavItem:hover .navItemText, .${uniqueWrapperClass} .showcaseNavItem.is-active .navItemText {
        color: var(--text-normal);
        opacity: 1;
    }

    .${uniqueWrapperClass} .showcaseNavItem:hover .navItemThumb, .${uniqueWrapperClass} .showcaseNavItem.is-active .navItemThumb {
        filter: grayscale(0%);
        transform: scale(1.1);
    }

    .${uniqueWrapperClass} .showcase-content-anim {
        animation: fadeIn .6s var(--ease-out) forwards;
    }

    .${uniqueWrapperClass} .showcase-media-anim {
        animation: mediaZoom .6s var(--ease-out) forwards;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes mediaZoom {
        from { opacity: 0.5; }
        to { opacity: 1; }
    }

    @keyframes progress {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
    }

    .${uniqueWrapperClass} .is-mobile-layout {
        display: flex;
        flex-direction: column;
        height: auto;
    }

    .${uniqueWrapperClass} .is-mobile-layout .showcaseFeatured {
        order: 1;
        max-height: 60vh;
        min-height: auto;
        flex: 1;
    }
    
    .${uniqueWrapperClass}.is-mobile-layout, .${uniqueWrapperClass} .is-mobile-layout {
        min-height: auto;
    }

    .${uniqueWrapperClass} .is-mobile-layout .showcaseNav {
        order: 2;
        width: 100%;
        height: auto;
        padding: 0;
        box-sizing: border-box;
        border-left: none;
        border-top: 1px solid var(--glow-faint);
    }

    .${uniqueWrapperClass} .is-mobile-layout .showcaseNav-track {
        flex-direction: row;
    }

    .${uniqueWrapperClass} .is-mobile-layout .showcaseNavItem {
        flex: 0 0 120px;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        gap: 8px;
        padding: 12px 8px;
        border-bottom: none;
        border-right: 1px solid var(--glow-faint);
    }

    .${uniqueWrapperClass} .is-mobile-layout .navItemThumb {
        width: 80px;
        height: 45px;
    }

    .${uniqueWrapperClass} .is-mobile-layout .navItemText {
        flex: 0 1 auto;
    }

    @media (max-width: 400px) {
        .${uniqueWrapperClass} .showcaseContent > p {
            opacity: 0;
            max-height: 0;
            margin: 0;
            overflow: hidden;
        }
    }

    .${uniqueWrapperClass} .icon-hotspot {
        position: absolute;
        top: 0;
        right: 0;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 50;
    }

    .${uniqueWrapperClass} .icon-hotspot .icon {
        opacity: 0;
        font-size: 14px;
        color: var(--text-muted);
        transition: opacity 0.3s ease-out, color 0.2s ease-out;
    }

    .${uniqueWrapperClass} .icon-hotspot:hover .icon {
        opacity: 1;
        color: var(--glow);
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .showcaseNav-group-header {
        padding: 10px 16px 6px 16px;
        background: rgba(0, 0, 0, 0.4);
        color: var(--text-muted);
        font-size: 12px;
        font-weight: 600;
        font-variant: small-caps;
        letter-spacing: 0.5px;
        position: sticky;
        top: 0;
        left: 0;
        z-index: 10;
        flex-shrink: 0;
    }

    .showcaseNav-group-header + .showcaseNavItem {
        border-top: none;
    }

    .is-mobile-layout .showcaseNav-group-header {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        padding: 16px 6px;
        text-align: center;
        border-right: 1px solid var(--glow-faint);
        border-bottom: none;
    }

    .is-mobile-layout .showcaseNav-group-header + .showcaseNavItem {
        border-top: none;
        border-left: none;
    }
    
     .${uniqueWrapperClass} .pill {
        transition: all 0.25s var(--ease-out);
    }
    .${uniqueWrapperClass} .pill[data-active="1"] {
        color: var(--text-on-accent);
        background: var(--glow-accent-purple);
        box-shadow: var(--elev);
        position: relative;
    }
    .${uniqueWrapperClass} .pill[data-active="1"]::after {
        content: "_";
        position: absolute;
        right: 8px;
        animation: blink 1s steps(1) infinite;
    }
    .${uniqueWrapperClass} .pill:not([data-active="1"]):hover {
        background: var(--glow-med);
        color: var(--glow);
    }
    @keyframes blink {
        50% {
            opacity: 0;
            border-color: transparent;
        }
    }
    
    .${uniqueWrapperClass} .menu-item:hover {
        background: var(--glow-faint);
    }
    
    /* --- ASSETS LIBRARY THEME INTEGRATION --- */
    /* Support both nested and detached (fullscreen) modes */
    .interactive-canvas {
        background: var(--background-primary) !important;
    }
    
    .theme-light .interactive-canvas {
        background-color: #0f0a12 !important;
        filter: invert(1) hue-rotate(180deg) brightness(1.05);
    }
    
    .theme-light .panel-img-box {
        background: #0f0a12 !important;
        filter: invert(1) hue-rotate(180deg);
    }
    
    .theme-light .mini-canvas-wrapper,
    .theme-light .full-tab-wrapper {
        background: #f0f0f4 !important;
    }

    /* Search Bar & Panels in Light Mode */
    .theme-light .image-gallery-searchbar {
        background: #ffffff !important;
        border: 1px solid rgba(0, 0, 0, 0.06) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
        z-index: 9999 !important;
        pointer-events: auto !important;
    }
    .theme-light .image-gallery-searchbar input { 
        color: #1a1a1a !important; 
        background: transparent !important;
    }
    .theme-light .image-gallery-searchbar input:focus {
        background: transparent !important;
        outline: none !important;
    }
    .theme-light .image-gallery-searchbar .action-menu-icon {
        color: rgba(0, 0, 0, 0.4) !important;
        background: transparent !important;
    }
    .theme-light .dropdown-btn { 
        background: #fcfcfd !important; 
        color: #1a1a1a !important; 
        border: 1px solid rgba(0, 0, 0, 0.08) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
    }
    .theme-light .dropdown-btn:hover {
        background: #f3f3f5 !important;
        border-color: rgba(0, 0, 0, 0.12) !important;
    }
    .theme-light .image-gallery-searchbar .select-btn { 
        background: rgba(0, 0, 0, 0.03) !important; 
        color: rgba(0, 0, 0, 0.5) !important; 
    }
    .theme-light .image-gallery-searchbar .select-btn:hover { 
        background: rgba(0, 0, 0, 0.08) !important; 
        color: #000 !important; 
    }
    .theme-light .panel { 
        background: #ffffff !important; 
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
    }
    .theme-light .panel-controls {
        background: #fcfcfd !important;
        border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
    }
    .theme-light .panel-title { color: #1a1a1a !important; }
    .theme-light .panel-row { color: #666 !important; }
    .theme-light .panel-icon-btn {
        background: rgba(0, 0, 0, 0.04) !important;
        color: rgba(0, 0, 0, 0.6) !important;
    }
    .theme-light .panel-icon-btn:hover {
        background: rgba(0, 0, 0, 0.08) !important;
        color: #000 !important;
    }
    
    /* --- TAGS & MASS EDIT PANELS --- */
    .theme-light .tags-panel {
        background: #ffffff !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
        color: #1a1a1a !important;
    }
    .theme-light .tag-btn {
        background: rgba(0, 0, 0, 0.05) !important;
        color: #444 !important;
    }
    .theme-light .tag-btn:hover {
        background: rgba(0, 0, 0, 0.1) !important;
        color: #000 !important;
    }
    .theme-light .mass-edit-panel {
        background: #ffffff !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
    }
    .theme-light .mass-edit-panel h3,
    .theme-light .mass-edit-section label {
        color: #1a1a1a !important;
    }
    .theme-light .input-row input {
        background: #f3f3f5 !important;
        border: 1px solid rgba(0, 0, 0, 0.08) !important;
        color: #1a1a1a !important;
    }
    .theme-light .input-row input:focus {
        border-color: #8b5cf6 !important;
        background: #ffffff !important;
    }
    .theme-light .mass-btn.ghost {
        background: rgba(0, 0, 0, 0.05) !important;
        color: #444 !important;
    }
    .theme-light .mass-btn.ghost:hover {
        background: rgba(0, 0, 0, 0.1) !important;
        color: #000 !important;
    }
    .theme-light .fullscreen-toggle-btn { 
        background: #ffffff !important; 
        border: 1px solid rgba(0, 0, 0, 0.08) !important; 
        color: rgba(0, 0, 0, 0.5) !important; 
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
    }
    
    `;
};

return { STYLES, generateCSS };
```
