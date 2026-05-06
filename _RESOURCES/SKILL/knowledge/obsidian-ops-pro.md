# Modular View Factory Standard (v2.0)
Mandatory architecture for high-fidelity Datacore components.

### 1. Directory Structure
- `index.jsx`: Entry point (SafeView / AppWrapper)
- `src/components/`: Modular UI fragments
- `src/hooks/`: logic hooks (useFullTab, useTheme)
- `src/utils/`: core utilities (domUtils)
- `src/styles/`: CSS modules (theme.css.js)
- `_resources/mcp/`: signal registry (commands/state)

### 2. View Initialization
The `index.jsx` MUST export an `async function View()` that handles sequential module loading:
```javascript
async function View({ folderPath }) {
    const SafeView = () => {
        dc.useEffect(() => {
            const load = async () => {
                const domUtils = await dc.require(folderPath + '/src/utils/domUtils.jsx');
                // ... sequential requires ...
            };
            load();
        }, []);
        // ... fallback/render ...
    };
    return <SafeView />;
}
```

### 3. Ghost-Snap Portalling
- **Requirement**: Use the 66.6 version of `useFullTab` and `domUtils`.
- **Logic**: Find the nearest `.workspace-leaf-content` and portal the component into the `.view-content` container.
- **Immersion**: Suppress Obsidian chrome (Status Bar, Headers) globally via `theme.css.js` using `!important` flags.

### 4. Registry Operations
All background signals must pass through `_resources/mcp/mcp_commands.json`. 
- Polling frequency: 1000ms.
- Command state: `executed: false`.
<!--
Source: Project-specific workflow
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Update as build process evolves
-->

# Build Workflow

**CRITICAL**: Always run the build command after making changes to catch errors early.

After making any changes to theme code:

### Simple CSS Themes

If your theme is simple with just `theme.css` in the root and no build tools:

- **No build step required** - just edit `theme.css` directly
- Changes take effect immediately when Obsidian reloads the theme (reload Obsidian with Ctrl+R / Cmd+R)
- **Linting**: Run `npm run lint` to check CSS quality (optional but recommended)

**How to detect**: If you have `theme.css` in root and no `src/scss/` directory, you have a simple CSS theme.

### Complex Themes (SCSS + Build Tools)

If your theme uses build tools (Grunt, npm scripts, SCSS compiler, etc.) and has `src/scss/` directory:

1. **Run the build** (assume npm is already installed):
   ```powershell
   # For themes using Grunt (like obsidian-oxygen)
   npx grunt build
   
   # For themes using npm scripts
   npm run build
   
   # For themes using Grunt watch mode (auto-rebuild on changes)
   npx grunt
   
   # Or whatever build command your theme uses
   ```

2. **If the build fails with npm/node errors**, then check if npm is installed:
   ```powershell
   npm --version
   ```
   - If npm is not found, inform the user that Node.js (which includes npm) needs to be installed
   - Do not automatically install npm - let the user handle installation

3. **Check for errors** and fix any build issues before proceeding. See [troubleshooting.md](SKILLS/obsidian-dev-skills/obsidian-ops/references/troubleshooting.md) for common build issues.

4. **Linting**: Run `npm run lint` to check SCSS/CSS quality. The lint wrapper automatically detects SCSS files in `src/scss/` and lints them appropriately.

**How to detect**: If you have a `src/scss/` directory, you have a complex theme with build tools. Check for `Gruntfile.js`, `package.json` scripts, or other build configuration files.

**Common build tools**:
- **Grunt**: Look for `Gruntfile.js` → Run `npx grunt build` or `npx grunt` (watch mode)
- **npm scripts**: Check `package.json` for `build` script → Run `npm run build`
- **Sass CLI**: Some themes use `sass` directly → Check `package.json` scripts

## Why This Matters

- **Catches errors early**: Build errors are easier to fix immediately after making changes
- **Prevents broken code**: Ensures the project always builds successfully
- **Saves time**: Fixing build errors right away is faster than discovering them later
- **Maintains quality**: Keeps the codebase in a working state

## Automated Workflow

When making changes:
1. Make the code change
2. **Immediately run the build command**
3. If build fails, fix errors
4. Repeat until build succeeds
5. Then proceed with testing or other tasks


# Headless Vault Bridge Protocol

This protocol defines how to interact with an Obsidian Vault as a communication layer in headless or server environments (where the Obsidian GUI is unavailable).

## The "Synthetic CLI" Pattern
When the real `obsidian` binary cannot run (due to lack of X11/Electron support), use a **Synthetic CLI** to maintain command parity.

### Standard Commands
- `obsidian-vps create path="..." content="..."`: Creates a new note with proper directory handling.
- `obsidian-vps append path="..." content="..."`: Appends data to an existing note.
- `obsidian-vps property:set path="..." name="..." value="..."`: Safely parses and updates YAML frontmatter.

### YAML Standards for Automation
To ensure Datacore components can "hear" commands synced from the cloud, use the following `status` states:
- `pending`: Task created on VPS, waiting for Laptop execution.
- `executing`: Laptop has picked up the task.
- `completed`: Execution finished, result written to outbox.
- `failed`: Error encountered during execution.

## Vault-Mediated Communication
Use the filesystem as the "Message Queue" across the **Obsidian Cloud-Mesh**.

1. **Inbox (`bridge/inbox/`)**: Write one `.md` file per command. Use timestamps to avoid collisions.
2. **Outbox (`bridge/outbox/`)**: Single log files or dedicated result notes (e.g., `results.md`) for high-volume status feeds.
3. **Heartbeat (`bridge/heartbeat.md`)**: Periodic updates to indicate node liveness.

## Security Considerations
- **Restricted Write**: The Synthetic CLI should only have write access to the `bridge/` directory by default.
- **Payload Validation**: Always specify `type: cmd` in the frontmatter to prevent accidental execution of non-command notes.

> [!TIP]
> Use `obsidian eval` on the Laptop side to trigger UI-aware actions (screenshots, recordings) that the headless VPS side cannot perform itself.
---
name: obsidian-cli
description: Interact with Obsidian vaults using the Obsidian CLI to read, create, search, and manage notes, tasks, properties, and more. Also supports plugin and theme development with commands to reload plugins, run JavaScript, capture errors, take screenshots, and inspect the DOM. Use when the user asks to interact with their Obsidian vault, manage notes, search vault content, perform vault operations from the command line, or develop and debug Obsidian plugins and themes.
---

# Obsidian CLI

Use the `obsidian` CLI to interact with a running Obsidian instance. Requires Obsidian to be open.

## Command reference

Run `obsidian help` to see all available commands. This is always up to date. Full docs: https://help.obsidian.md/cli

## Syntax

**Parameters** take a value with `=`. Quote values with spaces:

```bash
obsidian create name="My Note" content="Hello world"
```

**Flags** are boolean switches with no value:

```bash
obsidian create name="My Note" silent overwrite
```

For multiline content use `\n` for newline and `\t` for tab.

## File targeting

Many commands accept `file` or `path` to target a file. Without either, the active file is used.

- `file=<name>` — resolves like a wikilink (name only, no path or extension needed)
- `path=<path>` — exact path from vault root, e.g. `folder/note.md`

## Vault targeting

Commands target the most recently focused vault by default. Use `vault=<name>` as the first parameter to target a specific vault:

```bash
obsidian vault="My Vault" search query="test"
```

## Common patterns

```bash
obsidian read file="My Note"
obsidian create name="New Note" content="# Hello" template="Template" silent
obsidian append file="My Note" content="New line"
obsidian search query="search term" limit=10
obsidian daily:read
obsidian daily:append content="- [ ] New task"
obsidian property:set name="status" value="done" file="My Note"
obsidian extract file="D.q.universalstorage.viewer"
obsidian tasks daily todo
obsidian tags sort=count counts
obsidian backlinks file="My Note"
```

Use `--copy` on any command to copy output to clipboard. Use `silent` to prevent files from opening. Use `total` on list commands to get a count.

## Plugin development

### Achieving "Impeccable Status" (Deep Immersion Standard)
The standard `FullTab` (reparenting to `.view-content`) is often insufficient as it remains clipped by Obsidian's workspace containers. The current standard for "Impeccable" immersion is **Brute-Force Reparenting**:

