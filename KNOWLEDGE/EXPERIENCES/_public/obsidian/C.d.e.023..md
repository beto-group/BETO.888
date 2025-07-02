

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

// Updated getProperty function to handle frontmatter and built-in metadata
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

// Draggable link component that formats links correctly as [[title_name]]
function DraggableLink({ title }) {
  if (!title) return null; // Handle empty title case

  const handleDrag = (e) => e.dataTransfer.setData("text/plain", `[[${title}]]`);

  return (
    <span
      draggable
      onDragStart={handleDrag}
      title={`Preview ${title}`}
      style={styles.draggableLink}
    >
      {`[[${title}]]`} {/* Ensure title renders correctly */}
    </span>
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
      {/* Main Container Block - Contains three main sections */}
      <div style={styles.wrapperContainer}>
        
        {/* Header Block (Search and Dropdowns) */}
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
        
        {/* Editing Block */}
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

              {/* Add new column */}
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

        {/* Table + Pagination Block (Scrollable Section) */}
        <div style={styles.scrollableTableWrapper}>
          {/* Headers for the columns (Sticky Header for Table) */}
          <div style={styles.tableHeader}>
            {columnsToShow.map((col) => (
              <div key={col} style={styles.columnHeader}>
                {editedHeaders[col] || col}
              </div>
            ))}
          </div>

          {/* Scrollable Table Block */}
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

          {/* Pagination Block */}
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
    backgroundColor: 'var(--background-color)',
  },
  wrapperContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--background-color)',
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
    backgroundColor: 'var(--background-color)',
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
  '@media (prefers-color-scheme: dark)': {
    '--background-color': '#000',
  },
  '@media (prefers-color-scheme: light)': {
    '--background-color': '#fff',
  },
};

return View;
```







[[try this prompt now. hehe]]




[[file_001]]

[[file_002]]



[[file_003]]



PROMPT TO GENERATE THIS
	help guide ish



```
### **Prompt Helper for Future You (Creating a File Column Component)**

- **Ensure Dynamism**: When defining a file column, make sure it can map dynamically to different file attributes (e.g., recipe title, genre, tags). Use a function to retrieve values (e.g., `file.value()`), ensuring flexibility in the data source.
    
- **Handle Missing Data Gracefully**: Always include fallback mechanisms for missing or undefined data. If a file attribute isn't present, provide a default value or alternative data source (e.g., if `tags` is empty, return "Untagged").
    
- **Support Interactivity**: For key columns like file names or titles, wrap them in interactive components like `DraggableLink`. This provides functionality beyond just displaying text, making it easier for users to interact with the file column.
    
- **Enable Grouping and Sorting**: Make sure file columns can be grouped or sorted by any file-specific property (e.g., genre, rating, or tags). This keeps the display flexible and organized based on user preferences.
```


```
### **Prompt Helper for Future You (Editable Component with Hover Effect and New Column Creation)**:

When creating an **editable component** with both drag-and-drop functionality and hover effects, while incorporating a **new column creation** feature, here are the key elements to consider for a streamlined, flexible, and user-friendly interface:

#### **Draggable and Hoverable**:

- Ensure that any editable component, especially those representing columns, is **draggable** by using the `draggable` attribute. Handle **drag-and-drop events** using the `onDragStart` and `onDrop` handlers to allow easy reordering of columns.
- Implement **hover effects** by adjusting the component's visual style with `onMouseEnter` and `onMouseLeave` events. A subtle color change or shadow effect should provide **visual feedback** to users, making it clear that the component is interactive.

#### **Responsive Design**:

- Keep the overall design **minimal yet interactive**. Use **background color transitions**, changes to **cursor styles**, and **smooth hover effects** to signal to users that elements are clickable or draggable.
- Ensure that the **drag-and-drop interactions** feel natural, with smooth visual feedback (like changing the background color when the item is dragged or hovered over).

#### **Flexible Editing**:

- Provide **editable fields** for both **column headers** and **data fields**. Let users dynamically change these values while the component remains in its current view. Update the column display in real time to reflect the changes.
- Ensure that the editable input fields are easy to understand and that any changes made are immediately applied when users interact with the columns.

---

### **New Column Creation Logic**:

When implementing the logic for **adding new columns** dynamically, consider the following structure:

#### **1. State Variables for New Column**:

- **`newHeaderLabel`**: Stores the label (header) of the new column that the user wants to add.
- **`newFieldLabel`**: Stores the data field (e.g., "genre", "tags") associated with the new column.

#### **2. Input Fields**:

- Provide two input fields:
    - One for entering the **header label** of the new column.
    - Another for entering the **data field** associated with the column.
