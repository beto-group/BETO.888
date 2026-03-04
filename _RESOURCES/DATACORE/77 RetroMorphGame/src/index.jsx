/**
 * RetroMorph Game View Factory
 * 
 * A morphing mini-game agent skill (Snake -> Flappy -> Dino).
 * Implements Full-Tab Lifecycle.
 */
async function View({ folderPath, ...props }, dcOverride) {
    const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);
    console.log("[RetroMorph] View Initializing at:", folderPath);

    // 1. Load Dependencies
    let STYLES, useRetroEngine, HeroSection, findNearestAncestorWithClass, findDirectChildByClass;
    try {
        const stylesMod = await localDc.require(folderPath + '/src/styles/styles.jsx');
        STYLES = stylesMod.STYLES;

        const engineMod = await localDc.require(folderPath + '/src/hooks/useRetroEngine.js');
        useRetroEngine = engineMod.useRetroEngine;

        const heroMod = await localDc.require(folderPath + '/src/components/HeroSection.jsx');
        HeroSection = heroMod.HeroSection;

        const domMod = await localDc.require(folderPath + '/src/utils/domUtils.jsx');
        findNearestAncestorWithClass = domMod.findNearestAncestorWithClass;
        findDirectChildByClass = domMod.findDirectChildByClass;

        console.log("[RetroMorph] Dependencies Loaded:", {
            STYLES: !!STYLES,
            useRetroEngine: !!useRetroEngine,
            HeroSection: !!HeroSection
        });
    } catch (e) {
        console.error("[RetroMorph] Failed to load dependencies:", e);
        return <div>Error loading RetroMorph: {e.message}</div>;
    }

    // 2. Resolve React
    const { useState, useEffect, useRef } = localDc;

    // 3. Define the Inner Component
    function RetroMorphGame() {
        const componentId = useRef(Math.random().toString(36).substr(2, 5)).current;
        const containerRef = useRef(null);
        const stateRefs = useRef({}).current;

        // Full-Tab Lifecycle Logic (Standardized Beto Pattern)
        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
            if (!targetPaneContent) return;

            const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
            const currentParent = container.parentNode;
            if (!currentParent) return;

            // Save state for restoration
            stateRefs.originalParent = currentParent;
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position,
            };

            // Placeholder to keep React happy
            const placeholder = document.createElement("div");
            placeholder.className = "screen-mode-placeholder";
            placeholder.style.display = "none";
            if (container.nextSibling) currentParent.insertBefore(placeholder, container.nextSibling);
            else currentParent.appendChild(placeholder);
            stateRefs.placeholder = placeholder;

            // Reparent
            if (window.getComputedStyle(contentWrapper).position === 'static') {
                contentWrapper.style.position = "relative";
            }
            contentWrapper.appendChild(container);

            // Apply immersive styles
            requestAnimationFrame(() => {
                Object.assign(contentWrapper.style, {
                    padding: "0", margin: "0", height: "100%", width: "100%", display: "block", overflow: "hidden"
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
            });

            // Global Chrome Hiding
            const styleId = `retromorph-styles-${componentId}`;
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
                const style = document.getElementById(styleId);
                if (style) style.remove();

                if (stateRefs.placeholder?.parentNode) {
                    stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                } else if (stateRefs.originalParent) {
                    stateRefs.originalParent.appendChild(container);
                }

                if (stateRefs.parentPositionInfo?.element) {
                    stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || '';
                }
            };
        }, []);

        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <HeroSection dc={localDc} STYLES={STYLES} useRetroEngine={useRetroEngine} />
            </div>
        );
    }

    // 4. Return the Component Element
    return <RetroMorphGame />;
}

return { View };
