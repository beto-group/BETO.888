function IconSplit(props) {
    const {
        primaryColor = "#4A154B",
        secondaryColor = "#36C5F0",
        frame = 0,
        interpolate,
        spring,
        fps = 30,
        RemotionReact: React = dc.React
    } = props;

    // Animation: Split from center
    const interp = interpolate || ((v, i, o) => o[1]);

    const splitProgress = interp(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const offsetX = 100 * splitProgress;
    const opacity = splitProgress;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            background: '#000000'
        }}>
            <div style={{
                width: '120px',
                height: '120px',
                background: primaryColor,
                borderRadius: '20px',
                transform: `translateX(-${offsetX}px)`,
                opacity: opacity,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 40px ${primaryColor}66`
            }}>
                <dc.Icon icon="message-square" style={{ width: "60px", height: "60px", color: "white" }} />
            </div>

            <div style={{
                width: '120px',
                height: '120px',
                background: secondaryColor,
                borderRadius: '20px',
                transform: `translateX(${offsetX}px)`,
                opacity: opacity,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 40px ${secondaryColor}66`
            }}>
                <dc.Icon icon="hash" style={{ width: "60px", height: "60px", color: "white" }} />
            </div>
        </div>
    );
}

IconSplit.metadata = [
    { id: "category", type: "text", default: "ui", hidden: true },
    { id: "primaryColor", type: "color", default: "#4A154B", label: "Left Color" },
    { id: "secondaryColor", type: "color", default: "#36C5F0", label: "Right Color" }
];

return { IconSplit };
