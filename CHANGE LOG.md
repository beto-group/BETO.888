---
permalink: change_log
version: 1.4.0
---

>[!info]- [[DEVLOG]]

-----
----
----

## GREEN-4

**DATE**: 2025.10.09  
**LICENSE**: MIT  
**AVAILABILITY**: GITHUB

**I. SUMMARY**  
The GREEN-4 release marks a major milestone: the culmination of our deep dive into the Obsidian environment. The theme of this update is **Mastery**—pushing beyond the application's boundaries to unlock true system-level power. We have successfully broken out of the traditional application sandbox, providing direct access to your computer's underlying shell and file system. This transforms the vault from a self-contained app into a genuine command center for developers. This release completes a significant chapter

**II. A New Development Paradigm: The Integrated Development Environment**  
This update finalizes our vision for a professional-grade development workflow that lives entirely within Obsidian. We are moving beyond simple tools to provide a complete, integrated suite that handles the entire lifecycle of creation, from coding and automation to version control.

**This is powered by our new Developer & Automation Suite components:**
- **Plugin Development Suite:** The centerpiece of this release. An all-in-one command center to build, test, deploy, and manage full Obsidian plugins without ever leaving the vault.
- **Datacore Terminal:** A powerful bridge to your system's shell, allowing you to run any command-line process directly from a note.
- **Git Suite Manager:** A complete, standalone Git client with a full graphical UI for managing repositories inside Obsidian.
    

**III. Full Component Changelog**
- **New Core Systems:**
    - **Plugin Development Suite:** An all-in-one environment for building, deploying, and managing Obsidian plugins.
    - **Git Suite Manager:** A complete, standalone Git client UI for source control within the vault.
    - **Datacore Terminal:** A bridge to the system's shell for running any command-line process from Obsidian.
        
- **New Developer & Automation Tools:**
    - **Datacore Command Manager:** A UI to create and manage custom Obsidian commands without writing a full plugin.
    - **Workspace Manager (Experimental):** A visual, drag-and-drop editor for building and managing Obsidian workspace layouts.
        
- **New Diagnostic & Utility Components:**
    - **Datacore Limitations:** An interactive security audit tool to test and demonstrate the capabilities of the Datacore environment.
    - **Hot Reload Files:** A diagnostic tool for monitoring a folder for real-time file changes.
        
- **Upgraded Components:**
    - **Datacore Playground:** Formally integrated and upgraded, providing a robust, live environment for rapid component prototyping.
    - **Basic View v3:** added reload capabilities directly within component, speeding up prototyping further.


------
## YELLOW-3.patches
DATE**: 2025.*.09  


**I.** This patch delivers a major new tool and key infrastructure upgrades.
- **New Core Component:**    
    - **Datacore Playground:** A live, CodePen-like environment for building components directly in your vault.
    
- **Improvements:**
    - **Core Messaging:** Reworked based on community feedback for a clearer vision.
    - **Vault Updater:** Upgraded for significantly faster, smarter (differential) updates.
    - **Views Inceptions v2:** Component development is now finalized.
- **Fixes:**
    - Addressed key updater bugs and minor UI polish for a better experience.
    - And many small tweaks / feedback from community . Thank you

-----

## YELLOW-3

**DATE**: 2025.09.09  
**LICENSE**: MIT  
**AVAILABILITY**: GITHUB

**I. SUMMARY**  
The YELLOW-3 release is a metamorphosis. Responding to community feedback, we have moved beyond individual components to forge an integrated and intuitive ecosystem. The core mission was **Unification**: a fundamental shift in design and philosophy to create a single, focused interface that guides your journey and removes friction. This release also introduces a massive optimization, reducing the vault's storage footprint from over 3GB to under 1GB, with configurations as low as 500MB.

**II. A New Development Paradigm: The Unified Interface**  
This update manifests our vision for a cohesive user experience. The fragmented paths have converged into a central command interface, an elegant launchpad into the system's deeper realms. This is powered by a new suite of core systems designed to work in concert.

**This is powered by our new Core Systems Suite:**

- **DASHBOARD 888:** The new central command interface for the entire ecosystem.
    
- **ASSETS LIBRARY:** A high-performance, interactive gallery for visual assets with an automated Excalidraw-to-SVG pipeline.
    
- **MARKDOWN PARSER:** A rich, interactive documentation browser for exploring the component knowledge base.
    
- **ACTIONS MANAGER:** A powerful, node-based visual automation builder for creating complex workflows.
    

**III. Full Component Changelog**
- **New Core Systems:**
    - DASHBOARD 888
    - ASSETS LIBRARY
    - ACTIONS MANAGER

