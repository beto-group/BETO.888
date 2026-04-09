const { useRef, useState, useEffect, useCallback } = dc;

/**
 * RemotionClone.jsx
 * Main video production engine and preview stage.
 * Standardizes sequence rendering and modular component management.
 * 
 * REFACTORED: Logic extracted to custom hooks.
 */

// Moved outside or kept stable
const FORMATS = {
    DESKTOP: { width: 1920, height: 1080, label: 'Full HD (16:9)' },
    SHORTS: { width: 1080, height: 1920, label: 'Shorts (9:16)' },
    SQUARE: { width: 1080, height: 1080, label: 'Square (1:1)' }
};

function RemotionClone({
    onCodeReloadRequest,
    isFullTab,
    onToggleFullTab,
    styles,
    ControlsMenu,
    useRemotion,
    useHistory,
    useStageScale,
    useExport,
    useSceneManager,
    useKeyboardShortcuts,
    Timeline,
    Sequencer,
    LibrarySidebar,
    libraryComponents,
    ComponentCreator,
    DraggableItem,
    folderPath,
    ...props
}) {
    const STYLES = styles;
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `remotion-clone-${instanceId}`;

    // --- 1. History Hook ---
    const { history, future, addToHistory, undo, redo, clearHistory } = useHistory ? useHistory() : {};

    // --- 2. Scene Manager Hook (Core State) ---
    const {
        sequence, setSequence,
        scenesList,
        activeScene, setActiveScene,
        activeBackground, setActiveBackground,
        zoom, setZoom,
        sidebarTab, setSidebarTab,
        handleCreateScene,
        handleSelectScene,
        handleRenameScene,
        handleDeleteScene,
        saveProject,
        hasLoadedState,
        refreshScenes
    } = useSceneManager ? useSceneManager({
        folderPath,
        isInception: props.isInception,
        libraryComponents,
        onHistoryAction: { clear: clearHistory }
    }) : {};

    // --- 3. Remotion Engine Hook ---
    // Calculate dynamic duration based on sequence
    const sequenceDuration = (sequence || []).reduce((acc, layer) => Math.max(acc, layer.from + layer.duration), 0);

    const { frame, isPlaying, play, pause, seek, toggle, durationInFrames, fps } = useRemotion({
        fps: 120, // Ultra Smooth / ProMotion support
        durationInFrames: Math.max(300, sequenceDuration)
    });

    // --- 4. Export Hook ---
    const stageElementRef = useRef(null);
    const {
        isExporting,
        exportProgress,
        showExportSettings,
        setShowExportSettings,
        exportSettings,
        setExportSettings,
        handleExportClick,
        handleStartExport,
        QUALITY_MAP
    } = useExport ? useExport({
        folderPath,
        fps,
        durationInFrames,
        stageElementRef,
        pause
    }) : {};



    const [format, setFormat] = useState('DESKTOP'); // Managed here

    // --- 5. Stage Scale Hook ---
    const { stageScale, stageContainerRef } = useStageScale ? useStageScale(format, FORMATS) : { stageScale: 1, stageContainerRef: null };

    // --- 6. Keyboard Shortcuts ---
    if (useKeyboardShortcuts) {
        useKeyboardShortcuts({
            onUndo: () => undo(
                { sequence: [...sequence], activeBackground },
                (state) => { setSequence(state.sequence); setActiveBackground(state.activeBackground); }
            ),
            onRedo: () => redo(
                { sequence: [...sequence], activeBackground },
                (state) => { setSequence(state.sequence); setActiveBackground(state.activeBackground); }
            )
        });
    }

    // --- Local UI State ---
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);
    const [isCreatorDirty, setIsCreatorDirty] = useState(false);

    // Calculate Active Components for UI Indicator
    const activeLayers = (sequence || []).filter(layer =>
        frame >= layer.from &&
        frame < (layer.from + layer.duration) &&
        !['GlobalBackground', 'GlowingFrame', 'PureBlack'].includes(layer.component)
    );

    // --- Component Logic Wrappers (Moved from Monolith) ---

    // Wrapper for history actions
    const handleUndoWrapper = () => {
        undo(
            { sequence: [...sequence], activeBackground },
            (state) => { setSequence(state.sequence); setActiveBackground(state.activeBackground); }
        );
    };

    const handleRedoWrapper = () => {
        redo(
            { sequence: [...sequence], activeBackground },
            (state) => { setSequence(state.sequence); setActiveBackground(state.activeBackground); }
        );
    };


    // Refresh components on save
    const handleCreatorSave = () => {
        setIsCreatorOpen(false);
        setEditingComponent(null);
        setIsCreatorDirty(false);
        onCodeReloadRequest(); // Refresh to see the new component
    };

    const handleEditComponent = (name, metadata) => {
        if (isCreatorOpen && isCreatorDirty) {
            const proceed = window.confirm("You have unsaved changes in the editor. Switch anyway? (Changes will be lost)");
            if (!proceed) return;
        }
        setIsCreatorDirty(false);
        setEditingComponent({ name, elements: metadata });
        setIsCreatorOpen(true);
    };

    const handleDeleteComponent = async (name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
        try {
            const filePath = `${folderPath}/src/library/${name}.jsx`;
            const exists = await dc.app.vault.adapter.exists(filePath);
            if (exists) {
                await dc.app.vault.adapter.remove(filePath);
                if (activeBackground === name) setActiveBackground('GradientBackground');
                onCodeReloadRequest(); // Refresh library
            } else {
                alert("File not found: " + filePath);
            }
        } catch (err) {
            console.error("[RemotionClone] Delete failed:", err);
            alert("Failed to delete component: " + err.message);
        }
    };

    // --- Sequence Manipulation Wrappers ---

    const handleAddLayer = (componentName, startTime = 0) => {
        if (componentName && libraryComponents[componentName]) {
            addToHistory({ sequence: [...sequence], activeBackground });
            const newLayer = {
                id: Date.now().toString(),
                component: componentName,
                from: startTime,
                duration: 150
            };
            setSequence(prev => [...prev, newLayer]);
        }
    };

    const removeLayer = (id) => {
        addToHistory({ sequence: [...sequence], activeBackground });
        setSequence(prev => prev.filter(item => item.id !== id));
    };

    const updateLayer = (id, updates, skipHistory = false) => {
        if (!skipHistory) addToHistory({ sequence: [...sequence], activeBackground });
        setSequence(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const handleInteractionStart = () => {
        addToHistory({ sequence: [...sequence], activeBackground });
    }

    const resequenceLayers = () => {
        addToHistory({ sequence: [...sequence], activeBackground });
        setSequence(prev => {
            const sorted = [...prev].sort((a, b) => a.from - b.from);
            let currentTime = 0;
            return sorted.map(layer => {
                const newLayer = { ...layer, from: currentTime };
                currentTime += layer.duration;
                return newLayer;
            });
        });
    };

    const moveLayer = (id, direction) => {
        addToHistory({ sequence: [...sequence], activeBackground });
        setSequence(prev => {
            const index = prev.findIndex(item => item.id === id);
            if (index === -1) return prev;
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prev.length) return prev;

            const newSequence = [...prev];
            const [moved] = newSequence.splice(index, 1);
            newSequence.splice(newIndex, 0, moved);
            return newSequence;
        });
    };

    const clearSequence = () => {
        if (window.confirm("Are you sure you want to clear the entire sequence?")) {
            addToHistory({ sequence: [...sequence], activeBackground });
            setSequence([]);
        }
    };

    const handleBackgroundChange = (newBg) => {
        addToHistory({ sequence: [...sequence], activeBackground });
        setActiveBackground(newBg);
    };

    const hoverEffectStyle = `
    .controls-menu {
      opacity: 1; /* Always visible for clarity */
      transition: all 0.3s ease-in-out;
    }
  `;

    if (!isFullTab) {
        return (
            <div style={STYLES.compactWrapper} className={uniqueWrapperClass}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={STYLES.subtitle}><strong>RemotionClone</strong> ({instanceId})</span>
                    <div
                        style={STYLES.iconButton}
                        onClick={onToggleFullTab}
                        title="Enter Full Mode"
                    >
                        <dc.Icon icon="maximize" style={{ width: "16px", height: "16px" }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: '#000000',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row', // Horizontal: Sidebar | Stage + Timeline
            alignItems: 'stretch',
        }}>
            <style>{hoverEffectStyle}</style>

            {/* Library Sidebar */}
            {LibrarySidebar ? (
                <LibrarySidebar
                    components={libraryComponents}
                    styles={STYLES}
                    onOpenCreator={() => {
                        setEditingComponent(null);
                        setIsCreatorOpen(true);
                    }}
                    onEditComponent={handleEditComponent}
                    onDeleteComponent={handleDeleteComponent}
                    scenes={scenesList}
                    activeScene={activeScene}
                    onSelectScene={handleSelectScene}
                    onCreateScene={handleCreateScene}
                    onDeleteScene={handleDeleteScene}
                    onRenameScene={handleRenameScene}
                    activeTab={sidebarTab}
                    onTabChange={setSidebarTab}
                    onRefreshScenes={refreshScenes}
                />
            ) : (
                <div style={{ width: '250px', background: 'rgba(255,0,0,0.1)', color: 'red', padding: '20px', fontSize: '12px', borderRight: '1px solid red' }}>
                    Sidebar Module Missing
                </div>
            )}

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                background: '#050505',
                overflow: 'hidden',
                minWidth: 0
            }}>
                {/* Component Creator Modal */}
                {isCreatorOpen && ComponentCreator && (
                    <ComponentCreator
                        styles={STYLES}
                        folderPath={folderPath}
                        onClose={() => setIsCreatorOpen(false)}
                        onSave={handleCreatorSave}
                        existingComponent={editingComponent}
                        key={editingComponent ? editingComponent.name : 'new'}
                        setDirty={setIsCreatorDirty}
                    />
                )}

                {/* Top Bar (Format, Export, Scenes) */}
                <div style={{
                    height: '56px', // Matched backup height
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 20px',
                    background: '#0a0a0a', // Matched backup bg
                    zIndex: 2000
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#888', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Project</span>
                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{activeScene}</span>
                        </div>
                        <div style={{ width: '1px', height: '24px', background: '#333' }} />

                        {/* Background Selector (Restored) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', fontWeight: '800' }}>BG</span>
                            <select
                                value={activeBackground}
                                onChange={(e) => handleBackgroundChange(e.target.value)}
                                style={{
                                    background: '#161616',
                                    color: '#ccc',
                                    border: '1px solid #333',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    minWidth: '140px'
                                }}
                            >
                                <option value="GradientBackground">Standard Gradient</option>
                                {Object.keys(libraryComponents || {}).map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Format Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', fontWeight: '800' }}>Format</span>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                style={{
                                    background: '#161616',
                                    color: '#eee',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    fontSize: '11px',
                                    outline: 'none'
                                }}
                            >
                                {Object.keys(FORMATS).map(key => (
                                    <option key={key} value={key}>{FORMATS[key].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Playing Indicator (Restored) */}
                        {activeLayers.length > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
                                background: '#2e1065', borderRadius: '20px', border: '1px solid #8b5cf6',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 2005
                            }}>
                                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#c4b5fd', marginRight: '4px', opacity: 0.8 }}>PLAYING:</span>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }} />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {activeLayers.map(layer => (
                                        <span key={layer.id} style={{ fontSize: '10px', color: '#e5e7eb', fontWeight: '600', letterSpacing: '0.3px' }}>
                                            {layer.component}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Controls Menu Injection */}
                        <div style={{ width: '1px', height: '24px', background: '#222' }} />
                        {ControlsMenu && (
                            <ControlsMenu
                                onReload={onCodeReloadRequest}
                                onToggle={onToggleFullTab}
                                onExport={handleExportClick}
                                onUndo={handleUndoWrapper}
                                onRedo={handleRedoWrapper}
                                canUndo={history && history.length > 0}
                                canRedo={future && future.length > 0}
                                styles={STYLES}
                            />
                        )}
                    </div>
                </div>

                {/* Stage Area (Using Sequencer for Preview) */}
                <div
                    ref={stageContainerRef}
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#050505',
                        overflow: 'hidden',
                        position: 'relative' // For absolute helpers
                    }}
                >
                    {/* Render Stage */}
                    <div
                        style={{
                            width: `${FORMATS[format].width}px`,
                            height: `${FORMATS[format].height}px`,
                            transform: `scale(${stageScale})`,
                            transformOrigin: 'center center',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                            position: 'relative',
                            flexShrink: 0,
                            zIndex: 10,
                            border: '2px solid #333' // Diagnostic border
                        }}
                    >
                        {/* THE ACTUAL RENDER ENGINE REFS */}
                        <div ref={stageElementRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000000' }} id="remotion-stage">

                            {/* Background Rendering Logic (Inside Sequencer) */}
                            {Sequencer && (
                                <Sequencer from={0} duration={durationInFrames} currentFrame={frame}>
                                    {(() => {
                                        if (activeBackground === 'GradientBackground') {
                                            return <div style={{ width: '100%', height: '100%', background: `linear-gradient(${frame + 45}deg, #000000 0%, #1a1a2e 100%)` }} />;
                                        }
                                        const BGComp = libraryComponents[activeBackground];
                                        return BGComp ? <BGComp frame={frame} fps={fps} isPlaying={isPlaying} /> : null;
                                    })()}
                                </Sequencer>
                            )}

                            {/* Sequence Layers Rendering Loop */}
                            {Sequencer && (sequence || []).map(layer => {
                                const Comp = libraryComponents[layer.component];
                                if (!Comp) return null;
                                return (
                                    <Sequencer key={layer.id} from={layer.from} duration={layer.duration} currentFrame={frame}>
                                        {dc.preact.createElement(Comp, { ...layer, frame: frame - layer.from, fps: fps, isPlaying: isPlaying })}
                                    </Sequencer>
                                );
                            })}

                            {/* Editor Preview */}
                            {isCreatorOpen && editingComponent && Sequencer && (
                                <Sequencer from={0} duration={durationInFrames} currentFrame={1000}>
                                    {(() => {
                                        const Comp = libraryComponents[editingComponent.name];
                                        return Comp ? <Comp frame={1000} /> : null;
                                    })()}
                                </Sequencer>
                            )}

                        </div>
                    </div>

                    {/* Export Overlay */}
                    {isExporting && (
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, width: '100%',
                            background: 'rgba(5, 5, 8, 0.98)', borderTop: '2px solid #8b5cf6',
                            padding: '20px 40px', zIndex: 100000,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <h3 style={{ margin: 0, color: '#fff' }}>EXPORTING</h3>
                                <span style={{ color: '#888' }}>Frame {exportProgress.frame} / {exportProgress.totalFrames}</span>
                            </div>
                            <div style={{ flex: 1, height: '10px', background: '#333', borderRadius: '5px' }}>
                                <div style={{ width: `${exportProgress.percent}%`, height: '100%', background: '#8b5cf6' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Export Settings Modal */}
                {showExportSettings && (
                    <div style={{
                        position: 'absolute', top: '56px', right: '20px', width: '240px',
                        background: 'rgba(20,20,25,0.98)', border: '1px solid #333', borderTop: 'none',
                        borderRadius: '0 0 8px 8px', padding: '15px', zIndex: 3000
                    }} onClick={e => e.stopPropagation()}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>EXPORT SETTINGS</h4>

                        {/* Quality */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', color: '#888', fontSize: '10px', marginBottom: '5px' }}>Quality</label>
                            <select
                                value={exportSettings.quality}
                                onChange={e => setExportSettings(s => ({ ...s, quality: e.target.value }))}
                                style={{ width: '100%', background: '#000', color: '#eee', padding: '6px', border: '1px solid #333' }}
                            >
                                {Object.entries(QUALITY_MAP).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Format */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', color: '#888', fontSize: '10px', marginBottom: '5px' }}>Format</label>
                            <select
                                value={exportSettings.format}
                                onChange={e => setExportSettings(s => ({ ...s, format: e.target.value }))}
                                style={{ width: '100%', background: '#000', color: '#eee', padding: '6px', border: '1px solid #333' }}
                            >
                                <option value="mp4">MP4 (H.264)</option>
                                <option value="webm">WebM (VP9)</option>
                                <option value="mov">MOV (ProRes)</option>
                            </select>
                        </div>

                        {/* FPS */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', color: '#888', fontSize: '10px', marginBottom: '5px' }}>Frame Rate</label>
                            <select
                                value={exportSettings.fps}
                                onChange={e => setExportSettings(s => ({ ...s, fps: parseInt(e.target.value) }))}
                                style={{ width: '100%', background: '#000', color: '#eee', padding: '6px', border: '1px solid #333' }}
                            >
                                <option value="30">30 FPS</option>
                                <option value="60">60 FPS</option>
                                <option value="120">120 FPS</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setShowExportSettings(false)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #333', color: '#888' }}>Cancel</button>
                            <button onClick={() => handleStartExport(format, seek)} style={{ flex: 1, padding: '8px', background: '#8b5cf6', border: 'none', color: '#fff', fontWeight: 'bold' }}>Export</button>
                        </div>
                    </div>
                )}

                {/* Bottom Panel: Timeline */}
                <div style={{ height: '320px', borderTop: '1px solid #222', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
                    {/* Timeline Component */}
                    {Timeline && (
                        <Timeline
                            frame={frame}
                            durationInFrames={durationInFrames}
                            isPlaying={isPlaying}
                            onToggle={toggle}
                            onSeek={seek}
                            styles={STYLES}
                            sequence={sequence}
                            onUpdateLayer={updateLayer} // Handles granular history
                            onRemoveLayer={removeLayer}
                            onMoveLayer={moveLayer}
                            onAddLayer={handleAddLayer}
                            onInteractionStart={handleInteractionStart} // Hook for bulk history
                            zoom={zoom}
                            onZoomChange={setZoom}
                        />
                    )}
                </div>

            </div>
        </div>
    );
}

return { RemotionClone };
