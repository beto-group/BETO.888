function useIQGame({ initialN = 1, roundLength = 22, initialInterval = 3000, saveSession } = {}) {
    const { useState, useEffect, useCallback, useRef } = dc;

    const [gameState, setGameState] = useState('idle'); // idle, playing, summary
    const [currentN, setCurrentN] = useState(initialN);
    const [currentInterval, setCurrentInterval] = useState(initialInterval);
    const [sequence, setSequence] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [showStimulus, setShowStimulus] = useState(false);
    const [activeKeys, setActiveKeys] = useState({ pos: false, sound: false });


    const [score, setScore] = useState({
        pos: { hits: 0, misses: 0, falseAlarms: 0 },
        sound: { hits: 0, misses: 0, falseAlarms: 0 },
        reactionTimes: { pos: [], sound: [] }
    });
    const [lastAccuracy, setLastAccuracy] = useState(0);
    const [dPrime, setDPrime] = useState(0);
    const [progression, setProgression] = useState(null);

    const timerRef = useRef(null);

    const flashTimerRef = useRef(null);
    const sequenceRef = useRef([]);
    const internalScoreRef = useRef({
        pos: { hits: 0, misses: 0, falseAlarms: 0 },
        sound: { hits: 0, misses: 0, falseAlarms: 0 },
        reactionTimes: { pos: [], sound: [] }
    });

    // Ref-based flags for speed and accuracy in listeners
    const inputTrackingRef = useRef({
        posMatchedInStep: false,
        soundMatchedInStep: false,
        currentIndex: -1,
        lastStimulusTime: 0
    });

    const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];

    const pregenerateSequence = useCallback((n) => {
        const fullLength = roundLength + n;
        const s = new Array(fullLength).fill(null);

        // Helper to get random step
        const getRandStep = () => {
            const pos = Math.floor(Math.random() * 8); // 0-7
            const gridPos = pos >= 4 ? pos + 1 : pos; // skip center if 9-grid logic (center is 4)
            const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            return { pos: gridPos, char };
        };

        // 1. Fill with random noise first
        for (let i = 0; i < fullLength; i++) {
            s[i] = getRandStep();
        }

        // 2. Inject Matches
        // Target: ~30% matches (approx 6-7 for length 20+).
        // To avoid clustering, we divide the playable area (index n to end) into segments.
        const playableSteps = roundLength;
        const targetMatches = Math.max(4, Math.floor(playableSteps * 0.3));

        const injectMatches = (type) => {
            const indices = [];
            // create candidate indices from n to end
            for (let i = n; i < fullLength; i++) indices.push(i);

            // Shuffle indices to pick random spots, but check spacing?
            // Simple shuffle for now, but valid check effectively distributes them if we enforce "no double match same step" maybe?
            // Let's just shuffle and pick N spots.
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }

            let matchCount = 0;
            for (const idx of indices) {
                if (matchCount >= targetMatches) break;

                // Check if this index is valid for a match (must match idx - n)
                // And avoid "accidental" match if we overwrite?

                const targetIdx = idx - n;
                const target = s[targetIdx];

                // Apply match
                if (type === 'pos') {
                    s[idx].pos = target.pos;
                } else {
                    s[idx].char = target.char;
                }
                matchCount++;
            }
        };

        injectMatches('pos');
        injectMatches('sound');

        // 3. Final cleanup pass to reduce "accidental" matches if they are too high?
        // Or ensure "accidental" matches don't make it impossible.
        // Actually, accidental matches are valid matches in N-back. 
        // If we generated noise + injected matches, the total matches might be slightly higher than targetMatches.
        // That is acceptable and organic.

        return s;
    }, [roundLength, LETTERS]);

    const calculateProgression = useCallback((posScore, soundScore) => {
        const accuracy = (posScore.hits + soundScore.hits) / 12;
        setLastAccuracy(accuracy);

        const posNet = (posScore.hits / 6) - (posScore.falseAlarms / (roundLength - 6));
        const soundNet = (soundScore.hits / 6) - (soundScore.falseAlarms / (roundLength - 6));
        const dScore = Math.max(0, Math.min(1, (posNet + soundNet) / 2));
        setDPrime(Math.round(dScore * 100));

        if (accuracy > 0.8) {
            setProgression('up');
            setCurrentN(n => n + 1);
        } else if (accuracy < 0.7) {
            setProgression('down');
            setCurrentN(n => Math.max(1, n - 1));
        } else {
            setProgression('stay');
        }
    }, [roundLength]);

    const persistSession = useCallback(() => {
        const currentScore = internalScoreRef.current;
        const totalEvents = currentScore.pos.hits + currentScore.pos.misses + currentScore.pos.falseAlarms +
            currentScore.sound.hits + currentScore.sound.misses + currentScore.sound.falseAlarms;

        console.log("IQGame: persistSession called. Total events:", totalEvents, "Score:", currentScore);

        if (totalEvents > 0) {
            const sessionData = {
                timestamp: Date.now(),
                nLevel: currentN,
                score: { ...currentScore }
            };
            console.log("IQGame: Saving session data:", sessionData);
            if (saveSession) {
                saveSession(sessionData).catch(err => console.error("Failed to save IQGame session:", err));
            } else {
                console.error("IQGame: saveSession function is missing!");
            }
        } else {
            console.warn("IQGame: No events recorded, skipping save.");
        }
    }, [currentN, saveSession]);

    const startRound = useCallback(() => {
        setGameState('playing');
        setActiveKeys({ pos: false, sound: false }); // Reset highlights for the full round

        const newSeq = pregenerateSequence(currentN);
        sequenceRef.current = newSeq;
        setSequence(newSeq);

        setCurrentIndex(-1);
        setShowStimulus(false);

        const initialScore = {
            pos: { hits: 0, misses: 0, falseAlarms: 0 },
            sound: { hits: 0, misses: 0, falseAlarms: 0 },
            reactionTimes: { pos: [], sound: [] }
        };

        // HARD RESET ALL STATE
        setScore(initialScore);
        internalScoreRef.current = JSON.parse(JSON.stringify(initialScore));
        inputTrackingRef.current = {
            posMatchedInStep: false,
            soundMatchedInStep: false,
            currentIndex: -1,
            lastStimulusTime: 0
        };
        setProgression(null);
        setLastAccuracy(0);
        setDPrime(0); // Reset accuracy display

        // Ensure N is valid
        if (!currentN || currentN < 1) setCurrentN(1);


        // Define game loop first so we can call it immediately
        const runGameLoop = () => {
            const speak = (text) => {
                const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
            };

            let stepCount = 0;
            const totalSteps = roundLength + currentN;

            const nextStep = () => {
                if (stepCount >= totalSteps) {
                    setGameState('summary');
                    persistSession(); // Save when game finishes
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                    setShowStimulus(false);
                    return;
                }

                // RESET INPUT VISUALS FOR NEW STEP
                setActiveKeys({ pos: false, sound: false });

                // Brief flicker to indicate new step
                setShowStimulus(false);

                if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                flashTimerRef.current = setTimeout(() => {
                    const step = sequenceRef.current[stepCount];
                    inputTrackingRef.current.currentIndex = stepCount;
                    inputTrackingRef.current.posMatchedInStep = false;
                    inputTrackingRef.current.soundMatchedInStep = false;
                    inputTrackingRef.current.lastStimulusTime = Date.now(); // Record time

                    setCurrentIndex(stepCount);
                    setShowStimulus(true);

                    speak(step.char);
                    stepCount++;
                }, 100);
            };

            nextStep();
            timerRef.current = setInterval(() => {
                const evaluateIdx = stepCount - 1;
                if (evaluateIdx >= currentN) {
                    const currentItem = sequenceRef.current[evaluateIdx];
                    const targetItem = sequenceRef.current[evaluateIdx - currentN];

                    if (currentItem.pos === targetItem.pos && !inputTrackingRef.current.posMatchedInStep) {
                        internalScoreRef.current.pos.misses++;
                    }
                    if (currentItem.char === targetItem.char && !inputTrackingRef.current.soundMatchedInStep) {
                        internalScoreRef.current.sound.misses++;
                    }
                    setScore({ ...internalScoreRef.current });
                }
                nextStep();
            }, currentInterval);
        };

        // Start with a slight delay
        setTimeout(() => {
            runGameLoop();
        }, 1500);
    }, [currentN, roundLength, currentInterval, pregenerateSequence, persistSession]);


    const quitGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

        // Stop any active speech
        window.speechSynthesis.cancel();

        // Save Session if we actually played and quit early
        if (gameState === 'playing') {
            persistSession();
        }

        setGameState('idle');
        setScore({
            pos: { hits: 0, misses: 0, falseAlarms: 0 },
            sound: { hits: 0, misses: 0, falseAlarms: 0 },
            reactionTimes: { pos: [], sound: [] }
        });
        setActiveKeys({ pos: false, sound: false });
        setShowStimulus(false);
    }, [gameState, persistSession]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        if (gameState === 'summary') {
            calculateProgression(score.pos, score.sound);
        }
    }, [gameState, calculateProgression]);

    const checkMatch = useCallback((type) => {
        const idx = inputTrackingRef.current.currentIndex;
        if (gameState !== 'playing' || idx < currentN) {
            // Allow toggling even in buffer period? No, buffer has no matches.
            // But if user presses it, it's a false alarm in buffer?
            // Existing logic:
            if (gameState === 'playing' && idx >= 0) {
                // Buffer zone logic
                // If active, toggle OFF. If inactive, toggle ON (False Alarm)
                if (activeKeys[type]) {
                    // Toggle Off
                    setActiveKeys(prev => ({ ...prev, [type]: false }));
                    internalScoreRef.current[type].falseAlarms--; // Undo false alarm
                } else {
                    // Toggle On
                    setActiveKeys(prev => ({ ...prev, [type]: true }));
                    internalScoreRef.current[type].falseAlarms++;
                }
                setScore({ ...internalScoreRef.current });
            }
            return;
        }

        const current = sequenceRef.current[idx];
        const target = sequenceRef.current[idx - currentN];
        const isMatch = (type === 'pos' ? current.pos === target.pos : current.char === target.char);

        if (activeKeys[type]) {
            // TOGGLE OFF
            setActiveKeys(prev => ({ ...prev, [type]: false }));

            if (isMatch) {
                // They had it right, now they are unmarking it -> Removes Hit
                // But wait, if they remove it, they might eventually get a 'miss' when step ends if they don't add it back.
                // We don't increment 'misses' here, the loop does that if !matchedInStep.
                // We just decrement hits and reset flag.
                internalScoreRef.current[type].hits--;
                if (type === 'pos') inputTrackingRef.current.posMatchedInStep = false;
                else inputTrackingRef.current.soundMatchedInStep = false;

                // If we remove the hit, should we remove the reaction time? 
                // It's complex to identify exactly which RT corresponds to this hit in the array.
                // For simplicity, we might just leave the RT array as is, or pop the last element if we assume LIFO for this step.
                // Given users rarely untoggle a correct hit unless accidental double tap logic:
                internalScoreRef.current.reactionTimes[type].pop();
            } else {
                // They were wrong (false alarm), now they are undoing it -> Removes False Alarm
                internalScoreRef.current[type].falseAlarms--;
            }

        } else {
            // TOGGLE ON
            setActiveKeys(prev => ({ ...prev, [type]: true }));

            if (isMatch) {
                // Correct Match
                // Only count line hit if not already matched (though double press is now handled by toggle)
                // Since it was OFF, it wasn't matched.
                internalScoreRef.current[type].hits++;
                if (type === 'pos') inputTrackingRef.current.posMatchedInStep = true;
                else inputTrackingRef.current.soundMatchedInStep = true;

                // Calculate Reaction Time
                const reactionTime = Date.now() - inputTrackingRef.current.lastStimulusTime;
                internalScoreRef.current.reactionTimes[type].push(reactionTime);
            } else {
                // False Alarm
                internalScoreRef.current[type].falseAlarms++;
            }
        }
        setScore({ ...internalScoreRef.current });
    }, [gameState, currentN, activeKeys]); // activeKeys dependency needed for toggle logic

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'a') checkMatch('pos');
            if (key === ';') checkMatch('sound');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [checkMatch]);

    return {
        gameState,
        currentN,
        setCurrentN,
        currentInterval,
        setCurrentInterval,
        sequence,
        currentIndex,
        showStimulus,
        activeKeys,
        score,
        lastAccuracy,
        dPrime,
        progression,
        startRound,
        checkMatch,
        quitGame,
    };
}

return { useIQGame };
