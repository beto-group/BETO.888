/**
 * View factory for 66 BasicFolderView
 * Implements Full-tab lifecycle and modular assembly
 */
async function View({ folderPath }) {
  const { useState, useEffect, useRef } = dc;

  // Load all dependencies
  const { findNearestAncestorWithClass, findDirectChildByClass } = await dc.require(folderPath + '/src/utils/domUtils.jsx');
  const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
  const { BasicComponent } = await dc.require(folderPath + '/src/components/BasicComponent.jsx');
  const { ControlsMenu } = await dc.require(folderPath + '/src/components/ControlsMenu.jsx');

  function ViewComponent() {
    const [key, setKey] = useState(0);
    const [isFullTab, setIsFullTab] = useState(true); // Default to full tab
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    const handleCodeReload = () => {
      setKey((prev) => prev + 1);
      if (dc.app.workspace.activeLeaf?.rebuildView) {
        dc.app.workspace.activeLeaf.rebuildView();
      }
    };

    const toggleFullTab = () => {
      setIsFullTab(!isFullTab);
    };

    // Full-tab mode lifecycle
    useEffect(() => {
      // If closed (Compact Mode), remain in original flow (don't portal)
      if (!isFullTab) return;

      const container = containerRef.current;
      if (!container) return;

      const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
      if (!targetPaneContent) return;

      const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
      const currentParent = container.parentNode;
      if (!currentParent) return;

      // Create placeholder
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

      // Position logic
      stateRefs.parentPositionInfo = {
        element: contentWrapper,
        originalInlinePosition: contentWrapper.style.position,
      };

      if (window.getComputedStyle(contentWrapper).position === 'static') {
        contentWrapper.style.position = "relative";
      }

      contentWrapper.appendChild(container);

      // Edge-to-edge styling
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
        console.log("Datacore: Cleaning up Full Tab Mode");
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
    }, [isFullTab]);

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <BasicComponent
          key={key}
          onCodeReloadRequest={handleCodeReload}
          isFullTab={isFullTab}
          onToggleFullTab={toggleFullTab}
          domUtils={{ findNearestAncestorWithClass, findDirectChildByClass }}
          styles={STYLES}
          ControlsMenu={ControlsMenu}
        />
      </div>
    );
  }

  return <ViewComponent />;
}

return { View };