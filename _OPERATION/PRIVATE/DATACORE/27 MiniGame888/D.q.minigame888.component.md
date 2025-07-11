
# ViewComponent


```jsx
// # ViewComponent
const filename = "_OPERATION/PRIVATE/DATACORE/27 MiniGame888/D.q.minigame888.component.md"

const { useRef, useEffect, useState, useCallback } = dc;
const { h: preactH, render: preactRender } = dc.preact;

const { EnigmaView } = await dc.require(
  dc.headerLink(filename, "EnigmaViewer")
);

const ALL_CARD_DEFINITIONS = await dc.require(
  dc.headerLink(filename, "CardData")
);

const finalMessageOptions = await dc.require(
  dc.headerLink(filename, "FinalMessage")
);

// NEW: Import the LoadingLogo component
const { LoadingLogo } = await dc.require(
    dc.headerLink(filename, "LoadingLogo")
);

if (!Array.isArray(ALL_CARD_DEFINITIONS)) {
    console.error("[WorldView Pre-load] CRITICAL: ALL_CARD_DEFINITIONS did not load as an array. Value:", ALL_CARD_DEFINITIONS);
}

/*==============================================================================
  GLOBAL Z-INDEX MANAGEMENT
==============================================================================*/
let highestZIndex = 10000;
const DEFAULT_FALLBACK_ZINDEX = 10000;

function updateHighestZIndex() {
  let max = 0;
  document.querySelectorAll('.fresh-pip').forEach((el) => {
     if (!document.body.contains(el) || el.style.display === 'none' || el.style.visibility === 'hidden' ) return;
    let computedZStr = window.getComputedStyle(el).zIndex;
    let z = (computedZStr === "auto" || computedZStr === "")
      ? (parseInt(el.style.zIndex, 10) || DEFAULT_FALLBACK_ZINDEX)
      : (parseInt(computedZStr, 10) || 0);
    if (z > max) max = z;
  });
  if (max < DEFAULT_FALLBACK_ZINDEX) max = DEFAULT_FALLBACK_ZINDEX;
  if (max === 0 && highestZIndex > 0) return highestZIndex;
  highestZIndex = max;
  return highestZIndex;
}

function bringToFront(container, fallback = 0) {
   if (!container || container.style.display === 'none' || container.style.visibility === 'hidden' ) return;
  updateHighestZIndex();
  let targetZ = highestZIndex + 1;
  if (fallback && targetZ < fallback) {
    targetZ = fallback;
  }

  const currentZ = parseInt(container.style.zIndex, 10) || 0;
  if (currentZ < targetZ) {
    highestZIndex = targetZ;
    container.style.setProperty("z-index", highestZIndex, "important");
  }
}

/*==============================================================================
  SVG Icon Components
==============================================================================*/
const PlayIcon = ({ size = "22px", color = "white" }) => preactH('svg', {
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",
  style: { display: 'block' }
}, preactH('polygon', { points: "5 3 19 12 5 21 5 3" }));

const PauseIcon = ({ size = "22px", color = "white" }) => preactH('svg', {
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",
  style: { display: 'block' }
},
  preactH('line', { x1: "6", y1: "4", x2: "6", y2: "20" }),
  preactH('line', { x1: "18", y1: "4", x2: "18", y2: "20" })
);

const ExitIcon = ({ size = "22px", color = "white" }) => preactH('svg', {
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",
  style: { display: 'block' }
},
  preactH('line', { x1: "18", y1: "6", x2: "6", y2: "18" }),
  preactH('line', { x1: "6", y1: "6", x2: "18", y2: "18" })
);

const LoadingIcon = ({ size = "20px", color = "white" }) => preactH('svg', {
    width: size, height: size, viewBox: "0 0 50 50", style: { animation: 'spinIcon 1s linear infinite', display: 'block' }
  }, preactH('circle', {
    cx:"25", cy:"25", r:"20", fill:"none", stroke:color, strokeWidth:"5", strokeDasharray:"31.415, 31.415", strokeDashoffset:"0"
  }, preactH('animateTransform', {
    attributeName: "transform", type: "rotate", from: "0 25 25", to: "360 25 25", dur: "1s", repeatCount: "indefinite"
  }))
);


/*==============================================================================
  FreshPip COMPONENT
==============================================================================*/
const PIP_HEADER_HEIGHT_NUM = 55;
const PIP_HEADER_HEIGHT = `${PIP_HEADER_HEIGHT_NUM}px`;
const PIP_MINIMIZED_SIZE_NUM = 80;
const PIP_MINIMIZED_SIZE = `${PIP_MINIMIZED_SIZE_NUM}px`;

const DEFAULT_PIP_WIDTH = "400px";
const DEFAULT_PIP_HEIGHT = "799px";
const DEFAULT_PIP_HEIGHT_NUM = 799;
const DEFAULT_PIP_TOP = `calc(50vh - ${DEFAULT_PIP_HEIGHT_NUM / 2}px)`;
const DEFAULT_PIP_LEFT = "50px";
const DEFAULT_PIP_BORDER_RADIUS = "8px";

function FreshPip({
  onClose,
  pipId,
  filePath,
  header,
  functionName,
  component,
  componentProps = {},
  initialStyle = {},
  startMinimized = false,
  lockMinimizedState = false,
  showContentWhenMinimized = false,
  hideHeaderElements = false,
  isDraggable = true,
  onDragStateChange,
  isVisible = true,
  titleText
}) {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const [LoadedComponent, setLoadedComponent] = useState(() => component || null);
  const [isBeingDraggedInternal, setIsBeingDraggedInternal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(startMinimized || lockMinimizedState);
  const [isShaking, setIsShaking] = useState(false);

  const originalStylesRef = useRef({});
  const dragStartDataRef = useRef({});
  const previousPipIdRef = useRef(pipId);
  const lastDropPositionRef = useRef(null);


  const defaultPipBaseStyleRef = useRef({
    position: "fixed", backgroundColor: "#222222", border: "2px solid #444444",
    boxSizing: "border-box", padding: "0px", overflow: "visible",
    zIndex: DEFAULT_FALLBACK_ZINDEX, display: 'flex', flexDirection: 'column',
    transition: 'width 0.2s ease-out, height 0.2s ease-out, border-radius 0.2s ease-out, box-shadow 0.2s ease-out, top 0.2s ease-out, left 0.2s ease-out, right 0.2s ease-out',
  });

  useEffect(() => {
    return () => {};
  }, [pipId, isDraggable, lockMinimizedState, isVisible, isMinimized]);

  useEffect(() => {
    if (component) {
       setLoadedComponent(prev => (prev === component ? prev : () => component) );
       return;
    }
    if (!filePath || !functionName) {
      setLoadedComponent(() => () => preactH('div',{style:{color:'#777',padding:'20px', textAlign:'center'}},'(No Content Source)'));
      return;
    }
    (async () => {
      try {
        const dynamicModule = await dc.require(dc.headerLink(filePath, header));
        const Comp = dynamicModule[functionName];
        if (Comp) setLoadedComponent(() => Comp);
        else {
          setLoadedComponent(() => () => preactH('div',{style:{color:'red',padding:'20px'}},`Error: Component ${functionName} not found.`));
        }
      } catch (error) {
        setLoadedComponent(() => () => preactH('div',{style:{color:'red',padding:'20px'}},`Error loading: ${error.message}`));
      }
    })();
  }, [component, filePath, header, functionName, pipId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (pipId !== previousPipIdRef.current || Object.keys(originalStylesRef.current).length === 0) {
      originalStylesRef.current = {
          width: initialStyle.width || DEFAULT_PIP_WIDTH,
          height: initialStyle.height || DEFAULT_PIP_HEIGHT,
          top: initialStyle.top || DEFAULT_PIP_TOP,
          left: initialStyle.left || (initialStyle.right !== undefined && initialStyle.right !== 'auto' ? 'auto' : DEFAULT_PIP_LEFT),
          right: initialStyle.right || 'auto',
          borderRadius: initialStyle.borderRadius || DEFAULT_PIP_BORDER_RADIUS,
      };
      Object.entries(originalStylesRef.current).forEach(([prop, value]) => {
          if (!container.style[prop] || container.style[prop] === '0px' || container.style[prop] === '') {
              container.style[prop] = value;
          }
      });

      if (!lockMinimizedState) {
           setIsMinimized(startMinimized);
      }
      lastDropPositionRef.current = null;
    }
    previousPipIdRef.current = pipId;

    if (isVisible) {
        const initialZIndex = parseInt(initialStyle.zIndex, 10) || DEFAULT_FALLBACK_ZINDEX;
        bringToFront(container, initialZIndex);
    } else {
        container.style.zIndex = 'auto';
    }

    const handlePointerDownBringToFront = (e) => {
       if (isVisible && !(headerRef.current && headerRef.current.contains(e.target) && e.target.closest('button'))) {
          bringToFront(container);
      }
    };
    container.addEventListener("pointerdown", handlePointerDownBringToFront, true);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDownBringToFront, true);
    };
  }, [pipId, isVisible, lockMinimizedState, startMinimized,
      initialStyle.width, initialStyle.height, initialStyle.top, initialStyle.left, initialStyle.right, initialStyle.borderRadius, initialStyle.zIndex
  ]);

  useEffect(() => {
    if (isShaking) {
      const timeout = setTimeout(() => {
        setIsShaking(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isShaking]);


  useEffect(() => {
    if (!isDraggable || !isVisible) return;
    const container = containerRef.current;
    const dragHeaderEl = headerRef.current;
    if (!container || !dragHeaderEl) {
      return;
    }

    const handleMouseDownOnHeader = (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      setIsBeingDraggedInternal(true);
      lastDropPositionRef.current = null;

      if (onDragStateChange) {
        onDragStateChange(pipId, true, componentProps);
      }

      const rect = container.getBoundingClientRect();

      if (lockMinimizedState) {
        dragStartDataRef.current = {
            clickOffsetXOnPip: e.clientX - rect.left,
            clickOffsetYOnPip: e.clientY - rect.top,
            isRightAnchored: getComputedStyle(container).left === 'auto' && getComputedStyle(container).right !== 'auto',
        };
        container.style.transition = (container.style.transition || defaultPipBaseStyleRef.current.transition)
            .replace(/top 0\.\d+s ease[^,]*,?/g, '')
            .replace(/left 0\.\d+s ease[^,]*,?/g, '')
            .replace(/right 0\.\d+s ease[^,]*,?/g, '') + ', top 0s, left 0s, right 0s';
      } else {
        if (Object.keys(originalStylesRef.current).length === 0) {
             originalStylesRef.current = {
                width: DEFAULT_PIP_WIDTH, height: DEFAULT_PIP_HEIGHT,
                top: DEFAULT_PIP_TOP, left: DEFAULT_PIP_LEFT,
                right: 'auto', borderRadius: DEFAULT_PIP_BORDER_RADIUS,
            };
        }
        dragStartDataRef.current = {
            minimizedCircleCenterOffsetX: PIP_MINIMIZED_SIZE_NUM / 2,
            minimizedCircleCenterOffsetY: PIP_MINIMIZED_SIZE_NUM / 2,
        };

        container.style.top = `${e.clientY - dragStartDataRef.current.minimizedCircleCenterOffsetY}px`;
        container.style.left = `${e.clientX - dragStartDataRef.current.minimizedCircleCenterOffsetX}px`;
        container.style.right = 'auto';
        container.style.width = PIP_MINIMIZED_SIZE;
        container.style.height = PIP_MINIMIZED_SIZE;
        container.style.borderRadius = '50%';
        container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        container.style.transition = 'width 0.2s ease-out, height 0.2s ease-out, border-radius 0.2s ease-out, box-shadow 0.2s ease-out, top 0s, left 0s, right 0s';

        if (!isMinimized) {
            setIsMinimized(true);
        }
      }
    };

    const handleMouseMove = (e) => {
      if (!isBeingDraggedInternal || !isVisible) return;

      if (lockMinimizedState) {
        const newTop = e.clientY - dragStartDataRef.current.clickOffsetYOnPip;
        const currentWidth = parseFloat(getComputedStyle(container).width);
        if (dragStartDataRef.current.isRightAnchored) {
            const newRight = window.innerWidth - e.clientX - (currentWidth - dragStartDataRef.current.clickOffsetXOnPip);
            container.style.left = 'auto'; container.style.right = `${newRight}px`;
        } else {
            const newLeft = e.clientX - dragStartDataRef.current.clickOffsetXOnPip;
            container.style.left = `${newLeft}px`; container.style.right = 'auto';
        }
        container.style.top = `${newTop}px`;
      } else {
        const newTop = e.clientY - dragStartDataRef.current.minimizedCircleCenterOffsetY;
        const newLeft = e.clientX - dragStartDataRef.current.minimizedCircleCenterOffsetX;
        container.style.top = `${newTop}px`;
        container.style.left = `${newLeft}px`;
        container.style.right = 'auto';
      }
    };

    const handleMouseUp = (e) => {
      if (!isBeingDraggedInternal) return;
      const wasDraggingLcl = isBeingDraggedInternal;
      setIsBeingDraggedInternal(false);

      let dropHandledByParent = false;
      if (onDragStateChange) {
        dropHandledByParent = onDragStateChange(pipId, false, componentProps) || false;
      }

      if (!isVisible) {
          if (container.style.transition.includes('top 0s')) {
            container.style.transition = defaultPipBaseStyleRef.current.transition;
          }
          return;
      }

      if (lockMinimizedState) {
         if (containerRef.current) {
            const newComputed = getComputedStyle(containerRef.current);
            originalStylesRef.current = {
                ...originalStylesRef.current,
                width: containerRef.current.style.width,
                height: containerRef.current.style.height,
                borderRadius: containerRef.current.style.borderRadius,
                top: newComputed.top,
                left: newComputed.left,
                right: newComputed.right,
            };
            container.style.transition = defaultPipBaseStyleRef.current.transition;
        }
      } else if (wasDraggingLcl) {
        if (dropHandledByParent) {
            if (containerRef.current) {
                const finalRect = containerRef.current.getBoundingClientRect();
                lastDropPositionRef.current = {
                    top: `${finalRect.top}px`,
                    left: `${finalRect.left}px`,
                    right: getComputedStyle(containerRef.current).right !== 'auto' ? getComputedStyle(containerRef.current).right : 'auto'
                };
            }
        } else {
            setIsShaking(true);
            setIsMinimized(false);
            lastDropPositionRef.current = null;
            requestAnimationFrame(() => {
              if (containerRef.current && Object.keys(originalStylesRef.current).length > 0 && isVisible) {
                containerRef.current.style.top = originalStylesRef.current.top;
                containerRef.current.style.left = originalStylesRef.current.left;
                containerRef.current.style.right = originalStylesRef.current.right || 'auto';
                containerRef.current.style.width = originalStylesRef.current.width;
                containerRef.current.style.height = originalStylesRef.current.height;
                containerRef.current.style.borderRadius = originalStylesRef.current.borderRadius;
                containerRef.current.style.boxShadow = 'none';
                containerRef.current.style.transition = defaultPipBaseStyleRef.current.transition;
              }
            });
        }
      } else {
          if(container) container.style.transition = defaultPipBaseStyleRef.current.transition;
      }
    };

    dragHeaderEl.addEventListener("mousedown", handleMouseDownOnHeader);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      dragHeaderEl.removeEventListener("mousedown", handleMouseDownOnHeader);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (isBeingDraggedInternal && onDragStateChange) {
        onDragStateChange(pipId, false, componentProps);
      }
      if (isBeingDraggedInternal) setIsBeingDraggedInternal(false);
    };
  }, [isDraggable, isVisible, pipId, onDragStateChange, componentProps, lockMinimizedState, isMinimized, setIsShaking]);

  let currentPipStyle = { ...defaultPipBaseStyleRef.current };

  if (Object.keys(originalStylesRef.current).length > 0) {
    currentPipStyle.width = originalStylesRef.current.width;
    currentPipStyle.height = originalStylesRef.current.height;
    currentPipStyle.top = originalStylesRef.current.top;
    currentPipStyle.left = originalStylesRef.current.left;
    currentPipStyle.right = originalStylesRef.current.right;
    currentPipStyle.borderRadius = originalStylesRef.current.borderRadius;
    currentPipStyle.boxShadow = 'none';
  } else {
    const fallbackInitial = initialStyle.width ? initialStyle : {
        width: DEFAULT_PIP_WIDTH, height: DEFAULT_PIP_HEIGHT, top: DEFAULT_PIP_TOP,
        left: DEFAULT_PIP_LEFT, right: 'auto', borderRadius: DEFAULT_PIP_BORDER_RADIUS
    };
    currentPipStyle = { ...currentPipStyle, ...fallbackInitial };
  }

  currentPipStyle = { ...currentPipStyle, ...initialStyle };

  if (lockMinimizedState) {
    currentPipStyle.width = initialStyle.width && initialStyle.width !== DEFAULT_PIP_WIDTH ? initialStyle.width : PIP_MINIMIZED_SIZE;
    currentPipStyle.height = initialStyle.height && initialStyle.height !== DEFAULT_PIP_HEIGHT ? initialStyle.height : PIP_MINIMIZED_SIZE;
    currentPipStyle.borderRadius = initialStyle.borderRadius || "50%";
    currentPipStyle.boxShadow = initialStyle.boxShadow || '0 4px 12px rgba(0,0,0,0.4)';
    if (isBeingDraggedInternal) {
        currentPipStyle.transition = 'width 0.2s ease-out, height 0.2s ease-out, border-radius 0.2s ease-out, box-shadow 0.2s ease-out, top 0s, left 0s, right 0s';
        if (containerRef.current?.style.top) {
            currentPipStyle.top = containerRef.current.style.top;
            currentPipStyle.left = containerRef.current.style.left;
            currentPipStyle.right = containerRef.current.style.right;
        }
    } else {
        currentPipStyle.transition = defaultPipBaseStyleRef.current.transition;
    }
  }
  else if (isMinimized || isBeingDraggedInternal) {
    currentPipStyle.width = PIP_MINIMIZED_SIZE;
    currentPipStyle.height = PIP_MINIMIZED_SIZE;
    currentPipStyle.borderRadius = "50%";
    currentPipStyle.boxShadow = initialStyle.boxShadow || '0 4px 12px rgba(0,0,0,0.4)';

    if (isBeingDraggedInternal) {
        currentPipStyle.transition = 'width 0.2s ease-out, height 0.2s ease-out, border-radius 0.2s ease-out, box-shadow 0.2s ease-out, top 0s, left 0s, right 0s';
        if (containerRef.current?.style.top) {
            currentPipStyle.top = containerRef.current.style.top;
            currentPipStyle.left = containerRef.current.style.left;
            currentPipStyle.right = containerRef.current.style.right;
        }
    } else {
        currentPipStyle.transition = defaultPipBaseStyleRef.current.transition;
        if (lastDropPositionRef.current) {
            currentPipStyle.top = lastDropPositionRef.current.top;
            currentPipStyle.left = lastDropPositionRef.current.left;
            currentPipStyle.right = lastDropPositionRef.current.right;
        } else if (containerRef.current?.style.top && containerRef.current?.style.width === PIP_MINIMIZED_SIZE) {
            currentPipStyle.top = containerRef.current.style.top;
            currentPipStyle.left = containerRef.current.style.left;
            currentPipStyle.right = containerRef.current.style.right;
        }
    }
  }
  else {
    currentPipStyle.transition = defaultPipBaseStyleRef.current.transition;
    if (lastDropPositionRef.current && !isBeingDraggedInternal) {
        currentPipStyle.top = lastDropPositionRef.current.top;
        currentPipStyle.left = lastDropPositionRef.current.left;
        currentPipStyle.right = lastDropPositionRef.current.right;
    }
  }

   if (!isVisible) {
      currentPipStyle.display = 'none';
   } else {
       currentPipStyle.display = defaultPipBaseStyleRef.current.display;
   }

  const isEffectivelyMinimizedOrHeaderless = hideHeaderElements || isMinimized || lockMinimizedState;

  const headerBarStyle = {
    height: hideHeaderElements ? '0px' : PIP_HEADER_HEIGHT,
    width: '100%',
    backgroundColor: hideHeaderElements ? 'transparent' : "#333333",
    display: hideHeaderElements ? "none" : "flex",
    alignItems: "center", justifyContent: "space-between", padding: "0 10px",
    cursor: (isDraggable && isVisible && !hideHeaderElements) ? "move" : "default",
    flexShrink: 0, userSelect: 'none',
    borderBottom: (isMinimized || lockMinimizedState || hideHeaderElements) ? 'none' : '1px solid #444444',
    boxSizing: 'border-box', position: 'relative',
    zIndex: 1,
  };

  const pipContentStyle = {
    flexGrow: 1,
    overflow: (isEffectivelyMinimizedOrHeaderless && showContentWhenMinimized) ? "visible" : "hidden",
    display: "flex",
    flexDirection: 'column',
    width: '100%',
    height: hideHeaderElements ? '100%' : `calc(100% - ${PIP_HEADER_HEIGHT})`,
    position: 'relative',
    top: 0, left: 0,
    alignItems: hideHeaderElements ? 'center' : 'stretch',
    justifyContent: hideHeaderElements ? 'center' : 'flex-start',
    padding: hideHeaderElements ? '0px' : '10px',
    boxSizing: 'border-box',
  };

  const cardDefForTitle = componentProps.cardDefinition;
  let pipTitle;

  if (titleText !== undefined) {
    pipTitle = titleText;
  } else if (component === EnigmaView || functionName === "EnigmaView") {
      pipTitle = "ENIGMA";
  } else {
      pipTitle = componentProps.titleText || (cardDefForTitle ? cardDefForTitle.title : (functionName || "PiP Window"));
  }

  return (
     preactH("div", {
       ref: containerRef,
       className: `fresh-pip ${isShaking ? 'pip-shaking' : ''}`,
       style: currentPipStyle
     },
      !hideHeaderElements && preactH("div", { ref: headerRef, className: "fresh-pip-header", style: headerBarStyle },
        preactH("span", { style: { color: "#ccc", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: '10px'} },
          pipTitle
        ),
        onClose && preactH("button", {
            style: { cursor: "pointer", background: "#555", border: "1px solid #777", color: "white", fontSize: "14px", borderRadius: "3px", padding: "2px 5px", lineHeight: '1' },
            onClick: (e) => { e.stopPropagation(); onClose(); }
          }, "✕"
        )
      ),
      preactH("div", { className: "fresh-pip-content", style: pipContentStyle },
        LoadedComponent
          ? preactH(LoadedComponent, { ...componentProps, isPipMinimized: isMinimized || lockMinimizedState, pipDiameter: parseFloat(currentPipStyle.width) })
          : preactH("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", userSelect: "none", fontSize: '12px' } }, "Loading...")
      )
    )
  );
}


/*==============================================================================
  StatusPipContentComponent - MODIFIED for circular text
==============================================================================*/
const StatusPipContentComponent = ({
    text,
    textColor = 'white',
    pipDiameter, // Diameter of the FreshPip container (e.g., 80px)
    isHoveredByDrag,
    isHoveredByCursorOnly,
    hoverTextColor
}) => {
  // Correctly defined uniqueId
  const uniqueId = `textCirclePath-${text.replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2,7)}`;

  const fontSize = 14; // Font size of the text
  const pipBorderWidth = 2; // Assuming FreshPip border is 2px
  const pipVisualRadius = pipDiameter / 2; // Radius of the visible circular pip (e.g., 40px)

  // Distance from the pip's *outer edge* to the baseline of the text.
  const textOffsetFromPipEdge = 4; // Controls how far out the text orbits from the circle's edge

  // Radius of the invisible circle path that the text will follow.
  const textPathRadius = pipVisualRadius + textOffsetFromPipEdge;

  // The SVG viewBox needs to be large enough to contain the entire text.
  const svgContentMaxRadius = textPathRadius + (fontSize / 2) + 2; // Add a small buffer (2px)
  const svgEffectiveDiameter = svgContentMaxRadius * 2; // Total diameter for the SVG viewBox

  const svgStyle = {
    width: `${svgEffectiveDiameter}px`,
    height: `${svgEffectiveDiameter}px`,
    overflow: 'visible',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', // Center the SVG within its FreshPip content area
    transition: 'transform 0.2s ease-out',
  };

  let currentFillColor = textColor;
  let animationPlayState = 'running';

  if (isHoveredByDrag) {
    currentFillColor = hoverTextColor || textColor;
    animationPlayState = 'paused';
  } else if (isHoveredByCursorOnly) { /* No specific change for cursor only */ }

  const textStyle = {
    fontSize: `${fontSize}px`,
    fill: currentFillColor,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    userSelect: 'none',
    transition: 'fill 0.2s ease-out',
  };

  // Center of the SVG viewBox
  const viewBoxCenterX = svgEffectiveDiameter / 2;
  const viewBoxCenterY = svgEffectiveDiameter / 2;

  // Path definition for a circle centered within the SVG's viewBox
  const pathD = `M ${viewBoxCenterX - textPathRadius}, ${viewBoxCenterY} a ${textPathRadius},${textPathRadius} 0 1,1 ${textPathRadius * 2},0 a ${textPathRadius},${textPathRadius} 0 1,1 -${textPathRadius * 2},0`;

  let gRotation = 0; // Initial rotation of the entire group containing the textPath for positioning

  if (text.toUpperCase().includes('HEALTH')) {
      gRotation = -60; // Rotate to position "HEALTH" at the top-right segment
  } else if (text.toUpperCase().includes('WEALTH')) {
      gRotation = -60; // Rotate to position "WEALTH" at the top-right segment
  } else if (text.toUpperCase().includes('EXPERIENCE')) {
      gRotation = 60; // Rotate to position "EXPERIENCE" at the bottom-right segment
  }

    return preactH('svg', { style: svgStyle, viewBox: `0 0 ${svgEffectiveDiameter} ${svgEffectiveDiameter}` },
      preactH('defs', null, preactH('path', { id: uniqueId, d: pathD, fill: 'none', stroke: 'none' })),
       preactH('g', {
         style: {
           animation: 'spinTextAround 20s linear infinite',
           animationPlayState: animationPlayState,
           transformOrigin: `${viewBoxCenterX}px ${viewBoxCenterY}px`, // Rotate around the center of the SVG
           transform: `rotate(${gRotation}deg)`, // Apply initial rotation for positioning
           transition: 'transform 0.2s ease-out'
         }
       },
         preactH('text', { style: {...textStyle, animation: 'none'} }, // Ensure text itself doesn't spin, only the group does
             preactH('textPath', { href: `#${uniqueId}`, startOffset: "0%", dominantBaseline:"middle", textAnchor:"start" },
               text.toUpperCase()
             )
         )
       )
   );
};


