const { React, useState, useEffect } = dc;

function InnerLoader({ targetPath, frame }) {
    const [InnerComp, setInnerComp] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                let componentPath = targetPath;
                if (!componentPath) return;

                console.log("[TiltedLoader] Loading:", componentPath);
                const module = await dc.require(dc.headerLink(componentPath, "ViewComponent"));
                const Comp = module.ViewComponent || module.default || Object.values(module)[0];

                if (Comp) setInnerComp(() => Comp);
                else throw new Error("No component found in module");
            } catch (e) {
                setError(e.message);
            }
        }
        load();
    }, [targetPath]);

    if (error) return <div style={{ color: 'red', padding: '10px' }}>Error: {error}</div>;
    if (!InnerComp) return <div style={{ color: '#666' }}>Loading...</div>;

    return (
        <InnerComp
            frame={frame}
            isFullTab={false}
            style={{ width: '100%', height: '100%' }}
        />
    );
}

function TiltedComponentLoader(props) {
    const { frame, targetPath, tiltX = 10, tiltY = -25, scale = 0.6 } = props;

    // Resolve targetPath
    const actualPath = targetPath || (TiltedComponentLoader.metadata.find(m => m.id === 'targetPath')?.default);

    // --- Animation Logic ---
    // Wiggle: Gentle floating sine waves
    // Different frequencies for X/Y/Rot to create organic motion
    const wiggleRotX = Math.sin(frame * 0.02) * 4;     // +/- 4 degrees
    const wiggleRotY = Math.cos(frame * 0.015) * 6;    // +/- 6 degrees
    const levitateY = Math.sin(frame * 0.03) * 15;     // Floating up/down 15px

    const finalTiltX = tiltX + wiggleRotX;
    const finalTiltY = tiltY + wiggleRotY;

    // Glow Animation: Rotating gradient angle
    const glowAngle = (frame * 2) % 360;

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
            <div style={{
                position: 'relative',
                width: '60%',
                aspectRatio: '16/9',
                transformStyle: 'preserve-3d',
                transform: `translateY(${levitateY}px) rotateX(${finalTiltX}deg) rotateY(${finalTiltY}deg) scale(${scale})`,
                transition: 'transform 0.1s linear', // Linear for smooth frame-by-frame updates
            }}>

                {/* --- ROTATING GLOW BORDER --- */}
                {/* This sits behind the main content and spins */}
                <div style={{
                    position: 'absolute',
                    top: '-4px', left: '-4px', right: '-4px', bottom: '-4px',
                    borderRadius: '20px',
                    background: `conic-gradient(from ${glowAngle}deg, #ff0080, #7928ca, #ff0080)`,
                    filter: 'blur(15px)',
                    opacity: 0.8,
                    transform: 'translateZ(-10px)', // Push slightly back so it doesn't clip
                }} />

                {/* Sharp Border Layer (on top of glow, behind content) */}
                <div style={{
                    position: 'absolute',
                    top: '-2px', left: '-2px', right: '-2px', bottom: '-2px',
                    borderRadius: '18px',
                    background: `linear-gradient(${glowAngle}deg, #ff0080, #7928ca)`,
                    transform: 'translateZ(-1px)',
                }} />

                {/* Main Card Content */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    background: '#111',
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    overflow: 'hidden', // Clip inner content
                }}>
                    {/* Glossy Reflection overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(125deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 100%)',
                        zIndex: 10,
                        pointerEvents: 'none',
                    }} />

                    {/* Actual Component Loader */}
                    <div style={{
                        width: '100%', height: '100%', background: '#000'
                    }}>
                        <InnerLoader targetPath={actualPath} frame={frame} />
                    </div>
                </div>
            </div>
        </div>
    );
}

TiltedComponentLoader.metadata = [
    { id: 'category', type: 'text', default: 'component' },
    { id: 'targetPath', type: 'text', default: '_RESOURCES/DATACORE/18 ViewsInceptions/D.q.viewsinceptions.component.md' },
    { id: 'tiltX', type: 'number', default: 10 },
    { id: 'tiltY', type: 'number', default: -25 },
    { id: 'scale', type: 'number', default: 0.8 }
];

return { TiltedComponentLoader };
