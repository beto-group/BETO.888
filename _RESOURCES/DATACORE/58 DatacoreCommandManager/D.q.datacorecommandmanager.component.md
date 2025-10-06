





# ViewComponent

```jsx
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- DC Command System (v5 - Correct Prefixing) ---
// This version fixes the double-prefix issue by no longer manually adding the plugin
// name to the command. Obsidian handles this automatically, resulting in a clean
// "DC Commands: <Your Command>" format in the command palette.
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const { useState, useEffect, useCallback } = dc;
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const PLUGIN_ID = 'dc-cmd';
const PLUGIN_NAME = 'DC Commands';

function CommandManagementSystem() {
    const [pluginExists, setPluginExists] = useState(false);
    const [commands, setCommands] = useState([]);
    const [newId, setNewId] = useState('');
    const [newName, setNewName] = useState('');
    const [newAction, setNewAction] = useState('new Notice("Hello from my DC command!");');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const vaultPath = dc.app.vault.adapter.getBasePath();
    const pluginPath = path.join(vaultPath, '.obsidian/plugins', PLUGIN_ID);
    const dataPath = path.join(pluginPath, 'data.json');

    // --- Core Logic ---

    const checkAndLoadPlugin = useCallback(async () => {
        if (fs.existsSync(pluginPath) && fs.existsSync(path.join(pluginPath, 'main.js'))) {
            setPluginExists(true);
            try {
                if (fs.existsSync(dataPath)) {
                    const fileContent = fs.readFileSync(dataPath, 'utf-8');
                    setCommands(JSON.parse(fileContent) || []);
                } else {
                    fs.writeFileSync(dataPath, '[]');
                    setCommands([]);
                }
            } catch (e) {
                setError("Error reading commands file. It might be corrupted.");
                console.error(e);
            }
        } else {
            setPluginExists(false);
        }
    }, [pluginPath, dataPath]);

    useEffect(() => {
        checkAndLoadPlugin();
    }, [checkAndLoadPlugin]);

    const handleInstallPlugin = async () => {
        setStatus('Creating plugin...');
        setError('');
        try {
            fs.mkdirSync(pluginPath, { recursive: true });

            const manifest = {
                id: PLUGIN_ID,
                name: PLUGIN_NAME,
                version: "1.0.0",
                minAppVersion: "0.12.0",
                description: `Runs custom commands defined via the DC Commands manager.`,
                author: "DC",
                isDesktopOnly: false
            };
            fs.writeFileSync(path.join(pluginPath, 'manifest.json'), JSON.stringify(manifest, null, 2));

            const mainJsContent = `
const { Plugin } = require('obsidian');
const DATA_FILE = './data.json';

