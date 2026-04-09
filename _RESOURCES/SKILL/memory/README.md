# Operational Memory: The Continuous Context Layer

This directory serves as the dynamic, read-write memory for Datacore agents. While the `knowledge/` folder contains hardcoded, static laws and architecture documentation, the `memory/` folder provides the **statefulness** necessary for continuous operation across different sessions and agents.

## 🧠 Why Memory?
When you start a new chat with an agent, it forgets the subtle context developed in the previous conversation. By reading and appending to files in this directory, agents can quickly spin up and understand the nuance of current directives.

## 🛠️ Usage Patterns

### 1. The Sprint Tracker (`sprint.md`)
Agents should log their current overarching goal here. Before starting a session, an agent reads this file to understand the "Why" behind their immediate tasks.

### 2. The Tech Debt Ledger (`debt.md`)
Agents must log minor refactors they avoided (due to scope) or known messy implementations here.

### 3. The Incident Log (`incidents.md`)
When a major crash or blocking bug is resolved, the root cause and solution must be logged here. Future debugging agents will `grep` this file first before hallucinating new fixes for repetitive problems.

## 🛑 Rule of Thumb
**Never store API keys or secrets in this folder.** It is purely for operational, team coordination context.
