

```datacorejsx
const activeFile = dc.resolvePath("D.q.chromeextensionbridge.viewer") || "_RESOURCES/DATACORE/105_ChromeExtensionBridge/D.q.chromeextensionbridge.viewer";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```
