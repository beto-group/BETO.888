/**
 * Beto Skills View Factory
 * Implements True Full-Tab Lifecycle (DOM Reparenting)
 */
async function View({ folderPath, ...props }, dcOverride) {
    const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);

    // 1. Load Dependencies
    const { STYLES } = await localDc.require(folderPath + '/src/styles/styles.jsx');
    const { MCPDashboard } = await localDc.require(folderPath + '/src/components/MCPDashboard.jsx');
    const { findNearestAncestorWithClass, findDirectChildByClass } = await localDc.require(folderPath + '/src/utils/domUtils.jsx');

    // 2. Resolve React
    const { useState, useEffect, useRef } = localDc;

    // 3. Define the Inner Component
    function BetoSkills() {
        const componentId = useRef(Math.random().toString(36).substr(2, 5)).current;
        const containerRef = useRef(null);
        // We use refs to store state that needs to survive renders/unmounts for cleanup
        const stateRefs = useRef({}).current;

        // Full-Tab Lifecycle Logic (DOM Reparenting)
        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            // Find the robust ancestor targets
            const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
            if (!targetPaneContent) return;

            const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
            const currentParent = container.parentNode;
            if (!currentParent) return;

            // 1. Save original parent for restoration
            stateRefs.originalParent = currentParent;

            // 2. Create and insert placeholder to keep React tree valid-ish
            const placeholder = document.createElement("div");
            placeholder.className = "screen-mode-placeholder";
            placeholder.style.display = "none";

            if (container.nextSibling) {
                currentParent.insertBefore(placeholder, container.nextSibling);
            } else {
                currentParent.appendChild(placeholder);
            }
            stateRefs.placeholder = placeholder;

            // 3. Save original position info
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position,
            };

            // 4. Set relative on parent if static
            if (window.getComputedStyle(contentWrapper).position === 'static') {
                contentWrapper.style.position = "relative";
            }

            // 5. MOVE THE DOM NODE (Reparenting)
            contentWrapper.appendChild(container);

            // 6. Force Layout updates
            requestAnimationFrame(() => {
                Object.assign(contentWrapper.style, {
                    padding: "0",
                    margin: "0",
                    height: "100%",
                    width: "100%",
                    display: "block",
                    overflow: "hidden", // Important!
                    minHeight: "0"
                });
            });

            // 7. Style the Container to fill space
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

            // 8. Inject Global Styles to hide Chrome (Status bar etc)
            const styleId = `full-tab-styles-${componentId}`;
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

            // CLEANUP FUNCTION
            return () => {
                const styleEl = document.getElementById(styleId);
                if (styleEl) styleEl.remove();

                // Restore Placeholder
                if (stateRefs.placeholder?.parentNode) {
                    stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                } else if (stateRefs.originalParent) {
                    stateRefs.originalParent.appendChild(container);
                }

                // Restore Parent Position
                if (stateRefs.parentPositionInfo?.element) {
                    const { element, originalInlinePosition } = stateRefs.parentPositionInfo;
                    element.style.position = originalInlinePosition || '';
                }

                // Clear container styles
                container.removeAttribute("style");
            };
        }, []);

        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <MCPDashboard STYLES={STYLES} dc={localDc} />
            </div>
        );
    }

    // 4. Return the Component Element (Datacore handles mounting)
    return <BetoSkills />;
}

return { View };
