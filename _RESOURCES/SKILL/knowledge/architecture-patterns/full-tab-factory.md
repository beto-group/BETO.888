# Full-Tab View Factory: DOM Reparenting Pattern

This pattern is used to achieve "Impeccable Status" immersion in Obsidian by moving the rendered component outside of the standard Datacore/Obsidian padding and into the edge-to-edge container of the workspace leaf.

## 🏗️ Architecture

The pattern relies on a "View Factory" function that Datacore executes. Instead of just returning JSX, the factory manages a manual DOM relocation lifecycle.

## 🎯 Targeting Modes (The Immersion Spectrum)

To achieve "Impeccable Status" without losing essential controls, choose the correct reparenting target:

### 1. Header-Safe Mode (Standard)
- **Target**: `.workspace-leaf.mod-active .view-content`
- **Effect**: Fills the entire tab area but **preserves** the Obsidian view header (title, controls, menu).
- **Usage**: Dashboards, editors, and interactive tools where navigation is still required.

### 2. Nuclear Mode (Extreme Immersion)
- **Target**: `document.body` or `.workspace-leaf.mod-active`
- **Effect**: Covers the entire application window or the entire leaf including the header. 
- **Usage**: Fullscreen presentation modes, map globes, or terminal-only interfaces.

### 3. Cleanup Protocol
- **State Preservation**: Always use a ref to track if reparenting is active (`isActiveRef`).
- **Placeholder**: Use a hidden `div` to ensure React doesn't lose the component's virtual position.

## 🛠️ Implementation Example

See the core logic in `_RESOURCES/SKILL/BETOSKILL/src/index.jsx`.

### Detection & Safety
The pattern uses `findNearestAncestorWithClass` to ensure it only reparents when correctly nested within an Obsidian workspace leaf, preventing crashes in unexpected environments.

### Visual Integrity
By reparenting to the top-level `.view-content` or `.workspace-leaf-content` container, the component ignores all default paddings, borders, and margins applied by the host vault or theme.
