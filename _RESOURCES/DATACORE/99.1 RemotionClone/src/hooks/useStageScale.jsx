const { useState, useEffect, useRef } = dc;

/**
 * useStageScale Hook
 * Manages the responsive scaling of the preview stage.
 */
function useStageScale(format, FORMATS) {
    const stageContainerRef = useRef(null);
    const [stageScale, setStageScale] = useState(0.5);

    useEffect(() => {
        const updateScale = () => {
            if (stageContainerRef.current) {
                const { width, height } = stageContainerRef.current.getBoundingClientRect();
                const padding = 60;
                const availableWidth = Math.max(0, width - padding);
                const availableHeight = Math.max(0, height - padding);
                const currentFormat = FORMATS[format];

                if (currentFormat) {
                    const ratioW = availableWidth / currentFormat.width;
                    const ratioH = availableHeight / currentFormat.height;
                    setStageScale(Math.min(ratioW, ratioH, 1));
                }
            }
        };

        const observer = new ResizeObserver(updateScale);
        if (stageContainerRef.current) observer.observe(stageContainerRef.current);

        // Initial calculation
        updateScale();

        return () => observer.disconnect();
    }, [format, FORMATS]);

    return {
        stageScale,
        stageContainerRef
    };
}

return { useStageScale };
