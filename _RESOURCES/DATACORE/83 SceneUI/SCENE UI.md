---
author: beto.group
name.official: SceneUI
version: 1.0.0
price: "0"
category:
  - creative
  - visual-fx
tags:
  - threejs
  - gsap
  - webgl
  - parallax
  - ui-staging
  - orthographic-3d
desc: An interactive 3D UI staging engine that transforms static interface layers into immersive, animated spatial scenes.
status: stable
complexity: advanced
id: 71
resources: [sceneui.clip.webm, sceneui_1.webp]
longDesc: "SceneUI is a sophisticated 3D orchestration tool designed for showcasing user interface concepts in a spatial context. Built on Three.js and GSAP, it maps 2D UI elements (headers, charts, sidebars, cards, notifications) onto 3D planes within an interactive stage. The component features unique 'Explode' entry animations, real-time parallax camera tracking, and deep styling controls for shadows, border-radius, and layer depth. It enables designers to prototype spatial computing interfaces or create high-end dynamic dashboard presentations with zero performance overhead."
does: "[  {    \"title\": \"3D Interface Staging\",    \"children\": [      {        \"title\": \"Layered UI Composition\",        \"content\": \"Maps 10+ predefined UI layouts (Charts, Sidebars, Headers) onto interactive 3D planes with independent depth control.\"      },      {        \"title\": \"Real-Time Parallax Camera\",        \"content\": \"Implements smooth, cursor-tracked camera parallax to give depth to 2D interface designs.\"      }    ]  },  {    \"title\": \"Motion & FX Engine\",    \"children\": [      {        \"title\": \"GSAP 'Explode' Animations\",        \"content\": \"Features cinematic entry and reset animations using GSAP elastic easing for professional-grade spatial reveals.\"      },      {        \"title\": \"Procedural Asset Rendering\",        \"content\": \"Generates UI elements on-the-fly via Canvas 2D mapping, supporting real-time chart data and card styling updates.\"      }    ]  },  {    \"title\": \"Production Controls\",    \"children\": [      {        \"title\": \"Deep Styling HUB\",        \"content\": \"Provides Tweakpane/Lil-gui controls for global shadow blur, border radius, layer opacity, and spatial tilt factors.\"      },      {        \"title\": \"Dynamic Media Mapping\",        \"content\": \"Supports uploading high-res images to any UI layer, enabling custom prototype showcases with synchronized aspect ratios.\"      }    ]  }]"
cant: '[  {    \"title\": \"3D Model Imports\",    \"content\": \"The engine is designed for UI/UX staging using 2D planes; it does not support importing complex .GLB or .OBJ 3D models.\"  },  {    \"title\": \"Cross-Layer Occlusion\",    \"content\": \"While depth is simulated, the engine does not perform complex clipping/masking between overlapping animated layers.\"  },  {    \"title\": \"Real-Time Video Textures\",    \"content\": \"The current version is optimized for static image mapping and procedurally drawn UI components; live video streams are not supported on layers.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Scene UI

- **Description**: Scene UI is a sophisticated 3D orchestration tool designed for showcasing user interface concepts in a spatial context. Built on Three.js and GSAP, it maps 2D UI elements (headers, charts, sidebars) onto interactive 3D planes within an interactive stage, featuring cinematic "Explode" reveals and real-time parallax camera tracking.

- **Does**:

    - **3D Interface Staging**: Maps 10+ predefined UI layouts onto interactive 3D planes with independent depth control.
    - **Real-Time Parallax Camera**: Implements smooth, cursor-tracked camera parallax to add depth to 2D UI designs.
    - **GSAP 'Explode' Animations**: Features high-end elastic entry and reset animations for professional-grade spatial reveals.
    - **Procedural Asset Rendering**: Generates UI elements on-the-fly via Canvas 2D mapping for charts and data layers.
    - **Deep Styling HUB**: Provided Tweakpane controls for global shadow blur, border radius, and layer opacity.
    - **Dynamic Prototype Mapping**: Supports multi-layer image uploads for custom product showcases and mockups.

- **Can't**:

    - **3D Model Imports**: Strictly designed for UI/UX staging; does not support `.GLB` or `.OBJ` model injection.
    - **Cross-Layer Occlusion**: Depth is simulated; does not perform complex masking between overlapping animated layers.
    - **Real-Time Video Textures**: Optimized for static image mapping; does not support live video streams on UI layers.

------
![Scene UI Clip](_resources/videos/sceneui.clip.webm)

![Scene UI Screenshot 1](_resources/images/sceneui_1.webp)

### Components
###### [Scene UI Viewer](D.q.sceneui.viewer.md)
###### [Scene UI Components {index.jsx}](_RESOURCES/DATACORE/83%20SceneUI/src/index.jsx)
