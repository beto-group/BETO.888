


# Beto Skills


```datacorejsx
const activeFile = dc.resolvePath("BETOSKILL/v.betoskills")
// Calculate folder path relative to the viewer file
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

// Dynamically require the index
const { View } = await dc.require(folderPath + '/src/index.jsx');

// Render
return await View({ folderPath });
```
