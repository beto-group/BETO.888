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
id: 95
resources:
  - optical_illusion_1.webp
longDesc: "OpticalIllusion is an experimental UI component that demonstrates the power of modern CSS scroll-linked animations. It utilizes the Moiré effect—a visual interference pattern created when two similar grids are overlaid at an angle or slightly offset—to simulate complex motion from static assets. The component features an 'Infinite Vertical Scroll' engine that loops the viewport seamlessly, driving a custom @property CSS animation. As the user scrolls, the foreground stripe-grid shifts across high-contrast presets (Runner, Cheetah, BMX), creating a rhythmic 'kinetic' illusion. Designed for high-impact landing pages or technical creative showcases, it provides a unique blend of mathematical visual art and browser-native performance."
does: "[  {    \"title\": \"Moiré Animation Engine\",    \"children\": [      {        \"title\": \"Scroll-Driven Motion\",        \"content\": \"Utilizes native CSS scroll-timelines to synchronize stripe-grid offsets with the user''s vertical scroll position.\"      },      {        \"title\": \"Dynamic Stripe Synthesis\",        \"content\": \"Generates real-time interference patterns through programmable CSS gradients and @property coordinate interpolation.\"      }    ]  },  {    \"title\": \"Infinite Scroll Logic\",    \"children\": [      {        \"title\": \"Seamless Viewport Looping\",        \"content\": \"Implements a React-managed scroll-jump system to provide an infinite vertical movement experience without visual snaps.\"      },      {        \"title\": \"Sticky Visual Staging\",        \"content\": \"Centers the illusion viewport through sticky positioning, allowing the background scroll-depth to drive the animation while keeping the focus stable.\"      }    ]  },  {    \"title\": \"Interactive Presets\",    \"children\": [      {        \"title\": \"Visual Motion Library\",        \"content\": \"Includes pre-configured mapping for high-fidelity moiré effects: Human Runner, Running Cheetah, and BMX Stunts.\"      },      {        \"title\": \"Real-Time Mode Switching\",        \"content\": \"Provides a tactical UI HUD for instantaneous switching between different visual algorithms and image sources.\"      }    ]  }]"
cant: '[  {    \"title\": \"Legacy Browser Support\",    \"content\": \"The core moiré effect relies on modern CSS scroll-driven animations; it will fall back to a static view in browsers without scroll-timeline support.\"  },  {    \"title\": \"Custom Asset Pipeline\",    \"content\": \"The moiré alignment is highly sensitive to stripe-pixel ratios; custom image uploads are not supported without manual CSS coordinate tuning.\"  },  {    \"title\": \"Horizontal Scroll Drive\",    \"content\": \"The current animation logic is strictly mapped to vertical Y-axis scrolling; horizontal scroll-triggers are not supported.\"  }]'
version.obsidian: 1.4.11
---

### Tab: OpticalIllusion

- **Description**: A scroll-driven moiré animation engine that creates high-fidelity visual illusions using CSS scroll-timelines and dynamic stripe mapping. It allows for infinitely looping, kinetic visual storytelling driven purely by user interaction.

- **Does**:
   
    - **Moiré Animation Engine**:    
        - **Scroll-Driven Motion**: Utilizes native CSS scroll-timelines to synchronize stripe-grid offsets with the user's vertical scroll position.
        - **Dynamic Stripe Synthesis**: Generates real-time interference patterns through programmable CSS gradients and @property coordinate interpolation.
    - **Infinite Scroll Logic**:
        - **Seamless Viewport Looping**: Implements a React-managed scroll-jump system to provide an infinite vertical movement experience without visual snaps.
        - **Sticky Visual Staging**: Centers the illusion viewport through sticky positioning, allowing the background scroll-depth to drive the animation while keeping the focus stable.
    - **Interactive Presets**:
        - **Visual Motion Library**: Includes pre-configured mapping for high-fidelity moiré effects: Human Runner, Running Cheetah, and BMX Stunts.
        - **Real-Time Mode Switching**: Provides a tactical UI HUD for instantaneous switching between different visual algorithms and image sources.

- **Can’t**:
   
    - **Legacy Browser Support**: The core moiré effect relies on modern CSS scroll-driven animations; it will fall back to a static view in browsers without scroll-timeline support.    
    - **Custom Asset Pipeline**: The moiré alignment is highly sensitive to stripe-pixel ratios; custom image uploads are not supported without manual CSS coordinate tuning.
    - **Horizontal Scroll Drive**: The current animation logic is strictly mapped to vertical Y-axis scrolling; horizontal scroll-triggers are not supported.


----

![optical_illusion_1.webp](_resources/images/optical_illusion_1.webp)


### Components

###### [OpticalIllusion Viewer](D.q.opticalillusion.viewer.md)
