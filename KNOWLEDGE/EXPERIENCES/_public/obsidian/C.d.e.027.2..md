













```datacorejsx
// Initial query to fetch all recipe pages
const initialPath = "COOKBOOK/RECIPES/ALL";

// Master Controller to define and manage dynamic column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns(properties) {
    // Return properties for columns dynamically
    return properties;
  },
  // Fallback value for undefined or missing fields
  getFallbackValue(property) {
    return 'Unknown'; // Default value if the property exists but has no usable value
  },
  getNoDataFallback(property) {
    return 'No Data'; // Default value if the property doesn't exist at all
  }
};

// Dynamic column properties definition (this can be changed easily)
const DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns({
  "Recipes": "name.obsidian",         // Maps to Obsidian's name
  "Source": "source",                 // Maps to frontmatter 'source'
  "Genre": "genre",                   // Maps to frontmatter 'genre'
  "Tags": "tags",                     // Maps to frontmatter 'tags'
  "Diet": "diet",                     // Maps to frontmatter 'diet'
  "Creation Date": "ctime.obsidian"   // Maps to Obsidian's ctime
});

/**
 * Universal method to handle built-in and frontmatter data.
 * This method ensures that missing or undefined fields are handled properly.
 * @param {*} entry - A single entry (recipe).
 * @param {*} property - The property name to query, either built-in or from frontmatter.
 * @returns {string} - Value of the requested property, or a default value if unavailable.
 */
function getProperty(entry, property) {
  // Handle Obsidian's built-in metadata
  if (property.endsWith('.obsidian')) {
    const cleanProperty = property.replace('.obsidian', '');
    switch (cleanProperty) {
      case 'ctime':
        return entry.$ctime ? entry.$ctime.toISODate() : 'Unknown Date';
      case 'mtime':
        return entry.$mtime ? entry.$mtime.toISODate() : 'Unknown Last Modified Date';
      case 'name':
        return entry.$name || 'Unnamed';
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);  // Built-in field exists but no data provided
    }
  }

  // Check if the frontmatter contains the property
  if (entry.$frontmatter && entry.$frontmatter.hasOwnProperty(property)) {
    const frontmatterField = entry.$frontmatter[property];

    // Debugging the value of the property
    console.log(`DEBUG - Property: ${property}, Value:`, frontmatterField);

    // If it's an object with a `value` field
    if (frontmatterField && typeof frontmatterField === 'object' && frontmatterField.hasOwnProperty('value')) {
      if (Array.isArray(frontmatterField.value)) {
        return frontmatterField.value.length > 0 ? frontmatterField.value.join(', ') : 'Unknown'; // Array exists but is empty
      }
      if (frontmatterField.value !== null && frontmatterField.value !== undefined) {
        return frontmatterField.value.toString();
      }
      return 'Unknown';  // Field exists but has no usable value
    }

    // If it's a simple string or number
    if (typeof frontmatterField === 'string' || typeof frontmatterField === 'number') {
      return frontmatterField.toString();
    }

    // If value is undefined or empty
    return 'Unknown';  // Field exists but has no usable value
  }

  // If the property doesn't exist at all
  return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);  // No such property
}

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
    <a
      href={title}
      className="internal-link"
      draggable
      onDragStart={handleDragStart}
      title={`Drag to copy [[${title}]]`}
      style={styles.linkStyles}
    >
      {title}
    </a>
  );
}

/**
 * ColumnManager Component
 * Allows the user to dynamically add, remove columns and set sorting order.
 */
function ColumnManager({ columns, setColumnsToShow, sortColumn, setSortColumn, sortOrder, setSortOrder }) {
  return (
    <div style={styles.columnManager}>
      <h4>Manage Columns</h4>
      <div>
        <label>Select Columns:</label>
        <dc.Dropdown
          multiple
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={columns}
          onChange={setColumnsToShow}
        />
      </div>
      <div>
        <label>Sort Column:</label>
        <dc.Dropdown
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={sortColumn}
          onChange={setSortColumn}
        />
      </div>
      <div>
        <label>Sort Order:</label>
        <dc.Dropdown
          options={['asc', 'desc']}
          selected={sortOrder}
          onChange={setSortOrder}
        />
      </div>
    </div>
  );
}

/**
 * Dynamically generate columns based on DYNAMIC_COLUMN_PROPERTIES.
 * Adjusts to display data properly, handling any undefined or missing fields.
 */
const generateDynamicColumns = () => {
  return Object.keys(DYNAMIC_COLUMN_PROPERTIES).map(columnId => {
    const property = DYNAMIC_COLUMN_PROPERTIES[columnId];
    return {
      id: columnId,
      value: (entry) => {
        // Log each column's value for the entry
        console.log(`DEBUG - Column Value for ${columnId}:`, getProperty(entry, property));

        // Special handling for Recipes column with a draggable link
        if (columnId === "Recipes") {
          return <DraggableLink title={getProperty(entry, property)} />;
        }
        // Return property value or a fallback
        return getProperty(entry, property);
      }
    };
  });
};

const COLUMNS = generateDynamicColumns();

/**
 * Dynamically create group headers based on any property.
 * @param {string} groupBy - The property to group by.
 * @returns Function that renders the group header for that property.
 */
const createGroupHeader = (groupBy) => {
  return (label, rows) => (
    <dc.Group justify="space-between" align="center">
      <h2>{label || "Uncategorized"}</h2>
      <span>{rows.length} recipes</span>
    </dc.Group>
  );
};

/**
 * Main View Component
 * Manages the recipe display, search, sorting, and grouping controls.
 */
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(COLUMNS.map(col => col.id)); // Default columns
  const [sortColumn, setSortColumn] = dc.useState("Recipes"); // Default sort column
  const [sortOrder, setSortOrder] = dc.useState("asc"); // Default sort order (asc/desc)
  const [currentPage, setCurrentPage] = dc.useState(1);
  const itemsPerPage = 10;

  // Fetch the query data from the given path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Log the raw query data
  console.log("DEBUG - Raw Query Data:", qdata);

  // Apply filtering to match the nameFilter with the recipe names
  const filteredData = qdata.filter(entry => {
    const recipeName = getProperty(entry, "name.obsidian").toLowerCase();
    
    // Log each entry's name for filtering
    console.log("DEBUG - Recipe Name:", recipeName);
    
    return recipeName.includes(nameFilter.toLowerCase());
  });

  // Log the filtered data
  console.log("DEBUG - Filtered Data:", filteredData);

  // Sorting logic based on selected column and order
  const sortedData = filteredData.sort((a, b) => {
    const aValue = getProperty(a, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    const bValue = getProperty(b, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);

    // Log values for sorting
    console.log("DEBUG - Sorting Values:", { aValue, bValue });

    // For ascending or descending sort order
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    } else {
      return bValue.localeCompare(aValue, undefined, { numeric: true });
    }
  });

  // Log the sorted data
  console.log("DEBUG - Sorted Data:", sortedData);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  // Log pagination details
  console.log("DEBUG - Pagination:", { currentPage, itemsPerPage, currentItems });

  // Group the sorted data by the selected groupBy field
  const grouped = dc.useArray(sortedData, array => array
    .groupBy(x => {
      const groupField = getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy]) || "Uncategorized";
      
      // Log group field values
      console.log("DEBUG - Grouping Field:", groupField);
      
      return groupField;
    })
    .sort(x => x.key)
  );

  // Log the grouped data
  console.log("DEBUG - Grouped Data:", grouped);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <dc.Stack style={styles.stackStyle}>
      {/* Column Manager Block for setting column visibility, sorting, etc. */}
      <ColumnManager
        columns={columnsToShow}
        setColumnsToShow={setColumnsToShow}
        sortColumn={sortColumn}
        setSortColumn={setSortColumn}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      <dc.Group justify="space-between" style={styles.controlGroupStyle}>
        {/* Filter by name input */}
        <dc.Textbox
          type="search"
          placeholder="Filter recipes..."
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
        />
        {/* Path input for querying specific paths */}
        <dc.Textbox
          value={queryPath}
          placeholder="Enter path..."
          onChange={e => setQueryPath(e.target.value)}
        />
        {/* Dropdown for grouping by selected field */}
        <dc.Dropdown
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={groupBy}
          onChange={setGroupBy}
        />
        {/* Dropdown for selecting columns to show */}
        <dc.Dropdown
          multiple
          options={COLUMNS.map(col => col.id)}
          selected={columnsToShow}
          onChange={setColumnsToShow}
          placeholder="Select columns..."
        />
      </dc.Group>
      
      {/* Table section to display filtered, sorted, grouped data */}
      <div style={styles.tableWrapperStyle}>
        <dc.VanillaTable
          groupings={{ render: createGroupHeader(groupBy) }}
          columns={COLUMNS.filter(col => columnsToShow.includes(col.id))}
          rows={grouped}
          paging={itemsPerPage}
          style={styles.tableStyle}
        />
      </div>

      {/* Pagination component */}
      <div style={styles.paginationBlock}>
        <dc.Pagination
          total={filteredData.length}
          perPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </dc.Stack>
  );
}

// Master style block
const styles = {
  stackStyle: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  controlGroupStyle: {
    padding: '10px',
    gap: '20px',
  },
  tableWrapperStyle: {
    flexGrow: 1,
    overflowY: 'auto',
  },
  tableStyle: {
    tableLayout: 'fixed',
    width: '100%',
    borderCollapse: 'collapse',
  },
  linkStyles: {
    display: 'block',
    maxWidth: '100%',
    wordWrap: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineClamp: 3,
    WebkitLineClamp: 3,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    height: '4.5em',
    lineHeight: '1.5em',
    whiteSpace: 'normal',
  },
  columnManager: {
    padding: '10px',
    border: '1px solid #ccc',
    marginBottom: '20px',
  },
  paginationBlock: {
    padding: '10px',
    background: '#fff',
    position: 'sticky',
    bottom: 0,
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
  }
};

return View;
```






