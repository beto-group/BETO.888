



```datacorejsx
// Retrieve View from setup file
const { View } = await dc.require(dc.headerLink("component.v21.md", "viewer"));

// Optional: Override initial settings
const initialSettingsOverride = {
  // List of file paths to load as columns
  filesAsColumns: [
    "test.md",
    "test1.md",
    "test11.md",
  ],
  // Separator used within each file to split into items
  // Can be a regex pattern to match separator lines (e.g., '^[-]{3,}$' for lines with 3 or more dashes)
  itemSeparatorPattern: '^[-]{3,}$', // Matches lines with three or more dashes
  // Whether to treat the separator as a regex pattern (true) or a plain string (false)
  useRegexSeparator: true,
  viewHeight: "600px",
  placeholders: {
    laneTitle: "Enter lane title...",
    laneFilePath: "Enter file path for lane...",
    itemContent: "Enter item content...",
  },
};

// Render the View component with overrides
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





