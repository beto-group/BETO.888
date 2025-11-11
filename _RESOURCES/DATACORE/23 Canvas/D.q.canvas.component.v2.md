

# ViewComponent

```jsx
// Get the React hooks from the 'dc' object provided by the Datacore plugin.
const { useState, useRef, useEffect, useCallback } = dc;

// --- UTILITY FUNCTIONS (For Full-Tab Logic) ---
function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }

// =================================================================================
// --- 1. THEME, & STYLING ---
// =================================================================================

const THEME = {
  background: 'var(--background-primary)',
  accent: 'var(--interactive-accent)',
  accent_dark: 'var(--interactive-accent-hover)',
  text: 'var(--text-normal)',
  text_dark: 'var(--text-muted)',
  node_bg: 'var(--background-secondary)',
  glass_bg: 'var(--background-primary-alt)',
  glow: 'var(--color-accent)',
  font: 'var(--font-interface)',
  selection: 'var(--text-selection)',
  selection_border: 'var(--interactive-accent)',
};

const CONFIG = {
  zoom: { speed: 0.005, min: 0.1, max: 10.0 },
};

const STYLES = {
  global: ``,
  viewport: {
    width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
    backgroundColor: THEME.background, color: THEME.text, fontFamily: THEME.font,
    borderRadius: '8px', cursor: 'default', outline: 'none',
  },
  world: {
    position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', transformOrigin: '0 0',
  },
  node: {
    position: 'absolute', display: 'flex', alignItems: 'center',
    borderRadius: '8px', background: THEME.node_bg, border: `1px solid var(--background-modifier-border)`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer',
    userSelect: 'none', transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
    padding: '12px 16px', boxSizing: 'border-box',
  },
  nodeSelected: {
    borderColor: THEME.accent,
    boxShadow: `0 0 0 2px ${THEME.accent}`,
  },
  nodeIcon: {
    marginRight: '12px', flexShrink: 0,
  },
  nodeContent: {
    display: 'flex', flexDirection: 'column',
  },
  nodeTitle: {
    fontSize: '14px', fontWeight: '600', color: THEME.text, margin: 0,
  },
  nodeDesc: {
    fontSize: '12px', color: THEME.text_dark, margin: '4px 0 0 0',
  },
  outputConnector: {
    position: 'absolute', top: '50%', right: '-8px', transform: 'translateY(-50%)',
    width: '16px', height: '16px', backgroundColor: THEME.accent,
    border: `2px solid var(--background-primary)`, borderRadius: '50%', cursor: 'crosshair',
    boxSizing: 'border-box',
  },
  uiContainer: {
    position: 'absolute', top: '15px', left: '15px', zIndex: 10, display: 'flex', gap: '10px',
  },
  toolbarContainer: {
    position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)',
    zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px', padding: '6px',
    backgroundColor: THEME.glass_bg, borderRadius: '12px',
    backdropFilter: 'blur(10px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: `1px solid var(--background-modifier-border)`,
  },
  button: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    height: '40px', padding: '0 16px', backgroundColor: 'var(--interactive-normal)',
    border: `1px solid var(--background-modifier-border)`, color: THEME.text, borderRadius: '8px', cursor: 'pointer',
    backdropFilter: 'blur(10px)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s, box-shadow 0.2s, border-color 0.2s',
  },
  toolButton: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '38px', height: '38px', backgroundColor: 'transparent',
    border: 'none', color: THEME.text_dark, borderRadius: '8px', cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  },
  toolButtonActive: {
    backgroundColor: THEME.accent_dark,
    color: THEME.text,
  },
  toolButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  exitIcon: {
    position: "absolute", top: "15px", right: "20px",
    userSelect: 'none', cursor: "pointer", opacity: 0.4,
    transition: "opacity 0.2s, transform 0.2s", zIndex: 20,
  },
  compactWrapper: {
    padding: "24px", boxSizing: "border-box", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "16px",
    border: `1px dashed var(--background-modifier-border)`, borderRadius: "8px",
    backgroundColor: THEME.background,
  },
  compactText: { margin: 0, color: THEME.text_dark, fontSize: "14px", fontFamily: THEME.font },
  selectionBox: {
    position: 'absolute',
    backgroundColor: THEME.selection,
    border: `1px solid ${THEME.selection_border}`,
    borderRadius: '4px',
    pointerEvents: 'none',
    zIndex: 99,
  },
  svgCanvas: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 1,
  },
  linkPath: {
    stroke: THEME.accent, strokeWidth: '2px', fill: 'none',
  },
};

// =================================================================================
// --- 2. CORE LOGIC (Custom Hooks, Icon Component & Components) ---
// =================================================================================

function Icon({ name, className = '', style = {}, size = 24 }) {
  return h(dc.Icon, { icon: name, style: { ...style, fontSize: `${size}px` }, className });
}

const Button = ({ onClick, iconName, children, className }) => h('button', {
    style: STYLES.button, onClick, className,
}, h(Icon, { name: iconName, size: 16, style: { color: THEME.accent } }), children);

const ToolButton = ({ onClick, iconName, isActive, title, disabled = false }) => h('button', {
    style: { ...STYLES.toolButton, ...(isActive ? STYLES.toolButtonActive : {}), ...(disabled ? STYLES.toolButtonDisabled : {}) },
    onClick, title, disabled,
}, h(Icon, { name: iconName, size: 20 }));

// Compact save modal
const SaveModal = ({ onSave, onClose, isDark }) => {
    const [name, setName] = useState(`canvas-${new Date().toISOString().slice(0, 10)}`);
    const [saves, setSaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const inputRef = useRef(null);
    
    useEffect(() => { inputRef.current?.focus(); }, []);
    
    const modalStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    };
    const contentStyle = {
        background: THEME.node_bg, borderRadius: '12px', padding: '24px', minWidth: '400px', maxWidth: '500px',
        border: `1px solid var(--background-modifier-border)`, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    };
    const inputStyle = {
        width: '100%', padding: '10px 12px', borderRadius: '6px', fontSize: '14px', marginTop: '8px',
        border: `1px solid var(--background-modifier-border)`, background: THEME.background, color: THEME.text,
    };
    const btnStyle = {
        padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
        transition: 'all 0.2s',
    };
    const saveItemStyle = {
        padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginTop: '4px',
        background: THEME.background, border: `1px solid var(--background-modifier-border)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    };
    
    return h('div', { style: modalStyle, onClick: onClose },
        h('div', { style: contentStyle, onClick: e => e.stopPropagation() },
            h('h3', { style: { margin: '0 0 16px 0', fontSize: '16px', color: THEME.text } }, 'Save Canvas'),
            h('input', {
                ref: inputRef, type: 'text', value: name, placeholder: 'canvas-name',
                style: inputStyle, onChange: e => setName(e.target.value),
                onKeyDown: e => e.key === 'Enter' && name.trim() && onSave(name.trim()),
            }),
            h('div', { style: { marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' } },
                h('button', { 
                    style: { ...btnStyle, background: 'var(--interactive-normal)', color: THEME.text },
                    onClick: onClose,
                }, 'Cancel'),
                h('button', {
                    style: { ...btnStyle, background: THEME.accent, color: '#fff' },
                    onClick: () => name.trim() && onSave(name.trim()),
                    disabled: !name.trim(),
                }, 'Save')
            )
        )
    );
};

// Compact load menu
const LoadMenu = ({ onLoad, onDelete, onClose, isDark }) => {
    const [saves, setSaves] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        (async () => {
            const adapter = app.vault.adapter;
            const SAVE_DIR = '.datacore/canvas-saves';
            const exists = await adapter.exists(SAVE_DIR);
            if (!exists) { setLoading(false); return; }
            const files = await adapter.list(SAVE_DIR);
            const saveList = files.files
                .filter(f => f.endsWith('.json'))
                .map(f => ({ name: f.split('/').pop().replace('.json', ''), path: f }))
                .sort((a, b) => b.name.localeCompare(a.name));
            setSaves(saveList);
            setLoading(false);
        })();
    }, []);
    
    const menuStyle = {
        position: 'absolute', top: '60px', left: '15px', zIndex: 9999,
        background: THEME.node_bg, borderRadius: '12px', padding: '16px', minWidth: '300px', maxWidth: '400px',
        border: `1px solid var(--background-modifier-border)`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        maxHeight: '400px', overflowY: 'auto',
    };
    const saveItemStyle = {
        padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginTop: '6px',
        background: THEME.background, border: `1px solid var(--background-modifier-border)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transition: 'all 0.2s',
    };
    
    return h('div', { style: menuStyle },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } },
            h('h4', { style: { margin: 0, fontSize: '14px', color: THEME.text } }, 'Load Canvas'),
            h('button', {
                style: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: THEME.text_dark },
                onClick: onClose,
            }, h(Icon, { name: 'x', size: 18 }))
        ),
        loading ? h('p', { style: { fontSize: '13px', color: THEME.text_dark, margin: 0 } }, 'Loading...') :
            saves.length === 0 ? h('p', { style: { fontSize: '13px', color: THEME.text_dark, margin: 0 } }, 'No saves found') :
                saves.map(save => h('div', {
                    key: save.name,
                    style: saveItemStyle,
                    onMouseEnter: e => { e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.background = 'var(--interactive-hover)'; },
                    onMouseLeave: e => { e.currentTarget.style.borderColor = 'var(--background-modifier-border)'; e.currentTarget.style.background = THEME.background; },
                },
                    h('span', { style: { flex: 1, cursor: 'pointer' }, onClick: () => onLoad(save.name) }, save.name),
                    h('button', {
                        style: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ef4444' },
                        onClick: (e) => { e.stopPropagation(); if (confirm(`Delete "${save.name}"?`)) onDelete(save.name); },
                    }, h(Icon, { name: 'trash-2', size: 16 }))
                ))
    );
};


function useHistory(initialState) {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const setState = (action, overwrite = false) => {
        const newState = typeof action === 'function' ? action(history[currentIndex]) : action;
        if (overwrite) {
            const newHistory = [...history]; newHistory[currentIndex] = newState;
            setHistory(newHistory);
        } else {
            const newHistory = history.slice(0, currentIndex + 1);
            setHistory([...newHistory, newState]);
            setCurrentIndex(newHistory.length);
        }
    };
    const undo = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };
    const redo = () => { if (currentIndex < history.length - 1) setCurrentIndex(currentIndex + 1); };
    return { state: history[currentIndex], setState, undo, redo, canUndo: currentIndex > 0, canRedo: currentIndex < history.length - 1 };
}

// Save/Load persistence hook
function usePersistence(state, view) {
    const SAVE_DIR = '.datacore/canvas-saves';
    
    const listSaves = useCallback(async () => {
        const adapter = app.vault.adapter;
        const exists = await adapter.exists(SAVE_DIR);
        if (!exists) return [];
        const files = await adapter.list(SAVE_DIR);
        return files.files
            .filter(f => f.endsWith('.json'))
            .map(f => ({ name: f.split('/').pop().replace('.json', ''), path: f }))
            .sort((a, b) => b.name.localeCompare(a.name));
    }, []);

    const save = useCallback(async (name) => {
        if (!name?.trim()) throw new Error('Name required');
        const adapter = app.vault.adapter;
        const exists = await adapter.exists(SAVE_DIR);
        if (!exists) await adapter.mkdir(SAVE_DIR);
        const data = { nodes: state.nodes, links: state.links, view, timestamp: Date.now() };
        await adapter.write(`${SAVE_DIR}/${name}.json`, JSON.stringify(data, null, 2));
        return name;
    }, [state, view]);

    const load = useCallback(async (name) => {
        const adapter = app.vault.adapter;
        const content = await adapter.read(`${SAVE_DIR}/${name}.json`);
        return JSON.parse(content);
    }, []);

    const remove = useCallback(async (name) => {
        const adapter = app.vault.adapter;
        await adapter.remove(`${SAVE_DIR}/${name}.json`);
    }, []);

    return { save, load, remove, listSaves };
}

function useCanvasInteractions(view, setView, nodes, setNodes, setLinks, addNodeAndLink, interactionMode) {
    const viewportRef = useRef(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [draftLink, setDraftLink] = useState(null);
    const interactionRef = useRef({
        isPanning: false, isDraggingNode: false, isDrawingLink: false,
        draggedNodeId: null, dragOffset: { x: 0, y: 0 },
        selectionStart: { x: 0, y: 0 }, didMove: false,
    });

    const screenToWorld = useCallback((screenX, screenY) => {
        const viewport = viewportRef.current; if (!viewport) return { x: 0, y: 0 };
        const rect = viewport.getBoundingClientRect();
        return { x: (screenX - rect.left - view.pan.x) / view.zoom, y: (screenY - rect.top - view.pan.y) / view.zoom };
    }, [view]);

    const onMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        const viewport = viewportRef.current; if (!viewport || e.target !== viewport) return;
        e.preventDefault();
        viewport.focus(); // <-- Focus the viewport to capture key events
        interactionRef.current.didMove = false;
        if (interactionMode === 'pan') {
            interactionRef.current.isPanning = true; viewport.style.cursor = 'grabbing';
        } else if (interactionMode === 'select') {
            const rect = viewport.getBoundingClientRect();
            const startX = e.clientX - rect.left; const startY = e.clientY - rect.top;
            setIsSelecting(true); interactionRef.current.selectionStart = { x: startX, y: startY };
            setSelectionBox({ x: startX, y: startY, width: 0, height: 0 });
        }
    }, [interactionMode]);

    const onNodeMouseDown = useCallback((e, nodeId) => {
        if (e.button !== 0) return; e.stopPropagation();
        viewportRef.current?.focus(); // <-- Focus the viewport to capture key events
        interactionRef.current.didMove = false; interactionRef.current.isDraggingNode = true;
        interactionRef.current.draggedNodeId = nodeId;
        const { x: worldMouseX, y: worldMouseY } = screenToWorld(e.clientX, e.clientY);
        const node = nodes.find(n => n.id === nodeId);
        interactionRef.current.dragOffset = { x: worldMouseX - node.x, y: worldMouseY - node.y };
    }, [screenToWorld, nodes]);

    const onConnectorMouseDown = useCallback((e, fromNodeId) => {
        e.stopPropagation(); interactionRef.current.isDrawingLink = true;
        const fromNode = nodes.find(n => n.id === fromNodeId);
        const startPos = { x: fromNode.x + fromNode.width, y: fromNode.y + fromNode.height / 2 };
        const { x: worldMouseX, y: worldMouseY } = screenToWorld(e.clientX, e.clientY);
        setDraftLink({ from: fromNodeId, startPos, endPos: { x: worldMouseX, y: worldMouseY } });
    }, [nodes, screenToWorld]);

    const onWheel = useCallback((e) => {
        e.preventDefault(); const { ctrlKey, metaKey, deltaX, deltaY, clientX, clientY } = e;
        if (ctrlKey || metaKey) {
            const prevZoom = view.zoom;
            const newZoom = Math.max(CONFIG.zoom.min, Math.min(CONFIG.zoom.max, prevZoom - deltaY * CONFIG.zoom.speed));
            const viewport = viewportRef.current; if (!viewport) return;
            const rect = viewport.getBoundingClientRect();
            const mouseX = clientX - rect.left; const mouseY = clientY - rect.top;
            setView({ zoom: newZoom, pan: { x: mouseX - ((mouseX - view.pan.x) / prevZoom) * newZoom, y: mouseY - ((mouseY - view.pan.y) / prevZoom) * newZoom } });
        } else { setView(v => ({ ...v, pan: { x: v.pan.x - deltaX, y: v.pan.y - deltaY } })); }
    }, [view, setView]);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!interactionRef.current.isPanning && !interactionRef.current.isDraggingNode && !isSelecting && !interactionRef.current.isDrawingLink) return;
            interactionRef.current.didMove = true;
            const { x: worldMouseX, y: worldMouseY } = screenToWorld(e.clientX, e.clientY);
            if (interactionRef.current.isPanning) { setView(v => ({ ...v, pan: { x: v.pan.x + e.movementX, y: v.pan.y + e.movementY } })); }
            else if (interactionRef.current.isDraggingNode) {
                const { dragOffset, draggedNodeId } = interactionRef.current;
                setNodes(currentNodes => currentNodes.map(n => n.id === draggedNodeId ? { ...n, x: worldMouseX - dragOffset.x, y: worldMouseY - dragOffset.y } : n), true);
            } else if (isSelecting) {
                const viewport = viewportRef.current; if (!viewport) return;
                const rect = viewport.getBoundingClientRect();
                const currentX = e.clientX - rect.left; const currentY = e.clientY - rect.top;
                const { x: startX, y: startY } = interactionRef.current.selectionStart;
                setSelectionBox({ x: Math.min(startX, currentX), y: Math.min(startY, currentY), width: Math.abs(currentX - startX), height: Math.abs(currentY - startY) });
            } else if (interactionRef.current.isDrawingLink) { setDraftLink(l => ({ ...l, endPos: { x: worldMouseX, y: worldMouseY } })); }
        };
        const onMouseUp = (e) => {
            const { isPanning, isDraggingNode, draggedNodeId, didMove, isDrawingLink } = interactionRef.current;
            if (isPanning && viewportRef.current) viewportRef.current.style.cursor = 'grab';
            if (isDraggingNode) { if (!didMove) { setNodes(currentNodes => currentNodes.map(n => n.id === draggedNodeId ? (e.shiftKey ? { ...n, selected: !n.selected } : { ...n, selected: true }) : (e.shiftKey ? n : { ...n, selected: false }))); } else { setNodes(currentNodes => [...currentNodes]); } }
            if (isSelecting) {
                setIsSelecting(false); const { x, y, width, height } = selectionBox;
                if (width > 5 || height > 5) {
                    const worldRect = { x: (x - view.pan.x) / view.zoom, y: (y - view.pan.y) / view.zoom, x2: (x + width - view.pan.x) / view.zoom, y2: (y + height - view.pan.y) / view.zoom };
                    setNodes(currentNodes => currentNodes.map(node => ({ ...node, selected: (node.x < worldRect.x2 && node.x + node.width > worldRect.x && node.y < worldRect.y2 && node.y + node.height > worldRect.y) })));
                } setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
            }
            if (isDrawingLink) {
                const { x: worldMouseX, y: worldMouseY } = screenToWorld(e.clientX, e.clientY);
                const toNode = nodes.find(n => worldMouseX >= n.x && worldMouseX <= n.x + n.width && worldMouseY >= n.y && worldMouseY <= n.y + n.height);
                if (toNode && toNode.id !== draftLink.from) { setLinks(ls => [...ls, { id: Date.now(), from: draftLink.from, to: toNode.id }]); }
                else if (!toNode) {
                    const newNode = { id: Date.now(), x: worldMouseX - 100, y: worldMouseY - 35, width: 200, height: 70, title: `Node ${nodes.length + 1}`, description: 'New node from link', selected: false };
                    addNodeAndLink(newNode, { id: Date.now() + 1, from: draftLink.from, to: newNode.id });
                } setDraftLink(null);
            }
            interactionRef.current.isPanning = false; interactionRef.current.isDraggingNode = false; interactionRef.current.isDrawingLink = false;
        };
        window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
        return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
    }, [view, setView, nodes, setNodes, setLinks, addNodeAndLink, isSelecting, selectionBox, draftLink, screenToWorld]);
    return { viewportRef, onMouseDown, onNodeMouseDown, onConnectorMouseDown, onWheel, selectionBox: isSelecting ? selectionBox : null, draftLink };
}

const Node = ({ data, onMouseDown, onConnectorMouseDown }) => {
    const nodeStyle = data.selected ? { ...STYLES.node, ...STYLES.nodeSelected } : STYLES.node;
    return h('div', {
        style: { ...nodeStyle, top: `${data.y}px`, left: `${data.x}px`, width: `${data.width}px`, height: `${data.height}px` },
        onMouseDown: (e) => onMouseDown(e, data.id),
        onMouseEnter: e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; e.currentTarget.style.borderColor = 'var(--interactive-accent)'; },
        onMouseLeave: e => { e.currentTarget.style.transform = 'translateY(0px)'; e.currentTarget.style.boxShadow = data.selected ? `0 0 0 2px ${THEME.accent}` : '0 2px 8px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = data.selected ? THEME.accent : 'var(--background-modifier-border)'; }
    },
        h(Icon, { name: 'box', size: 24, style: { ...STYLES.nodeIcon, color: THEME.accent } }),
        h('div', { style: STYLES.nodeContent },
            h('p', { style: STYLES.nodeTitle }, data.title),
            h('p', { style: STYLES.nodeDesc }, data.description)
        ),
        h('div', { style: STYLES.outputConnector, onMouseDown: (e) => onConnectorMouseDown(e, data.id) })
    );
};

const Link = ({ fromNode, toNode }) => {
    const startX = fromNode.x + fromNode.width, startY = fromNode.y + fromNode.height / 2;
    const endX = toNode.x, endY = toNode.y + toNode.height / 2;
    const c1X = startX + Math.abs(endX - startX) * 0.5, c1Y = startY;
    const c2X = endX - Math.abs(endX - startX) * 0.5, c2Y = endY;
    const pathData = `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;
    return h('path', { d: pathData, style: STYLES.linkPath });
};

