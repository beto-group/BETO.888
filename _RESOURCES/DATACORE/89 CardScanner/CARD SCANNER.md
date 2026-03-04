---
author: beto.group
name.official: CardScanner
version: 1.0.0
price: "0"
category:
  - creative
  - utility
tags:
  - threejs
  - webgl
  - canvas-api
  - kinetic-design
  - scanner-fx
  - procedural-ascii
desc: A dual-view kinetic card stream that utilizes real-time UV clipping and hybrid particle scanning for an X-ray data projection effect.
status: stable
complexity: advanced
id: 77
resources:
  - card_scanner_1.webp
longDesc: "CardScanner is a high-concept data visualization component that simulates a continuous, physics-based stream of information cards. It features a unique 'X-ray' scanning system where cards passing through a central beam are dynamically clipped to reveal their underlying 'ASCII' structure. This is achieved through real-time UV coordinate intersection logic and a dual-surface rendering model (Normal Image vs. Procedural ASCII). The component is powered by a hybrid particle engine combining 2D Canvas for high-intensity scanner glows and Three.js for spatial background depth. It supports interactive dragging, high-velocity inertia, and regenerative code injection, making it an ideal choice for technical dashboards or high-security aesthetic interfaces."
does: "[  {    \"title\": \"Kinetic Card Stream\",    \"children\": [      {        \"title\": \"Physics-Based Navigation\",        \"content\": \"Implements a high-inertia dragging system with velocity-based friction and infinite coordinate looping for seamless browsing.\"      },      {        \"title\": \"Dual-Surface X-Ray Projection\",        \"content\": \"Utilizes real-time UV clipping masks to transition cards between standard image surfaces and generative ASCII code views.\"      }    ]  },  {    \"title\": \"Hybrid Particle Engine\",    \"children\": [      {        \"title\": \"High-Intensity Scanner Glow\",        \"content\": \"Features a multi-layered 2D Canvas light bar with dynamic intensity pulsing and 'scan-ping' activation logic.\"      },      {        \"title\": \"3D Spatial Particles\",        \"content\": \"Integrates a Three.js background system for volumetric depth and atmospheric particle drift.\"      }    ]  },  {    \"title\": \"Generative Content\",    \"children\": [      {        \"title\": \"Live ASCII Injection\",        \"content\": \"Procedurally generates and updates technical code snippets to populate card surfaces with dynamic content.\"      },      {        \"title\": \"Intersection Event Logic\",        \"content\": \"Triggers 'scan-ping' effects and particle bursts when cards intersect with the central scanning beam.\"      }    ]  }]"
cant: '[  {    \"title\": \"Multi-Beam Scanning\",    \"content\": \"The current intersection logic is optimized for a single central vertical scanning beam; multi-beam configurations are not supported.\"  },  {    \"title\": \"OCR / Data Extraction\",    \"content\": \"The scanning effect is purely visual and generative; it does not perform optical character recognition or extract real data from images.\"  },  {    \"title\": \"Custom Card Dimensions\",    \"content\": \"Card sizing is currently hardcoded for optimal ASCII grid mapping and stream spacing; dynamic resizing via the UI is not supported.\"  }]'
version.obsidian: 1.4.11
---

### Tab: CardScanner

- **Description**: A dual-view kinetic card stream that utilizes real-time UV clipping and hybrid particle scanning for an X-ray data projection effect. It creates a high-tech, investigative aesthetic suitable for technical data browsing or security-themed UI modules.

- **Does**:
   
    - **Kinetic Card Stream**:    
        - **Physics-Based Navigation**: Implements a high-inertia dragging system with velocity-based friction and infinite coordinate looping for seamless browsing.
        - **Dual-Surface X-Ray Projection**: Utilizes real-time UV clipping masks to transition cards between standard image surfaces and generative ASCII code views.
    - **Hybrid Particle Engine**:
        - **High-Intensity Scanner Glow**: Features a multi-layered 2D Canvas light bar with dynamic intensity pulsing and 'scan-ping' activation logic.
        - **3D Spatial Particles**: Integrates a Three.js background system for volumetric depth and atmospheric particle drift.
    - **Generative Content**:
        - **Live ASCII Injection**: Procedurally generates and updates technical code snippets to populate card surfaces with dynamic content.
        - **Intersection Event Logic**: Triggers 'scan-ping' effects and particle bursts when cards intersect with the central scanning beam.

- **Can’t**:
   
    - **Multi-Beam Scanning**: The current intersection logic is optimized for a single central vertical scanning beam; multi-beam configurations are not supported.    
    - **OCR / Data Extraction**: The scanning effect is purely visual and generative; it does not perform optical character recognition or extract real data from images.
    - **Custom Card Dimensions**: Card sizing is currently hardcoded for optimal ASCII grid mapping and stream spacing; dynamic resizing via the UI is not supported.


----

![card_scanner_1.webp](_resources/images/card_scanner_1.webp)


### Components

###### [CardScanner Viewer](D.q.cardscanner.viewer.md)
