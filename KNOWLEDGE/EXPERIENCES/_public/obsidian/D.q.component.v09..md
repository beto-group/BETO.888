---
aliases:
  - datacore.query.component.v09
---


# viewer

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  vaultName: "YourActualVaultName", // **IMPORTANT:** Replace with your actual vault name :wip
  queryPath: "COOKBOOK/RECIPES/ALL",
  initialNameFilter: "",
  dynamicColumnProperties: {
    Dish: "name.obsidian", // Renamed from 'Recipes' to 'Dish'
    Source: "source",
    Genre: "genre",
    Tags: "tags",
    Ingredients: "ingredients",
    "Creation Date": "ctime.obsidian",
  },
  groupByColumns: [],
  pagination: {
    isEnabled: true,
    itemsPerPage: 10,
  },
  viewHeight: "600px",
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Recipe Viewer",
    newHeaderLabel: "New Header Label",
    newDataField: "New Data Field",
  },
  quickAddCommandId: "quickadd:add_recipe", // **NEW:** QuickAdd command ID :wip
};

////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

const { useState, useMemo, useEffect } = dc; // Assuming 'dc' is the Dataview context

function getProperty(entry, property) {
  if (property.endsWith(".obsidian")) {
    const key = property.replace(".obsidian", "");
    const obsidianProps = {
      ctime: entry.$ctime?.toISODate() || "Unknown Date",
      mtime: entry.$mtime?.toISODate() || "Unknown Last Modified Date",
      name: entry.$name || "Unnamed",
    };
    return obsidianProps[key] || "No Data";
  }

  const frontmatterField = entry.$frontmatter?.[property];
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
    } else if (Array.isArray(frontmatterField)) {
      return frontmatterField.join(", ");
    } else if (
      typeof frontmatterField === "string" ||
      typeof frontmatterField === "number"
    ) {
      return frontmatterField.toString();
    } else if (frontmatterField !== null && frontmatterField !== undefined) {
      return frontmatterField.toString();
    }
  }

  return "No Data";
}

////////////////////////////////////////////////////
///                 Components                   ///
////////////////////////////////////////////////////

function DraggableLink({ entry, title }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", `[[${title}]]`);
    e.dataTransfer.effectAllowed = "copy";
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

function EditableCell({ entry, property, onUpdate }) {
  const [value, setValue] = useState(getProperty(entry, property));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setValue(getProperty(entry, property));
  }, [entry, property]);

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(entry, property, value);
  };

  return isEditing ? (
    <dc.Textbox
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      autoFocus
      style={styles.cellTextbox}
    />
  ) : (
    <div
      style={styles.tableCellContent}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {value}
    </div>
  );
}

function EditableHeader({ columnId, editedHeaders, setEditedHeaders }) {
  const [isEditing, setIsEditing] = useState(false);
  const [headerValue, setHeaderValue] = useState(
    editedHeaders[columnId] || columnId
  );

  const handleBlur = () => {
    const trimmedValue = headerValue.trim();
    if (trimmedValue === "") {
      alert("Header name cannot be empty.");
      setHeaderValue(editedHeaders[columnId] || columnId);
    } else {
      setIsEditing(false);
      setEditedHeaders((prev) => ({
        ...prev,
        [columnId]: trimmedValue,
      }));
    }
  };

  return isEditing ? (
    <dc.Textbox
      value={headerValue}
      onChange={(e) => setHeaderValue(e.target.value)}
      onBlur={handleBlur}
      autoFocus
      placeholder="Edit header..."
      style={styles.headerTextbox}
    />
  ) : (
    <label
      style={styles.editBlockHeader}
      onClick={() => setIsEditing(true)}
      title="Click to edit header"
    >
      {headerValue}
    </label>
  );
}

