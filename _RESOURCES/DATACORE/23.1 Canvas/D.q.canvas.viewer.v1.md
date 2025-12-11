


```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////
const whichCanvasToLoad = "ShowcaseCanvas"; // This could come from a file property, a user setting, etc.


const { InfiniteCanvas } = await dc.require(dc.headerLink(dc.resolvePath("D.q.canvas.component.v1.md"), "ViewComponent"));
return <InfiniteCanvas saveState={whichCanvasToLoad} />;


```

