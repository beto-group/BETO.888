



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

const { useState, useMemo, useEffect } = dc; // Assuming 'dc' is the Dataview context

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
  tooltip: {
    position: "absolute",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
    zIndex: 10,
  },
  helperBox: {
    marginTop: "10px",
    padding: "15px",
    backgroundColor: "var(--background-secondary)",
    color: "var(--text-normal)",
    borderRadius: "8px",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.1)",
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
  const [nameFilter, setNameFilter] = useState(
    mergedSettings.initialNameFilter || ""
  );
  const [queryPath, setQueryPath] = useState(mergedSettings.queryPath);
  const [currentPage, setCurrentPage] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [additionalQuery, setAdditionalQuery] = useState("");
  
  const handleFocus = (field) => (e) => {
    if (field === "additionalQuery") {
      const content =
        "Use this field to add more query parameters (e.g., #tag or rating > 4). This allows you to refine your search and view more specific data.";
      setTooltipContent(content);
      setTooltipPosition({ x: e.target.getBoundingClientRect().left, y: e.target.getBoundingClientRect().bottom + window.scrollY });
      setShowTooltip(true);
    }
  };

  const handleBlur = () => {
    setShowTooltip(false);
  };

  const sanitizedAdditionalQuery = additionalQuery.trim().replace(/(^\s*#)|\s+#$/g, '');

  const qdata = dc.useQuery(`@page and path("${queryPath}") ${sanitizedAdditionalQuery ? 'and ' + sanitizedAdditionalQuery : ''}`, { debounce: 300 });

  const filteredData = useMemo(() => {
    return qdata.filter((entry) => {
      const entryName = getProperty(entry, "name.obsidian").toLowerCase();
      return entryName.includes(nameFilter.toLowerCase());
    });
  }, [qdata, nameFilter]);

  const pageSize = mergedSettings.pagination.itemsPerPage;
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(0, Math.min(newPage, totalPages - 1)));
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
          <dc.Textbox
            type="search"
            placeholder={mergedSettings.placeholders.nameFilter}
            value={nameFilter}
            onBlur={handleBlur}
            onChange={(e) => {
              setNameFilter(e.target.value);
              setCurrentPage(0); // Reset to first page when search changes
            }}
            style={styles.textbox}
          />
          <dc.Textbox
            value={queryPath}
            placeholder={mergedSettings.placeholders.queryPath}
            onBlur={handleBlur}
            onChange={(e) => {
              setQueryPath(e.target.value);
              setCurrentPage(0); // Reset to first page when path changes
            }}
            style={styles.textbox}
          />
          <dc.Textbox
            value={additionalQuery}
            placeholder="Add query parameters..."
            onFocus={handleFocus("additionalQuery")}
            onBlur={handleBlur}
            onChange={(e) => {
              setAdditionalQuery(e.target.value);
              setCurrentPage(0); // Reset to first page when query changes
            }}
            style={styles.textbox}
          />
        </dc.Group>
      </div>

      {showTooltip && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          {tooltipContent}
        </div>
      )}

      <div style={styles.helperBox}>
        <h3>Query Helper</h3>
        <p>
          Use the "Add query parameters" field to refine your search. You can use:
        </p>
        <ul>
          <li><strong>#tag:</strong> Filter by specific tags.</li>
          <li><strong>rating &gt; 4:</strong> Filter entries based on their rating.</li>
          <li><strong>source: "Your Source"</strong>: Search by source field.</li>
          <li>Combine multiple parameters for advanced searches.</li>
        </ul>
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

return { View };

```
