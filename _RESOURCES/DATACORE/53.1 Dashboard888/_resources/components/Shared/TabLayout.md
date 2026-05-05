# TabLayout

```jsx
const { useState, useEffect } = dc;

function TabLayout(props) {
    const { 
        title, 
        description, 
        cover, 
        getMediaResourcePath,
        subTabs,
        activeSubTab,
        setActiveSubTab,
        children 
    } = props;
    
    const [coverUrl, setCoverUrl] = useState(null);

    useEffect(() => {
        if (cover && getMediaResourcePath) {
            getMediaResourcePath(cover).then(setCoverUrl);
        }
    }, [cover]);

    return (
        <div className="layout-tabs" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Tab Bar */}
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                padding: '12px 24px', 
                borderBottom: '1px solid var(--glow-faint)',
                background: 'rgba(var(--background-primary-rgb), 0.3)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                marginBottom: '24px'
            }}>
                {subTabs.map((sub, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveSubTab(idx)}
                        style={{
                            padding: '8px 16px',
                            background: activeSubTab === idx ? 'var(--glow)' : 'transparent',
                            color: activeSubTab === idx ? 'var(--background-primary)' : 'var(--text-muted)',
                            border: '1px solid var(--glow-faint)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontVariant: 'small-caps',
                            letterSpacing: '1px'
                        }}
                    >
                        {sub.title || `Sub ${idx + 1}`}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="layout-content" style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}

return { TabLayout };
```
