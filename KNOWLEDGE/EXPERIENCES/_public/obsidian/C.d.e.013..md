





```datacorejsx
// Initial query to fetch all recipe pages
const initialPath = "COOKBOOK/RECIPES/ALL";

// Dynamic column properties definition (this will allow you to change the columns dynamically)
const DYNAMIC_COLUMN_PROPERTIES = {
  "Recipes": "name.obsidian",         // Maps to Obsidian's name
  "Source": "source",                 // Maps to frontmatter 'source'
  "Genre": "genre",                   // Maps to frontmatter 'genre'
  "Tags": "tags",                     // Maps to frontmatter 'tags'
  "Rating": "rating",                 // Maps to frontmatter 'rating'
  "Creation Date": "ctime.obsidian"   // Maps to Obsidian's ctime
};

/**
 * Universal method to handle built-in and frontmatter data.
 * This method ensures that missing or undefined fields are handled properly.
 * @param {*} entry - A single entry (recipe).
 * @param {*} property - The property name to query, either built-in or from frontmatter.
 * @returns {string} - Value of the requested property, or a default value if unavailable.
 */
function getProperty(entry, property) {
  // console.log(`[DEBUG] Fetching property "${property}" for entry:`, entry);

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
        return 'Unknown';
    }
  }

  // Handle frontmatter fields, with fallback for missing fields
  if (entry.$frontmatter && entry.$frontmatter[property]) {
    const frontmatterField = entry.$frontmatter[property];

    // Check if the frontmatter field has a value property
    if (frontmatterField && frontmatterField.value !== undefined && frontmatterField.value !== null) {
      // If it's an array, join it into a string
      if (Array.isArray(frontmatterField.value)) {
        return frontmatterField.value.join(', ');
      }
      // Return string or number as is
      return frontmatterField.value.toString();
    }
  }

  // Default fallback for fields that are undefined
  return property === 'rating' ? 'Not Rated' : 'Unknown';
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
const generateDynamicColumns = () => {
  return Object.keys(DYNAMIC_COLUMN_PROPERTIES).map(columnId => {
    const property = DYNAMIC_COLUMN_PROPERTIES[columnId];
    return {
      id: columnId,
      value: (entry) => {
        // Special handling for Recipes column with a draggable link
        if (columnId === "Recipes") {
          return <DraggableLink title={getProperty(entry, property)} />;
        }
        // Return property value or a fallback
        return getProperty(entry, property) || 'Unknown';
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
 * Manages the recipe display, search, and grouping controls.
 */
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(COLUMNS.map(col => col.id)); // Default columns

  // Fetch the query data from the given path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);
  // console.log("[DEBUG] Fetched data:", qdata);

  // Apply filtering to match the nameFilter with the recipe names
  const filteredData = qdata.filter(entry => {
    const recipeName = getProperty(entry, "name.obsidian").toLowerCase();
    return recipeName.includes(nameFilter.toLowerCase());
  });

  // console.log("[DEBUG] Filtered data:", filteredData);

  // Group the filtered data by the selected groupBy field
  const grouped = dc.useArray(filteredData, array => array
    .groupBy(x => {
      const groupField = getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy]) || "Uncategorized";
      return groupField;
    })
    .sort(x => x.key)
  );

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
      </dc.Group>
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
  }
};

return View;
```







CODE

```jsx
// Initial query to fetch all recipe pages
const initialPath = "COOKBOOK/RECIPES/ALL";

// Dynamic column properties definition (this will allow you to change the columns dynamically)
const DYNAMIC_COLUMN_PROPERTIES = {
  "Recipes": "name.obsidian",         // Maps to Obsidian's name
  "Source": "source",                 // Maps to frontmatter 'source'
  "Genre": "genre",                   // Maps to frontmatter 'genre'
  "Tags": "tags",                     // Maps to frontmatter 'tags'
  "Rating": "rating",                 // Maps to frontmatter 'rating'
  "Creation Date": "ctime.obsidian"   // Maps to Obsidian's ctime
};

/**
 * Universal method to handle built-in and frontmatter data.
 * This method ensures that missing or undefined fields are handled properly.
 * @param {*} entry - A single entry (recipe).
 * @param {*} property - The property name to query, either built-in or from frontmatter.
 * @returns {string} - Value of the requested property, or a default value if unavailable.
 */
function getProperty(entry, property) {
  // console.log(`[DEBUG] Fetching property "${property}" for entry:`, entry);

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
        return 'Unknown';
    }
  }

  // Handle frontmatter fields, with fallback for missing fields
  if (entry.$frontmatter && entry.$frontmatter[property]) {
    const frontmatterField = entry.$frontmatter[property];

    // Check if the frontmatter field has a value property
    if (frontmatterField && frontmatterField.value !== undefined && frontmatterField.value !== null) {
      // If it's an array, join it into a string
      if (Array.isArray(frontmatterField.value)) {
        return frontmatterField.value.join(', ');
      }
      // Return string or number as is
      return frontmatterField.value.toString();
    }
  }

  // Default fallback for fields that are undefined
  return property === 'rating' ? 'Not Rated' : 'Unknown';
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
const generateDynamicColumns = () => {
  return Object.keys(DYNAMIC_COLUMN_PROPERTIES).map(columnId => {
    const property = DYNAMIC_COLUMN_PROPERTIES[columnId];
    return {
      id: columnId,
      value: (entry) => {
        // Special handling for Recipes column with a draggable link
        if (columnId === "Recipes") {
          return <DraggableLink title={getProperty(entry, property)} />;
        }
        // Return property value or a fallback
        return getProperty(entry, property) || 'Unknown';
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
 * Manages the recipe display, search, and grouping controls.
 */
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(COLUMNS.map(col => col.id)); // Default columns

  // Fetch the query data from the given path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);
  // console.log("[DEBUG] Fetched data:", qdata);

  // Apply filtering to match the nameFilter with the recipe names
  const filteredData = qdata.filter(entry => {
    const recipeName = getProperty(entry, "name.obsidian").toLowerCase();
    return recipeName.includes(nameFilter.toLowerCase());
  });

  // console.log("[DEBUG] Filtered data:", filteredData);

  // Group the filtered data by the selected groupBy field
  const grouped = dc.useArray(filteredData, array => array
    .groupBy(x => {
      const groupField = getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy]) || "Uncategorized";
      return groupField;
    })
    .sort(x => x.key)
  );

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
      </dc.Group>
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
  }
};

return View;
```