1.  **Target Active Leaf**: Use `app.workspace.activeLeaf.containerEl` as the mount target.
2.  **Raw DOM Preference**: During development, use raw DOM manipulation in a uniquely named `.js` file to bypass the Datacore script cache.
3.  **UI Suppression**:
    ```javascript
    const wrapper = activeLeaf.containerEl;
    wrapper.querySelector('.view-header')?.style.setProperty('display', 'none', 'important');
    wrapper.querySelector('.inline-title')?.style.setProperty('display', 'none', 'important');
    ```
4.  **Verification**: Confirm `#000` (OLED black) contact with physical screen edges using high-res screenshots.

### Image & Frame Protocols
To resolve `ERR_FILE_NOT_FOUND` in Datacore components:
1.  **Normalize Paths**: Use relative paths from vault root (e.g., `_resources/images/...`).
2.  **Resource Path Resolution**: Always use `app.vault.getResourcePath(file)` to generate compatible browser URLs.
3.  **Cache Busting**: During heavy development, rename the core engine script (e.g., `engine_v1.js`, `engine_v2.js`) to force the plugin loader to refresh.

### Shell Script Execution from Datacore (Electron API)
Datacore runs inside Obsidian's renderer process (Electron), which **does have access to Node.js APIs**. Use `require('child_process')` to execute shell scripts directly from a button click — no terminal needed.

**Pattern (fire-and-forget):**
```javascript
// Resolve vault root dynamically — never hardcode absolute paths
const vaultRoot = dc.app.vault.adapter.basePath;
const scriptAbs = vaultRoot + '/_RESOURCES/DATACORE/MyComponent/scripts/record.sh';

const { spawn } = require('child_process');
const proc = spawn('bash', [scriptAbs], {
    cwd: vaultRoot,
    detached: true,
    stdio: 'ignore',
});
proc.unref(); // Fire-and-forget, don't block UI
```

**Rules:**
- Scripts **must live inside the component folder** under `_resources/scripts/` or `scripts/`.
- Never hardcode absolute vault paths — always derive from `adapter.basePath`.
- Use `detached: true` + `proc.unref()` for long-running processes (recording loops, etc).
- Poll `vault.adapter.list()` every 2s to update the UI as files are created.


### Advanced CDP Automation (Reference: 111 & 114)

#### Network Interception & Firewall
Block specific domains or patterns to test offline states or security:
```bash
# Block all telemetry and analytics
obsidian dev:cdp method=Network.setBlockedURLs params='{"urls": ["*google-analytics.com*", "*telemetry.io*"]}'
```

#### High-Fidelity Performance Audits
Extract structured resource data from the internal engine:
```bash
# Get waterfall timings for all vault resources
obsidian eval code="performance.getEntriesByType('resource').map(e => ({ name: e.name, duration: e.duration, ttfb: e.responseStart - e.requestStart }))"
```

#### Automated Interaction Scenarios
Combine clicks and dom checks for regression testing:
```bash
# 1. Trigger engine
obsidian dev:click selector="#start-engine-btn"
# 2. Verify state change
obsidian dev:dom selector="#frame-counter" text
# 3. Capture proof
obsidian dev:screenshot path="_RESOURCES/images/dev/capture_001.png"
```

### Screenshot Sequencing & Video Generation
For high-speed capture and animation generation:

1.  **Continuous Loop Pattern**:
    Use a `while true` loop in the shell script with a file-based stop marker for reliable termination from the UI.
    ```bash
    while true; do
      if [ -f "$STOP_MARKER" ]; then break; fi
      obsidian dev:screenshot path="frame_$(printf %03d $i).png"
      ((i++))
    done
    ```
2.  **Environment Path Injection**:
    When calling external tools like `ffmpeg` or `obsidian` from a child process in Datacore, explicitly inject the necessary paths (e.g., `/opt/homebrew/bin` for Mac Homebrew) into the `PATH` environment variable.
3.  **Post-Processing (FFMPEG)**:
    Stitch captured frames into a `.webm` or `.mp4` automatically at the end of the script.
    ```bash
    ffmpeg -y -framerate 8 -i "frame_%03d.png" -c:v libvpx-vp9 -pix_fmt yuv420p sequence.webm
    ```
4.  **Resource Caching**:
    In the Datacore engine, use a `Map` to cache resource URLs (`app.vault.getResourcePath`) to avoid overhead during high-speed playback or review.

### Native Plugin CLI Bridge (CliLab)
For dynamic, bi-directional command registration without the overhead of shell scripts, use the **CliLab Native Bridge** pattern. This involves a dedicated native Obsidian plugin that manages a `window.CliLab` registry.

**Registration Pattern:**
Components can register JS functions as system-wide CLI commands at runtime:
```javascript
window.CliLab.register('my-cmd', async (payload, app) => {
    // Logic here
    return { status: 'success' };
});
```

**Execution via CLI:**
#### Rapid Flag Syntax (Shortcuts)
To make recording faster and more memorable, the `obsidian` proxy supports native-feeling flags:
```bash
# Record for 5s at 11fps with 0.5x scaling
obsidian dev:videos -d 5 -f 11 -s 0.5
```
**Available Flags:**
- `-d` : Duration in seconds (default: 5)
- `-f` : Frames Per Second (default: 10)
- `-s` : Scale multiplier (default: 1.0)

**Execution via CLI (Legacy/Internal):**
Trigger internal JS logic from any terminal using the `eval` wrapper:
```bash
# Standard command execution
obsidian eval code="window.CliLab.execute('clip', '{\"duration\": 5, \"fps\": 10, \"scale\": 0.5}')"
```

### High-Speed Non-Blocking Recording (Native Optics Bridge)
To avoid terminal freezes and crashes during heavy processing (like video encoding), use the **Native Async Optics Bridge**.

1.  **Non-Blocking Return**: The CLI command triggers the process and immediately returns a "Started" receipt to the terminal.
2.  **Status Bridge**: The background process writes real-time progress (JSON) to a standardized path (e.g., `recordings/clip_status.json`).
3.  **UI Feedback**: Datacore components poll this status file to display progress bars without blocking the main React thread.

**Protocol Implementation:**
- **Backgrounding**: Wrap the recording loop in a `(async () => { ... })();` closure inside the command handler.
- **Native Capture**: Use `win.webContents.capturePage()` for pixel-perfect GPU frames. This solves tab-switch and CSS rendering issues inherent in `html2canvas`.
- **Optics**: Update the status file every 5-10% of completion.
- **Resilience**: Use `window.HME` (H.264 Encoder) with explicit `scale` parameters (e.g., `0.5x`) to reduce CPU overhead on complex DOMs. resolution should be a multiple of 2.

### Advanced Diagnostics
```bash
# Capture React render errors
obsidian dev:errors

# Watch console logs in real-time
obsidian dev:console level=debug | grep "[MyComponent]"

# Inspect DOM for specific elements
obsidian dev:dom selector="#datacore-component-root" text
```

### Additional developer commands

Run JavaScript in the app context:

```bash
obsidian eval code="app.vault.getFiles().length"
```

Inspect CSS values:

```bash
obsidian dev:css selector=".workspace-leaf" prop=background-color
```

Toggle mobile emulation:

```bash
obsidian dev:mobile on
```

### Extracting Component Know-How
Extract structured information from a Datacore component:
```bash
obsidian extract file="D.q.universalstorage.viewer"
```
This generates a summary in `_RESOURCES/DATACORE/EXTRACTS/` including registered CLI commands, key hooks, and dependencies.

Run `obsidian help` to see additional developer commands including CDP and debugger controls.

### Shell Script Execution from Datacore (Electron API)
When using `child_process.spawn` to execute shell scripts that call the `obsidian` CLI:
1. **Absolute Binary Path**: Always resolve and pass the absolute path to the Obsidian binary (e.g., `/Applications/Obsidian.app/Contents/MacOS/obsidian`) via an environment variable like `OBSIDIAN_BIN`. Do not rely on the system `PATH`.
2. **Path Injection**: Inject the binary's parent directory into the `PATH` environment variable when spawning the process.
3. **Datacore Cache Busting**: `dc.require` is aggressively cached. If you modify a required script, you MUST rename the file (e.g., `v1.js` -> `v2.js`) or change the exported function name to force a reload. Simply creating a new viewer `.md` file with the same `dc.require` path will often load stale code.

