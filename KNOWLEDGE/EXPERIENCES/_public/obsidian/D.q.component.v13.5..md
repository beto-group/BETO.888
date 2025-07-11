



# viewer

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  vaultName: "YourActualVaultName", // **IMPORTANT:** Replace with your actual vault name
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
  collapseResults,
  showMoreContext,
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
            collapseResults={collapseResults}
            showMoreContext={showMoreContext}
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
  collapseResults,
  showMoreContext,
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
              <div style={styles.tableCellContent}>
                {collapseResults && !showMoreContext
                  ? getProperty(entry, property).slice(0, 20) + "..."
                  : getProperty(entry, property)}
              </div>
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
    width: "200px",
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
    maxHeight: "200px",
    overflowY: "auto",
    width: "200px",
  },
  suggestionItem: {
    padding: "4px 8px",
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
  },
  optionsButton: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    cursor: "pointer",
  },
  optionsMenu: {
    position: "absolute",
    backgroundColor: "var(--background-primary)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "4px",
    padding: "10px",
    zIndex: 100,
    marginTop: "5px",
  },
  optionsCheckbox: {
    display: "flex",
    alignItems: "center",
    marginBottom: "5px",
  },
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);
  const sanitizedQueryInput = queryBlocks.join(" and ").trim();

  // Search Options states
  const [collapseResults, setCollapseResults] = useState(false);
  const [showMoreContext, setShowMoreContext] = useState(false);
  const [explainSearchTerms, setExplainSearchTerms] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Define property and tag suggestions
  const propertySuggestions = Object.keys(mergedSettings.dynamicColumnProperties);
  const tagSuggestions = ["wip", "completed", "urgent"]; // Example tags
  const operators = ["=", "!=", ">", "<", ">=", "<="];
  const propertyValues = {
    Genre: ["Chocolate", "Vanilla", "Strawberry"],
    Source: ["Book", "Internet", "Friend"],
    // Add more properties and their possible values as needed
  };

  useEffect(() => {
    if (isInputFocused) {
      if (queryInput.length === 0) {
        // Initial suggestions when input is focused and empty
        setSuggestions([
          { type: 'construct', value: 'tag:' },
          { type: 'construct', value: '[properties]' },
        ]);
        setShowSuggestions(true);
      } else {
        // Continue with existing logic for suggestions
        const propertyValuePattern = /^\["(.+)"\s*(=|!=|>|<|>=|<=)\s*$/;
        if (queryInput.startsWith('["')) {
          const propertyOperatorMatch = queryInput.match(propertyValuePattern);
          if (propertyOperatorMatch) {
            const propertyName = propertyOperatorMatch[1];
            // Suggest possible values
            const values = propertyValues[propertyName] || [];
            setSuggestions(values.map(val => ({ type: 'value', value: val })));
            setShowSuggestions(values.length > 0);
          } else {
            // Check if property name is being entered
            const propertyMatch = queryInput.match(/^\["([^"]*)$/);
            if (propertyMatch) {
              const inputProperty = propertyMatch[1].toLowerCase();
              const filteredProperties = propertySuggestions.filter(prop =>
                prop.toLowerCase().includes(inputProperty)
              );
              setSuggestions(filteredProperties.map(prop => ({ type: 'property', value: prop })));
              setShowSuggestions(filteredProperties.length > 0);
            } else {
              // Suggest operators
              setSuggestions(operators.map(op => ({ type: 'operator', value: op })));
              setShowSuggestions(true);
            }
          }
        } else if (queryInput.startsWith('tag:')) {
          const tagInput = queryInput.slice(4).toLowerCase();
          const filteredTags = tagSuggestions.filter(tag =>
            tag.toLowerCase().includes(tagInput)
          );
          setSuggestions(filteredTags.map(tag => ({ type: 'tag', value: tag })));
          setShowSuggestions(filteredTags.length > 0);
        } else {
          // No suggestions
          setShowSuggestions(false);
        }
      }
    } else {
      setShowSuggestions(false);
    }
  }, [queryInput, isInputFocused, mergedSettings.dynamicColumnProperties]);

  const qdata = useMemo(() => {
    try {
      return dc.useQuery(`@page and path("${mergedSettings.queryPath}") ${sanitizedQueryInput ? 'and ' + sanitizedQueryInput : ''}`, { debounce: 300 }) || [];
    } catch (error) {
      console.error("Failed to parse query:", error);
      return [];
    }
  }, [sanitizedQueryInput, mergedSettings.queryPath]);

  const pageSize = mergedSettings.pagination.itemsPerPage;
  const totalPages = Math.ceil(qdata.length / pageSize);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return qdata.slice(startIndex, startIndex + pageSize);
  }, [qdata, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(0, Math.min(newPage, totalPages - 1)));
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'construct') {
      if (suggestion.value === 'tag:') {
        setQueryInput('tag:');
      } else if (suggestion.value === '[properties]') {
        setQueryInput('["');
      }
    } else if (suggestion.type === 'property') {
      setQueryInput(`["${suggestion.value}" `);
    } else if (suggestion.type === 'tag') {
      setQueryBlocks(prev => [...prev, `tag("${suggestion.value}")`]);
      setQueryInput("");
    } else if (suggestion.type === 'operator') {
      setQueryInput(prev => prev + `${suggestion.value} `);
    } else if (suggestion.type === 'value') {
      setQueryBlocks(prev => [...prev, queryInput + `"${suggestion.value}"]`]);
      setQueryInput("");
    }
    setShowSuggestions(false);
    inputRef.current.focus();
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
              placeholder="Search or add query parameters..."
              value={queryInput}
              onChange={(e) => {
                setQueryInput(e.target.value);
                setCurrentPage(0); // Reset to first page when input changes
              }}
              onFocus={() => {
                setIsInputFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                setIsInputFocused(false);
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyDown={handleKeyPress}
              style={styles.textbox}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={styles.suggestionBox}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    style={styles.suggestionItem}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.value}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowOptionsMenu(prev => !prev)}
              style={styles.optionsButton}
            >
              Search Options
            </button>
            {showOptionsMenu && (
              <div style={styles.optionsMenu}>
                <div style={styles.optionsCheckbox}>
                  <input
                    type="checkbox"
                    checked={collapseResults}
                    onChange={() => setCollapseResults(prev => !prev)}
                  />
                  <label style={{ marginLeft: "5px" }}>Collapse Results</label>
                </div>
                <div style={styles.optionsCheckbox}>
                  <input
                    type="checkbox"
                    checked={showMoreContext}
                    onChange={() => setShowMoreContext(prev => !prev)}
                  />
                  <label style={{ marginLeft: "5px" }}>Show More Context</label>
                </div>
                <div style={styles.optionsCheckbox}>
                  <input
                    type="checkbox"
                    checked={explainSearchTerms}
                    onChange={() => setExplainSearchTerms(prev => !prev)}
                  />
                  <label style={{ marginLeft: "5px" }}>Explain Search Terms</label>
                </div>
              </div>
            )}
          </div>
        </dc.Group>
        {explainSearchTerms && queryBlocks.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <strong>Search Explanation:</strong>
            <ul>
              {queryBlocks.map((block, index) => (
                <li key={index}>{block}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={styles.tableContainer}>
        <DataTable
          columnsToShow={Object.keys(mergedSettings.dynamicColumnProperties)}
          dynamicColumnProperties={mergedSettings.dynamicColumnProperties}
          data={paginatedData}
          collapseResults={collapseResults}
          showMoreContext={showMoreContext}
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

return { View };
```
