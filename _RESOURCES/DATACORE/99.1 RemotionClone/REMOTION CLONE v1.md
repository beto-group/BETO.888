---
id: 99.1
name.official: Remotion Clone v1
author: beto.group
version: 1.0.0
category:
  - creation
  - motion
tags:
  - remotion
  - react
  - video-orchestration
  - frame-accurate
  - cinematography
desc: The foundational orchestration engine for React-based cinematic motion graphics.
status: stable
complexity: advanced
resources: [remotionclonev1.clip.webm, remotionclonev1_1.webp]
---

### Tab: Remotion Clone v1

- **Description**: Remotion Clone v1 is the foundational orchestration engine for React-based cinematic motion graphics. It provides the core timeline logic and frame-accurate playback foundation for the entire BetoOS motion suite, enabling developers to build complex, sequenceable animations within a native Obsidian environment.

- **Does**:

    - **Frame-based Timeline**: High-precision frame scrubbing with real-time feedback for complex animations.
    - **Sequencer Foundation**: Core logic for clip temporal alignment and stage management.
    - **Stage Orchestration**: Brute-force DOM reparenting to ensure immersive Full-Tab playback.
    - **Performance Optimized**: Locked 30fps playback engine designed for real-time code-to-video evaluation.

- **Can't**:

    - **Advanced Export Pipeline**: Lacks the high-speed native frame-synthesis available in v2.
    - **Modular Library Discovery**: Components must be manually registered in the foundational composition tree.

------

![remotionclonev1.clip.webm](_resources/videos/remotionclonev1.clip.webm)

![remotionclonev1_1.webp](_resources/images/remotionclonev1_1.webp)

### Components
###### [Remotion Clone Viewer v1](D.q.remotionclone.viewer.v1.md)
###### [Remotion Clone Components v1 {index.jsx}](src/index.jsx)

