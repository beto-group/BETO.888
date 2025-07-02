---
aliases:
  - datacore.flexilis.view.v02
  - datacore.viewer
permalink: datacore.flexilis.viewer
---

###### NAVIGATE - BACK : [[DATACORE.flexilis.v04.install]]
-----

DOWNLOAD [here](https://bafybeiad4vqixutf56mbdn2cxvof4govu2qvx2l2dwfwevdoku4u4nxl2a.ipfs.w3s.link/)

----


```datacorejsx
////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////

// This block is the main entry point for customizing the viewer settings.
// Update the options below to define your query path, columns, grouping,
// pagination, display settings, and placeholder text.

// Retrieve the View component from the setup file [update path to file location]
const { View } = await dc.require(dc.headerLink("_OPERATION/PUBLIC/DATACORE/1 DATACORE.flexilis/D.q.datacore.flexilis.component.md", "ViewComponent"));

// Customize your settings here
const initialSettingsOverride = {
  // PATH TO DISPLAY: set the directory or tag where your data resides.
  queryPath: "", // e.g., "Notes/" to display all notes in a folder
  
  // INITIAL SEARCH TERM PLACEHOLDER: text shown in the search input on load.
  initialNameFilter: "",
  
  // COLUMNS TO DISPLAY:
  // Map each column header to a corresponding property key.
  // Use the ".obsidian" suffix for native properties.
  dynamicColumnProperties: {
    Notes: "name.obsidian",
    Source: "source",
    "SUBCRIBE ;)": "tested",
    Tags: "tags",
    Genre: "rating",
    Date: "date",
    "Modified Date": "mtime.obsidian",
    "Creation Date": "ctime.obsidian",
  },
  
  // GROUPING FUNCTIONALITY:
  // Define the grouping hierarchy. The order determines both grouping and sort order.
  groupByColumns: [
    { column: "Modified Date", order: "desc" },
  ],
  
  // PAGINATION SETTINGS:
  // Configure whether pagination is enabled and the number of items per page.
  pagination: {
    isEnabled: false,
    itemsPerPage: 8,
  },
  
  // DISPLAY SETTINGS FOR CELL CONTENT:
  // Control how the content is rendered within each cell.
  display: {
    truncateText: true,        // Toggle text truncation (set to false to show full text)
    cellHeight: "88",          // Set a fixed cell height (e.g., "30" or "auto")
  },
  
  // PLACEHOLDERS FOR PERSONAL CUSTOMIZATION:
  // Update the placeholder text for search, query input, header title, etc.
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Notes Viewer",
    newHeaderLabel: "New Header Label",
    newDataField: "New Data Field",
  },
};

// Render the View component with the initial settings override
return <View initialSettingsOverride={initialSettingsOverride} app={app} />;

```