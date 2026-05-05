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

## 2. YAML Frontmatter
The following fields are MANDATORY and must be synchronized:
- `id`: Must match the folder's numeric prefix (e.g., `72`).
- `name.official`: Title Case name (e.g., `Open Browser`). Must match the Markdown H1/H2 header.
- `author`: `beto.group`.
- `status`: `stable` | `wip`.
- `resources`: List of asset filenames located in `_resources/`.

## 3. Grammar & Tone
- **Formal Professionalism**: Use a sterile, technical, and professional tone.
- **No Contractions**: Avoid words like `don't`, `doesn't`, `can't`, `it's`. Replace with `does not`, `cannot`, `it is`.
- **Active Voice**: Use active verbs (e.g., "Implements", "Features", "Utilizes").

## 4. GitHub-Compatible Linking (Rule #12)
To ensure links work both in Obsidian and on GitHub, the following rules apply:
- **Relative Paths**: Always use relative paths starting from the component's parent directory (e.g., `72%20OpenBrowser/_resources/images/file.webp`). **NEVER** include the absolute vault root (e.g., `_RESOURCES/DATACORE/`).
- **URL Encoding**: Replace all spaces with `%20` in the link path.
- **Source Code Standard**: Use the `{index.jsx}` suffix in the link text for all source components: `[Name Components {index.jsx}]`.
- **Viewer Audit**: Always verify the actual `.viewer.md` filename on disk. Do not assume it follows the full name (e.g., use `kmcli.viewer.md` if that is the filename, not `keyboardmaestrocli.viewer.md`).
- **Standard Format**: `###### [Link Text](path/to/file.md)`.

### Examples:
- Image: `![Image Description](_resources/images/screenshot.webp)`
- Video: `![Video Description](_resources/videos/clip.webm)`
- Component: `###### [Open Browser Components {index.jsx}](72%20OpenBrowser/src/index.jsx)`
- Viewer: `###### [Open Browser Viewer](72%20OpenBrowser/D.q.openbrowser.viewer.md)`

## 5. Required Sections
Every `[NAME].md` must include:
1.  **Tab**: Primary component focus.
2.  **Does**: Nested list of capabilities.
3.  **Can’t**: Nested list of limitations.
4.  **Media**: High-fidelity video clip followed by one or more screenshots in numeric order.
    - **Video**: `.webm` (libvpx-vp9). Filename: `[shortname].clip.webm`.
    - **Images**: `.webp`. Filename pattern: `[shortname]_[N].webp` (e.g., `iqgame_1.webp`, `iqgame_2.webp`).
    - **Order**: Video ➔ Screenshot 1 ➔ Screenshot 2...
5.  **Components**: Final section linking to the Viewer and Source Code.

## 7. Devlog Entry Standard
Every mission log or devlog entry must follow the **YAML Metadata Authority** pattern to ensure high-fidelity presentation:
1.  **Location**: Save entries in `_OPERATION/PUBLIC/DEVLOG/ITI/` using the format `DEVLOG.[color]-[ID].md`.
2.  **YAML Authority**: Every file **MUST** contain explicit composition metadata:
    - `cover`: High-fidelity `.webp` thumbnail.
    - `video`: Cinematic `.webm` or `.mp4` clip (optional but recommended).
    - `media_position` / `media_scale`: Framing for the Dashboard Showcase.
    - `modal_position` / `modal_scale`: Framing for the NFModal (Detail View).
3.  **Live Framing**: Developers should use the "Live Framing Studio" capability. Adjust YAML in Obsidian while the Dashboard is open to see framing changes instantly.
4.  **Master Update**: Add the new entry to the top of `_OPERATION/PUBLIC/DEVLOG/DEVLOG.md` using: `###### [ID](ITI/DEVLOG.name.md)`.

## 8. Resource Discovery
For in-depth architectural context, consult the following "Authority" files:
- **Core Orchestration**: `src/ViewComponent.md` (The Dashboard Shell).
- **System Context**: `_resources/agents/CONTEXT.md` (Operational protocols and architectural milestones).
- **Customization API**: `_resources/docs/SYSTEM CUSTOMIZATION.md` (Metadata and component injection guides).
- **Visual Design**: `src/utils/DesignSystem.md` (Global theme and styling overrides).

---
*Beto Group LLC | Documentation & Infrastructure Standardized.*
