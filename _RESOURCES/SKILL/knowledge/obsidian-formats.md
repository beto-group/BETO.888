---
name: obsidian-core
description: Core Obsidian file format specifications including Markdown, Canvas (.canvas), and Bases (.base).
---

# Obsidian Core Skills

This skill provides the technical specifications for working with native Obsidian file formats.

## 📄 Obsidian Markdown

Obsidian uses GitHub Flavored Markdown (GFM) with specific extensions.

### Callouts
```markdown
> [!info] Title
> Content
```
Types: `note`, `abstract`, `info`, `todo`, `tip`, `success`, `question`, `warning`, `failure`, `danger`, `bug`, `example`, `quote`.

### Linking
*   **WikiLinks**: `[[Internal Link]]` or `[[Internal Link|Alias]]`.
*   **Embeds**: `![[Image.png]]` or `![[Note#Heading]]`.
*   **Block References**: `[[Note#^blockid]]`.

### Properties (YAML Frontmatter)
Must be at the very top of the file.
```yaml
---
tags: [dev, obsidian]
status: active
---
```

### 🚨 Datacore JSX Block (REQUIRED FOR VIEWERS)
All `.viewer.md` files serving as entry points for Datacore components MUST:
1.  **Leading Space**: Include at least two blank lines at the very top of the file before any code blocks.
2.  **JSX Block**: Wrap their factory logic in a `datacorejsx` code block. 
Failure to do this will result in the code being displayed as plain text instead of executing.

**Correct Usage:**
```markdown


`​``datacorejsx
const { View } = await dc.require("_RESOURCES/DATACORE/MyComponent/src/index.jsx");
return await View({ folderPath: "_RESOURCES/DATACORE/MyComponent" });
`​``
```

> [!important] 
> Never omit the `datacorejsx` identifier. Plain `javascript` or `jsx` blocks will NOT trigger the component engine.

---

## 🗃️ Obsidian Bases (`.base`)

Bases define dynamic views of notes (Database-like).

### Schema
```yaml
filters:
  and:
    - file.hasTag("project")
    - 'status != "archive"'

formulas:
  days_old: '(now() - file.ctime).days'

properties:
  formula.days_old:
    displayName: "Age (Days)"

views:
  - type: table
    name: "Active Projects"
    order: [file.name, formula.days_old]
```

### Key Functions
*   `date(string)`: Parse dates.
*   `file.hasTag("tag")`: Check tags.
*   `file.inFolder("path")`: Check folder.
*   `if(cond, true, false)`: Conditional logic.

---

## 🎨 JSON Canvas (`.canvas`)

Canvas files describe a spatial layout of notes and cards.

### Structure
```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "text",
      "text": "Hello World",
      "x": 0, "y": 0, "width": 400, "height": 200
    },
    {
      "id": "node2",
      "type": "file",
      "file": "MyNote.md",
      "x": 500, "y": 0, "width": 400, "height": 400
    }
  ],
  "edges": [
    {
      "id": "edge1",
      "fromNode": "node1",
      "fromSide": "right",
      "toNode": "node2",
      "toSide": "left"
    }
  ]
}
```

### Node Types
*   **text**: Plain markdown text.
*   **file**: Embed an Obsidian file.
*   **link**: External URL.
*   **group**: Visual container for other nodes.
