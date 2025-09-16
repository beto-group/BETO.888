

### Tab: Views Inceptions v2

- **Description**: A powerful demonstration of a "host" environment that can dynamically load, spawn, and display any other component from its source file. It showcases a core architectural pattern for building multi-view applications or component viewers, where the content is determined at runtime by the user.
    
- **Does**:
    - **In-Place Component Spawner**:
        - Features an input form allowing a user to dynamically load and render any component by providing its file path.
        - Swaps its own content area to display the spawned component, effectively acting as a runtime host.
        - Includes a "Close" button on the spawned component to easily unload it and return to the host's default view.
    - **Robust Dynamic Loader**:
        - Utilizes a flexible DynamicComponentLoader that follows a clear convention: it requires code from a header named ViewComponent.
        - Intelligently inspects the loaded module and renders the first component function it finds exported, making it compatible with a wide range of components without hardcoding function names.
        - Provides clear loading and error states to the user if a component fails to load.
 
- **Can’t**:
    - Load components from headers with names other than ViewComponent; this is a fixed convention in the loader.        
    - Provide a file picker or search functionality to find components; the user must know the exact file path.
    - Pass props or data between the Views Inceptions host and the dynamically spawned component.
    - Persist the state of the spawned component across reloads.
    - Lacks robust error handling for invalid component paths.
    - Requires manual input for custom PiP file, header, and function.



![alt text](/_RESOURCES/IMAGES/views_inceptions_v2.webp)



### Components

###### [Views Inceptions Viewer v2](D.q.viewsinceptions.viewer.v2.md)

###### [Views Inceptions Component v2](D.q.viewsinceptions.component.v2.md)