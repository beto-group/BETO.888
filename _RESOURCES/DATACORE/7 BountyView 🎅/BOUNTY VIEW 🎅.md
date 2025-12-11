---
author: beto.group
name.official: Bounty View 🎅
price: "0"
category:
  - visualization
tags:
  - radial-menu
  - navigation
  - svg
  - hierarchy
  - interactive
  - mind-map
  - knowledge-graph
desc: An immersive, interactive radial menu that visualizes note headers as a multi-ring constellation for gamified navigation of knowledge bases.
status: experimental
complexity: advanced
id: 7
resources:
  - bountyview.clip.webm
  - bounty_view.webp
longDesc: A highly sophisticated, interactive radial menu designed for exploring hierarchical knowledge bases. It visualizes note connections and headers as a multi-ring constellation, offering an immersive, game-like navigation experience. The component intelligently distributes nodes using advanced geometry and supports deep traversal of linked content.
does: "[  {    \"title\": \"Radial Hierarchy Visualization\",    \"children\": [      {        \"content\": \"Renders the current context as a Central Node.\"      },      {        \"title\": \"Ring 2\",        \"content\": \"Automatically populates with specific headers (H6) from the current file.\"      },      {        \"title\": \"Ring 3\",        \"content\": \"Dynamically fetches and renders the children or sub-headers of the items in Ring 2, creating a multi-level view of the content structure.\"      }    ]  },  {    \"title\": \"Smart Geometric Layout\",    \"children\": [      {        \"content\": \"Utilizes complex geometric calculations (angleDiff, pickClosestSlot) to evenly distribute nodes across the rings, minimizing visual clutter and ensuring a balanced, aesthetic presentation.\"      },      {        \"content\": \"Features dynamic label scaling and positioning logic to ensure text remains legible regardless of the node's position on the circle.\"      }    ]  },  {    \"title\": \"Interactive Navigation\",    \"children\": [      {        \"title\": \"Drill-Down\",        \"content\": \"Clicking an outer node centers the view on that topic, loading the corresponding file (specifically looking for .namzu or .enigmas extensions) and regenerating the rings.\"      },      {        \"title\": \"History Navigation\",        \"content\": \"Maintains a navigation stack, allowing users to \\\"go back\\\" to previous layers using a middle-click or the Home button.\"      }    ]  },  {    \"title\": \"Immersive Full-Tab Experience\",    \"content\": \"Includes a ScreenModeHelper-style logic to dynamically reparent the view, allowing it to take over the entire Obsidian workspace leaf for a distraction-free interface.\"  },  {    \"title\": \"Dynamic Asset Integration\",    \"content\": \"Integrates with a helper component (ImagesPlaceholder) to dynamically fetch and render SVG icons for each node based on its name, falling back to a styled logo if no specific icon is found.\"  }]"
cant: '[  {    "title": "Edit Content",    "content": "This is strictly a navigational viewer. Users cannot rename headers, move nodes, or edit note content from within the radial view."  },  {    "title": "Display Body Text",    "content": "It abstracts the file content into structure (headers/titles). It does not display the actual body text of the notes."  },  {    "title": "Work Universally",    "content": "The current logic is heavily tailored to a specific vault structure, relying on H6 headers and specific file extensions (.namzu). It would require modification to work with standard Markdown structures."  }]'
disclaimer: '[  {    "content": "This component acts as a specific interface for the \"Bounty\" or \"Enigma\" system within the vault. Its navigation logic relies on specific naming conventions and header levels (H6) used in that dataset."  }]'
version.obsidian: 1.4.11
version: 1.8.2
---


### Tab: Bounty View

- **Description**: A highly sophisticated, interactive radial menu designed for exploring hierarchical knowledge bases. It visualizes note connections and headers as a multi-ring constellation, offering an immersive, game-like navigation experience. The component intelligently distributes nodes using advanced geometry and supports deep traversal of linked content.

- **Does**:
   
    - **Radial Hierarchy Visualization**:        
        - Renders the current context as a **Central Node**.
        - **Ring 2**: automatically populates with specific headers (H6) from the current file.
        - **Ring 3**: dynamically fetches and renders the children or sub-headers of the items in Ring 2, creating a multi-level view of the content structure.
    - **Smart Geometric Layout**:
        - Utilizes complex geometric calculations (angleDiff, pickClosestSlot) to evenly distribute nodes across the rings, minimizing visual clutter and ensuring a balanced, aesthetic presentation.
        - Features dynamic label scaling and positioning logic to ensure text remains legible regardless of the node's position on the circle.
    - **Interactive Navigation**:
        - **Drill-Down**: Clicking an outer node centers the view on that topic, loading the corresponding file (specifically looking for .namzu or .enigmas extensions) and regenerating the rings.
        - **History Navigation**: Maintains a navigation stack, allowing users to "go back" to previous layers using a middle-click or the Home button.
    - **Immersive Full-Tab Experience**:
        - Includes a ScreenModeHelper-style logic to dynamically reparent the view, allowing it to take over the entire Obsidian workspace leaf for a distraction-free interface.
    - **Dynamic Asset Integration**:
        - Integrates with a helper component (ImagesPlaceholder) to dynamically fetch and render SVG icons for each node based on its name, falling back to a styled logo if no specific icon is found.

- **Can’t**:
   
    - **Edit Content**: This is strictly a navigational viewer. Users cannot rename headers, move nodes, or edit note content from within the radial view.        
    - **Display Body Text**: It abstracts the file content into structure (headers/titles). It does not display the actual body text of the notes.
    - **Work Universally**: The current logic is heavily tailored to a specific vault structure, relying on H6 headers and specific file extensions (.namzu). It would require modification to work with standard Markdown structures.

- **Disclaimer**:
   
    - This component acts as a specific interface for the "Bounty" or "Enigma" system within the vault. Its navigation logic relies on specific naming conventions and header levels (H6) used in that dataset.


----

![bountyview.clip.webm](_resources/videos/bountyview.clip.webm)


![bounty_view.webp](_resources/images/bounty_view.webp)


### Components


###### [Bounty View Viewer](D.q.bountyview.viewer.md)

###### [Bounty View Component](D.q.bountyview.component.md)