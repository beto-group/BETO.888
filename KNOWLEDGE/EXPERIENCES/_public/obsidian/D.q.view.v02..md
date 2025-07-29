

```jsx
// Retrieve View from setup file
const { View } = await dc.require(dc.headerLink("component.v08.md", "viewer"));

// Dynamically load settings from the current file's "settings" section ... wip . seem to not be able pick it up
/* hehe ;)
const path = dc.path; // Get the current file's path
const initialSettingsOverride = await dc.require(dc.headerLink(path, "settings"));
*/

const initialSettingsOverride = {
  vaultName: "OBSIDIAN", // **IMPORTANT:** Replace with your actual vault name
  queryPath: "COOKBOOK/RECIPES/ALL",
  initialNameFilter: "",
  dynamicColumnProperties: {
    Recipes: "name.obsidian", // .obsiand :means - obsidian native properties
    Source: "source",
    Genre: "genre",
    Tags: "tags",
    Ingredients: "ingredients",
    "Creation Date": "ctime.obsidian",
  },
  groupByColumns: [],
  pagination: {
    isEnabled: true,
    itemsPerPage: 3,
  },
  viewHeight: "600px",
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Recipe Viewer",
    newHeaderLabel: "New Header Label",
    newDataField: "New Data Field",
  },
  quickAddCommandId: "quickadd:add_recipe", // **NEW:** : ALLOWING file creation: QuickAdd command ID
};


return <View initialSettingsOverride={initialSettingsOverride} />;
```