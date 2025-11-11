



# ViewComponent

```js
// CanvasView.component.v13.md (Main Component)
const filename = dc.resolvePath("D.q.canvas.component.v1.md"); // Used for linking to helpers within this file

// 🐛 DEBUG MODE - Set to true for verbose console logging
const DEBUG_MODE = false;
const log = (...args) => DEBUG_MODE && console.log(...args);

const { ScreenModeHelper } = await dc.require(
  dc.headerLink(filename, "ScreenModeHelper")
);

const { BasicView, FileNameModal } = await dc.require(
  dc.headerLink(filename, "BasicView")
);

const { CanvasControls, useCanvasPersistence, useCanvasInteractions, EditPanel } = await dc.require(
  dc.headerLink(filename, "CanvasControls")
);

const { Box, useBoxManagement } = await dc.require(
  dc.headerLink(filename, "Box")
);

const { useState, useRef, useEffect, useCallback, Fragment } = dc;

const ZOOM_SPEED = 0.05;
const PAN_SPEED = 0.5;

function getGridColor(type, zoom, theme) {
  let opacity;
  let baseColor;

  if (type === 'minor') {
    opacity = zoom > 0.5 ? 0.2 : 0;
    baseColor = theme.gridMinor;
  } else if (type === 'major') {
    opacity = zoom > 0.2 && zoom <= 2 ? 0.3 : 0;
    baseColor = theme.gridMajor;
  } else if (type === 'super') {
    opacity = zoom <= 0.2 || zoom > 2 ? 0.4 : 0;
    baseColor = theme.gridSuper;
  }
  return baseColor.replace('__opacity__', opacity);
}

function InfiniteCanvas({ isDarkMode: propIsDarkMode, engine, saveState }) {
  const dcInstance = engine || dc; // Use passed engine or global dc for all datacore interactions

  const [position, setPosition] = useState({ x: -200, y: -200 });
  const [zoom, setZoom] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(propIsDarkMode !== undefined ? propIsDarkMode : true);
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);

  const outerContainerRef = useRef(null);
  const interactiveCanvasRef = useRef(null);
  const addMenuRef = useRef(null);
  const loadMenuRef = useRef(null); // Ref for the load menu dropdown

  const positionRef = useRef(position); // Ref for current position, for use in callbacks
  const zoomRef = useRef(zoom);         // Ref for current zoom, for use in callbacks
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const isSpacebarDownRef = useRef(false); // Ref to track spacebar state
  const isControlDownRef = useRef(false);  // Ref to track Ctrl/Cmd state
  const isShiftDownRef = useRef(false);    // Ref to track Shift state

  const copiedBoxesRef = useRef([]); // This ref will hold the copied box data
  const lastKnownMouseScreenPosRef = useRef({ x: 0, y: 0 }); // To place pasted boxes near cursor

  const [boxes, setBoxes] = useState([
    // Ensure all default boxes have the new properties to avoid errors
    { id: 'box1', x: 200, y: 200, width: 100, height: 100, baseColor: "white", opacity: 0.7, backgroundColor: "rgb(0, 150, 255)", border: "none", label: "Sample (200,200)", type: 'text', componentName: '', autoReload: false, props: {} },
    { id: 'box2', x: 800, y: 800, width: 100, height: 100, baseColor: "white", opacity: 0.7, backgroundColor: "rgb(255, 100, 0)", border: "none", label: "Far Box (800,800)", type: 'text', componentName: '', autoReload: false, props: {} },
    { id: 'box3', x: 450, y: 450, width: 150, height: 70, baseColor: "black", opacity: 0.9, backgroundColor: "rgb(100, 200, 50)", border: "none", label: "Another Box", type: 'text', componentName: '', autoReload: false, props: {} },
    { id: 'box4', x: 100, y: 500, width: 80, height: 80, baseColor: "white", opacity: 0.6, backgroundColor: "rgb(200, 50, 150)", border: "none", label: "Circle", type: 'circle', componentName: '', autoReload: false, props: {} },
  ]);
  const [selectedBoxIds, setSelectedBoxIds] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editingBoxProps, setEditingBoxProps] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [availableSaves, setAvailableSaves] = useState([]);
  const defaultFileName = "my-canvas-data"; // Default filename for saving

  const screenHelperRef = useRef(null); // Ref for the ScreenModeHelper component
  const originalParentRefForWindow = useRef(null); // Used by ScreenModeHelper
  const originalParentRefForPiP = useRef(null);   // Used by ScreenModeHelper

  const themes = {
    light: {
      background: '#f5f5f5', border: '#333',
      gridMinor: 'rgba(200, 200, 200, __opacity__)',
      gridMajor: 'rgba(150, 150, 150, __opacity__)',
      gridSuper: 'rgba(100, 100, 100, __opacity__)',
      textColor: '#111',
      accent: '#8b5cf6',
    },
    dark: {
      background: '#0a0a0a', border: '#1a1a1a',
      gridMinor: 'rgba(30, 30, 30, __opacity__)',
      gridMajor: 'rgba(45, 45, 45, __opacity__)',
      gridSuper: 'rgba(60, 60, 60, __opacity__)',
      textColor: '#ffffff',
      accent: '#8b5cf6',
    }
  };
  const currentTheme = isDarkMode ? themes.dark : themes.light;

  const defaultContainerStyle = `
    height: 60vh; width: 100%; padding: 10px; border: 2px solid ${currentTheme.border};
    border-radius: 8px; overflow: hidden; background: ${currentTheme.background}; position: relative;
    box-shadow: 0 4px 24px rgba(0, 0, 0, ${isDarkMode ? '0.5' : '0.1'});
  `;

  const focusCanvas = useCallback(() => {
    if (interactiveCanvasRef.current && document.activeElement !== interactiveCanvasRef.current) {
        interactiveCanvasRef.current.focus();
    }
  }, []);

  const screenToWorld = useCallback((clientX, clientY) => {
    const canvas = interactiveCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const worldX = (screenX - positionRef.current.x) / zoomRef.current;
    const worldY = (screenY - positionRef.current.y) / zoomRef.current;
    return { x: worldX, y: worldY };
  }, [interactiveCanvasRef]);

  const {
    createNewBox, deleteSelectedBox, toggleEditPanel,
    handleSaveEdit, handleCancelEdit, handleChangeEditField,
    handleAddCustomProp, handleRemoveCustomProp, handleChangeCustomProp
  } = useBoxManagement({
    boxes, setBoxes, selectedBoxIds, setSelectedBoxIds,
    isEditing, setIsEditing, editingBoxProps, setEditingBoxProps,
    setShowAddMenu, screenToWorld, canvasRef: interactiveCanvasRef,
    isDarkMode, isCanvasLocked, dc: dcInstance, focusCanvas
  });

  const handleCopyObjects = useCallback(() => {
    if (isCanvasLocked) {
      if (dcInstance.app?.flash?.error) { dcInstance.app.flash.error("Canvas is locked. Cannot copy boxes."); }
      return;
    }
    if (selectedBoxIds.length > 0) {
      const selectedBoxes = boxes.filter(box => selectedBoxIds.includes(box.id));
      copiedBoxesRef.current = JSON.parse(JSON.stringify(selectedBoxes));
      if (dcInstance.app?.flash?.info) { dcInstance.app.flash.info(`Copied ${selectedBoxes.length} box(es).`); }
    } else {
      if (dcInstance.app?.flash?.info) { dcInstance.app.flash.info("No boxes selected to copy."); }
    }
  }, [boxes, selectedBoxIds, isCanvasLocked, dcInstance.app]);

  const handlePasteObjects = useCallback(() => {
    if (isCanvasLocked) {
      if (dcInstance.app?.flash?.error) { dcInstance.app.flash.error("Canvas is locked. Cannot paste boxes."); }
      return;
    }
    if (copiedBoxesRef.current.length > 0) {
      const newPastedBoxes = copiedBoxesRef.current.map(box => ({
        ...box,
        id: `box-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        x: box.x + 20, y: box.y + 20,
      }));
      setBoxes(prevBoxes => [...prevBoxes, ...newPastedBoxes]);
      setSelectedBoxIds(newPastedBoxes.map(b => b.id));
      setIsEditing(false); setEditingBoxProps(null); setShowAddMenu(false);
      focusCanvas();
      if (dcInstance.app?.flash?.success) { dcInstance.app.flash.success(`Pasted ${newPastedBoxes.length} box(es).`); }
    } else {
      if (dcInstance.app?.flash?.info) { dcInstance.app.flash.info("Nothing copied to paste."); }
    }
  }, [setBoxes, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, focusCanvas, isCanvasLocked, dcInstance.app]);

  const handleCutObjects = useCallback(() => {
    if (isCanvasLocked) {
      if (dcInstance.app?.flash?.error) { dcInstance.app.flash.error("Canvas is locked. Cannot cut boxes."); }
      return;
    }
    if (selectedBoxIds.length > 0) {
      const count = selectedBoxIds.length;
      handleCopyObjects();
      deleteSelectedBox();
      if (dcInstance.app?.flash?.success) { dcInstance.app.flash.success(`Cut ${count} box(es).`); }
    } else {
      if (dcInstance.app?.flash?.info) { dcInstance.app.flash.info("No boxes selected to cut."); }
    }
  }, [selectedBoxIds, handleCopyObjects, deleteSelectedBox, isCanvasLocked, dcInstance.app]);

  const {
    isCanvasDraggingRef, handleWheel, handleBoxMouseDown, handleHandleMouseDown, onCanvasMouseDown,
  } = useCanvasInteractions({
    canvasRef: interactiveCanvasRef, positionRef, zoomRef, setPosition, setZoom,
    boxes, setBoxes, selectedBoxIds, setSelectedBoxIds, screenToWorld,
    ZOOM_SPEED, PAN_SPEED, setIsEditing, setEditingBoxProps, setShowAddMenu,
    addMenuRef, isSpacebarDownRef, isControlDownRef, isShiftDownRef,
    setMarqueeRect, isCanvasLocked, lastKnownMouseScreenPosRef, focusCanvas,
  });

  const resetView = useCallback(() => {
    const canvas = interactiveCanvasRef.current;
    console.log('[resetView] Called - canvas:', !!canvas, 'boxes:', boxes.length);
    if (!canvas || boxes.length === 0) {
      console.log('[resetView] No canvas or no boxes, setting default position');
      setPosition({ x: -200, y: -200 }); setZoom(1);
    } else {
      const rect = canvas.getBoundingClientRect();
      let minWorldX = Infinity, minWorldY = Infinity, maxWorldX = -Infinity, maxWorldY = -Infinity;
      boxes.forEach(box => {
        minWorldX = Math.min(minWorldX, box.x); minWorldY = Math.min(minWorldY, box.y);
        maxWorldX = Math.max(maxWorldX, box.x + box.width); maxWorldY = Math.max(maxWorldY, box.y + box.height);
      });
      const worldContentWidth = maxWorldX - minWorldX; const worldContentHeight = maxWorldY - minWorldY;
      const effectiveContentWidth = worldContentWidth > 0 ? worldContentWidth : 100;
      const effectiveContentHeight = worldContentHeight > 0 ? worldContentHeight : 100;
      const newZoom = Math.max(0.1, Math.min(rect.width / (effectiveContentWidth * 1.1), rect.height / (effectiveContentHeight * 1.1), 10));
      const newPosX = (rect.width / 2) - ((minWorldX + worldContentWidth / 2) * newZoom);
      const newPosY = (rect.height / 2) - ((minWorldY + worldContentHeight / 2) * newZoom);
      console.log('[resetView] Calculated new position:', { x: newPosX, y: newPosY, zoom: newZoom });
      setPosition({ x: newPosX, y: newPosY }); setZoom(newZoom);
    }
    setIsEditing(false); setEditingBoxProps(null); setSelectedBoxIds([]); setShowAddMenu(false);
    focusCanvas();
  }, [boxes, setPosition, setZoom, setIsEditing, setEditingBoxProps, setSelectedBoxIds, setShowAddMenu, interactiveCanvasRef, focusCanvas]);

  // <<< MODIFICATION 1 of 2: Add a handler for the mode change event >>>
  // Track active mode in parent to conditionally apply styles
  // Use ref instead of state to avoid re-renders that break DOM manipulation
  const currentScreenModeRef = useRef("browser");
  
  const handleModeChange = useCallback(() => {
    // Add a small delay. This ensures the DOM has been updated with the new
    // screen mode (e.g., fullscreen, PiP) and the container dimensions are
    // stable before we calculate the optimal position and zoom.
    setTimeout(() => {
        resetView();
    }, 150); // A 150ms delay is usually sufficient for layout reflow.
  }, [resetView]);

  const {
    handleSaveCanvas, handleLoadCanvas, handleModalSave, handleModalCancel, loadSpecificCanvas,
    deleteCanvas, listSavedCanvases,
  } = useCanvasPersistence({
    boxes, setBoxes, position, setPosition, zoom, setZoom,
    isDarkMode, setIsDarkMode, isCanvasLocked, setIsCanvasLocked,
    setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu,
    setShowSaveModal, setShowLoadMenu, setAvailableSaves, dc: dcInstance, focusCanvas,
  });

  // Load available saves on mount
  useEffect(() => {
    listSavedCanvases();
  }, [listSavedCanvases]);

  useEffect(() => {
    if (saveState && typeof saveState === 'string') {
      let fileNameToLoad = saveState.trim();
      if (!fileNameToLoad.endsWith('.json')) { fileNameToLoad += '.json'; }
      console.log('[InfiniteCanvas] saveState prop received, loading canvas:', fileNameToLoad);
      loadSpecificCanvas(fileNameToLoad);
    }
  }, [saveState, loadSpecificCanvas]);

  // Initial reset view on component mount - track if we've done initial reset
  const hasInitialResetRef = useRef(false);
  
  useEffect(() => {
    // Only do initial reset once, and wait for canvas ref to be ready
    if (!hasInitialResetRef.current && interactiveCanvasRef.current) {
      const timer = setTimeout(() => {
        console.log('[InfiniteCanvas] Initial mount - calling resetView, boxes count:', boxes.length);
        hasInitialResetRef.current = true;
        resetView();
      }, 200); // Increased timeout to ensure DOM is fully ready
      return () => clearTimeout(timer);
    }
  }, [boxes.length, resetView, interactiveCanvasRef]); // Depend on boxes.length to trigger when boxes change 

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.code === 'Space') isSpacebarDownRef.current = true;
      if (e.key === 'Control' || e.key === 'Meta') isControlDownRef.current = true;
      if (e.key === 'Shift') isShiftDownRef.current = true;
    };
    const handleGlobalKeyUp = (e) => {
      if (e.code === 'Space') isSpacebarDownRef.current = false;
      if (e.key === 'Control' || e.key === 'Meta') isControlDownRef.current = false;
      if (e.key === 'Shift') isShiftDownRef.current = false;
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('keyup', handleGlobalKeyUp);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, []);
  
  const minorGridSize = 20 * zoom;
  const majorGridSize = minorGridSize * 5;
  const superGridSize = majorGridSize * 5;

  const minorGridColor = getGridColor('minor', zoom, currentTheme);
  const majorGridColor = getGridColor('major', zoom, currentTheme);
  const superGridColor = getGridColor('super', zoom, currentTheme);

  // Conditional styles: don't apply default container styles in browser mode
  // Always use minimal styles since modes handle their own positioning
  const containerStyle = {
    // Minimal styles - let screen modes handle positioning
    background: currentTheme.background,
  };

  return (
    h('div', {
      ref: outerContainerRef,
      style: containerStyle
    },
      // <<< MODIFICATION 2 of 2: Pass the new handler to ScreenModeHelper >>>
      // Always render ScreenModeHelper - it will handle waiting for the ref internally
      h(ScreenModeHelper, {
        helperRef: screenHelperRef, containerRef: outerContainerRef, defaultStyle: defaultContainerStyle,
        originalParentRefForWindow: originalParentRefForWindow, originalParentRefForPiP: originalParentRefForPiP,
        allowedScreenModes: ["browser", "window", "pip"], engine: dcInstance.app, isDarkMode: isDarkMode,
        onModeChange: handleModeChange, initialMode: "browser",
        onModeUpdate: (mode) => { currentScreenModeRef.current = mode; }, // Track mode without re-rendering
      }),

      h(BasicView, {
        setCanvasRef: interactiveCanvasRef, onCanvasMouseDown: onCanvasMouseDown, handleWheel: handleWheel,
        isSpacebarDownRef: isSpacebarDownRef, isCanvasDraggingRef: isCanvasDraggingRef, selectedBoxIds: selectedBoxIds,
        deleteSelectedBox: deleteSelectedBox, isCanvasLocked: isCanvasLocked, setSelectedBoxIds: setSelectedBoxIds,
        setIsEditing: setIsEditing, setEditingBoxProps: setEditingBoxProps, setShowAddMenu: setShowAddMenu, focusCanvas,
        onCopyObjects: handleCopyObjects, onPasteObjects: handlePasteObjects, onCutObjects: handleCutObjects,
      },
        h('div', {
          id: "grid-layer",
          style: {
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            backgroundImage: `linear-gradient(to right, ${minorGridColor} 1px, transparent 1px), linear-gradient(to bottom, ${minorGridColor} 1px, transparent 1px), linear-gradient(to right, ${majorGridColor} 1px, transparent 1px), linear-gradient(to bottom, ${majorGridColor} 1px, transparent 1px), linear-gradient(to right, ${superGridColor} 1px, transparent 1px), linear-gradient(to bottom, ${superGridColor} 1px, transparent 1px)`,
            backgroundSize: `${minorGridSize}px ${minorGridSize}px, ${minorGridSize}px ${minorGridSize}px, ${majorGridSize}px ${majorGridSize}px, ${majorGridSize}px ${majorGridSize}px, ${superGridSize}px ${superGridSize}px, ${superGridSize}px ${superGridSize}px`,
            backgroundPosition: `${position.x}px ${position.y}px`, zIndex: 1,
          }
        },
          h(CanvasControls, {
            resetView, isDarkMode, setIsDarkMode, showAddMenu, setShowAddMenu, createNewBox, deleteSelectedBox, selectedBoxIds, toggleEditPanel,
            addMenuRef, isCanvasLocked, setIsCanvasLocked, handleSaveCanvas, handleLoadCanvas, availableSaves, loadSpecificCanvas, loadMenuRef, showLoadMenu, setShowLoadMenu, focusCanvas,
            deleteCanvas,
          }),
          
          isEditing && editingBoxProps && h(EditPanel, {
            editingBoxProps, handleChangeEditField, handleSaveEdit, handleCancelEdit,
            isDarkMode, currentTheme, focusCanvas,
            onAddCustomProp: handleAddCustomProp,
            onRemoveCustomProp: handleRemoveCustomProp,
            onChangeCustomProp: handleChangeCustomProp,
          }),


          marqueeRect && h('div', {
            style: { position: 'absolute', border: '1px dashed #007bff', backgroundColor: 'rgba(0, 123, 255, 0.1)', left: `${marqueeRect.x}px`, top: `${marqueeRect.y}px`, width: `${marqueeRect.width}px`, height: `${marqueeRect.height}px`, pointerEvents: 'none', zIndex: 5, }
          }),

          h('div', {
            style: { transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", width: "1px", height: "1px" }
          },
            boxes.map(box =>
              h(Box, {
                key: box.id, box: box, isSelected: selectedBoxIds.includes(box.id), onMouseDownBox: handleBoxMouseDown, onMouseDownHandle: handleHandleMouseDown,
                globalIsDarkMode: isDarkMode, h: h, dc: dcInstance, isCanvasLocked,
              })
            )
          )
        )
      ),
      showSaveModal && h(FileNameModal, {
        onSave: handleModalSave, onCancel: handleModalCancel, initialFileName: defaultFileName, isDarkMode: isDarkMode, focusCanvas,
      })
    )
  );
}

