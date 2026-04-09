const { useRef, useEffect } = dc;

const MatrixBackground = ({
    mainColor = '#d8b4fe', // Purple-300 (Much brighter)
    leadColor = '#ffffff', // White head for max contrast, then pinkish
    // Clean Katakana + Numbers
    charSet = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890",
    fontSize = 18,
    spacingFactor = 20.0, // WAS 5.0 - Higher spacing = fewer streams
    frequency = 0.5,
}) => {
    const wrapperRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const streamsRef = useRef([]);
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

    const mainColorToRGB = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };

    if (frequency === 0) {
        return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#0b0713' }} />
        );
    }

    const safeCharSet = String(charSet);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // --- Derive animation parameters from props ---
        const clampedFrequency = Math.max(0.01, Math.min(1, frequency));

        // Drastically reduce speeds as requested
        const minSpeed = 0.05 + (clampedFrequency * 0.1); // Was 0.1...
        const maxSpeed = 0.15 + (clampedFrequency * 0.2); // Was 0.3...

        const init = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = wrapper.clientWidth;
            const h = wrapper.clientHeight;

            if (w === 0 || h === 0) return;

            sizeRef.current = { w, h, dpr };
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';

            ctx.scale(dpr, dpr);
            ctx.textBaseline = 'top';
            ctx.font = `bold ${fontSize}px monospace`;

            // Calculate stream count based on USER REQUEST: "1 to 5-6 at a time"
            // This is extremely low density.
            // Using a very low multiplier for spacingFactor effectively reduces count.
            // Or we can cap it.

            // Standard Approach: High spacing = low count
            const rawCount = Math.floor(w / (fontSize * spacingFactor));
            const streamCount = Math.max(1, Math.min(10, rawCount)); // Cap at 10 max, aim for ~6 usually if safe

            streamsRef.current = Array.from({ length: streamCount }, () => ({
                x: Math.floor(Math.random() * (w / fontSize)) * fontSize,
                y: -Math.random() * h,
                speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
                char: safeCharSet[Math.floor(Math.random() * safeCharSet.length)],
                resetAt: h + (Math.random() * h * 0.2),
            }));
        };

        const draw = () => {
            const { w, h } = sizeRef.current;
            if (w === 0 || h === 0) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            // [FIX] Even lower opacity for longer trails
            ctx.fillStyle = 'rgba(11, 7, 19, 0.08)'; // Was 0.12
            ctx.fillRect(0, 0, w, h);

            ctx.font = `bold ${fontSize}px monospace`;

            for (let i = 0; i < streamsRef.current.length; i++) {
                const stream = streamsRef.current[i];
                const yPx = Math.floor(stream.y);

                // Randomly change character occasionally
                if (Math.random() < 0.05) {
                    stream.char = safeCharSet[Math.floor(Math.random() * safeCharSet.length)];
                }

                // Draw the "drop" (Taller segments)
                const dropLength = 4; // Number of characters in the "head"
                for (let j = 0; j < dropLength; j++) {
                    const yOffset = yPx - (j * fontSize * 0.8);
                    if (yOffset < 0) continue;

                    // Fade the segments: Lead is 1, tail of the head is 0.3
                    const alpha = 1 - (j / dropLength) * 0.7;
                    ctx.fillStyle = j === 0 ? leadColor : `rgba(${mainColorToRGB(mainColor)}, ${alpha})`;

                    // Slightly change character for lower segments for variety
                    const char = j === 0 ? stream.char : safeCharSet[Math.floor(Math.random() * safeCharSet.length)];
                    ctx.fillText(char, stream.x, yOffset);
                }

                stream.y += stream.speed * fontSize * 1.2; // Move slightly faster for longer segments

                if (stream.y > stream.resetAt) {
                    stream.y = -Math.random() * 100;
                    stream.speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
                }
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        let isInitialized = false;
        const start = () => {
            cancelAnimationFrame(rafRef.current);
            init();
            if (streamsRef.current.length > 0) {
                if (!isInitialized) {
                    const { w, h } = sizeRef.current;
                    ctx.fillStyle = '#0b0713';
                    ctx.fillRect(0, 0, w, h);
                    isInitialized = true;
                }
                draw();
            }
        };

        const ro = new ResizeObserver(start);
        ro.observe(wrapper);

        start();

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [mainColor, leadColor, safeCharSet, spacingFactor, fontSize, frequency]);

    return (
        <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#0b0713', pointerEvents: 'none' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
};

return { MatrixBackground };
