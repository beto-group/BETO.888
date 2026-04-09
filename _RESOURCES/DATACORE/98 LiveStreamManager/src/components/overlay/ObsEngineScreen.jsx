const { useState, useEffect } = dc;

// Modular Imports for OBS Engine
const activeFile = dc.app.workspace.getActiveFile().path;
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { ScenePanel } = await dc.require(folderPath + '/src/components/overlay/obs/ScenePanel.jsx');
const { PreviewPanel } = await dc.require(folderPath + '/src/components/overlay/obs/PreviewPanel.jsx');
const { SourcePanel } = await dc.require(folderPath + '/src/components/overlay/obs/SourcePanel.jsx');
const { SourceModals } = await dc.require(folderPath + '/src/components/overlay/obs/SourceModals.jsx');

function ObsEngineScreen(props) {
    const {
        obsStatus,
        obsScenes = [],
        obsSceneItems = [],
        fetchSceneItems,
        toggleSceneItem,
        isStreaming,
        isRecording,
        toggleStreaming,
        toggleRecording,
        sceneMap,
        onSelectScene,
        fetchScreenshot,
        obsScreenshot,
        obsHost, setObsHost,
        obsPort, setObsPort,
        obsPassword, setObsPassword,
        launchOBS,
        setReconnectTrigger,
        activeProgramScene
    } = props;

    // Local UI State
    const [selectedDetailScene, setSelectedDetailScene] = useState(null);
    const [showAddSourceModal, setShowAddSourceModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newSourceType, setNewSourceType] = useState('browser_source');
    const [newSourceName, setNewSourceName] = useState('');
    const [newSourceUrl, setNewSourceUrl] = useState('');
    const [newSourceWindowName, setNewSourceWindowName] = useState(''); // Added
    const [newSourceDisplayId, setNewSourceDisplayId] = useState('0'); // Added

    const targetPreviewScene = selectedDetailScene || activeProgramScene;

    // Auto-select active program scene on load
    useEffect(() => {
        if (!selectedDetailScene && activeProgramScene) {
            setSelectedDetailScene(activeProgramScene);
        }
    }, [activeProgramScene]);

    useEffect(() => {
        let interval;
        if (targetPreviewScene && obsStatus === 'connected') {
            const poll = () => fetchScreenshot(targetPreviewScene);
            interval = setInterval(poll, 1000);
            poll();
        }
        return () => clearInterval(interval);
    }, [targetPreviewScene, obsStatus]);

    useEffect(() => {
        if (selectedDetailScene) fetchSceneItems(selectedDetailScene);
    }, [selectedDetailScene]);

    const handleCreateSource = () => {
        if (!newSourceName) return alert("Name is required");
        let settings = {};
        if (newSourceType === 'browser_source') settings = { url: newSourceUrl, width: 1920, height: 1080 };
        if (newSourceType === 'window_capture') settings = { window_name: newSourceWindowName };
        if (newSourceType === 'monitor_capture') settings = { monitor_id: parseInt(newSourceDisplayId) || 0 };
        if (newSourceType === 'coreaudio_input_capture') settings = { device_id: 'default' };

        if (props.createInput) {
            props.createInput(selectedDetailScene || activeProgramScene, newSourceName, newSourceType, settings);
            setShowAddSourceModal(false);
            setNewSourceName('');
            setNewSourceUrl('');
            setNewSourceWindowName('');
            setNewSourceDisplayId('0');
        }
    };

    const handleSaveSettings = () => {
        if (!editingItem || !props.setInputSettings) return;
        props.setInputSettings(editingItem.sourceName, { url: editingItem.tempUrl });
        setShowSettingsModal(false);
        setEditingItem(null);
    };

    return (
        <div style={containerStyle}>
            {/* Header / Top Bar */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ ...iconBoxStyle, background: obsStatus === 'connected' ? '#10b981' : '#ef4444' }}>
                        <dc.Icon icon="cpu" style={{ width: 24, height: 24 }} />
                    </div>
                    <div>
                        <h2 style={titleStyle}>OBS ENGINE V2</h2>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                            <div style={subtitleStyle}>HYPER-THREADED CONTROL CENTER</div>
                            {obsStatus !== 'connected' && (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input value={obsHost} onChange={(e) => setObsHost(e.target.value)} placeholder="Host" style={quickInputStyle} />
                                    <input value={obsPort} onChange={(e) => setObsPort(e.target.value)} placeholder="Port" style={{ ...quickInputStyle, width: '40px' }} />
                                    <input type="password" value={obsPassword} onChange={(e) => setObsPassword(e.target.value)} placeholder="Pass" style={quickInputStyle} />
                                    <button onClick={() => { launchOBS(); setReconnectTrigger(p => p + 1); }} style={connectButtonStyle}>CONNECT</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '30px' }}>
                    <StatItem label="CONNECTION" value={obsStatus.toUpperCase()} color={obsStatus === 'connected' ? '#10b981' : '#ef4444'} />
                    <StatItem label="STREAM" value={isStreaming ? 'LIVE' : 'IDLE'} color={isStreaming ? '#ef4444' : '#71717a'} />
                    <StatItem label="RECORD" value={isRecording ? 'ACTIVE' : 'IDLE'} color={isRecording ? '#a076f9' : '#71717a'} />
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
                <ScenePanel
                    obsScenes={obsScenes}
                    selectedDetailScene={selectedDetailScene}
                    setSelectedDetailScene={setSelectedDetailScene}
                    sceneMap={sceneMap}
                    createScene={props.createScene}
                    removeScene={props.removeScene}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                    <PreviewPanel targetPreviewScene={targetPreviewScene} activeProgramScene={activeProgramScene} obsScreenshot={obsScreenshot} />
                    <SourcePanel
                        obsSceneItems={obsSceneItems}
                        selectedDetailScene={selectedDetailScene}
                        activeProgramScene={activeProgramScene}
                        toggleSceneItem={toggleSceneItem}
                        setShowAddSourceModal={setShowAddSourceModal}
                        setEditingItem={setEditingItem}
                        setShowSettingsModal={setShowSettingsModal}
                        getInputSettings={props.getInputSettings}
                        removeSceneItem={props.removeSceneItem}
                        restartActiveCapture={props.restartActiveCapture}
                    />

                    {obsStatus !== 'connected' && (
                        <div style={disconnectedOverlayStyle}>
                            <div style={{ textAlign: 'center' }}>
                                <dc.Icon icon="alert-triangle" style={{ width: 48, height: 48, color: '#ef4444', marginBottom: '20px' }} />
                                <h1 style={{ margin: '0 0 10px 0', letterSpacing: '-2px' }}>OBS DISCONNECTED</h1>
                                <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '30px' }}>The engine is currently offline. Ensure OBS is running and reachable.</p>
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                    <button onClick={launchOBS} style={largeLaunchButtonStyle}>
                                        <dc.Icon icon="power" style={{ width: 16 }} />
                                        LAUNCH OBS APPLICATION
                                    </button>
                                    <button onClick={() => setReconnectTrigger(p => p + 1)} style={largeConnectButtonStyle}>
                                        <dc.Icon icon="refresh-cw" style={{ width: 16 }} />
                                        RETRY CONNECTION
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={bottomBarStyle}>
                <ActionButton label="STREAM CONTROL" active={isStreaming} icon="radio" onClick={toggleStreaming} color="#ef4444" />
                <ActionButton label="RECORD CONTROL" active={isRecording} icon="circle" onClick={toggleRecording} color="#a076f9" />
                <button onClick={() => onSelectScene(null)} style={returnButtonStyle}>RETURN TO LOBBY</button>
            </div>

            <SourceModals
                showAddSourceModal={showAddSourceModal} setShowAddSourceModal={setShowAddSourceModal}
                showSettingsModal={showSettingsModal} setShowSettingsModal={setShowSettingsModal}
                editingItem={editingItem} setEditingItem={setEditingItem}
                newSourceType={newSourceType} setNewSourceType={setNewSourceType}
                newSourceName={newSourceName} setNewSourceName={setNewSourceName}
                newSourceUrl={newSourceUrl} setNewSourceUrl={setNewSourceUrl}
                newSourceWindowName={newSourceWindowName} setNewSourceWindowName={setNewSourceWindowName}
                newSourceDisplayId={newSourceDisplayId} setNewSourceDisplayId={setNewSourceDisplayId}
                handleCreateSource={handleCreateSource}
                handleSaveSettings={handleSaveSettings}
                focusInputSettings={props.focusInputSettings}
                obsMonitors={props.obsMonitors}
                fetchMonitors={props.fetchMonitors}
                availableWindows={props.availableWindows}
                fetchAvailableWindows={props.fetchAvailableWindows}
            />
        </div>
    );
}

