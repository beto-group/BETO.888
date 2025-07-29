

```jsx

////////////////////////////////////////////////////
///               Controls Settings              ///
////////////////////////////////////////////////////
//PATH TO DISPLAY
//FUTURE NOTE ADD MORE WAYS
const initialQueryPath = "COOKBOOK/RECIPES/ALL";

//Column you desire to display.
// utilize `.obsidian` to use build-in obsidian frontmatter properties
const initialDynamicColumnProperties = {
  Recipes: "name.obsidian",
  Source: "source",
  Genre: "genre",
  Tags: "tags",
  Ingredients: "ingredients",
  "Creation Date": "ctime.obsidian",
};

// Specify the grouping columns here
// EX : const initialGroupByColumns = ["Genre", "Source"];
const initialGroupByColumns = [];

// Specify the initial pagination settings here
const initialPaginationSettings = {
  isEnabled: true,
  itemsPerPage: 10,
};


const initialPlaceholders = {
  nameFilter: "Search notes...",
  queryPath: "Enter path...",
  headerTitle: "Recipe Viewer",
};


////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

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

////////////////////////////////////////////////////
///                 Components                   ///
////////////////////////////////////////////////////

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
    groupByColumns,
    setGroupByColumns,
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

  const isGrouped = groupByColumns.includes(columnId);
  const groupIndex = groupByColumns.indexOf(columnId) + 1; // +1 to make it 1-based index

  const toggleGroupByColumn = () => {
    if (isGrouped) {
      setGroupByColumns((prev) => prev.filter((col) => col !== columnId));
    } else {
      setGroupByColumns((prev) => [...prev, columnId]);
    }
  };

  const moveGroupUp = () => {
    setGroupByColumns((prev) => {
      const idx = prev.indexOf(columnId);
      if (idx > 0) {
        const newGroup = [...prev];
        [newGroup[idx - 1], newGroup[idx]] = [newGroup[idx], newGroup[idx - 1]];
        return newGroup;
      }
      return prev;
    });
  };

  const moveGroupDown = () => {
    setGroupByColumns((prev) => {
      const idx = prev.indexOf(columnId);
      if (idx < prev.length - 1) {
        const newGroup = [...prev];
        [newGroup[idx], newGroup[idx + 1]] = [newGroup[idx + 1], newGroup[idx]];
        return newGroup;
      }
      return prev;
    });
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
        <div style={styles.groupingControls}>
          <dc.Button
            onClick={toggleGroupByColumn}
            style={{
              ...styles.button,
              ...styles.buttonFullWidth,
              backgroundColor: isGrouped ? "var(--interactive-normal)" : undefined,
            }}
          >
            {isGrouped ? "Ungroup" : "Group By"}
          </dc.Button>
          {isGrouped && (
            <div style={styles.groupOrderControls}>
              <span style={styles.groupOrderLabel}>Group Order: {groupIndex}</span>
              <dc.Button
                onClick={moveGroupUp}
                disabled={groupByColumns.indexOf(columnId) === 0}
                style={{ ...styles.button, ...styles.buttonSmall }}
              >
                ↑
              </dc.Button>
              <dc.Button
                onClick={moveGroupDown}
                disabled={
                  groupByColumns.indexOf(columnId) === groupByColumns.length - 1
                }
                style={{ ...styles.button, ...styles.buttonSmall }}
              >
                ↓
              </dc.Button>
            </div>
          )}
        </div>
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

function PaginationSettings({
  isPaginationEnabled,
  setIsPaginationEnabled,
  itemsPerPage,
  setItemsPerPage,
  styles,
}) {
  return (
    <div style={styles.paginationSettingsBlock}>
      <label style={styles.editBlockHeader}>Pagination Settings</label>
      <div style={styles.paginationControlsGroup}>
        <dc.Checkbox
          label="Enable Pagination"
          checked={isPaginationEnabled}
          onChange={(e) => setIsPaginationEnabled(e.target.checked)}
        />
        {isPaginationEnabled && (
          <>
            <label style={styles.editBlockSubheader}>Items per Page:</label>
            <dc.Textbox
              type="number"
              min="1"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={styles.textbox}
            />
          </>
        )}
      </div>
    </div>
  );
}

function DataTable({
  columnsToShow,
  dynamicColumnProperties,
  displayedData,
  groupByColumns,
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
              groupByColumns={groupByColumns}
              groupLevel={0} // Start at root level
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
              groupLevel={groupLevel + 1} // Increase group level for indentation
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

////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////

function View() {
  const [nameFilter, setNameFilter] = useState("");
  const [queryPath, setQueryPath] = useState(initialQueryPath);
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [editedHeaders, setEditedHeaders] = useState({});
  const [editedFields, setEditedFields] = useState({});
  const [newHeaderLabel, setNewHeaderLabel] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");

  // Pagination controls initialized from settings
  const [isPaginationEnabled, setIsPaginationEnabled] = useState(
    initialPaginationSettings.isEnabled
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    initialPaginationSettings.itemsPerPage
  );

  // Initialize grouping columns from code, but allow modifications via UI
  const [groupByColumns, setGroupByColumns] = useState(initialGroupByColumns);

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
      return entryName.includes(nameFilter.toLowerCase());
    });
  }, [qdata, nameFilter]);

  // Apply grouping to the filtered data
  const groupedData = useMemo(() => {
    // Flatten the data into a list of entries with group keys
    const flattenGroupedData = (data, groupKeys, currentLevel = 0) => {
      if (groupKeys.length === 0) {
        return data;
      } else {
        const groupKey = groupKeys[0];
        const property = dynamicColumnProperties[groupKey];
        const groups = {};

        data.forEach((entry) => {
          const key = getProperty(entry, property) || "Uncategorized";
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(entry);
        });

        let result = [];
        Object.keys(groups).sort().forEach((key) => {
          result.push({ type: "group", level: currentLevel, key });
          const children = flattenGroupedData(
            groups[key],
            groupKeys.slice(1),
            currentLevel + 1
          );
          result = result.concat(children);
        });
        return result;
      }
    };

    return flattenGroupedData(filteredData, groupByColumns);
  }, [filteredData, groupByColumns, dynamicColumnProperties]);

  // Apply pagination to the grouped data
  const paginatedData = useMemo(() => {
    if (isPaginationEnabled) {
      return groupedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    } else {
      return groupedData;
    }
  }, [groupedData, currentPage, itemsPerPage, isPaginationEnabled]);

  const totalPages = useMemo(
    () =>
      isPaginationEnabled ? Math.ceil(groupedData.length / itemsPerPage) : 1,
    [groupedData.length, itemsPerPage, isPaginationEnabled]
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

    // Update grouping if the column name changed
    setGroupByColumns((prev) =>
      prev.map((col) => (col === columnId ? newHeader : col))
    );
  };

  const removeColumn = (columnId) => {
    const updatedColumns = { ...dynamicColumnProperties };
    delete updatedColumns[columnId];

    setDynamicColumnProperties(
      MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns)
    );

    setColumnsToShow((prev) => prev.filter((id) => id !== columnId));

    // Remove from grouping if necessary
    setGroupByColumns((prev) => prev.filter((col) => col !== columnId));
  };

  const totalEntries = groupedData.length;

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
          </dc.Group>
        </div>


		{isEditingHeaders && (
          <div style={styles.paginationSettingsContainer}>
            <PaginationSettings
              isPaginationEnabled={isPaginationEnabled}
              setIsPaginationEnabled={setIsPaginationEnabled}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              styles={styles}
            />
          </div>
        )}
        
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
                  groupByColumns={groupByColumns}
                  setGroupByColumns={setGroupByColumns}
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
        displayedData={paginatedData}
        groupByColumns={groupByColumns}
        styles={styles}
      />

      {isPaginationEnabled && (
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

////////////////////////////////////////////////////
///                   Styles                     ///
////////////////////////////////////////////////////

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
  paginationSettingsContainer: {
    padding: "10px",
    backgroundColor: "var(--background-primary)",
    borderBottom: "1px solid var(--background-modifier-border)",
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
  groupingControls: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  groupOrderControls: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  groupOrderLabel: {
    fontSize: "12px",
    color: "var(--text-faint)",
  },
  buttonFullWidth: {
    flex: 1,
    textAlign: "center",
  },
  paginationSettingsBlock: {
    flex: "0 0 300px",
    padding: "20px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "15px",
    backgroundColor: "var(--background-secondary-alt)",
    color: "var(--text-normal)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  paginationControlsGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
};

return View;
```