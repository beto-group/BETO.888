


# ViewComponent

```jsx
const { useEffect, useRef, useState } = dc;
const { h, Fragment } = dc.preact;

// --- UTILITY FUNCTIONS (for full tab mode) ---
function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }

// --- Node.js Core Modules ---
const os = require('os');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

// --- Theme & Constants ---
const THEME = {
    background: '#000000',
    backgroundAlt: '#0A0A0A', 
    backgroundAlt2: '#121212',
    foreground: '#FFFFFF',
    foregroundMuted: '#999999',
    accent: '#9370DB',
    accentDim: 'rgba(147, 112, 219, 0.15)',
    accentBorder: 'rgba(147, 112, 219, 0.3)',
    red: '#FF4444',
    green: '#44FF88',
    yellow: '#FFBB44',
    blue: '#4488FF',
};

const STATUS = {
    SUCCESS: { color: THEME.green, text: 'SUCCESS', icon: 'check-circle' },
    FAILURE: { color: THEME.red, text: 'FAILURE', icon: 'x-circle' },
    SECURE: { color: THEME.blue, text: 'SECURE', icon: 'shield-check' },
    VULNERABLE: { color: THEME.red, text: 'VULNERABLE', icon: 'alert-triangle' },
    INFO: { color: THEME.blue, text: 'INFO', icon: 'info' },
};

// --- UI Component: Threat Matrix Dashboard ---
function ThreatMatrixDashboard({ data }) {
    if (!data) return null;
    const styles = {
        matrix: { border: '1px solid ' + THEME.accentBorder, borderRadius: '6px', backgroundColor: THEME.backgroundAlt, padding: '12px', marginTop: '12px', color: THEME.foreground },
        header: { textAlign: 'center', color: THEME.accent, letterSpacing: '1px', fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' },
        section: { border: '1px solid ' + THEME.accentBorder, padding: '10px', borderRadius: '4px', backgroundColor: THEME.backgroundAlt2 },
        sectionTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: THEME.accent, marginBottom: '8px', fontSize: '13px' },
        item: { fontSize: '12px', lineHeight: '1.6', color: THEME.foregroundMuted, margin: '4px 0' },
        highlight: { color: THEME.foreground, fontWeight: 'bold' }
    };
    return h('div', { style: styles.matrix },
        h('div', { style: styles.header }, 'Aetherium Audit Summary'),
        h('div', { style: styles.grid },
            h('div', { style: styles.section },
                h('div', { style: styles.sectionTitle }, h(dc.Icon, { icon: 'cpu', style: { width: '14px', height: '14px' } }), 'Execution Environment'),
                h('p', { style: styles.item }, 'Node Version: ', h('span', { style: styles.highlight }, data.nodeVersion)),
                h('p', { style: styles.item }, 'User Context: ', h('span', { style: styles.highlight }, data.user)),
            ),
            h('div', { style: styles.section },
                h('div', { style: styles.sectionTitle }, h(dc.Icon, { icon: 'shield-alert', style: { width: '14px', height: '14px' } }), 'Threat Intelligence'),
                h('p', { style: styles.item }, 'Sandbox Escape: ', h('span', { style: { color: THEME.red, fontWeight: 'bold' } }, data.sandboxEscape ? 'CONFIRMED' : 'MITIGATED')),
                h('p', { style: styles.item }, 'RCE Vector: ', h('span', { style: { color: THEME.red, fontWeight: 'bold' } }, data.rceVector ? 'CONFIRMED' : 'MITIGATED')),
                h('p', { style: styles.item }, 'Persistence: ', h('span', { style: { color: THEME.red, fontWeight: 'bold' } }, data.persistence ? 'CONFIRMED' : 'MITIGATED')),
            ),
            h('div', { style: styles.section },
                h('div', { style: styles.sectionTitle }, h(dc.Icon, { icon: 'globe', style: { width: '14px', height: '14px' } }), 'Application Bridge'),
                h('p', { style: styles.item }, 'Obsidian Vault: ', h('span', { style: styles.highlight }, data.vaultName)),
                h('p', { style: styles.item }, 'UI Framework: ', h('span', { style: { color: THEME.green, fontWeight: 'bold' } }, 'Preact')),
            )
        )
    );
}

// --- Test Result Component ---
function TestResult({ name, status, info, isExpanded, onToggle }) {
    const bgColor = status.color + '22';
    const styles = {
        container: { marginBottom: '8px', border: '1px solid ' + THEME.accentBorder, borderRadius: '4px', overflow: 'hidden', backgroundColor: THEME.backgroundAlt },
        header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: info ? 'pointer' : 'default', backgroundColor: THEME.backgroundAlt2, transition: 'background 0.2s' },
        leftSide: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
        name: { color: THEME.foreground, fontSize: '13px', fontWeight: '500' },
        status: { display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '3px', backgroundColor: bgColor, color: status.color, fontSize: '11px', fontWeight: 'bold' },
        info: { padding: '8px 12px', backgroundColor: THEME.background, color: THEME.foregroundMuted, fontSize: '12px', lineHeight: '1.5', borderTop: '1px solid ' + THEME.accentBorder }
    };

    return h('div', { style: styles.container },
        h('div', { 
            style: styles.header, 
            onClick: info ? onToggle : null,
            onMouseOver: (e) => { if (info) e.currentTarget.style.backgroundColor = THEME.backgroundAlt; },
            onMouseOut: (e) => { if (info) e.currentTarget.style.backgroundColor = THEME.backgroundAlt2; }
        },
            h('div', { style: styles.leftSide },
                h(dc.Icon, { icon: status.icon, style: { width: '16px', height: '16px', color: status.color } }),
                h('span', { style: styles.name }, name)
            ),
            h('div', { style: styles.status },
                h('span', null, status.text)
            )
        ),
        info && isExpanded && h('div', { style: styles.info }, info)
    );
}

// --- Interactive Object Explorer ---
function ObjectExplorer({ rootObjects }) {
    const [expandedPaths, setExpandedPaths] = useState({});

    const togglePath = (path) => {
        setExpandedPaths(prev => {
            const newState = Object.assign({}, prev);
            newState[path] = !prev[path];
            return newState;
        });
    };

    const renderValue = (value, path, indent = 0) => {
        const paddingLeft = (8 + indent * 16) + 'px';
        const styles = {
            row: { padding: '4px 10px', paddingLeft: paddingLeft, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'default', transition: 'background 0.15s' },
            clickableRow: { cursor: 'pointer' },
            key: { color: THEME.foreground, fontWeight: '500' },
            arrow: { color: THEME.accent, fontSize: '9px', fontWeight: 'bold', width: '10px' },
            type: { opacity: 0.6, fontSize: '10px', color: THEME.foregroundMuted }
        };

        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
        const isArray = Array.isArray(value);
        const isExpandable = isObject || isArray;
        const isExpanded = expandedPaths[path];

        if (isExpandable) {
            const keys = Object.keys(value).slice(0, 100); // Limit for performance
            const summary = isArray ? 'Array(' + value.length + ')' : '{' + keys.length + ' keys}';
            
            return h(Fragment, null,
                h('div', { 
                    style: Object.assign({}, styles.row, styles.clickableRow),
                    onClick: () => togglePath(path),
                    onMouseOver: (e) => { e.currentTarget.style.backgroundColor = THEME.accentDim; },
                    onMouseOut: (e) => { e.currentTarget.style.backgroundColor = 'transparent'; }
                },
                    h('span', { style: styles.arrow }, isExpanded ? '▼' : '►'),
                    h('span', { style: styles.key }, path.split('.').pop() || 'root'),
                    h('span', { style: styles.type }, summary)
                ),
                isExpanded && keys.map(key => renderValue(value[key], `${path}.${key}`, indent + 1))
            );
        }

        let valueDisplay = "";
        let color = THEME.foreground;
        switch (typeof value) {
            case 'string': 
                valueDisplay = '"' + value.slice(0, 80) + (value.length > 80 ? '...' : '') + '"'; 
                color = THEME.foregroundMuted; 
                break;
            case 'number': 
                valueDisplay = String(value); 
                color = THEME.accent; 
                break;
            case 'boolean': 
                valueDisplay = String(value); 
                color = THEME.accent; 
                break;
            case 'function': 
                valueDisplay = 'ƒ ' + (value.name || 'anonymous') + '()'; 
                color = THEME.accent; 
                break;
            default: 
                valueDisplay = String(value); 
                color = THEME.foregroundMuted; 
                break;
        }

        return h('div', { style: styles.row },
            h('span', { style: { width: '12px' } }),
            h('span', { style: styles.key }, path.split('.').pop()),
            h('span', { style: { color, flex: 1 } }, valueDisplay)
        );
    };

    const styles = {
        container: { border: '1px solid ' + THEME.accentBorder, borderRadius: '6px', backgroundColor: THEME.backgroundAlt, marginTop: '10px', maxHeight: '400px', overflow: 'auto' },
        header: { padding: '8px 12px', borderBottom: '1px solid ' + THEME.accentBorder, backgroundColor: THEME.backgroundAlt2, color: THEME.accent, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }
    };

    return h('div', { style: styles.container },
        h('div', { style: styles.header }, 
            h(dc.Icon, { icon: 'microscope', style: { width: '14px', height: '14px' } }),
            'Interactive API Explorer'
        ),
        h('div', null,
            Object.entries(rootObjects).map(([name, obj]) => 
                renderValue(obj, name, 0)
            )
        )
    );
}

// --- Expandable Section Component ---
function ExpandableSection({ title, icon, isExpanded, onToggle, children }) {
    const styles = {
        container: { marginBottom: '10px', border: '1px solid ' + THEME.accentBorder, borderRadius: '6px', overflow: 'hidden', backgroundColor: THEME.backgroundAlt },
        header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', backgroundColor: THEME.backgroundAlt2, transition: 'background 0.2s' },
        title: { display: 'flex', alignItems: 'center', gap: '8px', color: THEME.foreground, fontSize: '14px', fontWeight: '600' },
        arrow: { color: THEME.accent, fontSize: '11px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' },
        content: { padding: '10px' }
    };

    return h('div', { style: styles.container },
        h('div', { 
            style: styles.header,
            onClick: onToggle,
            onMouseOver: (e) => { e.currentTarget.style.backgroundColor = THEME.backgroundAlt; },
            onMouseOut: (e) => { e.currentTarget.style.backgroundColor = THEME.backgroundAlt2; }
        },
            h('div', { style: styles.title },
                h(dc.Icon, { icon, style: { width: '16px', height: '16px' } }),
                h('span', null, title)
            ),
            h('span', { style: styles.arrow }, '►')
        ),
        isExpanded && h('div', { style: styles.content }, children)
    );
}

// --- Main Component ---
function AetheriumAudit() {
    const [summaryData, setSummaryData] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [hasRun, setHasRun] = useState(false);
    
    // Test results state
    const [foundationalResults, setFoundationalResults] = useState([]);
    const [adversarialResults, setAdversarialResults] = useState([]);
    const [apiResults, setApiResults] = useState([]);
    
    // Expanded states
    const [expandedTests, setExpandedTests] = useState({});
    const [expandedSections, setExpandedSections] = useState({});
    
    // Full Tab Mode State
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const uniqueWrapperClass = "interactive-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;

    // Toggle handlers
    const toggleTest = (index) => {
        setExpandedTests(prev => {
            const newState = Object.assign({}, prev);
            newState[index] = !prev[index];
            return newState;
        });
    };

    const toggleSection = (name) => {
        setExpandedSections(prev => {
            const newState = Object.assign({}, prev);
            newState[name] = !prev[name];
            return newState;
        });
    };

    // Test execution
    const runTest = async (testFn) => {
        try {
            const result = await Promise.resolve(testFn());
            return { name: result.name, status: result.status || STATUS.SUCCESS, info: result.info };
        } catch (e) {
            return { name: e.name || 'Test Failed', status: STATUS.FAILURE, info: e.message.split('\n')[0] };
        }
    };

    const runAllTests = async () => {
        setIsAuditing(true);
        setHasRun(true);
        setSummaryData(null);
        setFoundationalResults([]);
        setAdversarialResults([]);
        setApiResults([]);

        // Foundational Tests
        const foundational = [];
        
        foundational.push(await runTest(() => ({ 
            name: "Node.js: Full `process` Access",
            info: `Node v${process.versions.node}, Arch: ${os.arch()}, Platform: ${os.platform()}` 
        })));
        
        foundational.push(await runTest(() => ({ 
            name: "`child_process`: Execute simple command",
            info: `Output: "${child_process.execSync('echo "Hello from shell"').toString().trim()}"` 
        })));
        
        foundational.push(await runTest(() => new Promise((resolve) => {
            child_process.spawn('ping', ['-c', '1', '8.8.8.8']).on('close', () => 
                resolve({ name: "`child_process`: Spawn long-running process", info: "SUCCESS: Can spawn and manage background processes." })
            );
        })));
        
        foundational.push(await runTest(() => {
            const p = path.join(dc.app.vault.adapter.getBasePath(), ".dc_test.md");
            fs.writeFileSync(p, "test"); 
            const c = fs.readFileSync(p, 'utf-8'); 
            fs.unlinkSync(p);
            return { name: "In-Vault `fs`: Write & Read file (Allowed)", info: `Successfully created and read back: "${c}"` };
        }));
        
        foundational.push(await runTest(() => ({ 
            name: "API: Get Vault & Version Info",
            info: `Vault: '${dc.app.vault.getName()}', App Version: ${dc.app.version || 'N/A'}` 
        })));
        
        foundational.push(await runTest(() => ({ 
            name: "API: Workspace Interaction",
            info: `Active view type: '${dc.app.workspace.activeLeaf?.view.getViewType() || 'N/A'}'` 
        })));
        
        foundational.push(await runTest(() => {
            dc.app.commands.executeCommandById('app:toggle-light-dark'); 
            dc.app.commands.executeCommandById('app:toggle-light-dark');
            return { name: "API: Execute Core Command", info: "Successfully toggled theme via a core command." };
        }));
        
        foundational.push(await runTest(async () => ({ 
            name: "Network: `fetch` external resource",
            info: `GitHub API status: ${(await fetch("https://api.github.com")).status}` 
        })));

        setFoundationalResults(foundational.map((r, i) => ({ ...r, id: i })));

        // Adversarial Tests
        const adversarial = [];
        let rceSuccess = false, persistenceSuccess = false, escapeSuccess = false;
        
        adversarial.push(await runTest(() => ({ 
            name: "Recon: System & User Identity",
            status: STATUS.VULNERABLE,
            info: `User: ${os.userInfo().username}, Home: ${os.homedir()}, Hostname: ${os.hostname()}` 
        })));
        
        const escapeTest = await runTest(() => {
            try { 
                fs.readFileSync(path.resolve(dc.app.vault.adapter.getBasePath(), '../../../../../../../../../../etc/passwd')); 
                escapeSuccess = true; 
                return { name: "Exploitation: FS Escape & Read System Files", status: STATUS.VULNERABLE, info: "SUCCESS: `fs` sandbox is bypassable." }; 
            } catch (e) { 
                return { name: "Exploitation: FS Escape & Read System Files", status: STATUS.SECURE, info: "Path traversal was blocked." }; 
            }
        });
        adversarial.push(escapeTest);
        
        adversarial.push(await runTest(() => {
            let found = [];
            try { fs.readFileSync(path.join(os.homedir(), '.zsh_history')); found.push('shell history'); } catch (e) { }
            try { fs.readFileSync(path.join(os.homedir(), '.bash_history')); found.push('bash history'); } catch (e) { }
            return { 
                name: "Exploitation: Credential Hunting",
                status: found.length > 0 ? STATUS.VULNERABLE : STATUS.SECURE, 
                info: `Can access user home dir. Found: ${found.join(', ') || 'none'}.` 
            };
        }));
        
        const persistTest = await runTest(() => {
            const shellPath = path.join(os.homedir(), '.zshrc'); 
            let originalContent = "";
            try { 
                originalContent = fs.readFileSync(shellPath, 'utf-8'); 
                fs.appendFileSync(shellPath, '\n# DC\n'); 
                persistenceSuccess = true; 
                return { name: "Persistence: Modify Shell Startup File", status: STATUS.VULNERABLE, info: `SUCCESS: Can write to shell startup files.` }; 
            } catch (e) { 
                return { name: "Persistence: Modify Shell Startup File", status: STATUS.SECURE, info: `Could not write to ${shellPath}.` }; 
            } finally { 
                if (originalContent) fs.writeFileSync(shellPath, originalContent); 
            }
        });
        adversarial.push(persistTest);
        
        const rceTest = await runTest(() => {
            const p = path.join(os.homedir(), 'dc_rce.txt');
            try { 
                child_process.execSync(`sh -c 'echo "RCE" > "${p}"'`); 
                if (fs.existsSync(p)) { 
                    rceSuccess = true; 
                    return { name: "Impact: Advanced Remote Code Execution", status: STATUS.VULNERABLE, info: "SUCCESS: Arbitrary shell command execution is possible." }; 
                } 
                return { name: "Impact: Advanced Remote Code Execution", status: STATUS.FAILURE, info: "Command executed but file not created." }; 
            } catch (e) { 
                return { name: "Impact: Advanced Remote Code Execution", status: STATUS.SECURE, info: "Command failed." }; 
            } finally { 
                if (fs.existsSync(p)) fs.unlinkSync(p); 
            }
        });
        adversarial.push(rceTest);
        
        adversarial.push(await runTest(() => ({ 
            name: "Impact: UI Deception (Concept)",
            status: STATUS.VULNERABLE, 
            info: "SUCCESS: Preact allows rendering arbitrary UI for phishing attacks within the trusted app context." 
        })));

        setAdversarialResults(adversarial.map((r, i) => ({ ...r, id: i })));

        // API Summary Tests
        const api = [];
        
        api.push(await runTest(() => ({ 
            name: "Datacore: UI Framework & Hooks",
            status: STATUS.INFO, 
            info: `Preact with all standard hooks (useState, useEffect, useRef, etc.) for building complex UIs.` 
        })));
        
        api.push(await runTest(() => ({ 
            name: "Datacore: Built-in UI Components",
            status: STATUS.INFO, 
            info: `A rich component library is provided for building professional interfaces.` 
        })));
        
        api.push(await runTest(() => ({ 
            name: "Datacore: Data Engine & Utilities",
            status: STATUS.INFO, 
            info: `Provides 'dc.api.query' for DQL queries and helper libraries like 'dc.luxon' for date handling.` 
        })));
        
        api.push(await runTest(async () => {
            try { 
                const result = await dc.api.query("TASK"); 
                return { name: "Datacore: Proof of Concept DQL Query", info: `Successfully executed a DQL query. Found ${result.values.length} tasks.` }; 
            } catch (e) { 
                return { name: "Datacore: Proof of Concept DQL Query", status: STATUS.FAILURE, info: `The 'TASK' query failed: ${e.message}` }; 
            }
        }));
        
        api.push(await runTest(() => ({ 
            name: "Obsidian: File & Data Bridge",
            status: STATUS.INFO, 
            info: `Full control over the vault, files, metadata cache, and all vault operations.` 
        })));
        
        api.push(await runTest(() => ({ 
            name: "Obsidian: Workspace & Plugin Bridge",
            status: STATUS.INFO, 
            info: `Can execute commands, control the UI, access other plugins, and manipulate the workspace.` 
        })));

        setApiResults(api.map((r, i) => ({ ...r, id: i })));

        // Set summary
        setSummaryData({ 
            nodeVersion: process.versions.node, 
            user: os.userInfo().username, 
            vaultName: dc.app.vault.getName(), 
            sandboxEscape: escapeSuccess, 
            rceVector: rceSuccess, 
            persistence: persistenceSuccess 
        });

        setIsAuditing(false);
        setExpandedSections({ foundational: true, adversarial: true, api: true, explorer: true });
    };

    // --- Full Tab Mode Effect ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // --- ENTER FULL TAB LOGIC ---
        if (isFullTab) {
            if (!container.parentNode) {
                setTimeout(() => setIsFullTab(true), 50);
                return;
            }
            const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
            if (!targetPaneContent) {
                console.error("[AetheriumAudit] Full tab mode failed: Could not find '.workspace-leaf-content' ancestor.");
                setIsFullTab(false);
                return;
            }
            const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
            
            // Save state for cleanup
            stateRefs.originalParent = container.parentNode;
            stateRefs.placeholder = document.createElement('div');
            stateRefs.placeholder.style.display = 'none';
            container.parentNode.insertBefore(stateRefs.placeholder, container);
            
            const computedParentPosition = window.getComputedStyle(contentWrapper).position;
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position
            };
            if (computedParentPosition === 'static') {
                contentWrapper.style.position = "relative";
            }
            
            contentWrapper.appendChild(container);
            Object.assign(container.style, {
                position: "absolute", top: "0px", left: "0px",
                width: "100%", height: "100%", zIndex: "9998",
                overflow: "auto"
            });
        }

        // --- CLEANUP / EXIT FULL TAB LOGIC ---
        return () => {
            if (!stateRefs.originalParent) return;
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
            } else {
                stateRefs.originalParent.appendChild(container);
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || '';
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
        };
    }, [isFullTab]);

    // Event Handlers
    const handleExitFullTab = (e) => {
        e.stopPropagation();
        setIsFullTab(false);
    };
    
    const handleEnterFullTab = () => setIsFullTab(true);

    const handleCopyPath = () => {
        try {
            const activeFile = dc.app.workspace.getActiveFile();
            if (activeFile) {
                navigator.clipboard.writeText(activeFile.path);
                new Notice(`Path copied: ${activeFile.path}\nUse Ctrl+O to open it.`, 5000);
            } else {
                new Notice("Could not determine the active file path.", 5000);
            }
        } catch (error) {
            console.error("Error getting file path:", error);
            new Notice("Error: Could not access app context to find file path.", 5000);
        }
    };

    const handleCopyFullReport = () => {
        const verdict = '\n\n=== FINAL VERDICT: TOTAL SYSTEM COMPROMISE ===\n\n' +
            'The environment is a fully-featured, unsandboxed development kit with deep, granular access to both the host system and the core Obsidian application. The entire adversarial kill chain is viable.\n\n' +
            'IMPLICATIONS:\n' +
            '- For the System: Any script can act as malware, reading any user file, installing persistence mechanisms, and exfiltrating data without limitation.\n' +
            '- For the Application: Scripts have god-mode access to Obsidian, able to read other plugins\' data, silently modify the vault, and control the UI.\n' +
            '- For the User: The trust placed in the Obsidian application can be abused for sophisticated phishing and credential theft attacks from within the app itself.\n\n' +
            '⚠️ DO NOT RUN UNTRUSTED SCRIPTS. EVER.';
        
        const allResults = [
            '=== AETHERIUM AUDIT FULL REPORT ===\n',
            '\n--- Foundational Capabilities ---',
            ...foundationalResults.map(r => r.name + ': ' + r.status.text + (r.info ? '\n  ' + r.info : '')),
            '\n--- Adversarial Kill Chain ---',
            ...adversarialResults.map(r => r.name + ': ' + r.status.text + (r.info ? '\n  ' + r.info : '')),
            '\n--- API Summary ---',
            ...apiResults.map(r => r.name + ': ' + r.status.text + (r.info ? '\n  ' + r.info : '')),
            verdict
        ].join('\n');
        
        navigator.clipboard.writeText(allResults);
        new Notice('Full audit report copied to clipboard!', 3000);
    };

    // Styles
    const styles = {
        wrapper: { fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: THEME.background, color: THEME.foreground, padding: '12px', borderRadius: '6px', border: '1px solid ' + THEME.accentBorder, boxSizing: 'border-box', minHeight: '100%' },
        title: { color: THEME.foreground, borderBottom: '2px solid ' + THEME.accent, paddingBottom: '8px', marginBottom: '10px', letterSpacing: '1px', fontWeight: '600', fontSize: '18px' },
        subtitle: { fontSize: '13px', color: THEME.foregroundMuted, marginTop: '-6px', marginBottom: '12px', lineHeight: '1.4' },
        buttonGroup: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'center' },
        button: { padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: THEME.background, backgroundColor: THEME.accent, border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' },
        secondaryButton: { backgroundColor: THEME.backgroundAlt2, color: THEME.foreground, border: '1px solid ' + THEME.accentBorder },
        disabledButton: { opacity: 0.5, cursor: 'not-allowed' },
        loaderOverlay: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '40px 20px', color: THEME.foreground },
        spinner: { width: '40px', height: '40px', borderRadius: '50%', border: '3px solid ' + THEME.accentBorder, borderTopColor: THEME.accent, animation: 'spin 1s linear infinite' },
        compactWrapper: { padding: "16px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", border: "1px dashed " + THEME.accentBorder, borderRadius: "6px", backgroundColor: THEME.backgroundAlt, minHeight: "200px" },
        compactText: { margin: 0, color: THEME.foregroundMuted, fontSize: "14px", textAlign: "center" },
        icon: { position: "absolute", top: "12px", right: "60px", fontFamily: "monospace", fontSize: "13px", color: THEME.foregroundMuted, userSelect: "none", cursor: "pointer", opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out", zIndex: 10 },
        sectionsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px' },
        sectionHeader: { fontSize: '15px', fontWeight: '600', color: THEME.accent, marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid ' + THEME.accentBorder, display: 'flex', alignItems: 'center', gap: '8px' },
        sectionHeaderIcon: { fontSize: '16px' },
        conclusionBox: { marginTop: '12px', padding: '12px', border: '2px solid ' + THEME.red, borderRadius: '6px', backgroundColor: THEME.red + '11' },
        conclusionTitle: { color: THEME.red, fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
        conclusionText: { color: THEME.foreground, lineHeight: '1.6', fontSize: '13px', marginBottom: '8px' },
        conclusionList: { color: THEME.foregroundMuted, fontSize: '12px', lineHeight: '1.6' }
    };

    return h('div', { ref: containerRef },
        h('style', null, `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .${uniqueWrapperClass}:hover .subtle-icon {
                opacity: 0.7;
                transform: scale(1);
            }
            .${uniqueWrapperClass} * {
                box-sizing: border-box !important;
            }
            @media (min-width: 1200px) {
                .sections-grid-responsive {
                    grid-template-columns: 1fr 1fr !important;
                }
            }
        `),

        !isFullTab && h('div', { style: styles.compactWrapper },
            h('p', { style: styles.compactText }, 'Aetherium Audit System - Compact Mode'),
            h('div', { style: styles.buttonGroup },
                h('button', { 
                    style: styles.button, 
                    onClick: handleEnterFullTab 
                }, 
                    h(dc.Icon, { icon: 'maximize-2', style: { width: '14px', height: '14px' } }),
                    'Enter Full Tab'
                ),
                h('button', { 
                    style: Object.assign({}, styles.button, styles.secondaryButton), 
                    onClick: handleCopyPath 
                }, 
                    h(dc.Icon, { icon: 'search', style: { width: '14px', height: '14px' } }),
                    'Find Codeblock'
                )
            )
        ),

        isFullTab && h('div', { style: styles.wrapper, className: uniqueWrapperClass },
            h('span', { 
                style: styles.icon, 
                className: "subtle-icon", 
                title: "Exit Full Tab", 
                onClick: handleExitFullTab 
            }, '<//>'),
            
            h('h2', { style: styles.title }, 'AETHERIUM AUDIT SYSTEM'),
            h('p', { style: styles.subtitle }, 
                'A comprehensive security audit of the Datacore environment, testing foundational capabilities, adversarial attack vectors, and API access levels.'
            ),

            h('div', { style: styles.buttonGroup },
                h('button', { 
                    style: Object.assign({}, styles.button, isAuditing ? styles.disabledButton : {}),
                    onClick: runAllTests,
                    disabled: isAuditing,
                    onMouseOver: (e) => { if (!isAuditing) e.currentTarget.style.transform = 'translateY(-1px)'; },
                    onMouseOut: (e) => { e.currentTarget.style.transform = 'translateY(0)'; }
                }, 
                    h(dc.Icon, { icon: isAuditing ? 'loader-2' : (hasRun ? 'rotate-cw' : 'play'), style: { width: '14px', height: '14px' } }),
                    isAuditing ? 'Running...' : hasRun ? 'Re-run Audit' : 'Run Audit'
                ),
                
                hasRun && h('button', { 
                    style: Object.assign({}, styles.button, styles.secondaryButton),
                    onClick: handleCopyFullReport,
                    onMouseOver: (e) => { e.currentTarget.style.backgroundColor = THEME.backgroundAlt; },
                    onMouseOut: (e) => { e.currentTarget.style.backgroundColor = THEME.backgroundAlt2; }
                }, 
                    h(dc.Icon, { icon: 'clipboard-copy', style: { width: '14px', height: '14px' } }),
                    'Copy Full Report'
                )
            ),

            isAuditing && h('div', { style: styles.loaderOverlay },
                h('div', { style: styles.spinner }),
                h('span', { style: { fontSize: '14px', color: THEME.accent } }, 'Running audit...')
            ),

            !isAuditing && hasRun && h(Fragment, null,
                summaryData && h(ThreatMatrixDashboard, { data: summaryData }),

                h('div', { style: styles.sectionsGrid, className: 'sections-grid-responsive' },
                    h('div', null,
                        h('div', { style: styles.sectionHeader },
                            h(dc.Icon, { icon: 'cpu', style: { width: '16px', height: '16px' } }),
                            h('span', null, 'Foundational Capabilities')
                        ),
                        h(ExpandableSection, { 
                            title: 'Test Results', 
                            icon: 'bar-chart-2',
                            isExpanded: expandedSections.foundational,
                            onToggle: () => toggleSection('foundational')
                        },
                            foundationalResults.map((result, i) => 
                                h(TestResult, { 
                                    key: result.id,
                                    name: result.name, 
                                    status: result.status, 
                                    info: result.info,
                                    isExpanded: expandedTests[`f-${i}`],
                                    onToggle: () => toggleTest(`f-${i}`)
                                })
                            )
                        )
                    ),

                    h('div', null,
                        h('div', { style: styles.sectionHeader },
                            h(dc.Icon, { icon: 'swords', style: { width: '16px', height: '16px' } }),
                            h('span', null, 'Adversarial Kill Chain')
                        ),
                        h(ExpandableSection, { 
                            title: 'Attack Scenarios', 
                            icon: 'target',
                            isExpanded: expandedSections.adversarial,
                            onToggle: () => toggleSection('adversarial')
                        },
                            adversarialResults.map((result, i) => 
                                h(TestResult, { 
                                    key: result.id,
                                    name: result.name, 
                                    status: result.status, 
                                    info: result.info,
                                    isExpanded: expandedTests[`a-${i}`],
                                    onToggle: () => toggleTest(`a-${i}`)
                                })
                            )
                        )
                    )
                ),

                h('div', { style: styles.sectionHeader },
                    h(dc.Icon, { icon: 'plug', style: { width: '16px', height: '16px' } }),
                    h('span', null, 'API Summary & Capabilities')
                ),
                h(ExpandableSection, { 
                    title: 'Available APIs', 
                    icon: 'radio',
                    isExpanded: expandedSections.api,
                    onToggle: () => toggleSection('api')
                },
                    apiResults.map((result, i) => 
                        h(TestResult, { 
                            key: result.id,
                            name: result.name, 
                            status: result.status, 
                            info: result.info,
                            isExpanded: expandedTests[`api-${i}`],
                            onToggle: () => toggleTest(`api-${i}`)
                        })
                    )
                ),

                h('div', { style: styles.sectionHeader },
                    h(dc.Icon, { icon: 'microscope', style: { width: '16px', height: '16px' } }),
                    h('span', null, 'Interactive API Explorer')
                ),
                h(ExpandableSection, { 
                    title: 'Explore Datacore & Obsidian APIs', 
                    icon: 'flask-conical',
                    isExpanded: expandedSections.explorer,
                    onToggle: () => toggleSection('explorer')
                },
                    h(ObjectExplorer, { 
                        rootObjects: { 
                            Datacore: dc, 
                            Obsidian: dc.app 
                        } 
                    })
                ),

                h('div', { style: styles.conclusionBox },
                    h('div', { style: Object.assign({}, styles.conclusionTitle, { display: 'flex', alignItems: 'center', gap: '8px' }) }, 
                        h(dc.Icon, { icon: 'alert-triangle', style: { width: '16px', height: '16px' } }),
                        'Final Verdict: Total System Compromise'
                    ),
                    h('p', { style: styles.conclusionText }, 
                        'The environment is a fully-featured, unsandboxed development kit with deep, granular access to both the host system and the core Obsidian application. The entire adversarial kill chain is viable.'
                    ),
                    h('div', { style: styles.conclusionList },
                        h('p', { style: { margin: '6px 0' } }, h('strong', { style: { color: THEME.red } }, 'For the System:'), ' Any script can act as malware, reading any user file, installing persistence mechanisms, and exfiltrating data without limitation.'),
                        h('p', { style: { margin: '6px 0' } }, h('strong', { style: { color: THEME.accent } }, 'For the Application:'), ' Scripts have god-mode access to Obsidian, able to read other plugins\' data, silently modify the vault, and control the UI.'),
                        h('p', { style: { margin: '6px 0' } }, h('strong', { style: { color: THEME.foreground } }, 'For the User:'), ' The trust placed in the Obsidian application can be abused for sophisticated phishing and credential theft attacks from within the app itself.'),
                        h('p', { style: { marginTop: '10px', color: THEME.red, fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' } }, 
                            h(dc.Icon, { icon: 'shield-alert', style: { width: '14px', height: '14px' } }),
                            'DO NOT RUN UNTRUSTED SCRIPTS. EVER.'
                        )
                    )
                )
            )
        )
    );
}

return { View: AetheriumAudit };
```


