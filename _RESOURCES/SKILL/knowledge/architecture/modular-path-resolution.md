# Modular Path Resolution & Asset Standard (v1.0)

## 1. The Modular Pathing Challenge
When migrating from a monolithic Datacore component (single `.md` file) to an **Elite Modular Structure** (a folder with `src/`, `_resources/`, etc.), hardcoded absolute paths (e.g., `_RESOURCES/DATACORE/...`) break portability and create "Master file not found" errors during environment migrations.

## 2. The Golden Rule: `dc.resolvePath()`
All internal component resources MUST be resolved relative to the component root using `dc.resolvePath()`. 

### Standard Implementation
```javascript
// Inside a root component (e.g., D.q.dashboard888.component.md)
const DOCS_PATH = dc.resolvePath("_resources/content/DOCS.bet8.md");

// Inside a nested module (e.g., src/IntegratedDevelopmentSuite.md)
const DOCS_PATH = dc.resolvePath("../_resources/content/DOCS.bet8.md");
```

> [!IMPORTANT]
> **Path Precedence**: `dc.resolvePath` resolves relative to the *executing file*. 
> - If your script is in `src/`, you must use `../` to access folders in the project root.
> - If your script is in the project root, start the path directly (no leading slash).

## 3. Mandatory Folder Structure
To maintain "Zero-Hardcode" compliance, projects should follow this structure:
- `ProjectFolder/`
    - `PROJECT NAME.md` (Launchpad)
    - `D.q.project.component.md` (Main Logic)
    - `_resources/`
        - `content/` (Documentation, MD indices)
        - `assets/` (Images, SVGs, scripts)
    - `src/` (Modular JS/JSX files)

## 4. Documentation Indexing (The Scanner Pattern)
When building a documentation viewer that scans a "Master Index" (like `DOCS.bet8.md`), always derive the `basePath` from the resolved index file to ensure child links are also resolved relatively.

```javascript
const sourceFilePath = dc.resolvePath("_resources/content/DOCS.bet8.md");
const sourceFile = dc.app.vault.getAbstractFileByPath(sourceFilePath);
const basePath = sourceFile.path.substring(0, sourceFile.path.lastIndexOf('/'));

// Resolving a child module link:
const childPath = `${basePath}/${relativePath}`;
```

## 5. Third-Party Dependency Injection (Babel/Standalone)
Modular components often require external transpilers for live JSX rendering (e.g., `datacorejsx` blocks in docs). Use the `loadScriptFromVault` utility with a reliable fallback.

### Reliable Loading Pattern
```javascript
async function loadScriptFromVault(filePath) {
    const scriptId = `script-${filePath.replace(/[^a-zA-Z0-9]/g, '')}`;
    if (document.getElementById(scriptId) || (filePath.includes('babel') && window.Babel)) return;
    
    // Attempt local vault resolution, then fallback to CDN
    const resourcePath = await getMediaResourcePath(filePath) || filePath;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = resourcePath;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}
```

## 6. Migration Checklist
1. [ ] Move all documentation from global `_RESOURCES/DOCS` to `Project/_resources/content/`.
2. [ ] Replace all string-literal paths with `dc.resolvePath()`.
3. [ ] Verify `handleViewSource` or `openLinkText` calls use the resolved path.
4. [ ] Ensure `src/` modules account for their directory depth when resolving upward.

---
*Beto Group LLC | Institutional Knowledge Standard*
