



# ViewComponent


```jsx

// Ensure 'dc' is available in the environment where this component runs.
const { useRef, useEffect, useState } = dc;

function WorldView() {
  const canvasRef = useRef(null); // Ref for the canvas element
  const [engine, setEngine] = useState(null); // State to hold the Babylon.js engine instance
  const [scene, setScene] = useState(null);   // State to hold the Babylon.js scene instance
  const [refreshKey, setRefreshKey] = useState(0);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true; // Load script asynchronously
      script.onload = () => {
        console.log(`Script loaded successfully: ${src}`);
        resolve(script);
      };
      script.onerror = (e) => {
        console.error(`Error loading script: ${src}`, e);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.body.appendChild(script); // Append script to the body to start loading
    });
  };

  const initBabylon = async () => {
    // Check if canvas is available and Babylon.js core/loaders are loaded.
    if (!canvasRef.current || !window.BABYLON || !window.BABYLON.SceneLoader) {
      console.error("initBabylon: Canvas reference is missing, or Babylon.js / Loaders are not fully loaded yet. Skipping initialization.");
      // Return a no-op cleanup function if initialization cannot proceed.
      return () => { console.log("Babylon initialization failed, no cleanup needed."); };
    }

    console.log("Initializing Babylon.js scene...");

    // Create a Babylon.js engine instance
    const babylonEngine = new window.BABYLON.Engine(
      canvasRef.current,
      true, // enable antialiasing
      { preserveDrawingBuffer: true, stencil: true }
    );
    // Create a new scene
    const babylonScene = new window.BABYLON.Scene(babylonEngine);

    // Setup ArcRotateCamera
    const camera = new window.BABYLON.ArcRotateCamera(
      "Camera",
      -Math.PI / 2, // alpha (initial rotation around Y-axis)
      Math.PI / 2.5, // beta (initial rotation around X-axis)
      10, // initial radius (distance from target) - set to 10 as per example
      window.BABYLON.Vector3.Zero(), // target (center of scene)
      babylonScene
    );
    camera.attachControl(canvasRef.current, true); // Attach camera controls to the canvas
    camera.minZ = 0.1; // Prevent clipping close to the camera
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 10;
    const rotationSpeed = 0.008; // Adjust this value for faster/slower horizontal panning

    babylonScene.clearColor = new window.BABYLON.Color4(0, 0, 0, 1); // Set clear color (background) to black

    // Create a default environment (for lighting and reflections, though skybox/ground disabled)
    babylonScene.createDefaultEnvironment({
        createSkybox: false,
        enableGround: false,
        createGround: false,
        environmentTexture: "https://assets.babylonjs.com/environments/studio.env", // Studio HDR for reflections
        intensity: 1.2, // Environment light intensity
    });

    // Add a directional light for better model illumination
    const directionalLight = new window.BABYLON.DirectionalLight(
      "directionalLight",
      new window.BABYLON.Vector3(0.5, -1, 0.5), // Direction of the light (e.g., from top-right-front)
      babylonScene
    );
    directionalLight.intensity = 1.5; // Light intensity
    directionalLight.diffuse = new window.BABYLON.Color3(1.0, 0.95, 0.9); // Slightly warm light color

    // --- GLB Model Loading ---
    const modelPath = "_RESOURCES/GLB/b26.card.888.glb";
    try {
      // Use dc.app.vault.adapter.getResourcePath to get the correct local path for the GLB file.
      const assetUrl = dc.app.vault.adapter.getResourcePath(modelPath);
      console.log("Attempting to load GLB from:", assetUrl);

      // Import the GLB model
      const result = await window.BABYLON.SceneLoader.ImportMeshAsync(
        null, // meshesNames - null imports all
        "",   // rootUrl - empty string if assetUrl is full path
        assetUrl,
        babylonScene
      );

      if (result.meshes && result.meshes.length > 0) {
        // Find the main mesh to scale and center
        let mainModelMesh = result.meshes.find(m => m.getTotalVertices() > 0 && m.name !== "__root__");
        if (!mainModelMesh) {
            // Fallback if no main mesh found with vertices (e.g., if only one mesh is loaded)
            mainModelMesh = result.meshes[0];
        }

        mainModelMesh.position = window.BABYLON.Vector3.Zero(); // Position at origin

        // Scale the model
        mainModelMesh.scaling = new window.BABYLON.Vector3(2.5, 3.5, 3.5);
        console.log(`GLB model loaded successfully: ${mainModelMesh.name} and scaled by 3.5x.`);

        // Adjust camera to fit the model (will be clamped by lower/upperRadiusLimit if they are restrictive)
        const boundingInfo = mainModelMesh.getBoundingInfo();
        if (boundingInfo) {
            const center = boundingInfo.boundingSphere.center;
            const radius = boundingInfo.boundingSphere.radius;

            camera.setTarget(center); // Set camera target to model's center
            camera.radius = radius * 7.7; // Adjust camera distance based on model size
            console.log(`Camera target adjusted to model center. Attempted radius: ${radius * 7.7}. Actual radius (clamped): ${camera.radius}`);
        } else {
            console.warn("Bounding info not found for main model mesh, using default camera settings.");
            camera.setTarget(window.BABYLON.Vector3.Zero());
            // camera.radius will remain 10 due to initial limits
        }

      } else {
        console.warn("GLB loaded, but no meshes found in the result (or only a root node without geometry).");
      }
    } catch (error) {
      console.error("Error loading GLB model:", error);
    }

    // Store engine and scene in state
    setEngine(babylonEngine);
    setScene(babylonScene);

    // --- NEW: Implement onPointerDown to change radius limits as per user's example ---
    babylonScene.onPointerDown = (e) => {
        // Check if it's a primary (left) mouse click
        if (e.button === 0) {
            camera.lowerRadiusLimit = 1;  // Allow zooming in closer
            camera.upperRadiusLimit = 15; // Allow zooming out further
            console.log("Camera radius limits changed to: lower=1, upper=15 on pointer down.");
            // If the camera was at radius 10, and model fitting set a different ideal radius,
            // the camera might snap to that ideal radius (if within 1-15) after the first click.
        }
    };

    // Start the Babylon.js render loop
    babylonEngine.runRenderLoop(() => {
      if (babylonScene.activeCamera) {
          // Automatic horizontal panning
          camera.alpha += rotationSpeed; // Increment alpha to rotate horizontally
          babylonScene.render(); // Render the scene
      }
    });

    // Handle window resizing
    window.addEventListener("resize", () => {
      babylonEngine.resize();
    });

    // Disable mouse wheel zoom for better control (or prevent accidental zoom)
    const canvas = canvasRef.current;
    const handleWheel = (e) => {
      e.preventDefault(); // Prevent default scroll behavior
    };

    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false }); // Add event listener
    }

    // Return a cleanup function for when the component unmounts or effect re-runs
    return () => {
      console.log("Cleaning up Babylon.js scene and engine");
      window.removeEventListener("resize", babylonEngine.resize); // Remove resize listener
      babylonEngine.stopRenderLoop(); // Stop the render loop
      if (babylonScene) babylonScene.dispose(); // Dispose of the scene
      if (babylonEngine) babylonEngine.dispose(); // Dispose of the engine
      setEngine(null); // Clear engine from state
      setScene(null);   // Clear scene from state

      if (canvas) {
        canvas.removeEventListener("wheel", handleWheel); // Remove wheel listener
      }
    };
  };

  // useEffect hook to manage the Babylon.js lifecycle
  useEffect(() => {
    let cleanupBabylon = () => {}; // Variable to hold the cleanup function returned by initBabylon
    const loadedScripts = []; // Array to keep track of dynamically loaded script elements

    const setupEnvironment = async () => {
      try {
        // Check if Babylon.js core and loaders are already available in the global scope.
        // This prevents redundant loading if the component remounts or refreshes.
        if (!window.BABYLON || !window.BABYLON.SceneLoader) {
            console.log("Loading Babylon.js core and loaders from CDN...");
            // Load Babylon.js core library
            loadedScripts.push(await loadScript("https://cdn.babylonjs.com/babylon.js"));
            // Load Babylon.js loaders (needed for GLB)
            loadedScripts.push(await loadScript("https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"));
            console.log("Babylon.js core and loaders loaded.");
        } else {
            console.log("Babylon.js and Loaders already present in global scope.");
        }

        // After attempting to load scripts, check again if Babylon.js is ready.
        if (window.BABYLON && window.BABYLON.SceneLoader) {
            cleanupBabylon = await initBabylon(); // Initialize Babylon.js and get its cleanup function
        } else {
            console.error("Babylon.js or SceneLoader is not available after script loading attempts. Please check CDN paths or network issues.");
        }

      } catch (error) {
        console.error("Failed to load Babylon.js scripts or initialize the scene:", error);
      }
    };

    setupEnvironment(); // Call the setup function

    // Cleanup function for the useEffect hook.
    // This runs when the component unmounts, or when the `refreshKey` changes (before the new effect runs).
    return () => {
      // Execute Babylon.js specific cleanup
      if (typeof cleanupBabylon === 'function') {
        cleanupBabylon();
      }
      // Remove any dynamically loaded script tags from the DOM
      loadedScripts.forEach(script => {
        if (script && script.parentElement) {
          document.body.removeChild(script);
        }
      });
      console.log("useEffect cleanup completed.");
    };
  }, [refreshKey]); // Dependency array: Effect re-runs when refreshKey changes

  return (
    <div style={{ position: "relative", width: "100%", height: "500px", overflow: "hidden" }}>
      {/* Canvas element where Babylon.js renders */}
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* Embedded CSS for the refresh button's styling and hover effect */}
      {/* This is placed directly in the JSX for self-contained component styling,
          but for larger projects, these styles would typically be in a separate CSS file. */}
      <style>
      {`
        /* Base styles for the refresh button */
        .refresh-button {
          background-color: #333; /* Dark grey */
          transition: background-color 0.3s ease, transform 0.1s ease; /* Smooth transition for hover effects */
          box-sizing: border-box; /* Include padding and border in the element's total width and height */
        }

        /* Hover effect: change background to dark purple and slightly enlarge */
        .refresh-button:hover {
          background-color: #6A0DAD; /* Dark purple on hover */
          transform: scale(1.05); /* Slightly enlarge on hover */
        }

        /* Active (click) effect: shrink slightly for tactile feedback */
        .refresh-button:active {
          transform: scale(0.95); /* Shrink slightly on click */
        }
      `}
      </style>

      {/* The Refresh Scene Button */}
      <button
        onClick={() => setRefreshKey(prevKey => prevKey + 1)} // Increment refreshKey to trigger re-initialization
        className="refresh-button" // Apply the CSS class defined above
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10, // Ensure the button is above the canvas
          width: "44px", // Fixed width for a square button
          height: "44px", // Fixed height for a square button
          borderRadius: "50%", // Makes the button circular
          border: "none", // Remove default button border
          display: "flex", // Use flexbox to center the icon inside
          justifyContent: "center", // Center horizontally
          alignItems: "center", // Center vertically
          cursor: "pointer", // Indicate clickable element
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.4)", // Add a subtle shadow
          color: "white", // Set icon color to white
          outline: "none", // Remove browser's default focus outline on click/focus
        }}
        aria-label="Refresh Scene" // Accessibility: label for screen readers
        title="Refresh Scene" // Tooltip on hover
      >
        {/* SVG Icon for Refresh (standard reload symbol) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor" // This makes the SVG inherit the 'color' property from its parent button
        >
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
      </button>
    </div>
  );
}

// In 'dc' environment, components are typically exported like this:
return { WorldView };
```