
```datacorejsx
const activeFile = dc.resolvePath("D.q.keychainmanager.viewer")
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

// index.jsx exports a function: async function View({ folderPath }) { ... }
// index.jsx exports { View: async function... }
const { View } = await dc.require(folderPath + '/src/index.jsx');

// We execute View() with the folderPath prop
return await View({ folderPath });
```
	