/*==============================================================================
  WelcomeMessageComponent
==============================================================================*/
const WelcomeMessageComponent = ({
  message,
  hasCardBeenClicked,
  categorizationStatus,
  onMessageSequenceComplete,
  isGameFinished,
  totalTries,
  finalMessageOptions,
  onClaimAndExit // NEW: Prop to handle closing the experience
}) => {
  const initialWelcomeTextWithMarkers = message;
  const secondWelcomeTextRaw = "Pick a card to start exploring.";
  const thirdWelcomeTextRaw = "Very nice! Understand it better by pressing NARU {visual ledger}";
  const instructionMessageRaw = "Drag ENIGMA using the titlebar and move it into its corresponding NAMZU {category}";
  const failMessageRaw = "Oops, wrong one. Try again...";
  const successMessageRaw = "Nice! Now time to do them all 🫡";

  const timerRef = useRef(null);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isButtonHovered, setIsButtonHovered] = useState(false); // NEW: State for button hover effect

  const processText = (input) => {
    if (typeof input !== 'string') return '';
    let temp = input;
    temp = temp.replace(/experi\{m\}en\{T\}ce/i, 'EXPERIµENτCE');
    temp = temp.replace(/\{visual ledger\}/ig, '_VISUAL_LEDGER_');
    temp = temp.replace(/\{category\}/ig, '_CATEGORY_');
    temp = temp.toUpperCase();
    temp = temp.replace(/µ/g, 'm');
    temp = temp.replace(/τ/g, 't');
    temp = temp.replace(/_VISUAL_LEDGER_/g, 'VISUAL LEDGER');
    temp = temp.replace(/_CATEGORY_/g, 'CATEGORY');
    temp = temp.replace(/\{|\}/g, '');
    return temp;
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isGameFinished) {
        const finalMessage = finalMessageOptions.find(opt => totalTries >= opt.minTries && totalTries <= opt.maxTries)
            || { title: "Enigma Mastered", message: "Congratulations! You've completed the experience with a unique score. Every journey is a lesson learned." };

        const formattedMessage = `${finalMessage.title.toUpperCase()}\n\n${processText(finalMessage.message)}`;
        
        // NEW: Handler for the claim button click
        const handleClaimClick = () => {
            const claimUrl = 'https://www.crossmint.com/collections/beto888-experience/claim';
            window.open(claimUrl, '_blank'); // Open the URL in a new tab
            if (onClaimAndExit) {
                onClaimAndExit(); // Call the function to close the experience
            }
        };

        // NEW: Styles for the button to match the game's aesthetic
        const buttonStyleBase = {
            marginTop: '20px',
            padding: '12px 25px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            color: 'white',
            border: '2px solid #a259ff',
            borderRadius: '8px',
            background: 'linear-gradient(145deg, #007bff, #8a2be2)',
            boxShadow: '0 0 12px rgba(138, 43, 226, 0.8), 0 0 20px rgba(0, 123, 255, 0.5)',
            textShadow: '0 0 5px rgba(255, 255, 255, 0.7)',
            transition: 'all 0.3s ease-in-out',
            outline: 'none',
        };

        const buttonStyleHover = {
            transform: 'scale(1.05)',
            boxShadow: '0 0 20px rgba(138, 43, 226, 1), 0 0 30px rgba(0, 123, 255, 0.7)'
        };
        
        const finalButtonStyle = isButtonHovered ? { ...buttonStyleBase, ...buttonStyleHover } : buttonStyleBase;

        // NEW: Render the final message along with the button
        setDisplayedMessage(
            preactH('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' } },
                preactH('pre', { style: { margin: 0, paddingBottom: '10px', fontFamily: 'inherit', whiteSpace: 'pre-wrap', textAlign: 'center' } }, formattedMessage),
                preactH('button', { 
                    onClick: handleClaimClick, 
                    style: finalButtonStyle,
                    onMouseEnter: () => setIsButtonHovered(true),
                    onMouseLeave: () => setIsButtonHovered(false)
                }, 'Claim Your NFT & Exit')
            )
        );
        return; // Final message persists, no timeout
    }

    if (categorizationStatus === 'success') {
      setDisplayedMessage(processText(successMessageRaw));
      timerRef.current = setTimeout(() => {
        if (onMessageSequenceComplete) onMessageSequenceComplete();
      }, 8000);
    } else if (categorizationStatus === 'fail') {
      setDisplayedMessage(processText(failMessageRaw));
      timerRef.current = setTimeout(() => {
        setDisplayedMessage(processText(instructionMessageRaw));
      }, 4000);
    } else if (hasCardBeenClicked) {
      setDisplayedMessage(processText(thirdWelcomeTextRaw));
      timerRef.current = setTimeout(() => {
        setDisplayedMessage(processText(instructionMessageRaw));
      }, 8000);
    } else {
      setDisplayedMessage(processText(initialWelcomeTextWithMarkers));
      timerRef.current = setTimeout(() => {
        setDisplayedMessage(processText(secondWelcomeTextRaw));
      }, 6000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasCardBeenClicked, categorizationStatus, onMessageSequenceComplete, initialWelcomeTextWithMarkers, isGameFinished, totalTries, finalMessageOptions, onClaimAndExit, isButtonHovered]);


  return preactH('div', {
    style: {
      color: 'white',
      fontSize: '24px',
      textAlign: 'center',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontFamily: `'Consolas', 'Monaco', 'Lucida Console', 'monospace'`,
      textShadow: '0 0 10px rgba(148,0,211,0.8)',
      lineHeight: '1.4'
    }
  }, displayedMessage);
};

