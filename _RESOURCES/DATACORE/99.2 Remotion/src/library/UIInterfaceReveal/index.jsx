function UIInterfaceReveal(props) {
    const {
        primaryColor = "#E01E5A",
        secondaryColor = "#36C5F0",
        scale = 0.8,
        tiltX = 10,
        tiltY = -5,
        frame = 0,
        interpolate,
        spring,
        fps = 30,
        RemotionReact: React = dc.React
    } = props;

    // Animation logic
    const interp = interpolate || ((v, i, o) => o[1]);

    // Reveal: Slide up and fade in with 3D rotation
    const easedProgress = interp(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

    const translateY = 100 * (1 - easedProgress);
    const opacity = easedProgress;
    const rotateX = tiltX * (1 - easedProgress * 0.5);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '1000px',
            transformStyle: 'preserve-3d'
        }}>
            <div style={{
                width: '80%',
                height: '70%',
                background: '#1a1d21',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                transform: `
                   scale(${scale}) 
                   rotateX(${rotateX}deg) 
                   rotateY(${tiltY}deg) 
                   translateY(${translateY}px)
               `,
                opacity: opacity,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #333'
            }}>
                {/* Sidebar */}
                <div style={{ display: 'flex', flex: 1 }}>
                    <div style={{
                        width: '60px',
                        background: '#121417',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingTop: '20px',
                        gap: '15px'
                    }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: i === 1 ? primaryColor : '#333'
                            }} />
                        ))}
                    </div>

                    {/* Channel List */}
                    <div style={{ width: '200px', background: '#191b1f', borderRight: '1px solid #333', padding: '20px' }}>
                        <div style={{ height: '20px', width: '80%', background: '#333', borderRadius: '4px', marginBottom: '30px' }} />
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{ height: '12px', width: '60%', background: '#2c2f35', borderRadius: '3px', marginBottom: '15px' }} />
                        ))}
                    </div>

                    {/* Chat Area */}
                    <div style={{ flex: 1, background: '#1a1d21', padding: '30px', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ height: '40px', borderBottom: '1px solid #333', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                            <div style={{ height: '14px', width: '100px', background: '#333', borderRadius: '4px' }} />
                        </div>

                        {/* Messages */}
                        {[1, 2, 3].map(i => {
                            const msgFrame = 30 + (i * 10);
                            const msgOpacity = interp(frame, [msgFrame, msgFrame + 10], [0, 1], { extrapolateRight: 'clamp' });
                            const msgY = interp(frame, [msgFrame, msgFrame + 10], [10, 0], { extrapolateRight: 'clamp' });

                            return (
                                <div key={i} style={{
                                    display: 'flex',
                                    gap: '15px',
                                    marginBottom: '25px',
                                    opacity: msgOpacity,
                                    transform: `translateY(${msgY}px)`
                                }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: secondaryColor }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ height: '10px', width: '100px', background: '#333', marginBottom: '8px', borderRadius: '2px' }} />
                                        <div style={{ height: '8px', width: '90%', background: '#2c2f35', marginBottom: '6px', borderRadius: '2px' }} />
                                        <div style={{ height: '8px', width: '60%', background: '#2c2f35', borderRadius: '2px' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

UIInterfaceReveal.metadata = [
    { id: "category", type: "text", default: "ui", hidden: true },
    { id: "primaryColor", type: "color", default: "#E01E5A", label: "Accent Color" },
    { id: "secondaryColor", type: "color", default: "#36C5F0", label: "User Color" },
    { id: "scale", type: "number", default: 0.8, label: "Scale" },
    { id: "tiltX", type: "number", default: 10, label: "Tilt X (deg)" },
    { id: "tiltY", type: "number", default: -5, label: "Tilt Y (deg)" }
];

return { UIInterfaceReveal };
