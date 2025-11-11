

### Tab: Loading Logo

- **Description**: A smart and resilient component designed to display a specific SVG logo. Its primary feature is the use of a fuzzy search to locate the image file, making it robust against file moves. This version includes an intelligent session-level cache for its script dependencies, preventing redundant downloads within a single Obsidian session.

- **Does**:
   
    - **Fuzzy File Search**: Instead of requiring a hardcoded path, it only needs the filename (BETO_Logo_W_Loading.svg). It then uses the Fuse.js library to perform a fuzzy search across the entire vault to find the best matching file.    
    - **Efficient Session-Level Script Caching**:
        - Intelligently checks if Fuse.js has already been loaded **in the current Obsidian session** by using a global window object as a cache.
        - If the script is not in the session cache, it downloads it from a CDN.
        - This prevents re-downloading the script if the component is used multiple times in different notes without restarting Obsidian.
    - **Graceful Fade-In Animation**: The component initially renders an invisible <img> tag. Once the browser has fully downloaded the image, it smoothly fades it into view, preventing a jarring "pop-in."
    - **Error Handling**: If the fuzzy search fails to find the specified file, it will display a clear error message.

- **Can’t**:
   
    - **Render Other Images**: The filename is hardcoded. It is not a general-purpose, reusable image renderer and cannot be configured to display different images via props.    
    - **Function Offline on First Run Per Session**: It requires an internet connection to download the Fuse.js library **once every time you start a new Obsidian session**. The script cache is stored in memory and is cleared when the application is closed. It does not use a persistent, file-based cache.
    - **Be Customized via Props**: The size and other styling properties of the logo are hardcoded and cannot be configured.


-----

![loading_logo.webp](_resources/images/loading_logo.webp)




### Components

###### [Loading Logo Viewer](D.q.loadinglogo.viewer.md)

###### [Loading Logo Component](D.q.loadinglogo.component.md)

