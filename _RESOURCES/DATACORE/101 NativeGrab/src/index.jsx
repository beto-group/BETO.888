
/**
 * 128_Native_Grab Modular Entry Point
 * Implements Phase-based loading, Deep Immersion FullTab, and Native CDP.
 */
async function View({ folderPath }) {
    return <SafeView folderPath={folderPath} />;
}

const SafeView = ({ folderPath }) => {
    const { useState, useEffect } = dc;
    const [app, setApp] = useState(null);
    const [core, setCore] = useState(null);
    const [error, setError] = useState(null);
    const [isFullTab, setIsFullTab] = useState(true);

    // Phase 1: Load Core (Styles, Hooks, Utils, Bridges)
    useEffect(() => {
        const loadCore = async () => {
            try {
                const { themeStyles, tokens } = await dc.require(folderPath + "/src/styles/theme.js");
                const { useTheme } = await dc.require(folderPath + "/src/hooks/useTheme.jsx");
                const domUtils = await dc.require(folderPath + "/src/utils/domUtils.jsx");
                const { useFullTab } = await dc.require(folderPath + "/src/hooks/useFullTab.jsx");
                const { getCLIBridge } = await dc.require(folderPath + "/src/utils/CLIBridge.jsx");

                const CLIBridge = getCLIBridge();
                setCore({ themeStyles, tokens, useTheme, domUtils, useFullTab, CLIBridge });
            } catch (e) {
                console.error("[NativeGrab] Phase 1 Load Error:", e);
                setError(e);
            }
        };
        loadCore();
    }, [folderPath]);

    // Phase 2: Load Application Components
    useEffect(() => {
        if (!core) return;
        let active = true;
        const loadApp = async () => {
            try {
                await new Promise(r => setTimeout(r, 100)); // Brief yield
                if (!active) return;

                const UI = await dc.require(folderPath + "/src/components/UI.jsx");
                const { Scanner } = await dc.require(folderPath + "/src/components/Scanner.jsx");

                if (active) {
                    setApp({ ...core, UI, Scanner });
                }
            } catch (e) {
                console.error("[NativeGrab] Phase 2 Load Error:", e);
                if (active) setError(e);
            }
        };
        loadApp();
        return () => { active = false; };
    }, [core]);

    if (error) return <div style={{ color: 'red', padding: 20 }}>Load Error: {error.message}</div>;

    if (core) {
        return (
            <AppWrapper
                app={app || core}
                folderPath={folderPath}
                isFullTab={isFullTab}
                setIsFullTab={setIsFullTab}
                isLoading={!app}
            />
        );
    }

    return <div style={{ background: '#050505', color: '#8b5cf6', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>BOOTING METASCAN...</div>;
};

function AppWrapper({ app, folderPath, isFullTab, setIsFullTab, isLoading }) {
    const containerRef = dc.useRef(null);
    const { useTheme, useFullTab, domUtils, themeStyles } = app;

    useFullTab({ isFullTab, containerRef, domUtils });
    useTheme({ css: themeStyles, folderPath });

    return (
        <div ref={containerRef} className="ng-root">
            {isLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontSize: '14px', fontWeight: 'bold', letterSpacing: '4px' }}>
                    INITIALIZING PROTOCOLS...
                </div>
            ) : (
                <MainApp app={app} folderPath={folderPath} isFullTab={isFullTab} setIsFullTab={setIsFullTab} />
            )}
        </div>
    );
}

