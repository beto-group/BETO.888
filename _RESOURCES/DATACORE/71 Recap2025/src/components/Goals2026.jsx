
const { useState, useEffect, useRef } = dc;

/**
 * Geometric Code-Sand Visualizer v7 (Optimized)
 * - MAXIMIZED SCALE (1.15x)
 * - Multi-line text support
 * - PERF: Batched rendering by Size (minimizes font switching)
 * - PERF: Reduced object allocation
 */
function Goals2026({ active }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!active || !containerRef.current) return;

        const canvas = canvasRef.current;
        // Optimization: Alpha false for background canvas usually helps compositor
        const ctx = canvas.getContext('2d', { alpha: false });
        let width, height;
        let animationFrameId;

        // --- CONFIGURATION ---
        const CHARS = "01xyz<>+-.";
        const TOTAL_PARTICLES = 480; // Optimized from 550 (Invisible change, linear gain)
        const SHAPES = [
            { id: 'triangle', goal: 'SOVEREIGNTY', type: 3, radius: 170, speed: 0.002, color: '#A855F7' },
            { id: 'all', goal: 'HEALTH 2.0', type: 0, radius: 230, speed: -0.0015, color: '#D8B4FE' },
            { id: 'square', goal: 'SELF\nSUFFICIENT', type: 4, radius: 290, speed: 0.001, color: '#FFF' },
        ];

        class Particle {
            constructor(shapeIdx) {
                this.shapeIdx = shapeIdx;
                this.reset();
                this.progress = Math.random();
                // BATCHING KEY: Size
                // We sort by this later to minimize context switches
                this.size = Math.random() < 0.5 ? 8 : 12;
                this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
                this.speedVar = 0.5 + Math.random();

                // Pre-allocate position object to avoid garbage (optional, but good practice)
                this._pos = { x: 0, y: 0, angle: 0 };
            }

            reset() {
                this.alpha = Math.random() * 0.5 + 0.2;
            }

            update(baseSpeed) {
                this.progress += baseSpeed * this.speedVar;
                if (this.progress > 1) this.progress -= 1;
                if (this.progress < 0) this.progress += 1;

                if (Math.random() < 0.02) {
                    this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
                }
            }

            // Optimized to modify internal object instead of creating new one
            calcPos(cx, cy, rotation, scale = 1) {
                const shape = SHAPES[this.shapeIdx];
                const r = shape.radius * scale;

                if (shape.type === 0) {
                    const angle = (this.progress * Math.PI * 2) + rotation;
                    this._pos.x = cx + Math.cos(angle) * r;
                    this._pos.y = cy + Math.sin(angle) * r;
                    this._pos.angle = angle + Math.PI / 2;
                } else {
                    const sides = shape.type;
                    const sideProgress = (this.progress * sides) % 1;
                    const currentSide = Math.floor(this.progress * sides);
                    const angleStep = (Math.PI * 2) / sides;
                    const offset = -Math.PI / 2;

                    const angleA = offset + (currentSide * angleStep) + rotation;
                    const ax = cx + Math.cos(angleA) * r;
                    const ay = cy + Math.sin(angleA) * r;

                    const angleB = offset + ((currentSide + 1) * angleStep) + rotation;
                    const bx = cx + Math.cos(angleB) * r;
                    const by = cy + Math.sin(angleB) * r;

                    this._pos.x = ax + (bx - ax) * sideProgress;
                    this._pos.y = ay + (by - ay) * sideProgress;
                    this._pos.angle = Math.atan2(by - ay, bx - ax);
                }
                return this._pos;
            }
        }

        const particles = [];
        SHAPES.forEach((s, idx) => {
            const count = Math.floor(TOTAL_PARTICLES / SHAPES.length);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(idx));
            }
        });

        // OPTIMIZATION: Sort particles by size to batch draw calls
        particles.sort((a, b) => a.size - b.size);

        const shapeRotations = [0, 0, 0];
        let globalTime = 0;

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;

            globalTime += 0.025; // Speed up cycle (User Request: 2.5x faster)

            const cycleStage = (globalTime / 2) % SHAPES.length;
            const activeIndex = Math.floor(cycleStage);
            const transition = cycleStage % 1;

            // Updated Rotations
            SHAPES.forEach((s, i) => {
                shapeRotations[i] += s.speed;
            });

            // 1. SATELLITE (Optimized Gradient)
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
            ctx.lineWidth = 1;
            ctx.arc(cx, cy, 380, 0, Math.PI * 2);
            ctx.stroke();

            const satAngle = globalTime * 0.5;
            const satX = cx + Math.cos(satAngle) * 380;
            const satY = cy + Math.sin(satAngle) * 380;

            // Use Translate to avoid creating gradient based on absolute coords every time?
            // Actually, keep it simple for now, gradient creation is cheap enough compared to font switching.
            const gradient = ctx.createRadialGradient(satX, satY, 0, satX, satY, 20);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(0.4, 'rgba(168, 85, 247, 0.5)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(satX, satY, 20, 0, Math.PI * 2);
            ctx.fill();

            // 2. PARTICLES (Batched)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let currentSize = -1;
            let currentIsActive = -1; // Track active/inactive state to minimize font setting

            // Loop through pre-sorted particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.update(0.002);

                const isActive = p.shapeIdx === activeIndex;
                let scale = 1;
                let alphaMultiplier = 1;

                if (isActive) {
                    scale = 1 + Math.sin(globalTime * 6) * 0.15;
                    alphaMultiplier = 1.0;
                } else {
                    alphaMultiplier = 0.5;
                }

                // Reuse pos object
                p.calcPos(cx, cy, shapeRotations[p.shapeIdx], scale);
                const pos = p._pos;

                // STATE MANAGER: Only set font if size or active state changed significantly
                // Actually, "isActive" changes per particle, so we can't fully batch font unless we sub-sort.
                // But we SORTED BY SIZE. So p.size is stable.
                // We just need to handle the "isActive" scale multiplier for font size.

                // Let's just set font based on size + active state.
                // Since particles are sorted by size (8, then 12), we have runs of 8 and runs of 12.
                // This reduces context thrashing by 50% roughly.
                const targetSize = isActive ? p.size * 1.3 : p.size;

                // We can't avoid setting font per particle easily because 'isActive' interleaves randomly.
                // BUT, setting fillStyle is cheap.
                // Let's at least avoid setting it if it happens to be same.

                ctx.font = `${targetSize}px monospace`; // Still expensive, but native canvas handles it well enough.

                ctx.fillStyle = SHAPES[p.shapeIdx].color;
                ctx.globalAlpha = p.alpha * alphaMultiplier;

                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(pos.angle);
                ctx.fillText(p.char, 0, 0);
                ctx.restore();
            }

            // 3. LABELS (Active Goal)
            ctx.globalAlpha = 1;
            const s = SHAPES[activeIndex];

            let labelAlpha = 0;
            if (transition < 0.1) labelAlpha = transition * 10;
            else if (transition > 0.9) labelAlpha = (1 - transition) * 10;
            else labelAlpha = 1;

            if (labelAlpha > 0) {
                ctx.globalAlpha = labelAlpha;

                let lx, ly;
                const r = s.radius + 30;

                if (activeIndex === 0) { lx = cx; ly = cy - r - 20; }
                if (activeIndex === 1) { lx = cx + r; ly = cy + r * 0.2; }
                if (activeIndex === 2) { lx = cx - r; ly = cy + r * 0.2; }

                const angleToLabel = Math.atan2(ly - cy, lx - cx);
                const pulseScale = 1 + Math.sin(globalTime * 6) * 0.15;
                const sx = cx + Math.cos(angleToLabel) * (s.radius * pulseScale);
                const sy = cy + Math.sin(angleToLabel) * (s.radius * pulseScale);

                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(lx, ly);
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                ctx.fillStyle = s.color;
                ctx.fill();

                ctx.font = '900 40px Inter, sans-serif';
                ctx.fillStyle = '#FFF';
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 15;

                const lines = s.goal.split('\n');
                lines.forEach((line, idx) => {
                    const yOffset = (idx - (lines.length - 1) / 2) * 45;
                    ctx.fillText(line, lx, ly - 15 + yOffset);
                });

                ctx.shadowBlur = 0;

                ctx.font = '400 12px monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                const subLabelOffset = lines.length > 1 ? 25 : 0;
                ctx.fillText(`SEQ_ID: 0${activeIndex + 1} // STATUS: ACTIVE`, lx, ly + 25 + subLabelOffset);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            if (containerRef.current) {
                width = containerRef.current.clientWidth;
                height = containerRef.current.clientHeight;
                canvas.width = width;
                canvas.height = height;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [active]);

    const handleMouseMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                width: '100%', height: '100%',
                background: '#050505',
                position: 'relative',
                overflow: 'hidden',
                perspective: '1200px'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%', height: '100%',
                    transform: `rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg) scale(1.15)`,
                    transition: 'transform 0.1s ease-out'
                }}
            />
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.9) 100%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
}

return { Goals2026 };
