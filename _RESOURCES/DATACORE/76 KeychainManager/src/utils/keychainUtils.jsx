/**
 * Keychain Utilities for Datacore
 * Simplifies access to Obsidian Native SecretStorage and Shard API
 */

const DEFAULT_ACCESS_ID = "datacore-general";
const DEFAULT_TTL = 300; // 5 minutes

/**
 * Gets a handle to the SecretStorage
 */
function getStorage() {
    return dc.app.secretStorage || (window.app && window.app.secretStorage);
}

/**
 * Gets a handle to the Shard API
 */
function getShard() {
    return dc.app.shard || window.shard;
}

/**
 * Lists all keys in the SecretStorage
 */
function listSecrets() {
    const storage = getStorage();
    if (!storage || !storage.secrets) return [];
    return Object.keys(storage.secrets);
}

/**
 * Stores a secret securely using the high-level Native API
 */
async function setSecret(keyName, plaintext, accessId = DEFAULT_ACCESS_ID) {
    const storage = getStorage();
    if (!storage) throw new Error("Keychain API unavailable");

    // Try Standard Native API first (visible in system lists)
    if (typeof storage.setSecret === 'function') {
        try {
            await storage.setSecret(keyName, plaintext);
            return true;
        } catch (e) {
            console.warn("[Keychain] Native setSecret failed, trying shard fallback", e);
        }
    }

    // Shard Fallback
    const shard = getShard();
    if (!shard) throw new Error("Keychain Fallback unavailable");

    const cap = await shard.requestCapability(accessId, {
        ops: ["seal"],
        ttlSec: DEFAULT_TTL
    });

    const vaultId = dc.app.appId || (window.app && window.app.appId) || "vault-1";
    const sealed = await shard.Crypto.seal(vaultId, plaintext, {}, cap, accessId, keyName);
    storage.secrets[keyName] = sealed;

    if (storage.saveSecrets) await storage.saveSecrets();
    else if (storage.save) await storage.save();

    return true;
}

/**
 * Retrieves and decrypts a secret
 */
async function getSecret(keyName, accessId = DEFAULT_ACCESS_ID) {
    const storage = getStorage();
    if (!storage) throw new Error("Keychain API unavailable");

    // Try Standard Native API first
    if (typeof storage.getSecret === 'function') {
        try {
            const val = await storage.getSecret(keyName);
            if (val) return val;
        } catch (e) {
            console.warn("[Keychain] Native getSecret failed, trying fallback", e);
        }
    }

    // Shard Fallback
    if (!storage.secrets[keyName]) return null;
    const shard = getShard();
    if (!shard) throw new Error("Keychain Fallback unavailable");

    const cap = await shard.requestCapability(accessId, {
        ops: ["open"],
        ttlSec: DEFAULT_TTL
    });

    const vaultId = dc.app.appId || (window.app && window.app.appId) || "vault-1";
    return await shard.Crypto.open(vaultId, accessId, keyName, cap);
}

/**
 * Deletes a secret
 */
async function deleteSecret(keyName) {
    const storage = getStorage();
    if (!storage) return false;

    if (typeof storage.deleteSecret === 'function') {
        try {
            await storage.deleteSecret(keyName);
            return true;
        } catch (e) { }
    }

    if (storage.secrets && storage.secrets[keyName]) {
        delete storage.secrets[keyName];
        if (storage.saveSecrets) await storage.saveSecrets();
        else if (storage.save) await storage.save();
        return true;
    }

    return false;
}

return {
    listSecrets,
    setSecret,
    getSecret,
    deleteSecret,
    getStorage,
    getShard
};
