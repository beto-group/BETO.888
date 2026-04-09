# 🤪 Ralph Wiggum Methodology ("I'm in danger!")

**Philosophy**: *Deterministically bad in an undeterministic world.*

This methodology embraces the chaotic nature of AI coding by enforcing **Stateless Loops** and **External Memory**.

## Core Principles

1.  **File System is King (External Memory)**
    *   **NEVER** rely on the chat history or "what I said 5 minutes ago" as the source of truth.
    *   **ALWAYS** read the current state of files (`index.jsx`, `task.md`) before making a decision.
    *   The code on the disk is the *only* reality.

2.  **Fresh Starts (Statelessness)**
    *   Each agent invocation should act as if it's the first time it's seeing the project.
    *   Context pollution is the enemy. If you are confused, re-read the files (`PROJECT_CONTEXT.md`), don't hallucinate functionality.

3.  **The Loop (Feedback Driven)**
    *   We expect failure.
    *   When failure happens (lint error, test failure), we don't argue. We iterate.
    *   **Action -> Error -> Read Files -> New Action.**

4.  **Simplicity**
    *   Complex plans usually fail.
    *   Break tasks down until they are "stupidly simple".
    *   If a task feels dangerous ("I'm in danger!"), stop and break it down further.
