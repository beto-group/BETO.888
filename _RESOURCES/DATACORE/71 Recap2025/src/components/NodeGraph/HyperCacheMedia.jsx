const { useEffect, useRef, useState, useMemo } = dc;
const { CONTAIN_STYLE, isMediaVideo, isMediaImage, isMediaLocal, getYouTubeEmbed, isLink, getInteractiveUrl, openResource } = await dc.require(dc.resolvePath('71 Recap2025/src/components/NodeGraph/NodeGraphUtils.js'));
const { SafeVideoPlayer } = await dc.require(dc.resolvePath('71 Recap2025/src/components/NodeGraph/SafeVideoPlayer.jsx'));
const { SliderList, SliderItem } = await dc.require(dc.resolvePath('71 Recap2025/src/components/NodeGraph/SliderComponents.jsx'));

const { GlobeTravel } = await dc.require(dc.resolvePath('71 Recap2025/src/components/GlobeTravel.jsx'));
const { TacticalComments, TacticalEmojiHUD, EmojiRain } = await dc.require(dc.resolvePath('71 Recap2025/src/components/TacticalComments.jsx'));
const { WebsiteCard } = await dc.require(dc.resolvePath('71 Recap2025/src/components/WebsiteCard.jsx'));
const { AutoScrollWebview } = await dc.require(dc.resolvePath('71 Recap2025/src/components/AutoScrollWebview.jsx'));
const { Goals2026 } = await dc.require(dc.resolvePath('71 Recap2025/src/components/Goals2026.jsx'));
const { LiveStream2026 } = await dc.require(dc.resolvePath('71 Recap2025/src/components/LiveStream2026.jsx'));

