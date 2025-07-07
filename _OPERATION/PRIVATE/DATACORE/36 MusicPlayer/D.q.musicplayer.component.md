



# ViewComponent

```jsx
// At the top of your Datacore JS block, import the React hooks we need.
const { useState, useRef, useEffect } = dc;

// ====================================================================================
// --- ALL PROVIDERS, API, and UTILS remain the same. They are not the problem.   ---
// ====================================================================================
const providers = {};
providers.youtube = (() => { const NAME = 'YouTube'; const search = async () => []; const getStreamUrl = async () => { throw new Error("YouTube is disabled."); }; const normalize = (t) => ({}); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.funkwhale = (() => { const NAME = 'Funkwhale'; const search = async () => []; const getStreamUrl = async () => { throw new Error("Funkwhale is disabled."); }; const normalize = (t) => ({}); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.emanate = (() => { const NAME = 'Emanate'; const search = async () => []; const getStreamUrl = async () => { throw new Error("Emanate is disabled."); }; const normalize = (t) => ({}); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.napster = (() => { const NAME = 'Napster'; const search = async () => []; const getStreamUrl = async () => { throw new Error("Napster is disabled."); }; const normalize = (t) => ({}); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.audius = (() => { const NAME = 'Audius', APP_NAME = "DatacoreMusicPlayer"; const search = (q, utils) => utils.fetchApi(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=${APP_NAME}`).then(r => r.data || []); const getStreamUrl = (t, utils) => Promise.resolve(`https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=${APP_NAME}`); const normalize = (t) => ({ id: t.id, title: t.title, artist: t.user.name, url: null, _raw: t, _source: 'audius' }); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.jamendo = (() => { const NAME = 'Jamendo', CLIENT_ID = "836523a7"; const search = (q, utils) => utils.fetchApi(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&search=${encodeURIComponent(q)}`).then(r => r.results || []); const getStreamUrl = (t, utils) => Promise.resolve(t.audio); const normalize = (t) => ({ id: `jam-${t.id}`, title: t.name, artist: t.artist_name, url: null, _raw: t, _source: 'jamendo' }); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.odysee = (() => { const NAME = 'Odysee', API_URL = "https://api.odysee.com/api/v3/sdk"; const search = async (q, utils) => { const res = await utils.fetchApi(API_URL, { method: 'POST', contentType: 'application/json', body: JSON.stringify({ method: "claim_search", params: { text: q, stream_type: ["audio", "video"], has_source: true, page_size: 20 } }) }); return (res.result?.items || []).filter(item => item.value?.source?.media_type?.startsWith('audio/')); }; const getStreamUrl = (t, utils) => Promise.resolve(`https://player.odysee.live/content/claims/${t.name}/${t.claim_id}/stream`); const normalize = (t) => ({ id: `odysee-${t.claim_id}`, title: t.value?.title || t.name, artist: t.signing_channel?.name || 'Unknown', url: null, _raw: t, _source: 'odysee' }); return { name: NAME, search, getStreamUrl, normalize }; })();
const MusicAPI = (() => { const _providers = {}; const _utils = { request: dc.app.requestUrl || window.requestUrl, fetchApi: async (url, options = {}) => { if (!_utils.request) throw new Error("Datacore's requestUrl function is not available."); const response = await _utils.request({ url, method: options.method || 'GET', ...options }); if (response.status !== 200) throw new Error(`Request failed, status ${response.status} for ${url}`); return JSON.parse(response.text); } }; const registerProvider = (id, provider) => { _providers[id] = provider; }; const search = async (query, activeProviderIds) => { const providersToSearch = Object.entries(_providers).filter(([id]) => activeProviderIds.has(id)); const settledResults = await Promise.allSettled(providersToSearch.map(([id, provider]) => provider.search(query, _utils))); return settledResults.flatMap((res, i) => { const [id, provider] = providersToSearch[i]; if (res.status === 'fulfilled' && Array.isArray(res.value)) { return res.value.map(track => provider.normalize(track)); } else { console.warn(`Provider '${provider.name}' search failed:`, res.reason); return []; } }); }; const getStreamUrl = async (track) => { const provider = _providers[track._source]; if (!provider) throw new Error(`Provider "${track._source}" not found.`); return provider.getStreamUrl(track._raw || track, _utils); }; return { registerProvider, search, getStreamUrl }; })();
const FileUtils = { LIKED_SONGS_PATH: ".datacore/musicplayer/liked-songs.json", loadLikedSongs: async (vaultAdapter) => { try { if (await vaultAdapter.exists(FileUtils.LIKED_SONGS_PATH)) { return JSON.parse(await vaultAdapter.read(FileUtils.LIKED_SONGS_PATH)); } } catch (error) { console.error("Error loading liked songs:", error); } return {}; }, saveLikedSongs: async (vaultAdapter, songs) => { const dir = FileUtils.LIKED_SONGS_PATH.substring(0, FileUtils.LIKED_SONGS_PATH.lastIndexOf('/')); try { if (!(await vaultAdapter.exists(dir))) await vaultAdapter.mkdir(dir); await vaultAdapter.write(FileUtils.LIKED_SONGS_PATH, JSON.stringify(songs, null, 2)); } catch (error) { console.error("Error saving liked songs:", error); } } };


// ====================================================================================
// --- REWORKED PipHelper with STABLE EVENT LISTENERS ---
// ====================================================================================

const PipHelper = ({ onClose, track, isPlaying, isLiked, onPlayPause, onNext, onPrev, onLike, currentTime, duration, onSeek, volume, onVolumeChange, formatTime }) => {
    const pipWindowRef = useRef(null);
    const activeDrag = useRef(null);
    
    // Create a ref to hold the latest versions of the callback props.
    // This solves the "stale closure" problem.
    const callbacksRef = useRef();
    useEffect(() => {
        callbacksRef.current = { onClose, onPlayPause, onNext, onPrev, onLike, onSeek, onVolumeChange };
    });

    // Effect 1: CREATE the PiP window and its listeners ONCE.
    useEffect(() => {
        const pipWindow = document.createElement('div');
        pipWindowRef.current = pipWindow;
        
        // --- HTML and CSS (Unchanged) ---
        pipWindow.innerHTML = `
            <style>
                .pip-player-container { position: relative; width: 100%; height: 100%; color: white; display: flex; flex-direction: column; padding: 10px 15px; box-sizing: border-box; font-family: sans-serif; gap: 8px; user-select: none; -webkit-user-select: none; }
                .pip-close-btn { position: absolute; top: 2px; right: 5px; cursor: pointer; background: none; border: none; color: #aaa; font-size: 28px; line-height: 1; padding: 0; z-index: 10; }
                .pip-track-info { text-align: center; min-height: 0; }
                .pip-track-info .title { font-size: 1.1em; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .pip-track-info .artist { font-size: 0.9em; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
                .pip-progress-container { display: flex; align-items: center; gap: 8px; font-size: 0.8em; color: #ccc; }
                
                .pip-custom-progress-container { flex-grow: 1; height: 15px; display: flex; align-items: center; cursor: pointer; padding: 5px 0; }
                .pip-custom-progress-track { position: relative; width: 100%; height: 5px; background-color: #444; border-radius: 5px; }
                .pip-custom-progress-filled { position: absolute; top: 0; left: 0; height: 100%; background-color: #fff; border-radius: 5px; pointer-events: none; }
                .pip-custom-progress-handle { position: absolute; top: 50%; width: 14px; height: 14px; background-color: #fff; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }

                .pip-controls { display: flex; justify-content: space-between; align-items: center; position: relative; }
                .pip-controls .main-controls { display: flex; justify-content: center; align-items: center; gap: 15px; flex-grow: 1; }
                .pip-controls button { background: none; border: none; color: white; font-size: 22px; cursor: pointer; transition: transform 0.1s; display: flex; align-items: center; justify-content: center; padding: 5px; }
                .pip-controls button:hover { transform: scale(1.1); }
                .pip-controls .pip-play-pause-btn { font-size: 30px; }
                .pip-controls .pip-like-btn.liked { color: #e44d6b; }
                
                .pip-volume-popup { position: absolute; bottom: calc(100% + 5px); left: 0px; width: 40px; height: 120px; background: rgba(30, 30, 30, 0.95); border: 1px solid #555; border-radius: 20px; display: flex; justify-content: center; align-items: center; transition: opacity 0.2s, visibility 0.2s; }
                .pip-volume-popup.hidden { opacity: 0; visibility: hidden; }
                .pip-custom-volume-container { width: 15px; height: 100px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
                .pip-custom-volume-track { position: relative; height: 100%; width: 5px; background-color: #666; border-radius: 5px; }
                .pip-custom-volume-filled { position: absolute; bottom: 0; left: 0; width: 100%; background-color: #fff; border-radius: 5px; pointer-events: none; }
                .pip-custom-volume-handle { position: absolute; left: 50%; width: 15px; height: 15px; background-color: #fff; border-radius: 50%; transform: translate(-50%, 50%); pointer-events: none; }
            </style>
            <div class="pip-player-container">
                <button class="pip-close-btn" title="Close">×</button>
                <div class="pip-track-info"><div class="title"></div><div class="artist"></div></div>
                <div class="pip-progress-container">
                    <span class="pip-current-time">0:00</span>
                    <div class="pip-custom-progress-container">
                        <div class="pip-custom-progress-track">
                            <div class="pip-custom-progress-filled"></div>
                            <div class="pip-custom-progress-handle"></div>
                        </div>
                    </div>
                    <span class="pip-duration">0:00</span>
                </div>
                <div class="pip-controls">
                    <button class="pip-volume-btn" title="Volume">🔊</button>
                    <div class="pip-volume-popup hidden">
                        <div class="pip-custom-volume-container">
                            <div class="pip-custom-volume-track">
                                <div class="pip-custom-volume-filled"></div>
                                <div class="pip-custom-volume-handle"></div>
                            </div>
                        </div>
                    </div>
                    <div class="main-controls">
                        <button class="pip-prev-btn" title="Previous">«</button>
                        <button class="pip-play-pause-btn" title="Play/Pause"></button>
                        <button class="pip-next-btn" title="Next">»</button>
                    </div>
                    <button class="pip-like-btn" title="Like">♥</button>
                </div>
            </div>`;

        // --- Style and Append Window (Unchanged) ---
        const pipWidth = 350, pipHeight = 150;
        Object.assign(pipWindow.style, { position: "fixed", top: `calc(100% - ${pipHeight}px - 20px)`, left: `calc(100% - ${pipWidth}px - 20px)`, width: `${pipWidth}px`, height: `${pipHeight}px`, zIndex: "10001", backgroundColor: "#1e1e1e", border: "2px solid #5d3eff", borderRadius: "8px", boxShadow: '0 8px 20px rgba(0,0,0,0.5)', cursor: 'grab' });
        document.body.appendChild(pipWindow);

        // --- Define and Attach All Event Listeners (Corrected) ---
        const get = (sel) => pipWindow.querySelector(sel);
        
        // Window Drag Handlers (Unchanged)
        let startX, startY, startTop, startLeft;
        const onWindowDragMove = (e) => { if (!activeDrag.current) { pipWindow.style.top = `${startTop + (e.clientY - startY)}px`; pipWindow.style.left = `${startLeft + (e.clientX - startX)}px`; } };
        const onWindowDragEnd = () => { pipWindow.style.cursor = 'grab'; document.body.style.userSelect = ''; window.removeEventListener("mousemove", onWindowDragMove); window.removeEventListener("mouseup", onWindowDragEnd); };
        const onWindowDragStart = (e) => {
            if (e.target.closest('button, .pip-custom-progress-container, .pip-custom-volume-container')) return;
            e.preventDefault();
            startX = e.clientX; startY = e.clientY; const computed = getComputedStyle(pipWindow); startTop = parseInt(computed.top, 10) || 0; startLeft = parseInt(computed.left, 10) || 0;
            pipWindow.style.cursor = 'grabbing'; document.body.style.userSelect = 'none';
            window.addEventListener("mousemove", onWindowDragMove);
            window.addEventListener("mouseup", onWindowDragEnd);
        };
        pipWindow.addEventListener("mousedown", onWindowDragStart);

        // Slider Drag Handlers (Corrected to use ref)
        const progressContainer = get('.pip-custom-progress-container');
        const volumeContainer = get('.pip-custom-volume-container');
        
        // These handlers now get the latest functions from the ref
        const handleProgressSeek = (e) => { const rect = progressContainer.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); callbacksRef.current.onSeek({ target: { value: p * duration } }); };
        const handleVolumeSeek = (e) => { const rect = volumeContainer.getBoundingClientRect(); const v = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height))); callbacksRef.current.onVolumeChange({ target: { value: v } }); };
        
        const onSliderMouseMove = (e) => { if (activeDrag.current === 'progress') handleProgressSeek(e); else if (activeDrag.current === 'volume') handleVolumeSeek(e); };
        const onSliderMouseUp = () => { activeDrag.current = null; document.removeEventListener('mousemove', onSliderMouseMove); document.removeEventListener('mouseup', onSliderMouseUp); };
        
        const onSliderMouseDown = (e, type) => { e.stopPropagation(); activeDrag.current = type; if (type === 'progress') handleProgressSeek(e); if (type === 'volume') handleVolumeSeek(e); document.addEventListener('mousemove', onSliderMouseMove); document.addEventListener('mouseup', onSliderMouseUp); };
        
        progressContainer.addEventListener('mousedown', (e) => onSliderMouseDown(e, 'progress'));
        volumeContainer.addEventListener('mousedown', (e) => onSliderMouseDown(e, 'volume'));

        // Button Click Handlers (Corrected to use ref)
        const handleAndStop = (handler) => (e) => { e.stopPropagation(); handler(e); };
        
        // These now call the functions from the ref, ensuring they are always up-to-date.
        get('.pip-close-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onClose()));
        get('.pip-prev-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onPrev()));
        get('.pip-play-pause-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onPlayPause()));
        get('.pip-next-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onNext()));
        get('.pip-like-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onLike()));
        
        // Volume Popup Handlers (Unchanged)
        const volumePopup = get('.pip-volume-popup');
        get('.pip-volume-btn').addEventListener('click', handleAndStop(() => volumePopup.classList.toggle('hidden')));
        const handleClickOutside = (e) => { if (!volumePopup.classList.contains('hidden') && !e.target.closest('.pip-volume-popup, .pip-volume-btn')) volumePopup.classList.add('hidden'); };
        document.addEventListener('mousedown', handleClickOutside, true);

        // --- Cleanup Function (Unchanged) ---
        return () => {
            pipWindow.removeEventListener("mousedown", onWindowDragStart);
            window.removeEventListener("mousemove", onWindowDragMove);
            window.removeEventListener("mouseup", onWindowDragEnd);
            document.removeEventListener('mousemove', onSliderMouseMove);
            document.removeEventListener('mouseup', onSliderMouseUp);
            document.removeEventListener('mousedown', handleClickOutside, true);
            if (pipWindow.parentNode) pipWindow.parentNode.removeChild(pipWindow);
        };
    }, [duration]); // Note: Added duration to dependency array for handleProgressSeek. This is a minor but correct improvement.

    // Effect 2: UPDATE the PiP window's visual state on prop changes (Unchanged).
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow || !track) return;
        const get = (sel) => pipWindow.querySelector(sel);
        
        const titleEl = get('.pip-track-info .title');
        titleEl.innerText = track.title;
        titleEl.title = track.title;
        const artistEl = get('.pip-track-info .artist');
        artistEl.innerText = track.artist;
        artistEl.title = track.artist;

        get('.pip-play-pause-btn').innerText = isPlaying ? '❚❚' : '►';
        get('.pip-like-btn').classList.toggle('liked', isLiked);
        get('.pip-volume-btn').innerText = volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔇';
        
        get('.pip-current-time').innerText = formatTime(currentTime);
        get('.pip-duration').innerText = formatTime(duration);
        const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
        get('.pip-custom-progress-filled').style.width = `${progressPercent}%`;
        get('.pip-custom-progress-handle').style.left = `${progressPercent}%`;

        get('.pip-custom-volume-filled').style.height = `${volume * 100}%`;
        get('.pip-custom-volume-handle').style.bottom = `${volume * 100}%`;

    }, [track, isPlaying, isLiked, currentTime, duration, volume, formatTime]);

    return null;
};


// ====================================================================================
// --- NEW: CUSTOM PROGRESS BAR COMPONENT ---
// This component replaces the faulty native <input type="range">
// ====================================================================================
const CustomProgressBar = ({ duration, currentTime, onSeek, isDisabled }) => {
    const progressBarRef = useRef(null);
    const [isSeeking, setIsSeeking] = useState(false);

    const handleSeekInteraction = (e) => {
        if (isDisabled || !progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clickPosition = clientX - rect.left;
        const barWidth = rect.width;
        const progress = Math.max(0, Math.min(1, clickPosition / barWidth));
        const newTime = progress * duration;
        onSeek({ target: { value: newTime } });
    };

    const handleMouseDown = (e) => {
        if (isDisabled) return;
        setIsSeeking(true);
        handleSeekInteraction(e);
    };

    useEffect(() => {
        const handleMouseMove = (e) => { if (isSeeking) { handleSeekInteraction(e); } };
        const handleMouseUp = () => { setIsSeeking(false); };
        if (isSeeking) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isSeeking, duration, onSeek, isDisabled]);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div 
            ref={progressBarRef}
            className={`custom-progress-container ${isDisabled ? 'disabled' : ''}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
        >
            <div className="custom-progress-track">
                <div 
                    className="custom-progress-filled" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
                <div 
                    className="custom-progress-handle" 
                    style={{ left: `${progressPercent}%` }}
                ></div>
            </div>
        </div>
    );
};

// ====================================================================================
// --- CORE APPLICATION (Updated to remove pipRenderTrigger) ---
// ====================================================================================
function MusicPlayer() {
    const ALL_PROVIDER_IDS = Object.keys(providers);
    const HARD_DISABLED_PROVIDERS = new Set(['youtube', 'napster', 'funkwhale', 'emanate', 'odysee']);
    const ENABLED_PROVIDERS = ALL_PROVIDER_IDS.filter(id => !HARD_DISABLED_PROVIDERS.has(id));
    ALL_PROVIDER_IDS.forEach(id => MusicAPI.registerProvider(id, providers[id]));
    const [playlist, setPlaylist] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Search for music to get started.");
    const [likedSongs, setLikedSongs] = useState({});
    const [activeTab, setActiveTab] = useState('queue');
    const [activeProviders, setActiveProviders] = useState(new Set(ENABLED_PROVIDERS));
    const [isPipMode, setIsPipMode] = useState(false);
    const [volume, setVolume] = useState(1);
    // REMOVED: pipRenderTrigger state is no longer needed.
    const audioRef = useRef(null);
    const vaultAdapter = dc.app.vault.adapter;
    const currentTrack = currentTrackIndex !== null && currentTrackIndex < playlist.length ? playlist[currentTrackIndex] : null;

    useEffect(() => { FileUtils.loadLikedSongs(vaultAdapter).then(setLikedSongs); }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            const newSrc = currentTrack?.url || "";
            if (audioRef.current.src !== newSrc) {
                audioRef.current.src = newSrc;
                if (newSrc) {
                    audioRef.current.load();
                    if (isPlaying) {
                        audioRef.current.play().catch(e => {
                            console.error("Autoplay on new track failed:", e);
                            setIsPlaying(false)
                        });
                    }
                }
            }
        }
    }, [currentTrack, volume]);
    
    useEffect(() => { 
        if (!audioRef.current || !currentTrack) return; 
        if (isPlaying) {
             audioRef.current.play().catch(e => {
                console.error("Playback sync failed in useEffect", e);
                setIsPlaying(false);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    const toggleProvider = (id) => { if (HARD_DISABLED_PROVIDERS.has(id)) return; setActiveProviders(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
    const toggleAllProviders = () => { setActiveProviders(p => p.size === ENABLED_PROVIDERS.length ? new Set() : new Set(ENABLED_PROVIDERS)); };
    const handleSearch = async (e) => { e.preventDefault(); if (!searchQuery || activeProviders.size === 0) return; setIsLoading(true); setStatusMessage(`Searching...`); setSearchResults([]); const r = await MusicAPI.search(searchQuery, activeProviders); setSearchResults(r); setStatusMessage(r.length > 0 ? "" : "No results found."); setIsLoading(false); };
    
    const playTrackAtIndex = (i) => {
        if (i < 0 || i >= playlist.length) return;
        setCurrentTime(0);
        setCurrentTrackIndex(i);
        setIsPlaying(true);
    };

    const addToPlaylist = async (track) => {
        const i = playlist.findIndex(t => t.id === track.id);
        if (i > -1) {
            playTrackAtIndex(i);
            return;
        };
        setStatusMessage(`Loading...`);
        try {
            const url = await MusicAPI.getStreamUrl(track);
            const p = { ...track, url, _raw: null };
            const n = [...playlist, p];
            setCurrentTime(0);
            setPlaylist(n);
            setCurrentTrackIndex(n.length - 1);
            setIsPlaying(true);
            setStatusMessage(`Added to queue.`);
        } catch (e) {
            console.error(e);
            setStatusMessage(`Error loading track.`);
        }
    };
    
    const handleToggleLike = async (t) => { if (!t) return; const n = { ...likedSongs }; if (n[t.id]) delete n[t.id]; else { const { _raw, ...r } = t; n[t.id] = r; } setLikedSongs(n); await FileUtils.saveLikedSongs(vaultAdapter, n); };
    
    const handlePlayPause = () => {
        if (!currentTrack || !audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => setIsPlaying(true)).catch(error => {
                    console.error("Playback failed:", error);
                    setIsPlaying(false); 
                });
            }
        }
    };

    const handleNext = () => { if (!playlist.length) return; playTrackAtIndex((currentTrackIndex + 1) % playlist.length); };
    const handlePrev = () => {
        if (!playlist.length || !audioRef.current) return;
        if (audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
        } else {
            const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            playTrackAtIndex(prevIndex);
        }
    };
    const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
    const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
    const handleSeek = (e) => { if(audioRef.current) audioRef.current.currentTime = e.target.value; setCurrentTime(e.target.value); };
    const formatTime = (s) => !s || isNaN(s) ? "0:00" : `${Math.floor(s / 60)}:${('0' + Math.floor(s % 60)).slice(-2)}`;
    const handleVolumeChange = (e) => { setVolume(parseFloat(e.target.value)); };

    return (
        <div className="datacore-music-player-wrapper">
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleNext}></audio>
            <style>{`
                /* ALL CSS FROM ORIGINAL CODE IS UNCHANGED */
                .datacore-music-player-wrapper { --primary-accent: #5d3eff; --bg-primary: #1e1e1e; --bg-secondary: #2a2a2a; --bg-tertiary: #3a3a3a; --border-color: #444; --text-primary: #e0e0e0; --text-secondary: #aaa; background-color: var(--bg-primary); } body.theme-light .datacore-music-player-wrapper { --primary-accent: #5d3eff; --bg-primary: #ffffff; --bg-secondary: #f1f3f5; --bg-tertiary: #e9ecef; --border-color: #dee2e6; --text-primary: #212529; --text-secondary: #868e96; } .datacore-music-player-wrapper .app-container { display: flex; flex-wrap: wrap; gap: 20px; font-family: sans-serif; color: var(--text-primary); max-width: 1200px; margin: auto; } .datacore-music-player-wrapper .search-and-player { flex: 2; display: flex; flex-direction: column; gap: 20px; min-width: 400px; } .datacore-music-player-wrapper .search-panel { display: flex; flex-direction: column; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); } .datacore-music-player-wrapper .search-form { display: flex; } .datacore-music-player-wrapper .search-form input { flex-grow: 1; padding: 12px; border: none; background: transparent; color: var(--text-primary); font-size: 1em; border-radius: 8px 0 0 0; } .datacore-music-player-wrapper .search-form input:focus { outline: none; } .datacore-music-player-wrapper .search-form button { padding: 12px 18px; border: none; background: var(--primary-accent); color: white; cursor: pointer; border-radius: 0 8px 0 0; transition: background-color 0.2s; } .datacore-music-player-wrapper .search-form button:hover:not(:disabled) { background-color: #4a2ecc; } .datacore-music-player-wrapper .search-form button:disabled { background-color: #999; cursor: not-allowed; } .datacore-music-player-wrapper .provider-selector { display: flex; flex-wrap: wrap; gap: 5px; padding: 8px 12px; background: var(--bg-primary); border-top: 1px solid var(--border-color); } .datacore-music-player-wrapper .provider-button { background-color: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color); padding: 5px 10px; border-radius: 15px; font-size: 0.8em; cursor: pointer; transition: background-color 0.2s, color 0.2s, opacity 0.2s; } .datacore-music-player-wrapper .provider-button.active { background-color: var(--primary-accent); color: white; border-color: var(--primary-accent); } .datacore-music-player-wrapper .provider-button.hard-disabled { text-decoration: line-through; cursor: not-allowed; opacity: 0.5; } .datacore-music-player-wrapper .provider-button.hard-disabled.active, .datacore-music-player-wrapper .provider-button.hard-disabled:hover { background-color: var(--bg-tertiary); color: var(--text-secondary); border-color: var(--border-color); } .datacore-music-player-wrapper .search-results-container { min-height: 150px; max-height: 40vh; overflow-y: auto; } .datacore-music-player-wrapper .result-item { display: flex; justify-content: space-between; align-items: center; padding: 0 15px 0 0; border-top: 1px solid var(--bg-tertiary); transition: background-color 0.2s; } .datacore-music-player-wrapper .result-info { display: flex; align-items: center; flex-grow: 1; padding: 10px 15px; cursor: pointer; } .datacore-music-player-wrapper .result-item:hover { background-color: rgba(93, 62, 255, 0.1); } .datacore-music-player-wrapper .result-text .title { font-weight: bold; } .datacore-music-player-wrapper .result-text .artist { font-size: 0.9em; color: var(--text-secondary); } .datacore-music-player-wrapper .preview-tag { font-size: 0.7em; font-weight: bold; padding: 2px 5px; margin-left: 8px; border-radius: 4px; background-color: #a99500; color: white; } .datacore-music-player-wrapper .source-tag { font-size: 0.75em; padding: 3px 6px; border-radius: 4px; background-color: var(--bg-tertiary); color: var(--text-secondary); text-transform: capitalize; margin-left: 10px; } .datacore-music-player-wrapper .status-message { padding: 20px 15px; color: var(--text-secondary); text-align: center; } .datacore-music-player-wrapper .music-player { background-color: var(--bg-primary); color: var(--text-primary); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px; border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.5); } .datacore-music-player-wrapper .track-info-header { display: flex; align-items: center; justify-content: space-between; gap: 15px; } .datacore-music-player-wrapper .track-info-main { flex-grow: 1; min-width: 0; } .datacore-music-player-wrapper .track-info-main h2 { margin: 0 0 5px 0; font-size: 1.5em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .datacore-music-player-wrapper .track-info-main p { margin: 0; color: var(--text-secondary); } .datacore-music-player-wrapper .like-button { background: none; border: none; font-size: 1.5em; cursor: pointer; color: #888; transition: color 0.2s, transform 0.2s; padding: 5px;} .datacore-music-player-wrapper .like-button.liked { color: #e44d6b; } .datacore-music-player-wrapper .like-button:hover { transform: scale(1.1); } .datacore-music-player-wrapper .progress-container { display: flex; align-items: center; gap: 10px; }
                .datacore-music-player-wrapper .custom-progress-container { flex-grow: 1; height: 15px; display: flex; align-items: center; cursor: pointer; -webkit-user-select: none; user-select: none; }
                .datacore-music-player-wrapper .custom-progress-container.disabled { cursor: not-allowed; }
                .datacore-music-player-wrapper .custom-progress-track { position: relative; width: 100%; height: 5px; background-color: var(--bg-tertiary); border-radius: 5px; }
                .datacore-music-player-wrapper .custom-progress-filled { position: absolute; top: 0; left: 0; height: 100%; background-color: var(--primary-accent); border-radius: 5px; }
                .datacore-music-player-wrapper .custom-progress-handle { position: absolute; top: 50%; width: 15px; height: 15px; background-color: var(--primary-accent); border-radius: 50%; transform: translate(-50%, -50%); transition: transform 0.1s ease; }
                .datacore-music-player-wrapper .custom-progress-container:hover .custom-progress-handle { transform: translate(-50%, -50%) scale(1.1); }
                .datacore-music-player-wrapper .controls { display: flex; align-items: center; justify-content: space-between; gap: 10px; } .datacore-music-player-wrapper .controls button { background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.2em; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; flex-shrink: 0;} .datacore-music-player-wrapper .controls button:hover:not(:disabled) { background-color: #4e4e4e; } .datacore-music-player-wrapper .controls button.play-pause { width: 50px; height: 50px; font-size: 1.5em; background-color: var(--primary-accent); margin: 0 5px; } .datacore-music-player-wrapper .controls button:disabled { opacity: 0.5; cursor: not-allowed; } .datacore-music-player-wrapper .volume-container { display: flex; align-items: center; gap: 8px; flex-grow: 1; min-width: 100px; max-width: 150px; } .datacore-music-player-wrapper .volume-container span { font-size: 1.2em; } .datacore-music-player-wrapper .volume-slider { flex-grow: 1; -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: var(--bg-tertiary); border-radius: 4px; outline: none; } .datacore-music-player-wrapper .volume-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: var(--text-primary); border-radius: 50%; cursor: pointer; } .datacore-music-player-wrapper .volume-slider::-moz-range-thumb { width: 14px; height: 14px; background: var(--text-primary); border-radius: 50%; cursor: pointer; } .datacore-music-player-wrapper .playlist-panel { flex: 1; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); min-width: 300px; display: flex; flex-direction: column; max-height: calc(40vh + 240px); } .datacore-music-player-wrapper .playlist-tabs { display: flex; border-bottom: 1px solid var(--border-color); } .datacore-music-player-wrapper .tab-button { flex: 1; padding: 12px; background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1em; } .datacore-music-player-wrapper .tab-button.active { color: var(--primary-accent); border-bottom: 2px solid var(--primary-accent); font-weight: bold; } .datacore-music-player-wrapper .playlist { overflow-y: auto; flex-grow: 1; } .datacore-music-player-wrapper .playlist-item { padding: 12px 15px; border-bottom: 1px solid var(--bg-tertiary); cursor: pointer; transition: background-color 0.2s; } .datacore-music-player-wrapper .playlist-item:hover { background-color: rgba(93, 62, 255, 0.1); } .datacore-music-player-wrapper .playlist-item.active { background-color: var(--primary-accent); color: white; } .datacore-music-player-wrapper .playlist-item.active .artist { color: #eee; } .datacore-music-player-wrapper .playlist-item .title { font-weight: bold; } .datacore-music-player-wrapper .playlist-item .artist { font-size: 0.9em; color: var(--text-secondary); }
            `}</style>
            
            <div className="app-container">
                {/* ... The rest of the JSX is unchanged ... */}
                 <div className="search-and-player">
                    <div className="search-panel">
                        <form onSubmit={handleSearch} className="search-form"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for music..." /><button type="submit" disabled={isLoading || activeProviders.size === 0}>{isLoading ? '...' : 'Search'}</button></form>
                        <div className="provider-selector"><button className={`provider-button ${activeProviders.size === ENABLED_PROVIDERS.length ? 'active' : ''}`} onClick={toggleAllProviders}>All</button>{ALL_PROVIDER_IDS.map(id => { const d = HARD_DISABLED_PROVIDERS.has(id); return (<button key={id} className={`provider-button ${activeProviders.has(id) && !d ? 'active' : ''} ${d ? 'hard-disabled' : ''}`} onClick={() => toggleProvider(id)} disabled={d} title={d ? `${providers[id].name} is disabled.` : providers[id].name}>{providers[id].name}</button>); })}</div>
                        <div className="search-results-container">{isLoading ? <div className="status-message">Searching...</div> : searchResults.length > 0 ? searchResults.map(track => (<div key={track.id} className="result-item"><div className="result-info" onClick={() => addToPlaylist(track)}><div className="result-text"><div className="title">{track.title}</div><div className="artist">{track.artist}</div></div>{track._isPreview && <span className="preview-tag">PREVIEW</span>}</div><span className="source-tag">{providers[track._source]?.name||track._source}</span><button className={`like-button ${likedSongs[track.id]?'liked':''}`} onClick={() => handleToggleLike(track)}>♥</button></div>)) : <div className="status-message">{statusMessage}</div>}</div>
                    </div>
                    <div className="music-player">
                        <div className="track-info-header">
                            <div className="track-info-main"><h2>{currentTrack?.title||"No Track"}</h2><p>{currentTrack?.artist||"Select a song"}</p></div>
                            {currentTrack && <button className={`like-button ${likedSongs[currentTrack?.id]?'liked':''}`} onClick={()=>handleToggleLike(currentTrack)}>♥</button>}
                        </div>
                        <div className="progress-container">
                            <span>{formatTime(currentTime)}</span>
                            <CustomProgressBar duration={duration} currentTime={currentTime} onSeek={handleSeek} isDisabled={!currentTrack} />
                            <span>{formatTime(duration)}</span>
                        </div>
                        <div className="controls">
                            <button onClick={handlePrev} disabled={!currentTrack}>«</button>
                            <button onClick={handlePlayPause} className="play-pause" disabled={!currentTrack}>{isPlaying?'❚❚':'►'}</button>
                            <button onClick={handleNext} disabled={!currentTrack}>»</button>
                            <button onClick={()=>setIsPipMode(true)} className="pip-button" disabled={!currentTrack} title={"Picture-in-Picture"}>⧉</button>
                            <div className="volume-container">
                                <span>{volume>0.5?'🔊':volume>0?'🔉':'🔇'}</span>
                                <input type="range" className="volume-slider" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} disabled={!currentTrack}/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="playlist-panel">
                    <div className="playlist-tabs"><button className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>Queue</button><button className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>Favorites</button></div>
                    <div className="playlist">{activeTab === 'queue' && (playlist.length > 0 ? playlist.map((track, index) => (<div key={`${track.id}-${index}`} className={`playlist-item ${index === currentTrackIndex ? 'active' : ''}`} onClick={() => playTrackAtIndex(index)}><div className="title">{track.title}</div><div className="artist">{track.artist}</div></div>)) : <p style={{ padding: '15px', textAlign: 'center' }}>Queue is empty.</p>)} {activeTab === 'favorites' && (Object.values(likedSongs).length > 0 ? Object.values(likedSongs).map(track => (<div key={track.id} className="result-item"><div className="result-info" onClick={() => addToPlaylist(track)}><div className="result-text"><div className="title">{track.title}</div><div className="artist">{track.artist}</div></div>{track._isPreview && <span className="preview-tag">PREVIEW</span>}</div><button className="like-button liked" onClick={() => handleToggleLike(track)}>♥</button></div>)) : <p style={{ padding: '15px', textAlign: 'center' }}>No favorite songs yet.</p>)}</div>
                </div>
            </div>

            {isPipMode && currentTrack && (
                <PipHelper
                    track={currentTrack}
                    isPlaying={isPlaying}
                    isLiked={!!likedSongs[currentTrack.id]}
                    onPlayPause={handlePlayPause}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onLike={() => handleToggleLike(currentTrack)}
                    onClose={() => setIsPipMode(false)}
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    formatTime={formatTime}
                    // Removed pipRenderTrigger props
                />
            )}
        </div>
    );
}

// ====================================================================================
// --- FINAL EXPORT                                                                 ---
// ====================================================================================

return { MusicPlayer };
```




  
  
  

