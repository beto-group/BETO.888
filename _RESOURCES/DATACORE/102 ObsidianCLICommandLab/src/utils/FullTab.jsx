/**
 * FullTab Utility - Validated Standard (DOM Reparenting)
 * Use this hook to achieve a true edge-to-edge experience in Obsidian.
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
            
            // Search for active leaf container
            const wrapper = document.querySelector('.workspace-leaf.mod-active .view-content');
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
                backgroundColor: "#020205",
                overflow: "auto",
                display: "block"
            });

            // Target view header and hide it for true nuclear mode
            const leaf = document.querySelector('.workspace-leaf.mod-active');
            if (leaf) {
                const header = leaf.querySelector('.view-header');
                if (header) header.style.setProperty('display', 'none', 'important');
            }

        }, 300);

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

                    Object.assign(containerRef.current.style, {
                        position: "", top: "", left: "", width: "", height: "", 
                        zIndex: "", margin: "", padding: "", border: "", 
                        borderRadius: "", backgroundColor: "", 
                        overflow: "", display: "block"
                    });

                    // Restore header
                    const leaf = document.querySelector('.workspace-leaf.mod-active');
                    if (leaf) {
                        const header = leaf.querySelector('.view-header');
                        if (header) header.style.removeProperty('display');
                    }

                    isActiveRef.current = false;
                } catch (e) {
                    console.error("[FullTab] Cleanup error:", e);
                }
            }
        };
    }, [containerRef]);
};

return { useFullTab };
