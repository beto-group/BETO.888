/**
 * View factory for OpenBrowser Component
 */
async function View({ folderPath }) {
    const { useState } = dc;

    // Load dependencies
    const { BrowserTester } = await dc.require(folderPath + '/src/components/BrowserTester.jsx');

    function ViewComponent() {
        return (
            <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
                <BrowserTester folderPath={folderPath} />
            </div>
        );
    }

    return <ViewComponent />;
}

return { View };
