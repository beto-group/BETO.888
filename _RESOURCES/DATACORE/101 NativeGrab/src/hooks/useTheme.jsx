
function useTheme({ css, folderPath }) {
    const { useEffect } = dc;

    useEffect(() => {
        if (!css || !folderPath) return;
        const styleId = 'native-grab-styles-' + folderPath.replace(/[^a-zA-Z0-9]/g, '');
        if (!document.getElementById(styleId)) {
            const styleTag = document.createElement('style');
            styleTag.id = styleId;
            styleTag.innerHTML = css;
            document.head.appendChild(styleTag);
        }
    }, [css, folderPath]);
}

return { useTheme };
