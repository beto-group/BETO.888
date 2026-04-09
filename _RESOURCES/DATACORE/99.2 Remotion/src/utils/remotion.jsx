const { createContext, useContext, useState, useEffect, useMemo } = dc;

/**
 * Remotion Compatibility Layer for Datacore
 * Isolation Mode: Dynamically loads and exports official Remotion/React libraries.
 */

const RemotionContext = createContext(null);

let _officialRemotion = null;
let _officialPlayer = null;
let _officialReact = null;
let _officialReactDOM = null;

const LoadingPlaceholder = ({ name }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#8b5cf6', fontSize: '14px', fontFamily: 'monospace',
        background: '#000'
    }}>
        Loading {name}...
    </div>
);

async function ensureLibraries() {
    if (_officialRemotion && _officialPlayer && _officialReact) {
        return { remotion: _officialRemotion, player: _officialPlayer, react: _officialReact, reactDom: _officialReactDOM };
    }

    const utilsPath = "_RESOURCES/DATACORE/28 LoadScript/D.q.loadscript.component.md";
    const { loadScript } = await dc.require(dc.headerLink(utilsPath, "LoadScriptUpgrade"));

    try {
        // Use a consistent esm.sh version for all related libs
        const VERSION = "4.0.434";
        const REACT_VERSION = "18.2.0";
        const [remotion, player, react, reactDom] = await Promise.all([
            loadScript(dc, `https://esm.sh/remotion@${VERSION}?deps=react@${REACT_VERSION},react-dom@${REACT_VERSION}`, { type: 'module', silent: true }),
            loadScript(dc, `https://esm.sh/@remotion/player@${VERSION}?deps=react@${REACT_VERSION},react-dom@${REACT_VERSION}`, { type: 'module', silent: true }),
            loadScript(dc, `https://esm.sh/react@${REACT_VERSION}`, { type: 'module', silent: true }),
            loadScript(dc, `https://esm.sh/react-dom@${REACT_VERSION}?deps=react@${REACT_VERSION}`, { type: 'module', silent: true })
        ]);

        if (!remotion || !player || !react || !reactDom) throw new Error("Load failed");

        const extract = (mod, hint) => mod[hint] ? mod : (mod.default?.[hint] ? mod.default : mod.default || mod);

        _officialRemotion = extract(remotion, 'Sequence');
        _officialPlayer = extract(player, 'Player');
        _officialReact = react.createElement ? react : (react.default?.createElement ? react.default : react.default);
        _officialReactDOM = reactDom.render ? reactDom : (reactDom.default?.render ? reactDom.default : (reactDom.createRoot ? reactDom : reactDom.default));

        return { remotion: _officialRemotion, player: _officialPlayer, react: _officialReact, reactDom: _officialReactDOM };
    } catch (err) {
        console.error("[RemotionBridge] Fatal Load Error:", err);
        throw err;
    }
}

function RemotionProvider({ children, frame, fps, width, height, durationInFrames }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        ensureLibraries().then(() => setIsReady(true)).catch(() => { });
    }, []);

    const value = useMemo(() => ({
        frame, fps, width, height, durationInFrames, isReady
    }), [frame, fps, width, height, durationInFrames, isReady]);

    if (!isReady) return <LoadingPlaceholder name="Remotion Engine" />;

    return <RemotionContext.Provider value={value}>{children}</RemotionContext.Provider>;
}

// Wrappers that use PREACT (for the control UI only)
function PlayerWrapper(props) {
    if (!_officialPlayer?.Player) return <LoadingPlaceholder name="Player" />;
    return dc.preact.createElement(_officialPlayer.Player, props);
}

// Return the bridge object
return {
    RemotionProvider,
    ensureLibraries,
    // Use GETTERS so that index.jsx sees the values when they change
    get React() { return _officialReact; },
    get ReactDOM() { return _officialReactDOM; },
    get Sequence() { return _officialRemotion?.Sequence; },
    get Player() { return PlayerWrapper; },
    get OfficialPlayer() { return _officialPlayer; },
    get OfficialRemotion() { return _officialRemotion; },
    get OfficialSequence() { return _officialRemotion?.Sequence; },
    get interpolate() { return _officialRemotion?.interpolate; },
    get spring() { return _officialRemotion?.spring; },
    get officialRemotion() { return _officialRemotion; },
    get officialPlayer() { return _officialPlayer; },
    get officialReact() { return _officialReact; },
    get officialReactDOM() { return _officialReactDOM; }
};
