
## ViewComponent

```jsx
const componentPath = dc.resolvePath("D.q.aquarium.component");

const { Aquarium } = await dc.require(dc.headerLink(componentPath, "Aquarium"));
const { loadScript } = await dc.require(dc.headerLink(componentPath, "LoadScript"));

// DOM Traversal Utilities for full-tab mode
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

function AquariumView({ fishes = [
  { name: 'Brush Teeth' },
  { name: 'Read' },
  { name: 'Exercise' },
  { name: 'Journal' },
  { name: 'Code' },
  { name: 'Vitamins' },
]}) {
  const aquariumRef = dc.useRef();
  const containerRef = dc.useRef(null);
  const [isRefReady, setIsRefReady] = dc.useState(false);
  
  // Full-tab mode state
  const [isFullTab, setIsFullTab] = dc.useState(true);
  const stateRefs = dc.useRef({}).current;
  
  // Bounds configuration
  const debugBounds = {
    topPercent: 36,
    heightPercent: 26,
    leftPadding: 53,
    rightPadding: 64,
  };

  // Check when ref is ready
  dc.useEffect(() => {
    if (aquariumRef.current) {
      setIsRefReady(true);
    }
  }, [aquariumRef.current]);

  // Load lottie-player with caching
  dc.useEffect(() => {
    if (!window.customElements.get("lottie-player")) {
      loadScript(dc, "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js")
        .catch(err => console.error("Failed to load lottie-player:", err));
    }
  }, []);

  // Full-tab DOM manipulation
  dc.useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;

    const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
    if (!targetPaneContent) return;

    const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;

    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement("div");
    stateRefs.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.placeholder, container);

    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    if (stateRefs.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }

    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      backgroundColor: "var(--background-primary)",
      overflow: "auto",
    });

    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  // Compact mode view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed var(--background-modifier-border)",
        borderRadius: "8px",
        backgroundColor: "var(--background-primary-alt)",
      }}>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px" }}>
          🐠 Aquarium in compact mode
        </p>
        <button
          onClick={() => setIsFullTab(true)}
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--text-on-accent)",
            backgroundColor: "var(--interactive-accent)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  const [showDebugMenu, setShowDebugMenu] = dc.useState(false);

  return (
    <div ref={containerRef} style={{
      position: "relative",
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "var(--background-primary)",
      overflow: "hidden",
    }}>
      {/* Top control buttons */}
      <div style={{
        position: "absolute",
        top: "15px",
        right: "20px",
        display: "flex",
        gap: "10px",
        zIndex: "1000",
      }}>
        {/* Debug button */}
        <button
          onClick={() => setShowDebugMenu(!showDebugMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: "500",
            color: showDebugMenu ? "var(--text-on-accent)" : "var(--text-faint)",
            backgroundColor: showDebugMenu ? "var(--interactive-accent)" : "rgba(0, 0, 0, 0.5)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!showDebugMenu) {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              e.currentTarget.style.color = "var(--text-normal)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showDebugMenu) {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
              e.currentTarget.style.color = "var(--text-faint)";
            }
          }}
        >
          <dc.Icon icon="bug" style={{ fontSize: "16px" }} />
          <span>Debug</span>
        </button>

        {/* Exit full-tab button */}
        <button
          onClick={() => setIsFullTab(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: "500",
            color: "var(--text-faint)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            e.currentTarget.style.color = "var(--text-normal)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            e.currentTarget.style.color = "var(--text-faint)";
          }}
        >
          <dc.Icon icon="minimize-2" style={{ fontSize: "16px" }} />
          <span>Exit Full Tab</span>
        </button>
      </div>
      
      <div className="tank" ref={aquariumRef} style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}>
        {isRefReady ? (
          <Aquarium
            aquariumRef={aquariumRef.current}
            fishes={fishes}
            debugBounds={debugBounds}
            showDebugMenu={showDebugMenu}
          />
        ) : (
          <div style={{ padding: "20px", color: "var(--text-muted)" }}>
            ⏳ Initializing aquarium...
          </div>
        )}
      </div>
    </div>
  );
}

return { AquariumView };

```


