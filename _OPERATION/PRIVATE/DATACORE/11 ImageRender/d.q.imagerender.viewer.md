


```datacorejsx
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

// Fuzzy search for a file using Fuse.js and the Obsidian file index
async function fuzzyFindFile(filename) {
  // Ensure Fuse is loaded
  if (!window.Fuse) {
    await new Promise((resolve) =>
      loadScript("https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js", resolve)
    );
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

// The main component
function View() {
  const fileName = "obsidian_lottie.json"; // Just the filename now
  const isLottie = fileName.toLowerCase().endsWith(".json");
  const [mediaSrc, setMediaSrc] = dc.useState(null);

  // Load lottie-player script dynamically if needed
  dc.useEffect(() => {
    if (isLottie && !window.customElements.get("lottie-player")) {
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
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
    <div style={{ cursor: "pointer" }}>
      {mediaSrc ? (
        isLottie ? (
          <lottie-player
            src={mediaSrc}
            background="transparent"
            speed="1"
            style={{ width: "500px", height: "500px" }}
            loop
            autoplay
          ></lottie-player>
        ) : (
          <img
            src={mediaSrc}
            alt="Media"
            style={{ width: "300px", height: "300px" }}
          />
        )
      ) : (
        <p>Loading media...</p>
      )}
    </div>
  );
}

return View;

```
