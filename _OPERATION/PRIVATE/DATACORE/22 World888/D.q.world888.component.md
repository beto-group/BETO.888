



# ViewComponent

```jsx
// WorldView.js
const fileName = "_OPERATION/PRIVATE/DATACORE/22 World888/D.q.world888.component.md"

// Import React/Preact hooks.
const { useState, useEffect, useRef } = dc;
const { WorldLogic } = await dc.require(
  dc.headerLink(fileName, "WorldLogic")
);
const { ScreenModeHelper } = await dc.require(
  dc.headerLink(fileName, "ScreenModeHelper")
);
const { preventDefaultInputs } = await dc.require(
  dc.headerLink(fileName, "PreventDefaultInputs")
);

function WorldView() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const helperRef = useRef(null); // For ScreenModeHelper communication
  const originalParentRefForWindow = useRef(null);
  const originalParentRefForPiP = useRef(null);
  const [worldResources, setWorldResources] = useState(null);
  const worldResourcesRef = useRef(null); // Ref to hold resources specifically for cleanup access

  // Initialize preventDefaultInputs to block all commands
  const { handleFocus, handleBlur, handleKeyDown } = preventDefaultInputs({
    viewRef: containerRef
  });

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    console.log("WorldView: Mounting and initializing WorldLogic...");

    // Ensure canvasRef is populated before calling WorldLogic
    if (!canvasRef.current) {
      console.warn("WorldView: canvasRef is null initially in useEffect.");
    }

    WorldLogic({ canvasRef }) // Pass the ref object itself
      .then((resources) => {
        if (isMounted) {
          console.log("WorldView: World resources initialized.", resources);
          if (resources.multiplayerResources) {
            if (resources.multiplayerResources.isBroadcastChannel) {
              console.log("WorldView: Multiplayer (BroadcastChannel) is active. Instance ID:", resources.multiplayerResources.instanceId);
            } else {
              console.log("WorldView: Multiplayer (Unknown Type) is active.");
            }
          } else {
            console.warn("WorldView: Multiplayer is not active or failed to initialize.");
          }
          setWorldResources(resources);
          worldResourcesRef.current = resources; // Store in ref for cleanup access
        } else {
          console.log("WorldView: Component unmounted before WorldLogic resolved. Cleaning up resources early.");
          resources?.cleanup(); // Use optional chaining
        }
      })
      .catch((err) => {
        console.error("WorldView: Error initializing world:", err);
        if (isMounted) {
          setWorldResources(null); // Indicate error state if needed
        }
      });

    // Cleanup function for when the WorldView component unmounts
    return () => {
      isMounted = false;
      console.log("WorldView: Unmounting component. Triggering cleanup...");

      // Cleanup WorldLogic resources
      if (worldResourcesRef.current && typeof worldResourcesRef.current.cleanup === 'function') {
        console.log("WorldView: Calling cleanup function from worldResourcesRef.");
        worldResourcesRef.current.cleanup();
      } else {
        console.warn("WorldView: Cleanup function not found on unmount via worldResourcesRef.");
        if (worldResources && typeof worldResources.cleanup === 'function') {
          console.warn("WorldView: Attempting cleanup via state variable (might be stale).");
          worldResources.cleanup();
        }
      }
      worldResourcesRef.current = null; // Clear the ref after cleanup attempt

      // Call handleBlur to ensure commands are restored
      handleBlur();
      //console.log("WorldView: preventDefaultInputs cleanup completed.");
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Render logic
  return (
    <div
      ref={containerRef}
      tabIndex={0} // Make the container focusable
      style={{
        position: "relative",
        width: "100%",
        height: "400px",
        outline: "none",
      }}
    >
      {/* Ensure canvas has a ref */}
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* Conditional rendering based on worldResources */}
      {worldResources ? (
        <>
          {/* Render SpherePipSpawner */}
          {worldResources.scene && worldResources.SpherePipSpawner && (
            <worldResources.SpherePipSpawner scene={worldResources.scene} helperRef={helperRef} />
          )}

          {/* Render ScreenModeHelper */}
          {worldResources.engine && (
            <ScreenModeHelper
              helperRef={helperRef}
              containerRef={containerRef}
              defaultStyle="position: relative; width: 100%; height: 400px;"
              originalParentRefForWindow={originalParentRefForWindow}
              originalParentRefForPiP={originalParentRefForPiP}
              allowedScreenModes={["browser", "window", "pip", "character"]}
              engine={worldResources.engine}
            />
          )}

          {/* Display multiplayer status */}
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', padding: '5px 8px', borderRadius: '4px', fontSize: '12px', zIndex: 10 }}>
            Multiplayer: {worldResources.multiplayerResources ?
              (worldResources.multiplayerResources.isBroadcastChannel ? `Local Active (ID: ...${worldResources.multiplayerResources.instanceId.slice(-6)})` : 'Active (Unknown)') :
              'Inactive'}
          </div>
        </>
      ) : (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
          Loading World...
        </div>
      )}
    </div>
  );
}

return { WorldView };
```

# WorldLogic

```jsx
const fileName = "_OPERATION/PRIVATE/DATACORE/22 World888/D.q.world888.component.md";

// Keep all imports from your original overhead code
const { loadScript } = await dc.require(dc.headerLink(fileName, "LoadScript"));
const { CharacterLogic } = await dc.require(dc.headerLink(fileName, "CharacterLogic"));
const { SpherePipSpawner } = await dc.require(dc.headerLink(fileName, "SpherePipSpawner"));
const { PaneLogic } = await dc.require(dc.headerLink(fileName, "PaneLogic"));
const { applyPhysicsToMesh, initializeHavokPhysics } = await dc.require(dc.headerLink(fileName, "HavokPhysics"));
const { Multiplayer } = await dc.require(dc.headerLink(fileName, "Multiplayer"));

// Script URLs
const BABYLON_URL = "https://cdn.babylonjs.com/babylon.js";
const GLTF_LOADER_URL = "https://cdn.babylonjs.com/loaders/babylon.glTFFileLoader.min.js";
const HAVOK_UMD_URL = "https://cdn.babylonjs.com/havok/HavokPhysics_umd.js";
const HAVOK_WASM_URL = "https://cdn.babylonjs.com/havok/HavokPhysics.wasm";

// --- SceneLoader Module ---

function initBabylonEngineAndScene(canvasRef) {
    if (!window.BABYLON) { console.error("SceneLoader.init: FATAL - Babylon.js not loaded."); return null; }
    const canvas = canvasRef?.current;
    if (!canvas) { console.error("SceneLoader.init: Canvas reference missing or null."); return null; }

    const engine = new window.BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true
    });

    engine.uniqueId = engine.uniqueId || (Math.random() * 1000).toFixed(0);
    console.log(`SceneLoader.init: Engine created (ID: ${engine.uniqueId}).`);

    if (!engine._gl) {
        console.error(`SceneLoader.init: Engine (ID: ${engine.uniqueId}) creation failed (no WebGL context?). Disposing.`);
        engine.dispose();
        return null;
    }

    const contextLostHandler = (event) => {
        console.warn(`SceneLoader: WebGL context LOST for engine (ID: ${engine.uniqueId}).`);
        event.preventDefault();
        if (!engine.isDisposed) {
            engine._onContextLost(event);
        }
    };
    const contextRestoredHandler = () => {
        console.log(`SceneLoader: WebGL context RESTORED for engine (ID: ${engine.uniqueId}).`);
        if (!engine.isDisposed) {
            engine._onContextRestored();
        }
    };

    canvas.removeEventListener("webglcontextlost", canvas._previousContextLostHandler || (() => {}));
    canvas.removeEventListener("webglcontextrestored", canvas._previousContextRestoredHandler || (() => {}));

    canvas.addEventListener("webglcontextlost", contextLostHandler, false);
    canvas.addEventListener("webglcontextrestored", contextRestoredHandler, false);

    canvas._previousContextLostHandler = contextLostHandler;
    canvas._previousContextRestoredHandler = contextRestoredHandler;

    console.log(`SceneLoader.init: Creating new BABYLON.Scene for engine (ID: ${engine.uniqueId})...`);
    const scene = new window.BABYLON.Scene(engine);
    scene.clearColor = new window.BABYLON.Color4(0.1, 0.1, 0.1, 1);
    scene.autoClear = true;
    scene.autoClearDepthAndStencil = true;
    console.log(`SceneLoader.init: Scene created for engine (ID: ${engine.uniqueId}).`);

    return { engine, scene, canvas };
}

async function loadSceneObjects(scene, glbConfig) {
    if (!window.BABYLON?.SceneLoader) { throw new Error("loadSceneObjects: Babylon.js SceneLoader not available."); }
    if (!scene || scene.isDisposed) { throw new Error(`loadSceneObjects: Scene is invalid or disposed.`); }

    const { url, path, file } = glbConfig;
    const allImportedNodes = [];
    let glbRootNode = null;

    console.log(`SceneLoader.loadObjects: Attempting to load GLB: ${url}${path}${file} into scene associated with engine ID: ${scene.getEngine().uniqueId}`);
    try {
        const result = await window.BABYLON.SceneLoader.ImportMeshAsync("", url, file, scene);
        console.log(`SceneLoader.loadObjects: GLB loaded. Processing ${result.meshes.length} meshes/nodes...`);

        for (const node of result.meshes) {
            if (!node || node.isDisposed()) {
                console.log(`SceneLoader.loadObjects: Skipping null/disposed node.`);
                continue;
            };
            if (node.name === "__root__") {
                glbRootNode = node;
                console.log(`SceneLoader.loadObjects: Identified root node: ${node.name}.`);
                allImportedNodes.push(node);
                continue;
            }

            if (node instanceof window.BABYLON.Mesh) {
                const hasPositions = node.getVerticesData(window.BABYLON.VertexBuffer.PositionKind);
                const hasIndices = node.getIndices();
                let isValid = true;
                if (!hasPositions || hasPositions.length === 0) {
                    console.warn(`SceneLoader.loadObjects: Mesh ${node.name} has NO POSITION data. Disposing.`);
                    node.dispose();
                    isValid = false;
                }
                if (!hasIndices || hasIndices.length === 0) {
                    console.warn(`SceneLoader.loadObjects: Mesh ${node.name} has NO INDEX data. This might be unexpected, but not necessarily invalid.`);
                }
                if (isValid) {
                    node.isPickable = false;
                    allImportedNodes.push(node);
                }
            } else if (node instanceof window.BABYLON.TransformNode) {
                console.log(`SceneLoader.loadObjects: Added TransformNode "${node.name}".`);
                allImportedNodes.push(node);
            } else {
                console.warn(`SceneLoader.loadObjects: Unknown node type for "${node.name}". Skipping.`);
            }
        }

    } catch (err) {
        console.error(`SceneLoader.loadObjects: Failed during GLB loading or node processing for scene (Engine ID: ${scene?.getEngine()?.uniqueId}):`, err);
        throw err;
    }

    return { glbRootNode, allImportedMeshes: allImportedNodes };
}

// Main sceneLoader Export function
async function sceneLoader({ canvasRef, glbConfig = {
  url: "https://raw.githubusercontent.com/beto-group/beto.assets/main/",
  path: "",
  file: "scene888.glb",
  groundOptions: {
    enable: true,
    size: 2000,
    yPosition: 4, 
    color: [0.4, 0.4, 0.4], 
    subdivisions: 10,
    makeInvisible: true // <<< ADDED THIS OPTION
  }
} }) {
    let engine = null;
    let scene = null;
    let canvas = null;
    let onBeforeRenderObserver = null;

    const animatedVisualMeshes = []; 

    try {
        console.log("--- sceneLoader function started ---");

        const engineAndScene = initBabylonEngineAndScene(canvasRef);
        if (!engineAndScene || !engineAndScene.engine || !engineAndScene.scene) {
            throw new Error("SceneLoader main: Failed to initialize Engine and Scene.");
        }
        engine = engineAndScene.engine;
        scene = engineAndScene.scene;
        canvas = engineAndScene.canvas;

        const camera = new window.BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 1000, window.BABYLON.Vector3.Zero(), scene);
        if (canvas) camera.attachControl(canvas, true);
        camera.wheelPrecision = 50;
        console.log("Camera setup complete.");

        const light = new window.BABYLON.HemisphericLight("light", new window.BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        console.log("Light setup complete.");

        let groundMesh = null;
        if (glbConfig.groundOptions && glbConfig.groundOptions.enable) {
            console.log("SceneLoader: Creating ground mesh...");
            groundMesh = window.BABYLON.MeshBuilder.CreateGround("sceneGround", {
                width: glbConfig.groundOptions.size || 1000,
                height: glbConfig.groundOptions.size || 1000,
                subdivisions: glbConfig.groundOptions.subdivisions || 2
            }, scene);
            
            groundMesh.position.y = glbConfig.groundOptions.yPosition !== undefined ? glbConfig.groundOptions.yPosition : 0;

            // --- MODIFICATION: Make ground invisible if option is set ---
            if (glbConfig.groundOptions.makeInvisible) {
                groundMesh.isVisible = false;
                console.log("SceneLoader: Ground mesh set to invisible.");
            } else {
                 // Only create and assign material if it's visible
                const groundMaterial = new window.BABYLON.StandardMaterial("groundMaterial", scene);
                if (glbConfig.groundOptions.color && Array.isArray(glbConfig.groundOptions.color) && glbConfig.groundOptions.color.length === 3) {
                    groundMaterial.diffuseColor = new window.BABYLON.Color3(...glbConfig.groundOptions.color);
                } else {
                    groundMaterial.diffuseColor = new window.BABYLON.Color3(0.3, 0.5, 0.3); // Default green-ish
                }
                groundMaterial.specularColor = new window.BABYLON.Color3(0.1, 0.1, 0.1);
                groundMesh.material = groundMaterial;
            }
            // --- END MODIFICATION ---
            
            groundMesh.isPickable = false; 
            console.log(`SceneLoader: Ground mesh created at Y: ${groundMesh.position.y}, Size: ${glbConfig.groundOptions.size || 1000}x${glbConfig.groundOptions.size || 1000}. Visible: ${groundMesh.isVisible}`);
        }

        const { glbRootNode, allImportedMeshes } = await loadSceneObjects(scene, glbConfig);
        console.log(`After loadSceneObjects: glbRootNode found: ${!!glbRootNode}, total imported meshes/nodes: ${allImportedMeshes.length}`);

        const environmentMeshesForPhysics = [...allImportedMeshes];
        if (groundMesh) {
            environmentMeshesForPhysics.push(groundMesh);
        }


        const SCENE_SCALE = 11; 

        if (glbRootNode) {
            glbRootNode.rotation = window.BABYLON.Vector3.Zero();
            glbRootNode.position = window.BABYLON.Vector3.Zero();
            glbRootNode.scaling = new window.BABYLON.Vector3(SCENE_SCALE, SCENE_SCALE, SCENE_SCALE);
            camera.target = glbRootNode.absolutePosition;
            console.log(`GLB Root Node ("${glbRootNode.name}") set to be static at origin and scaled by ${SCENE_SCALE}x. Camera target set.`);
        } else {
            console.warn("No __root__ node found in GLB. Camera target defaulted to Zero.");
            camera.target = window.BABYLON.Vector3.Zero();
        }

        const rotatingMeshesWithSpeeds = [];

        let obeliskMesh = null;
        let obeliskOriginalY = 0;
        let hoverTime = 0;
        const hoverAmplitude = 0.05; 
        const hoverFrequency = 1.5;

        const minSpeed = 0.001;
        const maxSpeed = 0.01;

        console.log(`--- Starting mesh selection for rotation ---`);
        let meshesProcessedForAnimation = 0;

        allImportedMeshes.forEach((node) => { 
            if (node instanceof window.BABYLON.Mesh && node.parent === glbRootNode) {
                console.log(`    -> Selected mesh "${node.name}" (Parent: ${node.parent?.name}) for orbital rotation.`);

                const randomSpeed = minSpeed + (Math.random() * (maxSpeed - minSpeed));
                rotatingMeshesWithSpeeds.push({ mesh: node, speed: randomSpeed });
                animatedVisualMeshes.push(node); 
                console.log(`    -> Added "${node.name}" to rotation list with speed: ${randomSpeed.toFixed(4)}. Also added to animatedVisualMeshes.`);
                meshesProcessedForAnimation++;

                if (node.name === "obelisk") {
                    obeliskMesh = node;
                    obeliskOriginalY = node.position.y; 
                    console.log(`    -> Identified "obelisk" mesh for hovering. Original LOCAL Y (relative to glbRootNode): ${obeliskOriginalY.toFixed(4)}`);
                }
            } else {
                const parentName = node.parent ? node.parent.name : "none";
                if (node !== groundMesh) { 
                    console.log(`    -> SKIPPING "${node.name}" for rotation. (Is BABYLON.Mesh: ${node instanceof window.BABYLON.Mesh}. Is Root Node: ${node.name === "__root__"}. Parent: ${parentName}).`);
                }
            }
        });

        console.log(`--- Finished node selection. Processed ${meshesProcessedForAnimation} meshes for animation. ---`);
        if (meshesProcessedForAnimation === 0 && allImportedMeshes.some(m => m instanceof window.BABYLON.Mesh && m.parent === glbRootNode)) {
            console.warn("No actual BABYLON.Mesh instances that are direct children of '__root__' were selected for animation. Verify GLB hierarchy.");
        }


        onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            if (rotatingMeshesWithSpeeds.length > 0) {
                rotatingMeshesWithSpeeds.forEach((item) => {
                    item.mesh.rotate(window.BABYLON.Axis.Y, item.speed, window.BABYLON.Space.WORLD);
                    item.mesh.computeWorldMatrix(true);
                    if (item.mesh.physicsAggregate && item.mesh.physicsAggregate.body.motionType === window.BABYLON.PhysicsMotionType.KINEMATIC) {
                        const absolutePosition = item.mesh.getAbsolutePosition();
                        const absoluteRotation = item.mesh.absoluteRotationQuaternion;
                        item.mesh.physicsAggregate.body.setTargetTransform(absolutePosition, absoluteRotation);
                    }
                });
            }

            if (obeliskMesh) {
                const deltaTime = engine.getDeltaTime() / 1000;
                hoverTime += deltaTime * hoverFrequency;
                const localYOffset = hoverAmplitude * Math.sin(hoverTime);
                obeliskMesh.position.y = obeliskOriginalY + localYOffset;
                obeliskMesh.computeWorldMatrix(true); 
                if (obeliskMesh.physicsAggregate && obeliskMesh.physicsAggregate.body.motionType === window.BABYLON.PhysicsMotionType.KINEMATIC) {
                    const absolutePosition = obeliskMesh.getAbsolutePosition();
                    const absoluteRotation = obeliskMesh.absoluteRotationQuaternion;
                    obeliskMesh.physicsAggregate.body.setTargetTransform(absolutePosition, absoluteRotation);
                }
            }
        });

        console.log("--- sceneLoader function completed. Animation logic set up. ---");

        return {
            engine: engine,
            scene: scene,
            environmentMeshes: environmentMeshesForPhysics,
            glbRootNode: glbRootNode,
            animatedVisualMeshes: animatedVisualMeshes,
            cleanup: () => {
                console.log("--- Initiating SceneLoader cleanup ---");
                if (onBeforeRenderObserver) {
                    scene?.onBeforeRenderObservable.remove(onBeforeRenderObserver);
                    onBeforeRenderObserver = null;
                    console.log("Removed onBeforeRenderObservable observer.");
                }
                if (scene && !scene.isDisposed) {
                    scene.dispose();
                    console.log("Scene disposed by SceneLoader cleanup.");
                }
                if (engine && !engine.isDisposed) {
                    engine.dispose();
                    console.log(`Engine (ID: ${engine.uniqueId}) disposed by SceneLoader cleanup.`);
                } else {
                    console.log("Engine already disposed or not initialized during SceneLoader cleanup.");
                }
                engine = null;
                scene = null;
                console.log("--- SceneLoader cleanup complete ---");
            }
        };
    } catch (err) {
        console.error("--- sceneLoader encountered a fatal error ---", err);
        if (onBeforeRenderObserver) {
            scene?.onBeforeRenderObservable.remove(onBeforeRenderObserver);
            onBeforeRenderObserver = null;
        }
        if (scene && !scene.isDisposed) {
            scene.dispose();
        }
        if (engine && !engine.isDisposed) {
            engine.dispose();
        }
        engine = null;
        scene = null;
        throw err;
    }
}

// --- Main WorldLogic Function ---
function WorldLogic({ canvasRef }) {
  const logicInstanceId = (Math.random() * 1000).toFixed(0);
  const logPrefix = `WorldLogic [${logicInstanceId}]:`;

  console.log(`${logPrefix} Starting...`);

  return new Promise(async (resolveWorldLogic, rejectWorldLogic) => {
    let engine = null;
    let scene = null;
    let characterComponents = null;
    let keyboardObserver = null;
    let sceneDisposeObserver = null;
    let multiplayerResources = null;
    let resizeHandler = null;
    let sceneLoaderCleanupFn = null;

    let worldCleanup = () => {
        const cleanupPrefix = `${logPrefix} Preliminary Cleanup:`;
        console.log(`${cleanupPrefix} Running preliminary cleanup...`);

        if (engine && typeof engine.stopRenderLoop === 'function') {
            try { engine.stopRenderLoop(); } catch (e) { console.warn(`${cleanupPrefix} Error stopping render loop:`, e); }
        }
        if (resizeHandler) { try { window.removeEventListener("resize", resizeHandler); resizeHandler = null; } catch(e) { console.warn(`${cleanupPrefix} Error removing resize listener:`, e); } }
         try {
             const currentCanvas = canvasRef?.current;
             if (currentCanvas && currentCanvas._attachedWheelHandler) { currentCanvas.removeEventListener("wheel", currentCanvas._attachedWheelHandler); delete currentCanvas._attachedWheelHandler; console.log(`${cleanupPrefix} Removed wheel listener.`); }
              if (currentCanvas && currentCanvas._attachedKeydownHandler) { currentCanvas.removeEventListener("keydown", currentCanvas._attachedKeydownHandler); delete currentCanvas._attachedKeydownHandler; console.log(`${cleanupPrefix} Removed keydown listener.`); }
         } catch (e) { console.warn(`${cleanupPrefix} Error removing canvas listeners:`, e); }

        if (sceneLoaderCleanupFn) { try { sceneLoaderCleanupFn(); } catch (e) { console.warn(`${cleanupPrefix} Error during sceneLoader cleanup:`, e); } }

        try { characterComponents?.cleanup(); } catch(e) { console.warn(`${cleanupPrefix} Error during character cleanup:`, e); }
        try { scene?.onKeyboardObservable.remove(keyboardObserver); } catch(e) { console.warn(`${cleanupPrefix} Error removing keyboard observer:`, e); }
        try { scene?.onDisposeObservable.remove(sceneDisposeObserver); } catch(e) { console.warn(`${cleanupPrefix} Error removing scene dispose observer:`, e); }

        if (engine && typeof engine.dispose === 'function' && !engine.isDisposed) {
             console.log(`${cleanupPrefix} Disposing engine...`);
             try { engine.dispose(); } catch (e) { console.warn(`${cleanupPrefix} Error during engine disposal:`, e); }
        } else { console.log(`${cleanupPrefix} Engine already null, disposed, or invalid.`); }

        engine = null; scene = null; characterComponents = null; keyboardObserver = null;
        sceneDisposeObserver = null; multiplayerResources = null; sceneLoaderCleanupFn = null;
        console.log(`${cleanupPrefix} Preliminary cleanup finished.`);
    };

    try {
      console.log(`${logPrefix} Stage 0: Loading Babylon.js and Havok Physics...`);
      await loadScript(BABYLON_URL).catch(err => { throw new Error(`Stage 0 Failed - Load Babylon.js: ${err.message}`); });
      await loadScript(GLTF_LOADER_URL).catch(err => { throw new Error(`Stage 0 Failed - Load GLTF Loader: ${err.message}`); });

      const wasmResponse = await fetch(HAVOK_WASM_URL);
      if (!wasmResponse.ok) throw new Error(`Stage 0 Failed - Fetch WASM: HTTP status ${wasmResponse.status}`);
      const havokWasmBuffer = await wasmResponse.arrayBuffer();
      
      await loadScript(HAVOK_UMD_URL).catch(err => { throw new Error(`Stage 0 Failed - Load Havok UMD: ${err.message}`); });
      
      if (typeof window.HavokPhysics !== 'function') throw new Error("Stage 0 Failed - window.HavokPhysics not found.");
      const havokModule = await window.HavokPhysics({ wasmBinary: havokWasmBuffer });
      window.HK = havokModule;
      console.log(`${logPrefix} Stage 0: Babylon.js and Havok Physics loaded.`);

      console.log(`${logPrefix} Stage 1: Initializing scene and loading GLB...`);
      // You can pass a custom glbConfig here if needed, e.g., to make ground visible:
      // const customGlbConfig = { groundOptions: { enable: true, makeInvisible: false, yPosition: -1 } };
      // const sceneResources = await sceneLoader({ canvasRef, glbConfig: customGlbConfig });
      const sceneResources = await sceneLoader({ canvasRef }); // Uses default glbConfig with invisible ground
      engine = sceneResources.engine;
      scene = sceneResources.scene;
      const environmentMeshes = sceneResources.environmentMeshes; 
      const animatedVisualMeshes = sceneResources.animatedVisualMeshes; 
      sceneLoaderCleanupFn = sceneResources.cleanup;

      if (!engine || engine.isDisposed) throw new Error("Stage 1 Failed - Engine invalid after sceneLoader.");
      if (!scene || scene.isDisposed) throw new Error("Stage 1 Failed - Scene invalid after sceneLoader.");
      console.log(`${logPrefix} Stage 1: Scene and GLB (and potentially ground) loaded.`);

      console.log(`${logPrefix} Stage 2: Initializing Havok Physics...`);
       await initializeHavokPhysics(scene).catch(err => { throw new Error(`Stage 2 Failed - initializeHavokPhysics: ${err.message}`); });
       await new Promise(resolve => setTimeout(resolve, 10)); 
       if (!scene.isPhysicsEnabled()) {
            console.error(`${logPrefix} Verification failed: scene.isPhysicsEnabled() is false.`);
            const physicsEnginePlugin = scene.getPhysicsEngine()?.getPlugin();
             console.error(`${logPrefix} Current physics engine plugin:`, physicsEnginePlugin);
            throw new Error("Stage 2 Failed - Verification: Physics not enabled after initialization.");
       }
       console.log(`${logPrefix} Stage 2: Havok Physics initialized.`);

      console.log(`${logPrefix} Stage 3: Applying physics to environment meshes...`);
      let physicsAppliedCount = 0;
      if (!Array.isArray(environmentMeshes)) {
           console.warn(`${logPrefix} environmentMeshes is not an array. Skipping physics application.`);
      } else {
          const animatedMeshSet = new Set(animatedVisualMeshes);

          for (const node of environmentMeshes) { 
              if (!node || node.isDisposed()) { console.log(`${logPrefix} Skipping physics for null/disposed node ${node?.name}.`); continue; }
              
              if (!(node instanceof window.BABYLON.Mesh)) {
                  console.log(`${logPrefix} Skipping physics for non-mesh node ${node.name}.`);
                  continue;
              }
              if (!scene.isPhysicsEnabled()) { console.error(`${logPrefix} Physics became disabled before mesh ${node.name}! Aborting.`); break; }

              let physicsAggregate = null;
              try {
                    if (animatedMeshSet.has(node)) { 
                        physicsAggregate = applyPhysicsToMesh({
                            mesh: node,
                            scene,
                            shapeType: "MESH", 
                            options: { mass: 0, restitution: 0.1, friction: 0.5, motionType: window.BABYLON.PhysicsMotionType.KINEMATIC } 
                        });
                        if (physicsAggregate) {
                            node.physicsAggregate = physicsAggregate; 
                            physicsAppliedCount++;
                            console.log(`${logPrefix} OK - Physics applied to KINEMATIC mesh ${node.name}.`);
                        } else {
                            console.error(`${logPrefix} FAILED - applyPhysicsToMesh (kinematic) returned null for ${node.name}.`);
                        }
                    } else {
                        physicsAggregate = applyPhysicsToMesh({
                            mesh: node,
                            scene,
                            shapeType: "MESH", 
                            options: { mass: 0, restitution: 0.1, friction: 0.5, motionType: window.BABYLON.PhysicsMotionType.STATIC } 
                        });
                        if (physicsAggregate) {
                            physicsAppliedCount++;
                            node.freezeWorldMatrix(); 
                            console.log(`${logPrefix} OK - Physics applied to STATIC mesh ${node.name}. World matrix frozen.`);
                        } else {
                            console.error(`${logPrefix} FAILED - applyPhysicsToMesh (static) returned null for ${node.name}.`);
                        }
                    }
              } catch (physicsErr) {
                   console.error(`${logPrefix} EXCEPTION applying physics to mesh ${node.name}:`, physicsErr);
              }
          }
          
          if (physicsAppliedCount === 0 && environmentMeshes.filter(m => m instanceof window.BABYLON.Mesh).length > 0) {
               console.warn(`${logPrefix} WARNING: No physics aggregates successfully applied to any meshes! Collisions WILL fail.`);
          }
      }
      console.log(`${logPrefix} Stage 3: Physics applied to environment meshes.`);

      console.log(`${logPrefix} Stage 4: Initializing Character Logic...`);
      try {
          characterComponents = CharacterLogic.initialize(scene, canvasRef);
          if (!characterComponents) throw new Error("CharacterLogic.initialize returned null/undefined.");
      } catch (charError) {
           console.error(`${logPrefix} Error during CharacterLogic.initialize:`, charError);
           throw new Error(`Stage 4 Failed - Character init: ${charError.message}`);
      }
      console.log(`${logPrefix} Stage 4: Character Logic initialized.`);

      console.log(`${logPrefix} Stage 5: Setting up input listeners and observers...`);
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) { throw new Error("Stage 5 Failed - canvasRef is null."); }
      currentCanvas.tabIndex = 0; 
      
      currentCanvas._attachedWheelHandler = (e) => e.preventDefault(); 
      currentCanvas._attachedKeydownHandler = (e) => { 
          if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
          }
      };
      currentCanvas.addEventListener("wheel", currentCanvas._attachedWheelHandler, { passive: false });
      currentCanvas.addEventListener("keydown", currentCanvas._attachedKeydownHandler, { passive: false });
     
      keyboardObserver = scene.onKeyboardObservable.add((kbInfo) => {
           if (kbInfo.type === window.BABYLON.KeyboardEventTypes.KEYDOWN) {
                const key = kbInfo.event.key.toLowerCase();
                if (key === "e") { /* ... e key logic ... */ }
                else if (key === "i") { /* ... i key logic ... */ }
            }
      });
  
      sceneDisposeObserver = scene.onDisposeObservable.add(() => {
        const disposePrefix = `${logPrefix} SceneDispose:`;
        console.log(`${disposePrefix} Cleaning up observers/components during scene dispose...`);
        try { scene?.onKeyboardObservable.remove(keyboardObserver); keyboardObserver = null;} catch(e) { console.warn(`${disposePrefix} Error removing keyboard observer:`, e); }
        try { characterComponents?.cleanup(); } catch(e) { console.warn(`${disposePrefix} Error during character cleanup:`, e); }
        console.log(`${disposePrefix} Scene dispose cleanup finished.`);
      });
      console.log(`${logPrefix} Stage 5: Input listeners and observers set up.`);

      console.log(`${logPrefix} Stage 6: Initializing Multiplayer...`);
      try {
        multiplayerResources = await Multiplayer.initialize({ scene, canvasRef, characterComponents });
        console.log(`${logPrefix} Stage 6: Multiplayer initialized successfully.`);

        engine.runRenderLoop(() => { if (scene?.isReady() && !engine?.isDisposed) scene.render(); });
        resizeHandler = () => { if (engine && !engine.isDisposed) engine.resize(); };
        window.addEventListener("resize", resizeHandler);
        console.log(`${logPrefix} Stage 6: Render loop started.`);

        worldCleanup = () => {
             const finalCleanupPrefix = `${logPrefix} FinalCleanup [Multiplayer]:`;
             console.log(`${finalCleanupPrefix} Running...`);
             engine?.stopRenderLoop();
             if(resizeHandler) window.removeEventListener("resize", resizeHandler);
              try {
                  const currentCanvas = canvasRef?.current;
                  if (currentCanvas && currentCanvas._attachedWheelHandler) { currentCanvas.removeEventListener("wheel", currentCanvas._attachedWheelHandler); delete currentCanvas._attachedWheelHandler; }
                  if (currentCanvas && currentCanvas._attachedKeydownHandler) { currentCanvas.removeEventListener("keydown", currentCanvas._attachedKeydownHandler); delete currentCanvas._attachedKeydownHandler; }
              } catch (e) { console.warn(`${finalCleanupPrefix} Error removing canvas listeners:`, e); }
             if (sceneLoaderCleanupFn) { sceneLoaderCleanupFn(); sceneLoaderCleanupFn = null; }
             scene?.onDisposeObservable.remove(sceneDisposeObserver);
             scene?.onKeyboardObservable.remove(keyboardObserver);
             characterComponents?.cleanup();
             if (multiplayerResources && typeof multiplayerResources.cleanup === 'function') { multiplayerResources.cleanup(); } 
             if (engine && !engine.isDisposed) engine.dispose();
             engine = null; scene = null; multiplayerResources = null; resizeHandler = null; characterComponents = null; keyboardObserver = null; sceneDisposeObserver = null;
             console.log(`${finalCleanupPrefix} Finished.`);
        };
      } catch (multiplayerErr) {
        console.warn(`${logPrefix} Failed to initialize multiplayer: ${multiplayerErr.message}. Proceeding without multiplayer functionality.`);
        multiplayerResources = null;

        engine.runRenderLoop(() => { if (scene?.isReady() && !engine?.isDisposed) scene.render(); });
        resizeHandler = () => { if (engine && !engine.isDisposed) engine.resize(); };
        window.addEventListener("resize", resizeHandler);
        console.log(`${logPrefix} Stage 6: Render loop started (without multiplayer).`);

        worldCleanup = () => {
            const finalCleanupPrefix = `${logPrefix} FinalCleanup [No Multiplayer]:`;
             console.log(`${finalCleanupPrefix} Running...`);
             engine?.stopRenderLoop();
             if(resizeHandler) window.removeEventListener("resize", resizeHandler);
              try {
                  const currentCanvas = canvasRef?.current;
                  if (currentCanvas && currentCanvas._attachedWheelHandler) { currentCanvas.removeEventListener("wheel", currentCanvas._attachedWheelHandler); delete currentCanvas._attachedWheelHandler; }
                  if (currentCanvas && currentCanvas._attachedKeydownHandler) { currentCanvas.removeEventListener("keydown", currentCanvas._attachedKeydownHandler); delete currentCanvas._attachedKeydownHandler; }
              } catch (e) { console.warn(`${finalCleanupPrefix} Error removing canvas listeners:`, e); }
             if (sceneLoaderCleanupFn) { sceneLoaderCleanupFn(); sceneLoaderCleanupFn = null; }
             scene?.onDisposeObservable.remove(sceneDisposeObserver);
             scene?.onKeyboardObservable.remove(keyboardObserver);
             characterComponents?.cleanup();
             if (engine && !engine.is_disposed) engine.dispose();
             engine = null; scene = null; resizeHandler = null; characterComponents = null; keyboardObserver = null; sceneDisposeObserver = null;
             console.log(`${finalCleanupPrefix} Finished.`);
        };
      }
      
      console.log(`${logPrefix} All stages completed. Resolving WorldLogic.`);
      resolveWorldLogic({
        engine: engine,
        scene: scene,
        characterComponents: characterComponents,
        SpherePipSpawner: SpherePipSpawner,
        multiplayerResources: multiplayerResources,
        cleanup: worldCleanup
      });

    } catch (error) {
      console.error(`${logPrefix} Catastrophic failure at [${error.message?.split(' - ')[0] || 'Unknown Stage'}]. Error:`, error);
      worldCleanup(); 
      rejectWorldLogic(error);
    }
  });
}

return { WorldLogic };
```






