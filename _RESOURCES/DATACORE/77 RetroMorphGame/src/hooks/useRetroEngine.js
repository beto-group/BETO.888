function useRetroEngine(dc) {
    const { useState, useEffect, useRef } = dc;

    // Game Constants
    const CANVAS_WIDTH = 800; // Virtual resolution
    const CANVAS_HEIGHT = 600;
    const GRID_SIZE = 20;

    // Modes
    const MODES = {
        SNAKE: 'snake',
        FLAPPY: 'flappy',
        CAT: 'cat'
    };

    const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver
    const [gameMode, setGameMode] = useState(MODES.SNAKE);
    const gameModeRef = useRef(MODES.SNAKE); // REF for loop logic

    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);
    const [highScore, setHighScore] = useState(0);

    const [username, setUsername] = useState(() => {
        const saved = localStorage.getItem('retromorph_username');
        return (saved && saved !== 'null' && saved !== 'undefined' && saved.trim().length >= 3) ? saved.trim() : '';
    });
    const [userGuid, setUserGuid] = useState(() => {
        const saved = localStorage.getItem('retromorph_guid_v3');
        return (saved && saved !== 'null' && saved !== 'undefined') ? saved : '';
    });
    const [leaderboard, setLeaderboard] = useState(() => {
        const saved = localStorage.getItem('retromorph_leaderboard');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });

    const usernameRef = useRef(username);
    const gameOverTimeRef = useRef(0);
    const userGuidRef = useRef(userGuid);
    const leaderboardRef = useRef(leaderboard);

    const [isServerOffline, setIsServerOffline] = useState(false);
    const [pendingScores, setPendingScores] = useState(() => {
        const saved = localStorage.getItem('retromorph_pending_scores');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });

    const pendingScoresRef = useRef(pendingScores);

    useEffect(() => { usernameRef.current = username; }, [username]);
    useEffect(() => { userGuidRef.current = userGuid; }, [userGuid]);
    useEffect(() => { leaderboardRef.current = leaderboard; }, [leaderboard]);
    useEffect(() => { pendingScoresRef.current = pendingScores; }, [pendingScores]);

    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
    const [latestScoreValue, setLatestScoreValue] = useState(null);
    const [totalGames, setTotalGames] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [isPlayerInUIZone, setIsPlayerInUIZone] = useState(false);
    const [playerPos, setPlayerPos] = useState({ x: 400, y: 300 });

    const ITCH_PUBLIC_KEY = "fb5d49101a6e48343f94ad3772dd2825985d1414f5ccc406";
    const API_BASE = "https://lcv3-server.danqzq.games";

    const state = useRef({
        // Snake State
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        direction: { x: 1, y: 0 },
        inputQueue: [],
        food: { x: 15, y: 15 },
        lastSnakeMove: 0,

        // Flappy State
        birdY: 300,
        birdVelocity: 0,
        pipes: [],

        // Cat State
        catY: 400,
        catVelocity: 0,
        isJumping: false,
        isDucking: false,
        obstacles: [],
        groundSpeed: 5,

        // Common
        lastFrameTime: 0,
        frameCount: 0,
        isMorphing: false,
        previousMode: null,
        morphTimer: 0,
        morphInitialDuration: 1500,
        screenShake: 0,
        impactPulse: 0,
        lastFoodPos: null,
        isAutoPlaying: true,
        isPlayerInUIZone: false,
        playerPos: { x: 400, y: 300 }
    });

    const loopRef = useRef(null);
    const gameStateRef = useRef(gameState);

    // Sync Ref with State
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Sync Game Mode Ref
    useEffect(() => {
        gameModeRef.current = gameMode;
    }, [gameMode]);

    // --- AI CONTROLLERS ---
    const updateAI = (s, mode) => {
        if (!s.isAutoPlaying) return;

        if (mode === MODES.SNAKE) {
            const head = s.snake[0];
            const food = s.food;
            let nextDir = { ...s.direction };

            if (head.x < food.x && s.direction.x !== -1) nextDir = { x: 1, y: 0 };
            else if (head.x > food.x && s.direction.x !== 1) nextDir = { x: -1, y: 0 };
            else if (head.y < food.y && s.direction.y !== -1) nextDir = { x: 0, y: 1 };
            else if (head.y > food.y && s.direction.y !== 1) nextDir = { x: 0, y: -1 };

            const checkCollision = (dir) => {
                const next = { x: head.x + dir.x, y: head.y + dir.y };
                return next.x < 0 || next.x >= CANVAS_WIDTH / GRID_SIZE ||
                    next.y < 0 || next.y >= CANVAS_HEIGHT / GRID_SIZE ||
                    s.snake.some(seg => seg.x === next.x && seg.y === next.y);
            };

            if (checkCollision(nextDir)) {
                const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                for (const d of dirs) {
                    if (!checkCollision(d)) {
                        nextDir = d;
                        break;
                    }
                }
            }
            s.direction = nextDir;
        } else if (mode === MODES.FLAPPY) {
            const birdY = s.birdY;
            // Target the earliest pipe that we hasn't COMPLETELY cleared yet.
            // Bird center is X=60, hitbox width ~28. 
            // So we focus on a pipe until its right edge (p.x + 50) is well past our center.
            const nextPipe = s.pipes.find(p => p.x + 50 > 45) || s.pipes[0];

            // Aim lower in the 150px gap (approx 75% down)
            const targetY = nextPipe ? nextPipe.gapY + 115 : 350;

            // Only flap if we are below target AND falling
            // AND a jump (~105px up) won't hit the top pipe (nextPipe.gapY)
            const jumpSafetyBuffer = 105;
            const topPipeY = nextPipe ? nextPipe.gapY : 0;
            const isCeilingSafe = (birdY - jumpSafetyBuffer > topPipeY + 15);

            if ((birdY > targetY && s.birdVelocity > 0.5 && isCeilingSafe) || birdY > 520) {
                s.birdVelocity = -10;
            }
        } else if (mode === MODES.CAT) {
            // Refined CAT AI: Better jump timing and ducking logic
            const nextCactus = s.obstacles.find(o => o.type === 'cactus' && o.x > 140);
            const nextBird = s.obstacles.find(o => o.type === 'bird-low' && o.x + 20 > 100 && o.x < 280);

            // JUMP LOGIC (Ground Obstacles)
            if (nextCactus && !s.isJumping) {
                // Peak is at ~14 frames. Lead by 12.5 frames and a tiny buffer to clear safely.
                const triggerPoint = 140 + (12.5 * s.groundSpeed);
                if (nextCactus.x < triggerPoint) {
                    s.catVelocity = -18;
                    s.isJumping = true;
                    s.isDucking = false;
                }
            }

            // DUCK LOGIC (Aerial Obstacles)
            // Only duck if not jumping (jumping into a bird is death, but cactus takes priority for ground)
            if (!s.isJumping) {
                if (nextBird) {
                    s.isDucking = true;
                } else {
                    s.isDucking = false;
                }
            } else {
                s.isDucking = false;
            }
        }
    };

    // Auto-start loop for background
    useEffect(() => {
        state.current.lastFrameTime = performance.now();
        loopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (loopRef.current) cancelAnimationFrame(loopRef.current);
        };
    }, []);

    // Inputs
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameStateRef.current !== 'playing') {
                if (e.key === ' ' || e.key === 'Enter' || e.key.startsWith('Arrow')) {
                    startGame();
                }
                return;
            }
            const s = state.current;
            if (s.isMorphing) return; // INPUT LOCK

            const currentMode = gameModeRef.current;

            if (currentMode === MODES.SNAKE) {
                const getNewDir = (key) => {
                    if (key === 'ArrowUp') return { x: 0, y: -1 };
                    if (key === 'ArrowDown') return { x: 0, y: 1 };
                    if (key === 'ArrowLeft') return { x: -1, y: 0 };
                    if (key === 'ArrowRight') return { x: 1, y: 0 };
                    return null;
                };
                const newDir = getNewDir(e.key);
                if (newDir) {
                    const lastDir = s.inputQueue.length > 0 ? s.inputQueue[s.inputQueue.length - 1] : s.direction;
                    const isOpposite = (newDir.x !== 0 && newDir.x === -lastDir.x) || (newDir.y !== 0 && newDir.y === -lastDir.y);
                    if (!isOpposite && s.inputQueue.length < 2) {
                        s.inputQueue.push(newDir);
                    }
                }
            } else if (currentMode === MODES.FLAPPY) {
                if (e.key === ' ' || e.key === 'ArrowUp') {
                    s.birdVelocity = -10; // Jump
                }
            } else if (currentMode === MODES.CAT) {
                if ((e.key === ' ' || e.key === 'ArrowUp') && !s.isJumping) {
                    s.catVelocity = -18;
                    s.isJumping = true;
                    s.isDucking = false; // Cancel duck on jump
                }
                if (e.key === 'ArrowDown') {
                    if (!s.isJumping) s.isDucking = true;
                    // Removed fast-fall to keep physics simple/consistent
                }
            }
        };

        const handleKeyUp = (e) => {
            const s = state.current;
            const currentMode = gameModeRef.current;
            if (currentMode === MODES.CAT && e.key === 'ArrowDown') {
                s.isDucking = false;
            }
        };

        const touchStartPos = { x: 0, y: 0 };
        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            touchStartPos.x = touch.clientX;
            touchStartPos.y = touch.clientY;

            if (gameStateRef.current !== 'playing') {
                startGame();
                return;
            }

            const currentMode = gameModeRef.current;
            const s = state.current;
            if (s.isMorphing) return;

            if (currentMode === MODES.FLAPPY) {
                s.birdVelocity = -10;
            } else if (currentMode === MODES.CAT) {
                const rect = e.target.getBoundingClientRect();
                const relativeY = touch.clientY - rect.top;
                const height = rect.height;

                if (relativeY < height * 0.7) { // Top 70% jump
                    if (!s.isJumping) {
                        s.catVelocity = -18;
                        s.isJumping = true;
                        s.isDucking = false;
                    }
                } else { // Bottom 30% duck
                    if (!s.isJumping) s.isDucking = true;
                }
            }
        };

        const handleTouchEnd = (e) => {
            if (gameStateRef.current !== 'playing') return;
            const currentMode = gameModeRef.current;
            const s = state.current;

            if (currentMode === MODES.SNAKE) {
                const touch = e.changedTouches[0];
                const dx = touch.clientX - touchStartPos.x;
                const dy = touch.clientY - touchStartPos.y;
                const absX = Math.abs(dx);
                const absY = Math.abs(dy);

                if (Math.max(absX, absY) > 20) { // Min swipe threshold
                    let newDir = null;
                    if (absX > absY) {
                        newDir = { x: dx > 0 ? 1 : -1, y: 0 };
                    } else {
                        newDir = { x: 0, y: dy > 0 ? 1 : -1 };
                    }

                    if (newDir) {
                        const lastDir = s.inputQueue.length > 0 ? s.inputQueue[s.inputQueue.length - 1] : s.direction;
                        const isOpposite = (newDir.x !== 0 && newDir.x === -lastDir.x) || (newDir.y !== 0 && newDir.y === -lastDir.y);
                        if (!isOpposite && s.inputQueue.length < 2) {
                            s.inputQueue.push(newDir);
                        }
                    }
                }
            } else if (currentMode === MODES.CAT) {
                s.isDucking = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: false });
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [gameMode]);

    // Game Loop
    const startGame = (force = false) => {
        // PREVENT ACCIDENTAL RESTART (3s Grace Period)
        if (!force && gameStateRef.current === 'gameOver') {
            const timeSinceDeath = Date.now() - gameOverTimeRef.current;
            if (timeSinceDeath < 3000) {
                console.log(`⏳ Restart blocked: ${3 - Math.floor(timeSinceDeath / 1000)}s remaining (Use UI to override)`);
                return;
            }
        }

        const s = state.current;
        s.isAutoPlaying = false;

        setGameState('playing');
        gameStateRef.current = 'playing';
        setScore(0);
        scoreRef.current = 0;

        setGameMode(MODES.SNAKE);
        gameModeRef.current = MODES.SNAKE;

        // Reset State
        state.current = {
            snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
            direction: { x: 1, y: 0 },
            inputQueue: [],
            food: { x: 20, y: 20 },
            lastSnakeMove: 0,
            birdY: 300,
            birdVelocity: 0,
            pipes: [],
            catY: 400,
            catVelocity: 0,
            isJumping: false,
            isDucking: false,
            obstacles: [],
            groundSpeed: 6,
            lastFrameTime: performance.now(),
            frameCount: 0,
            isMorphing: false,
            previousMode: MODES.SNAKE,
            morphTimer: 0,
            morphInitialDuration: 1500,
            screenShake: 0,
            impactPulse: 0,
            lastFoodPos: null
        };

        if (loopRef.current) cancelAnimationFrame(loopRef.current);
        loopRef.current = requestAnimationFrame(gameLoop);
    };

    const resetAI = () => {
        const s = state.current;
        s.isAutoPlaying = true;
        s.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        s.direction = { x: 1, y: 0 };
        s.inputQueue = [];
        s.food = { x: 20, y: 20 };
        s.birdY = 300;
        s.birdVelocity = 0;
        s.pipes = [];
        s.catY = 400;
        s.catVelocity = 0;
        s.isJumping = false;
        s.isDucking = false;
        s.obstacles = [];
        s.isMorphing = false;
        scoreRef.current = 0;
        setScore(0);
        setGameMode(MODES.SNAKE);
        gameModeRef.current = MODES.SNAKE;
    };

    const gameLoop = (timestamp) => {
        if (gameStateRef.current === 'gameOver') return;

        const s = state.current;
        const currentMode = gameModeRef.current;

        // AI Update
        if (s.isAutoPlaying) {
            updateAI(s, currentMode);
        }
        const delta = timestamp - s.lastFrameTime;

        // Decay Impact FX
        if (s.screenShake > 0) s.screenShake = Math.max(0, s.screenShake - delta * 0.05);
        if (s.impactPulse > 0) s.impactPulse = Math.max(0, s.impactPulse - delta * 0.05);

        // FPS CAP: 60 FPS (~16.6ms)
        if (delta < 16) {
            loopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        // Handles Morphing
        if (s.isMorphing) {
            s.morphTimer -= delta;
            s.lastFrameTime = timestamp;
            if (s.morphTimer <= 0) {
                s.isMorphing = false;
            }
            loopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        s.lastFrameTime = timestamp;

        // Logic Tick
        if (currentMode === MODES.SNAKE) {
            if (!s.lastSnakeMove) s.lastSnakeMove = timestamp;
            if (timestamp - s.lastSnakeMove > 80) {
                updateSnake(s);
                s.lastSnakeMove = timestamp;
            }
        } else {
            updateAction(s, currentMode);
        }

        checkModeTransition();

        // --- OCCLUSION DETECTION ---
        const UI_ZONE = { xMin: 200, xMax: 600, yMin: 150, yMax: 450 };
        let px = 0, py = 0;
        if (currentMode === MODES.SNAKE) {
            px = s.snake[0].x * GRID_SIZE;
            py = s.snake[0].y * GRID_SIZE;
        } else if (currentMode === MODES.FLAPPY) {
            px = 60;
            py = s.birdY;
        } else if (currentMode === MODES.CAT) {
            px = 120;
            py = s.catY;
        }

        const inZone = (px > UI_ZONE.xMin && px < UI_ZONE.xMax && py > UI_ZONE.yMin && py < UI_ZONE.yMax);
        if (inZone !== s.isPlayerInUIZone) {
            s.isPlayerInUIZone = inZone;
            setIsPlayerInUIZone(inZone);
        }

        // Always update pos for smooth masking
        setPlayerPos({ x: px, y: py });

        loopRef.current = requestAnimationFrame(gameLoop);
    };

    // --- LOGIC UPDATES ---

    const updateSnake = (s) => {
        if (s.inputQueue.length > 0) {
            s.direction = s.inputQueue.shift();
        }
        const head = { x: s.snake[0].x + s.direction.x, y: s.snake[0].y + s.direction.y };

        if (head.x < 0 || head.x >= CANVAS_WIDTH / GRID_SIZE || head.y < 0 || head.y >= CANVAS_HEIGHT / GRID_SIZE) {
            gameOver();
            return;
        }
        if (s.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }

        s.snake.unshift(head);

        if (head.x === s.food.x && head.y === s.food.y) {
            scoreRef.current += 5;
            setScore(scoreRef.current);
            s.screenShake = 12;
            s.impactPulse = 1.2;
            s.lastFoodPos = { x: s.food.x, y: s.food.y };

            s.food = {
                x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
                y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE))
            };
        } else {
            s.snake.pop(); // Remove tail
        }
    };

    const updateAction = (s, mode) => {
        if (mode === MODES.FLAPPY) {
            s.birdVelocity += 0.5; // Gravity
            s.birdY += s.birdVelocity;

            if (s.frameCount % 120 === 0) {
                s.pipes.push({ x: CANVAS_WIDTH, gapY: Math.random() * 300 + 100, gapSize: 150 });
            }
            s.pipes.forEach(p => p.x -= 3);
            s.pipes = s.pipes.filter(p => p.x > -50);
            s.frameCount++;

            if (s.birdY > CANVAS_HEIGHT || s.birdY < 0) gameOver();
            s.pipes.forEach(p => {
                // Bird X=60. Radius ~14. Range [46, 74].
                // Pipe Width=50.
                // Collision if PipeRight > BirdLeft AND PipeLeft < BirdRight
                // PipeRight = p.x + 50. BirdLeft = 46. -> p.x > -4
                // PipeLeft = p.x. BirdRight = 74. -> p.x < 74.

                if (p.x < 75 && p.x > -5) {
                    // Check Y Gaps
                    // Give a small buffer (radius check is box-like here, could be tighter)
                    const buffer = 10;
                    if (s.birdY - buffer < p.gapY || s.birdY + buffer > p.gapY + p.gapSize) {
                        gameOver();
                    }
                }
                if (p.x === 50) {
                    scoreRef.current += 5;
                    setScore(scoreRef.current);
                }
            });

        } else if (mode === MODES.CAT) {
            s.catVelocity += 1.25; // Snappier Gravity
            s.catY += s.catVelocity;
            if (s.catY > 425) {
                s.catY = 425;
                s.catVelocity = 0;
                s.isJumping = false;
            }

            // Obstacles
            if (s.frameCount % Math.max(60, 120 - (scoreRef.current / 10)) === 0) {
                const rand = Math.random();
                let type = 'cactus';
                if (rand > 0.6) type = 'bird-low';
                else if (rand > 0.45) type = 'bird-high';
                s.obstacles.push({ x: CANVAS_WIDTH, type });
            }
            s.obstacles.forEach(o => o.x -= s.groundSpeed);
            s.obstacles = s.obstacles.filter(o => o.x > -50);
            s.frameCount++;

            // Collision
            s.obstacles.forEach(o => {
                // Cat Visual: X:115-130 (approx 15px wide)
                // Normal Height: 25px. Ducking Height: 12px.
                const catLeft = 105;
                const catRight = 140;
                const hitHeight = s.isDucking ? 18 : 38;
                const catTop = s.catY - hitHeight;
                const catBottom = s.catY;

                let obsLeft, obsRight, obsTop, obsBottom;

                if (o.type === 'cactus') {
                    // Cactus (Ground Sentry): Grounded at 425
                    obsLeft = o.x + 5;
                    obsRight = o.x + 20;
                    obsTop = 390;
                    obsBottom = 425;
                } else if (o.type === 'bird-low') {
                    // Bird Low (requires ducking)
                    obsLeft = o.x + 5;
                    obsRight = o.x + 20;
                    obsTop = 385;
                    obsBottom = 405;
                } else if (o.type === 'bird-high') {
                    // Bird High (requires staying low)
                    obsLeft = o.x + 5;
                    obsRight = o.x + 20;
                    obsTop = 350;
                    obsBottom = 370;
                }

                if (catLeft < obsRight &&
                    catRight > obsLeft &&
                    catTop < obsBottom &&
                    catBottom > obsTop) {
                    gameOver();
                }

                if (Math.abs(o.x - 50) < 3) {
                    if (!o.scored) {
                        scoreRef.current += 5;
                        setScore(scoreRef.current);
                        o.scored = true;
                    }
                }
            });
        }
    };

    const checkModeTransition = () => {
        const sc = scoreRef.current;
        const cyclePos = sc % 150;

        let targetMode = MODES.SNAKE;
        if (cyclePos >= 50 && cyclePos < 100) targetMode = MODES.FLAPPY;
        else if (cyclePos >= 100) targetMode = MODES.CAT;

        if (targetMode !== gameModeRef.current) {
            const oldMode = gameModeRef.current;
            setGameMode(targetMode);
            gameModeRef.current = targetMode;

            state.current.isMorphing = true;
            state.current.previousMode = oldMode;
            state.current.morphTimer = 1500;
            state.current.morphInitialDuration = 1500;

            if (targetMode === MODES.SNAKE) {
                const loopCount = Math.floor(sc / 150);
                const startLength = 3 + (loopCount * 5); // Start with 3, add 5 segments per loop
                const startSnake = [];
                for (let i = 0; i < startLength; i++) {
                    startSnake.push({ x: 10 - i, y: 10 });
                }
                state.current.snake = startSnake;
                state.current.direction = { x: 1, y: 0 };
                state.current.inputQueue = [];
                state.current.groundSpeed = 6 + loopCount;
            } else if (targetMode === MODES.FLAPPY) {
                state.current.birdY = 300;
                state.current.birdVelocity = 0;
                state.current.pipes = [];
            } else if (targetMode === MODES.CAT) {
                state.current.catY = 400;
                state.current.obstacles = [];
            }
        }
    };

    // --- Global Leaderboard Logic ---
    const fetchGlobalLeaderboard = async () => {
        if (!ITCH_PUBLIC_KEY || !userGuid) return;
        setIsLoadingLeaderboard(true);
        try {
            // SECURITY: No destructive endpoints (Delete/Update) are used. 
            const res = await fetch(`${API_BASE}/get?key=${ITCH_PUBLIC_KEY}`);
            if (res.ok) {
                setIsServerOffline(false);
                const data = await res.json();
                const entries = Array.isArray(data) ? data : (data && Array.isArray(data.entries) ? data.entries : []);

                if (entries && entries.length > 0) {
                    setTotalGames(entries.length);
                    const guids = entries.map(e => e.UserGuid || e.userGuid).filter(Boolean);
                    const uniqueGuids = new Set(guids.map(g => g.split('-')[0]));
                    // Fallback to unique names if no GUIDs (legacy data)
                    if (uniqueGuids.size === 0) {
                        const names = entries.map(e => e.Username || e.username).filter(Boolean);
                        setTotalPlayers(new Set(names).size);
                    } else {
                        setTotalPlayers(uniqueGuids.size);
                    }

                    const currentGuid = userGuidRef.current;
                    const formatted = entries.map(e => ({
                        name: e.Username || e.username || "AGENT",
                        score: parseInt(e.Score !== undefined ? e.Score : (e.score !== undefined ? e.score : (e.Value || e.value || 0))),
                        isMine: (e.UserGuid || e.userGuid)?.startsWith(currentGuid),
                        rank: e.Rank || e.rank || 0
                    }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 10);

                    setLeaderboard(formatted);
                    localStorage.setItem('retromorph_leaderboard', JSON.stringify(formatted));

                    if (pendingScoresRef.current.length > 0) {
                        syncPendingScores();
                    }
                } else if (entries.length === 0) {
                    console.log("ℹ️ Server returned 0 entries. Preserving local high scores.");
                }
            } else {
                console.warn(`Leaderboard fetch rejected: ${res.status}`);
            }
        } catch (e) {
            console.error("Leaderboard Sync Failed", e);
            setIsServerOffline(true);
        } finally {
            setIsLoadingLeaderboard(false);
        }
    };

    const syncPendingScores = async () => {
        const scores = [...pendingScoresRef.current];
        if (scores.length === 0) return;

        console.log(`🔄 Attempting to sync ${scores.length} pending scores...`);
        let successCount = 0;

        for (const s of scores) {
            const formData = new FormData();
            formData.append('key', ITCH_PUBLIC_KEY);
            formData.append('username', s.name);
            formData.append('score', String(s.score));
            formData.append('extra', " ");
            // Use unique submission GUID to prevent overwriting
            formData.append('userGuid', userGuidRef.current + "-" + (s.ts || Date.now()));

            try {
                const res = await fetch(`${API_BASE}/entry/upload`, { method: 'POST', body: formData });
                if (res.ok) successCount++;
                else break;
            } catch (e) { break; }
        }

        if (successCount > 0) {
            const nextPending = pendingScoresRef.current.slice(successCount);
            setPendingScores(nextPending);
            localStorage.setItem('retromorph_pending_scores', JSON.stringify(nextPending));
            fetchGlobalLeaderboard();
        }
    };

    const initializeGuid = async () => {
        if (userGuid) return userGuid;
        try {
            const res = await fetch(`${API_BASE}/authorize`);
            if (res.ok) {
                const guid = await res.text();
                const trimmedGuid = guid.trim();
                localStorage.setItem('retromorph_guid_v3', trimmedGuid);
                setUserGuid(trimmedGuid);
                console.log("V3 Identity Authorized");
                return trimmedGuid;
            }
        } catch (e) { console.error("V3 Auth Failed", e); }
        return null;
    };

    useEffect(() => {
        initializeGuid();
    }, []);

    useEffect(() => {
        if (userGuid && (gameState === 'gameOver' || gameState === 'menu')) {
            fetchGlobalLeaderboard();
        }
    }, [gameState, userGuid]);

    const commitScore = async (name, finalScore) => {
        if (!name || name.trim().length < 3) return;

        // Final Score Safety
        const scValue = finalScore || scoreRef.current || 0;

        // Local Update (Immediate Feedback)
        setLatestScoreValue(scValue);
        setLeaderboard(prev => {
            const localEntry = { name, score: scValue, isMine: true };
            // ADDITIVE: Stop filtering by name. Keep all entries, sort, and slice.
            const updated = [localEntry, ...prev]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
            localStorage.setItem('retromorph_leaderboard', JSON.stringify(updated));
            return updated;
        });

        // Global Update
        let activeGuid = userGuidRef.current;
        if (!activeGuid || activeGuid === 'null') {
            activeGuid = await initializeGuid();
        }
        if (!activeGuid) {
            console.error("Leaderboard Aborted: No GUID available");
            return;
        }

        const formData = new FormData();
        formData.append('key', ITCH_PUBLIC_KEY);
        formData.append('username', name.trim());
        formData.append('score', String(scValue));
        formData.append('extra', " ");
        // ADDITIVE: Use a unique submission GUID (OriginalGUID-Timestamp)
        formData.append('userGuid', activeGuid + "-" + Date.now());

        console.log(`📡 Committing Score: ${name} -> ${scValue}`);

        try {
            const res = await fetch(`${API_BASE}/entry/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const text = await res.text();
                console.log("✅ Server Success. Body:", text);
                setIsServerOffline(false);
                setTimeout(() => fetchGlobalLeaderboard(), 2500);
            } else {
                throw new Error(`Server Error: ${res.status}`);
            }
        } catch (e) {
            console.error("🌐 Offline? Queueing Score for later sync:", e);
            setIsServerOffline(true);
            const newPending = [...pendingScoresRef.current, { name: name.trim(), score: scValue, ts: Date.now() }];
            setPendingScores(newPending);
            localStorage.setItem('retromorph_pending_scores', JSON.stringify(newPending));
        }
    };
    const registerUser = (name) => {
        const trimmed = name?.trim() || '';
        if (trimmed.length >= 3) {
            localStorage.setItem('retromorph_username', trimmed);
            setUsername(trimmed);
            commitScore(trimmed, scoreRef.current);
            return true;
        }
        return false;
    };

    const gameOver = () => {
        const s = state.current;
        if (s.isAutoPlaying) {
            resetAI();
            return;
        }

        setGameState('gameOver');
        gameStateRef.current = 'gameOver';
        gameOverTimeRef.current = Date.now();
        setHighScore(prev => Math.max(prev, scoreRef.current));

        const activeUser = usernameRef.current;
        if (activeUser && activeUser.length >= 3) {
            commitScore(activeUser, scoreRef.current);
        }

        if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };

    return {
        stateRef: state,
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
    };
}

return { useRetroEngine };
