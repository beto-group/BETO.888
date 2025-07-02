





# ViewComponent

```jsx
// Assume that ScreenModeHelper is imported as before.
const { ScreenModeHelper } = await dc.require(
  dc.headerLink("_OPERATION/PRIVATE/DATACORE/17 WindowResizer/D.q.windowresizer.component.md", "ScreenModeHelper")
);

const { useRef, useEffect, useState } = dc;

function WorldView() {
  // The initial mode is now controlled by both the initialScreenMode
  // and the allowedScreenModes property.
  const initialScreenMode = "default";
  const allowedScreenModes = ["browser", "window", "pip", "fullTab"];
  
  // Refs for container and canvas
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // State to store Babylon's engine and scene.
  const [engine, setEngine] = useState(null);
  const [scene, setScene] = useState(null);
  
  // Default container inline style as a string.
  const defaultContainerStyle =
    "position: relative; width: 100%; height: 400px; border: 1px solid #ccc; background-color: #fafafa;";
  
  // Refs for original parent storage (for reparenting in "window" or "pip" modes)
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
          const { width, height } = entry.contentRect;
          console.log("[WorldView] Container resized to:", width, height);
          engine.resize();
        });
      });
      observer.observe(containerRef.current);
    } else {
      console.log("[WorldView] ResizeObserver not set up (container or engine missing)");
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
    console.log("[WorldView] Mode change detected");
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
      console.log("[WorldView] KeyDown:", e.key);
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
      console.log("[WorldView] KeyUp:", e.key);
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
        { preserveDrawingBuffer: true }
      );
      const babylonScene = new window.BABYLON.Scene(babylonEngine);
  
      const camera = new window.BABYLON.ArcRotateCamera(
        "Camera",
        -Math.PI / 2,
        Math.PI / 2.5,
        10,
        window.BABYLON.Vector3.Zero(),
        babylonScene
      );
      camera.attachControl(canvasRef.current, true);
      console.log("[WorldView] Camera attached");
  
      new window.BABYLON.HemisphericLight(
        "light",
        new window.BABYLON.Vector3(0, 1, 0),
        babylonScene
      );
      console.log("[WorldView] Light added");
  
      window.BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: 20, height: 20 },
        babylonScene
      );
      console.log("[WorldView] Ground created");
  
      const player = window.BABYLON.MeshBuilder.CreateSphere(
        "player",
        { diameter: 1 },
        babylonScene
      );
      player.position.y = 0.5;
      playerRef.current = player;
      console.log("[WorldView] Player created at position", player.position);
  
      setEngine(babylonEngine);
      setScene(babylonScene);
  
      const moveSpeed = 0.1;
      babylonEngine.runRenderLoop(() => {
        if (keysPressed.current["w"] || keysPressed.current["ArrowUp"]) {
          player.position.z -= moveSpeed;
        }
        if (keysPressed.current["s"] || keysPressed.current["ArrowDown"]) {
          player.position.z += moveSpeed;
        }
        if (keysPressed.current["a"] || keysPressed.current["ArrowLeft"]) {
          player.position.x -= moveSpeed;
        }
        if (keysPressed.current["d"] || keysPressed.current["ArrowRight"]) {
          player.position.x += moveSpeed;
        }
        babylonScene.render();
      });
      console.log("[WorldView] Render loop started");
  
      window.addEventListener("resize", () => {
        console.log("[WorldView] Window resize event");
        babylonEngine.resize();
      });
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
  
  console.log("[WorldView] Render");
  
  return (
    <div ref={containerRef} style={appliedContainerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      {/* Updated: Now we pass the allowedScreenModes prop */}
      <ScreenModeHelper
        initialMode={initialScreenMode}
        containerRef={containerRef}
        defaultStyle={defaultContainerStyle}
        originalParentRefForWindow={originalParentRefForWindow}
        originalParentRefForPiP={originalParentRefForPiP}
        allowedScreenModes={allowedScreenModes}
        engine={engine}
      />
    </div>
  );
}

return { WorldView };

```





# ScreenModeHelper

