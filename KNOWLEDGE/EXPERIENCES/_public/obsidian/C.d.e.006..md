

REWRITE CODE FOR BETTER PROMPTS

```datacorejsx
/**
 * Recipe Management View Component
 *
 * Description:
 * ------------
 * This React component provides a user interface for managing and viewing a collection of recipes.
 * It integrates with the Obsidian ecosystem, allowing users to interact with their recipe notes
 * through draggable internal links. The component fetches recipe data based on a predefined query,
 * supports dynamic filtering, and displays the recipes in a structured, sortable table with grouping
 * by genre.
 *
 * Features:
 * ---------
 * - **Draggable Internal Links**: Users can drag recipe titles to copy their internal links,
 *   facilitating easy referencing within Obsidian notes.
 * - **Dynamic Filtering**: A search box allows users to filter recipes by name in real-time.
 * - **Grouped Display**: Recipes are grouped by genre, with an option for "Uncategorized" if no genre is specified.
 * - **Sortable Columns**: Recipes are sorted in descending order based on their ratings.
 * - **Responsive Design**: The layout adjusts to different screen sizes, ensuring usability across devices.
 * - **Paging Support**: The table supports pagination, displaying a specified number of recipes per page.
 *
 * Limitations:
 * ------------
 * - **Data Dependencies**: Assumes the presence of a `dc` library that provides hooks like `useState`,
 *   `useQuery`, and components like `Stack`, `Group`, and `VanillaTable`. Ensure that these are correctly
 *   imported and available in the project environment.
 * - **Hardcoded Query**: The recipe data is fetched using a fixed query. Future enhancements might include
 *   making the query dynamic or configurable by the user.
 * - **Genre Grouping Only**: Currently, recipes are only grouped by genre. Additional grouping criteria
 *   (e.g., by tags or source) are not supported.
 * - **Styling Assumptions**: The component relies on specific CSS classes (e.g., `internal-link`) to match
 *   Obsidian's styling. Ensure that these styles are defined in your project's CSS.
 *
 * Intended Use:
 * -------------
 * Designed for integration within the Obsidian ecosystem, this component serves as a specialized view
 * for managing recipe notes. It is ideal for users who maintain a structured collection of recipes and
 * require an efficient way to search, organize, and reference them within their knowledge base.
 *
 * Design Considerations:
 * ----------------------
 * - **Maintainability**: The code is structured to facilitate easy updates and scalability. Components like
 *   `DraggableLink` are modular, allowing for reuse and independent testing.
 * - **Performance**: Utilizes React hooks and efficient data processing methods (`useArray`) to ensure
 *   optimal performance, even with large datasets.
 * - **Accessibility**: Incorporates accessible attributes (e.g., `title` on links) to enhance usability
 *   for all users.
 * - **Extensibility**: The architecture allows for future enhancements, such as additional filtering options,
 *   more complex grouping mechanisms, or integration with other data sources.
 *
 * Author:
 * -------
 * Developed with a focus on longevity and clarity, ensuring that the component remains understandable
 * and adaptable for future development needs.
 */

// Define the query to fetch all recipe pages within the specified path
const query = `@page and path("COOKBOOK/RECIPES/ALL")`;

/**
 * DraggableLink Component
 *
 * Renders a draggable link that allows users to drag and copy the recipe title as an internal link.
 *
 * Props:
 * - title (string): The title of the recipe to be displayed and used in the link.
 */
function DraggableLink({ title }) {
  const handleDragStart = (event) => {
    // Set the data to be transferred during the drag
    event.dataTransfer.setData("text/plain", `[[${title}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a
      href={`${title}`} // Links directly to the note without the '#'
      className="internal-link" // Ensure this matches Obsidian's internal link class
      draggable
      onDragStart={handleDragStart}
      title={`Drag to copy [[${title}]]`}
    >
      {title} {/* Display only the title without brackets */}
    </a>
  );
}

// Column Definitions for the VanillaTable component
const COLUMNS = [
  { 
    id: "Recipes", 
    value: (game) => <DraggableLink title={game.$name} /> // Renders the DraggableLink component
  },
  { 
    id: "Source", 
    value: (game) => game.value("Source") ?? game.value("link") 
  },
  { 
    id: "Genre", 
    value: (game) => game.value("genre") 
  },
  { 
    id: "Tags", 
    value: (game) => game.$tags.filter(t => t.startsWith("#")).join(" ") 
  },
  { 
    id: "Rating", 
    value: (game) => game.value("rating") 
  }
];

