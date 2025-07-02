---
aliases:
  - datacore.flexilis.component.v01
---

#### MODIFY TO YOUR OWN DESIRE 
	do proceed at your own risk.
		[recommend using either Open AI o1-mini or o1-preview]
			found to be best at helping you build these datacore views. 
				do all of it is [WIP]
					hehe

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  vaultName: "OBSIDIAN VAULT", // **IMPORTANT:** Replace with your actual vault name
  queryPath: "COOKBOOK/RECIPES/ALL",
  initialNameFilter: "",
  // Changed from dynamicColumnProperties to dynamicColumns (array)
  dynamicColumns: [
    { header: "Book", property: "name.obsidian" }, // Changed header from 'Dish' to 'Book'
    { header: "Source", property: "source" },
    { header: "Genre", property: "genre" },
    { header: "Tags", property: "tags" },
    { header: "Ingredients", property: "ingredients" },
    { header: "Creation Date", property: "ctime.obsidian" },
  ],
  groupByColumns: [], // Default: no grouping
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
  quickAddCommandId: "quickadd:add_recipe", // **NEW:** QuickAdd command ID
};

////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

const { useState, useMemo, useEffect } = dc; // Assuming 'dc' is the Dataview context

function getProperty(entry, property) {
  if (!property) {
    return "No Data";
  }

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

function updateFrontmatter(content, property, newValue) {
  // Implement the logic to update the frontmatter of the note
  // This is a placeholder function and needs to be implemented according to your needs
  // For example, you might use a YAML parser to modify the frontmatter
  // Here's a simple implementation using regex (Note: This is simplistic and may need enhancement)
  const regex = new RegExp(`(${property}: ).*`, "i");
  if (regex.test(content)) {
    return content.replace(regex, `$1${newValue}`);
  } else {
    // If the property doesn't exist, add it
    const yamlEnd = content.indexOf("---", 3); // Assuming frontmatter starts at the beginning
    if (yamlEnd !== -1) {
      return (
        content.slice(0, yamlEnd) +
        `${property}: ${newValue}\n` +
        content.slice(yamlEnd)
      );
    } else {
      // If no frontmatter, add it
      return `---\n${property}: ${newValue}\n---\n${content}`;
    }
  }
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
    if (value !== getProperty(entry, property)) {
      onUpdate(entry, property, value);
    }
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

function EditableHeader({ index, columns, setColumns }) {
  const [isEditing, setIsEditing] = useState(false);
  const [headerValue, setHeaderValue] = useState(columns[index].header);

  const handleBlur = () => {
    const trimmedValue = headerValue.trim();
    if (trimmedValue === "") {
      alert("Header name cannot be empty.");
      setHeaderValue(columns[index].header);
    } else {
      setIsEditing(false);
      // Update the header in columns
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        newColumns[index] = {
          ...newColumns[index],
          header: trimmedValue,
        };
        return newColumns;
      });
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
      {columns[index].header}
    </label>
  );
}

function EditColumnBlock(props) {
  const {
    index,
    columns,
    setColumns,
    groupByColumns,
    setGroupByColumns,
  } = props;

  const column = columns[index];
  const columnId = column.header;

  const isGrouped = groupByColumns.some((group) => group.column === columnId);
  const groupConfig = groupByColumns.find((group) => group.column === columnId);
  const groupIndex = groupByColumns.findIndex(
    (group) => group.column === columnId
  );
  const sortOrder = groupConfig?.order || "asc";

  const handleDragStart = (e) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDrop = (e) => {
    const dragIndex = e.dataTransfer.getData("dragIndex");
    if (dragIndex === "") return; // Prevent errors if dragIndex is not set
    const parsedDragIndex = parseInt(dragIndex, 10);
    if (isNaN(parsedDragIndex)) return;
    if (parsedDragIndex === index) return; // No need to reorder if same index
    const newColumns = [...columns];
    const draggedColumn = newColumns[parsedDragIndex];
    newColumns.splice(parsedDragIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    setColumns(newColumns);
  };

  // Toggle Sort Order between 'asc' and 'desc'
  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setGroupByColumns((prev) =>
      prev.map((group) =>
        group.column === columnId ? { ...group, order: newSortOrder } : group
      )
    );
  };

  // Handle Data Field Editing
  const [editedField, setEditedField] = useState(column.property);

  const handleDataFieldChange = (e) => {
    setEditedField(e.target.value);
  };

  const handleDataFieldUpdate = () => {
    // Update the property in columns
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      newColumns[index] = {
        ...newColumns[index],
        property: editedField,
      };
      return newColumns;
    });
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
          index={index}
          columns={columns}
          setColumns={setColumns}
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
          onClick={() => {
            // Remove column
            setColumns((prevColumns) => {
              const newColumns = [...prevColumns];
              newColumns.splice(index, 1);
              return newColumns;
            });
            // Remove from groupByColumns if necessary
            setGroupByColumns((prev) =>
              prev.filter((group) => group.column !== columnId)
            );
          }}
          style={styles.inlineButton}
        >
          Remove
        </button>
        <button
          onClick={() => {
            if (isGrouped) {
              setGroupByColumns(
                groupByColumns.filter((group) => group.column !== columnId)
              );
            } else {
              setGroupByColumns([
                ...groupByColumns,
                { column: columnId, order: "asc" },
              ]);
            }
          }}
          style={{
            ...styles.inlineButton,
            backgroundColor: isGrouped
              ? "var(--interactive-normal)"
              : undefined,
          }}
        >
          {isGrouped ? "Ungroup" : "Group By"}
        </button>
      </div>
      {/* Group Order and Sort Controls */}
      {isGrouped && (
        <div style={styles.groupOrderControls}>
          <span style={styles.groupOrderLabel}>
            Group Order: {groupIndex + 1}
          </span>
          <button
            onClick={() =>
              setGroupByColumns((prev) => {
                const idx = prev.findIndex(
                  (group) => group.column === columnId
                );
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
            disabled={groupIndex === 0}
            style={styles.buttonSmall}
            title="Move Group Up"
          >
            ↑
          </button>
          <button
            onClick={() =>
              setGroupByColumns((prev) => {
                const idx = prev.findIndex(
                  (group) => group.column === columnId
                );
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
            disabled={groupIndex === groupByColumns.length - 1}
            style={styles.buttonSmall}
            title="Move Group Down"
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
          value={editedField}
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
  columns,
  data,
  onUpdateEntry,
  onDeleteEntry,
}) {
  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableHeader}>
        {columns.map((col) => (
          <div key={col.header} style={styles.tableHeaderCell}>
            {col.header}
          </div>
        ))}
        {/* Add actions column */}
        <div style={styles.tableHeaderCell}>Actions</div>
      </div>
      <div style={styles.tableContent}>
        {data.length > 0 ? (
          <RenderRows
            data={data}
            columns={columns}
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
  columns,
  onUpdateEntry,
  onDeleteEntry,
}) {
  return data.map((item, idx) => {
    if (item.type === "group") {
      return (
        <div key={`group-${idx}`}>
          <div
            style={{
              ...styles.groupHeader,
              paddingLeft: `${item.level * 20}px`,
            }}
          >
            {item.key}
          </div>
          {/* Recursively render children */}
          <RenderRows
            data={item.children}
            columns={columns}
            onUpdateEntry={onUpdateEntry}
            onDeleteEntry={onDeleteEntry}
          />
        </div>
      );
    } else if (item.type === "data") {
      const entry = item.entry;
      return (
        <div key={entry.$path || idx} style={styles.tableRow}>
          {columns.map((col) => {
            const { header, property } = col;
            return (
              <div key={header} style={styles.tableCell}>
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
      );
    } else {
      return null; // Handle unexpected item types gracefully
    }
  });
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
  // Merge default settings with the override
  const mergedSettings = useMemo(() => {
    return {
      ...initialSettings,
      ...initialSettingsOverride,
      pagination: {
        ...initialSettings.pagination,
        ...initialSettingsOverride.pagination,
      },
      placeholders: {
        ...initialSettings.placeholders,
        ...initialSettingsOverride.placeholders,
      },
      dynamicColumns:
        initialSettingsOverride.dynamicColumns ||
        initialSettings.dynamicColumns,
      groupByColumns: Array.isArray(initialSettingsOverride.groupByColumns)
        ? initialSettingsOverride.groupByColumns
        : initialSettings.groupByColumns,
      quickAddCommandId:
        initialSettingsOverride.quickAddCommandId ||
        initialSettings.quickAddCommandId,
    };
  }, [initialSettingsOverride]);

  // Initialize states
  const [nameFilter, setNameFilter] = useState(
    mergedSettings.initialNameFilter || ""
  );
  const [queryPath, setQueryPath] = useState(mergedSettings.queryPath);
  const [isEditing, setIsEditing] = useState(false);
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
    Array.isArray(mergedSettings.groupByColumns)
      ? mergedSettings.groupByColumns.filter(
          (groupConfig) =>
            groupConfig &&
            typeof groupConfig === "object" &&
            groupConfig.column
        )
      : []
  );
  const [columns, setColumns] = useState(mergedSettings.dynamicColumns);

  // Handle group sort orders
  const [groupSortOrders, setGroupSortOrders] = useState(
    mergedSettings.groupByColumns.reduce((acc, group) => {
      acc[group.column] = group.order || "asc";
      return acc;
    }, {})
  );

  // Update groupSortOrders when groupByColumns change
  useEffect(() => {
    setGroupSortOrders(
      groupByColumns.reduce((acc, group) => {
        acc[group.column] = group.order || "asc";
        return acc;
      }, {})
    );
  }, [groupByColumns]);

  // Fetch data using Dataview's query
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering
  const filteredData = useMemo(() => {
    return qdata.filter((entry) => {
      const entryName = getProperty(entry, "name.obsidian").toLowerCase();
      const nameMatch = entryName.includes(nameFilter.toLowerCase());

      const title = getProperty(entry, "name.obsidian");
      const isUnnamed = title === "Unnamed";

      // Check if at least one column has data
      const hasData = columns.some((col) => {
        const value = getProperty(entry, col.property);
        return value !== "No Data";
      });

      return nameMatch && !isUnnamed && hasData;
    });
  }, [qdata, nameFilter, columns]);

  // Pagination logic based on data items
  const paginatedData = useMemo(() => {
    if (isPaginationEnabled) {
      const start = (currentPage - 1) * itemsPerPage;
      const end = currentPage * itemsPerPage;
      return filteredData.slice(start, end);
    } else {
      return filteredData;
    }
  }, [filteredData, currentPage, itemsPerPage, isPaginationEnabled]);

  // Grouping logic on paginated data (supports multi-level grouping)
  const groupedData = useMemo(() => {
    if (groupByColumns.length === 0) {
      // No grouping, return data as is
      return paginatedData.map((entry) => ({ type: "data", entry }));
    }

    const groupData = (data, groupConfigs, level = 0) => {
      if (!Array.isArray(groupConfigs) || groupConfigs.length === 0) {
        return data.map((entry) => ({ type: "data", entry }));
      }

      const groupConfig = groupConfigs[0];
      const { column: groupKey, order: sortOrder } = groupConfig;
      const column = columns.find((col) => col.header === groupKey);
      if (!column) {
        throw new Error(`Column "${groupKey}" not found in columns.`);
      }
      const property = column.property;

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
        const children = groupData(groups[key], groupConfigs.slice(1), level + 1);
        result.push({ type: "group", level, key, children });
      });
      return result;
    };

    const grouped = groupData(paginatedData, groupByColumns);
    return grouped;
  }, [paginatedData, groupByColumns, columns]);

  // Calculate total pages based on filtered data
  const totalPages = useMemo(() => {
    if (isPaginationEnabled) {
      const totalEntries = filteredData.length;
      return Math.ceil(totalEntries / itemsPerPage);
    } else {
      return 1;
    }
  }, [filteredData, itemsPerPage, isPaginationEnabled]);

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
    if (columns.some((col) => col.header === newHeaderLabel)) {
      alert("Header label already exists. Please choose a different name.");
      return;
    }
    const updatedColumns = [
      ...columns,
      { header: newHeaderLabel, property: newFieldLabel },
    ];
    setColumns(updatedColumns);
    setNewHeaderLabel("");
    setNewFieldLabel("");
  };

  const onUpdateEntry = (entry, property, newValue) => {
    // Implement actual update logic here
    console.log(`Updating ${entry.$name}: Set ${property} to ${newValue}`);
    // Example: Update the frontmatter of the note
    const file = app.vault.getAbstractFileByPath(entry.$path);
    if (file && file instanceof TFile) {
      app.vault.read(file).then((content) => {
        const updatedContent = updateFrontmatter(content, property, newValue);
        app.vault.modify(file, updatedContent);
      });
    }
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
    app.vault
      .trash(file)
      .then(() => {
        alert(`File "${entry.$name}" has been moved to trash.`);
        console.log(`File "${entry.$path}" has been moved to trash.`);
      })
      .catch((error) => {
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

  const totalEntries = filteredData.length;

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
            {columns.map((col, index) => (
              <EditColumnBlock
                key={col.header}
                index={index}
                columns={columns}
                setColumns={setColumns}
                groupByColumns={groupByColumns}
                setGroupByColumns={setGroupByColumns}
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
          columns={columns}
          data={groupedData}
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

return { View };
```