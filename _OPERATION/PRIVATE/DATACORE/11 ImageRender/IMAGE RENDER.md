
### Tab: Image Render

- **Description**: A simple media viewer that can find and display a static image or a Lottie animation file from anywhere in the vault.

- **Does**:

    - Uses fuzzy search (via Fuse.js) to find a media file by its name, without needing the full path.
    - Correctly renders standard image formats (like PNG, JPG, GIF) using an <img> tag.
    - Automatically detects .json files and renders them as interactive Lottie animations.
    - Dynamically loads necessary libraries (Fuse.js for search, Lottie-player for animation) from a CDN when first used.

- **Can’t**:

    - The filename to render is hardcoded within the component; there's no UI to change it.
    - Requires an internet connection to download its dependencies on the first run.
    - Fuzzy search could potentially select the wrong file if multiple files have very similar names.
    - Does not provide playback controls for Lottie animations (it's set to autoplay and loop).


![[image_renderer.webp]]



### Components

###### [[d.q.imagerender.viewer|Image Render Viewer]]