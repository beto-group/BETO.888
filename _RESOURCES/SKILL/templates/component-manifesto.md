# 💎 The Elite Component Manifesto

All Datacore components generated within this vault must adhere to the **Beto Elite Standard**.

## 1. 🖼️ Impeccable Presentation
- **FullTab Dominance**: Components must use DOM Reparenting to fill the entire pane, bypassing all Obsidian margins and headers.
- **Glassmorphism**: UI must feel "premium" using HSL-based translucency and vibrant accent colors.
- **Density**: Design for information density. Minimize whitespace, maximize utility.

## 2. ⚡ Technical Excellence
- **Zero-Config**: Components must be self-contained. All dependencies must be in `_resources/`.
- **Latency-First**: Use `useMemo` and `useCallback` to ensure 60fps interaction.
- **Resilient I/O**: Implement robust file error handling and loading states.

## 3. 🔍 Verification Standards
- **Screenshot Path**: All verification media in `_resources/images/dev/`.
- **Stress Test**: Components must survive rapid tab-switching and re-mounting.

## 4. 🧩 Modular Orchestration
- **The Monolith Ban**: Components exceeding 500 lines must be split into a modular directory structure (`src/core/`, `src/components/`, `src/App.jsx`).
- **The Bootstrapper Pattern**: `index.jsx` should serve as a lightweight entry point that dynamically loads sub-modules via `dc.require`.
- **Directory Convention**:
    - `src/core/`: Business logic, parsers, and design tokens/styles.
    - `src/components/`: Reusable, functional UI units.
    - `src/App.jsx`: State management and layout assembly.
- **Cache Resilience**: When modifying required sub-modules, ensure the bootstrapper handles logic for script re-execution if the environment does not auto-refresh.

---
*Stay Impeccable. Stay Modular.*
