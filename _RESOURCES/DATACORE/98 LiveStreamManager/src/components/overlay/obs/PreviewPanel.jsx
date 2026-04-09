function PreviewPanel({ targetPreviewScene, activeProgramScene, obsScreenshot }) {
    return (
        <div style={containerStyle}>
            <div style={panelHeaderStyle}>LIVE PREVIEW</div>
            <div style={previewBoxStyle}>
                {/* Status Badge */}
                <div style={badgeContainerStyle}>
                    <div style={{ ...badgeStyle, background: '#059669' }}>STABLE</div>
                    <div style={{ ...badgeStyle, background: '#1d4ed8' }}>60 FPS</div>
                    {targetPreviewScene === activeProgramScene && (
                        <div style={{ ...badgeStyle, background: '#dc2626' }}>LIVE OUTPUT</div>
                    )}
                </div>

                {obsScreenshot ? (
                    <img
                        src={obsScreenshot}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        alt="Live Preview"
                    />
                ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5 }}>
                        <h1 style={{ fontSize: '48px', margin: 0, fontWeight: '900', color: '#27272a' }}>
                            {targetPreviewScene ? targetPreviewScene.toUpperCase() : 'NO SIGNAL'}
                        </h1>
                        <div style={{ fontSize: '12px', letterSpacing: '2px', marginTop: '10px', color: '#52525b' }}>
                            {targetPreviewScene ? 'FETCHING FEED...' : 'WAITING FOR CONNECTION...'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const containerStyle = {
    height: '50%',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
};

const panelHeaderStyle = {
    fontSize: '9px',
    fontWeight: '900',
    color: '#71717a',
    letterSpacing: '1px',
    padding: '0 0 10px 0'
};

const previewBoxStyle = {
    width: '100%',
    height: 'calc(100% - 30px)',
    background: '#050505',
    borderRadius: '16px',
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.03)'
};

const badgeContainerStyle = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    display: 'flex',
    gap: '8px',
    zIndex: 10
};

const badgeStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#fff'
};

return { PreviewPanel };
