

broken links dont function
	hehe

```datacorejsx
const query = `@page and path("COOKBOOK/RECIPES/ALL")`;

function DraggableLink(props) {
  const handleDragStart = (event) => {
    event.dataTransfer.setData("text/plain", `[[${props.children}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <span
      {...props}
      draggable
      onDragStart={handleDragStart}
      style={{ cursor: 'grab' }}
    >
      {`[[${props.children}]]`} {/* Display the title as [[title]] */}
    </span>
  );
}

const COLUMNS = [
  { 
    id: "Recipes", 
    value: (game) => <DraggableLink>{game.$name}</DraggableLink> 
  },
  { 
    id: "Source", 
    value: (game) => game.value("Source") ?? game.value("link") 
  },
  { 
    id: "Genre", 
    value: (game) => game.value("genre") 
  },
  { 
    id: "Tags", 
    value: (game) => game.$tags.filter(t => t.startsWith("#")).join(" ") 
  },
  { 
    id: "Rating", 
    value: (game) => game.value("rating") 
  }
];

function GenreGroup(genre, rows) {
  return (
    <dc.Group justify="space-between" align="center">
      <h2>{genre || "Uncategorized"}</h2>
      <span>{rows.length} recipes</span>
    </dc.Group>
  );
}

const GROUPINGS = { render: GenreGroup };

function View() {
  const [nameFilter, setNameFilter] = dc.useState("");

  const recipes = dc.useQuery(query);
  const grouped = dc.useArray(recipes, array => {
    return array
      .where(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
      .sort(x => x.value("rating"), 'desc')
      .groupBy(x => x.value("genre") || "Uncategorized")
      .sort(x => x.key);
  }, [nameFilter]);

  const viewStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const searchControlStyle = {
    padding: '10px',
    flexShrink: 0
  };

  const tableContainerStyle = {
    flexGrow: 1,
    overflowY: 'auto'
  };

  return (
    <dc.Stack style={viewStyle}>
      <dc.Group id="search-controls" justify="end" style={searchControlStyle}>
        <dc.Textbox 
          type="search" 
          placeholder="Filter recipes..." 
          width="600px" 
          onChange={e => setNameFilter(e.target.value)} 
        />
      </dc.Group>
      <div style={tableContainerStyle}>
        <dc.VanillaTable 
          groupings={GROUPINGS} 
          columns={COLUMNS} 
          rows={grouped} 
          paging={8}
        />
      </div>
    </dc.Stack>
  );
}

// Return the View function directly
return View;
```




CODE


```jsx
const query = `@page and path("COOKBOOK/RECIPES/ALL")`;

function DraggableLink(props) {
  const handleDragStart = (event) => {
    event.dataTransfer.setData("text/plain", `[[${props.children}]]`);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <span
      {...props}
      draggable
      onDragStart={handleDragStart}
      style={{ cursor: 'grab' }}
    >
      {`[[${props.children}]]`} {/* Display the title as [[title]] */}
    </span>
  );
}

const COLUMNS = [
  { 
    id: "Recipes", 
    value: (game) => <DraggableLink>{game.$name}</DraggableLink> 
  },
  { 
    id: "Source", 
    value: (game) => game.value("Source") ?? game.value("link") 
  },
  { 
    id: "Genre", 
    value: (game) => game.value("genre") 
  },
  { 
    id: "Tags", 
    value: (game) => game.$tags.filter(t => t.startsWith("#")).join(" ") 
  },
  { 
    id: "Rating", 
    value: (game) => game.value("rating") 
  }
];

function GenreGroup(genre, rows) {
  return (
    <dc.Group justify="space-between" align="center">
      <h2>{genre || "Uncategorized"}</h2>
      <span>{rows.length} recipes</span>
    </dc.Group>
  );
}

const GROUPINGS = { render: GenreGroup };

function View() {
  const [nameFilter, setNameFilter] = dc.useState("");

  const recipes = dc.useQuery(query);
  const grouped = dc.useArray(recipes, array => {
    return array
      .where(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
      .sort(x => x.value("rating"), 'desc')
      .groupBy(x => x.value("genre") || "Uncategorized")
      .sort(x => x.key);
  }, [nameFilter]);

  const viewStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const searchControlStyle = {
    padding: '10px',
    flexShrink: 0
  };

  const tableContainerStyle = {
    flexGrow: 1,
    overflowY: 'auto'
  };

  return (
    <dc.Stack style={viewStyle}>
      <dc.Group id="search-controls" justify="end" style={searchControlStyle}>
        <dc.Textbox 
          type="search" 
          placeholder="Filter recipes..." 
          width="600px" 
          onChange={e => setNameFilter(e.target.value)} 
        />
      </dc.Group>
      <div style={tableContainerStyle}>
        <dc.VanillaTable 
          groupings={GROUPINGS} 
          columns={COLUMNS} 
          rows={grouped} 
          paging={8}
        />
      </div>
    </dc.Stack>
  );
}

// Return the View function directly
return View;
```



