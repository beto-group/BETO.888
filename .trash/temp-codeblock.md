# TempComponent

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