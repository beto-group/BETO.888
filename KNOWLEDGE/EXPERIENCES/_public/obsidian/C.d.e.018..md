


```datacorejsx
const initialPath = "COOKBOOK/RECIPES/ALL";

// Master controller for column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props) => props,
  getFallbackValue: () => 'Unknown',
  getNoDataFallback: () => 'No Data'
};

// Define the dynamic column properties
const DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns({
  "Recipes": "name.obsidian",
  "Source": "source",
  "Genre": "genre",
  "Tags": "tags",
  "Ingredients": "ingredients",
  "Creation Date": "ctime.obsidian"
});

// Retrieve properties with fallback
function getProperty(entry, property) {
  if (property.endsWith('.obsidian')) {
    const cleanProp = property.replace('.obsidian', '');
    switch (cleanProp) {
      case 'ctime':
        return entry.$ctime ? entry.$ctime.toISODate() : MASTER_COLUMN_CONTROLLER.getFallbackValue();
      case 'name':
        return entry.$name || 'Unnamed';
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
    }
  }

  if (entry.$frontmatter?.hasOwnProperty(property)) {
    const field = entry.$frontmatter[property];
    return field?.value ? field.value.toString() : 'Unknown';
  }
  return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
}

// Draggable link component
function DraggableLink({ title }) {
  const handleDrag = (e) => e.dataTransfer.setData("text/plain", `[[${title}]]`);
  return <a href={title} draggable onDragStart={handleDrag}>{title}</a>;
}

// Column management and sorting
function ColumnManager({ columns, setColumnsToShow, sortColumn, setSortColumn, sortOrder, setSortOrder }) {
  return (
    <div>
      <label>Columns:</label>
      <dc.Dropdown multiple options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)} selected={columns} onChange={setColumnsToShow} />
      <label>Sort Column:</label>
      <dc.Dropdown options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)} selected={sortColumn} onChange={setSortColumn} />
      <label>Sort Order:</label>
      <dc.Dropdown options={['asc', 'desc']} selected={sortOrder} onChange={setSortOrder} />
    </div>
  );
}

// Generate dynamic columns
const COLUMNS = Object.keys(DYNAMIC_COLUMN_PROPERTIES).map(id => ({
  id,
  value: (entry) => id === "Recipes" ? <DraggableLink title={getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[id])} /> : getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[id])
}));

// Main View
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(COLUMNS.map(c => c.id));
  const [sortColumn, setSortColumn] = dc.useState("Recipes");
  const [sortOrder, setSortOrder] = dc.useState("asc");
  const [isEditingHeaders, setIsEditingHeaders] = dc.useState(false);
  const [editedHeaders, setEditedHeaders] = dc.useState({});

  // Fetch query data from the path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering
  const filteredData = qdata.filter(entry =>
    getProperty(entry, "name.obsidian").toLowerCase().includes(nameFilter.toLowerCase())
  );

  // Sort data
  const sortedData = filteredData.sort((a, b) => {
    const aValue = getProperty(a, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    const bValue = getProperty(b, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  // Group data
  const grouped = dc.useArray(sortedData, array =>
    array.groupBy(x => getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy])).sort(x => x.key)
  );

  // Toggle Header Editing
  const toggleHeaderEdit = () => {
    setIsEditingHeaders(!isEditingHeaders);
  };

  // Handle header change
  const handleHeaderChange = (columnId, newHeader) => {
    setEditedHeaders(prev => ({ ...prev, [columnId]: newHeader }));
  };

  // Apply new header names and regenerate query
  const applyNewHeaders = () => {
    // Apply new header names, then fetch new query data or perform any necessary actions
    toggleHeaderEdit();
    // Re-run or update queries if needed based on changed headers.
  };

  return (
    <dc.Stack>
      <dc.Group>
        <dc.Textbox
          type="search"
          placeholder="Filter recipes..."
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
        />
        <dc.Textbox
          value={queryPath}
          placeholder="Enter path..."
          onChange={e => setQueryPath(e.target.value)}
        />
        <dc.Dropdown
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={groupBy}
          onChange={setGroupBy}
        />
        <button onClick={toggleHeaderEdit}>
          {isEditingHeaders ? 'Stop Editing Headers' : 'Edit Headers'}
        </button>
        {isEditingHeaders && (
          <button onClick={applyNewHeaders}>Apply Changes</button>
        )}
      </dc.Group>

      <dc.VanillaTable
        groupings={{
          render: (label, rows) => <h2>{label || 'Uncategorized'}</h2>
        }}
        columns={COLUMNS.filter(c => columnsToShow.includes(c.id)).map(column => ({
          ...column,
          header: isEditingHeaders ? (
            <input
              type="text"
              value={editedHeaders[column.id] || column.id}
              onChange={e => handleHeaderChange(column.id, e.target.value)}
            />
          ) : (
            editedHeaders[column.id] || column.id
          )
        }))}
        rows={grouped}
        paging={8}
      />
    </dc.Stack>
  );
}

return View;
```






