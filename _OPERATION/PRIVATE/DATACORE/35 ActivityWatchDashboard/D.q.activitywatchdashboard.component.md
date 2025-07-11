





# ViewComponent

```jsx
// ViewComponent (main component)
const { useState, useEffect, useCallback, useMemo, useRef } = dc;

const filename = "_OPERATION/PRIVATE/DATACORE/35 ActivityWatchDashboard/D.q.activitywatchdashboard.component.md";

const { formatDuration, formatTime } = await dc.require(dc.headerLink(filename, "HelperFunctions"));
const { PieChartView } = await dc.require(dc.headerLink(filename, "PieChartView"));
const { SunburstChartView } = await dc.require(dc.headerLink(filename, "SunburstChartView"));
const { ScreenModeHelper } = await dc.require(dc.headerLink(filename, "ScreenModeHelper"));
const { CalendarHeatmapView } = await dc.require(dc.headerLink(filename, "CalendarHeatmapView"));
const { StreamgraphView } = await dc.require(dc.headerLink(filename, "StreamgraphView"));


// =================================================================================
// 1. CONFIGURATION & UTILS
// =================================================================================
const CATEGORIES = [ { name: 'Work', color: 'var(--color-green)', subCategories: [ { name: 'Programming', regex: /GitHub|Stack Overflow|BitBucket|Gitlab|vim|Spyder|kate|Ghidra|Scite|code|visual studio code|postman|powershell|terminal|cmd|git-bash|neovim|sublime_text|webstorm|intellijidea|eclipse|jupyter-lab/i }, { name: 'Documents', regex: /Google Docs|libreoffice|ReText/i }, { name: 'Image', regex: /GIMP|Inkscape|figma/i }, { name: 'Video', regex: /Kdenlive/i }, { name: 'Audio', regex: /Audacity/i }, { name: '3D', regex: /Blender/i }, { name: 'AI', regex: /Google AI Studio/i }, { name: 'Notes', regex: /Obsidian/i } ] }, { name: 'Media', color: 'var(--color-red)', subCategories: [ { name: 'Games', regex: /Minecraft|RimWorld|steam|epicgameslauncher|league of legends|valorant/i }, { name: 'Video', regex: /YouTube|Plex|VLC|netflix/i }, { name: 'Social Media', regex: /reddit|Facebook|Twitter|Instagram|devRant|tiktok|pinterest/i }, { name: 'Music', regex: /Spotify|Deezer/i } ] }, { name: 'Comms', color: '#03A9F4', subCategories: [ { name: 'IM', regex: /Messenger|Telegram|Signal|WhatsApp|Rambox|Slack|Riot|Element|Discord|Nheko|NeoChat|Mattermost/i }, { name: 'Email', regex: /Gmail|Thunderbird|mutt|alpine/i } ] }, { name: 'General Browsing', color: 'var(--color-blue)', subCategories: [ { name: 'Web Browser', regex: /browser|chrome|firefox|edge|safari|opera/i } ] } ];
const UNCATEGORIZED_CATEGORY = { name: 'Uncategorized', color: 'var(--text-muted)', subCategories: [] };
const ITEMS_PER_PAGE_DETAILED = 15;





const VIEWS = [ { id: 'summary', label: 'Top Applications' }, { id: 'detailed', label: 'Detailed Activity' }, { id: 'charts', label: 'Charts' }, { id: 'productivity', label: 'Productivity' }, { id: 'timeline', label: 'Timeline' } ];
const CHART_SUB_VIEWS = [ { id: 'sunburst', label: 'Category Sunburst' }, { id: 'piechart', label: 'Application Pie Chart' }, { id: 'streamgraph', label: 'Category Streamgraph' }, { id: 'calendar', label: 'Activity Calendar' } ];
const Legend = ({ events, getColorForApp }) => { const legendItems = useMemo(() => { if (!events || events.length === 0) return []; const appSet = new Set(); events.forEach(event => { if (event.data && event.data.app) { appSet.add(event.data.app); } }); return Array.from(appSet).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); }, [events]); if (legendItems.length === 0) return null; const styles = { container: { display: 'flex', flexWrap: 'wrap', gap: '8px 16px', padding: '10px', marginTop: '5px', maxHeight: '80px', overflowY: 'auto', backgroundColor: 'var(--background-primary)', borderRadius: '6px', border: '1px solid var(--background-modifier-border)' }, item: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85em', color: 'var(--text-muted)' }, swatch: { width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0 } }; return dc.preact.h('div', { style: styles.container, 'aria-label': 'Timeline Legend' }, legendItems.map(app => dc.preact.h('div', { key: app, style: styles.item }, dc.preact.h('div', { style: { ...styles.swatch, backgroundColor: getColorForApp(app) } }), dc.preact.h('span', null, app))) ); };

// =================================================================================
// 2. CUSTOM HOOKS
// =================================================================================
const useAppColorGenerator = () => { const appColorsRef = useRef(new Map()); const colorIndexRef = useRef(0); const palette = useMemo(() => [ '#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#00BCD4', '#FF9800', '#795548', '#607D8B', '#E91E63', '#03A9F4', '#8BC34A', '#CDDC39', '#FFEB3B', '#FF5722', '#673AB7', '#3F51B5', '#009688', '#AFB42B', '#FF7043', '#FF4081', '#7C4DFF', '#448AFF', '#00E676' ], []); const getColorForApp = useCallback((appName) => { if (!appName) return '#AAAAAA'; const normalizedAppName = appName.toLowerCase().replace(/\.exe$/, ''); if (!appColorsRef.current.has(normalizedAppName)) { appColorsRef.current.set(normalizedAppName, palette[colorIndexRef.current % palette.length]); colorIndexRef.current++; } return appColorsRef.current.get(normalizedAppName); }, [palette]); return getColorForApp; };
function useActivityData() { const [rawEvents, setRawEvents] = useState({ window: [], afk: [] }); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const fetchActivityData = useCallback(async () => { setLoading(true); setError(null); setRawEvents({ window: [], afk: [] }); try { if (typeof requestUrl !== 'function') throw new Error("`requestUrl` is not available."); const bucketsResponse = await requestUrl({ url: "http://localhost:5600/api/0/buckets/" }); const bucketsData = bucketsResponse.json; const bucketIds = Object.keys(bucketsData); const windowBucketId = bucketIds.find(id => id.startsWith("aw-watcher-window_")); const afkBucketId = bucketIds.find(id => id.startsWith("aw-watcher-afk_")); if (!windowBucketId) throw new Error("Could not find a window watcher bucket."); const params = new URLSearchParams({ limit: '1000000' }).toString(); const eventPromises = [ requestUrl({ url: `http://localhost:5600/api/0/buckets/${windowBucketId}/events?${params}` }) ]; if (afkBucketId) { eventPromises.push(requestUrl({ url: `http://localhost:5600/api/0/buckets/${afkBucketId}/events?${params}` })); } const [windowRes, afkRes] = await Promise.all(eventPromises); const rawWindowEvents = windowRes.json || []; const rawAfkEvents = (afkRes && afkRes.json) || []; setRawEvents({ window: rawWindowEvents, afk: rawAfkEvents }); } catch (err) { console.error("[AW-Dashboard] A critical error occurred:", err); setError(err.message.includes("Failed to fetch") ? "Could not connect to ActivityWatch server." : err.message); } finally { setLoading(false); } }, []); useEffect(() => { fetchActivityData(); }, [fetchActivityData]); return { rawEvents, loading, error, refetch: fetchActivityData }; }

// =================================================================================
// 3. DATA PROCESSING FUNCTIONS (PURE LOGIC)
// =================================================================================
function processActiveEvents(rawEvents, dateRange = null) { if (!rawEvents.window || !rawEvents.window.length) return []; const rangeStartMs = dateRange ? dateRange.start.getTime() : -Infinity; const rangeEndMs = dateRange ? dateRange.end.getTime() : Infinity; const windowEventsInRange = rawEvents.window.filter(e => { const eventStartMs = new Date(e.timestamp).getTime(); const eventEndMs = eventStartMs + e.duration * 1000; return eventStartMs < rangeEndMs && eventEndMs > rangeStartMs; }); const afkEventsInRange = rawEvents.afk.filter(e => { const eventStartMs = new Date(e.timestamp).getTime(); const eventEndMs = eventStartMs + e.duration * 1000; return eventStartMs < rangeEndMs && eventEndMs > rangeStartMs; }); const notAfkPeriods = afkEventsInRange .filter(e => e.data.status === "not-afk") .map(e => ({ start: new Date(e.timestamp).getTime(), end: new Date(e.timestamp).getTime() + e.duration * 1000 })); if (notAfkPeriods.length === 0) { return windowEventsInRange.map(winEvent => { const eventStartMs = new Date(winEvent.timestamp).getTime(); const eventEndMs = eventStartMs + winEvent.duration * 1000; const intersectStartMs = Math.max(eventStartMs, rangeStartMs); const intersectEndMs = Math.min(eventEndMs, rangeEndMs); const finalDuration = (intersectEndMs - intersectStartMs) / 1000; return finalDuration > 0 ? { ...winEvent, duration: finalDuration } : null; }).filter(Boolean); } const processedEvents = windowEventsInRange.flatMap(winEvent => { const originalWinStartMs = new Date(winEvent.timestamp).getTime(); const originalWinEndMs = originalWinStartMs + winEvent.duration * 1000; const eventWithinRangeStartMs = Math.max(originalWinStartMs, rangeStartMs); const eventWithinRangeEndMs = Math.min(originalWinEndMs, rangeEndMs); if (eventWithinRangeStartMs >= eventWithinRangeEndMs) return []; let activeDuration = 0; for (const afkPeriod of notAfkPeriods) { const intersectStartMs = Math.max(eventWithinRangeStartMs, afkPeriod.start); const intersectEndMs = Math.min(eventWithinRangeEndMs, afkPeriod.end); if (intersectStartMs < intersectEndMs) activeDuration += (intersectEndMs - intersectStartMs) / 1000; } return activeDuration > 0 ? [{ ...winEvent, duration: activeDuration }] : []; }); return processedEvents; }
function getClassificationForEvent(event) { const sourceText = `${event.data.app || ''} - ${event.data.title || ''}`; for (const category of CATEGORIES) { for (const subCategory of category.subCategories) { if (subCategory.regex.test(sourceText)) { return { category, subCategory }; } } } return { category: UNCATEGORIZED_CATEGORY, subCategory: null }; }
// In ViewComponent.jsx, replace the existing function with this one.