// Export the main component
return { InfiniteCanvas };
```



# CanvasControls

```jsx
// CanvasControls.jsx

const { useState, useRef, useEffect, useCallback } = dc;

function useCanvasInteractions({
  canvasRef, positionRef, zoomRef, setPosition, setZoom,
  boxes, setBoxes, selectedBoxIds, setSelectedBoxIds, screenToWorld,
  ZOOM_SPEED, PAN_SPEED, setIsEditing, setEditingBoxProps, setShowAddMenu,
  addMenuRef, isSpacebarDownRef, isControlDownRef, isShiftDownRef,
  setMarqueeRect, isCanvasLocked, lastKnownMouseScreenPosRef, focusCanvas
}) {
  const isCanvasDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isBoxDraggingRef = useRef(false);
  const isResizingBoxRef = useRef(false);
  const resizeHandle = useRef(null);
  const initialBoxProps = useRef(null);
  const initialSelectedBoxStates = useRef([]);
  const isMarqueeSelectingRef = useRef(false);
  const marqueeStartScreenPosRef = useRef({ x: 0, y: 0 });
  const initialWorldMousePosRef = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e) => {
    // This function is correct and does not need changes.
    if (isCanvasLocked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const currentPosition = positionRef.current;
    const currentZoom = zoomRef.current;
    
    // Check for Ctrl or Command (metaKey on Mac) for zooming
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const prevZoom = currentZoom;
        const zoomFactor = e.deltaY > 0 ? 1 / (1 + ZOOM_SPEED) : (1 + ZOOM_SPEED);
        const newZoom = Math.max(0.1, Math.min(prevZoom * zoomFactor, 10));
        const worldMouseX_before = (mouseX - currentPosition.x) / prevZoom;
        const worldMouseY_before = (mouseY - currentPosition.y) / prevZoom;
        const newPosX = mouseX - (worldMouseX_before * newZoom);
        const newPosY = mouseY - (worldMouseY_before * newZoom);
        setZoom(newZoom);
        setPosition({ x: newPosX, y: newPosY });
    } else {
        let dx = e.deltaX !== 0 ? -e.deltaX * PAN_SPEED : 0;
        let dy = e.deltaY !== 0 ? -e.deltaY * PAN_SPEED : 0;
        if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            setPosition((prevPos) => ({ x: prevPos.x + dx, y: prevPos.y + dy }));
        }
    }
  }, [canvasRef, positionRef, zoomRef, setPosition, setZoom, ZOOM_SPEED, PAN_SPEED, isCanvasLocked]);

  // ========================================================================
  // >>> THE FIX IS IN THIS FUNCTION <<<
  // ========================================================================
  const handleBoxMouseDown = useCallback((e, boxId) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    // --- MODIFIED LOGIC FOR LOCKED CANVAS ---
    if (isCanvasLocked) {
        // When the canvas is locked, we want to allow ALL pointer events
        // to pass through to the datacore-component's content.
        // By simply returning here, we don't call e.stopPropagation() or
        // e.preventDefault(), and we don't execute any selection/drag logic.
        // The event is then free to be handled by the child elements
        // of the box, which is the desired behavior for an interactive component.
        if (box.type === 'datacore-component') {
            return; 
        }

        // For all other box types, prevent any interaction when locked.
        // The `pointer-events: none` style on the Box component already handles
        // this, but this is an extra safeguard.
        e.stopPropagation();
        e.preventDefault();
        return;
    }
    // --- END OF MODIFIED LOGIC ---


    // --- Original logic for an unlocked canvas (no changes needed below) ---
    e.stopPropagation();

    let newSelectedIds = [...selectedBoxIds];
    const isBoxCurrentlySelected = newSelectedIds.includes(boxId);
    
    let shouldInitDrag = true;

    if (isShiftDownRef.current) {
        newSelectedIds = isBoxCurrentlySelected ? newSelectedIds.filter(id => id !== boxId) : [...newSelectedIds, boxId];
    } else if (isControlDownRef.current) {
        newSelectedIds = isBoxCurrentlySelected ? newSelectedIds.filter(id => id !== boxId) : [...newSelectedIds, boxId];
    } else {
        // If clicking on an already selected box in a multi-selection, keep all selected (for dragging)
        // Only change selection if clicking on an unselected box
        if (!isBoxCurrentlySelected) {
            newSelectedIds = [boxId];
        }
        // If it's already selected, keep the current selection intact
    }

    setSelectedBoxIds(newSelectedIds);
    setShowAddMenu(false);

    if (newSelectedIds.length === 1) {
        const boxToEdit = boxes.find(b => b.id === newSelectedIds[0]);
        if (boxToEdit) {
            const propsArray = Object.entries(boxToEdit.props || {}).map(([key, value]) => ({ key, value: String(value) }));
            setEditingBoxProps({ ...boxToEdit, propsArray });
            setIsEditing(true);
        }
        if (box.type === 'datacore-component' && !isBoxCurrentlySelected && !isControlDownRef.current && !isShiftDownRef.current) {
            shouldInitDrag = false;
        }
    } else {
        setEditingBoxProps(null);
        setIsEditing(false);
    }

    if (shouldInitDrag && newSelectedIds.length > 0) {
        isBoxDraggingRef.current = true;
        initialSelectedBoxStates.current = boxes
            .filter(b => newSelectedIds.includes(b.id))
            .map(b => ({ ...b }));
        initialWorldMousePosRef.current = screenToWorld(e.clientX, e.clientY);
    }
    
    focusCanvas();
    e.preventDefault();
  }, [boxes, selectedBoxIds, isControlDownRef, isShiftDownRef, screenToWorld, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, isCanvasLocked, focusCanvas]);

  const handleHandleMouseDown = useCallback((e, boxId, handleType) => {
    // This function is correct and does not need changes.
    if (isCanvasLocked) return;
    e.stopPropagation(); e.preventDefault();
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    setSelectedBoxIds([boxId]);
    isResizingBoxRef.current = true;
    setIsEditing(false);
    setShowAddMenu(false);
    resizeHandle.current = handleType;
    initialBoxProps.current = { ...box };
    focusCanvas();
  }, [boxes, setSelectedBoxIds, setIsEditing, setShowAddMenu, isCanvasLocked, focusCanvas]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    lastKnownMouseScreenPosRef.current = { x: e.clientX, y: e.clientY };

    if (isCanvasDraggingRef.current) {
      const dxScreen = e.clientX - lastMousePosRef.current.x;
      const dyScreen = e.clientY - lastMousePosRef.current.y;
      setPosition((prevPos) => ({ x: prevPos.x + dxScreen, y: prevPos.y + dyScreen }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else if (isBoxDraggingRef.current && initialSelectedBoxStates.current.length > 0) {
      const { x: worldMouseX, y: worldMouseY } = screenToWorld(e.clientX, e.clientY);
      const deltaX = worldMouseX - initialWorldMousePosRef.current.x;
      const deltaY = worldMouseY - initialWorldMousePosRef.current.y;
      setBoxes(prevBoxes => {
          const newBoxesMap = new Map(prevBoxes.map(box => [box.id, { ...box }]));
          initialSelectedBoxStates.current.forEach(initialBoxState => {
              const boxToUpdate = newBoxesMap.get(initialBoxState.id);
              if (boxToUpdate) {
                  boxToUpdate.x = initialBoxState.x + deltaX;
                  boxToUpdate.y = initialBoxState.y + deltaY;
              }
          });
          return Array.from(newBoxesMap.values());
      });
    } else if (isResizingBoxRef.current && initialBoxProps.current) {
      const { x: worldMouseX, y: worldMouseY } = screenToWorld(e.clientX, e.clientY);
      const initial = initialBoxProps.current;
      const handle = resizeHandle.current;
      const minSize = 20;

      setBoxes(prevBoxes => prevBoxes.map(box => {
        if (box.id === initial.id) {
          let newX = initial.x, newY = initial.y, newWidth = initial.width, newHeight = initial.height;
          const initialRight = initial.x + initial.width;
          const initialBottom = initial.y + initial.height;

          if (handle.includes('r')) {
            newWidth = Math.max(minSize, worldMouseX - initial.x);
          }
          if (handle.includes('l')) {
            const desiredWidth = initialRight - worldMouseX;
            if (desiredWidth >= minSize) {
              newWidth = desiredWidth;
              newX = worldMouseX;
            } else {
              newWidth = minSize;
              newX = initialRight - minSize;
            }
          }

          if (handle.includes('b')) {
            newHeight = Math.max(minSize, worldMouseY - initial.y);
          }
          if (handle.includes('t')) {
            const desiredHeight = initialBottom - worldMouseY;
            if (desiredHeight >= minSize) {
              newHeight = desiredHeight;
              newY = worldMouseY;
            } else {
              newHeight = minSize;
              newY = initialBottom - minSize;
            }
          }
          
          return { ...box, x: newX, y: newY, width: newWidth, height: newHeight };
        }
        return box;
      }));
    } else if (isMarqueeSelectingRef.current) {
      const startX = marqueeStartScreenPosRef.current.x;
      const startY = marqueeStartScreenPosRef.current.y;
      const currentX = e.clientX;
      const currentY = e.clientY;
      const rect = canvas.getBoundingClientRect();
      setMarqueeRect({
        x: Math.min(startX, currentX) - rect.left,
        y: Math.min(startY, currentY) - rect.top,
        width: Math.abs(startX - currentX),
        height: Math.abs(startY - currentY),
      });

      // DYNAMIC SELECTION: Update selection in real-time as marquee changes
      const marqueeWorldStart = screenToWorld(startX, startY);
      const marqueeWorldEnd = screenToWorld(currentX, currentY);
      const marqueeMinX = Math.min(marqueeWorldStart.x, marqueeWorldEnd.x);
      const marqueeMinY = Math.min(marqueeWorldStart.y, marqueeWorldEnd.y);
      const marqueeMaxX = Math.max(marqueeWorldStart.x, marqueeWorldEnd.x);
      const marqueeMaxY = Math.max(marqueeWorldStart.y, marqueeWorldEnd.y);
      
      const boxesInMarquee = boxes.filter(box => {
        const boxMaxX = box.x + box.width, boxMaxY = box.y + box.height;
        return !(boxMaxX < marqueeMinX || box.x > marqueeMaxX || boxMaxY < marqueeMinY || box.y > marqueeMaxY);
      }).map(box => box.id);

      if (isControlDownRef.current || isShiftDownRef.current) {
        // Add to existing selection
        const combined = new Set([...selectedBoxIds, ...boxesInMarquee]);
        setSelectedBoxIds([...combined]);
      } else {
        // Replace selection
        setSelectedBoxIds(boxesInMarquee);
      }
    }
  }, [setPosition, setBoxes, screenToWorld, canvasRef, setMarqueeRect, initialWorldMousePosRef, initialBoxProps, initialSelectedBoxStates, boxes, selectedBoxIds, setSelectedBoxIds, isControlDownRef, isShiftDownRef]);

  const handleMouseUp = useCallback((event) => {
    isCanvasDraggingRef.current = false;
    isBoxDraggingRef.current = false;
    isResizingBoxRef.current = false;
    resizeHandle.current = null;
    initialBoxProps.current = null;
    initialSelectedBoxStates.current = [];
    
    if (isMarqueeSelectingRef.current) {
        isMarqueeSelectingRef.current = false;
        setMarqueeRect(null);
        // Selection is already handled dynamically in handleMouseMove, so just clean up
        focusCanvas();
    }
  }, [setMarqueeRect, focusCanvas]);

  const onCanvasMouseDown = useCallback((e) => {
    // This function is correct and does not need changes.
    const isClickOnInteractiveElement = e.target.closest('.box-container, .edit-panel, .screen-mode-button, .burger-menu-button');
    if (isCanvasLocked && !isClickOnInteractiveElement) { e.preventDefault(); e.stopPropagation(); return; }
    if (isClickOnInteractiveElement || (addMenuRef.current && addMenuRef.current.contains(e.target))) { return; }
    if (!isControlDownRef.current && !isSpacebarDownRef.current && !isShiftDownRef.current) {
        setSelectedBoxIds([]);
        setIsEditing(false);
        setEditingBoxProps(null);
        setShowAddMenu(false);
    }
    if (isSpacebarDownRef.current) {
        isCanvasDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
        isMarqueeSelectingRef.current = true;
        marqueeStartScreenPosRef.current = { x: e.clientX, y: e.clientY };
    }
    e.preventDefault();
    focusCanvas();
  }, [setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, addMenuRef, isSpacebarDownRef, isControlDownRef, isShiftDownRef, isCanvasLocked, focusCanvas]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    isCanvasDraggingRef,
    handleWheel,
    handleBoxMouseDown,
    handleHandleMouseDown,
    onCanvasMouseDown,
  };
}

// ... rest of the file (useCanvasPersistence, EditPanel, CanvasControls) remains unchanged ...
// NOTE: I am providing the full file for clarity, but only the `useCanvasInteractions` hook was modified.

function useCanvasPersistence({
  boxes, setBoxes,
  position, setPosition,
  zoom, setZoom,
  isDarkMode, setIsDarkMode,
  isCanvasLocked, setIsCanvasLocked,
  setSelectedBoxIds,
  setIsEditing,
  setEditingBoxProps,
  setShowAddMenu,
  setShowSaveModal,
  setShowLoadMenu,
  setAvailableSaves,
  dc,
  focusCanvas
}) {

  const performSave = useCallback(async (userFileName) => {
    const folderPath = ".datacore/dc.canvas";

    userFileName = userFileName.trim();
    if (!userFileName.endsWith('.json')) {
      userFileName += '.json';
    }
    const fullPath = `${folderPath}/${userFileName}`;

    const canvasData = {
      canvasState: {
        position: position,
        zoom: zoom,
        isDarkMode: isDarkMode,
        isCanvasLocked: isCanvasLocked,
      },
      boxes: boxes,
    };

    try {
        const adapter = app.vault.adapter;

        if (!adapter) {
            console.error("Obsidian app.vault.adapter is not available.");
            if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
                dc.app.flash.error("Obsidian file system API is not available. Cannot save.");
            }
            return;
        }

        const folderExists = await adapter.exists(folderPath);
        if (!folderExists) {
            await adapter.mkdir(folderPath);
        }

        await adapter.write(fullPath, JSON.stringify(canvasData, null, 2));
        if (dc.app && dc.app.flash && typeof dc.app.flash.success === 'function') {
            dc.app.flash.success(`Canvas '${userFileName}' saved successfully to ${fullPath}!`);
        } else {
            console.log(`Canvas '${userFileName}' saved successfully to ${fullPath}! (Datacore flash API not available)`);
        }
        focusCanvas(); // Focus canvas after save operation
    } catch (error) {
        console.error("Error saving canvas:", error);
        if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
            dc.app.flash.error(`Failed to save canvas: ${error.message}`);
        } else {
            console.error(`Failed to save canvas: ${error.message}. (Datacore flash API not available)`);
        }
    }
  }, [boxes, position, zoom, isDarkMode, isCanvasLocked, dc.app, focusCanvas]);

  const listSavedCanvases = useCallback(async () => {
    const folderPath = ".datacore/dc.canvas";
    const adapter = app.vault.adapter;

    if (!adapter) {
        console.error("Obsidian app.vault.adapter is not available. Cannot list files.");
        if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
            dc.app.flash.error("Obsidian file system API is not available. Cannot list files.");
        }
        setAvailableSaves([]);
        return;
    }

    try {
        const folderExists = await adapter.exists(folderPath);
        if (!folderExists) {
            setAvailableSaves([]);
            if (dc.app && dc.app.flash && typeof dc.app.flash.info === 'function') {
              dc.app.flash.info("No saved canvases folder found. Create one by saving a canvas first.");
            }
            return;
        }

        const files = await adapter.list(folderPath);
        const jsonFiles = files.files
                               .filter(f => f.endsWith('.json'))
                               .map(f => f.substring(folderPath.length + 1));

        setAvailableSaves(jsonFiles);
        if (jsonFiles.length === 0) {
            if (dc.app && dc.app.flash && typeof dc.app.flash.info === 'function') {
              dc.app.flash.info("No saved canvases found in .datacore/dc.canvas.");
            }
        }
    } catch (error) {
        console.error("Error listing canvas files:", error);
        if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
            dc.app.flash.error(`Failed to list saved canvases: ${error.message}`);
        }
        setAvailableSaves([]);
    }
  }, [setAvailableSaves, dc.app]);

  const loadSpecificCanvas = useCallback(async (filename) => {
    console.log('[loadSpecificCanvas] Called with filename:', filename);
    const folderPath = ".datacore/dc.canvas";
    const fullPath = `${folderPath}/${filename}`;
    console.log('[loadSpecificCanvas] Attempting to load from path:', fullPath);
    const adapter = app.vault.adapter;

    if (!adapter) {
        console.error("Obsidian app.vault.adapter is not available. Cannot load file.");
        if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
            dc.app.flash.error("Obsidian file system API is not available. Cannot load file.");
        }
        return;
    }

    try {
        const fileContent = await adapter.read(fullPath);
        console.log('[loadSpecificCanvas] File read successfully, parsing JSON...');
        const loadedData = JSON.parse(fileContent);
        console.log('[loadSpecificCanvas] Data loaded:', loadedData);

        if (loadedData.canvasState) {
            setPosition(loadedData.canvasState.position);
            setZoom(loadedData.canvasState.zoom);
            setIsDarkMode(loadedData.canvasState.isDarkMode ?? true);
            setIsCanvasLocked(loadedData.canvasState.isCanvasLocked ?? false);
        }
        if (loadedData.boxes) {
            setBoxes(loadedData.boxes);
            console.log('[loadSpecificCanvas] Loaded', loadedData.boxes.length, 'boxes');
        }

        setSelectedBoxIds([]);
        setIsEditing(false);
        setEditingBoxProps(null);
        setShowAddMenu(false);
        focusCanvas();

        if (dc.app && dc.app.flash && typeof dc.app.flash.success === 'function') {
            dc.app.flash.success(`Canvas '${filename}' loaded successfully!`);
        }
        console.log('[loadSpecificCanvas] Load complete');
    } catch (error) {
        console.error(`[loadSpecificCanvas] Error loading canvas '${filename}':`, error);
        if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
            dc.app.flash.error(`Failed to load canvas '${filename}': ${error.message}`);
        }
    }
  }, [setBoxes, setPosition, setZoom, setIsDarkMode, setIsCanvasLocked, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, dc.app, focusCanvas]);

  const handleModalSave = useCallback(async (filename) => {
    setShowSaveModal(false);
    await performSave(filename);
    await listSavedCanvases(); // Refresh the list after saving
  }, [performSave, setShowSaveModal, listSavedCanvases]);

  const handleModalCancel = useCallback(() => {
    setShowSaveModal(false);
    if (dc.app && dc.app.flash && typeof dc.app.flash.info === 'function') {
      dc.app.flash.info("Canvas save cancelled.");
    }
    focusCanvas();
  }, [setShowSaveModal, dc.app, focusCanvas]);

  const handleSaveCanvas = useCallback(() => {
    if (isCanvasLocked) {
      if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
        dc.app.flash.error("Canvas is locked. Cannot save.");
      }
      return;
    }
    if (boxes.length === 0) {
      if (dc.app && dc.app.flash && typeof dc.app.flash.info === 'function') {
        dc.app.flash.info("Nothing to save! Add some boxes first.");
      }
      return;
    }
    setShowSaveModal(true);
  }, [isCanvasLocked, boxes, setShowSaveModal, dc.app]);

  const handleLoadCanvas = useCallback(async () => {
    await listSavedCanvases();
    setShowLoadMenu(true);
  }, [listSavedCanvases, setShowLoadMenu]);

  const deleteCanvas = useCallback(async (filename) => {
    const folderPath = ".datacore/dc.canvas";
    const fullPath = `${folderPath}/${filename}`;
    const adapter = app.vault.adapter;

    if (!adapter) {
      console.error("Obsidian app.vault.adapter is not available.");
      if (dc.app?.flash?.error) {
        dc.app.flash.error("Cannot delete canvas - file system not available.");
      }
      return;
    }

    try {
      await adapter.remove(fullPath);
      if (dc.app?.flash?.success) {
        dc.app.flash.success(`Canvas '${filename}' deleted successfully!`);
      }
      // Refresh the list
      await listSavedCanvases();
    } catch (error) {
      console.error("Error deleting canvas:", error);
      if (dc.app?.flash?.error) {
        dc.app.flash.error(`Failed to delete canvas: ${error.message}`);
      }
    }
  }, [dc.app, listSavedCanvases]);

  return {
    handleSaveCanvas, handleLoadCanvas,
    handleModalSave, handleModalCancel, loadSpecificCanvas,
    deleteCanvas, listSavedCanvases,
  };
}

