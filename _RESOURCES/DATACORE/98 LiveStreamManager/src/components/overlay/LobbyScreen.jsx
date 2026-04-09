const { useState, useEffect } = dc;
const activeFile = dc.app.workspace.getActiveFile().path;
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

// Import Logo
const { OverlayLogo } = await dc.require(folderPath + '/src/components/overlay/OverlayLogo.jsx');
const { MatrixBackground } = await dc.require(folderPath + '/src/components/overlay/MatrixBackground.jsx');
const { SocialLinks } = await dc.require(folderPath + '/src/components/overlay/SocialLinks.jsx');
const { ChatPreview } = await dc.require(folderPath + '/src/components/overlay/ChatPreview.jsx');
const { CountdownDisplay } = await dc.require(folderPath + '/src/components/overlay/CountdownDisplay.jsx');
const { LobbyStatus } = await dc.require(folderPath + '/src/components/overlay/LobbyStatus.jsx');

function LobbyScreen({ styles, countdown, messages }) {

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
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden'
        }}>
            {/* Matrix Rain Background */}
            <MatrixBackground
                mainColor="#a076f9" // Purple
                leadColor="#d8b4fe" // Pinkish-Purple
                frequency={0.2}
            />

            {/* Top Left: Chat Preview */}
            <ChatPreview messages={messages} />


            {/* Center Content */}
            <div style={{ zIndex: 20, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: '40px' }}>
                    <OverlayLogo size={450} animated={true} />
                </div>

                <CountdownDisplay countdown={countdown} />
                <LobbyStatus mainText="Starting Soon" subText="STREAM" />
            </div>

            {/* Socials - Bottom Right */}
            <SocialLinks style={{ position: 'absolute', bottom: '50px', right: '50px', zIndex: 10 }} />

        </div>
    );
}

return { LobbyScreen };
