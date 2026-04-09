const { React, useEffect, useMemo, useState } = dc;

const FeaturesOverview = (props) => {
    const {
        frame,
        fps = 30,
        titleText = "CAPABILITIES",
        accentColor = "#8b5cf6"
    } = props;

    // Helper for clamping
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    // Animation easing
    const easeOutExpo = (x) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);

    // --- ANIMATION TIMING ---
    const exitStart = 1100;
    const isExiting = frame > exitStart;

    // Entrance & Exit Logic for Header
    const titleOpacity = isExiting
        ? clamp(1 - (frame - exitStart) / 20, 0, 1)
        : clamp(frame / 30, 0, 1);

    const titleScale = isExiting
        ? 1.0 + ((frame - exitStart) / 20) * 0.1 // Scale up on exit
        : 1.1 - (easeOutExpo(clamp(frame / 60, 0, 1)) * 0.1);

    const features = [
        {
            id: 'library',
            title: 'Modular Asset Library',
            desc: 'Instant access to pre-built cinematic components & layouts.',
            delay: 60
        },
        {
            id: 'preview',
            title: 'Real-Time Engine',
            desc: 'Zero-latency HD playback with instant seek & preview.',
            delay: 150
        },
        {
            id: 'ai-workflow',
            title: 'AI-Powered Workflow',
            desc: 'Rapidly generate components using any AI model of your choice.',
            delay: 240
        },
        {
            id: 'export',
            title: 'Universal Export Core',
            desc: 'Native 4K & multi-format rendering for all platforms.',
            delay: 330
        }
    ];

    // --- CUSTOM CINEMATIC GRAPHICS ---
    const renderGraphic = (id, localFrame, color) => {
        const size = 120; // Internal SVG size
        const center = size / 2;
        const color20 = color + '33'; // 20% opacity
        const color50 = color + '80'; // 50% opacity

        const f = localFrame; // Frame counter for this card

        if (id === 'library') {
            // Animated Grid: 4 squares appearing and pulsing
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {[0, 1, 2, 3].map(i => {
                        const row = Math.floor(i / 2);
                        const col = i % 2;
                        const delay = i * 10;
                        const progress = Math.max(0, (f - delay) / 20);
                        const appear = clamp(progress, 0, 1);
                        const scale = 0.8 + Math.sin((f - delay) * 0.1) * 0.1;

                        return (
                            <rect
                                key={i}
                                x={col * 50 + 15}
                                y={row * 50 + 15}
                                width={40}
                                height={40}
                                rx={8}
                                fill={color20}
                                stroke={color}
                                strokeWidth={3}
                                strokeOpacity={appear}
                                fillOpacity={appear * 0.3}
                                style={{
                                    transformOrigin: `${col * 50 + 35}px ${row * 50 + 35}px`,
                                    transform: `scale(${appear > 0 ? scale : 0})`
                                }}
                            />
                        );
                    })}
                </svg>
            );
        }

        if (id === 'preview') {
            // Monitor with Timeline cursor scan
            const scanX = (f * 2) % 80;
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Monitor Frame */}
                    <rect x={10} y={10} width={100} height={70} rx={8} stroke={color} strokeWidth={3} fill="none" />
                    <path d={`M${center} 80 L${center} 100 M40 100 L80 100`} stroke={color} strokeWidth={3} />

                    {/* Play Button - Pulse */}
                    <path
                        d="M50 35 L75 50 L50 65 Z"
                        fill={color}
                        opacity={0.8 + Math.sin(f * 0.1) * 0.2}
                        style={{ transformOrigin: '60px 50px', transform: `scale(${0.8 + Math.sin(f * 0.1) * 0.1})` }}
                    />

                    {/* Timeline Scan Line */}
                    <rect x={20 + scanX} y={20} width={2} height={50} fill={color} opacity={0.6} />
                </svg>
            );
        }

        if (id === 'ai-workflow') {
            // Neural Network / Brain Circuit graphic
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Central Core */}
                    <circle
                        cx={center} cy={center} r={20}
                        stroke={color} strokeWidth={3} fill={color20}
                        style={{ transformOrigin: `${center}px ${center}px`, transform: `scale(${1 + Math.sin(f * 0.1) * 0.1})` }}
                    />

                    {/* Orbiting Nodes */}
                    {[0, 1, 2, 3].map(i => {
                        const angle = (f * 0.05) + (i * (Math.PI / 2));
                        const radius = 35;
                        const x = center + Math.cos(angle) * radius;
                        const y = center + Math.sin(angle) * radius;

                        return (
                            <g key={i}>
                                <line x1={center} y1={center} x2={x} y2={y} stroke={color} strokeWidth={2} opacity={0.5} />
                                <circle cx={x} cy={y} r={6} fill={color} />
                            </g>
                        );
                    })}

                    {/* Data Particles */}
                    {f % 20 < 10 && (
                        <circle cx={center} cy={center} r={30} stroke={color} strokeWidth={1} fill="none" opacity={0.3} />
                    )}
                </svg>
            );
        }

        if (id === 'export') {
            // Downloading Arrow / Loading Ring
            const progress = (f % 100) / 100; // 0 to 1 loop
            const circumference = 2 * Math.PI * 40;
            const dashOffset = circumference * (1 - progress);

            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background Ring */}
                    <circle cx={center} cy={center} r={40} stroke={color20} strokeWidth={4} fill="none" />
                    {/* Progress Ring */}
                    <circle
                        cx={center}
                        cy={center}
                        r={40}
                        stroke={color}
                        strokeWidth={4}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${center} ${center})`}
                    />
                    {/* Arrow Bounce */}
                    <path
                        d={`M${center} 30 L${center} 80 M${center - 15} 65 L${center} 80 L${center + 15} 65`}
                        stroke={color}
                        strokeWidth={4}
                        fill="none"
                        style={{ transform: `translateY(${Math.sin(f * 0.2) * 5}px)` }}
                    />
                </svg>
            );
        }

        return null;
    };

    const STYLES = {
        container: {
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            color: '#fff',
            overflow: 'hidden',
            position: 'relative'
            // Removed perspective to match revert
        },
        bgGradient: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle at 50% 50%, ${accentColor}15 0%, transparent 70%)`,
            opacity: titleOpacity
        },
        header: {
            fontSize: '60px',
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: '60px',
            textTransform: 'uppercase',
            letterSpacing: '4px',

            // Reverted to 2D Gradient Style
            background: `linear-gradient(to bottom, #fff, ${accentColor}cc)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',

            opacity: titleOpacity,
            transform: `scale(${titleScale})`, // No rotation
            filter: `drop-shadow(0 0 20px ${accentColor}66)`
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '40px',
            width: '80%',
            maxWidth: '1200px',
            perspective: '1000px'
        },
        card: (delay) => {
            const startFrame = delay;

            // Exit Logic
            if (isExiting) {
                const exitDelay = (delay / 330) * 10;
                const exitProgress = clamp((frame - exitStart - exitDelay) / 30, 0, 1);
                const exitScale = 1 - exitProgress * 0.1;
                const exitOpacity = 1 - exitProgress;

                return {
                    backgroundColor: 'rgba(20, 20, 20, 0.6)',
                    border: `1px solid ${accentColor}44`,
                    borderRadius: '24px',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '20px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: `0 10px 40px -10px ${accentColor}22`,
                    opacity: exitOpacity,
                    transform: `scale(${exitScale})`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.3s'
                };
            }

            const progress = clamp((frame - startFrame) / 25, 0, 1); // 25 frame duration
            const eased = easeOutExpo(progress);

            const translateY = 100 * (1 - eased);
            const opacity = progress;
            const scale = 0.8 + (eased * 0.2); // 0.9 -> 1.0

            const isVisible = frame > startFrame;

            return {
                backgroundColor: 'rgba(20, 20, 20, 0.6)',
                border: `1px solid ${accentColor}44`,
                borderRadius: '24px',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '20px',
                backdropFilter: 'blur(10px)',
                boxShadow: `0 10px 40px -10px ${accentColor}22`,
                opacity: isVisible ? opacity : 0,
                transform: isVisible
                    ? `translateY(${translateY}px) scale(${scale})`
                    : 'translateY(100px)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.3s'
            };
        },
        iconWrapper: (delay) => {
            const startFrame = delay + 10;
            const floatY = Math.sin((frame - startFrame) * 0.08) * 5;

            return {
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                backgroundColor: `${accentColor}11`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${accentColor}44`,
                boxShadow: `0 0 50px ${accentColor}22`,
                marginBottom: '10px',
                transform: `translateY(${floatY}px)`
            };
        },
        cardTitle: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '1px',
            margin: 0
        },
        cardDesc: {
            fontSize: '20px',
            color: '#aaa',
            fontWeight: '400',
            margin: 0,
            lineHeight: '1.4'
        },
        glowBar: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: accentColor,
            boxShadow: `0 -5px 20px ${accentColor}`
        }
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.bgGradient} />

            <h1 style={STYLES.header}>{titleText}</h1>

            <div style={STYLES.grid}>
                {features.map((feature, i) => (
                    <div
                        key={feature.id}
                        style={STYLES.card(feature.delay)}
                        className="feature-card"
                    >
                        <div style={STYLES.iconWrapper(feature.delay)}>
                            {/* Render Custom Animated Graphic */}
                            {renderGraphic(feature.id, Math.max(0, frame - feature.delay), accentColor)}
                        </div>
                        <h3 style={STYLES.cardTitle}>{feature.title}</h3>
                        <p style={STYLES.cardDesc}>{feature.desc}</p>

                        {/* Bottom Glow Bar */}
                        <div style={STYLES.glowBar} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Metadata for the UI Controls
FeaturesOverview.metadata = [
    { id: 'titleText', type: 'text', default: 'CAPABILITIES' },
    { id: 'accentColor', type: 'color', default: '#8b5cf6' }
];

return { FeaturesOverview };
