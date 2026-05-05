# NFModal_v11

```jsx
/**
 * NFModal Component
 * Restored from Dashboard888 copy 2 logic with modular prop support.
 */
const { useEffect, useRef, useState, useCallback, useMemo } = dc;

const NFModal = ({ 
    state, 
    onClose, 
    setShowVaultSelector, 
    isImporting, 
    onFullscreenChange, 
    setActiveTab, 
    setPlaygroundFilePath,
    MarkdownViewer,
    OverlayLogo,
    localTheme,
    section,
    dc,
    DocsDetailView,
    parseModuleFileContent,
    openModal,
    styles
}) => {
    const [containerSize, setContainerSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!wrapRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                const w = entry.contentRect.width;
                const h = entry.contentRect.height;
                setContainerSize({ w, h });
            }
        });
        ro.observe(wrapRef.current);
        return () => ro.disconnect();
    }, []);

    const { details, comp, open } = state;

    useEffect(() => {
    }, [open]);

    const [idx, setIdx] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape' && open) onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);
    const primaryComp = comp || details?.comps?.[0];
    
    const isExpandedView = useMemo(() => {
        const s = (section || '').toLowerCase();
        const stateDocs = state?.isDocs;
        const stateDatacore = state?.isDatacore;
        return s.includes('datacore') || s.includes('devlog') || s.includes('docs') || !!stateDocs || !!stateDatacore;
    }, [section, state?.isDocs, state?.isDatacore]);

    const isDatacore = isExpandedView; 

    const [currentTheme, setCurrentTheme] = useState(localTheme || (document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light'));
    
    useEffect(() => {
        if (localTheme) setCurrentTheme(localTheme);
    }, [localTheme]);

    const isLight = currentTheme === 'theme-light' || document.body.classList.contains('theme-light') || !document.body.classList.contains('theme-dark') || window.getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)';

    useEffect(() => {
        if (open) {
            setIdx(0);
            setShowDropdown(false);
        }
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const slides = useMemo(() => {
        if (details?.slides) return details.slides;
        if (state?.slides) return state.slides;
        return [];
    }, [details, state?.slides]);

    const next = useCallback((e) => {
        e?.stopPropagation();
        setIdx(prev => (prev + 1) % slides.length);
    }, [slides.length]);

    const prev = useCallback((e) => {
        e?.stopPropagation();
        setIdx(prev => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    const openWiki = useCallback(async (pathOrName) => {
        if (!pathOrName) return;
        const base = (pathOrName || "").split("/").pop() || "";
        const name = base.replace(/\.md$/i, "");
        try {
            await dc.app.workspace.openLinkText(`${name}`, "", true);
        } catch (e) {
            // Silently fail
        }
    }, [dc]);

    const openAllComponents = useCallback(async () => {
        const comps = details?.comps || [];
        const allPaths = [...new Set([
            ...(primaryComp ? [primaryComp.path] : []),
            ...comps.map(c => c.path)
        ])];
        
        for (const path of allPaths) {
            await openWiki(path);
        }
        setShowDropdown(false);
    }, [details?.comps, primaryComp, openWiki]);

    if (!open || (!details && !comp && !state.loading && !state.isDocs)) return null;

    const currentSlideType = useMemo(() => slides[idx]?.type, [slides, idx]);
    const openAllCount = (details?.comps?.length || 0) + (primaryComp ? 1 : 0);

    const isSmall = containerSize.w < 1024 || containerSize.h < 700;
    const isMobile = containerSize.w < 768 || containerSize.h < 500;

    const scrollRef = useRef(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const handleScroll = useCallback((e) => {
        if (e.target.scrollTop > 300) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    }, []);

    const scrollToTop = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    return (
        <div ref={wrapRef} className={`nf-panel-wrap ${localTheme} ${isExpandedView ? 'is-expanded' : ''} ${isSmall ? 'is-small' : ''} ${isMobile ? 'is-mobile' : ''}`} onClick={onClose}>
            <style>{`
                .nf-panel-wrap {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 100000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: ${isExpandedView ? '0' : 'clamp(8px, 2%, 32px)'};
                    backdrop-filter: blur(28px) saturate(1.8);
                    background: ${isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(10, 10, 15, 0.92)'};
                    animation: nf-fadeIn 0.5s cubic-bezier(0.23, 1, 0.32, 1);
                    font-family: ui-monospace, 'JetBrains Mono', monospace;
                    box-sizing: border-box;
                    overflow: hidden;
                }
                .nf-panel {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 1100px;
                    height: 100%;
                    max-height: 100%;
                    position: relative;
                    background: ${isLight ? '#ffffff' : '#0e0b12'};
                    border-radius: 28px;
                    border: 1px solid ${isLight ? 'rgba(0,0,0,0.15)' : 'var(--glow-faint)'};
                    overflow: hidden;
                    box-shadow: var(--elev);
                    animation: nf-scaleIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                }
                .is-expanded .nf-panel {
                    max-width: 1280px !important;
                    border-radius: 0 !important;
                    height: 100vh !important;
                    max-height: 100vh !important;
                    border: none !important;
                }
                .is-expanded {
                    padding: 0 !important;
                }
                .nf-scroll-area {
                    flex: 1;
                    overflow-y: auto !important;
                    min-height: 0;
                    scrollbar-width: none; /* Hide Firefox scrollbar */
                    -webkit-overflow-scrolling: touch;
                    padding-bottom: 40px;
                }
                .nf-scroll-area::-webkit-scrollbar {
                    display: none; /* Hide WebKit scrollbar */
                }
                .nf-panel-wrap.is-small .nf-panel { max-height: 100%; border-radius: 20px; }
                .nf-panel-wrap.is-mobile { padding: 0; }
                .nf-panel-wrap.is-mobile .nf-panel { width: 100%; height: 100%; max-height: 100%; border-radius: 0; border: none; }
                .nf-sticky-header {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background: rgba(var(--background-primary-rgb), 0.94);
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid var(--glow-faint);
                }
                .nf-top-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    border: 1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'} !important;
                    background: ${isLight ? 'rgba(255,255,255,0.8)' : '#111111'} !important;
                    color: ${isLight ? '#1a1a1a' : '#ffffff'} !important;
                    width: 38px;
                    height: 38px;
                    border-radius: 50% !important;
                    cursor: pointer;
                    display: grid;
                    place-items: center;
                    z-index: 1001;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(12px);
                    box-shadow: ${isLight ? '0 4px 12px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.4)'} !important;
                }
                .nf-top-close:hover {
                    background: ${isLight ? '#ffffff' : 'var(--glow)'} !important;
                    color: ${isLight ? 'var(--glow)' : '#fff'} !important;
                    transform: rotate(90deg) scale(1.1);
                    border-color: var(--glow) !important;
                    box-shadow: 0 0 20px var(--glow-faint), ${isLight ? '0 10px 25px rgba(0,0,0,0.12)' : '0 12px 30px rgba(0,0,0,0.6)'} !important;
                }
                .nf-panel-wrap.is-mobile .nf-top-close { top: 12px; right: 12px; width: 36px; height: 36px; }
                
                .nf-top-scroll {
                    position: absolute;
                    top: 16px;
                    right: 64px;
                    border: 1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'} !important;
                    background: ${isLight ? 'rgba(255,255,255,0.8)' : '#111111'} !important;
                    color: ${isLight ? '#1a1a1a' : '#ffffff'} !important;
                    width: 38px;
                    height: 38px;
                    border-radius: 50% !important;
                    cursor: pointer;
                    display: grid;
                    place-items: center;
                    z-index: 1001;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(12px);
                    box-shadow: ${isLight ? '0 4px 12px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.4)'} !important;
                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(-10px);
                }
                .nf-top-scroll.is-visible {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(0);
                }
                .nf-top-scroll:hover {
                    background: ${isLight ? '#ffffff' : 'var(--glow)'} !important;
                    color: ${isLight ? 'var(--glow)' : '#fff'} !important;
                    transform: translateY(-2px) scale(1.1);
                    border-color: var(--glow) !important;
                    box-shadow: 0 0 20px var(--glow-faint), ${isLight ? '0 10px 25px rgba(0,0,0,0.12)' : '0 12px 30px rgba(0,0,0,0.6)'} !important;
                }
                .nf-panel-wrap.is-mobile .nf-top-scroll { top: 12px; right: 56px; width: 36px; height: 36px; }
                .nf-media-box {
                    width: 100%;
                    height: auto;
                    max-height: 45vh;
                    background: transparent;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .is-expanded .nf-media-box {
                    max-height: 55vh !important;
                }
                .nf-media-box-inner {
                    width: 100%;
                    height: auto;
                    max-height: inherit;
                    position: relative;
                    overflow: hidden;
                }
                .nf-media-asset {
                    width: auto;
                    height: auto;
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    display: block;
                    cursor: pointer;
                    filter: ${isDatacore ? 'none' : 'var(--media-filter)'};
                    transition: filter 0.3s ease;
                }
                
                .nf-nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 48px;
                    height: 48px;
                    background: ${isLight ? 'rgba(255,255,255,0.85)' : 'rgba(var(--background-primary-alt-rgb), 0.5)'} !important;
                    border: 1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'var(--glow-faint)'} !important;
                    color: ${isLight ? '#000000' : 'var(--text-normal)'} !important;
                    border-radius: 50% !important;
                    cursor: pointer;
                    display: grid;
                    place-items: center;
                    z-index: 20;
                    transition: all 0.3s;
                    backdrop-filter: blur(12px);
                    box-shadow: ${isLight ? '0 4px 15px rgba(0,0,0,0.06)' : 'none'} !important;
                }
                .nf-nav-btn:hover { 
                    background: ${isLight ? '#ffffff' : 'var(--glow-faint)'} !important; 
                    transform: translateY(-50%) scale(1.1); 
                    color: var(--glow) !important;
                    border-color: var(--glow) !important;
                    box-shadow: ${isLight ? '0 8px 25px rgba(0,0,0,0.12)' : 'none'} !important;
                }
                .nf-prev { left: 20px; }
                .nf-next { right: 20px; }
                .nf-panel-wrap.is-mobile .nf-nav-btn { width: 36px; height: 36px; }
                .nf-panel-wrap.is-mobile .nf-prev { left: 10px; }
                .nf-panel-wrap.is-mobile .nf-next { right: 10px; }
                
                .nf-indicators {
                    position: absolute;
                    bottom: 16px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 8px;
                    z-index: 20;
                    padding: 6px 12px;
                    background: rgba(var(--background-primary-alt-rgb), 0.3);
                    border-radius: 20px;
                    backdrop-filter: blur(8px);
                }
                .nf-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-faint); cursor: pointer; transition: all 0.3s; }
                .nf-dot.is-active { background: var(--glow); transform: scale(1.3); }

                .nf-actions {
                    display: flex;
                    gap: 12px;
                    padding: 16px 24px;
                    justify-content: center;
                    flex-wrap: wrap;
                    background: rgba(var(--background-primary-alt-rgb), 0.35);
                }
                .nf-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    min-width: 90px;
                    min-height: 90px;
                    border-radius: 16px !important;
                    border: 1px solid ${isLight ? '#e1e1e1' : 'var(--glow-faint)'} !important;
                    background: ${isLight ? '#ffffff' : 'rgba(var(--background-primary-alt-rgb), 0.4)'} !important;
                    color: ${isLight ? '#1a1a1a' : 'var(--text-muted)'} !important;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: ${isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'} !important;
                }
                .nf-btn:hover { 
                    background: ${isLight ? '#fcfcfd' : 'var(--glow-faint)'} !important; 
                    color: ${isLight ? '#000' : 'var(--text-normal)'} !important; 
                    transform: translateY(-4px) !important; 
                    border-color: ${isLight ? 'var(--glow)' : 'var(--glow-faint)'} !important;
                    box-shadow: ${isLight ? '0 8px 20px rgba(0,0,0,0.08)' : 'none'} !important;
                }
                .nf-btn.is-active { 
                    background: var(--glow-med) !important; 
                    color: var(--text-on-accent) !important; 
                    border-color: var(--glow) !important; 
                }
                .nf-btn dc.Icon, .nf-btn svg { 
                    font-size: 24px; 
                    margin-bottom: 2px;
                    color: ${isLight ? 'var(--glow)' : 'inherit'} !important;
                    transition: transform 0.3s ease;
                }
                .nf-btn:hover dc.Icon, .nf-btn:hover svg {
                    transform: scale(1.1);
                }
                .nf-btn span { 
                    font-size: 9px; 
                    font-weight: 800; 
                    letter-spacing: 1px; 
                    text-transform: uppercase; 
                    font-variant: small-caps;
                    opacity: ${isLight ? '0.8' : '1'};
                }
                .nf-panel-wrap.is-mobile .nf-actions { padding: 12px; gap: 8px; }
                .nf-panel-wrap.is-mobile .nf-btn { min-width: 70px; min-height: 70px; padding: 8px; border-radius: 12px !important; }
                .nf-panel-wrap.is-mobile .nf-btn dc.Icon, .nf-panel-wrap.is-mobile .nf-btn svg { font-size: 20px; }
                .nf-panel-wrap.is-mobile .nf-btn span { font-size: 8px; }

                .nf-dropdown-container { position: relative; }
                .nf-dropdown-menu {
                    position: absolute;
                    bottom: calc(100% + 14px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--background-primary-alt);
                    backdrop-filter: blur(32px) saturate(1.8);
                    border: 1px solid var(--glow-faint);
                    border-radius: 20px;
                    padding: 8px;
                    min-width: 250px;
                    z-index: 100;
                    box-shadow: var(--elev);
                    animation: nf-dropdownIn 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                    display: flex;
                    flex-direction: column;
                }
                .nf-dropdown-label {
                    padding: 10px 14px 6px;
                    font-size: 10px;
                    font-weight: 900;
                    color: var(--text-faint);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                }
                .nf-dropdown-main-box {
                    padding: 4px;
                    background: rgba(var(--background-primary-alt-rgb), 0.3);
                    border-radius: 14px;
                    margin: 0 4px;
                    border: 1px solid var(--glow-faint);
                }
                .nf-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 10px 16px;
                    border-radius: 12px;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 13.5px;
                    font-weight: 700;
                    letter-spacing: 0.2px;
                }
                .nf-dropdown-item:hover { background: var(--glow-faint); color: var(--text-normal); }
                .nf-dropdown-item.primary { background: var(--glow-faint); color: var(--text-normal); cursor: pointer; }
                .nf-dropdown-item.primary:hover { background: var(--glow-med); color: var(--text-on-accent); }
                
                .nf-dropdown-item dc.Icon, .nf-dropdown-item svg { font-size: 18px; opacity: 0.9; }
                .nf-dropdown-divider { height: 1px; background: var(--glow-faint); margin: 8px 14px; }

                .nf-transcript {
                    padding: 48px 64px;
                    color: var(--text-normal);
                    max-width: 900px;
                    margin: 0 auto;
                }
                .nf-title { font-size: 28px; font-weight: 800; margin-bottom: 12px; color: var(--glow); letter-spacing: 1.5px; font-variant: small-caps; }
                .nf-subtitle { font-size: 14px; color: var(--text-muted); margin-bottom: 40px; font-style: italic; opacity: 0.8; }
                .nf-content-block { margin-bottom: 40px; line-height: 1.8; font-size: 15px; }
                .nf-content-block h1, .nf-content-block h2, .nf-content-block h3 { font-variant: small-caps; letter-spacing: 1px; color: var(--text-bright); }
                .nf-panel-wrap.is-small .nf-transcript { padding: 40px; }
                .nf-panel-wrap.is-small .nf-title { font-size: 24px; }
                .nf-panel-wrap.is-mobile .nf-transcript { padding: 32px 20px; }
                .nf-panel-wrap.is-mobile .nf-title { font-size: 20px; }

                .nf-callout {
                    margin: 24px 0;
                    border-radius: 18px;
                    border: 1px solid var(--glow-faint);
                    background: rgba(var(--background-primary-alt-rgb), 0.3);
                    overflow: hidden;
                }
                .nf-callout-header {
                    padding: 16px 24px;
                    background: rgba(var(--background-primary-alt-rgb), 0.4);
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    cursor: pointer;
                    user-select: none;
                }
                .nf-callout-title { font-size: 17px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; font-variant: small-caps; flex: 1; color: var(--text-normal); }
                
                .nf-callout-content {
                    padding: 24px 32px;
                    font-size: 14px;
                    border-top: 1px solid var(--glow-faint);
                    line-height: 1.7;
                    color: var(--text-muted);
                }

                @keyframes nf-fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes nf-scaleIn { from { opacity: 0; transform: scale(0.975); } to { opacity: 1; transform: scale(1); } }
                @keyframes nf-dropdownIn { from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.96); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
            `}</style>

            <div className="nf-panel" onClick={e => e.stopPropagation()}>
                <button className="nf-top-close" onClick={onClose} aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                {state.isDocs && (
                    <button className={`nf-top-scroll ${showScrollTop ? 'is-visible' : ''}`} onClick={scrollToTop} aria-label="Scroll to top">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                )}

                <div className="nf-scroll-area" ref={scrollRef} onScroll={handleScroll}>
                    <div className="nf-sticky-header">
                        {slides.length > 0 && (
                            <div className="nf-media-box">
                                <>
                                    <div key={idx} className="nf-media-box-inner" style={{ animation: 'nf-fadeIn 0.4s' }}>
                                            {(() => {
                                                const scale = slides[idx].scale || 1;
                                                const pos = (slides[idx].position || "50% 50%").trim().split(/\s+/);
                                                
                                                const ensureUnit = (v) => {
                                                    if (!v) return "50%";
                                                    v = String(v).trim();
                                                    if (!v.endsWith('%') && !v.endsWith('px') && !v.endsWith('vh') && !v.endsWith('vw')) return v + "%";
                                                    return v;
                                                };

                                                const posX = ensureUnit(pos[0]);
                                                const posY = ensureUnit(pos[1]);
                                                
                                                const mediaStyle = {
                                                    width: 'auto',
                                                    height: 'auto',
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain',
                                                    border: 'none',
                                                    padding: 0,
                                                    margin: 0,
                                                    display: 'block',
                                                    transform: `translate(calc(${posX} - 50%), calc(${posY} - 50%)) scale(${scale})`.trim(),
                                                    transformOrigin: 'center center',
                                                    filter: isLight ? 'invert(1) hue-rotate(180deg)' : 'none'
                                                };

                                                return currentSlideType === "video" ? (
                                                    <video 
                                                        src={slides[idx].src} 
                                                        autoPlay loop muted playsInline 
                                                        className="nf-media-asset"
                                                        style={mediaStyle}
                                                        onClick={() => onFullscreenChange(slides[idx])}
                                                    />
                                                ) : (
                                                    <img 
                                                        src={slides[idx].src} 
                                                        className="nf-media-asset"
                                                        style={mediaStyle}
                                                        onClick={() => onFullscreenChange(slides[idx])}
                                                    />
                                                );
                                            })()}
                                    </div>
                                    {slides.length > 1 && (
                                        <>
                                            <button className="nf-nav-btn nf-prev" onClick={prev}>‹</button>
                                            <button className="nf-nav-btn nf-next" onClick={next}>›</button>
                                            <div className="nf-indicators">
                                                {slides.map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`nf-dot ${i === idx ? 'is-active' : ''}`} 
                                                        onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            </div>
                        )}

                        {(primaryComp || details?.comps?.length > 0) && (
                            <div className="nf-actions">
                                {primaryComp && (
                                    <button className="nf-btn" onClick={() => { setPlaygroundFilePath(primaryComp.path); setActiveTab('playground'); onClose(); }}>
                                        <dc.Icon icon="flask-conical" />
                                        <span>PLAYGROUND</span>
                                    </button>
                                )}
                                
                                <div className="nf-dropdown-container" ref={dropdownRef}>
                                    <button 
                                        className={`nf-btn ${showDropdown ? 'is-active' : ''}`} 
                                        onClick={() => setShowDropdown(!showDropdown)}
                                    >
                                        <dc.Icon icon="layers" />
                                        <span>FILES</span>
                                    </button>
                                    {showDropdown && (
                                        <div className="nf-dropdown-menu">
                                            <div className="nf-dropdown-label">Documentation</div>
                                            <div className="nf-dropdown-main-box">
                                                <div className="nf-dropdown-item primary" onClick={() => { openWiki(primaryComp.path); setShowDropdown(false); }}>
                                                    <dc.Icon icon="book" />
                                                    <span>Open Read Me</span>
                                                </div>
                                            </div>
                                            
                                            {details?.comps?.length > 0 && (
                                                <>
                                                    <div className="nf-dropdown-divider" />
                                                    <div className="nf-dropdown-label">Implementation</div>
                                                    {details.comps.map((c, i) => {
                                                        const isViewer = c.path.toLowerCase().includes('.viewer');
                                                        return (
                                                            <div key={i} className="nf-dropdown-item" onClick={() => { openWiki(c.path); setShowDropdown(false); }}>
                                                                <dc.Icon icon={isViewer ? 'eye' : 'cpu'} style={{ fontSize: '18px' }} />
                                                                <span>{isViewer ? 'Launch Viewer' : 'Open Component'}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            )}
                                            
                                            <div className="nf-dropdown-divider" />
                                            <div className="nf-dropdown-item all-btn" onClick={openAllComponents}>
                                                <dc.Icon icon="external-link" />
                                                <span>Open All [{openAllCount}]</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {primaryComp && (
                                    <button className="nf-btn" onClick={() => setShowVaultSelector(primaryComp)}>
                                        <dc.Icon icon="package" />
                                        <span>EXPORT</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="nf-transcript">
                        {state.isDocs && DocsDetailView ? (
                            <DocsDetailView 
                                moduleMetadata={state.moduleMetadata}
                                modulesInCategory={state.modulesInCategory}
                                activeCategory={state.activeCategory}
                                categories={state.categories || []}
                                content={state.content}
                                isLoading={state.loading}
                                onCategorySelect={(cat) => {
                                    openModal({
                                        ...state,
                                        activeCategory: cat,
                                        modulesInCategory: state.allModules?.[cat] || []
                                    });
                                }}
                                onModuleSelect={(m) => {
                                    openModal({ ...state, loading: true });
                                    const loadNext = async () => {
                                        try {
                                            const file = dc.app.vault.getAbstractFileByPath(m.filePath);
                                            const content = await parseModuleFileContent(file);
                                            openModal({
                                                ...state,
                                                title: m.displayName,
                                                subtitle: m.majorCategory,
                                                moduleMetadata: m,
                                                content: content,
                                                loading: false
                                            });
                                        } catch (e) {
                                            openModal({ ...state, loading: false, error: e.message });
                                        }
                                    };
                                    loadNext();
                                }}
                                dc={dc}
                                codeHighlighter={state.codeHighlighter}
                                OverlayLogo={OverlayLogo}
                                localTheme={localTheme}
                                styles={styles}
                                allModules={state.allModules}
                                openModal={openModal}
                            />
                        ) : details ? (
                            <>
                                <h2 className="nf-title">{details.title}</h2>
                                {details.subtitle && <p className="nf-subtitle">{details.subtitle}</p>}
                                
                                <div className="nf-content-block" dangerouslySetInnerHTML={{ __html: details.description }} />

                                {details.doesBlock && (
                                    <details className="nf-callout" open>
                                        <summary className="nf-callout-header">
                                            <dc.Icon icon="check-circle" style={{ color: 'var(--glow)', fontSize: '18px' }} />
                                            <span className="nf-callout-title">Functionality (Does)</span>
                                        </summary>
                                        <div className="nf-callout-content" dangerouslySetInnerHTML={{ __html: details.doesBlock }} />
                                    </details>
                                )}

                                {details.cantBlock && (
                                    <details className="nf-callout">
                                        <summary className="nf-callout-header">
                                            <dc.Icon icon="alert-triangle" style={{ color: 'oklch(0.75 0.18 80)', fontSize: '18px' }} />
                                            <span className="nf-callout-title">Limitations (Can't)</span>
                                        </summary>
                                        <div className="nf-callout-content" dangerouslySetInnerHTML={{ __html: details.cantBlock }} />
                                    </details>
                                )}

                                {details.disclaimerBlock && (
                                    <details className="nf-callout">
                                        <summary className="nf-callout-header">
                                            <dc.Icon icon="info" style={{ color: 'oklch(0.65 0.18 240)', fontSize: '18px' }} />
                                            <span className="nf-callout-title">Disclaimer</span>
                                        </summary>
                                        <div className="nf-callout-content" dangerouslySetInnerHTML={{ __html: details.disclaimerBlock }} />
                                    </details>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

return { NFModal_v11: NFModal };
```
