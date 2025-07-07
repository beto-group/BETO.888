
# ViewComponent

```jsx

const { getIframesGuidelines } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/6 CustomIframeBuilder/D.q.customiframebuilder.component.md", "IframesGuidelines")
);

function View() {
  const { useState, useEffect, useRef } = dc;
  
  // Container dimensions.
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  // Flag to indicate if the container dimensions are being set manually.
  const [isContainerManual, setIsContainerManual] = useState(false);
  // Use a ref to always have the latest value of isContainerManual.
  const isContainerManualRef = useRef(isContainerManual);
  
  // Ref to store the ResizeObserver so it can be disconnected manually.
  const observerRef = useRef(null);
  
  // Update the ref when isContainerManual changes.
  useEffect(() => {
    isContainerManualRef.current = isContainerManual;
    console.log("Updated isContainerManualRef to", isContainerManual);
  }, [isContainerManual]);
  
  // iFrame controls.
  const [iframeSrc, setIframeSrc] = useState("about:blank");
  const [iframeWidth, setIframeWidth] = useState(800);
  const [iframeHeight, setIframeHeight] = useState(666);
  const [iframeScale, setIframeScale] = useState(1);
  // iFrame position.
  const [iframeLeft, setIframeLeft] = useState(10);
  const [iframeTop, setIframeTop] = useState(10);
  
  // Config state: when true, disable iframe pointer events.
  const [disableIframeInteraction, setDisableIframeInteraction] = useState(true);
  
  // Refs for the outer container and the iframe wrapper.
  const containerRef = useRef(null);
  const iframeWrapperRef = useRef(null);
  
  // Helper function to transform URLs (e.g., convert YouTube URLs to embed links).
  function transformUrl(url) {
    if (!url) return "";
    const lower = url.toLowerCase();
    try {
      if (lower.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get("v");
        if (videoId) {
          return "https://www.youtube.com/embed/" + videoId;
        }
      } else if (lower.includes("youtu.be/")) {
        const parts = url.split("/");
        const videoId = parts[parts.length - 1];
        if (videoId) {
          return "https://www.youtube.com/embed/" + videoId;
        }
      }
    } catch (e) {
      console.error("URL transformation error:", e);
    }
    return url;
  }
  
  // New helper function to apply guidelines based on the entered URL.
  function applyGuidelines(url) {
  const guidelines = getIframesGuidelines();
  const lowerUrl = url.toLowerCase();
  let key = "WEBSITES"; // default guideline
  
  if (
    lowerUrl.includes("facebook.com/reel") ||
    lowerUrl.includes("facebook.com/plugins/vid")
  ) {
    key = "FACEBOOK.reel";
  } else if (lowerUrl.includes("facebook.com")) {
    key = "FACEBOOK";
  } else if (lowerUrl.includes("warpcast")) {
    key = "WARPCAST";
  } else if (lowerUrl.includes("snapchat.com")) {
    key = "SNAPCHAT";
  } else if (
    (lowerUrl.includes("youtube.com") && lowerUrl.includes("/shorts")) ||
    (lowerUrl.includes("youtu.be") && lowerUrl.includes("shorts"))
  ) {
    key = "YOUTUBE.shorts";
  } else if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    key = "YOUTUBE";
  } else if (lowerUrl.includes("tiktok.com")) {
    key = "TIKTOK";
  } else if (lowerUrl.includes("reddit.com")) {
    key = "REDDIT";
  } else if (lowerUrl.includes("linkedin.com")) {
    key = "LINKEDIN";
  } else if (lowerUrl.includes("instagram.com")) {
    key = "INSTAGRAM";
  }
  
  return guidelines[key];
}
  
  // Attach ResizeObserver only when container is NOT manually set.
  useEffect(() => {
    if (!isContainerManual && containerRef.current && typeof ResizeObserver !== "undefined") {
      console.log("Attaching ResizeObserver. isContainerManual:", isContainerManual);
      const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
          const newWidth = entry.contentRect.width;
          console.log("ResizeObserver: new container width =", newWidth, 
                      "(isContainerManualRef.current:", isContainerManualRef.current, ")");
          if (!isContainerManualRef.current) {
            setWidth(newWidth);
            setIframeWidth(newWidth);
          } else {
            console.log("Skipped ResizeObserver update because container is manual.");
          }
        }
      });
      observer.observe(containerRef.current);
      observerRef.current = observer;
      return () => {
        console.log("Disconnecting ResizeObserver.");
        observer.disconnect();
        observerRef.current = null;
      };
    } else {
      console.log("ResizeObserver not attached. isContainerManual:", isContainerManual);
    }
  }, [isContainerManual]);
  
  // Fallback: window resize listener when ResizeObserver is not available.
  useEffect(() => {
    if (!isContainerManual) {
      console.log("Attaching window resize listener. isContainerManual:", isContainerManual);
      const handleResize = () => {
        const newWidth = window.innerWidth;
        console.log("Window resize: new width =", newWidth, "(isContainerManual:", isContainerManual, ")");
        setWidth(newWidth);
        setIframeWidth(newWidth);
      };
      window.addEventListener("resize", handleResize);
      return () => {
        console.log("Removing window resize listener.");
        window.removeEventListener("resize", handleResize);
      };
    } else {
      console.log("Window resize listener not attached. isContainerManual:", isContainerManual);
    }
  }, [isContainerManual]);
  
  // Function to copy settings to clipboard.
  const copySettings = () => {
    const settings = {
      containerWidth: width,
      containerHeight: height,
      iframeSrc,
      iframeWidth,
      iframeHeight,
      iframeScale,
      iframeLeft,
      iframeTop,
      disableIframeInteraction
    };
    const settingsJson = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(settingsJson)
      .then(() => alert("Settings copied to clipboard!"))
      .catch((err) => alert("Failed to copy settings: " + err));
  };
  
  // Function to load settings from clipboard.
  const pasteSettings = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const settings = JSON.parse(text);
      if (settings.containerWidth !== undefined) {
        console.log("Pasting container width:", settings.containerWidth);
        setWidth(settings.containerWidth);
        setIsContainerManual(true);
        isContainerManualRef.current = true;
      }
      if (settings.containerHeight !== undefined) {
        console.log("Pasting container height:", settings.containerHeight);
        setHeight(settings.containerHeight);
        setIsContainerManual(true);
        isContainerManualRef.current = true;
      }
      if (settings.iframeSrc !== undefined) setIframeSrc(settings.iframeSrc);
      if (settings.iframeWidth !== undefined) setIframeWidth(settings.iframeWidth);
      if (settings.iframeHeight !== undefined) setIframeHeight(settings.iframeHeight);
      if (settings.iframeScale !== undefined) setIframeScale(settings.iframeScale);
      if (settings.iframeLeft !== undefined) setIframeLeft(settings.iframeLeft);
      if (settings.iframeTop !== undefined) setIframeTop(settings.iframeTop);
      if (settings.disableIframeInteraction !== undefined) setDisableIframeInteraction(settings.disableIframeInteraction);
      console.log("Finished pasting settings. Current isContainerManual:", isContainerManualRef.current);
      alert("Settings loaded from clipboard!");
    } catch (error) {
      alert("Failed to load settings from clipboard: " + error);
    }
  };
  
  // onClick handler for the main view container.
  const handleContainerClick = (e) => {
    if (!disableIframeInteraction) return;
    
    window.requestAnimationFrame(() => {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;
      
      if (
        clickX >= iframeLeft &&
        clickX <= iframeLeft + iframeWidth &&
        clickY >= iframeTop &&
        clickY <= iframeTop + iframeHeight
      ) {
        const relativeX = (clickX - iframeLeft) / iframeScale;
        const relativeY = (clickY - iframeTop) / iframeScale;
        
        if (iframeWrapperRef.current) {
          const iframe = iframeWrapperRef.current.querySelector("iframe");
          if (iframe) {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              const targetElement = iframeDoc.elementFromPoint(relativeX, relativeY);
              if (targetElement) {
                const simulatedClick = new MouseEvent("click", {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: relativeX,
                  clientY: relativeY
                });
                targetElement.dispatchEvent(simulatedClick);
              }
            } catch (error) {
              console.error("Unable to simulate click in iframe:", error);
            }
          }
        }
      }
    });
  };
  
  console.log("Render: container width =", width, "| isContainerManual =", isContainerManual);
  
  return (
    <div 
      ref={containerRef} 
      onClick={handleContainerClick}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    >
      <dc.Stack style={{ padding: "20px" }}>
        {/* Container dimension controls */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "10px" }}>
            Container Width (px):
            <input
              type="number"
              value={width}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                console.log("Manual input: container width changed to", newWidth);
                setWidth(newWidth);
                setIsContainerManual(true);
                isContainerManualRef.current = true;
                console.log("After manual input: isContainerManual set to true");
              }}
              style={{ marginLeft: "5px" }}
            />
          </label>
          <label>
            Container Height (px):
            <input
              type="number"
              value={height}
              onChange={(e) => {
                const newHeight = Number(e.target.value);
                console.log("Manual input: container height changed to", newHeight);
                setHeight(newHeight);
                setIsContainerManual(true);
                isContainerManualRef.current = true;
                console.log("After manual input: isContainerManual set to true");
              }}
              style={{ marginLeft: "5px" }}
            />
          </label>
        </div>
        
        {/* iFrame source input */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "10px" }}>
            iFrame URL:
            <input
                type="text"
                value={iframeSrc}
                onChange={(e) => {
                    const url = e.target.value;
                    setIframeSrc(url);
                    // If a URL is present, apply the guidelines immediately.
                    if (url) {
                    const guidelines = applyGuidelines(url);
                    if (guidelines) {
                        // Mark container as manually set.
                        setIsContainerManual(true);
                        isContainerManualRef.current = true;
                        // Disconnect ResizeObserver if active.
                        if (observerRef.current) {
                        observerRef.current.disconnect();
                        observerRef.current = null;
                        console.log("Observer disconnected after applying guidelines.");
                        }
                        // Update container and iFrame parameters.
                        setWidth(guidelines.containerWidth);
                        setHeight(guidelines.containerHeight);
                        setIframeWidth(guidelines.iframeWidth);
                        setIframeHeight(guidelines.iframeHeight);
                        setIframeScale(guidelines.iframeScale);
                        setIframeLeft(guidelines.iframeLeft);
                        setIframeTop(guidelines.iframeTop);
                        setDisableIframeInteraction(guidelines.disableIframeInteraction);
                        console.log("Applied guidelines:", guidelines);
                    }
                    }
                }}
                placeholder="Enter iFrame URL"
                style={{ marginLeft: "5px", width: "300px" }}
              />
          </label>
        </div>
        
        {/* iFrame control panel */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "10px" }}>
            iFrame Width (px):
            <input
              type="number"
              value={iframeWidth}
              onChange={(e) => setIframeWidth(Number(e.target.value))}
              style={{ marginLeft: "5px" }}
            />
          </label>
          <label style={{ marginRight: "10px" }}>
            iFrame Height (px):
            <input
              type="number"
              value={iframeHeight}
              onChange={(e) => setIframeHeight(Number(e.target.value))}
              style={{ marginLeft: "5px" }}
            />
          </label>
          <label style={{ marginRight: "10px" }}>
            iFrame Scale:
            <input
              type="number"
              value={iframeScale}
              onChange={(e) => setIframeScale(Number(e.target.value))}
              step="0.1"
              style={{ marginLeft: "5px" }}
            />
          </label>
          <label style={{ marginRight: "10px" }}>
            iFrame Left (px):
            <input
              type="number"
              value={iframeLeft}
              onChange={(e) => setIframeLeft(Number(e.target.value))}
              style={{ marginLeft: "5px" }}
            />
          </label>
          <label>
            iFrame Top (px):
            <input
              type="number"
              value={iframeTop}
              onChange={(e) => setIframeTop(Number(e.target.value))}
              style={{ marginLeft: "5px" }}
            />
          </label>
        </div>
        
        {/* Config buttons */}
        <div style={{ marginBottom: "20px" }}>
          <button onClick={() => setDisableIframeInteraction(!disableIframeInteraction)}>
            {disableIframeInteraction
              ? "Enable iFrame interaction (iframe active)"
              : "Disable iFrame interaction (scrolling handled by viewer)"}
          </button>
        </div>
        
        {/* Copy and Load Settings Buttons */}
        <div style={{ marginBottom: "20px" }}>
          <button onClick={copySettings} style={{ marginRight: "10px" }}>Copy Settings</button>
          <button onClick={pasteSettings}>Load Settings</button>
        </div>
        
        {/* Main view container with dynamic sizing and clipping */}
        <div
          style={{
            position: "relative",
            width: width + "px",
            height: height + "px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            margin: "0 auto"
          }}
        >
          <p>HELLO WORLD</p>
          
          {/* iFrame container */}
          <div
            ref={iframeWrapperRef}
            style={{
              position: "absolute",
              left: iframeLeft + "px",
              top: iframeTop + "px",
              width: iframeWidth + "px",
              height: iframeHeight + "px",
              overflow: "hidden",
              pointerEvents: disableIframeInteraction ? "none" : "auto"
            }}
          >
            <iframe
              src={transformUrl(iframeSrc)}
              title="Controlled iFrame"
              width={iframeWidth}
              height={iframeHeight}
              loading="lazy"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{
                border: "1px solid #ccc",
                transform: `scale(${iframeScale})`,
                transformOrigin: "top left"
              }}
            ></iframe>
          </div>
        </div>
      </dc.Stack>
    </div>
  );
}

return { View };

```



