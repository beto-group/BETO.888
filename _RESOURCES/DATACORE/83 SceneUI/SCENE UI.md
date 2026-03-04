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
resources:
  - scene_ui_1.webp
longDesc: "SceneUI is a sophisticated 3D orchestration tool designed for showcasing user interface concepts in a spatial context. Built on Three.js and GSAP, it maps 2D UI elements (headers, charts, sidebars, cards, notifications) onto 3D planes within an interactive stage. The component features unique 'Explode' entry animations, real-time parallax camera tracking, and deep styling controls for shadows, border-radius, and layer depth. It enables designers to prototype spatial computing interfaces or create high-end dynamic dashboard presentations with zero performance overhead."
does: "[  {    \"title\": \"3D Interface Staging\",    \"children\": [      {        \"title\": \"Layered UI Composition\",        \"content\": \"Maps 10+ predefined UI layouts (Charts, Sidebars, Headers) onto interactive 3D planes with independent depth control.\"      },      {        \"title\": \"Real-Time Parallax Camera\",        \"content\": \"Implements smooth, cursor-tracked camera parallax to give depth to 2D interface designs.\"      }    ]  },  {    \"title\": \"Motion & FX Engine\",    \"children\": [      {        \"title\": \"GSAP 'Explode' Animations\",        \"content\": \"Features cinematic entry and reset animations using GSAP elastic easing for professional-grade spatial reveals.\"      },      {        \"title\": \"Procedural Asset Rendering\",        \"content\": \"Generates UI elements on-the-fly via Canvas 2D mapping, supporting real-time chart data and card styling updates.\"      }    ]  },  {    \"title\": \"Production Controls\",    \"children\": [      {        \"title\": \"Deep Styling HUB\",        \"content\": \"Provides Tweakpane/Lil-gui controls for global shadow blur, border radius, layer opacity, and spatial tilt factors.\"      },      {        \"title\": \"Dynamic Media Mapping\",        \"content\": \"Supports uploading high-res images to any UI layer, enabling custom prototype showcases with synchronized aspect ratios.\"      }    ]  }]"
cant: '[  {    \"title\": \"3D Model Imports\",    \"content\": \"The engine is designed for UI/UX staging using 2D planes; it does not support importing complex .GLB or .OBJ 3D models.\"  },  {    \"title\": \"Cross-Layer Occlusion\",    \"content\": \"While depth is simulated, the engine does not perform complex clipping/masking between overlapping animated layers.\"  },  {    \"title\": \"Real-Time Video Textures\",    \"content\": \"The current version is optimized for static image mapping and procedurally drawn UI components; live video streams are not supported on layers.\"  }]'
version.obsidian: 1.4.11
---

### Tab: SceneUI

- **Description**: An interactive 3D UI staging engine that transforms static interface layers into immersive, animated spatial scenes. It provides a cinematic way to present dashboards, protoypes, and design systems.

- **Does**:
   
    - **3D Interface Staging**:    
        - **Layered UI Composition**: Maps 10+ predefined UI layouts (Charts, Sidebars, Headers) onto interactive 3D planes with independent depth control.
        - **Real-Time Parallax Camera**: Implements smooth, cursor-tracked camera parallax to give depth to 2D interface designs.
    - **Motion & FX Engine**:
        - **GSAP 'Explode' Animations**: Features cinematic entry and reset animations using GSAP elastic easing for professional-grade spatial reveals.
        - **Procedural Asset Rendering**: Generates UI elements on-the-fly via Canvas 2D mapping, supporting real-time chart data and card styling updates.
    - **Production Controls**:
        - **Deep Styling HUB**: Provides Tweakpane/Lil-gui controls for global shadow blur, border radius, layer opacity, and spatial tilt factors.
        - **Dynamic Media Mapping**: Supports uploading high-res images to any UI layer, enabling custom prototype showcases with synchronized aspect ratios.

- **Can’t**:
   
    - **3D Model Imports**: The engine is designed for UI/UX staging using 2D planes; it does not support importing complex .GLB or .OBJ 3D models.    
    - **Cross-Layer Occlusion**: While depth is simulated, the engine does not perform complex clipping/masking between overlapping animated layers.
    - **Real-Time Video Textures**: The current version is optimized for static image mapping and procedurally drawn UI components; live video streams are not supported on layers.


----

![scene_ui_1.webp](_resources/images/scene_ui_1.webp)


### Components

###### [SceneUI Viewer](D.q.sceneui.viewer.md)
