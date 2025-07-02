


# viewer



```jsx
// ======================================================
// Data Handler (from "KANBAN.component.v008.md" module)
// ======================================================
const { loadData, getData, setData } = await dc.require(
  dc.headerLink("_OPERATION/PRIVATE/DATACORE/10 Kanban/D.q.kanban.component.md", "FileEditor")
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
  const headerMarker = "#### [[ENIGMAS]]";
  let body = content;
  const markerIndex = content.indexOf(headerMarker);
  if (markerIndex !== -1) {
    body = content.substring(markerIndex + headerMarker.length);
  }
  const sectionArray = body.split(/(\n\s*-{3,}\s*\n)/m);
  const sections = [];
  let currentSection = "";
  sectionArray.forEach((part) => {
    if (part.match(/^\n\s*-{3,}\s*\n$/)) {
      if (currentSection.trim() !== "" && currentSection.trim() !== "-----") {
        sections.push(currentSection.trim());
      }
      currentSection = "";
    } else {
      currentSection += part;
    }
  });
  if (currentSection.trim() !== "" && currentSection.trim() !== "-----") {
    sections.push(currentSection.trim());
  }
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
  const { useState } = dc;
  const [sectionName, setSectionName] = useState("");
  const handleSubmit = () => {
    if (sectionName.trim()) {
      onSubmit(sectionName.trim());
      setSectionName("");
      onClose();
    }
  };
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "var(--background-secondary)",
        padding: "20px", borderRadius: "5px", width: "300px",
        color: "var(--text-normal)"
      }}>
        <h3>Add New Section</h3>
        <input
          type="text"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder="Section Name (e.g., HEALTH)"
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}


function EditableItem({ item, onUpdate, onRemove, onDragStart }) {
  const { useState, useEffect } = dc;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  useEffect(() => { setContent(item.content); }, [item.content]);
  const handleSave = () => {
    setIsEditing(false);
    if (content !== item.content) {
      onUpdate(item.id, content);
    }
  };
  return (
    <div
      style={{
        padding: "10px",
        margin: "5px 0",
        backgroundColor: "var(--background-primary)",
        borderRadius: "3px",
        cursor: isEditing ? "text" : "grab",
        border: "1px solid var(--background-modifier-border)",
        position: "relative",
        minHeight: "40px",
      }}
      draggable={!isEditing}
      onDragStart={(e) => !isEditing && onDragStart(e, item.id)}
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
            border: "none",
            outline: "none",
            backgroundColor: "#000",
            color: "#fff",
            whiteSpace: "pre",
          }}
        />
      ) : (
        <div style={{ height: "150px", width: "100%", overflowY: "auto", whiteSpace: "pre" }}>
          {item.content || "No content found"}
        </div>
      )}
      <button
        onClick={() => onRemove(item.id)}
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "red",
          fontSize: "12px",
        }}
      >
        ×
      </button>
    </div>
  );
}


function Lane({
  lane,
  items,
  onDragOver,
  onDrop,
  onDragStart,
  onAddItem,
  onRemoveLane,
  onRemoveItem,
  onUpdateItem,
  placeholders,
}) {
  const { useState, useEffect, useRef } = dc;
  const [newItemContent, setNewItemContent] = useState("");
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
      style={{
        width: "250px",
        flexShrink: 0,
        backgroundColor: "var(--background-secondary)",
        margin: "0 10px",
        borderRadius: "5px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        height: "100%",
      }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, lane.id)}
    >
      <div
        style={{
          padding: "10px",
          backgroundColor: "var(--background-modifier-border)",
          textAlign: "center",
          fontWeight: "bold",
          position: "relative",
          color: "var(--text-normal)",
        }}
      >
        {lane.title}
        <button
          onClick={() => onRemoveLane(lane.id)}
          style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "red",
            fontSize: "16px",
          }}
        >
          ×
        </button>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "10px", marginBottom: "80px" }}>
        {items.map((item) => (
          <EditableItem key={item.id} item={item} onUpdate={onUpdateItem} onRemove={onRemoveItem} onDragStart={onDragStart} />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "80px",
          padding: "10px",
          borderTop: "1px solid var(--background-modifier-border)",
          backgroundColor: "var(--background-secondary)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <textarea
          value={newItemContent}
          onChange={(e) => setNewItemContent(e.target.value)}
          placeholder={placeholders.itemContent}
          style={{
            flex: 1,
            padding: "10px",
            marginRight: "5px",
            height: "60px",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "3px",
            backgroundColor: "var(--background-primary)",
            color: "var(--text-normal)",
            overflow: "auto",
            resize: "none",
            whiteSpace: "pre",
          }}
        />
        <button
          onClick={() => {
            if (newItemContent.trim()) {
              // Manual addition uses the original formatting.
              onAddItem(lane.id, newItemContent);
              setNewItemContent("");
            }
          }}
          style={{ padding: "10px 15px", cursor: "pointer" }}
        >
          Add Item
        </button>
      </div>
    </div>
  );
}

// ======================================================
// Main View Component
// ======================================================
function View({ initialSettingsOverride = {} }) {
  const { useState, useMemo, useEffect, useRef } = dc;
  const mergedSettings = useMemo(() => ({ ...initialSettings, ...initialSettingsOverride }), [initialSettingsOverride]);
  const { filesAsColumns, placeholders } = mergedSettings;
  const [currentCenter, setCurrentCenter] = useState(filesAsColumns[0] || "test");
  const queryString = useMemo(() => {
    const exactName = removeMdExtension(currentCenter);
    return `@page and $name = "${exactName}"`;
  }, [currentCenter]);
  const queriedFiles = dc.useQuery(queryString);
  const [files, setFiles] = useState([]);
  useEffect(() => {
    async function loadFilesContent() {
      const filesWithContent = await Promise.all(
        queriedFiles.map(async (file) => {
          if (!file.$content || file.$content.trim() === "") {
            const vaultFile = app.vault.getAbstractFileByPath(file.$path);
            if (vaultFile) {
              const content = await app.vault.read(vaultFile);
              return { ...file, $content: content };
            }
          }
          return file;
        })
      );
      setFiles(filesWithContent);
    }
    loadFilesContent();
  }, [queriedFiles]);
  
  // Debug log files if needed
  // useEffect(() => { console.log("Files:", files); }, [files]);
  
  // Merge queried lanes with manually added lanes.
  const [lanes, setLanes] = useState([]);
  const [items, setItems] = useState([]);
  useEffect(() => {
    const queriedLanes = [];
    let queriedItems = [];
    files.forEach((file) => {
      const filePath = file.$path;
      const title = removeMdExtension(file.$name || filePath);
      const isEditor = filesAsColumns.some((pattern) => filePath.includes(pattern));
      queriedLanes.push({ id: filePath, title, editor: isEditor });
      const sections = parseFileContent(file.$content || "");
      sections.forEach((sec, i) => {
        queriedItems.push({
          id: `${filePath}-${i}`,
          content: sec,
          laneId: filePath,
          sectionIndex: i,
          originalSegment: sec,
        });
      });
    });
    setLanes((prevLanes) => {
      const merged = queriedLanes.map((qLane) => {
        const manual = prevLanes.find((lane) => lane.id === qLane.id);
        if (manual) {
          return { ...qLane, editor: manual.editor || qLane.editor };
        }
        return qLane;
      });
      const manualOnly = prevLanes.filter((lane) => !files.find((file) => file.$path === lane.id));
      return [...merged, ...manualOnly];
    });
    setItems((prevItems) => {
      const merged = [...queriedItems];
      const manualOnly = prevItems.filter((item) => !files.find((file) => file.$path === item.laneId));
      return [...merged, ...manualOnly];
    });
  }, [files]);
  
  const [showModal, setShowModal] = useState(false);
  const lanesContainerRef = useRef(null);
  useEffect(() => {
    if (lanesContainerRef.current) {
      lanesContainerRef.current.scrollLeft = lanesContainerRef.current.scrollWidth;
    }
  }, [lanes]);
  
  const draggedLaneIdRef = useRef(null);
  const onLaneDragStart = (e, laneId) => {
    draggedLaneIdRef.current = laneId;
    e.dataTransfer.effectAllowed = "move";
  };
  const onLaneDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onLaneDrop = (e, targetLaneId) => {
    e.preventDefault();
    const draggedLaneId = draggedLaneIdRef.current;
    if (!draggedLaneId || draggedLaneId === targetLaneId) return;
    setLanes((prev) => {
      const draggedIndex = prev.findIndex((l) => l.id === draggedLaneId);
      const targetIndex = prev.findIndex((l) => l.id === targetLaneId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const newLanes = [...prev];
      const [draggedLane] = newLanes.splice(draggedIndex, 1);
      newLanes.splice(targetIndex, 0, draggedLane);
      return newLanes;
    });
    draggedLaneIdRef.current = null;
  };
  
  const onDragStart = (e, itemId) => {
    e.dataTransfer.setData("itemId", itemId);
  };
  const onDragOver = (e) => e.preventDefault();
  
  // onDrop for items: if both lanes are file-backed, use onMoveItem; otherwise, update state.
  const onDrop = async (e, laneId) => {
    e.preventDefault();
    e.stopPropagation();
    const itemId = e.dataTransfer.getData("itemId");
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    const sourceLane = lanes.find((l) => l.id === item.laneId);
    const targetLane = lanes.find((l) => l.id === laneId);
    if (sourceLane && targetLane && sourceLane.editor && targetLane.editor) {
      try {
        await onMoveItem(itemId, laneId, items, lanes, setItems, onRemoveItem, onAddItem);
      } catch (error) {
        console.error("Error moving entry between files:", error);
      }
    } else {
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, laneId } : it))
      );
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
        console.error("File not found:", filePath);
        return;
      }
      try {
        const fileContent = await app.vault.read(file);
        const lines = fileContent.split("\n");
        const headerIndex = lines.findIndex((line) =>
          line.includes("#### [[ENIGMAS]]")
        );
        if (headerIndex === -1) {
          console.error("Header marker not found in file");
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
        console.error("Error adding new entry to file:", error);
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
  if (!filePath.includes(".enigmas.")) {
    filePath = `${filePath}.enigmas..md`;
  }
  console.log("addFile: Computed filePath is", filePath);
  
  try {
    const laneId = filePath;
    const fileName = removeMdExtension(filePath.split("/").pop());
    const newLane = { id: laneId, title: fileName, editor: true };
    setLanes((prev) => [...prev, newLane]);
    
    // Load the file data using the FileEditor functions with debug logging
    console.log("addFile: Attempting to load file data for", filePath);
    const { header, sections } = await loadData(filePath);
    console.log("addFile: Retrieved header:", header);
    console.log("addFile: Retrieved sections:", sections);
    
    if (!sections || sections.length === 0) {
      console.warn("addFile: No sections found in file:", filePath);
    }
    
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



  
  const handleFileDrop = (e) => {
    e.preventDefault();
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
  
  return (
    <>
      <style>{`.full-dc-stack { height: 66vh !important; }`}</style>
      <dc.Stack
        className="full-dc-stack"
        style={{
          display: "flex", flexDirection: "column",
          backgroundColor: "var(--background-primary)",
          color: "var(--text-normal)", overflow: "hidden",
        }}
      >
        <div style={{ padding: "10px" }}>
          <button onClick={() => setShowModal(true)} style={{ padding: "10px 15px", cursor: "pointer" }}>
            Add File
          </button>
        </div>
        {showModal && (
          <AddFileModal onClose={() => setShowModal(false)} onSubmit={(fp, hs) => addFile(fp, hs, true)} />
        )}
        <div
          ref={lanesContainerRef}
          style={{
            display: "flex", flexDirection: "row", overflowX: "auto",
            padding: "10px", flex: 1,
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          {lanes.map((lane) => (
            <div
              key={lane.id}
              draggable
              onDragStart={(e) => onLaneDragStart(e, lane.id)}
              onDragOver={onLaneDragOver}
              onDrop={(e) => onLaneDrop(e, lane.id)}
              style={{ height: "100%" }}
            >
              <Lane
                lane={lane}
                items={items.filter((it) => it.laneId === lane.id)}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragStart={onDragStart}
                onAddItem={onAddItem}
                onRemoveLane={onRemoveLane}
                onRemoveItem={onRemoveItem}
                onUpdateItem={onUpdateItem}
                placeholders={placeholders}
              />
            </div>
          ))}
        </div>
      </dc.Stack>
    </>
  );
}

// ======================================================
// Export the Main View
// ======================================================
return { View };

```


