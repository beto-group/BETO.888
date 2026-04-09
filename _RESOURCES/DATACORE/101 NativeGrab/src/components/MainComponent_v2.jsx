/**
 * 128_Native_Grab - Main Component
 * Implements "Native Grab" experience using CDP and raw DOM control.
 */
const { useState, useEffect, useRef, useCallback, useMemo } = dc;

function MainComponent({ folderPath, styles: STYLES, CLIBridge }) {
    const rootRef = useRef(null);
    const { useFullTab } = dc.require(folderPath + "/src/utils/FullTab_v2.jsx");
    useFullTab(rootRef);

    // --- State ---
    const [pos, setPos] = useState({ x: 200, y: 200 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [logs, setLogs] = useState([]);
    const [isCdpActive, setIsCdpActive] = useState(true);

    const addLog = useCallback((msg) => {
        setLogs(prev => [`> ${msg}`, ...prev].slice(0, 5));
    }, []);

    // --- Native CDP Interaction ---
    const syncNativeState = useCallback(async (x, y) => {
        if (!isCdpActive) return;
        try {
            // Reproduce the grab natively by informing the system of the new coordinates.
            // In a real 'native' scenario, we might use Input.dispatchMouseEvent to simulate dragging 
            // of the actual window or a system element.
            await CLIBridge.execute(`dev:cdp method=Input.dispatchMouseEvent params='{"type":"mouseMoved","x":${x},"y":${y},"button":"left","clickCount":1}'`);
            addLog(`CDP SYNC: mouseMoved @ ${x},${y}`);
        } catch (e) {
            // Silently fail or log sparingly to avoid loop overhead
            console.warn("[NativeGrab] CDP Sync failed", e);
        }
    }, [isCdpActive, CLIBridge, addLog]);

    // --- Drag Logic ---
    const onMouseDown = (e) => {
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        addLog("NATIVE_GRB: Mouse Down (Active)");
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        setPos({ x: newX, y: newY });
        
        // Native Reproduction Loop
        syncNativeState(newX + 60, newY + 60); // Offset to center of 120px element
    };

    const onMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            addLog("NATIVE_GRB: Mouse Up (Released)");
            // Take verification screenshot natively
            CLIBridge.execute(`dev:screenshot path="_RESOURCES/DATACORE/128_Native_Grab/screenshots/grab_verify_${Date.now()}.png"`);
        }
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging]);

    return (
        <div ref={rootRef} style={STYLES.mainWrapper}>
            <style>{STYLES.animations}</style>
            
            <header style={STYLES.header}>
                <div style={STYLES.titleGroup}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isDragging ? '#4ade80' : '#8b5cf6', boxShadow: '0 0 10px currentColor' }} />
                    <span style={STYLES.title}>Native Grab Engine v1.0</span>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={STYLES.badge}>CDP BRIDGE: {isCdpActive ? 'ACTIVE' : 'OFFLINE'}</div>
                    <div style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setIsCdpActive(!isCdpActive)}>
                        <dc.Icon icon={isCdpActive ? "zap" : "zap-off"} style={{ width: 14 }} />
                    </div>
                </div>
            </header>

            <main style={STYLES.canvas}>
                <div style={STYLES.gridOverlay} />
                
                <div 
                    onMouseDown={onMouseDown}
                    className={isDragging ? 'native-grab-active' : ''}
                    style={STYLES.draggableElement(isDragging, pos.x, pos.y)}
                >
                    <dc.Icon icon="mouse-pointer-2" style={STYLES.grabberIcon} />
                    <span style={STYLES.elementLabel}>GRAB_01</span>
                    {isDragging && (
                        <div style={{ position: 'absolute', top: -15, fontSize: '9px', color: '#4ade80', fontWeight: 'bold' }}>
                            MOVING_NATIVE
                        </div>
                    )}
                </div>

                <div style={STYLES.coordinates}>
                    X: {pos.x.toFixed(0)} | Y: {pos.y.toFixed(0)}
                </div>

                <div style={STYLES.terminal}>
                    {logs.map((log, i) => (
                        <div key={i} style={STYLES.logLine}>{log}</div>
                    ))}
                    {logs.length === 0 && <div style={{opacity: 0.3}}>waiting for interaction...</div>}
                </div>
            </main>

            <div style={{ position: 'absolute', top: 60, left: 20, zIndex: 100, maxWidth: '200px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
                <strong style={{ color: '#8b5cf6' }}>Protocol 128:</strong><br/>
                Replacing <code>react-grab</code> with native Chrome DevTools Protocol injection via <code>obsidian-cli</code>. Continuous position syncing enabled.
            </div>
        </div>
    );
}

return { MainComponent };
