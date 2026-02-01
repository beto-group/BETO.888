const { useMemo } = dc;
const { isMediaVideo, getYTId, isLink, getInteractiveUrl, openResource } = await dc.require(dc.resolvePath('71 Recap2025/src/components/NodeGraph/NodeGraphUtils.js'));
const { SafeVideoPlayer } = await dc.require(dc.resolvePath('71 Recap2025/src/components/NodeGraph/SafeVideoPlayer.jsx')); // Still importing for type check/placeholder if needed, or we can just use div
const { AutoScrollWebview } = await dc.require(dc.resolvePath('71 Recap2025/src/components/AutoScrollWebview.jsx'));

const SliderItem = ({ m, idx, itemWidth, mediaIndex, baseLen, parentActive, isCenterActive, folderPath, preload }) => {
    const focusIdx = mediaIndex;
    const originalIdx = idx % (baseLen || 1);
    let dist = Math.abs(originalIdx - focusIdx);
    if (baseLen > 1 && dist > baseLen / 2) dist = baseLen - dist;

    // Visibility culling - DISABLED for Aggressive Preloading
    // if (dist > 3) {
    //    return (
    //        <div style={{
    //            width: itemWidth > 0 ? `${itemWidth}px` : '33.33%',
    //            flexShrink: 0,
    //            aspectRatio: '16/9',
    //            height: 'auto',
    //            boxSizing: 'border-box',
    //            visibility: 'hidden',
    //            pointerEvents: 'none'
    //        }} />
    //    );
    // }

    const url = typeof m === 'string' ? m : m.url;
    const rawUrl = typeof m === 'string' ? m : (m.videoSrc || m.url);
    const displayUrl = rawUrl;
    const baseVideo = typeof m === 'object' ? m.videoSrc : null;
    const ytId = !baseVideo ? getYTId(url) : (typeof m === 'object' ? getYTId(m.url) : null);
    const ytThumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;

    const isVid = isMediaVideo(displayUrl);
    const isExternalLink = !isVid && !ytThumbnail && isLink(url);
    const isImage = !isVid && !isExternalLink && !ytThumbnail;

    return (
        <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                const targetUrl = getInteractiveUrl(m);
                if (targetUrl) openResource(targetUrl, folderPath);
            }}
            style={{
                width: itemWidth > 0 ? `${itemWidth}px` : '33.33%',
                flexShrink: 0,
                aspectRatio: '16/9',
                height: 'auto',
                padding: '0 1px',
                boxSizing: 'border-box',
                position: 'relative',
                cursor: 'pointer',
                zIndex: 100,
                pointerEvents: 'auto'
            }}>
            <div style={{
                width: '100%', height: '100%', position: 'relative', borderRadius: '4px',
                overflow: 'hidden', background: '#080808', border: '1px solid rgba(255,255,255,0.1)',
                willChange: 'transform'
            }}>
                {isVid ? (
                    ((isCenterActive && parentActive) || preload) ? (
                        <SafeVideoPlayer
                            src={displayUrl}
                            active={true}
                            preload={preload}
                            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                            folderPath={folderPath}
                        />
                    ) : (
                        // PREVIEW MODE ONLY: Never activate video in slider to save resources
                        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                            {/* Try to show a thumbnail if we had one? For now just an icon */}
                            <div style={{ opacity: 0.3, fontSize: '30px' }}>🎥</div>
                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '10px', opacity: 0.5 }}>VIDEO PREVIEW</div>
                        </div>
                    )
                ) : ytThumbnail ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <img src={ytThumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '40px', height: '28px', background: 'rgba(255,0,0,0.8)', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{ width: 0, height: 0, borderLeft: '10px solid white', borderTop: '6px solid transparent', borderBottom: '6px solid transparent', marginLeft: '2px' }} />
                        </div>
                    </div>
                ) : isExternalLink ? (
                    <div style={{ width: '100%', height: '100%', background: '#FFF' }}>
                        {isCenterActive && parentActive ? (
                            <AutoScrollWebview src={url} style={{ width: '100%', height: '100%' }} active={true} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#555' }}>
                                <div style={{ fontSize: '24px' }}>🌐</div>
                                <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.6 }}>{url ? new URL(url).hostname : 'External Site'}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <img src={displayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                )}

                <div style={{
                    position: 'absolute', top: '6px', right: '6px', zIndex: 10,
                    width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

const SliderList = ({ baseMedia, mediaIndex, itemWidth, active, internalIdx, folderPath }) => {
    const minItems = 2;
    let dups = 1;
    if (baseMedia.length > 0) {
        while (baseMedia.length * dups < minItems * 3) dups++;
    }
    dups = Math.min(6, Math.max(2, dups));

    const sliderItems = useMemo(() => Array(dups).fill(baseMedia).flat(), [baseMedia, dups]);

    return (
        <>{sliderItems.map((m, idx) => {
            const originalIdx = idx % (baseMedia.length || 1);
            const isCenterActive = originalIdx === internalIdx && idx < (baseMedia.length || 1);

            // Aggressive Preloading: Preload ALL items if the parent node is active
            const shouldPreload = !isCenterActive && active;

            return (
                <SliderItem
                    key={idx}
                    m={m}
                    idx={idx}
                    itemWidth={itemWidth}
                    mediaIndex={internalIdx}
                    baseLen={baseMedia.length}
                    parentActive={active}
                    isCenterActive={isCenterActive}
                    preload={shouldPreload}
                    folderPath={folderPath}
                />
            );
        })}</>
    );
};

return { SliderItem, SliderList };
