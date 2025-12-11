---
author: beto.group
name.official: Workspace Manager
price: "0"
category:
  - utility
platform: desktop
tags:
  - window-management
  - workspace
  - layout
  - configuration
  - visual-editor
  - drag-and-drop
  - obsidian-internals
desc: An advanced visual editor that allows users to modify saved Obsidian workspace layouts via an interactive drag-and-drop block diagram.
status: experimental
complexity: advanced
id: 56
resources:
  - workspacemanager.clip.webm
  - workspace_manager.webp
longDesc: An advanced, visual editor that provides direct, real-time manipulation of Obsidian's core workspace layouts. It fetches the raw JSON configuration for any saved "Workspace" and renders it as an interactive block diagram. Users can then structurally modify this layout—by adding, deleting, splitting, and rearranging panes—and save the changes directly back to the workspace configuration file.
does: "[  {    \"title\": \"Live Workspace Loading\",    \"children\": [      {        \"content\": \"Automatically detects and lists all saved workspaces from the \\\"Workspaces\\\" core plugin.\"      },      {        \"content\": \"Loads the selected workspace's JSON data and renders a live, interactive representation of its structure (main area, left sidebar, right sidebar).\"      }    ]  },  {    \"title\": \"Visual Layout Manipulation\",    \"children\": [      {        \"title\": \"Drag-and-Drop Panes\",        \"content\": \"All panes, tabs, and split containers can be moved and re-nested by dragging and dropping them into other containers.\"      },      {        \"title\": \"Pane Splitting\",        \"content\": \"Any tab group can be split vertically or horizontally, creating a new split container with an empty pane, just like in Obsidian.\"      },      {        \"title\": \"Add/Delete Panes\",        \"content\": \"Users can add new empty panes to any tab group or delete existing panes and splits. Deleting a split with only two children will intelligently collapse the container and promote the remaining child.\"      }    ]  },  {    \"title\": \"File Integration\",    \"children\": [      {        \"content\": \"Includes a built-in, searchable file panel that lists all markdown files in the vault.\"      },      {        \"content\": \"Users can drag files from this panel and drop them onto any empty pane in the layout to assign that file to the pane.\"      }    ]  },  {    \"title\": \"Direct Configuration Saving\",    \"children\": [      {        \"content\": \"Features a \\\"Save Changes\\\" button that takes the modified visual layout, converts it back into the clean JSON format that Obsidian expects, and overwrites the original workspace file.\"      },      {        \"content\": \"Allows for creating new, empty workspaces and deleting existing ones directly from the UI.\"      }    ]  },  {    \"title\": \"Immersive Full-Tab UI\",    \"content\": \"Designed to run in a full-pane mode that takes over the entire Obsidian view, providing a dedicated, app-like environment for workspace editing.\"  }]"
cant: "[  {    \"title\": \"Render Live Previews of Panes\",    \"content\": \"The editor displays a structural representation of the workspace. Leaf panes are shown as simple blocks with the name of the file they contain. It does not render a live, interactive preview of the actual notes or components within those panes.\"  },  {    \"title\": \"Edit Pane-Specific State\",    \"content\": \"It can assign a file to a pane but cannot modify the internal state of that pane (e.g., a note's scroll position, a Kanban board's card positions).\"  },  {    \"title\": \"Automatically Sync with Live Workspace\",    \"content\": \"All edits are made to the saved workspace configuration. The changes are not reflected in the live Obsidian UI until the user manually loads the saved workspace through the command palette or status bar.\"  }]"
disclaimer: '[  {    "content": "This is a highly advanced \"meta\" tool that directly modifies core Obsidian configuration files. While powerful, it operates on the raw JSON data of your workspaces. Incorrectly saving a modified layout could potentially corrupt a workspace file. It is strongly recommended to back up your .obsidian/workspaces.json file before making significant changes. This component is a proof-of-concept for deep application-level integration and should be used with caution."  }]'
version.obsidian: 1.4.11
version: 1.0.7
---


### Tab: Workspace Manager

- **Description**: An advanced, visual editor that provides direct, real-time manipulation of Obsidian's core workspace layouts. It fetches the raw JSON configuration for any saved "Workspace" and renders it as an interactive block diagram. Users can then structurally modify this layout—by adding, deleting, splitting, and rearranging panes—and save the changes directly back to the workspace configuration file.

- **Does**:
   
    - **Live Workspace Loading**:    
        - Automatically detects and lists all saved workspaces from the "Workspaces" core plugin.
        - Loads the selected workspace's JSON data and renders a live, interactive representation of its structure (main area, left sidebar, right sidebar).
    - **Visual Layout Manipulation**:
        - **Drag-and-Drop Panes**: All panes, tabs, and split containers can be moved and re-nested by dragging and dropping them into other containers.
        - **Pane Splitting**: Any tab group can be split vertically or horizontally, creating a new split container with an empty pane, just like in Obsidian.
        - **Add/Delete Panes**: Users can add new empty panes to any tab group or delete existing panes and splits. Deleting a split with only two children will intelligently collapse the container and promote the remaining child.
    - **File Integration**:
        - Includes a built-in, searchable file panel that lists all markdown files in the vault.
        - Users can drag files from this panel and drop them onto any empty pane in the layout to assign that file to the pane.
    - **Direct Configuration Saving**:
        - Features a "Save Changes" button that takes the modified visual layout, converts it back into the clean JSON format that Obsidian expects, and **overwrites the original workspace file**.
        - Allows for creating new, empty workspaces and deleting existing ones directly from the UI.
    - **Immersive Full-Tab UI**: Designed to run in a full-pane mode that takes over the entire Obsidian view, providing a dedicated, app-like environment for workspace editing.

- **Can’t**:
   
    - **Render Live Previews of Panes**: The editor displays a structural representation of the workspace. Leaf panes are shown as simple blocks with the name of the file they contain. It **does not** render a live, interactive preview of the actual notes or components within those panes.    
    - **Edit Pane-Specific State**: It can assign a file to a pane but cannot modify the internal state of that pane (e.g., a note's scroll position, a Kanban board's card positions).
    - **Automatically Sync with Live Workspace**: All edits are made to the saved workspace configuration. The changes are **not reflected in the live Obsidian UI until the user manually loads the saved workspace** through the command palette or status bar.

- **Disclaimer**:
   
    - This is a highly advanced "meta" tool that directly modifies core Obsidian configuration files. While powerful, it operates on the raw JSON data of your workspaces. Incorrectly saving a modified layout could potentially corrupt a workspace file. **It is strongly recommended to back up your .obsidian/workspaces.json file before making significant changes.** This component is a proof-of-concept for deep application-level integration and should be used with caution.


----

![workspacemanager.clip.webm](_resources/videos/workspacemanager.clip.webm)


![workspace_manager.webp](_resources/images/workspace_manager.webp)


### COMPONENTS

###### [Workspace Manager Viewer](D.q.workspacemanager.viewer.md)

###### [Workspace Manager Component](D.q.workspacemanager.component.md)

