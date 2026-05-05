
# SettingsPortal

```jsx
const { useEffect, useRef, useState } = dc;

const SettingsPortal = ({ 
    setIsModalOpen, 
    localTheme, 
    handleToggleTheme, 
    isMatrixRainOn, 
    setIsMatrixRainOn, 
    isUpdateUIOpen, 
    setIsUpdateUIOpen,
    UpdateIndicator 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                title="Settings"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'rgba(var(--background-primary-rgb), 0.6)',
                    border: '1px solid var(--glow-faint)',
                    color: 'var(--glow)',
                    borderRadius: '8px',
                    padding: '6px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 15px var(--glow-faint)' : 'none'
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>

            <div style={{
                position: 'absolute',
                top: '44px',
                right: 0,
                background: 'var(--background-primary-alt)',
                border: '1px solid var(--glow-faint)',
                borderRadius: '12px',
                padding: '12px',
                display: isOpen ? 'flex' : 'none',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '200px',
                boxShadow: 'var(--elev)',
                animation: 'nf-fadeIn 0.2s ease-out',
                zIndex: 1000
            }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginBottom: '8px', padding: '0 8px', letterSpacing: '1.5px', fontWeight: 800 }}>SYSTEM CONTROLS</div>
                    
                    {/* Theme Toggle */}
                    <div 
                        onClick={() => { handleToggleTheme(); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: 'var(--text-normal)'
                        }}
                        className="menu-item"
                    >
                        <div style={{ color: 'var(--glow)', display: 'flex', alignItems: 'center' }}>
                            {localTheme === 'theme-dark' ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                            )}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{localTheme === 'theme-dark' ? 'SWITCH TO LIGHT' : 'SWITCH TO DARK'}</span>
                    </div>

                    {/* Ambiance Toggle */}
                    <div 
                        onClick={() => setIsMatrixRainOn(!isMatrixRainOn)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: 'var(--text-normal)'
                        }}
                        className="menu-item"
                    >
                        <div style={{ color: isMatrixRainOn ? 'var(--glow)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                            </svg>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>AMBIANCE: {isMatrixRainOn ? 'ACTIVE' : 'DISABLED'}</span>
                    </div>

                    <div style={{ height: '1px', background: 'var(--glow-faint)', margin: '6px 8px' }} />

                    {/* Vault Updater (Menu Trigger Variant) */}
                    <UpdateIndicator 
                        setIsModalOpen={setIsModalOpen} 
                        variant="menu-item" 
                        externalOpen={isUpdateUIOpen} 
                        setExternalOpen={setIsUpdateUIOpen}
                    />
                </div>
        </div>
    );
};

return { SettingsPortal };
```
