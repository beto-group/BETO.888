function KineticTypography({ frame }) {
    const { primaryText, secondaryText, startFrame, duration, color } = KineticTypography.metadata.reduce((acc, item) => {
        acc[item.id] = item.default;
        return acc;
    }, {});

    const localFrame = frame - startFrame;
    if (localFrame < 0) return null;

    // Easing function (Expo Out)
    const easeOutExpo = (x) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);

    // Entrance Animation (0-30 frames)
    const entranceProgress = Math.min(1, Math.max(0, localFrame / 30));
    const entrance = easeOutExpo(entranceProgress);

    // Exit Animation (duration-30 to duration)
    const exitStart = Math.max(0, duration - 30);
    const exitProgress = Math.min(1, Math.max(0, (localFrame - exitStart) / 30));
    const exit = easeOutExpo(exitProgress);

    // Slide values
    const primaryY = 100 - (entrance * 100) - (exit * 100);
    const secondaryY = -100 + (entrance * 100) + (exit * 100);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '900',
            textTransform: 'uppercase',
            color: color
        }}>
            <div style={{ overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                    fontSize: '140px',
                    lineHeight: '1',
                    transform: `translateY(${primaryY}%)`,
                    opacity: entranceProgress > 0.1 && exitProgress < 0.9 ? 1 : 0
                }}>
                    {primaryText}
                </div>
            </div>

            <div style={{ overflow: 'hidden' }}>
                <div style={{
                    fontSize: '60px',
                    fontWeight: '700',
                    color: '#fff',
                    background: color,
                    padding: '5px 20px',
                    transform: `translateY(${secondaryY}%)`
                }}>
                    {secondaryText}
                </div>
            </div>
        </div>
    );
}

KineticTypography.metadata = [
    { id: "category", type: "text", default: "foreground", hidden: true },
    { id: "primaryText", type: "text", default: "IMPACT", label: "Main Text" },
    { id: "secondaryText", type: "text", default: "TRAILER MODE", label: "Sub Text" },
    { id: "color", type: "color", default: "#8b5cf6", label: "Accent Color" },
    { id: "startFrame", type: "number", default: 0, label: "Start Frame" },
    { id: "duration", type: "number", default: 90, label: "Duration" }
];

return { KineticTypography };
