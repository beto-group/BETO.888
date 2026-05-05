---
author: beto.group
name.official: Displacement View
version: 1.0.0
price: "0"
category:
  - creative
  - visual-fx
tags:
  - webgl
  - threejs
  - shader
  - displacement-mapping
  - gpu-acceleration
  - video-fx
desc: An interactive WebGL-powered displacement mapping engine that transforms images and videos into 3D topography using custom GLSL shaders.
status: stable
complexity: advanced
id: 67
resources: [displacementview.clip.webm, displacementview_1.webp]
longDesc: "Displacement View is a high-performance creative tool built with Three.js and custom GLSL vertex/fragment shaders. It allows users to map the luminance of any image or video source onto a 3D geometry, creating dynamic 'topographical' elevations in real-time. The component features a robust export system supporting high-bitrate MediaRecorder captures (up to 50Mbps), precise shader controls via a HUD interface, and seamless support for drag-and-drop media integration."
does: "[  {    \"title\": \"WebGL Displacement Engine\",    \"children\": [      {        \"title\": \"Custom GLSL Shaders\",        \"content\": \"Implements a high-precision vertex shader for real-time mesh elevation based on source luminance and texture sampling.\"      },      {        \"title\": \"Multi-Modal Source Support\",        \"content\": \"Seamlessly handles static images, remote video URLs (via proxy), and local file uploads with synchronized playback.\"      }    ]  },  {    \"title\": \"Creative Controls\",    \"children\": [      {        \"title\": \"Dynamic HUD Interface\",        \"content\": \"Integrates lil-gui for precise manipulation of elevation layers, displacement strength, and surface softness.\"      },      {        \"title\": \"GPU Sway Animation\",        \"content\": \"Features an auto-sway mode that animates the 3D projection for immersive, organic-feeling motion graphics.\"      }    ]  },  {    \"title\": \"Production Export\",    \"children\": [      {        \"title\": \"High-Bitrate Capture\",        \"content\": \"Built-in MediaRecorder integration supports high-fidelity video exports (up to 50Mbps) for professional production use.\"      },      {        \"title\": \"Cross-Platform Rendering\",        \"content\": \"Optimized for GPU acceleration with intelligent resolution scaling to maintain performance across different hardware configurations.\"      }    ]  }]"
cant: '[  {    \"title\": \"Custom Mesh Injection\",    \"content\": \"The current engine is strictly optimized for high-density plane geometries (400x400) and does not support importing external .obj or .gltf meshes.\"  },  {    \"title\": \"Transparent Video Export\",    \"content\": \"Due to WebGL buffer limitations and standard encoder support, video exports are strictly opaque and do not preserve alpha channels.\"  },  {    \"title\": \"Direct Audio Processing\",    \"content\": \"The displacement logic is visual-only; audio data from source videos is muted to optimize processing bandwidth for the GPU mapping.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Displacement View

- **Description**: A high-performance creative tool built with Three.js and custom GLSL vertex/fragment shaders. It allows users to map the luminance of any image or video source onto a 3D geometry, creating dynamic "topographical" elevations in real-time. The component features a robust export system supporting high-bitrate MediaRecorder captures, precise shader controls via a HUD interface, and seamless support for drag-and-drop media integration.

- **Does**:

    - **WebGL Displacement Engine**: Implements a high-precision vertex shader for real-time mesh topography based on luminance.
    - **Multi-Modal Source Support**: Seamlessly maps images, remote video URLs, and local file uploads to 3D geometry.
    - **Dynamic HUD Interface**: Tweakpane/Lil-gui integration for precise manipulation of elevation and surface softness.
    - **GPU Sway Animation**: Features an automated sway mode for organic-feeling procedural motion graphics.
    - **Production Export Pipeline**: Built-in high-bitrate video capture (up to 50Mbps) for professional grade output.
    - **GPU Acceleration**: Highly optimized vertex processing with intelligent resolution scaling for hardware efficiency.

- **Can’t**:

    - **Custom Mesh Ingestion**: Optimized for high-density primitive planes; does not support `.GLB` or `.OBJ` imports.
    - **Transparent Exports**: Video captures are opaque; does not preserve alpha channel transparency in rendered output.
    - **Audio Processing**: Logic is visual-only; source audio is excluded to prioritize GPU vertex bandwidth.

------
![Displacement View Clip](_resources/videos/displacementview.clip.webm)

![Displacement View Screenshot 1](_resources/images/displacementview_1.webp)

### Components
###### [Displacement View Viewer](D.q.displacementview.viewer.md)
###### [Displacement View Components {index.jsx}](_RESOURCES/DATACORE/79%20DisplacementView/src/index.jsx)
