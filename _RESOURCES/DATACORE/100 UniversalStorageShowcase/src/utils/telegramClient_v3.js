
// Browser Bundle Implementation using LOCAL BUNDLE and Vault Adapter
console.log("[TelegramBridge] Module loading (v3)...");

class TelegramBridge {
    constructor(folderPath, adapter) {
        this.folderPath = folderPath;
        this.adapter = adapter;

        // Construct paths manually
        const normalize = (p) => p.replace(/\\/g, '/');
        this.sessionFileUser = normalize(`${folderPath}/_resources/mcp/telegram_session_user.txt`);
        this.sessionFileBot = normalize(`${folderPath}/_resources/mcp/telegram_session_bot.txt`);
        // Fallback for transition
        this.sessionFileOld = normalize(`${folderPath}/_resources/mcp/telegram_session.txt`);

        this.commandFile = normalize(`${folderPath}/_resources/mcp/mcp_commands.json`);
        this.activityFile = normalize(`${folderPath}/_resources/mcp/mcp_activity.json`);
        this.promptFile = normalize(`${folderPath}/_resources/mcp/external_prompt.md`);
        this.bundleFile = normalize(`${folderPath}/src/utils/telegram.bundle.js`);

        this.client = null;
        this.StringSession = null;
        this.TelegramClient = null;
        this.currentMode = null; // 'user' or 'bot'
    }

    async init(mode = 'user') {
        this.currentMode = mode;
        try {
            // Ensure global telegram lib is loaded
            if (!window.telegram) {
                console.log(`[TelegramBridge] Loading local bundle from ${this.bundleFile}...`);

                if (await this.adapter.exists(this.bundleFile)) {
                    const bundleContent = await this.adapter.read(this.bundleFile);
                    // Create script element
                    const script = document.createElement('script');
                    script.textContent = bundleContent;
                    document.head.appendChild(script);
                    console.log("[TelegramBridge] Local bundle injected.");
                } else {
                    throw new Error(`Bundle not found at ${this.bundleFile}`);
                }
            }

            // Wait for execution if needed (usually synchronous for inline script)
            if (!window.telegram) {
                console.warn("[TelegramBridge] window.telegram missing after injection. Waiting...");
                // Small delay just in case
                await new Promise(r => setTimeout(r, 100));
            }

            if (!window.telegram) throw new Error("window.telegram not defined after injection");

            const tg = window.telegram;
            this.TelegramClient = tg.TelegramClient;
            this.StringSession = tg.sessions.StringSession;
            const { NewMessage } = tg.events;
            this.NewMessage = NewMessage;

            // Load session if exists based on mode
            let sessionString = '';
            const targetFile = mode === 'bot' ? this.sessionFileBot : this.sessionFileUser;

            if (await this.adapter.exists(targetFile)) {
                console.log(`[TelegramBridge] Loading existing ${mode} session...`);
                sessionString = await this.adapter.read(targetFile);
            } else if (mode === 'user' && await this.adapter.exists(this.sessionFileOld)) {
                // Migrate old session to User mode if it exists
                console.log("[TelegramBridge] Migrating old session to User mode...");
                sessionString = await this.adapter.read(this.sessionFileOld);
            }

            this.stringSession = new this.StringSession(sessionString);

        } catch (e) {
            console.error("[TelegramBridge] Initialization Failed:", e);
            throw e;
        }
    }

    async connect(apiId, apiHash, phoneNumber, password, codeCallback) {
        try {
            console.log("Connecting to Telegram (User)...");
            await this.init('user');

            this.client = new this.TelegramClient(this.stringSession, parseInt(apiId), apiHash, {
                connectionRetries: 5,
                useWSS: true,
            });

            await this.client.start({
                phoneNumber: async () => phoneNumber,
                password: async () => password || '',
                phoneCode: async () => {
                    console.log("Waiting for code...");
                    return await codeCallback();
                },
                onError: (err) => console.log(err),
            });

            console.log("Connected to Telegram!");
            await this.saveSession();
            this.startListening();
            return true;
        } catch (e) {
            console.error("Connection Failed:", e);
            throw e;
        }
    }

