
### Tab: Canvas v1

- **Description**: An infinite, zoomable canvas that acts as a freeform visual workspace, allowing you to place and arrange not only basic shapes but also other live Datacore components.
    
- **Does**:
    
    - Offers an infinite, pannable, and zoomable canvas with a dynamic background grid.
    - Dynamically embeds other live Datacore components onto the canvas, turning them into movable and resizable windows.
    - Allows creating and arranging various objects: text boxes, circles, triangles, and other shapes.
    - Supports full object manipulation including multi-selection (click, marquee), moving, resizing, deleting, and clipboard actions (copy/cut/paste).
    - Features a property editor to customize object attributes like color, opacity, and text labels.
    - Saves and loads the entire canvas state (objects, position, zoom) to and from JSON files within the vault.
    - Includes a lock mode to prevent accidental changes and a dark/light theme toggle.
        
- **Can’t**:
    
    - Does not support connecting objects with lines or arrows.
    - Object layering is based on selection order; there is no manual "send to back" or "bring to front" control.
    - Embedding other components creates a dependency; if a source component is moved or broken, the canvas view for that object will also break.
    - Performance may degrade when rendering a large number of complex embedded components.


<iframe allowfullscreen src="https://www.youtube.com/embed/9GBnD77I9nI" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>



![canvas_1.webp](/_RESOURCES/IMAGES/canvas_1.webp)




### Components

###### [Canvas v1 Viewer](D.q.canvas.viewer.v1.md)

###### [Canvas v1 Component](D.q.canvas.component.v1.md)

