const { useState, useEffect, useCallback, useRef } = dc;

/**
 * useSceneManager Hook
 * Manages scene persistence, loading, saving, and migration.
 */
function useSceneManager({ folderPath, isInception, libraryComponents, onHistoryAction }) {
    const [sequence, setSequence] = useState([]);
    const [scenesList, setScenesList] = useState(['Default Scene']);
    const [activeScene, setActiveScene] = useState('Default Scene');
    const [activeBackground, setActiveBackground] = useState('GradientBackground');
    const [hasLoadedState, setHasLoadedState] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('library');
    const [zoom, setZoom] = useState(4); // Persisted per scene

    // State Ref for Unmount/Auto Saving (Always holds latest state)
    const stateRef = useRef({ sequence, activeBackground, zoom, sidebarTab });
    useEffect(() => {
        stateRef.current = { sequence, activeBackground, zoom, sidebarTab };
    }, [sequence, activeBackground, zoom, sidebarTab]);

    // Ensure _scenes directory exists
    const ensureScenesDir = useCallback(async () => {
        if (isInception) return;
        const scenesDir = `${folderPath}/_scenes`;
        const exists = await dc.app.vault.adapter.exists(scenesDir);
        if (!exists) {
            await dc.app.vault.adapter.mkdir(scenesDir);
        }
    }, [folderPath, isInception]);

    // Save Function
    const saveProject = useCallback(async () => {
        if (isInception) return;
        try {
            await ensureScenesDir();
            const sceneName = activeScene.endsWith('.json') ? activeScene : `${activeScene}.json`;
            const projectPath = `${folderPath}/_scenes/${sceneName}`;

            const state = { ...stateRef.current, version: 1 };
            await dc.app.vault.adapter.write(projectPath, JSON.stringify(state, null, 2));
            console.log(`[useSceneManager] Saved scene: ${sceneName}`);
        } catch (e) {
            console.error("[useSceneManager] Save failed:", e);
        }
    }, [folderPath, isInception, activeScene, ensureScenesDir]);

    // Save Workspace Prefs (Last Active Scene)
    useEffect(() => {
        if (!hasLoadedState || isInception) return;
        const savePrefs = async () => {
            try {
                const prefsPath = `${folderPath}/_scenes/_prefs.json`;
                await dc.app.vault.adapter.write(prefsPath, JSON.stringify({
                    lastActiveScene: activeScene,
                    lastModified: Date.now()
                }, null, 2));
            } catch (e) {
                console.warn("[useSceneManager] Failed to save prefs:", e);
            }
        };
        savePrefs();
    }, [activeScene, hasLoadedState, folderPath, isInception]);

    // List Scenes Function
    const refreshScenes = useCallback(async () => {
        if (isInception) return;
        try {
            await ensureScenesDir();
            const scenesDir = `${folderPath}/_scenes`;
            let sceneFiles = [];
            try {
                const listing = await dc.app.vault.adapter.list(scenesDir);
                if (listing && listing.files) {
                    sceneFiles = listing.files.map(f => f.split('/').pop()).filter(f => f.endsWith('.json'));
                }
            } catch (err) { }

            if (sceneFiles.length === 0) sceneFiles = ['Default Scene.json'];
            sceneFiles = [...new Set(sceneFiles)].sort();
            setScenesList(sceneFiles.map(f => f.replace('.json', '')));
        } catch (e) {
            console.error("[useSceneManager] Refresh failed:", e);
        }
    }, [folderPath, isInception, ensureScenesDir]);

    // Load State (Initial)
    useEffect(() => {
        let active = true;
        async function loadScenesAndProject() {
            try {
                if (isInception) {
                    if (active) setHasLoadedState(true);
                    return;
                }

                await refreshScenes();

                // Determine Active Scene from Prefs
                let targetScene = 'Default Scene';
                try {
                    const prefsPath = `${folderPath}/_scenes/_prefs.json`;
                    if (await dc.app.vault.adapter.exists(prefsPath)) {
                        const prefsParams = JSON.parse(await dc.app.vault.adapter.read(prefsPath));
                        if (prefsParams.lastActiveScene) {
                            targetScene = prefsParams.lastActiveScene;
                        }
                    }
                } catch (e) { }

                // Load Scene Data
                const scenePath = `${folderPath}/_scenes/${targetScene}.json`;
                if (await dc.app.vault.adapter.exists(scenePath)) {
                    const content = await dc.app.vault.adapter.read(scenePath);
                    const state = JSON.parse(content);
                    if (active) {
                        setSequence(Array.isArray(state.sequence) ? state.sequence : []);
                        setActiveBackground(state.activeBackground || 'GradientBackground');
                        if (typeof state.zoom === 'number') setZoom(state.zoom);
                        if (state.sidebarTab) setSidebarTab(state.sidebarTab);
                    }
                } else if (active) {
                    // Fallback to empty if active scene file is missing
                    setSequence([]);
                    if (libraryComponents && libraryComponents['PureBlack']) setActiveBackground('PureBlack');
                }

                if (active) setActiveScene(targetScene);

            } catch (e) {
                console.error("[useSceneManager] Load failed:", e);
            } finally {
                if (active) setHasLoadedState(true);
            }
        }
        loadScenesAndProject();
        return () => { active = false; };
    }, [libraryComponents, isInception, ensureScenesDir, folderPath, refreshScenes]);

    // Auto-Save
    useEffect(() => {
        if (!hasLoadedState || isInception) return;
        const timer = setTimeout(saveProject, 800);
        return () => clearTimeout(timer);
    }, [sequence, activeBackground, zoom, sidebarTab, hasLoadedState, saveProject, isInception]);

    // Save on Unmount/Close
    useEffect(() => {
        return () => {
            if (hasLoadedState && !isInception) saveProject();
        };
    }, [hasLoadedState, isInception, saveProject]);


    // Handlers
    const handleCreateScene = async () => {
        await saveProject();
        let newName;
        let counter = scenesList.length + 1;
        do {
            newName = `Scene ${counter}`;
            counter++;
        } while (scenesList.includes(newName));

        setScenesList(prev => [...prev, newName].sort());
        setSequence([]);
        setActiveBackground('GradientBackground');
        setZoom(4);
        if (onHistoryAction) onHistoryAction.clear(); // Clear local history for new scene
        setActiveScene(newName);
    };

    const handleSelectScene = async (name) => {
        if (name === activeScene) return;
        await saveProject();
        setHasLoadedState(false);
        setActiveScene(name);

        try {
            const scenePath = `${folderPath}/_scenes/${name}.json`;
            if (await dc.app.vault.adapter.exists(scenePath)) {
                const content = await dc.app.vault.adapter.read(scenePath);
                const state = JSON.parse(content);
                setSequence(state.sequence || []);
                setActiveBackground(state.activeBackground || 'GradientBackground');
                if (typeof state.zoom === 'number') setZoom(state.zoom);
            } else {
                setSequence([]);
            }
            if (onHistoryAction) onHistoryAction.clear();
        } catch (e) {
            console.error("Failed to swap scene", e);
        } finally {
            setHasLoadedState(true);
        }
    };

    const handleRenameScene = async (oldName, newName) => {
        if (!newName || !newName.trim()) return;
        const cleanNewName = newName.trim();
        if (cleanNewName === oldName) return;
        if (scenesList.includes(cleanNewName)) {
            alert("A scene with this name already exists.");
            return;
        }

        try {
            await saveProject();
            const oldPath = `${folderPath}/_scenes/${oldName}.json`;
            const newPath = `${folderPath}/_scenes/${cleanNewName}.json`;
            if (await dc.app.vault.adapter.exists(oldPath)) {
                await dc.app.vault.adapter.rename(oldPath, newPath);
            }
            setScenesList(prev => prev.map(s => s === oldName ? cleanNewName : s).sort());
            if (activeScene === oldName) setActiveScene(cleanNewName);
        } catch (e) {
            console.error("Rename failed:", e);
        }
    };

    const handleDeleteScene = async (name) => {
        if (scenesList.length <= 1) return alert("Cannot delete the last scene.");
        if (!confirm(`Delete scene "${name}"?`)) return;

        try {
            const scenePath = `${folderPath}/_scenes/${name}.json`;
            await dc.app.vault.adapter.remove(scenePath);
            const newList = scenesList.filter(s => s !== name);
            setScenesList(newList);
            if (activeScene === name) handleSelectScene(newList[0]);
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    // --- Dynamic Background Defaulting ---
    useEffect(() => {
        // Identify valid background components
        const backgroundComponents = !libraryComponents ? [] : Object.keys(libraryComponents).filter(name => {
            const Comp = libraryComponents[name];
            const catItem = Comp.metadata?.find(m => m.id === 'category');
            return catItem?.default === 'background';
        });

        // If current activeBackground is invalid or missing, pick first available
        if (hasLoadedState && libraryComponents && backgroundComponents.length > 0) {
            const isCurrentValid = libraryComponents[activeBackground];
            if (!activeBackground || !isCurrentValid) {
                console.log(`[useSceneManager] Background '${activeBackground}' not found. Defaulting to '${backgroundComponents[0]}'`);
                setActiveBackground(backgroundComponents[0]);
            }
        }
    }, [libraryComponents, hasLoadedState, activeBackground]);

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
