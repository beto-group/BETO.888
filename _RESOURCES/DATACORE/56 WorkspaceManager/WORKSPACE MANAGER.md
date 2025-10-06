

### Tab : Workspace Manager

- **Description**: A highly interactive, visual editor that provides a complete graphical user interface for managing the layouts of Obsidian's core "Workspaces" plugin. It transforms the abstract JSON structure of a workspace into a tangible, drag-and-drop canvas, allowing users to build, modify, and organize complex window layouts with intuitive controls.
    
- **Does**:
    - **Visual Workspace Builder**:
        - Renders a live, visual representation of any saved workspace, including its main, left, and right sidebar areas.
        - Supports full drag-and-drop functionality for re-arranging panes (leaf), tab groups (tabs), and split containers (split).

    - **Full Workspace Lifecycle Management**:        
        - Provides a dropdown to load any existing workspace from the "Workspaces" plugin.
        - Features controls to create new workspaces from a template, delete existing ones, and save any changes directly back to the plugin's data.

    - **On-the-Fly Structure Editing**:        
        - Allows users to add new empty panes to any tab group or split container.
        - Enables splitting of any tab group either horizontally or vertically to create complex nested layouts.
        - Provides simple one-click deletion for any pane, tab group, or split container.

    - **Integrated File Panel & Content Assignment**:        
        - Includes a built-in, searchable file panel to quickly find any note in the vault.
        - Uses a high-performance "virtualized list" to ensure the file panel remains fast and responsive, even with tens of thousands of notes.
        - Allows users to drag files from the panel and drop them directly onto the layout to assign them to a pane.

    - **Developer Insight**:        
        - A "Debug View" toggle reveals the raw JSON data of the layout, which updates in real-time as you make visual changes, providing a clear link between the UI and the underlying data structure.

- **Can’t**:    
    - **Modify the Live Workspace**: The editor manipulates the saved configuration of a workspace. It cannot alter the currently active layout in Obsidian. To see changes, you must save the workspace and then load it using Obsidian's native commands.
    - **Function Without the Core Plugin**: This component is entirely dependent on the "Workspaces" core Obsidian plugin. It will fail to load or operate if that plugin is disabled.
    - **Manage Internal Pane State**: It can define which file goes into a pane (leaf), but it cannot control the state within that pane, such as scroll position, cursor location, or whether it's in source or live preview mode.
    - **Browse a File Tree**: The integrated file panel is for searching only; it does not provide a folder-tree view for browsing the vault's file system.


![workspace_manager.webp](/_RESOURCES/IMAGES/workspace_manager.webp)




### COMPONENTS

###### [Workspace Manager Viewer](D.q.workspacemanager.viewer.md)

###### [Workspace Manager Component](D.q.workspacemanager.component.md)

