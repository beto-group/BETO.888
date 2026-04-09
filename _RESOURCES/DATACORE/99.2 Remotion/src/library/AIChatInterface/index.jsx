const { React } = dc;

function AIChatInterface({ frame }) {
    // Reveal animation
    const width = Math.min(600, 200 + frame * 10);
    const opacity = Math.min(1, frame / 20);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: '100px'
        }}>
            <div style={{
                width: `${width}px`,
                height: '60px',
                background: 'rgba(20, 20, 20, 0.8)',
                backdropFilter: 'blur(12px)',
                borderRadius: '30px',
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                opacity: opacity,
                overflow: 'hidden'
            }}>
                {/* Model Badge */}
                <div style={{
                    padding: '4px 8px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#8b5cf6',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)',
                    whiteSpace: 'nowrap'
                }}>
                    GPT-4
                </div>

                {/* Input Placeholder */}
                <div style={{ flex: 1, color: '#888', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    Ask AI to refactor...
                    <span style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '14px',
                        background: '#8b5cf6',
                        marginLeft: '2px',
                        verticalAlign: 'middle',
                        opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0
                    }} />
                </div>

                {/* Context Pill */}
                <div style={{
                    padding: '4px 8px',
                    background: '#222',
                    color: '#666',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    border: '1px solid #333',
                    whiteSpace: 'nowrap'
                }}>
                    @main.tsx
                </div>
            </div>
        </div>
    );
}

AIChatInterface.metadata = [
    { id: 'category', type: 'text', default: 'component' }
];

return { AIChatInterface };
