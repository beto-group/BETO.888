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
    ${STYLES.gridBreakpoints}
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
      <div style={STYLES.fullTabWrapper} className={`${uniqueWrapperClass} grid-container`}>

        {/* Top Right Controls */}
        <ControlsMenu
          onReload={onCodeReloadRequest}
          onToggle={onToggleFullTab}
          styles={STYLES}
        />

        {/* Header - Spans full width */}
        <h2 style={STYLES.title} className="grid-span-12">BASIC FOLDER VIEW</h2>
        <p style={STYLES.subtitle} className="grid-span-12">
          Reactive Datacore Component with CSS Grid Methodology
        </p>

        {/* Demo Cards - Demonstrates grid scaling */}
        <div style={STYLES.card} className="grid-span-4">
          <h3>Instance</h3>
          <p>ID: <strong>{instanceId}</strong></p>
        </div>

        <div style={STYLES.card} className="grid-span-4">
          <h3>Responsive</h3>
          <p>Mobile: 4 Col<br />Tablet: 8 Col<br />Desktop: 12 Col</p>
        </div>

        <div style={STYLES.card} className="grid-span-4">
          <h3>Status</h3>
          <p>Mode: <strong>Grid Active</strong></p>
        </div>

      </div>
    </div>
  );
}

return { BasicComponent };