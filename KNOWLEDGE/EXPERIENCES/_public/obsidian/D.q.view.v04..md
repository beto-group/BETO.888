






```jsx
// Retrieve View from setup file
const { View } = await dc.require(dc.headerLink("component.v9.md", "viewer"));

const initialSettingsOverride = {
  queryPath: "COOKBOOK/RECIPES/ALL",
  initialNameFilter: "",
  dynamicColumnProperties: {
    Recipes: "name.obsidian",
    Source: "source",
    Diet: "diet",
    Tags: "tags",
    Ingredients: "ingredients",
    "Creation Date": "ctime.obsidian",
  },
  groupByColumns: ["Genre"],
  pagination: {
    isEnabled: true,
    itemsPerPage: 5,
  },
  viewHeight: "750px",
  placeholders: {
    nameFilter: "Search recipes here...",
    queryPath: "Enter your custom path...",
    headerTitle: "My Custom Recipe Viewer",
  },
};

return <View initialSettingsOverride={initialSettingsOverride} />;
```


> [!info]- SETTINGS
> # settings
> ```tsx
> function initialSettingsOverride() {
> const settings = {
> 	queryPath: "CUSTOM_PATH/RECIPES",
> 	initialNameFilter: "search_term_here",
> 	dynamicColumnProperties: 
> 	  Recipes: "name.obsidian",
> 	    Source: "source",
> 	    Diet: "diet",
> 	    Tags: "tags",
> 	    Ingredients: "ingredients",
> 	"Creation Date": "ctime.obsidian",
> 	},
> 	groupByColumns: ["Genre"],
> 	pagination: {
> 	  isEnabled: false,
> 	itemsPerPage: 10,
> 	},
> 	viewHeight: "750px",
> 	placeholders: {
> 	  nameFilter: "Search recipes here...",
> 	    queryPath: "Enter your custom path...",
> 	headerTitle: "My Custom Recipe Viewer",
> },
> };
> ```





