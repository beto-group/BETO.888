const { useEffect } = dc;

/**
 * useKeyboardShortcuts Hook
 * Global listener for keyboard events (Undo/Redo, etc.)
 */
function useKeyboardShortcuts({ onUndo, onRedo }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Undo: Cmd+Z or Ctrl+Z
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (!e.shiftKey && onUndo) {
                    e.preventDefault();
                    e.stopPropagation();
                    onUndo();
                } else if (e.shiftKey && onRedo) {
                    // Redo: Cmd+Shift+Z
                    e.preventDefault();
                    e.stopPropagation();
                    onRedo();
                }
            }
            // Redo: Ctrl+Y (Windows standard)
            if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                if (onRedo) {
                    e.preventDefault();
                    e.stopPropagation();
                    onRedo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [onUndo, onRedo]);
}

return { useKeyboardShortcuts };
