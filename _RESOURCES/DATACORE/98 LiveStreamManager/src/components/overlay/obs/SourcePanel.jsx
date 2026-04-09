function SourcePanel(props) {
    const {
        obsSceneItems = [],
        selectedDetailScene,
        activeProgramScene,
        toggleSceneItem,
        setShowAddSourceModal,
        setEditingItem,
        setShowSettingsModal,
        getInputSettings,
        removeSceneItem,
        restartActiveCapture
    } = props;

    // Shared Styles
    const sourceItemStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.03)',
        borderRadius: '12px'
    };

    const toggleButtonStyle = {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: '1px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s'
    };

    const pillStyle = (color) => ({
        padding: '4px 10px',
        background: `${color}22`,
        border: `1px solid ${color}44`,
        color: color,
        fontSize: '8px',
        fontWeight: '900',
        borderRadius: '6px'
    });

    const panelHeaderStyle = {
        fontSize: '9px',
        fontWeight: '900',
        color: '#71717a',
        letterSpacing: '1px',
        padding: '0 0 10px 0'
    };

    return (
        <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={panelHeaderStyle}>SOURCES & VISIBILITY - {selectedDetailScene || 'NONE'}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowAddSourceModal(true)} style={pillStyle('#10b981')}>
                        <dc.Icon icon="plus" style={{ width: 10, marginRight: 4 }} />
                        ADD SOURCE
                    </button>
                    <button
                        onClick={() => restartActiveCapture && restartActiveCapture()}
                        style={pillStyle('#e11d48')}
                        title="Restart Capture Sources"
                    >
                        <dc.Icon icon="refresh-cw" style={{ width: 10, marginRight: 4 }} />
                        RESTART CAPTURE
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {obsSceneItems.length > 0 ? obsSceneItems.map(item => (
                    <div key={item.sceneItemId} style={sourceItemStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <dc.Icon icon={item.sourceType === 'OBS_SOURCE_TYPE_INPUT' ? "mic" : "image"} style={{ width: 14 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800' }}>{item.sourceName}</span>
                                <span style={{ fontSize: '9px', color: '#71717a' }}>{item.inputKind || 'SCENE'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => toggleSceneItem(selectedDetailScene || activeProgramScene, item.sceneItemId, !item.sceneItemEnabled)}
                                style={{
                                    ...toggleButtonStyle,
                                    background: item.sceneItemEnabled ? '#a076f922' : 'transparent',
                                    color: item.sceneItemEnabled ? '#a076f9' : '#71717a',
                                    borderColor: item.sceneItemEnabled ? '#a076f944' : 'rgba(255,255,255,0.05)'
                                }}
                            >
                                <dc.Icon icon={item.sceneItemEnabled ? "eye" : "eye-off"} style={{ width: 14 }} />
                            </button>
                            <button
                                onClick={() => {
                                    setEditingItem({ ...item, tempUrl: '' });
                                    if (getInputSettings) getInputSettings(item.sourceName);
                                    setShowSettingsModal(true);
                                }}
                                style={toggleButtonStyle}
                            >
                                <dc.Icon icon="settings" style={{ width: 14 }} />
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm(`Remove ${item.sourceName}?`)) {
                                        if (removeSceneItem) removeSceneItem(selectedDetailScene || activeProgramScene, item.sceneItemId);
                                    }
                                }}
                                style={{ ...toggleButtonStyle, borderColor: '#ef444444', color: '#ef4444' }}
                            >
                                <dc.Icon icon="trash" style={{ width: 14 }} />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '50px', color: '#333', fontWeight: '900', fontSize: '32px' }}>
                        {selectedDetailScene ? 'NO SOURCES FOUND' : 'SELECT A SCENE TO MANAGE SOURCES'}
                    </div>
                )}
            </div>
        </div>
    );
}

return { SourcePanel };
