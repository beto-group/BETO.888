---
author: beto.group
name.official: Basic Folder View v1
price: "0"
version: 1.0.0
category:
  - utility
  - boilerplate
tags:
  - template
  - full-tab
  - boilerplate
  - ui-logic
desc: A foundational template component designed for building immersive, full-tab experiences within Obsidian.
status: stable
complexity: basic
ext.dependencies:
  - preact
  - datacore-sdk
platform: desktop
id: 66.1
resources:
  - basicfolderviewv1.clip.webm
  - basicfolderviewv1_1.webp
longDesc: Basic Folder View is a foundational template component designed for building immersive, full-tab experiences within Obsidian. It serves as a sterile boilerplate for developers to break out of the standard Markdown preview flow and occupy the entire pane with custom UI logic.
does: '[  {    "title": "Full-Pane Management",    "children": [      {        "content": "Automatically identifies the parent workspace leaf and injects itself to cover the full content area."      },      {        "title": "Cleanup Protocol",        "content": "Handles proper restoration of the original DOM state when the component is unmounted."      }    ]  },  {    "title": "Developer Utilities",    "children": [      {        "title": "Hot Reloading",        "content": "Includes a built-in mechanism to refresh the component without reloading the entire application."      },      {        "title": "Scoped Styling",        "content": "Utilizes unique instance IDs to prevent CSS conflicts with other views or themes."      }    ]  }]'
cant: '[  {    "title": "State Persistence",    "content": "Does not persist UI state across restarts unless manually implemented by the developer."  },  {    "title": "Vault Data",    "content": "As a base template, it performs no file operations or data mutations out of the box."  }]'
version.obsidian: 1.4.11
---

### Tab: Basic Folder View v1

- **Description**: A foundational template component designed for building immersive, full-tab experiences within Obsidian. It serves as a sterile boilerplate for developers to break out of the standard Markdown preview flow and occupy the entire pane with custom UI logic.

- **Does**:

    - **Full-Pane Management**:
        - Automatically identifies the parent workspace leaf and injects itself to cover the full content area.
        - **Cleanup Protocol**: Handles proper restoration of the original DOM state when the component is unmounted.
    - **Developer Utilities**:
        - **Hot Reloading**: Includes a built-in mechanism to refresh the component without reloading the entire application.
        - **Scoped Styling**: Utilizes unique instance IDs to prevent CSS conflicts with other views or themes.

- **Can’t**:

    - **State Persistence**: Does not persist UI state across restarts unless manually implemented by the developer.
    - **Vault Data**: As a base template, it performs no file operations or data mutations out of the box.

------

![Basic Folder View v1 Clip](_resources/videos/basicfolderviewv1.clip.webm)

![Basic Folder View v1 Screenshot 1](_resources/images/basicfolderviewv1_1.webp)

### Components
###### [Basic Folder View Viewer v1](D.q.basicfolderview.viewer.v1.md)
###### [Basic Folder View v1 Components {index.jsx}](_RESOURCES/DATACORE/66.1%20BasicFolderView/src/index.jsx)
