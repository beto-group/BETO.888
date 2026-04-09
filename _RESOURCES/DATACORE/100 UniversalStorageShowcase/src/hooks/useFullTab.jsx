/**
 * Hook to manage the full-tab portal logic.
 * @param {Object} params
 * @param {boolean} params.isFullTab - Whether full tab mode is active.
 * @param {React.MutableRefObject} params.containerRef - Ref for the container element.
 * @param {Object} params.domUtils - Object containing domUtils functions.
 */
function useFullTab({ isFullTab, containerRef, domUtils }) {
    const { useEffect, useRef } = dc;
    const stateRefs = useRef({}).current;
    const { findNearestAncestorWithClass, findDirectChildByClass } = domUtils;

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
}

return { useFullTab };
