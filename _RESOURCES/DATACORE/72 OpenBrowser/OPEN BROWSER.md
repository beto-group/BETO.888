---
author: beto.group
name.official: Open Browser
version: 1.0.0
price: "0"
category:
  - utility
tags:
  - browser
  - web-view
  - navigation
  - developer-tool
  - testing
desc: A versatile browser command center for testing and managing URL handling within Obsidian, supporting internal vault links and external web contexts.
status: stable
complexity: intermediate
id: 72
resources:
  - open_browser_1.webp
longDesc: A comprehensive utility designed to test and streamline how URLs and internal links are handled within Obsidian. It provides a centralized interface to discover available browser-related commands, open links in system defaults, force external shell execution, or embed web content directly via iframes. Additionally, it features robust support for internal vault navigation with options for current tab, new tab, or split view.
does: "[  {    \"title\": \"Universal Link Handling\",    \"children\": [      {        \"title\": \"External Web Support\",        \"content\": \"Open any URL in the system's default browser or force it through Electron's external shell for deep interception testing.\"      },      {        \"title\": \"Internal Vault Links\",        \"content\": \"Supports opening Markdown files from the vault in the current tab, a new tab, or a split view with a random file picker for quick testing.\"      }    ]  },  {    \"title\": \"Browser Context Testing\",    \"children\": [      {        \"title\": \"Surfing View Integration\",        \"content\": \"Directly launch URLs into the 'Surfing' plugin view for a seamless internal browsing experience.\"      },      {        \"title\": \"Iframe Embedding\",        \"content\": \"Toggle an embedded iframe to preview web content directly within the component's interface without leaving the current view.\"      }    ]  },  {    \"title\": \"Developer Discovery Tools\",    \"children\": [      {        \"title\": \"Command ID Discovery\",        \"content\": \"Automatically scans the Obsidian environment for web, browser, and surfing-related commands and view types, logging them to a real-time console.\"      },      {        \"title\": \"Real-Time Console Logging\",        \"content\": \"Built-in terminal-style logger that tracks all execution attempts, errors, and discovery results for immediate debugging.\"      }    ]  }]"
cant: '[  {    "title": "Bypass Content Security Policies (CSP)",    "content": "As an iframe-based or system-called tool, it is subject to the security policies of both Obsidian and the target websites, which may prevent some pages from being embedded."  },  {    "title": "Render Complex Web Apps as Native Views",    "content": "While it can open sites in Surfing or iframes, it does not transform websites into native Obsidian components."  },  {    "title": "Handle Non-Markdown Internal Files Specially",    "content": "The internal link tester is optimized for Markdown files and may not provide advanced previews for other file types within the test interface."  }]'
version.obsidian: 1.4.11
---

### Tab: Open Browser

- **Description**: A comprehensive utility designed to test and streamline how URLs and internal links are handled within Obsidian. It provides a centralized interface to discover available browser-related commands, open links in system defaults, force external shell execution, or embed web content directly via iframes. Additionally, it features robust support for internal vault navigation with options for current tab, new tab, or split view.

- **Does**:
   
    - **Universal Link Handling**:    
        - **External Web Support**: Open any URL in the system's default browser or force it through Electron's external shell for deep interception testing.
        - **Internal Vault Links**: Supports opening Markdown files from the vault in the current tab, a new tab, or a split view with a random file picker for quick testing.
    - **Browser Context Testing**:
        - **Surfing View Integration**: Directly launch URLs into the 'Surfing' plugin view for a seamless internal browsing experience.
        - **Iframe Embedding**: Toggle an embedded iframe to preview web content directly within the component's interface without leaving the current view.
    - **Developer Discovery Tools**:
        - **Command ID Discovery**: Automatically scans the Obsidian environment for web, browser, and surfing-related commands and view types, logging them to a real-time console.
        - **Real-Time Console Logging**: Built-in terminal-style logger that tracks all execution attempts, errors, and discovery results for immediate debugging.

- **Can’t**:
   
    - **Bypass Content Security Policies (CSP)**: As an iframe-based or system-called tool, it is subject to the security policies of both Obsidian and the target websites, which may prevent some pages from being embedded.    
    - **Render Complex Web Apps as Native Views**: While it can open sites in Surfing or iframes, it does not transform websites into native Obsidian components.
    - **Handle Non-Markdown Internal Files Specially**: The internal link tester is optimized for Markdown files and may not provide advanced previews for other file types within the test interface.


----

![open_browser_1.webp](_resources/images/open_browser_1.webp)


### Components

###### [Open Browser Viewer](D.q.openbrowser.viewer.md)
