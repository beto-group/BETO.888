

```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////

const filename = dc.resolvePath("D.q.codeeditor.component.v2.md");
const { GitControl } = await dc.require(dc.headerLink(filename, "ViewComponent"));
return <GitControl filename={filename}/>;


```

