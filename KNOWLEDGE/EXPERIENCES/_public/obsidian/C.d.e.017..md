




```datacoretsx
// Declare types for entry and column properties
type Entry = {
  $ctime?: Date;
  $name?: string;
  $frontmatter?: { [key: string]: { value: string } };
};

type ColumnProperties = {
  [key: string]: string;
};

// Define column properties
const initialPath: string = "COOKBOOK/RECIPES/ALL";

// Master controller for column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props: ColumnProperties) => props,
  getFallbackValue: () => "Unknown",
  getNoDataFallback: () => "No Data",
};

// Define the dynamic column properties
const DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns({
  Recipes: "name.obsidian",
  Source: "source",
  Genre: "genre",
  Tags: "tags",
  Ingredients: "ingredients",
  "Creation Date": "ctime.obsidian",
});

// Retrieve properties with fallback
function getProperty(entry: Entry, property: string): string {
  if (property.endsWith(".obsidian")) {
    const cleanProp = property.replace(".obsidian", "");
    switch (cleanProp) {
      case "ctime":
        // Check if $ctime exists and is a valid Date or string
        if (entry.$ctime) {
          const ctimeDate = new Date(entry.$ctime);
          // Check if the Date is valid
          if (!isNaN(ctimeDate.getTime())) {
            return ctimeDate.toISOString().split("T")[0]; // Convert to ISO date
          }
        }
        return MASTER_COLUMN_CONTROLLER.getFallbackValue();
      case "name":
        return entry.$name || "Unnamed";
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback();
    }
  }

  if (entry.$frontmatter?.hasOwnProperty(property)) {
    const field = entry.$frontmatter[property];
    return field?.value ? field.value.toString() : "Unknown";
  }
  return MASTER_COLUMN_CONTROLLER.getNoDataFallback();
}


// Draggable link component
function DraggableLink({ title }: { title: string }): JSX.Element {
  const handleDrag = (e: React.DragEvent) => e.dataTransfer.setData("text/plain", `[[${title}]]`);
  return (
    <a href={title} draggable onDragStart={handleDrag}>
      {title}
    </a>
  );
}

// Debounce function for search inputs
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeout: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  } as T;
}

// Column manager and sorting
function ColumnManager({
  columns,
  setColumnsToShow,
  sortColumn,
  setSortColumn,
  sortOrder,
  setSortOrder,
}: {
  columns: string[];
  setColumnsToShow: (columns: string[]) => void;
  sortColumn: string;
  setSortColumn: (column: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
}) {
  return (
    <div>
      <label>Columns:</label>
      <dc.Dropdown
        multiple
        options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
        selected={columns}
        onChange={setColumnsToShow}
      />
      <label>Sort Column:</label>
      <dc.Dropdown
        options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
        selected={sortColumn}
        onChange={setSortColumn}
      />
      <label>Sort Order:</label>
      <dc.Dropdown
        options={["asc", "desc"]}
        selected={sortOrder}
        onChange={setSortOrder}
      />
    </div>
  );
}

// Generate dynamic columns
const COLUMNS = Object.keys(DYNAMIC_COLUMN_PROPERTIES).map((id) => ({
  id,
  value: (entry: Entry) =>
    id === "Recipes" ? (
      <DraggableLink title={getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[id])} />
    ) : (
      getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[id])
    ),
}));

// Main View component with TypeScript
function View(): JSX.Element {
  const [nameFilter, setNameFilter] = dc.useState<string>("");
  const [queryPath, setQueryPath] = dc.useState<string>(initialPath);
  const [groupBy, setGroupBy] = dc.useState<string>("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState<string[]>(
    COLUMNS.map((c) => c.id)
  );
  const [sortColumn, setSortColumn] = dc.useState<string>("Recipes");
  const [sortOrder, setSortOrder] = dc.useState<string>("asc");
  const [loading, setLoading] = dc.useState<boolean>(true);

  // Debounced search handling
  const handleSearch = debounce((value: string) => setNameFilter(value), 300);

  // Use memoization for improved performance
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Filter data
  const filteredData = dc.useMemo(
    () =>
      qdata.filter((entry: Entry) =>
        getProperty(entry, "name.obsidian").toLowerCase().includes(nameFilter.toLowerCase())
      ),
    [qdata, nameFilter]
  );

  // Sort data
  const sortedData = dc.useMemo(
    () =>
      filteredData.sort((a: Entry, b: Entry) => {
        const aValue = getProperty(a, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
        const bValue = getProperty(b, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue, undefined, { numeric: true })
          : bValue.localeCompare(aValue, undefined, { numeric: true });
      }),
    [filteredData, sortColumn, sortOrder]
  );

  // Group data
  const grouped = dc.useMemo(
    () =>
      dc.useArray(sortedData, (array: Entry[]) =>
        array
          .groupBy((x: Entry) => getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy]))
          .sort((x: { key: string }) => x.key)
      ),
    [sortedData, groupBy]
  );

  // Load stored column preferences
  dc.useEffect(() => {
    const savedColumns = localStorage.getItem("columnsToShow");
    if (savedColumns) setColumnsToShow(JSON.parse(savedColumns));
  }, []);

  // Save column preferences on change
  dc.useEffect(() => {
    localStorage.setItem("columnsToShow", JSON.stringify(columnsToShow));
  }, [columnsToShow]);

  // Loading effect simulation
  dc.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [queryPath]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!sortedData.length) {
    return <div>No recipes found. Try adjusting your filters or search criteria.</div>;
  }

  return (
    <dc.Stack>
      <ColumnManager
        columns={columnsToShow}
        setColumnsToShow={setColumnsToShow}
        sortColumn={sortColumn}
        setSortColumn={setSortColumn}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      <dc.Group>
        <dc.Textbox
          type="search"
          placeholder="Filter recipes..."
          value={nameFilter}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <dc.Textbox
          value={queryPath}
          placeholder="Enter path..."
          onChange={(e) => setQueryPath(e.target.value)}
        />
        <dc.Dropdown
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={groupBy}
          onChange={setGroupBy}
        />
      </dc.Group>
      <dc.VanillaTable
        groupings={{
          render: (label: string, rows: Entry[]) => (
            <h2>{label || "Uncategorized"}</h2>
          ),
        }}
        columns={COLUMNS.filter((c) => columnsToShow.includes(c.id))}
        rows={grouped}
        paging={8}
      />
    </dc.Stack>
  );
}

return View;
```





