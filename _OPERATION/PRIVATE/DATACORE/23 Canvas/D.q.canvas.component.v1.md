

# ViewComponent

```js
const filename = "_OPERATION/PRIVATE/DATACORE/23 Canvas/D.q.canvas.component.v1.md"; // Used for linking to helpers within this file

const { ScreenModeHelper } = await dc.require(
  dc.headerLink(filename, "ScreenModeHelper")
);

const { LUCIDE_HOME_ICON, LUCIDE_SUN_ICON, LUCIDE_MOON_ICON, LUCIDE_PLUS_ICON, LUCIDE_TRASH_ICON, LUCIDE_PENCIL_ICON, LUCIDE_MENU_ICON, LUCIDE_LOCK_ICON, LUCIDE_UNLOCK_ICON, LUCIDE_SAVE_ICON } = await dc.require(
  dc.headerLink(filename, "LucideIcons")
);

const { useState, useRef, useEffect, useCallback, Fragment } = dc;

const ZOOM_SPEED = 0.05;
const PAN_SPEED = 0.5;

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
    modalBackground: '#2c2c2c', inputBackground: '#3a3a3a', inputBorder: '#555',
    textColor: 'white', buttonSaveBackground: '#7c3aed', buttonSaveHover: '#6d28d9',
    buttonCancelBackground: '#4a4a4a', buttonCancelHover: '#5a4a5a', // Corrected typo here
  } : {
    modalBackground: 'white', inputBackground: '#f0f0f0', inputBorder: '#ccc',
    textColor: 'black', buttonSaveBackground: '#007bff', buttonSaveHover: '#0056b3',
    buttonCancelBackground: '#e0e0e0', buttonCancelHover: '#d0d0d0',
  };

  const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  };
  const modalContentStyle = {
    backgroundColor: currentTheme.modalBackground, padding: '25px', borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)', color: currentTheme.textColor,
    maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', gap: '15px',
  };
  const inputStyle = {
    padding: '10px', borderRadius: '5px', border: `1px solid ${currentTheme.inputBorder}`,
    backgroundColor: currentTheme.inputBackground, color: currentTheme.textColor,
    fontSize: '1em', width: 'calc(100% - 22px)',
  };
  const modalButtonContainerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' };
  const buttonStyle = {
    padding: '10px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer',
    fontSize: '0.95em', fontWeight: 'bold', transition: 'background-color 0.2s ease', color: 'white',
  };
  const saveButtonStyle = { ...buttonStyle, backgroundColor: currentTheme.buttonSaveBackground };
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: currentTheme.buttonCancelBackground };

  return h('div', { style: modalOverlayStyle },
    h('div', { style: modalContentStyle },
      h('h3', { style: { margin: '0', color: currentTheme.textColor } }, "Save Canvas Data"),
      h('p', { style: { color: currentTheme.textColor } }, "Enter a filename for your canvas data:"),
      h('input', {
        type: "text", value: fileName, onChange: (e) => setFileName(e.target.value),
        onKeyPress: handleKeyPress, ref: inputRef, style: inputStyle, placeholder: "e.g., my-canvas-data.json",
      }),
      h('div', { style: modalButtonContainerStyle },
        h('button', {
          onClick: handleSave, style: saveButtonStyle,
          onMouseEnter: (e) => e.target.style.backgroundColor = currentTheme.buttonSaveHover,
          onMouseLeave: (e) => e.target.style.backgroundColor = currentTheme.buttonSaveBackground,
        }, "Save"),
        h('button', {
          onClick: () => { onCancel(); focusCanvas(); }, style: cancelButtonStyle,
          onMouseEnter: (e) => e.target.style.backgroundColor = currentTheme.buttonCancelHover,
          onMouseLeave: (e) => e.target.style.backgroundColor = currentTheme.buttonCancelBackground,
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

function Box({ box, isSelected, onMouseDownBox, onMouseDownHandle, globalIsDarkMode, h, dc, isCanvasLocked }) {
  const [LoadedChildComponent, setLoadedChildComponent] = useState(null);
  const [isLoadingComponent, setIsLoadingComponent] = useState(false);
  const [componentLoadError, setComponentLoadError] = useState(null); // For errors during dc.require
  const [componentRuntimeError, setComponentRuntimeError] = useState(null); // For errors during render/lifecycle of LoadedChildComponent

  useEffect(() => {
    setComponentRuntimeError(null); // Clear runtime error when component source/details change or load status changes

    if (!dc) {
      setComponentLoadError("Datacore engine not available.");
      setLoadedChildComponent(null); setIsLoadingComponent(false); return;
    }

    if (box.type === 'datacore-component' && box.filePath && box.header && box.functionName) {
      setIsLoadingComponent(true); setComponentLoadError(null);
      let isMounted = true; // Flag to prevent state updates on unmounted component

      (async () => {
        try {
          // CORRECTED: Use only box.filePath and box.header for dc.headerLink
          const linkToComponent = dc.headerLink(box.filePath, box.header);
          const dynamicModule = await dc.require(linkToComponent);

          if (!isMounted) return; // Exit if component unmounted while loading

          const ComponentToLoad = dynamicModule[box.functionName];
          if (typeof ComponentToLoad === 'function') { // Check if it's a function/component
            setLoadedChildComponent(() => ComponentToLoad);
          } else {
            throw new Error(`Component '${box.functionName}' from '${box.filePath}#${box.header}' not found or is not a function.`);
          }
        } catch (error) {
          if (!isMounted) return; // Exit if component unmounted while loading
          console.error(`Error loading Datacore component '${box.functionName}' from '${box.filePath}#${box.header}':`, error);
          setComponentLoadError(error.message || "Failed to load component.");
          setLoadedChildComponent(null);
        } finally {
          if (isMounted) {
            setIsLoadingComponent(false);
          }
        }
      })();

      return () => {
        isMounted = false; // Cleanup for the async loading process
      };
    } else {
      // Not a datacore-component, or details are missing/cleared
      setLoadedChildComponent(null); setIsLoadingComponent(false);
      if (box.type === 'datacore-component') {
          // This ensures the "Component Load Error" message appears if details are missing
          setComponentLoadError("Missing component details (filePath, header, or functionName).");
      } else {
          setComponentLoadError(null); // Clear load error for non-datacore types
      }
      return;
    }
  }, [box.type, box.filePath, box.header, box.functionName, dc]); // Dependencies for re-loading the component

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
        style: {
          width: 0, height: 0,
          borderLeft: `${box.width / 2}px solid transparent`,
          borderRight: `${box.width / 2}px solid transparent`,
          borderBottom: `${box.height}px solid ${box.baseColor}`,
        }
      }, box.label);
    } else if (box.type === 'datacore-component') {
      let componentDisplayContent;
      const errorStyle = {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', color: 'red',
        backgroundColor: globalIsDarkMode ? 'rgba(50,0,0,0.7)' : 'rgba(255,220,220,0.7)',
        border: '1px solid red', padding: '10px', boxSizing: 'border-box',
        fontSize: '12px', overflow: 'auto', textAlign: 'center',
      };
      const preStyle = {
        whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '10px',
        textAlign: 'left', maxHeight: '80px', overflowY: 'auto', // Adjusted maxHeight
        background: globalIsDarkMode ? '#403030' : '#fff0f0', padding: '5px',
        borderRadius: '4px', border: '1px dashed #ff8080', width: 'calc(100% - 10px)',
        margin: '5px auto'
      };

      if (isLoadingComponent) {
        componentDisplayContent = h('div', { style: { color: box.baseColor || (globalIsDarkMode ? 'white' : 'black'), fontSize: '14px', textAlign: 'center', lineHeight: 'normal', padding: '10px'} }, 'Loading component...');
      } else if (componentLoadError) {
        componentDisplayContent = h('div', { style: errorStyle },
          h('p', { style: { margin: '0 0 5px 0', fontWeight: 'bold' } }, `Component Load Error:`),
          h('pre', { style: preStyle }, componentLoadError)
        );
      } else if (componentRuntimeError) {
        componentDisplayContent = h('div', { style: errorStyle },
          h('p', { style: { margin: '0 0 5px 0', fontWeight: 'bold' } }, `Component Runtime Error:`),
          h('pre', { style: preStyle }, componentRuntimeError.toString()),
          // Show a snippet of the stack trace if available
          componentRuntimeError.stack && h('pre', { style: {...preStyle, maxHeight: '60px', fontSize: '9px'} }, componentRuntimeError.stack.substring(0, 300) + (componentRuntimeError.stack.length > 300 ? '...' : ''))
        );
      } else if (LoadedChildComponent) {
        try {
          // This try/catch primarily catches synchronous errors during this specific render pass.
          // It's not a full substitute for a React Error Boundary for async errors or errors in effects/event handlers.
          componentDisplayContent = h(LoadedChildComponent, {
            key: `${box.filePath}-${box.header}-${box.functionName}`, // Crucial for correct lifecycle
            style: { width: '100%', height: '100%' },
            isDarkMode: globalIsDarkMode,
            // Pass other props if your components expect them e.g. boxData: box
          });
        } catch (error) {
          console.error(`Runtime error rendering Datacore component '${box.functionName}' from '${box.filePath}':`, error);
          // Only set if not already set, to avoid potential infinite loops if error persists across re-renders
          if (!componentRuntimeError) {
            setComponentRuntimeError(error);
          }
          // Fallback UI for the current problematic render pass
          componentDisplayContent = h('div', { style: errorStyle },
            h('p', { style: { margin: '0 0 5px 0', fontWeight: 'bold' } }, `Render Error (will update):`),
            h('pre', { style: preStyle }, error.toString())
          );
        }
      } else {
        // Fallback if not loading, no error, but no component (e.g., details missing after initial load)
        componentDisplayContent = h('div', { style: { color: box.baseColor || (globalIsDarkMode ? 'white' : 'black'), fontSize: '14px', textAlign: 'center', lineHeight: 'normal', padding: '10px' } }, box.label || "Configure Datacore Component");
      }

      return h('div', {
        className: 'datacore-component-content-wrapper',
        style: {
          width: '100%', height: '100%',
          // pointerEvents should allow interaction with component content unless the box itself is selected (for dragging/resizing)
          pointerEvents: isSelected ? 'none' : 'auto',
        }
      }, componentDisplayContent);

    } else {
      return box.label;
    }
  };

  return (
    h('div', {
      className: "box-container",
      style: {
        position: "absolute", left: `${box.x}px`, top: `${box.y}px`,
        width: `${box.width}px`, height: `${box.height}px`,
        background: box.backgroundColor, opacity: box.opacity, border: box.border,
        borderRadius: box.type === 'circle' ? '50%' : '4px',
        display: "flex", alignItems: "center", justifyContent: "center",
        color: box.baseColor,
        fontSize: box.type === 'pure-text' ? '24px' : '16px',
        fontWeight: box.type === 'pure-text' ? 'bold' : 'normal',
        cursor: isCanvasLocked ? 'default' : (isSelected ? 'grab' : 'pointer'),
        // For datacore-components, pointerEvents are handled by its wrapper above.
        // For other types, if canvas is locked, disable pointer events.
        pointerEvents: isCanvasLocked && box.type !== 'datacore-component' ? 'none' : 'auto',
        boxShadow: isSelected ? "0 0 0 2px #007bff, 0 0 0 4px rgba(0, 123, 255, 0.3)" : "none",
        zIndex: isSelected ? 3 : 2,
        transition: 'box-shadow 0.1s ease-out', touchAction: 'none', // Important for preventing browser default touch actions like scroll/zoom
        overflow: 'hidden', // Keep overflow hidden for the main box
        // Specific styling for datacore components to allow them to fill the box
        ...(box.type === 'datacore-component' ? {
          justifyContent: 'flex-start', alignItems: 'flex-start', padding: '0',
        } : {})
      },
      onMouseDown: (e) => onMouseDownBox(e, box.id)
    },
      renderShapeContent(), // This now includes the error handling for datacore-components

      // MODIFIED: Removed h(Fragment, null, ...) wrapper for resize handles
      isSelected && !isCanvasLocked && (
        ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'].map(handleType =>
            h('div', {
              key: handleType, className: "resize-handle",
              style: resizeHandleStyle(handleType),
              onMouseDown: (e) => onMouseDownHandle(e, box.id, handleType)
            })
          )
      )
    )
  );
}

function CanvasControls({
  resetView, isDarkMode, setIsDarkMode, showAddMenu, setShowAddMenu,
  createNewBox, deleteSelectedBox, selectedBoxIds, toggleEditPanel,
  LUCIDE_HOME_ICON, LUCIDE_SUN_ICON, LUCIDE_MOON_ICON, LUCIDE_PLUS_ICON,
  LUCIDE_TRASH_ICON, LUCIDE_PENCIL_ICON, LUCIDE_MENU_ICON, LUCIDE_LOCK_ICON,
  LUCIDE_UNLOCK_ICON, LUCIDE_SAVE_ICON, addMenuRef, isCanvasLocked,
  setIsCanvasLocked, handleSaveCanvas, handleLoadCanvas, availableSaves,
  loadSpecificCanvas, loadMenuRef, showLoadMenu, setShowLoadMenu, focusCanvas
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const burgerMenuContainerRef = useRef(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const saveMenuRef = useRef(null);

  // Helper function to extract the data URI part from the `url()` string
  const extractDataUri = useCallback((urlWrapperString) => {
    if (!urlWrapperString || typeof urlWrapperString !== 'string' || !urlWrapperString.startsWith("url('") || !urlWrapperString.endsWith("')")) {
      console.warn("Invalid Lucide icon string format:", urlWrapperString);
      return ''; // Return empty string for invalid format
    }
    return urlWrapperString.slice(5, -2); // Remove "url('" and "')"
  }, []);

  const commonControlButtonStyle = {
    padding: "0", background: "#4a4a4a", border: "none", borderRadius: "6px",
    cursor: "pointer", width: "42px", height: "42px", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "0",
    backgroundRepeat: "no-repeat", backgroundPosition: "center", zIndex: 10,
    transition: "background-color 0.2s, box-shadow 0.2s", boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  };
  const menuItemStyle = {
    padding: '10px 15px', textAlign: 'left', background: 'none', border: 'none',
    color: 'inherit', cursor: 'pointer', fontSize: '14px', display: 'flex',
    alignItems: 'center', gap: '8px', width: '100%', borderRadius: '0',
    // Removed direct CSS string for borderBottom, as it needs to be inside an object for style prop
    // This was already handled by the `currentTheme.border` dynamically for the conditional menu items
    // and was commented out in the original code, but explicitly noting it.
    // '&:not(:last-child)': { borderBottom: `1px solid ${isDarkMode ? '#444' : '#ccc'}` }, 
    '&:hover': { background: isDarkMode ? '#4a4a4a' : '#e0e0e0', }
  };
  const currentTheme = isDarkMode ? { background: '#2c2c2c', border: '#666', textColor: 'white', } : { background: 'white', border: 'black', textColor: 'black', };

  // Helper to create toggle functions that also close other menus and focus canvas
  const createToggle = (setter, ...otherSettersToFalse) => useCallback((shouldNotFocusCanvas) => { // Added shouldNotNotFocusCanvas param
    setter(prev => {
      const newState = !prev;
      if (!newState && !shouldNotFocusCanvas) focusCanvas(); // If closing this menu and not explicitly told not to, focus canvas
      return newState;
    });
    otherSettersToFalse.forEach(s => s(false));
  }, [setter, ...otherSettersToFalse, focusCanvas]);

  const toggleAddMenu = createToggle(setShowAddMenu, setShowSaveMenu, setShowLoadMenu);
  const toggleBurgerMenu = createToggle(setIsMenuOpen, setShowAddMenu, setShowSaveMenu, setShowLoadMenu);
  const toggleSaveMenuInternal = createToggle(setShowSaveMenu, setShowAddMenu, setShowLoadMenu);

  // Special toggle for Load Menu, because it also triggers handleLoadCanvas
  const toggleLoadMenuInternal = useCallback(() => {
    setShowLoadMenu(prev => {
      const newState = !prev;
      if (!newState) focusCanvas(); // If closing load menu, focus canvas
      return newState;
    });
    setShowAddMenu(false);
    setShowSaveMenu(false);
    // Only call handleLoadCanvas if the menu is *about to open* (was false, now true)
    // Avoids fetching list when closing or if it's already open
    if (!showLoadMenu) handleLoadCanvas();
  }, [setShowLoadMenu, setShowAddMenu, setShowSaveMenu, handleLoadCanvas, focusCanvas, showLoadMenu]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickOnBurgerButton = event.target.closest('.burger-menu-button');
      const isClickInsideBurgerMenu = burgerMenuContainerRef.current && burgerMenuContainerRef.current.contains(event.target);
      const isClickInsideAddMenu = addMenuRef.current && addMenuRef.current.contains(event.target);
      const isClickInsideSaveMenu = saveMenuRef.current && saveMenuRef.current.contains(event.target);
      const isClickInsideLoadMenu = loadMenuRef.current && loadMenuRef.current.contains(event.target);

      // Only close menus if click is outside all of them, and not on the burger button itself
      if (isMenuOpen && !isClickOnBurgerButton && !isClickInsideBurgerMenu && !isClickInsideAddMenu && !isClickInsideSaveMenu && !isClickInsideLoadMenu) {
        setIsMenuOpen(false);
        setShowAddMenu(false);
        setShowSaveMenu(false);
        setShowLoadMenu(false);
        focusCanvas(); // Focus canvas when closing menu by clicking outside
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, burgerMenuContainerRef, addMenuRef, saveMenuRef, loadMenuRef, setShowAddMenu, setShowSaveMenu, setShowLoadMenu, focusCanvas]);

  const handleSelectLoadedCanvas = useCallback((filename) => {
    loadSpecificCanvas(filename);
    setIsMenuOpen(false);
    setShowSaveMenu(false);
    setShowLoadMenu(false);
    focusCanvas(); // Focus canvas after loading a save
  }, [loadSpecificCanvas, setIsMenuOpen, setShowSaveMenu, setShowLoadMenu, focusCanvas]);

  const icon = (src, alt) => h('img', { src: extractDataUri(src), alt: alt, style: { width: '18px', height: '18px' } });

  return h('div', {
    style: {
      position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px', zIndex: 10
    }
  },
    h('button', {
      title: "Open Menu", className: "burger-menu-button", style: commonControlButtonStyle,
      onClick: toggleBurgerMenu
    }, icon(LUCIDE_MENU_ICON, "Menu")),

    isMenuOpen && h('div', {
      ref: burgerMenuContainerRef,
      style: {
        position: 'absolute', top: 'calc(100% + 10px)', left: '0',
        background: currentTheme.background, border: `1px solid ${currentTheme.border}`,
        borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 12,
        display: 'flex', flexDirection: 'column', minWidth: '200px', color: currentTheme.textColor,
      }
    },
      h('button', { title: "Reset View", style: menuItemStyle, onClick: () => { resetView(); setIsMenuOpen(false); focusCanvas(); } },
        icon(LUCIDE_HOME_ICON, "Home"), "Reset View"
      ),
      h('button', { title: isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode", style: menuItemStyle, onClick: () => { setIsDarkMode(prev => !prev); focusCanvas(); } },
        icon(isDarkMode ? LUCIDE_SUN_ICON : LUCIDE_MOON_ICON, "Theme Toggle"), isDarkMode ? "Light Mode" : "Dark Mode"
      ),
      h('button', {
        title: isCanvasLocked ? "Unlock Canvas Interactions" : "Lock Canvas Interactions",
        style: menuItemStyle,
        onClick: () => { setIsCanvasLocked(prev => !prev); setIsMenuOpen(false); focusCanvas(); }
      }, icon(isCanvasLocked ? LUCIDE_UNLOCK_ICON : LUCIDE_LOCK_ICON, "Lock Canvas"), isCanvasLocked ? "Unlock Canvas" : "Lock Canvas"
      ),

      h('div', { style: { position: 'relative', width: '100%', } },
        h('button', {
          title: "Add New Shape", style: {
            ...menuItemStyle, borderBottom: `1px solid ${isDarkMode ? '#444' : '#ccc'}`,
            cursor: isCanvasLocked ? 'not-allowed' : 'pointer', opacity: isCanvasLocked ? 0.6 : 1,
          }, onClick: isCanvasLocked ? null : toggleAddMenu, disabled: isCanvasLocked,
        }, icon(LUCIDE_PLUS_ICON, "Add Shape"), "Add New Shape"
        ),
        showAddMenu && (
          h('div', {
            ref: addMenuRef, style: {
              position: 'absolute', top: '0', left: 'calc(100% + 5px)',
              background: currentTheme.background, border: `1px solid ${currentTheme.border}`,
              borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 13,
              display: 'flex', flexDirection: 'column', minWidth: '180px', color: currentTheme.textColor,
            }
          },
            // Options for adding different box types
            ['text', 'pure-text', 'circle', 'triangle', 'datacore-component'].map(type =>
              h('button', {
                key: type, style: { ...menuItemStyle, borderBottom: type === 'datacore-component' ? 'none' : `1px solid ${currentTheme.border}` },
                onClick: () => { createNewBox(type); setIsMenuOpen(false); setShowAddMenu(false); focusCanvas(); }, disabled: isCanvasLocked
              }, `Add ${type.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase())}`) // Format type for display
            )
          )
        )
      ),

      h('div', { style: { position: 'relative', width: '100%', } },
        h('button', {
          title: "Manage Canvas Saves", style: {
            ...menuItemStyle, borderBottom: `1px solid ${isDarkMode ? '#444' : '#ccc'}`,
          }, onClick: toggleSaveMenuInternal,
        }, icon(LUCIDE_SAVE_ICON, "Save"), "Manage Saves"
        ),
        showSaveMenu && (
          h('div', {
            ref: saveMenuRef, style: {
              position: 'absolute', top: '0', left: 'calc(100% + 5px)',
              background: currentTheme.background, border: `1px solid ${currentTheme.border}`,
              borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 13,
              display: 'flex', flexDirection: 'column', minWidth: '200px', color: currentTheme.textColor, padding: '0',
            }
          },
            h('button', { style: { ...menuItemStyle, borderBottom: `1px solid ${currentTheme.border}` }, onClick: () => { handleSaveCanvas(); setShowSaveMenu(false); setIsMenuOpen(false); focusCanvas(); } }, "Save Current Canvas"),
            h('button', { style: menuItemStyle, onClick: toggleLoadMenuInternal }, "Load Saved Canvas")
          )
        )
      ),

      showLoadMenu && (
        h('div', {
          ref: loadMenuRef, style: {
            position: 'absolute',
            // Position relative to save menu if open, otherwise relative to main menu
            top: '0', left: showSaveMenu ? 'calc(200% + 10px)' : 'calc(100% + 5px)',
            background: currentTheme.background, border: `1px solid ${currentTheme.border}`,
            borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 14,
            display: 'flex', flexDirection: 'column', minWidth: '220px', maxHeight: '300px',
            overflowY: 'auto', color: currentTheme.textColor,
          }
        },
          availableSaves.length > 0 ? (
            availableSaves.map(fileName =>
              h('button', {
                key: fileName, style: menuItemStyle,
                onClick: () => handleSelectLoadedCanvas(fileName)
              }, fileName.replace(/\.json$/, ''))
            )
          ) : (
            h('div', { style: { padding: '10px 15px', fontSize: '12px', color: currentTheme.textColor, opacity: 0.7 } }, "No saved canvases found.")
          )
        )
      ),

      h('button', {
        title: "Delete Selected Box(es) (or press Delete/Backspace)",
        style: {
          ...menuItemStyle,
          color: (selectedBoxIds.length > 0 && !isCanvasLocked) ? '#dc3545' : currentTheme.textColor,
          cursor: (selectedBoxIds.length > 0 && !isCanvasLocked) ? 'pointer' : 'not-allowed',
          opacity: (selectedBoxIds.length > 0 && !isCanvasLocked) ? 1 : 0.6,
        },
        onClick: () => { deleteSelectedBox(); setIsMenuOpen(false); focusCanvas(); }, // Call focusCanvas
        disabled: selectedBoxIds.length === 0 || isCanvasLocked,
      }, icon(LUCIDE_TRASH_ICON, "Delete Box"), "Delete Selected"
      ),

      h('button', {
        title: "Toggle Edit Panel for Selected Box",
        style: {
          ...menuItemStyle,
          color: (selectedBoxIds.length === 1 && !isCanvasLocked) ? '#007bff' : currentTheme.textColor,
          cursor: (selectedBoxIds.length === 1 && !isCanvasLocked) ? 'pointer' : 'not-allowed',
          opacity: (selectedBoxIds.length === 1 && !isCanvasLocked) ? 1 : 0.6,
        },
        onClick: () => { toggleEditPanel(); setIsMenuOpen(false); focusCanvas(); }, // Call focusCanvas
        disabled: selectedBoxIds.length !== 1 || isCanvasLocked,
      }, icon(LUCIDE_PENCIL_ICON, "Edit Box"), "Edit Selected"
      )
    )
  );
}

function EditPanel({ editingBoxProps, handleChangeEditField, handleSaveEdit, handleCancelEdit, isDarkMode, currentTheme, focusCanvas }) {
  if (!editingBoxProps) return null;

  const inputStyle = {
    padding: '8px', borderRadius: '4px',
    border: `1px solid ${currentTheme.border}`,
    background: isDarkMode ? '#3a3a3a' : '#f0f0f0',
    color: isDarkMode ? 'white' : 'black'
  };
  const labelStyle = { fontSize: '14px' };
  const fieldContainerStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };
  const buttonGroupStyle = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' };
  const buttonStyle = {
    padding: '8px 15px', borderRadius: '6px', border: 'none',
    color: 'white', cursor: 'pointer', transition: 'background-color 0.2s',
  };

  // Collect all child elements into an array to ensure correct rendering with dc.h
  const panelChildren = [
    h('h3', { style: { margin: '0 0 10px 0', fontSize: '18px', color: currentTheme.textColor } }, "Edit Box Properties")
  ];

  if (editingBoxProps.type === 'text' ||
      editingBoxProps.type === 'pure-text' ||
      editingBoxProps.type === 'datacore-component' ||
      editingBoxProps.type === 'circle' ||
      editingBoxProps.type === 'triangle'
  ) {
    panelChildren.push(
      h('div', { style: fieldContainerStyle },
        h('label', { htmlFor: "edit-label", style: labelStyle }, "Label:"),
        h('input', {
          id: "edit-label", type: "text", name: "label", value: editingBoxProps.label,
          onChange: handleChangeEditField, style: inputStyle
        })
      )
    );
  }

  // MODIFIED: Datacore component specific fields are now wrapped in a single div
  if (editingBoxProps.type === 'datacore-component') {
    panelChildren.push(
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, // Explicit container div
        h('div', { style: fieldContainerStyle },
          h('label', { htmlFor: "edit-filePath", style: labelStyle }, "File Path:"),
          h('input', {
            id: "edit-filePath", type: "text", name: "filePath", value: editingBoxProps.filePath,
            onChange: handleChangeEditField, placeholder: "e.g., MyComponent.md", style: inputStyle
          })
        ),
        h('div', { style: fieldContainerStyle },
          h('label', { htmlFor: "edit-header", style: labelStyle }, "Header:"),
          h('input', {
            id: "edit-header", type: "text", name: "header", value: editingBoxProps.header,
            onChange: handleChangeEditField, placeholder: "e.g., ViewComponent", style: inputStyle
          })
        ),
        h('div', { style: fieldContainerStyle },
          h('label', { htmlFor: "edit-functionName", style: labelStyle }, "Function Name:"),
          h('input', {
            id: "edit-functionName", type: "text", name: "functionName", value: editingBoxProps.functionName,
            onChange: handleChangeEditField, placeholder: "e.g., MyView", style: inputStyle
          })
        )
      )
    );
  }

  if (editingBoxProps.type === 'pure-text' || editingBoxProps.type === 'datacore-component' || editingBoxProps.type === 'triangle') {
    panelChildren.push(
      h('div', { style: fieldContainerStyle },
        h('label', { htmlFor: "edit-baseColor", style: labelStyle },
          editingBoxProps.type === 'pure-text' ? 'Text Color:' : 'Shape/Border Color (e.g., #hex, rgb(r,g,b), red):'
        ),
        h('input', {
          id: "edit-baseColor", type: "text", name: "baseColor", value: editingBoxProps.baseColor,
          onChange: handleChangeEditField, style: inputStyle
        })
      )
    );
  }

  if (editingBoxProps.type === 'text' || editingBoxProps.type === 'circle' || editingBoxProps.type === 'datacore-component') {
    panelChildren.push(
      h('div', { style: fieldContainerStyle },
        h('label', { htmlFor: "edit-backgroundColor", style: labelStyle }, "Background Color (e.g., #hex, rgb(r,g,b), red):"),
        h('input', {
          id: "edit-backgroundColor", type: "text", name: "backgroundColor", value: editingBoxProps.backgroundColor,
          onChange: handleChangeEditField, style: inputStyle
        })
      )
    );
  }

  panelChildren.push(
    h('div', { style: fieldContainerStyle },
      h('label', { htmlFor: "edit-opacity", style: labelStyle }, `Opacity: ${Math.round(editingBoxProps.opacity * 100)}%`),
      h('input', {
        id: "edit-opacity", type: "range", name: "opacity", min: "0", max: "1", step: "0.01",
        value: editingBoxProps.opacity, onChange: handleChangeEditField, style: { width: '100%', accentColor: '#007bff' }
      })
    )
  );

  panelChildren.push(
    h('div', { style: buttonGroupStyle },
      h('button', {
        onClick: () => { handleCancelEdit(); focusCanvas(); }, style: { ...buttonStyle, background: '#6c757d' }
      }, "Cancel"),
      h('button', {
        onClick: () => { handleSaveEdit(); focusCanvas(); }, style: { ...buttonStyle, background: '#007bff' }
      }, "Save")
    )
  );

  return (
    h('div', {
      className: "edit-panel",
      style: {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '20px',
        background: currentTheme.background, border: `1px solid ${currentTheme.border}`,
        borderRadius: '8px', padding: '15px', zIndex: 11, boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        color: currentTheme.textColor, display: 'flex', flexDirection: 'column', gap: '10px', width: '250px',
      }
    }, ...panelChildren) // Spread the collected children array here
  );
}

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
    let filePath = '', header = '', functionName = '';

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
      id: `box-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Ensure unique ID
      x: worldCenterX - newBoxWidth / 2, y: worldCenterY - newBoxHeight / 2,
      width: newBoxWidth, height: newBoxHeight,
      baseColor: defaultBaseColor, backgroundColor: defaultBackgroundColor,
      opacity: defaultOpacity, border: defaultBorder, label: newLabel,
      type: type, filePath: filePath, header: header, functionName: functionName,
    };

    setBoxes(prevBoxes => [...prevBoxes, newBox]);
    setSelectedBoxIds([newBox.id]);
    setIsEditing(true);
    setEditingBoxProps({ ...newBox });
    setShowAddMenu(false);
    focusCanvas(); // Focus canvas after adding a new box
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
    focusCanvas(); // Focus canvas after deleting boxes
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
          setIsEditing(true);
          setEditingBoxProps({ ...boxToEdit });
        }
      }
    } else {
        setIsEditing(false);
        setEditingBoxProps(null);
    }
    setShowAddMenu(false);
    focusCanvas(); // Focus canvas after toggling edit panel (important when closing it)
  }, [selectedBoxIds, isEditing, boxes, setIsEditing, setEditingBoxProps, setShowAddMenu, focusCanvas]);

  const handleSaveEdit = useCallback(() => {
    setBoxes(prevBoxes => prevBoxes.map(box => {
      if (box.id === editingBoxProps.id) {
        // Spread editingBoxProps to update all editable fields
        return { ...box, ...editingBoxProps };
      }
      return box;
    }));
    setIsEditing(false);
    setEditingBoxProps(null);
    // focusCanvas will be called by EditPanel after these
  }, [editingBoxProps, setBoxes, setIsEditing, setEditingBoxProps]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingBoxProps(null);
    // focusCanvas will be called by EditPanel after these
  }, [setIsEditing, setEditingBoxProps]);

  const handleChangeEditField = useCallback((e) => {
    const { name, value } = e.target;
    setEditingBoxProps(prev => {
      let updatedValue = value;
      if (name === 'opacity') {
        updatedValue = parseFloat(value);
        if (isNaN(updatedValue)) updatedValue = 0;
        updatedValue = Math.max(0, Math.min(1, updatedValue));
      }
      return { ...prev, [name]: updatedValue };
    });
  }, [setEditingBoxProps]);

  return {
    createNewBox, deleteSelectedBox, toggleEditPanel,
    handleSaveEdit, handleCancelEdit, handleChangeEditField,
  };
}

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
    if (isCanvasLocked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const currentPosition = positionRef.current;
    const currentZoom = zoomRef.current;

    if (e.ctrlKey) { // Zoom
        e.preventDefault();
        const prevZoom = currentZoom;
        const zoomFactor = e.deltaY > 0 ? 1 / (1 + ZOOM_SPEED) : (1 + ZOOM_SPEED);
        const newZoomUnbounded = prevZoom * zoomFactor;
        const newZoom = Math.max(0.1, Math.min(newZoomUnbounded, 10)); // Clamp zoom

        const worldMouseX_before = (mouseX - currentPosition.x) / prevZoom;
        const worldMouseY_before = (mouseY - currentPosition.y) / prevZoom;

        const newPosX = mouseX - (worldMouseX_before * newZoom);
        const newPosY = mouseY - (worldMouseY_before * newZoom);

        setZoom(newZoom);
        setPosition({ x: newPosX, y: newPosY });
    } else { // Pan
        let shouldPan = false;
        let dx = 0;
        let dy = 0;

        if (e.deltaX !== 0) {
            dx = -e.deltaX * PAN_SPEED;
            shouldPan = true;
        }
        if (e.deltaY !== 0) {
            dy = -e.deltaY * PAN_SPEED;
            shouldPan = true;
        }

        if (shouldPan) {
            e.preventDefault();
            setPosition((prevPos) => ({ x: prevPos.x + dx, y: prevPos.y + dy }));
        }
    }
  }, [canvasRef, positionRef, zoomRef, setPosition, setZoom, ZOOM_SPEED, PAN_SPEED, isCanvasLocked]);

  const handleBoxMouseDown = useCallback((e, boxId) => {
    if (isCanvasLocked) return;
    e.stopPropagation(); // Prevent canvas pan/marquee selection

    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    let newSelectedIds = [...selectedBoxIds];
    const isBoxCurrentlySelected = newSelectedIds.includes(boxId);
    
    // Flag to determine if dragging should be initialized after selection
    let shouldInitDrag = true;

    // Handle single click on datacore-component (to open edit panel immediately)
    if (box.type === 'datacore-component' && !isBoxCurrentlySelected && !isControlDownRef.current && !isShiftDownRef.current) {
        setSelectedBoxIds([boxId]);
        setIsEditing(true);
        setEditingBoxProps({ ...box });
        setShowAddMenu(false);
        shouldInitDrag = false; // Don't initiate drag on immediate edit
    }
    // Handle Shift+Click (add/remove from selection)
    else if (isShiftDownRef.current) {
        if (isBoxCurrentlySelected) {
            newSelectedIds = newSelectedIds.filter(id => id !== boxId);
        } else {
            newSelectedIds = [...newSelectedIds, boxId];
        }
    }
    // Handle Ctrl/Cmd+Click (toggle selection)
    else if (isControlDownRef.current) {
        if (isBoxCurrentlySelected) {
            newSelectedIds = newSelectedIds.filter(id => id !== boxId);
        } else {
            newSelectedIds = [...newSelectedIds, boxId];
        }
    }
    // Handle single click (select only this box)
    else {
        if (!isBoxCurrentlySelected || newSelectedIds.length > 1) {
            newSelectedIds = [boxId];
        }
    }

    setSelectedBoxIds(newSelectedIds);
    // If only one box is selected, open edit panel for it. Otherwise close edit panel.
    setIsEditing(newSelectedIds.length === 1);
    setEditingBoxProps(newSelectedIds.length === 1 ? { ...boxes.find(b => b.id === newSelectedIds[0]) } : null);
    setShowAddMenu(false);

    // Initialize dragging if 'shouldInitDrag' is true and there are boxes selected
    if (shouldInitDrag && newSelectedIds.length > 0) {
        isBoxDraggingRef.current = true;
        // Make sure to use the *final* newSelectedIds for initial states
        initialSelectedBoxStates.current = boxes
            .filter(b => newSelectedIds.includes(b.id))
            .map(b => ({ ...b }));
        initialWorldMousePosRef.current = screenToWorld(e.clientX, e.clientY);
    }
    
    focusCanvas(); // Ensure canvas gains focus so keyboard shortcuts work
    e.preventDefault(); // Prevent browser default drag behavior on elements
  }, [boxes, selectedBoxIds, isControlDownRef, isShiftDownRef, screenToWorld, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, isCanvasLocked, focusCanvas]);


  const handleHandleMouseDown = useCallback((e, boxId, handleType) => {
    if (isCanvasLocked) return;
    e.stopPropagation();
    e.preventDefault();

    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    setSelectedBoxIds([boxId]);
    isResizingBoxRef.current = true;
    setIsEditing(false); // Close edit panel during resize
    setShowAddMenu(false); // Close add menu during resize
    resizeHandle.current = handleType;
    initialBoxProps.current = { ...box };
    focusCanvas(); // Focus canvas after initiating resize
  }, [boxes, setSelectedBoxIds, setIsEditing, setShowAddMenu, isCanvasLocked, focusCanvas]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    lastKnownMouseScreenPosRef.current = { x: e.clientX, y: e.clientY };

    if (isCanvasDraggingRef.current) {
      const dxScreen = e.clientX - lastMousePosRef.current.x;
      const dyScreen = e.clientY - lastMousePosRef.current.y;
      
      setPosition((prevPos) => ({
        x: prevPos.x + dxScreen,
        y: prevPos.y + dyScreen,
      }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else if (isBoxDraggingRef.current && initialSelectedBoxStates.current.length > 0) {
      const { x: currentWorldMouseX, y: currentWorldMouseY } = screenToWorld(e.clientX, e.clientY);
      const deltaX = currentWorldMouseX - initialWorldMousePosRef.current.x;
      const deltaY = currentWorldMouseY - initialWorldMousePosRef.current.y;

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
    } else if (isResizingBoxRef.current && selectedBoxIds.length === 1 && initialBoxProps.current) {
      const { x: worldMouseX, y: worldMouseY } = screenToWorld(e.clientX, e.clientY);
      const initial = initialBoxProps.current;
      const handle = resizeHandle.current;
      const minSize = 20;

      setBoxes(prevBoxes => prevBoxes.map(box => {
        if (box.id === selectedBoxIds[0]) {
          let newX = initial.x;
          let newY = initial.y;
          let newWidth = initial.width;
          let newHeight = initial.height;

          switch (handle) {
            case 'tl': newX = worldMouseX; newY = worldMouseY; newWidth = initial.width + (initial.x - newX); newHeight = initial.height + (initial.y - newY); break;
            case 'tr': newY = worldMouseY; newWidth = worldMouseX - initial.x; newHeight = initial.height + (initial.y - newY); break;
            case 'bl': newX = worldMouseX; newWidth = initial.width + (initial.x - newX); newHeight = worldMouseY - initial.y; break;
            case 'br': newWidth = worldMouseX - initial.x; newHeight = worldMouseY - initial.y; break;
            case 't': newY = worldMouseY; newHeight = initial.height + (initial.y - newY); break;
            case 'b': newHeight = worldMouseY - initial.y; break;
            case 'l': newX = worldMouseX; newWidth = initial.width + (initial.x - newX); break;
            case 'r': newWidth = worldMouseX - initial.x; break;
          }

          if (newWidth < minSize) {
            if (handle.includes('l')) newX = initial.x + initial.width - minSize;
            newWidth = minSize;
          }
          if (newHeight < minSize) {
            if (handle.includes('t')) newY = initial.y + initial.height - minSize;
            newHeight = minSize;
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

      const canvasRect = canvas.getBoundingClientRect();
      const relativeStartX = startX - canvasRect.left;
      const relativeStartY = startY - canvasRect.top;
      const relativeCurrentX = currentX - canvasRect.left;
      const relativeCurrentY = currentY - canvasRect.top;

      setMarqueeRect({
        x: Math.min(relativeStartX, relativeCurrentX),
        y: Math.min(relativeStartY, relativeCurrentY),
        width: Math.abs(relativeStartX - relativeCurrentX),
        height: Math.abs(relativeStartY - relativeCurrentY),
      });
    }
  }, [setPosition, setBoxes, screenToWorld, selectedBoxIds, canvasRef, setMarqueeRect, initialWorldMousePosRef, initialBoxProps, initialSelectedBoxStates, lastKnownMouseScreenPosRef]);

  const handleMouseUp = useCallback((event) => {
    isCanvasDraggingRef.current = false;
    isBoxDraggingRef.current = false;
    isResizingBoxRef.current = false;
    resizeHandle.current = null;
    initialBoxProps.current = null;
    initialSelectedBoxStates.current = [];
    initialWorldMousePosRef.current = { x: 0, y: 0 };

    if (isMarqueeSelectingRef.current) {
        isMarqueeSelectingRef.current = false;
        setMarqueeRect(null);

        const canvas = canvasRef.current;
        if (!canvas) {
            console.error("Canvas ref is null on mouseUp for marquee. Cannot perform selection.");
            return;
        }

        const startX = marqueeStartScreenPosRef.current.x;
        const startY = marqueeStartScreenPosRef.current.y;
        const endX = event.clientX;
        const endY = event.clientY;

        const marqueeWorldStart = screenToWorld(startX, startY);
        const marqueeWorldEnd = screenToWorld(endX, endY);

        const marqueeMinX = Math.min(marqueeWorldStart.x, marqueeWorldEnd.x);
        const marqueeMinY = Math.min(marqueeWorldStart.y, marqueeWorldEnd.y);
        const marqueeMaxX = Math.max(marqueeWorldStart.x, marqueeWorldEnd.x);
        const marqueeMaxY = Math.max(marqueeWorldStart.y, marqueeWorldEnd.y);

        const newlySelectedIds = boxes.filter(box => {
            const boxMinX = box.x;
            const boxMinY = box.y;
            const boxMaxX = box.x + box.width;
            const boxMaxY = box.y + box.height;

            const overlaps = !(boxMaxX < marqueeMinX ||
                             boxMinX > marqueeMaxX ||
                             boxMaxY < marqueeMinY ||
                             boxMinY > marqueeMaxY);
            return overlaps;
        }).map(box => box.id);

        if (isControlDownRef.current || isShiftDownRef.current) {
            let currentSelection = [...selectedBoxIds];
            newlySelectedIds.forEach(id => {
                if (currentSelection.includes(id)) {
                    currentSelection = currentSelection.filter(selectedId => selectedId !== id);
                } else {
                    currentSelection.push(id);
                }
            });
            setSelectedBoxIds(currentSelection);
        } else {
            setSelectedBoxIds(newlySelectedIds);
        }
        focusCanvas(); // Focus canvas after marquee selection
    }
  }, [selectedBoxIds, isControlDownRef, isShiftDownRef, setMarqueeRect, boxes, screenToWorld, canvasRef, focusCanvas]);

  const onCanvasMouseDown = useCallback((e) => {
    const isClickOnBoxOrHandle = e.target.closest('.box-container');
    const isClickOnEditPanel = e.target.closest('.edit-panel');
    const isClickOnAddMenu = addMenuRef.current && addMenuRef.current.contains(e.target);
    const isClickOnScreenHelperButton = e.target.closest('.screen-mode-button');
    const isClickOnBurgerMenuButton = e.target.closest('.burger-menu-button');
    // Also check for click on save/load menus
    const isClickOnSaveMenu = addMenuRef.current && addMenuRef.current.contains(e.target); // This might be incorrect, check if addMenuRef is shared or separate refs for Save/Load menus
    const isClickOnLoadMenu = addMenuRef.current && addMenuRef.current.contains(e.target); // This might be incorrect, check if addMenuRef is shared or separate refs for Save/Load menus

    if (isCanvasLocked) {
      if (!isClickOnBoxOrHandle && !isClickOnEditPanel && !isClickOnAddMenu && !isClickOnScreenHelperButton && !isClickOnBurgerMenuButton && !isClickOnSaveMenu && !isClickOnLoadMenu) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    if (isClickOnBoxOrHandle || isClickOnEditPanel || isClickOnAddMenu || isClickOnScreenHelperButton || isClickOnBurgerMenuButton || isClickOnSaveMenu || isClickOnLoadMenu) {
        return;
    }

    if (!isControlDownRef.current && !isSpacebarDownRef.current && !isShiftDownRef.current) {
        setSelectedBoxIds([]);
        setIsEditing(false);
        setEditingBoxProps(null);
        setShowAddMenu(false);
    }
    
    if (isSpacebarDownRef.current) {
        isCanvasDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    } else {
        isMarqueeSelectingRef.current = true;
        marqueeStartScreenPosRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopPropagation();
    }
    focusCanvas(); // Focus canvas when clicking on empty canvas space
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
    addMenuRef, // This is only used for the click outside logic.
  };
}

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
    const folderPath = ".datacore/dc.canvas";
    const fullPath = `${folderPath}/${filename}`;
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
        const loadedData = JSON.parse(fileContent);

        if (loadedData.canvasState) {
            setPosition(loadedData.canvasState.position);
            setZoom(loadedData.canvasState.zoom);
            // Ensure these properties exist before setting, or provide defaults
            setIsDarkMode(loadedData.canvasState.isDarkMode ?? true);
            setIsCanvasLocked(loadedData.canvasState.isCanvasLocked ?? false);
        }
        if (loadedData.boxes) {
            setBoxes(loadedData.boxes);
        }

        setSelectedBoxIds([]);
        setIsEditing(false);
        setEditingBoxProps(null);
        setShowAddMenu(false);
        focusCanvas(); // Focus canvas after loading a save

        if (dc.app && dc.app.flash && typeof dc.app.flash.success === 'function') {
            dc.app.flash.success(`Canvas '${filename}' loaded successfully!`);
        }
    } catch (error) {
        console.error(`Error loading canvas '${filename}':`, error);
        if (dc.app && dc.app.flash && typeof dc.app.flash.error === 'function') {
            dc.app.flash.error(`Failed to load canvas '${filename}': ${error.message}`);
        }
    }
  }, [setBoxes, setPosition, setZoom, setIsDarkMode, setIsCanvasLocked, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, dc.app, focusCanvas]);

  const handleModalSave = useCallback(async (filename) => {
    setShowSaveModal(false);
    await performSave(filename);
    // focusCanvas already called by performSave
  }, [performSave, setShowSaveModal]);

  const handleModalCancel = useCallback(() => {
    setShowSaveModal(false);
    if (dc.app && dc.app.flash && typeof dc.app.flash.info === 'function') {
      dc.app.flash.info("Canvas save cancelled.");
    }
    focusCanvas(); // Focus canvas after cancelling modal
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

  return {
    handleSaveCanvas, handleLoadCanvas,
    handleModalSave, handleModalCancel, loadSpecificCanvas,
  };
}

function InfiniteCanvas({ isDarkMode: propIsDarkMode, engine }) {
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
    { id: 'box1', x: 200, y: 200, width: 100, height: 100, baseColor: "white", opacity: 0.7, backgroundColor: "rgb(0, 150, 255)", border: "none", label: "Sample (200,200)", type: 'text', filePath: '', header: '', functionName: '' },
    { id: 'box2', x: 800, y: 800, width: 100, height: 100, baseColor: "white", opacity: 0.7, backgroundColor: "rgb(255, 100, 0)", border: "none", label: "Far Box (800,800)", type: 'text', filePath: '', header: '', functionName: '' },
    { id: 'box3', x: 450, y: 450, width: 150, height: 70, baseColor: "black", opacity: 0.9, backgroundColor: "rgb(100, 200, 50)", border: "none", label: "Another Box", type: 'text', filePath: '', header: '', functionName: '' },
    { id: 'box4', x: 100, y: 500, width: 80, height: 80, baseColor: "white", opacity: 0.6, backgroundColor: "rgb(200, 50, 150)", border: "none", label: "Circle", type: 'circle', filePath: '', header: '', functionName: '' },
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
      background: 'white', border: 'black',
      gridMinor: 'rgba(200, 200, 200, __opacity__)',
      gridMajor: 'rgba(150, 150, 150, __opacity__)',
      gridSuper: 'rgba(100, 100, 100, __opacity__)',
      textColor: 'black',
    },
    dark: {
      background: '#2c2c2c', border: '#666',
      gridMinor: 'rgba(70, 70, 70, __opacity__)',
      gridMajor: 'rgba(100, 100, 100, __opacity__)',
      gridSuper: 'rgba(150, 150, 150, __opacity__)',
      textColor: 'white',
    }
  };
  const currentTheme = isDarkMode ? themes.dark : themes.light;

  const defaultContainerStyle = `
    height: 60vh; width: 100%; padding: 10px; border: 2px solid ${currentTheme.border};
    border-radius: 8px; overflow: hidden; background: ${currentTheme.background}; position: relative;
  `;

  // Centralized function to focus the canvas element
  const focusCanvas = useCallback(() => {
    if (interactiveCanvasRef.current && document.activeElement !== interactiveCanvasRef.current) {
        interactiveCanvasRef.current.focus();
        // console.log('focusCanvas called. Active element after focus:', document.activeElement?.tagName, document.activeElement === interactiveCanvasRef.current);
    }
  }, []);

  const screenToWorld = useCallback((clientX, clientY) => {
    const canvas = interactiveCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const currentPosition = positionRef.current;
    const currentZoom = zoomRef.current;

    const worldX = (screenX - currentPosition.x) / currentZoom;
    const worldY = (screenY - currentPosition.y) / currentZoom;
    return { x: worldX, y: worldY };
  }, [interactiveCanvasRef]);


  // useBoxManagement hook call
  const {
    createNewBox, deleteSelectedBox, toggleEditPanel,
    handleSaveEdit, handleCancelEdit, handleChangeEditField,
  } = useBoxManagement({
    boxes, setBoxes, selectedBoxIds, setSelectedBoxIds,
    isEditing, setIsEditing, editingBoxProps, setEditingBoxProps,
    setShowAddMenu, screenToWorld, canvasRef: interactiveCanvasRef,
    isDarkMode, isCanvasLocked, dc: dcInstance, focusCanvas
  });

  // New function for copying selected boxes
  const handleCopyObjects = useCallback(() => {
    if (isCanvasLocked) {
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.error === 'function') {
        dcInstance.app.flash.error("Canvas is locked. Cannot copy boxes.");
      }
      return;
    }
    if (selectedBoxIds.length > 0) {
      const selectedBoxes = boxes.filter(box => selectedBoxIds.includes(box.id));
      copiedBoxesRef.current = JSON.parse(JSON.stringify(selectedBoxes)); // Deep copy to prevent reference issues
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.info === 'function') {
        dcInstance.app.flash.info(`Copied ${selectedBoxes.length} box(es).`);
      }
    } else {
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.info === 'function') {
        dcInstance.app.flash.info("No boxes selected to copy.");
      }
    }
  }, [boxes, selectedBoxIds, isCanvasLocked, dcInstance.app]);

  // New function for pasting copied boxes
  const handlePasteObjects = useCallback(() => {
    if (isCanvasLocked) {
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.error === 'function') {
        dcInstance.app.flash.error("Canvas is locked. Cannot paste boxes.");
      }
      return;
    }
    if (copiedBoxesRef.current.length > 0) {
      const newPastedBoxes = copiedBoxesRef.current.map(box => {
        // Offset new boxes slightly so they don't paste directly on top
        const offset = 20; // Pixels to offset
        return {
          ...box,
          id: `box-${Date.now()}-${Math.random().toString(36).substring(7)}`, // New unique ID
          x: box.x + offset,
          y: box.y + offset,
        };
      });
      setBoxes(prevBoxes => [...prevBoxes, ...newPastedBoxes]);
      setSelectedBoxIds(newPastedBoxes.map(b => b.id)); // Select the newly pasted boxes
      setIsEditing(false); // Close edit panel for multiple selections
      setEditingBoxProps(null);
      setShowAddMenu(false);
      focusCanvas(); // Re-focus canvas
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.success === 'function') {
        dcInstance.app.flash.success(`Pasted ${newPastedBoxes.length} box(es).`);
      }
    } else {
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.info === 'function') {
        dcInstance.app.flash.info("Nothing copied to paste.");
      }
    }
  }, [setBoxes, setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu, focusCanvas, isCanvasLocked, dcInstance.app]);

  // New function for cutting selected boxes
  const handleCutObjects = useCallback(() => {
    if (isCanvasLocked) {
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.error === 'function') {
        dcInstance.app.flash.error("Canvas is locked. Cannot cut boxes.");
      }
      return;
    }
    if (selectedBoxIds.length > 0) {
      const count = selectedBoxIds.length;
      handleCopyObjects(); // First, copy them
      deleteSelectedBox(); // Then, delete them (this function already handles updating state and flash messages)
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.success === 'function') {
        dcInstance.app.flash.success(`Cut ${count} box(es).`); // Override flash message
      }
    } else {
      if (dcInstance.app && dcInstance.app.flash && typeof dcInstance.app.flash.info === 'function') {
        dcInstance.app.flash.info("No boxes selected to cut.");
      }
    }
  }, [selectedBoxIds, handleCopyObjects, deleteSelectedBox, isCanvasLocked, dcInstance.app]);


  // useCanvasInteractions hook call
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
    if (!canvas || boxes.length === 0) {
      setPosition({ x: -200, y: -200 });
      setZoom(1);
    } else {
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;

      let minWorldX = Infinity, minWorldY = Infinity;
      let maxWorldX = -Infinity, maxWorldY = -Infinity;

      boxes.forEach(box => {
        minWorldX = Math.min(minWorldX, box.x);
        minWorldY = Math.min(minWorldY, box.y);
        maxWorldX = Math.max(maxWorldX, box.x + box.width);
        maxWorldY = Math.max(maxWorldY, box.y + box.height);
      });

      const worldContentWidth = maxWorldX - minWorldX;
      const worldContentHeight = maxWorldY - minWorldY;

      const effectiveContentWidth = worldContentWidth > 0 ? worldContentWidth : 100;
      // FIX: Corrected typo in variable name for self-reference
      const effectiveContentHeight = worldContentHeight > 0 ? worldContentHeight : 100;

      const paddingFactor = 1.1; // Add some padding around the content

      const zoomX = canvasWidth / (effectiveContentWidth * paddingFactor);
      const zoomY = canvasHeight / (effectiveContentHeight * paddingFactor);

      const newZoom = Math.max(0.1, Math.min(zoomX, zoomY, 10)); // Clamp zoom level

      const worldCenterX = minWorldX + worldContentWidth / 2;
      const worldCenterY = minWorldY + worldContentHeight / 2;

      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;

      // Calculate new position to center content at the new zoom
      const newPosX = canvasCenterX - (worldCenterX * newZoom);
      const newPosY = canvasCenterY - (worldCenterY * newZoom);

      setPosition({ x: newPosX, y: newPosY });
      setZoom(newZoom);
    }
    setIsEditing(false);
    setEditingBoxProps(null);
    setSelectedBoxIds([]);
    setShowAddMenu(false);
    focusCanvas(); // Focus canvas after resetting view
  }, [boxes, setPosition, setZoom, setIsEditing, setEditingBoxProps, setSelectedBoxIds, setShowAddMenu, interactiveCanvasRef, focusCanvas]);

  // useCanvasPersistence hook call
  const {
    handleSaveCanvas, handleLoadCanvas, handleModalSave, handleModalCancel, loadSpecificCanvas,
  } = useCanvasPersistence({
    boxes, setBoxes, position, setPosition, zoom, setZoom,
    isDarkMode, setIsDarkMode, isCanvasLocked, setIsCanvasLocked,
    setSelectedBoxIds, setIsEditing, setEditingBoxProps, setShowAddMenu,
    setShowSaveModal, setShowLoadMenu, setAvailableSaves, dc: dcInstance, focusCanvas,
  });

  // Global key listeners for space, ctrl, shift
  // These are outside BasicView because BasicView only listens when it has focus,
  // but we need to track these keys even if focus is on a modal or another element temporarily.
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.code === 'Space') isSpacebarDownRef.current = true;
      if (e.key === 'Control' || e.key === 'Meta') isControlDownRef.current = true; // Meta for Cmd on Mac
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
  
  // Calculate grid sizes and colors based on zoom and theme
  const minorGridSize = 20 * zoom;
  const majorGridSize = minorGridSize * 5;
  const superGridSize = majorGridSize * 5;

  const minorGridColor = getGridColor('minor', zoom, currentTheme);
  const majorGridColor = getGridColor('major', zoom, currentTheme);
  const superGridColor = getGridColor('super', zoom, currentTheme);

  return (
    h('div', {
      ref: outerContainerRef,
      style: {
        height: "60vh", width: "100%", padding: "10px",
        border: `2px solid ${currentTheme.border}`, borderRadius: "8px",
        overflow: "hidden", background: currentTheme.background, position: "relative",
      }
    },
      // ScreenModeHelper needs to be rendered only when outerContainerRef is available
      outerContainerRef.current && h(ScreenModeHelper, {
        helperRef: screenHelperRef,
        containerRef: outerContainerRef,
        defaultStyle: defaultContainerStyle,
        originalParentRefForWindow: originalParentRefForWindow,
        originalParentRefForPiP: originalParentRefForPiP,
        allowedScreenModes: ["browser", "window", "pip", "character"],
        engine: dcInstance.app, // Pass dc.app if ScreenModeHelper expects the main app instance
        isDarkMode: isDarkMode,
      }),

      h(BasicView, {
        setCanvasRef: interactiveCanvasRef,
        onCanvasMouseDown: onCanvasMouseDown,
        handleWheel: handleWheel,
        isSpacebarDownRef: isSpacebarDownRef,
        isCanvasDraggingRef: isCanvasDraggingRef,
        selectedBoxIds: selectedBoxIds,
        deleteSelectedBox: deleteSelectedBox, // Pass delete function
        isCanvasLocked: isCanvasLocked, // Pass canvas locked state
        setSelectedBoxIds: setSelectedBoxIds, // Pass setSelectedBoxIds
        setIsEditing: setIsEditing, // Pass setIsEditing
        setEditingBoxProps: setEditingBoxProps, // Pass setEditingBoxProps
        setShowAddMenu: setShowAddMenu, // Pass setShowAddMenu
        focusCanvas, // Pass focusCanvas
        // New Props for Copy/Paste/Cut
        onCopyObjects: handleCopyObjects,
        onPasteObjects: handlePasteObjects,
        onCutObjects: handleCutObjects,
      },
        h('div', {
          id: "grid-layer",
          style: {
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            backgroundImage: `
              linear-gradient(to right, ${minorGridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${minorGridColor} 1px, transparent 1px),
              linear-gradient(to right, ${majorGridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${majorGridColor} 1px, transparent 1px),
              linear-gradient(to right, ${superGridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${superGridColor} 1px, transparent 1px)
            `,
            backgroundSize: `
              ${minorGridSize}px ${minorGridSize}px,
              ${minorGridSize}px ${minorGridSize}px,
              ${majorGridSize}px ${majorGridSize}px,
              ${majorGridSize}px ${majorGridSize}px,
              ${superGridSize}px ${superGridSize}px,
              ${superGridSize}px ${superGridSize}px
            `,
            backgroundPosition: `${position.x}px ${position.y}px`,
            zIndex: 1,
          }
        },
          h(CanvasControls, {
            resetView, isDarkMode, setIsDarkMode, showAddMenu, setShowAddMenu,
            createNewBox, deleteSelectedBox, selectedBoxIds, toggleEditPanel,
            LUCIDE_HOME_ICON, LUCIDE_SUN_ICON, LUCIDE_MOON_ICON, LUCIDE_PLUS_ICON,
            LUCIDE_TRASH_ICON, LUCIDE_PENCIL_ICON, LUCIDE_MENU_ICON, LUCIDE_LOCK_ICON,
            LUCIDE_UNLOCK_ICON, LUCIDE_SAVE_ICON, addMenuRef, isCanvasLocked,
            setIsCanvasLocked, handleSaveCanvas, handleLoadCanvas, availableSaves,
            loadSpecificCanvas, loadMenuRef, showLoadMenu, setShowLoadMenu, focusCanvas,
          }),

          isEditing && editingBoxProps && h(EditPanel, {
            editingBoxProps, handleChangeEditField, handleSaveEdit, handleCancelEdit,
            isDarkMode, currentTheme, focusCanvas,
          }),

          marqueeRect && h('div', {
            style: {
              position: 'absolute', border: '1px dashed #007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              left: `${marqueeRect.x}px`, top: `${marqueeRect.y}px`,
              width: `${marqueeRect.width}px`, height: `${marqueeRect.height}px`,
              pointerEvents: 'none', zIndex: 5,
            }
          }),

          h('div', { // This div contains all boxes and applies the transform for pan/zoom
            style: {
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "absolute",
              width: "1px", // Small base size as content scales
              height: "1px",
            }
          },
            boxes.map(box =>
              h(Box, {
                key: box.id,
                box: box,
                isSelected: selectedBoxIds.includes(box.id),
                onMouseDownBox: handleBoxMouseDown,
                onMouseDownHandle: handleHandleMouseDown,
                globalIsDarkMode: isDarkMode,
                h: h, // Pass h function for Box's internal rendering
                dc: dcInstance, // Pass dc instance
                isCanvasLocked,
              })
            )
          )
        )
      ),
      // FileNameModal is rendered conditionally outside the main canvas area
      showSaveModal && h(FileNameModal, {
        onSave: handleModalSave,
        onCancel: handleModalCancel,
        initialFileName: defaultFileName,
        isDarkMode: isDarkMode,
        focusCanvas, // Pass focusCanvas to modal
      })
    )
  );
}

