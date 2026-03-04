
const SAVE_FILE_PATH = ".datacore/game/duel-n-back/stats.json";
// Updated to force cache refresh

/**
 * Checks if the Datacore adapter is available.
 */
function isAdapterAvailable() {
    return dc?.app?.vault?.adapter;
}

/**
 * Ensures the directory exists.
 */
async function ensureDirectory() {
    if (!isAdapterAvailable()) return;
    const dir = SAVE_FILE_PATH.substring(0, SAVE_FILE_PATH.lastIndexOf("/"));
    if (!(await dc.app.vault.adapter.exists(dir))) {
        await dc.app.vault.adapter.mkdir(dir);
    }
}

/**
 * Loads the current stats from the file.
 * Returns default structure if file not found or error.
 */
async function getStats() {
    if (!isAdapterAvailable()) return { overall: { gamesPlayed: 0, totalHits: 0, totalMisses: 0, totalFalseAlarms: 0 }, sessions: [] };

    try {
        if (await dc.app.vault.adapter.exists(SAVE_FILE_PATH)) {
            const content = await dc.app.vault.adapter.read(SAVE_FILE_PATH);
            return JSON.parse(content);
        }
    } catch (e) {
        console.error("IQGame: Failed to load stats", e);
    }

    return {
        overall: {
            gamesPlayed: 0,
            totalHits: 0,
            totalMisses: 0,
            totalFalseAlarms: 0
        },
        sessions: []
    };
}

/**
 * Saves the current session and updates overall stats.
 * @param {Object} sessionData - { nLevel, score: { pos, sound }, timestamp }
 */
async function saveSession(sessionData) {
    console.log("scoreManager: saveSession called with:", sessionData);
    if (!isAdapterAvailable()) {
        console.warn("IQGame: persistence not available.");
        return;
    }

    await ensureDirectory();
    const stats = await getStats();

    // specific session data
    const newSession = {
        timestamp: sessionData.timestamp || Date.now(),
        nLevel: sessionData.nLevel,
        score: sessionData.score
    };
    stats.sessions.push(newSession);

    // Update overall
    stats.overall.gamesPlayed++;

    // Aggregate scores
    const { pos, sound } = sessionData.score;
    stats.overall.totalHits += (pos.hits + sound.hits);
    stats.overall.totalMisses += (pos.misses + sound.misses);
    stats.overall.totalFalseAlarms += (pos.falseAlarms + sound.falseAlarms);

    try {
        await dc.app.vault.adapter.write(SAVE_FILE_PATH, JSON.stringify(stats, null, 2));
        console.log("IQGame: Session saved.");
    } catch (error) {
        console.error("IQGame: Failed to save session", error);
    }
}

async function resetStats() {
    if (!isAdapterAvailable()) return;

    const emptyStats = {
        overall: { gamesPlayed: 0, totalHits: 0, totalMisses: 0, totalFalseAlarms: 0 },
        sessions: []
    };

    try {
        await dc.app.vault.adapter.write(SAVE_FILE_PATH, JSON.stringify(emptyStats, null, 2));
        console.log("IQGame: Stats reset.");
        return emptyStats;
    } catch (error) {
        console.error("IQGame: Failed to reset stats", error);
        return null;
    }
}

return { saveSession, getStats, resetStats };
