



```datacorejsx
const activeFile = dc.resolvePath("D.q.obsidianclicommandlab.viewer") || "_RESOURCES/DATACORE/102 ObsidianCLICommandLab/D.q.obsidianclicommandlab.viewer";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath });
```
