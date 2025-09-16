




# ViewComponent

```jsx
// -------------------------
// WorldView Component (ViewComponent)
// -------------------------
const { useRef, useEffect, useState } = dc;

// A new helper component to dynamically load and display the spawned component.
// It will render inside the main container.
// --- CORRECTED: This component is now more flexible AND works correctly. ---
// It still expects a header named 'ViewComponent'. It then inspects the
// returned module to dynamically find the exported component function name.
function DynamicComponentLoader({ filePath, onClose }) {
  const [LoadedComponent, setLoadedComponent] = useState(null);
  const [error, setError] = useState(null);

  // --- CONVENTION DEFINITION ---
  const CONVENTION_HEADER = "ViewComponent";

  useEffect(() => {
    // Reset state when props change
    setLoadedComponent(null);
    setError(null);
    
    (async () => {
      try {
        console.log(`[DynamicLoader] 1. Starting load for component from: ${filePath}`);
        
        // --- STEP 1: Require the module using the standard method ---
        const dynamicModule = await dc.require(dc.headerLink(filePath, CONVENTION_HEADER));
        
        // --- DEBUG: Log the entire module we received ---
        console.log('[DynamicLoader] 2. Successfully required module:', dynamicModule);

        if (!dynamicModule || typeof dynamicModule !== 'object') {
          throw new Error(`The file loaded, but did not export a valid object from header '${CONVENTION_HEADER}'.`);
        }

        // --- STEP 2: Get the keys (the names of the exports) from the module ---
        const exportedKeys = Object.keys(dynamicModule);
        
        // --- DEBUG: Log the keys we found ---
        console.log(`[DynamicLoader] 3. Found exported keys:`, exportedKeys);

        if (exportedKeys.length === 0) {
          throw new Error(`The module loaded, but it does not have any exports. Make sure you have a 'return { YourComponent }' statement.`);
        }

        // --- STEP 3: Assume the first key is our component name ---
        const dynamicFunctionName = exportedKeys[0];
        if (exportedKeys.length > 1) {
            console.warn(`[DynamicLoader] Warning: Found multiple exports (${exportedKeys.join(', ')}). Using the first one: '${dynamicFunctionName}'.`);
        }
        
        // --- DEBUG: Log the function name we decided to use ---
        console.log(`[DynamicLoader] 4. Using function name: '${dynamicFunctionName}'`);

        const Component = dynamicModule[dynamicFunctionName];
        
        if (typeof Component !== 'function') {
            throw new Error(`The export '${dynamicFunctionName}' was found, but it is not a renderable function/component.`);
        }

        // --- STEP 4: Set the component in state ---
        console.log(`[DynamicLoader] 5. Success! Setting component to state.`);
        setLoadedComponent(() => Component);

      } catch (err) {
        console.error("Error loading dynamic component:", err);
        setError(`Failed to load component: ${err.message}`);
      }
    })();
  }, [filePath]); // Dependency array is just filePath

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#fff', color: '#111', overflow: 'auto' }}>
      <button 
        onClick={onClose} 
        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20, cursor: 'pointer', padding: '5px 10px' }}>
        Close
      </button>
      <div style={{ padding: '10px' }}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {LoadedComponent ? <LoadedComponent /> : !error && <p>Loading component...</p>}
      </div>
    </div>
  );
}


function WorldView() {
  // Refs for container and canvas.
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // State for Babylon engine and scene.
  const [engine, setEngine] = useState(null);
  const [scene, setScene] = useState(null);
  
  // Refs for the player and keyboard input.
  const playerRef = useRef(null);
  const keysPressed = useRef({});
  
  // State for Component Spawning.
  const [spawnedComponent, setSpawnedComponent] = useState(null);
  const [customFile, setCustomFile] = useState("");

  // Handler for submitting the custom spawn form.
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setSpawnedComponent({
      file: customFile,
    });
  };

  // -------------------------
  // Babylon.js Loader & Setup
  // -------------------------
  useEffect(() => {
    if (!spawnedComponent && !engine && window.BABYLON) {
        initBabylon();
    } else if (!spawnedComponent && !engine && !window.BABYLON) {
        console.log("[WorldView] Loading Babylon.js if necessary");
        const script = document.createElement("script");
        script.src = "https://cdn.babylonjs.com/babylon.js";
        script.async = true;
        script.onload = () => {
            console.log("[WorldView] Babylon.js loaded");
            initBabylon();
        };
        document.body.appendChild(script);
        return () => {
            console.log("[WorldView] Removing Babylon.js script");
            document.body.removeChild(script);
        };
    }
  }, [spawnedComponent]); 
  
  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  
  const initBabylon = () => {
    if (canvasRef.current && window.BABYLON && !engine) {
      console.log("[WorldView] Initializing Babylon engine");
      const babylonEngine = new window.BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, adaptToDeviceRatio: true });
      const babylonScene = new window.BABYLON.Scene(babylonEngine);
      
      const camera = new window.BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2.5, 10, window.BABYLON.Vector3.Zero(), babylonScene);
      camera.attachControl(canvasRef.current, true);
      
      new window.BABYLON.HemisphericLight("light", new window.BABYLON.Vector3(0, 1, 0), babylonScene);
      
      window.BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, babylonScene);
      
      const player = window.BABYLON.MeshBuilder.CreateSphere("player", { diameter: 1 }, babylonScene);
      player.position.y = 0.5;
      playerRef.current = player;
      
      setEngine(babylonEngine);
      setScene(babylonScene);
      
      const moveSpeed = 0.1;
      babylonEngine.runRenderLoop(() => {
        if (keysPressed.current["w"] || keysPressed.current["ArrowUp"]) player.position.z -= moveSpeed;
        if (keysPressed.current["s"] || keysPressed.current["ArrowDown"]) player.position.z += moveSpeed;
        if (keysPressed.current["a"] || keysPressed.current["ArrowLeft"]) player.position.x -= moveSpeed;
        if (keysPressed.current["d"] || keysPressed.current["ArrowRight"]) player.position.x += moveSpeed;
        babylonScene.render();
      });
      
      const resizeHandler = () => {
        babylonEngine.resize();
      };
      window.addEventListener("resize", resizeHandler);
      
      babylonScene.onDisposeObservable.add(() => {
        window.removeEventListener("resize", resizeHandler);
      });
    }
  };
  
  return (
    <div>
      {/* Container for Babylon view or Spawned Component */}
      <div 
        ref={containerRef} 
        style={{ position: "relative", width: "100%", height: "400px", border: "1px solid #ccc", backgroundColor: "#fafafa" }}>
        
        {/* CONDITIONAL RENDER: Show component or Babylon canvas */}
        {spawnedComponent ? (
          <DynamicComponentLoader
            filePath={spawnedComponent.file}
            onClose={() => setSpawnedComponent(null)}
          />
        ) : (
          <canvas 
            ref={canvasRef} 
            style={{ width: "100%", height: "100%", display: "block", backgroundColor: "#333" }} 
          />
        )}
      </div>
      
      {/* Custom component spawn section */}
      <div style={{ marginTop: "10px", padding: "10px", border: "1px solid #ccc", backgroundColor: "#f9f9f9" }}>
        <h3>Spawn Component In-Place</h3>
        <form onSubmit={handleCustomSubmit}>
          <div style={{ marginBottom: "8px" }}>
            <input
              type="text"
              placeholder="Enter file path (e.g., LOTTIE!!v.2.4.md)"
              value={customFile}
              onChange={(e) => setCustomFile(e.target.value)}
              style={{ width: "100%", padding: "6px" }}
              required
            />
          </div>
          <button type="submit" style={{ padding: "8px 16px" }}>
            Spawn Component
          </button>
        </form>
      </div>
    </div>
  );
}

return { WorldView };
```





