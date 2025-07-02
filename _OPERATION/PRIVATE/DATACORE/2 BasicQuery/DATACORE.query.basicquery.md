


```datacorejsx
const COLUMNS = [
  { id: "Name", value: "$link" },
  { id: "Created", value: "$ctime" },
  { id: "Modified", value: "$mtime" },
  { id: "Tags", value: "tags" }
];

const GROUPING_KEYS = ["tags"];

POLISHED_COLUMNS = COLUMNS.map(col => ({
  ...col,
  value: page => page.value(col.value)
}));



function groupBy(array, keyFn) {
  const groups = {};
  array.forEach(item => {
    const key = keyFn(item) || "Undefined";
    if (!groups[key]) {
      groups[key] = { key, rows: [] };
    }
    groups[key].rows.push(item);
  });
  return Object.values(groups);
}

const groupingRender = (key, rows) => <div>{key} ({rows.length})</div>;

return function View() {
  // Query the pages.
  const pages = dc.useQuery(`@page and path("PROJECTS/COOKBOOK/KNOWLEDGE/RECIPES")`);

  // Sort pages in descending order by $ctime.
  const sortedPages = pages.sort((a, b) => {
    return new Date(b.value("$ctime")) - new Date(a.value("$ctime"));
  });

  const groupedPages = groupBy(sortedPages, page => {
    if (GROUPING_KEYS[0] === "$ctime") {
      const d = new Date(page.value("$ctime"));
      return d.toLocaleDateString();
    }
    return page.value(GROUPING_KEYS[0]);
  });

  return (
    <dc.VanillaTable
      columns={POLISHED_COLUMNS}
      rows={groupedPages}
      paging={true}
      groupings={groupingRender}
    />
  );
}

```