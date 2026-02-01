const { useEffect, useRef, useState, useMemo } = dc;

const { HyperCacheMedia } = await dc.require(dc.resolvePath('71 Recap2025/src/components/NodeGraph/HyperCacheMedia.jsx'));
const { TacticalComments, EmojiRain } = await dc.require(dc.resolvePath('71 Recap2025/src/components/TacticalComments.jsx'));

function NodeGraph({ data, isAutoPlayActive, setIsAutoPlayActive, folderPath }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const cinematicRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const lastRenderedMoonsRef = useRef([]);
    const isManualMode = useRef(false);
    const [mediaIndex, setMediaIndex] = useState(0);

    useEffect(() => {
        window.updateNodeGraphIndex = (idx) => { setMediaIndex(idx); };
        return () => { window.updateNodeGraphIndex = null; };
    }, []);

    const [focusedState, setFocusedState] = useState(null);
    const [activeFocusId, setActiveFocusId] = useState(null);
    const [focusedMonthId, setFocusedMonthId] = useState(null);
    const [focusedMonthComments, setFocusedMonthComments] = useState([]);
    const corePulseRef = useRef(0);
    const rotationRef = useRef(0);
    const targetRotationRef = useRef(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const frameIdRef = useRef(null);
    const mousePos = useRef({ x: 0.5, y: 0.5 });
    const tiltRef = useRef({ x: 0, y: 0 });

    const autoPlayRef = useRef({ index: -1, mediaIdx: 0 });
    const cinematicStartedRef = useRef(false);
    const cinematicTimerRef = useRef(null);
    const MONTH_GAP = 0.35, YEAR_GAP = 0.69;
    const locationRef = useRef("");

    const items = useMemo(() => {
        const { width, height } = dimensions;
        if (!height || !width) return { yearSegments: [], monthHubs: [], itemHubs: [], radii: {} };

        const baseScale = ((height / 800) * 0.75 + (width / 1400) * 0.25) * 0.85;
        const s = Math.max(0.5, Math.min(1.2, baseScale));

        const R_YEAR = 90 * s, R_MONTH = 220 * s, R_RING = 300 * s, R_ITEM = 410 * s;
        let curAng = 0; const ySegs = [], mHubs = [], iHubs = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        ["2025", "2026"].forEach((y, yIdx) => {
            const startAng = curAng;
            const yData = data?.years?.find(d => d.year === y);
            const targetGroups = (y === "2025") ? monthNames : (yData?.groups?.map(g => g.name) || []);

            targetGroups.forEach(gName => {
                const mAng = curAng;
                const gData = yData?.groups?.find(g => g.name.toLowerCase().startsWith(gName.toLowerCase().split(' ')[0]));

                if (gData?.items) {
                    const filteredItems = [];
                    let startCode = null;

                    gData.items.forEach(it => {
                        const title = (it.title || it.name || '').toUpperCase();
                        if (title === 'BETO.888') {
                            let code = null;
                            if (it.media && it.media.length > 0) code = it.media[0].text || it.media[0].src || it.media[0];
                            if (!code && it.desc) code = it.desc;
                            if (!code && it.items && it.items.length > 0) code = it.items[0].name || it.items[0].title;
                            if (code && typeof code === 'string') {
                                if (filteredItems.length === 0) startCode = code.trim();
                                else filteredItems[filteredItems.length - 1].betoCode = code.trim();
                            }
                        } else filteredItems.push(it);
                    });

                    if (startCode && filteredItems.length > 0 && !filteredItems[0].betoCode) filteredItems[0].betoCode = startCode;

                    filteredItems.forEach((it, idx) => {
                        const ang = mAng + (filteredItems.length > 1 ? (idx * (0.18 / (filteredItems.length - 1)) - 0.09) : 0);
                        const ix = Math.cos(ang) * R_ITEM, iy = Math.sin(ang) * R_ITEM;
                        iHubs.push({
                            id: it.id || `i-${y}-${gName}-${idx}`, angle: ang, title: it.title, desc: it.desc || "", media: it.media || [], items: it.items || [], betoCode: it.betoCode || null, parentId: `m-${y}-${gName}`,
                            currentMoons: Array.from({ length: Math.max(1, (it.media || []).length) }, (_, i) => ({ x: ix, y: iy, phase: Math.random() * 6.28, shellIdx: i % 2 })),
                            fibers: Array.from({ length: 8 }, () => ({ midA: ang + (Math.random() - 0.5) * 0.1, trackR: R_RING + (R_ITEM - R_RING) * Math.random(), weight: 0.5 }))
                        });
                    });
                    mHubs.push({ id: `m-${y}-${gName}`, angle: mAng, name: gName.toUpperCase(), year: y, isGhost: !gData?.items?.length, comments: gData?.comments || [], betoCode: startCode });
                } else mHubs.push({ id: `m-${y}-${gName}`, angle: mAng, name: gName.toUpperCase(), year: y, isGhost: true, comments: gData?.comments || [] });
                curAng += MONTH_GAP;
            });
            ySegs.push({ year: y, start: startAng, end: curAng - MONTH_GAP });
            curAng += YEAR_GAP;
        });
        return { yearSegments: ySegs, monthHubs: mHubs, itemHubs: iHubs, scaleFactor: s, totalCycle: Math.PI * 2, radii: { R_YEAR, R_MONTH, R_RING, R_ITEM } };
    }, [data, dimensions, MONTH_GAP, YEAR_GAP]);

    const betoCodeRef = useRef(null);
    const betoAnimRef = useRef(0);

    useEffect(() => {
        if (!locationRef.current && items.itemHubs?.length > 0) {
            const firstFlightNode = items.itemHubs.find(h => (h.media || []).some(m => m.type === 'flight'));
            if (firstFlightNode) {
                const f = firstFlightNode.media.find(m => m.type === 'flight');
                if (f) locationRef.current = (f.from || '').toUpperCase();
            }
        }
        if (!focusedState) return;
        const media = focusedState.media || [];
        const flight = media.find(m => m.type === 'flight');
        if (flight) {
            locationRef.current = (flight.from || '').toUpperCase();
            const timer = setTimeout(() => { locationRef.current = (flight.to || '').toUpperCase(); }, 4000);
            return () => clearTimeout(timer);
        } else {
            const hubs = items.itemHubs || [];
            let currentIdx = hubs.findIndex(h => h.id === focusedState.id);
            if (currentIdx === -1) {
                for (let i = hubs.length - 1; i >= 0; i--) { if (hubs[i].angle <= focusedState.angle) { currentIdx = i; break; } }
            }
            if (currentIdx >= 0) {
                let foundLocation = null;
                for (let i = currentIdx - 1; i >= 0; i--) {
                    const prevFlight = (hubs[i].media || []).find(m => m.type === 'flight');
                    if (prevFlight) { foundLocation = (prevFlight.to || '').toUpperCase(); break; }
                }
                if (foundLocation) locationRef.current = foundLocation;
                let foundCode = focusedState.betoCode;
                if (!foundCode) {
                    for (let i = currentIdx; i >= 0; i--) {
                        if (hubs[i].betoCode) { foundCode = hubs[i].betoCode; break; }
                        const mHub = items.monthHubs.find(m => m.id === hubs[i].parentId);
                        if (mHub?.betoCode) { foundCode = mHub.betoCode; break; }
                    }
                }
                if (foundCode !== betoCodeRef.current) { betoCodeRef.current = foundCode; betoAnimRef.current = 0; }
            } else if (betoCodeRef.current) { betoCodeRef.current = null; betoAnimRef.current = 0; }
        }
    }, [focusedState, items.itemHubs, items.monthHubs]);

    useEffect(() => {
        const container = containerRef.current; if (!container) return;
        const obs = new ResizeObserver(entries => {
            if (!entries.length) return;
            const { width, height } = entries[0].contentRect;
            setDimensions(prev => (Math.abs(prev.width - width) < 4 && Math.abs(prev.height - height) < 4) ? prev : { width, height });
        });
        obs.observe(container);
        const hw = e => { e.preventDefault(); targetRotationRef.current -= e.deltaY * 0.0006; if (isAutoPlayActive) setIsAutoPlayActive(false); };
        const hm = e => { const r = container.getBoundingClientRect(); mousePos.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
        container.addEventListener('wheel', hw, { passive: false });
        container.addEventListener('mousemove', hm);
        return () => { obs.disconnect(); container.removeEventListener('wheel', hw); container.removeEventListener('mousemove', hm); };
    }, [isAutoPlayActive]);

    useEffect(() => {
        if (!activeFocusId || !items.itemHubs) return;
        const fHub = items.itemHubs.find(h => h.id === activeFocusId);
        const fMonth = items.monthHubs.find(m => m.id === (fHub?.parentId || activeFocusId));
        console.log(`[Navigation] -> ${fMonth?.name || "UNKNOWN"} | ${fHub?.title || "HUB"} | AutoPlay: ${isAutoPlayActive}`);
    }, [activeFocusId, isAutoPlayActive, items]);

    useEffect(() => {
        if (!isAutoPlayActive) {
            if (cinematicTimerRef.current) { clearTimeout(cinematicTimerRef.current); cinematicTimerRef.current = null; }
            cinematicStartedRef.current = false; return;
        }
        const mediaHubs = (items.itemHubs || []).filter(ih => (ih.media || []).length > 0 || !!ih.desc);
        if (!mediaHubs.length) return;
        const proceed = () => {
            if (!isAutoPlayActive) return;
            const item = mediaHubs[autoPlayRef.current.index];
            if (item && autoPlayRef.current.mediaIdx < Math.max(1, (item.media || []).length) - 1) {
                autoPlayRef.current.mediaIdx++; setMediaIndex(autoPlayRef.current.mediaIdx);
                if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
                cinematicTimerRef.current = setTimeout(proceed, 7000); return;
            }
            autoPlayRef.current.index++; autoPlayRef.current.mediaIdx = 0;
            if (autoPlayRef.current.index >= mediaHubs.length) { setIsAutoPlayActive(false); autoPlayRef.current.index = -1; cinematicStartedRef.current = false; return; }
            const next = mediaHubs[autoPlayRef.current.index];
            setActiveFocusId(next.id); setFocusedState(next); setMediaIndex(0); targetRotationRef.current = next.angle;
            if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
            cinematicTimerRef.current = setTimeout(proceed, 10000);
        };
        if (!cinematicStartedRef.current) {
            cinematicStartedRef.current = true; const first = mediaHubs[0];
            if (Math.abs(rotationRef.current - (first?.angle || 0)) > 0.5) {
                autoPlayRef.current.index = 0; autoPlayRef.current.mediaIdx = 0; targetRotationRef.current = first.angle;
                setActiveFocusId(first.id); setFocusedState(first); setMediaIndex(0);
                if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
                cinematicTimerRef.current = setTimeout(proceed, 6000);
            } else {
                if (autoPlayRef.current.index === -1) {
                    let best = 0, minD = 999;
                    mediaHubs.forEach((it, i) => { const d = Math.abs(rotationRef.current - (it.angle || 0)); if (d < minD) { minD = d; best = i; } });
                    autoPlayRef.current.index = best;
                }
                const node = mediaHubs[autoPlayRef.current.index]; if (node) { setActiveFocusId(node.id); setFocusedState(node); }
                if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
                cinematicTimerRef.current = setTimeout(proceed, 6000);
            }
        } else if (!cinematicTimerRef.current) cinematicTimerRef.current = setTimeout(proceed, 5000);
        const hk = (e) => {
            if (!isAutoPlayActive || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
            e.preventDefault(); e.stopPropagation(); if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
            const dir = e.key === 'ArrowRight' ? 1 : -1;
            const currentNode = mediaHubs[autoPlayRef.current.index], mediaLen = currentNode ? Math.max(1, (currentNode.media || []).length) : 1;
            let newMediaIdx = autoPlayRef.current.mediaIdx + dir, newNodeIdx = autoPlayRef.current.index;
            if (newMediaIdx >= mediaLen) { newNodeIdx++; newMediaIdx = 0; }
            else if (newMediaIdx < 0) { newNodeIdx--; const prev = mediaHubs[((newNodeIdx % mediaHubs.length) + mediaHubs.length) % mediaHubs.length]; newMediaIdx = Math.max(1, (prev.media || []).length) - 1; }
            if (newNodeIdx < 0) newNodeIdx = mediaHubs.length - 1; if (newNodeIdx >= mediaHubs.length) newNodeIdx = 0;
            const next = mediaHubs[newNodeIdx]; autoPlayRef.current.index = newNodeIdx; autoPlayRef.current.mediaIdx = newMediaIdx;
            setActiveFocusId(next.id); setFocusedState(next); setMediaIndex(newMediaIdx); targetRotationRef.current = next.angle;
            cinematicTimerRef.current = setTimeout(proceed, 10000);
        };
        window.addEventListener('keydown', hk); return () => window.removeEventListener('keydown', hk);
    }, [isAutoPlayActive, items.itemHubs]);

    useEffect(() => {
        if (!data || isInitialized) return;
        let foundAng = (12 * MONTH_GAP) + YEAR_GAP, stop = false;
        data.years?.forEach((y, yIdx) => { if (stop) return; y.groups?.forEach((g, mIdx) => { if (stop) return; if (g.items?.length > 0) { foundAng = (yIdx * (12 * MONTH_GAP + YEAR_GAP)) + (mIdx * MONTH_GAP); stop = true; } }); });
        rotationRef.current = foundAng; targetRotationRef.current = foundAng; setIsInitialized(true);
    }, [data, isInitialized]);

    useEffect(() => {
        if (!focusedState) return; corePulseRef.current = 1.0;
        if (isAutoPlayActive) return;
        const interval = setInterval(() => { if (!isManualMode.current) setMediaIndex(p => (p + 1) % (focusedState.media?.length || 1)); }, 3500);
        return () => clearInterval(interval);
    }, [focusedState, isAutoPlayActive]);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas || !dimensions.width) return;
        const ctx = canvas.getContext('2d'), { width, height } = dimensions, dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
        const render = () => {
            const time = Date.now() * 0.0006, { yearSegments, monthHubs, itemHubs, scaleFactor: s, totalCycle, radii } = items, { R_YEAR, R_MONTH, R_RING, R_ITEM } = radii;
            rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.1; const scroll = rotationRef.current; corePulseRef.current *= 0.95;
            const getPos = (ang) => { let d = (ang - scroll) % totalCycle; if (d > totalCycle * 0.5) d -= totalCycle; if (d < -totalCycle * 0.5) d += totalCycle; return { ang: d, x: Math.cos(d), y: Math.sin(d), dist: d }; };
            ctx.clearRect(0, 0, width, height); ctx.save(); ctx.translate(0, height * 0.1);
            ctx.save(); const cr = (55 + corePulseRef.current * 25) * s; ctx.rotate(time * 0.3); ctx.strokeStyle = `rgba(255,255,255,${0.15 + corePulseRef.current * 0.4})`; ctx.lineWidth = (1 + corePulseRef.current * 1.5) * s;
            for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI; ctx.beginPath(); ctx.ellipse(0, 0, cr, cr * Math.abs(Math.sin(time + a)), time + a, 0, 6.28); ctx.stroke(); }
            ctx.beginPath(); ctx.arc(0, 0, (15 + corePulseRef.current * 10) * s, 0, 6.28); ctx.fillStyle = `rgba(255,255,255,${0.4 + corePulseRef.current * 0.6})`; ctx.fill(); ctx.restore();
            ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1 * s;[R_YEAR, R_MONTH, R_ITEM].forEach(r => { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.stroke(); });
            ctx.strokeStyle = 'rgba(168,85,247,0.15)'; ctx.setLineDash([5 * s, 15 * s]); ctx.beginPath(); ctx.arc(0, 0, R_RING, 0, 6.28); ctx.stroke(); ctx.restore();
            let fItem = null, minDist = 999;
            itemHubs.forEach(ih => { const d = Math.abs(getPos(ih.angle).dist); if (d < minDist) { minDist = d; fItem = ih; } });
            const fItemPos = fItem ? getPos(fItem.angle) : null;

            // HYSTERESIS: Be more strict about GAINING focus, but more lenient about KEEPING it.
            const focusThreshold = activeFocusId ? 0.3 : 0.2;
            const fActiveFocus = fItem && (isAutoPlayActive || Math.abs(fItemPos.dist) < focusThreshold);

            if (fActiveFocus) {
                if (activeFocusId !== fItem.id) {
                    setActiveFocusId(fItem.id);
                    setFocusedState(fItem);
                    if (!isAutoPlayActive) setMediaIndex(0);
                }
            }
            else if (activeFocusId) {
                setActiveFocusId(null);
                setFocusedState(null);
                setMediaIndex(0);
            }
            let fMonth = null, minMDist = 999;
            monthHubs.forEach(mh => { const d = Math.abs(getPos(mh.angle).dist); if (d < minMDist) { minMDist = d; fMonth = mh; } });
            const fMonthPos = fMonth ? getPos(fMonth.angle) : null;
            if (fMonth && Math.abs(fMonthPos.dist) < 0.25) { if (focusedMonthId !== fMonth.id) { setFocusedMonthId(fMonth.id); setFocusedMonthComments(fMonth.comments); setActiveFocusId(fMonth.id); setFocusedState(fMonth); setMediaIndex(0); } }
            else if (focusedMonthId) { setFocusedMonthId(null); setFocusedMonthComments([]); }
            yearSegments.forEach(seg => {
                const sa = getPos(seg.start), ea = getPos(seg.end); if (Math.abs(sa.dist) > 2.5 && Math.abs(ea.dist) > 2.5) return;
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.arc(0, 0, 105 * s, sa.ang, ea.ang); ctx.stroke();
                const lp = getPos(seg.start + 0.12); ctx.save(); ctx.translate(lp.x * 105 * s, lp.y * 105 * s); ctx.rotate(lp.ang + Math.PI / 2); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `900 ${18 * s}px Inter`; ctx.textAlign = 'center'; ctx.fillText(seg.year, 0, -12 * s); ctx.restore();
            });
            monthHubs.forEach(mh => {
                const pos = getPos(mh.angle); if (Math.abs(pos.dist) > 1.4) return;
                const op = 0.3 + Math.pow(Math.max(0, 1 - Math.abs(pos.dist) * 1.5), 2) * 0.7, mx = pos.x * R_MONTH, my = pos.y * R_MONTH;
                if (fMonth?.id === mh.id && Math.abs(pos.dist) < 0.25 && !mh.isGhost) {
                    ctx.save(); ctx.strokeStyle = '#A855F7'; ctx.lineWidth = 5 * s; ctx.setLineDash([15 * s, 10 * s]); ctx.lineDashOffset = -time * 25; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(mx, my); ctx.globalAlpha = 0.4 + Math.sin(time * 3) * 0.1; ctx.stroke(); ctx.restore();
                }
                ctx.strokeStyle = `rgba(255,255,255,${0.15 * op})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(mx, my); ctx.stroke();
                ctx.beginPath(); ctx.arc(mx, my, 4 * s, 0, 6.28); ctx.fillStyle = `rgba(255,255,255,${op})`; ctx.fill();
                ctx.save(); ctx.translate(mx, my); ctx.rotate(pos.ang); ctx.font = `900 ${22 * s}px Inter`; ctx.textAlign = 'left'; ctx.fillStyle = `rgba(255,255,255,${op * 0.6})`; ctx.fillText(mh.name, 26 * s, 6 * s); ctx.restore();
            });
            itemHubs.forEach(ih => {
                const pos = getPos(ih.angle); if (Math.abs(pos.dist) > 1.2 || (ih.title || '').toUpperCase() === 'BETO.888') return;
                const isF = activeFocusId === ih.id, op = isF ? 1 : 0.2 + Math.pow(Math.max(0, 1 - Math.abs(pos.dist) * 2), 2) * 0.4, ix = pos.x * R_ITEM, iy = pos.y * R_ITEM;
                const parent = monthHubs.find(p => p.id === ih.parentId), pPos = parent ? getPos(parent.angle) : null;
                if (pPos && Math.abs(pos.dist) < 0.6) {
                    const px = pPos.x * R_MONTH, py = pPos.y * R_MONTH;
                    ih.fibers.forEach(f => {
                        const midA = getPos(f.midA).ang, cx = Math.cos(midA) * f.trackR, cy = Math.sin(midA) * f.trackR;
                        if (isF) {
                            ctx.strokeStyle = `rgba(168,85,247,${0.15 * op})`; ctx.lineWidth = 0.6 * s; ctx.font = `bold ${8 * s}px monospace`; ctx.textAlign = 'center';
                            for (let i = 0; i < 5; i++) { const ft = (i / 5 + time * 0.5) % 1, it = 1 - ft, bx = it * it * px + 2 * it * ft * cx + ft * ft * ix, by = it * it * py + 2 * it * ft * cy + ft * ft * iy; ctx.fillStyle = `rgba(168,85,247,${Math.sin(ft * 3.14) * 0.6 * op})`; ctx.fillText(i % 2 === 0 ? "1" : "0", bx, by); }
                            ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(cx, cy, ix, iy); ctx.stroke();
                        } else { ctx.strokeStyle = `rgba(168,85,247,${0.08 * op})`; ctx.lineWidth = 0.2 * s; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ix, iy); ctx.stroke(); }
                    });
                }
                if (Math.abs(pos.dist) < 0.5) {
                    const baseMedia = ih.media || [], or = (35 + baseMedia.length * 4) * s;
                    if (isF && (!Array.isArray(lastRenderedMoonsRef.current) || lastRenderedMoonsRef.current.length !== baseMedia.length)) lastRenderedMoonsRef.current = baseMedia.map((_, i) => ({ x: 0, y: 0, index: i }));
                    for (let i = 0; i < baseMedia.length; i++) {
                        const m = ih.currentMoons[i], a = time + m.phase, tx = isF ? ix + (60 * s) : ix + Math.cos(a) * or, ty = isF ? iy + ((i - (baseMedia.length - 1) / 2) * (20 * s)) : iy + Math.sin(a) * (or * 0.3);
                        m.x += (tx - m.x) * 0.15; m.y += (ty - m.y) * 0.15; if (isF) { lastRenderedMoonsRef.current[i].x = m.x; lastRenderedMoonsRef.current[i].y = m.y; }
                        const cur = isF && i === mediaIndex; ctx.beginPath(); ctx.arc(m.x, m.y, (cur ? 6 : 3) * s, 0, 6.28); ctx.fillStyle = cur ? '#FFF' : `rgba(255,255,255,${isF ? 0.8 : 0.4})`; ctx.fill();
                        if (isF) { ctx.strokeStyle = `rgba(255,255,255,${cur ? 0.3 : 0.1})`; ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(m.x, m.y); ctx.stroke(); }
                    }
                }
                ctx.beginPath(); ctx.arc(ix, iy, (isF ? 18 : 8) * s, 0, 6.28); ctx.fillStyle = isF ? '#A855F7' : `rgba(168, 85, 247, ${op * 0.6})`; ctx.fill();
            });
            ctx.restore();
            const hs = Math.min(1.2, Math.max(0.7, (height / 800) * 0.7 + (width / 1400) * 0.3)), rm = 80 * hs; ctx.textAlign = 'right';
            let activeYear = fMonth?.year || ""; if (!activeYear) { const norm = ((scroll % totalCycle) + totalCycle) % totalCycle; for (let i = yearSegments.length - 1; i >= 0; i--) { if (norm >= yearSegments[i].start - 0.1) { activeYear = yearSegments[i].year; break; } } }
            if (activeYear) {
                const sfx = activeYear === "2026" ? "PLAN" : "RECAP"; ctx.fillStyle = '#FFF'; ctx.font = `900 ${70 * hs}px Inter`; ctx.fillText(sfx, width - rm, 100 * hs);
                const rw = ctx.measureText(sfx).width, ix = width - rm - rw - 25 * hs; ctx.fillStyle = 'rgba(168, 85, 247, 0.9)'; ctx.font = `300 ${32 * hs}px Inter`; ctx.fillText(activeYear, ix, 100 * hs - 2 * hs);
                if (activeYear !== '2026' && locationRef.current) { ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.font = `700 ${12 * hs}px monospace`; ctx.fillText(locationRef.current.toUpperCase(), ix, 100 * hs - 32 * hs - 6 * hs); }
                if (activeYear !== '2026' && betoCodeRef.current) { if (betoAnimRef.current < 1) betoAnimRef.current += 0.05; ctx.fillStyle = `rgba(255, 255, 255, ${betoAnimRef.current})`; ctx.font = `700 ${11 * hs}px monospace`; ctx.fillText(`• ${betoCodeRef.current}`, width - rm, 100 * hs - 62 * hs + (12 * hs * (1 - betoAnimRef.current))); }
                const tw = rw + ctx.measureText(activeYear).width + 40 * hs; ctx.fillStyle = 'rgba(168, 85, 247, 0.3)'; ctx.fillRect(width - rm - tw, 115 * hs, tw, 2 * hs);
            }
            ctx.textAlign = 'left'; ctx.save(); const tx = width - 40 * hs; ctx.translate(tx, 0); ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, height); ctx.stroke();
            const TSCALE = 600 * s;
            itemHubs.forEach(ih => {
                if ((ih.title || '').toUpperCase() === 'BETO.888') return;
                const pos = getPos(ih.angle), dy = pos.dist * TSCALE + height / 2; if (dy < -20 || dy > height + 20) return;
                const op = Math.max(0, 1.0 - Math.abs(pos.dist) / 1.5); if (op <= 0) return;
                ctx.beginPath(); ctx.strokeStyle = activeFocusId === ih.id ? '#A855F7' : 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1 * s; ctx.moveTo(-8 * s, dy); ctx.lineTo(8 * s, dy); ctx.stroke();
                if (activeFocusId === ih.id) { ctx.beginPath(); ctx.arc(0, dy, 2.5 * s, 0, 6.28); ctx.fillStyle = '#FFF'; ctx.fill(); ctx.stroke(); }
            });
            monthHubs.forEach(mh => {
                const pos = getPos(mh.angle), dy = pos.dist * TSCALE + height / 2; if (dy < -50 || dy > height + 50) return;
                const isActive = focusedMonthId === mh.id; ctx.beginPath(); ctx.strokeStyle = isActive ? '#A855F7' : 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = isActive ? 3 * s : 1 * s; ctx.moveTo(-15 * s, dy); ctx.lineTo(15 * s, dy); ctx.stroke();
                ctx.fillStyle = isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255, 255, 255, 0.4)'; ctx.font = `${isActive ? '700' : '400'} ${10 * s}px Inter`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(mh.name, -22 * s, dy);
                if (isActive) { ctx.beginPath(); ctx.arc(0, dy, 4 * s, 0, 6.28); ctx.fillStyle = '#A855F7'; ctx.fill(); }
            });
            ctx.restore(); const tt = { x: (mousePos.current.y - 0.5) * -30, y: (mousePos.current.x - 0.5) * 40 }; tiltRef.current.x += (tt.x - tiltRef.current.x) * 0.1; tiltRef.current.y += (tt.y - tiltRef.current.y) * 0.1;
            frameIdRef.current = requestAnimationFrame(render);
        }; render(); return () => cancelAnimationFrame(frameIdRef.current);
    }, [items, dimensions, mediaIndex, activeFocusId]);

    useEffect(() => {
        let frame;
        const animateFloat = () => {
            if (cinematicRef.current) { const t = Date.now() * 0.002, y = Math.sin(t) * 10, rx = tiltRef.current.x + Math.sin(t * 0.7) * 2, ry = tiltRef.current.y + Math.cos(t * 0.5) * 3, rz = Math.sin(t * 0.3) * 1; cinematicRef.current.style.transform = `translateY(calc(-50% + ${y}px)) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`; }
            frame = requestAnimationFrame(animateFloat);
        }; animateFloat(); return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        const container = containerRef.current; if (!container) return;
        const hcc = (e) => {
            if (!canvasRef.current) return;
            const r = canvasRef.current.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, x = (e.clientX - r.left) * dpr, y = (e.clientY - r.top) * dpr;
            const hit = lastRenderedMoonsRef.current.find(m => Math.hypot(m.x - x, m.y - y) < 30 * dpr);
            if (hit) { setMediaIndex(hit.index); isManualMode.current = true; if (isAutoPlayActive) setIsAutoPlayActive(false); e.stopPropagation(); e.preventDefault(); }
        };
        container.addEventListener('click', hcc);
        return () => container.removeEventListener('click', hcc);
    }, [isAutoPlayActive, items]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#050505', position: 'relative', overflow: 'hidden', cursor: 'crosshair' }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', zIndex: 100, cursor: 'default' }} />
            <div ref={cinematicRef}
                style={{ position: 'absolute', top: '60%', right: '15%', width: '68%', aspectRatio: '16/9', transform: `translateY(-50%)`, opacity: focusedState ? 1 : 0, transition: 'opacity 0.4s ease, transform 0.1s linear', zIndex: 500, perspective: '1000px', pointerEvents: 'none', cursor: 'pointer' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                        {(() => {
                            const mediaHubs = (items.itemHubs || []).filter(ih => (ih.media || []).length > 0 || !!ih.desc), activeIdx = mediaHubs.findIndex(h => h.id === activeFocusId);
                            return mediaHubs.map((ih, idx) => {
                                const isActive = activeFocusId === ih.id, isNeighbor = !isActive && activeIdx !== -1 && Math.min(Math.abs(idx - activeIdx), mediaHubs.length - Math.abs(idx - activeIdx)) <= 1;
                                return (isActive || isNeighbor) ? <HyperCacheMedia key={ih.id} item={ih} active={isActive} preload={isNeighbor} isVisible={isActive || isNeighbor} mediaIndex={isActive ? mediaIndex : 0} dimensions={dimensions} autoPlay={isAutoPlayActive && isActive} folderPath={folderPath} /> : null;
                            });
                        })()}
                    </div>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', padding: '12px 64px', zIndex: 30, pointerEvents: 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                            {(focusedState?.title || '').toUpperCase() !== 'JOIN US' && <h2 style={{ color: '#FFF', fontSize: '32px', margin: 0, fontWeight: 900, letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{(focusedState?.title || '').toUpperCase()}</h2>}
                            {focusedState?.desc && (focusedState.title || '').toUpperCase() !== 'GOALS' && (focusedState.title || '').toUpperCase() !== 'JOIN US' && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{focusedState.desc}</p>}
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 600 }}>
                <TacticalComments comments={focusedMonthComments} activeId={focusedMonthId} />
                <EmojiRain activeId={activeFocusId + (items.itemHubs.find(h => h.id === activeFocusId)?.media[mediaIndex]?.url || "")} emojis={[...(items.itemHubs.find(h => h.id === activeFocusId)?.emojis || []), ...(items.itemHubs.find(h => h.id === activeFocusId)?.media[mediaIndex]?.emojis || [])]} />
            </div>
        </div>
    );
}

return { NodeGraph };
