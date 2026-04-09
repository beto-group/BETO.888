# Datacore Release Protocol

This document defines the official standardization requirements for all Datacore components within the BetoOS ecosystem. All future releases and updates MUST adhere to these protocols to ensure compatibility with GitHub and Obsidian-based showcases.

## 1. File Structure
Every component folder must follow the standard directory hierarchy:
- `[ID] [Name]/`
    - `[NAME].md` (Main Documentation)
    - `_resources/`
        - `images/` (WebP screenshots)
        - `videos/` (WebM/MP4 clips)
    - `src/` (Source code, e.g., index.jsx)

### 1.1 Debris Removal
Standardization is NOT complete until all legacy assets are deleted. **NEVER** leave "ghost" files (e.g., `basic_folder_view.webp`) in specialized component directories. Purge all orphaned or mismatched assets from the `_resources` folder once the new media is verified.

## 2. YAML Frontmatter
The following fields are MANDATORY and must follow the **High-Fidelity Standard**:
- `author`: `beto.group`.
- `name.official`: Title Case name. Must match the Markdown `### Tab:` header exactly.
- `id`: Must match the folder's numeric prefix (e.g., `72`).
- `status`: `stable` | `experimental`.
- `category`: Functional category list (e.g., `utility`, `graphics`).
- `tags`: Descriptive keyword list.
- `desc`: Single-sentence summary for database indexing.
- `longDesc`: Concise paragraph mirroring the Markdown description.
- `complexity`: `basic` | `intermediate` | `advanced`.
- `platform`: `desktop`.
- `price`: `"0"`.
- `version`: Semantic versioning (e.g., `1.0.0`).
- `version.obsidian`: Target Obsidian version (standard: `1.4.11`).
- `ext.dependencies`: List of external libraries or system tools.
- `resources`: List of asset filenames located in `_resources/`.
- **Structured JSON Strings**:
    - `does`: A stringified JSON array of objects representing capabilities (`{title, children: [{content}]}`).
    - `cant`: A stringified JSON array of objects representing limitations (`{title, content}`).

### Example High-Fidelity YAML:
```yaml
author: beto.group
name.official: Example Component
id: 0
status: stable
category: [utility]
complexity: basic
desc: A short description.
longDesc: A longer paragraph describing the component.
does: '[{"title": "Feature", "children": [{"content": "Detail"}]}]'
cant: '[{"title": "Limit", "content": "Context"}]'
resources: [clip.webm, screenshot.webp]
```

## 3. Grammar & Tone
- **Formal Professionalism**: Use a sterile, technical, and professional tone.
- **No Contractions**: Avoid words like `don't`, `doesn't`, `can't`, `it's`. Replace with `does not`, `cannot`, `it is`.
- **Active Voice**: Use active verbs (e.g., "Implements", "Features", "Utilizes").

## 4. GitHub-Compatible Linking (Rule #12)
To ensure links work both in Obsidian and on GitHub, the following rules apply:
- Rule #12: **GitHub-Compatible Linking Standard**. All internal links (showcase or media) MUST use relative paths (e.g., `Folder/%20Name/src/index.jsx`) and URL-encoded spaces (`%20`). Absolute vault root prefixes (e.g., `_RESOURCES/DATACORE/`) are BANNED. Functional components must use the `{index.jsx}` suffix in the link text.
- Rule #13: **Relative Path Recovery & Portability**. All Datacore components MUST implement 'Zero-Hardcode' pathing. In viewer scripts, use `dc.resolvePath("./src/index.jsx")` as an anchor to dynamically derive the base directory. Vault-absolute strings (e.g., `_RESOURCES/DATACORE/Folder Name/...`) are BANNED.
- Rule #14: **Sterile Brutalism Documentation Layout**. All component documentation MUST follow the strict structural sequence: `YAML Metadata ➔ ### Tab: Title ➔ Description ➔ - **Does**: ➔ - **Can't**: ➔ ------ ➔ Media ➔ Components`. The `### Media` header is strictly **BANNED**; use a horizontal rule `------` for separation.
- **Viewer Audit**: Always verify the actual `.viewer.md` filename on disk. Do not assume it follows the full name (e.g., use `kmcli.viewer.md` if that is the filename, not `keyboardmaestrocli.viewer.md`).
- **Standard Format**: `###### [Link Text](path/to/file.md)`.

