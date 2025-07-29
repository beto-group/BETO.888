


# viewer

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  queryPaths: ["COOKBOOK/RECIPES/ALL"], // Update with your actual paths
  initialNameFilter: "",
  dynamicColumnProperties: {
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
  debug: false, // Toggle for debugging
};

////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

const { useState, useMemo, useEffect, useRef, useCallback } = dc; // Datacore context
const app = dc.app; // Access the app context from Datacore

/**
 * Retrieves and formats the property value based on its type.
 * @param {Object} entry - The data entry from the query result.
 * @param {string} property - The property name to retrieve.
 * @param {boolean} debug - Flag to enable/disable debugging.
 * @returns {string|boolean|Array} - The formatted property value.
 */
function getProperty(entry, property, debug = false) {
  if (debug) console.log('getProperty called with entry:', entry, 'property:', property);

  if (property.endsWith(".obsidian")) {
    const key = property.replace(".obsidian", "");
    const obsidianProps = {
      ctime: entry.$ctime?.toISODate() || "Unknown Date",
      mtime: entry.$mtime?.toISODate() || "Unknown Last Modified Date",
      name: entry.$name || "Unnamed",
    };
    if (debug) console.log('Obsidian property:', key, 'value:', obsidianProps[key]);
    return obsidianProps[key] || "No Data";
  }

  const frontmatterField = entry.$frontmatter?.[property];
  if (debug) console.log('Frontmatter field for property:', property, 'value:', frontmatterField);

  if (frontmatterField === undefined || frontmatterField === null) {
    return "No Data";
  }

  // Determine the data type
  const dataType = typeof frontmatterField;
  let value;

  if (Array.isArray(frontmatterField)) {
    value = frontmatterField;
  } else if (dataType === "boolean") {
    value = frontmatterField;
  } else if (dataType === "number") {
    value = frontmatterField;
  } else if (dataType === "string") {
    // Check if it's a date or datetime
    const date = new Date(frontmatterField);
    if (!isNaN(date)) {
      value = date.toLocaleString();
    } else {
      value = frontmatterField;
    }
  } else if (dataType === "object" && frontmatterField.value !== undefined) {
    // Handle objects with a 'value' key
    const innerValue = frontmatterField.value;
    if (Array.isArray(innerValue)) {
      value = innerValue;
    } else if (typeof innerValue === "string") {
      const dateInner = new Date(innerValue);
      value = !isNaN(dateInner) ? dateInner.toLocaleString() : innerValue;
    } else {
      value = innerValue;
    }
  } else {
    // For any other types, attempt to convert to string safely
    try {
      value = frontmatterField.toString();
    } catch (error) {
      if (debug) console.warn(`Unable to convert frontmatter field to string: ${frontmatterField}`, error);
      value = "Invalid Data";
    }
  }

  // Format the value based on its type
  if (Array.isArray(value)) {
    return value.join(", ");
  } else if (typeof value === "boolean") {
    return value ? "☑️" : "⬜";
  } else if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    return value;
  } else {
    return "No Data";
  }
}

////////////////////////////////////////////////////
///                 Components                   ///
////////////////////////////////////////////////////

/**
 * Renders a draggable link for the entry's name.
 * @param {Object} props
 * @param {Object} props.entry - The data entry.
 * @param {string} props.title - The display title.
 */
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

/**
 * Displays the data in a table format.
 * @param {Object} props
 * @param {Array} props.columnsToShow - List of column names to display.
 * @param {Object} props.dynamicColumnProperties - Mapping of column names to property keys.
 * @param {Array} props.data - The data entries to display.
 * @param {boolean} props.collapseResults - Whether to collapse long results.
 * @param {boolean} props.showMoreContext - Whether to show more context in results.
 * @param {boolean} props.debug - Flag to enable/disable debugging.
 */
