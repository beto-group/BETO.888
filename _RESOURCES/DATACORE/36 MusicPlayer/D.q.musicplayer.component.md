	



# ViewComponent

```jsx
// At the top of your Datacore JS block, import the React hooks we need.
const { useState, useRef, useEffect, useCallback } = dc;

// ====================================================================================
// --- GLOBAL CONSTANTS ---
// ====================================================================================
const DEFAULT_PIP_HEIGHT = 150;
const EXPANDED_PIP_HEIGHT = 500;

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
// --- COMPREHENSIVE PipHelper with Expanded View Support ---
// ====================================================================================

const PipHelper = ({ 
    onMount, onClose, track, isPlaying, isLiked, onPlayPause, onNext, onPrev, onLike, 
    currentTime, duration, onSeek, volume, onVolumeChange, formatTime, 
    isExpanded, onToggleExpand, 
    isShuffle, onToggleShuffle, loopMode, onCycleLoopMode, 
    playAllLikedSongs, isPlayingAllLiked, likedSongsCount,
    isVisible
}) => {
    const pipWindowRef = useRef(null);
    const activeDrag = useRef(null);
    const callbacksRef = useRef();
    useEffect(() => { callbacksRef.current = { 
        onClose, onPlayPause, onNext, onPrev, onLike, onSeek, onVolumeChange, 
        onToggleExpand, onToggleShuffle, onCycleLoopMode, playAllLikedSongs 
    }; });

    useEffect(() => {
        const pipWindow = document.createElement('div');
        pipWindowRef.current = pipWindow;
        pipWindow.innerHTML = `
            <style>
                .pip-player-container { position: relative; width: 100%; height: 100%; color: white; display: flex; flex-direction: column; padding: 10px 15px; box-sizing: border-box; font-family: sans-serif; gap: 8px; user-select: none; -webkit-user-select: none; }
                .pip-close-btn { 
                    position: absolute; 
                    top: 5px; 
                    right: 5px; 
                    cursor: pointer; 
                    background: rgba(0, 0, 0, 0.5); 
                    border: 1px solid #555; 
                    border-radius: 4px;
                    color: #aaa; 
                    width: 28px;
                    height: 28px;
                    padding: 4px; 
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .pip-close-btn:hover {
                    background: rgba(139, 125, 216, 0.2);
                    border-color: #8b7dd8;
                    color: #fff;
                    transform: scale(1.1);
                }
                .pip-track-info { text-align: center; min-height: 0; }
                .pip-track-info .title { font-size: 1.1em; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .pip-track-info .artist { font-size: 0.9em; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
                .pip-progress-container { display: flex; align-items: center; gap: 8px; font-size: 0.8em; color: #ccc; }
                .pip-custom-progress-container { flex-grow: 1; height: 15px; display: flex; align-items: center; cursor: pointer; padding: 5px 0; }
                .pip-custom-progress-track { position: relative; width: 100%; height: 5px; background-color: #444; border-radius: 5px; }
                .pip-custom-progress-filled { position: absolute; top: 0; left: 0; height: 100%; background-color: #fff; border-radius: 5px; pointer-events: none; }
                .pip-custom-progress-handle { position: absolute; top: 50%; width: 14px; height: 14px; background-color: #fff; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
                
                /* --- MODIFIED CONTROL STYLES --- */
                .pip-controls { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    width: 100%;
                    gap: 4px;
                    overflow: visible;
                }
                .pip-volume-wrapper { position: relative; flex-shrink: 0; }
                .main-playback-controls { 
                    display: flex; 
                    align-items: center; 
                    gap: 8px; 
                    flex-shrink: 0; 
                }
                .pip-right-action-controls { 
                    display: flex; 
                    align-items: center; 
                    gap: 3px; 
                    flex-shrink: 1;
                    min-width: 0;
                    overflow: hidden;
                }
                .pip-controls button { 
                    background: none; 
                    border: none; 
                    color: white; 
                    cursor: pointer; 
                    transition: color 0.2s, transform 0.1s; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    padding: 4px;
                    flex-shrink: 0;
                }
                .pip-controls button:hover { transform: scale(1.05); }
                .pip-controls button:disabled { opacity: 0.5; cursor: not-allowed; }
                
                /* Specific button sizing */
                .main-playback-controls button { font-size: 20px; }
                .main-playback-controls .pip-play-pause-btn { font-size: 28px; }
                .pip-right-action-controls button { font-size: 16px; color: #aaa; }
                .pip-volume-btn { font-size: 20px; } 

                .pip-right-action-controls .pip-like-btn { font-size: 20px; color: white; } 
                .pip-right-action-controls .pip-like-btn.liked { color: #e44d6b; }
                .pip-right-action-controls .pip-shuffle-btn.active, 
                .pip-right-action-controls .pip-loop-btn.active { color: #8b7dd8; }
                
                /* Icon container styling */
                .pip-icon-container { display: flex; align-items: center; justify-content: center; }

                .pip-volume-popup { position: absolute; bottom: calc(100% + 5px); left: 0px; width: 40px; height: 120px; background: rgba(30, 30, 30, 0.95); border: 1px solid #555; border-radius: 20px; display: flex; justify-content: center; align-items: center; transition: opacity 0.2s; z-index: 99999; }
                .pip-volume-popup.hidden { opacity: 0; pointer-events: none; }
                .pip-custom-volume-container { width: 15px; height: 100px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
                .pip-custom-volume-track { position: relative; height: 100%; width: 5px; background-color: #666; border-radius: 5px; }
                .pip-custom-volume-filled { position: absolute; bottom: 0; left: 0; width: 100%; background-color: #fff; border-radius: 5px; pointer-events: none; }
                .pip-custom-volume-handle { position: absolute; left: 50%; width: 15px; height: 15px; background-color: #fff; border-radius: 50%; transform: translate(-50%, 50%); pointer-events: none; }
                
                .pip-full-player-mount { 
                    flex-grow: 1; 
                    overflow-y: auto; 
                    min-height: 0; 
                    display: none; 
                    background: linear-gradient(135deg, #000000, #0a0a0a); 
                    border: 1px solid #1a1a1a;
                    border-radius: 8px; 
                    margin-top: 10px;
                    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
                }
                .pip-full-player-mount .app-container { 
                    padding: 0; 
                    display: flex; 
                    flex-direction: column; 
                    height: 100%; 
                    gap: 0;
                }
                .main-tabs { 
                    display: flex; 
                    background: linear-gradient(135deg, #0a0a0a, #141414);
                    border-bottom: 2px solid #1a1a1a; 
                    flex-shrink: 0;
                    border-radius: 8px 8px 0 0;
                }
                .main-tabs button { 
                    flex: 1; 
                    background: transparent; 
                    color: #666; 
                    border: none; 
                    padding: 12px 10px; 
                    font-size: 0.85em; 
                    font-weight: 600; 
                    cursor: pointer; 
                    border-bottom: 2px solid transparent; 
                    transition: all 0.2s ease;
                    position: relative;
                }
                .main-tabs button:hover { 
                    background: rgba(139, 125, 216, 0.1); 
                    color: #aaa; 
                }
                .main-tabs button.active { 
                    color: #ffffff; 
                    border-bottom-color: #8b7dd8;
                    background: rgba(139, 125, 216, 0.15);
                }
                .tab-content { 
                    flex-grow: 1; 
                    overflow-y: auto; 
                    padding: 12px;
                    background: #000000;
                }
                
                /* Search Form Styling */
                .tab-content form {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .tab-content input[type="text"] {
                    flex: 1;
                    background: linear-gradient(135deg, #0a0a0a, #141414);
                    border: 1px solid #333;
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: #ffffff;
                    font-size: 0.9em;
                    outline: none;
                    transition: all 0.2s ease;
                }
                .tab-content input[type="text"]:focus {
                    border-color: #8b7dd8;
                    box-shadow: 0 0 0 2px rgba(139, 125, 216, 0.2);
                }
                .tab-content input[type="text"]::placeholder {
                    color: #666;
                }
                .tab-content button[type="submit"] {
                    background: linear-gradient(135deg, #8b7dd8, #7a6bc7);
                    border: 1px solid #9d8de8;
                    border-radius: 6px;
                    padding: 8px 20px;
                    color: #ffffff;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9em;
                }
                .tab-content button[type="submit"]:hover {
                    background: linear-gradient(135deg, #9d8de8, #8b7dd8);
                    box-shadow: 0 2px 8px rgba(139, 125, 216, 0.4);
                    transform: translateY(-1px);
                }
                .tab-content button[type="submit"]:active {
                    transform: translateY(0);
                }
                
                /* Track List Items */
                .tab-content .track-item {
                    background: linear-gradient(135deg, #0a0a0a, #141414);
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 8px;
                    margin-bottom: 8px;
                    transition: all 0.2s ease;
                }
                .tab-content .track-item:hover {
                    border-color: #333;
                    background: linear-gradient(135deg, #141414, #1a1a1a);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                }
                
                /* Status Messages */
                .tab-content p {
                    color: #888;
                    text-align: center;
                    padding: 20px;
                    font-size: 0.9em;
                }
            </style>
            <div class="pip-player-container">
                <button class="pip-close-btn" title="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="pip-full-player-mount" id="pip-full-player-mount-point"></div> 
                <div class="pip-track-info"><div class="title"></div><div class="artist"></div></div>
                <div class="pip-progress-container">
                    <span class="pip-current-time">0:00</span>
                    <div class="pip-custom-progress-container">
                        <div class="pip-custom-progress-track"><div class="pip-custom-progress-filled"></div><div class="pip-custom-progress-handle"></div></div>
                    </div>
                    <span class="pip-duration">0:00</span>
                </div>

                <div class="pip-controls">
                    <!-- Left Group: Volume -->
                    <div class="pip-volume-wrapper">
                        <button class="pip-volume-btn" title="Volume">
                            <span class="pip-icon-container"></span>
                        </button>
                        <div class="pip-volume-popup hidden">
                            <div class="pip-custom-volume-container">
                                <div class="pip-custom-volume-track">
                                    <div class="pip-custom-volume-filled"></div>
                                    <div class="pip-custom-volume-handle"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Middle Group: Playback Controls -->
                    <div class="main-playback-controls">
                        <button class="pip-prev-btn" title="Previous">
                            <span class="pip-icon-container"></span>
                        </button>
                        <button class="pip-play-pause-btn" title="Play/Pause">
                            <span class="pip-icon-container"></span>
                        </button>
                        <button class="pip-next-btn" title="Next">
                            <span class="pip-icon-container"></span>
                        </button>
                    </div>

                    <!-- Right Group: Shuffle, Loop, Play All Favorites, Like, Expand -->
                    <div class="pip-right-action-controls">
                        <button class="pip-shuffle-btn" title="Toggle Shuffle">
                            <span class="pip-icon-container"></span>
                        </button>
                        <button class="pip-loop-btn" title="Cycle Loop Mode">
                            <span class="pip-icon-container"></span>
                        </button>
                        <button class="pip-play-all-favs-btn" title="Play All Favorites">
                            <span class="pip-icon-container"></span>
                        </button>
                        <button class="pip-like-btn" title="Like">
                            <span class="pip-icon-container"></span>
                        </button>
                        <button class="pip-expand-btn" title="Expand/Collapse Full Player">
                            <span class="pip-icon-container"></span>
                        </button> 
                    </div>
                </div>
            </div>`;
        const pipWidth = 350;
        Object.assign(pipWindow.style, { 
            position: "fixed", 
            top: `calc(100% - ${DEFAULT_PIP_HEIGHT}px - 20px)`, 
            left: `calc(100% - ${pipWidth}px - 20px)`, 
            width: `${pipWidth}px`, 
            height: `${DEFAULT_PIP_HEIGHT}px`, 
            zIndex: "10001", 
            backgroundColor: "#0a0a0a", 
            border: "2px solid #8b7dd8",
            borderRadius: "8px", 
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)', 
            cursor: 'grab', 
            display: isVisible ? 'flex' : 'none', 
            flexDirection: 'column', 
            transition: 'height 0.2s ease-out, top 0.2s ease-out' 
        }); 
        document.body.appendChild(pipWindow);
        const mountPoint = pipWindow.querySelector('#pip-full-player-mount-point');
        if (onMount) onMount(mountPoint);
        const get = (sel) => pipWindow.querySelector(sel);
        
        // Render icons using dc.Icon
        const renderIcon = (selector, iconName, size = '18px') => {
            const container = get(selector);
            if (container) {
                dc.preact.render(<dc.Icon icon={iconName} style={{width: size, height: size, pointerEvents: 'none'}} />, container);
            }
        };
        renderIcon('.pip-volume-btn .pip-icon-container', 'volume-2', '20px');
        renderIcon('.pip-prev-btn .pip-icon-container', 'skip-back', '20px');
        renderIcon('.pip-play-pause-btn .pip-icon-container', 'pause', '24px');
        renderIcon('.pip-next-btn .pip-icon-container', 'skip-forward', '20px');
        renderIcon('.pip-shuffle-btn .pip-icon-container', 'shuffle');
        renderIcon('.pip-loop-btn .pip-icon-container', 'repeat');
        renderIcon('.pip-play-all-favs-btn .pip-icon-container', 'list-music');
        renderIcon('.pip-like-btn .pip-icon-container', 'heart');
        renderIcon('.pip-expand-btn .pip-icon-container', 'maximize-2', '16px');
        let startX, startY, startTop, startLeft;
        const onWindowDragMove = (e) => { if (isExpanded && e.target.closest('.pip-full-player-mount')) return; if (!activeDrag.current) { pipWindow.style.top = `${startTop + (e.clientY - startY)}px`; pipWindow.style.left = `${startLeft + (e.clientX - startX)}px`; } };
        const onWindowDragEnd = () => { pipWindow.style.cursor = 'grab'; document.body.style.userSelect = ''; window.removeEventListener("mousemove", onWindowDragMove); window.removeEventListener("mouseup", onWindowDragEnd); };
        const onWindowDragStart = (e) => { if (e.target.closest('button, .pip-custom-progress-container, .pip-custom-volume-container, .pip-expand-btn, #pip-full-player-mount-point')) return; e.preventDefault(); startX = e.clientX; startY = e.clientY; const computed = getComputedStyle(pipWindow); startTop = parseInt(computed.top, 10) || 0; startLeft = parseInt(computed.left, 10) || 0; pipWindow.style.cursor = 'grabbing'; document.body.style.userSelect = 'none'; window.addEventListener("mousemove", onWindowDragMove); window.addEventListener("mouseup", onWindowDragEnd); };
        pipWindow.addEventListener("mousedown", onWindowDragStart);
        const progressContainer = get('.pip-custom-progress-container');
        const volumeContainer = get('.pip-custom-volume-container');
        const handleProgressSeek = (e) => { const rect = progressContainer.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); callbacksRef.current.onSeek({ target: { value: (pipWindowRef.current?.__current_duration || 0) * p } }); };
        const handleVolumeSeek = (e) => { const rect = volumeContainer.getBoundingClientRect(); const v = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height))); callbacksRef.current.onVolumeChange({ target: { value: v } }); };
        const onSliderMouseMove = (e) => { if (activeDrag.current === 'progress') handleProgressSeek(e); else if (activeDrag.current === 'volume') handleVolumeSeek(e); };
        const onSliderMouseUp = () => { activeDrag.current = null; document.removeEventListener('mousemove', onSliderMouseMove); document.removeEventListener('mouseup', onSliderMouseUp); };
        const onSliderMouseDown = (e, type) => { e.stopPropagation(); activeDrag.current = type; if (type === 'progress') handleProgressSeek(e); if (type === 'volume') handleVolumeSeek(e); document.addEventListener('mousemove', onSliderMouseMove); document.addEventListener('mouseup', onSliderMouseUp); };
        progressContainer.addEventListener('mousedown', (e) => onSliderMouseDown(e, 'progress'));
        volumeContainer.addEventListener('mousedown', (e) => onSliderMouseDown(e, 'volume'));
        const handleAndStop = (handler) => (e) => { e.stopPropagation(); handler(e); };
        get('.pip-close-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onClose()));
        get('.pip-prev-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onPrev()));
        get('.pip-play-pause-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onPlayPause()));
        get('.pip-next-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onNext()));
        get('.pip-like-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onLike()));
        get('.pip-expand-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onToggleExpand())); 
        get('.pip-shuffle-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onToggleShuffle()));
        get('.pip-loop-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onCycleLoopMode()));
        get('.pip-play-all-favs-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.playAllLikedSongs()));
        const volumePopup = get('.pip-volume-popup');
        const volumeBtn = get('.pip-volume-btn');
        if (volumeBtn && volumePopup) {
            volumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                volumePopup.classList.toggle('hidden');
            });
        }
        const handleClickOutside = (e) => { if (!volumePopup.classList.contains('hidden') && !e.target.closest('.pip-volume-popup, .pip-volume-btn')) volumePopup.classList.add('hidden'); };
        document.addEventListener('mousedown', handleClickOutside, true);
        
        return () => {
            pipWindow.removeEventListener("mousedown", onWindowDragStart);
            window.removeEventListener("mousemove", onWindowDragMove);
            window.removeEventListener("mouseup", onWindowDragEnd);
            document.removeEventListener('mousemove', onSliderMouseMove);
            document.removeEventListener('mouseup', onSliderMouseUp);
            document.removeEventListener('mousedown', handleClickOutside, true);
            if (onMount) onMount(null);
            if (pipWindow.parentNode) pipWindow.parentNode.removeChild(pipWindow);
        };
    }, []);

    // NEW useEffect to control visibility dynamically
    useEffect(() => {
        if (pipWindowRef.current) {
            pipWindowRef.current.style.display = isVisible ? 'flex' : 'none';
        }
    }, [isVisible]);

    // Update track info only when track changes
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        const titleEl = pipWindow.querySelector('.pip-track-info .title');
        const artistEl = pipWindow.querySelector('.pip-track-info .artist');
        if (titleEl && artistEl) {
            titleEl.innerText = track?.title || "No Track Selected";
            titleEl.title = track?.title || "No Track Selected";
            artistEl.innerText = track?.artist || "Use main player to search";
            artistEl.title = track?.artist || "Use main player to search";
        }
    }, [track]);

    // Update play/pause icon only when playing state changes
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        const playPauseContainer = pipWindow.querySelector('.pip-play-pause-btn .pip-icon-container');
        if (playPauseContainer) {
            const iconName = isPlaying ? 'pause' : 'play';
            dc.preact.render(<dc.Icon icon={iconName} style={{width: '24px', height: '24px', pointerEvents: 'none'}} />, playPauseContainer);
        }
    }, [isPlaying]);

    // Update like button only when liked state changes
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        const likeBtn = pipWindow.querySelector('.pip-like-btn');
        if (likeBtn) likeBtn.classList.toggle('liked', isLiked);
    }, [isLiked]);

    // Update volume icon only when volume changes
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        const volumeContainer = pipWindow.querySelector('.pip-volume-btn .pip-icon-container');
        if (volumeContainer) {
            let iconName = 'volume-2';
            if (volume === 0) iconName = 'volume-x';
            else if (volume <= 0.5) iconName = 'volume-1';
            dc.preact.render(<dc.Icon icon={iconName} style={{width: '20px', height: '20px', pointerEvents: 'none'}} />, volumeContainer);
        }
        const volumeFilled = pipWindow.querySelector('.pip-custom-volume-filled');
        const volumeHandle = pipWindow.querySelector('.pip-custom-volume-handle');
        if (volumeFilled) volumeFilled.style.height = `${volume * 100}%`;
        if (volumeHandle) volumeHandle.style.bottom = `${volume * 100}%`;
    }, [volume]);

    // Update progress bar (frequently updated, kept separate)
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        pipWindow.__current_duration = duration;
        const currentTimeEl = pipWindow.querySelector('.pip-current-time');
        const durationEl = pipWindow.querySelector('.pip-duration');
        const progressFilled = pipWindow.querySelector('.pip-custom-progress-filled');
        const progressHandle = pipWindow.querySelector('.pip-custom-progress-handle');
        
        if (currentTimeEl) currentTimeEl.innerText = formatTime(currentTime);
        if (durationEl) durationEl.innerText = formatTime(duration);
        
        const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
        if (progressFilled) progressFilled.style.width = `${progressPercent}%`;
        if (progressHandle) progressHandle.style.left = `${progressPercent}%`;
    }, [currentTime, duration, formatTime]);

    // Update expand/collapse icon only when expanded state changes
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        const expandContainer = pipWindow.querySelector('.pip-expand-btn .pip-icon-container');
        if (expandContainer) {
            const iconName = isExpanded ? 'minimize-2' : 'maximize-2';
            dc.preact.render(<dc.Icon icon={iconName} style={{width: '16px', height: '16px', pointerEvents: 'none'}} />, expandContainer);
        }
    }, [isExpanded]);

    // Update shuffle button only when shuffle state changes
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        const shuffleBtn = pipWindow.querySelector('.pip-shuffle-btn');
        if (shuffleBtn) shuffleBtn.classList.toggle('active', isShuffle);
    }, [isShuffle]);

    // Update loop button only when loop mode changes
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        const loopContainer = pipWindow.querySelector('.pip-loop-btn .pip-icon-container');
        const loopBtn = pipWindow.querySelector('.pip-loop-btn');
        if (loopContainer) {
            const iconName = loopMode === 'one' ? 'repeat-1' : 'repeat';
            dc.preact.render(<dc.Icon icon={iconName} style={{width: '18px', height: '18px', pointerEvents: 'none'}} />, loopContainer);
        }
        if (loopBtn) loopBtn.classList.toggle('active', loopMode !== 'none');
    }, [loopMode]);

    // Update play all favorites button state
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        const playAllFavsBtn = pipWindow.querySelector('.pip-play-all-favs-btn');
        if (playAllFavsBtn) {
            playAllFavsBtn.disabled = isPlayingAllLiked || likedSongsCount === 0;
        }
    }, [isPlayingAllLiked, likedSongsCount]);

    // Handle PiP height changes when expanding/collapsing
    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return;
        
        const oldHeight = parseFloat(getComputedStyle(pipWindow).height);
        const newHeight = isExpanded ? EXPANDED_PIP_HEIGHT : DEFAULT_PIP_HEIGHT;

        if (Math.abs(oldHeight - newHeight) > 1) {
            const currentTop = parseFloat(getComputedStyle(pipWindow).top);
            const heightDifference = newHeight - oldHeight;
            pipWindow.style.top = `${currentTop - heightDifference}px`;
        }

        pipWindow.style.height = `${newHeight}px`;

        const fullPlayerMountPoint = pipWindow.querySelector('#pip-full-player-mount-point');
        if (fullPlayerMountPoint) {
            fullPlayerMountPoint.style.display = isExpanded ? 'flex' : 'none';
            fullPlayerMountPoint.style.flexDirection = 'column';
        }
    }, [isExpanded]);

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
// --- NowPlayingIcon COMPONENT ---
// ====================================================================================
const NowPlayingIcon = () => (
    <svg className="now-playing-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect className="bar" x="4" y="8" width="4" height="12"></rect>
        <rect className="bar" x="10" y="4" width="4" height="16"></rect>
        <rect className="bar" x="16" y="10" width="4" height="10"></rect>
    </svg>
);

// ====================================================================================
// --- PipExpandedView COMPONENT ---
// ====================================================================================
function PipExpandedView(props) {
    const {
        onSearch, 
        isLoading,
        preparingTrackId,
        searchResults, 
        addToQueue, 
        playTrackNow,
        removeFromQueue,
        likedSongs, handleToggleLike, statusMessage,
        activeTab, setActiveTab, playlist, currentTrackIndex, playTrackAtIndex,
        isShuffle, toggleShuffle, 
        loopMode, cycleLoopMode,   
    } = props;
    
    const [internalQuery, setInternalQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(internalQuery);
    };
    
    const likedSongsCount = Object.keys(likedSongs).length;

    return (
        <div className="app-container">
  
            <div className="main-tabs">
                <button className={`tab-button ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>Search</button>
                <button className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>Queue ({playlist.length})</button>
                <button className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>Favorites ({likedSongsCount})</button>
            </div>
            <div className="tab-content">
                {activeTab === 'search' && (
                    <div className="search-panel">
                        <form onSubmit={handleSubmit} className="search-form">
                            <input 
                                name="query" 
                                type="text" 
                                value={internalQuery} 
                                onChange={(e) => setInternalQuery(e.target.value)} 
                                placeholder="Search for music..." 
                            />
                            <button type="submit" disabled={isLoading}>{isLoading ? '...' : 'Go'}</button>
                        </form>
                        <div className="search-results-container">
                            {isLoading ? <div className="status-message">Searching...</div> 
                            : searchResults.length > 0 ? searchResults.map(track => {
                                const isPreparing = preparingTrackId === track.id;
                                return (
                                <div key={track.id} className={`result-item ${isPreparing ? 'preparing' : ''}`}>
                                    <div className="result-info">
                                        <div className="result-text">
                                            <div className="title">{track.title}</div>
                                            <div className="artist">{track.artist}</div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        {isPreparing ? (
                                            <div className="loader"></div>
                                        ) : (
                                            <>
                                                <button className={`like-button ${likedSongs[track.id]?'liked':''}`} onClick={() => handleToggleLike(track)} title="Like">
                                                    <dc.Icon icon="heart" style={{width: '18px', height: '18px'}} />
                                                </button>
                                                <button className="add-queue-button" onClick={() => addToQueue(track)} title="Add to Queue">
                                                    <dc.Icon icon="plus" style={{width: '18px', height: '18px'}} />
                                                </button>
                                                <button className="play-now-button" onClick={() => playTrackNow(track)} title="Play Now">
                                                    <dc.Icon icon="play" style={{width: '18px', height: '18px'}} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                );
                            }) : <div className="status-message">{statusMessage}</div>}
                        </div>
                    </div>
                )}
                {activeTab === 'queue' && (
                    <div className="playlist-panel">
                        <div className="playlist">
                            {playlist.length > 0 ? playlist.map((track, index) => {
                                const isActive = index === currentTrackIndex;
                                return (
                                <div key={`${track.id}-${index}`} className={`result-item ${isActive ? 'active' : ''}`}>
                                    <div className="result-info" onClick={() => playTrackAtIndex(index)} style={{cursor: 'pointer'}}>
                                        {isActive && <NowPlayingIcon />}
                                        <div className="result-text">
                                            <div className="title">{track.title}</div>
                                            <div className="artist">{track.artist}</div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        <button className={`like-button ${likedSongs[track.id]?'liked':''}`} onClick={() => handleToggleLike(track)} title="Like">
                                            <dc.Icon icon="heart" style={{width: '18px', height: '18px'}} />
                                        </button>
                                        <button className="remove-queue-button" onClick={() => removeFromQueue(index)} title="Remove from Queue">
                                            <dc.Icon icon="x" style={{width: '18px', height: '18px'}} />
                                        </button>
                                    </div>
                                </div>
                                );
                            }) : <p style={{ textAlign: 'center', padding: '20px' }}>Queue is empty.</p>}
                        </div>
                    </div>
                )}
                {activeTab === 'favorites' && (
                    <div className="playlist-panel">
                        <div className="playlist">
                            {Object.values(likedSongs).length > 0 ? Object.values(likedSongs).map(track => (
                                <div key={track.id} className="result-item">
                                    <div className="result-info">
                                        <div className="result-text">
                                            <div className="title">{track.title}</div>
                                            <div className="artist">{track.artist}</div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        <button className="like-button liked" onClick={() => handleToggleLike(track)} title="Unlike">
                                            <dc.Icon icon="heart" style={{width: '18px', height: '18px'}} />
                                        </button>
                                        <button className="add-queue-button" onClick={() => addToQueue(track)} title="Add to Queue">
                                            <dc.Icon icon="plus" style={{width: '18px', height: '18px'}} />
                                        </button>
                                        <button className="play-now-button" onClick={() => playTrackNow(track)} title="Play Now">
                                            <dc.Icon icon="play" style={{width: '18px', height: '18px'}} />
                                        </button>
                                    </div>
                                </div>
                            )) : <p style={{ textAlign: 'center', padding: '20px' }}>No favorites yet.</p>}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .result-item { display: flex; align-items: center; justify-content: space-between; transition: opacity 0.2s, background-color 0.2s; padding: 4px; border-radius: 4px; }
                .result-item.preparing { opacity: 0.5; cursor: not-allowed; }
                .result-item.active { background-color: #2a2a2a; }
                .result-info { flex-grow: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
                .result-actions { display: flex; align-items: center; gap: 5px; min-width: 65px; justify-content: flex-end; }
                .search-panel .result-actions { min-width: 105px; }
                .result-actions button { background: #333; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
                .result-actions button.play-now-button { font-size: 20px; line-height: 1; }
                .result-actions button.add-queue-button { font-size: 22px; line-height: 1; }
                .result-actions button.remove-queue-button { font-size: 22px; line-height: 1; color: #aaa; }
                .result-actions button:hover { background: #444; }
                .result-actions button.remove-queue-button:hover { color: #fff; background-color: #c82333; }
                .loader { border: 3px solid #f3f3f3; border-top: 3px solid #8b7dd8; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .now-playing-icon .bar { animation: bounce 1.2s ease-in-out infinite; transform-origin: bottom; }
                .now-playing-icon .bar:nth-child(2) { animation-delay: -0.2s; }
                .now-playing-icon .bar:nth-child(3) { animation-delay: -0.4s; }
                @keyframes bounce { 0%, 40%, 100% { transform: scaleY(0.4); } 20% { transform: scaleY(1.0); } }
            `}</style>
        </div>
    );
}

// ====================================================================================
// --- CORE PLAYER LOGIC (Internal component) ---
// ====================================================================================
function MusicPlayerCore({ initialPipMode = false, initialExpandedMode = false, onPlayStatusChange, onPipVisibilityChange, triggerPipReopen, setTriggerPipReopen, onPipClose, isMobileMode = false }) {
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
    const [isPipMode, setIsPipMode] = useState(initialPipMode);
    const [isPipVisible, setIsPipVisible] = useState(initialPipMode); // Separate state for visibility
    const [volume, setVolume] = useState(1);
    
    // NEW: Advanced playback features from MobileMusicPlayer
    const [isShuffle, setIsShuffle] = useState(false);
    const [loopMode, setLoopMode] = useState('none'); // 'none', 'all', 'one'
    const [isExpandedInPip, setIsExpandedInPip] = useState(initialExpandedMode);
    const [isPlayingAllLiked, setIsPlayingAllLiked] = useState(false);
    const [preparingTrackId, setPreparingTrackId] = useState(null);
    
    const audioRef = useRef(null);
    const pipPlayerMountNode = useRef(null);
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

    // Report play status to parent
    useEffect(() => {
        if (onPlayStatusChange) onPlayStatusChange(isPlaying);
    }, [isPlaying, onPlayStatusChange]);

    // Report PiP visibility to parent
    useEffect(() => {
        if (onPipVisibilityChange) onPipVisibilityChange(isPipVisible);
    }, [isPipVisible, onPipVisibilityChange]);

    // Handle external trigger to reopen PiP
    useEffect(() => {
        if (triggerPipReopen) {
            setIsPipMode(true);
            setIsPipVisible(true);
            if (setTriggerPipReopen) setTriggerPipReopen(false);
        }
    }, [triggerPipReopen, setTriggerPipReopen]);

    const toggleProvider = (id) => { if (HARD_DISABLED_PROVIDERS.has(id)) return; setActiveProviders(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
    const toggleAllProviders = () => { setActiveProviders(p => p.size === ENABLED_PROVIDERS.length ? new Set() : new Set(ENABLED_PROVIDERS)); };
    
    // Search function that accepts query string (for PiP)
    const performSearch = async (query) => {
        if (!query || activeProviders.size === 0) {
            setStatusMessage("Please enter a search query and enable at least one music provider.");
            return;
        }
        setIsLoading(true);
        setStatusMessage(`Searching for "${query}"...`);
        setSearchResults([]);
        try {
            const r = await MusicAPI.search(query, activeProviders);
            setSearchResults(r);
            setStatusMessage(r.length > 0 ? "" : `No results found for "${query}".`);
        } catch (err) {
            setStatusMessage(`Search failed: ${err.message || err.toString()}`);
            console.error("Music search error:", err);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Original search handler for main player (uses searchQuery state)
    const handleSearch = async (e) => { 
        e.preventDefault(); 
        performSearch(searchQuery);
    };
    
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
    
    const handleRemoveFromQueue = (index) => {
        if (index < 0 || index >= playlist.length) return;
        const newPlaylist = [...playlist];
        newPlaylist.splice(index, 1);
        setPlaylist(newPlaylist);
        
        // Adjust current track index if needed
        if (currentTrackIndex !== null) {
            if (index === currentTrackIndex) {
                // Removed the currently playing track
                if (newPlaylist.length === 0) {
                    setCurrentTrackIndex(null);
                    setIsPlaying(false);
                } else {
                    // Play the next track (or previous if it was the last)
                    const newIndex = index >= newPlaylist.length ? newPlaylist.length - 1 : index;
                    setCurrentTrackIndex(newIndex);
                }
            } else if (index < currentTrackIndex) {
                // Removed a track before the current one
                setCurrentTrackIndex(currentTrackIndex - 1);
            }
        }
    };
    
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

    // NEW: Updated handleNext with shuffle and loop support
    const handleNext = () => {
        if (playlist.length === 0) return;
        if (playlist.length === 1 && loopMode !== 'all') {
            if (loopMode === 'none') setIsPlaying(false);
            return;
        }
        if (isShuffle) {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * playlist.length);
            } while (playlist.length > 1 && nextIndex === currentTrackIndex);
            playTrackAtIndex(nextIndex);
        } else {
            const nextIndex = currentTrackIndex + 1;
            if (nextIndex >= playlist.length) {
                if (loopMode === 'all') playTrackAtIndex(0);
                else setIsPlaying(false);
            } else {
                playTrackAtIndex(nextIndex);
            }
        }
    };
    
    const handlePrev = () => {
        if (!playlist.length || !audioRef.current) return;
        if (audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
        } else {
            const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            playTrackAtIndex(prevIndex);
        }
    };
    
    // NEW: Handle track end with loop modes
    const handleTrackEnd = () => {
        if (loopMode === 'one' && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        } else {
            handleNext();
        }
    };
    
    // NEW: Toggle functions for playback modes
    const toggleShuffle = () => setIsShuffle(prev => !prev);
    const cycleLoopMode = () => {
        setLoopMode(prev => {
            if (prev === 'none') return 'all';
            if (prev === 'all') return 'one';
            return 'none';
        });
    };
    
    // NEW: Play all liked songs
    const playAllLikedSongs = async () => {
        if (isPlayingAllLiked || Object.keys(likedSongs).length === 0) return;
        setIsPlayingAllLiked(true);
        setStatusMessage("Preparing your favorite songs...");
        try {
            const likedTracks = Object.values(likedSongs);
            const preparedTracks = await Promise.all(likedTracks.map(async (track) => {
                try {
                    const url = await MusicAPI.getStreamUrl(track);
                    return { ...track, url, _raw: null };
                } catch (e) {
                    console.error("Error preparing track:", e);
                    return null;
                }
            }));
            const successfullyPrepared = preparedTracks.filter(Boolean);
            if (successfullyPrepared.length === 0) {
                setStatusMessage("Could not load any of your favorite songs.");
                return;
            }
            setPlaylist(successfullyPrepared);
            setCurrentTrackIndex(0);
            setIsPlaying(true);
            setActiveTab('queue');
            setStatusMessage(`Now playing ${successfullyPrepared.length} favorite songs.`);
        } catch (error) {
            console.error("Error playing all liked songs:", error);
            setStatusMessage(`An error occurred while preparing your favorites: ${error.message}`);
        } finally {
            setIsPlayingAllLiked(false);
        }
    };
    
    const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
    const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
    const handleSeek = (e) => { if(audioRef.current) audioRef.current.currentTime = e.target.value; setCurrentTime(e.target.value); };
    const formatTime = (s) => !s || isNaN(s) ? "0:00" : `${Math.floor(s / 60)}:${('0' + Math.floor(s % 60)).slice(-2)}`;
    const handleVolumeChange = (e) => { setVolume(parseFloat(e.target.value)); };
    const handleToggleExpandedInPip = () => { setIsExpandedInPip(prev => !prev); };

    // Render PipExpandedView into PiP mount point - optimized to reduce re-renders
    const scrollPositionsRef = useRef({ search: 0, queue: 0, favorites: 0 });
    const lastRenderKeyRef = useRef('');
    const pipViewPropsRef = useRef(null);
    
    useEffect(() => {
        const mountNode = pipPlayerMountNode.current;
        if (!mountNode) return;

        // Create a render key based on only the content that matters for display
        const renderKey = JSON.stringify({
            expanded: isExpandedInPip,
            loading: isLoading,
            preparing: preparingTrackId,
            resultsCount: searchResults.length,
            resultsIds: searchResults.map(r => r.id).join(','),
            likedCount: Object.keys(likedSongs).length,
            likedIds: Object.keys(likedSongs).sort().join(','),
            statusMessage,
            activeTab,
            playlistCount: playlist.length,
            playlistIds: playlist.map(p => p.id).join(','),
            currentIndex: currentTrackIndex,
        });

        // Check if we need to re-render
        const needsRender = renderKey !== lastRenderKeyRef.current;
        
        if (needsRender) {
            lastRenderKeyRef.current = renderKey;
            
            // Store current scroll position before re-render
            if (isExpandedInPip) {
                const tabContent = mountNode.querySelector('.tab-content');
                if (tabContent) {
                    scrollPositionsRef.current[activeTab] = tabContent.scrollTop;
                }
            }

            pipViewPropsRef.current = {
                onSearch: performSearch,
                isLoading,
                preparingTrackId,
                searchResults,
                addToQueue: addToPlaylist,
                playTrackNow: addToPlaylist,
                removeFromQueue: handleRemoveFromQueue,
                likedSongs,
                handleToggleLike,
                statusMessage,
                activeTab,
                setActiveTab,
                playlist,
                currentTrackIndex,
                playTrackAtIndex,
                isShuffle,
                toggleShuffle,
                loopMode,
                cycleLoopMode,
            };

            if (isExpandedInPip) {
                dc.preact.render(<PipExpandedView {...pipViewPropsRef.current} />, mountNode);
                
                // Restore scroll position after render
                requestAnimationFrame(() => {
                    const tabContent = mountNode.querySelector('.tab-content');
                    if (tabContent) {
                        tabContent.scrollTop = scrollPositionsRef.current[activeTab] || 0;
                    }
                });
            } else {
                dc.preact.render(null, mountNode);
            }
        }
    }, [
        isExpandedInPip, isLoading, preparingTrackId, searchResults, likedSongs, statusMessage,
        activeTab, playlist, currentTrackIndex, performSearch, addToPlaylist, handleRemoveFromQueue,
        handleToggleLike, playTrackAtIndex, isShuffle, toggleShuffle, loopMode, cycleLoopMode,
    ]);

    return (
        <div className="datacore-music-player-wrapper">
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleTrackEnd}></audio>
            <style>{`
                /* Black on Black on Black Mythical Design */
                .datacore-music-player-wrapper { 
                    --primary-accent: #8b7dd8; 
                    --accent-glow: #a798ff;
                    --bg-primary: #000000; 
                    --bg-secondary: #0a0a0a; 
                    --bg-tertiary: #141414; 
                    --bg-hover: #1a1a1a;
                    --border-color: #1f1f1f; 
                    --border-subtle: rgba(139, 125, 216, 0.15);
                    --text-primary: #ffffff; 
                    --text-secondary: #888888;
                    --text-dimmed: #555555;
                    background-color: var(--bg-primary); 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                } 
                
                body.theme-light .datacore-music-player-wrapper { 
                    --primary-accent: #8b7dd8; 
                    --accent-glow: #a798ff;
                    --bg-primary: #000000; 
                    --bg-secondary: #0a0a0a; 
                    --bg-tertiary: #141414; 
                    --bg-hover: #1a1a1a;
                    --border-color: #1f1f1f; 
                    --border-subtle: rgba(139, 125, 216, 0.15);
                    --text-primary: #ffffff; 
                    --text-secondary: #888888;
                    --text-dimmed: #555555;
                }
                
                .datacore-music-player-wrapper .app-container { 
                    display: flex; 
                    flex-wrap: wrap; 
                    gap: 24px; 
                    color: var(--text-primary); 
                    max-width: 1200px; 
                    margin: auto; 
                } 
                
                .datacore-music-player-wrapper .search-and-player { 
                    flex: 2; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 24px; 
                    min-width: 400px; 
                } 
                
                .datacore-music-player-wrapper .search-panel { 
                    display: flex; 
                    flex-direction: column; 
                    background: var(--bg-secondary); 
                    border-radius: 16px; 
                    border: 1px solid var(--border-subtle);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(139, 125, 216, 0.05);
                    overflow: hidden;
                } 
                
                .datacore-music-player-wrapper .search-form { 
                    display: flex; 
                    border-bottom: 1px solid var(--border-color);
                } 
                
                .datacore-music-player-wrapper .search-form input { 
                    flex-grow: 1; 
                    padding: 16px 20px; 
                    border: none; 
                    background: transparent; 
                    color: var(--text-primary); 
                    font-size: 1em; 
                    border-radius: 16px 0 0 0;
                } 
                
                .datacore-music-player-wrapper .search-form input::placeholder {
                    color: var(--text-dimmed);
                }
                
                .datacore-music-player-wrapper .search-form input:focus { 
                    outline: none; 
                    background: var(--bg-tertiary);
                } 
                
                .datacore-music-player-wrapper .search-form button { 
                    padding: 16px 24px; 
                    border: none; 
                    background: var(--primary-accent); 
                    color: white; 
                    cursor: pointer; 
                    border-radius: 0 16px 0 0; 
                    transition: all 0.3s ease;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                } 
                
                .datacore-music-player-wrapper .search-form button:hover:not(:disabled) { 
                    background-color: var(--accent-glow);
                    box-shadow: 0 0 20px rgba(139, 125, 216, 0.4);
                } 
                
                .datacore-music-player-wrapper .search-form button:disabled { 
                    background-color: var(--bg-tertiary); 
                    color: var(--text-dimmed);
                    cursor: not-allowed; 
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                } 
                
                .datacore-music-player-wrapper .provider-selector { 
                    display: flex; 
                    flex-wrap: wrap; 
                    gap: 8px; 
                    padding: 12px 16px; 
                    background: var(--bg-primary); 
                } 
                
                .datacore-music-player-wrapper .provider-button { 
                    background-color: var(--bg-tertiary); 
                    color: var(--text-secondary); 
                    border: 1px solid var(--border-color); 
                    padding: 6px 14px; 
                    border-radius: 20px; 
                    font-size: 0.8em; 
                    cursor: pointer; 
                    transition: all 0.3s ease;
                    font-weight: 500;
                } 
                
                .datacore-music-player-wrapper .provider-button:hover:not(.hard-disabled) {
                    background-color: var(--bg-hover);
                    border-color: var(--border-subtle);
                }
                
                .datacore-music-player-wrapper .provider-button.active { 
                    background-color: var(--primary-accent); 
                    color: white; 
                    border-color: var(--primary-accent);
                    box-shadow: 0 0 12px rgba(139, 125, 216, 0.3);
                } 
                
                .datacore-music-player-wrapper .provider-button.hard-disabled { 
                    text-decoration: line-through; 
                    cursor: not-allowed; 
                    opacity: 0.3; 
                } 
                
                .datacore-music-player-wrapper .provider-button.hard-disabled.active, 
                .datacore-music-player-wrapper .provider-button.hard-disabled:hover { 
                    background-color: var(--bg-tertiary); 
                    color: var(--text-dimmed); 
                    border-color: var(--border-color);
                    box-shadow: none;
                } 
                
                .datacore-music-player-wrapper .search-results-container { 
                    min-height: 150px; 
                    max-height: 40vh; 
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary-accent) var(--bg-primary);
                } 
                
                .datacore-music-player-wrapper .search-results-container::-webkit-scrollbar {
                    width: 8px;
                }
                
                .datacore-music-player-wrapper .search-results-container::-webkit-scrollbar-track {
                    background: var(--bg-primary);
                }
                
                .datacore-music-player-wrapper .search-results-container::-webkit-scrollbar-thumb {
                    background: var(--primary-accent);
                    border-radius: 4px;
                }
                
                .datacore-music-player-wrapper .result-item { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 0 15px 0 0; 
                    border-top: 1px solid var(--border-color); 
                    transition: all 0.3s ease;
                    position: relative;
                } 
                
                .datacore-music-player-wrapper .result-item::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: 0;
                    background: linear-gradient(90deg, var(--primary-accent), transparent);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                
                .datacore-music-player-wrapper .result-info { 
                    display: flex; 
                    align-items: center; 
                    flex-grow: 1; 
                    padding: 14px 16px; 
                    cursor: pointer; 
                } 
                
                .datacore-music-player-wrapper .result-item:hover { 
                    background-color: var(--bg-hover);
                } 
                
                .datacore-music-player-wrapper .result-item:hover::before {
                    width: 3px;
                    opacity: 1;
                }
                
                .datacore-music-player-wrapper .result-text .title { 
                    font-weight: 600;
                    color: var(--text-primary);
                } 
                
                .datacore-music-player-wrapper .result-text .artist { 
                    font-size: 0.9em; 
                    color: var(--text-secondary);
                    margin-top: 2px;
                } 
                
                .datacore-music-player-wrapper .preview-tag { 
                    font-size: 0.7em; 
                    font-weight: bold; 
                    padding: 3px 6px; 
                    margin-left: 8px; 
                    border-radius: 4px; 
                    background-color: rgba(167, 152, 255, 0.2); 
                    color: var(--accent-glow);
                    border: 1px solid rgba(167, 152, 255, 0.3);
                } 
                
                .datacore-music-player-wrapper .source-tag { 
                    font-size: 0.75em; 
                    padding: 4px 8px; 
                    border-radius: 6px; 
                    background-color: var(--bg-tertiary); 
                    color: var(--text-secondary); 
                    text-transform: capitalize; 
                    margin-left: 10px;
                    border: 1px solid var(--border-color);
                    font-weight: 500;
                } 
                
                .datacore-music-player-wrapper .status-message { 
                    padding: 32px 20px; 
                    color: var(--text-dimmed); 
                    text-align: center;
                    font-size: 0.95em;
                } 
                
                .datacore-music-player-wrapper .music-player { 
                    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
                    color: var(--text-primary); 
                    border-radius: 20px; 
                    padding: 28px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 20px; 
                    border: 1px solid var(--border-subtle); 
                    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(139, 125, 216, 0.1);
                    position: relative;
                    overflow: hidden;
                } 
                
                .datacore-music-player-wrapper .music-player::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at center, rgba(139, 125, 216, 0.05) 0%, transparent 70%);
                    pointer-events: none;
                }
                
                .datacore-music-player-wrapper .track-info-header { 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    gap: 20px;
                    position: relative;
                    z-index: 1;
                } 
                
                .datacore-music-player-wrapper .track-info-main { 
                    flex-grow: 1; 
                    min-width: 0; 
                } 
                
                .datacore-music-player-wrapper .track-info-main h2 { 
                    margin: 0 0 8px 0; 
                    font-size: 1.6em; 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                } 
                
                .datacore-music-player-wrapper .track-info-main p { 
                    margin: 0; 
                    color: var(--text-secondary);
                    font-size: 1.05em;
                } 
                
                .datacore-music-player-wrapper .like-button { 
                    background: var(--bg-tertiary); 
                    border: 1px solid var(--border-color); 
                    font-size: 1.4em; 
                    cursor: pointer; 
                    color: var(--text-dimmed); 
                    transition: all 0.3s ease;
                    padding: 10px;
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                } 
                
                .datacore-music-player-wrapper .like-button.liked { 
                    color: #ff6b9d;
                    background: rgba(255, 107, 157, 0.15);
                    border-color: rgba(255, 107, 157, 0.3);
                    box-shadow: 0 0 16px rgba(255, 107, 157, 0.3);
                } 
                
                .datacore-music-player-wrapper .like-button:hover { 
                    transform: scale(1.1);
                    border-color: var(--border-subtle);
                } 
                
                .datacore-music-player-wrapper .progress-container { 
                    display: flex; 
                    align-items: center; 
                    gap: 12px;
                    position: relative;
                    z-index: 1;
                    font-size: 0.9em;
                    color: var(--text-secondary);
                }
                
                .datacore-music-player-wrapper .custom-progress-container { 
                    flex-grow: 1; 
                    height: 20px; 
                    display: flex; 
                    align-items: center; 
                    cursor: pointer; 
                    -webkit-user-select: none; 
                    user-select: none; 
                    padding: 5px 0;
                }
                
                .datacore-music-player-wrapper .custom-progress-container.disabled { 
                    cursor: not-allowed; 
                    opacity: 0.4;
                }
                
                .datacore-music-player-wrapper .custom-progress-track { 
                    position: relative; 
                    width: 100%; 
                    height: 6px; 
                    background-color: var(--bg-tertiary); 
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .datacore-music-player-wrapper .custom-progress-filled { 
                    position: absolute; 
                    top: 0; 
                    left: 0; 
                    height: 100%; 
                    background: linear-gradient(90deg, var(--primary-accent), var(--accent-glow));
                    border-radius: 8px;
                    box-shadow: 0 0 12px rgba(139, 125, 216, 0.4);
                }
                
                .datacore-music-player-wrapper .custom-progress-handle { 
                    position: absolute; 
                    top: 50%; 
                    width: 16px; 
                    height: 16px; 
                    background-color: white;
                    border: 2px solid var(--primary-accent);
                    border-radius: 50%; 
                    transform: translate(-50%, -50%); 
                    transition: all 0.2s ease;
                    box-shadow: 0 0 8px rgba(139, 125, 216, 0.6);
                }
                
                .datacore-music-player-wrapper .custom-progress-container:hover .custom-progress-handle { 
                    transform: translate(-50%, -50%) scale(1.2);
                    box-shadow: 0 0 16px rgba(139, 125, 216, 0.8);
                }
                
                .datacore-music-player-wrapper .controls { 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    gap: 12px;
                    position: relative;
                    z-index: 1;
                } 
                
                .datacore-music-player-wrapper .controls button { 
                    background: var(--bg-tertiary); 
                    border: 1px solid var(--border-color); 
                    color: var(--text-primary); 
                    border-radius: 50%; 
                    width: 44px; 
                    height: 44px; 
                    cursor: pointer; 
                    font-size: 1.2em; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                } 
                
                .datacore-music-player-wrapper .controls button:hover:not(:disabled) { 
                    background-color: var(--bg-hover);
                    border-color: var(--border-subtle);
                    transform: translateY(-2px);
                } 
                
                .datacore-music-player-wrapper .controls button.play-pause { 
                    width: 56px; 
                    height: 56px; 
                    font-size: 1.5em; 
                    background: linear-gradient(135deg, var(--primary-accent), var(--accent-glow));
                    margin: 0 8px;
                    border: none;
                    box-shadow: 0 4px 16px rgba(139, 125, 216, 0.4);
                } 
                
                .datacore-music-player-wrapper .controls button.play-pause:hover:not(:disabled) {
                    box-shadow: 0 6px 24px rgba(139, 125, 216, 0.6);
                    transform: translateY(-3px) scale(1.05);
                }
                
                .datacore-music-player-wrapper .controls button:disabled { 
                    opacity: 0.3; 
                    cursor: not-allowed; 
                } 
                
                .datacore-music-player-wrapper .volume-container { 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    flex-grow: 1; 
                    min-width: 100px; 
                    max-width: 160px; 
                } 
                
                .datacore-music-player-wrapper .volume-container span { 
                    font-size: 1.2em;
                    color: var(--text-secondary);
                } 
                
                .datacore-music-player-wrapper .volume-slider { 
                    flex-grow: 1; 
                    -webkit-appearance: none; 
                    appearance: none; 
                    width: 100%; 
                    height: 5px; 
                    background: var(--bg-tertiary); 
                    border-radius: 5px; 
                    outline: none;
                    position: relative;
                } 
                
                .datacore-music-player-wrapper .volume-slider::-webkit-slider-thumb { 
                    -webkit-appearance: none; 
                    appearance: none; 
                    width: 16px; 
                    height: 16px; 
                    background: white;
                    border: 2px solid var(--primary-accent);
                    border-radius: 50%; 
                    cursor: pointer;
                    transition: all 0.2s ease;
                } 
                
                .datacore-music-player-wrapper .volume-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 12px rgba(139, 125, 216, 0.6);
                }
                
                .datacore-music-player-wrapper .volume-slider::-moz-range-thumb { 
                    width: 16px; 
                    height: 16px; 
                    background: white;
                    border: 2px solid var(--primary-accent);
                    border-radius: 50%; 
                    cursor: pointer;
                    transition: all 0.2s ease;
                } 
                
                .datacore-music-player-wrapper .playlist-panel { 
                    flex: 1; 
                    background: var(--bg-secondary); 
                    border-radius: 16px; 
                    border: 1px solid var(--border-subtle); 
                    min-width: 300px; 
                    display: flex; 
                    flex-direction: column; 
                    max-height: calc(40vh + 240px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(139, 125, 216, 0.05);
                    overflow: hidden;
                } 
                
                .datacore-music-player-wrapper .playlist-tabs { 
                    display: flex; 
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-primary);
                } 
                
                .datacore-music-player-wrapper .tab-button { 
                    flex: 1; 
                    padding: 16px; 
                    background: none; 
                    border: none; 
                    color: var(--text-secondary); 
                    cursor: pointer; 
                    font-size: 1em;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    transition: all 0.3s ease;
                    position: relative;
                } 
                
                .datacore-music-player-wrapper .tab-button::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%) scaleX(0);
                    width: 80%;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, var(--primary-accent), transparent);
                    transition: transform 0.3s ease;
                }
                
                .datacore-music-player-wrapper .tab-button.active { 
                    color: var(--text-primary);
                } 
                
                .datacore-music-player-wrapper .tab-button.active::after {
                    transform: translateX(-50%) scaleX(1);
                }
                
                .datacore-music-player-wrapper .playlist { 
                    overflow-y: auto; 
                    flex-grow: 1;
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary-accent) var(--bg-primary);
                } 
                
                .datacore-music-player-wrapper .playlist::-webkit-scrollbar {
                    width: 8px;
                }
                
                .datacore-music-player-wrapper .playlist::-webkit-scrollbar-track {
                    background: var(--bg-primary);
                }
                
                .datacore-music-player-wrapper .playlist::-webkit-scrollbar-thumb {
                    background: var(--primary-accent);
                    border-radius: 4px;
                }
                
                .datacore-music-player-wrapper .playlist-item { 
                    padding: 14px 18px; 
                    border-bottom: 1px solid var(--border-color); 
                    cursor: pointer; 
                    transition: all 0.3s ease;
                    position: relative;
                } 
                
                .datacore-music-player-wrapper .playlist-item::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: 0;
                    background: linear-gradient(90deg, var(--primary-accent), transparent);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                
                .datacore-music-player-wrapper .playlist-item:hover { 
                    background-color: var(--bg-hover);
                } 
                
                .datacore-music-player-wrapper .playlist-item:hover::before {
                    width: 3px;
                    opacity: 1;
                }
                
                .datacore-music-player-wrapper .playlist-item.active { 
                    background: linear-gradient(90deg, rgba(139, 125, 216, 0.2), transparent);
                    color: white;
                    border-bottom-color: var(--primary-accent);
                } 
                
                .datacore-music-player-wrapper .playlist-item.active::before {
                    width: 3px;
                    opacity: 1;
                    background: var(--primary-accent);
                }
                
                .datacore-music-player-wrapper .playlist-item.active .artist { 
                    color: var(--text-secondary);
                } 
                
                .datacore-music-player-wrapper .playlist-item .title { 
                    font-weight: 600;
                } 
                
                .datacore-music-player-wrapper .playlist-item .artist { 
                    font-size: 0.9em; 
                    color: var(--text-dimmed);
                    margin-top: 4px;
                }
            `}</style>
            
            {!isMobileMode && (
                <div className="app-container">
                    {/* ... The rest of the JSX is unchanged ... */}
                    <div className="search-and-player">
                    <div className="search-panel">
                        <form onSubmit={handleSearch} className="search-form"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for music..." /><button type="submit" disabled={isLoading || activeProviders.size === 0}>{isLoading ? <dc.Icon icon="loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <><dc.Icon icon="search" /> Search</>}</button></form>
                        <div className="provider-selector"><button className={`provider-button ${activeProviders.size === ENABLED_PROVIDERS.length ? 'active' : ''}`} onClick={toggleAllProviders}>All</button>{ALL_PROVIDER_IDS.map(id => { const d = HARD_DISABLED_PROVIDERS.has(id); return (<button key={id} className={`provider-button ${activeProviders.has(id) && !d ? 'active' : ''} ${d ? 'hard-disabled' : ''}`} onClick={() => toggleProvider(id)} disabled={d} title={d ? `${providers[id].name} is disabled.` : providers[id].name}>{providers[id].name}</button>); })}</div>
                        <div className="search-results-container">{isLoading ? <div className="status-message">Searching...</div> : searchResults.length > 0 ? searchResults.map(track => (<div key={track.id} className="result-item"><div className="result-info" onClick={() => addToPlaylist(track)}><div className="result-text"><div className="title">{track.title}</div><div className="artist">{track.artist}</div></div>{track._isPreview && <span className="preview-tag">PREVIEW</span>}</div><span className="source-tag">{providers[track._source]?.name||track._source}</span><button className={`like-button ${likedSongs[track.id]?'liked':''}`} onClick={() => handleToggleLike(track)}><dc.Icon icon="heart" /></button></div>)) : <div className="status-message">{statusMessage}</div>}</div>
                    </div>
                    <div className="music-player">
                        <div className="track-info-header">
                            <div className="track-info-main"><h2>{currentTrack?.title||"No Track"}</h2><p>{currentTrack?.artist||"Select a song"}</p></div>
                            {currentTrack && <button className={`like-button ${likedSongs[currentTrack?.id]?'liked':''}`} onClick={()=>handleToggleLike(currentTrack)}><dc.Icon icon="heart" /></button>}
                        </div>
                        <div className="progress-container">
                            <span>{formatTime(currentTime)}</span>
                            <CustomProgressBar duration={duration} currentTime={currentTime} onSeek={handleSeek} isDisabled={!currentTrack} />
                            <span>{formatTime(duration)}</span>
                        </div>
                        <div className="controls">
                            <button onClick={handlePrev} disabled={!currentTrack}><dc.Icon icon="skip-back" /></button>
                            <button onClick={handlePlayPause} className="play-pause" disabled={!currentTrack}><dc.Icon icon={isPlaying ? 'pause' : 'play'} /></button>
                            <button onClick={handleNext} disabled={!currentTrack}><dc.Icon icon="skip-forward" /></button>
                            <button onClick={()=>setIsPipVisible(true)} className="pip-button" disabled={!currentTrack} title={"Picture-in-Picture"}><dc.Icon icon="picture-in-picture-2" /></button>
                            <div className="volume-container">
                                <span><dc.Icon icon={volume > 0.5 ? 'volume-2' : volume > 0 ? 'volume-1' : 'volume-x'} /></span>
                                <input type="range" className="volume-slider" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} disabled={!currentTrack}/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="playlist-panel">
                    <div className="playlist-tabs"><button className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>Queue</button><button className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>Favorites</button></div>
                    <div className="playlist">{activeTab === 'queue' && (playlist.length > 0 ? playlist.map((track, index) => (<div key={`${track.id}-${index}`} className={`playlist-item ${index === currentTrackIndex ? 'active' : ''}`} onClick={() => playTrackAtIndex(index)}><div className="title">{track.title}</div><div className="artist">{track.artist}</div></div>)) : <p style={{ padding: '15px', textAlign: 'center' }}>Queue is empty.</p>)} {activeTab === 'favorites' && (Object.values(likedSongs).length > 0 ? Object.values(likedSongs).map(track => (<div key={track.id} className="result-item"><div className="result-info" onClick={() => addToPlaylist(track)}><div className="result-text"><div className="title">{track.title}</div><div className="artist">{track.artist}</div></div>{track._isPreview && <span className="preview-tag">PREVIEW</span>}</div><button className="like-button liked" onClick={() => handleToggleLike(track)}><dc.Icon icon="heart" /></button></div>)) : <p style={{ padding: '15px', textAlign: 'center' }}>No favorite songs yet.</p>)}</div>
                </div>
            </div>
            )}

            <PipHelper
                onMount={(node) => pipPlayerMountNode.current = node}
                track={currentTrack}
                isPlaying={isPlaying}
                isLiked={!!(currentTrack && likedSongs[currentTrack.id])}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrev={handlePrev}
                onLike={() => currentTrack && handleToggleLike(currentTrack)}
                onClose={() => {
                    setIsPipVisible(false);
                    if (onPipClose) onPipClose();
                }}
                currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    formatTime={formatTime}
                    isExpanded={isExpandedInPip}
                    onToggleExpand={handleToggleExpandedInPip}
                    isShuffle={isShuffle}
                    onToggleShuffle={toggleShuffle}
                    loopMode={loopMode}
                    onCycleLoopMode={cycleLoopMode}
                    playAllLikedSongs={playAllLikedSongs}
                    isPlayingAllLiked={isPlayingAllLiked}
                    likedSongsCount={Object.keys(likedSongs).length}
                    isVisible={isPipVisible}
                />
        </div>
    );
}

// ====================================================================================
// --- MUSIC PLAYER WRAPPER (Main export with mode support) ---
// ====================================================================================

function MusicPlayer({ mode = "default" }) {
    // If mode is "mobile", render the launcher instead
    if (mode === "mobile") {
        return <MusicPlayerLauncher />;
    }
    
    // Otherwise, render the core player
    return <MusicPlayerCore />;
}

// ====================================================================================
// --- MOBILE LAUNCHER BUTTON COMPONENT ---
// ====================================================================================

function MusicPlayerLauncher() {
    const [showSecondaryButtons, setShowSecondaryButtons] = useState(false);
    const [isMusicPlayerActive, setIsMusicPlayerActive] = useState(false);
    const [isPlayingMusic, setIsPlayingMusic] = useState(false);
    const [isPipVisible, setIsPipVisible] = useState(false);
    const [triggerPipReopen, setTriggerPipReopen] = useState(false);
    const containerRef = useRef(null);
    const portalContainerRef = useRef(null);
    
    // Create a portal container that attaches directly to document.body
    useEffect(() => {
        const portalDiv = document.createElement('div');
        portalDiv.id = 'music-player-launcher-portal';
        portalDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 99999;';
        document.body.appendChild(portalDiv);
        portalContainerRef.current = portalDiv;
        
        return () => {
            if (portalDiv && document.body.contains(portalDiv)) {
                document.body.removeChild(portalDiv);
            }
        };
    }, []);

    const mainButtonSize = 60;
    const secondaryButtonSize = 48;
    const secondaryButtonRadius = 80;
    const mainButtonOffsetFromEdge = 40;
    const indicatorSize = 16;

    const containerEffectiveWidth = secondaryButtonRadius + (mainButtonSize / 2) + (secondaryButtonSize / 2) + 10;
    const containerEffectiveHeight = secondaryButtonRadius + (mainButtonSize / 2) + (secondaryButtonSize / 2) + 10;

    const handleMusicPlayerClick = () => {
        setIsMusicPlayerActive(true);
        setTriggerPipReopen(true);
        setShowSecondaryButtons(false);
    };

    const handleMainButtonClick = () => {
        setShowSecondaryButtons(prev => !prev);
    };

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.style.pointerEvents = showSecondaryButtons ? 'auto' : 'none';
        }
    }, [showSecondaryButtons]);

    const calculateSecondaryButtonPosition = (index, totalButtons) => {
        const mainButtonCenterX = containerEffectiveWidth - (mainButtonSize / 2);
        const mainButtonCenterY = containerEffectiveHeight - (mainButtonSize / 2);
        const startAngle = Math.PI / 2;
        const endAngle = Math.PI;
        const angleRange = endAngle - startAngle;
        const angle = totalButtons === 1 ? (startAngle + endAngle) / 2 : startAngle + (angleRange / (totalButtons - 1)) * index;
        const offsetX = secondaryButtonRadius * Math.cos(angle);
        const offsetY = secondaryButtonRadius * Math.sin(angle);
        const left = mainButtonCenterX + offsetX - (secondaryButtonSize / 2);
        const top = mainButtonCenterY - offsetY - (secondaryButtonSize / 2);
        return { left: `${left}px`, top: `${top}px` };
    };

    const secondaryButtons = [
        { id: 'music', icon: '🎵', action: handleMusicPlayerClick, label: 'Music Player' }
    ];

    const indicatorStyle = {
        position: 'fixed',
        bottom: `${mainButtonOffsetFromEdge + mainButtonSize - (indicatorSize / 2)}px`,
        right: `${mainButtonOffsetFromEdge - (indicatorSize / 2)}px`,
        width: `${indicatorSize}px`,
        height: `${indicatorSize}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #8b7dd8, #a798ff)',
        boxShadow: '0 0 16px rgba(139, 125, 216, 0.8)',
        zIndex: 10001,
        pointerEvents: 'none',
        animation: 'pulse-indicator 1.5s infinite ease-out',
        display: isPlayingMusic && isPipVisible ? 'block' : 'none'
    };

    // Render the main button using React with SVG icon
    const renderMainButton = () => {
        if (isPipVisible) return null;
        
        return (
            <button
                className="music-launcher-main-btn"
                onClick={() => {
                    setIsMusicPlayerActive(true);
                    setTriggerPipReopen(true);
                }}
                style={{
                    position: 'fixed',
                    bottom: '40px',
                    right: '40px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
                    border: '2px solid #8b7dd8',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 20px rgba(139, 125, 216, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100000,
                    pointerEvents: 'auto',
                    transition: 'all 0.3s ease',
                    color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.borderColor = '#a798ff';
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(0, 0, 0, 0.9), 0 0 30px rgba(167, 152, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1a1a1a, #2a2a2a)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#8b7dd8';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 20px rgba(139, 125, 216, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #0a0a0a, #1a1a1a)';
                }}
                onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                </svg>
            </button>
        );
    };
    
    // Render playing indicator
    const renderPlayingIndicator = () => {
        if (!isPlayingMusic || isPipVisible) return null;
        
        return (
            <div
                style={{
                    position: 'fixed',
                    bottom: '88px',
                    right: '88px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b7dd8, #a798ff)',
                    boxShadow: '0 0 16px rgba(139, 125, 216, 0.8), 0 0 8px rgba(167, 152, 255, 0.6)',
                    zIndex: 100001,
                    pointerEvents: 'none',
                    animation: 'pulse-indicator 1.5s infinite ease-out',
                }}
            />
        );
    };

    // Render button and indicator to portal
    useEffect(() => {
        if (!portalContainerRef.current) return;
        
        const ButtonAndIndicator = () => (
            <>
                {renderMainButton()}
                {renderPlayingIndicator()}
            </>
        );
        
        dc.preact.render(<ButtonAndIndicator />, portalContainerRef.current);
        
        return () => {
            if (portalContainerRef.current) {
                dc.preact.render(null, portalContainerRef.current);
            }
        };
    }, [isPipVisible, isPlayingMusic]);

    return (
        <>
            <style>{`
                @keyframes pulse-indicator {
                    0%, 100% { 
                        transform: scale(1); 
                        opacity: 1; 
                        box-shadow: 0 0 16px rgba(139, 125, 216, 0.8), 0 0 8px rgba(167, 152, 255, 0.6);
                    }
                    50% { 
                        transform: scale(1.3); 
                        opacity: 0.7; 
                        box-shadow: 0 0 24px rgba(139, 125, 216, 1), 0 0 12px rgba(167, 152, 255, 0.8);
                    }
                }
                
                .music-launcher-main-btn {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                }
                
                .music-launcher-main-btn:focus {
                    outline: none;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 20px rgba(139, 125, 216, 0.6), 0 0 0 3px rgba(139, 125, 216, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }
            `}</style>
            
            {isMusicPlayerActive && (
                <MusicPlayerCore
                    initialPipMode={true}
                    initialExpandedMode={true}
                    isMobileMode={true}
                    onPlayStatusChange={setIsPlayingMusic}
                    onPipVisibilityChange={setIsPipVisible}
                    triggerPipReopen={triggerPipReopen}
                    setTriggerPipReopen={setTriggerPipReopen}
                    onPipClose={() => {
                        // Keep player mounted, just hide PiP - button will reappear
                        // Don't unmount the player so music keeps playing
                    }}
                />
            )}
        </>
    );
}

// ====================================================================================
// --- FINAL EXPORT                                                                 ---
// ====================================================================================

return { MusicPlayer };
```




  
  
  

