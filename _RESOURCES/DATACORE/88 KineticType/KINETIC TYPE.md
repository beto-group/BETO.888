---
author: beto.group
name.official: KineticType
version: 1.0.0
price: "0"
category:
  - creative
  - visual-fx
tags:
  - threejs
  - webgl
  - kinetic-typography
  - shader-art
  - generative
desc: A dynamic 3D typography engine that maps live text textures onto complex geometric volumes via custom GLSL shaders.
status: stable
complexity: advanced
id: 76
resources: [kinetictype.clip.webm, kinetictype_1.webp]
longDesc: "KineticType is a sophisticated 3D typography visualizer that bridges the gap between 2D graphic design and 3D generative art. It features a real-time 'Canvas-to-Texture' engine that discretizes editable text into high-resolution bitmaps, which are then mapped onto complex Torus Knot geometries using custom GLSL fragment shaders. The engine supports multi-axial scroll speeds, programmable texture repetition, and depth-aware shading. Designed for motion graphics and algorithmic-themed interfaces, it provides an infinitely looping 'kinetic' aesthetic with deep interactive control over font weight, scale, and shader dynamics."
does: "[  {    \"title\": \"3D Typography Engine\",    \"children\": [      {        \"title\": \"Canvas-to-Texture Synthesis\",        \"content\": \"Generates dynamic 2D textures from live text inputs, synchronizing font properties and color mapping in real-time.\"      },      {        \"title\": \"Torus Knot Shader Mapping\",        \"content\": \"Utilizes complex Torus Knot geometry as a high-fidelity staging area for typographic shader animations.\"      }    ]  },  {    \"title\": \"Kinetic Synthesis\",    \"children\": [      {        \"title\": \"GLSL UV Scroll Shaders\",        \"content\": \"Implements custom shaders for synchronized X/Y scrolling and texture wrapping across geometric surfaces.\"      },      {        \"title\": \"Programmable Repetition\",        \"content\": \"Allows granular control over X and Y repetition factors for creating dense, intricate typographic patterns.\"      }    ]  },  {    \"title\": \"Interactive Staging\",    \"children\": [      {        \"title\": \"Live Typography HUD\",        \"content\": \"Provides Tweakpane/Lil-gui integration for instantaneous manipulation of text content, font weight, and shader speeds.\"      },      {        \"title\": \"Orbit Inspection System\",        \"content\": \"Features smooth OrbitControls for 360-degree spatial inspection of the generated kinetic sculpture.\"      }    ]  }]"
cant: '[  {    \"title\": \"Multi-Layer Type Splitting\",    \"content\": \"The current shader model applies a single unified texture mapping; independent multi-layer text splitting is not supported.\"  },  {    \"title\": \"External Geometry Imports\",    \"content\": \"The kinetic mapping is optimized for the internal Torus Knot geometry; importing external .GLB models for mapping is not supported.\"  },  {    \"title\": \"Mixed Font Families\",    \"content\": \"The engine utilizes a single font-family context for the generated texture; mixing different font families on a single mesh is not supported.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Kinetic Type

- **Description**: Kinetic Type is a sophisticated 3D typography engine that bridges 2D graphic design and 3D generative art. Utilizing a real-time "Canvas-to-Texture" pipeline, it maps dynamic typographic patterns onto complex Torus Knot geometry with synchronized GLSL scroll shaders for infinite motion.

- **Does**:

    - **Dynamic Type Synthesis**: Real-time texture generation from live text inputs with font-property synchronization.
    - **Torus Knot Shader Mapping**: Maps typographic textures onto complex geometric sculptures using high-fidelity UV shaders.
    - **Kinetic Scroll Engine**: Implements custom GLSL UV shaders for high-speed synchronized X/Y scrolling.
    - **Programmable Texture Repetition**: Granular control over texture tiling factors for dense typographic landscapes.
    - **Live Typography HUD**: Tweakpane integration for instantaneous control over font weight, scale, and motion speed.
    - **Orbit Inspection System**: Smooth coordinate-tracked OrbitControls for 360-degree spatial viewing.

- **Can't**:

    - **Multi-Layer Type Composition**: Applies a unified texture mapping; does not support independent multi-layer splitting.
    - **Custom Model Ingestion**: Mapping is optimized for internal geometries; does not support external `.GLB` or `.OBJ` meshes.
    - **Heterogeneous Font Mapping**: Uses a single font-family context; mixing different font families on a single mesh is not possible.

------
![Kinetic Type Clip](_resources/videos/kinetictype.clip.webm)

![Kinetic Type Screenshot 1](_resources/images/kinetictype_1.webp)

### Components
###### [Kinetic Type Viewer](D.q.kinetictype.viewer.md)
###### [Kinetic Type Components {index.jsx}](_RESOURCES/DATACORE/88%20KineticType/src/index.jsx)
