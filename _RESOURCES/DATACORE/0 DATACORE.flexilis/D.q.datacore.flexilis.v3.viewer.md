
#### MODIFY TO YOUR OWN DESIRE 

```jsx
// Retrieve View from setup file
const { View } = await dc.require(dc.headerLink("component.88.md", "viewer")); // CHANGE MD TO WHATEVER YOU CALLED YOUR datacore.flexilis component

const initialSettingsOverride = {
  queryPath: "", // CHANGE PATH
  initialNameFilter: "", // SEARCH 
  dynamicColumnProperties: { // COLUMN RENDER
    Book: "name.obsidian",
    Genre: "genre",
    Source: "source",
    Diet: "diet",
    Tags: "tags",
    Ingredients: "ingredients",
    "Creation Date": "ctime.obsidian",
  },
  groupByColumns: [ { column: "Genre", order: "asc" }, { column: "Source", order: "desc" }, ], // GROUP , add multiple orders [asc, desc]
  pagination: { // PAGINATION OPTIONS
    isEnabled: true,
    itemsPerPage: 5,
  },
  viewHeight: "750px", // DOESNT WORk :(
  placeholders: { // GENERAL TITLE , for quick customization
    nameFilter: "Search notes here...",
    queryPath: "Enter your custom path...",
    headerTitle: "My Custom Notes Viewer",
  },
};

return <View initialSettingsOverride={initialSettingsOverride} />;
```
