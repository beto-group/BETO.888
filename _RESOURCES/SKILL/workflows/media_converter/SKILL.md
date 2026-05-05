# 🧠 Media Processing Skill: The Beto Group Standard (v1.8.7)

This skill provides a formalized system for media conversion and delivery within the BetoOS ecosystem. It ensures that all visual assets (videos and images) are optimized for high-performance web and showcase environments while maintaining absolute data integrity.

## 🍱 Skill Overview

- **Core Engine**: `140_Media_Converter` (Standardized v1.8.7).
- **Function**: Autonomous conversion of legacy media (MOV, MP4, PNG, JPG) to high-efficiency formats (WEBM/VP9, WEBP).
- **Interface**: Invoked via the `obsidian eval` bridge using the `window.CliLab.execute` API.

## 🚀 Triple-Zone Delivery Protocol

To prevent asset loss and ensure immediate usability, every conversion MUST deliver the output to three simultaneous zones:

1.  **Requested Target**: The specific destination requested by the user (/Users/blackbird/Desktop/DATE/filename.ext).
2.  **Original Sibling**: Placed directly next to the source file for easy developer access.
3.  **Vault Archive**: Automatically archived within the BetoOS internal history shelf for long-term persistence.

## ☢️ Nuclear Verification Protocol

Every conversion terminal response MUST provide **Bit-Level Proof** of successful delivery.
- **Size Validation**: The response must report the file size (e.g., `Size: 1.9M`) for all three delivery locations.
- **Zero-Ghost Policy**: If any of the three locations fail to report the correct size, the task is considered FAILED and requires immediate agent recovery.

## 📼 Media Conversion Logic

### Video
- **Source**: `.mov` | `.mp4`.
- **Target**: `.webm` (`libvpx-vp9` / `libopus`).
- **Feature**: Full support for alpha-channel transparency for technical overlays.

### Images
- **Source**: `.png` | `.jpg`.
- **Target**: `.webp`.
- **Bulk Processing**: Full support for sequential screenshots (e.g., `iqgame_1`, `iqgame_2`). Every variant MUST undergo Triple-Zone Delivery and Nuclear Verification.
- **Optimization**: Superior compression and web performance for the Datacore Showcase.

---
*Beto Group LLC | Media Infrastructure Standardized.*