CODE



```tsx
// Declare types for entry and column properties
type Entry = {
  $ctime?: Date;
  $name?: string;
  $frontmatter?: { [key: string]: { value: string } };
};

type ColumnProperties = {
  [key: string]: string;
};

// Define column properties
const initialPath: string = "COOKBOOK/RECIPES/ALL";

// Master controller for column properties
const MASTER_COLUMN_CONTROLLER = {
  defineColumns: (props: ColumnProperties) => props,
  getFallbackValue: () => "Unknown",
  getNoDataFallback: () => "No Data",
};

// Define the dynamic column properties
const DYNAMIC_COLUMN_PROPERTIES = MASTER_COLUMN_CONTROLLER.defineColumns({
  Recipes: "name.obsidian",
  Source: "source",
  Genre: "genre",
  Tags: "tags",
  Ingredients: "ingredients",
  "Creation Date": "ctime.obsidian",
});

// Retrieve properties with fallback
function getProperty(entry: Entry, property: string): string {
  if (property.endsWith(".obsidian")) {
    const cleanProp = property.replace(".obsidian", "");
    switch (cleanProp) {
      case "ctime":
        // Check if $ctime exists and is a valid Date or string
        if (entry.$ctime) {
          const ctimeDate = new Date(entry.$ctime);
          // Check if the Date is valid
          if (!isNaN(ctimeDate.getTime())) {
            return ctimeDate.toISOString().split("T")[0]; // Convert to ISO date
          }
        }
        return MASTER_COLUMN_CONTROLLER.getFallbackValue();
      case "name":
        return entry.$name || "Unnamed";
      default:
        return MASTER_COLUMN_CONTROLLER.getNoDataFallback();
    }
  }

  if (entry.$frontmatter?.hasOwnProperty(property)) {
    const field = entry.$frontmatter[property];
    return field?.value ? field.value.toString() : "Unknown";
  }
  return MASTER_COLUMN_CONTROLLER.getNoDataFallback();
}


// Draggable link component
function DraggableLink({ title }: { title: string }): JSX.Element {
  const handleDrag = (e: React.DragEvent) => e.dataTransfer.setData("text/plain", `[[${title}]]`);
  return (
    <a href={title} draggable onDragStart={handleDrag}>
      {title}
    </a>
  );
}

// Debounce function for search inputs
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeout: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  } as T;
}

// Column manager and sorting
function ColumnManager({
  columns,
  setColumnsToShow,
  sortColumn,
  setSortColumn,
  sortOrder,
  setSortOrder,
}: {
  columns: string[];
  setColumnsToShow: (columns: string[]) => void;
  sortColumn: string;
  setSortColumn: (column: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
}) {
  return (
    <div>
      <label>Columns:</label>
      <dc.Dropdown
        multiple
        options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
        selected={columns}
        onChange={setColumnsToShow}
      />
      <label>Sort Column:</label>
      <dc.Dropdown
        options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
        selected={sortColumn}
        onChange={setSortColumn}
      />
      <label>Sort Order:</label>
      <dc.Dropdown
        options={["asc", "desc"]}
        selected={sortOrder}
        onChange={setSortOrder}
      />
    </div>
  );
}

// Generate dynamic columns
const COLUMNS = Object.keys(DYNAMIC_COLUMN_PROPERTIES).map((id) => ({
  id,
  value: (entry: Entry) =>
    id === "Recipes" ? (
      <DraggableLink title={getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[id])} />
    ) : (
      getProperty(entry, DYNAMIC_COLUMN_PROPERTIES[id])
    ),
}));

// Main View component with TypeScript
function View(): JSX.Element {
  const [nameFilter, setNameFilter] = dc.useState<string>("");
  const [queryPath, setQueryPath] = dc.useState<string>(initialPath);
  const [groupBy, setGroupBy] = dc.useState<string>("Genre");
  const [columnsToShow, setColumnsToShow] = dc.useState<string[]>(
    COLUMNS.map((c) => c.id)
  );
  const [sortColumn, setSortColumn] = dc.useState<string>("Recipes");
  const [sortOrder, setSortOrder] = dc.useState<string>("asc");
  const [loading, setLoading] = dc.useState<boolean>(true);

  // Debounced search handling
  const handleSearch = debounce((value: string) => setNameFilter(value), 300);

  // Use memoization for improved performance
  const qdata = dc.useQuery(`@page and path("${queryPath}")`);

  // Filter data
  const filteredData = dc.useMemo(
    () =>
      qdata.filter((entry: Entry) =>
        getProperty(entry, "name.obsidian").toLowerCase().includes(nameFilter.toLowerCase())
      ),
    [qdata, nameFilter]
  );

  // Sort data
  const sortedData = dc.useMemo(
    () =>
      filteredData.sort((a: Entry, b: Entry) => {
        const aValue = getProperty(a, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
        const bValue = getProperty(b, DYNAMIC_COLUMN_PROPERTIES[sortColumn]);
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue, undefined, { numeric: true })
          : bValue.localeCompare(aValue, undefined, { numeric: true });
      }),
    [filteredData, sortColumn, sortOrder]
  );

  // Group data
  const grouped = dc.useMemo(
    () =>
      dc.useArray(sortedData, (array: Entry[]) =>
        array
          .groupBy((x: Entry) => getProperty(x, DYNAMIC_COLUMN_PROPERTIES[groupBy]))
          .sort((x: { key: string }) => x.key)
      ),
    [sortedData, groupBy]
  );

  // Load stored column preferences
  dc.useEffect(() => {
    const savedColumns = localStorage.getItem("columnsToShow");
    if (savedColumns) setColumnsToShow(JSON.parse(savedColumns));
  }, []);

  // Save column preferences on change
  dc.useEffect(() => {
    localStorage.setItem("columnsToShow", JSON.stringify(columnsToShow));
  }, [columnsToShow]);

  // Loading effect simulation
  dc.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [queryPath]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!sortedData.length) {
    return <div>No recipes found. Try adjusting your filters or search criteria.</div>;
  }

  return (
    <dc.Stack>
      <ColumnManager
        columns={columnsToShow}
        setColumnsToShow={setColumnsToShow}
        sortColumn={sortColumn}
        setSortColumn={setSortColumn}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      <dc.Group>
        <dc.Textbox
          type="search"
          placeholder="Filter recipes..."
          value={nameFilter}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <dc.Textbox
          value={queryPath}
          placeholder="Enter path..."
          onChange={(e) => setQueryPath(e.target.value)}
        />
        <dc.Dropdown
          options={Object.keys(DYNAMIC_COLUMN_PROPERTIES)}
          selected={groupBy}
          onChange={setGroupBy}
        />
      </dc.Group>
      <dc.VanillaTable
        groupings={{
          render: (label: string, rows: Entry[]) => (
            <h2>{label || "Uncategorized"}</h2>
          ),
        }}
        columns={COLUMNS.filter((c) => columnsToShow.includes(c.id))}
        rows={grouped}
        paging={8}
      />
    </dc.Stack>
  );
}

return View;
```

