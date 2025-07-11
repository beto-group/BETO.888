



```datacorejsx
const initialPath = "COOKBOOK/RECIPES/ALL";

// Master controller for column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props) => props,
  getFallbackValue: () => 'Unknown',
  getNoDataFallback: () => 'No Data'
};

// Define the initial dynamic column properties
let DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns({
  "Recipes": "name.obsidian",
  "Source": "source",
  "Genre": "genre",
  "Tags": "tags",
  "Ingredients": "ingredients",
  "Creation Date": "ctime.obsidian"
});

// Updated getProperty function
function getProperty(entry, property) {
  if (!property || typeof property !== 'string') {
    return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
  }

  // Handle Obsidian's built-in metadata
  if (property.endsWith('.obsidian')) {
    const cleanProp = property.replace('.obsidian', '');
    switch (cleanProp) {
      case 'ctime':
        return entry.$ctime ? entry.$ctime.toISODate() : 'Unknown Date';
      case 'name':
        return entry.$name || 'Unnamed';
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
    }
  }

  // Handle frontmatter fields
  if (entry.$frontmatter && entry.$frontmatter.hasOwnProperty(property)) {
    const frontmatterField = entry.$frontmatter[property];

    if (frontmatterField !== null && frontmatterField !== undefined) {
      if (Array.isArray(frontmatterField)) {
        return frontmatterField.join(', ');
      }
      return frontmatterField?.value ? frontmatterField.value.toString() : 'Unknown';
    }
  }

  return property === 'rating' ? 'Not Rated' : 'Unknown';
}

// Draggable link component
function DraggableLink({ title }) {
  const handleDrag = (e) => e.dataTransfer.setData("text/plain", `[[${title}]]`);
  
  return (
    <a
      href={title}
      draggable
      onDragStart={handleDrag}
      title={`Preview ${title}`}
      style={styles.draggableLink}
    >
      {title}
    </a>
  );
}

// Block to handle column editing and column addition
function DraggableEditBlock({
  columnId, index, columnsToShow, setColumnsToShow,
  editedHeaders, setEditedHeaders, editedFields, setEditedFields,
  updateColumn, removeColumn
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('dragIndex', index);
  };

  const handleDrop = (e) => {
    const dragIndex = e.dataTransfer.getData('dragIndex');
    const newColumns = [...columnsToShow];
    const draggedColumn = newColumns[dragIndex];
    newColumns.splice(dragIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    setColumnsToShow(newColumns);
  };

  return (
    <div
      key={columnId}
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={styles.draggableEditBlock}
    >
      <label style={styles.editBlockHeader}>
        {editedHeaders[columnId] || columnId}
      </label>
      <label style={styles.editBlockSubheader}>
        Header Label:
      </label>
      <dc.Textbox
        value={editedHeaders[columnId] || columnId}
        onChange={e => setEditedHeaders((prev) => ({ ...prev, [columnId]: e.target.value }))}
        style={styles.textbox}
      />
      <label style={styles.editBlockSubheader}>Data Field:</label>
      <dc.Textbox
        value={editedFields[columnId] || DYNAMIC_COLUMN_PROPERTIES[columnId]}
        onChange={e => setEditedFields((prev) => ({ ...prev, [columnId]: e.target.value }))}
        style={styles.textbox}
      />
      <div style={styles.editBlockButtonGroup}>
        <button onClick={() => updateColumn(columnId)} style={styles.button}>
          Update
        </button>
        <button onClick={() => removeColumn(columnId)} style={styles.button}>
          Remove
        </button>
      </div>
    </div>
  );
}

// Block to add a new column
function AddNewColumn({ newHeaderLabel, setNewHeaderLabel, newFieldLabel, setNewFieldLabel, addNewColumn }) {
  return (
    <div style={styles.addNewColumnBlock}>
      <label style={styles.addNewColumnHeader}>Add New Column</label>
      <label style={styles.addNewColumnSubheader}>New Header Label:</label>
      <dc.Textbox
        value={newHeaderLabel}
        onChange={e => setNewHeaderLabel(e.target.value)}
        style={styles.textbox}
      />
      <label style={styles.addNewColumnSubheader}>New Data Field:</label>
      <dc.Textbox
        value={newFieldLabel}
        onChange={e => setNewFieldLabel(e.target.value)}
        style={styles.textbox}
      />
      <button onClick={addNewColumn} style={styles.button}>
        Add Column
      </button>
    </div>
  );
}

// Main View
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(Object.keys(DYNAMIC_COLUMN_PROPERTIES));
  const [sortColumn, setSortColumn] = dc.useState("Recipes");
  const [sortOrder, setSortOrder] = dc.useState("asc");
  const [isEditingHeaders, setIsEditingHeaders] = dc.useState(false);
  const [editedHeaders, setEditedHeaders] = dc.useState({});
  const [editedFields, setEditedFields] = dc.useState({});
  const [newHeaderLabel, setNewHeaderLabel] = dc.useState("");
  const [newFieldLabel, setNewFieldLabel] = dc.useState("");
  const [currentPage, setCurrentPage] = dc.useState(1);
  const itemsPerPage = 10;

  // Fetch query data from the path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering
  const filteredData = qdata.filter(entry =>
    getProperty(entry, "name.obsidian").toLowerCase().includes(nameFilter.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Sort data
  const sortedData = currentItems.sort((a, b) => {
    const aValue = getProperty(a, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    const bValue = getProperty(b, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  // Group data
  const grouped = dc.useArray(sortedData, array =>
    array.groupBy(x => getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy])).sort(x => x.key)
  );

  // Handle adding a new column
  const addNewColumn = () => {
    if (!newHeaderLabel || !newFieldLabel) {
      alert('Please provide both a new header label and a data field.');
      return;
    }

    // Add the new column to DYNAMIC_COLUMN_PROPERTIES
    DYNAMIC_COLUMN_PROPERTIES = {
      ...DYNAMIC_COLUMN_PROPERTIES,
      [newHeaderLabel]: newFieldLabel
    };

    // Update the columns to show
    setColumnsToShow(prev => [...prev, newHeaderLabel]);

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
    const newField = editedFields[columnId] || DYNAMIC_COLUMN_PROPERTIES[columnId];

    const updatedColumns = { ...DYNAMIC_COLUMN_PROPERTIES };

    const updatedColumnsToShow = [...columnsToShow];
    const index = updatedColumnsToShow.indexOf(columnId);
    if (index !== -1) {
      updatedColumnsToShow[index] = newHeader;
    }

    delete updatedColumns[columnId];
    updatedColumns[newHeader] = newField;

    DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns);

    setColumnsToShow(updatedColumnsToShow);
  };

  const removeColumn = (columnId) => {
    setColumnsToShow(prev => prev.filter(id => id !== columnId));
  };

  const finishEditing = () => {
    const updatedDynamicColumns = {};

    Object.keys(DYNAMIC_COLUMN_PROPERTIES).forEach((key) => {
      const newHeader = editedHeaders[key] || key;
      const newField = editedFields[key] || DYNAMIC_COLUMN_PROPERTIES[key];
      updatedDynamicColumns[newHeader] = newField;
    });

    DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns(updatedDynamicColumns);
    setIsEditingHeaders(false);
  };

  return (
    <dc.Stack style={styles.mainContainer}>
      <div style={styles.wrapperContainer}>
        <dc.Group justify="space-between" style={styles.headerBlock}>
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
            options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
            selected={columnsToShow}
            onChange={setColumnsToShow}
          />
          <button onClick={toggleHeaderEdit}>
            {isEditingHeaders ? 'Finish Editing' : 'Edit Headers'}
          </button>
        </dc.Group>

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

        <div style={styles.scrollableTableWrapper}>
          <div style={styles.tableHeader}>
            {columnsToShow.map((col) => (
              <div key={col} style={styles.columnHeader}>
                {editedHeaders[col] || col}
              </div>
            ))}
          </div>

          <div style={styles.scrollableTableBlock}>
            <dc.VanillaTable
              groupings={{
                render: (label, rows) => <h2>{label || 'Uncategorized'}</h2>
              }}
              columns={columnsToShow.map(columnId => ({
                id: columnId,
                value: (entry) => columnId === "Recipes" ? <DraggableLink title={getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[columnId])} /> : getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[columnId])
              }))}
              rows={grouped}
              paging={itemsPerPage}
              style={{ tableLayout: 'fixed', minWidth: '1000px' }}
            />
          </div>

          <div style={styles.paginationBlock}>
            <dc.Pagination
              total={filteredData.length}
              perPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </dc.Stack>
  );
}

// Styles Block
const styles = {
  mainContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  wrapperContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  headerBlock: {
    padding: '10px',
    flexShrink: 0,
    backgroundColor: '#333',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
  },
  editingBlock: {
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '10px',
    border: '1px solid #ccc',
    marginTop: '10px',
  },
  columnBlock: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    flexWrap: 'wrap',
  },
  scrollableTableWrapper: {
    flexGrow: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#f1f1f1',
    position: 'sticky',
    top: '0',
    zIndex: 50,
  },
  columnHeader: {
    width: '200px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scrollableTableBlock: {
    flexGrow: 1,
    overflowX: 'auto',
    padding: '10px',
  },
  paginationBlock: {
    padding: '10px',
    background: '#fff',
    position: 'sticky',
    bottom: 0,
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
  },
  draggableLink: {
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  draggableEditBlock: {
    padding: '20px',
    border: '1px solid #ccc',
    marginBottom: '15px',
    width: '300px',
    backgroundColor: '#222',
    color: '#fff',
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
    color: 'grey',
    fontSize: '12px',
    marginBottom: '5px',
  },
  textbox: {
    padding: '8px',
    border: '1px solid #444',
    backgroundColor: '#111',
    color: '#fff',
  },
  editBlockButtonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  button: {
    padding: '8px 12px',
    width: '45%',
    backgroundColor: '#444',
    color: '#fff',
    borderRadius: '5px',
    border: '1px solid #555',
  },
  addNewColumnBlock: {
    padding: '20px',
    border: '1px solid #ccc',
    marginBottom: '15px',
    width: '300px',
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  addNewColumnHeader: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  addNewColumnSubheader: {
    color: 'grey',
    fontSize: '12px',
  },
};

return View;
```



