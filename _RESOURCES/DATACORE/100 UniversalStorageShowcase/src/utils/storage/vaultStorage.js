const vaultStorage = {
    write: async (dc, filePath, content) => {
        try {
            await dc.app.vault.adapter.write(filePath, content);
            return { success: true, message: `Vault Write Success` };
        } catch (e) {
            return { success: false, message: `Vault Write Error: ${e.message}` };
        }
    },
    read: async (dc, filePath) => {
        try {
            const exists = await dc.app.vault.adapter.exists(filePath);
            if (!exists) return { success: false, message: "Vault file not found" };
            const content = await dc.app.vault.adapter.read(filePath);
            return { success: true, content, message: `Vault Read Success` };
        } catch (e) {
            return { success: false, message: `Vault Read Error: ${e.message}` };
        }
    }
};

return { vaultStorage };
