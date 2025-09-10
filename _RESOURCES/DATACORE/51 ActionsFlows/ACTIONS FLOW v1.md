

### Tab: Actions Flow v1

- **Description**: Excalidraw Batch ExporterA high-performance, developer-focused utility for batch-converting Excalidraw (.md) files into production-ready SVG assets. It functions as a "live parallel dependency solver," intelligently prioritizing tasks to first create any missing SVGs before queuing up and processing updates for all other files. With configurable concurrency and a real-time log stream, it's designed to efficiently manage and synchronize large Excalidraw asset libraries in a single, powerful operation.
    
- **Does**:
    - **Live Dependency Solving**:
        - Scans a predefined folder (_RESOURCES/ASSETS/888/ASSETS_nosvg_.A/) for all Excalidraw files.    
        - **High-Priority First**: Initially queues only the .md files that are missing a corresponding .svg file, ensuring the most critical assets are created first.
        - **Automatic Update Queueing**: As soon as a new SVG is successfully created, it automatically queues up all other existing .md files in the folder for a low-priority "update" check, ensuring the entire library is eventually synchronized.

    - **High-Concurrency Processing**:        
        - Executes multiple file conversions in parallel, with a user-configurable concurrency limit (from 1 to 20 simultaneous operations) to maximize speed without overloading the system.

    - **Robust Excalidraw Parsing**:        
        - Correctly handles both modern, compressed-json (LZ-String) Excalidraw data blocks and older, plaintext json or excalidraw blocks for backward compatibility.

    - **Custom Font Embedding**:        
        - Loads a specified custom font from the vault (Futura-CondensedLight.otf) and ensures it is properly embedded during the SVG export process, maintaining consistent typography.

    - **Developer-Focused Interface**:        
        - Provides controls to start, stop, and configure the batch process.
        - Displays a live-updating log of all operations, including successes, warnings (e.g., skipping empty files), detailed errors, and a final summary of the entire run.

- **Can’t**:    
	- Discovered this approach is horrendous at massive exporting . Took 2 hours to finish hahahahahaa crashes anyway lol . its okay brain had to work for it
    - Be configured to use a different source folder from the UI; the path is hardcoded for a specific vault structure.
    - Function without an active internet connection on its first run to download the required Excalidraw and LZ-String libraries.
    - Visually edit or preview the Excalidraw files; it is a non-interactive, batch-processing tool.
    - Selectively process files; it is designed to operate on the entire contents of the specified folder.





![alt text](/_RESOURCES/IMAGES/actions_flow_v1.webp)






###### [Obsidian Actions Flow Viewer](D.q.actionsflows.viewer.v1.md)

###### [Obsidian Actions Flow Components](D.q.actionsflows.component.v1.md)
