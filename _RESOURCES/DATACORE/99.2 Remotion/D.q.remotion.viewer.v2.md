    
   
```datacorejsx
const activeFile = dc.resolvePath("D.q.remotion.viewer.v2")
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + '/src/index.jsx');
return await View({ folderPath });
```
 