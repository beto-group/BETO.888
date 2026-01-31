
# Viewer

```datacorejsx
const activeFile = dc.app.workspace.getActiveFile()?.path || "";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

// Import the View from the standard 'ViewComponent' section
const module = await dc.require(dc.headerLink(dc.resolvePath("D.q.doomplayer.component.md"), "ViewComponent"));
// Handle { View } export, { default } export, or direct function export
const Entry = module.View || module.default || module;

if (!Entry) {
    return <div>Error: Main component did not export a View, default, or function.</div>;
}

// Execute the View Factory (handles async components/factories)
// We pass folderPath as a prop/argument
try {
    return await Entry({ folderPath });
} catch (err) {
    console.error("Viewer Execution Error:", err);
    return <div>Error executing component: {err.message}</div>;
}
```
