





# ViewComponent

```jsx
// Import the required modules/components.
const componentFile = dc.resolvePath("D.q.contentexplorer888.component")

const { View } = await dc.require(dc.headerLink(componentFile, "CustomFeed")
);
const { ViewBounty } = await dc.require(dc.headerLink(componentFile, "ViewComponentBounty")
);

/**
 * ContentExplorer Component
 *
 * This component acts as a controller.
 * Initially displays the ViewBounty component. When ViewBounty passes a file name,
 * it switches to rendering the View component (iframe player) with that file name.
 */
function ContentExplorer() { // Renamed from MainController
  const { useState } = dc;
  // Holds the file name selected from ViewBounty.
  const [selectedFile, setSelectedFile] = useState(null);
  // Keeps the modified file name for passing back to ViewBounty.
  const [lastFile, setLastFile] = useState(null);

  // Handler for back button click - like FitnessExplorer
  function handleBackClick() {
    // Update lastFile with the modified file name
    setLastFile(`${selectedFile}.namzu`);
    // Switch back to bounty view by clearing selectedFile.
    setSelectedFile(null);
  }

  // When a file is selected, render the View component (iframe player)
  // Pass onBack callback and backLabel - like FitnessExplorer
  if (selectedFile) {
    return <View title={selectedFile} spawnType="fullTab" onBack={handleBackClick} backLabel={selectedFile} />;
  }

  // Otherwise, render the ViewBounty component and pass:
  // - onFileSelect: to set the selected file.
  // - file: the modified file name from the previous selection (if any).
  return <ViewBounty onFileSelect={setSelectedFile} file={lastFile} /> ;
}

// Export the ContentExplorer component within an object as requested.
return { ContentExplorer };
```






	

# ViewComponentBounty

```jsx
////////////////////////////////////////////////////
///       Future Proof Radial Header View         ///
////////////////////////////////////////////////////

const componentFile = dc.resolvePath("D.q.contentexplorer888.component");
const { useState, useMemo, useRef, useEffect } = dc;
const centerHeader = "888.namzu";

// ---------------------------------------------------------------------
// DOM Traversal Utilities (from BasicView v2)
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// 1) parseHeaderName
// ---------------------------------------------------------------------
function parseHeaderName(str) {
  let cleaned = str.replace(/\[\[|\]\]/g, "").trim();
  if (cleaned.includes("|")) {
    cleaned = cleaned.split("|").pop().trim();
  }
  return cleaned;
}

// ---------------------------------------------------------------------
// angleDiff – compute the difference between two angles (in radians)
// ---------------------------------------------------------------------
function angleDiff(a, b) {
  let diff = a - b;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  return diff;
}

// ---------------------------------------------------------------------
// Helper: ringDistance – Euclidean distance between points on two circles
// with radii r2 and r3 at angles a and c respectively.
// ---------------------------------------------------------------------
function ringDistance(a, c, r2, r3) {
  const diff = a - c;
  return Math.sqrt(r2 * r2 + r3 * r3 - 2 * r2 * r3 * Math.cos(diff));
}

// ---------------------------------------------------------------------
// Helper: pickBestSlot – given a set of available angles (slots) and a target angle,
// pick the slot that is closest (in absolute angular difference).
// ---------------------------------------------------------------------
function pickClosestSlot(availableSlots, targetAngle) {
  let bestSlot = availableSlots[0];
  let bestDiff = Math.abs(angleDiff(bestSlot, targetAngle));
  for (let i = 1; i < availableSlots.length; i++) {
    const d = Math.abs(angleDiff(availableSlots[i], targetAngle));
    if (d < bestDiff) {
      bestSlot = availableSlots[i];
      bestDiff = d;
    }
  }
  return bestSlot;
}

// ---------------------------------------------------------------------
// Assume GetImagesPlaceholders is defined elsewhere
// ---------------------------------------------------------------------
const { GetImagesPlaceholders } = await dc.require(
  dc.headerLink(componentFile, "ImagesPlaceholder")
);

// ---------------------------------------------------------------------
// 2) CenterNode Component
// ---------------------------------------------------------------------
function CenterNode({ centerLabel, onMiddleClick, circleRadius, placeholderMarkdown }) {
  const iconName = parseHeaderName(centerLabel).replace(".namzu", "");
  const textPathRadius = circleRadius * 1.2;
  const imageSize = circleRadius * 1.33;
  const pathId = `center-title-path-${circleRadius}`;

  return (
    <g onClick={onMiddleClick} style={{ cursor: "pointer" }}>
      <defs>
        <path
          id={pathId}
          d={`M ${-textPathRadius},0 
             A ${textPathRadius},${textPathRadius} 0 1,1 ${textPathRadius},0 
             A ${textPathRadius},${textPathRadius} 0 1,1 ${-textPathRadius},0`}
          fill="none"
        />
      </defs>
      <circle r={circleRadius} fill="#000" />
      <GetImagesPlaceholders
        iconName={iconName}
        size={imageSize}
        x={-imageSize / 2}
        y={-imageSize / 2}
        fallbackMarkdown={placeholderMarkdown}
      />
      <g style={{ animation: "rotateThis 8s linear infinite" }}>
        <text
          fill="white"
          fontSize={Math.max(10, circleRadius / 1.5)}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          <textPath xlinkHref={`#${pathId}`} startOffset="50%">
            {iconName}
          </textPath>
        </text>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------
// 3) OuterNode for ring2 – uniform sizing for all nodes
// ---------------------------------------------------------------------
function OuterNode({
  header,
  onCenterClick,
  nodeRadius = 22,
  hoverScale = 1.6,
  placeholderMarkdown,
  onHover = () => {},
  onHoverEnd = () => {},
}) {
  const [isHovered, setIsHovered] = useState(false);
  const label = parseHeaderName(header);
  const newCenter = label.endsWith(".namzu") ? label : `${label}.namzu`;
  const pathId = `node-path-${label.replace(/\s+/g, "")}-${nodeRadius}`;
  const scaleFactor = isHovered ? hoverScale : 1.0;

  const nodeContent = (
    <g transform={`scale(${scaleFactor})`}>
      <defs>
        <path
          id={pathId}
          d={`
            M 0 -${nodeRadius}
            a ${nodeRadius},${nodeRadius} 0 1,1 0,${2 * nodeRadius} 
            a ${nodeRadius},${nodeRadius} 0 1,1 0,-${2 * nodeRadius}`}
          fill="none"
        />
      </defs>
      <circle r={nodeRadius} fill="#000" />
      <GetImagesPlaceholders
        iconName={label}
        size={nodeRadius * 1.4}
        x={-nodeRadius * 0.7}
        y={-nodeRadius * 0.7}
        fallbackMarkdown={placeholderMarkdown}
      />
      <g style={{ animation: "rotateThis 8s linear infinite" }}>
        <text
          fill="white"
          fontSize={Math.max(10, nodeRadius / 2)}
          fontWeight="bold"
          textAnchor="middle"
        >
          <textPath xlinkHref={`#${pathId}`} startOffset="50%">
            {label}
          </textPath>
        </text>
      </g>
    </g>
  );

  return (
    <g
      style={{ cursor: "pointer", transform: `scale(${scaleFactor})` }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverEnd();
      }}
      onClick={() => onCenterClick(newCenter)}
    >
      {nodeContent}
    </g>
  );
}

// ---------------------------------------------------------------------
// 3a) OuterNodeRing3 for ring3 – dynamic sizing + label shrinking
// ---------------------------------------------------------------------
function OuterNodeRing3({
  header,
  angle, // node's angle in radians
  onCenterClick,
  nodeRadius = 18,
  hoverScale = 1.4,
  placeholderMarkdown,
  onHover = () => {},
  onHoverEnd = () => {},
  leftTopPadding = -2,  // optional, in pixels
  rightTopPadding = 4, // optional, in pixels
}) {
  const [isHovered, setIsHovered] = useState(false);
  const label = parseHeaderName(header);
  const newCenter = label.endsWith(".namzu") ? label : `${label}.namzu`;
  const scaleFactor = isHovered ? hoverScale : 1;

  // Determine if node is on the left half.
  const shouldFlip = angle !== undefined && Math.cos(angle) < 0;
  
  // For right-side nodes, use a minimal fixed offset.
  const rightOffset = nodeRadius + 2;
  // For left-side nodes, extra margin is now 2.5 * nodeRadius.
  const leftExtraMargin = -2.5 * nodeRadius;
  const leftOffset = -(nodeRadius + leftExtraMargin);
  
  // Choose offset based on side.
  const xOffset = shouldFlip ? leftOffset : rightOffset;
  const textAnchor = shouldFlip ? "end" : "start";
  const transformTextBase = shouldFlip ? `rotate(180, ${xOffset}, 0)` : "";
  
  // Use provided top padding for left/right if given; otherwise default to -0.2 * nodeRadius.
  const defaultTopPadding = -0.2 * nodeRadius;
  const chosenTopPadding = shouldFlip
    ? (typeof leftTopPadding === "number" ? leftTopPadding : defaultTopPadding)
    : (typeof rightTopPadding === "number" ? rightTopPadding : defaultTopPadding);
  
  const transformText = `translate(0, ${chosenTopPadding}) ${transformTextBase}`.trim();

  const defaultFontSize = Math.max(10, nodeRadius / 2);
  const [computedFontSize, setComputedFontSize] = useState(defaultFontSize);
  const textRef = useRef(null);
  const maxLabelWidth = 100;

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      if (bbox.width > maxLabelWidth && computedFontSize > 5) {
        const newSize = computedFontSize * (maxLabelWidth / bbox.width);
        if (Math.abs(newSize - computedFontSize) > 0.5) {
          setComputedFontSize(newSize);
        }
      }
    }
  }, [label, computedFontSize, maxLabelWidth]);

  const hasDot = label.includes(".");
  let firstPart = label;
  let secondPart = "";
  if (hasDot) {
    const parts = label.split(".");
    firstPart = parts[0];
    secondPart = "." + parts.slice(1).join(".");
  }

  // Cancel parent's rotation for the image
  const cancellationDeg = angle ? (angle * 180) / Math.PI : 0;

  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverEnd();
      }}
      onClick={() => onCenterClick(newCenter)}
    >
      {/* Image group: cancel parent's rotation so image stays upright */}
      <g transform={`scale(${scaleFactor}) rotate(${-cancellationDeg})`}>
        <circle r={nodeRadius} fill="#000" />
        <GetImagesPlaceholders
          iconName={label}
          size={nodeRadius * 1.3}
          x={-nodeRadius * 0.65}
          y={-nodeRadius * 0.65}
          fallbackMarkdown={placeholderMarkdown}
        />
      </g>
      {/* Text: remains rotated by parent's context, with adjustable top padding */}
      <text
        ref={textRef}
        x={xOffset}
        y={0}
        textAnchor={textAnchor}
        alignmentBaseline="middle"
        fill="white"
        fontSize={computedFontSize}
        transform={transformText}
        xmlSpace="preserve"
      >
        <tspan>{firstPart}</tspan>
        {hasDot && (
          <tspan fontSize={computedFontSize * 0.7} dx="2">
            {secondPart}
          </tspan>
        )}
      </text>
    </g>
  );
}



