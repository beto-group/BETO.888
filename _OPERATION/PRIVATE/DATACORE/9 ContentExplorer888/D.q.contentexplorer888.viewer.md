

COMBINATION FROM CUSTOM FEED + BOUNTY VIEW

the first few in View will always show nothing wip

```datacorejsx
const { ContentExplorer } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/9 ContentExplorer888/D.q.contentexplorer888.viewer.md", "ViewComponent"));
return <ContentExplorer />;
```








# ViewComponent

```jsx
// Import the required modules/components.
const { View } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/5 CustomFeed/D.q.customfeed.component.md", "ViewComponent")
);
const { ViewBounty } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/7 BountyView 🎅/D.q.bountyview.component.md", "ViewComponentBounty")
);

/**
 * ContentExplorer Component
 *
 * This component acts as a controller.
 * Initially displays the ViewBounty component. When ViewBounty passes a file name,
 * it switches to rendering the View component (iframe player) with that file name.
 */
function ContentExplorer() { // Renamed from MainController
  const { useState } = dc;
  // Holds the file name selected from ViewBounty.
  const [selectedFile, setSelectedFile] = useState(null);
  // Keeps the modified file name for passing back to ViewBounty.
  const [lastFile, setLastFile] = useState(null);

  // When a file is selected, render the View component (iframe player)
  // with a back button. The title is modified to have ".namzu".
  if (selectedFile) {
    return (
      <div style={{ position: "relative" }}>
        {/* Back button appears in the top left */}
        <button
          style={{ position: "absolute", top: "10px", left: "10px" }}
          onClick={() => {
            // Update lastFile with the modified file name
            setLastFile(`${selectedFile}.namzu`);
            // Switch back to bounty view by clearing selectedFile.
            setSelectedFile(null);
          }}
        >
          Back
        </button>
        {/* Render the View component with modified title */}
        <View title={`${selectedFile}`} />
      </div>
    );
  }

  // Otherwise, render the ViewBounty component and pass:
  // - onFileSelect: to set the selected file.
  // - file: the modified file name from the previous selection (if any).
  return <ViewBounty onFileSelect={setSelectedFile} file={lastFile} /> ;
}

// Export the ContentExplorer component within an object as requested.
return { ContentExplorer };
```




