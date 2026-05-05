# 🛠️ System Customization Guide

Welcome to the **BETO . 888** Mainframe. This system is designed for high-performance modularity, allowing you to rebrand and restructure your entire dashboard directly from the configuration layer.

---

## 1. Global Identity & Theme

You can instantly re-skin the dashboard's identity and default theme by modifying the frontmatter of your `INDEX.bet8.md` file.

```yaml
---
dashboard_title: "YOUR NAME . 888"
dashboard_subtitle: "// Initializing custom mainframe... Status: Optimal."
dashboard_cta: "[ PROCEED AT YOUR OWN RISK 🫡 ]"
theme: "dark" # "dark" or "light"
---
```

- **`dashboard_title`**: The main glowing text at the top. The system automatically applies a "Glitch" effect to this string.
- **`dashboard_subtitle`**: The typewriter-style text below the title.
- **`dashboard_cta`**: The text on the initial "Welcome" screen button.
- **`theme`**: Sets the initial visual state. The system saves manual overrides to `localStorage` to persist your choice across sessions.

---

## 2. Minimalist Navigation Architecture

The navigation bar is built dynamically from the content of `INDEX.bet8.md`. The system uses an **Intelligent Parser** that turns standalone links into dashboard tabs.

### **The Minimalist Registry**
Simply list your sections as links. No headers or properties are required in the index file itself:

```markdown
###### [HOME](BETO.home)
###### [DOCS](BETO.docs)
###### [Datacore](BETO.datacore)
###### [Assets](BETO.assets)
```

### **How it Works**
1. **Title**: The text in brackets (`HOME`, `DOCS`) becomes the Tab Title.
2. **Path Mapping**: The system automatically looks for a file named `BETO.docs.md` (or whatever ID you provided) in the same directory.
3. **Metadata Inheritance**: The dashboard reads all metadata (icons, covers, videos, logic) directly from that linked file's frontmatter.

---

## 3. Section Metadata (YAML Authority)

To configure a section, add the following properties to the **YAML frontmatter** of the linked section file (e.g., `BETO.docs.md`):

```yaml
---
icon: book-open            # Lucide icon name (lucide.dev)
cover: _RESOURCES/IMAGES/DOC.webp    # Section thumbnail
video: _RESOURCES/VIDS/DOC.webm      # Background video for Home Showcase
description: "The Central Hub"       # Subtitle text
layout_type: box                     # UI Layout (box or tabs)
component_path: ../src/index.jsx     # Modular logic path
---
```

