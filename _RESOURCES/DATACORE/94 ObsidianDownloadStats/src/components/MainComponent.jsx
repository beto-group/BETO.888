// ❌ DO NOT USE import/export
function MainComponent(props) {
    const { dc, loadScript, isFullTab, onToggleFullTab, styles } = props;
    const { useState, useEffect, useRef } = dc;

    const canvasContainerRef = useRef(null);
    const tooltipRef = useRef(null);
    const containerRef = useRef(null); // Added containerRef for full-tab logic

    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [totalDownloads, setTotalDownloads] = useState(0);
    const [hoveredData, setHoveredData] = useState(null);
    const [latestVersion, setLatestVersion] = useState(null);

    // New Advanced Metrics
    const [osStats, setOsStats] = useState(null);
    const [betaStats, setBetaStats] = useState(null);
    const [visibleReleases, setVisibleReleases] = useState(60); // Default to last 60 releases

    // 1. Singleton Refs for Hot-Reload Stability (CRITICAL)
    const refs = useRef({
        d3: null,
        data: null,
        chart: null,
        svg: null,
        resizeObserver: null,
        renderChart: null,
        visibleReleases: 60,
        // stateRefs for full tab mode
        stateRefs: {}
    }).current;

    // Keep ref in sync so D3 renderChart closure uses latest
    refs.visibleReleases = visibleReleases;

    useEffect(() => {
        if (refs.renderChart) {
            refs.renderChart();
        }
    }, [visibleReleases]);

    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `d3js-wrapper-${instanceId}`;

    // DOM Traversal Utilities
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

    // Full-tab mode effect
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;

        const targetPaneContent = findNearestAncestorWithClass(
            container,
            "workspace-leaf-content"
        );

        if (!targetPaneContent) {
            // Cannot find target pane, fallback
            return;
        }

        const contentWrapper =
            findDirectChildByClass(targetPaneContent, "view-content") ||
            targetPaneContent;

        refs.stateRefs.originalParent = container.parentNode;
        refs.stateRefs.placeholder = document.createElement("div");
        refs.stateRefs.placeholder.style.display = "none";
        container.parentNode.insertBefore(refs.stateRefs.placeholder, container);

        refs.stateRefs.parentPositionInfo = {
            element: contentWrapper,
            original: window.getComputedStyle(contentWrapper).position,
        };

        if (refs.stateRefs.parentPositionInfo.original === "static") {
            contentWrapper.style.position = "relative";
        }

        contentWrapper.appendChild(container);

        Object.assign(container.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            zIndex: "9998",
            overflow: "hidden",
            backgroundColor: "#000000"
        });

        return () => {
            if (refs.stateRefs.placeholder?.parentNode) {
                refs.stateRefs.placeholder.parentNode.replaceChild(
                    container,
                    refs.stateRefs.placeholder
                );
            }
            if (refs.stateRefs.parentPositionInfo?.element) {
                refs.stateRefs.parentPositionInfo.element.style.position =
                    refs.stateRefs.parentPositionInfo.original === "static"
                        ? ""
                        : refs.stateRefs.parentPositionInfo.original;
            }
            container.removeAttribute("style");
            Object.keys(refs.stateRefs).forEach((key) => (refs.stateRefs[key] = null));
        };
    }, [isFullTab]);

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                // Load D3
                if (!window.d3) {
                    await loadScript(dc, "https://d3js.org/d3.v7.min.js");
                }

                if (!active) return;
                setIsLoaded(true);
                refs.d3 = window.d3;

                // Fetch Data
                await fetchDataAndRender();

            } catch (e) {
                if (active) setError(e.message);
                console.error("Component Init Error:", e);
            }
        }

        async function fetchDataAndRender() {
            if (!active) return;
            try {
                // Fetch all pages of releases to get complete history
                let headers = {
                    'Accept': 'application/vnd.github.v3+json'
                };

                let allReleases = [];
                let page = 1;
                let hasMore = true;

                while (hasMore) {
                    const response = await fetch(`https://api.github.com/repos/obsidianmd/obsidian-releases/releases?per_page=100&page=${page}`, { headers });
                    if (!response.ok) {
                        throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();

                    if (data.length === 0) {
                        hasMore = false;
                    } else {
                        allReleases = allReleases.concat(data);
                        page++;
                    }
                }

                if (!active) return;

                // Process Release Data
                let total = 0;
                let osCounts = { windows: 0, mac: 0, linux: 0, android: 0, ios: 0 };
                let betaCounts = { stable: 0, insider: 0 };

                const processedData = allReleases.map(release => {
                    let totalDownloads = 0;
                    let releaseOsCounts = { windows: 0, mac: 0, linux: 0, android: 0, ios: 0 };

                    release.assets.forEach(asset => {
                        const count = asset.download_count;
                        totalDownloads += count;

                        const name = asset.name.toLowerCase();
                        if (name.endsWith('.exe')) { osCounts.windows += count; releaseOsCounts.windows += count; }
                        else if (name.endsWith('.dmg') || name.endsWith('.pkg')) { osCounts.mac += count; releaseOsCounts.mac += count; }
                        else if (name.endsWith('.appimage') || name.endsWith('.snap') || name.endsWith('.deb') || name.endsWith('.pacman') || name.endsWith('.rpm')) { osCounts.linux += count; releaseOsCounts.linux += count; }
                        else if (name.endsWith('.apk')) { osCounts.android += count; releaseOsCounts.android += count; }
                        else if (name.endsWith('.ipa')) { osCounts.ios += count; releaseOsCounts.ios += count; }
                    });

                    total += totalDownloads;

                    if (release.prerelease || release.tag_name.includes('insider') || release.tag_name.includes('alpha') || release.tag_name.includes('beta')) {
                        betaCounts.insider += totalDownloads;
                    } else {
                        betaCounts.stable += totalDownloads;
                    }

                    return {
                        version: release.tag_name,
                        date: new Date(release.published_at),
                        downloads: totalDownloads,
                        name: release.name || release.tag_name,
                        isPrerelease: release.prerelease,
                        osBase: releaseOsCounts
                    };
                }).filter(d => d.downloads > 0).reverse(); // Reverse for chronological order (oldest to newest)

                refs.data = processedData;
                if (active) {
                    setIsLoadingData(false);
                    setTotalDownloads(total);
                    setOsStats(osCounts);
                    setBetaStats(betaCounts);

                    const latestStable = processedData.filter(d => !d.isPrerelease);
                    if (latestStable.length > 0) {
                        setLatestVersion(latestStable[latestStable.length - 1]);
                    } else if (processedData.length > 0) {
                        setLatestVersion(processedData[processedData.length - 1]);
                    }
                }

                renderChart();

                // Handle Resizes
                let lastWidth = 0;
                let lastHeight = 0;
                refs.resizeObserver = new ResizeObserver((entries) => {
                    if (!entries || !entries[0]) return;
                    const { width, height } = entries[0].contentRect;
                    // Debounce micro-adjustments to prevent resize loops
                    if (Math.abs(width - lastWidth) > 2 || Math.abs(height - lastHeight) > 2) {
                        lastWidth = width;
                        lastHeight = height;
                        renderChart();
                    }
                });

                if (canvasContainerRef.current) {
                    refs.resizeObserver.observe(canvasContainerRef.current);
                }

            } catch (e) {
                if (active) {
                    setError(e.message);
                    setIsLoadingData(false);
                }
                console.error("Data Fetch Error:", e);
            }
        }

        function renderChart() {
            if (!active || !refs.data || !refs.d3 || !canvasContainerRef.current) return;

            const d3 = refs.d3;
            // Apply zoom slicing
            const data = refs.visibleReleases >= refs.data.length ? refs.data : refs.data.slice(-refs.visibleReleases);
            const container = canvasContainerRef.current;
            const { width, height } = container.getBoundingClientRect();

            if (width === 0 || height === 0) return;

            // Clear previous
            d3.select(container).selectAll("*").remove();

            const margin = { top: 40, right: 30, bottom: 60, left: 80 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            const svg = d3.select(container)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .style("display", "block") // Fixes default inline height gaps that cause scrollbars
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            refs.svg = svg;

            // X Axis
            const x = d3.scaleBand()
                .domain(data.map(d => d.version))
                .range([0, innerWidth])
                .padding(0.4);

            const xTickPattern = Math.ceil(data.length / 30); // Prevent overlapping by showing max 30 labels
            const xTickValues = x.domain().filter((d, i) => i % xTickPattern === 0);

            svg.append("g")
                .attr("transform", `translate(0,${innerHeight})`)
                .call(d3.axisBottom(x).tickValues(xTickValues))
                .selectAll("text")
                .attr("transform", "translate(-12,4)rotate(-45)")
                .style("text-anchor", "end")
                .style("fill", "#666")
                .style("font-family", "monospace")
                .style("font-size", "10px");

            // Y Axis
            const maxDownload = d3.max(data, d => d.downloads) || 0;
            const osTotalMax = d3.max(data, d => Math.max(d.osBase.windows, d.osBase.mac, d.osBase.linux, d.osBase.android)) || 0;
            const yMax = Math.max(maxDownload, osTotalMax) * 1.05; // 5% padding to top

            const y = d3.scaleLinear()
                .domain([0, yMax])
                .nice()
                .range([innerHeight, 0]);

            svg.append("g")
                .call(d3.axisLeft(y).ticks(10, 's'))
                .selectAll("text")
                .style("fill", "#666")
                .style("font-family", "monospace")
                .style("font-size", "10px");

            // Formatting axes styling explicitly
            svg.selectAll(".domain, .tick line")
                .attr("stroke", "#333");

            // Y-axis grid lines
            svg.append("g")
                .attr("class", "grid")
                .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(""))
                .selectAll("line")
                .attr("stroke", "rgba(255, 255, 255, 0.05)")
                .attr("stroke-dasharray", "3,3");

            svg.select(".grid .domain").remove();

            // Tooltip setup
            const tooltip = d3.select(tooltipRef.current);

            // Bars (Pure white per user request)
            svg.selectAll(".bar")
                .data(data)
                .join("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.version))
                .attr("width", x.bandwidth())
                .attr("y", innerHeight) // Initial for animation
                .attr("height", 0)       // Initial for animation
                .attr("fill", "rgba(255,255,255,0.2)")
                .attr("rx", 3)
                .style("transition", "fill 0.2s")
                // Hover Events
                .on("mouseover", function (event, d) {
                    d3.select(this)
                        .attr("fill", "rgba(139, 92, 246, 0.4)")
                        .style("filter", "drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))");

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 1);

                    const [xPos, yPos] = d3.pointer(event, container);

                    tooltip.html(`
                        <div style="color: #a78bfa; font-weight: bold; margin-bottom: 5px;">${d.name}</div>
                        <div>Downloads: <span style="color:white">${d.downloads.toLocaleString()}</span></div>
                        <div style="font-size: 10px; margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(139,92,246,0.3)">
                            <div style="color: #3b82f6;">Win: ${d.osBase.windows.toLocaleString()}</div>
                            <div style="color: #a855f7;">Mac: ${d.osBase.mac.toLocaleString()}</div>
                            <div style="color: #eab308;">Lin: ${d.osBase.linux.toLocaleString()}</div>
                            <div style="color: #22c55e;">And: ${d.osBase.android.toLocaleString()}</div>
                        </div>
                        <div style="font-size: 10px; color: #888; margin-top: 5px;">${d.date.toLocaleDateString()}</div>
                      `)
                        .style("left", (xPos + 15) + "px")
                        .style("top", (yPos - 28) + "px");

                    setHoveredData(d);
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .attr("fill", "rgba(255,255,255,0.2)")
                        .style("filter", "none");

                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);

                    setHoveredData(null);
                })
                // Animation
                .transition()
                .duration(800)
                .delay((d, i) => i * 30)
                .attr("y", d => y(d.downloads))
                .attr("height", d => innerHeight - y(d.downloads));

            // Draw OS Lines
            const lineGroup = svg.append("g").attr("class", "os-lines");

            const drawLine = (key, color) => {
                const lineGenerator = d3.line()
                    .x(d => x(d.version) + x.bandwidth() / 2)
                    .y(d => y(d.osBase[key]))
                    .curve(d3.curveMonotoneX);

                const path = lineGroup.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 1.5)
                    .attr("d", lineGenerator)
                    .attr("opacity", 0.9)
                    .style("filter", `drop-shadow(0px -2px 4px ${color}80)`);

                const pathNode = path.node();
                if (pathNode && pathNode.getTotalLength) {
                    const totalLength = pathNode.getTotalLength();
                    path
                        .attr("stroke-dasharray", totalLength + " " + totalLength)
                        .attr("stroke-dashoffset", totalLength)
                        .transition()
                        .delay(500)
                        .duration(1500)
                        .ease(d3.easeCubicOut)
                        .attr("stroke-dashoffset", 0);
                }
            };

            drawLine("windows", "#3b82f6"); // Blue
            drawLine("mac", "#a855f7");     // Purple
            drawLine("linux", "#eab308");   // Yellow
            drawLine("android", "#22c55e"); // Green

            // Export so we can re-trigger on slider change
            refs.renderChart = renderChart;
        }

        init();

        // Strict Cleanup Phase!
        return () => {
            active = false;
            if (refs.resizeObserver) {
                refs.resizeObserver.disconnect();
            }
            if (canvasContainerRef.current && refs.d3) {
                refs.d3.select(canvasContainerRef.current).selectAll("*").remove();
            }
        };
    }, []);

    return (
        <div ref={containerRef} style={styles.fullTabWrapper} className={uniqueWrapperClass}>
            {/* Header Area */}
            <div style={{ ...styles.header, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: '#a78bfa', display: 'flex', transition: 'transform 0.3s ease' }} className="obsidian-logo-wrapper">
                    <dc.Icon icon="hexagon" style={{ width: '48px', height: '48px', strokeWidth: 1.5, fill: 'rgba(167, 139, 250, 0.1)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1 style={{ ...styles.title, margin: 0, lineHeight: 1 }}>Obsidian Releases</h1>
                    <p style={{ ...styles.subtitle, margin: 0, marginTop: '8px' }}>GLOBAL DOWNLOAD DISTRIBUTION</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'row', backgroundColor: '#050505', overflow: 'hidden' }}>

                {/* Graph Container */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {!isLoaded && !error && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: "#8b5cf6", animation: "pulse 1.5s infinite" }}>
                            INITIALIZING ENVIRONMENT...
                        </div>
                    )}
                    {isLoaded && isLoadingData && !error && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: "#8b5cf6", animation: "pulse 1.5s infinite" }}>
                            FETCHING TELEMETRY DATA...
                        </div>
                    )}
                    {error && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: "#ef4444", border: "1px solid #ef4444", padding: "10px", backgroundColor: "rgba(239,68,68,0.1)" }}>
                            SYSTEM ERROR: {error}
                        </div>
                    )}

                    <div ref={canvasContainerRef} style={styles.canvas} />

                    {/* Tooltip */}
                    <div ref={tooltipRef} style={styles.tooltip} />
                </div>

                {/* Info Sidebar Panel */}
                <div style={{
                    width: '320px',
                    backgroundColor: 'rgba(10, 10, 10, 0.95)',
                    borderLeft: '1px solid rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px',
                    gap: '20px',
                    overflowY: 'auto',
                    boxShadow: '-5px 0 15px rgba(0,0,0,0.5)',
                    zIndex: 10
                }}>
                    {/* Timeline Zoom */}
                    {refs.data && refs.data.length > 0 && (
                        <div style={{ paddingBottom: '15px', borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '2px' }}>TIMELINE ZOOM</div>
                                <div style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 'bold' }}>{visibleReleases} Releases</div>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max={refs.data.length}
                                value={visibleReleases}
                                onChange={(e) => setVisibleReleases(parseInt(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer', accentColor: '#a78bfa' }}
                            />
                        </div>
                    )}

                    {/* Total Downloads */}
                    <div style={{ paddingBottom: '10px', borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '2px', marginBottom: '8px' }}>CORE PLATFORM DOWNLOADS</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffffff', textShadow: '0 0 20px rgba(139, 92, 246, 0.4)', lineHeight: '1.2' }}>
                            {totalDownloads > 0 ? (totalDownloads / 1000000).toFixed(1) + 'M' : '...'}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#888' }}>Exact: {totalDownloads.toLocaleString()}</div>
                    </div>

                    {/* OS Market Share */}
                    {osStats && (
                        <div style={{ paddingBottom: '15px', borderBottom: '1px solid rgba(139, 92, 246, 0.1)', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '2px' }}>OS WARS (MARKET SHARE)</div>
                                <div title="iOS and Android binaries are distributed entirely via App Stores and cannot be tracked on GitHub.">
                                    <dc.Icon icon="info" style={{ width: '12px', height: '12px', color: '#666', cursor: 'help' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(() => {
                                    const osTotal = osStats.windows + osStats.mac + osStats.linux + osStats.android + osStats.ios;
                                    if (osTotal === 0) return null;

                                    const platforms = [
                                        { name: 'Windows', count: osStats.windows, color: '#3b82f6', icon: 'monitor' },
                                        { name: 'macOS', count: osStats.mac, color: '#a855f7', icon: 'command' },
                                        { name: 'Linux', count: osStats.linux, color: '#eab308', icon: 'terminal' },
                                        { name: 'Android', count: osStats.android, color: '#22c55e', icon: 'smartphone' },
                                        { name: 'iOS', count: osStats.ios, color: '#ec4899', icon: 'tablet-smartphone' }
                                    ].sort((a, b) => b.count - a.count);

                                    return platforms.map(p => {
                                        const MathPercent = osTotal > 0 ? ((p.count / osTotal) * 100).toFixed(1) : 0;
                                        const isIOS = p.name === 'iOS';

                                        return (
                                            <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <dc.Icon icon={p.icon} style={{ width: '14px', height: '14px', color: isIOS ? '#555' : p.color }} />
                                                    <div style={{ width: '60px', color: isIOS ? '#555' : '#ccc', fontSize: '0.85rem' }}>{p.name}</div>
                                                    <div style={{ flex: 1, height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                        {!isIOS && <div style={{ width: `${MathPercent}%`, height: '100%', backgroundColor: p.color }}></div>}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', color: isIOS ? '#555' : p.color, fontWeight: isIOS ? 'normal' : 'bold', fontSize: isIOS ? '0.7rem' : '0.85rem', fontStyle: isIOS ? 'italic' : 'normal', minWidth: '45px' }}>
                                                    {isIOS ? 'No Data' : `${MathPercent}%`}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Insider Community */}
                    {betaStats && (
                        <div style={{ paddingBottom: '15px', borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '2px', marginBottom: '12px' }}>THE INSIDER COMMUNITY</div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1, backgroundColor: 'rgba(139,92,246,0.1)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(139,92,246,0.2)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#a78bfa', marginBottom: '4px' }}>CORE FANBASE</div>
                                    <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>{((betaStats.insider / (betaStats.stable + betaStats.insider)) * 100).toFixed(1)}%</div>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>({(betaStats.insider / 1000).toFixed(0)}k DLs)</div>
                                </div>
                                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px' }}>STABLE USERS</div>
                                    <div style={{ fontSize: '1.2rem', color: '#ddd', fontWeight: 'bold' }}>{((betaStats.stable / (betaStats.stable + betaStats.insider)) * 100).toFixed(1)}%</div>
                                    <div style={{ fontSize: '0.7rem', color: '#666' }}>({(betaStats.stable / 1000000).toFixed(1)}M DLs)</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="fullscreen-wrapper" style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '120px',
                height: '120px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                padding: '16px',
                zIndex: 1000
            }}>
                <button
                    className="fullscreen-btn"
                    onClick={onToggleFullTab}
                    style={{
                        ...styles.button,
                        position: 'relative', // Override absolute from styles.button
                        top: 0,
                        right: 0,
                        backgroundColor: isFullTab ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <dc.Icon icon={isFullTab ? "minimize" : "maximize"} />
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.5; text-shadow: 0 0 5px rgba(139,92,246,0.2); }
                    50% { opacity: 1; text-shadow: 0 0 15px rgba(139,92,246,0.8); }
                    100% { opacity: 0.5; text-shadow: 0 0 5px rgba(139,92,246,0.2); }
                }
                .tick line {
                     opacity: 0.3;
                }
                .domain {
                     opacity: 0.5;
                }
                .obsidian-logo-wrapper:hover {
                    transform: scale(1.05) rotate(5deg);
                    filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.5));
                }
                .fullscreen-btn {
                    opacity: 0;
                    transform: scale(0.95);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .fullscreen-wrapper:hover .fullscreen-btn {
                    opacity: 1;
                    transform: scale(1);
                }
                ${styles.scrollablePanel}
            `}</style>
        </div>
    );
}

return { MainComponent };
