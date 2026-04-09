function SceneControls({ currentScene, handleSceneChange, scenes }) {
    return (
        <div style={managerSectionStyle}>
            <label style={managerSectionTitleStyle}>Production State</label>
            <div style={sceneTabsStyle}>
                <button
                    style={{ ...sceneTabStyle, ...(currentScene === null ? sceneTabActiveStyle : {}) }}
                    onClick={() => handleSceneChange(null)}
                >
                    <dc.Icon icon="layout-grid" style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Lobby</span>
                </button>
                {scenes.map(scene => (
                    <button
                        key={scene.id}
                        style={{ ...sceneTabStyle, ...(currentScene === scene.id ? sceneTabActiveStyle : {}) }}
                        onClick={() => handleSceneChange(scene.id)}
                    >
                        <dc.Icon icon={scene.icon} style={{ width: '16px', height: '16px' }} />
                        <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>{scene.id}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

const managerSectionStyle = {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderBottom: '1px solid #ffffff08'
};

const managerSectionTitleStyle = {
    fontSize: '9px',
    fontWeight: '900',
    color: '#71717a',
    letterSpacing: '1.5px',
    textTransform: 'uppercase'
};

const sceneTabsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px'
};

const sceneTabStyle = {
    height: '60px',
    background: '#ffffff05',
    border: '1px solid #ffffff0a',
    borderRadius: '8px',
    color: '#71717a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
};

const sceneTabActiveStyle = {
    background: '#a076f922',
    border: '1px solid #a076f966',
    color: '#a076f9',
    boxShadow: '0 4px 15px rgba(160, 118, 249, 0.1)'
};

return { SceneControls };
