# 🧩 Dashboard888 — Component Drop Zone

This folder is the **self-contained component registry** for Dashboard 888.
It supports **both** single-file and folder-based components.

---

## Pattern A — Flat File (< 500 lines)

Drop a single `.md` file directly:
```
_resources/components/
└── MyComponent.md
```

Register in `INDEX.bet8.md`:
```
## My Component
    [Subtitle]
###### [My Component](my-component)
icon: lucide-icon-name
file: MEDIA_BASENAME
path: _resources/components/MyComponent.md
```

Import in `src/ViewComponent.md`:
```js
const { MyComponent } = await dc.require(
    dc.headerLink(dc.resolvePath("_resources/components/MyComponent.md"), "MyComponent")
);
```

---

## Pattern B — Folder (> 500 lines, Rule #7 Elite Architecture)

Drop a full component folder. The entry point MUST be ALL-CAPS per Rule #16:
```
_resources/components/
└── MyComponent/
    ├── MY COMPONENT.md   ← entry point (ALL-CAPS)
    └── src/
        ├── Engine.md
        └── Renderer.md
```

Register in `INDEX.bet8.md`:
```
## My Component
    [Subtitle]
###### [My Component](my-component)
icon: lucide-icon-name
file: MEDIA_BASENAME
path: _resources/components/MyComponent/MY COMPONENT.md
```

Import in `src/ViewComponent.md`:
```js
const { MyComponent } = await dc.require(
    dc.headerLink(dc.resolvePath("_resources/components/MyComponent/MY COMPONENT.md"), "MyComponent")
);
```

---

## Registered Components

| File / Folder | Export | Pattern | Tab |
|---|---|---|---|
| `AssetsLibrary.md` | `AssetsLibrary` | Flat | Assets |
| `DatacorePlayground.md` | `DatacorePlayground` | Flat | Datacore Playground |

---

## Rules
- **Rule #7**: Over 500 lines → use folder + `src/` structure
- **Rule #15**: ALL components live here. Core engine stays in `src/`
- **Rule #16**: Folder entry points MUST be named in ALL-CAPS
- **Rule #13**: Zero absolute paths — always use `dc.resolvePath()`
