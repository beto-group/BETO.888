<!--
Source: Based on Obsidian community best practices
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Review periodically for AI agent-specific guidance
-->

# Agent do/don't

## Do
- **.ref folder setup**: When user asks to add a reference, check if it already exists first. For external repos:
  - **Clone directly** into the target folder: `../.ref/obsidian-dev/plugins/<name>/` (for plugins), `../.ref/obsidian-dev/themes/<name>/` (for themes), or `../.ref/obsidian-dev/<name>/` (for other projects)
  - **DO NOT** create a `.ref` subfolder inside the plugins/themes folder - clone the repo directly there
  - Then create symlink in project's `.ref/` folder pointing to the global location
  - For local projects, symlink directly in project's `.ref/` (don't clone to global)
  - See [ref-instructions.md](ref-instructions.md) for details.
- Add commands with stable IDs (don't rename once released).
- Provide defaults and validation in settings.
- Write idempotent code paths so reload/unload doesn't leak listeners or intervals.
- Use `this.register*` helpers for everything that needs cleanup.
- **Always run `pnpm build` after making changes** to catch build errors early. Only check for pnpm installation if the build fails. See [build-workflow.md](build-workflow.md) for details.
- **Automated Verification via CDP**: Before delivering a component, perform a "CDP Live Test Loop" using the Obsidian CLI to verify DOM state and trigger interactions (clicks, inputs). Never rely solely on visual inspection or screenshots.
- **Summarize commands**: When user requests "Summarize" or "Summarize for release", follow the workflow in [summarize-commands.md](summarize-commands.md). Always read actual file changes, not just chat history.
- **Release preparation**: When user asks "is my plugin ready for release?" or similar, use [release-readiness.md](release-readiness.md) checklist. Run automated checks where possible, ask user interactively for items requiring their input (like platform testing).
- **Lifecycle Integrity (Arm & Decommission)**: When adding complex configurations (handlers, listeners, library injections), ensure the Datacore component provides both an "Arm" (Configure) and "Decommission" (Uninstall) path. Use a persistent flag file (e.g., `recordings/.armed`) to synchronize this state with external processes like shell proxies, ensuring the CLI documentation (e.g., `obsidian --help`) stays in sync with the component state. This prevents vault-wide configuration leakage and allows for clean environment resets during development.

## Don't
- Introduce network calls without an obvious user-facing reason and documentation.
- Ship features that require cloud services without clear disclosure and explicit opt-in.
- Store or transmit vault contents unless essential and consented.
- **File structure**: Never have `main.ts` in both root AND `src/` - this causes build confusion. For simple plugins, `main.ts` in root is acceptable. For plugins with multiple files, place `main.ts` in `src/` (recommended). See [file-conventions.md](file-conventions.md) and [common-pitfalls.md](common-pitfalls.md#maints-file-location).
- **Git operations**: Never automatically commit, push, or perform any git operations. All git operations must be left to the user.
- **Git updates**: When checking for updates to repos in `.ref`, you can use read-only commands like `git fetch` and `git log` to check what's new, but **never automatically pull** - always ask the user first. See [ref-instructions.md](ref-instructions.md) for how to check for updates.

## Fixing Linting Errors

**DO**:
- Read the error message carefully - note the exact line and column
- Understand what the error is actually complaining about
- Check the [linting-fixes-guide.md](linting-fixes-guide.md) for the specific error type
- Fix the root cause, not the symptom
- Test with `pnpm lint` after each fix
- Verify `pnpm build` still works

**DON'T**:
- Add eslint-disable comments without understanding why
- Put disable comments on the wrong line
- Try the same fix multiple times without understanding why it failed
- Suppress errors as a shortcut
- Assume the error location matches where you think the problem is
- Skip reading the documentation for the specific error type

**When Stuck**:
1. Read the error message - what line/column is it complaining about?
2. Check [linting-fixes-guide.md](linting-fixes-guide.md) for that specific error type
3. Understand the type signature - what does the function expect?
4. Fix the actual type mismatch, not just suppress the warning
5. If you've tried the same thing 3 times, stop and re-read the error message


# CLI Registration Patterns (Datacore)

When implementing CLI commands in Datacore components using the `CliLab` bridge, follow these patterns to ensure stability, avoid memory leaks, and bypass caching issues.

## 🏆 Unified Command Registry Pattern

This is the standard pattern for registering multiple commands cleanly within a hook.

```javascript
function useMyCommands(cli) {
    const { useCallback, useRef, useEffect } = dc;
    const hasRegistered = useRef(false);

    const registerCommands = useCallback((isAuto = false) => {
        if (!cli.isAvailable()) return false;
        if (isAuto && hasRegistered.current) return true;

        const commandList = [
            { 
                name: 'my:command', 
                handler: async (payload) => { /* logic */ } 
            },
            { 
                name: 'my:dev-tool', 
                handler: async (payload) => { /* logic */ } 
            }
        ];

        commandList.forEach(cmd => {
            cli.register(cmd.name, cmd.handler);
            cli.register(`dev:${cmd.name}`, cmd.handler); // Always register dev alias
        });

        hasRegistered.current = true;
        return true;
    }, [cli]);

    useEffect(() => {
        // Delay ensures bridge availability
        const timer = setTimeout(() => registerCommands(true), 500);
        return () => clearTimeout(timer);
    }, [registerCommands]);

    return { registerCommands };
}
```

## ⚠️ Critical Resilience Rules

### 1. SingletonLock Prevention
Direct terminal calls to the Obsidian binary trigger a `SingletonLock` error if the app is already open.
- **Rule**: Never call `/Applications/Obsidian.app/...` directly for dev commands.
- **Protocol**: Route through the `obsidian_proxy.sh` which uses `eval` to talk to the active process.

### 2. Datacore Script Cache Bypassing
`dc.require` caches script content. Modifying a file will NOT reload it in the active view.
- **Rule**: If logic changes, rename the file (e.g., `hook_v1.js` -> `hook_v2.js`).
- **Protocol**: Update the `index.jsx` or entry point to point to the new version.

### 4. Vault Path Resolution
When creating commands that interact with the local filesystem (like Syncthing folder creation), always dynamically resolve the vault path.
- **Pattern**: `const vaultPath = dc.app.vault.adapter.basePath;`
- **Use Case**: Automating the "Sync this Vault" operation via `syncthing:add-vault`.

# Native Plugin Stability (Hybrid Orchestration)

When deploying Datacore-compatible components as native Obsidian plugins, always use the **Universal Hybrid Orchestrator** pattern to prevent React #130 errors and resource erasure.

- **Primary Blueprint**: [HYBRID_ORCHESTRATOR.md](./architecture-patterns/hybrid-orchestrator.md)
- **Key Directive**: Force physical bundling via top-level `require()` and implement a **14-Point Flight Check** to verify module integrity.
- **Platform Shims**: Ensure the `dc` context contains a native `Icon` bridge to satisfy App-level JSX dependencies.
<!--
Source: Complete examples from obsidian-sample-plugin, obsidian-plugin-docs, and obsidian-api (API is authoritative)
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check reference repos for new patterns
-->

# Code Patterns

Comprehensive code patterns for common Obsidian plugin development tasks. **Always verify API details in `.ref/obsidian-api/obsidian.d.ts`** - it's the authoritative source and may have features not yet documented in plugin docs.

**When to use this vs [common-tasks.md](common-tasks.md)**:
- **code-patterns.md**: Complete, production-ready examples with full context, error handling, and best practices
- **common-tasks.md**: Quick snippets and basic patterns for simple operations

## 👻 Ghost-Snap Hijacking (Datacore)

Ghost-Snap is the practice of reparenting a Datacore component from its hidden mounting point into a visible Obsidian leaf container to achieve a "FullTab" UI.

### Targeting Strategy
- **`.cm-scroller` (Integrated)**:
    - **Vibe**: Respectful, embedded, "Pro Note".
    - **Logic**: Mounts inside the editor area.
    - **Pros**: Preserves `.view-header` (tabs, title, close buttons). Respects sidebars.
    - **Cons**: Limited to the scroller's width/padding rules unless forced.
- **`.view-content` (Erasure)**:
    - **Vibe**: Immersion, standalone app, "OS Mode".
    - **Logic**: Mounts inside the entire leaf content wrapper.
    - **Pros**: Absolute 100% coverage of the tab area.
    - **Cons**: Often requires manual suppression of `.view-header` to avoid awkward overlaps.

### Implementation Checklist
1. **Atomic Init**: Start with `visibility: hidden` to avoid flicker.
2. **Poller Loop**: Use a 16ms interval and `container.closest('.workspace-leaf')` to find the target.
3. **Style Handoff**: Set `position: absolute; inset: 0;` after appending to fill the target.
4. **Visibility Sync**: Only set `visibility: visible` once the DOM handoff is confirmed.

---

## Complete Settings Tab

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts`, `.ref/obsidian-plugin-docs/docs/guides/settings.md`, and `.ref/obsidian-api/obsidian.d.ts`

**Note**: `SettingGroup` is available in the API since 1.11.0 but may not be documented in plugin docs yet. Always check the API first.

```ts
import { App, PluginSettingTab, Setting } from "obsidian";

interface MyPluginSettings {
  textSetting: string;
  toggleSetting: boolean;
  dropdownSetting: string;
  sliderValue: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  textSetting: "default",
  toggleSetting: true,
  dropdownSetting: "option1",
  sliderValue: 50,
};

class MySettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Text input
    new Setting(containerEl)
      .setName("Text setting")
      .setDesc("Description of text setting")
      .addText((text) =>
        text
          .setPlaceholder("Enter text")
          .setValue(this.plugin.settings.textSetting)
          .onChange(async (value) => {
            this.plugin.settings.textSetting = value;
            await this.plugin.saveSettings();
          })
      );

    // Toggle
    new Setting(containerEl)
      .setName("Toggle setting")
      .setDesc("Enable or disable feature")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.toggleSetting)
          .onChange(async (value) => {
            this.plugin.settings.toggleSetting = value;
            await this.plugin.saveSettings();
            this.display(); // Re-render if toggle affects other settings
          })
      );

    // Dropdown
    new Setting(containerEl)
      .setName("Dropdown setting")
      .setDesc("Select an option")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("option1", "Option 1")
          .addOption("option2", "Option 2")
          .addOption("option3", "Option 3")
          .setValue(this.plugin.settings.dropdownSetting)
          .onChange(async (value) => {
            this.plugin.settings.dropdownSetting = value;
            await this.plugin.saveSettings();
          })
      );

    // Slider
    new Setting(containerEl)
      .setName("Slider setting")
      .setDesc(`Value: ${this.plugin.settings.sliderValue}`)
      .addSlider((slider) =>
        slider
          .setLimits(0, 100, 1)
          .setValue(this.plugin.settings.sliderValue)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.sliderValue = value;
            await this.plugin.saveSettings();
            this.display(); // Update description
          })
      );

    // Setting with extra button
    new Setting(containerEl)
      .setName("Setting with reset")
      .addText((text) =>
        text.setValue(this.plugin.settings.textSetting)
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("reset")
          .setTooltip("Reset to default")
          .onClick(async () => {
            this.plugin.settings.textSetting = DEFAULT_SETTINGS.textSetting;
            await this.plugin.saveSettings();
            this.display();
          })
      );
  }
}