# ScreenModeHelper

```jsx
/** @jsx h */
const { h, render } = dc.preact;
const { useState, useEffect, useRef } = dc;

/*==============================================================================
  GLOBAL Z-INDEX MANAGEMENT
==============================================================================*/
// We'll maintain a global variable for the highest z-index.
let highestZIndex = 10000;

/**
 * updateHighestZIndex
 * Recalculates the highest z-index among all pip containers (having the "fresh-pip" class)
 * and updates the global variable.
 */
function updateHighestZIndex() {
  let max = 0;
  document.querySelectorAll('.fresh-pip').forEach((el) => {
    const z = parseInt(window.getComputedStyle(el).zIndex, 10) || 0;
    if (z > max) {
      max = z;
    }
  });
  highestZIndex = max;
}

/**
 * bringToFront
 * When a pip is activated for interaction, we update the global highest z-index
 * by recalculating the current maximum and then assign the container (once) a new z-index
 * that is (current maximum + offset). The offset is fixed (here, 1).
 */
function bringToFront(container) {
  updateHighestZIndex();
  highestZIndex++; // assign the next highest value
  container.style.zIndex = highestZIndex;
  console.log(`[bringToFront] Container brought to zIndex: ${highestZIndex}`);
}

/*==============================================================================
  HELPER FUNCTIONS FOR APPLYING SCREEN MODES
==============================================================================*/
function resetScreenMode(container, defaultStyle, originalParentRefForWindow, originalParentRefForPiP) {
  if (originalParentRefForWindow.current) {
    originalParentRefForWindow.current.appendChild(container);
    originalParentRefForWindow.current = null;
  }
  if (originalParentRefForPiP.current) {
    originalParentRefForPiP.current.appendChild(container);
    originalParentRefForPiP.current = null;
    if (container._pipDragAttached) {
      container.removeEventListener("mousedown", container._pipDragAttached.dragStart);
      window.removeEventListener("mousemove", container._pipDragAttached.dragMove);
      window.removeEventListener("mouseup", container._pipDragAttached.dragEnd);
      delete container._pipDragAttached;
      delete container._pipDragging;
    }
    if (container._pipResizers) {
      container._pipResizers.forEach((handle) => handle.remove());
      delete container._pipResizers;
    }
    delete container._pipReset;
  }
  container.style.cssText = defaultStyle;
}

function applyBrowserMode(container) {
  if (!document.fullscreenElement) {
    container.requestFullscreen?.() ||
      container.webkitRequestFullscreen?.() ||
      container.mozRequestFullScreen?.() ||
      container.msRequestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function applyWindowStyle(container) {
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "9999",
    backgroundColor: "#222"
  });
}

function applyPipStyle(container) {
  Object.assign(container.style, {
    position: "fixed",
    top: "calc(100% - 300px - 10px)",
    left: "calc(100% - 400px - 10px)",
    width: "400px",
    height: "300px",
    backgroundColor: "#222",
    border: "2px solid #444",
    borderRadius: "4px",
    cursor: "move"
  });
}

function applyScreenMode(mode, container, originalParentRefForWindow, originalParentRefForPiP, defaultStyle) {
  if (!container) return;
  const tokens = mode.trim().split(/\s+/);
  if (tokens.includes("reset")) {
    resetScreenMode(container, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
    return;
  }
  if (tokens.includes("browser")) {
    applyBrowserMode(container);
    return;
  }
  if (tokens.includes("window") || tokens.includes("pip")) {
    if (tokens.includes("window")) {
      if (!originalParentRefForWindow.current) {
        originalParentRefForWindow.current = container.parentNode;
      }
      document.body.appendChild(container);
      applyWindowStyle(container);
    }
    if (tokens.includes("pip")) {
      if (!originalParentRefForPiP.current) {
        originalParentRefForPiP.current = container.parentNode;
      }
      document.body.appendChild(container);
      container._pipReset = function() {
        resetScreenMode(container, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
      };
      applyPipStyle(container);
      setupPipDrag(container);
      setupPipCornerResizers(container);
    }
  }
  console.log(`[applyScreenMode] Applied mode: ${mode}`);
}

/*==============================================================================
  DRAG & RESIZE SETUP FOR PIP CONTAINERS
==============================================================================*/
function setupPipDrag(container) {
  if (container._pipDragAttached) return;
  const dragHandlers = {
    dragStart: (e) => {
      if (!container._active) {
        bringToFront(container);
        container._active = true;
      }
      container._pipDragging = true;
      container._pipStartX = e.clientX;
      container._pipStartY = e.clientY;
      container._pipOrigTop = parseInt(getComputedStyle(container).top, 10) || 0;
      container._pipOrigLeft = parseInt(getComputedStyle(container).left, 10) || 0;
      console.log(`[setupPipDrag] Drag started. Z-index: ${container.style.zIndex}`);
    },
    dragMove: (e) => {
      if (!container._pipDragging) return;
      const deltaX = e.clientX - container._pipStartX;
      const deltaY = e.clientY - container._pipStartY;
      container.style.top = `${container._pipOrigTop + deltaY}px`;
      container.style.left = `${container._pipOrigLeft + deltaX}px`;
      console.log(`[setupPipDrag] Drag move. Current z-index: ${container.style.zIndex}`);
    },
    dragEnd: () => {
      container._pipDragging = false;
      container._active = false;
      console.log(`[setupPipDrag] Drag ended. Final z-index: ${container.style.zIndex}`);
    }
  };
  container.addEventListener("mousedown", dragHandlers.dragStart);
  window.addEventListener("mousemove", dragHandlers.dragMove);
  window.addEventListener("mouseup", dragHandlers.dragEnd);
  container._pipDragAttached = dragHandlers;
}

function setupPipCornerResizers(container) {
  if (container._pipResizers) return;
  const corners = [
    { corner: "topLeft", style: { top: "0", left: "0", width: "30px", height: "30px", cursor: "nwse-resize" } },
    { corner: "topRight", style: { top: "0", right: "0", width: "30px", height: "30px", cursor: "nesw-resize" } },
    { corner: "bottomRight", style: { bottom: "0", right: "0", width: "30px", height: "30px", cursor: "nwse-resize" } },
    { corner: "bottomLeft", style: { bottom: "0", left: "0", width: "30px", height: "30px", cursor: "nesw-resize" } }
  ];
  const resizers = [];
  corners.forEach(({ corner, style }) => {
    const resizer = document.createElement("div");
    resizer.className = "pip-resizer";
    Object.assign(resizer.style, {
      position: "absolute",
      background: "transparent",
      border: "none",
      ...style,
      zIndex: 10500
    });
    resizer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!container._active) {
        bringToFront(container);
        container._active = true;
      }
      resizer._resizing = true;
      resizer._startX = e.clientX;
      resizer._startY = e.clientY;
      const computed = getComputedStyle(container);
      resizer._origWidth = parseInt(computed.width, 10);
      resizer._origHeight = parseInt(computed.height, 10);
      resizer._origTop = parseInt(computed.top, 10);
      resizer._origLeft = parseInt(computed.left, 10);
      resizer._corner = corner;
      console.log(`[setupPipCornerResizers] Resize started (${corner}). Container z-index: ${container.style.zIndex}`);
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
      console.log(`[setupPipCornerResizers] Resizing: new z-index remains: ${container.style.zIndex}`);
    });
  };
  
  const resizeEnd = () => {
    if (container._pipResizers) {
      container._pipResizers.forEach((resizer) => {
        resizer._resizing = false;
      });
      container._active = false;
      console.log(`[setupPipCornerResizers] Resize ended. Final z-index: ${container.style.zIndex}`);
    }
  };
  
  window.addEventListener("mousemove", resizeMove);
  window.addEventListener("mouseup", resizeEnd);
}

/*==============================================================================
  GLOBAL POINTERDOWN LISTENER (OPTIONAL)
==============================================================================*/
if (!document.body.hasAttribute("data-pip-listener-attached")) {
  document.addEventListener(
    "pointerdown",
    (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      for (let el of path) {
        if (el.classList && el.classList.contains("fresh-pip")) {
          bringToFront(el);
          break;
        }
      }
    },
    true
  );
  document.body.setAttribute("data-pip-listener-attached", "true");
}

/*==============================================================================
  DYNAMIC PIP SPAWNING VIA FreshPip COMPONENT
==============================================================================*/
function FreshPip({ onClose, filePath, header, functionName, customStyle = {} }) {
  const containerRef = useRef(null);
  const [LoadedComponent, setLoadedComponent] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const dynamicModule = await dc.require(dc.headerLink(filePath, header));
        const Component = dynamicModule[functionName];
        setLoadedComponent(() => Component);
      } catch (error) {
        console.error("Error loading component:", error);
      }
    })();
  }, [filePath, header, functionName]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("pointerdown", () => {
        if (!container._active) {
          bringToFront(container);
          container._active = true;
        }
      }, true);
      setupPipDrag(container);
      setupPipCornerResizers(container);
    }
  }, []);

  // Default styling for FreshPip – these values can be overridden by customStyle.
  const defaultPipStyle = {
    position: "fixed",
    top: "calc(100% - 330px - 10px)",
    left: "calc(100% - 440px - 10px)",
    width: "440px",
    height: "330px",
    backgroundColor: "#222",
    border: "2px solid #444",
    borderRadius: "4px",
    cursor: "move",
    boxSizing: "border-box",
    padding: "0px",
    overflow: "hidden"
  };

  // Merge default style with any custom style. Custom style takes precedence.
  const mergedStyle = { ...defaultPipStyle, ...customStyle };

  return (
    h(
      "div",
      {
        ref: containerRef,
        style: mergedStyle
      },
      // Close button.
      h(
        "button",
        {
          style: {
            position: "absolute",
            top: "4px",
            right: "4px",
            zIndex: "33100",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "16px"
          },
          onClick: onClose
        },
        "X"
      ),
      // Render the loaded component (if ready) or a fallback message.
      LoadedComponent
        ? h(LoadedComponent, {
            style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }
          })
        : h(
            "div",
            {
              style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, color: "white", textAlign: "center", lineHeight: mergedStyle.height }
            },
            "Loading..."
          )
    )
  );
}

/*==============================================================================
  SCENEHELPER / SCREENMODEHELPER COMPONENT
==============================================================================*/
const ScreenModeHelper = ({
  helperRef,
  initialMode = "default",
  containerRef,
  defaultStyle,
  originalParentRefForWindow,
  originalParentRefForPiP,
  allowedScreenModes = ["browser", "window", "pip", "character"],
  engine,
  // Defaults for character mode.
  characterFile = "ScreenResizing.component.v7.md",
  characterComponent = "ViewComponent"
}) => {
  const [activeMode, setActiveMode] = useState(
    allowedScreenModes.includes(initialMode) ? initialMode : "default"
  );

  const toggleMode = (mode) => {
    if (mode === "pip") {
      if (activeMode === "pip") {
        setActiveMode("default");
        resetScreenMode(containerRef.current, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
      } else {
        setActiveMode("pip");
        applyScreenMode("pip", containerRef.current, originalParentRefForWindow, originalParentRefForPiP, defaultStyle);
      }
    } else if (mode === "character") {
      spawnCustomPiP(characterFile, "ViewComponent", characterComponent);
    } else if (mode === "browser") {
      if (activeMode === "browser") {
        setActiveMode("default");
        resetScreenMode(containerRef.current, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
      } else {
        setActiveMode("browser");
        applyScreenMode("browser", containerRef.current, originalParentRefForWindow, originalParentRefForPiP, defaultStyle);
      }
    } else if (mode === "window") {
      if (activeMode === "window") {
        setActiveMode("default");
        resetScreenMode(containerRef.current, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
      } else {
        setActiveMode("window");
        applyScreenMode("window", containerRef.current, originalParentRefForWindow, originalParentRefForPiP, defaultStyle);
      }
    }
  };

  /**
   * spawnCustomPiP:
   * Creates a new pip container using FreshPip. An optional fourth parameter,
   * an options object, can contain custom width, height, top, and left values.
   */
  function spawnCustomPiP(filePath, header, functionName, options = {}) {
    updateHighestZIndex();
    highestZIndex++;
    const newZ = highestZIndex;

    const hostDiv = document.createElement("div");
    hostDiv.classList.add("fresh-pip");
    hostDiv.style.zIndex = newZ;
    document.body.appendChild(hostDiv);

    const closeFreshPiP = () => {
      render(null, hostDiv);
      if (hostDiv.parentNode) hostDiv.parentNode.removeChild(hostDiv);
      console.log("[spawnCustomPiP] Fresh Pip closed");
    };

    // Define default style values.
    const defaultCustomStyle = {
      width: "440px",
      height: "330px",
      top: "calc(100% - 330px - 10px)",
      left: "calc(100% - 440px - 10px)"
    };

    // Merge default style with any options passed in.
    const customStyle = {
      ...defaultCustomStyle,
      ...options
    };

    render(
      h(FreshPip, { onClose: closeFreshPiP, filePath, header, functionName, customStyle }),
      hostDiv
    );
    bringToFront(hostDiv);
    console.log(`[spawnCustomPiP] Spawned custom Pip with zIndex: ${hostDiv.style.zIndex}`, { filePath, header, functionName });
  }

  useEffect(() => {
    if (helperRef) {
      helperRef.current = { toggleMode, spawnCustomPiP };
    }
  }, [helperRef, toggleMode]);

  useEffect(() => {
    if (activeMode !== "default") {
      applyScreenMode(activeMode, containerRef.current, originalParentRefForWindow, originalParentRefForPiP, defaultStyle);
    }
  }, []);

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
              const extraFactor = window.devicePixelRatio || 1;
              scalingFactor = scalingFactor / extraFactor;
              scalingFactor = Math.max(0.001, scalingFactor);
            }
            engine.setHardwareScalingLevel(scalingFactor);
            engine.resize();
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

  // SVG icon definitions.
  const iconStyle = { width: "24px", height: "24px" };
  const browserIcon = (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
  const windowIcon = (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="14" rx="2" ry="2" />
      <path d="M3 17h18" />
    </svg>
  );
  const pipIcon = (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
      <rect x="8" y="9" width="8" height="5" rx="1" ry="1" />
    </svg>
  );
  const defaultIcon = (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
  const modeIcons = {
    browser: browserIcon,
    window: windowIcon,
    pip: pipIcon,
    default: defaultIcon,
    character: defaultIcon
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
    padding: "0"
  };

  const modesToDisplay = allowedScreenModes.filter((mode) => mode !== "none");

  return (
    <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10, display: "flex" }}>
      {modesToDisplay.map((mode) => (
        <button
          key={mode}
          onClick={() => toggleMode(mode)}
          style={buttonStyle}
          title={mode.charAt(0).toUpperCase() + mode.slice(1) + " Mode"}
        >
          {modeIcons[mode] || null}
        </button>
      ))}
      {activeMode === "pip" && (
        <button
          onClick={() => toggleMode("pip")}
          style={buttonStyle}
          title="Close Pip"
        >
          X
        </button>
      )}
    </div>
  );
};

return { ScreenModeHelper };

```