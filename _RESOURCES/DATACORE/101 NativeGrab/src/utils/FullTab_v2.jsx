/**
 * 128_Native_Grab - FullTab Utility
 * Validated DOM reparenting for "Impeccable Status" immersion.
 */
const useFullTab = (containerRef) => {
    const { useEffect, useRef } = dc;
    const originalParentRef = useRef(null);
    const originalParentPositionRef = useRef(null);
    const placeholderRef = useRef(null);
    const isActiveRef = useRef(false);

    useEffect(() => {
        const settleTimeout = setTimeout(() => {
            if (!containerRef.current || isActiveRef.current) return;
            const container = containerRef.current;
            
            // Target: The specific leaf content where we are rendering
            const leaf = dc.app.workspace.getMostRecentLeaf();
            const wrapper = leaf?.containerEl?.querySelector('.view-content');
            if (!wrapper) return;

            const currentParent = container.parentNode;
            if (!currentParent) return;

            isActiveRef.current = true;
            originalParentRef.current = currentParent;

            // Create Placeholder 
            const placeholder = document.createElement('div');
            placeholder.className = 'screen-mode-placeholder';
            placeholder.style.display = 'none';
            if (container.nextSibling) {
                currentParent.insertBefore(placeholder, container.nextSibling);
            } else {
                currentParent.appendChild(placeholder);
            }
            placeholderRef.current = placeholder;

            // Perform Reparenting
            currentParent.removeChild(container);
            wrapper.appendChild(container);

            // Apply Immersive Styles
            const computedParentPosition = window.getComputedStyle(wrapper).position;
            originalParentPositionRef.current = { 
                element: wrapper, 
                originalInlinePosition: wrapper.style.position 
            };
            
            if (computedParentPosition === 'static') {
                wrapper.style.position = "relative";
            }

            // Force edge-to-edge
            Object.assign(container.style, {
                position: "absolute",
                top: "0px",
                left: "0px",
                width: "100%",
                height: "100%",
                zIndex: "9998",
                margin: "0",
                padding: "0",
                border: "none",
                borderRadius: "0",
                backgroundColor: "#000",
                overflow: "hidden",
                display: "block"
            });

            // Suppress Obsidian Chrome (Headers/Titles)
            const leafContainer = dc.app.workspace.activeLeaf.containerEl;
            if (leafContainer) {
                const header = leafContainer.querySelector('.view-header');
                if (header) header.style.setProperty('display', 'none', 'important');
                const title = leafContainer.querySelector('.inline-title');
                if (title) title.style.setProperty('display', 'none', 'important');
            }

        }, 500);

        return () => {
            clearTimeout(settleTimeout);
            if (isActiveRef.current && containerRef.current && originalParentRef.current) {
                try {
                    const activePlaceholder = placeholderRef.current;
                    if (activePlaceholder?.parentNode) {
                        activePlaceholder.parentNode.replaceChild(containerRef.current, activePlaceholder);
                    }
                    
                    if (originalParentPositionRef.current?.element) {
                        const { element, originalInlinePosition } = originalParentPositionRef.current;
                        element.style.position = originalInlinePosition || '';
                    }

                    // Reset Obsidian Chrome
                    const leafContainer = dc.app.workspace.activeLeaf.containerEl;
                    if (leafContainer) {
                        const header = leafContainer.querySelector('.view-header');
                        if (header) header.style.display = '';
                        const title = leafContainer.querySelector('.inline-title');
                        if (title) title.style.display = '';
                    }

                    Object.assign(containerRef.current.style, {
                        position: "", top: "", left: "", width: "", height: "", 
                        zIndex: "", margin: "", padding: "", border: "", 
                        borderRadius: "", backgroundColor: "", 
                        overflow: "", display: "block"
                    });

                    isActiveRef.current = false;
                } catch (e) {
                    console.error("[NativeGrab-FullTab] Cleanup error:", e);
                }
            }
        };
    }, [containerRef]);
};

return { useFullTab };
