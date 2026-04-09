function LobbyStatus({ mainText = "Starting Soon", subText = "STREAM" }) {
    return (
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>
                {mainText}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '300', opacity: 0.5, letterSpacing: '5px' }}>
                {subText}
            </div>
        </div>
    );
}

return { LobbyStatus };
