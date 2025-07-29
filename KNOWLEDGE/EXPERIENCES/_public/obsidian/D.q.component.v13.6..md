



# viewer

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  vaultName: "YourActualVaultName", // **IMPORTANT:** Replace with your actual vault name
  queryPaths: ["COOKBOOK/RECIPES/ALL"], // Updated to an array to allow multiple paths
  initialNameFilter: "",
  dynamicColumnProperties: {
    // This will be dynamically updated based on available properties
    // Ensure "name.obsidian" is always included for the Dish column
    Dish: "name.obsidian",
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

const { useState, useMemo, useEffect, useRef } = dc; // Assuming 'dc' is the Datacore context

function getProperty(entry, property) {
  console.log('getProperty called with entry:', entry, 'property:', property);
  if (property.endsWith(".obsidian")) {
    const key = property.replace(".obsidian", "");
    const obsidianProps = {
      ctime: entry.$ctime?.toISODate() || "Unknown Date",
      mtime: entry.$mtime?.toISODate() || "Unknown Last Modified Date",
      name: entry.$name || "Unnamed",
    };
    console.log('Obsidian property:', key, 'value:', obsidianProps[key]);
    return obsidianProps[key] || "No Data";
  }

  const frontmatterField = entry.$frontmatter?.[property];
  console.log('Frontmatter field for property:', property, 'value:', frontmatterField);
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
  console.log('DataTable called with data:', data);
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
  console.log('RenderRows called with data:', data);
  return data.map((entry, idx) => (
    <div key={idx} style={styles.tableRow}>
      {columnsToShow.map((columnId) => {
        const property = dynamicColumnProperties[columnId];
        const propertyValue = getProperty(entry, property);
        console.log('Entry:', entry, 'ColumnId:', columnId, 'Property:', property, 'Value:', propertyValue);
        return (
          <div key={columnId} style={styles.tableCell}>
            {property === "name.obsidian" ? (
              <DraggableLink
                entry={entry}
                title={propertyValue}
              />
            ) : (
              <div style={styles.tableCellContent}>
                {collapseResults && !showMoreContext
                  ? propertyValue.slice(0, 20) + "..."
                  : propertyValue}
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
    color: "var(--interactive-danger)",
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
  pathBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    marginBottom: "10px",
  },
  pathBlock: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    backgroundColor: "var(--background-secondary)",
    borderRadius: "20px",
    cursor: "pointer",
    marginRight: "5px",
  },
  addPathButton: {
    padding: "5px 10px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    cursor: "pointer",
  },
  pathInput: {
    padding: "5px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "200px",
    boxSizing: "border-box",
    marginRight: "5px",
  },
};

////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////

function View({ initialSettingsOverride = {}, app }) {
  // Merge default settings with the override
  const mergedSettings = useMemo(() => {
    const settings = {
      ...initialSettings, // Default settings
      ...initialSettingsOverride, // Override settings
    };
    console.log('Merged Settings:', settings);
    return settings;
  }, [initialSettingsOverride]);

  // Initialize states
  const [queryInput, setQueryInput] = useState("");
  const [queryBlocks, setQueryBlocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputElement, setInputElement] = useState(null); // Using state for input element
  const sanitizedQueryInput = queryBlocks.join(" and ").trim();
  console.log('Sanitized Query Input:', sanitizedQueryInput);

  // Search Options states
  const [collapseResults, setCollapseResults] = useState(false);
  const [showMoreContext, setShowMoreContext] = useState(false);
  const [explainSearchTerms, setExplainSearchTerms] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Path selection states
  const [paths, setPaths] = useState(mergedSettings.queryPaths || []);
  const [pathInput, setPathInput] = useState("");
  const [isPathInputVisible, setIsPathInputVisible] = useState(false);

  // Define operators and tag suggestions
  const operators = ["=", "!=", ">", "<", ">=", "<="];
  const tagSuggestions = ["wip", "completed", "urgent"]; // Example tags

  // Dynamic Property Retrieval
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Build the paths query
  const pathsQuery = useMemo(() => {
    if (paths.length === 0) return '';
    const pathQueries = paths.map(p => `path("${p}")`).join(' or ');
    return `(${pathQueries})`;
  }, [paths]);

  // Execute the main query based on the sanitized query input and paths
  const qdata = useMemo(() => {
    const mainQuery = `@page ${pathsQuery ? 'and ' + pathsQuery : ''} ${sanitizedQueryInput ? 'and ' + sanitizedQueryInput : ''}`;
    console.log("Executing Main Query:", mainQuery);

    try {
      const result = dc.useQuery(mainQuery, { debounce: 300 }) || [];
      console.log('Main Query Result:', result);
      return result;
    } catch (error) {
      console.error("Failed to parse query:", error);
      return [];
    }
  }, [sanitizedQueryInput, pathsQuery]);

  // Extract available properties from qdata
  const availableProperties = useMemo(() => {
    const propertiesSet = new Set();
    qdata.forEach(entry => {
      if (entry.$frontmatter) {
        Object.keys(entry.$frontmatter).forEach(key => {
          propertiesSet.add(key);
        });
      }
    });
    const propertiesArray = Array.from(propertiesSet);
    console.log('Available Properties:', propertiesArray);
    return propertiesArray;
  }, [qdata]);

  // Helper function to fetch unique values for a given property
  function usePropertyValues(property) {
    return useMemo(() => {
      if (!property) return [];
      const valuesSet = new Set();
      qdata.forEach(entry => {
        const frontmatterField = entry.$frontmatter?.[property];
        if (frontmatterField) {
          let value = frontmatterField.value ?? frontmatterField;
          if (Array.isArray(value)) {
            value.forEach(v => valuesSet.add(v));
          } else {
            valuesSet.add(value);
          }
        }
      });
      const valuesArray = Array.from(valuesSet);
      console.log(`Property Values for "${property}":`, valuesArray);
      return valuesArray;
    }, [property, qdata]);
  }

  const propertyValues = usePropertyValues(selectedProperty);

  // Update dynamicColumnProperties based on availableProperties
  useEffect(() => {
    if (availableProperties.length > 0) {
      // Update dynamicColumnProperties to include available properties
      // Ensure "name.obsidian" is always included for the Dish column
      const updatedDynamicColumns = {
        ...initialSettings.dynamicColumnProperties,
      };

      availableProperties.forEach(prop => {
        if (!Object.keys(updatedDynamicColumns).includes(prop)) {
          // Assign a default mapping; you can customize this logic as needed
          updatedDynamicColumns[prop] = prop;
        }
      });

      mergedSettings.dynamicColumnProperties = updatedDynamicColumns;
      console.log("Updated dynamicColumnProperties:", updatedDynamicColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableProperties]);

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
        // Existing logic for suggestions
        const propertyValuePattern = /^\["(.+)"\s*(=|!=|>|<|>=|<=)\s*$/;
        if (queryInput.startsWith('["')) {
          const propertyOperatorMatch = queryInput.match(propertyValuePattern);
          if (propertyOperatorMatch) {
            const propertyName = propertyOperatorMatch[1];
            // Suggest possible values
            const values = propertyValues || [];
            setSuggestions(values.map(val => ({ type: 'value', value: val })));
            setShowSuggestions(values.length > 0);
          } else {
            // Check if property name is being entered
            const propertyMatch = queryInput.match(/^\["([^"]*)$/);
            if (propertyMatch) {
              const inputProperty = propertyMatch[1].toLowerCase();
              const filteredProperties = availableProperties.filter(prop =>
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
    console.log('Suggestions:', suggestions);
  }, [queryInput, isInputFocused, availableProperties, propertyValues]);

  const pageSize = mergedSettings.pagination.itemsPerPage;
  const totalPages = Math.ceil(qdata.length / pageSize);
  console.log('Total Pages:', totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const dataSlice = qdata.slice(startIndex, startIndex + pageSize);
    console.log('Paginated Data:', dataSlice);
    return dataSlice;
  }, [qdata, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    console.log('Changing to page:', newPage);
    setCurrentPage(Math.max(0, Math.min(newPage, totalPages - 1)));
  };

  const handleSuggestionClick = (suggestion) => {
    console.log('Suggestion clicked:', suggestion);
    if (suggestion.type === 'construct') {
      if (suggestion.value === 'tag:') {
        setQueryInput('tag:');
      } else if (suggestion.value === '[properties]') {
        setQueryInput('["');
      }
    } else if (suggestion.type === 'property') {
      setSelectedProperty(suggestion.value);
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
    
    // Focus the input element if it exists
    if (inputElement && typeof inputElement.focus === 'function') {
      inputElement.focus();
    } else {
      console.warn("Input element is not available for focusing.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && queryInput.trim().length > 0) {
      console.log('Enter pressed, adding query block:', queryInput.trim());
      setQueryBlocks((prev) => [...prev, queryInput.trim()]);
      setQueryInput("");
    }
  };

  const handleRemoveQueryBlock = (index) => {
    console.log('Removing query block at index:', index);
    setQueryBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  // Path management functions
  const handleAddPath = () => {
    if (pathInput.trim().length > 0 && !paths.includes(pathInput.trim())) {
      setPaths(prev => [...prev, pathInput.trim()]);
      setPathInput("");
    }
    setIsPathInputVisible(false);
  };

  const handleRemovePath = (index) => {
    console.log('Removing path at index:', index);
    setPaths(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <dc.Stack
      style={{ ...styles.mainContainer, height: mergedSettings.viewHeight }}
    >
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          {mergedSettings.placeholders.headerTitle}
        </h1>

        {/* Path Selection Bar */}
        <div style={styles.pathBar}>
          {paths.map((path, index) => (
            <div key={index} style={styles.pathBlock}>
              {path}
              <span style={styles.removeIcon} onClick={() => handleRemovePath(index)}>
                ✕
              </span>
            </div>
          ))}
          {isPathInputVisible ? (
            <>
              <input
                type="text"
                placeholder="Enter path..."
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                style={styles.pathInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddPath();
                  }
                }}
              />
              <button onClick={handleAddPath} style={styles.addPathButton}>
                Add Path
              </button>
            </>
          ) : (
            <button onClick={() => setIsPathInputVisible(true)} style={styles.addPathButton}>
              + Add Path
            </button>
          )}
        </div>

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
              ref={(el) => setInputElement(el ? el.inputElement : null)} // Adjust based on dc.Textbox API
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
                    {suggestion.type === 'property' && <strong>{suggestion.value}</strong>}
                    {suggestion.type === 'value' && suggestion.value}
                    {suggestion.type === 'operator' && suggestion.value}
                    {suggestion.type === 'tag' && `tag:${suggestion.value}`}
                    {suggestion.type === 'construct' && suggestion.value}
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
