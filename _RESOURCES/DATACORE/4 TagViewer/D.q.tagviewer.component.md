

## ViewComponent

```jsx
const { useState, useMemo, useEffect, useRef } = dc;
const { getStyles } = await dc.require(dc.headerLink(dc.resolvePath("D.q.tagviewer.component.md"), "ViewerStyles"));
const tagStyles = getStyles();

function TagBrowser({ config = { queryPath: "@page" } }) {
  // State definitions
  const [currentPath, setCurrentPath] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showingUntaggedNotes, setShowingUntaggedNotes] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showingNoteTags, setShowingNoteTags] = useState(false);
  const [currentNoteTags, setCurrentNoteTags] = useState([]);
  const [currentNoteName, setCurrentNoteName] = useState("");
  const [dragItem, setDragItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);
  const throttleTimerRef = useRef(null);
  // New state for fixed order (each key will be "type-id")
  const [storedOrder, setStoredOrder] = useState([]);

  // 1) Fetch notes from the vault (or use config.queryPath if needed)
  const data = dc.useQuery("@page");

  // 2) Get untagged notes from PERMANENT folder
  const untaggedNotes = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter(note => {
      const path = note.$path || "";
      const isInPermanentFolder = path.includes("PERMANENT");
      const hasFrontmatterTags = note.$tags && Array.isArray(note.$tags) && note.$tags.length > 0;
      const hasTagsProperty = note.tags && (
        (Array.isArray(note.tags) && note.tags.length > 0) ||
        (typeof note.tags === 'string' && note.tags.trim() !== '')
      );
      return isInPermanentFolder && !hasFrontmatterTags && !hasTagsProperty;
    });
  }, [data]);

  // 3) Build a map of tag -> Set<Note>
  const tagMap = useMemo(() => {
    const map = new Map();
    if (!data || !Array.isArray(data)) return map;
    for (const note of data) {
      for (const rawTag of note.$tags || []) {
        const cleanTag = rawTag.replace(/^#/, "");
        if (!map.has(cleanTag)) map.set(cleanTag, new Set());
        map.get(cleanTag).add(note);
      }
    }
    return map;
  }, [data]);

  // 4) Build hierarchical tree structure
  const rootNode = useMemo(() => {
    function insertPath(node, parts, notesArray, fullPath) {
      if (parts.length === 0) {
        node.notes = notesArray;
        node.fullPath = fullPath;
        return;
      }
      const [head, ...rest] = parts;
      if (!node.children[head]) {
        node.children[head] = { name: head, children: {}, notes: [], fullPath: "" };
      }
      insertPath(node.children[head], rest, notesArray, fullPath);
    }
    const root = { name: "", children: {}, notes: [], fullPath: "" };
    for (const [path, notesSet] of tagMap.entries()) {
      const parts = path.split("/");
      insertPath(root, parts, Array.from(notesSet), path);
    }
    return root;
  }, [tagMap]);

  // 5) Helper to navigate the tree according to currentPath
  function getNodeByPath(node, pathParts) {
    if (pathParts.length === 0) return node;
    const [head, ...rest] = pathParts;
    if (!node.children[head]) return null;
    return getNodeByPath(node.children[head], rest);
  }
  
  const currentNode = useMemo(() => getNodeByPath(rootNode, currentPath) || rootNode, [rootNode, currentPath]);

  // ── Compute unsorted items from current data ──
  const unsortedItems = useMemo(() => {
    if (showingUntaggedNotes) {
      return untaggedNotes.map(note => ({
        type: 'note',
        id: note.$id || note.id,
        label: note.$name || note.name?.obsidian || "Untitled Note",
        displayText: note.$name || note.name?.obsidian || "Untitled Note",
        note: note
      }));
    }
    if (!currentNode) return [];
    
    // Build tag items
    const tagItems = Object.entries(currentNode.children || {}).map(([tagKey, childNode]) => ({
      type: 'tag',
      id: tagKey, // using tagKey as a fallback ID
      tagKey: tagKey,
      label: `#${[...currentPath, tagKey].join("/")}`,
      displayText: tagKey
    }));
    
    // Build note items
    const noteItems = (currentNode.notes || []).map(note => ({
      type: 'note',
      id: note.$id || note.id,
      label: note.$name || note.name?.obsidian || "Untitled Note",
      displayText: note.$name || note.name?.obsidian || "Untitled Note",
      note: note
    }));
    
    // Combine and apply search filtering
    const combined = [...tagItems, ...noteItems];
    return searchTerm
      ? combined.filter(item =>
          item.displayText.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : combined;
  }, [showingUntaggedNotes, untaggedNotes, currentNode, currentPath, searchTerm]);

  // ── Initialize and reconcile storedOrder ──
  // We create a unique key for each item (e.g., "note-123" or "tag-foo")
  useEffect(() => {
    const currentKeys = unsortedItems.map(item => `${item.type}-${item.id}`);
    // On initial render, store the order if it hasn't been set yet.
    if (storedOrder.length === 0 && currentKeys.length > 0) {
      setStoredOrder(currentKeys);
    } else {
      // Remove keys for items that no longer exist and append new items.
      const newOrder = storedOrder.filter(key => currentKeys.includes(key));
      currentKeys.forEach(key => {
        if (!newOrder.includes(key)) {
          newOrder.push(key);
        }
      });
      if (JSON.stringify(newOrder) !== JSON.stringify(storedOrder)) {
        setStoredOrder(newOrder);
      }
    }
  }, [unsortedItems]);

  // ── Sort items based on the storedOrder array ──
  const sortedItems = useMemo(() => {
    return [...unsortedItems].sort((a, b) => {
      const aKey = `${a.type}-${a.id}`;
      const bKey = `${b.type}-${b.id}`;
      const aIndex = storedOrder.indexOf(aKey);
      const bIndex = storedOrder.indexOf(bKey);
      return aIndex - bIndex;
    });
  }, [unsortedItems, storedOrder]);

  // Navigation functions
  const navigateToPathLevel = (level) => {
    setCurrentPath(currentPath.slice(0, level + 1));
    setShowingUntaggedNotes(false);
  };
  const navigateToHome = () => {
    setCurrentPath([]);
    setShowingUntaggedNotes(false);
  };
  const toggleUntaggedNotes = () => setShowingUntaggedNotes(!showingUntaggedNotes);

  // (Active note tag syncing and drag-and-drop handlers are omitted for brevity)

  // Render breadcrumb path
  const renderTagPath = () => {
    if (showingUntaggedNotes) return "Untagged Notes in PERMANENT Folder";
    if (currentPath.length === 0) return "Top-Level Items";
    return (
      <span>
        Path:{" "}
        {currentPath.map((tag, index) => (
          <span key={index}>
            {index > 0 && "/"}
            {index < currentPath.length - 1 ? (
              <button
                onClick={() => navigateToPathLevel(index)}
                style={tagStyles.breadcrumbButton}
              >
                {tag}
              </button>
            ) : (
              <span style={tagStyles.breadcrumbCurrent}>{tag}</span>
            )}
          </span>
        ))}
      </span>
    );
  };

  // Item click handler
  const handleItemClick = (item) => {
    if (item.type === 'tag') {
      setCurrentPath(prev => [...prev, item.tagKey]);
      setShowingUntaggedNotes(false);
    } else {
      if (window.app) {
        const leaf = app.workspace.getLeaf('tab');
        let linkText = item.label;
        const notePath = item.note?.$path || "";
        if (notePath.includes("PERMANENT")) {
          linkText = `PERMANENT/${item.label}`;
        }
        leaf
          ? leaf.openLinkText(linkText, "", false)
          : app.workspace.openLinkText(linkText, "", false);
      } else {
        console.log("Obsidian API not available for navigation");
      }
    }
  };

  // Tag click handler for sync mode
  const handleTagClick = (tag) => {
    const tagPath = tag.replace(/^#/, "").split("/");
    setCurrentPath(tagPath);
    setShowingUntaggedNotes(false);
  };

  const clearSearch = () => setSearchTerm("");

  // ── Render UI using the sortedItems list ──
  return (
    <dc.Stack style={tagStyles.container}>
      {/* Header with navigation and search */}
      <div style={tagStyles.header}>
        <div style={tagStyles.headerLeft}>
          <button onClick={navigateToHome} style={tagStyles.homeButton}>
            <dc.Icon icon="home" style={{ fontSize: "16px" }} />
          </button>
          <button
            onClick={() => setShowingNoteTags(s => !s)}
            style={tagStyles.syncButton}
          >
            <dc.Icon icon={showingNoteTags ? "link" : "unlink"} style={{ fontSize: "14px" }} />
            {showingNoteTags ? "Sync ON" : "Sync"}
          </button>
          {untaggedNotes.length > 0 && (
            <button 
              onClick={toggleUntaggedNotes} 
              style={showingUntaggedNotes ? tagStyles.untaggedButtonActive : tagStyles.untaggedButton}
            > 		  
              {untaggedNotes.length}
            </button>
          )}
          <div style={tagStyles.searchContainer}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              style={tagStyles.searchInput}
            />
            {searchTerm && (
              <button onClick={clearSearch} style={tagStyles.clearButton}>
                ×
              </button>
            )}
          </div>
        </div>
        <div style={tagStyles.headerRight}>
          {/* Additional controls */}
        </div>
      </div>
      
      {/* Note tag sync display */}
      {showingNoteTags && (
        <div style={tagStyles.noteTagContainer}>
          <h3 style={tagStyles.noteTagTitle}>Tags in: {currentNoteName}</h3>
          {currentNoteTags.length > 0 ? (
            <ul style={tagStyles.tagList}>
              {currentNoteTags.map((tag, index) => (
                <li key={index}>
                  <button onClick={() => handleTagClick(tag)} style={tagStyles.tagButton}>
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tags found in this note.</p>
          )}
        </div>
      )}
      
      {/* Back navigation */}
      <div style={{ marginBottom: "10px" }}>
        {!showingUntaggedNotes && currentPath.length > 0 && (
          <button onClick={() => setCurrentPath(prev => prev.slice(0, -1))} style={tagStyles.backButton}>
            ← Back
          </button>
        )}
        {showingUntaggedNotes && (
          <button onClick={() => setShowingUntaggedNotes(false)} style={tagStyles.backButton}>
            ← Back to Browser
          </button>
        )}
      </div>
      
      {/* List of tags and notes using sortedItems */}
      {sortedItems.length > 0 ? (
        <>
          <h3>
            {renderTagPath()}
            {!showingUntaggedNotes && searchTerm && ` (filtered by "${searchTerm}")`}
          </h3>
          <ul style={{
            ...tagStyles.list,
            padding: "4px",
            margin: 0,
            listStyleType: "none"
          }}>
            {sortedItems.map((item, index) => {
              const itemKey = `${item.type}-${item.id}`;
              const isHovered = hoveredItem === itemKey;
              const isDragging = dragItem && dragItem.item && dragItem.item.id === item.id && dragItem.item.type === item.type;
              return (
                <li 
                  key={itemKey}
                  className="tag-browser-item"
                  draggable={!showingUntaggedNotes}
                  onDragStart={(e) => {
                    setDragItem({item, index});
                    setDragPosition(index);
                    e.dataTransfer.effectAllowed = "move";
                    if (item.type === 'tag') {
                      e.dataTransfer.setData("text/plain", `#${[...currentPath, item.tagKey].join("/")}`);
                    } else {
                      const notePath = item.note?.$path || "";
                      e.dataTransfer.setData("text/plain", notePath.includes("PERMANENT") 
                        ? `[[PERMANENT/${item.label}]]` 
                        : `[[${item.label}]]`
                      );
                    }
                    const emptyImg = new Image();
                    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    e.dataTransfer.setDragImage(emptyImg, 0, 0);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (throttleTimerRef.current) return;
                    throttleTimerRef.current = setTimeout(() => {
                      throttleTimerRef.current = null;
                      if (dragPosition !== index) {
                        setDragPosition(index);
                        setDragOverItem({item, index});
                      }
                    }, 100);
                  }}
                  onDragLeave={(e) => {}}
                  onDragEnd={(e) => {
                    if (throttleTimerRef.current) {
                      clearTimeout(throttleTimerRef.current);
                      throttleTimerRef.current = null;
                    }
                    setDragItem(null);
                    setDragOverItem(null);
                    setDragPosition(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (throttleTimerRef.current) {
                      clearTimeout(throttleTimerRef.current);
                      throttleTimerRef.current = null;
                    }
                    setDragItem(null);
                    setDragOverItem(null);
                    setDragPosition(null);
                  }}
                  onMouseEnter={() => setHoveredItem(itemKey)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    ...tagStyles.listItem,
                    backgroundColor: isDragging 
                      ? "var(--interactive-accent)" 
                      : isHovered && !dragItem
                        ? "var(--background-modifier-hover)" 
                        : "",
                    color: isDragging ? "var(--text-on-accent)" : "",
                    padding: "6px 8px",
                    borderRadius: "3px",
                    marginBottom: "4px",
                    transition: "background-color 0.15s ease",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: isDragging ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none",
                    transform: isDragging ? "scale(1.02)" : "scale(1)",
                    zIndex: isDragging ? "100" : "auto",
                  }}
                >
                  <span style={{ 
                    marginRight: "8px", 
                    fontSize: "14px",
                    color: isDragging 
                      ? "#ffffff" 
                      : item.type === 'tag' ? "#8b5cf6" : "#a0a0a0",
                    display: "flex",
                    alignItems: "center",
                  }}>
                    <dc.Icon icon={item.type === 'tag' ? 'folder' : 'file-text'} style={{ fontSize: "16px" }} />
                  </span>
                  <span 
                    style={{ 
                      flexGrow: 1,
                      color: isDragging 
                        ? "#ffffff" 
                        : "#e0e0e0",
                      fontWeight: isDragging ? "bold" : "normal",
                      fontSize: "14px",
                    }}
                    onClick={() => handleItemClick(item)}
                  >					
                    {item.displayText}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p>
          {showingUntaggedNotes
            ? "No untagged notes found in the PERMANENT folder."
            : searchTerm
              ? `No items found matching "${searchTerm}".`
              : "No tags or notes found here."}
        </p>
      )}
    </dc.Stack>
  );
}

// Export the View component as before
function ExampleUsage() {
  return <TagBrowser />;
}
function View({ app }) {
  return <ExampleUsage />;
}
return { View };

```

## ViewerStyles

```jsx
function getStyles() {
  return {
    // Container wrapping the entire TagBrowser view
    container: {
      padding: "20px",
      backgroundColor: "#0a0a0a",
      borderRadius: "0",
      minHeight: "100vh",
    },
    // Header area containing navigation and search controls
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      paddingBottom: "15px",
      borderBottom: "1px solid #1a1a1a",
    },
    // New left header section for grouped controls
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    // Right header section (can be used for other controls)
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    // Home button style (e.g. 🏠)
    homeButton: {
      cursor: "pointer",
      background: "#1a1a1a",
      color: "#a0a0a0",
      border: "1px solid #2a2a2a",
      borderRadius: "6px",
      padding: "6px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
    },
    // Sync button style (toggles tag syncing)
    syncButton: {
      cursor: "pointer",
      background: "#1a1a1a",
      color: "#a0a0a0",
      border: "1px solid #2a2a2a",
      borderRadius: "6px",
      padding: "6px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      transition: "all 0.2s ease",
      gap: "6px",
    },
    // Container for the search input and clear button
    searchContainer: {
      position: "relative",
    },
    // Search input style
    searchInput: {
      padding: "6px 30px 6px 12px",
      borderRadius: "6px",
      border: "1px solid #2a2a2a",
      backgroundColor: "#141414",
      color: "#e0e0e0",
      width: "200px",
      fontSize: "13px",
      transition: "border-color 0.2s ease",
    },
    // Clear search button style (the "×" button)
    clearButton: {
      position: "absolute",
      right: "8px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#666",
      padding: "0",
      fontSize: "18px",
      lineHeight: "1",
    },
    // Style for the untagged notes button (circular counter)
    untaggedButton: {
      cursor: "pointer",
      background: "#1a1a1a",
      color: "#ef4444",
      border: "1px solid #2a2a2a",
      borderRadius: "50%",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "12px",
      transition: "all 0.2s ease",
    },
    // New style for active state of untagged button
    untaggedButtonActive: {
      cursor: "pointer",
      background: "#8b5cf6",
      color: "#ffffff",
      border: "1px solid #8b5cf6",
      borderRadius: "50%",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "12px",
      transition: "all 0.2s ease",
    },
    // Container for showing note tags (sync mode)
    noteTagContainer: {
      padding: "15px",
      backgroundColor: "#141414",
      borderRadius: "8px",
      marginBottom: "20px",
      border: "1px solid #2a2a2a",
    },
    noteTagTitle: {
      margin: "0 0 12px 0",
      color: "#e0e0e0",
      fontSize: "14px",
      fontWeight: "500",
    },
    // List style for tags within the note tag container
    tagList: {
      listStyleType: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
    },
    // Style for each tag button in the tag list
    tagButton: {
      cursor: "pointer",
      background: "#1a1a1a",
      color: "#e0e0e0",
      border: "1px solid #2a2a2a",
      borderRadius: "6px",
      padding: "4px 10px",
      fontWeight: "500",
      fontSize: "12px",
      transition: "all 0.2s ease",
    },
    // Breadcrumb path styles
    breadcrumb: {
      // You can add container-specific styles here if needed.
    },
    breadcrumbButton: {
      cursor: "pointer",
      color: "#e0e0e0",
      fontWeight: "500",
      background: "none",
      border: "none",
      padding: "2px 6px",
      marginRight: "2px",
      textDecoration: "none",
      fontSize: "13px",
      borderRadius: "4px",
      lineHeight: "1.4",
      transition: "background-color 0.2s ease",
    },
    breadcrumbCurrent: {
      color: "#e0e0e0",
      fontWeight: "500",
      padding: "2px 6px",
      fontSize: "13px",
    },
    // Back button styles
    backButton: {
      padding: "6px 12px",
      background: "#1a1a1a",
      border: "1px solid #2a2a2a",
      borderRadius: "6px",
      cursor: "pointer",
      color: "#a0a0a0",
      fontSize: "13px",
      transition: "all 0.2s ease",
    },
    // List container for displaying tags and notes
    list: {
      listStyleType: "none",
      padding: 0,
      margin: 0,
    },
    // List item style
    listItem: {
      display: "flex",
      alignItems: "center",
      marginBottom: 0,
      justifyContent: "space-between",
      borderRadius: "6px",
      transition: "background-color 0.2s ease, transform 0.15s ease",
      cursor: "pointer",
      border: "1px solid transparent",
    },
    // Style to apply when an item is hovered
    listItemHover: {
      backgroundColor: "#1a1a1a",
      borderColor: "#2a2a2a",
    },
    // Style for move-up/move-down buttons next to list items
    moveButton: {
      cursor: "pointer",
      background: "#1a1a1a",
      border: "1px solid #2a2a2a",
      borderRadius: "6px",
      padding: "2px 8px",
      marginRight: "3px",
      color: "#a0a0a0",
      fontSize: "14px",
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
    },
  };
}
return { getStyles }
```


