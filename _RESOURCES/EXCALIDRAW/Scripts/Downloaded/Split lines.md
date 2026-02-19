/*
This script splits lines, arrows, or freedraw strokes at their intersection points with selected "cutter" elements.
Also supports splitting images using a masking approach.
How to use:
1. Select one or more lines/arrows to act as "cutters".
2. Run the script.
The script will find any other elements (including images) that cross your selection and split them.
```javascript
*/

const DEBUG = true;
const DEBUG_VISUALS = false; 

const log = (...args) => DEBUG && console.log("SplitLines:", ...args);
(async () => {
new Notice("Split Lines V5.10 - The Deep Dive");

const drawDebugLine = (points, color = "red", roughness = 0) => {
    if (!DEBUG_VISUALS || points.length < 2) return;
    ea.style.strokeColor = color;
    ea.style.strokeWidth = 2;
    ea.style.strokeStyle = "solid";
    ea.style.roughness = roughness;
    ea.style.opacity = 50;
    ea.addLine(points);
};

const selected = ea.getViewSelectedElements().filter(el => el.type === "line" || el.type === "arrow" || el.type === "freedraw");
if (selected.length === 0) {
  new Notice("Please select at least one line or arrow to act as the cutter.");
  return;
}
log("Selected cutters count:", selected.length);

const allElements = ea.getViewElements().filter(el => 
  (el.type === "line" || el.type === "arrow" || el.type === "freedraw" || el.type === "image") 
  && !el.isDeleted
);
const cutters = selected;
const allElementsInView = ea.getViewElements().filter(e => !e.isDeleted);
const allFrames = allElementsInView.filter(e => e.type === "frame");

if (DEBUG) {
    console.error(`[SplitLines] Initial Scan: Found ${allElementsInView.length} elements, ${allFrames.length} are frames.`);
    if (allFrames.length === 0) {
        const types = [...new Set(allElementsInView.map(e => e.type))];
        console.error(`[SplitLines] NO FRAMES FOUND. Available types in scene: ${types.join(", ")}`);
    }
}
const targets = allElementsInView.filter(el => {
  const isSelected = selected.some(s => s.id === el.id);
  return !isSelected && (el.type === "line" || el.type === "arrow" || el.type === "freedraw" || el.type === "image");
});

if (targets.length === 0) {
    new Notice("No targets found to split.");
    return;
}

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

const toLocal = (p, target) => {
  const cx = target.x + target.width / 2;
  const cy = target.y + target.height / 2;
  const pRot = rotate(p, [cx, cy], -target.angle);
  return [pRot[0] - target.x, pRot[1] - target.y];
};

const getCurvePoints = (points) => {
  if (points.length < 2) return points;
  const result = [];
  
  // Simple Catmull-Rom Spline Interpolation (passing through control points)
  // Tension = 0.5 (standard Catmull-Rom)
  
  // Helper for 1D cubic interpolation
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

    // Push the actual point
    result.push(p1);

    // Approximate the curve segment between p1 and p2 with subdivisions
    // Increase density for better intersection accuracy (e.g. 3 steps)
    const steps = 3; 
    for (let j = 1; j < steps; j++) {
        const t = j / steps;
        const x = catmullRom1D(p0[0], p1[0], p2[0], p3[0], t);
        const y = catmullRom1D(p0[1], p1[1], p2[1], p3[1], t);
        result.push([x, y]);
    }
  }
  // Push the last point
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
    const corners = [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height]
    ];
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

  // EA WRAPPER FIX: Element x/y in Obsidian are ALREADY Absolute.
  // We MUST NOT add the frame offset here, or we get double offset.
  // V5.9: Removed frame addition block.

  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);

  if (DEBUG && el.id === targets[0]?.id) {
       console.error(`[SplitLines] getAbsPoints TARGET: id=${el.id}, x=${el.x}, frameId=${el.frameId}`);
       console.error(`[SplitLines] getAbsPoints Result: pts[0]=${pts[0]}`);
  }
  const margin = 10;
  const bbox = { 
      minX: Math.min(...xs) - margin, 
      maxX: Math.max(...xs) + margin, 
      minY: Math.min(...ys) - margin, 
      maxY: Math.max(...ys) + margin 
  };
  return { pts, bbox, frameId: el.frameId };
};

