
### Tab: WindowResizer

- **Description**: A powerful meta-component that provides a set of controls to change the display mode of its container. It can transform a standard component into a floating window, a fullscreen element, or make it occupy an entire Obsidian tab.

- **Does**:

    - Adds a set of control buttons (e.g., "Full", "Win", "Tab", "PiP") to its container.
    - **Tab Mode**: Dynamically reparents the component's DOM element to fill the entire active workspace tab, creating an immersive, native-app feel.
    - **Window Mode**: Detaches the component from its original location and moves it to a fixed, full-viewport overlay with a high z-index.
    - **PiP Mode**: Renders the component as a smaller, floating Picture-in-Picture window that is draggable and resizable from its corners.
    - **Fullscreen Mode**: Uses the browser's native Fullscreen API to expand the component to fill the entire screen.
    - Intelligently manages and restores the component's original position in the DOM when exiting a special mode.

- **Can’t**:
   
    - The "Tab Mode" is highly dependent on Obsidian's specific DOM structure (.workspace-leaf-content) and may break if that structure changes in future updates.
    - The Picture-in-Picture (PiP) window does not use the native Browser PiP API, so it cannot be moved outside the main application window.
	- Its "New" (character) mode is for spawning a new independent window, not for changing the current component's mode.



Missing the TAB Mode Showcase
<iframe allowfullscreen src="https://www.youtube.com/embed/wbsvYZVOtbc" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>


##### NORMAL
![window_resizer_normal.webp](/_RESOURCES/IMAGES/window_resizer_normal.webp)

##### TAB
![window_resizer_tab.webp](/_RESOURCES/IMAGES/window_resizer_tab.webp)


##### PIP
![window_resizer_pip.webp](/_RESOURCES/IMAGES/window_resizer_pip.webp)


##### WINDOW
![window_resizer_window.webp](/_RESOURCES/IMAGES/window_resizer_window.webp)

##### FULLSCREEN
![window_resizer_fullscreen.webp](/_RESOURCES/IMAGES/window_resizer_fullscreen.webp)




### Components

###### [Window Resizer Viewer](D.q.windowresizer.viewer.md)

###### [Window Resizer Component](D.q.windowresizer.component.md)


