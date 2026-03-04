---
author: beto.group
name.official: ImageStream
version: 1.0.0
price: "0"
category:
  - creative
  - visual-fx
tags:
  - webgl
  - threejs
  - instanced-mesh
  - procedural-flow
  - image-processing
desc: A high-performance WebGL image flow engine designed to stream hundreds of visual assets through procedurally animated paths.
status: stable
complexity: advanced
id: 70
resources:
  - image_stream_1.webp
longDesc: "ImageStream is a high-performance visual orchestration tool built on Three.js and custom GLSL shaders. Utilizing GPU-accelerated InstancedMesh rendering, it can simultaneously handle over 1,000 image assets across dual procedural streams (Left/Right). The engine maps assets to complex flow paths governed by speed, spread, and curve power variables, creating a cinematic 'flow' effect. It features real-time branding integration (Center Logo), rounded-corner shader mapping, and bulk asset ingestion, making it ideal for visual portfolios and high-end interactive galleries."
does: "[  {    \"title\": \"Instanced WebGL Rendering\",    \"children\": [      {        \"title\": \"High-Density Asset Management\",        \"content\": \"Supports over 1000+ image instances simultaneously with zero performance degradation using Three.js InstancedMesh logic.\"      },      {        \"title\": \"Procedural Flow Physics\",        \"content\": \"Animates assets along complex curved paths with real-time controls for speed, curve power, and coordinate squash.\"      }    ]  },  {    \"title\": \"Visual Customization\",    \"children\": [      {        \"title\": \"Dual-Stream Mapping\",        \"content\": \"Logic separates assets into independent Left and Right streams, each with adjustable grayscale mapping and spread factors.\"      },      {        \"title\": \"Real-Time Shader FX\",        \"content\": \"Features per-instance shader properties including procedurally rounded corners, transparency mapping, and aspect ratio preservation.\"      }    ]  },  {    \"title\": \"Production Workflow\",    \"children\": [      {        \"title\": \"Center Branding UI\",        \"content\": \"Integrates a dedicated center branding layer support SVG and standard image formats for hero-focused presentations.\"      },      {        \"title\": \"Bulk Media Ingestion\",        \"content\": \"Allows drag-and-drop or batch selection of multiple image files for immediate mapping into the stream flow.\"      }    ]  }]"
cant: '[  {    \"title\": \"Real-Time Video Streaming\",    \"content\": \"The instanced engine is optimized for static image processing and does not support real-time video textures for thousands of parallel instances.\"  },  {    \"title\": \"Dynamic Mesh Collisions\",    \"content\": \"Assets follow procedural mathematical paths; the engine does not perform physical inter-mesh collision detection between images.\"  },  {    \"title\": \"Native Video Animation Export\",    \"content\": \"Designed for interactive real-time viewing; the component does not include an internal ffmpeg-based video encoding suite for direct export.\"  }]'
version.obsidian: 1.4.11
---

### Tab: ImageStream

- **Description**: A high-performance WebGL image flow engine designed to stream hundreds of visual assets through procedurally animated paths. It transforms static image sets into a cinematic, interactive stream.

- **Does**:
   
    - **Instanced WebGL Rendering**:    
        - **High-Density Asset Management**: Supports over 1000+ image instances simultaneously with zero performance degradation using Three.js InstancedMesh logic.
        - **Procedural Flow Physics**: Animates assets along complex curved paths with real-time controls for speed, curve power, and coordinate squash.
    - **Visual Customization**:
        - **Dual-Stream Mapping**: Logic separates assets into independent Left and Right streams, each with adjustable grayscale mapping and spread factors.
        - **Real-Time Shader FX**: Features per-instance shader properties including procedurally rounded corners, transparency mapping, and aspect ratio preservation.
    - **Production Workflow**:
        - **Center Branding UI**: Integrates a dedicated center branding layer support SVG and standard image formats for hero-focused presentations.
        - **Bulk Media Ingestion**: Allows drag-and-drop or batch selection of multiple image files for immediate mapping into the stream flow.

- **Can’t**:
   
    - **Real-Time Video Streaming**: The instanced engine is optimized for static image processing and does not support real-time video textures for thousands of parallel instances.    
    - **Dynamic Mesh Collisions**: Assets follow procedural mathematical paths; the engine does not perform physical inter-mesh collision detection between images.
    - **Native Video Animation Export**: Designed for interactive real-time viewing; the component does not include an internal ffmpeg-based video encoding suite for direct export.


----

![image_stream_1.webp](_resources/images/image_stream_1.webp)


### Components

###### [ImageStream Viewer](D.q.imagestream.viewer.md)
