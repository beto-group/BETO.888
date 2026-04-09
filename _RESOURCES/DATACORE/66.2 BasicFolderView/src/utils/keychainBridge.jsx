/**
 * Keychain Utilities for Datacore (Simplified based on 76 NextWebsite)
 * Uses high-level secretStorage API instead of raw Shard API
 */

/**
 * Gets a handle to the SecretStorage
 */
function getStorage() {
    return dc.app.secretStorage || (window.app && window.app.secretStorage);
}

/**
 * Stores a secret securely
 */
async function setSecret(keyName, plaintext) {
    const storage = getStorage();

    if (!storage || typeof storage.setSecret !== 'function') {
        console.warn("Keychain API (setSecret) unavailable", storage);
        return false;
    }

    try {
        await storage.setSecret(keyName, plaintext);
        return true;
    } catch (e) {
        console.error("Keychain Set Error:", e);
        return false;
    }
}

/**
 * Retrieves and decrypts a secret
 */
async function getSecret(keyName) {
    const storage = getStorage();

    if (!storage || typeof storage.getSecret !== 'function') {
        console.warn("Keychain API (getSecret) unavailable");
        return null;
    }

    try {
        const secret = await storage.getSecret(keyName);
        return secret;
    } catch (e) {
        console.error("Keychain Get Error:", e);
        return null;
    }
}

return {
    setSecret,
    getSecret,
    getStorage
};
