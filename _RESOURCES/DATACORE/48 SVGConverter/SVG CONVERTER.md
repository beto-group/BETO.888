


### Tab: SVG Converter

- **Description**: A specialized, automated pipeline that synchronizes a directory of Excalidraw (.md) files into high-quality, web-ready SVG assets. Presented as a "Matrix Attunement," this component provides a guided, one-time setup process to ensure all creative assets are properly rendered and available. It's designed to be run once to initialize an asset library or periodically to batch-process new additions, providing a clear, engaging interface with a detailed log stream for power users.
    
- **Does**:
    
    - **Guided Synchronization**:
        - Presents a clear welcome screen prompting the user to begin the "attunement" process.
        - Displays a dynamic progress bar and enigmatic status messages (e.g., "Harmonizing quantum states...") to create an immersive experience during the operation.

    - **Automated Excalidraw-to-SVG Conversion**:
        - Scans a predefined folder (_RESOURCES/ASSETS/888/ASSETS_.A/) for .md files that do not have a corresponding .svg file.
        - Intelligently parses Excalidraw data, whether it's standard JSON or compressed with LZ-String.
        - Uses the official Excalidraw library to render each drawing into a high-quality SVG, embedding the scene data for future editing.

    - **High-Concurrency Processing**:
        - Processes up to 64 files in parallel to dramatically speed up the initial synchronization of large asset libraries.

    - **Custom Font Embedding** {WIP}:
        - Loads a custom font (Futura-CondensedLight.otf) from the vault and ensures it is properly embedded in the generated SVGs, maintaining typographic consistency.

    - **Detailed Log Stream**:

        - Includes an optional, collapsible debug console that provides a real-time log of the entire process, including successes, warnings (e.g., skipping empty files), and detailed error messages for failed conversions.

- **Can’t**:
    
    - Select a source folder from the UI; the target directory is hardcoded for a specific vault structure.
    - Convert files that are not valid Excalidraw markdown notes containing a JSON or compressed-json code block.
    - Function without an active internet connection on the first run to download the required Excalidraw and LZ-String libraries from a CDN.
    - Update existing SVG files; it only creates new ones for .md files that are missing their SVG counterpart.
        




![alt text](/_RESOURCES/IMAGES/svg_converter.webp)







###### [SVG Converter Viewer](D.q.svgconverter.viewer.md)

###### [SVG Converter Components](D.q.svgconverter.component.md)
