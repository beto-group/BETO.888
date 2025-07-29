




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
  "Ingredients": "ingredients",       // Maps to frontmatter 'ingredients'
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
 * Dynamically generate columns based on DYNAMIC_COLUMN_PROPERTIES.
 * Adjusts to display data properly, handling any undefined or missing fields.
 */
const generateDynamicColumns = (editedHeaders) => {
  return Object.keys(DYNAMIC_COLUMN_PROPERTIES).map(columnId => {
    const property = DYNAMIC_COLUMN_PROPERTIES[columnId];
    const headerLabel = editedHeaders[columnId] || columnId;  // Use edited header if available
    return {
      id: columnId,
      label: headerLabel,
      value: (entry) => {
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
 * Manages the recipe display, search, and grouping controls.
 */
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(Object.keys(DYNAMIC_COLUMN_PROPERTIES)); // Default columns
  const [isEditingHeaders, setIsEditingHeaders] = dc.useState(false);  // For header editing mode
  const [editedHeaders, setEditedHeaders] = dc.useState({});  // Tracks edited headers

  // Fetch the query data from the given path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering to match the nameFilter with the recipe names
  const filteredData = qdata.filter(entry => {
    const recipeName = getProperty(entry, "name.obsidian").toLowerCase();
    return recipeName.includes(nameFilter.toLowerCase());
  });

  // Log the filtered data after the view has rendered
  dc.useEffect(() => {
    console.log("DEBUG - Filtered data:", filteredData);
  }, [filteredData]);

  // Group the filtered data by the selected groupBy field
  const grouped = dc.useArray(filteredData, array => array
    .groupBy(x => {
      const groupField = getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy]) || "Uncategorized";
      return groupField;
    })
    .sort(x => x.key)
  );

  // Function to toggle header edit mode
  const toggleHeaderEdit = () => {
    setIsEditingHeaders(!isEditingHeaders);
  };

  // Function to handle header update
  const updateHeader = (columnId, newHeader) => {
    setEditedHeaders(prev => ({ ...prev, [columnId]: newHeader }));
  };

  // Updated columns with editable headers
  const COLUMNS = generateDynamicColumns(editedHeaders);

  return (
    <dc.Stack style={styles.stackStyle}>
      <dc.Group justify="space-between" style={styles.controlGroupStyle}>
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
        <dc.Dropdown
          multiple
          options={COLUMNS.map(col => col.id)}
          selected={columnsToShow}
          onChange={setColumnsToShow}
          placeholder="Select columns..."
        />
        <button onClick={toggleHeaderEdit}>
          {isEditingHeaders ? 'Finish Editing' : 'Edit Headers'}
        </button>
      </dc.Group>

      {/* Editable Header Interface */}
      {isEditingHeaders && (
        <dc.Group style={styles.editHeaderGroup}>
          {COLUMNS.map(col => (
            <div key={col.id}>
              <dc.Textbox
                value={editedHeaders[col.id] || col.id}
                placeholder={`Edit ${col.id} header`}
                onChange={e => updateHeader(col.id, e.target.value)}
              />
            </div>
          ))}
        </dc.Group>
      )}

      <div style={styles.tableWrapperStyle}>
        <dc.VanillaTable
          groupings={{ render: createGroupHeader(groupBy) }}
          columns={COLUMNS.filter(col => columnsToShow.includes(col.id))}
          rows={grouped}
          paging={8}
          style={styles.tableStyle}
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
  editHeaderGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: '15px',
    padding: '10px',
  },
  tableWrapperStyle: {
    flexGrow: 1,
    overflowY: 'auto',
    marginTop: '20px',
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
  }
};

return View;
```




CODE


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
  "Ingredients": "ingredients",       // Maps to frontmatter 'ingredients'
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
 * Dynamically generate columns based on DYNAMIC_COLUMN_PROPERTIES.
 * Adjusts to display data properly, handling any undefined or missing fields.
 */
const generateDynamicColumns = (editedHeaders) => {
  return Object.keys(DYNAMIC_COLUMN_PROPERTIES).map(columnId => {
    const property = DYNAMIC_COLUMN_PROPERTIES[columnId];
    const headerLabel = editedHeaders[columnId] || columnId;  // Use edited header if available
    return {
      id: columnId,
      label: headerLabel,
      value: (entry) => {
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
 * Manages the recipe display, search, and grouping controls.
 */
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(Object.keys(DYNAMIC_COLUMN_PROPERTIES)); // Default columns
  const [isEditingHeaders, setIsEditingHeaders] = dc.useState(false);  // For header editing mode
  const [editedHeaders, setEditedHeaders] = dc.useState({});  // Tracks edited headers

  // Fetch the query data from the given path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering to match the nameFilter with the recipe names
  const filteredData = qdata.filter(entry => {
    const recipeName = getProperty(entry, "name.obsidian").toLowerCase();
    return recipeName.includes(nameFilter.toLowerCase());
  });

  // Log the filtered data after the view has rendered
  dc.useEffect(() => {
    console.log("DEBUG - Filtered data:", filteredData);
  }, [filteredData]);

  // Group the filtered data by the selected groupBy field
  const grouped = dc.useArray(filteredData, array => array
    .groupBy(x => {
      const groupField = getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy]) || "Uncategorized";
      return groupField;
    })
    .sort(x => x.key)
  );

  // Function to toggle header edit mode
  const toggleHeaderEdit = () => {
    setIsEditingHeaders(!isEditingHeaders);
  };

  // Function to handle header update
  const updateHeader = (columnId, newHeader) => {
    setEditedHeaders(prev => ({ ...prev, [columnId]: newHeader }));
  };

  // Updated columns with editable headers
  const COLUMNS = generateDynamicColumns(editedHeaders);

  return (
    <dc.Stack style={styles.stackStyle}>
      <dc.Group justify="space-between" style={styles.controlGroupStyle}>
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
        <dc.Dropdown
          multiple
          options={COLUMNS.map(col => col.id)}
          selected={columnsToShow}
          onChange={setColumnsToShow}
          placeholder="Select columns..."
        />
        <button onClick={toggleHeaderEdit}>
          {isEditingHeaders ? 'Finish Editing' : 'Edit Headers'}
        </button>
      </dc.Group>

      {/* Editable Header Interface */}
      {isEditingHeaders && (
        <dc.Group style={styles.editHeaderGroup}>
          {COLUMNS.map(col => (
            <div key={col.id}>
              <dc.Textbox
                value={editedHeaders[col.id] || col.id}
                placeholder={`Edit ${col.id} header`}
                onChange={e => updateHeader(col.id, e.target.value)}
              />
            </div>
          ))}
        </dc.Group>
      )}

      <div style={styles.tableWrapperStyle}>
        <dc.VanillaTable
          groupings={{ render: createGroupHeader(groupBy) }}
          columns={COLUMNS.filter(col => columnsToShow.includes(col.id))}
          rows={grouped}
          paging={8}
          style={styles.tableStyle}
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
  editHeaderGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: '15px',
    padding: '10px',
  },
  tableWrapperStyle: {
    flexGrow: 1,
    overflowY: 'auto',
    marginTop: '20px',
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
  }
};

return View;
```