// In main plugin class:
this.addSettingTab(new MySettingTab(this.app, this));
```

## Settings with Groups (Conditional / Backward Compatible)

**Source**: Based on `.ref/obsidian-api/obsidian.d.ts` (API is authoritative) - `SettingGroup` requires API 1.11.0+

**Use this when**: You want to use `SettingGroup` for users on Obsidian 1.11.0+ while still supporting older versions. This provides conditional settings groups that automatically use the modern API when available, with a fallback for older versions.

**Note**: Use the backward compatibility approach below to support both users on Obsidian 1.11.0+ and users on older versions. Alternatively, you can choose to:
- Continue using the compatibility utility (supports all versions)
- Force `minAppVersion: "1.11.0"` in `manifest.json` and use `SettingGroup` directly (simpler, but excludes older versions)

### Step 1: Create the Compatibility Utility

Create `src/utils/settings-compat.ts` (or wherever you keep utilities):

```ts
/**
 * Compatibility utilities for settings
 * Provides backward compatibility for SettingGroup (requires API 1.11.0+)
 */
import { Setting, requireApiVersion } from 'obsidian';

/**
 * Type definition for SettingGroup constructor
 * Note: SettingGroup may exist at runtime in 1.11.0+ but may not be in TypeScript definitions
 * 
 * IMPORTANT: This type signature is inferred from usage patterns. When .ref/obsidian-api/obsidian.d.ts
 * is available, verify the actual signature there. The signature shown here matches the expected
 * behavior based on Obsidian's API design patterns.
 */
type SettingGroupConstructor = new (containerEl: HTMLElement) => {
  setHeading(heading: string): {
    addSetting(cb: (setting: Setting) => void): void;
  };
};

/**
 * Interface that works with both SettingGroup and fallback container
 */
export interface SettingsContainer {
  addSetting(cb: (setting: Setting) => void): void;
}

/**
 * Creates a settings container that uses SettingGroup if available (API 1.11.0+),
 * otherwise falls back to creating a heading and using the container directly.
 * 
 * Uses requireApiVersion('1.11.0') to check if SettingGroup is available.
 * This is the official Obsidian API method for version checking.
 * 
 * IMPORTANT: We use dynamic require() instead of direct import because SettingGroup
 * may not be in TypeScript type definitions even if it exists at runtime in 1.11.0+.
 * This avoids compile-time TypeScript errors while still working at runtime.
 * 
 * @param containerEl - The container element for settings
 * @param heading - The heading text for the settings group (optional)
 * @param manifestId - The plugin's manifest ID for CSS scoping (required for fallback mode)
 * @returns A container that can be used to add settings
 */
