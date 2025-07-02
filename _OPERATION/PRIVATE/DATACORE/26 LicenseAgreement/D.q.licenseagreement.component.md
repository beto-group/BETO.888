

# ViewComponent

```jsx
// ViewComponent.jsx

const { useRef, useMemo, useState, useEffect, useCallback } = dc; // Added useCallback


const { ScreenModeHelper } = await dc.require(
  dc.headerLink("_OPERATION/PRIVATE/DATACORE/26 LicenseAgreement/D.q.licenseagreement.component.md", "ScreenModeHelper")
);

function LicenseAgreement() {
  const containerRef = useRef(null);
  const originalParentRefForWindow = useRef(null);
  const originalParentRefForPiP = useRef(null);
  const screenModeHelperInstanceRef = useRef(null);

  const originalCommandsRef = useRef(null);
  const originalExecuteCommandRef = useRef(null);
  const originalExecuteRef = useRef(null);

  const [agreementSatisfiedOnce, setAgreementSatisfiedOnce] = useState(false);

  const targetFileNameOnly = "TERMS OF SERVICE.approval.md";
  const iframeSrc = "https://www.beto.group/terms_of_service";

  let obsidianApp;
  if (typeof dc !== 'undefined' && dc.app) {
    obsidianApp = dc.app;
  } else if (typeof app !== 'undefined') {
    obsidianApp = app;
  }

  const [initialCheckStatus, setInitialCheckStatus] = useState("pending");
  const [proceedButtonEnabled, setProceedButtonEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0);

  const colorCompleted = '#9370DB';
  const colorIncomplete = '#AAAAAA';
  const colorCompletedBg = 'rgba(147, 112, 219, 0.15)';
  const colorIncompleteBg = 'rgba(170, 170, 170, 0.1)';
  const colorButtonDisabledBg = '#777777';
  const colorButtonDisabledText = '#bbbbbb';
  const colorButtonDisabledOpacity = 0.6;

  function styleObjectToCssString(styleObj) {
    return Object.entries(styleObj)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
        return `${cssKey}: ${value};`;
      })
      .join(" ");
  }

  const contentWrapperStyle = {
    width: "clamp(300px, 90%, 800px)", height: "clamp(450px, 90%, 700px)", padding: "20px",
    border: "2px solid #ccc", borderRadius: "12px", backgroundColor: "rgba(40, 40, 40, 0.95)",
    boxSizing: "border-box", display: "flex", flexDirection: "column", color: "white",
    overflow: "hidden", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
  };
  const defaultModeOuterContainerStyle = {
    position: "relative", width: "100%", height: "80vh", display: "flex",
    justifyContent: "center", alignItems: "center", boxSizing: "border-box",
  };
  const defaultModeOuterContainerStyleString = styleObjectToCssString(defaultModeOuterContainerStyle);
  const windowModeOuterContainerStyle = {
    position: "fixed", top: "0px", left: "0px", width: "100vw", height: "100vh",
    display: "flex", justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)", padding: "0px", margin: "0px",
    boxSizing: "border-box", overflow: "hidden", zIndex: 10000,
  };
  const windowModeOuterContainerStyleString = styleObjectToCssString(windowModeOuterContainerStyle);
  
  const iframeContainerStyle = { 
    width: "100%", 
    height: "515px", 
    minHeight: "250px", 
    border: "1px solid var(--background-modifier-border, #444)", 
    borderRadius: "8px", 
    overflow: "hidden", 
    margin: "0 0 15px 0", 
    flexShrink: 0 
  };
  const taskListOuterContainerStyle = { flexGrow: 1, overflowY: "auto", padding: "0 10px", minHeight: "80px", scrollbarWidth: "thin", scrollbarColor: "#666 #333" };

  const initialScreenMode = "window";
  const allowedScreenModes = ["window"];
  const engine = null;
  const escapedTargetFileNameOnly = targetFileNameOnly.replace(/"/g, '\\"');
  const taskQueryString = `@task and ($file = "${escapedTargetFileNameOnly}" or $file.contains("/${escapedTargetFileNameOnly}"))`;

  const queryResult = dc.useQuery(taskQueryString);

  const tasks = useMemo(() => {
    if (!Array.isArray(queryResult)) {
      return [];
    }
    return queryResult;
  }, [queryResult]);

  const totalTasks = useMemo(() => tasks.length, [tasks]);
  const completedTasks = useMemo(() => {
    return tasks.filter(task => task && task.$completed).length;
  }, [tasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
        const ctimeA = (a && a.$ctime) ? new Date(a.$ctime).getTime() : Infinity;
        const ctimeB = (b && b.$ctime) ? new Date(b.$ctime).getTime() : Infinity;
        return ctimeA - ctimeB;
    });
  }, [tasks]);

  useEffect(() => {
    if (queryResult !== undefined && initialCheckStatus === "pending") {
      if (totalTasks > 0 && completedTasks === totalTasks) {
        setInitialCheckStatus("preCompleted");
        setAgreementSatisfiedOnce(true);
        setIsVisible(false);
        //console.log(`ViewComponent: All tasks matching query criteria for "${targetFileNameOnly}" are initially complete. No UI pop-up.`);
      } else {
        setInitialCheckStatus("needsAction");
        setIsVisible(true);
      }
    }
  }, [queryResult, totalTasks, completedTasks, initialCheckStatus]);

  useEffect(() => {
    setProceedButtonEnabled(totalTasks > 0 && completedTasks === totalTasks);
  }, [totalTasks, completedTasks]);

  const handleToggleTask = async (taskToToggle) => {
    if (!isIframeLoaded) {
      if (typeof Notice === 'function') new Notice("Please wait for the terms to load completely.", 3000);
      else console.warn("Attempted to toggle task before iframe loaded.");
      return;
    }
    if (!obsidianApp || !obsidianApp.vault?.read || !obsidianApp.vault?.modify || !obsidianApp.vault?.getAbstractFileByPath) {
      if (typeof Notice === 'function') new Notice("Error: Cannot modify task. Obsidian integration is missing.", 5000); else alert("Error: Cannot modify task. Obsidian integration is missing."); return;
    }
    const filePathFromTask = taskToToggle.$file; const lineNumber = taskToToggle.$line;
    if (filePathFromTask === undefined || lineNumber === undefined) {
      if (typeof Notice === 'function') new Notice("Error: Task data is incomplete.", 5000); else alert("Error: Task data is incomplete. Cannot update."); return;
    }
    if (typeof filePathFromTask !== 'string') {
      if (typeof Notice === 'function') new Notice("Error: Invalid task file path.", 5000); else alert("Error: Invalid task file path."); return;
    }
    const fileObject = obsidianApp.vault.getAbstractFileByPath(filePathFromTask);
    if (!fileObject || fileObject.path !== filePathFromTask || typeof fileObject.basename !== 'string') {
      if (typeof Notice === 'function') new Notice(`Error: File "${filePathFromTask}" not found.`, 7000); else alert(`Error: File "${filePathFromTask}" not found or could not be confirmed.`); return;
    }
    try {
      const currentFileContentString = await obsidianApp.vault.read(fileObject);
      if (typeof currentFileContentString !== 'string') {
        if (typeof Notice === 'function') new Notice(`Error: Could not read content of "${filePathFromTask}".`, 7000); else alert(`Error: Could not read content of "${filePathFromTask}".`); return;
      }
      const lines = currentFileContentString.split('\n');
      if (lineNumber >= lines.length) {
        if (typeof Notice === 'function') new Notice(`Error: Task line out of sync.`, 7000); else alert(`Error: Task line number is out of sync with file content. Please refresh or check the file.`); return;
      }
      let targetLine = lines[lineNumber]; const taskLineRegex = /^(\s*-\s*\[)([^\]])(\]\s*.*)$/; const match = targetLine.match(taskLineRegex);
      if (match) {
        const prefix = match[1]; const currentStatus = match[2]; const suffix = match[3];
        let newStatus = (currentStatus === ' ' || currentStatus === '?') ? 'x' : ' ';
        lines[lineNumber] = `${prefix}${newStatus}${suffix}`;
        await obsidianApp.vault.modify(fileObject, lines.join('\n'));
      } else {
        if (typeof Notice === 'function') new Notice(`Could not update task: Incorrect format. Task: "${targetLine.trim()}"`, 7000); else alert(`Could not update task: The line format seems incorrect. Task: "${targetLine.trim()}"`); return;
      }
    } catch (error) {
      console.error("Error toggling task:", error);
      if (typeof Notice === 'function') new Notice(`Error updating task: ${error.message}`, 7000); else alert(`An unexpected error occurred while updating the task: ${error.message}`);
    }
  };

  const handleIframeLoad = () => {
    //console.log("ViewComponent: Iframe content loaded.");
    setIsIframeLoaded(true);
  };

  const handleRefreshIframe = () => {
    //console.log("ViewComponent: Refreshing iframe.");
    setIsIframeLoaded(false); 
    setIframeRefreshKey(prevKey => prevKey + 1);
  };

  const isActive = initialCheckStatus === "needsAction" && isVisible;

  const ensureFocus = () => {
      if (containerRef.current && document.activeElement !== containerRef.current) {
          //console.log('LicenseAgreement: Forcing focus to container.');
          containerRef.current.focus();
      }
  };

  const handleGlobalKeyDown = (event) => {
    if (!isActive) return;
    if ((event.metaKey || event.ctrlKey) && event.code === 'KeyW') return;
    if ((event.metaKey || event.ctrlKey) && event.altKey && event.code === 'KeyI') {
        event.stopPropagation(); event.preventDefault(); ensureFocus(); return;
    }
    if ((event.ctrlKey || event.metaKey) && (event.code === 'Equal' || event.code === 'Minus' || event.code === 'Digit0')) {
        event.stopPropagation(); event.preventDefault(); ensureFocus(); return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) {
        event.stopPropagation(); event.preventDefault(); ensureFocus(); return;
    }
    const targetElement = event.target;
    const isInteractiveElement = targetElement.tagName === 'INPUT' || targetElement.tagName === 'BUTTON' || targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'SELECT';
    if (containerRef.current && !containerRef.current.contains(targetElement)) {
        event.stopPropagation(); event.preventDefault(); ensureFocus(); return;
    }
    if (containerRef.current && containerRef.current.contains(targetElement) && !isInteractiveElement) {
        event.stopPropagation(); event.preventDefault(); return;
    }
  };
  
  const handleGlobalWheel = (event) => {
      if (!isActive) return;
      if (event.ctrlKey || event.metaKey) {
          event.preventDefault(); event.stopPropagation(); ensureFocus();
      }
  };

  const applyCommandBlocking = () => {
    if (!obsidianApp || !obsidianApp.commands) {
      console.warn('LicenseAgreement: dc.app or dc.app.commands unavailable for blocking.');
      return;
    }
    //console.log('LicenseAgreement: Applying Obsidian command blocking.');
    originalCommandsRef.current = { ...obsidianApp.commands.commands };
    originalExecuteCommandRef.current = obsidianApp.commands.executeCommandById;
    originalExecuteRef.current = obsidianApp.commands.execute;
    
    obsidianApp.commands.commands = {}; 
    
    obsidianApp.commands.executeCommandById = (commandId) => {
      if (commandId === 'workspace:close') {
        //console.log('LicenseAgreement: Allowing command (executeCommandById): workspace:close');
        return originalExecuteCommandRef.current.call(obsidianApp.commands, commandId);
      }
      //console.log('LicenseAgreement: Blocking command (executeCommandById):', commandId);
      return false;
    };
    obsidianApp.commands.execute = (command) => {
      if (command && command.id === 'workspace:close') {
        //console.log('LicenseAgreement: Allowing command (execute): workspace:close');
        return originalExecuteRef.current.call(obsidianApp.commands, command);
      }
      //console.log('LicenseAgreement: Blocking command (execute):', command?.id);
      return false;
    };
  };

  const restoreCommands = () => {
    if (obsidianApp && obsidianApp.commands && originalCommandsRef.current) {
      //console.log('LicenseAgreement: Restoring Obsidian commands.');
      obsidianApp.commands.commands = originalCommandsRef.current;
      obsidianApp.commands.executeCommandById = originalExecuteCommandRef.current;
      obsidianApp.commands.execute = originalExecuteRef.current;
      originalCommandsRef.current = null;
      originalExecuteCommandRef.current = null;
      originalExecuteRef.current = null;
    }
  };

  useEffect(() => {
    if (!obsidianApp) {
        console.warn('LicenseAgreement: dc.app is not available for blocking logic.');
        return;
    }

    let interactionTimeoutId = null;
    let iframeEl = null;
    let localIframeBlurHandler = null;

    if (isActive) {
        //console.log('LicenseAgreement: Activating input blocking and command overrides.');
        applyCommandBlocking(); 

        document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
        document.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });

        interactionTimeoutId = setTimeout(() => {
            if (containerRef.current) { 
                //console.log('LicenseAgreement: Attempting interaction after delay.');
                
                if (typeof containerRef.current.focus === 'function') {
                    ensureFocus();
                }

                try {
                    const rect = containerRef.current.getBoundingClientRect();
                    const clickX = rect.left + (rect.width / 2); 
                    const clickY = rect.bottom - 10; 

                    if (clickY < rect.top + 10) { 
                        clickY = rect.top + (rect.height / 2); 
                         //console.log(`LicenseAgreement: Adjusted clickY to vertical center (${clickY}) due to short modal.`);
                    }

                    //console.log(`LicenseAgreement: Programmatically dispatching SIMULATED click at BOTTOM-MIDDLE (${clickX.toFixed(0)}, ${clickY.toFixed(0)}) on container.`);

                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,      
                        cancelable: true,   
                        view: window,       
                        clientX: clickX,    
                        clientY: clickY     
                    });

                    containerRef.current.dispatchEvent(clickEvent);

                } catch (error) {
                    console.error("LicenseAgreement: Error dispatching programmatic click:", error);
                    if (typeof containerRef.current.click === 'function') {
                       //console.log('LicenseAgreement: Falling back to simple .click() on container due to error.');
                       containerRef.current.click();
                    }
                }
            }
        }, 150); 

        iframeEl = containerRef.current?.querySelector('iframe');
        
        localIframeBlurHandler = () => {
            if (isActive && containerRef.current) { 
                //console.log('LicenseAgreement: Iframe blurred. Attempting to re-focus container.');
                setTimeout(ensureFocus, 50); 
            }
        };

        if (iframeEl) {
            iframeEl.addEventListener('blur', localIframeBlurHandler);
        }

        return () => {
            //console.log('LicenseAgreement: Deactivating input blocking and command overrides (cleanup).');
            if (interactionTimeoutId) clearTimeout(interactionTimeoutId);
            if (iframeEl && localIframeBlurHandler) { 
                iframeEl.removeEventListener('blur', localIframeBlurHandler);
            }
            document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
            document.removeEventListener('wheel', handleGlobalWheel, { capture: true });
            restoreCommands();
        };
    }
  }, [isActive, obsidianApp]); 

  useEffect(() => {
      if (agreementSatisfiedOnce && !isVisible && totalTasks > 0 && completedTasks < totalTasks) {
          //console.log("LicenseAgreement: Tasks became uncompleted after agreement was satisfied. Re-popping up.");
          if (typeof Notice === 'function') {
              new Notice("Please re-confirm your agreement. A task has been unchecked.", 7000);
          }
          setInitialCheckStatus("needsAction");
          setIsVisible(true);
          setAgreementSatisfiedOnce(false);
      }
  }, [completedTasks, totalTasks, agreementSatisfiedOnce, isVisible, initialCheckStatus]);


  // SVG Home Icon Component
  const HomeIcon = ({ color = 'currentColor', size = '20px' }) => (
    <svg viewBox="0 0 24 24" fill={color} width={size} height={size} style={{ display: 'block', margin: 'auto' }}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path>
    </svg>
  );

  if (!obsidianApp || !obsidianApp.vault?.read || !obsidianApp.vault?.modify || !obsidianApp.vault?.getAbstractFileByPath) {
    return ( <div style={{ padding: "20px", border: "1px solid #ff6b6b", borderRadius: "8px", backgroundColor: "#2c1d1d", color: "#ffcccc", fontFamily: "sans-serif" }}> <h3 style={{color: "#ff8080", marginTop: 0}}>Critical Error: Obsidian Integration Missing</h3> <p>Component requires `app.vault` methods.</p> </div> );
  }
  
  if (initialCheckStatus === "pending") { return null; } 
  if (!isVisible) { return null; }

  return (
    <div
      ref={containerRef}
      tabIndex={isActive ? 0 : -1}
      style={{
        outline: 'none',
      }}
    >
      <div style={contentWrapperStyle}>
        <div style={{...iframeContainerStyle, position: 'relative' }}>
          <button
            onClick={handleRefreshIframe}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 2, 
              background: '#383838', // Dark grey
              color: '#E0E0E0',     // Light grey/off-white for icon
              border: '1px solid #555',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colorCompleted; // Dark purple
              e.currentTarget.style.borderColor = '#7a5fb5'; // Complementary border for purple
              e.currentTarget.style.color = 'white'; // Icon to white
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#383838'; // Back to dark grey
              e.currentTarget.style.borderColor = '#555';
              e.currentTarget.style.color = '#E0E0E0'; // Icon back to light grey
            }}
            title="Go back home" 
          >
            <HomeIcon size="20px" />
          </button>
          <iframe
            key={iframeRefreshKey} 
            src={iframeSrc}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Terms of Use"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onLoad={handleIframeLoad}
          />
        </div>

        {!isIframeLoaded && (
          <p style={{textAlign: 'center', color: 'orange', fontStyle: 'italic', padding: '5px 0', margin: '0 0 10px 0', borderBottom: '1px solid #555'}}>
            Loading terms... Please wait to interact with tasks.
          </p>
        )}

        <div style={taskListOuterContainerStyle} className="custom-scrollbar-target">
          {tasks.length > 0 ? (
            <ul style={{ listStyleType: "none", paddingLeft: "0", margin: "0", opacity: isIframeLoaded ? 1 : 0.6 }}>
              {sortedTasks.map((task, index) => {
                const isCompleted = task.$completed; const taskKey = task.$id || `task-${index}-${task.$line}-${task.$file || 'unknownfile'}`;
                const uniqueId = `task-checkbox-${taskKey.replace(/[^a-zA-Z0-9-_]/g, '')}`; const taskFilePathDisplay = task.$file || "Unknown file";
                return (
                  <li key={taskKey} style={{
                    display: 'flex', alignItems: 'center', marginBottom: '10px',
                    paddingTop: '10px', paddingBottom: '10px', paddingRight: '12px', paddingLeft: '4px',
                    borderLeft: isCompleted ? `4px solid ${colorCompleted}` : `4px solid ${colorIncomplete}`,
                    backgroundColor: isCompleted ? colorCompletedBg : colorIncompleteBg,
                    borderRadius: '4px', transition: 'background-color 0.3s ease, border-left-color 0.3s ease',
                  }}>
                    <input
                      type="checkbox" id={uniqueId} checked={!!isCompleted}
                      onChange={() => { handleToggleTask(task); }}
                      disabled={!isIframeLoaded}
                      style={{
                        margin: '0 12px 0 0', cursor: isIframeLoaded ? 'pointer' : 'not-allowed', transform: 'scale(1.2)',
                        accentColor: isCompleted ? colorCompleted : colorIncomplete,
                        flexShrink: 0
                      }}
                      title={isIframeLoaded ? `Toggle task status (from ${taskFilePathDisplay})` : "Wait for terms to load"} />
                    <label
                      htmlFor={uniqueId}
                      style={{
                        flexGrow: 1, cursor: isIframeLoaded ? 'pointer' : 'default',
                        color: isCompleted ? 'darkgray' : 'lightgray',
                        textDecoration: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        opacity: isIframeLoaded ? 1 : 0.7
                      }}>
                        {task.$text}
                    </label>
                  </li>);
              })}
            </ul>
          ) : ( <p style={{color: "gray", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}> No tasks found for "{targetFileNameOnly}". <br/> <small>Ensure the file exists and contains Markdown tasks (e.g., "- [ ] Task").</small> </p> )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '15px', textAlign: 'right', flexShrink: 0, borderTop: "1px solid #444" }}>
          <button
            onClick={() => {
              if (proceedButtonEnabled) {
                //console.log("Proceed clicked. All tasks completed. Closing view.");
                setAgreementSatisfiedOnce(true);
                setIsVisible(false);
              }
            }}
            disabled={!proceedButtonEnabled}
            style={{
              padding: '12px 25px', fontSize: '1.1em', fontWeight: 'bold',
              cursor: proceedButtonEnabled ? 'pointer' : 'not-allowed',
              backgroundColor: proceedButtonEnabled ? colorCompleted : colorButtonDisabledBg,
              color: proceedButtonEnabled ? 'white' : colorButtonDisabledText,
              border: 'none', borderRadius: '5px',
              opacity: proceedButtonEnabled ? 1 : colorButtonDisabledOpacity,
              transition: 'background-color 0.3s ease, opacity 0.3s ease, color 0.3s ease'
            }}
            title={proceedButtonEnabled ? "Proceed to the next step" : "Complete all tasks to enable"}>
            Proceed
          </button>
        </div>
      </div>
      <ScreenModeHelper
        helperRef={screenModeHelperInstanceRef} initialMode={initialScreenMode}
        containerRef={containerRef} defaultStyle={defaultModeOuterContainerStyleString}
        originalParentRefForWindow={originalParentRefForWindow} originalParentRefForPiP={originalParentRefForPiP}
        allowedScreenModes={allowedScreenModes} engine={engine}
        stylesByMode={{ default: defaultModeOuterContainerStyleString, window: windowModeOuterContainerStyleString, }}
        hideToggleButtons={true} />
    </div>
  );
}

return { LicenseAgreement };
```



