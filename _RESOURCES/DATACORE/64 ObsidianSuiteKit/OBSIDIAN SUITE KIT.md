---
author: beto.group
name.official: Obsidian Suite Kit
price: "0"
category:
  - utility
platform: desktop
tags:
  - developer-tool
  - api-inspector
  - ui-gallery
  - obsidian-api
  - modals
  - documentation
  - testing
desc: A developer utility for inspecting the native Obsidian API and interactively testing core UI components like Modals, Notices, and Settings.
status: stable
complexity: intermediate
id: 64
resources:
  - obsidiansuitekit.clip.webm
  - obsidian_suite_kit.webp
longDesc: A developer utility and interactive learning tool that provides a live exploration of the native Obsidian API. It inspects the global obsidian module and app object, lists all available properties, and offers a gallery of interactive buttons to demonstrate the functionality and appearance of core UI components like Modals, Notices, Settings panels, and more.
does: "[  {    \"title\": \"Live API Inspection\",    \"content\": \"Uses require('obsidian') to access the core API module and lists all of its exported properties and classes, providing developers with a comprehensive overview of the available tools.\"  },  {    \"title\": \"Interactive Component Gallery\",    \"content\": \"Features a grid of buttons, where each button triggers a live demonstration of a native Obsidian UI component. This allows for direct interaction with:\",    \"children\": [      {        \"title\": \"Modals\",        \"content\": \"Modal, SuggestModal, FuzzySuggestModal\"      },      {        \"title\": \"Notifications\",        \"content\": \"Notice\"      },      {        \"title\": \"UI Elements\",        \"content\": \"Setting, Menu, ButtonComponent, ToggleComponent, DropdownComponent, SliderComponent, TextAreaComponent\"      },      {        \"title\": \"Renderers\",        \"content\": \"MarkdownRenderer\"      }    ]  },  {    \"title\": \"Contextual Information\",    \"content\": \"Displays key information about the current application context, such as the vault name and the availability of core managers like Workspace, FileManager, and MetadataCache.\"  },  {    \"title\": \"Immersive Full-Tab UI\",    \"content\": \"Designed to run in a full-pane mode that takes over the entire Obsidian view and hides the status bar, creating a focused, app-like environment for exploration and testing.\"  },  {    \"title\": \"Compact Mode\",    \"content\": \"Includes a compact mode for easy embedding within notes, with a button to enter the full experience.\"  }]"
cant: "[  {    \"title\": \"Modify the API\",    \"content\": \"It is a read-only explorer and demonstration tool. It cannot change or extend the native Obsidian API.\"  },  {    \"title\": \"Function Outside Obsidian\",    \"content\": \"Its entire purpose is to inspect the live require('obsidian') module and window.app object, which only exist within the Obsidian desktop application. It will not work in a browser or on mobile.\"  },  {    \"title\": \"Explore Plugin APIs\",    \"content\": \"It only explores the core Obsidian API. It cannot inspect the APIs of other installed community plugins.\"  },  {    \"title\": \"Provide In-Depth Documentation\",    \"content\": \"While it lists API properties and demonstrates UI components, it does not provide detailed documentation, usage examples (beyond the UI demos), or type definitions for them.\"  }]"
version.obsidian: 1.4.11
version: 2.1.8
---

### Tab: Obsidian Suite Kit

- **Description**: A developer utility and interactive learning tool that provides a live exploration of the native Obsidian API. It inspects the global obsidian module and app object, lists all available properties, and offers a gallery of interactive buttons to demonstrate the functionality and appearance of core UI components like Modals, Notices, Settings panels, and more.

- **Does**:
   
    - **Live API Inspection**: Uses require('obsidian') to access the core API module and lists all of its exported properties and classes, providing developers with a comprehensive overview of the available tools.    
    - **Interactive Component Gallery**: Features a grid of buttons, where each button triggers a live demonstration of a native Obsidian UI component. This allows for direct interaction with:
        - **Modals**: Modal, SuggestModal, FuzzySuggestModal
        - **Notifications**: Notice
        - **UI Elements**: Setting, Menu, ButtonComponent, ToggleComponent, DropdownComponent, SliderComponent, TextAreaComponent
        - **Renderers**: MarkdownRenderer
    - **Contextual Information**: Displays key information about the current application context, such as the vault name and the availability of core managers like Workspace, FileManager, and MetadataCache.
    - **Immersive Full-Tab UI**: Designed to run in a full-pane mode that takes over the entire Obsidian view and hides the status bar, creating a focused, app-like environment for exploration and testing.
    - **Compact Mode**: Includes a compact mode for easy embedding within notes, with a button to enter the full experience.

- **Can’t**:
   
    - **Modify the API**: It is a read-only explorer and demonstration tool. It cannot change or extend the native Obsidian API.    
    - **Function Outside Obsidian**: Its entire purpose is to inspect the live require('obsidian') module and window.app object, which only exist within the Obsidian desktop application. It will not work in a browser or on mobile.
    - **Explore Plugin APIs**: It only explores the core Obsidian API. It cannot inspect the APIs of other installed community plugins.
    - **Provide In-Depth Documentation**: While it lists API properties and demonstrates UI components, it does not provide detailed documentation, usage examples (beyond the UI demos), or type definitions for them.


-----

![obsidiansuitekit.clip.webm](_resources/videos/obsidiansuitekit.clip.webm)


![icons_pack.webp](_resources/images/obsidian_suite_kit.webp)

### COMPONENTS

###### [Obsidian Suite Kit Viewer](D.q.obsidiansuitekit.viewer.md)

###### [Obsidian Suite Kit Components](D.q.obsidiansuitekit.component.md)
