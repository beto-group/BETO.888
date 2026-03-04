const { useRef, useState, useEffect } = dc;

/**
 * Duotone Image Editor UI Component
 */
function DuotoneEditorComponent({ onCodeReloadRequest, isFullTab, onToggleFullTab, domUtils, styles, ControlsMenu }) {
  const STYLES = styles;

  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;

  const [colorOne, setColorOne] = useState("#d94135");
  const [colorTwo, setColorTwo] = useState("#FFEF00");
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown UI states
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Engine refs
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  // State History Stacks
  const historyStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const originalImageRef = useRef(null);

  // Initial Load flag to prevent infinite loops
  const initialLoadDone = useRef(false);

  const duotoneStyle = `
        .${uniqueWrapperClass} {
            font-family: "Rubik", sans-serif;
            color: #fff;
            font-size: 16px;
            background: #222325;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
            margin: 0;
            overflow: hidden;
            position: relative;
        }

        .${uniqueWrapperClass} .editor-container {
            display: flex;
            background: #2c2c2e;
            border-radius: 15px;
            overflow: hidden;
            max-width: 1000px;
            width: 95%;
            height: 425px; /* Fixed height for the widget feel */
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            margin: auto;
        }

        .${uniqueWrapperClass} .sidebar {
            background: #1c1c1e;
            width: 260px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            font-family: inherit;
            font-size: 16px;
            flex-shrink: 0;
            position: relative;
        }

        .${uniqueWrapperClass} .sidebar.left {
            border-right: 1px solid #38383a;
        }

        .${uniqueWrapperClass} .sidebar.right {
            border-left: 1px solid #38383a;
        }

        .${uniqueWrapperClass} .sidebar.right .preset-list .dropdown-item {
            padding-left: 25px;
        }

        .${uniqueWrapperClass} .sidebar.right .presets-title {
            padding-left: 10px;
        }

        .${uniqueWrapperClass} .sidebar-item {
            padding: 5px;
            border-bottom: 1px solid #38383a;
            width: 100%;
        }

        .${uniqueWrapperClass} .sidebar-item:last-child {
            border-bottom: none;
        }

        .${uniqueWrapperClass} .color-pickers {
            display: flex;
            justify-content: center;
            gap: 12px;
            padding: 14px;
        }

        .${uniqueWrapperClass} .color-picker {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #fff;
            transition: transform 0.2s;
            position: relative;
            background: #000;
        }

        .${uniqueWrapperClass} .color-picker:hover {
            transform: scale(1.1);
        }

        .${uniqueWrapperClass} .color-picker input[type="color"] {
            width: 150%;
            height: 150%;
            margin: -25%;
            padding: 0;
            border: none;
            cursor: pointer;
            position: absolute;
            top: 0; left: 0;
        }

        .${uniqueWrapperClass} .sidebar-btn {
            width: 100%;
            padding: 8px 16px;
            background-color: transparent;
            color: #fff;
            border: none;
            cursor: pointer;
            transition: background 0.3s;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            font-family: inherit;
            font-size: 16px;
        }

        .${uniqueWrapperClass} .sidebar-btn:hover {
            background-color: #2c2c2e;
        }

        .${uniqueWrapperClass} .sidebar-btn i {
            margin-right: 10px;
            width: 20px;
            text-align: center;
        }

        .${uniqueWrapperClass} .presets-header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 14px 16px;
        }

        .${uniqueWrapperClass} .presets-title {
            font-weight: 500;
            font-size: 14px;
            opacity: 0.85;
        }

        .${uniqueWrapperClass} .dropdown-content {
            background-color: #3a3a3c;
            color: #d1d1d1;
        }

        .${uniqueWrapperClass} .dropdown-item {
            display: flex;
            align-items: center;
            padding: 12px;
            cursor: pointer;
            transition: background-color 0.3s;
            border-bottom: 1px solid #4a4a4c;
            position: relative;
        }

        .${uniqueWrapperClass} .dropdown-item:last-child {
            border-bottom: none;
        }

        .${uniqueWrapperClass} .dropdown-item:hover {
            background-color: #4a4a4c;
        }

        .${uniqueWrapperClass} .dropdown-item.selected {
            background-color: #4a4a4c;
        }

        .${uniqueWrapperClass} .dropdown-item.selected::after {
            content: "✓";
            font-weight: 900;
            position: absolute;
            right: 20px;
            color: #757575;
        }

        .${uniqueWrapperClass} .dropdown-item i {
            margin-right: 10px;
            width: 20px;
            text-align: center;
        }

        .${uniqueWrapperClass} .image-preview {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            position: relative;
            overflow: hidden;
            background: #2c2c2e;
        }

        .${uniqueWrapperClass} .image-preview canvas {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            width: auto;
            height: auto;
        }

        .${uniqueWrapperClass} #loading-spinner {
            position: absolute;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 50;
        }

        .${uniqueWrapperClass} .spinner {
            border: 8px solid rgba(255, 255, 255, 0.3);
            border-top: 8px solid #0a84ff;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .${uniqueWrapperClass} .history-panel-container {
            max-height: 240px;
            overflow-y: auto;
            background: transparent;
        }

        .${uniqueWrapperClass} .history-item {
            padding: 12px;
            padding-left: 18px;
            cursor: pointer;
            transition: background-color 0.3s;
            color: #8e8e93;
            font-size: 14px;
        }

        .${uniqueWrapperClass} .history-item:hover {
            background-color: #4a4a4c;
        }

        .${uniqueWrapperClass} .presets-wrap {
            padding: 0;
        }

        .${uniqueWrapperClass} .preset-list {
            max-height: none;
            overflow-y: auto;
        }

        .${uniqueWrapperClass} .preset-list .dropdown-item {
            background: transparent;
        }
        
        .${uniqueWrapperClass} .preset-list .dropdown-item:hover {
            background-color: #4a4a4c;
        }

        /* Top Right Controls Dropdown fixes */
        .controls-menu {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          z-index: 1000;
        }
        .controls-menu:hover {
          opacity: 1;
        }
    `;

  // --- UTILS ---
  const formatTimestamp = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month}/${day}/${year} ${hours}:${minutes}${ampm}`;
  };

  const hexToRGB = (h) => {
    const hex = h.charAt(0) === "#" ? h.substring(1, 7) : h;
    return [
      parseInt(hex.substring(0, 2), 16) / 255,
      parseInt(hex.substring(2, 4), 16) / 255,
      parseInt(hex.substring(4, 6), 16) / 255
    ];
  };

  const rgbToHex = (rgb) => {
    return "#" + rgb.map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
  };

  // --- CORE ENGINE ---
  const applyDuotone = () => {
    if (!originalImageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = originalImageRef.current;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const c1 = hexToRGB(colorOne);
    const c2 = hexToRGB(colorTwo);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      data[i] = Math.round((c1[0] * (1 - brightness) + c2[0] * brightness) * 255);
      data[i + 1] = Math.round((c1[1] * (1 - brightness) + c2[1] * brightness) * 255);
      data[i + 2] = Math.round((c1[2] * (1 - brightness) + c2[2] * brightness) * 255);
    }

    ctx.putImageData(imageData, 0, 0);
    setIsLoading(false);
  };

  // --- STATE MANAGEMENT ---
  const saveState = () => {
    if (!canvasRef.current) return;
    const imageSrc = canvasRef.current.toDataURL(); // We save the rendered state for history thumbnailing if needed, but since we re-render original, we just save the colors

    historyStackRef.current.push({
      colorOne,
      colorTwo,
      timestamp: formatTimestamp(new Date()),
      originalImageSrc: originalImageRef.current ? originalImageRef.current.src : null
    });
    redoStackRef.current = [];
  };

  const restoreState = (stateObj) => {
    if (!stateObj) return;

    setColorOne(stateObj.colorOne);
    setColorTwo(stateObj.colorTwo);

    // If the underlying image changed in history, we need to reload it
    if (stateObj.originalImageSrc && (!originalImageRef.current || originalImageRef.current.src !== stateObj.originalImageSrc)) {
      loadImage(stateObj.originalImageSrc, false); // false = don't save another state
    } else {
      // Trigger effect via state change will re-run applyDuotone
    }
  };

  const undo = () => {
    if (historyStackRef.current.length > 1) {
      const currentState = historyStackRef.current.pop();
      redoStackRef.current.push(currentState);
      restoreState(historyStackRef.current[historyStackRef.current.length - 1]);
    }
  };

  const redo = () => {
    if (redoStackRef.current.length > 0) {
      const nextState = redoStackRef.current.pop();
      historyStackRef.current.push(nextState);
      restoreState(nextState);
    }
  };

  // --- ACTIONS ---
  const loadImage = (src, shouldSaveState = true) => {
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      applyDuotone();
      if (shouldSaveState) saveState();
    };
    img.onerror = () => {
      console.error("Failed to load image");
      setIsLoading(false);
    };
    img.src = src;
  };

  const loadRandomImage = () => {
    const url = "https://picsum.photos/700/500?" + Date.now();
    loadImage(url);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      loadImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = (format) => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL(`image/${format}`);
    link.download = `duotone-image.${format}`;
    link.click();
    setShowExportOptions(false);
  };

  const applyPreset = (c1, c2) => {
    setColorOne(c1);
    setColorTwo(c2);
    // useEffect will catch the color changes and applyDuotone + saveState
  };

  const pickRandomPreset = () => {
    const presets = [
      ["#D94135", "#FFEF00"], ["#FF6B6B", "#4ECDC4"], ["#2C3E50", "#FD746C"],
      ["#614385", "#516395"], ["#FFD200", "#F7971E"], ["#56CCF2", "#2F80ED"],
      ["#F2994A", "#F2C94C"], ["#11998e", "#38ef7d"], ["#8E2DE2", "#4A00E0"]
    ];
    const random = presets[Math.floor(Math.random() * presets.length)];
    applyPreset(random[0], random[1]);
    loadRandomImage();
  };

  // --- EFFECT HOOKS ---

  // Initial Load
  useEffect(() => {
    if (!isFullTab || initialLoadDone.current) return;
    initialLoadDone.current = true;
    loadRandomImage();

    // Setup outside click listener to close dropdowns
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.sidebar-item')) {
        setShowExportOptions(false);
        setShowHistoryPanel(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isFullTab]);

  // Re-apply when colors change (if image is already loaded)
  useEffect(() => {
    if (originalImageRef.current && !isLoading) {
      applyDuotone();
      // Don't save state on every tiny color picker drag, save on mouseup/change 
      // handled specifically by the input onBlur/onChange events if needed, 
      // but for simplicity we save it here, throttle if it gets laggy.
      saveState();
    }
  }, [colorOne, colorTwo]);

  if (!isFullTab) {
    return (
      <div style={STYLES.compactWrapper} className={uniqueWrapperClass}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={STYLES.subtitle}><strong>Duotone Editor</strong> ({instanceId})</span>
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
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Font Awesome Injection for icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{duotoneStyle}</style>

      <div className={uniqueWrapperClass}>
        <ControlsMenu
          onReload={onCodeReloadRequest}
          onToggle={onToggleFullTab}
          styles={STYLES}
        />

        <div className="editor-container">

          {/* LEFT SIDEBAR */}
          <div className="sidebar left">
            <div className="sidebar-item">
              <div className="color-pickers">
                <div className="color-picker" style={{ backgroundColor: colorOne }}>
                  <input
                    type="color"
                    value={colorOne}
                    onChange={(e) => setColorOne(e.target.value)}
                  />
                </div>
                <div className="color-picker" style={{ backgroundColor: colorTwo }}>
                  <input
                    type="color"
                    value={colorTwo}
                    onChange={(e) => setColorTwo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sidebar-item">
              <button className="sidebar-btn" onClick={pickRandomPreset}>
                <i className="fa-solid fa-shuffle"></i> Random Photo
              </button>
            </div>

            <div className="sidebar-item">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button className="sidebar-btn" onClick={() => fileInputRef.current.click()}>
                <i className="fa-solid fa-upload"></i> Upload Image
              </button>
            </div>

            <div className="sidebar-item">
              <button className="sidebar-btn" onClick={(e) => { e.stopPropagation(); setShowExportOptions(!showExportOptions); setShowHistoryPanel(false); }}>
                <i className="fa-solid fa-download"></i> Download Image
              </button>
              {showExportOptions && (
                <div className="dropdown-content" style={{ display: 'block' }}>
                  <div className="dropdown-item" onClick={() => downloadImage('png')}>
                    <i className="fa-solid fa-file-image"></i> PNG
                  </div>
                  <div className="dropdown-item" onClick={() => downloadImage('jpeg')}>
                    <i className="fa-solid fa-file-image"></i> JPEG
                  </div>
                  <div className="dropdown-item" onClick={() => downloadImage('webp')}>
                    <i className="fa-solid fa-file-image"></i> WebP
                  </div>
                </div>
              )}
            </div>

            <div className="sidebar-item">
              <button className="sidebar-btn" onClick={undo}>
                <i className="fa-solid fa-rotate-left"></i> Undo
              </button>
            </div>

            <div className="sidebar-item">
              <button className="sidebar-btn" onClick={redo}>
                <i className="fa-solid fa-rotate-right"></i> Redo
              </button>
            </div>

            <div className="sidebar-item">
              <button className="sidebar-btn" onClick={(e) => { e.stopPropagation(); setShowHistoryPanel(!showHistoryPanel); setShowExportOptions(false); }}>
                <i className="fa-solid fa-clock-rotate-left"></i> History
              </button>
              {showHistoryPanel && (
                <div className="dropdown-content history-panel-container" style={{ display: 'block' }}>
                  {historyStackRef.current.map((state, index) => (
                    <div
                      key={index}
                      className="history-item"
                      onClick={() => restoreState(state)}
                    >
                      {state.timestamp}
                    </div>
                  ))}
                  {historyStackRef.current.length === 0 && (
                    <div className="history-item">No history yet</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CANVAS WORKSPACE */}
          <div className="image-preview">
            {isLoading && (
              <div id="loading-spinner">
                <div className="spinner"></div>
              </div>
            )}
            <canvas ref={canvasRef}></canvas>
          </div>

          {/* RIGHT SIDEBAR (PRESETS) */}
          <div className="sidebar right">
            <div className="sidebar-item presets-header">
              <div className="presets-title">Presets</div>
            </div>

            <div className="sidebar-item presets-wrap">
              <div className="preset-list">
                <div className={`dropdown-item ${colorOne === "#D94135" && colorTwo === "#FFEF00" ? 'selected' : ''}`} onClick={() => applyPreset("#D94135", "#FFEF00")}>
                  <i className="fa-solid fa-sun"></i> Sunburn
                </div>
                <div className={`dropdown-item ${colorOne === "#FF6B6B" && colorTwo === "#4ECDC4" ? 'selected' : ''}`} onClick={() => applyPreset("#FF6B6B", "#4ECDC4")}>
                  <i className="fa-solid fa-city"></i> Vice City
                </div>
                <div className={`dropdown-item ${colorOne === "#2C3E50" && colorTwo === "#FD746C" ? 'selected' : ''}`} onClick={() => applyPreset("#2C3E50", "#FD746C")}>
                  <i className="fa-solid fa-camera"></i> Darkroom
                </div>
                <div className={`dropdown-item ${colorOne === "#614385" && colorTwo === "#516395" ? 'selected' : ''}`} onClick={() => applyPreset("#614385", "#516395")}>
                  <i className="fa-solid fa-spa"></i> Lavender
                </div>
                <div className={`dropdown-item ${colorOne === "#FFD200" && colorTwo === "#F7971E" ? 'selected' : ''}`} onClick={() => applyPreset("#FFD200", "#F7971E")}>
                  <i className="fa-solid fa-star"></i> Sunshine
                </div>
                <div className={`dropdown-item ${colorOne === "#56CCF2" && colorTwo === "#2F80ED" ? 'selected' : ''}`} onClick={() => applyPreset("#56CCF2", "#2F80ED")}>
                  <i className="fa-solid fa-droplet"></i> Sky Blue
                </div>
                <div className={`dropdown-item ${colorOne === "#F2994A" && colorTwo === "#F2C94C" ? 'selected' : ''}`} onClick={() => applyPreset("#F2994A", "#F2C94C")}>
                  <i className="fa-solid fa-fire"></i> Warm Flame
                </div>
                <div className={`dropdown-item ${colorOne === "#11998e" && colorTwo === "#38ef7d" ? 'selected' : ''}`} onClick={() => applyPreset("#11998e", "#38ef7d")}>
                  <i className="fa-solid fa-leaf"></i> Fresh Grass
                </div>
                <div className={`dropdown-item ${colorOne === "#8E2DE2" && colorTwo === "#4A00E0" ? 'selected' : ''}`} onClick={() => applyPreset("#8E2DE2", "#4A00E0")}>
                  <i className="fa-solid fa-moon"></i> Deep Purple
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

return { DuotoneEditorComponent };