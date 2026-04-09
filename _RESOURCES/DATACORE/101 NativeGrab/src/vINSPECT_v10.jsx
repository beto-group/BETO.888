/**
 * 128_Native_Grab - METASCAN PRO (v10)
 * HOTFIX: RESTORE MISSING REFS + STABILITY
 * Resolves ReferenceError: overlayRef is not defined.
 */
async function View({ folderPath }) {
    const { spawn } = require('child_process');
    const { useState, useEffect, useRef, useCallback } = dc;

    const TOKENS = {
        primary: 'oklch(65.41% 0.176 285.34)',
        bg: 'oklch(14.5% 0.012 285.34)',
        surface: 'rgba(15, 23, 42, 0.6)',
        border: 'rgba(139, 92, 246, 0.15)',
        textDim: 'oklch(70% 0.01 285.34)',
        textBright: 'oklch(95% 0.005 285.34)',
        accentGold: 'oklch(80% 0.15 85)',
        accentPink: 'oklch(75% 0.18 330)',
        accentGreen: 'oklch(75% 0.18 150)'
    };

    const STYLES = {
        main: { height: '100%', background: TOKENS.bg, color: TOKENS.textBright, fontFamily: 'Outfit, Inter, sans-serif', display: 'flex', overflow: 'hidden' },
        sidebar: { width: '400px', flexShrink: 0, borderRight: `1px solid ${TOKENS.border}`, background: 'rgba(10, 10, 15, 0.8)', display: 'flex', flexDirection: 'column', height: '100%', backdropFilter: 'blur(20px)' },
        content: { flex: 1, minWidth: 0, padding: '50px', display: 'flex', flexDirection: 'column', gap: '35px', overflowY: 'auto' },
        header: { padding: '25px 35px', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        btn: (active, small) => ({ 
            padding: small ? '8px 16px' : '16px 32px', background: active ? 'oklch(60% 0.18 20)' : TOKENS.primary, color: '#fff', 
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '900',
            letterSpacing: '1px', transition: 'all 0.2s', textTransform: 'uppercase', fontSize: small ? '10px' : '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }),
        card: { 
            background: TOKENS.surface, borderRadius: '20px', padding: '28px', border: `1px solid ${TOKENS.border}`, 
            backdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden', minWidth: 0
        },
        cardTitle: { 
            fontSize: '10px', color: TOKENS.textDim, textTransform: 'uppercase', letterSpacing: '2px', 
            marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        },
        metricLabel: { fontSize: '42px', fontWeight: '900', color: TOKENS.primary, fontFamily: 'JetBrains Mono, monospace' }
    };

    const Icon = ({ name, size = 18, color = 'currentColor' }) => (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}><dc.Icon icon={name} style={{ width: size, height: size, color }} /></div>
    );

    const PluginControlPanel = ({ folderPath }) => {
        const [isVisible, setIsVisible] = useState(false);
        const [showSettings, setShowSettings] = useState(false);
        const [isDeploying, setIsDeploying] = useState(false);
        const [isPublishing, setIsPublishing] = useState(false);
        const [status, setStatus] = useState("Idle");
        
        const [repoName, setRepoName] = useState(localStorage.getItem('mp_repo_name') || "metascan-pro");
        const [ghToken, setGhToken] = useState("");
        const [githubUrl, setGithubUrl] = useState("");

        useEffect(() => {
            const loadSecrets = async () => {
                const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
                if (!storage) return;
                
                let token = "";
                if (typeof storage.getSecret === 'function') {
                    token = await storage.getSecret('metascan-pro-gh-token');
                    if (!token) {
                        token = await storage.getSecret('dc-github-token'); // Smart Discovery
                        if (token) setStatus("Discovered Global Token");
                    }
                } else if (storage.secrets) {
                    token = storage.secrets['metascan-pro-gh-token'] || storage.secrets['dc-github-token'];
                }
                if (token) {
                    setGhToken(token);
                    // Pre-fetch URL
                    try {
                        const res = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${token}` } });
                        if (res.ok) {
                            const d = await res.json();
                            setGithubUrl(`https://github.com/${d.login}/${repoName}`);
                        }
                    } catch(e) {}
                }
            };
            loadSecrets();
        }, [repoName]);

        useEffect(() => {
            localStorage.setItem('mp_repo_name', repoName);
        }, [repoName]);

        const handleVisitRepo = () => {
            if (githubUrl) window.open(githubUrl, '_blank');
        };

        const updateToken = async (val) => {
            setGhToken(val);
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
            if (storage && typeof storage.setSecret === 'function') {
                await storage.setSecret('metascan-pro-gh-token', val);
            } else if (storage && storage.secrets) {
                storage.secrets['metascan-pro-gh-token'] = val;
                if (storage.saveSecrets) await storage.saveSecrets();
            }
        };

        const [currentVersion, setCurrentVersion] = useState("0.0.0");

        useEffect(() => {
            const fs = require('fs');
            const path = require('path');
            try {
                const vaultPath = dc.app.vault.adapter.getBasePath();
                const mPath = path.resolve(vaultPath, "_RESOURCES/PLUGINS/metascan-pro/manifest.json");
                const m = JSON.parse(fs.readFileSync(mPath, 'utf8'));
                setCurrentVersion(m.version);
                
                // Smart Discovery: Build URL if repoName is set
                if (repoName && ghToken) {
                    const req = window.requestUrl || dc.app.requestUrl;
                    req({
                        url: 'https://api.github.com/user',
                        headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
                    }).then(res => {
                        const login = res.json.login;
                        setGithubUrl(`https://github.com/${login}/${repoName}`);
                    }).catch(() => {});
                }
            } catch(e) {}
        }, [isDeploying, isPublishing, ghToken]); // Re-run if token changes



        const handleDeploy = () => {
            setIsDeploying(true);
            setStatus("Running esbuild pipeline...");

            const fs = require('fs');
            const path = require('path');
            const vaultPath = dc.app.vault.adapter.getBasePath();
            const sourceManifestPath = path.resolve(vaultPath, "_RESOURCES/PLUGINS/metascan-pro/manifest.json");
            const liveManifestPath = path.resolve(vaultPath, ".obsidian/plugins/metascan-pro/manifest.json");
            const communityPluginsPath = path.resolve(vaultPath, ".obsidian/community-plugins.json");
            const pluginPath = path.dirname(sourceManifestPath);
            const livePath = path.dirname(liveManifestPath);

            // 1. Increment Version in Source
            try {
                const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
                const parts = manifest.version.split('.');
                parts[2] = parseInt(parts[2]) + 1;
                manifest.version = parts.join('.');
                fs.writeFileSync(sourceManifestPath, JSON.stringify(manifest, null, '\t'));
                setStatus(`Bumping to v${manifest.version}...`);
            } catch (e) {
                console.error("Version Bump Failed:", e);
            }

            // 2. Ensure Persistent Enablement in community-plugins.json
            try {
                const config = JSON.parse(fs.readFileSync(communityPluginsPath, 'utf8'));
                if (!config.includes("metascan-pro")) {
                    config.push("metascan-pro");
                    fs.writeFileSync(communityPluginsPath, JSON.stringify(config, null, '  '));
                }
            } catch (e) {
                console.error("Persistence Sync Failed:", e);
            }
            
            // 3. Build & Deploy Chain (Hardened)
            const cmd = `
                (obsidian eval code="app.plugins.disablePlugin('metascan-pro')" || true) && 
                mkdir -p "${livePath}" && 
                npx -y esbuild src/main.tsx --bundle --outfile="${livePath}/main.js" --platform=node --external:obsidian --external:electron --format=cjs --loader:.tsx=tsx --loader:.ts=ts && 
                cp "${sourceManifestPath}" "${liveManifestPath}" && 
                (cp "${path.join(pluginPath, 'styles.css')}" "${path.join(livePath, 'styles.css')}" || true) &&
                (obsidian eval code="app.plugins.enablePlugin('metascan-pro')" || true) && 
                (obsidian plugin:reload id="metascan-pro" || true)
            `.trim().replace(/\n/g, '');

            const child = spawn('/bin/zsh', ['-l', '-c', cmd], {
                cwd: pluginPath,
                env: { ...process.env, TERM: 'xterm-256color' },
                detached: true
            });

            let logBuffer = "";
            child.stdout.on('data', d => logBuffer += d.toString());
            child.stderr.on('data', d => logBuffer += d.toString());

            child.on('close', (code) => {
                setIsDeploying(false);
                if (code === 0) {
                    setStatus("Deployment Successful (Live)");
                } else {
                    console.error("Deploy Error:", logBuffer);
                    setStatus(`Deployment Failed (Code ${code})`);
                }
            });
        };

        const handlePublish = async () => {
            if (!repoName || !ghToken) {
                setStatus("MISSING REPO_NAME OR TOKEN");
                return;
            }
            setIsPublishing(true);
            setStatus("Authenticating with GitHub...");

            try {
                // 1. Get GitHub User
                const userRes = await fetch('https://api.github.com/user', {
                    headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
                });
                if (!userRes.ok) throw new Error("GitHub Auth Failed");
                const userData = await userRes.json();
                const login = userData.login;
                
                setStatus(`Found user: ${login}...`);

                const path = require('path');
                const fs = require('fs');
                const vaultPath = dc.app.vault.adapter.getBasePath();
                const sourceManifestPath = path.resolve(vaultPath, "_RESOURCES/PLUGINS/metascan-pro/manifest.json");
                const liveManifestPath = path.resolve(vaultPath, ".obsidian/plugins/metascan-pro/manifest.json");
                const pluginPath = path.dirname(sourceManifestPath);
                const livePath = path.dirname(liveManifestPath);
                const mainJsPath = path.join(livePath, 'main.js');

                if (!fs.existsSync(mainJsPath)) {
                    setStatus("ERROR: main.js missing. Click 'COMPILE & DEPLOY' first!");
                    setIsPublishing(false);
                    return;
                }

                // 2. Check if Repository Exists
                const checkRes = await fetch(`https://api.github.com/repos/${login}/${repoName}`, {
                    headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
                });

                if (checkRes.ok) {
                    setStatus("Repository detected. Syncing...");
                    console.log(`Metascan: Repository ${login}/${repoName} exists.`);
                } else if (checkRes.status === 404) {
                    setStatus("Creating repository...");
                    const createRes = await fetch('https://api.github.com/user/repos', {
                        method: 'POST',
                        headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: repoName, description: "Obsidian plugin finalized via Metascan Deployment Hub.", private: false })
                    });
                    if (!createRes.ok) {
                        const err = await createRes.json();
                        throw new Error(`Repo creation failed: ${err.message}`);
                    }
                    setStatus("Repository created successfully!");
                } else {
                    throw new Error(`GitHub check failed: ${checkRes.status}`);
                }

                // 3. Git Push & Release
                const authedUrl = `https://${ghToken}@github.com/${login}/${repoName}.git`;
                
                setStatus("Finalizing Sync...");

                // NEW: Use git commit BEFORE git branch -M main (safer on fresh repos)
                const cmd = `
                    git init && 
                    git add -A && 
                    (git commit -m "Zero-Config Factory Sync [v${Date.now()}]" || true) && 
                    git branch -M main && 
                    (git remote add origin "${authedUrl}" 2>/dev/null || git remote set-url origin "${authedUrl}") && 
                    git push -u origin main --force
                `.trim().replace(/\n/g, '');

                console.log(`Metascan Executing Git Sync in: ${pluginPath}`);

                const child = spawn('/bin/zsh', ['-l', '-c', cmd], {
                    cwd: pluginPath,
                    env: { ...process.env },
                    detached: true
                });

                let logBuffer = "";
                child.stdout.on('data', d => logBuffer += d.toString());
                child.stderr.on('data', d => {
                    logBuffer += d.toString();
                    console.warn("Git Sync Stderr:", d.toString());
                });

                child.on('close', async (code) => {
                    if (code !== 0) {
                        console.error("Git Sync Final Error Log:", logBuffer);
                        setStatus(`PUSH FAILED (Code ${code})`);
                        setIsPublishing(false);
                        return;
                    }

                    setStatus("Creating GitHub Release...");
                    try {
                        const fs = require('fs');
                        const manifestContent = fs.readFileSync(sourceManifestPath, 'utf8');
                        const manifest = JSON.parse(manifestContent);
                        const tag = `v${manifest.version}`;
                        const req = window.requestUrl || dc.app.requestUrl;

                        // 1. Check for Existing Release by Tag
                        setStatus(`Checking ${tag}...`);
                        const relCheckRes = await req({
                            url: `https://api.github.com/repos/${login}/${repoName}/releases/tags/${tag}`,
                            headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' },
                            throw: false
                        });

                        let release;
                        if (relCheckRes.status === 200) {
                            release = relCheckRes.json;
                            setStatus("Release detected. Updating assets...");
                        } else {
                            setStatus("Creating new release...");
                            const createRes = await req({
                                url: `https://api.github.com/repos/${login}/${repoName}/releases`,
                                method: 'POST',
                                headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                                body: JSON.stringify({ tag_name: tag, name: `Metascan Pro ${tag}`, body: "Automated Release via Metascan Factory Hub.", draft: false, prerelease: false })
                            });
                            release = createRes.json;
                        }

                        if (!release || !release.upload_url) throw new Error("Could not provision release.");
                        const uploadUrl = release.upload_url.split('{')[0];

                        // 2. Target Asset Purge (Only what we will replace)
                        const targetNames = ['main.js', 'manifest.json', 'styles.css'];
                        if (release.assets && release.assets.length > 0) {
                            setStatus("Cleaning target assets...");
                            for (const asset of release.assets) {
                                if (targetNames.includes(asset.name)) {
                                    await req({
                                        url: `https://api.github.com/repos/${login}/${repoName}/releases/assets/${asset.id}`,
                                        method: 'DELETE',
                                        headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
                                    });
                                }
                            }
                            // Small delay for GitHub propagation
                            await new Promise(r => setTimeout(r, 1000));
                        }

                        // 3. Upload Assets
                        const targetAssets = [
                            { name: 'main.js', path: path.join(livePath, 'main.js') },
                            { name: 'manifest.json', path: sourceManifestPath },
                            { name: 'styles.css', path: path.join(pluginPath, 'styles.css') }
                        ];

                        for (const asset of targetAssets) {
                            if (fs.existsSync(asset.path)) {
                                setStatus(`Uploading ${asset.name}...`);
                                const fileData = fs.readFileSync(asset.path);
                                const upRes = await req({
                                    url: `${uploadUrl}?name=${asset.name}`,
                                    method: 'POST',
                                    headers: { 'Authorization': `token ${ghToken}`, 'Content-Type': 'application/octet-stream' },
                                    body: new Uint8Array(fileData).buffer
                                });
                                if (upRes.status !== 201) console.warn(`Failed to upload ${asset.name}: ${upRes.status}`);
                            }
                        }

                        setIsPublishing(false);
                        setStatus(`PUBLISHED: github.com/${login}/${repoName} (${tag})`);
                        setGithubUrl(`https://github.com/${login}/${repoName}`);

                    } catch (e) {
                        console.error("Release Error:", e);
                        setStatus(`SYNC OK, RELEASE FAILED: ${e.message}`);
                        setIsPublishing(false);
                    }
                });
            } catch (e) {
                console.error("Publish Error:", e);
                setStatus(`ERROR: ${e.message}`);
                setIsPublishing(false);
            }
        };

        return (
            <div
                onMouseLeave={() => { if(!showSettings) setIsVisible(false); }}
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10000,
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Hover Trigger */}
                <div
                    onMouseEnter={() => setIsVisible(true)}
                    style={{ height: '35px', width: '100%', position: 'absolute', bottom: '-35px', zIndex: -1, cursor: 'ns-resize' }}
                />

                {/* Toolbar */}
                <div style={{
                    padding: '12px 24px', background: 'rgba(10, 10, 15, 0.98)', borderBottom: `1px solid ${TOKENS.border}`,
                    backdropFilter: 'blur(30px)', display: 'flex', flexDirection: 'column', gap: '15px',
                    boxShadow: '0 15px 45px rgba(0,0,0,0.6)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Icon name="boxes" size={16} color={TOKENS.primary} />
                            <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>METASCAN FACTORY HUB <span style={{ color: TOKENS.accentGold, opacity: 0.8, marginLeft: '8px', fontSize: '10px' }}>v{currentVersion}</span></span>
                            <span style={{ fontSize: '10px', color: (isDeploying || isPublishing) ? TOKENS.accentGold : TOKENS.textDim, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'JetBrains Mono' }}>
                                {status}
                            </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button onClick={handleVisitRepo} disabled={!githubUrl} style={{ ...STYLES.btn(false, true), width: '36px', height: '36px', padding: 0, opacity: githubUrl ? 1 : 0.2 }}>
                                <Icon name="globe" size={14} />
                            </button>
                            <button onClick={() => setShowSettings(!showSettings)} style={{ ...STYLES.btn(showSettings, true), width: '36px', height: '36px', padding: 0 }}>
                                <Icon name="settings" size={14} />
                            </button>
                            <button 
                                onClick={handleDeploy} 
                                disabled={isDeploying || isPublishing}
                                style={{ ...STYLES.btn(isDeploying), padding: '8px 24px' }}
                            >
                                {isDeploying ? <Icon name="loader" size={14} /> : <Icon name="zap" size={14} />}
                                {isDeploying ? "DEPLOYING..." : "COMPILE & DEPLOY"}
                            </button>
                            <button 
                                onClick={handlePublish} 
                                disabled={isPublishing || isDeploying}
                                style={{ ...STYLES.btn(isPublishing), padding: '8px 24px', background: TOKENS.accentPink }}
                            >
                                {isPublishing ? <Icon name="loader" size={14} /> : <Icon name="github" size={14} />}
                                {isPublishing ? "PUBLISHING..." : "ONE-CLICK PUBLISH"}
                            </button>
                        </div>
                    </div>

                    {showSettings && (
                        <div style={{ 
                            padding: '20px', borderTop: `1px solid ${TOKENS.border}`, display: 'flex', flexDirection: 'column', gap: '15px',
                            background: 'rgba(255,255,255,0.02)', borderRadius: '12px'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.5 }}>Repository Name</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="text" value={repoName} onChange={(e) => setRepoName(e.target.value)}
                                            placeholder="e.g. metascan-pro"
                                            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${TOKENS.border}`, color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.5 }}>GitHub Token</label>
                                    <input 
                                        type="password" value={ghToken} onChange={(e) => updateToken(e.target.value)}
                                        style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${TOKENS.border}`, color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };



    const App = () => {
        const [isInspecting, setIsInspecting] = useState(false);
        const [node, setNode] = useState(null);
        const [logs, setLogs] = useState(["v10_HOTFIX_ACTIVE"]);
        const [copied, setCopied] = useState(false);
        
        const containerRef = useRef(null);
        const overlayRef = useRef(null);
        const highlighterRef = useRef(null);
        const tooltipRef = useRef(null);
        const stateRefs = useRef({}).current;
        const isInspectingRef = useRef(false);
        useEffect(() => { isInspectingRef.current = isInspecting; }, [isInspecting]);

        // --- Cleanup plaintext tokens on first load ---
        useEffect(() => {
            if (localStorage.getItem('mp_gh_token')) {
                localStorage.removeItem('mp_gh_token');
                console.log("Metascan: Plaintext token wiped from localStorage.");
            }
        }, []);

        const addLog = useCallback((m) => setLogs(p => [m, ...p].slice(0, 10)), []);

        // --- Standard FullTab ---
        useEffect(() => {
            if (!containerRef.current) return;
            const target = document.querySelector(".workspace-leaf.mod-active .workspace-leaf-content");
            if (!target) return;
            const content = target.querySelector(".view-content") || target;
            const container = containerRef.current;
            stateRefs.placeholder = document.createElement("div");
            container.parentNode.insertBefore(stateRefs.placeholder, container);
            content.appendChild(container);
            content.style.position = "relative";
            Object.assign(container.style, { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: "9998", display: "flex", background: TOKENS.bg });
            return () => {
                if (stateRefs.placeholder?.parentNode) stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                container.removeAttribute("style");
            };
        }, []);

        const stopInspection = () => setIsInspecting(false);
        const startInspection = () => { setIsInspecting(true); addLog("SCANNER_ARMED"); };

        const handleCopy = () => {
            if (!node) return;
            navigator.clipboard.writeText(JSON.stringify(node, null, 2));
            setCopied(true);
            addLog("METADATA_COPIED");
            setTimeout(() => setCopied(false), 2000);
        };

        useEffect(() => {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, display: 'none', cursor: 'crosshair' });
            const highlight = document.createElement('div');
            Object.assign(highlight.style, { position: 'fixed', border: `2px solid ${TOKENS.primary}`, background: 'rgba(139,92,246,0.1)', zIndex: 999998, display: 'none', pointerEvents: 'none', borderRadius: '4px' });
            const tooltip = document.createElement('div');
            Object.assign(tooltip.style, { position: 'fixed', padding: '10px 16px', background: 'rgba(15,23,42,0.95)', border: `1px solid ${TOKENS.border}`, color: '#fff', borderRadius: '10px', fontSize: '11px', zIndex: 1000000, display: 'none', pointerEvents: 'none', fontFamily: 'JetBrains Mono' });
            document.body.appendChild(overlay); document.body.appendChild(highlight); document.body.appendChild(tooltip);

            const handleMove = (e) => {
                if (!isInspectingRef.current) return;
                overlay.style.pointerEvents = 'none';
                const t = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto';
                if (t && t !== overlay && t !== highlight && t !== tooltip) {
                    const r = t.getBoundingClientRect();
                    Object.assign(highlight.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
                    tooltip.innerHTML = `<span style="color:${TOKENS.accentPink}">${t.localName}</span><span style="color:${TOKENS.accentGold}">${t.id ? '#'+t.id:''}</span> <div style="font-size:9px; opacity:0.5">${Math.round(r.width)}×${Math.round(r.height)}</div>`;
                    Object.assign(tooltip.style, { display: 'block', top: `${e.clientY+20}px`, left: `${e.clientX+20}px` });
                }
            };

            const handleClick = (e) => {
                if (!isInspectingRef.current) return;
                e.preventDefault(); overlay.style.pointerEvents = 'none';
                const t = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = 'auto';
                if (t) {
                    const r = t.getBoundingClientRect();
                    setNode({ localName: t.localName, id: t.id, className: t.className, width: Math.round(r.width), height: Math.round(r.height), innerText: t.innerText?.substring(0, 300), attributes: Array.from(t.attributes).map(a => [a.name, a.value]).flat() });
                    addLog(`CAPTURED_${t.localName.toUpperCase()}`);
                }
                setIsInspecting(false);
            };

            overlay.addEventListener('mousemove', handleMove); overlay.addEventListener('click', handleClick);
            window.addEventListener('keydown', (e) => { if(e.key === 'Escape' && isInspectingRef.current) setIsInspecting(false); }, { capture: true });
            overlayRef.current = overlay; highlighterRef.current = highlight; tooltipRef.current = tooltip;
            return () => { 
                if (overlay && overlay.parentNode) document.body.removeChild(overlay); 
                if (highlight && highlight.parentNode) document.body.removeChild(highlight); 
                if (tooltip && tooltip.parentNode) document.body.removeChild(tooltip); 
            };
        }, []);

        useEffect(() => {
            if (overlayRef.current) overlayRef.current.style.display = isInspecting ? 'block' : 'none';
            if (highlighterRef.current && !isInspecting) highlighterRef.current.style.display = 'none';
            if (tooltipRef.current && !isInspecting) tooltipRef.current.style.display = 'none';
        }, [isInspecting]);

        return (
            <div ref={containerRef} id="metascan-v10-datacore" style={STYLES.main}>
                <PluginControlPanel folderPath={folderPath} />
                <aside style={STYLES.sidebar}>
                    <header style={STYLES.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: isInspecting ? TOKENS.primary : '#4ade80', boxShadow: '0 0 15px currentColor' }} />
                            <span style={{ fontSize: '11px', fontWeight: '900', color: TOKENS.primary, letterSpacing: '2px' }}>METASCAN PRO</span>
                        </div>
                    </header>
                    <div style={{ padding: '45px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <button onClick={isInspecting ? stopInspection : startInspection} style={STYLES.btn(isInspecting)}>
                            <Icon name={isInspecting ? "x-circle" : "mouse-pointer-2"} />
                            {isInspecting ? "DISARM" : "SELECT ELEMENT"}
                        </button>
                        <div style={STYLES.card}>
                            <div style={STYLES.cardTitle}><div><Icon name="activity" size={14} /> STREAM</div></div>
                            <div style={{ height: '350px', overflowY: 'auto' }}>
                                {logs.map((l, i) => <div key={i} style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', marginBottom: '8px', opacity: i === 0 ? 1 : 0.3 }}>{l}</div>)}
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={STYLES.content}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '56px', letterSpacing: '-3px' }}>Analysis Layer</h1>
                        <span style={{ fontSize: '10px', opacity: 0.2 }}>Hotfix v10</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '35px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '35px', minWidth: 0 }}>
                            <section style={STYLES.card}>
                                <div style={STYLES.cardTitle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="layout" size={14} /> DOM_SNAPSHOT</div>
                                    <button onClick={handleCopy} disabled={!node} style={STYLES.btn(false, true)}>
                                        <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "COPIED" : "COPY DOM"}
                                    </button>
                                </div>
                                {node ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
                                        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '14px', fontFamily: 'JetBrains Mono', wordBreak: 'break-all' }}>
                                            <span style={{ color: TOKENS.accentPink }}>&lt;{node.localName}</span> {node.id && <span><span style={{ color: TOKENS.accentGold }}>id</span>=<span style={{ color: TOKENS.accentGreen }}>"{node.id}"</span></span>} <span style={{ color: TOKENS.accentPink }}>&gt;</span>
                                        </div>
                                        <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '12px', opacity: 0.6, wordBreak: 'break-all', overflow: 'hidden', minHeight: '60px' }}>
                                            {node.innerText}
                                        </div>
                                    </div>
                                ) : <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>SIGNAL_AWAITING</div>}
                            </section>
                            <section style={{ ...STYLES.card, flex: 1 }}>
                                <div style={STYLES.cardTitle}><div><Icon name="code" size={14} /> DATA_TRACE</div></div>
                                <pre style={{ margin: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '25px', border: `1px solid ${TOKENS.border}`, color: TOKENS.accentGreen, fontSize: '11px', overflowX: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {node ? JSON.stringify(node, null, 2) : "// Protocol trace standby."}
                                </pre>
                            </section>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                            <section style={{ ...STYLES.card, textAlign: 'center' }}>
                                <div style={STYLES.cardTitle}><Icon name="maximize-2" size={12} /> WIDTH</div>
                                <div style={STYLES.metricLabel}>{node ? node.width : "---"}</div>
                            </section>
                            <section style={{ ...STYLES.card, textAlign: 'center' }}>
                                <div style={STYLES.cardTitle}><Icon name="minimize-2" size={12} /> HEIGHT</div>
                                <div style={STYLES.metricLabel}>{node ? node.height : "---"}</div>
                            </section>
                            <section style={{ ...STYLES.card, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="crosshair" size={100} color={TOKENS.primary} style={{ opacity: node ? 1 : 0.05 }} />
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        );
    };
    return <App />;
}
return { View };
