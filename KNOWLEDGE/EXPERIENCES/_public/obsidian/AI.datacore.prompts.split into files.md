



I'm using DataCore and need to refactor a component into two files:

1. **Viewer Entry Point File:**
    - This file should be as minimal as possible.
    - It should simply import the View component from the component file and render it.
    - For example:
    
```jsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////
const { View } = await dc.require(dc.headerLink("BOUNTY.component.v007.md", "ViewComponent"));
return <View />;

```
        
2. **Component Logic File:**
    - This file contains the core logic and UI of the component.
    - It should handle querying a note (e.g. `<centerLabel>.md`), extracting level‑6 headers (with fallback to raw markdown), building an icon map, and rendering a radial layout (with a central node and outer nodes that scale on hover).
    - The code should include helper functions (like cleaning header names and embedding SVG icons) and then export a single View component.
    - For example, an overview might look like:


```jsx
////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////
// Import essentials from DataCore
const { useState, useMemo } = dc;

// Configuration for the center object.
const config = {
  centerObject: "PHYSICAL.namzu" // Update as needed.
};

// [Helper functions such as parseHeaderName, VaultSvgImageEmbed, and RadialHeaderViewWithVaultIcons go here.]

/**
 * AutoRadialNamzuView:
 * - Queries for a note named "<centerLabel>.md"
 * - Extracts level‑6 headers (ignoring the first if needed)
 * - Builds an icon map and renders the radial layout
 */
function AutoRadialNamzuView({ centerLabel = config.centerObject, ignoreFirstHeader = true }) {
  // ... core logic ...
  return <RadialHeaderViewWithVaultIcons /* props */ />;
}

// Export a single View component that wraps ExampleUsage.
function ExampleUsage() {
  return <AutoRadialNamzuView centerLabel={config.centerObject} />;
}

function View({ app }) {
  return <ExampleUsage />;
}

return { View };

```

Please provide complete code— Dont be lazy, and delete, forget any functionality without adding new functionality