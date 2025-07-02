





```datacorejsx
// Initial query to fetch all recipe pages
const initialPath = "COOKBOOK/RECIPES/ALL";

/**
 * DraggableLink Component
 * Allows dragging the recipe title as an internal link.
 */
function DraggableLink({ title }) {
  const handleDragStart = (event) => {
    event.dataTransfer.setData("text/plain", `[[${title}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a href={title} className="internal-link" draggable onDragStart={handleDragStart} title={`Drag to copy [[${title}]]`}>
      {title}
    </a>
  );
}

// Column Definitions for the table
const COLUMNS = [
  { id: "Recipes", value: (game) => <DraggableLink title={game.$name} /> },
  { id: "Source", value: (game) => game.value("Source") || game.value("link") },
  { id: "Genre", value: (game) => game.value("genre") },
  { id: "Tags", value: (game) => game.$tags.filter(t => t.startsWith("#")).join(" ") },
  { id: "Rating", value: (game) => game.value("rating") }
];

/**
 * Group Header Components
 * Renders group headers for Genre, Tags, or Source.
 */
const GroupHeader = (label, rows) => (
  <dc.Group justify="space-between" align="center">
    <h2>{label || "Uncategorized"}</h2>
    <span>{rows.length} recipes</span>
  </dc.Group>
);

const GROUPINGS_OPTIONS = {
  "Genre": GroupHeader,
  "Tags": GroupHeader,
  "Source": GroupHeader
};

/**
 * Main View Component
 * Manages the recipe display, search, and grouping controls.
 */
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");

  // Fetch and group recipes based on query and filter
  const query = `@page and path("${queryPath}")`;
  const recipes = dc.useQuery(query);
  const grouped = dc.useArray(recipes, array => array
    .where(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
    .sort(x => x.value("rating"), 'desc')
    .groupBy(x => groupBy === "Tags"
      ? x.$tags.filter(t => t.startsWith("#")).join(", ") || "Untagged"
      : x.value(groupBy.toLowerCase()) || "Uncategorized")
    .sort(x => x.key), [recipes, nameFilter, groupBy]);

  return (
    <dc.Stack style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <dc.Group justify="space-between" style={{ padding: '10px', gap: '20px' }}>
        <dc.Textbox type="search" placeholder="Filter recipes..." onChange={e => setNameFilter(e.target.value)} />
        <dc.Textbox value={queryPath} placeholder="Enter path..." onChange={e => setQueryPath(e.target.value)} />
        <dc.Dropdown options={Object.keys(GROUPINGS_OPTIONS)} selected={groupBy} onChange={setGroupBy} />
      </dc.Group>
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        <dc.VanillaTable groupings={{ render: GROUPINGS_OPTIONS[groupBy] }} columns={COLUMNS} rows={grouped} paging={8} />
      </div>
    </dc.Stack>
  );
}

return View;
```




```jsx
// Initial query to fetch all recipe pages
const initialPath = "COOKBOOK/RECIPES/ALL";

/**
 * DraggableLink Component
 * Allows dragging the recipe title as an internal link.
 */
function DraggableLink({ title }) {
  const handleDragStart = (event) => {
    event.dataTransfer.setData("text/plain", `[[${title}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a href={title} className="internal-link" draggable onDragStart={handleDragStart} title={`Drag to copy [[${title}]]`}>
      {title}
    </a>
  );
}

// Column Definitions for the table
const COLUMNS = [
  { id: "Recipes", value: (game) => <DraggableLink title={game.$name} /> },
  { id: "Source", value: (game) => game.value("Source") || game.value("link") },
  { id: "Genre", value: (game) => game.value("genre") },
  { id: "Tags", value: (game) => game.$tags.filter(t => t.startsWith("#")).join(" ") },
  { id: "Rating", value: (game) => game.value("rating") }
];

/**
 * Group Header Components
 * Renders group headers for Genre, Tags, or Source.
 */
const GroupHeader = (label, rows) => (
  <dc.Group justify="space-between" align="center">
    <h2>{label || "Uncategorized"}</h2>
    <span>{rows.length} recipes</span>
  </dc.Group>
);

const GROUPINGS_OPTIONS = {
  "Genre": GroupHeader,
  "Tags": GroupHeader,
  "Source": GroupHeader
};

/**
 * Main View Component
 * Manages the recipe display, search, and grouping controls.
 */
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");

  // Fetch and group recipes based on query and filter
  const query = `@page and path("${queryPath}")`;
  const recipes = dc.useQuery(query);
  const grouped = dc.useArray(recipes, array => array
    .where(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
    .sort(x => x.value("rating"), 'desc')
    .groupBy(x => groupBy === "Tags"
      ? x.$tags.filter(t => t.startsWith("#")).join(", ") || "Untagged"
      : x.value(groupBy.toLowerCase()) || "Uncategorized")
    .sort(x => x.key), [recipes, nameFilter, groupBy]);

  return (
    <dc.Stack style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <dc.Group justify="space-between" style={{ padding: '10px', gap: '20px' }}>
        <dc.Textbox type="search" placeholder="Filter recipes..." onChange={e => setNameFilter(e.target.value)} />
        <dc.Textbox value={queryPath} placeholder="Enter path..." onChange={e => setQueryPath(e.target.value)} />
        <dc.Dropdown options={Object.keys(GROUPINGS_OPTIONS)} selected={groupBy} onChange={setGroupBy} />
      </dc.Group>
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        <dc.VanillaTable groupings={{ render: GROUPINGS_OPTIONS[groupBy] }} columns={COLUMNS} rows={grouped} paging={8} />
      </div>
    </dc.Stack>
  );
}

return View;
```

