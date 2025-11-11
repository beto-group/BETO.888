




```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////
const componentPath = dc.resolvePath("D.q.musicbuilder.component");
const { View } = await dc.require(dc.headerLink(componentPath, "ViewComponent"));
return <View />;
```