function EditPanel({ 
    editingBoxProps, handleChangeEditField, handleSaveEdit, handleCancelEdit, 
    isDarkMode, currentTheme, focusCanvas,
    onAddCustomProp, onRemoveCustomProp, onChangeCustomProp
}) {
  if (!editingBoxProps) return null;

  // Define theme first before any other operations
  const theme = isDarkMode ? 
    { background: '#0a0a0a', border: '#1a1a1a', textColor: '#ffffff', inputBackground: 'rgba(0, 0, 0, 0.3)' } : 
    { background: '#f5f5f5', border: '#333', textColor: '#111', inputBackground: 'rgba(255, 255, 255, 0.5)' };
  
  // Use the local theme instead of currentTheme prop
  const safeTheme = currentTheme || theme;

  // State for available component files
  const [availableComponents, setAvailableComponents] = useState([]);
  
  // Fetch available components on mount
  useEffect(() => {
    const allFiles = app.vault.getMarkdownFiles();
    const componentFiles = allFiles.filter(file => 
      file.path.includes('_RESOURCES/DATACORE') &&
      file.path.endsWith('.component.md')
    );
    
    // Parse file info - extract component name
    const components = componentFiles.map(file => {
      const fileName = file.name.replace('.md', '');
      // Extract parts: D.q.name.component
      const parts = fileName.split('.');
      const componentName = parts[2] || parts[1]; // Get the name part
      
      return {
        displayName: componentName.charAt(0).toUpperCase() + componentName.slice(1),
        fileName: fileName, // Full filename without .md
        path: file.path
      };
    });
    
    setAvailableComponents(components.sort((a, b) => a.displayName.localeCompare(b.displayName)));
  }, []);
  
  // Handler to load a predefined component
  const handleQuickLoadComponent = (fileName) => {
    handleChangeEditField({ target: { name: 'componentName', value: fileName } });
  };

  // Helper to convert color to hex for color picker
  const toHexColor = (color) => {
    if (!color) return '#000000';
    if (color.startsWith('#')) return color.length === 7 ? color : '#000000';
    // For rgba/rgb/named colors, return black as default (user can pick from color picker)
    return '#000000';
  };

  // Icon helper function
  const extractDataUri = (iconString) => {
    if (!iconString) return '';
    const match = iconString.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? match[1] : iconString;
  };
  const icon = (src, alt) => {
    if (!src) return null;
    return h('img', { src: extractDataUri(src), alt: alt, style: { width: '18px', height: '18px' } });
  };

  // State for panel position (draggable)
  const [panelPosition, setPanelPosition] = useState(() => {
    const saved = localStorage.getItem('canvas-edit-panel-position');
    return saved ? JSON.parse(saved) : { top: 80, right: 20 };
  });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('canvas-edit-panel-position', JSON.stringify(panelPosition));
  }, [panelPosition]);

  const handlePanelWheel = (e) => {
    e.stopPropagation();
  };

  const handleMouseDown = (e) => {
    // Only drag from the header
    if (!e.target.closest('.edit-panel-header')) return;
    
    setIsDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!panelRef.current) return;
      
      const container = panelRef.current.parentElement;
      const containerRect = container.getBoundingClientRect();
      
      // Calculate new position
      let newLeft = e.clientX - containerRect.left - dragOffset.x;
      let newTop = e.clientY - containerRect.top - dragOffset.y;
      
      // Constrain to container bounds
      const panelWidth = panelRef.current.offsetWidth;
      const panelHeight = panelRef.current.offsetHeight;
      
      newLeft = Math.max(0, Math.min(newLeft, containerRect.width - panelWidth));
      newTop = Math.max(0, Math.min(newTop, containerRect.height - panelHeight));
      
      setPanelPosition({ 
        top: newTop, 
        left: newLeft,
        right: undefined // Clear right when using left
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const inputStyle = {
    padding: '10px 12px', 
    borderRadius: '6px',
    border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(51, 51, 51, 0.3)'}`,
    background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
    color: isDarkMode ? '#ffffff' : '#111',
    fontSize: '13px',
    transition: 'border-color 0.2s ease, background 0.2s ease',
  };
  const labelStyle = { 
    fontSize: '13px', 
    margin: 0, 
    cursor: 'default',
    fontWeight: '500',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
  };
  const fieldContainerStyle = { display: 'flex', flexDirection: 'column', gap: '6px' };
  const buttonGroupStyle = { display: 'flex', justifyContent: 'flex-end', gap: '10px' };
  const buttonStyle = {
    padding: '10px 18px', 
    borderRadius: '8px', 
    border: 'none',
    color: 'white', 
    cursor: 'pointer', 
    transition: 'all 0.2s ease',
    fontWeight: '500',
    fontSize: '14px',
  };

  return (
    h('div', {
      ref: panelRef,
      className: "edit-panel",
      onWheel: handlePanelWheel,
      onMouseDown: handleMouseDown,
      style: {
        position: 'absolute',
        top: panelPosition.top !== undefined ? `${panelPosition.top}px` : undefined,
        right: panelPosition.right !== undefined ? `${panelPosition.right}px` : undefined,
        left: panelPosition.left !== undefined ? `${panelPosition.left}px` : undefined,
        background: isDarkMode ? 'rgba(10, 10, 10, 0.95)' : 'rgba(245, 245, 245, 0.95)',
        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(51, 51, 51, 0.3)'}`,
        borderRadius: '12px',
        zIndex: 11,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        color: safeTheme.textColor,
        width: '300px',
        maxHeight: 'calc(100% - 40px)', 
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(20px)',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none',
      }
    },
      h('h3', { 
        className: 'edit-panel-header',
        style: { 
            margin: '0', 
            padding: '16px 18px', 
            fontSize: '16px', 
            color: safeTheme.textColor, 
            flexShrink: 0,
            borderBottom: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(51, 51, 51, 0.2)'}`,
            fontWeight: '600',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        } 
      }, [
        h(dc.Icon, { icon: 'grip-horizontal', style: { width: '18px', height: '18px' } }),
        "Edit Box Properties"
      ]),

      h('div', {
          style: {
              overflowY: 'auto',
              flex: '1 1 auto',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
          }
      },
        (editingBoxProps.type === 'text' ||
         editingBoxProps.type === 'pure-text' ||
         editingBoxProps.type === 'datacore-component' ||
         editingBoxProps.type === 'circle' ||
         editingBoxProps.type === 'triangle'
        ) &&
        h('div', { style: fieldContainerStyle },
          h('label', { htmlFor: "edit-label", style: labelStyle }, "Label:"),
          h('input', {
            id: "edit-label", type: "text", name: "label", value: String(editingBoxProps.label || ''),
            onChange: handleChangeEditField, style: inputStyle
          })
        ),
  
        editingBoxProps.type === 'datacore-component' && h(Fragment, null,
          h('div', { style: fieldContainerStyle },
            h('label', { htmlFor: "edit-componentName", style: labelStyle }, "Component Name:"),
            h('input', {
              id: "edit-componentName", type: "text", name: "componentName", value: editingBoxProps.componentName || '',
              onChange: handleChangeEditField, placeholder: "e.g., D.q.world888.component", style: inputStyle
            }),
            h('div', { style: { fontSize: '11px', color: isDarkMode ? '#888' : '#666', marginTop: '4px', fontStyle: 'italic' } },
              "Enter the filename (without .md) - component auto-loads"
            )
          ),
          
          // Quick Load Predefined Components
          availableComponents.length > 0 && h('div', { style: { ...fieldContainerStyle, paddingTop: '8px' } },
            h('label', { style: { ...labelStyle, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' } },
              h(dc.Icon, { icon: 'zap', style: { fontSize: '12px', color: '#8b5cf6' } }),
              "Quick Load:"
            ),
            h('div', { 
              onWheel: (e) => e.stopPropagation(),
              style: { 
                display: 'flex', 
                gap: '4px', 
                flexWrap: 'wrap',
                maxHeight: '120px',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '6px',
                background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '6px',
                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'}`,
              } 
            },
              availableComponents.map((component, idx) => (
                h('button', {
                  key: idx,
                  type: 'button',
                  onClick: () => handleQuickLoadComponent(component.fileName),
                  style: {
                    padding: '6px 10px',
                    background: editingBoxProps.componentName === component.fileName 
                      ? 'rgba(139, 92, 246, 0.25)' 
                      : isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                    border: editingBoxProps.componentName === component.fileName
                      ? '1px solid rgba(139, 92, 246, 0.6)'
                      : `1px solid ${isDarkMode ? 'rgba(80, 80, 80, 0.3)' : 'rgba(51, 51, 51, 0.2)'}`,
                    borderRadius: '4px',
                    color: isDarkMode ? '#ffffff' : '#111',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: editingBoxProps.componentName === component.fileName ? '600' : '500',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '28px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  },
                  onMouseEnter: (e) => {
                    if (editingBoxProps.componentName !== component.fileName) {
                      e.target.style.background = 'rgba(139, 92, 246, 0.15)';
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                    }
                  },
                  onMouseLeave: (e) => {
                    if (editingBoxProps.componentName !== component.fileName) {
                      e.target.style.background = isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.6)';
                      e.target.style.borderColor = isDarkMode ? 'rgba(80, 80, 80, 0.3)' : 'rgba(51, 51, 51, 0.2)';
                    }
                  },
                  title: component.path
                },
                  editingBoxProps.componentName === component.fileName && h(dc.Icon, { icon: 'check', style: { fontSize: '10px' } }),
                  component.displayName
                )
              ))
            )
          ),
          
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderRadius: '4px' } },
              h('input', {
                  type: 'checkbox', id: 'edit-autoReload', name: 'autoReload', checked: !!editingBoxProps.autoReload,
                  onChange: handleChangeEditField, style: { width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }
              }),
              h('label', { htmlFor: 'edit-autoReload', style: { ...labelStyle, cursor: 'pointer', flex: 1, userSelect: 'none' } }, 'Enable Quick Reload')
          ),
  
          h('div', { style: { borderTop: `1px solid ${safeTheme.border}`, paddingTop: '15px' } },
              h('h4', { style: { margin: '0 0 10px 0', fontSize: '16px' } }, "Custom Properties"),
              (editingBoxProps.propsArray || []).map((prop, index) => (
                  h('div', { key: index, style: { display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '8px' } },
                      h('input', { type: 'text', placeholder: 'Prop Name', value: prop.key, onChange: (e) => onChangeCustomProp(index, 'key', e.target.value), style: { ...inputStyle, flex: 1 } }),
                      h('input', { type: 'text', placeholder: 'Prop Value', value: prop.value, onChange: (e) => onChangeCustomProp(index, 'value', e.target.value), style: { ...inputStyle, flex: 1 } }),
                      h('button', {
                          title: 'Remove Property', onClick: () => onRemoveCustomProp(index),
                          style: {
                              padding: '0', width: '30px', height: '30px', border: 'none', background: '#dc3545', color: 'white', borderRadius: '4px',
                              cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }
                      }, '×')
                  )
              )),
              h('button', { onClick: onAddCustomProp, style: { ...buttonStyle, background: '#28a745', width: '100%', marginTop: '5px' } }, "Add Property")
          )
        ),
  
        (editingBoxProps.type === 'pure-text' || editingBoxProps.type === 'datacore-component' || editingBoxProps.type === 'triangle') &&
        h('div', { style: fieldContainerStyle },
          h('label', { htmlFor: "edit-baseColor", style: labelStyle }, editingBoxProps.type === 'pure-text' ? 'Text Color:' : 'Shape/Border Color:'),
          h('div', { style: { display: 'flex', gap: '5px', alignItems: 'center' } },
            h('input', { 
              id: "edit-baseColor", 
              type: "text", 
              name: "baseColor", 
              value: editingBoxProps.baseColor, 
              onChange: handleChangeEditField, 
              style: { ...inputStyle, flex: 1 }, 
              placeholder: 'e.g., #ffffff or rgba(...)' 
            }),
            h('input', {
              type: "color",
              value: toHexColor(editingBoxProps.baseColor),
              onChange: (e) => handleChangeEditField({ target: { name: 'baseColor', value: e.target.value } }),
              style: {
                width: '50px',
                height: '36px',
                border: `2px solid ${isDarkMode ? '#444' : '#ccc'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                flexShrink: 0,
              },
              title: 'Pick color'
            })
          )
        ),
        (editingBoxProps.type === 'text' || editingBoxProps.type === 'circle') &&
        h('div', { style: fieldContainerStyle },
          h('label', { htmlFor: "edit-textColor", style: labelStyle }, 'Text Color:'),
          h('div', { style: { display: 'flex', gap: '5px', alignItems: 'center' } },
            h('input', { 
              id: "edit-textColor", 
              type: "text", 
              name: "baseColor", 
              value: editingBoxProps.baseColor, 
              onChange: handleChangeEditField, 
              style: { ...inputStyle, flex: 1 }, 
              placeholder: 'e.g., #ffffff or rgba(...)' 
            }),
            h('input', {
              type: "color",
              value: toHexColor(editingBoxProps.baseColor),
              onChange: (e) => handleChangeEditField({ target: { name: 'baseColor', value: e.target.value } }),
              style: {
                width: '50px',
                height: '36px',
                border: `2px solid ${isDarkMode ? '#444' : '#ccc'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                flexShrink: 0,
              },
              title: 'Pick text color'
            })
          )
        ),
        (editingBoxProps.type === 'text' || editingBoxProps.type === 'circle' || editingBoxProps.type === 'datacore-component') &&
        h('div', { style: fieldContainerStyle },
          h('label', { htmlFor: "edit-backgroundColor", style: labelStyle }, "Background Color:"),
          h('div', { style: { display: 'flex', gap: '5px', alignItems: 'center' } },
            h('input', { 
              id: "edit-backgroundColor", 
              type: "text", 
              name: "backgroundColor", 
              value: editingBoxProps.backgroundColor, 
              onChange: handleChangeEditField, 
              style: { ...inputStyle, flex: 1 }, 
              placeholder: 'e.g., rgba(50,50,50,0.7)' 
            }),
            h('input', {
              type: "color",
              value: toHexColor(editingBoxProps.backgroundColor),
              onChange: (e) => handleChangeEditField({ target: { name: 'backgroundColor', value: e.target.value } }),
              style: {
                width: '50px',
                height: '36px',
                border: `2px solid ${isDarkMode ? '#444' : '#ccc'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                flexShrink: 0,
              },
              title: 'Pick color'
            })
          )
        ),
  
        h('div', { style: { display: 'flex', gap: '10px', width: '100%' } },
          h('div', { style: { ...fieldContainerStyle, flex: 1 } },
            h('label', { htmlFor: 'edit-width', style: labelStyle }, 'Width:'),
            h('input', { id: 'edit-width', type: 'number', name: 'width', value: editingBoxProps.width, onChange: handleChangeEditField, style: { ...inputStyle, width: '100%', boxSizing: 'border-box' } })
          ),
          h('div', { style: { ...fieldContainerStyle, flex: 1 } },
            h('label', { htmlFor: 'edit-height', style: labelStyle }, 'Height:'),
            h('input', { id: 'edit-height', type: 'number', name: 'height', value: editingBoxProps.height, onChange: handleChangeEditField, style: { ...inputStyle, width: '100%', boxSizing: 'border-box' } })
          )
        ),
  
        h('div', { style: fieldContainerStyle },
          h('label', { htmlFor: "edit-opacity", style: labelStyle }, `Opacity: ${Math.round(editingBoxProps.opacity * 100)}%`),
          h('input', { id: "edit-opacity", type: "range", name: "opacity", min: "0", max: "1", step: "0.01", value: editingBoxProps.opacity, onChange: handleChangeEditField, style: { width: '100%', accentColor: '#007bff' } })
        )
      ),

      h('div', {
        style: {
            padding: '15px',
            flexShrink: 0,
            borderTop: `1px solid ${currentTheme.border}`,
            background: currentTheme.background
        }
      },
        h('div', { style: buttonGroupStyle },
          h('button', { 
            onClick: () => { handleCancelEdit(); focusCanvas(); }, 
            style: { ...buttonStyle, background: isDarkMode ? 'rgba(100, 100, 100, 0.5)' : 'rgba(150, 150, 150, 0.5)' },
            onMouseEnter: (e) => e.target.style.background = isDarkMode ? 'rgba(120, 120, 120, 0.6)' : 'rgba(130, 130, 130, 0.6)',
            onMouseLeave: (e) => e.target.style.background = isDarkMode ? 'rgba(100, 100, 100, 0.5)' : 'rgba(150, 150, 150, 0.5)',
          }, "Cancel"),
          h('button', { 
            onClick: () => { handleSaveEdit(); focusCanvas(); }, 
            style: { ...buttonStyle, background: 'rgba(139, 92, 246, 0.8)' },
            onMouseEnter: (e) => e.target.style.background = 'rgba(139, 92, 246, 1)',
            onMouseLeave: (e) => e.target.style.background = 'rgba(139, 92, 246, 0.8)',
          }, "Save")
        )
      )
    )
  );
}

function CanvasControls({
  resetView, isDarkMode, setIsDarkMode, showAddMenu, setShowAddMenu,
  createNewBox, deleteSelectedBox, selectedBoxIds, toggleEditPanel,
  addMenuRef, isCanvasLocked,
  setIsCanvasLocked, handleSaveCanvas, handleLoadCanvas, availableSaves,
  loadSpecificCanvas, loadMenuRef, showLoadMenu, setShowLoadMenu, focusCanvas,
  deleteCanvas
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'shapes' | 'saves' | null
  const burgerMenuContainerRef = useRef(null);

  const currentTheme = isDarkMode ? 
    { background: '#0a0a0a', border: '#8b5cf6', textColor: '#ffffff', hover: 'rgba(139, 92, 246, 0.15)' } : 
    { background: '#f5f5f5', border: '#8b5cf6', textColor: '#111', hover: 'rgba(139, 92, 246, 0.1)' };

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
    setActiveSection(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickOnButton = event.target.closest('.burger-menu-button');
      const isClickInsideMenu = burgerMenuContainerRef.current && burgerMenuContainerRef.current.contains(event.target);

      if (isMenuOpen && !isClickOnButton && !isClickInsideMenu) {
        setIsMenuOpen(false);
        setActiveSection(null);
        focusCanvas();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, focusCanvas]);

  const handleSelectLoadedCanvas = useCallback((filename) => {
    loadSpecificCanvas(filename);
    setIsMenuOpen(false);
    setActiveSection(null);
    focusCanvas();
  }, [loadSpecificCanvas, focusCanvas]);

  const menuItemStyle = {
    padding: '12px 20px',
    background: 'none',
    border: 'none',
    color: currentTheme.textColor,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    borderLeft: '2px solid transparent',
  };

  const sectionHeaderStyle = {
    padding: '16px 20px 8px 20px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#8b5cf6',
    opacity: 0.6,
    marginTop: '8px',
  };

  return h('div', {
    style: {
      position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px', zIndex: 10
    }
  },
    h('button', {
      title: "Menu", 
      className: "burger-menu-button",
      style: {
        padding: "0",
        background: isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
        border: `2px solid ${isMenuOpen ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)'}`,
        borderRadius: "12px",
        cursor: "pointer",
        width: "48px",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        transition: "all 0.3s ease",
        boxShadow: isMenuOpen ? '0 8px 24px rgba(139, 92, 246, 0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
        backdropFilter: "blur(12px)",
        transform: isMenuOpen ? 'scale(1.05)' : 'scale(1)',
      },
      onClick: toggleMenu
    }, h(dc.Icon, { icon: 'menu', style: { fontSize: '18px' } })),

    isMenuOpen && h('div', {
      ref: burgerMenuContainerRef,
      style: {
        position: 'absolute',
        top: '0',
        left: '60px',
        background: isDarkMode ? 'rgba(15, 15, 15, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
        borderRadius: '14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        zIndex: 12,
        display: 'flex',
        flexDirection: 'column',
        minWidth: '260px',
        maxWidth: '300px',
        maxHeight: '80vh',
        color: currentTheme.textColor,
        backdropFilter: 'blur(40px)',
        overflow: 'hidden',
      }
    },
      // Main Actions Section
      h('div', { style: { padding: '12px 0 8px 0' } },
        h('button', {
          style: menuItemStyle,
          onMouseEnter: (e) => {
            e.target.style.background = currentTheme.hover;
            e.target.style.borderLeft = '2px solid #8b5cf6';
          },
          onMouseLeave: (e) => {
            e.target.style.background = 'none';
            e.target.style.borderLeft = '2px solid transparent';
          },
          onClick: () => { resetView(); setIsMenuOpen(false); focusCanvas(); }
        }, h(dc.Icon, { icon: 'home', style: { fontSize: '16px' } }), "Reset View"),

        h('button', {
          style: menuItemStyle,
          onMouseEnter: (e) => {
            e.target.style.background = currentTheme.hover;
            e.target.style.borderLeft = '2px solid #8b5cf6';
          },
          onMouseLeave: (e) => {
            e.target.style.background = 'none';
            e.target.style.borderLeft = '2px solid transparent';
          },
          onClick: () => { setIsDarkMode(prev => !prev); }
        }, h(dc.Icon, { icon: isDarkMode ? 'sun' : 'moon', style: { fontSize: '16px' } }), isDarkMode ? "Light Mode" : "Dark Mode"),

        h('button', {
          style: menuItemStyle,
          onMouseEnter: (e) => {
            e.target.style.background = currentTheme.hover;
            e.target.style.borderLeft = '2px solid #8b5cf6';
          },
          onMouseLeave: (e) => {
            e.target.style.background = 'none';
            e.target.style.borderLeft = '2px solid transparent';
          },
          onClick: () => { setIsCanvasLocked(prev => !prev); }
        }, h(dc.Icon, { icon: isCanvasLocked ? 'unlock' : 'lock', style: { fontSize: '16px' } }), isCanvasLocked ? "Unlock Canvas" : "Lock Canvas")
      ),

      // Modify Shape Section (Add, Edit, Delete)
      h('div', { style: sectionHeaderStyle }, "Modify Shape"),
      h('button', {
        style: {
          ...menuItemStyle,
          opacity: isCanvasLocked ? 0.4 : 1,
          cursor: isCanvasLocked ? 'not-allowed' : 'pointer',
        },
        disabled: isCanvasLocked,
        onMouseEnter: (e) => !isCanvasLocked && (e.target.style.background = currentTheme.hover, e.target.style.borderLeft = '2px solid #8b5cf6'),
        onMouseLeave: (e) => (e.target.style.background = 'none', e.target.style.borderLeft = '2px solid transparent'),
        onClick: () => !isCanvasLocked && setActiveSection(activeSection === 'shapes' ? null : 'shapes')
      }, h(dc.Icon, { icon: 'plus', style: { fontSize: '16px' } }), activeSection === 'shapes' ? "Close Options ▲" : "Show Options ▼"),

      activeSection === 'shapes' && h('div', {
        style: {
          background: isDarkMode ? 'rgba(139, 92, 246, 0.03)' : 'rgba(139, 92, 246, 0.05)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }
      },
        // Selection Actions (Edit/Delete) - shown when boxes are selected
        selectedBoxIds.length > 0 && h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          h('div', { style: { fontSize: '10px', fontWeight: '700', color: '#8b5cf6', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.6 } }, `Selection (${selectedBoxIds.length})`),
          
          h('button', {
            style: {
              padding: '10px 12px',
              background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
              border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
              borderRadius: '8px',
              color: currentTheme.textColor,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            },
            onMouseEnter: (e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.15)';
              e.target.style.borderColor = '#ef4444';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
            },
            onMouseLeave: (e) => {
              e.target.style.background = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
              e.target.style.borderColor = isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            },
            onClick: () => { deleteSelectedBox(); setActiveSection(null); setIsMenuOpen(false); focusCanvas(); }
          }, h(dc.Icon, { icon: 'trash-2', style: { fontSize: '14px' } }), "Delete Selected"),

          selectedBoxIds.length === 1 && h('button', {
            style: {
              padding: '10px 12px',
              background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
              border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
              borderRadius: '8px',
              color: currentTheme.textColor,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            },
            onMouseEnter: (e) => {
              e.target.style.background = 'rgba(139, 92, 246, 0.15)';
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2)';
            },
            onMouseLeave: (e) => {
              e.target.style.background = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
              e.target.style.borderColor = isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            },
            onClick: () => { toggleEditPanel(); setActiveSection(null); setIsMenuOpen(false); }
          }, h(dc.Icon, { icon: 'pencil', style: { fontSize: '14px' } }), "Edit Selected")
        ),

        // Divider between selection actions and add shapes (only show if there are selections)
        selectedBoxIds.length > 0 && h('div', { style: { height: '1px', background: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.2)' } }),

        // Add New Shapes
        h('div', { style: { fontSize: '10px', fontWeight: '700', color: '#8b5cf6', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.6 } }, "Add New Shape"),
        h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }
        },
          ['text', 'pure-text', 'circle', 'triangle', 'datacore-component'].map(type =>
            h('button', {
              key: type,
              style: {
                padding: '10px 8px',
                background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
                borderRadius: '8px',
                color: currentTheme.textColor,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 0.15s ease',
                textAlign: 'center',
              },
              onMouseEnter: (e) => {
                e.target.style.background = 'rgba(139, 92, 246, 0.15)';
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2)';
              },
              onMouseLeave: (e) => {
                e.target.style.background = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
                e.target.style.borderColor = isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              },
              onClick: () => { createNewBox(type); setActiveSection(null); setIsMenuOpen(false); focusCanvas(); }
            }, type.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase()))
          )
        )
      ),

      // Save Manager Section
      h('div', { style: sectionHeaderStyle }, "Save Manager"),
      h('button', {
        style: menuItemStyle,
        onMouseEnter: (e) => {
          e.target.style.background = currentTheme.hover;
          e.target.style.borderLeft = '2px solid #8b5cf6';
        },
        onMouseLeave: (e) => {
          e.target.style.background = 'none';
          e.target.style.borderLeft = '2px solid transparent';
        },
        onClick: () => setActiveSection(activeSection === 'saves' ? null : 'saves')
      }, h(dc.Icon, { icon: 'save', style: { fontSize: '16px' } }), activeSection === 'saves' ? "Close Manager ▲" : "Manage Saves ▼"),

      activeSection === 'saves' && h('div', {
        style: {
          background: isDarkMode ? 'rgba(139, 92, 246, 0.03)' : 'rgba(139, 92, 246, 0.05)',
          padding: '12px 16px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '300px',
        }
      },
        // Save Current Button
        h('button', {
          style: {
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.15s ease',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          },
          onMouseEnter: (e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.35)';
          },
          onMouseLeave: (e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25)';
          },
          onClick: () => { handleSaveCanvas(); setActiveSection(null); setIsMenuOpen(false); focusCanvas(); }
        }, "💾 Save Canvas"),

        // Divider
        h('div', { style: { height: '1px', background: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.2)', margin: '4px 0' } }),

        // Saved Canvases List
        h('div', { style: { fontSize: '10px', fontWeight: '700', color: '#8b5cf6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.6 } }, "Saved Canvases"),
        h('div', {
          onWheel: (e) => e.stopPropagation(),
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '180px',
            overflowY: 'auto',
            paddingRight: '4px',
          }
        },
          availableSaves.length === 0 ? 
            h('div', { style: { padding: '16px', textAlign: 'center', color: isDarkMode ? '#666' : '#999', fontSize: '12px', fontStyle: 'italic' } }, "No saved canvases yet") :
            availableSaves.map(filename =>
              h('div', {
                key: filename,
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }
              },
                h('button', {
                  style: {
                    flex: 1,
                    padding: '10px 12px',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                    border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'}`,
                    borderRadius: '6px',
                    color: currentTheme.textColor,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                  onMouseEnter: (e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.12)';
                    e.target.style.borderColor = '#8b5cf6';
                  },
                  onMouseLeave: (e) => {
                    e.target.style.background = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
                    e.target.style.borderColor = isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)';
                  },
                  onClick: () => handleSelectLoadedCanvas(filename),
                  title: filename
                }, `📄 ${filename.replace('.canvas.json', '')}`),
                h('button', {
                  style: {
                    padding: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid rgba(239, 68, 68, 0.2)`,
                    borderRadius: '6px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  },
                  onMouseEnter: (e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.target.style.borderColor = '#ef4444';
                  },
                  onMouseLeave: (e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  },
                  onMouseDown: (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  },
                  onClick: (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const displayName = filename.replace('.canvas.json', '');
                    console.log('[Delete Button] Clicked for:', displayName);
                    if (confirm(`Delete "${displayName}"?`)) {
                      console.log('[Delete Button] Confirmed, calling deleteCanvas');
                      deleteCanvas(filename);
                    } else {
                      console.log('[Delete Button] Cancelled');
                    }
                  },
                  title: "Delete canvas"
                }, h(dc.Icon, { icon: 'trash-2', style: { fontSize: '14px', pointerEvents: 'none' } }))
              )
            )
        )
      )
    )
  );
}

return { CanvasControls, EditPanel, useCanvasPersistence, useCanvasInteractions};
```



# Box

```jsx
const { useState, useRef, useEffect, useCallback, Fragment } = dc;

function useBoxManagement({
  boxes, setBoxes, selectedBoxIds, setSelectedBoxIds, isEditing, setIsEditing,
  editingBoxProps, setEditingBoxProps, setShowAddMenu, screenToWorld,
  canvasRef, isDarkMode, isCanvasLocked, dc, focusCanvas
}) {

  const createNewBox = useCallback((type) => {
    if (isCanvasLocked) {
      if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
        dc.app.flash.error("Canvas is locked. Cannot add new boxes.");
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const { x: worldCenterX, y: worldCenterY } = screenToWorld(
      rect.left + rect.width / 2, rect.top + rect.height / 2
    );

    let newBoxWidth = 120, newBoxHeight = 80, newLabel = "";
    let defaultOpacity = 0.7, defaultBorder = "none";
    let defaultBaseColor, defaultBackgroundColor;
    let componentName = '';

    const randomRGBValue = () => Math.floor(Math.random() * 200) + 50;
    const randomShapeColor = `rgb(${randomRGBValue()}, ${randomRGBValue()}, ${randomRGBValue()})`;

    if (type === 'text') {
      defaultBackgroundColor = randomShapeColor; defaultBaseColor = 'white'; newLabel = 'Sample Text';
    } else if (type === 'pure-text') {
      newBoxWidth = 150; newBoxHeight = 30; defaultBackgroundColor = 'transparent';
      defaultBaseColor = isDarkMode ? 'white' : 'black'; newLabel = 'Pure Text';
    } else if (type === 'circle') {
      newBoxWidth = 100; newBoxHeight = 100; defaultBackgroundColor = randomShapeColor;
      defaultBaseColor = 'white'; newLabel = '';
    } else if (type === 'triangle') {
      newBoxWidth = 100; newBoxHeight = 100; defaultBackgroundColor = 'transparent';
      defaultBaseColor = randomShapeColor; newLabel = '';
    } else if (type === 'datacore-component') {
      newBoxWidth = 300; newBoxHeight = 200;
      defaultBackgroundColor = isDarkMode ? 'rgba(50, 50, 50, 0.7)' : 'rgba(200, 200, 200, 0.7)';
      defaultBaseColor = isDarkMode ? 'white' : 'black';
      defaultBorder = `1px dashed ${isDarkMode ? '#888' : '#666'}`;
      defaultOpacity = 1; newLabel = 'Datacore Component (Edit to Configure)';
    }

    const newBox = {
      id: `box-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      x: worldCenterX - newBoxWidth / 2, y: worldCenterY - newBoxHeight / 2,
      width: newBoxWidth, height: newBoxHeight,
      baseColor: defaultBaseColor, backgroundColor: defaultBackgroundColor,
      opacity: defaultOpacity, border: defaultBorder, label: newLabel,
      type: type, componentName: componentName,
      autoReload: false,
      props: {}, // Initialize with an empty props object
    };

    const propsArray = Object.entries(newBox.props || {}).map(([key, value]) => ({ key, value }));

    setBoxes(prevBoxes => [...prevBoxes, newBox]);
    setSelectedBoxIds([newBox.id]);
    setIsEditing(true);
    setEditingBoxProps({ ...newBox, propsArray });
    setShowAddMenu(false);
    focusCanvas();
  }, [setBoxes, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, screenToWorld, canvasRef, isDarkMode, isCanvasLocked, dc, focusCanvas]);

  const deleteSelectedBox = useCallback(() => {
    if (isCanvasLocked) {
      if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
          dc.app.flash.error("Canvas is locked. Cannot delete boxes.");
      }
      return;
    }
    if (selectedBoxIds.length === 0) {
      if (dc.app && dc.app.flash && typeof dc.app.flash.info === 'function') {
          dc.app.flash.info("No boxes selected to delete.");
      }
      return;
    }

    setBoxes(prevBoxes => prevBoxes.filter(box => !selectedBoxIds.includes(box.id)));
    if (dc.app && dc.app.flash && typeof dc.app.flash.success === 'function') {
        dc.app.flash.success(`Deleted ${selectedBoxIds.length} box(es).`);
    }
    setSelectedBoxIds([]);
    setIsEditing(false);
    setEditingBoxProps(null);
    setShowAddMenu(false);
    focusCanvas();
  }, [selectedBoxIds, setBoxes, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, isCanvasLocked, dc, focusCanvas]);

  const toggleEditPanel = useCallback(() => {
    if (selectedBoxIds.length === 1) {
      const selectedBoxId = selectedBoxIds[0];
      if (isEditing) {
        setIsEditing(false);
        setEditingBoxProps(null);
      } else {
        const boxToEdit = boxes.find(b => b.id === selectedBoxId);
        if (boxToEdit) {
          // Convert props object to an array of {key, value} for easier UI management
          const propsArray = Object.entries(boxToEdit.props || {}).map(([key, value]) => ({ key, value: String(value) }));
          setIsEditing(true);
          setEditingBoxProps({ ...boxToEdit, propsArray });
        }
      }
    } else {
        setIsEditing(false);
        setEditingBoxProps(null);
    }
    setShowAddMenu(false);
    focusCanvas();
  }, [selectedBoxIds, isEditing, boxes, setIsEditing, setEditingBoxProps, setShowAddMenu, focusCanvas]);

  // <<< START OF MODIFICATIONS >>>

  const handleSaveEdit = useCallback(() => {
    // Convert propsArray back to a props object before saving
    const propsObject = (editingBoxProps.propsArray || []).reduce((acc, prop) => {
        if (prop.key && prop.key.trim() !== '') {
            acc[prop.key.trim()] = prop.value;
        }
        return acc;
    }, {});
    
    // --- VALIDATION LOGIC ---
    // Define the minimum allowed size.
    const MIN_SIZE = 20;

    // Parse width. parseFloat will handle numbers as strings.
    // If it's not a number (e.g., empty string) or less than min, set to min.
    let finalWidth = parseFloat(editingBoxProps.width);
    if (isNaN(finalWidth) || finalWidth < MIN_SIZE) {
      finalWidth = MIN_SIZE;
    }

    // Do the same for height.
    let finalHeight = parseFloat(editingBoxProps.height);
    if (isNaN(finalHeight) || finalHeight < MIN_SIZE) {
      finalHeight = MIN_SIZE;
    }
    // --- END VALIDATION LOGIC ---

    const finalBoxData = { 
        ...editingBoxProps, 
        props: propsObject,
        width: finalWidth,   // Apply validated width
        height: finalHeight, // Apply validated height
    };
    delete finalBoxData.propsArray; // Clean up temporary array

    setBoxes(prevBoxes => prevBoxes.map(box => {
      if (box.id === finalBoxData.id) {
        return finalBoxData;
      }
      return box;
    }));
    setIsEditing(false);
    setEditingBoxProps(null);
  }, [editingBoxProps, setBoxes, setIsEditing, setEditingBoxProps]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingBoxProps(null);
  }, [setIsEditing, setEditingBoxProps]);

  const handleChangeEditField = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setEditingBoxProps(prev => {
      let updatedValue;
      if (type === 'checkbox') {
        updatedValue = checked;
      } else if (name === 'opacity') {
        // Opacity is a range slider, so its logic can remain strict.
        updatedValue = parseFloat(value);
        if (isNaN(updatedValue)) updatedValue = 0;
        updatedValue = Math.max(0, Math.min(1, updatedValue));
      } else if (name === 'width' || name === 'height') {
        // For width and height, just store the raw input value.
        // This allows the user to clear the field or type numbers below the minimum.
        // The validation will happen in `handleSaveEdit`.
        updatedValue = value;
      } else {
        updatedValue = value;
      }
      return { ...prev, [name]: updatedValue };
    });
  }, [setEditingBoxProps]);

  // <<< END OF MODIFICATIONS >>>

  const handleAddCustomProp = useCallback(() => {
    setEditingBoxProps(prev => {
        const newPropsArray = [...(prev.propsArray || []), { key: '', value: '' }];
        return { ...prev, propsArray: newPropsArray };
    });
  }, [setEditingBoxProps]);

  const handleRemoveCustomProp = useCallback((index) => {
    setEditingBoxProps(prev => {
        const newPropsArray = prev.propsArray.filter((_, i) => i !== index);
        return { ...prev, propsArray: newPropsArray };
    });
  }, [setEditingBoxProps]);

  const handleChangeCustomProp = useCallback((index, field, value) => {
    setEditingBoxProps(prev => {
        const newPropsArray = [...prev.propsArray];
        newPropsArray[index] = { ...newPropsArray[index], [field]: value };
        return { ...prev, propsArray: newPropsArray };
    });
  }, [setEditingBoxProps]);

  return {
    createNewBox, deleteSelectedBox, toggleEditPanel,
    handleSaveEdit, handleCancelEdit, handleChangeEditField,
    handleAddCustomProp, handleRemoveCustomProp, handleChangeCustomProp
  };
}

function Box({ box, isSelected, onMouseDownBox, onMouseDownHandle, globalIsDarkMode, h, dc, isCanvasLocked }) {
  const [LoadedChildComponent, setLoadedChildComponent] = useState(null);
  const [isLoadingComponent, setIsLoadingComponent] = useState(false);
  const [componentLoadError, setComponentLoadError] = useState(null);
  const [componentRuntimeError, setComponentRuntimeError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const sandboxRef = useRef(null);
  
  // Get current file path for temp folder location
  const currentPath = dc.useCurrentPath();
  
  // Track temp file for hot-reload
  const lastTempFileRef = useRef(null);
  const componentFilePathRef = useRef(null);
  const shouldUseTempFileRef = useRef(false); // Flag to indicate when to use temp file

  // DOM Mutation Observer to prevent fullTab escapes
  useEffect(() => {
    if (!LoadedChildComponent || box.type !== 'datacore-component') return;
    
    const sandboxBoundary = sandboxRef.current;
    if (!sandboxBoundary) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('component-render-root')) {
              const escapedElement = document.querySelector('.component-render-root');
              if (escapedElement && !sandboxBoundary.contains(escapedElement)) {
                const viewContent = sandboxBoundary.querySelector('.view-content');
                if (viewContent) {
                  viewContent.appendChild(escapedElement);
                  if (escapedElement.style.position === 'absolute') {
                    escapedElement.style.position = 'relative';
                  }
                }
              }
            }
          });
        }
      });
    });
    
    observer.observe(sandboxBoundary, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [LoadedChildComponent, box.type]);
  
  // Cleanup temp files on unmount
  useEffect(() => {
    return () => {
      if (lastTempFileRef.current) {
        app.vault.adapter.exists(lastTempFileRef.current).then(exists => {
          if (exists) {
            app.vault.adapter.remove(lastTempFileRef.current).catch(console.error);
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    setComponentRuntimeError(null); 

    if (!dc) {
      setComponentLoadError("Datacore engine not available.");
      setLoadedChildComponent(null); setIsLoadingComponent(false); return;
    }

    // Component loading with hot-reload support
    if (box.type === 'datacore-component' && box.componentName) {
      setIsLoadingComponent(true); setComponentLoadError(null);
      let isMounted = true; 

      (async () => {
        try {
          console.log(`[Box Loading] Starting load for component: ${box.componentName}, reloadTrigger: ${reloadTrigger}, autoReload: ${box.autoReload}, shouldUseTemp: ${shouldUseTempFileRef.current}`);
          
          // Auto-search for component file
          const allFiles = app.vault.getMarkdownFiles();
          const matchingFiles = allFiles.filter(file => 
            file.name.toLowerCase().includes(box.componentName.toLowerCase()) && 
            file.name.includes('.component') &&
            file.name.endsWith('.md')
          );
          
          if (matchingFiles.length === 0) {
            throw new Error(`No component found matching "${box.componentName}"`);
          }
          
          const file = matchingFiles[0];
          let filePath = file.path;
          
          console.log(`[Box Loading] Found component file: ${filePath}`);
          
          // Update the component file path reference (in case component changed)
          componentFilePathRef.current = filePath;
          
          // Only create temp file when manually reloading (not on initial load)
          if (box.autoReload && shouldUseTempFileRef.current && reloadTrigger > 0) {
            console.log(`[Box Hot-Reload] Hot-reload conditions met, creating temp file from: ${componentFilePathRef.current}`);
            const adapter = app.vault.adapter;
            
            // Read the CURRENT component file (not the cached one)
            const fileContent = await adapter.read(filePath);
            console.log(`[Box Hot-Reload] Read ${fileContent.length} bytes from source file`);
            
            // Get the directory of the current canvas file
            const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
            const tempDir = `${currentDir}/temp`;
            
            // Create temp directory if it doesn't exist
            if (!(await adapter.exists(tempDir))) {
              console.log(`[Box Hot-Reload] Creating temp directory: ${tempDir}`);
              await adapter.mkdir(tempDir);
            }
            
            // Delete previous temp file if it exists
            if (lastTempFileRef.current && await adapter.exists(lastTempFileRef.current)) {
              console.log(`[Box Hot-Reload] Removing old temp file: ${lastTempFileRef.current}`);
              await adapter.remove(lastTempFileRef.current);
              // Wait for vault to process deletion
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Create new temp file with timestamp - use simple name without nested paths
            const timestamp = Date.now();
            const simpleFileName = file.name.replace('.component.md', '').replace('.md', '').replace(/[^a-zA-Z0-9]/g, '-');
            const tempFileName = `temp-${simpleFileName}-${timestamp}.md`;
            const tempFilePath = `${tempDir}/${tempFileName}`;
            
            // Write content to temp file
            await adapter.write(tempFilePath, fileContent);
            console.log(`[Box Hot-Reload] Created temp file: ${tempFilePath} (${fileContent.length} bytes)`);
            
            // Wait for Obsidian vault to recognize the new file
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Verify the file exists in the vault
            let tempFile = app.vault.getAbstractFileByPath(tempFilePath);
            let retries = 0;
            while (!tempFile && retries < 10) {
              await new Promise(resolve => setTimeout(resolve, 50));
              tempFile = app.vault.getAbstractFileByPath(tempFilePath);
              retries++;
            }
            
            if (!tempFile) {
              throw new Error(`Temp file not found in vault after creation: ${tempFilePath}`);
            }
            
            lastTempFileRef.current = tempFilePath;
            
            // Use temp file path for loading
            filePath = tempFilePath;
            console.log(`[Box Hot-Reload] Vault recognized temp file after ${retries} retries. Loading from: ${tempFilePath}`);
          } else {
            console.log(`[Box Loading] Loading directly from original file (no temp): ${filePath}`);
          }
          
          // Auto-detect header
          const fileContent = await app.vault.read(await app.vault.getAbstractFileByPath(filePath));
          const headerMatch = fileContent.match(/^#\s+(\w+)/m);
          const header = headerMatch?.[1] || "ViewComponent";
          
          console.log(`[Box Loading] Auto-detected header: ${header} from file: ${filePath}`);
          
          const resolvedPath = dc.resolvePath(filePath);
          const linkToComponent = dc.headerLink(resolvedPath, header);
          console.log(`[Box Loading] Resolved component link: ${linkToComponent}`);
          
          const dynamicModule = await dc.require(linkToComponent);
          console.log(`[Box Loading] Module loaded successfully:`, typeof dynamicModule);

          if (!isMounted) return;

          // Auto-detect exported component
          let ComponentToLoad = null;
          if (typeof dynamicModule === 'function') {
            ComponentToLoad = dynamicModule;
          } else if (dynamicModule && typeof dynamicModule === 'object') {
            const keys = Object.keys(dynamicModule);
            if (keys.length > 0) ComponentToLoad = dynamicModule[keys[0]];
          }

          if (typeof ComponentToLoad !== 'function') {
            throw new Error("Module did not export a renderable component.");
          }

          setLoadedChildComponent(() => ComponentToLoad);
        } catch (error) {
          if (!isMounted) return;
          console.error(`Error loading component '${box.componentName}':`, error);
          setComponentLoadError(error.message || "Failed to load component.");
          setLoadedChildComponent(null);
        } finally {
          if (isMounted) {
            setIsLoadingComponent(false);
          }
        }
      })();

      return () => { isMounted = false; };
    } else {
      setLoadedChildComponent(null); setIsLoadingComponent(false);
      if (box.type === 'datacore-component') {
          setComponentLoadError("Missing component name.");
      } else {
          setComponentLoadError(null);
      }
      return;
    }
  }, [box.type, box.componentName, box.autoReload, box.id, dc, reloadTrigger]);

  const handleReload = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLoadingComponent) {
      console.log('[Box Hot-Reload] Already loading, skipping reload');
      return;
    }
    
    console.log(`[Box Hot-Reload] Manual reload triggered for: ${box.componentName}`);
    shouldUseTempFileRef.current = true; // Enable temp file creation for this reload
    setReloadTrigger(t => {
      console.log('[Box Hot-Reload] Incrementing reload trigger from', t, 'to', t + 1);
      return t + 1;
    });
    
    if (dc.app && dc.app.flash && typeof dc.app.flash.info === 'function') {
        dc.app.flash.info(`Reloading component: ${box.componentName}`);
    }
  }, [isLoadingComponent, dc.app, box.componentName]);

  const resizeHandleStyle = useCallback((type) => {
    const handleSize = 8;
    const offset = -handleSize / 2;
    const common = {
      position: 'absolute', width: `${handleSize}px`, height: `${handleSize}px`,
      background: 'white', border: '1px solid #007bff', borderRadius: '2px', zIndex: 4, cursor: 'default',
    };
    switch (type) {
      case 'tl': return { ...common, cursor: 'nwse-resize', left: offset, top: offset };
      case 't': return { ...common, cursor: 'ns-resize', left: '50%', transform: `translateX(-50%)`, top: offset };
      case 'tr': return { ...common, cursor: 'nesw-resize', right: offset, top: offset };
      case 'l': return { ...common, cursor: 'ew-resize', top: '50%', transform: `translateY(-50%)`, left: offset };
      case 'r': return { ...common, cursor: 'ew-resize', top: '50%', transform: `translateY(-50%)`, right: offset };
      case 'bl': return { ...common, cursor: 'nesw-resize', left: offset, bottom: offset };
      case 'b': return { ...common, cursor: 'ns-resize', left: '50%', transform: `translateX(-50%)`, bottom: offset };
      case 'br': return { ...common, cursor: 'nwse-resize', right: offset, bottom: offset };
      default: return {};
    }
  }, []);

  const renderShapeContent = () => {
    if (box.type === 'triangle') {
      return h('div', {
        style: { width: 0, height: 0, borderLeft: `${box.width / 2}px solid transparent`, borderRight: `${box.width / 2}px solid transparent`, borderBottom: `${box.height}px solid ${box.baseColor}` }
      }, String(box.label || ''));
    } else if (box.type === 'datacore-component') {
      let componentDisplayContent;
      const errorStyle = { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'red', backgroundColor: globalIsDarkMode ? 'rgba(50,0,0,0.7)' : 'rgba(255,220,220,0.7)', border: '1px solid red', padding: '10px', boxSizing: 'border-box', fontSize: '12px', overflow: 'auto', textAlign: 'center' };
      const preStyle = { whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '10px', textAlign: 'left', maxHeight: '80px', overflowY: 'auto', background: globalIsDarkMode ? '#403030' : '#fff0f0', padding: '5px', borderRadius: '4px', border: '1px dashed #ff8080', width: 'calc(100% - 10px)', margin: '5px auto' };

      if (isLoadingComponent) {
        componentDisplayContent = h('div', { style: { color: box.baseColor || (globalIsDarkMode ? 'white' : 'black'), fontSize: '14px', textAlign: 'center', lineHeight: 'normal', padding: '10px'} }, 'Loading component...');
      } else if (componentLoadError) {
        componentDisplayContent = h('div', { style: errorStyle }, h('p', { style: { margin: '0 0 5px 0', fontWeight: 'bold' } }, `Component Load Error:`), h('pre', { style: preStyle }, componentLoadError) );
      } else if (componentRuntimeError) {
        componentDisplayContent = h('div', { style: errorStyle }, h('p', { style: { margin: '0 0 5px 0', fontWeight: 'bold' } }, `Component Runtime Error:`), h('pre', { style: preStyle }, componentRuntimeError.toString()), componentRuntimeError.stack && h('pre', { style: {...preStyle, maxHeight: '60px', fontSize: '9px'} }, componentRuntimeError.stack.substring(0, 300) + (componentRuntimeError.stack.length > 300 ? '...' : '')) );
      } else if (LoadedChildComponent) {
        try {
          // Wrap component in sandbox environment (ViewsInceptions approach)
          componentDisplayContent = h('div', { 
            ref: sandboxRef,
            className: 'component-sandbox-isolator',
            style: { 
              width: '100%', 
              height: '100%', 
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate'
            }
          },
            // Create isolated workspace structure
            h('div', {
              className: 'workspace-leaf-content component-sandbox-boundary',
              'data-sandbox': 'true',
              style: {
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
                display: 'flex',
                flexDirection: 'column',
                contain: 'layout style paint'
              }
            },
              h('div', {
                className: 'view-content',
                style: {
                  width: '100%',
                  height: '100%',
                  overflow: 'auto',
                  position: 'relative',
                  flex: 1
                }
              },
                h('div', {
                  className: 'component-render-root',
                  style: { width: '100%', height: '100%' }
                },
                  h(LoadedChildComponent, {
                    key: `${box.componentName}-${reloadTrigger}`,
                    isDarkMode: globalIsDarkMode,
                    ...(box.props || {}) // Spread custom properties as props
                  })
                )
              )
            )
          );
        } catch (error) {
          console.error(`Runtime error rendering component '${box.componentName}':`, error);
          if (!componentRuntimeError) { setComponentRuntimeError(error); }
          componentDisplayContent = h('div', { style: errorStyle }, h('p', { style: { margin: '0 0 5px 0', fontWeight: 'bold' } }, `Render Error (will update):`), h('pre', { style: preStyle }, error.toString()) );
        }
      } else {
        componentDisplayContent = h('div', { style: { color: box.baseColor || (globalIsDarkMode ? 'white' : 'black'), fontSize: '14px', textAlign: 'center', lineHeight: 'normal', padding: '10px' } }, String(box.label || "Configure Datacore Component"));
      }

      // Safety check: ensure componentDisplayContent is a valid element
      if (!componentDisplayContent || (typeof componentDisplayContent === 'object' && !componentDisplayContent.type)) {
        componentDisplayContent = h('div', { style: { color: 'red', fontSize: '14px', textAlign: 'center', padding: '10px' } }, 'Component render error');
      }

      // Return componentDisplayContent directly - it's already wrapped properly
      return componentDisplayContent;
    } else if (box.type === 'text' || box.type === 'pure-text' || box.type === 'circle') {
      return String(box.label || '');
    } else {
      // Fallback for unknown types
      return null;
    }
  };
  
  const isAutoReloadEnabled = box.type === 'datacore-component' && box.autoReload;
  
  return (
    h('div', {
      className: "box-container",
      style: {
        position: "absolute", left: `${box.x}px`, top: `${box.y}px`,
        width: `${box.width}px`, height: `${box.height}px`,
        background: box.backgroundColor, opacity: box.opacity, 
        border: box.border,
        borderRadius: box.type === 'circle' ? '50%' : '4px',
        display: "flex", alignItems: "center", justifyContent: "center",
        color: box.baseColor,
        fontSize: box.type === 'pure-text' ? '24px' : '16px',
        fontWeight: box.type === 'pure-text' ? 'bold' : 'normal',
        cursor: isCanvasLocked ? 'default' : (isSelected ? 'grab' : 'pointer'),
        pointerEvents: isCanvasLocked && box.type !== 'datacore-component' ? 'none' : 'auto',
        boxShadow: isSelected ? "0 0 0 2px #007bff, 0 0 0 4px rgba(0, 123, 255, 0.3)" : "none",
        zIndex: isSelected ? 3 : 2,
        transition: 'box-shadow 0.1s ease-out',
        touchAction: 'none',
        overflow: 'visible',
        ...(box.type === 'datacore-component' ? { justifyContent: 'flex-start', alignItems: 'flex-start', padding: '0' } : {})
      },
      onMouseDown: (e) => {
        // Don't select canvas when clicking on datacore component area
        if (box.type === 'datacore-component') {
          e.stopPropagation();
        }
        onMouseDownBox(e, box.id);
      }
    },
      isAutoReloadEnabled && h('div', {
        style: { 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          border: `2px solid ${globalIsDarkMode ? 'rgba(147, 51, 234, 0.6)' : 'rgba(147, 51, 234, 0.8)'}`, 
          borderRadius: 'inherit', 
          pointerEvents: 'none',
          boxShadow: `0 0 12px ${globalIsDarkMode ? 'rgba(147, 51, 234, 0.3)' : 'rgba(147, 51, 234, 0.2)'}`
        }
      }),
      isAutoReloadEnabled && h('button', {
        title: "Hot-Reload Component (Click to refresh)",
        onClick: handleReload,
        onMouseDown: (e) => {
          e.stopPropagation();
          e.preventDefault();
        },
        style: { 
          position: 'absolute', 
          top: '4px', 
          right: '4px', 
          zIndex: 10, 
          width: '32px', 
          height: '32px', 
          padding: '0',
          background: globalIsDarkMode ? 'rgba(20, 20, 25, 0.98)' : 'rgba(255, 255, 255, 0.98)', 
          border: `2px solid ${globalIsDarkMode ? 'rgba(147, 51, 234, 0.9)' : 'rgba(147, 51, 234, 0.7)'}`,
          borderRadius: '8px', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          transition: 'all 0.15s ease',
          boxShadow: `0 2px 10px ${globalIsDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)'}, 0 0 20px ${globalIsDarkMode ? 'rgba(147, 51, 234, 0.3)' : 'rgba(147, 51, 234, 0.2)'}`,
          backdropFilter: 'blur(10px)',
          pointerEvents: 'auto'
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = globalIsDarkMode ? 'rgba(147, 51, 234, 0.25)' : 'rgba(147, 51, 234, 0.2)';
          e.currentTarget.style.transform = 'scale(1.08) rotate(90deg)';
          e.currentTarget.style.borderColor = globalIsDarkMode ? 'rgba(147, 51, 234, 1)' : 'rgba(147, 51, 234, 0.9)';
          e.currentTarget.style.boxShadow = `0 4px 16px ${globalIsDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.25)'}, 0 0 30px ${globalIsDarkMode ? 'rgba(147, 51, 234, 0.5)' : 'rgba(147, 51, 234, 0.4)'}`;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = globalIsDarkMode ? 'rgba(20, 20, 25, 0.98)' : 'rgba(255, 255, 255, 0.98)';
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.borderColor = globalIsDarkMode ? 'rgba(147, 51, 234, 0.9)' : 'rgba(147, 51, 234, 0.7)';
          e.currentTarget.style.boxShadow = `0 2px 10px ${globalIsDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)'}, 0 0 20px ${globalIsDarkMode ? 'rgba(147, 51, 234, 0.3)' : 'rgba(147, 51, 234, 0.2)'}`;
        }
      }, h(dc.Icon, { icon: 'refresh-cw', style: { width: '18px', height: '18px', color: globalIsDarkMode ? 'rgba(147, 51, 234, 1)' : 'rgba(147, 51, 234, 0.9)', transition: 'inherit' } })
      ),
      
      h('div', { className: 'shape-content-wrapper', style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, 
        renderShapeContent()
      ),

      ...(isSelected && !isCanvasLocked ? (
        ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'].map(handleType =>
          h('div', { key: handleType, className: "resize-handle", style: resizeHandleStyle(handleType), onMouseDown: (e) => onMouseDownHandle(e, box.id, handleType) })
        )
      ) : [])
    )
  );
}

return {Box, useBoxManagement};
```



# BasicView

```jsx
const { useState, useRef, useEffect, useCallback } = dc;

function FileNameModal({ onSave, onCancel, initialFileName, isDarkMode, focusCanvas }) {
  const [fileName, setFileName] = useState(initialFileName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    if (fileName.trim() !== '') {
      onSave(fileName.trim());
      // focusCanvas will be called by the function that invoked onSave, or onCancel
    } else {
      if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
          dc.app.flash.error('Filename cannot be empty!');
      } else {
          alert('Filename cannot be empty!');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const currentTheme = isDarkMode ? {
    modalBackground: 'rgba(15, 15, 15, 0.98)', 
    inputBackground: 'rgba(30, 30, 30, 0.9)', 
    inputBorder: 'rgba(139, 92, 246, 0.2)',
    textColor: '#ffffff', 
    buttonSaveBackground: '#8b5cf6', 
    buttonSaveHover: '#7c3aed',
    buttonCancelBackground: 'rgba(50, 50, 50, 0.8)', 
    buttonCancelHover: 'rgba(60, 60, 60, 0.9)',
  } : {
    modalBackground: 'rgba(255, 255, 255, 0.98)', 
    inputBackground: '#f5f5f5', 
    inputBorder: 'rgba(139, 92, 246, 0.3)',
    textColor: '#111', 
    buttonSaveBackground: '#8b5cf6', 
    buttonSaveHover: '#7c3aed',
    buttonCancelBackground: '#e0e0e0', 
    buttonCancelHover: '#d0d0d0',
  };

  const modalOverlayStyle = {
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
    display: 'flex',
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
  };
  const modalContentStyle = {
    backgroundColor: currentTheme.modalBackground, 
    padding: '28px', 
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)', 
    color: currentTheme.textColor,
    maxWidth: '450px', 
    width: '90%', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px',
    border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
    backdropFilter: 'blur(40px)',
  };
  const inputStyle = {
    padding: '12px 14px', 
    borderRadius: '8px', 
    border: `1px solid ${currentTheme.inputBorder}`,
    backgroundColor: currentTheme.inputBackground, 
    color: currentTheme.textColor,
    fontSize: '14px', 
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  };
  const modalButtonContainerStyle = { 
    display: 'flex', 
    justifyContent: 'flex-start', 
    gap: '10px', 
    marginTop: '8px' 
  };
  const buttonStyle = {
    padding: '11px 20px', 
    borderRadius: '8px', 
    border: 'none', 
    cursor: 'pointer',
    fontSize: '13px', 
    fontWeight: '600', 
    transition: 'all 0.15s ease', 
    color: 'white',
  };
  const saveButtonStyle = { 
    ...buttonStyle, 
    backgroundColor: currentTheme.buttonSaveBackground,
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
  };
  const cancelButtonStyle = { 
    ...buttonStyle, 
    backgroundColor: currentTheme.buttonCancelBackground,
    color: currentTheme.textColor,
  };

  return h('div', { style: modalOverlayStyle },
    h('div', { style: modalContentStyle },
      h('h3', { 
        style: { 
          margin: '0 0 4px 0', 
          color: currentTheme.textColor, 
          fontSize: '18px', 
          fontWeight: '600',
          textAlign: 'left',
        } 
      }, "Save Canvas"),
      h('p', { 
        style: { 
          color: currentTheme.textColor, 
          margin: '0 0 12px 0', 
          fontSize: '13px', 
          opacity: 0.7,
          textAlign: 'left',
        } 
      }, "Enter a filename for your canvas:"),
      h('input', {
        type: "text", 
        value: fileName, 
        onChange: (e) => setFileName(e.target.value),
        onKeyPress: handleKeyPress, 
        ref: inputRef, 
        style: inputStyle, 
        placeholder: "my-canvas-data",
        onFocus: (e) => {
          e.target.style.borderColor = '#8b5cf6';
          e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
        },
        onBlur: (e) => {
          e.target.style.borderColor = currentTheme.inputBorder;
          e.target.style.boxShadow = 'none';
        },
      }),
      h('div', { style: modalButtonContainerStyle },
        h('button', {
          onClick: handleSave, 
          style: saveButtonStyle,
          onMouseEnter: (e) => {
            e.target.style.backgroundColor = currentTheme.buttonSaveHover;
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.35)';
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = currentTheme.buttonSaveBackground;
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25)';
          },
        }, "Save"),
        h('button', {
          onClick: () => { onCancel(); focusCanvas(); }, 
          style: cancelButtonStyle,
          onMouseEnter: (e) => {
            e.target.style.backgroundColor = currentTheme.buttonCancelHover;
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = currentTheme.buttonCancelBackground;
          },
        }, "Cancel")
      )
    )
  );
}


function BasicView({ children, setCanvasRef, onCanvasMouseDown, handleWheel, isSpacebarDownRef, isCanvasDraggingRef,
  selectedBoxIds, deleteSelectedBox, isCanvasLocked, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, focusCanvas,
  onCopyObjects, onPasteObjects, onCutObjects
}) {
  const viewRef = useRef(null);
  const originalExecuteCommandRef = useRef(null);
  const originalExecuteRef = useRef(null);
  const ourOverriddenExecuteCommandByIdRef = useRef(null);
  const ourOverriddenExecuteRef = useRef(null);

  useEffect(() => {
    if (viewRef.current) {
      setCanvasRef.current = viewRef.current;
    }
  }, [setCanvasRef]);

  const handleKeyDown = useCallback((event) => {
    const isCanvasCurrentlyActive = viewRef.current === document.activeElement;
    // console.log('handleKeyDown: isCanvasActive:', isCanvasCurrentlyActive, 'event.key:', event.key, 'activeEl:', document.activeElement?.tagName);

    if (!isCanvasCurrentlyActive) return;

    const isInputFocused = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA';
    const isMetaOrCtrl = event.metaKey || event.ctrlKey;

    if (isMetaOrCtrl) {
      if (event.code === 'KeyC') { if (!isInputFocused) { event.preventDefault(); onCopyObjects(); } return; }
      if (event.code === 'KeyX') { if (!isInputFocused) { event.preventDefault(); onCutObjects(); } return; }
      if (event.code === 'KeyV') { if (!isInputFocused) { event.preventDefault(); onPasteObjects(); } return; }
      // Allow Ctrl/Cmd+W, etc. to pass through for browser behavior. No explicit return for others means they pass.
    }

    if (!isInputFocused && (event.code === 'Delete' || event.code === 'Backspace')) {
      event.preventDefault();
      if (selectedBoxIds.length > 0 && !isCanvasLocked) deleteSelectedBox();
      else if (isCanvasLocked && dc.app?.flash?.error) dc.app.flash.error("Canvas is locked. Cannot delete boxes.");
      return;
    }
    if (event.code === 'Escape') {
      if (!isInputFocused) {
        if (selectedBoxIds.length > 0) { setSelectedBoxIds([]); setIsEditing(false); setEditingBoxProps(null); }
        setShowAddMenu(false);
      }
      return; // Do not prevent default for Escape as it might be used by other parts of the application
    }
    if (event.code === 'Space' && !isInputFocused) { event.preventDefault(); return; }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') return;

    // All other key presses that fall through this point are allowed
  }, [deleteSelectedBox, selectedBoxIds, isCanvasLocked, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, viewRef, onCopyObjects, onCutObjects, onPasteObjects]);

  const handleFocus = useCallback(() => {
    // console.log('BasicView: Gained focus. Attempting to override commands.');
    if (dc.app?.commands) {
      // Only override if we haven't already, or if the current command is not *our* overridden one
      if (!ourOverriddenExecuteCommandByIdRef.current || dc.app.commands.executeCommandById !== ourOverriddenExecuteCommandByIdRef.current) {
        originalExecuteCommandRef.current = dc.app.commands.executeCommandById;
        originalExecuteRef.current = dc.app.commands.execute;

        const customExecuteCommandById = (commandId) => {
          if (viewRef.current === document.activeElement) {
            // Allow specific commands to pass through normally.
            if (['workspace:close', 'pip:close', 'editor:copy', 'editor:paste', 'editor:cut'].includes(commandId)) {
              return originalExecuteCommandRef.current?.call(dc.app.commands, commandId) ?? true;
            }
            return false; // Block other commands if our canvas has active focus
          }
          return originalExecuteCommandRef.current?.call(dc.app.commands, commandId) ?? true;
        };
        const customExecute = (command) => {
          if (viewRef.current === document.activeElement) {
            if (command && ['workspace:close', 'pip:close', 'editor:copy', 'editor:paste', 'editor:cut'].includes(command.id)) {
              return originalExecuteRef.current?.call(dc.app.commands, command) ?? true;
            }
            return false; // Block other commands if our canvas has active focus
          }
          return originalExecuteRef.current?.call(dc.app.commands, command) ?? true;
        };

        dc.app.commands.executeCommandById = customExecuteCommandById;
        dc.app.commands.execute = customExecute;
        ourOverriddenExecuteCommandByIdRef.current = customExecuteCommandById;
        ourOverriddenExecuteRef.current = customExecute;
        // console.log('BasicView: Commands overridden.');
      } // else console.log('BasicView: Commands already overridden by this component.');
    } // else console.log('BasicView: dc.app.commands not available for override.');
  }, [viewRef]);

  const handleBlur = useCallback(() => {
    // console.log('BasicView: Lost focus. Attempting to restore commands.');
    if (dc.app?.commands && dc.app.commands.executeCommandById === ourOverriddenExecuteCommandByIdRef.current) {
      if (originalExecuteCommandRef.current) dc.app.commands.executeCommandById = originalExecuteCommandRef.current;
      if (originalExecuteRef.current) dc.app.commands.execute = originalExecuteRef.current;
      // console.log('BasicView: Commands restored.');
    } // else console.log('BasicView: Skipping command restoration (not found or not our override).');
    originalExecuteCommandRef.current = null;
    originalExecuteRef.current = null;
    ourOverriddenExecuteCommandByIdRef.current = null;
    ourOverriddenExecuteRef.current = null;
  }, []);

  useEffect(() => {
    const currentViewRef = viewRef.current;
    if (!currentViewRef) return;
    focusCanvas();
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    currentViewRef.addEventListener('focus', handleFocus);
    currentViewRef.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      currentViewRef.removeEventListener('focus', handleFocus);
      currentViewRef.removeEventListener('blur', handleBlur);
      handleBlur(); // Ensure commands are restored on unmount/cleanup
    };
  }, [handleKeyDown, handleFocus, handleBlur, focusCanvas]);

  return h('div', {
    ref: viewRef, tabIndex: 0, // Make the div focusable
    style: {
      height: '100%', width: '100%', padding: '0px', border: 'none', borderRadius: '8px',
      backgroundColor: 'transparent', boxShadow: 'none', outline: 'none',
      transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', position: 'relative',
      // Update cursor based on whether dragging or spacebar is down
      cursor: selectedBoxIds.length > 0 ? 'default' : (isSpacebarDownRef.current ? (isCanvasDraggingRef.current ? "grabbing" : "grab") : "default"),
    },
    onMouseDown: onCanvasMouseDown, // This ensures focus is set on mouse down
    onWheel: handleWheel,
  }, children);
}


return { BasicView, FileNameModal };
```

















# ScreenModeHelper

```jsx
// ScreenModeHelper

const { useState, useRef, useEffect, useCallback } = dc;

function getInt(val) {
  return parseInt(val, 10) || 0;
}

function resetScreenMode(container, defaultStyle, originalParentRefForWindow, originalParentRefForPiP) {
  // Exit fullscreen if active (old browser mode)
  if (document.fullscreenElement === container) {
    document.exitFullscreen?.();
  }

  // Clean up browser mode (full-tab) positioning
  if (container._placeholderForBrowser && container._placeholderForBrowser.parentNode) {
    container._placeholderForBrowser.parentNode.replaceChild(container, container._placeholderForBrowser);
    delete container._placeholderForBrowser;
    delete container._originalParentForBrowser;
  }

  // Restore parent position if we modified it for browser mode
  if (container._parentPositionInfo?.element) {
    container._parentPositionInfo.element.style.position =
      container._parentPositionInfo.original === "static"
        ? ""
        : container._parentPositionInfo.original;
    delete container._parentPositionInfo;
  }

  if (container.parentNode === document.body) {
    if (originalParentRefForWindow.current) {
      originalParentRefForWindow.current.appendChild(container);
      originalParentRefForWindow.current = null;
    } else if (originalParentRefForPiP.current) {
      originalParentRefForPiP.current.appendChild(container);
      originalParentRefForPiP.current = null;
    } else {
      if (container.getAttribute('data-is-independent-pip')) {
          // Container is an independent PiP, will not reparent.
      } else {
          // Container is in body, but no original parent ref found. Not reparenting.
      }
    }
  }

  // Clean up PiP-specific drag/resize listeners and elements
  if (container._pipDragAttached) {
    window.removeEventListener("mousemove", container._pipDragAttached.dragMove);
    window.removeEventListener("mouseup", container._pipDragAttached.dragEnd);
    // The dragStart listener was on the _pipDragBar, not container directly
    if (container._pipDragBar) {
        container._pipDragBar.removeEventListener("mousedown", container._pipDragAttached.dragStart);
        if (container._pipDragBar.parentNode === container) {
            container.removeChild(container._pipDragBar);
        }
        delete container._pipDragBar;
    }
    delete container._pipDragAttached;
    delete container._pipDragging;
  }
  if (container._pipResizers) {
    container._pipResizers.forEach(resizer => {
      if (resizer.parentNode === container) {
        container.removeChild(resizer);
      }
    });
    delete container._pipResizers;
  }
  delete container._pipReset;

  if (!container.getAttribute('data-is-independent-pip')) {
      container.style.cssText = defaultStyle;
  }
  console.log("[resetScreenMode] Container reset complete.");
}

function applyBrowserMode(container) {
  console.log("[applyBrowserMode] START - Applying full-tab mode (repositioning in workspace-leaf-content).");
  console.log("[applyBrowserMode] Container element:", container);
  
  // Ensure we're not in fullscreen when applying browser mode initially
  if (document.fullscreenElement === container) {
    console.log("[applyBrowserMode] Exiting fullscreen before applying full-tab mode.");
    document.exitFullscreen?.();
  }
  
  // Find the nearest workspace-leaf-content ancestor (like D3JSTest does)
  let targetPaneContent = container.closest('.workspace-leaf-content');
  console.log("[applyBrowserMode] Found workspace-leaf-content:", targetPaneContent);
  
  if (!targetPaneContent) {
    console.error("[applyBrowserMode] ERROR: Could not find workspace-leaf-content ancestor!");
    return;
  }

  // Find the view-content wrapper or use targetPaneContent directly
  const contentWrapper = targetPaneContent.querySelector('.view-content') || targetPaneContent;
  console.log("[applyBrowserMode] Content wrapper:", contentWrapper);

  // Store original parent for cleanup (only if not already stored)
  if (!container._originalParentForBrowser) {
    container._originalParentForBrowser = container.parentNode;
    console.log("[applyBrowserMode] Stored original parent:", container._originalParentForBrowser);
    
    // Create placeholder
    container._placeholderForBrowser = document.createElement("div");
    container._placeholderForBrowser.style.display = "none";
    container.parentNode.insertBefore(container._placeholderForBrowser, container);
    console.log("[applyBrowserMode] Created and inserted placeholder");
  }

  // Store parent position info for cleanup (only if not already stored)
  if (!container._parentPositionInfo) {
    const originalPosition = window.getComputedStyle(contentWrapper).position;
    container._parentPositionInfo = {
      element: contentWrapper,
      original: originalPosition,
    };
    console.log("[applyBrowserMode] Stored parent position info:", originalPosition);

    // Ensure parent is positioned so absolute child works correctly
    if (originalPosition === "static") {
      contentWrapper.style.position = "relative";
      console.log("[applyBrowserMode] Set content wrapper position to 'relative'");
    }
  }

  // Move container to the workspace content wrapper (if not already there)
  if (container.parentNode !== contentWrapper) {
    console.log("[applyBrowserMode] Moving container to content wrapper");
    contentWrapper.appendChild(container);
  } else {
    console.log("[applyBrowserMode] Container already in content wrapper");
  }

  // Apply full-tab styling
  console.log("[applyBrowserMode] Applying full-tab styles...");
  Object.assign(container.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "9998",
    overflow: "auto",
    margin: "0",
    padding: "0",
    border: "none",
    borderRadius: "0"
  });

  console.log("[applyBrowserMode] COMPLETE - Full-tab mode applied successfully (without fullscreen).");
  console.log("[applyBrowserMode] Final container styles:", {
    position: container.style.position,
    width: container.style.width,
    height: container.style.height,
    top: container.style.top,
    left: container.style.left
  });
}

