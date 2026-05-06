---
name: resources
description: External library loading (cached/simple) and local asset management. Bridge between vault assets and web-based views.
---

# Resource & Asset Management

This module documents how to load external dependencies and manage local media assets (images, audio, video, 3D models).

## External Libraries

### Cached Script Loader (Recommended)
Fetches scripts from a CDN and stores them in `.datacore/script_cache/`. This ensures stability, offline access, and fast reloads.

### Dynamic ESM & Import Maps (Advanced)
For libraries like Three.js that rely on internal ESM imports:
1. **Inject Import Map:** Dynamically inject `<script type="importmap">` into the head before loading the module to tell the browser how to resolve specifiers.
2. **Use LoadScript Module:** Always use the dedicated `LoadScript` component with `{ type: 'module' }` for these assets.
3. **State Management:** Keep mutable objects (Scene, Camera, Renderer) in `useRef` to avoid desync from the render loop.

---

## Vault Assets

### Discovery Strategies
- **Exact Path:** Direct resolution for static assets (icons, UI textures).
- **Fuzzy Find:** Search by name to make components resilient to file moves.

### Media Patterns
- **Images:** `.png`, `.jpg`, `.svg`, `.webp`.
- **Audio/Video:** `.mp3`, `.mp4`, `.wav`.
- **3D Models:** `.glb` / `.gltf`.
- **Animations:** `.json` (Lottie).

> [!TIP]
> Use `blobUrlForPath` for high-performance preview thumbnails of large image libraries.
