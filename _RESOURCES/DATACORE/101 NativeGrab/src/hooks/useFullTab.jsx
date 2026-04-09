
function useFullTab({ isFullTab, containerRef, domUtils }) {
    const { useEffect, useRef } = dc;
    const stateRefs = useRef({}).current;
    useEffect(() => {
        if (!isFullTab || !domUtils) return;

        const { findNearestAncestorWithClass, findDirectChildByClass } = domUtils;

        const container = containerRef.current;
        if (!container) return;

        // 1. Find the workspace leaf content
        const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
        if (!targetPaneContent) return;

        // 2. Find the view-content wrapper
        const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
        const currentParent = container.parentNode;
        if (!currentParent || currentParent === contentWrapper) return;

        // 3. Store original state for cleanup
        stateRefs.originalParent = currentParent;
        const placeholder = document.createElement("div");
        placeholder.className = "ng-fulltab-placeholder";
        placeholder.style.display = "none";

        if (container.nextSibling) {
            currentParent.insertBefore(placeholder, container.nextSibling);
        } else {
            currentParent.appendChild(placeholder);
        }
        stateRefs.placeholder = placeholder;

        // Store global UI elements to hide
        const statusBar = document.querySelector('.status-bar');
        const viewHeader = findDirectChildByClass(targetPaneContent, "view-header");

        stateRefs.uiElements = {
            statusBar: { el: statusBar, originalDisplay: statusBar ? statusBar.style.display : null },
            viewHeader: { el: viewHeader, originalDisplay: viewHeader ? viewHeader.style.display : null }
        };

        stateRefs.parentPositionInfo = {
            element: contentWrapper,
            originalInlinePosition: contentWrapper.style.position,
            originalPadding: contentWrapper.style.padding,
            originalOverflow: contentWrapper.style.overflow
        };

        // 4. Transform to Full Tab (Deep Immersion)
        if (window.getComputedStyle(contentWrapper).position === 'static') {
            contentWrapper.style.position = "relative";
        }

        contentWrapper.appendChild(container);

        // Hide Global UI ("that thing" / status bar)
        if (statusBar) statusBar.style.display = 'none';
        if (viewHeader) viewHeader.style.display = 'none';

        Object.assign(contentWrapper.style, {
            padding: "0",
            margin: "0",
            height: "100%",
            width: "100%",
            display: "block",
            overflow: "hidden",
            minHeight: "0"
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

        console.log("[NativeGrab] Deep Immersion active (Status Bar hidden)");

        return () => {
            // Restore Global UI
            if (stateRefs.uiElements) {
                const { statusBar, viewHeader } = stateRefs.uiElements;
                if (statusBar.el) statusBar.el.style.display = statusBar.originalDisplay || '';
                if (viewHeader.el) viewHeader.el.style.display = viewHeader.originalDisplay || '';
            }

            // Restore Layout
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(containerRef.current, stateRefs.placeholder);
            } else if (stateRefs.originalParent && containerRef.current) {
                stateRefs.originalParent.appendChild(containerRef.current);
            }

            if (stateRefs.parentPositionInfo?.element) {
                const { element, originalInlinePosition, originalPadding, originalOverflow } = stateRefs.parentPositionInfo;
                element.style.position = originalInlinePosition || '';
                element.style.padding = originalPadding || '';
                element.style.overflow = originalOverflow || '';
            }
            if (containerRef.current) {
                containerRef.current.removeAttribute("style");
            }
        };
    }, [isFullTab]);
}

return { useFullTab };
