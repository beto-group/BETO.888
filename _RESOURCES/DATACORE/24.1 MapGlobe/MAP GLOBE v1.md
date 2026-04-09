---
author: beto.group
name.official: Map Globe v1
price: "0"
category:
  - visualization
tags:
  - interactive
  - 3d
  - globe
  - cdn
  - offline
  - caching
  - earth
  - webgl
desc: A visually stunning, interactive 3D globe powered by Globe.gl that caches its own assets and dependencies for offline use.
status: stable
complexity: plug-n-play
ext.dependencies:
  - three-js
  - globe-js
id: 24.1
resources:
  - mapglobe.v1.clip.webm
  - map_globe_v1.webp
longDesc: A visually stunning and performant component that renders a fully interactive, auto-rotating 3D globe directly within an Obsidian note. Built with Three.js and Globe.gl, it is designed for both immersive viewing and offline use by intelligently loading and caching its own dependencies and assets.
does: "[  {    \"title\": \"Renders an Interactive 3D Globe\",    \"content\": \"Displays a high-quality 3D model of the Earth, complete with a \\\"blue marble\\\" texture, a bump map for realistic topology, and a glowing purple atmosphere.\"  },  {    \"title\": \"Dynamic Dependency & Asset Management\",    \"children\": [      {        \"title\": \"On-Demand Script Loading\",        \"content\": \"Automatically checks if Three.js and Globe.gl are available and dynamically loads them from a CDN if needed.\"      },      {        \"title\": \"Local Asset Caching\",        \"content\": \"On its first run, it fetches the required texture images (for the globe's surface and topology) and saves them to a local cache folder (.datacore/image_cache) within the vault.\"      },      {        \"title\": \"Full Offline Capability\",        \"content\": \"After the initial setup, all subsequent loads use the cached scripts and images, allowing the component to work perfectly without an internet connection and load significantly faster.\"      }    ]  },  {    \"title\": \"Immersive User Experience\",    \"children\": [      {        \"content\": \"The globe features continuous, gentle auto-rotation.\"      },      {        \"content\": \"Users can freely interact with the globe by panning and zooming the camera with their mouse.\"      },      {        \"content\": \"Designed to run primarily in a \\\"Full-Tab Mode\\\" that takes over the entire Obsidian pane for an immersive, focused experience.\"      }    ]  },  {    \"title\": \"Flexible Display\",    \"content\": \"Includes a \\\"Compact Mode\\\" that acts as a placeholder within a note, allowing the user to enter the full-tab view on demand.\"  }]"
cant: "[  {    \"title\": \"Visualize Vault Data\",    \"content\": \"This component is a visual centerpiece and does not plot any notes, tags, links, or other data from the vault onto the globe's surface.\"  },  {    \"title\": \"Be Customized via Props\",    \"content\": \"The appearance and behavior of the globe, such as the textures, rotation speed, and initial camera position, are hard-coded and cannot be configured through component properties.\"  },  {    \"title\": \"Function Offline on First Run\",    \"content\": \"It requires an active internet connection the very first time it runs to download and cache both its script dependencies and texture images. All subsequent uses are fully offline-capable.\"  },  {    \"title\": \"Provide Advanced Globe Features\",    \"content\": \"It renders a base globe and does not include more advanced Globe.gl features like plotting arcs, points, country polygons, or other data overlays.\"  }]"
version.obsidian: 1.4.11
version: 1.0.3
---

### Tab: Map Globe v1

- **Description**: A visually stunning and performant component that renders a fully interactive, auto-rotating 3D globe directly within an Obsidian note. Built with Three.js and Globe.gl, it is designed for both immersive viewing and offline use by intelligently loading and caching its own dependencies and assets.

- **Does**:

    - **Renders an Interactive 3D Globe**: Displays a high-quality 3D model of the Earth, complete with a "blue marble" texture, a bump map for realistic topology, and a glowing purple atmosphere.
    - **Dynamic Dependency & Asset Management**:
        - **On-Demand Script Loading**: Automatically checks if Three.js and Globe.gl are available and dynamically loads them from a CDN if needed.
        - **Local Asset Caching**: On its first run, it fetches the required texture images (for the globe's surface and topology) and saves them to a local cache folder (.datacore/image_cache) within the vault.
        - **Full Offline Capability**: After the initial setup, all subsequent loads use the cached scripts and images, allowing the component to work perfectly without an internet connection and load significantly faster.
    - **Immersive User Experience**:
        - The globe features continuous, gentle auto-rotation.
        - Users can freely interact with the globe by panning and zooming the camera with their mouse.
        - Designed to run primarily in a "Full-Tab Mode" that takes over the entire Obsidian pane for an immersive, focused experience.
    - **Flexible Display**: Includes a "Compact Mode" that acts as a placeholder within a note, allowing the user to enter the full-tab view on demand.

- **Can’t**:

    - **Vault Data Visualization**: This component is a visual centerpiece and does not plot any notes, tags, links, or other data from the vault onto the globe's surface.
    - **Deep Prop Customization**: The appearance and behavior of the globe, such as the textures, rotation speed, and initial camera position, are hard-coded.
    - **Offline Setup**: It requires an active internet connection the very first time it runs to download and cache both its script dependencies and texture images.
    - **Advanced Data Overlays**: It renders a base globe and does not include plotting arcs, points, or country polygons.


----

![mapglobe.v1.clip.webm](_resources/videos/mapglobe.v1.clip.webm)


![map_globe_v1.webp](_resources/images/map_globe_v1.webp)



### Components

###### [Map Globe Viewer v1](D.q.mapglobe.viewer.v1.md)

###### [Map Globe Component v1](D.q.mapglobe.component.v1.md)
