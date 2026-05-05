# SKILL: Hardened BRAT Deployment Standard

The definitive protocol for deploying stable, production-grade native Obsidian plugins from the DataCore environment.

## 📡 The "Universal Handshake" (BRAT)
For **BRAT** (Beta Reviewer's Auto-update Tool) to install your plugin, the repository root MUST satisfy the "Holy Trinity" of assets:
1.  **`manifest.json`**: Identity, Version, and Compatibility.
2.  **`main.js`**: The **Transpiled & Minified** bundle.
3.  **`styles.css`**: Production styling.

## 🛠️ The "Zero-Click" Build Pipeline
Native plugins should leverage **`esbuild`** during the `handlePublish` phase to ensure source code is correctly transpiled before reaching GitHub.

### standard `esbuild` Configuration
```bash
npx esbuild src/native/main.tsx \
  --bundle \
  --outfile=main.js \
  --minify \
  --platform=node \
  --target=es2020 \
  --format=cjs \
  --external:obsidian \
  --external:electron \
  --external:react \
  --external:react-dom \
  --external:react/jsx-runtime \
  --external:"react-dom/*" \
  --jsx=transform \
  --define:process.env.NODE_ENV="'production'"
```

### Key Build Pillars:
- **Platform Alignment**: Use `--platform=node` to support `fs` and `path` for GitOps automation.
- **Identity Sync**: Mark `react` and `react-dom` as external to share the host's React instance (resolves #525).
- **JSX Hardening**: Use `--jsx=transform` and externalize `react/jsx-runtime` to prevent version leaking.
- **Shell Resilience**: Wrap wildcards like `react-dom/*` in escaped quotes to prevent Zsh/Bash globbing interference.

## 🤖 Auto-Provisioning & GitOps
The deployment engine should be autonomous:
- **Repo Existence**: Catch 404 signals and automatically provision missing repos via GitHub API.
- **Atomic Push**: Force sync to the `main` branch and always push tags (`git push origin --tags`) to trigger the release detection.

## 🔍 Forensic Troubleshooting
If the plugin fails at runtime:
- **SyntaxError**: Usually means raw JSX was accidentally copied instead of the transpiled bundle.
- **ReferenceError**: Check if your shell defined a constant without quotes (e.g., `production` vs `'production'`).
- **Error #525**: A React version leak. Ensure **EVERY** React subpath is marked as external.

---
*Last Update: 2026-04-14*
*Category: Deployment Engineering / GitOps*
