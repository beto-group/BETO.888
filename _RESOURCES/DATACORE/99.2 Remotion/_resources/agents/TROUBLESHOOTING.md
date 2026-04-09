# Datacore Troubleshooting Guide

This document lists common errors encountered during Datacore project development and how to fix them.

## Error: `TypeError: Cannot read properties of null (reading '__H')`

### Cause
This is a **Hook Violation**. It occurs when you call a Preact/React hook (like `useState`, `useEffect`, `useRef`) inside an **async function**.
In Datacore, the main `View` factory is often `async` because it uses `await dc.require`. Hooks are only allowed inside **regular synchronous components**.

### Wrong Way (Will Crash)
```javascript
async function View({ folderPath }) {
  const { useState, useEffect } = dc;
  
  // ❌ ILLEGAL: useEffect inside async function
  useEffect(() => {
    console.log("This will crash with '__H' error");
  }, []);

  return <div>Hello</div>;
}
```

### Right Way
Move the logic into a sub-component that is not async:

```javascript
async function View({ folderPath }) {
  const { useState, useEffect } = dc;

  // Define a synchronous component for hooks
  function ViewComponent() {
    useEffect(() => {
      console.log("This is safe!");
    }, []);
    return <div>Hello</div>;
  }

  return <ViewComponent />;
}
```

---

## Error: `dc.require` returns `undefined` or `null`

### Cause
- Incorrect file path.
- The required file doesn't have a `return { ExportName };` statement at the bottom.
- Circular dependencies.

### Solution
- Verify the `folderPath` is correct.
- Ensure the exported file ends with `return { ComponentName };`.

---

## Error: New Component Not Appearing in Library

### Cause
- Datacore view caching; the directory scan in `src/index.jsx` ran before the file was created.
- Missing `category` in component metadata.
- User looking in "Scenes" list instead of "Library" list.

### Solution
1.  **Reload the View** (Essential).
2.  Check `metadata` array in the component file for `{ id: 'category', default: 'foreground' }`.
3.  **Emergency Fix**: Manually add the component to `libraryComponents` in `src/index.jsx` if auto-scan fails.
4.  **UX Fix**: Create a JSON file in `_scenes/ComponentName.json` to make it appear in the Scenes list immediately.

---

## Error: Stage renders as Square instead of 16:9

### Cause
1.  **Missing CSS Units**: React `style` objects require strings with units (e.g., `'1920px'`). Passing raw numbers like `{ width: 1920 }` can cause browsers to default to 1:1 or ignore the value entirely in certain contexts.
2.  **Flexbox Compression**: If the stage is a direct child of a `display: flex` container, the container may shrink the stage's width to fit the viewport, effectively forcing a square or skewed shape if the container is tight.

### Solution
-   **Force Units**: Always use template literals: ``width: `${width}px```.
-   **Disable Shrink**: Add `flexShrink: 0` to the stage element's style to guarantee it maintains its internal logical dimensions regardless of parent container constraints.
-   **Diagnostic Border**: Add a temporary `border: '2px solid red'` to the stage element to verify if the container itself is squashed or if the internal content is misaligning.
