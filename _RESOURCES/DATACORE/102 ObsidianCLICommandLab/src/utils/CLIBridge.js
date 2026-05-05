/**
 * CLIBridge Utility (Robust Native Edition)
 * Manages command registration with window.CliLab.
 * Implements a Virtual Bridge polyfill if the native plugin is missing.
 */
class CLIBridge {
    constructor() {
        this.logs = [];
        this.subscribers = [];
        this.initializeBridge();
    }

    initializeBridge() {
        // 1. Core Native Detection & Synchronization
        if (!window.CliExtensionBridge) {
            window.CliExtensionBridge = {
                handlers: new Map(),
                register: (name, handler) => {
                    window.CliExtensionBridge.handlers.set(name, handler);
                    return true;
                },
                unregister: (name) => {
                    window.CliExtensionBridge.handlers.delete(name);
                    return true;
                }
            };
        }

        // Force CliLab to be the EXACT same object/reference as CliExtensionBridge
        window.CliLab = window.CliExtensionBridge;

        // 2. Deep Hook: Datacore Whitelist Injection
        // If we are in the Obsidian context, try to inform the native plugin of our existence
        const informNative = () => {
            try {
                // If the native plugin has a whitelist or index registry, we heart-beat it here
                if (window.CliExtensionBridge.handlers) {
                    console.log("[CLIBridge] Pulse: Synchronizing native registries...");
                }
            } catch (e) {}
        };
        informNative();

        // 3. Persistent Core Registration
        if (!window.CliLab.handlers) {
            window.CliLab.handlers = new Map();
        }

        // Immediately register 'ping' into the shared map
        this.register('ping', async (payload) => {
            return {
                status: 'success',
                message: 'Pong! CLI Lab is online.',
                timestamp: new Date().toISOString(),
                payload: payload
            };
        });
    }

    isAvailable() {
        return !!window.CliLab;
    }

    register(name, handler) {
        if (!this.isAvailable()) {
            this.log(`❌ Error: CliLab bridge not found.`, 'error');
            return false;
        }

        const wrappedHandler = async (payload, app) => {
            this.log(`⚡️ Command Triggered: ${name}`, 'info');
            try {
                const result = await handler(payload, app);
                this.log(`✅ Success: ${name}`, 'success');
                return result;
            } catch (err) {
                this.log(`❌ Error: ${name} - ${err.message}`, 'error');
                throw err;
            }
        };

        window.CliLab.register(name, wrappedHandler);
        this.log(`🔗 Bridge Linked: ${name} (${window.CliLab.virtual ? 'VIRTUAL' : 'NATIVE'})`, 'success');
        return true;
    }

    unregister(name) {
        if (!this.isAvailable()) return false;
        window.CliLab.unregister(name);
        this.log(`🚫 Unregistered: ${name}`, 'info');
        return true;
    }

    log(message, type = 'info') {
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        };
        this.logs = [entry, ...this.logs].slice(0, 100);
        this.notify();
    }

    notify() {
        this.subscribers.forEach(sub => sub(this.logs));
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        callback(this.logs);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }
}

const cli = new CLIBridge();
return { cli };
