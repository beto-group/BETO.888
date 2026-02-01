const CONTAIN_STYLE = { width: '100%', height: '100%', objectFit: 'contain' };

const isMediaVideo = (url) => typeof url === 'string' && url.match(/\.(mp4|webm|ogg|m4v|mkv)([:?|].*|\]\])?$/i);
const isMediaImage = (url) => typeof url === 'string' && url.match(/\.(png|jpg|jpeg|gif|webp|svg)([:?|].*|\]\])?$/i);
const isMediaLocal = (url) => typeof url === 'string' && (url.startsWith('app://') || url.startsWith('obsidian://') || !url.startsWith('http'));

const getMimeType = (url) => {
    if (!url) return 'video/mp4';
    const ext = url.split('.').pop().split('?')[0].toLowerCase();
    const map = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'm4v': 'video/mp4',
        'mkv': 'video/x-matroska'
    };
    return map[ext] || 'video/mp4';
};

const getYTId = (u) => {
    if (!u || typeof u !== 'string') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = u.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeEmbed = (url, startTime) => {
    return null; // As per current implementation
};

const isLink = (u) => typeof u === 'string' && (u.startsWith('http') || u.startsWith('www'));

const getInteractiveUrl = (m) => {
    if (!m) return null;
    const url = typeof m === 'string' ? m : (m.url || m.videoSrc);
    // If it is a link, standard logic
    if (isLink(url)) {
        let target = url;
        if (target.startsWith('www.')) target = 'https://' + target;
        return target;
    }
    // If it is local (not http), return it as is
    if (isMediaLocal(url)) return url;

    // Fallback behavior
    const alt = typeof m === 'object' ? m.url : null;
    let target = isLink(alt) ? alt : null;
    if (target && target.startsWith('www.')) target = 'https://' + target;
    return target;
};

const openResource = async (url, sourcePath = '') => {
    if (!url) return;

    // 1. External Link Check
    if (isLink(url) && !url.startsWith('app://') && !url.startsWith('obsidian://') && !url.startsWith('file://')) {
        // ATTEMPT INTERNAL OPEN FIRST
        // Check for common internal browser view types
        const viewRegistry = dc.app.viewRegistry;
        const knownTypes = ['web-browser', 'surfing-view', 'surfer'];
        const availableType = knownTypes.find(t => viewRegistry.isExtensionRegistered(t) || viewRegistry.viewByType[t]);

        if (availableType) {
            try {
                const leaf = dc.app.workspace.getLeaf('tab');
                await leaf.setViewState({
                    type: availableType,
                    active: true,
                    state: { url: url }
                });
                return;
            } catch (e) {
                console.warn("Failed to open internal browser leaf", e);
            }
        }

        // Fallback to Window.Open (External) if no internal plugin found
        window.open(url);
        return;
    }

    // 2. Cleanup Target Path
    let target = decodeURIComponent(url);

    // Strip Wikilinks
    target = target.replace(/^\[\[/, '').replace(/\]\]$/, '');

    // Strip Query Params
    if (target.includes('?')) target = target.split('?')[0];

    // Strip Protocols
    if (target.startsWith('app://') || target.startsWith('obsidian://') || target.startsWith('file://')) {
        // Only keep the standard path if possible, but regexing out the guid is hard/risky.
        // If it sends 'app://.../File.webm', openLinkText fails.
        // We will try to extract just the filename as a fallback.
    }

    try {
        // Try exact path first
        await dc.app.workspace.openLinkText(target, sourcePath, true);
    } catch (e) {
        // Fallback: Try just the filename (fuzzy match)
        try {
            const parts = target.split('/');
            const basename = parts[parts.length - 1];
            if (basename && basename !== target) {
                await dc.app.workspace.openLinkText(basename, sourcePath, true);
                return;
            }
        } catch (e2) { }

        console.error("OpenLinkText Failed", e);
        window.open(url);
    }
};

return {
    CONTAIN_STYLE,
    isMediaVideo,
    isMediaImage,
    isMediaLocal,
    getMimeType,
    getYTId,
    getYouTubeEmbed,
    isLink,
    getInteractiveUrl,
    openResource
};
