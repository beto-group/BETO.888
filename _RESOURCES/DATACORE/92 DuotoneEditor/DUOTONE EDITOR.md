---
author: beto.group
name.official: DuotoneEditor
version: 1.0.0
price: "0"
category:
  - utility
tags:
  - canvas-api
  - image-processing
  - pixel-manipulation
  - duotone
  - color-theory
  - interactive-tool
desc: A professional-grade image processing utility that utilizes Canvas API pixel mapping to create high-fidelity duotone transformations with full history support.
status: stable
complexity: advanced
id: 97
resources: [duotoneeditor.clip.webm, duotone_editor_1.webp]
longDesc: "DuotoneEditor is a specialized image manipulation component that maps color values from source images to a dual-color palette using raw Canvas pixel processing. It goes beyond simple CSS filters by performing mathematical brightness-to-color synthesis for ogni pixel, ensuring high-fidelity duotone results. The component features a robust session-based history engine allowing for infinite undo/redo and timestamped state tracking. It supports multi-source content ingestion (upload vs. procedural generation) and provides a professional export pipeline for various formats. Designed as a creative utility, it combines deep technical logic with an intuitive preset-driven interface for high-impact visual design."
does: "[  {    \"title\": \"Canvas Pixel Mapping\",    \"children\": [      {        \"title\": \"Direct Data Processing\",        \"content\": \"Utilizes raw getImageData arrays to perform per-pixel brightness-to-color synthesis for high-fidelity duotone effects.\"      },      {        \"title\": \"Dual-Color Synthesis\",        \"content\": \"Calculates real-time RGB interpolation between two user-defined color hex codes based on source pixel luminance.\"      }    ]  },  {    \"title\": \"Professional History Engine\",    \"children\": [      {        \"title\": \"State-Stack Persistence\",        \"content\": \"Implements a session-based history system for infinite undo/redo navigation across all edit stages.\"      },      {        \"title\": \"Timestamped Logging\",        \"content\": \"Maintains a tactical history panel with timestamped state snapshots for precise session tracking and restoration.\"      }    ]  },  {    \"title\": \"Asset Pipeline\",    \"children\": [      {        \"title\": \"Hybrid Ingestion\",        \"content\": \"Supports multi-source image loading including local file uploads and procedural Picsum randomizer injection.\"      },      {        \"title\": \"Multi-Format Export\",        \"content\": \"Provides a high-quality download pipeline supporting PNG, JPEG, and WebP formats directly from the canvas buffer.\"      }    ]  }]"
cant: '[  {    \"title\": \"Persistent Session History\",    \"content\": \"The history stack is session-based and does not persist across browser reloads or Obsidian workspace resets.\"  },  {    \"title\": \"Advanced Vector Scaling\",    \"content\": \"The editor operates on raster pixel data; it does not provide vector-based upscaling or SVG export functionality.\"  },  {    \"title\": \"Multi-Layer Blending\",    \"content\": \"The processing engine is optimized for single-layer duotone transformations; multi-layer masking and blending are not supported.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Duotone Editor

- **Description**: Duotone Editor is a professional-grade image processing utility that utilizes Canvas API pixel mapping to create high-fidelity duotone transformations with full history support. It combines deep technical logic with a tactical preset library for creative visual design, ensuring high-fidelity color interpolation through direct pixel-data manipulation.

- **Does**:

    - **Canvas Pixel Mapping**: Directly processes raw pixel data arrays for high-fidelity color synthesis.
    - **Dual-Color Interpolation**: Real-time RGB calculation between user-defined hex codes based on luminance.
    - **Professional History Engine**: Implements a session-based history stack for infinite undo/redo navigation.
    - **Timestamped State Logging**: Maintains a tactical panel with snapshot history for precise session recovery.
    - **Hybrid Asset Ingestion**: Supports local file uploads and procedural randomizer injection via external APIs.
    - **Multi-Format Export Pipeline**: Downloads processed results in high-quality PNG, JPEG, and WebP formats.

- **Can't**:

    - **Persistent Session Storage**: History stack is session-based; does not survive browser or workspace reloads.
    - **Vector-Based Scaling**: Operates purely on raster data; lacks SVG export or vector-path upscaling.
    - **Multi-Layer Composition**: Optimized for single-layer transformations; does not support complex masking.


------
![Duotone Editor Clip](_resources/videos/duotoneeditor.clip.webm)

![Duotone Editor Screenshot 1](_resources/images/duotone_editor_1.webp)

### Components
###### [Duotone Editor Viewer](D.q.duotoneeditor.viewer.md)
###### [Duotone Editor Components {index.jsx}](src/index.jsx)
