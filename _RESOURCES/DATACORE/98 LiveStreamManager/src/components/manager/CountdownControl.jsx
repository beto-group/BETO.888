function CountdownControl({ countdown, setCountdown, isPaused, setIsPaused, addTime, setPreset }) {
    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '9px', fontWeight: '900', color: '#71717a', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Countdown Management
            </label>
            <div style={{ display: 'flex', gap: '8px', background: '#0a0a0b', border: '1px solid #1f1f22', borderRadius: '8px', padding: '4px' }}>
                <input
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '800',
                        paddingLeft: '12px',
                        outline: 'none',
                        fontFamily: 'monospace'
                    }}
                    value={countdown}
                    onChange={(e) => setCountdown(e.target.value)}
                    placeholder="00:00"
                />
                <button
                    style={{
                        padding: '10px 15px',
                        background: isPaused ? '#a076f922' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: isPaused ? '#a076f9' : '#71717a',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => setIsPaused(!isPaused)}
                >
                    <dc.Icon icon={isPaused ? "play" : "pause"} style={{ width: 16 }} />
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <QuickButton onClick={() => addTime(1)}>+1 MIN</QuickButton>
                <QuickButton onClick={() => addTime(5)}>+5 MIN</QuickButton>
                <QuickButton onClick={() => addTime(-1)}>-1 MIN</QuickButton>
                <QuickButton onClick={() => setPreset("05:00")}>5:00</QuickButton>
                <QuickButton onClick={() => setPreset("10:00")}>10:00</QuickButton>
                <QuickButton onClick={() => setPreset("15:00")}>15:00</QuickButton>
            </div>
        </div>
    );
}

function QuickButton({ children, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px',
                background: '#ffffff05',
                border: '1px solid #ffffff0a',
                borderRadius: '4px',
                color: '#71717a',
                fontSize: '9px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.background = '#ffffff0a'; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.background = '#ffffff05'; e.target.style.color = '#71717a'; }}
        >
            {children}
        </button>
    );
}

return { CountdownControl };
