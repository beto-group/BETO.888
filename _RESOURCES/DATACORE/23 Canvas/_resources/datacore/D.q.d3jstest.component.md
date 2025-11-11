

	
# ViewComponent

```jsx
const { useRef, useEffect, useState } = dc;

function D3GraphView() {
  const chartRef = useRef(null);
  const [activeTab, setActiveTab] = useState('network'); // network, force, flow
  const [isLoading, setIsLoading] = useState(true);
  
  // Full-tab mode state
  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
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
      setIsFullTab(false);
      return;
    }

    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;

    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement("div");
    stateRefs.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.placeholder, container);

    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };

    if (stateRefs.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }

    contentWrapper.appendChild(container);

    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "auto",
    });

    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(
          container,
          stateRefs.placeholder
        );
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static"
            ? ""
            : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  // Cached script loader function
  async function loadScript(src) {
    const cacheDir = ".datacore/script_cache";
    const isUrl = /^https?:\/\//.test(src);
    
    if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
      throw new Error("Datacore context 'dc' with vault adapter is required for loadScript.");
    }
    const adapter = dc.app.vault.adapter;

    return new Promise(async (resolve, reject) => {
      const scriptElement = document.createElement("script");
      scriptElement.async = true;

      try {
        if (isUrl) {
          // URL Handling with Cache
          const safeFilename = src
            .replace(/^https?:\/\//, '')
            .replace(/[\/\\?%*:|"<>]/g, '_') + ".js";
          const cachePath = `${cacheDir}/${safeFilename}`;

          let scriptText = null;

          // Check if cached file exists
          const cachedExists = await adapter.exists(cachePath);

          if (cachedExists) {
            console.log(`[D3JS] Loading script from cache: ${cachePath}`);
            try {
              scriptText = await adapter.read(cachePath);
            } catch (readError) {
              console.warn(`[D3JS] Failed to read cache, refetching. Error:`, readError);
            }
          }

          // Fetch from network if not cached
          if (scriptText === null) {
            console.log(`[D3JS] Fetching script from network: ${src}`);
            const response = await fetch(src);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status} for ${src}`);
            }
            scriptText = await response.text();

            // Write to cache
            try {
              if (!(await adapter.exists(cacheDir))) {
                console.log(`[D3JS] Creating script cache directory: ${cacheDir}`);
                await adapter.mkdir(cacheDir);
              }
              console.log(`[D3JS] Writing script to cache: ${cachePath}`);
              await adapter.write(cachePath, scriptText);
            } catch (writeError) {
              console.warn(`[D3JS] Failed to write script to cache. Error:`, writeError);
            }
          }

          // Execute script content
          try {
            scriptElement.textContent = scriptText;
            document.body.appendChild(scriptElement);
            console.log(`[D3JS] Script executed from ${cachedExists && scriptText ? 'cache' : 'network'}: ${src}`);
            resolve(scriptElement);
          } catch (execError) {
            console.error(`[D3JS] Error executing script content:`, execError);
            reject(execError);
          }
        } else {
          // Direct URL loading (fallback)
          scriptElement.src = src;
          scriptElement.onload = () => resolve(scriptElement);
          scriptElement.onerror = () => reject(new Error(`Failed to load script ${src}`));
          document.head.appendChild(scriptElement);
        }
      } catch (error) {
        console.error(`[D3JS] Failed to load script ${src}:`, error);
        if (scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement);
        }
        reject(error);
      }
    });
  }

  // Load D3.js with caching
  useEffect(() => {
    async function loadDependenciesAndRenderGraph() {
      // Check if d3 is already loaded.
      if (!window.d3) {
        console.log("D3 not found. Loading D3.js from CDN (with caching)...");
        try {
          // Load D3.js v7 from CDN - loadScript will cache it locally
          await loadScript("https://d3js.org/d3.v7.min.js");
          console.log("D3.js loaded:", window.d3);
        } catch (error) {
          console.error("Failed to load D3.js:", error);
          setIsLoading(false);
          return;
        }
      } else {
        console.log("D3.js already loaded:", window.d3);
      }
      setIsLoading(false);
    }

    loadDependenciesAndRenderGraph();
  }, []);

  useEffect(() => {
    if (isLoading || !window.d3 || !isFullTab) return;
    
    if (activeTab === 'network') {
      renderNetworkGraph();
    } else if (activeTab === 'force') {
      renderForceGraph();
    } else if (activeTab === 'flow') {
      renderFlowField();
    }
  }, [activeTab, isLoading, isFullTab]);

  function renderNetworkGraph() {
    const d3 = window.d3;
    d3.select(chartRef.current).selectAll("*").remove();

    const width = 800;
    const height = 600;

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#000");

    // Generate network nodes
    const nodes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    }));

    // Create connections based on proximity
    const links = [];
    nodes.forEach((source, i) => {
      nodes.slice(i + 1).forEach(target => {
        const dx = source.x - target.x;
        const dy = source.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          links.push({ source, target, distance: dist });
        }
      });
    });

    // Draw links
    const linkGroup = svg.append("g");
    
    // Draw nodes
    const nodeGroup = svg.append("g");
    const nodeElements = nodeGroup
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", "#9d7cce")
      .attr("opacity", 0.8)
      .style("filter", "drop-shadow(0 0 4px #9d7cce)");

    // Animation loop
    function animate() {
      // Update node positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off walls
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
      });

      // Update connections
      links.length = 0;
      nodes.forEach((source, i) => {
        nodes.slice(i + 1).forEach(target => {
          const dx = source.x - target.x;
          const dy = source.y - target.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            links.push({ source, target, distance: dist });
          }
        });
      });

      // Redraw links
      linkGroup.selectAll("line").remove();
      linkGroup
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("stroke", "#b19cd9")
        .attr("stroke-width", 1)
        .attr("opacity", d => 1 - (d.distance / 150));

      // Update node positions
      nodeElements
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      requestAnimationFrame(animate);
    }

    animate();
  }

  function renderForceGraph() {
    const d3 = window.d3;
    d3.select(chartRef.current).selectAll("*").remove();

    const width = 800;
    const height = 600;

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#000");

    // Create hierarchical data
    const nodes = [
      { id: 0, group: 0, r: 15 },
      ...Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        group: Math.floor(Math.random() * 3) + 1,
        r: Math.random() * 5 + 3
      }))
    ];

    const links = nodes.slice(1).map(node => ({
      source: 0,
      target: node.id,
      value: Math.random()
    }));

    // Add some inter-node connections
    for (let i = 0; i < 15; i++) {
      links.push({
        source: Math.floor(Math.random() * 30) + 1,
        target: Math.floor(Math.random() * 30) + 1,
        value: Math.random()
      });
    }

    const colors = ["#9d7cce", "#b19cd9", "#8a6bb8", "#7a5ba8"];

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.r + 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", d => Math.sqrt(d.value) * 2);

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.r)
      .attr("fill", d => colors[d.group])
      .attr("opacity", 0.9)
      .style("filter", d => d.id === 0 ? "drop-shadow(0 0 8px #9d7cce)" : "drop-shadow(0 0 3px #b19cd9)")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  }

  function renderFlowField() {
    const d3 = window.d3;
    d3.select(chartRef.current).selectAll("*").remove();

    const width = 800;
    const height = 600;

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#000");

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      trail: []
    }));

    const particleElements = svg.append("g")
      .selectAll("circle")
      .data(particles)
      .join("circle")
      .attr("r", 2)
      .attr("fill", "#9d7cce")
      .attr("opacity", 0.7)
      .style("filter", "drop-shadow(0 0 2px #9d7cce)");

    const trailGroup = svg.append("g");

    let time = 0;

    function animate() {
      time += 0.01;

      particles.forEach(p => {
        // Flow field based on sine/cosine
        const angle = Math.sin(p.x * 0.01 + time) * Math.cos(p.y * 0.01 + time) * Math.PI * 2;
        p.vx = Math.cos(angle) * 2;
        p.vy = Math.sin(angle) * 2;

        // Store trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 20) p.trail.shift();

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });

      // Update particles
      particleElements
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      // Draw trails
      trailGroup.selectAll("path").remove();
      particles.forEach(p => {
        if (p.trail.length > 1) {
          const line = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveCardinal);

          trailGroup.append("path")
            .datum(p.trail)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "#b19cd9")
            .attr("stroke-width", 1)
            .attr("opacity", 0.3);
        }
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // Handle full-tab exit
  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };

  // Compact mode view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed rgba(157, 124, 206, 0.3)",
        borderRadius: "8px",
        backgroundColor: "#0a0a0a"
      }}>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          D3.js Visualization is in compact mode
        </p>
        <button
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#fff",
            backgroundColor: "#9d7cce",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            letterSpacing: "1px",
            textTransform: "uppercase"
          }}
          onClick={() => setIsFullTab(true)}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  // Full-tab mode view
  return (
    <div ref={containerRef}>
      <style>{`
        .${uniqueWrapperClass} .subtle-icon {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        .${uniqueWrapperClass}:hover .subtle-icon {
          opacity: 0.7;
          transform: scale(1);
        }
        .${uniqueWrapperClass} .subtle-icon:hover {
          opacity: 1;
        }
        .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
      
      <div 
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: "#000",
          color: "#9d7cce",
          fontFamily: "monospace",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative"
        }}
        className={uniqueWrapperClass}
      >
        {/* Exit Full Tab Icon */}
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#aaa",
            userSelect: "none",
            cursor: "pointer",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          className="subtle-icon"
          onClick={handleExitFullTab}
        >
          <dc.Icon icon="x" style={{ fontSize: "20px" }} />
          <span className="exit-tooltip" style={{
            visibility: "hidden",
            opacity: 0,
            backgroundColor: "#0a0a0a",
            color: "#9d7cce",
            textAlign: "center",
            borderRadius: "4px",
            padding: "5px 10px",
            position: "absolute",
            zIndex: 1,
            top: "50%",
            right: "120%",
            transform: "translateY(-50%)",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            border: "1px solid rgba(157, 124, 206, 0.3)",
            transition: "opacity 0.2s, visibility 0.2s"
          }}>
            Exit Full Tab
          </span>
        </div>

      {/* Header */}
      <div style={{
        padding: "20px 30px",
        borderBottom: "1px solid rgba(157, 124, 206, 0.2)",
        backgroundColor: "#0a0a0a"
      }}>
        <h1 style={{
          margin: 0,
          fontSize: "1.5rem",
          fontWeight: "300",
          letterSpacing: "4px",
          textTransform: "uppercase",
          textShadow: "0 0 20px rgba(157, 124, 206, 0.4)"
        }}>D3.JS Visualization</h1>
        <p style={{
          margin: "8px 0 0 0",
          fontSize: "0.75rem",
          color: "#666",
          letterSpacing: "2px"
        }}>ENIGMATIC DATA RENDERING</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "2px",
        padding: "20px 30px",
        backgroundColor: "#0a0a0a",
        borderBottom: "1px solid rgba(157, 124, 206, 0.1)"
      }}>
        <button
          onClick={() => setActiveTab('network')}
          style={{
            padding: "10px 24px",
            backgroundColor: activeTab === 'network' ? "rgba(157, 124, 206, 0.15)" : "transparent",
            color: activeTab === 'network' ? "#9d7cce" : "#666",
            border: activeTab === 'network' ? "1px solid rgba(157, 124, 206, 0.4)" : "1px solid #333",
            borderRadius: "2px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.8rem",
            letterSpacing: "2px",
            textTransform: "uppercase",
            transition: "all 0.3s ease",
            boxShadow: activeTab === 'network' ? "0 0 15px rgba(157, 124, 206, 0.2)" : "none"
          }}
        >
          Network
        </button>
        <button
          onClick={() => setActiveTab('force')}
          style={{
            padding: "10px 24px",
            backgroundColor: activeTab === 'force' ? "rgba(157, 124, 206, 0.15)" : "transparent",
            color: activeTab === 'force' ? "#9d7cce" : "#666",
            border: activeTab === 'force' ? "1px solid rgba(157, 124, 206, 0.4)" : "1px solid #333",
            borderRadius: "2px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.8rem",
            letterSpacing: "2px",
            textTransform: "uppercase",
            transition: "all 0.3s ease",
            boxShadow: activeTab === 'force' ? "0 0 15px rgba(157, 124, 206, 0.2)" : "none"
          }}
        >
          Force Graph
        </button>
        <button
          onClick={() => setActiveTab('flow')}
          style={{
            padding: "10px 24px",
            backgroundColor: activeTab === 'flow' ? "rgba(157, 124, 206, 0.15)" : "transparent",
            color: activeTab === 'flow' ? "#9d7cce" : "#666",
            border: activeTab === 'flow' ? "1px solid rgba(157, 124, 206, 0.4)" : "1px solid #333",
            borderRadius: "2px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.8rem",
            letterSpacing: "2px",
            textTransform: "uppercase",
            transition: "all 0.3s ease",
            boxShadow: activeTab === 'flow' ? "0 0 15px rgba(157, 124, 206, 0.2)" : "none"
          }}
        >
          Flow Field
        </button>
      </div>

      {/* Visualization Area */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative"
      }}>
        {isLoading ? (
          <div style={{
            color: "#9d7cce",
            fontSize: "1rem",
            letterSpacing: "3px",
            animation: "pulse 2s ease-in-out infinite"
          }}>
            Loading D3.js...
          </div>
        ) : (
          <div ref={chartRef} style={{
            boxShadow: "0 0 40px rgba(157, 124, 206, 0.2)",
            border: "1px solid rgba(157, 124, 206, 0.1)",
            borderRadius: "2px"
          }} />
        )}
      </div>

      {/* Info Footer */}
      <div style={{
        padding: "15px 30px",
        borderTop: "1px solid rgba(157, 124, 206, 0.1)",
        backgroundColor: "#0a0a0a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{
          fontSize: "0.7rem",
          color: "#555",
          letterSpacing: "1px"
        }}>
          {activeTab === 'network' && "Real-time animated network with proximity-based connections"}
          {activeTab === 'force' && "Interactive force-directed graph • Drag nodes to interact"}
          {activeTab === 'flow' && "Particle flow field with dynamic trails"}
        </div>
        <div style={{
          fontSize: "0.7rem",
          color: "#666",
          letterSpacing: "2px"
        }}>
          D3.js v7
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        button:hover {
          background-color: rgba(157, 124, 206, 0.1) !important;
          border-color: rgba(157, 124, 206, 0.3) !important;
        }
      `}</style>
      </div>
    </div>
  );
}

return { View: D3GraphView };

```