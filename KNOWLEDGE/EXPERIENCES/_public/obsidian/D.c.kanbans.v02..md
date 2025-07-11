


# viewer

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  // List of file paths to load as columns
  filesAsColumns: [
    "test.md",
    "test1.md",
    "test11.md",
  ],
  // Separator used within each file to split into items
  // Can be a regex pattern to match separator lines (e.g., '^[-]{3,}$' for lines with 3 or more dashes)
  itemSeparatorPattern: '^[-]{3,}$', // Matches lines with three or more dashes
  // Whether to treat the separator as a regex pattern (true) or a plain string (false)
  useRegexSeparator: true,
  viewHeight: "600px",
  placeholders: {
    laneTitle: "Enter lane title...",
    laneFilePath: "Enter file path for lane...",
    itemContent: "Enter item content...",
  },
};

////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

// Function to parse file content into items based on the separator pattern
function parseFileIntoItems(content, filePath, separatorPattern, useRegex) {
  let items = [];
  let splitContent;

  if (useRegex) {
    // Split using regex pattern as separator
    const regex = new RegExp(separatorPattern, 'gm');
    splitContent = content.split(regex);
  } else {
    // Split using plain string as separator
    splitContent = content.split(separatorPattern);
  }

  for (let i = 0; i < splitContent.length; i++) {
    const itemContent = splitContent[i].trim();
    if (itemContent) {
      items.push({
        id: `${filePath}-${i}`,
        content: itemContent,
        laneId: filePath,
      });
    }
  }

  return items;
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
  placeholders,
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
            <dc.Markdown markdown={item.content} />
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
            placeholder={placeholders.itemContent}
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
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    height: "100%",
  },
  kanbanBoard: {
    display: "flex",
    flexDirection: "row",
    overflowX: "auto",
    padding: "10px",
    backgroundColor: "var(--background-primary)",
    height: "100%",
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

function View({ initialSettingsOverride = {}, app }) {
  // Use React hooks from the 'dc' context
  const { useState, useMemo } = dc;

  // Merge default settings with the override
  const mergedSettings = useMemo(() => {
    return {
      ...initialSettings, // Default settings
      ...initialSettingsOverride, // Override settings
    };
  }, [initialSettingsOverride]);

  const {
    filesAsColumns,
    itemSeparatorPattern,
    useRegexSeparator,
    placeholders,
  } = mergedSettings;

  // Construct the query to get the specific files
  const filePathsQuery = filesAsColumns.map(path => `$path = "${path}"`).join(' or ');
  const queryString = `@file and (${filePathsQuery})`;

  // Use dc.useQuery to get the files
  const files = dc.useQuery(queryString);

  // Process the files to create lanes and items
  const [lanes, items] = useMemo(() => {
    let loadedLanes = [];
    let loadedItems = [];

    for (const file of files) {
      const filePath = file.$path;
      const content = file.$content || '';

      const lane = {
        id: filePath,
        title: file.$name || filePath,
      };
      loadedLanes.push(lane);

      const parsedItems = parseFileIntoItems(
        content,
        filePath,
        itemSeparatorPattern,
        useRegexSeparator
      );
      loadedItems = loadedItems.concat(parsedItems);
    }

    return [loadedLanes, loadedItems];
  }, [files, itemSeparatorPattern, useRegexSeparator]);

  // State for new lane title and file path
  const [newLaneTitle, setNewLaneTitle] = useState('');
  const [newLaneFilePath, setNewLaneFilePath] = useState('');

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
      const newItem = {
        id: `item${items.length + 1}`,
        content,
        laneId,
      };
      setItems((prevItems) => [...prevItems, newItem]);
    }
  };

  // Remove item
  const onRemoveItem = (itemId) => {
    setItems((prevItems) => removeItem(prevItems, itemId));
  };

  // Add new lane (file)
  const onAddLane = () => {
    if (newLaneFilePath.trim() !== '') {
      // Add the new file path to lanes
      const newLane = {
        id: newLaneFilePath,
        title: newLaneTitle || newLaneFilePath,
      };
      setLanes((prevLanes) => [...prevLanes, newLane]);

      // Reset input fields
      setNewLaneTitle('');
      setNewLaneFilePath('');
    }
  };

  // Remove lane
  const onRemoveLane = (laneId) => {
    setLanes((prevLanes) => removeLane(prevLanes, laneId));
    // Also remove items in the removed lane
    setItems((prevItems) => prevItems.filter((item) => item.laneId !== laneId));
  };

  return (
    <dc.Stack style={{ ...styles.mainContainer, height: mergedSettings.viewHeight }}>
      <div style={styles.addLaneContainer}>
        <input
          type="text"
          value={newLaneFilePath}
          onChange={(e) => setNewLaneFilePath(e.target.value)}
          placeholder={placeholders.laneFilePath}
          style={styles.addLaneInput}
        />
        <input
          type="text"
          value={newLaneTitle}
          onChange={(e) => setNewLaneTitle(e.target.value)}
          placeholder={placeholders.laneTitle}
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
            placeholders={placeholders}
          />
        ))}
      </div>
    </dc.Stack>
  );
}

////////////////////////////////////////////////////
///             Exporting the View Component      ///
////////////////////////////////////////////////////

return { View };
```
