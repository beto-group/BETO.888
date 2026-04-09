const { useState, useEffect, useRef } = dc;

function LibrarySidebar(props) {
    const { components = {}, styles = {}, onOpenCreator, onEditComponent, onDeleteComponent, scenes = [], activeScene, onSelectScene, onCreateScene, onDeleteScene, activeTab = 'library', onTabChange } = props;
    const [hoveredComponent, setHoveredComponent] = useState(null);
    const [previewFrame, setPreviewFrame] = useState(0);
    const previewIntervalRef = useRef(null);

    // Tab State is now controlled by parent (activeTab prop)

    useEffect(() => {
        if (hoveredComponent) {
            setPreviewFrame(0);
            previewIntervalRef.current = setInterval(() => {
                setPreviewFrame(prev => (prev + 1) % 100);
            }, 33);
        } else {
            if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);
            setPreviewFrame(0);
        }
        return () => {
            if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);
        };
    }, [hoveredComponent]);

    const getCategory = (Comp) => {
        if (!Comp || !Comp.metadata || !Array.isArray(Comp.metadata)) return 'foreground';
        const catItem = Comp.metadata.find(m => m.id === 'category');
        if (!catItem) return 'foreground';
        const rawCat = catItem.default || catItem.value || 'foreground';
        return typeof rawCat === 'string' ? rawCat.toLowerCase() : 'foreground';
    };

    const groupedComponents = Object.entries(components || {}).reduce((acc, [name, Comp]) => {
        if (name === 'default') return acc;
        const cat = getCategory(Comp);
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ name, Comp });
        return acc;
    }, { background: [], foreground: [] });

    // Drag Start Handler
    const handleDragStart = (e, name) => {
        e.dataTransfer.setData('componentName', name);
        e.dataTransfer.effectAllowed = 'copy';

        // Hide default drag image (we will use a custom "ghost" in Timeline)
        const emptyImg = new Image();
        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
    };

    const categorizedComponents = groupedComponents; // Alias for clarity

    const renderLibraryTab = () => (
        <div style={{ padding: '0 10px 10px 10px' }}>
            {/* Categories */}
            {Object.entries(categorizedComponents).map(([category, components]) => (
                <div key={category} style={{ marginBottom: '20px' }}>
                    <h3 style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#666',
                        margin: '0 0 10px 5px',
                        letterSpacing: '1px'
                    }}>{category}</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {components.map(({ name, Comp }) => (
                            <div
                                key={name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, name)}
                                onMouseEnter={() => setHoveredComponent(name)}
                                onMouseLeave={() => setHoveredComponent(null)}
                                onClick={() => {
                                    if (typeof onEditComponent === 'function') {
                                        onEditComponent(name, Comp.metadata);
                                    }
                                }}
                                style={{
                                    padding: '12px 15px',
                                    margin: '5px 0',
                                    borderRadius: '8px',
                                    cursor: 'grab',
                                    background: hoveredComponent === name ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                    transition: 'all 0.2s ease',
                                    border: hoveredComponent === name ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: hoveredComponent === name ? '#8b5cf6' : 'rgba(255,255,255,0.2)' }} />
                                        <span style={{ color: hoveredComponent === name ? '#ffffff' : 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{name}</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {hoveredComponent === name && Comp.metadata && (
                                            <dc.Icon icon="edit-3" style={{ width: '12px', color: '#8b5cf6', opacity: 0.8 }} />
                                        )}
                                        {hoveredComponent === name && onDeleteComponent && (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteComponent(name);
                                                }}
                                                title="Delete Component"
                                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px' }}
                                            >
                                                <dc.Icon icon="trash-2" style={{ width: '14px', height: '14px', color: '#ef4444', opacity: 0.9 }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Hover Preview */}
                                {hoveredComponent === name && Comp && (
                                    <div style={{
                                        position: 'fixed',
                                        left: '280px',
                                        top: '100px',
                                        width: '320px',
                                        height: '180px',
                                        background: '#000000',
                                        border: '1px solid #8b5cf6',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        zIndex: 9999,
                                        pointerEvents: 'none'
                                    }}>
                                        <div style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '1280px', height: '720px' }}>
                                            <Comp frame={previewFrame} />
                                        </div>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '3px',
                                            background: 'rgba(139, 92, 246, 0.2)'
                                        }}>
                                            <div style={{
                                                width: `${(previewFrame / 100) * 100}%`,
                                                height: '100%',
                                                background: '#8b5cf6'
                                            }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const [renamingScene, setRenamingScene] = useState(null); // { name: string, value: string }

    const renderScenesTab = () => (
        <div style={{ padding: '0 10px 10px 10px' }}>
            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={onCreateScene}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: '#2e1065', // Dark purple
                        color: '#c4b5fd',
                        border: '1px solid #8b5cf6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                    }}
                >
                    <dc.Icon icon="plus" style={{ width: '14px' }} />
                    New Scene
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', marginTop: '20px', paddingLeft: '5px' }}>
                <h3 style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#666',
                    margin: 0,
                    letterSpacing: '1px'
                }}>Your Scenes</h3>
                {props.onRefreshScenes && (
                    <button
                        onClick={(e) => {
                            e.currentTarget.style.transform = 'rotate(180deg)';
                            setTimeout(() => e.currentTarget.style.transform = 'none', 500);
                            props.onRefreshScenes();
                        }}
                        title="Refresh Scene List"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'transform 0.5s ease'
                        }}
                    >
                        <dc.Icon icon="refresh-cw" style={{ width: '12px', height: '12px' }} />
                    </button>
                )}
            </div>

            {scenes.filter(s => !s.startsWith('_prefs')).map(sceneName => {
                const displayName = sceneName.replace('.json', '');
                const isRenaming = renamingScene && renamingScene.name === displayName;

                return (
                    <div
                        key={sceneName}
                        onClick={() => {
                            if (!isRenaming) onSelectScene(sceneName);
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            setRenamingScene({ name: displayName, value: displayName });
                        }}
                        style={{
                            padding: '12px 15px',
                            margin: '5px 0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: activeScene === sceneName ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                            border: '1px solid transparent',
                            color: activeScene === sceneName ? 'white' : 'rgba(255,255,255,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isRenaming ? (
                            <input
                                autoFocus
                                value={renamingScene.value}
                                onChange={(e) => setRenamingScene({ ...renamingScene, value: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (renamingScene.value !== renamingScene.name && props.onRenameScene) {
                                            props.onRenameScene(renamingScene.name, renamingScene.value);
                                        }
                                        setRenamingScene(null);
                                    } else if (e.key === 'Escape') {
                                        setRenamingScene(null);
                                    }
                                    e.stopPropagation();
                                }}
                                onBlur={() => {
                                    if (renamingScene.value !== renamingScene.name && props.onRenameScene) {
                                        props.onRenameScene(renamingScene.name, renamingScene.value);
                                    }
                                    setRenamingScene(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    background: '#000',
                                    color: '#fff',
                                    border: '1px solid #8b5cf6',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    fontSize: '13px'
                                }}
                            />
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                    <dc.Icon icon="film" style={{ width: '14px', flexShrink: 0, opacity: activeScene === sceneName ? 1 : 0.5 }} />
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: activeScene === sceneName ? 'bold' : 'normal',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                    }}>
                                        {displayName}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                                    {activeScene === sceneName && (
                                        <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>
                                    )}
                                    {onDeleteScene && sceneName !== 'Default Scene' && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteScene(sceneName);
                                            }}
                                            title="Delete Scene"
                                            style={{ cursor: 'pointer', opacity: 0.6, padding: '2px' }}
                                        >
                                            <dc.Icon icon="trash-2" style={{ width: '12px' }} />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div style={{
            width: '250px',
            height: '100%',
            background: '#0a0a0a',
            borderRight: '1px solid #2d2d2d',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden'
        }}>
            {/* Header / Tabs */}
            <div style={{
                padding: '15px',
                borderBottom: '1px solid #2d2d2d',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', background: '#161616', borderRadius: '6px', padding: '3px', border: '1px solid #333' }}>
                    <div
                        onClick={() => onTabChange && onTabChange('library')}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: activeTab === 'library' ? '#333' : 'transparent',
                            color: activeTab === 'library' ? 'white' : '#666'
                        }}
                    >
                        LIBRARY
                    </div>
                    <div
                        onClick={() => onTabChange && onTabChange('scenes')}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: activeTab === 'scenes' ? '#333' : 'transparent',
                            color: activeTab === 'scenes' ? 'white' : '#666'
                        }}
                    >
                        SCENES
                    </div>
                </div>

                {activeTab === 'library' && (
                    <button
                        onClick={onOpenCreator}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <dc.Icon icon="plus-square" style={{ width: '14px' }} />
                        Create Component
                    </button>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingTop: '10px' }}>
                {activeTab === 'library' ? (
                    <>
                        {Object.keys(components || {}).length === 0 && (
                            <div style={{ color: 'rgba(255,255,255,0.3)', padding: '20px', fontSize: '12px' }}>
                                No components found in library.
                            </div>
                        )}
                        {renderLibraryTab()}
                    </>
                ) : (
                    renderScenesTab()
                )}
            </div>

            <div style={{ padding: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
                Remotion Clone v1.2
            </div>
        </div>
    );
}

return { LibrarySidebar };