function EditColumnBlock(props) {
  const {
    columnId,
    index,
    columnsToShow,
    setColumnsToShow,
    editedHeaders,
    setEditedHeaders,
    editedFields,
    setEditedFields,
    updateColumn, // Centralized update function
    removeColumn,
    dynamicColumnProperties,
    groupByColumns,
    setGroupByColumns,
    groupSortOrders,
    setGroupSortOrders,
  } = props;

  const isGrouped = groupByColumns.includes(columnId);
  const groupIndex = groupByColumns.indexOf(columnId) + 1;
  const sortOrder = groupSortOrders[columnId] || "asc";

  const handleDragStart = (e) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDrop = (e) => {
    const dragIndex = e.dataTransfer.getData("dragIndex");
    if (dragIndex === "") return; // Prevent errors if dragIndex is not set
    const parsedDragIndex = parseInt(dragIndex, 10);
    if (isNaN(parsedDragIndex)) return;
    const newColumns = [...columnsToShow];
    const draggedColumn = newColumns[parsedDragIndex];
    newColumns.splice(parsedDragIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    setColumnsToShow(newColumns);
  };

  // Toggle Sort Order between 'asc' and 'desc'
  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setGroupSortOrders({
      ...groupSortOrders,
      [columnId]: newSortOrder,
    });
  };

  // Handle Data Field Editing
  const handleDataFieldChange = (e) => {
    const newField = e.target.value;
    setEditedFields((prev) => ({
      ...prev,
      [columnId]: newField,
    }));
  };

  const handleDataFieldUpdate = () => {
    const newField =
      editedFields[columnId] || dynamicColumnProperties[columnId];
    updateColumn(columnId, editedHeaders[columnId] || columnId, newField);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={styles.editBlock}
    >
      <div style={styles.editBlockHeaderContainer}>
        {/* Editable Header */}
        <EditableHeader
          columnId={columnId}
          editedHeaders={editedHeaders}
          setEditedHeaders={setEditedHeaders}
        />
      </div>
      <div style={styles.inlineButtonGroup}>
        {/* Inline Buttons for Header Editing */}
        <button
          onClick={() => {
            handleDataFieldUpdate();
          }}
          style={styles.inlineButton}
        >
          Update
        </button>
        <button
          onClick={() => removeColumn(columnId)}
          style={styles.inlineButton}
        >
          Remove
        </button>
        <button
          onClick={() =>
            setGroupByColumns(
              isGrouped
                ? groupByColumns.filter((col) => col !== columnId)
                : [...groupByColumns, columnId]
            )
          }
          style={{
            ...styles.inlineButton,
            backgroundColor: isGrouped ? "var(--interactive-normal)" : undefined,
          }}
        >
          {isGrouped ? "Ungroup" : "Group By"}
        </button>
      </div>
      {/* Group Order and Sort Controls */}
      {isGrouped && (
        <div style={styles.groupOrderControls}>
          <span style={styles.groupOrderLabel}>Group Order: {groupIndex}</span>
          <button
            onClick={() =>
              setGroupByColumns((prev) => {
                const idx = prev.indexOf(columnId);
                if (idx > 0) {
                  const newGroup = [...prev];
                  [newGroup[idx - 1], newGroup[idx]] = [
                    newGroup[idx],
                    newGroup[idx - 1],
                  ];
                  return newGroup;
                }
                return prev;
              })
            }
            disabled={groupByColumns.indexOf(columnId) === 0}
            style={styles.buttonSmall}
          >
            ↑
          </button>
          <button
            onClick={() =>
              setGroupByColumns((prev) => {
                const idx = prev.indexOf(columnId);
                if (idx < prev.length - 1) {
                  const newGroup = [...prev];
                  [newGroup[idx], newGroup[idx + 1]] = [
                    newGroup[idx + 1],
                    newGroup[idx],
                  ];
                  return newGroup;
                }
                return prev;
              })
            }
            disabled={
              groupByColumns.indexOf(columnId) === groupByColumns.length - 1
            }
            style={styles.buttonSmall}
          >
            ↓
          </button>
          {/* Sort Toggle Button */}
          <button onClick={toggleSortOrder} style={styles.buttonSmall}>
            {sortOrder === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
      )}
      {/* Editable Data Field */}
      <div style={styles.dataFieldContainer}>
        <dc.Textbox
          value={editedFields[columnId] || dynamicColumnProperties[columnId]}
          onChange={handleDataFieldChange}
          placeholder="Data Field..."
          style={styles.dataFieldTextbox}
          onBlur={handleDataFieldUpdate}
          autoFocus={false}
        />
      </div>
    </div>
  );
}

function AddColumn({
  newHeaderLabel,
  setNewHeaderLabel,
  newFieldLabel,
  setNewFieldLabel,
  addNewColumn,
}) {
  return (
    <div style={styles.addColumnContainer}>
      <div style={styles.editBlock}>
        <div style={styles.editBlockHeaderContainer}>
          <label style={styles.editBlockHeader}>Add New Column</label>
        </div>
        <div style={styles.addColumnInputs}>
          <dc.Textbox
            value={newHeaderLabel}
            onChange={(e) => setNewHeaderLabel(e.target.value)}
            placeholder="New Header Label"
            style={styles.addColumnTextbox}
          />
          <dc.Textbox
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            placeholder="New Data Field"
            style={styles.addColumnTextbox}
          />
        </div>
        {/* Centered Add Column Button */}
        <div style={styles.addColumnButtonContainer}>
          <button onClick={addNewColumn} style={styles.centeredAddButton}>
            Add Column
          </button>
        </div>
      </div>
    </div>
  );
}

function PaginationSettings({
  isEnabled,
  setIsEnabled,
  itemsPerPage,
  setItemsPerPage,
}) {
  return (
    <div style={styles.paginationSettingsContainer}>
      <div style={styles.paginationMain}>
        <div style={styles.paginationLeft}>
          <label style={styles.paginationTitle}>Pagination:</label>
          <dc.Checkbox
            label="Enable"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            style={{ marginLeft: "10px" }} // Space between label and checkbox
          />
        </div>
        {isEnabled && (
          <div style={styles.paginationRight}>
            <label style={styles.paginationLabel}>Items per Page:</label>
            <dc.Textbox
              type="number"
              min="1"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={styles.paginationTextbox}
              placeholder="10"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DataTable({
  columnsToShow,
  dynamicColumnProperties,
  data,
  groupByColumns,
  groupSortOrders,
  onUpdateEntry,
  onDeleteEntry,
}) {
  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableHeader}>
        {columnsToShow.map((col) => (
          <div key={col} style={styles.tableHeaderCell}>
            {col}
          </div>
        ))}
        {/* Add actions column */}
        <div style={styles.tableHeaderCell}>Actions</div>
      </div>
      <div style={styles.tableContent}>
        {data.length > 0 ? (
          <RenderRows
            data={data}
            columnsToShow={columnsToShow}
            dynamicColumnProperties={dynamicColumnProperties}
            groupByColumns={groupByColumns}
            groupSortOrders={groupSortOrders}
            onUpdateEntry={onUpdateEntry}
            onDeleteEntry={onDeleteEntry}
          />
        ) : (
          <div style={styles.noData}>No data to display.</div>
        )}
      </div>
    </div>
  );
}

function RenderRows({
  data,
  columnsToShow,
  dynamicColumnProperties,
  groupByColumns,
  groupSortOrders,
  onUpdateEntry,
  onDeleteEntry,
  groupLevel = 0,
}) {
  if (groupByColumns.length === 0) {
    return data.map((entry, idx) => (
      <div key={idx} style={styles.tableRow}>
        {columnsToShow.map((columnId) => {
          const property = dynamicColumnProperties[columnId];
          return (
            <div key={columnId} style={styles.tableCell}>
              {property === "name.obsidian" ? (
                <DraggableLink
                  entry={entry}
                  title={getProperty(entry, property)}
                />
              ) : (
                <EditableCell
                  entry={entry}
                  property={property}
                  onUpdate={onUpdateEntry}
                />
              )}
            </div>
          );
        })}
        {/* Add actions cell */}
        <div style={styles.tableCell}>
          <dc.Button
            onClick={() => onDeleteEntry(entry)}
            style={styles.deleteButton}
          >
            Delete
          </dc.Button>
        </div>
      </div>
    ));
  } else {
    const groupKey = groupByColumns[0];
    const property = dynamicColumnProperties[groupKey];
    const sortOrder = groupSortOrders[groupKey] || "asc";
    const groups = {};

    data.forEach((entry) => {
      const key = getProperty(entry, property) || "Uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a < b) return sortOrder === "asc" ? -1 : 1;
      if (a > b) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sortedKeys.map((key, idx) => (
      <div key={idx}>
        <div
          style={{
            ...styles.groupHeader,
            paddingLeft: `${groupLevel * 20}px`,
          }}
        >
          {key}
        </div>
        <RenderRows
          data={groups[key]}
          columnsToShow={columnsToShow}
          dynamicColumnProperties={dynamicColumnProperties}
          groupByColumns={groupByColumns.slice(1)}
          groupSortOrders={groupSortOrders}
          onUpdateEntry={onUpdateEntry}
          onDeleteEntry={onDeleteEntry}
          groupLevel={groupLevel + 1}
        />
      </div>
    ));
  }
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageInput,
  setPageInput,
  totalEntries,
}) {
  return (
    <div style={styles.pagination}>
      {totalPages > 1 ? (
        <div style={styles.paginationControls}>
          <dc.Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={styles.button}
          >
            Previous
          </dc.Button>
          <span style={styles.paginationText}>
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
                if (!isNaN(pageNumber)) onPageChange(pageNumber);
              }
            }}
            style={styles.paginationTextbox}
          />
          <dc.Button
            onClick={() => {
              const pageNumber = parseInt(pageInput, 10);
              if (!isNaN(pageNumber)) onPageChange(pageNumber);
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
///                   Styles                     ///
////////////////////////////////////////////////////

const styles = {
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    height: "100%", // Ensure it takes full height
  },
  header: {
    padding: "10px",
    backgroundColor: "var(--background-primary)",
  },
  headerTitle: {
    margin: 0,
    paddingBottom: "10px",
  },
  controlGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  textbox: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "200px",
    boxSizing: "border-box",
  },
  headerTextbox: {
    padding: "4px 6px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    width: "100%",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  button: {
    padding: "8px 12px",
    backgroundColor: "var(--interactive-accent)", // Match other buttons
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    flex: "1", // Allow buttons to grow equally
    textAlign: "center",
    fontWeight: "bold",
  },
  addNewFileButton: {
    padding: "8px 12px",
    backgroundColor: "grey", // Match other buttons
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    flex: "1", // Allow buttons to grow equally
    textAlign: "center",
    fontWeight: "bold",
  },
  deleteButton: {
    padding: "6px 10px",
    backgroundColor: "grey", // Match other buttons
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%", // Ensure it takes full width within cell
    fontWeight: "bold",
  },
  buttonSmall: {
    padding: "4px 6px",
    backgroundColor: "var(--interactive-accent)", // Match other buttons
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
    flex: "0 0 auto",
  },
  editBlock: {
    flex: "0 0 auto",
    padding: "10px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "10px",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    borderRadius: "8px",
    cursor: "grab",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "250px", // Ensure minimum width
  },
  editBlockHeaderContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editBlockHeader: {
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  editBlockSubheader: {
    color: "var(--text-faint)",
    fontSize: "12px",
    marginBottom: "3px",
  },
  editingContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    padding: "5px",
    overflowX: "auto",
  },
  inlineButtonGroup: {
    display: "flex",
    flexDirection: "row",
    gap: "5px",
    alignItems: "center",
    flexWrap: "wrap",
    width: "100%", // Take full available width
  },
  inlinePagination: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "10px",
    marginTop: "5px",
  },
  inlineButton: {
    flex: "1", // Take equal space
    padding: "6px 10px",
    backgroundColor: "var(--interactive-accent)", // Match other buttons
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    textAlign: "center",
    fontWeight: "bold",
  },
  addColumnContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  },
  addColumnInputs: {
    display: "flex",
    flexDirection: "column", // Changed from "row" to "column"
    gap: "10px",
    width: "100%",
  },
  addColumnTextbox: {
    flex: "1",
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    boxSizing: "border-box",
  },
  addColumnButtonContainer: {
    display: "flex",
    justifyContent: "center", // Changed from "flex-end" to "center"
    marginTop: "10px",
  },
  centeredAddButton: {
    padding: "8px 16px",
    backgroundColor: "var(--interactive-accent)", // Match other buttons
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    flex: "0 0 auto",
    fontWeight: "bold",
  },
  groupOrderControls: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    flexWrap: "wrap",
    marginTop: "5px",
  },
  groupOrderLabel: {
    fontSize: "12px",
    color: "var(--text-faint)",
  },
  select: {
    padding: "4px",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "3px",
  },
  paginationTitle: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  paginationLabel: {
    fontSize: "14px",
    color: "var(--text-normal)",
  },
  paginationTextbox: {
    width: "60px",
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    boxSizing: "border-box",
  },
  paginationSettingsContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%", // Ensure it takes full width
  },
  paginationMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "nowrap",
    width: "100%",
  },
  paginationLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  paginationRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  tableAndPaginationContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  tableContainer: {
    flex: 1,
    overflowY: "auto",
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
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  tableContent: {
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
  tableCellContent: {
    cursor: "pointer",
  },
  cellTextbox: {
    width: "100%",
    padding: "5px",
    boxSizing: "border-box",
  },
  groupHeader: {
    padding: "10px",
    backgroundColor: "var(--background-secondary)",
    fontWeight: "bold",
    borderBottom: "1px solid var(--background-modifier-border)",
    position: "sticky",
    top: 0,
    zIndex: 1,
    flex: "1 0 100%", // Ensures full-width span
  },
  noData: {
    padding: "20px",
    textAlign: "center",
  },
  pagination: {
    backgroundColor: "var(--background-primary)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "10px",
    gap: "10px",
    borderTop: "1px solid var(--background-modifier-border)",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  paginationText: {
    margin: "0 10px",
    verticalAlign: "middle",
  },
  draggableLink: {
    cursor: "pointer",
    textDecoration: "underline",
    color: "var(--interactive-accent)", // Match other links
  },
  dataFieldContainer: {
    marginTop: "10px",
  },
  dataFieldTextbox: {
    width: "100%",
    padding: "5px",
    boxSizing: "border-box",
  },
};

////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////

function View({ initialSettingsOverride = {}, app }) {
  // **IMPORTANT:** Ensure that the `app` instance is passed as a prop to the View component.

  // Merge default settings with the override
  const mergedSettings = useMemo(() => {
    return {
      ...initialSettings, // Default settings
      ...initialSettingsOverride, // Override settings
      // Deep merge specific nested settings like pagination and placeholders
      pagination: {
        ...initialSettings.pagination,
        ...initialSettingsOverride.pagination,
      },
      placeholders: {
        ...initialSettings.placeholders,
        ...initialSettingsOverride.placeholders,
      },
      dynamicColumnProperties: initialSettingsOverride.dynamicColumnProperties
        ? { ...initialSettingsOverride.dynamicColumnProperties }
        : { ...initialSettings.dynamicColumnProperties },
      vaultName: initialSettingsOverride.vaultName
        ? initialSettingsOverride.vaultName
        : initialSettings.vaultName,
      quickAddCommandId: initialSettingsOverride.quickAddCommandId
        ? initialSettingsOverride.quickAddCommandId
        : initialSettings.quickAddCommandId,
    };
  }, [initialSettingsOverride]);

  // Initialize states
  const [nameFilter, setNameFilter] = useState(
    mergedSettings.initialNameFilter || ""
  );
  const [queryPath, setQueryPath] = useState(mergedSettings.queryPath);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHeaders, setEditedHeaders] = useState({});
  const [editedFields, setEditedFields] = useState({});
  const [newHeaderLabel, setNewHeaderLabel] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [isPaginationEnabled, setIsPaginationEnabled] = useState(
    mergedSettings.pagination.isEnabled
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    mergedSettings.pagination.itemsPerPage
  );
  const [groupByColumns, setGroupByColumns] = useState(
    mergedSettings.groupByColumns
  );
  const [groupSortOrders, setGroupSortOrders] = useState({});
  const [dynamicColumnProperties, setDynamicColumnProperties] = useState(
    mergedSettings.dynamicColumnProperties
  );
  const [columnsToShow, setColumnsToShow] = useState(
    Object.keys(mergedSettings.dynamicColumnProperties)
  );

  // Sync columnsToShow with dynamicColumnProperties
  useEffect(() => {
    setColumnsToShow(Object.keys(dynamicColumnProperties));
  }, [dynamicColumnProperties]);

  // Debugging: Log when dynamicColumnProperties changes
  useEffect(() => {
    console.log("dynamicColumnProperties updated:", dynamicColumnProperties);
  }, [dynamicColumnProperties]);

  // Debugging: Log when columnsToShow changes
  useEffect(() => {
    console.log("columnsToShow updated:", columnsToShow);
  }, [columnsToShow]);

  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  const filteredData = useMemo(() => {
    return qdata.filter((entry) => {
      const entryName = getProperty(entry, "name.obsidian").toLowerCase();
      const nameMatch = entryName.includes(nameFilter.toLowerCase());

      const title = getProperty(entry, "name.obsidian");
      const isUnnamed = title === "Unnamed";

      // Check if at least one column has data
      const hasData = Object.keys(dynamicColumnProperties).some((header) => {
        const property = dynamicColumnProperties[header];
        const value = getProperty(entry, property);
        return value !== "No Data";
      });

      return nameMatch && !isUnnamed && hasData;
    });
  }, [qdata, nameFilter, dynamicColumnProperties]);

  const groupedData = useMemo(() => {
    const flattenData = (data, groupKeys, level = 0) => {
      if (groupKeys.length === 0) return data;
      const groupKey = groupKeys[0];
      const property = dynamicColumnProperties[groupKey];
      const sortOrder = groupSortOrders[groupKey] || "asc";
      const groups = {};
      data.forEach((entry) => {
        const key = getProperty(entry, property) || "Uncategorized";
        if (!groups[key]) groups[key] = [];
        groups[key].push(entry);
      });
      const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a < b) return sortOrder === "asc" ? -1 : 1;
        if (a > b) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
      let result = [];
      sortedKeys.forEach((key) => {
        result.push({ type: "group", level, key });
        result = result.concat(
          flattenData(groups[key], groupKeys.slice(1), level + 1)
        );
      });
      return result;
    };
    return flattenData(filteredData, groupByColumns);
  }, [filteredData, groupByColumns, dynamicColumnProperties, groupSortOrders]);

  const paginatedData = useMemo(() => {
    if (isPaginationEnabled) {
      const start = (currentPage - 1) * itemsPerPage;
      const end = currentPage * itemsPerPage;
      return groupedData.slice(start, end);
    } else {
      return groupedData;
    }
  }, [groupedData, currentPage, itemsPerPage, isPaginationEnabled]);

  const totalPages = useMemo(() => {
    if (isPaginationEnabled) {
      const totalEntries = groupedData.filter((item) => item.type !== "group")
        .length;
      return Math.ceil(totalEntries / itemsPerPage);
    } else {
      return 1;
    }
  }, [groupedData, itemsPerPage, isPaginationEnabled]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setPageInput("");
    } else {
      alert("Invalid page number.");
    }
  };

  const addNewColumn = () => {
    if (!newHeaderLabel || !newFieldLabel) {
      alert("Please provide both a new header label and a data field.");
      return;
    }
    // Check for duplicate headers
    if (columnsToShow.includes(newHeaderLabel)) {
      alert("Header label already exists. Please choose a different name.");
      return;
    }
    const updatedColumns = {
      ...dynamicColumnProperties,
      [newHeaderLabel]: newFieldLabel,
    };
    setDynamicColumnProperties(updatedColumns);
    setColumnsToShow([...columnsToShow, newHeaderLabel]);
    setNewHeaderLabel("");
    setNewFieldLabel("");
  };

  // Centralized updateColumn function
  const updateColumn = (columnId, newHeader, newField) => {
    // If the header name has changed, ensure the new header is unique
    if (newHeader !== columnId && columnsToShow.includes(newHeader)) {
      alert(
        `Header "${newHeader}" already exists. Please choose a different name.`
      );
      // Revert the header change
      setEditedHeaders((prev) => ({
        ...prev,
        [columnId]: columnId,
      }));
      return;
    }

    // Update dynamicColumnProperties
    setDynamicColumnProperties((prev) => {
      const updated = { ...prev };
      delete updated[columnId];
      updated[newHeader] = newField;
      return updated;
    });

    // Update columnsToShow
    setColumnsToShow((prev) =>
      prev.map((col) => (col === columnId ? newHeader : col))
    );

    // Update groupByColumns if necessary
    setGroupByColumns((prev) =>
      prev.map((col) => (col === columnId ? newHeader : col))
    );

    // Clean up editedHeaders and editedFields
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

    console.log(
      `Column "${columnId}" updated to "${newHeader}" with field "${newField}"`
    );
  };

  const removeColumn = (columnId) => {
    const confirmDelete = confirm(
      `Are you sure you want to remove "${columnId}"?`
    );
    if (!confirmDelete) return;

    const updatedColumns = { ...dynamicColumnProperties };
    delete updatedColumns[columnId];
    setDynamicColumnProperties(updatedColumns);
    setColumnsToShow(columnsToShow.filter((col) => col !== columnId));
    setGroupByColumns(groupByColumns.filter((col) => col !== columnId));

    // Clean up editedHeaders and editedFields if any
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

    console.log(`Column "${columnId}" has been removed.`);
  };

  const onUpdateEntry = (entry, property, newValue) => {
    // Implement actual update logic here
    console.log(`Updating ${entry.$name}: Set ${property} to ${newValue}`);
  };

  const onDeleteEntry = (entry) => {
    if (!mergedSettings.vaultName) {
      alert("Vault name is not specified.");
      return;
    }

    if (!entry.$path) {
      alert("File path is not specified.");
      return;
    }

    const file = app.vault.getAbstractFileByPath(entry.$path);
    if (!file) {
      alert(`File "${entry.$path}" not found.`);
      return;
    }

    // Confirm deletion
    const confirmDelete = confirm(
      `Are you sure you want to delete "${entry.$name}"? This will move it to the trash.`
    );
    if (!confirmDelete) return;

    // Move the file to trash
    app.vault.trash(file).then(() => {
      alert(`File "${entry.$name}" has been moved to trash.`);
      console.log(`File "${entry.$path}" has been moved to trash.`);
    }).catch((error) => {
      alert(`Failed to delete file "${entry.$name}": ${error.message}`);
      console.error(`Failed to delete file "${entry.$path}":`, error);
    });
  };

  const handleAddNewFile = () => {
    if (!mergedSettings.quickAddCommandId) {
      alert("QuickAdd command ID is not specified.");
      return;
    }

    // Execute the QuickAdd command
    app.commands.executeCommandById(mergedSettings.quickAddCommandId);
  };

  const totalEntries = groupedData.filter((item) => item.type !== "group")
    .length;

  // Optional: Validation for dynamicColumnProperties
  useEffect(() => {
    const requiredKeys = [
      "Dish", // Updated from "Recipes"
      "Source",
      "Genre",
      "Tags",
      "Ingredients",
      "Creation Date",
    ];
    requiredKeys.forEach((key) => {
      if (!dynamicColumnProperties[key]) {
        console.warn(`Missing key "${key}" in dynamicColumnProperties.`);
      }
    });
  }, [dynamicColumnProperties]);

  return (
    <dc.Stack
      style={{ ...styles.mainContainer, height: mergedSettings.viewHeight }}
    >
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          {mergedSettings.placeholders.headerTitle}
        </h1>
        <dc.Group style={styles.controlGroup}>
          <dc.Textbox
            type="search"
            placeholder={mergedSettings.placeholders.nameFilter}
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.textbox}
          />
          <dc.Textbox
            value={queryPath}
            placeholder={mergedSettings.placeholders.queryPath}
            onChange={(e) => {
              setQueryPath(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.textbox}
          />
          <dc.Button
            onClick={() => setIsEditing(!isEditing)}
            style={styles.button}
          >
            {isEditing ? "Finish Editing" : "Edit"}
          </dc.Button>
          {/* Add New File Button */}
          <dc.Button
            onClick={handleAddNewFile}
            style={styles.addNewFileButton}
          >
            Add New File
          </dc.Button>
        </dc.Group>
        {isEditing && (
          <dc.Group style={styles.controlGroup}>
            <PaginationSettings
              isEnabled={isPaginationEnabled}
              setIsEnabled={setIsPaginationEnabled}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
            />
          </dc.Group>
        )}
        {isEditing && (
          <div style={styles.editingContainer}>
            {columnsToShow.map((columnId, index) => (
              <EditColumnBlock
                key={columnId}
                columnId={columnId}
                index={index}
                columnsToShow={columnsToShow}
                setColumnsToShow={setColumnsToShow}
                editedHeaders={editedHeaders}
                setEditedHeaders={setEditedHeaders}
                editedFields={editedFields}
                setEditedFields={setEditedFields}
                updateColumn={updateColumn} // Pass centralized update function
                removeColumn={removeColumn}
                dynamicColumnProperties={dynamicColumnProperties}
                groupByColumns={groupByColumns}
                setGroupByColumns={setGroupByColumns}
                groupSortOrders={groupSortOrders}
                setGroupSortOrders={setGroupSortOrders}
              />
            ))}
            <AddColumn
              newHeaderLabel={newHeaderLabel}
              setNewHeaderLabel={setNewHeaderLabel}
              newFieldLabel={newFieldLabel}
              setNewFieldLabel={setNewFieldLabel}
              addNewColumn={addNewColumn}
            />
          </div>
        )}
      </div>

      <div style={styles.tableAndPaginationContainer}>
        <DataTable
          columnsToShow={columnsToShow}
          dynamicColumnProperties={dynamicColumnProperties}
          data={paginatedData}
          groupByColumns={groupByColumns}
          groupSortOrders={groupSortOrders}
          onUpdateEntry={onUpdateEntry}
          onDeleteEntry={onDeleteEntry}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageInput={pageInput}
          setPageInput={setPageInput}
          totalEntries={totalEntries}
        />
      </div>
    </dc.Stack>
  );
}

////////////////////////////////////////////////////
///             Exporting the Viewer Component    ///
////////////////////////////////////////////////////

// **REMOVED:** Export statement to prevent syntax errors
return { View };
```