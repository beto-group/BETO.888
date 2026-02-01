const { useRef, useEffect } = dc;

function AutoScrollWebview({ src, style, active }) {
    const webviewRef = useRef(null);

    useEffect(() => {
        const wv = webviewRef.current;
        if (!wv) return;

        const injectLogic = () => {
            // 1. Hide Scrollbars for cleaner "Cinematic" look
            wv.insertCSS(`
                ::-webkit-scrollbar { display: none; }
                body { cursor: default; }
            `);

            // 2. Inject Auto-Scroll Loop with Hover-Pause
            wv.executeJavaScript(`
                if (!window._animToolInjected) {
                    window._animToolInjected = true;
                    
                    let scrollSpeed = 0.6; // Pixels per tick
                    let isHovered = false;
                    let lastScrollY = window.scrollY;
                    let samePosCount = 0;

                    // Interaction Handling
                    window.addEventListener('mousemove', () => isHovered = true);
                    window.addEventListener('mousedown', () => isHovered = true);
                    window.addEventListener('touchstart', () => isHovered = true);
                    window.addEventListener('wheel', () => isHovered = true);
                    
                    // Reset hover state if no interaction for a bit? 
                    // Actually, simpler: just pause if mouse is moving over it. 
                    // But since we are inside an iframe/webview, we might stick to simpler logic:
                    // Just auto-scroll unless user actively scrolls? 
                    // Let's stick to a robust "Cinematic Scroll" that yields to user.
                    
                    let idleTimer;
                    const resetIdle = () => {
                        isHovered = true;
                        clearTimeout(idleTimer);
                        idleTimer = setTimeout(() => isHovered = false, 2000); // Resume after 2s idle
                    };
                    
                    ['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'].forEach(evt => 
                        window.addEventListener(evt, resetIdle, {passive: true})
                    );

                    function step() {
                        if (!isHovered) {
                            window.scrollBy(0, scrollSpeed);
                            
                            // Check for bottom or stuck
                            if (window.scrollY === lastScrollY) {
                                samePosCount++;
                                if (samePosCount > 100) { // Stuck at bottom for ~1.5s
                                    window.scrollTo({top: 0, behavior: 'smooth'});
                                    samePosCount = 0;
                                }
                            } else {
                                samePosCount = 0;
                            }
                            lastScrollY = window.scrollY;
                        }
                        requestAnimationFrame(step);
                    }
                    requestAnimationFrame(step);
                }
            `);
        };

        // Attach to DOM-ready
        wv.addEventListener('dom-ready', injectLogic);

        return () => {
            wv.removeEventListener('dom-ready', injectLogic);
        };
    }, []);

    return (
        <webview
            ref={webviewRef}
            src={src}
            style={{
                ...style,
                display: 'inline-flex',
                border: 'none',
                background: '#FFF'
            }}
            allowpopups
            // Important: Enable interaction
            webpreferences="contextIsolation=no, nodeIntegration=no"
        />
    );
}

return { AutoScrollWebview };