// ---------------------------------------------------------------------
// 4) RadialHeaderView – ring2 assignment with fixed slots (doubled if <5 groups)
// ---------------------------------------------------------------------
function RadialHeaderView({
  centerLabel = centerHeader,
  secondRingData = [],
  width = 600,
  height = 600,
  backgroundColor = "#333",
  onCenterClick,
  onMiddleClick,
  placeholderMarkdown,
}) {
  // Basic geometry for the center node
  const minDim = Math.min(width, height);
  const centerRadius = Math.max(20, minDim * 0.06);
  const centerX = 0;
  const centerY = 0;

  // ---------- Ring2 Setup ----------
  const totalGroups = secondRingData.length;
  const baseRing2NodeRadius = Math.max(10, minDim * 0.05);
  const ring2Radius = 0.33 * (minDim / 2);
  const ring2HoverScale = 1.2;
  
  // If totalGroups is less than 5, double the available slots
  let slotsCount = totalGroups;
  if (totalGroups < 5) {
    slotsCount = 2 * totalGroups;
  }
  let availableSlots = [];
  for (let i = 0; i < slotsCount; i++) {
    availableSlots.push((2 * Math.PI * (i + 0.5)) / slotsCount);
  }

  // Compute uniform ring2 node size
  const desiredPixelGap2 = 10;
  const arcLengthPerNode = (2 * Math.PI * ring2Radius) / totalGroups;
  const uniformRing2NodeRadius = Math.min(
    baseRing2NodeRadius,
    (arcLengthPerNode - desiredPixelGap2) / 2
  );

  // ---------- Ring3 Setup ----------
  let allRing3Nodes = [];
  secondRingData.forEach((group, groupIndex) => {
    if (group.children && group.children.length > 0) {
      group.children.forEach((childLabel) => {
        allRing3Nodes.push({ groupIndex, label: childLabel });
      });
    }
  });
  const totalRing3Nodes = allRing3Nodes.length;
  const ring3Radius = 0.6 * (minDim / 2);
  const baseRing3NodeRadius = Math.max(2, minDim * 0.04);
  const ring3HoverScale = 2.2;
  const desiredPixelGap = 10;
  const gapAngle = totalRing3Nodes > 0 ? (2 * Math.PI) / totalRing3Nodes : 0;
  const gapLength = gapAngle * ring3Radius;
  const requiredLength = 2 * baseRing3NodeRadius + desiredPixelGap;
  const scaleFactorRing3 = gapLength < requiredLength ? gapLength / requiredLength : 1;
  const effectiveRing3NodeRadius = baseRing3NodeRadius * scaleFactorRing3;

  // Place ring3 nodes uniformly
  const globalRing3Positions = allRing3Nodes.map((node, idx) => {
    const angle = (2 * Math.PI * (idx + 0.5)) / totalRing3Nodes;
    return { ...node, angle };
  });

  // ---------- Assign Ring2 Angles ----------
  // Process groups with children first
  let groupAssignedAngles = new Array(totalGroups).fill(null);
  let groupsWithChildren = [];
  let groupsWithoutChildren = [];
  secondRingData.forEach((group, i) => {
    if (group.children && group.children.length > 0) {
      groupsWithChildren.push(i);
    } else {
      groupsWithoutChildren.push(i);
    }
  });

  // For groups with children: compute average ring3 angle and pick closest available slot
  groupsWithChildren.forEach((groupIndex) => {
    const childAngles = globalRing3Positions
      .filter((n) => n.groupIndex === groupIndex)
      .map((n) => n.angle);
    const avgAngle = childAngles.reduce((acc, cur) => acc + cur, 0) / childAngles.length;
    const chosen = pickClosestSlot(availableSlots, avgAngle);
    groupAssignedAngles[groupIndex] = chosen;
    availableSlots = availableSlots.filter((slot) => slot !== chosen);
  });
  // For groups without children: assign any remaining slot
  groupsWithoutChildren.forEach((groupIndex) => {
    if (availableSlots.length > 0) {
      groupAssignedAngles[groupIndex] = availableSlots.shift();
    } else {
      groupAssignedAngles[groupIndex] = 0;
    }
  });

  // ---------- Compute ring2 positions and lines ----------
  const ring2Positions = secondRingData.map((group, i) => {
    const angle = groupAssignedAngles[i] ?? 0;
    return {
      x: centerX + ring2Radius * Math.cos(angle),
      y: centerY + ring2Radius * Math.sin(angle),
      angle,
      heading: group.heading,
      nodeRadius: uniformRing2NodeRadius,
      groupIndex: i,
    };
  });
  const ring2Lines = ring2Positions.map((pos) => ({
    x1: centerX,
    y1: centerY,
    x2: pos.x,
    y2: pos.y,
  }));

  // ---------- Compute ring3 positions and lines ----------
  const ring3Positions = globalRing3Positions.map((node) => {
    const angle = node.angle;
    const x = centerX + ring3Radius * Math.cos(angle);
    const y = centerY + ring3Radius * Math.sin(angle);
    const parent = ring2Positions.find((p) => p.groupIndex === node.groupIndex);
    return { x, y, angle, label: node.label, nodeRadius: effectiveRing3NodeRadius, parent };
  });
  const ring3Lines = ring3Positions.map((pos) => ({
    x1: pos.parent.x,
    y1: pos.parent.y,
    x2: pos.x,
    y2: pos.y,
  }));

  // ---------- Compute SVG viewBox ----------
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const pad = 55;
  function updateBounds(x, y, r) {
    if (x - r < minX) minX = x - r;
    if (x + r > maxX) maxX = x + r;
    if (y - r < minY) minY = y - r;
    if (y + r > maxY) maxY = y + r;
  }
  updateBounds(centerX, centerY, centerRadius);
  ring2Positions.forEach((p) => {
    updateBounds(p.x, p.y, uniformRing2NodeRadius * ring2HoverScale);
  });
  ring3Positions.forEach((p) => {
    updateBounds(p.x, p.y, (p.nodeRadius || baseRing3NodeRadius) * ring3HoverScale + 30);
  });
  const finalWidth = maxX - minX;
  const finalHeight = maxY - minY;
  const viewBox = [
    minX - pad,
    minY - pad,
    finalWidth + 2 * pad,
    finalHeight + 2 * pad,
  ].join(" ");

  // ---------- Render ----------
  const ring2LineEls = ring2Lines.map((ln, idx) => (
    <line
      key={`r2-line-${idx}`}
      x1={ln.x1}
      y1={ln.y1}
      x2={ln.x2}
      y2={ln.y2}
      stroke="white"
      strokeWidth="1.2"
    />
  ));
  const ring3LineEls = ring3Lines.map((ln, idx) => (
    <line
      key={`r3-line-${idx}`}
      x1={ln.x1}
      y1={ln.y1}
      x2={ln.x2}
      y2={ln.y2}
      stroke="white"
      strokeWidth="0.8"
    />
  ));
  const ring2NodeEls = ring2Positions.map((pos, idx) => (
    <g key={`r2-node-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
      <OuterNode
        header={pos.heading}
        nodeRadius={pos.nodeRadius}
        hoverScale={ring2HoverScale}
        placeholderMarkdown={placeholderMarkdown}
        onCenterClick={onCenterClick}
      />
    </g>
  ));
  const ring3NodeEls = ring3Positions.map((pos, idx) => {
    const deg = (pos.angle * 180) / Math.PI;
    return (
      <g key={`r3-node-${idx}`} transform={`translate(${pos.x}, ${pos.y}) rotate(${deg})`}>
        <OuterNodeRing3
          header={pos.label}
          angle={pos.angle}
          nodeRadius={pos.nodeRadius}
          hoverScale={ring3HoverScale}
          placeholderMarkdown={placeholderMarkdown}
          onCenterClick={onCenterClick}
        />
      </g>
    );
  });

  return (
    <dc.Stack style={{ padding: "10px" }}>
      <svg
        width={width}
        height={height}
        style={{
          backgroundColor,
          border: "1px solid var(--background-modifier-border)",
        }}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <style>{`
            @keyframes rotateThis {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </defs>
        {/* Lines from center to ring2 */}
        <g>{ring2LineEls}</g>
        {/* Lines from ring2 to ring3 */}
        <g>{ring3LineEls}</g>
        {/* Ring2 nodes */}
        <g>{ring2NodeEls}</g>
        {/* Ring3 nodes */}
        <g>{ring3NodeEls}</g>
        {/* Center node */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          <CenterNode
            centerLabel={centerLabel}
            circleRadius={centerRadius}
            onMiddleClick={onMiddleClick}
            placeholderMarkdown={placeholderMarkdown}
          />
        </g>
      </svg>
    </dc.Stack>
  );
}

// ---------------------------------------------------------------------
// 5) ResponsiveRadialHeaderView (Wrapper)
// ---------------------------------------------------------------------
function ResponsiveRadialHeaderView({
  centerLabel,
  secondRingData = [],
  placeholderMarkdown,
  backgroundColor,
  onCenterClick,
  onMiddleClick,
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        if (newHeight < 10) {
          setTimeout(() => {
            if (containerRef.current) {
              const delayedWidth = containerRef.current.clientWidth;
              const delayedHeight = containerRef.current.clientHeight;
              if (delayedHeight >= 10) {
                setDimensions({ width: delayedWidth, height: delayedHeight });
              }
            }
          }, 300);
        } else {
          setDimensions({ width: newWidth, height: newHeight });
        }
      }
    }
    updateDimensions();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateDimensions);
      if (containerRef.current) observer.observe(containerRef.current);
    } else {
      window.addEventListener("resize", updateDimensions);
    }
    return () => {
      if (observer && containerRef.current) observer.unobserve(containerRef.current);
      else window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  useEffect(() => {
    function handleFocus() {
      setRefreshKey((prev) => prev + 1);
    }
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <RadialHeaderView
        key={refreshKey}
        centerLabel={centerLabel}
        secondRingData={secondRingData}
        placeholderMarkdown={placeholderMarkdown}
        backgroundColor={backgroundColor}
        onCenterClick={onCenterClick}
        onMiddleClick={onMiddleClick}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// 6) AutoRadialNamzuView (Parent) – file query + navigation
// ---------------------------------------------------------------------
function AutoRadialNamzuView({ centerLabel = centerHeader, ignoreFirstHeader = true, onFileSelect, showViewButton = true, spawnType = "fullTab" }) {
  const [currentCenter, setCurrentCenter] = useState(centerLabel);
  const [centerHistory, setCenterHistory] = useState([]);
  
  // Parse spawnType for full-tab mode
  const lowerSpawnType = (spawnType || "").toLowerCase();
  const isDisabled = lowerSpawnType === "disabled" || lowerSpawnType === "disable";
  const isLocked = lowerSpawnType.includes(".locked");
  const baseSpawnType = lowerSpawnType.replace(".locked", "");
  const showFullTabToggle = !isLocked && !isDisabled;
  const initialFullTab = !isDisabled && baseSpawnType === "fulltab";
  
  // Full-tab mode state
  const [isFullTab, setIsFullTab] = useState(initialFullTab);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  
  // Full-tab DOM manipulation effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    
    const targetPaneContent = findNearestAncestorWithClass(
      container,
      "workspace-leaf-content"
    );
    if (!targetPaneContent) return;
    
    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;
    
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
      overflow: "auto",
    });
    
    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(
          container,
          stateRefs.placeholder
        );
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static"
            ? ""
            : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  const queryString = useMemo(
    () => `@page and endswith($path, "${currentCenter}.md")`,
    [currentCenter]
  );
  const data = dc.useQuery(queryString);
  const file = useMemo(() => (data && data.length > 0 ? data[0] : null), [data]);

  // Navigation handlers
  function handleCenterClick(newCenter) {
    if (newCenter !== currentCenter) {
      setCenterHistory((prev) => [...prev, currentCenter]);
      setCurrentCenter(newCenter);
    }
  }
  function handleMiddleClick() {
    if (centerHistory.length > 0) {
      const newHistory = [...centerHistory];
      const previousCenter = newHistory.pop();
      setCenterHistory(newHistory);
      setCurrentCenter(previousCenter);
    }
  }
  function handleHomeClick() {
    setCenterHistory([]);
    setCurrentCenter(centerLabel);
  }
  function convertNameToEnigmas(name) {
    return name.replace(/\.namzu$/, ".enigmas");
  }
  function handleTiktokFeedClick() {
    if (onFileSelect) {
      onFileSelect(convertNameToEnigmas(currentCenter));
    }
  }

  // Control buttons that always appear
  const controls = (
    <>
      <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10, display: "flex", gap: "10px" }}>
        <button
          style={{ 
            padding: "8px 12px", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
          onClick={handleHomeClick}
        >
          <dc.Icon icon="home" style={{ fontSize: "14px" }} />
          Home
        </button>
        {showViewButton && (
          <button
            style={{ 
              padding: "8px 12px", 
              border: "none", 
              borderRadius: "4px", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            onClick={handleTiktokFeedClick}
          >
            <dc.Icon icon="eye" style={{ fontSize: "14px" }} />
            View
          </button>
        )}
      </div>
      {showFullTabToggle && (
        <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}>
          <button
            style={{ 
              padding: "8px", 
              border: "none", 
              borderRadius: "4px", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => setIsFullTab(!isFullTab)}
            title={isFullTab ? "Exit full-tab mode" : "Enter full-tab mode"}
          >
            <dc.Icon icon={isFullTab ? "minimize-2" : "maximize-2"} style={{ fontSize: "14px" }} />
          </button>
        </div>
      )}
    </>
  );

  // If no file is found, render the radial view with an empty second ring.
  // This displays only the center node with its spinning header.
  if (!file) {
    return (
      <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        {controls}
        <ResponsiveRadialHeaderView
          centerLabel={currentCenter}
          secondRingData={[]}  // No ring2 or ring3 nodes.
          placeholderMarkdown="![[beto.group.svg]]"
          backgroundColor="#000"
          onCenterClick={handleCenterClick}
          onMiddleClick={handleMiddleClick}
        />
      </div>
    );
  }

  // --- Helper functions to extract headers ---
  function extractHeaders(fileItem) {
    let headers = [];
    if (fileItem.$sections && fileItem.$sections.length > 0) {
      fileItem.$sections.forEach((section) => {
        if (section.$title) {
          headers.push({ title: section.$title, level: section.$level || 1 });
        }
      });
    }
    return headers;
  }
  function extractHeadersFromRaw(fileItem) {
    const raw = fileItem.content || fileItem.$content || "";
    const regex = /^#{6}\s*(.*)$/gm;
    const headers = [];
    let match;
    while ((match = regex.exec(raw)) !== null) {
      headers.push({ title: match[0].trim(), level: 6 });
    }
    return headers;
  }
  function getDesiredHeaders(fileItem, ignoreFirst = true) {
    let all = extractHeaders(fileItem);
    if (!all.length) {
      all = extractHeadersFromRaw(fileItem);
    }
    let filtered = all.filter((h) => h.level === 6);
    if (ignoreFirst && filtered.length > 1) {
      filtered = filtered.slice(1);
    }
    // Filter out "NAVIGATE - BACK" headers
    filtered = filtered.filter((h) => {
      const title = h.title.toLowerCase();
      return !title.includes("navigate") && !title.includes("back");
    });
    return filtered.map((h) => parseHeaderName(h.title));
  }
  function getFileByName(namzuName) {
    if (!namzuName) return null;
    const target = namzuName.endsWith(".namzu") ? namzuName : `${namzuName}.namzu`;
    const pathSuffix = `${target}.md`;
    return dc.useQuery(`@page and endswith($path, "${pathSuffix}")`)?.[0] || null;
  }

  // --- Build ring2 data from file ---
  const ring2Raw = getDesiredHeaders(file, ignoreFirstHeader);
  const ring2Set = new Set(ring2Raw);
  const ring2Unique = Array.from(ring2Set);

  // Build ring2 data (empty array if no headers found)
  let secondRingData = [];
  if (ring2Unique.length > 0) {
    ring2Unique.forEach((heading) => {
      const subFile = getFileByName(heading);
      let children = [];
      if (subFile) {
        children = getDesiredHeaders(subFile, true);
      }
      secondRingData.push({ heading, children });
    });
  }

  // Always render the radial view, even with no ring2 data
  // This allows clicking the center node to navigate back
  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {controls}
      <ResponsiveRadialHeaderView
        centerLabel={currentCenter}
        secondRingData={secondRingData}
        placeholderMarkdown="![[beto.group.svg]]"
        backgroundColor="#000"
        onCenterClick={handleCenterClick}
        onMiddleClick={handleMiddleClick}
      />
    </div>
  );
}



// ---------------------------------------------------------------------
// 7) Final Usage + Export in ViewBounty
// ---------------------------------------------------------------------
function ExampleUsage({ onFileSelect, showViewButton, spawnType }) {
  return <AutoRadialNamzuView centerLabel={centerHeader} onFileSelect={onFileSelect} showViewButton={showViewButton} spawnType={spawnType} />;
}

function ViewBounty({ app, onFileSelect, showViewButton = true, spawnType = "fullTab" }) {
  return <ExampleUsage onFileSelect={onFileSelect} showViewButton={showViewButton} spawnType={spawnType} />;
}

return { ViewBounty };

```




# ImagesPlaceholder

```jsx
function GetImagesPlaceholders({
  iconName = "PHYSICAL",
  size = 42,
  x = 0,
  y = 0,
}) {
  const queryString = `@file and endswith($path, "${iconName}.svg")`;
  const files = dc.useQuery(queryString);

  if (files && files.length > 0) {
    // Use the file's full path and remove focus outline
    const filePath = files[0].$path;
    return (
      <foreignObject
        x={x}
        y={y}
        width={size}
        height={size}
        style={{ overflow: "visible" }}
      >
        <div
          tabIndex={-1}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            outline: "none",
          }}
        >
          <dc.Markdown content={`![[${filePath}]]`} />
        </div>
      </foreignObject>
    );
  } else {
    // Fallback: Render the inline placeholder SVG with focus disabled and outline removed
    return (
      <svg
        x={x}
        y={y}
        width={size}
        height={size}
        viewBox="0 0 1920 1920"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
        style={{ outline: "none" }}
      >
        <defs>
          <style>{`
            .cls-1 { fill: none; }
            .cls-2 { fill: #fff; }
          `}</style>
        </defs>
        <g id="Background">
          <rect className="cls-1" width="1920" height="1920" />
        </g>
        <g id="BETO_W_" data-name="BETO [W]">
          <g>
            <path className="cls-2" d="M1052.08,802.24c-5.22,0-10.37-2.41-13.67-6.95-5.49-7.54-3.83-18.11,3.71-23.61,56.28-40.98,72.42-117.43,37.55-177.82-18.16-31.46-47.49-53.96-82.57-63.36-35.09-9.4-71.73-4.58-103.19,13.59-31.46,18.16-53.96,47.49-63.36,82.58-9.4,35.09-4.58,71.74,13.58,103.19,9.38,16.25,21.71,30.11,36.64,41.19,7.49,5.56,9.06,16.15,3.5,23.64-5.56,7.5-16.14,9.06-23.64,3.5-18.66-13.85-34.06-31.16-45.77-51.44-46.81-81.08-18.93-185.12,62.15-231.93,39.28-22.68,85.04-28.7,128.83-16.96,43.81,11.74,80.42,39.83,103.1,79.11,43.53,75.4,23.36,170.85-46.93,222.04-3,2.19-6.48,3.24-9.93,3.24Z"/>
            <path className="cls-2" d="M1130.41,902.91c-14.04,0-28.02-5.8-38.04-17.17-18.52-21-16.5-53.03,4.5-71.55,72.24-63.7,89.65-170.59,41.4-254.17-56.09-97.15-180.76-130.55-277.9-74.46s-130.55,180.76-74.46,277.9c11,19.04,24.81,36.02,41.07,50.46,20.93,18.59,22.83,50.63,4.23,71.56-18.59,20.93-50.64,22.82-71.56,4.23-24.39-21.67-45.1-47.09-61.53-75.56-84.04-145.56-33.99-332.36,111.57-416.4,145.56-84.04,332.35-33.99,416.4,111.57,72.29,125.22,46.15,285.41-62.15,380.91-9.64,8.5-21.6,12.67-33.51,12.67Z"/>
          </g>
          <g>
            <path className="cls-2" d="M643.37,1378.94c-93.62,0-169.78-76.16-169.78-169.78s76.16-169.79,169.78-169.79c23.42,0,46.1,4.68,67.43,13.92,8.56,3.71,12.5,13.66,8.79,22.22-3.71,8.56-13.65,12.5-22.22,8.79-17.06-7.39-35.23-11.14-54-11.14-74.99,0-135.99,61.01-135.99,135.99s61.01,135.99,135.99,135.99c69.73,0,127.87-52.21,135.22-121.44.99-9.28,9.28-16.03,18.59-15.01,9.28.99,16,9.31,15.02,18.59-9.19,86.46-81.77,151.66-168.83,151.66Z"/>
            <path className="cls-2" d="M643.37,1514.18c-168.08,0-304.82-136.74-304.82-304.82s136.74-304.82,304.82-304.82c32.88,0,65.25,5.22,96.21,15.51,26.57,8.83,40.95,37.53,32.12,64.09s-37.53,40.96-64.09,32.12c-20.63-6.86-42.24-10.33-64.24-10.33-112.18,0-203.44,91.26-203.44,203.44s91.26,203.44,203.44,203.44c96.51,0,180.37-68.53,199.42-162.94,5.54-27.44,32.27-45.22,59.71-39.67,27.44,5.53,45.21,32.27,39.67,59.71-28.55,141.54-154.22,244.27-298.8,244.27Z"/>
          </g>
          <g>
            <path className="cls-2" d="M1276.71,1378.94c-87.06,0-159.64-65.2-168.83-151.66-.99-9.28,5.73-17.6,15.01-18.59,9.29-1.01,17.6,5.73,18.59,15.01,7.36,69.23,65.49,121.44,135.22,121.44,74.99,0,135.99-61,135.99-135.99s-61.01-135.99-135.99-135.99c-18.77,0-36.94,3.75-54,11.14-8.57,3.71-18.51-.23-22.22-8.79-3.71-8.57.23-18.51,8.79-22.22,21.33-9.24,44.01-13.92,67.43-13.92,93.62,0,169.79,76.16,169.79,169.79s-76.16,169.78-169.79,169.78Z"/>
            <path className="cls-2" d="M1276.71,1514.18c-144.58,0-270.25-102.73-298.8-244.27-5.54-27.44,12.22-54.18,39.67-59.71,27.41-5.51,54.18,12.22,59.71,39.67,19.05,94.41,102.91,162.94,199.42,162.94,112.18,0,203.44-91.26,203.44-203.44s-91.26-203.44-203.44-203.44c-21.99,0-43.6,3.48-64.23,10.33-26.58,8.82-55.26-5.55-64.09-32.12-8.83-26.57,5.55-55.26,32.12-64.09,30.96-10.29,63.33-15.51,96.21-15.51,168.08,0,304.82,136.74,304.82,304.82s-136.74,304.82-304.82,304.82Z"/>
          </g>
        </g>
      </svg>
    );
  }
}

return { GetImagesPlaceholders };

```









# CustomFeed

```jsx
// Import the guidelines and required modules using dc.resolvePath
const componentFile = dc.resolvePath("D.q.contentexplorer888.component");

const { getIframesGuidelines } = await dc.require(
  dc.headerLink(componentFile, "IframesGuidelines")
);
const { FileSectionsProvider } = await dc.require(
  dc.headerLink(componentFile, "FileSectionsProvider")
);
const {
  transformUrl,
  getGuidelinesForUrl,
  useResizeObserver,
  useWindowResize,
  IframeControls,
  IframeContainer,
} = await dc.require(dc.headerLink(componentFile, "UtilityFunctions"));

/**
 * Main View Component
 *
 * Combines the iFrame viewer with navigation controls and a hamburger
 * drawer for inline editing.
 */
function View({ title = "PHYSICAL.enigmas", spawnType = "fullTab", onBack = null, backLabel = "" }) {
  const { useState, useEffect, useMemo, useRef } = dc;
  
  // Suppress third-party iframe errors (Instagram, Facebook, etc.) from console
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      // Filter out known third-party errors
      if (
        message.includes('Unable to parse uri') ||
        message.includes('ajax/bulk-route-definitions') ||
        message.includes('ErrorUtils caught an error') ||
        message.includes('fburl.com/debugjs') ||
        message.includes('Unexpected token') ||
        message.includes('<!DOCTYPE')
      ) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      // Filter out iframe-related warnings
      if (
        message.includes('third-party cookies') ||
        message.includes('Instagram') ||
        message.includes('Facebook')
      ) {
        return; // Suppress these warnings
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  
  // Parse spawnType to determine initial mode and toggle visibility (case-insensitive)
  const lowerSpawnType = (spawnType || "").toLowerCase();
  const isDisabled = lowerSpawnType === "disabled" || lowerSpawnType === "disable";
  const isLocked = lowerSpawnType.includes(".locked");
  const baseSpawnType = lowerSpawnType.replace(".locked", "");
  const showFullTabToggle = !isLocked && !isDisabled;
  const initialFullTab = !isDisabled && baseSpawnType === "fulltab";
  
  //console.log("View component initialized with spawnType:", spawnType, "initialFullTab:", initialFullTab, "showFullTabToggle:", showFullTabToggle);
  
  // Use the title prop to load the content file
  const fileName = `${title}..md`;

  // ------------------------------
  // Container & iFrame states
  // ------------------------------
  const [width, setWidth] = useState(800); // Container Width (C.W)
  const [height, setHeight] = useState(600); // Container Height (C.H)
  const [isContainerManual, setIsContainerManual] = useState(false);
  const isContainerManualRef = useRef(isContainerManual);
  useEffect(() => {
    isContainerManualRef.current = isContainerManual;
  }, [isContainerManual]);

  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeWidth, setIframeWidth] = useState(800); // Iframe Width (I.W)
  const [iframeHeight, setIframeHeight] = useState(666); // Iframe Height (I.H)
  const [iframeScale, setIframeScale] = useState(1);     // Iframe Scale (I.S)
  const [iframeLeft, setIframeLeft] = useState(10);        // Iframe Left (I.L)
  const [iframeTop, setIframeTop] = useState(10);          // Iframe Top (I.T)
  const [disableIframeInteraction, setDisableIframeInteraction] = useState(true);

  const containerRef = useRef(null);
  const iframeWrapperRef = useRef(null);

  // Hamburger menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Fine controls visibility toggle (edit component)
  const [showFineControls, setShowFineControls] = useState(false);

  // Touch/swipe detection
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
  // ------------------------------
  // Full-Tab Mode State & Utilities
  // ------------------------------
  const [isFullTab, setIsFullTab] = useState(initialFullTab);
  
  // Utility to find nearest ancestor with specific class
  function findNearestAncestorWithClass(element, className) {
    let current = element;
    while (current && current !== document.body) {
      if (current.classList && current.classList.contains(className)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  // Utility to find direct child with specific class
  function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      if (child.classList && child.classList.contains(className)) {
        return child;
      }
    }
    return null;
  }

  // ------------------------------
  // File Sections & Navigation Logic
  // ------------------------------
  const [sections, setSections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedFilePath, setLoadedFilePath] = useState("");

  // State for the numeric input (1-indexed)
  const [entryInput, setEntryInput] = useState("1");

  // Update the entry input when currentIndex changes
  useEffect(() => {
    setEntryInput(String(currentIndex + 1));
  }, [currentIndex]);

  // ------------------------------
  // Title ref and header click simulation with press delay
  // ------------------------------
  const titleRef = useRef(null);
  // Compute header text from loaded file path
  const headerText = useMemo(() => {
    if (loadedFilePath) {
      // Extract filename from path
      const segments = loadedFilePath.split("/");
      const filename = segments[segments.length - 1];
      // Remove the ..md extension and return
      return filename.replace(/\.\.md$/, "").replace(/\.md$/, "");
    }
    // Fallback to fileName prop
    const parts = fileName.split("..md");
    return parts[0] || fileName.replace(/\.[^/.]+$/, "");
  }, [loadedFilePath, fileName]);

  /**
   * simulateTitleClickWithPressDelay simulates a header click by:
   * 1. Dispatching a mousedown event.
   * 2. Waiting for a press delay (default 200ms).
   * 3. Dispatching mouseup and click events.
   */
  function simulateTitleClickWithPressDelay(pressDelay = 10000) {
    if (!titleRef.current) {
      console.warn("titleRef.current is null, skipping simulated click");
      return;
    }
    
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    titleRef.current.dispatchEvent(mouseDownEvent);

    setTimeout(() => {
      if (!titleRef.current) return;
      
      const mouseUpEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      titleRef.current.dispatchEvent(mouseUpEvent);

      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      titleRef.current.dispatchEvent(clickEvent);
    }, pressDelay);
  }

  /**
   * simulateTitleClickDelayed waits for an overall delay (default 500ms)
   * before calling the simulated press with a press delay.
   */
  function simulateTitleClickDelayed(delay = 500, pressDelay = 200) {
    setTimeout(() => {
      simulateTitleClickWithPressDelay(pressDelay);
    }, delay);
  }

  // When currentIndex changes, wait 500ms then simulate the header press.
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateTitleClickWithPressDelay();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Navigation functions with boundary handling.
  const goNext = () => {
    setCurrentIndex((prev) => {
      if (prev < sections.length - 1) {
        return prev + 1;
      } else {
        // At the last video, simulate a header press with delay.
        simulateTitleClickDelayed();
        return prev;
      }
    });
  };
  const goPrev = () => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      } else {
        // At the first video, simulate a header press with delay.
        simulateTitleClickDelayed();
        return prev;
      }
    });
  };
  const reloadCurrent = () => {
    // Force reload by temporarily changing index then back
    const current = currentIndex;
    setCurrentIndex(-1);
    setTimeout(() => {
      setCurrentIndex(current);
    }, 10);
  };

  // Update currentIndex based on numeric input value.
  function updateCurrentIndexFromInput() {
    const parsed = parseInt(entryInput, 10);
    if (!isNaN(parsed) && sections.length > 0) {
      let newIndex = parsed - 1; // Convert to 0-index
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= sections.length) newIndex = sections.length - 1;
      setCurrentIndex(newIndex);
    }
  }

  // Handle numeric input key events.
  function handleEntryInputKeyDown(e) {
    if (e.key === "Enter") {
      updateCurrentIndexFromInput();
    }
  }
  function handleEntryInputBlur() {
    updateCurrentIndexFromInput();
  }

  // ------------------------------
  // Global keydown and wheel event handlers
  // ------------------------------
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      // Require Option (Alt) key for all shortcuts
      if (!e.altKey) return;

      if (showFineControls && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        return;
      }

      if (!showFineControls) {
        if (e.key === "ArrowRight" || e.key === "d") {
          setMenuOpen(true);
          e.preventDefault();
        } else if (e.key === "ArrowLeft" || e.key === "a") {
          setMenuOpen(false);
          e.preventDefault();
        } else if (e.key === "ArrowUp" || e.key === "w") {
          goPrev();
          e.preventDefault();
        } else if (e.key === "ArrowDown" || e.key === "s") {
          goNext();
          e.preventDefault();
        } else if (e.key === " ") {
          setDisableIframeInteraction((prev) => !prev);
          e.preventDefault();
        } else if (e.key === "v") {
          openCurrentLink();
          e.preventDefault();
        } else if (e.key === "c") {
          // Option+C for additional controls if needed
          e.preventDefault();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFineControls, goPrev, goNext]);

  useEffect(() => {
    function handleWheel(e) {
      if (!showFineControls) return;

      const baseFactor = 0.2;
      const ilitFactor = 0.5;
      const scaleFactor = 0.001;

      // COMMAND + OPTION + SHIFT: Adjust I.L and I.T.
      if (e.metaKey && e.altKey && e.shiftKey) {
        if (e.deltaX !== 0) {
          setIframeLeft((prev) => prev + e.deltaX * ilitFactor);
        }
        if (e.deltaY !== 0) {
          setIframeTop((prev) => prev + e.deltaY * ilitFactor);
        }
        e.preventDefault();
      }
      // COMMAND + OPTION (without SHIFT): Adjust I.S (iframe scale) with finer increments.
      else if (e.metaKey && e.altKey && !e.shiftKey) {
        if (e.deltaY !== 0) {
          setIframeScale((prev) => {
            const newScale = Math.max(0.1, prev + (e.deltaY > 0 ? -scaleFactor : scaleFactor));
            return parseFloat(newScale.toFixed(3));
          });
          e.preventDefault();
        }
      }
      // COMMAND + SHIFT (without OPTION): Adjust container dimensions.
      else if (e.metaKey && e.shiftKey && !e.altKey) {
        if (e.deltaX !== 0) {
          setWidth((prev) => Math.max(10, prev + e.deltaX * baseFactor));
          e.preventDefault();
        }
        if (e.deltaY !== 0) {
          setHeight((prev) => Math.max(10, prev + e.deltaY * baseFactor));
          e.preventDefault();
        }
      }
      // COMMAND only: Adjust I.W and I.H.
      else if (e.metaKey && !e.shiftKey && !e.altKey) {
        if (e.deltaX !== 0) {
          setIframeWidth((prev) => Math.max(10, prev + e.deltaX * baseFactor));
          e.preventDefault();
        }
        if (e.deltaY !== 0) {
          setIframeHeight((prev) => Math.max(10, prev + e.deltaY * baseFactor));
          e.preventDefault();
        }
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [showFineControls]);

  // Open the current iFrame link in a new tab.
  function openCurrentLink() {
    if (iframeSrc) {
      window.open(iframeSrc, "_blank");
    }
  }

  // ------------------------------
  // Touch/Swipe Handling
  // ------------------------------
  const handleTouchStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    touchStartY.current = e.touches[0].clientY;
   // console.log("Touch Start Y:", touchStartY.current);
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    touchEndY.current = e.touches[0].clientY;
    //console.log("Touch Move Y:", touchEndY.current);
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // minimum distance for a swipe
    
    //console.log("Touch End - Start Y:", touchStartY.current, "End Y:", touchEndY.current, "Distance:", swipeDistance);

    if (swipeDistance > minSwipeDistance) {
      // Swiped up (go to next)
      //console.log("Swiped UP - Going to NEXT");
      goNext();
    } else if (swipeDistance < -minSwipeDistance) {
      // Swiped down (go to previous)
      //console.log("Swiped DOWN - Going to PREVIOUS");
      goPrev();
    } else {
      //console.log("Swipe distance too small:", swipeDistance);
    }

    // Reset values
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Add touch event listeners with capture phase
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
    container.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    container.addEventListener('touchend', handleTouchEnd, { capture: true, passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart, { capture: true });
      container.removeEventListener('touchmove', handleTouchMove, { capture: true });
      container.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [goNext, goPrev]);

  // ------------------------------
  // Full-Tab Mode DOM Manipulation
  // ------------------------------
  useEffect(() => {
    const container = containerRef.current;
    //console.log("Full-tab effect triggered. isFullTab:", isFullTab, "container:", container);
    
    if (!container) {
      console.warn("Container ref not available yet");
      return;
    }
    
    if (!isFullTab) {
      //console.log("Not in full-tab mode, skipping DOM manipulation");
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Find the workspace-leaf-content ancestor
      const workspaceLeaf = findNearestAncestorWithClass(container, "workspace-leaf-content");
      if (!workspaceLeaf) {
        console.warn("Could not find workspace-leaf-content ancestor");
        //console.log("Container parent chain:", container.parentElement);
        return;
      }
      //console.log("Found workspace-leaf-content:", workspaceLeaf);

      // Find view-content (like BasicView v2 does) or fallback to workspace-leaf-content
      const contentWrapper = findDirectChildByClass(workspaceLeaf, "view-content") || workspaceLeaf;
      //console.log("Found content wrapper:", contentWrapper);

      // Save original parent and position
      const originalParent = container.parentElement;
      const originalPosition = container.style.position;
      const originalTop = container.style.top;
      const originalLeft = container.style.left;
      const originalWidth = container.style.width;
      const originalHeight = container.style.height;
      const originalZIndex = container.style.zIndex;
      const originalBackground = container.style.backgroundColor;
      const originalOverflow = container.style.overflow;

      // Set parent position if static (like BasicView v2)
      const parentOriginalPosition = window.getComputedStyle(contentWrapper).position;
      if (parentOriginalPosition === "static") {
        contentWrapper.style.position = "relative";
      }

      // Create placeholder
      const placeholder = document.createElement("div");
      placeholder.style.display = "none";
      originalParent.insertBefore(placeholder, container);

      // Move to content wrapper
      contentWrapper.appendChild(container);
      //console.log("Container moved to content wrapper");

      // Apply full-tab styles (like BasicView v2)
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.zIndex = "9998";
      container.style.backgroundColor = "var(--background-primary)";
      container.style.overflow = "auto";
      //console.log("Full-tab styles applied");

      // Store cleanup data
      container._cleanupData = {
        placeholder,
        originalParent,
        originalPosition,
        originalTop,
        originalLeft,
        originalWidth,
        originalHeight,
        originalZIndex,
        originalBackground,
        originalOverflow,
        contentWrapper,
        parentOriginalPosition
      };
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      const cleanupData = container._cleanupData;
      if (cleanupData) {
        const { placeholder, originalParent, originalPosition, originalTop, originalLeft, originalWidth, originalHeight, originalZIndex, originalBackground, originalOverflow, contentWrapper, parentOriginalPosition } = cleanupData;
        
        if (placeholder && placeholder.parentElement) {
          placeholder.parentElement.insertBefore(container, placeholder);
          placeholder.remove();
        }
        
        // Restore parent position
        if (contentWrapper && parentOriginalPosition === "static") {
          contentWrapper.style.position = "";
        }
        
        // Restore original styles
        container.style.position = originalPosition;
        container.style.top = originalTop;
        container.style.left = originalLeft;
        container.style.width = originalWidth;
        container.style.height = originalHeight;
        container.style.zIndex = originalZIndex;
        container.style.backgroundColor = originalBackground;
        container.style.overflow = originalOverflow;
        
        delete container._cleanupData;
       // console.log("Full-tab mode cleaned up");
      }
    };
  }, [isFullTab]);

  // ------------------------------
  // Resize Handling
  // ------------------------------
  const updateDimensions = (newWidth) => {
    setWidth(newWidth);
    setIframeWidth(newWidth);
  };
  const observerRef = useResizeObserver(
    containerRef,
    isContainerManualRef,
    updateDimensions
  );
  useWindowResize(isContainerManual, updateDimensions);

  // Apply guidelines based on the URL.
  const applyGuidelines = (url) => {
    const guidelines = getGuidelinesForUrl(url, getIframesGuidelines);
    if (guidelines) {
      setIsContainerManual(true);
      isContainerManualRef.current = true;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      setWidth(guidelines.containerWidth);
      setHeight(guidelines.containerHeight);
      setIframeWidth(guidelines.iframeWidth);
      setIframeHeight(guidelines.iframeHeight);
      setIframeScale(guidelines.iframeScale);
      setIframeLeft(guidelines.iframeLeft);
      setIframeTop(guidelines.iframeTop);
      setDisableIframeInteraction(guidelines.disableIframeInteraction);
    }
  };

  // Update iFrame URL and guidelines when the carousel changes.
  useEffect(() => {
    if (sections.length > 0 && sections[currentIndex]) {
      const newUrl = sections[currentIndex].iframeSrc;
      if (newUrl) {
        setIframeSrc(newUrl);
        applyGuidelines(newUrl);
      } else {
        setIframeSrc("");
      }
    }
  }, [currentIndex, sections]);

  // Simulate a click in the iFrame if interaction is disabled.
  const handleContainerClick = (e) => {
    if (!disableIframeInteraction) return;
    window.requestAnimationFrame(() => {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;
      if (
        clickX >= iframeLeft &&
        clickX <= iframeLeft + iframeWidth &&
        clickY >= iframeTop &&
        clickY <= iframeTop + iframeHeight
      ) {
        const relativeX = (clickX - iframeLeft) / iframeScale;
        const relativeY = (clickY - iframeTop) / iframeScale;
        if (iframeWrapperRef.current) {
          const iframe = iframeWrapperRef.current.querySelector("iframe");
          if (iframe) {
            try {
              const iframeDoc =
                iframe.contentDocument || iframe.contentWindow.document;
              const targetElement = iframeDoc.elementFromPoint(
                relativeX,
                relativeY
              );
              if (targetElement) {
                const simulatedClick = new MouseEvent("click", {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: relativeX,
                  clientY: relativeY,
                });
                targetElement.dispatchEvent(simulatedClick);
              }
            } catch (error) {
              console.error("Unable to simulate click in iframe:", error);
            }
          }
        }
      }
    });
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* iFrame viewer area with header and controls */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{ flex: "1 1 auto", overflow: "hidden", position: "relative", touchAction: "none" }}
      >
        {/* Compact Header */}
        <dc.Stack style={{ 
          padding: "12px 16px",
          backgroundColor: "#0a0a0a",
          borderBottom: "1px solid #1a1a1a"
        }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: "12px"
            }}
          >
            {/* Left: Back button (if provided) or Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "0 0 auto" }}>
              {onBack && (
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    backgroundColor: "#1a1a1a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    transition: "all 0.2s ease"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBack();
                  }}
                >
                  <dc.Icon icon="arrow-left" style={{ fontSize: "14px" }} />
                  <span>Back to Explorer</span>
                </button>
              )}
              <h1 ref={titleRef} style={{ 
                margin: 0, 
                fontSize: "1em",
                color: backLabel ? "#a0a0a0" : "#e0e0e0",
                fontWeight: "500",
                borderLeft: (onBack && backLabel) ? "1px solid #2a2a2a" : "none",
                paddingLeft: (onBack && backLabel) ? "12px" : "0"
              }}>
                {backLabel || headerText}
              </h1>
            </div>
            
            {/* Center: Navigation Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "0 0 auto" }}>
              <button
                disabled={showFineControls}
                style={{
                  background: "#1a1a1a",
                  color: currentIndex > 0 ? "#a0a0a0" : "#444",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: showFineControls ? "not-allowed" : (currentIndex > 0 ? "pointer" : "default"),
                  opacity: showFineControls ? 0.5 : 1,
                  visibility: currentIndex > 0 ? "visible" : "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={!showFineControls ? goPrev : undefined}
              >
                <dc.Icon icon="chevron-up" style={{ fontSize: "14px" }} />
              </button>
              
              {sections.length > 0 && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px",
                  color: "#a0a0a0",
                  fontSize: "12px"
                }}>
                  <input
                    type="number"
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    onKeyDown={handleEntryInputKeyDown}
                    onBlur={handleEntryInputBlur}
                    style={{ 
                      width: "40px", 
                      textAlign: "center",
                      background: "#141414",
                      color: "#e0e0e0",
                      border: "1px solid #2a2a2a",
                      borderRadius: "4px",
                      padding: "3px",
                      fontSize: "12px"
                    }}
                  />
                  <span style={{ whiteSpace: "nowrap" }}>/{sections.length}</span>
                </div>
              )}
              
              {/* Reload Button */}
              <button
                disabled={showFineControls}
                style={{
                  background: "#1a1a1a",
                  color: "#a0a0a0",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: showFineControls ? "not-allowed" : "pointer",
                  opacity: showFineControls ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={!showFineControls ? reloadCurrent : undefined}
                title="Reload current entry"
              >
                <dc.Icon icon="refresh-cw" style={{ fontSize: "14px" }} />
              </button>
              
              <button
                disabled={showFineControls}
                style={{
                  background: "#1a1a1a",
                  color: currentIndex < sections.length - 1 ? "#a0a0a0" : "#444",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: showFineControls ? "not-allowed" : (currentIndex < sections.length - 1 ? "pointer" : "default"),
                  opacity: showFineControls ? 0.5 : 1,
                  visibility: currentIndex < sections.length - 1 ? "visible" : "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={!showFineControls ? goNext : undefined}
              >
                <dc.Icon icon="chevron-down" style={{ fontSize: "14px" }} />
              </button>
            </div>
            
            {/* Right: Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: "0 0 auto" }}>
              <button
                style={{
                  background: disableIframeInteraction ? "#1a1a1a" : "#8b5cf6",
                  color: disableIframeInteraction ? "#a0a0a0" : "#ffffff",
                  border: "1px solid " + (disableIframeInteraction ? "#2a2a2a" : "#8b5cf6"),
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDisableIframeInteraction(!disableIframeInteraction);
                }}
                title={disableIframeInteraction ? "Enable iframe interaction" : "Disable iframe interaction"}
              >
                {disableIframeInteraction ? "EN" : "DIS"}
              </button>
              
              <button
                style={{
                  background: "#1a1a1a",
                  color: "#a0a0a0",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openCurrentLink();
                }}
                title="Open in new tab"
              >
                <dc.Icon icon="external-link" style={{ fontSize: "14px" }} />
              </button>
              
              <button
                style={{
                  background: menuOpen ? "#8b5cf6" : "#1a1a1a",
                  color: menuOpen ? "#ffffff" : "#a0a0a0",
                  border: "1px solid " + (menuOpen ? "#8b5cf6" : "#2a2a2a"),
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                title="Toggle menu"
              >
                <dc.Icon icon="menu" style={{ fontSize: "14px" }} />
              </button>
              
              <button
                style={{
                  background: showFineControls ? "#8b5cf6" : "#1a1a1a",
                  color: showFineControls ? "#ffffff" : "#a0a0a0",
                  border: "1px solid " + (showFineControls ? "#8b5cf6" : "#2a2a2a"),
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFineControls((prev) => !prev);
                }}
                title="Toggle fine controls"
              >
                <dc.Icon icon="settings" style={{ fontSize: "14px" }} />
              </button>
              
              {/* Full-Tab Toggle Button - Only show if enabled */}
              {showFullTabToggle && (
                <button
                  style={{
                    background: isFullTab ? "#8b5cf6" : "#1a1a1a",
                    color: isFullTab ? "#ffffff" : "#a0a0a0",
                    border: "1px solid " + (isFullTab ? "#8b5cf6" : "#2a2a2a"),
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullTab(!isFullTab);
                  }}
                  title={isFullTab ? "Exit full-tab mode" : "Enter full-tab mode"}
                >
                  <dc.Icon icon={isFullTab ? "minimize-2" : "maximize-2"} style={{ fontSize: "14px" }} />
                </button>
              )}
            </div>
          </div>
          {/* Fine controls row */}
          {showFineControls && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px",
                padding: "15px",
                backgroundColor: "#141414",
                borderRadius: "8px",
                border: "1px solid #2a2a2a",
                alignItems: "center",
              }}
            >
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                C.W
                <input
                  type="number"
                  value={width}
                  onChange={(e) =>
                    setWidth(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                C.H
                <input
                  type="number"
                  value={height}
                  onChange={(e) =>
                    setHeight(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.W
                <input
                  type="number"
                  value={iframeWidth}
                  onChange={(e) =>
                    setIframeWidth(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.H
                <input
                  type="number"
                  value={iframeHeight}
                  onChange={(e) =>
                    setIframeHeight(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.S
                <input
                  type="number"
                  step="0.001"
                  value={iframeScale.toFixed(3)}
                  onChange={(e) =>
                    setIframeScale(parseFloat(e.target.value) || 1)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.L
                <input
                  type="number"
                  value={iframeLeft}
                  onChange={(e) =>
                    setIframeLeft(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
              <label style={{ color: "#a0a0a0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                I.T
                <input
                  type="number"
                  value={iframeTop}
                  onChange={(e) =>
                    setIframeTop(parseFloat(e.target.value) || 0)
                  }
                  style={{ 
                    width: "60px",
                    background: "#0a0a0a",
                    color: "#e0e0e0",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "13px"
                  }}
                />
              </label>
            </div>
          )}
        </dc.Stack>

        {iframeSrc && (
          <dc.Stack style={{ padding: "10px" }}>
            <IframeContainer
              width={width}
              height={height}
              iframeSrc={iframeSrc}
              iframeWidth={iframeWidth}
              iframeHeight={iframeHeight}
              iframeScale={iframeScale}
              iframeLeft={iframeLeft}
              iframeTop={iframeTop}
              disableIframeInteraction={disableIframeInteraction}
              iframeWrapperRef={iframeWrapperRef}
            />
          </dc.Stack>
        )}

        {/* Hamburger drawer for inline editing - inside containerRef so it moves with full-tab */}
        {menuOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "300px",
              height: "100%",
              background: "#0a0a0a",
              borderLeft: "1px solid #2a2a2a",
              padding: "20px",
              overflowY: "auto",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, color: "#e0e0e0", fontSize: "16px" }}>Edit Section</h2>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ 
                  fontSize: "14px", 
                  cursor: "pointer", 
                  padding: "6px 12px",
                  background: "#1a1a1a",
                  color: "#a0a0a0",
                  border: "1px solid #2a2a2a",
                  borderRadius: "4px"
                }}
              >
                <dc.Icon icon="x" style={{ fontSize: "14px" }} />
              </button>
            </div>
            <FileSectionsProvider
              fileName={fileName}
              editable={true}
              currentSectionIndex={currentIndex}
              onSectionUpdate={(newText) => {
                const newSections = [...sections];
                newSections[currentIndex].text = newText;
                setSections(newSections);
              }}
            />
          </div>
        )}

      </div>

      {/* FileSectionsProvider loads sections based on the dynamic fileName */}
      <FileSectionsProvider fileName={fileName} onSectionsLoaded={setSections} onFilePathLoaded={setLoadedFilePath} />
    </div>
  );
}

return { View };

```


# FileSectionsProvider

```jsx
/**
 * editFileSegment
 *
 * Updates a segment of a file by replacing the original text with the new text.
 */
async function editFileSegment(filePath, originalSegment, newSegment) {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    throw new Error("File not found: " + filePath);
  }
  const fileContent = await app.vault.read(file);
  const index = fileContent.indexOf(originalSegment);
  if (index === -1) {
    throw new Error("Original segment not found in the file content.");
  }
  const updatedContent =
    fileContent.substring(0, index) +
    newSegment +
    fileContent.substring(index + originalSegment.length);
  await app.vault.modify(file, updatedContent);
  return updatedContent;
}

/**
 * EditableSectionUI Component
 *
 * Renders a single section with inline editing functionality.
 */
function EditableSectionUI({ sectionText, filePath, onSectionUpdate }) {
  const { useState, useRef, useEffect } = dc;
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef(null);

  // Shared style for both display and editing
  const boxStyle = {
    width: "100%",
    height: "544px", // fixed height so both modes match
    fontFamily: "monospace",
    fontSize: "1.1em",
    lineHeight: "1.5",
    background: "none",
    padding: "0.5rem",
    boxSizing: "border-box",
    overflow: "auto",
    border: "none",
  };

  // When not editing, add a global keydown listener for Enter/Return.
  useEffect(() => {
    if (!editing) {
      const handleGlobalKeyDown = (e) => {
        // Only trigger if no input or textarea is focused
        const tag = document.activeElement.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        if (e.key === "Enter" || e.key === "Return") {
          e.preventDefault();
          setEditing(true);
          // After enabling editing, wait a tick and focus the textarea
          setTimeout(() => {
            textareaRef.current && textareaRef.current.focus();
          }, 0);
        }
      };

      window.addEventListener("keydown", handleGlobalKeyDown);
      return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [editing]);

  // When in edit mode, catch Enter (without Shift) to save changes.
  const handleTextareaKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === "Return") && !e.shiftKey) {
      e.preventDefault();
      const originalSegment = sectionText;
      const newText = textareaRef.current.value;
      editFileSegment(filePath, originalSegment, newText)
        .then(() => {
          onSectionUpdate(newText);
          setEditing(false);
        })
        .catch((error) => console.error("Error updating file:", error));
    }
  };

  return (
    <div style={{ padding: "0.5rem", marginBottom: "10px", background: "none" }}>
      {editing ? (
        <>
          <textarea
            defaultValue={sectionText}
            ref={textareaRef}
            onKeyDown={handleTextareaKeyDown}
            style={{
              ...boxStyle,
              resize: "vertical",
            }}
          />
          <div style={{ marginTop: "0.5rem" }}>
            <button
              style={{ marginRight: "0.5rem" }}
              onClick={async () => {
                const originalSegment = sectionText;
                const newText = textareaRef.current.value;
                try {
                  await editFileSegment(filePath, originalSegment, newText);
                  onSectionUpdate(newText);
                  setEditing(false);
                } catch (error) {
                  console.error("Error updating file:", error);
                }
              }}
            >
              Save
            </button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <pre style={{ ...boxStyle, whiteSpace: "pre-wrap" }}>
            {sectionText}
          </pre>
          <button style={{ marginTop: "0.5rem" }} onClick={() => setEditing(true)}>
            Edit Section
          </button>
        </>
      )}
    </div>
  );
}



/**
 * FileSectionsProvider
 *
 * Loads a file specified by fileName, splits its content into sections, and if
 * the "editable" prop is true, renders an inline editing UI for the current section.
 */
function FileSectionsProvider({
  fileName,
  onSectionsLoaded,
  onFilePathLoaded,
  editable = false,
  currentSectionIndex = 0,
  onSectionUpdate,
}) {
  const { useMemo, useEffect, useState } = dc;

  // Query for the requested file
  const queryString = useMemo(
    () => `@page and endswith($path, "${fileName}")`,
    [fileName]
  );
  const pages = dc.useQuery(queryString);

  // Fallback query - find file with "EXPERIENCES.enigmas" in the name
  const fallbackQueryString = useMemo(
    () => `@page and $name.contains("EXPERIENCES.enigmas")`,
    []
  );
  const fallbackPages = dc.useQuery(fallbackQueryString);

  // Find the target page
  const targetPage = useMemo(() => {
    // First, try to find the requested file
    if (pages && pages.length > 0) {
      const exactMatch = pages.find((page) => {
        const segments = page.$path.split("/");
        const currentFileName = segments[segments.length - 1];
        return currentFileName === fileName;
      });
      if (exactMatch) {
        //console.log("Found requested file:", exactMatch.$path);
        return exactMatch;
      }
      //console.log("Using first match from pages:", pages[0].$path);
      return pages[0];
    }
    
    // If not found, use ANY file with "enigmas" in the name as fallback
    if (fallbackPages && fallbackPages.length > 0) {
      console.warn(`File "${fileName}" not found. Using fallback file:`, fallbackPages[0].$path);
      return fallbackPages[0];
    }
    
    console.error("No files found matching criteria");
    return null;
  }, [pages, fallbackPages, fileName]);

  const [filePath, setFilePath] = useState("");
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (targetPage) {
      const loadedPath = targetPage.$path;
      setFilePath(loadedPath);
      if (onFilePathLoaded) onFilePathLoaded(loadedPath);
      const file = app.vault.getAbstractFileByPath(loadedPath);
      if (file) {
        app.vault.read(file).then((content) => {
          let fullText = content || "";

          // Optional: remove up to a marker
          const headerMarker = "#### AENIGMAS";
          const markerIndex = fullText.indexOf(headerMarker);
          if (markerIndex !== -1) {
            fullText = fullText.substring(markerIndex + headerMarker.length);
          }

          // Split into sections by lines of 3 or more dashes (preserving newlines)
          const rawSections = fullText
            .split(/^\s*-{3,}\s*$/m)
            .filter((section) => section.replace(/\s+/g, "") !== "");

          // Regexes to detect the iframe tag and src
          const iframeTagRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/i;
          const srcRegex = /<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i;

          // Function to remove leading/trailing blank lines and indentation
          function cleanLines(text) {
            const lines = text.split(/\r?\n/);
            while (lines.length && /^\s*$/.test(lines[0])) {
              lines.shift();
            }
            while (lines.length && /^\s*$/.test(lines[lines.length - 1])) {
              lines.pop();
            }
            return lines.map((line) => line.replace(/^\s+/, "")).join("\n");
          }

          const sectionsData = rawSections.map((originalSection) => {
            // Clean the section text first
            const finalText = cleanLines(originalSection);

            // Regexes to detect the iframe tag and src
            const iframeTagRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/i;
            const srcRegex = /<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i;
            let iframeTag = "";
            let iframeSrc = "";

            // Try to capture an iframe tag
            const iframeTagMatch = originalSection.match(iframeTagRegex);
            if (iframeTagMatch) {
                iframeTag = iframeTagMatch[0];
                const srcMatch = iframeTag.match(srcRegex);
                if (srcMatch) {
                iframeSrc = srcMatch[1];
                }
            } else {
                // If no iframe tag is found, check for a URL starting with "https://"
                const urlRegex = /(https:\/\/[^\s]+)/;
                const urlMatch = finalText.match(urlRegex);
                if (urlMatch) {
                iframeSrc = urlMatch[1];
                }
            }

            // New logic for YouTube:
            // If the iframeSrc is a YouTube embed URL, search the full text for an alternative URL that is not the embed version.
            if (iframeSrc && iframeSrc.includes("youtube.com/embed/")) {
                const youtubeUrlRegex = /(https:\/\/(?:www\.)?youtube\.com\/(?!embed)[^"'\s]+)/;
                const youtubeMatch = finalText.match(youtubeUrlRegex);
                if (youtubeMatch) {
                iframeSrc = youtubeMatch[1];
                }
            }

            // New logic for Instagram:
            // If the URL is for Instagram and ends with "/embed" or "/embed/", remove that trailing part.
            if (iframeSrc && iframeSrc.includes("instagram.com")) {
                iframeSrc = iframeSrc.replace(/\/embed\/?$/, '');
            }

            return {
                text: finalText,
                iframeTag,
                iframeSrc,
            };
            });




          setSections(sectionsData);
          if (onSectionsLoaded) onSectionsLoaded(sectionsData);
        });
      } else {
        console.error("File not found at path:", targetPage.$path);
      }
    } else {
      console.error("No target page found for file:", fileName);
    }
  }, [targetPage, fileName, onSectionsLoaded]);

  // When in editable mode, render the inline editing UI for the current section.
  if (editable && sections.length > 0) {
    const currentSection = sections[currentSectionIndex];
    return (
      <EditableSectionUI
        sectionText={currentSection.text}
        filePath={filePath}
        onSectionUpdate={(newText) => {
          const newSections = [...sections];
          newSections[currentSectionIndex].text = newText;
          setSections(newSections);
          if (onSectionUpdate) onSectionUpdate(newText);
        }}
      />
    );
  }
  return null;
}

return { EditableSectionUI, FileSectionsProvider };

```




# UtilityFunctions


```jsx
// Import the guidelines using dc.resolvePath
const componentFile = dc.resolvePath("D.q.contentexplorer888.component");

const { getIframesGuidelines } = await dc.require(
  dc.headerLink(componentFile, "IframesGuidelines")
);

/** Utility Functions **/

// Transforms URLs (for example, converts YouTube URLs to embed links)
function transformUrl(url) {
  if (!url) return "";
  const lower = url.toLowerCase();
  try {
    if (lower.includes("youtube.com/watch")) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (videoId) {
        return "https://www.youtube.com/embed/" + videoId;
      }
    } else if (lower.includes("youtu.be/")) {
      const parts = url.split("/");
      const videoId = parts[parts.length - 1];
      if (videoId) {
        return "https://www.youtube.com/embed/" + videoId;
      }
    }
  } catch (e) {
    console.error("URL transformation error:", e);
  }
  return url;
}

// Returns guidelines based on the entered URL.
function getGuidelinesForUrl(url, getIframesGuidelines) {
  const guidelines = getIframesGuidelines();
  const lowerUrl = url.toLowerCase();
  let key = "WEBSITES"; // default guideline

  if (lowerUrl.includes("facebook.com/reel") || lowerUrl.includes("facebook.com/plugins/vid")) {
    key = "FACEBOOK.reel";
  } else if (lowerUrl.includes("facebook.com/watch?v=")) {
    key = "FACEBOOK.video";
  } else if (lowerUrl.includes("facebook.com")) {
    key = "FACEBOOK";
  } else if (lowerUrl.includes("warpcast")) {
    key = "WARPCAST";
  } else if (lowerUrl.includes("snapchat.com")) {
    key = "SNAPCHAT";
  } else if (
    (lowerUrl.includes("youtube.com") && lowerUrl.includes("/shorts")) ||
    (lowerUrl.includes("youtu.be") && lowerUrl.includes("shorts"))
  ) {
    key = "YOUTUBE.shorts";
  } else if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    key = "YOUTUBE";
  } else if (lowerUrl.includes("tiktok.com/embed")) {
    key = "TIKTOK.embed";
  } else if (lowerUrl.includes("tiktok.com")) {
    key = "TIKTOK";
  } else if (lowerUrl.includes("reddit.com")) {
    key = "REDDIT";
  } else if (lowerUrl.includes("linkedin.com")) {
    key = "LINKEDIN";
  } else if (lowerUrl.includes("instagram.com/reel") && lowerUrl.endsWith("/embed")) {
    key = "INSTAGRAM.embed";
  } else if (lowerUrl.includes("instagram.com/p") && lowerUrl.endsWith("/embed")) {
    key = "INSTAGRAM.p.embed";
  } else if (lowerUrl.includes("instagram.com/p")) {
    key = "INSTAGRAM.p";
  } else if (lowerUrl.includes("instagram.com")) {
    key = "INSTAGRAM";
  } else if (lowerUrl.includes("platform.twitter.com/embed") || lowerUrl.includes("platform.x.com/embed")) {
    key = "X.platform.embed";
  } else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    key = "X";
  }
  return guidelines[key];
}

/** Custom Hooks **/

// Sets up a ResizeObserver on the container and calls the updateDimensions callback
function useResizeObserver(containerRef, isContainerManualRef, updateDimensions) {
  const { useEffect, useRef } = dc;
  const observerRef = useRef(null);

  useEffect(() => {
    if (
      !isContainerManualRef.current &&
      containerRef.current &&
      typeof ResizeObserver !== "undefined"
    ) {
      //console.log("Attaching ResizeObserver. isContainerManual:",isContainerManualRef.current);
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const newWidth = entry.contentRect.width;
          console.log(
            "ResizeObserver: new container width =",
            newWidth,
            "(isContainerManualRef.current:",
            isContainerManualRef.current,
            ")"
          );
          if (!isContainerManualRef.current) {
            updateDimensions(newWidth);
          } else {
            //console.log("Skipped ResizeObserver update because container is manual.");
          }
        }
      });
      observer.observe(containerRef.current);
      observerRef.current = observer;
      return () => {
        //console.log("Disconnecting ResizeObserver.");
        observer.disconnect();
        observerRef.current = null;
      };
    } else {
      //console.log( "ResizeObserver not attached. isContainerManual:", isContainerManualRef.current );
    }
  }, [isContainerManualRef.current, containerRef.current]);

  return observerRef;
}

// Fallback window resize listener when ResizeObserver is not available.
function useWindowResize(isContainerManual, updateDimensions) {
  const { useEffect } = dc;
  useEffect(() => {
    if (!isContainerManual) {
      //console.log("Attaching window resize listener. isContainerManual:", isContainerManual);
      const handleResize = () => {
        const newWidth = window.innerWidth;
        //console.log("Window resize: new width =", newWidth, "(isContainerManual:", isContainerManual, ")");
        updateDimensions(newWidth);
      };
      window.addEventListener("resize", handleResize);
      return () => {
        //console.log("Removing window resize listener.");
        window.removeEventListener("resize", handleResize);
      };
    } else {
      //console.log("Window resize listener not attached. isContainerManual:", isContainerManual);
    }
  }, [isContainerManual]);
}

/** Sub‑Components **/

// Component for toggling iFrame interaction (moved to header, URL input removed)
function IframeControls({ disableIframeInteraction, toggleIframeInteraction }) {
  return (
    <div style={{ padding: "10px" }}>
      <button onClick={toggleIframeInteraction}>
        {disableIframeInteraction ? "ENABLE" : "DISABLE"}
      </button>
    </div>
  );
}

// Component for rendering the container, inner content, and the iFrame.
function IframeContainer({
  width,
  height,
  iframeSrc,
  iframeWidth,
  iframeHeight,
  iframeScale,
  iframeLeft,
  iframeTop,
  disableIframeInteraction,
  iframeWrapperRef
}) {
  return (
    <div
      style={{
        position: "relative",
        width: width + "px",
        height: height + "px",
        border: "1px solid #ccc",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        margin: "0 auto"
      }}
    >
      <p>HELLO WORLD</p>
      <div
        ref={iframeWrapperRef}
        style={{
          position: "absolute",
          left: iframeLeft + "px",
          top: iframeTop + "px",
          width: iframeWidth + "px",
          height: iframeHeight + "px",
          overflow: "hidden",
          pointerEvents: disableIframeInteraction ? "none" : "auto"
        }}
      >
        {transformUrl(iframeSrc) ? (
          <iframe
            src={transformUrl(iframeSrc)}
            title="Controlled iFrame"
            width={iframeWidth}
            height={iframeHeight}
            loading="lazy"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{
              border: "1px solid #ccc",
              transform: `scale(${iframeScale})`,
              transformOrigin: "top left"
            }}
          ></iframe>
        ) : null}
      </div>
    </div>
  );
}