# IframesGuidelines

```jsx
function getIframesGuidelines() {
  return {
    WEBSITES: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 640,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: true
    },
    FACEBOOK: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "FACEBOOK.reel": {
      containerWidth: 339,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1137,
      iframeScale: 0.526,
      iframeLeft: 1,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    WARPCAST: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: true
    },
    SNAPCHAT: {
      containerWidth: 396,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1111,
      iframeScale: 0.615,
      iframeLeft: 0,
      iframeTop: 44,
      disableIframeInteraction: true
    },
    YOUTUBE: {
      containerWidth: 640,
      containerHeight: 367,
      iframeWidth: 1270,
      iframeHeight: 730,
      iframeScale: 0.5,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    TIKTOK: {
      containerWidth: 340,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 0.92,
      iframeLeft: -124,
      iframeTop: -8,
      disableIframeInteraction: false
    },
    REDDIT: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 600,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: true
    },
    LINKEDIN: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 600,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: true
    },
    "YOUTUBE.shorts": {
      containerWidth: 333,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1.04,
      iframeLeft: -155,
      iframeTop: -42,
      disableIframeInteraction: true
    },
    INSTAGRAM: {
      containerWidth: 338,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.537,
      iframeLeft: 0,
      iframeTop: -69,
      disableIframeInteraction: false
    }
  };
}

return { getIframesGuidelines };

```