- **New Utility & Developer Components:**
    - METADATA EDITOR
    - MARKDOWN PARSER    
    - SVG ANIMATIONS / CONVERTER
    - VAULT UPDATER

- **Upgraded Components:**
    - **Showcase Engine:** The core showcase component used in the Datacore and Dev Log sections has been completely redesigned for a more fluid and cohesive experience.
    - **Random File Controls:** Playing aroud JS to replace of python script {wip much slower at times}
        

**IV. Storage Footprint Optimization**  
A major re-architecture of our asset and resource handling has been completed. This overhaul reduces the initial vault storage requirement from over 3GB to under 1GB. With selective component usage via Git sparse-checkout, the footprint can be as low as 500MB, making the system significantly more accessible and performant.



----

## BLUE-2
**DATE** : 2025.08.09
**LICENSE** : MIT
**Availability:** GITHUB

**I. SUMMARY**  
The BLUE-2 release represents a fundamental evolution in our development philosophy. We are transitioning from creating individual tools to engineering integrated **systems** that solve real-world problems. This release is includes a full suite of AI and data components, showcased by our new financial automation system.

**II. A New Development Paradigm: From Tools to Systems**  
This update introduces our vision for the future: modular components working in concert to create powerful applications. The new **AI Receipt Tracker** exemplifies this, orchestrating OCR and AI to turn a folder of images into a dynamic dashboard.

This is powered by our new **Intelligence Suite**:
 - **Receipt Tracker:** The main UI for financial processing and visualization.
 - **AiAdapter:** A universal connector to LLM services.
 - **OcrReceiver:** The frontend for vault-based OCR.

**III. Full Component Changelog**
 - **New Components:**
	 - AiAdapter, OcrReceiver, Receipt Tracker
	 	- CardPicker
	 	- Datacore Query Builder
	 	- Mobile Music Player
	 	- Telegram Bot
 - **Upgraded Components:**
	 	- ScreenModeHelper has been significantly enhanced with new layout management capabilities.

----

## RED-1
**DATE** : 2025.07.09
**LICENSE** : MIT
**Availability:** GITHUB

##### **I. SUMMARY**

This is a monumental release for `BETO.GROUP`, featuring a host of new creative tools and, most importantly, a fundamental simplification of our legal framework to empower our community.

##### **II.[!IMPORTANT] Monumental Overhaul of Our Terms of Service & Licensing**

To better align with our open-source philosophy and make our platform more accessible, we have completely revised our legal framework.
  - **Simplified Software Licensing:** The complex, time-based (MIT -> GPLv3) licensing model has been **completely removed**.
 	 - **All BETO.GROUP software Releases are now, and will be, licensed exclusively and perpetually under the simple and permissive MIT License.**
 	 - This gives you maximum freedom to use, modify, distribute, and even commercialize our work with only the simple requirement of providing attribution.
  - **A New Community Principle:** The legally binding "Give Back Mechanism" has been **replaced** with the **"Reciprocity Ethos."**
  - This is a non-binding, good-faith community principle that encourages voluntary contributions back to the ecosystem. There are no revenue thresholds or mandatory obligations.
  - **Updated Policies:** All related documents, including our [[TERMS OF SERVICE]] , [[FAQ.classic]] | [[FAQ.enigma]] and [[LICENSE GUIDE]], have been updated to reflect this new, simpler, and more permissive approach. We strongly encourage you to review them.

##### **III. New & Upgraded Datacore Components**
We've added a powerful suite of new tools to the vault to expand your creative capabilities.

###### **New Components:**
  - **LOADSCRIPT:** A new utility for dynamically loading and executing other scripts within your vault utilizing CDNs.
  - **Fuzzy Text:** A component for creating visually interesting, glitched, or "fuzzy" text effects.
  - **Matrix Glitch Wall:** A full-canvas background effect that emulates the classic "digital rain."
  - **Loading Logo:** A customizable animated loading logo for use with scripts and dashboards.
 - **Sound Player:** A lightweight, embeddable player for simple audio files.
  - **Music Player:** A more feature-rich player for creating and managing music playlists within your notes.
  - **CodeEditor (v1 + v2{wip}):** Two distinct versions of an in-vault code editor for writing and testing snippets.
  - **Animated Card:** A CSS/JS component for creating cards that flip or animate on click.
  - **ActivityWatch Dashboard:** A dashboard designed to integrate with data from the ActivityWatch time-tracking application.

