---
author: beto.group
name.official: Code Editor v3
price: "0"
category:
  - integration
tags:
  - ide
  - git-client
  - terminal
  - monaco-editor
  - development
  - file-explorer
  - linter
desc: A complete in-vault IDE featuring a full Git client, integrated terminal, file explorer, and Monaco editor for professional plugin development.
status: experimental
complexity: developer
ext.dependencies:
  - system-git
  - monaco-editor
platform: desktop
id: 33.3
resources:
  - codeeditor.v3.clip.webm
  - code_editor_3_1.webp
  - code_editor_3_2.webp
longDesc: A full-featured, multi-pane Integrated Development Environment (IDE) that provides a complete Git version control client and a live code editor, all running directly inside Obsidian. It allows developers to manage a local Git repository, stage and commit changes, interact with remote repositories (like GitHub), and edit code in a sophisticated editor, creating a seamless, end-to-end development workflow within a single component.
does: "[  {    \"title\": \"Full Git Functionality\",    \"children\": [      {        \"title\": \"Repository Management\",        \"content\": \"Can initialize a new Git repository within a specified folder, or connect to and manage an existing one.\"      },      {        \"title\": \"Staging & Committing\",        \"content\": \"Provides a UI to view unstaged and staged changes, stage individual files or all changes, and write commit messages.\"      },      {        \"title\": \"Branching & Merging\",        \"content\": \"Allows users to view all local and remote branches, switch between them, create new branches, and merge branches into their current HEAD.\"      },      {        \"title\": \"Remote Interaction\",        \"content\": \"Supports adding or updating a remote repository URL (e.g., from GitHub), and can push local commits to and pull updates from the remote.\"      }    ]  },  {    \"title\": \"Live Code Editing & Prototyping\",    \"children\": [      {        \"title\": \"Multi-File Explorer\",        \"content\": \"Includes a built-in file explorer to navigate the directory structure of the connected repository, with full support for creating, renaming, moving (drag-and-drop), and deleting files and folders.\"      },      {        \"title\": \"Tabbed Code Editor\",        \"content\": \"Features a multi-tabbed interface powered by the Monaco Editor (the same editor used in VS Code), allowing multiple files to be open at once.\"      },      {        \"title\": \"Live Preview Sandbox\",        \"content\": \"Includes a dedicated preview pane that can dynamically load and render Datacore components. The preview is sandboxed to prevent it from \\\"escaping\\\" its container and interfering with the IDE's layout.\"      },      {        \"title\": \"Best-Practice Linter\",        \"content\": \"A built-in linter analyzes component code and provides real-time feedback on best practices, such as flagging the use of console.log or inline styles.\"      }    ]  },  {    \"title\": \"Integrated Terminal\",    \"content\": \"Includes a fully functional, tabbed terminal that runs shell commands directly within the specified repository's directory, enabling access to advanced command-line operations.\"  },  {    \"title\": \"Customizable Multi-Pane UI\",    \"children\": [      {        \"content\": \"The IDE features a responsive, multi-pane layout with resizable sections for the file explorer, editor, and terminal.\"      },      {        \"content\": \"It is designed to run in an immersive, full-pane \\\"Full Tab\\\" mode for a complete, distraction-free development experience.\"      }    ]  },  {    \"title\": \"Self-Contained & System-Aware\",    \"children\": [      {        \"content\": \"Automatically checks if Git is installed on the user's system and provides instructions if it is not.\"      },      {        \"content\": \"Guides users through the initial Git configuration (user.name and user.email) if not already set.\"      }    ]  }]"
cant: "[  {    \"title\": \"Function Without Git\",    \"content\": \"The component is entirely dependent on having the Git command-line tool installed and accessible in the system's PATH.\"  },  {    \"title\": \"Resolve Complex Merge Conflicts\",    \"content\": \"While it can perform merges, it does not include a graphical merge conflict resolution tool. Conflicts must be resolved manually through the editor or terminal.\"  },  {    \"title\": \"Provide a Graphical Git History\",    \"content\": \"The commit history is displayed as a simple, linear list. It does not provide a visual graph of branches and merges.\"  },  {    \"title\": \"Function Offline (For Remote Actions)\",    \"content\": \"All interactions with a remote repository (push, pull, fetch) require an active internet connection.\"  }]"
version.obsidian: 1.4.11
version: 2.0.2
---

### Tab: Code Editor v3

- **Description**: A full-featured, multi-pane Integrated Development Environment (IDE) that provides a complete Git version control client and a live code editor, all running directly inside Obsidian. It allows developers to manage a local Git repository, stage and commit changes, interact with remote repositories (like GitHub), and edit code in a sophisticated editor, creating a seamless, end-to-end development workflow within a single component.

- **Does**:
   
    - **Full Git Functionality**:    
        - **Repository Management**: Can initialize a new Git repository within a specified folder, or connect to and manage an existing one.
        - **Staging & Committing**: Provides a UI to view unstaged and staged changes, stage individual files or all changes, and write commit messages.
        - **Branching & Merging**: Allows users to view all local and remote branches, switch between them, create new branches, and merge branches into their current HEAD.
        - **Remote Interaction**: Supports adding or updating a remote repository URL (e.g., from GitHub), and can **push** local commits to and **pull** updates from the remote.
    - **Live Code Editing & Prototyping**:
        - **Multi-File Explorer**: Includes a built-in file explorer to navigate the directory structure of the connected repository, with full support for creating, renaming, moving (drag-and-drop), and deleting files and folders.
        - **Tabbed Code Editor**: Features a multi-tabbed interface powered by the **Monaco Editor** (the same editor used in VS Code), allowing multiple files to be open at once.
        - **Live Preview Sandbox**: Includes a dedicated preview pane that can dynamically load and render Datacore components. The preview is sandboxed to prevent it from "escaping" its container and interfering with the IDE's layout.
        - **Best-Practice Linter**: A built-in linter analyzes component code and provides real-time feedback on best practices, such as flagging the use of console.log or inline styles.
    - **Integrated Terminal**: Includes a fully functional, tabbed terminal that runs shell commands directly within the specified repository's directory, enabling access to advanced command-line operations.
    - **Customizable Multi-Pane UI**:
        - The IDE features a responsive, multi-pane layout with resizable sections for the file explorer, editor, and terminal.
        - It is designed to run in an immersive, full-pane "Full Tab" mode for a complete, distraction-free development experience.
    - **Self-Contained & System-Aware**:
        - Automatically checks if Git is installed on the user's system and provides instructions if it is not.
        - Guides users through the initial Git configuration (user.name and user.email) if not already set.

- **Can’t**:
   
    - **Function Without Git**: The component is entirely dependent on having the Git command-line tool installed and accessible in the system's PATH.    
    - **Resolve Complex Merge Conflicts**: While it can perform merges, it does not include a graphical merge conflict resolution tool. Conflicts must be resolved manually through the editor or terminal.
    - **Provide a Graphical Git History**: The commit history is displayed as a simple, linear list. It does not provide a visual graph of branches and merges.
    - **Function Offline (For Remote Actions)**: All interactions with a remote repository (push, pull, fetch) require an active internet connection.


----

![codeeditor.v3.clip.webm](_resources/videos/codeeditor.v3.clip.webm)


![code_editor_3_1.webp](_resources/images/code_editor_3_1.webp)


![code_editor_3_1.webp](_resources/images/code_editor_3_1.webp)



### Components

###### [Code Editor v3 Viewer](D.q.codeeditor.viewer.v3.md)

###### [Code Editor v3 Component](D.q.codeeditor.component.v3.md)

