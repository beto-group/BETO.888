---
author: beto.group
name.official: Basic Folder View v2
price: "0"
version: 2.0.0
category:
  - utility
  - boilerplate
tags:
  - mcp
  - vitest
  - telegram-bridge
  - instrumentation
desc: An evolution of the core boilerplate, featuring an industrial-grade instrumentation layer and native MCP support.
status: stable
complexity: intermediate
ext.dependencies:
  - mcp-sdk
  - vitest
  - telegram-api
platform: desktop
id: 66.2
resources:
  - basicfolderviewv2.clip.webm
  - basicfolderviewv2_1.webp
longDesc: Basic Folder View v2 is an evolution of the core boilerplate, featuring an industrial-grade instrumentation layer. It extends the immersive full-tab foundation with native Model Context Protocol (MCP) support, comprehensive unit testing via Vitest, and a synchronized Telegram prompting bridge.
does: '[  {    "title": "Industrial Instrumentation",    "children": [      {        "title": "Full-Pane Management",        "content": "Logic refined via custom useFullTab hooks for maximum responsiveness and modularity."      },      {        "title": "MCP Integration",        "content": "Features a native command bridge for external interactivity and bi-directional communication."      }    ]  },  {    "title": "Verification & Control",    "children": [      {        "title": "Stability Proving",        "content": "Includes a vitest test suite to verify UI integrity across Obsidian updates."      },      {        "title": "Terminal Synchronization",        "content": "Integrates a Telegram prompt bridge for remote lifecycle management."      }    ]  }]'
cant: '[  {    "title": "Auto-Sync",    "content": "Does not automatically sync test results to cloud-mesh without the beto-nexus plugin active."  },  {    "title": "Environment Execution",    "content": "Requires the Datacore environment for bridge initialization and MCP protocol synchronization."  }]'
version.obsidian: 1.4.11
---

### Tab: Basic Folder View v2

- **Description**: Basic Folder View v2 is an evolution of the core boilerplate, featuring an industrial-grade instrumentation layer. It extends the immersive full-tab foundation with native Model Context Protocol (MCP) support, comprehensive unit testing via Vitest, and a synchronized Telegram prompting bridge.

- **Does**:

    - **Industrial Instrumentation**:
        - **Full-Pane Management**: Logic refined via custom `useFullTab` hooks for maximum responsiveness and modularity.
        - **MCP Integration**: Features a native command bridge for external interactivity and bi-directional communication.
    - **Verification & Control**:
        - **Stability Proving**: Includes a `vitest` test suite to verify UI integrity across Obsidian updates.
        - **Terminal Synchronization**: Integrates a Telegram prompt bridge for remote lifecycle management.

- **Can't**:

    - **Auto-Sync**: Does not automatically sync test results to cloud-mesh without the `beto-nexus` plugin active.
    - **Environment Execution**: Requires the Datacore environment for bridge initialization and MCP protocol synchronization.

------

![Basic Folder View v2 Clip](_resources/videos/basicfolderviewv2.clip.webm)

![Basic Folder View v2 Screenshot 1](_resources/images/basicfolderviewv2_1.webp)

### Components
###### [Basic Folder View Viewer v2](D.q.basicfolderview.viewer.v2.md)
###### [Basic Folder View v2 Components {index.jsx}](src/index.jsx)
