function BrandLogoReveal(props) {
    const {
        frame = 0,
        tagline = "Where work happens",
        interpolate,
        spring,
        fps = 30,
        RemotionReact: React = dc.React
    } = props;

    // Use official spring for logo scale
    const logoScale = spring ? spring({
        frame,
        fps,
        config: { stiffness: 100, damping: 10, mass: 1 },
    }) : 0;

    const logoOpacity = interpolate ? interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' }) : 1;

    // Tagline animation
    const taglineOpacity = interpolate ? interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' }) : 0;
    const taglineY = interpolate ? interpolate(frame, [20, 50], [20, 0], { extrapolateRight: 'clamp' }) : 0;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            color: '#1d1c1d',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{
                transform: `scale(${logoScale})`,
                opacity: logoOpacity,
                marginBottom: '40px'
            }}>
                <svg width="120" height="120" viewBox="0 0 100 100">
                    <path d="M22 17a5 5 0 0 1 10 0v10H22a5 5 0 0 1 0-10z" fill="#36C5F0" />
                    <path d="M37 17a5 5 0 0 1 5 5v25a5 5 0 0 1-5 5h-5V22a5 5 0 0 1 5-5z" fill="#36C5F0" />
                    <path d="M83 22a5 5 0 0 1-5 5h-10V22a5 5 0 0 1 5-5 5 5 0 0 1 0 5z" fill="#2EB67D" />
                    <path d="M83 37a5 5 0 0 1-5 5H53a5 5 0 0 1-5-5v-5h25a5 5 0 0 1 0 10z" fill="#2EB67D" />
                    <path d="M17 78a5 5 0 0 1 5-5h10v5a5 5 0 0 1-5 5 5 5 0 0 1-0-10z" fill="#E01E5A" />
                    <path d="M17 63a5 5 0 0 1 5-5h25a5 5 0 0 1 5 5v5H27a5 5 0 0 1 0-10z" fill="#E01E5A" />
                    <path d="M78 83a5 5 0 0 1-10 0V73h10a5 5 0 0 1 0 10z" fill="#ECB22E" />
                    <path d="M63 83a5 5 0 0 1-5-5V53a5 5 0 0 1 5-5h5v25a5 5 0 0 1-5 5z" fill="#ECB22E" />
                </svg>
            </div>

            <h2 style={{
                fontSize: '42px',
                fontWeight: '800',
                margin: 0,
                transform: `translateY(${taglineY}px)`,
                opacity: taglineOpacity
            }}>
                {tagline}
            </h2>
        </div>
    );
};

BrandLogoReveal.metadata = [
    { id: "category", type: "text", default: "final", hidden: true },
    { id: "tagline", type: "text", default: "Where work happens", label: "Tagline" },
    { id: "logoColor", type: "color", default: "#4A154B", label: "Brand Color" }
];

return { BrandLogoReveal };