export function createSettingsGroup(
  containerEl: HTMLElement,
  heading?: string,
  manifestId?: string
): SettingsContainer {
  // Check if SettingGroup is available (API 1.11.0+)
  // requireApiVersion is the official Obsidian API method for version checking
  if (requireApiVersion('1.11.0')) {
    // Use dynamic require() to access SettingGroup at runtime
    // This avoids TypeScript errors when SettingGroup isn't in type definitions
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const obsidian = require('obsidian');
    const SettingGroup = obsidian.SettingGroup as SettingGroupConstructor;
    
    // Use SettingGroup - it's guaranteed to exist if requireApiVersion returns true
    const group = heading 
      ? new SettingGroup(containerEl).setHeading(heading)
      : new SettingGroup(containerEl);
    return {
      addSetting(cb: (setting: Setting) => void) {
        group.addSetting(cb);
      }
    };
  } else {
    // Fallback path (either API < 1.11.0 or SettingGroup not found)
    // Add scoping class to containerEl to scope CSS to only this plugin's settings
    if (manifestId) {
      containerEl.addClass(`${manifestId}-settings-compat`);
    }
    
    // Fallback: Create a heading manually and use container directly
    if (heading) {
      const headingEl = containerEl.createDiv('setting-group-heading');
      headingEl.createEl('h3', { text: heading });
    }
        
    return {
      addSetting(cb: (setting: Setting) => void) {
        const setting = new Setting(containerEl);
        cb(setting);
      }
    };
  }
}
```

**Note**: The dynamic `require()` approach is necessary because `SettingGroup` may not be in TypeScript type definitions even if it exists at runtime in Obsidian 1.11.0+. This avoids compile-time TypeScript errors while maintaining runtime compatibility.

### Step 2: Use in Settings Tab

Update your settings tab to use the compatibility utility:

```ts
import { App, PluginSettingTab, Setting } from "obsidian";
import { createSettingsGroup } from "./utils/settings-compat";

interface MyPluginSettings {
  generalEnabled: boolean;
  generalTimeout: number;
  advancedDebug: boolean;
  advancedLogLevel: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  generalEnabled: true,
  generalTimeout: 5000,
  advancedDebug: false,
  advancedLogLevel: "info",
};

class MySettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // General Settings Group
    const generalGroup = createSettingsGroup(containerEl, "General Settings", "my-plugin");
    
    generalGroup.addSetting((setting) => {
      setting
        .setName("Enable feature")
        .setDesc("Enable or disable the main feature")
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.settings.generalEnabled)
            .onChange(async (value) => {
              this.plugin.settings.generalEnabled = value;
              await this.plugin.saveSettings();
            });
        });
    });

    generalGroup.addSetting((setting) => {
      setting
        .setName("Timeout")
        .setDesc("Timeout in milliseconds")
        .addSlider((slider) => {
          slider
            .setLimits(1000, 10000, 500)
            .setValue(this.plugin.settings.generalTimeout)
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.generalTimeout = value;
              await this.plugin.saveSettings();
            });
        });
    });

    // Advanced Settings Group
    const advancedGroup = createSettingsGroup(containerEl, "Advanced Settings", "my-plugin");
    
    advancedGroup.addSetting((setting) => {
      setting
        .setName("Debug mode")
        .setDesc("Enable debug logging")
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.settings.advancedDebug)
            .onChange(async (value) => {
              this.plugin.settings.advancedDebug = value;
              await this.plugin.saveSettings();
            });
        });
    });

    advancedGroup.addSetting((setting) => {
      setting
        .setName("Log level")
        .setDesc("Set the logging level")
        .addDropdown((dropdown) => {
          dropdown
            .addOption("info", "Info")
            .addOption("warn", "Warning")
            .addOption("error", "Error")
            .setValue(this.plugin.settings.advancedLogLevel)
            .onChange(async (value) => {
              this.plugin.settings.advancedLogLevel = value;
              await this.plugin.saveSettings();
            });
        });
    });
  }
}

// In main plugin class:
this.addSettingTab(new MySettingTab(this.app, this));
```

### Step 3: Add CSS Styling (Required for Older Obsidian Builds)

**Important**: When using the compatibility utility for older Obsidian builds (< 1.11.0), you must add CSS to prevent double divider lines. The fallback creates a heading with class `setting-group-heading`, and without proper CSS, you'll see a double divider (one from the heading's border-bottom and one from the first setting-item's border-top).

**CRITICAL**: The CSS **MUST** be scoped to your plugin's settings container using a manifest-ID-based class to avoid affecting other plugins' settings. Global CSS selectors will impact all settings in Obsidian, not just your plugin's settings.

Add this CSS to your `styles.css` file, replacing `{manifest-id}` with your plugin's manifest ID:

```css
/* Group settings compatibility styling for older Obsidian builds (< 1.11.0) */
/* Scoped to only this plugin's settings container to avoid affecting other plugins */
.{manifest-id}-settings-compat .setting-group-heading h3 {
    margin: 0 0 0.75rem;
    padding-bottom: 0.5rem;
    padding-top: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    border-bottom: none !important;
}
```

**Example**: If your manifest ID is `sample-plugin`, use `.sample-plugin-settings-compat` as the scoping class.

**How it works**:
- The CSS uses the `:has()` selector to detect if a `.setting-item` immediately follows the heading
- If settings exist below the heading, no border-bottom is applied (avoiding double divider)
- If no settings follow, border-bottom is applied for visual separation
- The scoping class (`{manifest-id}-settings-compat`) ensures CSS only affects headings within this plugin's settings container
- This only affects older builds (< 1.11.0) where the compatibility fallback is used
- On Obsidian 1.11.0+, `SettingGroup` handles styling automatically, so this CSS has no effect

**Note**: The `:has()` selector is well-supported in modern Obsidian (Chromium-based). If you need to support very old browsers, see the alternative TypeScript-based approach in the Common Pitfalls section below.

### How It Works

- **On Obsidian 1.11.0+**: Uses `SettingGroup` with proper styling and grouping
- **On older versions**: Creates a manual heading (`<h3>`) and uses regular `Setting` objects
- **Same API**: Your code using `addSetting()` works identically in both cases

### Common Pitfalls

#### Pitfall 1: TypeScript Errors with SettingGroup Import

**Problem**: You may see this TypeScript error:
```ts
Module '"obsidian"' has no exported member 'SettingGroup'
```

**Cause**: `SettingGroup` may exist at runtime in Obsidian 1.11.0+ but may not be in the TypeScript type definitions, causing compile-time errors.

**Solution**: Use dynamic `require()` instead of direct import, as shown in the compatibility utility above. Do not import `SettingGroup` directly:

```ts
// ❌ WRONG - Causes TypeScript errors
import { SettingGroup } from 'obsidian';

// ✅ CORRECT - Use dynamic require()
// eslint-disable-next-line @typescript-eslint/no-require-imports
const obsidian = require('obsidian');
const SettingGroup = obsidian.SettingGroup as SettingGroupConstructor;
```

#### Pitfall 2: Missing Closing Parentheses

**Problem**: Arrow functions with method chaining need proper closing parentheses and semicolons.

**Solution**: Always include the closing parenthesis and semicolon:

```ts
// ❌ WRONG - Missing closing parenthesis
generalGroup.addSetting((setting) =>
  setting
    .setName("Enable feature")
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.settings.enabled)
    )
// Missing closing parenthesis here!

// ✅ CORRECT - Proper closing
generalGroup.addSetting((setting) =>
  setting
    .setName("Enable feature")
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.settings.enabled)
    )
); // Closing parenthesis and semicolon required
```

#### Pitfall 3: Storing Setting References

**Problem**: If you need to reference a `Setting` object later (e.g., for visibility toggling), you must use block syntax `{ }` instead of expression syntax.

**Solution**: Use block syntax when you need to store references:

```ts
// ❌ WRONG - Can't store reference with expression syntax
let mySetting: Setting;
generalGroup.addSetting((setting) =>
  setting.setName("My Setting")
  // Can't assign: mySetting = setting; (syntax error)
);

