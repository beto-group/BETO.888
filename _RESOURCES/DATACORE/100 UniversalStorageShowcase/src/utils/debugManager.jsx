/**
 * DebugManager - Centralized Logging & Console Interception
 * Allows toggling logs on/off and broadcasting to listeners (e.g. MCPBridge).
 */

class DebugManager {
    constructor() {
        this.enabled = true;
        this.intercepting = false;
        this.listeners = [];
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };
    }

    /**
     * Enable or disable all logging.
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`[DebugManager] Logging ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    /**
     * Subscribe to log events (e.g. for writing to files).
     * @param {Function} callback (type, args) => void
     * @returns {Function} unsubscribe
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    broadcast(type, args) {
        if (!this.enabled) return;
        this.listeners.forEach(cb => {
            try {
                cb(type, args);
            } catch (e) {
                this.originalConsole.error("[DebugManager] Listener error:", e);
            }
        });
    }

    /**
     * Log a message (wrapper for console.log).
     */
    log(...args) {
        if (!this.enabled) return;
        // If intercepting, calling console.log will trigger our replacement.
        // If we want to force a log even if intercepting is off (but enabled is on),
        // we should use originalConsole to avoid loops if we are inside the replacement?
        // Actually, if we are NOT intercepting, console.log is native.
        // If we ARE intercepting, console.log calls US.

        // Use originalConsole to always output to DevTools without looping
        this.originalConsole.log(...args);
        this.broadcast('log', args);
    }

    warn(...args) {
        if (!this.enabled) return;
        this.originalConsole.warn(...args);
        this.broadcast('warn', args);
    }

    error(...args) {
        if (!this.enabled) return;
        this.originalConsole.error(...args);
        this.broadcast('error', args);
    }

    /**
     * Patch global console methods to capture all output.
     */
    interceptConsole() {
        if (this.intercepting) return;

        // Update originals in case they changed (unlikely but safe)
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };

        console.log = (...args) => {
            if (this.enabled) {
                this.originalConsole.log(...args);
                this.broadcast('log', args);
            }
        };

        console.warn = (...args) => {
            if (this.enabled) {
                this.originalConsole.warn(...args);
                this.broadcast('warn', args);
            }
        };

        console.error = (...args) => {
            if (this.enabled) {
                this.originalConsole.error(...args);
                this.broadcast('error', args);
            }
        };

        this.intercepting = true;
        this.log("[DebugManager] Console intercepted.");
    }

    /**
     * Restore global console methods.
     */
    restoreConsole() {
        if (!this.intercepting) return;

        console.log = this.originalConsole.log;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;

        this.intercepting = false;
        this.originalConsole.log("[DebugManager] Console restored.");
    }
}

// Export singleton
const debugManager = new DebugManager();
return { debugManager };
