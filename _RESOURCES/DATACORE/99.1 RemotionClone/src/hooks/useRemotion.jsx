const { useState, useEffect, useCallback, useRef } = dc;

/**
 * useRemotion Hook - Bulletproof Version
 * Uses a persistent Ref as the "Master Switch" to bypass any React state latency.
 */
function useRemotion({ fps = 30, durationInFrames = 300 } = {}) {
    const [frame, setFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // MASTER CONTROL REF - This is updated INSTANTLY on click
    const control = useRef({
        isPlaying: false,
        frame: 0,
        fps: fps,
        duration: durationInFrames,
        reqId: null,
        startTime: 0
    });

    // Update refs when props change
    useEffect(() => {
        control.current.duration = durationInFrames;
        control.current.fps = fps;
    }, [durationInFrames, fps]);

    const pause = useCallback(() => {
        console.log("[Engine] PAUSE requested");
        control.current.isPlaying = false;
        setIsPlaying(false);
        if (control.current.reqId) {
            cancelAnimationFrame(control.current.reqId);
            control.current.reqId = null;
        }
    }, []);

    const play = useCallback(() => {
        console.log("[Engine] PLAY requested");
        if (control.current.isPlaying) return;

        control.current.isPlaying = true;
        setIsPlaying(true);

        // Calibrate start time based on current frame
        control.current.startTime = performance.now() - (control.current.frame * 1000 / control.current.fps);

        const tick = (time) => {
            // THE HARD STOP: If this ref is false, we exit IMMEDIATELY.
            if (!control.current.isPlaying) return;

            const elapsed = time - control.current.startTime;
            const currentFrame = Math.floor(elapsed * control.current.fps / 1000);

            if (currentFrame >= control.current.duration) {
                control.current.frame = control.current.duration - 1;
                setFrame(control.current.duration - 1);
                pause();
                return;
            }

            if (currentFrame !== control.current.frame) {
                control.current.frame = currentFrame;
                setFrame(currentFrame);
            }

            control.current.reqId = requestAnimationFrame(tick);
        };

        control.current.reqId = requestAnimationFrame(tick);
    }, [pause]);

    const seek = useCallback((f) => {
        const clamped = Math.max(0, Math.min(f, control.current.duration - 1));
        control.current.frame = clamped;
        setFrame(clamped);
        if (control.current.isPlaying) {
            control.current.startTime = performance.now() - (clamped * 1000 / control.current.fps);
        }
    }, []);

    const toggle = useCallback(() => {
        console.log("[Engine] TOGGLE. Current state:", control.current.isPlaying);
        if (control.current.isPlaying) {
            pause();
        } else {
            if (control.current.frame >= control.current.duration - 1) {
                seek(0);
            }
            play();
        }
    }, [play, pause, seek]);

    // Absolute cleanup
    useEffect(() => {
        return () => {
            control.current.isPlaying = false;
            if (control.current.reqId) cancelAnimationFrame(control.current.reqId);
        };
    }, []);

    return {
        frame,
        isPlaying,
        play,
        pause,
        seek,
        toggle,
        fps,
        durationInFrames
    };
}

return { useRemotion };
