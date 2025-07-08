
### Tab: Canvas v2

- **Description**: An advanced, programmable workspace that transforms the infinite canvas into a dynamic dashboard composer. It enhances v1 by allowing users to pass custom properties to embedded components, making it a powerful tool for creating and testing complex visual layouts.
    
- **Does**:
    
    - Includes all features from Canvas v1 (infinite pan/zoom, object creation, save/load).
    - **Passes custom props:** Lets you define and pass custom key-value properties to any embedded Datacore component directly from the edit panel.
    - **Enables component interaction:** The improved "lock" mode freezes the canvas layout but allows full, seamless interaction with the controls inside the embedded components (e.g., clicking buttons, scrolling).
    - **Adds quick reload:** Provides a reload button on component boxes to manually refresh and re-render the embedded component on demand.
    - Can automatically load a specific saved canvas state on startup, defined by a property.
    - Intelligently recenters and re-zooms the view to fit the content when switching between windowed and fullscreen modes.
        
- **Can’t**:
    
    - Props passed via the UI are treated as strings; it does not support passing complex objects, arrays, or functions.
    - The dual-mode interaction (unlock to edit layout, lock to use components) can require an extra step from the user.
    - Still does not support visual connectors (lines/arrows) between boxes.


![[canvas_2.webp]]



### Components

###### [[D.q.canvas.viewer.v2|Canvas v2 Viewer]]

###### [[D.q.canvas.component.v2|Canvas v2 Component]]