function aggregateViewData(activeEvents, activeView) {
    if (!activeEvents.length) return [];
    switch (activeView) {
        case 'detailed': {
            const merged = new Map(); activeEvents.forEach(e => { const key = `${e.data.app || 'Unknown'}|${e.data.title || 'No Title'}`; if (merged.has(key)) merged.get(key).duration += e.duration; else merged.set(key, { data: { name: e.data.app, title: e.data.title }, duration: e.duration }); }); return Array.from(merged.values()).sort((a, b) => b.duration - a.duration);
        }
        case 'piechart':
        case 'summary': {
            const merged = new Map();
            activeEvents.forEach(e => {
                const key = e.data.app || 'Unknown';
                if (merged.has(key)) {
                    merged.get(key).duration += e.duration;
                } else {
                    // MODIFIED: Ensure the object has a 'name' property for consistency.
                    merged.set(key, { data: { name: key }, duration: e.duration });
                }
            });
            let sorted = Array.from(merged.values()).sort((a, b) => b.duration - a.duration);
            if (activeView === 'piechart' && sorted.length > 15) {
                const topItems = sorted.slice(0, 14);
                const otherItems = sorted.slice(14);
                const otherDuration = otherItems.reduce((acc, curr) => acc + curr.duration, 0);
                if (otherDuration > 0) {
                    topItems.push({ data: { name: 'Other' }, duration: otherDuration });
                }
                sorted = topItems;
            }
            return sorted;
        }
        case 'productivity':
        case 'sunburst': {
            const categoryTotals = new Map();
            activeEvents.forEach(e => {
                const { category, subCategory } = getClassificationForEvent(e);
                if (!categoryTotals.has(category.name)) {
                    categoryTotals.set(category.name, { name: category.name, color: category.color, duration: 0, subTotals: new Map() });
                }
                const mainCategoryData = categoryTotals.get(category.name);
                mainCategoryData.duration += e.duration;
                if (subCategory) {
                    if (!mainCategoryData.subTotals.has(subCategory.name)) {
                        mainCategoryData.subTotals.set(subCategory.name, { name: subCategory.name, duration: 0 });
                    }
                    mainCategoryData.subTotals.get(subCategory.name).duration += e.duration;
                }
            });
            return Array.from(categoryTotals.values())
                .filter(cat => cat.duration > 0.1)
                .map(cat => ({
                    ...cat,
                    subTotals: Array.from(cat.subTotals.values())
                        .filter(sub => sub.duration > 0.1)
                        .sort((a, b) => b.duration - a.duration)
                }))
                .sort((a, b) => b.duration - a.duration);
        }
        case 'timeline':
            return activeEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        case 'calendar': {
            const dateTotals = new Map();
            activeEvents.forEach(e => {
                const dateKey = new Date(e.timestamp).toISOString().slice(0, 10);
                dateTotals.set(dateKey, (dateTotals.get(dateKey) || 0) + e.duration);
            });
            return Array.from(dateTotals.entries()).map(([date, value]) => ({ date, value }));
        }
        case 'streamgraph': {
             if (activeEvents.length === 0) return [];
    
    const timeBins = new Map();
    const categoryNames = CATEGORIES.map(c => c.name).concat(UNCATEGORIZED_CATEGORY.name);
    
    const earliestTime = new Date(activeEvents[0].timestamp).getTime();
    const latestTime = new Date(activeEvents[activeEvents.length - 1].timestamp).getTime();

    // Create a new Date object for the loop start to avoid modifying the original
    const loopStartTime = new Date(earliestTime);
    loopStartTime.setMinutes(0, 0, 0);

    // Create hourly bins from the start of the first event's hour to the end of the last event's hour
    for (let d = loopStartTime; d.getTime() <= latestTime; d.setHours(d.getHours() + 1)) {
        const bin = { date: new Date(d) };
        categoryNames.forEach(name => bin[name] = 0);
        timeBins.set(d.getTime(), bin);
    }

    activeEvents.forEach(e => {
        const category = getClassificationForEvent(e).category.name;
        
        // Find the hour bin for the event's start time
        const startOfHour = new Date(e.timestamp);
        startOfHour.setMinutes(0, 0, 0);
        
        const bin = timeBins.get(startOfHour.getTime());
        if (bin) {
            // Add the event's full duration to its starting hour's bin
            bin[category] = (bin[category] || 0) + e.duration;
        }
    });
    
    return Array.from(timeBins.values());
        }
        default:
            return [];
    }
}


