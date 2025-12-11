



# ViewComponent


```jsx
// ViewComponent (WorldView.jsx)

const { useRef, useEffect, useState } = dc;
const { loadScript } = await dc.require(dc.headerLink(dc.resolvePath("D.q.animatedcard.component"), "LoadScript"));

// --- DOM Traversal Utilities ---
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

function WorldView({
  frontImagePath = "_resources/images/card_default.f.png",
  backImagePath = "_resources/images/card_default.b.png",
  depth = 0.01,
  edgeColor = "#333333",
  initialRadius = null,
  lowerLimit = 1,
  upperLimit = 15,
  disableControls = false,
}) {
  const currentPath = dc.resolvePath("D.q.animatedcard.component"); // Get current file path
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `animated-card-wrapper-${instanceId}`;
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frontMaterialRef = useRef(null);
  const videoTextureA_Ref = useRef(null);
  const videoTextureB_Ref = useRef(null);
  const isTextureA_ActiveRef = useRef(true);
  const resizeObserverRef = useRef(null);
  const stateRefs = useRef({}).current;
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [isFullTab, setIsFullTab] = useState(true);

  // --- Refs for Idle Rotation ---
  const isAutoRotatingRef = useRef(true);
  const idleTimerRef = useRef(null);

  // --- Ref for on-demand playback logic ---
  const hasActiveVideoEndedRef = useRef(false);

  // Suppress ResizeObserver loop errors globally
  useEffect(() => {
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
  }, []);

  // Full-tab mode effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    
    const targetPaneContent = findNearestAncestorWithClass(
      container,
      "workspace-leaf-content"
    );
    
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }
    
    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;
    
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
      overflow: "hidden",
    });
    
    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(
          container,
          stateRefs.placeholder
        );
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static"
            ? ""
            : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  // Improved script loading with better error handling
  const loadScriptOptimized = (src) => {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve(existingScript);
        return;
      }
      
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(script);
      script.onerror = (e) => {
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.body.appendChild(script);
    });
  };

  // This effect runs ONLY ONCE on mount to initialize the entire scene
  useEffect(() => {
    if (!isFullTab) return; // Don't initialize in compact mode
    
    let engine;
    let cleanupFn = () => {};
    const handleWheel = (e) => e.preventDefault();
    const loadedScripts = [];

    const cacheEnvironmentTexture = async () => {
      const envUrl = "https://assets.babylonjs.com/environments/studio.env";
      const cacheDir = ".datacore/babylon_cache";
      const cachePath = `${cacheDir}/studio.env`;
      const adapter = dc.app.vault.adapter;
      
      try {
        // Check if cached file exists
        const cachedExists = await adapter.exists(cachePath);
        if (cachedExists) {
          return dc.app.vault.adapter.getResourcePath(cachePath);
        }
        
        // Download and cache the environment texture
        const response = await fetch(envUrl);
        if (!response.ok) {
          return envUrl; // Fallback to direct URL
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Create cache directory if needed
        if (!(await adapter.exists(cacheDir))) {
          await adapter.mkdir(cacheDir);
        }
        
        // Write binary file
        await adapter.writeBinary(cachePath, uint8Array);
        return dc.app.vault.adapter.getResourcePath(cachePath);
      } catch (error) {
        return envUrl; // Fallback to direct URL on error
      }
    };

    const initBabylon = async () => {
      if (engineRef.current || !canvasRef.current) return;
      
      setLoading(true);
      
      try {
        // Load Babylon.js if not already loaded
        if (!window.BABYLON || !window.BABYLON.SceneLoader) {
          loadedScripts.push(await loadScriptOptimized("https://cdn.babylonjs.com/babylon.js"));
          loadedScripts.push(await loadScriptOptimized("https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"));
        }
        
        // Cache environment texture
        const envTexturePath = await cacheEnvironmentTexture();

        // Wait for canvas to be properly ready
        if (!canvasRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!window.BABYLON || !canvasRef.current) {
          setLoading(false);
          return;
        }
        
        engine = new window.BABYLON.Engine(canvasRef.current, true, { 
          preserveDrawingBuffer: true, 
          stencil: true,
          antialias: true 
        });
        engineRef.current = engine;
        
        const scene = new window.BABYLON.Scene(engine);
        sceneRef.current = scene;
        scene.clearColor = new window.BABYLON.Color4(0, 0, 0, 0);
        
        const camera = new window.BABYLON.ArcRotateCamera(
          "Camera", 
          -Math.PI / 2, 
          Math.PI / 2.5, 
          10, 
          window.BABYLON.Vector3.Zero(), 
          scene
        );
        cameraRef.current = camera;
        
        if (!disableControls) camera.attachControl(canvasRef.current, true);
        camera.minZ = 0.1;
        camera.lowerRadiusLimit = lowerLimit;
        camera.upperRadiusLimit = upperLimit;
        
        scene.createDefaultEnvironment({ 
          createSkybox: false, 
          createGround: false, 
          environmentTexture: envTexturePath, 
          intensity: 1.2 
        });
        
        const directionalLight = new window.BABYLON.DirectionalLight(
          "directionalLight", 
          new window.BABYLON.Vector3(0.5, -1, 0.5), 
          scene
        );
        directionalLight.intensity = 1.5;
        
        const frontMaterial = new window.BABYLON.StandardMaterial("frontMat", scene);
        frontMaterialRef.current = frontMaterial;
        
        // Get the directory of the current component file and resolve relative path
        const componentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const backImageFullPath = componentDir + "/" + backImagePath;
        const backTextureUrl = `${dc.app.vault.adapter.getResourcePath(backImageFullPath)}?v=${Date.now()}b`;
        const backMaterial = new window.BABYLON.StandardMaterial("backMat", scene);
        backMaterial.diffuseTexture = new window.BABYLON.Texture(backTextureUrl, scene);
        backMaterial.emissiveColor = new window.BABYLON.Color3(0.5, 0.5, 0.5);
        
        const edgeMaterial = new window.BABYLON.StandardMaterial("edgeMat", scene);
        edgeMaterial.diffuseColor = new window.BABYLON.Color3.FromHexString(edgeColor);
        
        const multiMat = new window.BABYLON.MultiMaterial("multi", scene);
        multiMat.subMaterials.push(frontMaterial, backMaterial, edgeMaterial);
        
        const faceUV = [
          new window.BABYLON.Vector4(0, 0, 1, 1), 
          new window.BABYLON.Vector4(0, 1, 1, 0)
        ];
        
        const cardBox = window.BABYLON.MeshBuilder.CreateBox("cardBox", { 
          width: 2.5, 
          height: 3.5, 
          depth: depth, 
          faceUV: faceUV, 
          wrap: true 
        }, scene);
        
        cardBox.material = multiMat;
        cardBox.subMeshes = [];
        new window.BABYLON.SubMesh(1, 0, 4, 0, 6, cardBox);
        new window.BABYLON.SubMesh(0, 4, 4, 6, 6, cardBox);
        new window.BABYLON.SubMesh(2, 8, 4, 12, 6, cardBox);
        new window.BABYLON.SubMesh(2, 12, 4, 18, 6, cardBox);
        new window.BABYLON.SubMesh(2, 16, 4, 24, 6, cardBox);
        new window.BABYLON.SubMesh(2, 20, 4, 30, 6, cardBox);
        
        camera.setTarget(cardBox.getBoundingInfo().boundingSphere.center);
        camera.radius = initialRadius !== null ? initialRadius : cardBox.getBoundingInfo().boundingSphere.radius * 3.5;
        
        const rotationSpeed = disableControls ? 0 : 0.005;
        const handleUserInteraction = () => {
          isAutoRotatingRef.current = false;
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(() => { 
            isAutoRotatingRef.current = true; 
          }, 22000);
        };
        
        if (!disableControls) {
          scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERDOWN || 
                pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERWHEEL || 
                (pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERMOVE && pointerInfo.event.buttons > 0)) {
              handleUserInteraction();
            }
          });
        }
        
        engine.runRenderLoop(() => {
          if (cameraRef.current?.alpha != null && sceneRef.current) {
            if (isAutoRotatingRef.current) { 
              cameraRef.current.alpha += rotationSpeed; 
            }
            sceneRef.current.render();
          }
        });
        
        if (!disableControls && canvasRef.current) { 
          canvasRef.current.addEventListener("wheel", handleWheel, { passive: false }); 
        }
        
        // Setup ResizeObserver with debouncing
        let resizeTimeout;
        if (containerRef.current) {
          resizeObserverRef.current = new ResizeObserver(() => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
              window.requestAnimationFrame(() => {
                try {
                  if (engine && !engine.isDisposed) {
                    engine.resize();
                  }
                } catch (error) {
                  // Silent resize error
                }
              });
            }, 150);
          });
          resizeObserverRef.current.observe(containerRef.current);
        }
        
        // Small delay to ensure everything is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setLoading(false);
        setSceneReady(true);
        
      } catch (error) {
        setLoading(false);
      }
    };
    
    initBabylon();
    
    return () => {
      setSceneReady(false);
      clearTimeout(idleTimerRef.current);
      
      const canvas = canvasRef.current;
      if (!disableControls && canvas) { 
        canvas.removeEventListener("wheel", handleWheel); 
      }
      
      if (resizeObserverRef.current && containerRef.current) {
        try {
          resizeObserverRef.current.unobserve(containerRef.current);
          resizeObserverRef.current.disconnect();
        } catch (error) {
          // Silent cleanup
        }
      }
      
      if (engineRef.current) { 
        try {
          engineRef.current.stopRenderLoop();
          videoTextureA_Ref.current?.dispose();
          videoTextureB_Ref.current?.dispose();
          if (sceneRef.current) sceneRef.current.dispose();
          engineRef.current.dispose();
        } catch (error) {
          // Silent cleanup
        }
        engineRef.current = null;
        sceneRef.current = null;
      }
      
      loadedScripts.forEach(script => {
        if (script && script.parentElement) {
          document.body.removeChild(script);
        }
      });
    };
  }, [isFullTab, refreshKey, currentPath]);

  // This effect initializes the video playlist and sets up the click-to-play logic with rarity and shift-click override
  useEffect(() => {
    if (!sceneReady || !sceneRef.current || !frontMaterialRef.current || !window.BABYLON) {
      return;
    }
    
    videoTextureA_Ref.current?.dispose();
    videoTextureB_Ref.current?.dispose();
    isTextureA_ActiveRef.current = true;
    hasActiveVideoEndedRef.current = false;

    // Get the directory of the current component file for relative paths
    const componentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));

    const videos = [
        { path: "_resources/videos/card_cat_1.webm", weight: 45 },
        { path: "_resources/videos/card_cat_2.webm", weight: 45 },
        { path: "_resources/videos/card_cat_3.webm", weight: 10, isRare: true }
    ];

    const selectWeightedRandomVideo = (videoList) => {
        const totalWeight = videoList.reduce((sum, video) => sum + video.weight, 0);
        let random = Math.random() * totalWeight;
        for (const video of videoList) {
            if (random < video.weight) return video.path;
            random -= video.weight;
        }
        return videoList[0].path;
    };

    const createAndPrepareTexture = (relativePath) => {
        const fullPath = componentDir + "/" + relativePath;
        const videoUrl = dc.app.vault.adapter.getResourcePath(fullPath);
        const texture = new window.BABYLON.VideoTexture(
          `video_${relativePath}`, 
          videoUrl, 
          sceneRef.current, 
          false, 
          true, 
          window.BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE, 
          { autoPlay: false, loop: false, muted: true }
        );
        texture.video.onended = () => { hasActiveVideoEndedRef.current = true; };
        return texture;
    };

    const playNextVideo = (forceRare = false) => {
        isTextureA_ActiveRef.current = !isTextureA_ActiveRef.current;
        const nowActiveTextureRef = isTextureA_ActiveRef.current ? videoTextureA_Ref : videoTextureB_Ref;
        const nextPreloadTextureRef = isTextureA_ActiveRef.current ? videoTextureB_Ref : videoTextureA_Ref;
        
        frontMaterialRef.current.diffuseTexture = nowActiveTextureRef.current;
        nowActiveTextureRef.current.video.play();
        
        let nextVideoPath;
        if (forceRare) {
            const rareVideo = videos.find(v => v.isRare);
            nextVideoPath = rareVideo ? rareVideo.path : selectWeightedRandomVideo(videos);
        } else {
            nextVideoPath = selectWeightedRandomVideo(videos);
        }
        
        nextPreloadTextureRef.current?.dispose(); 
        nextPreloadTextureRef.current = createAndPrepareTexture(nextVideoPath);
    };

    sceneRef.current.onPointerDown = (evt, pickResult) => {
        if (pickResult.hit && pickResult.pickedMesh.name === "cardBox" && pickResult.subMeshId === 1) {
            const activeTexture = isTextureA_ActiveRef.current ? videoTextureA_Ref.current : videoTextureB_Ref.current;
            
            if (hasActiveVideoEndedRef.current) {
                hasActiveVideoEndedRef.current = false;
                playNextVideo(evt.shiftKey);
            } else {
                if (activeTexture.video.paused) {
                    if (activeTexture.video.muted) activeTexture.video.muted = false;
                    activeTexture.video.play();
                }
            }
        }
    };

    // --- Initial Kick-off ---
    try {
      const initialVideoPath = selectWeightedRandomVideo(videos);
      videoTextureA_Ref.current = createAndPrepareTexture(initialVideoPath);
      frontMaterialRef.current.diffuseTexture = videoTextureA_Ref.current;
      frontMaterialRef.current.emissiveColor = new window.BABYLON.Color3.White();
      
      const secondVideoPath = selectWeightedRandomVideo(videos);
      videoTextureB_Ref.current = createAndPrepareTexture(secondVideoPath);

      if (videoTextureA_Ref.current) {
          videoTextureA_Ref.current.video.play().then(() => {
              videoTextureA_Ref.current.video.pause();
          }).catch(() => { 
              // Initial video play prevented, but first frame should load
          });
      }
    } catch (error) {
      // Silent error handling
    }
    
    return () => { 
      if(sceneRef.current) sceneRef.current.onPointerDown = null;
    }
  }, [sceneReady, refreshKey, currentPath]);

  // Handle full-tab mode
  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };
  
  const handleEnterFullTab = () => setIsFullTab(true);

  // Compact mode view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed rgba(147, 51, 234, 0.3)",
        borderRadius: "8px",
        backgroundColor: "#0a0a0a"
      }}>
        <p style={{ margin: 0, color: "#9ca3af", fontSize: "14px" }}>
          🎴 Animated Card in compact mode
        </p>
        <button
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#ffffff",
            backgroundColor: "rgba(147, 51, 234, 0.8)",
            border: "1px solid rgba(147, 51, 234, 0.5)",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={handleEnterFullTab}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <style>{`
        .${uniqueWrapperClass} .subtle-icon {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        .${uniqueWrapperClass}:hover .subtle-icon {
          opacity: 0.7;
          transform: scale(1);
        }
        .${uniqueWrapperClass} .subtle-icon:hover {
          opacity: 1;
        }
        .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
          visibility: visible;
          opacity: 1;
        }
        .refresh-button {
          background-color: #333;
          transition: background-color 0.3s ease, transform 0.1s ease;
          box-sizing: border-box;
        }
        .refresh-button:hover {
          background-color: #6A0DAD;
          transform: scale(1.05);
        }
        .refresh-button:active {
          transform: scale(0.95);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", backgroundColor: "#000000" }} className={uniqueWrapperClass}>
        {/* Exit Full Tab Icon */}
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            fontFamily: "monospace",
            fontSize: "18px",
            color: "rgba(147, 51, 234, 0.8)",
            userSelect: "none",
            cursor: "pointer",
            zIndex: 10001,
            padding: "8px 12px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "6px",
            border: "1px solid rgba(147, 51, 234, 0.3)",
            backdropFilter: "blur(10px)",
          }}
          className="subtle-icon"
          onClick={handleExitFullTab}
        >
          &lt;/&gt;
          <span className="exit-tooltip" style={{
            visibility: "hidden",
            opacity: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "#9ca3af",
            textAlign: "center",
            borderRadius: "4px",
            padding: "5px 10px",
            position: "absolute",
            zIndex: 1,
            top: "50%",
            right: "120%",
            transform: "translateY(-50%)",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            border: "1px solid rgba(147, 51, 234, 0.3)",
          }}>
            Close Full Mode
          </span>
        </div>
        
        {/* Loading indicator */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10002,
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(147, 51, 234, 0.2)',
              borderTop: '3px solid rgba(147, 51, 234, 0.8)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Loading Card...</span>
          </div>
        )}
        
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        
        {!disableControls && (
          <button 
            onClick={() => setRefreshKey(k => k + 1)} 
            className="refresh-button" 
            style={{ 
              position: "absolute", 
              top: "70px", 
              right: "20px", 
              zIndex: 10000, 
              width: "44px", 
              height: "44px", 
              borderRadius: "50%", 
              border: "none", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              cursor: "pointer", 
              color: 'white', 
              outline: 'none',
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.4)"
            }} 
            title="Restart Video Sequence"
            aria-label="Refresh Scene"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

return { WorldView };
```


# LoadScript 

```jsx
/**
 * Loads a script either from a URL (with caching) or a local vault path.
 * In a Datacore component context, this function requires the `dc` object
 * to access the vault's file system adapter for caching.
 *
 * @param {object} dc - The Datacore context object.
 * @param {string} src - The URL or local vault path of the script.
 * @param {Function} [onload] - Optional callback function to execute when the script loads successfully.
 * @param {Function} [onerror] - Optional callback function to execute if loading fails.
 * @returns {Promise<HTMLScriptElement>} A promise that resolves with the script element when loaded, or rejects on error.
 */
async function loadScript(dc, src, onload, onerror) {
  // Define a cache directory within Obsidian's hidden folder structure
  const cacheDir = ".datacore/script_cache";
  // Simple check for URL format
  const isUrl = /^https?:\/\//.test(src);

  // --- Helper Function to Execute Script Content ---
  const executeScriptContent = (scriptContent, resolve, reject, scriptElement) => {
    try {
      scriptElement.textContent = scriptContent;
      document.body.appendChild(scriptElement);
      if (onload) {
        onload();
      }
      resolve(scriptElement);
    } catch (execError) {
      if (onerror) {
        onerror(execError);
      }
      reject(execError);
    }
  };

  return new Promise(async (resolve, reject) => {
    const scriptElement = document.createElement("script");
    scriptElement.async = true;

    // **CHANGE**: Get the adapter from the `dc` object, not the global `app`.
    if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
        return reject(new Error("Datacore context 'dc' with vault adapter is required for loadScript."));
    }
    const adapter = dc.app.vault.adapter;

    try {
      if (isUrl) {
        // --- URL Handling (Fetch & Cache) ---
        const safeFilename = src
          .replace(/^https?:\/\//, '')
          .replace(/[\/\\?%*:|"<>]/g, '_') + ".js";
        const cachePath = `${cacheDir}/${safeFilename}`;

        let scriptText = null;

        // 1. Check if the cached file exists
        const cachedExists = await adapter.exists(cachePath);

        if (cachedExists) {
          try {
            scriptText = await adapter.read(cachePath);
          } catch (readError) {
            // Failed to read cache, will refetch
          }
        }

        if (scriptText === null) {
          const response = await fetch(src);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${src}`);
          }
          scriptText = await response.text();

          // 3. Write to cache
          try {
            if (!(await adapter.exists(cacheDir))) {
              await adapter.mkdir(cacheDir);
            }
            await adapter.write(cachePath, scriptText);
          } catch (writeError) {
            // Failed to write to cache
          }
        }
        executeScriptContent(scriptText, resolve, reject, scriptElement);

      } else {
        // --- Local Vault Path Handling ---
        const localFileExists = await adapter.exists(src);

        if (!localFileExists) {
           throw new Error(`Local script file not found: ${src}`);
        }

        const scriptText = await adapter.read(src);
        executeScriptContent(scriptText, resolve, reject, scriptElement);
      }
    } catch (error) {
      // --- General Error Handling ---
      if (scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      if (onerror) {
        onerror(error);
      }
      reject(error);
    }
  });
}

return { loadScript };
```