### Examples:
- Image: `![Image Description](_resources/images/screenshot.webp)`
- Video: `![Video Description](_resources/videos/clip.webm)`
- Component: `###### [Open Browser Components {index.jsx}](72%20OpenBrowser/src/index.jsx)`
- Viewer: `###### [Open Browser Viewer](72%20OpenBrowser/D.q.openbrowser.viewer.md)`

## 5. Required Sections
Every `[NAME].md` must include exactly these sections in order:
1.  **YAML Frontmatter**: Mandatory metadata.
2.  **Title (H3 Tab)**: `### Tab: [Official Name]`.
3.  **Description**: `- **Description**: [Text]`. Concise overview of purpose and utility.
4.  **Does**: `- **Does**:`. Bulleted list of primary capabilities. Use indented bullets for details.
5.  **Can't**: `- **Can't**:`. Bulleted list of known limitations. Avoid `Can’t` (smart quote); use `Can't`.
6.  **Separator (`------`)**: A forced horizontal rule. `### Media` header is strictly **BANNED**.
7.  **Media Assets**: High-fidelity video clip followed by screenshots.
    - **Video**: `.webm` (libvpx-vp9). Filename: `[shortname].clip.webm`.
    - **Images**: `.webp`. Filename pattern: `[shortname]_[N].webp`.
8.  **Components**: Final section linking to the Viewer and Source Code.

## 6. Showcase Entry Standard
Every entry in `DATACORE.showcase.md` must adhere to:
1.  **Categorization**: Places components into their respective logical headers (Graphics, Games, System, Utilities).
2.  **Numeric Order**: Sorting by ID numeric prefix within categories is preferred.
3.  **URL Encoding**: Link paths MUST be URL-encoded (spaces to `%20`).
4.  **Deduplication**: Each component should appear only once in the showcase unless it spans multiple distinct categories.

## 7. Mandatory Bookmarking
Every component standardized under this protocol MUST be added to the `.obsidian/bookmarks.json` file.
1.  **Group Structure**: Each component exists as a "group" titled with its standardized name (e.g., `72 Open Browser`).
2.  **Required Items**: The group must contain at minimum:
    -   The main documentation file (`[NAME].md`).
    -   The viewer script (`D.q.[nameshort].viewer.md`).
    -   The source component (`index.jsx`, if applicable).
3.  **Categorization**: The component group must be nested under its functional category header (e.g., `DEVELOPMENT & BUILDING TOOLS`).

## 8. Mandatory Devlog Entry
No component is considered "Released" until it has been documented in the current monthly devlog (e.g., `DEVLOG.pink-10.md`).
1.  **Requirement**: Standardizing a component MUST include a summary of the work in the devlog.
2.  **Highlighting**: New components must be clearly marked in the devlog to maintain institutional memory and public-facing transparency. 

## 9. Mandatory Change Log Entry
Every significant release or component standardization sprint must be documented in the global `CHANGE LOG.md`.
1.  **Unified Timeline**: The change log serves as the authoritative history of the BetoOS evolution.
2.  **Summary Blocks**: Entries must include a high-level summary, specific component changes, and any architectural shifts (e.g., High-Fidelity YAML adoption).
3.  **Devlog Synchronization**: The component list in `CHANGE LOG.md` MUST mirror the exhaustive list found in the corresponding `DEVLOG.[id].md`.

## 10. Institutional README & Version Sync
Every major release cycle (e.g., PINK-10) requires a synchronization of the global vault identity to maintain institutional clarity.
1.  **Semantic Versioning**: Versioning follows the Release ID major pattern (e.g., PINK-10 ➔ `1.10.0`).
2.  **README Version Signature**: The very bottom of the `README.md` MUST contain the official version signature: `*Beto Group LLC | Infrastructure Standardized. Portals Open. Version [X.X.X] Live.*`
3.  **Branding Fidelity (SVG Badges)**: Header badges in `README.md` MUST use high-fidelity Lucide SVG data-URIs. All bottom-row icons (DATACORE, ASSETS, etc.) must be standardized to the institutional gold (`#FFE165`).
4.  **Global Versioning Update**: The `version:` field in `CHANGE LOG.md` frontmatter must be incremented to match the latest release ID before the final commit.

---
*Beto Group LLC | Documentation & Infrastructure Standardized. Version 1.10.0.*
