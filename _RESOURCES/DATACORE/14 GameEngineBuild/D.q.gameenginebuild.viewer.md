


```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////
const componentPath = dc.resolvePath("D.q.gameenginebuild.component");
const { WorldView } = await dc.require(dc.headerLink(componentPath, "ViewComponent"));
return <WorldView />;
```






