



# viewer

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  vaultName: "YourActualVaultName", // **IMPORTANT:** Replace with your actual vault name :wip
  queryPath: "COOKBOOK/RECIPES/ALL",
  initialNameFilter: "",
  dynamicColumnProperties: {
    Dish: "name.obsidian", // Renamed from 'Recipes' to 'Dish'
    Source: "source",
    Genre: "genre",
    Tags: "tags",
    Ingredients: "ingredients",
    "Creation Date": "ctime.obsidian",
  },
  pagination: {
    isEnabled: true,
    itemsPerPage: 10,
  },
  viewHeight: "600px",
  placeholders: {
    nameFilter: "Search notes...",
    queryPath: "Enter path...",
    headerTitle: "Recipe Viewer",
  },
};

////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

const { useState, useMemo, useEffect, useRef } = dc; // Assuming 'dc' is the Dataview context

function getProperty(entry, property) {
  if (property.endsWith(".obsidian")) {
    const key = property.replace(".obsidian", "");
    const obsidianProps = {
      ctime: entry.$ctime?.toISODate() || "Unknown Date",
      mtime: entry.$mtime?.toISODate() || "Unknown Last Modified Date",
      name: entry.$name || "Unnamed",
    };
    return obsidianProps[key] || "No Data";
  }

  const frontmatterField = entry.$frontmatter?.[property];
  if (frontmatterField !== undefined) {
    if (
      frontmatterField &&
      typeof frontmatterField === "object" &&
      frontmatterField.hasOwnProperty("value")
    ) {
      const value = frontmatterField.value;
      if (Array.isArray(value)) {
        return value.join(", ");
      } else if (value !== null && value !== undefined) {
        return value.toString();
      }
    } else if (Array.isArray(frontmatterField)) {
      return frontmatterField.join(", ");
    } else if (
      typeof frontmatterField === "string" ||
      typeof frontmatterField === "number"
    ) {
      return frontmatterField.toString();
    } else if (frontmatterField !== null && frontmatterField !== undefined) {
      return frontmatterField.toString();
    }
  }

  return "No Data";
}

////////////////////////////////////////////////////
///                 Components                   ///
////////////////////////////////////////////////////

function DraggableLink({ entry, title }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", `[[${title}]]`);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a
      href="#"
      className="internal-link"
      draggable
      onDragStart={handleDragStart}
      data-href={entry.$path || title}
      data-type="file"
      title={`Drag to copy [[${title}]]`}
      style={styles.draggableLink}
    >
      {title}
    </a>
  );
}

function DataTable({
  columnsToShow,
  dynamicColumnProperties,
  data,
}) {
  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableHeader}>
        {columnsToShow.map((col) => (
          <div key={col} style={styles.tableHeaderCell}>
            {col}
          </div>
        ))}
      </div>
      <div style={styles.tableContent}>
        {data.length > 0 ? (
          <RenderRows
            data={data}
            columnsToShow={columnsToShow}
            dynamicColumnProperties={dynamicColumnProperties}
          />
        ) : (
          <div style={styles.noData}>No data to display.</div>
        )}
      </div>
    </div>
  );
}

function RenderRows({
  data,
  columnsToShow,
  dynamicColumnProperties,
}) {
  return data.map((entry, idx) => (
    <div key={idx} style={styles.tableRow}>
      {columnsToShow.map((columnId) => {
        const property = dynamicColumnProperties[columnId];
        return (
          <div key={columnId} style={styles.tableCell}>
            {property === "name.obsidian" ? (
              <DraggableLink
                entry={entry}
                title={getProperty(entry, property)}
              />
            ) : (
              <div style={styles.tableCellContent}>{getProperty(entry, property)}</div>
            )}
          </div>
        );
      })}
    </div>
  ));
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
    height: "100%", // Ensure it takes full height
  },
  header: {
    padding: "10px",
    backgroundColor: "var(--background-primary)",
  },
  headerTitle: {
    margin: 0,
    paddingBottom: "10px",
  },
  controlGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  textbox: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "400px", // Increased width for better usability
    boxSizing: "border-box",
  },
  tableContainer: {
    flex: 1,
    overflowY: "auto",
    position: "relative",
  },
  tableHeader: {
    display: "flex",
    backgroundColor: "var(--background-primary)",
    position: "sticky",
    top: 0,
    zIndex: 2,
  },
  tableHeaderCell: {
    flex: "1 0 150px",
    minWidth: "150px",
    padding: "10px",
    fontWeight: "bold",
    textAlign: "left",
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  tableContent: {
    display: "flex",
    flexDirection: "column",
  },
  tableRow: {
    display: "flex",
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  tableCell: {
    flex: "1 0 150px",
    minWidth: "150px",
    padding: "10px",
  },
  tableCellContent: {
    cursor: "pointer",
  },
  draggableLink: {
    cursor: "pointer",
    textDecoration: "underline",
    color: "var(--interactive-accent)", // Match other links
  },
  noData: {
    padding: "20px",
    textAlign: "center",
  },
  suggestionBox: {
    position: "absolute",
    backgroundColor: "var(--background-primary)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "4px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    padding: "8px",
    zIndex: 100,
    maxHeight: "300px", // Increased max height for better usability
    overflowY: "auto",
    width: "300px", // Increased width for better usability
  },
  suggestionItem: {
    padding: "8px 12px", // Increased padding for better touch support
    cursor: "pointer",
  },
  suggestionItemHover: {
    backgroundColor: "var(--background-modifier-hover)",
  },
  queryBlock: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    margin: "5px",
    backgroundColor: "var(--background-secondary)",
    borderRadius: "20px",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
  },
  removeIcon: {
    marginLeft: "5px",
    cursor: "pointer",
    color: "var(--interactive-danger)"
  }
};

