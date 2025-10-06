





# ViewComponent

```jsx
const { useEffect, useState } = dc;

function FolderEventListenerTesterV2() {
    // --- Set this to the folder you want to watch ---
    const FOLDER_TO_WATCH = '_RESOURCES/DATACORE/59 HotReloadFiles/example-folder';
    // ---------------------------------------------

    const [lastMatch, setLastMatch] = useState(null);

    useEffect(() => {
        const cleanFolderToWatch = FOLDER_TO_WATCH.replace(/\\/g, '/').replace(/\/$/, '');
        console.log(`[Folder Tester] Watcher is active. Target folder: "${cleanFolderToWatch}"`);
        new Notice(`Listener active for folder: "${cleanFolderToWatch}"`);

        const handleFileChange = (filePath) => {
            const normalizedFilePath = filePath.replace(/\\/g, '/');
            console.log(`[Folder Tester] Global vault event: "${normalizedFilePath}"`);

            // THE FILTER LOGIC
            if (normalizedFilePath.startsWith(cleanFolderToWatch + '/')) {
                const eventTime = new Date().toLocaleTimeString();
                const message = `MATCH! Change in "${normalizedFilePath}" at ${eventTime}`;

                // This log proves the filter is working.
                console.log(`%c[Folder Tester] ${message}`, 'color: lightgreen; font-weight: bold;');
                new Notice(`Matched change in: ${normalizedFilePath}`);
                setLastMatch({ path: normalizedFilePath, time: eventTime });

            } else {
                // This new 'else' block makes it clear when a file is being ignored.
                console.log(`[Folder Tester] Ignoring event (does not match target folder).`);
            }
        };

        const eventRef = dc.app.vault.on('raw', handleFileChange);

        return () => {
            console.log("[Folder Tester] Unregistering folder watcher.");
            new Notice("Folder listener stopped.");
            dc.app.vault.offref(eventRef);
        };
    }, [FOLDER_TO_WATCH]);

    const styles = {
        wrapper: { padding: '20px', border: '2px solid var(--background-modifier-border)', borderRadius: '8px', backgroundColor: 'var(--background-primary-alt)' },
        title: { margin: '0 0 10px 0' },
        filePath: { fontFamily: 'monospace', backgroundColor: 'var(--background-modifier-hover)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-accent)' },
        status: { marginTop: '15px', color: 'var(--text-muted)', fontSize: '0.9em' }
    };

    return (
        <div style={styles.wrapper}>
            <h3 style={styles.title}>Folder Event Listener Test (V2)</h3>
            <p>Watching for changes inside: <code style={styles.filePath}>{FOLDER_TO_WATCH}</code></p>
            <div style={styles.status}>
                {lastMatch ? (
                    <p><strong>Last Matched Change:</strong> {lastMatch.path} at {lastMatch.time}</p>
                ) : (
                    <p><strong>Status:</strong> Waiting for a matching file change...</p>
                )}
            </div>
        </div>
    );
}

return { View: FolderEventListenerTesterV2 };
```


