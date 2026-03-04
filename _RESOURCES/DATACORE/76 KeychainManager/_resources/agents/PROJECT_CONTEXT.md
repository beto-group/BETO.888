# Project Context: 82 KeychainManager

## Overview
A Datacore component designed to explore and interface with the Obsidian 1.11 `SecretStorage` (Keychain) API. It provides a UI for managing, sealing, and opening secrets.

## Core Features
- **Secret Management**: Add, View (Reveal), and Delete secrets.
- **Native Integration**: Direct interface with `dc.app.secretStorage.secrets` (Listing) and `shard.Crypto` (Operations).
- **Security First**: Uses Obsidian's native `SecretStorage` for persistence; no local sidecar files used.

## Architecture
- **Entry Point**: `D.q.keychainmanager.viewer.md`
- **Loader**: `src/index.jsx`
- **Main Component**: `src/components/KeychainManager.jsx`
- **Styles**: `src/styles/styles.jsx` (High-contrast, dark theme).

## API Usage (Obsidian v1.11.4+)
- `dc.app.secretStorage.listSecrets()` (Async list of keys)
- `dc.app.secretStorage.getSecret(id)` (Async decrypt & retrieve)
- `dc.app.secretStorage.setSecret(id, val)` (Async encrypt & store)

### Diagnostic / Low-Level APIs
- `dc.app.shard` (Low-level cryptographic control)
- `dc.app.secretStorage.secrets` (Direct object access, potentially unencrypted)

### Potential Shard API Locations (Env Dependent)
- `dc.app.shard`
- `dc.app.coerce.shard`
- `dc.app.internal.shard`
- `dc.app.secretStorage.app.shard`
- `dc.app.secretStorage.adapter.safeStorage` (Electron/Mobile specific)
