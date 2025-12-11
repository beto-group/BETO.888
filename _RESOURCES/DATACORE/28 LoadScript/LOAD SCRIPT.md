---
author: beto.group
name.official: Load Script
version: 1.3.1
price: "0"
category:
  - utility
tags:
  - script-loader
  - caching
  - esm
  - library-manager
  - developer-tool
  - offline
desc: A robust script loading utility that fetches, caches, and executes external JavaScript libraries (Classic & ESM) for offline use and performance.
status: stable
complexity: intermediate
id: 28
resources:
  - loadscript.clip.webm
  - load_script_1.webp
  - load_script_2.webp
longDesc: A comprehensive developer utility and live demonstration tool for dynamically loading external JavaScript libraries. It provides a robust, cached loading mechanism for both classic scripts and modern ESM modules, complete with a user interface to test presets, load custom URLs, and inspect the properties of successfully loaded libraries in real time.
does: "[  {    \"title\": \"Universal Script Loading\",    \"children\": [      {        \"title\": \"Classic & ESM Support\",        \"content\": \"Can load both traditional scripts (that create global variables) and modern ECMAScript Modules, automatically handling the different import mechanisms.\"      },      {        \"title\": \"URL & Local Paths\",        \"content\": \"Supports loading from both external web URLs and local file paths within the Obsidian vault.\"      }    ]  },  {    \"title\": \"Intelligent Caching & Deduplication\",    \"children\": [      {        \"title\": \"Vault Caching\",        \"content\": \"When loading a script from a URL for the first time, it saves a copy to a local cache folder (.datacore/script_cache). All subsequent loads use the fast, local cache, enabling full offline functionality.\"      },      {        \"title\": \"Global Deduplication\",        \"content\": \"Checks if a library has already been loaded (by its global variable name) and skips redundant downloads. It also tracks in-progress downloads to prevent race conditions.\"      }    ]  },  {    \"title\": \"Interactive UI & Library Explorer\",    \"children\": [      {        \"title\": \"Live Demo Interface\",        \"content\": \"The component's UI acts as a live testing ground for the script loader itself.\"      },      {        \"title\": \"Presets & Custom Loading\",        \"content\": \"Includes preset buttons to instantly load common libraries (like D3.js, Three.js, GSAP) and a form to load any custom URL as either a classic script or an ESM module.\"      },      {        \"title\": \"Real-Time Analysis\",        \"content\": \"Upon successful loading, it displays a card for the library, showing its type, URL, and a summary of its contents (e.g., number of exports, functions, and properties).\"      },      {        \"title\": \"Object Explorer\",        \"content\": \"Features an \\\"Explore\\\" button for each loaded library that opens a navigable tree view, allowing the user to drill down into the library's nested objects and properties to understand its structure.\"      }    ]  },  {    \"title\": \"Immersive Full-Tab Mode\",    \"content\": \"Designed to run in a full-pane view that takes over the entire Obsidian window, providing a dedicated interface for library management and exploration.\"  }]"
cant: '[  {    "title": "Manage CSS or Other Asset Types",    "content": "It is specifically designed for loading and executing JavaScript files (.js) and does not handle CSS stylesheets, images, or other types of assets."  },  {    "title": "Resolve Complex Module Dependencies Locally",    "content": "While it can load local ESM modules, it does not include a full module bundler or resolver. It cannot handle complex local import statements that point to other local files."  },  {    "title": "Guarantee Compatibility",    "content": "The loader executes scripts directly in the global scope. It cannot prevent conflicts if two different libraries attempt to define the same global variable."  },  {    "title": "Function Offline on First Run",    "content": "It requires an internet connection to download and cache any library that is not already present in the local cache."  }]'
version.obsidian: 1.4.11
---

### Tab: Load Script

- **Description**: A comprehensive developer utility and live demonstration tool for dynamically loading external JavaScript libraries. It provides a robust, cached loading mechanism for both classic scripts and modern ESM modules, complete with a user interface to test presets, load custom URLs, and inspect the properties of successfully loaded libraries in real time.

- **Does**:
   
    - **Universal Script Loading**:    
        - **Classic & ESM Support**: Can load both traditional scripts (that create global variables) and modern ECMAScript Modules, automatically handling the different import mechanisms.
        - **URL & Local Paths**: Supports loading from both external web URLs and local file paths within the Obsidian vault.
    - **Intelligent Caching & Deduplication**:
        - **Vault Caching**: When loading a script from a URL for the first time, it saves a copy to a local cache folder (.datacore/script_cache). All subsequent loads use the fast, local cache, enabling full offline functionality.
        - **Global Deduplication**: Checks if a library has already been loaded (by its global variable name) and skips redundant downloads. It also tracks in-progress downloads to prevent race conditions.
    - **Interactive UI & Library Explorer**:
        - **Live Demo Interface**: The component's UI acts as a live testing ground for the script loader itself.
        - **Presets & Custom Loading**: Includes preset buttons to instantly load common libraries (like D3.js, Three.js, GSAP) and a form to load any custom URL as either a classic script or an ESM module.
        - **Real-Time Analysis**: Upon successful loading, it displays a card for the library, showing its type, URL, and a summary of its contents (e.g., number of exports, functions, and properties).
        - **Object Explorer**: Features an "Explore" button for each loaded library that opens a navigable tree view, allowing the user to drill down into the library's nested objects and properties to understand its structure.
    - **Immersive Full-Tab Mode**: Designed to run in a full-pane view that takes over the entire Obsidian window, providing a dedicated interface for library management and exploration.

- **Can’t**:
   
    - **Manage CSS or Other Asset Types**: It is specifically designed for loading and executing JavaScript files (.js) and does not handle CSS stylesheets, images, or other types of assets.    
    - **Resolve Complex Module Dependencies Locally**: While it can load local ESM modules, it does not include a full module bundler or resolver. It cannot handle complex local import statements that point to other local files.
    - **Guarantee Compatibility**: The loader executes scripts directly in the global scope. It cannot prevent conflicts if two different libraries attempt to define the same global variable.
    - **Function Offline on First Run**: It requires an internet connection to download and cache any library that is not already present in the local cache.


----

![loadscript.clip.webm](_resources/videos/loadscript.clip.webm)


![load_script_1.webp](_resources/images/load_script_1.webp)


![load_script_2.webp](_resources/images/load_script_2.webp)


### Components

###### [Load Script Viewer](D.q.loadscript.viewer.md)

###### [Load Script Component](D.q.loadscript.component.md)


