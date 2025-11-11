

# ViewComponent

```jsx
const COLUMNS = [
  { id: "Name", value: "$link" },
  { id: "Created", value: "$ctime" },
  { id: "Modified", value: "$mtime" },
  { id: "Tags", value: "tags" }
];

POLISHED_COLUMNS = COLUMNS.map(col => ({
  ...col,
  value: page => page.value(col.value)
}));

function View() {
  const { useState } = dc;
  const [path, setPath] = useState("_OPERATION");
  const pages = dc.useQuery(`@page and path("${path}")`);

  const sortedPages = pages.sort((a, b) => {
    return new Date(b.value("$ctime")) - new Date(a.value("$ctime"));
  });

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "15px" }}>
        Path: <input value={path} onChange={e => setPath(e.target.value)} placeholder="Enter path..." />
      </div>
      <dc.VanillaTable
        columns={POLISHED_COLUMNS}
        rows={sortedPages}
        paging={true}
      />
    </div>
  );
}

return { View }
```