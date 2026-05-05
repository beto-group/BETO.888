/**
 * ExtensionManager - Electron Session Bridge
 * Now includes Manifest parsing for Dashboard links
 */
class ExtensionManager {
    constructor(folderPath, dc) {
        this.folderPath = folderPath;
        this.dc = dc;
        this.registryPath = folderPath + '/ext_registry.json';
        this.session = this.getSession();
    }

    getSession() {
        try {
            const remote = require('@electron/remote') || require('electron').remote;
            return remote.session.defaultSession;
        } catch (e) {
            console.error("[ExtensionManager] Failed to acquire Electron session:", e);
            return null;
        }
    }

    async getExtensions() {
        if (!this.session) return [];
        const extApi = this.session.extensions;
        if (!extApi) return [];

        try {
            const method = (extApi.getExtensions || extApi.getAllExtensions);
            if (typeof method !== 'function') return [];
            const exts = method.call(extApi);
            
            // Enrich with Dashboard URLs
            const enriched = [];
            for (const ext of (exts || [])) {
                const dashboardUrl = await this.getOptionsUrl(ext.id, ext.path);
                enriched.push({
                    id: ext.id,
                    name: ext.name,
                    version: ext.version,
                    path: ext.path,
                    enabled: true,
                    dashboardUrl
                });
            }
            return enriched;
        } catch (e) {
            console.error("[ExtensionManager] List Error:", e);
            return [];
        }
    }

    async getOptionsUrl(id, extPath) {
        const adapter = this.dc.app.vault.adapter;
        const path = require('path');
        const manifestPath = path.join(extPath, 'manifest.json');
        
        try {
            const fs = require('fs');
            if (!fs.existsSync(extPath)) return null;
            
            const manifest = JSON.parse(fs.readFileSync(path.join(extPath, 'manifest.json'), 'utf8'));
            const optionsPage = manifest.options_ui?.page || manifest.options_page || manifest.browser_action?.default_popup;
            
            if (optionsPage) return `chrome-extension://${id}/${optionsPage}`;
        } catch (e) {
            console.warn(`[ExtensionManager] Manifest parse failed for ${id}:`, e);
        }
        return `chrome-extension://${id}/manifest.json`; // Fallback to manifest to check ID
    }

    async loadExtension(unpackedPath) {
        if (!this.session) throw new Error("No Electron Session");
        try {
            const ext = await this.session.extensions.loadExtension(unpackedPath);
            await this.persistPath(unpackedPath);
            return ext;
        } catch (e) {
            console.error("[ExtensionManager] Load Error:", e);
            throw e;
        }
    }

    async removeExtension(id) {
        if (!this.session) return;
        try {
            console.log(`[ExtensionManager] Removing: ${id}`);
            this.session.extensions.removeExtension(id);
        } catch (e) {
            console.error("[ExtensionManager] Remove Error:", e);
        }
    }

    async reloadExtension(id, unpackedPath) {
        console.log(`[ExtensionManager] Hot-Reloading: ${id} from ${unpackedPath}`);
        try {
            await this.removeExtension(id);
            // Give I/O a 100ms breather
            await new Promise(r => setTimeout(r, 100));
            return await this.loadExtension(unpackedPath);
        } catch (e) {
            console.error("[ExtensionManager] Reload Error:", e);
            throw e;
        }
    }

    async fetchFromStore(storeUrl) {
        const cp = require('child_process');
        const path = require('path');
        const adapter = this.dc.app.vault.adapter;
        
        const match = storeUrl.match(/\/([a-z]{32})(\/|\?|$)/);
        if (!match) throw new Error("Invalid Chrome Store URL (ID not found)");
        const extId = match[1];
        
        const extensionsDir = "_RESOURCES/EXTENSIONS";
        const tempCrx = `${extensionsDir}/${extId}.crx`;
        const unpackDir = `${extensionsDir}/${extId}`;
        
        const vaultPath = adapter.getBasePath();
        const absTempCrx = path.join(vaultPath, tempCrx);
        const absUnpackDir = path.join(vaultPath, unpackDir);

        if (!(await adapter.exists(extensionsDir))) await adapter.mkdir(extensionsDir);

        const downloadUrl = `https://clients2.google.com/service/update2/crx?response=redirect&os=win&arch=x64&os_arch=x86_64&prod=chromecrx&prodchannel=&prodversion=141.0.7390.55&lang=en-US&acceptformat=crx3,puff&x=id%3D${extId}%26installsource%3Dondemand%26uc`;

        console.log(`[ExtensionManager] Fetching ${extId} from ${downloadUrl}`);
        const curlCmd = `curl -L -o "${absTempCrx}" "${downloadUrl}"`;
        await this.runCommand(curlCmd);

        try {
            const fs = require('fs');
            const buffer = fs.readFileSync(absTempCrx);
            const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
            const zipStart = buffer.indexOf(zipHeader);
            if (zipStart > 0) {
                fs.writeFileSync(absTempCrx, buffer.slice(zipStart));
            }
        } catch (e) {}

        if (await adapter.exists(unpackDir)) await this.runCommand(`rm -rf "${absUnpackDir}"`);
        await adapter.mkdir(unpackDir);
        
        const unzipCmd = `unzip -o "${absTempCrx}" -d "${absUnpackDir}"`;
        await this.runCommand(unzipCmd);

        await adapter.remove(tempCrx);
        return await this.loadExtension(absUnpackDir);
    }

    runCommand(cmd) {
        return new Promise((resolve, reject) => {
            require('child_process').exec(cmd, (err, stdout, stderr) => {
                if (err) reject(new Error(stderr || stdout || err.message));
                else resolve(stdout);
            });
        });
    }

    async persistPath(path) {
        const adapter = this.dc.app.vault.adapter;
        let paths = [];
        try {
            if (await adapter.exists(this.registryPath)) {
                paths = JSON.parse(await adapter.read(this.registryPath));
            }
        } catch (e) {}
        if (!paths.includes(path)) {
            paths.push(path);
            await adapter.write(this.registryPath, JSON.stringify(paths, null, 2));
        }
    }

    async getPersistedPaths() {
        const adapter = this.dc.app.vault.adapter;
        try {
            if (await adapter.exists(this.registryPath)) {
                const content = await adapter.read(this.registryPath);
                if (!content || content.trim() === "") return [];
                return JSON.parse(content);
            }
        } catch (e) {
            console.error(`[ExtensionManager] Registry Read Error (${this.registryPath}):`, e);
        }
        return [];
    }

    async autoLoadPersisted() {
        console.log("[ExtensionManager] Auto-loading persisted extensions (STABILIZED)...");
        const paths = await this.getPersistedPaths();
        if (paths.length === 0) {
            console.log("[ExtensionManager] No persisted extensions found.");
            return;
        }

        const fs = require('fs');
        for (const path of paths) {
            try { 
                if (!fs.existsSync(path)) {
                    console.warn(`[ExtensionManager] Skipping missing path: ${path}`);
                    continue;
                }
                console.log(`[ExtensionManager] Auto-loading: ${path}`);
                await this.loadExtension(path); 
                // Add a small 500ms breather between extensions to prevent I/O swamp
                await new Promise(r => setTimeout(r, 500));
            } catch (e) { 
                console.warn(`[ExtensionManager] Failed to auto-load ${path}:`, e);
            }
        }
    }
}

return ExtensionManager;
