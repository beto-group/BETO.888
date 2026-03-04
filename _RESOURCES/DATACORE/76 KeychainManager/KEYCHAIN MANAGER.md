---
author: beto.group
name.official: Keychain Manager
version: 1.11.4
price: "0"
category:
  - security
tags:
  - keychain
  - secrets
  - encryption
  - credential-management
  - os-integration
desc: A robust security utility that leverages Obsidian's Native SecretStorage API to manage credentials with OS-level encryption (DPAPI/Keychain).
status: stable
complexity: intermediate
id: 82
resources:
  - keychain_manager_1.webp
longDesc: 'The Keychain Manager is a dedicated security utility designed for the modern Obsidian environment (v1.11.4+). It provides a high-visibility interface to manage sensitive credentials using the native SecretStorage API, ensuring that tokens, keys, and passwords are encrypted by the host Operating System (DPAPI on Windows, Keychain on macOS). It also features a built-in scanner to identify and migrate unsecured secrets from plain-text storage to the secure vault keyring.'
does: "[  {    \"title\": \"Native OS-Level Security\",    \"children\": [      {        \"title\": \"Direct Keychain Integration\",        \"content\": \"Leverages Obsidian's SecretStorage to store data in the host OS's secure credential store (Keychain for macOS, DPAPI for Windows).\"      },      {        \"title\": \"Auto-Encryption\",        \"content\": \"Credentials are automatically encrypted using the logged-in user's system identity, preventing unauthorized access even if the vault files are exposed.\"      }    ]  },  {    \"title\": \"Credential Intelligence\",    \"children\": [      {        \"title\": \"Unsecured Secret Scanner\",        \"content\": \"Automatically scans local storage for sensitive patterns (tokens, passwords, keys) that are currently stored in plain-text.\"      },      {        \"title\": \"One-Click Migration\",        \"content\": \"Provides a specialized workflow to move discovered plain-text secrets into the secure native keyring with a single interaction.\"      }    ]  },  {    \"title\": \"Management Interface\",    \"children\": [      {        \"title\": \"Global Record Registry\",        \"content\": \"Maintains a clear list of all registered secrets in the vault with simplified 'Unlock' and 'Seal' workflows.\"      },      {        \"title\": \"Immersive Admin UI\",        \"content\": \"Designed for full-pane operation, providing an edge-to-edge dashboard for managing high-security vault configurations.\"      }    ]  }]"
cant: '[  {    "title\": \"Cross-Device Secret Syncing\",    \"content\": \"Secrets are tied to the local OS keychain/DPAPI. Synced vaults on other devices will not have access to these secrets unless they are re-entered locally.\"  },  {    \"title\": \"Bypass OS Security Requirements\",    \"content\": \"Accessing or revealing secrets is subject to OS-level authentication and cannot be performed if the user is not authenticated with the system account.\"  },  {    \"title\": \"Handle Binary Data Directly\",    \"content\": \"The manager is optimized for string-based tokens and passwords and does not support direct binary blob storage without base64 encoding.\"  }]'
version.obsidian: 1.11.4
---

### Tab: Keychain Manager

- **Description**: A robust security utility that leverages Obsidian's Native SecretStorage API to manage credentials with OS-level encryption (DPAPI/Keychain). It provides a high-visibility interface to manage sensitive credentials and migrates unsecured secrets from plain-text storage to the secure vault keyring.

- **Does**:
   
    - **Native OS-Level Security**:    
        - **Direct Keychain Integration**: Leverages Obsidian's SecretStorage to store data in the host OS's secure credential store (Keychain for macOS, DPAPI for Windows).
        - **Auto-Encryption**: Credentials are automatically encrypted using the logged-in user's system identity, preventing unauthorized access even if the vault files are exposed.
    - **Credential Intelligence**:
        - **Unsecured Secret Scanner**: Automatically scans local storage for sensitive patterns (tokens, passwords, keys) that are currently stored in plain-text.
        - **One-Click Migration**: Provides a specialized workflow to move discovered plain-text secrets into the secure native keyring with a single interaction.
    - **Management Interface**:
        - **Global Record Registry**: Maintains a clear list of all registered secrets in the vault with simplified 'Unlock' and 'Seal' workflows.
        - **Immersive Admin UI**: Designed for full-pane operation, providing an edge-to-edge dashboard for managing high-security vault configurations.

- **Can’t**:
   
    - **Cross-Device Secret Syncing**: Secrets are tied to the local OS keychain/DPAPI. Synced vaults on other devices will not have access to these secrets unless they are re-entered locally.    
    - **Bypass OS Security Requirements**: Accessing or revealing secrets is subject to OS-level authentication and cannot be performed if the user is not authenticated with the system account.
    - **Handle Binary Data Directly**: The manager is optimized for string-based tokens and passwords and does not support direct binary blob storage without base64 encoding.


----

![keychain_manager_1.webp](_resources/images/keychain_manager_1.webp)


### Components

###### [Keychain Manager Viewer](D.q.keychainmanager.viewer.md)