function toggleFullscreenOnBrowserMode(container) {
  console.log("[toggleFullscreenOnBrowserMode] Toggling fullscreen while in browser mode.");
  
  if (document.fullscreenElement === container) {
    // Exit fullscreen - stay in browser mode
    console.log("[toggleFullscreenOnBrowserMode] Exiting fullscreen, staying in browser mode.");
    document.exitFullscreen?.();
  } else {
    // Enter fullscreen while in browser mode
    console.log("[toggleFullscreenOnBrowserMode] Entering fullscreen.");
    container.requestFullscreen?.() ||
      container.webkitRequestFullscreen?.() ||
      container.mozRequestFullScreen?.() ||
      container.msRequestFullscreen?.();
  }
}

function applyWindowStyle(container) {
  console.log("[applyWindowStyle] Applying window mode CSS properties.");
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "9999",
    margin: "0",
    padding: "0",
    border: "none",
    borderRadius: "0",
    boxSizing: "border-box"
  });
}

function applyPipStyle(container) {
  console.log("[applyPipStyle] Applying PiP mode CSS properties.");
  Object.assign(container.style, {
    position: "fixed",
    top: "calc(100% - 300px - 10px)",
    left: "calc(100% - 400px - 10px)",
    width: "400px",
    height: "300px",
    zIndex: "10000",
    backgroundColor: container.style.backgroundColor || "#2c2c2c",
    border: "2px solid #444",
    borderRadius: "4px",
    cursor: "default", // Default cursor for content area, drag bar handles dragging
    boxSizing: "border-box",
    padding: "0",
    overflow: "hidden"
  });
}

