
### Tab: Basic View v3

- **Description**: An evolution of the Basic View shell, this component provides a robust framework for creating full-pane, app-like experiences within a standard Markdown note. It introduces a critical feature for developers: a one-click, in-place code reloading mechanism, which rebuilds the component's view without requiring the note to be closed. This drastically speeds up the development and debugging cycle.
    
- **Does**:
    - **Dual-Mode Functionality**:
        - **Compact Mode**: Renders as a minimal, inline placeholder with buttons to expand the view or locate the component's codeblock in the vault.
        - **Full-Tab Mode**: Using advanced DOM manipulation, the component reparents itself to fill the entire active Obsidian view pane, creating an immersive, distraction-free environment. It includes a clean exit button to return to compact mode.

    - **Developer Hot-Reload**:
        - Features a dedicated reload icon that directly calls Obsidian's activeLeaf.rebuildView() API.
        - This forces the Datacore script to be re-read from the file and re-executed, allowing developers to see code changes instantly without leaving the note.

    - **Clean DOM Management**:
        - When entering full-tab mode, it intelligently leaves an invisible placeholder behind. Upon exiting, it seamlessly returns to its original position, ensuring the document's layout is never disturbed.

    - **Utility Functions**:
        - Includes a "Find Codeblock" utility that copies the current note's file path to the clipboard, making it easy to navigate back to the source code.

- **Can’t**:
    - Provide any content or functionality on its own; it is a shell designed to wrap and enhance other components.
    - Style the child component placed within it; all content styling is inherited from the nested component.
    - Fetch, process, or manage any data. Its purpose is strictly presentational and structural.
    - Persist its view mode (compact/full-tab) across Obsidian sessions; it will always initialize in its default state.



![alt text](/_RESOURCES/IMAGES/basic_view_v3.webp)



### COMPONENTS

###### [Basic View Viewer v3](D.q.basicview.viewer.v3.md)

###### [Basic View Component v3](D.q.basicview.component.v3.md)