module.exports = class extends Plugin {
    async onload() {
        if (!await this.app.vault.adapter.exists(this.manifest.dir + '/' + DATA_FILE)) return;
        try {
            const commands = JSON.parse(await this.app.vault.adapter.read(this.manifest.dir + '/' + DATA_FILE));
            if (Array.isArray(commands)) {
                for (const command of commands) {
                    this.addCommand({
                        id: command.id,
                        name: command.name,
                        callback: () => new Function('Notice', 'dc', command.action)(Notice, window.dc)
                    });
                }
            }
        } catch(e) { console.error("${PLUGIN_NAME}: Failed to load commands.", e); }
    }
};
`;
            fs.writeFileSync(path.join(pluginPath, 'main.js'), mainJsContent.trim());
            fs.writeFileSync(dataPath, '[]');

            setStatus('Enabling plugin...');
            await dc.app.plugins.loadManifests();
            await dc.app.plugins.enablePlugin(PLUGIN_ID);

            setStatus('Installation complete!');
            new Notice(`"${PLUGIN_NAME}" plugin installed and enabled!`);
            setPluginExists(true);
        } catch (e) {
            setError(`Failed to install plugin: ${e.message}`);
            console.error(e);
        }
    };

    // --- Command Management Functions ---

    const handleCreateCommand = async () => {
        if (!newId || !newName) { setError("Command ID and Name are required."); return; }
        const finalId = `${PLUGIN_ID}:${newId.replace(/\s+/g, '-')}`;
        if (commands.some(c => c.id === finalId)) { setError("This Command ID already exists."); return; }

        // --- THE FIX ---
        // We no longer add the prefix. The `newName` is the clean name like "test1".
        // Obsidian will automatically add "DC Commands:" to it in the palette.
        const finalName = newName.trim();
        const newCommand = { id: finalId, name: finalName, action: newAction };
        // --- END FIX ---

        const updatedCommands = [...commands, newCommand];

        try {
            fs.writeFileSync(dataPath, JSON.stringify(updatedCommands, null, 2));
            setCommands(updatedCommands);

            dc.app.commands.addCommand({
                id: newCommand.id,
                name: newCommand.name,
                callback: () => new Function('Notice', 'dc', newCommand.action)(Notice, window.dc)
            });

            setNewId(''); setNewName(''); setNewAction('new Notice("Hello from my custom command!");');
            setError('');
            new Notice(`Command "${finalName}" added to DC Commands!`);
        } catch (e) {
            setError(`Failed to save command: ${e.message}`);
            console.error(e);
        }
    };

    const handleDeleteCommand = async (commandToDelete) => {
        if (!confirm(`Are you sure you want to delete the command "${commandToDelete.name}"?`)) return;
        const updatedCommands = commands.filter(c => c.id !== commandToDelete.id);
        try {
            fs.writeFileSync(dataPath, JSON.stringify(updatedCommands, null, 2));
            setCommands(updatedCommands);
            dc.app.commands.removeCommand(commandToDelete.id);
            new Notice(`Command deleted. Reload Obsidian to fully unregister.`);
        } catch (e) {
            setError(`Failed to delete command: ${e.message}`);
            console.error(e);
        }
    };

    // --- RENDER LOGIC ---

    if (!pluginExists) {
        return (
            <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#2c2c2e', color: '#ccc', borderRadius: '8px', textAlign: 'center' }}>
                <h2 style={{ marginTop: 0 }}>Setup DC Commands</h2>
                <p style={{ color: '#aaa', lineHeight: 1.5 }}>A core plugin is needed to run your custom commands.<br />This will create a new plugin called "{PLUGIN_NAME}" in your vault.</p>
                <button onClick={handleInstallPlugin} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#0a84ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '16px' }}>
                    Install Core Plugin
                </button>
                {status && <p style={{ color: '#34c759', marginTop: '16px' }}>{status}</p>}
                {error && <p style={{ color: '#ff453a', marginTop: '16px' }}>{error}</p>}
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#2c2c2e', color: '#ccc', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '16px' }}>{PLUGIN_NAME} Manager</h2>
            <div style={{ marginTop: '24px' }}>
                <h3>Add New Command</h3>
                <div style={{ display: 'grid', gap: '16px', backgroundColor: '#3a3a3c', padding: '16px', borderRadius: '6px' }}>
                    <input type="text" placeholder="Unique ID (e.g., my-action)" value={newId} onChange={e => setNewId(e.target.value)} style={{ padding: '10px', border: '1px solid #555', borderRadius: '4px' }} />
                    <input type="text" placeholder="Command Name (e.g., test1)" value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: '10px', border: '1px solid #555', borderRadius: '4px' }} />
                    <textarea value={newAction} onChange={e => setNewAction(e.target.value)} rows="5" style={{ padding: '10px', border: '1px solid #555', borderRadius: '4px', fontFamily: 'monospace' }} />
                    <button onClick={handleCreateCommand} style={{ padding: '10px', backgroundColor: '#34c759', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Command</button>
                    {error && <p style={{ color: '#ff453a', margin: '0' }}>{error}</p>}
                </div>
            </div>
            <div style={{ marginTop: '32px' }}>
                <h3>Existing Commands ({commands.length})</h3>
                {commands.length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {commands.map(cmd => (
                            <div key={cmd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#3a3a3c', borderRadius: '4px' }}>
                                <div>
                                    <strong style={{ color: 'white' }}>{cmd.name}</strong>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{cmd.id}</p>
                                </div>
                                <button onClick={() => handleDeleteCommand(cmd)} style={{ padding: '8px 12px', backgroundColor: '#ff453a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                            </div>
                        ))}
                    </div>
                ) : <p style={{ color: '#aaa' }}>No commands created yet.</p>}
            </div>
        </div>
    );
}

return { View: CommandManagementSystem };
```


