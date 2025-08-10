

```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////

// Retrieve the View component from the setup file (update the file path if needed)
const { View } = await dc.require(dc.headerLink("888/_RESOURCES/SCRIPTS/DATACORE/DATACORE.graphview.md", "ViewComponent"));

// Render the View component with any initial settings override (if required)
return <View />;

```