/*==============================================================================
  BasicView (Music Player) COMPONENT
==============================================================================*/
function BasicView({ initialIsPlaying = true }) {
  const songPath = "_RESOURCES/MUSIC/beto.minigame.soundtrack.wav";
  const audioSrc = dc.app.vault.adapter.getResourcePath(songPath);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(initialIsPlaying);
  const [isLoaded, setIsLoaded] = useState(false);
  const DESIRED_VOLUME = 0.3; // Set desired volume (0.0 to 1.0)

  // Effect to manage actual audio playback based on isPlaying state and isLoaded
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.volume = DESIRED_VOLUME; // Ensure volume is set initially and on subsequent re-renders if necessary

    if (isLoaded) { // Only attempt playback if audio data is ready
      if (isPlaying && audioElement.paused) {
        audioElement.play().catch(error => {
          console.warn("Audio play attempt failed:", error);
          // If autoplay is blocked, set isPlaying to false to reflect actual state
          setIsPlaying(false);
        });
      } else if (!isPlaying && !audioElement.paused) {
        audioElement.pause();
      }
    }
  }, [isLoaded, isPlaying, DESIRED_VOLUME]); // Effect runs when isLoaded or isPlaying state changes

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !isLoaded) return;
    // Toggle the *desired* state, useEffect will handle the actual playback
    setIsPlaying(prevIsPlaying => !prevIsPlaying);
  }, [isLoaded]);

  const handleCanPlayThrough = useCallback(() => {
    setIsLoaded(true);
    // When audio can play, the useEffect above will trigger playback if isPlaying is true
  }, []);

  const handleError = useCallback((e) => {
    console.error("Audio Element Error:", e.target.error?.message || "Unknown audio error");
    setIsLoaded(false);
    setIsPlaying(false);
  }, []);

  return preactH(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isLoaded ? "pointer" : "default",
        backgroundColor: "transparent",
        borderRadius: "50%",
        boxSizing: 'border-box',
      },
      onClick: isLoaded ? togglePlayPause : undefined,
      title: isLoaded ? (isPlaying ? "Pause Music" : "Play Music") : "Loading Music...",
    },
    audioSrc && preactH(
      "audio",
      {
        ref: audioRef,
        src: audioSrc,
        loop: true,
        onCanPlayThrough: handleCanPlayThrough,
        onError: handleError,
        preload: "auto", // Hint the browser to load audio data
        style: { display: "none" },
      }
    ),
    isLoaded
      ? (isPlaying ? preactH(PauseIcon) : preactH(PlayIcon))
      : preactH(LoadingIcon)
  );
}

/*==============================================================================
  ExitButtonComponent
==============================================================================*/
function ExitButtonComponent({ onExit }) {
    const handleClick = useCallback(() => {
        if (onExit) {
            onExit();
        }
    }, [onExit]);

    return preactH(
        "div",
        {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backgroundColor: "transparent",
                borderRadius: "50%",
                boxSizing: 'border-box',
            },
            onClick: handleClick,
            title: "Exit Game",
        },
        preactH(ExitIcon)
    );
}

