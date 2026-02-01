




```datacorejsx
const activeFile = dc.resolvePath("D.q.recap2025.viewer.md") || dc.resolvePath("D.q.recap2025.viewer");
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + '/src/index.jsx');
return await View({ folderPath });
```
