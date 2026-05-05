
# InceptionEngine

```jsx
const { useEffect, useState } = dc;

/**
 * RemoteModule (The Inception Engine)
 * A dynamic loader that imports external .jsx files and renders them as components.
 */
const RemoteModule = ({ path, props, LoadingScreen, OverlayLogo }) => {
    const [Component, setComponent] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                // Ensure we use absolute paths for dc.require
                let fullPath = dc.resolvePath(path);
                
                // --- AUTO-HEADER LINKING ---
                // If it's a markdown file, Datacore require() needs a header link.
                // We assume the component export is under a header matching the filename.
                if (fullPath.endsWith('.md')) {
                    const fileName = path.split('/').pop().replace('.md', '');
                    fullPath = dc.headerLink(fullPath, fileName);
                }
                
                const module = await dc.require(fullPath);
                
                if (!isMounted) return;

                // Handle different export patterns:
                // 1. default export (Component)
                // 2. Named export (e.g. { Home })
                // 3. Factory function returning { Component }
                let Comp = module.default || module;
                
                // If it's a factory (datacore script style)
                if (typeof Comp === 'object' && !Comp.$$typeof) {
                    Comp = Object.values(Comp)[0];
                }

                if (!Comp) throw new Error("No renderable component found in module.");
                
                setComponent(() => Comp);
            } catch (err) {
                console.error(`[Inception] Failed to load module: ${path}`, err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [path]);

    if (error) return (
        <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(255, 85, 85, 0.05)',
            border: '1px solid rgba(255, 85, 85, 0.2)',
            borderRadius: '12px'
        }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚠️</div>
            <h4 style={{ color: '#ff5555', fontVariant: 'small-caps', letterSpacing: '2px' }}>Inception Error</h4>
            <code style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', maxWidth: '80%' }}>{error}</code>
            <p style={{ fontSize: '12px', marginTop: '15px' }}>Check if the path <code>{path}</code> is correct and the code has no syntax errors.</p>
        </div>
    );

    if (loading) return (
        <LoadingScreen label="LOADING" OverlayLogo={OverlayLogo} />
    );

    // Pass the calculated folderPath to the component
    const folderPath = path.substring(0, path.lastIndexOf('/'));
    const parentFolderPath = folderPath.substring(0, folderPath.lastIndexOf('/'));

    return <Component {...props} folderPath={parentFolderPath} />;
};

return { RemoteModule };
```
