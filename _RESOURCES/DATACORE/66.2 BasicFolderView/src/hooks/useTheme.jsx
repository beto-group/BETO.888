/**
 * Custom hook to manage theme injection.
 * Ensures styles are mounted only once and cleaned up if necessary.
 * @param {string} css - The CSS string to inject.
 * @param {string} folderPath - Unique path identifier for style ID generation.
 */
function useTheme({ css, folderPath }) {
    const { useEffect } = dc;

    useEffect(() => {
        if (!css || !folderPath) return;

        // Generate a safe, unique ID based on the folder path
        const styleId = 'bfv-styles-' + folderPath.replace(/[^a-zA-Z0-9]/g, '');

        // Check if style already exists
        if (!document.getElementById(styleId)) {
            const styleTag = document.createElement('style');
            styleTag.id = styleId;
            styleTag.innerHTML = css;
            document.head.appendChild(styleTag);
            console.log(`[Datacore] Injected styles: ${styleId}`);
        }

        // Optional: Cleanup on unmount (often skipped to prevent flashing on reload)
        // return () => {
        //     const el = document.getElementById(styleId);
        //     if (el) el.remove();
        // };
    }, [css, folderPath]);
}

return { useTheme };
