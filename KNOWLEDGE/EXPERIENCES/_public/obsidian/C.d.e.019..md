





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

// Retrieve properties with fallback
function getProperty(entry, property) {
  if (!property || typeof property !== 'string') {
    return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
  }

  if (property.endsWith('.obsidian')) {
    const cleanProp = property.replace('.obsidian', '');
    switch (cleanProp) {
      case 'ctime':
        return entry.$ctime ? entry.$ctime.toISODate() : MASTER_COLUMN_CONTROLLER.getFallbackValue();
      case 'name':
        return entry.$name || 'Unnamed';
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
    }
  }

  if (entry.$frontmatter?.hasOwnProperty(property)) {
    const field = entry.$frontmatter[property];
    return field?.value ? field.value.toString() : 'Unknown';
  }
  return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
}

// Draggable link component with hover preview effect
function DraggableLink({ title }) {
  const handleDrag = (e) => e.dataTransfer.setData("text/plain", `[[${title}]]`);

  return (
    <a
      href={title}
      draggable
      onDragStart={handleDrag}
      title={`Preview ${title}`} // Add hover effect for preview
      style={{ cursor: 'pointer', textDecoration: 'underline' }}
    >
      {title}
    </a>
  );
}

// Draggable Edit Control Block with minimal black-and-white UI and hover effect
function DraggableEditBlock({ columnId, index, columnsToShow, setColumnsToShow, editedHeaders, setEditedHeaders, editedFields, setEditedFields, updateColumn, removeColumn }) {
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
      style={{
        padding: '20px',
        border: '1px solid #ccc',
        marginBottom: '15px',
        marginRight: '15px',
        width: '300px',
        cursor: 'grab',
        backgroundColor: '#222',
        color: '#fff',
        borderRadius: '8px',
        transition: 'background-color 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#333';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#222';
      }}
    >
      <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
        {editedHeaders[columnId] || columnId}
      </label>
      <label style={{ color: 'grey', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
        Header Label:
      </label>
      <dc.Textbox
        type="text"
        value={editedHeaders[columnId] || columnId}
        onChange={e => setEditedHeaders((prev) => ({ ...prev, [columnId]: e.target.value }))}
        style={{ padding: '8px', border: '1px solid #444', width: '100%', backgroundColor: '#111', color: '#fff' }}
      />
      <label style={{ color: 'grey', fontSize: '12px', marginTop: '10px', display: 'block' }}>Data Field:</label>
      <dc.Textbox
        placeholder="Data Field"
        value={editedFields[columnId] || DYNAMIC_COLUMN_PROPERTIES[columnId]}
        onChange={e => setEditedFields((prev) => ({ ...prev, [columnId]: e.target.value }))}
        style={{ padding: '8px', border: '1px solid #444', width: '100%', backgroundColor: '#111', color: '#fff' }}
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'space-between', width: '100%' }}>
        <button
          onClick={() => updateColumn(columnId)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            width: '45%',
            backgroundColor: '#444',
            color: '#fff',
            borderRadius: '5px',
            border: '1px solid #555',
          }}
        >
          Update
        </button>
        <button
          onClick={() => removeColumn(columnId)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            width: '45%',
            backgroundColor: '#444',
            color: '#fff',
            borderRadius: '5px',
            border: '1px solid #555',
          }}
        >
          Remove
        </button>
      </div>
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
    <dc.Stack>
      <dc.Group>
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
        <button onClick={toggleHeaderEdit}>
          {isEditingHeaders ? 'Finish Editing' : 'Edit Headers'}
        </button>
      </dc.Group>

      {/* Draggable Column Edit Blocks */}
      {isEditingHeaders && (
        <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '10px', border: '1px solid #ccc', marginTop: '20px' }}>
          <dc.Group style={{ display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap' }}>
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
          </dc.Group>
        </div>
      )}

      {/* Scrollable table wrapper */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '400px', width: '100%', marginTop: '20px', position: 'relative' }}>
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
          style={{ tableLayout: 'fixed', minWidth: '1000px' }} // Adjust table width for scrollability
        />
      </div>

      {/* Sticky pagination */}
      <div style={{ position: 'sticky', bottom: '0', width: '100%', background: '#fff', padding: '10px', boxShadow: '0px -2px 10px rgba(0,0,0,0.1)' }}>
        <dc.Pagination
          total={filteredData.length}
          perPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </dc.Stack>
  );
}

