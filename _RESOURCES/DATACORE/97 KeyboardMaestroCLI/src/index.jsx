/**
 * View factory for 93 KeyboardMaestroCLI
 * Implements Full-tab lifecycle with Storage and AppleScript macro creation
 */
async function View({ folderPath }) {
  const { useState, useEffect, useRef } = dc;

  // Load all dependencies
  const { findNearestAncestorWithClass, findDirectChildByClass } = await dc.require(folderPath + '/src/utils/domUtils.jsx');
  const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
  const { MacroControl } = await dc.require(folderPath + '/src/components/MacroControl.jsx');
  const { MacroBuilder } = await dc.require(folderPath + '/src/components/MacroBuilder.jsx');
  const { KMBrowser } = await dc.require(folderPath + '/src/components/KMBrowser.jsx');
  const { ControlsMenu } = await dc.require(folderPath + '/src/components/ControlsMenu.jsx');
  const kmUtils = await dc.require(folderPath + '/src/utils/kmUtils.js');
  const storageUtils = await dc.require(folderPath + '/src/utils/storageUtils.js');
  const asUtils = await dc.require(folderPath + '/src/utils/asUtils.js');

  function ViewComponent() {
    const [key, setKey] = useState(0);
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    const handleCodeReload = () => {
      setKey((prev) => prev + 1);
      if (dc.app.workspace.activeLeaf?.rebuildView) {
        dc.app.workspace.activeLeaf.rebuildView();
      }
    };

    const toggleFullTab = () => setIsFullTab(!isFullTab);

    useEffect(() => {
      if (!isFullTab) return;
      const container = containerRef.current;
      if (!container) return;

      const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
      if (!targetPaneContent) return;

      const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
      const currentParent = container.parentNode;
      if (!currentParent) return;

      stateRefs.originalParent = currentParent;
      const placeholder = document.createElement("div");
      placeholder.className = "screen-mode-placeholder";
      placeholder.style.display = "none";

      if (container.nextSibling) currentParent.insertBefore(placeholder, container.nextSibling);
      else currentParent.appendChild(placeholder);
      stateRefs.placeholder = placeholder;

      stateRefs.parentPositionInfo = {
        element: contentWrapper,
        originalInlinePosition: contentWrapper.style.position,
      };

      if (window.getComputedStyle(contentWrapper).position === 'static') {
        contentWrapper.style.position = "relative";
      }

      contentWrapper.appendChild(container);

      requestAnimationFrame(() => {
        Object.assign(contentWrapper.style, {
          padding: "0", margin: "0", height: "100%", width: "100%",
          display: "block", overflow: "hidden", minHeight: "0"
        });
      });

      Object.assign(container.style, {
        position: "absolute", top: "0", left: "0",
        width: "100%", height: "100%", zIndex: "9998",
        overflow: "hidden", backgroundColor: "#000000",
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
    }, [isFullTab]);

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <MacroControl
          key={key}
          kmUtils={kmUtils}
          asUtils={asUtils}
          MacroBuilder={MacroBuilder}
          KMBrowser={KMBrowser}
          storageUtils={storageUtils}
          folderPath={folderPath}
          styles={STYLES}
          ControlsMenu={ControlsMenu}
          onToggleFullTab={toggleFullTab}
          isFullTab={isFullTab}
          onCodeReloadRequest={handleCodeReload}
        />
      </div>
    );
  }

  return <ViewComponent />;
}

return { View };