
### Tab: Datacore Playground

- **Description**: An interactive, browser-based playground for rapidly prototyping and testing Datacore components, running entirely within an Obsidian tab. Inspired by tools like the Babylon Playground, it provides a seamless workflow with a live-updating code editor and preview pane, designed for experimentation and learning.
- **Does**:
    - **Powerful Code Editor**:
        - Powered by Monaco (the engine behind VS Code), offering a rich editing experience with syntax highlighting, word wrap, and a minimap.
        - Supports multi-tab editing, allowing you to manage and switch between multiple components within a single source file.
        - Includes full tab management: create new boilerplate components, rename existing ones, and delete them directly from the UI.
    - **Real-Time Preview**:
        - Features a resizable split-pane layout to see your code's output instantly as you work.
        - Automatically updates the preview on save (Ctrl+S), compiling your JSX and rendering the component for an immediate feedback loop.
        - Provides clear loading and error states, making experimentation and debugging straightforward.
    - **Component Management**:
        - **Load by Path**: A dedicated input bar to load any component file by its exact vault path.
        - **Bookmark Bar**: Automatically generates a quick-access bookmark bar from all .component.md files in the _RESOURCES/DATACORE directory.
        - **New Component Creation**: A "New" button that prompts for a name and generates a new, correctly formatted component file with boilerplate code, letting you start new experiments in seconds.
    - **Immersive Workflow**:
        - **Dual Mode Operation**: Starts in a compact "launcher" mode and can be expanded into an immersive "Full Playground" mode that takes over the entire tab for a focused session.
        - **State Persistence**: Caches the editor's view state (like scroll position and cursor location) for each tab, so you can pick up your experiments exactly where you left off.
- **Can’t**:
    - Visually browse the vault's file system; components must be loaded by their exact path or from the bookmark bar.
    - Edit or run non-Datacore code (e.g., Python, CSS) or files without the specific # Header and ```jsx block structure.
    - Provide advanced IDE features like Git integration, a step-through debugger, or a terminal.
    - Pass custom props to the previewed component; it always renders with no props.


![datacore_playground.webp](/_RESOURCES/IMAGES/datacore_playground.webp)




### Components

###### [Datacore Playground Viewer ](D.q.datacoreplayground.viewer.md)

###### [Datacore Playground Component](D.q.datacoreplayground.component.md)

