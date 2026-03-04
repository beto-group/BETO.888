---
author: beto.group
name.official: DitherPro
version: 1.0.0
price: "0"
category:
  - creative
  - visual-fx
tags:
  - dithering
  - halftone
  - ascii-art
  - svg-mapping
  - tweakpane
  - canvas-api
desc: A professional-grade image dithering and geometric mapping engine featuring 23+ algorithms and custom SVG path support.
status: stable
complexity: advanced
id: 68
resources:
  - dither_pro_1.webp
longDesc: "DitherPro is a sophisticated creative utility for generating stylized raster effects. It combines traditional dithering techniques with modern geometric mapping, allowing users to transform images into complex patterns of 25+ primitive shapes (gears, ghosts, lightning) or custom-injected SVG paths. Powered by a high-performance Canvas 2D engine and Tweakpane HUD, it offers real-time control over contrast, cell density, and complex 'flow field' or 'glitch' displacement algorithms, making it an essential tool for digital artists and motion designers."
does: "[  {    \"title\": \"Advanced Dithering Engine\",    \"children\": [      {        \"title\": \"23+ Procedural Algorithms\",        \"content\": \"Includes diverse mapping modes such as Halftone, Flow Field, Edge Detection, CRT Scanline, and Bio-Organic cellular layouts.\"      },      {        \"title\": \"Luminance-to-Geometry Mapping\",        \"content\": \"Maps pixel data to geometric properties including scale, rotation, opacity, and displacement intensity in real-time.\"      }    ]  },  {    \"title\": \"Geometric Primitives & SVGs\",    \"children\": [      {        \"title\": \"25+ Built-in Shape Primitives\",        \"content\": \"Features a wide library of shapes from standard polygons to organic forms like leaves, flowers, and custom shurikens.\"      },      {        \"title\": \"Custom SVG Path Injection\",        \"content\": \"Allows users to upload or drag-and-drop .svg files to use custom vector paths as the primary dithering primitive.\"      }    ]  },  {    \"title\": \"Creative Production Tools\",    \"children\": [      {        \"title\": \"Tweakpane HUD Integration\",        \"content\": \"Provides a professional-grade control panel for fine-tuning grid spacing, contrast factors, and algorithm-specific parameters.\"      },      {        \"title\": \"High-Resolution Raster Export\",        \"content\": \"Supports direct PNG export of the processed canvas for use in external production environments.\"      }    ]  }]"
cant: '[  {    \"title\": \"Live Video Processing\",    \"content\": \"The current iteration is optimized for high-resolution static images and does not support real-time video stream processing.\"  },  {    \"title\": \"Multi-Path SVG Support\",    \"content\": \"Path mapping is limited to a single SVG path at a time; complex multi-element SVGs must be flattened into a single path for injection.\"  },  {    \"title\": \"Direct Vector PDF Export\",    \"content\": \"While the input can be vector-based, the final output is rendered to a raster canvas and can only be exported as a PNG image.\"  }]'
version.obsidian: 1.4.11
---

### Tab: DitherPro

- **Description**: A professional-grade image dithering and geometric mapping engine featuring 23+ algorithms and custom SVG path support. It transforms static images into complex geometric patterns via real-time luminance mapping.

- **Does**:
   
    - **Advanced Dithering Engine**:    
        - **23+ Procedural Algorithms**: Includes diverse mapping modes such as Halftone, Flow Field, Edge Detection, CRT Scanline, and Bio-Organic cellular layouts.
        - **Luminance-to-Geometry Mapping**: Maps pixel data to geometric properties including scale, rotation, opacity, and displacement intensity in real-time.
    - **Geometric Primitives & SVGs**:
        - **25+ Built-in Shape Primitives**: Features a wide library of shapes from standard polygons to organic forms like leaves, flowers, and custom shurikens.
        - **Custom SVG Path Injection**: Allows users to upload or drag-and-drop .svg files to use custom vector paths as the primary dithering primitive.
    - **Creative Production Tools**:
        - **Tweakpane HUD Integration**: Provides a professional-grade control panel for fine-tuning grid spacing, contrast factors, and algorithm-specific parameters.
        - **High-Resolution Raster Export**: Supports direct PNG export of the processed canvas for use in external production environments.

- **Can’t**:
   
    - **Live Video Processing**: The current iteration is optimized for high-resolution static images and does not support real-time video stream processing.    
    - **Multi-Path SVG Support**: Path mapping is limited to a single SVG path at a time; complex multi-element SVGs must be flattened into a single path for injection.
    - **Direct Vector PDF Export**: While the input can be vector-based, the final output is rendered to a raster canvas and can only be exported as a PNG image.


----

![dither_pro_1.webp](_resources/images/dither_pro_1.webp)


### Components

###### [DitherPro Viewer](D.q.ditherpro.viewer.md)
