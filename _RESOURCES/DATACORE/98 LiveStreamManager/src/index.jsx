/**
 * View factory that loads dependencies and returns the component
 */
async function View({ folderPath }) {
  const { useState, useEffect, useRef } = dc;

  // Load dependencies
  const { findNearestAncestorWithClass, findDirectChildByClass } = await dc.require(folderPath + '/src/utils/domUtils.jsx');
  const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
  const { LiveStreamOverlay } = await dc.require(folderPath + '/src/components/LiveStreamOverlay.jsx');

  // We need to pass the components into the manager
  const components = { LiveStreamOverlay };
  const { LiveStreamManager } = await dc.require(folderPath + '/src/components/LiveStreamManager.jsx');

  function ViewComponent() {
    const [key, setKey] = useState(0);
    const containerRef = useRef(null);
    const stateRefs = useRef({ components }).current;

    const handleCodeReload = () => {
      setKey((prev) => prev + 1);
      if (dc.app.workspace.activeLeaf?.rebuildView) {
        dc.app.workspace.activeLeaf.rebuildView();
      }
    };

    // Enhanced Full-tab mode lifecycle (from 17 ViewsControl)
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
      if (!targetPaneContent) return;

      const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
      const currentParent = container.parentNode;
      if (!currentParent) return;

      // Create placeholder to maintain position in document flow
      stateRefs.originalParent = currentParent;
      const placeholder = document.createElement("div");
      placeholder.className = "screen-mode-placeholder";
      placeholder.style.display = "none";

      if (container.nextSibling) {
        currentParent.insertBefore(placeholder, container.nextSibling);
      } else {
        currentParent.appendChild(placeholder);
      }
      stateRefs.placeholder = placeholder;

      // Store original parent position styles
      stateRefs.parentPositionInfo = {
        element: contentWrapper,
        originalInlinePosition: contentWrapper.style.position,
      };

      const computedParentPosition = window.getComputedStyle(contentWrapper).position;
      if (computedParentPosition === 'static') {
        contentWrapper.style.position = "relative";
      }

      // Move container to content wrapper
      contentWrapper.appendChild(container);

      // Force reset parent container to ensure true edge-to-edge
      // Wrapped in RAF to avoid blocking the initial mount paint
      requestAnimationFrame(() => {
        Object.assign(contentWrapper.style, {
          padding: "0",
          margin: "0",
          height: "100%",
          width: "100%",
          display: "block",
          overflow: "hidden",
          minHeight: "0"
        });
      });

      Object.assign(container.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: "9998",
        overflow: "hidden",
        backgroundColor: "#000000",
      });

      return () => {
        if (stateRefs.placeholder?.parentNode) {
          stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
        } else if (stateRefs.originalParent) {
          stateRefs.originalParent.appendChild(container);
        }

        if (stateRefs.parentPositionInfo?.element) {
          const { element, originalInlinePosition } = stateRefs.parentPositionInfo;
          element.style.position = originalInlinePosition || '';
        }
        container.removeAttribute("style");
      };
    }, []);

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <LiveStreamManager
          key={key}
          folderPath={folderPath}
          styles={STYLES}
          domUtils={{ findNearestAncestorWithClass, findDirectChildByClass }}
          components={stateRefs.components}
          onReload={handleCodeReload}
        />

        {/* Helper Reload UI from template */}
        <button
          onClick={handleCodeReload}
          style={STYLES.reloadButton}
          title="Reload Code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>
      </div>
    );
  }

  return <ViewComponent />;
}

return { View };