# FileEditor

```jsx
async function parseFileContent(content) {
  const headerMarker = "#### [[ENIGMAS]]";
  let header = "";
  let body = content;
  const markerIndex = content.indexOf(headerMarker);
  if (markerIndex !== -1) {
    header = content.substring(0, markerIndex + headerMarker.length) + "\n\n";
    body = content.substring(markerIndex + headerMarker.length);
  }
  const sectionArray = body.split(/(\n\s*-{3,}\s*\n)/m);
  const sections = [];
  let currentSection = "";
  sectionArray.forEach((part) => {
    if (part.match(/^\n\s*-{3,}\s*\n$/)) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      currentSection = "";
    } else {
      currentSection += part;
    }
  });
  if (currentSection) {
    sections.push(currentSection.trim());
  }
  return { header, sections };
}

async function retrieveFileData(filePath) {
  let file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    const fileName = filePath.split("/").pop();
    const markdownFiles = app.vault.getMarkdownFiles();
    file = markdownFiles.find((f) => f.name === fileName);
    if (!file) {
      throw new Error("retrieveFileData: File not found: " + filePath);
    }
  }
  const content = await app.vault.read(file);
  return await parseFileContent(content);
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
  if (!file) throw new Error("Target file not found: " + filePath);
  const fileContent = await app.vault.read(file);
  const headerMarker = "#### [[ENIGMAS]]";
  const headerIndex = fileContent.indexOf(headerMarker);
  if (headerIndex === -1) {
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