
function Scanner({ isInspecting, setIsInspecting, setNode, addLog, tokens, CLIBridge }) {
    const { useEffect, useRef } = dc;
    
    // Ref-based state to handle high-performance, singleton execution
    const stateRef = useRef({
        isInspecting,
        setNode,
        addLog,
        CLIBridge,
        lastElement: null,
        cdpTimer: null,
        lastMoveTime: 0,
        isProcessing: false // Singleton Lock for CLI
    });

    useEffect(() => {
        stateRef.current.isInspecting = isInspecting;
        stateRef.current.setNode = setNode;
        stateRef.current.addLog = addLog;
        stateRef.current.CLIBridge = CLIBridge;
        
        // Immediate Disarm Guard
        if (!isInspecting) {
            clearTimeout(stateRef.current.cdpTimer);
            stateRef.current.lastElement = null;
        }
    }, [isInspecting, setNode, addLog, CLIBridge]);

    useEffect(() => {
        if (!CLIBridge) return;

        const syncCDP = async () => {
            try {
                if (isInspecting) {
                    await CLIBridge.cdp('Overlay.enable');
                    await CLIBridge.cdp('Overlay.setInspectMode', {
                        mode: 'searchForNode',
                        highlightConfig: {
                            showInfo: true,
                            contentColor: { r: 139, g: 92, b: 246, a: 0.3 },
                            paddingColor: { r: 255, g: 184, b: 108, a: 0.1 }
                        }
                    });
                    stateRef.current.addLog("CDP_INSPECTOR_READY");
                } else {
                    await CLIBridge.cdp('Overlay.setInspectMode', { mode: 'none' });
                    await CLIBridge.cdp('Overlay.disable');
                }
            } catch (e) { console.error("[NativeGrab-CDP] Sync Error:", e); }
        };
        syncCDP();
    }, [isInspecting, CLIBridge]);

    useEffect(() => {
        const overlay = document.createElement('div');
        overlay.id = "ng-scan-overlay";
        Object.assign(overlay.style, { 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, display: 'none', cursor: 'crosshair', pointerEvents: 'auto'
        });

        const highlight = document.createElement('div');
        highlight.id = "ng-scan-highlight";
        Object.assign(highlight.style, { 
            position: 'fixed', border: `2px solid ${tokens.primary}`, 
            background: 'rgba(139,92,246,0.1)', zIndex: 999998, 
            display: 'none', pointerEvents: 'none', borderRadius: '4px',
            transition: 'all 0.05s ease-out'
        });

        document.body.appendChild(overlay);
        document.body.appendChild(highlight);

        const handleMove = (e) => {
            const now = Date.now();
            // Throttling: 32ms (~30 FPS) minimum between hit-tests
            if (now - stateRef.current.lastMoveTime < 32 || !stateRef.current.isInspecting) return;
            stateRef.current.lastMoveTime = now;
            
            overlay.style.pointerEvents = 'none';
            const t = document.elementFromPoint(e.clientX, e.clientY);
            overlay.style.pointerEvents = 'auto';

            if (t && t !== stateRef.current.lastElement && t !== overlay && t !== highlight) {
                stateRef.current.lastElement = t;
                const r = t.getBoundingClientRect();
                
                Object.assign(highlight.style, { 
                    display: 'block', top: `${r.top}px`, left: `${r.left}px`, 
                    width: `${r.width}px`, height: `${r.height}px` 
                });

                // Update Local View Instantly
                stateRef.current.setNode({ 
                    localName: t.localName, id: t.id, className: t.className, 
                    width: Math.round(r.width), height: Math.round(r.height), 
                    innerText: t.innerText?.substring(0, 300), 
                    attributes: Array.from(t.attributes).map(a => [a.name, a.value]).flat(),
                    isNative: false, isLocked: false
                });

                // Singleton CDP Enrichment
                clearTimeout(stateRef.current.cdpTimer);
                if (stateRef.current.CLIBridge && !stateRef.current.isProcessing) {
                    stateRef.current.cdpTimer = setTimeout(async () => {
                        if (!stateRef.current.isInspecting) return;
                        
                        stateRef.current.isProcessing = true;
                        try {
                            const result = await stateRef.current.CLIBridge.cdp('DOM.getNodeForLocation', { x: e.clientX, y: e.clientY });
                            if (result && result.nodeId && stateRef.current.isInspecting) {
                                const { node: desc } = await stateRef.current.CLIBridge.cdp('DOM.describeNode', { nodeId: result.nodeId, depth: 1 });
                                const { model } = await stateRef.current.CLIBridge.cdp('DOM.getBoxModel', { nodeId: result.nodeId });
                                
                                stateRef.current.setNode(p => (p && !p.isLocked) ? ({
                                    ...p,
                                    localName: desc.localName || p.localName,
                                    innerText: desc.nodeValue || desc.nodeName || p.innerText,
                                    attributes: desc.attributes || p.attributes,
                                    width: Math.round(model.width),
                                    height: Math.round(model.height),
                                    isNative: true
                                }) : p);
                                stateRef.current.addLog(`SCAN: ${(desc.localName || 'NODE').toUpperCase()}`);
                            }
                        } finally {
                            stateRef.current.isProcessing = false;
                        }
                    }, 50);
                }
            }
        };

        const handleClick = (e) => {
            if (!stateRef.current.isInspecting) return;
            e.preventDefault(); e.stopPropagation();
            stateRef.current.setNode(p => ({ ...p, isLocked: true }));
            stateRef.current.addLog("SELECTION_LOCKED");
            setIsInspecting(false);
        };

        const handleEsc = (e) => {
            if (e.key === 'Escape' && stateRef.current.isInspecting) {
                stateRef.current.addLog("ESCAPE_CMD");
                setIsInspecting(false);
            }
        };

        overlay.addEventListener('mousemove', handleMove);
        overlay.addEventListener('mousedown', handleClick, { capture: true });
        window.addEventListener('keydown', handleEsc, { capture: true });

        return () => {
            clearTimeout(stateRef.current.cdpTimer);
            overlay.removeEventListener('mousemove', handleMove);
            overlay.removeEventListener('mousedown', handleClick, { capture: true });
            window.removeEventListener('keydown', handleEsc, { capture: true });
            if (overlay.parentNode) document.body.removeChild(overlay);
            if (highlight.parentNode) document.body.removeChild(highlight);
        };
    }, []); 

    useEffect(() => {
        const overlay = document.getElementById('ng-scan-overlay');
        const highlight = document.getElementById('ng-scan-highlight');
        if (overlay) overlay.style.display = isInspecting ? 'block' : 'none';
        if (highlight && !isInspecting) {
            highlight.style.display = 'none';
        }
    }, [isInspecting]);

    return null;
}

return { Scanner };
