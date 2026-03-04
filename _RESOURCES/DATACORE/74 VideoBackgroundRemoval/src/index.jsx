/**
 * index.jsx
 * Entry point for 79 VideoBackgroundRemoval.
 */
async function View({ folderPath, ...props }) {
    const { useState, useEffect, useRef } = dc;

    // Load dependencies
    const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
    const { VideoProcessor } = await dc.require(folderPath + '/src/components/VideoProcessor.jsx');

    // Lifecycle utils for full-tab mode (borrowed from standard project pattern)
    const findNearestAncestorWithClass = (el, cls) => {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    };
    const findDirectChildByClass = (el, cls) => {
        return Array.from(el.children).find(child => child.classList.contains(cls));
    };

    function ViewComponent() {
        const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
        const [isFullTab, setIsFullTab] = useState(!props.isInception);
        const containerRef = useRef(null);
        const stateRefs = useRef({}).current;

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
                <VideoProcessor
                    styles={STYLES}
                    folderPath={folderPath}
                    isFullTab={isFullTab}
                    onToggleFullTab={() => setIsFullTab(!isFullTab)}
                    {...props}
                />
            </div>
        );
    }

    return <ViewComponent />;
}

return { View };
