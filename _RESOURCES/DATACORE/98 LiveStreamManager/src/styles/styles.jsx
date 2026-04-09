const STYLES = {
  fullTabWrapper: {
    position: 'absolute', // Absolute to stay within parent managed by index.jsx
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#000000',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
    zIndex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  overlayContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },

  // Central Messaging
  centralZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    zIndex: 10,
    width: '100%',
    maxWidth: '1200px'
  },
  countdownRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 'min(2vw, 20px)',
    marginBottom: '5px'
  },
  timerText: {
    fontSize: '8rem', // Fixed size for stability
    fontWeight: '900',
    letterSpacing: '-0.05em',
    lineHeight: '0.85',
    color: '#ffffff',
    textShadow: '0 0 60px rgba(139, 92, 246, 0.3)'
  },
  streamStatusText: {
    fontSize: '2.5rem',
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: '0.25em',
    color: '#71717a'
  },
  startingSoonText: {
    fontSize: '3.5rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
    lineHeight: '1',
    marginTop: '-5px',
    color: '#ffffff'
  },
  socialPanelParent: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 5
  },

  // Socials Panel
  socialsPanel: {
    position: 'absolute',
    bottom: '40px',
    right: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '20px',
    borderLeft: '2px solid #8b5cf6', // Solid purple accent line
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(20px)',
    zIndex: 5
  },
  socialItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    color: '#a1a1aa',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    transition: 'all 0.2s ease'
  },
  socialIcon: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111',
    borderRadius: '4px',
    color: '#ffffff',
    border: '1px solid rgba(139, 92, 246, 0.2)'
  },

  // Manager UI (Floating)
  managerUI: {
    position: 'fixed',
    top: 'min(10vw, 80px)',
    right: '40px',
    width: '360px',
    backgroundColor: '#050505',
    border: '1px solid #1a1a1b',
    borderRadius: '8px',
    padding: '0',
    color: '#ffffff',
    zIndex: 10000,
    boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(139, 92, 246, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: '85vh'
  },
  managerHeader: {
    padding: '24px',
    borderBottom: '1px solid #121214',
    background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), transparent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  managerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    fontWeight: '900',
    color: '#8b5cf6',
    letterSpacing: '0.25em',
    textTransform: 'uppercase'
  },
  managerBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    overflowY: 'auto',
    flex: 1
  },
  managerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  managerSectionTitle: {
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#71717a'
  },
  sceneTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  managerTabs: {
    display: 'flex',
    gap: '1px',
    background: '#121214',
    padding: '4px',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  managerTab: {
    flex: 1,
    padding: '10px',
    background: 'transparent',
    border: 'none',
    color: '#71717a',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  managerTabActive: {
    background: '#ffffff08',
    color: '#ffffff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  controlList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  controlItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: '#0d0d0f',
    border: '1px solid #1a1a1c',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },
  controlItemActive: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), transparent)'
  },
  controlLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  controlName: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#eee'
  },
  controlDescription: {
    fontSize: '9px',
    color: '#71717a',
    fontWeight: '400'
  },
  toggleSwitch: {
    width: '32px',
    height: '18px',
    borderRadius: '10px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  toggleThumb: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    position: 'absolute',
    top: '3px',
    transition: 'all 0.2s ease'
  },
  sceneTab: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    background: '#0d0d0f',
    border: '1px solid #1a1a1c',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#a1a1aa',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    textAlign: 'left'
  },
  sceneTabActive: {
    background: 'rgba(139, 92, 246, 0.12)',
    color: '#ffffff',
    borderColor: '#8b5cf6',
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)'
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#000',
    border: '1px solid #27272a',
    borderRadius: '8px',
    padding: '6px 8px',
    transition: 'border-color 0.2s ease'
  },
  inputField: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '8px',
    color: '#ffffff',
    fontSize: '22px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '800',
    outline: 'none',
    width: '120px'
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '4px'
  },
  quickButton: {
    background: '#18181b',
    border: '1px solid #27272a',
    color: '#ffffff',
    padding: '12px 6px',
    fontSize: '11px',
    fontWeight: '900',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase'
  },
  managerFooter: {
    padding: '20px 24px 28px',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.02)',
    borderTop: '1px solid #18181b'
  },
  actionButton: {
    background: '#ffffff',
    color: '#000000',
    border: 'none',
    padding: '16px',
    fontSize: '11px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.25em',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  },

  // Control Tower
  controlTower: {
    position: 'absolute',
    top: '0',
    right: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '24px',
    zIndex: 10001,
    pointerEvents: 'none',
    gap: '12px'
  },
  controlButton: {
    width: '44px',
    height: '44px',
    background: '#000',
    border: '1px solid #27272a',
    borderRadius: '4px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'auto'
  },

  // Lobby Styles
  lobbyContainer: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed from center to avoid clipping when scrolling
    background: '#000000',
    padding: '40px',
    overflowY: 'auto' // Enable scrolling
  },
  lobbyTitle: {
    fontSize: '4rem',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '-0.05em',
    marginBottom: '60px',
    color: '#ffffff'
  },
  lobbyGrid: {
    display: 'flex',
    gap: 'clamp(8px, 2vw, 24px)',
    flexWrap: 'nowrap', // FORCE ONE ROW
    justifyContent: 'center',
    width: '100%',
    maxWidth: '1200px',
    boxSizing: 'border-box',
    overflowX: 'auto', // Fallback for extreme cases
    msOverflowStyle: 'none', // Hide scrollbar IE/Edge
    scrollbarWidth: 'none', // Hide scrollbar Firefox
    WebkitOverflowScrolling: 'touch'
  },
  lobbyTile: {
    flex: 1,
    maxWidth: '280px',
    minWidth: '80px', // Allow shrinking significantly
    aspectRatio: '1/1',
    background: '#080808',
    border: '1px solid #18181b',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    cursor: 'pointer',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  lobbyTileIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.4s ease'
  },
  lobbyTileLabel: {
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#71717a'
  },

  // Live Chat Styles
  chatContainer: {
    position: 'absolute',
    top: '40px',
    left: '40px',
    width: '320px',
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 15,
    pointerEvents: 'none'
  },
  chatMessage: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'rgba(255, 255, 255, 0.03)', // High-end glossy transparent
    backdropFilter: 'blur(25px) saturate(200%)',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 10px 40px rgba(0, 0, 0, 0.6)',
    animation: 'messageSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'auto'
  },
  chatAuthor: {
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#fff',
    opacity: 0.9,
    marginBottom: '2px'
  },
  chatText: {
    fontSize: '14px',
    color: '#ffffff',
    lineHeight: '1.5',
    fontWeight: '400'
  },

  // Lobby Settings
  settingsWidget: {
    marginTop: '40px',
    width: '100%',
    maxWidth: '500px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '24px',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  settingsTitle: {
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: '#8b5cf6',
    marginBottom: '4px'
  },
  settingsInput: {
    background: '#000',
    border: '1px solid #1a1a1b',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '12px',
    fontFamily: 'monospace',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  }
};

return { STYLES };