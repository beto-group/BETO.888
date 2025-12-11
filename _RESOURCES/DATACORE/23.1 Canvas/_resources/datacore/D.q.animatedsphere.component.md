


# ViewComponent

```jsx
const { useState, useRef, useEffect } = dc;

function AsciiSphereView() {
  // ========== CONFIGURATION ==========
  const CHARACTERS = [
    '𒀂', '𒆳', '𒀁', '𒋤', '𒈹', '𒑄', '𒎓', '𒋽', '𒀅', '𒈾', '𒌐', '𒀭', '𒐬',
    '𒅆', '𒌓', '𒍪', '𒁓', '𒉌', '𒍪', '𒄮', '𒄭', '𒉍', '𒀏', '𒅆', '𒍑', '𒇻',
    '𒈢', '𒐖', '𒇹', '$', '𒅖', '𒍪', '𒈨', '𒀼', '𒀳', '𒇳', '𒄷', '𒁐',
    '𒀹', '𒐕', '𒉺', '𒊕', '𒄑', '𒀀', '𒊒', '𒍣', '𒀄', '𒀃', '𒀭'
  ];
  const CHAR_CHANGE_INTERVAL = 2000;
  const CHAR_CHANGE_CHANCE = 0.02;
  const BREATHING_SPEED = 0.002;
  const BREATHING_AMOUNT = 0.15;
  
  const [isFullTab, setIsFullTab] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  const uniqueWrapperClass = "sphere-fulltab-" + useRef(Math.random().toString(36).substr(2, 9)).current;

  const mouseState = useRef({
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0
  }).current;

  const config = useRef({
    SPHERE_RADIUS: 200,
    NUM_POINTS: 400,
    FONT_BASE_SIZE: 16,
    FIELD_OF_VIEW: 500,
    BASE_ROTATION_SPEED_X: 0.003,
    BASE_ROTATION_SPEED_Y: 0.005,
    rotX: 0,
    rotY: 0,
    rotationSpeedX: 0.003,
    rotationSpeedY: 0.005,
    points: [],
    lastCharChange: 0,
    breathingPhase: 0
  }).current;

  useEffect(() => {
    if (config.points.length > 0) return;
    
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    for (let i = 0; i < config.NUM_POINTS; i++) {
      const t = 1 - 2 * (i + 0.5) / config.NUM_POINTS;
      const radiusAtT = Math.sqrt(1 - t * t);
      const theta = i * angleIncrement;

      config.points.push({
        x: Math.cos(theta) * radiusAtT * config.SPHERE_RADIUS,
        y: t * config.SPHERE_RADIUS,
        z: Math.sin(theta) * radiusAtT * config.SPHERE_RADIUS,
        char: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - config.lastCharChange >= CHAR_CHANGE_INTERVAL) {
        config.points.forEach(point => {
          if (Math.random() < CHAR_CHANGE_CHANCE) {
            point.char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          }
        });
        config.lastCharChange = now;
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    mouseState.lastX = e.clientX;
    mouseState.lastY = e.clientY;
    mouseState.velocityX = 0;
    mouseState.velocityY = 0;
    e.preventDefault();
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - mouseState.lastX;
    const deltaY = e.clientY - mouseState.lastY;

    config.rotationSpeedY = deltaX * 0.005;
    config.rotationSpeedX = -deltaY * 0.005;

    mouseState.velocityX = -deltaY * 0.005;
    mouseState.velocityY = deltaX * 0.005;

    mouseState.lastX = e.clientX;
    mouseState.lastY = e.clientY;
    e.preventDefault();
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    config.rotationSpeedX = mouseState.velocityX;
    config.rotationSpeedY = mouseState.velocityY;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let resizeTimeout;

    function resizeCanvas() {
      const container = canvas.parentElement;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      ctx.scale(dpr, dpr);
    }

    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    }

    function animate() {
      if (!canvas.parentElement) return;
      
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      if (!isDragging) {
        config.rotationSpeedX *= 0.98;
        config.rotationSpeedY *= 0.98;

        if (Math.abs(config.rotationSpeedX) < 0.001 && Math.abs(config.rotationSpeedY) < 0.001) {
          config.rotationSpeedX += (config.BASE_ROTATION_SPEED_X - config.rotationSpeedX) * 0.05;
          config.rotationSpeedY += (config.BASE_ROTATION_SPEED_Y - config.rotationSpeedY) * 0.05;
        }
      }

      config.rotX += config.rotationSpeedX;
      config.rotY += config.rotationSpeedY;

      config.breathingPhase += BREATHING_SPEED;
      const breathingScale = 1 + Math.sin(config.breathingPhase) * BREATHING_AMOUNT;

      const projectedPoints = [];
      
      for (let i = 0; i < config.points.length; i++) {
        const p = config.points[i];
        
        const breathedX = p.x * breathingScale;
        const breathedY = p.y * breathingScale;
        const breathedZ = p.z * breathingScale;

        const cosY = Math.cos(config.rotY);
        const sinY = Math.sin(config.rotY);
        const x1 = breathedX * cosY - breathedZ * sinY;
        const z1 = breathedZ * cosY + breathedX * sinY;

        const cosX = Math.cos(config.rotX);
        const sinX = Math.sin(config.rotX);
        const y1 = breathedY * cosX - z1 * sinX;
        const z2 = z1 * cosX + breathedY * sinX;

        const scale = config.FIELD_OF_VIEW / (config.FIELD_OF_VIEW - z2);
        
        projectedPoints.push({
          x: x1 * scale + width / 2,
          y: y1 * scale + height / 2,
          z: z2,
          scale: scale,
          char: p.char
        });
      }

      projectedPoints.sort((a, b) => a.z - b.z);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const radiusScaled = config.SPHERE_RADIUS * breathingScale;
      
      for (let i = 0; i < projectedPoints.length; i++) {
        const p = projectedPoints[i];
        const normalizedZ = (p.z + radiusScaled) / (2 * radiusScaled);
        const lightness = Math.max(10, Math.min(100, normalizedZ * 100));
        const alpha = Math.max(0.2, Math.min(1, normalizedZ + 0.3));

        ctx.fillStyle = `hsla(0, 0%, ${lightness}%, ${alpha})`;
        ctx.font = `${config.FONT_BASE_SIZE * p.scale}px monospace`;
        ctx.fillText(p.char, p.x, p.y);
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener('resize', handleResize);
    
    requestAnimationFrame(() => {
      resizeCanvas();
      animate();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    
    if (!container.parentNode) {
      const timer = setTimeout(() => setIsFullTab(true), 50);
      return () => clearTimeout(timer);
    }
    
    function findNearestAncestorWithClass(element, className) {
      if (!element) return null;
      let current = element.parentNode;
      while (current) {
        if (current.classList && current.classList.contains(className)) {
          return current;
        }
        current = current.parentNode;
      }
      return null;
    }
    
    function findDirectChildByClass(parent, className) {
      if (!parent) return null;
      for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) {
          return child;
        }
      }
      return null;
    }
    
    const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }
    
    const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement('div');
    stateRefs.placeholder.style.display = 'none';
    container.parentNode.insertBefore(stateRefs.placeholder, container);
    
    const computedParentPosition = window.getComputedStyle(contentWrapper).position;
    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      originalInlinePosition: contentWrapper.style.position
    };
    
    if (computedParentPosition === 'static') {
      contentWrapper.style.position = "relative";
    }
    
    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0px",
      left: "0px",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "hidden"
    });
    
    return () => {
      if (!stateRefs.originalParent) return;
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      } else {
        stateRefs.originalParent.appendChild(container);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || '';
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
    };
  }, [isFullTab]);

  return (
    <div ref={containerRef}>
      <style>{`
        .${uniqueWrapperClass}:hover .subtle-icon {
          opacity: 0.7;
          transform: scale(1);
        }
        .sphere-canvas {
          cursor: ${isDragging ? 'grabbing' : 'grab'};
        }
      `}</style>
      {isFullTab ? (
        <div 
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            position: 'relative',
            overflow: 'hidden'
          }}
          className={uniqueWrapperClass}
        >
          <span
            style={{
              position: "absolute",
              top: "15px",
              right: "20px",
              fontFamily: "monospace",
              fontSize: "18px",
              color: "#aaa",
              userSelect: "none",
              cursor: "pointer",
              opacity: 0,
              transform: "scale(0.9)",
              transition: "opacity 0.2s, transform 0.2s",
              zIndex: 10
            }}
            className="subtle-icon"
            title="Exit Full Tab"
            onClick={() => setIsFullTab(false)}
          >
            &lt;/&gt;
          </span>
          <canvas
            ref={canvasRef}
            className="sphere-canvas"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
      ) : (
        <div
          style={{
            padding: "16px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            border: "1px dashed #333",
            borderRadius: "8px",
            backgroundColor: "#222"
          }}
        >
          <p style={{ margin: 0, color: "#aaa", fontSize: "14px" }}>
            Cuneiform Sphere - Compact Mode
          </p>
          <button
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: '#5865f2',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setIsFullTab(true)}
          >
            Enter Full Tab
          </button>
        </div>
      )}
    </div>
  );
}

return { View: AsciiSphereView };
```


