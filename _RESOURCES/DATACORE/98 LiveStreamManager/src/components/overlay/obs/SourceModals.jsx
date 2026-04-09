const { useEffect } = dc;

function SourceModals(props) {
    const {
        showAddSourceModal, setShowAddSourceModal,
        showSettingsModal, setShowSettingsModal,
        editingItem, setEditingItem,
        newSourceType, setNewSourceType,
        newSourceName, setNewSourceName,
        newSourceUrl, setNewSourceUrl,
        newSourceWindowName, setNewSourceWindowName,
        newSourceDisplayId, setNewSourceDisplayId,
        handleCreateSource,
        handleSaveSettings,
        focusInputSettings,
        obsMonitors = [],
        fetchMonitors,
        availableWindows = [],
        fetchAvailableWindows,
        onModalToggle
    } = props;

    useEffect(() => {
        if (showAddSourceModal || showSettingsModal) {
            if (onModalToggle) onModalToggle(true);
        } else {
            if (onModalToggle) onModalToggle(false);
        }
    }, [showAddSourceModal, showSettingsModal]);

    useEffect(() => {
        const handleClose = () => {
            setShowAddSourceModal(false);
            setShowSettingsModal(false);
        };
        window.addEventListener('close-modals', handleClose);
        return () => window.removeEventListener('close-modals', handleClose);
    }, []);

    useEffect(() => {
        if (showAddSourceModal) {
            if (fetchMonitors) fetchMonitors();
            if (fetchAvailableWindows) fetchAvailableWindows();
        }
    }, [showAddSourceModal]);

    if (!showAddSourceModal && !showSettingsModal) return null;

    return (
        <>
            {showAddSourceModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, letterSpacing: '-1px', fontWeight: '900' }}>Add New Source</h3>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Source Type</label>
                            <select
                                style={{ ...inputStyle, background: '#1c1c1f', cursor: 'pointer' }}
                                value={newSourceType}
                                onChange={e => setNewSourceType(e.target.value)}
                            >
                                <option value="browser_source">Browser Source</option>
                                <option value="window_capture">Window Capture</option>
                                <option value="monitor_capture">Display Capture</option>
                                <option value="coreaudio_input_capture">Audio Input</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Name</label>
                            <input style={inputStyle} value={newSourceName} onChange={e => setNewSourceName(e.target.value)} placeholder="My Source" />
                        </div>

                        {newSourceType === 'browser_source' && (
                            <div style={{ marginBottom: '25px' }}>
                                <label style={labelStyle}>URL</label>
                                <input style={inputStyle} value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)} placeholder="https://..." />
                            </div>
                        )}

                        {newSourceType === 'window_capture' && (
                            <div style={{ marginBottom: '25px' }}>
                                <label style={labelStyle}>Select Window</label>
                                <select
                                    style={{ ...inputStyle, background: '#1c1c1f', cursor: 'pointer' }}
                                    value={newSourceWindowName}
                                    onChange={e => setNewSourceWindowName(e.target.value)}
                                >
                                    <option value="">-- Choose Window --</option>
                                    {availableWindows.map(win => (
                                        <option key={win} value={win}>{win}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {newSourceType === 'monitor_capture' && (
                            <div style={{ marginBottom: '25px' }}>
                                <label style={labelStyle}>Select Display</label>
                                <select
                                    style={{ ...inputStyle, background: '#1c1c1f', cursor: 'pointer' }}
                                    value={newSourceDisplayId}
                                    onChange={e => setNewSourceDisplayId(e.target.value)}
                                >
                                    {obsMonitors.map(m => (
                                        <option key={m.monitorIndex} value={m.monitorIndex}>{m.monitorName} ({m.monitorWidth}x{m.monitorHeight})</option>
                                    ))}
                                    {obsMonitors.length === 0 && <option value="0">Primary Display (Default)</option>}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddSourceModal(false)} style={cancelButtonStyle}>Cancel</button>
                            <button onClick={handleCreateSource} style={confirmButtonStyle}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showSettingsModal && editingItem && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, letterSpacing: '-1px', fontWeight: '900' }}>Edit {editingItem.sourceName}</h3>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Source Properties (JSON/URL)</label>
                            <input
                                style={inputStyle}
                                value={editingItem.tempUrl || (focusInputSettings && focusInputSettings.url) || ''}
                                onChange={e => setEditingItem({ ...editingItem, tempUrl: e.target.value })}
                                placeholder={focusInputSettings ? JSON.stringify(focusInputSettings).substring(0, 50) + "..." : "Fetching settings..."}
                            />
                            <div style={{ fontSize: '10px', color: '#71717a', marginTop: '5px' }}>
                                *Currently only URL update supported for browser sources
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowSettingsModal(false); setEditingItem(null); }} style={cancelButtonStyle}>Cancel</button>
                            <button onClick={handleSaveSettings} style={confirmButtonStyle}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const modalOverlayStyle = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
};

const modalContentStyle = {
    background: '#09090b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '40px',
    width: '450px',
    boxShadow: '0 30px 60px rgba(0,0,0,0.8)'
};

const labelStyle = {
    display: 'block',
    fontSize: '9px',
    fontWeight: '900',
    color: '#71717a',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px'
};

const inputStyle = {
    width: '100%',
    height: '48px',
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '0 16px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
};

const cancelButtonStyle = {
    padding: '14px 24px',
    background: 'transparent',
    border: '1px solid #27272a',
    borderRadius: '12px',
    color: '#71717a',
    fontSize: '13px',
    fontWeight: '900',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const confirmButtonStyle = {
    padding: '14px 28px',
    background: '#a076f9',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(160, 118, 249, 0.2)',
    transition: 'all 0.2s'
};

return { SourceModals };
