# Task: 79_CREATE_COMPONENT

## Status: DONE

### Objectives
- [x] Implement a Component Creator UI to layout React elements
- [x] Incorporate `react-draggable` (identified as `react-grab`) via CDN/Cache
- [x] Enable dragging and positioning of text/elements on a canvas
- [x] Add the created layout as a new item in the Component Library

### Checklist
- [x] **Planning**
    - [x] Analyze user request and "react-grab" requirements
    - [x] Create `src/utils/libraryLoader.jsx` for caching external libs
- [x] **Library Setup**
    - [x] Resolve `react-draggable` CDN
    - [x] Implement fetch & cache logic in `index.jsx` or specialized loader
- [x] **UI Implementation**
    - [x] Create `src/components/ComponentCreator.jsx`
    - [x] Build a "Creator Canvas" for visual layout
    - [x] Implement Draggable wrapper for canvas elements
- [x] **Integration**
    - [x] Add "Create Component" button to `LibrarySidebar`
    - [x] Logic to save serialized layout to `src/library/` as a new JS file
    - [x] Refresh library after saving

### Best Practices
- **Folder Structure**: Create components in `src/library/ComponentName/index.jsx` (Folder-based) rather than flat files. This allows for asset co-location.
- **Metadata**: Always include a `metadata` array with a `category` field (e.g., `foreground`, `background`).
- **Scene Files**: To make a component immediately usable as a "Scene", create a corresponding JSON file in `_scenes/ComponentName.json`:
    ```json
    {
        "sequence": [{ "id": "main", "component": "ComponentName", "from": 0, "duration": 1500 }],
        "activeBackground": "PureBlack",
        "zoom": 1
    }
    ```
- **Asset Resolution**: Use `_folderPath` injected by the loader to resolve local assets (images/videos) dynamically.

### Troubleshooting
- **Component Not Visible**: If a new component doesn't appear in the Library:
    1. Force Reload the View.
    2. If issues persist, check `src/index.jsx` library scanning logic.
    3. Emergency Fix: Manually require and register the component in `src/index.jsx` after the scanner loop.
