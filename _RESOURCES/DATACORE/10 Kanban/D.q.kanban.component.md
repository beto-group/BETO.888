


# viewer



```jsx
// ======================================================
// Data Handler (from "KANBAN.component.v008.md" module)
// ======================================================
const componentFile = dc.resolvePath("D.q.kanban.component");

const { loadData, getData, setData } = await dc.require(
  dc.headerLink(componentFile, "FileEditor")
);


async function editFileSegment(filePath, originalSegment, newSegment) {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    throw new Error("File not found: " + filePath);
  }
  const fileContent = await app.vault.read(file);
  const index = fileContent.indexOf(originalSegment);
  if (index === -1) {
    throw new Error("Original segment not found in the file content.");
  }
  const updatedContent =
    fileContent.substring(0, index) +
    newSegment +
    fileContent.substring(index + originalSegment.length);
  await app.vault.modify(file, updatedContent);
  return updatedContent;
}

// ======================================================
// Settings & Helpers
// ======================================================
const initialSettings = {
  filesAsColumns: ["HEALTH.enigmas."],
  itemSeparatorPattern: '^[-]{3,}$',
  useRegexSeparator: true,
  placeholders: { itemContent: "Enter item content..." },
};

function removeMdExtension(filename) {
  const baseName = filename.split('/').pop();
  return baseName.replace(/\.md$/, "");
}


function parseFileContent(content) {
  // Find where the actual content starts (after #### AENIGMAS or ##### AENIGMAS)
  const aenigmasMatch = content.match(/#{4,5}\s*AENIGMAS/);
  
  let body = "";
  
  if (aenigmasMatch) {
    const markerEnd = aenigmasMatch.index + aenigmasMatch[0].length;
    body = content.substring(markerEnd);
  } else {
    // Fallback to old marker
    const headerMarker = "#### [[ENIGMAS]]";
    const markerIndex = content.indexOf(headerMarker);
    if (markerIndex !== -1) {
      body = content.substring(markerIndex + headerMarker.length);
    } else {
      body = content;
    }
  }
  
  // Split by --- (3 or more dashes)
  const parts = body.split(/\n\s*-{3,}\s*\n/);
  
  const sections = [];
  parts.forEach((part) => {
    const trimmed = part.trim();
    
    if (trimmed && trimmed.length > 0) {
      sections.push(trimmed);
    }
  });
  
  return sections;
}

async function removeEntryFromFile(item, sourceLane) {
  const filePath = sourceLane.id;
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) throw new Error("Source file not found: " + filePath);
  
  const fileContent = await app.vault.read(file);
  const index = fileContent.indexOf(item.originalSegment);
  if (index === -1) {
    throw new Error("Entry not found in source file.");
  }
  const updatedContent =
    fileContent.substring(0, index) +
    fileContent.substring(index + item.originalSegment.length);
  await app.vault.modify(file, updatedContent);
}

async function insertEntryIntoFile(entryContent, targetLane) {
  const filePath = targetLane.id;
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) throw new Error("Target file not found: " + filePath);
  
  const fileContent = await app.vault.read(file);
  const headerMarker = "#### [[ENIGMAS]]";
  const headerIndex = fileContent.indexOf(headerMarker);
  if (headerIndex === -1) {
    throw new Error("Header marker not found in target file.");
  }
  
  const insertionIndex = headerIndex + headerMarker.length;
  // Use the same formatting as original onAddItem (manual):
  const newEntryFormatted = `${entryContent.trim()}\n\n-----\n`;
  const newFileContent =
    fileContent.substring(0, insertionIndex) +
    newEntryFormatted +
    fileContent.substring(insertionIndex);
  
  await app.vault.modify(file, newFileContent);
  return newEntryFormatted;
}


async function onMoveItem(itemId, targetLaneId, items, lanes, setItems, onRemoveItem, onAddItem) {
  const item = items.find((it) => it.id === itemId);
  if (!item) return;
  // Remove the entry from the source file using existing logic.
  await onRemoveItem(itemId);
  // Add the entry to the target file.
  await onAddItem(targetLaneId, item.content);
}

function AddFileModal({ onClose, onSubmit }) {
  const { useState, useEffect } = dc;
  const [sectionName, setSectionName] = useState("");
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const currentPath = dc.resolvePath("D.q.kanban.component");
  
  // Load files from _resources/KNOWLEDGE folder
  useEffect(() => {
    const loadKnowledgeFiles = async () => {
      // dc.resolvePath returns a string path to the component file
      const componentPath = dc.resolvePath("D.q.kanban.component");
      
      if (!componentPath) {
        console.warn('[Kanban] Could not resolve component path');
        return;
      }
      
      console.log('[Kanban] Component path:', componentPath);
      
      // Get the actual file object to access its parent folder
      const componentFile = dc.app.vault.getAbstractFileByPath(componentPath);
      if (!componentFile || !componentFile.parent) {
        console.warn('[Kanban] Could not get component file or parent folder');
        return;
      }
      
      const componentFolder = componentFile.parent;
      console.log('[Kanban] Component folder:', componentFolder.path);
      
      // Build path to _resources/KNOWLEDGE relative to component folder
      const knowledgePath = `${componentFolder.path}/_resources/example`;
      console.log('[Kanban] Knowledge path:', knowledgePath);
      
      // Check if the knowledge folder exists
      const knowledgeFolderExists = await dc.app.vault.adapter.exists(knowledgePath);
      console.log('[Kanban] Knowledge folder exists:', knowledgeFolderExists);
      
      if (!knowledgeFolderExists) {
        console.warn('[Kanban] Knowledge folder does not exist, creating it...');
        try {
          await dc.app.vault.adapter.mkdir(knowledgePath);
          console.log('[Kanban] ✓ Created knowledge folder');
        } catch (err) {
          console.error('[Kanban] Failed to create knowledge folder:', err);
        }
      }
      
      // Get all markdown files in the vault
      const allFiles = dc.app.vault.getMarkdownFiles();
      const knowledgeFiles = allFiles.filter(file => 
        file.path.startsWith(knowledgePath) && 
        file.extension === 'md'
      );
      
      console.log('[Kanban] Found', knowledgeFiles.length, 'knowledge files');
      setKnowledgeFiles(knowledgeFiles);
    };
    
    loadKnowledgeFiles();
  }, []);
  
  const handleSubmit = () => {
    if (sectionName.trim()) {
      onSubmit(sectionName.trim());
      setSectionName("");
      onClose();
    }
  };
  
  const handleQuickAdd = (filePath) => {
    onSubmit(filePath);
    onClose();
  };
  
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.85)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        backgroundColor: "#0a0a0a",
        padding: "24px", 
        borderRadius: "12px", 
        width: "420px",
        maxHeight: "80vh",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        boxShadow: "0 8px 32px rgba(139, 92, 246, 0.2)",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        <h3 style={{
          margin: "0",
          color: "#8b5cf6",
          fontFamily: "monospace",
          fontSize: "18px",
          fontWeight: "600",
          letterSpacing: "0.5px"
        }}>+ Add Column</h3>
        
        {/* Quick Add Section */}
        {knowledgeFiles.length > 0 && (
          <div>
            <div style={{
              color: "#888",
              fontFamily: "monospace",
              fontSize: "12px",
              marginBottom: "8px",
              letterSpacing: "0.5px"
            }}>⚡ QUICK ADD</div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxHeight: "200px",
              overflowY: "auto",
              padding: "4px"
            }}>
              {knowledgeFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleQuickAdd(file.path)}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#000000",
                    color: "#e0e0e0",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
                    e.target.style.borderColor = "rgba(139, 92, 246, 0.4)";
                    e.target.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#000000";
                    e.target.style.borderColor = "rgba(139, 92, 246, 0.2)";
                    e.target.style.transform = "translateX(0)";
                  }}
                >
                  <span style={{ color: "#8b5cf6" }}>→</span>
                  {file.basename}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Divider */}
        <div style={{
          height: "1px",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
        }}></div>
        
        {/* Manual Input Section */}
        <div>
          <div style={{
            color: "#888",
            fontFamily: "monospace",
            fontSize: "12px",
            marginBottom: "8px",
            letterSpacing: "0.5px"
          }}>✍️ CUSTOM NAME</div>
          <input
            type="text"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="Section Name (e.g., HEALTH)"
            style={{ 
              width: "100%", 
              padding: "12px", 
              backgroundColor: "#000000",
              color: "#e0e0e0",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "8px",
              outline: "none",
              fontFamily: "monospace",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.target.style.borderColor = "rgba(139, 92, 246, 0.4)"}
            onBlur={(e) => e.target.style.borderColor = "rgba(139, 92, 246, 0.2)"}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button 
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(139, 92, 246, 0.05)",
              color: "#888",
              border: "1px solid rgba(139, 92, 246, 0.1)",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "13px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
              e.target.style.color = "#aaa";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(139, 92, 246, 0.05)";
              e.target.style.color = "#888";
            }}
          >Cancel</button>
          <button 
            onClick={handleSubmit}
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(139, 92, 246, 0.2)",
              color: "#8b5cf6",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(139, 92, 246, 0.3)";
              e.target.style.borderColor = "rgba(139, 92, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
              e.target.style.borderColor = "rgba(139, 92, 246, 0.3)";
            }}
          >Submit</button>
        </div>
      </div>
    </div>
  );
}

function EditableItem({ item, onUpdate, onRemove, onDragStart, onDragEnd, onDropBefore, isDragging, draggedItemId }) {
  const { useState, useEffect, useRef } = dc;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const dragOverTimeout = useRef(null);
  
  useEffect(() => { 
    setContent(item.content); 
  }, [item.content]);
  
  // Reset drag over state when dragging stops globally
  useEffect(() => {
    if (!isDragging && isDragOver) {
      setIsDragOver(false);
    }
  }, [isDragging]);
  
  const handleSave = () => {
    setIsEditing(false);
    if (content !== item.content) {
      onUpdate(item.id, content);
    }
  };
  
  const isBeingDragged = draggedItemId === item.id;
  
  return (
    <div 
      style={{ 
        position: "relative", 
        // Smooth expansion with larger space
        paddingTop: isDragOver ? "190px" : "0px",
        marginBottom: "12px",
        transition: "padding-top 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        // Make dragged item transparent but DON'T collapse height yet
        opacity: isBeingDragged ? 0.2 : 1,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Drop zone - larger area for easier targeting */}
      <div
        style={{
          position: "absolute",
          top: "-24px",
          left: "0",
          right: "0",
          height: "48px",
          zIndex: 10,
          pointerEvents: isDragging ? "auto" : "none", // Only active when dragging
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isEditing && isDragging && !isBeingDragged) {
            setIsDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Longer timeout to prevent flickering
          if (dragOverTimeout.current) {
            clearTimeout(dragOverTimeout.current);
          }
          dragOverTimeout.current = setTimeout(() => {
            setIsDragOver(false);
          }, 100);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Clear any pending timeout when entering
          if (dragOverTimeout.current) {
            clearTimeout(dragOverTimeout.current);
            dragOverTimeout.current = null;
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (dragOverTimeout.current) {
            clearTimeout(dragOverTimeout.current);
          }
          setIsDragOver(false);
          onDropBefore(e, item.id);
        }}
      />
      
      {/* Placeholder space indicator when dragging over */}
      {isDragOver && (
        <div style={{
          position: "absolute",
          top: "0px",
          left: "4px",
          right: "4px",
          height: "175px",
          backgroundColor: "rgba(139, 92, 246, 0.08)",
          border: "2px dashed rgba(139, 92, 246, 0.6)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "8px",
          color: "#8b5cf6",
          fontSize: "16px",
          fontWeight: "700",
          fontFamily: "monospace",
          zIndex: 5,
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: "24px" }}>↓</div>
          <div>DROP HERE</div>
        </div>
      )}
      
      {/* The actual item */}
      <div
        data-item-card="true"
        data-item-id={item.id}
        draggable={!isEditing}
        onDragStart={(e) => {
          if (!isEditing) {
            e.stopPropagation(); // Prevent lane header from catching this
            onDragStart(e, item.id);
          } else {
            e.preventDefault();
          }
        }}
        onDragEnd={(e) => {
          if (onDragEnd) {
            onDragEnd(e);
          }
        }}
        onDragOver={(e) => {
          // Stop drag over from affecting this card
          e.stopPropagation();
        }}
        style={{
          backgroundColor: "#0a0a0a",
          borderRadius: "8px",
          border: isHovering && !isEditing
              ? "1px solid rgba(139, 92, 246, 0.4)" 
              : "1px solid rgba(139, 92, 246, 0.15)",
          position: "relative",
          minHeight: "60px",
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          cursor: isEditing ? "text" : "grab",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Subtle drag indicator corner - only show when hovering and not editing */}
        {!isEditing && isHovering && (
          <div style={{
            position: "absolute",
            top: "6px",
            right: "40px",
            color: "rgba(139, 92, 246, 0.6)",
            fontSize: "14px",
            lineHeight: "1",
            pointerEvents: "none",
            zIndex: 1,
            transition: "opacity 0.2s ease",
          }}>
            ⋮⋮
          </div>
        )}
        
        {/* Content Area */}
        <div style={{ padding: "12px", flex: 1 }}
          onDoubleClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              autoFocus
              style={{
                width: "100%",
                height: "150px",
                overflowY: "auto",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "6px",
                outline: "none",
                backgroundColor: "#000000",
                color: "#e0e0e0",
                whiteSpace: "pre-wrap",
                padding: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            />
          ) : (
            <div 
              style={{ 
                height: "150px", 
                width: "100%", 
                overflowY: "auto", 
                whiteSpace: "pre-wrap",
                color: "#d0d0d0",
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              {item.content || "No content found"}
            </div>
          )}
        </div>
        
        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "4px",
            cursor: "pointer",
            color: "#8b5cf6",
            fontSize: "16px",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(220, 38, 38, 0.2)";
            e.target.style.borderColor = "rgba(220, 38, 38, 0.4)";
            e.target.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
            e.target.style.borderColor = "rgba(139, 92, 246, 0.2)";
            e.target.style.color = "#8b5cf6";
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}


function Lane({
  lane,
  items,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  isDragging,
  draggedItemId,
  onLaneDragStart,
  onAddItem,
  onRemoveLane,
  onRemoveItem,
  onUpdateItem,
  onDropBefore,
  placeholders,
  onLaneDragOver,
  onLaneDrop,
}) {
  const { useState, useEffect, useRef } = dc;
  const [newItemContent, setNewItemContent] = useState("");
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const scrollRef = useRef(null);
  const prevItemsCount = useRef(items.length);
  
  useEffect(() => {
    if (scrollRef.current) {
      if (lane.editor && items.length > prevItemsCount.current) {
        scrollRef.current.scrollTop = 0;
      } else if (!lane.editor && items.length > prevItemsCount.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    prevItemsCount.current = items.length;
  }, [items, lane.editor]);
  
  return (
    <div
      onDragOver={onLaneDragOver}
      onDrop={onLaneDrop}
      style={{
        width: "320px",
        height: "100%",
        flexShrink: 0,
        backgroundColor: "#0a0a0a",
        margin: "0",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(139, 92, 246, 0.1)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
        overflow: "hidden",
      }}
    >
      <div
        draggable
        onDragStart={(e) => {
          if (onLaneDragStart) {
            onLaneDragStart(e, lane.id);
          }
        }}
        onDragEnd={(e) => {
          // Clear the dragged lane ref when done
          if (onLaneDragStart) {
            e.stopPropagation();
          }
        }}
        style={{
          padding: "16px",
          borderBottom: "1px solid rgba(139, 92, 246, 0.1)",
          textAlign: "left",
          fontWeight: "600",
          position: "relative",
          color: "#e0e0e0",
          fontSize: "14px",
          letterSpacing: "0.5px",
          fontFamily: "monospace",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "grab",
        }}
      >
        <span style={{ pointerEvents: "none" }}>{lane.title}</span>
        <button
          onClick={() => onRemoveLane(lane.id)}
          onMouseDown={(e) => e.stopPropagation()}
          draggable={false}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(139, 92, 246, 0.4)",
            fontSize: "18px",
            padding: "4px",
            lineHeight: "1",
            transition: "color 0.2s ease",
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) => e.target.style.color = "#8b5cf6"}
          onMouseLeave={(e) => e.target.style.color = "rgba(139, 92, 246, 0.4)"}
        >
          ×
        </button>
      </div>
      <div ref={scrollRef} className="kanban-scrollbar" style={{ 
        flex: 1, 
        overflowY: "auto",
        overflowX: "hidden",
        padding: "12px",
        paddingBottom: "12px",
        minHeight: 0,
        maxHeight: "100%",
      }}>
        {items.map((item, index) => {
          return (
            <EditableItem 
              key={item.id} 
              item={item} 
              onUpdate={onUpdateItem} 
              onRemove={onRemoveItem} 
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={isDragging}
              draggedItemId={draggedItemId}
              onDropBefore={(e, beforeItemId) => {
                onDropBefore(e, lane.id, beforeItemId);
              }}
            />
          );
        })}
        {/* Drop zone at the end of the list */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropZoneActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropZoneActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropZoneActive(false);
            onDrop(e, lane.id, null);
          }}
          style={{
            height: isDropZoneActive ? "40px" : "20px",
            backgroundColor: isDropZoneActive ? "rgba(139, 92, 246, 0.2)" : "transparent",
            border: isDropZoneActive ? "2px dashed rgba(139, 92, 246, 0.6)" : "none",
            borderRadius: "6px",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8b5cf6",
            fontSize: "11px",
            fontFamily: "monospace",
            fontWeight: "600",
            marginTop: "8px",
          }}
        >
          {isDropZoneActive && "↓ DROP AT END"}
        </div>
      </div>
      <div
        style={{
          flexShrink: 0,
          padding: "12px",
          borderTop: "1px solid rgba(139, 92, 246, 0.1)",
          backgroundColor: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
        }}
      >
        <textarea
          value={newItemContent}
          onChange={(e) => setNewItemContent(e.target.value)}
          placeholder={placeholders.itemContent || "Add new item..."}
          style={{
            padding: "10px",
            height: "48px",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "8px",
            backgroundColor: "#000000",
            color: "#e0e0e0",
            overflow: "auto",
            resize: "none",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "13px",
            outline: "none",
          }}
          onFocus={(e) => e.target.style.borderColor = "rgba(139, 92, 246, 0.4)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(139, 92, 246, 0.2)"}
        />
        <button
          onClick={() => {
            if (newItemContent.trim()) {
              // Manual addition uses the original formatting.
              onAddItem(lane.id, newItemContent);
              setNewItemContent("");
            }
          }}
          style={{ 
            padding: "10px", 
            cursor: "pointer",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            color: "#8b5cf6",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            borderRadius: "8px",
            fontWeight: "500",
            fontSize: "13px",
            fontFamily: "monospace",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
            e.target.style.borderColor = "rgba(139, 92, 246, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
            e.target.style.borderColor = "rgba(139, 92, 246, 0.2)";
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ======================================================
// DOM Traversal Utilities (from BasicView v2)
// ======================================================
function findNearestAncestorWithClass(element, className) {
  if (!element) return null;
  let current = element.parentNode;
  while (current) {
    if (current.classList && current.classList.contains(className)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function findDirectChildByClass(parent, className) {
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.classList && child.classList.contains(className)) {
      return child;
    }
  }
  return null;
}

// ======================================================
// Main View Component
// ======================================================
function View({ initialSettingsOverride = {} }) {
  const { useState, useMemo, useEffect, useRef } = dc;
  const mergedSettings = useMemo(() => ({ ...initialSettings, ...initialSettingsOverride }), [initialSettingsOverride]);
  const { filesAsColumns, placeholders } = mergedSettings;
  
  // Full-tab mode state
  const [isFullTab, setIsFullTab] = useState(true);
  const mainContainerRef = useRef(null);
  const stateRefs = useRef({}).current;
  
  // Global drag state to track when any item is being dragged
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState(null);
  
  // No auto-loading from query - we rely on cache instead
  const [files, setFiles] = useState([]);
  
  // Full-tab DOM manipulation effect (from BasicView v2)
  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container || !isFullTab) return;
    
    const targetPaneContent = findNearestAncestorWithClass(
      container,
      "workspace-leaf-content"
    );
    if (!targetPaneContent) return;
    
    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;
    
    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement("div");
    stateRefs.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.placeholder, container);
    
    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    if (stateRefs.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }
    
    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      backgroundColor: "var(--background-primary)",
      overflow: "auto",
    });
    
    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(
          container,
          stateRefs.placeholder
        );
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static"
            ? ""
            : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);
  
  // Hide status bar at bottom right when in full-tab mode
  useEffect(() => {
    if (!isFullTab) return;
    
    const statusBar = document.querySelector('body > .app-container .status-bar');
    if (statusBar) {
      const originalDisplay = statusBar.style.display;
      statusBar.style.display = 'none';
      
      return () => {
        const statusBarToRestore = document.querySelector('body > .app-container .status-bar');
        if (statusBarToRestore) {
          statusBarToRestore.style.display = originalDisplay;
        }
      };
    }
  }, [isFullTab]);
  
  // State for lanes and items - will be loaded from cache
  const [lanes, setLanes] = useState([]);
  const [items, setItems] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  
  const lanesContainerRef = useRef(null);
  const prevLanesCount = useRef(lanes.length);
  
  useEffect(() => {
    // Only auto-scroll when adding new lanes, not when reordering
    if (lanesContainerRef.current && lanes.length > prevLanesCount.current) {
      lanesContainerRef.current.scrollLeft = lanesContainerRef.current.scrollWidth;
    }
    prevLanesCount.current = lanes.length;
  }, [lanes]);
  
  // Auto-save kanban state to cache whenever lanes or items change
  useEffect(() => {
    const saveToCache = async () => {
      const folderPath = ".datacore/dc.kanban";
      const cacheFileName = "kanban-cache.json";
      const fullPath = `${folderPath}/${cacheFileName}`;
      
      // Save lanes with their order preserved
      const kanbanData = {
        lanes: lanes.map((lane, index) => ({ ...lane, order: index })),
        items: items,
        timestamp: Date.now(),
      };
      
      try {
        const adapter = app.vault.adapter;
        if (!adapter) return;
        
        const folderExists = await adapter.exists(folderPath);
        if (!folderExists) {
          await adapter.mkdir(folderPath);
        }
        
        await adapter.write(fullPath, JSON.stringify(kanbanData, null, 2));
      } catch (error) {
        console.error("Error auto-saving kanban:", error);
      }
    };
    
    // Only save if we have lanes (avoid saving empty initial state)
    if (lanes.length > 0) {
      saveToCache();
    }
  }, [lanes, items]);
  
  // Load kanban state from cache on mount
  useEffect(() => {
    const loadFromCache = async () => {
      const folderPath = ".datacore/dc.kanban";
      const cacheFileName = "kanban-cache.json";
      const fullPath = `${folderPath}/${cacheFileName}`;
      
      try {
        const adapter = app.vault.adapter;
        if (!adapter) return;
        
        const fileExists = await adapter.exists(fullPath);
        if (!fileExists) return;
        
        const content = await adapter.read(fullPath);
        const kanbanData = JSON.parse(content);
        
        // Restore lanes in their saved order
        if (kanbanData.lanes) {
          const sortedLanes = [...kanbanData.lanes].sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : 999;
            const orderB = b.order !== undefined ? b.order : 999;
            return orderA - orderB;
          });
          setLanes(sortedLanes);
        }
        if (kanbanData.items) setItems(kanbanData.items);
      } catch (error) {
        console.error("Error loading kanban from cache:", error);
      }
    };
    
    loadFromCache();
  }, []); // Run once on mount
  
  const draggedLaneIdRef = useRef(null);
  const onLaneDragStart = (e, laneId) => {
    e.stopPropagation();
    draggedLaneIdRef.current = laneId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("laneId", laneId);
  };
  const onLaneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };
  const onLaneDrop = (e, targetLaneId) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedLaneId = draggedLaneIdRef.current;
    if (!draggedLaneId || draggedLaneId === targetLaneId) {
      draggedLaneIdRef.current = null;
      return;
    }
    
    // Save current scroll position
    const currentScrollLeft = lanesContainerRef.current?.scrollLeft || 0;
    
    setLanes((prev) => {
      const draggedIndex = prev.findIndex((l) => l.id === draggedLaneId);
      const targetIndex = prev.findIndex((l) => l.id === targetLaneId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const newLanes = [...prev];
      const [draggedLane] = newLanes.splice(draggedIndex, 1);
      newLanes.splice(targetIndex, 0, draggedLane);
      return newLanes;
    });
    
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      if (lanesContainerRef.current) {
        lanesContainerRef.current.scrollLeft = currentScrollLeft;
      }
    });
    
    draggedLaneIdRef.current = null;
  };
  
  const onDragStart = (e, itemId) => {
    e.dataTransfer.setData("itemId", itemId);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    setDraggedItemId(itemId);
  };
  const onDragEnd = (e) => {
    setIsDragging(false);
    setDraggedItemId(null);
  };
  const onDragOver = (e) => {
    e.preventDefault();
  };
  
  // Handle dropping before a specific item
  const onDropBefore = async (e, laneId, beforeItemId) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDraggedItemId(null);
    
    const itemId = e.dataTransfer.getData("itemId");
    
    const item = items.find((it) => it.id === itemId);
    if (!item) {
      return;
    }
    
    
    const sourceLane = lanes.find((l) => l.id === item.laneId);
    const targetLane = lanes.find((l) => l.id === laneId);
    
    // Reorder within the same lane
    if (item.laneId === laneId) {
      const currentLaneItems = items.filter(it => it.laneId === laneId);
      currentLaneItems.forEach((it, idx) => {
      });
      
      setItems((prev) => {
        const laneItemsBefore = prev.filter(it => it.laneId === laneId);
        laneItemsBefore.forEach((it, idx) => {
        });
        
        const laneItems = prev.filter(it => it.laneId === laneId);
        const otherItems = prev.filter(it => it.laneId !== laneId);
        
        const draggedItem = laneItems.find(it => it.id === itemId);
        const remainingItems = laneItems.filter(it => it.id !== itemId);
        
        remainingItems.forEach((it, idx) => {
        });
        
        const beforeIndex = remainingItems.findIndex(it => it.id === beforeItemId);
        
        if (beforeIndex === -1) {
          remainingItems.push(draggedItem);
        } else {
          remainingItems.splice(beforeIndex, 0, draggedItem);
        }
        
        remainingItems.forEach((it, idx) => {
        });
        
        const finalItems = [...otherItems, ...remainingItems];
        return finalItems;
      });

      
      // If file-backed, update the file order
      // We need to use the updated state, so we get it from the setItems callback
      if (targetLane && targetLane.editor) {
        
        // Get the new order from the state we just set
        setItems((currentItems) => {
          const updatedLaneItems = currentItems.filter(it => it.laneId === laneId);
          updatedLaneItems.forEach((it, idx) => {
          });
          
          // Sync to file asynchronously
          (async () => {
            try {
              await reorderItemsInFile(laneId, updatedLaneItems);
            } catch (error) {
              console.error("❌ Error reordering items in file:", error);
              console.error("Stack:", error.stack);
            }
          })();
          
          // Return unchanged to not trigger another render
          return currentItems;
        });
      }
      return;
    }
    
    // Moving to a different lane
    
    // Update state immediately for smooth UX
    setItems((prev) => {
      const otherItems = prev.filter(it => it.id !== itemId);
      const laneItems = otherItems.filter(it => it.laneId === laneId);
      const nonLaneItems = otherItems.filter(it => it.laneId !== laneId);
      
      const movedItem = { ...item, laneId };
      const beforeIndex = laneItems.findIndex(it => it.id === beforeItemId);
      
      
      if (beforeIndex === -1) {
        laneItems.push(movedItem);
      } else {
        laneItems.splice(beforeIndex, 0, movedItem);
      }
      
      return [...nonLaneItems, ...laneItems];
    });
    
    // If both lanes are file-backed, update the files
    // NOTE: State is already updated above, so we only need to sync files
    if (sourceLane && targetLane && sourceLane.editor && targetLane.editor) {
      // Wait for React to update state, then sync files
      setTimeout(async () => {
        try {
          // Get the updated items from state
          setItems((currentItems) => {
            // Sync both files with the correct order
            (async () => {
              try {
                // 1. Write target file with new order
                const updatedTargetLaneItems = currentItems.filter(it => it.laneId === laneId);
                await reorderItemsInFile(laneId, updatedTargetLaneItems);
                
                // 2. Write source file with item removed
                const updatedSourceLaneItems = currentItems.filter(it => it.laneId === sourceLane.id);
                await reorderItemsInFile(sourceLane.id, updatedSourceLaneItems);
                
              } catch (error) {
                console.error("❌ Error syncing files:", error);
              }
            })();
            
            return currentItems; // Don't modify state
          });
        } catch (error) {
          console.error("Error in file sync:", error);
        }
      }, 0);
    }
  };
  
  // onDrop for items: if both lanes are file-backed, use onMoveItem; otherwise, update state.
  const onDrop = async (e, laneId, beforeItemId) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDraggedItemId(null);
    
    if (beforeItemId) {
      return onDropBefore(e, laneId, beforeItemId);
    }
    
    const itemId = e.dataTransfer.getData("itemId");
    const item = items.find((it) => it.id === itemId);
    if (!item) {
      return;
    }
    
    
    // If dropping into the same lane at the end, do nothing
    if (item.laneId === laneId) {
      return;
    }
    
    const sourceLane = lanes.find((l) => l.id === item.laneId);
    const targetLane = lanes.find((l) => l.id === laneId);
    
    
    // Update state immediately for smooth UX
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, laneId } : it))
    );
    
    // If both lanes are file-backed, update the files
    if (sourceLane && targetLane && sourceLane.editor && targetLane.editor) {
      try {
        // First add to target file
        await onAddItem(laneId, item.content);
        // Then remove from source file
        await onRemoveItem(itemId);
      } catch (error) {
        console.error("❌ onDrop: Error moving entry between files:", error);
        console.error("Stack:", error.stack);
        // Revert state on error
        setItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, laneId: item.laneId } : it))
        );
      }
    } else {
    }
  };
  
  // onAddItem, onRemoveItem, onUpdateItem, onRemoveLane, addFile as in original v008 code.
  const onAddItem = async (laneId, content, options = {}) => {
    if (!content.trim()) return;
    const lane = lanes.find((l) => l.id === laneId);
    if (lane && lane.editor) {
      const filePath = lane.id;
      const file = app.vault.getAbstractFileByPath(filePath);
      if (!file) {
        console.error("❌ onAddItem: File not found:", filePath);
        return;
      }
      try {
        const fileContent = await app.vault.read(file);
        
        const lines = fileContent.split("\n");
        
        // Look for AENIGMAS header (with various formats)
        const headerIndex = lines.findIndex((line) => {
          const normalized = line.trim();
          const matches = normalized.match(/#{4,5}\s*AENIGMAS/) || 
                 normalized.includes("#### [[ENIGMAS]]") ||
                 normalized.includes("##### [[ENIGMAS]]");
          return matches;
        });
        
        if (headerIndex === -1) {
          console.error("❌ onAddItem: Header marker not found in file:", filePath);
          console.error("First 20 lines of file:");
          lines.slice(0, 20).forEach((line, idx) => {
            console.error(`  Line ${idx}: "${line}"`);
          });
          console.error("\n🔍 Searching for AENIGMAS patterns...");
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes('aenigmas') || line.toLowerCase().includes('enigmas')) {
              console.error(`  Found at line ${idx}: "${line}"`);
            }
          });
          return;
        }
        
        
        let insertionIndex = headerIndex + 1;
        while (insertionIndex < lines.length && lines[insertionIndex].trim() === "") {
          insertionIndex++;
        }
        
        
        // Always use the same formatting as v008 manual add.
        const newEntryFormatted = `${content.trim()}\n\n-----\n`;
        lines.splice(insertionIndex, 0, newEntryFormatted);
        const newFileContent = lines.join("\n");
        await app.vault.modify(file, newFileContent);
        
        const newItem = {
          id: `item_${Date.now()}`,
          content: content.trim(),
          laneId,
          sectionIndex: 0,
          originalSegment: newEntryFormatted,
        };
        setItems((prev) => {
          const newItems = [...prev];
          const laneIndices = newItems.reduce((acc, item, idx) => {
            if (item.laneId === laneId) acc.push(idx);
            return acc;
          }, []);
          if (laneIndices.length > 0) {
            newItems.splice(laneIndices[0], 0, newItem);
          } else {
            newItems.push(newItem);
          }
          return newItems;
        });
      } catch (error) {
        console.error("❌ onAddItem: Error adding new entry to file:", error);
        console.error("Stack:", error.stack);
      }
    } else {
      const newItem = {
        id: `item_${Date.now()}`,
        content: content.trim(),
        laneId,
      };
      setItems((prev) => [...prev, newItem]);
    }
  };
  
  const onAddItemAt = async (laneId, content, beforeItemId) => {
    if (!content.trim()) return;
    const lane = lanes.find((l) => l.id === laneId);
    
    if (lane && lane.editor) {
      const filePath = lane.id;
      const file = app.vault.getAbstractFileByPath(filePath);
      if (!file) {
        console.error("❌ onAddItemAt: File not found:", filePath);
        return;
      }
      try {
        // Get current items in this lane from state (already in correct order)
        const currentLaneItems = items.filter(it => it.laneId === laneId);
        
        // Find the index where we want to insert
        const beforeIndex = currentLaneItems.findIndex(it => it.id === beforeItemId);
        
        // Create new item
        const newItem = {
          id: `${laneId}__new__${Date.now()}`,
          content: content.trim(),
          laneId: laneId,
        };
        
        // Insert into the array at the correct position
        const newLaneItems = [...currentLaneItems];
        if (beforeIndex === -1) {
          newLaneItems.push(newItem);
        } else {
          newLaneItems.splice(beforeIndex, 0, newItem);
        }
        
        // Now rewrite the entire file with the new order
        await reorderItemsInFile(laneId, newLaneItems);
        
      } catch (error) {
        console.error("❌ onAddItemAt: Error:", error);
      }
    }
  };
  
  const reorderItemsInFile = async (laneId, laneItemsToWrite) => {
    const lane = lanes.find((l) => l.id === laneId);
    if (!lane || !lane.editor) {
      return;
    }
    
    const filePath = lane.id;
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      return;
    }
    
    try {
      
      // Use the items passed in (from updated state) instead of stale closure
      const laneItems = laneItemsToWrite;
      laneItems.forEach((item, idx) => {
      });
      
      // Read the file
      const fileContent = await app.vault.read(file);
      const lines = fileContent.split("\n");
      
      // Find header
      const headerIndex = lines.findIndex((line) => {
        const normalized = line.trim();
        return normalized.match(/#{4,5}\s*AENIGMAS/) || 
               normalized.includes("#### [[ENIGMAS]]") ||
               normalized.includes("##### [[ENIGMAS]]");
      });
      
      if (headerIndex === -1) {
        return;
      }
      
      
      // Reconstruct the file with items in new order
      const header = lines.slice(0, headerIndex + 1).join("\n");
      const entries = laneItems.map((item, idx) => {
        const entry = `${item.content.trim()}\n\n-----\n`;
        return entry;
      }).join("\n");
      const newFileContent = header + "\n\n" + entries;
      
      await app.vault.modify(file, newFileContent);
    } catch (error) {
      console.error("❌ reorderItemsInFile: Error:", error);
      console.error("Stack:", error.stack);
    }
  };
  
  const onRemoveItem = async (itemId) => {
    const itemToRemove = items.find((it) => it.id === itemId);
    if (!itemToRemove) return;
    const lane = lanes.find((l) => l.id === itemToRemove.laneId);
    if (lane && lane.editor && itemToRemove.content) {
      const filePath = lane.id;
      const file = app.vault.getAbstractFileByPath(filePath);
      if (!file) {
        console.error("File not found:", filePath);
      } else {
        try {
          const fileContent = await app.vault.read(file);
          const lines = fileContent.split("\n");
          const contentFirstLine = itemToRemove.content.trim().split("\n")[0];
          let contentLineIndex = lines.findIndex((line) =>
            line.includes(contentFirstLine)
          );
          if (contentLineIndex === -1) {
            console.error("Entry content not found in file.");
          } else {
            let startIndex = contentLineIndex - 1;
            if (startIndex < 0) startIndex = 0;
            let endIndex = contentLineIndex;
            while (endIndex < lines.length && lines[endIndex].trim() !== "") {
              endIndex++;
            }
            while (endIndex < lines.length && lines[endIndex].trim() === "") {
              endIndex++;
            }
            if (endIndex < lines.length && /^[-]{3,}\s*$/.test(lines[endIndex])) {
              endIndex++;
              if (endIndex < lines.length) {
                endIndex++;
              }
            }
            lines.splice(startIndex, endIndex - startIndex);
            if (startIndex >= lines.length || lines[startIndex].trim() !== "") {
              lines.splice(startIndex, 0, "");
            }
            const newFileContent = lines.join("\n");
            await app.vault.modify(file, newFileContent);
          }
        } catch (error) {
          console.error("Error removing file block:", error);
        }
      }
    }
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };
  
  const onUpdateItem = async (itemId, newContent) => {
    const itemToUpdate = items.find((it) => it.id === itemId);
    if (!itemToUpdate) return;
    const lane = lanes.find((l) => l.id === itemToUpdate.laneId);
    if (lane && lane.editor && typeof itemToUpdate.sectionIndex === "number") {
      try {
        const filePath = lane.id;
        const originalSegment = itemToUpdate.originalSegment;
        await editFileSegment(filePath, originalSegment, newContent);
        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? { ...it, content: newContent, originalSegment: newContent }
              : it
          )
        );
      } catch (error) {
        console.error("Error updating file segment:", error);
      }
    } else {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId ? { ...it, content: newContent } : it
        )
      );
    }
  };
  
  const onRemoveLane = (laneId) => {
    setLanes((prev) => prev.filter((l) => l.id !== laneId));
    setItems((prev) => prev.filter((it) => it.laneId !== laneId));
  };
  
  const addFile = async (sectionName, isEditor = true) => {
  if (!sectionName.trim()) return;
  // Process the section name to create the expected file path.
  let filePath = sectionName.trim();
  
  // Only add extension if it doesn't already have .md
  if (!filePath.endsWith('.md')) {
    if (!filePath.includes(".enigmas.")) {
      filePath = `${filePath}.enigmas..md`;
    } else {
      // Already has .enigmas. but missing .md
      filePath = `${filePath}.md`;
    }
  }
  
  try {
    // Resolve the actual file to get the correct path
    // First, normalize the path (remove leading slash if present)
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    let file = app.vault.getAbstractFileByPath(normalizedPath);
    
    if (!file) {
      // Try by filename only
      const fileName = normalizedPath.split("/").pop();
      const markdownFiles = app.vault.getMarkdownFiles();
      file = markdownFiles.find((f) => f.name === fileName);
    }
    
    if (!file) {
      // Try by searching for files that end with this path
      const markdownFiles = app.vault.getMarkdownFiles();
      file = markdownFiles.find((f) => f.path.endsWith(normalizedPath));
    }
    
    if (!file) {
      return;
    }
    
    // Use the actual file path as lane ID
    const laneId = file.path;
    const fileName = removeMdExtension(file.name);
    const newLane = { id: laneId, title: fileName, editor: true };
    setLanes((prev) => [...prev, newLane]);
    
    // Load the file data using the FileEditor functions
    const { header, sections } = await loadData(file.path);
    
    const newItems = sections.map((sec, i) => ({
      id: `${laneId}__${i}__${Date.now()}`,
      content: sec.trim(),
      laneId: laneId,
      sectionIndex: i,
      originalSegment: sec,
    }));
    setItems((prev) => [...prev, ...newItems]);
  } catch (err) {
    console.error("addFile: Error loading file data for", filePath, ":", err);
  }
};



  
  // Track drop zone state
  const [isGlobalDropZone, setIsGlobalDropZone] = useState(false);
  const dropTimeoutRef = useRef(null);
  
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsGlobalDropZone(false);
    if (dropTimeoutRef.current) {
      clearTimeout(dropTimeoutRef.current);
      dropTimeoutRef.current = null;
    }
    
    let filePath = null;
    if (e.dataTransfer.files?.length > 0) {
      const file = e.dataTransfer.files[0];
      filePath = file.path || file.name;
    } else {
      const textData = e.dataTransfer.getData("text/plain");
      if (textData.startsWith("obsidian://")) {
        try {
          const url = new URL(textData);
          const fileParam = url.searchParams.get("file");
          if (fileParam) filePath = decodeURIComponent(fileParam);
        } catch (err) {
          console.error("Error parsing obsidian://", err);
        }
      } else {
        const match = textData.match(/\[\[(.*?)\]\]/);
        filePath = match && match[1] ? match[1] : textData;
      }
    }
    if (filePath) {
      addFile(filePath, filePath, true);
    }
    e.dataTransfer.clearData();
  };
  
  const handleGlobalDragOver = (e) => {
    // Don't show drop zone if we're dragging lanes or items
    if (draggedLaneIdRef.current || isDragging) {
      return;
    }
    
    // Check if we're dragging a file (not a kanban item)
    const types = Array.from(e.dataTransfer.types);
    const isDraggingFile = types.includes('Files') || types.includes('text/plain');
    
    if (isDraggingFile) {
      e.preventDefault();
      setIsGlobalDropZone(true);
      
      // Clear any existing timeout
      if (dropTimeoutRef.current) {
        clearTimeout(dropTimeoutRef.current);
      }
      
      // Set a new timeout to hide the drop zone
      dropTimeoutRef.current = setTimeout(() => {
        setIsGlobalDropZone(false);
      }, 100);
    }
  };
  
  const handleGlobalDragLeave = (e) => {
    // Only hide if we're leaving the main container
    if (e.target === e.currentTarget) {
      if (dropTimeoutRef.current) {
        clearTimeout(dropTimeoutRef.current);
      }
      dropTimeoutRef.current = setTimeout(() => {
        setIsGlobalDropZone(false);
      }, 100);
    }
  };
  
  return (
    <div ref={mainContainerRef} style={{ 
      position: "relative", 
      width: "100%", 
      height: isFullTab ? "100vh" : "66vh", 
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        .kanban-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .kanban-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .kanban-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
        .kanban-scrollbar::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        /* Debug overflow */
        * { box-sizing: border-box !important; }
      `}</style>
      
      {/* Full-tab toggle button */}
      {isFullTab && (
        <div style={{ position: "absolute", top: "20px", right: "24px", zIndex: 10 }}>
          <button
            onClick={() => setIsFullTab(false)}
            style={{
              padding: "10px",
              cursor: "pointer",
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              color: "#8b5cf6",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "8px",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
              e.target.style.borderColor = "rgba(139, 92, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
              e.target.style.borderColor = "rgba(139, 92, 246, 0.2)";
            }}
            title="Exit Full Tab"
          >
            <dc.Icon icon="minimize-2" />
          </button>
        </div>
      )}
      
      <div
        style={{
          display: "flex", 
          flexDirection: "column",
          backgroundColor: "#000000",
          color: "#e0e0e0", 
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ 
          padding: "24px", 
          display: "flex", 
          gap: "12px", 
          alignItems: "center",
          borderBottom: "1px solid rgba(139, 92, 246, 0.1)",
          backgroundColor: "#000000",
          flexShrink: 0,
          height: "auto",
        }}>
          <button 
            onClick={() => setShowModal(true)} 
            style={{ 
              padding: "12px 20px", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              color: "#8b5cf6",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "8px",
              fontWeight: "500",
              fontSize: "14px",
              transition: "all 0.2s ease",
              fontFamily: "monospace",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
              e.target.style.borderColor = "rgba(139, 92, 246, 0.4)";
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
              e.target.style.borderColor = "rgba(139, 92, 246, 0.2)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            <dc.Icon icon="plus-circle" />
            Add Column
          </button>
          {!isFullTab && (
            <button 
              onClick={() => setIsFullTab(true)} 
              style={{ 
                padding: "12px 20px", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                color: "#8b5cf6",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "14px",
                transition: "all 0.2s ease",
                fontFamily: "monospace",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
                e.target.style.borderColor = "rgba(139, 92, 246, 0.4)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
                e.target.style.borderColor = "rgba(139, 92, 246, 0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              <dc.Icon icon="maximize-2" />
              Enter Full Tab
            </button>
          )}
        </div>
        {showModal && (
          <AddFileModal onClose={() => setShowModal(false)} onSubmit={(fp, hs) => addFile(fp, hs, true)} />
        )}
        <div
          ref={lanesContainerRef}
          className="kanban-scrollbar"
          style={{
            display: "flex", 
            flexDirection: "row", 
            overflowX: "auto",
            overflowY: "hidden",
            padding: "24px",
            flex: 1,
            minHeight: 0,
            backgroundColor: "#000000",
            gap: "16px",
          }}
          onDragOver={handleGlobalDragOver}
          onDragLeave={handleGlobalDragLeave}
          onDrop={handleFileDrop}
        >
          {/* Global drop zone overlay - fixed to viewport */}
          {isGlobalDropZone && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              border: "3px dashed rgba(139, 92, 246, 0.6)",
              borderRadius: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "16px",
              zIndex: 1000,
              pointerEvents: "none",
              backdropFilter: "blur(4px)",
            }}>
              <div style={{
                fontSize: "48px",
                color: "#8b5cf6",
                animation: "pulse 2s ease-in-out infinite",
              }}>📁</div>
              <div style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#8b5cf6",
                fontFamily: "monospace",
                textAlign: "center",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}>
                DROP FILE TO ADD COLUMN
              </div>
              <div style={{
                fontSize: "14px",
                color: "rgba(139, 92, 246, 0.8)",
                fontFamily: "monospace",
              }}>
                Will be added to the end →
              </div>
            </div>
          )}
          
          {lanes.map((lane) => (
            <Lane
              key={lane.id}
              lane={lane}
              items={items.filter((it) => it.laneId === lane.id)}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={isDragging}
              draggedItemId={draggedItemId}
              onLaneDragStart={onLaneDragStart}
              onAddItem={onAddItem}
              onRemoveLane={onRemoveLane}
              onRemoveItem={onRemoveItem}
              onUpdateItem={onUpdateItem}
              onDropBefore={onDropBefore}
              placeholders={placeholders}
              onLaneDragOver={onLaneDragOver}
              onLaneDrop={(e) => onLaneDrop(e, lane.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// Export the Main View
// ======================================================
return { View };

```


# FileEditor

```jsx
// Use the parseFileContent from the View component above
// This wrapper extracts header and sections for the FileEditor functions
async function parseFileContentForEditor(content) {
  
  // Find AENIGMAS marker to separate header from content
  const aenigmasMatch = content.match(/#{4,5}\s*AENIGMAS/);
  
  let header = "";
  let bodyContent = content;
  
  if (aenigmasMatch) {
    const markerEnd = aenigmasMatch.index + aenigmasMatch[0].length;
    header = content.substring(0, markerEnd) + "\n\n";
    bodyContent = content.substring(markerEnd);
  } else {
    // Fallback to old marker
    const enigmasMarker = content.indexOf("#### [[ENIGMAS]]");
    if (enigmasMarker !== -1) {
      header = content.substring(0, enigmasMarker + "#### [[ENIGMAS]]".length) + "\n\n";
      bodyContent = content.substring(enigmasMarker + "#### [[ENIGMAS]]".length);
    }
  }
  
  // Parse sections using the same logic
  const parts = bodyContent.split(/\n\s*-{3,}\s*\n/);
  const sections = [];
  
  parts.forEach((part) => {
    const trimmed = part.trim();
    if (trimmed && trimmed.length > 0) {
      sections.push(trimmed);
    }
  });
  
  return { header, sections };
}

async function retrieveFileData(filePath) {
  // Normalize path (remove leading slash if present)
  const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  
  // Try direct path first
  let file = app.vault.getAbstractFileByPath(normalizedPath);
  
  if (!file) {
    // Try by filename only
    const fileName = normalizedPath.split("/").pop();
    const markdownFiles = app.vault.getMarkdownFiles();
    file = markdownFiles.find((f) => f.name === fileName);
  }
  
  if (!file) {
    // Try by searching for files that end with this path
    const markdownFiles = app.vault.getMarkdownFiles();
    file = markdownFiles.find((f) => f.path.endsWith(normalizedPath));
  }
  
  if (!file) {
    // Try by basename (without extension)
    const baseName = normalizedPath.split("/").pop().replace(/\.md$/, '');
    const markdownFiles = app.vault.getMarkdownFiles();
    file = markdownFiles.find((f) => f.basename === baseName);
  }
  
  if (!file) {
    throw new Error("retrieveFileData: File not found: " + filePath + " (normalized: " + normalizedPath + ")");
  }
  
  const content = await app.vault.read(file);
  return await parseFileContentForEditor(content);
}

let _header = "";
let _sections = [];

async function loadData(filePath) {
  const { header, sections } = await retrieveFileData(filePath);
  _header = header;
  _sections = sections;
  return { header, sections };
}

function getData() {
  return { header: _header, sections: _sections };
}

function setData(newData) {
  if (newData.header !== undefined) {
    _header = newData.header;
  }
  if (newData.sections !== undefined) {
    _sections = newData.sections;
  }
}

async function editFileSegment(filePath, originalSegment, newSegment) {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    throw new Error("File not found: " + filePath);
  }
  const fileContent = await app.vault.read(file);
  const index = fileContent.indexOf(originalSegment);
  if (index === -1) {
    throw new Error("Original segment not found in the file content.");
  }
  const updatedContent = fileContent.substring(0, index) + newSegment + fileContent.substring(index + originalSegment.length);
  await app.vault.modify(file, updatedContent);
  return updatedContent;
}

async function removeEntryFromFile(item, sourceLane) {
  const filePath = sourceLane.id;
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) throw new Error("Source file not found: " + filePath);
  const fileContent = await app.vault.read(file);
  const index = fileContent.indexOf(item.originalSegment);
  if (index === -1) {
    throw new Error("Entry not found in source file.");
  }
  const updatedContent = fileContent.substring(0, index) + fileContent.substring(index + item.originalSegment.length);
  await app.vault.modify(file, updatedContent);
}

async function insertEntryIntoFile(entryContent, targetLane) {
  const filePath = targetLane.id;
  
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    console.error("❌ insertEntryIntoFile: File not found:", filePath);
    throw new Error("Target file not found: " + filePath);
  }
  
  const fileContent = await app.vault.read(file);
  
  // Try multiple header patterns
  let headerIndex = -1;
  let headerMarker = "";
  
  // Try AENIGMAS patterns first
  const aenigmasMatch = fileContent.match(/#{4,5}\s*AENIGMAS/);
  if (aenigmasMatch) {
    headerIndex = aenigmasMatch.index;
    headerMarker = aenigmasMatch[0];
  } else {
    // Fallback to old marker
    headerMarker = "#### [[ENIGMAS]]";
    headerIndex = fileContent.indexOf(headerMarker);
    if (headerIndex !== -1) {
    }
  }
  
  if (headerIndex === -1) {
    console.error("❌ insertEntryIntoFile: Header marker not found in file:", filePath);
    console.error("First 500 chars of file:");
    console.error(fileContent.substring(0, 500));
    console.error("\n🔍 Searching for any header patterns:");
    const lines = fileContent.split("\n");
    lines.slice(0, 20).forEach((line, idx) => {
      if (line.includes('#') || line.toLowerCase().includes('enigma')) {
        console.error(`  Line ${idx}: "${line}"`);
      }
    });
    throw new Error("Header marker not found in target file.");
  }
  
  const insertionIndex = headerIndex + headerMarker.length;
  
  const newEntryFormatted = `${entryContent.trim()}\n\n-----\n`;
  const newFileContent = fileContent.substring(0, insertionIndex) + newEntryFormatted + fileContent.substring(insertionIndex);
  await app.vault.modify(file, newFileContent);
  
  return newEntryFormatted;
}

return { loadData, getData, setData, retrieveFileData, editFileSegment, removeEntryFromFile, insertEntryIntoFile };

```