const bboxesIntersect = (a, b) => {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
};

const intersectSegments = (p1, p2, p3, p4) => {
  const x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1];
  const x3 = p3[0], y3 = p3[1], x4 = p4[0], y4 = p4[1];
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  
  // Use epsilon for fuzzy intersection
  const eps = 1e-6;
  if (ua >= -eps && ua <= 1 + eps && ub >= -eps && ub <= 1 + eps) {
    return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)];
  }
  return null;
};

const deletedElements = [];
const imageSplits = [];
const genId = () => Math.random().toString(36).substr(2, 9);

// Pre-calculate cutter points and bboxes
if (DEBUG) {
    const frames = ea.getViewElements().filter(e => e.type === "frame" && !e.isDeleted);
    console.log(`[SplitLines] DEBUG: Found ${frames.length} frames.`);
    frames.forEach(f => console.log(`[SplitLines] Frame ${f.id}: x=${f.x}, y=${f.y}, w=${f.width}, h=${f.height}`));
}
const processedCutters = cutters.map(c => getAbsPoints(c));
if (DEBUG) processedCutters.forEach((pc, i) => console.log(`Cutter ${i} BBox:`, pc.bbox));

// Main loop with async yielding
let processedCount = 0;
let bboxMatches = 0;
let segmentChecks = 0;