return View;
```






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

// Retrieve properties with fallback
function getProperty(entry, property) {
  if (!property || typeof property !== 'string') {
    return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
  }

  if (property.endsWith('.obsidian')) {
    const cleanProp = property.replace('.obsidian', '');
    switch (cleanProp) {
      case 'ctime':
        return entry.$ctime ? entry.$ctime.toISODate() : MASTER_COLUMN_CONTROLLER.getFallbackValue();
      case 'name':
        return entry.$name || 'Unnamed';
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
    }
  }

  if (entry.$frontmatter?.hasOwnProperty(property)) {
    const field = entry.$frontmatter[property];
    return field?.value ? field.value.toString() : 'Unknown';
  }
  return MASTER_COLUMN_CONTROLLER.getNoDataFallback(property);
}

// Draggable link component with hover preview effect
function DraggableLink({ title }) {
  const handleDrag = (e) => e.dataTransfer.setData("text/plain", `[[${title}]]`);

  return (
    <a
      href={title}
      draggable
      onDragStart={handleDrag}
      title={`Preview ${title}`} // Add hover effect for preview
      style={{ cursor: 'pointer', textDecoration: 'underline' }}
    >
      {title}
    </a>
  );
}

// Draggable Edit Control Block with minimal black-and-white UI and hover effect
function DraggableEditBlock({ columnId, index, columnsToShow, setColumnsToShow, editedHeaders, setEditedHeaders, editedFields, setEditedFields, updateColumn, removeColumn }) {
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
      style={{
        padding: '20px',
        border: '1px solid #ccc',
        marginBottom: '15px',
        marginRight: '15px',
        width: '300px',
        cursor: 'grab',
        backgroundColor: '#222',
        color: '#fff',
        borderRadius: '8px',
        transition: 'background-color 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#333';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#222';
      }}
    >
      <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
        {editedHeaders[columnId] || columnId}
      </label>
      <label style={{ color: 'grey', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
        Header Label:
      </label>
      <dc.Textbox
        type="text"
        value={editedHeaders[columnId] || columnId}
        onChange={e => setEditedHeaders((prev) => ({ ...prev, [columnId]: e.target.value }))}
        style={{ padding: '8px', border: '1px solid #444', width: '100%', backgroundColor: '#111', color: '#fff' }}
      />
      <label style={{ color: 'grey', fontSize: '12px', marginTop: '10px', display: 'block' }}>Data Field:</label>
      <dc.Textbox
        placeholder="Data Field"
        value={editedFields[columnId] || DYNAMIC_COLUMN_PROPERTIES[columnId]}
        onChange={e => setEditedFields((prev) => ({ ...prev, [columnId]: e.target.value }))}
        style={{ padding: '8px', border: '1px solid #444', width: '100%', backgroundColor: '#111', color: '#fff' }}
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'space-between', width: '100%' }}>
        <button
          onClick={() => updateColumn(columnId)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            width: '45%',
            backgroundColor: '#444',
            color: '#fff',
            borderRadius: '5px',
            border: '1px solid #555',
          }}
        >
          Update
        </button>
        <button
          onClick={() => removeColumn(columnId)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            width: '45%',
            backgroundColor: '#444',
            color: '#fff',
            borderRadius: '5px',
            border: '1px solid #555',
          }}
        >
          Remove
        </button>
      </div>
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
    <dc.Stack>
      <dc.Group>
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
        <button onClick={toggleHeaderEdit}>
          {isEditingHeaders ? 'Finish Editing' : 'Edit Headers'}
        </button>
      </dc.Group>

      {/* Draggable Column Edit Blocks */}
      {isEditingHeaders && (
        <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '10px', border: '1px solid #ccc', marginTop: '20px' }}>
          <dc.Group style={{ display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap' }}>
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
          </dc.Group>
        </div>
      )}

      {/* Scrollable table wrapper */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '400px', width: '100%', marginTop: '20px', position: 'relative' }}>
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
          style={{ tableLayout: 'fixed', minWidth: '1000px' }} // Adjust table width for scrollability
        />
      </div>

      {/* Sticky pagination */}
      <div style={{ position: 'sticky', bottom: '0', width: '100%', background: '#fff', padding: '10px', boxShadow: '0px -2px 10px rgba(0,0,0,0.1)' }}>
        <dc.Pagination
          total={filteredData.length}
          perPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </dc.Stack>
  );
}

return View;
```




``