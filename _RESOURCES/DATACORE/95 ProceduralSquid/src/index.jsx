async function View(props) {
    const { folderPath, dc } = props;

    // 1. Load Utilities & Scripts
    const loadScriptModule = await dc.require(dc.headerLink(dc.resolvePath('_RESOURCES/DATACORE/28 LoadScript/D.q.loadscript.component.md'), 'LoadScriptUpgrade'));
    const loadScript = loadScriptModule.loadScript;

    // 2. Load Component Files
    const { STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx');
    const { findNearestAncestorWithClass } = await dc.require(folderPath + '/src/utils/domUtils.jsx');
    const { MainComponent } = await dc.require(folderPath + '/src/components/MainComponent.jsx');

    // 3. Wrapper Component
    function ViewComponent() {
        const [isFullTab, setIsFullTab] = dc.useState(true);
        const containerRef = dc.useRef(null);
        const stateRefs = dc.useRef({}).current;

        dc.useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            const statusBar = document.querySelector('.app-container .status-bar');

            if (isFullTab) {
                const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
                if (targetPaneContent) {
                    const contentWrapper = targetPaneContent.querySelector('.view-content') || targetPaneContent;
                    stateRefs.originalParent = container.parentNode;
                    stateRefs.placeholder = document.createElement('div');
                    stateRefs.placeholder.style.display = 'none';
                    container.parentNode.insertBefore(stateRefs.placeholder, container);

                    contentWrapper.appendChild(container);
                    Object.assign(container.style, {
                        position: "absolute",
                        inset: "0px",
                        zIndex: "9998",
                        backgroundColor: "#000000"
                    });

                    if (statusBar) statusBar.style.display = 'none';
                }
            } else {
                // Restore
                if (stateRefs.placeholder && stateRefs.placeholder.parentNode) {
                    stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                    container.removeAttribute("style");
                    if (statusBar) statusBar.style.display = '';
                }
            }

            return () => {
                if (stateRefs.placeholder && stateRefs.placeholder.parentNode) {
                    stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                }
                if (statusBar) statusBar.style.display = '';
            }
        }, [isFullTab]);

        // Use absolute inset 0 to fill the Datacore container
        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '600px', position: 'relative', overflow: 'hidden' }}>
                <MainComponent
                    dc={dc}
                    loadScript={loadScript}
                    isFullTab={isFullTab}
                    onToggleFullTab={() => setIsFullTab(!isFullTab)}
                    styles={STYLES}
                />
            </div>
        );
    }

    return <ViewComponent />;
}

return { View };
