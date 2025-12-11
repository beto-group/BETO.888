---
author: beto.group
name.official: Image Render
price: "0"
category:
  - visualization
tags:
  - image
  - lottie
  - search
  - media-viewer
  - caching
  - animation
  - cdn
desc: A resilient media renderer that uses fuzzy search to locate and display images or Lottie animations without requiring exact file paths.
status: stable
complexity: plug-n-play
ext.dependencies:
  - fuse-js
  - lottie-player
id: 11
resources:
  - imagerender.clip.webm
  - image_render.webp
longDesc: A smart, reusable, and resilient media rendering component designed to display images or Lottie animations without requiring a hardcoded file path. By accepting a fileName prop, it can be easily configured to render any media file in the vault. It uses fuzzy searching to locate the file, making it highly resistant to broken links, and dynamically loads and caches its own dependencies for improved performance and offline availability.
does: '[  {    "title": "Reusable & Prop-Driven",    "content": "Can be easily reused throughout a vault by passing a fileName prop to the component, allowing it to display different images or animations with each use."  },  {    "title": "Fuzzy File Search",    "content": "Instead of a full path, it only requires a filename. It then uses the Fuse.js library to perform a fuzzy search across the entire vault to find the best matching file, making it highly resistant to broken links, and robust against moved or renamed files."  },  {    "title": "Dual Media Support",    "content": "Renders both standard image formats (like PNG, GIF, JPG) and Lottie animations from .json files, automatically detecting the file type based on the extension."  },  {    "title": "Dynamic Dependency Loading",    "content": "It intelligently checks if required libraries (Fuse.js for searching, lottie-player for animations) are available and loads them on-demand from a CDN if they are not."  },  {    "title": "Intelligent Script Caching",    "content": "When it downloads a library from a URL for the first time, it saves a copy to a local cache folder (.datacore/script_cache) in the vault. All subsequent loads are fast and work offline."  },  {    "title": "Responsive & Centered Display",    "content": "The component is designed to fill its container while ensuring the image or animation is properly centered and scaled to fit (object-fit: contain)."  },  {    "title": "Graceful Loading State",    "content": "Displays a \"Loading media...\" indicator while it searches for the file and loads its dependencies."  }]'
cant: "[  {    \"title\": \"Render other media types\",    \"content\": \"It is specifically designed for standard images and Lottie JSON files. It cannot render videos, audio, PDFs, or other file types.\"  },  {    \"title\": \"Provide Animation Controls\",    \"content\": \"For Lottie animations, it is hard-coded to loop and autoplay. It does not provide any UI to pause, rewind, or change the animation's speed.\"  },  {    \"title\": \"Disambiguate Multiple Matches\",    \"content\": \"The fuzzy search logic will return the single best match it finds. If multiple files in the vault have very similar names, it may not always select the one the user intended.\"  },  {    \"title\": \"Function Offline on First Run\",    \"content\": \"It requires an internet connection the very first time it runs in a vault to download and cache its external script dependencies (Fuse.js and lottie-player). All subsequent uses are fully offline-capable.\"  }]"
version.obsidian: 1.4.11
version: 1.1.1
---

### Tab: Image Render

- **Description**: A smart, reusable, and resilient media rendering component designed to display images or Lottie animations without requiring a hardcoded file path. By accepting a fileName prop, it can be easily configured to render any media file in the vault. It uses fuzzy searching to locate the file, making it highly resistant to broken links, and dynamically loads and caches its own dependencies for improved performance and offline availability.

- **Does**:

    - **Reusable & Prop-Driven**: Can be easily reused throughout a vault by passing a fileName prop to the component, allowing it to display different images or animations with each use.        
    - **Fuzzy File Search**: Instead of a full path, it only requires a filename. It then uses the Fuse.js library to perform a fuzzy search across the entire vault to find the best matching file, making it robust against moved or renamed files.
    - **Dual Media Support**: Renders both standard image formats (like PNG, GIF, JPG) and Lottie animations from .json files, automatically detecting the file type based on the extension.
    - **Dynamic Dependency Loading**: It intelligently checks if required libraries (Fuse.js for searching, lottie-player for animations) are available and loads them on-demand from a CDN if they are not.
    - **Intelligent Script Caching**: When it downloads a library from a URL for the first time, it saves a copy to a local cache folder (.datacore/script_cache) in the vault. All subsequent loads are fast and work offline.
    - **Responsive & Centered Display**: The component is designed to fill its container while ensuring the image or animation is properly centered and scaled to fit (object-fit: contain).
    - **Graceful Loading State**: Displays a "Loading media..." indicator while it searches for the file and loads its dependencies.

- **Can’t**:
   
    - **Render other media types**: It is specifically designed for standard images and Lottie JSON files. It cannot render videos, audio, PDFs, or other file types.    
    - **Provide Animation Controls**: For Lottie animations, it is hard-coded to loop and autoplay. It does not provide any UI to pause, rewind, or change the animation's speed.
    - **Disambiguate Multiple Matches**: The fuzzy search logic will return the single best match it finds. If multiple files in the vault have very similar names, it may not always select the one the user intended.
    - **Function Offline on First Run**: It requires an internet connection the very first time it runs in a vault to download and cache its external script dependencies (Fuse.js and lottie-player). All subsequent uses are fully offline-capable.


----

![imagerender.clip.webm](_resources/videos/imagerender.clip.webm)


![image_render.webp](image_render.webp)



### Components

###### [Image Render Viewer](D.q.imagerender.viewer.md)

###### [Image Render Component](D.q.imagerender.component.md)