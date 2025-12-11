const { useEffect, useRef, useState } = dc;

/**
 * Main UI Component with Full-Tab Mode
 */
function BasicComponent({ onCodeReloadRequest, domUtils, styles }) {
  const { findNearestAncestorWithClass, findDirectChildByClass } = domUtils;
  const STYLES = styles;
  
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;

  const hoverEffectStyle = `
    .${uniqueWrapperClass} .subtle-icon,
    .${uniqueWrapperClass} .reload-button {
      opacity: 0;
      transform: scale(0.9);
      transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
    }
    .${uniqueWrapperClass}:hover .subtle-icon,
    .${uniqueWrapperClass}:hover .reload-button {
      opacity: 0.7;
      transform: scale(1);
    }
    .${uniqueWrapperClass} .subtle-icon:hover,
    .${uniqueWrapperClass} .reload-button:hover {
      opacity: 1;
    }
    .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
      visibility: visible;
      opacity: 1;
    }
    .reload-button:hover { 
      background-color: var(--background-modifier-hover); 
      transform: scale(1.05); 
    }
    .reload-button:active { 
      transform: scale(0.95); 
    }
  `;

  // State
  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;

  // Full-tab mode effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;

    const targetPaneContent = findNearestAncestorWithClass(
      container,
      "workspace-leaf-content"
    );

    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }

    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;

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
      overflow: "auto",
    });

    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(
          container,
          stateRefs.placeholder
        );
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static"
            ? ""
            : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  // Handlers
  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };

  const handleEnterFullTab = () => setIsFullTab(true);

  const handleCopyPath = () => {
    try {
      navigator.clipboard.writeText(dc.currentFilePath);
      new Notice(`Path copied: ${dc.currentFilePath}`, 4000);
    } catch (e) {
      new Notice("Error: Could not copy path.", 4000);
    }
  };

  // Compact mode render
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={STYLES.compactWrapper}>
        <p style={STYLES.compactText}>Component is in compact mode.</p>
        <div style={STYLES.buttonGroup}>
          <button style={STYLES.button} onClick={handleEnterFullTab}>
            Enter Full Tab
          </button>
          <button
            style={{ ...STYLES.button, ...STYLES.secondaryButton }}
            onClick={handleCopyPath}
          >
            Find Codeblock
          </button>
        </div>
      </div>
    );
  }

  // Full-tab mode render
  return (
    <div ref={containerRef}>
      <style>{hoverEffectStyle}</style>
      <div style={STYLES.fullTabWrapper} className={uniqueWrapperClass}>
        {/* Exit button */}
        <div
          style={STYLES.iconContainer}
          className="subtle-icon"
          onClick={handleExitFullTab}
        >
          &lt;/&gt;
          <span className="exit-tooltip" style={STYLES.tooltip}>
            Close Full Mode
          </span>
        </div>

        {/* Reload button */}
        <button
          onClick={onCodeReloadRequest}
          className="reload-button"
          style={STYLES.reloadButton}
          aria-label="Reload Code"
          title="Reload Code"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>

        {/* Content */}
        <h2 style={STYLES.title}>FULL TAB VIEW</h2>
        <p style={STYLES.subtitle}>
          This component reloads with fresh code when you click the reload icon.
        </p>
        <p style={STYLES.subtitle}>
          Instance ID: <strong>{instanceId}</strong>
        </p>
      </div>
    </div>
  );
}

return { BasicComponent };