```jsx
// ScreenModeHelper - Complete Code Block
// Assumes 'dc' is a global object providing Preact hooks and h/render functions.
// e.g., const dc = { preact: { h, render }, useState, useRef, useEffect, useCallback };

const { useState, useRef, useEffect, useCallback } = dc;

function getInt(val) {
  return parseInt(val, 10) || 0;
}

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

function applyFullTabStyle(container, targetPaneContent, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef) {
  console.log("[applyFullTabStyle] Applying Full Pane mode (overlay). Container:", container, "Target Pane:", targetPaneContent);
  if (!targetPaneContent) {
    console.error("[applyFullTabStyle] Target 'workspace-leaf-content' element not found.");
    return;
  }
  const currentParent = container.parentNode;
  if (!currentParent) {
    console.error("[applyFullTabStyle] Container has no parent. Cannot apply FullTab style.");
    return;
  }
  // The contentWrapper is where the container will be absolutely positioned within.
  // It's usually 'view-content' or if not found, the 'workspace-leaf-content' itself.
  const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;

  // 1. Store original parent and insert placeholder
  originalParentRefForFullTab.current = currentParent;
  const placeholder = document.createElement('div');
  placeholder.className = 'screen-mode-placeholder';
  placeholder.style.display = 'none'; // Placeholder takes no space
  
  // Insert placeholder where the container was
  if (container.nextSibling) {
    currentParent.insertBefore(placeholder, container.nextSibling);
  } else {
    currentParent.appendChild(placeholder);
  }
  originalPositionPlaceholderRef.current = placeholder;
  console.log("[applyFullTabStyle] Inserted placeholder into original parent:", currentParent);

  // 2. Move container to the new parent (contentWrapper)
  currentParent.removeChild(container);
  contentWrapper.appendChild(container);
  console.log("[applyFullTabStyle] Moved container to contentWrapper:", contentWrapper);

  // 3. Adjust positioning context of contentWrapper if necessary
  const computedParentPosition = window.getComputedStyle(contentWrapper).position;
  originalParentPositionRefForFullTab.current = {
    element: contentWrapper,
    originalInlinePosition: contentWrapper.style.position // Store only inline, not computed
  };
  if (computedParentPosition === 'static') {
    contentWrapper.style.position = "relative";
    console.log("[applyFullTabStyle] Set contentWrapper position to 'relative'.");
  }

  // 4. Apply styles to the container for full tab mode
  Object.assign(container.style, {
    position: "absolute",
    top: "0px",
    left: "0px",
    width: "100%",
    height: "100%",
    zIndex: "9998",
    margin: "0",
    padding: "0",
    border: "none",
    borderRadius: "0",
    boxSizing: "border-box",
    backgroundColor: container.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor || "#ffffff",
    overflow: "auto",
    display: "block"
  });
}

function resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, activeModeAboutToBeReset, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef, engine) {
  console.group(`[resetScreenMode] Resetting from mode: '${activeModeAboutToBeReset}' for container:`, container);

  if (document.fullscreenElement === container) {
    document.exitFullscreen?.();
  }

  const wasInFullTab = originalParentRefForFullTab.current !== null;

  if (wasInFullTab && (activeModeAboutToBeReset === 'fullTab' || originalParentRefForFullTab.current)) {
    console.log("[resetScreenMode] Handling FullTab state restoration.");
    const placeholder = originalPositionPlaceholderRef.current;
    const originalFullTabParent = originalParentRefForFullTab.current;

    // Detach container from its current fullTab parent (e.g., view-content)
    if (container.parentNode && container.parentNode !== originalFullTabParent && container.parentNode !== placeholder?.parentNode) {
        container.parentNode.removeChild(container);
    }
    
    if (placeholder?.isConnected) {
      const placeholderParent = placeholder.parentNode;
      if (placeholderParent) {
         placeholderParent.replaceChild(container, placeholder);
         console.log("[resetScreenMode] Restored container using placeholder in parent:", placeholderParent);
      } else {
         console.warn("[resetScreenMode] Placeholder's parent is null. Trying original parent ref.");
         if (originalFullTabParent?.isConnected) {
            originalFullTabParent.appendChild(container);
         } else {
            console.warn("[resetScreenMode] Original parent for FullTab also not connected. Appending to body.");
            document.body.appendChild(container);
         }
      }
    } else if (originalFullTabParent?.isConnected) {
      originalFullTabParent.appendChild(container);
      console.log("[resetScreenMode] Restored container using original parent ref (placeholder was missing/disconnected):", originalFullTabParent);
      if(placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder); // cleanup disconnected placeholder if still somehow around
    } else {
      console.warn("[resetScreenMode] No valid placeholder or original parent for FullTab. Appending to body if not already there.");
      if (container.parentNode !== document.body) { // Should have been detached above
          if(container.parentNode) container.parentNode.removeChild(container); // Ensure removal
          document.body.appendChild(container);
      }
    }

    originalPositionPlaceholderRef.current = null;
    originalParentRefForFullTab.current = null;

    if (originalParentPositionRefForFullTab.current?.element?.isConnected) {
      const { element, originalInlinePosition } = originalParentPositionRefForFullTab.current;
      element.style.position = originalInlinePosition || '';
      console.log("[resetScreenMode] Restored position style for FullTab target's original parent:", element);
    }
    originalParentPositionRefForFullTab.current = null;
    container.style.display = 'block'; // Ensure visibility
  }

  // If container is in body (from window/pip mode, or fallback), try to return to original pre-body parent.
  if (container.parentNode === document.body) {
    let targetParentForBodyReparent = null;
    if (activeModeAboutToBeReset === 'window' && originalParentRefForWindow.current?.isConnected) {
      targetParentForBodyReparent = originalParentRefForWindow.current;
    } else if (activeModeAboutToBeReset === 'pip' && originalParentRefForPiP.current?.isConnected) {
      targetParentForBodyReparent = originalParentRefForPiP.current;
    } else if (originalParentRefForWindow.current?.isConnected) { // Fallback if mode doesn't match but ref exists
      targetParentForBodyReparent = originalParentRefForWindow.current;
    } else if (originalParentRefForPiP.current?.isConnected) { // Fallback
      targetParentForBodyReparent = originalParentRefForPiP.current;
    }

    if (targetParentForBodyReparent) {
      console.log("[resetScreenMode] Reparenting container from body to:", targetParentForBodyReparent);
      document.body.removeChild(container);
      targetParentForBodyReparent.appendChild(container);
      // Clear the ref that was used for this restoration
      if (targetParentForBodyReparent === originalParentRefForWindow.current) originalParentRefForWindow.current = null;
      if (targetParentForBodyReparent === originalParentRefForPiP.current) originalParentRefForPiP.current = null;
    } else {
      console.log("[resetScreenMode] Container is in body, but no valid original parent ref found to reparent to.");
    }
  }

  if (activeModeAboutToBeReset === 'pip' || container.getAttribute('data-is-independent-pip')) {
    console.log("[resetScreenMode] Cleaning up PiP specific elements and listeners.");
    if (container._pipDragAttached) {
      window.removeEventListener("mousemove", container._pipDragAttached.dragMove);
      window.removeEventListener("mouseup", container._pipDragAttached.dragEnd);
      if (container._pipDragBar) {
        container._pipDragBar.removeEventListener("mousedown", container._pipDragAttached.dragStart);
        if (container._pipDragBar.parentNode === container) container.removeChild(container._pipDragBar);
        delete container._pipDragBar;
      }
      delete container._pipDragAttached;
      delete container._pipDragging;
    }
    if (container._pipResizers) {
      // Remove global listeners for resize (if they were stored on container for removal)
      if (container._pipResizeMoveHandler) window.removeEventListener("mousemove", container._pipResizeMoveHandler);
      if (container._pipResizeEndHandler) window.removeEventListener("mouseup", container._pipResizeEndHandler);
      delete container._pipResizeMoveHandler;
      delete container._pipResizeEndHandler;

      container._pipResizers.forEach(resizer => {
        if (resizer.parentNode === container) resizer.parentNode.removeChild(resizer);
      });
      delete container._pipResizers;
    }
  }

  if (!container.getAttribute('data-is-independent-pip')) {
    console.log("[resetScreenMode] Resetting container inline styles.");
    Object.assign(container.style, {
      position: "", top: "", left: "", width: "", height: "",
      zIndex: "", margin: "", padding: "", border: "", borderRadius: "",
      boxSizing: "", backgroundColor: "", overflow: "", cursor: "",
      display: "block"
    });
  } else {
    console.log("[resetScreenMode] Skipping style reset for independent PiP container.");
  }
  console.groupEnd();
}

function applyBrowserMode(container) {
  console.log("[applyBrowserMode] Toggling browser fullscreen.");
  if (!document.fullscreenElement) { // Check if not already in fullscreen (or if another element is)
    (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen)?.call(container)
    .catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
  } else if (document.fullscreenElement === container) { // Only exit if THIS container is fullscreen
    document.exitFullscreen?.();
  }
}

function applyWindowStyle(container) {
  console.log("[applyWindowStyle] Applying Window mode styles.");
  Object.assign(container.style, {
    position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh",
    zIndex: "9999", margin: "0", padding: "0", border: "none", borderRadius: "0",
    boxSizing: "border-box",
    backgroundColor: container.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor || "#ffffff",
    display: "block", overflow: "auto"
  });
}

function applyPipStyle(container) {
  console.log("[applyPipStyle] Applying PiP mode styles.");
  const isDark = document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  Object.assign(container.style, {
    position: "fixed", top: "calc(100% - 300px - 20px)", left: "calc(100% - 400px - 20px)",
    width: "400px", height: "300px", zIndex: "10000",
    backgroundColor: container.style.backgroundColor || (isDark ? '#2c2c2c' : '#f8f9fa'),
    border: `1px solid ${isDark ? '#444' : '#ccc'}`,
    borderRadius: "8px", cursor: "default", boxSizing: "border-box", padding: "0",
    overflow: "hidden", display: "block", boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
  });
}

function setupPipDrag(container) {
  if (container._pipDragAttached) return;
  console.log("[setupPipDrag] Setting up PiP drag functionality.");
  const dragBar = document.createElement("div");
  dragBar.className = "pip-drag-bar";
  const isDark = document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  Object.assign(dragBar.style, {
    position: "absolute", top: "0", left: "0", width: "100%", height: "28px",
    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    cursor: "grab", zIndex: 10500, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    fontSize: '12px', fontWeight: '500', borderTopLeftRadius: '7px', borderTopRightRadius: '7px',
    userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none'
  });
  dragBar.textContent = 'DRAG';

  const dragHandlers = {
    dragStart: (e) => {
      if (e.target !== dragBar && e.target.parentNode !== dragBar && !e.target.classList.contains('pip-drag-bar-title')) return;
      e.preventDefault();
      container._pipDragging = true;
      container._pipStartX = e.clientX; container._pipStartY = e.clientY;
      const computed = getComputedStyle(container);
      container._pipOrigTop = getInt(computed.top); container._pipOrigLeft = getInt(computed.left);
      dragBar.style.cursor = 'grabbing'; document.body.style.userSelect = 'none';
    },
    dragMove: (e) => {
      if (!container._pipDragging) return; e.preventDefault();
      container.style.top = `${container._pipOrigTop + (e.clientY - container._pipStartY)}px`;
      container.style.left = `${container._pipOrigLeft + (e.clientX - container._pipStartX)}px`;
    },
    dragEnd: (e) => {
      if (!container._pipDragging) return; e.preventDefault();
      container._pipDragging = false; dragBar.style.cursor = 'grab'; document.body.style.userSelect = '';
    }
  };
  dragBar.addEventListener("mousedown", dragHandlers.dragStart);
  window.addEventListener("mousemove", dragHandlers.dragMove);
  window.addEventListener("mouseup", dragHandlers.dragEnd);
  container.appendChild(dragBar);
  container._pipDragBar = dragBar; container._pipDragAttached = dragHandlers;
}

function setupPipCornerResizers(container) {
  if (container._pipResizers?.length > 0) return;
  console.log("[setupPipCornerResizers] Setting up PiP corner resizers.");
  const corners = [
    { c: "topLeft", s: { top: "-5px", left: "-5px", cursor: "nwse-resize" } },
    { c: "topRight", s: { top: "-5px", right: "-5px", cursor: "nesw-resize" } },
    { c: "bottomRight", s: { bottom: "-5px", right: "-5px", cursor: "nwse-resize" } },
    { c: "bottomLeft", s: { bottom: "-5px", left: "-5px", cursor: "nesw-resize" } }
  ];
  const resizers = []; const handleSize = 10;
  const isDark = document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  corners.forEach(({ c, s }) => {
    const r = document.createElement("div");
    r.className = `pip-resizer pip-resizer-${c}`;
    Object.assign(r.style, {
      position: "absolute", width: `${handleSize}px`, height: `${handleSize}px`,
      background: isDark ? "rgba(0,123,255,0.6)" : "rgba(0,123,255,0.8)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)"}`,
      borderRadius: "3px", zIndex: 10501, ...s
    });
    r.addEventListener("mousedown", (e) => {
      e.stopPropagation(); e.preventDefault();
      r._resizing = true; r._startX = e.clientX; r._startY = e.clientY;
      const comp = getComputedStyle(container);
      r._originalWidth = getInt(comp.width); r._originalHeight = getInt(comp.height);
      r._originalTop = getInt(comp.top); r._originalLeft = getInt(comp.left);
      r._corner = c; document.body.style.cursor = s.cursor; document.body.style.userSelect = 'none';
    });
    resizers.push(r); container.appendChild(r);
  });
  container._pipResizers = resizers;
  const minWidth = 150, minHeight = 100;

  const handleResizeMove = (e) => {
    e.preventDefault(); const activeResizer = resizers.find(r => r._resizing); if (!activeResizer) return;
    let nW = activeResizer._originalWidth, nH = activeResizer._originalHeight, nL = activeResizer._originalLeft, nT = activeResizer._originalTop;
    const dX = e.clientX - activeResizer._startX, dY = e.clientY - activeResizer._startY;
    if (activeResizer._corner.includes("Right")) nW = Math.max(minWidth, activeResizer._originalWidth + dX);
    if (activeResizer._corner.includes("Left")) { nW = Math.max(minWidth, activeResizer._originalWidth - dX); nL = activeResizer._originalLeft + (activeResizer._originalWidth - nW); }
    if (activeResizer._corner.includes("Bottom")) nH = Math.max(minHeight, activeResizer._originalHeight + dY);
    if (activeResizer._corner.includes("Top")) { nH = Math.max(minHeight, activeResizer._originalHeight - dY); nT = activeResizer._originalTop + (activeResizer._originalHeight - nH); }
    Object.assign(container.style, { width: `${nW}px`, height: `${nH}px`, top: `${nT}px`, left: `${nL}px` });
  };
  const handleResizeEnd = (e) => {
    e.preventDefault(); const activeResizer = resizers.find(r => r._resizing); if (activeResizer) activeResizer._resizing = false;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
  };
  window.addEventListener("mousemove", handleResizeMove); window.addEventListener("mouseup", handleResizeEnd);
  container._pipResizeMoveHandler = handleResizeMove; container._pipResizeEndHandler = handleResizeEnd;
}