### CDP Live Test Loop (Mandatory for Components)
Before finishing development on any Datacore component, perform this loop to ensure functional integrity:

1.  **Open Component**:
    ```bash
    obsidian eval code="app.workspace.openLinkText('path/to/viewer.md', '', true)"
    ```
2.  **Verify DOM Layout**: Check for existence of critical elements by ID or unique class.
    ```bash
    obsidian dev:dom selector="#my-target-id" count
    ```
3.  **Trigger Interactions**: Use `eval` to simulate user actions (since `dev:click` is frequently unavailable/unreliable in the renderer context).
    ```bash
    obsidian eval code="document.querySelector('#my-button-id')?.click(); 'Success'"
    ```
4.  **Audit State Change**: Confirm the UI reacted correctly (e.g., class changed to `.recording`, items appeared in a list).
    ```bash
    obsidian dev:dom selector=".s-dot.recording"
    ```
5.  **Evidence Capture**: Take a final screenshot of the component in its 'Active' state.
    ```bash
    obsidian dev:screenshot path="_resources/images/dev/final_verify.png"
    ```

## Advanced Troubleshooting

### SingletonLock Mitigation
When running the raw `@obsidian` binary from the terminal while the app is already open, Electron will fail to create a `SingletonLock` and throw a process error.
- **Solution**: Use the `obsidian_proxy.sh` wrapper.
- **Mechanism**: The proxy intercepts command patterns (e.g., `syncthing:*`) and routes them via `obsidian eval code="window.CliLab.execute(...)"`. This communicates with the running instance instead of spawning a new process.

### Datacore Script Refreshing (Cache Busting)
The `dc.require` system in Datacore is aggressively cached. Modifying a required `.js` or `.jsx` file will not immediately reflect changes in the UI.
- **Protocol**: When updating hook or component logic, rename the source file (e.g., `useSyncthingCLI_v2.js` -> `useSyncthingCLI_v3.js`) and update the corresponding `require` call in the entry point.

### Dynamic Command Registration Pattern
For components that provide CLI extensions, follow the **Unified Command Registry** pattern:
1. Define a `commandList` array containing name/handler objects.
2. Use a `hasRegistered` `useRef` to ensure commands are only registered once per mount.
3. Always register both a standard name (`syncthing:status`) and a `dev:` prefixed version for testing.
4. Set a short `setTimeout` (e.g., 500ms) on mount to ensure the `CliLab` bridge is initialized before registration.
<!--
Source: Based on Obsidian community best practices
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check Obsidian community discussions for updates
-->

# Performance

- Keep CSS file size reasonable. Large themes can slow down Obsidian startup.
- Use CSS variables efficiently. Avoid excessive specificity.
- Minimize use of complex selectors that require expensive DOM queries.
- Test theme performance on lower-end devices, especially mobile.


<!--
Source: Condensed from all reference documentation
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Update as workflows evolve
-->

# Quick Reference

One-page cheat sheet for common Obsidian theme development tasks.

## Quick Commands

**One-word or short commands that trigger automatic actions:**

| Command | Action |
|---------|--------|
| `build` | Run build command (varies by theme: `npx grunt build`, `npm run build`, etc.) |
| `sync` or `quick sync` | Pull latest changes from all 6 core `.ref` repos |
| `what's the latest` or `check updates` | Check what's new in reference repos (read-only, then ask to pull) |
| `release ready?` or `is my theme ready for release?` | Run comprehensive release readiness checklist |
| `summarize` | Generate git commit message from all changed files |
| `summarize for release` | Generate markdown release notes for GitHub |
| `bump the version` or `bump version` | Bump version by 0.0.1 (patch) by default, or specify: `patch`, `minor`, `major`, or exact version |
| `add ref [name]` | Add a reference project (external URL or local path) |
| `check API [feature]` | Look up a feature in `.ref/obsidian-api/obsidian.d.ts` |

**Usage examples:**
- `build` → Runs build command automatically
- `sync` → Pulls latest from all core repos automatically
- `bump the version` → Bumps version by 0.0.1 (patch) in manifest.json
- `bump version minor` → Bumps minor version (e.g., 1.0.0 → 1.1.0)
- `bump version major` → Bumps major version (e.g., 1.0.0 → 2.0.0)
- `add ref my-plugin https://github.com/user/my-plugin.git` → Clones external repo
- `add ref ../my-local-plugin` → Creates symlink to local project
- `check API [feature]` → Searches obsidian.d.ts for feature (for theme CSS variables, etc.)

**Note**: These commands are interpreted by AI agents and execute the corresponding workflows automatically. See detailed documentation in [AGENTS.md](../../AGENTS.md) for full workflows.

## Build Commands

**Simple CSS themes**: No build step required - just edit `theme.css` directly.

**Complex themes with build tools**:
```powershell
npx grunt build  # For themes using Grunt
npm run build    # For themes using npm scripts
npx grunt        # Watch mode (auto-rebuild on changes)
```

**Always run build after making changes** to catch errors early. See [build-workflow.md](build-workflow.md).

## File Paths

**Theme location** (in vault):
```
<Vault>/.obsidian/themes/<theme-name>/
  ├── theme.css        # Compiled theme CSS
  └── manifest.json    # Theme manifest
```

**Build output**: Must be at top level of theme folder in vault.

## CSS Patterns

**CSS Variables** (for theming):
```css
:root {
  --color-base-00: #ffffff;
  --color-base-10: #f7f6f3;
  --color-text-normal: #383a42;
}
```

**Dark Mode**:
```css
.theme-dark {
  --color-base-00: #1e1e1e;
  --color-base-10: #252525;
  --color-text-normal: #dcddde;
}
```

See Obsidian's CSS variables documentation for complete variable list.

## Git Workflow

**Commit message format** (from [summarize-commands.md](summarize-commands.md)):
```
[Summary of changes]
- [detailed item 1]
- [detailed item 2]
```

**Release notes format** (markdown):
```markdown
### Release v1.2.0 - Title

### Features
- Feature description

### Improvements
- Improvement description
```

## Release Preparation

**Before releasing**:
- Run release readiness check: See [release-readiness.md](release-readiness.md)
- Verify all checklist items (platform testing, files, policies, etc.)
- Ensure LICENSE file exists and third-party code is properly attributed

See [versioning-releases.md](versioning-releases.md) for release process.

## Sync Reference Repos

**Quick pull all 6 core repos** (from [quick-sync-guide.md](quick-sync-guide.md)):
```bash
# Navigate to central .ref location (adjust path as needed)
cd ../.ref/obsidian-dev  # or cd ~/Development/.ref/obsidian-dev

# Pull all repos
cd obsidian-api && git pull && cd ..
cd obsidian-sample-plugin && git pull && cd ..
cd obsidian-developer-docs && git pull && cd ..
cd obsidian-plugin-docs && git pull && cd ..
cd obsidian-sample-theme && git pull && cd ..
cd eslint-plugin && git pull && cd ..
```

**Note**: If using symlinks, navigate to the actual target location (usually `..\.ref\obsidian-dev`) before running git commands. See [quick-sync-guide.md](quick-sync-guide.md) for setup detection.

## Reference Materials

**Check `.ref/obsidian-api/obsidian.d.ts`** for CSS variable definitions and Obsidian's internal structure (useful for advanced theming).

## Testing

**Manual installation**:
1. Build theme (if using build tools) or ensure `theme.css` is ready
2. Copy `manifest.json` and `theme.css` to vault `.obsidian/themes/<theme-name>/`
3. Select theme in Obsidian: **Settings → Appearance → Themes**
4. Reload Obsidian (Ctrl+R / Cmd+R) to see changes

See [testing.md](testing.md) for details.

## Common File Structure

**Simple CSS theme**:
```
theme.css          # Source CSS (edit directly)
manifest.json
package.json
```

**Complex theme with build tools**:
```
src/
  scss/
    index.scss
    variables.scss
    components/
theme.css          # Compiled output
manifest.json
package.json
Gruntfile.js       # Build configuration (if using Grunt)
```

See [file-conventions.md](file-conventions.md) for details.

<!--
Source: Project-specific quick reference
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Update as needed
-->

