---
author: beto.group
name.official: MaskedText
version: 1.0.0
price: "0"
category:
  - creative
  - visual-fx
tags:
  - css-mask
  - typography
  - grunge-fx
  - web-design
  - react
desc: A dynamic typography engine that applies high-fidelity weathered grunge masking to live text.
status: stable
complexity: advanced
id: 74
resources: [maskedtext.clip.webm, maskedtext_1.webp]
longDesc: "MaskedText is a performance-optimized typography component designed for high-impact visual headers. It utilizes CSS masking techniques (Webkit-mask-image) to overlay a complex, high-contrast grunge bitmap onto live, editable text. The component is powered by a real-time React styling engine that syncs with a dedicated GUI for immediate control over font weight, scale, transform, and color mapping. It bridges the gap between static design textures and dynamic web content, providing a weathered, industrial aesthetic with zero rendering overhead."
does: "[  {    \"title\": \"Typography Masking Engine\",    \"children\": [      {        \"title\": \"CSS Grunge Masking\",        \"content\": \"Applies a weathered 'grunge' bitmap mask to editable text using high-performance CSS mask-image properties.\"      },      {        \"title\": \"Real-Time Style Sync\",        \"content\": \"Maps React state directly to typography attributes, enabling instantaneous visual feedback for all styling changes.\"      }    ]  },  {    \"title\": \"Visual Controls\",    \"children\": [      {        \"title\": \"Dynamic Layout Logic\",        \"content\": \"Provides granular control over Font Weight (100-900), Font Size, and Text Transformations (Uppercase/Lowercase/Capitalize).\"      },      {        \"title\": \"Unified Color Mapping\",        \"content\": \"Synchronizes text and background colors with the layout engine to ensure optimal contrast and aesthetic integration.\"      }    ]  },  {    \"title\": \"Lifecycle Management\",    \"children\": [      {        \"title\": \"Full-Tab Staging\",        \"content\": \"Integrates with the Datacore Full-Tab lifecycle for edge-to-edge cinematic presentations.\"      },      {        \"title\": \"Integrated System HUD\",        \"content\": \"Features a dedicated Lil-gui configuration panel for rapid prototyping of typographic designs.\"      }    ]  }]"
cant: '[  {    \"title\": \"Custom Mask Uploads\",    \"content\": \"The current version uses a curated grunge bitmap; uploading custom mask textures through the UI is not supported.\"  },  {    \"title\": \"Multi-Layer Masking\",    \"content\": \"The engine supports a single primary mask layer per text element; complex composite masking is not supported.\"  },  {    \"title\": \"SVG Path Masking\",    \"content\": \"The system is optimized for bitmap-based pattern masking; it does not currently support vector-based SVG path clipping for text.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Masked Text

- **Description**: A performance-optimized typography component designed for high-impact visual headers. It utilizes CSS masking techniques (Webkit-mask-image) to overlay a complex, high-contrast grunge bitmap onto live, editable text. The component is powered by a real-time React styling engine that syncs with a dedicated GUI for immediate control over font weight, scale, transform, and color mapping.

- **Does**:

    - **Typography Masking Engine**: Applies high-fidelity weathered grunge masks to live, editable text.
    - **Real-Time Style Synchronization**: Maps React state directly to typography attributes for instantaneous feedback.
    - **Dynamic Layout Logic**: Precision control over font weight (100-900), scale, and temporal text transforms.
    - **Unified Color Mapping**: Synchronizes foreground and background layers for optimal contrast and integration.
    - **Full-Tab Lifecycle Staging**: Integrates with Datacore's immersion protocols for cinematic title presentations.
    - **Integrated System HUD**: Dedicated configuration panel for rapid prototyping of typographic design systems.

- **Can’t**:

    - **Custom Mask Uploads**: Currently limited to a curated internal grunge library; no UI-based texture ingestion.
    - **Multi-Layer Masking**: Supports a single primary mask layer; does not allow for complex composite masking.
    - **SVG Path Clipping**: Optimized for bitmap-based texture masking; does not support vector-path clipping logic.
    - **Independent Font Injection**: Relies on host-level typeface availability; does not bundle heavy external font files.

------
![Masked Text Clip](_resources/videos/maskedtext.clip.webm)

![Masked Text Screenshot 1](_resources/images/maskedtext_1.webp)

### Components
###### [Masked Text Viewer](D.q.maskedtext.viewer.md)
###### [Masked Text Components {index.jsx}](_RESOURCES/DATACORE/86%20MaskedText/src/index.jsx)
