---
author: beto.group
name.official: Basic Query
price: "0"
version: 1.0.0
category:
  - query builder
tags:
  - query
  - table
  - dynamic
  - path-selector
  - filtering
  - boilerplate
desc: A dynamic query tool that filters and displays vault files in a table based on a user-defined folder path.
status: stable
complexity: plug-n-play
id: 2
resources:
  - basicquery.clip.webm
  - basic_query.webp
longDesc: A foundational and lightweight component designed to demonstrate the core capabilities of Datacore's querying and rendering engine. It provides a clean, paginated table view of files within a specified vault path, serving as an excellent starting point or boilerplate for users learning to build their own custom views.
does: '[  {    "title": "Dynamic Path Querying",    "children": [      {        "content": "Features a simple input field where users can type any folder path (e.g., _OPERATION, Journal/2025)."      },      {        "content": "Reactively updates the data query in real-time as the path changes to fetch relevant pages."      }    ]  },  {    "title": "Automatic Sorting",    "children": [      {        "content": "Automatically sorts the fetched files by Creation Time ($ctime) in descending order, ensuring the newest files always appear at the top."      }    ]  },  {    "title": "Standardized Data Display",    "children": [      {        "content": "Renders a clean VanillaTable with pre-defined columns for essential metadata: Name (as a link), Created Date, Modified Date, and Tags."      },      {        "content": "Handles data mapping to ensure raw page values are correctly formatted for the table rows."      }    ]  },  {    "title": "Built-in Pagination",    "children": [      {        "content": "Utilizes the paging={true} prop of the VanillaTable component to automatically handle large lists of files, keeping the view compact and performant."      }    ]  }]'
cant: "[  {    \"title\": \"Customize Columns via UI\",    \"content\": \"The columns (Name, Created, Modified, Tags) are hardcoded in the COLUMNS constant. Users cannot add, remove, or reorder columns without editing the code directly.\"  },  {    \"title\": \"Complex Filtering\",    \"content\": \"Beyond selecting the folder path, there are no controls to filter by tag, name, or specific properties.\"  },  {    \"title\": \"Persist State\",    \"content\": \"The selected path defaults to _OPERATION every time the component is reloaded; it does not remember the user's last entry.\"  },  {    \"title\": \"Edit Data\",    \"content\": \"It is a read-only view. Users cannot modify file names, tags, or frontmatter directly from the table.\"  }]"
version.obsidian: 1.4.11
---


### Tab: Basic Query

- **Description**: A foundational and lightweight component designed to demonstrate the core capabilities of Datacore's querying and rendering engine. It provides a clean, paginated table view of files within a specified vault path, serving as an excellent starting point or boilerplate for users learning to build their own custom views.

- **Does**:
   
    - **Dynamic Path Querying**:        
        - features a simple input field where users can type any folder path (e.g., _OPERATION, Journal/2025).
        - Reactively updates the data query in real-time as the path changes to fetch relevant pages.
    - **Automatic Sorting**:
        - Automatically sorts the fetched files by **Creation Time** ($ctime) in descending order, ensuring the newest files always appear at the top.
    - **Standardized Data Display**:
        - Renders a clean VanillaTable with pre-defined columns for essential metadata: **Name** (as a link), **Created Date**, **Modified Date**, and **Tags**.
        - Handles data mapping to ensure raw page values are correctly formatted for the table rows.
    - **Built-in Pagination**:
        - Utilizes the paging={true} prop of the VanillaTable component to automatically handle large lists of files, keeping the view compact and performant.

- **Can’t**:
   
    - **Customize Columns via UI**: The columns (Name, Created, Modified, Tags) are hardcoded in the COLUMNS constant. Users cannot add, remove, or reorder columns without editing the code directly.        
    - **Complex Filtering**: Beyond selecting the folder path, there are no controls to filter by tag, name, or specific properties.
    - **Persist State**: The selected path defaults to _OPERATION every time the component is reloaded; it does not remember the user's last entry.
    - **Edit Data**: It is a read-only view. Users cannot modify file names, tags, or frontmatter directly from the table.


----

![searchquery.clip.webm](_resources/videos/searchquery.clip.webm)


![basic_query.webp](_resources/images/basic_query.webp)


### Components


###### [Basic Query Viewer](D.q.basicquery.viewer.md)

###### [Basic Query Component](D.q.basicquery.component.md)
