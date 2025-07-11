	

# ViewComponentBounty

```jsx
////////////////////////////////////////////////////
///       Future Proof Radial Header View         ///
////////////////////////////////////////////////////

const componentFile = "_OPERATION/PRIVATE/DATACORE/7 BountyView 🎅/D.q.bountyview.component.md";
const { useState, useMemo, useRef, useEffect } = dc;
const centerHeader = "888.namzu";

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
function AutoRadialNamzuView({ centerLabel = centerHeader, ignoreFirstHeader = true, onFileSelect }) {
  const [currentCenter, setCurrentCenter] = useState(centerLabel);
  const [centerHistory, setCenterHistory] = useState([]);

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
    <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10, display: "flex", gap: "10px" }}>
      <button
        style={{ padding: "8px 12px", border: "none", borderRadius: "4px", cursor: "pointer" }}
        onClick={handleHomeClick}
      >
        Home
      </button>
      <button
        style={{ padding: "8px 12px", border: "none", borderRadius: "4px", cursor: "pointer" }}
        onClick={handleTiktokFeedClick}
      >
        View
      </button>
    </div>
  );

  // If no file is found, render the radial view with an empty second ring.
  // This displays only the center node with its spinning header.
  if (!file) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
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

  if (!ring2Unique.length) {
    return (
      <dc.Stack style={{ padding: "10px", color: "var(--text-normal)" }}>
        <p>No level‑6 headers found in {currentCenter}.md</p>
      </dc.Stack>
    );
  }

  let secondRingData = [];
  ring2Unique.forEach((heading) => {
    const subFile = getFileByName(heading);
    let children = [];
    if (subFile) {
      children = getDesiredHeaders(subFile, true);
    }
    secondRingData.push({ heading, children });
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
function ExampleUsage({ onFileSelect }) {
  return <AutoRadialNamzuView centerLabel={centerHeader} onFileSelect={onFileSelect} />;
}

function ViewBounty({ app, onFileSelect }) {
  return <ExampleUsage onFileSelect={onFileSelect} />;
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