## Aquarium

```jsx
const componentPath = dc.resolvePath("D.q.aquarium.component");
const { loadScript } = await dc.require(dc.headerLink(componentPath, "LoadScript"));

// Fuzzy find file using Fuse.js with caching
async function fuzzyFindFile(filename) {
  if (!window.Fuse) {
    await loadScript(dc, "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js");
  }
  const fuse = new Fuse(app.vault.getFiles(), {
    keys: ["name"],
    includeScore: true,
    threshold: 0.4,
  });
  const results = fuse.search(filename);
  return results.length > 0 ? results[0].item : null;
}

// Load media files
async function requireMediaFile(filename) {
  const file = await fuzzyFindFile(filename);
  if (!file) throw new Error(`File "${filename}" not found`);
  return app.vault.getResourcePath(file);
}

// Load Lottie files
let backgroundLottie, fishLottie;

try {
  backgroundLottie = await requireMediaFile('aquarium.json');
} catch (err) {
  console.error('Failed to load aquarium.json:', err);
  backgroundLottie = null;
}

try {
  fishLottie = await requireMediaFile('fish.json');
} catch (err) {
  console.error('Failed to load fish.json:', err);
  fishLottie = null;
}

/**
 * Fish Component - Performance Optimized
 * 
 * Optimizations applied:
 * 1. Refs for animation state - Avoids unnecessary re-renders on internal state changes
 * 2. performance.now() instead of Date.now() - More accurate timing
 * 3. transform3d & GPU acceleration - Hardware-accelerated animations
 * 4. willChange CSS property - Browser optimization hint
 * 5. Proper cleanup - Prevents memory leaks with flags and cancellation
 * 6. Frame interval limiting - Caps at 60 FPS to prevent excessive updates
 */
function FishComponent({ name, bounds, fishLottie }) {
  const [position, setPosition] = dc.useState({ x: 0, y: 0 });
  const [direction, setDirection] = dc.useState(1); // 1 = right, -1 = left
  const [isInitialized, setIsInitialized] = dc.useState(false);
  const [isHovered, setIsHovered] = dc.useState(false);
  const [isEnlarged, setIsEnlarged] = dc.useState(false);
  const [isPinned, setIsPinned] = dc.useState(false);
  const [showName, setShowName] = dc.useState(false);
  
  // Use refs for animation state to avoid re-renders
  const animationStateRef = dc.useRef({
    verticalDirection: (Math.random() - 0.5) * 2,
    frameCount: 0,
    lastHorizontalTurn: 0,
    lastVerticalChange: 0,
    horizontalCooldown: Math.random() * 180 + 120,
    verticalCooldown: Math.random() * 120 + 60,
  });

  const BASE_FISH_WIDTH = 120;
  const BASE_FISH_HEIGHT = 90;
  const ENLARGED_MULTIPLIER = 1.3;
  
  const FISH_WIDTH = isEnlarged ? BASE_FISH_WIDTH * ENLARGED_MULTIPLIER : BASE_FISH_WIDTH;
  const FISH_HEIGHT = isEnlarged ? BASE_FISH_HEIGHT * ENLARGED_MULTIPLIER : BASE_FISH_HEIGHT;
  const SPEED = 1.1;
  const VERTICAL_SPEED = 0.6;

  // Initialize fish position and handle bounds changes
  dc.useEffect(() => {
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;
    
    if (!isInitialized) {
      // Initial spawn
      const spawnX = bounds.left + Math.random() * (bounds.width - FISH_WIDTH);
      const spawnY = bounds.top + Math.random() * (bounds.height - FISH_HEIGHT);
      setPosition({ x: spawnX, y: spawnY });
      setIsInitialized(true);
    } else {
      // Bounds changed (resize), clamp position to new bounds
      setPosition(prev => {
        const clampedX = Math.max(bounds.left, Math.min(prev.x, bounds.left + bounds.width - FISH_WIDTH));
        const clampedY = Math.max(bounds.top, Math.min(prev.y, bounds.top + bounds.height - FISH_HEIGHT));
        return { x: clampedX, y: clampedY };
      });
    }
  }, [bounds, isInitialized, FISH_WIDTH, FISH_HEIGHT]);

  // Animation loop - Optimized to reduce state updates
  dc.useEffect(() => {
    if (!isInitialized || !bounds || bounds.width === 0) return;

    let animationId = null;
    let lastTime = performance.now();
    let isRunning = true;
    const state = animationStateRef.current;
    
    const FPS = 60;
    const FRAME_INTERVAL = 1000 / FPS;

    const animate = (currentTime) => {
      if (!isRunning) return;

      // Pause animation when hovered
      if (isHovered) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - lastTime;

      if (elapsed > FRAME_INTERVAL) {
        lastTime = currentTime - (elapsed % FRAME_INTERVAL);
        state.frameCount++;

        setPosition(prev => {
          let newX = prev.x + (SPEED * direction);
          let newDirection = direction;
          
          // Check horizontal bounds
          const leftEdge = bounds.left;
          const rightEdge = bounds.left + bounds.width - FISH_WIDTH;
          
          if (newX >= rightEdge) {
            newX = rightEdge;
            newDirection = -1;
            setDirection(-1);
            state.lastHorizontalTurn = state.frameCount;
            state.horizontalCooldown = Math.random() * 180 + 120;
          } else if (newX <= leftEdge) {
            newX = leftEdge;
            newDirection = 1;
            setDirection(1);
            state.lastHorizontalTurn = state.frameCount;
            state.horizontalCooldown = Math.random() * 180 + 120;
          } else {
            // Random chance to turn around only if cooldown has passed
            const framesSinceLastTurn = state.frameCount - state.lastHorizontalTurn;
            if (framesSinceLastTurn > state.horizontalCooldown && Math.random() < 0.008) {
              newDirection = -newDirection;
              setDirection(newDirection);
              state.lastHorizontalTurn = state.frameCount;
              state.horizontalCooldown = Math.random() * 180 + 120;
            }
          }

          // Vertical movement with smooth direction changes
          let newY = prev.y + (VERTICAL_SPEED * state.verticalDirection);
          
          const topEdge = bounds.top;
          const bottomEdge = bounds.top + bounds.height - FISH_HEIGHT;
          
          // Bounce off vertical edges
          if (newY >= bottomEdge) {
            newY = bottomEdge;
            state.verticalDirection = -Math.abs(state.verticalDirection);
            state.lastVerticalChange = state.frameCount;
            state.verticalCooldown = Math.random() * 120 + 60;
          } else if (newY <= topEdge) {
            newY = topEdge;
            state.verticalDirection = Math.abs(state.verticalDirection);
            state.lastVerticalChange = state.frameCount;
            state.verticalCooldown = Math.random() * 120 + 60;
          } else {
            // Random chance to change vertical direction only if cooldown has passed
            const framesSinceLastChange = state.frameCount - state.lastVerticalChange;
            if (framesSinceLastChange > state.verticalCooldown && Math.random() < 0.005) {
              state.verticalDirection = (Math.random() - 0.5) * 2;
              state.lastVerticalChange = state.frameCount;
              state.verticalCooldown = Math.random() * 120 + 60;
            }
          }

          return { x: newX, y: newY };
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    
    return () => {
      isRunning = false;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };
  }, [isInitialized, bounds, direction, isHovered, FISH_WIDTH, FISH_HEIGHT, SPEED, VERTICAL_SPEED]);

  if (!isInitialized) return null;

  const handleClick = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    setIsEnlarged(newPinnedState);
    setShowName(newPinnedState);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "0",
        top: "0",
        width: `${FISH_WIDTH}px`,
        height: `${FISH_HEIGHT}px`,
        transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${isEnlarged ? 1.3 : 1})`,
        transition: "transform 0.3s ease",
        zIndex: isHovered || isEnlarged ? "200" : "100",
        pointerEvents: "all",
        cursor: "pointer",
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
      onClick={handleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (!isPinned) setShowName(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isPinned) setShowName(false);
      }}
    >
      <lottie-player
        src={fishLottie}
        background="transparent"
        speed="1"
        style={{
          width: "100%",
          height: "100%",
          transform: `scaleX(${direction})`,
          transition: "transform 0.15s linear",
          filter: isHovered ? "drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))" : "none",
          willChange: "transform",
        }}
        loop
        autoplay
      />
      
      {/* Fish name label */}
      {showName && (
        <div style={{
          position: "absolute",
          top: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0, 170, 187, 0.95)",
          color: "white",
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "600",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          zIndex: "300",
          animation: "fadeIn 0.2s ease",
        }}>
          {name}
        </div>
      )}
    </div>
  );
}