# HavokPhysics

```jsx
const fileName = "_OPERATION/PRIVATE/DATACORE/22 World888/D.q.world888.component.md";

async function initializeHavokPhysics(scene) {
   return new Promise((resolve, reject) => {
    if (!window.BABYLON) { return reject(new Error("HavokPhysics: Babylon.js not available.")); }
    if (!window.HK) { return reject(new Error("HavokPhysics: Havok module (window.HK) not initialized.")); }
    if (!scene || scene.isDisposed) { return reject(new Error("HavokPhysics: Scene is invalid or disposed.")); }
    try {
        console.log("HavokPhysics: Enabling physics plugin for the scene...");
        if (scene.getPhysicsEngine() && !(scene.getPhysicsEngine().getPlugin() instanceof window.BABYLON.HavokPlugin)) {
            console.warn("HavokPhysics: Disabling existing physics engine before enabling Havok.");
            scene.disablePhysicsEngine();
        }
        if (!scene.isPhysicsEnabled() || !(scene.getPhysicsEngine()?.getPlugin() instanceof window.BABYLON.HavokPlugin)) {
            const gravity = new window.BABYLON.Vector3(0, -9.81, 0);
            const hkPlugin = new window.BABYLON.HavokPlugin(true, window.HK);
            scene.enablePhysics(gravity, hkPlugin);
            console.log("HavokPhysics: Havok physics enabled successfully.");
        } else {
            console.log("HavokPhysics: Havok physics already enabled on this scene.");
        }
        resolve();
    } catch (error) {
        console.error("HavokPhysics: Error enabling physics plugin:", error);
        reject(error);
    }
  });
}

function applyHavokPhysicsInternal(mesh, scene, shapeType = window.BABYLON.PhysicsShapeType.BOX, options = { mass: 0, restitution: 0.1, friction: 0.5 }) {
    // Pre-conditions checks
    if (!mesh || mesh.isDisposed()) { console.warn("ApplyPhysicsInternal: Null or disposed mesh."); return null; }
    if (!scene || scene.isDisposed || !scene.isPhysicsEnabled()) { console.warn(`ApplyPhysicsInternal: Scene invalid or physics not enabled for mesh ${mesh.name}.`); return null; }
    if (!window.BABYLON?.PhysicsAggregate) { console.error("ApplyPhysicsInternal: BABYLON.PhysicsAggregate not found."); return null; }

    if (mesh.physicsAggregate) { mesh.physicsAggregate.dispose(); }

    try {
        mesh.computeWorldMatrix(true);
        mesh.refreshBoundingInfo(true);

        // *** ADDED CLEAR LOGGING ON FAILURE ***
        console.log(`ApplyPhysicsInternal: Creating Aggregate for ${mesh.name}, Shape: ${Object.keys(window.BABYLON.PhysicsShapeType).find(key => window.BABYLON.PhysicsShapeType[key] === shapeType) || 'Unknown'}, Options:`, JSON.stringify(options));
        const aggregate = new window.BABYLON.PhysicsAggregate(mesh, shapeType, options, scene);

        // *** Check if aggregate was actually created ***
        if (!aggregate || !aggregate.body) { // Checking aggregate.body might be more reliable
             console.error(`ApplyPhysicsInternal: FAILED to create valid PhysicsAggregate body for ${mesh.name}. Shape type or mesh geometry might be invalid for Havok.`);
             if(aggregate?.dispose) aggregate.dispose(); // Dispose partial aggregate if possible
             mesh.physicsAggregate = null; // Ensure it's null
             return null; // Explicitly return null on failure
        }

        mesh.physicsAggregate = aggregate;
        console.log(`ApplyPhysicsInternal: PhysicsAggregate created successfully for ${mesh.name}.`);
        return aggregate; // Return the aggregate on success

    } catch (error) {
        console.error(`ApplyPhysicsInternal: EXCEPTION creating PhysicsAggregate for mesh ${mesh.name}:`, error);
        if (mesh.physicsAggregate) { mesh.physicsAggregate.dispose(); mesh.physicsAggregate = null; }
        return null; // Return null on exception
    }
}

function applyPhysicsToMesh({ mesh, scene, shapeType = "BOX", options = { mass: 0, restitution: 0.1, friction: 0.5 } }) {
    // ... (previous shapeTypeMap and checks) ...
    if (!window.BABYLON?.PhysicsShapeType) { console.error("ApplyPhysics: BABYLON.PhysicsShapeType not found."); return null; }
    const shapeTypeMap = { BOX: window.BABYLON.PhysicsShapeType.BOX, MESH: window.BABYLON.PhysicsShapeType.MESH, CAPSULE: window.BABYLON.PhysicsShapeType.CAPSULE, SPHERE: window.BABYLON.PhysicsShapeType.SPHERE, CYLINDER: window.BABYLON.PhysicsShapeType.CYLINDER, CONVEX_HULL: window.BABYLON.PhysicsShapeType.CONVEX_HULL };
    const selectedShapeType = shapeTypeMap[shapeType.toUpperCase()];
    if (selectedShapeType === undefined) { console.warn(`ApplyPhysics: Unknown shapeType "${shapeType}". Defaulting to BOX.`); return applyHavokPhysicsInternal(mesh, scene, window.BABYLON.PhysicsShapeType.BOX, options); }
    // Add specific checks for required options based on shapeType if needed

    return applyHavokPhysicsInternal(mesh, scene, selectedShapeType, options);
}

return { initializeHavokPhysics, applyPhysicsToMesh };
```


# SceneLoader