// =================================================================================
// 4. UI/PRESENTATIONAL COMPONENTS
// =================================================================================
const DashboardHeader = ({ viewDate, rangeSpan, onPrevDay, onNextDay, onToday, onWeek, onRefresh, loading }) => {
    const styles = { header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }, title: { margin: 0, fontSize: '1.5em' }, controls: { display: 'flex', alignItems: 'center', gap: '5px' }, button: { padding: '8px 12px', border: '1px solid var(--background-modifier-border)', borderRadius: '5px', cursor: 'pointer', backgroundColor: 'var(--background-primary)', color: 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0 }, activeButton: { backgroundColor: 'var(--interactive-accent)', color: 'white', borderColor: 'var(--interactive-accent)' }, disabledButton: { opacity: 0.5, cursor: 'not-allowed' } };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const isViewingToday = isSameDay(viewDate, new Date());

    const dateButtonText = useMemo(() => {
        if (isViewingToday) return 'Today';
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (isSameDay(viewDate, yesterday)) return 'Yesterday';
        return viewDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }, [viewDate, isViewingToday]);

    return dc.preact.h('div', { style: styles.header },
        dc.preact.h('h2', { style: styles.title }, 'ActivityWatch Dashboard'),
        dc.preact.h('div', { style: styles.controls },
            dc.preact.h('button', { style: { ...styles.button, padding: '8px 10px' }, onClick: onPrevDay, disabled: loading, title: "Previous Day" }, '‹'),
            dc.preact.h('button', { style: { ...styles.button, ...(rangeSpan === 1 ? styles.activeButton : {}) }, onClick: onToday, disabled: loading }, dateButtonText),
            dc.preact.h('button', { style: { ...styles.button, padding: '8px 10px', ...(isViewingToday ? styles.disabledButton : {}) }, onClick: onNextDay, disabled: loading || isViewingToday, title: "Next Day" }, '›'),
            dc.preact.h('button', { style: { ...styles.button, marginLeft: '10px', ...(rangeSpan === 7 ? styles.activeButton : {}) }, onClick: onWeek, disabled: loading }, 'Last 7 Days'),
            dc.preact.h('button', { style: { ...styles.button, marginLeft: '5px' }, onClick: onRefresh, disabled: loading }, loading ? '...Loading' : '⟳ Refresh')
        )
    );
};
const ViewTabs = ({ views, activeView, setActiveView, loading }) => { const styles = { tabContainer: { display: 'flex', gap: '5px', padding: '4px', backgroundColor: 'var(--background-primary)', borderRadius: '8px', marginBottom: '15px', flexWrap: 'wrap' }, tabButton: { flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 'bold', transition: 'all 0.2s', minWidth: '120px' }, activeTab: { backgroundColor: 'var(--background-modifier-hover)', color: 'var(--text-normal)' }, }; return ( dc.preact.h('div', { style: styles.tabContainer }, views.map(view => dc.preact.h('button', { key: view.id, style: { ...styles.tabButton, ...(activeView === view.id ? styles.activeTab : {}) }, onClick: () => setActiveView(view.id), disabled: loading }, view.label))) ); };
const SubViewTabs = ({ views, activeView, setActiveView, loading }) => { const styles = { tabContainer: { display: 'flex', justifyContent: 'center', gap: '10px', padding: '4px', backgroundColor: 'var(--background-primary-alt, var(--background-secondary))', borderRadius: '8px', marginBottom: '20px', flexWrap: 'wrap', border: '1px solid var(--background-modifier-border)' }, tabButton: { flexGrow: 0, padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 'bold', transition: 'all 0.2s', minWidth: '150px' }, activeTab: { backgroundColor: 'var(--background-modifier-hover)', color: 'var(--text-normal)' }, }; return ( dc.preact.h('div', { style: styles.tabContainer }, views.map(view => dc.preact.h('button', { key: view.id, style: { ...styles.tabButton, ...(activeView === view.id ? styles.activeTab : {}) }, onClick: () => setActiveView(view.id), disabled: loading }, view.label)) ) ); };
const Message = ({ text, type = 'info' }) => { const baseStyle = { textAlign: 'center', padding: '40px 20px', fontStyle: 'italic', borderRadius: '5px' }; const styles = { info: { ...baseStyle, color: 'var(--text-muted)' }, error: { ...baseStyle, fontStyle: 'normal', color: 'var(--text-error)', backgroundColor: 'var(--background-modifier-error-rgb, 255, 0, 0, 0.15)', border: '1px solid var(--text-error)' } }; return dc.preact.h('p', { style: styles[type] }, text); };
const DataListItem = ({ item, maxDuration, colorOverride = null }) => { const { name, title } = item.data; const color = colorOverride || 'var(--interactive-accent)'; const styles = { listItem: { backgroundColor: 'var(--background-primary)', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }, itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, appTitle: { fontWeight: 'bold', fontSize: '1.1em', color: 'var(--text-normal)', wordBreak: 'break-word', flexGrow: 1, minWidth: '0' }, duration: { fontSize: '1.1em', color: 'var(--interactive-accent)', whiteSpace: 'nowrap', marginLeft: '10px' }, progressBarContainer: { width: '100%', backgroundColor: 'var(--background-modifier-border)', borderRadius: '4px', height: '8px', marginTop: '8px', overflow: 'hidden' }, progressBar: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease-out', backgroundColor: color }, }; return dc.preact.h('li', { style: { ...styles.listItem, listStyle: 'none' } }, dc.preact.h('div', { style: styles.itemHeader }, dc.preact.h('span', { style: styles.appTitle }, name || 'Unknown'), dc.preact.h('span', { style: styles.duration }, formatDuration(item.duration))), title && dc.preact.h('div', { style: {fontSize: '0.9em', color: 'var(--text-muted)', wordBreak: 'break-word'} }, title), dc.preact.h('div', { style: styles.progressBarContainer }, dc.preact.h('div', { style: { ...styles.progressBar, width: `${(item.duration / maxDuration) * 100}%` } }))); };
const TimelineControls = ({ onRangeChange }) => { const [startTime, setStartTime] = useState(''); const [endTime, setEndTime] = useState(''); const RELATIVE_RANGES = [ { label: '1h', duration: 3600 }, { label: '3h', duration: 3 * 3600 }, { label: '6h', duration: 6 * 3600 }, { label: '12h', duration: 12 * 3600 }, { label: '24h', duration: 24 * 3600 }, { label: '7d', duration: 7 * 24 * 3600 }, ]; const handleApplyAbsolute = () => { if (startTime && endTime) { onRangeChange({ mode: 'absolute', start: new Date(startTime), end: new Date(endTime) }); } }; const handleResetView = () => { setStartTime(''); setEndTime(''); onRangeChange({ mode: 'relative', duration: 24 * 3600 }); } ; const styles = { container: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: 'var(--background-primary)', borderRadius: '6px', border: '1px solid var(--background-modifier-border)', marginBottom: '15px' }, row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }, label: { fontSize: '0.9em', color: 'var(--text-muted)', minWidth: '80px' }, buttonGroup: { display: 'flex', gap: '5px' }, button: { padding: '6px 12px', border: '1px solid var(--background-modifier-border)', borderRadius: '5px', cursor: 'pointer', backgroundColor: 'var(--background-secondary)', color: 'var(--text-normal)', transition: 'background-color 0.2s' }, applyButton: { backgroundColor: 'var(--interactive-accent)', color: 'white', fontWeight: 'bold' }, input: { backgroundColor: 'var(--background-secondary)', border: '1px solid var(--background-modifier-border)', borderRadius: '5px', padding: '6px 8px', color: 'var(--text-normal)', fontFamily: 'inherit', colorScheme: 'dark' } }; return dc.preact.h('div', { style: styles.container }, dc.preact.h('div', { style: styles.row }, dc.preact.h('span', { style: styles.label }, 'Zoom to Last:'), dc.preact.h('div', { style: styles.buttonGroup }, RELATIVE_RANGES.map(range => dc.preact.h('button', { key: range.label, style: styles.button, onClick: () => onRangeChange({ mode: 'relative', duration: range.duration }) }, range.label)), dc.preact.h('button', {style: {...styles.button, marginLeft: '15px'}, onClick: handleResetView }, 'Reset View'))), dc.preact.h('div', { style: styles.row }, dc.preact.h('span', { style: styles.label }, 'Show from:'), dc.preact.h('input', { type: 'datetime-local', style: styles.input, value: startTime, onChange: e => setStartTime(e.target.value) }), dc.preact.h('span', { style: { color: 'var(--text-muted)'} }, 'to'), dc.preact.h('input', { type: 'datetime-local', style: styles.input, value: endTime, onChange: e => setEndTime(e.target.value) }), dc.preact.h('button', { style: { ...styles.button, ...styles.applyButton }, onClick: handleApplyAbsolute }, 'Apply'))); };
const TimelineView = ({ events, getColorForApp, timelineRange }) => { const canvasRef = useRef(null); const containerRef = useRef(null); const [scale, setScale] = useState(1.0); const [panX, setPanX] = useState(0); const [hoveredEvent, setHoveredEvent] = useState(null); const hoveredEventRef = useRef(null); const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 }); const [isPanning, setIsPanning] = useState(false); const panStartRef = useRef({ x: 0 }); const OVERSCROLL_PX = 50; const useTimelineBounds = (timelineRange) => useMemo(() => { if (!timelineRange) return { minTimeS: 0, maxTimeS: 0 }; let startMs, endMs; if (timelineRange.mode === 'relative') { endMs = new Date().getTime(); startMs = endMs - timelineRange.duration * 1000; } else { startMs = timelineRange.start.getTime(); endMs = timelineRange.end.getTime(); } return { minTimeS: startMs / 1000, maxTimeS: endMs / 1000 }; }, [timelineRange]); const { minTimeS, maxTimeS } = useTimelineBounds(timelineRange); useEffect(() => { const canvas = canvasRef.current; if (!canvas || !timelineRange) return; const canvasWidth = canvas.getBoundingClientRect().width; if (canvasWidth === 0) return; const durationInSeconds = maxTimeS - minTimeS; if (durationInSeconds <= 0) { setScale(1.0); setPanX(0); return; } const newScale = canvasWidth / durationInSeconds; const newPanX = -minTimeS * newScale; setScale(newScale); setPanX(newPanX); }, [timelineRange, minTimeS, maxTimeS]); const draw = useCallback(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect(); if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) { canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; } ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const currentScale = scale; const currentPanX = panX; const BAR_HEIGHT = 28; const PADDING_TOP = 15; const PADDING_BOTTOM = 35; const TIME_LABEL_HEIGHT = 15; ctx.clearRect(0, 0, rect.width, rect.height); for (const event of events) { const eventStartSeconds = new Date(event.timestamp).getTime() / 1000; const x = eventStartSeconds * currentScale + currentPanX; const width = event.duration * currentScale; if (x + width < 0 || x > rect.width) continue; ctx.fillStyle = getColorForApp(event.data.app); ctx.fillRect(x, PADDING_TOP, Math.max(0.5, width), BAR_HEIGHT); if (hoveredEventRef.current === event) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, PADDING_TOP + 1, Math.max(0.5, width) - 2, BAR_HEIGHT - 2); } } ctx.strokeStyle = 'var(--background-modifier-border)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, rect.height - PADDING_BOTTOM); ctx.lineTo(rect.width, rect.height - PADDING_BOTTOM); ctx.stroke(); const visibleStartSeconds = -currentPanX / currentScale; const visibleEndSeconds = (rect.width - currentPanX) / currentScale; const getStartOfDay = (d) => { const D = new Date(d); D.setHours(0, 0, 0, 0); return D; }; const getStartOfWeek = (d) => { const D = getStartOfDay(d); D.setDate(D.getDate() - D.getDay()); return D; }; const getStartOfMonth = (d) => { const D = getStartOfDay(d); D.setDate(1); return D; }; const getStartOfYear = (d) => new Date(d.getFullYear(), 0, 1); const ONE_MINUTE_S = 60; const ONE_HOUR_S = 3600; const ONE_DAY_S = 86400; const ONE_WEEK_S = 7 * ONE_DAY_S; const TICK_GENERATORS = [ { unit: 'minute', interval: 15 * ONE_MINUTE_S, minSpacingPx: 70, format: d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }, { unit: 'hour', interval: ONE_HOUR_S, minSpacingPx: 65, format: d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }, { unit: 'hour', interval: 3 * ONE_HOUR_S, minSpacingPx: 80, format: d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }, { unit: 'day', interval: ONE_DAY_S, minSpacingPx: 80, format: d => d.toLocaleDateString([], { month: 'short', day: 'numeric' }) }, { unit: 'week', interval: ONE_WEEK_S, minSpacingPx: 100, format: d => `Week of ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}` }, { unit: 'month', interval: 30 * ONE_DAY_S, minSpacingPx: 120, format: d => d.toLocaleDateString([], { month: 'long', year: 'numeric' }) }, { unit: 'year', interval: 365.25 * ONE_DAY_S, minSpacingPx: 150, format: d => d.toLocaleDateString([], { year: 'numeric' }) }, ]; let bestGenerator = TICK_GENERATORS[TICK_GENERATORS.length - 1]; for (const generator of TICK_GENERATORS) { if (generator.interval * currentScale > generator.minSpacingPx) { bestGenerator = generator; break; } } ctx.font = `${TIME_LABEL_HEIGHT * 0.8}px sans-serif`; ctx.textAlign = 'center'; const visibleStartDate = new Date(visibleStartSeconds * 1000); let firstTickDate; if (bestGenerator.unit === 'year') { firstTickDate = getStartOfYear(visibleStartDate); } else if (bestGenerator.unit === 'month') { firstTickDate = getStartOfMonth(visibleStartDate); } else if (bestGenerator.unit === 'week') { firstTickDate = getStartOfWeek(visibleStartDate); } else { const firstTickS = Math.ceil(visibleStartSeconds / bestGenerator.interval) * bestGenerator.interval; firstTickDate = new Date(firstTickS * 1000); } for (let d = firstTickDate; d.getTime() / 1000 <= visibleEndSeconds; ) { const tickSeconds = d.getTime() / 1000; const x = tickSeconds * currentScale + currentPanX; if (x > 15 && x < rect.width - 15) { const isMidnight = d.getHours() === 0 && d.getMinutes() === 0; let isDayMarker = false; if (bestGenerator.unit === 'hour' && isMidnight) isDayMarker = true; ctx.fillStyle = isDayMarker ? 'var(--text-accent)' : 'var(--text-muted)'; ctx.font = isDayMarker ? `bold ${TIME_LABEL_HEIGHT * 0.85}px sans-serif` : `${TIME_LABEL_HEIGHT * 0.8}px sans-serif`; const labelText = isDayMarker ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : bestGenerator.format(d); ctx.fillText(labelText, x, rect.height - PADDING_BOTTOM + TIME_LABEL_HEIGHT + 5); } if (bestGenerator.unit === 'year') d.setFullYear(d.getFullYear() + 1); else if (bestGenerator.unit === 'month') d.setMonth(d.getMonth() + 1); else if (bestGenerator.unit === 'week') d.setDate(d.getDate() + 7); else d.setTime(d.getTime() + bestGenerator.interval * 1000); } }, [events, getColorForApp, scale, panX]); useEffect(() => { let animationFrameId; const renderLoop = () => { draw(); animationFrameId = requestAnimationFrame(renderLoop); }; renderLoop(); return () => cancelAnimationFrame(animationFrameId); }, [draw]); const handleWheel = useCallback((e) => { e.preventDefault(); const rect = canvasRef.current.getBoundingClientRect(); if (rect.width === 0) return; const mouseX = e.clientX - rect.left; const currentScale = scale; const currentPanX = panX; const ZOOM_OUT_LIMIT_FACTOR = 1.2; const viewportDuration = maxTimeS - minTimeS; const minScale = viewportDuration > 0 ? (rect.width / (viewportDuration * ZOOM_OUT_LIMIT_FACTOR)) : 1; if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) { const zoomFactor = e.deltaY < 0 ? 1.2 : 1 / 1.2; let newScale = Math.min(currentScale * zoomFactor, 10000); newScale = Math.max(newScale, minScale); let newPanX = mouseX - (mouseX - currentPanX) * (newScale / currentScale); const maxPan = OVERSCROLL_PX - (minTimeS * newScale); const minPan = (rect.width - OVERSCROLL_PX) - (maxTimeS * newScale); newPanX = Math.max(minPan, Math.min(maxPan, newPanX)); setScale(newScale); setPanX(newPanX); } else { let newPanX = currentPanX - e.deltaX; const maxPan = OVERSCROLL_PX - (minTimeS * currentScale); const minPan = (rect.width - OVERSCROLL_PX) - (maxTimeS * currentScale); newPanX = Math.max(minPan, Math.min(maxPan, newPanX)); setPanX(newPanX); } }, [scale, panX, minTimeS, maxTimeS]); const handlePanMove = useCallback((e) => { if (!isPanning) return; const rect = canvasRef.current.getBoundingClientRect(); const currentScale = scale; const dx = e.clientX - panStartRef.current.x; setPanX(p => { const newPanX = p + dx; const maxPan = OVERSCROLL_PX - (minTimeS * currentScale); const minPan = (rect.width - OVERSCROLL_PX) - (maxTimeS * currentScale); return Math.max(minPan, Math.min(maxPan, newPanX)); }); panStartRef.current.x = e.clientX; }, [isPanning, scale, minTimeS, maxTimeS]); const handlePanEnd = useCallback(() => { setIsPanning(false); window.removeEventListener('mousemove', handlePanMove); window.removeEventListener('mouseup', handlePanEnd); }, [handlePanMove]); const handlePanStart = useCallback((e) => { if (e.button !== 0) return; e.preventDefault(); setIsPanning(true); panStartRef.current.x = e.clientX; window.addEventListener('mousemove', handlePanMove); window.addEventListener('mouseup', handlePanEnd); }, [handlePanMove, handlePanEnd]); const handleMouseMove = useCallback((e) => { if (isPanning) return; const canvasRect = canvasRef.current.getBoundingClientRect(); const mouseXRelativeToCanvas = e.clientX - canvasRect.left; const mouseYRelativeToCanvas = e.clientY - canvasRect.top; const BAR_TOP_OFFSET = 15; const BAR_HEIGHT = 28; const BAR_BOTTOM_OFFSET = BAR_TOP_OFFSET + BAR_HEIGHT; if (mouseYRelativeToCanvas < BAR_TOP_OFFSET || mouseYRelativeToCanvas > BAR_BOTTOM_OFFSET) { if (hoveredEvent) { setHoveredEvent(null); hoveredEventRef.current = null; } return; } const timeAtCursor = (mouseXRelativeToCanvas - panX) / scale; let foundEvent = null; for (let i = events.length - 1; i >= 0; i--) { const event = events[i]; const eventStartSeconds = new Date(event.timestamp).getTime() / 1000; const eventEndSeconds = eventStartSeconds + event.duration; if (timeAtCursor >= eventStartSeconds && timeAtCursor <= eventEndSeconds) { foundEvent = event; break; } } if (hoveredEventRef.current !== foundEvent) { setHoveredEvent(foundEvent); hoveredEventRef.current = foundEvent; } if (foundEvent) { const parentContainerRect = containerRef.current.getBoundingClientRect(); setTooltipPos({ x: e.clientX - parentContainerRect.left, y: e.clientY - parentContainerRect.top }); } }, [isPanning, events, getColorForApp, scale, panX]); const handleMouseLeave = useCallback(() => { setHoveredEvent(null); hoveredEventRef.current = null; }, []); if (!events || events.length === 0) { return dc.preact.h('p', { style: { textAlign: 'center', color: 'var(--text-muted)', padding: '20px' } }, 'No activity data available for the timeline.'); } let tooltipContent = null; if (hoveredEvent) { const startTime = new Date(hoveredEvent.timestamp); const endTime = new Date(startTime.getTime() + hoveredEvent.duration * 1000); tooltipContent = dc.preact.h('div', { style: { position: 'absolute', left: `${tooltipPos.x + 15}px`, top: `${tooltipPos.y + 15}px`, background: 'var(--background-secondary-alt)', border: '1px solid var(--background-modifier-border)', borderRadius: '6px', padding: '10px 14px', zIndex: 10000, pointerEvents: 'none', color: 'var(--text-normal)', fontSize: '0.9em', maxWidth: '320px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', opacity: 1, display: 'flex', flexDirection: 'column', gap: '5px' } }, dc.preact.h('div', { style: { fontWeight: 'bold', fontSize: '1.05em' } }, hoveredEvent.data.app || 'Unknown'), dc.preact.h('div', { style: { color: 'var(--interactive-accent)', fontSize: '1.2em', fontWeight: 'bold', margin: '4px 0' } }, formatDuration(hoveredEvent.duration)), hoveredEvent.data.title && dc.preact.h('div', { style: { fontStyle: 'italic', color: 'var(--text-faint)', borderTop: '1px solid var(--background-modifier-border)', paddingTop: '6px', marginTop: '2px' } }, hoveredEvent.data.title), dc.preact.h('div', { style: { color: 'var(--text-muted)', fontSize: '0.85em', marginTop: '4px' } }, `From: ${formatTime(startTime)} to ${formatTime(endTime)}`) ); } return dc.preact.h('div', { ref: containerRef, style: { position: 'relative' } }, dc.preact.h('canvas', { ref: canvasRef, style: { width: '100%', height: '100%', display: 'block' }, onWheel: handleWheel, onMouseDown: handlePanStart, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave, }), tooltipContent, dc.preact.h(Legend, { events, getColorForApp }) ); };