// ✅ CORRECT - Use block syntax to store reference
let mySetting: Setting;
generalGroup.addSetting((setting) => {
  mySetting = setting; // Now we can store the reference
  setting
    .setName("My Setting")
    .addToggle((toggle) =>
      toggle.setValue(this.plugin.settings.enabled)
    );
});

// Later, you can use mySetting to toggle visibility:
mySetting.settingEl.style.display = this.plugin.settings.enabled ? "" : "none";
```

### Alternative: Force Minimum Version

If you don't need to support versions before 1.11.0, you can skip the compatibility utility:

1. Set `minAppVersion: "1.11.0"` in your `manifest.json`
2. Use `SettingGroup` directly:

```ts
import { Setting, SettingGroup } from "obsidian";

// In settings tab:
const group = new SettingGroup(containerEl).setHeading("My Settings");
group.addSetting((setting) => {
  // ... configure setting
});
```

**Note**: Even with `minAppVersion: "1.11.0"`, you may still encounter TypeScript errors if `SettingGroup` isn't in the type definitions. In that case, you can still use the compatibility utility approach (it will always use `SettingGroup` when `requireApiVersion('1.11.0')` returns true), or use dynamic `require()` as shown in the compatibility utility.

This approach is simpler but excludes users on older Obsidian versions. The compatibility utility still works and is recommended for maximum flexibility.

## Modal with Form Input

**Source**: Based on `.ref/obsidian-plugin-docs/docs/guides/modals.md`

```ts
import { App, Modal, Notice, Setting } from "obsidian";

interface FormData {
  name: string;
  email: string;
}

class FormModal extends Modal {
  result: FormData;
  onSubmit: (result: FormData) => void;

  constructor(app: App, onSubmit: (result: FormData) => void) {
    super(app);
    this.onSubmit = onSubmit;
    this.result = { name: "", email: "" };
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Enter Information" });

    new Setting(contentEl)
      .setName("Name")
      .addText((text) =>
        text.onChange((value) => {
          this.result.name = value;
        })
      );

    new Setting(contentEl)
      .setName("Email")
      .addText((text) =>
        text
          .setPlaceholder("email@example.com")
          .onChange((value) => {
            this.result.email = value;
          })
      );

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            if (!this.result.name || !this.result.email) {
              new Notice("Please fill in all fields");
              return;
            }
            this.close();
            this.onSubmit(this.result);
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Usage:
new FormModal(this.app, (result) => {
  new Notice(`Submitted: ${result.name} (${result.email})`);
}).open();
```

## SuggestModal Implementation

**Source**: Based on `.ref/obsidian-plugin-docs/docs/guides/modals.md`

```ts
import { App, Notice, SuggestModal } from "obsidian";

interface Item {
  title: string;
  description: string;
}

const ALL_ITEMS: Item[] = [
  { title: "Item 1", description: "Description 1" },
  { title: "Item 2", description: "Description 2" },
];

class ItemSuggestModal extends SuggestModal<Item> {
  onChoose: (item: Item) => void;

  constructor(app: App, onChoose: (item: Item) => void) {
    super(app);
    this.onChoose = onChoose;
  }

  getSuggestions(query: string): Item[] {
    return ALL_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  renderSuggestion(item: Item, el: HTMLElement) {
    el.createEl("div", { text: item.title });
    el.createEl("small", { text: item.description });
  }

  onChooseSuggestion(item: Item, evt: MouseEvent | KeyboardEvent) {
    this.onChoose(item);
  }
}

// Usage:
new ItemSuggestModal(this.app, (item) => {
  new Notice(`Selected: ${item.title}`);
}).open();
```

## Custom View with Registration

**Source**: Based on `.ref/obsidian-plugin-docs/docs/guides/custom-views.md`

```ts
import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_MY_VIEW = "my-view";

export class MyView extends ItemView {
  private content: string;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.content = "Initial content";
  }

  getViewType(): string {
    return VIEW_TYPE_MY_VIEW;
  }

  getDisplayText(): string {
    return "My Custom View";
  }

  getIcon(): string {
    return "document"; // Icon name
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    
    container.createEl("h2", { text: "My View" });
    
    const contentEl = container.createEl("div", { cls: "my-view-content" });
    contentEl.setText(this.content);
    
    // Add interactive elements
    const button = container.createEl("button", { text: "Update" });
    button.addEventListener("click", () => {
      this.updateContent();
    });
  }

  async onClose() {
    // Clean up resources
  }

  private updateContent() {
    const container = this.containerEl.children[1];
    const contentEl = container.querySelector(".my-view-content");
    if (contentEl) {
      this.content = "Updated content";
      contentEl.setText(this.content);
    }
  }
}

// In main plugin class:
export default class MyPlugin extends Plugin {
  async onload() {
    // Register view
    this.registerView(VIEW_TYPE_MY_VIEW, (leaf) => new MyView(leaf));

    // Add command to open view
    this.addCommand({
      id: "open-my-view",
      name: "Open My View",
      callback: () => {
        this.activateView();
      },
    });
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(VIEW_TYPE_MY_VIEW)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_MY_VIEW, active: true });
    }

    workspace.revealLeaf(leaf);
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MY_VIEW);
  }
}
```

## File Operations

**Source**: Based on `.ref/obsidian-api/obsidian.d.ts` (API is authoritative)

```ts
// Read a file
async readFile(file: TFile): Promise<string> {
  return await this.app.vault.read(file);
}

// Write to a file
async writeFile(file: TFile, content: string): Promise<void> {
  await this.app.vault.modify(file, content);
}

// Create a new file
async createFile(path: string, content: string): Promise<TFile> {
  return await this.app.vault.create(path, content);
}

// Delete a file (respects user's trash preference)
async deleteFile(file: TFile): Promise<void> {
  await this.app.fileManager.trashFile(file);
}

// Check if file exists
fileExists(path: string): boolean {
  return this.app.vault.getAbstractFileByPath(path) !== null;
}

// Get all markdown files
getAllMarkdownFiles(): TFile[] {
  return this.app.vault.getMarkdownFiles();
}
```

## Workspace Events

**Source**: Based on `.ref/obsidian-api/obsidian.d.ts` and `.ref/obsidian-sample-plugin/main.ts`

```ts
// File opened event
this.registerEvent(
  this.app.workspace.on("file-open", (file) => {
    if (file) {
      console.log("File opened:", file.path);
    }
  })
);

// Active leaf changed
this.registerEvent(
  this.app.workspace.on("active-leaf-change", (leaf) => {
    if (leaf?.view instanceof MarkdownView) {
      console.log("Active markdown view:", leaf.view.file?.path);
    }
  })
);

// Layout changed
this.registerEvent(
  this.app.workspace.on("layout-change", () => {
    console.log("Workspace layout changed");
  })
);

// Editor change (in markdown view)
this.registerEvent(
  this.app.workspace.on("editor-change", (editor, info) => {
    console.log("Editor changed:", info);
  })
);
```

## Status Bar with Updates

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts` and `.ref/obsidian-plugin-docs/docs/guides/status-bar.md`

