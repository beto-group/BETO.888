const { useState, useRef, useEffect } = dc;

function ComponentCreator({ styles, onSave, onCancel, folderPath, initialFormat, initialElements, initialName, DraggableItem, onDirtyChange }) {
    const STYLES = styles;

    const FORMATS = {
        DESKTOP: { width: 1280, height: 720, label: 'Desktop (16:9)', aspect: '16/9' },
        SHORTS: { width: 720, height: 1280, label: 'Shorts (9:16)', aspect: '9/16' },
        SQUARE: { width: 1080, height: 1080, label: 'Square (1:1)', aspect: '1/1' }
    };

    const [format, setFormat] = useState(initialFormat || 'DESKTOP');
    const [elements, setElements] = useState(initialElements || [
        { id: '1', type: 'text', content: 'New Component', x: 100, y: 100, fontSize: 48, color: '#ffffff', fontFamily: 'Inter' }
    ]);
    const [selectedId, setSelectedId] = useState(elements[0]?.id || null);
    const [componentName, setComponentName] = useState(initialName || 'MyNewComponent');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Sync state when props change (Swapping components)
    useEffect(() => {
        setComponentName(initialName || 'MyNewComponent');
        setElements(initialElements || [
            { id: '1', type: 'text', content: 'New Component', x: 100, y: 100, fontSize: 48, color: '#ffffff', fontFamily: 'Inter' }
        ]);
        setSelectedId(null);
        setIsDirty(false);
        if (onDirtyChange) onDirtyChange(false);
    }, [initialName, (initialElements ? JSON.stringify(initialElements) : null)]);

    // Dirty state tracking
    useEffect(() => {
        const hasNameChanged = componentName !== (initialName || 'MyNewComponent');
        const hasElementsChanged = JSON.stringify(elements) !== JSON.stringify(initialElements || [
            { id: '1', type: 'text', content: 'New Component', x: 100, y: 100, fontSize: 48, color: '#ffffff', fontFamily: 'Inter' }
        ]);

        const dirty = hasNameChanged || hasElementsChanged;
        if (dirty !== isDirty) {
            setIsDirty(dirty);
            if (onDirtyChange) onDirtyChange(dirty);
        }
    }, [elements, componentName, initialName, (initialElements ? JSON.stringify(initialElements) : null)]);

    const selectedElement = elements.find(el => el.id === selectedId);
    const currentFormat = FORMATS[format];

    const addElement = () => {
        const newId = Math.random().toString(36).substr(2, 5);
        setElements([...elements, {
            id: newId,
            type: 'text',
            content: 'New Text',
            x: 50,
            y: 50,
            fontSize: 24,
            color: '#8b5cf6',
            fontFamily: 'Inter'
        }]);
        setSelectedId(newId);
    };

    const updateElement = (id, updates) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const handleSave = async () => {
        if (!componentName) {
            alert("Please provide a name for the component.");
            return;
        }

        setIsSaving(true);
        try {
            // Serialize elements into a functional component string
            const elementStrings = elements.map(el => {
                return `
            <div style={{
                position: 'absolute',
                left: '${el.x}px',
                top: '${el.y}px',
                fontSize: '${el.fontSize}px',
                color: '${el.color}',
                fontFamily: '${el.fontFamily || 'Inter'}, sans-serif'
            }}>
                {${JSON.stringify(el.content)}}
            </div>`;
            }).join('');

            const fileContent = `function ${componentName}({ frame }) {
    const elements = ${componentName}.metadata || [];
    return (
        <div style={{
            width: '${currentFormat.width}px',
            height: '${currentFormat.height}px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {elements.map((el, i) => {
                const startFrame = i * 10;
                const opacity = Math.min(1, (frame - startFrame) / 20);
                const yOffset = Math.max(0, 20 - (frame - startFrame));

                return (
                    <div key={el.id} style={{
                        position: 'absolute',
                        left: el.x + 'px',
                        top: el.y + 'px',
                        fontSize: el.fontSize + 'px',
                        color: el.color,
                        opacity,
                        transform: \`translateY(\${yOffset}px)\`,
                        fontFamily: (el.fontFamily || 'Inter') + ', sans-serif'
                    }}>
                        {el.content}
                    </div>
                );
            })}
        </div>
    );
}

${componentName}.metadata = ${JSON.stringify(elements)};

return { ${componentName} };
`;

            const fileName = `${componentName}.jsx`;
            const filePath = `${folderPath}/src/library/${fileName}`;

            // Handle Overwrite/Rename logic
            if (initialName && initialName !== componentName) {
                console.log(`[Creator] Renaming detected. Deleting old file: ${initialName}.jsx`);
                try {
                    const oldPath = `${folderPath}/src/library/${initialName}.jsx`;
                    await dc.app.vault.adapter.remove(oldPath);
                } catch (e) {
                    console.warn("[Creator] Minor: Could not delete old file (might not exist)", e);
                }
            }

            await dc.app.vault.adapter.write(filePath, fileContent);
            console.log(`[Creator] Component saved to ${filePath}`);

            if (onSave) onSave();
        } catch (err) {
            console.error("[Creator] Failed to save component:", err);
            alert("Failed to save. Check console.");
        } finally {
            setIsSaving(false);
        }
    };


    // Dynamic Scaling Logic
    const canvasContainerRef = useRef(null);
    const [canvasScale, setCanvasScale] = useState(0.4);

    useEffect(() => {
        const updateScale = () => {
            if (canvasContainerRef.current) {
                const { width, height } = canvasContainerRef.current.getBoundingClientRect();
                const padding = 100;
                const availableWidth = Math.max(0, width - padding);
                const availableHeight = Math.max(0, height - padding);

                const ratioW = availableWidth / currentFormat.width;
                const ratioH = availableHeight / currentFormat.height;

                setCanvasScale(Math.min(ratioW, ratioH, 1));
            }
        };

        const observer = new ResizeObserver(updateScale);
        if (canvasContainerRef.current) observer.observe(canvasContainerRef.current);
        updateScale();

        return () => observer.disconnect();
    }, [format]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.95)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column'
        }} onClick={() => setSelectedId(null)}>
            {/* Toolbar */}
            <div style={{
                padding: '15px 25px',
                background: '#0a0a0a',
                borderBottom: '1px solid #2d2d2d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h3 style={{ margin: 0, color: '#8b5cf6', fontSize: '18px' }}>Component Creator</h3>
                    <input
                        value={componentName}
                        onChange={(e) => setComponentName(e.target.value)}
                        placeholder="Component Name"
                        style={STYLE_INPUT}
                    />
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        style={{ ...STYLE_INPUT, marginLeft: '10px' }}
                    >
                        {Object.entries(FORMATS).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={addElement}
                        style={{ ...STYLE_BUTTON, background: '#1a1a1a' }}
                    >
                        <dc.Icon icon="plus" style={{ width: '14px', marginRight: '6px' }} />
                        Add Text
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ ...STYLE_BUTTON, background: '#8b5cf6' }}
                    >
                        <dc.Icon icon="save" style={{ width: '14px', marginRight: '6px' }} />
                        {isSaving ? 'Saving...' : 'Save to Library'}
                    </button>
                    <button
                        onClick={onCancel}
                        style={{ ...STYLE_BUTTON, background: '#333' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Properties Bar (Secondary Toolbar) */}
            <div style={{
                padding: '10px 25px',
                background: '#050505',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                minHeight: '48px'
            }} onClick={e => e.stopPropagation()}>
                {selectedElement ? (
                    <>
                        <div style={STYLE_PROP_GROUP}>
                            <span style={STYLE_PROP_LABEL}>Text</span>
                            <input
                                value={selectedElement.content}
                                onChange={(e) => updateElement(selectedId, { content: e.target.value })}
                                style={STYLE_INPUT_SMALL}
                            />
                        </div>
                        <div style={STYLE_PROP_GROUP}>
                            <span style={STYLE_PROP_LABEL}>Size</span>
                            <input
                                type="number"
                                value={selectedElement.fontSize}
                                onChange={(e) => updateElement(selectedId, { fontSize: parseInt(e.target.value) || 12 })}
                                style={{ ...STYLE_INPUT_SMALL, width: '60px' }}
                            />
                        </div>
                        <div style={STYLE_PROP_GROUP}>
                            <span style={STYLE_PROP_LABEL}>Color</span>
                            <input
                                type="color"
                                value={selectedElement.color}
                                onChange={(e) => updateElement(selectedId, { color: e.target.value })}
                                style={{ ...STYLE_INPUT_SMALL, width: '40px', padding: '0', border: 'none' }}
                            />
                            <input
                                value={selectedElement.color}
                                onChange={(e) => updateElement(selectedId, { color: e.target.value })}
                                style={{ ...STYLE_INPUT_SMALL, width: '80px' }}
                            />
                        </div>
                        <div style={STYLE_PROP_GROUP}>
                            <span style={STYLE_PROP_LABEL}>Font</span>
                            <select
                                value={selectedElement.fontFamily || 'Inter'}
                                onChange={(e) => updateElement(selectedId, { fontFamily: e.target.value })}
                                style={STYLE_INPUT_SMALL}
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Outfit">Outfit</option>
                                <option value="Courier New">Monospace</option>
                            </select>
                        </div>
                        <button
                            onClick={() => {
                                setElements(elements.filter(el => el.id !== selectedId));
                                setSelectedId(null);
                            }}
                            style={{ ...STYLE_BUTTON, background: 'rgba(255,0,0,0.1)', color: '#ff4444', padding: '4px 8px' }}
                        >
                            <dc.Icon icon="trash-2" style={{ width: '12px' }} />
                        </button>
                    </>
                ) : (
                    <span style={{ color: '#444', fontSize: '12px' }}>Select an element to edit properties</span>
                )}
            </div>

            {/* Canvas Area */}
            <div
                ref={canvasContainerRef}
                style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '100px'
                }}
            >
                <div style={{
                    width: `${currentFormat.width}px`,
                    height: `${currentFormat.height}px`,
                    minWidth: `${currentFormat.width}px`,
                    minHeight: `${currentFormat.height}px`,
                    aspectRatio: currentFormat.aspect,
                    background: '#000000',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: `scale(${canvasScale})`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                    border: '2px solid #555', // Bold, visible border
                    borderRadius: '2px'
                }} onClick={e => e.stopPropagation()}>
                    {elements.map(el => (
                        <DraggableItem
                            key={el.id}
                            el={el}
                            isSelected={selectedId === el.id}
                            onSelect={setSelectedId}
                            onUpdate={updateElement}
                            canvasScale={canvasScale}
                        />
                    ))}
                </div>

                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '12px'
                }}>
                    Click to select | Drag to position | Properties bar at top
                </div>
            </div>
        </div>
    );
}

const STYLE_BUTTON = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    transition: 'opacity 0.2s',
    fontWeight: '500'
};

const STYLE_INPUT = {
    background: '#000000',
    border: '1px solid #444',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '4px',
    outline: 'none'
};

const STYLE_INPUT_SMALL = {
    background: '#111',
    border: '1px solid #333',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    outline: 'none',
    fontSize: '12px'
};

const STYLE_PROP_GROUP = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const STYLE_PROP_LABEL = {
    color: '#666',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

return { ComponentCreator };