/**
 * Aquarium Component - Container-Proportional Bounds
 * 
 * Bounds are calculated as percentages of the aquarium container itself (not viewport).
 * This ensures the swim area always scales proportionally with the aquarium lottie background,
 * regardless of tab width, sidebars, or container size.
 * 
 * Default values:
 * - topPercent: 30% (from top of container)
 * - heightPercent: 30% (swim area height)
 * - leftPercent: 18% (left padding)
 * - rightPercent: 18% (right padding)
 * 
 * All percentages are relative to container dimensions, so bounds automatically match
 * the aquarium image at any size without complex formulas.
 */
function Aquarium({ aquariumRef, fishes, debugBounds, showDebugMenu }) {
  const [bounds, setBounds] = dc.useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    right: 0,
    bottom: 0,
  });
  const [isLottiePlayerReady, setIsLottiePlayerReady] = dc.useState(false);
  const [localBounds, setLocalBounds] = dc.useState({
    topPercent: debugBounds.topPercent || 30,
    heightPercent: debugBounds.heightPercent || 30,
    leftPercent: 18,
    rightPercent: 18,
  });
  
  // Draggable debug panel state
  const [debugPosition, setDebugPosition] = dc.useState({ x: 20, y: 60 });
  const [isDragging, setIsDragging] = dc.useState(false);
  const [dragOffset, setDragOffset] = dc.useState({ x: 0, y: 0 });
  const debugPanelRef = dc.useRef(null);

  // Wait for lottie-player to be ready
  dc.useEffect(() => {
    const checkLottiePlayer = () => {
      if (window.customElements.get("lottie-player")) {
        setIsLottiePlayerReady(true);
      } else {
        setTimeout(checkLottiePlayer, 100);
      }
    };
    checkLottiePlayer();
  }, []);
  
  // Drag handlers for debug panel
  dc.useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e) => {
      setDebugPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  
  // Calculate bounds on mount and resize - Optimized with debouncing and responsive formula
  dc.useEffect(() => {
    if (!aquariumRef) return;

    let debounceTimer = null;

    const calculateBounds = () => {
      // Get the container rect
      const containerRect = aquariumRef.getBoundingClientRect();
      
      // The aquarium.json is 1080x1080 (square)
      // With objectFit: "cover", it scales to cover the container
      // We need to calculate the actual rendered dimensions
      const LOTTIE_NATIVE_WIDTH = 1080;
      const LOTTIE_NATIVE_HEIGHT = 1080;
      const LOTTIE_ASPECT_RATIO = LOTTIE_NATIVE_WIDTH / LOTTIE_NATIVE_HEIGHT; // 1:1
      
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const containerAspectRatio = containerWidth / containerHeight;
      
      // Calculate actual rendered lottie dimensions with objectFit: "cover"
      // Cover means the image scales to cover the entire container, potentially cropping
      let lottieRenderedWidth, lottieRenderedHeight;
      let lottieOffsetX = 0, lottieOffsetY = 0;
      
      if (containerAspectRatio > LOTTIE_ASPECT_RATIO) {
        // Container is wider than lottie - lottie width matches container, height is cropped
        lottieRenderedWidth = containerWidth;
        lottieRenderedHeight = containerWidth / LOTTIE_ASPECT_RATIO;
        lottieOffsetY = (containerHeight - lottieRenderedHeight) / 2;
      } else {
        // Container is taller than lottie - lottie height matches container, width is cropped
        lottieRenderedHeight = containerHeight;
        lottieRenderedWidth = containerHeight * LOTTIE_ASPECT_RATIO;
        lottieOffsetX = (containerWidth - lottieRenderedWidth) / 2;
      }
      
      // Calculate what portion of the lottie is actually visible in the container
      const visibleLottieWidth = Math.min(lottieRenderedWidth, containerWidth);
      const visibleLottieHeight = Math.min(lottieRenderedHeight, containerHeight);
      
      // Calculate the visible portion's offset within the rendered lottie
      const cropOffsetX = lottieOffsetX < 0 ? Math.abs(lottieOffsetX) : 0;
      const cropOffsetY = lottieOffsetY < 0 ? Math.abs(lottieOffsetY) : 0;
      
      // All bounds are now relative to the VISIBLE portion of the lottie
      let topPercent, heightPercent, leftPercent, rightPercent;
      if (showDebugMenu) {
        // Manual mode: use debug values
        topPercent = localBounds.topPercent;
        heightPercent = localBounds.heightPercent;
        leftPercent = localBounds.leftPercent;
        rightPercent = localBounds.rightPercent;
      } else {
        // Default: use 30% top, 30% height, 18% left/right (can be tuned)
        topPercent = 30;
        heightPercent = 30;
        leftPercent = 18;
        rightPercent = 18;
      }
      
      // Calculate pixel values based on VISIBLE lottie portion
      const topOffset = (visibleLottieHeight * topPercent) / 100;
      const swimHeight = (visibleLottieHeight * heightPercent) / 100;
      const leftPadding = (visibleLottieWidth * leftPercent) / 100;
      const rightPadding = (visibleLottieWidth * rightPercent) / 100;

      const newBounds = {
        left: Math.max(0, lottieOffsetX) + leftPadding,
        top: Math.max(0, lottieOffsetY) + topOffset,
        width: visibleLottieWidth - leftPadding - rightPadding,
        height: swimHeight,
        right: Math.max(0, lottieOffsetX) + visibleLottieWidth - rightPadding,
        bottom: Math.max(0, lottieOffsetY) + topOffset + swimHeight,
      };

      setBounds(newBounds);
      
      // Log reference used for debugging
      if (showDebugMenu) {
        console.log("Bounds calculated from VISIBLE lottie portion:", {
          containerDims: `${Math.round(containerWidth)}x${Math.round(containerHeight)}`,
          lottieRenderedDims: `${Math.round(lottieRenderedWidth)}x${Math.round(lottieRenderedHeight)}`,
          visibleLottieDims: `${Math.round(visibleLottieWidth)}x${Math.round(visibleLottieHeight)}`,
          lottieOffset: `X:${Math.round(lottieOffsetX)}, Y:${Math.round(lottieOffsetY)}`,
          cropOffset: `X:${Math.round(cropOffsetX)}, Y:${Math.round(cropOffsetY)}`,
          bounds: newBounds
        });
      }
    };
    
    const debouncedCalculate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(calculateBounds, 50);
    };

    // Initial calculation with delay for DOM to be ready
    const timer = setTimeout(calculateBounds, 100);
    
    // Use ResizeObserver for better resize detection
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(debouncedCalculate);
      resizeObserver.observe(aquariumRef);
    }
    
    // Fallback to window resize listener
    window.addEventListener('resize', debouncedCalculate);
    
    return () => {
      clearTimeout(timer);
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('resize', debouncedCalculate);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [aquariumRef, localBounds, showDebugMenu]);

  if (!isLottiePlayerReady) {
    return <div style={{ padding: "20px", color: "var(--text-muted)" }}>⏳ Loading aquarium...</div>;
  }

  return (
    <>
      {/* Background Lottie */}
      {backgroundLottie && (
        <lottie-player
          src={backgroundLottie}
          background="transparent"
          speed="1"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: "0",
            left: "0",
            zIndex: "1",
            objectFit: "cover",
            pointerEvents: "none",
          }}
          loop
          autoplay
          renderer="svg"
        />
      )}
      
      {/* Debug controls */}
      {showDebugMenu && (
        <div 
          ref={debugPanelRef}
          style={{
            position: "absolute",
            top: `${debugPosition.y}px`,
            left: `${debugPosition.x}px`,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            color: "white",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "var(--font-interface)",
            fontSize: "12px",
            zIndex: "1000",
            minWidth: "350px",
            maxWidth: "400px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            cursor: isDragging ? "grabbing" : "default",
          }}
        >
          <div 
            style={{ 
              marginBottom: "12px", 
              fontWeight: "bold", 
              fontSize: "14px", 
              color: "#00aabb",
              cursor: "grab",
              userSelect: "none",
              padding: "4px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onMouseDown={(e) => {
              if (!debugPanelRef.current) return;
              const rect = debugPanelRef.current.getBoundingClientRect();
              setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
              setIsDragging(true);
            }}
          >
            <div>
              <dc.Icon icon="bug" style={{ fontSize: "16px", marginRight: "6px", verticalAlign: "middle" }} />
              <span style={{ verticalAlign: "middle" }}>Bounds Debug</span>
            </div>
            <dc.Icon icon="move" style={{ fontSize: "14px", opacity: 0.5 }} />
          </div>
          
          <div style={{ marginBottom: "12px", padding: "8px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "4px" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>
              Container: {aquariumRef ? Math.round(aquariumRef.getBoundingClientRect().width) : 0}px × {aquariumRef ? Math.round(aquariumRef.getBoundingClientRect().height) : 0}px
            </div>
            <div style={{ fontSize: "11px", color: "#4fc3f7", marginBottom: "4px" }}>
              Lottie Visible (1080x1080 native): {aquariumRef ? (() => {
                const rect = aquariumRef.getBoundingClientRect();
                const aspectRatio = rect.width / rect.height;
                let renderedWidth, renderedHeight;
                
                if (aspectRatio > 1) {
                  // Wider container
                  renderedWidth = rect.width;
                  renderedHeight = rect.width;
                } else {
                  // Taller container
                  renderedHeight = rect.height;
                  renderedWidth = rect.height;
                }
                
                // Calculate visible portion
                const visibleWidth = Math.min(renderedWidth, rect.width);
                const visibleHeight = Math.min(renderedHeight, rect.height);
                
                return `${Math.round(visibleWidth)}px × ${Math.round(visibleHeight)}px`;
              })() : 'N/A'}
            </div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>Bounds: {Math.round(bounds.width)}px × {Math.round(bounds.height)}px</div>
          </div>
          
          <div style={{ 
            marginBottom: "12px", 
            padding: "8px", 
            backgroundColor: "rgba(0, 170, 187, 0.15)", 
            borderRadius: "4px",
            border: "1px solid rgba(0, 170, 187, 0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <dc.Icon icon="info" style={{ fontSize: "14px", color: "#00aabb" }} />
              <span style={{ fontSize: "11px", color: "#00aabb", fontWeight: "500" }}>
                % values are relative to VISIBLE aquarium portion (1080x1080 with objectFit: cover).
              </span>
            </div>
          </div>
          
          <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid rgba(255,255,255,0.15)" }} />
          
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontWeight: "500" }}>Top (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={localBounds.topPercent}
                onChange={(e) => setLocalBounds({...localBounds, topPercent: parseFloat(e.target.value) || 0})}
                style={{
                  width: "70px",
                  padding: "4px 8px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "12px",
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={localBounds.topPercent}
              onChange={(e) => setLocalBounds({...localBounds, topPercent: parseFloat(e.target.value)})}
              style={{ width: "100%" }}
            />
          </div>
          
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontWeight: "500" }}>Height (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={localBounds.heightPercent}
                onChange={(e) => setLocalBounds({...localBounds, heightPercent: parseFloat(e.target.value) || 0})}
                style={{
                  width: "70px",
                  padding: "4px 8px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "12px",
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={localBounds.heightPercent}
              onChange={(e) => setLocalBounds({...localBounds, heightPercent: parseFloat(e.target.value)})}
              style={{ width: "100%" }}
            />
          </div>
          
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontWeight: "500" }}>Left (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={localBounds.leftPercent}
                onChange={(e) => setLocalBounds({...localBounds, leftPercent: parseFloat(e.target.value) || 0})}
                style={{
                  width: "70px",
                  padding: "4px 8px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "12px",
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.1"
              value={localBounds.leftPercent}
              onChange={(e) => setLocalBounds({...localBounds, leftPercent: parseFloat(e.target.value)})}
              style={{ width: "100%" }}
            />
          </div>
          
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontWeight: "500" }}>Right (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={localBounds.rightPercent}
                onChange={(e) => setLocalBounds({...localBounds, rightPercent: parseFloat(e.target.value) || 0})}
                style={{
                  width: "70px",
                  padding: "4px 8px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "12px",
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.1"
              value={localBounds.rightPercent}
              onChange={(e) => setLocalBounds({...localBounds, rightPercent: parseFloat(e.target.value)})}
              style={{ width: "100%" }}
            />
          </div>
          
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button
              onClick={() => {
                const containerRect = aquariumRef ? aquariumRef.getBoundingClientRect() : { width: 0, height: 0 };
                
                // Calculate rendered lottie dimensions
                const LOTTIE_ASPECT_RATIO = 1; // 1080x1080 is 1:1
                const containerAspectRatio = containerRect.width / containerRect.height;
                let lottieRenderedWidth, lottieRenderedHeight;
                
                if (containerAspectRatio > LOTTIE_ASPECT_RATIO) {
                  lottieRenderedWidth = containerRect.width;
                  lottieRenderedHeight = containerRect.width;
                } else {
                  lottieRenderedHeight = containerRect.height;
                  lottieRenderedWidth = containerRect.height;
                }
                
                // Calculate visible portion
                const visibleWidth = Math.min(lottieRenderedWidth, containerRect.width);
                const visibleHeight = Math.min(lottieRenderedHeight, containerRect.height);
                
                const configText = `// Container: ${Math.round(containerRect.width)}px × ${Math.round(containerRect.height)}px
// Lottie Visible (1080x1080 native): ${Math.round(visibleWidth)}px × ${Math.round(visibleHeight)}px
// All % values are relative to VISIBLE lottie portion (objectFit: cover)
{
  "containerWidth": ${Math.round(containerRect.width)},
  "containerHeight": ${Math.round(containerRect.height)},
  "lottieVisibleWidth": ${Math.round(visibleWidth)},
  "lottieVisibleHeight": ${Math.round(visibleHeight)},
  "topPercent": ${localBounds.topPercent},
  "heightPercent": ${localBounds.heightPercent},
  "leftPercent": ${localBounds.leftPercent},
  "rightPercent": ${localBounds.rightPercent}
}`;
                
                navigator.clipboard.writeText(configText).then(() => {
                  console.log("Copied to clipboard:", configText);
                  new Notice("Bounds config copied!");
                }).catch(err => {
                  console.error("Failed to copy:", err);
                  console.log(configText);
                  new Notice("Check console for config");
                });
              }}
              style={{
                flex: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                backgroundColor: "rgba(40, 167, 69, 0.8)",
                border: "none",
                borderRadius: "4px",
                color: "white",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(40, 167, 69, 1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(40, 167, 69, 0.8)"}
            >
              <dc.Icon icon="copy" style={{ fontSize: "14px" }} />
              <span>Copy Config</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Debug bounds rectangle */}
      {bounds.width > 0 && showDebugMenu && (
        <div style={{
          position: "absolute",
          left: `${bounds.left}px`,
          top: `${bounds.top}px`,
          width: `${bounds.width}px`,
          height: `${bounds.height}px`,
          border: "3px solid rgba(255, 0, 0, 0.8)",
          backgroundColor: "rgba(255, 0, 0, 0.1)",
          pointerEvents: "none",
          zIndex: "999",
          boxSizing: "border-box",
        }}>
          <div style={{
            position: "absolute",
            top: "-25px",
            left: "0",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            fontSize: "12px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            borderRadius: "4px",
          }}>
            {`W: ${Math.round(bounds.width)}px | H: ${Math.round(bounds.height)}px`}
          </div>
        </div>
      )}
      
      {/* Render fish - Memoized to prevent unnecessary re-renders */}
      {bounds.width > 0 && fishLottie && fishes.map((fish, index) => {
        const fishKey = `fish-${fish.name}-${index}`;
        return (
          <FishComponent
            key={fishKey}
            name={fish.name}
            bounds={bounds}
            fishLottie={fishLottie}
          />
        );
      })}
    </>
  );
}

return { Aquarium };

```


## LoadScript

```jsx
/**
 * Loads a script either from a URL (with caching) or a local vault path.
 */
async function loadScript(dc, src, onload, onerror) {
  const cacheDir = ".datacore/script_cache";
  const isUrl = /^https?:\/\//.test(src);

  const executeScriptContent = (scriptContent, resolve, reject, scriptElement) => {
    try {
      scriptElement.textContent = scriptContent;
      document.body.appendChild(scriptElement);
      if (onload) onload();
      resolve(scriptElement);
    } catch (execError) {
      console.error('Error executing script:', execError);
      if (onerror) onerror(execError);
      reject(execError);
    }
  };

  return new Promise(async (resolve, reject) => {
    const scriptElement = document.createElement("script");
    scriptElement.async = true;

    if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
        return reject(new Error("Datacore context 'dc' with vault adapter is required for loadScript."));
    }
    const adapter = dc.app.vault.adapter;

    try {
      if (isUrl) {
        const safeFilename = src
          .replace(/^https?:\/\//, '')
          .replace(/[\/\\?%*:|"<>]/g, '_') + ".js";
        const cachePath = `${cacheDir}/${safeFilename}`;

        let scriptText = null;
        const cachedExists = await adapter.exists(cachePath);

        if (cachedExists) {
          try {
            scriptText = await adapter.read(cachePath);
          } catch (readError) {
            console.warn('Failed to read cache, fetching fresh:', readError);
          }
        }

        if (scriptText === null) {
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${src}`);
          }
          scriptText = await response.text();

          try {
            if (!(await adapter.exists(cacheDir))) {
              await adapter.mkdir(cacheDir);
            }
            await adapter.write(cachePath, scriptText);
          } catch (writeError) {
            console.warn('Failed to write cache:', writeError);
          }
        }
        executeScriptContent(scriptText, resolve, reject, scriptElement);

      } else {
        const localFileExists = await adapter.exists(src);
        if (!localFileExists) {
           throw new Error(`Local script file not found: ${src}`);
        }
        const scriptText = await adapter.read(src);
        executeScriptContent(scriptText, resolve, reject, scriptElement);
      }
    } catch (error) {
      console.error('Failed to load script:', error);
      if (scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      if (onerror) onerror(error);
      reject(error);
    }
  });
}

return { loadScript };

```