```ts
export default class MyPlugin extends Plugin {
  private statusBarItem: HTMLElement;

  async onload() {
    // Create status bar item
    this.statusBarItem = this.addStatusBarItem();
    this.updateStatusBar("Ready");

    // Update status bar periodically
    this.registerInterval(
      window.setInterval(() => {
        this.updateStatusBar(`Time: ${new Date().toLocaleTimeString()}`);
      }, 1000)
    );

    // Update on file open
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file) {
          this.updateStatusBar(`Open: ${file.name}`);
        }
      })
    );
  }

  private updateStatusBar(text: string) {
    this.statusBarItem.empty();
    this.statusBarItem.createEl("span", { text });
  }
}
```

## Editor Interactions

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts` and `.ref/obsidian-api/obsidian.d.ts`

```ts
// Get active editor
getActiveEditor(): Editor | null {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  return view?.editor ?? null;
}

// Get selected text
getSelection(): string {
  const editor = this.getActiveEditor();
  return editor?.getSelection() ?? "";
}

// Replace selection
replaceSelection(text: string) {
  const editor = this.getActiveEditor();
  if (editor) {
    editor.replaceSelection(text);
  }
}

// Insert at cursor
insertAtCursor(text: string) {
  const editor = this.getActiveEditor();
  if (editor) {
    const cursor = editor.getCursor();
    editor.replaceRange(text, cursor);
  }
}

// Get current line
getCurrentLine(): string {
  const editor = this.getActiveEditor();
  if (editor) {
    const line = editor.getCursor().line;
    return editor.getLine(line);
  }
  return "";
}
```

<!--
Source: Based on Obsidian Sample Plugin and TypeScript best practices
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check Obsidian Sample Plugin repo for updates
Applicability: Plugin
-->

# Coding conventions

**Note**: This file is specific to plugin development (TypeScript). For theme development, see CSS/SCSS best practices in other files.

- TypeScript with `"strict": true` preferred.
- **Avoid `any` type**: Use proper types, `unknown`, or type assertions instead. `any` defeats TypeScript's type safety benefits.
- **Keep `main.ts` minimal**: Focus only on plugin lifecycle (onload, onunload, addCommand calls). Delegate all feature logic to separate modules.
- **Split large files**: If any file exceeds ~200-300 lines, consider breaking it into smaller, focused modules.
- **Use clear module boundaries**: Each file should have a single, well-defined responsibility.
- Bundle everything into `main.js` (no unbundled runtime deps).
- Avoid Node/Electron APIs if you want mobile compatibility; set `isDesktopOnly` accordingly.
- Prefer `async/await` over promise chains; handle errors gracefully.


<!--
Source: Based on Obsidian Sample Plugin and community plugin guidelines
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check Obsidian Sample Plugin repo for updates
Applicability: Plugin
-->

# Commands & settings

**Note**: This file is specific to plugin development. Themes do not have commands or settings.

- Any user-facing commands should be added via `this.addCommand(...)`.
- If the plugin has configuration, provide a settings tab and sensible defaults.
- Persist settings using `this.loadData()` / `this.saveData()`.
- Use stable command IDs; avoid renaming once released.

## Version Considerations

When using newer API features (e.g., `SettingGroup` since API 1.11.0), consider backward compatibility:
- **For new plugins**: You can set `minAppVersion: "1.11.0"` in `manifest.json` and use the feature directly
- **For existing plugins**: Use version checking with `requireApiVersion()` to support both newer and older Obsidian versions
- See [code-patterns.md](code-patterns.md) for backward compatibility patterns, including a complete example for `SettingGroup`


<!--
Source: Based on Obsidian Sample Plugin
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check Obsidian Sample Plugin repo for updates
-->

# Common tasks

**Note**: The examples below are for plugin development (TypeScript).

**When to use this vs [code-patterns.md](code-patterns.md)**: 
- **common-tasks.md**: Quick snippets and basic patterns for common operations
- **code-patterns.md**: Complete, production-ready examples with full context and error handling

> **Note**: If user asks "what does the Obsidian API say about X?" or similar, check `.ref/obsidian-api/obsidian.d.ts` first. See [ref-instructions.md](ref-instructions.md) for when to check `.ref` setup.

## Organize code across multiple files

**main.ts** (minimal, lifecycle only):
```ts
import { Plugin } from "obsidian";
import { MySettings, DEFAULT_SETTINGS } from "./settings";
import { registerCommands } from "./commands";

export default class MyPlugin extends Plugin {
  settings: MySettings;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    registerCommands(this);
  }
}
```

**settings.ts**:
```ts
export interface MySettings {
  enabled: boolean;
  apiKey: string;
}

export const DEFAULT_SETTINGS: MySettings = {
  enabled: true,
  apiKey: "",
};
```

**commands/index.ts**:
```ts
import { Plugin } from "obsidian";
import { doSomething } from "./my-command";

export function registerCommands(plugin: Plugin) {
  plugin.addCommand({
    id: "do-something",
    name: "Do something",
    callback: () => doSomething(plugin),
  });
}
```

## Add a command

```ts
this.addCommand({
  id: "your-command-id",
  name: "Do the thing",
  callback: () => this.doTheThing(),
});
```

## Persist settings

```ts
interface MySettings { enabled: boolean }
const DEFAULT_SETTINGS: MySettings = { enabled: true };

async onload() {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  await this.saveData(this.settings);
}
```

## Register listeners safely

```ts
this.registerEvent(this.app.workspace.on("file-open", f => { /* ... */ }));
this.registerDomEvent(window, "resize", () => { /* ... */ });
this.registerInterval(window.setInterval(() => { /* ... */ }, 1000));
```

## Settings Tab Implementation

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts` and `.ref/obsidian-api/obsidian.d.ts` (API is authoritative for SettingGroup - available since 1.11.0)

Basic settings tab:

```ts
import { App, PluginSettingTab, Setting } from "obsidian";

class MySettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Setting name")
      .setDesc("Setting description")
      .addText((text) =>
        text
          .setPlaceholder("Enter value")
          .setValue(this.plugin.settings.mySetting)
          .onChange(async (value) => {
            this.plugin.settings.mySetting = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

// In main plugin class:
this.addSettingTab(new MySettingTab(this.app, this));
```

**Note**: For settings groups (available since API 1.11.0), use `SettingGroup` from the API. Plugin docs may not yet document this feature - always check `.ref/obsidian-api/obsidian.d.ts` for the latest API.

**SettingGroup Methods** (available since 1.11.0):
- `setHeading(heading: string)` - Set the group heading
- `addSetting(cb: (setting: Setting) => void)` - Add a setting to the group
- `addSearch(cb: (component: SearchComponent) => any)` - Add a search input at the beginning of the group (useful for filtering)
- `addExtraButton(cb: (component: ExtraButtonComponent) => any)` - Add an extra button to the group

**Backward Compatibility**: To support users on both Obsidian 1.11.0+ and older versions, use a compatibility utility. See [code-patterns.md](code-patterns.md) for the complete implementation with `createSettingsGroup()` utility. Alternatively, you can force `minAppVersion: "1.11.0"` in `manifest.json` if you don't need to support older versions.

## Secret Storage

