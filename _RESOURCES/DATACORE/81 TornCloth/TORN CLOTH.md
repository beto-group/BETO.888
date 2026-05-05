---
author: beto.group
name.official: TornCloth
version: 1.0.0
price: "0"
category:
  - creative
  - visual-fx
tags:
  - webgl
  - threejs
  - cloth-simulation
  - physics
  - shaders
  - procedural-generation
desc: An interactive WebGL physics simulation that combines real-time cloth dynamics with procedural torn-edge paper aesthetics.
status: stable
complexity: advanced
id: 69
resources: [torncloth.clip.webm, torncloth_1.webp]
longDesc: "TornCloth is a high-fidelity visual effects engine that merges GPU-accelerated cloth physics with procedural geometry. Using custom GLSL vertex shaders, it simulates complex wind-driven ripples and fabric dynamics (Vertex-Shader Physics). Simultaneously, a fractal Brownian motion (FBM) noise system procedurally generates 'torn' or 'ragged' edges, transforming any mapped image or video into a tactile, organic material. The component includes a deep grunge rendering layer featuring grain, scratches, and vignette for authentic high-end creative production."
does: "[  {    \"title\": \"WebGL Physics & Dynamics\",    \"children\": [      {        \"title\": \"Vertex-Shader Cloth Physics\",        \"content\": \"Implements real-time wind-driven ripples and pin-point influence dynamics directly on the GPU for zero-latency motion.\"      },      {        \"title\": \"Procedural Torn Edges\",        \"content\": \"Utilizes Multi-Octave FBM noise to procedurally generate organic, ragged edges on images and video frames.\"      }    ]  },  {    \"title\": \"High-Fidelity Rendering\",    \"children\": [      {        \"title\": \"Multi-Layer Grunge FX\",        \"content\": \"Features a comprehensive effects stack including grain synthesis, procedural scratch generation, and adjustable vignettes.\"      },      {        \"title\": \"GPU Material Controls\",        \"content\": \"Integrates lil-gui for real-time manipulation of wind force, fabric detail, edge amplitude, and shadow opacity.\"      }    ]  },  {    \"title\": \"Media Integration\",    \"children\": [      {        \"title\": \"Dynamic Texture Mapping\",        \"content\": \"Seamlessly supports high-resolution images and video streams with synchronized coordinate mapping and aspect ratio preservation.\"      },      {        \"title\": \"Haptic Shadow Interaction\",        \"content\": \"Renders dynamic depth-based shadows that respond to the cloth displacement, creating an immersive, tactile visual experience.\"      }    ]  }]"
cant: '[  {    \"title\": \"Complex Mesh Collisions\",    \"content\": \"The physics engine is optimized for high-density plane simulations (64x64) and does not support collisions with external 3D geometries.\"  },  {    \"title\": \"Multiple Fabric Types\",    \"content\": \"The current shader model is fine-tuned for paper and canvas-like materials; it does not simulate specialized materials like silk, leather, or metallic mesh.\"  },  {    \"title\": \"Direct Video Export\",    \"content\": \"The component is designed for real-time interactive viewing and does not include a native internal video encoding engine for direct exports.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Torn Cloth

- **Description**: An interactive WebGL physics simulation that combines real-time cloth dynamics with procedural torn-edge paper aesthetics. It merges GPU-accelerated cloth physics with procedural geometry, using custom GLSL shaders to simulate complex wind-driven ripples and Multi-Octave FBM noise to generate organic, ragged edges on images and video frames.

- **Does**:

    - **WebGL Physics & Dynamics**: Implements real-time wind-driven ripples and pin-point influence dynamics directly on the GPU for zero-latency motion.
    - **Procedural Torn Edges**: Utilizes Multi-Octave FBM noise to procedurally generate organic, ragged edges on images and video frames.
    - **High-Fidelity Rendering**: Features a multi-layer effects stack including grain synthesis, procedural scratches, and adjustable vignettes.
    - **GPU Material Controls**: Integrates lil-gui for real-time manipulation of wind force, fabric detail, edge amplitude, and shadow opacity.
    - **Dynamic Texture Mapping**: Supports high-resolution images and video streams with synchronized coordinate mapping and aspect ratio preservation.
    - **Haptic Shadow Interaction**: Renders dynamic depth-based shadows that respond to the cloth displacement, creating an immersive, tactile visual experience.

- **Can’t**:

    - **Complex Collisions**: Optimized for high-density plane simulations; does not support collisions with external 3D geometries.
    - **Material Variety**: Fine-tuned for paper and canvas-like materials; does not simulate specialized materials like silk or leather.
    - **Native Export**: Designed for real-time interactive viewing and does not include a native internal video encoding engine.

------
![Torn Cloth Clip](_resources/videos/torncloth.clip.webm)

![Torn Cloth Screenshot 1](_resources/images/torncloth_1.webp)

### Components
###### [Torn Cloth Viewer](D.q.torncloth.viewer.md)
###### [Torn Cloth Components {index.jsx}](_RESOURCES/DATACORE/81%20TornCloth/src/index.jsx)
