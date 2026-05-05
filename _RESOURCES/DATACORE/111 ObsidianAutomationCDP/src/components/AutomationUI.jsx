/**
 * AutomationUI.jsx
 */
console.log("[ObsidianAutomationCDP] AutomationUI module loading");
const { useState, useRef, useEffect } = dc;

function AutomationUI({ dc, styles, folderPath, CLIBridge, onToggleFullTab, isFullTab }) {
    const SCENARIO_STEPS = [
        { id: 1, label: 'Capture Initial State', cmd: `obsidian dev:screenshot path="_RESOURCES/DATACORE/111 ObsidianAutomationCDP/screenshots/scenario_start.png"` },
        { id: 2, label: 'Inspect Workspace DOM', cmd: 'obsidian dev:dom selector=".workspace-leaf" text' },
        { id: 3, label: 'Trigger Interaction (Selector)', cmd: 'obsidian dev:click selector=".workspace-leaf"' },
        { id: 4, label: 'Audit Selection CSS', cmd: 'obsidian dev:css selector=".workspace-leaf" prop="background-color"' },
        { id: 5, label: 'Capture Final Verification', cmd: `obsidian dev:screenshot path="_RESOURCES/DATACORE/111 ObsidianAutomationCDP/screenshots/scenario_end.png"` }
    ];

    const [logs, setLogs] = useState([]);
    const [coords, setCoords] = useState({ x: 100, y: 100 });
    const [selector, setSelector] = useState('.workspace-leaf');
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentStep, setCurrentStep] = useState(null);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [pressedSpots, setPressedSpots] = useState(new Set());
    const [activeGridId, setActiveGridId] = useState(null);
    const [activeIdTestId, setActiveIdTestId] = useState(null);
    const [completedIdTests, setCompletedIdTests] = useState([]);
    const [lastScreenshot, setLastScreenshot] = useState(null);
    const [lastRawCommand, setLastRawCommand] = useState('');
    const [pressIndicator, setPressIndicator] = useState(null); // stores { id, type }

    const idTestItems = dc.useMemo(() => [
        // ...
        { id: 'comp-alpha', label: 'Alpha', top: 20 + Math.random() * 50, left: 20 + Math.random() * 200 },
        { id: 'comp-beta', label: 'Beta', top: 20 + Math.random() * 50, left: 20 + Math.random() * 200 },
        { id: 'comp-gamma', label: 'Gamma', top: 20 + Math.random() * 50, left: 20 + Math.random() * 200 },
        { id: 'comp-delta', label: 'Delta', top: 20 + Math.random() * 50, left: 20 + Math.random() * 200 }
    ], []);

    // Generate 100 spots (10x10 grid)
    // We'll map them to a 1000x1000 coordinate space for demonstration
    const gridSpots = Array.from({ length: 100 }, (_, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        return {
            id: i,
            x: 100 + col * 80, // 100 to 820
            y: 100 + row * 80  // 100 to 820
        };
    });

    useEffect(() => {
        if (activeGridId !== null) {
            const el = document.querySelector(`[data-spot-id="${activeGridId}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeGridId]);

    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const runCommand = async (cmd) => {
        setIsExecuting(true);
        setLastRawCommand(cmd);
        addLog(`Executing: ${cmd}`);
        try {
            const result = await CLIBridge.execute(cmd);
            addLog(`Result: ${result}`);

            // If it's a screenshot command, we might want to trigger a refresh of the preview
            if (cmd.includes('dev:screenshot')) {
                const pathMatch = cmd.match(/path="([^"]+)"/);
                if (pathMatch) {
                    setLastScreenshot(`${pathMatch[1]}?t=${Date.now()}`);
                }
            }
        } catch (e) {
            addLog(`Error: ${e.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const handlePress = () => {
        runCommand(`obsidian dev:click x=${coords.x} y=${coords.y}`);
    };

    const handleClickSelector = () => {
        runCommand(`obsidian dev:click selector="${selector}"`);
    };

    const handleScreenshot = () => {
        const path = `_RESOURCES/DATACORE/111 ObsidianAutomationCDP/screenshots/snap_${Date.now()}.png`;
        runCommand(`obsidian dev:screenshot path="${path}"`);
    };

    const handleSpotClick = async (spot) => {
        if (isExecuting) return;
        setPressedSpots(prev => {
            const next = new Set(prev);
            next.add(spot.id);
            return next;
        });
        await runCommand(`obsidian dev:click x=${spot.x} y=${spot.y}`);
    };

    const runGridSequence = async () => {
        if (isExecuting) return;
        setIsExecuting(true);
        setPressedSpots(new Set());
        addLog("▶ Starting Randomized Grid Automated Test...");

        // Create a shuffled copy of indices
        const shuffledSpots = [...gridSpots].sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffledSpots.length; i++) {
            const spot = shuffledSpots[i];
            setActiveGridId(spot.id);
            setPressIndicator({ id: spot.id, type: 'grid' });
            addLog(`Targeting Spot ${i} (X:${spot.x}, Y:${spot.y})`);

            try {
                await CLIBridge.execute(`obsidian dev:click x=${spot.x} y=${spot.y}`);
                setPressedSpots(prev => new Set(prev).add(spot.id));
                // Rapid-fire but with enough time for UI to reflect state
                await new Promise(r => setTimeout(r, 400)); // Longer delay for indicator visibility
                setPressIndicator(null);
            } catch (e) {
                addLog(`✗ Error at spot ${i}: ${e.message}`);
                break;
            }
        }

        setActiveGridId(null);
        setIsExecuting(false);
        addLog("🏁 Grid Sequence Finished");
    };

    const runIDSequence = async () => {
        if (isExecuting) return;
        setIsExecuting(true);
        setCompletedIdTests([]);
        addLog("▶ Starting Component ID Automation sequence...");

        for (const item of idTestItems) {
            setActiveIdTestId(item.id);
            setPressIndicator({ id: item.id, type: 'id' });
            addLog(`Targeting ID: #${item.id}`);
            try {
                // Use the selector logic to click exactly by ID
                await CLIBridge.execute(`obsidian dev:click selector="#${item.id}"`);
                setCompletedIdTests(prev => [...prev, item.id]);
                await new Promise(r => setTimeout(r, 800));
                setPressIndicator(null);
            } catch (e) {
                addLog(`✗ Error targeting #${item.id}: ${e.message}`);
            }
        }

        setActiveIdTestId(null);
        setIsExecuting(false);
        addLog("🏁 ID-Based Sequence Finished");
    };

    const runScenario = async () => {
        setIsExecuting(true);
        setCompletedSteps([]);
        addLog("▶ Starting Automation Scenario...");

        for (const step of SCENARIO_STEPS) {
            setCurrentStep(step.id);
            addLog(`Step ${step.id}: ${step.label}`);
            try {
                const result = await CLIBridge.execute(step.cmd);
                addLog(`✓ ${step.label} completed`);
                setCompletedSteps(prev => [...prev, step.id]);
                // Small delay between steps for visual feedback
                await new Promise(r => setTimeout(r, 800));
            } catch (e) {
                addLog(`✗ Error in step ${step.id}: ${e.message}`);
                break;
            }
        }

        setCurrentStep(null);
        setIsExecuting(false);
        addLog("🏁 Scenario Finished");
    };

    return (
        <div style={styles.mainWrapper}>
            <header style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.accentDot} />
                    <span style={styles.title}>Obsidian Automation CDP</span>
                </div>
                <button
                    onClick={onToggleFullTab}
                    style={{ ...styles.button, width: 'auto', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    {isFullTab ? 'Minimize' : 'Maximize'}
                </button>
            </header>

            <div style={styles.contentScroll}>
                {/* Automation Scenario Card */}
                <div style={{ ...styles.card, minWidth: '100%', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                    <div style={{ ...styles.cardTitle, color: '#8b5cf6' }}>
                        <dc.Icon icon="play-circle" style={{ width: 14, height: 14 }} />
                        AUTOMATION SCENARIO: PAGE TRAVERSAL & AUDIT
                    </div>

                    <button
                        onClick={runScenario}
                        disabled={isExecuting}
                        style={{ ...styles.button, height: '50px', fontSize: '16px', letterSpacing: '0.1em' }}
                    >
                        {isExecuting ? 'SCENARIO IN PROGRESS...' : 'START AUTOMATION SEQUENCE'}
                    </button>

                    <div style={styles.stepContainer}>
                        {SCENARIO_STEPS.map(step => (
                            <div key={step.id} style={{
                                ...styles.stepItem,
                                ...(currentStep === step.id ? styles.stepActive : {}),
                                ...(completedSteps.includes(step.id) ? styles.stepCompleted : {})
                            }}>
                                <div style={styles.stepNumber}>{step.id}</div>
                                <div style={{ flex: 1 }}>{step.label}</div>
                                {completedSteps.includes(step.id) && <dc.Icon icon="check" style={{ width: 14, height: 14 }} />}
                                {currentStep === step.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', animation: 'pulse 1.5s infinite' }} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interactive Press Grid Card */}
                <div style={{ ...styles.card, minWidth: '100%' }}>
                    <div style={{ ...styles.cardTitle, color: '#4ade80' }}>
                        <dc.Icon icon="grid" style={{ width: 14, height: 14 }} />
                        AUTOMATED GRID TEST (100 SPOTS)
                    </div>

                    <button
                        onClick={runGridSequence}
                        disabled={isExecuting}
                        style={{ ...styles.button, height: '40px', background: 'linear-gradient(135deg, #10b981, #059669)', marginBottom: '16px' }}
                    >
                        {isExecuting && activeGridId !== null ? `TESTING SPOT ${activeGridId}...` : 'START GRID SEQUENCE'}
                    </button>

                    <div style={styles.label}>Highlights yellow for target, green for completed</div>
                    <div style={styles.gridContainer}>
                        {gridSpots.map(spot => (
                            <div
                                key={spot.id}
                                data-spot-id={spot.id}
                                onClick={() => handleSpotClick(spot)}
                                style={{
                                    ...styles.spot,
                                    ...(pressedSpots.has(spot.id) ? styles.spotPressed : {}),
                                    ...(activeGridId === spot.id ? styles.spotTarget : {}),
                                    ...(isExecuting && activeGridId === null ? { cursor: 'not-allowed', opacity: 0.5 } : {})
                                }}
                                title={`X: ${spot.x}, Y: ${spot.y}`}
                            >
                                {activeGridId === spot.id ? '⚡' : (pressedSpots.has(spot.id) ? '✓' : '')}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setPressedSpots(new Set())}
                        style={{ ...styles.button, marginTop: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        Reset Grid States
                    </button>
                </div>

                {/* Component ID Test Card */}
                <div style={{ ...styles.card, minWidth: '100%' }}>
                    <div style={{ ...styles.cardTitle, color: '#3b82f6' }}>
                        <dc.Icon icon="hash" style={{ width: 14, height: 14 }} />
                        COMPONENT ID AUTOMATION TEST
                    </div>
                    <div style={styles.label}>Automated testing using pure HTML ID selectors</div>

                    <button
                        onClick={runIDSequence}
                        disabled={isExecuting}
                        style={{ ...styles.button, height: '40px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', marginBottom: '20px' }}
                    >
                        {isExecuting && activeIdTestId ? `PRESSING #${activeIdTestId}...` : 'START ID SEQUENCE'}
                    </button>

                    <div style={styles.idTestList}>
                        {idTestItems.map(item => (
                            <div key={item.id} style={styles.idTestItem}>
                                {item.label} (CONTAINER)
                                <div
                                    id={item.id}
                                    style={{
                                        ...styles.idTestCircle,
                                        top: `${item.top}px`,
                                        left: `${item.left}px`,
                                        ...(activeIdTestId === item.id ? styles.idTestCircleActive : {}),
                                        ...(completedIdTests.includes(item.id) ? styles.idTestCircleCompleted : {})
                                    }}
                                >
                                    {completedIdTests.includes(item.id) ? (
                                        <dc.Icon icon="check" style={{ width: 14, height: 14, color: '#fff' }} />
                                    ) : (
                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#fff' }}>ID</span>
                                    )}
                                    {pressIndicator?.type === 'id' && pressIndicator?.id === item.id && (
                                        <div style={styles.clickIndicator} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CDP Press Card */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>
                        <dc.Icon icon="mouse-pointer" style={{ width: 14, height: 14 }} />
                        CDP PRESS (COORDINATES)
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.label}>X Coordinate</label>
                            <input
                                type="number"
                                value={coords.x}
                                onChange={e => setCoords({ ...coords, x: parseInt(e.target.value) })}
                                style={styles.input}
                            />
                        </div>
                        <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.label}>Y Coordinate</label>
                            <input
                                type="number"
                                value={coords.y}
                                onChange={e => setCoords({ ...coords, y: parseInt(e.target.value) })}
                                style={styles.input}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handlePress}
                        disabled={isExecuting}
                        style={styles.button}
                    >
                        {isExecuting ? 'Executing...' : 'Press at X,Y'}
                    </button>
                </div>

                {/* CDP Click Card */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>
                        <dc.Icon icon="target" style={{ width: 14, height: 14 }} />
                        CDP CLICK (SELECTOR)
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>CSS Selector</label>
                        <input
                            type="text"
                            value={selector}
                            onChange={e => setSelector(e.target.value)}
                            style={styles.input}
                            placeholder=".workspace-leaf"
                        />
                    </div>
                    <button
                        onClick={handleClickSelector}
                        disabled={isExecuting}
                        style={styles.button}
                    >
                        {isExecuting ? 'Executing...' : 'Click Selector'}
                    </button>
                </div>

                {/* Tools Card */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>
                        <dc.Icon icon="camera" style={{ width: 14, height: 14 }} />
                        AUTOMATION TOOLS
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                        <button
                            onClick={handleScreenshot}
                            disabled={isExecuting}
                            style={{ ...styles.button, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                        >
                            <dc.Icon icon="camera" style={{ width: 16, height: 16, marginRight: '8px' }} />
                            Take Screenshot
                        </button>
                        <button
                            onClick={() => runCommand('obsidian dev:dom text')}
                            disabled={isExecuting}
                            style={{ ...styles.button, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                        >
                            Inspect DOM (Text)
                        </button>
                    </div>
                </div>

                {/* CDP Reality Verification Card */}
                <div style={{ ...styles.card, minWidth: '100%', background: 'rgba(2, 6, 23, 0.4)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ ...styles.cardTitle, color: '#60a5fa' }}>
                        <dc.Icon icon="shield-check" style={{ width: 14, height: 14 }} />
                        CDP REALITY VERIFICATION (ANTI-CHEAT)
                    </div>
                    <div style={styles.label}>Proof of real-time Obsidian interaction via `obsidian-cli`</div>

                    <div style={styles.terminalBox}>
                        <span style={{ color: '#4ade80' }}>$</span> {lastRawCommand || 'waiting for command...'}
                    </div>

                    {lastScreenshot && (
                        <div style={styles.screenshotPreview}>
                            <div style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', fontSize: '10px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                LATEST CDP CAPTURE: {lastScreenshot.split('?')[0]}
                            </div>
                            <img
                                src={dc.getAssetPath(lastScreenshot.split('?')[0])}
                                style={{ width: '100%', display: 'block' }}
                                onError={(e) => {
                                    console.error("Screenshot load failed", e);
                                    setLastScreenshot(null);
                                }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button
                            onClick={() => runCommand('obsidian dev:dom selector=".workspace" text')}
                            disabled={isExecuting}
                            style={{ ...styles.button, flex: 1, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                        >
                            Fetch Live DOM
                        </button>
                        <button
                            onClick={handleScreenshot}
                            disabled={isExecuting}
                            style={{ ...styles.button, flex: 1, background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)' }}
                        >
                            Instant Snap
                        </button>
                    </div>
                </div>

                {/* Execution Log */}
                <div style={{ width: '100%' }}>
                    <div style={{ ...styles.label, marginBottom: '8px' }}>Execution Log</div>
                    <div style={styles.logArea}>
                        {logs.length === 0 ? '> Ready for automation commands...' : logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

return { AutomationUI };
