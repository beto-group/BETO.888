const { React } = dc;

function CodeMockup({ frame }) {
    // Typing simulation
    const codeString = `function calculateMetric(data) {
  return data.reduce((acc, curr) => {
    return acc + curr.value;
  }, 0);
}`;

    // Ghost text appears after frame 30
    const ghostText = `
// Optimized O(n) solution`;

    const ghostOpacity = Math.max(0, Math.min(1, (frame - 30) / 20));

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                width: '600px',
                background: '#0b0b0b',
                borderRadius: '12px',
                border: '1px solid #333',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                fontFamily: 'ia-writer-mono, Menlo, monospace',
                fontSize: '14px'
            }}>
                {/* Window Header */}
                <div style={{
                    padding: '12px 16px',
                    background: '#161616',
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <div style={{ marginLeft: '20px', color: '#666', fontSize: '12px' }}>utils.js</div>
                </div>

                {/* Code Area */}
                <div style={{ padding: '24px', color: '#e5e5e5', lineHeight: '1.6', position: 'relative' }}>

                    {/* Syntax Highlighted Mock */}
                    <div>
                        <span style={{ color: '#c678dd' }}>function</span> <span style={{ color: '#61afef' }}>calculateMetric</span>(<span style={{ color: '#d19a66' }}>data</span>) {'{'}
                    </div>
                    <div>
                        &nbsp;&nbsp;<span style={{ color: '#c678dd' }}>return</span> data.<span style={{ color: '#61afef' }}>reduce</span>((<span style={{ color: '#d19a66' }}>acc</span>, <span style={{ color: '#d19a66' }}>curr</span>) =&gt; {'{'}
                    </div>
                    <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>return</span> acc + curr.value;
                    </div>
                    <div>
                        &nbsp;&nbsp;{'}'}, <span style={{ color: '#d19a66' }}>0</span>);
                    </div>
                    <div>{'}'}</div>

                    {/* Ghost Text Overlay */}
                    <div style={{
                        opacity: ghostOpacity,
                        color: '#666',
                        marginTop: '10px',
                        fontStyle: 'italic',
                        transform: `translateY(${10 - ghostOpacity * 10}px)`
                    }}>
                        {ghostText}
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '14px',
                            background: '#8b5cf6',
                            marginLeft: '4px',
                            opacity: Math.sin(frame * 0.2) > 0 ? 1 : 0
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

CodeMockup.metadata = [
    { id: 'category', type: 'text', default: 'component' }
];

return { CodeMockup };