```jsx
const fileName = "_OPERATION/PRIVATE/DATACORE/22 World888/D.q.world888.component.md";

// --- Babylon Engine & Scene Initialization ---
function initBabylonEngineAndScene(canvasRef) {
    // Pre-conditions
    if (!window.BABYLON) { console.error("SceneLoader.init: FATAL - Babylon.js not loaded."); return null; }
    const canvas = canvasRef?.current; // Get canvas element early
    if (!canvas) { console.error("SceneLoader.init: Canvas reference missing or null."); return null; }

    const engine = new window.BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true
    });

    engine.uniqueId = engine.uniqueId || (Math.random() * 1000).toFixed(0);
    console.log(`SceneLoader.init: Engine created (ID: ${engine.uniqueId}).`);

    if (!engine._gl) {
        console.error(`SceneLoader.init: Engine (ID: ${engine.uniqueId}) creation failed (no WebGL context?). Disposing.`);
        engine.dispose();
        return null;
    }

    const contextLostHandler = (event) => {
        console.warn(`SceneLoader: WebGL context LOST for engine (ID: ${engine.uniqueId}).`);
        event.preventDefault();
        if (!engine.isDisposed) {
            engine._onContextLost(event);
        }
    };
    const contextRestoredHandler = () => {
        console.log(`SceneLoader: WebGL context RESTORED for engine (ID: ${engine.uniqueId}).`);
        if (!engine.isDisposed) {
            engine._onContextRestored();
        }
    };

    // Remove any previous event listeners to prevent duplicates
    canvas.removeEventListener("webglcontextlost", canvas._previousContextLostHandler || (() => {}));
    canvas.removeEventListener("webglcontextrestored", canvas._previousContextRestoredHandler || (() => {}));

    // Add the new listeners and store references for proper removal
    canvas.addEventListener("webglcontextlost", contextLostHandler, false);
    canvas.addEventListener("webglcontextrestored", contextRestoredHandler, false);

    canvas._previousContextLostHandler = contextLostHandler;
    canvas._previousContextRestoredHandler = contextRestoredHandler;

    console.log(`SceneLoader.init: Creating new BABYLON.Scene for engine (ID: ${engine.uniqueId})...`);
    const scene = new window.BABYLON.Scene(engine);
    scene.clearColor = new window.BABYLON.Color4(0.1, 0.1, 0.1, 1);
    scene.autoClear = true;
    scene.autoClearDepthAndStencil = true;
    console.log(`SceneLoader.init: Scene created for engine (ID: ${engine.uniqueId}).`);

    return { engine, scene, canvas };
}

/**
 * Loads GLB objects into the scene, returning both the root node and a list of valid meshes.
 * @param {BABYLON.Scene} scene The Babylon.js scene to load into.
 * @param {object} glbConfig Configuration for the GLB file.
 * @returns {Promise<{glbRootNode: BABYLON.Mesh | null, allImportedMeshes: BABYLON.Mesh[]}>}
 */
async function loadSceneObjects(scene, glbConfig) {
    // Pre-condition
    if (!window.BABYLON?.SceneLoader) { throw new Error("loadSceneObjects: Babylon.js SceneLoader not available."); }
    if (!scene || scene.isDisposed) { throw new Error(`loadSceneObjects: Scene is invalid or disposed.`); }

    const { url, path, file } = glbConfig;
    const allImportedMeshes = [];
    let glbRootNode = null;

    console.log(`SceneLoader.loadObjects: Attempting to load GLB: ${url}${path}${file} into scene associated with engine ID: ${scene.getEngine().uniqueId}`);
    try {
        const result = await window.BABYLON.SceneLoader.ImportMeshAsync("", url, file, scene);
        console.log(`SceneLoader.loadObjects: GLB loaded. Processing ${result.meshes.length} meshes/nodes...`);

        for (const mesh of result.meshes) {
            if (!mesh || mesh.isDisposed()) {
                console.log(`SceneLoader.loadObjects: Skipping null/disposed mesh.`);
                continue;
            };
            if (mesh.name === "__root__") {
                glbRootNode = mesh;
                console.log(`SceneLoader.loadObjects: Identified root mesh: ${mesh.name}`);
                if (mesh instanceof window.BABYLON.Mesh || mesh instanceof window.BABYLON.TransformNode) {
                    allImportedMeshes.push(mesh);
                }
                continue;
            }

            if (!(mesh instanceof window.BABYLON.Mesh)) {
                console.log(`SceneLoader.loadObjects: Skipping non-mesh node "${mesh.name}" for position/index validation (likely a TransformNode).`);
                allImportedMeshes.push(mesh);
                continue;
            }

            // --- Mesh Validation (only for actual BABYLON.Mesh instances) ---
            const hasPositions = mesh.getVerticesData(window.BABYLON.VertexBuffer.PositionKind);
            const hasIndices = mesh.getIndices();
            let isValid = true;
            if (!hasPositions || hasPositions.length === 0) {
                console.warn(`SceneLoader.loadObjects: Mesh ${mesh.name} has NO POSITION data. Disposing.`);
                mesh.dispose();
                isValid = false;
            }
            if (!hasIndices || hasIndices.length === 0) {
                console.warn(`SceneLoader.loadObjects: Mesh ${mesh.name} has NO INDEX data. This might be unexpected, but not necessarily invalid.`);
            }

            if (isValid) {
                mesh.isPickable = false;
                allImportedMeshes.push(mesh);
            }
        } // End for loop

    } catch (err) {
        console.error(`SceneLoader.loadObjects: Failed during GLB loading or mesh processing for scene (Engine ID: ${scene?.getEngine()?.uniqueId}):`, err);
        throw err;
    }

    return { glbRootNode, allImportedMeshes };
}

// --- Main sceneLoader Export ---
async function sceneLoader({ canvasRef, glbConfig = {
  url: "https://raw.githubusercontent.com/beto-group/beto.assets/main/",
  path: "",
  file: "scene888.glb"
} }) {
    let engine = null;
    let scene = null;
    let canvas = null;

    // Keep track of the observable to remove it on cleanup
    let onBeforeRenderObserver = null;

    try {
        console.log("--- sceneLoader function started ---");

        const engineAndScene = initBabylonEngineAndScene(canvasRef);
        if (!engineAndScene || !engineAndScene.engine || !engineAndScene.scene) {
            throw new Error("SceneLoader main: Failed to initialize Engine and Scene.");
        }
        engine = engineAndScene.engine;
        scene = engineAndScene.scene;
        canvas = engineAndScene.canvas;

        const camera = new window.BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 1000, window.BABYLON.Vector3.Zero(), scene);
        if (canvas) {
            camera.attachControl(canvas, true);
        } else {
            console.warn("Canvas not available, camera control not attached.");
        }
        camera.wheelPrecision = 50;
        console.log("Camera setup complete.");

        const light = new window.BABYLON.HemisphericLight("light", new window.BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        console.log("Light setup complete.");

        const { glbRootNode, allImportedMeshes } = await loadSceneObjects(scene, glbConfig);
        console.log(`After loadSceneObjects: glbRootNode found: ${!!glbRootNode}, total imported meshes/nodes: ${allImportedMeshes.length}`);

        if (glbRootNode) {
            glbRootNode.rotation = window.BABYLON.Vector3.Zero();
            glbRootNode.position = window.BABYLON.Vector3.Zero();
            glbRootNode.scaling = new window.BABYLON.Vector3(44, 44, 44);
            camera.target = glbRootNode.absolutePosition;
            console.log(`GLB Root Node ("${glbRootNode.name}") set to be static at origin and scaled by 44x. Camera target set.`);
        } else {
            console.warn("No __root__ node found in GLB. Camera target defaulted to Zero.");
            camera.target = window.BABYLON.Vector3.Zero();
        }

        const rotatingNodesWithSpeeds = [];

        let obeliskMesh = null;
        let obeliskOriginalY = 0;
        let hoverTime = 0;
        const hoverAmplitude = 5;
        const hoverFrequency = 1.5;

        const minSpeed = 0.001;
        const maxSpeed = 0.01;

        console.log(`--- Starting mesh selection for rotation and TransformNode creation ---`);
        let meshesFoundForRotation = 0;

        allImportedMeshes.forEach((mesh) => {
            if (mesh instanceof window.BABYLON.Mesh && mesh.name !== "__root__" && glbRootNode) {
                console.log(`    -> Processing mesh "${mesh.name}" for orbital rotation.`);

                const rotator = new window.BABYLON.TransformNode(`rotator_${mesh.name}`, scene);
                rotator.position = window.BABYLON.Vector3.Zero();
                rotator.rotation = window.BABYLON.Vector3.Zero();
                rotator.parent = glbRootNode; // Parent to the main scaled root node

                // Reparent the actual mesh to this new rotator node.
                // setParent will attempt to maintain the mesh's world position.
                mesh.setParent(rotator);
                console.log(`    -> Reparented mesh "${mesh.name}" to new rotator "${rotator.name}".`);

                const randomSpeed = minSpeed + (Math.random() * (maxSpeed - minSpeed));
                rotatingNodesWithSpeeds.push({ node: rotator, speed: randomSpeed });
                console.log(`    -> Added "${rotator.name}" to rotation list with speed: ${randomSpeed.toFixed(4)}`);
                meshesFoundForRotation++;

                if (mesh.name === "obelisk") {
                    obeliskMesh = mesh;
                    obeliskOriginalY = mesh.position.y;
                    console.log(`    -> Identified "obelisk" mesh for hovering. Original LOCAL Y (relative to rotator): ${obeliskOriginalY.toFixed(4)}`);
                }
            } else {
                const parentName = mesh.parent ? mesh.parent.name : "none";
                console.log(`    -> SKIPPING "${mesh.name}" for rotation. (Is BABYLON.Mesh: ${mesh instanceof window.BABYLON.Mesh}. Is Root Node: ${mesh.name === "__root__"}. Parent: ${parentName}).`);
            }
        });

        console.log(`--- Finished mesh selection. Found ${meshesFoundForRotation} meshes and created ${rotatingNodesWithSpeeds.length} dedicated rotators. ---`);
        if (meshesFoundForRotation === 0) {
            console.warn("No meshes found for rotation! The GLB structure might be different than expected, or meshes are not actual BABYLON.Mesh instances or not properly linked.");
            console.warn("Consider inspecting your GLB file's hierarchy using a tool like https://gltf.report/ or https://sandbox.babylonjs.com/ to understand its structure.");
        }

        // Attach the animation logic to the scene's onBeforeRenderObservable.
        // This observable will fire as long as the engine's render loop (managed by WorldLogic) is running.
        onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            // Optional: Log every 60 frames to confirm render loop is active
            // if (frameCounter % 60 === 0) {
            //     console.log(`Scene.onBeforeRenderObservable active. Rotating ${rotatingNodesWithSpeeds.length} nodes.`);
            // }
            // frameCounter++; // Uncomment if you uncomment the above debug log

            // --- Orbital Rotation Effect ---
            if (rotatingNodesWithSpeeds.length > 0) {
                rotatingNodesWithSpeeds.forEach((item) => {
                    item.node.rotate(window.BABYLON.Axis.Y, item.speed, window.BABYLON.Space.LOCAL);
                });
            }

            // --- Hovering effect for the 'obelisk' mesh ---
            if (obeliskMesh) {
                const deltaTime = engine.getDeltaTime() / 1000;
                hoverTime += deltaTime * hoverFrequency;
                const yOffset = hoverAmplitude * Math.sin(hoverTime);
                obeliskMesh.position.y = obeliskOriginalY + yOffset;
            }
        });

        console.log("--- sceneLoader function completed. Animation logic set up. ---");

        return {
            engine: engine,
            scene: scene,
            environmentMeshes: allImportedMeshes,
            glbRootNode: glbRootNode,
            cleanup: () => {
                console.log("--- Initiating SceneLoader cleanup ---");
                // Remove the onBeforeRenderObservable observer
                if (onBeforeRenderObserver) {
                    scene?.onBeforeRenderObservable.remove(onBeforeRenderObserver);
                    onBeforeRenderObserver = null;
                    console.log("Removed onBeforeRenderObservable observer.");
                }

                // Dispose the scene and engine if they exist and are not already disposed.
                // WorldLogic's cleanup function will also attempt this, but it's good to be safe.
                if (scene && !scene.isDisposed) {
                    scene.dispose();
                    console.log("Scene disposed by SceneLoader cleanup.");
                }
                if (engine && !engine.isDisposed) {
                    // Important: Do NOT stop render loop or remove resize listener here,
                    // as WorldLogic manages that. Just dispose the engine.
                    engine.dispose();
                    console.log(`Engine (ID: ${engine.uniqueId}) disposed by SceneLoader cleanup.`);
                } else {
                    console.log("Engine already disposed or not initialized during SceneLoader cleanup.");
                }
                // Nullify references that are local to sceneLoader
                engine = null;
                scene = null;
                console.log("--- SceneLoader cleanup complete ---");
            }
        };
    } catch (err) {
        console.error("--- sceneLoader encountered a fatal error ---", err);
        // Ensure observers are cleaned up even on error
        if (onBeforeRenderObserver) {
            scene?.onBeforeRenderObservable.remove(onBeforeRenderObserver);
            onBeforeRenderObserver = null;
        }

        // Dispose scene and engine on error
        if (scene && !scene.isDisposed) {
            scene.dispose();
        }
        if (engine && !engine.isDisposed) {
            engine.dispose();
        }
        engine = null;
        scene = null;
        throw err; // Re-throw the error to indicate failure
    }
}

// Export the sceneLoader function
return { sceneLoader };
```



# CharacterConstants 

```jsx
// In CharacterConstants.js (or wherever createConstants is defined)

function createConstants(normalCharacterHeight, crouchCharacterHeight, characterRadius) {
    const runSpeedBase = 7.7;

    const constants = {
        // --- Existing Movement & Jump ---
        walkSpeed: 4.4,
        runSpeed: runSpeedBase,
        crouchSpeed: 2.2,
        inAirSpeed: 3.8,
        jumpHeight: 1.5,
        sprintJumpHeight: 2.2,

        // --- Sliding General ---
        slideInitialBoost: 1.44, // Multiplier for sprint/static slides ONLY
        slideFriction: 0.97,     // Friction factor per 1/60th sec (closer to 1 = less friction)
        slideMinSpeed: 1.5,      // Speed below which sliding stops
        slideJumpForwardBoostFactor: 1.77, // Multiplier applied to *runSpeed* for forward boost on slide jump
        staticSlideVelocityThreshold: 0.1, // Max speed to initiate slide from static crouch + move
        // (Optional - Add if you want input control during slide)
        // slideControlFactor: 25.0, // How much WASD influences slide direction (higher = more control)

        // --- Landing/Falling -> Slide ---
        minFallDistanceForBoost: 0.5,          // Min fall height for speed *boost* above runSpeed on landing slide.
        minFallDistanceForLandingSlide: 0.3,   // Min fall height to trigger *any* landing slide (if crouched).
        fallDistanceToSpeedScale: 2.5,         // How much sqrt(fall distance) scales added speed boost.
        maxSlideSpeedFromFall: runSpeedBase * 1.8, // Max speed achievable purely from fall boost blend.

        // --- Sliding Slope Physics (ADDED) ---
        slopeSlideAccelerationScale: 15.0, // How strongly gravity influences slide speed on slopes.
        maxSlopeSlideSpeed: runSpeedBase * 2.2, // Absolute maximum speed achievable while sliding downhill (relative to run speed).
        minSlopeAngleForAccel: 2.0,       // Minimum slope angle (degrees) to trigger acceleration. 0 means any slope helps.

        // --- Core & Camera ---
        characterGravity: new window.BABYLON.Vector3(0, -18, 0),
        turnSpeed: 0.15,
        normalCameraOffsetY: normalCharacterHeight * 0.4,
        crouchCameraOffsetY: crouchCharacterHeight * 0.4,

        // --- Internal / Debug ---
        forwardLocalSpace: new window.BABYLON.Vector3(0, 0, 1),
        maxDotProductForSlopeAccel: 1.0, // Default, calculated below (ADDED)
        DEBUG_JUMP: true,
        DEBUG_SPRINT: true,
        DEBUG_CROUCH: true,
        DEBUG_SLIDE: true,
    };

    // --- Calculate Derived Constants (ADDED/MODIFIED) ---
    if (constants.minSlopeAngleForAccel > 0) {
        constants.maxDotProductForSlopeAccel = Math.cos(constants.minSlopeAngleForAccel * (Math.PI / 180.0));
    } else {
        // Use a value slightly less than 1 for numerical stability if min angle is 0
        constants.maxDotProductForSlopeAccel = 0.9999;
    }
    // Safety fallback
    constants.maxDotProductForSlopeAccel = constants.maxDotProductForSlopeAccel ?? 1.0;

    return constants;
}

return { createConstants };
```

# CharacterLogic

