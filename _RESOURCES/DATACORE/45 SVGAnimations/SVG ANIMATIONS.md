

### Tab: SVG Animations

- **Description**: A comprehensive creative suite for both viewing and building custom animated SVG icons. It features a beautifully animated grid of pre-built icons that draw themselves into view, alongside a powerful "Build Your Own" live editor. The editor allows users to paste raw SVG code, add custom CSS, and then instantly preview, download, or even export their creation as a video.
    
- **Does**:
    - **Animated Icon Showcase**:
        - Displays a grid of SVG icons from a pre-defined library.
        - Each icon animates itself into view as the user scrolls, creating an engaging "drawing" effect.
        - Icons loop their animation on hover, and clicking an icon opens it in an enlarged, focused modal view.

    - **Live SVG Animation Editor**:
        - Provides a split-pane view with text areas for raw SVG code and additional custom CSS.
        - A "Preview" button instantly renders the input code as a live, animated icon.
        - **Self-Animating SVG Download**: Intelligently analyzes the input SVG structure, generates the necessary keyframes and animation CSS, and embeds it directly within the style tags of the SVG file for a completely self-contained, animated download.
    - **Video Export (WebM)**:
        - Utilizes the canvg library to render the SVG animation frame-by-frame onto an offscreen canvas.            
        - Captures the canvas stream using the MediaRecorder API to export the final animation as a high-quality, lightweight WebM video file, perfect for web use or presentations.

    - **Custom CSS Integration**:
        - Allows users to add their own CSS rules (like :hover effects) which are bundled into the final downloadable SVG.

- **Can’t**:
    - Edit the SVG visually (i.e., it's not a vector editor); all changes must be made via raw code input.
    - Animate SVG elements that do not have a unique class name (e.g., class="svg-elem-1"). The animation engine relies on these classes to target individual paths.
    - Export to video formats other than WebM, as this is the format natively supported by the MediaRecorder API.
    - Function properly with malformed or invalid SVG code in the live editor.




![alt text](/_RESOURCES/IMAGES/svg_animations.webp)




### Components

###### [SVG Animations Viewer](D.q.svganimations.viewer.md)

###### [SVG Animations Components](D.q.svganimations.component.md)
