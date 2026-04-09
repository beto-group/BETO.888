const secureStorage = {
    set: async (dc, key, val) => {
        try {
            if (!dc.app.secretStorage) return { success: false, message: "SecretStorage not supported" };
            await dc.app.secretStorage.setSecret(key, val);
            return { success: true, message: `Secret '${key}' saved` };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },
    get: async (dc, key) => {
        try {
            if (!dc.app.secretStorage) return { success: false, message: "SecretStorage not supported" };
            const secret = await dc.app.secretStorage.getSecret(key);
            return { success: true, content: secret, message: secret ? "Secret retrieved" : "Secret not found" };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }
};

return { secureStorage };
