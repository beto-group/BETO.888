/**
 * SessionManager.js
 * 
 * Provides high-fidelity session lifecycle management for BetoOS.
 * Follows the 'Claw-Parity' JSONL Standard (Rule #16).
 * 
 * @version 1.11.0
 * @author beto.group
 */

class SessionManager {
    constructor(vaultRoot = "/") {
        this.sessionDir = `${vaultRoot}_RESOURCES/SKILL/memory/sessions/`;
        this.configPath = `${vaultRoot}_RESOURCES/SKILL/settings.json`;
    }

    /**
     * Creates a new session file with metadata.
     */
    async createSession(persona = "Lead Architect") {
        const sessionId = `session-${Date.now()}`;
        const path = `${this.sessionDir}${sessionId}.jsonl`;
        const meta = {
            type: "session_meta",
            version: 1,
            session_id: sessionId,
            created_at_ms: Date.now(),
            updated_at_ms: Date.now(),
            persona: persona
        };

        const initialSystemMessage = {
            type: "message",
            message: {
                role: "system",
                blocks: [{ type: "text", text: `BetoOS Session Initialized. Persona: ${persona}.` }]
            }
        };

        const content = JSON.stringify(meta) + "\n" + JSON.stringify(initialSystemMessage) + "\n";
        // Note: In Datacore context, use dc.file.write() or similar. 
        // This is a reference implementation for agent scripts.
        return { sessionId, path, content };
    }

    /**
     * Appends a message to an existing session.
     */
    appendMessage(role, text) {
        const entry = {
            type: "message",
            message: {
                role: role,
                blocks: [{ type: "text", text: text }]
            }
        };
        return JSON.stringify(entry) + "\n";
    }

    /**
     * Generates a compaction record (summary).
     */
    compact(summary, removedCount) {
        const entry = {
            type: "compaction",
            count: 1, // Logic to increment this should be in the main loop
            removed_message_count: removedCount,
            summary: summary
        };
        return JSON.stringify(entry) + "\n";
    }
}

// Export for use in Datacore components
if (typeof module !== 'undefined') {
    module.exports = SessionManager;
}
