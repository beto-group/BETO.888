


# ViewComponent

```jsx
const { useRef, useEffect } = dc;

function D3GraphView() {
  const chartRef = useRef(null);

  // Helper function to load external scripts dynamically.
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script ${src}`));
      document.head.appendChild(script);
    });
  }

  useEffect(() => {
    async function loadDependenciesAndRenderGraph() {
      // Check if d3 is already loaded.
      if (!window.d3) {
        console.log("D3 not found. Loading D3.js from CDN...");
        try {
          // Load D3.js v7 from its official CDN.
          await loadScript("https://d3js.org/d3.v7.min.js");
          console.log("D3.js loaded:", window.d3);
        } catch (error) {
          console.error("Failed to load D3.js:", error);
          return;
        }
      } else {
        console.log("D3.js already loaded:", window.d3);
      }
      renderGraph();
    }

    loadDependenciesAndRenderGraph();
  }, []);

  function renderGraph() {
    const d3 = window.d3; // retrieve the library from the global object

    // Example data for a simple bar chart.
    const data = [10, 15, 30, 40, 20];

    // Clear any previous chart if present.
    d3.select(chartRef.current).selectAll("*").remove();

    // Dimensions and margins of the SVG container.
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Create the SVG container.
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Create the X-scale (using an ordinal band scale).
    const xScale = d3
      .scaleBand()
      .domain(data.map((d, i) => i))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    // Create the Y-scale (using a linear scale).
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Create the bars.
    svg.append("g")
      .attr("fill", "steelblue")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d, i) => xScale(i))
      .attr("y", d => yScale(d))
      .attr("height", d => yScale(0) - yScale(d))
      .attr("width", xScale.bandwidth());

    // Add the X-axis.
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(i => i + 1).tickSizeOuter(0));

    // Add the Y-axis.
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));
  }

  return (
    <div>
      <div ref={chartRef} />
    </div>
  );
}

return { D3GraphView };

```