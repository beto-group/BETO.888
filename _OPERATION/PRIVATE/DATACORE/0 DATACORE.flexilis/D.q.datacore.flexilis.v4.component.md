---
aliases:
  - datacore.flexilis.component.v02
  - datacore.markcode
permalink: datacore.flexilis.component
---


###### NAVIGATE - BACK : [[DATACORE.flexilis.v04.install]]
---

##### DOWNLOAD [HERE](https://bafybeignny3whgt3rofluvjj4iwgpfb5odl7if27mohghne36savwn47ii.ipfs.w3s.link/)


# ViewComponent

```jsx
////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////
const componentFile = "_OPERATION/PRIVATE/DATACORE/0 DATACORE.flexilis/D.q.datacore.flexilis.v4.component.md"; //CHANGE this to your own PATH/renamed filename

// Import initial settings, helper functions, components, and styles.
const { initialSettings } = await dc.require(dc.headerLink(componentFile, "InitialSettings"));
const { getProperty, useState, useMemo, useEffect } = await dc.require(dc.headerLink(componentFile, "HelperFunctions"));
const components = await dc.require(dc.headerLink(componentFile, "Components"));
const { getStyles } = await dc.require(dc.headerLink(componentFile, "ViewerStyles"));
const styles = getStyles();

/**
 * Helper: Update YAML frontmatter in markdown content.
 * If the property exists, it is replaced; otherwise, it is added.
 */
function updateFrontmatter(content, property, newValue) {
  var yamlRegex = /^---\n([\s\S]*?)\n---\n?/;
  var match = content.match(yamlRegex);
  if (match) {
    var yamlContent = match[1];
    var propertyRegex = new RegExp("^" + property + ":\\s*(.*)$", "m");
    if (propertyRegex.test(yamlContent)) {
      yamlContent = yamlContent.replace(propertyRegex, property + ": " + newValue);
    } else {
      yamlContent += "\n" + property + ": " + newValue;
    }
    var updatedContent = content.replace(yamlRegex, "---\n" + yamlContent + "\n---\n");
    return updatedContent;
  } else {
    var updatedContent = "---\n" + property + ": " + newValue + "\n---\n" + content;
    return updatedContent;
  }
}

// Updated onUpdateEntry function using traditional function syntax.
function onUpdateEntry(entry, property, newValue) {
  console.log("[onUpdateEntry] Called with:", { entry: entry, property: property, newValue: newValue });
  if (!app || !app.vault) {
    console.log("[onUpdateEntry] No app or vault found. Aborting update.");
    return;
  }
  var file = app.vault.getAbstractFileByPath(entry.$path);
  if (file && (typeof TFile === "undefined" || file instanceof TFile)) {
    app.vault.read(file)
      .then(function(content) {
        var updatedContent = updateFrontmatter(content, property, newValue);
        return app.vault.modify(file, updatedContent);
      })
      .then(function() {
        console.log("[onUpdateEntry] File updated successfully. Triggering refresh.");
        setRefresh(function(prev) { return !prev; });
      })
      .catch(function(error) {
        console.error("[onUpdateEntry] Error updating \"" + entry.$path + "\":", error);
        alert("Error: " + error.message);
      });
  } else {
    console.log("[onUpdateEntry] File not found or invalid type for path:", entry.$path);
  }
}

/**
 * DisplaySettingsEditor Component
 *
 * Provides UI controls to toggle text truncation and adjust cell height offset.
 */
function DisplaySettingsEditor({
  truncateText,
  setTruncateText,
  baseline,
  cellHeightOffset,
  setCellHeightOffset,
}) {
  const handleHeightChange = (e) => {
    const newOffset = parseInt(e.target.value, 10);
    setCellHeightOffset(isNaN(newOffset) ? 0 : newOffset);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        padding: "10px 0",
        gap: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ fontWeight: "bold" }}>Truncate Text:</label>
        <dc.Checkbox
          checked={truncateText}
          onChange={(e) => setTruncateText(e.target.checked)}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ fontWeight: "bold" }}>Height:</label>
        <dc.Textbox
          type="number"
          value={cellHeightOffset}
          onChange={handleHeightChange}
          style={{
            width: "60px",
            padding: "8px",
            border: "1px solid var(--background-modifier-border)",
          }}
          placeholder="0"
        />
        <span style={{ fontSize: "14px" }}>
          Final Height: {baseline + cellHeightOffset}px
        </span>
      </div>
    </div>
  );
}

/**
 * Main View Component
 *
 * Merges settings, initializes state for filtering, editing, pagination,
 * handles data grouping, and renders header controls along with the DataTable.
 *
 * Layout approach:
 *  - A sticky header at the top.
 *  - Below that, a conditional "editing panel" if isEditing is true.
 *  - The data table in a scrollable middle area.
 *  - A sticky bottom pagination bar if enabled.
 */
function View({ initialSettingsOverride = {}, app }) {
  // Merge initial settings with overrides.
  const mergedSettings = useMemo(() => ({
    ...initialSettings,
    ...initialSettingsOverride,
    pagination: { ...initialSettings.pagination, ...(initialSettingsOverride.pagination || {}) },
    placeholders: { ...initialSettings.placeholders, ...(initialSettingsOverride.placeholders || {}) },
    display: { ...initialSettings.display, ...(initialSettingsOverride.display || {}) },
    dynamicColumnProperties: initialSettingsOverride.dynamicColumnProperties
      ? { ...initialSettingsOverride.dynamicColumnProperties }
      : { ...initialSettings.dynamicColumnProperties },
    vaultName: initialSettingsOverride.vaultName || initialSettings.vaultName,
    groupByColumns: initialSettingsOverride.groupByColumns
      ? [...initialSettingsOverride.groupByColumns]
      : [...initialSettings.groupByColumns],
    viewHeight: initialSettings.viewHeight,
  }), [initialSettingsOverride]);

  // State initialization.
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refresh, setRefresh] = useState(false);
  const [queryPath, setQueryPath] = useState(mergedSettings.queryPath);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHeaders, setEditedHeaders] = useState({});
  const [editedFields, setEditedFields] = useState({});
  const [newHeaderLabel, setNewHeaderLabel] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [isPaginationEnabled, setIsPaginationEnabled] = useState(mergedSettings.pagination.isEnabled);
  const [itemsPerPage, setItemsPerPage] = useState(mergedSettings.pagination.itemsPerPage);
  const [groupByColumns, setGroupByColumns] = useState(mergedSettings.groupByColumns);
  const [dynamicColumnProperties, setDynamicColumnProperties] = useState(mergedSettings.dynamicColumnProperties);
  const [columnsToShow, setColumnsToShow] = useState(Object.keys(mergedSettings.dynamicColumnProperties));
  const [truncateText, setTruncateText] = useState(mergedSettings.display.truncateText);
  const [truncationLength, setTruncationLength] = useState(mergedSettings.display.truncationLength);
  const [displaySettings, setDisplaySettings] = useState({
    ...mergedSettings.display,
    truncateText,
    truncationLength,
  });
  const [nameFilter, setNameFilter] = useState(mergedSettings.initialNameFilter || "");

  // Adjust margin of header to push it up slightly.
  const HEADER_MARGIN_TOP = -10; // Adjust this to push the header up.

  // When pagination is disabled, ensure currentPage resets to 1.
  useEffect(() => {
    if (!isPaginationEnabled) setCurrentPage(1);
  }, [isPaginationEnabled]);

  useEffect(() => {
    setDisplaySettings(prev => ({
      ...prev,
      truncateText,
      truncationLength,
    }));
  }, [truncateText, truncationLength]);

  // Compute baseline cell height.
  const hasDateComponent = columnsToShow.some(col => {
    const prop = dynamicColumnProperties[col];
    return (
      prop === "ctime.obsidian" ||
      prop === "mtime.obsidian" ||
      col.toLowerCase().includes("date") ||
      col === "gals"
    );
  });
  const baselineCellHeight = hasDateComponent ? 133 : 55;

  // Use the override for cellHeight if provided, otherwise default to baselineCellHeight.
  const initialCellHeight = mergedSettings.display.cellHeight
    ? parseInt(mergedSettings.display.cellHeight, 10)
    : baselineCellHeight;
  const [cellHeightOffset, setCellHeightOffset] = useState(initialCellHeight - baselineCellHeight);
  const cellHeight = baselineCellHeight + cellHeightOffset;

  // Define current display settings including computed cellHeight.
  const currentDisplaySettings = { ...displaySettings, cellHeight };

  useEffect(() => {
    setColumnsToShow(prev => {
      const newKeys = Object.keys(dynamicColumnProperties);
      const ordered = prev.filter(key => newKeys.includes(key));
      newKeys.forEach(key => { if (!ordered.includes(key)) ordered.push(key); });
      return ordered;
    });
  }, [dynamicColumnProperties]);

  // Query data from the vault.
  const qdata = dc.useQuery(`@page and path("${queryPath}")`, [queryPath, refresh, refreshKey]);

  // Filter data based on the search term.
  const filteredData = useMemo(() => {
    if (!qdata) return [];
    if (!nameFilter.trim()) return qdata;
    const filterLower = nameFilter.toLowerCase();
    return qdata.filter((entry) => {
      const title = getProperty(entry, "name.obsidian") || "";
      return title.toLowerCase().includes(filterLower);
    });
  }, [qdata, nameFilter]);

  /**********************
   * GROUPING LOGIC
   **********************/
  const groupedData = useMemo(() => {
    const validData = filteredData.filter(entry => !entry.type && entry.$path);
    if (groupByColumns.length === 0) {
      return validData;
    }
    function buildGroupTree(data, groups, level = 0, groupingContext = null) {
      if (groups.length === 0) {
        if (
          groupingContext &&
          (groupingContext.prop === "ctime.obsidian" || groupingContext.prop === "mtime.obsidian")
        ) {
          data.sort((a, b) => {
            const tA = new Date(getProperty(a, groupingContext.prop)).getTime();
            const tB = new Date(getProperty(b, groupingContext.prop)).getTime();
            return groupingContext.order === "desc" ? tB - tA : tA - tB;
          });
        }
        return data;
      }
      const { column, order = "asc" } = groups[0];
      const prop = dynamicColumnProperties[column];
      const groupMap = {};
      const getDayKey = (rawValue) => {
        if (!rawValue || typeof rawValue !== "string") return null;
        const d = new Date(rawValue);
        if (isNaN(d.getTime())) return rawValue;
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const day = d.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      data.forEach((entry) => {
        let rawValue;
        if (entry.$frontmatter && Array.isArray(entry.$frontmatter[prop])) {
          rawValue = entry.$frontmatter[prop];
        } else {
          rawValue = getProperty(entry, prop);
        }
        if (Array.isArray(rawValue)) {
          rawValue.forEach(item => {
            let key = item;
            if (!key || key === "No Data" || key === "Unnamed") key = "Uncategorized";
            if (!groupMap[key]) groupMap[key] = [];
            groupMap[key].push(entry);
          });
        } else if (["tags", "ingredients", "diet"].includes(prop)) {
          let values = typeof rawValue === "string"
            ? rawValue.split(",").map(v => v.trim()).filter(v => v)
            : [rawValue];
          values.forEach(tag => {
            let key = tag;
            if (!key || key === "No Data" || key === "Unnamed") key = "Uncategorized";
            if (!groupMap[key]) groupMap[key] = [];
            groupMap[key].push(entry);
          });
        } else {
          let key =
            prop === "ctime.obsidian" || prop === "mtime.obsidian"
              ? getDayKey(rawValue)
              : rawValue;
          if (!key || key === "No Data" || key === "Unnamed") key = "Uncategorized";
          if (!groupMap[key]) groupMap[key] = [];
          groupMap[key].push(entry);
        }
      });

      let sortedKeys;
      if (prop === "ctime.obsidian" || prop === "mtime.obsidian") {
        const keys = Object.keys(groupMap).filter(k => k !== "Uncategorized");
        const keysWithSortValue = keys.map((k) => {
          const timestamps = groupMap[k].map(entry => {
            const fullValue = getProperty(entry, prop);
            const t = new Date(fullValue).getTime();
            return isNaN(t) ? 0 : t;
          });
          return { key: k, sortValue: Math.min(...timestamps) };
        });
        keysWithSortValue.sort((a, b) => a.sortValue - b.sortValue);
        sortedKeys = keysWithSortValue.map(item => item.key);
        if (order === "desc") {
          sortedKeys.reverse();
          if (groupMap["Uncategorized"]) sortedKeys.unshift("Uncategorized");
        } else {
          if (groupMap["Uncategorized"]) sortedKeys.push("Uncategorized");
        }
      } else {
        sortedKeys = Object.keys(groupMap)
          .filter(k => k !== "Uncategorized")
          .sort((a, b) => (order === "asc" ? a.localeCompare(b) : b.localeCompare(a)));
        if (order === "desc" && groupMap["Uncategorized"]) {
          sortedKeys.unshift("Uncategorized");
        } else if (order === "asc" && groupMap["Uncategorized"]) {
          sortedKeys.push("Uncategorized");
        }
      }

      return sortedKeys.map(k => ({
        header: { type: "group", level, key: k },
        children: buildGroupTree(
          groupMap[k],
          groups.slice(1),
          level + 1,
          groups.slice(1).length === 0 ? { prop, order } : null
        ),
      }));
    }

    let headerIdCounter = 0;
    function flattenGroupTree(tree, ancestors = []) {
      let result = [];
      tree.forEach(node => {
        const headerNode = { ...node.header, isHeader: true, ancestors, id: headerIdCounter++ };
        result.push(headerNode);
        if (Array.isArray(node.children)) {
          if (node.children.length > 0 && node.children[0] && node.children[0].header) {
            result = result.concat(flattenGroupTree(node.children, [...ancestors, headerNode]));
          } else {
            node.children.forEach(dataEntry => {
              result.push({ ...dataEntry, ancestors: [...ancestors, headerNode] });
            });
          }
        }
      });
      return result;
    }

    const tree = buildGroupTree(validData, groupByColumns);
    const flat = flattenGroupTree(tree);
    if (groupByColumns.length > 0) {
      const topGroup = groupByColumns[0];
      if (
        (topGroup.column === "ctime.obsidian" || topGroup.column === "mtime.obsidian") &&
        topGroup.order === "desc"
      ) {
        return flat.reverse();
      }
    }
    return flat;
  }, [filteredData, groupByColumns, dynamicColumnProperties]);

  /**********************
   * PAGINATION LOGIC
   **********************/
  const paginatedData = useMemo(() => {
    if (!isPaginationEnabled) return groupedData;
    const rawIndices = [];
    groupedData.forEach((item, index) => {
      if (!item.isHeader) rawIndices.push(index);
    });
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedRawIndices = rawIndices.slice(start, end);

    const headerIdsToInclude = new Set();
    paginatedRawIndices.forEach(i => {
      const rawItem = groupedData[i];
      if (rawItem.ancestors && Array.isArray(rawItem.ancestors)) {
        rawItem.ancestors.forEach(ancestor => headerIdsToInclude.add(ancestor.id));
      }
    });
    const headerIndices = {};
    groupedData.forEach((item, index) => {
      if (item.isHeader && item.id !== undefined) headerIndices[item.id] = index;
    });
    const headerIndicesToInclude = new Set();
    headerIdsToInclude.forEach(id => {
      if (headerIndices[id] !== undefined) headerIndicesToInclude.add(headerIndices[id]);
    });
    const indicesToInclude = new Set([...paginatedRawIndices, ...headerIndicesToInclude]);
    return groupedData.filter((item, index) => indicesToInclude.has(index));
  }, [groupedData, currentPage, itemsPerPage, isPaginationEnabled]);

  const totalPages = useMemo(() => {
    if (!isPaginationEnabled) return 1;
    const rawCount = groupedData.filter(item => !item.isHeader).length;
    return Math.ceil(rawCount / itemsPerPage);
  }, [groupedData, itemsPerPage, isPaginationEnabled]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setPageInput("");
    } else {
      alert("Invalid page number.");
    }
  };

  /**********************
   * COLUMN EDITING HANDLERS
   **********************/
  const addNewColumn = () => {
    if (!newHeaderLabel || !newFieldLabel) {
      alert("Provide both header and data field.");
      return;
    }
    if (columnsToShow.includes(newHeaderLabel)) {
      alert("Header exists. Choose a different name.");
      return;
    }
    const updated = { ...dynamicColumnProperties, [newHeaderLabel]: newFieldLabel };
    setDynamicColumnProperties(updated);
    setColumnsToShow([...columnsToShow, newHeaderLabel]);
    setNewHeaderLabel("");
    setNewFieldLabel("");
  };

  const updateColumn = (columnId, newHeader, newField) => {
    if (newHeader !== columnId && columnsToShow.includes(newHeader)) {
      alert(`Header "${newHeader}" exists.`);
      setEditedHeaders({ ...editedHeaders, [columnId]: columnId });
      return;
    }
    setDynamicColumnProperties(prev => {
      const newProps = {};
      columnsToShow.forEach(col => {
        newProps[col === columnId ? newHeader : col] = col === columnId ? newField : prev[col];
      });
      return newProps;
    });
    setGroupByColumns(prev =>
      prev.map(group => group.column === columnId ? { ...group, column: newHeader } : group)
    );
    setColumnsToShow(prev => prev.map(col => col === columnId ? newHeader : col));
    setEditedHeaders(prev => { const copy = { ...prev }; delete copy[columnId]; return copy; });
    setEditedFields(prev => { const copy = { ...prev }; delete copy[columnId]; return copy; });
  };

  const removeColumn = (columnId) => {
    if (!confirm(`Remove column "${columnId}"?`)) return;
    const updated = { ...dynamicColumnProperties };
    delete updated[columnId];
    setDynamicColumnProperties(updated);
    setColumnsToShow(columnsToShow.filter(col => col !== columnId));
    setGroupByColumns(prev => prev.filter(group => group.column !== columnId));
    setEditedHeaders(prev => { const copy = { ...prev }; delete copy[columnId]; return copy; });
    setEditedFields(prev => { const copy = { ...prev }; delete copy[columnId]; return copy; });
  };

  /**********************
   * FILE UPDATE & DELETE HANDLERS
   **********************/
  const onUpdateEntry = (entry, property, newValue) => {
    if (!app || !app.vault) return;
    const file = app.vault.getAbstractFileByPath(entry.$path);
    if (file && (typeof TFile === "undefined" || file instanceof TFile)) {
      app.vault.read(file)
        .then(content => {
          const updatedContent = updateFrontmatter(content, property, newValue);
          return app.vault.modify(file, updatedContent);
        })
        .then(() => setRefresh(prev => !prev))
        .catch(error => {
          console.error(`Error updating "${entry.$path}":`, error);
          alert(`Error: ${error.message}`);
        });
    }
  };

  const onDeleteEntry = (entry) => {
    if (!mergedSettings.vaultName) {
      alert("Vault name not specified.");
      return;
    }
    const file = app.vault.getAbstractFileByPath(entry.$path);
    if (!file) {
      alert(`File "${entry.$path}" not found.`);
      return;
    }
    const fileName = entry.$name || (entry.$path ? entry.$path.split("/").pop() : "this file");
    if (confirm(`Delete "${fileName}"?`)) {
      app.vault.trash(file)
        .then(() => {
          alert(`"${fileName}" trashed.`);
          setRefresh(prev => !prev);
        })
        .catch(error => {
          alert(`Delete failed: ${error.message}`);
          console.error(`Error deleting "${entry.$path}":`, error);
        });
    }
  };

  const totalEntries = groupedData.filter(item => !item.isHeader).length;

  /**********************
   * RENDERING THE VIEW
   **********************/
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "77vh",
        backgroundColor: "var(--background-primary)",
        color: "var(--text-normal)",
        overflow: "hidden", // Prevent overflow of the whole page.
      }}
    >
      {/* STICKY HEADER AT TOP */}
      <div
        style={{
          ...styles.header,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: HEADER_MARGIN_TOP,  // Move header up with margin
          left: 0,
          right: 0,
          zIndex: 10000,
          backgroundColor: "var(--background-primary)",
          padding: "10px",
        }}
      >
        <h1 style={styles.headerTitle}>{mergedSettings.placeholders.headerTitle}</h1>
        <dc.Group style={{ ...styles.controlGroup, gap: "10px" }}>
          <dc.Textbox
            type="search"
            placeholder={mergedSettings.placeholders.nameFilter}
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.textbox}
          />
          <dc.Textbox
            value={queryPath}
            placeholder={mergedSettings.placeholders.queryPath}
            onChange={(e) => {
              setQueryPath(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.textbox}
          />
          <dc.Button onClick={() => setIsEditing(!isEditing)} style={styles.button}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="currentColor"
                d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.06-.94l2.03-1.58a.48.48 0 0 0 .11-.63l-1.93-3.32a.48.48 0 0 0-.6-.21l-2.37.95c-.5-.4-1.05-.7-1.64-.94l-.36-2.53a.48.48 0 0 0-.48-.42h-3.86a.48.48 0 0 0-.48.42l-.36 2.53c-.59.24-1.14.55-1.64.94l-2.36-.95a.48.48 0 0 0-.6.21l-1.93 3.32a.48.48 0 0 0 .11.63l2.03 1.58a6.8 6.8 0 0 0 0 1.88l-2.03 1.58a.48.48 0 0 0-.11.63l1.93 3.32a.48.48 0 0 0 .6.21l2.36-.95c.5.4 1.05.7 1.64.94l.36 2.53c.04.24.24.42.48.42h3.86c.24 0 .44-.18.48-.42l.36-2.53c.59-.24 1.14-.55 1.63-.94l2.37.95a.48.48 0 0 0 .6-.21l1.93-3.32a.48.48 0 0 0-.11-.63l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
              />
            </svg>
          </dc.Button>
        </dc.Group>
        <div style={{ fontSize: "12px", color: "var(--text-normal)" }}>
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </div>
      </div>

      {/* EDITING PANEL (below header, in normal flow) */}
      {isEditing && (
        <div style={{ padding: "10px", backgroundColor: "var(--background-primary)" }}>
          <dc.Group style={styles.controlGroup}>
            <components.PaginationSettings
              isEnabled={isPaginationEnabled}
              setIsEnabled={setIsPaginationEnabled}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
            />
            <DisplaySettingsEditor
              truncateText={truncateText}
              setTruncateText={setTruncateText}
              baseline={baselineCellHeight}
              cellHeightOffset={cellHeightOffset}
              setCellHeightOffset={setCellHeightOffset}
            />
          </dc.Group>
          <div style={styles.editingContainer}>
            {columnsToShow.map((col, idx) => (
              <components.EditColumnBlock
                key={col}
                columnId={col}
                index={idx}
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
            <components.AddColumn
              newHeaderLabel={newHeaderLabel}
              setNewHeaderLabel={setNewHeaderLabel}
              newFieldLabel={newFieldLabel}
              setNewFieldLabel={setNewFieldLabel}
              addNewColumn={addNewColumn}
            />
          </div>
        </div>
      )}

      {/* DATA TABLE (below header and editing panel) */}
      <div style={{ flex: 1, position: "relative", overflowY: "auto", paddingBottom: "80px" }}>
        <components.DataTable
          key={`datatable-${currentPage}`}
          columnsToShow={columnsToShow}
          dynamicColumnProperties={dynamicColumnProperties}
          data={paginatedData}
          groupByColumns={groupByColumns}
          onUpdateEntry={onUpdateEntry}
          onDeleteEntry={onDeleteEntry}
          displaySettings={currentDisplaySettings}
          app={app}
        />
      </div>

      {/* FIXED PAGINATION BAR AT BOTTOM (pushes down by setting bottom margin) */}
      {isPaginationEnabled && (
        <div
          style={{
            ...styles.pagination,
            position: "fixed",
            bottom: 10, // Pushes pagination a bit lower
            left: 0,
            right: 0,
            zIndex: 10000,
            backgroundColor: "var(--background-primary)",
            height: "80px", // Fixed height for pagination bar
          }}
        >
          <components.Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageInput={pageInput}
            setPageInput={setPageInput}
            totalEntries={totalEntries}
          />
        </div>
      )}
    </div>
  );
}


////////////////////////////////////////////////////
///                 EXPORT                       ///
////////////////////////////////////////////////////
return { View, DisplaySettingsEditor };

```