for (const target of targets) {
  processedCount++;

  const targetData = getAbsPoints(target);
  const targetPts = targetData.pts;
  
  // Optimization: Check BBox intersection with ANY cutter first
  // If target box doesn't touch any cutter box, skip detailed segment checks
  const potentialCutters = processedCutters.filter(cData => bboxesIntersect(targetData.bbox, cData.bbox));
  
  if (potentialCutters.length === 0) continue;
  bboxMatches++;

  // DEBUG VISUALIZATION (Only for candidates)
  if (DEBUG_VISUALS) {
     ea.style.strokeColor = "blue";
     ea.style.strokeWidth = 1;
     ea.style.strokeStyle = "dashed"; // Make it dashed so it's obvious
     ea.addRect(targetData.bbox.minX, targetData.bbox.minY, 
       targetData.bbox.maxX - targetData.bbox.minX, 
       targetData.bbox.maxY - targetData.bbox.minY);

     if(target.type === "image") drawDebugLine(targetPts, "blue", 0);
     else drawDebugLine(targetPts, "green", 0);
  }

  const loopPts = target.type === "image" ? [...targetPts, targetPts[0]] : targetPts;
  let intersections = [];
  for (let i = 0; i < loopPts.length - 1; i++) {
    const t1 = loopPts[i];
    const t2 = loopPts[i+1];
    
    // Iterate only through potential cutters
    for (const cutterData of potentialCutters) {
      const cutterPts = cutterData.pts;
      for (let j = 0; j < cutterPts.length - 1; j++) {
        segmentChecks++;
        const c1 = cutterPts[j];
        const c2 = cutterPts[j+1];
        
        const pt = intersectSegments(t1, t2, c1, c2);
        if (pt) {
            // ... (rest of logic)
            const cutterEl = cutters[processedCutters.indexOf(cutterData)]; 
             
          const dx = t2[0] - t1[0];
          const dy = t2[1] - t1[1];
          const t = (Math.abs(dx) > Math.abs(dy)) ? (pt[0] - t1[0]) / dx : (pt[1] - t1[1]) / dy;
          intersections.push({ segIdx: i, t, pt, cutter: cutterEl, cutterSegIdx: j });
        }
      }
    }
  }

  if (intersections.length > 0 && DEBUG) console.log(`Target ${target.id} has ${intersections.length} intersections.`);

  if (intersections.length === 0) continue;

  if (target.type === "image") {
    if (intersections.length >= 2) {
      imageSplits.push({ target, intersections });
    }
    continue;
  }
  
  intersections.sort((a, b) => a.segIdx !== b.segIdx ? a.segIdx - b.segIdx : a.t - b.t);
  
  let currentPoints = [targetPts[0]];
  let lastSegIdx = 0;
  
  const commitSegment = (pts) => {
    if (pts.length < 2) return;

    // STRATEGY 9: Pure Absolute Passthrough
    // We pass Scene Absolute points directly to Excalidraw.
    
    // Copy style from target
    ea.style.strokeColor = target.strokeColor;
    ea.style.strokeWidth = target.strokeWidth;
    ea.style.strokeStyle = target.strokeStyle;
    ea.style.roughness = target.roughness;
    ea.style.opacity = target.opacity;
    ea.style.strokeSharpness = target.strokeSharpness;
    ea.style.backgroundColor = target.backgroundColor;
    ea.style.fillStyle = target.fillStyle;
    
    // 1. FIND PARENT FRAME ROBUSTLY
    let frame = null;
    if (target.frameId) {
        frame = allFrames.find(f => f.id === target.frameId);
    }
    
    // Fallback: If no frameId, find any frame that contains the center of the points
    if (!frame) {
        const midX = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
        const midY = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
        frame = allFrames.find(f => 
            midX >= f.x && midX <= (f.x + f.width) &&
            midY >= f.y && midY <= (f.y + f.height)
        );
    }

    if (!frame && target.frameId) console.error(`[SplitLines] CRITICAL: Parent frame ${target.frameId} not found in view!`);

    // 2. TRANSFORM POINTS TO FRAME-RELATIVE BEFORE ADDING
    let finalPts = pts;
    if (frame) {
        finalPts = pts.map(p => [p[0] - frame.x, p[1] - frame.y]);
        if (DEBUG && target.id === targets[0]?.id) console.error(`[SplitLines] commitSegment: Frame found ${frame.id} (x=${frame.x}). Subtracting offset. finalPts[0]=${finalPts[0]}`);
    } else {
        if (DEBUG && target.id === targets[0]?.id) console.error(`[SplitLines] commitSegment: No Frame found. finalPts[0]=${finalPts[0]}`);
    }

    let id;
    if (target.type === "arrow") {
        id = ea.addArrow(finalPts);
    } else {
        id = ea.addLine(finalPts);
    }
    
    const added = ea.getElement(id);
    if (!added) return;
    
    added.angle = 0; 
    added.roundness = null; 
    
    if (frame) {
        added.frameId = frame.id;
    } else {
        added.frameId = null;
    }
    
    // Copy Group IDs
    if (target.groupIds && target.groupIds.length > 0) {
        added.groupIds = [...target.groupIds];
    }
  };
   
  
  for (const isect of intersections) {
    for (let k = lastSegIdx + 1; k <= isect.segIdx; k++) currentPoints.push(targetPts[k]);
    currentPoints.push(isect.pt);
    commitSegment(currentPoints);
    currentPoints = [isect.pt];
    lastSegIdx = isect.segIdx;
  }
  for (let k = lastSegIdx + 1; k < targetPts.length; k++) currentPoints.push(targetPts[k]);
  commitSegment(currentPoints);
  
  if (DEBUG) console.log("Marking target for deletion:", target.id);
  deletedElements.push(target);
}

if (DEBUG) console.log("Finished targets loop. Deleted count:", deletedElements.length);



