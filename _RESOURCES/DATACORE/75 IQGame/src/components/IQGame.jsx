function IQGame({ styles, useIQGame, saveSession, getStats, resetStats, folderPath, onToggleFullTab, isFullTab }) {
    const { useState } = dc;
    const {
        gameState, currentN, setCurrentN,
        currentInterval, setCurrentInterval,
        sequence, currentIndex, showStimulus,
        activeKeys,
        score, lastAccuracy, dPrime, progression,
        startRound, checkMatch, quitGame
    } = useIQGame({ initialN: 1, initialInterval: 3000, roundLength: 22, saveSession });

    const currentStep = sequence[currentIndex] || {};
    const [viewMode, setViewMode] = useState('main'); // main, custom

    const [showTutorial, setShowTutorial] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Level History Chart Component
    const LevelHistoryChart = ({ sessions }) => {
        if (!sessions || sessions.length === 0) return null;

        // Show all sessions
        const data = sessions;
        if (data.length === 0) return null;

        const width = 600;
        const height = 200;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const maxN = Math.max(...data.map(s => s.nLevel), 3); // Min max is 3 for scale
        const minN = 1;

        const getX = (index) => {
            if (data.length <= 1) return padding.left + chartWidth / 2;
            return padding.left + (index / (data.length - 1)) * chartWidth;
        };
        const getY = (n) => padding.top + chartHeight - ((n - minN) / (maxN - minN)) * chartHeight;

        // Generate Path
        let pathD = '';
        if (data.length > 1) {
            pathD = `M ${getX(0)} ${getY(data[0].nLevel)}`;
        }
        data.forEach((s, i) => {
            if (i === 0) return;
            // Bezier curve for smoothness? Or straight lines.
            // Let's try simple straight lines first, or Catmull-Rom for "wavy" look if requested.
            // The user image shows smooth curves. Simple cubic bezier between points.
            const x = getX(i);
            const y = getY(s.nLevel);
            const prevX = getX(i - 1);
            const prevY = getY(data[i - 1].nLevel);

            const cp1x = prevX + (x - prevX) / 2;
            const cp1y = prevY;
            const cp2x = prevX + (x - prevX) / 2;
            const cp2y = y;

            pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
        });

        let fillPathD = '';
        if (data.length > 1) {
            fillPathD = pathD + ` L ${getX(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
        }

        return (
            <div style={{ width: '100%', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ ...styles.subtitle, marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>LEVEL HISTORY</h3>
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                    {/* Defs for Gradient */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(0, 255, 255, 0.4)" />
                            <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines (Y-axis) */}
                    {[...Array(maxN - minN + 1)].map((_, i) => {
                        const level = minN + i;
                        const y = getY(level);
                        return (
                            <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        );
                    })}

                    {/* Area Fill */}
                    <path d={fillPathD} fill="url(#chartGradient)" />

                    {/* Line */}
                    <path d={pathD} fill="none" stroke="#00ffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Data Points */}
                    {data.map((s, i) => (
                        <circle key={i} cx={getX(i)} cy={getY(s.nLevel)} r="4" fill="#00ffff" stroke="#000" strokeWidth="1" />
                    ))}

                    {/* Y-Axis Labels */}
                    {[...Array(maxN - minN + 1)].map((_, i) => {
                        const level = minN + i;
                        return (
                            <text key={i} x={padding.left - 10} y={getY(level) + 4} fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="end">{level}</text>
                        );
                    })}
                </svg>
            </div>
        );
    };

    // Reaction Time Chart Component
    const ReactionTimeChart = ({ sessions }) => {
        if (!sessions || sessions.length === 0) return null;

        // Group by N-Level
        const levelGroups = {};
        sessions.forEach(s => {
            const n = s.nLevel;
            if (!levelGroups[n]) levelGroups[n] = { pos: [], sound: [] };
            if (s.score.reactionTimes) {
                if (s.score.reactionTimes.pos) levelGroups[n].pos.push(...s.score.reactionTimes.pos);
                if (s.score.reactionTimes.sound) levelGroups[n].sound.push(...s.score.reactionTimes.sound);
            }
        });

        const activeLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
        if (activeLevels.length === 0) return null;

        const maxDelay = Math.max(...activeLevels.map(n => Math.max(
            Math.max(...levelGroups[n].pos, 0),
            Math.max(...levelGroups[n].sound, 0)
        )));

        if (maxDelay === 0) return (
            <div style={{ width: '100%', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                No reaction time data available yet.
            </div>
        );

        // Calculate averages
        const averages = activeLevels.map(n => ({
            n,
            posAvg: levelGroups[n].pos.reduce((a, b) => a + b, 0) / (levelGroups[n].pos.length || 1),
            soundAvg: levelGroups[n].sound.reduce((a, b) => a + b, 0) / (levelGroups[n].sound.length || 1)
        }));

        const width = 600;
        const height = 250;
        const padding = { top: 40, right: 20, bottom: 40, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const barWidth = 30;
        const groupGap = 40;

        // Recalculate max for Y-axis scaling based on AVERAGES, with some headroom
        const yMax = Math.max(...averages.map(a => Math.max(a.posAvg, a.soundAvg))) * 1.2 || 1000;

        return (
            <div style={{ width: '100%', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ ...styles.subtitle, marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>REACTION TIME (MS)</h3>

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '12px', height: '12px', background: '#9d50bb' }}></div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Visual</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '12px', height: '12px', background: '#4dff88' }}></div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Auditory</div>
                    </div>
                </div>

                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                    {/* Y-axis grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padding.top + chartHeight - (chartHeight * ratio);
                        return (
                            <g key={ratio}>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" />
                                <text x={padding.left - 10} y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="end">
                                    {Math.round(yMax * ratio)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Bars */}
                    {averages.map((d, i) => {
                        const totalGroupWidth = (barWidth * 2) + 10; // 10px gap between bars
                        // Distribute groups evenly
                        const xCenter = padding.left + (chartWidth / (averages.length + 1)) * (i + 1);
                        const xPos = xCenter - 5 - barWidth;
                        const xSound = xCenter + 5;

                        const hPos = (d.posAvg / yMax) * chartHeight;
                        const hSound = (d.soundAvg / yMax) * chartHeight;

                        return (
                            <g key={d.n}>
                                <rect x={xPos} y={padding.top + chartHeight - hPos} width={barWidth} height={hPos} fill="#9d50bb" opacity="0.8" />
                                <rect x={xSound} y={padding.top + chartHeight - hSound} width={barWidth} height={hSound} fill="#4dff88" opacity="0.8" />
                                <text x={xCenter} y={height - 10} fill="white" fontSize="12" textAnchor="middle">N-{d.n}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    // Stats Overlay Component
    const StatsOverlay = () => {
        const [stats, setStats] = useState(null);
        const [loading, setLoading] = useState(true);
        const [historyView, setHistoryView] = useState('graph'); // 'graph' or 'list'
        const [confirmReset, setConfirmReset] = useState(false);

        const handleReset = async () => {
            if (!confirmReset) {
                setConfirmReset(true);
                return;
            }

            let resetFn = resetStats;

            // Fallback if prop is missing due to cache
            if (typeof resetFn !== 'function' && folderPath) {
                try {
                    const utils = await dc.require(folderPath + '/src/utils/scoreManager.js');
                    if (utils && typeof utils.resetStats === 'function') {
                        resetFn = utils.resetStats;
                    }
                } catch (e) {
                    console.error("Failed to load scoreManager dynamically", e);
                }
            }

            if (typeof resetFn === 'function') {
                try {
                    const empty = await resetFn();
                    if (empty) {
                        setStats(empty);
                        setConfirmReset(false);
                    }
                } catch (e) {
                    console.error("Reset failed with error:", e);
                }
            }
        };

        const { useEffect } = dc;

        useEffect(() => {
            if (typeof getStats === 'function') {
                getStats().then(data => {
                    setStats(data);
                    setLoading(false);
                }).catch(err => {
                    console.error("getStats failed:", err);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        }, []);

        if (loading) return (
            <div style={styles.tutorialOverlay}>
                <div style={{ ...styles.title, fontSize: '24px' }}>LOADING...</div>
            </div>
        );

        const overall = stats?.overall || { gamesPlayed: 0, totalHits: 0, totalMisses: 0, totalFalseAlarms: 0 };
        const sessions = stats?.sessions || [];
        const recentSessions = [...sessions].reverse().slice(0, 10);

        return (
            <div style={styles.tutorialOverlay}>
                <div style={{
                    ...styles.glassCard,
                    width: '700px',
                    maxWidth: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    <h2 style={{ ...styles.title, fontSize: '32px', marginBottom: '20px' }}>STATISTICS</h2>

                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%', marginBottom: '32px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={styles.statValue}>{overall.gamesPlayed}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>GAMES</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ ...styles.statValue, color: '#4dff88' }}>{overall.totalHits}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>HITS</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ ...styles.statValue, color: '#ff4d4d' }}>{overall.totalMisses}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>MISSES</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ ...styles.statValue, color: '#ffaa4d' }}>{overall.totalFalseAlarms}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>FA</div>
                        </div>
                    </div>

                    <ReactionTimeChart sessions={sessions} />
                    <ReactionTimeChart sessions={sessions} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                        <h3 style={{ ...styles.subtitle, margin: 0, textAlign: 'left' }}>SESSION HISTORY</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setHistoryView('graph')}
                                style={{
                                    ...styles.button,
                                    width: 'auto',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    opacity: historyView === 'graph' ? 1 : 0.5,
                                    background: historyView === 'graph' ? 'rgba(138, 43, 226, 0.4)' : 'transparent',
                                    border: '1px solid rgba(138, 43, 226, 0.4)'
                                }}
                            >
                                GRAPH
                            </button>
                            <button
                                onClick={() => setHistoryView('list')}
                                style={{
                                    ...styles.button,
                                    width: 'auto',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    opacity: historyView === 'list' ? 1 : 0.5,
                                    background: historyView === 'list' ? 'rgba(138, 43, 226, 0.4)' : 'transparent',
                                    border: '1px solid rgba(138, 43, 226, 0.4)'
                                }}
                            >
                                LIST
                            </button>
                        </div>
                    </div>

                    {historyView === 'graph' ? (
                        <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sessions.length > 0 ? (
                                <LevelHistoryChart sessions={sessions} />
                            ) : (
                                <div style={{ color: 'rgba(255,255,255,0.3)' }}>No games played yet.</div>
                            )}
                        </div>
                    ) : (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {recentSessions.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>No games played yet.</div>}
                            {recentSessions.map((s, i) => {
                                const date = new Date(s.timestamp).toLocaleDateString() + ' ' + new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const accuracy = Math.round(((s.score.pos.hits + s.score.sound.hits) / Math.max(1, (s.score.pos.hits + s.score.pos.misses + s.score.sound.hits + s.score.sound.misses))) * 100);

                                return (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{date}</div>
                                        <div style={{ fontWeight: 'bold' }}>N-{s.nLevel}</div>
                                        <div style={{ color: accuracy > 80 ? '#4dff88' : '#ffffff' }}>{accuracy}% Acc</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
                        <div
                            onClick={() => setShowStats(false)}
                            style={{ ...styles.button, width: 'auto' }}
                        >
                            CLOSE
                        </div>
                        <div
                            onClick={handleReset}
                            style={{
                                ...styles.button,
                                width: 'auto',
                                background: confirmReset ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 0, 0, 0.1)',
                                border: confirmReset ? '1px solid rgba(255, 0, 0, 0.8)' : '1px solid rgba(255, 0, 0, 0.3)',
                                color: confirmReset ? '#ff4d4d' : 'rgba(255, 77, 77, 0.6)'
                            }}
                        >
                            {confirmReset ? "SURE? (CLICK TO WIPE)" : "RESET ALL DATA"}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Tutorial Component
    const TutorialOverlay = () => {
        const [step, setStep] = useState(0);
        const steps = [
            { pos: 0, char: 'A', match: null },
            { pos: 4, char: 'L', match: null },
            { pos: 0, char: 'Q', match: 'pos' }, // Match step 0 pos
            { pos: 7, char: 'L', match: 'sound' }, // Match step 1 char
        ];

        const { useEffect } = dc;
        useEffect(() => {
            const interval = setInterval(() => {
                setStep(s => (s + 1) % steps.length);
            }, 2000);
            return () => clearInterval(interval);
        }, []);

        const currentStep = steps[step];
        const prevStep2 = steps[(step - 2 + steps.length) % steps.length]; // N=2 back

        return (
            <div style={styles.tutorialOverlay}>
                <h2 style={{ ...styles.title, marginBottom: '40px' }}>HOW TO PLAY (N=2)</h2>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '40px' }}>
                    {/* Visualizing N-Back */}
                    <div style={{ position: 'relative', display: 'flex', gap: '20px' }}>
                        {steps.map((s, i) => {
                            const isCurrent = i === step;
                            const isNBack = i === (step - 2 + steps.length) % steps.length;
                            // Only show relevant steps (Current and N-back) to reduce noise, or show all with highlight
                            const opacity = isCurrent ? 1 : 0.3;

                            return (
                                <div key={i} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    opacity: opacity,
                                    transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '80px', height: '80px',
                                        border: `2px solid ${isCurrent ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                                        background: isCurrent && s.match === 'pos' ? 'rgba(0, 255, 136, 0.2)' : 'transparent',
                                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '4px',
                                        marginBottom: '10px', borderRadius: '8px'
                                    }}>
                                        {[...Array(9)].map((_, idx) => (
                                            <div key={idx} style={{
                                                background: s.pos === idx ? '#fff' : 'rgba(255,255,255,0.1)',
                                                borderRadius: '2px'
                                            }} />
                                        ))}
                                    </div>
                                    <div style={{
                                        fontSize: '24px', fontWeight: 'bold',
                                        color: isCurrent && s.match === 'sound' ? '#00ff88' : '#fff'
                                    }}>
                                        {s.char}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                                        {i === step ? 'CURRENT' : (i === (step - 2 + steps.length) % steps.length && step >= 2 ? 'N=2 AGO' : `T-${step - i}`)}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Connection Arc for Match */}
                        {step >= 2 && (
                            <div style={{
                                position: 'absolute',
                                top: '-20px',
                                left: `${((step - 2) * 100) + 40}px`,
                                width: '200px',
                                height: '40px',
                                borderTop: '2px dashed #00ff88',
                                borderLeft: '2px dashed #00ff88',
                                borderRight: '2px dashed #00ff88',
                                borderRadius: '20px 20px 0 0',
                                opacity: currentStep.match ? 1 : 0.1
                            }} />
                        )}
                    </div>
                </div>

                <div style={{
                    textAlign: 'center', color: '#fff', fontSize: '18px', lineHeight: '1.6', maxWidth: '600px',
                    background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px'
                }}>
                    {currentStep.match === 'pos' && (
                        <div style={{ color: '#00ff88', fontWeight: 'bold', marginBottom: '10px' }}>
                            <dc.Icon icon="eye" style={{ display: 'inline', width: '20px', marginRight: '8px' }} />
                            POSITION MATCH! (Same square as 2 steps ago)
                        </div>
                    )}
                    {currentStep.match === 'sound' && (
                        <div style={{ color: '#00ff88', fontWeight: 'bold', marginBottom: '10px' }}>
                            <dc.Icon icon="volume-2" style={{ display: 'inline', width: '20px', marginRight: '8px' }} />
                            SOUND MATCH! (Same letter as 2 steps ago)
                        </div>
                    )}
                    {!currentStep.match && <div style={{ color: '#888' }}>Observe and Remember...</div>}

                    <div style={{ marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
                        Press <strong>POSITION</strong> or <strong>Key 'A'</strong> if the square matches.<br />
                        Press <strong>AUDIO</strong> or <strong>Key ';'</strong> if the letter matches.
                    </div>
                </div>

                <div
                    onClick={() => setShowTutorial(false)}
                    style={{ ...styles.button, marginTop: '40px', width: 'auto' }}
                >
                    GOT IT
                </div>

                <a
                    href="https://dual-n-back.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        marginTop: '20px',
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '12px',
                        textDecoration: 'none',
                        borderBottom: '1px dotted rgba(255,255,255,0.3)',
                        cursor: 'pointer'
                    }}
                >
                    Inspiration: dual-n-back.io
                </a>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            {showTutorial && <TutorialOverlay />}
            {showStats && <StatsOverlay />}

            <style>{`
                .iq-summary-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .iq-summary-icon svg.svg-icon {
                    width: 80px !important;
                    height: 80px !important;
                }
                .iq-btn-icon {
                    display: inline-flex;
                    align-items: center;
                    margin-right: 12px;
                }
                .iq-btn-icon svg.svg-icon {
                    width: 24px !important;
                    height: 24px !important;
                }
                .iq-main-btn {
                    transition: all 0.3s ease !important;
                }
                .iq-main-btn:hover {
                    transform: scale(1.05);
                    background: rgba(138, 43, 226, 0.25) !important;
                    box-shadow: 0 0 20px rgba(138, 43, 226, 0.4);
                }
            `}</style>
            {/* HUD */}
            {gameState === 'playing' && (
                <div style={styles.stats}>
                    <div>LEVEL <span style={styles.statValue}>{currentN}</span></div>
                </div>
            )}

            {/* Exit Button during game */}
            {gameState === 'playing' && (
                <div
                    onClick={quitGame}
                    style={{
                        position: 'absolute',
                        top: '40px',
                        right: '40px',
                        cursor: 'pointer',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        background: 'rgba(255, 77, 77, 0.2)',
                        border: '1px solid rgba(255, 77, 77, 0.4)',
                        color: '#ff4d4d',
                        fontSize: '14px',
                        letterSpacing: '0.1em',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        zIndex: 100
                    }}
                >
                    <dc.Icon icon="x" style={{ width: '20px', height: '20px' }} />
                    EXIT
                </div>
            )}

            <div style={styles.glassCard}>
                {gameState === 'idle' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h1 style={styles.title}>IQ GAME</h1>
                            <p style={styles.subtitle}>DUAL N-BACK MEMORY TRAINING</p>
                        </div>

                        {viewMode === 'main' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                                <button
                                    className="iq-main-btn"
                                    style={{ ...styles.button, ...styles.buttonPrimary }}
                                    onClick={() => {
                                        setCurrentN(1);
                                        setCurrentInterval(3000);
                                        startRound();
                                    }}
                                >
                                    START TRAINING
                                </button>
                                <button
                                    className="iq-main-btn"
                                    style={{ ...styles.button, ...styles.buttonSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setShowTutorial(true)}
                                >
                                    <span className="iq-btn-icon">
                                        <dc.Icon icon="help-circle" />
                                    </span>
                                    HOW TO PLAY
                                </button>
                                <button
                                    className="iq-main-btn"
                                    style={{ ...styles.button, ...styles.buttonSecondary }}
                                    onClick={() => setViewMode('custom')}
                                >
                                    CUSTOM MODE
                                </button>
                                <button
                                    className="iq-main-btn"
                                    onClick={() => setShowStats(true)}
                                    style={{
                                        ...styles.button,
                                        ...styles.buttonSecondary,
                                        background: 'rgba(138, 43, 226, 0.15)',
                                        border: '1px solid rgba(138, 43, 226, 0.4)',
                                        color: '#d8b4fe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <span className="iq-btn-icon">
                                        <dc.Icon icon="bar-chart-2" />
                                    </span>
                                    VIEW STATS
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: '40px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>N LEVEL</div>
                                        <div style={styles.selector}>
                                            <button style={styles.selectorBtn} onClick={() => setCurrentN(Math.max(1, currentN - 1))}>-</button>
                                            <div style={styles.nValue}>{currentN}</div>
                                            <button style={styles.selectorBtn} onClick={() => setCurrentN(Math.min(9, currentN + 1))}>+</button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>INTERVAL (S)</div>
                                        <div style={styles.selector}>
                                            <button style={styles.selectorBtn} onClick={() => setCurrentInterval(Math.max(500, currentInterval - 500))}>-</button>
                                            <div style={{ ...styles.nValue, width: '60px' }}>{(currentInterval / 1000).toFixed(1)}</div>
                                            <button style={styles.selectorBtn} onClick={() => setCurrentInterval(Math.min(10000, currentInterval + 500))}>+</button>
                                        </div>
                                    </div>
                                </div>

                                <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={startRound}>
                                    START SESSION
                                </button>
                                <button
                                    style={{ ...styles.button, ...styles.buttonSecondary, border: 'none' }}
                                    onClick={() => setViewMode('main')}
                                >
                                    BACK
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {gameState === 'playing' && (
                    <div style={styles.grid}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                            const isActive = showStimulus && currentStep.pos === i;
                            if (i === 4) return <div key={i} style={styles.cell} />;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        ...styles.cell,
                                        ...(isActive ? styles.cellActive : {})
                                    }}
                                />
                            );
                        })}
                    </div>
                )}

                {gameState === 'playing' && (
                    <div style={styles.controls}>
                        <button
                            style={{
                                ...styles.button,
                                ...(activeKeys.pos ? styles.cellActive : {}),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => checkMatch('pos')}
                        >
                            <span className="iq-btn-icon">
                                <dc.Icon icon="eye" />
                            </span>
                            POSITION (A)
                        </button>
                        <button
                            style={{
                                ...styles.button,
                                ...(activeKeys.sound ? styles.cellActive : {}),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => checkMatch('sound')}
                        >
                            <span className="iq-btn-icon">
                                <dc.Icon icon="volume-2" />
                            </span>
                            AUDIO (;)
                        </button>
                    </div>
                )}

                {gameState === 'summary' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '400px', gap: '48px' }}>
                        <div style={{ width: '100%', maxWidth: '550px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '20px' }}>
                                            <span className="iq-summary-icon" style={{ color: '#8a2be2' }}>
                                                <dc.Icon icon="eye" />
                                            </span>
                                        </th>
                                        <th style={{ padding: '20px' }}></th>
                                        <th style={{ padding: '20px' }}>
                                            <span className="iq-summary-icon" style={{ color: '#8a2be2' }}>
                                                <dc.Icon icon="volume-2" />
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody style={{ textAlign: 'center' }}>
                                    <tr style={{ fontSize: '1.2rem' }}>
                                        <td style={{ padding: '12px' }}>{score.pos.hits}</td>
                                        <td style={{ padding: '12px', fontWeight: '700', fontSize: '1.4rem', letterSpacing: '0.1em' }}>HITS</td>
                                        <td style={{ padding: '12px' }}>{score.sound.hits}</td>
                                    </tr>
                                    <tr style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)' }}>
                                        <td style={{ padding: '12px' }}>{score.pos.misses}</td>
                                        <td style={{ padding: '12px', fontWeight: '700', fontSize: '1.4rem', letterSpacing: '0.1em' }}>MISSES</td>
                                        <td style={{ padding: '12px' }}>{score.sound.misses}</td>
                                    </tr>
                                    <tr style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.2)' }}>
                                        <td style={{ padding: '12px' }}>{score.pos.falseAlarms}</td>
                                        <td style={{ padding: '12px', fontWeight: '700', fontSize: '1.4rem', letterSpacing: '0.1em' }}>FALSE ALARMS</td>
                                        <td style={{ padding: '12px' }}>{score.sound.falseAlarms}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ textAlign: 'center', position: 'relative' }}>
                            <div style={{
                                fontSize: '4.5rem',
                                fontWeight: '700',
                                color: progression === 'up' ? '#00ff88' : progression === 'down' ? '#ff4d4d' : '#ffffff',
                                lineHeight: '1',
                                position: 'relative',
                                display: 'inline-block'
                            }}>
                                N = {currentN}
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '-60px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: progression === 'up' ? '#00ff88' : progression === 'down' ? '#ff4d4d' : '#ffffff',
                                    whiteSpace: 'nowrap'
                                }}>
                                    d' = {dPrime}%
                                </div>
                            </div>
                            <div style={{ ...styles.subtitle, marginTop: '12px', color: '#ffffff', fontSize: '1.1rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                {progression === 'up' ? 'LEVEL UP' : progression === 'down' ? 'LEVEL DOWN' : 'STAYING'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                            <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={startRound}>
                                NEXT ROUND
                            </button>
                            <button style={{ ...styles.button, border: 'none', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontSize: '0.7rem' }} onClick={() => { quitGame(); setViewMode('main'); }}>
                                EXIT
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Full-tab Toggle */}
            <div
                onClick={onToggleFullTab}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '2px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: '10px',
                    letterSpacing: '0.1em'
                }}
            >
                {isFullTab ? "MINIMIZE" : "MAXIMIZE"}
            </div>
        </div>
    );
}

return { IQGame };
