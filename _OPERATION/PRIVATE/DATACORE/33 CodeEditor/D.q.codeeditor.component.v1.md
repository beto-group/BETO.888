



# ViewComponent

```jsx
// ViewComponent

// Ensure dc is available in the scope for loadScript
// (It's already available from the initial dc.require)
const { loadScript } = await dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/33 CodeEditor/D.q.codeeditor.component.v1.md", "LoadScript"));


const { useRef, useEffect } = dc;

function CodeEditorView() {
    const editorContainerRef = useRef(null); // Ref for the div that will hold the Ace editor instance
    const aceEditorRef = useRef(null);       // Ref to store the Ace editor instance itself

    // Define Ace Editor CDN URLs and version for consistency
    const ACE_VERSION = "1.36.0"; // You can update this to the latest stable version
    const ACE_CDN_BASE = `https://cdn.jsdelivr.net/npm/ace-builds@${ACE_VERSION}/src-min`;
    const ACE_MAIN_SCRIPT_URL = `${ACE_CDN_BASE}/ace.js`;

    useEffect(() => {
        // Define an async function inside useEffect to handle the loading logic
        const setupEditor = async () => {
            // 1. Check if Ace is already globally available (window.ace)
            if (window.ace) {
                console.log("Ace Editor already present. Initializing editor.");
                initAceEditor();
                return; // Exit as nothing more needs to be loaded
            }

            // Use loadScript to load the Ace Editor main script
            try {
                console.log("Loading Ace Editor main script via loadScript...");
                // The loadScript function will handle fetching, caching, and injecting the script.
                // It resolves when the script is loaded and executed.
                await loadScript(dc, ACE_MAIN_SCRIPT_URL); // Pass dc as the first argument

                // If loadScript succeeds, window.ace should now be available
                initAceEditor();
            } catch (e) {
                console.error("Failed to load Ace Editor main script:", e);
                if (editorContainerRef.current) {
                    editorContainerRef.current.innerHTML = "<p style='color: red;'>Failed to load Ace Editor. Please check your network or Content Security Policy (CSP) settings.</p>";
                }
            }
        };

        setupEditor(); // Call the async function

        function initAceEditor() {
            if (!editorContainerRef.current) {
                console.warn("Ace editor container element not found. Cannot initialize editor.");
                return;
            }

            // Ensure window.ace is available before trying to use it
            if (!window.ace) {
                console.error("window.ace not available after script load.");
                if (editorContainerRef.current) {
                    editorContainerRef.current.innerHTML = "<p style='color: red;'>Ace Editor global object not found. Check for script loading errors or conflicts.</p>";
                }
                return;
            }

            // Crucial: Tell Ace where to find its themes, modes, and workers.
            // It will dynamically load them from this base path.
            window.ace.config.set('basePath', ACE_CDN_BASE);
            window.ace.config.set('modePath', ACE_CDN_BASE); // Explicitly set mode path
            window.ace.config.set('themePath', ACE_CDN_BASE); // Explicitly set theme path
            window.ace.config.set('workerPath', ACE_CDN_BASE); // Explicitly set worker path

            // Dispose of any existing editor instance before creating a new one
            if (aceEditorRef.current) {
                aceEditorRef.current.destroy(); // Ace uses destroy()
                aceEditorRef.current.container.remove(); // Remove the container element if Ace detached it
                aceEditorRef.current = null;
            }

            // Create the Ace editor instance
            aceEditorRef.current = window.ace.edit(editorContainerRef.current, {
                mode: "ace/mode/javascript", // Set initial language (e.g., "ace/mode/html", "ace/mode/css", "ace/mode/json")
                theme: "ace/theme/monokai",   // Set theme (e.g., "ace/theme/github", "ace/theme/dracula", "ace/theme/monokai")
                value: [
                    '// Welcome to Ace Editor!',
                    '// This is another embeddable code editor.',
                    'function helloAce() {',
                    '  console.log("Ace Editor is ready!");',
                    '}',
                    'helloAce();',
                    '',
                    '// Ace supports many languages and themes.'
                ].join('\n'),
                fontSize: 14,
                wrap: true, // Enable word wrap
                autoScrollEditorIntoView: true, // Scrolls editor into view if it is out of focus
                enableBasicAutocompletion: true, // Enable basic autocompletion
                enableLiveAutocompletion: true, // Enable live autocompletion (might require specific modes)
                // Add other options as needed:
                // readOnly: true,
                // maxLines: 20,
                // minLines: 10,
            });

            console.log("Ace Editor initialized successfully.");

            // Optional: Expose editor for debugging/external control if needed
            // window.myAceEditor = aceEditorRef.current;

            // Ace's resize method is good practice if container changes size
            aceEditorRef.current.resize();
        }

        // Cleanup function: runs when the component unmounts
        return () => {
            console.log("Ace useEffect cleanup running.");
            // Dispose of the editor instance
            if (aceEditorRef.current) {
                aceEditorRef.current.destroy();
                aceEditorRef.current.container.remove(); // Remove the div that Ace might have created/modified
                aceEditorRef.current = null;
            }
            // IMPORTANT: Do NOT remove the main Ace script here.
            // Like Monaco, it sets up globals that persist.
            // We rely on the initial `if (window.ace)` check.
        };
    }, [dc]); // Add dc to the dependency array, as loadScript requires it.

    // The div where the Ace Editor will be mounted.
    // It needs a defined height for Ace to render correctly.
    return (
        <div ref={editorContainerRef} style={{ width: "100%", height: "400px", border: "1px solid #ddd" }} />
    );
}