// =================================================================================
// 5. VIEW COMPONENTS (Composing UI components for a specific view)
// =================================================================================

// MODIFIED: This component is now defined in the top-level scope.
const DataListView = ({ items, activeView, colorProp }) => {
    const styles = { list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }};
    const maxDuration = items.length > 0 ? Math.max(...items.map(item => item.duration || 0)) : 1;
    return dc.preact.h('ul', { style: styles.list }, items.map((item, index) => dc.preact.h(DataListItem, { 
        key: `${item.data.app || item.data.name}-${item.data.title || ''}-${index}`, 
        item: { data: item.data || item, duration: item.duration }, 
        maxDuration, 
        colorOverride: item.color || (item.data && item.data.color) 
    })));
};

const DetailedView = ({ data }) => { const [searchTerm, setSearchTerm] = useState(''); const [currentPage, setCurrentPage] = useState(1); const filteredAndPaginatedData = useMemo(() => { const lowercasedSearchTerm = searchTerm.toLowerCase(); const filteredData = data.filter(item => (item.data.app || '').toLowerCase().includes(lowercasedSearchTerm) || (item.data.title || '').toLowerCase().includes(lowercasedSearchTerm)); const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE_DETAILED); const startIndex = (currentPage - 1) * ITEMS_PER_PAGE_DETAILED; const dataToShow = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE_DETAILED); return { dataToShow, totalPages }; }, [data, searchTerm, currentPage]); const { dataToShow, totalPages } = filteredAndPaginatedData; const styles = { detailsControlsContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }, searchInput: { flexGrow: 1, backgroundColor: 'var(--background-primary)', border: '1px solid var(--background-modifier-border)', borderRadius: '5px', padding: '8px 10px', color: 'var(--text-normal)', fontSize: '0.9em', minWidth: '200px' }, paginationContainer: { display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }, paginationButton: { padding: '6px 10px', border: '1px solid var(--background-modifier-border)', borderRadius: '5px', cursor: 'pointer', backgroundColor: 'var(--background-secondary)', color: 'var(--text-normal)', transition: 'background-color 0.2s' }, paginationButtonDisabled: { cursor: 'not-allowed', opacity: 0.5 } }; return dc.preact.h('div', null, dc.preact.h('div', { style: styles.detailsControlsContainer }, dc.preact.h('input', { type: 'text', placeholder: 'Filter by app or window title...', style: styles.searchInput, value: searchTerm, onChange: e => { setSearchTerm(e.target.value); setCurrentPage(1); } }), totalPages > 1 && dc.preact.h('div', { style: styles.paginationContainer }, dc.preact.h('button', { style: { ...styles.paginationButton, ...(currentPage === 1 ? styles.paginationButtonDisabled : {}) }, onClick: () => setCurrentPage(p => p - 1), disabled: currentPage === 1 }, 'Prev'), dc.preact.h('span', null, `Page ${currentPage} of ${totalPages}`), dc.preact.h('button', { style: { ...styles.paginationButton, ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}) }, onClick: () => setCurrentPage(p => p + 1), disabled: currentPage === totalPages }, 'Next'))), dataToShow.length > 0 ? dc.preact.h(DataListView, { items: dataToShow, activeView: 'detailed' }) : dc.preact.h(Message, { text: 'No activities match your filter.' }) ); };
const ExpandedCategoryDetails = ({ subTotals, parentDuration, parentColor }) => { const styles = { container: { marginTop: '10px', paddingLeft: '25px', borderLeft: '3px solid var(--background-modifier-border)', display: 'flex', flexDirection: 'column', gap: '8px' } }; return dc.preact.h('div', { style: styles.container }, subTotals.map(subItem => dc.preact.h(DataListItem, { key: subItem.name, item: { data: { name: subItem.name }, duration: subItem.duration }, maxDuration: parentDuration, colorOverride: parentColor }))); };
const ProductivityView = ({ items, expandedCategory, setExpandedCategory }) => { const styles = { list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }, itemWrapper: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }, icon: { color: 'var(--text-muted)', width: '15px', textAlign: 'center', transition: 'transform 0.2s' }, expandedIcon: { transform: 'rotate(90deg)' }, dataItemContainer: { flex: 1 } }; const maxDuration = items.length > 0 ? Math.max(...items.map(item => item.duration || 0)) : 1; return dc.preact.h('ul', { style: styles.list }, items.map(category => { const isExpanded = expandedCategory === category.name; const handleToggle = () => setExpandedCategory(isExpanded ? null : category.name); return dc.preact.h('li', { key: category.name }, dc.preact.h('div', { style: styles.itemWrapper, onClick: handleToggle }, dc.preact.h('span', { style: { ...styles.icon, ...(isExpanded ? styles.expandedIcon : {}) } }, '▶'), dc.preact.h('div', { style: styles.dataItemContainer }, dc.preact.h(DataListItem, { item: { data: { name: category.name }, duration: category.duration }, maxDuration: maxDuration, colorOverride: category.color }))), isExpanded && category.subTotals.length > 0 && dc.preact.h(ExpandedCategoryDetails, { subTotals: category.subTotals, parentDuration: category.duration, parentColor: category.color })); })); };


// =================================================================================
// 6. MAIN CONTAINER COMPONENT
// =================================================================================

function ActivityWatchDashboard() {
    const [activeView, setActiveView] = useState('charts');
    const [activeChartSubType, setActiveChartSubType] = useState('sunburst');
    const [timelineRange, setTimelineRange] = useState({ mode: 'relative', duration: 24 * 3600 });
    const [expandedCategory, setExpandedCategory] = useState(null);
    const { rawEvents, loading, error, refetch } = useActivityData();
    
    // --- MODIFIED: New state for date range control ---
    const [viewDate, setViewDate] = useState(new Date());
    const [rangeSpan, setRangeSpan] = useState(1); // 1 for day, 7 for week

    // --- MODIFIED: Date range calculation logic ---
    const activeEventsForMainViews = useMemo(() => {
        if (!rawEvents.window.length) return [];
        
        const getDateRangeForView = (date, span) => {
            const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
            const end = new Date(date);
            const start = new Date(date);
            start.setDate(start.getDate() - (span - 1));
            start.setHours(0, 0, 0, 0);
            
            const today = new Date();
            if (isSameDay(end, today)) {
                 return { start, end: today };
            }
            
            end.setHours(23, 59, 59, 999);
            return { start, end };
        };
        
        const { start, end } = getDateRangeForView(viewDate, rangeSpan);
        return processActiveEvents(rawEvents, { start, end });
    }, [rawEvents, viewDate, rangeSpan]);

    const allActiveEventsForTimeline = useMemo(() => {
        return processActiveEvents(rawEvents).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }, [rawEvents]);

    const viewData = useMemo(() => {
        const aggregationType = activeView === 'charts' ? activeChartSubType : activeView;
        const sourceData = ['calendar', 'streamgraph', 'timeline'].includes(aggregationType)
            ? allActiveEventsForTimeline
            : activeEventsForMainViews;
        return aggregateViewData(sourceData, aggregationType);
    }, [activeView, activeChartSubType, activeEventsForMainViews, allActiveEventsForTimeline]);

    const getColorForApp = useAppColorGenerator();
    
    // --- MODIFIED: New handlers for date navigation ---
    const goToPrevDay = useCallback(() => {
        if (loading) return;
        setViewDate(d => {
            const newDate = new Date(d);
            newDate.setDate(newDate.getDate() - 1);
            return newDate;
        });
        setRangeSpan(1);
    }, [loading]);

    const goToNextDay = useCallback(() => {
        if (loading) return;
        setViewDate(d => {
            const newDate = new Date(d);
            newDate.setDate(newDate.getDate() + 1);
            return newDate;
        });
        setRangeSpan(1);
    }, [loading]);

    const goToToday = useCallback(() => {
        if (loading) return;
        setViewDate(new Date());
        setRangeSpan(1);
    }, [loading]);

    const setWeekView = useCallback(() => {
        if (loading) return;
        setViewDate(new Date());
        setRangeSpan(7);
    }, [loading]);
    
    useEffect(() => { if (activeView !== 'productivity') setExpandedCategory(null); }, [activeView]);
    
    // --- MODIFIED: This effect now syncs the timeline view to the main date range ---
    useEffect(() => {
        if (activeView === 'timeline') {
            const end = new Date(viewDate);
            end.setHours(23, 59, 59, 999);
            
            const start = new Date(viewDate);
            start.setDate(start.getDate() - (rangeSpan - 1));
            start.setHours(0, 0, 0, 0);

            setTimelineRange({ mode: 'absolute', start, end });
        }
    }, [activeView, viewDate, rangeSpan]);

    const dashboardContainerRef = useRef(null);
    const originalParentRefForWindow = useRef(null);
    const originalParentRefForPiP = useRef(null);
    const screenModeHelperRef = useRef(null);
    const isDarkMode = document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const renderContent = () => {
        if (loading) return dc.preact.h(Message, { text: "Loading data..." });
        if (error) return dc.preact.h(Message, { text: error, type: "error" });

        const isDataEmptyForCurrentView = viewData.length === 0 && !['timeline', 'charts'].includes(activeView);
        const isChartDataEmpty = activeView === 'charts' && viewData.length === 0 && !['calendar', 'streamgraph'].includes(activeChartSubType);
        
        if (isDataEmptyForCurrentView || isChartDataEmpty) {
            return dc.preact.h(Message, { text: "No activity data found for this period." });
        }

        switch (activeView) {
            case 'timeline':
                return dc.preact.h(TimelineView, { events: viewData, getColorForApp: getColorForApp, timelineRange: timelineRange });
            
            case 'charts': {
                const renderActiveChart = () => {
                     if (activeChartSubType === 'sunburst') {
                         return dc.preact.h(SunburstChartView, { data: viewData, formatDuration: formatDuration });
                     }
                     if (activeChartSubType === 'piechart') {
                         return dc.preact.h(PieChartView, { data: viewData, getColorForApp: getColorForApp, formatDuration: formatDuration });
                     }
                     if (activeChartSubType === 'calendar') {
                         return dc.preact.h(CalendarHeatmapView, { data: viewData, formatDuration: formatDuration });
                     }
                     if (activeChartSubType === 'streamgraph') {
                         return dc.preact.h(StreamgraphView, { data: viewData, categories: CATEGORIES.concat(UNCATEGORIZED_CATEGORY), formatDuration: formatDuration });
                     }
                     return null;
                };
                
                return dc.preact.h(dc.preact.Fragment, null,
                    dc.preact.h(SubViewTabs, { 
                        views: CHART_SUB_VIEWS, 
                        activeView: activeChartSubType, 
                        setActiveView: setActiveChartSubType, 
                        loading: loading 
                    }),
                    renderActiveChart()
                );
            }
            
            case 'detailed':
                return dc.preact.h(DetailedView, { data: viewData });
            // MODIFIED: This now correctly calls the top-level DataListView component
            case 'summary':
                return dc.preact.h(DataListView, { items: viewData });
            case 'productivity':
                return dc.preact.h(ProductivityView, { 
                           items: viewData, 
                           expandedCategory: expandedCategory,
                           setExpandedCategory: setExpandedCategory
                       });
            default:
                return null;
        }
    };

   return (
        dc.preact.h('div', { ref: dashboardContainerRef, style: { fontFamily: 'sans-serif', backgroundColor: 'var(--background-secondary)', padding: '20px', borderRadius: '8px', color: 'var(--text-normal)', position: 'relative', margin: '33px' } },
            dc.preact.h(DashboardHeader, { 
                viewDate: viewDate,
                rangeSpan: rangeSpan,
                onPrevDay: goToPrevDay,
                onNextDay: goToNextDay,
                onToday: goToToday,
                onWeek: setWeekView,
                onRefresh: refetch, 
                loading: loading 
            }),
            dc.preact.h(ViewTabs, { views: VIEWS, activeView: activeView, setActiveView: setActiveView, loading: loading }),
            activeView === 'timeline' && !loading && !error && dc.preact.h(TimelineControls, { onRangeChange: setTimelineRange }),
            renderContent(),
            dc.preact.h(ScreenModeHelper, { containerRef: dashboardContainerRef, helperRef: screenModeHelperRef, originalParentRefForWindow: originalParentRefForWindow, originalParentRefForPiP: originalParentRefForPiP, allowedScreenModes: ["fullTab", "window"], engine: null, AppComponent: null, isDarkMode: isDarkMode, fullscreenPadding: 33 })
        )
    );
}

