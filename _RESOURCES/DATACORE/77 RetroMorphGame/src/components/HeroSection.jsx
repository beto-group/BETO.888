function HeroSection({ dc, STYLES, useRetroEngine }) {
    const { useEffect, useRef, useState } = dc;
    const canvasRef = useRef(null);
    const renderLoopRef = useRef(null);
    const particlesRef = useRef([]);
    const [nameInput, setNameInput] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Initialize Engine
    const [isEditingName, setIsEditingName] = useState(false);
    const [isHoveringStart, setIsHoveringStart] = useState(false);
    const [isHoveringOther, setIsHoveringOther] = useState(false);
    const [isHoveringLeaderboard, setIsHoveringLeaderboard] = useState(false);
    const [isHoveringAbout, setIsHoveringAbout] = useState(false);

    // Initialize Engine
    const {
        stateRef,
        gameState,
        gameMode,
        score,
        highScore,
        username,
        setUsername,
        leaderboard,
        isLoadingLeaderboard,
        totalGames,
        totalPlayers,
        registerUser,
        startGame,
        isPlayerInUIZone,
        playerPos,
        latestScoreValue,
        isServerOffline,
        pendingScores,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        GRID_SIZE
    } = useRetroEngine(dc);

    const MATRIX_CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01";

    // --- HD UTILS ---
    const drawBloomChar = (ctx, char, x, y, size, alpha, isHead = false, pulse = 1) => {
        ctx.save();
        const finalSize = size * (isHead ? 1.05 : 0.9 + pulse * 0.1);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (isHead) {
            ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = `bold ${finalSize}px monospace`;
            ctx.fillText(char, x, y);
        } else {
            ctx.font = `bold ${finalSize}px monospace`;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.fillText(char, x, y);
        }
        ctx.restore();
    };

    const drawSnakeHD = (ctx, s, alpha = 1, progress = 1, glitch = 0, overridePos = null, time = 0) => {
        const scanlineX = progress * CANVAS_WIDTH;
        const drawSegment = (x, y, segmentAlpha, dist, isHead) => {
            let sx = x, sy = y;
            if (overridePos) {
                sx += (overridePos.x - (s.snake[0].x * GRID_SIZE + GRID_SIZE / 2));
                sy += (overridePos.y - (s.snake[0].y * GRID_SIZE + GRID_SIZE / 2));
            }
            if (sx > scanlineX && !isHead) return;
            const pulse = (Math.sin(dist * 0.8 - time * 12) + 1) / 2;
            const char = MATRIX_CHARS[Math.floor(sx + sy + dist * 5 + time * 10) % MATRIX_CHARS.length];
            drawBloomChar(ctx, char, sx, sy, 22, segmentAlpha * alpha, isHead, pulse);
        };
        const head = s.snake[0];
        if (head) drawSegment(head.x * GRID_SIZE + GRID_SIZE / 2, head.y * GRID_SIZE + GRID_SIZE / 2, 1, 0, true);
        for (let i = 0; i < s.snake.length - 1; i++) {
            const curr = s.snake[i], next = s.snake[i + 1];
            const density = 3;
            for (let d = 0; d < density; d++) {
                const t = d / density, dist = i + t;
                const segmentAlpha = Math.max(0.1, 1 - (dist / (s.snake.length + 2)));
                drawSegment((curr.x + (next.x - curr.x) * t) * GRID_SIZE + GRID_SIZE / 2, (curr.y + (next.y - curr.y) * t) * GRID_SIZE + GRID_SIZE / 2, segmentAlpha, dist, false);
            }
        }
    };

    const drawPipesHD = (ctx, s, time) => {
        s.pipes.forEach((pi, pipeIdx) => {
            if (pi.x > CANVAS_WIDTH + 80 || pi.x < -100) return;
            const drawPillar = (px, py, h, isTop) => {
                const strands = 5, hSpacing = 10, vSpacing = 14;
                ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                for (let i = 0; i < strands; i++) {
                    const cx = px + 35 + (i - 2) * hSpacing;
                    for (let sy = 5; sy < h; sy += vSpacing) {
                        const posSeed = Math.floor(pipeIdx * 1000 + i * 500 + Math.floor(sy / vSpacing));
                        const breathe = (Math.sin(time * 2 + posSeed * 0.5) + 1) / 2;
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + breathe * 0.6})`;
                        ctx.font = 'bold 15px monospace';
                        ctx.fillText(MATRIX_CHARS[posSeed % MATRIX_CHARS.length], cx, py + sy);
                    }
                }
                const capY = isTop ? py + h - 5 : py + 5, globalPulse = (Math.sin(time * 3 + pipeIdx) + 1) / 2;
                for (let i = 0; i < strands; i++) {
                    const cx = px + 35 + (i - 2) * hSpacing;
                    drawBloomChar(ctx, MATRIX_CHARS[(pipeIdx + i + Math.floor(time * 2)) % MATRIX_CHARS.length], cx, capY, 28, 1, true, globalPulse);
                }
                ctx.restore();
            };
            drawPillar(pi.x, 0, pi.gapY, true);
            drawPillar(pi.x, pi.gapY + pi.gapSize, CANVAS_HEIGHT - (pi.gapY + pi.gapSize), false);
        });
    };

    const drawFlappyHD = (ctx, s, alpha = 1, progress = 1, glitch = 0, overridePos = null, time = 0) => {
        let bx = (overridePos ? overridePos.x : 60), by = (overridePos ? overridePos.y : s.birdY);
        if (bx <= progress * CANVAS_WIDTH) {
            const pulse = (Math.sin(time * 15) + 1) / 2, flap = Math.sin(time * 25) * 12;
            ctx.save(); ctx.globalAlpha = alpha * 0.4; ctx.fillStyle = '#0ff'; ctx.fillText('◊', bx - 5, by);
            ctx.globalAlpha = alpha; ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace';
            ctx.fillText('>', bx - 14, by - 8 + flap); ctx.fillText('>', bx - 14, by + 8 - flap);
            drawBloomChar(ctx, '◊', bx, by, 34, alpha, true, pulse); ctx.restore();
        }
    };

    const drawParallax = (ctx, time, groundY, alpha) => {
        ctx.save();
        // Distant Circuit Traces
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const px = (time * -(20 + i * 10) + i * 200) % CANVAS_WIDTH;
            const py = groundY - 150 + (i * 30);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + 100, py);
            ctx.lineTo(px + 120, py - 20);
            ctx.stroke();
        }
        ctx.restore();
    };

    const drawCyberCat = (ctx, x, y, isJumping, isDucking, time, alpha, isGhost = false, groundSpeed = 6) => {
        ctx.save();
        const finalAlpha = isGhost ? alpha * 0.3 : alpha;
        ctx.strokeStyle = `rgba(255, 255, 255, ${finalAlpha})`;
        ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
        ctx.lineWidth = 1.8; // Thicker lines for bigger cat
        ctx.lineCap = 'round';
        if (!isGhost) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#fff';
        }

        // SCALED DIMENSIONS (Approx 1.5x)
        const bodyY = isDucking ? y - 6 : (isJumping ? y - 18 : y - 12);
        const headX = x + (isDucking ? 15 : 12);
        const headY = isDucking ? y - 10 : (isJumping ? y - 28 : y - 22);
        const tailX = x - 15;

        // --- EXPRESSIVE TAIL ---
        ctx.beginPath();
        const tailFlick = Math.sin(time * 15) * 6;
        ctx.moveTo(tailX, bodyY - 6);
        ctx.quadraticCurveTo(tailX - 15, bodyY - 18 + tailFlick, tailX - 10, bodyY - 26 + tailFlick);
        ctx.stroke();

        // --- TRAILING BITS ---
        ctx.save();
        ctx.font = '10px monospace';
        ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha * 0.4})`;
        const bits = ["1", "0", "1"];
        bits.forEach((bit, i) => {
            const bx = x - 35 - (i * 18) - (Math.sin(time * 10 + i) * 8);
            const by = y - 15 + (Math.cos(time * 10 + i) * 6);
            ctx.fillText(bit, bx, by);
        });
        ctx.restore();

        // --- SLEEK BODY ---
        ctx.beginPath();
        if (isDucking) {
            ctx.roundRect(x - 18, y - 12, 32, 8, 4);
        } else {
            // Arched back runner
            ctx.moveTo(x - 15, y - 9);
            ctx.quadraticCurveTo(x - 3, y - 21, x + 9, y - 12);
            ctx.lineTo(x + 9, y - 6);
            ctx.lineTo(x - 15, y - 6);
            ctx.closePath();
        }
        ctx.stroke();

        // --- REFINED HEAD ---
        ctx.beginPath();
        ctx.ellipse(headX, headY, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- SHARP EARS ---
        ctx.beginPath();
        ctx.moveTo(headX - 6, headY - 3); ctx.lineTo(headX - 7, headY - 14); ctx.lineTo(headX - 2, headY - 6);
        ctx.moveTo(headX + 6, headY - 3); ctx.lineTo(headX + 7, headY - 14); ctx.lineTo(headX + 2, headY - 6);
        ctx.fill();

        // --- RUNNING LEGS ---
        const walk = Math.sin(time * 20) * 10;
        ctx.beginPath();
        if (!isJumping) {
            ctx.moveTo(x + 7, y - 6); ctx.lineTo(x + 6 + walk, y + 2);
            ctx.moveTo(x - 12, y - 6); ctx.lineTo(x - 13 - walk, y + 2);
        } else {
            ctx.moveTo(x + 7, y - 6); ctx.lineTo(x + 12, y + 3);
            ctx.moveTo(x - 12, y - 6); ctx.lineTo(x - 6, y + 3);
        }
        ctx.stroke();

        ctx.restore();
    };

    const drawCatHD = (ctx, s, alpha = 1, progress = 1, time = 0, overridePos = null) => {
        const cx = overridePos ? overridePos.x : 120, cy = overridePos ? overridePos.y : s.catY;
        const groundY = 425;

        drawParallax(ctx, time, groundY, alpha);

        ctx.save(); ctx.textAlign = 'left'; ctx.font = '10px monospace';
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
        const strand = "-=- <U> -=- <N> -=- <I> -=- <T> -=- <X> -=-";
        for (let i = -1; i < 2; i++) {
            const gx = (time * -400 + i * 400) % (CANVAS_WIDTH * 2);
            if (gx > -500 && gx < CANVAS_WIDTH) ctx.fillText(strand, gx, groundY + 12);
        }
        ctx.fillRect(0, groundY + 2, CANVAS_WIDTH, 1);
        ctx.restore();
        if (progress > 0.4) s.obstacles.forEach((ob, idx) => {
            const ox = ob.x + 10;
            ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 11px monospace';
            const pulse = (Math.sin(time * 10 + idx) + 1) / 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (0.8 + pulse * 0.2)})`;
            if (ob.type === 'cactus') {
                ctx.fillText("/---\\", ox, groundY - 30); ctx.fillText("| [ ] |", ox, groundY - 20); ctx.fillText("|_____|", ox, groundY - 10);
            } else {
                const float = Math.sin(time * 8 + idx) * 10;
                let birdBaseY = (ob.type === 'bird-low' ? groundY - 35 : groundY - 75);
                const droneY = birdBaseY + float;
                ctx.fillText("< ERROR >", ox, droneY - 10); ctx.fillText("`---'`", ox, droneY);
            }
            ctx.restore();
        });

        drawCyberCat(ctx, cx, cy, cy < groundY - 10, s.isDucking, time, alpha, false, s.groundSpeed);

        // After-images for high speed
        if (s.groundSpeed > 8) {
            drawCyberCat(ctx, cx - 15, cy, cy < groundY - 10, s.isDucking, time - 0.05, alpha * 0.5, true);
            drawCyberCat(ctx, cx - 30, cy, cy < groundY - 10, s.isDucking, time - 0.1, alpha * 0.2, true);
        }
    };

    const updateParticles = (ctx) => {
        if (particlesRef.current.length > 200) particlesRef.current.shift();
        particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.04;
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.4})`;
            ctx.fillRect(p.x, p.y, 2, 2); return p.life > 0;
        });
    };

    const spawnBurst = (x, y, count = 20) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0 + Math.random() * 0.5
            });
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        const render = () => {
            const s = stateRef.current; if (!s) return;
            const time = Date.now() / 1000;
            ctx.save();
            // APPLY SMOOTH SCREEN SHAKE (Sine-based)
            if (s.screenShake > 0) {
                const sx = Math.sin(time * 100) * s.screenShake * 0.5;
                const sy = Math.cos(time * 80) * s.screenShake * 0.5;
                ctx.translate(sx, sy);
            }

            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.strokeStyle = 'rgba(255,255,255,0.015)'; ctx.lineWidth = 1;
            for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE * 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
            for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE * 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

            // SPAWN BURST ON COLLECTION
            if (s.lastFoodPos) {
                spawnBurst(s.lastFoodPos.x * GRID_SIZE + GRID_SIZE / 2, s.lastFoodPos.y * GRID_SIZE + GRID_SIZE / 2, 20);
                s.lastFoodPos = null;
            }

            updateParticles(ctx);
            if (s.impactPulse > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${s.impactPulse * 0.12})`;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            if (!s.isMorphing) {
                if (gameMode === 'snake') {
                    const fx = s.food.x * GRID_SIZE + GRID_SIZE / 2, fy = s.food.y * GRID_SIZE + GRID_SIZE / 2;
                    for (let i = 0; i < 2; i++) {
                        const rp = (time * 0.6 + i * 0.5) % 1;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - rp})`; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.arc(fx, fy, rp * 45, 0, Math.PI * 2); ctx.stroke();
                    }
                    ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff'; ctx.font = 'bold 26px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(MATRIX_CHARS[Math.floor(time * 20) % MATRIX_CHARS.length], fx, fy); ctx.restore();
                    drawSnakeHD(ctx, s, 1, 1, 0, null, time);
                } else if (gameMode === 'flappy') { drawPipesHD(ctx, s, time); drawFlappyHD(ctx, s, 1, 1, 0, null, time); }
                else if (gameMode === 'cat') { drawCatHD(ctx, s, 1, 1, time); }
            } else {
                const p = 1 - (s.morphTimer / s.morphInitialDuration);
                const getModePos = (m) => {
                    if (m === 'snake') return { x: s.snake[0].x * GRID_SIZE, y: s.snake[0].y * GRID_SIZE };
                    if (m === 'flappy') return { x: 60, y: s.birdY };
                    if (m === 'cat') return { x: 120, y: s.catY };
                    return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
                };
                const focal = { x: (getModePos(s.previousMode).x + (getModePos(gameMode).x - getModePos(s.previousMode).x) * p), y: (getModePos(s.previousMode).y + (getModePos(gameMode).y - getModePos(s.previousMode).y) * p) };
                if (s.previousMode === 'snake') drawSnakeHD(ctx, s, 1 - p, 1 - p, 0, focal, time);
                if (s.previousMode === 'flappy') drawFlappyHD(ctx, s, 1 - p, 1 - p, 0, focal, time);
                if (s.previousMode === 'cat') drawCatHD(ctx, s, 1 - p, 1 - p, time, focal);
                if (gameMode === 'snake') drawSnakeHD(ctx, s, p, p, 0, focal, time);
                if (gameMode === 'flappy') drawFlappyHD(ctx, s, p, p, 0, focal, time);
                if (gameMode === 'cat') drawCatHD(ctx, s, p, p, time, focal);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(p * Math.PI) * 0.4})`;
                const sweepX = p * CANVAS_WIDTH;
                ctx.fillRect(sweepX - 2, 0, 4, CANVAS_HEIGHT);
                ctx.fillRect(sweepX - 40, 0, 1, CANVAS_HEIGHT);
            }
            ctx.restore(); renderLoopRef.current = requestAnimationFrame(render);
        };
        renderLoopRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(renderLoopRef.current);
    }, [gameMode]);

    useEffect(() => {
        if (gameState === 'gameOver') {
            setCooldown(3);
            const timer = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setCooldown(0);
        }
    }, [gameState]);

    const handleRegister = () => {
        if (nameInput.trim().length >= 3) {
            registerUser(nameInput.trim());
            setIsEditingName(false);
        }
    };

    const handleChangeIdentity = () => {
        setNameInput(username || '');
        setIsEditingName(true);
    };

    const handleCancelIdentity = () => {
        setIsEditingName(false);
        setNameInput(username || '');
    };

    return (
        <div style={{ ...STYLES.container, touchAction: 'none' }}>
            <div style={STYLES.score}>{score}</div>
            {gameState === 'playing' && (
                <div style={STYLES.gameOverlay}>
                    <div style={{ ...STYLES.glassCard, padding: '15px 25px' }}>
                        <div style={STYLES.enigmaticIndicator}>
                            <div style={{ color: '#666', fontSize: '10px', fontWeight: '900', letterSpacing: '4px', marginBottom: '8px' }}>RETROMORPH_V3</div>
                            <div style={STYLES.mysticalLabel}>
                                PLAYING
                                <span style={{ opacity: Math.sin(Date.now() / 150) > 0 ? 1 : 0, transition: 'none' }}>:</span>
                                &nbsp;
                                {gameMode?.toUpperCase() || 'CORE'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MINIMALIST LEADERBOARD (BOTTOM RIGHT) */}
            {gameState === 'gameOver' && (
                <div style={STYLES.minimalLeaderboard}>
                    <div style={STYLES.leaderboardHeader}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>GLOBAL_STANDINGS [V3]</span>
                            {isLoadingLeaderboard && <span style={{ color: '#111', fontSize: '8px' }}>[SYNCING]</span>}
                        </div>
                        {totalGames > 0 && (
                            <div style={{
                                marginTop: '10px',
                                paddingTop: '10px',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#444', letterSpacing: '1.5px', fontWeight: '900' }}>
                                    <span>GAMES_PLAYED</span>
                                    <span>{totalGames}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#444', letterSpacing: '1.5px', fontWeight: '900' }}>
                                    <span>UNIQUE_PLAYERS</span>
                                    <span>{totalPlayers}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {leaderboard.slice(0, 8).map((entry, idx) => {
                        const isLatest = entry.isMine && entry.score === latestScoreValue;
                        return (
                            <div key={idx} style={{
                                ...STYLES.leaderboardRow,
                                color: entry.isMine ? '#fff' : '#888',
                                background: entry.isMine ? (isLatest ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)') : 'transparent',
                                padding: '6px 10px',
                                margin: '2px -10px',
                                borderRadius: '3px',
                                fontWeight: entry.isMine ? '900' : '500',
                                textShadow: entry.isMine ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                                position: 'relative'
                            }}>
                                <span style={{ width: '25px', opacity: 0.7, fontSize: '10px' }}>{idx + 1}</span>
                                <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                                    {entry.isMine && <span style={{ color: '#fff', marginRight: '6px' }}>&raquo;</span>}
                                    {entry.name}
                                    {isLatest && (
                                        <span style={{
                                            fontSize: '8px', background: '#fff', color: '#000',
                                            padding: '1px 4px', borderRadius: '2px', marginLeft: '8px',
                                            fontWeight: '900', letterSpacing: '1px'
                                        }}>LATEST</span>
                                    )}
                                </span>
                                <span style={{ fontWeight: '900', color: entry.isMine ? '#fff' : '#666' }}>{entry.score}</span>
                            </div>
                        );
                    })}
                    {/* Solo Rank Logic (if below Top 8) */}
                    {(() => {
                        const myEntry = leaderboard.find(e => e.isMine);
                        const myRank = myEntry ? (myEntry.rank || leaderboard.indexOf(myEntry) + 1) : null;

                        // Always show latest if it's NOT the high score
                        const isPersonalBest = myEntry && (latestScoreValue === myEntry.score);
                        const showLastAttempt = latestScoreValue !== null && !isPersonalBest;

                        return (
                            <>
                                {myRank > 8 && (
                                    <>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                                        <div style={{
                                            ...STYLES.leaderboardRow,
                                            color: '#fff',
                                            background: 'rgba(255,255,255,0.08)',
                                            padding: '4px 8px',
                                            margin: '1px -8px',
                                            borderRadius: '2px',
                                            fontWeight: '800',
                                            textShadow: '0 0 10px rgba(255,255,255,0.3)'
                                        }}>
                                            <span style={{ width: '25px', opacity: 0.5 }}>{myRank}</span>
                                            <span style={{ flex: 1 }}>
                                                <span style={{ color: '#fff', marginRight: '6px' }}>&raquo;</span>
                                                {myEntry.name}
                                            </span>
                                            <span style={{ fontWeight: '900' }}>{myEntry.score}</span>
                                        </div>
                                    </>
                                )}

                                {showLastAttempt && (
                                    <>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                                        <div style={{
                                            ...STYLES.leaderboardRow,
                                            color: '#aaa',
                                            fontSize: '9px',
                                            padding: '4px 8px',
                                            margin: '1px -8px',
                                            fontWeight: '900',
                                            letterSpacing: '2px'
                                        }}>
                                            <span style={{ flex: 1 }}>LAST_YIELD</span>
                                            <span style={{ color: '#fff' }}>{latestScoreValue}</span>
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}

            {/* HERO / START SCREEN CONTENT */}
            {gameState === 'menu' && (
                <>
                    {/* Layer 1: Masked Branding (Full screen for perfect mapping) */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                        pointerEvents: 'none',
                        // Adaptive CSS Masking
                        WebkitMaskImage: `radial-gradient(circle clamp(40px, 12vw, 70px) at ${(playerPos.x / CANVAS_WIDTH) * 100}% ${(playerPos.y / CANVAS_HEIGHT) * 100}%, transparent 0%, transparent clamp(25px, 8vw, 40px), black clamp(45px, 15vw, 70px))`,
                        maskImage: `radial-gradient(circle clamp(40px, 12vw, 70px) at ${(playerPos.x / CANVAS_WIDTH) * 100}% ${(playerPos.y / CANVAS_HEIGHT) * 100}%, transparent 0%, transparent clamp(25px, 8vw, 40px), black clamp(45px, 15vw, 70px))`
                    }}>
                        <div style={{ width: '100%', maxWidth: '100vw', padding: '0 5vw', boxSizing: 'border-box' }}>
                            <h1 style={STYLES.heroTitle}>BETO.GAMES</h1>
                        </div>
                    </div>

                    {/* Layer 2: Interactive / Unmasked */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                        pointerEvents: 'none'
                    }}>
                        <div
                            onClick={startGame}
                            onMouseEnter={() => setIsHoveringStart(true)}
                            onMouseLeave={() => setIsHoveringStart(false)}
                            style={{
                                ...STYLES.bigSquareButton,
                                border: '1px solid rgba(255,255,255,0.4)',
                                color: isHoveringStart ? '#000' : '#fff',
                                background: isHoveringStart ? '#fff' : 'rgba(255,255,255,0.08)',
                                pointerEvents: 'auto',
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                animation: isHoveringStart ? 'none' : 'float 4s ease-in-out infinite',
                                boxShadow: isHoveringStart ? '0 0 30px rgba(255,255,255,0.4)' : '0 0 10px rgba(255,255,255,0.05)',
                                zIndex: 200,
                                transform: 'translateY(18vh)'
                            }}
                        >
                            <div style={{
                                fontSize: 'clamp(10px, 1.6vw, 13px)',
                                fontWeight: '900',
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                                lineHeight: '1.4',
                                whiteSpace: 'nowrap'
                            }}>
                                {isHoveringStart ? 'PLAY NOW' : 'BREACH THE VOID'}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {gameState === 'gameOver' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', overflowY: 'auto', overflowX: 'hidden',
                    paddingTop: 'min(20vh, 180px)', paddingBottom: '10vh',
                    pointerEvents: 'none', scrollBehavior: 'smooth'
                }}>
                    <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        {(!username || isEditingName) ? (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={STYLES.modIdPrompt}>IDENTIFY_YOURSELF</div>
                                <input
                                    autoFocus
                                    type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value.toUpperCase().slice(0, 10))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); if (e.key === 'Escape') handleCancelIdentity(); }}
                                    style={STYLES.cyberInput}
                                    placeholder="..."
                                />
                                <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                    <button onClick={handleRegister} style={{ ...STYLES.minimalButton, width: '140px', borderColor: '#fff', color: '#fff' }}> COMMIT_ID </button>
                                    {isEditingName && (
                                        <button onClick={handleCancelIdentity} style={{ ...STYLES.minimalButton, width: '100px', border: 'none' }}> CANCEL </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={STYLES.navButtonGroup}>
                                    <div
                                        style={{ ...STYLES.bigSquareButton, opacity: isHoveringOther ? 1 : 0.6 }}
                                        onMouseEnter={() => setIsHoveringOther(true)}
                                        onMouseLeave={() => setIsHoveringOther(false)}
                                        onClick={() => window.open('https://beto.group', '_blank')}
                                    >
                                        <dc.Icon icon="zap" style={{ width: 'min(7vw, 30px)', height: 'min(7vw, 30px)', color: '#fff', opacity: 0.8 }} />
                                        <div style={{ fontSize: 'min(1.8vw, 10px)', fontWeight: '900', letterSpacing: '0.2vw' }}>GAMES</div>
                                    </div>

                                    <div
                                        style={{
                                            ...STYLES.bigSquareButton,
                                            border: isHoveringLeaderboard ? '1px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: isHoveringLeaderboard ? '0 0 20px rgba(255,255,255,0.1)' : 'none',
                                            background: isHoveringLeaderboard ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.4)',
                                            opacity: isHoveringLeaderboard ? 1 : 0.8
                                        }}
                                        onMouseEnter={() => setIsHoveringLeaderboard(true)}
                                        onMouseLeave={() => setIsHoveringLeaderboard(false)}
                                        onClick={() => startGame(true)}
                                    >
                                        <dc.Icon icon="rotate-ccw" style={{ width: 'min(9vw, 42px)', height: 'min(9vw, 42px)', color: '#fff' }} />
                                        <div style={{ fontSize: 'min(2.2vw, 12px)', fontWeight: '900', letterSpacing: '0.2vw' }}>AGAIN</div>
                                    </div>

                                    <div
                                        style={{ ...STYLES.bigSquareButton, opacity: isHoveringAbout ? 1 : 0.6 }}
                                        onMouseEnter={() => setIsHoveringAbout(true)}
                                        onMouseLeave={() => setIsHoveringAbout(false)}
                                        onClick={() => window.open('https://beto.group/about', '_blank')}
                                    >
                                        <dc.Icon icon="help-circle" style={{ width: 'min(8vw, 36px)', height: 'min(8vw, 36px)', color: '#fff', opacity: 0.8 }} />
                                        <div style={{ fontSize: 'min(1.8vw, 10px)', fontWeight: '900', letterSpacing: '0.2vw' }}>ABOUT</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 'clamp(20px, 5vh, 40px)' }}>
                                    <div style={{
                                        ...STYLES.heroTitle,
                                        fontSize: 'clamp(32px, 10vw, 72px)',
                                        letterSpacing: '0.1em'
                                    }}>BETO.GAMES</div>
                                    {score > 0 && <div style={{
                                        fontSize: 'clamp(14px, 5vw, 18px)',
                                        color: '#fff',
                                        marginTop: '15px',
                                        letterSpacing: 'clamp(4px, 2vw, 8px)',
                                        fontWeight: '900',
                                        opacity: 0.9
                                    }}>DATA_YIELD: {score}</div>}
                                </div>

                                <button
                                    onClick={handleChangeIdentity}
                                    style={{
                                        ...STYLES.minimalButton,
                                        fontSize: '11px',
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        color: '#fff',
                                        padding: '12px 30px',
                                        marginTop: '20px'
                                    }}
                                >
                                    CHANGE_USERNAME // {username}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={STYLES.canvas} />
        </div>
    );
}

return { HeroSection };