// Corrected export for Datacore
return {CodeEditorView};
```




# LoadScript

```jsx
/**
 * Loads a script either from a URL (with caching) or a local vault path.
 * In a Datacore component context, this function requires the `dc` object
 * to access the vault's file system adapter for caching.
 *
 * @param {object} dc - The Datacore context object.
 * @param {string} src - The URL or local vault path of the script.
 * @param {Function} [onload] - Optional callback function to execute when the script loads successfully.
 * @param {Function} [onerror] - Optional callback function to execute if loading fails.
 * @returns {Promise<HTMLScriptElement>} A promise that resolves with the script element when loaded, or rejects on error.
 */
async function loadScript(dc, src, onload, onerror) {
  // Define a cache directory within Obsidian's hidden folder structure
  const cacheDir = ".datacore/script_cache";
  // Simple check for URL format
  const isUrl = /^https?:\/\//.test(src);

  // --- Helper Function to Execute Script Content ---
  const executeScriptContent = (scriptContent, resolve, reject, scriptElement) => {
    try {
      scriptElement.textContent = scriptContent;
      document.body.appendChild(scriptElement);
      console.log(`Script executed from ${isUrl ? 'cache/network' : 'local path'}: ${src}`);
      if (onload) {
        onload();
      }
      resolve(scriptElement);
    } catch (execError) {
      console.error(`Error executing script content from ${src}:`, execError);
      if (onerror) {
        onerror(execError);
      }
      reject(execError);
    }
  };

  return new Promise(async (resolve, reject) => {
    const scriptElement = document.createElement("script");
    scriptElement.async = true;

    // **CHANGE**: Get the adapter from the `dc` object, not the global `app`.
    if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
        return reject(new Error("Datacore context 'dc' with vault adapter is required for loadScript."));
    }
    const adapter = dc.app.vault.adapter;

    try {
      if (isUrl) {
        // --- URL Handling (Fetch & Cache) ---
        const safeFilename = src
          .replace(/^https?:\/\//, '')
          .replace(/[\/\\?%*:|"<>]/g, '_') + ".js";
        const cachePath = `${cacheDir}/${safeFilename}`;

        let scriptText = null;

        // 1. Check if the cached file exists
        const cachedExists = await adapter.exists(cachePath);

        if (cachedExists) {
          console.log(`Loading script from cache: ${cachePath}`);
          try {
            scriptText = await adapter.read(cachePath);
          } catch (readError) {
            console.warn(`Failed to read cache file ${cachePath}, attempting refetch. Error:`, readError);
          }
        }

        if (scriptText === null) {
          console.log(`Fetching script from network: ${src}`);
          const response = await fetch(src);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${src}`);
          }
          scriptText = await response.text();

          // 3. Write to cache
          try {
            if (!(await adapter.exists(cacheDir))) {
              console.log(`Creating script cache directory: ${cacheDir}`);
              await adapter.mkdir(cacheDir);
            }
            console.log(`Writing script to cache: ${cachePath}`);
            await adapter.write(cachePath, scriptText);
          } catch (writeError) {
            console.warn(`Failed to write script to cache ${cachePath}. Error:`, writeError);
          }
        }
        executeScriptContent(scriptText, resolve, reject, scriptElement);

      } else {
        // --- Local Vault Path Handling ---
        console.log(`Loading script from local vault path: ${src}`);
        const localFileExists = await adapter.exists(src);

        if (!localFileExists) {
           throw new Error(`Local script file not found: ${src}`);
        }

        const scriptText = await adapter.read(src);
        executeScriptContent(scriptText, resolve, reject, scriptElement);
      }
    } catch (error) {
      // --- General Error Handling ---
      console.error(`Failed to load script ${src}:`, error);
      if (scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      if (onerror) {
        onerror(error);
      }
      reject(error);
    }
  });
}

return { loadScript };
```


