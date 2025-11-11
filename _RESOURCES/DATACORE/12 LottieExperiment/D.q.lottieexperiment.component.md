
LOTTIE!! ;)

# ViewComponent

```jsx
// Import the cached loadScript function
const componentPath = dc.resolvePath("D.q.lottieexperiment.component");
const { loadScript } = await dc.require(dc.headerLink(componentPath, "LoadScript"));

// DOM Traversal Utilities for full-tab mode
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

// Fuzzy find Lottie file using Fuse.js
async function fuzzyFindFile(filename) {
  if (!window.Fuse) {
    await loadScript(dc, "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js");
  }
  const fuse = new Fuse(app.vault.getFiles(), {
    keys: ["name"],
    includeScore: true,
    threshold: 0.4,
  });
  const results = fuse.search(filename);
  return results.length > 0 ? results[0].item : null;
}

function View({ mainLottie = "obsidian_lottie.json", overlayLottie = "test.json" }) {
  const [mainLottieSrc, setMainLottieSrc] = dc.useState(null);
  const [overlayLottieSrc, setOverlayLottieSrc] = dc.useState(null);
  
  // Full-tab mode state
  const [isFullTab, setIsFullTab] = dc.useState(true);
  const containerRef = dc.useRef(null);
  const stateRefs = dc.useRef({}).current;

  // Load lottie-player script
  dc.useEffect(() => {
    if (!window.customElements.get("lottie-player")) {
      loadScript(dc, "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js")
        .catch(err => console.error("Failed to load lottie-player:", err));
    }
  }, []);

  // Load main Lottie
  dc.useEffect(() => {
    fuzzyFindFile(mainLottie)
      .then(file => {
        if (!file) throw new Error(`File "${mainLottie}" not found`);
        return app.vault.getResourcePath(file);
      })
      .then(url => setTimeout(() => setMainLottieSrc(url), 0))
      .catch(err => console.error("Error loading main Lottie:", err));
  }, [mainLottie]);

  // Load overlay Lottie
  dc.useEffect(() => {
    fuzzyFindFile(overlayLottie)
      .then(file => {
        if (!file) throw new Error(`File "${overlayLottie}" not found`);
        return app.vault.getResourcePath(file);
      })
      .then(url => setTimeout(() => setOverlayLottieSrc(url), 0))
      .catch(err => console.error("Error loading overlay Lottie:", err));
  }, [overlayLottie]);

  // Full-tab DOM manipulation
  dc.useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;

    const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
    if (!targetPaneContent) return;

    const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;

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
      backgroundColor: "var(--background-primary)",
      overflow: "auto",
    });

    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  // Compact mode view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed var(--background-modifier-border)",
        borderRadius: "8px",
        backgroundColor: "var(--background-primary-alt)",
      }}>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px" }}>
          Lottie component in compact mode
        </p>
        <button
          onClick={() => setIsFullTab(true)}
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--text-on-accent)",
            backgroundColor: "var(--interactive-accent)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Exit full-tab button */}
      <div
        onClick={() => setIsFullTab(false)}
        style={{
          position: "absolute",
          top: "15px",
          right: "20px",
          fontFamily: "monospace",
          fontSize: "14px",
          color: "var(--text-faint)",
          cursor: "pointer",
          zIndex: 100,
          padding: "8px 12px",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderRadius: "6px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.color = "var(--text-normal)";
          e.target.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        }}
        onMouseLeave={(e) => {
          e.target.style.color = "var(--text-faint)";
          e.target.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        }}
      >
        &lt;/&gt; Exit Full Tab
      </div>

      {mainLottieSrc && overlayLottieSrc ? (
        <>
          {/* Main background Lottie */}
          <lottie-player
            src={mainLottieSrc}
            background="transparent"
            speed="1"
            style={{ width: "100%", height: "100%" }}
            loop
            autoplay
          />

          {/* Top-right overlay Lottie - pauses on hover */}
          <lottie-player
            src={overlayLottieSrc}
            background="transparent"
            speed="1"
            style={{
              position: "absolute",
              top: "60px",
              right: "10px",
              width: "150px",
              height: "150px",
              cursor: "pointer",
            }}
            loop
            autoplay
            onMouseEnter={(e) => e.target.pause()}
            onMouseLeave={(e) => e.target.play()}
          />
        </>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "rgba(139, 92, 246, 0.8)",
          fontFamily: "monospace",
          fontSize: "14px",
          gap: "8px",
        }}>
          <span style={{ animation: "spin 1s linear infinite" }}>⏳</span>
          <p style={{ margin: 0 }}>Loading Lottie animations...</p>
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
  const cacheDir = ".datacore/script_cache";
  const isUrl = /^https?:\/\//.test(src);

  const executeScriptContent = (scriptContent, resolve, reject, scriptElement) => {
    try {
      scriptElement.textContent = scriptContent;
      document.body.appendChild(scriptElement);
      console.log(`Script executed from ${isUrl ? 'cache/network' : 'local path'}: ${src}`);
      if (onload) onload();
      resolve(scriptElement);
    } catch (execError) {
      console.error(`Error executing script content from ${src}:`, execError);
      if (onerror) onerror(execError);
      reject(execError);
    }
  };

  return new Promise(async (resolve, reject) => {
    const scriptElement = document.createElement("script");
    scriptElement.async = true;

    if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
        return reject(new Error("Datacore context 'dc' with vault adapter is required for loadScript."));
    }
    const adapter = dc.app.vault.adapter;

    try {
      if (isUrl) {
        const safeFilename = src
          .replace(/^https?:\/\//, '')
          .replace(/[\/\\?%*:|"<>]/g, '_') + ".js";
        const cachePath = `${cacheDir}/${safeFilename}`;

        let scriptText = null;

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
        console.log(`Loading script from local vault path: ${src}`);
        const localFileExists = await adapter.exists(src);

        if (!localFileExists) {
           throw new Error(`Local script file not found: ${src}`);
        }

        const scriptText = await adapter.read(src);
        executeScriptContent(scriptText, resolve, reject, scriptElement);
      }
    } catch (error) {
      console.error(`Failed to load script ${src}:`, error);
      if (scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      if (onerror) onerror(error);
      reject(error);
    }
  });
}

return { loadScript };
```
