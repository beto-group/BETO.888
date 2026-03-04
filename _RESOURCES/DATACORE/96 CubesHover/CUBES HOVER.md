---
author: beto.group
name.official: CubesHover
version: 1.0.0
price: "0"
category:
  - creative
tags:
  - threejs
  - webgl
  - physics-simulation
  - interactive-3d
  - repulsion-logic
  - raycasting
desc: An interactive 3D repulsion grid system powered by Three.js that utilizes raycasted physics to create dynamic, responsive cubic topologies.
status: stable
complexity: advanced
id: 101
resources:
  - cubes_hover_1.webp
longDesc: "CubesHover is a high-fidelity 3D visualization component that simulates a reactive matrix of floating cubic entities. Built on a Three.js foundation, it employs sophisticated raycasting and inertia-based repulsion algorithms to translate user cursor movements into volumetric displacement fields. The component features a procedurally generated cubic grid with dynamic stride and gap configurations, where each node responds to proximity through synchronized position and color lerping. Designed for immersive technical showcases, it includes an integrated OrbitControls system for spatial exploration and a real-time tactical adjustment HUD (via lil-gui) for fine-tuning repulsion intensity, repulsion radius, and grid smoothing physics."
does: "[  {    \"title\": \"Procedural Grid Synthesis\",    \"children\": [      {        \"title\": \"Dynamic Stride Mapping\",        \"content\": \"Generates a symmetrical 3D cubic lattice based on variable stride counts (2x2x2 to 8x8x8) and gap intervals.\"      },      {        \"title\": \"Cubic Lerp Smoothing\",        \"content\": \"Utilizes frame-by-frame linear interpolation to ensure fluid transitions for both mesh positions and emissive color states.\"      }    ]  },  {    \"title\": \"Interactive Repulsion Physics\",    \"children\": [      {        \"title\": \"Raycasted Displacement Field\",        \"content\": \"Projects a 3D repulsion vector from the cursor intersection point, triggering localized structural deformation in the grid.\"      },      {        \"title\": \"Inertia-Based Restoration\",        \"content\": \"Implements weighted physics logic that causes displaced nodes to organically return to their origin coordinates when the repulsion field retreats.\"      }    ]  },  {    \"title\": \"Enhanced Visual HUD\",    \"children\": [      {        \"title\": \"Integrated Control Sidebar\",        \"content\": \"Provides real-time manipulation of physical constants including Repulsion Radius, Repulsion Strength, and Grid Stride via lil-gui.\"      },      {        \"title\": \"Volumetric Lighting Pipeline\",        \"content\": \"Features a synchronized ambient and point-lighting system for high-contrast spatial depth and shadow dynamics.\"      }    ]  }]"
cant: '[  {    \"title\": \"Non-Cubic Geometry Support\",    \"content\": \"The procedural generation engine is strictly optimized for cubic meshes; custom OBJ or GLTF geometry injection into the grid is not supported.\"  },  {    \"title\": \"Persistence of HUD Presets\",    \"content\": \"Adjusted physics parameters and color configurations are session-based and reset to defaults upon workspace initialization.\"  },  {    \"title\": \"Inter-Entity Collision Math\",    \"content\": \"Physics calculations focus on cursor-to-node repulsion; individual cubes do not possess collision volumes relative to one another.\"  }]'
version.obsidian: 1.4.11
---

### Tab: CubesHover

- **Description**: An interactive 3D repulsion grid system powered by Three.js that utilizes raycasted physics to create dynamic, responsive cubic topologies. It combines sophisticated spatial math with a customizable HUD for a deeply interactive technical experience.

- **Does**:
   
    - **Procedural Grid Synthesis**:    
        - **Dynamic Stride Mapping**: Generates a symmetrical 3D cubic lattice based on variable stride counts (2x2x2 to 8x8x8) and gap intervals.
        - **Cubic Lerp Smoothing**: Utilizes frame-by-frame linear interpolation to ensure fluid transitions for both mesh positions and emissive color states.
    - **Interactive Repulsion Physics**:
        - **Raycasted Displacement Field**: Projects a 3D repulsion vector from the cursor intersection point, triggering localized structural deformation in the grid.
        - **Inertia-Based Restoration**: Implements weighted physics logic that causes displaced nodes to organically return to their origin coordinates when the repulsion field retreats.
    - **Enhanced Visual HUD**:
        - **Integrated Control Sidebar**: Provides real-time manipulation of physical constants including Repulsion Radius, Repulsion Strength, and Grid Stride via lil-gui.
        - **Volumetric Lighting Pipeline**: Features a synchronized ambient and point-lighting system for high-contrast spatial depth and shadow dynamics.

- **Can’t**:
   
    - **Non-Cubic Geometry Support**: The procedural generation engine is strictly optimized for cubic meshes; custom OBJ or GLTF geometry injection into the grid is not supported.    
    - **Persistence of HUD Presets**: Adjusted physics parameters and color configurations are session-based and reset to defaults upon workspace initialization.
    - **Inter-Entity Collision Math**: Physics calculations focus on cursor-to-node repulsion; individual cubes do not possess collision volumes relative to one another.


----

![cubes_hover_1.webp](_resources/images/cubes_hover_1.webp)


### Components

###### [CubesHover Viewer](D.q.cubeshover.viewer.md)
