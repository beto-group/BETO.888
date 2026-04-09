const { useState } = dc;

function ObsControl(props) {
    const {
        obsStatus,
        obsHost, setObsHost,
        obsPort, setObsPort,
        obsPassword, setObsPassword,
        isStreaming,
        toggleStreaming,
        isRecording,
        toggleRecording,
        sceneMap,
        setSceneMap,
        obsScenes = [],
        currentScene,
        obsSceneItems = [],
        toggleSceneItem,
        fetchSceneItems,
        launchOBS
    } = props;

    const [showConnection, setShowConnection] = useState(false);

    const isConnected = obsStatus === 'connected';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

            {/* 1. Connection Header & Toggle */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setShowConnection(!showConnection)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: isConnected ? '#10b981' : '#ef4444',
                            boxShadow: isConnected ? '0 0 10px #10b981' : 'none'
                        }} />
                        <span style={{ fontSize: '11px', fontWeight: '800', color: isConnected ? '#fff' : '#ef4444' }}>
                            {isConnected ? 'OBS CONNECTED' : 'DISCONNECTED'}
                        </span>
                    </div>
                    <dc.Icon
                        icon={showConnection ? "chevron-up" : "chevron-down"}
                        style={{ width: 14, opacity: 0.5 }}
                    />
                </div>

                {/* Connection Settings Panel */}
                {(showConnection || !isConnected) && (
                    <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px', padding: '5px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                            <InputGroup label="HOST" value={obsHost} onChange={setObsHost} placeholder="localhost" />
                            <InputGroup label="PORT" value={obsPort} onChange={setObsPort} placeholder="4455" />
                        </div>
                        <InputGroup label="PASSWORD" value={obsPassword} onChange={setObsPassword} type="password" placeholder="Server Password" />

                        {!isConnected && (
                            <button
                                onClick={launchOBS}
                                style={{
                                    marginTop: '5px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <dc.Icon icon="rocket" style={{ width: 12 }} />
                                LAUNCH OBS & CONNECT
                            </button>
                        )}
                        <div style={{ fontSize: '9px', color: '#71717a', textAlign: 'center', marginTop: '5px' }}>
                            Requires OBS WebSocket 5.x
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Stream Operations - Only if Connected */}
            {isConnected && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <StatusToggle
                            active={isStreaming}
                            label="STREAM"
                            onLabel="LIVE"
                            offLabel="OFFLINE"
                            color="#ef4444"
                            icon="radio"
                            onClick={toggleStreaming}
                        />
                        <StatusToggle
                            active={isRecording}
                            label="RECORD"
                            onLabel="REC"
                            offLabel="IDLE"
                            color="#a076f9"
                            icon="circle"
                            onClick={toggleRecording}
                        />
                    </div>

                    {/* 3. Scene Intelligence */}
                    <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>SCENE MAPPING</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {['starting', 'privacy', 'brb', 'ending'].map(dcId => (
                                <div key={dcId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sceneMap[dcId] ? '#a076f9' : '#333' }} />
                                        <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#d4d4d8' }}>{dcId}</span>
                                    </div>
                                    <select
                                        style={minimalSelectStyle}
                                        value={sceneMap[dcId] || ''}
                                        onChange={(e) => setSceneMap(prev => ({ ...prev, [dcId]: e.target.value }))}
                                    >
                                        <option value="">-- Unmapped --</option>
                                        {obsScenes.map(s => (
                                            <option key={s.sceneName} value={s.sceneName}>{s.sceneName}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Active Source Manager */}
                    {currentScene && sceneMap[currentScene] && (
                        <div style={sectionBoxStyle}>
                            <div style={{ ...sectionHeaderStyle, display: 'flex', justifyContent: 'space-between' }}>
                                <span>SOURCES: <span style={{ color: '#fff' }}>{sceneMap[currentScene]}</span></span>
                                <dc.Icon
                                    icon="refresh-cw"
                                    style={{ width: 10, cursor: 'pointer', opacity: 0.7 }}
                                    onClick={() => fetchSceneItems(sceneMap[currentScene])}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                {obsSceneItems.length > 0 ? obsSceneItems.map(item => (
                                    <div
                                        key={item.sceneItemId}
                                        onClick={() => toggleSceneItem(sceneMap[currentScene], item.sceneItemId, !item.sceneItemEnabled)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px',
                                            background: item.sceneItemEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${item.sceneItemEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <dc.Icon
                                            icon={item.sceneItemEnabled ? "eye" : "eye-off"}
                                            style={{ width: 12, color: item.sceneItemEnabled ? '#22c55e' : '#71717a' }}
                                        />
                                        <span style={{ fontSize: '9px', fontWeight: '600', color: item.sceneItemEnabled ? '#fff' : '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.sourceName}
                                        </span>
                                    </div>
                                )) : (
                                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '20px', fontSize: '10px', color: '#52525b' }}>
                                        No sources found or not fetched.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Subcomponents & Styles
const InputGroup = ({ label, value, onChange, type = "text", placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '8px', fontWeight: '800', color: '#71717a' }}>{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                padding: '6px 8px',
                color: '#fff',
                fontSize: '10px',
                outline: 'none',
                fontFamily: 'monospace'
            }}
        />
    </div>
);

const StatusToggle = ({ active, label, onLabel, offLabel, color, icon, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${active ? color : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.3s'
        }}
    >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '8px', fontWeight: '800', color: '#71717a' }}>{label}</span>
            <span style={{ fontSize: '11px', fontWeight: '900', color: active ? color : '#71717a' }}>
                {active ? onLabel : offLabel}
            </span>
        </div>
        <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: active ? color : '#27272a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: active ? `0 0 10px ${color}66` : 'none'
        }}>
            <dc.Icon icon={icon} style={{ width: 12, color: active ? '#fff' : '#71717a' }} />
        </div>
    </div>
);

const sectionBoxStyle = {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid rgba(255,255,255,0.03)',
    display: 'flex', flexDirection: 'column', gap: '10px'
};

const sectionHeaderStyle = {
    fontSize: '9px', fontWeight: '800', color: '#71717a', letterSpacing: '1px'
};

const minimalSelectStyle = {
    background: 'transparent',
    border: 'none',
    color: '#a1a1aa',
    fontSize: '10px',
    fontWeight: '600',
    textAlign: 'right',
    outline: 'none',
    cursor: 'pointer',
    maxWidth: '120px'
};

return { ObsControl };