/**
 * GenreGroup Component
 *
 * Renders the group header for a specific genre, displaying the genre name and the number of recipes.
 *
 * Props:
 * - genre (string): The genre name.
 * - rows (array): The array of recipes under this genre.
 */
function GenreGroup(genre, rows) {
  return (
    <dc.Group justify="space-between" align="center">
      <h2>{genre || "Uncategorized"}</h2>
      <span>{rows.length} recipes</span>
    </dc.Group>
  );
}

// Groupings Configuration for the VanillaTable component
const GROUPINGS = { render: GenreGroup };

/**
 * View Component
 *
 * The main component that renders the recipe management interface, including search controls and the recipe table.
 */
function View() {
  // State for the name filter input
  const [nameFilter, setNameFilter] = dc.useState("");

  // Fetch recipes based on the predefined query
  const recipes = dc.useQuery(query);

  // Process and group recipes based on the name filter and genre
  const grouped = dc.useArray(recipes, array => {
    return array
      .where(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
      .sort(x => x.value("rating"), 'desc')
      .groupBy(x => x.value("genre") || "Uncategorized")
      .sort(x => x.key);
  }, [nameFilter]);

  // Styling for the main view container
  const viewStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  // Styling for the search control section
  const searchControlStyle = {
    padding: '10px',
    flexShrink: 0
  };

  // Styling for the table container to enable scrolling
  const tableContainerStyle = {
    flexGrow: 1,
    overflowY: 'auto'
  };

  return (
    <dc.Stack style={viewStyle}>
      {/* Search Controls */}
      <dc.Group id="search-controls" justify="end" style={searchControlStyle}>
        <dc.Textbox 
          type="search" 
          placeholder="Filter recipes..." 
          width="600px" 
          onChange={e => setNameFilter(e.target.value)} 
        />
      </dc.Group>

      {/* Recipe Table */}
      <div style={tableContainerStyle}>
        <dc.VanillaTable 
          groupings={GROUPINGS} 
          columns={COLUMNS} 
          rows={grouped} 
          paging={8} // Number of recipes per page
        />
      </div>
    </dc.Stack>
  );
}

// Return the View component directly for the DataCore plugin to use
return View;
```





CODE


```jsx
/**
 * Recipe Management View Component
 *
 * Description:
 * ------------
 * This React component provides a user interface for managing and viewing a collection of recipes.
 * It integrates with the Obsidian ecosystem, allowing users to interact with their recipe notes
 * through draggable internal links. The component fetches recipe data based on a predefined query,
 * supports dynamic filtering, and displays the recipes in a structured, sortable table with grouping
 * by genre.
 *
 * Features:
 * ---------
 * - **Draggable Internal Links**: Users can drag recipe titles to copy their internal links,
 *   facilitating easy referencing within Obsidian notes.
 * - **Dynamic Filtering**: A search box allows users to filter recipes by name in real-time.
 * - **Grouped Display**: Recipes are grouped by genre, with an option for "Uncategorized" if no genre is specified.
 * - **Sortable Columns**: Recipes are sorted in descending order based on their ratings.
 * - **Responsive Design**: The layout adjusts to different screen sizes, ensuring usability across devices.
 * - **Paging Support**: The table supports pagination, displaying a specified number of recipes per page.
 *
 * Limitations:
 * ------------
 * - **Data Dependencies**: Assumes the presence of a `dc` library that provides hooks like `useState`,
 *   `useQuery`, and components like `Stack`, `Group`, and `VanillaTable`. Ensure that these are correctly
 *   imported and available in the project environment.
 * - **Hardcoded Query**: The recipe data is fetched using a fixed query. Future enhancements might include
 *   making the query dynamic or configurable by the user.
 * - **Genre Grouping Only**: Currently, recipes are only grouped by genre. Additional grouping criteria
 *   (e.g., by tags or source) are not supported.
 * - **Styling Assumptions**: The component relies on specific CSS classes (e.g., `internal-link`) to match
 *   Obsidian's styling. Ensure that these styles are defined in your project's CSS.
 *
 * Intended Use:
 * -------------
 * Designed for integration within the Obsidian ecosystem, this component serves as a specialized view
 * for managing recipe notes. It is ideal for users who maintain a structured collection of recipes and
 * require an efficient way to search, organize, and reference them within their knowledge base.
 *
 * Design Considerations:
 * ----------------------
 * - **Maintainability**: The code is structured to facilitate easy updates and scalability. Components like
 *   `DraggableLink` are modular, allowing for reuse and independent testing.
 * - **Performance**: Utilizes React hooks and efficient data processing methods (`useArray`) to ensure
 *   optimal performance, even with large datasets.
 * - **Accessibility**: Incorporates accessible attributes (e.g., `title` on links) to enhance usability
 *   for all users.
 * - **Extensibility**: The architecture allows for future enhancements, such as additional filtering options,
 *   more complex grouping mechanisms, or integration with other data sources.
 *
 * Author:
 * -------
 * Developed with a focus on longevity and clarity, ensuring that the component remains understandable
 * and adaptable for future development needs.
 */

// Define the query to fetch all recipe pages within the specified path
const query = `@page and path("COOKBOOK/RECIPES/ALL")`;

/**
 * DraggableLink Component
 *
 * Renders a draggable link that allows users to drag and copy the recipe title as an internal link.
 *
 * Props:
 * - title (string): The title of the recipe to be displayed and used in the link.
 */
function DraggableLink({ title }) {
  const handleDragStart = (event) => {
    // Set the data to be transferred during the drag
    event.dataTransfer.setData("text/plain", `[[${title}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a
      href={`${title}`} // Links directly to the note without the '#'
      className="internal-link" // Ensure this matches Obsidian's internal link class
      draggable
      onDragStart={handleDragStart}
      title={`Drag to copy [[${title}]]`}
    >
      {title} {/* Display only the title without brackets */}
    </a>
  );
}

// Column Definitions for the VanillaTable component
const COLUMNS = [
  { 
    id: "Recipes", 
    value: (game) => <DraggableLink title={game.$name} /> // Renders the DraggableLink component
  },
  { 
    id: "Source", 
    value: (game) => game.value("Source") ?? game.value("link") 
  },
  { 
    id: "Genre", 
    value: (game) => game.value("genre") 
  },
  { 
    id: "Tags", 
    value: (game) => game.$tags.filter(t => t.startsWith("#")).join(" ") 
  },
  { 
    id: "Rating", 
    value: (game) => game.value("rating") 
  }
];

/**
 * GenreGroup Component
 *
 * Renders the group header for a specific genre, displaying the genre name and the number of recipes.
 *
 * Props:
 * - genre (string): The genre name.
 * - rows (array): The array of recipes under this genre.
 */
function GenreGroup(genre, rows) {
  return (
    <dc.Group justify="space-between" align="center">
      <h2>{genre || "Uncategorized"}</h2>
      <span>{rows.length} recipes</span>
    </dc.Group>
  );
}

// Groupings Configuration for the VanillaTable component
const GROUPINGS = { render: GenreGroup };

/**
 * View Component
 *
 * The main component that renders the recipe management interface, including search controls and the recipe table.
 */
function View() {
  // State for the name filter input
  const [nameFilter, setNameFilter] = dc.useState("");

  // Fetch recipes based on the predefined query
  const recipes = dc.useQuery(query);

  // Process and group recipes based on the name filter and genre
  const grouped = dc.useArray(recipes, array => {
    return array
      .where(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
      .sort(x => x.value("rating"), 'desc')
      .groupBy(x => x.value("genre") || "Uncategorized")
      .sort(x => x.key);
  }, [nameFilter]);

  // Styling for the main view container
  const viewStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  // Styling for the search control section
  const searchControlStyle = {
    padding: '10px',
    flexShrink: 0
  };

  // Styling for the table container to enable scrolling
  const tableContainerStyle = {
    flexGrow: 1,
    overflowY: 'auto'
  };

  return (
    <dc.Stack style={viewStyle}>
      {/* Search Controls */}
      <dc.Group id="search-controls" justify="end" style={searchControlStyle}>
        <dc.Textbox 
          type="search" 
          placeholder="Filter recipes..." 
          width="600px" 
          onChange={e => setNameFilter(e.target.value)} 
        />
      </dc.Group>

      {/* Recipe Table */}
      <div style={tableContainerStyle}>
        <dc.VanillaTable 
          groupings={GROUPINGS} 
          columns={COLUMNS} 
          rows={grouped} 
          paging={8} // Number of recipes per page
        />
      </div>
    </dc.Stack>
  );
}

// Return the View component directly for the DataCore plugin to use
return View;
```



