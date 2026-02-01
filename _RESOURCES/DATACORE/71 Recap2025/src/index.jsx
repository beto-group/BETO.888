
async function View({ folderPath }) {
    // Simple Pattern: Use the passed folderPath to locate App.jsx
    // This assumes standard folder structure: [Root]/src/App.jsx

    // Safety check just in case
    if (!folderPath) throw new Error("View requires folderPath prop");

    const appPath = folderPath + '/src/App.jsx';
    const { AnimationTool } = await dc.require(appPath);

    // We pass folderPath down to allow robust local resource resolution
    return <AnimationTool folderPath={folderPath} />;
}

return { View };
