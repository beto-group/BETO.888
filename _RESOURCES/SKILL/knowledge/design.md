---
name: design
description: UI/UX principles, design systems, and visual language patterns for Beto.888. Includes guidance on data display, interaction models, and style standards.
icon: palette
---

# Design & UX Patterns

This module provides the structural and aesthetic foundations for building components within the Datacore ecosystem. It focuses on clarity, consistency, and creating "blissful experiences" through well-defined UI patterns.

## Core Principles

- **Immersive Clarity:** Design for focus. Use windowing and modal states to remove distraction.
- **Data-First Visualization:** Use appropriate components (tables, cards, kanbans) based on the shape of the data.
- **Interactive Feedback:** Ensure every user action (click, drag, hover) provides immediate visual or tactile confirmation.

---

## UI Patterns & Interaction

### Data Display Strategies
- **Tables:** Use for high-density, sortable information. Best for administrative or reference lists.
- **Cards:** Use for visual or media-rich items. Best for galleries, profiles, or project overviews.
- **Kanban:** Use for status-based workflows and drag-and-drop organization.

### Multimedia & Animation
- **Ambient Overlays**: Layer low-opacity Lottie animations (e.g., [[12 LottieExperiment]]) to create depth and movement without distracting from the primary task.
- **Proportional Animation**: When using backgrounds (e.g., [[13 Aquarium]]), ensure interactive elements stay within their "logical" zones by calculating bounds relative to the *visible* portion of the background, not the container.
- **Micro-Interaction Pause**: Pause secondary animations on hover to signal interactivity and reduce visual noise during user focus.

---

## Style Standards

- **Theme:** "Black on Black on Black" (#000000). Use true black for backgrounds to create maximum depth and contrast.
- **Accents:** 
    - **Primary:** White (#ffffff) for text and icons.
    - **Highlight:** Subtle Purple (#8b5cf6) for active states, accents, and status indicators.
- **Glassmorphism:** Use semi-transparent backgrounds (`rgba(255, 255, 255, 0.03)`) with `backdrop-filter: blur(10px)` for a premium feel.
- **Icons:** **Mandatory** use of `dc.Icons`. Example: `<dc.Icon icon="star" style={{ color: '#8b5cf6' }} />`.
- **Typography:** Use consistent heading hierarchies to maintain readability and enable structural navigation.
- **Interface Hygiene:** Consolidate top-right actions (Reload, Close, Settings) into a single `ControlsMenu` component to keep the UI clean.
## 🛰️ High-Fidelity Automation UI

When designing automation or dashboard interfaces (e.g., [[111 ObsidianAutomationCDP]]), use the following patterns to achieve a "Hacker/Cyber" premium aesthetic:

1.  **Glassmorphic Cards**: Use semi-transparent dark cards with thin, colorful borders (`rgba(59, 130, 246, 0.3)`) to group controls spatially.
2.  **Color-Coded Status**:
    - **Active/Targeting**: Amber/Yellow (`#f59e0b`) pulse.
    - **Executing**: Purple (`#8b5cf6`) with pulse animation.
    - **Success/Pressed**: Green (`#4ade80`) with box-shadow glow.
3.  **Terminal Echo**: Include a monospaced "Terminal Box" (`#0a0a0a` background) to show real-time CLI commands.

## ✨ Micro-Animations & Feedback

- **Reticle Pulse**: When a component is "targeted", scale it up slightly (`scale(1.2)`) and add a heavy box-shadow.
- **Click Ripples**: Inject global keyframes (via `<style>` tag) for a `clickRipple` effect that expands from the center of a clicked element.
- **Auto-Scroll Tracking**: For long-form grids or logs, use `scrollIntoView({ behavior: 'smooth', block: 'center' })` to keep the active target visible.

> [!TIP]
> Refer to the `MANIFESTO` for the high-level vision driving these design choices.
