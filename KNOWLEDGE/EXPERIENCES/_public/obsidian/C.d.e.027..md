







```datacorejsx
// Master Controller to define and manage dynamic column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props) => props,
  getFallbackValue: () => "Unknown",
  getNoDataFallback: () => "No Data",
};

// Universal method to handle built-in and frontmatter data.
function getProperty(entry, property) {
  // Handle Obsidian's built-in metadata
  if (property.endsWith(".obsidian")) {
    const cleanProperty = property.replace(".obsidian", "");
    switch (cleanProperty) {
      case "ctime":
        return entry.$ctime ? entry.$ctime.toISODate() : "Unknown Date";
      case "mtime":
        return entry.$mtime ? entry.$mtime.toISODate() : "Unknown Last Modified Date";
      case "name":
        return entry.$name || "Unnamed";
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
    }
  }

  // Handle frontmatter fields
  if (entry.$frontmatter && entry.$frontmatter.hasOwnProperty(property)) {
    const frontmatterField = entry.$frontmatter[property];

    if (frontmatterField !== null && frontmatterField !== undefined) {
      if (Array.isArray(frontmatterField)) {
        return frontmatterField.join(", ");
      }
      return frontmatterField.toString();
    }
  }

  return property === "rating" ? "Not Rated" : "Unknown";
}

// Draggable link component with Obsidian-like behavior
function DraggableLink({ entry, title }) {
  const handleDragStart = (event) => {
    event.dataTransfer.setData("text/plain", `[[${title}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a
      href={entry.$filePath ? `obsidian://open?path=${encodeURIComponent(entry.$filePath)}` : '#'}
      className="internal-link"
      draggable
      onDragStart={handleDragStart}
      title={`Drag to copy [[${title}]]`}
      style={styles.draggableLink}
    >
      {title}
    </a>
  );
}

