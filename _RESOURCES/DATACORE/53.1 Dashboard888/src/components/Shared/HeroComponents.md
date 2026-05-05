
# HeroComponents

```jsx
const { useEffect, useRef, useState, useCallback, useMemo } = dc;
const { MediaResolver, getMediaResourcePath } = await dc.require(dc.headerLink(dc.resolvePath("src/utils/MediaResolver.md"), "MediaResolver"));
const { IMG_EXTS, VID_EXTS } = await dc.require(dc.headerLink(dc.resolvePath("src/utils/CommonUtils.md"), "CommonUtils"));

/**
 * OverlayLogo - Standardized Matrix-style animated logo
 */
const OverlayLogo = ({ size = 60, animated = true, color = "var(--glow)" }) => {
    return (
        <div
            className={animated ? 'is-animating' : ''}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size
            }}
        >
            <style>{`
                @keyframes animate-top-outer { 0%{transform:rotate(0deg)} 35%{transform:rotate(360deg)} 60%{transform:rotate(360deg)} 75%{transform:rotate(720deg)} 100%{transform:rotate(720deg)} }
                @keyframes animate-top-inner { 0%{transform:rotate(0deg)} 35%{transform:rotate(-360deg)} 60%{transform:rotate(-360deg)} 75%{transform:rotate(-720deg)} 100%{transform:rotate(-720deg)} }
                @keyframes animate-bl-outer { 0%{transform:rotate(0deg)} 35%{transform:rotate(-360deg)} 40%{transform:rotate(-360deg)} 55%{transform:rotate(-720deg)} 100%{transform:rotate(-720deg)} }
                @keyframes animate-bl-inner { 0%{transform:rotate(0deg)} 35%{transform:rotate(360deg)} 40%{transform:rotate(360deg)} 55%{transform:rotate(720deg)} 100%{transform:rotate(720deg)} }
                @keyframes animate-br-outer { 0%{transform:rotate(0deg)} 35%{transform:rotate(360deg)} 80%{transform:rotate(360deg)} 95%{transform:rotate(720deg)} 100%{transform:rotate(720deg)} }
                @keyframes animate-br-inner { 0%{transform:rotate(0deg)} 35%{transform:rotate(-360deg)} 80%{transform:rotate(-360deg)} 95%{transform:rotate(-720deg)} 100%{transform:rotate(-720deg)} }

                #top-arc-outer, #top-arc-inner { transform-origin: 1277px 1209px; }
                #bottom-left-arc-outer, #bottom-left-arc-inner { transform-origin: 643px 1209px; }
                #bottom-right-arc-outer, #bottom-right-arc-inner { transform-origin: 1277px 1209px; }

                .is-animating #top-arc-outer { animation: animate-top-outer 10s linear infinite; }
                .is-animating #top-arc-inner { animation: animate-top-inner 10s linear infinite; }
                .is-animating #bottom-left-arc-outer { animation: animate-bl-outer 10s linear infinite; }
                .is-animating #bottom-left-arc-inner { animation: animate-bl-inner 10s linear infinite; }
                .is-animating #bottom-right-arc-outer { animation: animate-br-outer 10s linear infinite; }
                .is-animating #bottom-right-arc-inner { animation: animate-br-inner 10s linear infinite; }
            `}</style>
            <svg width={size} height={size} viewBox="0 0 1920 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="BETO_W_wrapper" data-name="BETO [W]">
                    <g id="top-arc-group" transform="rotate(240.25 , 960, 688.75) translate(-290 -500.25)">
                        <path id="top-arc-inner" fill={color} d="M1276.71,1378.94c-87.06,0-159.64-65.2-168.83-151.66-.99-9.28,5.73-17.6,15.01-18.59,9.29-1.01,17.6,5.73,18.59,15.01,7.36,69.23,65.49,121.44,135.22,121.44,74.99,0,135.99-61,135.99-135.99s-61.01-135.99-135.99-135.99c-18.77,0-36.94,3.75-54,11.14-8.57,3.71-18.51-.23-22.22-8.79-3.71-8.57.23-18.51,8.79-22.22,21.33-9.24,44.01-13.92,67.43-13.92,93.62,0,169.79,76.16,169.79,169.79s-76.16,169.78-169.79,169.78Z" />
                        <path id="top-arc-outer" fill={color} d="M1276.71,1514.18c-144.58,0-270.25-102.73-298.8-244.27-5.54-27.44,12.22-54.18,39.67-59.71,27.41-5.51,54.18,12.22,59.71,39.67,19.05,94.41,102.91,162.94,199.42,162.94,112.18,0,203.44-91.26,203.44-203.44s-91.26-203.44-203.44-203.44c-21.99,0-43.6,3.48-64.23,10.33-26.58,8.82-55.26-5.55-64.09-32.12-8.83-26.57,5.55-55.26,32.12-64.09,30.96-10.29,63.33-15.51,96.21-15.51,168.08,0,304.82,136.74,304.82,304.82s-136.74,304.82-304.82,304.82Z" />
                    </g>
                    <g id="bottom-left-arc-group">
                        <path id="bottom-left-arc-inner" fill={color} d="M643.37,1378.94c-93.62,0-169.78-76.16-169.78-169.78s76.16-169.79,169.78-169.79c23.42,0,46.1,4.68,67.43,13.92,8.56,3.71,12.5,13.66,8.79,22.22-3.71,8.56-13.65,12.5-22.22,8.79-17.06-7.39-35.23-11.14-54-11.14-74.99,0-135.99,61.01-135.99,135.99s61.01,135.99,135.99,135.99c69.73,0,127.87-52.21,135.22-121.44.99-9.28,9.28-16.03,18.59-15.01,9.28.99,16,9.31,15.02,18.59-9.19,86.46-81.77,151.66-168.83,151.66Z" />
                        <path id="bottom-left-arc-outer" fill={color} d="M643.37,1514.18c-168.08,0-304.82-136.74-304.82-304.82s136.74-304.82,304.82-304.82c32.88,0,65.25,5.22,96.21,15.51,26.57,8.83,40.95,37.53,32.12,64.09s-37.53,40.96-64.09,32.12c-20.63-6.86-42.24-10.33-64.24-10.33-112.18,0-203.44,91.26-203.44,203.44s91.26,203.44,203.44,203.44c96.51,0,180.37-68.53,199.42-162.94,5.54-27.44,32.27-45.22,59.71-39.67,27.44,5.53,45.21,32.27,39.67,59.71-28.55,141.54-154.22,244.27-298.8,244.27Z" />
                    </g>
                    <g id="bottom-right-arc-group">
                        <path id="bottom-right-arc-inner" fill={color} d="M1276.71,1378.94c-87.06,0-159.64-65.2-168.83-151.66-.99-9.28,5.73-17.6,15.01-18.59,9.29-1.01,17.6,5.73,18.59,15.01,7.36,69.23,65.49,121.44,135.22,121.44,74.99,0,135.99-61,135.99-135.99s-61.01-135.99-135.99-135.99c-18.77,0-36.94,3.75-54,11.14-8.57,3.71-18.51-.23-22.22-8.79-3.71-8.57.23-18.51,8.79-22.22,21.33-9.24,44.01-13.92,67.43-13.92,93.62,0,169.79,76.16,169.79,169.79s-76.16,169.78-169.79,169.78Z" />
                        <path id="bottom-right-arc-outer" fill={color} d="M1276.71,1514.18c-144.58,0-270.25-102.73-298.8-244.27-5.54-27.44,12.22-54.18,39.67-59.71,27.41-5.51,54.18,12.22,59.71,39.67,19.05,94.41,102.91,162.94,199.42,162.94,112.18,0,203.44-91.26,203.44-203.44s-91.26-203.44-203.44-203.44c-21.99,0-43.6,3.48-64.23,10.33-26.58,8.82-55.26-5.55-64.09-32.12-8.83-26.57,5.55-55.26,32.12-64.09,30.96-10.29,63.33-15.51,96.21-15.51,168.08,0,304.82,136.74,304.82,304.82s-136.74,304.82-304.82,304.82Z" />
                    </g>
                </g>
            </svg>
        </div>
    );
};

const MatrixRain = ({
    mainColor = 'oklch(0.82 0.21 300)', // The color of the fading trail
    leadColor = 'oklch(0.95 0.08 300)', // The color of the bright, leading character
    charSet = "癸 őt ABCD 𒈹 EFGH 𒎓 IJKL MNOP QRST UVWX YZ 𒀭 0123 4567 89 𒄭 𒉍 𒀏 𒅆 𒍑 𒇻 {} vattabb USD $ @ # 𒅖 𒍪 𒈨 findIndex fetchAll API",
    fontSize = 16,
    spacingFactor = 2.5, // Controls average stream density. Smaller number = more streams.
    frequency = 0.5,      // Controls speed and refresh rate (0 to 1)
    fadeColor = 'rgba(11, 7, 19, 0.15)', // Color used to fade previous frames
}) => {
    const wrapperRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const streamsRef = useRef([]); // Renamed from columnsRef for clarity
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
    const isVisibleRef = useRef(true);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        // --- GPU LAYER PROMOTION ---
        wrapper.style.willChange = 'transform, opacity';
        wrapper.style.transform = 'translateZ(0)';

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting;
            },
            { threshold: 0 }
        );
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, []);

    const safeCharSet = String(charSet);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // --- Derive animation parameters from props ---
        const clampedFrequency = Math.max(0, Math.min(1, frequency));
        const minSpeed = 0.2 + (clampedFrequency * 0.5);
        const maxSpeed = 0.5 + (clampedFrequency * 1.0);
        const resetHeightMultiplier = 50 - (clampedFrequency * 48);

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
            ctx.font = `${fontSize}px monospace`;

            const streamCount = Math.floor(w / (fontSize * Math.max(0.5, spacingFactor * 1.2))); // Slight optimization

            streamsRef.current = Array.from({ length: streamCount }, () => ({
                x: Math.random() * w,
                y: -Math.random() * h,
                speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
                resetAt: h + (Math.random() * h * 0.5),
            }));
        };

        const draw = () => {
            if (!isVisibleRef.current) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            const { w, h } = sizeRef.current;
            if (w === 0 || h === 0) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            ctx.fillStyle = fadeColor;
            ctx.fillRect(0, 0, w, h);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < streamsRef.current.length; i++) {
                const stream = streamsRef.current[i];

                const yPx = Math.floor(stream.y);
                const randomChar = safeCharSet[Math.floor(Math.random() * safeCharSet.length)];

                ctx.fillStyle = mainColor;
                ctx.fillText(randomChar, stream.x, yPx);

                ctx.fillStyle = leadColor;
                ctx.fillText(randomChar, stream.x, yPx);

                stream.y += stream.speed * fontSize * 0.2; // Adjust speed based on font size

                if (stream.y > stream.resetAt) {
                    stream.y = -Math.random() * resetHeightMultiplier * fontSize;
                    stream.x = Math.random() * w; // Re-randomize X position to break the grid
                    stream.speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
                }
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        let isInitialized = false;
        const start = () => {
            if (!wrapper || !canvas) return;
            const w = wrapper.clientWidth;
            const h = wrapper.clientHeight;
            if (w === 0 || h === 0) return;
            
            cancelAnimationFrame(rafRef.current);
            init();
            const { w: sw, h: sh } = sizeRef.current;
            if (clampedFrequency <= 0) {
                // Wipe canvas once and stop
                ctx.clearRect(0, 0, sw, sh);
                return;
            }
            ctx.fillStyle = fadeColor.replace(/0\.15\)$/, '1)'); // Use solid fadeColor for initial wipe
            ctx.fillRect(0, 0, sw, sh);
            isInitialized = true;
            draw();
        };

        const ro = new ResizeObserver(() => {
            // Decouple layout notification from callback to fix the loop error
            requestAnimationFrame(start);
        });
        ro.observe(wrapper);

        start();

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [mainColor, leadColor, safeCharSet, spacingFactor, fontSize, frequency]);

    return (
        <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'var(--background-primary)' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
};

const NavItem = (dc.memo || ((c) => c))(({ slide, index, isActive, media, onClick, isMobile, isPaused, timerDuration, styles }) => {
    return (
        <div
            className={`showcaseNavItem ${isActive ? "is-active" : ""}`}
            style={{
                padding: "6px",
                gap: "10px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                cursor: "pointer",
                position: "relative",
                willChange: 'transform, opacity',
                transform: 'translateZ(0)', // Force GPU layer per item
            }}
            onClick={onClick}
        >
            {media?.thumb ? (
                <img
                    src={media.thumb}
                    className="navItemThumb"
                    style={{
                        transform: slide.flipMedia ? "scaleX(-1)" : "none",
                        filter: 'var(--media-filter)',
                        contentVisibility: 'auto',
                        imageRendering: 'auto',
                    }}
                    alt={`${slide.title} thumbnail`}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div className="navItemThumb" style={{ background: "var(--surface-primary)" }}></div>
            )}
            <div className="navItemText">
                <h3
                    style={{
                        ...(styles.h2 || {}),
                        fontSize: "14px",
                        margin: 0,
                        fontVariant: "small-caps",
                        pointerEvents: 'none', // Optimization
                    }}
                >
                    {slide.title}
                </h3>
                {!isMobile && (
                    <p
                        style={{
                            fontSize: "12px",
                            margin: "4px 0 0 0",
                            fontVariant: "small-caps",
                            pointerEvents: 'none', // Optimization
                        }}
                    >
                        {slide.subtitle}
                    </p>
                )}
            </div>
            {isActive && (
                <div
                    key={`${slide.id}-${index}-progress`}
                    className="navProgress"
                    style={{
                        animation: `progress ${timerDuration / 1000}s linear forwards`,
                        animationPlayState: isPaused ? "paused" : "running",
                        willChange: 'transform',
                    }}
                />
            )}
        </div>
    );
});

const Showcase = ({
    slides,
    onButtonClick,
    buttonTextTemplate,
    imageDir,
    videoDir,
    getThumbName,
    styles = {} // Accept passed styles
}) => {
    const TIMER_DURATION = 8000;
    const [activeId, setActiveId] = useState(() => slides?.[0]?.id || null);
    const [isPaused, setIsPaused] = useState(false);
    const [mediaMap, setMediaMap] = useState({});
    const slideIntervalRef = useRef(null);
    const activeVideoRef = useRef(null);
    const wrapperRef = useRef(null);
    const navRef = useRef(null);
    const trackRef = useRef(null);
    const position = useRef(0);
    const velocity = useRef(0);
    const animationFrameId = useRef(null);
    const isAutoScrolling = useRef(true);
    const touchStartPos = useRef(0);
    const lastDelta = useRef(0);
    const [containerDimension, setContainerDimension] = useState(0);
    const snapTimeoutId = useRef(null);
    const snapTarget = useRef(null);
    const isSnapping = useRef(false);
    const slideMetrics = useRef([]);
    const [isMobileLayout, setIsMobileLayout] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth < 768;
        }
        return false;
    });
    useEffect(() => {
        const element = wrapperRef.current;
        if (!element) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const isMobile = entry.contentRect.width < 768;
                // Only update state if layout mode actually changes
                setIsMobileLayout(prev => {
                    if (prev !== isMobile) return isMobile;
                    return prev;
                });
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const track = trackRef.current;
        const navEl = navRef.current;
        if (
            !track ||
            !navEl ||
            track.children.length === 0 ||
            slides.length === 0
        )
            return;
        const isVertical = !isMobileLayout;
        const slideElements = Array.from(track.children).slice(0, slides.length);
        if (slideElements.length === 0) return;
        slideMetrics.current = slideElements.map((el) => {
            const style = window.getComputedStyle(el);
            const margin = isVertical
                ? parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10)
                : parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);
            return {
                offset: isVertical ? el.offsetTop : el.offsetLeft,
                size: (isVertical ? el.offsetHeight : el.offsetWidth) + margin,
            };
        });
        const slideBlockDimension = slideMetrics.current.reduce(
            (sum, metric) => sum + metric.size,
            0
        );
        const currentContainerDimension = isVertical
            ? navEl.clientHeight
            : navEl.clientWidth;
        setContainerDimension(currentContainerDimension);
        if (currentContainerDimension === 0 || slideBlockDimension === 0) return;
        const worldDimension = slideBlockDimension + currentContainerDimension;
        
        const calculateInitialPosition = () => {
            if (slideMetrics.current.length === 0) return 0;
            const viewportCenter = currentContainerDimension / 2;
            const firstSlideMetric = slideMetrics.current[0];
            const firstSlideCenter =
                firstSlideMetric.offset + firstSlideMetric.size / 2;
            return viewportCenter - firstSlideCenter;
        };
        const initialPosition = calculateInitialPosition();
        position.current = initialPosition;
        velocity.current = 0;
        isAutoScrolling.current = true;
        if (isMobileLayout) {
            isAutoScrolling.current = false;
        }
        const stopAnimation = () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
        const animate = () => {
            if (isSnapping.current && snapTarget.current !== null) {
                const distance = snapTarget.current - position.current;
                if (Math.abs(distance) < 0.1) {
                    position.current = snapTarget.current;
                    isSnapping.current = false;
                    snapTarget.current = null;
                    velocity.current = 0;
                } else {
                    position.current += distance * 0.15;
                }
            } else {
                if (!isAutoScrolling.current) {
                    velocity.current *= 0.94;
                }
                position.current += velocity.current;
            }
            
            const loopUnit = slideBlockDimension + currentContainerDimension;
            
            if (position.current < -loopUnit) {
                position.current += loopUnit;
            } else if (position.current > 0) {
                position.current -= loopUnit;
            }

            const isFast = Math.abs(velocity.current) > 2;
            const transformValue = isVertical
                ? `translate3d(0, ${position.current}px, 0)`
                : `translate3d(${position.current}px, 0, 0)`;
            
            track.style.transform = transformValue;
            track.style.pointerEvents = isFast ? 'none' : 'auto';

            if (
                isSnapping.current ||
                Math.abs(velocity.current) > 0.01 ||
                (isAutoScrolling.current && isVertical)
            ) {
                animationFrameId.current = requestAnimationFrame(animate);
            } else {
                stopAnimation();
            }
        };
        const startAnimation = () => {
            if (!animationFrameId.current) {
                animationFrameId.current = requestAnimationFrame(animate);
            }
        };
        track.style.transform = isVertical
            ? `translateY(${initialPosition}px)`
            : `translateX(${initialPosition}px)`;
        startAnimation();
        const triggerSnapToCenter = () => {
            clearTimeout(snapTimeoutId.current);
            snapTimeoutId.current = setTimeout(() => {
                const viewportCenter = currentContainerDimension / 2;
                let minDistance = Infinity;
                let bestSnapTarget = null;
                const currentPosition = position.current;
                const allPossibleTargets = [];
                slideMetrics.current.forEach((metric) => {
                    const itemCenter = metric.offset + metric.size / 2;
                    allPossibleTargets.push(viewportCenter - itemCenter);
                    allPossibleTargets.push(
                        viewportCenter - (itemCenter + worldDimension)
                    );
                });
                allPossibleTargets.forEach((target) => {
                    const distance = Math.abs(currentPosition - target);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestSnapTarget = target;
                    }
                });
                if (bestSnapTarget !== null) {
                    snapTarget.current = bestSnapTarget;
                    isSnapping.current = true;
                    startAnimation();
                }
            }, 100);
        };
        if (isAutoScrolling.current && isVertical) {
            setTimeout(() => {
                if (isAutoScrolling.current && isVertical) {
                    velocity.current = -0.3;
                    startAnimation();
                }
            }, 1500);
        }
        const handleInteractionStart = () => {
            isAutoScrolling.current = false;
            isSnapping.current = false;
            snapTarget.current = null;
            clearTimeout(snapTimeoutId.current);
            stopAnimation();
        };
        const handleInteractionEnd = () => {
            triggerSnapToCenter();
        };
        const handleWheel = (e) => {
            if (e.cancelable) e.preventDefault();
            handleInteractionStart();
            const scrollDelta = isVertical ? e.deltaY : e.deltaX + e.deltaY;
            const sens = 0.02;
            const maxVel = 60;
            
            velocity.current += scrollDelta * sens;
            if (Math.abs(velocity.current) > maxVel) {
                velocity.current = Math.sign(velocity.current) * maxVel;
            }
            
            startAnimation();
            triggerSnapToCenter();
        };
        const handleTouchStart = (e) => {
            handleInteractionStart();
            touchStartPos.current = isVertical
                ? e.touches[0].clientY
                : e.touches[0].clientX;
            lastDelta.current = 0;
        };
        const handleTouchMove = (e) => {
            if (e.cancelable) e.preventDefault();
            const currentPos = isVertical
                ? e.touches[0].clientY
                : e.touches[0].clientX;
            const delta = currentPos - touchStartPos.current;
            const moveDelta = delta - lastDelta.current;
            position.current += moveDelta;
            lastDelta.current = delta;
            velocity.current = moveDelta;
            startAnimation();
        };
        navEl.addEventListener("wheel", handleWheel, { passive: false });
        navEl.addEventListener("touchstart", handleTouchStart, { passive: true });
        navEl.addEventListener("touchmove", handleTouchMove, { passive: false });
        navEl.addEventListener("touchend", handleInteractionEnd, {
            passive: true,
        });
        navEl.addEventListener("touchcancel", handleInteractionEnd, {
            passive: true,
        });
        return () => {
            stopAnimation();
            clearTimeout(snapTimeoutId.current);
            navEl.removeEventListener("wheel", handleWheel);
            navEl.removeEventListener("touchstart", handleTouchStart);
            navEl.removeEventListener("touchmove", handleTouchMove);
            navEl.removeEventListener("touchend", handleInteractionEnd);
            navEl.removeEventListener("touchcancel", handleInteractionEnd);
        };
    }, [isMobileLayout, slides.length]);
    const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
    )?.matches;
    const saveData = navigator.connection?.saveData === true;
    const allowVideo = !reduceMotion && !saveData;
    const resolveFor = useCallback(
        async (slide, isPriority = false) => {
            const base = slide.file;
            
            // Only fallback if the property is TRULY missing (undefined).
            // null or "" means "I explicitly want this to be empty".
            const thumbQuery = (slide.cover !== undefined) 
                ? slide.cover 
                : `${imageDir}/${getThumbName(slide)}`;
            
            const queries = [];
            if (thumbQuery !== undefined && thumbQuery !== null && thumbQuery !== "") {
                queries.push({ query: thumbQuery, opts: { preferDir: imageDir, preferExts: ['webp', ...IMG_EXTS] } });
            } else {
                queries.push(null); // Placeholder for batch index alignment
            }
            
            if (isPriority) {
                const vidQuery = (slide.video !== undefined)
                    ? slide.video
                    : `${videoDir}/${base}`;
                
                if (vidQuery !== undefined && vidQuery !== null && vidQuery !== "") {
                    queries.push({ query: vidQuery, opts: { preferDir: videoDir, preferExts: VID_EXTS } });
                } else {
                    queries.push(null);
                }
            }

            const results = await MediaResolver.resolveBatch(queries.filter(q => q !== null));
            let resIdx = 0;
            return { 
                thumb: queries[0] ? results[resIdx++] : null,
                vid: (isPriority && queries[1]) ? results[resIdx++] : null 
            };
        },
        [imageDir, videoDir, getThumbName]
    );

    const inflightRef = useRef(new Set());
    useEffect(() => {
        if (!slides.length) return;
        
        const loadPackets = async () => {
            const pendingSlides = slides.filter(s => !mediaMap[s.id] && !inflightRef.current.has(s.id));
            if (pendingSlides.length === 0) return;

            pendingSlides.forEach(s => inflightRef.current.add(s.id));
            
            const resolvedPackets = await Promise.all(pendingSlides.map(async s => {
                const res = await resolveFor(s, s.id === activeId);
                return { id: s.id, res };
            }));

            setMediaMap(prev => {
                const next = { ...prev };
                resolvedPackets.forEach(p => {
                    next[p.id] = p.res;
                    inflightRef.current.delete(p.id);
                });
                return next;
            });
        };

        loadPackets();
    }, [slides, activeId]);

    useEffect(() => {
        if (!activeId || (mediaMap[activeId] && mediaMap[activeId].vid)) return;
        
        const slide = slides.find(s => s.id === activeId);
        if (!slide) return;

        resolveFor(slide, true).then(resolved => {
            setMediaMap(prev => ({
                ...prev,
                [activeId]: { ...(prev[activeId] || {}), ...resolved }
            }));
        });
    }, [activeId]);
    
    const stopAutoSlide = useCallback(
        () => clearInterval(slideIntervalRef.current),
        []
    );
    
    const startAutoSlide = useCallback(() => {
        stopAutoSlide();
        if (isPaused || slides.length < 2) return;
        slideIntervalRef.current = setInterval(() => {
            setActiveId((currentId) => {
                const currentIndex = slides.findIndex((s) => s.id === currentId);
                return slides[(currentIndex + 1) % slides.length].id;
            });
        }, TIMER_DURATION);
    }, [isPaused, slides, stopAutoSlide]);

    useEffect(() => {
        activeVideoRef.current?.play().catch(() => { });
        startAutoSlide();
        return stopAutoSlide;
    }, [activeId, isPaused, startAutoSlide, stopAutoSlide]);
    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => setIsPaused(false);
    const activeSlide = slides.find((s) => s.id === activeId);
    if (!activeSlide) return <div className="homeShowcase">Loading...</div>;
    return (
        <div
            ref={wrapperRef}
            className={`homeShowcase ${isMobileLayout ? "is-mobile-layout" : ""}`}
        >
            <div
                className="showcaseFeatured"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div style={styles.showcaseMedia || {}}>
                        <div
                            key={activeSlide.id + "-media-wrapper"}
                            className="showcase-media-anim"
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                position: 'relative', 
                                overflow: 'hidden' 
                            }}
                        >
                            {(() => {
                                const ensureUnit = (v) => {
                                    if (!v) return "50%";
                                    v = String(v).trim();
                                    if (!v.endsWith('%') && !v.endsWith('px') && !v.endsWith('vh') && !v.endsWith('vw')) return v + "%";
                                    return v;
                                };

                                const pos = (activeSlide.media_position || "50% 50%").trim().split(/\s+/);
                                const posX = ensureUnit(pos[0]);
                                const posY = ensureUnit(pos[1]);
                                const scale = !isNaN(parseFloat(activeSlide.media_scale)) ? parseFloat(activeSlide.media_scale) : 1;
                                
                                const mediaStyle = {
                                    ...(styles.showcaseMediaAsset || {}),
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    border: 'none',
                                    padding: 0,
                                    margin: 0,
                                    filter: 'var(--media-filter)',
                                    transition: 'none',
                                    // Infinity Panning: convert 0-100% to offset from center
                                    left: '50%',
                                    top: '50%',
                                    transform: `translate(calc(${posX} - 50%), calc(${posY} - 50%)) translate(-50%, -50%) ${activeSlide.flipMedia ? "scaleX(-1)" : ""} scale(${scale})`.trim(),
                                    transformOrigin: 'center center'
                                };

                                return allowVideo && mediaMap[activeId]?.vid ? (
                                    <video
                                        ref={activeVideoRef}
                                        key={mediaMap[activeId].vid + pos + scale}
                                        src={mediaMap[activeId].vid}
                                        style={mediaStyle}
                                        autoPlay muted loop playsInline
                                    />
                                ) : mediaMap[activeId]?.thumb ? (
                                    <img
                                        key={mediaMap[activeId].thumb + pos + scale}
                                        src={mediaMap[activeId].thumb}
                                        style={mediaStyle}
                                        alt={activeSlide.title}
                                        loading="eager"
                                    />
                                ) : null;
                            })()}
                        </div>
                    </div>
                <div style={styles.showcaseMediaOverlay || {}}></div>
                <div
                    key={activeSlide.id + "-content"}
                    className="showcase-content-anim"
                    style={styles.showcaseContent || {}}
                >
                    <h2
                        style={{
                            ...(styles.h1 || {}),
                            fontSize: "clamp(2rem, 5vw, 2.75rem)",
                            margin: 0,
                            color: "var(--glow)",
                            fontVariant: "small-caps",
                        }}
                    >
                        {activeSlide.title}
                    </h2>
                    <p
                        style={{
                            fontSize: "1rem",
                            color: "var(--text-normal)",
                            margin: "12px 0 24px 0",
                            lineHeight: 1.6,
                        }}
                    >
                        {activeSlide.description}
                    </p>
                    <button
                        className="btn"
                        style={{ ...(styles.btn || {}), fontVariant: "small-caps" }}
                        onClick={() => onButtonClick(activeSlide)}
                    >
                        {buttonTextTemplate(activeSlide.title)}
                    </button>
                </div>
            </div>
            <div ref={navRef} className="showcaseNav" style={{ contain: 'paint' }}>
                <div 
                    ref={trackRef} 
                    className="showcaseNav-track"
                    style={{ 
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        perspective: 1000
                    }}
                >
                    {slides.map((slide, index) => (
                        <NavItem
                            key={`${slide.id}-${index}`}
                            slide={slide}
                            index={index}
                            isActive={slide.id === activeId}
                            media={mediaMap[slide.id]}
                            onClick={() => setActiveId(slide.id)}
                            isMobile={isMobileLayout}
                            isPaused={isPaused}
                            timerDuration={TIMER_DURATION}
                            styles={styles}
                        />
                    ))}
                    <div
                        style={{
                            [isMobileLayout
                                ? "width"
                                : "height"]: isMobileLayout ? "300px" : `${containerDimension}px`,
                            flexShrink: 0,
                        }}
                    />
                    {slides.map((slide, index) => (
                        <NavItem
                            key={`buffer-${slide.id}-${index}`}
                            slide={slide}
                            index={index}
                            isActive={slide.id === activeId}
                            media={mediaMap[slide.id]}
                            onClick={() => setActiveId(slide.id)}
                            isMobile={isMobileLayout}
                            isPaused={isPaused}
                            timerDuration={TIMER_DURATION}
                            styles={styles}
                        />
                    ))}
                    <div
                        style={{
                            [isMobileLayout
                                ? "width"
                                : "height"]: isMobileLayout ? "300px" : `${containerDimension}px`,
                            flexShrink: 0,
                        }}
                    />
                    {slides.map((slide, index) => (
                        <NavItem
                            key={`clone-${slide.id}-${index}`}
                            slide={slide}
                            index={index}
                            isActive={slide.id === activeId}
                            media={mediaMap[slide.id]}
                            onClick={() => setActiveId(slide.id)}
                            isMobile={isMobileLayout}
                            isPaused={isPaused}
                            timerDuration={TIMER_DURATION}
                            styles={styles}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const GlobalVideoPlayer = ({ media, onClose }) => {
    const [renderableSrc, setRenderableSrc] = useState(null);
    useEffect(() => {
        let cancelled = false;
        if (media?.type === "video") {
            getMediaResourcePath(media.src).then((p) => {
                if (!cancelled) setRenderableSrc(p);
            });
        }
        return () => {
            cancelled = true;
        };
    }, [media]);
    if (!media || !media.src) return null;
    const playerStyle = {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 10000,
        width: "320px",
        height: "180px",
        background: "var(--background-primary)",
        border: "2px solid var(--glow)",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.5), 0 0 20px var(--glow-faint)",
        willChange: "transform, opacity",
    };
    const closeButtonStyle = {
        position: "absolute",
        top: "5px",
        right: "5px",
        background: "rgba(var(--background-primary-alt-rgb), 0.8)",
        border: "1px solid var(--glow)",
        borderRadius: "50%",
        color: "var(--glow)",
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold",
    };
    return (
        <div style={playerStyle}>
            <button style={closeButtonStyle} onClick={onClose}>
                ×
            </button>
            {renderableSrc && (
                <video
                    src={renderableSrc}
                    autoPlay
                    controls
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            )}
        </div>
    );
};

/**
 * LoadingScreen
 * A standardized, cinematic loading state for all dashboard modules.
 */
const LoadingScreen = ({ label = "LOADING", OverlayLogo, size = 80 }) => {
    return (
        <div style={{ 
            height: '60vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '32px', 
            color: 'var(--glow)', 
            width: '100%',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            {OverlayLogo && <OverlayLogo size={size} animated={true} />}
            <span style={{ 
                animation: 'pulse 1.5s infinite', 
                fontVariant: 'small-caps', 
                letterSpacing: '4px', 
                fontSize: '14px', 
                opacity: 0.8 
            }}>
                [ {label.toUpperCase()} ]
            </span>
        </div>
    );
};

return { Showcase, MatrixRain, GlobalVideoPlayer, LoadingScreen, OverlayLogo };
```