function HyperCacheMedia({ item, active, mediaIndex, dimensions, autoPlay, preload, isVisible, folderPath }) {
    const [containerWidth, setContainerWidth] = useState(0);
    const [internalIdx, setInternalIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const baseMedia = useMemo(() => {
        if (!item?.media) return [];
        return item.media.map(m => m).filter(m => {
            const u = typeof m === 'string' ? m : (m.videoSrc || m.url);
            return !!u && typeof u === 'string';
        });
    }, [item]);

    const mode = baseMedia.length > 2 ? 'slider' : (baseMedia.length === 2 ? 'duo' : 'stack');
    const itemWidth = containerWidth > 0 ? containerWidth / 3.5 : 0;

    if (!item) return null;

    const scrollRef = useRef(0);
    const trackRef = useRef(null);
    const lastInteractionRef = useRef(0);
    const activeIndexRef = useRef(active ? 0 : -1);
    const lastStateUpdateRef = useRef(0);

    useEffect(() => {
        if (mode !== 'slider' || !active || !trackRef.current) return;
        let frame;
        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        const animate = () => {
            const now = Date.now();
            const timeSinceInteract = now - lastInteractionRef.current;
            const currentItemWidth = itemWidth || (containerWidth / 3);
            const totalWidth = currentItemWidth * baseMedia.length;

            if (autoPlay && itemWidth > 0) {
                const targetScroll = mediaIndex * itemWidth;
                scrollRef.current = lerp(scrollRef.current, targetScroll, 0.08);
            } else if (active && timeSinceInteract > 8000) {
                scrollRef.current += 3.5;
            }

            if (currentItemWidth <= 1) { frame = requestAnimationFrame(animate); return; }

            if (scrollRef.current >= totalWidth) scrollRef.current -= totalWidth;
            else if (scrollRef.current < 0) scrollRef.current += totalWidth;

            if (trackRef.current) {
                trackRef.current.style.transform = `translateX(-${scrollRef.current}px)`;
                const children = trackRef.current.children;
                const estimatedIndex = Math.round(scrollRef.current / currentItemWidth);
                const normalizedIndex = estimatedIndex % baseMedia.length;

                if (normalizedIndex !== activeIndexRef.current && (now - lastStateUpdateRef.current > 50)) {
                    activeIndexRef.current = normalizedIndex;
                    lastStateUpdateRef.current = now;
                    setInternalIdx(normalizedIndex);
                }

                const centerIdx = scrollRef.current / currentItemWidth + 1.75;
                const iStart = Math.max(0, Math.floor(centerIdx - 5));
                const iEnd = Math.min(children.length, Math.ceil(centerIdx + 5));

                for (let i = iStart; i < iEnd; i++) {
                    const child = children[i];
                    const inner = child.firstElementChild;
                    if (inner) {
                        const dist = ((i - (scrollRef.current / currentItemWidth)) - 1.75) / 2.25;
                        const rotate = dist * 10;
                        const z = Math.abs(dist) * -50;
                        inner.style.transform = `perspective(800px) rotateY(${rotate}deg) translateZ(${z}px)`;
                    }
                }

                if (!autoPlay && window.updateNodeGraphIndex && (now - lastStateUpdateRef.current > 150)) {
                    if (normalizedIndex !== activeIndexRef.current) {
                        window.updateNodeGraphIndex(normalizedIndex);
                        activeIndexRef.current = normalizedIndex;
                        lastStateUpdateRef.current = now;
                    }
                }
            }
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [mode, active, preload, baseMedia.length, containerWidth, itemWidth, autoPlay, mediaIndex]);

    return (
        <div data-active={active ? "true" : "false"}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: active ? 1 : 0,
                pointerEvents: 'none', // Allow passing through to the globe/nodes
                transition: 'opacity 0.4s ease',
                zIndex: active ? 100 : 1,
                overflow: 'hidden',
                visibility: isVisible ? 'visible' : 'hidden'
            }}
        >
            {item.media?.some(m => m.type === 'flight') ? (
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', pointerEvents: 'auto' }}>
                    <GlobeTravel active={active} from={item.media.find(m => m.type === 'flight').from} to={item.media.find(m => m.type === 'flight').to} folderPath={folderPath} />
                </div>
            ) : ((item.title || '').toUpperCase() === 'JOIN US') ? (
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {LiveStream2026 ? <LiveStream2026 active={active} /> : <div style={{ color: 'red', fontSize: '20px', padding: '20px' }}>Error: LiveStream2026 Not Loaded</div>}
                </div>
            ) : ((item.title || '').toUpperCase() === 'GOALS') ? (
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Goals2026 ? <Goals2026 active={active} /> : <div style={{ color: 'red', fontSize: '20px', padding: '20px' }}>Error: Goals2026 Component Not Loaded</div>}
                </div>
            ) : mode === 'duo' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '16vh', perspective: '1200px', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', gap: '3vw', width: '90%', justifyContent: 'center', transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                        {baseMedia.slice(0, 2).map((m, idx) => {
                            return <SliderItem key={idx} m={m} idx={idx} itemWidth={dimensions.width * 0.40} mediaIndex={idx} baseLen={2} parentActive={active} isCenterActive={true} folderPath={folderPath} />;
                        })}
                    </div>
                </div>
            ) : mode === 'slider' ? (
                <div
                    ref={el => {
                        if (el && !el.observerAttached) {
                            const ro = new ResizeObserver(entries => { for (let entry of entries) setContainerWidth(entry.contentRect.width); });
                            ro.observe(el);
                            el.onwheel = (e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                lastInteractionRef.current = Date.now();
                                // Support both vertical and horizontal scroll (trackpad)
                                scrollRef.current += (e.deltaY + e.deltaX) * 0.7;
                            };
                            el.observerAttached = true;
                            setContainerWidth(el.clientWidth);
                        }
                    }}
                    onMouseMove={() => lastInteractionRef.current = Date.now()}
                    style={{
                        width: '140vw', height: '100vh', position: 'fixed', top: 0, left: '-20vw',
                        display: 'flex', alignItems: 'flex-start', paddingTop: '12vh', boxSizing: 'border-box',
                        background: 'transparent', overflow: 'hidden', perspective: '1200px', zIndex: 1,
                        pointerEvents: 'none'
                    }}
                >
                    <div ref={trackRef} style={{ display: 'flex', height: 'auto', alignItems: 'center', width: 'max-content', willChange: 'transform', transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                        <SliderList baseMedia={baseMedia} mediaIndex={mediaIndex} internalIdx={internalIdx} active={active} itemWidth={itemWidth} folderPath={folderPath} />
                    </div>
                </div>
            ) : (
                <div className="media-burst" style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                    {(() => {
                        const hasLocalVideo = baseMedia.some(m => {
                            const u = typeof m === 'string' ? m : m.url;
                            return isMediaLocal(u) && isMediaVideo(u);
                        });
                        return baseMedia.map((m, idx) => {
                            const isMain = idx === mediaIndex;
                            const url = typeof m === 'string' ? m : m.url;
                            const displayUrl = typeof m === 'string' ? m : (m.videoSrc || m.url);
                            const startTime = typeof m === 'string' ? 0 : m.startTime;
                            const label = typeof m === 'string' ? '' : m.label;
                            const ytEmbed = getYouTubeEmbed(url, startTime);
                            const isWeb = !ytEmbed && displayUrl.startsWith('http') && !isMediaVideo(displayUrl) && !isMediaImage(displayUrl);
                            const relIdx = (idx - mediaIndex + baseMedia.length) % baseMedia.length;

                            const panTilt = active && isMain && autoPlay && !isHovered ? `rotateY(${Math.sin(Date.now() * 0.001) * 8}deg) rotateX(${Math.cos(Date.now() * 0.0008) * 5}deg) scale(1.05)` : '';
                            const isStealthYouTube = ytEmbed && autoPlay && hasLocalVideo;
                            if (isStealthYouTube) return null;

                            const isCurrentMedia = active && idx === mediaIndex;

                            return (
                                <div key={url + idx}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const targetUrl = getInteractiveUrl(m);
                                        if (targetUrl) openResource(targetUrl, folderPath);
                                    }}
                                    style={{
                                        cursor: 'pointer', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '1px solid rgba(168,85,247,0.4)', background: '#111', borderRadius: '4px', overflow: 'hidden',
                                        transform: `translate3d(${relIdx * 65}px, ${relIdx * -40}px, -${relIdx * 100}px) rotateZ(${relIdx * -12}deg) ${panTilt}`,
                                        opacity: Math.max(0, 1 - (relIdx * 0.25)), zIndex: 10 - relIdx,
                                        pointerEvents: 'auto',
                                        transition: autoPlay && isMain ? 'transform 0.1s linear, opacity 0.4s ease' : 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease'
                                    }}>
                                    {(active || preload) && isMain ? (
                                        isMediaVideo(displayUrl) ? (
                                            <SafeVideoPlayer
                                                src={displayUrl}
                                                active={isCurrentMedia}
                                                style={{ ...CONTAIN_STYLE, pointerEvents: 'none' }}
                                                folderPath={folderPath}
                                            />
                                        ) : ytEmbed ? (
                                            <iframe src={ytEmbed} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                                        ) : isWeb ? (
                                            <div style={{ width: '100%', height: '100%', background: '#FFF', pointerEvents: 'none' }}>
                                                <AutoScrollWebview src={displayUrl} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} active={idx === mediaIndex} />
                                            </div>
                                        ) : (
                                            <img src={displayUrl} style={{ ...CONTAIN_STYLE, pointerEvents: 'none' }} />
                                        )
                                    ) : <div style={{ width: '100%', height: '100%', background: '#111', pointerEvents: 'none' }}></div>}
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)', pointerEvents: 'none', zIndex: 2 }} />
                                    {relIdx === 0 && (
                                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', padding: '8px', color: '#A855F7', border: '1px solid rgba(168,85,247,0.5)', zIndex: 10, pointerEvents: 'none' }}>
                                            <span style={{ pointerEvents: 'none' }}>{label ? label.toUpperCase() : `NODE_MONITOR`}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            )}
        </div>
    );
}

return { HyperCacheMedia };
