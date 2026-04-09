const { useState, useCallback } = dc;

/**
 * useHistory Hook
 * Manages Undo/Redo stacks for generic state.
 */
function useHistory(initialState) {
    const [history, setHistory] = useState([]);
    const [future, setFuture] = useState([]);

    const addToHistory = useCallback((currentState) => {
        setHistory(prev => {
            const newHistory = [...prev, currentState];
            if (newHistory.length > 50) newHistory.shift(); // Limit history to 50
            return newHistory;
        });
        setFuture([]); // Clear future on new action
    }, []);

    const undo = useCallback((currentState, applyState) => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const newHistory = [...prev];
            const lastState = newHistory.pop();

            setFuture(f => [...f, currentState]);
            applyState(lastState);

            return newHistory;
        });
    }, []);

    const redo = useCallback((currentState, applyState) => {
        setFuture(prev => {
            if (prev.length === 0) return prev;
            const newFuture = [...prev];
            const nextState = newFuture.pop();

            setHistory(h => [...h, currentState]);
            applyState(nextState);

            return newFuture;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        setFuture([]);
    }, []);

    return {
        history,
        future,
        addToHistory,
        undo,
        redo,
        clearHistory,
        canUndo: history.length > 0,
        canRedo: future.length > 0
    };
}

return { useHistory };
