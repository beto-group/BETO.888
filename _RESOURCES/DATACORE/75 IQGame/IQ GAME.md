---
author: beto.group
name.official: IQ Game
version: 1.0.0
price: "0"
category:
  - game
  - training
tags:
  - n-back
  - memory
  - brain-training
  - cognition
  - adaptive
desc: A professional Dual N-Back working memory training game with adaptive difficulty progression and performance analytics.
status: stable
complexity: intermediate
id: 81
resources:
  - iq_game_1.webp
longDesc: 'A comprehensive cognitive training tool implementing the Dual N-Back task. It challenges users to track both visual positions on a 3x3 grid and auditory stimuli simultaneously. The component features an adaptive difficulty engine that automatically adjusts the N-level based on performance thresholds, detailed session analytics including D-prime scores, and persistent session tracking to monitor cognitive progress over time.'
does: "[  {    \"title\": \"Dual N-Back Training\",    \"children\": [      {        \"title\": \"Multi-Modal Stimuli\",        \"content\": \"Simultaneously tracks visual position in a 3x3 grid and spoken letter audio cues using local system TTS.\"      },      {        \"title\": \"Adaptive Difficulty\",        \"content\": \"Automatically increases or decreases the N-level based on performance accuracy (80% for level-up, 70% for level-down).\"      }    ]  },  {    \"title\": \"Performance Analytics\",    \"children\": [      {        \"title\": \"Advanced Metrics\",        \"content\": \"Calculates real-time hits, misses, false alarms, and D-prime sensitivity scores for each session.\"      },      {        \"title\": \"Reaction Time Tracking\",        \"content\": \"Monitors and records user response times for both visual and auditory matches to identify processing speed trends.\"      }    ]  },  {    \"title\": \"Session Management\",    \"children\": [      {        \"title\": \"Persistent Progress\",        \"content\": \"Saves detailed session data (N-level, score, timestamp) to the vault via a dedicated score manager for longitudinal tracking.\"      },      {        \"title\": \"Full-Tab Optimization\",        \"content\": \"Designed for immersion with a dedicated full-pane view that hides distractions and optimizes the UI for focused training.\"      }    ]  }]"
cant: '[  {    "title": "Configurable Audio Samples",    "content": "Uses the system browser''s native Speech Synthesis API for audio cues and does not support external audio file imports."  },  {    "title": "Alternative Grid Layouts",    "content": "The game is strictly optimized for the standard 3x3 grid pattern and does not support custom board sizes or layouts."  },  {    "title": "Cross-Device Progress Syncing",    "content": "Session data is stored locally within the Obsidian vault and requires manual metadata management for syncing across multiple devices."  }]'
version.obsidian: 1.4.11
---

### Tab: IQ Game

- **Description**: A professional Dual N-Back working memory training game with adaptive difficulty progression and performance analytics. It challenges users to track both visual positions on a 3x3 grid and auditory stimuli simultaneously.

- **Does**:
   
    - **Dual N-Back Training**:    
        - **Multi-Modal Stimuli**: Simultaneously tracks visual position in a 3x3 grid and spoken letter audio cues using local system TTS.
        - **Adaptive Difficulty**: Automatically increases or decreases the N-level based on performance accuracy (80% for level-up, 70% for level-down).
    - **Performance Analytics**:
        - **Advanced Metrics**: Calculates real-time hits, misses, false alarms, and D-prime sensitivity scores for each session.
        - **Reaction Time Tracking**: Monitors and records user response times for both visual and auditory matches to identify processing speed trends.
    - **Session Management**:
        - **Persistent Progress**: Saves detailed session data (N-level, score, timestamp) to the vault via a dedicated score manager for longitudinal tracking.
        - **Full-Tab Optimization**: Designed for immersion with a dedicated full-pane view that hides distractions and optimizes the UI for focused training.

- **Can’t**:
   
    - **Configurable Audio Samples**: Uses the system browser's native Speech Synthesis API for audio cues and does not support external audio file imports.    
    - **Alternative Grid Layouts**: The game is strictly optimized for the standard 3x3 grid pattern and does not support custom board sizes or layouts.
    - **Cross-Device Progress Syncing**: Session data is stored locally within the Obsidian vault and requires manual metadata management for syncing across multiple devices.


----

![iq_game_1.webp](_resources/images/iq_game_1.webp)


### Components

###### [IQ Game Viewer](D.q.iqgame.viewer.md)