----








# Components

```jsx
////////////////////////////////////////////////////
///                 Components                   ///
////////////////////////////////////////////////////

const componentFileComponents = "_OPERATION/PRIVATE/DATACORE/0 DATACORE.flexilis/D.q.datacore.flexilis.v4.component.md"; //CHANGE this to your own PATH/renamed filename

// Import React hooks and helper functions.
const { useState, useEffect, useMemo, useRef } = dc;
const { getProperty: helperGetProperty } = await dc.require(dc.headerLink(componentFileComponents, "HelperFunctions"));
const { getStyles } = await dc.require(dc.headerLink(componentFileComponents, "ViewerStyles"));
const styles = getStyles();

/**
 * DraggableLink Component
 *
 * Renders a link that supports drag-and-drop functionality.
 * Updated to open the file via the Obsidian API when clicked and always show the full title on hover.
 */
function DraggableLink({ entry, title, fullTitle, app, noTruncate }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", `[[${fullTitle || title}]]`);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (app && app.workspace && typeof app.workspace.openLinkText === "function") {
      app.workspace.openLinkText(fullTitle || title, entry.$path, false);
    }
  };

  return (
    <div className="cell-wrapper" style={styles.cellWrapper}>
      <a
        href="#"
        className="internal-link"
        draggable
        onDragStart={handleDragStart}
        onClick={handleClick}
        data-href={entry.$path || fullTitle || title}
        data-type="file"
        // Removed any "title" or tooltip logic
        style={{
          ...styles.draggableLink,
          display: "block",
          ...(noTruncate
            ? {
                whiteSpace: "normal",
                overflow: "visible",
                textOverflow: "unset",
              }
            : {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }
          ),
        }}
      >
        {title}
      </a>
    </div>
  );
}



/**
 * CustomBooleanCell Component
 *
 * Renders a checkbox cell.
 */
function CustomBooleanCell({ entry, property, onUpdate }) {
  // Retrieve the initial value from the entry.
  const initialValue = helperGetProperty(entry, property);
  const [localValue, setLocalValue] = useState(initialValue);

  // Keep the local state in sync with external changes.
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleToggle = () => {
    const previousValue = localValue;
    const newValue = !localValue;
    // Immediately update the UI.
    setLocalValue(newValue);
    // Defer the async update until after the UI renders.
    requestAnimationFrame(() => {
      onUpdate(entry, property, newValue).catch((error) => {
        // On error, revert the state and notify the user.
        setLocalValue(previousValue);
        alert("Error updating checkbox: " + error.message);
      });
    });
  };

  // Combine the base style with the active style if the checkbox is checked.
  const cellStyle = {
    ...styles.customBooleanCell,
    ...(localValue ? styles.customBooleanCellActive : {}),
  };

  return (
    <div style={cellStyle} onMouseDown={handleToggle} title="Click to mark as complete">
      {localValue && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
            fill="white"
          />
        </svg>
      )}
    </div>
  );
}


/**
 * EditableCell Component
 *
 * Renders a cell that supports inline editing.
 */
function EditableCell({
  entry,
  property,
  onUpdate,
  displaySettings = {
    truncateText: true,
    fixedWidth: "220px",
    cellHeight: "50px",
  },
  forceBoolean = false,
}) {
  const [isEditing, setIsEditing] = dc.useState(false);
  const [localValue, setLocalValue] = dc.useState("");
  const inputRef = dc.useRef(null);

  // ... plus any fade logic if you want for non-editing mode
  // (showLeftFade, showRightFade, handleScroll, etc.)

  // Retrieve cell value
  let value = helperGetProperty(entry, property);
  // ... handle booleans if needed

  // Convert to string
  const rawText = typeof value === "string" ? value : String(value ?? "");
  const displayText = rawText.trim() === "" ? "\u00A0" : rawText;

  dc.useEffect(() => {
    if (!isEditing) {
      setLocalValue(rawText);
    }
  }, [rawText, isEditing]);

  // When we switch to editing, focus the input
  dc.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // inputRef.current.select(); // if you want to highlight text
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== rawText) {
      onUpdate(entry, property, localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleBlur();  // commit
    else if (e.key === "Escape") {
      setLocalValue(rawText); // revert
      setIsEditing(false);
    }
  };

  if (isEditing) {
    // Render a normal <input> so we can focus it
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          width: displaySettings.fixedWidth,
          height: displaySettings.cellHeight,
        }}
      />
    );
  }

  // Non-editing mode: truncated or full
  if (!displaySettings.truncateText) {
    return (
      <div
        style={{
          width: displaySettings.fixedWidth,
          minHeight: displaySettings.cellHeight,
          whiteSpace: "pre-wrap",
          cursor: "text",
          display: "flex",
          alignItems: "center",
        }}
        onClick={() => setIsEditing(true)}
      >
        {displayText}
      </div>
    );
  }

  // Truncate = true → horizontally scrollable container, etc.
  // (Same logic as before, minus the <dc.Textbox>.)
  return (
    <div
      style={{
        position: "relative",
        width: displaySettings.fixedWidth,
        height: displaySettings.cellHeight,
        cursor: "text",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
      onClick={() => setIsEditing(true)}
    >
      {/* horizontally scrollable container */}
      <div
        // ref={scrollContainerRef}
        // onScroll={handleScroll}
        style={{
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          whiteSpace: "nowrap",
          height: "100%",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        {displayText}
      </div>
      {/* fade overlays if you want them */}
    </div>
  );
}




/**
 * ScrollableCell Component
 *
 * Renders children within a container that scrolls horizontally on hover.
 */
function ScrollableCell({ children }) {
  return (
    <div
      className="scrollable-cell"
      style={{
        width: "100%",
        whiteSpace: "nowrap",
        overflowX: "auto",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}








////////////////////////////////////////////////////////////////
///                 TagListCell Component                    ///
////////////////////////////////////////////////////////////////


function TagListCell({ entry, property, onUpdateEntry, displaySettings, app }) {
  // 1) Convert the frontmatter value to an array of tags.
  const rawValue = helperGetProperty(entry, property);
  let initialArray = [];
  if (Array.isArray(rawValue)) {
    initialArray = rawValue;
  } else if (typeof rawValue === "string") {
    initialArray = rawValue.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    initialArray = [];
  }

  // 2) Local state for tags, new tag input, and editing mode.
  const [items, setItems] = dc.useState(initialArray);
  const [newItem, setNewItem] = dc.useState("");
  const [isEditing, setIsEditing] = dc.useState(false);

  // Reference for the input so we can focus it when editing.
  const inputRef = dc.useRef(null);
  dc.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Helper: Update the file's YAML frontmatter.
  function localUpdateEntry(entry, property, newValue) {
    if (!app || !app.vault) return;
    const file = app.vault.getAbstractFileByPath(entry.$path);
    if (file && (typeof TFile === "undefined" || file instanceof TFile)) {
      app.vault
        .read(file)
        .then((content) => {
          const updatedContent = customUpdateFrontmatter(content, property, newValue);
          return app.vault.modify(file, updatedContent);
        })
        .catch((error) => {
          console.error(`Error updating "${entry.$path}":`, error);
          alert("Error updating file: " + error.message);
        });
    }
  }

  // Helper: Update YAML frontmatter content (supports multiline lists).
  function customUpdateFrontmatter(content, property, newValue) {
    const yamlRegex = /^---\n([\s\S]*?)\n---\n?/;
    const match = content.match(yamlRegex);
    if (match) {
      let yamlContent = match[1];
      const propertyRegex = new RegExp("^" + property + ":((?:\\n[ \\t]+-.*)+|\\s*.*)$", "m");
      if (propertyRegex.test(yamlContent)) {
        yamlContent = yamlContent.replace(propertyRegex, property + ":" + newValue);
      } else {
        yamlContent += "\n" + property + ":" + newValue;
      }
      return content.replace(yamlRegex, "---\n" + yamlContent + "\n---\n");
    } else {
      return "---\n" + property + ":" + newValue + "\n---\n" + content;
    }
  }

  // Convert an array of strings to a YAML multiline list.
  function toYamlList(arr) {
    if (!arr || arr.length === 0) {
      return " []";
    }
    return "\n" + arr.map(item => `  - ${item}`).join("\n");
  }

  // Write the current tag list back to YAML frontmatter.
  const updateFrontmatterArray = (updatedArray) => {
    const yamlValue = toYamlList(updatedArray);
    localUpdateEntry(entry, property, yamlValue);
  };

  // Handle key press in the tag input.
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const trimmed = newItem.trim();
      if (!trimmed) return;
      if (items.includes(trimmed)) {
        alert(`"${trimmed}" already exists in this list.`);
        return;
      }
      const updated = [...items, trimmed];
      setItems(updated);
      setNewItem("");
      updateFrontmatterArray(updated);
    }
  };

  // Remove a tag from the list.
  const handleRemoveItem = (removed) => {
    const updated = items.filter((tag) => tag !== removed);
    setItems(updated);
    updateFrontmatterArray(updated);
  };

  // Activate edit mode when the cell is clicked.
  const handleContainerClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  // Exit edit mode when focus leaves the cell.
  const handleBlur = (e) => {
    setTimeout(() => {
      if (!e.currentTarget.contains(document.activeElement)) {
        setIsEditing(false);
        setNewItem("");
      }
    }, 100);
  };

  // Render each tag chip with its remove ("x") button.
  const renderChips = () =>
    items.map((tag) => (
      <div
        key={tag}
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: "var(--background-secondary)",
          color: "var(--text-normal)",
          padding: "4px 10px",
          borderRadius: "9999px",
          fontSize: "13px",
          border: "1px solid var(--background-modifier-border)",
          marginRight: "4px",
        }}
      >
        <span>{tag}</span>
        <button
            onClick={(ev) => {
                ev.stopPropagation(); // Prevent toggling edit mode when clicking remove
                handleRemoveItem(tag);
            }}
            style={{
                marginLeft: "6px",
                // --- The keys to removing the box: ---
                background: "none",
                border: "none",
                outline: "none",
                boxShadow: "none",
                appearance: "none",
                // -------------------------------------
                cursor: "pointer",
                color: "var(--text-faint)",
                fontWeight: "bold",
                fontSize: "12px",
                lineHeight: 1,
                padding: 0, // also remove extra padding
            }}
            title="Remove tag"
            >
            x
        </button>
      </div>
    ));

  // Determine truncation mode from display settings.
  const isTruncated = displaySettings.truncateText === true;

  // --- Outer container style ---
  // • In truncation mode, we assume a fixed height is set (via displaySettings.cellHeight)
  //   and add horizontal scrolling (overflowX: auto) for the complete cell.
  // • Otherwise, the cell grows naturally.
  const outerContainerStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "6px 8px",
    backgroundColor: "var(--background-primary)",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
    overflowX: isTruncated ? "auto" : "visible",
    overflowY: isTruncated ? "hidden" : "visible",
    height:
      isTruncated && displaySettings.cellHeight
        ? displaySettings.cellHeight + "px"
        : "auto",
  };

  // --- Inner wrapper style ---
  // • In truncation mode, force a single line with no wrapping.
  // • Otherwise, allow tags to wrap.
  const wrapperStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: isTruncated ? "nowrap" : "wrap",
    whiteSpace: isTruncated ? "nowrap" : "normal",
  };

  return (
    <div
      style={outerContainerStyle}
      onClick={handleContainerClick}
      onBlur={handleBlur}
    >
      <div style={wrapperStyle}>
        {renderChips()}
        {isEditing && (
          <input
            ref={inputRef}
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setIsEditing(false);
              setNewItem("");
            }}
            placeholder="Type and press Enter"
            style={{
              border: "1px solid var(--background-modifier-border)",
              outline: "none",
              backgroundColor: "var(--background-primary)",
              color: "var(--text-normal)",
              fontSize: "13px",
              minWidth: "80px",
            }}
            onClick={(ev) => ev.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}






/**
 * DefaultTextCell Component
 *
 * Renders cell text using EditableCell if the cell is editable; otherwise, displays text.
 */
function DefaultTextCell({ entry, property, onUpdateEntry, displaySettings }) {
  const fullText = (val) => {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") return val.value || val.raw || "";
    return String(val);
  };
  const rawValue = helperGetProperty(entry, property);
  const text = fullText(rawValue);
  if (property.endsWith(".obsidian")) {
    return displaySettings.truncateText ? (
      <ScrollableCell>{text}</ScrollableCell>
    ) : (
      <div style={{ whiteSpace: "normal", wordBreak: "break-word", overflow: "visible" }}>
        {text}
      </div>
    );
  }
  return (
    <EditableCell
      entry={entry}
      property={property}
      onUpdate={onUpdateEntry}
      displaySettings={displaySettings}
    />
  );
}

/**
 * EditableHeader Component
 *
 * Allows inline editing of a column header.
 */
function EditableHeader({ columnId, editedHeaders, setEditedHeaders }) {
  const [isEditing, setIsEditing] = useState(false);
  const [headerValue, setHeaderValue] = useState(editedHeaders[columnId] || columnId);
  
  const handleBlur = () => {
    const trimmed = headerValue.trim();
    if (!trimmed) {
      alert("Header cannot be empty.");
      setHeaderValue(editedHeaders[columnId] || columnId);
    } else {
      setIsEditing(false);
      setEditedHeaders({ ...editedHeaders, [columnId]: trimmed });
    }
  };
  
  return isEditing ? (
    <dc.Textbox
      value={headerValue}
      onChange={(e) => setHeaderValue(e.target.value)}
      onBlur={handleBlur}
      autoFocus
      style={styles.headerTextbox}
    />
  ) : (
    <label onClick={() => setIsEditing(true)} style={{ fontWeight: "bold", cursor: "pointer" }}>
      {headerValue}
    </label>
  );
}

/**
 * EditColumnBlock Component
 *
 * Renders a block for editing a column's header and data field.
 */
function EditColumnBlock({
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
}) {
  const isGrouped = groupByColumns.some(group => group.column === columnId);
  const groupIndex = groupByColumns.findIndex(group => group.column === columnId);
  const sortOrder = isGrouped ? groupByColumns[groupIndex].order : "asc";
  
  const handleDragStart = (e) => {
    e.dataTransfer.setData("dragIndex", index);
  };
  
  const handleDrop = (e) => {
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
    if (!isNaN(dragIndex)) {
      const newColumns = [...columnsToShow];
      const dragged = newColumns.splice(dragIndex, 1)[0];
      newColumns.splice(index, 0, dragged);
      setColumnsToShow(newColumns);
    }
  };
  
  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setGroupByColumns(groupByColumns.map(group =>
      group.column === columnId ? { ...group, order: newOrder } : group
    ));
  };
  
  const handleDataFieldChange = (e) => {
    setEditedFields({ ...editedFields, [columnId]: e.target.value });
  };
  
  const handleDataFieldUpdate = () => {
    updateColumn(columnId, editedHeaders[columnId] || columnId, editedFields[columnId] || dynamicColumnProperties[columnId]);
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={styles.editBlock}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <EditableHeader columnId={columnId} editedHeaders={editedHeaders} setEditedHeaders={setEditedHeaders} />
      </div>
      <div style={{ display: "flex", gap: "5px" }}>
        <button onClick={handleDataFieldUpdate} style={styles.inlineButton}>Update</button>
        <button onClick={() => removeColumn(columnId)} style={styles.inlineButton}>Remove</button>
        <button
          onClick={() => {
            if (isGrouped) {
              setGroupByColumns(groupByColumns.filter(group => group.column !== columnId));
            } else {
              setGroupByColumns([...groupByColumns, { column: columnId, order: "asc" }]);
            }
          }}
          style={{ ...styles.inlineButton, backgroundColor: isGrouped ? "var(--interactive-normal)" : undefined }}
        >
          {isGrouped ? "Ungroup" : "Group By"}
        </button>
      </div>
      {isGrouped && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>Group Order: {groupIndex + 1}</span>
          <button
            onClick={() => {
              setGroupByColumns(prev => {
                const idx = prev.findIndex(g => g.column === columnId);
                if (idx > 0) {
                  const newGroup = [...prev];
                  [newGroup[idx - 1], newGroup[idx]] = [newGroup[idx], newGroup[idx - 1]];
                  return newGroup;
                }
                return prev;
              });
            }}
            disabled={groupIndex === 0}
            style={styles.buttonSmall}
          >
            ↑
          </button>
          <button
            onClick={() => {
              setGroupByColumns(prev => {
                const idx = prev.findIndex(g => g.column === columnId);
                if (idx < prev.length - 1) {
                  const newGroup = [...prev];
                  [newGroup[idx], newGroup[idx + 1]] = [newGroup[idx + 1], newGroup[idx]];
                  return newGroup;
                }
                return prev;
              });
            }}
            disabled={groupIndex === groupByColumns.length - 1}
            style={styles.buttonSmall}
          >
            ↓
          </button>
          <button onClick={toggleSortOrder} style={styles.buttonSmall}>
            {sortOrder === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
      )}
      <div>
        <dc.Textbox
          value={editedFields[columnId] || dynamicColumnProperties[columnId]}
          onChange={handleDataFieldChange}
          onBlur={handleDataFieldUpdate}
          style={styles.dataFieldTextbox}
          placeholder="Data Field..."
        />
      </div>
    </div>
  );
}

/**
 * AddColumn Component
 *
 * Renders UI to add a new column.
 */
function AddColumn({ newHeaderLabel, setNewHeaderLabel, newFieldLabel, setNewFieldLabel, addNewColumn }) {
  return (
    <div style={{
      backgroundColor: "var(--background-secondary)",
      borderRadius: "8px",
      border: "1px solid var(--background-modifier-border)",
      padding: "15px",
      width: "100%"
    }}>
      <div style={{ marginBottom: "12px", fontWeight: "bold", fontSize: "16px", color: "var(--text-normal)" }}>
        Add New Column
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <dc.Textbox
          value={newHeaderLabel}
          onChange={(e) => setNewHeaderLabel(e.target.value)}
          placeholder="New Header Label"
          style={{ padding: "8px", border: "1px solid var(--background-modifier-border)", borderRadius: "4px", backgroundColor: "var(--background-primary)", color: "var(--text-normal)", width: "100%" }}
        />
        <dc.Textbox
          value={newFieldLabel}
          onChange={(e) => setNewFieldLabel(e.target.value)}
          placeholder="New Data Field"
          style={{ padding: "8px", border: "1px solid var(--background-modifier-border)", borderRadius: "4px", backgroundColor: "var(--background-primary)", color: "var(--text-normal)", width: "100%" }}
        />
        <button
          onClick={addNewColumn}
          style={{ padding: "8px 16px", backgroundColor: "var(--interactive-accent)", color: "var(--text-on-accent)", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", width: "100%" }}
        >
          Add Column
        </button>
      </div>
    </div>
  );
}

/**
 * PaginationSettings Component
 *
 * Provides controls for toggling pagination and setting items per page.
 */
function PaginationSettings({ isEnabled, setIsEnabled, itemsPerPage, setItemsPerPage }) {
  return (
    <div style={styles.paginationSettingsContainer}>
      <div style={styles.paginationMain}>
        <div style={styles.paginationLeft}>
          <label style={styles.paginationTitle}>Pagination:</label>
          <dc.Checkbox
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            style={{ marginLeft: "10px" }}
          />
        </div>
        {isEnabled && (
          <div style={styles.paginationRight}>
            <label style={styles.paginationLabel}>Items per Page:</label>
            <dc.Textbox
              type="number"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={styles.paginationTextbox}
            />
          </div>
        )}
      </div>
    </div>
  );
}



////////////////////////////////////////////////////
///             New Helper Function              ///
////////////////////////////////////////////////////

/**
 * computeColumnTypes:
 * Precomputes each column's type by iterating over the data rows
 * and using the first non-null value to determine the type via getColumnType.
 */
function computeColumnTypes(columnsToShow, dynamicColumnProperties, app) {
  const columnTypes = {};
  columnsToShow.forEach((col) => {
    const property = dynamicColumnProperties[col];
    let type = "text";
    let editable = true;
    if (property) {
      if (property.includes(".obsidian")) {
        // Obsidian native fields are not editable.
        editable = false;
        if (property === "ctime.obsidian" || property === "mtime.obsidian") {
          type = "datetime";
        } else if (col.toLowerCase().includes("date")) {
          type = "date";
        } else if (property === "name.obsidian") {
          type = "text";
        } else {
          type = "text";
        }
      } else {
        // For non-Obsidian fields, check metadata if available.
        if (
          app &&
          app.metadataTypeManager &&
          app.metadataTypeManager.properties &&
          app.metadataTypeManager.properties[property] &&
          app.metadataTypeManager.properties[property].type
        ) {
          type = app.metadataTypeManager.properties[property].type;
        } else {
          const lower = property.toLowerCase();
          if (lower === "date") {
            type = "date";
          } else if (lower === "checkbox" || lower === "task") {
            type = "checkbox";
          } else if (lower === "number") {
            type = "number";
          } else {
            type = "text";
          }
        }
      }
    }
    columnTypes[col] = { type, editable };
    //console.debug(`Determined type for column ${col}: ${type} (editable: ${editable})`);
  });
  return columnTypes;
}



///////////////////////////////
// 2. getColumnWidth
///////////////////////////////
/**
 * getColumnWidth:
 * Returns a fixed width based on the column type.
 * For date columns, always return 250px; otherwise, default to 150px.
 */
function getColumnWidth(col, dynamicColumnProperties, columnTypes) {
  // Retrieve the column definition (it might be a string or an object)
  let propDef = dynamicColumnProperties[col];

  // If the definition is an object, check if a custom width is provided.
  if (typeof propDef === "object" && propDef !== null) {
    if (propDef.width) return propDef.width; // Use the custom width if available
    // Otherwise, use the provided field value for further checks.
    propDef = propDef.field;
  }

  // Special case: for the "name.obsidian" field, use its specific width.
  if (propDef === "name.obsidian") return 222;

  // For date/datetime types, use a wider column.
  if (
    columnTypes &&
    columnTypes[col] &&
    (columnTypes[col].type === "date" || columnTypes[col].type === "datetime")
  ) {
    return 222;
  }

  // Fallback default width.
  return 150;
}



// Helper function for Headers
function RenderRowsAsTable({
  data,
  columnsToShow,
  dynamicColumnProperties,
  groupByColumns,
  onUpdateEntry,
  onDeleteEntry,
  displaySettings,
  app,
  columnTypes,
  headerWidths,
  actionsWidth
}) {
  return data.map((item, idx) => {
    if (item.isHeader) {
      // Group header row: span all columns
      return (
        <div
          key={"group-" + idx}
          style={{
            display: "table-row",
            backgroundColor: "var(--background-secondary-alt)"
          }}
        >
          <div
            style={{
              display: "table-cell",
              padding: "10px",
              border: "1px solid var(--background-modifier-border)",
              boxSizing: "border-box",
              fontWeight: "bold"
            }}
            colSpan={columnsToShow.length + 1}
          >
            {item.key}
          </div>
        </div>
      );
    } else {
      // Regular data row
      return (
        <div key={"row-" + (item.$path || idx)} style={{ display: "table-row" }}>
          {columnsToShow.map((col, i) => {
            const width = headerWidths[i];
            return (
              <div
                key={col}
                style={{
                  display: "table-cell",
                  padding: "10px",
                  border: "1px solid var(--background-modifier-border)",
                  width,
                  maxWidth: width,
                  boxSizing: "border-box",
                  verticalAlign: "middle"
                }}
              >
                <TableCell
                  entry={item}
                  columnId={col}
                  dynamicColumnProperties={dynamicColumnProperties}
                  onUpdateEntry={onUpdateEntry}
                  displaySettings={displaySettings}
                  app={app}
                  columnTypes={columnTypes}
                />
              </div>
            );
          })}
          <div
            style={{
              display: "table-cell",
              padding: "10px",
              border: "1px solid var(--background-modifier-border)",
              width: actionsWidth,
              maxWidth: actionsWidth,
              boxSizing: "border-box",
              verticalAlign: "middle"
            }}
          >
            <ActionCell
              entry={item}
              onDeleteEntry={onDeleteEntry}
              displaySettings={displaySettings}
            />
          </div>
        </div>
      );
    }
  });
}



////////////////////////////////////////////////////
///             DataTable Component              ///
////////////////////////////////////////////////////


/* ===========================
   Helper Functions
=========================== */

// Computes each column's type.
function calculateColumnTypes(columnsToShow, dynamicColumnProperties) {
  const types = {};
  for (const col of columnsToShow) {
    const prop = dynamicColumnProperties[col];
    if (typeof prop === "string") {
      if (prop.endsWith(".obsidian")) {
        types[col] =
          prop === "ctime.obsidian" || prop === "mtime.obsidian"
            ? { type: "datetime", editable: false }
            : { type: "text", editable: false };
      } else {
        const lower = prop.toLowerCase();
        if (lower.includes("date")) types[col] = { type: "date", editable: true };
        else if (lower.includes("checkbox") || lower.includes("task"))
          types[col] = { type: "checkbox", editable: true };
        else if (lower.includes("number"))
          types[col] = { type: "number", editable: true };
        else types[col] = { type: "text", editable: true };
      }
    } else {
      types[col] = { type: "text", editable: true };
    }
  }
  return types;
}

// Returns a fixed width for a given column.
function getColumnWidth(col, dynamicColumnProperties, columnTypes) {
  let defn = dynamicColumnProperties[col];
  if (typeof defn === "object" && defn !== null && defn.width) {
    return defn.width;
  }
  if (defn === "name.obsidian") return 220;
  const fieldType = columnTypes[col]?.type || "text";
  if (fieldType === "date" || fieldType === "datetime") return 240;
  return 150;
}

/* ===========================
   NonVirtualizedTable Component
   (for paginated mode)
=========================== */
function NonVirtualizedTable({
  columnsToShow,
  dynamicColumnProperties,
  data,
  onUpdateEntry,
  onDeleteEntry,
  displaySettings,
  app,
  columnTypes,
  headerWidths,
  actionsWidth,
  totalWidth,
}) {
  // Render a single row (handles both group headers and data rows)
  function renderRow(row, idx) {
    if (row.isHeader) {
      return (
        <tr key={`group-${idx}`} style={{ backgroundColor: "var(--background-secondary-alt)" }}>
          <td
            colSpan={columnsToShow.length + 1}
            style={{
              padding: "10px",
              border: "1px solid var(--background-modifier-border)",
              fontWeight: "bold",
            }}
          >
            {row.key}
          </td>
        </tr>
      );
    }
    return (
      <tr key={`row-${row.$path || idx}`}>
        {columnsToShow.map((col, i) => {
          const width = headerWidths[i];
          return (
            <td
              key={col}
              style={{
                width,
                maxWidth: width,
                padding: "10px",
                border: "1px solid var(--background-modifier-border)",
                overflow: "hidden",
                verticalAlign: "middle",
              }}
            >
              <TableCell
                entry={row}
                columnId={col}
                dynamicColumnProperties={dynamicColumnProperties}
                onUpdateEntry={onUpdateEntry}
                displaySettings={displaySettings}
                app={app}
                columnTypes={columnTypes}
              />
            </td>
          );
        })}
        <td
          style={{
            width: actionsWidth,
            maxWidth: actionsWidth,
            padding: "10px",
            border: "1px solid var(--background-modifier-border)",
            overflow: "hidden",
            verticalAlign: "middle",
          }}
        >
          <ActionCell entry={row} onDeleteEntry={onDeleteEntry} displaySettings={displaySettings} />
        </td>
      </tr>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflowY: "auto" }}>
      <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: totalWidth }}>
        <thead
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10000,
            backgroundColor: "var(--background-primary)",
          }}
        >
          <tr>
            {columnsToShow.map((col, i) => (
              <th
                key={col}
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10000,
                  backgroundColor: "var(--background-primary)",
                  width: headerWidths[i],
                  maxWidth: headerWidths[i],
                  border: "1px solid var(--background-modifier-border)",
                  textAlign: "center",
                  padding: "8px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {col}
              </th>
            ))}
            <th
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10000,
                backgroundColor: "var(--background-primary)",
                width: actionsWidth,
                maxWidth: actionsWidth,
                border: "1px solid var(--background-modifier-border)",
                textAlign: "center",
                padding: "8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? data.map(renderRow) : (
            <tr>
              <td colSpan={columnsToShow.length + 1} style={{ textAlign: "center", padding: "20px" }}>
                No data to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===========================
   VirtualizedTable Component
   (for non-pagination mode with variable-height virtualization)
=========================== */
// VirtualRow Component (not memoized)
function VirtualRow({
  row,
  globalIndex,
  columnsToShow,
  headerWidths,
  actionsWidth,
  onUpdateEntry,
  onDeleteEntry,
  displaySettings,
  app,
  dynamicColumnProperties,
  columnTypes,
  updateRowHeight,
}) {
  const rowRef = useRef(null);
  useEffect(() => {
    if (rowRef.current) {
      const height = rowRef.current.getBoundingClientRect().height;
      updateRowHeight(globalIndex, height);
    }
  }, [globalIndex, updateRowHeight, row]);

  if (row.isHeader) {
    return (
      <tr ref={rowRef} key={`group-${globalIndex}`} style={{ backgroundColor: "var(--background-secondary-alt)" }}>
        <td
          colSpan={columnsToShow.length + 1}
          style={{ padding: "10px", border: "1px solid var(--background-modifier-border)", fontWeight: "bold" }}
        >
          {row.key}
        </td>
      </tr>
    );
  }

  return (
    <tr ref={rowRef} key={`row-${row.$path || globalIndex}`}>
      {columnsToShow.map((col, i) => {
        const width = headerWidths[i];
        return (
          <td
            key={col}
            style={{
              width,
              maxWidth: width,
              padding: "10px",
              border: "1px solid var(--background-modifier-border)",
              overflow: "hidden",
              verticalAlign: "middle",
            }}
          >
            <TableCell
              entry={row}
              columnId={col}
              dynamicColumnProperties={dynamicColumnProperties}
              onUpdateEntry={onUpdateEntry}
              displaySettings={displaySettings}
              app={app}
              columnTypes={columnTypes}
            />
          </td>
        );
      })}
      <td
        style={{
          width: actionsWidth,
          maxWidth: actionsWidth,
          padding: "10px",
          border: "1px solid var(--background-modifier-border)",
          overflow: "hidden",
          verticalAlign: "middle",
        }}
      >
        <ActionCell
          entry={row}
          onDeleteEntry={onDeleteEntry}
          displaySettings={displaySettings}
        />
      </td>
    </tr>
  );
}

// VirtualizedTable Component with caching and throttled scroll events.
function VirtualizedTable({
  columnsToShow,
  dynamicColumnProperties,
  data,
  onUpdateEntry,
  onDeleteEntry,
  displaySettings,
  app,
  columnTypes,
  headerWidths,
  actionsWidth,
  totalWidth,
}) {
  const defaultRowHeight = 50;
  const [rowHeights, setRowHeights] = useState({});
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollAnimationFrame = useRef(null);

  // Cache cumulative heights in a ref; update when data or rowHeights change.
  const cumulativeHeightsRef = useRef([]);
  useEffect(() => {
    let total = 0;
    const cum = data.map((_, i) => {
      const h = rowHeights[i] ?? defaultRowHeight;
      total += h;
      return total;
    });
    cumulativeHeightsRef.current = cum;
  }, [data, rowHeights, defaultRowHeight]);

  // Measure container height
  useEffect(() => {
    function measureContainer() {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    }
    measureContainer();
    window.addEventListener("resize", measureContainer);
    return () => window.removeEventListener("resize", measureContainer);
  }, []);

  // Throttle scroll events with requestAnimationFrame.
  const handleScroll = (e) => {
    const newScrollTop = e.target.scrollTop;
    if (scrollAnimationFrame.current) {
      cancelAnimationFrame(scrollAnimationFrame.current);
    }
    scrollAnimationFrame.current = requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
    });
  };

  const binarySearch = (arr, value) => {
    let low = 0, high = arr.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (arr[mid] < value) low = mid + 1;
      else high = mid - 1;
    }
    return low;
  };

  const cumulativeHeights = cumulativeHeightsRef.current;
  const startIndex = useMemo(() => binarySearch(cumulativeHeights, scrollTop), [cumulativeHeights, scrollTop]);
  const endIndex = useMemo(() => {
    const scrollBottom = scrollTop + containerHeight;
    return Math.min(data.length, binarySearch(cumulativeHeights, scrollBottom) + 1);
  }, [cumulativeHeights, scrollTop, containerHeight, data.length]);

  // Overscan: increase rendered rows to reduce blank areas during fast scrolling.
  const overscanCount = 10;
  const startIndexOverscan = Math.max(0, startIndex - overscanCount);
  const endIndexOverscan = Math.min(data.length, endIndex + overscanCount);
  const visibleRows = data.slice(startIndexOverscan, endIndexOverscan);

  const totalContentHeight = cumulativeHeights[cumulativeHeights.length - 1] || 0;
  const topSpacerHeight = startIndexOverscan > 0 ? cumulativeHeights[startIndexOverscan - 1] : 0;
  const bottomSpacerHeight = totalContentHeight - (endIndexOverscan > 0 ? cumulativeHeights[endIndexOverscan - 1] : 0);

  const updateRowHeight = (index, height) => {
    setRowHeights((prev) => {
      if (prev[index] === height) return prev;
      return { ...prev, [index]: height };
    });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ position: "relative", width: "100%", height: "100%", overflowY: "auto" }}
    >
      <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: totalWidth }}>
        <thead
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10000,
            backgroundColor: "var(--background-primary)",
          }}
        >
          <tr>
            {columnsToShow.map((col, i) => (
              <th
                key={col}
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10000,
                  backgroundColor: "var(--background-primary)",
                  width: headerWidths[i],
                  maxWidth: headerWidths[i],
                  border: "1px solid var(--background-modifier-border)",
                  textAlign: "center",
                  padding: "8px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {col}
              </th>
            ))}
            <th
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10000,
                backgroundColor: "var(--background-primary)",
                width: actionsWidth,
                maxWidth: actionsWidth,
                border: "1px solid var(--background-modifier-border)",
                textAlign: "center",
                padding: "8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: topSpacerHeight }}>
            <td colSpan={columnsToShow.length + 1} style={{ padding: 0, margin: 0 }} />
          </tr>
          {visibleRows.length > 0 ? visibleRows.map((row, localIndex) => (
            <VirtualRow
              key={startIndexOverscan + localIndex}
              row={row}
              globalIndex={startIndexOverscan + localIndex}
              columnsToShow={columnsToShow}
              headerWidths={headerWidths}
              actionsWidth={actionsWidth}
              onUpdateEntry={onUpdateEntry}
              onDeleteEntry={onDeleteEntry}
              displaySettings={displaySettings}
              app={app}
              dynamicColumnProperties={dynamicColumnProperties}
              columnTypes={columnTypes}
              updateRowHeight={updateRowHeight}
            />
          )) : (
            <tr>
              <td colSpan={columnsToShow.length + 1} style={{ textAlign: "center", padding: "20px" }}>
                No data to display.
              </td>
            </tr>
          )}
          <tr style={{ height: bottomSpacerHeight }}>
            <td colSpan={columnsToShow.length + 1} style={{ padding: 0, margin: 0 }} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}


/* ===========================
   Main DataTable Component
=========================== */
function DataTable(props) {
  const {
    columnsToShow,
    dynamicColumnProperties,
    data,
    onUpdateEntry,
    onDeleteEntry,
    displaySettings,
    app,
  } = props;

  const isPaginationEnabled = displaySettings?.pagination?.isEnabled === true;
  const virtualizationEnabled = !isPaginationEnabled;

  const columnTypes = useMemo(
    () => calculateColumnTypes(columnsToShow, dynamicColumnProperties),
    [columnsToShow, dynamicColumnProperties]
  );
  const headerWidths = columnsToShow.map((col) =>
    getColumnWidth(col, dynamicColumnProperties, columnTypes)
  );
  const actionsWidth = 150;
  const totalWidth = headerWidths.reduce((sum, w) => sum + w, 0) + actionsWidth;

  return virtualizationEnabled ? (
    <VirtualizedTable
      columnsToShow={columnsToShow}
      dynamicColumnProperties={dynamicColumnProperties}
      data={data}
      onUpdateEntry={onUpdateEntry}
      onDeleteEntry={onDeleteEntry}
      displaySettings={displaySettings}
      app={app}
      columnTypes={columnTypes}
      headerWidths={headerWidths}
      actionsWidth={actionsWidth}
      totalWidth={totalWidth}
    />
  ) : (
    <NonVirtualizedTable
      columnsToShow={columnsToShow}
      dynamicColumnProperties={dynamicColumnProperties}
      data={data}
      onUpdateEntry={onUpdateEntry}
      onDeleteEntry={onDeleteEntry}
      displaySettings={displaySettings}
      app={app}
      columnTypes={columnTypes}
      headerWidths={headerWidths}
      actionsWidth={actionsWidth}
      totalWidth={totalWidth}
    />
  );
}



/**
 * UnifiedDateCell
 *
 * A single date component used for both editable and non‑editable dates.
 * When editable is true it renders a date/datetime input with an "Include Time"
 * toggle; otherwise, it shows a formatted date text.
 *
 * The styling (padding, border, width, etc.) is consistent to ensure that the header
 * and all cells look the same.
 */
function UnifiedDateCell({ value, onChange, editable, style = {}, forceTime = false }) {
  const { useState, useRef } = dc;

  // Convert incoming value to a string.
  const getStringValue = (val) => {
    if (typeof val === "string") return val;
    if (val && typeof val.toISO === "function") return val.toISO();
    return String(val);
  };
  const stringValue = getStringValue(value);

  // Parse a date string into date and time parts.
  const parseDateTime = (val) => {
    if (!val || typeof val !== "string" || !val.trim() || val.includes("Invalid")) {
      return { datePart: "", timePart: "", hasTime: false };
    }
    if (val.includes("T")) {
      const [datePart, timePart = ""] = val.split("T");
      return { datePart, timePart, hasTime: true };
    }
    return { datePart: val, timePart: "", hasTime: false };
  };

  // Format a date as "YYYY-MM-DD".
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // Validate a time string (HH:MM).
  const isValidTime = (tStr) => /^\d{2}:\d{2}$/.test(tStr);

  // Initial parsing of the current value.
  const initial = parseDateTime(stringValue);
  const normalizedTime =
    initial.timePart && initial.timePart.length >= 5
      ? initial.timePart.substring(0, 5)
      : initial.timePart;

  // For date-only fields, ignore any time part.
  // Default includeTime to true only if forced; otherwise, default to date-only.
  const [localDate, setLocalDate] = useState(initial.datePart ? formatDate(initial.datePart) : "");
  const [localTime, setLocalTime] = useState(isValidTime(normalizedTime) ? normalizedTime : "");
  const [includeTime, setIncludeTime] = useState(forceTime ? true : false);

  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  // Build the final string: "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM".
  const buildDateTimeString = (d, t, includeT) => {
    if (!d) return "";
    return includeT && t ? `${d}T${t}` : d;
  };

  // Non-editable display.
  if (!editable) {
    let displayVal = "";
    if (stringValue) {
      const parsed = new Date(stringValue);
      if (!isNaN(parsed.getTime())) {
        displayVal = includeTime
          ? parsed.toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: false,
            })
          : parsed.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
      } else {
        displayVal = stringValue;
      }
    }
    return (
      <div
        style={{
          ...style,
          padding: "8px 10px",
          border: "none",
          borderRadius: "6px",
          backgroundColor: "transparent",
          width: "100%",
          boxSizing: "border-box",
          color: "var(--text-normal)",
        }}
        title={displayVal}
      >
        {displayVal}
      </div>
    );
  }

  // Immediate onChange handlers.
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setLocalDate(newDate);
    onChange(buildDateTimeString(newDate, localTime, includeTime));
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setLocalTime(newTime);
    onChange(buildDateTimeString(localDate, newTime, includeTime));
  };

  const handleIncludeTimeChange = () => {
    const newIncludeTime = !includeTime;
    setIncludeTime(newIncludeTime);
    onChange(buildDateTimeString(localDate, localTime, newIncludeTime));
  };

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      {/*
        Hide native calendar/time picker indicators.
      */}
      <style>{`
        .unified-date-input,
        .unified-time-input {
          background-image: none !important;
        }
        .unified-date-input::-webkit-calendar-picker-indicator,
        .unified-time-input::-webkit-calendar-picker-indicator {
          display: none !important;
        }
        .unified-date-input::-moz-calendar-picker-indicator,
        .unified-time-input::-moz-calendar-picker-indicator {
          display: none !important;
        }
      `}</style>

      {/* Date Input + Calendar Icon */}
      <div style={{ position: "relative", width: "100%", marginBottom: "6px" }}>
        <input
          ref={dateInputRef}
          type="date"
          value={localDate}
          onChange={handleDateChange}
          className="unified-date-input"
          style={{
            padding: "8px 36px 8px 10px",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "6px",
            backgroundColor: "var(--background-secondary)",
            color: "var(--text-normal)",
            width: "100%",
            boxSizing: "border-box",
          }}
          placeholder="YYYY-MM-DD"
        />
        {/* Smaller 12×12 Calendar SVG */}
        <svg
          onClick={() => {
            if (dateInputRef.current?.showPicker) {
              dateInputRef.current.showPicker();
            } else {
              dateInputRef.current.focus();
            }
          }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "var(--text-normal)",
          }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>

      {/* Time Input + Clock Icon: only shown when Include Time is toggled on */}
      {includeTime && (
        <div style={{ position: "relative", width: "100%", marginBottom: "6px" }}>
          <input
            ref={timeInputRef}
            type="time"
            value={localTime}
            onChange={handleTimeChange}
            className="unified-time-input"
            style={{
              padding: "8px 36px 8px 10px",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "6px",
              backgroundColor: "var(--background-secondary)",
              color: "var(--text-normal)",
              width: "100%",
              boxSizing: "border-box",
            }}
            placeholder="--:--"
          />
          {/* Smaller 12×12 Clock SVG */}
          <svg
            onClick={() => {
              if (timeInputRef.current?.showPicker) {
                timeInputRef.current.showPicker();
              } else {
                timeInputRef.current.focus();
              }
            }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "var(--text-normal)",
            }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
      )}

      {/* Toggle: by default off for date-only columns */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-normal)",
            fontSize: "14px",
          }}
        >
          <input
            type="checkbox"
            checked={includeTime}
            onChange={handleIncludeTimeChange}
            style={{ width: "16px", height: "16px" }}
          />
          Include Time
        </label>
      </div>
    </div>
  );
}



////////////////////////////////////////////////////
///             TableCell Component              ///
////////////////////////////////////////////////////

/**
 * TableCell Component
 *
 * Renders a table cell based on the property type.
 * For "name.obsidian", it renders DraggableLink with the app prop.
 */
function TableCell({ 
  entry, 
  columnId, 
  dynamicColumnProperties, 
  onUpdateEntry, 
  displaySettings, 
  app = {}, 
  columnTypes 
}) {
  const property = dynamicColumnProperties[columnId];

  // Special handling for "name.obsidian" (Titles)
  if (property === "name.obsidian") {
    const text = helperGetProperty(entry, property) || "";
    const cellStyle = {
      padding: "10px",
      borderRight: "none",
      borderBottom: "none",
      backgroundColor: "var(--background-primary)",
      boxSizing: "border-box",
      flex: "0 0 222px",       // Ensures consistent width across rows
      maxWidth: "222px",
      whiteSpace: "normal",    // Allow wrapping
      overflow: "visible",
      wordBreak: "break-word",
    };

    return (
      <div style={cellStyle}>
        <DraggableLink
          entry={entry}
          title={text}
          fullTitle={entry.$name || text}
          app={app}
          noTruncate={true}    // Always show the full title, ignoring global truncation
        />
      </div>
    );
  }

  // Handle non-name columns.
  const width = getColumnWidth(columnId, dynamicColumnProperties, columnTypes);
  const cellStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    borderRight: "none",
    borderBottom: "none",
    backgroundColor: "var(--background-primary)",
    boxSizing: "border-box",
    flex: "0 0 196px",
    maxWidth: "196px",
    whiteSpace: "normal",
    overflow: "visible",
    wordBreak: "break-word",
  };

  // Determine field type and editability.
  const fieldInfo = (columnTypes && columnTypes[columnId])
    ? columnTypes[columnId]
    : { type: "text", editable: true };
  let fieldType = fieldInfo.type;
  const editable = fieldInfo.editable;

  // --- New: Look up underlying metadata type for all fields ---
  // Use the property name or, if it's an Obsidian field, remove the ".obsidian" suffix.
  if (app.metadataTypeManager && app.metadataTypeManager.properties) {
    let metaKey = property;
    if (property.endsWith(".obsidian")) {
      metaKey = property.replace(".obsidian", "");
    }
    const metaProp = app.metadataTypeManager.properties[metaKey];
    if (metaProp && metaProp.type === "checkbox") {
      fieldType = "checkbox";
    }
  }
  // --------------------------------------------------------------

  // Date/datetime fields.
  if (fieldType === "date" || fieldType === "datetime") {
    return (
      <div style={cellStyle}>
        <UnifiedDateCell
          value={helperGetProperty(entry, property)}
          onChange={(newVal) => onUpdateEntry(entry, property, newVal)}
          editable={editable}
          style={{ width: "100%" }}
          forceTime={fieldType === "datetime"} 
        />
      </div>
    );
  }

  // Boolean fields (checkbox).
  if (fieldType === "checkbox") {
    let rawValue = helperGetProperty(entry, property);
    let checkboxState = "undefined";
    if (typeof rawValue === "boolean") {
      checkboxState = rawValue ? "checked" : "unchecked";
    } else if (typeof rawValue === "string") {
      const lower = rawValue.trim().toLowerCase();
      if (lower === "true") checkboxState = "checked";
      else if (lower === "false") checkboxState = "unchecked";
      else checkboxState = "undefined";
    }
    return (
      <div style={cellStyle}>
        {checkboxState === "checked" && (
          <div
            onClick={() => onUpdateEntry(entry, property, false)}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#8a63d2",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="white"/>
            </svg>
          </div>
        )}
        {checkboxState === "unchecked" && (
          <div
            onClick={() => onUpdateEntry(entry, property, true)}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.3)",
              cursor: "pointer"
            }}
          />
        )}
        {checkboxState === "undefined" && (
          <div
            onClick={() => onUpdateEntry(entry, property, true)}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: "2px dashed rgba(255,255,255,0.2)",
              cursor: "pointer"
            }}
          />
        )}
      </div>
    );
  }

  // Number fields.
  if (fieldType === "number") {
    return (
      <div style={cellStyle}>
        <input
          type="number"
          value={helperGetProperty(entry, property) != null ? helperGetProperty(entry, property) : ""}
          onChange={(e) =>
            onUpdateEntry(entry, property, e.target.value === "" ? null : Number(e.target.value))
          }
          style={{ width: "100%", padding: "8px", border: "1px solid var(--background-modifier-border)" }}
        />
      </div>
    );
  }

  // If this property should be treated as a tag list,
  // check against known tag list properties (e.g., tags, ingredients, diet).
  const tagListProperties = ["tags", "ingredients", "diet"];
  if (tagListProperties.includes(property.toLowerCase())) {
    return (
      <div style={cellStyle}>
        <TagListCell
          entry={entry}
          property={property}
          onUpdateEntry={onUpdateEntry}
          displaySettings={displaySettings}
          app={app}
        />
      </div>
    );
  }

  // Default text fields.
  if (editable) {
    return (
      <div style={cellStyle}>
        <DefaultTextCell
          entry={entry}
          property={property}
          onUpdateEntry={onUpdateEntry}
          displaySettings={displaySettings}
        />
      </div>
    );
  } else {
    return (
      <div style={cellStyle}>
        <DefaultTextCell
          entry={entry}
          property={property}
          onUpdateEntry={() => {}}
          displaySettings={displaySettings}
        />
      </div>
    );
  }
}





/**
 * ActionCell Component
 *
 * Renders the actions cell containing the Delete button.
 */
function ActionCell({ entry, onDeleteEntry, displaySettings }) {
  const cellStyle = {
    padding: "10px",
    borderRight: "none",
    borderBottom: "none",
    backgroundColor: "var(--background-primary)",
    boxSizing: "border-box",
    flex: "0 0 150px",
    width: "150px",
    minWidth: "150px",
    height: displaySettings.truncateText ? displaySettings.cellHeight : "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
  return (
    <div style={cellStyle}>
      <dc.Button
        onClick={() => onDeleteEntry(entry)}
        style={{
          backgroundColor: "var(--background-modifier-error)",
          color: "var(--text-on-accent)",
          border: "none",
          padding: "5px 10px",
          cursor: "pointer",
          borderRadius: "4px",
        }}
      >
        Delete
      </dc.Button>
    </div>
  );
}





/**
 * Pagination Component
 *
 * Renders pagination controls including previous/next buttons and a jump-to-page input.
 */
function Pagination({ currentPage, totalPages, onPageChange, pageInput, setPageInput, totalEntries }) {
  return (
    <div style={styles.pagination}>
      {totalPages > 1 ? (
        <>
          <dc.Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={styles.button}>
            Previous
          </dc.Button>
          <span style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </span>
          <dc.Textbox
            type="number"
            value={pageInput}
            placeholder="Go to page..."
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const pageNum = parseInt(pageInput, 10);
                if (!isNaN(pageNum)) onPageChange(pageNum);
              }
            }}
            style={styles.paginationTextbox}
          />
          <dc.Button onClick={() => onPageChange(parseInt(pageInput, 10))} style={styles.button}>
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
///                 EXPORT                       ///
////////////////////////////////////////////////////

return {
  EditColumnBlock,
  AddColumn,
  PaginationSettings,
  DataTable,
  Pagination,
};

```


