

```jsx
////////////////////////////////////////////////////
///                 Initial Settings             ///
////////////////////////////////////////////////////

const initialSettings = {
  queryPath: "COOKBOOK/RECIPES/ALL",
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
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Recipe Viewer",
  },
};

////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

const { useState, useMemo } = dc;

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

  const frontmatter = entry.$frontmatter?.[property];
  if (frontmatter !== undefined) {
    if (Array.isArray(frontmatter)) return frontmatter.join(", ");
    return frontmatter.toString();
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
  } = props;

  const isGrouped = groupByColumns.includes(columnId);
  const groupIndex = groupByColumns.indexOf(columnId) + 1;

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
      <label style={styles.editBlockHeader}>
        {editedHeaders[columnId] || columnId}
      </label>
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
        </div>
      )}
    </div>
  );
}

function AddColumn({ newHeaderLabel, setNewHeaderLabel, newFieldLabel, setNewFieldLabel, addNewColumn }) {
  return (
    <div style={styles.editBlock}>
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

function PaginationSettings({ isEnabled, setIsEnabled, itemsPerPage, setItemsPerPage }) {
  return (
    <div style={styles.paginationSettings}>
      <label style={styles.editBlockHeader}>Pagination Settings</label>
      <dc.Checkbox
        label="Enable Pagination"
        checked={isEnabled}
        onChange={(e) => setIsEnabled(e.target.checked)}
      />
      {isEnabled && (
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
  );
}

function DataTable({ columnsToShow, dynamicColumnProperties, data, groupByColumns }) {
  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableHeader}>
        {columnsToShow.map((col) => (
          <div key={col} style={styles.tableHeaderCell}>
            {col}
          </div>
        ))}
      </div>
      <div style={styles.tableContent}>
        {data.length > 0 ? (
          <RenderRows
            data={data}
            columnsToShow={columnsToShow}
            dynamicColumnProperties={dynamicColumnProperties}
            groupByColumns={groupByColumns}
          />
        ) : (
          <div style={styles.noData}>No data to display.</div>
        )}
      </div>
    </div>
  );
}

function RenderRows({ data, columnsToShow, dynamicColumnProperties, groupByColumns, groupLevel = 0 }) {
  if (groupByColumns.length === 0) {
    return data.map((entry, idx) => (
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
    ));
  } else {
    const groupKey = groupByColumns[0];
    const property = dynamicColumnProperties[groupKey];
    const groups = {};

    data.forEach((entry) => {
      const key = getProperty(entry, property) || "Uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });

    const sortedKeys = Object.keys(groups).sort();

    return sortedKeys.map((key, idx) => (
      <div key={idx}>
        <div style={{ ...styles.groupHeader, paddingLeft: `${groupLevel * 20}px` }}>
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
    ));
  }
}

function Pagination({ currentPage, totalPages, onPageChange, pageInput, setPageInput, totalEntries }) {
  return (
    <div style={styles.pagination}>
      {totalPages > 1 ? (
        <>
          <dc.Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={styles.button}>
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
          <dc.Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={styles.button}>
            Next
          </dc.Button>
        </>
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
  const [queryPath, setQueryPath] = useState(initialSettings.queryPath);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHeaders, setEditedHeaders] = useState({});
  const [editedFields, setEditedFields] = useState({});
  const [newHeaderLabel, setNewHeaderLabel] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [isPaginationEnabled, setIsPaginationEnabled] = useState(initialSettings.pagination.isEnabled);
  const [itemsPerPage, setItemsPerPage] = useState(initialSettings.pagination.itemsPerPage);
  const [groupByColumns, setGroupByColumns] = useState(initialSettings.groupByColumns);
  const [dynamicColumnProperties, setDynamicColumnProperties] = useState(initialSettings.dynamicColumnProperties);
  const [columnsToShow, setColumnsToShow] = useState(Object.keys(dynamicColumnProperties));

  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  const filteredData = useMemo(() => {
    return qdata.filter((entry) => {
      const entryName = getProperty(entry, "name.obsidian").toLowerCase();
      return entryName.includes(nameFilter.toLowerCase());
    });
  }, [qdata, nameFilter]);

  const groupedData = useMemo(() => {
    const flattenData = (data, groupKeys, level = 0) => {
      if (groupKeys.length === 0) return data;
      const groupKey = groupKeys[0];
      const property = dynamicColumnProperties[groupKey];
      const groups = {};
      data.forEach((entry) => {
        const key = getProperty(entry, property) || "Uncategorized";
        if (!groups[key]) groups[key] = [];
        groups[key].push(entry);
      });
      let result = [];
      Object.keys(groups)
        .sort()
        .forEach((key) => {
          result.push({ type: "group", level, key });
          result = result.concat(flattenData(groups[key], groupKeys.slice(1), level + 1));
        });
      return result;
    };
    return flattenData(filteredData, groupByColumns);
  }, [filteredData, groupByColumns, dynamicColumnProperties]);

  const paginatedData = useMemo(() => {
    if (isPaginationEnabled) {
      return groupedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else {
      return groupedData;
    }
  }, [groupedData, currentPage, itemsPerPage, isPaginationEnabled]);

  const totalPages = useMemo(() => (isPaginationEnabled ? Math.ceil(groupedData.length / itemsPerPage) : 1), [
    groupedData.length,
    itemsPerPage,
    isPaginationEnabled,
  ]);

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
    const updatedColumns = { ...dynamicColumnProperties, [newHeaderLabel]: newFieldLabel };
    setDynamicColumnProperties(updatedColumns);
    setColumnsToShow([...columnsToShow, newHeaderLabel]);
    setNewHeaderLabel("");
    setNewFieldLabel("");
  };

  const updateColumn = (columnId) => {
    const newHeader = editedHeaders[columnId] || columnId;
    const newField = editedFields[columnId] || dynamicColumnProperties[columnId];
    const updatedColumns = { ...dynamicColumnProperties };
    delete updatedColumns[columnId];
    updatedColumns[newHeader] = newField;
    setDynamicColumnProperties(updatedColumns);
    setColumnsToShow(columnsToShow.map((col) => (col === columnId ? newHeader : col)));
    setGroupByColumns(groupByColumns.map((col) => (col === columnId ? newHeader : col)));
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
    setDynamicColumnProperties(updatedColumns);
    setColumnsToShow(columnsToShow.filter((col) => col !== columnId));
    setGroupByColumns(groupByColumns.filter((col) => col !== columnId));
  };

  const totalEntries = groupedData.length;

  return (
    <dc.Stack style={styles.mainContainer}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>{initialSettings.placeholders.headerTitle}</h1>
        <dc.Group style={styles.controlGroup}>
          <dc.Textbox
            type="search"
            placeholder={initialSettings.placeholders.nameFilter}
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.textbox}
          />
          <dc.Textbox
            value={queryPath}
            placeholder={initialSettings.placeholders.queryPath}
            onChange={(e) => {
              setQueryPath(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.textbox}
          />
          <dc.Button onClick={() => setIsEditing(!isEditing)} style={styles.button}>
            {isEditing ? "Finish Editing" : "Edit Headers"}
          </dc.Button>
        </dc.Group>
        {isEditing && (
          <PaginationSettings
            isEnabled={isPaginationEnabled}
            setIsEnabled={setIsPaginationEnabled}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
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

      <DataTable
        columnsToShow={columnsToShow}
        dynamicColumnProperties={dynamicColumnProperties}
        data={paginatedData}
        groupByColumns={groupByColumns}
      />

      {isPaginationEnabled && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageInput={pageInput}
          setPageInput={setPageInput}
          totalEntries={totalEntries}
        />
      )}
    </dc.Stack>
  );
}

////////////////////////////////////////////////////
///                   Styles                     ///
////////////////////////////////////////////////////

const styles = {
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
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
    gap: "10px",
    flexWrap: "wrap",
  },
  textbox: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "100%",
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
  editingContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    padding: "10px",
    overflowX: "auto",
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
  paginationSettings: {
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
  tableContainer: {
    flex: 1,
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
};

return View;
```