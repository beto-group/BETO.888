---
title: Bounty View
---

```datacorejsx
/**
 * Viewer Entry Point
 * Implements Rule #13 relative path resolution anchor
 */
const indexFile = dc.resolvePath("./src/index.jsx");
const folderPath = indexFile.substring(0, indexFile.lastIndexOf('/src/index.jsx'));

const { View } = await dc.require(indexFile);
return await View({ folderPath });
```
