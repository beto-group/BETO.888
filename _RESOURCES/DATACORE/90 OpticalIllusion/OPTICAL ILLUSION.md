---
author: beto.group
name.official: OpticalIllusion
version: 1.0.0
price: "0"
category:
  - creative
tags:
  - css-animation
  - scroll-timeline
  - moiré-effect
  - interactive-ui
  - generation-fx
desc: A scroll-driven moiré animation engine that creates high-fidelity visual illusions using CSS scroll-timelines and dynamic stripe mapping.
status: stable
complexity: intermediate
id: 90
resources: [opticalillusion.clip.webm, opticalillusion_1.webp]
longDesc: "OpticalIllusion is an experimental UI component that demonstrates the power of modern CSS scroll-linked animations. It utilizes the Moiré effect—a visual interference pattern created when two similar grids are overlaid at an angle or slightly offset—to simulate complex motion from static assets. The component features an 'Infinite Vertical Scroll' engine that loops the viewport seamlessly, driving a custom @property CSS animation. As the user scrolls, the foreground stripe-grid shifts across high-contrast presets (Runner, Cheetah, BMX), creating a rhythmic 'kinetic' illusion. Designed for high-impact landing pages or technical creative showcases, it provides a unique blend of mathematical visual art and browser-native performance."
does: "[  {    \"title\": \"Moiré Animation Engine\",    \"children\": [      {        \"title\": \"Scroll-Driven Motion\",        \"content\": \"Utilizes native CSS scroll-timelines to synchronize stripe-grid offsets with the user''s vertical scroll position.\"      },      {        \"title\": \"Dynamic Stripe Synthesis\",        \"content\": \"Generates real-time interference patterns through programmable CSS gradients and @property coordinate interpolation.\"      }    ]  },  {    \"title\": \"Infinite Scroll Logic\",    \"children\": [      {        \"title\": \"Seamless Viewport Looping\",        \"content\": \"Implements a React-managed scroll-jump system to provide an infinite vertical movement experience without visual snaps.\"      },      {        \"title\": \"Sticky Visual Staging\",        \"content\": \"Centers the illusion viewport through sticky positioning, allowing the background scroll-depth to drive the animation while keeping the focus stable.\"      }    ]  },  {    \"title\": \"Interactive Presets\",    \"children\": [      {        \"title\": \"Visual Motion Library\",        \"content\": \"Includes pre-configured mapping for high-fidelity moiré effects: Human Runner, Running Cheetah, and BMX Stunts.\"      },      {        \"title\": \"Real-Time Mode Switching\",        \"content\": \"Provides a tactical UI HUD for instantaneous switching between different visual algorithms and image sources.\"      }    ]  }]"
cant: '[  {    \"title\": \"Legacy Browser Support\",    \"content\": \"The core moiré effect relies on modern CSS scroll-driven animations; it will fall back to a static view in browsers without scroll-timeline support.\"  },  {    \"title\": \"Custom Asset Pipeline\",    \"content\": \"The moiré alignment is highly sensitive to stripe-pixel ratios; custom image uploads are not supported without manual CSS coordinate tuning.\"  },  {    \"title\": \"Horizontal Scroll Drive\",    \"content\": \"The current animation logic is strictly mapped to vertical Y-axis scrolling; horizontal scroll-triggers are not supported.\"  }]'
version.obsidian: 1.4.11
---

### Tab: Optical Illusion

- **Description**: Optical Illusion is a scroll-driven moiré mapping engine that creates high-fidelity visual illusions using CSS scroll-timelines and dynamic stripe synchronization. It leverages the Moiré effect—visual interference created by grid overlays—to simulate complex motion from static assets purely through interaction.

- **Does**:

    - **Moiré Animation Engine**: Synchronizes stripe-grid offsets with native CSS scroll-timelines for user-driven motion.
    - **Dynamic Stripe Synthesis**: Generates interference patterns via programmable gradients and `@property` interpolation.
    - **Infinite Vertical Scroll**: Implements a seamless scroll-jump system for uninterrupted kinetic movement.
    - **Sticky Visual Staging**: Positions focal points through sticky centering while external scroll-depth drives the effect.
    - **Interactive Preset Library**: Includes pre-configured mappings for Human Runner, Running Cheetah, and BMX visuals.
    - **Tactical Mode Switching**: Integrated UI HUD for real-time switching between different visual algorithms.

- **Can't**:

    - **Legacy Browser Rendering**: Relying on modern scroll-driven animation; lacks support on non-compliant browsers.
    - **Automated Asset Ingestion**: Moiré alignment requires precise stripe-pixel ratios; not suitable for arbitrary uploads.
    - **Horizontal Scroll Trigger**: Current logic is strictly Y-axis mapped; does not support horizontal scroll input.


------
![Optical Illusion Clip](_resources/videos/opticalillusion.clip.webm)

![Optical Illusion Screenshot 1](_resources/images/opticalillusion_1.webp)

### Components
###### [Optical Illusion Viewer](D.q.opticalillusion.viewer.md)
###### [Optical Illusion Components {index.jsx}](_RESOURCES/DATACORE/90%20OpticalIllusion/src/index.jsx)