```jsx
const fileName = "_OPERATION/PRIVATE/DATACORE/22 World888/D.q.world888.component.md";
const { CameraLogic } = await dc.require(dc.headerLink(fileName, "CameraLogic"));
const { createConstants } = await dc.require(dc.headerLink(fileName, "CharacterConstants"));
const { _calculateDesiredVelocity } = await dc.require(dc.headerLink(fileName, "CharacterVelocity"));

// --- Input Modules ---

function setupBasicMovementInput(stateVariables, logDebug) {
    logDebug("[InputMod:Move]", "Init");
    const keys = { w: [0,0,1], arrowup: [0,0,1], s: [0,0,-1], arrowdown: [0,0,-1], a: [-1,0,0], arrowleft: [-1,0,0], d: [1,0,0], arrowright: [1,0,0] };
    function getLocalDirectionForKey(key) { const dir = keys[key]; return dir ? new window.BABYLON.Vector3(...dir) : null; }
    function updateSlideIntentIfNeeded(source) {
        const isAirborne = stateVariables.state === "IN_AIR" || stateVariables.state === "START_JUMP";
        const mightSlide = stateVariables.wantSlideOnLand || (isAirborne && stateVariables.isCrouching);
        if (isAirborne && mightSlide) {
            if (stateVariables.inputDirection.lengthSquared() > 0.01) {
                const previousIntentStr = stateVariables.slideDirectionIntentLocal.toString();
                stateVariables.slideDirectionIntentLocal.copyFrom(stateVariables.inputDirection).normalize();
                if(previousIntentStr !== stateVariables.slideDirectionIntentLocal.toString()) logDebug("[CharSlide]", `(${source}) Updated mid-air slide intent: ${stateVariables.slideDirectionIntentLocal.toString()}`);
            } else if (stateVariables.slideDirectionIntentLocal.lengthSquared() > 0) {
                stateVariables.slideDirectionIntentLocal.set(0, 0, 0);
                logDebug("[CharSlide]", `(${source}) Cleared mid-air slide intent (no WASD held).`);
            }
        }
    }
    function handleKeyDown(key) {
        const localDir = getLocalDirectionForKey(key); if (!localDir) return false;
        switch (key) { case 'w': case 'arrowup': stateVariables.inputDirection.z = 1; break; case 's': case 'arrowdown': stateVariables.inputDirection.z = -1; break; case 'a': case 'arrowleft': stateVariables.inputDirection.x = -1; break; case 'd': case 'arrowright': stateVariables.inputDirection.x = 1; break; }
        logDebug("[InputMod:Move]", `Down: ${key}. Dir: ${stateVariables.inputDirection.toString()}`);
        updateSlideIntentIfNeeded(`KeyDown:${key}`);
        return true;
    }
    function handleKeyUp(key) {
        const dir = keys[key]; if (!dir) return false;
        switch (key) { case 'w': case 'arrowup': if (stateVariables.inputDirection.z === 1) stateVariables.inputDirection.z = 0; break; case 's': case 'arrowdown': if (stateVariables.inputDirection.z === -1) stateVariables.inputDirection.z = 0; break; case 'a': case 'arrowleft': if (stateVariables.inputDirection.x === -1) stateVariables.inputDirection.x = 0; break; case 'd': case 'arrowright': if (stateVariables.inputDirection.x === 1) stateVariables.inputDirection.x = 0; break; }
        logDebug("[InputMod:Move]", `Up: ${key}. Dir: ${stateVariables.inputDirection.toString()}`);
        updateSlideIntentIfNeeded(`KeyUp:${key}`);
        return true;
    }
    function resetInput() {
        if (stateVariables.inputDirection.x !== 0 || stateVariables.inputDirection.z !== 0) { logDebug("[InputMod:Move]", "Resetting input dir."); stateVariables.inputDirection.set(0, 0, 0); }
        if (stateVariables.slideDirectionIntentLocal.lengthSquared() > 0) { logDebug("[InputMod:Move]", "Resetting slide intent."); stateVariables.slideDirectionIntentLocal.set(0, 0, 0); }
    }
    return { handleKeyDown, handleKeyUp, resetInput };
}

function setupJumpInput(stateVariables, attemptJumpTrigger, logDebug) {
    logDebug("[InputMod:Jump]", "Init"); const isMac = navigator.platform.toUpperCase().includes('MAC');
    function handleKeyDown(key) { if (key === ' ' || key === 'j') { logDebug("[CharJump]", `${key === ' ' ? 'Space' : 'J'} pressed. Held(Before): ${stateVariables.isJumpKeyHeld}`); attemptJumpTrigger(key === ' ' ? 'SpaceKey' : 'JKey'); stateVariables.isJumpKeyHeld = true; return true; } return false; }
    function handleKeyUp(key) { if (key === ' ' || key === 'j') { logDebug("[CharJump]", `${key === ' ' ? 'Space' : 'J'} released. Held=false`); stateVariables.isJumpKeyHeld = false; return true; } return false; }
    function handlePointerEvent(pointerInfo) { if (pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERWHEEL) { const event = pointerInfo.event; const scrollDown = isMac ? (event.deltaY < 0) : (event.deltaY > 0); if (scrollDown) { logDebug("[CharInput]", `Scroll Down Detected.`); event.preventDefault(); const canJump = (stateVariables.state === "ON_GROUND" || stateVariables.state === "SLIDING" || stateVariables.justLanded); if (canJump && !stateVariables.wantJump) { logDebug("[CharInput]", `>> Triggering jump via scroll.`); attemptJumpTrigger(`MouseScrollDown`); } else { logDebug("[CharInput]", `>> Scroll jump ignored.`); } return true; } } return false; }
    function resetInput() { if (stateVariables.wantJump || stateVariables.isJumpKeyHeld) { logDebug("[InputMod:Jump]", "Resetting jump state."); stateVariables.wantJump = false; stateVariables.isJumpKeyHeld = false; } }
    return { handleKeyDown, handleKeyUp, handlePointerEvent, resetInput };
}

function setupSprintInput(stateVariables, logDebug) {
    logDebug("[InputMod:Sprint]", "Init");
    function handleKeyDown(key) { if (key === 'shift') { if (!stateVariables.isShiftPressed) logDebug("[CharSprint]", `Shift pressed.`); stateVariables.isShiftPressed = true; return true; } return false; }
    function handleKeyUp(key) { if (key === 'shift') { if (stateVariables.isShiftPressed) logDebug("[CharSprint]", `Shift released.`); stateVariables.isShiftPressed = false; return true; } return false; }
    function resetInput() { if (stateVariables.isShiftPressed) { logDebug("[InputMod:Sprint]", "Resetting sprint key."); stateVariables.isShiftPressed = false; } stateVariables.isSprinting = false; }
    return { handleKeyDown, handleKeyUp, resetInput };
}

function setupCrouchSlideInput(stateVariables, characterController, constants, updateVisualState, logDebug) {
    logDebug("[InputMod:CrouchSlide]", "Init");
    const isCrouchKey = (key) => key === 'c' || key === 'control';
    function handleKeyDown(key) {
        const isMovementKey = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);
        const crouchKey = isCrouchKey(key);

        if (isMovementKey && stateVariables.state === "ON_GROUND" && stateVariables.isCrouching && characterController.getVelocity().lengthSquared() < constants.staticSlideVelocityThreshold) {
            const canSprintSlide = (stateVariables.isSprinting || (stateVariables.isShiftPressed && stateVariables.inputDirection.z > 0)) && stateVariables.inputDirection.lengthSquared() > 0.1;
            if (!canSprintSlide) {
                 logDebug("[CharSlide]", `Static crouch + move key '${key}' -> slide.`); stateVariables.state = "SLIDING"; stateVariables.isSprinting = false;
                 const m = new window.BABYLON.Matrix(); stateVariables.characterTargetOrientation.toRotationMatrix(m);
                 const slideDirWorld = window.BABYLON.Vector3.TransformCoordinates(stateVariables.inputDirection.normalizeToNew(), m);
                 stateVariables.slideVelocity.copyFrom(slideDirWorld.scale(constants.runSpeed * constants.slideInitialBoost));
                 logDebug("[CharSlide]", ` >> Static slide boost velocity set in input handler: ${stateVariables.slideVelocity.toString()}`);
                 updateVisualState(); return true;
            }
        }

        if (!crouchKey) return false;
        const isToggleKey = (key === 'c');
        logDebug("[CharCrouch/Slide]", `${key} pressed. State: ${stateVariables.state}, WantSlide: ${stateVariables.wantSlideOnLand}`);
        if (!isToggleKey) stateVariables.isSlidingKeyDown = true;

        const canSprintSlide = stateVariables.state === "ON_GROUND" && (stateVariables.isSprinting || (stateVariables.isShiftPressed && stateVariables.inputDirection.z > 0)) && stateVariables.inputDirection.lengthSquared() > 0.1;
        if (canSprintSlide) {
            logDebug("[CharSlide]", `Sprint-Slide initiated by '${key}'.`); stateVariables.state = "SLIDING"; stateVariables.isCrouching = true; stateVariables.isSprinting = false;
            stateVariables.slideVelocity.copyFrom(characterController.getVelocity());
            const m = new window.BABYLON.Matrix(); stateVariables.characterTargetOrientation.toRotationMatrix(m);
            const fwdWorld = window.BABYLON.Vector3.TransformCoordinates(constants.forwardLocalSpace, m);
            stateVariables.slideVelocity.addInPlace(fwdWorld.scale(constants.runSpeed * (constants.slideInitialBoost - 1.0)));
            logDebug("[CharSlide]", ` >> Sprint slide boost velocity set in input handler: ${stateVariables.slideVelocity.toString()}`);
            updateVisualState();
        } else if (stateVariables.state === "IN_AIR" || stateVariables.state === "START_JUMP") {
            logDebug("[CharCrouch/Slide]", `Key '${key}' mid-air -> wantSlideOnLand=true.`); stateVariables.wantSlideOnLand = true;
            if (stateVariables.inputDirection.lengthSquared() > 0.01) {
                stateVariables.slideDirectionIntentLocal.copyFrom(stateVariables.inputDirection).normalize();
                logDebug("[CharSlide]", `Captured mid-air slide intent (from crouch press: ${key}): ${stateVariables.slideDirectionIntentLocal.toString()}`);
            } else if (stateVariables.slideDirectionIntentLocal.lengthSquared() < 0.01) {
                 logDebug("[CharSlide]", `No WASD held on mid-air crouch press (${key}). Slide intent remains zero.`);
                 stateVariables.slideDirectionIntentLocal.set(0,0,0); // Ensure it's zero if no input
            }
            if (!stateVariables.isCrouching) { stateVariables.isCrouching = true; logDebug("[CharCrouch]", `Visually crouching mid-air.`); updateVisualState(); }
        } else if (stateVariables.state === "ON_GROUND") {
            if (isToggleKey) {
                if (!stateVariables.isCrouching) { stateVariables.isCrouching = true; logDebug("[CharCrouch]", `Toggle Crouch ON ('c').`); updateVisualState(); }
                else if (!stateVariables.pressedKeys.has('control')) { stateVariables.isCrouching = false; logDebug("[CharCrouch]", `Toggle Crouch OFF ('c').`); updateVisualState(); }
            } else {
                 if (!stateVariables.isCrouching) { stateVariables.isCrouching = true; logDebug("[CharCrouch]", `Holding Control.`); updateVisualState(); }
            }
        }
        return true;
    }
    function handleKeyUp(key) {
        if (!isCrouchKey(key)) return false;
        const isToggleKey = (key === 'c');
        const isAirborneBeforeStandCheck = stateVariables.state === "IN_AIR" || stateVariables.state === "START_JUMP";
        let stoodUpMidAir = false;

        if (isToggleKey) {
            logDebug("[CharCrouch]", "'c' released.");
            if (stateVariables.isCrouching && !stateVariables.isSlidingKeyDown && (stateVariables.state === "ON_GROUND" || isAirborneBeforeStandCheck)) {
                logDebug("[CharCrouch]", "Released 'c', attempting to stand."); stateVariables.isCrouching = false;
                if(isAirborneBeforeStandCheck) {
                     logDebug("[CharSlide]", "Standing mid-air via 'c' release, cancelling slide intent.");
                     stateVariables.wantSlideOnLand = false; stateVariables.slideDirectionIntentLocal.set(0,0,0); stoodUpMidAir = true;
                }
                updateVisualState();
            }
        } else {
            logDebug("[CharCrouch/Slide]", `Control released.`); stateVariables.isSlidingKeyDown = false;
            if (stateVariables.isCrouching && !stateVariables.pressedKeys.has('c') && (stateVariables.state === "ON_GROUND" || isAirborneBeforeStandCheck)) {
                 logDebug("[CharCrouch]", `Released Control, attempting to stand.`); stateVariables.isCrouching = false;
                 if(isAirborneBeforeStandCheck) {
                     logDebug("[CharSlide]", "Standing mid-air via Ctrl release, cancelling slide intent.");
                     stateVariables.wantSlideOnLand = false; stateVariables.slideDirectionIntentLocal.set(0,0,0); stoodUpMidAir = true;
                 }
                 updateVisualState();
            }
        }
        // Note: slideDirectionIntentLocal is updated by the basic movement handlers if still airborne+crouching/wanting slide
        return true;
    }
    function resetInput(keysBeforeClear = []) {
        logDebug("[InputMod:CrouchSlide]", "Resetting state.");
        stateVariables.wantSlideOnLand = false; stateVariables.justLandedIntoSlide = false; stateVariables.isSlidingKeyDown = false;
        if (stateVariables.slideDirectionIntentLocal.lengthSquared() > 0) {
             logDebug("[InputMod:CrouchSlide]", "Resetting slide intent."); stateVariables.slideDirectionIntentLocal.set(0, 0, 0);
        }
        if (stateVariables.state === "SLIDING") {
            stateVariables.state = "ON_GROUND"; stateVariables.slideVelocity.set(0, 0, 0);
            stateVariables.isCrouching = keysBeforeClear.includes('c') || keysBeforeClear.includes('control'); // Stay crouched if either was held
            updateVisualState();
        } else if (stateVariables.isCrouching) {
             // Stand up only if crouch was *only* initiated by the key released by the reset (e.g. tab)
             // and not maintained by another crouch key ('c' or 'control') that might still be conceptually held.
             // This logic gets complex with toggle ('c') vs hold ('control').
             // Simplification: If reset happens while crouching, check if 'c' or 'control' were held BEFORE reset.
             // If NEITHER were held before reset (unlikely but possible), stand up. More likely, we check if ONLY 'control' was held and reset clears it.
             const cHeldBefore = keysBeforeClear.includes('c');
             const ctrlHeldBefore = keysBeforeClear.includes('control');
             if (ctrlHeldBefore && !cHeldBefore) { // If only control was held, stand up on reset
                 stateVariables.isCrouching = false; updateVisualState();
                 logDebug("[InputMod:CrouchSlide]", "Standing up on reset (was holding only Ctrl).");
             } else {
                 logDebug("[InputMod:CrouchSlide]", `Staying crouched on reset (CtrlHeld:${ctrlHeldBefore}, CHeld:${cHeldBefore})`);
             }
        }
    }
    return { handleKeyDown, handleKeyUp, resetInput };
}


// --- Character Logic IIFE ---

const CharacterLogic = (() => {
    function setupInputHandling(scene, canvasRef, cameraControlsManager, stateVariables, characterController, constants, attemptJumpTrigger, updateVisualState, logDebug) {
        logDebug("[CharLogic:Input]", "Setup...");
        const movementInput = setupBasicMovementInput(stateVariables, logDebug);
        const jumpInput = setupJumpInput(stateVariables, attemptJumpTrigger, logDebug);
        const sprintInput = setupSprintInput(stateVariables, logDebug);
        const crouchSlideInput = setupCrouchSlideInput(stateVariables, characterController, constants, updateVisualState, logDebug);
        const inputModules = [movementInput, jumpInput, sprintInput, crouchSlideInput];

        function processKey(key, isDown) {
             if (!cameraControlsManager?.isPointerLocked()) return;
             const action = isDown ? 'Pressed' : 'Released';
             const changed = isDown ? !stateVariables.pressedKeys.has(key) : stateVariables.pressedKeys.delete(key);
             if (isDown && changed) stateVariables.pressedKeys.add(key);
             if (changed) logDebug("[KeyPress]", `${action}: ${key}. Held: ${Array.from(stateVariables.pressedKeys).join(',')}`);

             for (const module of inputModules) {
                 if (isDown ? module.handleKeyDown(key) : module.handleKeyUp(key)) return;
             }
        }

        function keyboardInputCallback(kbInfo) {
            const event = kbInfo.event; const key = event.key.toLowerCase();
            const actionKeys = ['w','s','a','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift','j','c','control','tab'];

            if (kbInfo.type === window.BABYLON.KeyboardEventTypes.KEYDOWN && key === 'tab') {
                logDebug("[CharInput]", 'Tab pressed. Toggling camera/resetting input.'); event.preventDefault();
                cameraControlsManager?.toggleCameraMode?.();
                const keysBeforeClear = Array.from(stateVariables.pressedKeys);
                stateVariables.pressedKeys.clear(); logDebug("[KeyPress]", `Keys cleared via tab. Were: ${keysBeforeClear.join(',')}`);
                inputModules.forEach(m => m.resetInput(keysBeforeClear));
                return;
            }

            if (actionKeys.includes(key) && key !== 'tab' && cameraControlsManager?.isPointerLocked()) {
                 event.preventDefault();
                 processKey(key, kbInfo.type === window.BABYLON.KeyboardEventTypes.KEYDOWN);
            }
        }
        function pointerInputCallback(pointerInfo) { if (cameraControlsManager?.isPointerLocked()) jumpInput.handlePointerEvent(pointerInfo); }

        logDebug("[CharLogic:Input]", "Registering observers...");
        const keyboardObserver = scene.onKeyboardObservable.add(keyboardInputCallback);
        const pointerObserver = scene.onPointerObservable.add(pointerInputCallback);
        if (canvasRef.current) canvasRef.current.tabIndex = 0;

        return { cleanup: () => { logDebug("[CharLogic:Input]", "Cleanup."); scene?.onKeyboardObservable.remove(keyboardObserver); scene?.onPointerObservable.remove(pointerObserver); } };
    }

    function setupEnvironment(scene, canvasRef) {
        //console.log("[CharacterLogic:Env]", "Setup...");
        const light = new window.BABYLON.HemisphericLight("light", new window.BABYLON.Vector3(0, 1, 0), scene); light.intensity = 0.8;
        const normalCharacterHeight = 1.8, characterRadius = 0.5, crouchCharacterHeight = normalCharacterHeight / 2;
        const charStartPos = new window.BABYLON.Vector3(-4.0, 33.0, -16.0);

        const displayCapsule = window.BABYLON.MeshBuilder.CreateCapsule("CharacterDisplay", { height: normalCharacterHeight, radius: characterRadius, subdivisions: 4, updatable: true }, scene);
        displayCapsule.position.copyFrom(charStartPos); displayCapsule.rotationQuaternion = window.BABYLON.Quaternion.Identity();
        displayCapsule.checkCollisions = false; displayCapsule.isPickable = false; displayCapsule.metadata = { baseHeight: normalCharacterHeight };

        const characterController = new window.BABYLON.PhysicsCharacterController(charStartPos, { capsuleHeight: normalCharacterHeight, capsuleRadius: characterRadius }, scene);
        //console.log("[CharacterLogic:Env]", "Setup complete.");
        return { light, displayCapsule, characterController, charStartPos, normalCharacterHeight, crouchCharacterHeight, characterRadius };
    }


    function setupMovementAndPhysicsUpdates(scene, camera, displayCapsule, characterController, cameraControlsManager, canvasRef, constants) {
        
        const ENABLE_ALL_DEBUG_LOGS = false; // Set to 'true' to enable logs, 'false' to disable all logDebug output

        
        function logDebug(prefix, message) {
            if (ENABLE_ALL_DEBUG_LOGS) { // If the master switch is off, return immediately
                const debugFlags = { "[CharJump]": constants.DEBUG_JUMP, "[CharSprint]": constants.DEBUG_SPRINT, "[CharCrouch]": constants.DEBUG_CROUCH, "[CharSlide]": constants.DEBUG_SLIDE };
                const shouldLog = debugFlags[prefix] || (prefix === "[CharJump/Slide]" && (constants.DEBUG_JUMP || constants.DEBUG_SLIDE)) || prefix.startsWith("[InputMod:") || prefix.startsWith("[CharLogic:") || prefix.startsWith("[CharState]") || prefix.startsWith("[KeyPress]") || prefix.startsWith("[CharLandCheck]");
                if (shouldLog) console.log(`${prefix} ${message}`);
            }
        }

        logDebug("[CharLogic:Movement]", "Setup...");
        const normalCharacterHeight = displayCapsule.metadata.baseHeight;
        const crouchCharacterHeight = normalCharacterHeight / 2;

        const stateVariables = {
            state: "IN_AIR", wantJump: false, isJumpKeyHeld: false, justLanded: false,
            isSprinting: false, isShiftPressed: false, isCrouching: false, isSlidingKeyDown: false,
            jumpedFromSlide: false,
            inputDirection: new window.BABYLON.Vector3(0, 0, 0),
            characterTargetOrientation: window.BABYLON.Quaternion.Identity(),
            slideVelocity: new window.BABYLON.Vector3(0, 0, 0), pressedKeys: new Set(),
            wantSlideOnLand: false, justLandedIntoSlide: false, slideDirectionIntentLocal: new window.BABYLON.Vector3(0, 0, 0),
            fallStartY: null, lastGroundY: null,
        };

        function updateVisualState() {
            const targetVisualHeight = stateVariables.isCrouching ? crouchCharacterHeight : normalCharacterHeight;
            const baseMeshHeight = displayCapsule.metadata.baseHeight || normalCharacterHeight;
            const targetScaleY = baseMeshHeight > 0.01 ? targetVisualHeight / baseMeshHeight : 1.0;
            if (Math.abs(displayCapsule.scaling.y - targetScaleY) > 0.01) {
                logDebug("[CharCrouch/Slide]", `Update visual scale. Crouch: ${stateVariables.isCrouching}, State: ${stateVariables.state}, TargetScaleY: ${targetScaleY.toFixed(2)}`);
                displayCapsule.scaling.y = targetScaleY;
            }
            const targetCameraOffset = stateVariables.isCrouching ? constants.crouchCameraOffsetY : constants.normalCameraOffsetY;
            cameraControlsManager?.setTargetOffsetY?.(targetCameraOffset);
        }

        function attemptJumpTrigger(triggerSource) {
            logDebug("[CharJump]", `Attempt via ${triggerSource}. State=${stateVariables.state}, Landed=${stateVariables.justLanded}, Crouch=${stateVariables.isCrouching}`);
            if (stateVariables.state === "ON_GROUND" || stateVariables.state === "SLIDING" || stateVariables.justLanded) {
                stateVariables.wantJump = true; logDebug("[CharJump]", `  >> Set wantJump = true`);
                const canSprintJump = stateVariables.isShiftPressed && stateVariables.inputDirection.z > 0 && !stateVariables.isCrouching && stateVariables.state !== "SLIDING";
                stateVariables.isSprinting = canSprintJump;
                logDebug("[CharJump]", `  >> Set isSprinting=${stateVariables.isSprinting} for jump.`);
            } else { logDebug("[CharJump]", `  >> Not setting wantJump.`); }
        }

        function getNextState(supportInfo) {
            const isOnGroundOrJustLanded = supportInfo.supportedState === window.BABYLON.CharacterSupportedState.SUPPORTED;
            const previousState = stateVariables.state;
            let nextState = previousState;

            const transitionToAirborne = (reason) => {
                if (previousState !== "IN_AIR") logDebug("[CharState]", `Transition ${previousState} -> IN_AIR (${reason}).`);
                nextState = "IN_AIR";
                if (previousState !== "IN_AIR" && stateVariables.lastGroundY !== null) { stateVariables.fallStartY = stateVariables.lastGroundY; if (previousState !== "START_JUMP") logDebug("[CharState]", `  Set fallStartY=${stateVariables.fallStartY.toFixed(2)} (from lastGroundY)`);
                } else if (stateVariables.fallStartY === null) { stateVariables.fallStartY = characterController.getPosition().y; logDebug("[CharState]", `  Set fallStartY=${stateVariables.fallStartY.toFixed(2)} (current pos)`); }
                if (reason === 'FellOffEdge' && !stateVariables.wantSlideOnLand && !stateVariables.isCrouching) { // Clear intent only if not actively holding crouch mid-air
                     if (stateVariables.slideDirectionIntentLocal.lengthSquared() > 0) { stateVariables.slideDirectionIntentLocal.set(0, 0, 0); logDebug("[CharSlide]", "  Reset slide direction intent (fell off edge without crouch held)."); }
                }
            };

            switch (previousState) {
                case "IN_AIR":
                    if (isOnGroundOrJustLanded) {
                        stateVariables.justLanded = true; stateVariables.isSprinting = false;
                        const landingY = characterController.getPosition().y;
                        const fallDistance = stateVariables.fallStartY !== null ? Math.max(0, stateVariables.fallStartY - landingY) : 0;
                        const isHoldingCrouchKey = stateVariables.pressedKeys.has('c') || stateVariables.isSlidingKeyDown;
                        const hasDirectionIntent = stateVariables.slideDirectionIntentLocal.lengthSquared() > 0.01;
                        const wantsSlideIntentFlag = stateVariables.wantSlideOnLand;
                        const wasJumpFromSlide = stateVariables.jumpedFromSlide;

                        logDebug("[CharLandCheck]", `Landing. FallDist: ${fallDistance.toFixed(3)}, CrouchHeld: ${isHoldingCrouchKey}, HasDirIntent: ${hasDirectionIntent}, WantsSlideFlag: ${wantsSlideIntentFlag}, JumpedFromSlide: ${wasJumpFromSlide}`);

                        let slideInitiated = false;
                        if (wantsSlideIntentFlag && hasDirectionIntent) { logDebug("[CharState]", ` -> Decision: SLIDE (Mid-air crouch intent 'wantSlideOnLand' + Direction)`); nextState = "SLIDING"; slideInitiated = true;
                        } else if (wasJumpFromSlide && isHoldingCrouchKey) { logDebug("[CharState]", ` -> Decision: SLIDE (Jumped from slide + Crouch held)`); nextState = "SLIDING"; slideInitiated = true;
                        } else if (isHoldingCrouchKey && fallDistance > constants.minFallDistanceForBoost) { logDebug("[CharState]", ` -> Decision: SLIDE (Automatic fall boost + Crouch held)`); nextState = "SLIDING"; slideInitiated = true;
                        } else if (wantsSlideIntentFlag && !hasDirectionIntent && isHoldingCrouchKey) { logDebug("[CharState]", ` -> Decision: SLIDE (Mid-air crouch intent 'wantSlideOnLand' but no Dir, Crouch held)`); nextState = "SLIDING"; slideInitiated = true; // Slide forward if no intent specified but wanted slide
                        } else {
                            logDebug("[CharState]", ` -> Decision: NORMAL LANDING (ON_GROUND)`); nextState = "ON_GROUND";
                            stateVariables.isCrouching = isHoldingCrouchKey; stateVariables.justLandedIntoSlide = false;
                            if (hasDirectionIntent) { stateVariables.slideDirectionIntentLocal.set(0, 0, 0); logDebug("[CharSlide]", ` Cleared slide intent on normal landing.`); } // Clear intent if landing normally
                        }

                        if (slideInitiated) {
                            stateVariables.isCrouching = true; stateVariables.justLandedIntoSlide = true;
                            logDebug("[CharState]", "   (Setting justLandedIntoSlide = true)");
                            // If slide initiated WITHOUT specific direction intent, default to forward AFTER this state check
                            if (!hasDirectionIntent && stateVariables.slideDirectionIntentLocal.lengthSquared() < 0.01) {
                                logDebug("[CharSlide]", "   No specific intent for landing slide, will use forward/impact.");
                                // _calculateDesiredVelocity should handle defaulting direction now
                            }
                        }

                        stateVariables.fallStartY = null; stateVariables.lastGroundY = null; stateVariables.wantSlideOnLand = false; stateVariables.jumpedFromSlide = false; updateVisualState();
                    }
                    break;
                case "ON_GROUND":
                case "SLIDING":
                    stateVariables.justLanded = false; stateVariables.justLandedIntoSlide = false;
                    if (!isOnGroundOrJustLanded) { transitionToAirborne('FellOffEdge');
                    } else if (stateVariables.wantJump) {
                        logDebug("[CharJump]", `Jump Triggered from ${previousState}.`);
                        stateVariables.jumpedFromSlide = (previousState === "SLIDING");
                        logDebug("[CharJump]", `   (Setting jumpedFromSlide = ${stateVariables.jumpedFromSlide})`);
                        nextState = "START_JUMP";
                    } else if (previousState === "SLIDING" && !stateVariables.isCrouching) { // Added: Exit slide if no longer crouching
                        logDebug("[CharState]", `Exiting SLIDE state because no longer crouching.`);
                        nextState = "ON_GROUND";
                        stateVariables.slideVelocity.set(0,0,0);
                    }
                    break;
                case "START_JUMP":
                    stateVariables.justLanded = false; stateVariables.justLandedIntoSlide = false; stateVariables.wantJump = false;
                    transitionToAirborne('Jump');
                    break;
                default:
                    console.warn("[CharState] Unknown state:", previousState, "-> Resetting to IN_AIR"); nextState = "IN_AIR";
                    Object.assign(stateVariables, { wantSlideOnLand: false, justLandedIntoSlide: false, slideDirectionIntentLocal: new window.BABYLON.Vector3(0,0,0), isCrouching: false, fallStartY: null, lastGroundY: null, justLanded: false, jumpedFromSlide: false, wantJump: false, isSlidingKeyDown: false });
                    updateVisualState();
                    break;
            }

            if (nextState !== previousState) { logDebug("[CharState]", `Applied: ${previousState} -> ${nextState}`); stateVariables.state = nextState; }
        }

        function physicsUpdateCallback() {
            if (!scene?.deltaTime || !cameraControlsManager?.isPointerLocked()) return;
            const dt = Math.min(scene.deltaTime / 1000.0, 0.033);

            window.BABYLON.Quaternion.FromEulerAnglesToRef(0, camera.rotation.y, 0, stateVariables.characterTargetOrientation);

            const support = characterController.checkSupport(dt, constants.characterGravity.normalizeToNew());
            const currentVelocity = characterController.getVelocity();

            if ((stateVariables.state === "ON_GROUND" || stateVariables.state === "SLIDING") && support.supportedState === window.BABYLON.CharacterSupportedState.SUPPORTED) {
                stateVariables.lastGroundY = characterController.getPosition().y;
            }

            const desiredLinearVelocity = _calculateDesiredVelocity(
                dt, support, stateVariables.characterTargetOrientation, currentVelocity,
                stateVariables, constants, characterController, getNextState,
                updateVisualState, logDebug
            );

            characterController.setVelocity(desiredLinearVelocity);
            characterController.integrate(dt, support, constants.characterGravity);
        }

        function renderUpdateCallback() {
            const currentControllerPos = characterController.getPosition();
            const physicsHeight = normalCharacterHeight;
            const visualHeight = (displayCapsule.metadata.baseHeight || normalCharacterHeight) * displayCapsule.scaling.y;
            const controllerBottomY = currentControllerPos.y - (physicsHeight / 2);
            const targetVisualCenterY = controllerBottomY + (visualHeight / 2);

            displayCapsule.position.set(currentControllerPos.x, targetVisualCenterY, currentControllerPos.z);

            if (!displayCapsule.rotationQuaternion) displayCapsule.rotationQuaternion = window.BABYLON.Quaternion.Identity();
            window.BABYLON.Quaternion.SlerpToRef(displayCapsule.rotationQuaternion, stateVariables.characterTargetOrientation, constants.turnSpeed, displayCapsule.rotationQuaternion);
        }

        logDebug("[CharLogic:Movement]", "Registering observers...");
        const physicsObserver = scene.onAfterPhysicsObservable.add(physicsUpdateCallback);
        const renderObserver = scene.onBeforeRenderObservable.add(renderUpdateCallback);
        const inputHandler = setupInputHandling(scene, canvasRef, cameraControlsManager, stateVariables, characterController, constants, attemptJumpTrigger, updateVisualState, logDebug);
        if (!inputHandler) return null;

        updateVisualState();

        const controlAPI = {
            isOnGround: () => stateVariables.state === "ON_GROUND" || stateVariables.state === "SLIDING",
            checkGroundContact: () => characterController.checkSupport(0.001, constants.characterGravity.normalizeToNew()).supportedState === window.BABYLON.CharacterSupportedState.SUPPORTED,
            getCurrentState: () => stateVariables.state,
            getPressedKeys: () => Array.from(stateVariables.pressedKeys),
            getIsCrouching: () => stateVariables.isCrouching,
            getIsSliding: () => stateVariables.state === "SLIDING",
            controlState: {
                getState: () => stateVariables.state, isSprinting: () => stateVariables.isSprinting, isShiftPressed: () => stateVariables.isShiftPressed,
                isCrouching: () => stateVariables.isCrouching, isSliding: () => stateVariables.state === "SLIDING",
                inputDirection: () => stateVariables.inputDirection.clone(), getVelocity: () => characterController.getVelocity().clone()
            },
            cleanup: () => {
                 logDebug("[CharLogic:Movement]", "Cleanup..."); inputHandler?.cleanup?.();
                 scene?.onAfterPhysicsObservable.remove(physicsObserver); scene?.onBeforeRenderObservable.remove(renderObserver);
                 stateVariables.pressedKeys.clear(); logDebug("[CharLogic:Movement]", "Cleanup finished.");
            },
        };
        logDebug("[CharLogic:Movement]", "Setup complete.");
        return controlAPI;
    }

    function initialize(scene, canvasRef) {
        //console.log("[CharacterLogic] Initializing...");
        if (!scene || !canvasRef) { console.error("[CharacterLogic] Init failed: Scene or CanvasRef missing."); return null; }

        const env = setupEnvironment(scene, canvasRef);
        if (!env?.displayCapsule || !env?.characterController) { console.error("[CharacterLogic] Env setup failed."); env?.light?.dispose(); return null; }

        const constants = createConstants(env.normalCharacterHeight, env.crouchCharacterHeight, env.characterRadius);
        if(!constants) { console.error("[CharacterLogic] Failed to create constants."); env.characterController?.dispose(); env.displayCapsule?.dispose(); env.light?.dispose(); return null; }

        let cameraLogic = null;
        try { cameraLogic = CameraLogic.initialize(scene, canvasRef, env.displayCapsule, env.charStartPos); }
        catch (error) { console.error("[CharacterLogic] Error CameraLogic.initialize:", error); env.characterController?.dispose(); env.displayCapsule?.dispose(); env.light?.dispose(); return null; }

        if (!cameraLogic?.camera || !cameraLogic?.cameraControls) { console.error("[CharacterLogic] CRITICAL: CameraLogic init failed."); cameraLogic?.cleanup?.(); env.characterController?.dispose(); env.displayCapsule?.dispose(); env.light?.dispose(); return null; }
        //console.log("[CharacterLogic] CameraLogic initialized.");
        if (scene.activeCamera !== cameraLogic.camera) scene.activeCamera = cameraLogic.camera;

        const movementComponents = setupMovementAndPhysicsUpdates(scene, cameraLogic.camera, env.displayCapsule, env.characterController, cameraLogic.cameraControls, canvasRef, constants);
        if (!movementComponents) { console.error("[CharacterLogic] Movement setup failed."); cameraLogic?.cleanup?.(); env.characterController?.dispose(); env.displayCapsule?.dispose(); env.light?.dispose(); return null; }

        //console.log("[CharacterLogic] Initialization complete.");
        return {
            camera: cameraLogic.camera, displayCapsule: env.displayCapsule, characterController: env.characterController,
            cameraControls: cameraLogic.cameraControls, ...movementComponents,
            cleanup: () => {
                //console.log("[CharacterLogic] Cleanup..."); movementComponents?.cleanup?.(); cameraLogic?.cleanup?.();
                env.characterController?.dispose(); env.displayCapsule?.dispose(); env.light?.dispose();
                //console.log("[CharacterLogic] Cleanup finished.");
            },
        };
    }

    return { initialize };
})();

// Final export for the component
return { CharacterLogic };
```


