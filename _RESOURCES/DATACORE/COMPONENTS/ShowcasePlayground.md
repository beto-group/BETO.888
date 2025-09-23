---
tags: datacore-component
---

# ViewComponent

```jsx
const { QueryComponent } = await dc.require(dc.headerLink("_RESOURCES/DATACORE/COMPONENTS/ShowcasePlayground.md", "QueryComponent"));

function View() {
  const pages = dc.useQuery(`@page and path("_RESOURCES/DATACORE")`);

  return (
    <>
        <h1>DATACORE COMPONENT</h1>
        <QueryComponent/>
    </>
  )
}

return View
```


# QueryComponent

```jsx
const COLUMNS = [
  { id: "Name", value: (page) => page.$link },
  { id: "Created", value: (page) => page.$ctime },
  { id: "Modified", value: (page) => page.$mtime },
  { id: "Tags", value: (page) => page.tags?.join(", ") || "" }
];

function QueryComponent() {
  const pages = dc.useQuery(`@page and path("_RESOURCES/DATACORE")`);
  
  return (
    <dc.VanillaTable
      columns={COLUMNS}
      rows={pages}
      paging={true}
    />
  )
}

return { QueryComponent };
```