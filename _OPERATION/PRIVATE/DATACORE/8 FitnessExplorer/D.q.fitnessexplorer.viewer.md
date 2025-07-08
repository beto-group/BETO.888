

![[fitness_explorer.webp]]


```datacorejsx
const { ContentExplorer } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/8 FitnessExplorer/D.q.fitnessexplorer.viewer.md", "ViewComponent"));
return <ContentExplorer />;
```

# ViewComponent

```jsx
// Import the required modules/components.
const { View } = await dc.require(
  dc.headerLink("_OPERATION/PRIVATE/DATACORE/5 CustomFeed/D.q.customfeed.component.md", "ViewComponent")
);
const { FitnessView } = await dc.require(
  dc.headerLink("_OPERATION/PRIVATE/DATACORE/8 FitnessExplorer/D.q.fitnessexplorer.component.md", "ViewComponent")
);

/**
 * ContentExplorer Component
 *
 * This component acts as a controller.
 * Initially displays the FitnessView component. When FitnessView passes a group name,
 * it transforms that name (capitalizes it and adds ".enigmas") and switches to rendering
 * the View component (iframe player) with that transformed name.
 */
function ContentExplorer() { // Renamed from MainController
  const { useState } = dc;
  // Holds the transformed file name (group name) received from FitnessView.
  const [selectedFile, setSelectedFile] = useState(null);
  // Keeps the modified file name for passing back to FitnessView.
  const [lastFile, setLastFile] = useState(null);

  const handleGroupSelect = (group) => {
    if (group) {
      const transformedName = group.toUpperCase() + ".enigmas";
      console.log("Selected group:", transformedName);
      setSelectedFile(transformedName);
    }
  };

  const handleBackClick = () => {
    console.log("Back button clicked, current selectedFile:", selectedFile);
    // Update lastFile if needed.
    // The previous component added ".namzu" here. Re-adding it for consistency,
    // though the prompt implies it's not strictly necessary for this specific
    // flow unless FitnessView uses it.
    if (selectedFile) {
      setLastFile(`${selectedFile}.namzu`); // Keeping this as a potential placeholder.
    }
    // Reset selectedFile to show FitnessView.
    setSelectedFile(null);
  };

  if (selectedFile) {
    return (
      <div style={{ position: "relative" }}>
        {/* Back button appears in the top left */}
        <button
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            zIndex: 1000, // Ensure button is above other elements
            padding: "8px 16px",
            cursor: "pointer",
          }}
          onClick={handleBackClick}
        >
          Back
        </button>
        <View title={selectedFile} />
      </div>
    );
  }

  return <FitnessView onFileSelect={handleGroupSelect} file={lastFile} />;
}

// Export the ContentExplorer component within an object as requested.
return { ContentExplorer };
```