-----


# InitialSettings

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  queryPath: "PROJECTS/COOKBOOK/KNOWLEDGE/RECIPES/ALL",
  initialNameFilter: "",
  dynamicColumnProperties: {
    Dish: "name.obsidian",
    Source: "source",
    Genre: "genre",
    Tags: "tags",
    Ingredients: "ingredients",
    "Creation Date": "ctime.obsidian",
  },
  groupByColumns: [], // Default empty array
  pagination: {
    isEnabled: true,
    itemsPerPage: 10,
  },
  display: {
    truncateText: true,         // Toggle truncated vs full text
    truncationLength: 20,       // Number of characters before truncation
  },
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Recipe Viewer",
    newHeaderLabel: "New Header Label",
    newDataField: "New Data Field",
  },
};

return { initialSettings };
```



-----

# HelperFunctions

```jsx
////////////////////////////////////////////////////
///            Helper Functions                  ///
////////////////////////////////////////////////////

const { useState, useMemo, useEffect } = dc;

function isValidEntry(entry) {
  return entry && typeof entry === "object" && entry.$path;
}

function extractValue(field) {
  if (field === null || field === undefined) return "";
  if (typeof field === "object") {
    if ("value" in field) return field.value;
    if ("raw" in field) return field.raw;
  }
  return field;
}

