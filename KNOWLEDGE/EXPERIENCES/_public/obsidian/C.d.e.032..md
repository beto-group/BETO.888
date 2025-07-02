




```datacorejsx
// Import necessary hooks
const { useState, useRef, useEffect } = dc;

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

    // If it's an object with a `value` field
    if (
      frontmatterField &&
      typeof frontmatterField === "object" &&
      frontmatterField.hasOwnProperty("value")
    ) {
      if (Array.isArray(frontmatterField.value)) {
        return frontmatterField.value.join(", ");
      } else if (frontmatterField.value !== null && frontmatterField.value !== undefined) {
        return frontmatterField.value.toString();
      } else {
        return "Unknown";
      }
    }

    // If it's a simple string, number, or array
    if (
      typeof frontmatterField === "string" ||
      typeof frontmatterField === "number"
    ) {
      return frontmatterField.toString();
    }

    if (Array.isArray(frontmatterField)) {
      return frontmatterField.join(", ");
    }

    return "Unknown";
  }

  return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
}

// Draggable link component with correct link handling
function DraggableLink({ entry, title }) {
  const handleDragStart = (event) => {
    event.dataTransfer.setData("text/plain", `[[${title}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a
      href="#"
      className="internal-link"
      draggable
      onDragStart={handleDragStart}
      data-href={entry.$path || title}
      data-type="file"
      title={`Drag to copy [[${title}]]`}
      style={styles.draggableLink}
    >
      {title}
    </a>
  );
}

// DraggableEditBlock component with Group By and Pin Column functionality
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
    groupByColumn,
    setGroupByColumn,
    pinnedColumns,
    setPinnedColumns,
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
        <dc.Button
          onClick={() => updateColumn(columnId)}
          style={{ ...styles.button, ...styles.buttonFullWidth }}
        >
          Update
        </dc.Button>
        <dc.Button
          onClick={() => removeColumn(columnId)}
          style={{ ...styles.button, ...styles.buttonFullWidth }}
        >
          Remove
        </dc.Button>
        <dc.Button
          onClick={() => {
            if (groupByColumn === columnId) {
              setGroupByColumn(null);
            } else {
              setGroupByColumn(columnId);
            }
          }}
          style={{
            ...styles.button,
            ...styles.buttonFullWidth,
            backgroundColor: groupByColumn === columnId ? "var(--interactive-normal)" : undefined,
          }}
        >
          {groupByColumn === columnId ? "Ungroup" : "Group By"}
        </dc.Button>
        <dc.Button
          onClick={() => {
            if (pinnedColumns.includes(columnId)) {
              setPinnedColumns(pinnedColumns.filter((col) => col !== columnId));
            } else {
              setPinnedColumns([...pinnedColumns, columnId]);
            }
          }}
          style={{
            ...styles.button,
            ...styles.buttonFullWidth,
            backgroundColor: pinnedColumns.includes(columnId) ? "var(--interactive-normal)" : undefined,
          }}
        >
          {pinnedColumns.includes(columnId) ? "Unpin Column" : "Pin Column"}
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
    <div style={styles.draggableEditBlock}>
      <label style={styles.editBlockHeader}>Add New Column</label>
      <label style={styles.editBlockSubheader}>New Header Label:</label>
      <dc.Textbox
        value={newHeaderLabel}
        onChange={(e) => setNewHeaderLabel(e.target.value)}
        style={styles.textbox}
      />
      <label style={styles.editBlockSubheader}>New Data Field:</label>
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

