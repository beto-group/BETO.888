
const { useState, useEffect, useMemo } = dc;
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

export function App({ folderPath, STYLES, AppCard }) {
    const [apps, setApps] = useState([]);
    const [search, setSearch] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        setLoading(true);
        try {
            const appDir = '/Applications';
            const files = await fs.promises.readdir(appDir);

            const appList = files
                .filter(file => file.endsWith('.app'))
                .map(file => ({
                    name: file.replace('.app', ''),
                    path: path.join(appDir, file),
                    filename: file
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setApps(appList);
        } catch (err) {
            console.error("Failed to list apps:", err);
            setStatusMsg(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const executeCommand = (cmd, args) => {
        return new Promise((resolve, reject) => {
            const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
            child.unref();
            child.on('error', (err) => reject(err));
            setTimeout(() => resolve(), 500);
        });
    };

    const openApp = async (appItem) => {
        try {
            if (isAdmin) {
                const osaCmd = `do shell script "open -a \\"${appItem.path}\\"" with administrator privileges`;
                await executeCommand('osascript', ['-e', osaCmd]);
                new Notice(`Launched (Admin): ${appItem.name}`);
            } else {
                await executeCommand('open', ['-a', appItem.path]);
                new Notice(`Launched: ${appItem.name}`);
            }
        } catch (err) {
            console.error("Failed to launch:", err);
            new Notice(`Failed: ${err.message}`);
        }
    };

    const filteredApps = useMemo(() => {
        if (!search) return apps;
        const q = search.toLowerCase();
        return apps.filter(app => app.name.toLowerCase().includes(q));
    }, [apps, search]);

    return (
        <div style={STYLES.container}>
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>

            <div style={STYLES.header}>
                <h2 style={STYLES.title}>Open App</h2>

                <div style={STYLES.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={STYLES.searchInput}
                        autoFocus
                    />
                </div>

                <div style={STYLES.controls}>
                    <div
                        style={{
                            ...STYLES.adminToggle,
                            ...(isAdmin ? STYLES.adminToggleActive : {})
                        }}
                        onClick={() => setIsAdmin(!isAdmin)}
                        title="Toggle Run as Administrator"
                    >
                        {isAdmin ? '🛡️ ADMIN ON' : '🛡️ Admin Off'}
                    </div>
                    <div
                        style={STYLES.adminToggle}
                        onClick={loadApps}
                        title="Refresh List"
                    >
                        🔄
                    </div>
                </div>
            </div>

            <div style={STYLES.content}>
                {statusMsg && <div style={{ color: 'red', marginBottom: '20px' }}>{statusMsg}</div>}

                {loading ? (
                    <div style={{ ...STYLES.loadingOverlay, position: 'relative', height: '200px', background: 'transparent' }}>
                        <div className="spinner" style={STYLES.spinner}></div>
                    </div>
                ) : (
                    <div style={STYLES.grid}>
                        {filteredApps.map(app => (
                            <AppCard key={app.path} app={app} onClick={openApp} STYLES={STYLES} />
                        ))}
                    </div>
                )}

                {!loading && filteredApps.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#71717a', padding: '40px' }}>
                        No applications found.
                    </div>
                )}
            </div>
        </div>
    );
}