function getProperty(entry, property) {
  
  if (!entry || typeof entry !== "object") return undefined;
  
  // For Obsidian properties (ending with ".obsidian")
  if (property.endsWith(".obsidian")) {
    if (entry.$frontmatter && entry.$frontmatter.hasOwnProperty(property)) {
      var fmVal = entry.$frontmatter[property];
      if (property === "ctime.obsidian" || property === "mtime.obsidian") {
        if (fmVal && typeof fmVal === "object") {
          if (fmVal.value) {
            if (typeof fmVal.value === "string") {
              var d = new Date(fmVal.value);
              if (!isNaN(d.getTime())) return d.toISOString();
              return fmVal.value;
            }
            if (typeof fmVal.value.toISO === "function") {
              return fmVal.value.toISO();
            }
          }
          if (typeof fmVal.raw === "string") {
            var d2 = new Date(fmVal.raw);
            if (!isNaN(d2.getTime())) return d2.toISOString();
            return fmVal.raw;
          }
          if (typeof fmVal.toISO === "function") return fmVal.toISO();
        }
        if (typeof fmVal === "string") {
          var d3 = new Date(fmVal);
          if (!isNaN(d3.getTime())) return d3.toISOString();
          return fmVal;
        }
        return fmVal;
      }
      return fmVal;
    }
    
    var key = property.replace(".obsidian", "");
    if (key === "name") {
      return entry.$path ? entry.$path.split("/").pop().replace(/\.[^/.]+$/, "") : undefined;
    }
    if (key === "ctime" || key === "mtime") {
      var dateVal = entry[key] || entry["$" + key];
      if (dateVal) {
         if (typeof dateVal === "number") return new Date(dateVal * 1000).toISOString();
         if (dateVal && typeof dateVal.toISO === "function") return dateVal.toISO();
         var d4 = new Date(dateVal);
         if (!isNaN(d4.getTime())) return d4.toISOString();
         return undefined;
      }
      return undefined;
    }
    return entry[key] || entry["$" + key];
  }
  
  var value = entry[property];
  if (value === undefined && entry.$frontmatter) {
    value = entry.$frontmatter[property];
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null) {
    if (value.value !== undefined) return value.value;
    if (value.raw !== undefined) return value.raw;
    if (Array.isArray(value)) return value.join(", ");
    return JSON.stringify(value);
  }
  return value;
}




