
```jsx
//////////////////////////////////////////////////
///               Controls Settings            ///
//////////////////////////////////////////////////

const initialQueryPath = "COOKBOOK/RECIPES/ALL";

const initialDynamicColumnProperties = {
  Recipes: "name.obsidian",
  Source: "source",
  Genre: "genre",
  Tags: "tags",
  Ingredients: "ingredients",
  "Creation Date": "ctime.obsidian",
};

const initialPlaceholders = {
  nameFilter: "Filter notes...",
  queryPath: "Enter path...",
  headerTitle: "Recipe Viewer",
};

// Specify the grouping columns here
const initialGroupByColumns = ["Genre", "Source"];

//////////////////////////////////////////////////
///               Helper Functions             ///
//////////////////////////////////////////////////

const { useState, useEffect, useRef, useMemo } = dc;

const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props) => props,
  getFallbackValue: () => "Unknown",
  getNoDataFallback: () => "No Data",
};

function getProperty(entry, property) {
  if (property.endsWith(".obsidian")) {
    const cleanProperty = property.replace(".obsidian", "");
    const obsidianProperties = {
      ctime: entry.$ctime ? entry.$ctime.toISODate() : "Unknown Date",
      mtime: entry.$mtime ? entry.$mtime.toISODate() : "Unknown Last Modified Date",
      name: entry.$name || "Unnamed",
    };
    return (
      obsidianProperties[cleanProperty] ||
      MASTER_COLUMN_CONTROLLER.getNoDataFallback(property)
    );
  }

  const frontmatterField = entry.$frontmatter
    ? entry.$frontmatter[property]
    : undefined;

  if (frontmatterField !== undefined) {
    if (
      frontmatterField &&
      typeof frontmatterField === "object" &&
      frontmatterField.hasOwnProperty("value")
    ) {
      const value = frontmatterField.value;
      if (Array.isArray(value)) {
        return value.join(", ");
      } else if (value !== null && value !== undefined) {
        return value.toString();
      }
    } else if (
      typeof frontmatterField === "string" ||
      typeof frontmatterField === "number"
    ) {
      return frontmatterField.toString();
    } else if (Array.isArray(frontmatterField)) {
      return frontmatterField.join(", ");
    } else if (frontmatterField !== null && frontmatterField !== undefined) {
      return frontmatterField.toString();
    }
  }

  return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
}

//////////////////////////////////////////////////
///               Components                   ///
//////////////////////////////////////////////////

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
      </div>
    </div>
  );
}

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

function DataTable({
  columnsToShow,
  dynamicColumnProperties,
  displayedData,
  groupByColumns,
  isGroupingEnabled,
  styles,
}) {
  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableWrapper}>
        {/* Table Headers */}
        <div style={styles.tableHeader}>
          {columnsToShow.map((col) => (
            <div key={col} style={styles.tableHeaderCell}>
              {col}
            </div>
          ))}
        </div>

        {/* Table Content */}
        <div style={styles.tableContent}>
          {displayedData.length > 0 ? (
            <RenderRows
              data={displayedData}
              columnsToShow={columnsToShow}
              dynamicColumnProperties={dynamicColumnProperties}
              groupByColumns={isGroupingEnabled ? groupByColumns : []}
              groupLevel={0}
            />
          ) : (
            <div style={styles.noData}>No data to display.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function RenderRows({
  data,
  columnsToShow,
  dynamicColumnProperties,
  groupByColumns,
  groupLevel,
}) {
  if (groupByColumns.length === 0) {
    return (
      <div style={styles.tableRows}>
        {data.map((entry, idx) => (
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
    );
  } else {
    const groupKey = groupByColumns[0];
    const property = dynamicColumnProperties[groupKey];
    const groups = {};

    data.forEach((entry) => {
      const key = getProperty(entry, property) || "Uncategorized";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b)
    );

    return (
      <>
        {sortedGroupKeys.map((key, idx) => (
          <div key={idx}>
            <div
              style={{
                ...styles.groupHeader,
                ...getGroupHeaderStyle(groupLevel),
              }}
            >
              {key}
            </div>
            <RenderRows
              data={groups[key]}
              columnsToShow={columnsToShow}
              dynamicColumnProperties={dynamicColumnProperties}
              groupByColumns={groupByColumns.slice(1)}
              groupLevel={groupLevel + 1}
            />
          </div>
        ))}
      </>
    );
  }
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageInput,
  setPageInput,
  styles,
  totalEntries,
}) {
  return (
    <div style={styles.paginationBlock}>
      {totalPages > 1 ? (
        <div style={styles.paginationControls}>
          <dc.Button
            onClick={() => onPageChange(currentPage - 1)}
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
                  onPageChange(pageNumber);
                }
              }
            }}
            style={styles.paginationTextbox}
          />
          <dc.Button
            onClick={() => {
              const pageNumber = parseInt(pageInput, 10);
              if (!isNaN(pageNumber)) {
                onPageChange(pageNumber);
              }
            }}
            style={styles.button}
          >
            Go
          </dc.Button>
          <dc.Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={styles.button}
          >
            Next
          </dc.Button>
        </div>
      ) : (
        <span>Total Entries: {totalEntries}</span>
      )}
    </div>
  );
}

//////////////////////////////////////////////////
///               Main View Component          ///
//////////////////////////////////////////////////

function View() {
  const [nameFilter, setNameFilter] = useState("");
  const [queryPath, setQueryPath] = useState(initialQueryPath);
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [editedHeaders, setEditedHeaders] = useState({});
  const [editedFields, setEditedFields] = useState({});
  const [newHeaderLabel, setNewHeaderLabel] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");

  // Grouping state
  const [groupByColumns] = useState(initialGroupByColumns); // Specified in code only
  const [isGroupingEnabled, setIsGroupingEnabled] = useState(true);

  const [dynamicColumnProperties, setDynamicColumnProperties] = useState(
    MASTER_COLUMN_CONTROLLER.defineColumns(initialDynamicColumnProperties)
  );

  const [columnsToShow, setColumnsToShow] = useState(
    Object.keys(dynamicColumnProperties)
  );

  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  const filteredData = useMemo(() => {
    return qdata.filter((entry) => {
      const entryNameRaw = getProperty(entry, "name.obsidian");
      const entryName = entryNameRaw ? entryNameRaw.toLowerCase() : "";
      const nameMatch = entryName.includes(nameFilter.toLowerCase());
      return nameMatch;
    });
  }, [qdata, nameFilter]);

  const displayedData = useMemo(() => {
    if (isGroupingEnabled && groupByColumns.length > 0) {
      return filteredData;
    } else {
      return filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    }
  }, [filteredData, isGroupingEnabled, groupByColumns, currentPage, itemsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil(filteredData.length / itemsPerPage),
    [filteredData.length, itemsPerPage]
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setPageInput("");
    }
  };

  const addNewColumn = () => {
    if (!newHeaderLabel || !newFieldLabel) {
      alert("Please provide both a new header label and a data field.");
      return;
    }

    const updatedColumns = {
      ...dynamicColumnProperties,
      [newHeaderLabel]: newFieldLabel,
    };

    setDynamicColumnProperties(
      MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns)
    );

    setColumnsToShow((prev) => [...prev, newHeaderLabel]);

    setNewHeaderLabel("");
    setNewFieldLabel("");
  };

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

  const totalEntries = filteredData.length;

  return (
    <dc.Stack style={styles.mainContainer}>
      <div style={styles.headerContainer}>
        <div style={styles.headerBlock}>
          <h1 style={styles.headerTitle}>{initialPlaceholders.headerTitle}</h1>
          <dc.Group style={styles.controlGroup}>
            <dc.Textbox
              type="search"
              placeholder={initialPlaceholders.nameFilter}
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.textbox}
            />
            <dc.Textbox
              value={queryPath}
              placeholder={initialPlaceholders.queryPath}
              onChange={(e) => {
                setQueryPath(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.textbox}
            />
            <dc.Button onClick={toggleHeaderEdit} style={styles.button}>
              {isEditingHeaders ? "Finish Editing" : "Edit Headers"}
            </dc.Button>
            <dc.Button
              onClick={() => setIsGroupingEnabled(!isGroupingEnabled)}
              style={styles.button}
            >
              {isGroupingEnabled ? "Disable Grouping" : "Enable Grouping"}
            </dc.Button>
          </dc.Group>
        </div>

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

      <DataTable
        columnsToShow={columnsToShow}
        dynamicColumnProperties={dynamicColumnProperties}
        displayedData={displayedData}
        groupByColumns={groupByColumns}
        isGroupingEnabled={isGroupingEnabled}
        styles={styles}
      />

      {!isGroupingEnabled && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageInput={pageInput}
          setPageInput={setPageInput}
          styles={styles}
          totalEntries={totalEntries}
        />
      )}
    </dc.Stack>
  );
}

//////////////////////////////////////////////////
///                   Styles                   ///
//////////////////////////////////////////////////

// Helper function to get styles based on group level
function getGroupHeaderStyle(groupLevel) {
  const colors = [
    "var(--background-secondary)", // Level 1
    "var(--background-secondary-alt)", // Level 2
    "#2c2f33", // Level 3
    "#23272a", // Level 4
    // Add more colors if needed
  ];
  return {
    paddingLeft: `${groupLevel * 20}px`,
    backgroundColor: colors[groupLevel % colors.length],
    color: "var(--text-normal)",
    fontWeight: "bold",
    borderBottom: "1px solid var(--background-modifier-border)",
    position: "sticky",
    top: 0,
    zIndex: 1,
  };
}

const styles = {
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
  },
  headerContainer: {
    backgroundColor: "var(--background-primary)",
    display: "flex",
    flexDirection: "column",
  },
  headerBlock: {
    padding: "10px",
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
  editingBlockContainer: {
    overflowX: "auto",
    overflowY: "hidden",
    backgroundColor: "var(--background-primary)",
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  editingBlock: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    padding: "10px",
    flexWrap: "nowrap",
  },
  tableContainer: {
    flex: 1,
    overflow: "hidden",
  },
  tableWrapper: {
    width: "100%",
    height: "100%",
    overflow: "auto",
    position: "relative",
  },
  tableHeader: {
    display: "flex",
    backgroundColor: "var(--background-primary)",
    position: "sticky",
    top: 0,
    zIndex: 2,
  },
  tableHeaderCell: {
    flex: "1 0 150px",
    minWidth: "150px",
    padding: "10px",
    fontWeight: "bold",
    textAlign: "left",
    backgroundColor: "var(--background-primary)",
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  tableContent: {
    display: "flex",
    flexDirection: "column",
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
    minWidth: "150px",
    padding: "10px",
  },
  groupHeader: {
    padding: "10px",
    backgroundColor: "var(--background-secondary)",
    fontWeight: "bold",
    borderBottom: "1px solid var(--background-modifier-border)",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  noData: {
    padding: "20px",
    textAlign: "center",
  },
  paginationBlock: {
    backgroundColor: "var(--background-primary)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "10px",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  paginationTextbox: {
    width: "80px",
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    boxSizing: "border-box",
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
  buttonSmall: {
    padding: "4px 6px",
    backgroundColor: "var(--interactive-accent)",
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  textbox: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "100%",
    boxSizing: "border-box",
  },
  draggableEditBlock: {
    flex: "0 0 300px",
    padding: "20px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "15px",
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
  editBlockButtonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px",
    width: "100%",
  },
  buttonFullWidth: {
    flex: 1,
    textAlign: "center",
  },
};

return View;
```