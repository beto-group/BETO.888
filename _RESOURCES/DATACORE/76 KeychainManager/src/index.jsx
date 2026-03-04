/**
 * View Factory for KeychainManager
 * Implements Full-tab lifecycle and modular assembly
 */
async function View({ folderPath }) {
    const { useState, useEffect, useRef } = dc;

    // 1. Resolve Path from argument
    if (!folderPath) {
        console.error("KeychainManager: folderPath prop missing!");
        // Component will likely fail to load dependencies
    }

    // Load all dependencies
    // Using try-catch individually to better report *which* dependency failed
    let domUtils, STYLES, KeychainManagerComp, ControlsMenuComp;

    try {
        const domUtilsMod = await dc.require(folderPath + '/src/utils/domUtils.jsx');
        domUtils = domUtilsMod;
    } catch (e) { console.error("Failed to load domUtils", e); }

    try {
        const stylesMod = await dc.require(folderPath + '/src/styles/styles.jsx');
        STYLES = stylesMod.STYLES;
    } catch (e) { console.error("Failed to load styles", e); }

    try {
        const mainMod = await dc.require(folderPath + '/src/components/KeychainManager.jsx');
        KeychainManagerComp = mainMod.KeychainManager;
    } catch (e) { console.error("Failed to load KeychainManager", e); }

    try {
        const controlsMod = await dc.require(folderPath + '/src/components/ControlsMenu.jsx');
        ControlsMenuComp = controlsMod.ControlsMenu;
    } catch (e) { console.error("Failed to load ControlsMenu", e); }

    try {
        const storageMod = await dc.require(folderPath + '/src/utils/storageUtils.jsx');
        storageUtils = storageMod;
    } catch (e) { console.error("Failed to load storageUtils", e); }


    function ViewComponent() {
        const [key, setKey] = useState(0);
        const [isFullTab, setIsFullTab] = useState(true); // Default to full tab
        const containerRef = useRef(null);
        const stateRefs = useRef({}).current;

        // Dependencies Check
        if (!KeychainManagerComp || !STYLES || !domUtils) {
            return <div style={{ color: 'red', padding: 20 }}>Error: Failed to load dependencies. Check console.</div>;
        }

        const { findNearestAncestorWithClass, findDirectChildByClass } = domUtils;

        const handleCodeReload = () => {
            setKey((prev) => prev + 1);
            // Optional: Reload the entire datacore view if available
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

            // Create placeholder to hold our spot in the flow
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

            // Save original position info to restore later
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position,
            };

            if (window.getComputedStyle(contentWrapper).position === 'static') {
                contentWrapper.style.position = "relative";
            }

            // Move container to the content wrapper (portal effect)
            contentWrapper.appendChild(container);

            // Edge-to-edge styling on the wrapper
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

            // Style the container itself to fill the space
            Object.assign(container.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                zIndex: "9998",
                overflow: "hidden",
                backgroundColor: "var(--background-primary)", // Theme aware
            });

            return () => {
                // Cleanup: Move back to original spot
                if (stateRefs.placeholder?.parentNode) {
                    stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                } else if (stateRefs.originalParent) {
                    stateRefs.originalParent.appendChild(container);
                }

                // Restore wrapper styles
                if (stateRefs.parentPositionInfo?.element) {
                    const { element, originalInlinePosition } = stateRefs.parentPositionInfo;
                    element.style.position = originalInlinePosition || '';
                    // Note: We don't indiscriminately clear style on wrapper because Obsidian might have own styles
                    // But we should reset the ones we forced.
                    element.style.padding = '';
                    element.style.margin = '';
                    element.style.height = '';
                    element.style.width = '';
                    element.style.display = '';
                    element.style.overflow = '';
                }
                container.removeAttribute("style");
            };
        }, [isFullTab]);

        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <KeychainManagerComp
                    key={key}
                    folderPath={folderPath}
                    onCodeReloadRequest={handleCodeReload}
                    isFullTab={isFullTab}
                    onToggleFullTab={toggleFullTab}
                    styles={STYLES}
                    ControlsMenu={ControlsMenuComp}
                    storageUtils={storageUtils}
                />
            </div>
        );
    }

    return <ViewComponent />;
}

return { View };