# CharacterVelocity

```jsx
// --- Character Velocity Calculation (Defined Inline) ---
// Contains the critical fix for jumpedFromSlide flag handling
function _calculateDesiredVelocity(
    deltaTime, supportInfo, characterOrientation, currentVelocity, // Core physics inputs
    stateVariables, constants, characterController,                // Required objects/state
    getNextState, updateVisualState, logDebug                       // Required helper functions
) {
    // Determine/update state FIRST - this might change stateVariables.state
    // It will also set justLandedIntoSlide correctly if landing occurs
    const previousFrameState = stateVariables.state; // Store state before getNextState potentially changes it
    getNextState(supportInfo); // This updates stateVariables.state and flags like justLandedIntoSlide
    const currentFrameState = stateVariables.state; // Get the potentially updated state

    // Common calculations
    const upWorld = constants.characterGravity.normalizeToNew().scale(-1);
    const m = new window.BABYLON.Matrix();
    characterOrientation.toRotationMatrix(m);
    const forwardWorld = window.BABYLON.Vector3.TransformCoordinates(constants.forwardLocalSpace, m);
    let outputVelocity = window.BABYLON.Vector3.Zero();
    let currentSpeed;


    // --- Calculate velocity based on the CURRENT state for THIS frame ---
    switch (currentFrameState) {
        case "ON_GROUND": {
            // --- ON_GROUND Logic ---
            if (stateVariables.isCrouching) {
                currentSpeed = constants.crouchSpeed;
                if (stateVariables.isSprinting) stateVariables.isSprinting = false; // Cannot sprint while crouched
            } else {
                // Check if sprinting should start/stop
                const shouldSprint = stateVariables.isShiftPressed && stateVariables.inputDirection.z > 0;
                if (shouldSprint !== stateVariables.isSprinting) {
                    logDebug("[CharSprint]", `${shouldSprint ? 'Engaging' : 'Disengaging'} Sprint (ON_GROUND check)`);
                    stateVariables.isSprinting = shouldSprint;
                }
                currentSpeed = stateVariables.isSprinting ? constants.runSpeed : constants.walkSpeed;
            }

            // Calculate target velocity based on input and speed
            let targetVelocity = stateVariables.inputDirection.scale(currentSpeed);
            targetVelocity = window.BABYLON.Vector3.TransformCoordinates(targetVelocity, m); // To world space

            // Project onto ground plane (using average surface normal if available)
            const surfaceNormal = supportInfo.averageSurfaceNormal || upWorld;
            const projectedVelocity = targetVelocity.subtract(surfaceNormal.scale(window.BABYLON.Vector3.Dot(targetVelocity, surfaceNormal) / surfaceNormal.lengthSquared()));

            // Clamp magnitude to current speed
            const speedMagnitude = projectedVelocity.length();
            if (speedMagnitude > 0.001) {
                projectedVelocity.normalize().scaleInPlace(currentSpeed);
            } else {
                projectedVelocity.set(0, 0, 0); // No input, stop
            }

            // Use CharacterController's built-in movement calculation (handles slopes, etc.)
            outputVelocity = characterController.calculateMovement(
                deltaTime, forwardWorld, surfaceNormal, currentVelocity,
                supportInfo.averageSurfaceVelocity || window.BABYLON.Vector3.Zero(), // Ground velocity
                projectedVelocity, // Desired velocity relative to ground
                upWorld
            );

             // --- Refinement: Ensure velocity is truly parallel to the ground ---
            const finalSurfaceNormal = supportInfo.averageSurfaceNormal || upWorld;
            const relativeVelocity = outputVelocity.subtract(supportInfo.averageSurfaceVelocity || window.BABYLON.Vector3.Zero());
            const normalDot = window.BABYLON.Vector3.Dot(relativeVelocity, finalSurfaceNormal);
             if (Math.abs(normalDot) > 1e-4) {
                 relativeVelocity.subtractInPlace(finalSurfaceNormal.scale(normalDot / finalSurfaceNormal.lengthSquared()));
             }
            outputVelocity = relativeVelocity.add(supportInfo.averageSurfaceVelocity || window.BABYLON.Vector3.Zero());


            return outputVelocity;
        } // End ON_GROUND case

        case "SLIDING": {
            // --- SLIDE INITIALIZATION FRAME (Landing) ---
            if (stateVariables.justLandedIntoSlide) {
                logDebug("[CharSlide]", `CalcVel: LANDING INTO SLIDE FRAME.`);
                let initialSlideDirectionWorld = null;
                const matrix = new window.BABYLON.Matrix();
                stateVariables.characterTargetOrientation.toRotationMatrix(matrix);

                if (stateVariables.slideDirectionIntentLocal.lengthSquared() > 0.01) {
                    initialSlideDirectionWorld = window.BABYLON.Vector3.TransformCoordinates(stateVariables.slideDirectionIntentLocal, matrix).normalize();
                    stateVariables.slideDirectionIntentLocal.set(0, 0, 0);
                    logDebug("[CharSlide]", ` -> Using Intentional Direction: ${initialSlideDirectionWorld.toString()}`);
                } else {
                    initialSlideDirectionWorld = forwardWorld.normalizeToNew();
                    logDebug("[CharSlide]", ` -> Using Automatic Forward Direction: ${initialSlideDirectionWorld.toString()}`);
                }

                let calculatedSpeed = constants.runSpeed;
                if (stateVariables.fallStartY !== null) {
                    const landingY = characterController.getPosition().y;
                    const fallDistance = Math.max(0, stateVariables.fallStartY - landingY);
                    logDebug("[CharSlide]", ` -> Fall Calc: StartY=${stateVariables.fallStartY.toFixed(2)}, LandY=${landingY.toFixed(2)}, Dist=${fallDistance.toFixed(2)}`);

                    if (fallDistance > constants.minFallDistanceForBoost) {
                        const speedFromFallRaw = constants.runSpeed + (Math.sqrt(fallDistance) * constants.fallDistanceToSpeedScale);
                        const speedFromFallClamped = Math.min(speedFromFallRaw, constants.maxSlideSpeedFromFall);
                        const landingHorizontalVel = new window.BABYLON.Vector3(currentVelocity.x, 0, currentVelocity.z);
                        const landingHorizontalSpeed = landingHorizontalVel.length();
                        const blendFactor = 0.5;
                        calculatedSpeed = window.BABYLON.Scalar.Lerp(landingHorizontalSpeed, speedFromFallClamped, blendFactor);
                        calculatedSpeed = Math.max(calculatedSpeed, constants.runSpeed);
                        calculatedSpeed = Math.min(calculatedSpeed, constants.maxSlideSpeedFromFall);
                        logDebug("[CharSlide]", ` -> Applied Fall Boost. SpeedFromFallClamped: ${speedFromFallClamped.toFixed(2)}, LandingHorizSpeed: ${landingHorizontalSpeed.toFixed(2)}, Blended Speed: ${calculatedSpeed.toFixed(2)}`);
                    } else {
                         logDebug("[CharSlide]", ` -> Fall distance <= ${constants.minFallDistanceForBoost}. Using base run speed: ${calculatedSpeed.toFixed(2)}`);
                    }
                } else {
                     logDebug("[CharSlide]", ` -> No valid fallStartY. Using base run speed: ${calculatedSpeed.toFixed(2)}`);
                }

                stateVariables.slideVelocity.copyFrom(initialSlideDirectionWorld.scale(calculatedSpeed));
                stateVariables.slideVelocity.y = currentVelocity.y; // Preserve vertical velocity from landing impact

                logDebug("[CharSlide]", ` >> Initial slide velocity calculated and stored: ${stateVariables.slideVelocity.toString()}`);
                stateVariables.justLandedIntoSlide = false; // Consume flag AFTER calculation
                updateVisualState();

                logDebug("[CharSlide]", ` << CalcVel: RETURNING INITIAL BOOST VELOCITY FOR LANDING FRAME.`);
                return stateVariables.slideVelocity.clone(); // Use calculated boost velocity THIS FRAME
            }

             // --- STATIC CROUCH SLIDE INITIALIZATION FRAME ---
             const justStartedStaticSlide = (previousFrameState === "ON_GROUND" && currentFrameState === "SLIDING");
             // Check if input handler already set a boost velocity
             if (justStartedStaticSlide && stateVariables.slideVelocity.lengthSquared() > constants.staticSlideVelocityThreshold * constants.staticSlideVelocityThreshold) {
                 logDebug("[CharSlide]", `CalcVel: STATIC CROUCH SLIDE INITIATION FRAME.`);
                 logDebug("[CharSlide]", ` >> Using pre-calculated boost velocity from input: ${stateVariables.slideVelocity.toString()}`);
                 stateVariables.slideVelocity.y = currentVelocity.y; // Preserve current Y
                 logDebug("[CharSlide]", ` << CalcVel: RETURNING STATIC BOOST VELOCITY FOR INITIATION FRAME.`);
                 return stateVariables.slideVelocity.clone(); // Use the boost velocity THIS FRAME
             }


            // --- NORMAL SLIDING FRAME (After initialization) ---
            logDebug("[CharSlide]", `CalcVel: NORMAL SLIDE FRAME.`);

            // Check for termination via key release
            const crouchHeld = stateVariables.isSlidingKeyDown || stateVariables.pressedKeys.has('c');
            if (!crouchHeld) {
                 logDebug("[CharSlide]", `Slide termination condition met (Keys Released). Transitioning to ON_GROUND.`);
                 stateVariables.state = "ON_GROUND";
                 stateVariables.isCrouching = false; // Attempt to stand
                 updateVisualState();
                 stateVariables.slideVelocity.set(0, 0, 0);
                 logDebug("[CharSlide]", ` << CalcVel: Recalculating as ON_GROUND after key release.`);
                 return _calculateDesiredVelocity(deltaTime, supportInfo, characterOrientation, currentVelocity, stateVariables, constants, characterController, getNextState, updateVisualState, logDebug); // Recalculate for this frame
            }

            // Apply friction to the horizontal component of the stored slide velocity
            let horizontalVel = new window.BABYLON.Vector3(stateVariables.slideVelocity.x, 0, stateVariables.slideVelocity.z);
            const speedBeforeFriction = horizontalVel.length();
            if (speedBeforeFriction > 0.01) {
                const frictionMultiplier = Math.pow(constants.slideFriction, deltaTime * 60);
                horizontalVel.scaleInPlace(frictionMultiplier);
                stateVariables.slideVelocity.x = horizontalVel.x;
                stateVariables.slideVelocity.z = horizontalVel.z;
            }
            const currentHorizontalSpeed = horizontalVel.length();
            logDebug("[CharSlide]", ` -> Sliding. Speed After Friction: ${currentHorizontalSpeed.toFixed(2)}, Stored Vel: ${stateVariables.slideVelocity.toString()}`);

            // Check for termination via low speed
            if (currentHorizontalSpeed < constants.slideMinSpeed) {
                logDebug("[CharSlide]", `Slide termination condition met (Low Speed: ${currentHorizontalSpeed.toFixed(2)} < ${constants.slideMinSpeed}). Transitioning to ON_GROUND.`);
                 stateVariables.state = "ON_GROUND";
                 stateVariables.isCrouching = true; // Remain crouching
                 updateVisualState();
                 stateVariables.slideVelocity.set(0, 0, 0);
                 logDebug("[CharSlide]", ` << CalcVel: Recalculating as ON_GROUND (crouched) after low speed.`);
                 return _calculateDesiredVelocity(deltaTime, supportInfo, characterOrientation, currentVelocity, stateVariables, constants, characterController, getNextState, updateVisualState, logDebug); // Recalculate for this frame
             }

            // Preserve current vertical velocity (let gravity/integrate handle it)
            stateVariables.slideVelocity.y = currentVelocity.y;

            logDebug("[CharSlide]", ` << CalcVel: RETURNING NORMAL SLIDE VELOCITY.`);
            return stateVariables.slideVelocity.clone(); // Return friction-applied velocity

        } // End SLIDING case

        case "IN_AIR": {
            // --- IN_AIR Logic ---
            currentSpeed = constants.inAirSpeed;
            let desiredAirVelocity = stateVariables.inputDirection.scale(currentSpeed);
            desiredAirVelocity = window.BABYLON.Vector3.TransformCoordinates(desiredAirVelocity, m);

            // Apply air control using calculateMovement (if suitable) or simpler approach
            outputVelocity = characterController.calculateMovement(
                deltaTime, forwardWorld, upWorld, currentVelocity,
                window.BABYLON.Vector3.Zero(), desiredAirVelocity, upWorld
            );

            // Apply Gravity explicitly
            outputVelocity.addInPlace(constants.characterGravity.scale(deltaTime));

            return outputVelocity;
        } // End IN_AIR case

        case "START_JUMP": {
            // --- START_JUMP Logic (Impulse Calculation) ---
            const effectiveJumpHeight = stateVariables.isSprinting ? constants.sprintJumpHeight : constants.jumpHeight;
            logDebug("[CharJump]", `CalcVel: Calculating Jump Impulse. IsSprinting=${stateVariables.isSprinting}, EffectiveHeight=${effectiveJumpHeight.toFixed(2)}, JumpedFromSlide=${stateVariables.jumpedFromSlide}`); // Log flag state HERE

            const jumpSpeed = Math.sqrt(2 * constants.characterGravity.length() * effectiveJumpHeight);
            const currentUpVel = currentVelocity.dot(upWorld);
            const impulseMagnitude = Math.max(0, jumpSpeed - currentUpVel);
            const verticalJumpImpulse = upWorld.scale(impulseMagnitude);

            logDebug("[CharJump]", ` -> Applying Vertical Jump Impulse: TargetSpeed=${jumpSpeed.toFixed(3)}, CurrentUpVel=${currentUpVel.toFixed(3)}, ImpulseMag=${impulseMagnitude.toFixed(3)}, ImpulseVec=${verticalJumpImpulse.toString()}`);

            let finalJumpVelocity = currentVelocity.clone();
            finalJumpVelocity.addInPlace(verticalJumpImpulse);

            // Apply horizontal boost if jumping from a slide (flag checked HERE)
            if (stateVariables.jumpedFromSlide) {
                const boostMagnitude = constants.runSpeed * (constants.slideJumpForwardBoostFactor - 1.0);
                const horizontalBoostImpulse = forwardWorld.normalizeToNew().scale(boostMagnitude);
                logDebug("[CharJump/Slide]", ` -> Applying Slide Jump Horizontal Boost: Factor=${constants.slideJumpForwardBoostFactor}, AddSpeed=${boostMagnitude.toFixed(3)}, ImpulseVec=${horizontalBoostImpulse.toString()}`);
                finalJumpVelocity.addInPlace(horizontalBoostImpulse);
                // ***** THE FIX: DO NOT RESET THE FLAG HERE *****
                // The flag should persist until landing.
                // stateVariables.jumpedFromSlide = false; // <-- REMOVED/COMMENTED OUT
            }

            logDebug("[CharJump]", ` << CalcVel: RETURNING JUMP IMPULSE VELOCITY.`);
            return finalJumpVelocity; // Return velocity post-impulse
        } // End START_JUMP case

        default: {
            // Fallback for unknown states
            console.warn("[CharacterLogic: Velocity] Reached fallback in _calculateDesiredVelocity. State:", currentFrameState);
            return currentVelocity.add(constants.characterGravity.scale(deltaTime)); // Apply gravity at least
        } // End default case
    } // End switch (currentFrameState)
} // End _calculateDesiredVelocity

// Export if this is in its own module file
return { _calculateDesiredVelocity };
```





