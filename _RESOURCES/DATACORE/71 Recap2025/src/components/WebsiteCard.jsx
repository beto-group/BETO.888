const { useState, useEffect } = dc;

function WebsiteCard({ url, title, emojis = [], description, active, style }) {
    const [isHovered, setIsHovered] = useState(false);
    const domain = url ? new URL(url).hostname.replace('www.', '') : 'LINK';

    // Lucide Icons Map (Should match App.jsx for consistency)
    const EMOJI_ICONS = {
        'flame': 'flame', 'eye': 'eye', 'heart': 'heart',
        'star': 'star', 'sparkles': 'sparkles', 'thumbs-up': 'thumbs-up',
        'rocket': 'rocket', 'gamepad-2': 'gamepad-2', 'music': 'music',
        'trophy': 'trophy', 'gem': 'gem', 'clover': 'clover', 'message-square': 'message-square',
        'arrow-big-up': 'arrow-big-up', 'arrow-big-down': 'arrow-big-down',
        'zap': 'zap'
    };

    return (
        <div
            className="website-card"
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
                border: isHovered ? '1px solid #a855f7' : '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                boxShadow: isHovered ? '0 10px 30px rgba(168,85,247,0.15)' : 'none',
                cursor: 'pointer',
                ...style
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank');
            }}
        >
            {/* Header / Domain */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    <span style={{ fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {domain}
                    </span>
                </div>
                <div style={{ opacity: isHovered ? 1 : 0.3, transition: 'opacity 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
                background: 'radial-gradient(circle at top, rgba(168,85,247,0.03), transparent 70%)'
            }}>
                {/* Icon Placeholder based on domain */}
                <div style={{
                    width: '64px', height: '64px', borderRadius: '16px',
                    background: '#111', border: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '8px', color: '#FFF'
                }}>
                    {domain.includes('github') ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    ) : domain.includes('youtube') ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="red"></polygon></svg>
                    ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    )}
                </div>

                <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#FFF',
                    background: 'linear-gradient(to right, #fff, #bbb)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {title || domain}
                </h3>

                {description && (
                    <p style={{ margin: 0, fontSize: '13px', color: '#888', maxWidth: '80%', lineHeight: '1.4' }}>
                        {description}
                    </p>
                )}
            </div>



            {/* Hover Shine Effect */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.03) 40%, transparent 60%)',
                transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
                transition: 'transform 0.6s ease',
                pointerEvents: 'none'
            }} />
        </div>
    );
}

return { WebsiteCard };
