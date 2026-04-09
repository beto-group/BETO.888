const { useState, useEffect, useRef } = dc;

const KeychainManagerComp = ({
    styles: STYLES,
    ControlsMenu,
    onCodeReloadRequest,
    isFullTab,
    onToggleFullTab,
    folderPath
}) => {
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;

    // API & State
    const [status, setStatus] = useState('Initializing Native API...');
    const [isNativeApiReady, setIsNativeApiReady] = useState(false);
    const [secrets, setSecrets] = useState([]);
    const [revealedSecret, setRevealedSecret] = useState(null);
    const [isSealing, setIsSealing] = useState(false);
    const [unsecuredKeys, setUnsecuredKeys] = useState([]);
    const [failedMigrations, setFailedMigrations] = useState([]);

    // Form Inputs
    const [keyName, setKeyName] = useState('');
    const [plainText, setPlainText] = useState('');

    const VERSION = "v2.0.0";

    // --- Data Management (v2.1.0 Architectural Guardrails) ---
    const scanForUnsecured = () => {
        const sensitivePatterns = ['token', 'key', 'secret', 'password', 'auth', 'cred', 'api'];
        const discovered = [];
        const ignored = [
            'antigravity_debug_config', 
            'antigravity_usage_stats_v1', 
            'antigravity_accounts_v2',
            '34aa5b4e7e7b6cb7-secrets-encrypted' // Known Large Plugin Blob (Ignore to avoid Revert Loops)
        ];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || ignored.includes(key)) continue;

            // Guard: Size Limit (Native Keychains are for small secrets, not 4MB blobs)
            const val = localStorage.getItem(key);
            if (val && val.length > 512000) continue; 

            const lowerKey = key.toLowerCase();
            if (sensitivePatterns.some(p => lowerKey.includes(p))) {
                discovered.push(key);
            }
        }
        setUnsecuredKeys(discovered);
    };

    const loadSecrets = async () => {
        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
            if (!storage) return;

            let keys = [];
            if (typeof storage.listSecrets === 'function') {
                keys = await storage.listSecrets();
            } else if (storage.secrets) {
                keys = Object.keys(storage.secrets);
            }

            setSecrets(keys.map(k => ({ id: k })));
            setIsNativeApiReady(typeof storage.setSecret === 'function');
            setStatus(typeof storage.setSecret === 'function' ? "SECURE MODE" : "LEGACY MODE");

            scanForUnsecured();
        } catch (e) {
            console.error("[Keychain] Load failed", e);
            setStatus("API ERROR");
        }
    };

    useEffect(() => { loadSecrets(); }, []);

    // --- Actions (Production v2.0.0) ---
    const handleMigrateAll = async () => {
        if (!confirm(`Secure all ${unsecuredKeys.length} items? This will move them to the native keychain and remove them from plain-text storage.`)) return;
        
        setStatus(`MIGRATING_BATCH...`);
        setFailedMigrations([]);
        const failures = [];
        
        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
            if (typeof storage.setSecret !== 'function') return;

            // Sync Re-crawl (v2.0.0)
            const targetKeys = [];
            const sensitivePatterns = ['token', 'key', 'secret', 'password', 'auth', 'cred', 'api'];
            const ignored = ['antigravity_debug_config', 'antigravity_usage_stats_v1', 'antigravity_accounts_v2'];
            
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && !ignored.includes(k) && sensitivePatterns.some(p => k.toLowerCase().includes(p))) {
                    targetKeys.push(k);
                }
            }

            for (const key of targetKeys) {
                try {
                    let val = localStorage.getItem(key);
                    if (val === null) val = window.localStorage[key];
                    if (val === null) val = localStorage[key];
                    
                    if (val !== null && val !== undefined) {
                        const safeKey = key.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);
                        const stringVal = String(val);
                        await storage.setSecret(safeKey, stringVal);
                        localStorage.removeItem(key);
                    } else {
                        failures.push({ key, error: "Native storage returned null/undefined for this key." });
                    }
                } catch (err) {
                    failures.push({ key, error: err.message });
                }
            }
            
            await loadSecrets();
            setFailedMigrations(failures);
            setStatus(failures.length > 0 ? "PARTIAL_ERROR" : "ALL_SECURED");
        } catch (e) {
            console.error("Critical Migration Error", e);
            setStatus("BATCH_FAILED");
        }
    };

    const handleMigrate = async (key) => {
        setStatus(`Migrating ${key}...`);
        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
            if (typeof storage.setSecret === 'function') {
                let val = localStorage.getItem(key);
                if (val === null) val = window.localStorage[key];
                if (val === null) val = localStorage[key];

                if (val !== null && val !== undefined) {
                    const safeKey = key.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);
                    const stringVal = String(val);
                    await storage.setSecret(safeKey, stringVal);
                    localStorage.removeItem(key);
                    await loadSecrets();
                } else {
                    setFailedMigrations([{ key, error: "Native storage returned null/undefined." }]);
                }
            }
        } catch (e) {
            setFailedMigrations([{ key, error: e.message }]);
            setStatus("MIGRATION_FAILED");
        }
    };

    const handleSetSecret = async () => {
        const safeKey = keyName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);
        setIsSealing(true);
        setStatus("Securing Record...");

        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
            if (typeof storage.setSecret === 'function') {
                await storage.setSecret(safeKey, plainText);
            } else if (storage.secrets) {
                storage.secrets[keyName] = plainText;
                if (storage.saveSecrets) await storage.saveSecrets();
                else if (storage.save) await storage.save();
            }

            setKeyName('');
            setPlainText('');
            await loadSecrets();
        } catch (err) {
            setStatus("SAVE FAILED");
            setFailedMigrations([{ key: safeKey, error: err.message }]);
        } finally {
            setIsSealing(false);
        }
    };

    const handleGetSecret = async (id) => {
        setRevealedSecret({ id, loading: true });
        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
            let val = null;
            if (typeof storage.getSecret === 'function') { val = await storage.getSecret(id); }
            else if (storage.secrets) { val = storage.secrets[id]; }
            setRevealedSecret({ id, value: val, loading: false });
        } catch (err) {
            setRevealedSecret({ id, error: err.message, loading: false });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(`Permanently delete "${id}"?`)) return;
        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
            if (typeof storage.deleteSecret === 'function') { await storage.deleteSecret(id); }
            else if (storage.secrets) {
                delete storage.secrets[id];
                if (storage.saveSecrets) await storage.saveSecrets();
                else if (storage.save) await storage.save();
            }
            await loadSecrets();
            if (revealedSecret?.id === id) setRevealedSecret(null);
        } catch (e) { }
    };

    // --- Views ---
    if (!isFullTab) {
        return (
            <div style={STYLES.compactWrapper} onClick={onToggleFullTab}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <dc.Icon icon="shield" style={{ width: 18, color: unsecuredKeys.length > 0 ? '#f87171' : '#4ade80' }} />
                    <dc.Icon icon="key" style={{ width: 18, color: '#4ade80' }} />
                    <span style={STYLES.compactText}>Vault Keyring • {secrets.length} {unsecuredKeys.length > 0 && `(+${unsecuredKeys.length} Unsecured)`}</span>
                </div>
                <div style={STYLES.badge(status)}>{status}</div>
            </div>
        );
    }

    const isButtonDisabled = isSealing || !keyName || !plainText;

    return (
        <div style={STYLES.fullTabWrapper}>
            <div style={{ position: 'absolute', top: 30, right: 30, zIndex: 100 }}>
                <ControlsMenu onReload={onCodeReloadRequest} onToggle={onToggleFullTab} styles={STYLES} />
            </div>

            <div style={STYLES.container}>
                <div style={STYLES.headerData}>
                    <h1 style={STYLES.title}>Native Keychain</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px' }}>
                        <div style={STYLES.subtitle}>Obsidian Native SecretStorage API // {VERSION}</div>
                        <div style={STYLES.badge(status)}>{status}</div>
                    </div>
                </div>

                {unsecuredKeys.length > 0 && (
                    <div style={{ ...STYLES.alert, background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <dc.Icon icon="alert-triangle" style={{ width: 28, color: '#f87171' }} />
                            <div style={{ flex: 1 }}>
                                <strong style={{ color: '#f87171', fontSize: '1.2rem' }}>Potential Security Leak:</strong>
                                <div style={{ opacity: 0.7, fontSize: '0.95rem' }}>Found {unsecuredKeys.length} sensitive item(s) in plain-text storage.</div>
                            </div>
                            <button style={STYLES.buttonPrimarySmall} onClick={handleMigrateAll}>
                                Secure All Records
                            </button>
                        </div>
                        
                        <div style={STYLES.secretList}>
                            {unsecuredKeys.slice(0, isFullTab ? 20 : 5).map(k => (
                                <button key={k} style={{ ...STYLES.buttonSecondary, padding: '8px 16px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }} onClick={() => handleMigrate(k)}>
                                    {k}
                                </button>
                            ))}
                            {unsecuredKeys.length > (isFullTab ? 20 : 5) && (
                                <div style={{ fontSize: '0.75rem', opacity: 0.5, padding: '8px' }}>+ {unsecuredKeys.length - (isFullTab ? 20 : 5)} more items...</div>
                            )}
                        </div>
                    </div>
                )}

                {failedMigrations.length > 0 && (
                    <div style={{ ...STYLES.alert, background: '#1c1010', borderColor: '#f87171', color: '#fca5a5' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <dc.Icon icon="bug" size={18} /> OS-Level Rejection Trace:
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {failedMigrations.map((f, i) => (
                                <div key={i}>• <b>{f.key}</b>: {f.error}</div>
                            ))}
                        </div>
                        <button onClick={() => setFailedMigrations([])} style={{ ...STYLES.buttonSecondary, fontSize: '0.6rem', padding: '4px 10px', marginTop: '10px' }}>DISMISS_TRACE</button>
                    </div>
                )}

                <div style={STYLES.mainGrid}>
                    <div style={STYLES.glassCard}>
                        <div style={STYLES.cardHeader}>
                            <span style={STYLES.cardLabel}>Vault Records</span>
                            <span style={{ opacity: 0.4, fontSize: '13px', fontWeight: '800' }}>{secrets.length} ENTRIES</span>
                        </div>
                        <div style={{ maxHeight: '650px', overflowY: 'auto' }}>
                            {secrets.map(s => (
                                <div key={s.id} style={STYLES.listItem}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <dc.Icon icon="key" style={{ width: 18, opacity: 0.5, color: '#4ade80' }} />
                                        <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#fff' }}>{s.id}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button style={STYLES.buttonSecondary} onClick={() => handleGetSecret(s.id)}>Unlock</button>
                                        <button style={STYLES.iconButton} onClick={() => handleDelete(s.id)}><dc.Icon icon="trash-2" style={{ width: 18 }} /></button>
                                    </div>
                                </div>
                            ))}
                            {secrets.length === 0 && <div style={{ padding: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '1.2rem' }}>No records found in secure storage.</div>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div style={STYLES.glassCard}>
                            <div style={STYLES.cardHeader}><span style={STYLES.cardLabel}>Register New Record</span></div>
                            <div style={STYLES.inputGroup}>
                                <div>
                                    <label style={STYLES.inputLabel}>Identity / Key Name</label>
                                    <input style={STYLES.input} placeholder="Service or Token Name" value={keyName} onChange={e => setKeyName(e.target.value)} />
                                </div>
                                <div>
                                    <label style={STYLES.inputLabel}>Secret Value</label>
                                    <input style={STYLES.input} type="password" placeholder="Paste sensitive data here..." value={plainText} onChange={e => setPlainText(e.target.value)} />
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                    <button style={STYLES.buttonPrimary(isButtonDisabled)} onClick={handleSetSecret} disabled={isButtonDisabled}>{isSealing ? 'Processing...' : 'Seal & Store to Keychain'}</button>
                                </div>
                            </div>
                        </div>

                        {revealedSecret && (
                            <div style={{ ...STYLES.glassCard, transition: 'all 0.5s ease' }}>
                                <div style={STYLES.cardHeader}>
                                    <span style={{ ...STYLES.cardLabel, color: revealedSecret.error ? '#f87171' : '#4ade80' }}>{revealedSecret.loading ? 'Decrypting...' : 'Credential Decoded'}</span>
                                    {!revealedSecret.loading && <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setRevealedSecret(null)}><dc.Icon icon="x" style={{ width: 20 }} /></button>}
                                </div>
                                <div style={STYLES.resultPanel}>
                                    {!revealedSecret.loading && !revealedSecret.error && <div style={STYLES.resultCode}>{revealedSecret.value}</div>}
                                    {revealedSecret.error && <div style={{ color: '#f87171', fontSize: '1rem', fontWeight: '600' }}>Decryption Error: {revealedSecret.error}</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

return { KeychainManager: KeychainManagerComp };
