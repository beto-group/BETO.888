# 🎨 Graphics and UI: The Iconographic Standard (v1.0)

<AgentDirectives>
<Directive name="Emoji Prohibition" severity="CRITICAL">
As of v4.2, raw emojis are BANNED in all Datacore UI components. Use `<dc.Icon />` exclusively.
</Directive>

<Directive name="The Lucide Protocol">
All components must use the internal Datacore Lucide icon set. This ensures:
1. Scalability: Icons remain sharp at any resolution.
2. Theming: Icons respond to OKLCH color tokens and dynamic CSS variables.
3. Consistency: A cohesive "Enterprise Bento" look across all tools.
</Directive>
</AgentDirectives>

<ImplementationRules>
<Rule name="Icon Component Usage">
Use the standard Datacore component for rendering icons:
```jsx
<dc.Icon 
    icon="name" 
    style={{ width: '20px', height: '20px', color: 'oklch(70% 0.15 280)' }} 
/>
```
</Rule>

<Rule name="Styling Icons">
Icons should generally follow the Secondary Accent color of the component.
- Active State: Use `fill: currentColor` for filled icons like `circle`.
- Micro-Animations: Use classes like `lucide-spin` for loading states.
</Rule>
</ImplementationRules>

<MappingStandards>
Use the following semantic mappings for UI elements:
- Dashboards: `layout-dashboard`, `activity`
- Infrastructure: `cloud`, `server`, `network`, `cpu`
- Data/Storage: `database`, `hard-drive`, `table-properties`
- Security/Filters: `shield-check`, `filter`, `lock`
- Interactions: `zap` (Action), `rotate-cw` (Refresh), `power` (Suspend)
- Telemetry: `terminal`, `list`, `monitor`
</MappingStandards>

---
*Stay Impeccable. Stay Lucide.*
