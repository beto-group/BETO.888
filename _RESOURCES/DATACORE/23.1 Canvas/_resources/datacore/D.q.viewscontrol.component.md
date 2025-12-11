---
aliases:
  - screenresizer.component
---


# ViewComponent

```jsx
const componentPath = dc.resolvePath("D.q.viewscontrol.component");
const { ScreenModeHelper } = await dc.require(dc.headerLink(componentPath, "ScreenModeHelper"));

const { useRef, useEffect, useState } = dc;

// Suppress ResizeObserver loop errors globally (they're harmless but noisy)
if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
      return true; // Suppress the error
    }
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
}

function WorldView() {
  // Now includes "external" mode for true OS-level window
  const initialScreenMode = "default";
  const allowedScreenModes = ["browser", "window", "pip", "fullTab", "character", "external"];
  
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
    if (!window.BABYLON) {
      const script = document.createElement("script");
      script.src = "https://cdn.babylonjs.com/babylon.js";
      script.async = true;
      script.onload = () => {
        initBabylon();
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    } else {
      initBabylon();
    }
  }, []);
  
  // -------------------------
  // Resize Observer for Babylon
  // -------------------------
  useEffect(() => {
    let observer;
    let resizeTimeout;
    if (containerRef.current && engine) {
      observer = new ResizeObserver((entries) => {
        // Clear any pending resize
        if (resizeTimeout) clearTimeout(resizeTimeout);
        
        // Debounce and use RAF to avoid ResizeObserver loop errors
        resizeTimeout = setTimeout(() => {
          window.requestAnimationFrame(() => {
            try {
              if (engine && !engine.isDisposed) {
                engine.resize();
              }
            } catch (error) {
              console.warn("[WorldView] Engine resize error (safely caught):", error);
            }
          });
        }, 150); // Increased debounce for stability
      });
      observer.observe(containerRef.current);
    }
    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (observer && containerRef.current) {
        try {
          observer.unobserve(containerRef.current);
          observer.disconnect();
        } catch (error) {
          console.warn("[WorldView] ResizeObserver cleanup warning:", error);
        }
      }
    };
  }, [engine]);
  
  // Force engine resize on mode change with error handling
  useEffect(() => {
    const resizeTimer = setTimeout(() => {
      try {
        if (engine && !engine.isDisposed) {
          engine.resize();
        }
      } catch (error) {
        console.warn("[WorldView] Engine resize error (safely caught):", error);
      }
    }, 200); // Increased delay for mode transitions
    
    return () => clearTimeout(resizeTimer);
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
      const babylonEngine = new window.BABYLON.Engine(
        canvasRef.current,
        true,
        { preserveDrawingBuffer: true, stencil: true, antialias: true }
      );
      const babylonScene = new window.BABYLON.Scene(babylonEngine);
      babylonScene.clearColor = new window.BABYLON.Color4(0.06, 0.06, 0.12, 1);
  
      const camera = new window.BABYLON.ArcRotateCamera(
        "Camera", -Math.PI / 2, Math.PI / 2.5, 10,
        window.BABYLON.Vector3.Zero(), babylonScene
      );
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 5;
      camera.upperRadiusLimit = 20;
  
      // Enhanced lighting
      const light = new window.BABYLON.HemisphericLight("light", new window.BABYLON.Vector3(0, 1, 0), babylonScene);
      light.intensity = 0.8;
      
      const light2 = new window.BABYLON.PointLight("light2", new window.BABYLON.Vector3(5, 5, 5), babylonScene);
      light2.intensity = 0.5;
      
      // Ground with material
      const ground = window.BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, babylonScene);
      const groundMat = new window.BABYLON.StandardMaterial("groundMat", babylonScene);
      groundMat.diffuseColor = new window.BABYLON.Color3(0.2, 0.2, 0.3);
      groundMat.specularColor = new window.BABYLON.Color3(0.1, 0.1, 0.1);
      ground.material = groundMat;
  
      // Player with glow effect
      const player = window.BABYLON.MeshBuilder.CreateSphere("player", { diameter: 1 }, babylonScene);
      player.position.y = 0.5;
      const playerMat = new window.BABYLON.StandardMaterial("playerMat", babylonScene);
      playerMat.diffuseColor = new window.BABYLON.Color3(0.63, 0.46, 0.98); // Purple
      playerMat.emissiveColor = new window.BABYLON.Color3(0.31, 0.23, 0.49); // Purple glow
      player.material = playerMat;
      playerRef.current = player;
      
      // Add glow layer
      const glow = new window.BABYLON.GlowLayer("glow", babylonScene);
      glow.intensity = 0.5;
  
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
  const isDark = document.body.classList.contains('theme-dark');
  const appliedContainerStyle = {
    position: "relative",
    width: "100%",
    height: "500px",
    border: `1px solid ${isDark ? 'rgba(160, 118, 249, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
    background: isDark 
      ? 'linear-gradient(135deg, #0f0f1e 0%, #16213e 100%)' 
      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: isDark 
      ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
      : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
  };
  
  const canvasStyle = {
    width: "100%",
    height: "100%",
    display: "block",
    background: 'linear-gradient(135deg, #0D0D1A 0%, #16213E 50%, #1A1A2E 100%)'
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

// Import Node.js modules for external window creation (optional - graceful fallback)
let BrowserWindow, path, fs, os;
try {
  const electron = require('@electron/remote') || require('electron').remote || {};
  BrowserWindow = electron.BrowserWindow;
  path = require('path');
  fs = require('fs');
  os = require('os');
} catch (e) {
  // Electron modules not available - external mode will be disabled
}

// --- UTILITY AND HELPER FUNCTIONS ---
// Most of these are unchanged, but I've added comments for clarity.
function getInt(val) { return parseInt(val, 10) || 0; }
function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }
function applyBrowserMode(container) { if (!document.fullscreenElement) { (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen)?.call(container) .catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)); } else if (document.fullscreenElement === container) { document.exitFullscreen?.(); } }
function applyWindowStyle(container) { Object.assign(container.style, { position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", zIndex: "9999", margin: "0", padding: "0", border: "none", borderRadius: "0", boxSizing: "border-box", backgroundColor: container.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor || "#ffffff", display: "block", overflow: "auto" }); }
function applyFullTabStyle(container, targetPaneContent, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef) { if (!targetPaneContent) { console.error("[applyFullTabStyle] Target 'workspace-leaf-content' element not found."); return; } const currentParent = container.parentNode; if (!currentParent) { console.error("[applyFullTabStyle] Container has no parent."); return; } const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent; originalParentRefForFullTab.current = currentParent; const placeholder = document.createElement('div'); placeholder.className = 'screen-mode-placeholder'; placeholder.style.display = 'none'; if (container.nextSibling) { currentParent.insertBefore(placeholder, container.nextSibling); } else { currentParent.appendChild(placeholder); } originalPositionPlaceholderRef.current = placeholder; currentParent.removeChild(container); contentWrapper.appendChild(container); const computedParentPosition = window.getComputedStyle(contentWrapper).position; originalParentPositionRefForFullTab.current = { element: contentWrapper, originalInlinePosition: contentWrapper.style.position }; if (computedParentPosition === 'static') { contentWrapper.style.position = "relative"; } Object.assign(container.style, { position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: "9998", margin: "0", padding: "0", border: "none", borderRadius: "0", boxSizing: "border-box", backgroundColor: container.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor || "#ffffff", overflow: "auto", display: "block" }); }

// This function is for our INTERACTIVE, IN-APP floating window.
function applyInteractivePipStyle(container) {
  const isDark = document.body.classList.contains('theme-dark');
  Object.assign(container.style, {
    position: "fixed",
    top: "calc(100% - 400px - 20px)",
    left: "calc(100% - 500px - 20px)",
    width: "500px",
    height: "400px",
    zIndex: "10000",
    backgroundColor: container.style.backgroundColor || (isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)'),
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: "12px",
    cursor: "default",
    boxSizing: "border-box",
    padding: "0",
    overflow: "hidden",
    display: "block",
    boxShadow: isDark 
      ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
      : '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)'
  });
}
function setupPipDrag(container) { 
  if (container._pipDragAttached) return; 
  const dragBar = document.createElement("div"); 
  dragBar.className = "pip-drag-bar"; 
  const isDark = document.body.classList.contains('theme-dark'); 
  
  Object.assign(dragBar.style, { 
    position: "absolute", 
    top: "0", 
    left: "0", 
    width: "100%", 
    height: "40px", 
    background: isDark 
      ? "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)" 
      : "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)", 
    cursor: "grab", 
    zIndex: 10500, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '0 12px',
    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)', 
    fontSize: '13px', 
    fontWeight: '600', 
    borderTopLeftRadius: '11px', 
    borderTopRightRadius: '11px', 
    userSelect: 'none', 
    WebkitUserSelect: 'none', 
    MozUserSelect: 'none',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  }); 
  
  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  `;
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    closeBtn.style.color = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.backgroundColor = 'transparent';
    closeBtn.style.color = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Trigger exit from character mode by dispatching a custom event
    const event = new CustomEvent('exitCharacterMode', { bubbles: true });
    container.dispatchEvent(event);
  });
  
  // Create title span
  const titleSpan = document.createElement("span");
  titleSpan.textContent = '🎮 BABYLON WORLD';
  titleSpan.style.cssText = 'flex: 1; text-align: center; letter-spacing: 0.5px; margin: 0 8px;';
  
  // Create drag indicator
  const dragIndicator = document.createElement("span");
  dragIndicator.textContent = '⋮⋮';
  dragIndicator.style.cssText = `
    opacity: 0.4;
    font-size: 16px;
    line-height: 1;
    letter-spacing: -2px;
    flex-shrink: 0;
  `;
  
  dragBar.appendChild(closeBtn);
  dragBar.appendChild(titleSpan);
  dragBar.appendChild(dragIndicator);
  
  const dragHandlers = { 
    dragStart: (e) => { 
      if (e.target !== dragBar && e.target !== titleSpan && e.target !== dragIndicator) return; 
      e.preventDefault(); 
      container._pipDragging = true; 
      container._pipStartX = e.clientX; 
      container._pipStartY = e.clientY; 
      const computed = getComputedStyle(container); 
      container._pipOrigTop = getInt(computed.top); 
      container._pipOrigLeft = getInt(computed.left); 
      dragBar.style.cursor = 'grabbing'; 
      dragBar.style.opacity = '0.9';
      document.body.style.userSelect = 'none'; 
    }, 
    dragMove: (e) => { 
      if (!container._pipDragging) return; 
      e.preventDefault(); 
      container.style.top = `${container._pipOrigTop + (e.clientY - container._pipStartY)}px`; 
      container.style.left = `${container._pipOrigLeft + (e.clientX - container._pipStartX)}px`; 
    }, 
    dragEnd: (e) => { 
      if (!container._pipDragging) return; 
      e.preventDefault(); 
      container._pipDragging = false; 
      dragBar.style.cursor = 'grab'; 
      dragBar.style.opacity = '1';
      document.body.style.userSelect = ''; 
    } 
  }; 
  
  dragBar.addEventListener("mousedown", dragHandlers.dragStart); 
  window.addEventListener("mousemove", dragHandlers.dragMove); 
  window.addEventListener("mouseup", dragHandlers.dragEnd); 
  container.appendChild(dragBar); 
  container._pipDragBar = dragBar; 
  container._pipDragAttached = dragHandlers; 
}
function setupPipCornerResizers(container) { 
  if (container._pipResizers?.length > 0) return; 
  const corners = [
    { c: "topLeft", s: { top: "-6px", left: "-6px", cursor: "nwse-resize" } }, 
    { c: "topRight", s: { top: "-6px", right: "-6px", cursor: "nesw-resize" } }, 
    { c: "bottomRight", s: { bottom: "-6px", right: "-6px", cursor: "nwse-resize" } }, 
    { c: "bottomLeft", s: { bottom: "-6px", left: "-6px", cursor: "nesw-resize" } } 
  ]; 
  const resizers = []; 
  const handleSize = 12; 
  const isDark = document.body.classList.contains('theme-dark'); 
  
  corners.forEach(({ c, s }) => { 
    const r = document.createElement("div"); 
    r.className = `pip-resizer pip-resizer-${c}`; 
    Object.assign(r.style, { 
      position: "absolute", 
      width: `${handleSize}px`, 
      height: `${handleSize}px`, 
      zIndex: 10501,
      background: isDark 
        ? 'radial-gradient(circle, rgba(100,150,255,0.6) 0%, rgba(100,150,255,0.2) 70%, transparent 100%)' 
        : 'radial-gradient(circle, rgba(0,100,255,0.4) 0%, rgba(0,100,255,0.1) 70%, transparent 100%)',
      borderRadius: '50%',
      transition: 'transform 0.15s ease, opacity 0.15s ease',
      opacity: '0',
      ...s 
    }); 
    
    // Hover effects
    r.addEventListener('mouseenter', () => {
      r.style.opacity = '1';
      r.style.transform = 'scale(1.3)';
    });
    r.addEventListener('mouseleave', () => {
      if (!r._resizing) {
        r.style.opacity = '0';
        r.style.transform = 'scale(1)';
      }
    });
    
    r.addEventListener("mousedown", (e) => { 
      e.stopPropagation(); 
      e.preventDefault(); 
      r._resizing = true; 
      r._startX = e.clientX; 
      r._startY = e.clientY; 
      const comp = getComputedStyle(container); 
      r._originalWidth = getInt(comp.width); 
      r._originalHeight = getInt(comp.height); 
      r._originalTop = getInt(comp.top); 
      r._originalLeft = getInt(comp.left); 
      r._corner = c; 
      r.style.opacity = '1';
      document.body.style.cursor = s.cursor; 
      document.body.style.userSelect = 'none'; 
    }); 
    
    resizers.push(r); 
    container.appendChild(r); 
  }); 
  
  container._pipResizers = resizers; 
  const minWidth = 200, minHeight = 150; 
  
  const handleResizeMove = (e) => { 
    e.preventDefault(); 
    const activeResizer = resizers.find(r => r._resizing); 
    if (!activeResizer) return; 
    let nW = activeResizer._originalWidth, nH = activeResizer._originalHeight, nL = activeResizer._originalLeft, nT = activeResizer._originalTop; 
    const dX = e.clientX - activeResizer._startX, dY = e.clientY - activeResizer._startY; 
    if (activeResizer._corner.includes("Right")) nW = Math.max(minWidth, activeResizer._originalWidth + dX); 
    if (activeResizer._corner.includes("Left")) { 
      nW = Math.max(minWidth, activeResizer._originalWidth - dX); 
      nL = activeResizer._originalLeft + (activeResizer._originalWidth - nW); 
    } 
    if (activeResizer._corner.includes("Bottom")) nH = Math.max(minHeight, activeResizer._originalHeight + dY); 
    if (activeResizer._corner.includes("Top")) { 
      nH = Math.max(minHeight, activeResizer._originalHeight - dY); 
      nT = activeResizer._originalTop + (activeResizer._originalHeight - nH); 
    } 
    Object.assign(container.style, { 
      width: `${nW}px`, 
      height: `${nH}px`, 
      top: `${nT}px`, 
      left: `${nL}px` 
    }); 
  }; 
  
  const handleResizeEnd = (e) => { 
    e.preventDefault(); 
    const activeResizer = resizers.find(r => r._resizing); 
    if (activeResizer) {
      activeResizer._resizing = false; 
      activeResizer.style.opacity = '0';
      activeResizer.style.transform = 'scale(1)';
    }
    document.body.style.cursor = ''; 
    document.body.style.userSelect = ''; 
  }; 
  
  window.addEventListener("mousemove", handleResizeMove); 
  window.addEventListener("mouseup", handleResizeEnd); 
  container._pipResizeMoveHandler = handleResizeMove; 
  container._pipResizeEndHandler = handleResizeEnd; 
}

// Universal cleanup function
function resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, activeModeAboutToBeReset, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef) {
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
}

// --- ENHANCED: External Window Creator ---
async function createExternalWindow(canvasRef, containerRef) {
  if (!BrowserWindow) {
    console.error("[createExternalWindow] BrowserWindow not available.");
    new Notice("External window mode requires Electron with remote module enabled.", 5000);
    return null;
  }

  try {
    const isMac = os.platform() === 'darwin';
    
    const externalWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 700,
      minHeight: 500,
      title: '✨ 3D World - External View',
      backgroundColor: '#0D0D1A',
      frame: isMac ? false : true,
      titleBarStyle: isMac ? 'hiddenInset' : 'default',
      vibrancy: isMac ? 'ultra-dark' : undefined,
      hasShadow: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      show: false
    });
    
    // Load external window HTML with enhanced Babylon scene
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>✨ 3D World - External View</title>
  <meta charset="UTF-8">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
      background: linear-gradient(135deg, #0D0D1A 0%, #16213E 50%, #1A1A2E 100%);
      color: #e0e0e0;
    }
    #custom-titlebar {
      height: 52px;
      background: rgba(13, 13, 26, 0.95);
      backdrop-filter: blur(40px);
      border-bottom: 1px solid rgba(160, 118, 249, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-app-region: drag;
      padding: 0 80px;
    }
    #window-title {
      font-size: 13px;
      font-weight: 600;
      color: #A076F9;
      -webkit-app-region: no-drag;
    }
    #canvas-wrapper { 
      flex: 1; 
      position: relative; 
    }
    canvas { 
      width: 100%; 
      height: calc(100vh - 52px); 
      display: block; 
    }
    
    /* Mode Controls Styling */
    .screen-mode-controls {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10001;
      display: flex;
      gap: 8px;
      padding: 8px;
      border-radius: 10px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    
    .mode-button {
      min-width: 44px;
      height: 44px;
      padding: 0;
      cursor: pointer;
      background-color: rgba(255, 255, 255, 0.05);
      color: #888;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      position: relative;
      overflow: hidden;
    }
    
    .mode-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    
    .mode-button.active {
      background-color: rgba(160, 118, 249, 0.15);
      color: #a076f9;
      border-color: rgba(160, 118, 249, 0.4);
      box-shadow: 0 2px 8px rgba(160, 118, 249, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    .mode-button .icon {
      width: 18px;
      height: 18px;
      stroke-width: 2;
    }
    
    .mode-button.active .icon {
      filter: drop-shadow(0 0 4px currentColor);
    }
    
    .mode-button .label {
      font-size: 9px;
      margin-top: 2px;
      opacity: 0.7;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    
    .mode-button.active .label {
      opacity: 1;
    }
  </style>
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
</head>
<body>
  <div id="custom-titlebar"><div id="window-title">✨ 3D WORLD - EXTERNAL VIEW</div></div>
  <div id="canvas-wrapper">
    <canvas id="renderCanvas"></canvas>
    
    <!-- Mode Control Buttons -->
    <div class="screen-mode-controls">
      <button class="mode-button" data-mode="pip" title="Picture-in-Picture">
        <i data-lucide="picture-in-picture-2" class="icon"></i>
        <span class="label">PiP</span>
      </button>
      <button class="mode-button" data-mode="fullTab" title="Full Tab">
        <i data-lucide="maximize-2" class="icon"></i>
        <span class="label">Tab</span>
      </button>
      <button class="mode-button" data-mode="browser" title="Browser Fullscreen">
        <i data-lucide="maximize" class="icon"></i>
        <span class="label">Full</span>
      </button>
      <button class="mode-button" data-mode="window" title="Window Mode">
        <i data-lucide="square" class="icon"></i>
        <span class="label">Win</span>
      </button>
      <button class="mode-button" data-mode="character" title="Float Mode">
        <i data-lucide="move" class="icon"></i>
        <span class="label">Float</span>
      </button>
      <button class="mode-button active" data-mode="external" title="External Window (Active)">
        <i data-lucide="external-link" class="icon"></i>
        <span class="label">Ext</span>
      </button>
      <button class="mode-button" data-mode="close" title="Close External Window">
        <i data-lucide="x" class="icon"></i>
        <span class="label">Close</span>
      </button>
    </div>
  </div>
  <script>
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true, { antialias: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.06, 0.06, 0.12, 1);
    
    const camera = new BABYLON.ArcRotateCamera('Camera', -Math.PI/2, Math.PI/2.5, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 20;
    
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(5, 5, 5), scene);
    light2.intensity = 0.5;
    
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;
    
    const player = BABYLON.MeshBuilder.CreateSphere('player', { diameter: 1 }, scene);
    player.position.y = 0.5;
    const playerMat = new BABYLON.StandardMaterial('playerMat', scene);
    playerMat.diffuseColor = new BABYLON.Color3(0.63, 0.46, 0.98);
    playerMat.emissiveColor = new BABYLON.Color3(0.31, 0.23, 0.49);
    player.material = playerMat;
    
    const glow = new BABYLON.GlowLayer('glow', scene);
    glow.intensity = 0.5;
    
    const keysPressed = {};
    window.addEventListener('keydown', (e) => { keysPressed[e.key] = true; });
    window.addEventListener('keyup', (e) => { keysPressed[e.key] = false; });
    
    const moveSpeed = 0.1;
    engine.runRenderLoop(() => {
      if (keysPressed['w'] || keysPressed['ArrowUp']) player.position.z -= moveSpeed;
      if (keysPressed['s'] || keysPressed['ArrowDown']) player.position.z += moveSpeed;
      if (keysPressed['a'] || keysPressed['ArrowLeft']) player.position.x -= moveSpeed;
      if (keysPressed['d'] || keysPressed['ArrowRight']) player.position.x += moveSpeed;
      scene.render();
    });
    
    window.addEventListener('resize', () => engine.resize());
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Mode button functionality
    const buttons = document.querySelectorAll('.mode-button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.getAttribute('data-mode');
        
        if (mode === 'close') {
          // Close this external window
          window.close();
        } else if (mode === 'external') {
          // Already in external mode, do nothing
        } else {
          // Send message to parent to switch mode
          // This will close the external window and switch to the requested mode
          
          // Try multiple methods to communicate the requested mode
          
          // Method 1: Use IPC if available (Electron)
          try {
            if (window.require) {
              const { ipcRenderer } = window.require('electron');
              if (ipcRenderer && typeof ipcRenderer.send === 'function') {
                ipcRenderer.send('switch-mode', mode);
              }
            }
          } catch (e) {
            // IPC not available, will use fallback
          }
          
          // Method 2: Store in window.opener if available
          try {
            if (window.opener && !window.opener.closed) {
              window.opener._externalWindowRequestedMode = mode;
            }
          } catch (e) {
            // Cross-origin or security restriction
          }
          
          // Method 3: Use localStorage as fallback
          try {
            localStorage.setItem('_externalWindowRequestedMode', mode);
            localStorage.setItem('_externalWindowRequestedModeTime', Date.now().toString());
          } catch (e) {
            // localStorage not available
          }
          
          // Close external window to return to main app
          window.close();
        }
      });
    });
  </script>
</body>
</html>`;

    externalWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    // Store the requested mode when user clicks a button in external window
    externalWindow._requestedMode = null;
    
    // Listen for mode switch requests from external window
    // Note: ipcMain is only available in the main process, not in renderer
    // This will only work if Electron's remote module is properly configured
    try {
      const electron = require('electron');
      const ipcMain = electron.ipcMain || (electron.remote && electron.remote.ipcMain);
      
      if (ipcMain && typeof ipcMain.on === 'function') {
        const switchModeHandler = (event, mode) => {
          if (event.sender === externalWindow.webContents) {
            externalWindow._requestedMode = mode;
            // Close will be handled by the 'closed' event
          }
        };
        ipcMain.on('switch-mode', switchModeHandler);
        externalWindow._ipcHandler = switchModeHandler;
        externalWindow._ipcMain = ipcMain;
      }
    } catch (e) {
      // IPC not available - mode switching will still work via window close detection
    }
    
    externalWindow.once('ready-to-show', () => {
      externalWindow.show();
      new Notice("✨ External window opened!", 3000);
    });
    
    externalWindow.on('closed', () => {
      // Clean up IPC handler
      if (externalWindow._ipcHandler && externalWindow._ipcMain) {
        try {
          externalWindow._ipcMain.removeListener('switch-mode', externalWindow._ipcHandler);
        } catch (e) {
          // Silent cleanup failure
        }
      }
    });
    
    return externalWindow;
  } catch (error) {
    console.error("[createExternalWindow] Failed:", error);
    new Notice(`Failed to open external window: ${error.message}`, 5000);
    return null;
  }
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
  const videoRef = useRef(null); // For native PiP
  const externalWindowRef = useRef(null); // For external window

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

  // External window handlers
  const openExternalWindow = useCallback(async () => {
    if (externalWindowRef.current && !externalWindowRef.current.isDestroyed()) {
      externalWindowRef.current.focus();
      return true;
    }

    const win = await createExternalWindow(canvasRef, containerRef);
    if (win) {
      externalWindowRef.current = win;
      if (containerRef.current) {
        containerRef.current.style.visibility = 'hidden';
      }
      return true;
    }
    return false;
  }, [canvasRef, containerRef]);

  const closeExternalWindow = useCallback(() => {
    if (externalWindowRef.current && !externalWindowRef.current.isDestroyed()) {
      externalWindowRef.current.close();
      externalWindowRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.style.visibility = 'visible';
    }
  }, [containerRef]);

  const toggleMode = useCallback(async (requestedMode) => {
    const container = containerRef.current;
    if (!container) { console.error("Container ref is not set."); return; }

    const currentActiveMode = activeMode;
    const newEffectiveMode = (currentActiveMode === requestedMode) ? "default" : requestedMode;
    
    // Clean up previous mode's event listeners
    if (container._closeHandler) {
      container.removeEventListener('exitCharacterMode', container._closeHandler);
      container._closeHandler = null;
    }
    
    // --- SAFE MODE TRANSITION: Always go through default mode first ---
    // This prevents ResizeObserver errors and ensures clean state transitions
    if (currentActiveMode !== "default" && newEffectiveMode !== "default") {
      // Reset current mode
      if (currentActiveMode === 'pip') await exitNativePip();
      else if (currentActiveMode === 'external') closeExternalWindow();
      else {
        resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, currentActiveMode, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef);
        // Reset canvas adjustments
        const contentArea = container.querySelector('canvas') || container.firstChild;
        if (contentArea) {
          contentArea.style.marginTop = '';
          contentArea.style.height = '';
        }
      }
      
      // Briefly set to default mode (this allows DOM to stabilize)
      setActiveMode("default");
      
      // Wait for DOM to settle before applying new mode
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger engine resize in default state
      try {
        if (engine && !engine.isDisposed) {
          engine.resize();
        }
      } catch (error) {
        console.warn("[toggleMode] Engine resize warning:", error);
      }
      
      // Now apply the new mode
    } else {
      // Standard reset when going to/from default
      if (currentActiveMode === 'pip') await exitNativePip();
      else if (currentActiveMode === 'external') closeExternalWindow();
      else if (currentActiveMode !== "default") {
        resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, currentActiveMode, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef);
        // Reset canvas adjustments
        const contentArea = container.querySelector('canvas') || container.firstChild;
        if (contentArea) {
          contentArea.style.marginTop = '';
          contentArea.style.height = '';
        }
      }
    }
    
    // Activation logic
    if (newEffectiveMode === "pip") {
      const success = await enterNativePip();
      setActiveMode(success ? "pip" : "default");
    } else if (newEffectiveMode === "external") {
      const success = await openExternalWindow();
      setActiveMode(success ? "external" : "default");
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
        
        // Add listener for close button
        const handleClose = () => {
          // Directly reset the mode without toggling
          const contentArea = container.querySelector('canvas') || container.firstChild;
          if (contentArea) {
            contentArea.style.marginTop = '';
            contentArea.style.height = '';
          }
          resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, 'character', originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef);
          setActiveMode("default");
          setTimeout(() => {
            try {
              if (engine && !engine.isDisposed) engine.resize();
            } catch (error) {
              console.warn("[handleClose] Engine resize warning:", error);
            }
          }, 150);
        };
        container.addEventListener('exitCharacterMode', handleClose, { once: false });
        container._closeHandler = handleClose;
        
        // Adjust container content for header
        const contentArea = container.querySelector('canvas') || container.firstChild;
        if (contentArea) {
          contentArea.style.marginTop = '40px';
          contentArea.style.height = 'calc(100% - 40px)';
        }
      }
    }
    
    // Final engine resize with error handling
    setTimeout(() => {
      try {
        if (engine && !engine.isDisposed) {
          engine.resize();
        }
      } catch (error) {
        console.warn("[toggleMode] Final engine resize warning:", error);
      }
    }, 250); // Increased delay for complex transitions

  }, [activeMode, containerRef, canvasRef, engine, enterNativePip, exitNativePip, openExternalWindow, closeExternalWindow, originalParentRefForWindow, originalParentRefForPiP, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef]);

  // RESTORED: Effect to handle user closing native PiP window
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    
    const onLeavePiP = () => {
      if (container) {
        container.style.visibility = 'visible';
        // Reset any styles that might have been applied
        resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, 'pip', originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef);
      }
      setActiveMode("default");
    };
    
    video.addEventListener('leavepictureinpicture', onLeavePiP);
    return () => {
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, [videoRef, containerRef, originalParentRefForWindow, originalParentRefForPiP, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef]);
  
  // Monitor external window closure and mode switch requests
  useEffect(() => {
    if (activeMode !== 'external' || !externalWindowRef.current) return;
    
    const checkExternalWindow = () => {
      const extWindow = externalWindowRef.current;
      if (extWindow && extWindow.isDestroyed()) {
        // Check if user requested a mode switch before closing
        let requestedMode = extWindow._requestedMode || extWindow._externalWindowRequestedMode;
        
        // Fallback: Check localStorage
        if (!requestedMode) {
          try {
            const stored = localStorage.getItem('_externalWindowRequestedMode');
            if (stored) {
              const data = JSON.parse(stored);
              if (Date.now() - data.timestamp < 5000) { // Only use if less than 5 seconds old
                requestedMode = data.mode;
              }
              localStorage.removeItem('_externalWindowRequestedMode');
            }
          } catch (e) {}
        }
        
        if (containerRef.current) containerRef.current.style.visibility = 'visible';
        externalWindowRef.current = null;
        
        if (requestedMode && requestedMode !== 'external') {
          // Switch to the requested mode
          setTimeout(() => toggleMode(requestedMode), 100);
        } else {
          // Just return to default
          setActiveMode("default");
        }
      }
    };

    const interval = setInterval(checkExternalWindow, 500); // Check more frequently
    return () => clearInterval(interval);
  }, [activeMode, containerRef, toggleMode]);
  
  useEffect(() => {
    if (helperRef) helperRef.current = { toggleMode, getActiveMode: () => activeMode };
  }, [helperRef, toggleMode, activeMode]);

  useEffect(() => {
    const handleFsChange = () => { if (!document.fullscreenElement && activeMode === "browser") toggleMode("browser"); };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [activeMode, toggleMode]);

  const isDarkTheme = document.body.classList.contains('theme-dark');
  
  const controlsStyle = {
    position: "absolute", 
    top: '12px', 
    right: '12px',
    zIndex: (activeMode === 'window' || activeMode === 'character') ? 10001 : (activeMode === 'fullTab' ? 9999 : 500),
    display: "flex", 
    gap: "8px",
    visibility: (activeMode === 'pip' || activeMode === 'external') ? 'hidden' : 'visible',
    padding: '8px',
    borderRadius: '10px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    backgroundColor: isDarkTheme 
      ? 'rgba(0, 0, 0, 0.4)' 
      : 'rgba(255, 255, 255, 0.4)',
    border: `1px solid ${isDarkTheme 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.1)'}`,
    boxShadow: isDarkTheme
      ? '0 4px 16px rgba(0, 0, 0, 0.3)'
      : '0 4px 16px rgba(0, 0, 0, 0.1)'
  };

  return dc.preact.h('div', null,
    // Hidden video element for native PiP
    dc.preact.h('video', { ref: videoRef, muted: true, style: { display: 'none' } }),
    dc.preact.h('div', { className: 'screen-mode-controls', style: controlsStyle },
      allowedScreenModes.map(mode => {
        const isCurrentActive = activeMode === mode;
        let iconName, modeLabel;
        let baseColor = isDarkTheme ? "#888" : "#666";
        let activeColor = "#a076f9"; // Purple accent
        
        // Customize button appearance with Lucide icons
        switch(mode) {
          case "pip": 
            iconName = "picture-in-picture-2"; 
            modeLabel = "PiP"; 
            break;
          case "fullTab": 
            iconName = "maximize-2"; 
            modeLabel = "Tab"; 
            break;
          case "browser": 
            iconName = "maximize"; 
            modeLabel = "Full"; 
            break;
          case "window": 
            iconName = "square"; 
            modeLabel = "Win"; 
            break;
          case "character": 
            iconName = "move"; 
            modeLabel = "Float";
            break;
          case "external":
            iconName = "external-link";
            modeLabel = "Ext";
            break;
          default: 
            iconName = "circle";
            modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
        }

        const buttonColor = isCurrentActive ? activeColor : baseColor;
        const buttonBg = isCurrentActive 
          ? (isDarkTheme ? 'rgba(160, 118, 249, 0.15)' : 'rgba(160, 118, 249, 0.1)')
          : (isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)');
        
        const buttonBorder = isCurrentActive
          ? (isDarkTheme ? 'rgba(160, 118, 249, 0.4)' : 'rgba(160, 118, 249, 0.3)')
          : (isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');
        
        let finalButtonBg = buttonBg;
        let finalButtonBorder = buttonBorder;
        
        return dc.preact.h('button', {
          key: mode, 
          onClick: () => toggleMode(mode),
          onMouseEnter: (e) => {
            if (!isCurrentActive) {
              e.target.style.backgroundColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
              e.target.style.transform = 'translateY(-1px)';
            }
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = finalButtonBg;
            e.target.style.transform = 'translateY(0)';
          },
          style: { 
            minWidth: "44px", 
            height: "44px", 
            padding: "0", 
            cursor: "pointer", 
            backgroundColor: finalButtonBg,
            color: buttonColor, 
            border: `1px solid ${finalButtonBorder}`, 
            borderRadius: "8px", 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "16px",
            fontWeight: "600", 
            boxShadow: isCurrentActive 
              ? `0 2px 8px ${buttonColor}40, inset 0 1px 0 rgba(255,255,255,0.1)`
              : "0 1px 3px rgba(0,0,0,0.1)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            position: 'relative',
            overflow: 'hidden'
          },
          title: mode === "pip" 
            ? "Picture-in-Picture (View-only, stays on top of other apps)" 
            : mode === "character" 
              ? "Float View (Interactive, stays inside this app)" 
              : `${modeLabel} Mode${isCurrentActive ? " (Active - Click to Reset)" : ""}`
        }, 
          dc.preact.h(dc.Icon, { 
            icon: iconName,
            style: { 
              fontSize: '18px', 
              lineHeight: '1',
              filter: isCurrentActive ? 'drop-shadow(0 0 4px currentColor)' : 'none'
            } 
          }),
          dc.preact.h('span', { 
            style: { 
              fontSize: '9px', 
              marginTop: '2px',
              opacity: isCurrentActive ? '1' : '0.7',
              fontWeight: '700',
              letterSpacing: '0.3px'
            } 
          }, modeLabel)
        );
      })
    )
  );
};

return { ScreenModeHelper };
```