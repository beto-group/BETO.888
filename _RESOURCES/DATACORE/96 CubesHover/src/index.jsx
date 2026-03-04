/**
 * View factory for 101 CubesHover
 * Implements Full-tab lifecycle and modular assembly
 */
async function View({ folderPath, dc }) {
    const { useState, useEffect, useRef } = dc;

    // Load all dependencies
    const { findNearestAncestorWithClass, findDirectChildByClass } = await dc.require(folderPath + '/src/utils/domUtils.jsx');
    const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
    const { CubesComponent } = await dc.require(folderPath + '/src/components/CubesComponent.jsx');

    const loadScriptPath = dc.resolvePath('_RESOURCES/DATACORE/28 LoadScript/D.q.loadscript.component.md');
    const loadScriptModule = await dc.require(dc.headerLink(loadScriptPath, 'LoadScriptUpgrade'));
    const loadScript = loadScriptModule.loadScript;

    function ViewComponent() {
        const [key, setKey] = useState(0);
        const [isFullTab, setIsFullTab] = useState(true); // Default to full tab
        const containerRef = useRef(null);
        const stateRefs = useRef({}).current;

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

            // Create placeholder
            stateRefs.originalParent = currentParent;
            const placeholder = document.createElement("div");
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

            // Hide status bar if needed
            const statusBar = document.querySelector('.app-container .status-bar');
            if (statusBar) statusBar.style.display = 'none';

            // Trigger resize
            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);

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

                if (statusBar) statusBar.style.display = '';
            };
        }, [isFullTab]);

        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <CubesComponent
                    key={key}
                    dc={dc}
                    loadScript={loadScript}
                    isFullTab={isFullTab}
                    onToggleFullTab={toggleFullTab}
                    domUtils={{ findNearestAncestorWithClass, findDirectChildByClass }}
                    styles={STYLES}
                />
            </div>
        );
    }

    return <ViewComponent />;
}

return { View };
