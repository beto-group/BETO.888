
const Icon = ({ name, size = 18, color = 'currentColor' }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        <dc.Icon icon={name} style={{ width: size, height: size, color }} />
    </div>
);

function PluginControlPanel({ tokens, status, currentVersion, githubUrl, isDeploying, isPublishing, handleDeploy, handlePublish, handleVisitRepo, showSettings, setShowSettings, repoName, setRepoName, ghToken, updateToken, updateVersion }) {
    const { useState } = dc;
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            onMouseLeave={() => { if(!showSettings) setIsVisible(false); }}
            style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10000,
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                display: 'flex', flexDirection: 'column'
            }}
        >
            {/* Hover Trigger */}
            <div
                onMouseEnter={() => setIsVisible(true)}
                style={{ height: '35px', width: '100%', position: 'absolute', bottom: '-35px', zIndex: -1, cursor: 'ns-resize' }}
            />

            {/* Toolbar */}
            <div style={{
                padding: '12px 24px', background: 'rgba(10, 10, 15, 0.98)', borderBottom: '1px solid var(--ng-border)',
                backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column', gap: '15px',
                boxShadow: '0 15px 45px rgba(0,0,0,0.6)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Icon name="boxes" size={16} color={tokens.primary} />
                        <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>
                            METASCAN FACTORY HUB 
                            <span style={{ color: tokens.accentGold, opacity: 0.8, marginLeft: '8px', fontSize: '10px' }}>v{currentVersion}</span>
                        </span>
                        <span style={{ fontSize: '10px', color: (isDeploying || isPublishing) ? tokens.accentGold : tokens.textDim, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'JetBrains Mono' }}>
                            {status}
                        </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={handleVisitRepo} disabled={!githubUrl} className="ng-btn ng-btn-small" style={{ width: '36px', height: '36px', padding: 0, opacity: githubUrl ? 1 : 0.2 }}>
                            <Icon name="globe" size={14} />
                        </button>
                        <button onClick={() => setShowSettings(!showSettings)} className="ng-btn ng-btn-small" style={{ width: '36px', height: '36px', padding: 0 }}>
                            <Icon name="settings" size={14} />
                        </button>
                        <button onClick={handleDeploy} disabled={isDeploying || isPublishing} className={`ng-btn ${isDeploying ? 'active' : ''}`} style={{ padding: '8px 24px' }}>
                            {isDeploying ? <Icon name="loader" size={14} /> : <Icon name="zap" size={14} />}
                            {isDeploying ? "DEPLOYING..." : "COMPILE & DEPLOY"}
                        </button>
                        <button onClick={handlePublish} disabled={isPublishing || isDeploying} className={`ng-btn ${isPublishing ? 'active' : ''}`} style={{ padding: '8px 24px', background: tokens.accentPink }}>
                            {isPublishing ? <Icon name="loader" size={14} /> : <Icon name="github" size={14} />}
                            {isPublishing ? "PUBLISHING..." : "ONE-CLICK PUBLISH"}
                        </button>
                    </div>
                </div>

                {showSettings && (
                    <div style={{ 
                        padding: '20px', borderTop: '1px solid var(--ng-border)', display: 'flex', flexDirection: 'column', gap: '15px',
                        background: 'rgba(255,255,255,0.02)', borderRadius: '12px'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.5 }}>Repository Name</label>
                                <input 
                                    type="text" value={repoName} onInput={(e) => setRepoName(e.target.value)}
                                    placeholder="e.g. metascan-pro"
                                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--ng-border)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.5 }}>GitHub Token</label>
                                <input 
                                    type="password" value={ghToken} onInput={(e) => updateToken(e.target.value)}
                                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--ng-border)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.5 }}>Plugin Version</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        type="text" value={currentVersion} onInput={(e) => updateVersion(e.target.value)}
                                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--ng-border)', color: tokens.accentGold, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', outline: 'none' }}
                                    />
                                    <button 
                                        onClick={() => {
                                            const parts = currentVersion.split('.');
                                            parts[2] = parseInt(parts[2] || 0) + 1;
                                            updateVersion(parts.join('.'));
                                        }}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--ng-border)', color: '#fff', padding: '0 10px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        +1
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Sidebar({ isInspecting, startInspection, stopInspection, logs, tokens }) {
    return (
        <aside className="ng-sidebar">
            <header className="ng-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: isInspecting ? tokens.primary : '#4ade80', boxShadow: '0 0 15px currentColor' }} />
                    <span style={{ fontSize: '11px', fontWeight: '900', color: tokens.primary, letterSpacing: '2px' }}>METASCAN PRO</span>
                </div>
            </header>
            <div style={{ padding: '45px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <button onClick={isInspecting ? stopInspection : startInspection} className={`ng-btn ${isInspecting ? 'active' : ''}`}>
                    <Icon name={isInspecting ? "x-circle" : "mouse-pointer-2"} />
                    {isInspecting ? "DISARM" : "SELECT ELEMENT"}
                </button>
                <div className="ng-card">
                    <div className="ng-card-title"><div><Icon name="activity" size={14} /> STREAM</div></div>
                    <div style={{ height: '350px', overflowY: 'auto' }}>
                        {logs.map((l, i) => (
                            <div key={i} style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', marginBottom: '8px', opacity: i === 0 ? 1 : 0.3 }}>
                                {l}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}

function MetricCard({ title, icon, value }) {
    return (
        <section className="ng-card" style={{ textAlign: 'center' }}>
            <div className="ng-card-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icon && <Icon name={icon} size={12} />}
                    {title}
                </div>
            </div>
            <div className="ng-metric-label">{value || "---"}</div>
        </section>
    );
}

function AnalysisLayer({ node, logs, tokens, handleCopy, copied }) {
    return (
        <main className="ng-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h1 style={{ margin: 0, fontWeight: 900, fontSize: '56px', letterSpacing: '-3px' }}>Analysis Layer</h1>
                    {node?.isLocked && (
                        <div style={{ padding: '4px 12px', background: tokens.primary, color: '#000', borderRadius: '20px', fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}>
                            SELECTION LOCKED
                        </div>
                    )}
                    {!node?.isLocked && node && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'ng-pulse 1s infinite' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tokens.primary }} />
                            <span style={{ fontSize: '10px', fontWeight: 900, opacity: 0.6 }}>LIVE_SYNC</span>
                        </div>
                    )}
                </div>
                <span style={{ fontSize: '10px', opacity: 0.2 }}>Modular v11 | Deep Immersion</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '35px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '35px', minWidth: 0 }}>
                    <section className="ng-card">
                        <div className="ng-card-title">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="layout" size={14} /> DOM_SNAPSHOT</div>
                            <button onClick={handleCopy} disabled={!node} className="ng-btn ng-btn-small">
                                <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "COPIED" : "COPY DOM"}
                            </button>
                        </div>
                        {node ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
                                <div className="ng-code-block" style={{ fontSize: '14px', wordBreak: 'break-all' }}>
                                    <span style={{ color: tokens.accentPink }}>&lt;{node.localName}</span> {node.id && <span><span style={{ color: tokens.accentGold }}>id</span>=<span style={{ color: tokens.accentGreen }}>"{node.id}"</span></span>} <span style={{ color: tokens.accentPink }}>&gt;</span>
                                </div>
                                <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '12px', opacity: 0.6, wordBreak: 'break-all', overflow: 'hidden', minHeight: '60px' }}>
                                    {node.innerText}
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>SIGNAL_AWAITING</div>
                        )}
                    </section>
                    <section className="ng-card" style={{ flex: 1 }}>
                        <div className="ng-card-title"><div><Icon name="code" size={14} /> DATA_TRACE</div></div>
                        <pre className="ng-code-block">
                            {node ? JSON.stringify(node, null, 2) : "// Protocol trace standby."}
                        </pre>
                    </section>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                    <MetricCard title="WIDTH" icon="maximize-2" value={node?.width} />
                    <MetricCard title="HEIGHT" icon="minimize-2" value={node?.height} />
                    <section className="ng-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="crosshair" size={100} color={tokens.primary} style={{ opacity: node ? 1 : 0.05 }} />
                    </section>
                </div>
            </div>
        </main>
    );
}

return { PluginControlPanel, Sidebar, AnalysisLayer, MetricCard, Icon };
