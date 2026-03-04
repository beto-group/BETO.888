nnnnmnnn nn  nn  n  
  

   
```datacorejsx
const activeFile = dc.resolvePath("D.q.retromorph.viewer")
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + '/src/index.jsx');
return await View({ folderPath }, dc);
```
 