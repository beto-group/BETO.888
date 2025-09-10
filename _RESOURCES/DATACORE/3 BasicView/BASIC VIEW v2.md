

### Tab: Basic View v2

- **Description**: An advanced evolution of the "Basic View," this component serves as a reusable UI shell that transforms standard Datore components into immersive, full-pane applications. It provides a dual-mode system, allowing a component to exist either as a compact, inline element or expand to take over the entire view for a focused, app-like experience. It also includes a crucial utility for developers: a live code-reloading feature.
    
- **Does**:
    - **Dual-Mode Functionality**:
        - **Compact Mode**: Renders as a simple, inline container with a button to enter the full-tab view, integrating seamlessly into any Markdown note.    
        - **Full-Tab Mode**: Dynamically reparents itself in the DOM to fill the entire active Obsidian view pane, providing maximum screen real estate for complex UIs. Includes an intuitive exit button to return to compact mode.
    
    - **Developer Hot-Reload**:    
        - Features a dedicated reload icon that instantly rebuilds the component's view.
        - Allows developers to see code changes immediately without needing to close and reopen the note, creating a seamless and rapid development loop.

    - **Clean DOM Management**:        
        - Intelligently leaves a placeholder behind when entering full-tab mode, ensuring the document layout remains stable and undisturbed upon exit.

- **Can’t**:    
    - Provide any content or functionality on its own; it is a shell designed to wrap and enhance other components.
    - Style the child component placed within it; all content styling is inherited from the nested component.
    - Fetch, process, or manage any data. Its purpose is strictly presentational and structural.
    - Persist its view mode (compact/full-tab) across Obsidian sessions; it will always initialize in its default state.

----


![alt text](/_RESOURCES/IMAGES/basic_view_v2.webp)



### COMPONENTS

###### [Basic View Viewer](D.q.basicview.viewer.v2.md)

###### [Basic View Component](D.q.basicview.component.v2.md)

