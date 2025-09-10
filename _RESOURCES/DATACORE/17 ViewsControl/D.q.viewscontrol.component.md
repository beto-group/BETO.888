---
aliases:
  - screenresizer.component
---


# ViewComponent

```jsx
// Assume that ScreenModeHelper is imported as before.
const { ScreenModeHelper } = await dc.require(
  dc.headerLink("_RESOURCES/DATACORE/17 ViewsControl/D.q.viewscontrol.component.md", "ScreenModeHelper")
);

const { useRef, useEffect, useState } = dc;

function WorldView() {
  // The initial mode is now controlled by both the initialScreenMode
  // and the allowedScreenModes property.
  const initialScreenMode = "default";
  const allowedScreenModes = ["browser", "window", "pip", "fullTab", "character"];
  // We also have "character" do what you want with that
  // Refs for container and canvas
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // State to store Babylon's engine and scene.
  const [engine, setEngine] = useState(null);
  const [scene, setScene] = useState(null);
  
  // Default container inline style as a string.
  const defaultContainerStyle =
    "position: relative; width: 100%; height: 400px; border: 1px solid #ccc; background-color: #fafafa;";
  
  // Refs for original parent storage (for reparenting in "window" or the 'character' PiP modes)
  const originalParentRefForWindow = useRef(null);
  const originalParentRefForPiP = useRef(null);
  
  // Refs for Babylon player and keyboard controls.
  const playerRef = useRef(null);
  const keysPressed = useRef({});
  
  // -------------------------
  // Babylon.js Loader & Setup
  // -------------------------
  useEffect(() => {
    console.log("[WorldView] Loading Babylon.js if necessary");
    if (!window.BABYLON) {
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
    } else {
      console.log("[WorldView] Babylon.js already present");
      initBabylon();
    }
  }, []);
  
  // -------------------------
  // Resize Observer for Babylon
  // -------------------------
  useEffect(() => {
    let observer;
    if (containerRef.current && engine) {
      console.log("[WorldView] Setting up ResizeObserver");
      observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          console.log("[WorldView] Container resized, resizing engine.");
          engine.resize();
        });
      });
      observer.observe(containerRef.current);
    }
    return () => {
      if (observer && containerRef.current) {
        console.log("[WorldView] Disconnecting ResizeObserver");
        observer.unobserve(containerRef.current);
      }
    };
  }, [engine]);
  
  // Force engine resize on mode change.
  useEffect(() => {
    setTimeout(() => {
      if (engine) {
        console.log("[WorldView] Forcing engine resize due to mode change");
        engine.resize();
      }
    }, 100);
  }, [engine]);
  
  // -------------------------
  // Keyboard Event Listeners
  // -------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  
  // -------------------------
  // Babylon.js Initialization
  // -------------------------
  const initBabylon = () => {
    if (canvasRef.current && window.BABYLON) {
      console.log("[WorldView] Initializing Babylon engine");
      const babylonEngine = new window.BABYLON.Engine(
        canvasRef.current,
        true,
        { preserveDrawingBuffer: true, stencil: true }
      );
      const babylonScene = new window.BABYLON.Scene(babylonEngine);
  
      const camera = new window.BABYLON.ArcRotateCamera(
        "Camera", -Math.PI / 2, Math.PI / 2.5, 10,
        window.BABYLON.Vector3.Zero(), babylonScene
      );
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
  
      window.addEventListener("resize", () => babylonEngine.resize());
    } else {
      console.error("[WorldView] initBabylon: canvasRef missing or Babylon.js not loaded.");
    }
  };
  
  // -------------------------
  // Render
  // -------------------------
  const appliedContainerStyle = {
    position: "relative",
    width: "100%",
    height: "400px",
    border: "1px solid #ccc",
    backgroundColor: "#fafafa"
  };
  
  const canvasStyle = {
    width: "100%",
    height: "100%",
    display: "block",
    backgroundColor: "#333"
  };
  
  return (
    <div ref={containerRef} style={appliedContainerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <ScreenModeHelper
        initialMode={initialScreenMode}
        containerRef={containerRef}
        canvasRef={canvasRef} // Pass canvas ref for native PiP
        defaultStyle={defaultContainerStyle}
        originalParentRefForWindow={originalParentRefForWindow}
        originalParentRefForPiP={originalParentRefForPiP}
        allowedScreenModes={allowedScreenModes}
        engine={engine}
        AppComponent={WorldView} // Still needed for the "character" mode
      />
    </div>
  );
}

return { WorldView };
```





