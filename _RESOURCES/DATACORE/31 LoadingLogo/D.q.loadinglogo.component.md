







# ViewComponent

```jsx
// Cache for loaded CDN scripts - persists across component instances
if (!window._cdnScriptCache) {
  window._cdnScriptCache = {
    scripts: {}, // { url: { loaded: true/false, promise: Promise, error: null/Error } }
  };
}

// A utility function to load external scripts with caching.
function loadScript(src, onload, onerror) {
  const cache = window._cdnScriptCache.scripts;
  
  // Check if script is already loaded
  if (cache[src]) {
    if (cache[src].loaded) {
      // Already loaded, call onload immediately
      if (onload) onload();
      return null;
    }
    if (cache[src].error) {
      // Previously failed to load
      if (onerror) onerror(cache[src].error);
      return null;
    }
    // Currently loading, attach to existing promise
    cache[src].promise.then(onload).catch(onerror);
    return null;
  }

  // Not in cache, create new script element
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  
  // Create promise for this load operation
  const loadPromise = new Promise((resolve, reject) => {
    script.onload = () => {
      cache[src].loaded = true;
      if (onload) onload();
      resolve();
    };
    script.onerror = (err) => {
      cache[src].error = err || new Error(`Failed to load script: ${src}`);
      console.error(`Failed to load script: ${src}`);
      if (onerror) onerror(cache[src].error);
      reject(cache[src].error);
    };
  });
  
  // Store in cache
  cache[src] = {
    loaded: false,
    promise: loadPromise,
    error: null
  };
  
  document.body.appendChild(script);
  return script;
}

// Fuzzy search for a file using Fuse.js and the Obsidian file index.
async function fuzzyFindFile(filename) {
  if (!window.Fuse) {
    await new Promise((resolve, reject) =>
      loadScript("https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js", resolve, reject)
    );
  }
  const files = app.vault.getFiles();
  const fuse = new Fuse(files, {
    keys: ["path"],
    includeScore: true,
    threshold: 0.4,
  });
  const results = fuse.search(filename);
  if (results.length > 0) {
    return results[0].item;
  }
  return files.find(f => f.path.endsWith(filename)) || null;
}

// Get an Obsidian resource path that the browser can use.
async function getMediaResourcePath(filename) {
  const file = await fuzzyFindFile(filename);
  if (!file) {
    throw new Error(`File containing "${filename}" not found in the vault.`);
  }
  return app.vault.getResourcePath(file);
}

// The main component to render the view.
function LoadingLogo() {
  const fileName = "BETO_Logo_T_Loading.svg";
  
  const [mediaSrc, setMediaSrc] = dc.useState(null);
  const [error, setError] = dc.useState(null);
  // NEW: State to track if the image has finished loading in the browser.
  const [isImageLoaded, setIsImageLoaded] = dc.useState(false);

  // Effect to find the file and get its resource path.
  dc.useEffect(() => {
    // Reset loaded state if the filename changes
    setIsImageLoaded(false); 
    
    getMediaResourcePath(fileName)
      .then((url) => {
        setMediaSrc(url);
      })
      .catch((err) => {
        console.error("Error loading media file:", err);
        setError(err.message);
      });
  }, [fileName]);

  // --- Rendering Logic ---
  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>
  }

  // We still render the <img> tag while it's loading, but keep it invisible.
  // This allows the browser to fetch the image in the background.
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      {mediaSrc && (
        <img
          src={mediaSrc}
          // The onLoad event fires when the image is fully downloaded.
          onLoad={() => setIsImageLoaded(true)}
          alt="BETO Logo Loading Animation"
          style={{
            width: "300px",
            height: "300px",
            // Use opacity and transition for a smooth fade-in effect.
            // It will be invisible (opacity: 0) until isImageLoaded becomes true.
            opacity: isImageLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out'
          }}
        />
      )}
    </div>
  );
}

return {LoadingLogo};
```