return { getProperty, isValidEntry, extractValue, useState, useMemo, useEffect };

```



----




# ViewerStyles

```jsx
////////////////////////////////////////////////////
///                   ViewerStyles               ///
////////////////////////////////////////////////////

function getStyles() {
  return {
    // Main container for the entire view
    mainContainer: {
      flexDirection: "column",
      backgroundColor: "var(--background-primary)",
      color: "var(--text-normal)",
      height: "100%",
    },
    // Header area at the top of the view
    header: {
      padding: "10px",
      backgroundColor: "var(--background-primary)",
      position: "sticky",   // makes it stick to the top
      top: 0,
      zIndex: 10000,           // ensures it stays above other content
    }, 
    headerTitle: {
      margin: 0,
      paddingBottom: "10px",
    },
    // Grouping for input controls (search, query, buttons)
    controlGroup: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    // Standard textbox style for search and query inputs
    textbox: {
      padding: "10px",
      margin: "5px",
      border: "1px solid var(--background-modifier-border)",
      backgroundColor: "var(--background-primary)",
      color: "var(--text-normal)",
      width: "200px",
      boxSizing: "border-box",
    },
    // Textbox style used in header editing or inline cell editing
    headerTextbox: {
      padding: "4px 6px",
      border: "1px solid var(--background-modifier-border)",
      backgroundColor: "var(--background-secondary)",
      color: "var(--text-normal)",
      width: "100%",
      boxSizing: "border-box",
      fontSize: "14px",
    },
    // Standard button style
    button: {
      padding: "8px 12px",
      backgroundColor: "var(--interactive-accent)",
      color: "var(--text-on-accent)",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      textAlign: "center",
      fontWeight: "bold",
    },
    // Container style for editing blocks (e.g., column settings)
    editBlock: {
      padding: "10px",
      border: "1px solid var(--background-modifier-border)",
      marginBottom: "10px",
      backgroundColor: "var(--background-secondary)",
      color: "var(--text-normal)",
      borderRadius: "8px",
      cursor: "grab",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minWidth: "250px",
      flexShrink: 0,
    },
    // Inline button style (used inside editing blocks)
    inlineButton: {
      padding: "4px 6px",
      backgroundColor: "var(--interactive-accent)",
      color: "var(--text-on-accent)",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
      flex: "1",
    },
    // Container for the table; allows scrolling
    tableContainer: {
      flex: 1,
      overflow: "auto",
      position: "relative",
    },
    // Table header styling (sticky header)
    tableHeader: {
      display: "flex",
      backgroundColor: "var(--background-primary)",
      top: 0,
      flexShrink: 0,
    },
    // Individual header cell style
    tableHeaderCell: {
      flex: "1 0 150px",
      minWidth: "150px",
      padding: "10px",
      fontWeight: "bold",
      textAlign: "left",
      borderBottom: "1px solid var(--background-modifier-border)",
    },
    // Style for each row in the table
    tableRow: {
      display: "flex",
      borderBottom: "1px solid var(--background-modifier-border)",
      flexShrink: 0,
    },
    // Style for a standard table cell
    tableCell: {
      flex: "1 0 150px",
      minWidth: "150px",
      padding: "10px",
      overflow: "hidden",
      position: "relative",
    },
    // Wrapper for cell content (used for tooltips, drag interactions, etc.)
    cellWrapper: {
      position: "relative",
      width: "100%",
      height: "100%",
    },
    // Style for draggable links (e.g., file links)
    draggableLink: {
      cursor: "pointer",
      textDecoration: "underline",
      color: "var(--interactive-accent)",
    },
    // Tooltip that appears when hovering truncated text
    cellTooltip: {
      display: "none",
      position: "absolute",
      backgroundColor: "var(--background-secondary)",
      padding: "8px",
      borderRadius: "4px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      maxWidth: "300px",
      wordBreak: "break-word",
      whiteSpace: "normal",
      top: "100%",
      left: "0",
    },
    // Pagination container at the bottom of the view
    pagination: {
      backgroundColor: "var(--background-primary)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "10px",
      gap: "10px",
      borderTop: "1px solid var(--background-modifier-border)",
      position: "fixed",   // makes it stick to the bottom
      bottom: 0,
      zIndex: 10000,
    },
    // Textbox style used in pagination controls (for page number input)
    paginationTextbox: {
      width: "60px",
      padding: "8px",
      border: "1px solid var(--background-modifier-border)",
      backgroundColor: "var(--background-primary)",
      color: "var(--text-normal)",
      boxSizing: "border-box",
    },
    // Text style for displaying current page/total pages info
    paginationText: {
      fontSize: "14px",
    },
    // Container for pagination settings (e.g., enable/disable pagination)
    paginationSettingsContainer: {
      padding: "10px 0",
      width: "100%",
      borderTop: "none",
    },
    // Main container inside pagination settings for layout
    paginationMain: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // Left side of pagination settings (label + checkbox)
    paginationLeft: {
      display: "flex",
      alignItems: "center",
    },
    // Right side of pagination settings (items per page input)
    paginationRight: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    // Label style for pagination settings
    paginationTitle: {
      fontWeight: "bold",
    },
    paginationLabel: {
      fontSize: "14px",
    },
    // Container wrapping both table and pagination controls
    tableAndPaginationContainer: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",    // ensures vertical scrolling
      position: "relative",
    },
    // Container for column editing controls; scrollable if many columns
    editingContainer: {
      display: "flex",
      flexDirection: "row",
      gap: "10px",
      paddingTop: "10px",
      paddingBottom: "10px",
      overflowX: "auto",
      whiteSpace: "nowrap",
    },
    // Textbox for editing data fields within a column block
    dataFieldTextbox: {
      padding: "4px 6px",
      border: "1px solid var(--background-modifier-border)",
      backgroundColor: "var(--background-secondary)",
      color: "var(--text-normal)",
      width: "100%",
      boxSizing: "border-box",
    },
    // Small button style for group order controls, sort toggles, etc.
    buttonSmall: {
      padding: "2px 4px",
      backgroundColor: "var(--interactive-accent)",
      color: "var(--text-on-accent)",
      border: "none",
      borderRadius: "3px",
      cursor: "pointer",
      fontSize: "12px",
    },
    // Message styling when no data is available
    noData: {
      padding: "20px",
      textAlign: "center",
    },
    // Container for data field inputs within editing components
    dataFieldContainer: {
      display: "flex",
      flexDirection: "column",
    },
    unifiedDateInput: {
    // Your base styles for the unified date input...
    padding: "8px 10px",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "6px",
    backgroundColor: "var(--background-secondary)",
    width: "100%",
    boxSizing: "border-box",
    color: "var(--text-normal)",
    // Nested pseudo‑element for the calendar picker icon:
    "&::-webkit-calendar-picker-indicator": {
      position: "absolute",
      right: "10px",
      marginRight: "0px",
    },
    // Base style for the CustomBooleanCell container.
    customBooleanCell: {
      display: "flex",
      width: "18px",
      height: "18px",
      border: "1.5px dashed var(--text-muted)",
      borderRadius: "3px",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      backgroundColor: "transparent", // default background when unchecked
      margin: "0 auto",
    },
    // Additional style applied when the checkbox is active (checked).
    customBooleanCellActive: {
      backgroundColor: "#8a63d2",
    },
    // Container for any cell content (existing style)
    cellWrapper: {
      position: "relative",
      width: "100%",
      height: "100%",
    },
    // Style to center content (used for boolean cells and others)
    editableCellCenter: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    // Styles for editable cell container when truncation is enabled.
    editableCellContainerTruncated: {
      position: "relative",
      width: "100%",
      padding: "4px 6px",
      boxSizing: "border-box",
      whiteSpace: "nowrap",
      overflowX: "hidden",
      overflowY: "hidden",
      textOverflow: "ellipsis",
    },
    // Styles for editable cell container when truncation is disabled.
    editableCellContainerExpanded: {
      position: "relative",
      width: "100%",
      padding: "4px 6px",
      boxSizing: "border-box",
      whiteSpace: "normal",
      overflow: "visible",
      wordBreak: "break-word",
    },
    // Inline text styles for truncated content.
    inlineTextTruncated: {
      display: "inline-block",
      whiteSpace: "nowrap",
      width: "max-content",
    },
    // Inline text styles for expanded content.
    inlineTextExpanded: {
      display: "block",
      whiteSpace: "normal",
      width: "100%",
    },
    // Header textbox style used for inline editing.
    headerTextbox: {
      padding: "4px 6px",
      border: "1px solid var(--background-modifier-border)",
      backgroundColor: "var(--background-secondary)",
      color: "var(--text-normal)",
      width: "100%",
      boxSizing: "border-box",
      fontSize: "14px",
    },
    // Styles for non‑editable cell when truncation is enabled.
    nonEditableCellTruncated: {
      // We can reuse the cellWrapper as a base.
      ...this.cellWrapper,
      whiteSpace: "nowrap",
      overflowX: "hidden",
      textOverflow: "ellipsis",
    },
    // Styles for non‑editable cell when truncation is disabled.
    nonEditableCellExpanded: {
      ...this.cellWrapper,
      whiteSpace: "normal",
      overflow: "visible",
      wordBreak: "break-word",
    },
  },
  };
}

return { getStyles };
```

