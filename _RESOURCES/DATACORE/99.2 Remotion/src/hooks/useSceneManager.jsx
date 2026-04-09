const { useState, useEffect, useCallback, useRef } = dc;

/**
 * useSceneManager
 * Manages project state and persistence with safety guards.
 */
function useSceneManager({ folderPath, isInception, libraryComponents, onHistoryAction }) {
    const [sequence, setSequence] = useState([]);
    const [scenesList, setScenesList] = useState(['Default Scene']);
    const [activeScene, setActiveScene] = useState('Default Scene');
    const [activeBackground, setActiveBackground] = useState('GradientBackground');
    const [hasLoadedState, setHasLoadedState] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('library');
    const [zoom, setZoom] = useState(4);

    const stateRef = useRef({ sequence, activeBackground, zoom, sidebarTab });
    const isTransitioning = useRef(false);

    useEffect(() => {
        stateRef.current = { sequence, activeBackground, zoom, sidebarTab };
    }, [sequence, activeBackground, zoom, sidebarTab]);

    const ensureScenesDir = useCallback(async () => {
        if (isInception) return;
        const scenesDir = `${folderPath}/_scenes`;
        if (!(await dc.app.vault.adapter.exists(scenesDir))) {
            await dc.app.vault.adapter.mkdir(scenesDir);
        }
    }, [folderPath, isInception]);

    const saveProject = useCallback(async () => {
        if (isInception || !hasLoadedState || isTransitioning.current) return;
        try {
            await ensureScenesDir();
            const sceneName = activeScene.endsWith('.json') ? activeScene : `${activeScene}.json`;
            const projectPath = `${folderPath}/_scenes/${sceneName}`;
            const state = { ...stateRef.current, version: 1 };
            await dc.app.vault.adapter.write(projectPath, JSON.stringify(state, null, 2));
        } catch (e) { }
    }, [folderPath, isInception, activeScene, ensureScenesDir, hasLoadedState]);

    // Auto-save logic
    useEffect(() => {
        if (!hasLoadedState || isInception) return;
        const timer = setTimeout(saveProject, 1000);
        return () => clearTimeout(timer);
    }, [sequence, activeBackground, zoom, sidebarTab, hasLoadedState, saveProject, isInception]);

    const refreshScenes = useCallback(async () => {
        if (isInception) return;
        try {
            await ensureScenesDir();
            const listing = await dc.app.vault.adapter.list(`${folderPath}/_scenes`);
            const sceneFiles = (listing?.files || [])
                .map(f => f.split('/').pop())
                .filter(f => f.endsWith('.json') && !f.startsWith('_'))
                .map(f => f.replace('.json', ''));
            setScenesList(sceneFiles.length > 0 ? sceneFiles.sort() : ['Default Scene']);
        } catch (e) { }
    }, [folderPath, isInception, ensureScenesDir]);

    // Initial Load logic
    useEffect(() => {
        let active = true;
        async function init() {
            if (isInception) { setHasLoadedState(true); return; }
            await refreshScenes();
            let target = 'Default Scene';
            try {
                const prefsPath = `${folderPath}/_scenes/_prefs.json`;
                if (await dc.app.vault.adapter.exists(prefsPath)) {
                    const prefs = JSON.parse(await dc.app.vault.adapter.read(prefsPath));
                    if (prefs.lastActiveScene) target = prefs.lastActiveScene;
                }
            } catch (e) { }

            const path = `${folderPath}/_scenes/${target}.json`;
            if (await dc.app.vault.adapter.exists(path)) {
                try {
                    const state = JSON.parse(await dc.app.vault.adapter.read(path));
                    if (active) {
                        setSequence(state.sequence || []);
                        setActiveBackground(state.activeBackground || 'GradientBackground');
                        setZoom(state.zoom || 4);
                        if (state.sidebarTab) setSidebarTab(state.sidebarTab);
                    }
                } catch (e) { }
            }
            if (active) {
                setActiveScene(target);
                setHasLoadedState(true);
            }
        }
        init();
        return () => { active = false; };
    }, [folderPath, isInception, refreshScenes]);

    const handleSelectScene = async (name) => {
        if (isTransitioning.current) return;
        const cleanName = name.replace('.json', '');
        if (cleanName === activeScene) return;

        await saveProject();
        isTransitioning.current = true;
        setHasLoadedState(false);
        setActiveScene(cleanName);

        try {
            const path = `${folderPath}/_scenes/${cleanName}.json`;
            if (await dc.app.vault.adapter.exists(path)) {
                const state = JSON.parse(await dc.app.vault.adapter.read(path));
                setSequence(state.sequence || []);
                setActiveBackground(state.activeBackground || 'GradientBackground');
                setZoom(state.zoom || 4);
            } else {
                setSequence([]);
            }
            if (onHistoryAction) onHistoryAction.clear();
        } catch (e) { } finally {
            setTimeout(() => {
                isTransitioning.current = false;
                setHasLoadedState(true);
            }, 100);
        }
    };

    const handleCreateScene = async () => {
        await saveProject();
        let newName = `Scene ${scenesList.length + 1}`;
        setScenesList(prev => [...prev, newName].sort());
        setSequence([]);
        setActiveScene(newName);
        if (onHistoryAction) onHistoryAction.clear();
    };

    const handleRenameScene = async (oldName, newName) => {
        if (!newName || !newName.trim()) return;
        const cleanOld = oldName.replace('.json', '');
        const cleanNew = newName.trim().replace('.json', '');
        if (cleanNew === cleanOld) return;

        const newPath = `${folderPath}/_scenes/${cleanNew}.json`;
        if (await dc.app.vault.adapter.exists(newPath)) return alert("Scene exists");

        try {
            await saveProject();
            const oldPath = `${folderPath}/_scenes/${cleanOld}.json`;
            if (await dc.app.vault.adapter.exists(oldPath)) {
                await dc.app.vault.adapter.rename(oldPath, newPath);
            }
            refreshScenes();
            if (activeScene === cleanOld) setActiveScene(cleanNew);
        } catch (e) { }
    };

    const handleDeleteScene = async (name) => {
        if (scenesList.length <= 1) return;
        if (!confirm(`Delete scene "${name}"?`)) return;

        try {
            const path = `${folderPath}/_scenes/${name}.json`;
            await dc.app.vault.adapter.remove(path);
            refreshScenes();
            if (activeScene === name) handleSelectScene(scenesList.find(s => s !== name));
        } catch (e) { }
    };

    return {
        sequence, setSequence,
        scenesList,
        activeScene, setActiveScene,
        activeBackground, setActiveBackground,
        zoom, setZoom,
        sidebarTab, setSidebarTab,
        handleCreateScene,
        handleSelectScene,
        handleRenameScene,
        handleDeleteScene,
        saveProject,
        hasLoadedState,
        refreshScenes
    };
}

return { useSceneManager };