// DraggableEditBlock component
function DraggableEditBlock(props) {
  const {
    columnId,
    index,
    columnsToShow,
    setColumnsToShow,
    editedHeaders,
    setEditedHeaders,
    editedFields,
    setEditedFields,
    updateColumn,
    removeColumn,
    dynamicColumnProperties,
  } = props;

  const handleDragStart = (e) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDrop = (e) => {
    const dragIndex = e.dataTransfer.getData("dragIndex");
    const newColumns = [...columnsToShow];
    const draggedColumn = newColumns[dragIndex];
    newColumns.splice(dragIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    setColumnsToShow(newColumns);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={styles.draggableEditBlock}
    >
      <label style={styles.editBlockHeader}>
        {editedHeaders[columnId] || columnId}
      </label>
      <label style={styles.editBlockSubheader}>Header Label:</label>
      <dc.Textbox
        value={editedHeaders[columnId] || columnId}
        onChange={(e) =>
          setEditedHeaders((prev) => ({ ...prev, [columnId]: e.target.value }))
        }
        style={styles.textbox}
      />
      <label style={styles.editBlockSubheader}>Data Field:</label>
      <dc.Textbox
        value={editedFields[columnId] || dynamicColumnProperties[columnId]}
        onChange={(e) =>
          setEditedFields((prev) => ({ ...prev, [columnId]: e.target.value }))
        }
        style={styles.textbox}
      />
      <div style={styles.editBlockButtonGroup}>
        <dc.Button onClick={() => updateColumn(columnId)} style={styles.button}>
          Update
        </dc.Button>
        <dc.Button onClick={() => removeColumn(columnId)} style={styles.button}>
          Remove
        </dc.Button>
      </div>
    </div>
  );
}

// AddNewColumn component
function AddNewColumn({
  newHeaderLabel,
  setNewHeaderLabel,
  newFieldLabel,
  setNewFieldLabel,
  addNewColumn,
}) {
  return (
    <div style={styles.addNewColumnBlock}>
      <label style={styles.addNewColumnHeader}>Add New Column</label>
      <label style={styles.addNewColumnSubheader}>New Header Label:</label>
      <dc.Textbox
        value={newHeaderLabel}
        onChange={(e) => setNewHeaderLabel(e.target.value)}
        style={styles.textbox}
      />
      <label style={styles.addNewColumnSubheader}>New Data Field:</label>
      <dc.Textbox
        value={newFieldLabel}
        onChange={(e) => setNewFieldLabel(e.target.value)}
        style={styles.textbox}
      />
      <dc.Button onClick={addNewColumn} style={styles.button}>
        Add Column
      </dc.Button>
    </div>
  );
}

// Main View Component with Edit Headers functionality
function View() {
  const initialPath = "COOKBOOK/RECIPES/ALL";
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [isEditingHeaders, setIsEditingHeaders] = dc.useState(false);
  const [editedHeaders, setEditedHeaders] = dc.useState({});
  const [editedFields, setEditedFields] = dc.useState({});
  const [newHeaderLabel, setNewHeaderLabel] = dc.useState("");
  const [newFieldLabel, setNewFieldLabel] = dc.useState("");
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = dc.useState(1);

  // Initialize dynamic column properties in state
  const [dynamicColumnProperties, setDynamicColumnProperties] = dc.useState(
    MASTER_COLUMN_CONTROLLER.defineColumns({
      Recipes: "name.obsidian",
      Source: "source",
      Genre: "genre",
      Tags: "tags",
      Ingredients: "ingredients",
      "Creation Date": "ctime.obsidian",
    })
  );

  const [columnsToShow, setColumnsToShow] = dc.useState(
    Object.keys(dynamicColumnProperties)
  );

  // Fetch query data from the path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering
  const filteredData = qdata.filter((entry) => {
    const entryName = getProperty(entry, "name.obsidian").toLowerCase();
    return entryName.includes(nameFilter.toLowerCase());
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle adding a new column
  const addNewColumn = () => {
    if (!newHeaderLabel || !newFieldLabel) {
      alert("Please provide both a new header label and a data field.");
      return;
    }

    // Add the new column to dynamicColumnProperties
    const updatedColumns = {
      ...dynamicColumnProperties,
      [newHeaderLabel]: newFieldLabel,
    };

    setDynamicColumnProperties(
      MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns)
    );

    // Update the columns to show
    setColumnsToShow((prev) => [...prev, newHeaderLabel]);

    // Clear input fields after adding
    setNewHeaderLabel("");
    setNewFieldLabel("");
  };

  // Handle header editing
  const toggleHeaderEdit = () => {
    setIsEditingHeaders(!isEditingHeaders);
  };

  const updateColumn = (columnId) => {
    const newHeader = editedHeaders[columnId] || columnId;
    const newField = editedFields[columnId] || dynamicColumnProperties[columnId];

    const updatedColumns = { ...dynamicColumnProperties };

    const updatedColumnsToShow = columnsToShow.map((col) =>
      col === columnId ? newHeader : col
    );

    delete updatedColumns[columnId];
    updatedColumns[newHeader] = newField;

    setDynamicColumnProperties(
      MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns)
    );

    setColumnsToShow(updatedColumnsToShow);

    // Reset edited headers and fields
    setEditedHeaders((prev) => {
      const newHeaders = { ...prev };
      delete newHeaders[columnId];
      return newHeaders;
    });

    setEditedFields((prev) => {
      const newFields = { ...prev };
      delete newFields[columnId];
      return newFields;
    });
  };

  const removeColumn = (columnId) => {
    const updatedColumns = { ...dynamicColumnProperties };
    delete updatedColumns[columnId];

    setDynamicColumnProperties(
      MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns)
    );

    setColumnsToShow((prev) => prev.filter((id) => id !== columnId));
  };

  return (
    <dc.Stack style={styles.mainContainer}>
      {/* Header */}
      <div style={styles.headerBlock}>
        <h1 style={styles.headerTitle}>Recipe Viewer</h1>
        <dc.Group style={styles.controlGroup}>
          <dc.Textbox
            type="search"
            placeholder="Filter recipes..."
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            style={styles.textbox}
          />
          <dc.Textbox
            value={queryPath}
            placeholder="Enter path..."
            onChange={(e) => {
              setQueryPath(e.target.value);
              setCurrentPage(1); // Reset to first page on path change
            }}
            style={styles.textbox}
          />
          <dc.Button onClick={toggleHeaderEdit} style={styles.button}>
            {isEditingHeaders ? "Finish Editing" : "Edit Headers"}
          </dc.Button>
        </dc.Group>
      </div>

      {/* Editing Headers */}
      {isEditingHeaders && (
        <div style={styles.editingBlock}>
          <dc.Group style={styles.columnBlock}>
            {columnsToShow.map((columnId, index) => (
              <DraggableEditBlock
                key={columnId}
                columnId={columnId}
                index={index}
                columnsToShow={columnsToShow}
                setColumnsToShow={setColumnsToShow}
                editedHeaders={editedHeaders}
                setEditedHeaders={setEditedHeaders}
                editedFields={editedFields}
                setEditedFields={setEditedFields}
                updateColumn={updateColumn}
                removeColumn={removeColumn}
                dynamicColumnProperties={dynamicColumnProperties}
              />
            ))}
            <AddNewColumn
              newHeaderLabel={newHeaderLabel}
              setNewHeaderLabel={setNewHeaderLabel}
              newFieldLabel={newFieldLabel}
              setNewFieldLabel={setNewFieldLabel}
              addNewColumn={addNewColumn}
            />
          </dc.Group>
        </div>
      )}

      {/* Table with fixed headers and pagination */}
      <div style={styles.contentContainer}>
        {/* Table Headers */}
        <div style={styles.tableHeader}>
          {columnsToShow.map((col) => (
            <div key={col} style={styles.tableHeaderCell}>
              {editedHeaders[col] || col}
            </div>
          ))}
        </div>

        {/* Scrollable Table Content */}
        <div style={styles.tableContent}>
          {paginatedData.length > 0 ? (
            <div style={styles.tableRows}>
              {paginatedData.map((entry, idx) => (
                <div key={idx} style={styles.tableRow}>
                  {columnsToShow.map((columnId) => {
                    const property = dynamicColumnProperties[columnId];
                    const content = getProperty(entry, property);
                    return (
                      <div key={columnId} style={styles.tableCell}>
                        {columnId === "Recipes" ? (
                          <DraggableLink entry={entry} title={content} />
                        ) : (
                          content
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noData}>No data to display.</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.paginationBlock}>
          <dc.Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={styles.button}
          >
            Previous
          </dc.Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <dc.Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={styles.button}
          >
            Next
          </dc.Button>
        </div>
      )}
    </dc.Stack>
  );
}

// Styles Block
const styles = {
  mainContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
  },
  headerBlock: {
    padding: "10px",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "var(--background-primary)",
  },
  headerTitle: {
    margin: 0,
    paddingBottom: "10px",
  },
  controlGroup: {
    gap: "10px",
    flexWrap: "wrap",
  },
  editingBlock: {
    maxHeight: "300px",
    overflowY: "auto",
    padding: "10px",
    border: "1px solid var(--background-modifier-border)",
    marginTop: "10px",
    backgroundColor: "var(--background-primary)",
  },
  columnBlock: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    flexWrap: "wrap",
  },
  contentContainer: {
    flexGrow: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    display: "flex",
    position: "sticky",
    top: "0",
    backgroundColor: "var(--background-primary)",
    zIndex: 50,
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  tableHeaderCell: {
    flex: "1 0 150px",
    padding: "10px",
    fontWeight: "bold",
    textAlign: "left",
  },
  tableContent: {
    flexGrow: 1,
    overflowY: "auto",
    overflowX: "auto",
  },
  tableRows: {
    display: "flex",
    flexDirection: "column",
  },
  tableRow: {
    display: "flex",
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  tableCell: {
    flex: "1 0 150px",
    padding: "10px",
  },
  noData: {
    padding: "20px",
    textAlign: "center",
  },
  paginationBlock: {
    padding: "10px",
    position: "sticky",
    bottom: 0,
    backgroundColor: "var(--background-primary)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  draggableLink: {
    cursor: "pointer",
    textDecoration: "underline",
    color: "var(--text-accent)",
  },
  button: {
    padding: "8px 12px",
    backgroundColor: "var(--interactive-accent)",
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  draggableEditBlock: {
    padding: "20px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "15px",
    width: "300px",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    borderRadius: "8px",
    cursor: "grab",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  editBlockHeader: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  editBlockSubheader: {
    color: "var(--text-faint)",
    fontSize: "12px",
    marginBottom: "5px",
  },
  textbox: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "100%",
    boxSizing: "border-box",
  },
  editBlockButtonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  addNewColumnBlock: {
    padding: "20px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "15px",
    width: "300px",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  addNewColumnHeader: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  addNewColumnSubheader: {
    color: "var(--text-faint)",
    fontSize: "12px",
  },
};

return View;
```


```jsx
// Master Controller to define and manage dynamic column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props) => props,
  getFallbackValue: () => "Unknown",
  getNoDataFallback: () => "No Data",
};

// Universal method to handle built-in and frontmatter data.
function getProperty(entry, property) {
  // Handle Obsidian's built-in metadata
  if (property.endsWith(".obsidian")) {
    const cleanProperty = property.replace(".obsidian", "");
    switch (cleanProperty) {
      case "ctime":
        return entry.$ctime ? entry.$ctime.toISODate() : "Unknown Date";
      case "mtime":
        return entry.$mtime ? entry.$mtime.toISODate() : "Unknown Last Modified Date";
      case "name":
        return entry.$name || "Unnamed";
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
    }
  }

  // Handle frontmatter fields
  if (entry.$frontmatter && entry.$frontmatter.hasOwnProperty(property)) {
    const frontmatterField = entry.$frontmatter[property];

    if (frontmatterField !== null && frontmatterField !== undefined) {
      if (Array.isArray(frontmatterField)) {
        return frontmatterField.join(", ");
      }
      return frontmatterField.toString();
    }
  }

  return property === "rating" ? "Not Rated" : "Unknown";
}

// Draggable link component with Obsidian-like behavior
function DraggableLink({ entry, title }) {
  const handleDragStart = (event) => {
    event.dataTransfer.setData("text/plain", `[[${title}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a
      href={entry.$filePath ? `obsidian://open?path=${encodeURIComponent(entry.$filePath)}` : '#'}
      className="internal-link"
      draggable
      onDragStart={handleDragStart}
      title={`Drag to copy [[${title}]]`}
      style={styles.draggableLink}
    >
      {title}
    </a>
  );
}

// DraggableEditBlock component
function DraggableEditBlock(props) {
  const {
    columnId,
    index,
    columnsToShow,
    setColumnsToShow,
    editedHeaders,
    setEditedHeaders,
    editedFields,
    setEditedFields,
    updateColumn,
    removeColumn,
    dynamicColumnProperties,
  } = props;

  const handleDragStart = (e) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDrop = (e) => {
    const dragIndex = e.dataTransfer.getData("dragIndex");
    const newColumns = [...columnsToShow];
    const draggedColumn = newColumns[dragIndex];
    newColumns.splice(dragIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    setColumnsToShow(newColumns);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={styles.draggableEditBlock}
    >
      <label style={styles.editBlockHeader}>
        {editedHeaders[columnId] || columnId}
      </label>
      <label style={styles.editBlockSubheader}>Header Label:</label>
      <dc.Textbox
        value={editedHeaders[columnId] || columnId}
        onChange={(e) =>
          setEditedHeaders((prev) => ({ ...prev, [columnId]: e.target.value }))
        }
        style={styles.textbox}
      />
      <label style={styles.editBlockSubheader}>Data Field:</label>
      <dc.Textbox
        value={editedFields[columnId] || dynamicColumnProperties[columnId]}
        onChange={(e) =>
          setEditedFields((prev) => ({ ...prev, [columnId]: e.target.value }))
        }
        style={styles.textbox}
      />
      <div style={styles.editBlockButtonGroup}>
        <dc.Button onClick={() => updateColumn(columnId)} style={styles.button}>
          Update
        </dc.Button>
        <dc.Button onClick={() => removeColumn(columnId)} style={styles.button}>
          Remove
        </dc.Button>
      </div>
    </div>
  );
}

// AddNewColumn component
function AddNewColumn({
  newHeaderLabel,
  setNewHeaderLabel,
  newFieldLabel,
  setNewFieldLabel,
  addNewColumn,
}) {
  return (
    <div style={styles.addNewColumnBlock}>
      <label style={styles.addNewColumnHeader}>Add New Column</label>
      <label style={styles.addNewColumnSubheader}>New Header Label:</label>
      <dc.Textbox
        value={newHeaderLabel}
        onChange={(e) => setNewHeaderLabel(e.target.value)}
        style={styles.textbox}
      />
      <label style={styles.addNewColumnSubheader}>New Data Field:</label>
      <dc.Textbox
        value={newFieldLabel}
        onChange={(e) => setNewFieldLabel(e.target.value)}
        style={styles.textbox}
      />
      <dc.Button onClick={addNewColumn} style={styles.button}>
        Add Column
      </dc.Button>
    </div>
  );
}

// Main View Component with Edit Headers functionality
function View() {
  const initialPath = "COOKBOOK/RECIPES/ALL";
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [isEditingHeaders, setIsEditingHeaders] = dc.useState(false);
  const [editedHeaders, setEditedHeaders] = dc.useState({});
  const [editedFields, setEditedFields] = dc.useState({});
  const [newHeaderLabel, setNewHeaderLabel] = dc.useState("");
  const [newFieldLabel, setNewFieldLabel] = dc.useState("");
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = dc.useState(1);

  // Initialize dynamic column properties in state
  const [dynamicColumnProperties, setDynamicColumnProperties] = dc.useState(
    MASTER_COLUMN_CONTROLLER.defineColumns({
      Recipes: "name.obsidian",
      Source: "source",
      Genre: "genre",
      Tags: "tags",
      Ingredients: "ingredients",
      "Creation Date": "ctime.obsidian",
    })
  );

  const [columnsToShow, setColumnsToShow] = dc.useState(
    Object.keys(dynamicColumnProperties)
  );

  // Fetch query data from the path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering
  const filteredData = qdata.filter((entry) => {
    const entryName = getProperty(entry, "name.obsidian").toLowerCase();
    return entryName.includes(nameFilter.toLowerCase());
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle adding a new column
  const addNewColumn = () => {
    if (!newHeaderLabel || !newFieldLabel) {
      alert("Please provide both a new header label and a data field.");
      return;
    }

    // Add the new column to dynamicColumnProperties
    const updatedColumns = {
      ...dynamicColumnProperties,
      [newHeaderLabel]: newFieldLabel,
    };

    setDynamicColumnProperties(
      MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns)
    );

    // Update the columns to show
    setColumnsToShow((prev) => [...prev, newHeaderLabel]);

    // Clear input fields after adding
    setNewHeaderLabel("");
    setNewFieldLabel("");
  };

  // Handle header editing
  const toggleHeaderEdit = () => {
    setIsEditingHeaders(!isEditingHeaders);
  };

  const updateColumn = (columnId) => {
    const newHeader = editedHeaders[columnId] || columnId;
    const newField = editedFields[columnId] || dynamicColumnProperties[columnId];

    const updatedColumns = { ...dynamicColumnProperties };

    const updatedColumnsToShow = columnsToShow.map((col) =>
      col === columnId ? newHeader : col
    );

    delete updatedColumns[columnId];
    updatedColumns[newHeader] = newField;

    setDynamicColumnProperties(
      MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns)
    );

    setColumnsToShow(updatedColumnsToShow);

    // Reset edited headers and fields
    setEditedHeaders((prev) => {
      const newHeaders = { ...prev };
      delete newHeaders[columnId];
      return newHeaders;
    });

    setEditedFields((prev) => {
      const newFields = { ...prev };
      delete newFields[columnId];
      return newFields;
    });
  };

  const removeColumn = (columnId) => {
    const updatedColumns = { ...dynamicColumnProperties };
    delete updatedColumns[columnId];

    setDynamicColumnProperties(
      MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns)
    );

    setColumnsToShow((prev) => prev.filter((id) => id !== columnId));
  };

  return (
    <dc.Stack style={styles.mainContainer}>
      {/* Header */}
      <div style={styles.headerBlock}>
        <h1 style={styles.headerTitle}>Recipe Viewer</h1>
        <dc.Group style={styles.controlGroup}>
          <dc.Textbox
            type="search"
            placeholder="Filter recipes..."
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            style={styles.textbox}
          />
          <dc.Textbox
            value={queryPath}
            placeholder="Enter path..."
            onChange={(e) => {
              setQueryPath(e.target.value);
              setCurrentPage(1); // Reset to first page on path change
            }}
            style={styles.textbox}
          />
          <dc.Button onClick={toggleHeaderEdit} style={styles.button}>
            {isEditingHeaders ? "Finish Editing" : "Edit Headers"}
          </dc.Button>
        </dc.Group>
      </div>

      {/* Editing Headers */}
      {isEditingHeaders && (
        <div style={styles.editingBlock}>
          <dc.Group style={styles.columnBlock}>
            {columnsToShow.map((columnId, index) => (
              <DraggableEditBlock
                key={columnId}
                columnId={columnId}
                index={index}
                columnsToShow={columnsToShow}
                setColumnsToShow={setColumnsToShow}
                editedHeaders={editedHeaders}
                setEditedHeaders={setEditedHeaders}
                editedFields={editedFields}
                setEditedFields={setEditedFields}
                updateColumn={updateColumn}
                removeColumn={removeColumn}
                dynamicColumnProperties={dynamicColumnProperties}
              />
            ))}
            <AddNewColumn
              newHeaderLabel={newHeaderLabel}
              setNewHeaderLabel={setNewHeaderLabel}
              newFieldLabel={newFieldLabel}
              setNewFieldLabel={setNewFieldLabel}
              addNewColumn={addNewColumn}
            />
          </dc.Group>
        </div>
      )}

      {/* Table with fixed headers and pagination */}
      <div style={styles.contentContainer}>
        {/* Table Headers */}
        <div style={styles.tableHeader}>
          {columnsToShow.map((col) => (
            <div key={col} style={styles.tableHeaderCell}>
              {editedHeaders[col] || col}
            </div>
          ))}
        </div>

        {/* Scrollable Table Content */}
        <div style={styles.tableContent}>
          {paginatedData.length > 0 ? (
            <div style={styles.tableRows}>
              {paginatedData.map((entry, idx) => (
                <div key={idx} style={styles.tableRow}>
                  {columnsToShow.map((columnId) => {
                    const property = dynamicColumnProperties[columnId];
                    const content = getProperty(entry, property);
                    return (
                      <div key={columnId} style={styles.tableCell}>
                        {columnId === "Recipes" ? (
                          <DraggableLink entry={entry} title={content} />
                        ) : (
                          content
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noData}>No data to display.</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.paginationBlock}>
          <dc.Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={styles.button}
          >
            Previous
          </dc.Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <dc.Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={styles.button}
          >
            Next
          </dc.Button>
        </div>
      )}
    </dc.Stack>
  );
}

// Styles Block
const styles = {
  mainContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
  },
  headerBlock: {
    padding: "10px",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "var(--background-primary)",
  },
  headerTitle: {
    margin: 0,
    paddingBottom: "10px",
  },
  controlGroup: {
    gap: "10px",
    flexWrap: "wrap",
  },
  editingBlock: {
    maxHeight: "300px",
    overflowY: "auto",
    padding: "10px",
    border: "1px solid var(--background-modifier-border)",
    marginTop: "10px",
    backgroundColor: "var(--background-primary)",
  },
  columnBlock: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    flexWrap: "wrap",
  },
  contentContainer: {
    flexGrow: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    display: "flex",
    position: "sticky",
    top: "0",
    backgroundColor: "var(--background-primary)",
    zIndex: 50,
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  tableHeaderCell: {
    flex: "1 0 150px",
    padding: "10px",
    fontWeight: "bold",
    textAlign: "left",
  },
  tableContent: {
    flexGrow: 1,
    overflowY: "auto",
    overflowX: "auto",
  },
  tableRows: {
    display: "flex",
    flexDirection: "column",
  },
  tableRow: {
    display: "flex",
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  tableCell: {
    flex: "1 0 150px",
    padding: "10px",
  },
  noData: {
    padding: "20px",
    textAlign: "center",
  },
  paginationBlock: {
    padding: "10px",
    position: "sticky",
    bottom: 0,
    backgroundColor: "var(--background-primary)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  draggableLink: {
    cursor: "pointer",
    textDecoration: "underline",
    color: "var(--text-accent)",
  },
  button: {
    padding: "8px 12px",
    backgroundColor: "var(--interactive-accent)",
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  draggableEditBlock: {
    padding: "20px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "15px",
    width: "300px",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    borderRadius: "8px",
    cursor: "grab",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  editBlockHeader: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  editBlockSubheader: {
    color: "var(--text-faint)",
    fontSize: "12px",
    marginBottom: "5px",
  },
  textbox: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "100%",
    boxSizing: "border-box",
  },
  editBlockButtonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  addNewColumnBlock: {
    padding: "20px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "15px",
    width: "300px",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  addNewColumnHeader: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  addNewColumnSubheader: {
    color: "var(--text-faint)",
    fontSize: "12px",
  },
};

return View;
```


