


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
  const CHAR_CHANGE_INTERVAL = 3000;
  const CHAR_CHANGE_CHANCE = 0.015;
  const BREATHING_SPEED = 0.0015;
  const BREATHING_AMOUNT = 0.1;
  const FRICTION = 0.97; // Higher friction for snappier feel
  const MIN_ROTATION_SPEED = 0.0003; // Lower threshold before returning to base
  
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
    velocityY: 0,
    dragStartTime: 0
  }).current;

  const config = useRef({
    SPHERE_RADIUS: 180, // Slightly smaller for better performance
    NUM_POINTS: 250, // Further reduced from 300 for better performance
    FONT_BASE_SIZE: 16,
    FIELD_OF_VIEW: 500,
    BASE_ROTATION_SPEED_X: 0.002,
    BASE_ROTATION_SPEED_Y: 0.004,
    rotX: 0,
    rotY: 0,
    rotationSpeedX: 0.002,
    rotationSpeedY: 0.004,
    points: [],
    lastCharChange: 0,
    breathingPhase: 0,
    needsResize: true
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
    mouseState.dragStartTime = Date.now();
    e.preventDefault();
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - mouseState.lastX;
    const deltaY = e.clientY - mouseState.lastY;

    // Much more responsive drag sensitivity
    config.rotationSpeedY = deltaX * 0.015;
    config.rotationSpeedX = -deltaY * 0.015;

    mouseState.velocityX = -deltaY * 0.015;
    mouseState.velocityY = deltaX * 0.015;

    mouseState.lastX = e.clientX;
    mouseState.lastY = e.clientY;
    e.preventDefault();
  };

  const handlePointerUp = () => {
    const dragDuration = Date.now() - mouseState.dragStartTime;
    
    // If it was a quick drag, apply even more momentum
    if (dragDuration < 200) {
      mouseState.velocityX *= 2;
      mouseState.velocityY *= 2;
    }
    
    setIsDragging(false);
    config.rotationSpeedX = mouseState.velocityX;
    config.rotationSpeedY = mouseState.velocityY;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true, // Better performance
      willReadFrequently: false
    });
    let resizeTimeout;
    let rafId;
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    function resizeCanvas() {
      const container = canvas.parentElement;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Reduced from 2 for better performance
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      ctx.scale(dpr, dpr);
      config.needsResize = false;
    }

    function handleResize() {
      config.needsResize = true;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
      }, 100);
    }

    function animate(currentTime) {
      if (!canvas.parentElement) return;
      
      // Throttle to target FPS
      const elapsed = currentTime - lastFrameTime;
      if (elapsed < frameInterval) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime - (elapsed % frameInterval);
      
      // Check if resize is needed
      if (config.needsResize) {
        resizeCanvas();
      }
      
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Use solid fill for better performance
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      if (!isDragging) {
        // Apply friction
        config.rotationSpeedX *= FRICTION;
        config.rotationSpeedY *= FRICTION;

        // Return to base rotation smoothly when speed is very low
        if (Math.abs(config.rotationSpeedX) < MIN_ROTATION_SPEED && 
            Math.abs(config.rotationSpeedY) < MIN_ROTATION_SPEED) {
          config.rotationSpeedX += (config.BASE_ROTATION_SPEED_X - config.rotationSpeedX) * 0.03;
          config.rotationSpeedY += (config.BASE_ROTATION_SPEED_Y - config.rotationSpeedY) * 0.03;
        }
      }

      config.rotX += config.rotationSpeedX;
      config.rotY += config.rotationSpeedY;

      config.breathingPhase += BREATHING_SPEED;
      const breathingScale = 1 + Math.sin(config.breathingPhase) * BREATHING_AMOUNT;

      const projectedPoints = [];
      
      // Pre-calculate trig values
      const cosY = Math.cos(config.rotY);
      const sinY = Math.sin(config.rotY);
      const cosX = Math.cos(config.rotX);
      const sinX = Math.sin(config.rotX);
      
      // Batch calculations
      const len = config.points.length;
      for (let i = 0; i < len; i++) {
        const p = config.points[i];
        
        const breathedX = p.x * breathingScale;
        const breathedY = p.y * breathingScale;
        const breathedZ = p.z * breathingScale;

        // Y-axis rotation
        const x1 = breathedX * cosY - breathedZ * sinY;
        const z1 = breathedZ * cosY + breathedX * sinY;

        // X-axis rotation
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

      // Sort once
      projectedPoints.sort((a, b) => a.z - b.z);

      // Set text properties once
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const radiusScaled = config.SPHERE_RADIUS * breathingScale;
      const twoRadiusScaled = 2 * radiusScaled;
      
      // Render in one pass
      for (let i = 0; i < len; i++) {
        const p = projectedPoints[i];
        const normalizedZ = (p.z + radiusScaled) / twoRadiusScaled;
        const lightness = 15 + normalizedZ * 80; // Simplified calculation
        const alpha = 0.3 + normalizedZ * 0.7;

        ctx.fillStyle = `hsla(270, 60%, ${lightness | 0}%, ${alpha})`;
        ctx.font = `${(config.FONT_BASE_SIZE * p.scale) | 0}px monospace`;
        ctx.fillText(p.char, p.x, p.y);
      }

      rafId = requestAnimationFrame(animate);
    }

    // Initial resize and start animation
    resizeCanvas();
    window.addEventListener('resize', handleResize);
    
    // Force initial render after a frame
    requestAnimationFrame(() => {
      resizeCanvas();
      rafId = requestAnimationFrame(animate);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      if (rafId) {
        cancelAnimationFrame(rafId);
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
        .${uniqueWrapperClass} .subtle-icon {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        .${uniqueWrapperClass}:hover .subtle-icon {
          opacity: 0.7;
          transform: scale(1);
        }
        .${uniqueWrapperClass} .subtle-icon:hover {
          opacity: 1;
        }
        .sphere-canvas {
          cursor: ${isDragging ? 'grabbing' : 'grab'};
          user-select: none;
          -webkit-user-select: none;
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
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "24px",
              userSelect: "none",
              cursor: "pointer",
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            className="subtle-icon"
            onClick={() => setIsFullTab(false)}
          >
            <dc.Icon icon="minimize-2" style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />
          </div>
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
            onPointerCancel={handlePointerUp}
          />
        </div>
      ) : (
        <div
          style={{
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "12px",
            backgroundColor: "#0a0a0a",
            fontFamily: 'monospace'
          }}
        >
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Cuneiform Sphere - Compact Mode
          </p>
          <button
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#e0e0e0',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setIsFullTab(true)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
              e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
              e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            }}
          >
            <dc.Icon icon="maximize-2" style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
            Enter Full Tab
          </button>
        </div>
      )}
    </div>
  );
}

return { View: AsciiSphereView };
```


