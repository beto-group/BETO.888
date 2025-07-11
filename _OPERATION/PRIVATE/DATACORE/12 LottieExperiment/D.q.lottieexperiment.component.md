
LOTTIE!! ;)

# ViewComponent
```jsx
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

function View() {
  // State to store the resolved URL for the main scene
  const [mainLottieSrc, setMainLottieSrc] = dc.useState(null);
  // State to store the resolved URL for the top-right overlay
  const [topRightLottieSrc, setTopRightLottieSrc] = dc.useState(null);

  // Load the main scene Lottie JSON file
  dc.useEffect(() => {
    requireMediaFile("obsidian_lottie.json")
      .then((url) => {
        setTimeout(() => setMainLottieSrc(url), 0); // Small delay to avoid layout thrash
      })
      .catch((err) => {
        console.error("Error loading main scene Lottie:", err);
      });
  }, []);

  // Load the top-right Lottie JSON file
  dc.useEffect(() => {
    requireMediaFile("test.json")
      .then((url) => {
        setTimeout(() => setTopRightLottieSrc(url), 0); // Small delay to avoid layout thrash
      })
      .catch((err) => {
        console.error("Error loading top-right Lottie:", err);
      });
  }, []);

  // Inject the lottie-player script if not already loaded
  dc.useEffect(() => {
    if (!window.customElements.get("lottie-player")) {
      loadScript(
        "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js",
        () => console.log("Lottie player loaded"),
        () => console.error("Failed to load Lottie player")
      );
    }
  }, []);

  return (
    // The container is set to relative positioning for proper absolute positioning of the overlay
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {mainLottieSrc && topRightLottieSrc ? (
        <>
          {/* Main scene Lottie */}
          <lottie-player
            src={mainLottieSrc}
            background="transparent"
            speed="1"
            style={{ width: "100%", height: "100%" }}
            loop
            autoplay
          ></lottie-player>

          {/* Top-right Lottie: stops on hover */}
          <lottie-player
            src={topRightLottieSrc}
            background="transparent"
            speed="1"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "150px",
              height: "150px",
              cursor: "pointer",
            }}
            loop
            autoplay
            onMouseEnter={(e) => e.target.pause()}
            onMouseLeave={(e) => e.target.play()}
          ></lottie-player>
        </>
      ) : (
        <p>Loading Lottie...</p>
      )}
    </div>
  );
}

return { View };
```
