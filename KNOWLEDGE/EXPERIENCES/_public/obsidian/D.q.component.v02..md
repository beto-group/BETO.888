

# InitialSettings

```jsx
// InitialSettings
const initialSettings = {
  queryPath: "COOKBOOK/RECIPES/ALL",
  initialNameFilter: "", // Added initial name filter
  dynamicColumnProperties: {
    Recipes: "name.obsidian",
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
  viewHeight: "600px", // Setting for view height
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Recipe Viewer",
  },
};

return { initialSettings };
```



# HelperFunctions

```jsx
// HelperFunctions
const { useState, useMemo, useRef } = dc;

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

return { useState, useMemo, useRef, getProperty };
```


# DraggableLink

```jsx
// DraggableLink
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

return { DraggableLink };
```


# EditableCell

```jsx
// EditableCell
function EditableCell({ entry, property, onUpdate }) {
  const { useState } = dc.HelperFunctions; // Importing useState and getProperty
  const { getProperty } = dc.HelperFunctions;

  const [value, setValue] = useState(getProperty(entry, property));
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(entry, property, value);
  };

  return isEditing ? (
    <dc.Textbox
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
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

return { EditableCell };
```



# EditColumnBlock

```jsx
// EditColumnBlock
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
    updateColumn,
    removeColumn,
    dynamicColumnProperties,
    groupByColumns,
    setGroupByColumns,
    groupSortOrders,
    setGroupSortOrders,
  } = props;

  const { DraggableLink } = dc.Components;
  const { useState, useMemo, useRef, getProperty } = dc.HelperFunctions;

  const isGrouped = groupByColumns.includes(columnId);
  const groupIndex = groupByColumns.indexOf(columnId) + 1;
  const sortOrder = groupSortOrders[columnId] || "asc";

  const handleDragStart = (e) => e.dataTransfer.setData("dragIndex", index);

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
      style={styles.editBlock}
    >
      <div style={styles.editBlockHeaderContainer}>
        <label style={styles.editBlockHeader}>
          {editedHeaders[columnId] || columnId}
        </label>
      </div>
      <>
        <label style={styles.editBlockSubheader}>Header Label:</label>
        <dc.Textbox
          value={editedHeaders[columnId] || columnId}
          onChange={(e) =>
            setEditedHeaders({ ...editedHeaders, [columnId]: e.target.value })
          }
          style={styles.textbox}
        />
        <label style={styles.editBlockSubheader}>Data Field:</label>
        <dc.Textbox
          value={editedFields[columnId] || dynamicColumnProperties[columnId]}
          onChange={(e) =>
            setEditedFields({ ...editedFields, [columnId]: e.target.value })
          }
          style={styles.textbox}
        />
        <dc.Button onClick={() => updateColumn(columnId)} style={styles.button}>
          Update
        </dc.Button>
        <dc.Button onClick={() => removeColumn(columnId)} style={styles.button}>
          Remove
        </dc.Button>
        <dc.Button
          onClick={() =>
            setGroupByColumns(
              isGrouped
                ? groupByColumns.filter((col) => col !== columnId)
                : [...groupByColumns, columnId]
            )
          }
          style={{
            ...styles.button,
            backgroundColor: isGrouped ? "var(--interactive-normal)" : undefined,
          }}
        >
          {isGrouped ? "Ungroup" : "Group By"}
        </dc.Button>
        {isGrouped && (
          <div style={styles.groupOrderControls}>
            <span style={styles.groupOrderLabel}>Group Order: {groupIndex}</span>
            <dc.Button
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
            </dc.Button>
            <dc.Button
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
              disabled={groupByColumns.indexOf(columnId) === groupByColumns.length - 1}
              style={styles.buttonSmall}
            >
              ↓
            </dc.Button>
            <label style={styles.sortOrderLabel}>Sort:</label>
            <dc.Select
              options={[
                { label: "Asc", value: "asc" },
                { label: "Desc", value: "desc" },
              ]}
              value={sortOrder}
              onChange={(e) =>
                setGroupSortOrders({
                  ...groupSortOrders,
                  [columnId]: e.target.value,
                })
              }
              style={styles.select}
            />
          </div>
        )}
      </>
    </div>
  );
}

return { EditColumnBlock };
```


# AddColumn

```jsx
// AddColumn
function AddColumn({
  newHeaderLabel,
  setNewHeaderLabel,
  newFieldLabel,
  setNewFieldLabel,
  addNewColumn,
}) {
  return (
    <div style={styles.editBlock}>
      <div style={styles.editBlockHeaderContainer}>
        <label style={styles.editBlockHeader}>Add New Column</label>
      </div>
      <>
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
      </>
    </div>
  );
}

return { AddColumn };
```


# PaginationSettings

