
###### NAVIGATE - BACK : [[DASHBOARD]]
-----

redo in datacore hehe




```datacorejsx

////////////////////////////////////////////////////
///             Viewer Entry Point               ///
////////////////////////////////////////////////////

// For people not familiar with code, focus on this block.
// This is where you can customize the viewer settings.

// Retrieve the View component from the setup file
const { View } = await dc.require(dc.headerLink("888/_RESOURCES/SCRIPTS/DATACORE/DATAVIEW.flexilis.md", "ViewComponent"));

// Customize your settings here
const initialSettingsOverride = {
  // PATH TO DISPLAY - ADD YOUR OWN PATH
  queryPath: "", // e.g., "Notes/" to display all notes in the "Notes" folder
  // INITIAL SEARCH TERM PLACEHOLDER
  initialNameFilter: "",
  // COLUMNS YOU WANT TO DISPLAY
  // FORMAT: `header` : `value`
  dynamicColumnProperties: {
    Notes: "name.obsidian", // .obsiand :means - obsidian native properties
    "Modified Date": "mtime.obsidian",
    "Creation Date": "ctime.obsidian",
  },
  // GROUPING FUNCTIONALITY, CAN ADD MULTIPLE
  // The order determines the grouping hierarchy and sort order
  groupByColumns: [
    { column: "Modified Date", order: "desc" },
  ],
  // PAGINATION SETTINGS
  pagination: {
    isEnabled: true,
    itemsPerPage: 10,
  },
  // PLACEHOLDERS FOR PERSONAL CUSTOMIZATION
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Recipe Viewer",
    newHeaderLabel: "New Header Label",
    newDataField: "New Data Field",
  },
  // QuickAdd command ID for allowing file creation (optional)
  quickAddCommandId: "quickadd:add_recipe",
  vaultName: "YourActualVaultName", // **IMPORTANT:** Replace with your actual vault name
  viewHeight: "600px", // Optional
};

// Render the View component with the initial settings override
return <View initialSettingsOverride={initialSettingsOverride} app={app} />;

```





```data
TABLE file.ctime, file.mtime
FROM ""
SORT file.mtime desc
```




