


# ViewComponent

```jsx
function loadScript(src, onload, onerror) {
  console.log("[loadScript] Start loading:", src);
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = function () {
    console.log("[loadScript] Loaded:", src);
    if (onload) onload();
  };
  script.onerror =
    onerror ||
    function () {
      console.error(`[loadScript] Failed to load: ${src}`);
    };
  document.body.appendChild(script);
  return script;
}

async function fetchImage(url) {
  console.log("[fetchImage] Start fetching:", url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[fetchImage] Failed to fetch: ${url}`);
    throw new Error(`Failed to fetch ${url}`);
  }
  console.log("[fetchImage] Fetched successfully:", url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function View() {
  const globeRef = dc.useRef(null);
  const [ready, setReady] = dc.useState(false);

  dc.useEffect(() => {
    async function setupGlobe() {
      console.log("[setupGlobe] Setup started.");

      if (!globeRef.current) {
        console.error("[setupGlobe] globeRef is null! Abort.");
        return;
      }

      if (!window.Globe) {
        console.log("[setupGlobe] Globe.gl not found, loading...");
        await new Promise((resolve) =>
          loadScript("https://unpkg.com/globe.gl", resolve)
        );
        console.log("[setupGlobe] Globe.gl loaded.");
      } else {
        console.log("[setupGlobe] Globe.gl already loaded.");
      }

      const [globeTexture, bumpTexture] = await Promise.all([
        fetchImage("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"),
        fetchImage("https://unpkg.com/three-globe/example/img/earth-topology.png")
      ]);

      console.log("[setupGlobe] Textures loaded. Creating globe...");

      const globe = Globe()(globeRef.current)
        .globeImageUrl(globeTexture)
        .bumpImageUrl(bumpTexture)
        .width(500)
        .height(500)
        .backgroundColor("#000000");

      console.log("[setupGlobe] Globe created. Setting controls...");
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.5;

      console.log("[setupGlobe] Finished.");
      setReady(true);
    }

    if (globeRef.current) {
      setupGlobe().catch((err) => {
        console.error("[setupGlobe] Error:", err);
      });
    } else {
      console.warn("[useEffect] globeRef not yet ready, waiting for render...");
    }
  }, []);

  return (
    <div style={{ width: "500px", height: "500px" }}>
      <div ref={globeRef} style={{ width: "100%", height: "100%" }}>
        {!ready && <p>Loading globe...</p>}
      </div>
    </div>
  );
}

return { View };

```