// Main View Component
function View() {
  const initialPath = "COOKBOOK/RECIPES/ALL";
  const [nameFilter, setNameFilter] = useState("");
  const [queryPath, setQueryPath] = useState(initialPath);
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [editedHeaders, setEditedHeaders] = useState({});
  const [editedFields, setEditedFields] = useState({});
  const [newHeaderLabel, setNewHeaderLabel] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [pinnedColumns, setPinnedColumns] = useState([]);

  // Grouping state
  const [groupByColumn, setGroupByColumn] = useState(null);

  // Initialize dynamic column properties in state
  const [dynamicColumnProperties, setDynamicColumnProperties] = useState(
    MASTER_COLUMN_CONTROLLER.defineColumns({
      Recipes: "name.obsidian",
      Source: "source",
      Genre: "genre",
      Tags: "tags",
      Ingredients: "ingredients",
      "Creation Date": "ctime.obsidian",
    })
  );

  const [columnsToShow, setColumnsToShow] = useState(
    Object.keys(dynamicColumnProperties)
  );

  // Fetch query data from the path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering
  const filteredData = qdata.filter((entry) => {
    const entryName = getProperty(entry, "name.obsidian").toLowerCase();
    return entryName.includes(nameFilter.toLowerCase());
  });

  // Data processing with grouping
  let displayedData;
  let totalItems;
  let totalPages;

  if (groupByColumn) {
    const property = dynamicColumnProperties[groupByColumn];
    const groups = {};
    filteredData.forEach((entry) => {
      const key = getProperty(entry, property) || "Uncategorized";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });
    // Convert groups object to array and sort by key ascending
    const sortedGroups = Object.keys(groups)
      .sort((a, b) => a.localeCompare(b)) // Ensure ascending order
      .map((key) => ({
        key,
        items: groups[key],
      }));

    // Flatten the grouped data into an array of rows
    const flattenedData = [];
    sortedGroups.forEach((group) => {
      flattenedData.push({ type: 'group', key: group.key });
      group.items.forEach((entry) => {
        flattenedData.push({ type: 'item', entry });
      });
    });

    // Apply pagination
    totalItems = flattenedData.length;
    totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    displayedData = flattenedData.slice(startIndex, endIndex);
  } else {
    // Apply pagination
    totalItems = filteredData.length;
    totalPages = Math.ceil(totalItems / itemsPerPage);
    displayedData = filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setPageInput(""); // Clear the page input after changing the page
    }
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

  // Compute left positions for pinned columns
  const pinnedColumnsLeftPositions = {};
  let cumulativeWidth = 0;
  columnsToShow.forEach((columnId) => {
    if (pinnedColumns.includes(columnId)) {
      pinnedColumnsLeftPositions[columnId] = cumulativeWidth;
      cumulativeWidth += 150; // Assuming each column is 150px wide
    }
  });

  return (
    <dc.Stack style={styles.mainContainer}>
      {/* Header and Editing Block Container */}
      <div style={styles.headerContainer}>
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
          <div style={styles.editingBlockContainer}>
            <div style={styles.editingBlock}>
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
                  groupByColumn={groupByColumn}
                  setGroupByColumn={setGroupByColumn}
                  pinnedColumns={pinnedColumns}
                  setPinnedColumns={setPinnedColumns}
                />
              ))}
              <AddNewColumn
                newHeaderLabel={newHeaderLabel}
                setNewHeaderLabel={setNewHeaderLabel}
                newFieldLabel={newFieldLabel}
                setNewFieldLabel={setNewFieldLabel}
                addNewColumn={addNewColumn}
              />
            </div>
          </div>
        )}
      </div>

      {/* Table Content with Headers */}
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          {/* Table Headers */}
          <div style={styles.tableHeader}>
            {columnsToShow.map((col) => {
              const isPinned = pinnedColumns.includes(col);
              const cellStyle = {
                ...styles.tableHeaderCell,
                ...(isPinned
                  ? {
                      position: 'sticky',
                      left: pinnedColumnsLeftPositions[col],
                      zIndex: 2,
                      backgroundColor: 'var(--background-primary)',
                    }
                  : {}),
              };
              return (
                <div key={col} style={cellStyle}>
                  {editedHeaders[col] || col}
                </div>
              );
            })}
          </div>

          {/* Scrollable Table Content */}
          <div style={styles.tableContent}>
            {displayedData.length > 0 ? (
              <div style={styles.tableRows}>
                {displayedData.map((dataItem, idx) => {
                  if (dataItem.type === 'group') {
                    return (
                      <div key={`group-${idx}`} style={styles.groupHeader}>
                        {dataItem.key}
                      </div>
                    );
                  } else if (dataItem.type === 'item') {
                    const entry = dataItem.entry;
                    return (
                      <div key={`item-${idx}`} style={styles.tableRow}>
                        {columnsToShow.map((columnId) => {
                          const property = dynamicColumnProperties[columnId];
                          const content = getProperty(entry, property);
                          const isPinned = pinnedColumns.includes(columnId);
                          const cellStyle = {
                            ...styles.tableCell,
                            ...(isPinned
                              ? {
                                  position: 'sticky',
                                  left: pinnedColumnsLeftPositions[columnId],
                                  zIndex: 1,
                                  backgroundColor: 'var(--background-primary)',
                                }
                              : {}),
                          };
                          return (
                            <div key={columnId} style={cellStyle}>
                              {columnId === "Recipes" ? (
                                <DraggableLink entry={entry} title={content} />
                              ) : (
                                content
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div style={styles.noData}>No data to display.</div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div style={styles.paginationBlock}>
        {totalPages > 1 ? (
          <div style={styles.paginationControls}>
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
            <dc.Textbox
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              placeholder="Go to page..."
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const pageNumber = parseInt(pageInput, 10);
                  if (!isNaN(pageNumber)) {
                    handlePageChange(pageNumber);
                  }
                }
              }}
              style={styles.paginationTextbox}
            />
            <dc.Button
              onClick={() => {
                const pageNumber = parseInt(pageInput, 10);
                if (!isNaN(pageNumber)) {
                  handlePageChange(pageNumber);
                }
              }}
              style={styles.button}
            >
              Go
            </dc.Button>
            <dc.Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={styles.button}
            >
              Next
            </dc.Button>
          </div>
        ) : (
          <span>Total Entries: {filteredData.length}</span>
        )}
      </div>
    </dc.Stack>
  );
}

// Styles Block
const styles = {
  mainContainer: {
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    height: '100vh', // Ensures the container fills the viewport height
    backgroundColor: 'var(--background-primary)',
    color: 'var(--text-normal)',
  },
  headerContainer: {
    gridRow: '1',
    backgroundColor: 'var(--background-primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  headerBlock: {
    padding: '10px',
    backgroundColor: 'var(--background-primary)',
  },
  headerTitle: {
    margin: 0,
    paddingBottom: '10px',
  },
  controlGroup: {
    gap: '10px',
    flexWrap: 'wrap',
  },
  editingBlockContainer: {
    overflowX: 'auto',
    overflowY: 'hidden',
    backgroundColor: 'var(--background-primary)',
    borderBottom: '1px solid var(--background-modifier-border)',
  },
  editingBlock: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    padding: '10px',
    flexWrap: 'nowrap',
  },
  tableContainer: {
    gridRow: '2',
    overflow: 'hidden', // Ensures content doesn't overflow outside
    display: 'flex',
    flexDirection: 'column',
    height: 0,
    flexGrow: 1, // Allows the container to expand and fill available space
  },
  tableWrapper: {
    width: '100%',
    height: '100%', // Fills the parent container's height
    overflowX: 'auto',
  },
  tableHeader: {
    display: 'flex',
    backgroundColor: 'var(--background-primary)',
    zIndex: 99,
  },
  tableHeaderCell: {
    flex: '0 0 150px',
    minWidth: '150px',
    padding: '10px',
    fontWeight: 'bold',
    textAlign: 'left',
    backgroundColor: 'var(--background-primary)',
    borderBottom: '1px solid var(--background-modifier-border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  tableContent: {
    overflowY: 'auto', // Allows vertical scrolling within the table content
    height: '100%', // Fills the parent container's height
  },
  tableRows: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableRow: {
    display: 'flex',
    borderBottom: '1px solid var(--background-modifier-border)',
  },
  tableCell: {
    flex: '0 0 150px',
    minWidth: '150px',
    padding: '10px',
  },
  groupHeader: {
    padding: '10px',
    backgroundColor: 'var(--background-secondary)',
    fontWeight: 'bold',
    borderBottom: '1px solid var(--background-modifier-border)',
  },
  noData: {
    padding: '20px',
    textAlign: 'center',
  },
  paginationBlock: {
    gridRow: '3',
    backgroundColor: 'var(--background-primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  paginationTextbox: {
    width: '80px',
    padding: '8px',
    border: '1px solid var(--background-modifier-border)',
    backgroundColor: 'var(--background-primary)',
    color: 'var(--text-normal)',
    boxSizing: 'border-box',
  },
  draggableLink: {
    cursor: 'pointer',
    textDecoration: 'underline',
    color: 'var(--text-accent)',
  },
  button: {
    padding: '8px 12px',
    backgroundColor: 'var(--interactive-accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  textbox: {
    padding: '8px',
    border: '1px solid var(--background-modifier-border)',
    backgroundColor: 'var(--background-primary)',
    color: 'var(--text-normal)',
    width: '100%',
    boxSizing: 'border-box',
  },
  draggableEditBlock: {
    flex: '0 0 300px',
    padding: '20px',
    border: '1px solid var(--background-modifier-border)',
    marginBottom: '15px',
    backgroundColor: 'var(--background-secondary)',
    color: 'var(--text-normal)',
    borderRadius: '8px',
    cursor: 'grab',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  editBlockHeader: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  editBlockSubheader: {
    color: 'var(--text-faint)',
    fontSize: '12px',
    marginBottom: '5px',
  },
  editBlockButtonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px',
    width: '100%',
  },
  buttonFullWidth: {
    flex: 1,
    textAlign: 'center',
  },
};

return View;
```


