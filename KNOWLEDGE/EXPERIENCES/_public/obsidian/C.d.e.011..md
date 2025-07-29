




```datacoretsx
// Initial query to fetch all recipe pages
const initialPath = "COOKBOOK/RECIPES/ALL";

/**
 * Styles for the table
 */
const tableStyles = {
    tableLayout: 'fixed',
    width: '100%',
    borderCollapse: 'collapse',
};

/**
 * DraggableLink Component
 * Allows dragging the recipe title as an internal link.
 */
function DraggableLink({ title }) {
    const handleDragStart = (event) => {
        event.dataTransfer.setData("text/plain", `[[${title}]]`);
        event.dataTransfer.effectAllowed = "copy";
    };

    return (
        <a
            href={title}
            className="internal-link"
            draggable
            onDragStart={handleDragStart}
            title={`Drag to copy [[${title}]]`}
            style={linkStyles}
        >
            {title}
        </a>
    );
}

// Styles for the DraggableLink
const linkStyles = {
    display: 'block',
    maxWidth: '100%',
    wordWrap: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    WebkitLineClamp: 3,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    lineClamp: 3,
    height: '4.5em',
    lineHeight: '1.5em',
    whiteSpace: 'normal',
};

/**
 * Configurations for column rendering
 */
const COLUMN_CONFIGS = {
    Recipes: (recipe) => <DraggableLink title={recipe.$name} />,
    Source: (recipe) => recipe.value("Source") || recipe.value("link"),
    Genre: (recipe) => recipe.value("genre"),
    Tags: (recipe) => recipe.$tags.filter(t => t.startsWith("#")).join(" "),
    Rating: (recipe) => recipe.value("rating"),
};

// Dynamic column definitions
const getColumns = (columnsToShow) => {
    return columnsToShow.map(id => ({
        id,
        value: COLUMN_CONFIGS[id]
    }));
};

/**
 * Group Header Component
 * Renders group headers for Genre, Tags, or Source.
 */
function GroupHeader({ label, rows = [] }) {
    // Ensure rows is always an array, even if it's undefined
    return (
        <dc.Group justify="space-between" align="center">
            <h2>{label || "Uncategorized"}</h2>
            <span>{rows.length} recipes</span>
        </dc.Group>
    );
}

const GROUPINGS_OPTIONS = {
    Genre: GroupHeader,
    Tags: GroupHeader,
    Source: GroupHeader,
};

/**
 * Main View Component
 * Manages the recipe display, search, and grouping controls.
 */
return function View() {
    const [nameFilter, setNameFilter] = dc.useState("");
    const [queryPath, setQueryPath] = dc.useState(initialPath);
    const [groupBy, setGroupBy] = dc.useState("Genre");
    const [columnsToShow, setColumnsToShow] = dc.useState(["Recipes", "Source", "Genre", "Tags", "Rating"]); // Control visible columns

    // Fetch and group recipes based on query and filter
    const query = `@page and path("${queryPath}")`;
    const recipes = dc.useQuery(query);

    // Memoized recipe grouping logic to optimize re-renders
    const grouped = dc.useMemo(() => {
        return recipes
            .filter(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
            .sort((a, b) => b.value("rating") - a.value("rating"))
            .reduce((groups, recipe) => {
                const groupKey = groupBy === "Tags"
                    ? recipe.$tags.filter(t => t.startsWith("#")).join(", ") || "Untagged"
                    : recipe.value(groupBy.toLowerCase()) || "Uncategorized";

                if (!groups[groupKey]) groups[groupKey] = [];
                groups[groupKey].push(recipe);
                return groups;
            }, {});
    }, [recipes, nameFilter, groupBy]);

    // Convert grouped object into an array for rendering
    const groupedArray = Object.entries(grouped).map(([label, rows]) => ({
        key: label,
        rows,
    }));

    return (
        <dc.Stack style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Controls for filtering and configuration */}
            <dc.Group justify="space-between" style={{ padding: '10px', gap: '20px' }}>
                <dc.Textbox
                    type="search"
                    placeholder="Filter recipes..."
                    onChange={e => setNameFilter(e.target.value)}
                />
                <dc.Textbox
                    value={queryPath}
                    placeholder="Enter path..."
                    onChange={e => setQueryPath(e.target.value)}
                />
                <dc.Dropdown
                    options={Object.keys(GROUPINGS_OPTIONS)}
                    selected={groupBy}
                    onChange={setGroupBy}
                />
                {/* Add a control to select columns */}
                <dc.Dropdown
                    multiple
                    options={Object.keys(COLUMN_CONFIGS)}
                    selected={columnsToShow}
                    onChange={setColumnsToShow}
                    placeholder="Select columns..."
                />
            </dc.Group>

            {/* Table for rendering grouped and filtered recipes */}
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                <dc.VanillaTable
                    groupings={{ render: GROUPINGS_OPTIONS[groupBy] }}
                    columns={getColumns(columnsToShow)}
                    rows={groupedArray}
                    paging={8}
                    style={tableStyles}
                />
            </div>
        </dc.Stack>
    );
};
```





