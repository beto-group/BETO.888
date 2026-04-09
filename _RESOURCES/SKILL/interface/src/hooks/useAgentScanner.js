function useAgentScanner(dc) {
    const { useState, useEffect } = dc;
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function scan() {
            // Check if app is available (Datacore context usually has app)
            // But we can also access via dc.app if available, or global window.app
            const app = window.app || dc.app;

            if (!app) {
                setLoading(false);
                return;
            }

            try {
                // Get all files/folders from the cache
                const allFiles = app.vault.getAllLoadedFiles();

                // 1. Find all SKILL.md files (The Gold Standard)
                const skillFiles = allFiles.filter(f =>
                    !f.children &&
                    f.name.toUpperCase() === 'SKILL.md'
                );

                const skillBasedAgents = skillFiles.map(file => {
                    const folder = file.parent;
                    return {
                        path: folder.path,
                        name: folder.name,
                        parentPath: folder.parent ? folder.parent.path : '',
                        fileCount: folder.children ? folder.children.length : 0,
                        sourceType: 'SKILL.md'
                    };
                });

                // 2. Find legacy 'agents' folders (The Old Standard)
                const legacyAgentFolders = allFiles.filter(f =>
                    f.children &&
                    f.name.toLowerCase() === 'agents'
                );

                const legacyAgents = legacyAgentFolders.map(folder => ({
                    path: folder.path,
                    name: folder.parent ? folder.parent.name : 'Root Agents',
                    parentPath: folder.parent ? folder.parent.path : '',
                    fileCount: folder.children.length,
                    sourceType: 'Folder Name'
                }));

                // Combine and Deduplicate
                const allAgents = [...skillBasedAgents, ...legacyAgents];

                // Remove duplicates by path
                const uniqueAgents = Array.from(new Map(allAgents.map(item => [item.path, item])).values());

                setAgents(uniqueAgents);
            } catch (e) {
                console.error("Agent Scanner Failed", e);
            } finally {
                setLoading(false);
            }
        }

        scan();
    }, []);

    return { agents, loading };
}

return { useAgentScanner };
