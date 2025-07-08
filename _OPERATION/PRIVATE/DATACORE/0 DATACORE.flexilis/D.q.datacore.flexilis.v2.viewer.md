---
aliases:
  - datacore.query.view.v03
---


```jsx
// FOR PEOPLE NOT FAMILIAR WITH CODE ONLY FOCUS ON THIS BLOCK USE LLM TO HELP BETTER UNDERSTAND

const initialSettingsOverride = {
  // PATH TO DISPLAY - ADD OWN PATH
  queryPath: "",
  // SEARCH TERM TO WANT AS INITAL PLACEHOLDER
  initialNameFilter: "",
  // COLUMN WANTING DISPLAYED
  // FORMAT EX: `header` : `value`
  dynamicColumnProperties: {
    Notes: "name.obsidian", // .obsiand :means - obsidian native properties
    Source: "source",
    "Genre ;)": "genre",
    Tags: "tags",
    Ingredients: "ingredients",
    "Creation Date": "ctime.obsidian",
  },
  // GROUPING FUNCTIONALITY , CAN ADD MULTIPLE
  // will be based of order : 1, 2, 3, ...
  // EX : ["Genre", "Source"]
  groupByColumns: [],
  // PAGINATION SETTING
  pagination: {
    isEnabled: true,
    itemsPerPage: 8,
  },
  // MISCELLANEOUS HEADERS FOR PERSONAL CUSTOMIZATION.
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Notes Viewer",
    newHeaderLabel: "New Header Label",
    newDataField: "New Data Field",
  },
  // WIP this isnt implemented but duable i believe
  quickAddCommandId: "quickadd:add_recipe", // **NEW:** : ALLOWING file creation: QuickAdd command ID
  vaultName: "OBSIDIAN", // **IMPORTANT:** Replace with your actual vault name
  viewHeight: "600px", //wip
};


// DONT PAY ATTENTION AFTER THIS IF U DONT CARE ABOUT CODING... hehe

// Retrieve View from setup file
// ("[file_accessing]","[specific header within]")
const { View } = await dc.require(dc.headerLink("component.v09.md", "viewer"));

// Dynamically load settings from the current file's "settings" section ... wip . seem to not be able pick it up
/* hehe ;)
const path = dc.path; // Get the current file's path
const initialSettingsOverride = await dc.require(dc.headerLink(path, "settings"));
*/


return <View initialSettingsOverride={initialSettingsOverride} />;
```