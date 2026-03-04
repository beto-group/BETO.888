/**
 * Termux Mobile View Factory
 */
async function View({ folderPath, ...props }, dcOverride) {
    const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);

    let TerminalView;
    try {
        const componentPath = dc.resolvePath("85 TermuxMobile/src/components/TerminalView.jsx");
        const { TerminalView: LoadedTerminalView } = await dc.require(componentPath);
        TerminalView = LoadedTerminalView;

        if (!TerminalView) {
            console.error("[TermuxMobile] Failed to load dependencies: TerminalView not found");
            return <div>Error loading TermuxMobile: TerminalView not found</div>;
        }
    } catch (e) {
        console.error("[TermuxMobile] Failed to load dependencies:", e);
        return <div>Error loading TermuxMobile: {e.message}</div>;
    }

    const { useState, useEffect, useRef } = localDc;

    function TermuxMobile() {
        return (
            <div style={{ width: '100%', height: '100%', padding: '10px' }}>
                <TerminalView />
            </div>
        );
    }

    return <TermuxMobile />;
}

return { View };
