# Implementation Plan: Modularity & Component Editing (Design-First Focus)

Refactor the codebase for better modularity and implement a flow to re-open and edit library components without animation distractions.

## Proposed Changes

### [Draggable System]

#### [NEW] [DraggableItem.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/components/DraggableItem.jsx)
- Extract the `DraggableItem` component from `ComponentCreator.jsx`.
- Include dragging and resizing logic.
- Support `canvasScale` and `onUpdate` callbacks.

#### [MODIFY] [ComponentCreator.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/components/ComponentCreator.jsx)
- Remove `DraggableItem` definition.
- Use `dc.require` to load `DraggableItem`.

### [Component Editing & Metadata]

#### [MODIFY] [ComponentCreator.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/components/ComponentCreator.jsx)
- **Metadata Embedding**: Include `// @metadata: ${JSON.stringify(elements)}` at the top of saved files.
- **Initial State**: Accept `initialElements` and `initialName` props.

#### [MODIFY] [index.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/index.jsx)
- **Metadata Parsing**: Read file content and parse `@metadata` during library discovery.
- **Library Structure**: Store components as `{ Comp, metadata }`.

#### [MODIFY] [LibrarySidebar.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/components/LibrarySidebar.jsx)
- **Edit Trigger**: Add `onEditComponent` prop.
- **Click Handler**: Trigger edit when a library item is clicked.

#### [MODIFY] [RemotionClone.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/components/RemotionClone.jsx)
- **Edit State**: Track `editingComponent` and open the creator in edit mode.

### [Design-First Simplification]

#### [MODIFY] [TitleCard.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/library/TitleCard.jsx)
- Remove `opacity` and `transform` logic tied to `frame`.
- Make text fully visible static elements.

#### [MODIFY] [FeatureList.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/library/FeatureList.jsx)
- Remove staggered `opacity` and `translateX` animations.
- Show all features instantly.

#### [MODIFY] [ComponentCreator.jsx](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/src/components/ComponentCreator.jsx)
- Update the save template to output simple, non-animated JSX.
- Remove the `opacity = Math.min(1, frame / 30)` logic from generated components.

### [Guidelines Update]

#### [MODIFY] [_resources/agents/BEST_PRACTICES.md](file:///Volumes/BackUp_WB-1TB/APPLICATIONS/BETO_BACKEND/app-repos/production-contabo/DATACORE/78%20RemotionClone/_resources/agents/BEST_PRACTICES.md)
- Add strict "One Component per File" rule.

## Verification Plan

### Manual Verification
1.  **Component Editing**: Click a component in the sidebar, edit its text/size, and save. Verify changes persist.
2.  **Animation Check**: Verify components show all text instantly without staggered entrance.
