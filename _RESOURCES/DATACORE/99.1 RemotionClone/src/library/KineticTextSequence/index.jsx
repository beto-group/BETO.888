function KineticTextSequence(props) {
    const { frame } = props;
    const { color, text1, text2 } = KineticTextSequence.metadata.reduce((acc, item) => {
        acc[item.id] = props[item.id] !== undefined ? props[item.id] : item.default;
        return acc;
    }, {});

    // Parsing Text Props
    let line1Words = text1 ? text1.split(' ') : ["Work", "was"];
    let line2Words = text2 ? text2.split(' ') : ["never", "meant", "to", "be", "this", "slow"];

    if (text1 === "Work was" && text2.startsWith("Work was never")) {
        line1Words = ["Work", "was", "never"];
        line2Words = ["meant", "to", "be", "this", "slow"];
    }

    // Config: Scaled UP 1.5x for "Closer" Look
    const fontSize = 240; // Was 160
    const wordDuration = 60;
    const transitionPause = 50; // Smoother than 35, faster than 65
    const seqStartTime = 40;

    const line1EndFrame = seqStartTime + line1Words.length * wordDuration;
    const line2StartFrame = line1EndFrame + transitionPause;

    // 1. Layout Data (Scaled 1.5x)
    // Reduced widths by ~20px for tighter spacing per user request
    const line1Widths = [690, 510, 750]; // Was [460, 340, 500]
    const line2Widths = [810, 360, 360, 480, 600]; // Was [540, 240, 240, 320, 400]

    // Calculate Centers AND Start/Ends
    const calculateLayout = (words, widths) => {
        let currentX = 0;
        return words.map((word, i) => {
            const width = widths[i] || (word.length * 100);
            const center = currentX + (width / 2);
            currentX += width;
            return { word, center, width };
        });
    };

    const line1Layout = calculateLayout(line1Words, line1Widths);
    const line2Layout = calculateLayout(line2Words, line2Widths);

    // 2. Continuous Tracking Logic
    const line2XOffset = -150; // Was -525, shifting way right to center "meant"

    // Helper to get absolute tracking target for a given "Global Word Index"
    const getTargetForIndex = (index) => {
        if (index < line1Layout.length) {
            // Line 1
            return line1Layout[index].center;
        } else {
            // Line 2 (Index offset by Line 1 length)
            const l2Index = index - line1Layout.length;
            // Clamp to avoid undefined errors if index overshoots
            if (l2Index < 0) return line1Layout[line1Layout.length - 1].center;
            if (l2Index >= line2Layout.length) return line2XOffset + line2Layout[line2Layout.length - 1].center;

            return line2XOffset + line2Layout[l2Index].center;
        }
    };

    const totalWords = line1Layout.length + line2Layout.length;
    let globalWordProgress = 0;

    // FIX: Transition Logic
    if (frame < line1EndFrame) {
        // Line 1 Progress
        const relativeFrame = Math.max(0, frame - seqStartTime);
        const rawProgress = relativeFrame / wordDuration;

        // CRITICAL FIX: Clamp to (Length - 1). 
        // Do NOT interpolate to next line yet. Stay on last word.
        // If rawProgress > 2.0 (in 3rd word), clamp to 2.0.
        globalWordProgress = Math.min(rawProgress, line1Layout.length - 1);

    } else if (frame < line2StartFrame) {
        // Transition Progress (Interpolate from End Index of Line 1 to Start Index of Line 2)
        const t = (frame - line1EndFrame) / transitionPause;

        // EaseInOut for smooth glide
        const smoothT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        // Glide from Last Word of Line 1 (Index 2) TO First Word of Line 2 (Index 3)
        const startIdx = line1Layout.length - 1;
        const endIdx = line1Layout.length;

        globalWordProgress = startIdx + (endIdx - startIdx) * smoothT;

    } else {
        // Line 2 Progress
        const relativeFrame = frame - line2StartFrame;
        const rawProgress = relativeFrame / wordDuration;

        // Base index is start of Line 2
        const baseIndex = line1Layout.length;

        // Same Clamping Logic: Don't overshoot ends
        const line2Progress = Math.min(rawProgress, line2Layout.length - 1);

        globalWordProgress = baseIndex + line2Progress;
    }

    // Cap progress
    globalWordProgress = Math.max(0, Math.min(globalWordProgress, totalWords - 1));

    // Calculate Interpolated Pan Target
    const indexFloor = Math.floor(globalWordProgress);
    const indexCeil = Math.min(totalWords - 1, indexFloor + 1);
    const fraction = globalWordProgress - indexFloor;

    const startTarget = getTargetForIndex(indexFloor);
    const endTarget = getTargetForIndex(indexCeil);

    // Linear Interpolation for constant "Reading Speed" glide
    const currentTarget = startTarget + (endTarget - startTarget) * fraction;

    // 3. Vertical Tracking (PanY)
    // Distance between Line 1 Center and Line 2 Center
    // Line 1 is top: 0. Line 2 is top: fontSize + 45px gap (30 * 1.5 = 45).
    // To center Line 2, we need to move the STAGE UP (negative Y) by that amount.
    const verticalOffset = -(fontSize + 45);

    let panY = 0;

    // Reuse the logic phases to determine Y
    if (frame < line1EndFrame) {
        panY = 0;
    } else if (frame < line2StartFrame) {
        // Transition: Interpolate Y
        const t = (frame - line1EndFrame) / transitionPause;
        const smoothT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        panY = smoothT * verticalOffset;
    } else {
        // Line 2: Full offset
        panY = verticalOffset;
    }

    const panX = -currentTarget;


    // RENDER HELPERS
    const renderWord = (item, i, isLine2Row) => {
        // wordStart shifted by seqStartTime
        const listStart = isLine2Row ? line2StartFrame : seqStartTime;
        const wordStart = listStart + (i * wordDuration);

        // LOOKAHEAD LOGIC: Start appearing BEFORE the word center is hit.
        const lookaheadFrames = 30; // Start 30 frames early (0.5s)
        const visibleStart = wordStart - lookaheadFrames;

        const isStarted = frame >= visibleStart;
        const isLine1Done = frame >= line2StartFrame;
        const isPast = frame > wordStart + wordDuration || (isLine2Row === false && isLine1Done);

        const active = isStarted && !isPast;

        // Smooth Opacity/Scale ramp
        const progress = Math.min(1, Math.max(0, (frame - visibleStart) / lookaheadFrames));

        // OPACITY FIX: Past words remain BLACK (1.0).
        const opacity = !isStarted ? 0 : (isPast ? 1 : progress);

        // SLIDE ANIMATION (from Right)
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOut(progress);

        const slideDistance = 225;
        const slideOffset = (1 - easedProgress) * slideDistance;

        const scale = active ? 0.8 + (0.2 * easedProgress) : 1;

        const lineOffset = isLine2Row ? line2XOffset : 0;

        // CHARACTER LEVEL RENDERING
        // To achieve a "smooth line" wave, we must curve each character individually.
        const chars = item.word.split('');
        // Distribute the hardcoded word width among characters
        // This keeps the perfect spacing we established but allows curvature.
        const charWidth = item.width / chars.length;

        // Starting X for the first character relative to the word center
        // wordCenter is 0 in local space. Left edge is -width/2.
        const startXLocal = -(item.width / 2) + (charWidth / 2);

        return (
            <div key={i} style={{
                // Word Container (Ghost) - Holds the position but logic is in chars
                display: 'flex',
                width: `${item.width}px`,
                justifyContent: 'center',
                alignItems: 'center',
                transformStyle: 'preserve-3d',
                whiteSpace: 'nowrap',
                flexShrink: 0
            }}>
                {chars.map((char, charIdx) => {
                    // Local position of char within word
                    const charXLocal = startXLocal + (charIdx * charWidth);

                    // Absolute Visual X for Curve Calculation
                    // Word Center (Global) + Line Offset + Global Pan + Char Offset (Local)
                    // Note: We apply slideOffset to the CONTAINER/Word usually, 
                    // but here we can apply it to the visualX or the transform.
                    // Let's match previous logic: Slide is an Animation offset.

                    // The "Visual X" for the LENS effect should probably NOT include the slide?
                    // If it includes the slide, the text "ripples" through the lens as it slides in.
                    // If it excludes the slide, the lens moves WITH the text.
                    // User said "wave line... smooth line".
                    // Let's base curve on the FINAL position (pan + static offsets) 
                    // and apply slide as a pure translation on top.

                    const absoluteVisualX = item.center + lineOffset + panX + charXLocal;

                    // Curve parameters (Lens Effect)
                    const curveRadius = 1200;
                    const angle = absoluteVisualX / curveRadius;

                    const rotateY = -(angle * (180 / Math.PI));
                    const curveZ = curveRadius * (Math.cos(angle) - 1);

                    // Tilt (Global Z-axis rotation based on X?)
                    // Previous tilt was rotateY. 
                    // User asked for "Tilt Wave".
                    // The Cylinder IS the tilt wave (Sides tilt back).
                    // We don't need extra tilt.

                    return (
                        <span key={`c_${charIdx}`} style={{
                            fontSize: `${fontSize}px`,
                            fontWeight: '900',
                            width: `${charWidth}px`,
                            display: 'inline-block',
                            textAlign: 'center',
                            color: color,
                            opacity: opacity,
                            transform: `translateX(${slideOffset}px) translateZ(${curveZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                            transformStyle: 'preserve-3d',
                            backfaceVisibility: 'hidden', // Clean up rendering
                            willChange: 'transform'
                        }}>
                            {char}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif",
            backgroundColor: 'transparent',
            overflow: 'hidden',
            perspective: '2000px'
        }}>
            <div style={{
                position: 'absolute',
                top: '35%',
                left: '50%',
                // Apply BOTH panX and panY
                transform: `translate3d(${panX}px, ${panY}px, 0)`,
                transformStyle: 'preserve-3d',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                willChange: 'transform'
            }}>
                {/* Line 1 */}
                <div style={{
                    display: 'flex',
                    marginBottom: '45px', // Scaled 1.5x (was 30)
                    transformStyle: 'preserve-3d'
                }}>
                    {line1Layout.map((item, i) => renderWord(item, i, false))}
                </div>

                {/* Line 2 */}
                <div style={{
                    display: 'flex',
                    transform: `translateX(${line2XOffset}px)`,
                    transformStyle: 'preserve-3d'
                }}>
                    {line2Layout.map((item, i) => renderWord(item, i, true))}
                </div>
            </div>
        </div>
    );
}

KineticTextSequence.metadata = [
    { id: "category", type: "text", default: "foreground", hidden: true },
    { id: "text1", type: "text", default: "Work was never", label: "Line 1" },
    { id: "text2", type: "text", default: "meant to be this slow", label: "Line 2" },
    { id: "color", type: "color", default: "#000000", label: "Color" }
];

return { KineticTextSequence };
