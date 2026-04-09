const { useState, useCallback, useRef } = dc;

/**
 * useExport Hook
 * Orchestrates the video export process using ExportService.
 */
function useExport({ folderPath, fps, durationInFrames, stageElementRef, pause }) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState({ percent: 0, frame: 0, totalFrames: 0, phase: 'idle' });
    const [showExportSettings, setShowExportSettings] = useState(false);
    const [abortController, setAbortController] = useState(null);

    const [exportSettings, setExportSettings] = useState({
        quality: 'medium', // low, medium, high
        format: 'mp4',
        scale: 1,
        fps: 120 // Default to 120 FPS
    });

    const FORMATS = {
        DESKTOP: { width: 1920, height: 1080, label: 'Full HD (16:9)' },
        SHORTS: { width: 1080, height: 1920, label: 'Shorts (9:16)' },
        SQUARE: { width: 1080, height: 1080, label: 'Square (1:1)' }
    };

    const QUALITY_MAP = {
        low: { crf: 28, label: 'Low (Small File)' },
        medium: { crf: 23, label: 'Medium (Standard)' },
        high: { crf: 18, label: 'High (Best Quality)' }
    };

    const handleExportClick = useCallback((e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log("[useExport] Export clicked. Pausing playback...");
        if (pause) pause();
        setShowExportSettings(true);
    }, [pause]);

    const handleStartExport = async (currentFormatKey, seek) => {
        if (!stageElementRef.current) return;
        setShowExportSettings(false);

        const controller = new AbortController();
        setAbortController(controller);
        setIsExporting(true);
        setExportProgress({ percent: 0, frame: 0, totalFrames: 0, phase: 'preparing' });
        if (pause) pause();

        try {
            const { ExportService } = await dc.require(folderPath + '/src/utils/ExportService.jsx');
            const currentFormat = FORMATS[currentFormatKey];
            const crf = QUALITY_MAP[exportSettings.quality].crf;
            const targetFps = exportSettings.fps;

            // Calculate total frames for export to maintain duration
            const exportDuration = Math.round(durationInFrames * (targetFps / fps));

            await ExportService.renderVideo({
                stageElement: stageElementRef.current,
                duration: exportDuration,
                fps: targetFps,
                width: currentFormat.width,
                height: currentFormat.height,
                scale: exportSettings.scale,
                seek: (f) => {
                    // Map export frame back to logical engine frame (fps) for sequence timing
                    const logicalFrame = f * (fps / targetFps);
                    if (seek) seek(logicalFrame);
                },
                onProgress: (p) => setExportProgress(p),
                signal: controller.signal,
                crf: crf,
                format: exportSettings.format
            });
        } catch (err) {
            if (err.name === 'AbortError' || err.message === 'Export cancelled' || err.message.includes('Abort')) {
                console.log("[Export] Cancelled.");
            } else {
                console.error("[Export] Error:", err);
                alert("Export failed: " + err.message);
            }
        } finally {
            setIsExporting(false);
            setAbortController(null);
        }
    };

    return {
        isExporting,
        exportProgress,
        showExportSettings,
        setShowExportSettings,
        exportSettings,
        setExportSettings,
        handleExportClick,
        handleStartExport,
        QUALITY_MAP
    };
}

return { useExport };
