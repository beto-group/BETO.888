# 🧠 Dashboard888 Elite Architecture Context

## 🚀 Overview
**Dashboard888** is a high-performance, modular Obsidian dashboard built using the **"Inception Engine"** pattern. It separates core orchestration logic (The Shell) from specialized functional modules (The Components), allowing for rapid expansion and maintenance without monolithic bloat.

---

## 🏗️ Core Architecture Pattern
The system operates on three distinct layers:

### 1. The Shell (`src/ViewComponent.md`)
- **Main Entry Point**: Handles global state, tab navigation, and top-level prop injection.
- **Dynamic Parser**: Uses an intelligent regex-based parser to read `INDEX.bet8.md`. 
- **Tab Resolution**: Automatically maps links (e.g., `###### [DOCS](BETO.docs)`) to local markdown files and extracts frontmatter (covers, descriptions, layouts).
- **Dynamic Theming**: Reads `theme: dark/light` from the index YAML to initialize the visual state.
- **Theme Persistence**: Saves manual theme overrides to `localStorage` to survive component remounts and macOS workspace switches.
- **Global Modal**: Manages the `NFModal` state and provides unified redirection handlers (`onTabChange`, `onPlaygroundRedirect`).

### 2. The Navigation Engine (`_resources/content/INDEX.bet8.md`)
- **Minimalist Registry**: Uses a "Link-Only" format. Standing links become tabs automatically.
- **Metadata Inheritance**: Tabs inherit icons, descriptions, and cover images directly from the linked file's frontmatter.
- **Format**:
    ```markdown
    ###### [HOME](BETO.home)
    ###### [DOCS](BETO.docs)
    ```

### 3. The Media Engine (`src/utils/MediaResolver.md`)
- **Async Indexing**: Performs background indexing of vault files to prevent UI lockup.
- **Fallback Logic**: Features a synchronous fallback and fuzzy search (Fuse.js) to ensure images and videos load even if paths change slightly.
- **Cache Management**: Maintains a `resourceCache` to avoid redundant Obsidian resource path calls.

---

## 🏗️ Recent Architectural Milestones

### 1. Advanced Modularization (The TOS Overhaul)
- **Problem**: The Terms of Service (TOS) logic and UI were monolithically embedded in the Shell, bloating `ViewComponent.md`.
- **Solution**: Extracted all TOS verification logic, state subscriptions, and the `TOSScreen` UI into a dedicated utility: `src/utils/TOSManager.md`.
- **Impact**: Reduced `ViewComponent.md` by ~450 lines, improving boot performance and modular maintainability.

### 2. High-Contrast Light Mode Parity
- **Problem**: Navigation buttons and category tabs (e.g., in `DocsSection`) suffered from poor visibility and "washed-out" aesthetics in Obsidian's light mode.
- **Solution**: Implemented a theme-aware CSS override system using absolute OKLCH color mappings and `!important` hex overrides (e.g., Purple `#7c4dff` for active buttons).
- **Hardening**: Created a dedicated `src/utils/DesignSystem.md` which injects global light/dark overrides. This ensures components detached from the main DOM (like fullscreen mode) retain their theme integrity by explicitly checking the `[class*="theme-light"]` attribute.
- **Impact**: Achieved "Impeccable Status" visual parity, ensuring the dashboard looks premium and is fully accessible regardless of the user's theme selection.

### 3. YAML-Driven Content Feeds (Devlog Evolution)
- **Problem**: The Devlog system relied on hardcoded naming conventions (e.g., `DEVLOG_11.webp`), limiting content flexibility.
- **Solution**: Upgraded the `DevlogSection` to support **YAML Metadata Authority**. Individual devlog files can now define their own `cover`, `video`, `subtitle`, and `description` in the frontmatter.
- **Impact**: Decoupled content from file names, allowing for higher-quality, unique media for every entry while maintaining backward compatibility.

