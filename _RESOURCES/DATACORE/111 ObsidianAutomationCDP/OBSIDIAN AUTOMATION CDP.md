---
author: beto.group
name.official: Obsidian Automation CDP
price: "0"
category:
  - automation
platform: desktop
tags:
  - cdp
  - automation
  - testing
  - obsidian-cli
  - chrome-devtools-protocol
desc: An advanced automation and testing suite for Obsidian, utilizing the Chrome DevTools Protocol (CDP) via obsidian-cli for real-time interaction, DOM inspection, and visual regression testing.
status: experimental
complexity: developer
ext.dependencies:
  - obsidian-cli
  - node-js
id: 111
resources:
  - obsidian_automation_cdp_1.webp
longDesc: Obsidian Automation CDP is a high-performance testing and automation framework built directly into a Datacore component. It bridges the gap between Obsidian's UI and external automation tools by leveraging the Chrome DevTools Protocol. This enables developers to script complex user interactions, perform deep DOM audits, and capture high-fidelity screenshots for visual verification—all from within the vault.
does: |
  [
    {
      "title": "Automated Interaction Sequences",
      "children": [
        { "content": "Supports complex multi-step scenarios including page traversal, UI state audits, and interaction verification." },
        { "content": "Features a randomized 100-spot grid test to verify spatial UI responsiveness and collision detection." }
      ]
    },
    {
      "title": "CDP-Powered DOM Inspection",
      "children": [
        { "content": "Enables real-time inspection of the Obsidian workspace DOM using CSS selectors." },
        { "content": "Can audit specific element properties such as text content, background colors, and visibility states." }
      ]
    },
    {
      "title": "Visual Regression & Screenshots",
      "children": [
        { "content": "Provides one-click high-fidelity screenshot capture of the current workspace state." },
        { "content": "Integrates an 'Anti-Cheat' reality verification system to prove real-time interaction via obsidian-cli." }
      ]
    },
    {
      "title": "Component ID Targeting",
      "content": "Allows for precise targeting and automation of specific UI components using unique HTML IDs."
    }
  ]
cant: |
  [
    {
      "title": "Run on Mobile or Browser",
      "content": "Requires the obsidian-cli tool and Node.js environment available only on desktop versions of Obsidian."
    },
    {
      "title": "Simulate Native OS Inputs",
      "content": "Interaction is limited to the Chrome DevTools Protocol level within the Obsidian application window."
    }
  ]
disclaimer: |
  [
    {
      "content": "This component is an advanced development tool designed for technical audits and automated testing. It requires obsidian-cli to be correctly configured in the system PATH. Use with caution when automating destructive UI actions."
    }
  ]
version.obsidian: 1.4.11
version: 1.0.0
---

### Tab: Obsidian Automation CDP

- **Description**: An advanced automation and testing suite for Obsidian, utilizing the Chrome DevTools Protocol (CDP) via obsidian-cli for real-time interaction, DOM inspection, and visual regression testing.

- **Does**:
    - **Automated Interaction Sequences**:
        - Supports complex multi-step scenarios including page traversal, UI state audits, and interaction verification.
        - **Randomized Grid Test**: Features a 100-spot grid test to verify spatial UI responsiveness and collision detection.
    - **CDP-Powered DOM Inspection**:
        - Enables real-time inspection of the Obsidian workspace DOM using CSS selectors.
        - **Property Audits**: Can audit specific element properties such as text content, background colors, and visibility states.
    - **Visual Regression & Screenshots**:
        - Provides one-click high-fidelity screenshot capture of the current workspace state.
        - **Reality Verification**: Integrates an 'Anti-Cheat' system to prove real-time interaction via obsidian-cli.
    - **Component ID Targeting**: Allows for precise targeting and automation of specific UI components using unique HTML IDs.

- **Cannot**:
    - **Run on Mobile or Browser**: Requires the obsidian-cli tool and Node.js environment available only on desktop versions of Obsidian.
    - **Simulate Native OS Inputs**: Interaction is limited to the Chrome DevTools Protocol level within the Obsidian application window.

- **Disclaimer**:
    - This component is an advanced development tool designed for technical audits and automated testing. It requires obsidian-cli to be correctly configured in the system PATH. Use with caution when automating destructive UI actions.

---

![obsidian_automation_cdp_1.webp](_resources/images/obsidian_automation_cdp_1.webp)

### COMPONENTS

###### [Obsidian Automation CDP Viewer](ObsidianAutomationCDP.viewer.md)

###### [Obsidian Automation CDP Component {index.jsx}](111%20ObsidianAutomationCDP/src/index.jsx)