# Quick Sync Guide

This is a quick reference for pulling the latest changes from reference repositories. For detailed sync procedures, see [sync-procedure.md](sync-procedure.md).

## Determine Your Setup First

**IMPORTANT**: Before syncing, check if `.ref` contains symlinks or actual repos. Git operations must be performed on the **actual target location**, not on symlinks.

**Windows (PowerShell)**:
```powershell
Get-Item .ref/obsidian-api | Select-Object LinkType, Target
# If LinkType shows "Junction" or "SymbolicLink", you're using symlinks
# The Target property shows where the symlink points (usually ..\.ref\obsidian-dev)
```

**macOS/Linux**:
```bash
ls -la .ref/obsidian-api
# If it shows "->" with a path, it's a symlink
# Use readlink to see the target: readlink -f .ref/obsidian-api
```

**If using symlinks**: Navigate to the central location (usually `..\.ref\obsidian-dev` or `~/Development/.ref/obsidian-dev`) before running git commands.

**If using local clones**: Run commands from project root, navigating to each `.ref/` subdirectory.

## What Does `git pull` Do?

When you run `git pull` in a reference repository:
1. **Fetches** the latest commits from the remote repository (GitHub)
2. **Merges** those changes into your local copy
3. **Updates** all files in that repository to the latest version

**Important**: This only updates the files in `.ref/` - it does NOT automatically update your `.agents/` files. You need to manually review and sync changes.

## Quick Pull Commands

### If Using Symlinks (Central Location)

```bash
# Navigate to your central refs directory (adjust path as needed)
cd ../.ref/obsidian-dev  # or cd ~/Development/.ref/obsidian-dev

# Pull all repos at once
cd obsidian-api && git pull && cd ..
cd obsidian-sample-plugin && git pull && cd ..
cd obsidian-developer-docs && git pull && cd ..
cd obsidian-plugin-docs && git pull && cd ..
cd obsidian-sample-theme && git pull && cd ..
cd eslint-plugin && git pull && cd ..
```

Or use a simple loop (bash/zsh):
```bash
cd ../.ref/obsidian-dev  # or cd ~/Development/.ref/obsidian-dev
for repo in obsidian-api obsidian-sample-plugin obsidian-developer-docs obsidian-plugin-docs obsidian-sample-theme eslint-plugin; do
    echo "Pulling $repo..."
    cd "$repo" && git pull && cd ..
done
```

Or PowerShell (Windows):
```powershell
cd ..\.ref\obsidian-dev  # Adjust path as needed
foreach ($repo in @('obsidian-api', 'obsidian-sample-plugin', 'obsidian-developer-docs', 'obsidian-plugin-docs', 'obsidian-sample-theme', 'eslint-plugin')) {
    Write-Host "Pulling $repo..."
    cd $repo
    git pull
    cd ..
}
```

### If Using Local Clones (In Project)

```bash
# From your project root
cd .ref

# Pull each repo (always start from project root for each command)
cd obsidian-api && git pull && cd ../..
cd obsidian-sample-plugin && git pull && cd ../..
cd obsidian-developer-docs && git pull && cd ../..
cd obsidian-plugin-docs && git pull && cd ../..
cd obsidian-sample-theme && git pull && cd ../..
cd eslint-plugin && git pull && cd ../..
```

## Check What Changed

After pulling, see what's new:

```bash
# See recent commits in a repo
cd .ref/obsidian-sample-plugin
git log --oneline -10

# See what files changed in the last update
git diff HEAD~1 HEAD --name-only

# See detailed changes to a specific file (e.g., AGENTS.md)
git diff HEAD~1 HEAD -- AGENTS.md

# See changes since your last pull (if you know the commit)
git log --oneline --since="2 weeks ago"
```

## What to Look For

After pulling, check these key files for changes:

- **obsidian-sample-plugin/AGENTS.md** → Compare with your `.agents/` files
- **obsidian-sample-plugin/README.md** → Check for new setup instructions
- **obsidian-api/** → Look for new API documentation or breaking changes
- **obsidian-developer-docs/en/** → Check for updated official documentation
- **obsidian-plugin-docs/** → Review for new plugin guidance

## Next Steps

After pulling and reviewing changes:

1. **Compare** relevant files from `.ref/` with your `.agents/` files
2. **Update** `.agents/` files with new information
3. **Update** the "Last synced" date in file headers
4. **Commit** your changes

See [sync-procedure.md](sync-procedure.md) for the complete workflow.

## Example: Quick Check Workflow

```bash
# 1. Pull all repos (using symlinks - adjust path as needed)
cd ../.ref/obsidian-dev  # or cd ~/Development/.ref/obsidian-dev
for repo in obsidian-api obsidian-sample-plugin obsidian-developer-docs obsidian-plugin-docs obsidian-sample-theme eslint-plugin; do
    cd "$repo" && git pull && cd ..
done

# 2. Check if Sample Plugin's AGENTS.md changed
cd obsidian-sample-plugin
git log --oneline -5 -- AGENTS.md

# 3. If it changed, see the diff
git diff HEAD~1 HEAD -- AGENTS.md

# 4. Now you can manually update your .agents files based on what changed
```

**PowerShell version (Windows)**:
```powershell
# 1. Pull all repos (using symlinks - adjust path as needed)
cd ..\.ref\obsidian-dev
foreach ($repo in @('obsidian-api', 'obsidian-sample-plugin', 'obsidian-developer-docs', 'obsidian-plugin-docs', 'obsidian-sample-theme', 'eslint-plugin')) {
    cd $repo
    git pull
    cd ..
}

# 2-4. Same as above
```


<!--
Source: Based on Obsidian Developer Policies, Theme Guidelines, and official release checklist
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check Obsidian Developer Policies and Theme Guidelines for updates
-->

# Release Readiness Checklist

This document provides a comprehensive checklist to verify your theme is ready for release to the Obsidian community. Use this when preparing a release or when asked "is my theme ready for release?"

**For AI Agents**: When a user asks about release readiness, run through this checklist systematically. Perform automated checks where possible, and ask the user interactively for items that require their input.

## Quick Reference

- **Developer Policies**: [Developer Policies](https://docs.obsidian.md/Developer+policies)
- **Theme Guidelines**: [Theme Guidelines](https://docs.obsidian.md/Themes/Releasing/Theme+guidelines)
- **Release Process**: See [versioning-releases.md](versioning-releases.md)

## Automated Checks (AI Can Verify)

These checks can be performed automatically by reading files and scanning code:

### File Requirements

- [ ] **`theme.css`** exists in project root (or compiled from SCSS/Sass)
  - For themes with build tools: Check that `theme.css` is generated correctly
  - For simple themes: Check that `theme.css` exists and is valid CSS
- [ ] **`manifest.json`** exists in project root with valid JSON structure
- [ ] **`LICENSE`** file exists in project root
- [ ] **`README.md`** exists in project root

### Manifest Validation

- [ ] **Required fields present**: `name`, `version`, `minAppVersion`, `description`, `author`
- [ ] **`name` format**: Should match the theme's display name
- [ ] **`version` format**: Semantic Versioning (x.y.z, e.g., `"1.0.0"`)
- [ ] **`minAppVersion`**: Set appropriately for CSS features used
- [ ] **Optional fields** (if applicable): `authorUrl`, `fundingUrl`
- [ ] **JSON syntax**: Valid JSON (proper quotes, commas, brackets)

### Version Consistency

- [ ] **GitHub release tag**: Matches `manifest.json` version exactly (no "v" prefix)
  - If checking before release: Verify version format is ready
  - If checking after release: Verify tag matches manifest version

### CSS Quality Checks

- [ ] **Valid CSS syntax**: No syntax errors in `theme.css`
- [ ] **No tracking or analytics**: No external tracking scripts, analytics, or telemetry in CSS
- [ ] **No remote resources**: No `@import` statements loading external stylesheets (unless explicitly disclosed)
- [ ] **Browser compatibility**: CSS features used are compatible with Obsidian's browser targets (Chrome and iOS Safari)
- [ ] **No obfuscated code**: CSS is readable and not minified/obfuscated (unless using build tools that minify for production)

### README.md Content

- [ ] **File exists**: `README.md` present in root
- [ ] **Describes purpose**: Clear description of what the theme does and its design philosophy
- [ ] **Usage instructions**: How to install and use the theme
- [ ] **Screenshots**: Visual examples of the theme (recommended)
- [ ] **Attribution**: If using third-party code or design elements, proper attribution included

### LICENSE File

- [ ] **File exists**: `LICENSE` file present in root
- [ ] **License specified**: Clear license type (MIT, GPL, etc.)
- [ ] **Third-party compliance**: If using code or design elements from other themes, verify license compatibility and attribution

## Interactive Checks (AI Asks User)

These checks require user input or confirmation:

### Platform Testing

- [ ] **Windows**: Theme tested and working on Windows
- [ ] **macOS**: Theme tested and working on macOS
- [ ] **Linux**: Theme tested and working on Linux
- [ ] **Android**: Theme tested and working on Android (if applicable)
- [ ] **iOS**: Theme tested and working on iOS (if applicable)

**Note**: If user doesn't have access to all platforms, they should test on available platforms and note limitations.

### Theme-Specific Testing

- [ ] **Dark mode**: Theme includes dark mode styles and they work correctly
- [ ] **Light mode**: Theme includes light mode styles and they work correctly (or theme is dark-only and this is documented)
- [ ] **Mode switching**: Theme correctly switches between dark and light modes
- [ ] **All Obsidian views**: Theme tested in:
  - [ ] Editor (Live Preview, Source Mode, Reading Mode)
  - [ ] File explorer
  - [ ] Settings pages
  - [ ] Command palette
  - [ ] Graph view
  - [ ] Canvas view (if applicable)
  - [ ] Other views used by the theme

### GitHub Release

- [ ] **Release created**: GitHub release exists for the version
- [ ] **Required files attached**: `theme.css` and `manifest.json` attached as **individual binary assets** (not just in source.zip)
- [ ] **Release name matches version**: Release name/tag exactly matches `manifest.json` version (no "v" prefix)

### Community Theme Registration

- [ ] **`manifest.json` name matches `community-css-themes.json`**: The `name` in your `manifest.json` matches the `name` in the `community-css-themes.json` file (for themes already in the community catalog)

### Documentation Quality

- [ ] **README.md describes purpose**: Clear explanation of what the theme does and its design philosophy
- [ ] **README.md provides usage instructions**: Step-by-step guide on how to install and use the theme
- [ ] **Screenshots included**: Visual examples showing the theme in use (highly recommended)

### Developer Policies Adherence

- [ ] **Read Developer Policies**: User confirms they have read [Developer Policies](https://docs.obsidian.md/Developer+policies)
- [ ] **No prohibited features**:
  - [ ] No tracking or analytics
  - [ ] No remote code execution
  - [ ] No self-updating mechanisms
- [ ] **Mandatory disclosures** (if applicable):
  - [ ] Remote resources: Disclosed in README if using `@import` for external stylesheets
  - [ ] Network usage: Disclosed in README and settings (if any)
- [ ] **Licensing**: LICENSE file present and compliant with any third-party code/licenses

### Theme Guidelines Adherence

- [ ] **Read Theme Guidelines**: User confirms they have read [Theme Guidelines](https://docs.obsidian.md/Themes/Releasing/Theme+guidelines)
- [ ] **CSS organization**: CSS is well-organized (logical structure, comments where helpful)
- [ ] **Browser compatibility**: CSS features are compatible with Obsidian's browser targets
- [ ] **Performance**: Theme doesn't cause significant performance issues
- [ ] **Accessibility**: Theme maintains reasonable contrast ratios and readability

### Third-Party Code

- [ ] **License compliance**: All third-party code/licenses are compatible with your theme's license
- [ ] **Attribution**: Proper attribution given in README.md for any code or design elements from other themes/projects
- [ ] **License compatibility**: Your theme's license is compatible with any third-party code used

## Developer Policies Summary

For reference, key points from [Developer Policies](https://docs.obsidian.md/Developer+policies):

### Prohibited

- **Tracking or analytics**: No tracking scripts, analytics, or telemetry
- **Remote code execution**: No fetching and executing remote scripts
- **Self-updating**: No automatic code updates outside normal releases

### Mandatory Disclosures

If your theme requires any of the following, you **must** disclose it clearly:
- Remote resources (external stylesheets via `@import`)
- Network usage (if any)

### Licensing

- Include a LICENSE file
- Respect licenses of any third-party code or design elements used
- Provide proper attribution for third-party code or design elements

## Theme Guidelines Summary

For reference, key points from [Theme Guidelines](https://docs.obsidian.md/Themes/Releasing/Theme+guidelines):

- **CSS organization**: Organize CSS into logical sections
- **Browser compatibility**: Ensure CSS features work in Obsidian's browser targets (Chrome and iOS Safari)
- **Performance**: Avoid CSS that causes performance issues
- **Testing**: Test on all applicable platforms and in all Obsidian views
- **Documentation**: Include clear README with screenshots

## AI Agent Workflow

When user asks "is my theme ready for release?" or similar:

1. **Run automated checks**:
   - Check file existence (`theme.css`, `manifest.json`, `LICENSE`, `README.md`)
   - Validate `manifest.json` structure and required fields
   - Check version format and consistency
   - Scan CSS for prohibited patterns (tracking, remote imports, etc.)
   - Verify README.md has basic content

2. **Present interactive checklist**:
   - Ask about platform testing (Windows, macOS, Linux, Android, iOS)
   - Ask about theme-specific testing (dark/light mode, all Obsidian views)
   - Ask about GitHub release status and file attachments
   - Ask about community-css-themes.json name matching (if applicable)
   - Ask about README.md quality (purpose, usage instructions, screenshots)
   - Ask about Developer Policies adherence
   - Ask about Theme Guidelines adherence
   - Ask about third-party code license compliance and attribution

3. **Report results**:
   - Show pass/fail/warning status for each item
   - Provide actionable guidance for any failures
   - Summarize overall readiness status

4. **Provide next steps**:
   - If ready: Guide user through release process (see [versioning-releases.md](versioning-releases.md))
   - If not ready: List specific items to address before release

## Related Documentation

- [versioning-releases.md](versioning-releases.md) - Release process and versioning
- [security-privacy.md](security-privacy.md) - Security and privacy guidelines
- [manifest.md](manifest.md) - Manifest requirements and validation
- [testing.md](testing.md) - Testing procedures and platform testing
- [ux-copy.md](ux-copy.md) - UI text conventions (for theme names and descriptions)
- [build-workflow.md](build-workflow.md) - Build commands (if using build tools)
- [performance.md](performance.md) - Performance optimization best practices

<!--
Source: Based on Obsidian Developer Policies and Guidelines
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check Obsidian Developer Policies for updates
-->

# Security, privacy, and compliance

Follow Obsidian's **Developer Policies** (https://docs.obsidian.md/Developer+policies) and **Theme Guidelines** (https://docs.obsidian.md/Themes/Releasing/Theme+guidelines). See [release-readiness.md](release-readiness.md) for a comprehensive release checklist.

## Developer Policies Requirements

### Prohibited Practices

- **Code obfuscation**: CSS must be readable and not minified/obfuscated
- **Dynamic ads**: No dynamic advertising
- **Client-side telemetry**: No hidden telemetry. If you collect optional analytics, require explicit opt-in and document clearly in `README.md`
- **Self-updating mechanisms**: No automatic code updates outside of normal releases. Never execute remote code, fetch and eval scripts, or auto-update code

### Mandatory Disclosures

If your theme requires any of the following, you **must** disclose it clearly in `README.md`:

- **Payments or subscriptions**: Clearly state if the theme requires payment
- **User accounts**: Disclose if user accounts are required
- **Network usage**: Disclose any API calls, external services, or network requests
- **Files outside vault**: Disclose if the theme accesses files outside the Obsidian vault (rare for themes, but applicable if using any external resources)

### Privacy and Security

- Default to local/offline operation. Only make network requests when essential to the feature.
- Minimize scope: read/write only what's necessary inside the vault. Do not access files outside the vault.
- Clearly disclose any external services used, data sent, and risks.
- Respect user privacy. Do not collect vault contents, filenames, or personal information unless absolutely necessary and explicitly consented.
- Avoid deceptive patterns, ads, or spammy notifications.

### Licensing

- Include a LICENSE file in your project root
- Respect licenses of any third-party code used
- Provide proper attribution for third-party code in `README.md`
- Ensure license compatibility between your theme's license and any third-party code licenses

## Theme Guidelines

- **CSS organization**: Organize CSS/SCSS into logical files/folders
- **CSS variables**: Use consistent naming conventions for CSS variables
- **Security**: Themes are CSS-only and have minimal security surface area

## Implementation

Themes are CSS-only and have minimal security surface area, but still follow privacy guidelines for any optional features.

## Related Documentation

- [release-readiness.md](release-readiness.md) - Comprehensive release checklist including policy adherence
- [manifest.md](manifest.md) - Manifest requirements (includes security-related fields)
- [Developer Policies](https://docs.obsidian.md/Developer+policies) - Official Obsidian Developer Policies
- [Theme Guidelines](https://docs.obsidian.md/Themes/Releasing/Theme+guidelines) - Official Theme Guidelines


<!--
Source: Project-specific workflow
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Update as workflow evolves
-->

# Summarize Commands

When the user requests "Summarize" or "Summarize for release", use these workflows to generate commit messages or release notes.

## "Summarize" Command

**Purpose**: Generate a succinct git commit message based on all changed files.

**Workflow**:

1. **Get all changed files**:
   ```bash
   git status
   git diff --cached  # For staged changes
   git diff           # For unstaged changes
   ```

2. **Read and analyze all changed files**:
   - Look at the actual file contents, not just the chat history
   - Understand what changed across all files
   - Get the overall picture of the changes

3. **Generate commit message** in this format:
   ```
   [Summary of changes]
   - [more detailed item 1]
   - [more detailed item 2]
   - [more detailed item 3]
   ```

4. **Present as a code block** so the user can easily copy it:
   ````
   ```
   [Summary of changes]
   - [more detailed item 1]
   - [more detailed item 2]
   ```
   ````

**Important**:
- Look at actual file changes, not just chat context
- Be succinct but descriptive
- Focus on what changed, not how it was changed
- Use present tense (e.g., "Add feature" not "Added feature")
- Group related changes together

**Example**:
```
Reorganize agent instructions into structured directory
- Split AGENTS.md into topic-based files in .agents/
- Add build workflow documentation
- Update ref-instructions with symlink strategy
- Add summarize command workflows
```

## "Summarize for Release" Command

**Purpose**: Generate markdown-formatted release notes for a GitHub release.

**Workflow**:

1. **Check the version**:
   ```bash
   # Check manifest.json for version
   # Or check package.json
   # Or ask the user if version is unclear
   ```

2. **Get all changes since last release**:
   ```bash
   git log --oneline  # See recent commits
   git diff <last-release-tag>..HEAD  # See all changes
   ```

3. **Read and analyze all changed files**:
   - Look at actual file contents and changes
   - Understand the full scope of changes
   - Categorize changes by type (Features, Fixes, Improvements, etc.)

4. **Generate release notes** in markdown format:
   ```markdown
   ### Features
   - [Feature description 1]
   - [Feature description 2]

   ### Fixes
   - [Fix description 1]
   - [Fix description 2]

   ### Improvements
   - [Improvement description 1]
   ```

5. **Present as a code block** with the version clearly indicated:
   ````
   ```markdown
   ## Version X.Y.Z

   ### Features
   - [Feature description 1]
   - [Feature description 2]

   ### Fixes
   - [Fix description 1]

   ### Improvements
   - [Improvement description 1]
   ```
   ````

**Important**:
- Start with `###` headings (third-level markdown)
- Use bullet points under each heading
- Be succinct and punchy
- Focus on user-facing changes
- Group logically (Features, Fixes, Breaking Changes, Improvements, etc.)
- Include version number at the top
- Look at actual changes, not just chat history

**Example**:
```markdown
## Version 1.2.0

### Features
- Add structured .agents directory for better organization
- Implement symlink strategy for reference repositories
- Add build workflow automation

### Improvements
- Reorganize documentation into topic-based files
- Update ref-instructions with Windows symlink guide
- Add summarize command workflows

### Fixes
- Fix build command execution order
- Update documentation paths
```

## Tips for Better Summaries

- **Read the files**: Don't rely solely on chat history - actually read the changed files
- **Understand context**: Look at related files to understand the full picture
- **Be specific**: "Add build workflow" is better than "Update docs"
- **Group logically**: Related changes should be grouped together
- **User perspective**: Focus on what users/developers will notice
- **Version awareness**: For releases, always check and include the version number

<!--
Source: Project-specific procedure
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Update as sync process evolves
Applicability: Both
-->

# Sync Procedure: Keeping .agents Up to Date

**Sync Tracking**: All sync dates are tracked centrally in [sync-status.json](sync-status.json). Always update this file with the actual current date when syncing (use `Get-Date -Format "yyyy-MM-dd"` to get the date - never use placeholder dates).

This document outlines the standard procedure for keeping the `.agents` directory content synchronized with the latest updates from the 6 core Obsidian repositories:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api) - Official API documentation and type definitions
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin) - Template plugin with best practices
- [Obsidian Developer Docs](https://github.com/obsidianmd/obsidian-developer-docs) - Source vault for docs.obsidian.md
- [Obsidian Plugin Docs](https://github.com/obsidianmd/obsidian-plugin-docs) - Plugin-specific documentation
- [Obsidian Sample Theme](https://github.com/obsidianmd/obsidian-sample-theme) - Theme template (for reference patterns)
- [ESLint Plugin](https://github.com/obsidianmd/eslint-plugin) - ESLint rules for Obsidian plugins

## Prerequisites

1. **Set up reference repositories** (see [ref-instructions.md](ref-instructions.md)):
   - The 6 core Obsidian projects should be available in `.ref/` (either as symlinks to a central location or as local clones):
     - `obsidian-api/` - API documentation
     - `obsidian-sample-plugin/` - Sample plugin template
     - `obsidian-developer-docs/` - Developer documentation
     - `obsidian-plugin-docs/` - Plugin-specific docs
     - `obsidian-sample-theme/` - Theme template
     - `eslint-plugin/` - ESLint rules
   - **Important**: If using symlinks (recommended), they typically point to a central location like `..\.ref\obsidian-dev` (one level up from project root) or `~/Development/.ref/obsidian-dev`

## Sync Workflow

**Before starting**: Get the current date for tracking (always use actual date, never placeholder):
```powershell
$syncDate = Get-Date -Format "yyyy-MM-dd"
Write-Host "Sync date: $syncDate"
```

### Step 1: Determine Your .ref Setup

**CRITICAL**: Before updating repos, you need to determine whether `.ref` contains symlinks or actual repos. Git operations must be performed on the **actual target location**, not on symlinks.

#### Check if .ref Contains Symlinks

**Windows (PowerShell)**:
```powershell
# Check if a specific repo is a symlink
$item = Get-Item .ref/obsidian-api
if ($item.LinkType -eq "Junction" -or $item.LinkType -eq "SymbolicLink") {
    Write-Host "Symlink detected - target: $($item.Target)"
    # Navigate to the actual target location
    cd $item.Target
} else {
    Write-Host "Regular directory - can use .ref/obsidian-api directly"
    cd .ref/obsidian-api
}
```

**macOS/Linux**:
```bash
# Check if a specific repo is a symlink
if [ -L .ref/obsidian-api ]; then
    # Portable approach for macOS/BSD and Linux
    if command -v realpath >/dev/null 2>&1; then
        TARGET=$(realpath .ref/obsidian-api)
    else
        TARGET=$(readlink .ref/obsidian-api)
    fi
    echo "Symlink detected - target: $TARGET"
    # Navigate to the actual target location
    cd "$TARGET"
else
    echo "Regular directory - can use .ref/obsidian-api directly"
    cd .ref/obsidian-api
fi
```

**Quick Check**: If `.ref` contains symlinks, they typically point to `..\.ref\obsidian-dev` (one level up from project root) or a central location like `~/Development/.ref/obsidian-dev` or `C:\Users\YourName\Development\.ref\obsidian-dev`.

### Step 2: Update Reference Repositories

Once you know your setup, update the repos:

#### Option A: If Using Symlinks to Central Location

**Windows (PowerShell)**:
```powershell
# First, check where symlinks point (usually ..\.ref\obsidian-dev)
$target = (Get-Item .ref/obsidian-api).Target
Write-Host "Symlinks point to: $target"

# Navigate to central location and update all repos
cd ..\.ref\obsidian-dev  # Adjust path if your central .ref is elsewhere
cd obsidian-api; git pull; cd ..
cd obsidian-sample-plugin; git pull; cd ..
cd obsidian-developer-docs; git pull; cd ..
cd obsidian-plugin-docs; git pull; cd ..
cd obsidian-sample-theme; git pull; cd ..
cd eslint-plugin; git pull; cd ..
```

**macOS/Linux**:
```bash
# First, check where symlinks point (usually ../.ref/obsidian-dev)
if command -v realpath >/dev/null 2>&1; then
    TARGET_REPO=$(realpath .ref/obsidian-api)
else
    TARGET_REPO=$(readlink .ref/obsidian-api)
fi
TARGET=$(echo "$TARGET_REPO" | sed 's|/obsidian-api$||')
echo "Symlinks point to: $TARGET"

# Navigate to central location and update all repos
cd "$TARGET"  # or cd ../.ref/obsidian-dev if that's your central location
cd obsidian-api && git pull && cd ..
cd obsidian-sample-plugin && git pull && cd ..
cd obsidian-developer-docs && git pull && cd ..
cd obsidian-plugin-docs && git pull && cd ..
cd obsidian-sample-theme && git pull && cd ..
cd eslint-plugin && git pull && cd ..
```

#### Option B: If Using Local Clones (No Symlinks)

If `.ref` contains actual repos (not symlinks), update from project root:

**Windows (PowerShell)**:
```powershell
# Always start from project root for each command
cd C:\path\to\your\obsidian-project
cd .ref/obsidian-api; git pull
cd C:\path\to\your\obsidian-project
cd .ref/obsidian-sample-plugin; git pull
cd C:\path\to\your\obsidian-project
cd .ref/obsidian-developer-docs; git pull
cd C:\path\to\your\obsidian-project
cd .ref/obsidian-plugin-docs; git pull
cd C:\path\to\your\obsidian-project
cd .ref/obsidian-sample-theme; git pull
cd C:\path\to\your\obsidian-project
cd .ref/eslint-plugin; git pull
```

**macOS/Linux**:
```bash
# Always start from project root for each command
cd .ref/obsidian-api && git pull && cd ../..
cd .ref/obsidian-sample-plugin && git pull && cd ../..
cd .ref/obsidian-developer-docs && git pull && cd ../..
cd .ref/obsidian-plugin-docs && git pull && cd ../..
cd .ref/obsidian-sample-theme && git pull && cd ../..
cd .ref/eslint-plugin && git pull && cd ../..
```

**Important**: When using local clones, always navigate back to project root between commands to avoid path accumulation errors.

### Step 3: Review Changes

Check what's changed in the reference repos. **Remember**: If using symlinks, navigate to the actual target location (usually `..\.ref\obsidian-dev`), not the symlink.

**Windows (PowerShell)** - If using symlinks:
```powershell
# Navigate to central location first
cd ..\.ref\obsidian-dev  # Adjust if your central .ref is elsewhere

# Check recent commits in obsidian-api
cd obsidian-api
git log --oneline -10
cd ..

# Check recent commits in obsidian-sample-plugin
cd obsidian-sample-plugin
git log --oneline -10
git diff HEAD~1 HEAD -- AGENTS.md  # Check if AGENTS.md changed
cd ..

# Check developer docs changes
cd obsidian-developer-docs
git log --oneline -10
cd ..

# Check plugin docs changes
cd obsidian-plugin-docs
git log --oneline -10
cd ..
```

**Windows (PowerShell)** - If using local clones:
```powershell
# Always start from project root for each command
cd C:\path\to\your\obsidian-project
cd .ref\obsidian-api
git log --oneline -10
cd C:\path\to\your\obsidian-project
cd .ref\obsidian-sample-plugin
git log --oneline -10
git diff HEAD~1 HEAD -- AGENTS.md
```

**macOS/Linux** - If using symlinks:
```bash
# Navigate to central location first
cd ../.ref/obsidian-dev  # or cd ~/Development/.ref/obsidian-dev

# Check recent commits
cd obsidian-api && git log --oneline -10 && cd ..
cd obsidian-sample-plugin && git log --oneline -10 && git diff HEAD~1 HEAD -- AGENTS.md && cd ..
cd obsidian-developer-docs && git log --oneline -10 && cd ..
cd obsidian-plugin-docs && git log --oneline -10 && cd ..
```

### Step 4: Identify Files to Update

Based on the changes, identify which `.agents` files need updates:

- **Sample Plugin changes** → Check these files:
  - `environment.md` - Build tooling, npm scripts
  - `file-conventions.md` - File structure recommendations
  - `common-tasks.md` - Code examples
  - `testing.md` - Installation procedures
  - `versioning-releases.md` - Release workflow
  - `coding-conventions.md` - TypeScript patterns

- **API changes** → Check these files:
  - `project-overview.md` - API usage patterns
  - `commands-settings.md` - Command API changes
  - `common-tasks.md` - API usage examples
  - `references.md` - API documentation links

- **Developer Docs changes** → Check:
  - `security-privacy.md` - Policy updates
  - `manifest.md` - Manifest requirements
  - `ux-copy.md` - Style guide updates
  - `commands-settings.md` - Command documentation
  - `testing.md` - Testing procedures
  - `versioning-releases.md` - Release guidelines
  - Review `en/` directory for new or updated documentation

- **Plugin Docs changes** → Check:
  - `project-overview.md` - Plugin architecture
  - `common-tasks.md` - Plugin-specific patterns
  - `troubleshooting.md` - Common plugin issues
  - Any plugin-specific best practices

- **Sample Theme changes** (optional reference):
  - `file-conventions.md` - File organization patterns
  - `versioning-releases.md` - Release workflow similarities

### Step 5: Update .agents Files

For each file that needs updating:

1. **Read the source material**:
   - Compare `.ref/obsidian-sample-plugin/AGENTS.md` with current `.agents` files
   - Review `.ref/obsidian-api/` for API documentation changes
   - Review `.ref/obsidian-developer-docs/en/` for official documentation updates
   - Check `.ref/obsidian-plugin-docs/` for plugin-specific guidance
   - Optionally reference `.ref/obsidian-sample-theme/` for organizational patterns

2. **Update the content**:
   - Copy relevant sections from source
   - Adapt to match the topic-based structure
   - Preserve any project-specific additions

3. **Update the sync status**:
   
   **Easy way** (recommended): Use the helper script:
   ```bash
   node scripts/update-sync-status.mjs "Description of what was synced"
   ```
   
   **Manual way**: Edit `.agent/sync-status.json` directly:
   ```powershell
   # Get the current date
   $syncDate = Get-Date -Format "yyyy-MM-dd"

   # Update the central sync-status.json file
   # Edit .agent/sync-status.json and update:
   # - "lastFullSync" to the current date
   # - "lastSyncSource" to describe what was synced
   # - Update relevant source repo dates in "sourceRepos"
   ```
   
   **Important**: Always use the actual current date from `Get-Date -Format "yyyy-MM-dd"`, never use placeholder dates.

4. **Note**: Individual file headers still have "Last synced" dates, but the authoritative source is `.agent/sync-status.json`. When syncing, update the central file rather than individual file headers.

### Step 6: Verify and Test

- Review updated files for accuracy
- Ensure links still work
- Check that code examples are still valid
- Verify formatting is consistent

## Quick Sync Checklist

- [ ] **Determine setup**: Check if `.ref` contains symlinks or actual repos
- [ ] **If symlinks**: Identify central location (usually `..\.ref\obsidian-dev` or `~/Development/.ref/obsidian-dev`)
- [ ] **If local clones**: Note that you must navigate from project root for each command
- [ ] Pull latest from `obsidian-api` repo (from actual target location, not symlink)
- [ ] Pull latest from `obsidian-sample-plugin` repo
- [ ] Pull latest from `obsidian-developer-docs` repo
- [ ] Pull latest from `obsidian-plugin-docs` repo
- [ ] Pull latest from `obsidian-sample-theme` repo
- [ ] Pull latest from `eslint-plugin` repo
- [ ] Review `AGENTS.md` in sample plugin for changes
- [ ] Review API documentation for breaking changes
- [ ] Review developer docs for policy/guideline updates
- [ ] Review plugin docs for best practices
- [ ] Update relevant `.agent/skills/**/*.md` files
- [ ] **Update `.agent/sync-status.json` with actual current date** (use `Get-Date -Format "yyyy-MM-dd"` - never use placeholder dates)
- [ ] Review and commit changes

## Troubleshooting

### "Cannot find path" errors when running git commands

**Problem**: You're trying to run git commands on a symlink, or paths are accumulating incorrectly.

**Solution**:
1. Check if `.ref` contains symlinks: `Get-Item .ref/obsidian-api | Select-Object LinkType, Target` (Windows) or `ls -la .ref/obsidian-api` (Unix)
2. If symlinks, navigate to the **actual target location** (usually `..\.ref\obsidian-dev`) before running git commands
3. If local clones, always start from project root for each command

### "Already up to date" but you want to verify

**Solution**: Use `git fetch` first to check for updates without merging:
```bash
git fetch
git log HEAD..origin/main --oneline  # Shows what's new
```

### Verify Your Setup (Symlinks vs. Local Clones)

**Windows**:
```powershell
Get-Item .ref/obsidian-api | Select-Object LinkType, Target
# If LinkType shows "Junction" or "SymbolicLink", you're using symlinks
# If LinkType is empty/null, it's a regular directory
```

**macOS/Linux**:
```bash
ls -la .ref/obsidian-api
# If it shows "->" with a path, it's a symlink
# If it shows "d" (directory) without "->", it's a regular directory
```

## Frequency Recommendations

- **Monthly**: Review for major updates
- **After Obsidian releases**: Check for API changes
- **When starting new features**: Verify current best practices
- **Before releases**: Ensure guidelines are current

## Automation Ideas (Future)

Consider creating a script to:
- Automatically check for updates in reference repos
- Compare `AGENTS.md` from sample plugin with current `.agents` structure
- Generate a diff report of what changed
- Remind to update "Last synced" dates

## Updating Sync Status

After completing a sync, update `.agent/sync-status.json`:

**Easy way** (recommended): Use the helper script:
```bash
node scripts/update-sync-status.mjs "Description of what was synced"
```

**Manual way**: Edit the file directly:
```powershell
# Get actual current date (CRITICAL: never use placeholder!)
$syncDate = Get-Date -Format "yyyy-MM-dd"

