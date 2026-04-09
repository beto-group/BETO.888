function KineticTextSequence(props) {
    const { frame, RemotionReact } = props;
    const R = RemotionReact || dc.React;
    // Helper to allow JSX-like feel while ensuring we use the right renderer
    const h = (tag, props, ...children) => R.createElement(tag, props, ...children);

    const { color, text1, text2 } = KineticTextSequence.metadata.reduce((acc, item) => {
        acc[item.id] = props[item.id] !== undefined ? props[item.id] : item.default;
        return acc;
    }, {});

    // ... (logic remains same) ...
    // Note: I will replace the return with h() calls if I have to,
    // but first let's try defining React locally so the evaluator uses it.
    const React = R;

    // (Lines 8-251 same)
    // ...
    // Replacing the renderWord return with R.createElement
    const renderWord = (item, i, isLine2Row) => {
        // ... (lines 145-186)

        return R.createElement('div', {
            key: i,
            style: {
                display: 'flex',
                width: `${item.width}px`,
                justifyContent: 'center',
                alignItems: 'center',
                transformStyle: 'preserve-3d',
                whiteSpace: 'nowrap',
                flexShrink: 0
            }
        }, chars.map((char, charIdx) => {
            const charXLocal = startXLocal + (charIdx * charWidth);
            const absoluteVisualX = item.center + lineOffset + panX + charXLocal;
            const curveRadius = 1200;
            const angle = absoluteVisualX / curveRadius;
            const rotateY = -(angle * (180 / Math.PI));
            const curveZ = curveRadius * (Math.cos(angle) - 1);
            const progress = Math.min(1, Math.max(0, (frame - (isLine2Row ? line2StartFrame : seqStartTime) + i * wordDuration - 30) / 30));
            const isStarted = frame >= (isLine2Row ? line2StartFrame : seqStartTime) + (i * wordDuration) - 30;
            const isLine1Done = frame >= line2StartFrame;
            const isPast = frame > (isLine2Row ? line2StartFrame : seqStartTime) + (i * wordDuration) + 60 || (isLine2Row === false && isLine1Done);
            const opacity = !isStarted ? 0 : (isPast ? 1 : progress);
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOut(Math.min(1, Math.max(0, (frame - ((isLine2Row ? line2StartFrame : seqStartTime) + i * wordDuration - 30)) / 30)));
            const slideOffset = (1 - easedProgress) * 225;
            const scale = (isStarted && !isPast) ? 0.8 + (0.2 * easedProgress) : 1;

            return R.createElement('span', {
                key: `c_${charIdx}`,
                style: {
                    fontSize: `${fontSize}px`,
                    fontWeight: '900',
                    width: `${charWidth}px`,
                    display: 'inline-block',
                    textAlign: 'center',
                    color: color,
                    opacity: opacity,
                    transform: `translateX(${slideOffset}px) translateZ(${curveZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform'
                }
            }, char);
        }));
    };

    return R.createElement('div', {
        style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif",
            backgroundColor: 'transparent',
            overflow: 'hidden',
            perspective: '2000px'
        }
    }, R.createElement('div', {
        style: {
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: `translate3d(${panX}px, ${panY}px, 0)`,
            transformStyle: 'preserve-3d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            willChange: 'transform'
        }
    }, [
        R.createElement('div', {
            key: 'l1',
            style: {
                display: 'flex',
                marginBottom: '45px',
                transformStyle: 'preserve-3d'
            }
        }, line1Layout.map((item, i) => renderWord(item, i, false))),
        R.createElement('div', {
            key: 'l2',
            style: {
                display: 'flex',
                transform: `translateX(${line2XOffset}px)`,
                transformStyle: 'preserve-3d'
            }
        }, line2Layout.map((item, i) => renderWord(item, i, true)))
    ]));
}

KineticTextSequence.metadata = [
    { id: "category", type: "text", default: "foreground", hidden: true },
    { id: "text1", type: "text", default: "Work was never", label: "Line 1" },
    { id: "text2", type: "text", default: "meant to be this slow", label: "Line 2" },
    { id: "color", type: "color", default: "#000000", label: "Color" }
];

return { KineticTextSequence };
