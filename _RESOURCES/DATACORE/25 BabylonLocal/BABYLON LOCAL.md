
### Tab: BabylonLocal

- **Description**: A 3D model viewer that uses the Babylon.js engine to load and display a .glb model file from a local path within the vault.

- **Does**:
  
    - Dynamically loads the Babylon.js 3D engine and its required GLB loader from a CDN.
    - Uses dc.app.vault.adapter.getResourcePath to correctly access and load a local .glb file from the vault's resources.
    - Renders the 3D model in a scene with a default lighting environment for realistic reflections.
    - Features an auto-rotating camera that pans around the model.
    - Includes a refresh button to completely tear down and re-initialize the 3D scene.

- **Can’t**:
   
    - Load any model other than the hardcoded b26.card.888.glb file.
    - Manipulate or interact with the model beyond camera controls (e.g., no animations, no part selection).
    - Function offline, as it depends on CDN-hosted libraries for the Babylon.js engine.
    - Dynamically change the lighting or environment without editing the code.


![babylon_local.webp](/_RESOURCES/IMAGES/babylon_local.webp)





### Components

###### [Babylon Local Viewer](D.q.babylonlocal.viewer.md)

###### [Babylon Local Component](D.q.babylonlocal.component.md)
