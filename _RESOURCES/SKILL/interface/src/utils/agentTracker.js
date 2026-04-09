const TRACKER_PATH = "DATACORE/83 BetoSkills/data/tracked_skills.json";

/**
 * Reads the tracked skills from the JSON file.
 * Returns an object map: { [path]: { status: 'extracted' | 'pending', lastSync: timestamp } }
 */
async function getTrackedAgents() {
    if (typeof window === 'undefined' || !window.app) return {};

    try {
        const exists = await window.app.vault.adapter.exists(TRACKER_PATH);
        if (!exists) {
            await window.app.vault.adapter.write(TRACKER_PATH, "{}");
            return {};
        }

        const content = await window.app.vault.adapter.read(TRACKER_PATH);
        return JSON.parse(content);
    } catch (e) {
        console.error("Failed to load tracked agents", e);
        return {};
    }
}

/**
 * Updates the tracking status of an agent.
 */
async function saveTrackedAgent(path, status = 'extracted') {
    if (typeof window === 'undefined' || !window.app) return;

    try {
        const current = await getTrackedAgents();
        current[path] = {
            status,
            lastSync: Date.now()
        };

        await window.app.vault.adapter.write(TRACKER_PATH, JSON.stringify(current, null, 2));
        return current;
    } catch (e) {
        console.error("Failed to save tracked agent", e);
    }
}


const RESOURCES_PATH = "DATACORE/83 BetoSkills/_resources/agents";

/**
 * Extracts the agent's knowledge to the centralized resources folder.
 * Then marks it as extracted.
 */
async function extractAgent(agent) {
    if (typeof window === 'undefined' || !window.app) return;

    const adapter = window.app.vault.adapter;
    const targetFolder = `${RESOURCES_PATH}/${agent.name}`;

    try {
        // 1. Ensure target folder exists
        if (!(await adapter.exists(targetFolder))) {
            await adapter.mkdir(targetFolder);
        }

        // 2. Copy Logic based on Source Type
        if (agent.sourceType === 'SKILL.md') {
            const sourceFile = `${agent.path}/SKILL.md`;
            const targetFile = `${targetFolder}/SKILL.md`;

            if (await adapter.exists(sourceFile)) {
                const content = await adapter.read(sourceFile);
                await adapter.write(targetFile, content);
            }
        } else {
            // Legacy Folder extraction - Copy all contents? 
            // For now, let's just look for README.md or SKILL.md inside (if mixed)
            // Or just copy everything. Let's be safe and simple for now: Copy all files.
            // Actually, listing files recursively might be heavy. 
            // Let's just try to copy the files in the immediate directory.

            // This part is tricky without a recursive list function available easily in adapter without heavy lifting.
            // Let's rely on Obsidian's FileManager if possible? No, adapter is raw.
            // Let's just look for known files for now to avoid errors.
            const knownFiles = ['SKILL.md', 'README.md', 'knowledge.md'];

            for (const file of knownFiles) {
                const src = `${agent.path}/${file}`;
                if (await adapter.exists(src)) {
                    const content = await adapter.read(src);
                    await adapter.write(`${targetFolder}/${file}`, content);
                }
            }
        }

        // 3. Mark as Extracted
        await saveTrackedAgent(agent.path, 'extracted');
        return true;

    } catch (e) {
        console.error("Extraction Failed", e);
        return false;
    }
}

return { getTrackedAgents, saveTrackedAgent, extractAgent };