# CameraLogic

```jsx
const CameraLogic = (() => {
  // --- Camera Setup ---
  function setupCamera(scene, canvasRef, initialPosition = new window.BABYLON.Vector3(0, 5, -10)) {
    const camera = new window.BABYLON.FreeCamera("camera1", initialPosition, scene);
    camera.minZ = 0.2;
    camera.maxZ = 500;
    camera.angularSensibility = 4000;
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];
    camera.checkCollisions = true;
    camera.ellipsoid = new window.BABYLON.Vector3(0.3, 0.3, 0.3);

    return camera;
  }

  // --- Camera Mode, Pointer Lock, and Collision Management ---
  function setupCameraControls(scene, canvasRef, camera, displayCapsule) {
    let currentCameraMode = "third";
    let isPointerLocked = false;
    const thirdPersonDistance = 8;
    const thirdPersonHeightOffset = 2.5;
    const thirdPersonTargetOffset = 1.0;
    const firstPersonHeadOffset = new window.BABYLON.Vector3(0, (1.8 / 2) - 0.2, 0.1);
    const minCameraRaycastDist = 1.0;

    // Attach camera controls
    camera.attachControl(canvasRef.current, false);

    // Pointer lock handlers
    const requestLock = () => {
      if (canvasRef.current && !isPointerLocked) {
        canvasRef.current.requestPointerLock =
          canvasRef.current.requestPointerLock ||
          canvasRef.current.mozRequestPointerLock ||
          canvasRef.current.webkitRequestPointerLock;
        if (canvasRef.current.requestPointerLock) {
          canvasRef.current.requestPointerLock();
        }
      }
    };

    const exitLock = () => {
      document.exitPointerLock =
        document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    };

    const toggleCameraMode = () => {
      currentCameraMode = currentCameraMode === "third" ? "first" : "third";
    };

    const handlePointerLockChange = () => {
      if (
        document.pointerLockElement === canvasRef.current ||
        document.mozPointerLockElement === canvasRef.current ||
        document.webkitPointerLockElement === canvasRef.current
      ) {
        isPointerLocked = true;
        if (!camera.inputs.attached.mouse) {
          camera.inputs.attachInput(camera.inputs.attached.mouse);
        }
      } else {
        isPointerLocked = false;
      }
    };

    const canvasClickHandler = () => {
      if (!isPointerLocked) {
        requestLock();
      }
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener("click", canvasClickHandler);
    }

    document.addEventListener("pointerlockchange", handlePointerLockChange, false);
    document.addEventListener("mozpointerlockchange", handlePointerLockChange, false);
    document.addEventListener("webkitpointerlockchange", handlePointerLockChange, false);

    const isMeshCameraBlocker = (mesh) => {
      return mesh !== displayCapsule;
    };

    // Camera positioning in render loop
    const renderObserver = scene.onBeforeRenderObservable.add(() => {
      const currentControllerPos = displayCapsule.position;
      const currentMode = currentCameraMode;
      if (currentMode === "first") {
        const headOffset = firstPersonHeadOffset;
        const headPosWorld = displayCapsule.position.add(
          window.BABYLON.Vector3.TransformNormal(headOffset, displayCapsule.getWorldMatrix())
        );
        camera.position.copyFrom(headPosWorld);
      } else {
        const distance = thirdPersonDistance;
        const heightOffset = thirdPersonHeightOffset;
        const targetOffset = thirdPersonTargetOffset;
        const minRaycastDist = minCameraRaycastDist;
        const isBlocker = isMeshCameraBlocker;

        const characterRootPos = currentControllerPos;
        const lookAtPoint = characterRootPos.add(new window.BABYLON.Vector3(0, targetOffset, 0));
        const cameraBackward = camera.getDirection(window.BABYLON.Vector3.Backward());
        let desiredPosition = lookAtPoint.add(cameraBackward.scale(distance));
        const ray = new window.BABYLON.Ray(
          lookAtPoint,
          desiredPosition.subtract(lookAtPoint).normalize(),
          distance
        );
        const hit = scene.pickWithRay(ray, isBlocker);
        let targetPosition;
        if (hit && hit.hit && hit.pickedPoint && hit.pickedMesh) {
          targetPosition = hit.pickedPoint.add(ray.direction.scale(-0.1));
        } else {
          targetPosition = desiredPosition;
        }
        let distToLookAt = window.BABYLON.Vector3.Distance(targetPosition, lookAtPoint);
        if (distToLookAt < minRaycastDist) {
          targetPosition = lookAtPoint.add(ray.direction.scale(minRaycastDist));
        }
        camera.position = window.BABYLON.Vector3.Lerp(camera.position, targetPosition, 0.3);
      }
    });

    return {
      getCurrentMode: () => currentCameraMode,
      toggleCameraMode,
      getThirdPersonDistance: () => thirdPersonDistance,
      getThirdPersonHeightOffset: () => thirdPersonHeightOffset,
      getThirdPersonTargetOffset: () => thirdPersonTargetOffset,
      getFirstPersonHeadOffset: () => firstPersonHeadOffset,
      getMinCameraRaycastDist: () => minCameraRaycastDist,
      isMeshCameraBlocker,
      isPointerLocked: () => isPointerLocked,
      requestLock,
      exitLock,
      cleanup: () => {
        if (canvasRef.current) {
          canvasRef.current.removeEventListener("click", canvasClickHandler);
        }
        camera.detachControl(canvasRef.current);
        document.removeEventListener("pointerlockchange", handlePointerLockChange, false);
        document.removeEventListener("mozpointerlockchange", handlePointerLockChange, false);
        document.removeEventListener("webkitpointerlockchange", handlePointerLockChange, false);
        if (isPointerLocked) {
          exitLock();
        }
        scene.onBeforeRenderObservable.remove(renderObserver);
      },
    };
  }

  // --- Main Initialization ---
  function initialize(scene, canvasRef, displayCapsule, initialPosition) {
    const camera = setupCamera(scene, canvasRef, initialPosition);
    const cameraControlsManager = setupCameraControls(scene, canvasRef, camera, displayCapsule);
    if (canvasRef.current) {
      canvasRef.current.focus();
      console.log("CameraLogic: Canvas focused. Click canvas to lock pointer.");
    }
    return {
      camera,
      cameraControls: cameraControlsManager,
      cleanup: () => {
        cameraControlsManager.cleanup();
        if (camera) {
          camera.dispose();
        }
      },
    };
  }

  return { initialize };
})();

return { CameraLogic };
```



# SpherePipSpawner

```jsx
const fileName = "_OPERATION/PRIVATE/DATACORE/22 World888/D.q.world888.component.md"

const { useEffect } = dc;
 
function SpherePipSpawner({ scene, helperRef }) {
  useEffect(() => {
	if (!scene) return;
 
	// Define positions for each sphere – adjust these as needed.
	const sphereConfigs = [
	  {
		name: "interactiveSphere_0",
		position: new window.BABYLON.Vector3(10, 1, -10),
		pip: {
		  filePath: fileName,
		  header: "ViewComponent",
		  functionName: "WorldView",
		  options: {
			width: "555px",
			height: "388px",
			top: "calc(100% - 444px - 10px)",
			left: "calc(100% - 565px - 10px)"
		  }
		}
	  },
	  {
		name: "interactiveSphere_1",
		position: new window.BABYLON.Vector3(13, 2, -12),
		pip: {
		  filePath: fileName,
		  header: "ViewComponent",
		  functionName: "WorldView",
		  options: {
			width: "555px",
			height: "388px",
			top: "calc(100% - 444px - 10px)",
			left: "33px"
		  }
		}
	  },
	  {
		name: "interactiveSphere_2",
		position: new window.BABYLON.Vector3(15, 2, -9),
		pip: {
		  filePath: fileName,
		  header: "ViewComponent",
		  functionName: "WorldView",
		  options: {
			width: "555px",
			height: "388px",
			top: "33px",
			left: "calc(100% - 555px - 10px)"
		  }
		}
	  }
	];
 
	const spheres = [];
 
	// Helper to spawn the pip view when a sphere is clicked.
	function spawnPipForSphere(pipConfig) {
	  // Use the helperRef passed down from WorldView.
	  if (helperRef && helperRef.current && typeof helperRef.current.spawnCustomPiP === "function") {
		helperRef.current.spawnCustomPiP(
		  pipConfig.filePath,
		  pipConfig.header,
		  pipConfig.functionName,
		  pipConfig.options
		);
	  } else {
		console.warn("ScreenModeHelper.spawnCustomPiP is not available via helperRef.");
	  }
	}
 
	// Create each sphere and set up an action to spawn the pip upon picking.
	sphereConfigs.forEach((config, index) => {
	  const sphere = window.BABYLON.MeshBuilder.CreateSphere(config.name, { diameter: 1.5 }, scene);
	  sphere.position = config.position;
 
		const mat = new window.BABYLON.StandardMaterial(`${config.name}_mat`, scene);
		// Set the diffuse color to red (to match the pane color)
		mat.diffuseColor = new window.BABYLON.Color3(1, 0, 0);
		// Keep the bluish emissive glow as before
		mat.emissiveColor = new window.BABYLON.Color3(0.2, 0.5, 1);
		sphere.material = mat;

 
	  // Enable hover animation: make the sphere bob up and down.
	  sphere._baseY = sphere.position.y;
	  scene.onBeforeRenderObservable.add(function animateSphere() {
		const deltaTime = scene.getEngine().getDeltaTime() * 0.001; 
		sphere.position.y = sphere._baseY + Math.sin(performance.now() * 0.002 + index) * 0.3;
	  });
 
	  // Set up the ActionManager for click interactions.
	  sphere.actionManager = new window.BABYLON.ActionManager(scene);
	  sphere.actionManager.registerAction(
		new window.BABYLON.ExecuteCodeAction(window.BABYLON.ActionManager.OnPickTrigger, () => {
		  spawnPipForSphere(config.pip);
		})
	  );
 
	  spheres.push(sphere);
	});
 
	// Clean up: on component unmount, dispose of all created spheres.
	return () => {
	  spheres.forEach((s) => {
		if (s) s.dispose();
	  });
	};
  }, [scene, helperRef]);
 
  // This component renders no DOM elements.
  return null;
}
 
return { SpherePipSpawner };

```


# PaneLogic

```jsx
const fileName = "_OPERATION/PRIVATE/DATACORE/22 World888/D.q.world888.component.md";

// Import loadScript from the separate module.
const { loadScript } = await dc.require(
  dc.headerLink(fileName, "LoadScript")
);
// Import applyPhysicsToMesh from the HavokPhysics module.
const { applyPhysicsToMesh } = await dc.require(
  dc.headerLink(fileName, "HavokPhysics")
);

// Create a placeholder for PaneLogic.
const PaneLogic = {};
// Initialize the active pane property.
PaneLogic.activePane = null;

/**
 * Async function to retrieve the media resource URL.
 */
PaneLogic.requireMediaFile = async (path) => {
  const mediaFile = await app.vault.getFileByPath(path);
  return app.vault.getResourcePath(mediaFile);
};

/**
 * Loads the lottie-web library.
 */
PaneLogic.loadLottie = function(loadScript) {
  return new Promise((resolve, reject) => {
    if (window.lottie || window.bodymovin) {
      window.lottie = window.lottie || window.bodymovin;
      return resolve(window.lottie);
    }
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.10.1/lottie.min.js",
      () => {
        setTimeout(() => {
          if (window.lottie || window.bodymovin) {
            window.lottie = window.lottie || window.bodymovin;
            resolve(window.lottie);
          } else {
            reject(new Error("lottie not available after script load."));
          }
        }, 100);
      },
      () => reject(new Error("Failed to load lottie-web library."))
    );
  });
};

/**
 * Creates a pane from a media file.
 */
PaneLogic.createPane = async function({ scene, filePath, position = new window.BABYLON.Vector3(0, 2, 5), loadScript }) {
  try {
    const mediaURL = await PaneLogic.requireMediaFile(filePath);
    const isLottie = filePath.toLowerCase().endsWith(".json");

    if (isLottie) {
      const lottie = await PaneLogic.loadLottie(loadScript);
      const lottieContainer = document.createElement("div");
      lottieContainer.style.width = "300px";
      lottieContainer.style.height = "300px";
      lottieContainer.style.position = "absolute";
      lottieContainer.style.top = "-9999px";
      document.body.appendChild(lottieContainer);

      lottie.loadAnimation({
        container: lottieContainer,
        renderer: "canvas",
        loop: true,
        autoplay: true,
        path: mediaURL,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      const renderedCanvas = lottieContainer.querySelector("canvas");
      if (renderedCanvas) {
        const dynamicTexture = new window.BABYLON.DynamicTexture("lottieTexture", renderedCanvas, scene, false);
        const pane = window.BABYLON.MeshBuilder.CreatePlane("lottiePane", { width: 4, height: 4 }, scene);
        pane.position = position;
        const mat = new window.BABYLON.StandardMaterial("lottieMat", scene);
        mat.diffuseTexture = dynamicTexture;
        pane.material = mat;
        applyPhysicsToMesh({
          mesh: pane,
          scene,
          shapeType: "BOX",
          options: { mass: 0, restitution: 0.1 }
        });
        scene.onBeforeRenderObservable.add(() => dynamicTexture.update());
        document.body.removeChild(lottieContainer);
        return pane;
      } else {
        document.body.removeChild(lottieContainer);
        throw new Error("Lottie canvas not found.");
      }
    } else {
      const pane = window.BABYLON.MeshBuilder.CreatePlane("imagePane", { width: 4, height: 4 }, scene);
      pane.position = position;
      const mat = new window.BABYLON.StandardMaterial("imageMat", scene);
      mat.diffuseTexture = new window.BABYLON.Texture(mediaURL, scene);
      mat.emissiveColor = new window.BABYLON.Color3(1, 1, 1);
      pane.material = mat;
      applyPhysicsToMesh({
        mesh: pane,
        scene,
        shapeType: "BOX",
        options: { mass: 0, restitution: 0.1 }
      });
      return pane;
    }
  } catch (err) {
    console.error("PaneLogic.createPane encountered an error:", err);
    throw err;
  }
};

PaneLogic.getOverlayScreenPosition = function(scene, pane) {
  const engine = scene.getEngine();
  const camera = scene.activeCamera;
  let basePos = pane.position.clone();

  if (pane.name === "initialInteractionPane") {
    basePos.addInPlace(new window.BABYLON.Vector3(0, 1, 0));
  } else {
    basePos.addInPlace(new window.BABYLON.Vector3(0, -0.5, 0));
  }

  const screenPos = window.BABYLON.Vector3.Project(
    basePos,
    window.BABYLON.Matrix.Identity(),
    scene.getTransformMatrix(),
    camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
  );
  return screenPos;
};

/**
 * Creates a modal media input overlay.
 */
PaneLogic.showMediaInputOverlay = function(scene, defaultFilePath, activePane) {
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.top = "20%";
  overlay.style.left = "50%";
  overlay.style.transform = "translate(-50%, -20%)";
  overlay.style.background = "rgba(0, 0, 0, 0.8)";
  overlay.style.padding = "20px";
  overlay.style.zIndex = "1000";
  overlay.style.borderRadius = "8px";
  overlay.style.color = "#fff";

  const label = document.createElement("p");
  label.innerText = "Enter file path (e.g., scripts/aquarium/img/back.png or a Lottie JSON file):";
  overlay.appendChild(label);

  const input = document.createElement("input");
  input.type = "text";
  input.value = defaultFilePath || "scripts/aquarium/img/back.png";
  input.style.width = "100%";
  input.style.padding = "8px";
  input.style.marginBottom = "10px";
  overlay.appendChild(input);

  const buttonDiv = document.createElement("div");
  buttonDiv.style.textAlign = "right";

  const cancelBtn = document.createElement("button");
  cancelBtn.innerText = "Cancel";
  cancelBtn.style.marginRight = "10px";
  const submitBtn = document.createElement("button");
  submitBtn.innerText = "Submit";

  buttonDiv.appendChild(cancelBtn);
  buttonDiv.appendChild(submitBtn);
  overlay.appendChild(buttonDiv);

  document.body.appendChild(overlay);
  input.focus();

  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  submitBtn.addEventListener("click", async () => {
    const filePath = input.value.trim();
    document.body.removeChild(overlay);
    try {
      await PaneLogic.handleMediaSubmit({ scene, filePath, loadScript, pane: activePane });
    } catch (err) {
      console.error("Error updating pane media:", err);
    }
  });
};

/**
 * Handles media interaction on an interactive pane.
 */
PaneLogic.handleMediaInteractionForPane = function({ scene, pane, defaultFilePath, loadScript }) {
  PaneLogic.activePane = pane;
  PaneLogic.showMediaInputOverlay(scene, defaultFilePath, pane);
};

/**
 * Creates a blank interactive pane that can be updated later.
 */
PaneLogic.createInteractionPane = function({ scene, position, width = 4, height = 4 }) {
  const pane = window.BABYLON.MeshBuilder.CreatePlane("interactionPane", { width, height }, scene);
  pane.position = position;
  const mat = new window.BABYLON.StandardMaterial("paneMat", scene);
  mat.diffuseColor = new window.BABYLON.Color3(1, 0, 0);
  mat.backFaceCulling = false;
  pane.material = mat;
  applyPhysicsToMesh({
    mesh: pane,
    scene,
    shapeType: "BOX",
    options: { mass: 0, restitution: 0.1 }
  });
  return pane;
};

return { PaneLogic };
```




