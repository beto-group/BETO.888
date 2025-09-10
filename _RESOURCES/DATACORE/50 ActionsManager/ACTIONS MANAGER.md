

### Tab: Actions Manager [PROTOTYPE] - Many of the current logic needs to be redesigned

- **Description**: A powerful, node-based visual automation builder designed to create, manage, and execute complex workflows directly within Obsidian. It provides an infinite canvas where users can connect various "action nodes"—such as running Datacore queries, manipulating data, interacting with files, and executing scripts—to build sophisticated automation sequences. The system is fully self-contained, with panels for node selection, a live run-log console, and an inspector for configuring each node's parameters.
    
- **Does**:
    - **Visual Flow Creation**:
        - Provides an infinite, pannable, and zoomable canvas for arranging and connecting action nodes.    
        - Nodes are connected via draggable "edges" to define the flow of data and execution.

    - **Rich Node Palette**:        
        - Includes a comprehensive library of nodes for various tasks: Datacore queries, file system operations (list/open files), data manipulation (filter, format, edit fields), control flow (if/else, for each, while loops), variable management, and custom scripts.
        - The palette is searchable and intelligently groups nodes by function (e.g., Core App, Data, Arrays, Logic).

    - **Live Execution & Debugging**:        
        - Flows can be executed from any starting node or from all "root" nodes simultaneously.
        - A real-time "Run Console" displays a detailed log of the execution, including the inputs and outputs of each node, status messages, and any errors.
        - Individual nodes can be run in isolation for quick testing and debugging.

    - **Data-Aware Connections**:        
        - Features smart connection logic; for example, connecting an array output (like a Datacore query) to a "For Each" loop automatically configures the loop to use that data as its input list.

    - **Flow Management**:        
        - Allows users to save, load, rename, and delete entire automation flows. Saved flows are stored as .json files within the vault's .datacore/flows directory.

    - **Advanced Data Handling**:        
        - Supports a powerful expression syntax (e.g., =vars.myVar + 2) in node parameters to dynamically use data from variables or the previous node's output.
        - Includes a dedicated "Viewer Node" that can display the live output of a flow or the contents of a static JSON file in various formats (summary, table, cards, raw JSON).

- **Can’t**:    
    - Interact directly with the text content of the active editor pane (e.g., it cannot select text or insert content at the cursor).
    - Be triggered by Obsidian events like file opening or modification; all flows must be manually executed from the canvas.
    - Visually represent the data passing between nodes in real-time on the connecting edges. Data inspection is done via the Run Console or Viewer Nodes.
    - Function without the Datacore plugin, as it relies heavily on its API for querying and file operations.


![alt text](/_RESOURCES/IMAGES/actions_manager.webp)






###### [Actions Manager Viewer](D.q.actionsmanager.viewer.md)

###### [Actions Manager Components](D.q.actionsmanager.component.md)
