function MainComponent(props) {
    const {
        isFullTab,
        onToggleFullTab,
        onCodeReloadRequest,
        onRunTests,
        ControlsMenu
    } = props;

    return (
        <div className="bfv-container">
            <ControlsMenu
                onReload={onCodeReloadRequest}
                isFullTab={isFullTab}
                onToggleFullTab={onToggleFullTab}
                onRunTests={onRunTests}
            />

            <h1 className="bfv-title grid-span-12">Basic Folder View 66.6</h1>
            <p className="bfv-text grid-span-12">
                Hardened Architecture with **Safe Agent Watchdog**, **MCP Bridge**, and **12-Column Grid Methodology**.
            </p>

            {/* Architecture Cards */}
            <div className="bfv-info-box grid-span-4">
                <h3>Watchdog</h3>
                <p>Safe Agent active. Auto-recovery enabled.</p>
            </div>

            <div className="bfv-info-box grid-span-4">
                <h3>MCP Bridge</h3>
                <p>Agentic control active. Ready for commands.</p>
            </div>

            <div className="bfv-info-box grid-span-4">
                <h3>Responsive</h3>
                <p>12-Col Grid. Mobile: 4c, Tablet: 8c, Desktop: 12c.</p>
            </div>

            <div className="bfv-info-box grid-span-12" style={{ borderStyle: 'dashed', opacity: 0.6 }}>
                <p>Status: <strong>{isFullTab ? 'Full Tab (Portal Mode)' : 'Standard View'}</strong> — System components verified and nominal.</p>
            </div>
        </div>
    );
}

return { MainComponent };