# ScreenModeHelper

```jsx
/** @jsx h */
const { h, render } = dc.preact;
const { useState, useEffect, useRef } = dc;

/*==============================================================================
  GLOBAL Z-INDEX MANAGEMENT
==============================================================================*/
let highestZIndex = 10000;
const DEFAULT_FALLBACK_ZINDEX = 10000;

function updateHighestZIndex() {
  let max = 0;
  document.querySelectorAll('.fresh-pip').forEach((el) => {
    let computedZStr = window.getComputedStyle(el).zIndex;
    // If computed style returns "auto" or is empty, use the inline style or a default
    let z = (computedZStr === "auto" || computedZStr === "")
      ? (parseInt(el.style.zIndex, 10) || DEFAULT_FALLBACK_ZINDEX)
      : (parseInt(computedZStr, 10) || 0);
    //console.log("[updateHighestZIndex] Found element:", el, "with computed zIndex:", computedZStr, "=> parsed:", z);
    if (z > max) {
      max = z;
    }
  });
  if (max < DEFAULT_FALLBACK_ZINDEX) {
    //console.log("[updateHighestZIndex] No high zIndex found. Using fallback", DEFAULT_FALLBACK_ZINDEX);
    max = DEFAULT_FALLBACK_ZINDEX;
  }
  highestZIndex = max;
  //console.log("[updateHighestZIndex] Updated highest z-index to:", highestZIndex);
  return highestZIndex;
}

function bringToFront(container, fallback = 0) {
  updateHighestZIndex();
  if (fallback && highestZIndex < fallback) {
    highestZIndex = fallback;
    //console.log("[bringToFront] Applied fallback value:", fallback);
  }
  highestZIndex++;
  // Use setProperty with !important so that it overrides other styles.
  container.style.setProperty("z-index", highestZIndex, "important");
  let computed = window.getComputedStyle(container).zIndex;
  let forcedReflow = container.offsetHeight; // Force a reflow.
  //console.log([bringToFront] Container brought to front. New inline zIndex: ${highestZIndex} (computed: ${computed}). Forced reflow: ${forcedReflow});
}

/*==============================================================================
  HELPER FUNCTIONS FOR APPLYING SCREEN MODES WITH DEBUGGING
==============================================================================*/
function updateCanvasSize(container) {
  const canvas = container.querySelector("canvas");
  if (canvas) {
    //console.log("[updateCanvasSize] Before update - CSS size:", canvas.style.width, canvas.style.height);
    //console.log("[updateCanvasSize] Before update - Attributes: width =", canvas.width, "height =", canvas.height);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    canvas.width = newWidth;
    canvas.height = newHeight;
    //console.log("[updateCanvasSize] After update - Container size:", newWidth, newHeight);
   // console.log("[updateCanvasSize] After update - Canvas attributes:", canvas.width, canvas.height);
  } else {
    console.warn("[updateCanvasSize] No canvas found inside container.");
  }
}

function resetScreenMode(container, defaultStyle, originalParentRefForWindow, originalParentRefForPiP) {
  //console.log("[resetScreenMode] Resetting screen mode for container:", container);
  if (originalParentRefForWindow.current) {
    //console.log("[resetScreenMode] Reparenting container from window mode to original parent:", originalParentRefForWindow.current);
    originalParentRefForWindow.current.appendChild(container);
    originalParentRefForWindow.current = null;
  }
  if (originalParentRefForPiP.current) {
    //console.log("[resetScreenMode] Reparenting container from PiP mode to original parent:", originalParentRefForPiP.current);
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
  //console.log("[resetScreenMode] Container style reset to default:", container.style.cssText);
  let forcedReflow = container.offsetHeight;
  //console.log("[resetScreenMode] Forced reflow value:", forcedReflow);
}

function applyBrowserMode(container) {
  if (!document.fullscreenElement) {
    //console.log("[applyBrowserMode] Requesting fullscreen for container.");
    container.requestFullscreen?.() ||
      container.webkitRequestFullscreen?.() ||
      container.mozRequestFullScreen?.() ||
      container.msRequestFullscreen?.();
  } else {
    //console.log("[applyBrowserMode] Exiting fullscreen mode.");
    document.exitFullscreen?.();
  }
}

function applyWindowStyle(container) {
  //console.log("[applyWindowStyle] Applying window style to container:", container);
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#222"
  });
  //console.log("[applyWindowStyle] Container style after update:", container.style.cssText);
  //console.log("[applyWindowStyle] Computed style:", getComputedStyle(container).cssText);
  let reflowValue = container.offsetHeight;
  //console.log("[applyWindowStyle] Forced reflow value:", reflowValue);
  updateCanvasSize(container);
  bringToFront(container, 9999);
  setTimeout(() => {
    if (window.myBabylonEngine) {
      //console.log("[applyWindowStyle] Resizing Babylon engine. Container dimensions:", container.clientWidth, container.clientHeight);
      window.myBabylonEngine.resize();
    } else {
      console.warn("[applyWindowStyle] Babylon engine (window.myBabylonEngine) not found.");
    }
  }, 50);
}

function applyPipStyle(container) {
  //console.log("[applyPipStyle] Applying PiP style to container:", container);
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
  //console.log("[applyPipStyle] Container style after PiP update:", container.style.cssText);
  let forced = container.offsetHeight;
  //console.log("[applyPipStyle] Forced reflow value:", forced);
}

function applyScreenMode(mode, container, originalParentRefForWindow, originalParentRefForPiP, defaultStyle) {
  if (!container) return;
  //console.log("[applyScreenMode] Mode requested:", mode, "for container:", container);
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
        //console.log("[applyScreenMode] Stored original window parent:", originalParentRefForWindow.current);
      }
      document.body.appendChild(container);
      //console.log("[applyScreenMode] Container appended to document.body for window mode.");
      applyWindowStyle(container);
    }
    if (tokens.includes("pip")) {
      if (!originalParentRefForPiP.current) {
        originalParentRefForPiP.current = container.parentNode;
        //console.log("[applyScreenMode] Stored original PiP parent:", originalParentRefForPiP.current);
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
  //console.log(`[applyScreenMode] Applied mode: ${mode}`);
}

/*==============================================================================
  DRAG & RESIZE SETUP FOR PIP CONTAINERS WITH DEBUGGING
==============================================================================*/
function setupPipDrag(container) {
  if (container._pipDragAttached) return;
  const dragHandlers = {
    dragStart: (e) => {
      //console.log("[setupPipDrag] Drag start event:", e);
      bringToFront(container);
      container._active = true;
      container._pipDragging = true;
      container._pipStartX = e.clientX;
      container._pipStartY = e.clientY;
      container._pipOrigTop = parseInt(getComputedStyle(container).top, 10) || 0;
      container._pipOrigLeft = parseInt(getComputedStyle(container).left, 10) || 0;
      //console.log(`[setupPipDrag] Drag started at (${e.clientX}, ${e.clientY}). Original position: top ${container._pipOrigTop}, left ${container._pipOrigLeft}`);
    },
    dragMove: (e) => {
      if (!container._pipDragging) return;
      const deltaX = e.clientX - container._pipStartX;
      const deltaY = e.clientY - container._pipStartY;
      container.style.top = `${container._pipOrigTop + deltaY}px`;
      container.style.left = `${container._pipOrigLeft + deltaX}px`;
      //console.log(`[setupPipDrag] Drag move: top ${container.style.top}, left ${container.style.left}`);
    },
    dragEnd: (e) => {
      container._pipDragging = false;
      container._active = false;
      //console.log(`[setupPipDrag] Drag ended. Final position: top ${container.style.top}, left ${container.style.left}`);
      setTimeout(() => {
        bringToFront(container);
      }, 0);
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
      //console.log(`[setupPipCornerResizers] Mousedown on resizer at corner: ${corner}`, e);
      bringToFront(container);
      container._active = true;
      resizer._resizing = true;
      resizer._startX = e.clientX;
      resizer._startY = e.clientY;
      const computed = getComputedStyle(container);
      resizer._origWidth = parseInt(computed.width, 10);
      resizer._origHeight = parseInt(computed.height, 10);
      resizer._origTop = parseInt(computed.top, 10);
      resizer._origLeft = parseInt(computed.left, 10);
      resizer._corner = corner;
      //console.log([setupPipCornerResizers] Resize started at corner: ${corner}. Original dimensions: ${resizer._origWidth}x${resizer._origHeight} at (${resizer._origLeft}, ${resizer._origTop}));
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
      //console.log([setupPipCornerResizers] Resizing: new dimensions ${newWidth}x${newHeight}, new position (${newLeft}, ${newTop}));
    });
  };
  
  const resizeEnd = () => {
    if (container._pipResizers) {
      container._pipResizers.forEach((resizer) => {
        resizer._resizing = false;
      });
      container._active = false;
      //console.log("[setupPipCornerResizers] Resize ended. Final container style:", container.style.cssText);
    }
  };
  
  window.addEventListener("mousemove", resizeMove);
  window.addEventListener("mouseup", () => {
    setTimeout(() => {
      bringToFront(container);
    }, 0);
    resizeEnd();
  });
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
        //console.log("[FreshPip] Loaded component:", Component);
        setLoadedComponent(() => Component);
      } catch (error) {
        console.error("Error loading component:", error);
      }
    })();
  }, [filePath, header, functionName]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // On every pointerdown, always bring the container to the front.
      container.addEventListener("pointerdown", () => {
        //console.log("[FreshPip] Pointer down event: bringing container to front.");
        bringToFront(container);
        container._active = true;
      }, true);
      setupPipDrag(container);
      setupPipCornerResizers(container);
      //console.log("[FreshPip] Drag and resizers set up.");
    }
  }, []);

  // IMPORTANT: Set an initial inline zIndex for new FreshPip containers.
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
    overflow: "hidden",
    zIndex: DEFAULT_FALLBACK_ZINDEX  // Start with a high default inline z-index.
  };

  const mergedStyle = { ...defaultPipStyle, ...customStyle };

  return (
    h(
      "div",
      {
        ref: containerRef,
        className: "fresh-pip",
        style: mergedStyle
      },
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
      LoadedComponent
        ? h(LoadedComponent, {
            style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }
          })
        : h(
            "div",
            {
              style: { 
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
                color: "white", textAlign: "center", lineHeight: mergedStyle.height 
              }
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
  characterFile = "ScreenResizing.component.v8.md",
  characterComponent = "ViewComponent"
}) => {
  const [activeMode, setActiveMode] = useState(allowedScreenModes.includes(initialMode) ? initialMode : "default");

  const toggleMode = (mode) => {
    //console.log("[ScreenModeHelper] Toggling mode. Current mode:", activeMode, "Requested mode:", mode);
    let newMode = activeMode;
    if (mode === "pip") {
      if (activeMode === "pip") {
        newMode = "default";
        resetScreenMode(containerRef.current, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
      } else {
        newMode = "pip";
        applyScreenMode("pip", containerRef.current, originalParentRefForWindow, originalParentRefForPiP, defaultStyle);
      }
    } else if (mode === "character") {
      spawnCustomPiP(characterFile, "ViewComponent", characterComponent);
      return;
    } else if (mode === "browser") {
      if (activeMode === "browser") {
        newMode = "default";
        resetScreenMode(containerRef.current, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
      } else {
        newMode = "browser";
        applyScreenMode("browser", containerRef.current, originalParentRefForWindow, originalParentRefForPiP, defaultStyle);
      }
    } else if (mode === "window") {
      if (activeMode === "window") {
        newMode = "default";
        resetScreenMode(containerRef.current, defaultStyle, originalParentRefForWindow, originalParentRefForPiP);
      } else {
        newMode = "window";
        applyScreenMode("window", containerRef.current, originalParentRefForWindow, originalParentRefForPiP, defaultStyle);
      }
    }
    setActiveMode(newMode);
    //console.log("[ScreenModeHelper] Mode toggled. New mode:", newMode);
  };

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
            } else if (activeMode === "window" || activeMode === "browser") {
              scalingFactor = 1 / (window.devicePixelRatio || 1);
            } else {
              const baseWidth = 400;
              scalingFactor = baseWidth / width;
              scalingFactor = Math.max(0.25, Math.min(scalingFactor, 1));
              scalingFactor = scalingFactor / (window.devicePixelRatio || 1);
              scalingFactor = Math.max(0.001, scalingFactor);
            }
            engine.setHardwareScalingLevel(scalingFactor);
            engine.resize();
            //console.log("[ResizeObserver] Updated engine scaling level:", scalingFactor, "for width:", width);
          });
        }, 300);
      });
      observer.observe(containerRef.current);
      //console.log("[ResizeObserver] Observer attached to container.");
    }
    return () => {
      if (observer && containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [containerRef, engine, activeMode]);

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

  useEffect(() => {
    if (helperRef) {
      helperRef.current = { toggleMode, spawnCustomPiP };
      //console.log("[ScreenModeHelper] Helper reference updated.");
    }
  }, [helperRef, toggleMode]);

  function spawnCustomPiP(filePath, header, functionName, options = {}) {
    //console.log("[spawnCustomPiP] Spawning custom PiP for", { filePath, header, functionName, options });
    updateHighestZIndex();
    highestZIndex = Math.max(highestZIndex, 9999);
    highestZIndex++;
    const hostDiv = document.createElement("div");
    hostDiv.classList.add("fresh-pip");
    hostDiv.style.position = "fixed";
    document.body.appendChild(hostDiv);
   // console.log("[spawnCustomPiP] Host div appended to document.body. Initial inline zIndex (pre-update):", hostDiv.style.zIndex);
  
    const closeFreshPiP = () => {
      render(null, hostDiv);
      if (hostDiv.parentNode) hostDiv.parentNode.removeChild(hostDiv);
      //console.log("[spawnCustomPiP] Fresh Pip closed.");
    };
  
    const defaultCustomStyle = {
      width: "440px",
      height: "330px",
      top: "calc(100% - 330px - 10px)",
      left: "calc(100% - 440px - 10px)"
    };
  
    const customStyle = { ...defaultCustomStyle, ...options };
  
    render(
      h(FreshPip, { onClose: closeFreshPiP, filePath, header, functionName, customStyle }),
      hostDiv
    );
    let forced = hostDiv.offsetHeight;
    //console.log("[spawnCustomPiP] Forced reflow value for host div:", forced);
    bringToFront(hostDiv, 9999);
  
    setTimeout(() => {
      const computed = window.getComputedStyle(hostDiv);
      const topVal = parseFloat(computed.top) || 0;
      const leftVal = parseFloat(computed.left) || 0;
      hostDiv.style.top = `${topVal + 1}px`;
      hostDiv.style.left = `${leftVal + 1}px`;
      //console.log("[spawnCustomPiP] Fake move applied. New position:", hostDiv.style.top, hostDiv.style.left);
      setTimeout(() => {
        hostDiv.style.top = `${topVal}px`;
        hostDiv.style.left = `${leftVal}px`;
        //console.log("[spawnCustomPiP] Fake move reverted. Reverted to position:", hostDiv.style.top, hostDiv.style.left);
      }, 50);
    }, 0);
  
    //console.log("[spawnCustomPiP] Spawned custom PiP with final inline zIndex:", hostDiv.style.zIndex);
  }
  
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

# LoadScript

```jsx
/**
 * Loads a script either from a URL (with caching) or a local vault path.
 * If the source is a URL, it attempts to fetch the script, cache it locally
 * within the vault's adapter storage (e.g., .datacore/script_cache/),
 * and then loads it from the cache. Subsequent loads for the same URL
 * will use the cached version directly.
 *
 * @param {string} src - The URL or local vault path of the script.
 * @param {Function} [onload] - Optional callback function to execute when the script loads successfully.
 * @param {Function} [onerror] - Optional callback function to execute if loading fails.
 * @returns {Promise<HTMLScriptElement>} A promise that resolves with the script element when loaded, or rejects on error.
 */
