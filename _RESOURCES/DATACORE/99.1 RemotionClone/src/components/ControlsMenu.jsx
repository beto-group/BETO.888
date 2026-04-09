const { useState } = dc;

function MenuButton({ onClick, icon, title, style }) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            style={{
                ...style.iconButton,
                ...(isHovered ? style.iconButtonHover : {})
            }}
            onMouseDown={(e) => {
                if (onClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick(e);
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={title}
        >
            <dc.Icon icon={icon} style={{ width: "18px", height: "18px", pointerEvents: 'none' }} />
        </div>
    );
}

function ControlsMenu({ onReload, onToggle, onExport, onUndo, onRedo, canUndo, canRedo, styles }) {
    return (
        <div style={styles.controlsContainer} className="controls-menu">
            {onUndo && (
                <MenuButton
                    onClick={onUndo}
                    icon="rotate-ccw"
                    title="Undo (Ctrl+Z)"
                    style={{ ...styles, iconButton: { ...styles.iconButton, opacity: canUndo ? 1 : 0.3, pointerEvents: canUndo ? 'auto' : 'none' } }}
                />
            )}
            {onRedo && (
                <MenuButton
                    onClick={onRedo}
                    icon="rotate-cw"
                    title="Redo (Ctrl+Shift+Z)"
                    style={{ ...styles, iconButton: { ...styles.iconButton, opacity: canRedo ? 1 : 0.3, pointerEvents: canRedo ? 'auto' : 'none' } }}
                />
            )}
            <div style={{ width: '1px', height: '16px', background: '#333', margin: '0 5px' }} />
            {onExport && <MenuButton onClick={onExport} icon="download-cloud" title="Export MP4" style={styles} />}
            {onReload && <MenuButton onClick={onReload} icon="refresh-cw" title="Reload Component" style={styles} />}
            {onToggle && <MenuButton onClick={onToggle} icon="minimize" title="Exit Full Mode" style={styles} />}
        </div>
    );
}

return { ControlsMenu };
