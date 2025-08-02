
### Tab: ViewsControl

- **Description**: A powerful meta-component that provides a set of controls to change the display mode of its container. It can transform a standard component into an interactive floating panel, a native Picture-in-Picture window, a fullscreen element, or make it occupy an entire Obsidian tab.
    
- **Does**:
    
    - Adds a set of control buttons (e.g., "Full", "Win", "Tab", "PiP", "Float") to its container.
    - **Fullscreen Mode**: Uses the browser's native Fullscreen API to expand the component to fill the entire screen.        
    - **Window Mode**: Detaches the component from its original location and moves it to a fixed, full-viewport overlay with a high z-index.
    - **Tab Mode**: Dynamically reparents the component's DOM element to fill the entire active workspace tab, creating an immersive, native-app feel.
    - **Native PiP Mode**: Uses the browser's native Picture-in-Picture API to create a **view-only** floating window from the component's canvas. This window **can be moved outside the main application** and stays on top of other applications.
    - **Float Mode**: Renders the component as a smaller, **fully interactive** floating panel that stays inside the main application window. This panel is draggable from its header and resizable from its corners.
    - Intelligently manages and restores the component's original position in the DOM when exiting any special mode.

- **Can’t**:    
    - The "Tab Mode" is highly dependent on Obsidian's specific DOM structure (.workspace-leaf-content) and may break if that structure changes in future updates.
    - The **Native PiP mode is view-only**; you cannot interact with the component's content (e.g., keyboard or mouse controls) inside the PiP window.
    - The **Float mode is confined to the main application window** and cannot be moved outside of it, unlike the native PiP window.
    - Native PiP functionality relies on modern browser support for the Picture-in-Picture and Canvas Capture Stream APIs and may not work in all browsers/ mobile wip



<iframe allowfullscreen src="https://www.youtube.com/embed/vUMrIv1M3RE" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>


##### NORMAL
![views_control_normal.webp](/_RESOURCES/IMAGES/views_control_normal.webp)

##### TAB
![views_control_tab.webp](/_RESOURCES/IMAGES/views_control_tab.webp)


##### PIP
![views_control_pip.webp](/_RESOURCES/IMAGES/views_control_pip.webp)

##### FLOAT
![views_control_float.webp](/_RESOURCES/IMAGES/views_control_float.webp)


##### WINDOW
![views_control_window.webp](/_RESOURCES/IMAGES/views_control_window.webp)

##### FULLSCREEN
![views_control_full.webp](/_RESOURCES/IMAGES/views_control_full.webp)




### Components

###### [Views Control Viewer](D.q.viewscontrol.viewer.md)

###### [Views Control Component](D.q.viewscontrol.component.md)


