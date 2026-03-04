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
resources:
  - displacement_view_1.webp
longDesc: "Displacement View is a high-performance creative tool built with Three.js and custom GLSL vertex/fragment shaders. It allows users to map the luminance of any image or video source onto a 3D geometry, creating dynamic 'topographical' elevations in real-time. The component features a robust export system supporting high-bitrate MediaRecorder captures (up to 50Mbps), precise shader controls via a HUD interface, and seamless support for drag-and-drop media integration."
does: "[  {    \"title\": \"WebGL Displacement Engine\",    \"children\": [      {        \"title\": \"Custom GLSL Shaders\",        \"content\": \"Implements a high-precision vertex shader for real-time mesh elevation based on source luminance and texture sampling.\"      },      {        \"title\": \"Multi-Modal Source Support\",        \"content\": \"Seamlessly handles static images, remote video URLs (via proxy), and local file uploads with synchronized playback.\"      }    ]  },  {    \"title\": \"Creative Controls\",    \"children\": [      {        \"title\": \"Dynamic HUD Interface\",        \"content\": \"Integrates lil-gui for precise manipulation of elevation layers, displacement strength, and surface softness.\"      },      {        \"title\": \"GPU Sway Animation\",        \"content\": \"Features an auto-sway mode that animates the 3D projection for immersive, organic-feeling motion graphics.\"      }    ]  },  {    \"title\": \"Production Export\",    \"children\": [      {        \"title\": \"High-Bitrate Capture\",        \"content\": \"Built-in MediaRecorder integration supports high-fidelity video exports (up to 50Mbps) for professional production use.\"      },      {        \"title\": \"Cross-Platform Rendering\",        \"content\": \"Optimized for GPU acceleration with intelligent resolution scaling to maintain performance across different hardware configurations.\"      }    ]  }]"
cant: '[  {    \"title\": \"Custom Mesh Injection\",    \"content\": \"The current engine is strictly optimized for high-density plane geometries (400x400) and does not support importing external .obj or .gltf meshes.\"  },  {    \"title\": \"Transparent Video Export\",    \"content\": \"Due to WebGL buffer limitations and standard encoder support, video exports are strictly opaque and do not preserve alpha channels.\"  },  {    \"title\": \"Direct Audio Processing\",    \"content\": \"The displacement logic is visual-only; audio data from source videos is muted to optimize processing bandwidth for the GPU mapping.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Displacement View

- **Description**: An interactive WebGL-powered displacement mapping engine that transforms images and videos into 3D topography using custom GLSL shaders. It provides real-time topographical elevations with high-bitrate export capabilities.

- **Does**:
   
    - **WebGL Displacement Engine**:    
        - **Custom GLSL Shaders**: Implements a high-precision vertex shader for real-time mesh elevation based on source luminance and texture sampling.
        - **Multi-Modal Source Support**: Seamlessly handles static images, remote video URLs (via proxy), and local file uploads with synchronized playback.
    - **Creative Controls**:
        - **Dynamic HUD Interface**: Integrates lil-gui for precise manipulation of elevation layers, displacement strength, and surface softness.
        - **GPU Sway Animation**: Features an auto-sway mode that animates the 3D projection for immersive, organic-feeling motion graphics.
    - **Production Export**:
        - **High-Bitrate Capture**: Built-in MediaRecorder integration supports high-fidelity video exports (up to 50Mbps) for professional production use.
        - **Cross-Platform Rendering**: Optimized for GPU acceleration with intelligent resolution scaling to maintain performance across different hardware configurations.

- **Can’t**:
   
    - **Custom Mesh Injection**: The current engine is strictly optimized for high-density plane geometries (400x400) and does not support importing external .obj or .gltf meshes.    
    - **Transparent Video Export**: Due to WebGL buffer limitations and standard encoder support, video exports are strictly opaque and do not preserve alpha channels.
    - **Direct Audio Processing**: The displacement logic is visual-only; audio data from source videos is muted to optimize processing bandwidth for the GPU mapping.


----

![displacement_view_1.webp](_resources/images/displacement_view_1.webp)


### Components

###### [Displacement View Viewer](D.q.displacementview.viewer.md)
