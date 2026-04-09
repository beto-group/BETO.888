const activeFile = dc.app.workspace.getActiveFile().path;
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { MatrixBackground } = await dc.require(folderPath + '/src/components/overlay/MatrixBackground.jsx');
const { OverlayLogo } = await dc.require(folderPath + '/src/components/overlay/OverlayLogo.jsx');
const { ChatPreview } = await dc.require(folderPath + '/src/components/overlay/ChatPreview.jsx');

function StreamStateSelector(props) {
    const {
        currentScene,
        onSelectScene,
        apiKey, setApiKey,
        videoId, setVideoId,
        oauthToken, setOauthToken,
        clientId, setClientId,
        clientSecret, setClientSecret,
        refreshToken, setRefreshToken,
        obsHost, setObsHost,
        obsPort, setObsPort,
        obsPassword, setObsPassword,
        obsStatus, onReconnect,
        botApiKey, setBotApiKey,
        botClientId, setBotClientId,
        botClientSecret, setBotClientSecret,
        botRefreshToken, setBotRefreshToken,
        botOauthToken,
        refreshBotAccessToken,
        botEnabled, setBotEnabled,
        refreshAccessToken,
        toggleFullscreen,
        isStreaming,
        isRecording,
        toggleStreaming,
        toggleRecording,
        messages = []
    } = props;

    const [showSettings, setShowSettings] = dc.useState(false);

    const handleStateClick = (e, sceneId) => {
        onSelectScene(sceneId);

        // Utility scenes should NEVER trigger fullscreen
        if (sceneId === 'obs-engine' || sceneId === 'bot-control') {
            return;
        }

        // If Shift is pressed, DO NOT enter fullscreen (remain normal).
        // If Shift is NOT pressed, enter fullscreen if available.
        if (!e.shiftKey && toggleFullscreen) {
            // Check if already fullscreen to avoid toggling OUT
            if (!document.fullscreenElement) {
                toggleFullscreen();
            }
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: '100px'
        }}>
            {/* Matrix Rain Background */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                <MatrixBackground
                    mainColor="#a076f9"
                    leadColor="#d8b4fe"
                    frequency={0.2}
                />
            </div>

            {/* Top Left: Chat Preview */}
            <ChatPreview messages={messages} />

            {/* Header Section */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(30px)',
                paddingTop: '20px',
                paddingBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderBottom: '1px solid #27272a'
            }}>
                <div style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <OverlayLogo size={70} />
                    <h1 style={{
                        fontSize: '42px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '-2px',
                        margin: 0,
                        lineHeight: 0.9,
                        background: 'linear-gradient(to bottom, #fff, #a1a1aa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Select Stream State
                    </h1>
                </div>

                {/* Stream Controls */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <StatusButton
                        active={isStreaming}
                        label={isStreaming ? "END STREAM" : "GO LIVE"}
                        icon="radio"
                        color="#ef4444"
                        onClick={toggleStreaming}
                    />
                    <StatusButton
                        active={isRecording}
                        label={isRecording ? "STOP RECORDING" : "START RECORDING"}
                        icon="circle"
                        color="#a076f9"
                        onClick={toggleRecording}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    gap: '20px',
                    width: '100%',
                    maxWidth: '1280px',
                    justifyContent: 'flex-start', // Align to start for scroll consistency
                    flexWrap: 'nowrap', // FORCE ONE ROW
                    padding: '20px 40px',
                    overflowX: 'auto', // Enable horizontal scroll
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: '30px' // Extra space for shadow/hover
                }}>
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                    <StateCard
                        id="starting"
                        icon="hourglass"
                        label="Starting Soon"
                        active={currentScene === 'starting'}
                        onClick={(e) => handleStateClick(e, 'starting')}
                    />
                    <StateCard
                        id="privacy"
                        icon="shield"
                        label="Privacy Screen"
                        active={currentScene === 'privacy'}
                        onClick={(e) => handleStateClick(e, 'privacy')}
                    />
                    <StateCard
                        id="brb"
                        icon="coffee"
                        label="Be Right Back"
                        active={currentScene === 'brb'}
                        onClick={(e) => handleStateClick(e, 'brb')}
                    />
                    <StateCard
                        id="ending"
                        icon="clapperboard"
                        label="Ending Stream"
                        active={currentScene === 'ending'}
                        onClick={(e) => handleStateClick(e, 'ending')}
                    />
                    <StateCard
                        id="bot-control"
                        icon="bot"
                        label="Bot Control"
                        active={currentScene === 'bot-control'}
                        onClick={(e) => handleStateClick(e, 'bot-control')}
                    />
                    <StateCard
                        id="obs-engine"
                        icon="cpu"
                        label="OBS Engine"
                        active={currentScene === 'obs-engine'}
                        onClick={(e) => handleStateClick(e, 'obs-engine')}
                    />
                </div>
            </div>

            {/* Hint removed as requested */}

            {/* Integration Button */}
            <div style={{ marginTop: '50px', zIndex: 10, position: 'relative' }}>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        padding: '12px 30px',
                        background: 'transparent',
                        border: '1px solid #a076f9',
                        borderRadius: '30px',
                        color: '#a076f9',
                        fontWeight: '800',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: showSettings ? '0 10px 30px rgba(160, 118, 249, 0.4)' : 'none'
                    }}
                >
                    <dc.Icon icon={showSettings ? "chevron-up" : "settings"} style={{ width: 14 }} />
                    {showSettings ? 'Close Configurator' : 'Configure Broadcast'}
                </button>
            </div>

            {/* Dynamic Settings Panel */}
            {showSettings && (
                <div style={{
                    marginTop: '30px',
                    width: '100%',
                    maxWidth: '1400px', // Massive max-width
                    margin: '30px auto',
                    padding: '40px',
                    background: 'rgba(9, 9, 11, 0.98)',
                    border: '1px solid #27272a',
                    borderRadius: '24px',
                    zIndex: 10,
                    position: 'relative',
                    backdropFilter: 'blur(30px)',
                    animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
                }}>
                    <style>{`
                        @keyframes slideUp {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                        gap: '40px',
                        alignItems: 'start'
                    }}>
                        {/* COLUMN 1: MAIN ACCOUNT */}
                        <div style={sectionWrapperStyle}>
                            <div style={sectionHeaderStyle}>
                                <dc.Icon icon="user" style={{ width: 14 }} />
                                MAIN CREATOR ACCOUNT
                            </div>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>LIVE VIDEO ID / SLUG</label>
                                <input style={inputStyle} type="text" value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="e.g. dQw4w9WgXcQ" />
                            </div>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>YOUTUBE API KEY</label>
                                <input style={inputStyle} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza..." />
                            </div>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>CLIENT ID</label>
                                <input style={inputStyle} type="password" value={clientId} onChange={(e) => setClientId(e.target.value)} />
                            </div>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>CLIENT SECRET</label>
                                <input style={inputStyle} type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
                            </div>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>REFRESH TOKEN</label>
                                <input style={inputStyle} type="password" value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)} />
                            </div>
                            <button onClick={refreshAccessToken} style={refreshButtonStyle}>
                                <dc.Icon icon="rotate-cw" style={{ width: 12 }} />
                                REFRESH MAIN ACCESS TOKEN
                            </button>
                        </div>

                        {/* COLUMN 2: TECHNICAL & BOT TOGGLE */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={sectionWrapperStyle}>
                                <div style={sectionHeaderStyle}>
                                    <dc.Icon icon="bot" style={{ width: 14 }} />
                                    BOT CONTROLLER
                                </div>
                                <div
                                    onClick={() => setBotEnabled(!botEnabled)}
                                    style={toggleWrapperStyle}
                                >
                                    <span style={{ color: botEnabled ? '#a076f9' : '#71717a', fontWeight: '900', fontSize: '10px', letterSpacing: '1px' }}>ENABLE BOT AUTO-RESPONSE</span>
                                    <div style={{ width: 34, height: 18, borderRadius: 10, background: botEnabled ? '#a076f9' : '#27272a', position: 'relative' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: botEnabled ? 18 : 4, transition: 'all 0.3s' }} />
                                    </div>
                                </div>
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>GROQ API KEY (AI BRAIN)</label>
                                    <input style={inputStyle} type="password" value={botApiKey} onChange={(e) => setBotApiKey(e.target.value)} />
                                </div>
                            </div>

                            <div style={sectionWrapperStyle}>
                                <div style={sectionHeaderStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <dc.Icon icon="monitor" style={{ width: 14 }} />
                                        OBS ENGINE
                                    </div>
                                    <div style={{ fontSize: '9px', color: obsStatus === 'connected' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                        {obsStatus.toUpperCase()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ ...fieldGroupStyle, flex: 2 }}>
                                        <label style={labelStyle}>HOST</label>
                                        <input style={inputStyle} value={obsHost} onChange={(e) => setObsHost(e.target.value)} placeholder="localhost" />
                                    </div>
                                    <div style={{ ...fieldGroupStyle, flex: 1 }}>
                                        <label style={labelStyle}>PORT</label>
                                        <input style={inputStyle} value={obsPort} onChange={(e) => setObsPort(e.target.value)} placeholder="4455" />
                                    </div>
                                </div>
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>PASSWORD</label>
                                    <input style={inputStyle} type="password" value={obsPassword} onChange={(e) => setObsPassword(e.target.value)} />
                                </div>
                            </div>

                            <div style={sectionWrapperStyle}>
                                <div style={sectionHeaderStyle}>
                                    <dc.Icon icon="sparkles" style={{ width: 14 }} />
                                    AI CORE
                                </div>
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>PROMPT FILE PATH</label>
                                    <input style={inputStyle} type="text" value={props.botPromptPath || ''} onChange={(e) => props.setBotPromptPath(e.target.value)} placeholder="path/to/prompt.md" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Socials - Footer */}
            <div style={{
                marginTop: '100px',
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
                zIndex: 10,
                position: 'relative',
                padding: '30px',
                borderTop: '1px solid #ffffff11',
                opacity: 0.6
            }}>
                <div style={socialStyle}><dc.Icon icon="youtube" style={{ width: 18 }} /> @BETO_GROUP</div>
                <div style={socialStyle}><dc.Icon icon="instagram" style={{ width: 18 }} /> @BETO.GROUP</div>
                <div style={socialStyle}><dc.Icon icon="twitter" style={{ width: 18 }} /> @X_BETO_GROUP</div>
                <div style={socialStyle}><dc.Icon icon="message-circle" style={{ width: 18 }} /> JOIN DISCORD</div>
            </div>
        </div>
    );
}

const sectionHeaderStyle = {
    fontSize: '11px',
    fontWeight: '900',
    color: '#a1a1aa',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    justifyContent: 'space-between'
};

const inputStyle = {
    background: '#0a0a0b',
    border: '1px solid #27272a',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'monospace'
};

const sectionWrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
};

const fieldGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
};

const labelStyle = {
    fontSize: '9px',
    fontWeight: '900',
    color: '#71717a',
    letterSpacing: '1px',
    textTransform: 'uppercase'
};

const refreshButtonStyle = {
    padding: '12px',
    background: '#a076f911',
    border: '1px dashed #a076f944',
    borderRadius: '8px',
    color: '#a076f9',
    fontSize: '10px',
    fontWeight: '900',
    letterSpacing: '1px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '10px',
    transition: 'all 0.3s'
};

const toggleWrapperStyle = {
    padding: '12px 18px',
    background: '#0a0a0b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    marginTop: '10px'
};

const socialStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: '1px'
};

function StateCard({ id, icon, label, active, onClick }) {
    return (
        <div
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = '#a076f966';
                e.currentTarget.style.background = 'rgba(160, 118, 249, 0.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = active ? '#a076f9' : '#27272a';
                e.currentTarget.style.background = active ? 'rgba(160, 118, 249, 0.08)' : 'transparent';
            }}
            style={{
                width: '240px',
                flexShrink: 0,
                height: '320px',
                border: `2px solid ${active ? '#a076f9' : '#27272a'}`,
                background: active ? 'rgba(160, 118, 249, 0.08)' : 'transparent',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: '30px',
                position: 'relative',
                zIndex: 20,
                boxShadow: active ? '0 10px 40px rgba(160, 118, 249, 0.15)' : 'none'
            }}
        >
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: active ? '#a076f9' : '#18181b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '40px',
                transition: 'all 0.4s'
            }}>
                <dc.Icon
                    icon={icon}
                    style={{
                        width: '32px',
                        height: '32px',
                        color: active ? '#fff' : '#71717a',
                        transition: 'all 0.4s'
                    }}
                />
            </div>
            <span style={{
                fontSize: '20px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'center',
                color: active ? '#fff' : '#71717a',
                lineHeight: 1.2
            }}>
                {label}
            </span>

            {active && (
                <div style={{
                    position: 'absolute',
                    bottom: '25px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#a076f9',
                    boxShadow: '0 0 10px #a076f9'
                }} />
            )}
        </div>
    );
}

function StatusButton({ active, label, icon, color, onClick }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: active ? color : 'rgba(255,255,255,0.05)',
                border: '1px solid',
                borderColor: active ? color : 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '900',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.3s'
            }}
        >
            <dc.Icon icon={icon} style={{ width: 12 }} />
            {label}
        </button>
    );
}

return { StreamStateSelector };