if (imageSplits.length > 0) {
  // Wrap in async IIFE to ensure 'await' is always valid in all environments
  await (async () => {
    log("Processing image splits:", imageSplits.length);
    const scene = ea.targetView.getScene();
    const viewFiles = scene ? scene.files : {};
    const piecesToAdd = [];

    for (const split of imageSplits) {
      const { target, intersections } = split;
      intersections.sort((a, b) => a.cutterSegIdx - b.cutterSegIdx || a.t - b.t);
      const A = intersections[0];
      const B = intersections[intersections.length - 1];
      
      const corners = getAbsPoints(target).pts;
      const peri = [];
      for (let i = 0; i < 4; i++) {
          peri.push(corners[i]);
          const edgeIsects = intersections.filter(isect => isect.segIdx === i);
          if (edgeIsects.length > 0) {
              const start = corners[i];
              edgeIsects.sort((a, b) => {
                  const d1 = Math.pow(a.pt[0]-start[0], 2) + Math.pow(a.pt[1]-start[1], 2);
                  const d2 = Math.pow(b.pt[0]-start[0], 2) + Math.pow(b.pt[1]-start[1], 2);
                  return d1 - d2;
              });
              peri.push(...edgeIsects.map(isect => isect.pt));
          }
      }
      
      const idxA = peri.findIndex(pt => Math.pow(pt[0]-A.pt[0], 2) + Math.pow(pt[1]-A.pt[1], 2) < 0.01);
      const idxB = peri.findIndex(pt => Math.pow(pt[0]-B.pt[0], 2) + Math.pow(pt[1]-B.pt[1], 2) < 0.01);
      if (idxA === -1 || idxB === -1) continue;

      const cutterPts = getAbsPoints(A.cutter).pts;
      const pathAB = [A.pt];
      const startS = Math.min(A.cutterSegIdx, B.cutterSegIdx);
      const endS = Math.max(A.cutterSegIdx, B.cutterSegIdx);
      for (let k = startS + 1; k <= endS; k++) pathAB.push(cutterPts[k]);
      pathAB.push(B.pt);
      if (A.cutterSegIdx > B.cutterSegIdx) pathAB.reverse();

      const getPolyChain = (fromIdx, toIdx, points) => {
          const chain = [];
          let curr = fromIdx;
          while (curr !== toIdx) {
              curr = (curr + 1) % points.length;
              chain.push(points[curr]);
          }
          return chain;
      };

      const poly1 = [...pathAB, ...getPolyChain(idxB, idxA, peri)];
      const poly2 = [...pathAB.slice().reverse(), ...getPolyChain(idxA, idxB, peri)];
      const qScale = (target.scale && target.scale[0]) ? Math.min(5, Math.max(1, 1 / Math.abs(target.scale[0]))) : 2;

      await app.fileManager.processFrontMatter(ea.targetView.file, (fm) => {
          fm["excalidraw-mask"] = true;
      });
      
      const viewElements = ea.getViewElements();
      const bb = viewElements.length > 0 ? ea.getBoundingBox(viewElements) : { topX: 0, topY: 0, width: 0, height: 0 };
      const backyardX = Math.max((bb.topX + bb.width) + 5000, 10000);
      const backyardY = imageSplits.indexOf(split) * (target.height + 1000);

      const processPiece = (poly, pieceNum) => {
          const frameX = backyardX;
          const frameY = backyardY + (pieceNum - 1) * (target.height + 500);
          const w = target.width * qScale;
          const h = target.height * qScale;

          const frameId = ea.addFrame(frameX, frameY, w, h, `source-${target.id}-${pieceNum}`);
          const srcImgId = ea.addRect(frameX, frameY, w, h);
          const srcImg = ea.getElement(srcImgId);
          srcImg.type = "image";
          srcImg.fileId = target.fileId;
          srcImg.x = frameX; srcImg.y = frameY;
          srcImg.width = w; srcImg.height = h;
          srcImg.locked = true;
          srcImg.frameId = frameId;
          if (target.fileId && viewFiles[target.fileId]) ea.imagesDict[target.fileId] = viewFiles[target.fileId];

          const localPoly = poly.map(p => toLocal(p, target));
          ea.style.backgroundColor = "black";
          ea.style.fillStyle = "solid";
          ea.style.strokeWidth = 0;
          const bgId = ea.addRect(frameX, frameY, w, h);
          ea.getElement(bgId).frameId = frameId;
          ea.getElement(bgId).locked = true;

          ea.style.backgroundColor = "white"; 
          const maskId = ea.addLine([...localPoly, localPoly[0]].map(p => [p[0] * qScale + frameX, p[1] * qScale + frameY]));
          const maskEl = ea.getElement(maskId);
          maskEl.frameId = frameId;
          maskEl.backgroundColor = "white";
          maskEl.fillStyle = "solid";
          maskEl.locked = true;
          
          ea.getElement(frameId).locked = true;

          const pieceId = ea.addImage(target.x, target.y, target.fileId);
          const pieceImg = ea.getElement(pieceId);
          pieceImg.link = `[[${ea.targetView.file.basename}#^frame=${frameId}]]`;
          pieceImg.groupIds = [...target.groupIds];
          log(`Piece ${pieceNum} created using frame ${frameId}`);
      };

      processPiece(poly1, 1);
      processPiece(poly2, 2);
      deletedElements.push(target);
    }
    })();
}


  if (deletedElements.length > 0) {
    ea.copyViewElementsToEAforEditing(deletedElements);
    deletedElements.forEach(el => ea.getElement(el.id).isDeleted = true);
  }

  // Ensure excalidraw-mask is enabled in the file BEFORE adding elements (Only needed for Image Splits)
  if (imageSplits.length > 0) {
      const fileContent = await app.vault.read(ea.targetView.file);
      if (!fileContent.includes("excalidraw-mask: true")) {
        let updatedContent = fileContent;
        if (fileContent.startsWith("---")) {
          const parts = fileContent.split("---");
          if (parts.length >= 3) {
            if (!parts[1].includes("excalidraw-mask:")) {
              parts[1] += "excalidraw-mask: true\n";
              updatedContent = parts.join("---");
            }
          }
        } else {
          updatedContent = "---\nexcalidraw-mask: true\n---\n" + fileContent;
        }
        
        if (updatedContent !== fileContent) {
            await app.vault.modify(ea.targetView.file, updatedContent);
            log("Enabled excalidraw-mask in drawing frontmatter.");
            await new Promise(r => setTimeout(r, 200));
        }
      }
  }

  // GLOBAL: Add elements to view if anything changed
  const allNewElements = ea.getElements();
  if (allNewElements.length > 0 || deletedElements.length > 0) {
      await ea.addElementsToView(false, false, true);
      
      if (allNewElements.length > 0) {
          const c = cutters[0];
          const cF = c.frameId ? allFrames.find(f => f.id === c.frameId) : null;
          const cSceneX = c.x + (cF ? cF.x : 0);
          const cSceneY = c.y + (cF ? cF.y : 0);
          
          console.error(`[SplitLines] DIAGNOSTIC - Cutter ${c.id}: x=${c.x}, frameId=${c.frameId}, frameX=${cF?.x}`);
          
          const r = allNewElements[0];
          const rF = r.frameId ? allFrames.find(f => f.id === r.frameId) : null;
          const rSceneX = r.x + (rF ? rF.x : 0);
          const rSceneY = r.y + (rF ? rF.y : 0);

          console.error(`[SplitLines] DIAGNOSTIC - Result ${r.id}: x=${r.x}, frameId=${r.frameId}, frameX=${rF?.x}`);
          
          console.error(`[SplitLines] Final Summary: ${allNewElements.length} segments.`);
          console.error(`[SplitLines] Cutter Scene (X,Y): ${cSceneX.toFixed(1)}, ${cSceneY.toFixed(1)}`);
          console.error(`[SplitLines] Result Scene (X,Y): ${rSceneX.toFixed(1)}, ${rSceneY.toFixed(1)}`);
      }
      
      new Notice("Split complete!");
      log("Split complete and elements added to view.");
  } else {
      if (DEBUG_VISUALS) {
         ea.addElementsToView(true, false, false).then(() => {
             new Notice("Debug visualization enabled. Look for red/green lines.");
         });
      } else {
         new Notice("No intersections found.");
         log("No intersections found.");
      }
  }
})();
