# ViewComponent

```jsx
// =================================================================================
//  ACTIONS FLOWS - ActionsManager Workflow Executor
//  Simple wrapper that loads and runs workflows created in ActionsManager
// =================================================================================

const { useState, useCallback, useRef, useEffect, useMemo } = dc;

// =================================================================================
//  NODE RUNTIME - Execution logic for each node type
// =================================================================================

const NodeExecutors = {
  // Command Node - Execute Obsidian commands
  command: async (node, inputs, context) => {
    const commandIdParam = node.params.find(p => p.key === 'commandId');
    const commandId = commandIdParam?.value;
    
    if (!commandId) {
      return { error: 'No command ID specified' };
    }
    
    try {
      // Execute the Obsidian command
      await app.commands.executeCommandById(commandId);
      context.log && context.log(`Executed command: ${commandId}`, 'info');
      return { data: inputs.flow ?? null, executed: true, commandId };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Datacore Query Node
  datacoreQuery: async (node, inputs, context) => {
    const queryParam = node.params.find(p => p.key === 'query');
    if (!queryParam || !queryParam.value) {
      return { error: 'No query specified' };
    }
    
    try {
      const result = dc.api.query(queryParam.value);
      return { data: result, count: result?.length ?? 0 };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Transform Node
  transform: async (node, inputs, context) => {
    const input = inputs.input ?? inputs.data;
    if (!input) return { error: 'No input data' };
    
    const exprParam = node.params.find(p => p.key === 'expression');
    const expr = exprParam?.value || 'item';
    
    try {
      if (Array.isArray(input)) {
        const result = input.map(item => {
          try {
            const func = new Function('item', 'index', 'array', 'inputs', `return ${expr}`);
            return func(item, input.indexOf(item), input, inputs);
          } catch (e) {
            return { error: e.message, item };
          }
        });
        return { data: result };
      } else {
        const func = new Function('item', 'inputs', `return ${expr}`);
        return { data: func(input, inputs) };
      }
    } catch (error) {
      return { error: error.message };
    }
  },

  // Filter Node
  filter: async (node, inputs, context) => {
    const input = inputs.input ?? inputs.data;
    if (!input) return { error: 'No input data' };
    if (!Array.isArray(input)) return { error: 'Input must be an array' };
    
    const condParam = node.params.find(p => p.key === 'condition');
    const condition = condParam?.value || 'true';
    
    try {
      const result = input.filter((item, index) => {
        try {
          const func = new Function('item', 'index', 'array', `return ${condition}`);
          return func(item, index, input);
        } catch (e) {
          console.error('Filter error:', e);
          return false;
        }
      });
      return { data: result, originalCount: input.length, filteredCount: result.length };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Merge Node
  merge: async (node, inputs, context) => {
    try {
      const arrays = Object.values(inputs).filter(v => Array.isArray(v));
      if (arrays.length === 0) return { data: [] };
      
      const merged = arrays.flat();
      return { data: merged, count: merged.length };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Group By Node
  groupBy: async (node, inputs, context) => {
    const input = inputs.input ?? inputs.data;
    if (!input || !Array.isArray(input)) return { error: 'Input must be an array' };
    
    const keyParam = node.params.find(p => p.key === 'key');
    const key = keyParam?.value;
    if (!key) return { error: 'No grouping key specified' };
    
    try {
      const groups = {};
      input.forEach(item => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(item);
      });
      return { data: groups, groupCount: Object.keys(groups).length };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Sort Node
  sort: async (node, inputs, context) => {
    const input = inputs.input ?? inputs.data;
    if (!input || !Array.isArray(input)) return { error: 'Input must be an array' };
    
    const keyParam = node.params.find(p => p.key === 'key');
    const orderParam = node.params.find(p => p.key === 'order');
    const key = keyParam?.value;
    const order = orderParam?.value || 'asc';
    
    try {
      const sorted = [...input].sort((a, b) => {
        const aVal = key ? a[key] : a;
        const bVal = key ? b[key] : b;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return order === 'desc' ? -cmp : cmp;
      });
      return { data: sorted };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Limit Node
  limit: async (node, inputs, context) => {
    const input = inputs.input ?? inputs.data;
    if (!input || !Array.isArray(input)) return { error: 'Input must be an array' };
    
    const countParam = node.params.find(p => p.key === 'count');
    const count = parseInt(countParam?.value) || 10;
    
    return { data: input.slice(0, count), originalCount: input.length, limitedCount: Math.min(count, input.length) };
  },

  // Unique Node
  unique: async (node, inputs, context) => {
    const input = inputs.input ?? inputs.data;
    if (!input || !Array.isArray(input)) return { error: 'Input must be an array' };
    
    const keyParam = node.params.find(p => p.key === 'key');
    const key = keyParam?.value;
    
    try {
      if (key) {
        const seen = new Set();
        const unique = input.filter(item => {
          const val = item[key];
          if (seen.has(val)) return false;
          seen.add(val);
          return true;
        });
        return { data: unique, originalCount: input.length, uniqueCount: unique.length };
      } else {
        const unique = [...new Set(input)];
        return { data: unique, originalCount: input.length, uniqueCount: unique.length };
      }
    } catch (error) {
      return { error: error.message };
    }
  },

  // Log Node
  log: async (node, inputs, context) => {
    const input = inputs.input ?? inputs.data;
    const labelParam = node.params.find(p => p.key === 'label');
    const label = labelParam?.value || node.id;
    
    console.log(`[${label}]`, input);
    context.log && context.log(`Log: ${label}`, 'info');
    
    return { data: input, logged: true };
  },

  // Comment Node (no-op)
  comment: async (node, inputs, context) => {
    return { data: inputs.input ?? null };
  }
};

// =================================================================================
//  WORKFLOW EXECUTOR - Main execution engine
// =================================================================================

class WorkflowExecutor {
  constructor(workflow, logFn) {
    this.workflow = workflow;
    this.log = logFn || console.log;
    this.nodeOutputs = new Map();
    this.executionOrder = [];
    this.cancelled = false;
  }

  // Topological sort to determine execution order
  resolveExecutionOrder() {
    const nodes = this.workflow.nodes;
    const edges = this.workflow.edges;
    
    // Build adjacency list
    const graph = new Map();
    const inDegree = new Map();
    
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });
    
    edges.forEach(edge => {
      const from = typeof edge.from === 'string' ? edge.from : edge.from.id;
      const to = typeof edge.to === 'string' ? edge.to : edge.to.id;
      
      if (graph.has(from) && graph.has(to)) {
        graph.get(from).push(to);
        inDegree.set(to, inDegree.get(to) + 1);
      }
    });
    
    // Find nodes with no dependencies
    const queue = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });
    
    const order = [];
    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current);
      
      const neighbors = graph.get(current) || [];
      neighbors.forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    // Check for cycles
    if (order.length !== nodes.length) {
      throw new Error('Workflow contains circular dependencies');
    }
    
    this.executionOrder = order;
    return order;
  }

  // Get inputs for a node from connected edges
  getNodeInputs(nodeId) {
    const edges = this.workflow.edges.filter(e => {
      const to = typeof e.to === 'string' ? e.to : e.to.id;
      return to === nodeId;
    });
    
    const inputs = {};
    edges.forEach(edge => {
      const from = typeof edge.from === 'string' ? edge.from : edge.from.id;
      const output = this.nodeOutputs.get(from);
      
      if (output && output.data !== undefined) {
        // Use connection name or default to 'input'
        const inputName = edge.to?.port || 'input';
        inputs[inputName] = output.data;
      }
    });
    
    return inputs;
  }

  // Execute a single node
  async executeNode(nodeId) {
    if (this.cancelled) throw new Error('Execution cancelled');
    
    const node = this.workflow.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);
    
    this.log(`Executing: ${node.type} (${nodeId})`, 'info');
    
    // Get executor for this node type
    const executor = NodeExecutors[node.type];
    if (!executor) {
      this.log(`No executor for node type: ${node.type}`, 'warning');
      return { error: `Unknown node type: ${node.type}` };
    }
    
    // Get inputs from connected nodes
    const inputs = this.getNodeInputs(nodeId);
    
    try {
      // Execute the node
      const startTime = Date.now();
      const result = await executor(node, inputs, { log: this.log });
      const duration = Date.now() - startTime;
      
      // Store output
      this.nodeOutputs.set(nodeId, result);
      
      if (result.error) {
        this.log(`Error in ${node.type}: ${result.error}`, 'error');
      } else {
        this.log(`Complete: ${node.type} (${duration}ms)`, 'success');
      }
      
      return result;
    } catch (error) {
      this.log(`Exception in ${node.type}: ${error.message}`, 'error');
      const errorResult = { error: error.message };
      this.nodeOutputs.set(nodeId, errorResult);
      return errorResult;
    }
  }

  // Execute entire workflow
  async execute() {
    try {
      this.log(`Starting workflow execution...`, 'info');
      this.log(`${this.workflow.nodes.length} nodes, ${this.workflow.edges.length} edges`, 'info');
      
      // Resolve execution order
      const order = this.resolveExecutionOrder();
      this.log(`Execution order: ${order.join(' → ')}`, 'debug');
      
      // Execute nodes in order
      const startTime = Date.now();
      for (const nodeId of order) {
        await this.executeNode(nodeId);
      }
      const totalDuration = Date.now() - startTime;
      
      // Collect results
      const results = {};
      this.nodeOutputs.forEach((output, nodeId) => {
        results[nodeId] = output;
      });
      
      this.log(`Workflow complete! (${totalDuration}ms)`, 'success');
      return { success: true, results, duration: totalDuration };
      
    } catch (error) {
      this.log(`Workflow failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  cancel() {
    this.cancelled = true;
    this.log(`Cancellation requested`, 'warning');
  }
}