CODE

```jsx
const initialPath = "COOKBOOK/RECIPES/ALL";

// Master controller for column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props) => props,
  getFallbackValue: () => 'Unknown',
  getNoDataFallback: () => 'No Data'
};

// Define the initial dynamic column properties
let DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns({
  "Recipes": "name.obsidian",
  "Source": "source",
  "Genre": "genre",
  "Tags": "tags",
  "Ingredients": "ingredients",
  "Creation Date": "ctime.obsidian"
});

// Updated getProperty function
function getProperty(entry, property) {
  if (!property || typeof property !== 'string') {
    return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
  }

  // Handle Obsidian's built-in metadata
  if (property.endsWith('.obsidian')) {
    const cleanProp = property.replace('.obsidian', '');
    switch (cleanProp) {
      case 'ctime':
        return entry.$ctime ? entry.$ctime.toISODate() : 'Unknown Date';
      case 'name':
        return entry.$name || 'Unnamed';
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
    }
  }

  // Handle frontmatter fields
  if (entry.$frontmatter && entry.$frontmatter.hasOwnProperty(property)) {
    const frontmatterField = entry.$frontmatter[property];

    if (frontmatterField !== null && frontmatterField !== undefined) {
      if (Array.isArray(frontmatterField)) {
        return frontmatterField.join(', ');
      }
      return frontmatterField?.value ? frontmatterField.value.toString() : 'Unknown';
    }
  }

  return property === 'rating' ? 'Not Rated' : 'Unknown';
}

// Draggable link component
function DraggableLink({ title }) {
  const handleDrag = (e) => e.dataTransfer.setData("text/plain", `[[${title}]]`);
  
  return (
    <a
      href={title}
      draggable
      onDragStart={handleDrag}
      title={`Preview ${title}`}
      style={styles.draggableLink}
    >
      {title}
    </a>
  );
}

// Block to handle column editing and column addition
function DraggableEditBlock({
  columnId, index, columnsToShow, setColumnsToShow,
  editedHeaders, setEditedHeaders, editedFields, setEditedFields,
  updateColumn, removeColumn
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('dragIndex', index);
  };

  const handleDrop = (e) => {
    const dragIndex = e.dataTransfer.getData('dragIndex');
    const newColumns = [...columnsToShow];
    const draggedColumn = newColumns[dragIndex];
    newColumns.splice(dragIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    setColumnsToShow(newColumns);
  };

  return (
    <div
      key={columnId}
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={styles.draggableEditBlock}
    >
      <label style={styles.editBlockHeader}>
        {editedHeaders[columnId] || columnId}
      </label>
      <label style={styles.editBlockSubheader}>
        Header Label:
      </label>
      <dc.Textbox
        value={editedHeaders[columnId] || columnId}
        onChange={e => setEditedHeaders((prev) => ({ ...prev, [columnId]: e.target.value }))}
        style={styles.textbox}
      />
      <label style={styles.editBlockSubheader}>Data Field:</label>
      <dc.Textbox
        value={editedFields[columnId] || DYNAMIC_COLUMN_PROPERTIES[columnId]}
        onChange={e => setEditedFields((prev) => ({ ...prev, [columnId]: e.target.value }))}
        style={styles.textbox}
      />
      <div style={styles.editBlockButtonGroup}>
        <button onClick={() => updateColumn(columnId)} style={styles.button}>
          Update
        </button>
        <button onClick={() => removeColumn(columnId)} style={styles.button}>
          Remove
        </button>
      </div>
    </div>
  );
}

// Block to add a new column
function AddNewColumn({ newHeaderLabel, setNewHeaderLabel, newFieldLabel, setNewFieldLabel, addNewColumn }) {
  return (
    <div style={styles.addNewColumnBlock}>
      <label style={styles.addNewColumnHeader}>Add New Column</label>
      <label style={styles.addNewColumnSubheader}>New Header Label:</label>
      <dc.Textbox
        value={newHeaderLabel}
        onChange={e => setNewHeaderLabel(e.target.value)}
        style={styles.textbox}
      />
      <label style={styles.addNewColumnSubheader}>New Data Field:</label>
      <dc.Textbox
        value={newFieldLabel}
        onChange={e => setNewFieldLabel(e.target.value)}
        style={styles.textbox}
      />
      <button onClick={addNewColumn} style={styles.button}>
        Add Column
      </button>
    </div>
  );
}

// Main View
function View() {
  const [nameFilter, setNameFilter] = dc.useState("");
  const [queryPath, setQueryPath] = dc.useState(initialPath);
  const [groupBy, setGroupBy] = dc.useState("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState(Object.keys(DYNAMIC_COLUMN_PROPERTIES));
  const [sortColumn, setSortColumn] = dc.useState("Recipes");
  const [sortOrder, setSortOrder] = dc.useState("asc");
  const [isEditingHeaders, setIsEditingHeaders] = dc.useState(false);
  const [editedHeaders, setEditedHeaders] = dc.useState({});
  const [editedFields, setEditedFields] = dc.useState({});
  const [newHeaderLabel, setNewHeaderLabel] = dc.useState("");
  const [newFieldLabel, setNewFieldLabel] = dc.useState("");
  const [currentPage, setCurrentPage] = dc.useState(1);
  const itemsPerPage = 10;

  // Fetch query data from the path
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Apply filtering
  const filteredData = qdata.filter(entry =>
    getProperty(entry, "name.obsidian").toLowerCase().includes(nameFilter.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Sort data
  const sortedData = currentItems.sort((a, b) => {
    const aValue = getProperty(a, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    const bValue = getProperty(b, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
    return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  // Group data
  const grouped = dc.useArray(sortedData, array =>
    array.groupBy(x => getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy])).sort(x => x.key)
  );

  // Handle adding a new column
  const addNewColumn = () => {
    if (!newHeaderLabel || !newFieldLabel) {
      alert('Please provide both a new header label and a data field.');
      return;
    }

    // Add the new column to DYNAMIC_COLUMN_PROPERTIES
    DYNAMIC_COLUMN_PROPERTIES = {
      ...DYNAMIC_COLUMN_PROPERTIES,
      [newHeaderLabel]: newFieldLabel
    };

    // Update the columns to show
    setColumnsToShow(prev => [...prev, newHeaderLabel]);

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
    const newField = editedFields[columnId] || DYNAMIC_COLUMN_PROPERTIES[columnId];

    const updatedColumns = { ...DYNAMIC_COLUMN_PROPERTIES };

    const updatedColumnsToShow = [...columnsToShow];
    const index = updatedColumnsToShow.indexOf(columnId);
    if (index !== -1) {
      updatedColumnsToShow[index] = newHeader;
    }

    delete updatedColumns[columnId];
    updatedColumns[newHeader] = newField;

    DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns(updatedColumns);

    setColumnsToShow(updatedColumnsToShow);
  };

  const removeColumn = (columnId) => {
    setColumnsToShow(prev => prev.filter(id => id !== columnId));
  };

  const finishEditing = () => {
    const updatedDynamicColumns = {};

    Object.keys(DYNAMIC_COLUMN_PROPERTIES).forEach((key) => {
      const newHeader = editedHeaders[key] || key;
      const newField = editedFields[key] || DYNAMIC_COLUMN_PROPERTIES[key];
      updatedDynamicColumns[newHeader] = newField;
    });

    DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns(updatedDynamicColumns);
    setIsEditingHeaders(false);
  };

  return (
    <dc.Stack style={styles.mainContainer}>
      <div style={styles.wrapperContainer}>
        <dc.Group justify="space-between" style={styles.headerBlock}>
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
            options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
            selected={columnsToShow}
            onChange={setColumnsToShow}
          />
          <button onClick={toggleHeaderEdit}>
            {isEditingHeaders ? 'Finish Editing' : 'Edit Headers'}
          </button>
        </dc.Group>

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

        <div style={styles.scrollableTableWrapper}>
          <div style={styles.tableHeader}>
            {columnsToShow.map((col) => (
              <div key={col} style={styles.columnHeader}>
                {editedHeaders[col] || col}
              </div>
            ))}
          </div>

          <div style={styles.scrollableTableBlock}>
            <dc.VanillaTable
              groupings={{
                render: (label, rows) => <h2>{label || 'Uncategorized'}</h2>
              }}
              columns={columnsToShow.map(columnId => ({
                id: columnId,
                value: (entry) => columnId === "Recipes" ? <DraggableLink title={getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[columnId])} /> : getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[columnId])
              }))}
              rows={grouped}
              paging={itemsPerPage}
              style={{ tableLayout: 'fixed', minWidth: '1000px' }}
            />
          </div>

          <div style={styles.paginationBlock}>
            <dc.Pagination
              total={filteredData.length}
              perPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </dc.Stack>
  );
}

// Styles Block
const styles = {
  mainContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  wrapperContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  headerBlock: {
    padding: '10px',
    flexShrink: 0,
    backgroundColor: '#333',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
  },
  editingBlock: {
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '10px',
    border: '1px solid #ccc',
    marginTop: '10px',
  },
  columnBlock: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    flexWrap: 'wrap',
  },
  scrollableTableWrapper: {
    flexGrow: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#f1f1f1',
    position: 'sticky',
    top: '0',
    zIndex: 50,
  },
  columnHeader: {
    width: '200px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scrollableTableBlock: {
    flexGrow: 1,
    overflowX: 'auto',
    padding: '10px',
  },
  paginationBlock: {
    padding: '10px',
    background: '#fff',
    position: 'sticky',
    bottom: 0,
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
  },
  draggableLink: {
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  draggableEditBlock: {
    padding: '20px',
    border: '1px solid #ccc',
    marginBottom: '15px',
    width: '300px',
    backgroundColor: '#222',
    color: '#fff',
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
    color: 'grey',
    fontSize: '12px',
    marginBottom: '5px',
  },
  textbox: {
    padding: '8px',
    border: '1px solid #444',
    backgroundColor: '#111',
    color: '#fff',
  },
  editBlockButtonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  button: {
    padding: '8px 12px',
    width: '45%',
    backgroundColor: '#444',
    color: '#fff',
    borderRadius: '5px',
    border: '1px solid #555',
  },
  addNewColumnBlock: {
    padding: '20px',
    border: '1px solid #ccc',
    marginBottom: '15px',
    width: '300px',
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  addNewColumnHeader: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  addNewColumnSubheader: {
    color: 'grey',
    fontSize: '12px',
  },
};

return View;
```



