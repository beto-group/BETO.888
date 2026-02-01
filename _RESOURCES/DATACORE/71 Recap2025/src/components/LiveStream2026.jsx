
const { useState, useEffect, useRef } = dc;

/**
 * LiveStream 2026 Component v4
 * - Radius Optimized (Matches Goals2026 max ~290) to fix clipping
 * - Enhanced INDIVIDUAL PULSE (Radius + Brightness + Width)
 * - Red Theme
 */
function LiveStream2026({ active }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!active || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        let width, height;
        let animationFrameId;

        // --- CONFIGURATION ---
        const CHARS = "01xyz<>+-.•";
        const TOTAL_PARTICLES = 500;

        // REDUCED RADII to Fix Clipping (Max was 340, now 290)
        const RINGS = [
            { baseRadius: 130, color: '#EF4444' },
            { baseRadius: 210, color: '#DC2626' },
            { baseRadius: 290, color: '#FECACA' }, // Matched Goals Max  
        ];

        class Particle {
            constructor(ringIdx) {
                this.ringIdx = ringIdx;
                this.reset();
                this.angle = Math.random() * Math.PI * 2;
                this.speedVar = 0.5 + Math.random();
                this.size = Math.random() < 0.5 ? 8 : 12;
                this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
            }

            reset() {
                this.alpha = Math.random() * 0.5 + 0.2;
            }

            update(baseSpeed) {
                this.angle += baseSpeed * this.speedVar;
                if (Math.random() < 0.01) {
                    this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
                }
            }

            getPos(cx, cy, currentRingRadius) {
                const r = currentRingRadius;
                return {
                    x: cx + Math.cos(this.angle) * r,
                    y: cy + Math.sin(this.angle) * r,
                    angle: this.angle + Math.PI / 2
                };
            }
        }

        const particles = [];
        RINGS.forEach((r, idx) => {
            const count = Math.floor(TOTAL_PARTICLES / RINGS.length);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(idx));
            }
        });

        let globalTime = 0;

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;
            globalTime += 0.02; // Brisk pace

            // BACKGROUND GRID
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
            ctx.moveTo(0, cy); ctx.lineTo(width, cy);
            ctx.stroke();

            // INDIVIDUAL ACTIVE RING STATE
            const activeRings = RINGS.map((r, i) => {
                // Different frequencies and offsets for "Independent" feel
                const t = globalTime + (i * 2.5); // Phase shift

                // 1. Radius Pulse (Breathing)
                const radiusPulse = Math.sin(t * 1.5) * 10;
                const currentRadius = (r.baseRadius * 1.1) + radiusPulse; // Scale 1.1 included

                // 2. Opacity Pulse
                const opacity = 0.3 + (Math.sin(t * 2) * 0.2); // 0.1 to 0.5

                // 3. Line Width Pulse
                const lineWidth = 1.5 + (Math.sin(t * 2) * 1); // 0.5 to 2.5

                return { currentRadius, opacity, lineWidth, color: r.color };
            });

            // Draw Rings
            activeRings.forEach((r) => {
                ctx.beginPath();
                ctx.arc(cx, cy, r.currentRadius, 0, Math.PI * 2);
                ctx.strokeStyle = r.color;
                ctx.globalAlpha = r.opacity;
                ctx.lineWidth = r.lineWidth;
                ctx.stroke();
            });

            // PARTICLES
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 1;

            particles.forEach(p => {
                const speed = (p.ringIdx + 1) * 0.002 * (p.ringIdx % 2 === 0 ? 1 : -1);
                p.update(speed);

                const ringProps = activeRings[p.ringIdx];
                const pos = p.getPos(cx, cy, ringProps.currentRadius);

                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(pos.angle);
                ctx.fillStyle = ringProps.color;
                ctx.globalAlpha = p.alpha; // Own alpha logic + ring feeling
                ctx.font = `${p.size}px monospace`;
                ctx.fillText(p.char, 0, 0);
                ctx.restore();
            });

            // CENTER: LIVE DOT
            ctx.globalAlpha = 1;
            const centerPulse = 1 + Math.sin(globalTime * 8) * 0.2;
            ctx.beginPath();
            ctx.arc(cx, cy, 10 * centerPulse, 0, Math.PI * 2);
            ctx.fillStyle = '#EF4444';
            ctx.fill();

            // Glow
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 * centerPulse);
            g.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
            g.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, 50 * centerPulse, 0, Math.PI * 2);
            ctx.fill();


            // TEXT OVERLAY
            ctx.font = '900 64px Inter, sans-serif';
            ctx.fillStyle = '#FFF';
            ctx.shadowColor = '#B91C1C';
            ctx.shadowBlur = 30 + Math.sin(globalTime * 5) * 10; // Pulsing Text Shadow
            ctx.fillText("JOIN US", cx, cy - 80);
            ctx.shadowBlur = 0;

            const infoY = cy + 40;
            ctx.font = '700 20px monospace';
            ctx.fillStyle = '#FCA5A5';
            ctx.letterSpacing = '2px';
            ctx.fillText("LIVE STREAMING", cx, infoY);

            ctx.font = '400 14px monospace';
            ctx.fillStyle = '#FECACA';
            ctx.fillText("EVERY MONDAY @ 7PM EST", cx, infoY + 25);
            ctx.letterSpacing = '0px';

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
                perspective: '1000px'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%', height: '100%',
                    transform: `rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg) scale(1.15)`,
                    transition: 'transform 0.1s ease-out'
                }}
            />
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.95) 100%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
}

return { LiveStream2026 };
