





# ViewComponent

```jsx
// A utility function to load external scripts.
function loadScript(src, onload, onerror) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = onload;
  script.onerror =
    onerror ||
    function () {
      console.error(`Failed to load script: ${src}`);
    };
  document.body.appendChild(script);
  return script;
}

// Fuzzy search for a file using Fuse.js and the Obsidian file index.
async function fuzzyFindFile(filename) {
  if (!window.Fuse) {
    await new Promise((resolve) =>
      loadScript("https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js", resolve)
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
  const fileName = "BETO_Logo_W_Loading.svg";
  
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