function DataTable({
  columnsToShow,
  dynamicColumnProperties,
  data,
  collapseResults,
  showMoreContext,
  debug = false,
}) {
  if (debug) console.log('DataTable called with data:', data);
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
            debug={debug}
          />
        ) : (
          <div style={styles.noData}>No data to display.</div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders each row in the DataTable.
 * @param {Object} props
 * @param {Array} props.data - The data entries.
 * @param {Array} props.columnsToShow - Columns to display.
 * @param {Object} props.dynamicColumnProperties - Mapping of columns to properties.
 * @param {boolean} props.collapseResults - Whether to collapse long results.
 * @param {boolean} props.showMoreContext - Whether to show more context.
 * @param {boolean} props.debug - Flag to enable/disable debugging.
 */
function RenderRows({
  data,
  columnsToShow,
  dynamicColumnProperties,
  collapseResults,
  showMoreContext,
  debug = false,
}) {
  if (debug) console.log('RenderRows called with data:', data);
  return data.map((entry, idx) => (
    <div key={idx} style={styles.tableRow}>
      {columnsToShow.map((columnId) => {
        const property = dynamicColumnProperties[columnId];
        const propertyValue = getProperty(entry, property, debug);
        if (debug) console.log('Entry:', entry, 'ColumnId:', columnId, 'Property:', property, 'Value:', propertyValue);
        return (
          <div key={columnId} style={styles.tableCell}>
            {property === "name.obsidian" ? (
              <DraggableLink
                entry={entry}
                title={propertyValue}
              />
            ) : (
              <div style={styles.tableCellContent}>
                {typeof propertyValue === "string" && collapseResults && !showMoreContext
                  ? propertyValue.length > 20
                    ? propertyValue.slice(0, 20) + "..."
                    : propertyValue
                  : propertyValue}
              </div>
            )}
          </div>
        );
      })}
    </div>
  ));
}

/**
 * Explain Search Terms Component
 * Displays the entire query being used to generate the view.
 */
function ExplainSearchTerms({ fullQuery, debug = false }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullQuery).then(() => {
      alert('Query copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div style={styles.explainSearchTermsContainer}>
      <div style={styles.explainHeader}>
        <h2>Current Query</h2>
        <button onClick={copyToClipboard} style={styles.copyButton}>
          Copy Query
        </button>
      </div>
      <pre style={styles.queryTemplate}>
        {fullQuery || 'No query constructed yet.'}
      </pre>
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
    fontFamily: "Arial, sans-serif",
  },
  header: {
    padding: "20px",
    backgroundColor: "var(--background-primary)",
    borderBottom: "1px solid var(--background-modifier-border)",
  },
  headerTitle: {
    margin: 0,
    paddingBottom: "10px",
    fontSize: "24px",
    color: "var(--text-title)",
  },
  controlGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: "10px",
  },
  textbox: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    width: "100%",
    maxWidth: "400px",
    boxSizing: "border-box",
    borderRadius: "4px",
    fontSize: "14px",
  },
  tableContainer: {
    flex: 1,
    overflowY: "auto",
    position: "relative",
    padding: "20px",
  },
  tableHeader: {
    display: "flex",
    backgroundColor: "var(--background-secondary)",
    position: "sticky",
    top: 0,
    zIndex: 2,
    borderBottom: "2px solid var(--background-modifier-border)",
  },
  tableHeaderCell: {
    flex: "1 0 150px",
    minWidth: "150px",
    padding: "10px",
    fontWeight: "bold",
    textAlign: "left",
    color: "var(--text-accent)",
  },
  tableContent: {
    display: "flex",
    flexDirection: "column",
  },
  tableRow: {
    display: "flex",
    borderBottom: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
  },
  tableCell: {
    flex: "1 0 150px",
    minWidth: "150px",
    padding: "10px",
    color: "var(--text-normal)",
  },
  tableCellContent: {
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  draggableLink: {
    cursor: "pointer",
    textDecoration: "underline",
    color: "var(--interactive-accent)",
  },
  noData: {
    padding: "20px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  suggestionBox: {
    position: "absolute",
    backgroundColor: "var(--background-secondary)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "4px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    padding: "8px",
    zIndex: 100,
    maxHeight: "200px",
    overflowY: "auto",
    width: "100%",
    maxWidth: "400px",
    marginTop: "5px",
  },
  suggestionItem: {
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: "4px",
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
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    fontSize: "14px",
  },
  removeIcon: {
    marginLeft: "5px",
    cursor: "pointer",
    color: "var(--interactive-danger)",
    fontWeight: "bold",
  },
  optionsButton: {
    padding: "8px 12px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "14px",
  },
  optionsMenu: {
    position: "absolute",
    backgroundColor: "var(--background-secondary)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "4px",
    padding: "10px",
    zIndex: 100,
    marginTop: "5px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  },
  optionsCheckbox: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
  },
  pathBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    marginBottom: "15px",
  },
  pathBlock: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    backgroundColor: "var(--background-secondary)",
    borderRadius: "20px",
    cursor: "pointer",
    marginRight: "5px",
    fontSize: "14px",
  },
  addPathButton: {
    padding: "5px 10px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "14px",
  },
  pathInput: {
    padding: "5px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "200px",
    boxSizing: "border-box",
    marginRight: "5px",
    borderRadius: "4px",
    fontSize: "14px",
  },
  explainSearchTermsContainer: {
    padding: "15px",
    backgroundColor: "var(--background-secondary)",
    borderRadius: "8px",
    marginTop: "20px",
    marginBottom: "20px",
    fontFamily: "monospace",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  explainHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  copyButton: {
    padding: "5px 10px",
    border: "none",
    backgroundColor: "var(--interactive-accent)",
    color: "#fff",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  queryTemplate: {
    backgroundColor: "#f5f5f5",
    padding: "10px",
    borderRadius: "5px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "14px",
    color: "#333",
  },
};

////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////

/**
 * The main view component.
 * @param {Object} props
 * @param {Object} props.initialSettingsOverride - Overrides for initial settings.
 */
function View({ initialSettingsOverride = {} }) {
  // Merge default settings with the override
  const mergedSettings = useMemo(() => {
    const settings = {
      ...initialSettings, // Default settings
      ...initialSettingsOverride, // Override settings
    };
    if (settings.debug) console.log('Merged Settings:', settings);
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
  if (mergedSettings.debug) console.log('Current Query Input:', queryInput);

  // Search Options states
  const [collapseResults, setCollapseResults] = useState(false);
  const [showMoreContext, setShowMoreContext] = useState(false);
  const [explainSearchTerms, setExplainSearchTerms] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Path selection states
  const [paths, setPaths] = useState(mergedSettings.queryPaths || []);
  const [pathInput, setPathInput] = useState("");
  const [isPathInputVisible, setIsPathInputVisible] = useState(false);

  // Define operators
  const operators = ["=", "!=", ">", "<", ">=", "<=", "contains", "and", "or"];

  // Dynamic Property Retrieval
  const [selectedProperty, setSelectedProperty] = useState(null);

  /**
   * Processes query blocks to handle different query constructs.
   * @param {Array} blocks - The array of query blocks.
   * @returns {string} - The processed query string.
   */
  const processQueryBlocks = useCallback((blocks) => {
    return blocks.join(' and ');
  }, []);

  /**
   * Builds the path query string based on selected paths.
   */
  const pathsQuery = useMemo(() => {
    if (paths.length === 0) return '';
    const pathQueries = paths.map(p => `path("${p}")`).join(' or ');
    return `(${pathQueries})`;
  }, [paths]);

  /**
   * Constructs the main query string combining path and search queries.
   */
  const mainQuery = useMemo(() => {
    const processedQueryInput = processQueryBlocks(queryBlocks);
    let queryParts = [];
    if (processedQueryInput) {
      queryParts.push(processedQueryInput);
    } else {
      queryParts.push('@page');
    }
    if (pathsQuery) {
      queryParts.push(pathsQuery);
    }
    const main = queryParts.join(' and ');
    if (mergedSettings.debug) console.log("Executing Main Query:", main);

    return main;
  }, [processQueryBlocks, pathsQuery, queryBlocks, mergedSettings.debug]);

  /**
   * Executes the main query to retrieve data.
   */
  const qdata = dc.useQuery(mainQuery, { debounce: 300 }) || [];

  /**
   * Extracts available frontmatter properties from the query data.
   */
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
    if (mergedSettings.debug) console.log('Available Properties:', propertiesArray);
    return propertiesArray;
  }, [qdata, mergedSettings.debug]);

  /**
   * Extracts available tags from the query data.
   */
  const availableTags = useMemo(() => {
    const tagsSet = new Set();
    qdata.forEach(entry => {
      const tags = entry.$tags || [];
      tags.forEach(tag => tagsSet.add(tag));
    });
    const tagsArray = Array.from(tagsSet);
    if (mergedSettings.debug) console.log('Available Tags:', tagsArray);
    return tagsArray;
  }, [qdata, mergedSettings.debug]);

  /**
   * Extracts available files from the vault, considering selected paths.
   */
  const availableFiles = useMemo(() => {
    let files = [];
    if (paths.length > 0) {
      // Get files from selected paths
      files = app.vault.getMarkdownFiles().filter(file => {
        return paths.some(path => file.path.startsWith(path));
      });
    } else {
      // Get all files
      files = app.vault.getMarkdownFiles();
    }
    const filesArray = files.map(file => file.basename);
    if (mergedSettings.debug) console.log('Available Files:', filesArray);
    return filesArray;
  }, [app, paths, mergedSettings.debug]);

  /**
   * Extracts available paths from the vault.
   */
  const availablePaths = useMemo(() => {
    const allFiles = app.vault.getMarkdownFiles();
    const folderSet = new Set();
    allFiles.forEach(file => {
      const folder = file.path.substring(0, file.path.lastIndexOf('/'));
      folderSet.add(folder);
    });
    const foldersArray = Array.from(folderSet);
    if (mergedSettings.debug) console.log('Available Paths:', foldersArray);
    return foldersArray;
  }, [app, mergedSettings.debug]);

  /**
   * Fetches unique values for a given property, handling various data types.
   * @param {string} property - The property name.
   * @returns {Array} - An array of unique values.
   */
  function usePropertyValues(property) {
    return useMemo(() => {
      if (!property) return [];
      const valuesSet = new Set();
      qdata.forEach(entry => {
        const frontmatterField = entry.$frontmatter?.[property];
        if (frontmatterField !== undefined && frontmatterField !== null) {
          let value;
          if (typeof frontmatterField === "object" && frontmatterField.value !== undefined) {
            value = frontmatterField.value;
          } else {
            value = frontmatterField;
          }

          if (Array.isArray(value)) {
            value.forEach(v => {
              if (v !== null && v !== undefined) {
                valuesSet.add(v);
              }
            });
          } else if (typeof value === "boolean" || typeof value === "number") {
            valuesSet.add(value);
          } else if (typeof value === "string") {
            const date = new Date(value);
            if (!isNaN(date)) {
              valuesSet.add(date.toISOString());
            } else {
              valuesSet.add(value);
            }
          } else {
            // For any other types, convert to string if possible
            try {
              valuesSet.add(value.toString());
            } catch (error) {
              if (mergedSettings.debug) console.warn(`Unable to convert value to string: ${value}`, error);
              valuesSet.add("Invalid Data");
            }
          }
        }
      });
      const valuesArray = Array.from(valuesSet);
      if (mergedSettings.debug) console.log(`Property Values for "${property}":`, valuesArray);
      return valuesArray;
    }, [property, qdata, mergedSettings.debug]);
  }

  const propertyValues = usePropertyValues(selectedProperty);

  /**
   * Updates dynamicColumnProperties based on available properties.
   */
  useEffect(() => {
    if (availableProperties.length > 0) {
      // Update dynamicColumnProperties to include available properties
      // Ensure "name.obsidian" is always included for the Dish column
      const updatedDynamicColumns = {
        ...mergedSettings.dynamicColumnProperties,
      };

      availableProperties.forEach(prop => {
        if (!Object.keys(updatedDynamicColumns).includes(prop)) {
          // Assign a default mapping; you can customize this logic as needed
          updatedDynamicColumns[prop] = prop;
        }
      });

      mergedSettings.dynamicColumnProperties = updatedDynamicColumns;
      if (mergedSettings.debug) console.log("Updated dynamicColumnProperties:", updatedDynamicColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableProperties]);

  /**
   * Handles suggestions based on user input.
   */
  useEffect(() => {
    if (isInputFocused) {
      let newSuggestions = [];
      const trimmedInput = queryInput.trim();

      if (trimmedInput.length === 0) {
        // Initial suggestions when input is focused and empty
        newSuggestions = [
          { type: 'construct', value: '@' },
          { type: 'construct', value: '#' },
          { type: 'construct', value: 'file.outlinks contains ' },
          { type: 'construct', value: 'file.inlinks contains ' },
          { type: 'construct', value: 'path(' },
          { type: 'construct', value: 'exists(' },
          { type: 'construct', value: 'parent-of(' },
          { type: 'construct', value: 'child-of(' },
          { type: 'operator', value: '!' },
          { type: 'construct', value: '[' }, // For expressions
        ];
      } else {
        // Handle suggestions based on queryInput
        if (trimmedInput.startsWith('!')) {
          // Remove '!' and continue processing
          const inputWithoutExclamation = trimmedInput.slice(1);
          setQueryInput(inputWithoutExclamation);
        }

        if (trimmedInput.startsWith('@')) {
          // Suggest @types
          const inputType = trimmedInput.slice(1).toLowerCase();
          const typeSuggestions = ['file', 'page', 'section', 'block', 'block-list', 'codeblock', 'datablock', 'list-item', 'task'];
          const filteredTypes = typeSuggestions.filter(type => type.startsWith(inputType));
          newSuggestions = filteredTypes.map(type => ({ type: 'type', value: '@' + type }));
        } else if (trimmedInput.startsWith('#')) {
          // Suggest tags
          const tagInput = trimmedInput.slice(1).toLowerCase();
          const filteredTags = availableTags.filter(tag => tag.toLowerCase().includes(tagInput));
          newSuggestions = filteredTags.map(tag => ({ type: 'tag', value: tag }));
        } else if (trimmedInput.startsWith('file.outlinks contains ')) {
          // Suggest files
          const fileInput = trimmedInput.slice('file.outlinks contains '.length);
          const filteredFiles = availableFiles.filter(file => file.toLowerCase().includes(fileInput.toLowerCase()));
          newSuggestions = filteredFiles.map(file => ({ type: 'file', value: `[[${file}]]` }));
        } else if (trimmedInput.startsWith('file.inlinks contains ')) {
          // Suggest files
          const fileInput = trimmedInput.slice('file.inlinks contains '.length);
          const filteredFiles = availableFiles.filter(file => file.toLowerCase().includes(fileInput.toLowerCase()));
          newSuggestions = filteredFiles.map(file => ({ type: 'file', value: `[[${file}]]` }));
        } else if (trimmedInput.startsWith('path(')) {
          // Suggest paths
          const pathInput = trimmedInput.slice(5); // Remove 'path('
          // Use availablePaths for suggestions
          const filteredPaths = availablePaths.filter(path => path.toLowerCase().includes(pathInput.toLowerCase()));
          newSuggestions = filteredPaths.map(path => ({ type: 'path', value: path }));
        } else if (trimmedInput.startsWith('exists(')) {
          // Suggest properties
          const propertyInput = trimmedInput.slice(7); // Remove 'exists('
          const filteredProperties = availableProperties.filter(prop => prop.toLowerCase().includes(propertyInput.toLowerCase()));
          newSuggestions = filteredProperties.map(prop => ({ type: 'property', value: prop }));
        } else if (trimmedInput.startsWith('parent-of(') || trimmedInput.startsWith('child-of(')) {
          // Suggest constructs inside the function
          newSuggestions = [
            { type: 'construct', value: '@' },
            { type: 'construct', value: '#' },
            { type: 'construct', value: 'file.outlinks contains ' },
            { type: 'construct', value: 'file.inlinks contains ' },
            { type: 'construct', value: 'path(' },
            { type: 'construct', value: 'exists(' },
          ];
        } else if (trimmedInput.startsWith('[')) {
          // Expressions
          const expressionMatch = trimmedInput.match(/^\[([^\s\]]*)\s*(.*)$/);
          if (expressionMatch) {
            const property = expressionMatch[1];
            const rest = expressionMatch[2];
            if (!rest) {
              // Suggest operators
              newSuggestions = operators.map(op => ({ type: 'operator', value: op }));
            } else {
              // Suggest values based on property
              setSelectedProperty(property);
              const values = usePropertyValues(property) || [];
              newSuggestions = values.map(val => ({ type: 'value', value: val }));
            }
          } else {
            // Suggest properties
            const propertyInput = trimmedInput.slice(1).toLowerCase();
            const filteredProperties = availableProperties.filter(prop => prop.toLowerCase().includes(propertyInput));
            newSuggestions = filteredProperties.map(prop => ({ type: 'property', value: prop }));
          }
        } else {
          // No suggestions
          newSuggestions = [];
        }
      }
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
    if (mergedSettings.debug) console.log('Suggestions:', suggestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput, isInputFocused, availableProperties, propertyValues, operators, availableTags, availableFiles, availablePaths, mergedSettings.debug]);

  const pageSize = mergedSettings.pagination.itemsPerPage;
  const totalPages = Math.ceil(qdata.length / pageSize);
  if (mergedSettings.debug) console.log('Total Pages:', totalPages);

  /**
   * Retrieves the data slice for the current page.
   */
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const dataSlice = qdata.slice(startIndex, startIndex + pageSize);
    if (mergedSettings.debug) console.log('Paginated Data:', dataSlice);
    return dataSlice;
  }, [qdata, currentPage, pageSize, mergedSettings.debug]);

  /**
   * Handles page changes in pagination.
   * @param {number} newPage - The new page number.
   */
  const handlePageChange = (newPage) => {
    if (mergedSettings.debug) console.log('Changing to page:', newPage);
    setCurrentPage(Math.max(0, Math.min(newPage, totalPages - 1)));
  };

  /**
   * Handles the click event on a suggestion item.
   * @param {Object} suggestion - The suggestion item.
   */
  const handleSuggestionClick = (suggestion) => {
    if (mergedSettings.debug) console.log('Suggestion clicked:', suggestion);
    let updatedQueryInput = queryInput.trim();

    // Handle '!' operator
    let notOperator = '';
    if (updatedQueryInput.startsWith('!')) {
      notOperator = '!';
      updatedQueryInput = updatedQueryInput.slice(1);
    }

    switch (suggestion.type) {
      case 'construct':
        setQueryInput(notOperator + suggestion.value);
        break;
      case 'type':
        setQueryBlocks(prev => [...prev, notOperator + suggestion.value]);
        setQueryInput('');
        break;
      case 'property':
        if (updatedQueryInput.startsWith('exists(')) {
          setQueryBlocks(prev => [...prev, notOperator + `exists(${suggestion.value})`]);
          setQueryInput('');
        } else if (updatedQueryInput.startsWith('[')) {
          setQueryInput(notOperator + `[${suggestion.value} `);
        } else {
          setQueryInput(notOperator + suggestion.value);
        }
        break;
      case 'tag':
        setQueryBlocks(prev => [...prev, notOperator + suggestion.value]);
        setQueryInput('');
        break;
      case 'operator':
        setQueryInput(prev => prev + ' ' + suggestion.value + ' ');
        break;
      case 'value':
        setQueryBlocks(prev => [...prev, notOperator + queryInput + `"${suggestion.value}"]`]);
        setQueryInput('');
        break;
      case 'file':
        if (updatedQueryInput.startsWith('file.outlinks contains ')) {
          setQueryBlocks(prev => [...prev, notOperator + `file.outlinks contains ${suggestion.value}`]);
          setQueryInput('');
        } else if (updatedQueryInput.startsWith('file.inlinks contains ')) {
          setQueryBlocks(prev => [...prev, notOperator + `file.inlinks contains ${suggestion.value}`]);
          setQueryInput('');
        } else {
          setQueryInput(notOperator + suggestion.value);
        }
        break;
      case 'path':
        if (updatedQueryInput.startsWith('path(')) {
          // Instead of adding to queryBlocks, add to paths
          setPaths(prev => [...prev, suggestion.value]);
          setQueryInput('');
        } else {
          setQueryInput(notOperator + suggestion.value);
        }
        break;
      default:
        setQueryInput(notOperator + suggestion.value);
    }
    setShowSuggestions(false);

    // Focus the input element if it exists
    if (inputElement && typeof inputElement.focus === 'function') {
      inputElement.focus();
    } else {
      if (mergedSettings.debug) console.warn("Input element is not available for focusing.");
    }
  };

  /**
   * Handles the Enter key press in the search input.
   * @param {Object} e - The event object.
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && queryInput.trim().length > 0) {
      if (mergedSettings.debug) console.log('Enter pressed, adding query block:', queryInput.trim());
      setQueryBlocks((prev) => [...prev, queryInput.trim()]);
      setQueryInput("");
    }
  };

  /**
   * Removes a query block at the specified index.
   * @param {number} index - The index of the query block to remove.
   */
  const handleRemoveQueryBlock = (index) => {
    if (mergedSettings.debug) console.log('Removing query block at index:', index);
    setQueryBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  // Ref for the options menu
  const optionsMenuRef = useRef(null);

  /**
   * Click-away listener to close the options menu when clicking outside.
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsMenuRef]);

  /**
   * Adds a new path to the selected paths.
   */
  const handleAddPath = () => {
    if (pathInput.trim().length > 0 && !paths.includes(pathInput.trim())) {
      setPaths(prev => [...prev, pathInput.trim()]);
      setPathInput("");
    }
    setIsPathInputVisible(false);
  };

  /**
   * Removes a path at the specified index.
   * @param {number} index - The index of the path to remove.
   */
  const handleRemovePath = (index) => {
    if (mergedSettings.debug) console.log('Removing path at index:', index);
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
          <div style={{ position: "relative", width: "100%" }}>
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
              ref={(el) => setInputElement(el ? el.inputElement : null)}
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
                // Delay hiding suggestions to allow click event on suggestions to register
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
                    style={{
                      ...styles.suggestionItem,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent losing focus
                      handleSuggestionClick(suggestion);
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.suggestionItemHover.backgroundColor}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
              <div
                ref={optionsMenuRef}
                style={styles.optionsMenu}
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
              >
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

        {/* Explain Search Terms Component */}
        {explainSearchTerms && (
          <ExplainSearchTerms fullQuery={mainQuery || 'No query constructed yet.'} debug={mergedSettings.debug} />
        )}
      </div>

      <div style={styles.tableContainer}>
        <DataTable
          columnsToShow={Object.keys(mergedSettings.dynamicColumnProperties)}
          dynamicColumnProperties={mergedSettings.dynamicColumnProperties}
          data={paginatedData}
          collapseResults={collapseResults}
          showMoreContext={showMoreContext}
          debug={mergedSettings.debug}
        />
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px", gap: "10px" }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: currentPage === 0 ? "#ccc" : "var(--interactive-accent)",
              color: "#fff",
              border: "none",
            }}
          >
            Previous
          </button>
          <span>Page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage + 1}
            onChange={(e) => handlePageChange(Number(e.target.value) - 1)}
            style={{ width: "50px", textAlign: "center", padding: "5px", borderRadius: "4px", border: "1px solid var(--background-modifier-border)" }}
          />
          <span>of {totalPages}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: currentPage === totalPages - 1 ? "#ccc" : "var(--interactive-accent)",
              color: "#fff",
              border: "none",
            }}
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