return { ActivityWatchDashboard };
```



# PieChartView

```jsx
// PieChartView.jsx
const { useState, useEffect, useMemo, useRef } = dc;

// --- CenterInfo component is unchanged ---
function CenterInfo({ hoveredData, totalDuration, formatDuration }) {
    const styles = {
        container: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', color: 'var(--text-normal)', width: '60%' },
        primaryText: { fontSize: '2em', fontWeight: 'bold', color: 'var(--interactive-accent)', lineHeight: 1.2, wordBreak: 'break-word', },
        secondaryText: { fontSize: '0.8em', color: 'var(--text-muted)', marginTop: '5px' },
        appName: { fontSize: '1.4em', fontWeight: 'bold', color: 'var(--text-normal)', lineHeight: 1.2, wordBreak: 'break-word', }
    };

    if (hoveredData) {
        const percentage = (hoveredData.value / totalDuration * 100).toFixed(1);
        return dc.preact.h('div', { style: styles.container },
            dc.preact.h('div', { style: styles.appName }, hoveredData.name),
            dc.preact.h('div', { style: styles.primaryText }, formatDuration(hoveredData.value)),
            dc.preact.h('div', { style: styles.secondaryText }, `(${percentage}%)`)
        );
    }

    return dc.preact.h('div', { style: styles.container },
        dc.preact.h('div', { style: styles.primaryText }, formatDuration(totalDuration)),
        dc.preact.h('div', { style: styles.secondaryText }, 'Total Time')
    );
}

function PieChartView({ data, getColorForApp, formatDuration }) {
    const chartRef = useRef(null);
    const [hoveredData, setHoveredData] = useState(null);

    const { chartData, totalDuration } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], totalDuration: 0 };
        // MODIFIED: Look inside item.data for the name, matching the aggregator's structure.
        const mappedData = data.map(item => ({ name: item.data.name || 'Unknown', value: item.duration }));
        const total = mappedData.reduce((sum, item) => sum + item.value, 0);
        return { chartData: mappedData, totalDuration: total };
    }, [data]);

    function loadD3() {
        const D3_URL = "https://d3js.org/d3.v7.min.js";
        if (!window._d3_loader_promise) {
            window._d3_loader_promise = new Promise((resolve, reject) => {
                if (window.d3) return resolve(window.d3);
                const script = document.createElement("script");
                script.src = D3_URL;
                script.async = true;
                script.onload = () => resolve(window.d3);
                script.onerror = (err) => reject(err);
                document.head.appendChild(script);
            });
        }
        return window._d3_loader_promise;
    }

    useEffect(() => {
        if (!chartRef.current) return;
        if (chartData.length === 0) {
            if (window.d3) window.d3.select(chartRef.current).selectAll("*").remove();
            return;
        }
        
        let isMounted = true;

        loadD3()
            .then(d3 => {
                if (isMounted) renderGraph(d3);
            })
            .catch(error => {
                console.error("[AW-Dashboard] Pie Chart Error:", error);
                if (isMounted) chartRef.current.innerText = "Error: Could not render chart.";
            });

        return () => { isMounted = false; };
    }, [chartData, totalDuration, getColorForApp, formatDuration]);

    function renderGraph(d3) {
        const width = 450, height = 450, margin = 10;
        const radius = Math.min(width, height) / 2 - margin;
        const innerRadius = radius * 0.65;
        const startAngleRad = -Math.PI / 2; 

        d3.select(chartRef.current).selectAll("*").remove();

        const svg = d3.select(chartRef.current).append("svg")
            .attr("width", "100%").attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);
            
        svg.on("mouseleave", () => setHoveredData(null));

        const pie = d3.pie().value(d => d.value).sort(null).startAngle(startAngleRad).endAngle(startAngleRad + 2 * Math.PI);
        const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);
        const arcHover = d3.arc().innerRadius(innerRadius).outerRadius(radius * 1.05);

        const path = svg.selectAll("path").data(pie(chartData)).join("path")
            .attr("fill", d => getColorForApp(d.data.name))
            .attr("stroke", "var(--background-secondary)")
            .style("stroke-width", "3px").style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                setHoveredData(d.data);
                d3.select(this).transition().duration(150).attr("d", arcHover);
            })
            .on("mouseout", function() {
                d3.select(this).transition().duration(150).attr("d", arc);
            });
            
        path.transition().duration(1000).ease(d3.easeCubicOut)
            .attrTween("d", function(d) {
                const i = d3.interpolate({ startAngle: startAngleRad, endAngle: startAngleRad }, d);
                return function(t) { return arc(i(t)); };
            });
    }

    return dc.preact.h('div', {
        style: { display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '450px' }
    },
        dc.preact.h('div', { ref: chartRef, style: { width: '100%', maxWidth: '450px' } }),
        dc.preact.h(CenterInfo, { hoveredData, totalDuration, formatDuration })
    );
}

return { PieChartView };
```


# StreamgraphView

```jsx
// StreamgraphView.jsx
const { useState, useEffect, useRef } = dc;