////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////

function View({ initialSettingsOverride = {}, app }) {
  // Merge default settings with the override
  const mergedSettings = useMemo(() => {
    return {
      ...initialSettings, // Default settings
      ...initialSettingsOverride, // Override settings
    };
  }, [initialSettingsOverride]);

  // Initialize states
  const [queryInput, setQueryInput] = useState("");
  const [queryBlocks, setQueryBlocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef();
  const sanitizedQueryInput = queryBlocks.map(block => {
    if (block.startsWith("/")) {
      return `${block.slice(1)}:`;
    }
    return block;
  }).join(" and ").trim();

  // Use Datacore hook for querying
  const qdata = useMemo(() => {
    try {
      return dc && typeof dc.useQuery === 'function'
        ? dc.useQuery(`@page and path("${mergedSettings.queryPath}") ${sanitizedQueryInput ? 'and ' + sanitizedQueryInput : ''}`, { debounce: 300 }) || []
        : [];
    } catch (error) {
      console.error("Failed to parse query:", error);
      return [];
    }
  }, [sanitizedQueryInput, mergedSettings.queryPath]);

  const filteredData = useMemo(() => {
    return qdata.filter((entry) => {
      const entryName = getProperty(entry, "name.obsidian").toLowerCase();
      return entryName.includes(queryInput.toLowerCase());
    });
  }, [qdata, queryInput]);

  const pageSize = mergedSettings.pagination.itemsPerPage;
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(0, Math.min(newPage, totalPages - 1)));
  };

  const handleSuggestionClick = (suggestion) => {
    setQueryBlocks((prev) => [...prev, suggestion]);
    setQueryInput("");
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && queryInput.trim().length > 0) {
      setQueryBlocks((prev) => [...prev, queryInput.trim()]);
      setQueryInput("");
    }
  };

  const handleRemoveQueryBlock = (index) => {
    setQueryBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    let helperSuggestions = [];

    if (queryInput.startsWith("#")) {
      try {
        if (dc && typeof dc.useQuery === 'function') {
          const allTags = dc.useQuery("@tag") || [];
          const matchedTags = allTags.filter(tag => tag.name && tag.name.startsWith(queryInput.slice(1).toLowerCase()));
          helperSuggestions = matchedTags.map(tag => `#${tag.name}`);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    } else if (queryInput.startsWith("/")) {
      // Attribute-specific suggestions
      const allAttributeKeys = ["source", "genre", "ingredients"];
      const matchedKeys = allAttributeKeys.filter(key => key.startsWith(queryInput.slice(1).toLowerCase()));
      helperSuggestions = matchedKeys.map(key => `/${key}`);
    } else {
      // General suggestions when no prefix is provided
      const generalKeys = ["#tags", "#source", "#genre", "#ingredients", "/source", "/genre", "/ingredients"];
      helperSuggestions = generalKeys.filter(key => key.toLowerCase().includes(queryInput.toLowerCase()));
    }

    setSuggestions(helperSuggestions);
    setShowSuggestions(helperSuggestions.length > 0);
  }, [queryInput]);

  return (
    <dc.Stack
      style={{ ...styles.mainContainer, height: mergedSettings.viewHeight }}
    >
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          {mergedSettings.placeholders.headerTitle}
        </h1>
        <dc.Group style={styles.controlGroup}>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {queryBlocks.map((block, index) => (
                <div key={index} style={styles.queryBlock}>
                  {block}
                  <span style={styles.removeIcon} onClick={() => handleRemoveQueryBlock(index)}>
                    ✕
                  </span>
                </div>
              ))}
            </div>
            <dc.Textbox
              ref={inputRef}
              type="search"
              placeholder="Type # to search by tags or / to filter by attributes..."
              value={queryInput}
              onChange={(e) => {
                setQueryInput(e.target.value);
                setCurrentPage(0); // Reset to first page when input changes
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyPress}
              style={styles.textbox}
            />
            {showSuggestions && (
              <div style={styles.suggestionBox}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    style={styles.suggestionItem}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                    title={suggestion.startsWith("#") ? "Filter by tags, e.g., #vegan" : "Filter by attributes, e.g., /source:book"}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </dc.Group>
      </div>

      <div style={styles.tableContainer}>
        <DataTable
          columnsToShow={Object.keys(mergedSettings.dynamicColumnProperties)}
          dynamicColumnProperties={mergedSettings.dynamicColumnProperties}
          data={paginatedData}
        />
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            style={{ marginRight: "10px" }}
          >
            Previous
          </button>
          <span>Page {currentPage + 1} of {totalPages}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            style={{ marginLeft: "10px" }}
          >
            Next
          </button>
        </div>
      )}
    </dc.Stack>
  );
}

////////////////////////////////////////////////////
///             Exporting the Viewer Component    ///
////////////////////////////////////////////////////

return View;
```
