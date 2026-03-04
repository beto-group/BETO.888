
# Open Application

```datacorejsx
const activeFile = dc.resolvePath("D.q.openapplication.viewer");
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + '/src/index.jsx');
return await View({ folderPath });
```