**Source**: Based on [SecretStorage and SecretComponent guide](https://docs.obsidian.md/plugins/guides/secret-storage) (available since Obsidian 1.11.4)

**Important**: Always use `SecretStorage` and `SecretComponent` for storing sensitive data like API keys, tokens, or passwords. Never store secrets directly in your plugin's `data.json` file.

### Using SecretComponent in Settings

Store only the secret *name* (ID) in your settings, not the actual secret value:

```ts
import { App, PluginSettingTab, SecretComponent, Setting } from "obsidian";

export interface MyPluginSettings {
  apiKeySecretId: string; // Store the secret name, not the value
}

export class MySettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("API key")
      .setDesc("Select a secret from SecretStorage")
      .addComponent((el) =>
        new SecretComponent(this.app, el)
          .setValue(this.plugin.settings.apiKeySecretId)
          .onChange(async (value) => {
            this.plugin.settings.apiKeySecretId = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
```

**Note**: `SecretComponent` requires the `App` instance in its constructor, so it must be used with `Setting#addComponent()` rather than methods like `addText()`.

### Retrieving Secrets

When you need the actual secret value, retrieve it from `SecretStorage`:

```ts
// Get a secret by its ID (name)
const secret = this.app.secretStorage.getSecret(this.settings.apiKeySecretId);

if (secret) {
  // Use the secret value
  console.log("API key retrieved");
} else {
  // Secret not found - handle gracefully
  console.warn("API key secret not found");
}
```

### Managing Secrets Programmatically

You can also manage secrets programmatically (though typically users manage them through the UI):

```ts
// Set a secret
this.app.secretStorage.setSecret("my-api-key", "actual-secret-value");

// List all secrets
const allSecrets = this.app.secretStorage.listSecrets();
// Returns: ["my-api-key", "another-secret", ...]

// Get a secret
const value = this.app.secretStorage.getSecret("my-api-key");
// Returns: "actual-secret-value" or null if not found
```

**Important**: Secret IDs must be lowercase alphanumeric with optional dashes (e.g., `my-plugin-api-key`). Invalid IDs will throw an error.

See [security-privacy.md](security-privacy.md) for security best practices and [code-patterns.md](code-patterns.md) for comprehensive examples with error handling.

## Modal Patterns

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts` and `.ref/obsidian-plugin-docs/docs/guides/modals.md`

Simple modal:

```ts
import { App, Modal } from "obsidian";

class MyModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.setText("Modal content");
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Open modal:
new MyModal(this.app).open();
```

Modal with user input:

```ts
import { App, Modal, Setting } from "obsidian";

class InputModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h1", { text: "Enter value" });

    new Setting(contentEl)
      .setName("Name")
      .addText((text) =>
        text.onChange((value) => {
          this.result = value;
        })
      );

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result);
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
```

## Custom Views

**Source**: Based on `.ref/obsidian-plugin-docs/docs/guides/custom-views.md`

```ts
import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_MY_VIEW = "my-view";

export class MyView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_MY_VIEW;
  }

  getDisplayText() {
    return "My View";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "My View Content" });
  }

  async onClose() {
    // Clean up resources
  }
}

// In main plugin class:
async onload() {
  this.registerView(VIEW_TYPE_MY_VIEW, (leaf) => new MyView(leaf));
  
  // Activate view:
  await this.activateView();
}

async activateView() {
  const { workspace } = this.app;
  let leaf = workspace.getLeavesOfType(VIEW_TYPE_MY_VIEW)[0];
  
  if (!leaf) {
    leaf = workspace.getRightLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE_MY_VIEW, active: true });
  }
  
  workspace.revealLeaf(leaf);
}

async onunload() {
  this.app.workspace.detachLeavesOfType(VIEW_TYPE_MY_VIEW);
}
```

**Warning**: Never store references to views. Use `getLeavesOfType()` to access view instances.

## Status Bar Items

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts` and `.ref/obsidian-plugin-docs/docs/guides/status-bar.md`

```ts
// Add status bar item (not supported on mobile)
const statusBarItemEl = this.addStatusBarItem();
statusBarItemEl.setText("Status text");

// Or create custom elements:
const statusBarItemEl = this.addStatusBarItem();
statusBarItemEl.createEl("span", { text: "Status: " });
statusBarItemEl.createEl("span", { text: "Active" });
```

## Ribbon Icons

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts` and `.ref/obsidian-plugin-docs/docs/guides/ribbon-actions.md`

```ts
const ribbonIconEl = this.addRibbonIcon("dice", "My Plugin", (evt: MouseEvent) => {
  new Notice("Ribbon clicked!");
});

// Add CSS class for styling:
ribbonIconEl.addClass("my-plugin-ribbon-class");
```

## Editor Commands

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts`

```ts
this.addCommand({
  id: "editor-command",
  name: "Editor command",
  editorCallback: (editor: Editor, view: MarkdownView) => {
    const selection = editor.getSelection();
    editor.replaceSelection("Replaced text");
  },
});
```

## Complex Commands with Conditions

**Source**: Based on `.ref/obsidian-sample-plugin/main.ts`

```ts
this.addCommand({
  id: "conditional-command",
  name: "Conditional command",
  checkCallback: (checking: boolean) => {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (markdownView) {
      if (!checking) {
        // Execute command
        this.doAction();
      }
      return true; // Command is available
    }
    return false; // Command is not available
  },
});
```

