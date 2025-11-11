


# ViewComponent

```jsx
const { useRef, useEffect, useState } = dc;

const LetterGlitch = ({
  // Default props now serve as initial values for the state
  initialGlitchColors = ['#37003C', '#8A2BE2', '#E0BBE4'],
  className = '',
  initialGlitchSpeed = 50,
  initialCenterVignette = false,
  initialOuterVignette = true,
  initialSmooth = true,
  initialFontSize = 16,
}) => {
  // --- STATE MANAGEMENT FOR EDITABLE PROPERTIES ---
  const [glitchColors, setGlitchColors] = useState(initialGlitchColors);
  const [glitchSpeed, setGlitchSpeed] = useState(initialGlitchSpeed);
  const [centerVignette, setCenterVignette] = useState(initialCenterVignette);
  const [outerVignette, setOuterVignette] = useState(initialOuterVignette);
  const [smooth, setSmooth] = useState(initialSmooth);
  const [fontSize, setFontSize] = useState(initialFontSize);

  // --- UI STATE ---
  const [isHovered, setIsHovered] = useState(false);
  const [isEditPanelVisible, setIsEditPanelVisible] = useState(false);

  // --- REFS FOR CANVAS AND ANIMATION ---
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const letters = useRef([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef(null);
  const lastGlitchTime = useRef(Date.now());

  // --- DYNAMIC CHARACTER SIZING ---
  const charWidth = fontSize * 1.3;
  const charHeight = fontSize * 1.3;

  const lettersAndSymbols = [
    '𒀂', '𒆳', '𒀁', '𒋤', '𒈹', '𒑄', '𒎓', '𒋽', '𒀅', '𒈾', '𒌐', '𒀭', '𒐬',
    '𒅆', '𒌓', '𒍪', '𒁓', '𒉌', '𒍪', '𒄮', '𒄭', '𒉍', '𒀏', '𒅆', '𒍑', '𒇻',
    '𒈢', '𒐖', '𒇹', '$', '𒅖', '𒍪', '𒈨', '𒀼', '𒀳', '𒇳', '𒄷', '𒁐',
    '𒀹', '𒐕', '𒉺', '𒊕', '𒄑', '𒀀', '𒊒', '𒍣', '𒀄',
    '𒀃', '𒀭'
  ];

  // --- CORE ANIMATION & DRAWING LOGIC (ADAPTED TO USE STATE) ---

  const getRandomChar = () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const interpolateColor = (start, end, factor) => {
    const result = {
      r: Math.round(start.r + (end.r - start.r) * factor),
      g: Math.round(start.g + (end.g - start.g) * factor),
      b: Math.round(start.b + (end.b - start.b) * factor),
    };
    return `rgb(${result.r}, ${result.g}, ${result.b})`;
  };

  const calculateGrid = (width, height) => ({
    columns: Math.ceil(width / charWidth),
    rows: Math.ceil(height / charHeight)
  });

  const initializeLetters = (columns, rows) => {
    grid.current = { columns, rows };
    letters.current = Array.from({ length: columns * rows }, () => ({
      char: getRandomChar(),
      color: getRandomColor(),
      targetColor: getRandomColor(),
      colorProgress: 1,
    }));
  };

  const drawLetters = () => {
    if (!context.current) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    letters.current.forEach((letter, index) => {
      const x = (index % grid.current.columns) * charWidth;
      const y = Math.floor(index / grid.current.columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  };

  const updateLetters = () => {
    if (!letters.current.length) return;
    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.05));
    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * letters.current.length);
      if (!letters.current[index]) continue;
      letters.current[index] = {
        ...letters.current[index],
        char: getRandomChar(),
        targetColor: getRandomColor(),
        colorProgress: smooth ? 0 : 1,
        color: smooth ? letters.current[index].color : getRandomColor(),
      };
    }
  };
  
  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    letters.current.forEach((letter) => {
      if (letter.colorProgress < 1) {
        letter.colorProgress = Math.min(1, letter.colorProgress + 0.05);
        const startRgb = hexToRgb(letter.color);
        const endRgb = hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
        }
        needsRedraw = true;
      }
    });
    if (needsRedraw) drawLetters();
  };

  const animate = () => {
    const now = Date.now();
    if (now - lastGlitchTime.current >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime.current = now;
    }
    if (smooth) handleSmoothTransitions();
    animationRef.current = requestAnimationFrame(animate);
  };
  
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (context.current) context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  // --- USEEFFECT FOR SETUP AND RESIZING ---
  useEffect(() => {
    context.current = canvasRef.current?.getContext('2d');
    
    // Wrapped in a function to be callable from timeout
    const setupAndStartAnimation = () => {
        resizeCanvas();
        // Cancel any existing animation frame before starting a new one
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        animate();
    };

    setupAndStartAnimation();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setupAndStartAnimation, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [glitchSpeed, smooth, fontSize, glitchColors]); // Re-run when these state values change

  // --- EVENT HANDLERS FOR UI ---
  const goFullScreen = () => {
    const elem = containerRef.current;
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        elem?.requestFullscreen().catch(err => console.error(err));
    }
  };
  
  const handleColorChange = (index, newColor) => {
    const newColors = [...glitchColors];
    newColors[index] = newColor;
    setGlitchColors(newColors);
  };

  const addColor = () => setGlitchColors([...glitchColors, '#FFFFFF']);
  const removeColor = (index) => setGlitchColors(glitchColors.filter((_, i) => i !== index));

  // --- STYLES ---
  const containerStyle = { position: 'relative', width: '100%', height: '100%', backgroundColor: '#000000', overflow: 'hidden' };
  const canvasStyle = { display: 'block', width: '100%', height: '100%' };
  const vignetteStyle = (gradient) => ({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: gradient });
  const hoverZoneStyle = { position: 'absolute', top: '0', right: '0', width: '150px', height: '100px', zIndex: 1000 };
  const topButtonsContainerStyle = { display: 'flex', gap: '8px', position: 'absolute', top: '10px', right: '10px', zIndex: 1001 };
  const buttonStyle = { padding: '8px 12px', backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' };
  
  // Edit Panel Styles
  const editPanelStyle = {
    position: 'absolute', top: 0, right: isEditPanelVisible ? '0' : '-300px', width: '280px', height: '100%',
    backgroundColor: 'rgba(20, 20, 20, 0.9)', backdropFilter: 'blur(5px)', zIndex: 2000,
    transition: 'right 0.3s ease-in-out', color: 'white', padding: '20px', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto'
  };
  const controlGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
  const labelStyle = { margin: 0, fontSize: '14px', fontWeight: 'bold' };
  const inputStyle = { width: '100%', accentColor: '#8A2BE2' };
  const checkboxContainerStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
  const colorInputContainerStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
  const colorInputStyle = { width: '40px', height: '30px', border: 'none', padding: 0, background: 'none' };
  
  // --- RENDER ---
  return (
    <div ref={containerRef} style={containerStyle} className={className}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      
      <canvas ref={canvasRef} style={canvasStyle} />
      {outerVignette && <div style={vignetteStyle('radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)')}></div>}
      {centerVignette && <div style={vignetteStyle('radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)')}></div>}

      {isHovered && !isEditPanelVisible && (
        <div style={topButtonsContainerStyle}>
          <button onClick={() => setIsEditPanelVisible(true)} style={buttonStyle}>Edit</button>
          <button onClick={goFullScreen} style={buttonStyle}>Full Screen</button>
        </div>
      )}

      <div style={editPanelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Controls</h3>
          <button onClick={() => setIsEditPanelVisible(false)} style={{...buttonStyle, padding: '4px 8px'}}>X</button>
        </div>

        <div style={controlGroupStyle}>
          <label htmlFor="speed" style={labelStyle}>Glitch Speed: {glitchSpeed}ms</label>
          <input id="speed" type="range" min="10" max="500" value={glitchSpeed} onChange={(e) => setGlitchSpeed(Number(e.target.value))} style={inputStyle} />
        </div>

        <div style={controlGroupStyle}>
          <label htmlFor="fontSize" style={labelStyle}>Font Size: {fontSize}px</label>
          <input id="fontSize" type="range" min="8" max="40" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={inputStyle} />
        </div>

        <div style={controlGroupStyle}>
          <label style={labelStyle}>Colors</label>
          {glitchColors.map((color, index) => (
            <div key={index} style={colorInputContainerStyle}>
              <input type="color" value={color} onChange={(e) => handleColorChange(index, e.target.value)} style={colorInputStyle} />
              <span>{color}</span>
              <button onClick={() => removeColor(index)} style={{...buttonStyle, marginLeft: 'auto', padding: '2px 6px' }}>-</button>
            </div>
          ))}
          <button onClick={addColor} style={buttonStyle}>+ Add Color</button>
        </div>

        <div style={controlGroupStyle}>
          <label style={labelStyle}>Options</label>
          <div style={checkboxContainerStyle}><input type="checkbox" id="smooth" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} /><label htmlFor="smooth">Smooth Transitions</label></div>
          <div style={checkboxContainerStyle}><input type="checkbox" id="outerVignette" checked={outerVignette} onChange={(e) => setOuterVignette(e.target.checked)} /><label htmlFor="outerVignette">Outer Vignette</label></div>
          <div style={checkboxContainerStyle}><input type="checkbox" id="centerVignette" checked={centerVignette} onChange={(e) => setCenterVignette(e.target.checked)} /><label htmlFor="centerVignette">Center Vignette</label></div>
        </div>
      </div>
    </div>
  );
};

return { LetterGlitch };
```