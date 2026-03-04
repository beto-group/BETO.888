
const { useState } = dc;

export function AppCard({ app, onClick, STYLES }) {
    const [hover, setHover] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        await onClick(app);
        setLoading(false);
    };

    const letter = app.name.charAt(0).toUpperCase();

    return (
        <div
            style={{ ...STYLES.appCard, ...(hover ? STYLES.appCardHover : {}) }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={handleClick}
        >
            <div style={STYLES.appIcon}>
                {letter}
            </div>
            <div style={STYLES.appName}>{app.name}</div>
            {loading && (
                <div style={STYLES.loadingOverlay}>
                    <div className="spinner" style={STYLES.spinner}></div>
                </div>
            )}
        </div>
    );
}
