const { useRef, useState } = dc;

/**
 * Main UI Component
 * Now handles both Full and Compact views.
 */
function BasicComponent({ onCodeReloadRequest, isFullTab, onToggleFullTab, domUtils, styles, ControlsMenu }) {
  const STYLES = styles;

  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;

  const hoverEffectStyle = `
    .controls-menu {
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }
    .controls-menu:hover {
      opacity: 1;
    }
    .${uniqueWrapperClass} .subtle-icon {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    .${uniqueWrapperClass}:hover .subtle-icon {
      opacity: 0.7;
    }
  `;

  if (!isFullTab) {
    return (
      <div style={STYLES.compactWrapper} className={uniqueWrapperClass}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={STYLES.subtitle}><strong>Basic Folder View</strong> ({instanceId})</span>
          <div
            style={STYLES.iconButton}
            onClick={onToggleFullTab}
            title="Enter Full Mode"
          >
            <dc.Icon icon="maximize" style={{ width: "16px", height: "16px" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <style>{hoverEffectStyle}</style>
      <div style={STYLES.fullTabWrapper} className={uniqueWrapperClass}>

        {/* Top Right Controls */}
        <ControlsMenu
          onReload={onCodeReloadRequest}
          onToggle={onToggleFullTab}
          styles={STYLES}
        />

        {/* Content */}
        <h2 style={STYLES.title}>BASIC FOLDER VIEW</h2>
        <p style={STYLES.subtitle}>
          Modular Datacore Component
        </p>
        <p style={STYLES.subtitle}>
          Instance ID: <strong>{instanceId}</strong>
        </p>
      </div>
    </div>
  );
}

return { BasicComponent };