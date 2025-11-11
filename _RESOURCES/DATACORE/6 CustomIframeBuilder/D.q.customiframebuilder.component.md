
# ViewComponent

```jsx
// Import the guidelines using dc.resolvePath
const { getIframesGuidelines } = await dc.require(
  dc.headerLink(dc.resolvePath("D.q.customiframebuilder.component"), "IframesGuidelines")
);

function View({ spawnType = "fullTab" }) {
  const { useState, useEffect, useRef } = dc;
  
  /**
   * Parse spawnType to determine initial display mode and toggle button visibility
   * Options:
   * - "fullTab" (default): Starts in full-tab mode with toggle enabled
   * - "compact": Starts in compact mode with toggle enabled
   * - "fullTab.locked": Starts in full-tab mode, toggle hidden
   * - "compact.locked": Starts in compact mode, toggle hidden
   * - "disabled"/"disable": Disables full-tab mode entirely
   */
  const lowerSpawnType = (spawnType || "").toLowerCase();
  const isDisabled = lowerSpawnType === "disabled" || lowerSpawnType === "disable";
  const isLocked = lowerSpawnType.includes(".locked");
  const baseSpawnType = lowerSpawnType.replace(".locked", "");
  const showFullTabToggle = !isLocked && !isDisabled;
  const initialFullTab = !isDisabled && baseSpawnType === "fulltab";
  
  // Container dimensions
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  
  /**
   * Manual mode flag: when true, disables automatic container resizing
   * Set to true when user manually adjusts dimensions or applies URL guidelines
   */
  const [isContainerManual, setIsContainerManual] = useState(false);
  const isContainerManualRef = useRef(isContainerManual);
  
  // ResizeObserver reference for cleanup
  const observerRef = useRef(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    isContainerManualRef.current = isContainerManual;
  }, [isContainerManual]);
  
  // iFrame configuration state
  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeWidth, setIframeWidth] = useState(800);
  const [iframeHeight, setIframeHeight] = useState(666);
  const [iframeScale, setIframeScale] = useState(1);
  const [iframeLeft, setIframeLeft] = useState(10);
  const [iframeTop, setIframeTop] = useState(10);
  
  /**
   * Interaction mode: when true, disables direct iframe interaction
   * Useful for positioning and scaling without triggering iframe content
   */
  const [disableIframeInteraction, setDisableIframeInteraction] = useState(true);
  
  // DOM references
  const containerRef = useRef(null);
  const iframeWrapperRef = useRef(null);
  
  /**
   * Full-Tab Mode
   * Allows the component to expand and fill the entire Obsidian pane
   * Uses DOM reparenting to position the container absolutely within the workspace
   */
  const [isFullTab, setIsFullTab] = useState(initialFullTab);
  
  /**
   * Traverses up the DOM tree to find an ancestor with the specified class name
   * Used to locate Obsidian's workspace-leaf-content container
   */
  function findNearestAncestorWithClass(element, className) {
    let current = element;
    while (current && current !== document.body) {
      if (current.classList && current.classList.contains(className)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Finds a direct child element with the specified class name
   * Used to locate the view-content wrapper within workspace-leaf-content
   */
  function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      if (child.classList && child.classList.contains(className)) {
        return child;
      }
    }
    return null;
  }
  
  /**
   * Transforms URLs to their embeddable equivalents
   * Currently supports YouTube watch URLs and short URLs
   */
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
  
  /**
   * Detects the platform from the URL and returns appropriate display guidelines
   * Guidelines include optimal container size, iframe dimensions, scale, and positioning
   */
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
  
  /**
   * Full-Tab Mode Effect
   * Reparents the container to fill the entire Obsidian workspace pane
   * Uses a placeholder technique to preserve original position for cleanup
   */
  const stateRefs = useRef({});
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;

    // Locate Obsidian's workspace structure
    const targetPaneContent = findNearestAncestorWithClass(
      container,
      "workspace-leaf-content"
    );
    if (!targetPaneContent) return;

    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;

    // Store original parent and create placeholder
    stateRefs.current.originalParent = container.parentNode;
    stateRefs.current.placeholder = document.createElement("div");
    stateRefs.current.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.current.placeholder, container);

    // Ensure parent has positioning context
    stateRefs.current.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    if (stateRefs.current.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }

    // Reparent and apply full-tab styles
    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "auto",
    });

    // Cleanup: restore original DOM structure
    return () => {
      if (stateRefs.current.placeholder?.parentNode) {
        stateRefs.current.placeholder.parentNode.replaceChild(
          container,
          stateRefs.current.placeholder
        );
      }
      if (stateRefs.current.parentPositionInfo?.element) {
        stateRefs.current.parentPositionInfo.element.style.position =
          stateRefs.current.parentPositionInfo.original === "static"
            ? ""
            : stateRefs.current.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs.current).forEach((key) => (stateRefs.current[key] = null));
    };
  }, [isFullTab]);
  
  /**
   * Automatic Container Resizing
   * Observes container size changes and syncs iframe width when not in manual mode
   */
  useEffect(() => {
    if (!isContainerManual && containerRef.current && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
          const newWidth = entry.contentRect.width;
          if (!isContainerManualRef.current) {
            setWidth(newWidth);
            setIframeWidth(newWidth);
          }
        }
      });
      observer.observe(containerRef.current);
      observerRef.current = observer;
      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    }
  }, [isContainerManual]);
  
  /**
   * Fallback Window Resize Handler
   * Used when ResizeObserver is not available
   */
  useEffect(() => {
    if (!isContainerManual) {
      const handleResize = () => {
        const newWidth = window.innerWidth;
        setWidth(newWidth);
        setIframeWidth(newWidth);
      };
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isContainerManual]);
  
  /**
   * Exports current settings to clipboard as JSON
   * Includes all container and iframe parameters
   */
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
  
  /**
   * Imports settings from clipboard JSON
   * Switches to manual mode when container dimensions are loaded
   */
  const pasteSettings = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const settings = JSON.parse(text);
      if (settings.containerWidth !== undefined) {
        setWidth(settings.containerWidth);
        setIsContainerManual(true);
        isContainerManualRef.current = true;
      }
      if (settings.containerHeight !== undefined) {
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
      alert("Settings loaded from clipboard!");
    } catch (error) {
      alert("Failed to load settings from clipboard: " + error);
    }
  };
  
  /**
   * Container Click Handler
   * Simulates clicks within the iframe when interaction is disabled
   * Useful for testing iframe responsiveness without direct interaction
   */
  const handleContainerClick = (e) => {
    if (!disableIframeInteraction) return;
    if (!e.currentTarget) return;
    
    window.requestAnimationFrame(() => {
      if (!e.currentTarget) return;
      
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
  
  return (
    <div 
      ref={containerRef} 
      onClick={handleContainerClick}
      style={{ 
        width: "100%", 
        height: "100%", 
        overflow: "auto",
        backgroundColor: "#0a0a0a"
      }}
    >
      <dc.Stack style={{ padding: "20px", gap: "20px" }}>
        {/* Header */}
        <div style={{
          padding: "16px",
          backgroundColor: "#141414",
          borderRadius: "8px",
          border: "1px solid #2a2a2a"
        }}>
          <h2 style={{ 
            margin: 0, 
            color: "#8b5cf6", 
            fontSize: "1.2em",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <dc.Icon icon="layout" style={{ fontSize: "1em" }} />
            iFrame Builder
          </h2>
        </div>

        {/* iFrame URL Input */}
        <div style={{
          padding: "16px",
          backgroundColor: "#141414",
          borderRadius: "8px",
          border: "1px solid #2a2a2a"
        }}>
          <h3 style={{ 
            margin: "0 0 12px 0", 
            color: "#e0e0e0", 
            fontSize: "0.9em",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <dc.Icon icon="link" style={{ fontSize: "0.9em" }} />
            iFrame URL
          </h3>
          <label style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "6px",
            color: "#a0a0a0",
            fontSize: "13px"
          }}>
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
                    // Disconnect ResizeObserver if active
                    if (observerRef.current) {
                      observerRef.current.disconnect();
                      observerRef.current = null;
                    }
                    // Update container and iFrame parameters
                    setWidth(guidelines.containerWidth);
                    setHeight(guidelines.containerHeight);
                    setIframeWidth(guidelines.iframeWidth);
                    setIframeHeight(guidelines.iframeHeight);
                    setIframeScale(guidelines.iframeScale);
                    setIframeLeft(guidelines.iframeLeft);
                    setIframeTop(guidelines.iframeTop);
                    setDisableIframeInteraction(guidelines.disableIframeInteraction);
                  }
                }
              }}
              placeholder="Enter iFrame URL..."
              style={{ 
                padding: "8px 12px",
                backgroundColor: "#0a0a0a",
                color: "#e0e0e0",
                border: "1px solid #2a2a2a",
                borderRadius: "4px",
                width: "100%",
                fontSize: "13px"
              }}
            />
          </label>
        </div>

        {/* Container Dimensions and iFrame Parameters - Side by Side */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {/* Container Dimensions */}
          <div style={{
            flex: "1 1 300px",
            padding: "16px",
            backgroundColor: "#141414",
            borderRadius: "8px",
            border: "1px solid #2a2a2a"
          }}>
            <h3 style={{ 
              margin: "0 0 12px 0", 
              color: "#e0e0e0", 
              fontSize: "0.9em",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <dc.Icon icon="maximize-2" style={{ fontSize: "0.9em" }} />
              Container Dimensions
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "#a0a0a0",
                fontSize: "13px"
              }}>
                Width (px)
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    const newWidth = Number(e.target.value);
                    setWidth(newWidth);
                    setIsContainerManual(true);
                    isContainerManualRef.current = true;
                  }}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    width: "100px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "#a0a0a0",
                fontSize: "13px"
              }}>
                Height (px)
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    const newHeight = Number(e.target.value);
                    setHeight(newHeight);
                    setIsContainerManual(true);
                    isContainerManualRef.current = true;
                  }}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    width: "100px",
                    fontSize: "13px"
                  }}
                />
              </label>
            </div>
          </div>
          
          {/* iFrame Parameters */}
          <div style={{
            flex: "1 1 300px",
            padding: "16px",
            backgroundColor: "#141414",
            borderRadius: "8px",
            border: "1px solid #2a2a2a"
          }}>
            <h3 style={{ 
              margin: "0 0 12px 0", 
              color: "#e0e0e0", 
              fontSize: "0.9em",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <dc.Icon icon="settings" style={{ fontSize: "0.9em" }} />
              iFrame Parameters
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "#a0a0a0",
                fontSize: "13px"
              }}>
                Width (px)
                <input
                  type="number"
                  value={iframeWidth}
                  onChange={(e) => setIframeWidth(Number(e.target.value))}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    width: "100px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "#a0a0a0",
                fontSize: "13px"
              }}>
                Height (px)
                <input
                  type="number"
                  value={iframeHeight}
                  onChange={(e) => setIframeHeight(Number(e.target.value))}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    width: "100px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "#a0a0a0",
                fontSize: "13px"
              }}>
                Scale
                <input
                  type="number"
                  value={iframeScale}
                  onChange={(e) => setIframeScale(Number(e.target.value))}
                  step="0.001"
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    width: "100px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "#a0a0a0",
                fontSize: "13px"
              }}>
                Left (px)
                <input
                  type="number"
                  value={iframeLeft}
                  onChange={(e) => setIframeLeft(Number(e.target.value))}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    width: "100px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "#a0a0a0",
                fontSize: "13px"
              }}>
                Top (px)
                <input
                  type="number"
                  value={iframeTop}
                  onChange={(e) => setIframeTop(Number(e.target.value))}
                  style={{ 
                    padding: "6px 12px",
                    backgroundColor: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    width: "100px",
                    fontSize: "13px"
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div style={{
          padding: "16px",
          backgroundColor: "#141414",
          borderRadius: "8px",
          border: "1px solid #2a2a2a",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <button 
            onClick={() => setDisableIframeInteraction(!disableIframeInteraction)}
            style={{
              padding: "8px 16px",
              backgroundColor: disableIframeInteraction ? "#8b5cf6" : "#1a1a1a",
              color: disableIframeInteraction ? "#ffffff" : "#a0a0a0",
              border: "1px solid " + (disableIframeInteraction ? "#8b5cf6" : "#2a2a2a"),
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <dc.Icon icon={disableIframeInteraction ? "lock" : "unlock"} style={{ fontSize: "14px" }} />
            {disableIframeInteraction ? "Interaction Disabled" : "Interaction Enabled"}
          </button>
          
          <button 
            onClick={copySettings}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1a1a1a",
              color: "#a0a0a0",
              border: "1px solid #2a2a2a",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <dc.Icon icon="copy" style={{ fontSize: "14px" }} />
            Copy Settings
          </button>
          
          <button 
            onClick={pasteSettings}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1a1a1a",
              color: "#a0a0a0",
              border: "1px solid #2a2a2a",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <dc.Icon icon="clipboard" style={{ fontSize: "14px" }} />
            Load Settings
          </button>
          
          {/* Full-Tab Toggle Button - Only show if enabled */}
          {showFullTabToggle && (
            <button
              onClick={() => setIsFullTab(!isFullTab)}
              style={{
                padding: "8px 16px",
                backgroundColor: isFullTab ? "#8b5cf6" : "#1a1a1a",
                color: isFullTab ? "#ffffff" : "#a0a0a0",
                border: "1px solid " + (isFullTab ? "#8b5cf6" : "#2a2a2a"),
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
              title={isFullTab ? "Exit full-tab mode" : "Enter full-tab mode"}
            >
              <dc.Icon icon={isFullTab ? "minimize-2" : "maximize-2"} style={{ fontSize: "14px" }} />
              {isFullTab ? "Exit Full-Tab" : "Full-Tab Mode"}
            </button>
          )}
        </div>
        
        {/* Preview */}
        <div style={{
          padding: "16px",
          backgroundColor: "#141414",
          borderRadius: "8px",
          border: "1px solid #2a2a2a"
        }}>
          <h3 style={{ 
            margin: "0 0 12px 0", 
            color: "#e0e0e0", 
            fontSize: "0.9em",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <dc.Icon icon="eye" style={{ fontSize: "0.9em" }} />
            Preview
          </h3>
          
          {/* Main view container with dynamic sizing and clipping */}
          <div
            style={{
              position: "relative",
              width: width + "px",
              height: height + "px",
              border: "1px solid #2a2a2a",
              backgroundColor: "#0a0a0a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              margin: "0 auto",
              borderRadius: "4px"
            }}
          >
            <p style={{ color: "#444", fontSize: "12px" }}>iFrame Preview</p>
          
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
                  border: "1px solid #2a2a2a",
                  transform: `scale(${iframeScale})`,
                  transformOrigin: "top left"
                }}
              ></iframe>
            </div>
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