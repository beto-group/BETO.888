

### Tab: LoadingLogo

- **Description**: A component that demonstrates a robust way to display an SVG image, featuring a smooth fade-in effect after the image has fully loaded.
  
- **Does**:

    - Uses fuzzy search (Fuse.js) to locate a specific SVG file (BETO_Logo_W_Loading.svg) anywhere in the vault.
    - Renders the SVG but keeps it invisible until the browser has finished downloading it.
    - Fades the image in smoothly once it's loaded, preventing the "pop-in" effect of a partially loaded image.
    - Dynamically loads the Fuse.js search library from a CDN if needed.

- **Can’t**:
   
    - Display any image other than the hardcoded SVG file.
    - Be customized (e.g., change size, fade speed) without editing the component's code.
    - Function without an internet connection on first run due to its dependency on the CDN-hosted Fuse.js library.


![loading_logo.webp](/_RESOURCES/IMAGES/loading_logo.webp)




### Components

###### [Loading Logo Viewer](D.q.loadinglogo.viewer.md)

###### [Loading Logo Component](D.q.loadinglogo.component.md)

