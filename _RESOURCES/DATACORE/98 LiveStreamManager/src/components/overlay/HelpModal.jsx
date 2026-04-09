function HelpModal({ onClose }) {
    return (
        <div style={{
            position: 'absolute', // Relative to Overlay Container
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif'
        }} onClick={onClose}>
            <div style={{
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '40px',
                width: '600px',
                maxWidth: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: '#fff',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                <h2 style={{
                    marginTop: 0,
                    marginBottom: '30px',
                    fontSize: '32px',
                    fontWeight: 800,
                    color: '#a076f9',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Control Legend
                    <div style={{ fontSize: '12px', color: '#71717a', fontWeight: 500, marginTop: '5px', letterSpacing: '0' }}>
                        KEYBOARD SHORTCUTS & COMMANDS
                    </div>
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <ShortcutKey keyName="0" label="Return to Lobby" />
                    <ShortcutKey keyName="1" label="Scene: Starting Soon" />
                    <ShortcutKey keyName="2" label="Scene: Privacy Screen" />
                    <ShortcutKey keyName="3" label="Scene: Be Right Back" />
                    <ShortcutKey keyName="4" label="Scene: Ending Stream" />
                    <ShortcutKey keyName="5" label="Scene: OBS Engine" />
                    <ShortcutKey keyName="6" label="Scene: Bot Control" />
                    <ShortcutKey keyName="C" label="Toggle Chat Window" />
                    <ShortcutKey keyName="F / Esc" label="Toggle Fullscreen" />
                    <ShortcutKey keyName="M" label="Toggle Manager UI" />
                    <ShortcutKey keyName="[ / ]" label="Adjust Timer" />
                    <ShortcutKey keyName="Shift + 1-6" label="Scene Only (No Fullscreen)" />
                    <ShortcutKey keyName="H" label="Toggle This Menu" />
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 30px',
                            background: '#a076f9',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
}

function ShortcutKey({ keyName, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                padding: '8px 12px',
                minWidth: '60px',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 2px 0 #3f3f46'
            }}>
                {keyName}
            </div>
            <div style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: 600 }}>
                {label}
            </div>
        </div>
    );
}

return { HelpModal };