// =================================================================================
//  UI COMPONENT
// =================================================================================

// --- DOM Traversal Utilities ---
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

const MAX_LOG_ENTRIES = 500;

function ActionsFlowsView() {
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  
  const currentPath = dc.useCurrentPath();
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowData, setWorkflowData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecutor, setCurrentExecutor] = useState(null);
  const [isFullTab, setIsFullTab] = useState(true);
  const logRef = useRef([]);
  const [, forceUpdate] = useState(0);

  const log = useCallback((message, kind = 'info') => {
    logRef.current.push({ t: Date.now(), kind, message });
    if (logRef.current.length > MAX_LOG_ENTRIES) logRef.current.shift();
    forceUpdate(Date.now());
  }, []);

  // Load workflows from ActionsManager
  const loadWorkflows = useCallback(async () => {
    try {
      if (!currentPath) return;
      
      // Check both locations: .datacore/flows/ and relative _resources/flows/
      const locations = [
        '.datacore/flows/',
        (() => {
          const folderPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
          return folderPath + '/_resources/flows/';
        })()
      ];
      
      let allWorkflows = [];
      
      for (const workflowsDir of locations) {
        try {
          const exists = await app.vault.adapter.exists(workflowsDir);
          if (!exists) continue;

          const { files } = await app.vault.adapter.list(workflowsDir);
          const jsonFiles = files.filter(f => f.endsWith('.json'));

          const workflowList = await Promise.all(
            jsonFiles.map(async (path) => {
              try {
                const content = await app.vault.adapter.read(path);
                const data = JSON.parse(content);
                return {
                  path,
                  name: path.split('/').pop().replace('.json', ''),
                  nodes: data.nodes?.length || 0,
                  edges: data.edges?.length || 0,
                  types: data.runtime?.nodeTypes || []
                };
              } catch (e) {
                return null;
              }
            })
          );
          
          allWorkflows.push(...workflowList.filter(w => w !== null));
        } catch (e) {
          // Skip this location if it fails
          continue;
        }
      }

      setWorkflows(allWorkflows);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  }, [currentPath]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Full tab mode setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    
    const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }
    
    const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
    
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
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  // Select and load workflow
  const selectWorkflow = useCallback(async (path) => {
    try {
      const content = await app.vault.adapter.read(path);
      const data = JSON.parse(content);
      const workflow = workflows.find(w => w.path === path);
      
      setSelectedWorkflow(workflow);
      setWorkflowData(data);
      log(`Loaded: ${workflow.name}`);
    } catch (error) {
      log(`Failed to load: ${error.message}`, 'error');
    }
  }, [workflows, log]);

  // Execute workflow
  const runWorkflow = useCallback(async () => {
    if (!workflowData) return;

    setIsRunning(true);
    logRef.current = [];

    try {
      log(`Executing: ${selectedWorkflow.name}`);
      
      const executor = new WorkflowExecutor(workflowData, log);
      setCurrentExecutor(executor);

      const result = await executor.execute();

      if (result.success) {
        log(`Complete! (${result.duration}ms)`, 'success');
        console.log('Workflow Results:', result.results);
      } else {
        log(`Failed: ${result.error}`, 'error');
      }
    } catch (error) {
      log(`Error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
      setCurrentExecutor(null);
    }
  }, [workflowData, selectedWorkflow, log]);

  const stopWorkflow = useCallback(() => {
    currentExecutor?.cancel();
    log('Stopped', 'warning');
  }, [currentExecutor, log]);

  const copyLogToClipboard = useCallback(() => {
    const logText = logRef.current.map(entry => {
      const time = new Date(entry.t).toLocaleTimeString();
      const kind = entry.kind.toUpperCase().padEnd(8);
      return `[${time}] [${kind}] ${entry.message}`;
    }).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      // Show temporary success message
      const originalLength = logRef.current.length;
      log('Log copied to clipboard!', 'success');
      setTimeout(() => {
        if (logRef.current.length > originalLength) {
          logRef.current.pop();
          forceUpdate(Date.now());
        }
      }, 2000);
    });
  }, [log]);

  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };

  const handleEnterFullTab = () => setIsFullTab(true);

  const logColors = {
    error: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b",
    info: "#E5E5E5"
  };

  const logIcons = {
    error: "x-circle",
    success: "check-circle",
    warning: "alert-triangle",
    info: "info",
    debug: "code"
  };

  const hoverEffectStyle = `
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
  `;

  // Compact mode
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
        border: "1px dashed var(--background-modifier-border)",
        borderRadius: "8px",
        backgroundColor: "var(--background-primary-alt)",
      }}>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px" }}>
          Workflow Runner is in compact mode.
        </p>
        <button
          onClick={handleEnterFullTab}
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--text-on-accent)",
            backgroundColor: "var(--interactive-accent)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <style>{hoverEffectStyle}</style>
      <div style={{ 
        position: "relative",
        height: "100%", 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        padding: "16px", 
        background: '#1a1a1a', 
        color: '#eee'
      }} className={uniqueWrapperClass}>
        {/* Exit Full Tab Icon */}
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "var(--text-faint)",
            userSelect: "none",
            cursor: "pointer",
            zIndex: 10,
          }}
          className="subtle-icon"
          onClick={handleExitFullTab}
        >
          &lt;/&gt;
          <span className="exit-tooltip" style={{
            visibility: "hidden",
            opacity: 0,
            backgroundColor: "var(--background-secondary-alt)",
            color: "var(--text-normal)",
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
            border: "1px solid var(--background-modifier-border)",
          }}>
            Close Full Mode
          </span>
        </div>

        {/* Header */}
        <div>
        <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <dc.Icon icon="zap" style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
          Workflow Runner
        </h2>
        <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '13px' }}>
          Execute workflows from ActionsManager
        </p>
      </div>

      {/* Workflow Selection */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          value={selectedWorkflow?.path || ''}
          onChange={(e) => selectWorkflow(e.target.value)}
          disabled={isRunning}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: '#2a2a2a',
            color: '#eee',
            border: '1px solid #444',
            borderRadius: '6px',
            fontSize: '14px',
            lineHeight: '1.5',
            height: 'auto',
            minHeight: '42px'
          }}
        >
          <option value="">Select workflow...</option>
          {workflows.map(w => (
            <option key={w.path} value={w.path}>
              {w.name} ({w.nodes} nodes)
            </option>
          ))}
        </select>

        <button
          onClick={loadWorkflows}
          disabled={isRunning}
          style={{
            padding: '10px 14px',
            background: '#2a2a2a',
            color: '#aaa',
            border: '1px solid #444',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          <dc.Icon icon="refresh-cw" style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Workflow Info */}
      {selectedWorkflow && (
        <div style={{ 
          padding: '12px', 
          background: '#252525', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#aaa',
          display: 'flex',
          gap: '16px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <dc.Icon icon="box" style={{ width: '14px', height: '14px' }} />
            {selectedWorkflow.nodes} nodes
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <dc.Icon icon="git-branch" style={{ width: '14px', height: '14px' }} />
            {selectedWorkflow.edges} edges
          </span>
          {selectedWorkflow.types.length > 0 && (
            <span style={{ color: '#8b5cf6' }}>{selectedWorkflow.types.join(', ')}</span>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={runWorkflow}
          disabled={!workflowData || isRunning}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: (!workflowData || isRunning) ? 'not-allowed' : 'pointer',
            background: (!workflowData || isRunning) ? '#333' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <dc.Icon icon={isRunning ? "loader-2" : "play"} style={{ width: '16px', height: '16px' }} />
          {isRunning ? 'Running...' : 'Run'}
        </button>

        {isRunning && (
          <button
            onClick={stopWorkflow}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <dc.Icon icon="square" style={{ width: '16px', height: '16px' }} />
            Stop
          </button>
        )}
      </div>

      {/* Log */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        background: '#111',
        borderRadius: '6px',
        border: '1px solid #333',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '10px 12px', 
          borderBottom: '1px solid #333',
          fontSize: '13px',
          fontWeight: '600',
          color: '#888',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Execution Log</span>
          {logRef.current.length > 0 && (
            <button
              onClick={copyLogToClipboard}
              style={{
                padding: '4px 8px',
                background: '#222',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#aaa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px'
              }}
            >
              <dc.Icon icon="copy" style={{ width: '12px', height: '12px' }} />
              Copy Log
            </button>
          )}
        </div>
        <div style={{
          flex: 1,
          padding: '12px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '11px'
        }}>
          {logRef.current.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center', paddingTop: '20px' }}>
              Select a workflow and click Run
            </div>
          ) : (
            logRef.current.map((entry, i) => (
              <div
                key={`${entry.t}-${i}`}
                style={{
                  color: logColors[entry.kind] || logColors.info,
                  marginBottom: '4px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: '#555', flexShrink: 0 }}>
                  {new Date(entry.t).toLocaleTimeString()}
                </span>
                <dc.Icon 
                  icon={logIcons[entry.kind] || logIcons.info} 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    flexShrink: 0,
                    color: logColors[entry.kind] || logColors.info
                  }} 
                />
                <span style={{ flex: 1 }}>{entry.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

return { BasicView: ActionsFlowsView };
```
