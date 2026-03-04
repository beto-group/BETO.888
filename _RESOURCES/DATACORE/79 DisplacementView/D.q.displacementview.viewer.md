---
cssClass: datacore-no-padding datacore-no-border datacore-hide-header
---

```datacorejsx
const activeFile = dc.resolvePath("D.q.displacementview.viewer");
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```