/*==============================================================================
  CategorizedPipsListComponent - New Component for tracking
==============================================================================*/
const CategorizedPipsListComponent = ({ categorizedItems }) => {
  const formatCategoryName = useCallback((categoryId) => {
      if (!categoryId) return 'UNCATEGORIZED';
      return categoryId.split('-')[0].toUpperCase();
  }, []);

  const totalCategorizedCount = Object.values(categorizedItems).flat().length;

  return preactH('div', {
    style: {
      color: 'white',
      padding: '10px',
      height: '100%',
      overflowY: 'auto',
      fontFamily: `'Consolas', 'Monaco', 'Lucida Console', 'monospace'`,
      fontSize: '12px',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: '5px',
      boxSizing: 'border-box'
    }
  },
    preactH('h2', { style: { margin: '0 0 10px 0', color: '#eee', fontSize: '16px', textAlign: 'center', borderBottom: '1px solid #555', paddingBottom: '5px' } },
      `TOTAL: ${totalCategorizedCount} CARD${totalCategorizedCount === 1 ? '' : 'S'}`
    ),
    totalCategorizedCount === 0
      ? preactH('div', { style: { textAlign: 'center', color: '#777', paddingTop: '20px' } }, 'No cards categorized yet.')
      : Object.entries(categorizedItems).map(([categoryId, items]) => (
          preactH('div', { key: categoryId, style: { marginBottom: '15px' } },
            preactH('h3', { style: { margin: '0 0 5px 0', color: '#ccc', fontSize: '14px', borderBottom: '1px dotted #444', paddingBottom: '3px' } },
              `${formatCategoryName(categoryId)} (${items.length})`
            ),
            items.length > 0
              ? preactH('ul', { style: { listStyle: 'none', padding: '0', margin: '0' } },
                  items.map((item, index) => (
                    preactH('li', {
                        key: item.pipId || index,
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '3px',
                            padding: '2px 0',
                            backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)',
                            borderRadius: '3px'
                        }
                    },
                      preactH('span', { style: { flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', paddingLeft: '5px' } }, item.displayName)
                    )
                  ))
                )
              : null
          )
        ))
  );
};


/*==============================================================================
  WorldView COMPONENT
==============================================================================*/

const ENIGMA_PIP_HOST_ID = 'persistent-enigma-host';
const WELCOME_PIP_HOST_ID = 'welcome-message-pip-host';
const MUSIC_PIP_HOST_ID = 'music-pip-host';
const EXIT_PIP_HOST_ID = 'exit-pip-host';
const CATEGORIZED_PIP_HOST_ID = 'categorized-pip-host';
const ENIGMA_PIP_PERSISTENT_KEY = 'persistent-enigma-pip-key';

function WorldView() {
  const [ScreenModeHelperComponent, setScreenModeHelperComponent] = useState(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const [engine, setEngine] = useState(null);
  const [scene, setScene] = useState(null);
  const babylonContainerRef = useRef(null);
  const originalBabylonParentRef = useRef(null);
  const screenModeHelperAPIRef = useRef(null);
  const [isGameModeActive, setIsGameModeActive] = useState(false);
  const [showWelcomePip, setShowWelcomePip] = useState(false);
  const [hasCardBeenClicked, setHasCardBeenClicked] = useState(false);
  const [categorizationStatus, setCategorizationStatus] = useState('idle');
  const [showMusicPip, setShowMusicPip] = useState(false);
  const [showExitPip, setShowExitPip] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [totalTries, setTotalTries] = useState(0);
  const [isPlayButtonHovered, setIsPlayButtonHovered] = useState(false); // NEW for button style

  const [activeEnigma, setActiveEnigma] = useState(null);
  const activeEnigmaRef = useRef(null);
  const enigmaHostRef = useRef(null);
  const welcomePipHostRef = useRef(null);
  const musicPipHostRef = useRef(null);
  const exitPipHostRef = useRef(null);
  const categorizedPipHostRef = useRef(null);

  useEffect(() => {
    activeEnigmaRef.current = activeEnigma;
  }, [activeEnigma]);

  const statusPipHostsRef = useRef([]);
  const [hoveredStatusPipId, _setHoveredStatusPipId] = useState(null);
  const [draggedEnigmaDetails, _setDraggedEnigmaDetails] = useState(null);
  const [categorizedPips, setCategorizedPips] = useState({});

  const draggedEnigmaDetailsRef = useRef(draggedEnigmaDetails);
  const hoveredStatusPipIdRef = useRef(hoveredStatusPipId);
  const categorizedPipsRef = useRef(categorizedPips);
  const totalTriesRef = useRef(totalTries);

  useEffect(() => {
    draggedEnigmaDetailsRef.current = draggedEnigmaDetails;
  }, [draggedEnigmaDetails]);

  useEffect(() => {
    hoveredStatusPipIdRef.current = hoveredStatusPipId;
  }, [hoveredStatusPipId]);

  useEffect(() => {
    categorizedPipsRef.current = categorizedPips;
  }, [categorizedPips]);

  useEffect(() => {
    totalTriesRef.current = totalTries;
  }, [totalTries]);

  const setHoveredStatusPipId = useCallback((id) => {
    hoveredStatusPipIdRef.current = id;
    _setHoveredStatusPipId(id);
  }, []);

  const setDraggedEnigmaDetails = useCallback((details) => {
    draggedEnigmaDetailsRef.current = details;
    _setDraggedEnigmaDetails(details);
  }, []);

  const handleWelcomeMessageComplete = useCallback(() => {
    setShowWelcomePip(false);
  }, []);

  const closePersistentEnigma = useCallback((options = { restoreMeshVisibility: true }) => {
    const enigmaBeingClosed = activeEnigmaRef.current;
    if (options.restoreMeshVisibility && enigmaBeingClosed && enigmaBeingClosed.mesh) {
      let isAlreadyCategorized = false;
      const currentCategorized = categorizedPipsRef.current;
      if (enigmaBeingClosed.pipId) {
        for (const categoryId in currentCategorized) {
          if (currentCategorized[categoryId].some(item => item.pipId === enigmaBeingClosed.pipId)) {
            isAlreadyCategorized = true;
            break;
          }
        }
      }
      if (!isAlreadyCategorized) {
        enigmaBeingClosed.mesh.isVisible = true;
      }
    }
    setActiveEnigma(null);
  }, []);

  const exitGameMode = useCallback(() => {
    if (cameraRef.current && canvasRef.current) cameraRef.current.detachControl();
    if (screenModeHelperAPIRef.current?.toggleMode) screenModeHelperAPIRef.current.toggleMode("default");
    if (activeEnigmaRef.current) {
      closePersistentEnigma();
    }
    Object.values(categorizedPipsRef.current).flat().forEach(item => {
      if (scene && item.meshName) {
        const mesh = scene.getMeshByName(item.meshName);
        if (mesh) mesh.isVisible = true;
      }
    });
    setCategorizedPips({});
    setDraggedEnigmaDetails(null);
    setHoveredStatusPipId(null);
    setIsGameModeActive(false);
    setShowWelcomePip(false);
    setHasCardBeenClicked(false);
    setCategorizationStatus('idle');
    setShowMusicPip(false);
    setShowExitPip(false);
    setIsGameFinished(false);
    setTotalTries(0);
  }, [cameraRef, canvasRef, screenModeHelperAPIRef, closePersistentEnigma, scene, setDraggedEnigmaDetails, setHoveredStatusPipId]);


  const handleEnigmaPipDragStateChange = useCallback((pipId, isDragging, componentProps) => {
    if (isDragging) {
      const mesh = activeEnigmaRef.current?.mesh || null;
      const propsOnDragStart = activeEnigmaRef.current?.componentProps || componentProps || {};
      const newDragDetails = { pipId, props: propsOnDragStart, mesh };
      setDraggedEnigmaDetails(newDragDetails);
      setCategorizationStatus('idle');
      return false;
    } else {
      setTotalTries(prev => prev + 1);
      const previouslyDragged = draggedEnigmaDetailsRef.current;
      const finalHoveredStatusPipId = hoveredStatusPipIdRef.current;

      setDraggedEnigmaDetails(null);
      setHoveredStatusPipId(null);

      if (finalHoveredStatusPipId && previouslyDragged && previouslyDragged.pipId === pipId) {
        const droppedCardDef = previouslyDragged.props?.cardDefinition;

        if (!droppedCardDef || !droppedCardDef.category) {
            console.error("[WorldView] Cannot categorize PiP: cardDefinition or its category is missing.", previouslyDragged);
            setCategorizationStatus('fail');
            return false;
        }

        const normalizedCardCategory = droppedCardDef.category.trim().toUpperCase().replace(/S$/, '');
        const normalizedTargetCategory = finalHoveredStatusPipId.split('-')[0].trim().toUpperCase();

        if (normalizedCardCategory !== normalizedTargetCategory) {
            setCategorizationStatus('fail');
            return false;
        }

        setCategorizationStatus('success');
        let newCategorizedState;
        setCategorizedPips(prev => {
          const newCategoryItems = [
            ...(prev[finalHoveredStatusPipId] || []),
            {
              pipId: previouslyDragged.pipId,
              displayName: `${droppedCardDef.title} (${droppedCardDef.id.toUpperCase()})`,
              sourceModelPath: droppedCardDef.glbPath,
              meshName: previouslyDragged.mesh?.name,
              cardDefinition: droppedCardDef
            }
          ];
          newCategorizedState = { ...prev, [finalHoveredStatusPipId]: newCategoryItems };
          return newCategorizedState;
        });

        const totalCategorizedCount = Object.values(newCategorizedState).flat().length;
        if (totalCategorizedCount >= ALL_CARD_DEFINITIONS.length) {
            setIsGameFinished(true);
            setShowWelcomePip(true);
        }

        if (previouslyDragged.mesh) {
          previouslyDragged.mesh.isVisible = false;
        } else if (activeEnigmaRef.current && activeEnigmaRef.current.pipId === pipId && activeEnigmaRef.current.mesh) {
          activeEnigmaRef.current.mesh.isVisible = false;
        }

        closePersistentEnigma({ restoreMeshVisibility: false });
        return true;
      } else {
        if (previouslyDragged) {
            setCategorizationStatus('fail');
        }
        return false;
      }
    }
  }, [closePersistentEnigma, setDraggedEnigmaDetails, setHoveredStatusPipId]);


  const enterGameMode = useCallback(() => {
    if (!ScreenModeHelperComponent || !babylonContainerRef.current || !canvasRef.current || !engine || !cameraRef.current) {
      console.error("[WorldView] Cannot enter game mode, a dependency is missing."); return;
    }
    cameraRef.current.attachControl(canvasRef.current, true);
    setIsGameModeActive(true);
    setShowWelcomePip(true);
    setHasCardBeenClicked(false);
    setCategorizationStatus('idle');
    setShowMusicPip(true);
    setShowExitPip(true);
    setIsGameFinished(false);
    setTotalTries(0);
  }, [ScreenModeHelperComponent, engine, cameraRef, canvasRef, babylonContainerRef]);


  useEffect(() => {
    const hostDiv = document.createElement("div");
    hostDiv.id = ENIGMA_PIP_HOST_ID;
    document.body.appendChild(hostDiv);
    enigmaHostRef.current = hostDiv;
    return () => {
      if (enigmaHostRef.current) {
        preactRender(null, enigmaHostRef.current);
        if (enigmaHostRef.current.parentNode) {
          enigmaHostRef.current.parentNode.removeChild(enigmaHostRef.current);
        }
        enigmaHostRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const hostDiv = document.createElement("div");
    hostDiv.id = WELCOME_PIP_HOST_ID;
    document.body.appendChild(hostDiv);
    welcomePipHostRef.current = hostDiv;
    return () => {
      if (welcomePipHostRef.current) {
        preactRender(null, welcomePipHostRef.current);
        if (welcomePipHostRef.current.parentNode) {
          welcomePipHostRef.current.parentNode.removeChild(welcomePipHostRef.current);
        }
        welcomePipHostRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const hostDiv = document.createElement("div");
    hostDiv.id = MUSIC_PIP_HOST_ID;
    document.body.appendChild(hostDiv);
    musicPipHostRef.current = hostDiv;
    return () => {
      if (musicPipHostRef.current) {
        preactRender(null, musicPipHostRef.current);
        if (musicPipHostRef.current.parentNode) {
          musicPipHostRef.current.parentNode.removeChild(musicPipHostRef.current);
        }
        musicPipHostRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const hostDiv = document.createElement("div");
    hostDiv.id = EXIT_PIP_HOST_ID;
    document.body.appendChild(hostDiv);
    exitPipHostRef.current = hostDiv;
    return () => {
      if (exitPipHostRef.current) {
        preactRender(null, exitPipHostRef.current);
        if (exitPipHostRef.current.parentNode) {
          exitPipHostRef.current.parentNode.removeChild(exitPipHostRef.current);
        }
        exitPipHostRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const hostDiv = document.createElement("div");
    hostDiv.id = CATEGORIZED_PIP_HOST_ID;
    document.body.appendChild(hostDiv);
    categorizedPipHostRef.current = hostDiv;
    return () => {
      if (categorizedPipHostRef.current) {
        preactRender(null, categorizedPipHostRef.current);
        if (categorizedPipHostRef.current.parentNode) {
          categorizedPipHostRef.current.parentNode.removeChild(categorizedPipHostRef.current);
        }
        categorizedPipHostRef.current = null;
      }
    }
  }, []);


  useEffect(() => {
    const hostDiv = enigmaHostRef.current;
    if (!hostDiv || !EnigmaView || !isGameModeActive) {
      if (hostDiv) preactRender(null, hostDiv);
      return;
    }
    const pipElementProps = {
      key: ENIGMA_PIP_PERSISTENT_KEY,
      pipId: activeEnigma?.pipId || 'enigma-hidden-placeholder',
      onClose: closePersistentEnigma,
      component: EnigmaView,
      componentProps: activeEnigma?.componentProps || activeEnigmaRef.current?.componentProps || {},
      onDragStateChange: handleEnigmaPipDragStateChange,
      isVisible: !!activeEnigma,
      startMinimized: false,
      lockMinimizedState: false,
      initialStyle: {},
      titleText: "ENIGMA"
    };
    preactRender(preactH(FreshPip, pipElementProps), hostDiv);
  }, [activeEnigma, EnigmaView, isGameModeActive, closePersistentEnigma, handleEnigmaPipDragStateChange]);


  useEffect(() => {
    const hostDiv = welcomePipHostRef.current;
    if (!hostDiv || !isGameModeActive || (!showWelcomePip && !isGameFinished)) {
        if (hostDiv) preactRender(null, hostDiv);
        return;
    }

    const pipElementProps = {
      key: "welcome-message-pip",
      pipId: "welcome-message-pip",
      component: WelcomeMessageComponent,
      componentProps: {
        message: "Bonjour 🫡 . Welcome to our first experi{m}en{T}ce.",
        hasCardBeenClicked: hasCardBeenClicked,
        categorizationStatus: categorizationStatus,
        onMessageSequenceComplete: handleWelcomeMessageComplete,
        isGameFinished: isGameFinished,
        totalTries: totalTries,
        finalMessageOptions: finalMessageOptions,
        onClaimAndExit: exitGameMode // Pass the exit function as a prop
      },
      initialStyle: {
        width: isGameFinished ? "800px" : "500px",
        height: isGameFinished ? "450px" : "120px", // Increased height for the button
        top: isGameFinished ? `calc(50vh - 225px)` : "50px", // Adjusted top for new height
        left: isGameFinished ? `calc(50% - 400px)` : `calc(50% - 250px)`,
        right: "auto",
        borderRadius: "12px",
        backgroundColor: "rgba(34, 34, 34, 0.9)",
        border: "2px solid rgba(68, 68, 68, 0.7)",
        boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
        zIndex: DEFAULT_FALLBACK_ZINDEX + 200
      },
      onClose: null,
      titleText: isGameFinished ? "Final Report" : "Welcome!",
      startMinimized: false,
      lockMinimizedState: false,
      showContentWhenMinimized: false,
      hideHeaderElements: true,
      isDraggable: false,
      isVisible: true
    };
    preactRender(preactH(FreshPip, pipElementProps), hostDiv);

  }, [showWelcomePip, isGameModeActive, welcomePipHostRef, hasCardBeenClicked, categorizationStatus, handleWelcomeMessageComplete, isGameFinished, totalTries, exitGameMode]);

  useEffect(() => {
    const hostDiv = musicPipHostRef.current;
    if (!hostDiv || !showMusicPip || !isGameModeActive) {
      if (hostDiv) preactRender(null, hostDiv);
      return;
    }

    const BUTTON_DIAMETER = 48;
    const BUTTON_RIGHT_OFFSET_EXIT = 30;
    const BUTTON_SPACING = 15;

    const musicButtonRightPosition = BUTTON_RIGHT_OFFSET_EXIT + BUTTON_DIAMETER + BUTTON_SPACING;

    const pipElementProps = {
      key: "music-player-pip",
      pipId: "music-player-pip",
      component: BasicView,
      componentProps: { initialIsPlaying: true },
      initialStyle: {
        width: `${BUTTON_DIAMETER}px`,
        height: `${BUTTON_DIAMETER}px`,
        borderRadius: "50%",
        top: "30px",
        right: `${musicButtonRightPosition}px`,
        left: "auto",
        backgroundColor: "rgba(50, 50, 50, 0.85)",
        border: "2px solid rgba(100, 100, 100, 0.9)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        zIndex: DEFAULT_FALLBACK_ZINDEX + 180
      },
      onClose: null,
      titleText: "",
      startMinimized: false,
      lockMinimizedState: false,
      showContentWhenMinimized: true,
      hideHeaderElements: true,
      isDraggable: false,
      isVisible: true
    };
    preactRender(preactH(FreshPip, pipElementProps), hostDiv);
  }, [showMusicPip, isGameModeActive, musicPipHostRef]);


  useEffect(() => {
    const hostDiv = exitPipHostRef.current;
    if (!hostDiv || !showExitPip || !isGameModeActive) {
      if (hostDiv) preactRender(null, hostDiv);
      return;
    }

    const BUTTON_DIAMETER = 48;
    const BUTTON_RIGHT_OFFSET = 30;

    const pipElementProps = {
      key: "exit-game-pip",
      pipId: "exit-game-pip",
      component: ExitButtonComponent,
      componentProps: { onExit: exitGameMode },
      initialStyle: {
        width: `${BUTTON_DIAMETER}px`,
        height: `${BUTTON_DIAMETER}px`,
        borderRadius: "50%",
        top: "30px",
        right: `${BUTTON_RIGHT_OFFSET}px`,
        left: "auto",
        backgroundColor: "rgba(50, 50, 50, 0.85)",
        border: "2px solid rgba(100, 100, 100, 0.9)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        zIndex: DEFAULT_FALLBACK_ZINDEX + 180
      },
      onClose: null,
      titleText: "",
      startMinimized: false,
      lockMinimizedState: false,
      showContentWhenMinimized: true,
      hideHeaderElements: true,
      isDraggable: false,
      isVisible: true
    };
    preactRender(preactH(FreshPip, pipElementProps), hostDiv);
  }, [showExitPip, isGameModeActive, exitPipHostRef, exitGameMode]);

  useEffect(() => {
    const hostDiv = categorizedPipHostRef.current;
    if (!hostDiv || !isGameModeActive) {
      if (hostDiv) preactRender(null, hostDiv);
      return;
    }

    const pipElementProps = {
      key: "categorized-list-pip",
      pipId: "categorized-list-pip",
      component: CategorizedPipsListComponent,
      componentProps: {
        categorizedItems: categorizedPips
      },
      initialStyle: {
        width: "300px",
        height: "400px",
        top: "auto",
        left: "auto",
        bottom: "30px",
        right: "30px",
        borderRadius: "8px",
        backgroundColor: "rgba(34, 34, 34, 0.9)",
        border: "2px solid rgba(68, 68, 68, 0.7)",
        boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
        zIndex: DEFAULT_FALLBACK_ZINDEX + 190
      },
      onClose: null,
      titleText: "Categorized Cards",
      startMinimized: false,
      lockMinimizedState: false,
      showContentWhenMinimized: false,
      hideHeaderElements: false,
      isDraggable: false,
      isVisible: true
    };
    preactRender(preactH(FreshPip, pipElementProps), hostDiv);

  }, [isGameModeActive, categorizedPips, categorizedPipHostRef]);


  useEffect(() => {
    const styleId = 'spin-animations-style';
    const cleanupStatusPips = () => {
        statusPipHostsRef.current.forEach(hostDiv => {
            if (hostDiv) {
                hostDiv.onmouseenter = null;
                hostDiv.onmouseleave = null;
                preactRender(null, hostDiv);
                if (hostDiv.parentNode) hostDiv.parentNode.removeChild(hostDiv);
            }
        });
        statusPipHostsRef.current = [];
        const styleTag = document.getElementById(styleId);
        if (styleTag) styleTag.remove();
    };

    if (isGameModeActive) {
        if (!document.getElementById(styleId)) {
            const styleSheet = document.createElement("style");
            styleSheet.id = styleId;
            styleSheet.innerText = `
                @keyframes spinTextAround { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pipShake {
                  0%, 100% { transform: translateX(0); }
                  20%, 60% { transform: translateX(-5px); }
                  40%, 80% { transform: translateX(5px); }
                }
                .pip-shaking {
                    animation: pipShake 0.3s ease-in-out;
                    animation-fill-mode: forwards;
                }
                @keyframes spinIcon { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `;
            document.head.appendChild(styleSheet);
        }
        const statusPipsConfig = [
            { id: 'health-pip', text: 'HEALTH', originalBorderColor: '#ff7675', hoverBorderColor: '#FF4136', subtleHoverBorderColor: '#ff9a94', originalBackgroundColor: '#282828', hoverBackgroundColor: '#ffbaba', subtleHoverBgColor: '#332e2e', originalTextColor: '#f5f6fa'},
            { id: 'wealth-pip', text: 'WEALTH', originalBorderColor: '#55efc4', hoverBorderColor: '#2ECC71', subtleHoverBorderColor: '#7cf2d3', originalBackgroundColor: '#282828', hoverBackgroundColor: '#a6e9c0', subtleHoverBgColor: '#2e3331', originalTextColor: '#f5f6fa'},
            { id: 'experience-pip', text: 'EXPERIENCE', originalBorderColor: '#74b9ff', hoverBorderColor: '#007bff', subtleHoverBorderColor: '#9acbff', originalBackgroundColor: '#282828', hoverBackgroundColor: '#b3d9ff', subtleHoverBgColor: '#2e3133', originalTextColor: '#f5f6fa'}
        ];
        const PIP_DIAMETER_STATUS = PIP_MINIMIZED_SIZE_NUM; // 80px
        const PIP_SPACING_STATUS = 30;
        const RIGHT_OFFSET_STATUS_PIPS = "30px";
        const DRAG_HOVER_SCALE_FACTOR = 1.15;
        const DRAG_HOVER_ADDITIONAL_SPACING = 15;
        const BASE_STATUS_PIP_ZINDEX = DEFAULT_FALLBACK_ZINDEX + 50;
        const HOVERED_STATUS_PIP_ZINDEX = BASE_STATUS_PIP_ZINDEX + 10;
        const TOTAL_BLOCK_HEIGHT = (statusPipsConfig.length * PIP_DIAMETER_STATUS) + ((statusPipsConfig.length - 1) * PIP_SPACING_STATUS);
        const TOP_MARGIN_FOR_STATUS_PIPS = 220;

        const newStatusPipHosts = [];

        statusPipsConfig.forEach((pipConfig, index) => {
            const hostDivId = `status-pip-host-${pipConfig.id}`;
            let hostDiv = document.getElementById(hostDivId);
            if (!hostDiv) {
                hostDiv = document.createElement("div"); hostDiv.id = hostDivId;
                document.body.appendChild(hostDiv);
            }
            newStatusPipHosts.push(hostDiv);

            const isCursorDirectlyOverThis = pipConfig.id === hoveredStatusPipIdRef.current;
            const isEnigmaPipCurrentlyDragging = !!draggedEnigmaDetailsRef.current;

            const isHoveredByEnigmaDrag = isEnigmaPipCurrentlyDragging && isCursorDirectlyOverThis;
            const isHoveredByCursorOnly = isCursorDirectlyOverThis && !isEnigmaPipCurrentlyDragging;

            let currentPipTopOffsetValue = index * (PIP_DIAMETER_STATUS + PIP_SPACING_STATUS);
            let scale = 1;
            let zIndex = BASE_STATUS_PIP_ZINDEX;
            let currentBorderColor = pipConfig.originalBorderColor;
            let currentBackgroundColor = pipConfig.originalBackgroundColor;
            let textHoverColor = pipConfig.hoverBorderColor;

            const actualDragTargetIndex = isEnigmaPipCurrentlyDragging && hoveredStatusPipIdRef.current
                                          ? statusPipsConfig.findIndex(p => p.id === hoveredStatusPipIdRef.current)
                                          : -1;

            if (isHoveredByEnigmaDrag) {
                scale = DRAG_HOVER_SCALE_FACTOR;
                zIndex = HOVERED_STATUS_PIP_ZINDEX;
                currentBorderColor = pipConfig.hoverBorderColor;
                currentBackgroundColor = pipConfig.hoverBackgroundColor;
            } else if (isEnigmaPipCurrentlyDragging && actualDragTargetIndex !== -1 && index !== actualDragTargetIndex) {
                const scaledPipExtraSize = PIP_DIAMETER_STATUS * (DRAG_HOVER_SCALE_FACTOR - 1);
                const displacementDueToScale = scaledPipExtraSize / 2;
                if (index < actualDragTargetIndex) {
                    currentPipTopOffsetValue -= (displacementDueToScale + DRAG_HOVER_ADDITIONAL_SPACING);
                } else {
                    currentPipTopOffsetValue += (displacementDueToScale + DRAG_HOVER_ADDITIONAL_SPACING);
                }
            } else if (isHoveredByCursorOnly) {
                currentBorderColor = pipConfig.subtleHoverBorderColor;
                currentBackgroundColor = pipConfig.subtleHoverBgColor;
                zIndex = BASE_STATUS_PIP_ZINDEX + 1;
            }
            const topPosition = `${TOP_MARGIN_FOR_STATUS_PIPS + currentPipTopOffsetValue}px`;


            const pipInitialStyleForStatusPip = {
                top: topPosition, right: RIGHT_OFFSET_STATUS_PIPS, left: 'auto',
                width: `${PIP_DIAMETER_STATUS}px`, height: `${PIP_DIAMETER_STATUS}px`,
                borderRadius: '50%', backgroundColor: currentBackgroundColor,
                border: `2px solid ${currentBorderColor}`, transform: `scale(${scale})`, zIndex: zIndex,
                transition: `transform 0.2s ease-out, top 0.2s ease-out, border-color 0.2s ease-out, background-color 0.2s ease-out, box-shadow 0.2s ease-out`
            };

            hostDiv.onmouseenter = () => setHoveredStatusPipId(pipConfig.id);
            hostDiv.onmouseleave = () => {
                if(hoveredStatusPipIdRef.current === pipConfig.id) {
                    setHoveredStatusPipId(null);
                }
             };

            preactRender(
              preactH(FreshPip, {
                key: hostDivId, pipId: hostDivId,
                component: StatusPipContentComponent,
                componentProps: {
                    text: pipConfig.text, textColor: pipConfig.originalTextColor,
                    hoverTextColor: textHoverColor, pipDiameter: PIP_DIAMETER_STATUS,
                    isHoveredByDrag: isHoveredByEnigmaDrag, isHoveredByCursorOnly: isHoveredByCursorOnly,
                },
                initialStyle: pipInitialStyleForStatusPip,
                startMinimized: true,
                lockMinimizedState: true,
                isVisible: true,
                showContentWhenMinimized: true,
                hideHeaderElements: true,
                isDraggable: false
              }), hostDiv
            );
        });
        statusPipHostsRef.current = newStatusPipHosts;
        return cleanupStatusPips;
    } else {
        cleanupStatusPips();
        return () => {};
    }
  }, [isGameModeActive, hoveredStatusPipId, draggedEnigmaDetails, setHoveredStatusPipId]);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(document.querySelector(`script[src="${src}"]`)); return;
      }
      const script = document.createElement("script");
      script.src = src; script.async = true;
      script.onload = () => resolve(script);
      script.onerror = (e) => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  };

  const initBabylon = async () => {
    if (!canvasRef.current || !window.BABYLON || !window.BABYLON.SceneLoader || engine) {
      return () => { };
    }
    const babylonEngine = new window.BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    const babylonScene = new window.BABYLON.Scene(babylonEngine);

    babylonScene.clearColor = new window.BABYLON.Color3(0, 0, 0); // Opaque black


    const stackBasePosition = new window.BABYLON.Vector3(0, 0, 0);
    const cameraTarget = stackBasePosition;
    const camera = new window.BABYLON.ArcRotateCamera("Camera", Math.PI, Math.PI / 3, 7, cameraTarget, babylonScene);
    cameraRef.current = camera;
    camera.minZ = 0.01; camera.lowerBetaLimit = 0.1; camera.upperBetaLimit = (Math.PI / 2) - 0.01;
    camera.wheelPrecision = 50; camera.lowerRadiusLimit = 1; camera.upperRadiusLimit = 11;
    new window.BABYLON.HemisphericLight("light1", new window.BABYLON.Vector3(1, 1, 0), babylonScene);
    new window.BABYLON.HemisphericLight("light2", new window.BABYLON.Vector3(-1, 1, -0.5), babylonScene);
    const modelPathBlank = "_RESOURCES/GLB/MINIGAME/b26.card.blank.glb";
    try {
      const resB = await window.BABYLON.SceneLoader.ImportMeshAsync(null, "", dc.app.vault.adapter.getResourcePath(modelPathBlank), babylonScene);
      let blankMesh = resB.meshes.find(m => m.getTotalVertices() > 0 && m.name !== "__root__") || resB.meshes[0];
      if (blankMesh) {
        blankMesh.name = "CardBlank"; blankMesh.position = stackBasePosition.clone();
        blankMesh.scaling = new window.BABYLON.Vector3(2.5, 111, 2.5);
        blankMesh.rotationQuaternion = null; blankMesh.rotation.y = Math.PI / 2;
      }
    } catch (e) { console.error("[WorldView] Error loading Blank Card:", e); }

    const interactiveCardMeshes = [];
    const SPREAD_AREA_WIDTH = 2.675, SPREAD_AREA_DEPTH = 2.8, CARD_Y_OFFSET = 0.05, CARD_RANDOM_HEIGHT_RANGE = 0.01, CARD_RANDOM_ROTATION_Y_RANGE = Math.PI / 12, CARD_SPACING_MARGIN = 0.05;

    const currentCardDefinitions = Array.isArray(ALL_CARD_DEFINITIONS) ? ALL_CARD_DEFINITIONS : [];

    if (currentCardDefinitions.length === 0) {
        console.warn("[WorldView InitBabylon] No card definitions found or loaded. No cards will be created.");
    } else {
        const numCards = currentCardDefinitions.length;
        const cols = Math.min(5, Math.ceil(Math.sqrt(numCards)));
        const rows = Math.ceil(numCards / cols);
        const cellWidth = SPREAD_AREA_WIDTH / cols;
        const cellHeight = SPREAD_AREA_DEPTH / rows;
        const s_scale_factor = 2.5 / 10.0;
        const cardFootprintWidth = s_scale_factor;
        const cardFootprintDepth = s_scale_factor;

        if (cellWidth < cardFootprintWidth + CARD_SPACING_MARGIN || cellHeight < cardFootprintDepth + CARD_SPACING_MARGIN) {
            console.warn("[WorldView] Grid cells might be too small for cards given current scaling and spacing.");
        }

        let cardIndex = 0;
        for (const cardDef of currentCardDefinitions) {
            if (!cardDef.glbPath || !cardDef.id) {
                console.warn("[WorldView] Skipping card definition due to missing glbPath or id:", cardDef);
                continue;
            }
            const modelPathForCard = cardDef.glbPath;

            try {
                const resCard = await window.BABYLON.SceneLoader.ImportMeshAsync(null, "", dc.app.vault.adapter.getResourcePath(modelPathForCard), babylonScene);
                let cardMesh = resCard.meshes.find(m => m.getTotalVertices() > 0 && m.name !== "__root__") || resCard.meshes[0];
                if (cardMesh) {
                    cardMesh.name = `Card-${cardDef.id}`;
                    const r_grid = Math.floor(cardIndex / cols);
                    const c_grid = cardIndex % cols;
                    const cellCenterX = stackBasePosition.x - SPREAD_AREA_WIDTH / 2 + cellWidth * (c_grid + 0.5);
                    const cellCenterZ = stackBasePosition.z - SPREAD_AREA_DEPTH / 2 + cellHeight * (r_grid + 0.5);
                    const jitterRangeX = Math.max(0, (cellWidth - cardFootprintWidth - CARD_SPACING_MARGIN) / 2 * 0.8);
                    const jitterRangeZ = Math.max(0, (cellHeight - cardFootprintDepth - CARD_SPACING_MARGIN) / 2 * 0.8);

                    cardMesh.position.x = cellCenterX + (Math.random() - 0.5) * 2 * jitterRangeX;
                    cardMesh.position.z = cellCenterZ + (Math.random() - 0.5) * 2 * jitterRangeZ;
                    cardMesh.position.y = stackBasePosition.y + CARD_Y_OFFSET + (Math.random() - 0.5) * CARD_RANDOM_HEIGHT_RANGE;

                    cardMesh.scaling = new window.BABYLON.Vector3(s_scale_factor, s_scale_factor * 33, s_scale_factor);

                    cardMesh.rotationQuaternion = null;
                    cardMesh.rotation.y = (Math.PI / 2) + (Math.random() - 0.5) * CARD_RANDOM_ROTATION_Y_RANGE;
                    cardMesh.rotation.z = Math.PI;

                    cardMesh.userData = { cardDefinition: cardDef };
                    interactiveCardMeshes.push(cardMesh);
                    cardIndex++;
                }
            } catch (e) {
                console.error(`[WorldView] Error loading Card ${cardDef.id} from ${modelPathForCard}:`, e);
            }
        }
    }

    let cardPointerObserver = null;
    if (interactiveCardMeshes.length > 0) {
      cardPointerObserver = babylonScene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === window.BABYLON.PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.hit && interactiveCardMeshes.includes(pointerInfo.pickInfo.pickedMesh)) {
          const clickedMesh = pointerInfo.pickInfo.pickedMesh;
          const cardDef = clickedMesh.userData?.cardDefinition;

          if (!cardDef) {
            console.warn("[WorldView] Clicked mesh has no cardDefinition in userData.", clickedMesh);
            return;
          }

          const pipIdForCard = `enigma-viewer-${cardDef.id}`;

          if (!EnigmaView) {
            console.error(`[WorldView] Cannot open PiP for ${cardDef.title || cardDef.id}: EnigmaView component is not loaded.`);
            return;
          }

          let isCategorized = false;
          const currentCategorized = categorizedPipsRef.current;
          for (const categoryId in currentCategorized) {
            if (currentCategorized[categoryId].some(item => item.pipId === pipIdForCard)) {
              isCategorized = true;
              break;
            }
          }
          if (isCategorized) {
            return;
          }

          const currentActive = activeEnigmaRef.current;
          if (currentActive?.pipId === pipIdForCard) {
            const hostDiv = enigmaHostRef.current;
            if (hostDiv && hostDiv.firstChild) {
              bringToFront(hostDiv.firstChild);
            }
            return;
          }

          if (currentActive && currentActive.pipId !== pipIdForCard) {
            if (currentActive.mesh) {
                let prevIsCategorized = false;
                if(currentActive.pipId){
                    for (const categoryId in currentCategorized) {
                        if (currentCategorized[categoryId].some(item => item.pipId === currentActive.pipId)) {
                            prevIsCategorized = true;
                            break;
                        }
                    }
                }
                if(!prevIsCategorized) currentActive.mesh.isVisible = true;
            }
          }

          const enigmaViewProps = {
            modelPath: cardDef.glbPath,
            initialUrl: cardDef.url,
            titleText: `${cardDef.title}`,
            descriptionText: cardDef.description,
            cardDefinition: cardDef
          };

          clickedMesh.isVisible = false;
          setActiveEnigma({
            pipId: pipIdForCard,
            mesh: clickedMesh,
            componentProps: enigmaViewProps
          });

          setHasCardBeenClicked(true);
        }
      });
    }
    setEngine(babylonEngine); setScene(babylonScene);
    babylonEngine.runRenderLoop(() => { if (babylonScene?.activeCamera && !babylonEngine.isDisposed) babylonScene.render(); });
    const resizeHandler = () => { if (babylonEngine && !babylonEngine.isDisposed) babylonEngine.resize(); };
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (babylonScene && cardPointerObserver) babylonScene.onPointerObservable.remove(cardPointerObserver);
      if (cameraRef.current) cameraRef.current.detachControl();
      const lastActive = activeEnigmaRef.current;
      if (lastActive && lastActive.mesh) {
        let isStillCategorized = false;
        const currentCategorizedOnCleanup = categorizedPipsRef.current;
        if (lastActive.pipId) {
            for (const categoryId in currentCategorizedOnCleanup) {
                if (currentCategorizedOnCleanup[categoryId].some(item => item.pipId === lastActive.pipId)) {
                    isStillCategorized = true;
                    break;
                }
            }
        }
        if (!isStillCategorized) {
          lastActive.mesh.isVisible = true;
        }
      }
      babylonEngine?.stopRenderLoop(); babylonScene?.dispose(); babylonEngine?.dispose();
      setEngine(null); setScene(null); cameraRef.current = null;
    };
  };

  useEffect(() => {
    if (!ScreenModeHelperComponent) {
      dc.require(dc.headerLink("_OPERATION/PRIVATE/DATACORE/26 LicenseAgreement/D.q.licenseagreement.component.md", "ScreenModeHelper", "ScreenModeHelper"))
        .then(module => {
          if (module?.ScreenModeHelper) setScreenModeHelperComponent(() => module.ScreenModeHelper);
          else console.error("[WorldView] ScreenModeHelper not found in loaded module.");
        })
        .catch(err => console.error("[WorldView] Failed to load ScreenModeHelper:", err));
    }
  }, []);
  useEffect(() => {
    let babylonCleanupFunction = () => { };
    let isMounted = true;
    const setupEnvironment = async () => {
      if (engine || !canvasRef.current) return;
      try {
        if (!window.BABYLON?.SceneLoader) {
          await loadScript("https://cdn.babylonjs.com/babylon.js");
          await loadScript("https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js");
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (isMounted && canvasRef.current && !engine) {
          const cleanupFn = await initBabylon();
          if (isMounted) babylonCleanupFunction = cleanupFn; else cleanupFn?.();
        }
      } catch (error) { console.error("[WorldView] Failed to setup Babylon environment:", error); }
    };
    if (babylonContainerRef.current && canvasRef.current && !engine) setupEnvironment();
    return () => {
      isMounted = false;
      babylonCleanupFunction?.();
    };
  }, [babylonContainerRef, canvasRef]);


  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === "Escape" && isGameModeActive) exitGameMode(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isGameModeActive, exitGameMode]);

  // NEW: Thematic styles for the pre-game screen
  const mainWrapperStyle = {
    width: '100%',
    height: '500px',
    position: 'relative',
    background: 'radial-gradient(ellipse at center, #2a2a3a 0%, #1a1a2a 70%, #0a0a1a 100%)',
    fontFamily: `'Consolas', 'Monaco', 'Lucida Console', 'monospace'`,
    color: '#ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const preGameOverlayStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
    padding: '20px 40px',
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(148, 0, 211, 0.3)',
    borderRadius: '12px',
    boxShadow: '0 0 15px rgba(148, 0, 211, 0.5), 0 0 30px rgba(0, 123, 255, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease-in-out'
  };
  
  const playButtonStyleBase = {
    padding: '15px 30px',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'white',
    border: '1px solid #8a2be2',
    borderRadius: '8px',
    background: 'linear-gradient(145deg, #007bff, #8a2be2)',
    boxShadow: '0 0 10px #8a2be2',
    textShadow: '0 0 5px rgba(255, 255, 255, 0.7)',
    transition: 'all 0.3s ease'
  };

  const playButtonStyleHover = {
    background: 'linear-gradient(145deg, #0056b3, #6a1b9a)',
    boxShadow: '0 0 20px #8a2be2, 0 0 30px #007bff',
    transform: 'scale(1.05)'
  };

  const finalPlayButtonStyle = isPlayButtonHovered
    ? { ...playButtonStyleBase, ...playButtonStyleHover }
    : playButtonStyleBase;


  const DEFAULT_BABYLON_CONTAINER_STYLE = `width:100%;height:100%;position:relative;overflow:hidden;background:#1e1e1e;`;
  const WINDOW_MODE_STYLE = `position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background-color:#000;display:flex;align-items:center;justify-content:center;`;
  const STYLES_BY_MODE_PROP = { window: WINDOW_MODE_STYLE };

  const isLoadingAssets = !ScreenModeHelperComponent || !engine || !cameraRef.current || !EnigmaView || !ALL_CARD_DEFINITIONS || !Array.isArray(ALL_CARD_DEFINITIONS) || ALL_CARD_DEFINITIONS.length === 0 || !LoadingLogo;

  return preactH('div', { className: 'world-view-main-wrapper', style: mainWrapperStyle },
    preactH('div', { ref: originalBabylonParentRef, className: 'original-babylon-parent-placeholder', style: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 } },
      preactH('div', { ref: babylonContainerRef, className: 'babylon-canvas-dynamic-container', style: (isGameModeActive && ScreenModeHelperComponent) ? {} : DEFAULT_BABYLON_CONTAINER_STYLE, },
        preactH('canvas', { ref: canvasRef, tabIndex: isGameModeActive ? 0 : -1, style: { width: "100%", height: "100%", display: 'block', outline: "none", pointerEvents: isGameModeActive ? 'auto' : 'none' }, touchAction: "none" })
      )
    ),
    !isGameModeActive && preactH('div', { style: preGameOverlayStyle },
      isLoadingAssets
        ? preactH(LoadingLogo, {})
        : preactH('button', {
            onClick: enterGameMode,
            style: finalPlayButtonStyle,
            onMouseEnter: () => setIsPlayButtonHovered(true),
            onMouseLeave: () => setIsPlayButtonHovered(false),
          }, 'Play Game')
    ),
    isGameModeActive && ScreenModeHelperComponent && engine && preactH(ScreenModeHelperComponent, {
      key: `smh-${isGameModeActive}`, helperRef: screenModeHelperAPIRef, containerRef: babylonContainerRef,
      originalParentRefForWindow: originalBabylonParentRef, allowedScreenModes: ["window"], engine: engine,
      defaultStyle: DEFAULT_BABYLON_CONTAINER_STYLE, stylesByMode: STYLES_BY_MODE_PROP,
      hideToggleButtons: true, initialMode: "window"
    })
  );
}

return { WorldView };
```




# CardData

```jsx

const ALL_CARD_DEFINITIONS = [
  {
    id: "throne",
    title: "ENIGMA",
    category: "HEALTH",
    sudcategory: "VIBRATIONS/FREQUENCY",
    description: "The Next Step in Evolution.. \n 🫡",
    url: "https://www.instagram.com/reel/C2Z6DOHyFDh/", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.throne.glb"
  },
  {
    id: "queen",
    title: "ENIGMA",
	category: "HEALTH",
	sudcategory: "PHYSICAL/SLEEP",
	sud: "BRAIN",
    description: "SLEEP clean process - maintain longevity",
    url: "https://www.instagram.com/reel/DCzaRLzyLfI", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.queen.glb"
  },
  {
    id: "pill",
    title: "ENIGMA",
    category: "HEALTH",
    sudcategory: "PHYSICAL/SLEEP",
    description: "Sleep amount = the amount of toxic / waste within the system",
    url: "https://www.instagram.com/reel/C5KKcWdRdiF/ ", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.pill.glb"
  },
  {
    id: "king",
    title: "ENIGMA",
    category: "HEALTH",
	sudcategory: "VIBRATIONS/PERCEPTION",
    description: "Perception is KING. +- 👑 = 👀 = 🦤 =? 🔗",
    url: "https://youtube.com/shorts/OLMfCNza4f0",
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.king.glb"
  },
  {
    id: "gate",
    title: "ENIGMA", 
    category: "HEALTH",
	sudcategory: "MIND/MEMORY",
    description: "Type 3 diabetes...  ¯\_(ツ)_/¯ \n ⽗",
    url: "https://www.instagram.com/reel/C8uJzfhv56n/",
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.gate.glb" 
  },
  {
    id: "pills", 
    title: "ENIGMA",
    category: "HEALTH",
    sudcategory: "MIND/PLACEBO",
    description: "You dictate your reality , will the pill dictate it",
    url: "https://www.instagram.com/reel/C7z_I5VNb_a/", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.pills.glb"
  },
  {
    id: "shhh",
    title: "ENIGMA",
    category: "WEALTH",
    sudcategory: "BUSINESS",
    description: "Keep things to yourself. until... \n⛓️‍💥",
    url: "https://www.instagram.com/reel/DFtCyOaqrK3",
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.shhh.glb"
  },
  {
    id: "innerdemon",
    title: "ENIGMA",
    category: "WEALTH",
	sudcategory: "BUSINESS",
    description: "BUILD, build, BUILD. dont let them stop you",
    url: "https://x.com/gregisenberg/status/1882775359290241097", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.innerdemon.glb"
  },
  {
    id: "kid",
    title: "ENIGMA",
    category: "WEALTH",
	sudcategory: "ECONOMIC",
    description: "Childrens playing kids games , whats next",
    url: "https://youtube.com/shorts/_1SHEtsbevc",
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.kid.glb"
  },
  {
    id: "88",
    title: "ENIGMA",
    category: "WEALTH",
	sudcategory: "FINANCE",
    description: "Tools to power-UP while streamlining tracking .",
    url: "https://www.instagram.com/peripheral_inc/reel/C7pXwELyBRN/", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.88.glb"
  },
  {
    id: "joker",
    title: "ENIGMA",
    category: "WEALTH",
	sudcategory: "WEALTH",
    description: "Play the Game or Get played 🙃.\n 🎱 - 🎰 - 🃏",
    url: "https://www.instagram.com/reel/C3Sw_DbshhY/",
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.joker.glb"
  },
  {
    id: "8",
    title: "ENIGMA",
    category: "WEALTH",
	sudcategory: "FINANCE",
    description: "Where you all hiding............. 🙈. ",
    url: "https://youtube.com/shorts/F2GAfJQgstY",
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.8.glb"
  },
  {
    id: "dev", 
    title: "ENIGMA",
    category: "EXPERIENCES",
	sudcategory: "TECH",
    description: "🌬️ . 🌳 ... 📲...\n...🤔...",
    url: "https://www.instagram.com/reel/C4WDUDmI8Sm/", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.dev.glb"
  },
  {
    id: "god", 
    title: "ENIGMA",
    category: "EXPERIENCES",
	sudcategory: "",
	sudcategory: "RELIGION,SCIENCE",
    description: "Creating system within systems..",
    url: "https://www.instagram.com/reel/DB6_b56xGJh", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.god.glb"
  },
  {
    id: "888",
    title: "ENIGMA",
    category: "EXPERIENCES",
	sudcategory: "LAWS",
    description: "--- 𒀭 = - - - - = 𒀭 = - - - - = 𒀭 --- ",
    url: "https://www.instagram.com/reel/DBXKMW2NUCI", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.888.glb"
  },
  {
    id: "ancestor",
    title: "ENIGMA",
    category: "EXPERIENCES",
	sudcategory: "MATRIX",
    description: "Join the dark side, we got ideas...",
    url: "https://www.youtube.com/shorts/Za95Mp_lhVc", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.ancestor.glb"
  },
  {
    id: "demon",
    title: "ENIGMA",
    category: "EXPERIENCES",
	sudcategory: "MATRIX",
    description: "The only demon is your[[SELF]]",
    url: "https://www.instagram.com/reel/DFBmRHlKvgy", 
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.demon.glb"
  },
  {
    id: "cat",
    title: "ENIGMA",
    category: "EXPERIENCES",
	sudcategory: "LEARN",
    description: "Live, learn and fail fail fail  MORE... 😨",
    url: "https://www.youtube.com/shorts/EYoV6lkVF-M",
    glbPath: "_RESOURCES/GLB/MINIGAME/b26.card.cat.glb"
  }
];

return ALL_CARD_DEFINITIONS;
```



# FinalMessage

```jsx
const finalMessageOptions = [
  {
    minTries: 18,
    maxTries: 18,
    title: "Perfect Factotum 🫡",
    message: "You have achieved perfect harmony with the universe of BETO.888. Your understanding of health, wealth, and experiences is unparalleled. You are a true master of the war of ideas."
  },
  {
    minTries: 19,
    maxTries: 24,
    title: "Enlightened Sage",
    message: "Your journey through the realms of life is marked by wisdom and insight. You navigate the currents of knowledge, with grace and precision within the chaos effortlessly."
  },
  {
    minTries: 25,
    maxTries: 30,
    title: "Skilled Artisan",
    message: "You have crafted your path with skill and determination. The tapestry of your experiences, woven with threads, shines vibrant and strong—a testament to your prowess in the crucible of curiosity."
  },
  {
    minTries: 31,
    maxTries: 36,
    title: "Dedicated Factotum",
    message: "Your persistence in the face of challenges is commendable. Each step through the ENIGMAS of this game brings you closer to mastery, polishing raw thought into gleaming insight."
  },
  {
    minTries: 37,
    maxTries: 42,
    title: "Curious Explorer",
    message: "Your curiosity drives you forward, unearthing hidden gems in the CRUCIBLE of learning. Embrace the journey, for in the war of ideas, every twist and turn holds value beyond the destination."
  },
  {
    minTries: 43,
    maxTries: 48,
    title: "Resilient Factotum",
    message: "Though the path was long, your resilience shines through. Forged in the ENIGMAS of trial and error, you emerge tempered and strengthened, ready for greater challenges."
  },
  {
    minTries: 49,
    maxTries: 53,
    title: "Tenacious Seeker",
    message: "Your tenacity is a beacon in the fog of uncertainty. In the vast expanse of BETO.888, your relentless spirit turns every stumble into a step toward deeper understanding."
  },
  {
    minTries: 54,
    maxTries: 54,
    title: "NPC Detected",
    message: "NPC detected... Self-Destruction will now commence 🫡\nEven in chaos, there’s humor—perhaps the war of ideas has a few more battles for you to fight. Retry and rise, for ANYTHING IS POSSIBLE!"
  }
];

return finalMessageOptions;
```






# LoadingLogo

```jsx
// A utility function to load external scripts.
function loadScript(src, onload, onerror) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = onload;
  script.onerror =
    onerror ||
    function () {
      console.error(`Failed to load script: ${src}`);
    };
  document.body.appendChild(script);
  return script;
}

// Fuzzy search for a file using Fuse.js and the Obsidian file index.
async function fuzzyFindFile(filename) {
  if (!window.Fuse) {
    await new Promise((resolve) =>
      loadScript("https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js", resolve)
    );
  }
  const files = app.vault.getFiles();
  const fuse = new Fuse(files, {
    keys: ["path"],
    includeScore: true,
    threshold: 0.4,
  });
  const results = fuse.search(filename);
  if (results.length > 0) {
    return results[0].item;
  }
  return files.find(f => f.path.endsWith(filename)) || null;
}

// Get an Obsidian resource path that the browser can use.
async function getMediaResourcePath(filename) {
  const file = await fuzzyFindFile(filename);
  if (!file) {
    throw new Error(`File containing "${filename}" not found in the vault.`);
  }
  return app.vault.getResourcePath(file);
}

// The main component to render the view.
function LoadingLogo() {
  const fileName = "BETO_Logo_W_Loading.svg";
  
  const [mediaSrc, setMediaSrc] = dc.useState(null);
  const [error, setError] = dc.useState(null);
  // NEW: State to track if the image has finished loading in the browser.
  const [isImageLoaded, setIsImageLoaded] = dc.useState(false);

  // Effect to find the file and get its resource path.
  dc.useEffect(() => {
    // Reset loaded state if the filename changes
    setIsImageLoaded(false); 
    
    getMediaResourcePath(fileName)
      .then((url) => {
        setMediaSrc(url);
      })
      .catch((err) => {
        console.error("Error loading media file:", err);
        setError(err.message);
      });
  }, [fileName]);

  // --- Rendering Logic ---
  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>
  }

  // We still render the <img> tag while it's loading, but keep it invisible.
  // This allows the browser to fetch the image in the background.
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      {mediaSrc && (
        <img
          src={mediaSrc}
          // The onLoad event fires when the image is fully downloaded.
          onLoad={() => setIsImageLoaded(true)}
          alt="BETO Logo Loading Animation"
          style={{
            width: "300px",
            height: "222px",
            // Use opacity and transition for a smooth fade-in effect.
            // It will be invisible (opacity: 0) until isImageLoaded becomes true.
            opacity: isImageLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out'
          }}
        />
      )}
    </div>
  );
}

