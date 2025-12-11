


# ViewComponent

```jsx
const { useState, useEffect } = dc;
const { h, Fragment } = dc.preact;
const child_process = require('child_process');

// --- Constants ---
// Removed hardcoded constants to allow dynamic input

// --- Theme ---
const THEME = {
    background: '#000000',
    backgroundAlt: '#121212',
    border: '#2A2A2A',
    accent: '#A78BFA', // Soft Purple
    accentDim: 'rgba(167, 139, 250, 0.08)',
    text: '#E0E0E0',
    textMuted: '#757575',
    error: '#EF4444',
    success: '#A78BFA'
};

function SecureKeychain() {
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    
    // State for inputs
    const [serviceName, setServiceName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [inputPassword, setInputPassword] = useState('');
    const [forcePrompt, setForcePrompt] = useState(false);
    
    // State for retrieved data
    const [keyExists, setKeyExists] = useState(false);
    const [retrievedPassword, setRetrievedPassword] = useState(null);

    // Helper to run shell commands
    const runCommand = (command) => {
        return new Promise((resolve, reject) => {
            child_process.exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject({ error, stderr });
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    };

    // Open Keychain Access App
    const openKeychainApp = () => {
        runCommand('open -a "Keychain Access"');
    };

    // 1. Check Status (Does key exist?)
    const checkStatus = async () => {
        if (!serviceName || !accountName) {
            setStatus('error');
            setMessage('Service Name and Account Name are required.');
            return;
        }

        setStatus('loading');
        setMessage(`Checking Keychain for ${serviceName}...`);
        setRetrievedPassword(null); // Reset revealed password on check
        
        try {
            // Without -w, it returns attributes. This confirms existence without necessarily prompting for the secret.
            await runCommand(`security find-generic-password -a "${accountName}" -s "${serviceName}"`);
            setKeyExists(true);
            setStatus('success');
            setMessage('Item found in Keychain. Click REVEAL to retrieve the secret.');
        } catch (e) {
            setKeyExists(false);
            // Exit code 44 means "The specified item could not be found"
            if (e.stderr && e.stderr.includes('The specified item could not be found')) {
                 setStatus('idle');
                 setMessage('No key found for this Service/Account combination.');
            } else {
                setStatus('error');
                setMessage('Error: ' + (e.stderr || e.error.message));
            }
        }
    };

    // 2. Reveal Secret (Actually fetch the password)
    const revealPassword = async () => {
        setStatus('loading');
        setMessage('Requesting secret from macOS (System Prompt may appear)...');
        try {
            // -w returns the password. This is the operation that triggers the prompt if ACLs require it.
            const pass = await runCommand(`security find-generic-password -a "${accountName}" -s "${serviceName}" -w`);
            setRetrievedPassword(pass);
            setStatus('success');
            setMessage('Secret retrieved successfully from secure storage.');
        } catch (e) {
            setStatus('error');
            if (e.stderr && e.stderr.includes('User interaction is not allowed')) {
                setMessage('Access denied: User cancelled the prompt.');
            } else {
                setMessage('Error retrieving secret: ' + (e.stderr || e.error.message));
            }
        }
    };

    // 3. Save to Keychain
    const savePassword = async () => {
        if (!inputPassword || !serviceName || !accountName) {
            setStatus('error');
            setMessage('All fields are required to save.');
            return;
        }
        setStatus('loading');
        setMessage('Encrypting and saving to Keychain...');
        try {
            // -U updates the item if it already exists
            // -T "" clears the list of trusted applications, forcing a prompt on next access
            const accessFlag = forcePrompt ? '-T ""' : ''; 
            const safePassword = inputPassword.replace(/"/g, '\\"');
            
            // We first delete to ensure the access flags are reset if we are changing modes
            try { await runCommand(`security delete-generic-password -a "${accountName}" -s "${serviceName}"`); } catch(e) {}

            await runCommand(`security add-generic-password -a "${accountName}" -s "${serviceName}" -w "${safePassword}" ${accessFlag} -U`);
            
            setStatus('success');
            setMessage('Key securely saved to macOS Keychain.');
            setKeyExists(true);
            setRetrievedPassword(null); // Don't show it immediately, force retrieval
            setInputPassword(''); // Clear input for security
        } catch (e) {
            setStatus('error');
            setMessage('Failed to save: ' + (e.stderr || e.error.message));
        }
    };

    // 4. Delete from Keychain
    const deletePassword = async () => {
        if (!confirm(`Are you sure you want to delete the key for "${serviceName}"? This cannot be undone.`)) return;
        
        setStatus('loading');
        try {
            await runCommand(`security delete-generic-password -a "${accountName}" -s "${serviceName}"`);
            setKeyExists(false);
            setRetrievedPassword(null);
            setStatus('success');
            setMessage('Key removed from Keychain.');
        } catch (e) {
            setStatus('error');
            setMessage('Failed to delete: ' + (e.stderr || e.error.message));
        }
    };

    // Initial load
    useEffect(() => {
        checkStatus();
    }, []);

    // --- Styles ---
    const styles = {
        container: {
            padding: '20px',
            backgroundColor: THEME.background,
            color: THEME.text,
            border: `1px solid ${THEME.border}`,
            borderRadius: '8px',
            fontFamily: 'monospace',
            maxWidth: '500px'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            borderBottom: `1px solid ${THEME.border}`,
            paddingBottom: '10px'
        },
        title: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: THEME.accent,
            textTransform: 'uppercase',
            letterSpacing: '1px'
        },
        statusBox: {
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: status === 'error' ? 'rgba(255, 68, 68, 0.1)' : THEME.backgroundAlt,
            border: `1px solid ${status === 'error' ? THEME.error : THEME.border}`,
            color: status === 'error' ? THEME.error : (status === 'success' ? THEME.success : THEME.textMuted),
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        inputGroup: {
            marginBottom: '15px'
        },
        label: {
            display: 'block',
            fontSize: '11px',
            color: THEME.textMuted,
            marginBottom: '6px',
            textTransform: 'uppercase'
        },
        inputWrapper: {
            display: 'flex',
            gap: '8px',
            flexDirection: 'column'
        },
        row: {
            display: 'flex',
            gap: '10px'
        },
        input: {
            flex: 1,
            backgroundColor: THEME.backgroundAlt,
            border: `1px solid ${THEME.border}`,
            color: THEME.text,
            padding: '8px 12px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            outline: 'none',
            fontSize: '12px'
        },
        button: {
            padding: '8px 16px',
            backgroundColor: THEME.accentDim,
            color: THEME.accent,
            border: `1px solid ${THEME.accent}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
            transition: 'all 0.2s',
            textAlign: 'center'
        },
        secondaryButton: {
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: THEME.text,
            border: `1px solid ${THEME.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            textAlign: 'center'
        },
        deleteButton: {
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: THEME.error,
            border: `1px solid ${THEME.error}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginTop: '10px'
        },
        keyDisplay: {
            marginTop: '20px',
            padding: '15px',
            backgroundColor: THEME.backgroundAlt,
            borderRadius: '6px',
            border: `1px dashed ${THEME.border}`
        },
        blur: {
            filter: 'blur(4px)',
            userSelect: 'none',
            transition: 'filter 0.2s'
        }
    };

    return h('div', { style: styles.container },
        // Header
        h('div', { style: styles.header },
            h(dc.Icon, { icon: 'lock', style: { width: '20px', height: '20px', color: THEME.accent } }),
            h('div', { style: styles.title }, 'Generic Keychain Tool'),
            h('div', { style: { flex: 1 } }),
            h('button', { 
                style: Object.assign({}, styles.secondaryButton, { fontSize: '10px', padding: '4px 8px' }),
                onClick: openKeychainApp
            }, 'OPEN KEYCHAIN APP')
        ),

        // Status Message
        h('div', { style: styles.statusBox },
            h(dc.Icon, { 
                icon: status === 'loading' ? 'loader-2' : (status === 'error' ? 'alert-triangle' : 'info'), 
                style: { width: '14px', height: '14px', animation: status === 'loading' ? 'spin 1s linear infinite' : 'none' } 
            }),
            h('span', null, message || 'Ready to interact with macOS Keychain')
        ),

        // Configuration Section
        h('div', { style: styles.inputGroup },
            h('label', { style: styles.label }, 'Keychain Item Details'),
            h('div', { style: styles.inputWrapper },
                h('div', { style: styles.row },
                    h('input', {
                        type: 'text',
                        style: styles.input,
                        placeholder: 'Service Name (e.g. BetoVPS)',
                        value: serviceName,
                        onInput: (e) => setServiceName(e.target.value)
                    }),
                    h('input', {
                        type: 'text',
                        style: styles.input,
                        placeholder: 'Account Name (e.g. GhostAdminKey)',
                        value: accountName,
                        onInput: (e) => setAccountName(e.target.value)
                    })
                ),
                h('button', { 
                    style: styles.secondaryButton,
                    onClick: checkStatus,
                    disabled: status === 'loading'
                }, 'CHECK IF EXISTS')
            )
        ),

        // Input Section
        h('div', { style: styles.inputGroup },
            h('label', { style: styles.label }, 'Set Value'),
            h('div', { style: styles.inputWrapper },
                h('input', {
                    type: 'password',
                    style: styles.input,
                    placeholder: 'Enter secret value...',
                    value: inputPassword,
                    onInput: (e) => setInputPassword(e.target.value)
                }),
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' } },
                    h('input', { 
                        type: 'checkbox', 
                        checked: forcePrompt, 
                        onInput: (e) => setForcePrompt(e.target.checked),
                        id: 'forcePrompt'
                    }),
                    h('label', { htmlFor: 'forcePrompt', style: { fontSize: '11px', color: THEME.textMuted, cursor: 'pointer' } }, 'Force User Prompt (TouchID/Password) on Access')
                ),
                h('button', { 
                    style: styles.button,
                    onClick: savePassword,
                    disabled: status === 'loading'
                }, 'SAVE TO KEYCHAIN')
            )
        ),

        // Display Section (if key exists)
        keyExists && h('div', { style: styles.keyDisplay },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' } },
                h('label', { style: styles.label }, 'Stored Value'),
                h('div', { 
                    style: { cursor: 'pointer', color: THEME.textMuted, fontSize: '11px' },
                    onClick: () => {
                        if (retrievedPassword) {
                            setRetrievedPassword(null);
                        } else {
                            revealPassword();
                        }
                    }
                }, retrievedPassword ? 'HIDE' : 'REVEAL (PROMPT)')
            ),
            
            retrievedPassword && h('div', { 
                style: Object.assign({}, 
                    { fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '13px' }
                )
            }, retrievedPassword),
            
            !retrievedPassword && h('div', { 
                style: { color: THEME.textMuted, fontSize: '12px', fontStyle: 'italic' }
            }, 'Hidden (Click Reveal to fetch from Keychain)'),
            
            h('div', { style: { marginTop: '15px', borderTop: `1px solid ${THEME.border}`, paddingTop: '10px' } },
                h('button', { 
                    style: styles.deleteButton,
                    onClick: deletePassword
                }, 'DELETE FROM KEYCHAIN')
            )
        ),

        // CSS for spinner
        h('style', null, `
            @keyframes spin { 100% { transform: rotate(360deg); } }
        `)
    );
}

return { View: SecureKeychain };
```
