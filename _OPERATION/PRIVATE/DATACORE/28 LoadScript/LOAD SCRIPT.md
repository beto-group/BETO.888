### Tab: LoadScript

- **Description**: A utility component that demonstrates a robust, network-aware asset loading system. It fetches scripts and images, caches them locally in the vault, and provides a real-time log of its operations.

- **Does**:
    
    - **Fetches & Caches Scripts**: Implements a loadScript function that downloads JavaScript files from a URL.
    - **Fetches & Caches Images**: Implements a fetchAndCacheImage function that downloads binary image data from a URL.
    - **Enables Offline Use**: Saves all downloaded assets into a local .datacore/ folder within the vault. On subsequent loads, it reads directly from this cache, allowing the component to work offline and load much faster.
    - **Provides Live Feedback**: Displays an on-screen "mini console" that logs every step of the loading process, clearly showing whether an asset is being fetched from the network or loaded from the local cache.

- **Can’t**:

    - Function offline on its first run for any given asset, as it must initially download it to create the cache.
    - Automatically detect when a remote asset has been updated; it will continue to use the cached version until the cache is manually cleared.
    - Be configured to load different assets without editing the component's code, as it is a demonstration, not a general-purpose tool.


![[loadscript.webp]]




### Components

###### [[D.q.loadscript.viewer|Load Script Viewer]]

###### [[D.q.loadscript.component|Load Script Component]]


