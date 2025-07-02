---
permalink: datacore.tags
---

Was told no to share it but he never said i cant post it hehe
I develop this part so what...

```datacorejsx
function TagBrowser({ config = { queryPath: "@page" } }) {
  const { useState, useMemo } = dc;

  // Toggles hiding leaf tags at the root level
  const [showOnlyNested, setShowOnlyNested] = useState(false);
  // Tracks our current location in the hierarchy, e.g. ["test","bob"] for #test/bob
  const [currentPath, setCurrentPath] = useState([]);
  // Toggles displaying *all* sub‐tags (multi-level) from the current node in a single flat list
  const [showAllSubtree, setShowAllSubtree] = useState(false);

  // 1) Fetch notes from the vault (or use config.queryPath if needed)
  const data = dc.useQuery("@page");

  // 2) Build a map of "tagPath" -> Set<Note>, e.g. "test" => { noteA }, "test/bob" => { noteB }
  const tagMap = useMemo(() => {
    const map = new Map();
    if (!data || !Array.isArray(data)) return map;
    for (const note of data) {
      for (const rawTag of note.$tags || []) {
        const cleanTag = rawTag.replace(/^#/, ""); // remove leading '#'
        if (!map.has(cleanTag)) {
          map.set(cleanTag, new Set());
        }
        map.get(cleanTag).add(note);
      }
    }
    return map;
  }, [data]);

  // 3) Build a hierarchical tree structure: { name, children: {}, notes: [], fullPath: "" }
  const rootNode = useMemo(() => {
    function insertPath(node, parts, notesArray, fullPath) {
      if (parts.length === 0) {
        node.notes = notesArray;
        node.fullPath = fullPath;
        return;
      }
      const [head, ...rest] = parts;
      if (!node.children[head]) {
        node.children[head] = {
          name: head,
          children: {},
          notes: [],
          fullPath: ""
        };
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

  // 4) Helper to navigate the tree according to currentPath
  function getNodeByPath(node, pathParts) {
    if (pathParts.length === 0) return node;
    const [head, ...rest] = pathParts;
    if (!node.children[head]) return null;
    return getNodeByPath(node.children[head], rest);
  }
  const currentNode = useMemo(() => {
    return getNodeByPath(rootNode, currentPath) || rootNode;
  }, [rootNode, currentPath]);

  // 5) Immediate child tags (one level down from currentNode)
  const immediateChildTags = useMemo(() => {
    if (!currentNode || !currentNode.children) return [];
    let keys = Object.keys(currentNode.children);
    // At root, optionally hide leaf tags if showOnlyNested is enabled
    if (currentPath.length === 0 && showOnlyNested) {
      keys = keys.filter(
        (k) => Object.keys(currentNode.children[k].children).length > 0
      );
    }
    return keys.sort();
  }, [currentNode, currentPath, showOnlyNested]);

  // 6) Gather all descendant tags (multi-level) if showAllSubtree is on.
  //    We sort the results to preserve ascending (hierarchical) order.
  function gatherAllDescendantPaths(node, pathSoFar = []) {
    let results = [];
    const childNames = Object.keys(node.children).sort();
    for (const childName of childNames) {
      const childNode = node.children[childName];
      const newPath = [...pathSoFar, childName];
      results.push(newPath);
      results = results.concat(gatherAllDescendantPaths(childNode, newPath));
    }
    return results;
  }
  const allDescendantTags = useMemo(() => {
    if (!currentNode) return [];
    const allPaths = gatherAllDescendantPaths(currentNode);
    // Sort based on full joined path string to maintain order
    return allPaths.sort((a, b) =>
      a.join("/").localeCompare(b.join("/"))
    );
  }, [currentNode]);

  // Decide which child tags to display:
  // If showAllSubtree is true, flatten all descendant tags;
  // Otherwise, display only immediate children.
  const displayedChildTags = showAllSubtree
    ? allDescendantTags
    : immediateChildTags.map((child) => [child]);

  // 7) Notes that exactly match the current path (e.g. at ["test"], notes with #test but not deeper)
  const exactNotes = currentNode?.notes || [];

  // 8) DraggableLink: renders an internal link that is both clickable and draggable.
  function DraggableLink({ title }) {
    const handleDragStart = (e) => {
      e.dataTransfer.setData("text/plain", `[[${title}]]`);
      e.dataTransfer.effectAllowed = "copy";
    };
    return (
      <a
        href={title}
        className="internal-link"
        draggable
        onDragStart={handleDragStart}
        title={`Drag to copy [[${title}]]`}
      >
        {title}
      </a>
    );
  }

  // 9) Render the complete Tag Browser UI
  return (
    <dc.Stack
      style={{
        padding: "10px",
        backgroundColor: "var(--background-primary)",
        borderRadius: "5px"
      }}
    >
      <h2>Tag Browser</h2>

      {/* At root: "Show Only Nested Tags" toggle */}
      {currentPath.length === 0 && (
        <button
          onClick={() => setShowOnlyNested(!showOnlyNested)}
          style={{ marginBottom: "10px" }}
        >
          {showOnlyNested ? "Show All Tags" : "Show Only Nested Tags"}
        </button>
      )}

      {/* Back button if not at root */}
      {currentPath.length > 0 && (
        <button
          onClick={() => {
            setCurrentPath((prev) => prev.slice(0, -1));
            setShowAllSubtree(false);
          }}
          style={{ marginBottom: "10px" }}
        >
          Back
        </button>
      )}

      {/* At non-root levels: "Show All Sub-Tags" toggle */}
      {currentPath.length > 0 && (
        <button
          onClick={() => setShowAllSubtree(!showAllSubtree)}
          style={{ marginBottom: "10px" }}
        >
          {showAllSubtree
            ? "Show Only Immediate Children"
            : "Show All Sub-Tags"}
        </button>
      )}

      {/* Display child tags */}
      {displayedChildTags.length > 0 && (
        <>
          <h3>
            {currentPath.length > 0
              ? `Tags in #${currentPath.join("/")}`
              : "Top-Level Tags"}
          </h3>
          <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
            {displayedChildTags.map((tagParts) => {
              // tagParts is an array like ["bob"] or ["bob", "alice"]
              const label = `#${[...currentPath, ...tagParts].join("/")}`;
              return (
                <li key={label}>
                  <button
                    onClick={() =>
                      setCurrentPath((prev) => [...prev, ...tagParts])
                    }
                    style={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "var(--text-accent)",
                      background: "none",
                      border: "none",
                      padding: 0
                    }}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Display exact notes for the current tag path */}
      {exactNotes.length > 0 && (
        <>
          <h3>Notes for #{currentPath.join("/") || "Root"}</h3>
          <ul style={{ listStyleType: "circle", marginLeft: "20px" }}>
            {exactNotes.map((note) => (
              <li key={note.$id || note.id}>
                <DraggableLink
                  title={
                    note.$name ||
                    note.name?.obsidian ||
                    "Untitled Note"
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* If no child tags and no notes, show a message */}
      {displayedChildTags.length === 0 && exactNotes.length === 0 && (
        <p>No tags or notes found here.</p>
      )}
    </dc.Stack>
  );
}

return TagBrowser;

```