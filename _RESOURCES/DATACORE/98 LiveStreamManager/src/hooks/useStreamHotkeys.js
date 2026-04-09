const { useEffect } = dc;

/**
 * useStreamHotkeys Hook
 * Centralizes all keyboard shortcuts for the LiveStreamManager.
 * 
 * Features:
 * - Handles Scene Switching (1-6)
 * - Handles Modifiers (Shift for scene-only, No-modifier for fullscreen)
 * - Handles Global Shortcuts (M, H, F, C)
 * - Handles Escape key (Toggle Fullscreen)
 * - FIXES FULLSCREEN FOCUS: Automatically refocuses the wrapper when exiting fullscreen
 * 
 * @param {Object} params
 * @param {RefObject} params.wrapperRef - Reference to the main container (for focus & fullscreen)
 * @param {Function} params.toggleFullscreen - Function to toggle fullscreen
 * @param {Function} params.setShowManager - State setter for Manager UI
 * @param {Function} params.handleSceneChange - Function to switch scenes
 * @param {Function} params.addTime - Function to adjust timer
 */
function useStreamHotkeys({
    wrapperRef,
    toggleFullscreen,
    setShowManager,
    handleSceneChange,
    addTime,
    isModalOpen,
    closeModals
}) {

    // 1. FOCUS RESTORATION LOGIC
    // When the user exits fullscreen (Escape or Button), the browser often drops focus to <body>.
    // We catch the 'fullscreenchange' event and FORCE focus back to our wrapper.
    useEffect(() => {
        const handleFullscreenChange = () => {
            // If we just EXITED fullscreen...
            // AGGRESSIVE FOCUS RESTORATION
            // We attempt to restore focus multiple times to combat browser race conditions
            // when transitioning out of fullscreen.
            const restoreFocus = () => {
                if (wrapperRef.current) {
                    wrapperRef.current.focus({ preventScroll: true });
                    if (document.activeElement !== wrapperRef.current) {
                        // If failed, try again in next frame
                        requestAnimationFrame(restoreFocus);
                    } else {
                        console.log("Focus successfully restored to wrapper.");
                    }
                }
            };

            // Trigger immediately and schedule backups
            restoreFocus();
            setTimeout(restoreFocus, 50);
            setTimeout(restoreFocus, 200);
            setTimeout(restoreFocus, 200);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [wrapperRef]);


    // 2. MAIN KEYBOARD LISTENER
    useEffect(() => {
        const handleKeyDown = (e) => {
            // IGNORE INPUTS
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Modifiers check
            const hasMajorModifiers = e.ctrlKey || e.metaKey || e.altKey;
            const hasShift = e.shiftKey;
            const key = e.key.toLowerCase();

            // --- A. GLOBAL CONTROL SHORTCUTS (NO MODIFIERS ALLOWED - STRICT) ---
            if (!hasMajorModifiers && !hasShift) {
                if (key === "m") {
                    setShowManager(prev => !prev);
                    return;
                }
                if (key === "h") {
                    window.dispatchEvent(new CustomEvent('toggle-help'));
                    return;
                }
                if (key === "f") {
                    toggleFullscreen();
                    return;
                }
                if (key === "c") {
                    window.dispatchEvent(new CustomEvent('toggle-chat'));
                    return;
                }
                if (key === "escape") {
                    if (isModalOpen) {
                        closeModals();
                    } else {
                        toggleFullscreen();
                    }
                    return;
                }
            }

            // --- B. SCENE & TIMER CONTROL (NO MAJOR MODIFIERS) ---
            if (!hasMajorModifiers) {
                const sceneKeys = {
                    "1": "starting", "2": "privacy", "3": "brb",
                    "4": "ending", "5": "obs-engine", "6": "bot-control"
                };
                const shiftKeys = {
                    "!": "starting", "@": "privacy", "#": "brb",
                    "$": "ending", "%": "obs-engine", "^": "bot-control"
                };

                let targetScene = null;
                if (sceneKeys[e.key]) targetScene = sceneKeys[e.key];
                if (shiftKeys[e.key]) targetScene = shiftKeys[e.key];

                if (targetScene) {
                    handleSceneChange(targetScene);
                    return;
                }

                // Reset Scene
                if (e.key === "0" && !hasShift) {
                    handleSceneChange(null);
                    return;
                }

                // Timer Controls (No Shift)
                if (!hasShift) {
                    if (e.key === "[") addTime(-1);
                    else if (e.key === "]") addTime(1);
                    else if (e.key === "{") addTime(-5);
                    else if (e.key === "}") addTime(5);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);

    }, [wrapperRef, toggleFullscreen, setShowManager, handleSceneChange, addTime]);
}

return { useStreamHotkeys };
