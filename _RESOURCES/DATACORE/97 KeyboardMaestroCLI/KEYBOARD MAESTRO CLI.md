---
author: beto.group
name.official: Keyboard Maestro CLI
version: 1.0.0
price: "0"
category:
  - utility
  - automation
tags:
  - keyboard-maestro
  - applescript
  - cli
  - automation
  - productivity
  - macos
  - macro-builder
desc: A tactical automation engine for macOS that provides a high-fidelity CLI for Keyboard Maestro macro execution, library management, and dynamic macro synthesis.
status: stable
complexity: advanced
id: 97
resources: [keyboardmaestrocli.clip.webm, kmcli_1.webp]
longDesc: Keyboard Maestro CLI is a sophisticated automation bridge designed for deep integration with the macOS Keyboard Maestro ecosystem. It utilizes a robust AppleScript execution engine to trigger macros via name or UUID, passing complex JSON parameters as unified triggers. The component features an interactive Macro Synthesis builder, allowing users to procedurally generate new macros with Hotkey or URL schemes directly from the Datacore interface. With a persistent favorites system, a real-time group-level library browser, and a tactical terminal log for execution feedback, it transforms Keyboard Maestro into a powerful, programmable command-line utility for advanced workflow orchestration.
does: "[  {    \"title\": \"Multi-Vector Execution Engine\",    \"children\": [      {        \"title\": \"Raycasted Trigger Logic\",        \"content\": \"Supports macro execution via Name or UUID using osascript-bridged triggers with unified parameter handling.\"      },      {        \"title\": \"Asynchronous Execution\",        \"content\": \"Implements independent process spawning (-a flag) for long-running macros without blocking the Datacore UI.\"      }    ]  },  {    \"title\": \"Interactive Macro Synthesis\",    \"children\": [      {        \"title\": \"Procedural Macro Builder\",        \"content\": \"Builds custom .kmmacros XML files procedurally and injects them into the KM engine via dynamic AppleScript calls.\"      },      {        \"title\": \"Contextual Library Browser\",        \"content\": \"Traverses the entire Keyboard Maestro group hierarchy to provide real-time selection and state-toggling of macros.\"      }    ]  },  {    \"title\": \"Tactical Automation HUD\",    \"children\": [      {        \"title\": \"Persistent Favorites Registry\",        \"content\": \"Maintains a localized storage of frequently triggered automations with integrated state-toggle (Power) controls.\"      },      {        \"title\": \"Live Terminal Telemetry\",        \"content\": \"Provides a high-contrast log of all automation triggers, success states, and AppleScript error codes for debugging.\"      }    ]  }]"
cant: '[  {    \"title\": \"Cross-Platform Functionality\",    \"content\": \"The component relies on macOS-exclusive AppleScript and Keyboard Maestro binaries; it does not function on Windows or Linux.\"  },  {    \"title\": \"No-System Permission Bypass\",    \"content\": \"Execution is subject to macOS Accessibility and Automation permission sets; it cannot bypass system-level security prompts.\"  },  {    \"title\": \"Macro Engine Standalone\",    \"content\": \"Requires a licensed installation of Keyboard Maestro to be active on the host system to process or host macros.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Keyboard Maestro CLI

- **Description**: Keyboard Maestro CLI is a tactical automation engine for macOS that provides a high-fidelity bridge for macro execution, library management, and dynamic synthesis. It enables seamless integration between Datacore workflows and OS-level automations using a robust AppleScript execution kernel.

- **Does**:

    - **Multi-Vector Execution Engine**: Macro triggers via Name or UUID using osascript-bridged parameter handling.
    - **Asynchronous Execution Logic**: Spawns independent processes for long-running macros without blocking UI states.
    - **Procedural Macro Synthesis**: Dynamically builds and injects `.kmmacros` XML files into the KM engine.
    - **Contextual Library Browser**: Real-time traversal and state-toggling of the entire Keyboard Maestro group hierarchy.
    - **Persistent Favorites Registry**: Localized storage for high-frequency automations with integrated "Power" toggles.
    - **Live Terminal Telemetry Log**: High-contrast log area for trigger statuses and AppleScript debugging codes.

- **Can't**:

    - **Cross-Platform Compatibility**: Strictly dependent on macOS-exclusive AppleScript and Keyboard Maestro binaries.
    - **System Permission Overrides**: Subject to macOS Accessibility/Automation permissions; cannot bypass TCC prompts.
    - **Independent Engine Execution**: Requires an active, licensed installation of Keyboard Maestro on the host system.
    

------
![Keyboard Maestro CLI Clip](_resources/videos/kmcli.clip.webm)

![Keyboard Maestro CLI Screenshot 1](_resources/images/kmcli_1.webp)

### Components
###### [Keyboard Maestro CLI Viewer](D.q.kmcli.viewer.md)
###### [Keyboard Maestro CLI Components {index.jsx}](src/index.jsx)
