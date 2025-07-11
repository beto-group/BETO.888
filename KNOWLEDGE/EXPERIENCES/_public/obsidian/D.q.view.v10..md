




```jsx
return function View() {  
// Returns full page metadata for the current file, and updates the view whenever the current  
// file changes.  
const current = dc.useCurrentFile();  
  
// Returns file metadata for a file at a specific path.  
const other = dc.useFile("component.v13.md");  

console.log(other.$ctime)
console.log(current)

return <p>You are on {current.$path}; you are loading from {other.$path}.</p>;  
}
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