// FIX: Make the drag area a dedicated bar
function setupPipDrag(container) {
  if (container._pipDragAttached) return; // Already attached
  console.log("[setupPipDrag] Attaching drag listeners to drag bar.");

  const dragBar = document.createElement("div");
  dragBar.className = "pip-drag-bar";
  Object.assign(dragBar.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "25px", // Height of the drag bar
    background: "rgba(0,0,0,0.1)", // Slightly visible drag bar
    cursor: "grab",
    zIndex: 10500, // Above content, below resizers (if needed)
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    borderTopLeftRadius: '4px', // Match container's border radius
    borderTopRightRadius: '4px',
    userSelect: 'none', // Prevent text selection on drag
  });
  dragBar.textContent = 'DRAG'; // Optional text indicator

  const dragHandlers = {
    dragStart: (e) => {
      // Allow internal buttons on the drag bar (like close button) to function
      if (e.target !== dragBar) { // Only drag if click is directly on the dragBar
          console.log("[setupPipDrag] Clicked on element inside dragBar, not dragging.");
          return;
      }
      e.preventDefault();
      container._pipDragging = true;
      container._pipStartX = e.clientX;
      container._pipStartY = e.clientY;
      const computed = getComputedStyle(container);
      container._pipOrigTop = getInt(computed.top);
      container._pipOrigLeft = getInt(computed.left);
      dragBar.style.cursor = 'grabbing'; // Change cursor while dragging
      console.log("[setupPipDrag] Drag started.");
    },
    dragMove: (e) => {
      if (!container._pipDragging) return;
      const deltaX = e.clientX - container._pipStartX;
      const deltaY = e.clientY - container._pipStartY;
      container.style.top = `${container._pipOrigTop + deltaY}px`;
      container.style.left = `${container._pipOrigLeft + deltaX}px`;
    },
    dragEnd: () => {
      container._pipDragging = false;
      dragBar.style.cursor = 'grab'; // Reset cursor after dragging
      console.log("[setupPipDrag] Drag ended.");
    }
  };

  // Attach dragStart to the new dragBar
  dragBar.addEventListener("mousedown", dragHandlers.dragStart);
  // Attach dragMove and dragEnd to the window (to track mouse outside container)
  window.addEventListener("mousemove", dragHandlers.dragMove);
  window.addEventListener("mouseup", dragHandlers.dragEnd);

  container.appendChild(dragBar); // Add drag bar to the container
  container._pipDragBar = dragBar; // Store reference to the drag bar
  container._pipDragAttached = dragHandlers;
}