- Both inputs should update their respective state variables (`newHeaderLabel` and `newFieldLabel`) via controlled components.

#### **3. Add Column Button**:

- Upon clicking the **"Add Column"** button, trigger the `addNewColumn` function, which validates that both the header label and field label are filled out.

#### **4. `addNewColumn` Function**:

- Validate that both inputs are filled. If either is missing, display an alert prompting the user to complete the fields.
- If valid:
    - **Update the `DYNAMIC_COLUMN_PROPERTIES`**: Add the new header and field labels to the dynamic column properties.
    - **Update the displayed columns**: Add the new header label to the `columnsToShow` state to ensure it appears in the table.
    - **Clear the input fields** after the column is successfully added.

---

### **New Column Creation Component**:

This component manages the addition of a new column through user input.

javascript

Copy code

`// Block to add a new column function AddNewColumn({ newHeaderLabel, setNewHeaderLabel, newFieldLabel, setNewFieldLabel, addNewColumn }) {   return (     <div style={styles.addNewColumnBlock}>       <label style={styles.addNewColumnHeader}>Add New Column</label>       <label style={styles.addNewColumnSubheader}>New Header Label:</label>       <dc.Textbox         value={newHeaderLabel}         onChange={e => setNewHeaderLabel(e.target.value)}         style={styles.textbox}       />       <label style={styles.addNewColumnSubheader}>New Data Field:</label>       <dc.Textbox         value={newFieldLabel}         onChange={e => setNewFieldLabel(e.target.value)}         style={styles.textbox}       />       <button onClick={addNewColumn} style={styles.button}>         Add Column       </button>     </div>   ); }`

### **addNewColumn Function**:

javascript

Copy code

`// Handle adding a new column const addNewColumn = () => {   if (!newHeaderLabel || !newFieldLabel) {     alert('Please provide both a new header label and a data field.');     return;   }    // Add the new column to DYNAMIC_COLUMN_PROPERTIES   DYNAMIC_COLUMN_PROPERTIES = {     ...DYNAMIC_COLUMN_PROPERTIES,     [newHeaderLabel]: newFieldLabel   };    // Update the columns to show   setColumnsToShow(prev => [...prev, newHeaderLabel]);    // Clear input fields after adding   setNewHeaderLabel("");   setNewFieldLabel(""); };`

### **Flow for Adding a New Column**:

1. **Input**: User provides a **Header Label** and **Data Field** through text inputs.
2. **Validation**: Clicking the "Add Column" button triggers the `addNewColumn` function. If both fields are valid, the column is added.
3. **Dynamic Update**: The new column is dynamically added to the table, and the input fields are cleared, ready for the next input.

---

### **Combination of Features**:

By combining these two functionalities (editable components with hover effects and new column creation), you ensure that users can:

- **Edit existing columns dynamically**: Users can modify both the display and data field for any column, with visual feedback through hover effects.
- **Add new columns on the fly**: Users can create new columns that are immediately incorporated into the table, expanding the table's flexibility.

This unified approach allows for a **highly interactive**, **user-friendly**, and **visually responsive** table management experience.
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

// Updated getProperty function to handle frontmatter and built-in metadata
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

// Draggable link component that formats links correctly as [[title_name]]
function DraggableLink({ title }) {
  if (!title) return null; // Handle empty title case

  const handleDrag = (e) => e.dataTransfer.setData("text/plain", `[[${title}]]`);

  return (
    <span
      draggable
      onDragStart={handleDrag}
      title={`Preview ${title}`}
      style={styles.draggableLink}
    >
      {`[[${title}]]`} {/* Ensure title renders correctly */}
    </span>
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
      {/* Main Container Block - Contains three main sections */}
      <div style={styles.wrapperContainer}>
        
        {/* Header Block (Search and Dropdowns) */}
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
        
        {/* Editing Block */}
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

              {/* Add new column */}
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

        {/* Table + Pagination Block (Scrollable Section) */}
        <div style={styles.scrollableTableWrapper}>
          {/* Headers for the columns (Sticky Header for Table) */}
          <div style={styles.tableHeader}>
            {columnsToShow.map((col) => (
              <div key={col} style={styles.columnHeader}>
                {editedHeaders[col] || col}
              </div>
            ))}
          </div>

          {/* Scrollable Table Block */}
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

          {/* Pagination Block */}
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
    backgroundColor: 'var(--background-color)',
  },
  wrapperContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--background-color)',
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
    backgroundColor: 'var(--background-color)',
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
  '@media (prefers-color-scheme: dark)': {
    '--background-color': '#000',
  },
  '@media (prefers-color-scheme: light)': {
    '--background-color': '#fff',
  },
};

return View;
```