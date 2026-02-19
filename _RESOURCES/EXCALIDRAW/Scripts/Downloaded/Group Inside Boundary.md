/*
This script groups all elements that are completely contained within a selected boundary line.
How to use:
1. Select one line or arrow to act as the "boundary".
2. Run the script.
The script will find all elements whose vertices/corners are completely inside (or on the edge of) the boundary and group them together.
```javascript
*/

const DEBUG = false; // Set to true to see why elements are failing
new Notice("Group Inside Boundary V2.2 - Dynamic Stroke Width Support");

const selected = ea.getViewSelectedElements();
if (selected.length !== 1) {
  new Notice("Please select exactly one line or arrow to act as the boundary.");
  return;
}

const boundaryElement = selected[0];
if (boundaryElement.type !== "line" && boundaryElement.type !== "arrow" && boundaryElement.type !== "freedraw") {
  new Notice("The boundary must be a line, arrow, or freedraw element.");
  return;
}

// 1. Utility Functions
const rotate = (point, center, angle) => {
  const [x, y] = point;
  const [cx, cy] = center;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    (x - cx) * cos - (y - cy) * sin + cx,
    (x - cx) * sin + (y - cy) * cos + cy
  ];
};

const getCurvePoints = (points) => {
  if (points.length < 2) return points;
  const result = [];
  const catmullRom1D = (p0, p1, p2, p3, t) => {
      const v0 = (p2 - p0) * 0.5;
      const v1 = (p3 - p1) * 0.5;
      const t2 = t * t;
      const t3 = t * t2;
      return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
  };
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    result.push(p1);
    const steps = 10; 
    for (let j = 1; j < steps; j++) {
        const t = j / steps;
        result.push([catmullRom1D(p0[0], p1[0], p2[0], p3[0], t), catmullRom1D(p0[1], p1[1], p2[1], p3[1], t)]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

const getBindingBoxCenter = (el) => {
    return [el.x + el.width / 2, el.y + el.height / 2];
};

const getAbsPoints = (el) => {
  let pts;
  if (el.type === "image") {
    const { x, y, width, height, angle } = el;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const corners = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
    pts = corners;
    if (angle !== 0) pts = corners.map(p => rotate(p, [cx, cy], angle));
  } else {
    let rawPts = el.points;
    if ((el.type === "line" || el.type === "arrow") && el.roundness) {
        rawPts = getCurvePoints(el.points);
    }
    pts = rawPts.map(p => [p[0] + el.x, p[1] + el.y]);
    
    if (el.angle !== 0) {
        const center = getBindingBoxCenter(el);
        pts = pts.map(p => rotate(p, center, el.angle));
    }
  }
  return pts;
};

const getElementCorners = (el) => {
  if (el.type === "line" || el.type === "arrow" || el.type === "freedraw") {
    return getAbsPoints(el);
  }
  const pts = [
    [el.x, el.y],
    [el.x + el.width, el.y],
    [el.x + el.width, el.y + el.height],
    [el.x, el.y + el.height]
  ];
  if (el.angle === 0) return pts;
  const center = [el.x + el.width / 2, el.y + el.height / 2];
  return pts.map(p => rotate(p, center, el.angle));
};

// Even-Odd Rule for Point in Polygon
const isPointInPoly = (point, poly) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const distanceToSegment = (p, v, w) => {
  const l2 = (w[0] - v[0]) ** 2 + (w[1] - v[1]) ** 2;
  if (l2 === 0) return Math.sqrt((p[0] - v[0]) ** 2 + (p[1] - v[1]) ** 2);
  let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])];
  return Math.sqrt((p[0] - proj[0]) ** 2 + (p[1] - proj[1]) ** 2);
};

const isPointNearPoly = (point, poly, epsilon = EPSILON) => {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        if (distanceToSegment(point, poly[i], poly[j]) <= epsilon) return true;
    }
    return false;
};

// 2. Setup Boundary
const boundaryPoints = getAbsPoints(boundaryElement);
const strokeWidth = boundaryElement.strokeWidth || 1;
const EPSILON = Math.max(10, strokeWidth * 1.5); // Dynamic Epsilon: At least 10px, or 1.5x stroke width

console.log(`[GroupInside] Boundary ID: ${boundaryElement.id}`);
console.log(`[GroupInside] Stroke Width: ${strokeWidth}, EPSILON: ${EPSILON}`);
console.log(`[GroupInside] Boundary Points:`, boundaryPoints);

// 3. Find Elements Inside
const allElements = ea.getViewElements().filter(el => el.id !== boundaryElement.id && !el.isDeleted);
if (DEBUG) console.log(`[GroupInside] Scanning ${allElements.length} elements...`);
const insideElements = [];

for (const el of allElements) {
  const corners = getElementCorners(el);
  const allInside = corners.every((pt, i) => {
      const inside = isPointInPoly(pt, boundaryPoints);
      const near = isPointNearPoly(pt, boundaryPoints);
      if (DEBUG && !inside && !near) {
          // Calculate distance to nearest segment for debug
          let minDist = Infinity;
          for (let k = 0, l = boundaryPoints.length - 1; k < boundaryPoints.length; l = k++) {
              const d = distanceToSegment(pt, boundaryPoints[k], boundaryPoints[l]);
              if (d < minDist) minDist = d;
          }
          console.log(`[GroupInside] REJECT ${el.id} (Corner ${i}): Dist=${minDist.toFixed(2)} > ${EPSILON}`);
      }
      return inside || near;
  });
  
  if (allInside) {
    insideElements.push(el);
  }
}

// 4. Group Them
if (insideElements.length > 0) {
  const ids = insideElements.map(el => el.id);
  ea.copyViewElementsToEAforEditing(insideElements);
  
  // FIX: Coordinate System Correction (The "Double Add" Fix)
  // ea.getViewElements() returns absolute coordinates.
  // ea.addElementsToView() expects relative coordinates for elements inside frames.
  // We must convert them back to relative before committing.
  insideElements.forEach(el => {
      if (el.frameId) {
          const frame = ea.getViewElements().find(f => f.id === el.frameId);
          if (frame) {
              const elInDict = ea.elementsDict[el.id];
              if (elInDict) {
                  elInDict.x -= frame.x;
                  elInDict.y -= frame.y;
              }
          }
      }
  });

  ea.addToGroup(ids);
  await ea.addElementsToView(false, false, true);
  ea.selectElementsInView(ids);
  new Notice(`Grouped ${insideElements.length} elements inside the boundary.`);
} else {
  new Notice("No elements found completely inside the boundary.");
}
