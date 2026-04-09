const { useEffect, useState, useRef } = dc;
const crypto = require('crypto');
const { spawn } = require('child_process');

function useObsClient({ obsHost, obsPort, obsPassword, reconnectTrigger, autoRepairEnabled }) {
    const [obsStatus, setObsStatus] = useState("disconnected");
    const [obsScenes, setObsScenes] = useState([]);
    const [obsSceneItems, setObsSceneItems] = useState([]);
    const [activeProgramScene, setActiveProgramScene] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [obsMonitors, setObsMonitors] = useState([]); // Added
    const [obsScreenshot, setObsScreenshot] = useState(null);
    const [focusInputSettings, setFocusInputSettings] = useState(null);

    const obsProxyRef = useRef(null);

    // Helper to send messages (OBS V5 Request)
    const sendObsMessage = (requestType, requestData) => {
        if (obsProxyRef.current?.readyState === WebSocket.OPEN) {
            obsProxyRef.current.send(JSON.stringify({
                op: 6, // Request
                d: {
                    requestType,
                    requestId: Math.random().toString(36).substring(7),
                    requestData
                }
            }));
        }
    };

    const getInputSettings = (inputName) => {
        setFocusInputSettings(null);
        sendObsMessage('GetInputSettings', { inputName });
    };

    const createInput = (sceneName, inputName, inputKind, inputSettings) => {
        sendObsMessage('CreateInput', {
            sceneName,
            inputName,
            inputKind,
            inputSettings,
            sceneItemEnabled: true
        });
    };

    const setInputSettings = (inputName, inputSettings) => {
        sendObsMessage('SetInputSettings', {
            inputName,
            inputSettings,
            overlay: true
        });
    };

    const removeSceneItem = (sceneName, sceneItemId) => {
        sendObsMessage('RemoveSceneItem', {
            sceneName,
            sceneItemId
        });
    };

    const createScene = (sceneName) => {
        sendObsMessage('CreateScene', { sceneName });
    };

    const removeScene = (sceneName) => {
        sendObsMessage('RemoveScene', { sceneName });
    };

    const toggleStreaming = () => sendObsMessage('ToggleStream');
    const toggleRecording = () => sendObsMessage('ToggleRecord');
    const toggleSceneItem = (scene, id, enabled) => sendObsMessage('SetSceneItemEnabled', { sceneName: scene, sceneItemId: id, sceneItemEnabled: enabled });
    const fetchSceneItems = (scene) => sendObsMessage('GetSceneItemList', { sceneName: scene });
    const fetchScreenshot = (scene) => sendObsMessage('GetSourceScreenshot', { sourceName: scene, imageFormat: 'jpeg', imageWidth: 480 });
    const fetchMonitors = () => sendObsMessage('GetMonitorList'); // Added

    const restartActiveCapture = () => {
        if (!obsSceneItems.length) return;
        obsSceneItems.forEach(item => {
            if (item.sourceName.includes("Capture") || item.inputKind?.includes("capture")) {
                console.log("Restarting capture source:", item.sourceName);
                toggleSceneItem(activeProgramScene, item.sceneItemId, false);
                setTimeout(() => {
                    toggleSceneItem(activeProgramScene, item.sceneItemId, true);
                }, 500);
            }
        });
    };

    useEffect(() => {
        const startProxy = async () => {
            if (obsProxyRef.current) { obsProxyRef.current.close(); }

            // Auto-launch check
            try {
                const checkProcess = spawn('pgrep', ['-x', 'OBS']);
                checkProcess.on('close', (code) => {
                    if (code !== 0 && autoRepairEnabled) {
                        console.log("OBS not running.");
                    }
                });
            } catch (e) { console.error("OBS check failed:", e); }

            console.log(`[OBS] Hook connecting to ws://${obsHost}:${obsPort}...`);
            const obsProxy = new WebSocket(`ws://${obsHost}:${obsPort}`);

            obsProxy.onopen = () => console.log("[OBS] WebSocket Opened.");
            obsProxy.onclose = (e) => {
                console.log("[OBS] Closed:", e.code);
                setObsStatus('disconnected');
            };
            obsProxy.onerror = (e) => {
                console.error("[OBS] Error:", e);
                setObsStatus('disconnected');
            };

            obsProxy.onmessage = (msg) => {
                const data = JSON.parse(msg.data);

                if (data.op === 0) {
                    const { authentication } = data.d;
                    let authString;
                    if (authentication && obsPassword) {
                        const secretHash = crypto.createHash('sha256').update(obsPassword + authentication.salt).digest('base64');
                        authString = crypto.createHash('sha256').update(secretHash + authentication.challenge).digest('base64');
                    }

                    const identifyPayload = {
                        op: 1,
                        d: {
                            rpcVersion: 1,
                            eventSubscriptions: 1 | 4 | 64 | 128,
                        }
                    };
                    if (authString) identifyPayload.d.authentication = authString;
                    obsProxy.send(JSON.stringify(identifyPayload));
                }

                if (data.op === 2) {
                    setObsStatus('connected');
                    obsProxy.send(JSON.stringify({ op: 6, d: { requestType: 'GetSceneList', requestId: 'init-scenes' } }));
                }

                if (data.op === 5) {
                    const { eventType, eventData } = data.d;
                    if (eventType === 'StreamStateChanged') setIsStreaming(eventData.outputActive);
                    if (eventType === 'RecordStateChanged') setIsRecording(eventData.outputActive);
                    if (eventType === 'CurrentProgramSceneChanged') setActiveProgramScene(eventData.sceneName);

                    // Reactive Sync for Scenes
                    if (['SceneCreated', 'SceneRemoved', 'SceneNameChanged', 'CurrentSceneCollectionChanged'].includes(eventType)) {
                        sendObsMessage('GetSceneList');
                    }

                    // Reactive Sync for Scene Items
                    if (['SceneItemCreated', 'SceneItemRemoved', 'SceneItemListReindexed'].includes(eventType)) {
                        // Refresh the list for the scene that was modified (if it's the one we're looking at)
                        sendObsMessage('GetSceneItemList', { sceneName: eventData.sceneName });
                    }

                    if (eventType === 'SceneItemEnableStateChanged') {
                        // Update local state for visibility toggles if the scene matches
                        // We could trigger a full refresh or surgically update the state.
                        // For robustness, let's refresh the current list.
                        sendObsMessage('GetSceneItemList', { sceneName: eventData.sceneName });
                    }
                }

                if (data.op === 7) {
                    if (data.d.requestType === 'GetSceneList') {
                        setObsScenes(data.d.responseData.scenes.reverse());
                        setActiveProgramScene(data.d.responseData.currentProgramSceneName);
                    }
                    if (data.d.requestType === 'GetSceneItemList') setObsSceneItems(data.d.responseData.sceneItems);
                    if (data.d.requestType === 'GetMonitorList') setObsMonitors(data.d.responseData.monitors); // Added
                    if (data.d.requestType === 'GetSourceScreenshot' && data.d.responseData?.imageData) {
                        setObsScreenshot(data.d.responseData.imageData);
                    }
                    if (data.d.requestType === 'GetInputSettings') {
                        if (data.d.requestStatus.result) {
                            setFocusInputSettings(data.d.responseData.inputSettings);
                        }
                    }
                }
            };
            obsProxyRef.current = obsProxy;
        };

        startProxy();
        return () => obsProxyRef.current?.close();
    }, [obsHost, obsPort, obsPassword, reconnectTrigger]);

    return {
        obsStatus,
        obsScenes,
        obsSceneItems,
        activeProgramScene,
        isStreaming,
        isRecording,
        obsMonitors, // Added
        obsScreenshot,
        focusInputSettings,
        sendObsMessage,
        getInputSettings,
        createInput,
        setInputSettings,
        removeSceneItem,
        createScene,
        removeScene,
        toggleStreaming,
        toggleRecording,
        toggleSceneItem,
        fetchSceneItems,
        fetchScreenshot,
        fetchMonitors, // Added
        restartActiveCapture
    };
}

return { useObsClient };
