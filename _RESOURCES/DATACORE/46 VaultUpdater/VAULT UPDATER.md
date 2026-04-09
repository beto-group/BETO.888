---
author: beto.group
name.official: Vault Updater
price: "0"
category:
  - utility
tags:
  - updater
  - github
  - version-control
  - changelog
  - sync
  - maintenance
  - system-tool
desc: A comprehensive update manager that connects to a GitHub repository to automatically check for, review, and apply vault updates with granular file control.
status: stable
complexity: intermediate
ext.dependencies:
  - github
id: 46
resources:
  - vaultupdater.clip.webm
  - vault_updater.webp
longDesc: A comprehensive and user-friendly update manager that connects directly to a GitHub repository to seamlessly manage vault updates. It automatically checks for new versions, presents a clear summary of what's new, and provides a detailed, interactive view of all file changes. Users can confirm the update, which then downloads and applies all new, modified, and deleted files directly to their vault. It even includes a robust "revert" feature for granular control.
does: "[  {    \"title\": \"Automatic Update Checking\",    \"children\": [      {        \"content\": \"On load, it fetches the CHANGE LOG.md from a specified GitHub repository.\"      },      {        \"content\": \"Compares the remote version (parsed from YAML frontmatter) with the local version to determine if an update is available.\"      }    ]  },  {    \"title\": \"Clear and Engaging UI\",    \"children\": [      {        \"content\": \"Displays a prominent, animated banner indicating the current status: \\\"Update Available,\\\" \\\"You Are Up-To-Date,\\\" or \\\"Checking for Updates.\\\"\"      },      {        \"content\": \"The up-to-date banner doubles as a CTA to a \\\"Support the Developer\\\" modal with links to Ko-fi.\"      }    ]  },  {    \"title\": \"Interactive Update Modal\",    \"children\": [      {        \"content\": \"Presents a confirmation screen with a collapsible, nicely formatted view of the latest changelog entry.\"      },      {        \"content\": \"After confirmation, it provides a full breakdown of the update, categorizing all files as Added, Modified, or Deleted.\"      },      {        \"content\": \"Allows users to click on any file in the change list to open a live preview of its content in a modal window.\"      }    ]  },  {    \"title\": \"Granular Revert Control\",    \"children\": [      {        \"content\": \"Features a multi-select mode in the results view.\"      },      {        \"content\": \"Users can select specific files and revert them to their previous state, giving them complete control over the update process. This is useful for preserving personal modifications to certain files.\"      }    ]  },  {    \"title\": \"Seamless File Management\",    \"children\": [      {        \"content\": \"Downloads the entire repository file tree.\"      },      {        \"content\": \"Automatically creates necessary new folders, overwrites modified files, and deletes removed files within the user's vault.\"      }    ]  }]"
cant: '[  {    "content": "Resolve merge conflicts. If a user has modified a file that is also changed in the update, their local changes will be overwritten. The \"revert\" feature is the manual workaround for this."  },  {    "content": "Update itself if the core component file (GithubReleaseUpdate.component.md) is the one being modified; a manual reload is required for that."  },  {    "content": "Function without an active internet connection to reach the GitHub API and raw content URLs."  },  {    "content": "Be configured to point to a different GitHub repository directly from the UI; the repository path is hardcoded."  }]'
version.obsidian: 1.4.11
version: 1.0.8
---

### Tab: Vault Updater

- **Description**: A comprehensive and user-friendly update manager that connects directly to a GitHub repository to seamlessly manage vault updates. It automatically checks for new versions, presents a clear summary of what's new, and provides a detailed, interactive view of all file changes. Users can confirm the update, which then downloads and applies all new, modified, and deleted files directly to their vault. It even includes a robust "revert" feature for granular control.

- **Does**:

    - **Automatic Update Checking**:
        - On load, it fetches the CHANGE LOG.md from a specified GitHub repository.
        - Compares the remote version (parsed from YAML frontmatter) with the local version to determine if an update is available.
    - **Clear and Engaging UI**:
        - Displays a prominent, animated banner indicating the current status: "Update Available," "You Are Up-To-Date," or "Checking for Updates."
        - The up-to-date banner doubles as a CTA to a "Support the Developer" modal with links to Ko-fi.
    - **Interactive Update Modal**:
        - Presents a confirmation screen with a collapsible, nicely formatted view of the latest changelog entry.
        - After confirmation, it provides a full breakdown of the update, categorizing all files as Added, Modified, or Deleted.
        - Allows users to click on any file in the change list to open a live preview of its content in a modal window.
    - **Granular Revert Control**:
        - Features a multi-select mode in the results view.
        - Users can select specific files and revert them to their previous state, giving them complete control over the update process. This is useful for preserving personal modifications to certain files.
    - **Seamless File Management**:
        - Downloads the entire repository file tree.
        - Automatically creates necessary new folders, overwrites modified files, and deletes removed files within the user's vault.

- **Can’t**:

    - **Merge Conflict Resolution**: Resolve merge conflicts. If a user has modified a file that is also changed in the update, their local changes will be overwritten.
    - **Self-Update Limitation**: Update itself if the core component file (GithubReleaseUpdate.component.md) is the one being modified; a manual reload is required.
    - **Offline Functionality**: Function without an active internet connection to reach the GitHub API and raw content URLs.
    - **Dynamic Repository Configuration**: Be configured to point to a different GitHub repository directly from the UI; the repository path is hardcoded.


----

![vaultupdater.clip.webm](_resources/videos/vaultupdater.clip.webm)


![vault_updater.webp](_resources/images/vault_updater.webp)




### Components


###### [Vault Updater Viewer](D.q.vaultupdater.viewer.md)

###### [Vault Updater Components](D.q.vaultupdater.component.md)
