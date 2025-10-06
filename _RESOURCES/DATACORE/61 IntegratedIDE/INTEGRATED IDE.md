
### Tab : Integrated IDE

- **Description**: A full-featured, self-contained Integrated Development Environment (IDE) built to run entirely within a Datacore view. It transforms a standard page into a powerful development hub, combining a file explorer, an advanced code editor, a live component previewer, an integrated terminal, and a complete Git source control panel. It is designed for rapid development and testing of Datacore components and other vault-based projects, providing a seamless workflow that eliminates the need to switch between Obsidian and an external editor.

- **Compatibility Note**: This component relies on Node.js modules (child_process, path) provided by the Datacore environment. The initial setup requires an active internet connection to download the Monaco editor and necessary TypeScript definitions. Subsequent loads are offline-capable.
    
- **Does**:
    - **All-in-One Development Hub**:
        - Features a multi-pane, resizable layout that includes a file explorer, code editor, live preview pane, and an optional terminal.
        - Integrates the GitSuite component directly into a side panel, providing a complete source control solution alongside the file tree.

    - **Advanced Monaco-Powered Editor**:        
        - Embeds the same editor engine that powers VS Code (Monaco), offering syntax highlighting, autocompletion, and rich language support.
        - Automatically downloads and configures Obsidian and React API type definitions on first run, enabling intelligent code suggestions.
        - Includes a built-in linter that provides warnings and best-practice suggestions directly in the editor.

    - **Real-Time Component Preview**:        
        - When a Datacore component file (.component.md) is saved, the IDE automatically hot-reloads its preview in a dedicated pane.
        - Uses a crash-proof rendering boundary, which means if the component has an error, it will display the error message without crashing the entire IDE.

    - **Fully-Functional File Management**:        
        - Provides a complete file explorer with full create, read, update, and delete (CRUD) capabilities for both files and folders.
        - Supports drag-and-drop for moving items, right-click context menus for renaming and deleting, and an intuitive interface for adding new files/folders.

    - **Integrated Terminal & Source Control**:        
        - Includes a multi-tabbed terminal that runs shell commands directly within the context of the specified project folder.
        - Offers a dedicated Git panel for managing changes, committing, pushing, pulling, and handling branches without leaving Obsidian.

    - **Zero-Configuration Setup**:        
        - On its first run, it transparently handles the entire setup process, including creating necessary host files and caching API definitions.

- **Can’t**:    
    - **Provide a Step-Through Debugger**: While it offers code linting and error reporting, it does not include a step-through debugger for analyzing code execution line-by-line.
    - **Be Extended with Plugins**: The IDE has a fixed feature set. It cannot be extended with third-party extensions or plugins like a standalone application such as VS Code.
    - **Perform Project-Wide Refactoring**: It lacks advanced IDE features like global search-and-replace across all files in a project or automated refactoring tools.
    - **Guarantee Native Performance**: As it runs within the Obsidian and Datacore environment, it may have a higher performance overhead compared to a native, system-level IDE, especially on very large projects.
    - **Operate in an Offline Environment (Initial Setup)**: The first-time launch requires an internet connection to download its dependencies. It cannot complete its initial setup if run in a fully offline environment.


![alt text](/_RESOURCES/IMAGES/integrated_ide.webp)



### COMPONENTS

###### [Integrated IDE Viewer](D.q.integratedide.viewer.md)

###### [Integrated IDE Component](D.q.integratedide.component.md)
