---
author: beto.group
name.official: Datacore Importer
price: "0"
category:
  - utility
tags:
  - importer
  - cross-vault
  - installer
  - file-management
  - system
  - developer-tool
desc: An advanced system utility that automates the discovery and transfer of Datacore components between different Obsidian vaults on the same machine.
status: stable
complexity: advanced
ext.dependencies:
  - node-js
platform: desktop
id: 39
resources:
  - datacoreimporter.clip.webm
  - datacore_importer_1.webp
  - datacore_importer_2.webp
longDesc: An advanced developer and power-user utility that allows you to browse and import Datacore components from a central "showcase" vault into any other Obsidian vault on your system. It automates the entire process of discovering, copying, and providing a ready-to-use code snippet for the imported component, creating a seamless cross-vault workflow.
does: "[  {    \"title\": \"Dynamic Component Discovery\",    \"children\": [      {        \"content\": \"Automatically reads and parses a central DATACORE.showcase.md file to build a rich, categorized list of available components.\"      },      {        \"content\": \"Displays components with special tags like { NEW }, { PROTOTYPE }, and { FEATURED } to highlight their status.\"      }    ]  },  {    \"title\": \"Cross-Vault Import Functionality\",    \"children\": [      {        \"title\": \"Automatic Vault Detection\",        \"content\": \"Uses Node.js and Electron APIs to automatically discover all other Obsidian vaults configured on the user's machine by reading the global obsidian.json file.\"      },      {        \"title\": \"Targeted Import UI\",        \"content\": \"When a user clicks \\\"Import,\\\" it presents a modal showing all available vaults, allowing the user to select a destination.\"      },      {        \"title\": \"Customizable Path\",        \"content\": \"Lets the user specify the exact folder path (e.g., _RESOURCES/DATACORE) where the component should be installed in the target vault.\"      }    ]  },  {    \"title\": \"Complete File Transfer\",    \"children\": [      {        \"content\": \"Copies the entire component folder—including all .md files, sub-folders, and associated assets like images, music, or 3D models—from the source vault to the target vault.\"      },      {        \"content\": \"It intelligently skips any files that already exist in the destination to prevent overwriting.\"      }    ]  },  {    \"title\": \"Generates \\\"SmartLoad\\\" Code\",    \"children\": [      {        \"content\": \"After a successful import, it provides a pre-generated, minified datacorejsx code block.\"      },      {        \"content\": \"This \\\"SmartLoad\\\" snippet is designed to be pasted into any note in the new vault. It uses a dynamic query to find the component's file, making it resilient to future file moves or renames.\"      }    ]  },  {    \"title\": \"Immersive Full-Tab UI\",    \"content\": \"Designed to run in a full-pane mode that takes over the entire Obsidian view, providing a dedicated, app-like interface for browsing and managing imports.\"  }]"
cant: "[  {    \"title\": \"Function in a Web Browser\",    \"content\": \"The core functionality of discovering and writing to other vaults is entirely dependent on running within the Obsidian desktop application, which provides access to Node.js and Electron APIs. It will not work in a browser.\"  },  {    \"title\": \"Discover Vaults in Non-Standard Configurations\",    \"content\": \"It relies on finding the standard obsidian.json configuration file in the application's user data directory. It may not find vaults if this file is moved or inaccessible.\"  },  {    \"title\": \"Resolve Import Conflicts\",    \"content\": \"The importer will simply skip any files that already exist at the destination. It does not provide tools for merging or diffing changes.\"  },  {    \"title\": \"Create New Vaults\",    \"content\": \"It can only import into existing, configured Obsidian vaults.\"  }]"
version.obsidian: 1.4.11
version: 1.0.3
---

### Tab: Datacore Importer

- **Description**: An advanced developer and power-user utility that allows you to browse and import Datacore components from a central "showcase" vault into any other Obsidian vault on your system. It automates the entire process of discovering, copying, and providing a ready-to-use code snippet for the imported component, creating a seamless cross-vault workflow.

- **Does**:
   
    - **Dynamic Component Discovery**:    
        - Automatically reads and parses a central DATACORE.showcase.md file to build a rich, categorized list of available components.
        - Displays components with special tags like { NEW }, { PROTOTYPE }, and { FEATURED } to highlight their status.
    - **Cross-Vault Import Functionality**:
        - **Automatic Vault Detection**: Uses Node.js and Electron APIs to automatically discover all other Obsidian vaults configured on the user's machine by reading the global obsidian.json file.
        - **Targeted Import UI**: When a user clicks "Import," it presents a modal showing all available vaults, allowing the user to select a destination.
        - **Customizable Path**: Lets the user specify the exact folder path (e.g., _RESOURCES/DATACORE) where the component should be installed in the target vault.
    - **Complete File Transfer**:
        - Copies the entire component folder—including all .md files, sub-folders, and associated assets like images, music, or 3D models—from the source vault to the target vault.
        - It intelligently skips any files that already exist in the destination to prevent overwriting.
    - **Generates "SmartLoad" Code**:        
        - After a successful import, it provides a pre-generated, minified datacorejsx code block.
        - This "SmartLoad" snippet is designed to be pasted into any note in the new vault. It uses a dynamic query to find the component's file, making it resilient to future file moves or renames.
    - **Immersive Full-Tab UI**: Designed to run in a full-pane mode that takes over the entire Obsidian view, providing a dedicated, app-like interface for browsing and managing imports.

- **Can’t**:
   
    - **Function in a Web Browser**: The core functionality of discovering and writing to other vaults is entirely dependent on running within the Obsidian desktop application, which provides access to Node.js and Electron APIs. It will not work in a browser.    
    - **Discover Vaults in Non-Standard Configurations**: It relies on finding the standard obsidian.json configuration file in the application's user data directory. It may not find vaults if this file is moved or inaccessible.
    - **Resolve Import Conflicts**: The importer will simply skip any files that already exist at the destination. It does not provide tools for merging or diffing changes.
    - **Create New Vaults**: It can only import into existing, configured Obsidian vaults.


----

![datacoreimporter.clip.wepm](_resources/videos/datacoreimporter.clip.webm)

![datacore_importer_1.webp](_resources/images/datacore_importer_1.webp)


![datacore_importer_2.webp](_resources/images/datacore_importer_2.webp)




### Components


###### [Datacore Importer Viewer](D.q.datacoreimporter.viewer.md)

###### [Datacore Importer Component](D.q.datacoreimporter.component.md)
