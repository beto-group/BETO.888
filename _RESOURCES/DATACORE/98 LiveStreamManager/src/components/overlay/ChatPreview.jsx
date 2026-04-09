const { useState, useEffect } = dc;

function ChatPreview({ messages = [], style }) {
    // Show last 5 messages
    const recentMessages = messages.slice(-5);

    return (
        <div style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            width: '350px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            ...style
        }}>
            <div style={{
                fontSize: '12px',
                fontWeight: '800',
                color: '#a076f9', // Purple accent
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '5px',
                opacity: 0.8
            }}>
                Recent Activity
            </div>

            {recentMessages.length === 0 && (
                <div style={{ color: '#52525b', fontSize: '13px', fontStyle: 'italic' }}>
                    Waiting for messages...
                </div>
            )}

            {recentMessages.map((msg, idx) => (
                <div key={msg.id || idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.5s ease'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '2px'
                    }}>
                        {msg.profileImageUrl && (
                            <img src={msg.profileImageUrl} style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                        )}
                        <span style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#e4e4e7' // Zinc-200
                        }}>
                            {msg.author}
                        </span>
                        <span style={{ fontSize: '10px', color: '#71717a' }}>
                            {new Date(msg.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#d4d4d8', // Zinc-300
                        lineHeight: '1.4',
                        paddingLeft: '22px' // Indent to align with name
                    }}>
                        {msg.text}
                    </div>
                </div>
            ))}

            <style>{`
               @keyframes fadeIn {
                   from { opacity: 0; transform: translateY(10px); }
                   to { opacity: 1; transform: translateY(0); }
               }
           `}</style>
        </div>
    );
}

return { ChatPreview };