```jsx
// Initial query to fetch all recipe pages
const initialPath = "COOKBOOK/RECIPES/ALL";

// Master Controller to define and manage dynamic column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns(properties) {
    // Return properties for columns dynamically
    return properties;
  },
  // Fallback value for undefined or missing fields
  getFallbackValue(property) {
    return 'Unknown'; // Default value if the property exists but has no usable value
  },
  getNoDataFallback(property) {
    return 'No Data'; // Default value if the property doesn't exist at all
  }
};

// Dynamic column properties definition (this can be changed easily)
const DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns({
  "Recipes": "name.obsidian",         // Maps to Obsidian's name
  "Source": "source",                 // Maps to frontmatter 'source'
  "Genre": "genre",                   // Maps to frontmatter 'genre'
  "Tags": "tags",                     // Maps to frontmatter 'tags'
  "Diet": "diet",                     // Maps to frontmatter 'diet'
  "Creation Date": "ctime.obsidian"   // Maps to Obsidian's ctime
});

/**
 * Universal method to handle built-in and frontmatter data.
 * This method ensures that missing or undefined fields are handled properly.
 * @param {*} entry - A single entry (recipe).
 * @param {*} property - The property name to query, either built-in or from frontmatter.
 * @returns {string} - Value of the requested property, or a default value if unavailable.
 */
function getProperty(entry, property) {
  // Handle Obsidian's built-in metadata
  if (property.endsWith('.obsidian')) {
    const cleanProperty = property.replace('.obsidian', '');
    switch (cleanProperty) {
      case 'ctime':
        return entry.$ctime ? entry.$ctime.toISODate() : 'Unknown Date';
      case 'mtime':
        return entry.$mtime ? entry.$mtime.toISODate() : 'Unknown Last Modified Date';
      case 'name':
        return entry.$name || 'Unnamed';
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);  // Built-in field exists but no data provided
    }
  }

  // Check if the frontmatter contains the property
  if (entry.$frontmatter && entry.$frontmatter.hasOwnProperty(property)) {
    const frontmatterField = entry.$frontmatter[property];

    // Debugging the value of the property
    console.log(`DEBUG - Property: ${property}, Value:`, frontmatterField);

    // If it's an object with a `value` field
    if (frontmatterField && typeof frontmatterField === 'object' && frontmatterField.hasOwnProperty('value')) {
      if (Array.isArray(frontmatterField.value)) {
        return frontmatterField.value.length > 0 ? frontmatterField.value.join(', ') : 'Unknown'; // Array exists but is empty
      }
      if (frontmatterField.value !== null && frontmatterField.value !== undefined) {
        return frontmatterField.value.toString();
      }
      return 'Unknown';  // Field exists but has no usable value
    }

    // If it's a simple string or number
    if (typeof frontmatterField === 'string' || typeof frontmatterField === 'number') {
      return frontmatterField.toString();
    }

    // If value is undefined or empty
    return 'Unknown';  // Field exists but has no usable value
  }

  // If the property doesn't exist at all
  return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);  // No such property
}

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
    <a
      href={title}
      className="internal-link"
      draggable
      onDragStart={handleDragStart}
      title={`Drag to copy [[${title}]]`}
      style={styles.linkStyles}
    >
      {title}
    </a>
  );
}

/**
 * ColumnManager Component
 * Allows the user to dynamically add, remove columns and set sorting order.
 */
function ColumnManager({ columns, setColumnsToShow, sortColumn, setSortColumn, sortOrder, setSortOrder }) {
  return (
    <div style={styles.columnManager}>
      <h4>Manage Columns</h4>
      <div>
        <label>Select Columns:</label>
        <dc.Dropdown
          multiple
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={columns}
          onChange={setColumnsToShow}
        />
      </div>
      <div>
        <label>Sort Column:</label>
        <dc.Dropdown
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={sortColumn}
          onChange={setSortColumn}
        />
      </div>
      <div>
        <label>Sort Order:</label>
        <dc.Dropdown
          options={['asc', 'desc']}
          selected={sortOrder}
          onChange={setSortOrder}
        />
      </div>
    </div>
  );
}

/**
 * Dynamically generate columns based on DYNAMIC_COLUMN_PROPERTIES.
 * Adjusts to display data properly, handling any undefined or missing fields.
 */
const generateDynamicColumns = () => {
  return Object.keys(DYNAMIC_COLUMN_PROPERTIES).map(columnId => {
    const property = DYNAMIC_COLUMN_PROPERTIES[columnId];
    return {
      id: columnId,
      value: (entry) => {
        // Log each column's value for the entry
        console.log(`DEBUG - Column Value for ${columnId}:`, getProperty(entry, property));

        // Special handling for Recipes column with a draggable link
        if (columnId === "Recipes") {
          return <DraggableLink title={getProperty(entry, property)} />;
        }
        // Return property value or a fallback
        return getProperty(entry, property);
      }
    };
  });
};

const COLUMNS = generateDynamicColumns();

/**
 * Dynamically create group headers based on any property.
 * @param {string} groupBy - The property to group by.
 * @returns Function that renders the group header for that property.
 */
const createGroupHeader = (groupBy) => {
  return (label, rows) => (
    <dc.Group justify="space-between" align="center">
      <h2>{label || "Uncategorized"}</h2>
      <span>{rows.length} recipes</span>
    </dc.Group>
  );
};

/**
 * Main View Component
 * Manages the recipe display, search, sorting, and grouping controls.
 */
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(COLUMNS.map(col => col.id)); // Default columns
  const [sortColumn, setSortColumn] = dc.useState("Recipes"); // Default sort column
  const [sortOrder, setSortOrder] = dc.useState("asc"); // Default sort order (asc/desc)
  const [currentPage, setCurrentPage] = dc.useState(1);
  const itemsPerPage = 10;

  // Fetch the query data from the given path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Log the raw query data
  console.log("DEBUG - Raw Query Data:", qdata);

  // Apply filtering to match the nameFilter with the recipe names
  const filteredData = qdata.filter(entry => {
    const recipeName = getProperty(entry, "name.obsidian").toLowerCase();
    
    // Log each entry's name for filtering
    console.log("DEBUG - Recipe Name:", recipeName);
    
    return recipeName.includes(nameFilter.toLowerCase());
  });

  // Log the filtered data
  console.log("DEBUG - Filtered Data:", filteredData);

  // Sorting logic based on selected column and order
  const sortedData = filteredData.sort((a, b) => {
    const aValue = getProperty(a, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    const bValue = getProperty(b, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);

    // Log values for sorting
    console.log("DEBUG - Sorting Values:", { aValue, bValue });

    // For ascending or descending sort order
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    } else {
      return bValue.localeCompare(aValue, undefined, { numeric: true });
    }
  });

  // Log the sorted data
  console.log("DEBUG - Sorted Data:", sortedData);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  // Log pagination details
  console.log("DEBUG - Pagination:", { currentPage, itemsPerPage, currentItems });

  // Group the sorted data by the selected groupBy field
  const grouped = dc.useArray(sortedData, array => array
    .groupBy(x => {
      const groupField = getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy]) || "Uncategorized";
      
      // Log group field values
      console.log("DEBUG - Grouping Field:", groupField);
      
      return groupField;
    })
    .sort(x => x.key)
  );

  // Log the grouped data
  console.log("DEBUG - Grouped Data:", grouped);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <dc.Stack style={styles.stackStyle}>
      {/* Column Manager Block for setting column visibility, sorting, etc. */}
      <ColumnManager
        columns={columnsToShow}
        setColumnsToShow={setColumnsToShow}
        sortColumn={sortColumn}
        setSortColumn={setSortColumn}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      <dc.Group justify="space-between" style={styles.controlGroupStyle}>
        {/* Filter by name input */}
        <dc.Textbox
          type="search"
          placeholder="Filter recipes..."
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
        />
        {/* Path input for querying specific paths */}
        <dc.Textbox
          value={queryPath}
          placeholder="Enter path..."
          onChange={e => setQueryPath(e.target.value)}
        />
        {/* Dropdown for grouping by selected field */}
        <dc.Dropdown
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={groupBy}
          onChange={setGroupBy}
        />
        {/* Dropdown for selecting columns to show */}
        <dc.Dropdown
          multiple
          options={COLUMNS.map(col => col.id)}
          selected={columnsToShow}
          onChange={setColumnsToShow}
          placeholder="Select columns..."
        />
      </dc.Group>
      
      {/* Table section to display filtered, sorted, grouped data */}
      <div style={styles.tableWrapperStyle}>
        <dc.VanillaTable
          groupings={{ render: createGroupHeader(groupBy) }}
          columns={COLUMNS.filter(col => columnsToShow.includes(col.id))}
          rows={grouped}
          paging={itemsPerPage}
          style={styles.tableStyle}
        />
      </div>

      {/* Pagination component */}
      <div style={styles.paginationBlock}>
        <dc.Pagination
          total={filteredData.length}
          perPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </dc.Stack>
  );
}

// Master style block
const styles = {
  stackStyle: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  controlGroupStyle: {
    padding: '10px',
    gap: '20px',
  },
  tableWrapperStyle: {
    flexGrow: 1,
    overflowY: 'auto',
  },
  tableStyle: {
    tableLayout: 'fixed',
    width: '100%',
    borderCollapse: 'collapse',
  },
  linkStyles: {
    display: 'block',
    maxWidth: '100%',
    wordWrap: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineClamp: 3,
    WebkitLineClamp: 3,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    height: '4.5em',
    lineHeight: '1.5em',
    whiteSpace: 'normal',
  },
  columnManager: {
    padding: '10px',
    border: '1px solid #ccc',
    marginBottom: '20px',
  },
  paginationBlock: {
    padding: '10px',
    background: '#fff',
    position: 'sticky',
    bottom: 0,
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
  }
};

return View;
```