return { transformUrl, getGuidelinesForUrl, useResizeObserver, useWindowResize, IframeControls, IframeContainer };

```



# IframesGuidelines

```jsx
function getIframesGuidelines() {
  return {
    WEBSITES: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 640,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    FACEBOOK: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "FACEBOOK.reel": {
      containerWidth: 339,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1137,
      iframeScale: 0.526,
      iframeLeft: 1,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "FACEBOOK.plugins": {
      containerWidth: 629,
      containerHeight: 355,
      iframeWidth: 888,
      iframeHeight: 766,
      iframeScale: 0.705,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "FACEBOOK.watch": {
      containerWidth: 629,
      containerHeight: 355,
      iframeWidth: 888,
      iframeHeight: 766,
      iframeScale: 0.793,
      iframeLeft: 0,
      iframeTop: -90,
      disableIframeInteraction: false
    },
    WARPCAST: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    SNAPCHAT: {
      containerWidth: 396,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1111,
      iframeScale: 0.615,
      iframeLeft: 0,
      iframeTop: 44,
      disableIframeInteraction: false
    },
    YOUTUBE: {
      containerWidth: 640,
      containerHeight: 367,
      iframeWidth: 1270,
      iframeHeight: 730,
      iframeScale: 0.5,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    TIKTOK: {
      containerWidth: 340,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 0.92,
      iframeLeft: -124,
      iframeTop: -8,
      disableIframeInteraction: false
    },
    REDDIT: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 600,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    LINKEDIN: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 600,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "YOUTUBE.shorts": {
      containerWidth: 333,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1.04,
      iframeLeft: -155,
      iframeTop: -42,
      disableIframeInteraction: false
    },
    INSTAGRAM: {
      containerWidth: 338,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.528,
      iframeLeft: 0,
      iframeTop: -80,
      disableIframeInteraction: false
    },
    "INSTAGRAM.embed": {
      containerWidth: 340,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.75,
      iframeLeft: -55,
      iframeTop: -55,
      disableIframeInteraction: false
    },
    "TIKTOK.embed": {
      containerWidth: 303,
      containerHeight: 600,
      iframeWidth: 333,
      iframeHeight: 666,
      iframeScale: 0.92,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "INSTAGRAM.p.embed": {
      containerWidth: 503,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.782,
      iframeLeft: 0,
      iframeTop: -55,
      disableIframeInteraction: false
    },
    "INSTAGRAM.p": {
      containerWidth: 479,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.745,
      iframeLeft: 0,
      iframeTop: -55,
      disableIframeInteraction: false
    },
    "X.platform.embed": {
      containerWidth: 514,
      containerHeight: 600,
      iframeWidth: 550,
      iframeHeight: 640,
      iframeScale: 0.935,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "X": {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 744,
      iframeHeight: 640,
      iframeScale: 1.054,
      iframeLeft: -105,
      iframeTop: 0,
      disableIframeInteraction: false
    }
  };
}

return { getIframesGuidelines };

```






