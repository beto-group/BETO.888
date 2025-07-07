



# ViewComponent


```jsx
// ViewComponent (WorldView.jsx)

const { useRef, useEffect, useState } = dc;
const { loadScript } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/34 AnimatedCard/D.q.animatedcard.component.md", "LoadScript"));

function WorldView({
  frontImagePath = "_RESOURCES/IMAGES/B26.cat/card_default.f.png",
  backImagePath = "_RESOURCES/IMAGES/B26.cat/card_default.b.png",
  depth = 0.01,
  edgeColor = "#333333",
  initialRadius = null,
  lowerLimit = 1,
  upperLimit = 15,
  disableControls = false,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frontMaterialRef = useRef(null);
  const videoTextureA_Ref = useRef(null);
  const videoTextureB_Ref = useRef(null);
  const isTextureA_ActiveRef = useRef(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Refs for Idle Rotation ---
  const isAutoRotatingRef = useRef(true);
  const idleTimerRef = useRef(null);

  // --- Ref for on-demand playback logic ---
  const hasActiveVideoEndedRef = useRef(false);

  // This effect runs ONLY ONCE on mount to initialize the entire scene
  useEffect(() => {
    let engine;
    const handleWheel = (e) => e.preventDefault();

    const initBabylon = async () => {
      if (engineRef.current || !canvasRef.current) return;
      if (!window.BABYLON) {
        await loadScript(dc, "https://cdn.babylonjs.com/babylon.js");
        await loadScript(dc, "https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js");
      }
      engine = new window.BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
      engineRef.current = engine;
      const scene = new window.BABYLON.Scene(engine);
      sceneRef.current = scene;
      const camera = new window.BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2.5, 10, window.BABYLON.Vector3.Zero(), scene);
      cameraRef.current = camera;
      if (!disableControls) camera.attachControl(canvasRef.current, true);
      camera.minZ = 0.1;
      camera.lowerRadiusLimit = lowerLimit;
      camera.upperRadiusLimit = upperLimit;
      scene.clearColor = new window.BABYLON.Color4(0, 0, 0, 0);
      scene.createDefaultEnvironment({ createSkybox: false, createGround: false, environmentTexture: "https://assets.babylonjs.com/environments/studio.env", intensity: 1.2 });
      const directionalLight = new window.BABYLON.DirectionalLight("directionalLight", new window.BABYLON.Vector3(0.5, -1, 0.5), scene);
      directionalLight.intensity = 1.5;
      const frontMaterial = new window.BABYLON.StandardMaterial("frontMat", scene);
      frontMaterialRef.current = frontMaterial;
      const backTextureUrl = `${dc.app.vault.adapter.getResourcePath(backImagePath)}?v=${Date.now()}b`;
      const backMaterial = new window.BABYLON.StandardMaterial("backMat", scene);
      backMaterial.diffuseTexture = new window.BABYLON.Texture(backTextureUrl, scene);
      backMaterial.emissiveColor = new window.BABYLON.Color3(0.5, 0.5, 0.5);
      const edgeMaterial = new window.BABYLON.StandardMaterial("edgeMat", scene);
      edgeMaterial.diffuseColor = new window.BABYLON.Color3.FromHexString(edgeColor);
      const multiMat = new window.BABYLON.MultiMaterial("multi", scene);
      multiMat.subMaterials.push(frontMaterial, backMaterial, edgeMaterial);
      const faceUV = [ new window.BABYLON.Vector4(0, 0, 1, 1), new window.BABYLON.Vector4(0, 1, 1, 0) ];
      const cardBox = window.BABYLON.MeshBuilder.CreateBox("cardBox", { width: 2.5, height: 3.5, depth: depth, faceUV: faceUV, wrap: true }, scene);
      cardBox.material = multiMat;
      cardBox.subMeshes = [];
      new window.BABYLON.SubMesh(1, 0, 4, 0, 6, cardBox); new window.BABYLON.SubMesh(0, 4, 4, 6, 6, cardBox); new window.BABYLON.SubMesh(2, 8, 4, 12, 6, cardBox); new window.BABYLON.SubMesh(2, 12, 4, 18, 6, cardBox); new window.BABYLON.SubMesh(2, 16, 4, 24, 6, cardBox); new window.BABYLON.SubMesh(2, 20, 4, 30, 6, cardBox);
      camera.setTarget(cardBox.getBoundingInfo().boundingSphere.center);
      camera.radius = initialRadius !== null ? initialRadius : cardBox.getBoundingInfo().boundingSphere.radius * 3.5;
      const rotationSpeed = disableControls ? 0 : 0.005;
      const handleUserInteraction = () => {
          isAutoRotatingRef.current = false;
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(() => { isAutoRotatingRef.current = true; }, 22000); 
      };
      if (!disableControls) {
          scene.onPointerObservable.add((pointerInfo) => {
              if (pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERDOWN || pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERWHEEL || (pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERMOVE && pointerInfo.event.buttons > 0)) {
                  handleUserInteraction();
              }
          });
      }
      engine.runRenderLoop(() => {
        if (cameraRef.current?.alpha != null) {
          if (isAutoRotatingRef.current) { cameraRef.current.alpha += rotationSpeed; }
          scene.render();
        }
      });
      if (!disableControls && canvasRef.current) { canvasRef.current.addEventListener("wheel", handleWheel, { passive: false }); }
      const resizeObserver = new ResizeObserver(() => engine.resize());
      resizeObserver.observe(containerRef.current);
    };
    initBabylon();
    return () => {
      clearTimeout(idleTimerRef.current);
      const canvas = canvasRef.current;
      if (!disableControls && canvas) { canvas.removeEventListener("wheel", handleWheel); }
      if (engineRef.current) { engineRef.current.stopRenderLoop(); videoTextureA_Ref.current?.dispose(); videoTextureB_Ref.current?.dispose(); if (sceneRef.current) sceneRef.current.dispose(); engineRef.current.dispose(); engineRef.current = null; sceneRef.current = null; }
    };
  }, []);

  // This effect initializes the video playlist and sets up the click-to-play logic with rarity and shift-click override
  useEffect(() => {
    if (!sceneRef.current || !frontMaterialRef.current) return;
    videoTextureA_Ref.current?.dispose();
    videoTextureB_Ref.current?.dispose();
    isTextureA_ActiveRef.current = true;
    hasActiveVideoEndedRef.current = false;

    const videos = [
        { path: "_RESOURCES/WEBM/card_cat_1.webm", weight: 45 },
        { path: "_RESOURCES/WEBM/card_cat_2.webm", weight: 45 },
        { path: "_RESOURCES/WEBM/card_cat_3.webm", weight: 10, isRare: true } // Identify the rare one
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

    const createAndPrepareTexture = (path) => {
        const videoUrl = dc.app.vault.adapter.getResourcePath(path);
        const texture = new window.BABYLON.VideoTexture(`video_${path}`, videoUrl, sceneRef.current, false, true, window.BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE, { autoPlay: false, loop: false, muted: true });
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
        // ====================== SHIFT+CLICK OVERRIDE LOGIC ======================
        if (forceRare) {
            const rareVideo = videos.find(v => v.isRare);
            nextVideoPath = rareVideo ? rareVideo.path : selectWeightedRandomVideo(videos);
        } else {
            nextVideoPath = selectWeightedRandomVideo(videos);
        }
        // ========================================================================
        
        nextPreloadTextureRef.current?.dispose(); 
        nextPreloadTextureRef.current = createAndPrepareTexture(nextVideoPath);
    };

    sceneRef.current.onPointerDown = (evt, pickResult) => {
        if (pickResult.hit && pickResult.pickedMesh.name === "cardBox" && pickResult.subMeshId === 1) {
            const activeTexture = isTextureA_ActiveRef.current ? videoTextureA_Ref.current : videoTextureB_Ref.current;
            
            if (hasActiveVideoEndedRef.current) {
                hasActiveVideoEndedRef.current = false;
                // Pass the state of the shift key to the playback function
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
    const initialVideoPath = selectWeightedRandomVideo(videos);
    videoTextureA_Ref.current = createAndPrepareTexture(initialVideoPath);
    frontMaterialRef.current.diffuseTexture = videoTextureA_Ref.current;
    frontMaterialRef.current.emissiveColor = new window.BABYLON.Color3.White();
    
    const secondVideoPath = selectWeightedRandomVideo(videos);
    videoTextureB_Ref.current = createAndPrepareTexture(secondVideoPath);

    if (videoTextureA_Ref.current) {
        videoTextureA_Ref.current.video.play().then(() => {
            videoTextureA_Ref.current.video.pause();
        }).catch(() => { console.log("Initial video play() was prevented, but the first frame should still load."); });
    }
    
    return () => { if(sceneRef.current) sceneRef.current.onPointerDown = null; }
  }, [refreshKey]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "66vh", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      {!disableControls && (
        <>
            <style>{`.refresh-button:hover{background-color:#6A0DAD;transform:scale(1.05)} .refresh-button:active{transform:scale(.95)}`}</style>
            <button onClick={() => setRefreshKey(k => k + 1)} className="refresh-button" style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10, width: "44px", height: "44px", borderRadius: "50%", border: "none", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", backgroundColor: '#333', color: 'white', outline: 'none' }} title="Restart Video Sequence">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
            </button>
        </>
      )}
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
      console.log(`Script executed from ${isUrl ? 'cache/network' : 'local path'}: ${src}`);
      if (onload) {
        onload();
      }
      resolve(scriptElement);
    } catch (execError) {
      console.error(`Error executing script content from ${src}:`, execError);
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
          console.log(`Loading script from cache: ${cachePath}`);
          try {
            scriptText = await adapter.read(cachePath);
          } catch (readError) {
            console.warn(`Failed to read cache file ${cachePath}, attempting refetch. Error:`, readError);
          }
        }

        if (scriptText === null) {
          console.log(`Fetching script from network: ${src}`);
          const response = await fetch(src);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${src}`);
          }
          scriptText = await response.text();

          // 3. Write to cache
          try {
            if (!(await adapter.exists(cacheDir))) {
              console.log(`Creating script cache directory: ${cacheDir}`);
              await adapter.mkdir(cacheDir);
            }
            console.log(`Writing script to cache: ${cachePath}`);
            await adapter.write(cachePath, scriptText);
          } catch (writeError) {
            console.warn(`Failed to write script to cache ${cachePath}. Error:`, writeError);
          }
        }
        executeScriptContent(scriptText, resolve, reject, scriptElement);

      } else {
        // --- Local Vault Path Handling ---
        console.log(`Loading script from local vault path: ${src}`);
        const localFileExists = await adapter.exists(src);

        if (!localFileExists) {
           throw new Error(`Local script file not found: ${src}`);
        }

        const scriptText = await adapter.read(src);
        executeScriptContent(scriptText, resolve, reject, scriptElement);
      }
    } catch (error) {
      // --- General Error Handling ---
      console.error(`Failed to load script ${src}:`, error);
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