// Utility Components
function StatItem({ label, value, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '8px', fontWeight: '900', color: '#71717a', letterSpacing: '1px' }}>{label}</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: color }}>{value}</span>
        </div>
    );
}

function ActionButton({ label, active, icon, onClick, color }) {
    return (
        <button onClick={onClick} style={{ ...actionButtonStyle, background: active ? color : 'rgba(255,255,255,0.02)', borderColor: active ? color : 'rgba(255,255,255,0.05)' }}>
            <dc.Icon icon={icon} style={{ width: 14 }} />
            {label} - {active ? 'STOP' : 'START'}
        </button>
    );
}

// Styles
const containerStyle = { position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #0a0a0b 0%, #000 100%)', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: 'hidden', zIndex: 10 };
const headerStyle = { padding: '30px 50px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' };
const iconBoxStyle = { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,0,0,0.5)' };
const titleStyle = { margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' };
const subtitleStyle = { fontSize: '10px', color: '#71717a', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' };
const quickInputStyle = { background: '#09090b', border: '1px solid #27272a', borderRadius: '4px', padding: '4px 8px', color: '#fff', fontSize: '9px', outline: 'none', width: '80px' };
const connectButtonStyle = { ...quickInputStyle, cursor: 'pointer', background: '#333' };
const bottomBarStyle = { padding: '20px 50px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '20px', background: 'rgba(0,0,0,0.5)', justifyContent: 'center' };
const returnButtonStyle = { padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#71717a', cursor: 'pointer' };
const actionButtonStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 28px', border: '1px solid', borderRadius: '14px', color: '#fff', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.3s' };

const disconnectedOverlayStyle = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(30px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
};

const largeLaunchButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 36px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '18px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '900',
    letterSpacing: '1px',
    cursor: 'pointer',
    boxShadow: '0 15px 40px rgba(59, 130, 246, 0.4)',
    transition: 'all 0.3s'
};

const largeConnectButtonStyle = {
    ...largeLaunchButtonStyle,
    background: '#18181b',
    border: '1px solid #27272a',
    boxShadow: 'none'
};

return { ObsEngineScreen };
