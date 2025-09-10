

### Tab: Random File Controls v2


- **Description**: Dev Toolkit. A multi-purpose developer toolkit designed to automate and simplify common bulk file operations within the vault. It combines several powerful utilities into a single interface, allowing for single-folder compilation, complex multi-group compilations from subfolders, compilation based on a structured JSON list, and batch deletion of specific file types. The component features a dual-view interface with a compact control panel and an immersive full-tab editor for reviewing results.
    
- **Does**:
    
    - **Single Folder Compilation**:
        - Select any folder in the vault and compile all of its text-based files into a single, new Markdown document.
        - The compiled output is neatly organized with ## File Path headers for each included file.
    - **Multi-Compile Subfolder Grouping**:        
        - Select a base folder and then use an interactive modal to assign its various subfolders to different numbered groups.
        - Compiles all files from all subfolders assigned to a given group number into a single output file (e.g., compiled-group-1.md).
        - Offers a "Compile Separately" option to create one compiled file for each selected subfolder, instead of grouping them.
    - **Compile from JSON List**:        
        - Accepts a structured JSON input where keys are category names and values are arrays of file basenames.
        - Searches the vault (or a specified base folder) for each filename and compiles them into separate output files for each category.
    - **Batch File Operations**:        
        - **List Subfolders**: Quickly generate and copy a plaintext list of all subfolder names within a selected directory.
        - **Batch Delete**: Select a folder and safely delete all files of a specific type (e.g., all .svg files) within it, after a confirmation prompt. Includes a detailed log and a retry mechanism for failed deletions.
    - **Dual View Interface**:    
        - **Compact View**: A space-efficient control panel providing quick access to all compilation and batch operation tools.
        - **Full-Tab View**: An immersive, full-pane editor that displays the most recently created compiled file and provides access to all toolkit functions.

- **Can’t**:    
    - Perform compilations based on Datacore queries or tags; it operates strictly on file and folder paths.
    - Automatically update compiled files when source files change. All operations are manually triggered.
    - Handle binary file types for compilation; it will skip any file it cannot read as plain text.
    - The Compile from JSON feature performs a fuzzy search; if multiple files share a similar basename, it may not pick the intended one without a more specific path.


![alt text](/_RESOURCES/IMAGES/random_file_controls_v2.webp)




###### [Random File Controls Viewer](D.q.randomfilecontrols.viewer.v2.md)

###### [Random File Controls Components](D.q.randomfilecontrols.component.v2.md)

