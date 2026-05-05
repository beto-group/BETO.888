/**
 * index.jsx — View Factory for Obsidian Automation CDP
 */

async function View({ folderPath, dc: dcCtx }) {
    const dcRef = dcCtx || dc;
    const { useState, useEffect, useRef } = dcRef;

    // -- Load dependencies via dc.require --
    const { STYLES } = await dcRef.require(folderPath + '/src/styles/styles.jsx');
    const { AutomationUI } = await dcRef.require(folderPath + '/src/components/AutomationUI.jsx');
    const { CLIBridge } = await dcRef.require(folderPath + '/src/utils/CLIBridge.js');
    
    // -- Load shared FullTab utility --
    const { useFullTab } = await dcRef.require("_RESOURCES/DATACORE/102 ObsidianCLICommandLab/src/utils/FullTab.jsx");

    function Component() {
        const [isFullTab, setIsFullTab] = useState(true);
        const containerRef = useRef(null);

        // Standardized Immersion (v19)
        useFullTab(containerRef);


        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <AutomationUI
                    dc={dcRef}
                    styles={STYLES}
                    folderPath={folderPath}
                    CLIBridge={CLIBridge}
                    onToggleFullTab={() => setIsFullTab(!isFullTab)}
                    isFullTab={isFullTab}
                />
            </div>
        );
    }

    return <Component />;
}

return { View };
