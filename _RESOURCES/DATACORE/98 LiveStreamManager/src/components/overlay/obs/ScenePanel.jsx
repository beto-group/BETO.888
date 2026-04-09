const { useState } = dc;

function ScenePanel({ obsScenes, selectedDetailScene, setSelectedDetailScene, sceneMap, createScene, removeScene }) {
    const [newSceneName, setNewSceneName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Helper: Map internal scene ID to friendly name
    const getFriendlyName = (obsName) => {
        for (const [id, name] of Object.entries(sceneMap || {})) {
            if (name === obsName) return id.toUpperCase();
        }
        return "UNKNOWN";
    };

    const handleCreate = () => {
        if (!newSceneName) return setIsAdding(false);
        if (createScene) createScene(newSceneName);
        setNewSceneName('');
        setIsAdding(false);
    };

    return (
        <div style={panelContainerStyle}>
            <div style={{ ...panelHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>AVAILABLE SCENES</span>
                <button
                    onClick={() => setIsAdding(true)}
                    style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0 5px' }}
                >
                    <dc.Icon icon="plus" style={{ width: 14 }} />
                </button>
            </div>

            {isAdding && (
                <div style={{ padding: '0 20px 10px 20px', display: 'flex', gap: '5px' }}>
                    <input
                        autoFocus
                        value={newSceneName}
                        onChange={e => setNewSceneName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        placeholder="Scene Name"
                        style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: '4px', color: '#fff', fontSize: '12px', padding: '4px 8px', outline: 'none' }}
                    />
                    <button onClick={handleCreate} style={{ background: '#10b981', border: 'none', borderRadius: '4px', color: '#fff', padding: '0 8px', cursor: 'pointer' }}>
                        <dc.Icon icon="check" style={{ width: 12 }} />
                    </button>
                </div>
            )}

            <div style={scrollAreaStyle}>
                {obsScenes.map(scene => (
                    <div
                        key={scene.sceneName}
                        onClick={() => setSelectedDetailScene(scene.sceneName)}
                        style={{
                            ...sceneItemStyle,
                            padding: '12px 16px',
                            borderColor: selectedDetailScene === scene.sceneName ? '#a076f9' : 'rgba(255,255,255,0.05)',
                            background: selectedDetailScene === scene.sceneName ? 'rgba(160, 118, 249, 0.1)' : 'transparent'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: '900' }}>{scene.sceneName}</span>
                            <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 'bold' }}>{getFriendlyName(scene.sceneName)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete scene "${scene.sceneName}"?`)) {
                                        if (removeScene) removeScene(scene.sceneName);
                                    }
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, padding: 0 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                            >
                                <dc.Icon icon="trash" style={{ width: 12 }} />
                            </button>
                            <dc.Icon icon="chevron-right" style={{ width: 14, opacity: 0.5 }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const panelContainerStyle = {
    width: '25%',
    minWidth: '250px',
    maxWidth: '400px',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column'
};

const panelHeaderStyle = {
    fontSize: '9px',
    fontWeight: '900',
    color: '#71717a',
    letterSpacing: '1px',
    padding: '20px 20px 10px 20px'
};

const scrollAreaStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 20px 20px'
};

const sceneItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderRadius: '14px',
    border: '1px solid',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s'
};

return { ScenePanel };