// Export the main component
return { InfiniteCanvas };
```






# ScreenModeHelper

```jsx
// ScreenModeHelper

const { useState, useRef, useEffect, useCallback } = dc;

function getInt(val) {
  return parseInt(val, 10) || 0;
}

function resetScreenMode(container, defaultStyle, originalParentRefForWindow, originalParentRefForPiP) {
  console.log("[resetScreenMode] Resetting container state.");
  if (document.fullscreenElement === container) {
    document.exitFullscreen?.();
  }

  if (container.parentNode === document.body) {
    if (originalParentRefForWindow.current) {
      originalParentRefForWindow.current.appendChild(container);
      originalParentRefForWindow.current = null;
    } else if (originalParentRefForPiP.current) {
      originalParentRefForPiP.current.appendChild(container);
      originalParentRefForPiP.current = null;
    } else {
      if (container.parentNode === document.body && container.getAttribute('data-is-independent-pip')) {
          console.log("[resetScreenMode] Container is an independent PiP, will not reparent.");
      } else {
          console.warn("[resetScreenMode] Container is in body, but no original parent ref found. Not reparenting.");
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
  if (document.fullscreenElement !== container) {
    console.log("[applyBrowserMode] Requesting fullscreen.");
    container.requestFullscreen?.() ||
      container.webkitRequestFullscreen?.() ||
      container.mozRequestFullScreen?.() ||
      container.msRequestFullscreen?.();
  } else {
    console.log("[applyBrowserMode] Exiting fullscreen.");
    document.exitFullscreen?.();
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
  isDarkMode
}) => {
  const [activeMode, setActiveMode] = useState(
    allowedScreenModes.includes(initialMode) ? initialMode : "default"
  );

  const toggleMode = useCallback((mode) => {
    console.group(`[ScreenModeHelper.toggleMode] Toggling to: '${mode}' from '${activeMode}'`);

    const container = containerRef.current;
    if (!container) {
        console.warn("[ScreenModeHelper.toggleMode] Container ref is null.");
        console.groupEnd();
        return;
    }

    resetScreenMode(container, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);

    let newActiveMode = "default";
    // Do not set 'character' as the activeMode of *this* component.
    // If 'character' mode was requested (e.g., if allowedScreenModes still contains it),
    // it will spawn a new window and this component will reset to default.
    if (activeMode !== mode && mode !== "character") {
        newActiveMode = mode;
    }
    setActiveMode(newActiveMode);


    if (newActiveMode === "default") {
      console.log("[ScreenModeHelper.toggleMode] Reset to default completed.");
    } else if (newActiveMode === "browser") {
      console.log("[ScreenModeHelper.toggleMode] Applying browser mode.");
      applyBrowserMode(container);
    } else if (newActiveMode === "window") {
      console.log("[ScreenModeHelper.toggleMode] Applying window mode.");
      if (container.parentNode !== document.body) {
        originalParentRefForWindow.current = container.parentNode;
        document.body.appendChild(container);
      }
      applyWindowStyle(container);
    } else if (newActiveMode === "pip") {
      console.log("[ScreenModeHelper.toggleMode] Applying PiP mode (for main container).");
      if (container.parentNode !== document.body) {
        originalParentRefForPiP.current = container.parentNode;
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
            console.log(`[ScreenModeHelper.toggleMode] Engine resize triggered for mode: '${newActiveMode}'`);
        } else {
            console.warn("[ScreenModeHelper.toggleMode] engine.resize not found. Skipping engine resize on mode toggle.");
        }
      }, 100);
    }
    console.groupEnd();
  }, [activeMode, containerRef, originalParentRefForWindow, originalParentRefForPiP, defaultStyle, engine, isDarkMode, AppComponent]);


  useEffect(() => {
    if (helperRef) {
      helperRef.current = { toggleMode };
      console.log("[ScreenModeHelper] toggleMode exposed via helperRef.");
    }
  }, [helperRef, toggleMode]);

  useEffect(() => {
    if (initialMode !== "default" && containerRef.current) {
      console.log(`[ScreenModeHelper] Applying initial mode: '${initialMode}' on mount.`);
      // Prevent setting 'character' as initial active mode for this component, as it spawns a new window.
      if (initialMode !== "character") {
        toggleMode(initialMode);
      } else {
        console.warn("[ScreenModeHelper] Initial mode 'character' is not directly supported for this component's active state.");
      }
    }
  }, []);

  useEffect(() => {
    let observer;
    let resizeTimeout;
    if (containerRef.current && engine) {
      console.log("[ScreenModeHelper] Setting up debounced ResizeObserver for engine.");
      observer = new ResizeObserver((entries) => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          entries.forEach((entry) => {
            const { width } = entry.contentRect;
            console.log(`[ScreenModeHelper] Debounced Resize: Container resized to ${width}px.`);
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

            // --- THE CRITICAL FIX IS HERE ---
            if (engine && typeof engine.setHardwareScalingLevel === 'function') {
                engine.setHardwareScalingLevel(scalingFactor);
                console.log(`[ScreenModeHelper] Updated hardware scaling to: ${scalingFactor}.`);
            } else {
                // This warning will now appear if the function isn't found, but no error will be thrown.
                console.warn("[ScreenModeHelper] engine.setHardwareScalingLevel not found. Skipping hardware scaling adjustment.");
            }

            // Also adding a check for engine.resize() for robustness
            if (engine && typeof engine.resize === 'function') {
                engine.resize();
            } else {
                console.warn("[ScreenModeHelper] engine.resize not found. Skipping engine resize on container resize.");
            }
          });
        }, 300);
      });
      observer.observe(containerRef.current);
    } else {
      console.log("[ScreenModeHelper] Debounced ResizeObserver not set up (container or engine missing).");
    }
    return () => {
      if (observer && containerRef.current) {
        console.log("[ScreenModeHelper] Disconnecting debounced ResizeObserver.");
        observer.unobserve(containerRef.current);
      }
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [containerRef, engine, activeMode]);


  useEffect(() => {
      const handleFullscreenChange = () => {
          console.log(`[FullscreenEvent] Fullscreen state changed. document.fullscreenElement: ${document.fullscreenElement ? document.fullscreenElement.tagName : 'None'}`);
          if (!document.fullscreenElement && activeMode === "browser") {
              setActiveMode("default");
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


  const iconStyle = { width: "24px", height: "24px" };
  // FIX: Use global `h` for creating SVG elements.
  const browserIcon = (
    h('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" },
      h('path', { d: "M8 3H5a2 2 0 0 0-2 2v3" }),
      h('path', { d: "M16 3h3a2 2 0 0 1 2 2v3" }),
      h('path', { d: "M8 21H5a2 2 0 0 1-2-2v-3" }),
      h('path', { d: "M16 21h3a2 2 0 0 0 2-2v-3" })
    )
  );
  const windowIcon = (
    h('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" },
      h('rect', { x: "3", y: "3", width: "18", height: "14", rx: "2", ry: "2" }),
      h('path', { d: "M3 17h18" })
    )
  );
  const pipIcon = (
    h('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" },
      h('rect', { x: "2", y: "5", width: "20", height: "14", rx: "2", ry: "2" }),
      h('rect', { x: "8", y: "9", width: "8", height: "5", rx: "1", ry: "1" })
    )
  );
  const defaultIcon = (
    h('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" },
      h('circle', { cx: "12", cy: "12", r: "10" })
    )
  );
  // Removed characterIcon and characterIconElement.

  const modeIcons = {
    browser: browserIcon,
    window: windowIcon,
    pip: pipIcon,
    default: defaultIcon,
  };

  const buttonStyle = {
    width: "42px",
    height: "42px",
    marginRight: "10px",
    cursor: "pointer",
    backgroundColor: "#4a4a4a",
    border: "none",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    transition: "background-color 0.2s, box-shadow 0.2s"
  };

  // Filter out "character" mode to remove the last icon from display
  const modesToDisplay = allowedScreenModes.filter((mode) => mode !== "none" && mode !== "character");

  return (
    <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 100, display: "flex" }}>
      {modesToDisplay.map((mode) => (
        <button
          key={mode}
          className="screen-mode-button"
          onClick={() => toggleMode(mode)}
          style={{
            ...buttonStyle,
            backgroundColor: activeMode === mode ? "#6a6a6a" : "#4a4a4a",
            boxShadow: activeMode === mode ? "0 0 0 2px #aaa" : "none",
          }}
          title={mode.charAt(0).toUpperCase() + mode.slice(1) + " Mode" + (activeMode === mode && mode !== "character" ? " (Click to Reset)" : "")}
        >
          {modeIcons[mode] || null}
        </button>
      ))}
      {activeMode === "pip" && (
        <button
          className="screen-mode-button"
          onClick={() => toggleMode("default")}
          style={{
            ...buttonStyle,
            backgroundColor: '#dc3545',
            marginLeft: '10px'
          }}
          title="Close PiP Mode"
        >
          X
        </button>
      )}
    </div>
  );
};

return { ScreenModeHelper };
```



# LucideIcons

```jsx
// --- Lucide SVG Icon Definitions (as string URLs for general use) ---
const LUCIDE_HOME_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z%22/%3E%3Cpolyline points=%229 22 9 12 15 12 15 22%22/%3E%3C/svg%3E')`;
const LUCIDE_SUN_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Ccircle cx=%2212%22 cy=%2212%22 r=%224%22/%3E%3Cpath d=%22M12 2v2%22/%3E%3Cpath d=%22M12 20v2%22/%3E%3Cpath d=%22m4.93 4.93 1.41 1.41%22/%3E%3Cpath d=%22m17.66 17.66 1.41 1.41%22/%3E%3Cpath d=%22M2 12h2%22/%3E%3Cpath d=%22M20 12h2%22/%3E%3Cpath d=%22m4.93 19.07 1.41-1.41%22/%3E%3Cpath d=%22m17.66 6.34 1.41-1.41%22/%3E%3C/svg%3E')`;
const LUCIDE_MOON_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23fff%22 stroke=%22none%22%3E%3Cpath d=%22M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z%22/%3E%3C/svg%3E')`;
const LUCIDE_PLUS_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M12 5v14%22/%3E%3Cpath d=%22M5 12h14%22/%3E%3C/svg%3E')`;
const LUCIDE_TRASH_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M3 6h18%22/%3E%3Cpath d=%22M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6%22/%3E%3Cpath d=%22M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2%22/%3E%3Cline x1=%2210%22 x2=%2210%22 y1=%2211%22 y2=%2217%22/%3E%3Cline x1=%2214%22 x2=%2214%22 y1=%2211%22 y2=%2217%22/%3E%3C/svg%3E')`;
const LUCIDE_PENCIL_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z%22/%3E%3C/svg%3E')`;
const LUCIDE_PICTURE_IN_PICTURE_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M12 3H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10M16 11h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z%22/%3E%3C/svg%3E')`;
const LUCIDE_MENU_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cline x1=%224%22 x2=%2220%22 y1=%2212%22 y2=%2212%22/%3E%3Cline x1=%224%22 x2=%2220%22 y1=%226%22 y2=%226%22/%3E%3Cline x1=%224%22 x2=%2220%22 y1=%2218%22 y2=%2218%22/%3E%3C/svg%3E')`;

// NEW ICONS ADDED HERE:
const LUCIDE_LOCK_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Crect x=%228%22 y=%2211%22 width=%228%22 height=%2211%22 rx=%222%22 ry=%222%22/%3E%3Cpath d=%22M12 2v7%22/%3E%3C/svg%3E')`;
const LUCIDE_UNLOCK_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Crect x=%223%22 y=%2211%22 width=%2218%22 height=%2211%22 rx=%222%22 ry=%222%22/%3E%3Cpath d=%22M7 11V7a5 5 0 0 1 9.9-1%22/%3E%3C/svg%3E')`;
const LUCIDE_SAVE_ICON = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z%22/%3E%3Cpolyline points=%2217 21 17 13 7 13 7 21%22/%3E%3Cpolyline points=%227 3 7 8 15 8%22/%3E%3C/svg%3E')`; // ADDED SAVE ICON

return { LUCIDE_HOME_ICON, LUCIDE_SUN_ICON, LUCIDE_MOON_ICON, LUCIDE_PLUS_ICON, LUCIDE_TRASH_ICON, LUCIDE_PENCIL_ICON, LUCIDE_PICTURE_IN_PICTURE_ICON, LUCIDE_MENU_ICON, LUCIDE_LOCK_ICON, LUCIDE_UNLOCK_ICON, LUCIDE_SAVE_ICON } 
```





