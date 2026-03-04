const { useRef, useState, useEffect } = dc;

/**
 * Hyper Scroll // Brutal Mode UI Component
 */
function HyperScrollComponent({ onCodeReloadRequest, isFullTab, onToggleFullTab, domUtils, styles, ControlsMenu }) {
    const STYLES = styles;

    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;

    // DOM Refs
    const worldRef = useRef(null);
    const viewportRef = useRef(null);
    const fpsRef = useRef(null);
    const velRef = useRef(null);
    const coordRef = useRef(null);

    // Engine Refs
    const engineRef = useRef({
        lenis: null,
        animationId: null,
        lastTime: 0,
        items: [],
        state: {
            scroll: 0,
            velocity: 0,
            targetSpeed: 0,
            mouseX: 0,
            mouseY: 0
        },
        CONFIG: {
            itemCount: 20,
            starCount: 150,
            zGap: 800,
            loopSize: 0, // Calculated during init
            camSpeed: 2.5,
            colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff'],
            TEXTS: ["IMPACT", "VELOCITY", "BRUTAL", "SYSTEM", "FUTURE", "DESIGN", "PIXEL", "HYPER", "NEON", "VOID"]
        }
    });

    const hyperScrollStyle = `
        .${uniqueWrapperClass} {
            --bg: #030303;
            --card-bg: rgba(10, 10, 10, 0.4);
            --text: #e0e0e0;
            --accent: #ff003c;
            /* Cyber Red */
            --accent-2: #00f3ff;
            /* Cyber Cyan */
            --border: rgba(255, 255, 255, 0.1);
            --font-display: 'Syncopate', sans-serif;
            --font-code: 'JetBrains Mono', monospace;
            
            margin: 0;
            padding: 0;
            background: var(--bg);
            color: var(--text);
            font-family: var(--font-display);
            overflow: hidden;
            width: 100%;
            height: 100%;
            position: relative;
            cursor: crosshair;
        }

        /* --- POST PROCESSING & OVERLAYS --- */
        .${uniqueWrapperClass} .scanlines {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom,
                    rgba(255, 255, 255, 0),
                    rgba(255, 255, 255, 0) 50%,
                    rgba(0, 0, 0, 0.2) 50%,
                    rgba(0, 0, 0, 0.2));
            background-size: 100% 4px;
            pointer-events: none;
            z-index: 10;
        }

        .${uniqueWrapperClass} .vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle, transparent 40%, #000 120%);
            z-index: 11;
            pointer-events: none;
        }

        .${uniqueWrapperClass} .noise {
            position: absolute;
            inset: 0;
            z-index: 12;
            opacity: 0.07;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* --- HUD --- */
        .${uniqueWrapperClass} .hud {
            position: absolute;
            inset: 2rem;
            z-index: 20;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-family: var(--font-code);
            font-size: 10px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
        }

        .${uniqueWrapperClass} .hud-top,
        .${uniqueWrapperClass} .hud-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .${uniqueWrapperClass} .hud strong {
            color: var(--accent-2);
        }

        .${uniqueWrapperClass} .hud-line {
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
            margin: 0 1rem;
            position: relative;
        }

        .${uniqueWrapperClass} .hud-line::after {
            content: '';
            position: absolute;
            right: 0;
            top: -2px;
            width: 5px;
            height: 5px;
            background: var(--accent);
        }

        /* --- 3D SCENE --- */
        .${uniqueWrapperClass} .viewport {
            position: absolute;
            inset: 0;
            perspective: 1000px;
            /* Dynamic */
            overflow: hidden;
            z-index: 1;
        }

        .${uniqueWrapperClass} .world {
            position: absolute;
            top: 50%;
            left: 50%;
            transform-style: preserve-3d;
            will-change: transform;
        }

        .${uniqueWrapperClass} .item {
            position: absolute;
            left: 0;
            top: 0;
            backface-visibility: hidden;
            transform-origin: center center;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* --- CARDS & CONTENT --- */
        .${uniqueWrapperClass} .card {
            width: 320px;
            height: 460px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            position: relative;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            /* Glassmorphism */
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 20px 50px rgba(0, 0, 0, 0.5);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform: translate(-50%, -50%);
        }

        /* Hover Effect for non-touch */
        @media (hover: hover) {
            .${uniqueWrapperClass} .card:hover {
                border-color: var(--accent);
                box-shadow: 0 0 30px rgba(255, 0, 60, 0.2);
                background: rgba(20, 20, 20, 0.8);
                z-index: 100;
            }
        }

        .${uniqueWrapperClass} .card::before,
        .${uniqueWrapperClass} .card::after {
            content: '';
            position: absolute;
            width: 10px;
            height: 10px;
            border: 1px solid transparent;
            transition: 0.3s;
        }

        .${uniqueWrapperClass} .card::before {
            top: -1px;
            left: -1px;
            border-top-color: var(--text);
            border-left-color: var(--text);
        }

        .${uniqueWrapperClass} .card::after {
            bottom: -1px;
            right: -1px;
            border-bottom-color: var(--text);
            border-right-color: var(--text);
        }

        .${uniqueWrapperClass} .card:hover::before,
        .${uniqueWrapperClass} .card:hover::after {
            width: 100%;
            height: 100%;
            border-color: var(--accent);
        }

        .${uniqueWrapperClass} .card-header {
            border-bottom: 1px solid var(--border);
            padding-bottom: 1rem;
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .${uniqueWrapperClass} .card-id {
            font-family: var(--font-code);
            color: var(--accent);
            font-size: 0.8rem;
        }

        .${uniqueWrapperClass} .card h2 {
            font-size: 2.5rem;
            line-height: 0.9;
            margin: 0;
            text-transform: uppercase;
            font-weight: 700;
            color: #fff;
            mix-blend-mode: hard-light;
        }

        .${uniqueWrapperClass} .card-footer {
            margin-top: auto;
            font-family: var(--font-code);
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.4);
            display: flex;
            justify-content: space-between;
        }

        /* --- BIG TEXT --- */
        .${uniqueWrapperClass} .big-text {
            font-size: 15vw;
            font-weight: 800;
            color: transparent;
            -webkit-text-stroke: 2px rgba(255, 255, 255, 0.15);
            text-transform: uppercase;
            white-space: nowrap;
            transform: translate(-50%, -50%);
            pointer-events: none;
            letter-spacing: -0.5rem;
            mix-blend-mode: overlay;
        }

        /* --- PARTICLES --- */
        .${uniqueWrapperClass} .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            transform: translate(-50%, -50%);
        }

        /* --- SCROLL PROXY --- */
        /* Removed as we will use virtual scrolling instead of container scrolling */
        
        /* Top Right Controls Dropdown fixes */
        .controls-menu {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          z-index: 1000;
        }
        .controls-menu:hover {
          opacity: 1;
        }
        
        .${uniqueWrapperClass} .hud-container {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
        }
  `;

    useEffect(() => {
        let isActive = true;

        async function initEngine() {
            if (!isFullTab) return; // Don't run heavy DOM manip in compact mode

            if (!isActive) return;

            const { CONFIG, state, items } = engineRef.current;
            const world = worldRef.current;
            const viewport = viewportRef.current;

            // Reset items
            world.innerHTML = '';
            items.length = 0;
            CONFIG.loopSize = CONFIG.itemCount * CONFIG.zGap;

            // --- Build DOM ---
            // Create Items
            for (let i = 0; i < CONFIG.itemCount; i++) {
                const el = document.createElement('div');
                el.className = 'item';

                const isHeading = i % 4 === 0;

                if (isHeading) {
                    const txt = document.createElement('div');
                    txt.className = 'big-text';
                    txt.innerText = CONFIG.TEXTS[i % CONFIG.TEXTS.length];
                    el.appendChild(txt);
                    items.push({
                        el, type: 'text',
                        x: 0, y: 0, rot: 0,
                        baseZ: -i * CONFIG.zGap
                    });
                } else {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const randId = Math.floor(Math.random() * 9999);
                    card.innerHTML = `
                    <div class="card-header">
                        <span class="card-id">ID-${randId}</span>
                        <div style="width: 10px; height: 10px; background: var(--accent);"></div>
                    </div>
                    <h2>${CONFIG.TEXTS[i % CONFIG.TEXTS.length]}</h2>
                    <div class="card-footer">
                        <span>GRID: ${Math.floor(Math.random() * 10)}x${Math.floor(Math.random() * 10)}</span>
                        <span>DATA_SIZE: ${(Math.random() * 100).toFixed(1)}MB</span>
                    </div>
                    <div style="position:absolute; bottom:2rem; right:2rem; font-size:4rem; opacity:0.1; font-weight:900;">0${i}</div>
                `;
                    el.appendChild(card);

                    // Spiral / Chaos positioning
                    const angle = (i / CONFIG.itemCount) * Math.PI * 6;
                    const radius = 400 + Math.random() * 200;

                    // Account for potential iframe/app bounds since window.innerWidth may be too large
                    // Use the component container bounds if possible
                    const bounds = viewport.getBoundingClientRect();
                    const containerWidth = bounds.width || window.innerWidth;
                    const containerHeight = bounds.height || window.innerHeight;

                    const x = Math.cos(angle) * (containerWidth * 0.3); // More centered
                    const y = Math.sin(angle) * (containerHeight * 0.3);
                    const rot = (Math.random() - 0.5) * 30;

                    items.push({
                        el, type: 'card',
                        x, y, rot,
                        baseZ: -i * CONFIG.zGap
                    });
                }
                world.appendChild(el);
            }

            // Create Stars
            for (let i = 0; i < CONFIG.starCount; i++) {
                const el = document.createElement('div');
                el.className = 'star';
                world.appendChild(el);
                items.push({
                    el, type: 'star',
                    x: (Math.random() - 0.5) * 3000,
                    y: (Math.random() - 0.5) * 3000,
                    baseZ: -Math.random() * CONFIG.loopSize
                });
            }

            // --- Init Lenis ---
            // Scope lenis to a scroll proxy layer if needed, or stick to window. 
            // For Datacore, intercepting global window scroll can be messy. 
            // We will bind Lenis to the component's scroll container.

            // --- Virtual Scroll Physics ---
            // Instead of native scrolling with Lenis, we trap wheel events 
            // and simulate momentum manually to prevent the container from moving
            const wrapper = document.querySelector(`.${uniqueWrapperClass}`);
            if (!wrapper) return;

            const handleWheel = (e) => {
                e.preventDefault();
                // Accumulate target speed based on wheel delta
                // Use deltaY for vertical scrolling, deltaX for horizontal (trackpads)
                const scrollAmount = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

                // Trackpads fire many small events, mice fire fewer big ones
                // Provide a reasonable multiplier
                state.targetSpeed += scrollAmount * 0.05;
            };

            // Needs passive: false to prevent default scrolling of the whole Obsidian view
            wrapper.addEventListener('wheel', handleWheel, { passive: false });

            // Event Listeners
            const handleMouseMove = (e) => {
                // Calculate relative to the component bounds instead of full screen
                const bounds = wrapper.getBoundingClientRect();
                // -1 to 1 based on mouse position inside the component
                let localX = e.clientX - bounds.left;
                let localY = e.clientY - bounds.top;

                state.mouseX = (localX / bounds.width - 0.5) * 2;
                state.mouseY = (localY / bounds.height - 0.5) * 2;
            };
            wrapper.addEventListener('mousemove', handleMouseMove);

            // --- RAF LOOP ---
            function raf(time) {
                if (!isActive) return;

                // FPS
                const delta = time - engineRef.current.lastTime;
                engineRef.current.lastTime = time;
                if (time % 10 < 1 && fpsRef.current) {
                    fpsRef.current.innerText = Math.round(1000 / delta) || 60;
                }

                // Smooth Velocity Physics (Virtual Scroll)
                // Decay target speed back to zero (friction)
                state.targetSpeed *= 0.9;

                // Spring velocity towards target speed
                state.velocity += (state.targetSpeed - state.velocity) * 0.1;

                // Apply velocity to scroll position
                state.scroll += state.velocity;

                // Wrap scroll infinitely if needed, or let it grow
                // For a continuous loop, we just let it grow as the math uses modulo later

                // HUD Updates
                if (velRef.current) velRef.current.innerText = Math.abs(state.velocity).toFixed(2);
                if (coordRef.current) coordRef.current.innerText = `${state.scroll.toFixed(0)}`;

                // --- RENDER LOGIC ---

                // 1. Camera Tilt & Shake
                // Add slight noise based on velocity
                const shake = state.velocity * 0.2;
                const tiltX = state.mouseY * 5 - state.velocity * 0.5;
                const tiltY = state.mouseX * 5;

                world.style.transform = `
                rotateX(${tiltX}deg) 
                rotateY(${tiltY}deg)
            `;

                // 2. Dynamic Perspective (Warp)
                const baseFov = 1000;
                const fov = baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
                viewport.style.perspective = `${fov}px`;

                // 4. Item Loop
                const cameraZ = state.scroll * CONFIG.camSpeed;

                items.forEach(item => {
                    let relZ = item.baseZ + cameraZ;
                    const modC = CONFIG.loopSize;

                    // Centering the repeat
                    let vizZ = ((relZ % modC) + modC) % modC;
                    if (vizZ > 500) vizZ -= modC; // Wrap back if too close/behind

                    // Determine Opacity
                    let alpha = 1;
                    if (vizZ < -3000) alpha = 0;
                    else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;

                    if (vizZ > 100 && item.type !== 'star') alpha = 1 - ((vizZ - 100) / 400);

                    if (alpha < 0) alpha = 0;
                    item.el.style.opacity = alpha;

                    if (alpha > 0) {
                        let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

                        if (item.type === 'star') {
                            // Warp Stars
                            const stretch = Math.max(1, Math.min(1 + Math.abs(state.velocity) * 0.1, 10));
                            trans += ` scale3d(1, 1, ${stretch})`;
                        } else if (item.type === 'text') {
                            trans += ` rotateZ(${item.rot}deg)`;
                            // RGB Split effect on text (simulated with text-shadow)
                            if (Math.abs(state.velocity) > 1) {
                                const offset = state.velocity * 2;
                                item.el.style.textShadow = `${offset}px 0 red, ${-offset}px 0 cyan`;
                            } else {
                                item.el.style.textShadow = 'none';
                            }
                        } else {
                            // Card floats
                            const t = time * 0.001;
                            const float = Math.sin(t + item.x) * 10;
                            trans += ` rotateZ(${item.rot}deg) rotateY(${float}deg)`;
                        }

                        item.el.style.transform = trans;
                    }
                });

                engineRef.current.animationId = requestAnimationFrame(raf);
            }

            engineRef.current.animationId = requestAnimationFrame(raf);

            // Cleanup listener storage so we can remove it cleanly
            engineRef.current.cleanup = () => {
                wrapper.removeEventListener('mousemove', handleMouseMove);
                wrapper.removeEventListener('wheel', handleWheel);
            };
        }

        initEngine();

        return () => {
            isActive = false;
            if (engineRef.current.animationId) {
                cancelAnimationFrame(engineRef.current.animationId);
            }
            if (engineRef.current.cleanup) {
                engineRef.current.cleanup();
            }
        };
    }, [isFullTab]);

    if (!isFullTab) {
        return (
            <div style={STYLES.compactWrapper} className={uniqueWrapperClass}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={STYLES.subtitle}><strong>Hyper Scroll</strong> ({instanceId})</span>
                    <div
                        style={STYLES.iconButton}
                        onClick={onToggleFullTab}
                        title="Enter Full Mode"
                    >
                        <dc.Icon icon="maximize" style={{ width: "16px", height: "16px" }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {/* Google Fonts Injection */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
                href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;800&family=Syncopate:wght@400;700&display=swap"
                rel="stylesheet"
            />
            <style>{hyperScrollStyle}</style>

            <div className={uniqueWrapperClass} style={{ overflow: 'hidden' }}>

                {/* Top Right Controls from Boilerplate */}
                <ControlsMenu
                    onReload={onCodeReloadRequest}
                    onToggle={onToggleFullTab}
                    styles={STYLES}
                />

                {/* OVERLAYS */}
                <div className="hud-container">
                    <div className="scanlines"></div>
                    <div className="vignette"></div>
                    <div className="noise"></div>

                    {/* HUD */}
                    <div className="hud">
                        <div className="hud-top">
                            <span>SYS.READY</span>
                            <div className="hud-line"></div>
                            <span>FPS: <strong ref={fpsRef}>60</strong></span>
                        </div>
                        <div className="center-nav"
                            style={{ alignSelf: 'flex-start', marginTop: 'auto', marginBottom: 'auto', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                            SCROLL VELOCITY // <strong ref={velRef}>0.00</strong>
                        </div>
                        <div className="hud-bottom">
                            <span>COORD: <strong ref={coordRef}>000.000</strong></span>
                            <div className="hud-line"></div>
                            <span>VER 2.0.4 [BETA]</span>
                        </div>
                    </div>
                </div>

                {/* 3D WORLD */}
                <div className="viewport" ref={viewportRef}>
                    <div className="world" ref={worldRef}></div>
                </div>

            </div>
        </div>
    );
}

return { HyperScrollComponent };