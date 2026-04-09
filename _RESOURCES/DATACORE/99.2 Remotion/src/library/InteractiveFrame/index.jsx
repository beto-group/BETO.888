const { React, useState, useEffect } = dc;

function InnerLoader({ targetPath, frame, folderPath, ...props }) {
    const [InnerComp, setInnerComp] = useState(null);
    const [innerElement, setInnerElement] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                let componentPath = targetPath;
                if (!componentPath) return;

                console.log("[InteractiveFrame] Loading:", componentPath);

                // Smart Path Resolution
                let loadPath;
                if (componentPath.endsWith('.jsx') || componentPath.endsWith('.js')) {
                    loadPath = componentPath;
                } else {
                    loadPath = dc.headerLink(componentPath, "ViewComponent");
                }

                const module = await dc.require(loadPath);
                const Comp = module.ViewComponent || module.View || module.default || Object.values(module)[0];

                if (!Comp) throw new Error("No component found in module");

                if (Comp.constructor.name === 'AsyncFunction') {
                    const effectiveFolderPath = folderPath || (
                        componentPath.includes('/src/')
                            ? componentPath.substring(0, componentPath.lastIndexOf('/src/'))
                            : componentPath.substring(0, componentPath.lastIndexOf('/'))
                    );

                    const element = await Comp({
                        folderPath: effectiveFolderPath,
                        isInception: true,
                        externalScale: props.externalScale,
                        externalRotation: props.externalRotation
                    });
                    setInnerElement(element);
                } else {
                    setInnerComp(() => Comp);
                }
            } catch (e) {
                console.error("[InteractiveFrame] Load error:", e);
                setError(e.message);
            }
        }
        load();
    }, [targetPath, folderPath]); // Only reload if path changes

    if (error) return <div style={{ color: 'red', padding: '10px' }}>Error: {error}</div>;
    if (!innerElement && !InnerComp) return <div style={{ color: '#666' }}>Loading...</div>;

    if (innerElement) {
        // If it's an element (from async factory), we try to inject updated props
        // This is tricky but cloneElement works for simple prop injection
        return dc.React.cloneElement(innerElement, {
            externalScale: props.externalScale,
            externalRotation: props.externalRotation
        });
    }

    return (
        <InnerComp
            frame={frame}
            isFullTab={false}
            folderPath={folderPath}
            externalScale={props.externalScale}
            externalRotation={props.externalRotation}
            style={{ width: '100%', height: '100%' }}
        />
    );
}

// --- CHOREOGRAPHY ENGINE ---
function useChoreography(frame) {
    // Phase 1: Enter (0-60)
    // Phase 2: Zoom (60-120)
    // Phase 3: Pan (120-240)

    let cursor = { x: 110, y: 110, clicking: false };
    let map = { scale: 250, rotation: [0, 0] };

    const easeInOut = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const lerp = (a, b, t) => a + (b - a) * t;

    if (frame < 60) {
        // ENTER
        const t = easeInOut(Math.min(1, frame / 60));
        cursor.x = lerp(110, 50, t);
        cursor.y = lerp(110, 50, t);
    } else if (frame < 120) {
        // ZOOM
        // Cursor stays center
        const t = easeInOut(Math.min(1, (frame - 60) / 60));
        cursor.x = 50;
        cursor.y = 50;
        map.scale = lerp(250, 800, t);
    } else if (frame < 480) {
        // PAN (Extended to 8 seconds total, 6s for pan)
        const t = easeInOut(Math.min(1, (frame - 120) / 360));
        map.scale = 800;

        // Target: Bottom Left
        const targetX = 20; // Bottom Left
        const targetY = 80; // Bottom Left
        const rotTargetX = -120; // Increased panning (Opposite direction)
        const rotTargetY = -30; // Tilt down

        cursor.x = lerp(50, targetX, t);
        cursor.y = lerp(50, targetY, t);
        cursor.clicking = true;

        map.rotation = [
            lerp(0, rotTargetX, t),
            lerp(0, rotTargetY, t)
        ];
    } else {
        // END STATE
        cursor.x = 20;
        cursor.y = 80;
        map.scale = 800;
        map.rotation = [-120, -30];
    }

    return { cursor, map };
}

function SimulatedCursor({ x, y, clicking }) {
    return (
        <div style={{
            position: 'absolute',
            top: `${y}%`,
            left: `${x}%`,
            width: '24px',
            height: '24px',
            zIndex: 1000,
            pointerEvents: 'none',
            transform: `translate(-50%, -50%) scale(${clicking ? 0.9 : 1})`,
            transition: 'transform 0.1s'
        }}>
            {/* Cursor SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19135L11.7118 12.3673H5.65376Z" fill="white" stroke="black" strokeWidth="1" />
            </svg>

            {/* Click Ripple */}
            {clicking && (
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: '40px', height: '40px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    transform: 'translate(-50%, -50%)',
                    animation: 'ripple 0.4s ease-out forwards'
                }} />
            )}
        </div>
    );
}

