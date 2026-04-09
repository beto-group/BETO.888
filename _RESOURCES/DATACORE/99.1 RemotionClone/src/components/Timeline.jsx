const { useState, useEffect, useRef } = dc;

/**
 * Helper: TimelineInput
 * Simple input for editing layer start/duration values directly.
 */
const TimelineInput = ({ value, onCommit, style, ...props }) => {
    const [localValue, setLocalValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isEditing) setLocalValue(value);
    }, [value, isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        let parsed = parseInt(localValue);
        if (isNaN(parsed) || localValue.toString().trim() === '') {
            setLocalValue(value);
        } else {
            onCommit(parsed);
        }
    };

    return (
        <input
            {...props}
            value={localValue}
            type="text"
            onFocus={() => setIsEditing(true)}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
            }}
            style={style}
        />
    );
};

/**
 * Timeline Component (Redesigned V2 + Interactions)
 * Features synchronized scrolling and Clip Drag/Resize interactions.
 */
function Timeline({
    frame,
    durationInFrames,
    isPlaying,
    onToggle,
    onSeek,
    styles,
    sequence = [],
    onUpdateLayer,
    onRemoveLayer,
    onMoveLayer,
    onAddLayer,
    onInteractionStart,
    zoom = 4, // Default if not provided
    onZoomChange
}) {
    // const [zoom, setZoom] = useState(4); // LIFTED UP
    const setZoom = onZoomChange || (() => { }); // Fallback

    const tracksContainerRef = useRef(null);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

    // Interaction State
    const [dragState, setDragState] = useState(null); // { id, mode: 'move'|'resize-l'|'resize-r', startX, initialFrom, initialDuration }
    const [selectedItemId, setSelectedItemId] = useState(null);

    // Ghost Clip State for Drag Preview
    const [ghostClip, setGhostClip] = useState(null);

    const handleTimelineDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';

        const rect = tracksContainerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left + tracksContainerRef.current.scrollLeft - HEADER_WIDTH;
        const dropFrame = Math.max(0, Math.floor(relativeX / zoom));

        setGhostClip({
            from: dropFrame,
            duration: 150,
            component: 'New Clip'
        });
    };

    const handleTimelineDragLeave = (e) => {
        setGhostClip(null);
    };

    const handleTimelineDrop = (e) => {
        e.preventDefault();
        setGhostClip(null);

        const componentName = e.dataTransfer.getData('componentName');
        if (!componentName) return;

        const rect = tracksContainerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left + tracksContainerRef.current.scrollLeft - HEADER_WIDTH;
        const dropFrame = Math.max(0, Math.floor(relativeX / zoom));

        if (onAddLayer) {
            onAddLayer(componentName, dropFrame);
        }
    };

    // Constants
    const HEADER_WIDTH = 240;
    const TRACK_HEIGHT = 40;
    const RULER_HEIGHT = 30;

    // --- Interaction Handlers ---

    // 0. Keyboard Deletion & Deselection
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedItemId) return;

            // Ignore if user is typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                onRemoveLayer(selectedItemId);
                setSelectedItemId(null);
            }

            // Optional: Escape to deselect
            if (e.key === 'Escape') {
                setSelectedItemId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItemId, onRemoveLayer]);

    // 1. Playhead Dragging
    const handleTimelineMouseDown = (e) => {
        // Deselect if clicking ruler
        setSelectedItemId(null);

        const rect = tracksContainerRef.current.getBoundingClientRect();
        // Adjust for the header width (240px)
        const relativeX = e.clientX - rect.left + tracksContainerRef.current.scrollLeft - HEADER_WIDTH;

        // If clicked on header, ignore
        if (relativeX < 0) return;

        const newFrame = Math.max(0, Math.min(durationInFrames - 1, Math.floor(relativeX / zoom)));
        onSeek(newFrame);
        setIsDraggingPlayhead(true);
    };

    // 2. Clip Dragging (Move & Resize)
    const handleClipMouseDown = (e, layer, mode) => {
        e.preventDefault();
        e.stopPropagation();

        setSelectedItemId(layer.id); // Select on click/drag

        if (onInteractionStart) onInteractionStart(); // Snapshot history start
        setDragState({
            id: layer.id,
            mode: mode,
            startX: e.clientX,
            initialFrom: layer.from,
            initialDuration: layer.duration
        });
    };

    // Global Mouse Move / Up
    useEffect(() => {
        const handleGlobalIsDragging = isDraggingPlayhead || dragState;

        const handleMouseMove = (e) => {
            if (isDraggingPlayhead) {
                const rect = tracksContainerRef.current.getBoundingClientRect();
                const relativeX = e.clientX - rect.left + tracksContainerRef.current.scrollLeft - HEADER_WIDTH;
                const newFrame = Math.max(0, Math.min(durationInFrames - 1, Math.floor(relativeX / zoom)));
                onSeek(newFrame);
            }

            if (dragState) {
                const dx = e.clientX - dragState.startX;
                const frameDelta = Math.round(dx / zoom);

                if (dragState.mode === 'move') {
                    const newFrom = Math.max(0, dragState.initialFrom + frameDelta);
                    // Prevent overlapping others? (Optional, currently allowed)
                    onUpdateLayer(dragState.id, { from: newFrom }, true); // Skip history
                } else if (dragState.mode === 'resize-l') {
                    // Changing start time, keeping end time fixed -> duration changes inversely
                    // const newFrom = Math.clamp(0, dragState.initialFrom + frameDelta, dragState.initialFrom + dragState.initialDuration - 1);
                    // Math.clamp not standard, using manual logic:
                    // newFrom cannot be < 0
                    // newFrom cannot be > (initialEnd - 1)
                    const end = dragState.initialFrom + dragState.initialDuration;
                    const safeFrom = Math.max(0, Math.min(end - 1, dragState.initialFrom + frameDelta));
                    const newDuration = end - safeFrom;

                    onUpdateLayer(dragState.id, { from: safeFrom, duration: newDuration }, true); // Skip history

                } else if (dragState.mode === 'resize-r') {
                    // Changing duration only
                    const newDuration = Math.max(1, dragState.initialDuration + frameDelta);
                    onUpdateLayer(dragState.id, { duration: newDuration }, true); // Skip history
                }
            }
        };

        const handleMouseUp = () => {
            setIsDraggingPlayhead(false);
            setDragState(null);
        };

        if (handleGlobalIsDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDraggingPlayhead, dragState, zoom, durationInFrames, onUpdateLayer, onSeek]);

    // Handle Empty Area Clicks (Deselect)
    const handleEmptyAreaClick = (e) => {
        // Only deselect if not clicking a clip (handled by stopPropagation)
        // and not dragging
        if (!isDraggingPlayhead && !dragState) {
            setSelectedItemId(null);
        }
    };

    return (
        <div
            onClick={handleEmptyAreaClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                background: '#111',
                color: '#eee',
                fontSize: '11px',
                overflow: 'hidden'
            }}>
            {/* Toolbar */}
            <div style={{
                height: '40px',
                borderBottom: '1px solid #333',
                background: '#161616',
                display: 'flex',
                alignItems: 'center',
                padding: '0 15px',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggle();
                        }}
                        style={{
                            background: isPlaying ? '#ef4444' : '#8b5cf6',
                            border: 'none', borderRadius: '4px', width: '28px', height: '28px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white'
                        }}
                    >
                        <dc.Icon icon={isPlaying ? "pause" : "play"} style={{ width: '14px', pointerEvents: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace', fontSize: '13px' }}>
                        <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{Math.floor(frame)}</span>
                        <span style={{ color: '#555' }}>/</span>
                        <span style={{ color: '#888' }}>{durationInFrames}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                        onClick={() => {
                            const estimatedWidth = document.body.clientWidth - HEADER_WIDTH - 50;
                            const fitZoom = Math.max(0.05, estimatedWidth / Math.max(1, durationInFrames));
                            setZoom(fitZoom);
                        }}
                        style={{
                            background: 'transparent', border: '1px solid #333', color: '#666',
                            fontSize: '9px', padding: '2px 4px', cursor: 'pointer', borderRadius: '4px'
                        }}
                        title="Fit to View"
                    >
                        FIT
                    </button>
                    <span style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase' }}>Zoom</span>
                    <input
                        type="range" min="0" max="100" step="1"
                        value={(Math.log(Math.max(0.1, zoom) / 0.1) / Math.log(50 / 0.1)) * 100}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const minZ = 0.1;
                            const maxZ = 50;
                            const newZoom = minZ * Math.pow(maxZ / minZ, val / 100);
                            setZoom(newZoom);
                        }}
                        style={{ width: '80px', height: '4px', accentColor: '#8b5cf6' }}
                    />
                </div>
            </div>

            {/* Main Timeline Body */}
            <div
                ref={tracksContainerRef}
                onDragOver={handleTimelineDragOver}
                onDragLeave={handleTimelineDragLeave}
                onDrop={handleTimelineDrop}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0a0a0a',
                    position: 'relative'
                }}
            >
                {/* 1. RULER TRACK (Sticky Top) */}
                <div style={{
                    minWidth: '100%',
                    width: `${Math.max(durationInFrames * zoom + HEADER_WIDTH + 100, 100)}px`,
                    height: `${RULER_HEIGHT}px`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    background: '#161616',
                    borderBottom: '1px solid #333',
                    display: 'flex'
                }}>
                    {/* Ruler Content ... */}
                    <div style={{
                        width: `${HEADER_WIDTH}px`,
                        flexShrink: 0,
                        position: 'sticky',
                        left: 0,
                        zIndex: 101, // Above ruler body
                        background: '#161616',
                        borderRight: '1px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#666',
                        fontWeight: 'bold',
                        letterSpacing: '1px'
                    }}>
                        LAYERS ({sequence.length})
                    </div>

                    <div
                        onMouseDown={handleTimelineMouseDown}
                        style={{
                            flex: 1,
                            position: 'relative',
                            cursor: 'ew-resize'
                        }}
                    >
                        {/* Playhead Indicator in Ruler ... */}
                        <div style={{
                            position: 'absolute',
                            left: `${frame * zoom}px`,
                            bottom: 0,
                            width: '0',
                            height: '0',
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '6px solid #ef4444',
                            transform: 'translateX(-5px)'
                        }} />

                        {(() => {
                            const minPxPerTick = 60;
                            let tickInternal = 30;
                            const calculatedInterval = Math.ceil(minPxPerTick / zoom);
                            const niceIntervals = [1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600];
                            tickInternal = niceIntervals.find(i => i >= calculatedInterval) || calculatedInterval;

                            return Array.from({ length: Math.ceil(durationInFrames / tickInternal) }).map((_, i) => {
                                const frameTick = i * tickInternal;
                                return (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        left: `${frameTick * zoom}px`,
                                        bottom: 0,
                                        fontSize: '9px',
                                        color: '#555',
                                        borderLeft: '1px solid #444',
                                        height: '12px',
                                        paddingLeft: '4px',
                                        pointerEvents: 'none',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {frameTick}f
                                    </div>
                                );
                            });
                        })()}

                    </div>
                </div>

                {/* 2. TRACKS CONTAINER */}
                <div style={{
                    minWidth: '100%',
                    width: `${Math.max(durationInFrames * zoom + HEADER_WIDTH + 100, 100)}px`,
                    position: 'relative',
                    flex: 1
                }}>
                    <div style={{
                        position: 'absolute',
                        left: `${HEADER_WIDTH + (frame * zoom)}px`,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        background: '#ef4444',
                        zIndex: 50,
                        pointerEvents: 'none',
                        boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
                    }} />

                    {/* GHOST CLIP RENDER */}
                    {ghostClip && (
                        <div style={{
                            position: 'absolute',
                            top: `${0}px`, // Just put it at top or follow mouse Y if sophisticated
                            left: `${HEADER_WIDTH + (ghostClip.from * zoom)}px`,
                            width: `${ghostClip.duration * zoom}px`,
                            height: `${TRACK_HEIGHT}px`,
                            background: 'rgba(139, 92, 246, 0.3)',
                            border: '1px dashed #8b5cf6',
                            borderRadius: '4px',
                            zIndex: 200,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#c4b5fd',
                            fontSize: '10px'
                        }}>
                            + Add Clip
                        </div>
                    )}
                    {/* Ensure explicit height for ghost to float over if empty */}
                    {sequence.length === 0 && <div style={{ height: '40px', width: '100%' }}></div>}

                    {sequence.map((layer, index) => (
                        <div key={layer.id} style={{
                            height: `${TRACK_HEIGHT}px`,
                            display: 'flex',
                            position: 'relative',
                            background: index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                            borderBottom: '1px solid #222'
                        }}>
                            {/* Header (Sticky Left) */}
                            <div style={{
                                width: `${HEADER_WIDTH}px`,
                                flexShrink: 0,
                                position: 'sticky',
                                left: 0,
                                zIndex: 60,
                                background: '#111',
                                borderRight: '1px solid #333',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 8px',
                                justifyContent: 'space-between',
                                gap: '8px'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                    <span style={{ fontWeight: 'bold', color: '#ccc', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {layer.component}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <span style={{ fontSize: '8px', color: '#555' }}>S</span>
                                            <TimelineInput
                                                value={layer.from}
                                                onCommit={(v) => onUpdateLayer(layer.id, { from: v })}
                                                style={{ width: '28px', background: '#000', border: '1px solid #333', color: '#888', fontSize: '9px', padding: '1px', textAlign: 'center' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <span style={{ fontSize: '8px', color: '#555' }}>D</span>
                                            <TimelineInput
                                                value={layer.duration}
                                                onCommit={(v) => onUpdateLayer(layer.id, { duration: v })}
                                                style={{ width: '28px', background: '#000', border: '1px solid #333', color: '#888', fontSize: '9px', padding: '1px', textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                    {/* Move Buttons */}
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        <div onClick={() => onMoveLayer(layer.id, 'up')} style={{ cursor: 'pointer', color: '#555', fontSize: '8px', padding: '1px' }}>▲</div>
                                        <div onClick={() => onMoveLayer(layer.id, 'down')} style={{ cursor: 'pointer', color: '#555', fontSize: '8px', padding: '1px' }}>▼</div>
                                    </div>
                                    <div onClick={() => onRemoveLayer(layer.id)} style={{ cursor: 'pointer', color: '#ef4444', opacity: 0.6, fontSize: '10px' }}>✕</div>
                                </div>
                            </div>

                            {/* Track Lane Content */}
                            <div style={{
                                flex: 1,
                                position: 'relative'
                            }}>
                                {/* The Clip Block */}
                                <div
                                    onMouseDown={(e) => handleClipMouseDown(e, layer, 'move')}
                                    onClick={(e) => e.stopPropagation()} // Prevent triggering background deselect
                                    style={{
                                        position: 'absolute',
                                        left: `${layer.from * zoom}px`,
                                        width: `${layer.duration * zoom}px`,
                                        height: `${TRACK_HEIGHT - 6}px`,
                                        top: '3px',
                                        background: '#8b5cf6',
                                        borderRadius: '4px',
                                        border: selectedItemId === layer.id ? '2px solid #fff' : '1px solid #a78bfa',
                                        boxShadow: selectedItemId === layer.id ? '0 0 8px rgba(255,255,255,0.4), 0 2px 5px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.3)',
                                        opacity: dragState?.id === layer.id ? 0.8 : 0.95,
                                        zIndex: selectedItemId === layer.id ? 20 : 1, // Bring selected to front
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'visible',
                                        cursor: dragState?.mode === 'move' ? 'grabbing' : 'grab'
                                    }}
                                >
                                    {/* Left Handle */}
                                    <div
                                        onMouseDown={(e) => handleClipMouseDown(e, layer, 'resize-l')}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: '8px',
                                            cursor: 'ew-resize',
                                            zIndex: 10
                                        }}
                                    />

                                    <span style={{ fontSize: '9px', color: 'white', fontWeight: 'bold', textShadow: '0 1px 2px black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px', pointerEvents: 'none' }}>
                                        {layer.component}
                                    </span>

                                    {/* Right Handle */}
                                    <div
                                        onMouseDown={(e) => handleClipMouseDown(e, layer, 'resize-r')}
                                        style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: '8px',
                                            cursor: 'ew-resize',
                                            zIndex: 10
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {sequence.length === 0 && <div style={{ padding: '20px', color: '#555', fontStyle: 'italic' }}>No layers. Drag items from the library here, or enable a background.</div>}
                    <div style={{ height: '100px' }} />
                </div>
            </div>
        </div >
    );
}

return { Timeline };