function spawnIndependentPip(AppComponent, isDarkMode) {
  console.log("[spawnIndependentPip] Spawning new independent PiP window.");
  const hostDiv = document.createElement("div");
  hostDiv.setAttribute('data-is-independent-pip', 'true');
  const isHostDark = isDarkMode === undefined ? (document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) : isDarkMode;
  hostDiv.style.backgroundColor = isHostDark ? '#2c2c2c' : 'white';
  document.body.appendChild(hostDiv);

  const closeIndependentPip = () => {
    console.log("[spawnIndependentPip] Closing independent PiP:", hostDiv);
    resetScreenMode(hostDiv, { current: null }, { current: null }, 'pip', {current: null}, {current: null}, {current: null}, null);
    dc.preact.render(null, hostDiv);
    if (hostDiv.parentNode) hostDiv.parentNode.removeChild(hostDiv);
  };

  dc.preact.render(dc.preact.h(AppComponent, { isDarkMode: isHostDark, isIndependentPip: true, closePip: closeIndependentPip }), hostDiv);
  applyPipStyle(hostDiv); setupPipDrag(hostDiv); setupPipCornerResizers(hostDiv);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×'; // Close symbol
  Object.assign(closeBtn.style, {
    position: 'absolute', top: '0px', right: '0px', zIndex: '10501', cursor: 'pointer',
    background: 'transparent', color: isHostDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    border: 'none', borderTopRightRadius: '7px', borderBottomLeftRadius: '7px',
    width: '28px', height: '28px', fontSize: '20px', lineHeight: '28px', textAlign: 'center',
    padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
  });
  closeBtn.onmouseover = () => { closeBtn.style.background = isHostDark ? 'rgba(255,0,0,0.5)' : 'rgba(220,53,69,0.8)'; closeBtn.style.color = 'white';};
  closeBtn.onmouseout = () => { closeBtn.style.background = 'transparent'; closeBtn.style.color = isHostDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';};
  closeBtn.title = "Close PiP Window";
  closeBtn.onclick = (e) => { e.stopPropagation(); closeIndependentPip(); };

  if (hostDiv._pipDragBar) {
    hostDiv._pipDragBar.style.justifyContent = 'flex-end'; // Push button to right
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'PiP Window'; // Or get from AppComponent
    titleSpan.className = 'pip-drag-bar-title';
    Object.assign(titleSpan.style, { flexGrow: 1, textAlign: 'center', paddingLeft: '28px' /* space for btn on right */ });
    hostDiv._pipDragBar.textContent = ''; // Clear "DRAG"
    hostDiv._pipDragBar.appendChild(titleSpan);
    hostDiv._pipDragBar.appendChild(closeBtn);
  } else { hostDiv.appendChild(closeBtn); }
}

const ScreenModeHelper = ({
  helperRef, initialMode = "default", containerRef,
  originalParentRefForWindow, originalParentRefForPiP,
  allowedScreenModes = ["browser", "window", "fullTab", "pip", "character"],
  engine, AppComponent, isDarkMode
}) => {
  const [activeMode, setActiveMode] = useState(
    allowedScreenModes.includes(initialMode) && initialMode !== "character" ? initialMode : "default"
  );
  const originalParentRefForFullTab = useRef(null);
  const originalParentPositionRefForFullTab = useRef(null);
  const originalPositionPlaceholderRef = useRef(null);

  const toggleMode = useCallback((requestedMode) => {
    console.log(`[ScreenModeHelper] toggleMode. Current: '${activeMode}', Requested: '${requestedMode}'`);
    const container = containerRef.current;
    if (!container) { console.error("[ScreenModeHelper] Container ref is not set."); return; }

    const currentActiveMode = activeMode;
    let newEffectiveMode = requestedMode;

    if (currentActiveMode === requestedMode && requestedMode !== "character") newEffectiveMode = "default";
    if (requestedMode === "character") newEffectiveMode = "default";

    if (currentActiveMode !== "default") {
      console.log(`[ScreenModeHelper] Resetting from current mode: ${currentActiveMode}`);
      resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, currentActiveMode,
                      originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef, engine);
    }
    
    setActiveMode(newEffectiveMode);

    if (newEffectiveMode === "default") {
      setTimeout(() => {
        if (containerRef.current) {
          if (window.getComputedStyle(containerRef.current).display === 'none') containerRef.current.style.display = 'block';
          if (engine?.resize) engine.resize();
        }
      }, 100);
    } else if (newEffectiveMode === "browser") {
      applyBrowserMode(container);
      if (engine?.resize) setTimeout(() => engine.resize(), 150);
    } else if (newEffectiveMode === "window") {
      if (!originalParentRefForWindow.current && container.parentNode !== document.body) {
        originalParentRefForWindow.current = container.parentNode;
      }
      if (container.parentNode !== document.body) {
        if (container.parentNode) container.parentNode.removeChild(container);
        document.body.appendChild(container);
      }
      applyWindowStyle(container);
      if (engine?.resize) setTimeout(() => engine.resize(), 50);
    } else if (newEffectiveMode === "fullTab") {
      const targetFullTabParent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
      if (targetFullTabParent) {
        applyFullTabStyle(container, targetFullTabParent, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef);
      } else {
        console.error("[ScreenModeHelper] Could not find 'workspace-leaf-content' for 'fullTab'. Reverting.");
        setActiveMode("default"); // Revert
        container.style.display = 'block';
      }
      if (engine?.resize) setTimeout(() => engine.resize(), 50);
    } else if (newEffectiveMode === "pip") {
      if (!originalParentRefForPiP.current && container.parentNode !== document.body) {
        originalParentRefForPiP.current = container.parentNode;
      }
      if (container.parentNode !== document.body) {
        if (container.parentNode) container.parentNode.removeChild(container);
        document.body.appendChild(container);
      }
      applyPipStyle(container); setupPipDrag(container); setupPipCornerResizers(container);
      if (engine?.setHardwareScalingLevel && engine?.resize) {
        const scaleFactor = 0.5 / (window.devicePixelRatio || 1); // Adjusted scale factor
        engine.setHardwareScalingLevel(scaleFactor);
        setTimeout(() => engine.resize(), 50);
      }
    }

    if (requestedMode === "character" && AppComponent) {
      spawnIndependentPip(AppComponent, isDarkMode);
    }
  // Dependencies for useCallback:
  // internal refs (originalParentRefForFullTab etc.) are stable and don't need to be listed.
  // Refs passed as props (containerRef, originalParentRefForWindow, originalParentRefForPiP) are also stable.
  }, [activeMode, containerRef, originalParentRefForWindow, originalParentRefForPiP, engine, AppComponent, isDarkMode, allowedScreenModes /* if it can change */]);

  useEffect(() => {
    if (helperRef) helperRef.current = { toggleMode, getActiveMode: () => activeMode };
  }, [helperRef, toggleMode, activeMode]);

  useEffect(() => { // Initial mode application
    const applyInitial = () => {
        if (initialMode !== "default" && containerRef.current && allowedScreenModes.includes(initialMode)) {
            if (initialMode === "character" && AppComponent) {
                console.log(`[ScreenModeHelper] Spawning 'character' PiP due to initialMode.`);
                spawnIndependentPip(AppComponent, isDarkMode);
            } else if (initialMode !== "character") {
                console.log(`[ScreenModeHelper] Applying initialMode: ${initialMode} on mount.`);
                toggleMode(initialMode);
            }
        }
    };
    const timeoutId = setTimeout(applyInitial, 100); // Slight delay
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount only

  useEffect(() => { // Fullscreen change handler
    const handleFsChange = () => {
      if (!document.fullscreenElement && activeMode === "browser") toggleMode("browser");
    };
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(e => document.addEventListener(e, handleFsChange));
    return () => events.forEach(e => document.removeEventListener(e, handleFsChange));
  }, [activeMode, toggleMode]);

  useEffect(() => { // ResizeObserver for engine
    if (!containerRef.current || !engine?.resize) return;
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, engine]);

  useEffect(() => { // Cleanup on unmount or critical changes
    const currentContainer = containerRef.current;
    const currentActiveMode = activeMode; // Capture activeMode at the time effect is set up

    return () => {
      console.log(`[ScreenModeHelper] Cleanup effect. Mode was: ${currentActiveMode}`);
      if (currentContainer && currentActiveMode !== 'default') {
        const modesRequiringReset = ["window", "fullTab", "pip", "browser"];
        if (modesRequiringReset.includes(currentActiveMode)) {
          console.log(`[ScreenModeHelper] Unmounting or mode change: Resetting from ${currentActiveMode}.`);
          resetScreenMode(currentContainer, originalParentRefForWindow, originalParentRefForPiP, currentActiveMode,
                          originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef, engine);
        }
      }
      if (originalPositionPlaceholderRef.current?.parentNode) { // Extra check for placeholder
        originalPositionPlaceholderRef.current.parentNode.removeChild(originalPositionPlaceholderRef.current);
        originalPositionPlaceholderRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]); // Primarily for unmount cleanup of the specific container instance

  const buttonContainerTop = activeMode === 'fullTab' ? '55px' : '10px';
  let buttonContainerRight = '10px';
  if (activeMode === 'pip' && containerRef.current?._pipDragBar?.querySelector('button')) { // If PiP and has a close button in dragbar
      buttonContainerRight = '40px'; // Shift left to avoid overlap with PiP's own close button
  }


  return dc.preact.h('div', {
    className: 'screen-mode-controls',
    style: {
      position: "absolute", top: buttonContainerTop, right: buttonContainerRight,
      zIndex: (activeMode === 'pip' || activeMode === 'window') ? 10001 : (activeMode === 'fullTab' ? 9999 : 500),
      display: "flex", gap: "5px"
    }
  },
    allowedScreenModes.filter(m => m !== "none").map(mode => {
      const isCurrentActive = activeMode === mode && mode !== "character";
      let modeLabel;
      switch(mode) {
        case "pip": modeLabel = "PiP"; break;
        case "fullTab": modeLabel = "Tab"; break;
        case "browser": modeLabel = "Full"; break;
        case "window": modeLabel = "Win"; break;
        case "character": modeLabel = "New"; break;
        default: modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
      }

      return dc.preact.h('button', {
        key: mode, onClick: () => toggleMode(mode),
        style: {
          minWidth: "38px", height: "38px", padding: "0 8px", cursor: "pointer",
          backgroundColor: isCurrentActive ? "#007bff" : (mode === "character" ? "#28a745" : "#5a5a5a"),
          color: "white", border: `1px solid ${isCurrentActive ? "#0056b3" : (mode === "character" ? "#1e7e34" : "#444")}`,
          borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: "bold", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "background-color 0.15s ease-in-out, border-color 0.15s ease-in-out",
        },
        title: mode === "character" ? "Spawn New PiP Window" : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode${isCurrentActive ? " (Active - Click to Reset)" : ""}`
      }, modeLabel);
    })
  );
};

return { ScreenModeHelper };
```