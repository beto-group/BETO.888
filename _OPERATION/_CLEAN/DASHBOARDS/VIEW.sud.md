




```datacorejsx

// FOR PEOPLE NOT FAMILIAR WITH CODE ONLY FOCUS ON THIS BLOCK USE LLM TO HELP BETTER UNDERSTAND

const initialSettingsOverride = {
  // PATH TO DISPLAY - ADD OWN PATH
  queryPath: "",
  // SEARCH TERM TO WANT AS INITAL PLACEHOLDER
  initialNameFilter: ".sud",
  // COLUMN WANTING DISPLAYED
  // FORMAT EX: `header` : `value`
  dynamicColumnProperties: {
    Notes: "name.obsidian", // .obsiand :means - obsidian native properties
    "Modified Date": "mtime.obsidian",
    "Creation Date": "ctime.obsidian",
  },
  // GROUPING FUNCTIONALITY , CAN ADD MULTIPLE
  // will be based of order : 1, 2, 3, ...
  // EX : ["Genre", "Source"]
  groupByColumns: ["Modified Date"],
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
// Retrieve View from setup file
const { View } = await dc.require(dc.headerLink("888/_RESOURCES/SCRIPTS/DATACORE/DATAVIEW.flexilis.md", "viewer")); // CHANGE MD TO WHATEVER YOU CALLED YOUR datacore.flexilis component

// Dynamically load settings from the current file's "settings" section ... wip . seem to not be able pick it up
/* hehe ;)
const path = dc.path; // Get the current file's path
const initialSettingsOverride = await dc.require(dc.headerLink(path, "settings"));
*/





return <View initialSettingsOverride={initialSettingsOverride} />;
```



```data
dv.table(
    ["File", "Path", "file.mtime"],
    dv.pages()
      .where(p => p.file.name.endsWith(".enigmas."))
      .map(p => [p.file.link, p.file.path, p[".enigmas."]])
);
```






<!--
VIEW FOR checking for ".enigmas"
	if we misspelled file name
```dataviewjs
dv.table(
    ["File", "Path", ".enigmas"],
    dv.pages()
      .where(p => p.file.name.endsWith(".enigmas"))
      .map(p => [p.file.link, p.file.path, p[".enigmas"]])
);
```

--->