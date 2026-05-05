# FullTab

```jsx
const { useEffect, useRef, useState, useCallback } = dc;

function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) return current;
        current = current.parentNode;
    }
    return null;
}

function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) return child;
    }
    return null;
}

function applyCssText(element, cssText) {
    if (element && cssText && typeof cssText === "string") {
        element.style.cssText = cssText;
    } else if (element) {
        element.style.cssText = "display: block; position: relative;";
    }
}

function reparentToOriginal(container, originalParentRef) {
    if (!container || !originalParentRef || !originalParentRef.current) return;
    if (!originalParentRef.current.isConnected) {
        if (container.parentNode === document.body) {
            try {
                document.body.removeChild(container);
            } catch (e) {
                console.error(
                    "[ScreenModeHelper] Error removing container from body:",
                    e
                );
            }
        }
        return;
    }
    if (container.parentNode === document.body) {
        try {
            document.body.removeChild(container);
            originalParentRef.current.appendChild(container);
        } catch (e) {
            console.error("[ScreenModeHelper] Error reparenting container:", e);
        }
    }
}

const ScreenModeHelper = ({
    helperRef,
    initialMode = "default",
    containerRef,
    originalParentRefForWindow,
    originalParentRefForPiP,
    stylesByMode,
    defaultStyle,
    hideToggleButtons = false,
}) => {
    const [activeMode, setActiveMode] = useState(initialMode);
    const initialStylesAppliedRef = useRef(false);
    const capturedActiveModeForCleanup = useRef(activeMode);

    useEffect(() => {
        capturedActiveModeForCleanup.current = activeMode;
    }, [activeMode]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || initialStylesAppliedRef.current) return;
        if (activeMode === "default") {
            applyCssText(container, defaultStyle);
        } else if (stylesByMode && stylesByMode[activeMode]) {
            const parentRefForMode =
                activeMode === "window"
                    ? originalParentRefForWindow
                    : originalParentRefForPiP;
            if (
                parentRefForMode &&
                !parentRefForMode.current &&
                container.parentNode &&
                container.parentNode !== document.body
            ) {
                parentRefForMode.current = container.parentNode;
            }
            if (container.parentNode !== document.body) {
                if (container.parentNode) {
                    try {
                        container.parentNode.removeChild(container);
                    } catch (e) {
                        console.error(
                            "[ScreenModeHelper] Error removing container from initial parent:",
                            e
                        );
                    }
                }
                document.body.appendChild(container);
            }
            applyCssText(container, stylesByMode[activeMode]);
        }
        initialStylesAppliedRef.current = true;
    }, [
        containerRef,
        activeMode,
        initialMode,
        defaultStyle,
        stylesByMode,
        originalParentRefForWindow,
        originalParentRefForPiP,
    ]);

    const toggleMode = useCallback(() => {
        /* Toggling disabled when buttons are hidden */
    }, []);

    useEffect(() => {
        if (helperRef) {
            helperRef.current = {
                toggleMode: hideToggleButtons ? () => {} : toggleMode,
                getActiveMode: () => activeMode,
            };
        }
    }, [helperRef, toggleMode, activeMode, hideToggleButtons]);

    useEffect(() => {
        const currentContainer = containerRef.current;
        const modeAtUnmountSetup = capturedActiveModeForCleanup.current;
        return () => {
            if (currentContainer && modeAtUnmountSetup !== "default") {
                const parentRefToUseForReset =
                    modeAtUnmountSetup === "window"
                        ? originalParentRefForWindow
                        : originalParentRefForPiP;
                if (parentRefToUseForReset && parentRefToUseForReset.current) {
                    reparentToOriginal(currentContainer, parentRefToUseForReset);
                    applyCssText(currentContainer, defaultStyle);
                } else if (currentContainer.parentNode === document.body) {
                    try {
                        document.body.removeChild(currentContainer);
                    } catch (e) {
                        console.error(
                            "[ScreenModeHelper] Unmounting: Error removing container from body:",
                            e
                        );
                    }
                }
            }
        };
    }, [
        containerRef,
        defaultStyle,
        originalParentRefForWindow,
        originalParentRefForPiP,
    ]);

    return null;
};

function useDashboardDisplayMode({ displayMode, setDisplayMode, containerRef }) {
    const stateRefs = useRef({}).current;

    useEffect(() => {
        const c = containerRef.current;
        if (!c) return;

        const resetToStandby = () => {
            if (!stateRefs.originalParent) return;
            c.removeAttribute("style");
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(c, stateRefs.placeholder);
            } else {
                stateRefs.originalParent.appendChild(c);
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.originalInlinePosition || "";
            }
            Object.keys(stateRefs).forEach((k) => delete stateRefs[k]);
        };

        if (displayMode === "welcome" || displayMode === "full") {
            if (!stateRefs.originalParent) {
                if (!c.parentNode) {
                    setTimeout(() => setDisplayMode(displayMode), 50);
                    return;
                }
                stateRefs.originalParent = c.parentNode;
                stateRefs.placeholder = document.createElement("div");
                c.parentNode.insertBefore(stateRefs.placeholder, c);
            }

            if (displayMode === "welcome") {
                if (c.parentNode !== document.body) document.body.appendChild(c);
                Object.assign(c.style, {
                    position: "fixed",
                    inset: "0px",
                    zIndex: "99999",
                    overflow: "hidden",
                });
            } else {
                const tabContainer = findNearestAncestorWithClass(c, "workspace-leaf-content");
                if (!tabContainer) {
                    setDisplayMode("standby");
                    return;
                }
                const viewContent = findDirectChildByClass(tabContainer, "view-content") || tabContainer;
                const parentPosition = window.getComputedStyle(viewContent).position;
                if (!stateRefs.parentPositionInfo) {
                    stateRefs.parentPositionInfo = {
                        element: viewContent,
                        originalInlinePosition: viewContent.style.position,
                    };
                }
                if (parentPosition === "static") viewContent.style.position = "relative";
                if (c.parentNode !== viewContent) viewContent.appendChild(c);
                const isLeafTarget = viewContent === tabContainer;
                Object.assign(c.style, {
                    position: "absolute",
                    top: isLeafTarget ? "var(--header-height, 40px)" : "0px",
                    left: "0px",
                    right: "0px",
                    bottom: "0px",
                    zIndex: "9998",
                    overflow: "hidden",
                });
            }
        } else {
            resetToStandby();
        }

        return () => {
            resetToStandby();
        };
    }, [displayMode, containerRef, setDisplayMode, stateRefs]);
}

return { ScreenModeHelper, useDashboardDisplayMode };
```
