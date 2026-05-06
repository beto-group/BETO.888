---
name: io-and-data
description: Rules for robust file I/O, reactive data systems, and human-input management.
---

# 💾 I/O & Data: The Resilience Manifesto

This document outlines the protocols for reliable data handling, reactive synchronization, and robust file operations within the Datacore environment.

<ArchitectureRules>
<RuleCategory name="File Systems & Controls">
<Rule name="Robust I/O">Use the `dc.app.vault.adapter` for direct filesystem access when standard hooks fail.</Rule>
<Rule name="Frontmatter Mastery">Always treat Markdown frontmatter as the primary metadata store for components.</Rule>
<Rule name="Localization">Data files (JSON, CSV, DB) should be localized to `<component>/_resources/data/` to ensure modularity.</Rule>
</RuleCategory>

<RuleCategory name="Reactive Data Systems">
<Rule name="DQL (Datacore Query Language)">Use for real-time, reactive views that update as files change.</Rule>
<Rule name="State Management">Prefer local React state (`useState`) for UI and external storage (Vault) for persistence.</Rule>
</RuleCategory>

<RuleCategory name="Human Input Management">
<Rule name="Event Handling">Efficiently manage keyboard and mouse events to avoid memory leaks.</Rule>
<Rule name="Singleton Prevention">Ensure only one instance of a heavy listener is active at a time to prevent CPU spikes.</Rule>
</RuleCategory>
</ArchitectureRules>

---
*Persistence is the foundation of resilience.*