function MainApp({ app, folderPath, isFullTab, setIsFullTab }) {
    const { useState, useEffect, useCallback, useRef } = dc;
    const { UI, Scanner, tokens, CLIBridge } = app;
    const { Sidebar, AnalysisLayer, PluginControlPanel } = UI;
    const { spawn } = require('child_process');

    const [isInspecting, setIsInspecting] = useState(false);
    const [node, setNode] = useState(null);
    const [logs, setLogs] = useState(["v11_NATIVE_ACTIVE"]);
    const [copied, setCopied] = useState(false);

    // Plugin Management State
    const [status, setStatus] = useState("Idle");
    const [isDeploying, setIsDeploying] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [currentVersion, setCurrentVersion] = useState("0.0.0");
    const [showSettings, setShowSettings] = useState(false);
    const [repoName, setRepoName] = useState(localStorage.getItem('mp_repo_name') || "metascan-pro");
    const [ghToken, setGhToken] = useState("");
    const [githubUrl, setGithubUrl] = useState("");

    const currentVersionRef = useRef(currentVersion);
    useEffect(() => { currentVersionRef.current = currentVersion; }, [currentVersion]);

    const addLog = useCallback((m) => {
        setLogs(p => [m, ...p].slice(0, 10));
        console.log(`[NativeGrab] [LOG] ${m}`);
    }, []);

    // Load Secrets / Config
    useEffect(() => {
        const loadConfig = async () => {
            const storage = dc.app.secretStorage || window.app?.secretStorage;
            let token = "";
            if (storage) {
                if (typeof storage.getSecret === 'function') {
                    token = await storage.getSecret('metascan-pro-gh-token');
                    if (!token) token = await storage.getSecret('dc-github-token'); // Smart fallback
                } else if (storage.secrets) {
                    token = storage.secrets?.['metascan-pro-gh-token'] || storage.secrets?.['dc-github-token'];
                }
                if (token) setGhToken(token);
            }
            
            try {
                const fs = require('fs');
                const path = require('path');
                const vaultPath = dc.app.vault.adapter.getBasePath();
                const mPath = path.resolve(vaultPath, "_RESOURCES/PLUGINS/metascan-pro/manifest.json");
                if (fs.existsSync(mPath)) {
                    const m = JSON.parse(fs.readFileSync(mPath, 'utf8'));
                    setCurrentVersion(m.version);
                }
                
                // Construct initial URL if repoName is known
                if (repoName && token) {
                    const userRes = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } });
                    if (userRes.ok) {
                        const { login } = await userRes.json();
                        setGithubUrl(`https://github.com/${login}/${repoName}`);
                    }
                }
            } catch(e) {}
        };
        loadConfig();
    }, []);

    const updateToken = async (val) => {
        setGhToken(val);
        const storage = dc.app.secretStorage || window.app?.secretStorage;
        if (storage && typeof storage.setSecret === 'function') {
            await storage.setSecret('metascan-pro-gh-token', val);
        }
    };

    const updateVersion = async (val) => {
        setCurrentVersion(val);
        try {
            const fs = require('fs');
            const path = require('path');
            const vaultPath = dc.app.vault.adapter.getBasePath();
            const sourceManifestPath = path.resolve(vaultPath, "_RESOURCES/PLUGINS/metascan-pro/manifest.json");
            if (fs.existsSync(sourceManifestPath)) {
                const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
                manifest.version = val;
                fs.writeFileSync(sourceManifestPath, JSON.stringify(manifest, null, '\t'));
                addLog(`SYNC_V${val}`);
            }
        } catch (e) {
            console.error("Manifest sync error:", e);
        }
    };

    const handleCopy = () => {
        if (!node) return;
        navigator.clipboard.writeText(JSON.stringify(node, null, 2));
        setCopied(true);
        addLog("METADATA_COPIED");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeploy = () => {
        setIsDeploying(true);
        setStatus("Running pipeline...");
        addLog("DEPLOY_INITIATED");

        // 1. Automatic Version Bump (+1)
        const fs = require('fs');
        const path = require('path');
        const vaultPath = dc.app.vault.adapter.getBasePath();
        const sourceManifestPath = path.resolve(vaultPath, "_RESOURCES/PLUGINS/metascan-pro/manifest.json");
        
        try {
            const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
            const parts = manifest.version.split('.');
            parts[2] = parseInt(parts[2] || 0) + 1;
            const newVersion = parts.join('.');
            
            // Sync to disk and state
            updateVersion(newVersion);
            addLog(`BUMP_V${newVersion}`);
        } catch (e) { addLog("BUMP_FAILED"); }

        const liveManifestPath = path.resolve(vaultPath, ".obsidian/plugins/metascan-pro/manifest.json");
        const communityPluginsPath = path.resolve(vaultPath, ".obsidian/community-plugins.json");
        const pluginPath = path.dirname(sourceManifestPath);
        const livePath = path.dirname(liveManifestPath);

        addLog(`DEPLOY_V${currentVersion}`);

        const cmd = `
            (obsidian eval code="app.plugins.disablePlugin('metascan-pro')" || true) && 
            mkdir -p "${livePath}" && 
            npx -y esbuild src/main.tsx --bundle --outfile="${livePath}/main.js" --platform=node --external:obsidian --external:electron --format=cjs --loader:.tsx=tsx --loader:.ts=ts && 
            cp "${sourceManifestPath}" "${liveManifestPath}" && 
            (cp "${path.join(pluginPath, 'styles.css')}" "${path.join(livePath, 'styles.css')}" || true) &&
            (obsidian eval code="app.plugins.enablePlugin('metascan-pro')" || true) && 
            (obsidian plugin:reload id="metascan-pro" || true)
        `.trim().replace(/\n/g, '');

        const child = spawn('/bin/zsh', ['-l', '-c', cmd], { cwd: pluginPath, env: { ...process.env, TERM: 'xterm-256color' }, detached: true });
        let logBuffer = "";
        child.stdout.on('data', d => logBuffer += d.toString());
        child.stderr.on('data', d => logBuffer += d.toString());

        child.on('close', (code) => {
            setIsDeploying(false);
            if (code === 0) {
                setStatus("Deployment Success");
                addLog("DEPLOY_COMPLETE");
            } else {
                setStatus("Deploy Error");
                addLog(`DEPLOY_FAIL_C${code}`);
                console.error("Deploy Fail:", logBuffer);
            }
        });
    };

    const handlePublish = async () => {
        if (!repoName || !ghToken) { setStatus("Missing Token/Repo"); return; }
        setIsPublishing(true);
        setStatus("Publishing...");
        addLog("PUBLISH_INITIATED");

        try {
            const path = require('path');
            const fs = require('fs');
            const vaultPath = dc.app.vault.adapter.getBasePath();
            const sourceManifestPath = path.resolve(vaultPath, "_RESOURCES/PLUGINS/metascan-pro/manifest.json");
            const livePath = path.resolve(vaultPath, ".obsidian/plugins/metascan-pro");
            const pluginPath = path.dirname(sourceManifestPath);

            // 0. Auto-Bump Version for Publish
            let pushVersion = currentVersionRef.current;
            try {
                if (fs.existsSync(sourceManifestPath)) {
                    const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
                    const parts = manifest.version.split('.');
                    parts[2] = parseInt(parts[2] || 0) + 1;
                    pushVersion = parts.join('.');
                    
                    manifest.version = pushVersion;
                    fs.writeFileSync(sourceManifestPath, JSON.stringify(manifest, null, '\t'));
                    
                    // Sync State & Ref
                    setCurrentVersion(pushVersion);
                    currentVersionRef.current = pushVersion;
                    addLog(`PUBLISH_BUMP_V${pushVersion}`);
                }
            } catch (e) { addLog("PUBLISH_BUMP_FAIL"); }

            // 1. GitHub User Discovery
            const userRes = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' } });
            if (!userRes.ok) throw new Error("Auth Failed");
            const { login } = await userRes.json();
            
            setGithubUrl(`https://github.com/${login}/${repoName}`);
            const authedUrl = `https://${ghToken}@github.com/${login}/${repoName}.git`;
            const cmd = `
                git init && 
                git config user.name "${login}" && 
                git config user.email "${login}@users.noreply.github.com" &&
                git add -A && 
                (git commit -m "Factory Sync [v${pushVersion}]" --allow-empty || true) && 
                git branch -M main && 
                (git remote add origin "${authedUrl}" 2>/dev/null || git remote set-url origin "${authedUrl}") && 
                git push -u origin main --force
            `.trim().replace(/\n/g, '');

            const child = spawn('/bin/zsh', ['-l', '-c', cmd], { cwd: pluginPath });
            
            child.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => line.trim() && addLog(`GIT: ${line.trim()}`));
            });

            child.stderr.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => line.trim() && addLog(`GIT_ERR: ${line.trim()}`));
            });

            child.on('close', async (code) => {
                if (code !== 0) { setStatus("Push Failed"); setIsPublishing(false); return; }
                
                try {
                    const req = window.requestUrl || dc.app.requestUrl;
                    const tag = `v${currentVersionRef.current}`; // Guaranteed to be pushVersion
                    
                    // 2. Check for Existing Release (Idempotent Flow)
                    setStatus(`Syncing Release ${tag}...`);
                    addLog(`CHECKING_TAG_${tag}`);
                    const checkRes = await req({
                        url: `https://api.github.com/repos/${login}/${repoName}/releases/tags/${tag}?t=${Date.now()}`,
                        headers: { 
                            'Authorization': `token ${ghToken}`, 
                            'Accept': 'application/vnd.github.v3+json',
                            'Cache-Control': 'no-cache'
                        },
                        throw: false
                    });

                    let release;
                    if (checkRes.status === 200) {
                        release = checkRes.json;
                        setStatus("Existing release found. Updating assets...");
                        addLog("RELEASE_EXISTS_UPDATING");
                    } else {
                        // Create New
                        setStatus("Creating new release...");
                        addLog("CREATING_NEW_RELEASE");
                        const createRes = await req({
                            url: `https://api.github.com/repos/${login}/${repoName}/releases`,
                            method: 'POST',
                            headers: { 'Authorization': `token ${ghToken}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tag_name: tag, name: `Metascan Pro ${tag}`, body: "Automated Resilient Release.", draft: false })
                        });
                        release = createRes.json;
                        addLog("RELEASE_CREATED");
                    }

                    if (!release || !release.upload_url) throw new Error("Could not find release target.");
                    const uploadUrl = release.upload_url.split('{')[0];

                    // 3. Purge Existing Assets (Fault Tolerant)
                    if (release.assets && release.assets.length > 0) {
                        const targets = ['main.js', 'manifest.json', 'styles.css'];
                        for (const asset of release.assets) {
                            if (targets.includes(asset.name)) {
                                setStatus(`Purging ${asset.name}...`);
                                addLog(`PURGE_${asset.name.toUpperCase()} (ID:${asset.id})`);
                                try {
                                    await req({
                                        url: `https://api.github.com/repos/${login}/${repoName}/releases/assets/${asset.id}`,
                                        method: 'DELETE',
                                        headers: { 'Authorization': `token ${ghToken}` }
                                    });
                                } catch (e) {
                                    addLog(`PURGE_SKIP_${asset.name.toUpperCase()}`);
                                }
                            }
                        }
                    }

                    // 4. Upload Binary Assets (Fixed Regression)
                    const assets = [
                        { name: 'main.js', path: path.join(livePath, 'main.js') },
                        { name: 'manifest.json', path: sourceManifestPath },
                        { name: 'styles.css', path: path.join(pluginPath, 'styles.css') }
                    ];

                    for (const asset of assets) {
                        if (fs.existsSync(asset.path)) {
                            setStatus(`Uploading ${asset.name}...`);
                            addLog(`UPLOAD_${asset.name.toUpperCase()}`);
                            const fileData = fs.readFileSync(asset.path);
                            await req({
                                url: `${uploadUrl}?name=${asset.name}`,
                                method: 'POST',
                                headers: { 'Authorization': `token ${ghToken}`, 'Content-Type': 'application/octet-stream' },
                                body: new Uint8Array(fileData).buffer
                            });
                        }
                    }

                    setStatus("Published v" + currentVersionRef.current);
                    addLog("PUBLISH_SUCCESS");
                    setIsPublishing(false);
                } catch (err) {
                    console.error("Release Sync Error:", err);
                    setStatus(`SYNC OK, RELEASE FAILED: ${err.message}`);
                    setIsPublishing(false);
                }
            });
        } catch (e) { setStatus("Error: " + e.message); setIsPublishing(false); }
    };

    return (
        <>
            <Scanner 
                isInspecting={isInspecting} 
                setIsInspecting={setIsInspecting} 
                setNode={setNode} 
                addLog={addLog} 
                tokens={tokens} 
                CLIBridge={CLIBridge}
            />
            
            <PluginControlPanel 
                tokens={tokens}
                status={status}
                currentVersion={currentVersion}
                githubUrl={githubUrl}
                isDeploying={isDeploying}
                isPublishing={isPublishing}
                handleDeploy={handleDeploy}
                handlePublish={handlePublish}
                handleVisitRepo={async () => {
                    if (!githubUrl) return;
                    try {
                        // Attempt to open in Official Web Viewer (internal tab)
                        const leaf = dc.app.workspace.getLeaf('tab');
                        await leaf.setViewState({
                            type: 'webviewer',
                            active: true,
                            state: { url: githubUrl }
                        });
                        addLog("NAVIGATED_WEBVIEWER");
                    } catch (e) {
                        // Fallback to system browser
                        window.open(githubUrl, '_blank');
                        addLog("NAVIGATED_EXTERNAL");
                    }
                }}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                repoName={repoName}
                setRepoName={setRepoName}
                ghToken={ghToken}
                updateToken={updateToken}
                updateVersion={updateVersion}
            />

            <Sidebar 
                isInspecting={isInspecting}
                startInspection={() => setIsInspecting(true)}
                stopInspection={() => setIsInspecting(false)}
                logs={logs}
                tokens={tokens}
            />

            <AnalysisLayer 
                node={node}
                logs={logs}
                tokens={tokens}
                handleCopy={handleCopy}
                copied={copied}
            />
        </>
    );
}

return { View };
