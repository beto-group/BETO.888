
const { useState, useEffect, useRef } = dc;

// --- High Velocity Counter ---
function CountUp({ end, duration = 1500 }) {
    const [count, setCount] = useState(0);
    const frameRef = useRef();
    const style = {
        fontFamily: "'Courier New', monospace",
        fontWeight: 'bold',
        display: 'inline-block',
        minWidth: '3ch',
        textAlign: 'right'
    };

    useEffect(() => {
        let startTime = null;
        const start = 0;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(start + (end - start) * easeOut));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [end, duration]);

    return <span style={style}>{count}</span>;
}

// --- Tactical Reactions HUD ---
function TacticalEmojiHUD({ emojis }) {
    if (!emojis || emojis.length === 0) return null;

    return (
        <div style={{
            position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '8px', zIndex: 100, pointerEvents: 'none',
            flexWrap: 'wrap', width: '90%'
        }}>
            {emojis.map((e, idx) => {
                const isViral = e.count > 50;
                return (
                    <div key={idx} className="hud-badge" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: isViral ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0,0,0,0.8)',
                        border: isViral ? '1px solid rgba(255, 215, 0, 0.5)' : '1px solid rgba(168,85,247,0.4)',
                        padding: '4px 8px', borderRadius: '4px',
                        boxShadow: isViral ? '0 0 10px rgba(255, 215, 0, 0.3)' : '0 2px 4px rgba(0,0,0,0.5)',
                        animation: isViral ? 'pulse-gold 2s infinite' : 'none',
                        transform: isViral ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.3s'
                    }}>
                        <dc.Icon icon={e.icon} style={{ color: isViral ? '#ebc334' : '#c084fc', width: '14px', height: '14px' }} />
                        <span style={{
                            color: isViral ? '#fceda4' : '#fff', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px',
                            textShadow: isViral ? '0 0 5px rgba(255, 215, 0, 0.6)' : 'none'
                        }}>
                            {isViral ? <CountUp end={parseInt(e.count)} /> : e.count}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// --- Brand Icons ---
function BrandIcon({ platform }) {
    const p = platform?.toLowerCase() || 'default';

    // Custom SVGs for missing Lucide brands
    if (p === 'discord') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1892.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.1023.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
            </svg>
        );
    }
    if (p === 'reddit') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
            </svg>
        );
    }

    // Default Lucide Mapping
    const LUCIDE_MAP = {
        'twitter': 'twitter',
        'youtube': 'youtube',
        'instagram': 'instagram',
        'facebook': 'facebook'
    };

    const iconName = LUCIDE_MAP[p] || 'message-circle';
    return <dc.Icon icon={iconName} style={{ width: '16px', height: '16px' }} />;
}

