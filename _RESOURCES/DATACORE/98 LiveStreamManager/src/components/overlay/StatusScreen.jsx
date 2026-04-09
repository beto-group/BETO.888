const activeFile = dc.app.workspace.getActiveFile().path;
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { OverlayLogo } = await dc.require(folderPath + '/src/components/overlay/OverlayLogo.jsx');
const { MatrixBackground } = await dc.require(folderPath + '/src/components/overlay/MatrixBackground.jsx');
const { SocialLinks } = await dc.require(folderPath + '/src/components/overlay/SocialLinks.jsx');
const { ChatPreview } = await dc.require(folderPath + '/src/components/overlay/ChatPreview.jsx');

function StatusScreen({ title, subtitle, messages, onReturn }) {
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
            <div style={{ zIndex: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: '40px' }}>
                    <OverlayLogo size={450} animated={true} />
                </div>

                <div style={{
                    fontSize: '48px', // Match Lobby "Starting Soon" size
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    margin: 0,
                    marginBottom: '20px',
                    lineHeight: 1,
                    textShadow: '0 0 30px rgba(160, 118, 249, 0.3)'
                }}>
                    {title}
                </div>

                <div style={{
                    fontSize: '32px', // Match Lobby subtext size
                    fontWeight: '300',
                    opacity: 0.5,
                    letterSpacing: '5px',
                    textTransform: 'uppercase',
                    color: '#fff'
                }}>
                    {subtitle || 'Current Status'}
                </div>


                {/* 
                    [REMOVED] Return to Selector Button 
                    User Feedback: "we shouldnt see the return to selector button on the different state"
                    Navigation is handled via hotkeys (0 for Lobby/Selector)
                */}
            </div>

            {/* Bottom Right: Socials */}
            <SocialLinks style={{ position: 'absolute', bottom: '50px', right: '50px', zIndex: 10 }} />

        </div>
    );
}

return { StatusScreen };
