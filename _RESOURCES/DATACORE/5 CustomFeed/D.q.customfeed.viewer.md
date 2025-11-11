


```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////
const { View } = await dc.require(dc.headerLink(dc.resolvePath("D.q.customfeed.component"), "ViewComponent"));

// Options:
// spawnType: 
//   - "fullTab" (default) - starts in full-tab mode with toggle enabled
//   - "compact" - starts in compact mode with toggle enabled
//   - "fullTab.locked" - starts in full-tab mode with toggle disabled
//   - "compact.locked" - starts in compact mode with toggle disabled
//   - "disabled" - completely disables full-tab mode, spawns in default/compact with no button

return <View spawnType="default" />;

```

