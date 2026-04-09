---
author: beto.group
name.official: Mermaid Diagram Editor
price: "0"
version: 1.0.0
category:
  - utility
  - visualization
tags:
  - mermaid
  - diagrams
  - editor
  - svg
desc: A powerful, self-contained environment for creating, editing, and interacting with Mermaid diagrams directly within Obsidian.
status: stable
complexity: intermediate
ext.dependencies:
  - mermaid.js
  - svg-pan-zoom
platform: desktop
id: 69
resources:
  - mermaiddiagram_clip.webm
  - mermaid_diagram.webp
longDesc: A powerful, self-contained environment for creating, editing, and interacting with Mermaid diagrams directly within Obsidian. It features a split-pane layout with a live code editor and a real-time preview that supports advanced pan and zoom interactions. The component handles the dynamic loading of the Mermaid library and provides utilities for exporting your creations as SVG files.
does: '[  {    "title": "Live Diagram Editing",    "children": [      {        "title": "Split Interface",        "content": "Features a resizable layout with a raw text editor for Mermaid syntax and a live preview pane."      },      {        "title": "Syntax Feedback",        "content": "Includes a built-in error reporter that highlights syntax issues in real-time."      }    ]  },  {    "title": "Interactive Preview",    "children": [      {        "title": "Pan & Zoom",        "content": "Implements a robust system allowing users to pan and zoom to navigate large, complex diagrams easily."      }    ]  },  {    "title": "Export & Offline",    "children": [      {        "title": "Export Tools",        "content": "Supports instant SVG clipboard copies and standalone .svg file downloads."      },      {        "title": "Dynamic Loading",        "content": "Fetches and caches the mermaid.js library from a CDN on first run, enabling offline functionality."      }    ]  }]'
cant: '[  {    "title": "Non-Mermaid Syntax",    "content": "Strictly limited to the Mermaid language; cannot render Graphviz, PlantUML, or other formats."  },  {    "title": "Auto-Save",    "content": "Edits are currently session-based or require manual copying; no automatic vault file binding."  },  {    "title": "First Run Connection",    "content": "Requires internet access initially to fetch the Mermaid library from CDN."  }]'
version.obsidian: 1.4.11
---

### Tab: Mermaid Diagram Editor

- **Description**: A powerful, self-contained environment for creating, editing, and interacting with Mermaid diagrams directly within Obsidian. It features a split-pane layout with a live code editor and a real-time preview that supports advanced pan and zoom interactions. The component handles the dynamic loading of the Mermaid library and provides utilities for exporting your creations as SVG files.

- **Does**:

    - **Live Diagram Editing**:
        - **Split Interface**: Features a resizable layout with a raw text editor for Mermaid syntax and a live preview pane.
        - **Syntax Feedback**: Includes a built-in error reporter that highlights syntax issues in real-time.
        - **Example Library**: Provides one-click access to templates for Flowcharts, Sequence Diagrams, Class Diagrams, State Charts, Gantt charts, and Pie charts.
    - **Interactive Preview**:
        - **Pan & Zoom**: Implements a robust system allowing users to pan (drag) and zoom (scroll wheel) to navigate large, complex diagrams easily.
    - **Export Tools**:
        - **Copy SVG**: Instantly copies the generated SVG code to the clipboard for use elsewhere.
        - **Download**: Saves the current diagram as a standalone `.svg` file to your computer.
    - **Self-Contained Architecture**:
        - **Dynamic Loading**: Fetches and caches the `mermaid.js` library from a CDN on first run, ensuring it works offline subsequently.
        - **Full-Tab Mode**: Expands to fill the entire pane for a distraction-free editing experience.

- **Can’t**:

    - **Syntax Limitation**: Strictly limited to the Mermaid diagramming language. It cannot render Graphviz, PlantUML, or other diagram formats.
    - **Obsidian File Isolation**: Edits are currently session-based or require manual copying. It does not automatically bind to a specific `.md` file in the vault.
    - **Setup Offline**: Requires internet access initially to fetch the Mermaid library from CDN.


------

![Mermaid Diagram Editor Clip](_resources/videos/mermaiddiagram_clip.webm)

![Mermaid Diagram Editor Screenshot 1](_resources/images/mermaid_diagram.webp)

### Components
###### [Mermaid Diagram Viewer](D.q.mermaiddiagram.viewer.md)
###### [Mermaid Diagram Components {index.jsx}](D.q.mermaiddiagram.component.md)