### 4. Glassmorphism & UI Stability
- **Problem**: Overlay components like the search bar and popups felt disconnected or had visibility issues in light mode.
- **Solution**: Implemented a "Light-Glass" standard (`background: #ffffff !important`, `box-shadow: 0 10px 30px rgba(0,0,0,0.1)`) and increased `z-index` to `9999` for critical interactive layers.
- **Impact**: Created a consistent, "alive" interface that remains clickable even when overlapping dense canvas elements.

---

## 📁 Directory Structure & Key Files

### 📂 `src/` (Core Logic)
- **`ViewComponent.md`**: The heart of the dashboard.
- **`utils/TOSManager.md`**: Centralized Terms of Service verification and UI.
- **`utils/MediaResolver.md`**: The centralized media resolution utility.
- **`utils/DesignSystem.md`**: Global theme hardening and visual overrides.
- **`utils/CommonUtils.md`**: Shared helpers (path normalization, script loaders).

### 📂 `src/components/` (Functional Modules)
- **`Docs/DocsSection.md`**: Specialized documentation viewer with high-contrast category navigation.
- **`Shared/NFModal.md`**: The "Netflix-style" modal for details and file extraction.
- **`Shared/HeroComponents.md`**: Reusable UI like `Showcase`, `MatrixRain`, and `HeroCarousel`.
- **`Shared/DatacoreShowcase.md`**: The primary logic for component cards and implementation extraction.
- **`Updater/VaultUpdater.md`**: Integrated GitHub-based update management system.
- **`Home/HomeSection.md`**: The visual landing page and category selector.

### 📂 `_resources/` (Data & Assets)
- **`content/INDEX.bet8.md`**: The navigation source of truth.
- **`content/BETO.*.md`**: Definition files for each tab (Docs, Datacore, Assets, etc.).
- **`IMAGES/` & `VIDEOS/`**: Centralized media repository.

---

## 🎯 Modular Extraction Logic (`NFModal`)
One of the core features of Dashboard888 is the automatic extraction of implementation files from component documentation.

- **Trigger**: Clicking a component card in the Datacore section.
- **Parser**: `DatacoreShowcase.extractEntryData` scans the component's markdown for `###### [Link]` headers.
- **Filtering**: Specifically targets `.viewer`, `.component`, and `src/index.jsx` to separate documentation from logic.
- **Redirection**: The "FILES" dropdown allows direct navigation to these files or loading them into the "Playground" via `onPlaygroundRedirect`.

---

## 🛠️ Operational Protocols for AI Agents

1. **Theme Awareness**: Use `localTheme` (passed as a prop) to drive visual logic. Avoid hardcoded colors; use `rgba(var(--background-primary-rgb), alpha)` for transparency or OKLCH for vibrant accents.
2. **UI Hardening**: For global styles, use `.theme-light` or `[class*="theme-light"]` as parent selectors. This ensures style persistence when components are detached (fullscreen) or re-parented in the DOM.
3. **Cache Awareness**: Changes to modular components (`.md` files required via `dc.require`) are strictly cached. **Reload Obsidian** or **Clear Cache** is required after edits.
4. **Path Resolution**: Always use `dc.app.metadataCache.getFirstLinkpathDest` for resolving internal links to ensure robust pathing across different vault structures.
5. **Universal Props**: Every modular component receives a standard set of props (`dc`, `STYLES`, `localTheme`). Do not break this contract.
6. **Logs**: Keep production logs to a minimum. Use prefixed logs (e.g., `[VaultUpdater]`) only for critical errors or lifecycle events.
7. **Entry Point Stability**: When launching the dashboard from a root file like `HOME.md`, ensure the `dc.require` path to `ViewComponent.md` is robust (using `_RESOURCES/DATACORE/53.1 Dashboard888/src/ViewComponent.md` instead of simple relative paths). This prevents the "\[object Object]" error caused by incorrect path resolution in non-standard vault structures.

---

## 🔄 Update Protocol
System updates are managed via the **VaultUpdater**.
- **Source**: `github:beto-group/BETO.888`
- **Check**: Compares local `CHANGE LOG.md` version against the remote `main` branch.
- **Sync**: Supports both targeted (manifest-based) and full repository synchronization.