return {LoadingLogo};
```







# EnigmaViewer


```jsx



// Ensure 'dc' is available in the environment where this component runs.
const { useRef, useEffect, useState, useCallback } = dc;
const { h: preactH, render: preactRender } = dc.preact; // Assuming dc.preact is correctly set up

// WorldView Component
function EnigmaView(props) {
  // Default props
  const {
    initialUrl: propsInitialUrl = "https://www.youtube.com/watch?v=Leo3ZuXzleA",
    titleText: propsTitleText = "ENIGMA",
    descriptionText: propsDescriptionText = "Behold the spinning artifact, a relic of unknown origins, pulsing with a subtle energy. Its facets catch the light, hinting at untold stories and veiled truths. What secrets does it safeguard? What destiny does its perpetual motion foretell? Ponder its mystery. The code is all around us.",
    modelPath: propsModelPath = "_RESOURCES/GLB/b26.card.888.glb" // Default full relative path
  } = props || {};

  const canvasRef = useRef(null);
  const [engine, setEngine] = useState(null);
  const [scene, setScene] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const descriptionRef = useRef(null);
  const [isTextProcessed, setIsTextProcessed] = useState(false);

  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [LoadedOverlayComponent, setLoadedOverlayComponent] = useState(null);
  const overlayRef = useRef(null);

  // Internal state for dynamic content, initialized from props
  const [currentIframeUrl, setCurrentIframeUrl] = useState(propsInitialUrl);
  const [currentTitleText, setCurrentTitleText] = useState(propsTitleText);
  const [currentDescriptionText, setCurrentDescriptionText] = useState(propsDescriptionText);
  const [currentModelPath, setCurrentModelPath] = useState(propsModelPath);

  // useEffect hooks to update internal state if props change
  useEffect(() => { setCurrentIframeUrl(propsInitialUrl); }, [propsInitialUrl]);
  useEffect(() => { setCurrentTitleText(propsTitleText); }, [propsTitleText]);
  useEffect(() => {
    setCurrentDescriptionText(propsDescriptionText);
    setIsTextProcessed(false); 
    if (descriptionRef.current) { delete descriptionRef.current.dataset.originalText; }
  }, [propsDescriptionText]);
  
  useEffect(() => { 
    const oldModelPath = currentModelPath;
    setCurrentModelPath(propsModelPath);
    if (engine && oldModelPath !== propsModelPath) {
      if (isOverlayVisible) setIsOverlayVisible(false);
      setRefreshKey(k => k + 1);
    }
  }, [propsModelPath, engine, isOverlayVisible, currentModelPath]);


  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(document.querySelector(`script[src="${src}"]`));
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(script);
      script.onerror = (e) => {
        console.error(`Error loading script: ${src}`, e);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.body.appendChild(script);
    });
  };

  const initBabylon = async () => {
    if (!canvasRef.current || !window.BABYLON || !window.BABYLON.SceneLoader) {
      console.error("initBabylon: Pre-conditions not met.");
      return () => { console.log("Babylon initialization failed, no cleanup needed."); };
    }

    const babylonEngine = new window.BABYLON.Engine(
      canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true, antialias: true }
    );
    const babylonScene = new window.BABYLON.Scene(babylonEngine);
    const frameRate = 60; 

    const initialCameraBeta = Math.PI / 3.5;
    const finalCameraBeta = Math.PI / 2.5;
    const initialCameraRadius = 13;
    const finalCameraRadius = 10;

    const camera = new window.BABYLON.ArcRotateCamera(
      "Camera", -Math.PI / 2, initialCameraBeta, initialCameraRadius,
      window.BABYLON.Vector3.Zero(), babylonScene
    );
    camera.attachControl(canvasRef.current, true);
    camera.minZ = 0.1;
    camera.lowerRadiusLimit = Math.min(initialCameraRadius, finalCameraRadius);
    camera.upperRadiusLimit = Math.max(initialCameraRadius, finalCameraRadius)-2;
    camera.wheelPrecision = 50;

    const continuousCardZSpinSpeed = 0.008;
    let cardModelIntroSpinDone = false;

    babylonScene.clearColor = new window.BABYLON.Color4(0, 0, 0, 1);
    const environment = babylonScene.createDefaultEnvironment({
        createSkybox: false, 
        enableGroundShadow: false,
        createGround: false,
        environmentTexture: "https://assets.babylonjs.com/environments/studio.env", 
        skyboxTexture: undefined,
        groundTexture: undefined,
        cameraExposure: 1.0,
        cameraContrast: 1.0,
        toneMappingEnabled: true,
    });
    if (environment && environment.ground) environment.ground.dispose();
    if (environment && environment.skybox) environment.skybox.dispose();
    babylonScene.environmentIntensity = 1.2;

    const directionalLight = new window.BABYLON.DirectionalLight(
      "directionalLight", new window.BABYLON.Vector3(0.5, -1, 0.5), babylonScene
    );
    directionalLight.intensity = 1.5;
    directionalLight.diffuse = new window.BABYLON.Color3(1.0, 0.95, 0.9);

    // console.log(`[Babylon Init] Using model path: ${currentModelPath}`);

    let mainModelMesh = null;
    let cardPivot = null;
    let modelLoadResult = null;

    try {
      const assetUrl = dc.app.vault.adapter.getResourcePath(currentModelPath); 
      modelLoadResult = await window.BABYLON.SceneLoader.ImportMeshAsync(null, "", assetUrl, babylonScene);

      if (modelLoadResult.meshes && modelLoadResult.meshes.length > 0) {
        mainModelMesh = modelLoadResult.meshes.find(m => m.getTotalVertices() > 0 && m.name !== "__root__");
        if (!mainModelMesh) mainModelMesh = modelLoadResult.meshes[0];

        cardPivot = new window.BABYLON.TransformNode("cardPivot", babylonScene);
        mainModelMesh.parent = cardPivot;

        mainModelMesh.position = window.BABYLON.Vector3.Zero();
        mainModelMesh.rotation = window.BABYLON.Vector3.Zero();
        mainModelMesh.scaling = new window.BABYLON.Vector3(2.5, 3.5, 3.5);

        mainModelMesh.getChildMeshes(false).forEach(childMesh => { if (childMesh.material) childMesh.material.backFaceCulling = false; });
        if (mainModelMesh.material) mainModelMesh.material.backFaceCulling = false;
        
        cardPivot.rotation.x = -Math.PI / 2.22;
        
        const cardInitialYOffset = -25;
        const cardAnimationDurationSeconds = 2.5;
        const cardIntroSpins = 5;
        const cardTotalFrames = cardAnimationDurationSeconds * frameRate;

        cardPivot.position = new window.BABYLON.Vector3(0, cardInitialYOffset, 0);
        const animPivotPositionY = new window.BABYLON.Animation("pivotIntroPositionY", "position.y", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animPivotPositionY.setKeys([{ frame: 0, value: cardInitialYOffset }, { frame: cardTotalFrames, value: 0 }]);
        const animCardRotationZ = new window.BABYLON.Animation("cardIntroRotationZ", "rotation.z", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCardRotationZ.setKeys([{ frame: 0, value: 0 }, { frame: cardTotalFrames, value: Math.PI * 2 * cardIntroSpins }]);
        const cardEasingFunction = new window.BABYLON.CubicEase();
        cardEasingFunction.setEasingMode(window.BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        animPivotPositionY.setEasingFunction(cardEasingFunction);
        animCardRotationZ.setEasingFunction(cardEasingFunction);

        const cameraAnimationDurationSeconds = 1.8;
        const cameraTotalFrames = cameraAnimationDurationSeconds * frameRate;
        const animCameraBeta = new window.BABYLON.Animation("cameraRevealBeta", "beta", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCameraBeta.setKeys([{ frame: 0, value: initialCameraBeta }, { frame: cameraTotalFrames, value: finalCameraBeta }]);
        const animCameraRadius = new window.BABYLON.Animation("cameraRevealRadius", "radius", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCameraRadius.setKeys([{ frame: 0, value: initialCameraRadius }, { frame: cameraTotalFrames, value: finalCameraRadius }]);
        const cameraEasingFunction = new window.BABYLON.SineEase();
        cameraEasingFunction.setEasingMode(window.BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        animCameraBeta.setEasingFunction(cameraEasingFunction);
        animCameraRadius.setEasingFunction(cameraEasingFunction);

        babylonScene.beginDirectAnimation(cardPivot, [animPivotPositionY], 0, cardTotalFrames, false, 1, () => { cardPivot.position.y = 0; });
        babylonScene.beginDirectAnimation(mainModelMesh, [animCardRotationZ], 0, cardTotalFrames, false, 1, () => {
          mainModelMesh.rotation.z = (Math.PI * 2 * cardIntroSpins) % (Math.PI * 2);
          cardModelIntroSpinDone = true;
          babylonScene.beginDirectAnimation(camera, [animCameraBeta, animCameraRadius], 0, cameraTotalFrames, false, 1, () => {
            camera.beta = finalCameraBeta; camera.radius = finalCameraRadius; camera.lowerRadiusLimit = finalCameraRadius; camera.upperRadiusLimit = finalCameraRadius;
          });
        });
      } else {
        console.warn(`GLB loaded from "${currentModelPath}", but no meshes found in the result.`);
      }
    } catch (error) {
      console.error(`Error loading GLB model from "${currentModelPath}" or during animation setup:`, error);
    }

    setEngine(babylonEngine); setScene(babylonScene);
    babylonScene.onPointerDown = (evt, pickResult) => {
      if (evt.button === 0) {
        camera.lowerRadiusLimit = 1; camera.upperRadiusLimit = 11;
        const meshToFit = mainModelMesh || (modelLoadResult?.meshes && modelLoadResult.meshes[0]);
        if (pickResult && pickResult.hit && pickResult.pickedMesh && meshToFit && pickResult.pickedMesh.isDescendantOf(meshToFit.parent || meshToFit) ) {
          if (meshToFit.getBoundingInfo()) {
            const boundingInfo = meshToFit.getBoundingInfo();
            const modelVisualRadius = boundingInfo.boundingSphere.radiusWorld * Math.max(meshToFit.scaling.x, meshToFit.scaling.y, meshToFit.scaling.z);
            const desiredRadiusOnClick = modelVisualRadius * 3;
            const animZoomOnClick = new window.BABYLON.Animation("cameraZoomOnClick", "radius", frameRate, window.BABYLON.Animation.ANIMATIONTYPE_FLOAT, window.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            animZoomOnClick.setKeys([{ frame: 0, value: camera.radius }, { frame: 30, value: desiredRadiusOnClick } ]);
            const easing = new window.BABYLON.QuinticEase();
            easing.setEasingMode(window.BABYLON.EasingFunction.EASINGMODE_EASEOUT);
            animZoomOnClick.setEasingFunction(easing);
            camera.animations = camera.animations.filter(anim => anim.name !== "cameraZoomOnClick");
            camera.animations.push(animZoomOnClick);
            babylonScene.beginAnimation(camera, 0, 30, false);
          }
        }
      }
    };
    babylonEngine.runRenderLoop(() => {
      if (babylonScene && babylonScene.activeCamera && !babylonEngine.isDisposed) {
        if (cardModelIntroSpinDone && mainModelMesh) mainModelMesh.rotation.z += continuousCardZSpinSpeed;
        babylonScene.render();
      }
    });
    const resizeHandler = () => { if (babylonEngine && !babylonEngine.isDisposed) babylonEngine.resize(); };
    window.addEventListener("resize", resizeHandler);
    const canvasElement = canvasRef.current;
    const handleWheel = (e) => e.preventDefault();
    if (canvasElement) canvasElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (canvasElement) canvasElement.removeEventListener("wheel", handleWheel);
      if (babylonEngine) {
        babylonEngine.stopRenderLoop();
        if (camera && camera.animations) camera.animations = [];
        if (cardPivot) cardPivot.dispose();
        else if (mainModelMesh) mainModelMesh.dispose();
        if (babylonScene) babylonScene.dispose();
        babylonEngine.dispose();
      }
      setEngine(null); setScene(null); mainModelMesh = null; cardPivot = null; modelLoadResult = null; cardModelIntroSpinDone = false;
    };
  };

  useEffect(() => {
    let cleanupBabylonFunc = () => {};
    const loadedScripts = [];
    const setupEnvironment = async () => {
      try {
        if (!window.BABYLON || !window.BABYLON.SceneLoader) {
            loadedScripts.push(await loadScript("https://cdn.babylonjs.com/babylon.js"));
            loadedScripts.push(await loadScript("https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"));
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        if (canvasRef.current && window.BABYLON && window.BABYLON.SceneLoader) {
            if (engine && typeof cleanupBabylonFunc === 'function') { 
                cleanupBabylonFunc();
            }
            cleanupBabylonFunc = await initBabylon();
        } else if (!window.BABYLON || !window.BABYLON.SceneLoader) {
            console.error("Babylon.js or SceneLoader is not available after script loading attempts.");
        }
      } catch (error) { console.error("Failed to setup Babylon environment:", error); }
    };
    setupEnvironment();
    return () => {
      if (typeof cleanupBabylonFunc === 'function') {
        cleanupBabylonFunc();
      }
      loadedScripts.forEach(script => {
        if (script && script.parentElement && document.body.contains(script)) {
            document.body.removeChild(script);
        }
      });
    };
  }, [refreshKey]); // Only refreshKey drives full re-init. initBabylon uses currentModelPath from state.

  useEffect(() => {
    if (descriptionRef.current && !isTextProcessed && currentDescriptionText) {
      const pElement = descriptionRef.current;
      pElement.innerHTML = ''; 
      const characters = currentDescriptionText.split('');
      characters.forEach((char, index) => {
        if (char === '\n') pElement.appendChild(document.createElement('br'));
        else if (char === ' ') pElement.appendChild(document.createTextNode(' '));
        else if (char.trim() !== '') { 
          const span = document.createElement('span'); span.textContent = char;
          const baseDelay = index*0.05; const rDelay=(Math.random()-0.5)*0.08; span.style.animationDelay = `${Math.max(0, baseDelay + rDelay)}s`;
          const baseDur=3.0; const rDur=(Math.random()-0.5)*0.6; span.style.animationDuration = `${Math.max(1.8, baseDur + rDur)}s`;
          span.className = 'animated-letter'; pElement.appendChild(span);
        } else pElement.appendChild(document.createTextNode(char));
      });
      setIsTextProcessed(true); 
    } else if (!currentDescriptionText && descriptionRef.current) {
        descriptionRef.current.innerHTML = '';
        setIsTextProcessed(true);
    }
  }, [currentDescriptionText, isTextProcessed]);

  const loadOverlayComponent = async () => {
    if (LoadedOverlayComponent) return LoadedOverlayComponent;
    try {
      const filePath = "IframeDisplay.component.v2.md"; 
      const header = "ViewComponent";
      const functionName = "View";      
      const dynamicModule = await dc.require(dc.headerLink(filePath, header));
      if (!dynamicModule || !dynamicModule[functionName]) {
        console.error(`Component '${functionName}' not found in module from '${filePath}' with header '${header}'.`);
        return null;
      }
      const LoadedComp = dynamicModule[functionName];
      setLoadedOverlayComponent(() => LoadedComp);
      return LoadedComp;
    } catch (error) {
      console.error(`Error loading IframeDisplay component from '${filePath}':`, error);
      return null;
    }
  };
  
  const handleNaruButtonClick = async () => {
    const comp = LoadedOverlayComponent || await loadOverlayComponent();
    if (comp) {
        setIsOverlayVisible(true);
    } else {
        alert("Failed to load overlay content.");
    }
  };

  const closeOverlay = () => setIsOverlayVisible(false);

  // Palette
  const pAccent = '#C77DF2'; 
  const pAccentRgba = (alpha) => `rgba(199, 125, 242, ${alpha})`;
  const pText = '#DAB3F9'; 
  const pTextRgba = (alpha) => `rgba(218, 179, 249, ${alpha})`;
  const pDark = '#5E2A72'; 
  const pDarkRgba = (alpha) => `rgba(94, 42, 114, ${alpha})`;
  const pVeryDarkBg = '#2D1336'; 
  const pTextBoxBg = 'rgba(45, 20, 55, 0.93)'; 
  const pPulseHighlight = '#E6C3FC'; 
  const pPulseHighlightRgba = (alpha) => `rgba(230, 195, 252, ${alpha})`;
  const pInitialLetterColor = '#FFFFFF';
  const pIntermediateColor1 = '#F0E6F7'; 
  const pIntermediateColor2 = '#E0C9FA'; 

  const cssStyles = `
    .refresh-button { background-color: ${pVeryDarkBg}; transition: background-color 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease; box-sizing: border-box; border: 1px solid ${pAccent}; color: ${pAccent}; position:absolute; top:10px; right:10px; z-index: 10; width:44px; height:44px; border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; outline:none; }
    .refresh-button:hover { background-color: ${pDark}; transform: scale(1.05); box-shadow: 0 0 10px ${pAccent}, 0 0 5px ${pAccent} inset; }
    .refresh-button:active { transform: scale(0.95); box-shadow: 0 0 5px ${pAccent}, 0 0 2px ${pAccent} inset; }
    .text-content-box { width: 100%; max-width: 800px; padding: 20px; margin-top: 30px; background-color: ${pTextBoxBg}; border-radius: 8px; box-sizing: border-box; border: 1px solid ${pDarkRgba(0.8)}; box-shadow: 0 0 25px ${pAccentRgba(0.25)}, 0 0 15px ${pDarkRgba(0.6)} inset; position: relative; overflow: hidden; }
    .text-content-box::before { content: ""; position: absolute; top: -10%; left: -10%; width: 120%; height: 120%; background-image: repeating-linear-gradient(0deg, transparent, transparent 1px, ${pAccentRgba(0.03)} 1px, ${pAccentRgba(0.03)} 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, ${pAccentRgba(0.02)} 1px, ${pAccentRgba(0.02)} 2px); background-size: 3px 3px; opacity: 0.5; animation: matrixGridJitter 0.15s steps(1) infinite; pointer-events: none; z-index: 0; }
    @keyframes matrixGridJitter { 0%{transform:translate(0px,0px);} 20%{transform:translate(-1px,1px);} 40%{transform:translate(1px,-1px);} 60%{transform:translate(-1px,-1px);} 80%{transform:translate(1px,1px);} 100%{transform:translate(0px,0px);} }
    .enigma-title { margin-top: 0; margin-bottom: 20px; color: ${pAccent}; font-size: 2.2em; text-align: center; font-weight: normal; font-family: 'Courier New', Courier, monospace; text-shadow: 0 0 8px ${pAccent}, 0 0 12px ${pAccentRgba(0.7)}, 0 0 1px transparent; position: relative; z-index: 1; animation: titlePulsePurple 3s ease-in-out infinite; }
    @keyframes titlePulsePurple { 0%,100%{text-shadow:0 0 8px ${pAccent},0 0 12px ${pAccentRgba(0.7)};opacity:1;} 50%{text-shadow:0 0 12px ${pPulseHighlight},0 0 18px ${pPulseHighlightRgba(0.6)};opacity:0.8;} }
    .enigma-description { margin-bottom:0; line-height:1.6; font-size:1.1em; text-align:justify; color:${pInitialLetterColor}; font-family:'Courier New',Courier,monospace; position:relative; z-index:1; overflow-wrap:break-word; word-wrap:break-word; min-height: 1.6em; }
    .enigma-description .animated-letter { animation-name:letterColorShift; animation-timing-function:linear; animation-iteration-count:infinite; }
    @keyframes letterColorShift { 0%,100%{color:${pInitialLetterColor};text-shadow:none;} 12%{color:${pIntermediateColor1};} 25%{color:${pIntermediateColor2};} 40%{color:${pText};text-shadow:0 0 3px ${pTextRgba(0.5)};} 60%{color:${pAccent};text-shadow:0 0 5px ${pAccentRgba(0.7)};} 75%{color:${pText};text-shadow:0 0 3px ${pTextRgba(0.5)};} 88%{color:${pIntermediateColor2};} }
    .naru-button { position:absolute; top:15px; right:15px; padding:8px 15px; background-color:${pDark}; color:${pAccent}; border:1px solid ${pAccent}; border-radius:5px; font-family:'Courier New',Courier,monospace; font-size:0.9em; font-weight:bold; cursor:pointer; transition:background-color 0.3s ease,transform 0.1s ease; z-index:2; }
    .naru-button:hover { background-color:${pVeryDarkBg}; transform:scale(1.05); }
    .naru-button:active { transform:scale(0.95); }
    .scene-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(10, 5, 15, 0.95); z-index: 20; transform: translateY(100%); transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1); overflow: hidden; display: flex; flex-direction: column; align-items: stretch; justify-content: stretch; pointer-events: none; }
    .scene-overlay.visible { transform: translateY(0%); pointer-events: auto; }
    .scene-overlay-close-button { position: absolute; top: 10px; right: 10px; padding: 0; background-color: ${pDarkRgba(0.8)}; color: ${pAccent}; border: 1px solid ${pAccentRgba(0.7)}; border-radius: 50%; font-family: 'Courier New', Courier, monospace; font-size: 1.2em; font-weight: bold; cursor: pointer; transition: background-color 0.3s ease; z-index: 21; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; line-height: 1; box-sizing: border-box; }
    .scene-overlay-close-button:hover { background-color: ${pVeryDarkBg}; }
    .scene-overlay .iframe-display-view { flex-grow: 1; border: none; width: 100%; height: 100%; }
  `;
  
  return preactH("div", {
      style: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", background: "#050505" }
    },
    preactH("style", null, cssStyles),
    preactH("div", {
        style: { position: "relative", width: "100%", maxWidth: "800px", height: "500px", overflow: "hidden", padding: "10px", borderRadius: "8px" }
      },
      preactH("canvas", { ref: canvasRef, style: { width: "100%", height: "100%", display: "block" } }),
      preactH("div", { ref: overlayRef, className: `scene-overlay ${isOverlayVisible ? 'visible' : ''}`},
        isOverlayVisible && LoadedOverlayComponent && preactH(LoadedOverlayComponent, { initialUrl: currentIframeUrl }), // Use currentIframeUrl
        isOverlayVisible && preactH("button", { className: "scene-overlay-close-button", onClick: closeOverlay, title: "Close View" }, "✕")
      ),
      preactH("button", { onClick: () => { if (isOverlayVisible) setIsOverlayVisible(false); setRefreshKey(prevKey => prevKey + 1); }, className: "refresh-button", "aria-label": "Refresh Scene", title: "Refresh Scene" },
        preactH("svg", { xmlns:"http://www.w3.org/2000/svg", width:"24", height:"24", viewBox:"0 0 24 24", fill:"currentColor" },
          preactH("path", { d:"M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" })
        )
      )
    ),
    preactH("div", { className: "text-content-box" },
      preactH("button", { className: "naru-button", onClick: handleNaruButtonClick }, "NARU"),
      preactH("h2", { className: "enigma-title" }, currentTitleText), // Use currentTitleText
      preactH("p", { className: "enigma-description", ref: descriptionRef }, 
        !isTextProcessed && currentDescriptionText ? currentDescriptionText : "" // Use currentDescriptionText
      )
    )
  );
}

return { EnigmaView };
```