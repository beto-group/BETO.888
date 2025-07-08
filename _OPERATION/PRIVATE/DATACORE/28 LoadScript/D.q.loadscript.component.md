



# ViewComponent

```jsx
const { loadScript } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/28 LoadScript/D.q.loadscript.component.md", "LoadScript"));

/**
 * Fetches an image from a URL and caches it in the vault for offline access.
 * On subsequent loads, it reads the image directly from the cache.
 *
 * @param {object} dc - The Datacore context object.
 * @param {string} url - The URL of the image to fetch.
 * @returns {Promise<string>} A promise that resolves with a local blob URL for the image.
 */
async function fetchAndCacheImage(dc, url) {
  const cacheDir = ".datacore/image_cache"; // A dedicated cache for images
  const adapter = dc.app.vault.adapter;

  // Create a safe filename from the URL
  const safeFilename = url.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_');
  const cachePath = `${cacheDir}/${safeFilename}`;

  // 1. Check if the cached file exists
  if (await adapter.exists(cachePath)) {
    console.log(`[Cache] Loading image from cache: ${cachePath}`);
    try {
      // Read the binary data from the vault
      const binaryData = await adapter.readBinary(cachePath);
      // Create a blob and a local URL from the cached data
      const blob = new Blob([binaryData]);
      return URL.createObjectURL(blob);
    } catch (readError) {
      console.warn(`[Cache] Failed to read cached image, re-fetching. Error:`, readError);
    }
  }

  // 2. If not cached, fetch from the network
  console.log(`[Network] Fetching image: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();

  // 3. Write the image to the cache for next time
  try {
    // Convert blob to ArrayBuffer, which writeBinary expects
    const buffer = await blob.arrayBuffer();
    if (!(await adapter.exists(cacheDir))) {
      await adapter.mkdir(cacheDir);
    }
    console.log(`[Cache] Writing image to cache: ${cachePath}`);
    // Use writeBinary for non-text files
    await adapter.writeBinary(cachePath, buffer);
  } catch (writeError) {
    console.warn(`[Cache] Failed to write image to cache: ${cachePath}`, writeError);
  }

  // 4. Return the blob URL for the current session
  return URL.createObjectURL(blob);
}


function View() {
  const globeRef = dc.useRef(null);
  const [ready, setReady] = dc.useState(false);
  // NEW: State to hold log messages for on-screen display
  const [logs, setLogs] = dc.useState([]);

  // NEW: Helper function to log both to the developer console and the on-screen display
  const logToView = (message, level = 'log') => {
    // Forward the log to the actual developer console
    console[level](message);
    // Update the on-screen logs state
    setLogs(prevLogs => {
      const newLog = { text: message, level: level, timestamp: new Date().toLocaleTimeString() };
      // Keep the last 8 logs to prevent the display from getting too cluttered
      return [...prevLogs, newLog].slice(-8);
    });
  };

  dc.useEffect(() => {
    async function setupGlobe() {
      // All previous console.* calls are now replaced with logToView
      logToView("[setupGlobe] Setup started.");

      if (!globeRef.current) {
        logToView("[setupGlobe] globeRef is null! Abort.", 'error');
        return;
      }
      
      logToView("Component rendered, preparing to load assets.");

      if (!window.Globe) {
        logToView("[setupGlobe] Globe.gl not found, loading script...");
        await loadScript(dc, "https://unpkg.com/globe.gl");
        logToView("[setupGlobe] Globe.gl script loaded.");
      } else {
        logToView("[setupGlobe] Globe.gl already loaded.");
      }
      
      logToView("[setupGlobe] Loading textures...");
      const [globeTexture, bumpTexture] = await Promise.all([
        fetchAndCacheImage(dc, "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"),
        fetchAndCacheImage(dc, "https://unpkg.com/three-globe/example/img/earth-topology.png")
      ]);
      logToView("[setupGlobe] Textures loaded. Creating globe instance...");

      const globe = Globe()(globeRef.current)
        .globeImageUrl(globeTexture)
        .bumpImageUrl(bumpTexture)
        .width(500)
        .height(500)
        .backgroundColor("rgba(0,0,0,0)"); // Set to transparent so the container's black shows through

      logToView("[setupGlobe] Globe created. Setting controls...");
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.5;

      logToView("[setupGlobe] Finished. Globe is ready!", 'info');
      setReady(true);
    }

    if (globeRef.current) {
      setupGlobe().catch((err) => {
        logToView(`[setupGlobe] FATAL ERROR: ${err.message}`, 'error');
      });
    } else {
      logToView("[useEffect] globeRef not ready, waiting for initial render...", 'warn');
    }
  }, []);

  // NEW: Style for the on-screen log container
  const logContainerStyle = {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    right: '10px',
    maxHeight: '140px',
    overflowY: 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '5px',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '12px',
    zIndex: 10,
    pointerEvents: 'none', // Allow clicks to pass through to the globe canvas
  };

  // NEW: Helper to get color based on log level
  const getLogStyle = (level) => {
    const style = { margin: 0, padding: '2px 0' };
    switch (level) {
      case 'error': style.color = '#ff8a8a'; break;
      case 'warn':  style.color = '#ffd182'; break;
      default:      style.color = '#a0e8a0'; break;
    }
    return style;
  };

  return (
    // The main container is now relative to position the log overlay correctly
    <div style={{ position: 'relative', width: "500px", height: "500px", backgroundColor: "#000000" }}>
      
      {/* The div where the globe library will render its canvas */}
      <div ref={globeRef} style={{ width: "100%", height: "100%" }} />

      {/* NEW: The on-screen "mini console" log viewer */}
      <div style={logContainerStyle}>
        {logs.length === 0 && <p style={getLogStyle('info')}>Initializing...</p>}
        {logs.map((log, index) => (
          <p key={index} style={getLogStyle(log.level)}>
            <span style={{opacity: 0.6}}>{log.timestamp} - </span>{log.text}
          </p>
        ))}
      </div>

    </div>
  );
}

return { View };
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