// Setup PiP Corner Resizers: Enable resizing via corner handles.
function setupPipCornerResizers(container) {
  if (container._pipResizers && container._pipResizers.length > 0) return;
  console.log("[setupPipCornerResizers] Attaching resizer handles.");

  const corners = [
    { corner: "topLeft", style: { top: "-5px", left: "-5px", cursor: "nwse-resize" } },
    { corner: "topRight", style: { top: "-5px", right: "-5px", cursor: "nesw-resize" } },
    { corner: "bottomRight", style: { bottom: "-5px", right: "-5px", cursor: "nwse-resize" } },
    { corner: "bottomLeft", style: { bottom: "-5px", left: "-5px", cursor: "nesw-resize" } }
  ];
  const resizers = [];
  const handleSize = 10;

  corners.forEach(({ corner, style }) => {
    const resizer = document.createElement("div");
    resizer.className = `pip-resizer pip-resizer-${corner}`;
    Object.assign(resizer.style, {
      position: "absolute",
      width: `${handleSize}px`,
      height: `${handleSize}px`,
      background: "#007bff",
      border: "1px solid white",
      borderRadius: "2px",
      zIndex: 10500,
      ...style
    });

    resizer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      resizer._resizing = true;
      resizer._startX = e.clientX;
      resizer._startY = e.clientY;
      const computed = getComputedStyle(container);
      resizer._origWidth = getInt(computed.width);
      resizer._origHeight = getInt(computed.height);
      resizer._origTop = getInt(computed.top);
      resizer._origLeft = getInt(computed.left);
      resizer._corner = corner;
      console.log("[setupPipCornerResizers] Resizing started on", corner);
    });
    resizers.push(resizer);
    container.appendChild(resizer);
  });
  container._pipResizers = resizers;

  const resizeMove = (e) => {
    if (!container._pipResizers) return;
    container._pipResizers.forEach((resizer) => {
      if (!resizer._resizing) return;

      const deltaX = e.clientX - resizer._startX;
      const deltaY = e.clientY - resizer._startY;
      let newWidth = resizer._origWidth;
      let newHeight = resizer._origHeight;
      let newLeft = resizer._origLeft;
      let newTop = resizer._origTop;

      switch (resizer._corner) {
        case "bottomRight":
          newWidth = Math.max(200, resizer._origWidth + deltaX);
          newHeight = Math.max(150, resizer._origHeight + deltaY);
          break;
        case "bottomLeft":
          newWidth = Math.max(200, resizer._origWidth - deltaX);
          newHeight = Math.max(150, resizer._origHeight + deltaY);
          newLeft = resizer._origLeft + deltaX;
          break;
        case "topRight":
          newWidth = Math.max(200, resizer._origWidth + deltaX);
          newHeight = Math.max(150, resizer._origHeight - deltaY);
          newTop = resizer._origTop + deltaY;
          break;
        case "topLeft":
          newWidth = Math.max(200, resizer._origWidth - deltaX);
          newHeight = Math.max(150, resizer._origHeight - deltaY);
          newLeft = resizer._origLeft + deltaX;
          newTop = resizer._origTop + deltaY;
          break;
      }
      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;
      container.style.top = `${newTop}px`;
      container.style.left = `${newLeft}px`;
    });
  };

  const resizeEnd = () => {
    if (container._pipResizers) {
      container._pipResizers.forEach((resizer) => {
        resizer._resizing = false;
      });
      console.log("[setupPipCornerResizers] Resizing ended.");
    }
  };

  window.addEventListener("mousemove", resizeMove);
  window.addEventListener("mouseup", resizeEnd);
}

