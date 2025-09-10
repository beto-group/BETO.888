

### Tab: Assets Library

- **Description**: An all-in-one, high-performance application for managing, browsing, and interacting with a large library of visual assets (primarily SVGs from Excalidraw) directly within Obsidian. It features an automated pipeline that converts Excalidraw .md files into .svg assets, and presents them in a fluid, interactive canvas-based UI with both grid and graph-based layouts. Designed for performance and scale, it's the definitive tool for users with extensive visual libraries.
    
- **Does**:
    - **Automated Excalidraw Pipeline**:
        - Scans a predefined folder for Excalidraw drawings (.md files) and intelligently converts them into high-quality .svg assets.
        - Automatically updates an SVG if its corresponding .md file is modified, ensuring the library is always synchronized.

    - **High-Performance Canvas Rendering**:        
        - Renders the entire asset collection on a single HTML canvas for an exceptionally smooth experience, even with thousands of images.
        - Utilizes a Web Worker to rasterize SVGs in the background, preventing UI freezes and ensuring fluid panning, zooming, and animations.

    - **Dual Interactive Views**:        
        - **Grid View**: A traditional, orderly grid of assets that is fully pannable and zoomable with intuitive mouse and touch controls. Features a "push-away" animation on hover.
        - **Graph View**: A dynamic, physics-based simulation where assets are "nodes" that float, repel each other, and cluster organically, offering a unique way to explore and discover connections.

    - **Advanced User Interface**:        
        - **Floating Control Panel**: A draggable UI with controls for searching, sorting (by name, date, size), switching views, and toggling selection mode.
        - **Mass Metadata Editing**: Allows users to select multiple assets and apply or update frontmatter properties (like A888a or data-aaa-tags) to their corresponding .md files in a single bulk action.
        - **Detailed Asset Viewer**: Clicking an asset opens a modal with a zoomable image viewer, metadata display (including tags), and quick-action buttons (e.g., Copy Markdown Link, Hide Image).

- **Can’t**:    
    - Manage assets outside of the predefined folder (_RESOURCES/ASSETS/888/ASSETS_.A).
    - Edit the Excalidraw files directly; it is a viewer and metadata manager, not a drawing editor.
    - Function without an active internet connection on the first run to download the required Excalidraw libraries.
    - Display assets that are not in .svg format.

-----


![alt text](/_RESOURCES/IMAGES/assets_library_1.webp)



![alt text](/_RESOURCES/IMAGES/assets_library_2.webp)




### COMPONENTS
###### [Assets Library Viewer](D.q.assetslibrary.viewer.md)

###### [Assets Library Components](D.q.assetslibrary.component.md)