```jsx
// PaginationSettings
function PaginationSettings({
  isEnabled,
  setIsEnabled,
  itemsPerPage,
  setItemsPerPage,
}) {
  return (
    <>
      <label style={styles.paginationTitle}>Pagination:</label>
      <dc.Checkbox
        label="Enable"
        checked={isEnabled}
        onChange={(e) => setIsEnabled(e.target.checked)}
      />
      {isEnabled && (
        <>
          <label style={styles.paginationLabel}>Items per Page:</label>
          <dc.Textbox
            type="number"
            min="1"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            style={styles.paginationTextbox}
          />
        </>
      )}
    </>
  );
}

return { PaginationSettings };
```


# DataTable

```jsx
// DataTable
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

return { DataTable };
```


# RenderRows

```jsx
// RenderRows
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
  const { DraggableLink, EditableCell } = dc.Components;
  const { getProperty } = dc.HelperFunctions;

  if (groupByColumns.length === 0) {
    return data.map((entry, idx) => (
      <div key={idx} style={styles.tableRow}>
        {columnsToShow.map((columnId) => {
          const property = dynamicColumnProperties[columnId];
          return (
            <div key={columnId} style={styles.tableCell}>
              {columnId === "Recipes" ? (
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

return { RenderRows };
```



# Pagination

```jsx
// Pagination
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

return { Pagination };
```


# DataTablePagination

```jsx
// DataTablePagination
function DataTablePagination({
  columnsToShow,
  dynamicColumnProperties,
  data,
  groupByColumns,
  groupSortOrders,
  onUpdateEntry,
  onDeleteEntry,
  isPaginationEnabled,
  currentPage,
  totalPages,
  onPageChange,
  pageInput,
  setPageInput,
  totalEntries,
}) {
  return (
    <div style={styles.tableAndPaginationContainer}>
      <DataTable
        columnsToShow={columnsToShow}
        dynamicColumnProperties={dynamicColumnProperties}
        data={data}
        groupByColumns={groupByColumns}
        groupSortOrders={groupSortOrders}
        onUpdateEntry={onUpdateEntry}
        onDeleteEntry={onDeleteEntry}
      />

      {isPaginationEnabled && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageInput={pageInput}
          setPageInput={setPageInput}
          totalEntries={totalEntries}
        />
      )}
    </div>
  );
}

return { DataTablePagination };
```


# viewer

