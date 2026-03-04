function MaskedTextComponent(props) {
    const { dc, loadScript, isFullTab, isInception, onToggleFullTab, styles, onCodeReloadRequest } = props;
    const { useState, useEffect, useRef } = dc;

    const guiContainerRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // React state for dynamic inline styling
    const [textConfig, setTextConfig] = useState({
        content: 'darkcode',
        fontSize: 8,
        fontWeight: 900,
        color: '#ffffff',
        textTransform: 'uppercase',
        bgColor: '#000000'
    });

    // --- Singleton Persistence ---
    const refs = useRef({
        gui: null,
        GUI: null,
        // Clone config to sync lil-gui with React state
        params: {
            content: 'darkcode',
            fontSize: 8,
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            bgColor: '#000000'
        }
    }).current;

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                // Load lil-gui
                const GUI = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });

                if (!active) return;
                setIsLoaded(true);
                refs.GUI = GUI.default || GUI;

                // --- GUI Setup ---
                const gui = new refs.GUI({ title: 'Config', container: guiContainerRef.current });
                refs.gui = gui;
                gui.close();

                // Dispatch state updates to React
                const updateState = () => {
                    setTextConfig({ ...refs.params });
                };

                const fText = gui.addFolder('Text Settings');
                fText.add(refs.params, 'content').name('Text').onChange(updateState);
                fText.add(refs.params, 'fontSize', 1, 20).name('Font Size (em)').onChange(updateState);
                fText.add(refs.params, 'fontWeight', 100, 900, 100).name('Font Weight').onChange(updateState);
                fText.add(refs.params, 'textTransform', ['uppercase', 'lowercase', 'capitalize', 'none']).name('Transform').onChange(updateState);

                const fColors = gui.addFolder('Colors');
                fColors.addColor(refs.params, 'color').name('Text Color').onChange(updateState);
                fColors.addColor(refs.params, 'bgColor').name('Background').onChange(updateState);

            } catch (e) {
                console.error("MaskedTextComponent Init Error:", e);
                if (active) setError(e.message);
            }
        }

        init();

        return () => {
            active = false;
            if (refs.gui) refs.gui.destroy();
        };
    }, []);

    // Combine global boilerplate styles with the dynamic React state attributes
    const wrapperStyle = {
        ...styles.fullTabWrapper,
        backgroundColor: textConfig.bgColor
    };

    const textStyle = {
        fontSize: `${textConfig.fontSize}em`,
        textTransform: textConfig.textTransform,
        fontWeight: textConfig.fontWeight,
        color: textConfig.color,
        // The grunge mask
        maskImage: 'url(https://res.cloudinary.com/drcrre4xg/image/upload/v1578584486/mask_hphgdl.png)',
        WebkitMaskImage: 'url(https://res.cloudinary.com/drcrre4xg/image/upload/v1578584486/mask_hphgdl.png)',
        maskSize: 'cover',
        WebkitMaskSize: 'cover',
        textAlign: 'center'
    };

    return (
        <div style={wrapperStyle}>
            {!isLoaded && !error && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'monospace', color: '#fff' }}>
                    Loading GUI...
                </div>
            )}

            {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', zIndex: 10, padding: '20px', textAlign: 'center' }}>
                    Error loading Component: {error}
                </div>
            )}

            <div style={styles.textContainer}>
                <div style={textStyle}>
                    {textConfig.content}
                </div>
            </div>

            <div ref={guiContainerRef} style={{ ...styles.guiContainer, '--background-color': '#0d0d0d', '--text-color': '#eee' }} />

            {!isInception && (
                <button
                    onClick={onToggleFullTab}
                    style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                >
                    <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                </button>
            )}

            <style>{`
                .lil-gui { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                }
            `}</style>
        </div>
    );
}

return { MaskedTextComponent };