function InteractiveFrame(props) {
    const { frame, targetPath, tiltX = 5, tiltY = -10, scale = 0.95 } = props;

    // Resolve targetPath
    const actualPath = targetPath || (InteractiveFrame.metadata.find(m => m.id === 'targetPath')?.default);

    // Interaction State
    const [isHovered, setIsHovered] = useState(false);

    // Choreography
    const { cursor, map } = useChoreography(frame);

    // --- Animation Logic ---
    const dampener = isHovered ? 0.1 : 1.0;

    const wiggleRotX = (Math.sin(frame * 0.02) * 2) * dampener;
    const wiggleRotY = (Math.cos(frame * 0.015) * 3) * dampener;
    const levitateY = (Math.sin(frame * 0.03) * 10) * dampener;

    const currentBaseTiltX = isHovered ? tiltX * 0.5 : tiltX;
    const currentBaseTiltY = isHovered ? tiltY * 0.5 : tiltY;
    const currentScale = isHovered ? Math.min(1, scale * 1.05) : scale;

    const finalTiltX = currentBaseTiltX + wiggleRotX;
    const finalTiltY = currentBaseTiltY + wiggleRotY;

    // Glow Animation - Slowed down and more reactive
    const glowAngle = (frame * 0.5) % 360;
    const glowPulse = 0.8 + Math.sin(frame * 0.1) * 0.2;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '1200px',
            background: 'transparent'
        }}>
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'relative',
                    width: '85%', // Bigger frame
                    aspectRatio: '16/9',
                    transformStyle: 'preserve-3d',
                    transform: `translateY(${levitateY}px) rotateX(${finalTiltX}deg) rotateY(${finalTiltY}deg) scale(${currentScale})`,
                    transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth dampening
                    cursor: 'none'
                }}
            >

                {/* --- ROTATING PURPLE STREAK BORDER --- */}
                <div style={{
                    position: 'absolute',
                    top: '-6px', left: '-6px', right: '-6px', bottom: '-6px', // Thicker
                    borderRadius: '24px',
                    // Sharp streak: color for 60deg, then transparent
                    background: `conic-gradient(from ${glowAngle}deg, #a855f7 0deg, #ed3ef7 60deg, transparent 90deg, transparent 360deg)`,
                    filter: 'blur(16px)',
                    opacity: glowPulse * 0.9,
                    transform: 'translateZ(-15px)',
                    pointerEvents: 'none'
                }} />

                {/* Sharp Streak Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '-2px', left: '-2px', right: '-2px', bottom: '-2px', // Thicker
                    borderRadius: '18px',
                    background: `conic-gradient(from ${glowAngle}deg, #a855f7 0deg, #ed3ef7 45deg, transparent 60deg, transparent 360deg)`,
                    transform: 'translateZ(-2px)',
                    pointerEvents: 'none'
                }} />

                {/* Main Card Content */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    background: '#111',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.15)', // Subtle white edge
                    boxShadow: `
                        0 30px 60px rgba(0,0,0,0.8),
                        0 0 20px rgba(168, 85, 247, 0.2)
                    `, // Stronger shadow + purple glow
                    overflow: 'hidden',
                    pointerEvents: 'auto', // Explicitly allow interaction
                }}>
                    {/* Glossy Reflection */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(125deg, rgba(255,255,255,0.05) 0%, transparent 40%, transparent 100%)',
                        zIndex: 20,
                        pointerEvents: 'none',
                    }} />

                    {/* Cursor Simulation Overlay */}
                    <SimulatedCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />

                    {/* Actual Component Loader */}
                    <div style={{
                        width: '100%', height: '100%', background: '#0a0a0a',
                        position: 'relative', zIndex: 10
                    }}>
                        {/* Calculate folderPath for the InnerLoader */}
                        {(() => {
                            const folderPath = actualPath ? (
                                actualPath.includes('/src/')
                                    ? actualPath.substring(0, actualPath.lastIndexOf('/src/'))
                                    : actualPath.substring(0, actualPath.lastIndexOf('/'))
                            ) : null;

                            return (
                                <InnerLoader
                                    targetPath={actualPath}
                                    frame={frame}
                                    folderPath={folderPath}
                                    externalScale={map.scale}
                                    externalRotation={map.rotation}
                                />
                            );
                        })()}
                    </div>
                </div>
            </div>
            {/* Style for ripple animation */}
            <style>{`
                @keyframes ripple {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; border-width: 4px; }
                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; border-width: 0px; }
                }
            `}</style>
        </div>
    );
}

InteractiveFrame.metadata = [
    { id: 'category', type: 'text', default: 'component' },
    { id: 'targetPath', type: 'text', default: '_RESOURCES/DATACORE/24.2 MapGlobe/D.q.mapglobe.component.v2.md' },
    { id: 'tiltX', type: 'number', default: 5 },
    { id: 'tiltY', type: 'number', default: -10 },
    { id: 'scale', type: 'number', default: 0.9 }
];

return { InteractiveFrame };
