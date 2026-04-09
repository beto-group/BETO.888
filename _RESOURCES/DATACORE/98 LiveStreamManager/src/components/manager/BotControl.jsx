function BotControl(props) {
    const { useState } = dc;
    const {
        botEnabled,
        setBotEnabled,
        botPromptPath,
        setBotPromptPath,
        botCommands,
        setBotCommands,
        botFilters,
        setBotFilters,
        botApiKey, setBotApiKey,
        botClientId, setBotClientId,
        botClientSecret, setBotClientSecret,
        botRefreshToken, setBotRefreshToken,
        botOauthToken,
        refreshBotAccessToken
    } = props;

    const [showSecurity, setShowSecurity] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
            {/* 1. Security & Credentials */}
            <div style={{
                background: 'rgba(160, 118, 249, 0.03)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(160, 118, 249, 0.1)'
            }}>
                <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setShowSecurity(!showSecurity)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: botOauthToken ? '#10b981' : '#71717a',
                            boxShadow: botOauthToken ? '0 0 10px #10b981' : 'none'
                        }} />
                        <span style={{ fontSize: '10px', fontWeight: '900', color: botOauthToken ? '#fff' : '#71717a', letterSpacing: '1px' }}>
                            BOT SECURITY & AUTH
                        </span>
                    </div>
                    <dc.Icon
                        icon={showSecurity ? "chevron-up" : "chevron-down"}
                        style={{ width: 14, opacity: 0.5 }}
                    />
                </div>

                {showSecurity && (
                    <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <InputGroup label="YOUTUBE API KEY" value={botApiKey} onChange={setBotApiKey} type="password" placeholder="AIza..." />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <InputGroup label="CLIENT ID" value={botClientId} onChange={setBotClientId} type="password" placeholder="Client ID" />
                            <InputGroup label="CLIENT SECRET" value={botClientSecret} onChange={setBotClientSecret} type="password" placeholder="Secret" />
                        </div>
                        <InputGroup label="REFRESH TOKEN" value={botRefreshToken} onChange={setBotRefreshToken} type="password" placeholder="OAuth Refresh Token" />

                        <button
                            onClick={refreshBotAccessToken}
                            style={{
                                background: '#a076f922',
                                border: '1px solid #a076f944',
                                color: '#a076f9',
                                padding: '10px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: '900',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                marginTop: '5px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#a076f933'}
                            onMouseLeave={e => e.currentTarget.style.background = '#a076f922'}
                        >
                            <dc.Icon icon="refresh-cw" style={{ width: 12 }} />
                            RE-AUTHORIZE BOT
                        </button>
                    </div>
                )}
            </div>

            {/* Bot Status */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={sectionTitleStyle}>Bot Status</label>
                    <div
                        onClick={() => setBotEnabled(!botEnabled)}
                        style={{
                            width: '32px',
                            height: '18px',
                            backgroundColor: botEnabled ? '#a076f9' : '#ffffff11',
                            borderRadius: '10px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: botEnabled ? '#fff' : '#71717a',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '3px',
                            left: botEnabled ? '17px' : '3px',
                            transition: 'all 0.2s'
                        }} />
                    </div>
                </div>
                <p style={{ fontSize: '10px', color: '#71717a', marginTop: '4px' }}>
                    Monitor and interact with YouTube chat.
                </p>
            </div>

            {/* AI Personality */}
            <div style={sectionStyle}>
                <label style={sectionTitleStyle}>AI Personality (Prompt)</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                        style={inputStyle}
                        value={botPromptPath}
                        onChange={(e) => setBotPromptPath(e.target.value)}
                        placeholder="Path to bot_prompt.md"
                    />
                    <button
                        onClick={() => {
                            const file = window.app.vault.getAbstractFileByPath(botPromptPath);
                            if (file) window.app.workspace.getLeaf().openFile(file);
                            else alert("Prompt file not found at: " + botPromptPath);
                        }}
                        style={quickButtonStyle}
                        title="Edit Prompt"
                    >
                        <dc.Icon icon="external-link" style={{ width: '14px' }} />
                    </button>
                </div>
            </div>

            {/* Active Commands */}
            <div style={sectionStyle}>
                <label style={sectionTitleStyle}>Active Commands</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {botCommands.map(cmd => (
                        <div
                            key={cmd.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px',
                                background: cmd.enabled ? '#a076f908' : '#ffffff03',
                                borderRadius: '8px',
                                border: `1px solid ${cmd.enabled ? '#a076f933' : '#ffffff08'}`
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: cmd.enabled ? '#a076f9' : '#fff' }}>{cmd.name}</span>
                                <span style={{ fontSize: '9px', color: '#71717a' }}>{cmd.description}</span>
                            </div>
                            <div
                                onClick={() => setBotCommands(prev => prev.map(c =>
                                    c.id === cmd.id ? { ...c, enabled: !c.enabled } : c
                                ))}
                                style={{
                                    width: '28px',
                                    height: '16px',
                                    backgroundColor: cmd.enabled ? '#a076f9' : '#ffffff11',
                                    borderRadius: '8px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: '#fff',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: cmd.enabled ? '15px' : '3px',
                                    transition: 'all 0.2s'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety Filters */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={sectionTitleStyle}>Safety Filters</label>
                    <button
                        onClick={() => {
                            const f = prompt("Enter new filter keyword:");
                            if (f) setBotFilters(prev => [...prev, f]);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#a076f9', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        + ADD
                    </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {botFilters.map(filter => (
                        <div
                            key={filter}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                background: '#111',
                                border: '1px solid #222',
                                borderRadius: '12px',
                                fontSize: '9px',
                                fontWeight: '700',
                                color: '#a1a1aa'
                            }}
                        >
                            {filter}
                            <dc.Icon
                                icon="x"
                                style={{ width: '10px', cursor: 'pointer', opacity: 0.6 }}
                                onClick={() => setBotFilters(prev => prev.filter(f => f !== filter))}
                            />
                        </div>
                    ))}
                    {botFilters.length === 0 && (
                        <div style={{ fontSize: '10px', color: '#71717a', padding: '8px 0' }}>No active filters.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

const sectionStyle = { display: 'flex', flexDirection: 'column' };
const sectionTitleStyle = { fontSize: '9px', fontWeight: '900', color: '#71717a', letterSpacing: '1.5px', textTransform: 'uppercase' };
const inputStyle = { flex: 1, background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '11px', outline: 'none' };
const quickButtonStyle = { background: '#222', border: 'none', borderRadius: '6px', color: '#fff', padding: '0 12px', cursor: 'pointer' };

const InputGroup = ({ label, value, onChange, type = "text", placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '8px', fontWeight: '800', color: '#71717a' }}>{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                padding: '6px 8px',
                color: '#fff',
                fontSize: '10px',
                outline: 'none',
                fontFamily: 'monospace'
            }}
        />
    </div>
);

return { BotControl };
