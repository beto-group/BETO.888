function ControlsMenu({ onReload, isFullTab, onToggleFullTab, onRunTests }) {
    const { Icon } = dc;

    return (
        <div className="bfv-controls">
            <button
                id="mcp-btn-reload"
                onClick={onReload}
                className="bfv-control-btn"
                title="Reload Component"
            >
                <Icon icon="refresh-cw" size={16} />
            </button>

            <button
                id="mcp-btn-toggle"
                onClick={onToggleFullTab}
                className="bfv-control-btn"
                title={isFullTab ? "Exit Full Tab" : "Enter Full Tab"}
            >
                <Icon icon={isFullTab ? "minimize" : "maximize"} size={16} />
            </button>

            <button
                id="mcp-btn-test"
                onClick={onRunTests}
                className="bfv-control-btn accent"
                title="Run Unit Tests (Ctrl+T)"
            >
                <Icon icon="beaker" size={16} />
            </button>

            <button
                id="mcp-btn-close"
                onClick={() => {
                    if (dc.app.workspace.activeLeaf) {
                        dc.app.workspace.activeLeaf.detach();
                    }
                }}
                className="bfv-control-btn danger"
                title="Close View"
            >
                <Icon icon="x" size={16} />
            </button>
        </div>
    );
}

return { ControlsMenu };
