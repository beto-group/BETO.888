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

    // Form Inputs
    const [keyName, setKeyName] = useState('');
    const [plainText, setPlainText] = useState('');

    // --- Data Management (Native API v1.11.4) ---
    const scanForUnsecured = () => {
        const sensitivePatterns = ['token', 'key', 'secret', 'password', 'auth', 'cred', 'api'];
        const discovered = [];

        // Exclude system/internal keys that aren't secrets
        const ignored = ['antigravity_debug_config', 'antigravity_usage_stats_v1', 'antigravity_accounts_v2'];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (ignored.includes(key)) continue;

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

            // Use Official listSecrets() if available, fallback to manual keys
            let keys = [];
            if (typeof storage.listSecrets === 'function') {
                keys = await storage.listSecrets();
            } else if (storage.secrets) {
                keys = Object.keys(storage.secrets);
            }

            setSecrets(keys.map(k => ({ id: k })));
            setIsNativeApiReady(typeof storage.setSecret === 'function');
            setStatus(typeof storage.setSecret === 'function' ? "SECURE MODE" : "LEGACY MODE");

            // Also scan for unsecured items
            scanForUnsecured();

        } catch (e) {
            console.error("[Keychain] Load failed", e);
            setStatus("API ERROR");
        }
    };

    useEffect(() => {
        loadSecrets();
    }, []);

    // --- Actions ---
    const handleMigrate = async (key) => {
        const val = localStorage.getItem(key);
        if (!val) return;

        setStatus(`Migrating ${key}...`);
        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);
            if (typeof storage.setSecret === 'function') {
                await storage.setSecret(key, val);
                localStorage.removeItem(key);
                await loadSecrets();
            }
        } catch (e) {
            console.error("Migration failed", e);
            setStatus("MIGRATION FAILED");
        }
    };

    const handleSetSecret = async () => {
        const safeKey = keyName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        setIsSealing(true);
        setStatus("Securing Record...");

        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);

            if (typeof storage.setSecret === 'function') {
                // Official Native API handles encryption via OS (DPAPI/Keychain)
                await storage.setSecret(safeKey, plainText);
            } else if (storage.secrets) {
                // Legacy fallback
                storage.secrets[keyName] = plainText;
                if (storage.saveSecrets) await storage.saveSecrets();
                else if (storage.save) await storage.save();
            }

            setKeyName('');
            setPlainText('');
            await loadSecrets();
        } catch (err) {
            console.error("[Keychain] Set Error:", err);
            setStatus("SAVE FAILED");
        } finally {
            setIsSealing(false);
        }
    };

    const handleGetSecret = async (id) => {
        setRevealedSecret({ id, loading: true });
        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);

            let val = null;
            if (typeof storage.getSecret === 'function') {
                val = await storage.getSecret(id);
            } else if (storage.secrets) {
                val = storage.secrets[id];
            }

            setRevealedSecret({ id, value: val, loading: false });
        } catch (err) {
            console.error("[Keychain] Get Error:", err);
            setRevealedSecret({ id, error: err.message, loading: false });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(`Permanently delete "${id}"?`)) return;
        try {
            const storage = dc.app.secretStorage || (window.app && window.app.secretStorage);

            if (typeof storage.deleteSecret === 'function') {
                await storage.deleteSecret(id);
            } else if (storage.secrets) {
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
                        <div style={STYLES.subtitle}>Obsidian v1.11.4 Native SecretStorage API</div>
                        <div style={STYLES.badge(status)}>{status}</div>
                    </div>
                </div>

                {status === "SECURE MODE" && (
                    <div style={STYLES.alert}>
                        <dc.Icon icon="check-circle" style={{ width: 28, color: '#4ade80' }} />
                        <div>
                            <strong>Active OS Protection:</strong> Using Obsidian's <code>SecretStorage</code>. Secrets are protected via <b>DPAPI (Windows)</b> or <b>Keychain (macOS)</b>. Only your logon credentials can unlock these.
                        </div>
                    </div>
                )}

                {unsecuredKeys.length > 0 && (
                    <div style={{ ...STYLES.alert, background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        <dc.Icon icon="alert-triangle" style={{ width: 28, color: '#f87171' }} />
                        <div style={{ flex: 1 }}>
                            <strong>Unsecured Secrets Detected:</strong> Found {unsecuredKeys.length} potentially sensitive item(s) in plain-text storage.
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {unsecuredKeys.map(k => (
                                <button key={k} style={{ ...STYLES.buttonSecondary, borderColor: '#f87171', color: '#f87171' }} onClick={() => handleMigrate(k)}>
                                    Secure {k}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={STYLES.mainGrid}>
                    {/* Left: Records */}
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
                                        <button style={STYLES.iconButton} onClick={() => handleDelete(s.id)}>
                                            <dc.Icon icon="trash-2" style={{ width: 18 }} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {secrets.length === 0 && (
                                <div style={{ padding: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '1.2rem' }}>
                                    No records found in secure storage.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                        {/* Creation Form - ULTRA VISIBILITY */}
                        <div style={STYLES.glassCard}>
                            <div style={STYLES.cardHeader}>
                                <span style={STYLES.cardLabel}>Register New Record</span>
                            </div>
                            <div style={STYLES.inputGroup}>
                                <div>
                                    <label style={STYLES.inputLabel}>Identity / Key Name</label>
                                    <input
                                        style={STYLES.input}
                                        placeholder="Service or Token Name"
                                        value={keyName}
                                        onChange={e => setKeyName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={STYLES.inputLabel}>Secret Value</label>
                                    <input
                                        style={STYLES.input}
                                        type="password"
                                        placeholder="Paste sensitive data here..."
                                        value={plainText}
                                        onChange={e => setPlainText(e.target.value)}
                                    />
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                    <button
                                        style={STYLES.buttonPrimary(isButtonDisabled)}
                                        onClick={handleSetSecret}
                                        disabled={isButtonDisabled}
                                    >
                                        {isSealing ? 'Processing...' : 'Seal & Store to Keychain'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Result Display */}
                        {revealedSecret && (
                            <div style={{ ...STYLES.glassCard, transition: 'all 0.5s ease' }}>
                                <div style={STYLES.cardHeader}>
                                    <span style={{ ...STYLES.cardLabel, color: revealedSecret.error ? '#f87171' : '#4ade80' }}>
                                        {revealedSecret.loading ? 'Decrypting...' : 'Credential Decoded'}
                                    </span>
                                    {!revealedSecret.loading && (
                                        <button
                                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                                            onClick={() => setRevealedSecret(null)}
                                        >
                                            <dc.Icon icon="x" style={{ width: 20 }} />
                                        </button>
                                    )}
                                </div>
                                <div style={STYLES.resultPanel}>
                                    {!revealedSecret.loading && !revealedSecret.error && (
                                        <div style={STYLES.resultCode}>{revealedSecret.value}</div>
                                    )}
                                    {revealedSecret.error && (
                                        <div style={{ color: '#f87171', fontSize: '1rem', fontWeight: '600' }}>
                                            Decryption Error: {revealedSecret.error}
                                        </div>
                                    )}
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
