/**
 * View factory for 78.8 Remotion
 * Implements Full-tab lifecycle and modular assembly
 */
async function View({ folderPath, ...props }) {
  const { useState, useEffect, useRef } = dc;

  // Load all dependencies
  const { findNearestAncestorWithClass, findDirectChildByClass } = await dc.require(folderPath + '/src/utils/domUtils.jsx');
  const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');

  // Core Remotion Hooks & Components
  const { useRemotion } = await dc.require(folderPath + '/src/hooks/useRemotion.jsx') || {};
  const { useHistory } = await dc.require(folderPath + '/src/hooks/useHistory.jsx') || {};
  const { useStageScale } = await dc.require(folderPath + '/src/hooks/useStageScale.jsx') || {};
  const { useExport } = await dc.require(folderPath + '/src/hooks/useExport.jsx') || {};
  const { useSceneManager } = await dc.require(folderPath + '/src/hooks/useSceneManager.jsx') || {};
  const { useKeyboardShortcuts } = await dc.require(folderPath + '/src/hooks/useKeyboardShortcuts.jsx') || {};
  const { Timeline } = await dc.require(folderPath + '/src/components/Timeline.jsx') || {};
  const { Sequencer } = await dc.require(folderPath + '/src/components/Sequencer.jsx') || {};
  const { Remotion } = await dc.require(folderPath + '/src/components/Remotion.jsx') || {};
  const bridge = await dc.require(folderPath + '/src/utils/remotion.jsx') || {};
  const { RemotionProvider, ensureLibraries, Sequence, Player, OfficialSequence, OfficialPlayer, interpolate, spring, React: RemotionReact, ReactDOM: RemotionReactDOM } = bridge;
  const OfficialRemotion = bridge._officialRemotion; // Although it might be better to just pass the whole bridge
  const { LibrarySidebar } = await dc.require(folderPath + '/src/components/LibrarySidebar.jsx') || {};
  const { ComponentCreator } = await dc.require(folderPath + '/src/components/ComponentCreator.jsx') || {};
  const { DraggableItem } = await dc.require(folderPath + '/src/components/DraggableItem.jsx') || {};
  const { RootComposition } = await dc.require(folderPath + '/src/video/RootComposition.jsx') || {};

  // Pre-cache official Remotion libraries if they are not already loaded
  if (ensureLibraries) {
    ensureLibraries().catch(e => console.error("[Index] Failed to pre-cache libraries:", e));
  }

  // Load Modern Fonts (Side Effect in async setup)
  {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Outfit:wght@400;700&family=Roboto:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  // Library Components - Dynamic Discovery
  const libraryComponents = {};
  try {
    const libraryDir = folderPath + '/src/library';
    const listResult = await dc.app.vault.adapter.list(libraryDir);


    // 1. Load Flat Files (Backward Compatibility)
    for (const filePath of listResult.files) {
      if (filePath.endsWith('.jsx')) {
        const fileName = filePath.split('/').pop();
        const componentName = fileName.replace('.jsx', '');
        try {
          const module = await dc.require(filePath);
          if (module && module[componentName]) {
            const Comp = module[componentName];
            Comp.metadata = module[componentName].metadata;
            libraryComponents[componentName] = Comp;
          }
        } catch (e) { console.error(`Failed to load ${componentName}`, e); }
      }
    }

    // 2. Load Folder-Based Components
    for (const folderPath of listResult.folders) {
      const folderName = folderPath.split('/').pop();
      const indexFile = folderPath + '/index.jsx';

      if (await dc.app.vault.adapter.exists(indexFile)) {
        try {
          const module = await dc.require(indexFile);
          // Expect export matching folder name OR 'Component'
          const Comp = module[folderName] || module.Component || Object.values(module)[0];

          if (Comp) {
            Comp.metadata = Comp.metadata || [];
            // Inject internal metadata about location for asset loading
            Comp._folderPath = folderPath;
            libraryComponents[folderName] = Comp;
          }
        } catch (e) { console.error(`Failed to load folder component ${folderName}`, e); }
      }
    }
  } catch (err) {
    console.warn("[View] Failed to scan library directory:", err);
  }

  // Force Load Components (Manual Override to bypass indexing delays)
  const manualLoad = async (name) => {
    try {
      const path = `${folderPath}/src/library/${name}/index.jsx`;
      if (await dc.app.vault.adapter.exists(path)) {
        const module = await dc.require(path);
        const Comp = module[name] || module.Component || Object.values(module)[0];
        if (Comp) {
          Comp.metadata = Comp.metadata || [];
          Comp._folderPath = `${folderPath}/src/library/${name}`;
          // Correctly assign to the object defined at line 44
          libraryComponents[name] = Comp;
        }
      }
    } catch (e) {
      console.warn(`[Index] Manual load failed for ${name}:`, e);
    }
  };

  // Run manual loads sequentially to ensure libraryComponents is populated before render
  await manualLoad('TechnicalBreakdown');
  await manualLoad('FeatureShowcase');
  await manualLoad('DatacoreBreakdown');
  await manualLoad('DatacoreExplanation');
  await manualLoad('AIChatInterface');
  await manualLoad('AuroraLines');
  await manualLoad('BrandLogoReveal');
  await manualLoad('CinematicIntro');

  const { loadLibrary } = await dc.require(folderPath + '/src/utils/libraryLoader.jsx') || {};

  const { ControlsMenu } = await dc.require(folderPath + '/src/components/ControlsMenu.jsx') || {};

  function ViewComponent() {
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const [key, setKey] = useState(0);
    const [isFullTab, setIsFullTab] = useState(!props.isInception); // Default to full tab UNLESS in inception mode
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

      if (container.nextSibling) {
        currentParent.insertBefore(placeholder, container.nextSibling);
      } else {
        currentParent.appendChild(placeholder);
      }
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
        right: "0",
        bottom: "0",
        width: "100%",
        height: "100%",
        zIndex: "9998",
        overflow: "hidden",
        backgroundColor: "#000000",
      });

      // Inject style to hide unwanted elements
      const styleId = `full-tab-styles-${instanceId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
          .status-bar { display: none !important; }
          .view-footer { display: none !important; }
          .workspace-leaf-content { overflow: hidden !important; }
        `;
        document.head.appendChild(styleEl);
      }

      return () => {
        const styleEl = document.getElementById(styleId);
        if (styleEl) styleEl.remove();

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
        <RemotionProvider
          frame={0} // Initial frame for context
          fps={120}
          width={1920}
          height={1080}
          durationInFrames={300}
        >
          <Remotion
            key={key}
            onCodeReloadRequest={handleCodeReload}
            isFullTab={isFullTab}
            onToggleFullTab={toggleFullTab}
            styles={STYLES}
            ControlsMenu={ControlsMenu}
            useRemotion={useRemotion}
            Timeline={Timeline}
            Sequencer={Sequencer}
            LibrarySidebar={LibrarySidebar}
            ComponentCreator={ComponentCreator}
            DraggableItem={DraggableItem}
            libraryComponents={libraryComponents}
            folderPath={folderPath}
            useHistory={useHistory}
            useStageScale={useStageScale}
            useExport={useExport}
            useSceneManager={useSceneManager}
            useKeyboardShortcuts={useKeyboardShortcuts}
            RemotionProvider={RemotionProvider}
            // Pass the bridge itself as a single source of truth
            bridge={bridge}
            RootComposition={RootComposition}
            {...props}
          />
        </RemotionProvider>
      </div>
    );
  }

  return <ViewComponent />;
}

return { View };