async function loadScript(src, onload, onerror) {
  // Define a cache directory within Obsidian's hidden folder structure
  // Note: Using '.datacore' as an example, adjust if your plugin uses a different hidden dir
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
        onload(); // Call the original onload callback
      }
      resolve(scriptElement); // Resolve the promise with the script element
    } catch (execError) {
      console.error(`Error executing script content from ${src}:`, execError);
      if (onerror) {
        onerror(execError); // Call the original onerror callback
      }
      reject(execError); // Reject the promise
    }
  };

  return new Promise(async (resolve, reject) => {
    const scriptElement = document.createElement("script");
    scriptElement.async = true; // Keep async behavior

    try {
      if (isUrl) {
        // --- URL Handling (Fetch & Cache) ---

        // Generate a safe filename from the URL
        // Replace protocol, slashes, and common unsafe characters
        const safeFilename = src
          .replace(/^https?:\/\//, '')
          .replace(/[\/\\?%*:|"<>]/g, '_') + ".js"; // Add .js extension
        const cachePath = `${cacheDir}/${safeFilename}`;

        let scriptText = null;

        // 1. Check if the cached file exists
        const adapter = app.vault.adapter; // Get the adapter
        const cachedExists = await adapter.exists(cachePath);

        if (cachedExists) {
          // 2a. Load from cache
          console.log(`Loading script from cache: ${cachePath}`);
          try {
            scriptText = await adapter.read(cachePath);
          } catch (readError) {
            console.warn(`Failed to read cache file ${cachePath}, attempting refetch. Error:`, readError);
            // Proceed to fetch if cache read fails
          }
        }

        // 2b. Fetch from network if not cached or cache read failed
        if (scriptText === null) {
          console.log(`Fetching script from network: ${src}`);
          const response = await fetch(src);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${src}`);
          }
          scriptText = await response.text();

          // 3. Write to cache
          try {
            // Ensure cache directory exists
            if (!(await adapter.exists(cacheDir))) {
              console.log(`Creating script cache directory: ${cacheDir}`);
              await adapter.mkdir(cacheDir);
            }
            console.log(`Writing script to cache: ${cachePath}`);
            await adapter.write(cachePath, scriptText);
          } catch (writeError) {
            // Log warning but proceed, as we have the script content anyway
            console.warn(`Failed to write script to cache ${cachePath}. Error:`, writeError);
          }
        }

        // 4. Execute the script content
        executeScriptContent(scriptText, resolve, reject, scriptElement);

      } else {
        // --- Local Vault Path Handling ---
        console.log(`Loading script from local vault path: ${src}`);
        const adapter = app.vault.adapter;
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
      // Ensure script element is removed if appended prematurely or not needed
      if (scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      if (onerror) {
        onerror(error); // Call the original onerror callback
      }
      reject(error); // Reject the promise
    }
  });
}

return { loadScript };

```


# Multiplayer

```jsx
// Multiplayer.js (BroadcastChannel Version - Fixed Cleanup Order)
const fileName = "WorldBuilder.component.v4.1.md";

const Multiplayer = (() => {
  const CHANNEL_NAME = "obsidian-world-builder-sync";

  function initialize({ scene, canvasRef, characterComponents }) {
    return new Promise((resolve, reject) => {
      // --- Initial Checks ---
      if (typeof BroadcastChannel === "undefined") {
        //console.error("Multiplayer: BroadcastChannel API not supported.");
        return reject(new Error("BroadcastChannel not supported."));
      }
      if (!scene || scene.isDisposed) {
        // console.error("Multiplayer: Scene is invalid or disposed during initialization.");
         return reject(new Error("Invalid scene for Multiplayer init."));
      }
      // Optional check for characterComponents if strictly required at init
      // if (!characterComponents) { ... }

      const instanceId = crypto.randomUUID();
      const logPrefix = `Multiplayer [${instanceId.slice(-6)}]:`;
      //console.log(`${logPrefix} Initializing...`);

      let channel = null;
      let isCleanedUp = false; // Flag to prevent multiple cleanups
      let stateSendInterval = null;
      let pruneInterval = null;
      let beforeRenderObserver = null;
      let sceneDisposeObserver = null; // To track the observer added *by* this module

      const remotePlayers = new Map();

      try {
          channel = new BroadcastChannel(CHANNEL_NAME);
          //console.log(`${logPrefix} BroadcastChannel "${CHANNEL_NAME}" created.`);
      } catch (err) {
          console.error(`${logPrefix} Failed to create BroadcastChannel:`, err);
          // Ensure potential partial resources are cleaned if channel fails
          // (though unlikely anything substantial exists yet)
          isCleanedUp = true; // Mark as cleaned up to prevent further actions
          reject(new Error(`Failed to create BroadcastChannel: ${err.message}`));
          return; // Stop execution
      }

      // --- Cleanup Function ---
      // Defined FIRST so it can be referenced by observers etc.
      const cleanup = () => {
         if (isCleanedUp) {
              // console.log(`${logPrefix} Cleanup already called.`); // Keep logs minimal
              return;
         }
         isCleanedUp = true; // Set flag immediately to prevent re-entry and stop processing
         //console.log(`${logPrefix} Cleaning up multiplayer instance...`);

         // --- FIX: Detach listener and close channel EARLY ---
         if (channel) {
             //console.log(`${logPrefix} Detaching BroadcastChannel listeners...`);
             channel.onmessage = null;       // Remove the listener FIRST to stop receiving messages
             channel.onmessageerror = null;  // Remove error listener too
             // We'll close the channel later after attempting to send PLAYER_LEFT
         } else {
              console.log(`${logPrefix} Channel was already null during cleanup.`);
         }
         // --- End Fix ---

         // Stop intervals
         if (stateSendInterval) {
            clearInterval(stateSendInterval); stateSendInterval = null;
            console.log(`${logPrefix} State send interval cleared.`);
         }
         if (pruneInterval) {
            clearInterval(pruneInterval); pruneInterval = null;
            console.log(`${logPrefix} Prune interval cleared.`);
         }


         // Remove observers - Safely check if scene still exists and observers are valid
         // Note: The scene might be disposed already if cleanup was triggered by scene.dispose
         if (scene && !scene.isDisposed()) {
             if (beforeRenderObserver) {
                 scene.onBeforeRenderObservable.remove(beforeRenderObserver);
                 beforeRenderObserver = null;
                 console.log(`${logPrefix} BeforeRender observer removed.`);
             }
             // Remove the specific observer added by *this* initialize function
             if (sceneDisposeObserver) {
                 scene.onDisposeObservable.remove(sceneDisposeObserver);
                 sceneDisposeObserver = null;
                 console.log(`${logPrefix} Internal SceneDispose observer removed.`);
             }
         } else {
             console.log(`${logPrefix} Scene already disposed or null, skipping observer removal.`);
         }
         // Clear local observer variables regardless
         beforeRenderObserver = null;
         sceneDisposeObserver = null;


         // Attempt to notify others (best effort, might fail if channel is closing/closed)
         const leaveMessage = { type: "PLAYER_LEFT", senderId: instanceId };
         try {
             if (channel && typeof channel.postMessage === 'function') {
                // console.log(`${logPrefix} Attempting to send PLAYER_LEFT message...`); // Reduce noise
                channel.postMessage(leaveMessage);
             }
         } catch (err) {
             // This error is more likely now, and acceptable.
             console.warn(`${logPrefix} Could not send leave message during cleanup (may be expected if channel closing):`, err.message);
         } finally {
             // --- Close channel definitively here ---
             if (channel) {
                 console.log(`${logPrefix} Closing BroadcastChannel.`);
                 channel.close();
                 channel = null; // Nullify reference
             }
         }


         // Dispose all remote player meshes
         //console.log(`${logPrefix} Disposing ${remotePlayers.size} remote player meshes...`);
         remotePlayers.forEach((playerData, playerId) => {
              if (playerData.mesh && !playerData.mesh.isDisposed()) {
                 // console.log(`${logPrefix} Disposing mesh for remote player ${playerId.slice(-6)}`); // Reduce noise
                 playerData.mesh.dispose();
              }
         });
         remotePlayers.clear(); // Clear the map
         console.log(`${logPrefix} Remote players map cleared.`);

         // Nullify other potential references if needed (though component unmount handles scope)
         // scene = null; // Scene reference comes from outside
         // characterComponents = null; // Ref comes from outside

         //console.log(`${logPrefix} Multiplayer cleanup finished.`);
      };


      // --- Mesh Creation ---
      // (No changes needed in this function)
      const getOrCreateRemotePlayerMesh = (playerId, initialState) => {
         if (isCleanedUp) { console.warn(`${logPrefix} getOrCreateRemotePlayerMesh called after cleanup.`); return null; }
         if (!scene || scene.isDisposed) {
             console.error(`${logPrefix} getOrCreateRemotePlayerMesh: Scene is disposed! Player ID: ${playerId}`);
             return null;
         }
         if (remotePlayers.has(playerId)) {
             return remotePlayers.get(playerId).mesh;
         }

         //console.log(`${logPrefix} Creating mesh for remote player ${playerId.slice(-6)}`);
         // ... (rest of mesh creation logic is fine) ...
         const remoteCapsule = window.BABYLON.MeshBuilder.CreateCapsule(
            `remotePlayer_${playerId}`,
            { height: 1.8, radius: 0.6, subdivisions: 4 },
            scene
         );
         remoteCapsule.isVisible = true;
         const startPos = new window.BABYLON.Vector3(0, 5, 0); // Default start pos
         if (initialState?.position) {
             try {
                 // Ensure position data is valid before copying
                 startPos.copyFromFloats(initialState.position.x, initialState.position.y + 0.1, initialState.position.z); // Start slightly above reported pos
             } catch (posError) {
                  console.warn(`${logPrefix} Error applying initial position for ${playerId.slice(-6)}:`, posError);
                  // Keep default startPos
             }
         }
         remoteCapsule.position = startPos;


         const material = new window.BABYLON.StandardMaterial(`remotePlayerMat_${playerId}`, scene);
         material.diffuseColor = new window.BABYLON.Color3(0.1, 0.2, 0.8); // Blueish
         material.emissiveColor = new window.BABYLON.Color3(0.1, 0.2, 0.8); // Glow slightly
         material.alpha = 0.85; // Slightly transparent
         remoteCapsule.material = material;
         remoteCapsule.checkCollisions = false; // Remote players don't collide locally
         remoteCapsule.isPickable = false; // Not interactable


         remotePlayers.set(playerId, {
            mesh: remoteCapsule,
            targetPosition: remoteCapsule.position.clone(),
            targetRotation: initialState?.rotation || 0, // Use provided or default
            lastUpdateTime: Date.now()
         });
          //console.log(`${logPrefix} Mesh created for ${playerId.slice(-6)}. Total remote players: ${remotePlayers.size}`);
         return remoteCapsule;
      };


      // --- State Sending ---
      // (No changes needed in this function)
      const sendPlayerState = () => {
        // Added check for characterComponents validity within the interval
        if (isCleanedUp || !channel || !characterComponents?.displayCapsule || !characterComponents?.camera) {
            // If cleanup started or components missing, stop sending
            // console.log(`${logPrefix} Skipping sendPlayerState (cleaned up or components missing).`); // Reduce noise
            return;
        }
        if (!scene || scene.isDisposed) {
            console.warn(`${logPrefix} sendPlayerState: Scene disposed, triggering cleanup.`);
            cleanup(); // Trigger cleanup if scene disappears unexpectedly
            return;
        }
        try {
            const position = characterComponents.displayCapsule.position;
            const rotation = characterComponents.camera.rotation.y; // Assuming Y is yaw
            const message = {
                type: "UPDATE_STATE",
                senderId: instanceId,
                timestamp: Date.now(), // Optional: add timestamp
                payload: {
                  position: { x: position.x, y: position.y, z: position.z },
                  rotation: rotation
                }
            };
            channel.postMessage(message);
        } catch (err) {
             console.error(`${logPrefix} Error sending state:`, err);
             // Consider stopping interval or attempting reconnect on specific errors
             if (err.name === 'InvalidStateError' && !isCleanedUp) {
                 console.error(`${logPrefix} BroadcastChannel seems closed unexpectedly. Triggering cleanup.`);
                 cleanup();
             }
        }
      };


      // --- Message Handling ---
      channel.onmessage = (event) => {
        // GUARD CLAUSE: Check if cleanup has started or scene is invalid
        // This check is still useful, even with early detachment, as a safety net.
        if (isCleanedUp || !scene || scene.isDisposed) {
           // *** Keep the warning or remove it? Let's comment it out for now to reduce noise ***
           // console.warn(`${logPrefix} Received message but scene is disposed or cleanup initiated. Ignoring.`);
           // If somehow cleanup didn't run, try again.
           if (!isCleanedUp) cleanup();
           return;
        }

        const message = event.data;
        // Ignore messages without senderId or from self
        if (!message || !message.senderId || message.senderId === instanceId) return;

        // console.log(`${logPrefix} Received message type "${message.type}" from ${message.senderId.slice(-6)}`); // Reduce noise

        const now = Date.now();
        const senderId = message.senderId;

        // Process message based on type
        switch (message.type) {
          case "UPDATE_STATE": {
            const payload = message.payload;
            if (!payload || !payload.position) {
                console.warn(`${logPrefix} Received invalid UPDATE_STATE from ${senderId.slice(-6)}:`, payload);
                break;
            }

            let playerData = remotePlayers.get(senderId);

            // If player not seen before, create their mesh
            if (!playerData) {
                // console.log(`${logPrefix} First state update from ${senderId.slice(-6)}. Creating mesh...`); // Reduce noise
                const newMesh = getOrCreateRemotePlayerMesh(senderId, payload);
                if (!newMesh) {
                     // Error already logged in getOrCreate...
                     console.error(`${logPrefix} Failed to create mesh for ${senderId.slice(-6)} in onmessage.`);
                     break; // Don't proceed if mesh creation failed
                }
                playerData = remotePlayers.get(senderId); // Get the newly created data
                 if (!playerData) {
                    // This should ideally not happen if mesh creation succeeded and map was set
                    console.error(`${logPrefix} CRITICAL: Failed to get playerData after successful mesh creation for ${senderId.slice(-6)}!`);
                    break;
                 }
            }

            // Update target state for interpolation
            // Ensure data types are correct
            try {
                playerData.targetPosition = new window.BABYLON.Vector3(payload.position.x, payload.position.y, payload.position.z);
                playerData.targetRotation = (typeof payload.rotation === 'number') ? payload.rotation : playerData.targetRotation; // Keep old rotation if new is invalid
                playerData.lastUpdateTime = now;
            } catch (updateErr) {
                 console.warn(`${logPrefix} Error applying state update for ${senderId.slice(-6)}:`, updateErr);
            }
            break;
          }

          case "PLAYER_LEFT": {
            //console.log(`${logPrefix} Received PLAYER_LEFT from ${senderId.slice(-6)}.`);
            const playerData = remotePlayers.get(senderId);
            if (playerData) {
              if (playerData.mesh && !playerData.mesh.isDisposed()) {
                   playerData.mesh.dispose();
              }
              remotePlayers.delete(senderId);
              console.log(`${logPrefix} Removed player ${senderId.slice(-6)}. Total remote: ${remotePlayers.size}`);
            } else {
                 // console.log(`${logPrefix} Received PLAYER_LEFT for unknown/already removed player ${senderId.slice(-6)}.`); // Reduce noise
            }
            break;
          }
          default:
              // console.log(`${logPrefix} Received unknown message type "${message.type}" from ${senderId.slice(-6)}.`); // Reduce noise
        }
      };

      channel.onmessageerror = (event) => {
        // Only log if cleanup hasn't started
        if (!isCleanedUp) {
            console.error(`${logPrefix} BroadcastChannel message error:`, event);
        }
      };

      // --- Intervals & Observers ---
      const updateIntervalMs = 100; // Send state 10 times per second
      stateSendInterval = setInterval(sendPlayerState, updateIntervalMs);

      // Interpolation observer
      const interpolationFactor = 0.15; // Adjust for smoother/snappier movement
      if (scene && !scene.isDisposed) { // Check scene validity before adding observer
           beforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
              if (isCleanedUp || !scene || scene.isDisposed) return; // Extra safety check

              remotePlayers.forEach((playerData, playerId) => {
                    if (!playerData.mesh || playerData.mesh.isDisposed()) {
                        // Mesh might have been disposed by PLAYER_LEFT or prune, remove from map
                        // console.warn(`${logPrefix} Interpolation: Mesh for ${playerId.slice(-6)} disposed. Removing.`); // Reduce noise
                        remotePlayers.delete(playerId);
                        return; // Skip to next player
                    }
                    // Interpolate position
                    if (playerData.targetPosition) {
                        playerData.mesh.position = window.BABYLON.Vector3.Lerp(
                            playerData.mesh.position,
                            playerData.targetPosition,
                            interpolationFactor
                        );
                    }
                    // Interpolate rotation (Y-axis only for capsule yaw)
                    if (playerData.targetRotation !== undefined) {
                        // Use Scalar.LerpAngle for correct angle interpolation (handles wrapping)
                        playerData.mesh.rotation.y = window.BABYLON.Scalar.LerpAngle(
                            playerData.mesh.rotation.y,
                            playerData.targetRotation,
                            interpolationFactor
                        );
                    }
              });
           });
           console.log(`${logPrefix} Interpolation observer added.`);
      } else {
          // console.error(`${logPrefix} Cannot add interpolation observer, scene invalid at init! This multiplayer instance may not function correctly.`);
           // Consider rejecting the promise if this observer is critical?
      }

      // Pruning interval for stale players
      const staleTimeoutMs = 10000; // 10 seconds
      pruneInterval = setInterval(() => {
          if (isCleanedUp) return; // Don't prune if cleaning up
          const now = Date.now();
          remotePlayers.forEach((playerData, playerId) => {
                if (now - playerData.lastUpdateTime > staleTimeoutMs) {
                    console.warn(`${logPrefix} Pruning stale player ${playerId.slice(-6)} (Last update: ${new Date(playerData.lastUpdateTime).toLocaleTimeString()}).`);
                    if (playerData.mesh && !playerData.mesh.isDisposed()) {
                         playerData.mesh.dispose();
                    }
                    remotePlayers.delete(playerId);
                }
          });
      }, staleTimeoutMs / 2); // Check every 5 seconds

      // Hook *local* cleanup into scene disposal using addOnce
      if (scene && !scene.isDisposed) {
          // Store the observer reference locally so we can remove it in cleanup
          sceneDisposeObserver = scene.onDisposeObservable.addOnce(() => {
              console.log(`${logPrefix} Scene dispose triggered internal cleanup.`);
              cleanup(); // Call the main cleanup function
              sceneDisposeObserver = null; // Clear the local ref after it fires
          });
          console.log(`${logPrefix} Added scene dispose observer for automatic cleanup.`);
      } else {
           console.warn(`${logPrefix} Scene invalid at init, cannot add dispose observer. Manual cleanup required.`);
      }


      // --- Resolve Promise ---
      //console.log(`${logPrefix} Initialization successful.`);
      resolve({
        isBroadcastChannel: true,
        instanceId: instanceId,
        cleanup: cleanup // Resolve with the specific cleanup function for this instance
      });

    }); // End Promise constructor
  } // End initialize function

  return { initialize };
})(); // End Multiplayer IIFE

return { Multiplayer };
```




# PreventDefaultInputs

```jsx
const { useEffect, useRef, useState } = dc;

function preventDefaultInputs({ viewRef }) {
  const [isFocused, setIsFocused] = useState(false);
  const originalCommandsRef = useRef(null);
  const originalExecuteCommandRef = useRef(null);
  const originalExecuteRef = useRef(null);

  const handleKeyDown = (event) => {
    if (!isFocused) return; // Only block when focused

    // Block all modifier key events (Ctrl, Meta, Alt)
    if (event.metaKey || event.ctrlKey || event.altKey) {
      //console.log('PreventDefaultInputs: Blocking modifier key event', event.key);
      event.stopPropagation();
      event.preventDefault();
      if (viewRef.current) {
        viewRef.current.focus();
      }
      return;
    }

    // Block all key events within the scene to prevent command triggers
    if (viewRef.current && viewRef.current.contains(event.target)) {
      //console.log('PreventDefaultInputs: Blocking key event within scene', event.key);
      event.stopPropagation();
      event.preventDefault();
      viewRef.current.focus();
    }
  };

  const handleFocus = () => {
    if (!dc.app || !dc.app.commands) {
      console.warn('PreventDefaultInputs: dc.app or dc.app.commands unavailable');
      return;
    }
    setIsFocused(true);
    //console.log('PreventDefaultInputs: Component focused, applying blocking');

    // Store original command state
    if (!originalCommandsRef.current) {
      originalCommandsRef.current = { ...dc.app.commands.commands } || {};
      //console.log('PreventDefaultInputs: Stored original commands', originalCommandsRef.current);
    }
    if (!originalExecuteCommandRef.current) {
      originalExecuteCommandRef.current = dc.app.commands.executeCommandById;
      //console.log('PreventDefaultInputs: Stored original executeCommandById');
    }
    if (!originalExecuteRef.current) {
      originalExecuteRef.current = dc.app.commands.execute;
      //console.log('PreventDefaultInputs: Stored original execute');
    }

    // Disable all commands
    dc.app.commands.commands = {};
    //console.log('PreventDefaultInputs: Commands registry cleared', dc.app.commands.commands);

    // Override executeCommandById to block all commands
    dc.app.commands.executeCommandById = (commandId) => {
      //console.log('PreventDefaultInputs: Blocking command:', commandId);
      return false;
    };

    // Override execute to block all commands
    dc.app.commands.execute = (command) => {
      //console.log('PreventDefaultInputs: Blocking command via execute:', command?.id);
      return false;
    };

    // Add keydown listener
    document.addEventListener('keydown', handleKeyDown, { capture: true });
  };

  const handleBlur = () => {
    setIsFocused(false);
    //console.log('PreventDefaultInputs: Component blurred, removing blocking');

    // Restore commands
    if (dc.app && dc.app.commands) {
      if (originalCommandsRef.current) {
        dc.app.commands.commands = { ...originalCommandsRef.current };
        //console.log('PreventDefaultInputs: Restored commands', dc.app.commands.commands);
      } else {
        console.warn('PreventDefaultInputs: No original commands to restore');
      }
      if (originalExecuteCommandRef.current) {
        dc.app.commands.executeCommandById = originalExecuteCommandRef.current;
        //console.log('PreventDefaultInputs: Restored executeCommandById');
      } else {
        console.warn('PreventDefaultInputs: No original executeCommandById to restore');
      }
      if (originalExecuteRef.current) {
        dc.app.commands.execute = originalExecuteRef.current;
        //console.log('PreventDefaultInputs: Restored execute');
      } else {
        console.warn('PreventDefaultInputs: No original execute to restore');
      }
    } else {
      console.warn('PreventDefaultInputs: dc.app or dc.app.commands unavailable during restore');
    }

    // Remove keydown listener
    document.removeEventListener('keydown', handleKeyDown, { capture: true });
  };

  useEffect(() => {
    // Validate dc.app
    if (!dc.app) {
      console.warn('PreventDefaultInputs: dc.app is not available');
      return;
    }
    if (!dc.app.commands) {
      console.warn('PreventDefaultInputs: dc.app.commands is undefined', dc.app);
      return;
    }
    //console.log('PreventDefaultInputs: Using dc.app', dc.app);

    // Add focus and blur listeners to viewRef
    const viewElement = viewRef.current;
    if (viewElement) {
      viewElement.addEventListener('focus', handleFocus, { capture: true });
      viewElement.addEventListener('blur', handleBlur, { capture: true });
      //console.log('PreventDefaultInputs: Added focus/blur listeners to viewRef');
    } else {
      console.warn('PreventDefaultInputs: viewRef.current is null, cannot add focus/blur listeners');
    }

    // Cleanup
    return () => {
      if (viewElement) {
        viewElement.removeEventListener('focus', handleFocus, { capture: true });
        viewElement.removeEventListener('blur', handleBlur, { capture: true });
        //console.log('PreventDefaultInputs: Removed focus/blur listeners from viewRef');
      }
      if (isFocused && dc.app && dc.app.commands) {
        dc.app.commands.commands = originalCommandsRef.current ? { ...originalCommandsRef.current } : {};
        dc.app.commands.executeCommandById = originalExecuteCommandRef.current || dc.app.commands.executeCommandById;
        dc.app.commands.execute = originalExecuteRef.current || dc.app.commands.execute;
        document.removeEventListener('keydown', handleKeyDown, { capture: true });
        //console.log('PreventDefaultInputs: Cleanup - Commands restored', dc.app.commands.commands);
      }
    };
  }, [viewRef]); // Include viewRef in dependencies to handle ref changes

  return { handleFocus, handleBlur, handleKeyDown };
}

return { preventDefaultInputs };
```