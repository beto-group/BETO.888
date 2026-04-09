---
author: beto.group
name.official: Basic View v1
price: "0"
version: 1.0.1
category:
  - utility
tags:
  - template
  - boilerplate
  - skeleton
  - starter
  - layout
  - container
desc: A minimal, styled boilerplate component serving as a blank canvas for creating new Datacore views.
status: stable
complexity: plug-n-play
id: 3.1
resources:
  - basicview.v1.clip.webm
  - basic_view_v1.webp
longDesc: A minimal, unopinionated boilerplate component that provides the essential structure for a Datacore view. It renders a clean, styled container with defined dimensions and a placeholder title, serving as the perfect "blank canvas" for developers to start building their own custom components without having to write the CSS scaffolding from scratch.
does: '[  {    "title": "Layout Scaffolding",    "children": [      {        "content": "Establishes a responsive container with 100% width and a fixed vertical height (60vh), providing a defined stage for content."      }    ]  },  {    "title": "Basic Styling",    "children": [      {        "content": "Applies a standard border (2px solid white) and rounded corners (borderRadius: 8px) to visually distinguish the component area within the Obsidian note."      }    ]  },  {    "title": "Placeholder Content",    "children": [      {        "content": "Renders a simple <h2> title element to verify that the component is mounting and rendering correctly."      }    ]  }]'
cant: '[  {    "title": "Perform Logic",    "content": "It contains no state, hooks (useState, useEffect), or data queries. It is purely a presentational shell."  },  {    "title": "Interact",    "content": "It has no buttons, inputs, or interactive elements."  },  {    "title": "Display Data",    "content": "It is not connected to the Obsidian vault or any external API."  }]'
version.obsidian: 1.4.11
---


### Tab: Basic View v1

- **Description**: A minimal, unopinionated boilerplate component that provides the essential structure for a Datacore view. It renders a clean, styled container with defined dimensions and a placeholder title, serving as the perfect "blank canvas" for developers to start building their own custom components without having to write the CSS scaffolding from scratch.

- **Does**:

    - **Layout Scaffolding**: Establishes a responsive container with 100% width and a fixed vertical height (60vh), providing a defined stage for content.
    - **Basic Styling**: Applies a standard border (2px solid white) and rounded corners (borderRadius: 8px) to visually distinguish the component area within the Obsidian note.
    - **Registration Verification**: Renders a simple `<h2>` title element to verify that the component is mounting and rendering correctly.

- **Can’t**:

    - **Business Logic**: It contains no state, hooks (useState, useEffect), or data queries. It is purely a presentational shell.
    - **User Interaction**: It has no buttons, inputs, or interactive elements.
    - **Vault Connectivity**: It is not connected to the Obsidian vault or any external API.


----

![basicview.v1.clip.webm](_resources/videos/basicview.v1.clip.webm)


![basic_view_v1.webp](_resources/images/basic_view_v1.webp)

### Components


###### [Basic View Viewer v1](D.q.basicview.viewer.v1.md)

###### [Basic View Component v1](D.q.basicview.component.v1.md)