// --- Comments List (Tactical) ---
// --- Comments List (Tactical) ---
function TacticalComments({ comments, activeId }) {
    const [particles, setParticles] = useState([]);
    const commentsRef = useRef([]);
    const prevId = useRef(activeId);

    // Clear particles if month changes
    useEffect(() => {
        if (activeId !== prevId.current) {
            setParticles([]); // Wipe old comments immediately
            commentsRef.current = [];
            prevId.current = activeId;
        }
    }, [activeId]);

    // Poll for new comments differences
    useEffect(() => {
        if (!comments || comments.length === 0) return;

        // Find new comments by comparing with ref
        const newItems = comments.filter(c =>
            !commentsRef.current.some(existing => existing.text === c.text && existing.user === c.user)
        );

        if (newItems.length > 0) {
            let runningDelay = 0;
            // Adaptive Speed: If many comments, spawn faster (min 400ms, max 1200ms)
            const baseDelay = Math.max(400, Math.min(1200, 8000 / newItems.length));

            const newParticles = newItems.map((c, i) => {
                runningDelay += baseDelay;
                return {
                    id: Date.now() + i,
                    ...c,
                    spawnTime: Date.now() + runningDelay
                };
            });

            setParticles(prev => [...prev, ...newParticles]);
            commentsRef.current = comments;
        }
    }, [comments]);

    // Cleanup Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setParticles(prev => prev.filter(p => now - p.spawnTime < 12000)); // Keep for 12s
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Force clear when context switches completely (optional, but good for "Jan" -> "Feb")
    useEffect(() => {
        // Reset reference when comments array is legitimately cleared/switched
        if (!comments || comments.length === 0) {
            commentsRef.current = [];
        }
    }, [comments]);

    const PLATFORM_ICONS = {
        'discord': 'message-circle',
        'reddit': 'message-square',
        'twitter': 'twitter',
        'x': 'twitter',
        'youtube': 'youtube',
        'instagram': 'instagram',
        'default': 'message-circle'
    };

    const getIcon = (p) => PLATFORM_ICONS[p?.toLowerCase()] || PLATFORM_ICONS.default;

    return (
        <>
            <style>{`
                @keyframes comment-float {
                    0% { opacity: 0; transform: translate3d(-20px, 20px, 0) scale(0.9); filter: blur(4px); }
                    10% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
                    85% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
                    100% { opacity: 0; transform: translate3d(0, -40px, 0) scale(0.95); filter: blur(8px); }
                }
                @keyframes progress-shrink { from { width: 100%; } to { width: 0%; } }
            `}</style>
            <div style={{
                position: 'absolute', bottom: '15%', left: '3%', // Bottom Left (User Request)
                width: '340px', height: 'auto',
                display: 'flex', flexDirection: 'column-reverse', // Stack Upwards
                overflow: 'visible', pointerEvents: 'none', zIndex: 30
            }}>
                {particles.map(p => {
                    const delay = Math.max(0, p.spawnTime - Date.now());
                    if (delay > 0) return null;

                    return (
                        <div key={p.id} style={{
                            position: 'relative',
                            width: '100%',
                            background: 'rgba(10, 10, 12, 0.75)', // Deep glass
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderLeft: 'none',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                            animation: `comment-float 8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                            backdropFilter: 'blur(12px)',
                            marginBottom: '20px',
                            display: 'flex', gap: '14px'
                        }}>
                            {/* Avatar Column */}
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                                border: '1px solid rgba(168,85,247,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}>
                                <dc.Icon icon={getIcon(p.platform)} style={{ color: '#a855f7', width: '18px', height: '18px' }} />
                            </div>

                            {/* Content Column */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                                        {p.user}
                                    </span>
                                    {/* Icon Badge */}
                                    <div style={{ opacity: 0.6, display: 'flex', alignItems: 'center' }}>
                                        <BrandIcon platform={p.platform} />
                                    </div>
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: '1.5', fontWeight: '400', fontFamily: 'Inter, sans-serif' }}>
                                    {p.text}
                                </div>
                            </div>

                            {/* Progress Line */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: '16px', right: '16px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: '100%', height: '100%', background: '#a855f7',
                                    animation: 'progress-shrink 7s linear forwards', opacity: 0.5
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

// --- Emoji Rain Effect ---
function EmojiRain({ emojis, activeId }) {
    const [drops, setDrops] = useState([]);
    const lastId = useRef(null);

    useEffect(() => {
        if (!emojis || emojis.length === 0) return;

        // Only trigger rain when the source ID changes (new focus)
        if (activeId === lastId.current) return;
        lastId.current = activeId;

        const newDrops = [];
        const now = Date.now();
        emojis.forEach((e) => {
            const count = Math.min(15, parseInt(e.count) || 1);
            for (let i = 0; i < count; i++) {
                newDrops.push({
                    id: Math.random(),
                    icon: e.icon,
                    x: 10 + Math.random() * 80, // % across screen
                    y: -10 - Math.random() * 20, // start above
                    speed: 2 + Math.random() * 4,
                    delay: Math.random() * 1.5,
                    rotation: Math.random() * 360,
                    size: 20 + Math.random() * 20,
                    spawnTime: now
                });
            }
        });

        setDrops(newDrops);
    }, [emojis, activeId]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setDrops(prev => prev.filter(d => (now - d.spawnTime) < 10000)); // Remove after 10s
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
            <style>{`
                @keyframes emoji-fall {
                    0% { transform: translateY(0vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                }
            `}</style>
            {drops.map(d => (
                <div key={d.id} style={{
                    position: 'absolute',
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    animation: `emoji-fall ${6 / d.speed}s linear ${d.delay}s forwards`,
                    color: '#A855F7',
                    filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.5))'
                }}>
                    <dc.Icon icon={d.icon} style={{ width: `${d.size}px`, height: `${d.size}px` }} />
                </div>
            ))}
        </div>
    );
}

return { TacticalComments, CountUp, TacticalEmojiHUD, EmojiRain };
