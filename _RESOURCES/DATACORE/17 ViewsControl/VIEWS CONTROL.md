---
author: beto.group
name.official: Views Control
price: "0"
platform: desktop
tags:
  - window-management
  - babylonjs
  - 3d
  - multi-monitor
  - layout
  - sandbox
  - cdn
category:
  - visualization
desc: A sophisticated 3D sandbox demonstrating advanced display modes, including a true detachable OS-level window, native PiP, and floating panels.
status: stable
complexity: advanced
ext.dependencies:
  - babylon-js
id: 17
resources:
  - viewscontrol.clip.webm
  - views_control_1.webp
  - views_control_2.webp
  - views_control_3.webp
  - views_control_4.webp
  - views_control_5.webp
  - views_control_6.webp
  - views_control_7.webp
longDesc: A sophisticated component that renders an interactive 3D world using Babylon.js and pairs it with an advanced set of screen mode controls. This system can transform the 3D canvas from a simple inline element into various immersive views, including a true, separate OS-level window for a native multi-display experience.
does: "[  {    \"title\": \"Interactive 3D Sandbox\",    \"content\": \"Renders a live Babylon.js scene featuring a player character that can be moved with keyboard controls (WASD or arrow keys). The scene includes dynamic lighting, a ground plane, and an orbit-style camera.\"  },  {    \"title\": \"Advanced Multi-Window & Display Modes\",    \"content\": \"Provides a comprehensive suite of viewing options:\",    \"children\": [      {        \"title\": \"External Window Mode\",        \"content\": \"Its most powerful feature, which uses Electron's BrowserWindow API to launch the 3D scene in a completely separate, native OS-level window. This new window can be moved to another monitor and contains its own set of mode controls.\"      },      {        \"title\": \"Native PiP Mode\",        \"content\": \"Uses the browser's native Picture-in-Picture API to create a view-only floating window from the 3D canvas. This window can be moved outside the main Obsidian application and stays on top of other programs.\"      },      {        \"title\": \"Float Mode (formerly \\\"character\\\")\",        \"content\": \"Renders the component as a smaller, fully interactive floating panel that stays inside the main application window. The panel is draggable from its header and resizable from its corners.\"      },      {        \"title\": \"Standard Modes\",        \"content\": \"Includes conventional Browser Fullscreen, Full Tab (fills the Obsidian pane), and Windowed Overlay (fills the viewport).\"      }    ]  },  {    \"title\": \"Robust DOM & Resize Management\",    \"children\": [      {        \"content\": \"Intelligently manages and restores the component's original position in the DOM when exiting any special mode, ensuring a clean and stable layout.\"      },      {        \"content\": \"Includes a debounced ResizeObserver to reliably resize the Babylon.js canvas during window or container size changes, preventing common rendering errors.\"      }    ]  },  {    \"title\": \"Inter-Window Communication\",    \"content\": \"When in External Window mode, clicking a mode button within the new window sends a signal back to the main application, allowing the user to seamlessly switch to another mode upon closing the external window.\"  }]"
cant: '[  {    "title": "Share State with External Window",    "content": "The \"External Window\" runs in a separate process and re-initializes its own Babylon.js scene. It does not share live state (like player position) with the original component in Obsidian."  },  {    "title": "Provide Full Functionality in All Environments",    "children": [      {        "content": "The External Window mode is entirely dependent on running within an Electron environment (like the Obsidian desktop app) with the remote module enabled. It will not work in a standard web browser."      },      {        "content": "The Native PiP mode depends on modern browser support for the Picture-in-Picture API and Canvas Capture Streams."      }    ]  },  {    "title": "Allow Interaction in Native PiP",    "content": "The native Picture-in-Picture mode is strictly view-only; you cannot control the player or interact with the scene from within the PiP window."  }]'
version.obsidian: 1.4.11
version: 7.0.4
---


### Tab: ViewsControl

- **Description**: A sophisticated component that renders an interactive 3D world using Babylon.js and pairs it with an advanced set of screen mode controls. This system can transform the 3D canvas from a simple inline element into various immersive views, including a true, separate OS-level window for a native multi-display experience.
   
- **Does**:

    - **Interactive 3D Sandbox**: Renders a live Babylon.js scene featuring a player character that can be moved with keyboard controls (WASD or arrow keys). The scene includes dynamic lighting, a ground plane, and an orbit-style camera.  
    - **Advanced Multi-Window & Display Modes**: Provides a comprehensive suite of viewing options:
        - **External Window Mode**: Its most powerful feature, which uses Electron's BrowserWindow API to launch the 3D scene in a **completely separate, native OS-level window**. This new window can be moved to another monitor and contains its own set of mode controls.
        - **Native PiP Mode**: Uses the browser's native Picture-in-Picture API to create a **view-only** floating window from the 3D canvas. This window can be moved outside the main Obsidian application and stays on top of other programs.
        - **Float Mode (formerly "character")**: Renders the component as a smaller, **fully interactive** floating panel that stays inside the main application window. The panel is draggable from its header and resizable from its corners.
        - **Standard Modes**: Includes conventional Browser Fullscreen, Full Tab (fills the Obsidian pane), and Windowed Overlay (fills the viewport).
    - **Robust DOM & Resize Management**:
        - Intelligently manages and restores the component's original position in the DOM when exiting any special mode, ensuring a clean and stable layout.
        - Includes a debounced ResizeObserver to reliably resize the Babylon.js canvas during window or container size changes, preventing common rendering errors.
    - **Inter-Window Communication**: When in External Window mode, clicking a mode button within the new window sends a signal back to the main application, allowing the user to seamlessly switch to another mode upon closing the external window.

- **Can’t**:

    - **Share State with External Window**: The "External Window" runs in a separate process and re-initializes its own Babylon.js scene. It does not share live state (like player position) with the original component in Obsidian.       
    - **Provide Full Functionality in All Environments**:
        - The **External Window** mode is entirely dependent on running within an Electron environment (like the Obsidian desktop app) with the remote module enabled. It will not work in a standard web browser.
        - The **Native PiP** mode depends on modern browser support for the Picture-in-Picture API and Canvas Capture Streams.
    - **Allow Interaction in Native PiP**: The native Picture-in-Picture mode is strictly **view-only**; you cannot control the player or interact with the scene from within the PiP window.


----

![viewscontrol.clip.webm](_resources/videos/viewscontrol.clip.webm)


##### NORMAL
![views_control_1.webp](_resources/images/views_control_1.webp)

##### TAB
![views_control_5.webp](_resources/images/views_control_5.webp)


##### EXTERNAL
![views_control_7.webp](_resources/images/views_control_7.webp)


##### PIP
![views_control_4.webp](_resources/images/views_control_4.webp)

##### FLOAT
![views_control_6.webp](_resources/images/views_control_6.webp)


##### WINDOW
![views_control_3.webp](_resources/images/views_control_3.webp)


##### FULLSCREEN
![views_control_2.webp](_resources/images/views_control_2.webp)




### Components

###### [Views Control Viewer](D.q.viewscontrol.viewer.md)

###### [Views Control Component](_RESOURCES/DATACORE/17%20ViewsControl/D.q.viewscontrol.component.md)


