
### Tab: Random File Controls



- **Description**: Document Compiler. An advanced utility designed for developers and researchers to programmatically compile, split, and supplement collections of documents from within the vault. It provides a granular control panel to select a base folder, filter by subfolders and file types, and then aggregate the contents into one or more new Markdown files. It also features a robust "Supplement Manager" for injecting boilerplate content, copying related assets, and creating new supplementary files on the fly.
    
- **Does**:
    - **Powerful File Selection**:
        - Allows users to select a **base folder** to serve as the source for compilation.
        - Provides a **subfolder filter** to precisely include or exclude specific directories within the base folder.
        - Includes an **extension filter** to target specific file types (e.g., .md, .txt, .canvas).

    - **Flexible Compilation Modes**:
        - **Flat Mode**: Combines all filtered files into a single, continuous document, with each original file's content placed under a ## File Path heading.
        - **Group by Folder Mode**: Creates a separate compiled file for each subfolder within the selection, preserving the original directory structure. Supports recursive grouping for nested folders.

    - **Content Splitting**:
        - Can split the final compiled output(s) into a user-defined number of parts, creating evenly-sized chunks based on Markdown's horizontal rule (---) as a section separator.

    - **Advanced Supplement Manager**:
        - **Inject Content**: Prepend or append the contents of one or more "supplementary" files to every compiled output. Perfect for adding introductions, conclusions, or boilerplate text.
        - **Copy Assets**: Copy supplementary files (like images or attachments) alongside the compiled documents. A "recursive" option copies them into every generated subfolder.
        - **Create On-the-Fly**: Includes a "Create New" feature to quickly generate a new supplementary Markdown file in a specified folder and add it to the manager.

    - **Dual View Interface**:
        - **Compact View**: A space-efficient control panel that provides access to all settings and a mini-preview of the selected file.
        - **Full-Tab View**: An immersive, full-pane editor and control center, ideal for reviewing large compiled documents and managing complex settings. Also includes a built-in file viewer and editor.

- **Can’t**:
    - Resolve merge conflicts or intelligently merge structured data; it performs a straightforward text concatenation.
    - Compile file types that are not plain text (e.g., it cannot embed a .pdf or .png directly, but it can copy them).
    - Handle exceptionally large vaults (e.g., 50,000+ files) without potential performance degradation during the initial file collection phase.
    - Automatically update compiled files; the compilation is a manual process that must be triggered by the user.


![alt text](/_RESOURCES/IMAGES/random_file_controls_v1.webp)

---

###### [Random File Controls Viewer v1](D.q.randomfilecontrols.viewer.v1.md)

###### [Random File Controls Components v1](D.q.randomfilecontrols.component.v1.md)

