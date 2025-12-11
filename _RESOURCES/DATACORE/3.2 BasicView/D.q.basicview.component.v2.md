---
tags: datacore-component
---

# ViewComponent

```jsx
const { useEffect, useRef, useState } = dc;

// --- DOM Traversal Utilities ---
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}
function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) {
            return child;
        }
    }
    return null;
}

// =================================================================================
//  VIEW COMPONENT (UI & Full-Tab Logic)
// =================================================================================
function BasicView() {
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;


    const STYLES = {
        hoverEffectStyle: `
      .${uniqueWrapperClass} .subtle-icon {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
      }
      .${uniqueWrapperClass}:hover .subtle-icon {
        opacity: 0.7;
        transform: scale(1);
      }
      .${uniqueWrapperClass} .subtle-icon:hover {
        opacity: 1;
      }
      .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
        visibility: visible;
        opacity: 1;
      }
    `,
        fullTabWrapper: {
            position: "relative",
            height: "100%",
            width: "100%",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            backgroundColor: "var(--background-secondary)",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "8px",
            color: "var(--text-normal)",
        },
        iconContainer: {
            position: "absolute",
            top: "15px",
            right: "20px",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "var(--text-faint)",
            userSelect: "none",
            cursor: "pointer",
            zIndex: 10,
        },
        tooltip: {
            visibility: "hidden",
            opacity: 0,
            backgroundColor: "var(--background-secondary-alt)",
            color: "var(--text-normal)",
            textAlign: "center",
            borderRadius: "4px",
            padding: "5px 10px",
            position: "absolute",
            zIndex: 1,
            top: "50%",
            right: "120%",
            transform: "translateY(-50%)",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            border: "1px solid var(--background-modifier-border)",
        },
        title: { fontSize: "2em", fontWeight: "600", color: "var(--text-normal)" },
        subtitle: {
            fontSize: "1em",
            color: "var(--text-muted)",
            maxWidth: "400px",
            textAlign: "center",
            fontFamily: "monospace",
        },
        compactWrapper: {
            padding: "16px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            border: "1px dashed var(--background-modifier-border)",
            borderRadius: "8px",
            backgroundColor: "var(--background-primary-alt)",
        },
        compactText: { margin: 0, color: "var(--text-muted)", fontSize: "14px" },
        buttonGroup: { display: "flex", gap: "10px" },
        button: {
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--text-on-accent)",
            backgroundColor: "var(--interactive-accent)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
        },
        secondaryButton: {
            backgroundColor: "var(--background-modifier-hover)",
            color: "var(--text-muted)",
        },
    };



    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        const targetPaneContent = findNearestAncestorWithClass(
            container,
            "workspace-leaf-content"
        );
        if (!targetPaneContent) {
            setIsFullTab(false);
            return;
        }
        const contentWrapper =
            findDirectChildByClass(targetPaneContent, "view-content") ||
            targetPaneContent;
        stateRefs.originalParent = container.parentNode;
        stateRefs.placeholder = document.createElement("div");
        stateRefs.placeholder.style.display = "none";
        container.parentNode.insertBefore(stateRefs.placeholder, container);
        stateRefs.parentPositionInfo = {
            element: contentWrapper,
            original: window.getComputedStyle(contentWrapper).position,
        };
        if (stateRefs.parentPositionInfo.original === "static") {
            contentWrapper.style.position = "relative";
        }
        contentWrapper.appendChild(container);
        Object.assign(container.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "9998",
            overflow: "auto",
        });
        return () => {
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(
                    container,
                    stateRefs.placeholder
                );
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.original === "static"
                        ? ""
                        : stateRefs.parentPositionInfo.original;
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
        };
    }, [isFullTab]);

    const handleExitFullTab = (e) => {
        e.stopPropagation();
        setIsFullTab(false);
    };
    const handleEnterFullTab = () => setIsFullTab(true);

    if (!isFullTab) {
        return (
            <div ref={containerRef} style={STYLES.compactWrapper}>
                {" "}
                <p style={STYLES.compactText}>Component is in compact mode.</p> <div
                    style={STYLES.buttonGroup}
                >
                    {" "}
                    <button style={STYLES.button} onClick={handleEnterFullTab}>
                        Enter Full Tab
                    </button> 
                </div>{" "}
            </div>
        );
    }

    return (
        <div ref={containerRef}>
            {" "}
            <style>{STYLES.hoverEffectStyle}</style> <div
                style={STYLES.fullTabWrapper}
                className={uniqueWrapperClass}
            >
                {" "}
                <div
                    style={STYLES.iconContainer}
                    className="subtle-icon"
                    onClick={handleExitFullTab}
                >
                    {" "}
                    &lt;/&gt; <span className="exit-tooltip" style={STYLES.tooltip}>
                        Close Full Mode
                    </span>{" "}
                </div> <h2 style={STYLES.title}>FULL TAB VIEW test</h2> <p
                    style={STYLES.subtitle}
                >
                    This component demonstrates full-tab mode with compact fallback.
                </p> <p style={STYLES.subtitle}>
                    Instance ID: <strong>{instanceId}</strong>
                </p>{" "}
            </div>{" "}
        </div>
    );
}

return { BasicView };
```