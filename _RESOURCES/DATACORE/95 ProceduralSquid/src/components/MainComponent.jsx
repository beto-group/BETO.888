function MainComponent(props) {
    const { dc, loadScript, isFullTab, onToggleFullTab, styles } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasRef = useRef(null);
    const guiContainerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    const refs = useRef({
        p5Instance: null,
        gui: null,
        params: {
            speed: 1.0,
            points: 20000,
            scale: 2.0,
            strokeWeight: 1.2,
            color: '#ffffff',
            opacity: 120,
            bgColor: '#000000',
            followMouse: true,
            steeringForce: 0.05,
            rotationSmoothing: 0.1,
            headOffsetDeg: 90, // Degrees to rotate base shape so head points at 0 radians
            showSecondSquid: false
        },
        t: 0,
        currentPos: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        currentAngle: 0,
        resizeObserver: null,
        pointCacheX: new Float32Array(100000),
        pointCacheY: new Float32Array(100000)
    }).current;

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                await loadScript(dc, 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js', { globalName: 'p5' });
                const P5 = window.p5;
                const GUI = await loadScript(dc, 'https://unpkg.com/lil-gui@0.19.1/dist/lil-gui.esm.min.js', { type: 'module' });

                if (!active) return;
                if (!P5) throw new Error("p5.js failed to load into window.p5");

                setIsLoaded(true);

                const gui = new GUI.default({ title: 'Squid Settings', container: guiContainerRef.current });
                refs.gui = gui;
                const folder = gui.addFolder('Controls');
                folder.add(refs.params, 'followMouse').name('Follow Cursor');
                folder.add(refs.params, 'showSecondSquid').name('Dual Squid (Yin Yang)');
                folder.add(refs.params, 'headOffsetDeg', -180, 180, 1).name('Head Orientation (°)');
                folder.add(refs.params, 'steeringForce', 0.01, 0.2, 0.01).name('Turn Agility');
                folder.add(refs.params, 'rotationSmoothing', 0.01, 0.5, 0.01).name('Look Smoothing');
                folder.add(refs.params, 'speed', 0.1, 5.0, 0.1).name('Animation Speed');
                folder.add(refs.params, 'points', 1000, 100000, 1000);
                folder.add(refs.params, 'scale', 0.1, 5.0, 0.1);
                folder.add(refs.params, 'strokeWeight', 0.1, 5.0, 0.1);
                folder.addColor(refs.params, 'color');
                folder.add(refs.params, 'opacity', 0, 255, 1);
                folder.addColor(refs.params, 'bgColor');
                folder.close();

                const sketch = (p) => {
                    p.setup = () => {
                        const container = canvasRef.current;
                        const w = container.clientWidth || window.innerWidth;
                        const h = container.clientHeight || window.innerHeight;
                        p.createCanvas(w, h);
                        refs.currentPos = { x: w / 2, y: h / 2 };
                        refs.velocity = { x: 0, y: 0 };
                        refs.currentAngle = 0;
                    };

                    p.draw = () => {
                        const { speed, points, scale, strokeWeight, color, opacity, bgColor, followMouse, steeringForce, rotationSmoothing, headOffsetDeg, showSecondSquid } = refs.params;
                        p.background(bgColor);

                        const targetX = followMouse ? p.mouseX : p.width / 2;
                        const targetY = followMouse ? p.mouseY : p.height / 2;

                        // Fluid Physics (Steering Behavior)
                        const dx = targetX - refs.currentPos.x;
                        const dy = targetY - refs.currentPos.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        // Map desired speed based on distance (so it slows as it approaches target)
                        const maxSpeedFactor = 8;
                        let targetSpeed = 0;
                        if (distance > 5) { // Deadzone to prevent jitter
                            targetSpeed = p.map(distance, 0, 200, 0, maxSpeedFactor, true);
                        }

                        // Calculate desired velocity vector
                        let desiredVX = 0;
                        let desiredVY = 0;
                        if (distance > 0) {
                            desiredVX = (dx / distance) * targetSpeed;
                            desiredVY = (dy / distance) * targetSpeed;
                        }

                        // Apply steer force to current velocity (inertia)
                        refs.velocity.x += (desiredVX - refs.velocity.x) * steeringForce;
                        refs.velocity.y += (desiredVY - refs.velocity.y) * steeringForce;

                        // Move position using velocity
                        refs.currentPos.x += refs.velocity.x;
                        refs.currentPos.y += refs.velocity.y;

                        // 1. Calculate traditional 360-degree heading from velocity 
                        const moveSpeed = Math.sqrt(refs.velocity.x ** 2 + refs.velocity.y ** 2);
                        if (moveSpeed > 0.1) {
                            const velocityAngle = Math.atan2(refs.velocity.y, refs.velocity.x);
                            let diff = velocityAngle - refs.currentAngle;
                            while (diff < -p.PI) diff += p.TWO_PI;
                            while (diff > p.PI) diff -= p.TWO_PI;
                            refs.currentAngle += diff * rotationSmoothing;
                        }

                        // 2. The Math Equation Transition! 
                        // "Bringing the equation into the negative".
                        // Rather than artificially squishing X or Y coordinates, we negate the curl factor `d/2`
                        // inside the polar angle generation. This causes the squid's tentacles to organically
                        // uncurl and swing to the other side of its body as it turns!
                        let targetFlip = refs.currentFlip || 1;
                        if (refs.velocity.x < -0.2) targetFlip = -1;
                        else if (refs.velocity.x > 0.2) targetFlip = 1;

                        if (refs.currentFlip === undefined) refs.currentFlip = 1;
                        refs.currentFlip += (targetFlip - refs.currentFlip) * 0.05;

                        // PASS 1: Generate Raw Points Structurally
                        let sumX = 0;
                        let sumY = 0;

                        refs.t += (p.PI / 45) * speed;

                        for (let i = points; i--;) {
                            const m = showSecondSquid ? (i % 2) * 9 : 0;
                            const k = 9 * p.cos(i / 61);
                            const e = i / 692 - 13;
                            const d = p.mag(k, e) ** 2 / 99 + 1;
                            const q = 79 - e / 2 * p.sin(k / d * 4) + k / d * (8 + 5 * p.sin(p.sin(d * d + e / 9 - refs.t + m)));

                            // THE NEGATIVE EQUATION: the structural curl (d/2) reverses gracefully
                            const c = ((d / 2) * refs.currentFlip) + p.cos(refs.t - d * 2 + m) / 9 + m;

                            const x = q * p.cos(c);
                            const y = (q + 40) * p.sin(c);

                            refs.pointCacheX[i] = x;
                            refs.pointCacheY[i] = y;

                            sumX += x;
                            sumY += y;
                        }

                        // True Center of Mass
                        const cx = sumX / points;
                        const cy = sumY / points;

                        // PASS 2: Apply 360 Rotation and Render!
                        // No Canvas transformations anymore! We apply a 2D rotation matrix perfectly 
                        // to the offset structural points so stroke widths stay pure and undisturbed.
                        const rotAngle = refs.currentAngle + p.radians(headOffsetDeg);
                        const cosA = Math.cos(rotAngle);
                        const sinA = Math.sin(rotAngle);

                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);
                        p.stroke(r, g, b, opacity);
                        p.strokeWeight(strokeWeight);

                        // We must draw all 20,000 points structurally rotated around the true Center of Mass
                        for (let i = points; i--;) {
                            // Translate by -Center of Mass
                            const px = refs.pointCacheX[i] - cx;
                            const py = refs.pointCacheY[i] - cy;

                            // Matrix Rotation
                            const rx = (px * cosA - py * sinA) * scale;
                            const ry = (px * sinA + py * cosA) * scale;

                            // Final translate to screen position
                            p.point(refs.currentPos.x + rx, refs.currentPos.y + ry);
                        }
                    };

                    p.resizeToContainer = () => {
                        const container = canvasRef.current;
                        if (container && p.resizeCanvas) {
                            p.resizeCanvas(container.clientWidth, container.clientHeight);
                        }
                    };
                };

                const p5Instance = new P5(sketch, canvasRef.current);
                refs.p5Instance = p5Instance;

                if (window.ResizeObserver && canvasRef.current) {
                    const ro = new ResizeObserver(() => {
                        if (p5Instance && p5Instance.resizeToContainer) {
                            p5Instance.resizeToContainer();
                        }
                    });
                    ro.observe(canvasRef.current);
                    refs.resizeObserver = ro;
                }

            } catch (e) {
                if (active) setError(e.message);
                console.error("Procedural Squid Init Error:", e);
            }
        }

        init();

        return () => {
            active = false;
            if (refs.p5Instance) refs.p5Instance.remove();
            if (refs.gui) refs.gui.destroy();
            if (refs.resizeObserver) refs.resizeObserver.disconnect();
        };
    }, []);

    return (
        <div style={styles.fullTabWrapper} className="datacore-procedural-squid">
            {!isLoaded && !error && <div style={{ color: "white", padding: "20px" }}>Initializing Squid...</div>}
            {error && <div style={{ color: "red", padding: "20px" }}>Error: {error}</div>}

            <div ref={canvasRef} style={styles.canvas} />

            <div style={styles.controls}>
                <button onClick={onToggleFullTab} style={styles.button} title={isFullTab ? "Exit Full-Tab" : "Enter Full-Tab"}>
                    <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                </button>
            </div>

            <div ref={guiContainerRef} style={styles.guiContainer} />
        </div>
    );
}

return { MainComponent };