```jsx
async function viewer() {
  try {
    // Importing all necessary segments from component.v01.md
    const { initialSettings } = await dc.require(dc.headerLink("./component.v01.md", "InitialSettings"));
    const { useState, useMemo, useRef, getProperty } = await dc.require(dc.headerLink("./component.v01.md", "HelperFunctions"));
    const { DraggableLink } = await dc.require(dc.headerLink("./component.v01.md", "DraggableLink"));
    const { EditableCell } = await dc.require(dc.headerLink("./component.v01.md", "EditableCell"));
    const { EditColumnBlock } = await dc.require(dc.headerLink("./component.v01.md", "EditColumnBlock"));
    const { AddColumn } = await dc.require(dc.headerLink("./component.v01.md", "AddColumn"));
    const { PaginationSettings } = await dc.require(dc.headerLink("./component.v01.md", "PaginationSettings"));
    const { DataTable, RenderRows } = await dc.require(dc.headerLink("./component.v01.md", "DataTable"));
    const { DataTablePagination } = await dc.require(dc.headerLink("./component.v01.md", "DataTablePagination"));
    const { Pagination } = await dc.require(dc.headerLink("./component.v01.md", "Pagination"));
    const { styles } = await dc.require(dc.headerLink("./component.v01.md", "Styles"));

    // Verify imports
    console.log("Imported initialSettings:", initialSettings);
    console.log("Imported helper functions:", { useState, useMemo, useRef, getProperty });
    console.log("Imported components:", { DraggableLink, EditableCell, EditColumnBlock, AddColumn, PaginationSettings, DataTable, RenderRows, DataTablePagination, Pagination, styles });

    // Check if 'dc' is defined
    if (typeof dc === 'undefined') {
      console.error("'dc' object is not defined. Ensure that the DataCore plugin is correctly initialized.");
      return { ViewComponent: undefined };
    }

    // Define the ViewComponent
    function ViewComponent({ initialSettings: customSettings = {} }) {
      // Merge customSettings with initialSettings
      const mergedSettings = { ...initialSettings, ...customSettings };

      const [nameFilter, setNameFilter] = useState(mergedSettings.initialNameFilter);
      const [queryPath, setQueryPath] = useState(mergedSettings.queryPath);
      const [isEditing, setIsEditing] = useState(false);
      const [editedHeaders, setEditedHeaders] = useState({});
      const [editedFields, setEditedFields] = useState({});
      const [newHeaderLabel, setNewHeaderLabel] = useState("");
      const [newFieldLabel, setNewFieldLabel] = useState("");
      const [currentPage, setCurrentPage] = useState(1);
      const [pageInput, setPageInput] = useState("");
      const [isPaginationEnabled, setIsPaginationEnabled] = useState(mergedSettings.pagination.isEnabled);
      const [itemsPerPage, setItemsPerPage] = useState(mergedSettings.pagination.itemsPerPage);
      const [groupByColumns, setGroupByColumns] = useState(mergedSettings.groupByColumns);
      const [groupSortOrders, setGroupSortOrders] = useState({});
      const [dynamicColumnProperties, setDynamicColumnProperties] = useState(mergedSettings.dynamicColumnProperties);
      const [columnsToShow, setColumnsToShow] = useState(Object.keys(dynamicColumnProperties));

      // Fetch data using DataCore's query
      const qdata = dc.useQuery(`@page and path("${queryPath}")`);

      // Filter data based on nameFilter
      const filteredData = useMemo(() => {
        return qdata.filter((entry) => {
          const entryName = getProperty(entry, "name.obsidian").toLowerCase();
          return entryName.includes(nameFilter.toLowerCase());
        });
      }, [qdata, nameFilter]);

      // Group data based on groupByColumns
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
            result = result.concat(flattenData(groups[key], groupKeys.slice(1), level + 1));
          });
          return result;
        };
        return flattenData(filteredData, groupByColumns);
      }, [filteredData, groupByColumns, dynamicColumnProperties, groupSortOrders]);

      // Paginate data if pagination is enabled
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

      // Calculate total pages
      const totalPages = useMemo(
        () =>
          isPaginationEnabled ? Math.ceil(groupedData.length / itemsPerPage) : 1,
        [groupedData.length, itemsPerPage, isPaginationEnabled]
      );

      // Handle page change
      const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
          setCurrentPage(pageNumber);
          setPageInput("");
        }
      };

      // Add a new column
      const addNewColumn = () => {
        if (!newHeaderLabel || !newFieldLabel) {
          alert("Please provide both a new header label and a data field.");
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

      // Update an existing column
      const updateColumn = (columnId) => {
        const newHeader = editedHeaders[columnId] || columnId;
        const newField =
          editedFields[columnId] || dynamicColumnProperties[columnId];
        const updatedColumns = { ...dynamicColumnProperties };
        delete updatedColumns[columnId];
        updatedColumns[newHeader] = newField;
        setDynamicColumnProperties(updatedColumns);
        setColumnsToShow(
          columnsToShow.map((col) => (col === columnId ? newHeader : col))
        );
        setGroupByColumns(
          groupByColumns.map((col) => (col === columnId ? newHeader : col))
        );
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

      // Remove a column
      const removeColumn = (columnId) => {
        const updatedColumns = { ...dynamicColumnProperties };
        delete updatedColumns[columnId];
        setDynamicColumnProperties(updatedColumns);
        setColumnsToShow(columnsToShow.filter((col) => col !== columnId));
        setGroupByColumns(groupByColumns.filter((col) => col !== columnId));
      };

      // Update an entry
      const onUpdateEntry = (entry, property, newValue) => {
        // Implement actual update logic here
        console.log(`Updating ${entry.$name}: Set ${property} to ${newValue}`);
      };

      // Delete an entry
      const onDeleteEntry = (entry) => {
        // Implement actual delete logic here
        console.log(`Deleting ${entry.$name}`);
      };

      const totalEntries = groupedData.length;

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
                {isEditing ? "Finish Editing" : "Edit Headers"}
              </dc.Button>
              {/* Add New File Button */}
              <dc.Button
                onClick={() => {
                  // Implement add new file logic here
                  console.log("Adding new file");
                }}
                style={styles.button}
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

          <DataTablePagination
            columnsToShow={columnsToShow}
            dynamicColumnProperties={dynamicColumnProperties}
            data={paginatedData}
            groupByColumns={groupByColumns}
            groupSortOrders={groupSortOrders}
            onUpdateEntry={onUpdateEntry}
            onDeleteEntry={onDeleteEntry}
            isPaginationEnabled={isPaginationEnabled}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageInput={pageInput}
            setPageInput={setPageInput}
            totalEntries={totalEntries}
          />
        </dc.Stack>
      );
    }

    // Log the ViewComponent to check if it's defined
    console.log("ViewComponent:", ViewComponent);

    // Ensure that ViewComponent is returned correctly
    return { ViewComponent };
  } catch (error) {
    console.error("Error in viewer function:", error);
    return { ViewComponent: undefined }; // Adjusted to match the name
  }
}

return { viewer };

```






# Styles

```jsx
// Styles
const styles = {
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
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
  button: {
    padding: "8px 12px",
    backgroundColor: "var(--interactive-accent)",
    color: "var(--text-on-accent)",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "6px 10px",
    backgroundColor: "var(--interactive-danger)",
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
  editBlock: {
    flex: "0 0 200px",
    padding: "5px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "10px",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    borderRadius: "8px",
    cursor: "grab",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  editBlockHeaderContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editBlockHeader: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  expandCollapseIcon: {
    fontSize: "14px",
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
  groupOrderControls: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    flexWrap: "wrap",
  },
  groupOrderLabel: {
    fontSize: "12px",
    color: "var(--text-faint)",
  },
  sortOrderLabel: {
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
  tableAndPaginationContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
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
    color: "var(--text-accent)",
  },
};

return { styles };
```
