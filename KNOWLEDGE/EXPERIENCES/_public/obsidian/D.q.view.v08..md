



```jsx
////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

// Function to move an item to a different lane
function moveItem(items, itemId, targetLaneId) {
  return items.map((item) =>
    item.id === itemId ? { ...item, laneId: targetLaneId } : item
  );
}

// Function to add a new item
function addItem(items, content, laneId) {
  const newItem = {
    id: `item${items.length + 1}`,
    content,
    laneId,
  };
  return [...items, newItem];
}

// Function to remove an item
function removeItem(items, itemId) {
  return items.filter((item) => item.id !== itemId);
}

// Function to add a new lane
function addLane(lanes, title) {
  const newLane = {
    id: `lane${lanes.length + 1}`,
    title,
  };
  return [...lanes, newLane];
}

// Function to remove a lane
function removeLane(lanes, laneId) {
  return lanes.filter((lane) => lane.id !== laneId);
}

////////////////////////////////////////////////////
///                 Components                   ///
////////////////////////////////////////////////////

function Lane({
  lane,
  items,
  onDragOver,
  onDrop,
  onDragStart,
  onAddItem,
  onRemoveLane,
  onRemoveItem,
}) {
  // Use React hooks from the 'dc' context
  const { useState } = dc;

  // State for new item content
  const [newItemContent, setNewItemContent] = useState('');

  const handleAddItem = () => {
    if (newItemContent.trim() !== '') {
      onAddItem(lane.id, newItemContent);
      setNewItemContent('');
    }
  };

  return (
    <div
      style={styles.lane}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, lane.id)}
    >
      <div style={styles.laneHeader}>
        {lane.title}
        <button onClick={() => onRemoveLane(lane.id)} style={styles.removeButton}>
          ×
        </button>
      </div>
      <div style={styles.laneContent}>
        {items.map((item) => (
          <div
            key={item.id}
            style={styles.item}
            draggable
            onDragStart={(e) => onDragStart(e, item.id)}
          >
            {item.content}
            <button
              onClick={() => onRemoveItem(item.id)}
              style={styles.itemRemoveButton}
            >
              ×
            </button>
          </div>
        ))}
        <div style={styles.addItemContainer}>
          <input
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            placeholder="New item..."
            style={styles.addItemInput}
          />
          <button onClick={handleAddItem} style={styles.addButton}>
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

////////////////////////////////////////////////////
///                   Styles                     ///
////////////////////////////////////////////////////

const styles = {
  kanbanBoard: {
    display: "flex",
    flexDirection: "row",
    overflowX: "auto",
    padding: "10px",
    backgroundColor: "var(--background-primary)",
  },
  lane: {
    minWidth: "250px",
    backgroundColor: "var(--background-secondary)",
    margin: "0 10px",
    borderRadius: "5px",
    display: "flex",
    flexDirection: "column",
  },
  laneHeader: {
    padding: "10px",
    backgroundColor: "var(--background-modifier-border)",
    textAlign: "center",
    fontWeight: "bold",
    position: "relative",
  },
  laneContent: {
    flex: 1,
    padding: "10px",
  },
  item: {
    padding: "10px",
    margin: "5px 0",
    backgroundColor: "var(--background-primary)",
    borderRadius: "3px",
    cursor: "grab",
    border: "1px solid var(--background-modifier-border)",
    position: "relative",
  },
  addItemContainer: {
    display: "flex",
    marginTop: "10px",
  },
  addItemInput: {
    flex: 1,
    padding: "5px",
    marginRight: "5px",
  },
  addButton: {
    padding: "5px 10px",
    cursor: "pointer",
  },
  removeButton: {
    position: "absolute",
    top: "5px",
    right: "5px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "red",
    fontSize: "16px",
  },
  itemRemoveButton: {
    position: "absolute",
    top: "5px",
    right: "5px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "red",
    fontSize: "12px",
  },
  addLaneContainer: {
    display: "flex",
    margin: "10px",
  },
  addLaneInput: {
    flex: 1,
    padding: "5px",
    marginRight: "5px",
  },
  addLaneButton: {
    padding: "5px 10px",
  },
};

////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////

function View() {
  // Use React hooks from the 'dc' context
  const { useState } = dc;

  // Initialize lanes and items state
  const [lanes, setLanes] = useState([
    { id: "lane1", title: "To Do" },
    { id: "lane2", title: "In Progress" },
    { id: "lane3", title: "Done" },
  ]);

  const [items, setItems] = useState([
    { id: "item1", content: "Task 1", laneId: "lane1" },
    { id: "item2", content: "Task 2", laneId: "lane1" },
    { id: "item3", content: "Task 3", laneId: "lane2" },
  ]);

  // State for new lane title
  const [newLaneTitle, setNewLaneTitle] = useState('');

  // Drag start handler
  const onDragStart = (e, itemId) => {
    e.dataTransfer.setData("itemId", itemId);
  };

  // Drop handler
  const onDrop = (e, laneId) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("itemId");
    setItems((prevItems) => moveItem(prevItems, itemId, laneId));
  };

  // Allow drop by preventing default behavior
  const onDragOver = (e) => {
    e.preventDefault();
  };

  // Add new item
  const onAddItem = (laneId, content) => {
    if (content.trim() !== '') {
      setItems((prevItems) => addItem(prevItems, content, laneId));
    }
  };

  // Remove item
  const onRemoveItem = (itemId) => {
    setItems((prevItems) => removeItem(prevItems, itemId));
  };

  // Add new lane
  const onAddLane = () => {
    if (newLaneTitle.trim() !== '') {
      setLanes((prevLanes) => addLane(prevLanes, newLaneTitle));
      setNewLaneTitle('');
    }
  };

  // Remove lane
  const onRemoveLane = (laneId) => {
    setLanes((prevLanes) => removeLane(prevLanes, laneId));
    // Also remove items in the removed lane
    setItems((prevItems) => prevItems.filter((item) => item.laneId !== laneId));
  };

  return (
    <div>
      <div style={styles.addLaneContainer}>
        <input
          type="text"
          value={newLaneTitle}
          onChange={(e) => setNewLaneTitle(e.target.value)}
          placeholder="New lane title..."
          style={styles.addLaneInput}
        />
        <button onClick={onAddLane} style={styles.addLaneButton}>
          Add Lane
        </button>
      </div>
      <div style={styles.kanbanBoard}>
        {lanes.map((lane) => (
          <Lane
            key={lane.id}
            lane={lane}
            items={items.filter((item) => item.laneId === lane.id)}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={onDragStart}
            onAddItem={onAddItem}
            onRemoveLane={onRemoveLane}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
}

////////////////////////////////////////////////////
///             Exporting the View Component      ///
////////////////////////////////////////////////////

return View;
```


> [!info]- SETTINGS
> # settings
> ```tsx
> function initialSettingsOverride() {
> const settings = {
> 	queryPath: "CUSTOM_PATH/RECIPES",
> 	initialNameFilter: "search_term_here",
> 	dynamicColumnProperties: 
> 	  Recipes: "name.obsidian",
> 	    Source: "source",
> 	    Diet: "diet",
> 	    Tags: "tags",
> 	    Ingredients: "ingredients",
> 	"Creation Date": "ctime.obsidian",
> 	},
> 	groupByColumns: ["Genre"],
> 	pagination: {
> 	  isEnabled: false,
> 	itemsPerPage: 10,
> 	},
> 	viewHeight: "750px",
> 	placeholders: {
> 	  nameFilter: "Search recipes here...",
> 	    queryPath: "Enter your custom path...",
> 	headerTitle: "My Custom Recipe Viewer",
> },
> };
> ```





