---
author: beto.group
name.official: Kanban
price: "0"
category:
  - custom views
tags:
  - kanban
  - task-management
  - file-sync
  - drag-and-drop
  - organization
  - keyboard-shortcuts
  - markdown-parser
desc: A powerful, file-driven Kanban board where columns act as files and cards as sections, featuring full drag-and-drop reordering that syncs directly to markdown.
status: stable
complexity: intermediate
platform: desktop
id: 10
resources:
  - kanban.clip.webm
  - kanban_1.webp
longDesc: A powerful, file-driven Kanban board that visualizes markdown file sections as fully interactive cards. This advanced version introduces complete intra-lane reordering, allowing users to visually sort items within a column and have those changes written directly back to the source file. With an enhanced UI, including intuitive drop zones and a global file drop target, it provides a seamless, tactile interface for organizing content across multiple notes.
does: "[  {    \"title\": \"File-as-Column System\",    \"content\": \"Each column on the board represents a specific markdown file. An improved \\\"Add Column\\\" modal features a \\\"Quick Add\\\" section, which automatically lists available files from a predefined knowledge folder for rapid board setup.\"  },  {    \"title\": \"Section-as-Item Parsing\",    \"content\": \"Intelligently parses each linked markdown file, splitting the content after a #### AENIGMAS marker into individual cards based on --- separators.\"  },  {    \"title\": \"Full Live File Manipulation\",    \"content\": \"All drag-and-drop actions on the board directly modify the source markdown files in real-time:\",    \"children\": [      {        \"title\": \"Inter-Lane Moving\",        \"content\": \"Dragging a card from one column to another moves its text content from the source file to the target file.\"      },      {        \"title\": \"Intra-Lane Reordering\",        \"content\": \"Dragging and dropping a card within the same column physically reorders the sequence of text blocks in the corresponding markdown file, ensuring the visual order is always persisted.\"      },      {        \"title\": \"Inline Editing, Adding & Removing\",        \"content\": \"Supports live editing of card content, adding new cards (which appends content to the file), and deleting cards (which removes content from the file).\"      }    ]  },  {    \"title\": \"Advanced Drag-and-Drop UI\",    \"children\": [      {        \"title\": \"Intuitive Drop Indicators\",        \"content\": \"Visual \\\"Drop Here\\\" zones appear between cards when dragging, allowing for precise placement and reordering.\"      },      {        \"title\": \"Global File Drop Zone\",        \"content\": \"Users can drag markdown files directly from Obsidian's file explorer and drop them onto the board to instantly create new columns.\"      },      {        \"title\": \"Column Reordering\",        \"content\": \"The columns themselves can be reordered via drag-and-drop.\"      }    ]  },  {    \"title\": \"Robust State Persistence\",    \"content\": \"Automatically saves the entire board state, including the order of columns and items, to a dedicated cache file (.datacore/dc.kanban/kanban-cache.json). This ensures the board's structure and layout are fully preserved across sessions.\"  },  {    \"title\": \"Immersive Full-Tab Mode\",    \"content\": \"Retains the ability to expand into a full-pane view for a focused, distraction-free Kanban experience.\"  }]"
cant: '[  {    "title": "Create New Files",    "content": "The component adds existing files as columns but does not have a feature to create new markdown files from within the UI."  },  {    "title": "Handle Complex Markdown within Items",    "content": "It treats each section between --- separators as a plain text block. It may not reliably parse or preserve complex internal structures like nested lists, frontmatter, or Dataview queries within a single card."  },  {    "title": "Merge External Changes",    "content": "Since it directly writes to files, any edits made to a file outside of the Kanban view may be overwritten by subsequent actions on the board. There is no conflict resolution."  },  {    "title": "Persist Non-File-Backed Columns",    "content": "While it is possible to have columns that are not linked to a file, the items within these columns are only stored in the session cache and are not saved to any markdown file."  }]'
version.obsidian: 1.4.11
version: 3.0.3
---

### Tab: Kanban

- **Description**: A powerful, file-driven Kanban board that visualizes markdown file sections as fully interactive cards. This advanced version introduces complete intra-lane reordering, allowing users to visually sort items within a column and have those changes written directly back to the source file. With an enhanced UI, including intuitive drop zones and a global file drop target, it provides a seamless, tactile interface for organizing content across multiple notes.

- **Does**:

    - **File-as-Column System**: Each column on the board represents a specific markdown file. An improved "Add Column" modal features a "Quick Add" section, which automatically lists available files from a predefined knowledge folder for rapid board setup.        
    - **Section-as-Item Parsing**: Intelligently parses each linked markdown file, splitting the content after a #### AENIGMAS marker into individual cards based on --- separators.
    - **Full Live File Manipulation**: All drag-and-drop actions on the board directly modify the source markdown files in real-time:
        - **Inter-Lane Moving**: Dragging a card from one column to another moves its text content from the source file to the target file.
        - **Intra-Lane Reordering**: Dragging and dropping a card within the same column physically reorders the sequence of text blocks in the corresponding markdown file, ensuring the visual order is always persisted.
        - **Inline Editing, Adding & Removing**: Supports live editing of card content, adding new cards (which appends content to the file), and deleting cards (which removes content from the file).
    - **Advanced Drag-and-Drop UI**:
        - **Intuitive Drop Indicators**: Visual "Drop Here" zones appear between cards when dragging, allowing for precise placement and reordering.
        - **Global File Drop Zone**: Users can drag markdown files directly from Obsidian's file explorer and drop them onto the board to instantly create new columns.
        - **Column Reordering**: The columns themselves can be reordered via drag-and-drop.
    - **Robust State Persistence**: Automatically saves the entire board state, including the order of columns and items, to a dedicated cache file (.datacore/dc.kanban/kanban-cache.json). This ensures the board's structure and layout are fully preserved across sessions.
    - **Immersive Full-Tab Mode**: Retains the ability to expand into a full-pane view for a focused, distraction-free Kanban experience.

- **Can’t**:
    
    - **Create New Files**: The component adds existing files as columns but does not have a feature to create new markdown files from within the UI.        
    - **Handle Complex Markdown within Items**: It treats each section between --- separators as a plain text block. It may not reliably parse or preserve complex internal structures like nested lists, frontmatter, or Dataview queries within a single card.
    - **Merge External Changes**: Since it directly writes to files, any edits made to a file outside of the Kanban view may be overwritten by subsequent actions on the board. There is no conflict resolution.
    - **Persist Non-File-Backed Columns**: While it is possible to have columns that are not linked to a file, the items within these columns are only stored in the session cache and are not saved to any markdown file.


-----

![kanban.clip.webm](_resources/videos/kanban.clip.webm)


![kanban_1.webp](_resources/images/kanban_1.webp)


### Components

###### [Kanban Viewer](D.q.kanban.viewer.md)

###### [Kanban Component](D.q.kanban.component.md)

