async function View(props) {
    const { folderPath, dc } = props;

    // 1. Load Utilities & Scripts (Required for Three.js / D3 loading)
    const loadScriptModule = await dc.require(dc.headerLink(dc.resolvePath('_RESOURCES/DATACORE/28 LoadScript/D.q.loadscript.component.md'), 'LoadScriptUpgrade'));
    const loadScript = loadScriptModule.loadScript;

    // 2. Load Component Files
    const { styles } = await dc.require(folderPath + '/src/styles/styles.jsx');
    const { MainComponent } = await dc.require(folderPath + '/src/components/MainComponent.jsx');

    // 3. Wrapper Component
    function ViewComponent() {
        const [isFullTab, setIsFullTab] = dc.useState(true); // default to full tab

        dc.useEffect(() => {
            const statusBar = document.querySelector('.app-container .status-bar');
            if (isFullTab && statusBar) {
                statusBar.style.display = 'none';
            } else if (statusBar) {
                statusBar.style.display = '';
            }
            return () => {
                if (statusBar) statusBar.style.display = '';
            }
        }, [isFullTab]);

        return (
            <MainComponent
                dc={dc}
                loadScript={loadScript}
                isFullTab={isFullTab}
                onToggleFullTab={() => setIsFullTab(!isFullTab)}
                styles={styles}
            />
        );
    }

    return <ViewComponent />;
}

return { View };