# Update sync-status.json with:
# - "lastFullSync": "$syncDate"
# - "lastSyncSource": "Description of what was synced"
# - Update relevant dates in "sourceRepos" section for repos that were checked/synced
```

**Critical**: Always use the actual date from `Get-Date -Format "yyyy-MM-dd"`. Never use placeholder dates like "YYYY-MM-DD" or hardcoded dates. The sync-status.json file is the authoritative source for all sync dates.

## Notes

- Not all changes need to be synced immediately - focus on breaking changes and new best practices
- Some content may be project-specific and shouldn't be overwritten
- Always review changes before committing to ensure they make sense for your project
- **Always update sync-status.json with the actual current date** - this is the authoritative source for sync dates
<!--
Source: Based on Obsidian Sample Theme
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check Obsidian Sample Theme repo for updates
-->

# Testing

- Manual install for testing: copy `manifest.json` and `theme.css` to:
  ```
  <Vault>/.obsidian/themes/<theme-name>/
  ```
- Reload Obsidian and select the theme in **Settings → Appearance → Themes**.

**Platform testing**: Before release, test on all applicable platforms (Windows, macOS, Linux, Android, iOS). See [release-readiness.md](release-readiness.md) for the complete testing checklist.


<!--
Source: Based on Obsidian community troubleshooting
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Update as common issues are identified
-->

# Troubleshooting

**Source**: Based on common errors from developer docs, community patterns, and best practices.

- **Theme doesn't appear**: Ensure `manifest.json` and `theme.css` are at the top level of the theme folder under `<Vault>/.obsidian/themes/<theme-name>/`.
- **Theme not applying**: Check that `manifest.json` has correct `name` field matching the folder name.
- **CSS not loading**: Verify `theme.css` exists and is properly formatted.
- **SCSS compilation issues**: If using SCSS, ensure build process runs and outputs `theme.css`.
- **Mobile display issues**: Test CSS on mobile devices and check for viewport-specific styles.

## AI Agent Issues

### .ref Folder Not Found

**Problem**: AI agent can't find `.ref` folder when searching.

**Solution**:
- The `.ref` folder is gitignored and may be hidden
- Use `list_dir` with the project root to see hidden directories
- Use `glob_file_search` with pattern `.ref/**` to search recursively
- Try direct paths like `.ref/obsidian-api/README.md`
- See [sync-procedure.md](sync-procedure.md) for detailed search strategies

**For AI agents**: When user asks about `.ref`, actively search using multiple methods. Don't assume it doesn't exist if first search fails.

## Common Error Messages

### CSS Errors

- **"Invalid property value"**: Check CSS syntax, ensure all values are properly formatted.
- **"Unknown property"**: Verify CSS property names are correct and supported by Obsidian's rendering engine.
- **"Selector not working"**: Check CSS selector specificity and ensure you're targeting the correct Obsidian elements.

### SCSS Compilation Errors

- **"File to import not found"**: Check `@import` paths are correct relative to SCSS files.
- **"Undefined variable"**: Ensure all SCSS variables are defined before use.
- **"Syntax error"**: Verify SCSS syntax is correct (semicolons, brackets, etc.).

### Build Errors

- **"Command not found"**: Ensure build tools (Grunt, npm, sass) are installed.
- **"Build failed"**: Check build configuration files (`Gruntfile.js`, `package.json` scripts).
- **"Output file missing"**: Verify build process completed and `theme.css` was generated.

## Debugging Techniques

### Browser Console

Open browser console (Help → Toggle Developer Tools) to check for:
- CSS parsing errors
- Missing CSS variables
- Conflicting styles

### Inspect Theme CSS

In browser console, inspect the theme's CSS:
```javascript
// Check if theme CSS is loaded
document.querySelector('style[data-theme="your-theme-name"]')
```

### Verify CSS Variables

Check that Obsidian CSS variables are being used correctly:
```css
/* Use Obsidian's built-in variables */
color: var(--text-normal);
background: var(--background-primary);
```

### Check Manifest

Verify `manifest.json` has correct `name` field matching the theme folder name.

## SCSS Build Issues (Detailed)

### SCSS Not Compiling

**Causes**:
1. Build command not run
2. Build tool not installed
3. Incorrect build configuration

**Solution**: 
1. Run build command (`npx grunt build` or `npm run build`)
2. Verify `Gruntfile.js` or `package.json` scripts are correct
3. Check that `theme.css` is generated in root directory

### SCSS Import Errors

**Problem**: `@import` statements fail.

**Solution**: 
1. Check file paths are correct relative to importing file
2. Verify all imported files exist
3. Use relative paths: `@import "../variables.scss";`

### CSS Output Issues

**Problem**: Compiled CSS doesn't match expected output.

**Solution**:
1. Check SCSS source files for syntax errors
2. Verify build process completes without errors
3. Inspect generated `theme.css` for issues


<!--
Source: Based on Obsidian Sample Theme
Last synced: See sync-status.json for authoritative sync dates
Update frequency: Check Obsidian Sample Theme repo for updates
-->

# Versioning & releases

**Before releasing**: Use the comprehensive [release-readiness.md](release-readiness.md) checklist to verify your project is ready for release.

- Bump `version` in `manifest.json` (SemVer).
- Create a GitHub release whose tag exactly matches `manifest.json`'s `version`. Do not use a leading `v`.
### Theme Releases
- Attach `manifest.json` and `theme.css` to the release as individual assets.
- After the initial release, follow the process to add/update your theme in the community catalog as required.

### Plugin Releases
- Attach `main.js`, `manifest.json`, and `styles.css` to the release as individual assets.
- Follow the plugin submission process to add/update your plugin in the community catalog.

> [!NOTE]
> Themes and plugins have different asset requirements and submission paths. Ensure you follow the correct flow for your project type.


