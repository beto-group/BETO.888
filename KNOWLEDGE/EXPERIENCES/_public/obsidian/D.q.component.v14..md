



# viewer

```tsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

interface InitialSettings {
  vaultName: string;
  queryPath: string;
  initialNameFilter: string;
  dynamicColumnProperties: Record<string, string>;
  groupByColumns: string[];
  pagination: {
    isEnabled: boolean;
    itemsPerPage: number;
  };
  viewHeight: string;
  placeholders: {
    nameFilter: string;
    queryPath: string;
    headerTitle: string;
    newHeaderLabel: string;
    newDataField: string;
  };
  quickAddCommandId: string;
}

const initialSettings: InitialSettings = {
  vaultName: "YourActualVaultName", // **IMPORTANT:** Replace with your actual vault name
  queryPath: "COOKBOOK/RECIPES/ALL",
  initialNameFilter: "",
  dynamicColumnProperties: {
    Notes: "name.obsidian",
    Source: "source",
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
  quickAddCommandId: "quickadd:add_recipe", // **NEW:** QuickAdd command ID
};

////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

interface Entry {
  $ctime?: any;
  $mtime?: any;
  $name?: string;
  $path?: string;
  $frontmatter?: Record<string, any>;
  [key: string]: any;
}

const { useState, useMemo, useEffect } = dc; // Assuming 'dc' is the Datacore context

function getProperty(entry: Entry, property: string): string {
  if (property.endsWith(".obsidian")) {
    const key = property.replace(".obsidian", "");
    const obsidianProps: Record<string, string> = {
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
      Object.prototype.hasOwnProperty.call(frontmatterField, "value")
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

interface DraggableLinkProps {
  entry: Entry;
  title: string;
}

function DraggableLink({ entry, title }: DraggableLinkProps) {
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
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

interface EditableCellProps {
  entry: Entry;
  property: string;
  onUpdate: (entry: Entry, property: string, value: string) => void;
}

function EditableCell({ entry, property, onUpdate }: EditableCellProps) {
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
      onChange={(e: any) => setValue(e.target.value)}
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

interface EditableHeaderProps {
  columnId: string;
  editedHeaders: Record<string, string>;
  setEditedHeaders: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function EditableHeader({
  columnId,
  editedHeaders,
  setEditedHeaders,
}: EditableHeaderProps) {
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
      onChange={(e: any) => setHeaderValue(e.target.value)}
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

interface EditColumnBlockProps {
  columnId: string;
  index: number;
  columnsToShow: string[];
  setColumnsToShow: React.Dispatch<React.SetStateAction<string[]>>;
  editedHeaders: Record<string, string>;
  setEditedHeaders: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editedFields: Record<string, string>;
  setEditedFields: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updateColumn: (columnId: string, newHeader: string, newField: string) => void;
  removeColumn: (columnId: string) => void;
  dynamicColumnProperties: Record<string, string>;
  groupByColumns: string[];
  setGroupByColumns: React.Dispatch<React.SetStateAction<string[]>>;
  groupSortOrders: Record<string, string>;
  setGroupSortOrders: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function EditColumnBlock(props: EditColumnBlockProps) {
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
    groupSortOrders,
    setGroupSortOrders,
  } = props;

  const isGrouped = groupByColumns.includes(columnId);
  const groupIndex = groupByColumns.indexOf(columnId) + 1;
  const sortOrder = groupSortOrders[columnId] || "asc";

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("dragIndex", index.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
  const handleDataFieldChange = (e: any) => {
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

interface AddColumnProps {
  newHeaderLabel: string;
  setNewHeaderLabel: React.Dispatch<React.SetStateAction<string>>;
  newFieldLabel: string;
  setNewFieldLabel: React.Dispatch<React.SetStateAction<string>>;
  addNewColumn: () => void;
}

function AddColumn({
  newHeaderLabel,
  setNewHeaderLabel,
  newFieldLabel,
  setNewFieldLabel,
  addNewColumn,
}: AddColumnProps) {
  return (
    <div style={styles.addColumnContainer}>
      <div style={styles.editBlock}>
        <div style={styles.editBlockHeaderContainer}>
          <label style={styles.editBlockHeader}>Add New Column</label>
        </div>
        <div style={styles.addColumnInputs}>
          <dc.Textbox
            value={newHeaderLabel}
            onChange={(e: any) => setNewHeaderLabel(e.target.value)}
            placeholder="New Header Label"
            style={styles.addColumnTextbox}
          />
          <dc.Textbox
            value={newFieldLabel}
            onChange={(e: any) => setNewFieldLabel(e.target.value)}
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

interface PaginationSettingsProps {
  isEnabled: boolean;
  setIsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
}

function PaginationSettings({
  isEnabled,
  setIsEnabled,
  itemsPerPage,
  setItemsPerPage,
}: PaginationSettingsProps) {
  return (
    <div style={styles.paginationSettingsContainer}>
      <div style={styles.paginationMain}>
        <div style={styles.paginationLeft}>
          <label style={styles.paginationTitle}>Pagination:</label>
          <dc.Checkbox
            label="Enable"
            checked={isEnabled}
            onChange={(e: any) => setIsEnabled(e.target.checked)}
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
              onChange={(e: any) => setItemsPerPage(Number(e.target.value))}
              style={styles.paginationTextbox}
              placeholder="10"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface DataTableProps {
  columnsToShow: string[];
  dynamicColumnProperties: Record<string, string>;
  data: any[];
  groupByColumns: string[];
  groupSortOrders: Record<string, string>;
  onUpdateEntry: (entry: Entry, property: string, newValue: string) => void;
  onDeleteEntry: (entry: Entry) => void;
}

function DataTable({
  columnsToShow,
  dynamicColumnProperties,
  data,
  groupByColumns,
  groupSortOrders,
  onUpdateEntry,
  onDeleteEntry,
}: DataTableProps) {
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

interface RenderRowsProps {
  data: any[];
  columnsToShow: string[];
  dynamicColumnProperties: Record<string, string>;
  groupByColumns: string[];
  groupSortOrders: Record<string, string>;
  onUpdateEntry: (entry: Entry, property: string, newValue: string) => void;
  onDeleteEntry: (entry: Entry) => void;
  groupLevel?: number;
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
}: RenderRowsProps) {
  if (groupByColumns.length === 0) {
    return data.map((entry: Entry, idx: number) => (
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
    const groups: Record<string, any[]> = {};

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

    return (
      <>
        {sortedKeys.map((key, idx) => (
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
        ))}
      </>
    );
  }
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
  pageInput: string;
  setPageInput: React.Dispatch<React.SetStateAction<string>>;
  totalEntries: number;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageInput,
  setPageInput,
  totalEntries,
}: PaginationProps) {
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
            onChange={(e: any) => setPageInput(e.target.value)}
            onKeyDown={(e: any) => {
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

const styles: Record<string, React.CSSProperties> = {
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
    backgroundColor: "var(--interactive-accent)",
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    flex: "1",
    textAlign: "center",
    fontWeight: "bold",
  },
  addNewFileButton: {
    padding: "8px 12px",
    backgroundColor: "grey",
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    flex: "1",
    textAlign: "center",
    fontWeight: "bold",
  },
  deleteButton: {
    padding: "6px 10px",
    backgroundColor: "grey",
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
  },
  buttonSmall: {
    padding: "4px 6px",
    backgroundColor: "var(--interactive-accent)",
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
    minWidth: "250px",
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
    flex: "1",
    padding: "6px 10px",
    backgroundColor: "var(--interactive-accent)",
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
    backgroundColor: "var(--interactive-accent)",
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

interface ViewProps {
  initialSettingsOverride?: Partial<InitialSettings>;
  app: any; // Replace 'any' with the actual type if available
}

function View({ initialSettingsOverride = {}, app }: ViewProps) {
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
  const [editedHeaders, setEditedHeaders] = useState<Record<string, string>>({});
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
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
  const [groupSortOrders, setGroupSortOrders] = useState<Record<string, string>>(
    {}
  );
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

  // Data fetching using dc.useQuery
  const qdata = dc.useQuery(`@page and path("${queryPath}")`) as Entry[];

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
    const flattenData = (
      data: Entry[],
      groupKeys: string[],
      level = 0
    ): any[] => {
      if (groupKeys.length === 0) return data;
      const groupKey = groupKeys[0];
      const property = dynamicColumnProperties[groupKey];
      const sortOrder = groupSortOrders[groupKey] || "asc";
      const groups: Record<string, Entry[]> = {};
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
      let result: any[] = [];
      sortedKeys.forEach((key) => {
        result.push({ type: "group", level, key });
        result = result.concat(
          flattenData(groups[key], groupKeys.slice(1), level + 1)
        );
      });
      return result;
    };
    return flattenData(filteredData, groupByColumns);
  }, [
    filteredData,
    groupByColumns,
    dynamicColumnProperties,
    groupSortOrders,
  ]);

  const paginatedData = useMemo(() => {
    if (isPaginationEnabled) {
      const entries = groupedData.filter((item) => item.type !== "group");
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return entries.slice(start, end);
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

  const handlePageChange = (pageNumber: number) => {
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
  const updateColumn = (columnId: string, newHeader: string, newField: string) => {
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

  const removeColumn = (columnId: string) => {
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

  const onUpdateEntry = (entry: Entry, property: string, newValue: string) => {
    // Implement actual update logic here
    console.log(`Updating ${entry.$name}: Set ${property} to ${newValue}`);
  };

  const onDeleteEntry = (entry: Entry) => {
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
      .catch((error: any) => {
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
            onChange={(e: any) => {
              setNameFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.textbox}
          />
          <dc.Textbox
            value={queryPath}
            placeholder={mergedSettings.placeholders.queryPath}
            onChange={(e: any) => {
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
                updateColumn={updateColumn}
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
///             Return the View Component        ///
////////////////////////////////////////////////////

// Return the View component without using 'export' statements
return { View };
```