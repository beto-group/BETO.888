
### Tab: MapGlobe

- **Description**: A component that renders an interactive, auto-rotating 3D earth globe using the globe.gl library, with textures loaded from external URLs.

- **Does**:
   
    - Renders an interactive 3D globe that can be panned and zoomed with the mouse.
    - Dynamically loads its required library (globe.gl) and image textures from external CDNs.
    - The globe is configured to auto-rotate by default, creating a "live" feel.
    - Displays a "Loading..." message while its assets are being fetched from the web.

- **Can’t**:
    
    - Display any custom data from the vault (like location markers or flight paths). Its data sources are hardcoded.
    - Use local files for its globe textures; it always fetches them from the web.
    - Be customized (e.g., change textures, size, or rotation speed) without editing the component's code.
    - Function offline, as it requires an internet connection to download the globe.gl library and its textures.


![map_globe.webp](/_RESOURCES/IMAGES/map_globe.webp)



### Components

###### [Map Globe Viewer](D.q.mapglobe.viewer.md)

###### [Map Globe Component](D.q.mapglobe.component.md)
