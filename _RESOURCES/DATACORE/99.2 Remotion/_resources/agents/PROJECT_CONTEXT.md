# Project Context: 78 RemotionClone

## Overview
A Datacore component that recreates the core functionality of Remotion, allowing users to build React-based video compositions and render them.

### Persistence Layer
-   **Multi-Scene Architecture**:
    -   Projects are saved as individual JSON files in the `_scenes/` directory.
    -   `activeScene` tracks the current loaded project file (e.g., `Default Scene.json`).
    -   `LibrarySidebar` provides a tabbed interface to switch between "Library" (Components) and "Scenes" (Projects).
-   **Format**: `project.json` (migrated to `_scenes/Default Scene.json`)
    -   `sequence`: Array of layers `{ id, component, from, duration }`.
    -   `activeBackground`: String ID of background component.
    -   `zoom`: Integer zoom level for timeline (1-10).
    -   `version`: Schema version.
-   **Mechanism**:
    -   Auto-saves 800ms after changes (debounced).
    -   Saves immediately on component unmount or scene switch.
    -   Uses `activeScene` to determine dynamic save path.

## Core Functionality
- **Timeline-based Composition**: Create animations and transitions using React components.
- **Real-time Preview**: View the compositions in a high-performance previewer.
- **Sequencer**: Handle multiple tracks and layers of visual elements.
- **Rendering Engine**: Export the React compositions into video formats (prototype).

## Architecture
- **Entry Point**: `src/index.jsx` handles dependency discovery, font loading, and mounting.
- **Main Component**: `src/components/RemotionClone.jsx` (Refactored to orchestrate hooks).
- **Core Logic (Hooks)**:
    - `useSceneManager`: Persistence, autosave, and scene switching.
    - `useHistory`: Deep undo/redo state management for project changes.
    - `useStageScale`: Responsive canvas scaling logic.
    - `useExport`: FFmpeg-based video rendering and frame capture (Datacore Native).
    - `useKeyboardShortcuts`: Global hotkey bindings.
- **Styles**: Glassmorphic, dark-mode design system.
- **Styles**: Glassmorphic, dark-mode design system following the "Black on Black on Black" theme.

## Design System
- Uses standard properties from `src/styles/styles.jsx`
- Primary Color: `#8b5cf6` (Subtle Purple)
- Background: Absolute Black `#000000`

## Known Constraints
- Must work within the Datacore/Obsidian environment.
- Performance is critical for smooth frame-by-frame scrubbing.
