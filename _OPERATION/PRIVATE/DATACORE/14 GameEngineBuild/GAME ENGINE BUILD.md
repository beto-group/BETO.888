
### Tab: Game Engine Build

- **Description**: A from-scratch, first-person 3D game engine built with raw WebGL. It provides a testbed for custom rendering, physics, and object manipulation, including the ability to project live Datacore components onto 3D surfaces.
   
- **Does**:
   
    - Implements a first-person character controller with standard WASD movement, mouselook, and jumping physics (gravity).
    - Features pointer lock for immersive, game-like controls.
    - Allows the user to spawn primitive 3D shapes (cubes, pyramids, planes) into the world.
    - Supports a complex object manipulation mode:
        - **Translate:** Move objects in the world relative to the camera.
        - **Rotate:** Rotate objects around their Y-axis.
        - **Scale:** Scale objects non-uniformly along their X, Y, and Z axes.
    - Can dynamically load and render other Datacore components onto the surface of a "pane" object, effectively creating a live 3D display.

- **Can’t**:
   
    - The engine logic is self-contained and does not use established libraries like Babylon.js or Three.js, making it less optimized.
    - Object state is not saved; all added and modified objects are lost when the view is reloaded.
    - Lacks advanced game features like collision detection, complex lighting/shadows, or a formal level structure.


<iframe allowfullscreen src="https://www.youtube.com/embed/w3mjNEaTR0k" width="100%" height="555" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ></iframe>


![[game_engine_build.webp]]




### Components

###### [[D.q.gameenginebuild.viewer|Game Engine Build Viewer]]

###### [[D.q.gameenginebuild.component|Game Engine Build Component]]

