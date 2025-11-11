		

# ViewComponent

```jsx
// ViewComponent.jsx
// 
// Props:
// - config: object
//   - targetFileName: string (default: "TERMS OF SERVICE.example.approval.md") - The name of the TOS approval file to search for in the vault
//   - debug: boolean (default: false) - Shows debug bypass button in fullscreen mode

const { useRef, useMemo, useState, useEffect, useCallback, createPortal } = dc; // Added createPortal

// --- DOM Traversal Utilities for Full-Tab Mode ---
function findNearestAncestorWithClass(element, className) {
  if (!element) return null;
  let current = element.parentNode;
  while (current) {
    if (current.classList && current.classList.contains(className)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function findDirectChildByClass(parent, className) {
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.classList && child.classList.contains(className)) {
      return child;
    }
  }
  return null;
}

// Note: ScreenModeHelper is defined later in this same codeblock

function LicenseAgreement({ config = {} }) {
  const {
    targetFileName = "TERMS OF SERVICE.approval.md",
    debug = false
  } = config;
  const containerRef = useRef(null);
  const originalParentRefForWindow = useRef(null);
  const originalParentRefForPiP = useRef(null);
  const screenModeHelperInstanceRef = useRef(null);

  const originalCommandsRef = useRef(null);
  const originalExecuteCommandRef = useRef(null);
  const originalExecuteRef = useRef(null);

  const [agreementSatisfiedOnce, setAgreementSatisfiedOnce] = useState(false);

  const targetFileNameOnly = targetFileName;
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

  const colorCompleted = 'oklch(0.8 0.2 300)';
  const colorIncomplete = 'rgba(255,255,255,.25)';
  const colorCompletedBg = 'rgba(147, 112, 219, 0.15)';
  const colorIncompleteBg = 'rgba(16,10,24,0.74)';
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
    width: "min(100%, 960px)",
    border: "1px solid var(--glow-faint)",
    background: "rgba(16,10,24,0.82)",
    boxShadow: "0 30px 120px rgba(0,0,0,.55)",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };
  const defaultModeOuterContainerStyle = {
    position: "relative", width: "100%", height: "80vh", display: "flex",
    justifyContent: "center", alignItems: "center", boxSizing: "border-box",
  };
  const defaultModeOuterContainerStyleString = styleObjectToCssString(defaultModeOuterContainerStyle);
  const windowModeOuterContainerStyle = {
    position: "fixed", top: "0px", left: "0px", width: "100vw", height: "100vh",
    display: "flex", justifyContent: "center", alignItems: "center",
    backdropFilter: "blur(20px) saturate(1.4)",
    background: "rgba(0,0,0,.45)",
    padding: "clamp(16px,3vw,32px)", margin: "0px",
    boxSizing: "border-box", overflow: "hidden", zIndex: 10000,
  };
  const windowModeOuterContainerStyleString = styleObjectToCssString(windowModeOuterContainerStyle);
  
  const iframeContainerStyle = { 
    width: "100%", 
    height: "515px", 
    minHeight: "280px", 
    border: "1px solid var(--glow-faint)", 
    borderRadius: "8px", 
    overflow: "hidden", 
    position: "relative"
  };
  const taskListOuterContainerStyle = { 
    flexGrow: 1, 
    overflowY: "auto", 
    padding: "10px 18px", 
    minHeight: "80px", 
    maxHeight: "28vh"
  };

  const initialScreenMode = "window";
  const allowedScreenModes = ["window"];
  const engine = null;

  // State to hold tasks parsed directly from file
  const [tasks, setTasks] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);

  // Function to find the TOS approval file (always searches full vault)
  const findTosFile = useCallback(async () => {
    const files = obsidianApp.vault.getFiles().filter((f) => /\.md$/i.test(f.path));
    
    // Try exact match
    let hit = files.find((f) => {
      const basename = f.path.split('/').pop() || '';
      return basename.toLowerCase() === targetFileNameOnly.toLowerCase();
    });
    
    if (hit) {
      return hit;
    }
    
    // Try fuzzy match
    hit = files.find((f) => {
      const basename = f.path.split('/').pop() || '';
      return basename.toLowerCase().includes('terms') && 
             basename.toLowerCase().includes('service') &&
             basename.toLowerCase().includes('approval');
    });
    
    if (!hit) {
      console.error('[LicenseAgreement] No TOS file found in vault!');
    }
    
    return hit || null;
  }, [obsidianApp, targetFileNameOnly]);

  // Debug: Bypass all checks and mark all tasks as complete
  const handleDebugBypass = useCallback(async () => {
    if (!debug) return;
    
    try {
      const file = await findTosFile();
      if (!file) {
        if (obsidianApp?.Notice) new obsidianApp.Notice("Cannot bypass: TOS file not found.", 5000);
        return;
      }
      
      const currentContent = await obsidianApp.vault.read(file);
      const lines = currentContent.split('\n');
      
      // Check all unchecked tasks
      const modifiedLines = lines.map(line => {
        const taskMatch = line.match(/^(\s*-\s*\[)([xX\s])(\]\s*.*)$/);
        if (taskMatch && taskMatch[2] === ' ') {
          return `${taskMatch[1]}x${taskMatch[3]}`;
        }
        return line;
      });
      
      await obsidianApp.vault.modify(file, modifiedLines.join('\n'));
      if (obsidianApp?.Notice) new obsidianApp.Notice("DEBUG: All tasks checked!", 3000);
      
      setTimeout(() => loadTasks(), 100);
    } catch (error) {
      console.error('[LicenseAgreement] DEBUG bypass error:', error);
      if (obsidianApp?.Notice) new obsidianApp.Notice(`DEBUG bypass failed: ${error.message}`, 5000);
    }
  }, [debug, findTosFile, obsidianApp]);

  // Parse tasks from file content
  const parseTasksFromContent = useCallback((content, filePath) => {
    const lines = content.split('\n');
    const parsedTasks = [];
    
    lines.forEach((line, index) => {
      // Match task lines: - [ ] or - [x] or - [X]
      const taskMatch = line.match(/^\s*-\s*\[([xX\s])\]\s*(.*)$/);
      if (taskMatch) {
        const statusChar = taskMatch[1];
        const isCompleted = statusChar.toLowerCase() === 'x';
        const taskText = taskMatch[2].trim();
        
        parsedTasks.push({
          $line: index,
          $file: filePath,
          $completed: isCompleted,
          $text: taskText,
          $id: `${filePath}-${index}`,
        });
      }
    });
    
    return parsedTasks;
  }, []);

  // Load tasks from file
  const loadTasks = useCallback(async () => {
    try {
      const file = await findTosFile();
      if (!file) {
        console.warn('[LicenseAgreement] No TOS file found');
        setTasks([]);
        setTotalTasks(0);
        setCompletedTasks(0);
        return;
      }
      
      const content = await obsidianApp.vault.read(file);
      const parsedTasks = parseTasksFromContent(content, file.path);
      
      const completed = parsedTasks.filter(t => t.$completed).length;
      
      setTasks(parsedTasks);
      setTotalTasks(parsedTasks.length);
      setCompletedTasks(completed);
    } catch (error) {
      console.error('[LicenseAgreement] Error loading tasks:', error);
      setTasks([]);
      setTotalTasks(0);
      setCompletedTasks(0);
    }
  }, [findTosFile, obsidianApp, parseTasksFromContent]);

  // Load tasks on mount and when file changes
  useEffect(() => {
    loadTasks();
    
    // Set up file watcher
    const vault = obsidianApp?.vault;
    if (!vault) return;
    
    const onFileChange = (file) => {
      const basename = file.path.split('/').pop() || '';
      if (basename.toLowerCase().includes('terms') && 
          basename.toLowerCase().includes('service') &&
          basename.toLowerCase().includes('approval')) {
        loadTasks();
      }
    };
    
    const modifyRef = vault.on('modify', onFileChange);
    const createRef = vault.on('create', onFileChange);
    const deleteRef = vault.on('delete', onFileChange);
    
    return () => {
      vault.offref(modifyRef);
      vault.offref(createRef);
      vault.offref(deleteRef);
    };
  }, [loadTasks, obsidianApp]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const lineA = a.$line ?? Infinity;
      const lineB = b.$line ?? Infinity;
      return lineA - lineB;
    });
  }, [tasks]);

  useEffect(() => {
    // Only check after tasks have been loaded (when we have actual task data)
    // Don't run on initial mount when tasks array is empty - wait for loadTasks to complete
    if (initialCheckStatus === "pending" && totalTasks > 0) {
      if (completedTasks === totalTasks) {
        setInitialCheckStatus("preCompleted");
        setAgreementSatisfiedOnce(true);
        setIsVisible(false);
      } else {
        setInitialCheckStatus("needsAction");
        setIsVisible(true);
        setProceedButtonEnabled(false);
      }
    }
  }, [tasks, totalTasks, completedTasks, initialCheckStatus, targetFileNameOnly]);

  useEffect(() => {
    // Only enable button if we're actively showing the UI and all tasks are completed
    if (isVisible && initialCheckStatus === "needsAction") {
      setProceedButtonEnabled(totalTasks > 0 && completedTasks === totalTasks);
    }
  }, [totalTasks, completedTasks, isVisible, initialCheckStatus]);

  // Monitor for tasks being unchecked after agreement was satisfied
  useEffect(() => {
    if (agreementSatisfiedOnce && !isVisible && totalTasks > 0 && completedTasks < totalTasks) {
      if (typeof Notice === 'function') {
        new Notice("Please re-confirm your agreement. A task has been unchecked.", 7000);
      }
      setInitialCheckStatus("needsAction");
      setIsVisible(true);
      setAgreementSatisfiedOnce(false);
    }
  }, [completedTasks, totalTasks, agreementSatisfiedOnce, isVisible]);

  const handleToggleTask = async (taskToToggle) => {
    if (!isIframeLoaded) {
      if (typeof Notice === 'function') new Notice("Please wait for the terms to load completely.", 3000);
      else console.warn("Attempted to toggle task before iframe loaded.");
      return;
    }
    if (!obsidianApp || !obsidianApp.vault?.read || !obsidianApp.vault?.modify || !obsidianApp.vault?.getAbstractFileByPath) {
      if (typeof Notice === 'function') new Notice("Error: Cannot modify task. Obsidian integration is missing.", 5000); 
      else alert("Error: Cannot modify task. Obsidian integration is missing."); 
      return;
    }
    
    const filePathFromTask = taskToToggle.$file; 
    const lineNumber = taskToToggle.$line;
    
    if (filePathFromTask === undefined || lineNumber === undefined) {
      if (typeof Notice === 'function') new Notice("Error: Task data is incomplete.", 5000); 
      else alert("Error: Task data is incomplete. Cannot update."); 
      return;
    }
    
    if (typeof filePathFromTask !== 'string') {
      if (typeof Notice === 'function') new Notice("Error: Invalid task file path.", 5000); 
      else alert("Error: Invalid task file path."); 
      return;
    }
    
    const fileObject = obsidianApp.vault.getAbstractFileByPath(filePathFromTask);
    
    if (!fileObject || fileObject.path !== filePathFromTask || typeof fileObject.basename !== 'string') {
      if (typeof Notice === 'function') new Notice(`Error: File "${filePathFromTask}" not found.`, 7000); 
      else alert(`Error: File "${filePathFromTask}" not found or could not be confirmed.`); 
      return;
    }
    
    try {
      const currentFileContentString = await obsidianApp.vault.read(fileObject);
      if (typeof currentFileContentString !== 'string') {
        if (typeof Notice === 'function') new Notice(`Error: Could not read content of "${filePathFromTask}".`, 7000); 
        else alert(`Error: Could not read content of "${filePathFromTask}".`); 
        return;
      }
      
      const lines = currentFileContentString.split('\n');
      if (lineNumber >= lines.length) {
        if (typeof Notice === 'function') new Notice(`Error: Task line out of sync.`, 7000); 
        else alert(`Error: Task line number is out of sync with file content. Please refresh or check the file.`); 
        return;
      }
      
      let targetLine = lines[lineNumber];
      
      const taskLineRegex = /^(\s*-\s*\[)([xX\s])(\]\s*.*)$/;
      const match = targetLine.match(taskLineRegex);
      
      if (match) {
        const prefix = match[1]; 
        const currentStatus = match[2]; 
        const suffix = match[3];
        // Toggle: if it's a space, make it 'x', otherwise make it a space
        let newStatus = (currentStatus === ' ') ? 'x' : ' ';
        lines[lineNumber] = `${prefix}${newStatus}${suffix}`;
        
        await obsidianApp.vault.modify(fileObject, lines.join('\n'));
        
        // Reload tasks after modification
        setTimeout(() => loadTasks(), 100);
      } else {
        console.error(`[LicenseAgreement] Regex match failed for line: "${targetLine}"`);
        if (typeof Notice === 'function') new Notice(`Could not update task: Incorrect format. Task: "${targetLine.trim()}"`, 7000); 
        else alert(`Could not update task: The line format seems incorrect. Task: "${targetLine.trim()}"`); 
        return;
      }
    } catch (error) {
      console.error("[LicenseAgreement] Error toggling task:", error);
      if (typeof Notice === 'function') new Notice(`Error updating task: ${error.message}`, 7000); 
      else alert(`An unexpected error occurred while updating the task: ${error.message}`);
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
          if (typeof Notice === 'function') {
              new Notice("Please re-confirm your agreement. A task has been unchecked.", 7000);
          }
          setInitialCheckStatus("needsAction");
          setIsVisible(true);
          setAgreementSatisfiedOnce(false);
      }
  }, [completedTasks, totalTasks, agreementSatisfiedOnce, isVisible]);


  if (!obsidianApp || !obsidianApp.vault?.read || !obsidianApp.vault?.modify || !obsidianApp.vault?.getAbstractFileByPath) {
    return ( <div style={{ padding: "20px", border: "1px solid #ff6b6b", borderRadius: "8px", backgroundColor: "#2c1d1d", color: "#ffcccc", fontFamily: "sans-serif" }}> <h3 style={{color: "#ff8080", marginTop: 0}}>Critical Error: Obsidian Integration Missing</h3> <p>Component requires `app.vault` methods.</p> </div> );
  }
  
  if (initialCheckStatus === "pending") { return null; } 
  if (!isVisible) { 
    // Don't return null - return empty div so wrapper stays mounted
    return <div style={{display: 'none'}} data-license-hidden="true" />;
  }

  return (
    <div
      ref={containerRef}
      tabIndex={isActive ? 0 : -1}
      style={{
        outline: 'none',
      }}
    >
      <div style={contentWrapperStyle}>
        {/* Header Section */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--glow-faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 900,
              color: "var(--glow)",
              margin: 0,
              fontVariant: "small-caps",
              letterSpacing: "0.5px",
            }}
          >
            Terms of Service
          </h2>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {isIframeLoaded
              ? "Review and check the box to proceed"
              : "Loading…"}
          </span>
        </div>

        {/* Iframe Container with Background */}
        <div style={{ position: "relative", background: "#0b0713" }}>
          <div
            style={{
              maxHeight: "55vh",
              minHeight: "280px",
              overflow: "hidden",
              padding: "18px 18px 6px 18px",
            }}
          >
            <div style={iframeContainerStyle}>
              {debug && (
                <button
                  onClick={handleDebugBypass}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    zIndex: 3,
                    background: 'rgba(255, 0, 0, 0.8)',
                    color: 'white',
                    border: '1px solid rgba(255, 0, 0, 0.6)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(255, 0, 0, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 0, 0, 1)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 0, 0, 0.8)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  🔧 DEBUG BYPASS
                </button>
              )}
              <button
                onClick={handleRefreshIframe}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 2, 
                  background: 'rgba(10,6,16,0.6)', 
                  color: 'var(--glow)',
                  border: '1px solid var(--glow)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--glow)';
                  e.currentTarget.style.color = '#0b0713';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(10,6,16,0.6)';
                  e.currentTarget.style.color = 'var(--glow)';
                }}
                title="Refresh" 
              >
                ↻
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
          </div>
        </div>

        {!isIframeLoaded && (
          <p style={{
            textAlign: 'center', 
            color: 'orange', 
            fontStyle: 'italic', 
            padding: '10px 18px', 
            margin: '0',
          }}>
            Loading terms… Please wait to interact.
          </p>
        )}

        <div style={taskListOuterContainerStyle}>
          {tasks.length > 0 ? (
            <ul style={{ listStyleType: "none", paddingLeft: "0", margin: "0", opacity: isIframeLoaded ? 1 : 0.7 }}>
              {sortedTasks.map((task, index) => {
                const isCompleted = task.$completed; 
                const taskKey = task.$id || `task-${index}-${task.$line}-${task.$file || 'unknownfile'}`;
                const uniqueId = `task-checkbox-${taskKey.replace(/[^a-zA-Z0-9-_]/g, '')}`; 
                const taskFilePathDisplay = task.$file || "Unknown file";
                return (
                  <li key={taskKey} style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '8px',
                    padding: '8px 10px',
                    borderLeft: isCompleted ? `4px solid ${colorCompleted}` : `4px solid ${colorIncomplete}`,
                    backgroundColor: isCompleted ? colorCompletedBg : colorIncompleteBg,
                    border: `1px solid var(--glow-faint)`,
                    borderLeft: isCompleted ? `4px solid ${colorCompleted}` : `4px solid ${colorIncomplete}`,
                    borderRadius: '6px', 
                    transition: 'background-color 0.3s ease, border-left-color 0.3s ease',
                    opacity: isIframeLoaded ? 1 : 0.7
                  }}>
                    <input
                      type="checkbox" 
                      id={uniqueId} 
                      checked={!!isCompleted}
                      onChange={(e) => { 
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleTask(task);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      disabled={!isIframeLoaded}
                      style={{
                        margin: '0 12px 0 0', 
                        cursor: isIframeLoaded ? 'pointer' : 'not-allowed', 
                        transform: 'scale(1.2)',
                        accentColor: isCompleted ? colorCompleted : colorIncomplete,
                        flexShrink: 0
                      }}
                      title={isIframeLoaded ? `Toggle task status (from ${taskFilePathDisplay})` : "Wait for terms to load"} 
                    />
                    <label
                      htmlFor={uniqueId}
                      onClick={(e) => {
                        e.preventDefault();
                        if (isIframeLoaded) {
                          handleToggleTask(task);
                        }
                      }}
                      style={{
                        flexGrow: 1, 
                        cursor: isIframeLoaded ? 'pointer' : 'default',
                        color: isCompleted ? 'var(--text-muted)' : 'var(--text-normal)',
                        textDecoration: 'none', 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word',
                      }}>
                        {task.$text}
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : ( 
            <p style={{
              color: "var(--text-muted)", 
              fontStyle: "italic", 
              textAlign: "center", 
              marginTop: "20px" 
            }}> 
              No tasks found for "{targetFileNameOnly}". <br/> 
              <small>Ensure the file exists and contains Markdown tasks (e.g., "- [ ] Task").</small> 
            </p> 
          )}
        </div>

        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '14px',
          padding: '14px 18px', 
          textAlign: 'right', 
          flexShrink: 0, 
          borderTop: "1px solid var(--glow-faint)",
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            className="btn"
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--glow)',
              background: 'rgba(10,6,16,0.4)',
              color: 'var(--glow)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontVariant: 'small-caps',
            }}
            onClick={() => {
              const u = iframeSrc;
              const w = window.open(u, "_blank", "noopener,noreferrer");
              if (!w) navigator.clipboard?.writeText(u);
            }}
          >
            [ Open Full Page ]
          </button>
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
              padding: '10px 14px',
              borderRadius: '8px',
              border: proceedButtonEnabled ? '1px solid #8a2be2' : '1px solid rgba(255,255,255,0.2)',
              cursor: proceedButtonEnabled ? 'pointer' : 'not-allowed',
              backgroundColor: proceedButtonEnabled ? '#8a2be2' : colorButtonDisabledBg,
              color: proceedButtonEnabled ? '#ffffff' : colorButtonDisabledText,
              fontSize: '12px',
              fontWeight: 700,
              opacity: proceedButtonEnabled ? 1 : colorButtonDisabledOpacity,
              transition: 'all 0.3s ease',
              fontVariant: 'small-caps',
              boxShadow: proceedButtonEnabled ? '0 0 20px rgba(138,43,226,0.4)' : 'none',
            }}
            onMouseOver={(e) => {
              if (proceedButtonEnabled) {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(138,43,226,0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (proceedButtonEnabled) {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(138,43,226,0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            title={proceedButtonEnabled ? "Proceed to the next step" : "Complete all tasks to enable"}>
            [ I Agree & Continue ]
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

// Debug Full-Tab Component - Shows debug reset controls in full-tab mode
function DebugResetFullTab({ config, obsidianApp }) {
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  const [isFullTab, setIsFullTab] = useState(false);
  
  const {
    targetFileName = "TERMS OF SERVICE.approval.md"
  } = config;
  
  // Set up full-tab mode
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    
    const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }
    
    const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement("div");
    stateRefs.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.placeholder, container);
    
    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    
    if (stateRefs.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }
    
    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "auto",
    });
    
    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);
  
  const handleReset = async () => {
    const files = obsidianApp.vault.getFiles().filter((f) => /\.md$/i.test(f.path));
    let hit = files.find((f) => {
      const basename = f.path.split('/').pop() || '';
      return basename.toLowerCase() === targetFileName.toLowerCase();
    });
    
    if (!hit) {
      hit = files.find((f) => {
        const basename = f.path.split('/').pop() || '';
        return basename.toLowerCase().includes('terms') && 
               basename.toLowerCase().includes('service') &&
               basename.toLowerCase().includes('approval');
      });
    }
    
    if (!hit) {
      if (obsidianApp?.Notice) new obsidianApp.Notice("Cannot reset: TOS file not found.", 5000);
      return;
    }
    
    try {
      const currentContent = await obsidianApp.vault.read(hit);
      const lines = currentContent.split('\n');
      const modifiedLines = lines.map(line => {
        const taskMatch = line.match(/^(\s*-\s*\[)([xX\s])(\]\s*.*)$/);
        if (taskMatch && (taskMatch[2] === 'x' || taskMatch[2] === 'X')) {
          return `${taskMatch[1]} ${taskMatch[3]}`;
        }
        return line;
      });
      await obsidianApp.vault.modify(hit, modifiedLines.join('\n'));
      if (obsidianApp?.Notice) new obsidianApp.Notice("✅ All TOS tasks have been reset!", 3000);
      setIsFullTab(false);
    } catch (error) {
      console.error('[DebugResetFullTab] Error resetting:', error);
      if (obsidianApp?.Notice) new obsidianApp.Notice(`Reset failed: ${error.message}`, 5000);
    }
  };
  
  const handleOpenFullTab = () => setIsFullTab(true);
  const handleCloseFullTab = () => setIsFullTab(false);
  
  // Compact button view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        padding: '12px 18px',
        backgroundColor: 'rgba(255, 77, 77, 0.95)',
        color: '#ffffff',
        borderRadius: '8px',
        zIndex: 999999,
        cursor: 'pointer',
        fontWeight: 700,
        boxShadow: '0 4px 20px rgba(255, 77, 77, 0.6)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        fontSize: '13px',
      }} onClick={handleOpenFullTab}>
        🔧 Debug Mode
      </div>
    );
  }
  
  // Full-tab view
  return (
    <div ref={containerRef}>
      <div style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        padding: '40px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        backgroundColor: 'var(--background-secondary)',
        border: '1px solid var(--background-modifier-border)',
        borderRadius: '8px',
        color: 'var(--text-normal)',
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          fontSize: '24px',
          cursor: 'pointer',
          opacity: 0.6,
          transition: 'opacity 0.2s',
        }} onClick={handleCloseFullTab} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.6}>
          ×
        </div>
        
        <h2 style={{ fontSize: '2em', fontWeight: '600', color: 'var(--text-normal)', margin: 0 }}>
          🔧 Debug Mode
        </h2>
        
        <p style={{ fontSize: '1em', color: 'var(--text-muted)', maxWidth: '500px', textAlign: 'center', margin: 0 }}>
          Reset TOS approval status for testing purposes. This will uncheck all tasks in the TOS file.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button onClick={handleReset} style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: '#ff4d4d',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255, 77, 77, 0.3)',
          }}>
            Reset TOS Tasks
          </button>
          
          <button onClick={handleCloseFullTab} style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--background-modifier-hover)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Internal Reset Component - Shows after agreement is satisfied
function InternalResetComponent({ config, obsidianApp }) {
  const {
    targetFileName = "TERMS OF SERVICE.approval.md"
  } = config;
  
  const [isVisible, setIsVisible] = useState(false);
  const [tosFilePath, setTosFilePath] = useState(null);
  
  // Function to find TOS file (same logic as main component)
  const findTosFileForReset = useCallback(async () => {
    const files = obsidianApp.vault.getFiles().filter((f) => /\.md$/i.test(f.path));
    
    // Try exact match
    let hit = files.find((f) => {
      const basename = f.path.split('/').pop() || '';
      return basename.toLowerCase() === targetFileName.toLowerCase();
    });
    
    if (hit) return hit;
    
    // Try fuzzy match
    hit = files.find((f) => {
      const basename = f.path.split('/').pop() || '';
      return basename.toLowerCase().includes('terms') && 
             basename.toLowerCase().includes('service') &&
             basename.toLowerCase().includes('approval');
    });
    
    return hit || null;
  }, [obsidianApp, targetFileName]);
  
  // Check if agreement is satisfied
  useEffect(() => {
    const checkAgreementStatus = async () => {
      const file = await findTosFileForReset();
      if (!file) return;
      
      setTosFilePath(file.path);
      
      try {
        const content = await obsidianApp.vault.read(file);
        const lines = content.split('\n');
        
        let total = 0;
        let completed = 0;
        
        for (const line of lines) {
          const taskMatch = line.match(/^\s*-\s*\[([xX\s])\]\s*(.*)$/);
          if (taskMatch) {
            total++;
            if (taskMatch[1] === 'x' || taskMatch[1] === 'X') {
              completed++;
            }
          }
        }
        
        // Show reset button if all tasks are completed
        const shouldShow = total > 0 && completed === total;
        setIsVisible(shouldShow);
      } catch (error) {
        console.error('[LicenseAgreementReset] Error checking status:', error);
      }
    };
    
    checkAgreementStatus();
    
    // Watch for file changes
    const eventRef = obsidianApp?.vault?.on('modify', (file) => {
      if (file.path && file.path.includes(targetFileName)) {
        checkAgreementStatus();
      }
    });
    
    return () => {
      if (eventRef && obsidianApp?.vault?.offref) {
        obsidianApp.vault.offref(eventRef);
      }
    };
  }, [targetFileName, findTosFileForReset, obsidianApp]);
  
  const handleReset = async () => {
    const file = await findTosFileForReset();
    if (!file) {
      if (obsidianApp?.Notice) new obsidianApp.Notice("Cannot reset: TOS file not found.", 5000);
      return;
    }
    
    try {
      const currentContent = await obsidianApp.vault.read(file);
      const lines = currentContent.split('\n');
      
      // Uncheck all checked tasks
      const modifiedLines = lines.map(line => {
        const taskMatch = line.match(/^(\s*-\s*\[)([xX\s])(\]\s*.*)$/);
        if (taskMatch && (taskMatch[2] === 'x' || taskMatch[2] === 'X')) {
          return `${taskMatch[1]} ${taskMatch[3]}`;
        }
        return line;
      });
      
      await obsidianApp.vault.modify(file, modifiedLines.join('\n'));
      if (obsidianApp?.Notice) new obsidianApp.Notice("✅ All TOS tasks have been reset!", 3000);
    } catch (error) {
      console.error('[LicenseAgreementReset] Error resetting tasks:', error);
      if (obsidianApp?.Notice) new obsidianApp.Notice(`Reset failed: ${error.message}`, 5000);
    }
  };

  // If not visible and not in debug mode, bail out early
  if (!isVisible && !config?.debug) return null;

  // If we're in debug mode but not visible yet, render a small debug toggle immediately
  if (!isVisible && config?.debug) {
    const debugToggle = (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '8px 12px',
          backgroundColor: '#ff4d4d',
          color: '#ffffff',
          borderRadius: '8px',
          zIndex: 999999,
          cursor: 'pointer',
          fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}
        onClick={() => setIsVisible(true)}
        title="Show Reset TOS (debug)"
      >
        🔧 Reset TOS (debug)
      </div>
    );

    if (typeof createPortal === 'function') {
      return createPortal(debugToggle, document.body);
    }

    return debugToggle;
  }
  
  try {
    const resetUI = (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '20px',
        backgroundColor: 'red',
        color: 'white',
        fontSize: '20px',
        fontWeight: 'bold',
        border: '5px solid yellow',
        borderRadius: '12px',
        boxShadow: '0 0 50px rgba(255, 0, 0, 0.9)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
      gap: '12px',
      minWidth: '280px'
    }}>
      <div style={{
        color: 'var(--text-normal)',
        fontSize: '13px',
        fontWeight: '500'
      }}>
        🔄 TOS Agreement Complete
      </div>
      <button
        onClick={handleReset}
        style={{
          padding: '10px 20px',
          backgroundColor: 'rgba(255, 150, 0, 0.2)',
          color: 'rgb(255, 180, 80)',
          border: '1px solid rgba(255, 150, 0, 0.4)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          textAlign: 'center'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 150, 0, 0.3)';
          e.target.style.borderColor = 'rgba(255, 150, 0, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 150, 0, 0.2)';
          e.target.style.borderColor = 'rgba(255, 150, 0, 0.4)';
        }}
      >
        Reset All Tasks (Testing)
      </button>
    </div>
    );
    
    // Use createPortal to render directly to document.body, bypassing Datacore's rendering system
    if (typeof createPortal === 'function') {
      return createPortal(resetUI, document.body);
    }
    
    return resetUI;
  } catch (error) {
    console.error('[InternalResetComponent] ERROR RENDERING:', error);
    return <div style={{position: 'fixed', top: '50%', left: '50%', background: 'red', color: 'white', padding: '20px', zIndex: 999999}}>ERROR: {error.message}</div>;
  }
}
function LicenseAgreementWithReset({ config = {} }) {
  const obsidianApp = dc?.app || app;
  const { useEffect } = dc;
  
  // Debug reset button via direct DOM manipulation
  useEffect(() => {
    if (!config?.debug) return;
    
    let layoutChangeHandler; // Declare in outer scope
    let observer; // Declare observer in outer scope
    
    const findTosFile = async () => {
      const files = obsidianApp.vault.getFiles().filter((f) => /\.md$/i.test(f.path));
      let hit = files.find((f) => {
        const basename = f.path.split('/').pop() || '';
        return basename.toLowerCase() === config.targetFileName?.toLowerCase();
      });
      if (hit) return hit;
      hit = files.find((f) => {
        const basename = f.path.split('/').pop() || '';
        return basename.toLowerCase().includes('terms') && 
               basename.toLowerCase().includes('service') &&
               basename.toLowerCase().includes('approval');
      });
      return hit || null;
    };
    
    const checkAndRender = async () => {
      const file = await findTosFile();
      if (!file) return;
      
      // Check if already rendered
      let container = document.getElementById('debug-reset-button-container');
      if (container) {
        // Just update visibility if already exists
        const checkVisibility = () => {
          const workspaceLeaf = document.querySelector('.workspace-leaf.mod-active');
          if (!workspaceLeaf) {
            container.style.display = 'none';
            return;
          }
          
          const viewContent = workspaceLeaf.querySelector('.view-content');
          const datacoreBlocks = viewContent?.querySelectorAll('.block-language-datacorejsx');
          let isInActiveTab = false;
          
          if (datacoreBlocks) {
            datacoreBlocks.forEach(block => {
              if (block.textContent.includes('LicenseAgreement') || 
                  block.querySelector('[data-license-hidden]') ||
                  block.querySelector('.workspace-leaf-content')) {
                isInActiveTab = true;
              }
            });
          }
          
          container.style.display = isInActiveTab ? 'flex' : 'none';
        };
        checkVisibility();
        return;
      }
      
      // Create container
      container = document.createElement('div');
      container.id = 'debug-reset-button-container';
      container.style.cssText = `
        position: fixed;
        top: 50px;
        right: 24px;
        padding: 16px 20px;
        background-color: rgba(255, 77, 77, 0.95);
        color: #ffffff;
        border-radius: 12px;
        z-index: 999999;
        font-weight: 700;
        box-shadow: 0 4px 20px rgba(255, 77, 77, 0.6);
        border: 2px solid rgba(255, 255, 255, 0.3);
        font-size: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 200px;
      `;
      
      const title = document.createElement('div');
      title.textContent = '🔧 Debug Mode';
      title.style.cssText = 'font-size: 12px; opacity: 0.9;';
      container.appendChild(title);
      
      const button = document.createElement('button');
      button.textContent = 'Reset TOS Tasks';
      button.style.cssText = `
        padding: 8px 16px;
        background-color: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      `;
      
      button.onclick = async () => {
        const tosFile = await findTosFile();
        if (!tosFile) {
          if (obsidianApp?.Notice) new obsidianApp.Notice("Cannot reset: TOS file not found.", 5000);
          return;
        }
        
        try {
          const currentContent = await obsidianApp.vault.read(tosFile);
          const lines = currentContent.split('\n');
          const modifiedLines = lines.map(line => {
            const taskMatch = line.match(/^(\s*-\s*\[)([xX\s])(\]\s*.*)$/);
            if (taskMatch && (taskMatch[2] === 'x' || taskMatch[2] === 'X')) {
              return `${taskMatch[1]} ${taskMatch[3]}`;
            }
            return line;
          });
          await obsidianApp.vault.modify(tosFile, modifiedLines.join('\n'));
          if (obsidianApp?.Notice) new obsidianApp.Notice("✅ All TOS tasks have been reset!", 3000);
        } catch (error) {
          console.error('[DebugResetButton] Error resetting:', error);
          if (obsidianApp?.Notice) new obsidianApp.Notice(`Reset failed: ${error.message}`, 5000);
        }
      };
      
      container.appendChild(button);
      document.body.appendChild(container);
      
      // Hide button when tab is not active (detect workspace leaf changes)
      const checkVisibility = () => {
        // Find the workspace leaf that contains this component
        const workspaceLeaf = document.querySelector('.workspace-leaf.mod-active');
        if (!workspaceLeaf) {
          container.style.display = 'none';
          return;
        }
        
        // Check if our viewer is in the active leaf
        const viewContent = workspaceLeaf.querySelector('.view-content');
        const datacoreBlocks = viewContent?.querySelectorAll('.block-language-datacorejsx');
        let isInActiveTab = false;
        
        if (datacoreBlocks) {
          datacoreBlocks.forEach(block => {
            // Check if this block contains our component by looking for specific elements
            if (block.textContent.includes('LicenseAgreement') || 
                block.querySelector('[data-license-hidden]') ||
                block.querySelector('.workspace-leaf-content')) {
              isInActiveTab = true;
            }
          });
        }
        
        container.style.display = isInActiveTab ? 'flex' : 'none';
      };
      
      // Initial check
      checkVisibility();
      
      // Watch for tab/leaf changes
      observer = new MutationObserver(checkVisibility);
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
      });
      
      // Also watch for workspace events
      layoutChangeHandler = () => checkVisibility();
      obsidianApp.workspace.on('layout-change', layoutChangeHandler);
      obsidianApp.workspace.on('active-leaf-change', layoutChangeHandler);
    };
    
    // Initial render
    checkAndRender();
    
    // Also check after a short delay to ensure DOM is ready
    setTimeout(() => checkAndRender(), 100);
    
    // Watch for file changes
    const eventRef = obsidianApp?.vault?.on('modify', (file) => {
      if (file.path && config.targetFileName && file.path.includes(config.targetFileName)) {
        checkAndRender();
      }
    });
    
    return () => {
      const container = document.getElementById('debug-reset-button-container');
      if (container) container.remove();
      if (eventRef && obsidianApp?.vault?.offref) {
        obsidianApp.vault.offref(eventRef);
      }
      // Clean up workspace event listeners
      if (layoutChangeHandler && obsidianApp?.workspace) {
        obsidianApp.workspace.off('layout-change', layoutChangeHandler);
        obsidianApp.workspace.off('active-leaf-change', layoutChangeHandler);
      }
      // Clean up mutation observer
      if (observer) {
        observer.disconnect();
      }
    };
  }, [config?.debug, config?.targetFileName, obsidianApp]);
  
  return <LicenseAgreement config={config} />;
}

// Export will be at the end after ScreenModeHelper

// ============================================
// ScreenModeHelper Component
// ============================================

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
      }
      applyCssText(container, stylesByMode[activeMode]);
    }
    initialStylesAppliedRef.current = true;

    if (engine?.resize) setTimeout(() => engine.resize(), 50);

  }, [containerRef, activeMode, initialMode, defaultStyle, stylesByMode, allowedScreenModes, engine, originalParentRefForWindow, originalParentRefForPiP]);


  const toggleMode = useCallback((requestedMode) => {
    // This function will likely not be called if hideToggleButtons is true,
    // but keeping it for completeness or future use.
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
      if (defaultStyle) applyCssText(container, defaultStyle);
      else applyCssText(container, 'display: block; position: relative;');
      return;
    }

    if (currentActualActiveMode !== "default") {
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
      const parentRefForNewMode = newEffectiveMode === 'window' ? originalParentRefForWindow :
                                 newEffectiveMode === 'pip' ? originalParentRefForPiP : null;

      if (parentRefForNewMode && !parentRefForNewMode.current && container.parentNode && container.parentNode !== document.body) {
        parentRefForNewMode.current = container.parentNode;
      }

      if (container.parentNode !== document.body) {
        if (container.parentNode) {
          try { container.parentNode.removeChild(container); }
          catch (e) { console.error("[ScreenModeHelper] Error removing container from its current parent:", container.parentNode, e); }
        }
        document.body.appendChild(container);
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
      if (currentContainer && modeAtUnmountSetup !== 'default') {
        const modesRequiringReset = ["window", "pip"];
        if (modesRequiringReset.includes(modeAtUnmountSetup)) {
          const parentRefToUseForReset = modeAtUnmountSetup === 'window' ? originalParentRefForWindow :
                                         modeAtUnmountSetup === 'pip' ? originalParentRefForPiP : null;

          if (parentRefToUseForReset && parentRefToUseForReset.current) {
             reparentToOriginal(currentContainer, parentRefToUseForReset);
             // After reparenting, apply default styles
             if (defaultStyle) {
                applyCssText(currentContainer, defaultStyle);
             } else {
                applyCssText(currentContainer, 'display: block; position: relative;');
                console.warn("[ScreenModeHelper] Unmounting: Applied fallback style (no defaultStyle) after reparenting.");
             }
          } else if (currentContainer.parentNode === document.body) {
             console.warn("[ScreenModeHelper] Unmounting from body, but no original parent ref to return to. Attempting to remove from body.");
             try {
                document.body.removeChild(currentContainer);
             } catch (e) {
                console.error("[ScreenModeHelper] Unmounting: Error removing container from document.body:", e);
             }
          } else {
            console.warn("[ScreenModeHelper] Unmounting: Container not in body and no original parent ref. State:", currentContainer.parentNode);
          }
        }
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

return { ScreenModeHelper, LicenseAgreement: LicenseAgreementWithReset };
```