###### **Upgrades:**
 - **IframePlayer:** The `Iframe loader` has been significantly upgraded with new features and renamed to `IframePlayer`.
 - **Upgraded Canvas:** The core canvas component has been enhanced for better performance and new interactive features.
 - **Upgraded Window Resizer:** Now includes a powerful **Tab Mode**, allowing you to embed multiple windows within a single, tabbed component.





----


## BLACK-0
**DATE:** 2025.06.09 (Initial Public Release)
**Status:** Stable
**License:** MIT (Effective: June 9, 2025 - December 8, 2025); transitions to GPLv3 on December 9, 2025.
**Availability:** https://ko-fi.com/betogroup/shop {unavailable = please visit github ty}

>[!info]- PATCH: 0.1.1.BLACK
>DATE: 2025.06.14
>Added rewards to MINIGAME888 [CROSSMINT need to verify nft project will be live on 2025.06.16]


>[!info]- PATCH: 0.1.BLACK
>**DATE**: 2025.06.12
> - Fix MINIGAME888 [rushed it a little bit too quick , was getting too excited hehe]
> - Upgraded version of the IframeLoader.
> - Minor typos + Nft distribution fixed

**I. SUMMARY**
Initial public release of the BETO.GROUP Obsidian Vault series. This release provides foundational content and tooling for knowledge management and productivity within the Obsidian ecosystem. Focus areas include curated knowledge ("Enigmas"), modular "Datacore" components for Obsidian, and a supporting asset library.

**II. KEY DELIVERABLES**
 - **Content - "Enigmas" Module:** Curated datasets and notes across Health, Wealth, and Experience domains, designed for user exploration and integration.
 - **Tooling - "Datacore" Components:** Initial set of Obsidian-native tools, templates, and structural frameworks for enhanced organization and creative output. (See [[DATACORE.showcase]] within vault for details).
 - **Resources - Asset Library:** Collection of visual assets for use within user projects.
 - **Framework - Early Access Benefits:** Establishes eligibility for early users to receive potential future platform benefits and discounts, as will be detailed in subsequent communications.
 
**III. IMPROVEMENTS (Relative to pre-release candidates)**
 - **Vault Structure Optimization:** Refined top-level folder hierarchy for improved navigability and scalability based on internal testing.
 - **Template Standardization:** Ensured consistent formatting and metadata across all core note templates.
 - **Initial Content Curation Pass:** Completed first-pass review and organization of all "Enigma" content for clarity and relevance.
 - **Performance Baseline:** Established initial performance metrics for vault loading and indexing on standard hardware configurations.

**IV. BUG FIXES (Relative to pre-release candidates)**
 - **Internal Link Integrity:** Resolved all identified broken internal links within core vault documentation and templates.
 - **Metadata Consistency:** Corrected inconsistencies in frontmatter YAML across several "Enigma" note series. 
 - **Asset Naming Convention:** Standardized file naming for all items in the Asset Library to prevent potential conflicts.
 
**V. KNOWN ISSUES & LIMITATIONS**
 - **Aquarium Canvas  `(13 Aquarium {FireStormFrontier 🫡}):`** Potential rendering or interaction issues with specific "fishies" elements within this canvas. Further investigation pending.
 - **Canvas Stability (World888 Node Interaction):** Adding the "World888" node to an Obsidian canvas may lead to instability. Furthermore, attempting to subsequently remove this "World888" node from the canvas has been observed to cause the canvas itself to crash. Users are advised to avoid interacting with the "World888" node within canvases until this issue is resolved. This component is under active investigation.
 - **ContentExplorer Navigation:** The "back" button functionality intended to return to the home screen from the ContentExplorer is currently non-operational.
 - **Kanban Board Functionality:** The included Kanban board implementation is in a preliminary state with significant limitations in features and usability. It is not recommended for critical task management at this stage.
 - **Globe/Map View Feature:** The current "Globe" component has limited functionality. Implementing a full "Map View" feature would require a substantial architectural redesign and is not part of the current feature set.
 - **License Agreement Display (Client-Side):** The visual presentation of the license agreement within certain client-side views can be superficially altered using browser developer tools. This does not affect the binding nature of the terms agreed upon during download/access, nor server-side license enforcement.







-----

>[!example]- GENERAL INFO
>
>###### [[FAQ]]
>
>###### [[LICENSE]]
>
>###### [[LICENSE GUIDE]]
>
>###### [[CUSTOMER SUPPORT]]
>
>###### [[PRIVACY POLICIES]]
>
>###### [[TERMS OF SERVICE]]
> - [[TERMS OF SERVICE.approval]]