# ScreenModeHelper

```jsx
const { useState, useRef, useEffect, useCallback } = dc;

// --- UTILITY AND HELPER FUNCTIONS ---
// Most of these are unchanged, but I've added comments for clarity.
function getInt(val) { return parseInt(val, 10) || 0; }
function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }
function applyBrowserMode(container) { console.log("[applyBrowserMode] Toggling browser fullscreen."); if (!document.fullscreenElement) { (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen)?.call(container) .catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)); } else if (document.fullscreenElement === container) { document.exitFullscreen?.(); } }
function applyWindowStyle(container) { console.log("[applyWindowStyle] Applying Window mode styles."); Object.assign(container.style, { position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", zIndex: "9999", margin: "0", padding: "0", border: "none", borderRadius: "0", boxSizing: "border-box", backgroundColor: container.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor || "#ffffff", display: "block", overflow: "auto" }); }
function applyFullTabStyle(container, targetPaneContent, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef) { console.log("[applyFullTabStyle] Applying Full Pane mode (overlay)."); if (!targetPaneContent) { console.error("[applyFullTabStyle] Target 'workspace-leaf-content' element not found."); return; } const currentParent = container.parentNode; if (!currentParent) { console.error("[applyFullTabStyle] Container has no parent."); return; } const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent; originalParentRefForFullTab.current = currentParent; const placeholder = document.createElement('div'); placeholder.className = 'screen-mode-placeholder'; placeholder.style.display = 'none'; if (container.nextSibling) { currentParent.insertBefore(placeholder, container.nextSibling); } else { currentParent.appendChild(placeholder); } originalPositionPlaceholderRef.current = placeholder; currentParent.removeChild(container); contentWrapper.appendChild(container); const computedParentPosition = window.getComputedStyle(contentWrapper).position; originalParentPositionRefForFullTab.current = { element: contentWrapper, originalInlinePosition: contentWrapper.style.position }; if (computedParentPosition === 'static') { contentWrapper.style.position = "relative"; } Object.assign(container.style, { position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: "9998", margin: "0", padding: "0", border: "none", borderRadius: "0", boxSizing: "border-box", backgroundColor: container.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor || "#ffffff", overflow: "auto", display: "block" }); }

// This function is for our INTERACTIVE, IN-APP floating window.
function applyInteractivePipStyle(container) {
  console.log("[applyInteractivePipStyle] Applying interactive floating mode styles.");
  const isDark = document.body.classList.contains('theme-dark');
  Object.assign(container.style, {
    position: "fixed",
    top: "calc(100% - 300px - 20px)",
    left: "calc(100% - 400px - 20px)",
    width: "400px",
    height: "300px",
    zIndex: "10000",
    backgroundColor: container.style.backgroundColor || (isDark ? '#2c2c2c' : '#f8f9fa'),
    border: `1px solid ${isDark ? '#444' : '#ccc'}`,
    borderRadius: "8px",
    cursor: "default",
    boxSizing: "border-box",
    padding: "0",
    overflow: "hidden",
    display: "block",
    boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
  });
}
function setupPipDrag(container) { if (container._pipDragAttached) return; const dragBar = document.createElement("div"); dragBar.className = "pip-drag-bar"; const isDark = document.body.classList.contains('theme-dark'); Object.assign(dragBar.style, { position: "absolute", top: "0", left: "0", width: "100%", height: "28px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", cursor: "grab", zIndex: 10500, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: '12px', fontWeight: '500', borderTopLeftRadius: '7px', borderTopRightRadius: '7px', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }); dragBar.textContent = 'DRAG TO MOVE'; const dragHandlers = { dragStart: (e) => { if (e.target !== dragBar) return; e.preventDefault(); container._pipDragging = true; container._pipStartX = e.clientX; container._pipStartY = e.clientY; const computed = getComputedStyle(container); container._pipOrigTop = getInt(computed.top); container._pipOrigLeft = getInt(computed.left); dragBar.style.cursor = 'grabbing'; document.body.style.userSelect = 'none'; }, dragMove: (e) => { if (!container._pipDragging) return; e.preventDefault(); container.style.top = `${container._pipOrigTop + (e.clientY - container._pipStartY)}px`; container.style.left = `${container._pipOrigLeft + (e.clientX - container._pipStartX)}px`; }, dragEnd: (e) => { if (!container._pipDragging) return; e.preventDefault(); container._pipDragging = false; dragBar.style.cursor = 'grab'; document.body.style.userSelect = ''; } }; dragBar.addEventListener("mousedown", dragHandlers.dragStart); window.addEventListener("mousemove", dragHandlers.dragMove); window.addEventListener("mouseup", dragHandlers.dragEnd); container.appendChild(dragBar); container._pipDragBar = dragBar; container._pipDragAttached = dragHandlers; }
function setupPipCornerResizers(container) { if (container._pipResizers?.length > 0) return; const corners = [{ c: "topLeft", s: { top: "-5px", left: "-5px", cursor: "nwse-resize" } }, { c: "topRight", s: { top: "-5px", right: "-5px", cursor: "nesw-resize" } }, { c: "bottomRight", s: { bottom: "-5px", right: "-5px", cursor: "nwse-resize" } }, { c: "bottomLeft", s: { bottom: "-5px", left: "-5px", cursor: "nesw-resize" } } ]; const resizers = []; const handleSize = 10; const isDark = document.body.classList.contains('theme-dark'); corners.forEach(({ c, s }) => { const r = document.createElement("div"); r.className = `pip-resizer pip-resizer-${c}`; Object.assign(r.style, { position: "absolute", width: `${handleSize}px`, height: `${handleSize}px`, zIndex: 10501, ...s }); r.addEventListener("mousedown", (e) => { e.stopPropagation(); e.preventDefault(); r._resizing = true; r._startX = e.clientX; r._startY = e.clientY; const comp = getComputedStyle(container); r._originalWidth = getInt(comp.width); r._originalHeight = getInt(comp.height); r._originalTop = getInt(comp.top); r._originalLeft = getInt(comp.left); r._corner = c; document.body.style.cursor = s.cursor; document.body.style.userSelect = 'none'; }); resizers.push(r); container.appendChild(r); }); container._pipResizers = resizers; const minWidth = 150, minHeight = 100; const handleResizeMove = (e) => { e.preventDefault(); const activeResizer = resizers.find(r => r._resizing); if (!activeResizer) return; let nW = activeResizer._originalWidth, nH = activeResizer._originalHeight, nL = activeResizer._originalLeft, nT = activeResizer._originalTop; const dX = e.clientX - activeResizer._startX, dY = e.clientY - activeResizer._startY; if (activeResizer._corner.includes("Right")) nW = Math.max(minWidth, activeResizer._originalWidth + dX); if (activeResizer._corner.includes("Left")) { nW = Math.max(minWidth, activeResizer._originalWidth - dX); nL = activeResizer._originalLeft + (activeResizer._originalWidth - nW); } if (activeResizer._corner.includes("Bottom")) nH = Math.max(minHeight, activeResizer._originalHeight + dY); if (activeResizer._corner.includes("Top")) { nH = Math.max(minHeight, activeResizer._originalHeight - dY); nT = activeResizer._originalTop + (activeResizer._originalHeight - nH); } Object.assign(container.style, { width: `${nW}px`, height: `${nH}px`, top: `${nT}px`, left: `${nL}px` }); }; const handleResizeEnd = (e) => { e.preventDefault(); const activeResizer = resizers.find(r => r._resizing); if (activeResizer) activeResizer._resizing = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; }; window.addEventListener("mousemove", handleResizeMove); window.addEventListener("mouseup", handleResizeEnd); container._pipResizeMoveHandler = handleResizeMove; container._pipResizeEndHandler = handleResizeEnd; }

// Universal cleanup function
function resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, activeModeAboutToBeReset, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef) {
  console.group(`[resetScreenMode] Resetting from mode: '${activeModeAboutToBeReset}' for container:`, container);
  if (document.fullscreenElement === container) { document.exitFullscreen?.(); }
  if (container._pipDragAttached) { window.removeEventListener("mousemove", container._pipDragAttached.dragMove); window.removeEventListener("mouseup", container._pipDragAttached.dragEnd); if (container._pipDragBar) { container._pipDragBar.removeEventListener("mousedown", container._pipDragAttached.dragStart); container._pipDragBar.remove(); } container._pipDragBar = null; container._pipDragAttached = null; }
  if (container._pipResizers) { window.removeEventListener("mousemove", container._pipResizeMoveHandler); window.removeEventListener("mouseup", container._pipResizeEndHandler); container._pipResizers.forEach(r => r.remove()); container._pipResizers = []; container._pipResizeMoveHandler = null; container._pipResizeEndHandler = null; }
  if (originalParentRefForFullTab.current && activeModeAboutToBeReset === 'fullTab') { const placeholder = originalPositionPlaceholderRef.current; if (placeholder?.parentNode) { placeholder.parentNode.replaceChild(container, placeholder); } else if (originalParentRefForFullTab.current) { originalParentRefForFullTab.current.appendChild(container); } originalPositionPlaceholderRef.current = null; if (originalParentPositionRefForFullTab.current?.element) { const { element, originalInlinePosition } = originalParentPositionRefForFullTab.current; element.style.position = originalInlinePosition || ''; } originalParentRefForFullTab.current = null; originalParentPositionRefForFullTab.current = null; }
  if (container.parentNode === document.body) {
    let targetParent = null;
    if (activeModeAboutToBeReset === 'window' && originalParentRefForWindow.current) targetParent = originalParentRefForWindow.current;
    // THIS 'character' mode now uses the PiP ref for its original parent
    else if (activeModeAboutToBeReset === 'character' && originalParentRefForPiP.current) targetParent = originalParentRefForPiP.current;
    if (targetParent) { document.body.removeChild(container); targetParent.appendChild(container); }
  }
  Object.assign(container.style, { position: "", top: "", left: "", width: "", height: "", zIndex: "", margin: "", padding: "", border: "", borderRadius: "", boxSizing: "", backgroundColor: "", overflow: "", cursor: "", display: "block" });
  console.groupEnd();
}

// --- THE MAIN COMPONENT ---
const ScreenModeHelper = ({
  helperRef, initialMode = "default", containerRef, canvasRef,
  originalParentRefForWindow, originalParentRefForPiP,
  allowedScreenModes = ["browser", "window", "fullTab", "pip", "character"],
  engine
}) => {
  const [activeMode, setActiveMode] = useState(allowedScreenModes.includes(initialMode) ? initialMode : "default");
  const originalParentRefForFullTab = useRef(null);
  const originalParentPositionRefForFullTab = useRef(null);
  const originalPositionPlaceholderRef = useRef(null);
  const videoRef = useRef(null); // RESTORED: For native PiP

  // RESTORED: Logic for NATIVE, OS-LEVEL, VIEW-ONLY PiP
  const enterNativePip = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) { new Notice("PiP Error: Canvas not ready.", 5000); return false; }
    if (!canvas.captureStream) { new Notice("This feature requires a newer browser version.", 7000); return false; }
    if (document.pictureInPictureElement) return true;
    try {
      video.srcObject = canvas.captureStream();
      await video.play();
      await video.requestPictureInPicture();
      if (containerRef.current) containerRef.current.style.visibility = 'hidden';
      return true;
    } catch (err) {
      new Notice(`PiP failed: ${err.message}`, 5000);
      return false;
    }
  }, [canvasRef, videoRef, containerRef]);

  const exitNativePip = useCallback(async () => {
    if (document.pictureInPictureElement) {
      try { await document.exitPictureInPicture(); } catch (err) { console.error("Failed to exit PiP:", err); }
    }
    if (containerRef.current) containerRef.current.style.visibility = 'visible';
  }, [containerRef]);

  const toggleMode = useCallback(async (requestedMode) => {
    const container = containerRef.current;
    if (!container) { console.error("Container ref is not set."); return; }

    const currentActiveMode = activeMode;
    const newEffectiveMode = (currentActiveMode === requestedMode) ? "default" : requestedMode;
    
    // Resetting logic
    if (currentActiveMode === 'pip') await exitNativePip();
    else if (currentActiveMode !== "default") resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, currentActiveMode, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef);
    
    // Activation logic
    if (newEffectiveMode === "pip") {
      const success = await enterNativePip();
      setActiveMode(success ? "pip" : "default");
    } else {
      setActiveMode(newEffectiveMode);
      if (newEffectiveMode === "browser") applyBrowserMode(container);
      if (newEffectiveMode === "window") { if (!originalParentRefForWindow.current) originalParentRefForWindow.current = container.parentNode; document.body.appendChild(container); applyWindowStyle(container); }
      if (newEffectiveMode === "fullTab") { const target = findNearestAncestorWithClass(container, 'workspace-leaf-content'); if (target) applyFullTabStyle(container, target, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef); else setActiveMode("default"); }
      // CHANGED: "character" mode now pops out the CURRENT component
      if (newEffectiveMode === "character") {
        if (!originalParentRefForPiP.current) originalParentRefForPiP.current = container.parentNode;
        document.body.appendChild(container);
        applyInteractivePipStyle(container);
        setupPipDrag(container);
        setupPipCornerResizers(container);
      }
    }
    setTimeout(() => engine?.resize(), 150);

  }, [activeMode, containerRef, canvasRef, engine, enterNativePip, exitNativePip, originalParentRefForWindow, originalParentRefForPiP, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef]);

  // RESTORED: Effect to handle user closing native PiP window
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLeavePiP = () => {
      if (containerRef.current) containerRef.current.style.visibility = 'visible';
      setActiveMode("default");
    };
    video.addEventListener('leavepictureinpicture', onLeavePiP);
    return () => video.removeEventListener('leavepictureinpicture', onLeavePiP);
  }, [videoRef, containerRef]);
  
  useEffect(() => {
    if (helperRef) helperRef.current = { toggleMode, getActiveMode: () => activeMode };
  }, [helperRef, toggleMode, activeMode]);

  useEffect(() => {
    const handleFsChange = () => { if (!document.fullscreenElement && activeMode === "browser") toggleMode("browser"); };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [activeMode, toggleMode]);

  const controlsStyle = {
    position: "absolute", top: '10px', right: '10px',
    zIndex: (activeMode === 'window' || activeMode === 'character') ? 10001 : (activeMode === 'fullTab' ? 9999 : 500),
    display: "flex", gap: "5px",
    visibility: activeMode === 'pip' ? 'hidden' : 'visible'
  };

  return dc.preact.h('div', null,
    // RESTORED: Hidden video element for native PiP
    dc.preact.h('video', { ref: videoRef, muted: true, style: { display: 'none' } }),
    dc.preact.h('div', { className: 'screen-mode-controls', style: controlsStyle },
      allowedScreenModes.map(mode => {
        const isCurrentActive = activeMode === mode;
        let modeLabel;
        let buttonColor = "#5a5a5a";
        let borderColor = "#444";
        // Customize button appearance
        switch(mode) {
          case "pip": modeLabel = "PiP"; break;
          case "fullTab": modeLabel = "Tab"; break;
          case "browser": modeLabel = "Full"; break;
          case "window": modeLabel = "Win"; break;
          case "character": 
            modeLabel = "Float"; // CHANGED: Clearer label
            buttonColor = "#28a745";
            borderColor = "#1e7e34";
            break;
          default: modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
        }

        if (isCurrentActive) {
          buttonColor = "#007bff";
          borderColor = "#0056b3";
        }
        
        return dc.preact.h('button', {
          key: mode, onClick: () => toggleMode(mode),
          style: { minWidth: "38px", height: "38px", padding: "0 8px", cursor: "pointer", backgroundColor: buttonColor, color: "white", border: `1px solid ${borderColor}`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "background-color 0.15s ease-in-out, border-color 0.15s ease-in-out" },
          // CHANGED: Clearer tooltips explaining the behavior of each mode
          title: mode === "pip" 
            ? "Picture-in-Picture (View-only, stays on top of other apps)" 
            : mode === "character" 
              ? "Float View (Interactive, stays inside this app)" 
              : `${modeLabel} Mode${isCurrentActive ? " (Active - Click to Reset)" : ""}`
        }, modeLabel);
      })
    )
  );
};

return { ScreenModeHelper };
```