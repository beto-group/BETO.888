const { useState } = dc;

function MenuButton({ onClick, icon, title, style }) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            style={{
                ...style.iconButton,
                ...(isHovered ? style.iconButtonHover : {})
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={title}
        >
            <dc.Icon icon={icon} style={{ width: "18px", height: "18px" }} />
        </div>
    );
}

function ControlsMenu({ onReload, onToggle, styles }) {
    return (
        <div style={styles.controlsContainer} className="controls-menu">
            {onReload && <MenuButton onClick={onReload} icon="refresh-cw" title="Reload Component" style={styles} />}
            {onToggle && <MenuButton onClick={onToggle} icon="minimize" title="Exit Full Mode" style={styles} />}
        </div>
    );
}

return { ControlsMenu };