# ScreenModeHelper

```jsx
// ScreenModeHelper.jsx

const { useState, useRef, useEffect, useCallback } = dc;

// Helper to apply a CSS string to an element's style
function applyCssText(element, cssText) {
  if (element && cssText && typeof cssText === 'string') {
    element.style.cssText = cssText;
  } else if (element) {
    element.style.cssText = 'display: block; position: relative;';
    console.warn("[ScreenModeHelper] applyCssText called with no cssText for element (fallback applied):", element);
  }
}

function reparentToOriginal(container, originalParentRef) {
  if (!container || !originalParentRef || !originalParentRef.current) { // Removed .isConnected check for simplicity during unmount
    if (container && container.parentNode === document.body && (!originalParentRef || !originalParentRef.current)) {
        console.warn("[ScreenModeHelper] Container in body, but no valid original parent ref to reparent to. Will remain in body.");
    }
    return;
  }

  // Check if originalParentRef.current is still in the document, might have been removed if parent component unmounted
  if (!originalParentRef.current.isConnected) {
    console.warn("[ScreenModeHelper] Original parent for reparenting is no longer connected to the document. Container might be orphaned or removed by browser from body.", originalParentRef.current);
    // If container is in body, we might still want to remove it.
    if (container.parentNode === document.body) {
        try { document.body.removeChild(container); }
        catch(e) { console.error("[ScreenModeHelper] Error removing container from body when original parent was disconnected:", e); }
    }
    return;
  }


  if (container.parentNode === document.body) {
    console.log("[ScreenModeHelper] Reparenting container from body to:", originalParentRef.current);
    try {
      // It's possible document.body.removeChild(container) fails if container was already removed by other means.
      // So, only append if it was successfully removed or not in body to begin with.
      if (container.parentNode === document.body) document.body.removeChild(container);
      originalParentRef.current.appendChild(container);
    } catch (e) {
      console.error("[ScreenModeHelper] Error reparenting container:", e, container, originalParentRef.current);
    }
  } else if (container.parentNode !== originalParentRef.current) {
      console.warn("[ScreenModeHelper] Container not in body, but also not in its designated original parent. Current parent:", container.parentNode, "Expected:", originalParentRef.current);
  }
}

const ScreenModeHelper = ({
  helperRef,
  initialMode = "default",
  containerRef,
  originalParentRefForWindow,
  originalParentRefForPiP,
  allowedScreenModes = ["window"],
  engine,
  defaultStyle,
  stylesByMode,
  hideToggleButtons = false, // MODIFIED: New prop
}) => {
  const [activeMode, setActiveMode] = useState(() => {
    if (allowedScreenModes.includes(initialMode) && (initialMode === "default" || (stylesByMode && stylesByMode[initialMode]))) {
      return initialMode;
    }
    console.warn(`[ScreenModeHelper] Initial mode '${initialMode}' not allowed or styles not defined. Falling back to 'default'. Allowed: ${allowedScreenModes.join(', ')}`);
    return "default";
  });

  const initialStylesAppliedRef = useRef(false);
  const capturedActiveModeForCleanup = useRef(activeMode); // To capture mode for cleanup

  useEffect(() => {
    capturedActiveModeForCleanup.current = activeMode;
  }, [activeMode]);


  useEffect(() => {
    const container = containerRef.current;
    if (!container || initialStylesAppliedRef.current) return;

    console.log(`[ScreenModeHelper] Applying initial styles for mode: ${activeMode}`);
    if (activeMode === "default") {
      if (defaultStyle) {
        applyCssText(container, defaultStyle);
      } else {
        console.warn("[ScreenModeHelper] Initial mode is 'default' but no defaultStyle provided.");
        applyCssText(container, 'display: block; position: relative;');
      }
    } else if (stylesByMode && stylesByMode[activeMode]) {
      const parentRefForMode = activeMode === 'window' ? originalParentRefForWindow :
                               activeMode === 'pip' ? originalParentRefForPiP : null;

      if (parentRefForMode && !parentRefForMode.current && container.parentNode && container.parentNode !== document.body) {
        console.log("[ScreenModeHelper] Storing initial original parent:", container.parentNode, "for mode", activeMode);
        parentRefForMode.current = container.parentNode;
      } else if (parentRefForMode && !parentRefForMode.current && container.parentNode === document.body) {
        // This case is unlikely if it starts elsewhere, but good to log
        console.warn("[ScreenModeHelper] Container initially in document.body for mode", activeMode, "original parent ref not set yet.");
      }


      if (container.parentNode !== document.body) {
        if (container.parentNode) { // Ensure it has a parent before trying to remove
             try { container.parentNode.removeChild(container); }
             catch(e) { console.error("[ScreenModeHelper] Error removing container from initial parent:", e, container.parentNode); }
        }
        document.body.appendChild(container);
        console.log("[ScreenModeHelper] Moved container to document.body for initial mode:", activeMode);
      }
      applyCssText(container, stylesByMode[activeMode]);
    }
    initialStylesAppliedRef.current = true;

    if (engine?.resize) setTimeout(() => engine.resize(), 50);

  }, [containerRef, activeMode, initialMode, defaultStyle, stylesByMode, allowedScreenModes, engine, originalParentRefForWindow, originalParentRefForPiP]);


  const toggleMode = useCallback((requestedMode) => {
    // This function will likely not be called if hideToggleButtons is true,
    // but keeping it for completeness or future use.
    console.log(`[ScreenModeHelper] toggleMode. Current: '${activeMode}', Requested: '${requestedMode}'`);
    const container = containerRef.current;
    if (!container) {
      console.error("[ScreenModeHelper] Container ref is not set.");
      return;
    }

    // If buttons are hidden, disallow toggling away from the initial setup
    if (hideToggleButtons) {
        console.warn("[ScreenModeHelper] Toggle buttons are hidden. Mode toggling is disabled.");
        return;
    }

    const currentActualActiveMode = activeMode;
    let newEffectiveMode = requestedMode;

    if (currentActualActiveMode === requestedMode && requestedMode !== "default") {
      newEffectiveMode = "default";
    } else if (currentActualActiveMode === requestedMode && requestedMode === "default") {
      console.log("[ScreenModeHelper] Already in default mode and default requested. Re-applying default style.");
      if (defaultStyle) applyCssText(container, defaultStyle);
      else applyCssText(container, 'display: block; position: relative;');
      return;
    }

    console.log(`[ScreenModeHelper] Transitioning from '${currentActualActiveMode}' to '${newEffectiveMode}'`);

    if (currentActualActiveMode !== "default") {
      console.log(`[ScreenModeHelper] Resetting from current mode: ${currentActualActiveMode}`);
      const parentRefToUseForReset = currentActualActiveMode === 'window' ? originalParentRefForWindow :
                                     currentActualActiveMode === 'pip' ? originalParentRefForPiP : null;
      if (parentRefToUseForReset) {
        reparentToOriginal(container, parentRefToUseForReset);
      } else {
        console.warn(`[ScreenModeHelper] No specific originalParentRef for mode ${currentActualActiveMode} during reset.`);
      }
    }

    setActiveMode(newEffectiveMode);

    if (newEffectiveMode === "default") {
      if (defaultStyle) {
        console.log("[ScreenModeHelper] Applying defaultStyle for 'default' mode.");
        applyCssText(container, defaultStyle);
      } else {
        console.warn("[ScreenModeHelper] No defaultStyle provided for 'default' mode. Applying fallback.");
        applyCssText(container, 'display: block; position: relative;');
      }
      const expectedDefaultParentRef = originalParentRefForWindow; 
      if (expectedDefaultParentRef && expectedDefaultParentRef.current && container.parentNode !== expectedDefaultParentRef.current) {
        if (container.parentNode === document.body) {
            reparentToOriginal(container, expectedDefaultParentRef);
        }
      }
    } else if (stylesByMode && stylesByMode[newEffectiveMode]) {
      console.log(`[ScreenModeHelper] Applying styles for '${newEffectiveMode}' mode.`);
      const parentRefForNewMode = newEffectiveMode === 'window' ? originalParentRefForWindow :
                                 newEffectiveMode === 'pip' ? originalParentRefForPiP : null;

      if (parentRefForNewMode && !parentRefForNewMode.current && container.parentNode && container.parentNode !== document.body) {
        console.log("[ScreenModeHelper] Storing original parent:", container.parentNode, "for mode", newEffectiveMode);
        parentRefForNewMode.current = container.parentNode;
      }

      if (container.parentNode !== document.body) {
        if (container.parentNode) {
          try { container.parentNode.removeChild(container); }
          catch (e) { console.error("[ScreenModeHelper] Error removing container from its current parent:", container.parentNode, e); }
        }
        document.body.appendChild(container);
        console.log("[ScreenModeHelper] Moved container to document.body for mode:", newEffectiveMode);
      }
      applyCssText(container, stylesByMode[newEffectiveMode]);
    } else {
      console.warn(`[ScreenModeHelper] No styles defined in stylesByMode for mode: '${newEffectiveMode}'. Falling back to default.`);
       setActiveMode("default");
       if (defaultStyle) applyCssText(container, defaultStyle);
       else applyCssText(container, 'display: block; position: relative;');
    }

    if (engine?.resize) setTimeout(() => engine.resize(), 100);

  }, [activeMode, containerRef, originalParentRefForWindow, originalParentRefForPiP, engine, defaultStyle, stylesByMode, hideToggleButtons]);


  useEffect(() => {
    if (helperRef) {
      helperRef.current = {
        toggleMode: hideToggleButtons ? () => console.warn("[ScreenModeHelper] Mode toggling disabled.") : toggleMode,
        getActiveMode: () => activeMode,
      };
    }
  }, [helperRef, toggleMode, activeMode, hideToggleButtons]);

  useEffect(() => {
    if (!containerRef.current || !engine?.resize) return;
    const observer = new ResizeObserver(() => {
      if (engine && typeof engine.resize === 'function') {
        engine.resize();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, engine]);

  useEffect(() => {
    const currentContainer = containerRef.current;
    // Use the ref for active mode at the time of unmount setup
    // const currentActiveModeOnUnmount = activeMode; // This would be stale
    const modeAtUnmountSetup = capturedActiveModeForCleanup.current;


    return () => {
      console.log(`[ScreenModeHelper] Unmount cleanup. Mode was: ${modeAtUnmountSetup}`);
      if (currentContainer && modeAtUnmountSetup !== 'default') {
        const modesRequiringReset = ["window", "pip"];
        if (modesRequiringReset.includes(modeAtUnmountSetup)) {
          console.log(`[ScreenModeHelper] Unmounting: Attempting to reset from ${modeAtUnmountSetup}.`);
          
          const parentRefToUseForReset = modeAtUnmountSetup === 'window' ? originalParentRefForWindow :
                                         modeAtUnmountSetup === 'pip' ? originalParentRefForPiP : null;

          if (parentRefToUseForReset && parentRefToUseForReset.current) {
             console.log("[ScreenModeHelper] Unmounting: Original parent ref found:", parentRefToUseForReset.current);
             reparentToOriginal(currentContainer, parentRefToUseForReset);
             // After reparenting, apply default styles
             if (defaultStyle) {
                applyCssText(currentContainer, defaultStyle);
                console.log("[ScreenModeHelper] Unmounting: Applied default style after reparenting.");
             } else {
                applyCssText(currentContainer, 'display: block; position: relative;');
                console.warn("[ScreenModeHelper] Unmounting: Applied fallback style (no defaultStyle) after reparenting.");
             }
          } else if (currentContainer.parentNode === document.body) {
             console.warn("[ScreenModeHelper] Unmounting from body, but no original parent ref to return to. Attempting to remove from body.");
             try {
                document.body.removeChild(currentContainer);
                console.log("[ScreenModeHelper] Unmounting: Removed container from document.body.");
             } catch (e) {
                console.error("[ScreenModeHelper] Unmounting: Error removing container from document.body:", e);
             }
          } else {
            console.warn("[ScreenModeHelper] Unmounting: Container not in body and no original parent ref. State:", currentContainer.parentNode);
          }
        }
      } else if (currentContainer && modeAtUnmountSetup === 'default') {
          console.log("[ScreenModeHelper] Unmounting: Was in default mode. No special DOM cleanup needed by ScreenModeHelper besides what React/Preact does.");
      } else if (!currentContainer) {
          console.warn("[ScreenModeHelper] Unmounting: ContainerRef was null. Cannot perform cleanup.");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, defaultStyle, originalParentRefForWindow, originalParentRefForPiP]); // capturedActiveModeForCleanup is NOT a dep here. We want the value at mount time.

  // MODIFIED: Conditionally render buttons
  if (hideToggleButtons) {
    return null; // Or an empty fragment: dc.preact.h(dc.preact.Fragment, null)
  }

  const buttonContainerStyle = {
    position: "absolute",
    top: '10px',
    right: '10px',
    zIndex: 1,
    display: "flex",
    gap: "5px"
  };

  if (activeMode !== "default" && containerRef.current) {
      const containerZIndex = parseInt(window.getComputedStyle(containerRef.current).zIndex);
      if (!isNaN(containerZIndex) && containerZIndex >= 1) {
          buttonContainerStyle.zIndex = containerZIndex + 1;
      } else if (activeMode === 'window') {
          buttonContainerStyle.zIndex = 10001;
      }
  }

  return dc.preact.h('div', {
    className: 'screen-mode-controls',
    style: buttonContainerStyle
  },
    allowedScreenModes
      .filter(modeKey => modeKey !== "default" && modeKey !== "none" && stylesByMode && stylesByMode[modeKey])
      .map(modeKey => {
        const isCurrentActive = activeMode === modeKey;
        let modeLabel;
        switch(modeKey) {
          case "window": modeLabel = isCurrentActive ? "Exit Win" : "Win"; break;
          case "pip": modeLabel = isCurrentActive ? "Exit PiP" : "PiP"; break;
          default: modeLabel = modeKey.charAt(0).toUpperCase() + modeKey.slice(1);
        }

        return dc.preact.h('button', {
          key: modeKey,
          onClick: () => toggleMode(modeKey),
          style: {
            minWidth: "38px", height: "38px", padding: "0 8px", cursor: "pointer",
            backgroundColor: isCurrentActive ? "#dc3545" : "#007bff",
            color: "white",
            border: `1px solid ${isCurrentActive ? "#bd2130" : "#0056b3"}`,
            borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: "bold", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "background-color 0.15s ease-in-out, border-color 0.15s ease-in-out",
          },
          title: isCurrentActive ? `Exit ${modeKey} Mode (Return to Default)` : `Activate ${modeKey} Mode`
        }, modeLabel);
      })
  );
};

return { ScreenModeHelper };
```



