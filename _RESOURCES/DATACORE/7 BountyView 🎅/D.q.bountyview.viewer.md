


```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////

// Retrieve the View component from the setup file
const { ViewBounty } = await dc.require(dc.headerLink(dc.resolvePath("D.q.bountyview.component"), "ViewComponentBounty"));

// Render the View component
// showViewButton prop: set to false to hide the "View" button (default: true)
return <ViewBounty showViewButton={false} />;

```