function StreamgraphView({ data, categories, formatDuration }) {
    const chartRef = useRef(null);
    const tooltipRef = useRef(null);

    function loadD3() {
        const D3_URL = "https://d3js.org/d3.v7.min.js";
        if (!window._d3_loader_promise) {
            window._d3_loader_promise = new Promise((resolve, reject) => {
                if (window.d3) return resolve(window.d3);
                const script = document.createElement("script");
                script.src = D3_URL; script.async = true;
                script.onload = () => resolve(window.d3);
                script.onerror = (err) => reject(err);
                document.head.appendChild(script);
            });
        }
        return window._d3_loader_promise;
    }

    useEffect(() => {
        if (!chartRef.current || !data || data.length === 0) {
            if (chartRef.current) chartRef.current.innerHTML = "";
            return;
        }

        let isMounted = true;
        loadD3()
            .then(d3 => {
                if (isMounted) renderGraph(d3);
            })
            .catch(error => {
                console.error("[AW-Dashboard] Streamgraph Error:", error);
                if (isMounted) chartRef.current.innerText = "Error: Could not render chart.";
            });

        return () => { isMounted = false; };
    }, [data, categories, formatDuration]);

    function renderGraph(d3) {
        const margin = { top: 20, right: 30, bottom: 50, left: 60 };
        const width = chartRef.current.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        d3.select(chartRef.current).selectAll("*").remove();

        const svg = d3.select(chartRef.current).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const keys = categories.map(c => c.name);
        const color = d3.scaleOrdinal().domain(keys).range(categories.map(c => c.color));
        const stack = d3.stack().keys(keys).order(d3.stackOrderInsideOut).offset(d3.stackOffsetWiggle);
        const series = stack(data);

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([d3.min(series, d => d3.min(d, d => d[0])), d3.max(series, d => d3.max(d, d => d[1]))])
            .range([height, 0]);

        const area = d3.area()
            .x(d => x(d.data.date))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
            .curve(d3.curveBasis);

        const path = svg.append("g").selectAll("path")
            .data(series).join("path")
            .attr("fill", d => color(d.key))
            .attr("d", area)
            .style("cursor", "pointer");
            
        // Tooltip setup
        const tooltip = d3.select(tooltipRef.current);
        const bisectDate = d3.bisector(d => d.date).left;

        path.on("mousemove", function (event, d) {
            const [xPos] = d3.pointer(event);
            const date = x.invert(xPos);
            const dataIndex = bisectDate(data, date, 1);
            const d0 = data[dataIndex - 1];
            const d1 = data[dataIndex];
            const pointData = (d1 && (date - d0.date > d1.date - date)) ? d1 : d0;
            const duration = pointData[d.key] || 0;

            tooltip.style("opacity", 0.9)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 28}px`);

            tooltip.select(".tooltip-header").html(d.key);
            tooltip.select(".tooltip-duration").html(formatDuration(duration));
            tooltip.select(".tooltip-date").html(d3.timeFormat("%a %b %d, %-I %p")(pointData.date));
        }).on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(d3.timeHour.every(6)).tickFormat(d3.timeFormat("%b %d, %-I%p")))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

        svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => `${Math.round(d/60)}m`));
    }

    const tooltipStyle = {
        position: 'fixed', opacity: 0, pointerEvents: 'none', background: 'var(--background-secondary-alt)',
        border: '1px solid var(--background-modifier-border)', borderRadius: '6px', padding: '10px',
        color: 'var(--text-normal)', zIndex: 10, transition: 'opacity 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    };

    return dc.preact.h('div', { style: { width: '100%', overflowX: 'auto' } },
        dc.preact.h('div', { ref: chartRef, style: { minWidth: '800px' } }),
        dc.preact.h('div', { ref: tooltipRef, style: tooltipStyle },
            dc.preact.h('div', { class: 'tooltip-header', style: { fontWeight: 'bold', marginBottom: '5px' } }),
            dc.preact.h('div', { class: 'tooltip-duration', style: { fontSize: '1.2em', color: 'var(--interactive-accent)' } }),
            dc.preact.h('div', { class: 'tooltip-date', style: { fontSize: '0.8em', color: 'var(--text-muted)', marginTop: '5px' } })
        )
    );
}

return { StreamgraphView };
```



# CalendarHeatmapView

```jsx
// CalendarHeatmapView.jsx
const { useState, useEffect, useRef, useMemo } = dc;

function CalendarHeatmapView({ data, formatDuration }) {
    const chartRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    function loadD3() {
        const D3_URL = "https://d3js.org/d3.v7.min.js";
        if (!window._d3_loader_promise) {
            window._d3_loader_promise = new Promise((resolve, reject) => {
                if (window.d3) return resolve(window.d3);
                const script = document.createElement("script");
                script.src = D3_URL; script.async = true;
                script.onload = () => resolve(window.d3);
                script.onerror = (err) => reject(err);
                document.head.appendChild(script);
            });
        }
        return window._d3_loader_promise;
    }

    const dataMap = useMemo(() => {
        const map = new Map();
        if (!data) return map;
        for (const item of data) {
            map.set(item.date, item.value);
        }
        return map;
    }, [data]);

    useEffect(() => {
        if (!chartRef.current) return;
        
        let isMounted = true;
        loadD3()
            .then(d3 => {
                if (isMounted) renderGraph(d3);
            })
            .catch(error => {
                console.error("[AW-Dashboard] Heatmap Error:", error);
                if (isMounted) chartRef.current.innerText = "Error: Could not render chart.";
            });

        return () => { isMounted = false; };
    }, [dataMap, formatDuration]);

    function renderGraph(d3) {
        const cellSize = 15;
        const width = 960;
        const height = cellSize * 9;
        
        d3.select(chartRef.current).selectAll("*").remove();

        const svg = d3.select(chartRef.current).append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("font-family", "sans-serif").attr("font-size", 10);

        const today = new Date();
        const yearAgo = d3.timeDay.offset(today, -365);
        const dates = d3.timeDays(yearAgo, today);
        const maxDuration = d3.max(Array.from(dataMap.values())) || 1;
        
        // MODIFIED: Switched to a more attractive sequential color scale
        const colorScale = d3.scaleSequential(d3.interpolateYlGn).domain([0, maxDuration]);

        svg.append("g").attr("transform", `translate(30, ${cellSize * 1.5})`).selectAll("rect")
            .data(dates).join("rect")
            .attr("width", cellSize - 1).attr("height", cellSize - 1)
            .attr("x", d => d3.timeWeek.count(d3.timeYear(d), d) * cellSize)
            .attr("y", d => d3.timeFormat("%w")(d) * cellSize)
            // MODIFIED: Use a soft grey for zero-activity cells instead of "black"
            .attr("fill", d => {
                const value = dataMap.get(d3.timeFormat("%Y-%m-%d")(d));
                return value > 0 ? colorScale(value) : 'var(--background-primary-alt)';
            })
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                const dateStr = d3.timeFormat("%Y-%m-%d")(d);
                const value = dataMap.get(dateStr) || 0;
                const content = `${d.toDateString()}<br><b>${formatDuration(value)}</b>`;
                const rect = event.target.getBoundingClientRect();
                const containerRect = chartRef.current.getBoundingClientRect();
                setTooltip({ visible: true, content, x: rect.left - containerRect.left + rect.width / 2, y: rect.top - containerRect.top });
                d3.select(event.target).style("stroke", "var(--text-accent)").style("stroke-width", 1.5);
            })
            .on("mouseout", (event) => {
                setTooltip(t => ({ ...t, visible: false }));
                d3.select(event.target).style("stroke", "none");
            });

        svg.append("g").attr("transform", `translate(30, ${cellSize})`).selectAll("text")
            .data(d3.timeMonths(d3.timeMonth.offset(yearAgo, 1), today)).join("text")
            .attr("x", d => d3.timeWeek.count(d3.timeYear(d), d) * cellSize)
            .attr("y", -5).text(d3.timeFormat("%b"))
            .attr("fill", "var(--text-muted)");
            
        const dayLabels = ["", "M", "", "W", "", "F", ""];
        svg.append("g").attr("transform", `translate(10, ${cellSize * 1.5})`).selectAll("text")
           .data(d3.range(7)).join("text")
           .attr("y", i => (i * cellSize) + (cellSize / 1.5)).text(i => dayLabels[i])
           .attr("fill", "var(--text-muted)");
    }

    const tooltipStyle = {
        position: 'absolute', visibility: tooltip.visible ? 'visible' : 'hidden',
        left: `${tooltip.x}px`, top: `${tooltip.y}px`,
        transform: 'translate(-50%, -110%)', background: 'var(--background-secondary-alt)',
        border: '1px solid var(--background-modifier-border)', borderRadius: '6px',
        padding: '8px 12px', zIndex: 1000, pointerEvents: 'none',
        color: 'var(--text-normal)', textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap'
    };

    return dc.preact.h('div', { style: { position: 'relative', width: '100%', maxWidth: '960px', margin: '0 auto' } },
        dc.preact.h('div', { ref: chartRef, style: { minHeight: '150px' } }),
        dc.preact.h('div', { style: tooltipStyle, dangerouslySetInnerHTML: { __html: tooltip.content } })
    );
}

return { CalendarHeatmapView };
```


# SunburstChartView

```jsx
// SunburstChartView.jsx
const { useState, useEffect, useMemo, useRef } = dc;

// --- CenterInfo component is unchanged ---
function CenterInfo({ hoveredData, totalDuration, formatDuration }) {
    const styles = {
        container: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', color: 'var(--text-normal)', width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '50%' },
        primaryText: { fontSize: '2em', fontWeight: 'bold', color: 'var(--interactive-accent)', lineHeight: 1.1, wordBreak: 'break-word', margin: '4px 0' },
        secondaryText: { fontSize: '0.8em', color: 'var(--text-muted)', marginTop: '5px' },
        nameText: { fontSize: '1.4em', fontWeight: 'bold', color: 'var(--text-normal)', lineHeight: 1.2, wordBreak: 'break-word' },
        parentText: { fontSize: '0.9em', color: 'var(--text-faint)', fontStyle: 'italic' }
    };

    if (hoveredData) {
        const percentage = (hoveredData.value / totalDuration * 100).toFixed(1);
        return dc.preact.h('div', { style: styles.container },
            dc.preact.h('div', { style: styles.nameText }, hoveredData.data.name),
            hoveredData.depth > 1 && dc.preact.h('div', { style: styles.parentText }, `in ${hoveredData.parent.data.name}`),
            dc.preact.h('div', { style: styles.primaryText }, formatDuration(hoveredData.value)),
            dc.preact.h('div', { style: styles.secondaryText }, `(${percentage}% of total)`)
        );
    }

    return dc.preact.h('div', { style: styles.container },
        dc.preact.h('div', { style: styles.primaryText }, formatDuration(totalDuration)),
        dc.preact.h('div', { style: styles.secondaryText }, 'Total Time')
    );
}

function SunburstChartView({ data, formatDuration }) {
    const chartRef = useRef(null);
    const [hoveredData, setHoveredData] = useState(null);

    const { hierarchicalData, totalDuration } = useMemo(() => {
        if (!data || data.length === 0) return { hierarchicalData: null, totalDuration: 0 };
        const total = data.reduce((sum, item) => sum + item.duration, 0);
        const hierarchy = {
            name: 'Total',
            children: data.map(cat => ({
                ...cat,
                children: cat.subTotals,
            }))
        };
        return { hierarchicalData: hierarchy, totalDuration: total };
    }, [data]);

    function loadD3() {
        const D3_URL = "https://d3js.org/d3.v7.min.js";
        if (!window._d3_loader_promise) {
            window._d3_loader_promise = new Promise((resolve, reject) => {
                if (window.d3) return resolve(window.d3);
                const script = document.createElement("script");
                script.src = D3_URL;
                script.async = true;
                script.onload = () => resolve(window.d3);
                script.onerror = (err) => reject(err);
                document.head.appendChild(script);
            });
        }
        return window._d3_loader_promise;
    }

    useEffect(() => {
        if (!chartRef.current) return;
        if (!hierarchicalData) {
            if (window.d3) window.d3.select(chartRef.current).selectAll("*").remove();
            return;
        }
        
        let isMounted = true;
        loadD3()
            .then(d3 => {
                if (!isMounted) return;
                const root = d3.hierarchy(hierarchicalData)
                    .sum(d => d.duration)
                    .sort((a, b) => b.value - a.value);
                renderGraph(d3, root);
            })
            .catch(error => {
                console.error("[AW-Dashboard] Sunburst Chart Error:", error);
                if (isMounted) chartRef.current.innerText = "Error: Could not render chart.";
            });

        return () => { isMounted = false; };
    }, [hierarchicalData, formatDuration]);

    function renderGraph(d3, root) {
        const width = 500, height = 500;
        const radius = Math.min(width, height) / 2;
        d3.select(chartRef.current).selectAll("*").remove();

        const partition = d3.partition().size([2 * Math.PI, radius]);
        partition(root);

        const arc = d3.arc()
            .startAngle(d => d.x0).endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005)).padRadius(radius / 2)
            .innerRadius(d => d.y0).outerRadius(d => d.y1 - 1);

        const svg = d3.select(chartRef.current).append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("font-size", "10px").style("font-family", "sans-serif");

        const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2}) rotate(-90)`);

        svg.on("mouseleave", () => {
            setHoveredData(null);
            path.transition().duration(200).style("opacity", 1.0);
        });
            
        const path = g.append("g").selectAll("path")
            .data(root.descendants().slice(1)).join("path")
              .attr("fill", d => d.data.color || d.parent.data.color)
              .style("cursor", "pointer")
              // MODIFIED: Temporarily disable mouse events during the initial animation
              .style("pointer-events", "none"); 

        path.on("mouseover", (event, d) => {
            setHoveredData(d);
            path.transition().duration(200).style("opacity", other_d => (d.ancestors().includes(other_d) ? 1.0 : 0.4));
        });

        const animationDuration = 1200;

        path.transition()
            .duration(animationDuration)
            .ease(d3.easeCubicOut)
            .attrTween("d", function(d) {
                const i = d3.interpolate({ x0: 0, x1: 0, y0: d.y0, y1: d.y1 }, d);
                return function(t) { return arc(i(t)); };
            })
            // MODIFIED: After the transition ends, re-enable pointer events for interaction.
            .on("end", function() {
                d3.select(this).style("pointer-events", "auto");
            });
    }
    
    return dc.preact.h('div', {
        style: { display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '500px' }
    },
        dc.preact.h('div', { ref: chartRef, style: { width: '100%', maxWidth: '500px' } }),
        dc.preact.h(CenterInfo, { hoveredData, totalDuration, formatDuration })
    );
}

return { SunburstChartView };
```



# ScreenModeHelper

```jsx
// ScreenModeHelper - Complete Code Block (with padding logic)
// Assumes 'dc' is a global object providing Preact hooks and h/render functions.

const { useState, useRef, useEffect, useCallback } = dc;

function getInt(val) {
  return parseInt(val, 10) || 0;
}

