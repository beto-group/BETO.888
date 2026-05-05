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
resources: [imagestream.clip.webm, imagestream_1.webp]
longDesc: "ImageStream is a high-performance visual orchestration tool built on Three.js and custom GLSL shaders. Utilizing GPU-accelerated InstancedMesh rendering, it can simultaneously handle over 1,000 image assets across dual procedural streams (Left/Right). The engine maps assets to complex flow paths governed by speed, spread, and curve power variables, creating a cinematic 'flow' effect. It features real-time branding integration (Center Logo), rounded-corner shader mapping, and bulk asset ingestion, making it ideal for visual portfolios and high-end interactive galleries."
does: "[  {    \"title\": \"Instanced WebGL Rendering\",    \"children\": [      {        \"title\": \"High-Density Asset Management\",        \"content\": \"Supports over 1000+ image instances simultaneously with zero performance degradation using Three.js InstancedMesh logic.\"      },      {        \"title\": \"Procedural Flow Physics\",        \"content\": \"Animates assets along complex curved paths with real-time controls for speed, curve power, and coordinate squash.\"      }    ]  },  {    \"title\": \"Visual Customization\",    \"children\": [      {        \"title\": \"Dual-Stream Mapping\",        \"content\": \"Logic separates assets into independent Left and Right streams, each with adjustable grayscale mapping and spread factors.\"      },      {        \"title\": \"Real-Time Shader FX\",        \"content\": \"Features per-instance shader properties including procedurally rounded corners, transparency mapping, and aspect ratio preservation.\"      }    ]  },  {    \"title\": \"Production Workflow\",    \"children\": [      {        \"title\": \"Center Branding UI\",        \"content\": \"Integrates a dedicated center branding layer support SVG and standard image formats for hero-focused presentations.\"      },      {        \"title\": \"Bulk Media Ingestion\",        \"content\": \"Allows drag-and-drop or batch selection of multiple image files for immediate mapping into the stream flow.\"      }    ]  }]"
cant: '[  {    \"title\": \"Real-Time Video Streaming\",    \"content\": \"The instanced engine is optimized for static image processing and does not support real-time video textures for thousands of parallel instances.\"  },  {    \"title\": \"Dynamic Mesh Collisions\",    \"content\": \"Assets follow procedural mathematical paths; the engine does not perform physical inter-mesh collision detection between images.\"  },  {    \"title\": \"Native Video Animation Export\",    \"content\": \"Designed for interactive real-time viewing; the component does not include an internal ffmpeg-based video encoding suite for direct export.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Image Stream

- **Description**: A high-performance WebGL image flow engine designed to stream hundreds of visual assets through procedurally animated paths. Utilizing GPU-accelerated InstancedMesh rendering, it can simultaneously handle over 1,000 image assets across dual procedural streams. The engine maps assets to complex flow paths governed by speed, spread, and curve power variables.

- **Does**:

    - **Instanced WebGL Rendering**: Orchestrates over 1,000 image instances simultaneously using optimized GPU logic with zero performance degradation.
    - **Procedural Flow Physics**: Animates assets along complex spatial paths with real-time controls for speed, spread, and curve power.
    - **Dual-Stream Mapping**: Separates assets into independent Left and Right streams, each with adjustable grayscale mapping and spread factors.
    - **Real-Time Shader FX**: Features procedurally rounded corners, transparency mapping, and aspect ratio preservation per-instance.
    - **Center Branding Interface**: Dedicated UI layer for SVG logos or hero-focused branding within the flow.
    - **Bulk Media Ingestion**: Procedural loading pipeline for rapid mapping of massive image sets via drag-and-drop or batch selection.

- **Can’t**:

    - **Video Streaming**: Optimized for static assets; does not support real-time video textures for thousands of parallel instances.
    - **Physical Collisions**: Assets follow mathematical paths; the engine does not perform physical inter-mesh collision detection.
    - **Native Animation Export**: Focused on interactive real-time viewing; the component does not include an internal video encoding suite.

------
![Image Stream Clip](_resources/videos/imagestream.clip.webm)

![Image Stream Screenshot 1](_resources/images/imagestream_1.webp)

### Components
###### [Image Stream Viewer](D.q.imagestream.viewer.md)
###### [Image Stream Components {index.jsx}](_RESOURCES/DATACORE/82%20ImageStream/src/index.jsx)
