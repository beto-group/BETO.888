

```jsx
function FilesTable() {
  // Directly query pages that are in the "COOKBOOK" folder and whose $name is not "2023-10-03_repas_0"
  const content = dc.useQuery(`@page and path("COOKBOOK/RECIPES/ALL")`);

	console.log(content)
  return (
    <dc.Stack style={{ padding: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Created</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Note</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Tags</th>
          </tr>
        </thead>
        <tbody>
          {content.map(entry => (
            <tr key={entry.$path}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{entry.$name}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{new Date(entry.$ctime.ts).toISOString().split("T")[0] || "Not set"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{new Date(entry.$mtime.ts).toISOString().split("T")[0] || ""}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {entry.$tags || ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </dc.Stack>
  );
}

return FilesTable;

```