```jsx
const initialPath = "COOKBOOK/RECIPES/ALL";

// Master controller for column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props) => props,
  getFallbackValue: () => 'Unknown',
  getNoDataFallback: () => 'No Data'
};

// Define the dynamic column properties
const DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns({
  "Recipes": "name.obsidian",
  "Source": "source",
  "Genre": "genre",
  "Tags": "tags",
  "Ingredients": "ingredients",
  "Creation Date": "ctime.obsidian"
});

// Retrieve properties with fallback
function getProperty(entry, property) {
  if (property.endsWith('.obsidian')) {
    const cleanProp = property.replace('.obsidian', '');
    switch (cleanProp) {
      case 'ctime':
        return entry.$ctime ? entry.$ctime.toISODate() : MASTER_COLUMN_CONTROLLER.getFallbackValue();
      case 'name':
        return entry.$name || 'Unnamed';
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
    }
  }

  if (entry.$frontmatter?.hasOwnProperty(property)) {
    const field = entry.$frontmatter[property];
    return field?.value ? field.value.toString() : 'Unknown';
  }
  return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
}

// Draggable link component
function DraggableLink({ title }) {
  const handleDrag = (e) => e.dataTransfer.setData("text/plain", `[[${title}]]`);
  return <a href={title} draggable onDragStart={handleDrag}>{title}</a>;
}

// Column management and sorting
function ColumnManager({ columns, setColumnsToShow, sortColumn, setSortColumn, sortOrder, setSortOrder }) {
  return (
    <div>
      <label>Columns:</label>
      <dc.Dropdown multiple options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)} selected={columns} onChange={setColumnsToShow} />
      <label>Sort Column:</label>
      <dc.Dropdown options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)} selected={sortColumn} onChange={setSortColumn} />
      <label>Sort Order:</label>
      <dc.Dropdown options={['asc', 'desc']} selected={sortOrder} onChange={setSortOrder} />
    </div>
  );
}

// Generate dynamic columns
const COLUMNS = Object.keys(DYNAMIC_COLUMN_PROPERTIES).map(id => ({
  id,
  value: (entry) => id === "Recipes" ? <DraggableLink title={getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[id])} /> : getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[id])
}));

// Main View
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(COLUMNS.map(c => c.id));
  const [sortColumn, setSortColumn] = dc.useState("Recipes");
  const [sortOrder, setSortOrder] = dc.useState("asc");
  const [isEditingHeaders, setIsEditingHeaders] = dc.useState(false);
  const [editedHeaders, setEditedHeaders] = dc.useState({});

  // Fetch query data from the path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering
  const filteredData = qdata.filter(entry =>
    getProperty(entry, "name.obsidian").toLowerCase().includes(nameFilter.toLowerCase())
  );

  // Sort data
  const sortedData = filteredData.sort((a, b) => {
    const aValue = getProperty(a, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    const bValue = getProperty(b, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  // Group data
  const grouped = dc.useArray(sortedData, array =>
    array.groupBy(x => getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy])).sort(x => x.key)
  );

  // Toggle Header Editing
  const toggleHeaderEdit = () => {
    setIsEditingHeaders(!isEditingHeaders);
  };

  // Handle header change
  const handleHeaderChange = (columnId, newHeader) => {
    setEditedHeaders(prev => ({ ...prev, [columnId]: newHeader }));
  };

  // Apply new header names and regenerate query
  const applyNewHeaders = () => {
    // Apply new header names, then fetch new query data or perform any necessary actions
    toggleHeaderEdit();
    // Re-run or update queries if needed based on changed headers.
  };

  return (
    <dc.Stack>
      <dc.Group>
        <dc.Textbox
          type="search"
          placeholder="Filter recipes..."
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
        />
        <dc.Textbox
          value={queryPath}
          placeholder="Enter path..."
          onChange={e => setQueryPath(e.target.value)}
        />
        <dc.Dropdown
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={groupBy}
          onChange={setGroupBy}
        />
        <button onClick={toggleHeaderEdit}>
          {isEditingHeaders ? 'Stop Editing Headers' : 'Edit Headers'}
        </button>
        {isEditingHeaders && (
          <button onClick={applyNewHeaders}>Apply Changes</button>
        )}
      </dc.Group>

      <dc.VanillaTable
        groupings={{
          render: (label, rows) => <h2>{label || 'Uncategorized'}</h2>
        }}
        columns={COLUMNS.filter(c => columnsToShow.includes(c.id)).map(column => ({
          ...column,
          header: isEditingHeaders ? (
            <input
              type="text"
              value={editedHeaders[column.id] || column.id}
              onChange={e => handleHeaderChange(column.id, e.target.value)}
            />
          ) : (
            editedHeaders[column.id] || column.id
          )
        }))}
        rows={grouped}
        paging={8}
      />
    </dc.Stack>
  );
}

return View;
```