// =================================================================================
// --- 3. MAIN CANVAS COMPONENT ---
// =================================================================================

function CanvasView() {
    const [view, setView] = useState({ pan: { x: 0, y: 0 }, zoom: 1 });
    const { state, setState, undo, redo, canUndo, canRedo } = useHistory({
        nodes: [ { id: 1, x: 100, y: 100, width: 200, height: 70, title: 'My Agent', description: 'Agent', selected: false }, { id: 2, x: 400, y: 250, width: 200, height: 70, title: 'Transform', description: 'Changes data', selected: false } ], links: [],
    });
    const { nodes, links } = state;

    const setNodes = (updater, overwrite = false) => setState(s => ({ ...s, nodes: typeof updater === 'function' ? updater(s.nodes) : updater }), overwrite);
    const setLinks = (updater, overwrite = false) => setState(s => ({ ...s, links: typeof updater === 'function' ? updater(s.links) : updater }), overwrite);
    const addNodeAndLink = (newNode, newLink) => setState(s => ({ ...s, nodes: [...s.nodes, newNode], links: [...s.links, newLink] }));

    const [isFullTab, setIsFullTab] = useState(true);
    const [interactionMode, setInteractionMode] = useState('pan');
    const [isDarkTheme, setIsDarkTheme] = useState(() => document.body.classList.contains('theme-dark'));
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadMenu, setShowLoadMenu] = useState(false);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const uniqueWrapperClass = "canvas-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;

    const { save, load, remove, listSaves } = usePersistence(state, view);

    const { viewportRef, onMouseDown, onNodeMouseDown, onConnectorMouseDown, onWheel, selectionBox, draftLink } = useCanvasInteractions(view, setView, nodes, setNodes, setLinks, addNodeAndLink, interactionMode);

    // Effect for handling node deletion with Delete/Backspace keys
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
                if (selectedIds.size > 0) {
                    e.preventDefault(); // Prevent browser back navigation
                    setState(current => {
                        const newNodes = current.nodes.filter(n => !selectedIds.has(n.id));
                        const newNodeIds = new Set(newNodes.map(n => n.id));
                        const newLinks = current.links.filter(l => newNodeIds.has(l.from) && newNodeIds.has(l.to));
                        return { nodes: newNodes, links: newLinks };
                    });
                }
            }
        };
        const viewport = viewportRef.current;
        viewport?.addEventListener('keydown', handleKeyDown);
        return () => viewport?.removeEventListener('keydown', handleKeyDown);
    }, [nodes, setState, viewportRef]);

    useEffect(() => {
        const container = containerRef.current; if (!container) return;
        if (isFullTab) {
            if (!container.parentNode) { setTimeout(() => setIsFullTab(true), 50); return; }
            const target = findNearestAncestorWithClass(container, 'workspace-leaf-content');
            if (!target) { setIsFullTab(false); return; }
            const content = findDirectChildByClass(target, 'view-content') || target;
            stateRefs.originalParent = container.parentNode; stateRefs.placeholder = document.createElement('div');
            container.parentNode.insertBefore(stateRefs.placeholder, container);
            stateRefs.parentPosition = { el: content, pos: window.getComputedStyle(content).position };
            if (stateRefs.parentPosition.pos === 'static') content.style.position = "relative";
            content.appendChild(container);
            Object.assign(container.style, { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: "9998" });
        }
        return () => {
            if (!stateRefs.originalParent) return;
            stateRefs.placeholder?.parentNode?.replaceChild(container, stateRefs.placeholder);
            if (stateRefs.parentPosition?.el) stateRefs.parentPosition.el.style.position = stateRefs.parentPosition.pos || '';
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
        };
    }, [isFullTab]);

    const addNewNode = () => {
        const viewport = viewportRef.current; if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        const worldX = (-view.pan.x + rect.width / 2) / view.zoom; const worldY = (-view.pan.y + rect.height / 2) / view.zoom;
        const newNode = { id: Date.now(), x: worldX - 100, y: worldY - 35, width: 200, height: 70, title: `Node ${nodes.length + 1}`, description: 'A new node', selected: false };
        setNodes(currentNodes => [...currentNodes, newNode]);
    };

    const resetView = () => setView({ pan: { x: 0, y: 0 }, zoom: 1 });

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    const handleSave = async (name) => {
        try {
            await save(name);
            setShowSaveModal(false);
            dc.app?.flash?.success(`Saved as "${name}"`);
        } catch (err) {
            dc.app?.flash?.error(err.message);
        }
    };

    const handleLoad = async (name) => {
        try {
            const data = await load(name);
            setState({ nodes: data.nodes, links: data.links });
            setView(data.view);
            setShowLoadMenu(false);
            dc.app?.flash?.success(`Loaded "${name}"`);
        } catch (err) {
            dc.app?.flash?.error(err.message);
        }
    };

    const handleDelete = async (name) => {
        try {
            await remove(name);
            dc.app?.flash?.success(`Deleted "${name}"`);
            setShowLoadMenu(false);
            setTimeout(() => setShowLoadMenu(true), 100);
        } catch (err) {
            dc.app?.flash?.error(err.message);
        }
    };

    const themeClass = isDarkTheme ? 'theme-dark' : 'theme-light';
    
    const hoverEffectStyle = `
        .${uniqueWrapperClass} .subtle-icon:hover { opacity: 1; transform: scale(1.05); }
        .canvas-button:hover {
             background-color: var(--interactive-hover) !important;
             box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
             border-color: var(--interactive-accent) !important;
        }
    `;

    const themeOverrides = `
        .${uniqueWrapperClass}.theme-light {
            --background-primary: #ffffff;
            --background-secondary: #f5f5f5;
            --background-primary-alt: #f0f0f0;
            --background-modifier-border: #ddd;
            --text-normal: #2e3338;
            --text-muted: #888888;
            --interactive-normal: #e8e8e8;
            --interactive-hover: #d8d8d8;
            --interactive-accent: #7c3aed;
            --interactive-accent-hover: #6d28d9;
            --color-accent: #7c3aed;
            --text-selection: rgba(124, 58, 237, 0.2);
        }
        .${uniqueWrapperClass}.theme-dark {
            --background-primary: #1e1e1e;
            --background-secondary: #2a2a2a;
            --background-primary-alt: #252525;
            --background-modifier-border: #3a3a3a;
            --text-normal: #dcddde;
            --text-muted: #888888;
            --interactive-normal: #2a2a2a;
            --interactive-hover: #363636;
            --interactive-accent: #a855f7;
            --interactive-accent-hover: #9333ea;
            --color-accent: #a855f7;
            --text-selection: rgba(168, 85, 247, 0.2);
        }
    `;

    const worldRef = (el) => { if (el) el.__nodes = nodes; };

    return h('div', { ref: containerRef, className: `${uniqueWrapperClass} ${themeClass}` },
        h('style', null, STYLES.global + hoverEffectStyle + themeOverrides),
        isFullTab ? (
            h('div', { ref: viewportRef, style: { ...STYLES.viewport, cursor: interactionMode === 'pan' ? 'grab' : 'crosshair' }, tabIndex: -1, className: uniqueWrapperClass, onMouseDown, onWheel },
                h('div', { style: { ...STYLES.exitIcon, right: '60px' }, className: "subtle-icon", title: "Toggle Theme", onClick: e => { e.stopPropagation(); toggleTheme(); } },
                    h(Icon, { name: isDarkTheme ? 'sun' : 'moon', size: 28, style: { color: THEME.text_dark } })
                ),
                h('div', { style: STYLES.exitIcon, className: "subtle-icon", title: "Exit Full Tab", onClick: e => { e.stopPropagation(); setIsFullTab(false); } },
                    h(Icon, { name: 'minimize-2', size: 32, style: { color: THEME.text_dark } })
                ),
                h('div', { style: STYLES.uiContainer },
                    h(Button, { onClick: addNewNode, iconName: 'plus', className: 'canvas-button' }, 'Add Node'),
                    h(Button, { onClick: resetView, iconName: 'rotate-cw', className: 'canvas-button' }, 'Reset View'),
                    h(Button, { onClick: () => setShowSaveModal(true), iconName: 'save', className: 'canvas-button' }, 'Save'),
                    h(Button, { onClick: () => setShowLoadMenu(!showLoadMenu), iconName: 'folder-open', className: 'canvas-button' }, 'Load')
                ),
                showLoadMenu && h(LoadMenu, { onLoad: handleLoad, onDelete: handleDelete, onClose: () => setShowLoadMenu(false), isDark: isDarkTheme }),
                h('div', { style: STYLES.toolbarContainer },
                    h(ToolButton, { onClick: () => setInteractionMode('pan'), iconName: 'move', isActive: interactionMode === 'pan', title: 'Pan Tool' }),
                    h(ToolButton, { onClick: () => setInteractionMode('select'), iconName: 'mouse-pointer-2', isActive: interactionMode === 'select', title: 'Select Tool' }),
                    h('div', { style: { width: '1px', height: '25px', backgroundColor: `${THEME.accent}44`, margin: '0 4px' } }),
                    h(ToolButton, { onClick: undo, iconName: 'undo-2', title: 'Undo', disabled: !canUndo }),
                    h(ToolButton, { onClick: redo, iconName: 'redo-2', title: 'Redo', disabled: !canRedo })
                ),
                h('svg', { style: STYLES.svgCanvas },
                    h('g', { transform: `translate(${view.pan.x}, ${view.pan.y}) scale(${view.zoom})` },
                        ...links.map(link => {
                            const fromNode = nodes.find(n => n.id === link.from); const toNode = nodes.find(n => n.id === link.to);
                            if (fromNode && toNode) return h(Link, { key: link.id, fromNode, toNode }); return null;
                        }),
                        draftLink && h('path', { d: `M ${draftLink.startPos.x} ${draftLink.startPos.y} C ${draftLink.startPos.x + 50} ${draftLink.startPos.y}, ${draftLink.endPos.x - 50} ${draftLink.endPos.y}, ${draftLink.endPos.x} ${draftLink.endPos.y}`, style: STYLES.linkPath })
                    )
                ),
                h('div', { ref: worldRef, style: { ...STYLES.world, transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})` } },
                    ...nodes.map(node => h(Node, { key: node.id, data: node, onMouseDown: onNodeMouseDown, onConnectorMouseDown: onConnectorMouseDown }))
                ),
                selectionBox && h('div', { style: { ...STYLES.selectionBox, left: `${selectionBox.x}px`, top: `${selectionBox.y}px`, width: `${selectionBox.width}px`, height: `${selectionBox.height}px` } }),
                showSaveModal && h(SaveModal, { onSave: handleSave, onClose: () => setShowSaveModal(false), isDark: isDarkTheme })
            )
        ) : (
            h('div', { style: STYLES.compactWrapper },
                h('p', { style: STYLES.compactText }, 'Canvas is in compact mode.'),
                h(Button, { onClick: () => setIsFullTab(true), iconName: 'maximize-2', className: 'canvas-button' }, 'Enter Full Tab')
            )
        )
    );
}

return { CanvasView };
```


