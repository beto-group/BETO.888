/**
 * 42 ChatLLM - Advanced Conversational Engine
 * Consolidated Master Protocol (Rule #13)
 */
async function View({ folderPath }) {
    const { useState, useEffect, useRef, useMemo } = dc;

    // 1. Safe Agent Layer (Rule #10)
    const Agent = {
        timer: null,
        start: (fPath, onReload) => {
            const cmdFile = fPath + '/mcp_commands.json';
            Agent.timer = setInterval(async () => {
                try {
                    const adapter = dc.app.vault.adapter;
                    if (!(await adapter.exists(cmdFile))) return;
                    const content = await adapter.read(cmdFile);
                    const cmd = JSON.parse(content);
                    if (cmd && cmd.executed === false && cmd.action === 'reload') {
                        cmd.executed = true;
                        cmd.executedAt = new Date().toISOString();
                        await adapter.write(cmdFile, JSON.stringify(cmd, null, 2));
                        onReload();
                    }
                } catch (e) {}
            }, 1000);
            return () => clearInterval(Agent.timer);
        }
    };

    const styles = {
        container: {
            height: '100%', width: '100%',
            backgroundColor: '#000', color: '#fff',
            display: 'flex', flexDirection: 'row',
            fontFamily: 'JetBrains Mono, SF Mono, monospace',
            overflow: 'hidden', position: 'absolute', inset: 0
        },
        sidebar: {
            width: '280px', height: '100%',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column',
            backgroundColor: '#050505', flexShrink: 0
        },
        main: {
            flex: 1, height: '100%',
            display: 'flex', flexDirection: 'column',
            backgroundColor: '#000', position: 'relative'
        },
        header: {
            padding: '24px 32px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        },
        chatArea: {
            flex: 1, overflowY: 'auto',
            padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px'
        },
        inputArea: {
            padding: '32px 40px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: '16px'
        },
        message: (role) => ({
            alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '1000px', width: '100%',
            display: 'flex', gap: '20px',
            backgroundColor: role === 'user' ? 'rgba(255,255,255,0.02)' : 'transparent',
            padding: '24px', borderRadius: '4px',
            border: role === 'user' ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }),
        avatar: (role) => ({
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: role === 'user' ? '#fff' : 'rgba(255,255,255,0.08)',
            color: role === 'user' ? '#000' : '#fff',
            borderRadius: '2px', flexShrink: 0, fontSize: '14px', fontWeight: '900'
        }),
        button: {
            padding: '12px 20px', backgroundColor: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px',
            fontSize: '11px', fontWeight: '700', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.1em'
        },
        input: {
            backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px', padding: '20px', color: '#fff', fontSize: '14px',
            width: '100%', boxSizing: 'border-box', outline: 'none', resize: 'none',
            fontFamily: 'inherit'
        }
    };

    const PROVIDERS = {
        openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
        gemini: { name: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com', defaultModel: 'gemini-1.5-pro' },
        anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com', defaultModel: 'claude-3-5-sonnet-20240620' },
        groq: { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.1-70b-versatile' },
        ollama: { name: 'Ollama', baseUrl: 'http://localhost:11434', defaultModel: 'llama3' }
    };

    /* ---------------------- MAIN VIEW ---------------------- */

    function Main() {
        const [messages, setMessages] = useState([]);
        const [input, setInput] = useState("");
        const [provider, setProvider] = useState("openai");
        const [model, setModel] = useState("gpt-4o");
        const [loading, setLoading] = useState(false);
        const [apiKeys, setApiKeys] = useState({});
        const chatRef = useRef(null);

        useEffect(() => {
            const load = async () => {
                const adapter = dc.app.vault.adapter;
                const keys = {};
                for (const id of Object.keys(PROVIDERS)) {
                    const path = `.datacore/chatllm/.secret/${id}_api_key.txt`;
                    if (await adapter.exists(path)) keys[id] = (await adapter.read(path)).trim();
                }
                setApiKeys(keys);
            };
            load();
        }, []);

        useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages, loading]);

        const send = async () => {
            if (!input.trim() || loading) return;
            const newMsgs = [...messages, { role: 'user', content: input }];
            setMessages(newMsgs);
            setInput("");
            setLoading(true);

            try {
                const url = PROVIDERS[provider].baseUrl + "/chat/completions";
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeys[provider]}` },
                    body: JSON.stringify({ model, messages: newMsgs })
                });
                const data = await response.json();
                setMessages([...newMsgs, { role: 'assistant', content: data.choices[0].message.content }]);
            } catch (e) {
                setMessages([...newMsgs, { role: 'assistant', content: "ERROR: " + e.message }]);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div style={styles.container}>
                <div style={styles.sidebar}>
                    <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#8b5cf6', letterSpacing: '0.3em' }}>CONVERSATIONAL ENGINE</span>
                    </div>
                    <div style={{ flex: 1, padding: '20px' }}>
                        {/* History items could go here */}
                    </div>
                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <button style={styles.button} onClick={() => setMessages([])}>Clear Memory</button>
                    </div>
                </div>
                
                <div style={styles.main}>
                    <header style={styles.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ color: '#fff', fontWeight: '900', fontSize: '16px' }}>{PROVIDERS[provider].name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>/ {model}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {Object.keys(PROVIDERS).map(id => (
                                <button 
                                    key={id} 
                                    style={{ ...styles.button, borderColor: provider === id ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
                                    onClick={() => { setProvider(id); setModel(PROVIDERS[id].defaultModel); }}
                                >
                                    {id}
                                </button>
                            ))}
                        </div>
                    </header>

                    <div ref={chatRef} style={styles.chatArea}>
                        {messages.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                                <dc.Icon icon="message-square" style={{ fontSize: '64px' }} />
                            </div>
                        ) : (
                            messages.map((m, i) => (
                                <div key={i} style={styles.message(m.role)}>
                                    <div style={styles.avatar(m.role)}>{m.role === 'user' ? 'U' : 'B'}</div>
                                    <div style={{ flex: 1, lineHeight: '1.8', fontSize: '14px', color: '#cbd5e1' }}>
                                        {m.content}
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && <div style={{ alignSelf: 'flex-start', padding: '20px', color: '#8b5cf6' }}>SIGNAL INCOMING...</div>}
                    </div>

                    <div style={styles.inputArea}>
                        <textarea 
                            style={styles.input} 
                            placeholder="INPUT SEQUENCE..." 
                            rows={3} 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>SHIFT+ENTER FOR LINE BREAK</span>
                            <button style={{ ...styles.button, backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }} onClick={send}>TRANSMIT</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const SafeRoot = () => {
        const [key, setKey] = useState(0);
        const rootRef = useRef(null);

        // Core Immersion Loop
        useEffect(() => {
            const container = rootRef.current;
            if (!container) return;
            const targetView = container.closest('.workspace-leaf-content');
            if (!targetView) return;
            const viewContent = targetView.querySelector('.view-content');
            if (viewContent) {
                const originalParent = container.parentNode;
                viewContent.appendChild(container);
                container.style.position = 'absolute';
                container.style.inset = '0';
                container.style.zIndex = '10';
                return () => { if (originalParent) originalParent.appendChild(container); };
            }
        }, []);

        useEffect(() => {
            return Agent.start(folderPath, () => {
                if (dc.app.workspace.activeLeaf?.rebuildView) dc.app.workspace.activeLeaf.rebuildView();
                else setKey(k => k + 1);
            });
        }, []);

        return <div ref={rootRef} key={key} style={{ height: '100%', width: '100%' }}><Main /></div>;
    };

    return <SafeRoot />;
}

return { View };