// -------------------------
// Function to spawn a new independent PiP container with its own AppComponent
// This function remains in the code but will not be triggered by buttons from this component's UI.
// -------------------------
function spawnIndependentPip(AppComponent, isDarkMode) {
  const hostDiv = document.createElement("div");
  hostDiv.setAttribute('data-is-independent-pip', 'true');
  hostDiv.style.backgroundColor = isDarkMode ? '#2c2c2c' : 'white';
  document.body.appendChild(hostDiv);
  console.log("[spawnIndependentPip] New host element created and appended.");

  const closeIndependentPip = () => {
    resetScreenMode(hostDiv, '', { current: null }, { current: null });
    dc.preact.render(null, hostDiv); // Use dc.preact.render explicitly
    if (hostDiv.parentNode) {
      hostDiv.parentNode.removeChild(hostDiv);
    }
    console.log("[spawnIndependentPip] Independent PiP unmounted and removed.");
  };

  dc.preact.render( // Use dc.preact.render explicitly
    h(AppComponent, { // Assuming `h` is globally available for VNode creation
        isDarkMode: isDarkMode,
    }),
    hostDiv
  );
  console.log("[spawnIndependentPip] AppComponent rendered inside new PiP host.");

  applyPipStyle(hostDiv);
  setupPipDrag(hostDiv);
  setupPipCornerResizers(hostDiv);

  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  Object.assign(closeButton.style, {
    position: 'absolute',
    top: '0', // Position at the top right of the drag bar
    right: '0',
    zIndex: '10600', // Above drag bar and resizers
    cursor: 'pointer',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderTopRightRadius: '4px',
    borderBottomLeftRadius: '4px',
    width: '25px', // Match drag bar height
    height: '25px', // Match drag bar height
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  });
  closeButton.onclick = closeIndependentPip;
  if (hostDiv._pipDragBar) { // Attach to the drag bar if it exists
      hostDiv._pipDragBar.appendChild(closeButton);
  } else { // Fallback, attach to hostDiv if drag bar not yet created (shouldn't happen with current order)
      hostDiv.appendChild(closeButton);
  }
}


