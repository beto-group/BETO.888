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
        } catch(e) { console.error("DC Commands: Failed to load commands.", e); }
    }
};