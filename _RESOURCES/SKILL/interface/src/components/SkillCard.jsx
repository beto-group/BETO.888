function SkillCard({ agent, isTracked, onExtract, STYLES }) {
    // We assume React is available globally in the view context, 
    // or we could pass 'dc' as a prop if needed.
    // However, usually functional components (Elements) created via React.createElement 
    // don't need access to 'React' object for JSX once transpiled?
    // Wait, jsx runtime handles it.
    // BUT if we used useState inside here?
    // Let's check if we use hooks.
    // Previous version used useState? No, it seemed stateless effectively?
    // Wait, let's check my previous code.
    // Ah, I added `const { useState } = React;` in the overwrite, but didn't use it.
    // I will remove it to be safe. It is a presentational component.

    const cardStyle = {
        ...STYLES.glassCard,
        position: 'relative',
        overflow: 'hidden'
    };

    // Status Indicator
    const statusColor = isTracked ? '#4fba6f' : '#888';
    const statusLabel = isTracked ? 'EXTRACTED' : 'DETECTED';

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={STYLES.subtitle}>{statusLabel}</div>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: statusColor,
                    boxShadow: isTracked ? `0 0 10px ${statusColor}` : 'none'
                }} />
            </div>

            <h3 style={{
                fontSize: '20px',
                margin: '12px 0 8px 0',
                color: 'white',
                fontWeight: '600'
            }}>
                {agent.name}
            </h3>

            <p style={{
                fontSize: '12px',
                color: '#aaa',
                fontFamily: 'monospace',
                marginBottom: '16px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {agent.path}
            </p>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'auto'
            }}>
                <div style={{
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#ccc'
                }}>
                    {agent.fileCount} Files
                </div>

                {!isTracked && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onExtract(agent); }}
                        style={{
                            background: 'white',
                            color: 'black',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        EXTRACT
                    </button>
                )}
            </div>
        </div>
    );
}

return { SkillCard };
