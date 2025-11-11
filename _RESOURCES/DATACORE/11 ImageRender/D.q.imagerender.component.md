





# ViewComponent

```jsx
// Import the cached loadScript function from the same file
const componentPath = dc.resolvePath("D.q.imagerender.component");
const { loadScript } = await dc.require(dc.headerLink(componentPath, "LoadScript"));

// Fuzzy search for a file using Fuse.js and the Obsidian file index
async function fuzzyFindFile(filename) {
  // Ensure Fuse is loaded (now with caching!)
  if (!window.Fuse) {
    await loadScript(dc, "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js");
  }

  const files = app.vault.getFiles();
  const fuse = new Fuse(files, {
    keys: ["name"],
    includeScore: true,
    threshold: 0.4,
  });

  const results = fuse.search(filename);
  return results.length > 0 ? results[0].item : null;
}

// Get Obsidian resource path by fuzzy filename match
async function requireMediaFile(filename) {
  const file = await fuzzyFindFile(filename);
  if (!file) {
    throw new Error(`File "${filename}" not found`);
  }
  return app.vault.getResourcePath(file);
}

// The main component - accepts fileName as a prop
function View({ fileName = "obsidian_lottie.json" }) {
  const isLottie = fileName.toLowerCase().endsWith(".json");
  const [mediaSrc, setMediaSrc] = dc.useState(null);

  // Load lottie-player script dynamically if needed (now with caching!)
  dc.useEffect(() => {
    if (isLottie && !window.customElements.get("lottie-player")) {
      loadScript(
        dc,
        "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
      ).catch(err => {
        console.error("Failed to load lottie-player:", err);
      });
    }
  }, [isLottie]);

  // Load media file via fuzzy search
  dc.useEffect(() => {
    requireMediaFile(fileName)
        .then((url) => {
        // Small delay to avoid layout thrash
        setTimeout(() => setMediaSrc(url), 0);
        })
        .catch((err) => {
        console.error("Error loading media file:", err);
        });
}, [fileName]);

  return (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "transparent",
      overflow: "hidden",
    }}>
      {mediaSrc ? (
        isLottie ? (
          <lottie-player
            src={mediaSrc}
            background="transparent"
            speed="1"
            style={{ 
              width: "100%", 
              height: "100%", 
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            loop
            autoplay
          ></lottie-player>
        ) : (
          <img
            src={mediaSrc}
            alt="Media"
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "contain",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          />
        )
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          color: "rgba(139, 92, 246, 0.8)",
          fontFamily: "monospace",
          fontSize: "14px",
        }}>
          <span style={{ 
            animation: "spin 1s linear infinite",
          }}>⏳</span>
          <p style={{ margin: 0 }}>Loading media...</p>
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
      //console.log(`Script executed from ${isUrl ? 'cache/network' : 'local path'}: ${src}`);
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
          //console.log(`Loading script from cache: ${cachePath}`);
          try {
            scriptText = await adapter.read(cachePath);
          } catch (readError) {
            console.warn(`Failed to read cache file ${cachePath}, attempting refetch. Error:`, readError);
          }
        }

        if (scriptText === null) {
          //console.log(`Fetching script from network: ${src}`);
          const response = await fetch(src);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${src}`);
          }
          scriptText = await response.text();

          // 3. Write to cache
          try {
            if (!(await adapter.exists(cacheDir))) {
             // console.log(`Creating script cache directory: ${cacheDir}`);
              await adapter.mkdir(cacheDir);
            }
           // console.log(`Writing script to cache: ${cachePath}`);
            await adapter.write(cachePath, scriptText);
          } catch (writeError) {
            console.warn(`Failed to write script to cache ${cachePath}. Error:`, writeError);
          }
        }
        executeScriptContent(scriptText, resolve, reject, scriptElement);

      } else {
        // --- Local Vault Path Handling ---
       // console.log(`Loading script from local vault path: ${src}`);
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


