const activeFile = dc.app.workspace.getActiveFile().path;
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

// Import Modular Components Correctly
const { LobbyScreen } = await dc.require(folderPath + '/src/components/overlay/LobbyScreen.jsx');
const { StreamStateSelector } = await dc.require(folderPath + '/src/components/overlay/StreamStateSelector.jsx');
const { ChatOverlay } = await dc.require(folderPath + '/src/components/overlay/ChatOverlay.jsx');
const { StatusScreen } = await dc.require(folderPath + '/src/components/overlay/StatusScreen.jsx');
const { HelpModal } = await dc.require(folderPath + '/src/components/overlay/HelpModal.jsx');
const { ObsEngineScreen } = await dc.require(folderPath + '/src/components/overlay/ObsEngineScreen.jsx');

function LiveStreamOverlay(props) {
    const {
        currentScene,
        onSelectScene,
        apiKey,
        videoId,
        oauthToken,
        styles,
        messages = [],
        liveChatId,
        setLiveChatId,
        countdown,
        obsStatus,
        obsScenes,
        obsSceneItems,
        toggleSceneItem,
        fetchSceneItems,
        isStreaming,
        isRecording,
        toggleStreaming,
        toggleRecording,
        sceneMap,
        activeProgramScene,
        createInput,
        setInputSettings,
        getInputSettings,
        focusInputSettings,
        removeSceneItem,
        onSendMessage
    } = props;

    // Keyboard Shortcuts & Chat Controller
    const chatRef = dc.useRef(null);
    const { useEffect, useState, useRef } = dc;

    // Helper state for help modal
    const [isHelpOpen, setIsHelpOpen] = useState(false);


    const renderContent = () => {
        if (currentScene === null || currentScene === 'bot-control') {
            return <StreamStateSelector {...props} toggleFullscreen={props.toggleFullscreen} />;
        }

        if (currentScene === 'obs-engine') {
            return (
                <ObsEngineScreen
                    {...props}
                    obsStatus={obsStatus}
                    obsScenes={obsScenes}
                    activeProgramScene={activeProgramScene}
                    createInput={props.createInput}
                    setInputSettings={props.setInputSettings}
                    getInputSettings={props.getInputSettings}
                    focusInputSettings={props.focusInputSettings}
                    removeSceneItem={props.removeSceneItem}
                    createScene={props.createScene}
                    removeScene={props.removeScene}
                    fetchSceneItems={fetchSceneItems}
                    isStreaming={isStreaming}
                    isRecording={isRecording}
                    toggleStreaming={toggleStreaming}
                    toggleRecording={toggleRecording}
                    sceneMap={sceneMap}
                    obsMonitors={props.obsMonitors}
                    fetchMonitors={props.fetchMonitors}
                    availableWindows={props.availableWindows}
                    fetchAvailableWindows={props.fetchAvailableWindows}
                    onModalToggle={props.onModalToggle}
                    launchOBS={props.launchOBS}
                    setReconnectTrigger={props.setReconnectTrigger}
                    obsHost={props.obsHost} setObsHost={props.setObsHost}
                    obsPort={props.obsPort} setObsPort={props.setObsPort}
                    obsPassword={props.obsPassword} setObsPassword={props.setObsPassword}
                />
            );
        }

        if (currentScene === 'starting') {
            return <LobbyScreen styles={styles} countdown={countdown} messages={messages} onReturn={() => onSelectScene(null)} />;
        }

        if (currentScene === 'privacy') {
            return <StatusScreen title="Privacy Screen" subtitle="Stream is Hidden" messages={messages} onReturn={() => onSelectScene(null)} />;
        }
        if (currentScene === 'brb') {
            return <StatusScreen title="Be Right Back" subtitle="Don't go anywhere" messages={messages} onReturn={() => onSelectScene(null)} />;
        }
        if (currentScene === 'ending') {
            return <StatusScreen title="Stream Ending" subtitle="Thanks for watching" messages={messages} onReturn={() => onSelectScene(null)} />;
        }

        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#fff',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', opacity: 0.5, marginBottom: '10px' }}>CURRENT SCENE</div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#a076f9', textTransform: 'uppercase' }}>
                        {currentScene || 'LIVE'}
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        const toggleHelp = () => setIsHelpOpen(prev => !prev);
        const toggleChat = () => { if (chatRef.current) chatRef.current.toggleChat(); };

        window.addEventListener('toggle-help', toggleHelp);
        window.addEventListener('toggle-chat', toggleChat);
        return () => {
            window.removeEventListener('toggle-help', toggleHelp);
            window.removeEventListener('toggle-chat', toggleChat);
        };
    }, []);

    return (
        <div style={{ ...styles.overlayContainer, position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
            {/* Main Content Layer */}
            {renderContent()}

            {/* Logical Layers */}
            <ChatOverlay
                styles={styles}
                apiKey={apiKey}
                videoId={videoId}
                accessToken={oauthToken}
                liveChatId={liveChatId}
                onRef={(ref) => { chatRef.current = ref; }}
                messages={messages}
                onSendMessage={onSendMessage}
            />

            {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
        </div>
    );
}

return { LiveStreamOverlay };