The `checkCallback` receives a `checking` boolean:
- When `true`: Only check if command can run (don't execute)
- When `false`: Actually execute the command


---
name: datacore-performance
description: Optimization patterns for high-performance Datacore components, focusing on asset loading, playback smoothness, and efficient DOM updates.
---

# Datacore Performance Patterns

Optimizing for high-fidelity, high-speed UI in the Obsidian/Datacore environment.

## 1. Resource URL Caching
`app.vault.getResourcePath` can be expensive when called 100s of times during a playback loop or gallery render. Use a `Map` to cache these URLs.

```javascript
let resourceMap = new Map(); // path -> resourceUrl

function getUrl(path) {
    if (resourceMap.has(path)) return resourceMap.get(path);
    const file = app.vault.getAbstractFileByPath(path);
    if (!file) return null;
    const url = app.vault.getResourcePath(file);
    resourceMap.set(path, url);
    return url;
}
```

## 2. High-Speed Playback Cycles
When implementing a sequencer or video-like playback:
- **Interval Control**: Use `setInterval` with values derived from FPS (e.g., `1000 / FPS`).
- **Batching**: Avoid deep DOM traversals during the interval. Keep references to interactive elements (e.g., the `activeCard`).
- **Smooth Highlighting**: Instead of re-querying all items to remove an `active` class, store a reference to the `activeCard` and only update the previous and next active items.

```javascript
let activeCard = null;

function showFrame(idx) {
    // ... load image ...
    
    if (activeCard) activeCard.classList.remove('active');
    const newActive = root.querySelector(`[data-idx="${idx}"]`);
    if (newActive) {
        newActive.classList.add('active');
        activeCard = newActive;
    }
}
```

## 3. Image Preloading
For critical sequences, pre-load images by creating hidden `img` elements or fetching them into the browser cache to ensure zero-latency transitions.

## 5. Encoding & Capture Optimization (High-Speed Clips)
When generating video/frames from the DOM:
- **Asynchronous Execution**: Never block the main thread or CLI terminal. Return an immediate receipt and handle the heavy lifting in a background `async` closure.
- **Native Capture**: Use `win.webContents.capturePage()` instead of `html2canvas` for "Impeccable" accuracy and better performance. This bypasses DOM re-rendering and captures directly from the GPU.
- **Scaling**: Use the `nativeImage.resize({ width, height })` method to reduce encoder overhead.
- **Status Bridging**: Communicate through a file-based status bridge (`clip_status.json`). UI should poll every 500ms to update progress bars without impacting capture speed.
- **Dynamic Dependency Loading**: Auto-inject libraries like `HME` or `html2canvas` only when needed to maintain a lightweight core.
# Datacore Resilience: Survival Protocols (Rev v10)

Building in the Datacore environment (Obsidian Renderer) requires specific defensive patterns to overcome aggressive caching and process isolation.

## 🛡️ The Cache-Busting Protocol
Datacore's `dc.require` system is highly efficient but lacks automatic cache invalidation for sub-modules.
-   **Golden Rule**: If you modify a required `.js` or `.jsx` file, you **MUST** rename it (e.g., `Main_v1.jsx` -> `Main_v2.jsx`) and update the `require` call in the entry point.
-   **The Loader Loop**: Always use a versioned entry point (e.g., `index_v10.jsx`) to force the engine to register the new code tree.

## ⚡ Native Electron Bridge
Datacore components have direct access to Node.js APIs via Electron's renderer.
-   **Terminal Execution**: Do not rely on plugin commands for OS-level tasks. Use `require('child_process').spawn` directly.
-   **Fidelity**: This allows for real-time streaming of `stdout` and `stderr` to the UI, providing better telemetry.
-   **Commands**: Use `pgrep`, `lsof`, and `chmod` natively to verify environment health.

## 🧬 Baby Component Pattern
Components must be treated as autonomous "babies" that manage their own lifecycle:
1.  **Self-Bootstrap**: Provide a button to install/start required services natively.
2.  **Telemetry**: Stream host-level bootstrap logs to the UI.
3.  **Validation**: Use file-based triggers (`mcp_state.json`) or DOM audits to prove outcomes to AI agents.
4.  **Human Wait**: Explicitly design for manual setup phases (e.g., "Waiting for User Registration") before proceeding with automated verification.

## 🧱 The Backtick Trap (Markdown Resilience)
- **CRITICAL**: When creating `.md` viewer files or any markdown containing `datacorejsx`, **NEVER** escape the backticks or triple-backticks (e.g., do not use `\`\`\``).
- **The Obsidian Rule**: Escaped backticks are rendered as literal characters by the Obsidian engine, preventing Datacore from recognizing the code block.
- **Verification**: Always `cat` or `view_file` the generated `.md` to ensure backticks are raw: ` ```datacorejsx `.

---
*Stay Impeccable. Stay Resilient.*

## 👁️ Visual Audit Standard
-   **Screenshot Early**: Capture `obsidian dev:screenshot` at EVERY major change.
-   **DOM Proof**: Extract `innerText` or `innerHTML` via CLI to verify state without human eyes.
-   **Outcome**: An "Impeccable" component is one that verifies its own "Impeccable" outcome.
---
name: deployment-hubs
description: Documentation for implementing immersive edge-hover deployment control panels in Datacore-to-Plugin bridge components.
---

# Immersive Deployment Hubs (v1)

Deployment Hubs provide a high-fidelity bridging mechanism for agents and users to build, deploy, and verify Obsidian Plugins directly from a Datacore prototype.

## 1. Trigger Pattern: The Edge-Hover
To maximize immersion, the control panel should remain invisible until triggered by a top-edge hover event.

```javascript
const [isVisible, setIsVisible] = useState(false);

return (
    <div 
        onMouseLeave={() => setIsVisible(false)}
        style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10000,
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isVisible ? 'translateY(0)' : 'translateY(-100%)'
        }}>
        {/* Hover Zone */}
        <div 
            onMouseEnter={() => setIsVisible(true)}
            style={{ height: '30px', width: '100%', position: 'absolute', bottom: '-30px' }} 
        />
        {/* Toolbar Content */}
        <div className="s-toolbar">...</div>
    </div>
);
```

## 2. The Nuclear Reload Command
Always bundle the full lifecycle into a single `child_process` execution to ensure atomic sync:

```javascript
const cmd = `
  obsidian eval code="app.plugins.disablePlugin('id')" && 
  rm -rf [livePath] && mkdir -p [livePath] && 
  npx esbuild ... && 
  cp manifest.json [livePath] && 
  obsidian eval code="app.plugins.enablePlugin('id')" && 
  obsidian plugin:reload id="id"
`;
```

## 3. Manifest Persistence
Deployment hubs **MUST** manually verify that the plugin ID exists in `.obsidian/community-plugins.json`. Without this, the plugin may disappear after an Obsidian relaunch if the CLI fails to save the internal state.

- **Check**: Read the JSON manifest.
- **Inject**: Append the ID if missing.
- **Sync**: Write back before triggering the reload.

---
*Stay Impeccable. Stay Atomic.*
---
name: plugin-migration
description: Strategy and workflow for migrating high-fidelity Datacore components to standalone TypeScript Obsidian Plugins.
---

# Datacore to Plugin Migration Protocol (v1)

This document outlines the standard procedure for maturing a Datacore component into a professional-grade Obsidian Plugin.

## 1. Project Scaffolding
Every migrated plugin must follow the standard TypeScript structure:

```text
metascan-pro/
├── src/
│   ├── main.ts            # Plugin Entry Point
│   ├── view.tsx           # Dashboard View (React/Preact)
│   ├── styles.css         # OKLCH Design Tokens
│   └── components/        # Sub-components
├── manifest.json          # Plugin Metadata
├── esbuild.config.mjs     # Build Pipeline
└── tsconfig.json          # TS Configuration
```

## 2. Component Adaptation
When moving logic from `vINSPECT.jsx` to `view.tsx`:

- **Remove `dc` Globals**: Replace `dc.useState` with `import { useState } from "react"` (or Preact).
- **Obsidian API**: Use `import { ItemView, WorkspaceLeaf } from "obsidian"` instead of relying on `dc.app`.
- **Iconography**: Use `setIcon` for native icons or specialized React wrappers for Lucide.
- **FullTab Factory**: Instead of manual DOM reparenting, register a dedicated `ItemView` and use `app.workspace.getLeaf(true).setViewState(...)`.

## 3. High-Fidelity Design (OKLCH)
Ensure the `styles.css` includes the standardized OKLCH tokens from the **Design Bible**:

```css
:root {
  --metascan-primary: oklch(65.41% 0.176 285.34);
  --metascan-bg: oklch(14.5% 0.012 285.34);
  --metascan-surface: rgba(15, 23, 42, 0.6);
}
```

## 4. Build & Hot-Reload
Use `esbuild` with `watch` mode for rapid development.
- **Output**: Bundles everything into `main.js`.
- **Reloading**: Use `obsidian plugin:reload id="metascan-pro"` for instant feedback.

## 5. Nuclear Sync Protocol (Elite Status)
To ensure zero-cache reloads and persistent enablement during development:

1. **Atomic Lifecycle**: Use a deployment helper in your Datacore prototype that performs the following chain:
   - `obsidian eval code="app.plugins.disablePlugin('id')"` (Clean Unload)
   - `rm -rf [livePath] && mkdir -p [livePath]` (Wipe Instance)
   - `npx esbuild ...` (Fresh Binary)
   - `cp [manifest] [livePath]` (Sync Metadata)
   - `obsidian eval code="app.plugins.enablePlugin('id')"` (Reload)

2. **Persistent Manifest Patching**: `obsidian-cli` may fail to save state to disk if the app is active. Always manually verify/inject the plugin ID into `.obsidian/community-plugins.json` during the build sync to ensure the plugin survives an Obsidian relaunch.

## 6. Deployment
- **Location**: Store the source in `_RESOURCES/PLUGINS/[plugin-id]`.
- **Vault Integration**: Symlink or `cp` the build output to `.obsidian/plugins/[plugin-id]`.

---
*Stay Impeccable. Stay Scalable.*
# Obsidian Dev: Publishing Factory Protocols (v16.0)

Master architecture for zero-config, high-resilience Obsidian plugin distribution.

## 🗝️ Keychain Security (`app.secretStorage`)
Always migrate sensitive credentials (GitHub Tokens) to the native OS Keychain to bypass `localStorage` insecurity.
- **Protocol**: `app.secretStorage.setSecret(key, val)` and `app.secretStorage.getSecret(key)`.
- **Purge**: Explicitly delete legacy `localStorage` keys on first load to ensure no plaintext exposure.

## ⚛️ Nuclear Sync Protocol
Ensures 100% reliable state transitions during the build/deploy cycle.
- **Sequence**: `Disable Plugin -> rm -rf (Clean Live) -> mkdir (Prep) -> esbuild (Compile) -> cp (Manifest) -> Enable Plugin -> Reload Plugin`.
- **Resilience**: Use `(cmd || true)` for non-critical steps (Disable/Reload) to prevent a chain failure from blocking the core build.

## 🚀 Resilient Release Engine
GitHub API patterns for idempotent distribution and BRAT compatibility.
- **Protocol**: 
    1. **Check Tag**: GET `/releases/tags/v1.0.x`.
    2. **Cleanup**: Explicitly `DELETE` existing assets (`main.js`, `manifest.json`, `styles.css`) from the release before uploading.
    3. **Propagation Delay**: Mandatory **1000ms pause** after deletion to allow GitHub indexing to catch up.
    4. **Binary Integrity**: Use `new Uint8Array(fileData).buffer` for `requestUrl` uploads to prevent Node Buffer Pool overruns.
- **Network**: Use Obsidian's native `requestUrl` to bypass CORS and sandbox restrictions.

## 🛡️ Build Integrity Guard
Always verify the existence of the primary binary (`main.js`) before triggering a publication.
- **Rule**: If `!fs.existsSync(mainJsPath)`, block the release and prompt for a manual build.

## 📊 Live Version Telemetry
Integrate a real-time version badge (`v{currentVersion}`) into the deployment UI reading directly from `manifest.json`. This provides absolute build-phase transparency.
---
name: ui-standards
description: Visual and technical standards for Datacore UI components, including bulletproof icon rendering and high-fidelity styling.
---

# Datacore UI Standards (SEQ-5+)

To achieve "Impeccable Status" and ensure cross-version compatibility, follow these standards for all Datacore components.

## 1. Bulletproof Icon Rendering
Directly calling `dc.Icon()` as a function or using it inside raw DOM elements can cause "Missing Hook" errors (`__H` is null) or "dc.h is not a function" errors depending on the environment version.

### Safe Rendering Pattern
Always use a multi-stage helper that handles Preact/React hyperscript variations and provides an Obsidian native fallback.

```javascript
function renderIcon(parent, icon, size = 16, color = 'currentColor') {
    if (!parent) return;
    parent.innerHTML = ''; // Clear previous
    parent.className = (parent.className || '') + ' s-icon-wrap';
    
    try {
        // Stage 1: Datacore Preact Component (Most Performant)
        const h = dc.h || dc.createElement || (dc.preact && dc.preact.h);
        const render = dc.render || (dc.preact && dc.preact.render);
        
        if (h && render && dc.Icon) {
            render(h(dc.Icon, { icon, size, color }), parent);
            return;
        }
    } catch (e) { console.warn('Preact Icon Fail:', e); }

    try {
        // Stage 2: Obsidian Native (Highest Reliability)
        const { setIcon } = require('obsidian');
        if (setIcon) {
            setIcon(parent, icon);
            const svg = parent.querySelector('svg');
            if (svg) {
                svg.style.width = size + 'px';
                svg.style.height = size + 'px';
                svg.style.color = color;
                svg.style.display = 'block';
            }
            return;
        }
    } catch (e) { console.warn('Native setIcon Fail:', e); }

    // Stage 3: Survival Fallback
    parent.innerText = '•';
}
```

## 2. Icon Visual Standards
- **Padding**: Never render icons flush against container edges. Always wrap them in a span/div with `display: inline-flex` and at least `4px` of padding.
- **Alignment**: Ensure icons are vertically centered using `align-items: center`.
- **Scaling**: Use the `size` property rather than scaling via CSS `transform` to maintain stroke-width integrity.

## 3. Glassmorphism Patterns
For a premium "Mirror" aesthetic, use the following Glassmorphism base:

```css
.s-glass-panel {
    background: rgba(15, 23, 42, 0.6); /* Semi-transparent Slate */
    border: 1px solid rgba(99, 102, 241, 0.1); /* Subtle Indigo Border */
    backdrop-filter: blur(16px);
    border-radius: 12px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

## 4. State Feedback
- **Active States**: Use Indigo (`#6366f1`) or Violet (`#a855f7`) for interactive active states.
- **Recording Pulse**: Use a pulsing animation for "In Progress" or "Recording" indicators.

## 5. Immersive Container Standards (FullTab)
To ensure "Impeccable Status" while maintaining vault usability:
- **Default Target**: Always target `.workspace-leaf.mod-active .view-content`.
- **Z-Index**: Use `9998` for the reparented container to stay above Obsidian UI but below system modals/tooltips.
- **Background**: Explicitly set `backgroundColor: "#000"` (or themed neutral) to prevent ghosting during transitions.
- **Constraint**: Never reparent to `document.body` unless the user explicitly requests "Nuclear/Presentation Mode".

## 6. Elite Design Tokens (OKLCH)
For flagship components, use the **Vivid Electropurple** palette for "Impeccable Status":
- **Primary**: `oklch(65.41% 0.176 285.34)` (Electropurple)
- **Background**: `oklch(14.5% 0.012 285.34)` (Tinted Obsidian)
- **Contrast**: Use `oklch(95% 0.005 285.34)` for text to ensure retina-level clarity.

## 7. Data-Density & Zero-Scroll Layouts
Maintain elite information density without layout blowouts:
- **String Handling**: Always apply `word-break: break-all` and `min-width: 0` to containers displaying raw DOM data or long hashes.
- **Micro-Copy**: Provide "Copy Segment" buttons for all high-value data strings.
- **Scroll Hijacking**: Use `overflow: hidden` on the main container and target internal containers for `overflowY: auto`.

---
*Stay Impeccable. Stay Resilient.*

```css
@keyframes s-pulse { 
    0% { transform: scale(1); opacity: 1; } 
    50% { transform: scale(1.3); opacity: 0.5; } 
    100% { transform: scale(1); opacity: 1; } 
}
```