function findNearestAncestorWithClass(element, className) {
  if (!element) return null;
  let current = element.parentNode;
  while (current) {
    if (current.classList && current.classList.contains(className)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function findDirectChildByClass(parent, className) {
  if (!parent) return null;
  for (const child of parent.children) {
    if (child.classList && child.classList.contains(className)) {
      return child;
    }
  }
  return null;
}

// MODIFIED: Accepts paddingSize instead of marginSize
function applyFullTabStyle(container, targetPaneContent, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef, paddingSize) {
  console.log("[applyFullTabStyle] Applying Full Pane mode (overlay). Container:", container, "Target Pane:", targetPaneContent);
  if (!targetPaneContent) {
    console.error("[applyFullTabStyle] Target 'workspace-leaf-content' element not found.");
    return;
  }
  const currentParent = container.parentNode;
  if (!currentParent) {
    console.error("[applyFullTabStyle] Container has no parent. Cannot apply FullTab style.");
    return;
  }
  const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;

  originalParentRefForFullTab.current = currentParent;
  const placeholder = document.createElement('div');
  placeholder.className = 'screen-mode-placeholder';
  placeholder.style.display = 'none'; 
  
  if (container.nextSibling) {
    currentParent.insertBefore(placeholder, container.nextSibling);
  } else {
    currentParent.appendChild(placeholder);
  }
  originalPositionPlaceholderRef.current = placeholder;
  console.log("[applyFullTabStyle] Inserted placeholder into original parent:", currentParent);

  currentParent.removeChild(container);
  contentWrapper.appendChild(container);
  console.log("[applyFullTabStyle] Moved container to contentWrapper:", contentWrapper);

  const computedParentPosition = window.getComputedStyle(contentWrapper).position;
  originalParentPositionRefForFullTab.current = {
    element: contentWrapper,
    originalInlinePosition: contentWrapper.style.position
  };
  if (computedParentPosition === 'static') {
    contentWrapper.style.position = "relative";
    console.log("[applyFullTabStyle] Set contentWrapper position to 'relative'.");
  }

  // MODIFIED: Apply padding directly, reset position/dimensions to full
  Object.assign(container.style, {
    position: "absolute",
    top: "0px",
    left: "0px",
    width: "100%",
    height: "100%",
    zIndex: "9998",
    margin: "0", // Ensure no external margin
    padding: `${paddingSize}px`, // APPLY PADDING HERE
    border: "none", 
    borderRadius: "8px", 
    boxSizing: "border-box", // Essential: padding is included in width/height
    backgroundColor: container.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor || "#ffffff",
    overflow: "auto",
    display: "block"
  });
}

function resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, activeModeAboutToBeReset, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef, engine) {
  console.group(`[resetScreenMode] Resetting from mode: '${activeModeAboutToBeReset}' for container:`, container);

  if (document.fullscreenElement === container) {
    document.exitFullscreen?.();
  }

  const wasInFullTab = originalParentRefForFullTab.current !== null;

  if (wasInFullTab && (activeModeAboutToBeReset === 'fullTab' || originalParentRefForFullTab.current)) {
    console.log("[resetScreenMode] Handling FullTab state restoration.");
    const placeholder = originalPositionPlaceholderRef.current;
    const originalFullTabParent = originalParentRefForFullTab.current;

    if (container.parentNode && container.parentNode !== originalFullTabParent && container.parentNode !== placeholder?.parentNode) {
        container.parentNode.removeChild(container);
    }
    
    if (placeholder?.isConnected) {
      const placeholderParent = placeholder.parentNode;
      if (placeholderParent) {
         placeholderParent.replaceChild(container, placeholder);
         console.log("[resetScreenMode] Restored container using placeholder in parent:", placeholderParent);
      } else {
         console.warn("[resetScreenMode] Placeholder's parent is null. Trying original parent ref.");
         if (originalFullTabParent?.isConnected) {
            originalFullTabParent.appendChild(container);
         } else {
            console.warn("[resetScreenMode] Original parent for FullTab also not connected. Appending to body.");
            document.body.appendChild(container);
         }
      }
    } else if (originalFullTabParent?.isConnected) {
      originalFullTabParent.appendChild(container);
      console.log("[resetScreenMode] Restored container using original parent ref (placeholder was missing/disconnected):", originalFullTabParent);
      if(placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    } else {
      console.warn("[resetScreenMode] No valid placeholder or original parent for FullTab. Appending to body if not already there.");
      if (container.parentNode !== document.body) {
          if(container.parentNode) container.parentNode.removeChild(container);
          document.body.appendChild(container);
      }
    }

    originalPositionPlaceholderRef.current = null;
    originalParentRefForFullTab.current = null;

    if (originalParentPositionRefForFullTab.current?.element?.isConnected) {
      const { element, originalInlinePosition } = originalParentPositionRefForFullTab.current;
      element.style.position = originalInlinePosition || '';
      console.log("[resetScreenMode] Restored position style for FullTab target's original parent:", element);
    }
    originalParentPositionRefForFullTab.current = null;
    container.style.display = 'block';
  }

  if (container.parentNode === document.body) {
    let targetParentForBodyReparent = null;
    if (activeModeAboutToBeReset === 'window' && originalParentRefForWindow.current?.isConnected) {
      targetParentForBodyReparent = originalParentRefForWindow.current;
    } else if (activeModeAboutToBeReset === 'pip' && originalParentRefForPiP.current?.isConnected) {
      targetParentForBodyReparent = originalParentRefForPiP.current;
    } else if (originalParentRefForWindow.current?.isConnected) {
      targetParentForBodyReparent = originalParentRefForWindow.current;
    } else if (originalParentRefForPiP.current?.isConnected) {
      targetParentForBodyReparent = originalParentRefForPiP.current;
    }

    if (targetParentForBodyReparent) {
      console.log("[resetScreenMode] Reparenting container from body to:", targetParentForBodyReparent);
      document.body.removeChild(container);
      targetParentForBodyReparent.appendChild(container);
      if (targetParentForBodyReparent === originalParentRefForWindow.current) originalParentRefForWindow.current = null;
      if (targetParentForBodyReparent === originalParentRefForPiP.current) originalParentRefForPiP.current = null;
    } else {
      console.log("[resetScreenMode] Container is in body, but no valid original parent ref found to reparent to.");
    }
  }

  if (activeModeAboutToBeReset === 'pip' || container.getAttribute('data-is-independent-pip')) {
    console.log("[resetScreenMode] Cleaning up PiP specific elements and listeners.");
    if (container._pipDragAttached) {
      window.removeEventListener("mousemove", container._pipDragAttached.dragMove);
      window.removeEventListener("mouseup", container._pipDragAttached.dragEnd);
      if (container._pipDragBar) {
        container._pipDragBar.removeEventListener("mousedown", container._pipDragAttached.dragStart);
        if (container._pipDragBar.parentNode === container) container.removeChild(container._pipDragBar);
        delete container._pipDragBar;
      }
      delete container._pipDragAttached;
      delete container._pipDragging;
    }
    if (container._pipResizers) {
      if (container._pipResizeMoveHandler) window.removeEventListener("mousemove", container._pipResizeMoveHandler);
      if (container._pipResizeEndHandler) window.removeEventListener("mouseup", container._pipResizeEndHandler);
      delete container._pipResizeMoveHandler;
      delete container._pipResizeEndHandler;

      container._pipResizers.forEach(resizer => {
        if (resizer.parentNode === container) resizer.parentNode.removeChild(resizer);
      });
      delete container._pipResizers;
    }
  }

  if (!container.getAttribute('data-is-independent-pip')) {
    console.log("[resetScreenMode] Resetting container inline styles.");
    Object.assign(container.style, {
      position: "", top: "", left: "", width: "", height: "",
      zIndex: "", margin: "", padding: "", border: "", borderRadius: "",
      boxSizing: "", backgroundColor: "", overflow: "", cursor: "",
      display: "block"
    });
  } else {
    console.log("[resetScreenMode] Skipping style reset for independent PiP container.");
  }
  console.groupEnd();
}

function applyBrowserMode(container) {
  console.log("[applyBrowserMode] Toggling browser fullscreen.");
  if (!document.fullscreenElement) {
    (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen)?.call(container)
    .catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
  } else if (document.fullscreenElement === container) {
    document.exitFullscreen?.();
  }
}

// MODIFIED: Accepts paddingSize instead of marginSize
function applyWindowStyle(container, paddingSize) { 
  console.log("[applyWindowStyle] Applying Window mode styles.");
  // MODIFIED: Apply padding directly, reset position/dimensions to full
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "9999",
    margin: "0", // Ensure no external margin
    padding: `${paddingSize}px`, // APPLY PADDING HERE
    border: "none", 
    borderRadius: "8px", 
    boxSizing: "border-box", // Essential: padding is included in width/height
    backgroundColor: container.style.backgroundColor || window.getComputedStyle(document.body).backgroundColor || "#ffffff",
    display: "block",
    overflow: "auto"
  });
}

function applyPipStyle(container) {
  console.log("[applyPipStyle] Applying PiP mode styles.");
  const isDark = document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  Object.assign(container.style, {
    position: "fixed", top: "calc(100% - 300px - 20px)", left: "calc(100% - 400px - 20px)",
    width: "400px", height: "300px", zIndex: "10000",
    backgroundColor: container.style.backgroundColor || (isDark ? '#2c2c2c' : '#f8f9fa'),
    border: `1px solid ${isDark ? '#444' : '#ccc'}`,
    borderRadius: "8px", cursor: "default", boxSizing: "border-box", padding: "0",
    overflow: "hidden", display: "block", boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
  });
}

function setupPipDrag(container) {
  if (container._pipDragAttached) return;
  console.log("[setupPipDrag] Setting up PiP drag functionality.");
  const dragBar = document.createElement("div");
  dragBar.className = "pip-drag-bar";
  const isDark = document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  Object.assign(dragBar.style, {
    position: "absolute", top: "0", left: "0", width: "100%", height: "28px",
    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    cursor: "grab", zIndex: 10500, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    fontSize: '12px', fontWeight: '500', borderTopLeftRadius: '7px', borderTopRightRadius: '7px', // Fixed typo '7櫃'
    userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none'
  });
  dragBar.textContent = 'DRAG';

  const dragHandlers = {
    dragStart: (e) => {
      if (e.target !== dragBar && e.target.parentNode !== dragBar && !e.target.classList.contains('pip-drag-bar-title')) return;
      e.preventDefault();
      container._pipDragging = true;
      container._pipStartX = e.clientX; container._pipStartY = e.clientY;
      const computed = getComputedStyle(container);
      container._pipOrigTop = getInt(computed.top); container._pipOrigLeft = getInt(computed.left);
      dragBar.style.cursor = 'grabbing'; document.body.style.userSelect = 'none';
    },
    dragMove: (e) => {
      if (!container._pipDragging) return; e.preventDefault();
      container.style.top = `${container._pipOrigTop + (e.clientY - container._pipStartY)}px`;
      container.style.left = `${container._pipOrigLeft + (e.clientX - container._pipStartX)}px`;
    },
    dragEnd: (e) => {
      if (!container._pipDragging) return; e.preventDefault();
      container._pipDragging = false; dragBar.style.cursor = 'grab'; document.body.style.userSelect = '';
    }
  };
  dragBar.addEventListener("mousedown", dragHandlers.dragStart);
  window.addEventListener("mousemove", dragHandlers.dragMove);
  window.addEventListener("mouseup", dragHandlers.dragEnd);
  container.appendChild(dragBar);
  container._pipDragBar = dragBar; container._pipDragAttached = dragHandlers;
}

function setupPipCornerResizers(container) {
  if (container._pipResizers?.length > 0) return;
  console.log("[setupPipCornerResizers] Setting up PiP corner resizers.");
  const corners = [
    { c: "topLeft", s: { top: "-5px", left: "-5px", cursor: "nwse-resize" } },
    { c: "topRight", s: { top: "-5px", right: "-5px", cursor: "nesw-resize" } },
    { c: "bottomRight", s: { bottom: "-5px", right: "-5px", cursor: "nwse-resize" } },
    { c: "bottomLeft", s: { bottom: "-5px", left: "-5px", cursor: "nesw-resize" } }
  ];
  const resizers = []; const handleSize = 10;
  const isDark = document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  corners.forEach(({ c, s }) => {
    const r = document.createElement("div");
    r.className = `pip-resizer pip-resizer-${c}`;
    Object.assign(r.style, {
      position: "absolute", width: `${handleSize}px`, height: `${handleSize}px`,
      background: isDark ? "rgba(0,123,255,0.6)" : "rgba(0,123,255,0.8)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)"}`,
      borderRadius: "3px", zIndex: 10501, ...s
    });
    r.addEventListener("mousedown", (e) => {
      e.stopPropagation(); e.preventDefault();
      r._resizing = true; r._startX = e.clientX; r._startY = e.clientY;
      const comp = getComputedStyle(container);
      r._originalWidth = getInt(comp.width); r._originalHeight = getInt(comp.height);
      r._originalTop = getInt(comp.top); r._originalLeft = getInt(comp.left);
      r._corner = c; document.body.style.cursor = s.cursor; document.body.style.userSelect = 'none';
    });
    resizers.push(r); container.appendChild(r);
  });
  container._pipResizers = resizers;
  const minWidth = 150, minHeight = 100;

  const handleResizeMove = (e) => {
    e.preventDefault(); const activeResizer = resizers.find(r => r._resizing); if (!activeResizer) return;
    let nW = activeResizer._originalWidth, nH = activeResizer._originalHeight, nL = activeResizer._originalLeft, nT = activeResizer._originalTop;
    const dX = e.clientX - activeResizer._startX, dY = e.clientY - activeResizer._startY;
    if (activeResizer._corner.includes("Right")) nW = Math.max(minWidth, activeResizer._originalWidth + dX);
    if (activeResizer._corner.includes("Left")) { nW = Math.max(minWidth, activeResizer._originalWidth - dX); nL = activeResizer._originalLeft + (activeResizer._originalWidth - nW); }
    if (activeResizer._corner.includes("Bottom")) nH = Math.max(minHeight, activeResizer._originalHeight + dY);
    if (activeResizer._corner.includes("Top")) { nH = Math.max(minHeight, activeResizer._originalHeight - dY); nT = activeResizer._originalTop + (activeResizer._originalHeight - nH); }
    Object.assign(container.style, { width: `${nW}px`, height: `${nH}px`, top: `${nT}px`, left: `${nL}px` });
  };
  const handleResizeEnd = (e) => {
    e.preventDefault(); const activeResizer = resizers.find(r => r._resizing); if (activeResizer) activeResizer._resizing = false;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
  };
  window.addEventListener("mousemove", handleResizeMove); window.addEventListener("mouseup", handleResizeEnd);
  container._pipResizeMoveHandler = handleResizeMove; container._pipResizeEndHandler = handleResizeEnd;
}

function spawnIndependentPip(AppComponent, isDarkMode) {
  console.log("[spawnIndependentPip] Spawning new independent PiP window.");
  const hostDiv = document.createElement("div");
  hostDiv.setAttribute('data-is-independent-pip', 'true');
  const isHostDark = isDarkMode === undefined ? (document.body.classList.contains('theme-dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) : isDarkMode;
  hostDiv.style.backgroundColor = isHostDark ? '#2c2c2c' : 'white';
  document.body.appendChild(hostDiv);

  const closeIndependentPip = () => {
    console.log("[spawnIndependentPip] Closing independent PiP:", hostDiv);
    resetScreenMode(hostDiv, { current: null }, { current: null }, 'pip', {current: null}, {current: null}, {current: null}, null);
    dc.preact.render(null, hostDiv);
    if (hostDiv.parentNode) hostDiv.parentNode.removeChild(hostDiv);
  };

  dc.preact.render(dc.preact.h(AppComponent, { isDarkMode: isHostDark, isIndependentPip: true, closePip: closeIndependentPip }), hostDiv);
  applyPipStyle(hostDiv); setupPipDrag(hostDiv); setupPipCornerResizers(hostDiv);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×'; // Close symbol
  Object.assign(closeBtn.style, {
    position: 'absolute', top: '0px', right: '0px', zIndex: '10501', cursor: 'pointer',
    background: 'transparent', color: isHostDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    border: 'none', borderTopRightRadius: '7px', borderBottomLeftRadius: '7px',
    width: '28px', height: '28px', fontSize: '20px', lineHeight: '28px', textAlign: 'center',
    padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
  });
  closeBtn.onmouseover = () => { closeBtn.style.background = isHostDark ? 'rgba(255,0,0,0.5)' : 'rgba(220,53,69,0.8)'; closeBtn.style.color = 'white';};
  closeBtn.onmouseout = () => { closeBtn.style.background = 'transparent'; closeBtn.style.color = isHostDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';};
  closeBtn.title = "Close PiP Window";
  closeBtn.onclick = (e) => { e.stopPropagation(); closeIndependentPip(); };

  if (hostDiv._pipDragBar) {
    hostDiv._pipDragBar.style.justifyContent = 'flex-end'; // Push button to right
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'PiP Window'; // Or get from AppComponent
    titleSpan.className = 'pip-drag-bar-title';
    Object.assign(titleSpan.style, { flexGrow: 1, textAlign: 'center', paddingLeft: '28px' /* space for btn on right */ });
    hostDiv._pipDragBar.textContent = ''; // Clear "DRAG"
    hostDiv._pipDragBar.appendChild(titleSpan);
    hostDiv._pipDragBar.appendChild(closeBtn);
  } else { hostDiv.appendChild(closeBtn); }
}

const ScreenModeHelper = ({
  helperRef, initialMode = "default", containerRef,
  originalParentRefForWindow, originalParentRefForPiP,
  allowedScreenModes = ["browser", "window", "fullTab", "pip", "character"],
  engine, AppComponent, isDarkMode,
  fullscreenPadding = 0 // MODIFIED PROP NAME: Default to 0
}) => {
  const [activeMode, setActiveMode] = useState(
    allowedScreenModes.includes(initialMode) && initialMode !== "character" ? initialMode : "default"
  );
  const originalParentRefForFullTab = useRef(null);
  const originalParentPositionRefForFullTab = useRef(null);
  const originalPositionPlaceholderRef = useRef(null);

  const toggleMode = useCallback((requestedMode) => {
    console.log(`[ScreenModeHelper] toggleMode. Current: '${activeMode}', Requested: '${requestedMode}'`);
    const container = containerRef.current;
    if (!container) { console.error("[ScreenModeHelper] Container ref is not set."); return; }

    const currentActiveMode = activeMode;
    let newEffectiveMode = requestedMode;

    if (currentActiveMode === requestedMode && requestedMode !== "character") newEffectiveMode = "default";
    if (requestedMode === "character") newEffectiveMode = "default";

    if (currentActiveMode !== "default") {
      console.log(`[ScreenModeHelper] Resetting from current mode: ${currentActiveMode}`);
      resetScreenMode(container, originalParentRefForWindow, originalParentRefForPiP, currentActiveMode,
                      originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef, engine);
    }
    
    setActiveMode(newEffectiveMode);

    if (newEffectiveMode === "default") {
      setTimeout(() => {
        if (containerRef.current) {
          if (window.getComputedStyle(containerRef.current).display === 'none') containerRef.current.style.display = 'block';
          if (engine?.resize) engine.resize();
        }
      }, 100);
    } else if (newEffectiveMode === "browser") {
      applyBrowserMode(container);
      if (engine?.resize) setTimeout(() => engine.resize(), 150);
    } else if (newEffectiveMode === "window") {
      if (!originalParentRefForWindow.current && container.parentNode !== document.body) {
        originalParentRefForWindow.current = container.parentNode;
      }
      if (container.parentNode !== document.body) {
        if (container.parentNode) container.parentNode.removeChild(container);
        document.body.appendChild(container);
      }
      applyWindowStyle(container, fullscreenPadding); // MODIFIED: Pass fullscreenPadding
      if (engine?.resize) setTimeout(() => engine.resize(), 50);
    } else if (newEffectiveMode === "fullTab") {
      const targetFullTabParent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
      if (targetFullTabParent) {
        applyFullTabStyle(container, targetFullTabParent, originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef, fullscreenPadding); // MODIFIED: Pass fullscreenPadding
      } else {
        console.error("[ScreenModeHelper] Could not find 'workspace-leaf-content' for 'fullTab'. Reverting.");
        setActiveMode("default");
        container.style.display = 'block';
      }
      if (engine?.resize) setTimeout(() => engine.resize(), 50);
    } else if (newEffectiveMode === "pip") {
      if (!originalParentRefForPiP.current && container.parentNode !== document.body) {
        originalParentRefForPiP.current = container.parentNode;
      }
      if (container.parentNode !== document.body) {
        if (container.parentNode) container.parentNode.removeChild(container);
        document.body.appendChild(container);
      }
      applyPipStyle(container); setupPipDrag(container); setupPipCornerResizers(container);
      if (engine?.setHardwareScalingLevel && engine?.resize) {
        const scaleFactor = 0.5 / (window.devicePixelRatio || 1);
        engine.setHardwareScalingLevel(scaleFactor);
        setTimeout(() => engine.resize(), 50);
      }
    }

    if (requestedMode === "character" && AppComponent) {
      spawnIndependentPip(AppComponent, isDarkMode);
    }
  }, [activeMode, containerRef, originalParentRefForWindow, originalParentRefForPiP, engine, AppComponent, isDarkMode, allowedScreenModes, fullscreenPadding]); // MODIFIED: fullscreenPadding as dependency

  useEffect(() => {
    if (helperRef) helperRef.current = { toggleMode, getActiveMode: () => activeMode };
  }, [helperRef, toggleMode, activeMode]);

  useEffect(() => {
    const applyInitial = () => {
        if (initialMode !== "default" && containerRef.current && allowedScreenModes.includes(initialMode)) {
            if (initialMode === "character" && AppComponent) {
                console.log(`[ScreenModeHelper] Spawning 'character' PiP due to initialMode.`);
                spawnIndependentPip(AppComponent, isDarkMode);
            } else if (initialMode !== "character") {
                console.log(`[ScreenModeHelper] Applying initialMode: ${initialMode} on mount.`);
                toggleMode(initialMode);
            }
        }
    };
    const timeoutId = setTimeout(applyInitial, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && activeMode === "browser") toggleMode("browser");
    };
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(e => document.addEventListener(e, handleFsChange));
    return () => events.forEach(e => document.removeEventListener(e, handleFsChange));
  }, [activeMode, toggleMode]);

  useEffect(() => {
    if (!containerRef.current || !engine?.resize) return;
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, engine]);

  useEffect(() => {
    const currentContainer = containerRef.current;
    const currentActiveMode = activeMode;

    return () => {
      console.log(`[ScreenModeHelper] Cleanup effect. Mode was: ${currentActiveMode}`);
      if (currentContainer && currentActiveMode !== 'default') {
        const modesRequiringReset = ["window", "fullTab", "pip", "browser"];
        if (modesRequiringReset.includes(currentActiveMode)) {
          console.log(`[ScreenModeHelper] Unmounting or mode change: Resetting from ${currentActiveMode}.`);
          resetScreenMode(currentContainer, originalParentRefForWindow, originalParentRefForPiP, currentActiveMode,
                          originalParentRefForFullTab, originalParentPositionRefForFullTab, originalPositionPlaceholderRef, engine);
        }
      }
      if (originalPositionPlaceholderRef.current?.parentNode) {
        originalPositionPlaceholderRef.current.parentNode.removeChild(originalPositionPlaceholderRef.current);
        originalPositionPlaceholderRef.current = null;
      }
    };
  }, [containerRef]);

  // Adjust button position: top is typically 10px from edge of *this* component.
  // In fullTab mode, this component takes the full tab area, so 55px is a good offset from the tab's top.
  const buttonContainerTop = activeMode === 'fullTab' ? '55px' : '10px'; 
  let buttonContainerRight = '10px';
  if (activeMode === 'pip' && containerRef.current?._pipDragBar?.querySelector('button')) {
      buttonContainerRight = '40px';
  }


  return dc.preact.h('div', {
    className: 'screen-mode-controls',
    style: {
      position: "absolute", top: buttonContainerTop, right: buttonContainerRight,
      zIndex: (activeMode === 'pip' || activeMode === 'window') ? 10001 : (activeMode === 'fullTab' ? 9999 : 500),
      display: "flex", gap: "5px"
    }
  },
    allowedScreenModes.filter(m => m !== "none").map(mode => {
      const isCurrentActive = activeMode === mode && mode !== "character";
      let modeLabel;
      switch(mode) {
        case "pip": modeLabel = "PiP"; break;
        case "fullTab": modeLabel = "Tab"; break;
        case "browser": modeLabel = "Full"; break;
        case "window": modeLabel = "Win"; break;
        case "character": modeLabel = "New"; break;
        default: modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
      }

      return dc.preact.h('button', {
        key: mode, onClick: () => toggleMode(mode),
        style: {
          minWidth: "38px", height: "38px", padding: "0 8px", cursor: "pointer",
          backgroundColor: isCurrentActive ? "#007bff" : (mode === "character" ? "#28a745" : "#5a5a5a"),
          color: "white", border: `1px solid ${isCurrentActive ? "#0056b3" : (mode === "character" ? "#1e7e34" : "#444")}`,
          borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: "bold", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "background-color 0.15s ease-in-out, border-color 0.15s ease-in-out",
        },
        title: mode === "character" ? "Spawn New PiP Window" : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode${isCurrentActive ? " (Active - Click to Reset)" : ""}`
      }, modeLabel);
    })
  );
};

return { ScreenModeHelper };
```



# HelperFunctions


```jsx

function formatDuration(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return 'N/A';
    if (seconds < 1) return '<1s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor((seconds % 60) / 1);
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.length > 0 ? parts.join(' ') : '0s';
}

function formatTime(date) {
    if (!(date instanceof Date) || isNaN(date)) return 'N/A';
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

return { formatDuration, formatTime };
```