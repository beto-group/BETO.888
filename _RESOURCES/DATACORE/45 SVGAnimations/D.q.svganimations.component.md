


# ViewComponent

```jsx
const { useEffect, useRef, useState, useMemo } = dc;

// Assumes `ICONS` is available from the require statement in the environment.
const { ICONS } = await dc.require(dc.headerLink(dc.resolvePath("D.q.svganimations.component.md"), "ICONS"));

// =================================================================================
// THEME COLORS
// =================================================================================
const THEME = {
  bg: {
    primary: '#0a0a0a',
    secondary: '#1a1a1a',
    tertiary: '#2a2a2a',
  },
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    muted: '#888888',
  },
  accent: {
    purple: 'rgba(155, 135, 245, 0.8)',
    purpleHover: 'rgba(155, 135, 245, 1)',
    purpleDark: 'rgba(155, 135, 245, 0.3)',
  },
  border: '#2a2a2a',
  success: '#10b981',
  error: '#ef4444',
};

// =================================================================================
// --- DOM TRAVERSAL UTILITIES ---
// =================================================================================
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}

function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) {
            return child;
        }
    }
    return null;
}

// =================================================================================
// --- UTILITY FUNCTIONS & HOOKS ---
// =================================================================================
function useInView(options) {
    const [isInView, setIsInView] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    if (ref.current) {
                        observer.unobserve(ref.current);
                    }
                }
            },
            { ...options }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [options]);

    return [ref, isInView];
}

// =================================================================================
// --- AnimatedIcon Component (No Changes) ---
// =================================================================================
const AnimatedIcon = ({ svgString, isActive, isInView }) => {
    const iconRef = useRef(null);
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);
    const pathsRef = useRef([]);
    const [hasRevealed, setHasRevealed] = useState(false);

    const ANIMATION_SPEED_MULTIPLIER = 0.88;
    const DURATION = 1 * ANIMATION_SPEED_MULTIPLIER;

    useEffect(() => {
        const container = iconRef.current;
        if (!container || !svgString) return;
        
        let processedSvgString = svgString
            .replace(/width="[^"]*"/, '')
            .replace(/height="[^"]*"/, '')
            .replace(/(<svg[^>]*)/, `$1 style="width: 100%; height: 100%;"`);

        container.innerHTML = processedSvgString;
        const svgElement = container.querySelector('svg');
        if (!svgElement) return;

        pathsRef.current = svgElement.querySelectorAll('[class*="svg-elem-"]');
        if (pathsRef.current.length === 0) return;

        pathsRef.current.forEach((path, index) => {
            if (path.tagName.toLowerCase() === 'g') {
                path.dataset.animationType = 'ignore';
                return;
            }

            const originalStroke = path.getAttribute('stroke');
            const originalStrokeWidth = path.getAttribute('stroke-width');
            const originalFill = path.getAttribute('fill');
            const isStrokedElement = originalStroke && originalStroke !== 'none' && originalStrokeWidth !== '0';
            const isFilledElement = originalFill && originalFill !== 'none';
            const delay = (0.1 * index) * ANIMATION_SPEED_MULTIPLIER;
            
            if (isStrokedElement) {
                path.dataset.animationType = 'stroke';
                const length = path.getTotalLength();
                if (length > 0) {
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = length;
                    path.style.stroke = 'white';
                    path.style.strokeWidth = '1.5px';
                    path.style.fill = 'transparent';
                    path.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay + (DURATION * 0.2)}s`;
                }
            } 
            else if (isFilledElement) {
                path.dataset.animationType = 'fill';
                path.style.stroke = 'none';
                path.style.fill = 'transparent';
                path.style.transition = `fill ${DURATION * 0.7}s ease ${delay + (DURATION * 0.2)}s`;
            } 
            else {
                path.dataset.animationType = 'ignore';
            }
        });
    }, [svgString]);

    useEffect(() => {
        if (isInView && !hasRevealed) {
            const paths = pathsRef.current;
            if (!paths || paths.length === 0) return;

            const maxDelay = (0.1 * (paths.length - 1)) * ANIMATION_SPEED_MULTIPLIER;
            const totalRevealTime = (DURATION + maxDelay) * 1000;

            paths.forEach(path => {
                const type = path.dataset.animationType;
                if (type === 'stroke') {
                    path.style.strokeDashoffset = '0';
                } else if (type === 'fill') {
                    path.style.fill = path.getAttribute('fill') || 'black';
                }
            });

            setTimeout(() => {
                setHasRevealed(true);
            }, totalRevealTime);
        }
    }, [isInView, hasRevealed]);

    useEffect(() => {
        if (!hasRevealed) return;
        const paths = pathsRef.current;
        if (!paths || paths.length === 0) return;
        const maxDelay = (0.1 * (paths.length - 1)) * ANIMATION_SPEED_MULTIPLIER;
        const totalAnimationTime = (DURATION + maxDelay) * 1000;

        const runAnimationCycle = () => {
            paths.forEach(path => {
                const type = path.dataset.animationType;
                if (type === 'stroke') {
                    const length = path.getTotalLength();
                    if (length > 0) path.style.strokeDashoffset = length;
                    path.style.fill = 'transparent';
                } else if (type === 'fill') {
                    path.style.fill = 'transparent';
                }
            });

            timeoutRef.current = setTimeout(() => {
                paths.forEach(path => {
                    const type = path.dataset.animationType;
                    if (type === 'stroke') {
                        path.style.strokeDashoffset = '0';
                    } else if (type === 'fill') {
                        path.style.fill = path.getAttribute('fill') || 'black';
                    }
                });
            }, totalAnimationTime * 0.88);
        };

        if (isActive) {
            runAnimationCycle();
            intervalRef.current = setInterval(runAnimationCycle, totalAnimationTime * 1.5);
        } else {
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
            paths.forEach(path => {
                const type = path.dataset.animationType;
                if (type === 'stroke') {
                    path.style.strokeDashoffset = '0';
                } else if (type === 'fill') {
                    path.style.fill = path.getAttribute('fill') || 'black';
                }
            });
        }

        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
        };
    }, [isActive, hasRevealed]);

    return <div ref={iconRef} className="animated-icon-container" />;
};

// =================================================================================
// --- IconTileView Component ---
// =================================================================================
const IconTileView = ({ iconConfig, index, onTileClick, isEnlarged, onClose }) => {
    const STYLES = {
        fullTabWrapper: { 
            position: 'relative', height: "140px", width: "140px", padding: "16px", 
            boxSizing: "border-box", display: "flex", flexDirection: "column", 
            alignItems: "center", justifyContent: "center", gap: "8px", 
            backgroundColor: THEME.bg.secondary, 
            border: `1px solid ${THEME.border}`, 
            borderRadius: "8px", 
            color: THEME.text.primary, 
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
            cursor: "pointer" 
        },
        mainSvgContainer: { 
            width: "70px", height: "70px", 
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.3s ease"
        },
        enlargedWrapper: { 
            position: 'relative', width: '600px', height: '600px', padding: "32px", 
            boxSizing: "border-box", display: "flex", flexDirection: "column", 
            alignItems: "center", justifyContent: "center", gap: "20px", 
            backgroundColor: THEME.bg.secondary, 
            border: `2px solid ${THEME.accent.purple}`, 
            borderRadius: "16px", 
            color: THEME.text.primary, 
            cursor: 'default',
            boxShadow: '0 0 40px rgba(155, 135, 245, 0.3)'
        },
        enlargedSvgContainer: { 
            width: "400px", height: "400px", 
            display: "flex", alignItems: "center", justifyContent: "center" 
        },
        closeButton: { 
            position: 'absolute', top: '20px', right: '20px', 
            background: 'none', border: 'none',
            cursor: 'pointer', zIndex: 10,
            padding: '8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
        },
        compactText: { 
            margin: 0, 
            color: THEME.text.secondary, 
            fontSize: "13px", 
            textAlign: 'center',
            fontWeight: '500'
        },
    };
    const [isHovering, setIsHovering] = useState(false);
    const [tileRef, isInView] = useInView({ threshold: 0.1 });
    const isActive = isEnlarged || isHovering;
    
    const wrapperStyle = isEnlarged ? STYLES.enlargedWrapper : {
        ...STYLES.fullTabWrapper,
        ...(isHovering ? {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 20px rgba(155, 135, 245, 0.2)`,
            borderColor: THEME.accent.purple
        } : {})
    };
    
    const svgContainerStyle = {
        ...(isEnlarged ? STYLES.enlargedSvgContainer : STYLES.mainSvgContainer),
        ...(isHovering && !isEnlarged ? { transform: 'scale(1.1)' } : {})
    };

    return (
        <div 
            ref={tileRef} 
            style={wrapperStyle} 
            onMouseEnter={() => !isEnlarged && setIsHovering(true)} 
            onMouseLeave={() => !isEnlarged && setIsHovering(false)} 
            onClick={() => !isEnlarged && onTileClick && onTileClick(index)}
        >
            {isEnlarged && (
                <button 
                    style={{
                        ...STYLES.closeButton,
                        backgroundColor: isHovering ? THEME.bg.tertiary : 'transparent'
                    }}
                    onClick={onClose} 
                    title="Close"
                    onMouseEnter={(e) => { e.target.style.backgroundColor = THEME.bg.tertiary; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                >
                    <dc.Icon icon="x" style={{ fontSize: '24px', color: THEME.text.secondary }} />
                </button>
            )}
            <div style={svgContainerStyle}>
                <AnimatedIcon svgString={iconConfig.svg} isActive={isActive} isInView={isEnlarged || isInView} />
            </div>
            <p style={isEnlarged ? {...STYLES.compactText, fontSize: '18px', color: THEME.text.primary} : STYLES.compactText}>
                {iconConfig.name}
            </p>
        </div>
    );
};

// =================================================================================
// --- BasicView Component ---
// =================================================================================
function BasicView() {
    const [enlargedIndex, setEnlargedIndex] = useState(null);
    const STYLES = {
        gridContainer: { 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '20px', 
            padding: '24px', 
            justifyContent: 'center', 
            transition: 'filter 0.3s ease-in-out',
            backgroundColor: THEME.bg.primary,
            minHeight: '400px'
        },
        modalOverlay: { 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0,
            bottom: 0,
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(10, 10, 10, 0.95)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 10000, 
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'auto'
        },
        modalContent: { 
            cursor: 'default',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: 'auto',
            maxWidth: '100%',
            maxHeight: '100%'
        },
    };
    const handleCloseEnlarged = (e) => { if (e) e.stopPropagation(); setEnlargedIndex(null); };
    useEffect(() => { document.body.style.overflow = enlargedIndex !== null ? 'hidden' : 'auto'; return () => { document.body.style.overflow = 'auto'; }; }, [enlargedIndex]);

    return (
        <div>
            <div style={{ ...STYLES.gridContainer, filter: enlargedIndex !== null ? 'blur(5px)' : 'none' }}>
                {ICONS.map((icon, index) => <IconTileView key={icon.name || index} iconConfig={icon} onTileClick={setEnlargedIndex} index={index} isEnlarged={false} />)}
            </div>
            {enlargedIndex !== null && (
                <div style={STYLES.modalOverlay} onClick={handleCloseEnlarged}>
                    <div style={STYLES.modalContent} onClick={(e) => e.stopPropagation()}>
                        <IconTileView key={`enlarged-${ICONS[enlargedIndex].name}`} iconConfig={ICONS[enlargedIndex]} isEnlarged={true} onClose={handleCloseEnlarged} index={enlargedIndex} />
                    </div>
                </div>
            )}
        </div>
    );
}

// =================================================================================
// --- LiveInputView Component (INTEGRATED & CORRECTED) ---
// =================================================================================
function LiveInputView() {
    const [svgInput, setSvgInput] = useState(``);
    const [cssInput, setCssInput] = useState(``);
    const [liveIcon, setLiveIcon] = useState(null);
    const [animationKey, setAnimationKey] = useState(0);

    // --- State and Refs for Video Export ---
    const [exportStatus, setExportStatus] = useState('idle'); // 'idle', 'rendering', 'done'
    const [isLibLoaded, setIsLibLoaded] = useState(false);
    const [libError, setLibError] = useState(null);
    const [exportResolution, setExportResolution] = useState(1080); // Default resolution
    const canvgRef = useRef(null);

    // --- Load the Canvg library ---
    useEffect(() => {
        async function loadCanvgModule() {
            if (canvgRef.current) return;
            try {
                const module = await import('https://cdn.jsdelivr.net/npm/canvg@4.0.3/+esm');
                canvgRef.current = module.Canvg; // Correctly get the named export
                if (canvgRef.current) {
                    console.log("Canvg class loaded successfully.");
                    setIsLibLoaded(true);
                } else {
                    throw new Error("Canvg class not found in the loaded module.");
                }
            } catch (err) {
                console.error("Failed to load or initialize Canvg ES Module:", err);
                setLibError("Failed to load rendering library. Check network or CSP.");
            }
        }
        loadCanvgModule();
    }, []);

    // --- Function to generate self-animating CSS for SVG download ---
    const generateSelfAnimatingCSS = (svgString) => {
        if (!svgString) return '';
    
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.innerHTML = svgString;
        document.body.appendChild(tempContainer);
    
        const elements = Array.from(tempContainer.querySelectorAll('[class*="svg-elem-"]'));
        let cssString = '';
        let keyframesString = '';
        
        const DURATION = 1 * 0.88;
        const totalDuration = (DURATION + 0.1 * (elements.length > 0 ? elements.length - 1 : 0) * 0.88);
    
        elements.forEach((el, index) => {
            const className = el.getAttribute('class');
            if (!className || el.tagName.toLowerCase() === 'g') return;
    
            const originalStroke = el.getAttribute('stroke');
            const originalStrokeWidth = el.getAttribute('stroke-width');
            const originalFill = el.getAttribute('fill') || 'black';
            
            const isStrokedElement = originalStroke && originalStroke !== 'none' && originalStrokeWidth !== '0';
            const isFilledElement = originalFill && originalFill !== 'none';
    
            const delay = (0.1 * index) * 0.88;
            const animDuration = DURATION;
            const fillAnimDuration = DURATION * 0.7;
    
            const startPercent = parseFloat(((delay / totalDuration) * 100).toFixed(2));
            const endPercent = parseFloat(((delay + animDuration) / totalDuration) * 100).toFixed(2);
            const fillStartPercent = parseFloat((((delay + (animDuration * 0.2)) / totalDuration) * 100).toFixed(2));
            const fillEndPercent = parseFloat((((delay + (animDuration * 0.2) + fillAnimDuration) / totalDuration) * 100).toFixed(2));
            
            if (isStrokedElement && typeof el.getTotalLength === 'function') {
                const length = el.getTotalLength();
                if (length > 0) {
                    keyframesString += `@keyframes ${className}-anim-stroke { 0%, ${startPercent}% { stroke-dashoffset: ${length}; } ${endPercent > 100 ? 100 : endPercent}%, 100% { stroke-dashoffset: 0; } }\n`;
                    // --- FIX: Changed 'forwards' to 'infinite' ---
                    cssString += `.${className} { stroke-dasharray: ${length}; animation: ${className}-anim-stroke ${totalDuration}s ease-out infinite; }\n`;
                }
            } else if (isFilledElement) {
                keyframesString += `@keyframes ${className}-anim-fill { 0%, ${fillStartPercent}% { fill-opacity: 0; } ${fillEndPercent > 100 ? 100 : fillEndPercent}%, 100% { fill-opacity: 1; } }\n`;
                // --- FIX: Changed 'forwards' to 'infinite' ---
                cssString += `.${className} { fill: ${originalFill}; animation: ${className}-anim-fill ${totalDuration}s ease-out infinite; }\n`;
            }
        });
    
        document.body.removeChild(tempContainer);
        return keyframesString + cssString;
    };
    
    // --- Handlers for the buttons ---
    const handleAnimate = () => {
        setLiveIcon({ name: 'Live Preview', svg: svgInput });
        setAnimationKey(prevKey => prevKey + 1);
    };

    const handleDownloadSVG = () => {
        if (!svgInput) return alert("There is no SVG code to download.");
        const selfAnimatingCSS = generateSelfAnimatingCSS(svgInput);
        const finalSvg = svgInput.replace(/(<svg[^>]*>)/, `$1<style>${selfAnimatingCSS}${cssInput}</style>`);
        
        const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'icon-animated.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleExportVideo = async () => {
        if (!isLibLoaded || !svgInput || exportStatus === 'rendering') return;
        if (libError) return alert(libError);
        setExportStatus('rendering');
    
        const tempContainer = document.createElement('div');
        try {
            const Canvg = canvgRef.current;
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.innerHTML = svgInput;
            document.body.appendChild(tempContainer);
    
            const svgEl = tempContainer.querySelector('svg');
            if (!svgEl) {
                throw new Error("Could not find a valid SVG element in the provided code.");
            }
    
            const canvas = document.createElement('canvas');
            canvas.width = exportResolution;
            canvas.height = exportResolution;
            const ctx = canvas.getContext('2d');
    
            const paths = Array.from(svgEl.querySelectorAll('[class*="svg-elem-"]'));
            const DURATION = 1 * 0.88;
            const maxDelay = (paths.length > 0 ? paths.length - 1 : 0) * 0.1 * 0.88;
            const revealTime = (DURATION + maxDelay) * 1000;
    
            paths.forEach((path) => {
                 if (path.tagName.toLowerCase() === 'g') { path.dataset.animationType = 'ignore'; return; }
                 const originalStroke = path.getAttribute('stroke');
                 const originalStrokeWidth = path.getAttribute('stroke-width');
                 const isStroked = originalStroke && originalStroke !== 'none' && originalStrokeWidth !== '0';
    
                if (isStroked && typeof path.getTotalLength === 'function') {
                    path.dataset.animationType = 'stroke';
                    const len = path.getTotalLength();
                    path.style.strokeDasharray = len;
                    path.style.strokeDashoffset = len;
                } else {
                    path.dataset.animationType = 'fill';
                    path.style.fillOpacity = 0;
                }
            });
    
            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { 
                mimeType: 'video/webm',
                videoBitsPerSecond: 2500000 * (exportResolution / 720) // Increase bitrate for better quality
            });
            const chunks = [];
            recorder.ondataavailable = e => e.data.size > 0 && chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'animation.webm';
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(tempContainer);
                setExportStatus('done');
                setTimeout(() => setExportStatus('idle'), 2000);
            };
    
            recorder.start();
            let startTime = performance.now();
            const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
            const recordFrame = async (currentTime) => {
                const elapsedTime = currentTime - startTime;
    
                if (elapsedTime >= revealTime + 500) { 
                    if (recorder.state === 'recording') recorder.stop();
                    return;
                }
                
                paths.forEach((path, index) => {
                    const type = path.dataset.animationType;
                    const delay = (0.1 * index) * 0.88 * 1000;
                    const timeIntoAnim = elapsedTime - delay;
                    
                    if (timeIntoAnim < 0) return;
    
                    if (type === 'stroke') {
                        const strokeProgress = easeInOutQuad(Math.min(timeIntoAnim / (DURATION * 1000), 1));
                        const length = parseFloat(path.style.strokeDasharray);
                        path.style.strokeDashoffset = length * (1 - strokeProgress);
                    }
                    
                    const fillDelay = delay + (DURATION * 0.2 * 1000);
                    const timeIntoFill = elapsedTime - fillDelay;
                    if (timeIntoFill >= 0) {
                         const fillProgress = easeInOutQuad(Math.min(timeIntoFill / (DURATION * 0.7 * 1000), 1));
                         path.style.fillOpacity = fillProgress;
                    }
                });

                const currentSvgString = svgEl.outerHTML;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const canvgInstance = await Canvg.fromString(ctx, currentSvgString);
                await canvgInstance.render();
                
                requestAnimationFrame(recordFrame);
            };
    
            requestAnimationFrame(recordFrame);
    
        } catch (error) {
            console.error("Video export failed:", error);
            alert(`Video export failed: ${error.message}`);
            document.body.removeChild(tempContainer);
            setExportStatus('idle');
        }
    };

    const STYLES = {
        container: { 
            padding: '24px', 
            maxWidth: '100%', 
            margin: '0 auto',
            backgroundColor: THEME.bg.primary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        header: {
            marginBottom: '24px',
            textAlign: 'center',
            flexShrink: 0
        },
        title: { 
            fontSize: '28px', 
            color: THEME.text.primary, 
            marginBottom: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
        },
        subtitle: {
            fontSize: '14px',
            color: THEME.text.muted,
            marginBottom: '8px'
        },
        tipBox: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: THEME.bg.tertiary,
            border: `1px solid ${THEME.accent.purple}`,
            borderRadius: '6px',
            fontSize: '13px',
            color: THEME.text.secondary,
            marginTop: '12px'
        },
        tipLink: {
            color: THEME.accent.purple,
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'color 0.2s ease'
        },
        mainContent: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflow: 'hidden',
            minHeight: 0
        },
        editorSection: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            flexShrink: 0
        },
        textareaContainer: { 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: THEME.bg.secondary,
            padding: '16px',
            borderRadius: '12px',
            border: `1px solid ${THEME.border}`,
            boxShadow: `0 4px 6px ${THEME.accent.purpleDark}`,
            minHeight: 0,
            overflow: 'hidden'
        },
        labelRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexShrink: 0
        },
        label: { 
            color: THEME.text.primary,
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        labelIcon: {
            fontSize: '18px',
            color: THEME.accent.purple
        },
        textarea: { 
            width: '100%', 
            flex: 1,
            minHeight: '300px',
            boxSizing: 'border-box', 
            backgroundColor: THEME.bg.primary, 
            border: `2px solid ${THEME.border}`, 
            color: THEME.text.primary, 
            borderRadius: '8px', 
            padding: '16px', 
            fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
            fontSize: '13px',
            lineHeight: '1.6',
            resize: 'none',
            transition: 'all 0.3s ease',
            outline: 'none',
            overflow: 'auto'
        },
        actionsSection: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px',
            backgroundColor: THEME.bg.secondary,
            borderRadius: '12px',
            border: `1px solid ${THEME.border}`,
            flexShrink: 0
        },
        actionsHeader: {
            fontSize: '16px',
            fontWeight: '600',
            color: THEME.text.primary,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        buttonGrid: { 
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
        },
        button: { 
            padding: '16px 20px', 
            cursor: 'pointer', 
            fontSize: '14px', 
            fontWeight: '600', 
            backgroundColor: THEME.accent.purple, 
            color: THEME.text.primary, 
            border: 'none', 
            borderRadius: '8px', 
            textAlign: 'center', 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: `0 2px 8px ${THEME.accent.purpleDark}`
        },
        buttonDisabled: {
            backgroundColor: THEME.bg.tertiary,
            cursor: 'not-allowed',
            opacity: 0.5,
            boxShadow: 'none'
        },
        previewSection: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'auto'
        },
        previewHeader: {
            fontSize: '16px',
            fontWeight: '600',
            color: THEME.text.primary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
        },
        preview: { 
            flex: 1,
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            backgroundColor: THEME.bg.secondary,
            borderRadius: '12px',
            border: `2px dashed ${THEME.border}`,
            minHeight: '250px'
        },
        previewPlaceholder: {
            color: THEME.text.muted,
            fontSize: '15px',
            textAlign: 'center',
            lineHeight: '1.8'
        },
        select: { 
            padding: '16px 40px 16px 16px', 
            borderRadius: '8px', 
            border: `2px solid ${THEME.border}`, 
            backgroundColor: THEME.bg.primary, 
            color: THEME.text.primary,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.3s ease',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(155, 135, 245, 0.8)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '20px',
            minWidth: '150px',
            height: '54px',
            boxSizing: 'border-box',
            lineHeight: '1.4'
        }
    };

    return (
        <div style={STYLES.container}>
            <style>{cssInput}</style>
            
            {/* Header Section */}
            <div style={STYLES.header}>
                <h2 style={STYLES.title}>
                    <dc.Icon icon="code-2" style={{ fontSize: '28px', color: THEME.accent.purple }} />
                    Live SVG & CSS Animator
                </h2>
                <p style={STYLES.subtitle}>
                    Create and animate SVG graphics with custom CSS styling
                </p>
                <div style={STYLES.tipBox}>
                    <dc.Icon icon="lightbulb" style={{ fontSize: '16px', color: THEME.accent.purple }} />
                    <span>
                        Utilize{' '}
                        <a 
                            href="https://svgartista.net/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={STYLES.tipLink}
                            onMouseOver={(e) => e.target.style.color = THEME.accent.purpleHover}
                            onMouseOut={(e) => e.target.style.color = THEME.accent.purple}
                        >
                            SVG Artista
                        </a>
                        {' '}to create quick animations (for now ;)
                    </span>
                </div>
            </div>

            <div style={STYLES.mainContent}>
                {/* Code Editors */}
                <div style={STYLES.editorSection}>
                    <div style={STYLES.textareaContainer}>
                        <div style={STYLES.labelRow}>
                            <label style={STYLES.label} htmlFor="svg-input">
                                <dc.Icon icon="code" style={STYLES.labelIcon} />
                                SVG Code
                            </label>
                        </div>
                        <textarea 
                            id="svg-input" 
                            style={STYLES.textarea} 
                            placeholder="Paste your SVG code here..."
                            value={svgInput} 
                            onChange={(e) => setSvgInput(e.target.value)}
                            onFocus={(e) => e.target.style.borderColor = THEME.accent.purple}
                            onBlur={(e) => e.target.style.borderColor = THEME.border}
                        />
                    </div>
                    <div style={STYLES.textareaContainer}>
                        <div style={STYLES.labelRow}>
                            <label style={STYLES.label} htmlFor="css-input">
                                <dc.Icon icon="palette" style={STYLES.labelIcon} />
                                Additional CSS
                            </label>
                        </div>
                        <textarea 
                            id="css-input" 
                            style={STYLES.textarea} 
                            placeholder="Add custom CSS animations, hover effects, etc..."
                            value={cssInput} 
                            onChange={(e) => setCssInput(e.target.value)}
                            onFocus={(e) => e.target.style.borderColor = THEME.accent.purple}
                            onBlur={(e) => e.target.style.borderColor = THEME.border}
                        />
                    </div>
                </div>

                {/* Actions Section */}
                <div style={STYLES.actionsSection}>
                    <div style={STYLES.actionsHeader}>
                        <dc.Icon icon="settings" style={{ fontSize: '18px', color: THEME.accent.purple }} />
                        Actions & Export
                    </div>
                    <div style={STYLES.buttonGrid}>
                        <button 
                            style={STYLES.button} 
                            onClick={handleAnimate}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = THEME.accent.purpleHover;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = THEME.accent.purple;
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <dc.Icon icon="play" style={{ fontSize: '18px' }} />
                            Animate Preview
                        </button>
                        <button 
                            style={STYLES.button} 
                            onClick={handleDownloadSVG}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = THEME.accent.purpleHover;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = THEME.accent.purple;
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <dc.Icon icon="download" style={{ fontSize: '18px' }} />
                            Download SVG
                        </button>
                        <button 
                            style={
                                exportStatus === 'rendering' || !isLibLoaded 
                                    ? {...STYLES.button, ...STYLES.buttonDisabled} 
                                    : STYLES.button
                            } 
                            onClick={handleExportVideo} 
                            disabled={!isLibLoaded || exportStatus === 'rendering'}
                            onMouseOver={(e) => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor = THEME.accent.purpleHover;
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor = THEME.accent.purple;
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }
                            }}
                        >
                            <dc.Icon icon="video" style={{ fontSize: '18px' }} />
                            {!isLibLoaded && (libError ? 'Export Error' : 'Loading...')}
                            {isLibLoaded && exportStatus === 'idle' && 'Export Video'}
                            {isLibLoaded && exportStatus === 'rendering' && 'Rendering...'}
                            {isLibLoaded && exportStatus === 'done' && 'Done!'}
                        </button>
                        <select 
                            style={STYLES.select} 
                            value={exportResolution} 
                            onChange={(e) => setExportResolution(parseInt(e.target.value))}
                            onFocus={(e) => e.target.style.borderColor = THEME.accent.purple}
                            onBlur={(e) => e.target.style.borderColor = THEME.border}
                        >
                            <option value={720}>720p WebM</option>
                            <option value={1080}>1080p WebM</option>
                            <option value={1440}>1440p WebM</option>
                        </select>
                    </div>
                </div>

                {/* Preview Section */}
                <div style={STYLES.previewSection}>
                    <div style={STYLES.previewHeader}>
                        <dc.Icon icon="eye" style={{ fontSize: '18px', color: THEME.accent.purple }} />
                        Live Preview
                    </div>
                    <div style={STYLES.preview}>
                        {liveIcon ? (
                            <IconTileView 
                                key={animationKey}
                                iconConfig={liveIcon} 
                                isEnlarged={false} 
                                index={0}
                            />
                        ) : (
                            <div style={STYLES.previewPlaceholder}>
                                <dc.Icon icon="image" style={{ fontSize: '48px', color: THEME.text.muted, marginBottom: '16px' }} />
                                <p>Paste SVG code and click "Animate Preview" to see the result</p>
                                <p style={{ fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>
                                    Your animation will appear here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
// =================================================================================
// --- Main App Component (No Changes) ---
// =================================================================================
// --- Main App Component ---
// =================================================================================
function App() {
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;
    const [view, setView] = useState('basic');
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    const STYLES = {
        hoverEffectStyle: `
            .${uniqueWrapperClass} .subtle-icon {
                opacity: 0;
                transform: scale(0.9);
                transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
            }
            .${uniqueWrapperClass}:hover .subtle-icon {
                opacity: 0.7;
                transform: scale(1);
            }
            .${uniqueWrapperClass} .subtle-icon:hover {
                opacity: 1;
            }
            .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
                visibility: visible;
                opacity: 1;
            }
        `,
        iconContainer: {
            position: 'absolute',
            top: '20px',
            right: '24px',
            fontFamily: 'monospace',
            fontSize: '16px',
            color: THEME.text.muted,
            userSelect: 'none',
            cursor: 'pointer',
            zIndex: 10,
        },
        tooltip: {
            visibility: 'hidden',
            opacity: 0,
            backgroundColor: THEME.bg.secondary,
            color: THEME.text.primary,
            textAlign: 'center',
            borderRadius: '6px',
            padding: '6px 12px',
            position: 'absolute',
            zIndex: 1,
            top: '50%',
            right: '120%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            border: `1px solid ${THEME.border}`,
        },
        container: {
            backgroundColor: THEME.bg.primary,
            height: '100%',
            minHeight: '100vh',
            borderRadius: '0',
            overflow: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        },
        header: {
            padding: '24px',
            borderBottom: `2px solid ${THEME.border}`,
            backgroundColor: THEME.bg.secondary,
            flexShrink: 0
        },
        title: {
            margin: 0,
            fontSize: '28px',
            fontWeight: '600',
            color: THEME.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        subtitle: {
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: THEME.text.muted
        },
        nav: { 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '12px', 
            padding: '20px',
            backgroundColor: THEME.bg.primary,
            flexShrink: 0
        },
        contentArea: {
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
        },
        navButton: { 
            padding: '12px 24px', 
            cursor: 'pointer', 
            backgroundColor: THEME.bg.secondary, 
            border: `1px solid ${THEME.border}`, 
            color: THEME.text.secondary, 
            borderRadius: '8px', 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        activeButton: { 
            color: THEME.text.primary, 
            backgroundColor: THEME.bg.tertiary, 
            borderColor: THEME.accent.purple,
            boxShadow: `0 0 20px ${THEME.accent.purpleDark}`
        },
        compactWrapper: {
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            border: `2px dashed ${THEME.border}`,
            borderRadius: '8px',
            backgroundColor: THEME.bg.secondary,
        },
        compactText: { 
            margin: 0, 
            color: THEME.text.muted, 
            fontSize: '14px' 
        },
        buttonGroup: { 
            display: 'flex', 
            gap: '12px' 
        },
        button: {
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: THEME.text.primary,
            backgroundColor: THEME.accent.purple,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
        }
    };

    // Full-tab mode effect
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        
        const targetPaneContent = findNearestAncestorWithClass(
            container,
            'workspace-leaf-content'
        );
        
        if (!targetPaneContent) {
            setIsFullTab(false);
            return;
        }
        
        const contentWrapper =
            findDirectChildByClass(targetPaneContent, 'view-content') ||
            targetPaneContent;
        
        stateRefs.originalParent = container.parentNode;
        stateRefs.placeholder = document.createElement('div');
        stateRefs.placeholder.style.display = 'none';
        container.parentNode.insertBefore(stateRefs.placeholder, container);
        
        stateRefs.parentPositionInfo = {
            element: contentWrapper,
            original: window.getComputedStyle(contentWrapper).position,
        };
        
        if (stateRefs.parentPositionInfo.original === 'static') {
            contentWrapper.style.position = 'relative';
        }
        
        contentWrapper.appendChild(container);
        
        Object.assign(container.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '9998',
            overflow: 'auto',
        });
        
        return () => {
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(
                    container,
                    stateRefs.placeholder
                );
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.original === 'static'
                        ? ''
                        : stateRefs.parentPositionInfo.original;
            }
            container.removeAttribute('style');
            Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
        };
    }, [isFullTab]);

    const handleExitFullTab = (e) => {
        e.stopPropagation();
        setIsFullTab(false);
    };
    
    const handleEnterFullTab = () => setIsFullTab(true);

    // Compact mode view
    if (!isFullTab) {
        return (
            <div ref={containerRef} style={STYLES.compactWrapper}>
                <p style={STYLES.compactText}>SVG Animations component is in compact mode.</p>
                <div style={STYLES.buttonGroup}>
                    <button style={STYLES.button} onClick={handleEnterFullTab}>
                        Enter Full Tab Mode
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef}>
            <style>{STYLES.hoverEffectStyle}</style>
            <div style={STYLES.container} className={uniqueWrapperClass}>
                <div
                    style={STYLES.iconContainer}
                    className="subtle-icon"
                    onClick={handleExitFullTab}
                >
                    &lt;/&gt;
                    <span className="exit-tooltip" style={STYLES.tooltip}>
                        Close Full Mode
                    </span>
                </div>
                <div style={STYLES.header}>
                    <h1 style={STYLES.title}>
                        <dc.Icon icon="sparkles" style={{ fontSize: '32px', color: THEME.accent.purple }} />
                        SVG Animations
                    </h1>
                    <p style={STYLES.subtitle}>Animate and export beautiful SVG graphics</p>
                </div>
                <nav style={STYLES.nav}>
                    <button 
                        style={view === 'basic' ? {...STYLES.navButton, ...STYLES.activeButton} : STYLES.navButton} 
                        onClick={() => setView('basic')}
                    >
                        <dc.Icon icon="grid-3x3" style={{ fontSize: '16px' }} />
                        Icon Grid
                    </button>
                    <button 
                        style={view === 'live' ? {...STYLES.navButton, ...STYLES.activeButton} : STYLES.navButton} 
                        onClick={() => setView('live')}
                    >
                        <dc.Icon icon="code-2" style={{ fontSize: '16px' }} />
                        Build Your Own SVG
                    </button>
                </nav>

                <div style={STYLES.contentArea}>
                    {view === 'basic' ? <BasicView /> : <LiveInputView />}
                </div>
            </div>
        </div>
    );
};

return { BasicView : App };
```



# ICONS

```jsx



const ICONS = [
    {
        name: "Visual Engine",
        svg: `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.200515262142744 47.96987941252857" width="53.20051574707031" height="47.969879150390625" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round" transform="translate(25.867525800277235 9.999999999999956) rotate(312.1342999278807 3.0428359911468306 3.0428359911469123)"><path d="M6.09 3.04 C6.09 3.22, 6.07 3.4, 6.04 3.57 C6.01 3.74, 5.96 3.92, 5.9 4.08 C5.84 4.25, 5.77 4.41, 5.68 4.56 C5.59 4.72, 5.49 4.86, 5.37 5 C5.26 5.13, 5.13 5.26, 5 5.37 C4.86 5.49, 4.72 5.59, 4.56 5.68 C4.41 5.77, 4.25 5.84, 4.08 5.9 C3.92 5.96, 3.74 6.01, 3.57 6.04 C3.4 6.07, 3.22 6.09, 3.04 6.09 C2.87 6.09, 2.69 6.07, 2.51 6.04 C2.34 6.01, 2.17 5.96, 2 5.9 C1.84 5.84, 1.67 5.77, 1.52 5.68 C1.37 5.59, 1.22 5.49, 1.09 5.37 C0.95 5.26, 0.83 5.13, 0.71 5 C0.6 4.86, 0.5 4.72, 0.41 4.56 C0.32 4.41, 0.24 4.25, 0.18 4.08 C0.12 3.92, 0.08 3.74, 0.05 3.57 C0.02 3.4, 0 3.22, 0 3.04 C0 2.87, 0.02 2.69, 0.05 2.51 C0.08 2.34, 0.12 2.17, 0.18 2 C0.24 1.84, 0.32 1.67, 0.41 1.52 C0.5 1.37, 0.6 1.22, 0.71 1.09 C0.83 0.95, 0.95 0.83, 1.09 0.71 C1.22 0.6, 1.37 0.5, 1.52 0.41 C1.67 0.32, 1.84 0.24, 2 0.18 C2.17 0.12, 2.34 0.08, 2.51 0.05 C2.69 0.02, 2.87 0, 3.04 0 C3.22 0, 3.4 0.02, 3.57 0.05 C3.74 0.08, 3.92 0.12, 4.08 0.18 C4.25 0.24, 4.41 0.32, 4.56 0.41 C4.72 0.5, 4.86 0.6, 5 0.71 C5.13 0.83, 5.26 0.95, 5.37 1.09 C5.49 1.22, 5.59 1.37, 5.68 1.52 C5.77 1.67, 5.84 1.84, 5.9 2 C5.96 2.17, 6.01 2.34, 6.04 2.51 C6.07 2.69, 6.08 2.95, 6.09 3.04 C6.09 3.13, 6.09 2.95, 6.09 3.04" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-1"></path><path d="M6.09 3.04 C6.09 3.22, 6.07 3.4, 6.04 3.57 C6.01 3.74, 5.96 3.92, 5.9 4.08 C5.84 4.25, 5.77 4.41, 5.68 4.56 C5.59 4.72, 5.49 4.86, 5.37 5 C5.26 5.13, 5.13 5.26, 5 5.37 C4.86 5.49, 4.72 5.59, 4.56 5.68 C4.41 5.77, 4.25 5.84, 4.08 5.9 C3.92 5.96, 3.74 6.01, 3.57 6.04 C3.4 6.07, 3.22 6.09, 3.04 6.09 C2.87 6.09, 2.69 6.07, 2.51 6.04 C2.34 6.01, 2.17 5.96, 2 5.9 C1.84 5.84, 1.67 5.77, 1.52 5.68 C1.37 5.59, 1.22 5.49, 1.09 5.37 C0.95 5.26, 0.83 5.13, 0.71 5 C0.6 4.86, 0.5 4.72, 0.41 4.56 C0.32 4.41, 0.24 4.25, 0.18 4.08 C0.12 3.92, 0.08 3.74, 0.05 3.57 C0.02 3.4, 0 3.22, 0 3.04 C0 2.87, 0.02 2.69, 0.05 2.51 C0.08 2.34, 0.12 2.17, 0.18 2 C0.24 1.84, 0.32 1.67, 0.41 1.52 C0.5 1.37, 0.6 1.22, 0.71 1.09 C0.83 0.95, 0.95 0.83, 1.09 0.71 C1.22 0.6, 1.37 0.5, 1.52 0.41 C1.67 0.32, 1.84 0.24, 2 0.18 C2.17 0.12, 2.34 0.08, 2.51 0.05 C2.69 0.02, 2.87 0, 3.04 0 C3.22 0, 3.4 0.02, 3.57 0.05 C3.74 0.08, 3.92 0.12, 4.08 0.18 C4.25 0.24, 4.41 0.32, 4.56 0.41 C4.72 0.5, 4.86 0.6, 5 0.71 C5.13 0.83, 5.26 0.95, 5.37 1.09 C5.49 1.22, 5.59 1.37, 5.68 1.52 C5.77 1.67, 5.84 1.84, 5.9 2 C5.96 2.17, 6.01 2.34, 6.04 2.51 C6.07 2.69, 6.08 2.95, 6.09 3.04 C6.09 3.13, 6.09 2.95, 6.09 3.04" stroke="#E1E1E1" stroke-width="1" fill="none" class="svg-elem-2"></path></g><g stroke-linecap="round" transform="translate(22.9672693481225 23.789105322385293) rotate(312.1342999278807 3.0428359911468306 3.042835991146913)"><path d="M6.09 3.04 C6.09 3.22, 6.07 3.4, 6.04 3.57 C6.01 3.74, 5.96 3.92, 5.9 4.08 C5.84 4.25, 5.77 4.41, 5.68 4.56 C5.59 4.72, 5.49 4.86, 5.37 5 C5.26 5.13, 5.13 5.26, 5 5.37 C4.86 5.49, 4.72 5.59, 4.56 5.68 C4.41 5.77, 4.25 5.84, 4.08 5.9 C3.92 5.96, 3.74 6.01, 3.57 6.04 C3.4 6.07, 3.22 6.09, 3.04 6.09 C2.87 6.09, 2.69 6.07, 2.51 6.04 C2.34 6.01, 2.17 5.96, 2 5.9 C1.84 5.84, 1.67 5.77, 1.52 5.68 C1.37 5.59, 1.22 5.49, 1.09 5.37 C0.95 5.26, 0.83 5.13, 0.71 5 C0.6 4.86, 0.5 4.72, 0.41 4.56 C0.32 4.41, 0.24 4.25, 0.18 4.08 C0.12 3.92, 0.08 3.74, 0.05 3.57 C0.02 3.4, 0 3.22, 0 3.04 C0 2.87, 0.02 2.69, 0.05 2.51 C0.08 2.34, 0.12 2.17, 0.18 2 C0.24 1.84, 0.32 1.67, 0.41 1.52 C0.5 1.37, 0.6 1.22, 0.71 1.09 C0.83 0.95, 0.95 0.83, 1.09 0.71 C1.22 0.6, 1.37 0.5, 1.52 0.41 C1.67 0.32, 1.84 0.24, 2 0.18 C2.17 0.12, 2.34 0.08, 2.51 0.05 C2.69 0.02, 2.87 0, 3.04 0 C3.22 0, 3.4 0.02, 3.57 0.05 C3.74 0.08, 3.92 0.12, 4.08 0.18 C4.25 0.24, 4.41 0.32, 4.56 0.41 C4.72 0.5, 4.86 0.6, 5 0.71 C5.13 0.83, 5.26 0.95, 5.37 1.09 C5.49 1.22, 5.59 1.37, 5.68 1.52 C5.77 1.67, 5.84 1.84, 5.9 2 C5.96 2.17, 6.01 2.34, 6.04 2.51 C6.07 2.69, 6.08 2.95, 6.09 3.04 C6.09 3.13, 6.09 2.95, 6.09 3.04" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-3"></path><path d="M6.09 3.04 C6.09 3.22, 6.07 3.4, 6.04 3.57 C6.01 3.74, 5.96 3.92, 5.9 4.08 C5.84 4.25, 5.77 4.41, 5.68 4.56 C5.59 4.72, 5.49 4.86, 5.37 5 C5.26 5.13, 5.13 5.26, 5 5.37 C4.86 5.49, 4.72 5.59, 4.56 5.68 C4.41 5.77, 4.25 5.84, 4.08 5.9 C3.92 5.96, 3.74 6.01, 3.57 6.04 C3.4 6.07, 3.22 6.09, 3.04 6.09 C2.87 6.09, 2.69 6.07, 2.51 6.04 C2.34 6.01, 2.17 5.96, 2 5.9 C1.84 5.84, 1.67 5.77, 1.52 5.68 C1.37 5.59, 1.22 5.49, 1.09 5.37 C0.95 5.26, 0.83 5.13, 0.71 5 C0.6 4.86, 0.5 4.72, 0.41 4.56 C0.32 4.41, 0.24 4.25, 0.18 4.08 C0.12 3.92, 0.08 3.74, 0.05 3.57 C0.02 3.4, 0 3.22, 0 3.04 C0 2.87, 0.02 2.69, 0.05 2.51 C0.08 2.34, 0.12 2.17, 0.18 2 C0.24 1.84, 0.32 1.67, 0.41 1.52 C0.5 1.37, 0.6 1.22, 0.71 1.09 C0.83 0.95, 0.95 0.83, 1.09 0.71 C1.22 0.6, 1.37 0.5, 1.52 0.41 C1.67 0.32, 1.84 0.24, 2 0.18 C2.17 0.12, 2.34 0.08, 2.51 0.05 C2.69 0.02, 2.87 0, 3.04 0 C3.22 0, 3.4 0.02, 3.57 0.05 C3.74 0.08, 3.92 0.12, 4.08 0.18 C4.25 0.24, 4.41 0.32, 4.56 0.41 C4.72 0.5, 4.86 0.6, 5 0.71 C5.13 0.83, 5.26 0.95, 5.37 1.09 C5.49 1.22, 5.59 1.37, 5.68 1.52 C5.77 1.67, 5.84 1.84, 5.9 2 C5.96 2.17, 6.01 2.34, 6.04 2.51 C6.07 2.69, 6.08 2.95, 6.09 3.04 C6.09 3.13, 6.09 2.95, 6.09 3.04" stroke="#E1E1E1" stroke-width="1" fill="none" class="svg-elem-4"></path></g><g stroke-linecap="round"><g transform="translate(30.824517432831726 17.921856754523287) rotate(312.1342999278807 -3.2014201638921804 2.006355866687656)"><path d="M0 0 C-1.07 0.67, -5.34 3.34, -6.4 4.01 M0 0 C-1.07 0.67, -5.34 3.34, -6.4 4.01" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-5"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(29.702452697238186 21.571287975059562) rotate(312.1342999278807 4.48861470372367 2.7857523313551535)"><path d="M0 0 C1.5 0.93, 7.48 4.64, 8.98 5.57 M0 0 C1.5 0.93, 7.48 4.64, 8.98 5.57" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(10 27.39104741717896) rotate(0 15.978527375164731 -0.5595207262218782)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 -0.32, 0 -0.63, 0 -1.12 M0 0 C0 -0.3, 0 -0.6, 0 -1.12 M0 -1.12 C0.34 -1.81, 0.69 -2.51, 1.08 -3.31 M0 -1.12 C0.27 -1.67, 0.55 -2.23, 1.08 -3.31 M1.08 -3.31 C1.6 -4.07, 2.11 -4.83, 2.4 -5.25 M1.08 -3.31 C1.54 -3.99, 2.01 -4.68, 2.4 -5.25 M2.4 -5.25 C2.86 -5.77, 3.33 -6.28, 3.93 -6.95 M2.4 -5.25 C2.72 -5.61, 3.04 -5.97, 3.93 -6.95 M3.93 -6.95 C4.57 -7.51, 5.22 -8.06, 5.64 -8.41 M3.93 -6.95 C4.56 -7.5, 5.2 -8.04, 5.64 -8.41 M5.64 -8.41 C6.8 -9.06, 7.97 -9.71, 9.48 -10.56 M5.64 -8.41 C6.75 -9.03, 7.87 -9.65, 9.48 -10.56 M9.48 -10.56 C10.56 -10.84, 11.64 -11.12, 13.7 -11.66 M9.48 -10.56 C10.5 -10.82, 11.53 -11.09, 13.7 -11.66 M13.7 -11.66 C15.2 -11.67, 16.7 -11.69, 18.06 -11.7 M13.7 -11.66 C15.23 -11.67, 16.77 -11.69, 18.06 -11.7 M18.06 -11.7 C19.5 -11.34, 20.95 -10.98, 22.33 -10.63 M18.06 -11.7 C19.33 -11.38, 20.61 -11.06, 22.33 -10.63 M22.33 -10.63 C22.95 -10.34, 23.57 -10.05, 24.36 -9.68 M22.33 -10.63 C23 -10.31, 23.68 -10, 24.36 -9.68 M24.36 -9.68 C25.02 -9.24, 25.69 -8.81, 26.28 -8.43 M24.36 -9.68 C25.12 -9.18, 25.88 -8.69, 26.28 -8.43 M26.28 -8.43 C26.68 -8.09, 27.08 -7.74, 28.06 -6.9 M26.28 -8.43 C26.87 -7.92, 27.47 -7.41, 28.06 -6.9 M28.06 -6.9 C28.56 -6.34, 29.05 -5.77, 29.67 -5.07 M28.06 -6.9 C28.4 -6.51, 28.75 -6.12, 29.67 -5.07 M29.67 -5.07 C30.17 -4.33, 30.67 -3.58, 30.95 -3.17 M29.67 -5.07 C30.1 -4.44, 30.52 -3.81, 30.95 -3.17 M30.95 -3.17 C31.2 -2.66, 31.45 -2.15, 31.96 -1.12 M30.95 -3.17 C31.3 -2.46, 31.65 -1.75, 31.96 -1.12 M31.96 -1.12 C31.96 -0.84, 31.96 -0.56, 31.96 0 M31.96 -1.12 C31.96 -0.82, 31.96 -0.51, 31.96 0 M31.96 0 C31.62 0.67, 31.29 1.35, 30.88 2.19 M31.96 0 C31.73 0.46, 31.5 0.92, 30.88 2.19 M30.88 2.19 C30.48 2.77, 30.08 3.36, 29.56 4.13 M30.88 2.19 C30.4 2.9, 29.91 3.61, 29.56 4.13 M29.56 4.13 C29.22 4.51, 28.88 4.89, 28.03 5.84 M29.56 4.13 C29.03 4.72, 28.5 5.32, 28.03 5.84 M28.03 5.84 C27.35 6.41, 26.67 6.99, 26.32 7.29 M28.03 5.84 C27.69 6.13, 27.35 6.42, 26.32 7.29 M26.32 7.29 C25.42 7.79, 24.52 8.3, 22.48 9.44 M26.32 7.29 C25.12 7.96, 23.92 8.63, 22.48 9.44 M22.48 9.44 C21.43 9.71, 20.39 9.98, 18.26 10.54 M22.48 9.44 C21.5 9.69, 20.52 9.95, 18.26 10.54 M18.26 10.54 C16.54 10.56, 14.81 10.57, 13.9 10.58 M18.26 10.54 C16.59 10.56, 14.91 10.57, 13.9 10.58 M13.9 10.58 C12.55 10.24, 11.2 9.91, 9.63 9.51 M13.9 10.58 C12.68 10.27, 11.46 9.97, 9.63 9.51 M9.63 9.51 C9.11 9.27, 8.58 9.02, 7.6 8.56 M9.63 9.51 C9.1 9.26, 8.57 9.01, 7.6 8.56 M7.6 8.56 C6.98 8.16, 6.37 7.76, 5.68 7.31 M7.6 8.56 C7.1 8.24, 6.61 7.92, 5.68 7.31 M5.68 7.31 C5 6.73, 4.32 6.15, 3.9 5.78 M5.68 7.31 C5.03 6.76, 4.39 6.2, 3.9 5.78 M3.9 5.78 C3.36 5.17, 2.82 4.56, 2.28 3.95 M3.9 5.78 C3.55 5.39, 3.2 4.99, 2.28 3.95 M2.28 3.95 C2 3.52, 1.71 3.1, 1.01 2.05 M2.28 3.95 C1.87 3.33, 1.45 2.71, 1.01 2.05 M1.01 2.05 C0.72 1.47, 0.44 0.88, 0 0 M1.01 2.05 C0.71 1.45, 0.41 0.84, 0 0" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-7"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(21.15506380397119 22.00806254476324) rotate(0 4.823463762859319 4.823463762859376)"><path d="M9.65 4.82 C9.65 5.1, 9.62 5.39, 9.57 5.66 C9.53 5.94, 9.45 6.21, 9.36 6.47 C9.26 6.74, 9.14 6.99, 9 7.24 C8.86 7.48, 8.7 7.71, 8.52 7.92 C8.34 8.14, 8.14 8.34, 7.92 8.52 C7.71 8.7, 7.48 8.86, 7.24 9 C6.99 9.14, 6.74 9.26, 6.47 9.36 C6.21 9.45, 5.94 9.53, 5.66 9.57 C5.39 9.62, 5.1 9.65, 4.82 9.65 C4.54 9.65, 4.26 9.62, 3.99 9.57 C3.71 9.53, 3.44 9.45, 3.17 9.36 C2.91 9.26, 2.65 9.14, 2.41 9 C2.17 8.86, 1.94 8.7, 1.72 8.52 C1.51 8.34, 1.31 8.14, 1.13 7.92 C0.95 7.71, 0.79 7.48, 0.65 7.24 C0.51 6.99, 0.39 6.74, 0.29 6.47 C0.2 6.21, 0.12 5.94, 0.07 5.66 C0.02 5.39, 0 5.1, 0 4.82 C0 4.54, 0.02 4.26, 0.07 3.99 C0.12 3.71, 0.2 3.44, 0.29 3.17 C0.39 2.91, 0.51 2.65, 0.65 2.41 C0.79 2.17, 0.95 1.94, 1.13 1.72 C1.31 1.51, 1.51 1.31, 1.72 1.13 C1.94 0.95, 2.17 0.79, 2.41 0.65 C2.65 0.51, 2.91 0.39, 3.17 0.29 C3.44 0.2, 3.71 0.12, 3.99 0.07 C4.26 0.02, 4.54 0, 4.82 0 C5.1 0, 5.39 0.02, 5.66 0.07 C5.94 0.12, 6.21 0.2, 6.47 0.29 C6.74 0.39, 6.99 0.51, 7.24 0.65 C7.48 0.79, 7.71 0.95, 7.92 1.13 C8.14 1.31, 8.34 1.51, 8.52 1.72 C8.7 1.94, 8.86 2.17, 9 2.41 C9.14 2.65, 9.26 2.91, 9.36 3.17 C9.45 3.44, 9.53 3.71, 9.57 3.99 C9.62 4.26, 9.63 4.68, 9.65 4.82 C9.66 4.96, 9.66 4.68, 9.65 4.82" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-8"></path></g><g stroke-linecap="round"><g transform="translate(19.046457563341846 34.16621620738654) rotate(0 6.866764542111014 -7.289873846537846)"><path d="M0 0 C0.57 0, 1.14 0, 2.77 0 M0 0 C0.69 0, 1.38 0, 2.77 0 M2.77 0 C2.77 0, 2.77 0, 2.77 0 M2.77 0 C2.77 0, 2.77 0, 2.77 0 M2.77 0 C2.84 -0.03, 2.91 -0.06, 3.09 -0.13 M2.77 0 C2.89 -0.05, 3.01 -0.1, 3.09 -0.13 M3.09 -0.13 C3.13 -0.24, 3.18 -0.35, 3.22 -0.46 M3.09 -0.13 C3.14 -0.25, 3.19 -0.38, 3.22 -0.46 M3.22 -0.46 C3.22 -0.52, 3.22 -0.59, 3.22 -0.71 M3.22 -0.46 C3.22 -0.53, 3.22 -0.6, 3.22 -0.71 M3.22 -0.71 C3.22 -0.71, 3.22 -0.71, 3.22 -0.71 M3.22 -0.71 C3.22 -0.71, 3.22 -0.71, 3.22 -0.71 M3.22 -0.71 C3.14 -0.86, 3.05 -1.01, 3 -1.11 M3.22 -0.71 C3.15 -0.84, 3.08 -0.97, 3 -1.11 M3 -1.11 C2.67 -1.38, 2.35 -1.65, 1.45 -2.4 M3 -1.11 C2.53 -1.5, 2.07 -1.89, 1.45 -2.4 M1.45 -2.4 C1.11 -2.89, 0.77 -3.39, 0.36 -3.97 M1.45 -2.4 C1.07 -2.95, 0.69 -3.5, 0.36 -3.97 M0.36 -3.97 C0.15 -4.58, -0.07 -5.2, -0.26 -5.72 M0.36 -3.97 C0.15 -4.57, -0.06 -5.17, -0.26 -5.72 M-0.26 -5.72 C-0.31 -6.38, -0.37 -7.04, -0.42 -7.55 M-0.26 -5.72 C-0.31 -6.36, -0.37 -6.99, -0.42 -7.55 M-0.42 -7.55 C-0.33 -8.09, -0.24 -8.63, -0.13 -9.37 M-0.42 -7.55 C-0.32 -8.16, -0.22 -8.76, -0.13 -9.37 M-0.13 -9.37 C0.07 -9.81, 0.26 -10.25, 0.62 -11.07 M-0.13 -9.37 C0.17 -10.03, 0.46 -10.7, 0.62 -11.07 M0.62 -11.07 C0.9 -11.41, 1.17 -11.75, 1.81 -12.55 M0.62 -11.07 C0.93 -11.46, 1.24 -11.84, 1.81 -12.55 M1.81 -12.55 C2.32 -12.92, 2.83 -13.28, 3.45 -13.73 M1.81 -12.55 C2.35 -12.94, 2.88 -13.32, 3.45 -13.73 M3.45 -13.73 C3.91 -13.9, 4.36 -14.07, 5.34 -14.43 M3.45 -13.73 C4.1 -13.97, 4.75 -14.21, 5.34 -14.43 M5.34 -14.43 C5.84 -14.47, 6.34 -14.51, 7.24 -14.58 M5.34 -14.43 C5.83 -14.47, 6.32 -14.51, 7.24 -14.58 M7.24 -14.58 C7.64 -14.51, 8.05 -14.43, 9.07 -14.24 M7.24 -14.58 C7.82 -14.47, 8.39 -14.37, 9.07 -14.24 M9.07 -14.24 C9.44 -14.07, 9.81 -13.9, 10.74 -13.47 M9.07 -14.24 C9.52 -14.03, 9.98 -13.82, 10.74 -13.47 M10.74 -13.47 C11.26 -13.04, 11.78 -12.62, 12.16 -12.31 M10.74 -13.47 C11.2 -13.09, 11.67 -12.71, 12.16 -12.31 M12.16 -12.31 C12.56 -11.77, 12.95 -11.23, 13.26 -10.81 M12.16 -12.31 C12.52 -11.82, 12.87 -11.34, 13.26 -10.81 M13.26 -10.81 C13.45 -10.32, 13.64 -9.83, 13.95 -9.03 M13.26 -10.81 C13.44 -10.35, 13.62 -9.89, 13.95 -9.03 M13.95 -9.03 C14.03 -8.27, 14.1 -7.5, 14.15 -7.03 M13.95 -9.03 C14.02 -8.38, 14.08 -7.72, 14.15 -7.03 M14.15 -7.03 C14.08 -6.57, 14 -6.11, 13.87 -5.26 M14.15 -7.03 C14.09 -6.67, 14.04 -6.31, 13.87 -5.26 M13.87 -5.26 C13.69 -4.84, 13.51 -4.41, 13.18 -3.64 M13.87 -5.26 C13.67 -4.81, 13.48 -4.35, 13.18 -3.64 M13.18 -3.64 C12.94 -3.32, 12.69 -2.99, 12.12 -2.24 M13.18 -3.64 C12.78 -3.11, 12.38 -2.58, 12.12 -2.24 M12.12 -2.24 C11.66 -1.86, 11.2 -1.49, 10.74 -1.11 M12.12 -2.24 C11.63 -1.84, 11.15 -1.44, 10.74 -1.11 M10.74 -1.11 C10.69 -1.03, 10.65 -0.95, 10.51 -0.71 M10.74 -1.11 C10.69 -1.02, 10.64 -0.94, 10.51 -0.71 M10.51 -0.71 C10.51 -0.62, 10.51 -0.52, 10.51 -0.46 M10.51 -0.71 C10.51 -0.62, 10.51 -0.52, 10.51 -0.46 M10.51 -0.46 C10.51 -0.46, 10.51 -0.46, 10.51 -0.46 M10.51 -0.46 C10.51 -0.46, 10.51 -0.46, 10.51 -0.46 M10.51 -0.46 C10.55 -0.36, 10.59 -0.26, 10.65 -0.13 M10.51 -0.46 C10.56 -0.35, 10.6 -0.24, 10.65 -0.13 M10.65 -0.13 C10.75 -0.09, 10.86 -0.04, 10.97 0 M10.65 -0.13 C10.76 -0.09, 10.87 -0.04, 10.97 0 M10.97 0 C11.88 0, 12.79 0, 13.64 0 M10.97 0 C11.85 0, 12.74 0, 13.64 0" stroke="#E1E1E1" stroke-width="1.1" fill="none" class="svg-elem-9"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(41.994392380129284 25.151345439941103) rotate(0 -1.4121744791666515 -3.0316406249999996)"><path d="M0 0 C0.19 -0.3, 1.05 -1.02, 1.17 -1.81 C1.28 -2.6, 1.15 -4.04, 0.69 -4.74 C0.23 -5.45, -0.82 -5.93, -1.6 -6.06 C-2.38 -6.19, -3.59 -5.61, -3.99 -5.52 M0 0 C0.19 -0.3, 1.05 -1.02, 1.17 -1.81 C1.28 -2.6, 1.15 -4.04, 0.69 -4.74 C0.23 -5.45, -0.82 -5.93, -1.6 -6.06 C-2.38 -6.19, -3.59 -5.61, -3.99 -5.52" stroke="#E1E1E1" stroke-width="1.2" fill="none" class="svg-elem-10"></path></g></g><mask></mask></svg>
    
      `,
        css: `
          /***************************************************
 * Generated by SVG Artista on 9/1/2025, 5:53:16 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 42.44195556640625px;
  stroke-dasharray: 21.220977783203125px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 21.220977783203125px;
  fill: transparent;
}

svg .svg-elem-2 {
  stroke-dashoffset: 42.44195556640625px;
  stroke-dasharray: 21.220977783203125px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 21.220977783203125px;
  fill: transparent;
}

svg .svg-elem-3 {
  stroke-dashoffset: 42.44195556640625px;
  stroke-dasharray: 21.220977783203125px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 21.220977783203125px;
  fill: transparent;
}

svg .svg-elem-4 {
  stroke-dashoffset: 42.44195556640625px;
  stroke-dasharray: 21.220977783203125px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 21.220977783203125px;
  fill: transparent;
}

svg .svg-elem-5 {
  stroke-dashoffset: 34.2099723815918px;
  stroke-dasharray: 17.1049861907959px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 17.1049861907959px;
  fill: transparent;
}

svg .svg-elem-6 {
  stroke-dashoffset: 46.26871871948242px;
  stroke-dasharray: 23.13435935974121px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 23.13435935974121px;
  fill: transparent;
}

svg .svg-elem-7 {
  stroke-dashoffset: 338.8987121582031px;
  stroke-dasharray: 169.44935607910156px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 169.44935607910156px;
  fill: transparent;
}

svg .svg-elem-8 {
  stroke-dashoffset: 64.94198989868164px;
  stroke-dasharray: 32.47099494934082px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
}

svg.active .svg-elem-8 {
  stroke-dashoffset: 32.47099494934082px;
  fill: transparent;
}

svg .svg-elem-9 {
  stroke-dashoffset: 187.3238983154297px;
  stroke-dasharray: 93.66194915771484px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
}

svg.active .svg-elem-9 {
  stroke-dashoffset: 93.66194915771484px;
  fill: transparent;
}

svg .svg-elem-10 {
  stroke-dashoffset: 45.52150344848633px;
  stroke-dasharray: 22.760751724243164px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
}

svg.active .svg-elem-10 {
  stroke-dashoffset: 22.760751724243164px;
  fill: transparent;
}

    `
    },
    {
        name: "Controls",
        svg: `
     <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 49.085592828019344 45.77692827267063" width="49.085594177246094" height="45.77692794799805" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round"><g transform="translate(35.391165705963886 16.78234727098406) rotate(0 -1.3854101707706832 0.9236067805138433)" fill-rule="evenodd"><path d="M0 0 L0 0 L-0.95 0.09 L-1.73 0.4 L-2.34 0.97 L-2.77 1.85" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-1"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.22 0.02, -0.44 0.04, -0.95 0.09 M0 0 C-0.28 0.03, -0.56 0.05, -0.95 0.09 M-0.95 0.09 C-1.12 0.16, -1.28 0.23, -1.73 0.4 M-0.95 0.09 C-1.21 0.2, -1.46 0.3, -1.73 0.4 M-1.73 0.4 C-1.89 0.56, -2.06 0.71, -2.34 0.97 M-1.73 0.4 C-1.95 0.61, -2.18 0.82, -2.34 0.97 M-2.34 0.97 C-2.47 1.24, -2.6 1.51, -2.77 1.85 M-2.34 0.97 C-2.51 1.32, -2.68 1.66, -2.77 1.85 M-2.77 1.85 C-1.84 1.22, -0.9 0.6, 0 0 M-2.77 1.85 C-2.08 1.38, -1.38 0.92, 0 0" stroke="#E1E1E1" stroke-width="1.7" fill="none" class="svg-elem-2"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(22.460670778770236 12.164313368414838) rotate(0 7.388854244110689 6.003444073340006)" fill-rule="evenodd"><path d="M0 0 L0 0 L-0.72 0.15 L-1.31 0.54 L-1.7 1.13 L-1.85 1.85 L-1.85 5.54 L-1.85 5.54 L-1.75 6.47 L-1.48 7.34 L-1.06 8.12 L-0.49 8.81 L0.19 9.37 L0.97 9.8 L1.84 10.07 L2.77 10.16 L4.03 10.32 L5.24 10.68 L6.37 11.25 L7.39 12.01 L8.41 11.25 L9.54 10.68 L10.75 10.32 L12.01 10.16 L12.94 10.07 L13.8 9.8 L14.59 9.37 L15.27 8.81 L15.84 8.12 L16.26 7.34 L16.53 6.47 L16.62 5.54 L16.62 1.85 L16.62 1.85 L16.48 1.13 L16.08 0.54 L15.5 0.15 L14.78 0 L12.01 0 L12.01 0 L10.75 0.16 L9.54 0.52 L8.41 1.09 L7.39 1.85 L6.37 1.09 L5.24 0.52 L4.03 0.16 L2.77 0 L0 0" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-3"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.22 0.04, -0.43 0.09, -0.72 0.15 M0 0 C-0.15 0.03, -0.3 0.06, -0.72 0.15 M-0.72 0.15 C-0.95 0.3, -1.18 0.46, -1.31 0.54 M-0.72 0.15 C-0.89 0.26, -1.07 0.38, -1.31 0.54 M-1.31 0.54 C-1.43 0.72, -1.55 0.91, -1.7 1.13 M-1.31 0.54 C-1.46 0.77, -1.62 1, -1.7 1.13 M-1.7 1.13 C-1.73 1.28, -1.76 1.43, -1.85 1.85 M-1.7 1.13 C-1.75 1.36, -1.79 1.59, -1.85 1.85 M-1.85 1.85 C-1.85 2.98, -1.85 4.11, -1.85 5.54 M-1.85 1.85 C-1.85 2.93, -1.85 4.02, -1.85 5.54 M-1.85 5.54 C-1.85 5.54, -1.85 5.54, -1.85 5.54 M-1.85 5.54 C-1.85 5.54, -1.85 5.54, -1.85 5.54 M-1.85 5.54 C-1.82 5.82, -1.79 6.11, -1.75 6.47 M-1.85 5.54 C-1.82 5.8, -1.8 6.05, -1.75 6.47 M-1.75 6.47 C-1.65 6.81, -1.54 7.15, -1.48 7.34 M-1.75 6.47 C-1.66 6.77, -1.57 7.06, -1.48 7.34 M-1.48 7.34 C-1.36 7.57, -1.24 7.79, -1.06 8.12 M-1.48 7.34 C-1.34 7.6, -1.21 7.85, -1.06 8.12 M-1.06 8.12 C-0.88 8.34, -0.7 8.56, -0.49 8.81 M-1.06 8.12 C-0.87 8.35, -0.68 8.58, -0.49 8.81 M-0.49 8.81 C-0.35 8.93, -0.21 9.05, 0.19 9.37 M-0.49 8.81 C-0.29 8.97, -0.09 9.14, 0.19 9.37 M0.19 9.37 C0.35 9.46, 0.5 9.54, 0.97 9.8 M0.19 9.37 C0.39 9.48, 0.59 9.59, 0.97 9.8 M0.97 9.8 C1.3 9.9, 1.64 10, 1.84 10.07 M0.97 9.8 C1.19 9.86, 1.41 9.93, 1.84 10.07 M1.84 10.07 C2.04 10.09, 2.25 10.11, 2.77 10.16 M1.84 10.07 C2.2 10.1, 2.56 10.14, 2.77 10.16 M2.77 10.16 C3.11 10.2, 3.46 10.24, 4.03 10.32 M2.77 10.16 C3.16 10.21, 3.54 10.26, 4.03 10.32 M4.03 10.32 C4.43 10.44, 4.83 10.56, 5.24 10.68 M4.03 10.32 C4.35 10.41, 4.67 10.51, 5.24 10.68 M5.24 10.68 C5.6 10.86, 5.96 11.04, 6.37 11.25 M5.24 10.68 C5.47 10.8, 5.71 10.92, 6.37 11.25 M6.37 11.25 C6.62 11.44, 6.87 11.63, 7.39 12.01 M6.37 11.25 C6.62 11.44, 6.88 11.63, 7.39 12.01 M7.39 12.01 C7.71 11.77, 8.04 11.52, 8.41 11.25 M7.39 12.01 C7.74 11.75, 8.09 11.49, 8.41 11.25 M8.41 11.25 C8.7 11.11, 8.99 10.96, 9.54 10.68 M8.41 11.25 C8.81 11.05, 9.21 10.85, 9.54 10.68 M9.54 10.68 C9.82 10.6, 10.1 10.51, 10.75 10.32 M9.54 10.68 C9.94 10.56, 10.35 10.44, 10.75 10.32 M10.75 10.32 C11.24 10.25, 11.74 10.19, 12.01 10.16 M10.75 10.32 C11.02 10.28, 11.29 10.25, 12.01 10.16 M12.01 10.16 C12.36 10.12, 12.72 10.09, 12.94 10.07 M12.01 10.16 C12.24 10.14, 12.47 10.11, 12.94 10.07 M12.94 10.07 C13.17 9.99, 13.4 9.92, 13.8 9.8 M12.94 10.07 C13.21 9.98, 13.49 9.89, 13.8 9.8 M13.8 9.8 C14 9.69, 14.2 9.58, 14.59 9.37 M13.8 9.8 C14.1 9.63, 14.41 9.47, 14.59 9.37 M14.59 9.37 C14.75 9.24, 14.91 9.1, 15.27 8.81 M14.59 9.37 C14.85 9.16, 15.1 8.95, 15.27 8.81 M15.27 8.81 C15.44 8.6, 15.61 8.4, 15.84 8.12 M15.27 8.81 C15.42 8.62, 15.58 8.44, 15.84 8.12 M15.84 8.12 C15.94 7.94, 16.04 7.75, 16.26 7.34 M15.84 8.12 C15.98 7.85, 16.13 7.58, 16.26 7.34 M16.26 7.34 C16.35 7.06, 16.43 6.79, 16.53 6.47 M16.26 7.34 C16.34 7.09, 16.42 6.84, 16.53 6.47 M16.53 6.47 C16.57 6.14, 16.6 5.8, 16.62 5.54 M16.53 6.47 C16.55 6.26, 16.57 6.05, 16.62 5.54 M16.62 5.54 C16.62 4.45, 16.62 3.37, 16.62 1.85 M16.62 5.54 C16.62 4.63, 16.62 3.73, 16.62 1.85 M16.62 1.85 C16.62 1.85, 16.62 1.85, 16.62 1.85 M16.62 1.85 C16.62 1.85, 16.62 1.85, 16.62 1.85 M16.62 1.85 C16.57 1.59, 16.52 1.33, 16.48 1.13 M16.62 1.85 C16.57 1.56, 16.51 1.28, 16.48 1.13 M16.48 1.13 C16.34 0.92, 16.2 0.71, 16.08 0.54 M16.48 1.13 C16.38 0.98, 16.28 0.83, 16.08 0.54 M16.08 0.54 C15.96 0.46, 15.84 0.38, 15.5 0.15 M16.08 0.54 C15.96 0.45, 15.83 0.37, 15.5 0.15 M15.5 0.15 C15.34 0.11, 15.19 0.08, 14.78 0 M15.5 0.15 C15.22 0.09, 14.95 0.03, 14.78 0 M14.78 0 C13.93 0, 13.09 0, 12.01 0 M14.78 0 C14.11 0, 13.44 0, 12.01 0 M12.01 0 C12.01 0, 12.01 0, 12.01 0 M12.01 0 C12.01 0, 12.01 0, 12.01 0 M12.01 0 C11.67 0.04, 11.32 0.08, 10.75 0.16 M12.01 0 C11.72 0.04, 11.43 0.07, 10.75 0.16 M10.75 0.16 C10.29 0.3, 9.83 0.44, 9.54 0.52 M10.75 0.16 C10.3 0.29, 9.86 0.43, 9.54 0.52 M9.54 0.52 C9.21 0.69, 8.88 0.85, 8.41 1.09 M9.54 0.52 C9.11 0.74, 8.69 0.95, 8.41 1.09 M8.41 1.09 C8.15 1.28, 7.89 1.48, 7.39 1.85 M8.41 1.09 C8.18 1.26, 7.95 1.43, 7.39 1.85 M7.39 1.85 C7.07 1.61, 6.74 1.37, 6.37 1.09 M7.39 1.85 C7.06 1.6, 6.73 1.36, 6.37 1.09 M6.37 1.09 C6.09 0.95, 5.82 0.82, 5.24 0.52 M6.37 1.09 C5.93 0.87, 5.49 0.65, 5.24 0.52 M5.24 0.52 C4.94 0.43, 4.63 0.34, 4.03 0.16 M5.24 0.52 C4.83 0.4, 4.43 0.28, 4.03 0.16 M4.03 0.16 C3.61 0.1, 3.19 0.05, 2.77 0 M4.03 0.16 C3.59 0.1, 3.15 0.05, 2.77 0 M2.77 0 C1.73 0, 0.7 0, 0 0 M2.77 0 C1.84 0, 0.9 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0" stroke="#E1E1E1" stroke-width="1.7" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(24.307884339797965 16.78234727098406) rotate(0 1.3854101707706832 0.9236067805138433)" fill-rule="evenodd"><path d="M0 0 L0 0 L0.95 0.09 L1.73 0.4 L2.34 0.97 L2.77 1.85" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-5"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.36 0.04, 0.71 0.07, 0.95 0.09 M0 0 C0.34 0.03, 0.68 0.07, 0.95 0.09 M0.95 0.09 C1.23 0.21, 1.51 0.32, 1.73 0.4 M0.95 0.09 C1.14 0.17, 1.33 0.24, 1.73 0.4 M1.73 0.4 C1.96 0.62, 2.2 0.84, 2.34 0.97 M1.73 0.4 C1.94 0.6, 2.16 0.8, 2.34 0.97 M2.34 0.97 C2.5 1.3, 2.67 1.64, 2.77 1.85 M2.34 0.97 C2.5 1.31, 2.67 1.64, 2.77 1.85 M2.77 1.85 C1.98 1.32, 1.18 0.79, 0 0 M2.77 1.85 C1.74 1.16, 0.7 0.47, 0 0" stroke="#E1E1E1" stroke-width="1.3" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(31.480773560558646 32.9128251312628) rotate(0 2.864103141407668 -3.5801289267598086)" fill-rule="evenodd"><path d="M0 0 L0 0 L-1.01 -0.42 L-1.43 -1.43 L-1.43 -4.3 L-1.43 -4.3 L-1.21 -5.41 L-0.59 -6.32 L0.32 -6.94 L1.43 -7.16 L4.3 -7.16 L4.3 -7.16 L5.41 -6.94 L6.32 -6.32 L6.94 -5.41 L7.16 -4.3 L7.16 -1.43 L7.16 -1.43 L6.74 -0.42 L5.73 0 L0 0" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-7"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.21 -0.09, -0.42 -0.18, -1.01 -0.42 M0 0 C-0.33 -0.14, -0.67 -0.28, -1.01 -0.42 M-1.01 -0.42 C-1.14 -0.72, -1.26 -1.02, -1.43 -1.43 M-1.01 -0.42 C-1.15 -0.76, -1.29 -1.09, -1.43 -1.43 M-1.43 -1.43 C-1.43 -2.18, -1.43 -2.93, -1.43 -4.3 M-1.43 -1.43 C-1.43 -2.47, -1.43 -3.52, -1.43 -4.3 M-1.43 -4.3 C-1.43 -4.3, -1.43 -4.3, -1.43 -4.3 M-1.43 -4.3 C-1.43 -4.3, -1.43 -4.3, -1.43 -4.3 M-1.43 -4.3 C-1.34 -4.74, -1.25 -5.18, -1.21 -5.41 M-1.43 -4.3 C-1.39 -4.53, -1.34 -4.76, -1.21 -5.41 M-1.21 -5.41 C-1.04 -5.66, -0.87 -5.91, -0.59 -6.32 M-1.21 -5.41 C-1 -5.71, -0.8 -6.01, -0.59 -6.32 M-0.59 -6.32 C-0.31 -6.51, -0.04 -6.7, 0.32 -6.94 M-0.59 -6.32 C-0.36 -6.48, -0.13 -6.63, 0.32 -6.94 M0.32 -6.94 C0.58 -6.99, 0.85 -7.04, 1.43 -7.16 M0.32 -6.94 C0.58 -6.99, 0.83 -7.04, 1.43 -7.16 M1.43 -7.16 C2.13 -7.16, 2.83 -7.16, 4.3 -7.16 M1.43 -7.16 C2.39 -7.16, 3.34 -7.16, 4.3 -7.16 M4.3 -7.16 C4.3 -7.16, 4.3 -7.16, 4.3 -7.16 M4.3 -7.16 C4.3 -7.16, 4.3 -7.16, 4.3 -7.16 M4.3 -7.16 C4.55 -7.11, 4.8 -7.06, 5.41 -6.94 M4.3 -7.16 C4.65 -7.09, 4.99 -7.02, 5.41 -6.94 M5.41 -6.94 C5.76 -6.7, 6.12 -6.46, 6.32 -6.32 M5.41 -6.94 C5.67 -6.76, 5.92 -6.59, 6.32 -6.32 M6.32 -6.32 C6.47 -6.11, 6.61 -5.89, 6.94 -5.41 M6.32 -6.32 C6.5 -6.05, 6.69 -5.78, 6.94 -5.41 M6.94 -5.41 C7.01 -5.04, 7.08 -4.67, 7.16 -4.3 M6.94 -5.41 C6.99 -5.15, 7.04 -4.88, 7.16 -4.3 M7.16 -4.3 C7.16 -3.7, 7.16 -3.1, 7.16 -1.43 M7.16 -4.3 C7.16 -3.63, 7.16 -2.97, 7.16 -1.43 M7.16 -1.43 C7.16 -1.43, 7.16 -1.43, 7.16 -1.43 M7.16 -1.43 C7.16 -1.43, 7.16 -1.43, 7.16 -1.43 M7.16 -1.43 C7.05 -1.18, 6.95 -0.92, 6.74 -0.42 M7.16 -1.43 C7.04 -1.14, 6.91 -0.84, 6.74 -0.42 M6.74 -0.42 C6.46 -0.31, 6.19 -0.19, 5.73 0 M6.74 -0.42 C6.51 -0.32, 6.28 -0.23, 5.73 0 M5.73 0 C4.4 0, 3.07 0, 0 0 M5.73 0 C4 0, 2.27 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-8"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(31.480773560558646 35.77692827267063) rotate(0 0 -1.4320515707039227)"><path d="M0 0 C0 -1.13, 0 -2.25, 0 -2.86 M0 0 C0 -0.79, 0 -1.57, 0 -2.86" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-9"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(37.20897984337398 35.77692827267063) rotate(0 0 -1.4320515707039227)"><path d="M0 0 C0 -1.11, 0 -2.22, 0 -2.86 M0 0 C0 -0.87, 0 -1.73, 0 -2.86" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-10"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(11.432051570703607 12.864103141407853) rotate(0 0 -1.4320515707039263)"><path d="M0 0 C0 -0.69, 0 -1.37, 0 -2.86 M0 0 C0 -0.67, 0 -1.33, 0 -2.86" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-11"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(12.864103141407668 20.02436099492749) rotate(0 1.4320515707040613 -3.580128926759805)" fill-rule="evenodd"><path d="M0 0 L0 0 L-1.11 -0.23 L-2.03 -0.84 L-2.64 -1.75 L-2.86 -2.86 L-2.86 -5.73 L-2.86 -5.73 L-2.44 -6.74 L-1.43 -7.16 L4.3 -7.16 L4.3 -7.16 L5.31 -6.74 L5.73 -5.73 L5.73 -2.86 L5.73 -2.86 L5.5 -1.75 L4.89 -0.84 L3.98 -0.23 L2.86 0 L0 0" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-12"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.23 -0.05, -0.46 -0.09, -1.11 -0.23 M0 0 C-0.44 -0.09, -0.88 -0.18, -1.11 -0.23 M-1.11 -0.23 C-1.39 -0.41, -1.66 -0.59, -2.03 -0.84 M-1.11 -0.23 C-1.4 -0.42, -1.68 -0.61, -2.03 -0.84 M-2.03 -0.84 C-2.27 -1.2, -2.51 -1.55, -2.64 -1.75 M-2.03 -0.84 C-2.16 -1.03, -2.29 -1.23, -2.64 -1.75 M-2.64 -1.75 C-2.71 -2.1, -2.78 -2.46, -2.86 -2.86 M-2.64 -1.75 C-2.71 -2.09, -2.78 -2.43, -2.86 -2.86 M-2.86 -2.86 C-2.86 -3.71, -2.86 -4.55, -2.86 -5.73 M-2.86 -2.86 C-2.86 -3.94, -2.86 -5.02, -2.86 -5.73 M-2.86 -5.73 C-2.86 -5.73, -2.86 -5.73, -2.86 -5.73 M-2.86 -5.73 C-2.86 -5.73, -2.86 -5.73, -2.86 -5.73 M-2.86 -5.73 C-2.75 -6, -2.64 -6.28, -2.44 -6.74 M-2.86 -5.73 C-2.7 -6.12, -2.54 -6.52, -2.44 -6.74 M-2.44 -6.74 C-2.1 -6.88, -1.76 -7.02, -1.43 -7.16 M-2.44 -6.74 C-2.15 -6.86, -1.86 -6.98, -1.43 -7.16 M-1.43 -7.16 C0.45 -7.16, 2.32 -7.16, 4.3 -7.16 M-1.43 -7.16 C0.41 -7.16, 2.26 -7.16, 4.3 -7.16 M4.3 -7.16 C4.3 -7.16, 4.3 -7.16, 4.3 -7.16 M4.3 -7.16 C4.3 -7.16, 4.3 -7.16, 4.3 -7.16 M4.3 -7.16 C4.6 -7.04, 4.9 -6.91, 5.31 -6.74 M4.3 -7.16 C4.5 -7.08, 4.7 -6.99, 5.31 -6.74 M5.31 -6.74 C5.42 -6.48, 5.52 -6.22, 5.73 -5.73 M5.31 -6.74 C5.47 -6.35, 5.63 -5.97, 5.73 -5.73 M5.73 -5.73 C5.73 -5.01, 5.73 -4.29, 5.73 -2.86 M5.73 -5.73 C5.73 -5.1, 5.73 -4.48, 5.73 -2.86 M5.73 -2.86 C5.73 -2.86, 5.73 -2.86, 5.73 -2.86 M5.73 -2.86 C5.73 -2.86, 5.73 -2.86, 5.73 -2.86 M5.73 -2.86 C5.66 -2.52, 5.59 -2.18, 5.5 -1.75 M5.73 -2.86 C5.65 -2.5, 5.58 -2.13, 5.5 -1.75 M5.5 -1.75 C5.34 -1.51, 5.18 -1.27, 4.89 -0.84 M5.5 -1.75 C5.31 -1.46, 5.11 -1.17, 4.89 -0.84 M4.89 -0.84 C4.7 -0.71, 4.51 -0.58, 3.98 -0.23 M4.89 -0.84 C4.66 -0.69, 4.44 -0.53, 3.98 -0.23 M3.98 -0.23 C3.7 -0.17, 3.42 -0.11, 2.86 0 M3.98 -0.23 C3.62 -0.15, 3.27 -0.08, 2.86 0 M2.86 0 C1.88 0, 0.9 0, 0 0 M2.86 0 C2.13 0, 1.4 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-13"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(17.160257853519397 12.864103141407853) rotate(0 0 -1.4320515707039263)"><path d="M0 0 C0 -0.65, 0 -1.29, 0 -2.86 M0 0 C0 -1.07, 0 -2.14, 0 -2.86" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-14"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(14.298849100976895 20.825007487344877) rotate(0 5.029058788477414 7.450939643156605)"><path d="M0 0 C0 0.66, 0.03 2.56, 0.03 3.95 C0.03 5.33, -0.12 6.87, 0 8.31 C0.13 9.75, 0.02 11.47, 0.77 12.57 C1.53 13.67, 3.3 14.71, 4.55 14.9 C5.79 15.1, 7.34 14.41, 8.24 13.75 C9.14 13.09, 9.66 12.01, 9.97 10.94 C10.27 9.87, 10.05 8.8, 10.06 7.31 C10.06 5.81, 10.01 2.87, 9.99 1.98 M0 0 C0 0.66, 0.03 2.56, 0.03 3.95 C0.03 5.33, -0.12 6.87, 0 8.31 C0.13 9.75, 0.02 11.47, 0.77 12.57 C1.53 13.67, 3.3 14.71, 4.55 14.9 C5.79 15.1, 7.34 14.41, 8.24 13.75 C9.14 13.09, 9.66 12.01, 9.97 10.94 C10.27 9.87, 10.05 8.8, 10.06 7.31 C10.06 5.81, 10.01 2.87, 9.99 1.98" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-15"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(25.36281486272219 11.914549480482918) rotate(0 4.012640781465734 -0.8942048074019198)"><path d="M0 0 C0.33 -0.24, 1.27 -1.15, 2.01 -1.46 C2.74 -1.78, 3.64 -1.95, 4.4 -1.91 C5.16 -1.86, 5.97 -1.53, 6.58 -1.19 C7.18 -0.86, 7.78 -0.1, 8.03 0.12 M0 0 C0.33 -0.24, 1.27 -1.15, 2.01 -1.46 C2.74 -1.78, 3.64 -1.95, 4.4 -1.91 C5.16 -1.86, 5.97 -1.53, 6.58 -1.19 C7.18 -0.86, 7.78 -0.1, 8.03 0.12" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-16"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(34.33479208803874 22.948986666703362) rotate(0 0 1.0719130413721487)"><path d="M0 0 C0 0.36, 0 1.79, 0 2.14 M0 0 C0 0.36, 0 1.79, 0 2.14" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-17"></path></g></g><mask></mask></svg>
      `,
        css: `
        /***************************************************
 * Generated by SVG Artista on 9/1/2025, 5:40:51 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 5.607902526855469px;
  stroke-dasharray: 5.607902526855469px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-2 {
  stroke-dashoffset: 15.877996444702148px;
  stroke-dasharray: 15.877996444702148px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 0;
}

svg .svg-elem-3 {
  stroke-dashoffset: 55.453033447265625px;
  stroke-dasharray: 55.453033447265625px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-4 {
  stroke-dashoffset: 108.90753173828125px;
  stroke-dasharray: 108.90753173828125px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 0;
}

svg .svg-elem-5 {
  stroke-dashoffset: 5.607902526855469px;
  stroke-dasharray: 5.607902526855469px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-6 {
  stroke-dashoffset: 15.87796401977539px;
  stroke-dasharray: 15.87796401977539px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 0;
}

svg .svg-elem-7 {
  stroke-dashoffset: 29.64629554748535px;
  stroke-dasharray: 29.64629554748535px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-8 {
  stroke-dashoffset: 57.29288864135742px;
  stroke-dasharray: 57.29288864135742px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
}

svg.active .svg-elem-8 {
  stroke-dashoffset: 0;
}

svg .svg-elem-9 {
  stroke-dashoffset: 7.720000267028809px;
  stroke-dasharray: 7.720000267028809px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
}

svg.active .svg-elem-9 {
  stroke-dashoffset: 0;
}

svg .svg-elem-10 {
  stroke-dashoffset: 7.720000267028809px;
  stroke-dasharray: 7.720000267028809px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
}

svg.active .svg-elem-10 {
  stroke-dashoffset: 0;
}

svg .svg-elem-11 {
  stroke-dashoffset: 7.720000267028809px;
  stroke-dasharray: 7.720000267028809px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
}

svg.active .svg-elem-11 {
  stroke-dashoffset: 0;
}

svg .svg-elem-12 {
  stroke-dashoffset: 29.63797378540039px;
  stroke-dasharray: 29.63797378540039px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
}

svg.active .svg-elem-12 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-13 {
  stroke-dashoffset: 57.27627182006836px;
  stroke-dasharray: 57.27627182006836px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
}

svg.active .svg-elem-13 {
  stroke-dashoffset: 0;
}

svg .svg-elem-14 {
  stroke-dashoffset: 7.720000267028809px;
  stroke-dasharray: 7.720000267028809px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
}

svg.active .svg-elem-14 {
  stroke-dashoffset: 0;
}

svg .svg-elem-15 {
  stroke-dashoffset: 69.03257751464844px;
  stroke-dasharray: 69.03257751464844px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
}

svg.active .svg-elem-15 {
  stroke-dashoffset: 0;
}

svg .svg-elem-16 {
  stroke-dashoffset: 20.43891716003418px;
  stroke-dasharray: 20.43891716003418px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7999999999999998s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7999999999999998s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.3s;
}

svg.active .svg-elem-16 {
  stroke-dashoffset: 0;
}

svg .svg-elem-17 {
  stroke-dashoffset: 6.28000020980835px;
  stroke-dasharray: 6.28000020980835px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.92s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.4000000000000004s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.92s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.4000000000000004s;
}

svg.active .svg-elem-17 {
  stroke-dashoffset: 0;
}

    
     `
    },
    {
        name: "DataQuery",
        svg: `
     <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46.98967103556333 65.34667386902682" width="46.98966979980469" height="65.34667205810547" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round" transform="translate(10.100935341102286 10) rotate(0 13.431038532447928 4.477012844149275)"><path d="M26.86 4.48 C26.86 4.74, 26.79 5, 26.66 5.25 C26.52 5.51, 26.32 5.76, 26.05 6.01 C25.79 6.25, 25.45 6.49, 25.06 6.72 C24.67 6.94, 24.22 7.16, 23.72 7.35 C23.22 7.55, 22.66 7.74, 22.06 7.91 C21.47 8.07, 20.82 8.22, 20.15 8.35 C19.47 8.48, 18.76 8.6, 18.02 8.68 C17.29 8.77, 16.53 8.84, 15.76 8.89 C15 8.93, 14.21 8.95, 13.43 8.95 C12.65 8.95, 11.86 8.93, 11.1 8.89 C10.33 8.84, 9.57 8.77, 8.84 8.68 C8.11 8.6, 7.39 8.48, 6.72 8.35 C6.04 8.22, 5.39 8.07, 4.8 7.91 C4.2 7.74, 3.64 7.55, 3.14 7.35 C2.64 7.16, 2.19 6.94, 1.8 6.72 C1.41 6.49, 1.08 6.25, 0.81 6.01 C0.54 5.76, 0.34 5.51, 0.2 5.25 C0.07 5, 0 4.74, 0 4.48 C0 4.22, 0.07 3.95, 0.2 3.7 C0.34 3.44, 0.54 3.19, 0.81 2.95 C1.08 2.7, 1.41 2.46, 1.8 2.24 C2.19 2.01, 2.64 1.8, 3.14 1.6 C3.64 1.4, 4.2 1.21, 4.8 1.05 C5.39 0.88, 6.04 0.73, 6.72 0.6 C7.39 0.47, 8.11 0.36, 8.84 0.27 C9.57 0.18, 10.33 0.11, 11.1 0.07 C11.86 0.02, 12.65 0, 13.43 0 C14.21 0, 15 0.02, 15.76 0.07 C16.53 0.11, 17.29 0.18, 18.02 0.27 C18.76 0.36, 19.47 0.47, 20.15 0.6 C20.82 0.73, 21.47 0.88, 22.06 1.05 C22.66 1.21, 23.22 1.4, 23.72 1.6 C24.22 1.8, 24.67 2.01, 25.06 2.24 C25.45 2.46, 25.79 2.7, 26.05 2.95 C26.32 3.19, 26.52 3.44, 26.66 3.7 C26.79 3.95, 26.83 4.35, 26.86 4.48 C26.9 4.61, 26.9 4.35, 26.86 4.48" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-1"></path><path d="M26.86 4.48 C26.86 4.74, 26.79 5, 26.66 5.25 C26.52 5.51, 26.32 5.76, 26.05 6.01 C25.79 6.25, 25.45 6.49, 25.06 6.72 C24.67 6.94, 24.22 7.16, 23.72 7.35 C23.22 7.55, 22.66 7.74, 22.06 7.91 C21.47 8.07, 20.82 8.22, 20.15 8.35 C19.47 8.48, 18.76 8.6, 18.02 8.68 C17.29 8.77, 16.53 8.84, 15.76 8.89 C15 8.93, 14.21 8.95, 13.43 8.95 C12.65 8.95, 11.86 8.93, 11.1 8.89 C10.33 8.84, 9.57 8.77, 8.84 8.68 C8.11 8.6, 7.39 8.48, 6.72 8.35 C6.04 8.22, 5.39 8.07, 4.8 7.91 C4.2 7.74, 3.64 7.55, 3.14 7.35 C2.64 7.16, 2.19 6.94, 1.8 6.72 C1.41 6.49, 1.08 6.25, 0.81 6.01 C0.54 5.76, 0.34 5.51, 0.2 5.25 C0.07 5, 0 4.74, 0 4.48 C0 4.22, 0.07 3.95, 0.2 3.7 C0.34 3.44, 0.54 3.19, 0.81 2.95 C1.08 2.7, 1.41 2.46, 1.8 2.24 C2.19 2.01, 2.64 1.8, 3.14 1.6 C3.64 1.4, 4.2 1.21, 4.8 1.05 C5.39 0.88, 6.04 0.73, 6.72 0.6 C7.39 0.47, 8.11 0.36, 8.84 0.27 C9.57 0.18, 10.33 0.11, 11.1 0.07 C11.86 0.02, 12.65 0, 13.43 0 C14.21 0, 15 0.02, 15.76 0.07 C16.53 0.11, 17.29 0.18, 18.02 0.27 C18.76 0.36, 19.47 0.47, 20.15 0.6 C20.82 0.73, 21.47 0.88, 22.06 1.05 C22.66 1.21, 23.22 1.4, 23.72 1.6 C24.22 1.8, 24.67 2.01, 25.06 2.24 C25.45 2.46, 25.79 2.7, 26.05 2.95 C26.32 3.19, 26.52 3.44, 26.66 3.7 C26.79 3.95, 26.83 4.35, 26.86 4.48 C26.9 4.61, 26.9 4.35, 26.86 4.48" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-2"></path></g><g stroke-linecap="round"><g transform="translate(10.100935341102286 24.92337614716424) rotate(0 13.431038532447928 2.241510094231792)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.15 0.36, 0.29 0.71, 0.5 1.23 M0 0 C0.11 0.27, 0.22 0.53, 0.5 1.23 M0.5 1.23 C0.95 1.57, 1.39 1.92, 1.89 2.3 M0.5 1.23 C0.9 1.54, 1.31 1.85, 1.89 2.3 M1.89 2.3 C2.4 2.52, 2.92 2.73, 4.01 3.2 M1.89 2.3 C2.54 2.58, 3.19 2.85, 4.01 3.2 M4.01 3.2 C4.9 3.42, 5.78 3.64, 6.72 3.88 M4.01 3.2 C4.84 3.4, 5.67 3.61, 6.72 3.88 M6.72 3.88 C7.7 4.02, 8.69 4.15, 9.84 4.32 M6.72 3.88 C7.96 4.05, 9.21 4.23, 9.84 4.32 M9.84 4.32 C10.79 4.36, 11.75 4.41, 13.22 4.48 M9.84 4.32 C10.66 4.36, 11.48 4.4, 13.22 4.48 M13.22 4.48 C14.6 4.43, 15.97 4.38, 16.71 4.35 M13.22 4.48 C14.01 4.45, 14.79 4.42, 16.71 4.35 M16.71 4.35 C18.02 4.17, 19.33 3.99, 20.15 3.88 M16.71 4.35 C17.93 4.18, 19.15 4.01, 20.15 3.88 M20.15 3.88 C20.99 3.66, 21.83 3.44, 22.95 3.16 M20.15 3.88 C20.83 3.7, 21.51 3.53, 22.95 3.16 M22.95 3.16 C23.39 2.97, 23.82 2.78, 25.06 2.24 M22.95 3.16 C23.76 2.81, 24.57 2.45, 25.06 2.24 M25.06 2.24 C25.47 1.91, 25.89 1.58, 26.4 1.17 M25.06 2.24 C25.52 1.87, 25.98 1.51, 26.4 1.17 M26.4 1.17 C26.51 0.89, 26.62 0.6, 26.86 0 M26.4 1.17 C26.51 0.88, 26.62 0.6, 26.86 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-3"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(23.465396818123736 50.08290694356862) rotate(89.99999999999994 0.06037138012925425 -7.986207458381102)"><path d="M0 0 C-4.08 -0.01, -8.15 -0.02, -11.73 -0.03 M0 0 C-2.87 -0.01, -5.74 -0.01, -11.73 -0.03 M-11.73 -0.03 C-11.78 -0.1, -11.82 -0.18, -11.85 -0.23 M-11.73 -0.03 C-11.76 -0.08, -11.79 -0.13, -11.85 -0.23 M-11.85 -0.23 C-11.79 -0.22, -11.72 -0.21, -11.68 -0.21 M-11.85 -0.23 C-11.8 -0.22, -11.75 -0.22, -11.68 -0.21 M-11.68 -0.21 C-11.93 -0.37, -12.17 -0.54, -12.53 -0.78 M-11.68 -0.21 C-11.95 -0.39, -12.22 -0.57, -12.53 -0.78 M-12.53 -0.78 C-12.75 -1.11, -12.97 -1.43, -13.1 -1.63 M-12.53 -0.78 C-12.68 -1.01, -12.84 -1.23, -13.1 -1.63 M-13.1 -1.63 C-13.09 -1.94, -13.08 -2.24, -13.07 -2.45 M-13.1 -1.63 C-13.09 -1.88, -13.08 -2.14, -13.07 -2.45 M-13.07 -2.45 C-13 -4.11, -12.93 -5.78, -12.83 -8.12 M-13.07 -2.45 C-13.01 -3.96, -12.94 -5.47, -12.83 -8.12 M-12.83 -8.12 C-12.91 -10.15, -13 -12.18, -13.05 -13.36 M-12.83 -8.12 C-12.91 -10.01, -12.99 -11.9, -13.05 -13.36 M-13.05 -13.36 C-13.09 -13.64, -13.14 -13.92, -13.19 -14.24 M-13.05 -13.36 C-13.09 -13.64, -13.14 -13.92, -13.19 -14.24 M-13.19 -14.24 C-13.17 -14.27, -13.15 -14.29, -13.1 -14.35 M-13.19 -14.24 C-13.16 -14.28, -13.13 -14.31, -13.1 -14.35 M-13.1 -14.35 C-12.88 -14.67, -12.66 -15, -12.53 -15.19 M-13.1 -14.35 C-12.96 -14.55, -12.83 -14.76, -12.53 -15.19 M-12.53 -15.19 C-12.72 -15.39, -12.91 -15.59, -13.08 -15.76 M-12.53 -15.19 C-12.68 -15.35, -12.83 -15.51, -13.08 -15.76 M-13.08 -15.76 C-12.84 -15.82, -12.6 -15.87, -12.15 -15.97 M-13.08 -15.76 C-12.75 -15.84, -12.43 -15.91, -12.15 -15.97 M-12.15 -15.97 C-5.57 -15.97, 1.02 -15.97, 10.65 -15.97 M-12.15 -15.97 C-5.38 -15.97, 1.39 -15.97, 10.65 -15.97 M10.65 -15.97 C10.65 -15.97, 10.65 -15.97, 10.65 -15.97 M10.65 -15.97 C10.65 -15.97, 10.65 -15.97, 10.65 -15.97 M10.65 -15.97 C10.99 -15.9, 11.34 -15.83, 11.68 -15.76 M10.65 -15.97 C10.92 -15.92, 11.2 -15.86, 11.68 -15.76 M11.68 -15.76 C12.02 -15.54, 12.35 -15.32, 12.53 -15.19 M11.68 -15.76 C11.89 -15.63, 12.09 -15.49, 12.53 -15.19 M12.53 -15.19 C12.72 -14.92, 12.9 -14.64, 13.1 -14.35 M12.53 -15.19 C12.66 -15.01, 12.78 -14.82, 13.1 -14.35 M13.1 -14.35 C13.15 -14.12, 13.19 -13.89, 13.31 -13.31 M13.1 -14.35 C13.15 -14.12, 13.19 -13.89, 13.31 -13.31 M13.31 -13.31 C13.31 -10.71, 13.31 -8.12, 13.31 -6.66 M13.31 -13.31 C13.31 -11.66, 13.31 -10.01, 13.31 -6.66" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(23.51911287304665 50.02919088864684) rotate(89.99999999999994 0.00665532520679335 0)"><path d="M0 0 C0 0, 0.01 0, 0.01 0 M0 0 C0 0, 0.01 0, 0.01 0" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-5"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(14.208526163476108 55.34667386902697) rotate(89.99999999999994 0 -3.993103729190416)"><path d="M0 0 C0 -3.09, 0 -6.19, 0 -7.99 M0 0 C0 -1.83, 0 -3.66, 0 -7.99" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(20.19818175726141 53.35012200443168) rotate(89.99999999999994 -3.993103729190352 -1.9965518645952116)" fill-rule="evenodd"><path d="M0 0 L-3.99 -3.99 L-7.99 0" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-7"></path><path d="M0 0 C-1.46 -1.46, -2.91 -2.91, -3.99 -3.99 M0 0 C-1.15 -1.15, -2.3 -2.3, -3.99 -3.99 M-3.99 -3.99 C-5.13 -2.85, -6.27 -1.71, -7.99 0 M-3.99 -3.99 C-5.53 -2.45, -7.08 -0.91, -7.99 0 M-7.99 0 C-5.33 0, -2.68 0, 0 0 M-7.99 0 C-5.96 0, -3.92 0, 0 0" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-8"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(23.519112873046197 34.056775971884285) rotate(89.99999999999994 0.00665532520679335 0)"><path d="M0 0 C0 0, 0.01 0, 0.01 0 M0 0 C0 0, 0.01 0, 0.01 0" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-9"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(20.863699045460635 39.37425895226518) rotate(89.99999999999994 2.6620691527937197 2.662069152793613)"><path d="M5.32 2.66 C5.32 2.82, 5.31 2.97, 5.28 3.12 C5.26 3.28, 5.22 3.43, 5.16 3.57 C5.11 3.72, 5.04 3.86, 4.97 3.99 C4.89 4.13, 4.8 4.26, 4.7 4.37 C4.6 4.49, 4.49 4.6, 4.37 4.7 C4.26 4.8, 4.13 4.89, 3.99 4.97 C3.86 5.04, 3.72 5.11, 3.57 5.16 C3.43 5.22, 3.28 5.26, 3.12 5.28 C2.97 5.31, 2.82 5.32, 2.66 5.32 C2.51 5.32, 2.35 5.31, 2.2 5.28 C2.05 5.26, 1.9 5.22, 1.75 5.16 C1.61 5.11, 1.46 5.04, 1.33 4.97 C1.2 4.89, 1.07 4.8, 0.95 4.7 C0.83 4.6, 0.72 4.49, 0.62 4.37 C0.52 4.26, 0.43 4.13, 0.36 3.99 C0.28 3.86, 0.21 3.72, 0.16 3.57 C0.11 3.43, 0.07 3.28, 0.04 3.12 C0.01 2.97, 0 2.82, 0 2.66 C0 2.51, 0.01 2.35, 0.04 2.2 C0.07 2.05, 0.11 1.9, 0.16 1.75 C0.21 1.61, 0.28 1.46, 0.36 1.33 C0.43 1.2, 0.52 1.07, 0.62 0.95 C0.72 0.83, 0.83 0.72, 0.95 0.62 C1.07 0.52, 1.2 0.43, 1.33 0.36 C1.46 0.28, 1.61 0.21, 1.75 0.16 C1.9 0.11, 2.05 0.07, 2.2 0.04 C2.35 0.01, 2.51 0, 2.66 0 C2.82 0, 2.97 0.01, 3.12 0.04 C3.28 0.07, 3.43 0.11, 3.57 0.16 C3.72 0.21, 3.86 0.28, 3.99 0.36 C4.13 0.43, 4.26 0.52, 4.37 0.62 C4.49 0.72, 4.6 0.83, 4.7 0.95 C4.8 1.07, 4.89 1.2, 4.97 1.33 C5.04 1.46, 5.11 1.61, 5.16 1.75 C5.22 1.9, 5.26 2.05, 5.28 2.2 C5.31 2.35, 5.32 2.59, 5.32 2.66 C5.33 2.74, 5.33 2.59, 5.32 2.66" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-10"></path><path d="M5.32 2.66 C5.32 2.82, 5.31 2.97, 5.28 3.12 C5.26 3.28, 5.22 3.43, 5.16 3.57 C5.11 3.72, 5.04 3.86, 4.97 3.99 C4.89 4.13, 4.8 4.26, 4.7 4.37 C4.6 4.49, 4.49 4.6, 4.37 4.7 C4.26 4.8, 4.13 4.89, 3.99 4.97 C3.86 5.04, 3.72 5.11, 3.57 5.16 C3.43 5.22, 3.28 5.26, 3.12 5.28 C2.97 5.31, 2.82 5.32, 2.66 5.32 C2.51 5.32, 2.35 5.31, 2.2 5.28 C2.05 5.26, 1.9 5.22, 1.75 5.16 C1.61 5.11, 1.46 5.04, 1.33 4.97 C1.2 4.89, 1.07 4.8, 0.95 4.7 C0.83 4.6, 0.72 4.49, 0.62 4.37 C0.52 4.26, 0.43 4.13, 0.36 3.99 C0.28 3.86, 0.21 3.72, 0.16 3.57 C0.11 3.43, 0.07 3.28, 0.04 3.12 C0.01 2.97, 0 2.82, 0 2.66 C0 2.51, 0.01 2.35, 0.04 2.2 C0.07 2.05, 0.11 1.9, 0.16 1.75 C0.21 1.61, 0.28 1.46, 0.36 1.33 C0.43 1.2, 0.52 1.07, 0.62 0.95 C0.72 0.83, 0.83 0.72, 0.95 0.62 C1.07 0.52, 1.2 0.43, 1.33 0.36 C1.46 0.28, 1.61 0.21, 1.75 0.16 C1.9 0.11, 2.05 0.07, 2.2 0.04 C2.35 0.01, 2.51 0, 2.66 0 C2.82 0, 2.97 0.01, 3.12 0.04 C3.28 0.07, 3.43 0.11, 3.57 0.16 C3.72 0.21, 3.86 0.28, 3.99 0.36 C4.13 0.43, 4.26 0.52, 4.37 0.62 C4.49 0.72, 4.6 0.83, 4.7 0.95 C4.8 1.07, 4.89 1.2, 4.97 1.33 C5.04 1.46, 5.11 1.61, 5.16 1.75 C5.22 1.9, 5.26 2.05, 5.28 2.2 C5.31 2.35, 5.32 2.59, 5.32 2.66 C5.33 2.74, 5.33 2.59, 5.32 2.66" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-11"></path></g><g stroke-linecap="round"><g transform="translate(10.062949984268926 34.979207310910894) rotate(0 2.6394531250000455 2.0856119791666643)" fill-rule="evenodd"><path d="M0 0 C0.11 0.29, 0.29 1.25, 0.68 1.72 C1.07 2.19, 1.58 2.41, 2.35 2.81 C3.12 3.22, 4.79 3.95, 5.28 4.17" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-12"></path><path d="M0 0 C0.11 0.29, 0.29 1.25, 0.68 1.72 C1.07 2.19, 1.58 2.41, 2.35 2.81 C3.12 3.22, 4.79 3.95, 5.28 4.17 M0 0 C0.11 0.29, 0.29 1.25, 0.68 1.72 C1.07 2.19, 1.58 2.41, 2.35 2.81 C3.12 3.22, 4.79 3.95, 5.28 4.17" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-13"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(36.98967103556333 35.00799568899225) rotate(0 -2.6394531250000455 2.0856119791666643)" fill-rule="evenodd"><path d="M0 0 C-0.11 0.29, -0.29 1.25, -0.68 1.72 C-1.07 2.19, -1.58 2.41, -2.35 2.81 C-3.12 3.22, -4.79 3.95, -5.28 4.17" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-14"></path><path d="M0 0 C-0.11 0.29, -0.29 1.25, -0.68 1.72 C-1.07 2.19, -1.58 2.41, -2.35 2.81 C-3.12 3.22, -4.79 3.95, -5.28 4.17 M0 0 C-0.11 0.29, -0.29 1.25, -0.68 1.72 C-1.07 2.19, -1.58 2.41, -2.35 2.81 C-3.12 3.22, -4.79 3.95, -5.28 4.17" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-15"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(10 34.54929830279407) rotate(0 0.07254548026821794 -10.015580895386549)"><path d="M0 0 C0.02 -3.34, 0.12 -16.69, 0.15 -20.03 M0 0 C0.02 -3.34, 0.12 -16.69, 0.15 -20.03" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-16"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(36.933393293504196 35.01298795380006) rotate(0 -0.0018503684207189508 -10.382894593292637)"><path d="M0 0 C0 -3.46, 0 -17.3, 0 -20.77 M0 0 C0 -3.46, 0 -17.3, 0 -20.77" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-17"></path></g></g><mask></mask></svg>
     
      `,
        css: `
            /***************************************************
 * Generated by SVG Artista on 9/1/2025, 5:44:51 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 123.99473571777344px;
  stroke-dasharray: 61.99736785888672px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 61.99736785888672px;
  fill: transparent;
}

svg .svg-elem-2 {
  stroke-dashoffset: 123.99473571777344px;
  stroke-dasharray: 61.99736785888672px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 61.99736785888672px;
  fill: transparent;
}

svg .svg-elem-3 {
  stroke-dashoffset: 123.37220764160156px;
  stroke-dasharray: 61.68610382080078px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 61.68610382080078px;
  fill: transparent;
}

svg .svg-elem-4 {
  stroke-dashoffset: 257.2662658691406px;
  stroke-dasharray: 128.6331329345703px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 128.6331329345703px;
  fill: transparent;
}

svg .svg-elem-5 {
  stroke-dashoffset: 4.040000002831221px;
  stroke-dasharray: 2.0200000014156103px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 2.0200000014156103px;
  fill: transparent;
}

svg .svg-elem-6 {
  stroke-dashoffset: 35.959999084472656px;
  stroke-dasharray: 17.979999542236328px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 17.979999542236328px;
  fill: transparent;
}

svg .svg-elem-7 {
  stroke-dashoffset: 26.584999084472656px;
  stroke-dasharray: 13.292499542236328px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 13.292499542236328px;
  fill: transparent;
}

svg .svg-elem-8 {
  stroke-dashoffset: 81.1300048828125px;
  stroke-dasharray: 40.56500244140625px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
}

svg.active .svg-elem-8 {
  stroke-dashoffset: 40.56500244140625px;
  fill: transparent;
}

svg .svg-elem-9 {
  stroke-dashoffset: 4.040000002831221px;
  stroke-dasharray: 2.0200000014156103px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
}

svg.active .svg-elem-9 {
  stroke-dashoffset: 2.0200000014156103px;
  fill: transparent;
}

svg .svg-elem-10 {
  stroke-dashoffset: 37.630123138427734px;
  stroke-dasharray: 18.815061569213867px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
}

svg.active .svg-elem-10 {
  stroke-dashoffset: 18.815061569213867px;
  fill: transparent;
}

svg .svg-elem-11 {
  stroke-dashoffset: 37.630123138427734px;
  stroke-dasharray: 18.815061569213867px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
}

svg.active .svg-elem-11 {
  stroke-dashoffset: 18.815061569213867px;
  fill: transparent;
}

svg .svg-elem-12 {
  stroke-dashoffset: 18.20207977294922px;
  stroke-dasharray: 9.10103988647461px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
}

svg.active .svg-elem-12 {
  stroke-dashoffset: 9.10103988647461px;
  fill: transparent;
}

svg .svg-elem-13 {
  stroke-dashoffset: 32.404157638549805px;
  stroke-dasharray: 16.202078819274902px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
}

svg.active .svg-elem-13 {
  stroke-dashoffset: 16.202078819274902px;
  fill: transparent;
}

svg .svg-elem-14 {
  stroke-dashoffset: 18.20207977294922px;
  stroke-dasharray: 9.10103988647461px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
}

svg.active .svg-elem-14 {
  stroke-dashoffset: 9.10103988647461px;
  fill: transparent;
}

svg .svg-elem-15 {
  stroke-dashoffset: 32.404157638549805px;
  stroke-dasharray: 16.202078819274902px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
}

svg.active .svg-elem-15 {
  stroke-dashoffset: 16.202078819274902px;
  fill: transparent;
}

svg .svg-elem-16 {
  stroke-dashoffset: 84.12226104736328px;
  stroke-dasharray: 42.06113052368164px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7999999999999998s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7999999999999998s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.3s;
}

svg.active .svg-elem-16 {
  stroke-dashoffset: 42.06113052368164px;
  fill: transparent;
}

svg .svg-elem-17 {
  stroke-dashoffset: 87.08000183105469px;
  stroke-dasharray: 43.540000915527344px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.92s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.4000000000000004s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.92s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.4000000000000004s;
}

svg.active .svg-elem-17 {
  stroke-dashoffset: 43.540000915527344px;
  fill: transparent;
}

    
     `
    },
    {
        name: "AI",
        svg: `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48.08973763761014 48.08262263423509" width="48.08973693847656" height="48.08262252807617" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round"><g transform="translate(31.90310448041555 16.312826966977223) rotate(0 -7.839801966012828 -3.156413483488612)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.17 -0.42, 0.35 -0.85, 0.44 -1.08 M0 0 C0.12 -0.29, 0.24 -0.59, 0.44 -1.08 M0.44 -1.08 C0.49 -1.5, 0.54 -1.93, 0.57 -2.17 M0.44 -1.08 C0.48 -1.37, 0.51 -1.65, 0.57 -2.17 M0.57 -2.17 C0.53 -2.45, 0.49 -2.73, 0.41 -3.23 M0.57 -2.17 C0.51 -2.58, 0.45 -2.98, 0.41 -3.23 M0.41 -3.23 C0.26 -3.59, 0.11 -3.95, 0 -4.2 M0.41 -3.23 C0.3 -3.5, 0.18 -3.78, 0 -4.2 M0 -4.2 C-0.21 -4.49, -0.43 -4.77, -0.64 -5.05 M0 -4.2 C-0.19 -4.46, -0.38 -4.71, -0.64 -5.05 M-0.64 -5.05 C-0.9 -5.26, -1.16 -5.46, -1.48 -5.72 M-0.64 -5.05 C-0.97 -5.31, -1.3 -5.58, -1.48 -5.72 M-1.48 -5.72 C-1.76 -5.84, -2.04 -5.96, -2.49 -6.15 M-1.48 -5.72 C-1.78 -5.84, -2.07 -5.97, -2.49 -6.15 M-2.49 -6.15 C-2.84 -6.2, -3.19 -6.25, -3.65 -6.31 M-2.49 -6.15 C-2.92 -6.21, -3.35 -6.27, -3.65 -6.31 M-3.65 -6.31 C-4 -6.24, -4.36 -6.16, -5.29 -5.98 M-3.65 -6.31 C-4.01 -6.23, -4.36 -6.16, -5.29 -5.98 M-5.29 -5.98 C-5.67 -5.72, -6.06 -5.46, -6.62 -5.08 M-5.29 -5.98 C-5.74 -5.67, -6.2 -5.36, -6.62 -5.08 M-6.62 -5.08 C-6.9 -4.67, -7.18 -4.26, -7.53 -3.74 M-6.62 -5.08 C-6.89 -4.69, -7.15 -4.3, -7.53 -3.74 M-7.53 -3.74 C-7.61 -3.34, -7.69 -2.94, -7.86 -2.1 M-7.53 -3.74 C-7.66 -3.1, -7.79 -2.46, -7.86 -2.1 M-7.86 -2.1 C-7.91 -2.49, -7.96 -2.88, -8.01 -3.25 M-7.86 -2.1 C-7.9 -2.42, -7.94 -2.73, -8.01 -3.25 M-8.01 -3.25 C-8.18 -3.63, -8.34 -4.01, -8.45 -4.26 M-8.01 -3.25 C-8.18 -3.64, -8.35 -4.03, -8.45 -4.26 M-8.45 -4.26 C-8.68 -4.55, -8.91 -4.84, -9.12 -5.1 M-8.45 -4.26 C-8.66 -4.53, -8.86 -4.79, -9.12 -5.1 M-9.12 -5.1 C-9.4 -5.32, -9.68 -5.53, -9.96 -5.74 M-9.12 -5.1 C-9.39 -5.31, -9.67 -5.52, -9.96 -5.74 M-9.96 -5.74 C-10.35 -5.91, -10.73 -6.07, -10.94 -6.16 M-9.96 -5.74 C-10.25 -5.87, -10.54 -5.99, -10.94 -6.16 M-10.94 -6.16 C-11.16 -6.19, -11.38 -6.22, -12 -6.31 M-10.94 -6.16 C-11.16 -6.19, -11.38 -6.22, -12 -6.31 M-12 -6.31 C-12.42 -6.26, -12.85 -6.21, -13.1 -6.18 M-12 -6.31 C-12.32 -6.28, -12.64 -6.24, -13.1 -6.18 M-13.1 -6.18 C-13.44 -6.04, -13.78 -5.9, -14.17 -5.74 M-13.1 -6.18 C-13.48 -6.03, -13.87 -5.87, -14.17 -5.74 M-14.17 -5.74 C-14.51 -5.45, -14.84 -5.15, -15.43 -4.64 M-14.17 -5.74 C-14.57 -5.39, -14.97 -5.04, -15.43 -4.64 M-15.43 -4.64 C-15.59 -4.31, -15.75 -3.98, -16.14 -3.19 M-15.43 -4.64 C-15.64 -4.22, -15.84 -3.79, -16.14 -3.19 M-16.14 -3.19 C-16.16 -2.84, -16.19 -2.49, -16.25 -1.58 M-16.14 -3.19 C-16.18 -2.61, -16.22 -2.03, -16.25 -1.58 M-16.25 -1.58 C-16.07 -1.05, -15.89 -0.51, -15.72 0 M-16.25 -1.58 C-16.1 -1.15, -15.96 -0.72, -15.72 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-1"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(32.46320407917892 14.392576471303261) rotate(0 2.1088268918192625 4.049841581143693)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.49 0.19, 0.98 0.38, 1.24 0.48 M0 0 C0.32 0.12, 0.63 0.24, 1.24 0.48 M1.24 0.48 C1.64 0.76, 2.05 1.03, 2.29 1.2 M1.24 0.48 C1.46 0.63, 1.68 0.78, 2.29 1.2 M2.29 1.2 C2.56 1.49, 2.83 1.79, 3.13 2.12 M2.29 1.2 C2.6 1.54, 2.92 1.89, 3.13 2.12 M3.13 2.12 C3.32 2.45, 3.51 2.78, 3.75 3.19 M3.13 2.12 C3.33 2.46, 3.53 2.8, 3.75 3.19 M3.75 3.19 C3.87 3.58, 3.99 3.97, 4.11 4.37 M3.75 3.19 C3.89 3.64, 4.03 4.09, 4.11 4.37 M4.11 4.37 C4.15 4.82, 4.19 5.27, 4.22 5.61 M4.11 4.37 C4.15 4.79, 4.19 5.22, 4.22 5.61 M4.22 5.61 C4.16 5.99, 4.11 6.37, 4.03 6.87 M4.22 5.61 C4.16 5.97, 4.11 6.34, 4.03 6.87 M4.03 6.87 C3.89 7.24, 3.74 7.61, 3.55 8.1 M4.03 6.87 C3.89 7.24, 3.74 7.61, 3.55 8.1" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-2"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(32.46741571671919 32.46595817686868) rotate(0 2.811160960445477 -5.238823941747755)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.6 -0.08, 1.19 -0.16, 1.54 -0.21 M0 0 C0.47 -0.06, 0.93 -0.13, 1.54 -0.21 M1.54 -0.21 C1.85 -0.34, 2.16 -0.48, 2.89 -0.79 M1.54 -0.21 C1.82 -0.33, 2.11 -0.45, 2.89 -0.79 M2.89 -0.79 C3.17 -1.02, 3.46 -1.24, 4.01 -1.68 M2.89 -0.79 C3.24 -1.07, 3.59 -1.35, 4.01 -1.68 M4.01 -1.68 C4.23 -1.97, 4.45 -2.26, 4.86 -2.81 M4.01 -1.68 C4.31 -2.08, 4.62 -2.48, 4.86 -2.81 M4.86 -2.81 C4.99 -3.11, 5.11 -3.4, 5.41 -4.11 M4.86 -2.81 C5 -3.13, 5.13 -3.45, 5.41 -4.11 M5.41 -4.11 C5.46 -4.42, 5.5 -4.73, 5.62 -5.53 M5.41 -4.11 C5.46 -4.4, 5.5 -4.68, 5.62 -5.53 M5.62 -5.53 C5.58 -5.85, 5.55 -6.17, 5.45 -6.99 M5.62 -5.53 C5.58 -5.9, 5.54 -6.26, 5.45 -6.99 M5.45 -6.99 C5.31 -7.33, 5.17 -7.67, 4.86 -8.42 M5.45 -6.99 C5.23 -7.54, 5 -8.09, 4.86 -8.42 M4.86 -8.42 C4.53 -8.86, 4.19 -9.3, 3.97 -9.59 M4.86 -8.42 C4.64 -8.71, 4.42 -9, 3.97 -9.59 M3.97 -9.59 C3.63 -9.85, 3.29 -10.11, 2.81 -10.48 M3.97 -9.59 C3.62 -9.85, 3.27 -10.12, 2.81 -10.48" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-3"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(35.228605985971626 31.740215114585947) rotate(0 -11.18373775285977 3.1712037598245715)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0.37, 0 0.74, -0.01 1.55 M0 0 C0 0.36, 0 0.72, -0.01 1.55 M-0.01 1.55 C-0.13 1.97, -0.25 2.38, -0.41 2.96 M-0.01 1.55 C-0.1 1.85, -0.18 2.15, -0.41 2.96 M-0.41 2.96 C-0.65 3.36, -0.89 3.76, -1.15 4.19 M-0.41 2.96 C-0.61 3.29, -0.81 3.62, -1.15 4.19 M-1.15 4.19 C-1.52 4.56, -1.89 4.92, -2.16 5.18 M-1.15 4.19 C-1.46 4.49, -1.77 4.8, -2.16 5.18 M-2.16 5.18 C-2.64 5.46, -3.12 5.74, -3.38 5.9 M-2.16 5.18 C-2.57 5.42, -2.99 5.66, -3.38 5.9 M-3.38 5.9 C-3.73 5.99, -4.08 6.09, -4.76 6.28 M-3.38 5.9 C-3.83 6.02, -4.28 6.15, -4.76 6.28 M-4.76 6.28 C-5.33 6.29, -5.9 6.3, -6.23 6.3 M-4.76 6.28 C-5.17 6.29, -5.58 6.29, -6.23 6.3 M-6.23 6.3 C-6.79 6.15, -7.34 6, -7.73 5.9 M-6.23 6.3 C-6.72 6.17, -7.2 6.04, -7.73 5.9 M-7.73 5.9 C-8.04 5.71, -8.35 5.53, -9.15 5.04 M-7.73 5.9 C-8.26 5.58, -8.78 5.27, -9.15 5.04 M-9.15 5.04 C-9.5 4.66, -9.85 4.27, -10.24 3.84 M-9.15 5.04 C-9.58 4.57, -10.01 4.09, -10.24 3.84 M-10.24 3.84 C-10.49 3.3, -10.75 2.77, -10.94 2.37 M-10.24 3.84 C-10.46 3.37, -10.68 2.9, -10.94 2.37 M-10.94 2.37 C-11 1.95, -11.06 1.53, -11.18 0.73 M-10.94 2.37 C-11 1.93, -11.07 1.48, -11.18 0.73 M-11.18 0.73 C-11.24 1.11, -11.29 1.5, -11.39 2.26 M-11.18 0.73 C-11.24 1.14, -11.3 1.56, -11.39 2.26 M-11.39 2.26 C-11.56 2.65, -11.73 3.04, -11.98 3.61 M-11.39 2.26 C-11.58 2.69, -11.76 3.11, -11.98 3.61 M-11.98 3.61 C-12.23 3.93, -12.49 4.25, -12.87 4.73 M-11.98 3.61 C-12.17 3.86, -12.37 4.1, -12.87 4.73 M-12.87 4.73 C-13.2 4.99, -13.54 5.24, -14 5.59 M-12.87 4.73 C-13.24 5.02, -13.62 5.3, -14 5.59 M-14 5.59 C-14.29 5.71, -14.58 5.83, -15.3 6.13 M-14 5.59 C-14.5 5.8, -15 6.01, -15.3 6.13 M-15.3 6.13 C-15.77 6.2, -16.24 6.27, -16.72 6.34 M-15.3 6.13 C-15.83 6.21, -16.36 6.29, -16.72 6.34 M-16.72 6.34 C-17.28 6.28, -17.85 6.21, -18.18 6.17 M-16.72 6.34 C-17.05 6.3, -17.39 6.26, -18.18 6.17 M-18.18 6.17 C-18.73 5.94, -19.29 5.71, -19.61 5.58 M-18.18 6.17 C-18.62 5.99, -19.07 5.8, -19.61 5.58 M-19.61 5.58 C-19.96 5.3, -20.31 5.03, -20.91 4.55 M-19.61 5.58 C-19.94 5.32, -20.27 5.06, -20.91 4.55 M-20.91 4.55 C-21.13 4.23, -21.35 3.91, -21.83 3.21 M-20.91 4.55 C-21.15 4.19, -21.4 3.84, -21.83 3.21 M-21.83 3.21 C-21.99 2.73, -22.14 2.26, -22.33 1.66 M-21.83 3.21 C-22.03 2.6, -22.23 2, -22.33 1.66 M-22.33 1.66 C-22.34 1.32, -22.35 0.98, -22.37 0 M-22.33 1.66 C-22.35 1.01, -22.36 0.36, -22.37 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(15.622322088232067 32.46595817686868) rotate(0 -2.8111610441160337 -5.238823941747755)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.32 -0.04, -0.63 -0.09, -1.54 -0.21 M0 0 C-0.46 -0.06, -0.93 -0.13, -1.54 -0.21 M-1.54 -0.21 C-1.82 -0.33, -2.1 -0.45, -2.89 -0.79 M-1.54 -0.21 C-2.07 -0.44, -2.61 -0.67, -2.89 -0.79 M-2.89 -0.79 C-3.22 -1.06, -3.56 -1.32, -4.01 -1.68 M-2.89 -0.79 C-3.24 -1.07, -3.59 -1.35, -4.01 -1.68 M-4.01 -1.68 C-4.34 -2.12, -4.68 -2.57, -4.86 -2.81 M-4.01 -1.68 C-4.19 -1.92, -4.37 -2.16, -4.86 -2.81 M-4.86 -2.81 C-5.04 -3.22, -5.21 -3.64, -5.41 -4.11 M-4.86 -2.81 C-5.03 -3.21, -5.2 -3.61, -5.41 -4.11 M-5.41 -4.11 C-5.47 -4.53, -5.54 -4.95, -5.62 -5.53 M-5.41 -4.11 C-5.49 -4.64, -5.57 -5.18, -5.62 -5.53 M-5.62 -5.53 C-5.59 -5.83, -5.55 -6.12, -5.45 -6.99 M-5.62 -5.53 C-5.57 -5.97, -5.52 -6.41, -5.45 -6.99 M-5.45 -6.99 C-5.29 -7.38, -5.13 -7.77, -4.86 -8.42 M-5.45 -6.99 C-5.22 -7.55, -4.99 -8.11, -4.86 -8.42 M-4.86 -8.42 C-4.56 -8.82, -4.26 -9.21, -3.97 -9.59 M-4.86 -8.42 C-4.6 -8.76, -4.35 -9.09, -3.97 -9.59 M-3.97 -9.59 C-3.59 -9.88, -3.21 -10.17, -2.81 -10.48 M-3.97 -9.59 C-3.6 -9.87, -3.22 -10.16, -2.81 -10.48" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-5"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(15.626533056409244 14.392576471303261) rotate(0 -2.108826389796377 4.049841581143693)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.28 0.11, -0.56 0.22, -1.24 0.48 M0 0 C-0.46 0.18, -0.93 0.36, -1.24 0.48 M-1.24 0.48 C-1.61 0.74, -1.99 0.99, -2.29 1.2 M-1.24 0.48 C-1.61 0.74, -1.99 1, -2.29 1.2 M-2.29 1.2 C-2.49 1.42, -2.7 1.64, -3.13 2.12 M-2.29 1.2 C-2.61 1.55, -2.94 1.9, -3.13 2.12 M-3.13 2.12 C-3.35 2.49, -3.56 2.87, -3.75 3.19 M-3.13 2.12 C-3.36 2.52, -3.6 2.93, -3.75 3.19 M-3.75 3.19 C-3.89 3.63, -4.03 4.08, -4.11 4.37 M-3.75 3.19 C-3.85 3.52, -3.96 3.86, -4.11 4.37 M-4.11 4.37 C-4.15 4.83, -4.19 5.29, -4.22 5.61 M-4.11 4.37 C-4.15 4.79, -4.19 5.22, -4.22 5.61 M-4.22 5.61 C-4.17 5.92, -4.13 6.24, -4.03 6.87 M-4.22 5.61 C-4.15 6.05, -4.09 6.49, -4.03 6.87 M-4.03 6.87 C-3.88 7.27, -3.72 7.67, -3.55 8.1 M-4.03 6.87 C-3.87 7.29, -3.7 7.71, -3.55 8.1" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(23.912478756960354 20.50921726573052) rotate(0 -1.4106228042398925 -1.4106228042398428)" fill-rule="evenodd"><path d="M0 0 L0 -2.82 L-2.82 -2.82" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-7"></path><path d="M0 0 C0 -1.07, 0 -2.14, 0 -2.82 M0 0 C0 -0.88, 0 -1.75, 0 -2.82 M0 -2.82 C-0.98 -2.82, -1.96 -2.82, -2.82 -2.82 M0 -2.82 C-0.83 -2.82, -1.66 -2.82, -2.82 -2.82 M-2.82 -2.82 C-2.12 -2.12, -1.42 -1.42, 0 0 M-2.82 -2.82 C-2.23 -2.23, -1.64 -1.64, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-8"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(18.269987540000784 20.50921726573052) rotate(0 5.642491216959343 4.231868412719527)"><path d="M2.12 0 C4.27 0, 6.43 0, 9.17 0 C10.58 0, 11.28 0.71, 11.28 2.12 C11.28 3.57, 11.28 5.02, 11.28 6.35 C11.28 7.76, 10.58 8.46, 9.17 8.46 C7.4 8.46, 5.63 8.46, 2.12 8.46 C0.71 8.46, 0 7.76, 0 6.35 C0 5.33, 0 4.32, 0 2.12 C0 0.71, 0.71 0, 2.12 0" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-9"></path><path d="M2.12 0 C3.8 0, 5.49 0, 9.17 0 M2.12 0 C4.27 0, 6.43 0, 9.17 0 M9.17 0 C10.58 0, 11.28 0.71, 11.28 2.12 M9.17 0 C10.58 0, 11.28 0.71, 11.28 2.12 M11.28 2.12 C11.28 3.79, 11.28 5.46, 11.28 6.35 M11.28 2.12 C11.28 3.2, 11.28 4.28, 11.28 6.35 M11.28 6.35 C11.28 7.76, 10.58 8.46, 9.17 8.46 M11.28 6.35 C11.28 7.76, 10.58 8.46, 9.17 8.46 M9.17 8.46 C7.68 8.46, 6.19 8.46, 2.12 8.46 M9.17 8.46 C7.37 8.46, 5.58 8.46, 2.12 8.46 M2.12 8.46 C0.71 8.46, 0 7.76, 0 6.35 M2.12 8.46 C0.71 8.46, 0 7.76, 0 6.35 M0 6.35 C0 4.79, 0 3.23, 0 2.12 M0 6.35 C0 5.05, 0 3.75, 0 2.12 M0 2.12 C0 0.71, 0.71 0, 2.12 0 M0 2.12 C0 0.71, 0.71 0, 2.12 0" stroke="#E1E1E1" stroke-width="1" fill="none" class="svg-elem-10"></path></g><g stroke-linecap="round"><g transform="translate(16.85936473576112 24.741085678450045) rotate(0 0.7053114021198326 0)"><path d="M0 0 C0.36 0, 0.72 0, 1.41 0 M0 0 C0.55 0, 1.1 0, 1.41 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-11"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(29.554969973919924 24.741085678450045) rotate(0 0.7053114021198326 0)"><path d="M0 0 C0.31 0, 0.62 0, 1.41 0 M0 0 C0.34 0, 0.68 0, 1.41 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-12"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(26.02841296332008 24.035774276330123) rotate(0 0 0.7053114021199214)"><path d="M0 0 C0 0.33, 0 0.66, 0 1.41 M0 0 C0 0.51, 0 1.02, 0 1.41" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-13"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(21.79654455060063 24.035774276330123) rotate(0 0 0.7053114021199214)"><path d="M0 0 C0 0.3, 0 0.59, 0 1.41 M0 0 C0 0.3, 0 0.61, 0 1.41" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-14"></path></g></g><mask></mask></svg>
      `,
        css: `
        /***************************************************
 * Generated by SVG Artista on 9/1/2025, 5:55:18 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 63.457183837890625px;
  stroke-dasharray: 63.457183837890625px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 0;
}

svg .svg-elem-2 {
  stroke-dashoffset: 22.31694221496582px;
  stroke-dasharray: 22.31694221496582px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 0;
}

svg .svg-elem-3 {
  stroke-dashoffset: 31.32834815979004px;
  stroke-dasharray: 31.32834815979004px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 0;
}

svg .svg-elem-4 {
  stroke-dashoffset: 75.20882415771484px;
  stroke-dasharray: 75.20882415771484px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 0;
}

svg .svg-elem-5 {
  stroke-dashoffset: 31.328222274780273px;
  stroke-dasharray: 31.328222274780273px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 0;
}

svg .svg-elem-6 {
  stroke-dashoffset: 22.317054748535156px;
  stroke-dasharray: 22.317054748535156px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 0;
}

svg .svg-elem-7 {
  stroke-dashoffset: 7.639999866485596px;
  stroke-dasharray: 7.639999866485596px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-8 {
  stroke-dashoffset: 21.25616455078125px;
  stroke-dasharray: 21.25616455078125px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
}

svg.active .svg-elem-8 {
  stroke-dashoffset: 0;
}

svg .svg-elem-9 {
  stroke-dashoffset: 38.29251480102539px;
  stroke-dasharray: 38.29251480102539px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
}

svg.active .svg-elem-9 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-10 {
  stroke-dashoffset: 74.58502960205078px;
  stroke-dasharray: 74.58502960205078px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
}

svg.active .svg-elem-10 {
  stroke-dashoffset: 0;
}

svg .svg-elem-11 {
  stroke-dashoffset: 4.819999933242798px;
  stroke-dasharray: 4.819999933242798px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
}

svg.active .svg-elem-11 {
  stroke-dashoffset: 0;
}

svg .svg-elem-12 {
  stroke-dashoffset: 4.819999933242798px;
  stroke-dasharray: 4.819999933242798px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
}

svg.active .svg-elem-12 {
  stroke-dashoffset: 0;
}

svg .svg-elem-13 {
  stroke-dashoffset: 4.819999933242798px;
  stroke-dasharray: 4.819999933242798px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
}

svg.active .svg-elem-13 {
  stroke-dashoffset: 0;
}

svg .svg-elem-14 {
  stroke-dashoffset: 4.819999933242798px;
  stroke-dasharray: 4.819999933242798px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
}

svg.active .svg-elem-14 {
  stroke-dashoffset: 0;
}


     `
    },
    {
        name: "Design",
        svg: `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50.36039893470934 42.94837706395566" width="50.36039733886719" height="42.9483757019043" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round"><g transform="translate(19.79120977690218 29.556177755488513) rotate(0 -0.0065604495789557404 -9.778088877744256)" fill-rule="evenodd"><path d="M0 0 L0 0 L-1.38 -0.09 L-2.68 -0.36 L-5.03 -1.38 L-6.98 -2.92 L-8.47 -4.89 L-9.43 -7.16 L-9.79 -9.63 L-9.49 -12.17 L-9.08 -13.43 L-8.47 -14.67 L-6.9 -16.71 L-4.89 -18.25 L-2.55 -19.22 L0 -19.56 L1.97 -19.38 L3.81 -18.86 L5.47 -18.05 L6.91 -16.98 L8.11 -15.68 L9.01 -14.18 L9.58 -12.53 L9.78 -10.76 L9.68 -9.77 L9.39 -8.85 L8.94 -8.02 L8.35 -7.3 L7.62 -6.7 L6.79 -6.25 L5.87 -5.97 L4.89 -5.87 L2.69 -5.87 L2.69 -5.87 L1.81 -5.63 L1.21 -5.01 L0.98 -4.18 L1.21 -3.3 L1.32 -3.13 L1.61 -2.74 L1.61 -2.74 L1.95 -1.89 L1.82 -1.04 L1.29 -0.36 L0.45 -0.01 L0.24 0 L0 0" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-1"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.53 -0.04, -1.06 -0.07, -1.38 -0.09 M0 0 C-0.5 -0.03, -1 -0.07, -1.38 -0.09 M-1.38 -0.09 C-1.82 -0.19, -2.27 -0.28, -2.68 -0.36 M-1.38 -0.09 C-1.77 -0.18, -2.17 -0.26, -2.68 -0.36 M-2.68 -0.36 C-3.36 -0.66, -4.04 -0.95, -5.03 -1.38 M-2.68 -0.36 C-3.39 -0.67, -4.09 -0.97, -5.03 -1.38 M-5.03 -1.38 C-5.62 -1.84, -6.21 -2.31, -6.98 -2.92 M-5.03 -1.38 C-5.57 -1.8, -6.1 -2.23, -6.98 -2.92 M-6.98 -2.92 C-7.47 -3.57, -7.96 -4.22, -8.47 -4.89 M-6.98 -2.92 C-7.35 -3.41, -7.71 -3.89, -8.47 -4.89 M-8.47 -4.89 C-8.72 -5.48, -8.97 -6.07, -9.43 -7.16 M-8.47 -4.89 C-8.71 -5.46, -8.95 -6.04, -9.43 -7.16 M-9.43 -7.16 C-9.57 -8.12, -9.71 -9.08, -9.79 -9.63 M-9.43 -7.16 C-9.53 -7.87, -9.64 -8.57, -9.79 -9.63 M-9.79 -9.63 C-9.7 -10.42, -9.6 -11.22, -9.49 -12.17 M-9.79 -9.63 C-9.73 -10.14, -9.67 -10.66, -9.49 -12.17 M-9.49 -12.17 C-9.33 -12.65, -9.17 -13.14, -9.08 -13.43 M-9.49 -12.17 C-9.38 -12.5, -9.27 -12.84, -9.08 -13.43 M-9.08 -13.43 C-8.95 -13.68, -8.83 -13.92, -8.47 -14.67 M-9.08 -13.43 C-8.92 -13.74, -8.77 -14.06, -8.47 -14.67 M-8.47 -14.67 C-8.04 -15.22, -7.62 -15.77, -6.9 -16.71 M-8.47 -14.67 C-7.84 -15.48, -7.21 -16.3, -6.9 -16.71 M-6.9 -16.71 C-6.31 -17.16, -5.72 -17.61, -4.89 -18.25 M-6.9 -16.71 C-6.29 -17.17, -5.69 -17.63, -4.89 -18.25 M-4.89 -18.25 C-4.33 -18.48, -3.77 -18.71, -2.55 -19.22 M-4.89 -18.25 C-4.29 -18.5, -3.68 -18.75, -2.55 -19.22 M-2.55 -19.22 C-2.02 -19.29, -1.49 -19.36, 0 -19.56 M-2.55 -19.22 C-1.55 -19.35, -0.55 -19.48, 0 -19.56 M0 -19.56 C0.63 -19.5, 1.27 -19.44, 1.97 -19.38 M0 -19.56 C0.74 -19.49, 1.48 -19.42, 1.97 -19.38 M1.97 -19.38 C2.69 -19.18, 3.4 -18.98, 3.81 -18.86 M1.97 -19.38 C2.61 -19.2, 3.25 -19.02, 3.81 -18.86 M3.81 -18.86 C4.45 -18.55, 5.09 -18.24, 5.47 -18.05 M3.81 -18.86 C4.23 -18.66, 4.65 -18.45, 5.47 -18.05 M5.47 -18.05 C5.94 -17.7, 6.41 -17.35, 6.91 -16.98 M5.47 -18.05 C5.97 -17.68, 6.48 -17.3, 6.91 -16.98 M6.91 -16.98 C7.32 -16.54, 7.72 -16.1, 8.11 -15.68 M6.91 -16.98 C7.33 -16.53, 7.74 -16.07, 8.11 -15.68 M8.11 -15.68 C8.41 -15.17, 8.72 -14.66, 9.01 -14.18 M8.11 -15.68 C8.41 -15.18, 8.71 -14.68, 9.01 -14.18 M9.01 -14.18 C9.19 -13.66, 9.37 -13.13, 9.58 -12.53 M9.01 -14.18 C9.17 -13.71, 9.33 -13.24, 9.58 -12.53 M9.58 -12.53 C9.66 -11.83, 9.74 -11.13, 9.78 -10.76 M9.58 -12.53 C9.62 -12.17, 9.66 -11.8, 9.78 -10.76 M9.78 -10.76 C9.75 -10.45, 9.72 -10.15, 9.68 -9.77 M9.78 -10.76 C9.75 -10.51, 9.73 -10.27, 9.68 -9.77 M9.68 -9.77 C9.6 -9.51, 9.51 -9.24, 9.39 -8.85 M9.68 -9.77 C9.61 -9.56, 9.55 -9.34, 9.39 -8.85 M9.39 -8.85 C9.25 -8.58, 9.1 -8.31, 8.94 -8.02 M9.39 -8.85 C9.22 -8.53, 9.05 -8.21, 8.94 -8.02 M8.94 -8.02 C8.79 -7.84, 8.64 -7.65, 8.35 -7.3 M8.94 -8.02 C8.8 -7.84, 8.65 -7.67, 8.35 -7.3 M8.35 -7.3 C8.18 -7.16, 8.02 -7.03, 7.62 -6.7 M8.35 -7.3 C8.2 -7.17, 8.05 -7.05, 7.62 -6.7 M7.62 -6.7 C7.31 -6.53, 7 -6.36, 6.79 -6.25 M7.62 -6.7 C7.43 -6.6, 7.23 -6.49, 6.79 -6.25 M6.79 -6.25 C6.51 -6.16, 6.23 -6.08, 5.87 -5.97 M6.79 -6.25 C6.44 -6.14, 6.08 -6.03, 5.87 -5.97 M5.87 -5.97 C5.52 -5.93, 5.17 -5.9, 4.89 -5.87 M5.87 -5.97 C5.53 -5.93, 5.18 -5.9, 4.89 -5.87 M4.89 -5.87 C4.26 -5.87, 3.63 -5.87, 2.69 -5.87 M4.89 -5.87 C4.09 -5.87, 3.3 -5.87, 2.69 -5.87 M2.69 -5.87 C2.69 -5.87, 2.69 -5.87, 2.69 -5.87 M2.69 -5.87 C2.69 -5.87, 2.69 -5.87, 2.69 -5.87 M2.69 -5.87 C2.39 -5.78, 2.08 -5.7, 1.81 -5.63 M2.69 -5.87 C2.4 -5.79, 2.12 -5.71, 1.81 -5.63 M1.81 -5.63 C1.61 -5.42, 1.41 -5.22, 1.21 -5.01 M1.81 -5.63 C1.68 -5.5, 1.56 -5.37, 1.21 -5.01 M1.21 -5.01 C1.14 -4.78, 1.08 -4.55, 0.98 -4.18 M1.21 -5.01 C1.15 -4.81, 1.1 -4.61, 0.98 -4.18 M0.98 -4.18 C1.05 -3.88, 1.13 -3.58, 1.21 -3.3 M0.98 -4.18 C1.04 -3.95, 1.1 -3.71, 1.21 -3.3 M1.21 -3.3 C1.25 -3.24, 1.28 -3.18, 1.32 -3.13 M1.21 -3.3 C1.23 -3.26, 1.26 -3.22, 1.32 -3.13 M1.32 -3.13 C1.39 -3.04, 1.45 -2.95, 1.61 -2.74 M1.32 -3.13 C1.41 -3.01, 1.49 -2.9, 1.61 -2.74 M1.61 -2.74 C1.61 -2.74, 1.61 -2.74, 1.61 -2.74 M1.61 -2.74 C1.61 -2.74, 1.61 -2.74, 1.61 -2.74 M1.61 -2.74 C1.71 -2.48, 1.82 -2.23, 1.95 -1.89 M1.61 -2.74 C1.7 -2.51, 1.79 -2.29, 1.95 -1.89 M1.95 -1.89 C1.9 -1.57, 1.85 -1.25, 1.82 -1.04 M1.95 -1.89 C1.9 -1.6, 1.86 -1.32, 1.82 -1.04 M1.82 -1.04 C1.67 -0.84, 1.51 -0.64, 1.29 -0.36 M1.82 -1.04 C1.66 -0.83, 1.5 -0.63, 1.29 -0.36 M1.29 -0.36 C1.1 -0.28, 0.91 -0.2, 0.45 -0.01 M1.29 -0.36 C1.03 -0.25, 0.77 -0.14, 0.45 -0.01 M0.45 -0.01 C0.37 -0.01, 0.3 0, 0.24 0 M0.45 -0.01 C0.39 -0.01, 0.33 -0.01, 0.24 0 M0.24 0 C0.16 0, 0.07 0, 0 0 M0.24 0 C0.18 0, 0.11 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-2"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(20.769018664676423 13.911235551097702) rotate(0 0.4889044438871224 0.48890444388721277)"><path d="M0.98 0.49 C0.98 0.52, 0.98 0.55, 0.97 0.57 C0.97 0.6, 0.96 0.63, 0.95 0.66 C0.94 0.68, 0.93 0.71, 0.91 0.73 C0.9 0.76, 0.88 0.78, 0.86 0.8 C0.85 0.82, 0.82 0.85, 0.8 0.86 C0.78 0.88, 0.76 0.9, 0.73 0.91 C0.71 0.93, 0.68 0.94, 0.66 0.95 C0.63 0.96, 0.6 0.97, 0.57 0.97 C0.55 0.98, 0.52 0.98, 0.49 0.98 C0.46 0.98, 0.43 0.98, 0.4 0.97 C0.38 0.97, 0.35 0.96, 0.32 0.95 C0.3 0.94, 0.27 0.93, 0.24 0.91 C0.22 0.9, 0.2 0.88, 0.17 0.86 C0.15 0.85, 0.13 0.82, 0.11 0.8 C0.1 0.78, 0.08 0.76, 0.07 0.73 C0.05 0.71, 0.04 0.68, 0.03 0.66 C0.02 0.63, 0.01 0.6, 0.01 0.57 C0 0.55, 0 0.52, 0 0.49 C0 0.46, 0 0.43, 0.01 0.4 C0.01 0.38, 0.02 0.35, 0.03 0.32 C0.04 0.3, 0.05 0.27, 0.07 0.24 C0.08 0.22, 0.1 0.2, 0.11 0.17 C0.13 0.15, 0.15 0.13, 0.17 0.11 C0.2 0.1, 0.22 0.08, 0.24 0.07 C0.27 0.05, 0.3 0.04, 0.32 0.03 C0.35 0.02, 0.38 0.01, 0.4 0.01 C0.43 0, 0.46 0, 0.49 0 C0.52 0, 0.55 0, 0.57 0.01 C0.6 0.01, 0.63 0.02, 0.66 0.03 C0.68 0.04, 0.71 0.05, 0.73 0.07 C0.76 0.08, 0.78 0.1, 0.8 0.11 C0.82 0.13, 0.85 0.15, 0.86 0.17 C0.88 0.2, 0.9 0.22, 0.91 0.24 C0.93 0.27, 0.94 0.3, 0.95 0.32 C0.96 0.35, 0.97 0.38, 0.97 0.4 C0.98 0.43, 0.98 0.47, 0.98 0.49 C0.98 0.5, 0.98 0.47, 0.98 0.49" stroke="none" stroke-width="0" fill="currentColor" class="svg-elem-3"></path><path d="M0.98 0.49 C0.98 0.52, 0.98 0.55, 0.97 0.57 C0.97 0.6, 0.96 0.63, 0.95 0.66 C0.94 0.68, 0.93 0.71, 0.91 0.73 C0.9 0.76, 0.88 0.78, 0.86 0.8 C0.85 0.82, 0.82 0.85, 0.8 0.86 C0.78 0.88, 0.76 0.9, 0.73 0.91 C0.71 0.93, 0.68 0.94, 0.66 0.95 C0.63 0.96, 0.6 0.97, 0.57 0.97 C0.55 0.98, 0.52 0.98, 0.49 0.98 C0.46 0.98, 0.43 0.98, 0.4 0.97 C0.38 0.97, 0.35 0.96, 0.32 0.95 C0.3 0.94, 0.27 0.93, 0.24 0.91 C0.22 0.9, 0.2 0.88, 0.17 0.86 C0.15 0.85, 0.13 0.82, 0.11 0.8 C0.1 0.78, 0.08 0.76, 0.07 0.73 C0.05 0.71, 0.04 0.68, 0.03 0.66 C0.02 0.63, 0.01 0.6, 0.01 0.57 C0 0.55, 0 0.52, 0 0.49 C0 0.46, 0 0.43, 0.01 0.4 C0.01 0.38, 0.02 0.35, 0.03 0.32 C0.04 0.3, 0.05 0.27, 0.07 0.24 C0.08 0.22, 0.1 0.2, 0.11 0.17 C0.13 0.15, 0.15 0.13, 0.17 0.11 C0.2 0.1, 0.22 0.08, 0.24 0.07 C0.27 0.05, 0.3 0.04, 0.32 0.03 C0.35 0.02, 0.38 0.01, 0.4 0.01 C0.43 0, 0.46 0, 0.49 0 C0.52 0, 0.55 0, 0.57 0.01 C0.6 0.01, 0.63 0.02, 0.66 0.03 C0.68 0.04, 0.71 0.05, 0.73 0.07 C0.76 0.08, 0.78 0.1, 0.8 0.11 C0.82 0.13, 0.85 0.15, 0.86 0.17 C0.88 0.2, 0.9 0.22, 0.91 0.24 C0.93 0.27, 0.94 0.3, 0.95 0.32 C0.96 0.35, 0.97 0.38, 0.97 0.4 C0.98 0.43, 0.98 0.47, 0.98 0.49 C0.98 0.5, 0.98 0.47, 0.98 0.49" stroke="#E1E1E1" stroke-width="1" fill="none" class="svg-elem-4"></path></g><g stroke-linecap="round" transform="translate(24.680254215774312 17.822471102195404) rotate(0 0.4889044438871224 0.48890444388721277)"><path d="M0.98 0.49 C0.98 0.52, 0.98 0.55, 0.97 0.57 C0.97 0.6, 0.96 0.63, 0.95 0.66 C0.94 0.68, 0.93 0.71, 0.91 0.73 C0.9 0.76, 0.88 0.78, 0.86 0.8 C0.85 0.82, 0.82 0.85, 0.8 0.86 C0.78 0.88, 0.76 0.9, 0.73 0.91 C0.71 0.93, 0.68 0.94, 0.66 0.95 C0.63 0.96, 0.6 0.97, 0.57 0.97 C0.55 0.98, 0.52 0.98, 0.49 0.98 C0.46 0.98, 0.43 0.98, 0.4 0.97 C0.38 0.97, 0.35 0.96, 0.32 0.95 C0.3 0.94, 0.27 0.93, 0.24 0.91 C0.22 0.9, 0.2 0.88, 0.17 0.86 C0.15 0.85, 0.13 0.82, 0.11 0.8 C0.1 0.78, 0.08 0.76, 0.07 0.73 C0.05 0.71, 0.04 0.68, 0.03 0.66 C0.02 0.63, 0.01 0.6, 0.01 0.57 C0 0.55, 0 0.52, 0 0.49 C0 0.46, 0 0.43, 0.01 0.4 C0.01 0.38, 0.02 0.35, 0.03 0.32 C0.04 0.3, 0.05 0.27, 0.07 0.24 C0.08 0.22, 0.1 0.2, 0.11 0.17 C0.13 0.15, 0.15 0.13, 0.17 0.11 C0.2 0.1, 0.22 0.08, 0.24 0.07 C0.27 0.05, 0.3 0.04, 0.32 0.03 C0.35 0.02, 0.38 0.01, 0.4 0.01 C0.43 0, 0.46 0, 0.49 0 C0.52 0, 0.55 0, 0.57 0.01 C0.6 0.01, 0.63 0.02, 0.66 0.03 C0.68 0.04, 0.71 0.05, 0.73 0.07 C0.76 0.08, 0.78 0.1, 0.8 0.11 C0.82 0.13, 0.85 0.15, 0.86 0.17 C0.88 0.2, 0.9 0.22, 0.91 0.24 C0.93 0.27, 0.94 0.3, 0.95 0.32 C0.96 0.35, 0.97 0.38, 0.97 0.4 C0.98 0.43, 0.98 0.47, 0.98 0.49 C0.98 0.5, 0.98 0.47, 0.98 0.49" stroke="none" stroke-width="0" fill="currentColor" class="svg-elem-5"></path><path d="M0.98 0.49 C0.98 0.52, 0.98 0.55, 0.97 0.57 C0.97 0.6, 0.96 0.63, 0.95 0.66 C0.94 0.68, 0.93 0.71, 0.91 0.73 C0.9 0.76, 0.88 0.78, 0.86 0.8 C0.85 0.82, 0.82 0.85, 0.8 0.86 C0.78 0.88, 0.76 0.9, 0.73 0.91 C0.71 0.93, 0.68 0.94, 0.66 0.95 C0.63 0.96, 0.6 0.97, 0.57 0.97 C0.55 0.98, 0.52 0.98, 0.49 0.98 C0.46 0.98, 0.43 0.98, 0.4 0.97 C0.38 0.97, 0.35 0.96, 0.32 0.95 C0.3 0.94, 0.27 0.93, 0.24 0.91 C0.22 0.9, 0.2 0.88, 0.17 0.86 C0.15 0.85, 0.13 0.82, 0.11 0.8 C0.1 0.78, 0.08 0.76, 0.07 0.73 C0.05 0.71, 0.04 0.68, 0.03 0.66 C0.02 0.63, 0.01 0.6, 0.01 0.57 C0 0.55, 0 0.52, 0 0.49 C0 0.46, 0 0.43, 0.01 0.4 C0.01 0.38, 0.02 0.35, 0.03 0.32 C0.04 0.3, 0.05 0.27, 0.07 0.24 C0.08 0.22, 0.1 0.2, 0.11 0.17 C0.13 0.15, 0.15 0.13, 0.17 0.11 C0.2 0.1, 0.22 0.08, 0.24 0.07 C0.27 0.05, 0.3 0.04, 0.32 0.03 C0.35 0.02, 0.38 0.01, 0.4 0.01 C0.43 0, 0.46 0, 0.49 0 C0.52 0, 0.55 0, 0.57 0.01 C0.6 0.01, 0.63 0.02, 0.66 0.03 C0.68 0.04, 0.71 0.05, 0.73 0.07 C0.76 0.08, 0.78 0.1, 0.8 0.11 C0.82 0.13, 0.85 0.15, 0.86 0.17 C0.88 0.2, 0.9 0.22, 0.91 0.24 C0.93 0.27, 0.94 0.3, 0.95 0.32 C0.96 0.35, 0.97 0.38, 0.97 0.4 C0.98 0.43, 0.98 0.47, 0.98 0.49 C0.98 0.5, 0.98 0.47, 0.98 0.49" stroke="#E1E1E1" stroke-width="1" fill="none" class="svg-elem-6"></path></g><g stroke-linecap="round" transform="translate(13.9243564502558 19.778088877744256) rotate(0 0.4889044438871224 0.488904443887213)"><path d="M0.98 0.49 C0.98 0.52, 0.98 0.55, 0.97 0.57 C0.97 0.6, 0.96 0.63, 0.95 0.66 C0.94 0.68, 0.93 0.71, 0.91 0.73 C0.9 0.76, 0.88 0.78, 0.86 0.8 C0.85 0.82, 0.82 0.85, 0.8 0.86 C0.78 0.88, 0.76 0.9, 0.73 0.91 C0.71 0.93, 0.68 0.94, 0.66 0.95 C0.63 0.96, 0.6 0.97, 0.57 0.97 C0.55 0.98, 0.52 0.98, 0.49 0.98 C0.46 0.98, 0.43 0.98, 0.4 0.97 C0.38 0.97, 0.35 0.96, 0.32 0.95 C0.3 0.94, 0.27 0.93, 0.24 0.91 C0.22 0.9, 0.2 0.88, 0.17 0.86 C0.15 0.85, 0.13 0.82, 0.11 0.8 C0.1 0.78, 0.08 0.76, 0.07 0.73 C0.05 0.71, 0.04 0.68, 0.03 0.66 C0.02 0.63, 0.01 0.6, 0.01 0.57 C0 0.55, 0 0.52, 0 0.49 C0 0.46, 0 0.43, 0.01 0.4 C0.01 0.38, 0.02 0.35, 0.03 0.32 C0.04 0.3, 0.05 0.27, 0.07 0.24 C0.08 0.22, 0.1 0.2, 0.11 0.17 C0.13 0.15, 0.15 0.13, 0.17 0.11 C0.2 0.1, 0.22 0.08, 0.24 0.07 C0.27 0.05, 0.3 0.04, 0.32 0.03 C0.35 0.02, 0.38 0.01, 0.4 0.01 C0.43 0, 0.46 0, 0.49 0 C0.52 0, 0.55 0, 0.57 0.01 C0.6 0.01, 0.63 0.02, 0.66 0.03 C0.68 0.04, 0.71 0.05, 0.73 0.07 C0.76 0.08, 0.78 0.1, 0.8 0.11 C0.82 0.13, 0.85 0.15, 0.86 0.17 C0.88 0.2, 0.9 0.22, 0.91 0.24 C0.93 0.27, 0.94 0.3, 0.95 0.32 C0.96 0.35, 0.97 0.38, 0.97 0.4 C0.98 0.43, 0.98 0.47, 0.98 0.49 C0.98 0.5, 0.98 0.47, 0.98 0.49" stroke="none" stroke-width="0" fill="currentColor" class="svg-elem-7"></path><path d="M0.98 0.49 C0.98 0.52, 0.98 0.55, 0.97 0.57 C0.97 0.6, 0.96 0.63, 0.95 0.66 C0.94 0.68, 0.93 0.71, 0.91 0.73 C0.9 0.76, 0.88 0.78, 0.86 0.8 C0.85 0.82, 0.82 0.85, 0.8 0.86 C0.78 0.88, 0.76 0.9, 0.73 0.91 C0.71 0.93, 0.68 0.94, 0.66 0.95 C0.63 0.96, 0.6 0.97, 0.57 0.97 C0.55 0.98, 0.52 0.98, 0.49 0.98 C0.46 0.98, 0.43 0.98, 0.4 0.97 C0.38 0.97, 0.35 0.96, 0.32 0.95 C0.3 0.94, 0.27 0.93, 0.24 0.91 C0.22 0.9, 0.2 0.88, 0.17 0.86 C0.15 0.85, 0.13 0.82, 0.11 0.8 C0.1 0.78, 0.08 0.76, 0.07 0.73 C0.05 0.71, 0.04 0.68, 0.03 0.66 C0.02 0.63, 0.01 0.6, 0.01 0.57 C0 0.55, 0 0.52, 0 0.49 C0 0.46, 0 0.43, 0.01 0.4 C0.01 0.38, 0.02 0.35, 0.03 0.32 C0.04 0.3, 0.05 0.27, 0.07 0.24 C0.08 0.22, 0.1 0.2, 0.11 0.17 C0.13 0.15, 0.15 0.13, 0.17 0.11 C0.2 0.1, 0.22 0.08, 0.24 0.07 C0.27 0.05, 0.3 0.04, 0.32 0.03 C0.35 0.02, 0.38 0.01, 0.4 0.01 C0.43 0, 0.46 0, 0.49 0 C0.52 0, 0.55 0, 0.57 0.01 C0.6 0.01, 0.63 0.02, 0.66 0.03 C0.68 0.04, 0.71 0.05, 0.73 0.07 C0.76 0.08, 0.78 0.1, 0.8 0.11 C0.82 0.13, 0.85 0.15, 0.86 0.17 C0.88 0.2, 0.9 0.22, 0.91 0.24 C0.93 0.27, 0.94 0.3, 0.95 0.32 C0.96 0.35, 0.97 0.38, 0.97 0.4 C0.98 0.43, 0.98 0.47, 0.98 0.49 C0.98 0.5, 0.98 0.47, 0.98 0.49" stroke="#E1E1E1" stroke-width="1" fill="none" class="svg-elem-8"></path></g><g stroke-linecap="round" transform="translate(15.87997422580429 14.889044438872128) rotate(0 0.4889044438871224 0.4889044438872128)"><path d="M0.98 0.49 C0.98 0.52, 0.98 0.55, 0.97 0.57 C0.97 0.6, 0.96 0.63, 0.95 0.66 C0.94 0.68, 0.93 0.71, 0.91 0.73 C0.9 0.76, 0.88 0.78, 0.86 0.8 C0.85 0.82, 0.82 0.85, 0.8 0.86 C0.78 0.88, 0.76 0.9, 0.73 0.91 C0.71 0.93, 0.68 0.94, 0.66 0.95 C0.63 0.96, 0.6 0.97, 0.57 0.97 C0.55 0.98, 0.52 0.98, 0.49 0.98 C0.46 0.98, 0.43 0.98, 0.4 0.97 C0.38 0.97, 0.35 0.96, 0.32 0.95 C0.3 0.94, 0.27 0.93, 0.24 0.91 C0.22 0.9, 0.2 0.88, 0.17 0.86 C0.15 0.85, 0.13 0.82, 0.11 0.8 C0.1 0.78, 0.08 0.76, 0.07 0.73 C0.05 0.71, 0.04 0.68, 0.03 0.66 C0.02 0.63, 0.01 0.6, 0.01 0.57 C0 0.55, 0 0.52, 0 0.49 C0 0.46, 0 0.43, 0.01 0.4 C0.01 0.38, 0.02 0.35, 0.03 0.32 C0.04 0.3, 0.05 0.27, 0.07 0.24 C0.08 0.22, 0.1 0.2, 0.11 0.17 C0.13 0.15, 0.15 0.13, 0.17 0.11 C0.2 0.1, 0.22 0.08, 0.24 0.07 C0.27 0.05, 0.3 0.04, 0.32 0.03 C0.35 0.02, 0.38 0.01, 0.4 0.01 C0.43 0, 0.46 0, 0.49 0 C0.52 0, 0.55 0, 0.57 0.01 C0.6 0.01, 0.63 0.02, 0.66 0.03 C0.68 0.04, 0.71 0.05, 0.73 0.07 C0.76 0.08, 0.78 0.1, 0.8 0.11 C0.82 0.13, 0.85 0.15, 0.86 0.17 C0.88 0.2, 0.9 0.22, 0.91 0.24 C0.93 0.27, 0.94 0.3, 0.95 0.32 C0.96 0.35, 0.97 0.38, 0.97 0.4 C0.98 0.43, 0.98 0.47, 0.98 0.49 C0.98 0.5, 0.98 0.47, 0.98 0.49" stroke="none" stroke-width="0" fill="currentColor" class="svg-elem-9"></path><path d="M0.98 0.49 C0.98 0.52, 0.98 0.55, 0.97 0.57 C0.97 0.6, 0.96 0.63, 0.95 0.66 C0.94 0.68, 0.93 0.71, 0.91 0.73 C0.9 0.76, 0.88 0.78, 0.86 0.8 C0.85 0.82, 0.82 0.85, 0.8 0.86 C0.78 0.88, 0.76 0.9, 0.73 0.91 C0.71 0.93, 0.68 0.94, 0.66 0.95 C0.63 0.96, 0.6 0.97, 0.57 0.97 C0.55 0.98, 0.52 0.98, 0.49 0.98 C0.46 0.98, 0.43 0.98, 0.4 0.97 C0.38 0.97, 0.35 0.96, 0.32 0.95 C0.3 0.94, 0.27 0.93, 0.24 0.91 C0.22 0.9, 0.2 0.88, 0.17 0.86 C0.15 0.85, 0.13 0.82, 0.11 0.8 C0.1 0.78, 0.08 0.76, 0.07 0.73 C0.05 0.71, 0.04 0.68, 0.03 0.66 C0.02 0.63, 0.01 0.6, 0.01 0.57 C0 0.55, 0 0.52, 0 0.49 C0 0.46, 0 0.43, 0.01 0.4 C0.01 0.38, 0.02 0.35, 0.03 0.32 C0.04 0.3, 0.05 0.27, 0.07 0.24 C0.08 0.22, 0.1 0.2, 0.11 0.17 C0.13 0.15, 0.15 0.13, 0.17 0.11 C0.2 0.1, 0.22 0.08, 0.24 0.07 C0.27 0.05, 0.3 0.04, 0.32 0.03 C0.35 0.02, 0.38 0.01, 0.4 0.01 C0.43 0, 0.46 0, 0.49 0 C0.52 0, 0.55 0, 0.57 0.01 C0.6 0.01, 0.63 0.02, 0.66 0.03 C0.68 0.04, 0.71 0.05, 0.73 0.07 C0.76 0.08, 0.78 0.1, 0.8 0.11 C0.82 0.13, 0.85 0.15, 0.86 0.17 C0.88 0.2, 0.9 0.22, 0.91 0.24 C0.93 0.27, 0.94 0.3, 0.95 0.32 C0.96 0.35, 0.97 0.38, 0.97 0.4 C0.98 0.43, 0.98 0.47, 0.98 0.49 C0.98 0.5, 0.98 0.47, 0.98 0.49" stroke="#E1E1E1" stroke-width="1" fill="none" class="svg-elem-10"></path></g><g stroke-linecap="round"><g transform="translate(35.26942691099339 26.00326107780248) rotate(89.99999999999994 0.7646363632470639 1.3628751720276835)"><path d="M0 0 C0.48 0.85, 0.96 1.71, 1.53 2.73 M0 0 C0.6 1.07, 1.2 2.14, 1.53 2.73" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-11"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(37.69686716478964 24.631291134331402) rotate(89.99999999999994 -5.653950126656127 1.1861594291448263)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.47 0.39, -0.95 0.79, -1.25 1.04 M0 0 C-0.47 0.39, -0.95 0.79, -1.25 1.04 M-1.25 1.04 C-1.65 1.25, -2.05 1.46, -2.64 1.78 M-1.25 1.04 C-1.77 1.31, -2.29 1.59, -2.64 1.78 M-2.64 1.78 C-3.15 1.93, -3.66 2.09, -4.12 2.22 M-2.64 1.78 C-3.01 1.89, -3.38 2, -4.12 2.22 M-4.12 2.22 C-4.66 2.28, -5.19 2.33, -5.65 2.37 M-4.12 2.22 C-4.62 2.27, -5.12 2.32, -5.65 2.37 M-5.65 2.37 C-6.18 2.32, -6.7 2.27, -7.18 2.22 M-5.65 2.37 C-6.02 2.34, -6.38 2.3, -7.18 2.22 M-7.18 2.22 C-7.59 2.1, -8 1.98, -8.67 1.78 M-7.18 2.22 C-7.58 2.1, -7.98 1.98, -8.67 1.78 M-8.67 1.78 C-9.08 1.56, -9.49 1.34, -10.06 1.04 M-8.67 1.78 C-9.06 1.57, -9.45 1.36, -10.06 1.04 M-10.06 1.04 C-10.32 0.82, -10.58 0.6, -11.31 0 M-10.06 1.04 C-10.34 0.8, -10.62 0.57, -11.31 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-12"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(28.474861488989973 33.61396728182177) rotate(89.99999999999994 -0.8557586356387219 -1.5213488535048274)"><path d="M0 0 C-0.45 -0.8, -0.89 -1.59, -1.71 -3.04 M0 0 C-0.62 -1.11, -1.24 -2.21, -1.71 -3.04" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-13"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(28.569945697876847 27.51272487748618) rotate(89.99999999999994 3.177400525180701 -5.649592223210574)"><path d="M0 0 C2.36 -4.19, 4.71 -8.38, 6.35 -11.3 M0 0 C1.79 -3.18, 3.58 -6.36, 6.35 -11.3" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-14"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(37.19092228251793 24.232316270428683) rotate(89.99999999999994 1.584738326095703 1.5847383260956853)"><path d="M3.17 1.58 C3.17 1.68, 3.16 1.77, 3.15 1.86 C3.13 1.95, 3.11 2.04, 3.07 2.13 C3.04 2.21, 3 2.3, 2.96 2.38 C2.91 2.46, 2.86 2.53, 2.8 2.6 C2.74 2.67, 2.67 2.74, 2.6 2.8 C2.53 2.86, 2.46 2.91, 2.38 2.96 C2.3 3, 2.21 3.04, 2.13 3.07 C2.04 3.11, 1.95 3.13, 1.86 3.15 C1.77 3.16, 1.68 3.17, 1.58 3.17 C1.49 3.17, 1.4 3.16, 1.31 3.15 C1.22 3.13, 1.13 3.11, 1.04 3.07 C0.96 3.04, 0.87 3, 0.79 2.96 C0.71 2.91, 0.64 2.86, 0.57 2.8 C0.5 2.74, 0.43 2.67, 0.37 2.6 C0.31 2.53, 0.26 2.46, 0.21 2.38 C0.17 2.3, 0.13 2.21, 0.1 2.13 C0.06 2.04, 0.04 1.95, 0.02 1.86 C0.01 1.77, 0 1.68, 0 1.58 C0 1.49, 0.01 1.4, 0.02 1.31 C0.04 1.22, 0.06 1.13, 0.1 1.04 C0.13 0.96, 0.17 0.87, 0.21 0.79 C0.26 0.71, 0.31 0.64, 0.37 0.57 C0.43 0.5, 0.5 0.43, 0.57 0.37 C0.64 0.31, 0.71 0.26, 0.79 0.21 C0.87 0.17, 0.96 0.13, 1.04 0.1 C1.13 0.06, 1.22 0.04, 1.31 0.02 C1.4 0.01, 1.49 0, 1.58 0 C1.68 0, 1.77 0.01, 1.86 0.02 C1.95 0.04, 2.04 0.06, 2.13 0.1 C2.21 0.13, 2.3 0.17, 2.38 0.21 C2.46 0.26, 2.53 0.31, 2.6 0.37 C2.67 0.43, 2.74 0.5, 2.8 0.57 C2.86 0.64, 2.91 0.71, 2.96 0.79 C3 0.87, 3.04 0.96, 3.07 1.04 C3.11 1.13, 3.13 1.22, 3.15 1.31 C3.16 1.4, 3.17 1.54, 3.17 1.58 C3.17 1.63, 3.17 1.54, 3.17 1.58" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-15"></path><path d="M3.17 1.58 C3.17 1.68, 3.16 1.77, 3.15 1.86 C3.13 1.95, 3.11 2.04, 3.07 2.13 C3.04 2.21, 3 2.3, 2.96 2.38 C2.91 2.46, 2.86 2.53, 2.8 2.6 C2.74 2.67, 2.67 2.74, 2.6 2.8 C2.53 2.86, 2.46 2.91, 2.38 2.96 C2.3 3, 2.21 3.04, 2.13 3.07 C2.04 3.11, 1.95 3.13, 1.86 3.15 C1.77 3.16, 1.68 3.17, 1.58 3.17 C1.49 3.17, 1.4 3.16, 1.31 3.15 C1.22 3.13, 1.13 3.11, 1.04 3.07 C0.96 3.04, 0.87 3, 0.79 2.96 C0.71 2.91, 0.64 2.86, 0.57 2.8 C0.5 2.74, 0.43 2.67, 0.37 2.6 C0.31 2.53, 0.26 2.46, 0.21 2.38 C0.17 2.3, 0.13 2.21, 0.1 2.13 C0.06 2.04, 0.04 1.95, 0.02 1.86 C0.01 1.77, 0 1.68, 0 1.58 C0 1.49, 0.01 1.4, 0.02 1.31 C0.04 1.22, 0.06 1.13, 0.1 1.04 C0.13 0.96, 0.17 0.87, 0.21 0.79 C0.26 0.71, 0.31 0.64, 0.37 0.57 C0.43 0.5, 0.5 0.43, 0.57 0.37 C0.64 0.31, 0.71 0.26, 0.79 0.21 C0.87 0.17, 0.96 0.13, 1.04 0.1 C1.13 0.06, 1.22 0.04, 1.31 0.02 C1.4 0.01, 1.49 0, 1.58 0 C1.68 0, 1.77 0.01, 1.86 0.02 C1.95 0.04, 2.04 0.06, 2.13 0.1 C2.21 0.13, 2.3 0.17, 2.38 0.21 C2.46 0.26, 2.53 0.31, 2.6 0.37 C2.67 0.43, 2.74 0.5, 2.8 0.57 C2.86 0.64, 2.91 0.71, 2.96 0.79 C3 0.87, 3.04 0.96, 3.07 1.04 C3.11 1.13, 3.13 1.22, 3.15 1.31 C3.16 1.4, 3.17 1.54, 3.17 1.58 C3.17 1.63, 3.17 1.54, 3.17 1.58" stroke="#E1E1E1" stroke-width="1" fill="none" class="svg-elem-16"></path></g></svg>
 
      `,
        css: `
            /***************************************************
 * Generated by SVG Artista on 9/1/2025, 5:31:36 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 65.34389114379883px;
  stroke-dasharray: 65.34389114379883px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-2 {
  stroke-dashoffset: 128.68926239013672px;
  stroke-dasharray: 128.68926239013672px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 0;
}

svg .svg-elem-3 {
  stroke-dashoffset: 5.102046251296997px;
  stroke-dasharray: 5.102046251296997px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 0;
  fill: rgb(26, 25, 26);
}

svg .svg-elem-4 {
  stroke-dashoffset: 5.102046251296997px;
  stroke-dasharray: 5.102046251296997px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 0;
}

svg .svg-elem-5 {
  stroke-dashoffset: 5.102046251296997px;
  stroke-dasharray: 5.102046251296997px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 0;
  fill: rgb(26, 25, 26);
}

svg .svg-elem-6 {
  stroke-dashoffset: 5.102046251296997px;
  stroke-dasharray: 5.102046251296997px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 0;
}

svg .svg-elem-7 {
  stroke-dashoffset: 5.102046251296997px;
  stroke-dasharray: 5.102046251296997px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 0;
  fill: rgb(26, 25, 26);
}

svg .svg-elem-8 {
  stroke-dashoffset: 5.102046251296997px;
  stroke-dasharray: 5.102046251296997px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
}

svg.active .svg-elem-8 {
  stroke-dashoffset: 0;
}

svg .svg-elem-9 {
  stroke-dashoffset: 5.102046251296997px;
  stroke-dasharray: 5.102046251296997px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
}

svg.active .svg-elem-9 {
  stroke-dashoffset: 0;
  fill: rgb(26, 25, 26);
}

svg .svg-elem-10 {
  stroke-dashoffset: 5.102046251296997px;
  stroke-dasharray: 5.102046251296997px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
}

svg.active .svg-elem-10 {
  stroke-dashoffset: 0;
}

svg .svg-elem-11 {
  stroke-dashoffset: 8.259012222290039px;
  stroke-dasharray: 8.259012222290039px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
}

svg.active .svg-elem-11 {
  stroke-dashoffset: 0;
}

svg .svg-elem-12 {
  stroke-dashoffset: 27.14788246154785px;
  stroke-dasharray: 27.14788246154785px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
}

svg.active .svg-elem-12 {
  stroke-dashoffset: 0;
}

svg .svg-elem-13 {
  stroke-dashoffset: 8.975879669189453px;
  stroke-dasharray: 8.975879669189453px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
}

svg.active .svg-elem-13 {
  stroke-dashoffset: 0;
}

svg .svg-elem-14 {
  stroke-dashoffset: 27.923931121826172px;
  stroke-dasharray: 27.923931121826172px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
}

svg.active .svg-elem-14 {
  stroke-dashoffset: 0;
}

svg .svg-elem-15 {
  stroke-dashoffset: 12.012979507446289px;
  stroke-dasharray: 12.012979507446289px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
}

svg.active .svg-elem-15 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-16 {
  stroke-dashoffset: 12.012979507446289px;
  stroke-dasharray: 12.012979507446289px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7999999999999998s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7999999999999998s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.3s;
}

svg.active .svg-elem-16 {
  stroke-dashoffset: 0;
}

     `
    },
    {
        name: "Files",
        svg: `
     <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54.07360726563911 53.91165558660353" width="54.0736083984375" height="53.91165542602539" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round"><g transform="translate(35.616410621487375 20.547933785318364) rotate(0 -5.273966892659246 -5.273966892659182)" fill-rule="evenodd"><path d="M0 0 L0 0 L1.07 -0.44 L1.51 -1.51 L1.51 -6.03 L1.51 -6.03 L1.07 -7.09 L0 -7.53 L-3.77 -7.53 L-3.77 -7.53 L-4.44 -7.69 L-4.97 -8.14 L-6.33 -9.95 L-6.33 -9.95 L-6.86 -10.39 L-7.53 -10.55 L-10.55 -10.55 L-10.55 -10.55 L-11.61 -10.11 L-12.05 -9.04 L-12.05 -1.51 L-12.05 -1.51 L-11.61 -0.44 L-10.55 0 L0 0" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-1"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.35 -0.15, 0.71 -0.29, 1.07 -0.44 M0 0 C0.34 -0.14, 0.67 -0.28, 1.07 -0.44 M1.07 -0.44 C1.2 -0.76, 1.33 -1.07, 1.51 -1.51 M1.07 -0.44 C1.23 -0.84, 1.39 -1.23, 1.51 -1.51 M1.51 -1.51 C1.51 -3.31, 1.51 -5.12, 1.51 -6.03 M1.51 -1.51 C1.51 -2.5, 1.51 -3.49, 1.51 -6.03 M1.51 -6.03 C1.51 -6.03, 1.51 -6.03, 1.51 -6.03 M1.51 -6.03 C1.51 -6.03, 1.51 -6.03, 1.51 -6.03 M1.51 -6.03 C1.34 -6.44, 1.17 -6.85, 1.07 -7.09 M1.51 -6.03 C1.4 -6.28, 1.3 -6.53, 1.07 -7.09 M1.07 -7.09 C0.64 -7.27, 0.22 -7.44, 0 -7.53 M1.07 -7.09 C0.83 -7.19, 0.59 -7.29, 0 -7.53 M0 -7.53 C-1.02 -7.53, -2.03 -7.53, -3.77 -7.53 M0 -7.53 C-1.42 -7.53, -2.83 -7.53, -3.77 -7.53 M-3.77 -7.53 C-3.77 -7.53, -3.77 -7.53, -3.77 -7.53 M-3.77 -7.53 C-3.77 -7.53, -3.77 -7.53, -3.77 -7.53 M-3.77 -7.53 C-3.93 -7.57, -4.09 -7.61, -4.44 -7.69 M-3.77 -7.53 C-3.91 -7.57, -4.05 -7.6, -4.44 -7.69 M-4.44 -7.69 C-4.6 -7.83, -4.76 -7.96, -4.97 -8.14 M-4.44 -7.69 C-4.62 -7.84, -4.79 -7.99, -4.97 -8.14 M-4.97 -8.14 C-5.31 -8.59, -5.65 -9.04, -6.33 -9.95 M-4.97 -8.14 C-5.32 -8.6, -5.67 -9.07, -6.33 -9.95 M-6.33 -9.95 C-6.33 -9.95, -6.33 -9.95, -6.33 -9.95 M-6.33 -9.95 C-6.33 -9.95, -6.33 -9.95, -6.33 -9.95 M-6.33 -9.95 C-6.47 -10.07, -6.62 -10.19, -6.86 -10.39 M-6.33 -9.95 C-6.44 -10.04, -6.56 -10.14, -6.86 -10.39 M-6.86 -10.39 C-7.11 -10.45, -7.36 -10.51, -7.53 -10.55 M-6.86 -10.39 C-7.08 -10.44, -7.3 -10.49, -7.53 -10.55 M-7.53 -10.55 C-8.28 -10.55, -9.03 -10.55, -10.55 -10.55 M-7.53 -10.55 C-8.51 -10.55, -9.49 -10.55, -10.55 -10.55 M-10.55 -10.55 C-10.55 -10.55, -10.55 -10.55, -10.55 -10.55 M-10.55 -10.55 C-10.55 -10.55, -10.55 -10.55, -10.55 -10.55 M-10.55 -10.55 C-10.89 -10.41, -11.23 -10.26, -11.61 -10.11 M-10.55 -10.55 C-10.97 -10.37, -11.39 -10.2, -11.61 -10.11 M-11.61 -10.11 C-11.78 -9.7, -11.95 -9.29, -12.05 -9.04 M-11.61 -10.11 C-11.78 -9.71, -11.94 -9.32, -12.05 -9.04 M-12.05 -9.04 C-12.05 -7.36, -12.05 -5.69, -12.05 -1.51 M-12.05 -9.04 C-12.05 -6.13, -12.05 -3.21, -12.05 -1.51 M-12.05 -1.51 C-12.05 -1.51, -12.05 -1.51, -12.05 -1.51 M-12.05 -1.51 C-12.05 -1.51, -12.05 -1.51, -12.05 -1.51 M-12.05 -1.51 C-11.93 -1.22, -11.81 -0.93, -11.61 -0.44 M-12.05 -1.51 C-11.95 -1.26, -11.85 -1.02, -11.61 -0.44 M-11.61 -0.44 C-11.19 -0.27, -10.78 -0.09, -10.55 0 M-11.61 -0.44 C-11.2 -0.27, -10.78 -0.1, -10.55 0 M-10.55 0 C-6.52 0, -2.5 0, 0 0 M-10.55 0 C-8.38 0, -6.21 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-2"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(10 13.01369536723385) rotate(0 3.767119209042221 1.5068476836169111)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.08 0.38, 0.15 0.77, 0.24 1.17 M0 0 C0.08 0.42, 0.17 0.83, 0.24 1.17 M0.24 1.17 C0.47 1.52, 0.71 1.87, 0.88 2.13 M0.24 1.17 C0.45 1.5, 0.67 1.82, 0.88 2.13 M0.88 2.13 C1.14 2.31, 1.41 2.48, 1.84 2.78 M0.88 2.13 C1.24 2.37, 1.59 2.61, 1.84 2.78 M1.84 2.78 C2.17 2.84, 2.5 2.91, 3.01 3.01 M1.84 2.78 C2.27 2.86, 2.7 2.95, 3.01 3.01 M3.01 3.01 C4.46 3.01, 5.91 3.01, 7.53 3.01 M3.01 3.01 C3.96 3.01, 4.91 3.01, 7.53 3.01" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-3"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(10.005427844507722 14.273938548183125) rotate(0 3.767119209042221 11.30135762712682)"><path d="M0 0 C0 7.18, 0 14.37, 0 19.59 M0 0 C0 4.29, 0 8.58, 0 19.59 M0 19.59 C0 19.59, 0 19.59, 0 19.59 M0 19.59 C0 19.59, 0 19.59, 0 19.59 M0 19.59 C0.07 19.92, 0.13 20.26, 0.24 20.76 M0 19.59 C0.09 20.06, 0.19 20.53, 0.24 20.76 M0.24 20.76 C0.4 21.01, 0.56 21.25, 0.88 21.72 M0.24 20.76 C0.41 21.02, 0.59 21.28, 0.88 21.72 M0.88 21.72 C1.14 21.89, 1.4 22.07, 1.84 22.37 M0.88 21.72 C1.1 21.87, 1.32 22.02, 1.84 22.37 M1.84 22.37 C2.26 22.45, 2.67 22.53, 3.01 22.6 M1.84 22.37 C2.14 22.43, 2.43 22.48, 3.01 22.6 M3.01 22.6 C3.97 22.6, 4.93 22.6, 7.53 22.6 M3.01 22.6 C3.98 22.6, 4.96 22.6, 7.53 22.6" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(40.99833456073793 33.66074657026678) rotate(0 0 3.8440908811262773)" fill-rule="evenodd"><path d="M0 0 L0 0 L0.39 0.08 L0.72 0.3 L2.77 2.35 L2.77 2.35 L3 2.68 L3.08 3.08 L3.08 6.66 L3.08 6.66 L2.99 7.06 L2.78 7.39 L2.45 7.61 L2.05 7.69 L-2.05 7.69 L-2.05 7.69 L-2.45 7.61 L-2.78 7.39 L-2.99 7.06 L-3.08 6.66 L-3.08 1.03 L-3.08 1.03 L-2.99 0.63 L-2.78 0.3 L-2.45 0.08 L-2.05 0 L0 0" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-5"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.08 0.02, 0.16 0.03, 0.39 0.08 M0 0 C0.13 0.03, 0.26 0.05, 0.39 0.08 M0.39 0.08 C0.46 0.12, 0.53 0.17, 0.72 0.3 M0.39 0.08 C0.46 0.13, 0.54 0.17, 0.72 0.3 M0.72 0.3 C1.52 1.09, 2.31 1.88, 2.77 2.35 M0.72 0.3 C1.15 0.72, 1.57 1.14, 2.77 2.35 M2.77 2.35 C2.77 2.35, 2.77 2.35, 2.77 2.35 M2.77 2.35 C2.77 2.35, 2.77 2.35, 2.77 2.35 M2.77 2.35 C2.86 2.48, 2.95 2.61, 3 2.68 M2.77 2.35 C2.84 2.45, 2.91 2.55, 3 2.68 M3 2.68 C3.02 2.81, 3.05 2.93, 3.08 3.08 M3 2.68 C3.03 2.84, 3.06 2.99, 3.08 3.08 M3.08 3.08 C3.08 3.84, 3.08 4.6, 3.08 6.66 M3.08 3.08 C3.08 4.22, 3.08 5.36, 3.08 6.66 M3.08 6.66 C3.08 6.66, 3.08 6.66, 3.08 6.66 M3.08 6.66 C3.08 6.66, 3.08 6.66, 3.08 6.66 M3.08 6.66 C3.05 6.81, 3.01 6.96, 2.99 7.06 M3.08 6.66 C3.06 6.74, 3.04 6.83, 2.99 7.06 M2.99 7.06 C2.93 7.16, 2.86 7.26, 2.78 7.39 M2.99 7.06 C2.93 7.15, 2.87 7.24, 2.78 7.39 M2.78 7.39 C2.65 7.47, 2.52 7.56, 2.45 7.61 M2.78 7.39 C2.66 7.46, 2.55 7.54, 2.45 7.61 M2.45 7.61 C2.33 7.63, 2.22 7.65, 2.05 7.69 M2.45 7.61 C2.32 7.63, 2.19 7.66, 2.05 7.69 M2.05 7.69 C0.73 7.69, -0.59 7.69, -2.05 7.69 M2.05 7.69 C0.67 7.69, -0.71 7.69, -2.05 7.69 M-2.05 7.69 C-2.05 7.69, -2.05 7.69, -2.05 7.69 M-2.05 7.69 C-2.05 7.69, -2.05 7.69, -2.05 7.69 M-2.05 7.69 C-2.13 7.67, -2.21 7.66, -2.45 7.61 M-2.05 7.69 C-2.15 7.67, -2.25 7.65, -2.45 7.61 M-2.45 7.61 C-2.57 7.52, -2.7 7.44, -2.78 7.39 M-2.45 7.61 C-2.53 7.55, -2.61 7.5, -2.78 7.39 M-2.78 7.39 C-2.82 7.32, -2.87 7.25, -2.99 7.06 M-2.78 7.39 C-2.86 7.26, -2.95 7.14, -2.99 7.06 M-2.99 7.06 C-3.02 6.95, -3.04 6.84, -3.08 6.66 M-2.99 7.06 C-3.02 6.94, -3.04 6.82, -3.08 6.66 M-3.08 6.66 C-3.08 4.81, -3.08 2.96, -3.08 1.03 M-3.08 6.66 C-3.08 5.18, -3.08 3.7, -3.08 1.03 M-3.08 1.03 C-3.08 1.03, -3.08 1.03, -3.08 1.03 M-3.08 1.03 C-3.08 1.03, -3.08 1.03, -3.08 1.03 M-3.08 1.03 C-3.06 0.93, -3.04 0.83, -2.99 0.63 M-3.08 1.03 C-3.06 0.93, -3.04 0.83, -2.99 0.63 M-2.99 0.63 C-2.92 0.52, -2.85 0.42, -2.78 0.3 M-2.99 0.63 C-2.92 0.51, -2.84 0.4, -2.78 0.3 M-2.78 0.3 C-2.69 0.24, -2.61 0.19, -2.45 0.08 M-2.78 0.3 C-2.66 0.22, -2.55 0.15, -2.45 0.08 M-2.45 0.08 C-2.36 0.06, -2.26 0.04, -2.05 0 M-2.45 0.08 C-2.31 0.05, -2.18 0.03, -2.05 0 M-2.05 0 C-1.24 0, -0.44 0, 0 0 M-2.05 0 C-1.61 0, -1.17 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0" stroke="#E1E1E1" stroke-width="0.8" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(40.99833456073793 33.66074657026678) rotate(0 1.5376363524505905 1.5376363524505123)" fill-rule="evenodd"><path d="M0 0 L0 2.05 L0 2.05 L0.08 2.45 L0.3 2.78 L0.63 2.99 L1.03 3.08 L3.08 3.08" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-7"></path><path d="M0 0 C0 0.71, 0 1.42, 0 2.05 M0 0 C0 0.61, 0 1.21, 0 2.05 M0 2.05 C0 2.05, 0 2.05, 0 2.05 M0 2.05 C0 2.05, 0 2.05, 0 2.05 M0 2.05 C0.02 2.14, 0.04 2.23, 0.08 2.45 M0 2.05 C0.02 2.16, 0.04 2.26, 0.08 2.45 M0.08 2.45 C0.13 2.53, 0.19 2.6, 0.3 2.78 M0.08 2.45 C0.13 2.52, 0.18 2.6, 0.3 2.78 M0.3 2.78 C0.42 2.86, 0.54 2.94, 0.63 2.99 M0.3 2.78 C0.42 2.85, 0.53 2.93, 0.63 2.99 M0.63 2.99 C0.77 3.02, 0.91 3.05, 1.03 3.08 M0.63 2.99 C0.72 3.01, 0.82 3.03, 1.03 3.08 M1.03 3.08 C1.81 3.08, 2.6 3.08, 3.08 3.08 M1.03 3.08 C1.74 3.08, 2.46 3.08, 3.08 3.08 M3.08 3.08 C1.91 1.91, 0.75 0.75, 0 0 M3.08 3.08 C1.91 1.91, 0.74 0.74, 0 0" stroke="#E1E1E1" stroke-width="0.8" fill="none" class="svg-elem-8"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(35.8728800525696 36.223473824350975) rotate(0 1.9815008027974272 3.8440908811262773)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.15 0.03, -0.29 0.06, -0.4 0.08 M0 0 C-0.15 0.03, -0.3 0.06, -0.4 0.08 M-0.4 0.08 C-0.5 0.15, -0.6 0.22, -0.72 0.3 M-0.4 0.08 C-0.51 0.16, -0.63 0.23, -0.72 0.3 M-0.72 0.3 C-0.79 0.4, -0.85 0.49, -0.94 0.63 M-0.72 0.3 C-0.78 0.38, -0.83 0.46, -0.94 0.63 M-0.94 0.63 C-0.96 0.71, -0.98 0.79, -1.03 1.03 M-0.94 0.63 C-0.97 0.76, -1 0.89, -1.03 1.03 M-1.03 1.03 C-1.03 2.69, -1.03 4.35, -1.03 6.66 M-1.03 1.03 C-1.03 2.9, -1.03 4.77, -1.03 6.66 M-1.03 6.66 C-1.03 6.66, -1.03 6.66, -1.03 6.66 M-1.03 6.66 C-1.03 6.66, -1.03 6.66, -1.03 6.66 M-1.03 6.66 C-1.01 6.75, -0.99 6.84, -0.94 7.06 M-1.03 6.66 C-1 6.81, -0.97 6.96, -0.94 7.06 M-0.94 7.06 C-0.86 7.19, -0.77 7.32, -0.72 7.39 M-0.94 7.06 C-0.9 7.13, -0.85 7.2, -0.72 7.39 M-0.72 7.39 C-0.64 7.45, -0.55 7.51, -0.4 7.61 M-0.72 7.39 C-0.62 7.46, -0.51 7.53, -0.4 7.61 M-0.4 7.61 C-0.28 7.63, -0.15 7.66, 0 7.69 M-0.4 7.61 C-0.3 7.63, -0.2 7.65, 0 7.69 M0 7.69 C0.98 7.69, 1.96 7.69, 4.1 7.69 M0 7.69 C0.95 7.69, 1.9 7.69, 4.1 7.69 M4.1 7.69 C4.1 7.69, 4.1 7.69, 4.1 7.69 M4.1 7.69 C4.1 7.69, 4.1 7.69, 4.1 7.69 M4.1 7.69 C4.23 7.65, 4.35 7.62, 4.61 7.55 M4.1 7.69 C4.26 7.64, 4.43 7.6, 4.61 7.55 M4.61 7.55 C4.7 7.47, 4.78 7.38, 4.99 7.18 M4.61 7.55 C4.73 7.43, 4.85 7.32, 4.99 7.18" stroke="#E1E1E1" stroke-width="0.8" fill="none" class="svg-elem-9"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(31.681415929421746 42.0218441492966) rotate(0 1.9932028002122024 -8.471111900902251)"><path d="M0 0 C-1.69 0, -3.37 0, -5.98 0 M0 0 C-1.31 0, -2.62 0, -5.98 0 M-5.98 0 C-5.98 0, -5.98 0, -5.98 0 M-5.98 0 C-5.98 0, -5.98 0, -5.98 0 M-5.98 0 C-6.28 -0.06, -6.58 -0.12, -6.76 -0.16 M-5.98 0 C-6.16 -0.04, -6.33 -0.07, -6.76 -0.16 M-6.76 -0.16 C-7.01 -0.33, -7.26 -0.49, -7.39 -0.58 M-6.76 -0.16 C-6.92 -0.27, -7.08 -0.37, -7.39 -0.58 M-7.39 -0.58 C-7.55 -0.83, -7.72 -1.07, -7.82 -1.22 M-7.39 -0.58 C-7.48 -0.72, -7.57 -0.85, -7.82 -1.22 M-7.82 -1.22 C-7.87 -1.47, -7.92 -1.72, -7.97 -1.99 M-7.82 -1.22 C-7.87 -1.51, -7.93 -1.8, -7.97 -1.99 M-7.97 -1.99 C-7.97 -6.04, -7.97 -10.09, -7.97 -14.95 M-7.97 -1.99 C-7.97 -6.15, -7.97 -10.31, -7.97 -14.95 M-7.97 -14.95 C-7.97 -14.95, -7.97 -14.95, -7.97 -14.95 M-7.97 -14.95 C-7.97 -14.95, -7.97 -14.95, -7.97 -14.95 M-7.97 -14.95 C-7.92 -15.23, -7.86 -15.51, -7.82 -15.72 M-7.97 -14.95 C-7.92 -15.22, -7.87 -15.48, -7.82 -15.72 M-7.82 -15.72 C-7.69 -15.92, -7.56 -16.11, -7.39 -16.36 M-7.82 -15.72 C-7.69 -15.91, -7.57 -16.09, -7.39 -16.36 M-7.39 -16.36 C-7.2 -16.49, -7.01 -16.62, -6.76 -16.79 M-7.39 -16.36 C-7.2 -16.49, -7.01 -16.62, -6.76 -16.79 M-6.76 -16.79 C-6.54 -16.83, -6.33 -16.87, -5.98 -16.94 M-6.76 -16.79 C-6.5 -16.84, -6.24 -16.89, -5.98 -16.94 M-5.98 -16.94 C-5.02 -16.94, -4.07 -16.94, -2.09 -16.94 M-5.98 -16.94 C-4.97 -16.94, -3.96 -16.94, -2.09 -16.94 M-2.09 -16.94 C-2.09 -16.94, -2.09 -16.94, -2.09 -16.94 M-2.09 -16.94 C-2.09 -16.94, -2.09 -16.94, -2.09 -16.94 M-2.09 -16.94 C-1.82 -16.88, -1.55 -16.81, -1.14 -16.71 M-2.09 -16.94 C-1.79 -16.87, -1.49 -16.8, -1.14 -16.71 M-1.14 -16.71 C-0.99 -16.57, -0.84 -16.44, -0.41 -16.05 M-1.14 -16.71 C-0.86 -16.45, -0.58 -16.2, -0.41 -16.05 M-0.41 -16.05 C-0.19 -15.73, 0.02 -15.41, 0.4 -14.85 M-0.41 -16.05 C-0.25 -15.81, -0.09 -15.57, 0.4 -14.85 M0.4 -14.85 C0.4 -14.85, 0.4 -14.85, 0.4 -14.85 M0.4 -14.85 C0.4 -14.85, 0.4 -14.85, 0.4 -14.85 M0.4 -14.85 C0.69 -14.59, 0.97 -14.32, 1.12 -14.19 M0.4 -14.85 C0.61 -14.66, 0.82 -14.46, 1.12 -14.19 M1.12 -14.19 C1.4 -14.12, 1.69 -14.05, 2.06 -13.95 M1.12 -14.19 C1.34 -14.13, 1.57 -14.08, 2.06 -13.95 M2.06 -13.95 C4.1 -13.95, 6.14 -13.95, 9.97 -13.95 M2.06 -13.95 C3.71 -13.95, 5.35 -13.95, 9.97 -13.95 M9.97 -13.95 C9.97 -13.95, 9.97 -13.95, 9.97 -13.95 M9.97 -13.95 C9.97 -13.95, 9.97 -13.95, 9.97 -13.95 M9.97 -13.95 C10.26 -13.89, 10.55 -13.83, 10.74 -13.8 M9.97 -13.95 C10.27 -13.89, 10.57 -13.83, 10.74 -13.8 M10.74 -13.8 C10.96 -13.65, 11.18 -13.5, 11.38 -13.37 M10.74 -13.8 C10.99 -13.63, 11.23 -13.47, 11.38 -13.37 M11.38 -13.37 C11.48 -13.21, 11.59 -13.05, 11.8 -12.74 M11.38 -13.37 C11.51 -13.16, 11.65 -12.96, 11.8 -12.74 M11.8 -12.74 C11.86 -12.46, 11.91 -12.19, 11.96 -11.96 M11.8 -12.74 C11.86 -12.47, 11.91 -12.21, 11.96 -11.96 M11.96 -11.96 C11.96 -11.09, 11.96 -10.23, 11.96 -9.47 M11.96 -11.96 C11.96 -11.11, 11.96 -10.27, 11.96 -9.47" stroke="#E1E1E1" stroke-width="1.8" fill="none" class="svg-elem-10"></path></g></g><mask></mask></svg>
      `,
        css: `
                    /***************************************************
                 * Generated by SVG Artista on 9/1/2025, 4:24:41 PM
                 * MIT license (https://opensource.org/licenses/MIT)
                 * W. https://svgartista.net
                 **************************************************/

                svg .svg-elem-1 {
                stroke-dashoffset: 91.28709411621094px;
                stroke-dasharray: 45.64354705810547px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
                }

                svg.active .svg-elem-1 {
                stroke-dashoffset: 45.64354705810547px;
                fill: transparent;
                }

                svg .svg-elem-2 {
                stroke-dashoffset: 178.5748748779297px;
                stroke-dasharray: 89.28743743896484px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
                }

                svg.active .svg-elem-2 {
                stroke-dashoffset: 89.28743743896484px;
                fill: transparent;
                }

                svg .svg-elem-3 {
                stroke-dashoffset: 40.87983322143555px;
                stroke-dasharray: 20.439916610717773px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
                }

                svg.active .svg-elem-3 {
                stroke-dashoffset: 20.439916610717773px;
                fill: transparent;
                }

                svg .svg-elem-4 {
                stroke-dashoffset: 119.23982238769531px;
                stroke-dasharray: 59.619911193847656px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
                }

                svg.active .svg-elem-4 {
                stroke-dashoffset: 59.619911193847656px;
                fill: transparent;
                }

                svg .svg-elem-5 {
                stroke-dashoffset: 53.3621711730957px;
                stroke-dasharray: 26.68108558654785px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
                }

                svg.active .svg-elem-5 {
                stroke-dashoffset: 26.68108558654785px;
                fill: transparent;
                }

                svg .svg-elem-6 {
                stroke-dashoffset: 102.72743225097656px;
                stroke-dasharray: 51.36371612548828px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
                }

                svg.active .svg-elem-6 {
                stroke-dashoffset: 51.36371612548828px;
                fill: transparent;
                }

                svg .svg-elem-7 {
                stroke-dashoffset: 15.411367416381836px;
                stroke-dasharray: 7.705683708190918px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
                }

                svg.active .svg-elem-7 {
                stroke-dashoffset: 7.705683708190918px;
                fill: transparent;
                }

                svg .svg-elem-8 {
                stroke-dashoffset: 44.24647521972656px;
                stroke-dasharray: 22.12323760986328px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
                }

                svg.active .svg-elem-8 {
                stroke-dashoffset: 22.12323760986328px;
                fill: transparent;
                }

                svg .svg-elem-9 {
                stroke-dashoffset: 59.98133850097656px;
                stroke-dasharray: 29.99066925048828px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
                }

                svg.active .svg-elem-9 {
                stroke-dashoffset: 29.99066925048828px;
                fill: transparent;
                }

                svg .svg-elem-10 {
                stroke-dashoffset: 195.6678009033203px;
                stroke-dasharray: 97.83390045166016px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
                }

                svg.active .svg-elem-10 {
                stroke-dashoffset: 97.83390045166016px;
                fill: transparent;
                }

    
     `
    },
    {
        name: "Layers",
        svg: `
     <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51.904177953128055 51.9041779531275" width="51.904178619384766" height="51.904178619384766" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round"><g transform="translate(27.249566227681044 15.791853746858296) rotate(0 -0.8310853121142827 4.885161997425033)" fill-rule="evenodd"><path d="M0 0 L0 0 L-0.84 -0.18 L-1.68 0 L-10.37 3.95 L-10.37 3.95 L-10.79 4.29 L-10.97 4.77 L-10.89 5.28 L-10.56 5.7 L-10.37 5.81 L-1.67 9.77 L-1.67 9.77 L-0.83 9.95 L0.01 9.77 L8.71 5.82 L8.71 5.82 L9.13 5.48 L9.3 5 L9.23 4.5 L8.9 4.07 L8.71 3.96 L0 0" stroke="none" stroke-width="0" fill="black" fill-rule="evenodd" class="svg-elem-1"></path><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.25 -0.05, -0.5 -0.11, -0.84 -0.18 M0 0 C-0.31 -0.07, -0.62 -0.13, -0.84 -0.18 M-0.84 -0.18 C-1.02 -0.14, -1.19 -0.11, -1.68 0 M-0.84 -0.18 C-1.06 -0.13, -1.29 -0.09, -1.68 0 M-1.68 0 C-4.57 1.32, -7.47 2.63, -10.37 3.95 M-1.68 0 C-3.82 0.97, -5.96 1.95, -10.37 3.95 M-10.37 3.95 C-10.37 3.95, -10.37 3.95, -10.37 3.95 M-10.37 3.95 C-10.37 3.95, -10.37 3.95, -10.37 3.95 M-10.37 3.95 C-10.51 4.07, -10.66 4.19, -10.79 4.29 M-10.37 3.95 C-10.48 4.05, -10.6 4.14, -10.79 4.29 M-10.79 4.29 C-10.85 4.45, -10.91 4.61, -10.97 4.77 M-10.79 4.29 C-10.84 4.42, -10.89 4.55, -10.97 4.77 M-10.97 4.77 C-10.95 4.91, -10.93 5.06, -10.89 5.28 M-10.97 4.77 C-10.95 4.92, -10.92 5.07, -10.89 5.28 M-10.89 5.28 C-10.78 5.42, -10.66 5.57, -10.56 5.7 M-10.89 5.28 C-10.78 5.42, -10.66 5.57, -10.56 5.7 M-10.56 5.7 C-10.49 5.74, -10.42 5.78, -10.37 5.81 M-10.56 5.7 C-10.49 5.74, -10.43 5.77, -10.37 5.81 M-10.37 5.81 C-7.14 7.28, -3.91 8.75, -1.67 9.77 M-10.37 5.81 C-8.15 6.82, -5.93 7.83, -1.67 9.77 M-1.67 9.77 C-1.67 9.77, -1.67 9.77, -1.67 9.77 M-1.67 9.77 C-1.67 9.77, -1.67 9.77, -1.67 9.77 M-1.67 9.77 C-1.49 9.81, -1.3 9.85, -0.83 9.95 M-1.67 9.77 C-1.36 9.84, -1.05 9.91, -0.83 9.95 M-0.83 9.95 C-0.6 9.9, -0.37 9.85, 0.01 9.77 M-0.83 9.95 C-0.51 9.88, -0.19 9.81, 0.01 9.77 M0.01 9.77 C2.49 8.64, 4.97 7.52, 8.71 5.82 M0.01 9.77 C3.32 8.27, 6.63 6.76, 8.71 5.82 M8.71 5.82 C8.71 5.82, 8.71 5.82, 8.71 5.82 M8.71 5.82 C8.71 5.82, 8.71 5.82, 8.71 5.82 M8.71 5.82 C8.83 5.71, 8.96 5.61, 9.13 5.48 M8.71 5.82 C8.82 5.73, 8.92 5.64, 9.13 5.48 M9.13 5.48 C9.19 5.31, 9.25 5.14, 9.3 5 M9.13 5.48 C9.17 5.36, 9.21 5.25, 9.3 5 M9.3 5 C9.28 4.81, 9.25 4.61, 9.23 4.5 M9.3 5 C9.29 4.86, 9.27 4.73, 9.23 4.5 M9.23 4.5 C9.11 4.34, 8.99 4.19, 8.9 4.07 M9.23 4.5 C9.12 4.35, 9.01 4.21, 8.9 4.07 M8.9 4.07 C8.82 4.03, 8.75 3.99, 8.71 3.96 M8.9 4.07 C8.83 4.03, 8.76 3.99, 8.71 3.96 M8.71 3.96 C6.73 3.06, 4.75 2.16, 0 0 M8.71 3.96 C6.68 3.04, 4.66 2.12, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0" stroke="#E1E1E1" stroke-width="1.7" fill="none" class="svg-elem-2"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(16.273154988017723 25.74461075517575) rotate(0 10.135190505068294 2.532827192911087)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.04 0.14, 0.08 0.27, 0.16 0.55 M0 0 C0.06 0.2, 0.12 0.41, 0.16 0.55 M0.16 0.55 C0.3 0.67, 0.44 0.8, 0.59 0.92 M0.16 0.55 C0.26 0.63, 0.36 0.72, 0.59 0.92 M0.59 0.92 C2.46 1.77, 4.33 2.62, 9.3 4.89 M0.59 0.92 C2.33 1.72, 4.08 2.51, 9.3 4.89 M9.3 4.89 C9.3 4.89, 9.3 4.89, 9.3 4.89 M9.3 4.89 C9.3 4.89, 9.3 4.89, 9.3 4.89 M9.3 4.89 C9.58 4.94, 9.85 5, 10.14 5.07 M9.3 4.89 C9.57 4.94, 9.83 5, 10.14 5.07 M10.14 5.07 C10.32 5.03, 10.5 4.99, 10.98 4.89 M10.14 5.07 C10.35 5.02, 10.55 4.98, 10.98 4.89 M10.98 4.89 C13.42 3.78, 15.85 2.67, 19.67 0.93 M10.98 4.89 C14.44 3.31, 17.9 1.74, 19.67 0.93 M19.67 0.93 C19.67 0.93, 19.67 0.93, 19.67 0.93 M19.67 0.93 C19.67 0.93, 19.67 0.93, 19.67 0.93 M19.67 0.93 C19.78 0.84, 19.89 0.74, 20.11 0.56 M19.67 0.93 C19.84 0.78, 20.02 0.64, 20.11 0.56 M20.11 0.56 C20.16 0.38, 20.21 0.21, 20.27 0 M20.11 0.56 C20.14 0.44, 20.18 0.33, 20.27 0" stroke="#E1E1E1" stroke-width="1.7" fill="none" class="svg-elem-3"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(16.273154988017723 30.812206007709936) rotate(0 10.135190505068294 2.5328271929110873)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0.05 0.17, 0.1 0.35, 0.16 0.55 M0 0 C0.05 0.16, 0.09 0.32, 0.16 0.55 M0.16 0.55 C0.32 0.69, 0.48 0.82, 0.59 0.92 M0.16 0.55 C0.33 0.7, 0.5 0.85, 0.59 0.92 M0.59 0.92 C2.5 1.79, 4.4 2.66, 9.3 4.89 M0.59 0.92 C2.42 1.75, 4.25 2.59, 9.3 4.89 M9.3 4.89 C9.3 4.89, 9.3 4.89, 9.3 4.89 M9.3 4.89 C9.3 4.89, 9.3 4.89, 9.3 4.89 M9.3 4.89 C9.5 4.93, 9.7 4.97, 10.14 5.07 M9.3 4.89 C9.63 4.96, 9.97 5.03, 10.14 5.07 M10.14 5.07 C10.33 5.03, 10.51 4.99, 10.98 4.89 M10.14 5.07 C10.37 5.02, 10.59 4.97, 10.98 4.89 M10.98 4.89 C14.25 3.4, 17.51 1.91, 19.67 0.93 M10.98 4.89 C13.68 3.66, 16.39 2.43, 19.67 0.93 M19.67 0.93 C19.67 0.93, 19.67 0.93, 19.67 0.93 M19.67 0.93 C19.67 0.93, 19.67 0.93, 19.67 0.93 M19.67 0.93 C19.76 0.85, 19.85 0.78, 20.11 0.56 M19.67 0.93 C19.81 0.82, 19.94 0.7, 20.11 0.56 M20.11 0.56 C20.16 0.37, 20.22 0.19, 20.27 0 M20.11 0.56 C20.15 0.42, 20.19 0.28, 20.27 0" stroke="#E1E1E1" stroke-width="1.7" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(10 17.089817322917227) rotate(0 3.5449086614585212 -3.54490866145861)"><path d="M0 0 C0 -0.87, 0 -1.74, 0 -3.54 M0 0 C0 -0.81, 0 -1.62, 0 -3.54 M0 -3.54 C0 -3.54, 0 -3.54, 0 -3.54 M0 -3.54 C0 -3.54, 0 -3.54, 0 -3.54 M0 -3.54 C0.07 -3.9, 0.14 -4.25, 0.28 -4.92 M0 -3.54 C0.08 -3.92, 0.15 -4.29, 0.28 -4.92 M0.28 -4.92 C0.48 -5.23, 0.69 -5.53, 1.04 -6.05 M0.28 -4.92 C0.45 -5.18, 0.63 -5.44, 1.04 -6.05 M1.04 -6.05 C1.44 -6.32, 1.84 -6.59, 2.17 -6.81 M1.04 -6.05 C1.32 -6.24, 1.6 -6.43, 2.17 -6.81 M2.17 -6.81 C2.46 -6.87, 2.75 -6.93, 3.54 -7.09 M2.17 -6.81 C2.46 -6.87, 2.76 -6.93, 3.54 -7.09 M3.54 -7.09 C4.93 -7.09, 6.32 -7.09, 7.09 -7.09 M3.54 -7.09 C4.42 -7.09, 5.29 -7.09, 7.09 -7.09" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-5"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(34.81436063021101 10) rotate(0 3.5449086614585212 3.54490866145861)"><path d="M0 0 C1.28 0, 2.56 0, 3.54 0 M0 0 C1.09 0, 2.18 0, 3.54 0 M3.54 0 C3.54 0, 3.54 0, 3.54 0 M3.54 0 C3.54 0, 3.54 0, 3.54 0 M3.54 0 C3.89 0.07, 4.24 0.14, 4.92 0.28 M3.54 0 C3.83 0.06, 4.11 0.11, 4.92 0.28 M4.92 0.28 C5.37 0.58, 5.82 0.88, 6.05 1.04 M4.92 0.28 C5.25 0.5, 5.57 0.71, 6.05 1.04 M6.05 1.04 C6.33 1.45, 6.61 1.86, 6.81 2.17 M6.05 1.04 C6.32 1.43, 6.58 1.82, 6.81 2.17 M6.81 2.17 C6.88 2.52, 6.95 2.88, 7.09 3.54 M6.81 2.17 C6.87 2.47, 6.93 2.77, 7.09 3.54 M7.09 3.54 C7.09 4.85, 7.09 6.16, 7.09 7.09 M7.09 3.54 C7.09 4.64, 7.09 5.73, 7.09 7.09" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(41.90417795312669 34.814360630210075) rotate(0 -3.5449086614585212 3.54490866145861)"><path d="M0 0 C0 1.06, 0 2.12, 0 3.54 M0 0 C0 1.3, 0 2.6, 0 3.54 M0 3.54 C0 3.54, 0 3.54, 0 3.54 M0 3.54 C0 3.54, 0 3.54, 0 3.54 M0 3.54 C-0.09 4, -0.19 4.46, -0.28 4.92 M0 3.54 C-0.07 3.88, -0.14 4.22, -0.28 4.92 M-0.28 4.92 C-0.47 5.21, -0.66 5.5, -1.04 6.05 M-0.28 4.92 C-0.52 5.28, -0.76 5.63, -1.04 6.05 M-1.04 6.05 C-1.43 6.31, -1.81 6.57, -2.17 6.81 M-1.04 6.05 C-1.35 6.26, -1.66 6.47, -2.17 6.81 M-2.17 6.81 C-2.62 6.9, -3.08 7, -3.54 7.09 M-2.17 6.81 C-2.54 6.89, -2.92 6.96, -3.54 7.09 M-3.54 7.09 C-4.55 7.09, -5.55 7.09, -7.09 7.09 M-3.54 7.09 C-4.61 7.09, -5.68 7.09, -7.09 7.09" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-7"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(17.089817322917042 41.9041779531275) rotate(0 -3.5449086614585212 -3.54490866145861)"><path d="M0 0 C-0.89 0, -1.78 0, -3.54 0 M0 0 C-1.33 0, -2.65 0, -3.54 0 M-3.54 0 C-3.54 0, -3.54 0, -3.54 0 M-3.54 0 C-3.54 0, -3.54 0, -3.54 0 M-3.54 0 C-3.84 -0.06, -4.14 -0.12, -4.92 -0.28 M-3.54 0 C-3.82 -0.06, -4.1 -0.11, -4.92 -0.28 M-4.92 -0.28 C-5.32 -0.54, -5.71 -0.81, -6.05 -1.04 M-4.92 -0.28 C-5.16 -0.44, -5.4 -0.6, -6.05 -1.04 M-6.05 -1.04 C-6.3 -1.41, -6.55 -1.78, -6.81 -2.17 M-6.05 -1.04 C-6.29 -1.39, -6.53 -1.75, -6.81 -2.17 M-6.81 -2.17 C-6.87 -2.46, -6.93 -2.76, -7.09 -3.54 M-6.81 -2.17 C-6.88 -2.51, -6.95 -2.85, -7.09 -3.54 M-7.09 -3.54 C-7.09 -4.54, -7.09 -5.53, -7.09 -7.09 M-7.09 -3.54 C-7.09 -4.96, -7.09 -6.37, -7.09 -7.09" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-8"></path></g></g><mask></mask></svg>
        `,
        css: `
               /***************************************************
 * Generated by SVG Artista on 9/1/2025, 6:03:10 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 48.30236053466797px;
  stroke-dasharray: 48.30236053466797px;
  fill: transparent;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 0;
  fill: rgb(0, 0, 0);
}

svg .svg-elem-2 {
  stroke-dashoffset: 94.60604095458984px;
  stroke-dasharray: 94.60604095458984px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 0;
}

svg .svg-elem-3 {
  stroke-dashoffset: 48.275123596191406px;
  stroke-dasharray: 48.275123596191406px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 0;
}

svg .svg-elem-4 {
  stroke-dashoffset: 48.27494812011719px;
  stroke-dasharray: 48.27494812011719px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 0;
}

svg .svg-elem-5 {
  stroke-dashoffset: 27.240142822265625px;
  stroke-dasharray: 27.240142822265625px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 0;
}

svg .svg-elem-6 {
  stroke-dashoffset: 27.240211486816406px;
  stroke-dasharray: 27.240211486816406px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 0;
}

svg .svg-elem-7 {
  stroke-dashoffset: 27.240158081054688px;
  stroke-dasharray: 27.240158081054688px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 0;
}

svg .svg-elem-8 {
  stroke-dashoffset: 27.240135192871094px;
  stroke-dasharray: 27.240135192871094px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
}

svg.active .svg-elem-8 {
  stroke-dashoffset: 0;
}

     `
    },
    {
        name: "Resources",
        svg: `
     <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.4846431733763 59.066869531412024" width="53.484642028808594" height="59.06686782836914" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round"><g transform="translate(35.24391273674473 20.300913045788917) rotate(0 4.1203652183155555 -5.1504565228944585)"><path d="M0 0 C0 -2.37, 0 -4.73, 0 -8.93 M0 0 C0 -2.36, 0 -4.72, 0 -8.93 M0 -8.93 C3.18 -9.46, 6.35 -9.99, 8.24 -10.3 M0 -8.93 C3.06 -9.44, 6.11 -9.95, 8.24 -10.3 M8.24 -10.3 C8.24 -7.79, 8.24 -5.27, 8.24 -1.37 M8.24 -10.3 C8.24 -7.34, 8.24 -4.37, 8.24 -1.37" stroke="#E1E1E1" stroke-width="1.2" fill="none" class="svg-elem-1"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(31.123547518429405 18.24073043663111) rotate(0 2.0601826091578914 2.060182609157785)"><path d="M4.12 2.06 C4.12 2.18, 4.11 2.3, 4.09 2.42 C4.07 2.54, 4.04 2.65, 4 2.76 C3.96 2.88, 3.9 2.99, 3.84 3.09 C3.78 3.19, 3.72 3.29, 3.64 3.38 C3.56 3.48, 3.48 3.56, 3.38 3.64 C3.29 3.72, 3.19 3.78, 3.09 3.84 C2.99 3.9, 2.88 3.96, 2.76 4 C2.65 4.04, 2.54 4.07, 2.42 4.09 C2.3 4.11, 2.18 4.12, 2.06 4.12 C1.94 4.12, 1.82 4.11, 1.7 4.09 C1.58 4.07, 1.47 4.04, 1.36 4 C1.24 3.96, 1.13 3.9, 1.03 3.84 C0.93 3.78, 0.83 3.72, 0.74 3.64 C0.64 3.56, 0.56 3.48, 0.48 3.38 C0.41 3.29, 0.34 3.19, 0.28 3.09 C0.22 2.99, 0.17 2.88, 0.12 2.76 C0.08 2.65, 0.05 2.54, 0.03 2.42 C0.01 2.3, 0 2.18, 0 2.06 C0 1.94, 0.01 1.82, 0.03 1.7 C0.05 1.58, 0.08 1.47, 0.12 1.36 C0.17 1.24, 0.22 1.13, 0.28 1.03 C0.34 0.93, 0.41 0.83, 0.48 0.74 C0.56 0.64, 0.64 0.56, 0.74 0.48 C0.83 0.41, 0.93 0.34, 1.03 0.28 C1.13 0.22, 1.24 0.17, 1.36 0.12 C1.47 0.08, 1.58 0.05, 1.7 0.03 C1.82 0.01, 1.94 0, 2.06 0 C2.18 0, 2.3 0.01, 2.42 0.03 C2.54 0.05, 2.65 0.08, 2.76 0.12 C2.88 0.17, 2.99 0.22, 3.09 0.28 C3.19 0.34, 3.29 0.41, 3.38 0.48 C3.48 0.56, 3.56 0.64, 3.64 0.74 C3.72 0.83, 3.78 0.93, 3.84 1.03 C3.9 1.13, 3.96 1.24, 4 1.36 C4.04 1.47, 4.07 1.58, 4.09 1.7 C4.11 1.82, 4.12 2, 4.12 2.06 C4.13 2.12, 4.13 2, 4.12 2.06" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-2"></path><path d="M4.12 2.06 C4.12 2.18, 4.11 2.3, 4.09 2.42 C4.07 2.54, 4.04 2.65, 4 2.76 C3.96 2.88, 3.9 2.99, 3.84 3.09 C3.78 3.19, 3.72 3.29, 3.64 3.38 C3.56 3.48, 3.48 3.56, 3.38 3.64 C3.29 3.72, 3.19 3.78, 3.09 3.84 C2.99 3.9, 2.88 3.96, 2.76 4 C2.65 4.04, 2.54 4.07, 2.42 4.09 C2.3 4.11, 2.18 4.12, 2.06 4.12 C1.94 4.12, 1.82 4.11, 1.7 4.09 C1.58 4.07, 1.47 4.04, 1.36 4 C1.24 3.96, 1.13 3.9, 1.03 3.84 C0.93 3.78, 0.83 3.72, 0.74 3.64 C0.64 3.56, 0.56 3.48, 0.48 3.38 C0.41 3.29, 0.34 3.19, 0.28 3.09 C0.22 2.99, 0.17 2.88, 0.12 2.76 C0.08 2.65, 0.05 2.54, 0.03 2.42 C0.01 2.3, 0 2.18, 0 2.06 C0 1.94, 0.01 1.82, 0.03 1.7 C0.05 1.58, 0.08 1.47, 0.12 1.36 C0.17 1.24, 0.22 1.13, 0.28 1.03 C0.34 0.93, 0.41 0.83, 0.48 0.74 C0.56 0.64, 0.64 0.56, 0.74 0.48 C0.83 0.41, 0.93 0.34, 1.03 0.28 C1.13 0.22, 1.24 0.17, 1.36 0.12 C1.47 0.08, 1.58 0.05, 1.7 0.03 C1.82 0.01, 1.94 0, 2.06 0 C2.18 0, 2.3 0.01, 2.42 0.03 C2.54 0.05, 2.65 0.08, 2.76 0.12 C2.88 0.17, 2.99 0.22, 3.09 0.28 C3.19 0.34, 3.29 0.41, 3.38 0.48 C3.48 0.56, 3.56 0.64, 3.64 0.74 C3.72 0.83, 3.78 0.93, 3.84 1.03 C3.9 1.13, 3.96 1.24, 4 1.36 C4.04 1.47, 4.07 1.58, 4.09 1.7 C4.11 1.82, 4.12 2, 4.12 2.06 C4.13 2.12, 4.13 2, 4.12 2.06" stroke="#E1E1E1" stroke-width="1.2" fill="none" class="svg-elem-3"></path></g><g stroke-linecap="round" transform="translate(39.364277955060516 16.867275363859278) rotate(0 2.0601826091578914 2.060182609157785)"><path d="M4.12 2.06 C4.12 2.18, 4.11 2.3, 4.09 2.42 C4.07 2.54, 4.04 2.65, 4 2.76 C3.96 2.88, 3.9 2.99, 3.84 3.09 C3.78 3.19, 3.72 3.29, 3.64 3.38 C3.56 3.48, 3.48 3.56, 3.38 3.64 C3.29 3.72, 3.19 3.78, 3.09 3.84 C2.99 3.9, 2.88 3.96, 2.76 4 C2.65 4.04, 2.54 4.07, 2.42 4.09 C2.3 4.11, 2.18 4.12, 2.06 4.12 C1.94 4.12, 1.82 4.11, 1.7 4.09 C1.58 4.07, 1.47 4.04, 1.36 4 C1.24 3.96, 1.13 3.9, 1.03 3.84 C0.93 3.78, 0.83 3.72, 0.74 3.64 C0.64 3.56, 0.56 3.48, 0.48 3.38 C0.41 3.29, 0.34 3.19, 0.28 3.09 C0.22 2.99, 0.17 2.88, 0.12 2.76 C0.08 2.65, 0.05 2.54, 0.03 2.42 C0.01 2.3, 0 2.18, 0 2.06 C0 1.94, 0.01 1.82, 0.03 1.7 C0.05 1.58, 0.08 1.47, 0.12 1.36 C0.17 1.24, 0.22 1.13, 0.28 1.03 C0.34 0.93, 0.41 0.83, 0.48 0.74 C0.56 0.64, 0.64 0.56, 0.74 0.48 C0.83 0.41, 0.93 0.34, 1.03 0.28 C1.13 0.22, 1.24 0.17, 1.36 0.12 C1.47 0.08, 1.58 0.05, 1.7 0.03 C1.82 0.01, 1.94 0, 2.06 0 C2.18 0, 2.3 0.01, 2.42 0.03 C2.54 0.05, 2.65 0.08, 2.76 0.12 C2.88 0.17, 2.99 0.22, 3.09 0.28 C3.19 0.34, 3.29 0.41, 3.38 0.48 C3.48 0.56, 3.56 0.64, 3.64 0.74 C3.72 0.83, 3.78 0.93, 3.84 1.03 C3.9 1.13, 3.96 1.24, 4 1.36 C4.04 1.47, 4.07 1.58, 4.09 1.7 C4.11 1.82, 4.12 2, 4.12 2.06 C4.13 2.12, 4.13 2, 4.12 2.06" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-4"></path><path d="M4.12 2.06 C4.12 2.18, 4.11 2.3, 4.09 2.42 C4.07 2.54, 4.04 2.65, 4 2.76 C3.96 2.88, 3.9 2.99, 3.84 3.09 C3.78 3.19, 3.72 3.29, 3.64 3.38 C3.56 3.48, 3.48 3.56, 3.38 3.64 C3.29 3.72, 3.19 3.78, 3.09 3.84 C2.99 3.9, 2.88 3.96, 2.76 4 C2.65 4.04, 2.54 4.07, 2.42 4.09 C2.3 4.11, 2.18 4.12, 2.06 4.12 C1.94 4.12, 1.82 4.11, 1.7 4.09 C1.58 4.07, 1.47 4.04, 1.36 4 C1.24 3.96, 1.13 3.9, 1.03 3.84 C0.93 3.78, 0.83 3.72, 0.74 3.64 C0.64 3.56, 0.56 3.48, 0.48 3.38 C0.41 3.29, 0.34 3.19, 0.28 3.09 C0.22 2.99, 0.17 2.88, 0.12 2.76 C0.08 2.65, 0.05 2.54, 0.03 2.42 C0.01 2.3, 0 2.18, 0 2.06 C0 1.94, 0.01 1.82, 0.03 1.7 C0.05 1.58, 0.08 1.47, 0.12 1.36 C0.17 1.24, 0.22 1.13, 0.28 1.03 C0.34 0.93, 0.41 0.83, 0.48 0.74 C0.56 0.64, 0.64 0.56, 0.74 0.48 C0.83 0.41, 0.93 0.34, 1.03 0.28 C1.13 0.22, 1.24 0.17, 1.36 0.12 C1.47 0.08, 1.58 0.05, 1.7 0.03 C1.82 0.01, 1.94 0, 2.06 0 C2.18 0, 2.3 0.01, 2.42 0.03 C2.54 0.05, 2.65 0.08, 2.76 0.12 C2.88 0.17, 2.99 0.22, 3.09 0.28 C3.19 0.34, 3.29 0.41, 3.38 0.48 C3.48 0.56, 3.56 0.64, 3.64 0.74 C3.72 0.83, 3.78 0.93, 3.84 1.03 C3.9 1.13, 3.96 1.24, 4 1.36 C4.04 1.47, 4.07 1.58, 4.09 1.7 C4.11 1.82, 4.12 2, 4.12 2.06 C4.13 2.12, 4.13 2, 4.12 2.06" stroke="#E1E1E1" stroke-width="1.2" fill="none" class="svg-elem-5"></path></g><g stroke-linecap="round"><g transform="translate(15.296399392322655 25.780253593028007) rotate(0 0 1.1349427269262833)"><path d="M0 0 C0 0.48, 0 0.97, 0 2.27 M0 0 C0 0.74, 0 1.48, 0 2.27" stroke="#E1E1E1" stroke-width="1.5" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(20.59279878464531 18.97059723147028) rotate(0 -5.296399392322655 3.408381948256597)"><path d="M0 0 C0 0.6, 0 1.2, 0 1.51 M0 0 C0 0.45, 0 0.91, 0 1.51 M0 1.51 C0 1.51, 0 1.51, 0 1.51 M0 1.51 C0 1.51, 0 1.51, 0 1.51 M0 1.51 C-0.04 1.82, -0.08 2.13, -0.2 2.96 M0 1.51 C-0.06 1.98, -0.13 2.44, -0.2 2.96 M-0.2 2.96 C-0.36 3.35, -0.53 3.74, -0.74 4.24 M-0.2 2.96 C-0.36 3.34, -0.52 3.71, -0.74 4.24 M-0.74 4.24 C-1.06 4.63, -1.37 5.03, -1.58 5.29 M-0.74 4.24 C-0.92 4.45, -1.09 4.67, -1.58 5.29 M-1.58 5.29 C-1.91 5.54, -2.23 5.78, -2.65 6.1 M-1.58 5.29 C-1.87 5.51, -2.16 5.73, -2.65 6.1 M-2.65 6.1 C-3.13 6.3, -3.61 6.51, -3.88 6.62 M-2.65 6.1 C-3.06 6.28, -3.48 6.45, -3.88 6.62 M-3.88 6.62 C-4.26 6.68, -4.65 6.73, -5.21 6.82 M-3.88 6.62 C-4.32 6.68, -4.75 6.75, -5.21 6.82 M-5.21 6.82 C-5.66 6.76, -6.1 6.71, -6.59 6.66 M-5.21 6.82 C-5.68 6.76, -6.14 6.71, -6.59 6.66 M-6.59 6.66 C-6.88 6.54, -7.16 6.42, -7.94 6.1 M-6.59 6.66 C-6.99 6.49, -7.39 6.33, -7.94 6.1 M-7.94 6.1 C-8.17 5.93, -8.39 5.76, -9.05 5.25 M-7.94 6.1 C-8.23 5.88, -8.51 5.67, -9.05 5.25 M-9.05 5.25 C-9.37 4.83, -9.69 4.42, -9.88 4.16 M-9.05 5.25 C-9.26 4.98, -9.47 4.7, -9.88 4.16 M-9.88 4.16 C-10 3.88, -10.11 3.61, -10.41 2.9 M-9.88 4.16 C-10.09 3.67, -10.29 3.18, -10.41 2.9 M-10.41 2.9 C-10.46 2.52, -10.51 2.14, -10.59 1.51 M-10.41 2.9 C-10.47 2.47, -10.52 2.05, -10.59 1.51 M-10.59 1.51 C-10.59 1.02, -10.59 0.52, -10.59 0 M-10.59 1.51 C-10.59 1.12, -10.59 0.72, -10.59 0" stroke="#E1E1E1" stroke-width="1.5" fill="none" class="svg-elem-7"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(13.026513938470089 12.917569354530102) rotate(0 2.2698854538525666 4.918085150013901)"><path d="M1.13 0 C1.99 0, 2.84 0, 3.4 0 C4.16 0, 4.54 0.38, 4.54 1.13 C4.54 2.98, 4.54 4.83, 4.54 8.7 C4.54 9.46, 4.16 9.84, 3.4 9.84 C2.51 9.84, 1.61 9.84, 1.13 9.84 C0.38 9.84, 0 9.46, 0 8.7 C0 6.52, 0 4.33, 0 1.13 C0 0.38, 0.38 0, 1.13 0" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-8"></path><path d="M1.13 0 C1.95 0, 2.77 0, 3.4 0 M1.13 0 C1.69 0, 2.24 0, 3.4 0 M3.4 0 C4.16 0, 4.54 0.38, 4.54 1.13 M3.4 0 C4.16 0, 4.54 0.38, 4.54 1.13 M4.54 1.13 C4.54 3.89, 4.54 6.64, 4.54 8.7 M4.54 1.13 C4.54 2.79, 4.54 4.44, 4.54 8.7 M4.54 8.7 C4.54 9.46, 4.16 9.84, 3.4 9.84 M4.54 8.7 C4.54 9.46, 4.16 9.84, 3.4 9.84 M3.4 9.84 C2.7 9.84, 2 9.84, 1.13 9.84 M3.4 9.84 C2.51 9.84, 1.61 9.84, 1.13 9.84 M1.13 9.84 C0.38 9.84, 0 9.46, 0 8.7 M1.13 9.84 C0.38 9.84, 0 9.46, 0 8.7 M0 8.7 C0 6.51, 0 4.33, 0 1.13 M0 8.7 C0 6.43, 0 4.15, 0 1.13 M0 1.13 C0 0.38, 0.38 0, 1.13 0 M0 1.13 C0 0.38, 0.38 0, 1.13 0" stroke="#E1E1E1" stroke-width="1.5" fill="none" class="svg-elem-9"></path></g><g stroke-linecap="round" transform="translate(21.61992030827014 25.979926745914753) rotate(0 8.080429974924073 8.080429974924051)"><path d="M4.04 0 C5.91 0, 7.79 0, 12.12 0 C14.81 0, 16.16 1.35, 16.16 4.04 C16.16 6.64, 16.16 9.23, 16.16 12.12 C16.16 14.81, 14.81 16.16, 12.12 16.16 C9.64 16.16, 7.17 16.16, 4.04 16.16 C1.35 16.16, 0 14.81, 0 12.12 C0 10.41, 0 8.7, 0 4.04 C0 1.35, 1.35 0, 4.04 0" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-10"></path><path d="M4.04 0 C6.1 0, 8.15 0, 12.12 0 M4.04 0 C6.58 0, 9.13 0, 12.12 0 M12.12 0 C14.81 0, 16.16 1.35, 16.16 4.04 M12.12 0 C14.81 0, 16.16 1.35, 16.16 4.04 M16.16 4.04 C16.16 6.52, 16.16 9.01, 16.16 12.12 M16.16 4.04 C16.16 7.22, 16.16 10.39, 16.16 12.12 M16.16 12.12 C16.16 14.81, 14.81 16.16, 12.12 16.16 M16.16 12.12 C16.16 14.81, 14.81 16.16, 12.12 16.16 M12.12 16.16 C9.74 16.16, 7.37 16.16, 4.04 16.16 M12.12 16.16 C9.08 16.16, 6.05 16.16, 4.04 16.16 M4.04 16.16 C1.35 16.16, 0 14.81, 0 12.12 M4.04 16.16 C1.35 16.16, 0 14.81, 0 12.12 M0 12.12 C0 9.3, 0 6.48, 0 4.04 M0 12.12 C0 9.48, 0 6.84, 0 4.04 M0 4.04 C0 1.35, 1.35 0, 4.04 0 M0 4.04 C0 1.35, 1.35 0, 4.04 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-11"></path></g><g stroke-linecap="round"><g transform="translate(37.780780258118284 36.36905099938855) rotate(0 -6.348909266011788 1.7281063568267427)"><path d="M0 0 C-0.44 -0.44, -0.88 -0.88, -1.5 -1.5 M0 0 C-0.5 -0.5, -0.99 -0.99, -1.5 -1.5 M-1.5 -1.5 C-1.5 -1.5, -1.5 -1.5, -1.5 -1.5 M-1.5 -1.5 C-1.5 -1.5, -1.5 -1.5, -1.5 -1.5 M-1.5 -1.5 C-1.7 -1.63, -1.9 -1.76, -2.42 -2.11 M-1.5 -1.5 C-1.84 -1.72, -2.17 -1.95, -2.42 -2.11 M-2.42 -2.11 C-2.83 -2.19, -3.25 -2.27, -3.46 -2.32 M-2.42 -2.11 C-2.63 -2.15, -2.85 -2.2, -3.46 -2.32 M-3.46 -2.32 C-3.75 -2.26, -4.04 -2.2, -4.51 -2.11 M-3.46 -2.32 C-3.81 -2.25, -4.16 -2.18, -4.51 -2.11 M-4.51 -2.11 C-4.79 -1.92, -5.07 -1.73, -5.43 -1.5 M-4.51 -2.11 C-4.74 -1.95, -4.98 -1.8, -5.43 -1.5 M-5.43 -1.5 C-7.16 0.24, -8.9 1.97, -12.7 5.77 M-5.43 -1.5 C-7.12 0.19, -8.8 1.88, -12.7 5.77" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-12"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(17.002531751170864 32.90600958156392) rotate(0 5.771735696374208 8.080429974924051)"><path d="M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C-0.33 0.07, -0.67 0.13, -0.9 0.18 M0 0 C-0.25 0.05, -0.51 0.1, -0.9 0.18 M-0.9 0.18 C-1.14 0.35, -1.39 0.51, -1.63 0.68 M-0.9 0.18 C-1.12 0.33, -1.33 0.47, -1.63 0.68 M-1.63 0.68 C-1.79 0.9, -1.94 1.13, -2.13 1.41 M-1.63 0.68 C-1.83 0.97, -2.02 1.26, -2.13 1.41 M-2.13 1.41 C-2.18 1.66, -2.23 1.91, -2.31 2.31 M-2.13 1.41 C-2.18 1.67, -2.23 1.93, -2.31 2.31 M-2.31 2.31 C-2.31 5.8, -2.31 9.3, -2.31 13.85 M-2.31 2.31 C-2.31 6.59, -2.31 10.88, -2.31 13.85 M-2.31 13.85 C-2.31 13.85, -2.31 13.85, -2.31 13.85 M-2.31 13.85 C-2.31 13.85, -2.31 13.85, -2.31 13.85 M-2.31 13.85 C-2.26 14.11, -2.2 14.37, -2.13 14.75 M-2.31 13.85 C-2.25 14.16, -2.19 14.46, -2.13 14.75 M-2.13 14.75 C-1.98 14.98, -1.82 15.2, -1.63 15.48 M-2.13 14.75 C-1.98 14.96, -1.84 15.17, -1.63 15.48 M-1.63 15.48 C-1.45 15.6, -1.28 15.73, -0.9 15.98 M-1.63 15.48 C-1.34 15.68, -1.06 15.87, -0.9 15.98 M-0.9 15.98 C-0.59 16.04, -0.29 16.1, 0 16.16 M-0.9 15.98 C-0.65 16.03, -0.41 16.08, 0 16.16 M0 16.16 C4.33 16.16, 8.66 16.16, 11.54 16.16 M0 16.16 C4.41 16.16, 8.83 16.16, 11.54 16.16 M11.54 16.16 C11.54 16.16, 11.54 16.16, 11.54 16.16 M11.54 16.16 C11.54 16.16, 11.54 16.16, 11.54 16.16 M11.54 16.16 C11.84 16.1, 12.14 16.04, 12.44 15.98 M11.54 16.16 C11.84 16.1, 12.13 16.04, 12.44 15.98 M12.44 15.98 C12.73 15.79, 13.02 15.59, 13.18 15.48 M12.44 15.98 C12.66 15.83, 12.88 15.69, 13.18 15.48 M13.18 15.48 C13.28 15.33, 13.38 15.18, 13.67 14.75 M13.18 15.48 C13.28 15.33, 13.38 15.18, 13.67 14.75 M13.67 14.75 C13.74 14.4, 13.81 14.06, 13.85 13.85 M13.67 14.75 C13.72 14.49, 13.78 14.23, 13.85 13.85" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-13"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(26.237308865369414 30.597315303014227) rotate(0 1.1543471392749325 1.1543471392748614)"><path d="M2.31 1.15 C2.31 1.22, 2.3 1.29, 2.29 1.35 C2.28 1.42, 2.26 1.49, 2.24 1.55 C2.22 1.61, 2.19 1.67, 2.15 1.73 C2.12 1.79, 2.08 1.85, 2.04 1.9 C2 1.95, 1.95 2, 1.9 2.04 C1.85 2.08, 1.79 2.12, 1.73 2.15 C1.67 2.19, 1.61 2.22, 1.55 2.24 C1.49 2.26, 1.42 2.28, 1.35 2.29 C1.29 2.3, 1.22 2.31, 1.15 2.31 C1.09 2.31, 1.02 2.3, 0.95 2.29 C0.89 2.28, 0.82 2.26, 0.76 2.24 C0.7 2.22, 0.64 2.19, 0.58 2.15 C0.52 2.12, 0.46 2.08, 0.41 2.04 C0.36 2, 0.31 1.95, 0.27 1.9 C0.23 1.85, 0.19 1.79, 0.15 1.73 C0.12 1.67, 0.09 1.61, 0.07 1.55 C0.05 1.49, 0.03 1.42, 0.02 1.35 C0.01 1.29, 0 1.22, 0 1.15 C0 1.09, 0.01 1.02, 0.02 0.95 C0.03 0.89, 0.05 0.82, 0.07 0.76 C0.09 0.7, 0.12 0.64, 0.15 0.58 C0.19 0.52, 0.23 0.46, 0.27 0.41 C0.31 0.36, 0.36 0.31, 0.41 0.27 C0.46 0.23, 0.52 0.19, 0.58 0.15 C0.64 0.12, 0.7 0.09, 0.76 0.07 C0.82 0.05, 0.89 0.03, 0.95 0.02 C1.02 0.01, 1.09 0, 1.15 0 C1.22 0, 1.29 0.01, 1.35 0.02 C1.42 0.03, 1.49 0.05, 1.55 0.07 C1.61 0.09, 1.67 0.12, 1.73 0.15 C1.79 0.19, 1.85 0.23, 1.9 0.27 C1.95 0.31, 2 0.36, 2.04 0.41 C2.08 0.46, 2.12 0.52, 2.15 0.58 C2.19 0.64, 2.22 0.7, 2.24 0.76 C2.26 0.82, 2.28 0.89, 2.29 0.95 C2.3 1.02, 2.31 1.12, 2.31 1.15 C2.31 1.19, 2.31 1.12, 2.31 1.15" stroke="none" stroke-width="0" fill="currentColor" class="svg-elem-14"></path><path d="M2.31 1.15 C2.31 1.22, 2.3 1.29, 2.29 1.35 C2.28 1.42, 2.26 1.49, 2.24 1.55 C2.22 1.61, 2.19 1.67, 2.15 1.73 C2.12 1.79, 2.08 1.85, 2.04 1.9 C2 1.95, 1.95 2, 1.9 2.04 C1.85 2.08, 1.79 2.12, 1.73 2.15 C1.67 2.19, 1.61 2.22, 1.55 2.24 C1.49 2.26, 1.42 2.28, 1.35 2.29 C1.29 2.3, 1.22 2.31, 1.15 2.31 C1.09 2.31, 1.02 2.3, 0.95 2.29 C0.89 2.28, 0.82 2.26, 0.76 2.24 C0.7 2.22, 0.64 2.19, 0.58 2.15 C0.52 2.12, 0.46 2.08, 0.41 2.04 C0.36 2, 0.31 1.95, 0.27 1.9 C0.23 1.85, 0.19 1.79, 0.15 1.73 C0.12 1.67, 0.09 1.61, 0.07 1.55 C0.05 1.49, 0.03 1.42, 0.02 1.35 C0.01 1.29, 0 1.22, 0 1.15 C0 1.09, 0.01 1.02, 0.02 0.95 C0.03 0.89, 0.05 0.82, 0.07 0.76 C0.09 0.7, 0.12 0.64, 0.15 0.58 C0.19 0.52, 0.23 0.46, 0.27 0.41 C0.31 0.36, 0.36 0.31, 0.41 0.27 C0.46 0.23, 0.52 0.19, 0.58 0.15 C0.64 0.12, 0.7 0.09, 0.76 0.07 C0.82 0.05, 0.89 0.03, 0.95 0.02 C1.02 0.01, 1.09 0, 1.15 0 C1.22 0, 1.29 0.01, 1.35 0.02 C1.42 0.03, 1.49 0.05, 1.55 0.07 C1.61 0.09, 1.67 0.12, 1.73 0.15 C1.79 0.19, 1.85 0.23, 1.9 0.27 C1.95 0.31, 2 0.36, 2.04 0.41 C2.08 0.46, 2.12 0.52, 2.15 0.58 C2.19 0.64, 2.22 0.7, 2.24 0.76 C2.26 0.82, 2.28 0.89, 2.29 0.95 C2.3 1.02, 2.31 1.12, 2.31 1.15 C2.31 1.19, 2.31 1.12, 2.31 1.15" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-15"></path></g></svg>
      `,
        css: `
                    /***************************************************
                 * Generated by SVG Artista on 9/1/2025, 4:30:27 PM
                 * MIT license (https://opensource.org/licenses/MIT)
                 * W. https://svgartista.net
                 **************************************************/

                svg .svg-elem-1 {
                stroke-dashoffset: 54.426231384277344px;
                stroke-dasharray: 54.426231384277344px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
                }

                svg.active .svg-elem-1 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-2 {
                stroke-dashoffset: 15.016854286193848px;
                stroke-dasharray: 15.016854286193848px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
                }

                svg.active .svg-elem-2 {
                stroke-dashoffset: 0;
                fill: rgb(0, 0, 0);
                }

                svg .svg-elem-3 {
                stroke-dashoffset: 15.016854286193848px;
                stroke-dasharray: 15.016854286193848px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
                }

                svg.active .svg-elem-3 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-4 {
                stroke-dashoffset: 15.016854286193848px;
                stroke-dasharray: 15.016854286193848px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
                }

                svg.active .svg-elem-4 {
                stroke-dashoffset: 0;
                fill: rgb(0, 0, 0);
                }

                svg .svg-elem-5 {
                stroke-dashoffset: 15.016854286193848px;
                stroke-dasharray: 15.016854286193848px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
                }

                svg.active .svg-elem-5 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-6 {
                stroke-dashoffset: 6.539999961853027px;
                stroke-dasharray: 6.539999961853027px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
                }

                svg.active .svg-elem-6 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-7 {
                stroke-dashoffset: 41.25519943237305px;
                stroke-dasharray: 41.25519943237305px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
                }

                svg.active .svg-elem-7 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-8 {
                stroke-dashoffset: 29.046274185180664px;
                stroke-dasharray: 29.046274185180664px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
                }

                svg.active .svg-elem-8 {
                stroke-dashoffset: 0;
                fill: rgb(0, 0, 0);
                }

                svg .svg-elem-9 {
                stroke-dashoffset: 56.092552185058594px;
                stroke-dasharray: 56.092552185058594px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
                }

                svg.active .svg-elem-9 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-10 {
                stroke-dashoffset: 60.54497528076172px;
                stroke-dasharray: 60.54497528076172px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
                }

                svg.active .svg-elem-10 {
                stroke-dashoffset: 0;
                fill: rgb(0, 0, 0);
                }

                svg .svg-elem-11 {
                stroke-dashoffset: 119.08995819091797px;
                stroke-dasharray: 119.08995819091797px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.8s;
                }

                svg.active .svg-elem-11 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-12 {
                stroke-dashoffset: 35.484474182128906px;
                stroke-dasharray: 35.484474182128906px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.9000000000000001s;
                }

                svg.active .svg-elem-12 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-13 {
                stroke-dashoffset: 69.79733276367188px;
                stroke-dasharray: 69.79733276367188px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2s;
                }

                svg.active .svg-elem-13 {
                stroke-dashoffset: 0;
                }

                svg .svg-elem-14 {
                stroke-dashoffset: 9.29610300064087px;
                stroke-dasharray: 9.29610300064087px;
                fill: transparent;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.56s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.1s;
                }

                svg.active .svg-elem-14 {
                stroke-dashoffset: 0;
                fill: rgb(26, 25, 26);
                }

                svg .svg-elem-15 {
                stroke-dashoffset: 9.29610300064087px;
                stroke-dasharray: 9.29610300064087px;
                -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
                        transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.68s,
                                fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 2.2s;
                }

                svg.active .svg-elem-15 {
                stroke-dashoffset: 0;
                }
    
     `
    },
    {
        name: "Display",
        svg: `
     <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51.756773646902275 47.13864263488344" width="51.75677490234375" height="47.138641357421875" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round"><g transform="translate(10 19.500270002402658) rotate(0 4.750135001201443 -4.750135001201329)"><path d="M0 0 C3.16 0, 6.31 0, 9.5 0 M0 0 C2.48 0, 4.96 0, 9.5 0 M9.5 0 C9.5 -3.45, 9.5 -6.91, 9.5 -9.5 M9.5 0 C9.5 -2.07, 9.5 -4.15, 9.5 -9.5" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-1"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(10 10) rotate(0 4.750135001201443 4.750135001201329)"><path d="M0 0 C3.66 3.66, 7.33 7.33, 9.5 9.5 M0 0 C3.52 3.52, 7.05 7.05, 9.5 9.5" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-2"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(40.08418834094164 19.500270002402658) rotate(0 -7.12520250180205 -3.958445834334441)"><path d="M0 0 C0 -1.78, 0 -3.57, 0 -4.75 M0 0 C0 -1.48, 0 -2.97, 0 -4.75 M0 -4.75 C0 -4.75, 0 -4.75, 0 -4.75 M0 -4.75 C0 -4.75, 0 -4.75, 0 -4.75 M0 -4.75 C-0.1 -5.22, -0.19 -5.7, -0.25 -5.98 M0 -4.75 C-0.09 -5.2, -0.18 -5.65, -0.25 -5.98 M-0.25 -5.98 C-0.48 -6.33, -0.72 -6.67, -0.93 -6.99 M-0.25 -5.98 C-0.45 -6.29, -0.66 -6.59, -0.93 -6.99 M-0.93 -6.99 C-1.22 -7.19, -1.51 -7.38, -1.93 -7.67 M-0.93 -6.99 C-1.23 -7.19, -1.53 -7.4, -1.93 -7.67 M-1.93 -7.67 C-2.31 -7.74, -2.68 -7.82, -3.17 -7.92 M-1.93 -7.67 C-2.27 -7.74, -2.61 -7.81, -3.17 -7.92 M-3.17 -7.92 C-6.83 -7.92, -10.49 -7.92, -14.25 -7.92 M-3.17 -7.92 C-5.9 -7.92, -8.62 -7.92, -14.25 -7.92" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-3"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(11.58337833373389 25.833783337337763) rotate(0 3.9584458343344977 3.1667566674675527)"><path d="M0 0 C0 1, 0 1.99, 0 3.17 M0 0 C0 0.82, 0 1.63, 0 3.17 M0 3.17 C0 3.17, 0 3.17, 0 3.17 M0 3.17 C0 3.17, 0 3.17, 0 3.17 M0 3.17 C0.06 3.47, 0.12 3.77, 0.25 4.4 M0 3.17 C0.05 3.44, 0.11 3.7, 0.25 4.4 M0.25 4.4 C0.39 4.6, 0.52 4.8, 0.93 5.41 M0.25 4.4 C0.4 4.62, 0.55 4.84, 0.93 5.41 M0.93 5.41 C1.18 5.58, 1.44 5.75, 1.93 6.08 M0.93 5.41 C1.17 5.57, 1.41 5.73, 1.93 6.08 M1.93 6.08 C2.41 6.18, 2.88 6.28, 3.17 6.33 M1.93 6.08 C2.4 6.18, 2.86 6.27, 3.17 6.33 M3.17 6.33 C4.35 6.33, 5.53 6.33, 7.92 6.33 M3.17 6.33 C4.55 6.33, 5.94 6.33, 7.92 6.33" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(25.83378333733799 25.833783337337763) rotate(0 7.916891668668768 5.541824168068217)"><path d="M2.77 0 C5.75 0, 8.73 0, 13.06 0 C14.91 0, 15.83 0.92, 15.83 2.77 C15.83 4.56, 15.83 6.34, 15.83 8.31 C15.83 10.16, 14.91 11.08, 13.06 11.08 C9.05 11.08, 5.04 11.08, 2.77 11.08 C0.92 11.08, 0 10.16, 0 8.31 C0 7.06, 0 5.8, 0 2.77 C0 0.92, 0.92 0, 2.77 0" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-5"></path><path d="M2.77 0 C5.52 0, 8.27 0, 13.06 0 M2.77 0 C6.56 0, 10.34 0, 13.06 0 M13.06 0 C14.91 0, 15.83 0.92, 15.83 2.77 M13.06 0 C14.91 0, 15.83 0.92, 15.83 2.77 M15.83 2.77 C15.83 4.54, 15.83 6.3, 15.83 8.31 M15.83 2.77 C15.83 4.47, 15.83 6.16, 15.83 8.31 M15.83 8.31 C15.83 10.16, 14.91 11.08, 13.06 11.08 M15.83 8.31 C15.83 10.16, 14.91 11.08, 13.06 11.08 M13.06 11.08 C9.52 11.08, 5.99 11.08, 2.77 11.08 M13.06 11.08 C10.48 11.08, 7.9 11.08, 2.77 11.08 M2.77 11.08 C0.92 11.08, 0 10.16, 0 8.31 M2.77 11.08 C0.92 11.08, 0 10.16, 0 8.31 M0 8.31 C0 6.9, 0 5.49, 0 2.77 M0 8.31 C0 6.99, 0 5.67, 0 2.77 M0 2.77 C0 0.92, 0.92 0, 2.77 0 M0 2.77 C0 0.92, 0.92 0, 2.77 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-6"></path></g><g stroke-linecap="round" transform="translate(25.727701770038948 24.315385133392766) rotate(0 8.014535938431663 6.4116287507453364)"><path d="M3.21 0 C5.31 0, 7.41 0, 12.82 0 C14.96 0, 16.03 1.07, 16.03 3.21 C16.03 5.31, 16.03 7.41, 16.03 9.62 C16.03 11.75, 14.96 12.82, 12.82 12.82 C10.39 12.82, 7.95 12.82, 3.21 12.82 C1.07 12.82, 0 11.75, 0 9.62 C0 8.27, 0 6.92, 0 3.21 C0 1.07, 1.07 0, 3.21 0" stroke="none" stroke-width="0" fill="#000000" class="svg-elem-7"></path><path d="M3.21 0 C6.35 0, 9.49 0, 12.82 0 M3.21 0 C5.77 0, 8.34 0, 12.82 0 M12.82 0 C14.96 0, 16.03 1.07, 16.03 3.21 M12.82 0 C14.96 0, 16.03 1.07, 16.03 3.21 M16.03 3.21 C16.03 4.57, 16.03 5.93, 16.03 9.62 M16.03 3.21 C16.03 5.25, 16.03 7.29, 16.03 9.62 M16.03 9.62 C16.03 11.75, 14.96 12.82, 12.82 12.82 M16.03 9.62 C16.03 11.75, 14.96 12.82, 12.82 12.82 M12.82 12.82 C9.23 12.82, 5.64 12.82, 3.21 12.82 M12.82 12.82 C9.52 12.82, 6.21 12.82, 3.21 12.82 M3.21 12.82 C1.07 12.82, 0 11.75, 0 9.62 M3.21 12.82 C1.07 12.82, 0 11.75, 0 9.62 M0 9.62 C0 7.65, 0 5.69, 0 3.21 M0 9.62 C0 7.99, 0 6.35, 0 3.21 M0 3.21 C0 1.07, 1.07 0, 3.21 0 M0 3.21 C0 1.07, 1.07 0, 3.21 0" stroke="#E1E1E1" stroke-width="1.7" fill="none" class="svg-elem-8"></path></g><g stroke-linecap="round"><g transform="translate(33.74223770847084 28.322653102608598) rotate(0 0 4.407994766137421)"><path d="M0 0 C0 2.64, 0 5.28, 0 8.82 M0 0 C0 2.76, 0 5.52, 0 8.82" stroke="#E1E1E1" stroke-width="1.7" fill="none" class="svg-elem-9"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(41.756773646902275 28.322653102608598) rotate(0 -6.010901953823804 4.407994766137421)"><path d="M0 0 C-2.53 0, -5.06 0, -10.42 0 M0 0 C-4.01 0, -8.01 0, -10.42 0 M-10.42 0 C-10.42 0, -10.42 0, -10.42 0 M-10.42 0 C-10.42 0, -10.42 0, -10.42 0 M-10.42 0 C-10.66 0.05, -10.89 0.1, -11.04 0.13 M-10.42 0 C-10.6 0.04, -10.78 0.07, -11.04 0.13 M-11.04 0.13 C-11.23 0.25, -11.42 0.38, -11.55 0.47 M-11.04 0.13 C-11.22 0.24, -11.39 0.36, -11.55 0.47 M-11.55 0.47 C-11.64 0.6, -11.72 0.73, -11.9 0.98 M-11.55 0.47 C-11.67 0.65, -11.79 0.82, -11.9 0.98 M-11.9 0.98 C-11.94 1.18, -11.98 1.39, -12.02 1.6 M-11.9 0.98 C-11.94 1.19, -11.98 1.41, -12.02 1.6 M-12.02 1.6 C-12.02 3.32, -12.02 5.03, -12.02 8.82 M-12.02 1.6 C-12.02 3.59, -12.02 5.58, -12.02 8.82" stroke="#E1E1E1" stroke-width="1.7" fill="none" class="svg-elem-10"></path></g></g><mask></mask></svg>
      `,
        css: `
                /***************************************************
             * Generated by SVG Artista on 9/1/2025, 4:31:29 PM
             * MIT license (https://opensource.org/licenses/MIT)
             * W. https://svgartista.net
             **************************************************/

            svg .svg-elem-1 {
            stroke-dashoffset: 80px;
            stroke-dasharray: 40px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s;
            }

            svg.active .svg-elem-1 {
            stroke-dashoffset: 40px;
            fill: transparent;
            }

            svg .svg-elem-2 {
            stroke-dashoffset: 57.740116119384766px;
            stroke-dasharray: 28.870058059692383px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 0.9s;
            }

            svg.active .svg-elem-2 {
            stroke-dashoffset: 28.870058059692383px;
            fill: transparent;
            }

            svg .svg-elem-3 {
            stroke-dashoffset: 87.10810852050781px;
            stroke-dasharray: 43.554054260253906px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1s;
            }

            svg.active .svg-elem-3 {
            stroke-dashoffset: 43.554054260253906px;
            fill: transparent;
            }

            svg .svg-elem-4 {
            stroke-dashoffset: 55.44575119018555px;
            stroke-dasharray: 27.722875595092773px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.1s;
            }

            svg.active .svg-elem-4 {
            stroke-dashoffset: 27.722875595092773px;
            fill: transparent;
            }

            svg .svg-elem-5 {
            stroke-dashoffset: 103.30347442626953px;
            stroke-dasharray: 51.651737213134766px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2000000000000002s;
            }

            svg.active .svg-elem-5 {
            stroke-dashoffset: 51.651737213134766px;
            fill: transparent;
            }

            svg .svg-elem-6 {
            stroke-dashoffset: 202.60696411132812px;
            stroke-dasharray: 101.30348205566406px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3s;
            }

            svg.active .svg-elem-6 {
            stroke-dashoffset: 101.30348205566406px;
            fill: transparent;
            }

            svg .svg-elem-7 {
            stroke-dashoffset: 109.72882080078125px;
            stroke-dasharray: 54.864410400390625px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.4000000000000001s;
            }

            svg.active .svg-elem-7 {
            stroke-dashoffset: 54.864410400390625px;
            fill: transparent;
            }

            svg .svg-elem-8 {
            stroke-dashoffset: 215.4576416015625px;
            stroke-dasharray: 107.72882080078125px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.5s;
            }

            svg.active .svg-elem-8 {
            stroke-dashoffset: 107.72882080078125px;
            fill: transparent;
            }

            svg .svg-elem-9 {
            stroke-dashoffset: 39.279998779296875px;
            stroke-dasharray: 19.639999389648438px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.6s;
            }

            svg.active .svg-elem-9 {
            stroke-dashoffset: 19.639999389648438px;
            fill: transparent;
            }

            svg .svg-elem-10 {
            stroke-dashoffset: 84.54635620117188px;
            stroke-dasharray: 42.27317810058594px;
            fill: transparent;
            -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                                    fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
                    transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s,
                            fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) 1.7000000000000002s;
            }

            svg.active .svg-elem-10 {
            stroke-dashoffset: 42.27317810058594px;
            fill: transparent;
            }
     `
    },
    {
        name: "Manifesto",
        svg: `
       <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 725.9630735994333 679.7194076028513" width="725.9630737304688" height="679.7194213867188" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round" transform="translate(461.7534101988417 468.5112566422331) rotate(0 88.41147944486283 88.41147944486283)"><path d="M176.82 88.41 C176.82 91.49, 176.66 94.59, 176.34 97.65 C176.02 100.72, 175.53 103.78, 174.89 106.79 C174.25 109.81, 173.45 112.8, 172.5 115.73 C171.54 118.66, 170.43 121.56, 169.18 124.37 C167.93 127.19, 166.52 129.95, 164.98 132.62 C163.44 135.29, 161.75 137.89, 159.94 140.38 C158.13 142.87, 156.18 145.28, 154.11 147.57 C152.05 149.86, 149.86 152.05, 147.57 154.11 C145.28 156.18, 142.87 158.13, 140.38 159.94 C137.89 161.75, 135.29 163.44, 132.62 164.98 C129.95 166.52, 127.19 167.93, 124.37 169.18 C121.56 170.43, 118.66 171.54, 115.73 172.5 C112.8 173.45, 109.81 174.25, 106.79 174.89 C103.78 175.53, 100.72 176.02, 97.65 176.34 C94.59 176.66, 91.49 176.82, 88.41 176.82 C85.33 176.82, 82.23 176.66, 79.17 176.34 C76.11 176.02, 73.04 175.53, 70.03 174.89 C67.02 174.25, 64.02 173.45, 61.09 172.5 C58.16 171.54, 55.27 170.43, 52.45 169.18 C49.64 167.93, 46.87 166.52, 44.21 164.98 C41.54 163.44, 38.94 161.75, 36.44 159.94 C33.95 158.13, 31.54 156.18, 29.25 154.11 C26.96 152.05, 24.77 149.86, 22.71 147.57 C20.65 145.28, 18.7 142.87, 16.89 140.38 C15.07 137.89, 13.39 135.29, 11.84 132.62 C10.3 129.95, 8.9 127.19, 7.64 124.37 C6.39 121.56, 5.28 118.66, 4.33 115.73 C3.38 112.8, 2.57 109.81, 1.93 106.79 C1.29 103.78, 0.81 100.72, 0.48 97.65 C0.16 94.59, 0 91.49, 0 88.41 C0 85.33, 0.16 82.23, 0.48 79.17 C0.81 76.11, 1.29 73.04, 1.93 70.03 C2.57 67.02, 3.38 64.02, 4.33 61.09 C5.28 58.16, 6.39 55.27, 7.64 52.45 C8.9 49.64, 10.3 46.87, 11.84 44.21 C13.39 41.54, 15.07 38.94, 16.89 36.44 C18.7 33.95, 20.65 31.54, 22.71 29.25 C24.77 26.96, 26.96 24.77, 29.25 22.71 C31.54 20.65, 33.95 18.7, 36.44 16.89 C38.94 15.07, 41.54 13.39, 44.21 11.84 C46.87 10.3, 49.64 8.9, 52.45 7.64 C55.27 6.39, 58.16 5.28, 61.09 4.33 C64.02 3.38, 67.02 2.57, 70.03 1.93 C73.04 1.29, 76.11 0.81, 79.17 0.48 C82.23 0.16, 85.33 0, 88.41 0 C91.49 0, 94.59 0.16, 97.65 0.48 C100.72 0.81, 103.78 1.29, 106.79 1.93 C109.81 2.57, 112.8 3.38, 115.73 4.33 C118.66 5.28, 121.56 6.39, 124.37 7.64 C127.19 8.9, 129.95 10.3, 132.62 11.84 C135.29 13.39, 137.89 15.07, 140.38 16.89 C142.87 18.7, 145.28 20.65, 147.57 22.71 C149.86 24.77, 152.05 26.96, 154.11 29.25 C156.18 31.54, 158.13 33.95, 159.94 36.44 C161.75 38.94, 163.44 41.54, 164.98 44.21 C166.52 46.87, 167.93 49.64, 169.18 52.45 C170.43 55.27, 171.54 58.16, 172.5 61.09 C173.45 64.02, 174.25 67.02, 174.89 70.03 C175.53 73.04, 176.02 76.11, 176.34 79.17 C176.66 82.23, 176.74 86.87, 176.82 88.41 C176.9 89.95, 176.9 86.87, 176.82 88.41" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-1"></path></g><g stroke-linecap="round" transform="translate(85.82591613993509 468.66301041584256) rotate(0 88.41147944486283 88.41147944486283)"><path d="M176.82 88.41 C176.82 91.49, 176.66 94.59, 176.34 97.65 C176.02 100.72, 175.53 103.78, 174.89 106.79 C174.25 109.81, 173.45 112.8, 172.5 115.73 C171.54 118.66, 170.43 121.56, 169.18 124.37 C167.93 127.19, 166.52 129.95, 164.98 132.62 C163.44 135.29, 161.75 137.89, 159.94 140.38 C158.13 142.87, 156.18 145.28, 154.11 147.57 C152.05 149.86, 149.86 152.05, 147.57 154.11 C145.28 156.18, 142.87 158.13, 140.38 159.94 C137.89 161.75, 135.29 163.44, 132.62 164.98 C129.95 166.52, 127.19 167.93, 124.37 169.18 C121.56 170.43, 118.66 171.54, 115.73 172.5 C112.8 173.45, 109.81 174.25, 106.79 174.89 C103.78 175.53, 100.72 176.02, 97.65 176.34 C94.59 176.66, 91.49 176.82, 88.41 176.82 C85.33 176.82, 82.23 176.66, 79.17 176.34 C76.11 176.02, 73.04 175.53, 70.03 174.89 C67.02 174.25, 64.02 173.45, 61.09 172.5 C58.16 171.54, 55.27 170.43, 52.45 169.18 C49.64 167.93, 46.87 166.52, 44.21 164.98 C41.54 163.44, 38.94 161.75, 36.44 159.94 C33.95 158.13, 31.54 156.18, 29.25 154.11 C26.96 152.05, 24.77 149.86, 22.71 147.57 C20.65 145.28, 18.7 142.87, 16.89 140.38 C15.07 137.89, 13.39 135.29, 11.84 132.62 C10.3 129.95, 8.9 127.19, 7.64 124.37 C6.39 121.56, 5.28 118.66, 4.33 115.73 C3.38 112.8, 2.57 109.81, 1.93 106.79 C1.29 103.78, 0.81 100.72, 0.48 97.65 C0.16 94.59, 0 91.49, 0 88.41 C0 85.33, 0.16 82.23, 0.48 79.17 C0.81 76.11, 1.29 73.04, 1.93 70.03 C2.57 67.02, 3.38 64.02, 4.33 61.09 C5.28 58.16, 6.39 55.27, 7.64 52.45 C8.9 49.64, 10.3 46.87, 11.84 44.21 C13.39 41.54, 15.07 38.94, 16.89 36.44 C18.7 33.95, 20.65 31.54, 22.71 29.25 C24.77 26.96, 26.96 24.77, 29.25 22.71 C31.54 20.65, 33.95 18.7, 36.44 16.89 C38.94 15.07, 41.54 13.39, 44.21 11.84 C46.87 10.3, 49.64 8.9, 52.45 7.64 C55.27 6.39, 58.16 5.28, 61.09 4.33 C64.02 3.38, 67.02 2.57, 70.03 1.93 C73.04 1.29, 76.11 0.81, 79.17 0.48 C82.23 0.16, 85.33 0, 88.41 0 C91.49 0, 94.59 0.16, 97.65 0.48 C100.72 0.81, 103.78 1.29, 106.79 1.93 C109.81 2.57, 112.8 3.38, 115.73 4.33 C118.66 5.28, 121.56 6.39, 124.37 7.64 C127.19 8.9, 129.95 10.3, 132.62 11.84 C135.29 13.39, 137.89 15.07, 140.38 16.89 C142.87 18.7, 145.28 20.65, 147.57 22.71 C149.86 24.77, 152.05 26.96, 154.11 29.25 C156.18 31.54, 158.13 33.95, 159.94 36.44 C161.75 38.94, 163.44 41.54, 164.98 44.21 C166.52 46.87, 167.93 49.64, 169.18 52.45 C170.43 55.27, 171.54 58.16, 172.5 61.09 C173.45 64.02, 174.25 67.02, 174.89 70.03 C175.53 73.04, 176.02 76.11, 176.34 79.17 C176.66 82.23, 176.74 86.87, 176.82 88.41 C176.9 89.95, 176.9 86.87, 176.82 88.41" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-2"></path></g><g stroke-linecap="round"><g transform="translate(280.8378187971789 520.2003232546858) rotate(0 82.59613585459829 36.832070048503965)"><path d="M0 0 C-1.74 -3.67, -4.56 -13.62, -10.46 -21.99 C-16.36 -30.36, -26.3 -42.52, -35.42 -50.21 C-44.54 -57.9, -53.91 -63.92, -65.17 -68.15 C-76.43 -72.38, -91.8 -74.82, -102.97 -75.57 C-114.13 -76.31, -122.44 -75, -132.17 -72.64 C-141.89 -70.28, -152.02 -66.91, -161.31 -61.42 C-170.61 -55.92, -180.48 -47.64, -187.94 -39.65 C-195.4 -31.66, -201.26 -23.59, -206.06 -13.46 C-210.86 -3.34, -214.96 9.27, -216.75 21.11 C-218.54 32.94, -218.74 45.96, -216.78 57.54 C-214.83 69.12, -210.49 80.57, -205.02 90.58 C-199.55 100.59, -190.45 110.87, -183.98 117.61 C-177.5 124.36, -173.6 126.66, -166.15 131.04 C-158.7 135.43, -148.68 140.92, -139.29 143.91 C-129.9 146.9, -120.27 148.68, -109.8 148.98 C-99.32 149.28, -87.03 148.49, -76.45 145.72 C-65.86 142.95, -55.59 138.1, -46.3 132.37 C-37 126.65, -27.86 119.74, -20.69 111.36 C-13.53 102.98, -7.62 91.77, -3.32 82.11 C0.97 72.46, 3.37 63.05, 5.09 53.43 C6.81 43.81, 5.44 29.74, 6.97 24.4 C8.5 19.05, 8.66 23.22, 14.27 21.37 C19.88 19.52, 32.49 15.25, 40.62 13.32 C48.75 11.4, 53.71 10.36, 63.05 9.81 C72.39 9.26, 86.23 9.25, 96.64 10.03 C107.06 10.82, 117.08 12.75, 125.53 14.52 C133.98 16.29, 141.86 18.83, 147.35 20.66 C152.84 22.49, 156.67 23.49, 158.48 25.47 C160.29 27.46, 158.05 28.35, 158.22 32.56 C158.39 36.77, 158.49 43.55, 159.49 50.74 C160.49 57.92, 161.32 67.4, 164.24 75.68 C167.16 83.96, 171.11 92.29, 177.02 100.4 C182.92 108.51, 191.82 117.71, 199.66 124.34 C207.5 130.97, 215.8 136.24, 224.05 140.18 C232.3 144.11, 240.65 146.45, 249.17 147.95 C257.68 149.46, 265.87 149.86, 275.14 149.23 C284.42 148.6, 295.32 147.3, 304.81 144.16 C314.31 141.02, 323.19 136.58, 332.13 130.39 C341.08 124.21, 351.46 115.48, 358.47 107.02 C365.48 98.57, 370.27 89.55, 374.19 79.67 C378.1 69.78, 380.97 58.88, 381.98 47.72 C382.99 36.56, 382.8 23.95, 380.25 12.71 C377.71 1.47, 372.28 -10.18, 366.72 -19.72 C361.16 -29.25, 355.09 -37.03, 346.91 -44.49 C338.74 -51.96, 327.41 -59.61, 317.68 -64.5 C307.95 -69.39, 298.7 -72.14, 288.53 -73.82 C278.36 -75.5, 268.03 -76.13, 256.66 -74.56 C245.29 -73, 230.78 -69.02, 220.33 -64.41 C209.87 -59.79, 201.47 -53.49, 193.93 -46.86 C186.39 -40.23, 179.95 -31.86, 175.11 -24.63 C170.28 -17.4, 167.49 -7.37, 164.94 -3.48 C162.39 0.41, 162.79 -0.8, 159.83 -1.28 C156.86 -1.76, 152.86 -4.53, 147.17 -6.36 C141.49 -8.2, 136.91 -10.72, 125.7 -12.3 C114.49 -13.87, 93.56 -15.69, 79.92 -15.8 C66.28 -15.92, 54.49 -14.61, 43.86 -12.99 C33.24 -11.36, 23.48 -8.23, 16.17 -6.06 C8.86 -3.9, 2.7 -1.01, 0 0 M0 0 C-1.74 -3.67, -4.56 -13.62, -10.46 -21.99 C-16.36 -30.36, -26.3 -42.52, -35.42 -50.21 C-44.54 -57.9, -53.91 -63.92, -65.17 -68.15 C-76.43 -72.38, -91.8 -74.82, -102.97 -75.57 C-114.13 -76.31, -122.44 -75, -132.17 -72.64 C-141.89 -70.28, -152.02 -66.91, -161.31 -61.42 C-170.61 -55.92, -180.48 -47.64, -187.94 -39.65 C-195.4 -31.66, -201.26 -23.59, -206.06 -13.46 C-210.86 -3.34, -214.96 9.27, -216.75 21.11 C-218.54 32.94, -218.74 45.96, -216.78 57.54 C-214.83 69.12, -210.49 80.57, -205.02 90.58 C-199.55 100.59, -190.45 110.87, -183.98 117.61 C-177.5 124.36, -173.6 126.66, -166.15 131.04 C-158.7 135.43, -148.68 140.92, -139.29 143.91 C-129.9 146.9, -120.27 148.68, -109.8 148.98 C-99.32 149.28, -87.03 148.49, -76.45 145.72 C-65.86 142.95, -55.59 138.1, -46.3 132.37 C-37 126.65, -27.86 119.74, -20.69 111.36 C-13.53 102.98, -7.62 91.77, -3.32 82.11 C0.97 72.46, 3.37 63.05, 5.09 53.43 C6.81 43.81, 5.44 29.74, 6.97 24.4 C8.5 19.05, 8.66 23.22, 14.27 21.37 C19.88 19.52, 32.49 15.25, 40.62 13.32 C48.75 11.4, 53.71 10.36, 63.05 9.81 C72.39 9.26, 86.23 9.25, 96.64 10.03 C107.06 10.82, 117.08 12.75, 125.53 14.52 C133.98 16.29, 141.86 18.83, 147.35 20.66 C152.84 22.49, 156.67 23.49, 158.48 25.47 C160.29 27.46, 158.05 28.35, 158.22 32.56 C158.39 36.77, 158.49 43.55, 159.49 50.74 C160.49 57.92, 161.32 67.4, 164.24 75.68 C167.16 83.96, 171.11 92.29, 177.02 100.4 C182.92 108.51, 191.82 117.71, 199.66 124.34 C207.5 130.97, 215.8 136.24, 224.05 140.18 C232.3 144.11, 240.65 146.45, 249.17 147.95 C257.68 149.46, 265.87 149.86, 275.14 149.23 C284.42 148.6, 295.32 147.3, 304.81 144.16 C314.31 141.02, 323.19 136.58, 332.13 130.39 C341.08 124.21, 351.46 115.48, 358.47 107.02 C365.48 98.57, 370.27 89.55, 374.19 79.67 C378.1 69.78, 380.97 58.88, 381.98 47.72 C382.99 36.56, 382.8 23.95, 380.25 12.71 C377.71 1.47, 372.28 -10.18, 366.72 -19.72 C361.16 -29.25, 355.09 -37.03, 346.91 -44.49 C338.74 -51.96, 327.41 -59.61, 317.68 -64.5 C307.95 -69.39, 298.7 -72.14, 288.53 -73.82 C278.36 -75.5, 268.03 -76.13, 256.66 -74.56 C245.29 -73, 230.78 -69.02, 220.33 -64.41 C209.87 -59.79, 201.47 -53.49, 193.93 -46.86 C186.39 -40.23, 179.95 -31.86, 175.11 -24.63 C170.28 -17.4, 167.49 -7.37, 164.94 -3.48 C162.39 0.41, 162.79 -0.8, 159.83 -1.28 C156.86 -1.76, 152.86 -4.53, 147.17 -6.36 C141.49 -8.2, 136.91 -10.72, 125.7 -12.3 C114.49 -13.87, 93.56 -15.69, 79.92 -15.8 C66.28 -15.92, 54.49 -14.61, 43.86 -12.99 C33.24 -11.36, 23.48 -8.23, 16.17 -6.06 C8.86 -3.9, 2.7 -1.01, 0 0" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-3"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(140.6693538893469 415.42493990937965) rotate(0 222.29111868740847 -202.05090757877724)"><path d="M0 0 C-10 0, -42.78 0, -59.98 0 C-77.18 0, -93.97 0.64, -103.19 0 C-112.42 -0.64, -111.47 -1.22, -115.32 -3.82 C-119.17 -6.42, -123.75 -11.09, -126.3 -15.6 C-128.86 -20.11, -130.83 -25.48, -130.66 -30.89 C-130.49 -36.29, -128.43 -43.39, -125.29 -48.04 C-122.14 -52.69, -116.68 -56.7, -111.81 -58.78 C-106.93 -60.87, -103.59 -60.31, -96.02 -60.56 C-88.44 -60.81, -73.93 -60.46, -66.35 -60.3 C-58.78 -60.14, -53.52 -58.69, -50.57 -59.59 C-47.62 -60.49, -49.88 -60.9, -48.65 -65.71 C-47.43 -70.52, -45.91 -77.49, -43.21 -88.44 C-40.51 -99.4, -36.63 -115.33, -32.45 -131.45 C-28.27 -147.56, -24.34 -161.86, -18.12 -185.14 C-11.9 -208.41, -2.05 -245.1, 4.85 -271.12 C11.75 -297.15, 18.85 -323.94, 23.28 -341.27 C27.71 -358.61, 27.74 -366.39, 31.44 -375.13 C35.15 -383.86, 40 -388.83, 45.53 -393.69 C51.07 -398.56, 57.17 -402.68, 64.67 -404.3 C72.18 -405.92, 82.88 -405.92, 90.57 -403.41 C98.26 -400.91, 102.74 -394.71, 110.8 -389.26 C118.86 -383.81, 127.13 -376.72, 138.95 -370.7 C150.77 -364.68, 168.14 -356.8, 181.72 -353.15 C195.29 -349.5, 206.58 -348.58, 220.4 -348.79 C234.23 -349, 250.25 -350.67, 264.66 -354.41 C279.08 -358.16, 294.75 -364.72, 306.88 -371.27 C319.01 -377.83, 329.19 -388.34, 337.43 -393.76 C345.66 -399.17, 348.94 -402.11, 356.29 -403.75 C363.63 -405.39, 374.02 -405.5, 381.49 -403.6 C388.96 -401.69, 395.79 -397.63, 401.12 -392.34 C406.44 -387.05, 409.56 -382.81, 413.44 -371.85 C417.33 -360.88, 416.49 -356.82, 424.43 -326.57 C432.38 -296.32, 450.43 -230.38, 461.13 -190.34 C471.82 -150.29, 482.98 -107.38, 488.61 -86.29 C494.24 -65.21, 492.95 -67.95, 494.89 -63.84 C496.83 -59.72, 494.68 -61.99, 500.24 -61.59 C505.8 -61.18, 519.56 -61.62, 528.25 -61.38 C536.95 -61.15, 545.79 -62.08, 552.4 -60.15 C559.02 -58.23, 564.12 -54.64, 567.93 -49.83 C571.73 -45.02, 574.84 -37.47, 575.24 -31.29 C575.64 -25.11, 573.73 -17.78, 570.32 -12.76 C566.92 -7.74, 564.16 -3.34, 554.82 -1.18 C545.47 0.98, 541.4 -0.03, 514.26 0.2 C487.11 0.43, 435.01 0.2, 391.96 0.2 C348.9 0.2, 306.01 0.2, 255.9 0.2 C205.8 0.2, 133.97 0.24, 91.32 0.2 C48.67 0.17, 15.22 0.03, 0 0 M0 0 C-10 0, -42.78 0, -59.98 0 C-77.18 0, -93.97 0.64, -103.19 0 C-112.42 -0.64, -111.47 -1.22, -115.32 -3.82 C-119.17 -6.42, -123.75 -11.09, -126.3 -15.6 C-128.86 -20.11, -130.83 -25.48, -130.66 -30.89 C-130.49 -36.29, -128.43 -43.39, -125.29 -48.04 C-122.14 -52.69, -116.68 -56.7, -111.81 -58.78 C-106.93 -60.87, -103.59 -60.31, -96.02 -60.56 C-88.44 -60.81, -73.93 -60.46, -66.35 -60.3 C-58.78 -60.14, -53.52 -58.69, -50.57 -59.59 C-47.62 -60.49, -49.88 -60.9, -48.65 -65.71 C-47.43 -70.52, -45.91 -77.49, -43.21 -88.44 C-40.51 -99.4, -36.63 -115.33, -32.45 -131.45 C-28.27 -147.56, -24.34 -161.86, -18.12 -185.14 C-11.9 -208.41, -2.05 -245.1, 4.85 -271.12 C11.75 -297.15, 18.85 -323.94, 23.28 -341.27 C27.71 -358.61, 27.74 -366.39, 31.44 -375.13 C35.15 -383.86, 40 -388.83, 45.53 -393.69 C51.07 -398.56, 57.17 -402.68, 64.67 -404.3 C72.18 -405.92, 82.88 -405.92, 90.57 -403.41 C98.26 -400.91, 102.74 -394.71, 110.8 -389.26 C118.86 -383.81, 127.13 -376.72, 138.95 -370.7 C150.77 -364.68, 168.14 -356.8, 181.72 -353.15 C195.29 -349.5, 206.58 -348.58, 220.4 -348.79 C234.23 -349, 250.25 -350.67, 264.66 -354.41 C279.08 -358.16, 294.75 -364.72, 306.88 -371.27 C319.01 -377.83, 329.19 -388.34, 337.43 -393.76 C345.66 -399.17, 348.94 -402.11, 356.29 -403.75 C363.63 -405.39, 374.02 -405.5, 381.49 -403.6 C388.96 -401.69, 395.79 -397.63, 401.12 -392.34 C406.44 -387.05, 409.56 -382.81, 413.44 -371.85 C417.33 -360.88, 416.49 -356.82, 424.43 -326.57 C432.38 -296.32, 450.43 -230.38, 461.13 -190.34 C471.82 -150.29, 482.98 -107.38, 488.61 -86.29 C494.24 -65.21, 492.95 -67.95, 494.89 -63.84 C496.83 -59.72, 494.68 -61.99, 500.24 -61.59 C505.8 -61.18, 519.56 -61.62, 528.25 -61.38 C536.95 -61.15, 545.79 -62.08, 552.4 -60.15 C559.02 -58.23, 564.12 -54.64, 567.93 -49.83 C571.73 -45.02, 574.84 -37.47, 575.24 -31.29 C575.64 -25.11, 573.73 -17.78, 570.32 -12.76 C566.92 -7.74, 564.16 -3.34, 554.82 -1.18 C545.47 0.98, 541.4 -0.03, 514.26 0.2 C487.11 0.43, 435.01 0.2, 391.96 0.2 C348.9 0.2, 306.01 0.2, 255.9 0.2 C205.8 0.2, 133.97 0.24, 91.32 0.2 C48.67 0.17, 15.22 0.03, 0 0" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(130.13598617979824 378.6960925520084) rotate(0 232.49055193772256 6.126320767503785)"><path d="M0 0 C-12.5 0, -60.22 0, -75 0 C-89.78 0, -85.38 -0.83, -88.68 0 C-91.97 0.83, -94.25 3.02, -94.75 4.96 C-95.24 6.89, -95.63 10.4, -91.64 11.62 C-87.64 12.83, -83.37 12.15, -70.78 12.25 C-58.19 12.36, -46.17 12.25, -16.07 12.25 C14.02 12.25, 60.7 12.25, 109.78 12.25 C158.86 12.25, 225.12 12.25, 278.39 12.25 C331.65 12.25, 392.17 12.25, 429.38 12.25 C466.58 12.25, 481.74 12.25, 501.61 12.25 C521.49 12.25, 538.93 12.82, 548.62 12.25 C558.31 11.68, 558.28 10.65, 559.73 8.83 C561.17 7.01, 560.99 2.78, 557.28 1.36 C553.58 -0.06, 550.18 0.48, 537.49 0.31 C524.81 0.13, 512.86 0.31, 481.17 0.31 C449.47 0.31, 388.45 0.31, 347.33 0.31 C306.21 0.31, 271.52 0.31, 234.44 0.31 C197.35 0.31, 163.88 0.36, 124.8 0.31 C85.73 0.26, 20.8 0.05, 0 0 M0 0 C-12.5 0, -60.22 0, -75 0 C-89.78 0, -85.38 -0.83, -88.68 0 C-91.97 0.83, -94.25 3.02, -94.75 4.96 C-95.24 6.89, -95.63 10.4, -91.64 11.62 C-87.64 12.83, -83.37 12.15, -70.78 12.25 C-58.19 12.36, -46.17 12.25, -16.07 12.25 C14.02 12.25, 60.7 12.25, 109.78 12.25 C158.86 12.25, 225.12 12.25, 278.39 12.25 C331.65 12.25, 392.17 12.25, 429.38 12.25 C466.58 12.25, 481.74 12.25, 501.61 12.25 C521.49 12.25, 538.93 12.82, 548.62 12.25 C558.31 11.68, 558.28 10.65, 559.73 8.83 C561.17 7.01, 560.99 2.78, 557.28 1.36 C553.58 -0.06, 550.18 0.48, 537.49 0.31 C524.81 0.13, 512.86 0.31, 481.17 0.31 C449.47 0.31, 388.45 0.31, 347.33 0.31 C306.21 0.31, 271.52 0.31, 234.44 0.31 C197.35 0.31, 163.88 0.36, 124.8 0.31 C85.73 0.26, 20.8 0.05, 0 0" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-5"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(138.4908349322891 269.0846381145998) rotate(0 224.82680152887474 -74.16227459702031)"><path d="M0 0 C3.25 -12.63, 11.83 -46.43, 19.49 -75.79 C27.15 -105.14, 39.77 -152.74, 45.98 -176.14 C52.19 -199.55, 53.14 -207.17, 56.76 -216.21 C60.39 -225.26, 63.38 -227.45, 67.75 -230.42 C72.12 -233.4, 78.59 -234.78, 82.98 -234.06 C87.36 -233.34, 88.33 -230.43, 94.06 -226.1 C99.8 -221.77, 107.08 -214.24, 117.39 -208.06 C127.71 -201.89, 144.81 -193.44, 155.95 -189.03 C167.08 -184.63, 173.23 -183.65, 184.19 -181.63 C195.14 -179.61, 208.76 -177.02, 221.69 -176.92 C234.63 -176.83, 248.36 -178.29, 261.79 -181.06 C275.23 -183.83, 289.18 -187.93, 302.32 -193.53 C315.45 -199.12, 330.44 -208.16, 340.62 -214.63 C350.8 -221.1, 357.24 -229.43, 363.4 -232.34 C369.55 -235.26, 373.05 -233.93, 377.56 -232.14 C382.07 -230.36, 386.85 -229.06, 390.46 -221.65 C394.07 -214.24, 395.57 -201.96, 399.19 -187.67 C402.82 -173.38, 406.29 -158.16, 412.23 -135.93 C418.16 -113.71, 428.39 -78.21, 434.8 -54.32 C441.22 -30.44, 445.63 -12.37, 450.71 7.36 C455.79 27.08, 462.18 51.4, 465.28 64.02 C468.38 76.64, 469.74 79.53, 469.33 83.07 C468.91 86.61, 470.22 85.03, 462.77 85.25 C455.31 85.47, 450.86 84.51, 424.59 84.4 C398.33 84.28, 347.08 84.36, 305.15 84.58 C263.23 84.79, 219.66 85.51, 173.05 85.7 C126.45 85.89, 57.62 85.81, 25.5 85.73 C-6.62 85.65, -12.2 87.09, -19.67 85.21 C-27.14 83.33, -20.58 80.95, -19.31 74.44 C-18.05 67.92, -15.33 58.54, -12.11 46.14 C-8.89 33.73, -2.02 7.69, 0 0 M0 0 C3.25 -12.63, 11.83 -46.43, 19.49 -75.79 C27.15 -105.14, 39.77 -152.74, 45.98 -176.14 C52.19 -199.55, 53.14 -207.17, 56.76 -216.21 C60.39 -225.26, 63.38 -227.45, 67.75 -230.42 C72.12 -233.4, 78.59 -234.78, 82.98 -234.06 C87.36 -233.34, 88.33 -230.43, 94.06 -226.1 C99.8 -221.77, 107.08 -214.24, 117.39 -208.06 C127.71 -201.89, 144.81 -193.44, 155.95 -189.03 C167.08 -184.63, 173.23 -183.65, 184.19 -181.63 C195.14 -179.61, 208.76 -177.02, 221.69 -176.92 C234.63 -176.83, 248.36 -178.29, 261.79 -181.06 C275.23 -183.83, 289.18 -187.93, 302.32 -193.53 C315.45 -199.12, 330.44 -208.16, 340.62 -214.63 C350.8 -221.1, 357.24 -229.43, 363.4 -232.34 C369.55 -235.26, 373.05 -233.93, 377.56 -232.14 C382.07 -230.36, 386.85 -229.06, 390.46 -221.65 C394.07 -214.24, 395.57 -201.96, 399.19 -187.67 C402.82 -173.38, 406.29 -158.16, 412.23 -135.93 C418.16 -113.71, 428.39 -78.21, 434.8 -54.32 C441.22 -30.44, 445.63 -12.37, 450.71 7.36 C455.79 27.08, 462.18 51.4, 465.28 64.02 C468.38 76.64, 469.74 79.53, 469.33 83.07 C468.91 86.61, 470.22 85.03, 462.77 85.25 C455.31 85.47, 450.86 84.51, 424.59 84.4 C398.33 84.28, 347.08 84.36, 305.15 84.58 C263.23 84.79, 219.66 85.51, 173.05 85.7 C126.45 85.89, 57.62 85.81, 25.5 85.73 C-6.62 85.65, -12.2 87.09, -19.67 85.21 C-27.14 83.33, -20.58 80.95, -19.31 74.44 C-18.05 67.92, -15.33 58.54, -12.11 46.14 C-8.89 33.73, -2.02 7.69, 0 0" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(507.39154370300275 173.12310150149915) rotate(0 21.25794848773512 37.05124680542963)"><path d="M0 0 C1.85 8.34, 6.73 30.91, 11.09 50.04 C15.45 69.18, 21.69 96.33, 26.18 114.81 C30.67 133.3, 34.55 151.89, 38.01 160.95 C41.47 170.02, 43.39 168.31, 46.92 169.2 C50.46 170.09, 56.71 168.67, 59.23 166.31 C61.75 163.95, 62.88 162.58, 62.05 155.05 C61.22 147.53, 57.98 136.94, 54.25 121.17 C50.52 105.39, 44.93 82.71, 39.66 60.42 C34.39 38.12, 27.73 9.1, 22.63 -12.6 C17.54 -34.31, 12.01 -57.49, 9.1 -69.83 C6.19 -82.18, 7.02 -82.51, 5.18 -86.67 C3.34 -90.83, 0.8 -93.38, -1.95 -94.79 C-4.69 -96.19, -8.57 -96.1, -11.29 -95.1 C-14.01 -94.1, -16.91 -91.65, -18.28 -88.81 C-19.65 -85.97, -20.43 -84.5, -19.53 -78.07 C-18.63 -71.64, -16.15 -63.24, -12.9 -50.23 C-9.64 -37.22, -2.15 -8.37, 0 0 M0 0 C1.85 8.34, 6.73 30.91, 11.09 50.04 C15.45 69.18, 21.69 96.33, 26.18 114.81 C30.67 133.3, 34.55 151.89, 38.01 160.95 C41.47 170.02, 43.39 168.31, 46.92 169.2 C50.46 170.09, 56.71 168.67, 59.23 166.31 C61.75 163.95, 62.88 162.58, 62.05 155.05 C61.22 147.53, 57.98 136.94, 54.25 121.17 C50.52 105.39, 44.93 82.71, 39.66 60.42 C34.39 38.12, 27.73 9.1, 22.63 -12.6 C17.54 -34.31, 12.01 -57.49, 9.1 -69.83 C6.19 -82.18, 7.02 -82.51, 5.18 -86.67 C3.34 -90.83, 0.8 -93.38, -1.95 -94.79 C-4.69 -96.19, -8.57 -96.1, -11.29 -95.1 C-14.01 -94.1, -16.91 -91.65, -18.28 -88.81 C-19.65 -85.97, -20.43 -84.5, -19.53 -78.07 C-18.63 -71.64, -16.15 -63.24, -12.9 -50.23 C-9.64 -37.22, -2.15 -8.37, 0 0" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-7"></path></g></g><mask></mask></svg>
         `,
        css: `
     /***************************************************
 * Generated by SVG Artista on 9/8/2025, 2:14:14 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 559.2950439453125px;
  stroke-dasharray: 559.2950439453125px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 0;
}

svg .svg-elem-2 {
  stroke-dashoffset: 559.2950439453125px;
  stroke-dasharray: 559.2950439453125px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 0;
}

svg .svg-elem-3 {
  stroke-dashoffset: 3374.318603515625px;
  stroke-dasharray: 3374.318603515625px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 0;
}

svg .svg-elem-4 {
  stroke-dashoffset: 4045.93115234375px;
  stroke-dasharray: 4045.93115234375px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 0;
}

svg .svg-elem-5 {
  stroke-dashoffset: 2650.217041015625px;
  stroke-dasharray: 2650.217041015625px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 0;
}

svg .svg-elem-6 {
  stroke-dashoffset: 2993.23291015625px;
  stroke-dasharray: 2993.23291015625px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 0;
}

svg .svg-elem-7 {
  stroke-dashoffset: 1150.0133056640625px;
  stroke-dasharray: 1150.0133056640625px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 0;
}

        `,
    },
    {
        name: "UTILITY",
        svg: `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 205.41554138474748 205.52541582861704" width="205.41554260253906" height="205.52542114257812" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round" transform="translate(158.52513562486456 17.33935284301151) rotate(0 5.01734035791651 5.01734035791651)"><path d="M10.03 5.02 C10.03 5.31, 10.01 5.6, 9.96 5.89 C9.91 6.17, 9.83 6.46, 9.73 6.73 C9.63 7.01, 9.51 7.27, 9.36 7.53 C9.22 7.78, 9.05 8.02, 8.86 8.24 C8.67 8.46, 8.46 8.67, 8.24 8.86 C8.02 9.05, 7.78 9.22, 7.53 9.36 C7.27 9.51, 7.01 9.63, 6.73 9.73 C6.46 9.83, 6.17 9.91, 5.89 9.96 C5.6 10.01, 5.31 10.03, 5.02 10.03 C4.73 10.03, 4.43 10.01, 4.15 9.96 C3.86 9.91, 3.57 9.83, 3.3 9.73 C3.03 9.63, 2.76 9.51, 2.51 9.36 C2.26 9.22, 2.01 9.05, 1.79 8.86 C1.57 8.67, 1.36 8.46, 1.17 8.24 C0.99 8.02, 0.82 7.78, 0.67 7.53 C0.53 7.27, 0.4 7.01, 0.3 6.73 C0.2 6.46, 0.13 6.17, 0.08 5.89 C0.03 5.6, 0 5.31, 0 5.02 C0 4.73, 0.03 4.43, 0.08 4.15 C0.13 3.86, 0.2 3.57, 0.3 3.3 C0.4 3.03, 0.53 2.76, 0.67 2.51 C0.82 2.26, 0.99 2.01, 1.17 1.79 C1.36 1.57, 1.57 1.36, 1.79 1.17 C2.01 0.99, 2.26 0.82, 2.51 0.67 C2.76 0.53, 3.03 0.4, 3.3 0.3 C3.57 0.2, 3.86 0.13, 4.15 0.08 C4.43 0.03, 4.73 0, 5.02 0 C5.31 0, 5.6 0.03, 5.89 0.08 C6.17 0.13, 6.46 0.2, 6.73 0.3 C7.01 0.4, 7.27 0.53, 7.53 0.67 C7.78 0.82, 8.02 0.99, 8.24 1.17 C8.46 1.36, 8.67 1.57, 8.86 1.79 C9.05 2.01, 9.22 2.26, 9.36 2.51 C9.51 2.76, 9.63 3.03, 9.73 3.3 C9.83 3.57, 9.91 3.86, 9.96 4.15 C10.01 4.43, 10.02 4.87, 10.03 5.02 C10.05 5.16, 10.05 4.87, 10.03 5.02" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-1"></path></g><g stroke-linecap="round" transform="translate(178.03507443145463 46.80431115775718) rotate(0 5.01734035791651 5.01734035791651)"><path d="M10.03 5.02 C10.03 5.31, 10.01 5.6, 9.96 5.89 C9.91 6.17, 9.83 6.46, 9.73 6.73 C9.63 7.01, 9.51 7.27, 9.36 7.53 C9.22 7.78, 9.05 8.02, 8.86 8.24 C8.67 8.46, 8.46 8.67, 8.24 8.86 C8.02 9.05, 7.78 9.22, 7.53 9.36 C7.27 9.51, 7.01 9.63, 6.73 9.73 C6.46 9.83, 6.17 9.91, 5.89 9.96 C5.6 10.01, 5.31 10.03, 5.02 10.03 C4.73 10.03, 4.43 10.01, 4.15 9.96 C3.86 9.91, 3.57 9.83, 3.3 9.73 C3.03 9.63, 2.76 9.51, 2.51 9.36 C2.26 9.22, 2.01 9.05, 1.79 8.86 C1.57 8.67, 1.36 8.46, 1.17 8.24 C0.99 8.02, 0.82 7.78, 0.67 7.53 C0.53 7.27, 0.4 7.01, 0.3 6.73 C0.2 6.46, 0.13 6.17, 0.08 5.89 C0.03 5.6, 0 5.31, 0 5.02 C0 4.73, 0.03 4.43, 0.08 4.15 C0.13 3.86, 0.2 3.57, 0.3 3.3 C0.4 3.03, 0.53 2.76, 0.67 2.51 C0.82 2.26, 0.99 2.01, 1.17 1.79 C1.36 1.57, 1.57 1.36, 1.79 1.17 C2.01 0.99, 2.26 0.82, 2.51 0.67 C2.76 0.53, 3.03 0.4, 3.3 0.3 C3.57 0.2, 3.86 0.13, 4.15 0.08 C4.43 0.03, 4.73 0, 5.02 0 C5.31 0, 5.6 0.03, 5.89 0.08 C6.17 0.13, 6.46 0.2, 6.73 0.3 C7.01 0.4, 7.27 0.53, 7.53 0.67 C7.78 0.82, 8.02 0.99, 8.24 1.17 C8.46 1.36, 8.67 1.57, 8.86 1.79 C9.05 2.01, 9.22 2.26, 9.36 2.51 C9.51 2.76, 9.63 3.03, 9.73 3.3 C9.83 3.57, 9.91 3.86, 9.96 4.15 C10.01 4.43, 10.02 4.87, 10.03 5.02 C10.05 5.16, 10.05 4.87, 10.03 5.02" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-2"></path></g><g stroke-linecap="round" transform="translate(178.10875506798402 97.79537842411264) rotate(0 5.01734035791651 5.01734035791651)"><path d="M10.03 5.02 C10.03 5.31, 10.01 5.6, 9.96 5.89 C9.91 6.17, 9.83 6.46, 9.73 6.73 C9.63 7.01, 9.51 7.27, 9.36 7.53 C9.22 7.78, 9.05 8.02, 8.86 8.24 C8.67 8.46, 8.46 8.67, 8.24 8.86 C8.02 9.05, 7.78 9.22, 7.53 9.36 C7.27 9.51, 7.01 9.63, 6.73 9.73 C6.46 9.83, 6.17 9.91, 5.89 9.96 C5.6 10.01, 5.31 10.03, 5.02 10.03 C4.73 10.03, 4.43 10.01, 4.15 9.96 C3.86 9.91, 3.57 9.83, 3.3 9.73 C3.03 9.63, 2.76 9.51, 2.51 9.36 C2.26 9.22, 2.01 9.05, 1.79 8.86 C1.57 8.67, 1.36 8.46, 1.17 8.24 C0.99 8.02, 0.82 7.78, 0.67 7.53 C0.53 7.27, 0.4 7.01, 0.3 6.73 C0.2 6.46, 0.13 6.17, 0.08 5.89 C0.03 5.6, 0 5.31, 0 5.02 C0 4.73, 0.03 4.43, 0.08 4.15 C0.13 3.86, 0.2 3.57, 0.3 3.3 C0.4 3.03, 0.53 2.76, 0.67 2.51 C0.82 2.26, 0.99 2.01, 1.17 1.79 C1.36 1.57, 1.57 1.36, 1.79 1.17 C2.01 0.99, 2.26 0.82, 2.51 0.67 C2.76 0.53, 3.03 0.4, 3.3 0.3 C3.57 0.2, 3.86 0.13, 4.15 0.08 C4.43 0.03, 4.73 0, 5.02 0 C5.31 0, 5.6 0.03, 5.89 0.08 C6.17 0.13, 6.46 0.2, 6.73 0.3 C7.01 0.4, 7.27 0.53, 7.53 0.67 C7.78 0.82, 8.02 0.99, 8.24 1.17 C8.46 1.36, 8.67 1.57, 8.86 1.79 C9.05 2.01, 9.22 2.26, 9.36 2.51 C9.51 2.76, 9.63 3.03, 9.73 3.3 C9.83 3.57, 9.91 3.86, 9.96 4.15 C10.01 4.43, 10.02 4.87, 10.03 5.02 C10.05 5.16, 10.05 4.87, 10.03 5.02" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-3"></path></g><g stroke-linecap="round" transform="translate(178.178920888804 148.696124697326) rotate(0 5.01734035791651 5.01734035791651)"><path d="M10.03 5.02 C10.03 5.31, 10.01 5.6, 9.96 5.89 C9.91 6.17, 9.83 6.46, 9.73 6.73 C9.63 7.01, 9.51 7.27, 9.36 7.53 C9.22 7.78, 9.05 8.02, 8.86 8.24 C8.67 8.46, 8.46 8.67, 8.24 8.86 C8.02 9.05, 7.78 9.22, 7.53 9.36 C7.27 9.51, 7.01 9.63, 6.73 9.73 C6.46 9.83, 6.17 9.91, 5.89 9.96 C5.6 10.01, 5.31 10.03, 5.02 10.03 C4.73 10.03, 4.43 10.01, 4.15 9.96 C3.86 9.91, 3.57 9.83, 3.3 9.73 C3.03 9.63, 2.76 9.51, 2.51 9.36 C2.26 9.22, 2.01 9.05, 1.79 8.86 C1.57 8.67, 1.36 8.46, 1.17 8.24 C0.99 8.02, 0.82 7.78, 0.67 7.53 C0.53 7.27, 0.4 7.01, 0.3 6.73 C0.2 6.46, 0.13 6.17, 0.08 5.89 C0.03 5.6, 0 5.31, 0 5.02 C0 4.73, 0.03 4.43, 0.08 4.15 C0.13 3.86, 0.2 3.57, 0.3 3.3 C0.4 3.03, 0.53 2.76, 0.67 2.51 C0.82 2.26, 0.99 2.01, 1.17 1.79 C1.36 1.57, 1.57 1.36, 1.79 1.17 C2.01 0.99, 2.26 0.82, 2.51 0.67 C2.76 0.53, 3.03 0.4, 3.3 0.3 C3.57 0.2, 3.86 0.13, 4.15 0.08 C4.43 0.03, 4.73 0, 5.02 0 C5.31 0, 5.6 0.03, 5.89 0.08 C6.17 0.13, 6.46 0.2, 6.73 0.3 C7.01 0.4, 7.27 0.53, 7.53 0.67 C7.78 0.82, 8.02 0.99, 8.24 1.17 C8.46 1.36, 8.67 1.57, 8.86 1.79 C9.05 2.01, 9.22 2.26, 9.36 2.51 C9.51 2.76, 9.63 3.03, 9.73 3.3 C9.83 3.57, 9.91 3.86, 9.96 4.15 C10.01 4.43, 10.02 4.87, 10.03 5.02 C10.05 5.16, 10.05 4.87, 10.03 5.02" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-4"></path></g><g stroke-linecap="round" transform="translate(158.57875490090555 178.2849910696841) rotate(0 5.01734035791651 5.01734035791651)"><path d="M10.03 5.02 C10.03 5.31, 10.01 5.6, 9.96 5.89 C9.91 6.17, 9.83 6.46, 9.73 6.73 C9.63 7.01, 9.51 7.27, 9.36 7.53 C9.22 7.78, 9.05 8.02, 8.86 8.24 C8.67 8.46, 8.46 8.67, 8.24 8.86 C8.02 9.05, 7.78 9.22, 7.53 9.36 C7.27 9.51, 7.01 9.63, 6.73 9.73 C6.46 9.83, 6.17 9.91, 5.89 9.96 C5.6 10.01, 5.31 10.03, 5.02 10.03 C4.73 10.03, 4.43 10.01, 4.15 9.96 C3.86 9.91, 3.57 9.83, 3.3 9.73 C3.03 9.63, 2.76 9.51, 2.51 9.36 C2.26 9.22, 2.01 9.05, 1.79 8.86 C1.57 8.67, 1.36 8.46, 1.17 8.24 C0.99 8.02, 0.82 7.78, 0.67 7.53 C0.53 7.27, 0.4 7.01, 0.3 6.73 C0.2 6.46, 0.13 6.17, 0.08 5.89 C0.03 5.6, 0 5.31, 0 5.02 C0 4.73, 0.03 4.43, 0.08 4.15 C0.13 3.86, 0.2 3.57, 0.3 3.3 C0.4 3.03, 0.53 2.76, 0.67 2.51 C0.82 2.26, 0.99 2.01, 1.17 1.79 C1.36 1.57, 1.57 1.36, 1.79 1.17 C2.01 0.99, 2.26 0.82, 2.51 0.67 C2.76 0.53, 3.03 0.4, 3.3 0.3 C3.57 0.2, 3.86 0.13, 4.15 0.08 C4.43 0.03, 4.73 0, 5.02 0 C5.31 0, 5.6 0.03, 5.89 0.08 C6.17 0.13, 6.46 0.2, 6.73 0.3 C7.01 0.4, 7.27 0.53, 7.53 0.67 C7.78 0.82, 8.02 0.99, 8.24 1.17 C8.46 1.36, 8.67 1.57, 8.86 1.79 C9.05 2.01, 9.22 2.26, 9.36 2.51 C9.51 2.76, 9.63 3.03, 9.73 3.3 C9.83 3.57, 9.91 3.86, 9.96 4.15 C10.01 4.43, 10.02 4.87, 10.03 5.02 C10.05 5.16, 10.05 4.87, 10.03 5.02" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-5"></path></g><g stroke-linecap="round"><g transform="translate(83.13302869812105 97.31336776754324) rotate(0 19.61578803867451 5.512365933795081)"><path d="M0 0 C-0.12 0.61, -0.64 2.33, -0.74 3.63 C-0.85 4.94, -0.78 6.44, -0.6 7.83 C-0.43 9.22, -0.19 10.58, 0.3 11.99 C0.79 13.39, 1.48 14.9, 2.34 16.26 C3.2 17.63, 4.28 19.04, 5.44 20.18 C6.6 21.31, 8.11 22.3, 9.32 23.05 C10.54 23.81, 11.42 24.25, 12.73 24.7 C14.05 25.15, 15.59 25.57, 17.19 25.74 C18.8 25.91, 20.67 25.95, 22.37 25.72 C24.06 25.49, 25.89 24.96, 27.36 24.37 C28.84 23.78, 29.96 23.09, 31.21 22.17 C32.46 21.25, 33.78 20.11, 34.88 18.82 C35.98 17.54, 37.08 15.83, 37.81 14.44 C38.54 13.04, 38.91 11.74, 39.26 10.45 C39.6 9.16, 39.74 7.71, 39.87 6.72 C40 5.73, 39.92 5.12, 40.05 4.53 C40.19 3.94, 40.34 3.59, 40.69 3.18 C41.05 2.78, 41.68 2.32, 42.18 2.1 C42.67 1.88, 43.13 1.78, 43.67 1.84 C44.2 1.9, 44.88 2.09, 45.39 2.46 C45.9 2.83, 46.46 3.46, 46.73 4.07 C47.01 4.68, 47.05 5.18, 47.05 6.11 C47.06 7.04, 46.98 8.35, 46.76 9.66 C46.53 10.97, 46.2 12.49, 45.71 13.95 C45.23 15.42, 44.75 16.89, 43.85 18.46 C42.96 20.03, 41.67 21.84, 40.34 23.37 C39.02 24.91, 37.37 26.51, 35.92 27.66 C34.46 28.8, 33.02 29.54, 31.6 30.24 C30.19 30.94, 28.88 31.41, 27.43 31.84 C25.99 32.27, 24.76 32.64, 22.93 32.81 C21.11 32.99, 18.61 33.12, 16.49 32.89 C14.37 32.66, 12.21 32.15, 10.21 31.43 C8.21 30.71, 6.16 29.64, 4.5 28.58 C2.85 27.53, 1.55 26.36, 0.27 25.1 C-1 23.84, -2.22 22.31, -3.15 21.02 C-4.08 19.72, -4.67 18.71, -5.31 17.33 C-5.94 15.94, -6.55 14.2, -6.97 12.7 C-7.39 11.2, -7.69 10.12, -7.82 8.32 C-7.96 6.51, -7.97 3.76, -7.77 1.86 C-7.56 -0.05, -7.35 -1.18, -6.6 -3.13 C-5.85 -5.07, -4.6 -7.8, -3.27 -9.81 C-1.93 -11.81, -0.19 -13.7, 1.39 -15.16 C2.96 -16.61, 4.39 -17.56, 6.19 -18.53 C7.98 -19.5, 10.43 -20.42, 12.14 -20.98 C13.85 -21.53, 15.07 -21.71, 16.44 -21.86 C17.81 -22, 19.38 -22.06, 20.34 -21.86 C21.31 -21.67, 21.76 -21.26, 22.21 -20.69 C22.66 -20.13, 23.03 -19.2, 23.05 -18.46 C23.07 -17.72, 22.75 -16.83, 22.33 -16.25 C21.9 -15.67, 21.38 -15.27, 20.47 -15 C19.57 -14.73, 18.15 -14.84, 16.9 -14.63 C15.65 -14.42, 14.21 -14.18, 12.95 -13.75 C11.68 -13.33, 10.6 -12.89, 9.31 -12.07 C8.02 -11.25, 6.38 -10.01, 5.2 -8.85 C4.02 -7.7, 2.96 -6.22, 2.24 -5.16 C1.52 -4.09, 1.26 -3.32, 0.88 -2.46 C0.51 -1.6, 0.15 -0.41, 0 0 M0 0 C-0.12 0.61, -0.64 2.33, -0.74 3.63 C-0.85 4.94, -0.78 6.44, -0.6 7.83 C-0.43 9.22, -0.19 10.58, 0.3 11.99 C0.79 13.39, 1.48 14.9, 2.34 16.26 C3.2 17.63, 4.28 19.04, 5.44 20.18 C6.6 21.31, 8.11 22.3, 9.32 23.05 C10.54 23.81, 11.42 24.25, 12.73 24.7 C14.05 25.15, 15.59 25.57, 17.19 25.74 C18.8 25.91, 20.67 25.95, 22.37 25.72 C24.06 25.49, 25.89 24.96, 27.36 24.37 C28.84 23.78, 29.96 23.09, 31.21 22.17 C32.46 21.25, 33.78 20.11, 34.88 18.82 C35.98 17.54, 37.08 15.83, 37.81 14.44 C38.54 13.04, 38.91 11.74, 39.26 10.45 C39.6 9.16, 39.74 7.71, 39.87 6.72 C40 5.73, 39.92 5.12, 40.05 4.53 C40.19 3.94, 40.34 3.59, 40.69 3.18 C41.05 2.78, 41.68 2.32, 42.18 2.1 C42.67 1.88, 43.13 1.78, 43.67 1.84 C44.2 1.9, 44.88 2.09, 45.39 2.46 C45.9 2.83, 46.46 3.46, 46.73 4.07 C47.01 4.68, 47.05 5.18, 47.05 6.11 C47.06 7.04, 46.98 8.35, 46.76 9.66 C46.53 10.97, 46.2 12.49, 45.71 13.95 C45.23 15.42, 44.75 16.89, 43.85 18.46 C42.96 20.03, 41.67 21.84, 40.34 23.37 C39.02 24.91, 37.37 26.51, 35.92 27.66 C34.46 28.8, 33.02 29.54, 31.6 30.24 C30.19 30.94, 28.88 31.41, 27.43 31.84 C25.99 32.27, 24.76 32.64, 22.93 32.81 C21.11 32.99, 18.61 33.12, 16.49 32.89 C14.37 32.66, 12.21 32.15, 10.21 31.43 C8.21 30.71, 6.16 29.64, 4.5 28.58 C2.85 27.53, 1.55 26.36, 0.27 25.1 C-1 23.84, -2.22 22.31, -3.15 21.02 C-4.08 19.72, -4.67 18.71, -5.31 17.33 C-5.94 15.94, -6.55 14.2, -6.97 12.7 C-7.39 11.2, -7.69 10.12, -7.82 8.32 C-7.96 6.51, -7.97 3.76, -7.77 1.86 C-7.56 -0.05, -7.35 -1.18, -6.6 -3.13 C-5.85 -5.07, -4.6 -7.8, -3.27 -9.81 C-1.93 -11.81, -0.19 -13.7, 1.39 -15.16 C2.96 -16.61, 4.39 -17.56, 6.19 -18.53 C7.98 -19.5, 10.43 -20.42, 12.14 -20.98 C13.85 -21.53, 15.07 -21.71, 16.44 -21.86 C17.81 -22, 19.38 -22.06, 20.34 -21.86 C21.31 -21.67, 21.76 -21.26, 22.21 -20.69 C22.66 -20.13, 23.03 -19.2, 23.05 -18.46 C23.07 -17.72, 22.75 -16.83, 22.33 -16.25 C21.9 -15.67, 21.38 -15.27, 20.47 -15 C19.57 -14.73, 18.15 -14.84, 16.9 -14.63 C15.65 -14.42, 14.21 -14.18, 12.95 -13.75 C11.68 -13.33, 10.6 -12.89, 9.31 -12.07 C8.02 -11.25, 6.38 -10.01, 5.2 -8.85 C4.02 -7.7, 2.96 -6.22, 2.24 -5.16 C1.52 -4.09, 1.26 -3.32, 0.88 -2.46 C0.51 -1.6, 0.15 -0.41, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(75.31581080526848 82.9422049046716) rotate(0 27.40381215986963 19.818049380774937)"><path d="M0 0 C-0.41 0.69, -1.73 2.73, -2.47 4.11 C-3.2 5.49, -3.88 6.8, -4.43 8.29 C-4.98 9.77, -5.46 11.46, -5.77 13.02 C-6.08 14.58, -6.24 15.79, -6.3 17.64 C-6.37 19.49, -6.44 22.03, -6.18 24.11 C-5.92 26.2, -5.31 28.32, -4.73 30.17 C-4.16 32.01, -3.69 33.37, -2.73 35.19 C-1.77 37, -0.31 39.34, 1.04 41.05 C2.39 42.76, 3.68 44.04, 5.36 45.46 C7.04 46.88, 9.21 48.46, 11.12 49.57 C13.04 50.67, 14.89 51.45, 16.86 52.09 C18.82 52.73, 21.12 53.14, 22.91 53.4 C24.71 53.66, 26.52 53.51, 27.63 53.65 C28.73 53.8, 29.04 53.88, 29.54 54.27 C30.05 54.65, 30.43 55.45, 30.68 55.98 C30.92 56.5, 30.98 56.51, 31.03 57.41 C31.08 58.31, 30.97 60.18, 30.96 61.39 C30.94 62.6, 30.96 63.81, 30.96 64.67 C30.96 65.53, 30.93 66.15, 30.96 66.55 C30.98 66.95, 30.99 66.97, 31.12 67.06 C31.26 67.15, 31.23 67.1, 31.74 67.11 C32.26 67.11, 32.49 67.09, 34.22 67.08 C35.95 67.08, 37.31 67.08, 42.14 67.08 C46.96 67.08, 58.99 67.08, 63.16 67.08 C67.34 67.08, 66.16 67.08, 67.19 67.08 C68.22 67.08, 68.75 67.03, 69.35 67.08 C69.96 67.14, 70.4 67.22, 70.82 67.42 C71.25 67.61, 71.54 67.82, 71.9 68.25 C72.25 68.68, 72.51 69.21, 72.94 69.97 C73.38 70.73, 73.94 71.78, 74.51 72.83 C75.08 73.88, 75.68 74.98, 76.38 76.26 C77.08 77.54, 77.89 79.02, 78.71 80.51 C79.53 81.99, 80.61 83.92, 81.3 85.17 C82 86.42, 82.55 87.4, 82.9 88.03 C83.24 88.66, 83.19 88.79, 83.37 88.93 C83.54 89.07, 83.64 88.93, 83.96 88.85 C84.27 88.77, 84.67 88.57, 85.26 88.45 C85.85 88.32, 86.78 88.15, 87.49 88.1 C88.19 88.04, 88.77 88.06, 89.47 88.13 C90.18 88.21, 90.95 88.33, 91.7 88.55 C92.45 88.77, 93.28 89.08, 93.99 89.46 C94.7 89.83, 95.37 90.33, 95.96 90.82 C96.55 91.3, 97.05 91.8, 97.54 92.39 C98.04 92.98, 98.54 93.72, 98.91 94.36 C99.28 95, 99.52 95.44, 99.77 96.24 C100.03 97.04, 100.33 98.34, 100.44 99.15 C100.55 99.95, 100.53 100.27, 100.44 101.07 C100.35 101.88, 100.21 103.02, 99.9 103.99 C99.58 104.97, 99.14 106.03, 98.56 106.92 C97.98 107.82, 97.12 108.71, 96.41 109.38 C95.69 110.04, 95.1 110.45, 94.26 110.91 C93.42 111.36, 92.37 111.85, 91.37 112.11 C90.38 112.38, 89.37 112.49, 88.29 112.49 C87.22 112.49, 86.01 112.41, 84.93 112.1 C83.86 111.8, 82.72 111.18, 81.83 110.65 C80.94 110.12, 80.28 109.6, 79.61 108.9 C78.94 108.2, 78.32 107.34, 77.81 106.45 C77.29 105.56, 76.81 104.46, 76.52 103.57 C76.23 102.68, 76.12 102.02, 76.07 101.11 C76.01 100.2, 76.05 99.01, 76.19 98.09 C76.33 97.18, 76.65 96.29, 76.91 95.62 C77.17 94.95, 77.59 94.44, 77.73 94.08 C77.87 93.73, 77.84 93.76, 77.75 93.49 C77.67 93.23, 77.53 93.08, 77.2 92.5 C76.87 91.92, 76.42 91.16, 75.78 89.99 C75.14 88.83, 74.23 87.13, 73.35 85.53 C72.47 83.92, 71.39 81.97, 70.52 80.38 C69.65 78.79, 68.68 76.97, 68.15 75.99 C67.62 75.02, 67.53 74.86, 67.35 74.55 C67.17 74.24, 67.21 74.2, 67.08 74.13 C66.94 74.06, 67.14 74.11, 66.53 74.11 C65.92 74.11, 65.53 74.13, 63.43 74.14 C61.33 74.14, 57.78 74.14, 53.93 74.14 C50.08 74.14, 43.46 74.14, 40.34 74.14 C37.21 74.14, 36.51 74.14, 35.16 74.14 C33.81 74.14, 32.92 74.14, 32.25 74.14 C31.59 74.14, 31.37 74.09, 31.15 74.14 C30.93 74.18, 30.96 74.24, 30.93 74.4 C30.89 74.56, 30.93 74.29, 30.93 75.09 C30.93 75.9, 30.93 77.22, 30.93 79.25 C30.93 81.28, 30.93 84.14, 30.93 87.26 C30.93 90.39, 30.93 95.12, 30.93 98.01 C30.93 100.89, 30.93 102.81, 30.93 104.57 C30.93 106.33, 30.97 107.6, 30.93 108.55 C30.88 109.49, 30.86 109.71, 30.67 110.23 C30.47 110.76, 30.16 111.33, 29.74 111.68 C29.32 112.04, 28.76 112.24, 28.17 112.38 C27.57 112.52, 27.25 112.5, 26.16 112.53 C25.06 112.56, 23.85 112.56, 21.6 112.57 C19.34 112.57, 14.39 112.57, 12.64 112.57 C10.89 112.57, 11.54 112.6, 11.09 112.57 C10.63 112.53, 10.25 112.48, 9.88 112.34 C9.52 112.2, 9.18 111.96, 8.9 111.72 C8.62 111.48, 8.4 111.21, 8.2 110.91 C8.01 110.6, 7.82 110.28, 7.72 109.88 C7.62 109.48, 7.62 109.37, 7.6 108.52 C7.58 107.67, 7.6 106.11, 7.6 104.79 C7.6 103.48, 7.59 101.71, 7.6 100.61 C7.6 99.5, 7.64 98.62, 7.62 98.15 C7.6 97.67, 7.62 97.87, 7.47 97.75 C7.32 97.63, 7.34 97.61, 6.74 97.42 C6.13 97.23, 5 96.97, 3.86 96.61 C2.72 96.25, 1.42 95.81, -0.08 95.25 C-1.58 94.68, -3.7 93.84, -5.14 93.24 C-6.58 92.64, -7.66 92.13, -8.7 91.63 C-9.73 91.12, -10.68 90.6, -11.36 90.23 C-12.05 89.86, -12.43 89.61, -12.8 89.41 C-13.18 89.2, -13.41 89.05, -13.61 89 C-13.81 88.96, -13.76 88.93, -14.02 89.16 C-14.28 89.38, -14.59 89.75, -15.17 90.34 C-15.76 90.93, -16.84 92, -17.55 92.7 C-18.25 93.4, -18.76 93.9, -19.42 94.54 C-20.07 95.18, -20.92 96.07, -21.47 96.57 C-22.03 97.07, -22.33 97.34, -22.75 97.55 C-23.17 97.76, -23.56 97.81, -23.99 97.83 C-24.41 97.85, -24.84 97.81, -25.28 97.66 C-25.72 97.51, -26.06 97.39, -26.61 96.92 C-27.17 96.45, -27.9 95.58, -28.63 94.84 C-29.36 94.11, -30.1 93.37, -30.98 92.5 C-31.86 91.62, -32.9 90.59, -33.89 89.6 C-34.89 88.61, -35.86 87.65, -36.96 86.55 C-38.05 85.46, -39.13 84.33, -40.45 83 C-41.77 81.68, -43.58 79.87, -44.88 78.59 C-46.18 77.3, -47.4 76.12, -48.23 75.28 C-49.06 74.44, -49.49 73.99, -49.85 73.54 C-50.21 73.1, -50.27 72.96, -50.39 72.61 C-50.51 72.25, -50.6 71.86, -50.59 71.41 C-50.57 70.97, -50.49 70.35, -50.31 69.92 C-50.13 69.49, -50.01 69.38, -49.51 68.83 C-49 68.27, -48.2 67.49, -47.3 66.59 C-46.4 65.69, -44.92 64.23, -44.12 63.43 C-43.32 62.62, -42.86 62.15, -42.48 61.75 C-42.1 61.36, -41.96 61.26, -41.85 61.07 C-41.75 60.87, -41.8 60.77, -41.85 60.59 C-41.9 60.41, -41.91 60.46, -42.16 60.01 C-42.41 59.56, -42.87 58.78, -43.35 57.89 C-43.82 57, -44.48 55.82, -45.03 54.67 C-45.58 53.53, -46.1 52.32, -46.64 51.03 C-47.17 49.75, -47.76 48.29, -48.23 46.95 C-48.71 45.6, -49.14 44.14, -49.51 42.95 C-49.88 41.76, -50.25 40.36, -50.47 39.82 C-50.69 39.28, -50.42 39.72, -50.84 39.69 C-51.27 39.67, -51.77 39.67, -53.02 39.67 C-54.28 39.66, -57.13 39.67, -58.37 39.67 C-59.61 39.67, -59.8 39.68, -60.46 39.67 C-61.12 39.65, -61.8 39.7, -62.32 39.6 C-62.83 39.5, -63.19 39.3, -63.55 39.07 C-63.91 38.84, -64.25 38.52, -64.49 38.22 C-64.74 37.91, -64.88 37.72, -65.01 37.26 C-65.15 36.79, -65.24 36.79, -65.29 35.4 C-65.34 34.01, -65.29 31.29, -65.29 28.92 C-65.29 26.56, -65.29 23.95, -65.29 21.23 C-65.29 18.52, -65.29 15.31, -65.29 12.61 C-65.29 9.92, -65.29 6.61, -65.29 5.07 C-65.29 3.53, -65.35 3.87, -65.29 3.39 C-65.24 2.91, -65.14 2.58, -64.96 2.2 C-64.77 1.81, -64.52 1.41, -64.18 1.09 C-63.85 0.77, -63.43 0.46, -62.93 0.28 C-62.43 0.1, -62.02 0.05, -61.19 0.01 C-60.36 -0.04, -59.17 0.01, -57.96 0.01 C-56.74 0.01, -54.95 0.01, -53.89 0.01 C-52.83 0.01, -52.14 0.01, -51.61 0.01 C-51.08 0.01, -50.93 0.05, -50.74 0.01 C-50.55 -0.04, -50.57 -0.07, -50.46 -0.28 C-50.36 -0.48, -50.31 -0.58, -50.12 -1.21 C-49.92 -1.84, -49.63 -3.04, -49.31 -4.08 C-48.98 -5.12, -48.6 -6.24, -48.16 -7.44 C-47.73 -8.64, -47.24 -10.04, -46.72 -11.29 C-46.19 -12.55, -45.58 -13.79, -44.99 -14.99 C-44.4 -16.19, -43.65 -17.59, -43.17 -18.5 C-42.68 -19.41, -42.31 -19.98, -42.08 -20.45 C-41.85 -20.91, -41.76 -21.06, -41.78 -21.28 C-41.8 -21.5, -41.88 -21.45, -42.21 -21.78 C-42.54 -22.11, -43.2 -22.71, -43.76 -23.26 C-44.31 -23.81, -44.77 -24.3, -45.55 -25.09 C-46.33 -25.88, -47.72 -27.28, -48.44 -28.01 C-49.15 -28.74, -49.5 -29.07, -49.84 -29.48 C-50.17 -29.88, -50.32 -30.02, -50.45 -30.43 C-50.58 -30.84, -50.63 -31.49, -50.6 -31.94 C-50.58 -32.39, -50.53 -32.67, -50.3 -33.11 C-50.07 -33.54, -49.81 -33.89, -49.22 -34.54 C-48.64 -35.2, -47.7 -36.13, -46.78 -37.05 C-45.86 -37.97, -44.9 -38.88, -43.71 -40.06 C-42.52 -41.24, -41.58 -42.19, -39.64 -44.13 C-37.7 -46.07, -34.05 -49.75, -32.07 -51.71 C-30.1 -53.68, -28.82 -54.94, -27.8 -55.92 C-26.78 -56.9, -26.47 -57.25, -25.94 -57.61 C-25.41 -57.97, -25.08 -58.02, -24.62 -58.09 C-24.16 -58.15, -23.63 -58.12, -23.17 -57.98 C-22.72 -57.84, -22.37 -57.61, -21.9 -57.24 C-21.43 -56.88, -20.96 -56.38, -20.34 -55.79 C-19.73 -55.19, -18.97 -54.42, -18.21 -53.66 C-17.44 -52.9, -16.43 -51.91, -15.74 -51.22 C-15.06 -50.53, -14.47 -49.83, -14.1 -49.51 C-13.72 -49.19, -13.69 -49.29, -13.5 -49.3 C-13.3 -49.31, -13.35 -49.32, -12.9 -49.57 C-12.46 -49.82, -11.74 -50.3, -10.83 -50.8 C-9.93 -51.29, -8.75 -51.92, -7.46 -52.53 C-6.18 -53.14, -4.55 -53.89, -3.13 -54.47 C-1.72 -55.05, -0.31 -55.54, 1.03 -56 C2.38 -56.45, 3.93 -56.89, 4.95 -57.21 C5.97 -57.54, 6.72 -57.75, 7.15 -57.93 C7.59 -58.11, 7.47 -58.07, 7.54 -58.3 C7.62 -58.53, 7.59 -58.59, 7.6 -59.31 C7.61 -60.03, 7.6 -61.18, 7.6 -62.64 C7.6 -64.1, 7.56 -66.77, 7.6 -68.05 C7.64 -69.34, 7.68 -69.74, 7.84 -70.34 C8 -70.94, 8.25 -71.27, 8.56 -71.64 C8.87 -72.01, 9.27 -72.35, 9.68 -72.56 C10.09 -72.76, 10.32 -72.8, 11 -72.86 C11.69 -72.92, 11.91 -72.92, 13.81 -72.93 C15.71 -72.94, 20.41 -72.93, 22.41 -72.93 C24.41 -72.93, 24.87 -72.96, 25.82 -72.93 C26.77 -72.9, 27.49 -72.91, 28.12 -72.77 C28.75 -72.63, 29.19 -72.41, 29.59 -72.11 C30 -71.81, 30.31 -71.41, 30.54 -70.96 C30.77 -70.51, 30.88 -70.2, 30.95 -69.42 C31.02 -68.64, 30.96 -67.77, 30.96 -66.29 C30.96 -64.82, 30.96 -63.37, 30.96 -60.58 C30.96 -57.79, 30.96 -53.06, 30.96 -49.55 C30.96 -46.05, 30.96 -41.77, 30.96 -39.55 C30.96 -37.32, 30.96 -36.97, 30.96 -36.18 C30.96 -35.4, 30.92 -35.11, 30.96 -34.84 C31 -34.57, 30.96 -34.62, 31.2 -34.57 C31.44 -34.51, 31.39 -34.52, 32.41 -34.51 C33.43 -34.5, 34.35 -34.51, 37.33 -34.51 C40.31 -34.51, 46.02 -34.51, 50.31 -34.51 C54.6 -34.51, 60.4 -34.51, 63.05 -34.51 C65.71 -34.51, 65.56 -34.48, 66.24 -34.51 C66.92 -34.53, 66.92 -34.53, 67.13 -34.66 C67.34 -34.78, 67.19 -34.68, 67.51 -35.25 C67.82 -35.81, 68.33 -36.77, 69.03 -38.07 C69.72 -39.36, 70.62 -41.03, 71.7 -43 C72.79 -44.97, 74.56 -48.13, 75.54 -49.89 C76.52 -51.64, 77.21 -52.79, 77.57 -53.55 C77.94 -54.32, 77.8 -54.18, 77.74 -54.49 C77.67 -54.8, 77.41 -54.9, 77.19 -55.41 C76.96 -55.92, 76.58 -56.85, 76.39 -57.55 C76.2 -58.26, 76.08 -58.8, 76.05 -59.63 C76.02 -60.46, 76.02 -61.49, 76.22 -62.53 C76.41 -63.57, 76.75 -64.88, 77.21 -65.89 C77.68 -66.91, 78.32 -67.8, 79.03 -68.6 C79.74 -69.4, 80.65 -70.12, 81.48 -70.7 C82.32 -71.28, 83.15 -71.74, 84.03 -72.07 C84.91 -72.4, 85.71 -72.6, 86.74 -72.69 C87.77 -72.78, 89.12 -72.79, 90.21 -72.62 C91.31 -72.46, 92.33 -72.14, 93.31 -71.71 C94.28 -71.28, 95.26 -70.68, 96.05 -70.05 C96.85 -69.43, 97.5 -68.7, 98.07 -67.96 C98.64 -67.23, 99.08 -66.56, 99.46 -65.64 C99.83 -64.72, 100.15 -63.43, 100.32 -62.45 C100.5 -61.47, 100.57 -60.69, 100.51 -59.76 C100.45 -58.83, 100.38 -57.97, 99.97 -56.87 C99.57 -55.77, 98.91 -54.28, 98.06 -53.18 C97.2 -52.09, 96.02 -51.05, 94.86 -50.3 C93.69 -49.55, 92.16 -49.01, 91.06 -48.68 C89.97 -48.36, 89.18 -48.34, 88.29 -48.34 C87.41 -48.33, 86.52 -48.52, 85.76 -48.66 C84.99 -48.81, 84.13 -49.15, 83.71 -49.22 C83.29 -49.3, 83.4 -49.28, 83.24 -49.12 C83.08 -48.96, 83.12 -48.89, 82.77 -48.26 C82.42 -47.62, 81.72 -46.38, 81.12 -45.31 C80.53 -44.24, 79.92 -43.13, 79.22 -41.84 C78.52 -40.56, 77.75 -39.1, 76.9 -37.59 C76.06 -36.08, 74.94 -34.15, 74.18 -32.77 C73.41 -31.39, 72.76 -30.05, 72.31 -29.32 C71.85 -28.58, 71.81 -28.62, 71.45 -28.35 C71.09 -28.07, 70.8 -27.81, 70.15 -27.69 C69.5 -27.57, 69.63 -27.63, 67.56 -27.62 C65.48 -27.61, 61.2 -27.62, 57.68 -27.62 C54.16 -27.62, 50.35 -27.62, 46.44 -27.62 C42.54 -27.62, 36.61 -27.62, 34.27 -27.62 C31.93 -27.62, 32.88 -27.62, 32.38 -27.62 C31.88 -27.62, 31.48 -27.68, 31.26 -27.62 C31.04 -27.57, 31.11 -27.69, 31.07 -27.29 C31.02 -26.89, 31 -26.04, 30.98 -25.23 C30.97 -24.42, 30.98 -23.12, 30.98 -22.43 C30.98 -21.74, 30.93 -21.38, 30.98 -21.1 C31.04 -20.82, 31.04 -20.83, 31.3 -20.75 C31.55 -20.67, 31.84 -20.7, 32.5 -20.61 C33.15 -20.53, 34.21 -20.45, 35.22 -20.24 C36.24 -20.03, 37.36 -19.75, 38.61 -19.36 C39.87 -18.97, 41.56 -18.39, 42.76 -17.92 C43.95 -17.45, 45.06 -16.89, 45.79 -16.54 C46.53 -16.19, 46.87 -15.98, 47.18 -15.84 C47.49 -15.69, 47.14 -15.7, 47.65 -15.66 C48.16 -15.62, 48.75 -15.62, 50.22 -15.62 C51.7 -15.61, 53.42 -15.62, 56.51 -15.62 C59.6 -15.62, 64.87 -15.62, 68.78 -15.62 C72.7 -15.62, 77.42 -15.62, 79.98 -15.62 C82.55 -15.62, 82.96 -15.62, 84.16 -15.62 C85.35 -15.62, 86.54 -15.55, 87.15 -15.62 C87.76 -15.68, 87.39 -15.61, 87.8 -15.99 C88.21 -16.37, 88.9 -17.13, 89.62 -17.87 C90.35 -18.61, 91.27 -19.55, 92.15 -20.43 C93.03 -21.31, 94.1 -22.4, 94.88 -23.17 C95.65 -23.95, 96.46 -24.63, 96.81 -25.06 C97.16 -25.48, 97.01 -25.47, 96.96 -25.72 C96.91 -25.97, 96.7 -26.16, 96.53 -26.55 C96.35 -26.94, 96.07 -27.36, 95.92 -28.07 C95.76 -28.78, 95.62 -29.93, 95.6 -30.83 C95.59 -31.73, 95.66 -32.64, 95.83 -33.48 C96 -34.33, 96.22 -35.04, 96.64 -35.9 C97.05 -36.77, 97.68 -37.87, 98.31 -38.69 C98.94 -39.5, 99.61 -40.16, 100.41 -40.78 C101.21 -41.41, 102.21 -42.03, 103.11 -42.43 C104.01 -42.83, 104.98 -43.01, 105.81 -43.16 C106.64 -43.31, 107.23 -43.36, 108.11 -43.32 C109 -43.28, 110.12 -43.21, 111.11 -42.94 C112.1 -42.66, 113.18 -42.17, 114.06 -41.66 C114.95 -41.15, 115.76 -40.53, 116.44 -39.86 C117.12 -39.19, 117.67 -38.34, 118.13 -37.66 C118.59 -36.98, 118.91 -36.51, 119.2 -35.78 C119.49 -35.05, 119.71 -34.1, 119.86 -33.28 C120.01 -32.46, 120.11 -31.72, 120.1 -30.88 C120.09 -30.03, 120.03 -29.14, 119.78 -28.2 C119.53 -27.26, 119.12 -26.19, 118.59 -25.23 C118.05 -24.28, 117.3 -23.22, 116.58 -22.46 C115.87 -21.7, 115.05 -21.15, 114.28 -20.66 C113.5 -20.18, 112.84 -19.87, 111.94 -19.57 C111.05 -19.27, 109.83 -18.98, 108.91 -18.86 C107.98 -18.75, 107.15 -18.8, 106.38 -18.9 C105.61 -18.99, 104.96 -19.21, 104.29 -19.42 C103.61 -19.63, 102.75 -20.09, 102.32 -20.16 C101.88 -20.24, 101.94 -20.08, 101.68 -19.86 C101.41 -19.65, 101.31 -19.47, 100.71 -18.88 C100.11 -18.29, 99 -17.24, 98.07 -16.32 C97.14 -15.4, 96.05 -14.3, 95.13 -13.36 C94.2 -12.42, 93.18 -11.33, 92.53 -10.69 C91.88 -10.05, 91.61 -9.8, 91.22 -9.49 C90.84 -9.19, 90.59 -9.01, 90.23 -8.84 C89.88 -8.66, 89.75 -8.5, 89.09 -8.44 C88.44 -8.37, 88.43 -8.43, 86.29 -8.43 C84.15 -8.43, 80 -8.43, 76.24 -8.43 C72.49 -8.43, 66.57 -8.43, 63.76 -8.43 C60.94 -8.43, 60.44 -8.43, 59.35 -8.43 C58.26 -8.43, 57.6 -8.49, 57.23 -8.43 C56.86 -8.37, 56.97 -8.31, 57.11 -8.07 C57.25 -7.83, 57.63 -7.5, 58.06 -7 C58.5 -6.51, 59.16 -5.82, 59.73 -5.09 C60.29 -4.36, 60.92 -3.48, 61.47 -2.63 C62.02 -1.79, 62.56 -0.85, 63.02 -0.02 C63.47 0.82, 63.85 1.61, 64.22 2.38 C64.59 3.14, 64.97 3.99, 65.24 4.56 C65.51 5.13, 65.73 5.28, 65.84 5.8 C65.95 6.32, 65.98 7.18, 65.9 7.69 C65.82 8.19, 65.61 8.52, 65.36 8.86 C65.12 9.19, 64.83 9.46, 64.45 9.7 C64.06 9.95, 63.53 10.22, 63.04 10.33 C62.56 10.43, 62.01 10.45, 61.53 10.33 C61.05 10.21, 60.57 9.95, 60.16 9.6 C59.75 9.26, 59.42 8.89, 59.08 8.26 C58.74 7.63, 58.47 6.63, 58.1 5.82 C57.73 5.01, 57.3 4.21, 56.84 3.4 C56.38 2.58, 55.91 1.77, 55.33 0.93 C54.75 0.08, 54.11 -0.84, 53.38 -1.7 C52.65 -2.56, 51.84 -3.41, 50.97 -4.24 C50.1 -5.08, 49.09 -5.97, 48.16 -6.71 C47.23 -7.45, 46.44 -8.04, 45.39 -8.69 C44.34 -9.34, 43 -10.03, 41.85 -10.59 C40.71 -11.14, 39.74 -11.57, 38.52 -11.99 C37.29 -12.42, 35.75 -12.88, 34.5 -13.15 C33.25 -13.43, 32.5 -13.53, 31.03 -13.64 C29.55 -13.76, 27.28 -13.87, 25.66 -13.84 C24.04 -13.81, 22.69 -13.7, 21.3 -13.47 C19.92 -13.24, 18.54 -12.84, 17.34 -12.47 C16.15 -12.11, 15.18 -11.74, 14.14 -11.28 C13.09 -10.81, 12.14 -10.3, 11.08 -9.69 C10.01 -9.08, 8.78 -8.33, 7.76 -7.61 C6.73 -6.9, 5.88 -6.24, 4.95 -5.39 C4.02 -4.55, 2.85 -3.29, 2.16 -2.56 C1.47 -1.83, 1.18 -1.44, 0.82 -1.02 C0.45 -0.59, 0.14 -0.17, 0 0 M0 0 C-0.41 0.69, -1.73 2.73, -2.47 4.11 C-3.2 5.49, -3.88 6.8, -4.43 8.29 C-4.98 9.77, -5.46 11.46, -5.77 13.02 C-6.08 14.58, -6.24 15.79, -6.3 17.64 C-6.37 19.49, -6.44 22.03, -6.18 24.11 C-5.92 26.2, -5.31 28.32, -4.73 30.17 C-4.16 32.01, -3.69 33.37, -2.73 35.19 C-1.77 37, -0.31 39.34, 1.04 41.05 C2.39 42.76, 3.68 44.04, 5.36 45.46 C7.04 46.88, 9.21 48.46, 11.12 49.57 C13.04 50.67, 14.89 51.45, 16.86 52.09 C18.82 52.73, 21.12 53.14, 22.91 53.4 C24.71 53.66, 26.52 53.51, 27.63 53.65 C28.73 53.8, 29.04 53.88, 29.54 54.27 C30.05 54.65, 30.43 55.45, 30.68 55.98 C30.92 56.5, 30.98 56.51, 31.03 57.41 C31.08 58.31, 30.97 60.18, 30.96 61.39 C30.94 62.6, 30.96 63.81, 30.96 64.67 C30.96 65.53, 30.93 66.15, 30.96 66.55 C30.98 66.95, 30.99 66.97, 31.12 67.06 C31.26 67.15, 31.23 67.1, 31.74 67.11 C32.26 67.11, 32.49 67.09, 34.22 67.08 C35.95 67.08, 37.31 67.08, 42.14 67.08 C46.96 67.08, 58.99 67.08, 63.16 67.08 C67.34 67.08, 66.16 67.08, 67.19 67.08 C68.22 67.08, 68.75 67.03, 69.35 67.08 C69.96 67.14, 70.4 67.22, 70.82 67.42 C71.25 67.61, 71.54 67.82, 71.9 68.25 C72.25 68.68, 72.51 69.21, 72.94 69.97 C73.38 70.73, 73.94 71.78, 74.51 72.83 C75.08 73.88, 75.68 74.98, 76.38 76.26 C77.08 77.54, 77.89 79.02, 78.71 80.51 C79.53 81.99, 80.61 83.92, 81.3 85.17 C82 86.42, 82.55 87.4, 82.9 88.03 C83.24 88.66, 83.19 88.79, 83.37 88.93 C83.54 89.07, 83.64 88.93, 83.96 88.85 C84.27 88.77, 84.67 88.57, 85.26 88.45 C85.85 88.32, 86.78 88.15, 87.49 88.1 C88.19 88.04, 88.77 88.06, 89.47 88.13 C90.18 88.21, 90.95 88.33, 91.7 88.55 C92.45 88.77, 93.28 89.08, 93.99 89.46 C94.7 89.83, 95.37 90.33, 95.96 90.82 C96.55 91.3, 97.05 91.8, 97.54 92.39 C98.04 92.98, 98.54 93.72, 98.91 94.36 C99.28 95, 99.52 95.44, 99.77 96.24 C100.03 97.04, 100.33 98.34, 100.44 99.15 C100.55 99.95, 100.53 100.27, 100.44 101.07 C100.35 101.88, 100.21 103.02, 99.9 103.99 C99.58 104.97, 99.14 106.03, 98.56 106.92 C97.98 107.82, 97.12 108.71, 96.41 109.38 C95.69 110.04, 95.1 110.45, 94.26 110.91 C93.42 111.36, 92.37 111.85, 91.37 112.11 C90.38 112.38, 89.37 112.49, 88.29 112.49 C87.22 112.49, 86.01 112.41, 84.93 112.1 C83.86 111.8, 82.72 111.18, 81.83 110.65 C80.94 110.12, 80.28 109.6, 79.61 108.9 C78.94 108.2, 78.32 107.34, 77.81 106.45 C77.29 105.56, 76.81 104.46, 76.52 103.57 C76.23 102.68, 76.12 102.02, 76.07 101.11 C76.01 100.2, 76.05 99.01, 76.19 98.09 C76.33 97.18, 76.65 96.29, 76.91 95.62 C77.17 94.95, 77.59 94.44, 77.73 94.08 C77.87 93.73, 77.84 93.76, 77.75 93.49 C77.67 93.23, 77.53 93.08, 77.2 92.5 C76.87 91.92, 76.42 91.16, 75.78 89.99 C75.14 88.83, 74.23 87.13, 73.35 85.53 C72.47 83.92, 71.39 81.97, 70.52 80.38 C69.65 78.79, 68.68 76.97, 68.15 75.99 C67.62 75.02, 67.53 74.86, 67.35 74.55 C67.17 74.24, 67.21 74.2, 67.08 74.13 C66.94 74.06, 67.14 74.11, 66.53 74.11 C65.92 74.11, 65.53 74.13, 63.43 74.14 C61.33 74.14, 57.78 74.14, 53.93 74.14 C50.08 74.14, 43.46 74.14, 40.34 74.14 C37.21 74.14, 36.51 74.14, 35.16 74.14 C33.81 74.14, 32.92 74.14, 32.25 74.14 C31.59 74.14, 31.37 74.09, 31.15 74.14 C30.93 74.18, 30.96 74.24, 30.93 74.4 C30.89 74.56, 30.93 74.29, 30.93 75.09 C30.93 75.9, 30.93 77.22, 30.93 79.25 C30.93 81.28, 30.93 84.14, 30.93 87.26 C30.93 90.39, 30.93 95.12, 30.93 98.01 C30.93 100.89, 30.93 102.81, 30.93 104.57 C30.93 106.33, 30.97 107.6, 30.93 108.55 C30.88 109.49, 30.86 109.71, 30.67 110.23 C30.47 110.76, 30.16 111.33, 29.74 111.68 C29.32 112.04, 28.76 112.24, 28.17 112.38 C27.57 112.52, 27.25 112.5, 26.16 112.53 C25.06 112.56, 23.85 112.56, 21.6 112.57 C19.34 112.57, 14.39 112.57, 12.64 112.57 C10.89 112.57, 11.54 112.6, 11.09 112.57 C10.63 112.53, 10.25 112.48, 9.88 112.34 C9.52 112.2, 9.18 111.96, 8.9 111.72 C8.62 111.48, 8.4 111.21, 8.2 110.91 C8.01 110.6, 7.82 110.28, 7.72 109.88 C7.62 109.48, 7.62 109.37, 7.6 108.52 C7.58 107.67, 7.6 106.11, 7.6 104.79 C7.6 103.48, 7.59 101.71, 7.6 100.61 C7.6 99.5, 7.64 98.62, 7.62 98.15 C7.6 97.67, 7.62 97.87, 7.47 97.75 C7.32 97.63, 7.34 97.61, 6.74 97.42 C6.13 97.23, 5 96.97, 3.86 96.61 C2.72 96.25, 1.42 95.81, -0.08 95.25 C-1.58 94.68, -3.7 93.84, -5.14 93.24 C-6.58 92.64, -7.66 92.13, -8.7 91.63 C-9.73 91.12, -10.68 90.6, -11.36 90.23 C-12.05 89.86, -12.43 89.61, -12.8 89.41 C-13.18 89.2, -13.41 89.05, -13.61 89 C-13.81 88.96, -13.76 88.93, -14.02 89.16 C-14.28 89.38, -14.59 89.75, -15.17 90.34 C-15.76 90.93, -16.84 92, -17.55 92.7 C-18.25 93.4, -18.76 93.9, -19.42 94.54 C-20.07 95.18, -20.92 96.07, -21.47 96.57 C-22.03 97.07, -22.33 97.34, -22.75 97.55 C-23.17 97.76, -23.56 97.81, -23.99 97.83 C-24.41 97.85, -24.84 97.81, -25.28 97.66 C-25.72 97.51, -26.06 97.39, -26.61 96.92 C-27.17 96.45, -27.9 95.58, -28.63 94.84 C-29.36 94.11, -30.1 93.37, -30.98 92.5 C-31.86 91.62, -32.9 90.59, -33.89 89.6 C-34.89 88.61, -35.86 87.65, -36.96 86.55 C-38.05 85.46, -39.13 84.33, -40.45 83 C-41.77 81.68, -43.58 79.87, -44.88 78.59 C-46.18 77.3, -47.4 76.12, -48.23 75.28 C-49.06 74.44, -49.49 73.99, -49.85 73.54 C-50.21 73.1, -50.27 72.96, -50.39 72.61 C-50.51 72.25, -50.6 71.86, -50.59 71.41 C-50.57 70.97, -50.49 70.35, -50.31 69.92 C-50.13 69.49, -50.01 69.38, -49.51 68.83 C-49 68.27, -48.2 67.49, -47.3 66.59 C-46.4 65.69, -44.92 64.23, -44.12 63.43 C-43.32 62.62, -42.86 62.15, -42.48 61.75 C-42.1 61.36, -41.96 61.26, -41.85 61.07 C-41.75 60.87, -41.8 60.77, -41.85 60.59 C-41.9 60.41, -41.91 60.46, -42.16 60.01 C-42.41 59.56, -42.87 58.78, -43.35 57.89 C-43.82 57, -44.48 55.82, -45.03 54.67 C-45.58 53.53, -46.1 52.32, -46.64 51.03 C-47.17 49.75, -47.76 48.29, -48.23 46.95 C-48.71 45.6, -49.14 44.14, -49.51 42.95 C-49.88 41.76, -50.25 40.36, -50.47 39.82 C-50.69 39.28, -50.42 39.72, -50.84 39.69 C-51.27 39.67, -51.77 39.67, -53.02 39.67 C-54.28 39.66, -57.13 39.67, -58.37 39.67 C-59.61 39.67, -59.8 39.68, -60.46 39.67 C-61.12 39.65, -61.8 39.7, -62.32 39.6 C-62.83 39.5, -63.19 39.3, -63.55 39.07 C-63.91 38.84, -64.25 38.52, -64.49 38.22 C-64.74 37.91, -64.88 37.72, -65.01 37.26 C-65.15 36.79, -65.24 36.79, -65.29 35.4 C-65.34 34.01, -65.29 31.29, -65.29 28.92 C-65.29 26.56, -65.29 23.95, -65.29 21.23 C-65.29 18.52, -65.29 15.31, -65.29 12.61 C-65.29 9.92, -65.29 6.61, -65.29 5.07 C-65.29 3.53, -65.35 3.87, -65.29 3.39 C-65.24 2.91, -65.14 2.58, -64.96 2.2 C-64.77 1.81, -64.52 1.41, -64.18 1.09 C-63.85 0.77, -63.43 0.46, -62.93 0.28 C-62.43 0.1, -62.02 0.05, -61.19 0.01 C-60.36 -0.04, -59.17 0.01, -57.96 0.01 C-56.74 0.01, -54.95 0.01, -53.89 0.01 C-52.83 0.01, -52.14 0.01, -51.61 0.01 C-51.08 0.01, -50.93 0.05, -50.74 0.01 C-50.55 -0.04, -50.57 -0.07, -50.46 -0.28 C-50.36 -0.48, -50.31 -0.58, -50.12 -1.21 C-49.92 -1.84, -49.63 -3.04, -49.31 -4.08 C-48.98 -5.12, -48.6 -6.24, -48.16 -7.44 C-47.73 -8.64, -47.24 -10.04, -46.72 -11.29 C-46.19 -12.55, -45.58 -13.79, -44.99 -14.99 C-44.4 -16.19, -43.65 -17.59, -43.17 -18.5 C-42.68 -19.41, -42.31 -19.98, -42.08 -20.45 C-41.85 -20.91, -41.76 -21.06, -41.78 -21.28 C-41.8 -21.5, -41.88 -21.45, -42.21 -21.78 C-42.54 -22.11, -43.2 -22.71, -43.76 -23.26 C-44.31 -23.81, -44.77 -24.3, -45.55 -25.09 C-46.33 -25.88, -47.72 -27.28, -48.44 -28.01 C-49.15 -28.74, -49.5 -29.07, -49.84 -29.48 C-50.17 -29.88, -50.32 -30.02, -50.45 -30.43 C-50.58 -30.84, -50.63 -31.49, -50.6 -31.94 C-50.58 -32.39, -50.53 -32.67, -50.3 -33.11 C-50.07 -33.54, -49.81 -33.89, -49.22 -34.54 C-48.64 -35.2, -47.7 -36.13, -46.78 -37.05 C-45.86 -37.97, -44.9 -38.88, -43.71 -40.06 C-42.52 -41.24, -41.58 -42.19, -39.64 -44.13 C-37.7 -46.07, -34.05 -49.75, -32.07 -51.71 C-30.1 -53.68, -28.82 -54.94, -27.8 -55.92 C-26.78 -56.9, -26.47 -57.25, -25.94 -57.61 C-25.41 -57.97, -25.08 -58.02, -24.62 -58.09 C-24.16 -58.15, -23.63 -58.12, -23.17 -57.98 C-22.72 -57.84, -22.37 -57.61, -21.9 -57.24 C-21.43 -56.88, -20.96 -56.38, -20.34 -55.79 C-19.73 -55.19, -18.97 -54.42, -18.21 -53.66 C-17.44 -52.9, -16.43 -51.91, -15.74 -51.22 C-15.06 -50.53, -14.47 -49.83, -14.1 -49.51 C-13.72 -49.19, -13.69 -49.29, -13.5 -49.3 C-13.3 -49.31, -13.35 -49.32, -12.9 -49.57 C-12.46 -49.82, -11.74 -50.3, -10.83 -50.8 C-9.93 -51.29, -8.75 -51.92, -7.46 -52.53 C-6.18 -53.14, -4.55 -53.89, -3.13 -54.47 C-1.72 -55.05, -0.31 -55.54, 1.03 -56 C2.38 -56.45, 3.93 -56.89, 4.95 -57.21 C5.97 -57.54, 6.72 -57.75, 7.15 -57.93 C7.59 -58.11, 7.47 -58.07, 7.54 -58.3 C7.62 -58.53, 7.59 -58.59, 7.6 -59.31 C7.61 -60.03, 7.6 -61.18, 7.6 -62.64 C7.6 -64.1, 7.56 -66.77, 7.6 -68.05 C7.64 -69.34, 7.68 -69.74, 7.84 -70.34 C8 -70.94, 8.25 -71.27, 8.56 -71.64 C8.87 -72.01, 9.27 -72.35, 9.68 -72.56 C10.09 -72.76, 10.32 -72.8, 11 -72.86 C11.69 -72.92, 11.91 -72.92, 13.81 -72.93 C15.71 -72.94, 20.41 -72.93, 22.41 -72.93 C24.41 -72.93, 24.87 -72.96, 25.82 -72.93 C26.77 -72.9, 27.49 -72.91, 28.12 -72.77 C28.75 -72.63, 29.19 -72.41, 29.59 -72.11 C30 -71.81, 30.31 -71.41, 30.54 -70.96 C30.77 -70.51, 30.88 -70.2, 30.95 -69.42 C31.02 -68.64, 30.96 -67.77, 30.96 -66.29 C30.96 -64.82, 30.96 -63.37, 30.96 -60.58 C30.96 -57.79, 30.96 -53.06, 30.96 -49.55 C30.96 -46.05, 30.96 -41.77, 30.96 -39.55 C30.96 -37.32, 30.96 -36.97, 30.96 -36.18 C30.96 -35.4, 30.92 -35.11, 30.96 -34.84 C31 -34.57, 30.96 -34.62, 31.2 -34.57 C31.44 -34.51, 31.39 -34.52, 32.41 -34.51 C33.43 -34.5, 34.35 -34.51, 37.33 -34.51 C40.31 -34.51, 46.02 -34.51, 50.31 -34.51 C54.6 -34.51, 60.4 -34.51, 63.05 -34.51 C65.71 -34.51, 65.56 -34.48, 66.24 -34.51 C66.92 -34.53, 66.92 -34.53, 67.13 -34.66 C67.34 -34.78, 67.19 -34.68, 67.51 -35.25 C67.82 -35.81, 68.33 -36.77, 69.03 -38.07 C69.72 -39.36, 70.62 -41.03, 71.7 -43 C72.79 -44.97, 74.56 -48.13, 75.54 -49.89 C76.52 -51.64, 77.21 -52.79, 77.57 -53.55 C77.94 -54.32, 77.8 -54.18, 77.74 -54.49 C77.67 -54.8, 77.41 -54.9, 77.19 -55.41 C76.96 -55.92, 76.58 -56.85, 76.39 -57.55 C76.2 -58.26, 76.08 -58.8, 76.05 -59.63 C76.02 -60.46, 76.02 -61.49, 76.22 -62.53 C76.41 -63.57, 76.75 -64.88, 77.21 -65.89 C77.68 -66.91, 78.32 -67.8, 79.03 -68.6 C79.74 -69.4, 80.65 -70.12, 81.48 -70.7 C82.32 -71.28, 83.15 -71.74, 84.03 -72.07 C84.91 -72.4, 85.71 -72.6, 86.74 -72.69 C87.77 -72.78, 89.12 -72.79, 90.21 -72.62 C91.31 -72.46, 92.33 -72.14, 93.31 -71.71 C94.28 -71.28, 95.26 -70.68, 96.05 -70.05 C96.85 -69.43, 97.5 -68.7, 98.07 -67.96 C98.64 -67.23, 99.08 -66.56, 99.46 -65.64 C99.83 -64.72, 100.15 -63.43, 100.32 -62.45 C100.5 -61.47, 100.57 -60.69, 100.51 -59.76 C100.45 -58.83, 100.38 -57.97, 99.97 -56.87 C99.57 -55.77, 98.91 -54.28, 98.06 -53.18 C97.2 -52.09, 96.02 -51.05, 94.86 -50.3 C93.69 -49.55, 92.16 -49.01, 91.06 -48.68 C89.97 -48.36, 89.18 -48.34, 88.29 -48.34 C87.41 -48.33, 86.52 -48.52, 85.76 -48.66 C84.99 -48.81, 84.13 -49.15, 83.71 -49.22 C83.29 -49.3, 83.4 -49.28, 83.24 -49.12 C83.08 -48.96, 83.12 -48.89, 82.77 -48.26 C82.42 -47.62, 81.72 -46.38, 81.12 -45.31 C80.53 -44.24, 79.92 -43.13, 79.22 -41.84 C78.52 -40.56, 77.75 -39.1, 76.9 -37.59 C76.06 -36.08, 74.94 -34.15, 74.18 -32.77 C73.41 -31.39, 72.76 -30.05, 72.31 -29.32 C71.85 -28.58, 71.81 -28.62, 71.45 -28.35 C71.09 -28.07, 70.8 -27.81, 70.15 -27.69 C69.5 -27.57, 69.63 -27.63, 67.56 -27.62 C65.48 -27.61, 61.2 -27.62, 57.68 -27.62 C54.16 -27.62, 50.35 -27.62, 46.44 -27.62 C42.54 -27.62, 36.61 -27.62, 34.27 -27.62 C31.93 -27.62, 32.88 -27.62, 32.38 -27.62 C31.88 -27.62, 31.48 -27.68, 31.26 -27.62 C31.04 -27.57, 31.11 -27.69, 31.07 -27.29 C31.02 -26.89, 31 -26.04, 30.98 -25.23 C30.97 -24.42, 30.98 -23.12, 30.98 -22.43 C30.98 -21.74, 30.93 -21.38, 30.98 -21.1 C31.04 -20.82, 31.04 -20.83, 31.3 -20.75 C31.55 -20.67, 31.84 -20.7, 32.5 -20.61 C33.15 -20.53, 34.21 -20.45, 35.22 -20.24 C36.24 -20.03, 37.36 -19.75, 38.61 -19.36 C39.87 -18.97, 41.56 -18.39, 42.76 -17.92 C43.95 -17.45, 45.06 -16.89, 45.79 -16.54 C46.53 -16.19, 46.87 -15.98, 47.18 -15.84 C47.49 -15.69, 47.14 -15.7, 47.65 -15.66 C48.16 -15.62, 48.75 -15.62, 50.22 -15.62 C51.7 -15.61, 53.42 -15.62, 56.51 -15.62 C59.6 -15.62, 64.87 -15.62, 68.78 -15.62 C72.7 -15.62, 77.42 -15.62, 79.98 -15.62 C82.55 -15.62, 82.96 -15.62, 84.16 -15.62 C85.35 -15.62, 86.54 -15.55, 87.15 -15.62 C87.76 -15.68, 87.39 -15.61, 87.8 -15.99 C88.21 -16.37, 88.9 -17.13, 89.62 -17.87 C90.35 -18.61, 91.27 -19.55, 92.15 -20.43 C93.03 -21.31, 94.1 -22.4, 94.88 -23.17 C95.65 -23.95, 96.46 -24.63, 96.81 -25.06 C97.16 -25.48, 97.01 -25.47, 96.96 -25.72 C96.91 -25.97, 96.7 -26.16, 96.53 -26.55 C96.35 -26.94, 96.07 -27.36, 95.92 -28.07 C95.76 -28.78, 95.62 -29.93, 95.6 -30.83 C95.59 -31.73, 95.66 -32.64, 95.83 -33.48 C96 -34.33, 96.22 -35.04, 96.64 -35.9 C97.05 -36.77, 97.68 -37.87, 98.31 -38.69 C98.94 -39.5, 99.61 -40.16, 100.41 -40.78 C101.21 -41.41, 102.21 -42.03, 103.11 -42.43 C104.01 -42.83, 104.98 -43.01, 105.81 -43.16 C106.64 -43.31, 107.23 -43.36, 108.11 -43.32 C109 -43.28, 110.12 -43.21, 111.11 -42.94 C112.1 -42.66, 113.18 -42.17, 114.06 -41.66 C114.95 -41.15, 115.76 -40.53, 116.44 -39.86 C117.12 -39.19, 117.67 -38.34, 118.13 -37.66 C118.59 -36.98, 118.91 -36.51, 119.2 -35.78 C119.49 -35.05, 119.71 -34.1, 119.86 -33.28 C120.01 -32.46, 120.11 -31.72, 120.1 -30.88 C120.09 -30.03, 120.03 -29.14, 119.78 -28.2 C119.53 -27.26, 119.12 -26.19, 118.59 -25.23 C118.05 -24.28, 117.3 -23.22, 116.58 -22.46 C115.87 -21.7, 115.05 -21.15, 114.28 -20.66 C113.5 -20.18, 112.84 -19.87, 111.94 -19.57 C111.05 -19.27, 109.83 -18.98, 108.91 -18.86 C107.98 -18.75, 107.15 -18.8, 106.38 -18.9 C105.61 -18.99, 104.96 -19.21, 104.29 -19.42 C103.61 -19.63, 102.75 -20.09, 102.32 -20.16 C101.88 -20.24, 101.94 -20.08, 101.68 -19.86 C101.41 -19.65, 101.31 -19.47, 100.71 -18.88 C100.11 -18.29, 99 -17.24, 98.07 -16.32 C97.14 -15.4, 96.05 -14.3, 95.13 -13.36 C94.2 -12.42, 93.18 -11.33, 92.53 -10.69 C91.88 -10.05, 91.61 -9.8, 91.22 -9.49 C90.84 -9.19, 90.59 -9.01, 90.23 -8.84 C89.88 -8.66, 89.75 -8.5, 89.09 -8.44 C88.44 -8.37, 88.43 -8.43, 86.29 -8.43 C84.15 -8.43, 80 -8.43, 76.24 -8.43 C72.49 -8.43, 66.57 -8.43, 63.76 -8.43 C60.94 -8.43, 60.44 -8.43, 59.35 -8.43 C58.26 -8.43, 57.6 -8.49, 57.23 -8.43 C56.86 -8.37, 56.97 -8.31, 57.11 -8.07 C57.25 -7.83, 57.63 -7.5, 58.06 -7 C58.5 -6.51, 59.16 -5.82, 59.73 -5.09 C60.29 -4.36, 60.92 -3.48, 61.47 -2.63 C62.02 -1.79, 62.56 -0.85, 63.02 -0.02 C63.47 0.82, 63.85 1.61, 64.22 2.38 C64.59 3.14, 64.97 3.99, 65.24 4.56 C65.51 5.13, 65.73 5.28, 65.84 5.8 C65.95 6.32, 65.98 7.18, 65.9 7.69 C65.82 8.19, 65.61 8.52, 65.36 8.86 C65.12 9.19, 64.83 9.46, 64.45 9.7 C64.06 9.95, 63.53 10.22, 63.04 10.33 C62.56 10.43, 62.01 10.45, 61.53 10.33 C61.05 10.21, 60.57 9.95, 60.16 9.6 C59.75 9.26, 59.42 8.89, 59.08 8.26 C58.74 7.63, 58.47 6.63, 58.1 5.82 C57.73 5.01, 57.3 4.21, 56.84 3.4 C56.38 2.58, 55.91 1.77, 55.33 0.93 C54.75 0.08, 54.11 -0.84, 53.38 -1.7 C52.65 -2.56, 51.84 -3.41, 50.97 -4.24 C50.1 -5.08, 49.09 -5.97, 48.16 -6.71 C47.23 -7.45, 46.44 -8.04, 45.39 -8.69 C44.34 -9.34, 43 -10.03, 41.85 -10.59 C40.71 -11.14, 39.74 -11.57, 38.52 -11.99 C37.29 -12.42, 35.75 -12.88, 34.5 -13.15 C33.25 -13.43, 32.5 -13.53, 31.03 -13.64 C29.55 -13.76, 27.28 -13.87, 25.66 -13.84 C24.04 -13.81, 22.69 -13.7, 21.3 -13.47 C19.92 -13.24, 18.54 -12.84, 17.34 -12.47 C16.15 -12.11, 15.18 -11.74, 14.14 -11.28 C13.09 -10.81, 12.14 -10.3, 11.08 -9.69 C10.01 -9.08, 8.78 -8.33, 7.76 -7.61 C6.73 -6.9, 5.88 -6.24, 4.95 -5.39 C4.02 -4.55, 2.85 -3.29, 2.16 -2.56 C1.47 -1.83, 1.18 -1.44, 0.82 -1.02 C0.45 -0.59, 0.14 -0.17, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-7"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(99.09546258135197 38.891744773438404) rotate(0 -40.932171153921445 63.888006037361265)"><path d="M0 0 C0 1.19, 0 4.26, 0 7.14 C0 10.02, 0 14.92, 0 17.27 C0 19.63, 0 20.33, 0 21.26 C0 22.19, 0.03 22.54, 0 22.86 C-0.03 23.18, -0.06 23.11, -0.19 23.18 C-0.32 23.24, -0.27 23.2, -0.78 23.24 C-1.29 23.28, -2.31 23.28, -3.25 23.43 C-4.2 23.58, -5.23 23.79, -6.44 24.12 C-7.66 24.45, -9.29 24.96, -10.56 25.43 C-11.82 25.9, -12.85 26.37, -14.03 26.95 C-15.2 27.53, -16.38 28.15, -17.6 28.9 C-18.82 29.66, -20.2 30.61, -21.35 31.48 C-22.5 32.35, -23.46 33.1, -24.52 34.11 C-25.58 35.13, -26.72 36.38, -27.71 37.57 C-28.7 38.75, -29.59 39.9, -30.46 41.21 C-31.33 42.52, -32.23 44.07, -32.93 45.44 C-33.63 46.81, -34.18 48.21, -34.67 49.45 C-35.16 50.7, -35.49 51.6, -35.84 52.91 C-36.19 54.22, -36.55 55.97, -36.78 57.33 C-37.01 58.68, -37.15 59.44, -37.23 61.03 C-37.31 62.61, -37.42 64.84, -37.27 66.84 C-37.11 68.84, -36.72 71.15, -36.3 73.02 C-35.89 74.89, -35.35 76.47, -34.75 78.08 C-34.16 79.68, -33.47 81.2, -32.74 82.64 C-32.01 84.08, -31.3 85.35, -30.35 86.73 C-29.41 88.1, -28.25 89.55, -27.06 90.89 C-25.88 92.24, -24.65 93.56, -23.24 94.78 C-21.83 96, -19.99 97.31, -18.6 98.23 C-17.22 99.16, -16.36 99.62, -14.92 100.33 C-13.48 101.04, -11.65 101.87, -9.97 102.47 C-8.3 103.07, -6.32 103.6, -4.88 103.93 C-3.44 104.26, -2.1 104.33, -1.31 104.45 C-0.52 104.57, -0.39 104.54, -0.16 104.66 C0.06 104.78, 0.01 104.87, 0.05 105.18 C0.08 105.49, 0.05 104.8, 0.05 106.51 C0.05 108.22, 0.05 112.14, 0.05 115.43 C0.05 118.73, 0.05 122.54, 0.05 126.31 C0.05 130.07, 0.05 134.62, 0.05 138.02 C0.05 141.42, 0.05 144.94, 0.05 146.7 C0.05 148.46, 0.05 148.15, 0.05 148.57 C0.05 149, 0.09 149.08, 0.05 149.23 C0 149.38, 0.05 149.45, -0.21 149.49 C-0.46 149.53, -0.56 149.48, -1.5 149.48 C-2.44 149.47, -4.78 149.48, -5.84 149.48 C-6.91 149.48, -7.37 149.48, -7.89 149.48 C-8.4 149.48, -8.74 149.54, -8.94 149.48 C-9.14 149.41, -9.07 149.31, -9.1 149.09 C-9.13 148.86, -9.1 148.85, -9.1 148.13 C-9.1 147.41, -9.1 145.82, -9.1 144.79 C-9.1 143.75, -9.1 142.74, -9.1 141.9 C-9.1 141.06, -9.1 140.37, -9.1 139.75 C-9.11 139.12, -9.05 138.61, -9.15 138.14 C-9.25 137.68, -9.48 137.29, -9.72 136.94 C-9.95 136.59, -10.05 136.32, -10.55 136.05 C-11.05 135.77, -11.75 135.55, -12.72 135.28 C-13.68 135, -15.14 134.74, -16.34 134.39 C-17.54 134.05, -18.56 133.68, -19.93 133.2 C-21.29 132.71, -22.96 132.13, -24.52 131.49 C-26.07 130.86, -27.89 130.03, -29.23 129.38 C-30.58 128.72, -31.55 128.16, -32.57 127.58 C-33.59 127.01, -34.63 126.32, -35.37 125.9 C-36.1 125.48, -36.46 125.23, -36.96 125.06 C-37.45 124.89, -37.88 124.86, -38.33 124.88 C-38.78 124.9, -39.19 124.93, -39.66 125.2 C-40.12 125.47, -40.57 125.96, -41.12 126.49 C-41.68 127.01, -42.31 127.67, -43 128.36 C-43.7 129.06, -44.6 129.96, -45.31 130.67 C-46.02 131.38, -46.8 132.22, -47.25 132.61 C-47.7 133.01, -47.78 133.06, -48.02 133.06 C-48.25 133.06, -48.31 132.96, -48.67 132.62 C-49.03 132.28, -49.54 131.66, -50.18 131.01 C-50.83 130.35, -51.59 129.6, -52.53 128.68 C-53.46 127.76, -54.71 126.56, -55.8 125.47 C-56.89 124.38, -58 123.22, -59.07 122.14 C-60.13 121.06, -61.29 119.91, -62.19 119 C-63.09 118.09, -63.88 117.26, -64.45 116.67 C-65.01 116.09, -65.43 115.78, -65.59 115.5 C-65.75 115.22, -65.67 115.35, -65.38 115 C-65.09 114.65, -64.71 114.27, -63.87 113.41 C-63.03 112.56, -61.32 110.87, -60.33 109.88 C-59.34 108.89, -58.42 108.11, -57.92 107.47 C-57.42 106.84, -57.41 106.59, -57.34 106.09 C-57.27 105.59, -57.31 105.06, -57.51 104.47 C-57.7 103.88, -58.05 103.38, -58.52 102.55 C-58.98 101.71, -59.69 100.57, -60.3 99.46 C-60.91 98.35, -61.59 97.1, -62.18 95.89 C-62.77 94.68, -63.32 93.49, -63.86 92.2 C-64.39 90.9, -64.92 89.47, -65.4 88.12 C-65.87 86.77, -66.32 85.36, -66.7 84.11 C-67.09 82.85, -67.44 81.5, -67.68 80.6 C-67.92 79.71, -67.9 79.29, -68.16 78.74 C-68.41 78.19, -68.82 77.65, -69.19 77.31 C-69.56 76.98, -69.88 76.86, -70.39 76.73 C-70.91 76.6, -71.41 76.56, -72.28 76.53 C-73.15 76.5, -74.34 76.55, -75.61 76.55 C-76.89 76.56, -78.93 76.55, -79.91 76.55 C-80.9 76.55, -81.22 76.59, -81.54 76.55 C-81.87 76.52, -81.8 76.53, -81.86 76.33 C-81.92 76.12, -81.9 76.08, -81.91 75.32 C-81.92 74.57, -81.91 73.27, -81.91 71.81 C-81.91 70.36, -81.91 69.43, -81.91 66.6 C-81.91 63.76, -81.91 57.21, -81.91 54.8 C-81.91 52.38, -81.92 52.69, -81.91 52.11 C-81.9 51.53, -81.93 51.46, -81.82 51.31 C-81.72 51.15, -81.71 51.2, -81.27 51.17 C-80.83 51.15, -80.14 51.17, -79.17 51.17 C-78.21 51.17, -76.72 51.17, -75.46 51.17 C-74.2 51.17, -72.47 51.17, -71.62 51.17 C-70.78 51.17, -70.74 51.25, -70.4 51.17 C-70.06 51.1, -69.85 50.97, -69.56 50.75 C-69.28 50.53, -68.97 50.23, -68.71 49.84 C-68.45 49.46, -68.26 49.1, -68.03 48.43 C-67.8 47.76, -67.53 46.63, -67.32 45.82 C-67.11 45.02, -67.06 44.58, -66.78 43.62 C-66.51 42.67, -66.12 41.33, -65.69 40.1 C-65.26 38.87, -64.79 37.65, -64.2 36.26 C-63.62 34.87, -62.87 33.23, -62.16 31.78 C-61.45 30.33, -60.61 28.76, -59.93 27.54 C-59.25 26.31, -58.49 25.2, -58.08 24.41 C-57.67 23.62, -57.57 23.32, -57.47 22.8 C-57.38 22.28, -57.37 21.79, -57.53 21.3 C-57.69 20.8, -57.95 20.4, -58.43 19.82 C-58.9 19.24, -59.55 18.64, -60.39 17.79 C-61.22 16.95, -62.6 15.57, -63.42 14.76 C-64.24 13.94, -64.93 13.29, -65.3 12.89 C-65.66 12.49, -65.61 12.53, -65.61 12.35 C-65.61 12.17, -65.55 12.1, -65.28 11.8 C-65.02 11.5, -64.74 11.29, -64.01 10.56 C-63.28 9.84, -62.16 8.71, -60.91 7.46 C-59.66 6.21, -58.04 4.59, -56.51 3.06 C-54.98 1.54, -52.95 -0.5, -51.75 -1.7 C-50.55 -2.89, -49.9 -3.54, -49.32 -4.12 C-48.74 -4.7, -48.52 -4.96, -48.27 -5.17 C-48.03 -5.38, -48.02 -5.39, -47.88 -5.36 C-47.73 -5.32, -47.7 -5.26, -47.41 -4.97 C-47.12 -4.67, -46.89 -4.36, -46.13 -3.59 C-45.37 -2.83, -43.7 -1.24, -42.84 -0.39 C-41.97 0.45, -41.5 1, -40.95 1.49 C-40.41 1.98, -40.01 2.31, -39.56 2.55 C-39.12 2.8, -38.7 2.92, -38.27 2.97 C-37.85 3.01, -37.42 2.94, -36.99 2.81 C-36.55 2.68, -36.37 2.58, -35.65 2.18 C-34.93 1.78, -33.87 1.05, -32.69 0.4 C-31.52 -0.26, -30.03 -1.04, -28.6 -1.74 C-27.16 -2.44, -25.55 -3.22, -24.1 -3.82 C-22.66 -4.41, -21.46 -4.83, -19.92 -5.33 C-18.37 -5.83, -16.17 -6.43, -14.82 -6.81 C-13.46 -7.19, -12.56 -7.3, -11.77 -7.62 C-10.98 -7.94, -10.49 -8.31, -10.07 -8.72 C-9.64 -9.13, -9.39 -9.54, -9.21 -10.05 C-9.04 -10.57, -9.05 -10.77, -9.01 -11.8 C-8.98 -12.83, -9.01 -15, -9.01 -16.24 C-9.01 -17.47, -9.01 -18.37, -9.01 -19.2 C-9.01 -20.04, -9.03 -20.84, -9.01 -21.25 C-8.99 -21.66, -9.03 -21.59, -8.88 -21.67 C-8.73 -21.75, -8.83 -21.71, -8.13 -21.71 C-7.44 -21.72, -5.75 -21.71, -4.73 -21.71 C-3.7 -21.71, -2.74 -21.71, -2.01 -21.71 C-1.28 -21.71, -0.7 -21.74, -0.37 -21.71 C-0.04 -21.69, -0.07 -21.73, -0.01 -21.57 C0.05 -21.42, 0 -21.55, 0 -20.8 C0 -20.05, 0 -18.88, 0 -17.08 C0 -15.28, 0 -12.87, 0 -10.02 C0 -7.18, 0 -1.67, 0 0 M0 0 C0 1.19, 0 4.26, 0 7.14 C0 10.02, 0 14.92, 0 17.27 C0 19.63, 0 20.33, 0 21.26 C0 22.19, 0.03 22.54, 0 22.86 C-0.03 23.18, -0.06 23.11, -0.19 23.18 C-0.32 23.24, -0.27 23.2, -0.78 23.24 C-1.29 23.28, -2.31 23.28, -3.25 23.43 C-4.2 23.58, -5.23 23.79, -6.44 24.12 C-7.66 24.45, -9.29 24.96, -10.56 25.43 C-11.82 25.9, -12.85 26.37, -14.03 26.95 C-15.2 27.53, -16.38 28.15, -17.6 28.9 C-18.82 29.66, -20.2 30.61, -21.35 31.48 C-22.5 32.35, -23.46 33.1, -24.52 34.11 C-25.58 35.13, -26.72 36.38, -27.71 37.57 C-28.7 38.75, -29.59 39.9, -30.46 41.21 C-31.33 42.52, -32.23 44.07, -32.93 45.44 C-33.63 46.81, -34.18 48.21, -34.67 49.45 C-35.16 50.7, -35.49 51.6, -35.84 52.91 C-36.19 54.22, -36.55 55.97, -36.78 57.33 C-37.01 58.68, -37.15 59.44, -37.23 61.03 C-37.31 62.61, -37.42 64.84, -37.27 66.84 C-37.11 68.84, -36.72 71.15, -36.3 73.02 C-35.89 74.89, -35.35 76.47, -34.75 78.08 C-34.16 79.68, -33.47 81.2, -32.74 82.64 C-32.01 84.08, -31.3 85.35, -30.35 86.73 C-29.41 88.1, -28.25 89.55, -27.06 90.89 C-25.88 92.24, -24.65 93.56, -23.24 94.78 C-21.83 96, -19.99 97.31, -18.6 98.23 C-17.22 99.16, -16.36 99.62, -14.92 100.33 C-13.48 101.04, -11.65 101.87, -9.97 102.47 C-8.3 103.07, -6.32 103.6, -4.88 103.93 C-3.44 104.26, -2.1 104.33, -1.31 104.45 C-0.52 104.57, -0.39 104.54, -0.16 104.66 C0.06 104.78, 0.01 104.87, 0.05 105.18 C0.08 105.49, 0.05 104.8, 0.05 106.51 C0.05 108.22, 0.05 112.14, 0.05 115.43 C0.05 118.73, 0.05 122.54, 0.05 126.31 C0.05 130.07, 0.05 134.62, 0.05 138.02 C0.05 141.42, 0.05 144.94, 0.05 146.7 C0.05 148.46, 0.05 148.15, 0.05 148.57 C0.05 149, 0.09 149.08, 0.05 149.23 C0 149.38, 0.05 149.45, -0.21 149.49 C-0.46 149.53, -0.56 149.48, -1.5 149.48 C-2.44 149.47, -4.78 149.48, -5.84 149.48 C-6.91 149.48, -7.37 149.48, -7.89 149.48 C-8.4 149.48, -8.74 149.54, -8.94 149.48 C-9.14 149.41, -9.07 149.31, -9.1 149.09 C-9.13 148.86, -9.1 148.85, -9.1 148.13 C-9.1 147.41, -9.1 145.82, -9.1 144.79 C-9.1 143.75, -9.1 142.74, -9.1 141.9 C-9.1 141.06, -9.1 140.37, -9.1 139.75 C-9.11 139.12, -9.05 138.61, -9.15 138.14 C-9.25 137.68, -9.48 137.29, -9.72 136.94 C-9.95 136.59, -10.05 136.32, -10.55 136.05 C-11.05 135.77, -11.75 135.55, -12.72 135.28 C-13.68 135, -15.14 134.74, -16.34 134.39 C-17.54 134.05, -18.56 133.68, -19.93 133.2 C-21.29 132.71, -22.96 132.13, -24.52 131.49 C-26.07 130.86, -27.89 130.03, -29.23 129.38 C-30.58 128.72, -31.55 128.16, -32.57 127.58 C-33.59 127.01, -34.63 126.32, -35.37 125.9 C-36.1 125.48, -36.46 125.23, -36.96 125.06 C-37.45 124.89, -37.88 124.86, -38.33 124.88 C-38.78 124.9, -39.19 124.93, -39.66 125.2 C-40.12 125.47, -40.57 125.96, -41.12 126.49 C-41.68 127.01, -42.31 127.67, -43 128.36 C-43.7 129.06, -44.6 129.96, -45.31 130.67 C-46.02 131.38, -46.8 132.22, -47.25 132.61 C-47.7 133.01, -47.78 133.06, -48.02 133.06 C-48.25 133.06, -48.31 132.96, -48.67 132.62 C-49.03 132.28, -49.54 131.66, -50.18 131.01 C-50.83 130.35, -51.59 129.6, -52.53 128.68 C-53.46 127.76, -54.71 126.56, -55.8 125.47 C-56.89 124.38, -58 123.22, -59.07 122.14 C-60.13 121.06, -61.29 119.91, -62.19 119 C-63.09 118.09, -63.88 117.26, -64.45 116.67 C-65.01 116.09, -65.43 115.78, -65.59 115.5 C-65.75 115.22, -65.67 115.35, -65.38 115 C-65.09 114.65, -64.71 114.27, -63.87 113.41 C-63.03 112.56, -61.32 110.87, -60.33 109.88 C-59.34 108.89, -58.42 108.11, -57.92 107.47 C-57.42 106.84, -57.41 106.59, -57.34 106.09 C-57.27 105.59, -57.31 105.06, -57.51 104.47 C-57.7 103.88, -58.05 103.38, -58.52 102.55 C-58.98 101.71, -59.69 100.57, -60.3 99.46 C-60.91 98.35, -61.59 97.1, -62.18 95.89 C-62.77 94.68, -63.32 93.49, -63.86 92.2 C-64.39 90.9, -64.92 89.47, -65.4 88.12 C-65.87 86.77, -66.32 85.36, -66.7 84.11 C-67.09 82.85, -67.44 81.5, -67.68 80.6 C-67.92 79.71, -67.9 79.29, -68.16 78.74 C-68.41 78.19, -68.82 77.65, -69.19 77.31 C-69.56 76.98, -69.88 76.86, -70.39 76.73 C-70.91 76.6, -71.41 76.56, -72.28 76.53 C-73.15 76.5, -74.34 76.55, -75.61 76.55 C-76.89 76.56, -78.93 76.55, -79.91 76.55 C-80.9 76.55, -81.22 76.59, -81.54 76.55 C-81.87 76.52, -81.8 76.53, -81.86 76.33 C-81.92 76.12, -81.9 76.08, -81.91 75.32 C-81.92 74.57, -81.91 73.27, -81.91 71.81 C-81.91 70.36, -81.91 69.43, -81.91 66.6 C-81.91 63.76, -81.91 57.21, -81.91 54.8 C-81.91 52.38, -81.92 52.69, -81.91 52.11 C-81.9 51.53, -81.93 51.46, -81.82 51.31 C-81.72 51.15, -81.71 51.2, -81.27 51.17 C-80.83 51.15, -80.14 51.17, -79.17 51.17 C-78.21 51.17, -76.72 51.17, -75.46 51.17 C-74.2 51.17, -72.47 51.17, -71.62 51.17 C-70.78 51.17, -70.74 51.25, -70.4 51.17 C-70.06 51.1, -69.85 50.97, -69.56 50.75 C-69.28 50.53, -68.97 50.23, -68.71 49.84 C-68.45 49.46, -68.26 49.1, -68.03 48.43 C-67.8 47.76, -67.53 46.63, -67.32 45.82 C-67.11 45.02, -67.06 44.58, -66.78 43.62 C-66.51 42.67, -66.12 41.33, -65.69 40.1 C-65.26 38.87, -64.79 37.65, -64.2 36.26 C-63.62 34.87, -62.87 33.23, -62.16 31.78 C-61.45 30.33, -60.61 28.76, -59.93 27.54 C-59.25 26.31, -58.49 25.2, -58.08 24.41 C-57.67 23.62, -57.57 23.32, -57.47 22.8 C-57.38 22.28, -57.37 21.79, -57.53 21.3 C-57.69 20.8, -57.95 20.4, -58.43 19.82 C-58.9 19.24, -59.55 18.64, -60.39 17.79 C-61.22 16.95, -62.6 15.57, -63.42 14.76 C-64.24 13.94, -64.93 13.29, -65.3 12.89 C-65.66 12.49, -65.61 12.53, -65.61 12.35 C-65.61 12.17, -65.55 12.1, -65.28 11.8 C-65.02 11.5, -64.74 11.29, -64.01 10.56 C-63.28 9.84, -62.16 8.71, -60.91 7.46 C-59.66 6.21, -58.04 4.59, -56.51 3.06 C-54.98 1.54, -52.95 -0.5, -51.75 -1.7 C-50.55 -2.89, -49.9 -3.54, -49.32 -4.12 C-48.74 -4.7, -48.52 -4.96, -48.27 -5.17 C-48.03 -5.38, -48.02 -5.39, -47.88 -5.36 C-47.73 -5.32, -47.7 -5.26, -47.41 -4.97 C-47.12 -4.67, -46.89 -4.36, -46.13 -3.59 C-45.37 -2.83, -43.7 -1.24, -42.84 -0.39 C-41.97 0.45, -41.5 1, -40.95 1.49 C-40.41 1.98, -40.01 2.31, -39.56 2.55 C-39.12 2.8, -38.7 2.92, -38.27 2.97 C-37.85 3.01, -37.42 2.94, -36.99 2.81 C-36.55 2.68, -36.37 2.58, -35.65 2.18 C-34.93 1.78, -33.87 1.05, -32.69 0.4 C-31.52 -0.26, -30.03 -1.04, -28.6 -1.74 C-27.16 -2.44, -25.55 -3.22, -24.1 -3.82 C-22.66 -4.41, -21.46 -4.83, -19.92 -5.33 C-18.37 -5.83, -16.17 -6.43, -14.82 -6.81 C-13.46 -7.19, -12.56 -7.3, -11.77 -7.62 C-10.98 -7.94, -10.49 -8.31, -10.07 -8.72 C-9.64 -9.13, -9.39 -9.54, -9.21 -10.05 C-9.04 -10.57, -9.05 -10.77, -9.01 -11.8 C-8.98 -12.83, -9.01 -15, -9.01 -16.24 C-9.01 -17.47, -9.01 -18.37, -9.01 -19.2 C-9.01 -20.04, -9.03 -20.84, -9.01 -21.25 C-8.99 -21.66, -9.03 -21.59, -8.88 -21.67 C-8.73 -21.75, -8.83 -21.71, -8.13 -21.71 C-7.44 -21.72, -5.75 -21.71, -4.73 -21.71 C-3.7 -21.71, -2.74 -21.71, -2.01 -21.71 C-1.28 -21.71, -0.7 -21.74, -0.37 -21.71 C-0.04 -21.69, -0.07 -21.73, -0.01 -21.57 C0.05 -21.42, 0 -21.55, 0 -20.8 C0 -20.05, 0 -18.88, 0 -17.08 C0 -15.28, 0 -12.87, 0 -10.02 C0 -7.18, 0 -1.67, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-8"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(59.61897945202145 65.82133545018223) rotate(0 6.6323196781586375 12.231519178526469)"><path d="M0 0 C0.48 -0.53, 1.79 -2.08, 2.9 -3.19 C4.02 -4.29, 5.23 -5.42, 6.7 -6.63 C8.17 -7.84, 10.04 -9.32, 11.72 -10.45 C13.41 -11.58, 15.34 -12.62, 16.83 -13.41 C18.32 -14.21, 19.63 -14.77, 20.65 -15.22 C21.67 -15.66, 22.3 -15.95, 22.94 -16.08 C23.58 -16.22, 23.99 -16.15, 24.47 -16.03 C24.95 -15.9, 25.41 -15.7, 25.81 -15.33 C26.21 -14.97, 26.67 -14.4, 26.88 -13.83 C27.09 -13.27, 27.16 -12.51, 27.07 -11.93 C26.98 -11.34, 26.8 -10.81, 26.33 -10.33 C25.87 -9.84, 25.05 -9.41, 24.27 -9.02 C23.5 -8.62, 22.67 -8.4, 21.68 -7.93 C20.68 -7.46, 19.59 -6.95, 18.31 -6.19 C17.03 -5.43, 15.24 -4.23, 14.01 -3.37 C12.77 -2.52, 11.94 -1.9, 10.91 -1.05 C9.88 -0.2, 8.82 0.74, 7.85 1.71 C6.89 2.68, 6.11 3.58, 5.14 4.76 C4.17 5.94, 3.01 7.39, 2.05 8.8 C1.08 10.21, 0.21 11.6, -0.65 13.22 C-1.51 14.84, -2.44 16.85, -3.11 18.51 C-3.77 20.18, -4.21 21.62, -4.66 23.22 C-5.11 24.82, -5.51 26.43, -5.81 28.13 C-6.12 29.82, -6.33 31.88, -6.47 33.39 C-6.6 34.9, -6.55 36.31, -6.64 37.18 C-6.73 38.06, -6.73 38.19, -7 38.64 C-7.27 39.1, -7.76 39.6, -8.24 39.91 C-8.73 40.23, -9.33 40.5, -9.92 40.55 C-10.5 40.59, -11.19 40.44, -11.74 40.18 C-12.3 39.91, -12.88 39.41, -13.23 38.96 C-13.57 38.51, -13.72 38.18, -13.81 37.48 C-13.9 36.78, -13.86 36.01, -13.79 34.76 C-13.72 33.51, -13.63 31.74, -13.39 29.98 C-13.15 28.23, -12.75 26.03, -12.34 24.22 C-11.93 22.42, -11.57 21.06, -10.92 19.17 C-10.27 17.28, -9.22 14.64, -8.44 12.89 C-7.66 11.13, -7.2 10.23, -6.25 8.64 C-5.29 7.04, -3.77 4.76, -2.73 3.32 C-1.69 1.88, -0.46 0.55, 0 0 M0 0 C0.48 -0.53, 1.79 -2.08, 2.9 -3.19 C4.02 -4.29, 5.23 -5.42, 6.7 -6.63 C8.17 -7.84, 10.04 -9.32, 11.72 -10.45 C13.41 -11.58, 15.34 -12.62, 16.83 -13.41 C18.32 -14.21, 19.63 -14.77, 20.65 -15.22 C21.67 -15.66, 22.3 -15.95, 22.94 -16.08 C23.58 -16.22, 23.99 -16.15, 24.47 -16.03 C24.95 -15.9, 25.41 -15.7, 25.81 -15.33 C26.21 -14.97, 26.67 -14.4, 26.88 -13.83 C27.09 -13.27, 27.16 -12.51, 27.07 -11.93 C26.98 -11.34, 26.8 -10.81, 26.33 -10.33 C25.87 -9.84, 25.05 -9.41, 24.27 -9.02 C23.5 -8.62, 22.67 -8.4, 21.68 -7.93 C20.68 -7.46, 19.59 -6.95, 18.31 -6.19 C17.03 -5.43, 15.24 -4.23, 14.01 -3.37 C12.77 -2.52, 11.94 -1.9, 10.91 -1.05 C9.88 -0.2, 8.82 0.74, 7.85 1.71 C6.89 2.68, 6.11 3.58, 5.14 4.76 C4.17 5.94, 3.01 7.39, 2.05 8.8 C1.08 10.21, 0.21 11.6, -0.65 13.22 C-1.51 14.84, -2.44 16.85, -3.11 18.51 C-3.77 20.18, -4.21 21.62, -4.66 23.22 C-5.11 24.82, -5.51 26.43, -5.81 28.13 C-6.12 29.82, -6.33 31.88, -6.47 33.39 C-6.6 34.9, -6.55 36.31, -6.64 37.18 C-6.73 38.06, -6.73 38.19, -7 38.64 C-7.27 39.1, -7.76 39.6, -8.24 39.91 C-8.73 40.23, -9.33 40.5, -9.92 40.55 C-10.5 40.59, -11.19 40.44, -11.74 40.18 C-12.3 39.91, -12.88 39.41, -13.23 38.96 C-13.57 38.51, -13.72 38.18, -13.81 37.48 C-13.9 36.78, -13.86 36.01, -13.79 34.76 C-13.72 33.51, -13.63 31.74, -13.39 29.98 C-13.15 28.23, -12.75 26.03, -12.34 24.22 C-11.93 22.42, -11.57 21.06, -10.92 19.17 C-10.27 17.28, -9.22 14.64, -8.44 12.89 C-7.66 11.13, -7.2 10.23, -6.25 8.64 C-5.29 7.04, -3.77 4.76, -2.73 3.32 C-1.69 1.88, -0.46 0.55, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-9"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(119.14213963033217 131.09087186271609) rotate(0 3.6238765570542455 3.6238765570542455)"><path d="M7.25 3.62 C7.25 3.83, 7.23 4.05, 7.19 4.25 C7.16 4.46, 7.1 4.67, 7.03 4.86 C6.96 5.06, 6.87 5.25, 6.76 5.44 C6.66 5.62, 6.53 5.79, 6.4 5.95 C6.27 6.11, 6.11 6.27, 5.95 6.4 C5.79 6.53, 5.62 6.66, 5.44 6.76 C5.25 6.87, 5.06 6.96, 4.86 7.03 C4.67 7.1, 4.46 7.16, 4.25 7.19 C4.05 7.23, 3.83 7.25, 3.62 7.25 C3.41 7.25, 3.2 7.23, 2.99 7.19 C2.79 7.16, 2.58 7.1, 2.38 7.03 C2.19 6.96, 1.99 6.87, 1.81 6.76 C1.63 6.66, 1.46 6.53, 1.29 6.4 C1.13 6.27, 0.98 6.11, 0.85 5.95 C0.71 5.79, 0.59 5.62, 0.49 5.44 C0.38 5.25, 0.29 5.06, 0.22 4.86 C0.15 4.67, 0.09 4.46, 0.06 4.25 C0.02 4.05, 0 3.83, 0 3.62 C0 3.41, 0.02 3.2, 0.06 2.99 C0.09 2.79, 0.15 2.58, 0.22 2.38 C0.29 2.19, 0.38 1.99, 0.49 1.81 C0.59 1.63, 0.71 1.46, 0.85 1.29 C0.98 1.13, 1.13 0.98, 1.29 0.85 C1.46 0.71, 1.63 0.59, 1.81 0.49 C1.99 0.38, 2.19 0.29, 2.38 0.22 C2.58 0.15, 2.79 0.09, 2.99 0.06 C3.2 0.02, 3.41 0, 3.62 0 C3.83 0, 4.05 0.02, 4.25 0.06 C4.46 0.09, 4.67 0.15, 4.86 0.22 C5.06 0.29, 5.25 0.38, 5.44 0.49 C5.62 0.59, 5.79 0.71, 5.95 0.85 C6.11 0.98, 6.27 1.13, 6.4 1.29 C6.53 1.46, 6.66 1.63, 6.76 1.81 C6.87 1.99, 6.96 2.19, 7.03 2.38 C7.1 2.58, 7.16 2.79, 7.19 2.99 C7.23 3.2, 7.24 3.52, 7.25 3.62 C7.26 3.73, 7.26 3.52, 7.25 3.62" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-10"></path></g><g stroke-linecap="round"><g transform="translate(148.59033865556557 131.1209836150265) rotate(0 16.178583754298415 17.3960758216017)"><path d="M0 0 C1.58 0, 7.22 0, 9.46 0 C11.7 0, 12.38 0, 13.42 0 C14.47 0, 15.11 -0.05, 15.75 0.02 C16.4 0.1, 16.75 0.11, 17.3 0.44 C17.84 0.77, 18.31 1.34, 19.01 2.02 C19.71 2.69, 20.57 3.57, 21.5 4.5 C22.43 5.42, 23.71 6.7, 24.59 7.58 C25.47 8.46, 26.18 9.2, 26.76 9.77 C27.33 10.34, 27.72 10.7, 28.03 11 C28.35 11.3, 28.41 11.48, 28.66 11.57 C28.92 11.66, 29.19 11.63, 29.56 11.52 C29.94 11.42, 30.39 11.12, 30.9 10.95 C31.41 10.79, 32 10.62, 32.63 10.52 C33.26 10.41, 33.89 10.33, 34.66 10.33 C35.44 10.34, 36.39 10.35, 37.29 10.54 C38.18 10.73, 39.17 11.05, 40.03 11.49 C40.9 11.93, 41.75 12.52, 42.5 13.16 C43.24 13.79, 43.93 14.5, 44.5 15.29 C45.07 16.07, 45.56 16.89, 45.93 17.87 C46.31 18.84, 46.63 20.08, 46.75 21.16 C46.86 22.25, 46.86 23.16, 46.62 24.39 C46.38 25.62, 45.99 27.27, 45.32 28.53 C44.65 29.78, 43.57 31.03, 42.6 31.91 C41.62 32.78, 40.41 33.31, 39.47 33.76 C38.52 34.21, 37.89 34.42, 36.93 34.6 C35.97 34.78, 34.81 34.88, 33.73 34.83 C32.65 34.77, 31.53 34.65, 30.46 34.26 C29.39 33.88, 28.26 33.2, 27.33 32.52 C26.41 31.83, 25.62 31.02, 24.92 30.14 C24.22 29.27, 23.55 28.27, 23.15 27.27 C22.74 26.26, 22.6 25.09, 22.47 24.1 C22.35 23.1, 22.31 22.23, 22.38 21.32 C22.45 20.4, 22.7 19.31, 22.91 18.6 C23.12 17.9, 23.57 17.43, 23.66 17.08 C23.75 16.74, 23.63 16.77, 23.46 16.53 C23.28 16.3, 23.24 16.31, 22.6 15.67 C21.97 15.03, 20.7 13.76, 19.63 12.7 C18.56 11.65, 17.09 10.22, 16.21 9.33 C15.32 8.44, 14.74 7.73, 14.31 7.37 C13.88 7.01, 14.36 7.21, 13.64 7.17 C12.93 7.14, 12.61 7.17, 10.02 7.17 C7.44 7.17, 1.12 7.17, -1.86 7.17 C-4.84 7.17, -6.28 7.17, -7.85 7.17 C-9.43 7.17, -10.43 7.27, -11.29 7.16 C-12.16 7.04, -12.58 6.8, -13.04 6.49 C-13.5 6.18, -13.83 5.86, -14.05 5.28 C-14.28 4.7, -14.47 3.69, -14.39 3.01 C-14.31 2.32, -14.05 1.63, -13.59 1.14 C-13.12 0.65, -12.38 0.27, -11.6 0.08 C-10.82 -0.12, -10.15 -0.02, -8.9 -0.04 C-7.66 -0.05, -5.61 -0.04, -4.12 -0.04 C-2.64 -0.03, -0.69 -0.01, 0 0 M0 0 C1.58 0, 7.22 0, 9.46 0 C11.7 0, 12.38 0, 13.42 0 C14.47 0, 15.11 -0.05, 15.75 0.02 C16.4 0.1, 16.75 0.11, 17.3 0.44 C17.84 0.77, 18.31 1.34, 19.01 2.02 C19.71 2.69, 20.57 3.57, 21.5 4.5 C22.43 5.42, 23.71 6.7, 24.59 7.58 C25.47 8.46, 26.18 9.2, 26.76 9.77 C27.33 10.34, 27.72 10.7, 28.03 11 C28.35 11.3, 28.41 11.48, 28.66 11.57 C28.92 11.66, 29.19 11.63, 29.56 11.52 C29.94 11.42, 30.39 11.12, 30.9 10.95 C31.41 10.79, 32 10.62, 32.63 10.52 C33.26 10.41, 33.89 10.33, 34.66 10.33 C35.44 10.34, 36.39 10.35, 37.29 10.54 C38.18 10.73, 39.17 11.05, 40.03 11.49 C40.9 11.93, 41.75 12.52, 42.5 13.16 C43.24 13.79, 43.93 14.5, 44.5 15.29 C45.07 16.07, 45.56 16.89, 45.93 17.87 C46.31 18.84, 46.63 20.08, 46.75 21.16 C46.86 22.25, 46.86 23.16, 46.62 24.39 C46.38 25.62, 45.99 27.27, 45.32 28.53 C44.65 29.78, 43.57 31.03, 42.6 31.91 C41.62 32.78, 40.41 33.31, 39.47 33.76 C38.52 34.21, 37.89 34.42, 36.93 34.6 C35.97 34.78, 34.81 34.88, 33.73 34.83 C32.65 34.77, 31.53 34.65, 30.46 34.26 C29.39 33.88, 28.26 33.2, 27.33 32.52 C26.41 31.83, 25.62 31.02, 24.92 30.14 C24.22 29.27, 23.55 28.27, 23.15 27.27 C22.74 26.26, 22.6 25.09, 22.47 24.1 C22.35 23.1, 22.31 22.23, 22.38 21.32 C22.45 20.4, 22.7 19.31, 22.91 18.6 C23.12 17.9, 23.57 17.43, 23.66 17.08 C23.75 16.74, 23.63 16.77, 23.46 16.53 C23.28 16.3, 23.24 16.31, 22.6 15.67 C21.97 15.03, 20.7 13.76, 19.63 12.7 C18.56 11.65, 17.09 10.22, 16.21 9.33 C15.32 8.44, 14.74 7.73, 14.31 7.37 C13.88 7.01, 14.36 7.21, 13.64 7.17 C12.93 7.14, 12.61 7.17, 10.02 7.17 C7.44 7.17, 1.12 7.17, -1.86 7.17 C-4.84 7.17, -6.28 7.17, -7.85 7.17 C-9.43 7.17, -10.43 7.27, -11.29 7.16 C-12.16 7.04, -12.58 6.8, -13.04 6.49 C-13.5 6.18, -13.83 5.86, -14.05 5.28 C-14.28 4.7, -14.47 3.69, -14.39 3.01 C-14.31 2.32, -14.05 1.63, -13.59 1.14 C-13.12 0.65, -12.38 0.27, -11.6 0.08 C-10.82 -0.12, -10.15 -0.02, -8.9 -0.04 C-7.66 -0.05, -5.61 -0.04, -4.12 -0.04 C-2.64 -0.03, -0.69 -0.01, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-11"></path></g></g><mask></mask><g stroke-linecap="round" transform="translate(136.35927234004703 99.15299257903098) rotate(0 3.6238765570542455 3.6238765570542455)"><path d="M7.25 3.62 C7.25 3.83, 7.23 4.05, 7.19 4.25 C7.16 4.46, 7.1 4.67, 7.03 4.86 C6.96 5.06, 6.87 5.25, 6.76 5.44 C6.66 5.62, 6.53 5.79, 6.4 5.95 C6.27 6.11, 6.11 6.27, 5.95 6.4 C5.79 6.53, 5.62 6.66, 5.44 6.76 C5.25 6.87, 5.06 6.96, 4.86 7.03 C4.67 7.1, 4.46 7.16, 4.25 7.19 C4.05 7.23, 3.83 7.25, 3.62 7.25 C3.41 7.25, 3.2 7.23, 2.99 7.19 C2.79 7.16, 2.58 7.1, 2.38 7.03 C2.19 6.96, 1.99 6.87, 1.81 6.76 C1.63 6.66, 1.46 6.53, 1.29 6.4 C1.13 6.27, 0.98 6.11, 0.85 5.95 C0.71 5.79, 0.59 5.62, 0.49 5.44 C0.38 5.25, 0.29 5.06, 0.22 4.86 C0.15 4.67, 0.09 4.46, 0.06 4.25 C0.02 4.05, 0 3.83, 0 3.62 C0 3.41, 0.02 3.2, 0.06 2.99 C0.09 2.79, 0.15 2.58, 0.22 2.38 C0.29 2.19, 0.38 1.99, 0.49 1.81 C0.59 1.63, 0.71 1.46, 0.85 1.29 C0.98 1.13, 1.13 0.98, 1.29 0.85 C1.46 0.71, 1.63 0.59, 1.81 0.49 C1.99 0.38, 2.19 0.29, 2.38 0.22 C2.58 0.15, 2.79 0.09, 2.99 0.06 C3.2 0.02, 3.41 0, 3.62 0 C3.83 0, 4.05 0.02, 4.25 0.06 C4.46 0.09, 4.67 0.15, 4.86 0.22 C5.06 0.29, 5.25 0.38, 5.44 0.49 C5.62 0.59, 5.79 0.71, 5.95 0.85 C6.11 0.98, 6.27 1.13, 6.4 1.29 C6.53 1.46, 6.66 1.63, 6.76 1.81 C6.87 1.99, 6.96 2.19, 7.03 2.38 C7.1 2.58, 7.16 2.79, 7.19 2.99 C7.23 3.2, 7.24 3.52, 7.25 3.62 C7.26 3.73, 7.26 3.52, 7.25 3.62" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-12"></path></g><g stroke-linecap="round"><g transform="translate(166.69483879349536 106.34743813773639) rotate(0 9.573320443855664 -3.53374341874769)"><path d="M0 0 C-0.62 0, -2.74 0, -3.74 0 C-4.74 0, -5.47 0.04, -6.01 0.02 C-6.54 -0.01, -6.6 -0.01, -6.97 -0.14 C-7.34 -0.27, -7.87 -0.49, -8.23 -0.77 C-8.59 -1.04, -8.92 -1.38, -9.14 -1.81 C-9.36 -2.24, -9.53 -2.77, -9.54 -3.32 C-9.56 -3.87, -9.47 -4.62, -9.22 -5.12 C-8.96 -5.61, -8.52 -6.01, -8.03 -6.32 C-7.55 -6.64, -6.95 -6.88, -6.3 -7 C-5.66 -7.13, -5.23 -7.07, -4.18 -7.08 C-3.12 -7.09, -1.03 -7.08, 0.03 -7.08 C1.09 -7.08, 1.45 -7.08, 2.19 -7.08 C2.93 -7.08, 4.02 -7.04, 4.47 -7.07 C4.93 -7.11, 4.79 -7.12, 4.91 -7.27 C5.04 -7.43, 5.06 -7.66, 5.22 -8.02 C5.37 -8.38, 5.54 -8.93, 5.83 -9.45 C6.12 -9.97, 6.55 -10.61, 6.97 -11.13 C7.4 -11.66, 7.84 -12.14, 8.35 -12.6 C8.87 -13.06, 9.38 -13.49, 10.04 -13.89 C10.7 -14.3, 11.52 -14.73, 12.33 -15.01 C13.13 -15.3, 14.1 -15.47, 14.85 -15.59 C15.6 -15.72, 16.11 -15.75, 16.82 -15.74 C17.52 -15.73, 18.32 -15.68, 19.08 -15.51 C19.84 -15.34, 20.56 -15.11, 21.39 -14.7 C22.21 -14.29, 23.28 -13.65, 24.05 -13.06 C24.82 -12.46, 25.45 -11.78, 26 -11.13 C26.55 -10.47, 26.97 -9.85, 27.33 -9.13 C27.7 -8.42, 27.99 -7.73, 28.21 -6.85 C28.44 -5.96, 28.67 -4.9, 28.69 -3.83 C28.71 -2.76, 28.6 -1.47, 28.35 -0.44 C28.1 0.59, 27.67 1.52, 27.21 2.37 C26.76 3.21, 26.27 3.92, 25.61 4.64 C24.95 5.36, 24.1 6.13, 23.24 6.68 C22.38 7.24, 21.32 7.67, 20.45 7.99 C19.58 8.3, 18.87 8.46, 18.01 8.57 C17.16 8.69, 16.35 8.8, 15.32 8.67 C14.28 8.55, 12.83 8.24, 11.79 7.81 C10.75 7.39, 9.93 6.77, 9.08 6.11 C8.24 5.44, 7.31 4.51, 6.73 3.82 C6.14 3.13, 5.9 2.57, 5.58 1.96 C5.26 1.35, 5.07 0.5, 4.8 0.17 C4.53 -0.16, 4.77 0.03, 3.97 0 C3.17 -0.02, 0.66 0, 0 0 M0 0 C-0.62 0, -2.74 0, -3.74 0 C-4.74 0, -5.47 0.04, -6.01 0.02 C-6.54 -0.01, -6.6 -0.01, -6.97 -0.14 C-7.34 -0.27, -7.87 -0.49, -8.23 -0.77 C-8.59 -1.04, -8.92 -1.38, -9.14 -1.81 C-9.36 -2.24, -9.53 -2.77, -9.54 -3.32 C-9.56 -3.87, -9.47 -4.62, -9.22 -5.12 C-8.96 -5.61, -8.52 -6.01, -8.03 -6.32 C-7.55 -6.64, -6.95 -6.88, -6.3 -7 C-5.66 -7.13, -5.23 -7.07, -4.18 -7.08 C-3.12 -7.09, -1.03 -7.08, 0.03 -7.08 C1.09 -7.08, 1.45 -7.08, 2.19 -7.08 C2.93 -7.08, 4.02 -7.04, 4.47 -7.07 C4.93 -7.11, 4.79 -7.12, 4.91 -7.27 C5.04 -7.43, 5.06 -7.66, 5.22 -8.02 C5.37 -8.38, 5.54 -8.93, 5.83 -9.45 C6.12 -9.97, 6.55 -10.61, 6.97 -11.13 C7.4 -11.66, 7.84 -12.14, 8.35 -12.6 C8.87 -13.06, 9.38 -13.49, 10.04 -13.89 C10.7 -14.3, 11.52 -14.73, 12.33 -15.01 C13.13 -15.3, 14.1 -15.47, 14.85 -15.59 C15.6 -15.72, 16.11 -15.75, 16.82 -15.74 C17.52 -15.73, 18.32 -15.68, 19.08 -15.51 C19.84 -15.34, 20.56 -15.11, 21.39 -14.7 C22.21 -14.29, 23.28 -13.65, 24.05 -13.06 C24.82 -12.46, 25.45 -11.78, 26 -11.13 C26.55 -10.47, 26.97 -9.85, 27.33 -9.13 C27.7 -8.42, 27.99 -7.73, 28.21 -6.85 C28.44 -5.96, 28.67 -4.9, 28.69 -3.83 C28.71 -2.76, 28.6 -1.47, 28.35 -0.44 C28.1 0.59, 27.67 1.52, 27.21 2.37 C26.76 3.21, 26.27 3.92, 25.61 4.64 C24.95 5.36, 24.1 6.13, 23.24 6.68 C22.38 7.24, 21.32 7.67, 20.45 7.99 C19.58 8.3, 18.87 8.46, 18.01 8.57 C17.16 8.69, 16.35 8.8, 15.32 8.67 C14.28 8.55, 12.83 8.24, 11.79 7.81 C10.75 7.39, 9.93 6.77, 9.08 6.11 C8.24 5.44, 7.31 4.51, 6.73 3.82 C6.14 3.13, 5.9 2.57, 5.58 1.96 C5.26 1.35, 5.07 0.5, 4.8 0.17 C4.53 -0.16, 4.77 0.03, 3.97 0 C3.17 -0.02, 0.66 0, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-13"></path></g></g><mask></mask></svg>
        `,
        css: `
        /***************************************************
 * Generated by SVG Artista on 9/8/2025, 2:33:34 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 33.69483947753906px;
  stroke-dasharray: 33.69483947753906px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 0;
}

svg .svg-elem-2 {
  stroke-dashoffset: 33.69483947753906px;
  stroke-dasharray: 33.69483947753906px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 0;
}

svg .svg-elem-3 {
  stroke-dashoffset: 33.69483947753906px;
  stroke-dasharray: 33.69483947753906px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 0;
}

svg .svg-elem-4 {
  stroke-dashoffset: 33.69483947753906px;
  stroke-dasharray: 33.69483947753906px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 0;
}

svg .svg-elem-5 {
  stroke-dashoffset: 33.69483947753906px;
  stroke-dasharray: 33.69483947753906px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 0;
}

svg .svg-elem-6 {
  stroke-dashoffset: 497.74188232421875px;
  stroke-dasharray: 497.74188232421875px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 0;
}

svg .svg-elem-7 {
  stroke-dashoffset: 2421.400390625px;
  stroke-dasharray: 2421.400390625px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 0;
}

svg .svg-elem-8 {
  stroke-dashoffset: 1065.1400146484375px;
  stroke-dasharray: 1065.1400146484375px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.84s;
}

svg.active .svg-elem-8 {
  stroke-dashoffset: 0;
}

svg .svg-elem-9 {
  stroke-dashoffset: 301.76837158203125px;
  stroke-dasharray: 301.76837158203125px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.96s;
}

svg.active .svg-elem-9 {
  stroke-dashoffset: 0;
}

svg .svg-elem-10 {
  stroke-dashoffset: 24.891944885253906px;
  stroke-dasharray: 24.891944885253906px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.08s;
}

svg.active .svg-elem-10 {
  stroke-dashoffset: 0;
}

svg .svg-elem-11 {
  stroke-dashoffset: 330.1936950683594px;
  stroke-dasharray: 330.1936950683594px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.2s;
}

svg.active .svg-elem-11 {
  stroke-dashoffset: 0;
}

svg .svg-elem-12 {
  stroke-dashoffset: 24.891944885253906px;
  stroke-dasharray: 24.891944885253906px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.3199999999999998s;
}

svg.active .svg-elem-12 {
  stroke-dashoffset: 0;
}

svg .svg-elem-13 {
  stroke-dashoffset: 206.32180786132812px;
  stroke-dasharray: 206.32180786132812px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 1.44s;
}

svg.active .svg-elem-13 {
  stroke-dashoffset: 0;
}

        `,
    },
    {
        name: "HOME.old",
        svg: `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 552.6206836866115 459.4788257961046" width="552.6206665039062" height="459.47882080078125" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      @font-face { font-family: Local Font; src: url(data:font/otf;charset=utf-8;base64,T1RUTwAKAIAAAwAgQ0ZGIF7Zkm0AAAoMAAAy1EdQT1PmsPQXAABAeAAAAjZPUy8yVoUq4QAAARAAAABgY21hcM8akJkAAAa8AAADMGhlYWTaVtXCAAAArAAAADZoaGVhBtUDcQAAAOQAAAAkaG10eEnPHUsAADzgAAADmG1heHAA5lAAAAABCAAAAAZuYW1lm0e9KgAAAXAAAAVMcG9zdP+4ADIAAAnsAAAAIAABAAAAAQAAO3M1Xl8PPPUQAwPoAAAAALQjyP8AAAAAtCPI//+D/yMDdQPBAAAAAwACAAAAAAAAAAEAAAMg/zwAugPo/4P/ZgN1AAEAAAAAAAAAAAAAAAAAAADmAABQAADmAAAAAgFvASwAAwAEAfQB9AAAAPoB9AH0AAAB9AAyAWAAAAILBAYAAAAAAACAAACvQAAASgAAAAAAAAAAQURCRQAAACD7AgML/yMAtgPBAN0AAAABAAAAAAIBAvIgIgAgAAIAAAATAOoAAQAAAAAAAACeAAAAAQAAAAAAAQAGAJ4AAQAAAAAAAgAPAKQAAQAAAAAAAwAeALMAAQAAAAAABAAWANEAAQAAAAAABQAeAOcAAQAAAAAABgAVAQUAAQAAAAAABwBRARoAAQAAAAAAEgAVAWsAAwABBAkAAAE8AYAAAwABBAkAAQAqArwAAwABBAkAAgAOAuYAAwABBAkAAwA8AvQAAwABBAkABAAqAzAAAwABBAkABQA8A1oAAwABBAkABgAqAzAAAwABBAkABwCiA5YAAwABBAkAEAAMBDgAAwABBAkAEQAeBERDb3B5cmlnaHQgKGMpIDE5ODcsIDE5OTEsIDE5OTIsIDE5OTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuICBBbGwgUmlnaHRzIFJlc2VydmVkLkZ1dHVyYSBpcyBhIHJlZ2lzdGVyZWQgdHJhZGVtYXJrIG9mIEZ1bmRpY2lvbiBUaXBvZ3JhZmljYSBOZXVmdmlsbGUgUy5BLkZ1dHVyYUxpZ2h0IENvbmRlbnNlZDEuMDtBREJFO0Z1dHVyYS1Db25kZW5zZWRMaWdodEZ1dHVyYSBMaWdodCBDb25kZW5zZWRPVEYgMS4wO1BTIDAwMS4wMDM7Q29yZSAxLjAuMjJGdXR1cmEtQ29uZGVuc2VkTGlnaHRQbGVhc2UgcmVmZXIgdG8gdGhlIENvcHlyaWdodCBzZWN0aW9uIGZvciB0aGUgZm9udCB0cmFkZW1hcmsgYXR0cmlidXRpb24gbm90aWNlcy5GdXR1cmEgQ29uZGVuc2VkTGlnaHQAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADEAOQA4ADcALAAgADEAOQA5ADEALAAgADEAOQA5ADIALAAgADEAOQA5ADMAIABBAGQAbwBiAGUAIABTAHkAcwB0AGUAbQBzACAASQBuAGMAbwByAHAAbwByAGEAdABlAGQALgAgACAAQQBsAGwAIABSAGkAZwBoAHQAcwAgAFIAZQBzAGUAcgB2AGUAZAAuAEYAdQB0AHUAcgBhACAAaQBzACAAYQAgAHIAZQBnAGkAcwB0AGUAcgBlAGQAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEYAdQBuAGQAaQBjAGkAbwBuACAAVABpAHAAbwBnAHIAYQBmAGkAYwBhACAATgBlAHUAZgB2AGkAbABsAGUAIABTAC4AQQAuAEYAdQB0AHUAcgBhACAAQwBvAG4AZABlAG4AcwBlAGQATABpAGcAaAB0AFIAZQBnAHUAbABhAHIAMQAuADAAOwBBAEQAQgBFADsARgB1AHQAdQByAGEALQBDAG8AbgBkAGUAbgBzAGUAZABMAGkAZwBoAHQARgB1AHQAdQByAGEALQBDAG8AbgBkAGUAbgBzAGUAZABMAGkAZwBoAHQATwBUAEYAIAAxAC4AMAA7AFAAUwAgADAAMAAxAC4AMAAwADMAOwBDAG8AcgBlACAAMQAuADAALgAyADIAUABsAGUAYQBzAGUAIAByAGUAZgBlAHIAIAB0AG8AIAB0AGgAZQAgAEMAbwBwAHkAcgBpAGcAaAB0ACAAcwBlAGMAdABpAG8AbgAgAGYAbwByACAAdABoAGUAIABmAG8AbgB0ACAAdAByAGEAZABlAG0AYQByAGsAIABhAHQAdAByAGkAYgB1AHQAaQBvAG4AIABuAG8AdABpAGMAZQBzAC4ARgB1AHQAdQByAGEATABpAGcAaAB0ACAAQwBvAG4AZABlAG4AcwBlAGQAAAADAAAAAwAAASIAAQAAAAAAHAADAAEAAAEiAAABBgAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAABAgMEBQYHaAkK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); }</style></defs><g stroke-linecap="round"><g transform="translate(149.65277075745018 62.22085405244508) rotate(0 151.0447278920103 120.11316034985393)"><path d="M0 0 C-0.26 16.64, -3.28 74.49, -1.59 99.83 C0.11 125.16, 4.33 134.71, 10.15 152 C15.98 169.3, 21.87 186.08, 33.37 203.6 C44.86 221.12, 63.12 242.88, 79.14 257.13 C95.17 271.37, 116.08 283.21, 129.52 289.09 C142.96 294.96, 149.15 294.58, 159.78 292.38 C170.4 290.17, 178.46 286.25, 193.26 275.86 C208.07 265.46, 233.25 247.16, 248.61 229.99 C263.96 212.82, 276.79 190.81, 285.41 172.86 C294.03 154.9, 297.31 140.59, 300.35 122.25 C303.4 103.92, 303.45 84.66, 303.68 62.84 C303.9 41.01, 303.06 6.38, 301.71 -8.7 C300.37 -23.78, 301.3 -22.28, 295.61 -27.65 C289.92 -33.01, 281.95 -37.34, 267.57 -40.86 C253.18 -44.39, 230.9 -46.9, 209.32 -48.78 C187.74 -50.66, 161.69 -52.62, 138.08 -52.15 C114.47 -51.69, 86.01 -48.69, 67.64 -46 C49.27 -43.3, 38.54 -38.93, 27.88 -35.98 C17.21 -33.03, 8.31 -34.28, 3.66 -28.28 C-0.99 -22.28, 0.61 -4.71, 0 0 M0 0 C-0.26 16.64, -3.28 74.49, -1.59 99.83 C0.11 125.16, 4.33 134.71, 10.15 152 C15.98 169.3, 21.87 186.08, 33.37 203.6 C44.86 221.12, 63.12 242.88, 79.14 257.13 C95.17 271.37, 116.08 283.21, 129.52 289.09 C142.96 294.96, 149.15 294.58, 159.78 292.38 C170.4 290.17, 178.46 286.25, 193.26 275.86 C208.07 265.46, 233.25 247.16, 248.61 229.99 C263.96 212.82, 276.79 190.81, 285.41 172.86 C294.03 154.9, 297.31 140.59, 300.35 122.25 C303.4 103.92, 303.45 84.66, 303.68 62.84 C303.9 41.01, 303.06 6.38, 301.71 -8.7 C300.37 -23.78, 301.3 -22.28, 295.61 -27.65 C289.92 -33.01, 281.95 -37.34, 267.57 -40.86 C253.18 -44.39, 230.9 -46.9, 209.32 -48.78 C187.74 -50.66, 161.69 -52.62, 138.08 -52.15 C114.47 -51.69, 86.01 -48.69, 67.64 -46 C49.27 -43.3, 38.54 -38.93, 27.88 -35.98 C17.21 -33.03, 8.31 -34.28, 3.66 -28.28 C-0.99 -22.28, 0.61 -4.71, 0 0" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-1"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(203.77504538379844 137.2968228543735) rotate(0 36.2930149922639 -7.566426856124693)"><path d="M0 0 C3.06 -2.04, 11.13 -9.74, 18.38 -12.26 C25.63 -14.78, 36.31 -15.57, 43.5 -15.13 C50.69 -14.7, 56.68 -11.69, 61.53 -9.65 C66.38 -7.6, 70.74 -4, 72.59 -2.87 M0 0 C3.06 -2.04, 11.13 -9.74, 18.38 -12.26 C25.63 -14.78, 36.31 -15.57, 43.5 -15.13 C50.69 -14.7, 56.68 -11.69, 61.53 -9.65 C66.38 -7.6, 70.74 -4, 72.59 -2.87" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-2"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(323.697180290063 137.11931597434966) rotate(0 36.2930149922639 -7.566426856124693)"><path d="M0 0 C3.06 -2.04, 11.13 -9.74, 18.38 -12.26 C25.63 -14.78, 36.31 -15.57, 43.5 -15.13 C50.69 -14.7, 56.68 -11.69, 61.53 -9.65 C66.38 -7.6, 70.74 -4, 72.59 -2.87 M0 0 C3.06 -2.04, 11.13 -9.74, 18.38 -12.26 C25.63 -14.78, 36.31 -15.57, 43.5 -15.13 C50.69 -14.7, 56.68 -11.69, 61.53 -9.65 C66.38 -7.6, 70.74 -4, 72.59 -2.87" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-3"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(218.3730278539956 222.03455945023035) rotate(0 82.37744843599705 29.330592395873147)"><path d="M0 0 C12.54 2.1, 57.02 10.9, 75.26 12.59 C93.5 14.27, 94.53 12.31, 109.44 10.11 C124.36 7.91, 159.83 -2.04, 164.75 -0.61 C169.68 0.82, 147.86 11.3, 138.99 18.71 C130.12 26.12, 119.9 37.11, 111.53 43.87 C103.17 50.63, 96.37 57.4, 88.81 59.27 C81.25 61.15, 76.36 61.73, 66.2 55.12 C56.03 48.52, 38.86 28.84, 27.82 19.65 C16.79 10.46, 4.64 3.27, 0 0 M0 0 C12.54 2.1, 57.02 10.9, 75.26 12.59 C93.5 14.27, 94.53 12.31, 109.44 10.11 C124.36 7.91, 159.83 -2.04, 164.75 -0.61 C169.68 0.82, 147.86 11.3, 138.99 18.71 C130.12 26.12, 119.9 37.11, 111.53 43.87 C103.17 50.63, 96.37 57.4, 88.81 59.27 C81.25 61.15, 76.36 61.73, 66.2 55.12 C56.03 48.52, 38.86 28.84, 27.82 19.65 C16.79 10.46, 4.64 3.27, 0 0" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g transform="translate(330.4697728315847 351.8509071408669) rotate(330.7733495541438 24.79535675048828 38.59544227914998)"><text x="0" y="58.02181489298879" font-family="Local Font, sans-serif, Segoe UI Emoji" font-size="64.32573713191663px" fill="#E1E1E1" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">HE</text></g><g transform="translate(461.11330207148114 135.58548256568685) rotate(13.031357985469882 35.053504943847656 54.56305338541633)"><text x="0" y="82.02645692274255" font-family="Local Font, sans-serif, Segoe UI Emoji" font-size="90.93842230902722px" fill="#E1E1E1" text-anchor="start" style="white-space: pre;" direction="ltr" dominant-baseline="alphabetic">HE</text></g><g stroke-linecap="round"><g transform="translate(147.8777479326642 112.583430249875) rotate(0 15.341674228922159 168.17378822884882)"><path d="M0 0 C-6.22 1.93, -22.39 5.97, -37.29 11.59 C-52.19 17.22, -73.66 26.33, -89.42 33.77 C-105.18 41.21, -123.89 49.29, -131.83 56.22 C-139.77 63.16, -137.91 64.15, -137.07 75.39 C-136.23 86.64, -131.29 106.93, -126.78 123.69 C-122.27 140.45, -115.65 159.16, -110 175.95 C-104.35 192.74, -101.6 208.97, -92.9 224.43 C-84.2 239.89, -71.16 255.59, -57.8 268.71 C-44.44 281.82, -27.87 293.94, -12.72 303.12 C2.43 312.3, 18.67 318.25, 33.11 323.79 C47.54 329.33, 61.99 335.2, 73.87 336.35 C85.74 337.49, 93.56 337.37, 104.36 330.67 C115.16 323.97, 128.92 307.86, 138.66 296.13 C148.41 284.41, 158 269.23, 162.85 260.31 C167.7 251.39, 166.94 245.55, 167.75 242.6 M0 0 C-6.22 1.93, -22.39 5.97, -37.29 11.59 C-52.19 17.22, -73.66 26.33, -89.42 33.77 C-105.18 41.21, -123.89 49.29, -131.83 56.22 C-139.77 63.16, -137.91 64.15, -137.07 75.39 C-136.23 86.64, -131.29 106.93, -126.78 123.69 C-122.27 140.45, -115.65 159.16, -110 175.95 C-104.35 192.74, -101.6 208.97, -92.9 224.43 C-84.2 239.89, -71.16 255.59, -57.8 268.71 C-44.44 281.82, -27.87 293.94, -12.72 303.12 C2.43 312.3, 18.67 318.25, 33.11 323.79 C47.54 329.33, 61.99 335.2, 73.87 336.35 C85.74 337.49, 93.56 337.37, 104.36 330.67 C115.16 323.97, 128.92 307.86, 138.66 296.13 C148.41 284.41, 158 269.23, 162.85 260.31 C167.7 251.39, 166.94 245.55, 167.75 242.6" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-5"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(72.97515770020675 261.44462801688843) rotate(340.9377246107457 36.29301499226389 -7.566426856124689)"><path d="M0 0 C3.06 -2.04, 11.13 -9.74, 18.38 -12.26 C25.63 -14.78, 36.31 -15.57, 43.5 -15.13 C50.69 -14.7, 56.68 -11.69, 61.53 -9.65 C66.38 -7.6, 70.74 -4, 72.59 -2.87 M0 0 C3.06 -2.04, 11.13 -9.74, 18.38 -12.26 C25.63 -14.78, 36.31 -15.57, 43.5 -15.13 C50.69 -14.7, 56.68 -11.69, 61.53 -9.65 C66.38 -7.6, 70.74 -4, 72.59 -2.87" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(126.81282113977306 325.10434726906607) rotate(346.1740762618228 64.36723544777847 29.63623310561826)"><path d="M0 0 C12.54 2.1, 57.08 11.03, 75.26 12.59 C93.45 14.14, 101.58 8.18, 109.13 9.34 C116.68 10.5, 117.29 16.12, 120.55 19.55 C123.82 22.99, 130.24 25.89, 128.73 29.94 C127.23 34, 118.19 38.99, 111.53 43.87 C104.88 48.76, 96.37 57.4, 88.81 59.27 C81.25 61.15, 76.36 61.73, 66.2 55.12 C56.03 48.52, 38.86 28.84, 27.82 19.65 C16.79 10.46, 4.64 3.27, 0 0 M0 0 C12.54 2.1, 57.08 11.03, 75.26 12.59 C93.45 14.14, 101.58 8.18, 109.13 9.34 C116.68 10.5, 117.29 16.12, 120.55 19.55 C123.82 22.99, 130.24 25.89, 128.73 29.94 C127.23 34, 118.19 38.99, 111.53 43.87 C104.88 48.76, 96.37 57.4, 88.81 59.27 C81.25 61.15, 76.36 61.73, 66.2 55.12 C56.03 48.52, 38.86 28.84, 27.82 19.65 C16.79 10.46, 4.64 3.27, 0 0" stroke="#E1E1E1" stroke-width="4" fill="none" class="svg-elem-7"></path></g></g><mask></mask></svg>
        `,
        css: `
       /***************************************************
 * Generated by SVG Artista on 9/8/2025, 2:44:39 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 2167.61279296875px;
  stroke-dasharray: 2167.61279296875px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 0;
}

svg .svg-elem-2 {
  stroke-dashoffset: 161.12576293945312px;
  stroke-dasharray: 161.12576293945312px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 0;
}

svg .svg-elem-3 {
  stroke-dashoffset: 161.12576293945312px;
  stroke-dasharray: 161.12576293945312px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 0;
}

svg .svg-elem-4 {
  stroke-dashoffset: 754.2044677734375px;
  stroke-dasharray: 754.2044677734375px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 0;
}

svg .svg-elem-5 {
  stroke-dashoffset: 1342.131591796875px;
  stroke-dasharray: 1342.131591796875px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 0;
}

svg .svg-elem-6 {
  stroke-dashoffset: 161.12576293945312px;
  stroke-dasharray: 161.12576293945312px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 0;
}

svg .svg-elem-7 {
  stroke-dashoffset: 603.5216674804688px;
  stroke-dasharray: 603.5216674804688px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 0;
}

        `,
    },
    {
        name: "GENERAL",
        svg: `
     <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104.43368665770225 175.22192531317654" width="104.43368530273438" height="175.221923828125" class="excalidraw-svg"><!-- svg-source:excalidraw --><metadata></metadata><defs><style class="style-fonts">
      </style></defs><g stroke-linecap="round"><g transform="translate(29.63930153436094 61.94872001451786) rotate(0 14.11757196159207 11.575432630661346)"><path d="M0 0 C0.25 1.99, 0.96 7.89, 1.47 11.96 C1.98 16.04, 2.72 21.77, 3.05 24.45 C3.39 27.13, 3.39 27.22, 3.49 28.04 C3.59 28.86, 3.65 29.08, 3.66 29.37 C3.67 29.67, 3.65 29.57, 3.55 29.8 C3.44 30.03, 3.25 30.34, 3.01 30.73 C2.78 31.13, 2.72 31.25, 2.16 32.19 C1.61 33.12, 0.63 34.78, -0.32 36.37 C-1.27 37.96, -2.32 39.71, -3.51 41.73 C-4.7 43.74, -6.16 46.26, -7.46 48.46 C-8.77 50.66, -10.12 52.86, -11.33 54.93 C-12.54 56.99, -13.62 58.94, -14.74 60.85 C-15.86 62.75, -17.32 65.14, -18.06 66.34 C-18.79 67.55, -18.87 67.56, -19.12 68.06 C-19.38 68.57, -19.52 68.93, -19.59 69.38 C-19.66 69.82, -19.67 70.21, -19.54 70.75 C-19.42 71.28, -19.18 72.04, -18.84 72.6 C-18.5 73.15, -17.94 73.7, -17.5 74.07 C-17.07 74.45, -16.73 74.67, -16.21 74.83 C-15.69 75, -15.03 75.11, -14.39 75.06 C-13.75 75, -12.98 74.86, -12.36 74.52 C-11.75 74.18, -11.36 73.9, -10.7 73 C-10.04 72.1, -9.23 70.58, -8.38 69.11 C-7.52 67.65, -6.8 66.35, -5.57 64.21 C-4.33 62.07, -3.24 60.17, -0.95 56.28 C1.35 52.39, 4.36 47.33, 8.2 40.89 C12.04 34.44, 17.91 24.65, 22.09 17.61 C26.28 10.57, 30.37 3.56, 33.31 -1.37 C36.26 -6.31, 37.88 -8.87, 39.75 -12 C41.61 -15.12, 43.43 -18.29, 44.52 -20.15 C45.61 -22.01, 45.8 -22.27, 46.29 -23.16 C46.78 -24.05, 47.21 -24.87, 47.46 -25.5 C47.72 -26.14, 47.78 -26.49, 47.82 -26.96 C47.87 -27.43, 47.87 -27.89, 47.72 -28.31 C47.57 -28.74, 47.27 -29.1, 46.94 -29.51 C46.6 -29.93, 46.3 -30.24, 45.7 -30.79 C45.1 -31.34, 44.07 -32.16, 43.33 -32.81 C42.59 -33.47, 41.83 -34.16, 41.25 -34.7 C40.67 -35.24, 40.92 -35, 39.85 -36.05 C38.78 -37.1, 36.45 -39.4, 34.82 -41.01 C33.2 -42.63, 31.53 -44.3, 30.09 -45.75 C28.66 -47.19, 27.15 -48.77, 26.21 -49.69 C25.27 -50.6, 25 -50.88, 24.46 -51.25 C23.92 -51.61, 23.48 -51.76, 22.98 -51.87 C22.49 -51.98, 21.96 -51.96, 21.5 -51.91 C21.04 -51.85, 20.69 -51.8, 20.21 -51.56 C19.73 -51.32, 19.24 -51, 18.61 -50.47 C17.98 -49.94, 17.34 -49.28, 16.44 -48.38 C15.54 -47.49, 14.5 -46.4, 13.21 -45.12 C11.91 -43.84, 10.52 -42.49, 8.67 -40.68 C6.82 -38.88, 3.8 -35.94, 2.09 -34.29 C0.37 -32.63, -0.82 -31.56, -1.64 -30.75 C-2.45 -29.95, -2.48 -29.89, -2.78 -29.46 C-3.09 -29.03, -3.32 -28.7, -3.45 -28.17 C-3.57 -27.64, -3.57 -27.08, -3.52 -26.27 C-3.47 -25.45, -3.3 -24.44, -3.14 -23.28 C-2.97 -22.13, -2.79 -21.13, -2.53 -19.32 C-2.27 -17.52, -1.78 -13.89, -1.58 -12.45 C-1.38 -11, -1.4 -11.15, -1.33 -10.67 C-1.27 -10.19, -1.14 -9.77, -1.19 -9.57 C-1.24 -9.38, -1.33 -9.52, -1.62 -9.5 C-1.92 -9.49, -2.48 -9.52, -2.98 -9.5 C-3.48 -9.49, -4.11 -9.48, -4.62 -9.42 C-5.13 -9.35, -5.65 -9.25, -6.06 -9.13 C-6.47 -9.01, -6.72 -8.92, -7.09 -8.68 C-7.45 -8.44, -7.93 -8.05, -8.24 -7.67 C-8.55 -7.28, -8.79 -6.87, -8.94 -6.38 C-9.09 -5.89, -9.15 -5.28, -9.13 -4.72 C-9.11 -4.17, -8.98 -3.54, -8.82 -3.05 C-8.65 -2.57, -8.4 -2.19, -8.13 -1.82 C-7.86 -1.46, -7.5 -1.12, -7.19 -0.86 C-6.89 -0.61, -6.63 -0.45, -6.29 -0.3 C-5.95 -0.15, -5.67 -0.03, -5.17 0.02 C-4.67 0.07, -3.9 0, -3.31 0 C-2.71 -0.01, -2.17 -0.02, -1.61 -0.02 C-1.06 -0.02, -0.27 0, 0 0 M0 0 C0.25 1.99, 0.96 7.89, 1.47 11.96 C1.98 16.04, 2.72 21.77, 3.05 24.45 C3.39 27.13, 3.39 27.22, 3.49 28.04 C3.59 28.86, 3.65 29.08, 3.66 29.37 C3.67 29.67, 3.65 29.57, 3.55 29.8 C3.44 30.03, 3.25 30.34, 3.01 30.73 C2.78 31.13, 2.72 31.25, 2.16 32.19 C1.61 33.12, 0.63 34.78, -0.32 36.37 C-1.27 37.96, -2.32 39.71, -3.51 41.73 C-4.7 43.74, -6.16 46.26, -7.46 48.46 C-8.77 50.66, -10.12 52.86, -11.33 54.93 C-12.54 56.99, -13.62 58.94, -14.74 60.85 C-15.86 62.75, -17.32 65.14, -18.06 66.34 C-18.79 67.55, -18.87 67.56, -19.12 68.06 C-19.38 68.57, -19.52 68.93, -19.59 69.38 C-19.66 69.82, -19.67 70.21, -19.54 70.75 C-19.42 71.28, -19.18 72.04, -18.84 72.6 C-18.5 73.15, -17.94 73.7, -17.5 74.07 C-17.07 74.45, -16.73 74.67, -16.21 74.83 C-15.69 75, -15.03 75.11, -14.39 75.06 C-13.75 75, -12.98 74.86, -12.36 74.52 C-11.75 74.18, -11.36 73.9, -10.7 73 C-10.04 72.1, -9.23 70.58, -8.38 69.11 C-7.52 67.65, -6.8 66.35, -5.57 64.21 C-4.33 62.07, -3.24 60.17, -0.95 56.28 C1.35 52.39, 4.36 47.33, 8.2 40.89 C12.04 34.44, 17.91 24.65, 22.09 17.61 C26.28 10.57, 30.37 3.56, 33.31 -1.37 C36.26 -6.31, 37.88 -8.87, 39.75 -12 C41.61 -15.12, 43.43 -18.29, 44.52 -20.15 C45.61 -22.01, 45.8 -22.27, 46.29 -23.16 C46.78 -24.05, 47.21 -24.87, 47.46 -25.5 C47.72 -26.14, 47.78 -26.49, 47.82 -26.96 C47.87 -27.43, 47.87 -27.89, 47.72 -28.31 C47.57 -28.74, 47.27 -29.1, 46.94 -29.51 C46.6 -29.93, 46.3 -30.24, 45.7 -30.79 C45.1 -31.34, 44.07 -32.16, 43.33 -32.81 C42.59 -33.47, 41.83 -34.16, 41.25 -34.7 C40.67 -35.24, 40.92 -35, 39.85 -36.05 C38.78 -37.1, 36.45 -39.4, 34.82 -41.01 C33.2 -42.63, 31.53 -44.3, 30.09 -45.75 C28.66 -47.19, 27.15 -48.77, 26.21 -49.69 C25.27 -50.6, 25 -50.88, 24.46 -51.25 C23.92 -51.61, 23.48 -51.76, 22.98 -51.87 C22.49 -51.98, 21.96 -51.96, 21.5 -51.91 C21.04 -51.85, 20.69 -51.8, 20.21 -51.56 C19.73 -51.32, 19.24 -51, 18.61 -50.47 C17.98 -49.94, 17.34 -49.28, 16.44 -48.38 C15.54 -47.49, 14.5 -46.4, 13.21 -45.12 C11.91 -43.84, 10.52 -42.49, 8.67 -40.68 C6.82 -38.88, 3.8 -35.94, 2.09 -34.29 C0.37 -32.63, -0.82 -31.56, -1.64 -30.75 C-2.45 -29.95, -2.48 -29.89, -2.78 -29.46 C-3.09 -29.03, -3.32 -28.7, -3.45 -28.17 C-3.57 -27.64, -3.57 -27.08, -3.52 -26.27 C-3.47 -25.45, -3.3 -24.44, -3.14 -23.28 C-2.97 -22.13, -2.79 -21.13, -2.53 -19.32 C-2.27 -17.52, -1.78 -13.89, -1.58 -12.45 C-1.38 -11, -1.4 -11.15, -1.33 -10.67 C-1.27 -10.19, -1.14 -9.77, -1.19 -9.57 C-1.24 -9.38, -1.33 -9.52, -1.62 -9.5 C-1.92 -9.49, -2.48 -9.52, -2.98 -9.5 C-3.48 -9.49, -4.11 -9.48, -4.62 -9.42 C-5.13 -9.35, -5.65 -9.25, -6.06 -9.13 C-6.47 -9.01, -6.72 -8.92, -7.09 -8.68 C-7.45 -8.44, -7.93 -8.05, -8.24 -7.67 C-8.55 -7.28, -8.79 -6.87, -8.94 -6.38 C-9.09 -5.89, -9.15 -5.28, -9.13 -4.72 C-9.11 -4.17, -8.98 -3.54, -8.82 -3.05 C-8.65 -2.57, -8.4 -2.19, -8.13 -1.82 C-7.86 -1.46, -7.5 -1.12, -7.19 -0.86 C-6.89 -0.61, -6.63 -0.45, -6.29 -0.3 C-5.95 -0.15, -5.67 -0.03, -5.17 0.02 C-4.67 0.07, -3.9 0, -3.31 0 C-2.71 -0.01, -2.17 -0.02, -1.61 -0.02 C-1.06 -0.02, -0.27 0, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-1"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(41.40530476334294 114.73903780014237) rotate(0 19.26559273509604 -13.013897427139199)"><path d="M0 0 C1.33 -2.23, 4.85 -8.1, 7.98 -13.41 C11.11 -18.72, 14.84 -25.21, 18.79 -31.86 C22.75 -38.5, 27.88 -46.81, 31.7 -53.26 C35.53 -59.72, 39.84 -67.32, 41.75 -70.6 C43.65 -73.88, 42.73 -72.29, 43.11 -72.93 C43.5 -73.56, 43.75 -73.97, 44.06 -74.39 C44.37 -74.81, 44.61 -75.16, 44.97 -75.45 C45.33 -75.74, 45.8 -75.97, 46.21 -76.13 C46.62 -76.3, 47 -76.4, 47.44 -76.45 C47.88 -76.51, 48.4 -76.53, 48.85 -76.46 C49.3 -76.39, 49.73 -76.25, 50.14 -76.03 C50.54 -75.81, 50.95 -75.44, 51.27 -75.13 C51.59 -74.83, 51.83 -74.54, 52.06 -74.21 C52.28 -73.87, 52.47 -73.47, 52.62 -73.12 C52.76 -72.76, 52.86 -72.39, 52.93 -72.05 C52.99 -71.71, 53.06 -71.47, 53.01 -71.08 C52.97 -70.68, 52.93 -70.24, 52.65 -69.68 C52.38 -69.13, 51.86 -68.55, 51.37 -67.75 C50.87 -66.94, 50.55 -66.38, 49.67 -64.87 C48.79 -63.37, 47.59 -61.27, 46.09 -58.71 C44.58 -56.16, 42.54 -52.72, 40.65 -49.52 C38.76 -46.33, 36.31 -42.19, 34.75 -39.56 C33.19 -36.93, 32.01 -34.93, 31.28 -33.72 C30.56 -32.5, 30.67 -32.69, 30.42 -32.26 C30.17 -31.84, 29.91 -31.45, 29.8 -31.18 C29.69 -30.91, 29.73 -31.04, 29.76 -30.66 C29.78 -30.27, 29.76 -30.48, 29.95 -28.88 C30.14 -27.27, 30.55 -23.77, 30.89 -21.01 C31.22 -18.25, 31.55 -15.68, 31.96 -12.3 C32.38 -8.92, 32.95 -4.19, 33.39 -0.73 C33.82 2.73, 34.14 5.1, 34.6 8.45 C35.05 11.8, 35.76 16.9, 36.12 19.38 C36.48 21.85, 36.61 22.31, 36.75 23.32 C36.88 24.34, 36.93 24.88, 36.93 25.46 C36.93 26.05, 36.91 26.37, 36.76 26.83 C36.61 27.29, 36.51 27.67, 36.03 28.24 C35.55 28.82, 34.9 29.31, 33.88 30.3 C32.86 31.28, 31.19 32.88, 29.89 34.15 C28.59 35.41, 27.57 36.44, 26.09 37.89 C24.61 39.34, 22.53 41.34, 21 42.84 C19.47 44.34, 17.95 45.87, 16.92 46.9 C15.89 47.92, 15.49 48.42, 14.79 48.99 C14.1 49.56, 13.45 50.05, 12.76 50.29 C12.06 50.53, 11.23 50.5, 10.62 50.44 C10.01 50.37, 9.81 50.41, 9.11 49.91 C8.41 49.42, 7.76 48.78, 6.42 47.47 C5.08 46.17, 3.37 44.37, 1.07 42.08 C-1.23 39.78, -5.11 35.87, -7.39 33.71 C-9.66 31.56, -11.46 30.2, -12.57 29.14 C-13.68 28.09, -13.73 27.91, -14.05 27.38 C-14.37 26.85, -14.46 26.45, -14.48 25.94 C-14.5 25.42, -14.49 25.06, -14.18 24.28 C-13.88 23.51, -13.42 22.65, -12.65 21.28 C-11.89 19.91, -10.9 18.3, -9.59 16.07 C-8.28 13.84, -6.39 10.59, -4.79 7.91 C-3.19 5.23, -0.8 1.32, 0 0 M0 0 C1.33 -2.23, 4.85 -8.1, 7.98 -13.41 C11.11 -18.72, 14.84 -25.21, 18.79 -31.86 C22.75 -38.5, 27.88 -46.81, 31.7 -53.26 C35.53 -59.72, 39.84 -67.32, 41.75 -70.6 C43.65 -73.88, 42.73 -72.29, 43.11 -72.93 C43.5 -73.56, 43.75 -73.97, 44.06 -74.39 C44.37 -74.81, 44.61 -75.16, 44.97 -75.45 C45.33 -75.74, 45.8 -75.97, 46.21 -76.13 C46.62 -76.3, 47 -76.4, 47.44 -76.45 C47.88 -76.51, 48.4 -76.53, 48.85 -76.46 C49.3 -76.39, 49.73 -76.25, 50.14 -76.03 C50.54 -75.81, 50.95 -75.44, 51.27 -75.13 C51.59 -74.83, 51.83 -74.54, 52.06 -74.21 C52.28 -73.87, 52.47 -73.47, 52.62 -73.12 C52.76 -72.76, 52.86 -72.39, 52.93 -72.05 C52.99 -71.71, 53.06 -71.47, 53.01 -71.08 C52.97 -70.68, 52.93 -70.24, 52.65 -69.68 C52.38 -69.13, 51.86 -68.55, 51.37 -67.75 C50.87 -66.94, 50.55 -66.38, 49.67 -64.87 C48.79 -63.37, 47.59 -61.27, 46.09 -58.71 C44.58 -56.16, 42.54 -52.72, 40.65 -49.52 C38.76 -46.33, 36.31 -42.19, 34.75 -39.56 C33.19 -36.93, 32.01 -34.93, 31.28 -33.72 C30.56 -32.5, 30.67 -32.69, 30.42 -32.26 C30.17 -31.84, 29.91 -31.45, 29.8 -31.18 C29.69 -30.91, 29.73 -31.04, 29.76 -30.66 C29.78 -30.27, 29.76 -30.48, 29.95 -28.88 C30.14 -27.27, 30.55 -23.77, 30.89 -21.01 C31.22 -18.25, 31.55 -15.68, 31.96 -12.3 C32.38 -8.92, 32.95 -4.19, 33.39 -0.73 C33.82 2.73, 34.14 5.1, 34.6 8.45 C35.05 11.8, 35.76 16.9, 36.12 19.38 C36.48 21.85, 36.61 22.31, 36.75 23.32 C36.88 24.34, 36.93 24.88, 36.93 25.46 C36.93 26.05, 36.91 26.37, 36.76 26.83 C36.61 27.29, 36.51 27.67, 36.03 28.24 C35.55 28.82, 34.9 29.31, 33.88 30.3 C32.86 31.28, 31.19 32.88, 29.89 34.15 C28.59 35.41, 27.57 36.44, 26.09 37.89 C24.61 39.34, 22.53 41.34, 21 42.84 C19.47 44.34, 17.95 45.87, 16.92 46.9 C15.89 47.92, 15.49 48.42, 14.79 48.99 C14.1 49.56, 13.45 50.05, 12.76 50.29 C12.06 50.53, 11.23 50.5, 10.62 50.44 C10.01 50.37, 9.81 50.41, 9.11 49.91 C8.41 49.42, 7.76 48.78, 6.42 47.47 C5.08 46.17, 3.37 44.37, 1.07 42.08 C-1.23 39.78, -5.11 35.87, -7.39 33.71 C-9.66 31.56, -11.46 30.2, -12.57 29.14 C-13.68 28.09, -13.73 27.91, -14.05 27.38 C-14.37 26.85, -14.46 26.45, -14.48 25.94 C-14.5 25.42, -14.49 25.06, -14.18 24.28 C-13.88 23.51, -13.42 22.65, -12.65 21.28 C-11.89 19.91, -10.9 18.3, -9.59 16.07 C-8.28 13.84, -6.39 10.59, -4.79 7.91 C-3.19 5.23, -0.8 1.32, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-2"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(62.88073195056066 97.42233756707176) rotate(0 -0.05863968702746192 25.507314000179566)"><path d="M0 0 C0.09 0.77, 0.3 2.61, 0.56 4.62 C0.83 6.64, 1.3 9.86, 1.6 12.08 C1.89 14.29, 2.07 15.83, 2.32 17.9 C2.57 19.97, 2.81 22.11, 3.12 24.49 C3.43 26.87, 3.87 29.98, 4.17 32.18 C4.47 34.39, 4.78 36.48, 4.95 37.73 C5.11 38.99, 5.12 39.24, 5.14 39.72 C5.17 40.2, 5.2 40.27, 5.09 40.61 C4.97 40.96, 4.87 41.26, 4.46 41.79 C4.05 42.33, 3.39 42.98, 2.61 43.81 C1.83 44.65, 0.59 45.93, -0.22 46.79 C-1.04 47.65, -1.68 48.38, -2.29 48.99 C-2.9 49.6, -3.48 50.12, -3.88 50.45 C-4.28 50.79, -4.51 50.97, -4.71 51.01 C-4.91 51.06, -5.03 51.07, -5.08 50.73 C-5.13 50.38, -5.04 49.68, -5.02 48.94 C-5 48.21, -4.98 47.51, -4.96 46.3 C-4.95 45.09, -4.94 43.37, -4.94 41.7 C-4.94 40.02, -4.94 38.12, -4.94 36.23 C-4.94 34.35, -4.95 32.4, -4.96 30.37 C-4.96 28.34, -4.96 26.05, -4.98 24.04 C-5 22.04, -5.03 20.71, -5.07 18.34 C-5.12 15.97, -5.23 11.44, -5.26 9.81 C-5.29 8.17, -5.29 8.82, -5.24 8.52 C-5.19 8.22, -5.17 8.39, -4.96 8.02 C-4.74 7.65, -4.43 7.11, -3.93 6.3 C-3.44 5.5, -2.64 4.25, -1.99 3.2 C-1.33 2.15, -0.33 0.53, 0 0 M0 0 C0.09 0.77, 0.3 2.61, 0.56 4.62 C0.83 6.64, 1.3 9.86, 1.6 12.08 C1.89 14.29, 2.07 15.83, 2.32 17.9 C2.57 19.97, 2.81 22.11, 3.12 24.49 C3.43 26.87, 3.87 29.98, 4.17 32.18 C4.47 34.39, 4.78 36.48, 4.95 37.73 C5.11 38.99, 5.12 39.24, 5.14 39.72 C5.17 40.2, 5.2 40.27, 5.09 40.61 C4.97 40.96, 4.87 41.26, 4.46 41.79 C4.05 42.33, 3.39 42.98, 2.61 43.81 C1.83 44.65, 0.59 45.93, -0.22 46.79 C-1.04 47.65, -1.68 48.38, -2.29 48.99 C-2.9 49.6, -3.48 50.12, -3.88 50.45 C-4.28 50.79, -4.51 50.97, -4.71 51.01 C-4.91 51.06, -5.03 51.07, -5.08 50.73 C-5.13 50.38, -5.04 49.68, -5.02 48.94 C-5 48.21, -4.98 47.51, -4.96 46.3 C-4.95 45.09, -4.94 43.37, -4.94 41.7 C-4.94 40.02, -4.94 38.12, -4.94 36.23 C-4.94 34.35, -4.95 32.4, -4.96 30.37 C-4.96 28.34, -4.96 26.05, -4.98 24.04 C-5 22.04, -5.03 20.71, -5.07 18.34 C-5.12 15.97, -5.23 11.44, -5.26 9.81 C-5.29 8.17, -5.29 8.82, -5.24 8.52 C-5.19 8.22, -5.17 8.39, -4.96 8.02 C-4.74 7.65, -4.43 7.11, -3.93 6.3 C-3.44 5.5, -2.64 4.25, -1.99 3.2 C-1.33 2.15, -0.33 0.53, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-3"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(47.732472066375664 123.29369814259906) rotate(0 -4.66077954557724 12.820747618668351)"><path d="M0 0 C-0.01 0.66, -0.04 2.22, -0.05 3.97 C-0.05 5.72, -0.05 8.33, -0.04 10.48 C-0.04 12.64, -0.02 14.97, 0 16.9 C0.03 18.82, 0.08 20.66, 0.09 22.02 C0.1 23.38, 0.08 24.47, 0.07 25.07 C0.06 25.68, 0.1 25.59, 0.03 25.64 C-0.05 25.69, -0.14 25.59, -0.39 25.37 C-0.64 25.15, -0.9 24.86, -1.47 24.31 C-2.04 23.76, -2.95 22.92, -3.81 22.07 C-4.67 21.23, -5.81 20.04, -6.62 19.23 C-7.42 18.42, -8.16 17.66, -8.63 17.2 C-9.09 16.75, -9.3 16.67, -9.42 16.48 C-9.53 16.3, -9.46 16.35, -9.34 16.09 C-9.21 15.82, -8.97 15.47, -8.66 14.91 C-8.34 14.36, -7.89 13.58, -7.44 12.77 C-6.98 11.96, -6.47 11.05, -5.91 10.04 C-5.35 9.04, -4.69 7.8, -4.1 6.73 C-3.5 5.66, -2.88 4.53, -2.35 3.61 C-1.81 2.7, -1.28 1.86, -0.89 1.26 C-0.5 0.65, -0.15 0.21, 0 0 M0 0 C-0.01 0.66, -0.04 2.22, -0.05 3.97 C-0.05 5.72, -0.05 8.33, -0.04 10.48 C-0.04 12.64, -0.02 14.97, 0 16.9 C0.03 18.82, 0.08 20.66, 0.09 22.02 C0.1 23.38, 0.08 24.47, 0.07 25.07 C0.06 25.68, 0.1 25.59, 0.03 25.64 C-0.05 25.69, -0.14 25.59, -0.39 25.37 C-0.64 25.15, -0.9 24.86, -1.47 24.31 C-2.04 23.76, -2.95 22.92, -3.81 22.07 C-4.67 21.23, -5.81 20.04, -6.62 19.23 C-7.42 18.42, -8.16 17.66, -8.63 17.2 C-9.09 16.75, -9.3 16.67, -9.42 16.48 C-9.53 16.3, -9.46 16.35, -9.34 16.09 C-9.21 15.82, -8.97 15.47, -8.66 14.91 C-8.34 14.36, -7.89 13.58, -7.44 12.77 C-6.98 11.96, -6.47 11.05, -5.91 10.04 C-5.35 9.04, -4.69 7.8, -4.1 6.73 C-3.5 5.66, -2.88 4.53, -2.35 3.61 C-1.81 2.7, -1.28 1.86, -0.89 1.26 C-0.5 0.65, -0.15 0.21, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-4"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(41.58689102469703 78.00143812042133) rotate(0 3.9896373623658334 -8.0852561240808)"><path d="M0 0 C-0.25 -1.79, -1.15 -8.25, -1.48 -10.73 C-1.82 -13.2, -1.91 -13.95, -2.01 -14.83 C-2.12 -15.72, -2.21 -15.83, -2.09 -16.05 C-1.97 -16.26, -1.82 -16.11, -1.3 -16.12 C-0.78 -16.13, -0.14 -16.12, 1.04 -16.12 C2.21 -16.12, 4.51 -16.1, 5.75 -16.1 C6.99 -16.11, 7.77 -16.13, 8.49 -16.14 C9.21 -16.15, 9.88 -16.31, 10.07 -16.17 C10.26 -16.03, 9.92 -15.74, 9.65 -15.31 C9.37 -14.89, 8.96 -14.43, 8.41 -13.59 C7.86 -12.76, 7.11 -11.51, 6.34 -10.32 C5.57 -9.13, 4.53 -7.62, 3.79 -6.45 C3.06 -5.27, 2.55 -4.37, 1.92 -3.3 C1.29 -2.22, 0.32 -0.55, 0 0 M0 0 C-0.25 -1.79, -1.15 -8.25, -1.48 -10.73 C-1.82 -13.2, -1.91 -13.95, -2.01 -14.83 C-2.12 -15.72, -2.21 -15.83, -2.09 -16.05 C-1.97 -16.26, -1.82 -16.11, -1.3 -16.12 C-0.78 -16.13, -0.14 -16.12, 1.04 -16.12 C2.21 -16.12, 4.51 -16.1, 5.75 -16.1 C6.99 -16.11, 7.77 -16.13, 8.49 -16.14 C9.21 -16.15, 9.88 -16.31, 10.07 -16.17 C10.26 -16.03, 9.92 -15.74, 9.65 -15.31 C9.37 -14.89, 8.96 -14.43, 8.41 -13.59 C7.86 -12.76, 7.11 -11.51, 6.34 -10.32 C5.57 -9.13, 4.53 -7.62, 3.79 -6.45 C3.06 -5.27, 2.55 -4.37, 1.92 -3.3 C1.29 -2.22, 0.32 -0.55, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-5"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(38.3157310735027 52.44013227208616) rotate(0 12.969479414184358 -15.096996958386661)"><path d="M0 0 C-0.08 -0.61, -0.25 -2.02, -0.48 -3.66 C-0.71 -5.29, -1.16 -8.19, -1.38 -9.79 C-1.6 -11.39, -1.73 -12.38, -1.82 -13.25 C-1.9 -14.11, -1.98 -14.47, -1.88 -14.99 C-1.78 -15.5, -1.66 -15.75, -1.23 -16.33 C-0.81 -16.92, -0.26 -17.49, 0.66 -18.48 C1.58 -19.48, 3.25 -21.21, 4.3 -22.3 C5.35 -23.38, 6.02 -24.06, 6.98 -24.98 C7.94 -25.9, 9.27 -27.08, 10.06 -27.83 C10.86 -28.58, 11.28 -29.1, 11.75 -29.49 C12.22 -29.88, 12.58 -30.05, 12.89 -30.16 C13.21 -30.28, 13.35 -30.31, 13.64 -30.19 C13.92 -30.08, 14.05 -29.99, 14.59 -29.49 C15.13 -28.98, 16.01 -28.03, 16.86 -27.19 C17.71 -26.35, 18.7 -25.4, 19.66 -24.45 C20.63 -23.5, 21.68 -22.39, 22.67 -21.48 C23.66 -20.58, 24.86 -19.65, 25.63 -19 C26.4 -18.34, 26.94 -17.88, 27.3 -17.55 C27.67 -17.22, 27.76 -17.18, 27.82 -17.02 C27.88 -16.85, 27.77 -16.8, 27.64 -16.56 C27.52 -16.31, 27.49 -16.26, 27.08 -15.52 C26.68 -14.78, 25.77 -13.14, 25.21 -12.13 C24.66 -11.11, 24.29 -10.42, 23.74 -9.43 C23.19 -8.44, 22.52 -7.3, 21.9 -6.2 C21.28 -5.11, 20.58 -3.77, 20.03 -2.86 C19.49 -1.96, 18.96 -1.24, 18.62 -0.78 C18.29 -0.32, 18.24 -0.24, 18.02 -0.12 C17.8 0, 17.88 -0.07, 17.32 -0.05 C16.75 -0.03, 15.77 -0.03, 14.62 -0.02 C13.48 -0.01, 12.9 -0.02, 10.47 -0.02 C8.03 -0.01, 1.74 0, 0 0 M0 0 C-0.08 -0.61, -0.25 -2.02, -0.48 -3.66 C-0.71 -5.29, -1.16 -8.19, -1.38 -9.79 C-1.6 -11.39, -1.73 -12.38, -1.82 -13.25 C-1.9 -14.11, -1.98 -14.47, -1.88 -14.99 C-1.78 -15.5, -1.66 -15.75, -1.23 -16.33 C-0.81 -16.92, -0.26 -17.49, 0.66 -18.48 C1.58 -19.48, 3.25 -21.21, 4.3 -22.3 C5.35 -23.38, 6.02 -24.06, 6.98 -24.98 C7.94 -25.9, 9.27 -27.08, 10.06 -27.83 C10.86 -28.58, 11.28 -29.1, 11.75 -29.49 C12.22 -29.88, 12.58 -30.05, 12.89 -30.16 C13.21 -30.28, 13.35 -30.31, 13.64 -30.19 C13.92 -30.08, 14.05 -29.99, 14.59 -29.49 C15.13 -28.98, 16.01 -28.03, 16.86 -27.19 C17.71 -26.35, 18.7 -25.4, 19.66 -24.45 C20.63 -23.5, 21.68 -22.39, 22.67 -21.48 C23.66 -20.58, 24.86 -19.65, 25.63 -19 C26.4 -18.34, 26.94 -17.88, 27.3 -17.55 C27.67 -17.22, 27.76 -17.18, 27.82 -17.02 C27.88 -16.85, 27.77 -16.8, 27.64 -16.56 C27.52 -16.31, 27.49 -16.26, 27.08 -15.52 C26.68 -14.78, 25.77 -13.14, 25.21 -12.13 C24.66 -11.11, 24.29 -10.42, 23.74 -9.43 C23.19 -8.44, 22.52 -7.3, 21.9 -6.2 C21.28 -5.11, 20.58 -3.77, 20.03 -2.86 C19.49 -1.96, 18.96 -1.24, 18.62 -0.78 C18.29 -0.32, 18.24 -0.24, 18.02 -0.12 C17.8 0, 17.88 -0.07, 17.32 -0.05 C16.75 -0.03, 15.77 -0.03, 14.62 -0.02 C13.48 -0.01, 12.9 -0.02, 10.47 -0.02 C8.03 -0.01, 1.74 0, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-6"></path></g></g><mask></mask><g stroke-linecap="round"><g transform="translate(47.23764524479065 34.295746370695184) rotate(0 4.796556560791658 0.6621114202912182)"><path d="M0 0 C0.01 0.29, 0.03 1.15, 0.06 1.74 C0.09 2.32, 0.08 3.02, 0.18 3.52 C0.28 4.02, 0.39 4.34, 0.65 4.74 C0.92 5.14, 1.33 5.58, 1.76 5.92 C2.2 6.25, 2.66 6.59, 3.28 6.73 C3.9 6.87, 4.86 6.84, 5.5 6.77 C6.14 6.7, 6.63 6.59, 7.13 6.32 C7.63 6.05, 8.12 5.57, 8.49 5.14 C8.85 4.71, 9.15 4.23, 9.34 3.76 C9.52 3.28, 9.55 2.94, 9.59 2.3 C9.63 1.67, 9.6 0.63, 9.58 -0.06 C9.57 -0.74, 9.57 -1.29, 9.48 -1.78 C9.39 -2.28, 9.27 -2.64, 9.06 -3.04 C8.84 -3.44, 8.57 -3.86, 8.21 -4.19 C7.84 -4.52, 7.33 -4.82, 6.89 -5.02 C6.45 -5.23, 6.04 -5.38, 5.56 -5.45 C5.08 -5.52, 4.52 -5.54, 4.02 -5.45 C3.52 -5.35, 3.03 -5.21, 2.54 -4.9 C2.04 -4.59, 1.42 -4.01, 1.04 -3.59 C0.66 -3.17, 0.43 -2.82, 0.26 -2.37 C0.09 -1.91, 0.05 -1.25, 0.01 -0.86 C-0.03 -0.46, 0 -0.14, 0 0 M0 0 C0.01 0.29, 0.03 1.15, 0.06 1.74 C0.09 2.32, 0.08 3.02, 0.18 3.52 C0.28 4.02, 0.39 4.34, 0.65 4.74 C0.92 5.14, 1.33 5.58, 1.76 5.92 C2.2 6.25, 2.66 6.59, 3.28 6.73 C3.9 6.87, 4.86 6.84, 5.5 6.77 C6.14 6.7, 6.63 6.59, 7.13 6.32 C7.63 6.05, 8.12 5.57, 8.49 5.14 C8.85 4.71, 9.15 4.23, 9.34 3.76 C9.52 3.28, 9.55 2.94, 9.59 2.3 C9.63 1.67, 9.6 0.63, 9.58 -0.06 C9.57 -0.74, 9.57 -1.29, 9.48 -1.78 C9.39 -2.28, 9.27 -2.64, 9.06 -3.04 C8.84 -3.44, 8.57 -3.86, 8.21 -4.19 C7.84 -4.52, 7.33 -4.82, 6.89 -5.02 C6.45 -5.23, 6.04 -5.38, 5.56 -5.45 C5.08 -5.52, 4.52 -5.54, 4.02 -5.45 C3.52 -5.35, 3.03 -5.21, 2.54 -4.9 C2.04 -4.59, 1.42 -4.01, 1.04 -3.59 C0.66 -3.17, 0.43 -2.82, 0.26 -2.37 C0.09 -1.91, 0.05 -1.25, 0.01 -0.86 C-0.03 -0.46, 0 -0.14, 0 0" stroke="#E1E1E1" stroke-width="2" fill="none" class="svg-elem-7"></path></g></g><mask></mask></svg>
          `,
        css: `
      /***************************************************
 * Generated by SVG Artista on 9/8/2025, 2:50:43 PM
 * MIT license (https://opensource.org/licenses/MIT)
 * W. https://svgartista.net
 **************************************************/

svg .svg-elem-1 {
  stroke-dashoffset: 638.6513671875px;
  stroke-dasharray: 638.6513671875px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0s;
}

svg.active .svg-elem-1 {
  stroke-dashoffset: 0;
}

svg .svg-elem-2 {
  stroke-dashoffset: 612.6596069335938px;
  stroke-dasharray: 612.6596069335938px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.12s;
}

svg.active .svg-elem-2 {
  stroke-dashoffset: 0;
}

svg .svg-elem-3 {
  stroke-dashoffset: 218.29965209960938px;
  stroke-dasharray: 218.29965209960938px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.24s;
}

svg.active .svg-elem-3 {
  stroke-dashoffset: 0;
}

svg .svg-elem-4 {
  stroke-dashoffset: 117.82274627685547px;
  stroke-dasharray: 117.82274627685547px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.36s;
}

svg.active .svg-elem-4 {
  stroke-dashoffset: 0;
}

svg .svg-elem-5 {
  stroke-dashoffset: 97.11097717285156px;
  stroke-dasharray: 97.11097717285156px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.48s;
}

svg.active .svg-elem-5 {
  stroke-dashoffset: 0;
}

svg .svg-elem-6 {
  stroke-dashoffset: 190.52369689941406px;
  stroke-dasharray: 190.52369689941406px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.6s;
}

svg.active .svg-elem-6 {
  stroke-dashoffset: 0;
}

svg .svg-elem-7 {
  stroke-dashoffset: 73.74249267578125px;
  stroke-dasharray: 73.74249267578125px;
  -webkit-transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s;
          transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) 0.72s;
}

svg.active .svg-elem-7 {
  stroke-dashoffset: 0;
}

        `,
    },
];



return { ICONS };
```

