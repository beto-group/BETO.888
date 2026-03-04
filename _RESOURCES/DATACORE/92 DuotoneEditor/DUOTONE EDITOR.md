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
resources:
  - duotone_editor_1.webp
longDesc: "DuotoneEditor is a specialized image manipulation component that maps color values from source images to a dual-color palette using raw Canvas pixel processing. It goes beyond simple CSS filters by performing mathematical brightness-to-color synthesis for ogni pixel, ensuring high-fidelity duotone results. The component features a robust session-based history engine allowing for infinite undo/redo and timestamped state tracking. It supports multi-source content ingestion (upload vs. procedural generation) and provides a professional export pipeline for various formats. Designed as a creative utility, it combines deep technical logic with an intuitive preset-driven interface for high-impact visual design."
does: "[  {    \"title\": \"Canvas Pixel Mapping\",    \"children\": [      {        \"title\": \"Direct Data Processing\",        \"content\": \"Utilizes raw getImageData arrays to perform per-pixel brightness-to-color synthesis for high-fidelity duotone effects.\"      },      {        \"title\": \"Dual-Color Synthesis\",        \"content\": \"Calculates real-time RGB interpolation between two user-defined color hex codes based on source pixel luminance.\"      }    ]  },  {    \"title\": \"Professional History Engine\",    \"children\": [      {        \"title\": \"State-Stack Persistence\",        \"content\": \"Implements a session-based history system for infinite undo/redo navigation across all edit stages.\"      },      {        \"title\": \"Timestamped Logging\",        \"content\": \"Maintains a tactical history panel with timestamped state snapshots for precise session tracking and restoration.\"      }    ]  },  {    \"title\": \"Asset Pipeline\",    \"children\": [      {        \"title\": \"Hybrid Ingestion\",        \"content\": \"Supports multi-source image loading including local file uploads and procedural Picsum randomizer injection.\"      },      {        \"title\": \"Multi-Format Export\",        \"content\": \"Provides a high-quality download pipeline supporting PNG, JPEG, and WebP formats directly from the canvas buffer.\"      }    ]  }]"
cant: '[  {    \"title\": \"Persistent Session History\",    \"content\": \"The history stack is session-based and does not persist across browser reloads or Obsidian workspace resets.\"  },  {    \"title\": \"Advanced Vector Scaling\",    \"content\": \"The editor operates on raster pixel data; it does not provide vector-based upscaling or SVG export functionality.\"  },  {    \"title\": \"Multi-Layer Blending\",    \"content\": \"The processing engine is optimized for single-layer duotone transformations; multi-layer masking and blending are not supported.\"  }]'
version.obsidian: 1.4.11
---

### Tab: DuotoneEditor

- **Description**: A professional-grade image processing utility that utilizes Canvas API pixel mapping to create high-fidelity duotone transformations with full history support. It combines deep technical logic with a tactical preset library for creative visual design.

- **Does**:
   
    - **Canvas Pixel Mapping**:    
        - **Direct Data Processing**: Utilizes raw getImageData arrays to perform per-pixel brightness-to-color synthesis for high-fidelity duotone effects.
        - **Dual-Color Synthesis**: Calculates real-time RGB interpolation between two user-defined color hex codes based on source pixel luminance.
    - **Professional History Engine**:
        - **State-Stack Persistence**: Implements a session-based history system for infinite undo/redo navigation across all edit stages.
        - **Timestamped Logging**: Maintains a tactical history panel with timestamped state snapshots for precise session tracking and restoration.
    - **Asset Pipeline**:
        - **Hybrid Ingestion**: Supports multi-source image loading including local file uploads and procedural Picsum randomizer injection.
        - **Multi-Format Export**: Provides a high-quality download pipeline supporting PNG, JPEG, and WebP formats directly from the canvas buffer.

- **Can’t**:
   
    - **Persistent Session History**: The history stack is session-based and does not persist across browser reloads or Obsidian workspace resets.    
    - **Advanced Vector Scaling**: The editor operates on raster pixel data; it does not provide vector-based upscaling or SVG export functionality.
    - **Multi-Layer Blending**: The processing engine is optimized for single-layer duotone transformations; multi-layer masking and blending are not supported.


----

![duotone_editor_1.webp](_resources/images/duotone_editor_1.webp)


### Components

###### [DuotoneEditor Viewer](D.q.duotoneeditor.viewer.md)