CODE


```jsx
// Initial query to fetch all recipe pages
const initialPath = "COOKBOOK/RECIPES/ALL";

/**
 * Styles for the table
 */
const tableStyles = {
    tableLayout: 'fixed',
    width: '100%',
    borderCollapse: 'collapse',
};

/**
 * DraggableLink Component
 * Allows dragging the recipe title as an internal link.
 */
function DraggableLink({ title }) {
    const handleDragStart = (event) => {
        event.dataTransfer.setData("text/plain", `[[${title}]]`);
        event.dataTransfer.effectAllowed = "copy";
    };

    return (
        <a
            href={title}
            className="internal-link"
            draggable
            onDragStart={handleDragStart}
            title={`Drag to copy [[${title}]]`}
            style={linkStyles}
        >
            {title}
        </a>
    );
}

// Styles for the DraggableLink
const linkStyles = {
    display: 'block',
    maxWidth: '100%',
    wordWrap: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    WebkitLineClamp: 3,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    lineClamp: 3,
    height: '4.5em',
    lineHeight: '1.5em',
    whiteSpace: 'normal',
};

/**
 * Configurations for column rendering
 */
const COLUMN_CONFIGS = {
    Recipes: (recipe) => <DraggableLink title={recipe.$name} />,
    Source: (recipe) => recipe.value("Source") || recipe.value("link"),
    Genre: (recipe) => recipe.value("genre"),
    Tags: (recipe) => recipe.$tags.filter(t => t.startsWith("#")).join(" "),
    Rating: (recipe) => recipe.value("rating"),
};

// Dynamic column definitions
const getColumns = (columnsToShow) => {
    return columnsToShow.map(id => ({
        id,
        value: COLUMN_CONFIGS[id]
    }));
};

/**
 * Group Header Component
 * Renders group headers for Genre, Tags, or Source.
 */
function GroupHeader({ label, rows = [] }) {
    // Ensure rows is always an array, even if it's undefined
    return (
        <dc.Group justify="space-between" align="center">
            <h2>{label || "Uncategorized"}</h2>
            <span>{rows.length} recipes</span>
        </dc.Group>
    );
}

const GROUPINGS_OPTIONS = {
    Genre: GroupHeader,
    Tags: GroupHeader,
    Source: GroupHeader,
};

/**
 * Main View Component
 * Manages the recipe display, search, and grouping controls.
 */
return function View() {
    const [nameFilter, setNameFilter] = dc.useState("");
    const [queryPath, setQueryPath] = dc.useState(initialPath);
    const [groupBy, setGroupBy] = dc.useState("Genre");
    const [columnsToShow, setColumnsToShow] = dc.useState(["Recipes", "Source", "Genre", "Tags", "Rating"]); // Control visible columns

    // Fetch and group recipes based on query and filter
    const query = `@page and path("${queryPath}")`;
    const recipes = dc.useQuery(query);

    // Memoized recipe grouping logic to optimize re-renders
    const grouped = dc.useMemo(() => {
        return recipes
            .filter(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
            .sort((a, b) => b.value("rating") - a.value("rating"))
            .reduce((groups, recipe) => {
                const groupKey = groupBy === "Tags"
                    ? recipe.$tags.filter(t => t.startsWith("#")).join(", ") || "Untagged"
                    : recipe.value(groupBy.toLowerCase()) || "Uncategorized";

                if (!groups[groupKey]) groups[groupKey] = [];
                groups[groupKey].push(recipe);
                return groups;
            }, {});
    }, [recipes, nameFilter, groupBy]);

    // Convert grouped object into an array for rendering
    const groupedArray = Object.entries(grouped).map(([label, rows]) => ({
        key: label,
        rows,
    }));

    return (
        <dc.Stack style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Controls for filtering and configuration */}
            <dc.Group justify="space-between" style={{ padding: '10px', gap: '20px' }}>
                <dc.Textbox
                    type="search"
                    placeholder="Filter recipes..."
                    onChange={e => setNameFilter(e.target.value)}
                />
                <dc.Textbox
                    value={queryPath}
                    placeholder="Enter path..."
                    onChange={e => setQueryPath(e.target.value)}
                />
                <dc.Dropdown
                    options={Object.keys(GROUPINGS_OPTIONS)}
                    selected={groupBy}
                    onChange={setGroupBy}
                />
                {/* Add a control to select columns */}
                <dc.Dropdown
                    multiple
                    options={Object.keys(COLUMN_CONFIGS)}
                    selected={columnsToShow}
                    onChange={setColumnsToShow}
                    placeholder="Select columns..."
                />
            </dc.Group>

            {/* Table for rendering grouped and filtered recipes */}
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                <dc.VanillaTable
                    groupings={{ render: GROUPINGS_OPTIONS[groupBy] }}
                    columns={getColumns(columnsToShow)}
                    rows={groupedArray}
                    paging={8}
                    style={tableStyles}
                />
            </div>
        </dc.Stack>
    );
};
```