// -------------------------
// ScreenModeHelper Component
// -------------------------
const ScreenModeHelper = ({
  helperRef,
  initialMode = "default",
  containerRef,
  defaultStyle,
  originalParentRefForWindow,
  originalParentRefForPiP,
  allowedScreenModes = ["browser", "window", "pip"], // Removed "character" from default allowed modes
  engine, // This is dc.app from InfiniteCanvas
  AppComponent,
  isDarkMode,
  onModeChange, // <<< MODIFICATION 1 of 3: Accept the new prop from parent
  onModeUpdate, // New: callback to update parent's screen mode state
}) => {
  const [activeMode, setActiveMode] = useState(
    allowedScreenModes.includes(initialMode) ? initialMode : "default"
  );
  
  // Track if we're in actual fullscreen (separate from browser mode which is full-tab)
  const [isInFullscreen, setIsInFullscreen] = useState(false);
  const toggleMode = useCallback((mode, forceApply = false) => {
    console.group(`[ScreenModeHelper.toggleMode] Toggling to: '${mode}' from '${activeMode}' (forceApply=${forceApply})`);

    const container = containerRef.current;
    if (!container) {
        console.warn("[ScreenModeHelper.toggleMode] Container ref is null.");
        console.groupEnd();
        return;
    }

    // Special handling: if already in browser mode and clicking browser button again, toggle fullscreen
    if (activeMode === "browser" && mode === "browser" && !forceApply) {
      console.log("[ScreenModeHelper.toggleMode] Already in browser mode, toggling fullscreen.");
      toggleFullscreenOnBrowserMode(container);
      console.groupEnd();
      return;
    }

    // Special handling: if in window or pip mode and clicking the same button, return to browser mode (full-tab)
    if ((activeMode === "window" && mode === "window") || (activeMode === "pip" && mode === "pip")) {
      if (!forceApply) {
        console.log(`[ScreenModeHelper.toggleMode] Already in ${activeMode} mode, returning to browser mode (full-tab).`);
        toggleMode("browser", true); // Force apply browser mode
        console.groupEnd();
        return;
      }
    }

    // Determine the new mode first before resetting
    let newActiveMode = "default";
    // Do not set 'character' as the activeMode of *this* component.
    // If 'character' mode was requested (e.g., if allowedScreenModes still contains it),
    // it will spawn a new window and this component will reset to default.
    if (mode !== "character") {
        // If forceApply is true, always apply the requested mode
        // Otherwise, standard mode switching behavior
        if (forceApply) {
            newActiveMode = mode;
        } else {
            // When switching from one mode to another, apply the new mode
            newActiveMode = mode;
        }
    }
    
    // Only reset if we're changing modes AND not going from browser to window/pip
    // (browser to window/pip should preserve the browser positioning setup)
    const isGoingFromBrowserToOtherMode = (activeMode === "browser" && (newActiveMode === "window" || newActiveMode === "pip"));
    
    if (activeMode !== newActiveMode && !isGoingFromBrowserToOtherMode) {
        console.log(`[ScreenModeHelper.toggleMode] Resetting screen mode. activeMode='${activeMode}' -> newActiveMode='${newActiveMode}'`);
        resetScreenMode(container, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
    } else if (isGoingFromBrowserToOtherMode) {
        console.log(`[ScreenModeHelper.toggleMode] Switching from browser to ${newActiveMode} - skipping reset, will clean up browser mode.`);
        // DON'T clean up browser mode placeholders - keep them so we can restore later
        // Just restore parent position
        if (container._parentPositionInfo?.element) {
            const originalPos = container._parentPositionInfo.original;
            container._parentPositionInfo.element.style.position =
                originalPos === "static" ? "" : originalPos;
            console.log(`[ScreenModeHelper.toggleMode] Restored parent position to: ${originalPos}`);
            // Don't delete _parentPositionInfo yet - keep it for restoration
        }
    } else {
        console.log(`[ScreenModeHelper.toggleMode] Skipping reset, already in '${activeMode}' mode.`);
    }
    
    setActiveMode(newActiveMode);
    console.log(`[ScreenModeHelper.toggleMode] setActiveMode called with: '${newActiveMode}'`);
    
    // Notify parent component of mode change so it can update container styles
    if (typeof onModeUpdate === 'function') {
      onModeUpdate(newActiveMode);
      console.log(`[ScreenModeHelper.toggleMode] onModeUpdate called with: '${newActiveMode}'`);
    }


    if (newActiveMode === "default") {
      console.log("[ScreenModeHelper.toggleMode] Reset to default completed.");
    } else if (newActiveMode === "browser") {
      console.log("[ScreenModeHelper.toggleMode] Applying browser mode - checking if restoring or creating fresh.");
      
      // Check if we already have a browser placeholder (coming from window/pip)
      if (container._placeholderForBrowser && container._placeholderForBrowser.parentNode) {
        console.log("[ScreenModeHelper.toggleMode] Found browser placeholder - restoring from window/pip mode.");
        const placeholder = container._placeholderForBrowser;
        
        // Restore container to its browser position
        placeholder.parentNode.replaceChild(container, placeholder);
        
        // Restore parent position
        if (container._parentPositionInfo?.element) {
          container._parentPositionInfo.element.style.position =
            container._parentPositionInfo.original === "static" ? "" : container._parentPositionInfo.original;
          console.log(`[ScreenModeHelper.toggleMode] Restored parent position`);
        }
        
        // Clean up artifacts
        delete container._placeholderForBrowser;
        delete container._originalParentForBrowser;
        delete container._parentPositionInfo;
        
        console.log("[ScreenModeHelper.toggleMode] Browser mode restored from placeholder.");
      } else {
        console.log("[ScreenModeHelper.toggleMode] No placeholder found - creating fresh browser mode.");
        applyBrowserMode(container);
      }
      
      console.log("[ScreenModeHelper.toggleMode] Browser mode application completed.");
    } else if (newActiveMode === "window") {
      console.log("[ScreenModeHelper.toggleMode] Applying window mode.");
      // Don't store parent if coming from browser mode - we'll return to browser mode later
      if (container.parentNode !== document.body && activeMode !== "browser") {
        originalParentRefForWindow.current = container.parentNode;
      }
      // Always move to document.body for window mode
      if (container.parentNode !== document.body) {
        document.body.appendChild(container);
      }
      applyWindowStyle(container);
    } else if (newActiveMode === "pip") {
      console.log("[ScreenModeHelper.toggleMode] Applying PiP mode (for main container).");
      // Don't store parent if coming from browser mode - we'll return to browser mode later
      if (container.parentNode !== document.body && activeMode !== "browser") {
        originalParentRefForPiP.current = container.parentNode;
      }
      // Always move to document.body for pip mode
      if (container.parentNode !== document.body) {
        document.body.appendChild(container);
      }
      applyPipStyle(container);
      setupPipDrag(container);
      setupPipCornerResizers(container);
    } else if (mode === "character") { // This branch handles the 'character' mode request by spawning a new independent window.
                                        // 'newActiveMode' would be 'default' in this case for the current component.
      console.log("[ScreenModeHelper.toggleMode] Spawning new independent PiP window (via character mode request).");
      if (AppComponent) {
        spawnIndependentPip(AppComponent, isDarkMode);
      } else {
        console.warn("[ScreenModeHelper.toggleMode] AppComponent not provided for 'character' mode.");
      }
    }

    if (engine) {
      setTimeout(() => {
        // ADDED CONDITIONAL CHECK HERE
        if (typeof engine.resize === 'function') {
            engine.resize();
        }
      }, 100);
    }
    
    // <<< MODIFICATION 2 of 3: Call the passed-in handler >>>
    // We call this after changing modes to allow the parent to react, e.g., by resetting the view.
    if (typeof onModeChange === 'function') {
        console.log("[ScreenModeHelper.toggleMode] Firing onModeChange event.");
        onModeChange();
    }

    console.groupEnd();
  }, [
      activeMode, containerRef, originalParentRefForWindow, originalParentRefForPiP, 
      defaultStyle, engine, isDarkMode, AppComponent, 
      onModeChange // <<< MODIFICATION 3 of 3: Add prop to dependency array
  ]);


  useEffect(() => {
    if (helperRef) {
      helperRef.current = { toggleMode };
      console.log("[ScreenModeHelper] toggleMode exposed via helperRef.");
    }
  }, [helperRef, toggleMode]);

  // Ref to track if initial mode has been applied
  const initialModeAppliedRef = useRef(false);

  useEffect(() => {
    console.log(`[ScreenModeHelper] useEffect running. initialMode='${initialMode}', containerRef.current=${!!containerRef.current}, initialModeAppliedRef.current=${initialModeAppliedRef.current}`);
    
    // Only apply initial mode once when container becomes available
    if (initialMode !== "default" && containerRef.current && !initialModeAppliedRef.current) {
      console.log(`[ScreenModeHelper] Applying initial mode: '${initialMode}' on mount.`);
      initialModeAppliedRef.current = true;
      
      // Apply mode immediately with forceApply to override toggle behavior
      if (initialMode !== "character") {
        console.log(`[ScreenModeHelper] Executing toggleMode('${initialMode}', forceApply=true)`);
        toggleMode(initialMode, true); // Force apply on initial load
      } else {
        console.warn("[ScreenModeHelper] Initial mode 'character' is not directly supported for this component's active state.");
      }
    } else {
      console.log(`[ScreenModeHelper] NOT applying initial mode. Reason: initialMode=${initialMode}, hasContainer=${!!containerRef.current}, alreadyApplied=${initialModeAppliedRef.current}`);
    }
  }, [initialMode, containerRef.current, toggleMode]); // Watch for containerRef.current to become available

  useEffect(() => {
    let observer;
    let resizeTimeout;
    if (containerRef.current && engine) {
      observer = new ResizeObserver((entries) => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          entries.forEach((entry) => {
            const { width } = entry.contentRect;
            let scalingFactor;
            if (activeMode === "pip") {
              scalingFactor = 0.25;
            } else {
              const baseWidth = 400;
              scalingFactor = baseWidth / width;
              scalingFactor = Math.max(0.25, Math.min(scalingFactor, 1));
              const extraFactor = 1 * (window.devicePixelRatio || 1);
              scalingFactor = scalingFactor / extraFactor;
              scalingFactor = Math.max(0.001, scalingFactor);
            }

            // Silently check and call engine methods if they exist
            if (engine && typeof engine.setHardwareScalingLevel === 'function') {
                engine.setHardwareScalingLevel(scalingFactor);
            }

            if (engine && typeof engine.resize === 'function') {
                engine.resize();
            }
          });
        }, 300);
      });
      observer.observe(containerRef.current);
    }
    return () => {
      if (observer && containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [containerRef, engine, activeMode]);


  useEffect(() => {
      const handleFullscreenChange = () => {
          const inFullscreen = !!document.fullscreenElement;
          console.log(`[FullscreenEvent] Fullscreen state changed. document.fullscreenElement: ${document.fullscreenElement ? document.fullscreenElement.tagName : 'None'}`);
          
          // Update fullscreen state for button styling
          setIsInFullscreen(inFullscreen);
          
          // When exiting fullscreen while in browser mode, stay in browser mode (full-tab)
          if (!inFullscreen && activeMode === "browser") {
              console.log("[FullscreenEvent] Exited fullscreen, staying in browser mode (full-tab).");
              // Don't change activeMode - keep it as "browser" so we stay in full-tab
              // The browser mode positioning is already applied, we just exited the fullscreen layer on top
          }
      };

      const handleFullscreenError = (event) => {
          console.error("[FullscreenEvent] Fullscreen error:", event);
          if (event.message) console.error("Error Message:", event.message);
          if (event.name) console.error("Error Name:", event.name);
          console.error("Possible cause: Fullscreen request not initiated by a user gesture, or element is not allowed to go fullscreen.");
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('fullscreenerror', handleFullscreenError);

      return () => {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          document.removeEventListener('fullscreenerror', handleFullscreenError);
          console.log("[ScreenModeHelper] Fullscreen event listeners removed.");
      };
  }, [activeMode]);


  // Mode icon mapping using dc.Icon
  const modeIcons = {
    browser: "maximize",
    window: "square",
    pip: "picture-in-picture-2",
    default: "circle",
  };

  const buttonStyle = (isActive) => ({
    width: "48px",
    height: "48px",
    cursor: "pointer",
    backgroundColor: isActive ? "rgba(139, 92, 246, 0.2)" : "rgba(0, 0, 0, 0.3)",
    border: isActive ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    transition: "all 0.2s ease",
    backdropFilter: "blur(10px)",
    pointerEvents: "auto",
    userSelect: "none",
  });

  // Filter out "character" mode to remove from display
  const modesToDisplay = allowedScreenModes.filter((mode) => mode !== "none" && mode !== "character");

  return h('div', {
    style: {
      position: "absolute",
      top: "16px",
      right: "16px",
      zIndex: 9999,
      display: "flex",
      gap: "8px",
      background: "rgba(0, 0, 0, 0.3)",
      borderRadius: "12px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      pointerEvents: "auto",
      userSelect: "none",
      padding: "8px",
    }
  },
    modesToDisplay.map((mode) => {
      // Create better tooltip text
      let tooltipText = mode.charAt(0).toUpperCase() + mode.slice(1) + " Mode";
      if (mode === "browser") {
        tooltipText = activeMode === "browser" ? "Exit Fullscreen (ESC)" : "Enter Fullscreen";
      }
      
      return h('button', {
        key: mode,
        type: "button",
        onMouseDown: (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("[ScreenModeHelper] Button mousedown for mode:", mode);
          toggleMode(mode);
        },
        // Browser button is active only when in fullscreen, other buttons when in that mode
        style: buttonStyle(mode === "browser" ? isInFullscreen : activeMode === mode),
        title: tooltipText,
      },
        h(dc.Icon, { 
          icon: modeIcons[mode], 
          style: { 
            fontSize: "20px", 
            color: (mode === "browser" ? isInFullscreen : activeMode === mode) ? "#8b5cf6" : "rgba(255, 255, 255, 0.7)",
            pointerEvents: "none",
          } 
        })
      );
    }),
    activeMode === "pip" && h('button', {
      type: "button",
      onMouseDown: (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[ScreenModeHelper] Close PiP button clicked");
        toggleMode("pip");
      },
      style: buttonStyle(false),
      title: "Close Pip",
    },
      h(dc.Icon, { 
        icon: "x", 
        style: { 
          fontSize: "20px", 
          color: "rgba(255, 255, 255, 0.7)",
          pointerEvents: "none",
        } 
      })
    )
  );
};

return { ScreenModeHelper };
```


