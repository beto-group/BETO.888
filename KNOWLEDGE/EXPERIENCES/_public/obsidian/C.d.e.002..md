


```datacorejsx
const query = `@page and path("COOKBOOK/RECIPES/ALL")`;
const COLUMNS = [
  { id: "Recipes", value: (game) => game.$link },
  { id: "Source", value: (game) => game.value("Source") ?? game.value("link") },
  { id: "Genre", value: (game) => game.value("genre") },
  { id: "Tags", value: (game) => game.$tags.filter(t => t.startsWith("#")).join(" ") },
  { id: "Rating", value: (game) => game.value("rating") }
];

function YearGroup(year, rows) {
  return (
    <dc.Group justify="space-between" align="center">
      <h2>{year}</h2>
      <span>{rows.length} entries</span>
    </dc.Group>
  );
}

const GROUPINGS = { render: YearGroup };

function timePlayed(input) {
  let raw = input.value("time played") ?? input.value("time-played");
  while (Array.isArray(raw)) raw = raw[0];
  return typeof raw === "string" ? undefined : raw;
}

function View() {
  const [nameFilter, setNameFilter] = dc.useState("");

  const games = dc.useQuery(query);
  const grouped = dc.useArray(games, array => {
    return array
      .where(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
      .sort(x => timePlayed(x), 'desc')
      .groupBy(x => timePlayed(x)?.year)
      .sort(x => x.key, 'desc');
  }, [nameFilter]);

  return (
    <dc.Stack>
      <dc.Group id="search-controls" justify="end">
        <dc.Textbox 
          type="search" 
          placeholder="Filter..." 
          width="600px" 
          onChange={e => setNameFilter(e.target.value)} 
        />
      </dc.Group>
      <dc.VanillaTable 
        groupings={GROUPINGS} 
        columns={COLUMNS} 
        rows={grouped} 
        paging={6}
      />
    </dc.Stack>
  );
}

// Return the View function directly
return View;
```






CODE



```jsx
const query = `@page and path("COOKBOOK/RECIPES/ALL")`;
const COLUMNS = [
  { id: "Recipes", value: (game) => game.$link },
  { id: "Source", value: (game) => game.value("Source") ?? game.value("link") },
  { id: "Genre", value: (game) => game.value("genre") },
  { id: "Tags", value: (game) => game.$tags.filter(t => t.startsWith("#")).join(" ") },
  { id: "Rating", value: (game) => game.value("rating") }
];

function YearGroup(year, rows) {
  return (
    <dc.Group justify="space-between" align="center">
      <h2>{year}</h2>
      <span>{rows.length} entries</span>
    </dc.Group>
  );
}

const GROUPINGS = { render: YearGroup };

function timePlayed(input) {
  let raw = input.value("time played") ?? input.value("time-played");
  while (Array.isArray(raw)) raw = raw[0];
  return typeof raw === "string" ? undefined : raw;
}

function View() {
  const [nameFilter, setNameFilter] = dc.useState("");

  const games = dc.useQuery(query);
  const grouped = dc.useArray(games, array => {
    return array
      .where(x => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()))
      .sort(x => timePlayed(x), 'desc')
      .groupBy(x => timePlayed(x)?.year)
      .sort(x => x.key, 'desc');
  }, [nameFilter]);

  return (
    <dc.Stack>
      <dc.Group id="search-controls" justify="end">
        <dc.Textbox 
          type="search" 
          placeholder="Filter..." 
          width="600px" 
          onChange={e => setNameFilter(e.target.value)} 
        />
      </dc.Group>
      <dc.VanillaTable 
        groupings={GROUPINGS} 
        columns={COLUMNS} 
        rows={grouped} 
        paging={6}
      />
    </dc.Stack>
  );
}

// Return the View function directly
return View;
```