- **`icon`**: Supports any [Lucide Icon](https://lucide.dev/icons/).
- **`video`**: High-performance `.webm` backgrounds used by the Home section's Cinematic Showcase.
- **`cover`**: Used as a fallback for the video and as the navigation thumbnail.
- **`component_path`**: The "Inception Bridge" to your modular code.

---

## 4. Inception Engine (Modular Components)

The **Inception Bridge** allows you to fully decouple section logic from the main dashboard shell. You can create high-performance interactive components and "inject" them into the dashboard via metadata.

### **The Pattern**
Instead of the dashboard "knowing" how to render a section, the section tells the dashboard which script to run via `component_path`.

### **Universal Props**
The system automatically injects the following props into your modular component:
- **`dc`**: The full Datacore API.
- **`styles`**: The dashboard's global theme and layout constants.
- **`folderPath`**: The absolute path to your component's directory.
- **`openModal(data)`**: Open the global Netflix-style media modal.
- **`MarkdownViewer`**: A high-performance renderer for Obsidian Markdown and Callouts.
- **`handleImportToVault(path, vault)`**: Triggers the global file-exporter engine.

---

## 5. Layout Types & Multi-Tab Loading

You can specify a `layout_type` to change how your components are presented:

### **Modular Layouts**
- **`box`**: A standard standalone container for modular components.
- **`tabs`**: A multi-component layout with automatic sub-navigation.
- **`showcase`**: The high-fidelity "Cinematic" layout (used for Home and Devlog).

---

## 5. The Showcase Layout Engine

The `showcase` layout is a specialized, metadata-driven component designed for high-impact visual feeds. It can handle both global navigation and external content feeds.

### **Configuration Properties**
```yaml
layout_type: showcase
showcase_data: index           # Use global nav index (Home Mode)
# OR
showcase_data: path/to/file.md  # Parse external feed (Devlog Mode)
showcase_details_path: path/to/dir/ # Root for entry details
```

### **Home Mode (`showcase_data: index`)**
In this mode, the showcase automatically pulls the navigation items defined in `INDEX.bet8.md`. It uses the `video` and `cover` properties of each linked file to build a cinematic carousel.

### **Feed Mode (`showcase_data: path/to/file.md`)**
In this mode, the layout parses a master markdown file (like a Devlog) for links formatted as `###### [Title](Link)`.

#### **YAML Metadata Authority (New)**
Instead of relying on hardcoded file names, the system uses the **YAML frontmatter** as the absolute authority for media and composition. This allows for a "Live Framing Studio" workflow where changes saved in Obsidian reflect instantly in the Dashboard.

```yaml
---
cover: path/to/image.webp      # Explicit image override
video: path/to/video.mp4       # Explicit video override
subtitle: "Mission Log // 888" # Custom subtitle
description: "Detailed summary" # Custom description
media_position: "50% 50%"      # Focus for Showcase Feed (Supports %, px, and negative values)
media_scale: 1.2               # Zoom for Showcase Feed
modal_position: "10% 80%"      # Focus for Detail Modal
modal_scale: 1.5               # Zoom for Detail Modal
---
```

- **Independent Composition**: You can define different framing for the wide Dashboard Feed (`media_`) and the square/portrait Detail Modal (`modal_`).
- **Fluid Framing**: `position` properties support standard CSS values (e.g., `center`, `top left`, `-10% 80%`, `50px 50px`).
- **Live Reactivity**: The Dashboard and Modal listen for file changes. Saving the `.md` file in Obsidian triggers an instant, flicker-free update of the framing and scale.
- **Auto-Stripping**: The system automatically hides the YAML block when rendering content, ensuring a clean "Pro" aesthetic.
- **Integrated Details**: Clicking an entry triggers the **NFModal**, which renders the markdown and applies the `modal_` framing coordinates.

---

## 6. Shared UI Library

The dashboard provides a suite of shared components to ensure UI consistency ("Impeccable Status") across all modules.

### **Cinematic Loading System**
Instead of static text, always use the shared `LoadingScreen` component:
```jsx
const { LoadingScreen } = await dc.require(resolveDash("src/components/Shared/HeroComponents.md", "HeroComponents"));

// Usage in render:
return <LoadingScreen label="SYNCING MODULE" OverlayLogo={OverlayLogo} />;
```

### **Media Resources**
- **Images**: `_RESOURCES/IMAGES/`
- **Videos**: `_RESOURCES/VIDS/` (High-performance `.webm` format recommended)
- **Icons**: [Lucide Icon Registry](https://lucide.dev/icons/)

---

## 7. Inception Engine (Modular Components)

The **Inception Bridge** allows you to fully decouple section logic from the main dashboard shell. You can create high-performance interactive components and "inject" them into the dashboard via metadata.

### **Universal Props**
The system automatically injects the following props into your modular component:
- **`dc`**: The full Datacore API.
- **`styles`**: The dashboard's global theme and layout constants.
- **`folderPath`**: The absolute path to your component's directory.
- **`openModal(data)`**: Open the global Netflix-style media modal.
- **`MarkdownViewer`**: A high-performance renderer for Obsidian Markdown and Callouts.
- **`LoadingScreen`**: The standardized cinematic loading state.
- **`OverlayLogo`**: The animated Matrix logo component.
- **`handleImportToVault(path, vault)`**: Triggers the global file-exporter engine.

---

## 8. Using Shared Services

Modular components have access to the shell's `MarkdownViewer` and `LoadingScreen`. This allows you to maintain the "Impeccable Status" aesthetic with minimal code.

### **Example Usage**
```jsx
function MyComponent(props) {
    const { MarkdownViewer, LoadingScreen, OverlayLogo, dc } = props;
    const [isLoading, setIsLoading] = useState(true);

    if (isLoading) return <LoadingScreen label="PROCESSING" OverlayLogo={OverlayLogo} />;

    return (
        <div className="my-custom-container">
            <MarkdownViewer markdown="# Hello World" dc={dc} />
        </div>
    );
}
```

---

> [!TIP]
> The system updates in **real-time**. Simply save your changes to the configuration files, and the dashboard will instantly reflect the new identity, visuals, and logic.