    async connectWithToken(apiId, apiHash, botToken) {
        try {
            console.log("Connecting as Bot...");
            await this.init('bot');

            this.client = new this.TelegramClient(this.stringSession, parseInt(apiId), apiHash, {
                connectionRetries: 10,
                retryDelay: 3000,
                useWSS: true, // Reverted to WSS as per environment
            });

            await this.client.start({
                botAuthToken: botToken,
                onError: (err) => console.log(err),
            });

            console.log("Connected as Bot!");
            await this.saveSession();
            this.startListening();
            return true;
        } catch (e) {
            console.error("Bot Connection Failed:", e);
            throw e;
        }
    }

    async saveSession() {
        if (this.client) {
            const session = this.client.session.save();
            const targetFile = this.currentMode === 'bot' ? this.sessionFileBot : this.sessionFileUser;
            await this.adapter.write(targetFile, session);
        }
    }

    startListening() {
        if (!this.client) return;
        // console.log("[TelegramBridgeV3] Starting event listener...");

        // Listen for new messages
        this.client.addEventHandler(async (event) => {
            try {
                // DEBUG: RAW EVENT LOG
                // console.log("[TelegramBridgeV3] Raw Event Received:", event);

                const message = event.message;
                if (message && message.message) {
                    console.log(`[TelegramBridgeV3] Processing message: "${message.message.substring(0, 20)}..."`);

                    const sender = await message.getSender();
                    const senderName = sender ? (sender.username || sender.firstName) : 'Unknown';

                    // RESTORED: Logging enabled for visibility
                    console.log(`[TelegramBridgeV3] Received from ${senderName}:`, message.message);

                    // Add support for subscribers (like ObsidianCLI)
                    if (this.onMessage) {
                        this.onMessage(senderName, message.message);
                    }
                }
            } catch (e) {
                console.error("[TelegramBridgeV3] Error processing message event:", e);
            }
        }, new this.NewMessage({}));
    }

    async logActivity(source, action, result) {
        try {
            let activities = [];
            if (await this.adapter.exists(this.activityFile)) {
                try {
                    const content = await this.adapter.read(this.activityFile);
                    activities = JSON.parse(content);
                } catch (e) { }
            }
            activities.unshift({
                timestamp: new Date().toISOString(),
                source,
                action,
                status: 'success',
                result
            });
            if (activities.length > 50) activities = activities.slice(0, 50);
            await this.adapter.write(this.activityFile, JSON.stringify(activities, null, 2));
        } catch (e) { console.error("Log Activity Failed", e); }
    }

    async sendMessage(to, text) {
        if (!this.client) throw new Error("Client not connected");
        console.log(`Attempting to send to: ${to}`);
        let peer = to;
        if (typeof to === 'string' && !to.startsWith('@') && !to.startsWith('+') && isNaN(to)) {
            peer = '@' + to;
        }
        try {
            console.log(`Resolving peer: ${peer}...`);
            const sendPromise = this.client.sendMessage(peer, { message: text });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Send timed out after 10s")), 10000));
            await Promise.race([sendPromise, timeoutPromise]);
            console.log("Message sent successfully!");
            await this.logActivity('telegram', 'SENT', `To ${peer}: ${text}`);
            return true;
        } catch (e) {
            console.error("Send Failed:", e);
            await this.logActivity('telegram', 'ERROR', `Send failed to ${peer}: ${e.message}`);
            throw e;
        }
    }

    async disconnect() {
        if (this.client) {
            try {
                console.log("[TelegramBridge] Disconnecting client...");
                await this.client.disconnect();
                this.client = null;
                this.stringSession = null;
            } catch (e) {
                console.error("[TelegramBridge] Disconnect error:", e);
            }
        }
    }

    async checkConnection() {
        if (!this.client) throw new Error("Client not initialized");
        try {
            console.log("Checking connection (getMe)...");
            const me = await this.client.getMe();
            await this.logActivity('telegram', 'DEBUG', `Connected as: ${me.firstName} (${me.username || 'No username'})`);
            return me;
        } catch (e) {
            console.error("Connection check failed:", e);
            await this.logActivity('telegram', 'ERROR', `Connection check failed: ${e.message}`);
            throw e;
        }
    }
}

// Make globally available
window.TelegramBridge = TelegramBridge;
console.log("[TelegramBridge] Registered on window (v3 - Local Bundle)");
