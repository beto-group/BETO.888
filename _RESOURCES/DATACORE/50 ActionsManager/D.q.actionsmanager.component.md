

# ViewComponent

```jsx
// =================================================================================
//  SETUP: Destructure React/Datacore dependencies
// =================================================================================
const { useState, useRef, useEffect, useMemo, useCallback } = dc;
const filename = dc.resolvePath("D.q.actionsmanager.component.md");

// =================================================================================
//  MODULE IMPORTS
// =================================================================================
const { Constants, Utils, Logic } = await dc.require(dc.headerLink(filename, "Logic"));
const { Hooks } = await dc.require(dc.headerLink(filename, "Hooks"));
const { jsonReplacer, ResultItem, TagHelper, FolderHelper, FileHelper, GenericPropertyHelper, ComparisonOperatorHelper, PromptModal, ResizeHandle, FloatingOrb } = await dc.require(dc.headerLink(filename, "UI_Components"));
const {  DatacoreQueryEditor, OutputViewerNode, CanvasViewerContent } = await dc.require(dc.headerLink(filename, "NodeComponents"));
const { PalettePanel, InspectorPanel, SavedFlowsPanel, LeftPanel } = await dc.require(dc.headerLink(filename, "PanelComponents"));
const { CanvasView } = await dc.require(dc.headerLink(filename, "CanvasComponents"));


// =================================================================================
//  SHARED CANVAS HELPERS
// =================================================================================
function edgeEndId(end) {
  return typeof end === "string" ? end : end?.id;
}

function findInnermostParentLoop(nodeId, nodes, edges) {
  const loopNodes = nodes.filter(n => n.type === 'loop.forEach' || n.type === 'while' || n.type === 'loop.for');
  if (loopNodes.length === 0) return null;

  const loopBodyCache = new Map();
  const getBodyNodes = (loopId) => {
    if (!loopBodyCache.has(loopId)) {
      loopBodyCache.set(loopId, findLoopBodyNodes(loopId, nodes, edges));
    }
    return loopBodyCache.get(loopId);
  };

  const parentLoops = loopNodes.filter(loop => {
    if (loop.id === nodeId) return false;
    const bodyNodes = getBodyNodes(loop.id);
    return bodyNodes.has(nodeId);
  });

  if (parentLoops.length === 0) return null;
  if (parentLoops.length === 1) return parentLoops[0];

  let innermostLoop = null;
  for (const p1 of parentLoops) {
    let isInnermost = true;
    for (const p2 of parentLoops) {
      if (p1.id === p2.id) continue;
      const p1Body = getBodyNodes(p1.id);
      if (p1Body.has(p2.id)) {
        isInnermost = false;
        break;
      }
    }
    if (isInnermost) {
      innermostLoop = p1;
      break;
    }
  }
  return innermostLoop || parentLoops[0];
}

function findLoopBodyNodes(loopNodeId, nodes, edges) {
  const adj = new Map();
  edges.forEach(e => {
    if (e.isPromoted) return;
    const from = edgeEndId(e.from);
    const to = edgeEndId(e.to);
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
  });

  const startNode = nodes.find(n => n.id === loopNodeId);
  if (!startNode || (startNode.type !== 'loop.forEach' && startNode.type !== 'while' && startNode.type !== 'loop.for')) return new Set();
  
  const outgoing = edges.filter(e => edgeEndId(e.from) === loopNodeId && !e.isPromoted);
  if (outgoing.length === 0) return new Set();

  const bodyStartNodeId = edgeEndId(outgoing[0].to);
  if (!bodyStartNodeId) return new Set();

  const bodyNodes = new Set();
  const q = [bodyStartNodeId];
  const visited = new Set([loopNodeId]);

  let safety = 0;
  const maxSteps = nodes.length + 5;
  while (q.length > 0 && safety++ < maxSteps) {
    const currentId = q.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    bodyNodes.add(currentId);

    const children = adj.get(currentId) || [];
    for (const childId of children) {
      if (childId !== loopNodeId) q.push(childId);
    }
  }
  return bodyNodes;
}

// =================================================================================
//  MODULE: Components (Placeholder for organization)
// =================================================================================
const Components = {};

// =================================================================================
//  CORE APPLICATION: FlowBuilder
// =================================================================================
const FlowBuilder = ({ screenHelperRef, showLeft, setShowLeft, showRight, setShowRight, hostRef, dragging, setDragging }) => {
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState({ text: "", tokens: [] });
  const searchRef = useRef(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeSuggest, setActiveSuggest] = useState(0);
  const debounceRef = useRef(0);
  const dynamicCommands = useMemo(Logic.buildDynamicCommandBlocks, []);
  const [recentCommandIds, setRecentCommandIds] = Hooks.usePersistentState("fb.palette.recent", []);
  const [openGroups, setOpenGroups] = Hooks.usePersistentState("fb.palette.groupsOpen", {});
  const [pinnedGroups, setPinnedGroups] = Hooks.usePersistentState("fb.palette.pins", []);
  
  const normalizeNodesForLoad = (nodes) => (nodes || []).map(n => ({ ...n, w: n.w ?? n.width ?? (n.type === 'comment' ? 200 : 240), height: n.height ?? n.h ?? (n.type === 'comment' ? 120 : 100) }));
  const normalizeEdgesForLoad = (edges) => (edges || []).map(e => ({
      ...e,
      from: typeof e.from === 'string' ? { id: e.from } : e.from,
      to: typeof e.to === 'string' ? { id: e.to } : e.to,
  }));

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  const [selected, setSelected] = useState({ type: null, id: null });
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const selectedSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);
  const [connecting, setConnecting] = useState(null);
  const [connectionDrag, setConnectionDrag] = useState(null);
  const [pan, setPan] = Hooks.usePersistentState("fb.canvas.pan", { x: 0, y: 0 });
  const [scale, setScale] = Hooks.usePersistentState("fb.canvas.scale", 1);
  const [snap, setSnap] = Hooks.usePersistentState("fb.canvas.snap", true);
  const GRID = 16;
  const [marquee, setMarquee] = useState(null);
  const [mouseWorld, setMouseWorld] = useState({ x: 0, y: 0 });
  const [runLog, setRunLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const cancelRunRef = useRef({ cancel: false });
  const canvasRef = useRef(null); const contentRef = useRef(null); const initialSizesRef = useRef(null); const spaceDownRef = useRef(false); const rootRef = useRef(null);
  const history = useRef({ past: [], future: [] });
  const [panelSizes, setPanelSizes] = Hooks.usePersistentState("fb.ui.panels", { left: 300, right: 360 });
  const [orbPos, setOrbPos] = Hooks.usePersistentState("fb.orb.pos", { x: 20, y: 20 });
  const [savedFlows, setSavedFlows] = useState([]);
  const [currentFlowId, setCurrentFlowId] = Hooks.usePersistentState("fb.graph.currentId", null);
  const [isFlowsLoading, setIsFlowsLoading] = useState(true);
  const saveDebounceTimer = useRef(null);
  const [nodeRunStatus, setNodeRunStatus] = useState({});
  const [promptState, setPromptState] = useState({ isOpen: false });
  const [connectionMenu, setConnectionMenu] = useState(null);
  const [ghostNode, setGhostNode] = useState(null);
  const [nodeOutputData, setNodeOutputData] = useState({});
  const [flowGeneration, setFlowGeneration] = useState(0);
  const [leftPanelTab, setLeftPanelTab] = Hooks.usePersistentState("fb.ui.left.tab", 'flows');

  const isInitialized = useRef(false);

  // Hide status bar at bottom right
  useEffect(() => {
    const statusBar = document.querySelector('body > .app-container .status-bar');
    if (statusBar) {
      const originalDisplay = statusBar.style.display;
      statusBar.style.display = 'none';
      
      return () => {
        const statusBarToRestore = document.querySelector('body > .app-container .status-bar');
        if (statusBarToRestore) {
          statusBarToRestore.style.display = originalDisplay;
        }
      };
    }
  }, []);

  const pushHistory = useCallback(snap => { history.current.past.push(snap); history.current.future = []; }, []);
  const snapshot = useCallback(() => ({ nodes: JSON.parse(JSON.stringify(nodes, jsonReplacer)), edges: JSON.parse(JSON.stringify(edges, jsonReplacer)) }), [nodes, edges]);

  function rect(n) {
    return {
      x: n.x ?? 0,
      y: n.y ?? 0,
      w: n.w ?? n.width ?? (n.type === 'comment' ? 200 : 240),
      h: n.height ?? n.h ?? (n.type === 'comment' ? 120 : 100),
    };
  }

  const viewToWorld = useCallback((px, py) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rectc = canvasRef.current.getBoundingClientRect();
    return { x: (px - rectc.left - pan.x) / scale, y: (py - rectc.top - pan.y) / scale };
  }, [pan.x, pan.y, scale]);
  
  const loadSavedFlows = useCallback(async () => {
    setIsFlowsLoading(true);
    try {
      if (!await app.vault.adapter.exists(Constants.BASE_FLOW_DIR)) {
        await app.vault.adapter.mkdir(Constants.BASE_FLOW_DIR);
      }
      const { files } = await app.vault.adapter.list(Constants.BASE_FLOW_DIR);
      const flowItems = files
        .filter(file => file.endsWith('.json'))
        .map(file => ({ id: file.split('/').pop(), title: file.split('/').pop().replace('.json', '') }))
        .sort((a, b) => a.title.localeCompare(b.title));
      setSavedFlows(flowItems);
      return flowItems;
    } catch (e) {
      console.error("Failed to load saved flows:", e);
      setSavedFlows([]);
      return [];
    } finally {
      setIsFlowsLoading(false);
    }
  }, []);

  const saveFlowData = useCallback(async (flowId, flowNodes, flowEdges) => {
    if (!flowId) {
        console.error("saveFlowData called with no flowId.");
        return;
    }
    try {
      const nodesToSave = flowNodes ?? nodes;
      const edgesToSave = flowEdges ?? edges;
      
      // Create runtime-ready format
      const flowData = {
        // Editor metadata
        savedAt: new Date().toISOString(),
        version: "1.0",
        
        // Runtime execution data
        nodes: nodesToSave.map(n => ({
          id: n.id,
          type: n.type,
          params: n.params || [],
          inputs: n.inputs || [],
          outputs: n.outputs || [],
          // Keep position for editor
          x: n.x,
          y: n.y,
          w: n.w,
          height: n.height,
          // Include persisted output for resuming
          persistedOutput: n.persistedOutput
        })),
        
        edges: edgesToSave.map(e => ({
          from: typeof e.from === 'string' ? { id: e.from } : e.from,
          to: typeof e.to === 'string' ? { id: e.to } : e.to,
          id: e.id
        })),
        
        // Runtime metadata
        runtime: {
          canExecute: nodesToSave.length > 0,
          nodeCount: nodesToSave.length,
          edgeCount: edgesToSave.length,
          nodeTypes: [...new Set(nodesToSave.map(n => n.type))]
        }
      };
      
      await app.vault.adapter.write(Constants.BASE_FLOW_DIR + flowId, JSON.stringify(flowData, jsonReplacer, 2));
    } catch (e) {
      console.error(`Failed to save flow ${flowId}:`, e);
      new Notice(`Error: Could not save the flow. Check console for details.`);
    }
  }, [nodes, edges]);

  const autoSaveFlow = useCallback(async () => {
    if (!currentFlowId || isRunning) return;
    await saveFlowData(currentFlowId, nodes, edges);
  }, [nodes, edges, currentFlowId, isRunning, saveFlowData]);

  useEffect(() => {
    if (isFlowsLoading || isRunning) return;
    clearTimeout(saveDebounceTimer.current);
    saveDebounceTimer.current = setTimeout(() => autoSaveFlow(), 1500);
    return () => clearTimeout(saveDebounceTimer.current);
  }, [autoSaveFlow, isFlowsLoading, isRunning]);

  const promptForFlowName = useCallback((initialValue = '', title = "Save Flow") => {
      return new Promise((resolve) => {
          setPromptState({
              isOpen: true,
              title: title,
              placeholder: "Enter flow name...",
              initialValue,
              onResolve: resolve,
          });
      });
  }, []);

  const handleSaveFlow = useCallback(async () => {
    const isUntitled = !currentFlowId || currentFlowId.startsWith('Untitled-');

    if (isUntitled) {
        const currentTitle = currentFlowId ? currentFlowId.replace('.json', '').replace(/Untitled-\d+/, 'My New Flow') : 'My New Flow';
        const flowName = await promptForFlowName(currentTitle, "Save New Flow");
        if (!flowName || !flowName.trim()) return false;
        
        const newId = `${flowName.trim().replace(/\.json$/, '')}.json`;
        
        const existingFlow = savedFlows.find(f => f.id.toLowerCase() === newId.toLowerCase());
        if (existingFlow) {
            if (!confirm(`A flow named "${existingFlow.title}" already exists. Overwrite it?`)) return false;
        }

        await saveFlowData(newId);
        
        if (currentFlowId) {
            try { 
                await app.vault.adapter.remove(Constants.BASE_FLOW_DIR + currentFlowId); 
            } 
            catch (e) { console.warn("Could not remove old untitled flow file:", e); }
        }
        
        setCurrentFlowId(newId);
        await loadSavedFlows();
        return true;
    } else {
        await saveFlowData(currentFlowId);
        return true;
    }
  }, [currentFlowId, saveFlowData, promptForFlowName, loadSavedFlows, nodes, edges, savedFlows]);

  const handleRenameFlow = useCallback(async (oldFlowId, newName) => {
    const oldName = oldFlowId.replace('.json', '');
    const trimmedNewName = newName.trim();
    
    if (!trimmedNewName || trimmedNewName === oldName) {
        return true;
    }

    const newFlowId = `${trimmedNewName.replace(/\.json$/, '')}.json`;

    const conflictingFlow = savedFlows.find(flow => 
        flow.id.toLowerCase() === newFlowId.toLowerCase() && flow.id !== oldFlowId
    );

    if (conflictingFlow) {
        new Notice(`A flow named "${conflictingFlow.title}" already exists.`);
        await loadSavedFlows();
        return false;
    }
    
    try {
        const sourcePath = Constants.BASE_FLOW_DIR + oldFlowId;
        const destPath = Constants.BASE_FLOW_DIR + newFlowId;
        
        const sourceFileExists = await app.vault.adapter.exists(sourcePath);
        if (!sourceFileExists) throw new Error(`Source file not found: ${sourcePath}`);

        const isCaseOnlyRename = oldFlowId.toLowerCase() === newFlowId.toLowerCase() && oldFlowId !== newFlowId;

        if (isCaseOnlyRename) {
            const tempPath = `${sourcePath}.${Date.now()}.temp_rename`;
            await app.vault.adapter.rename(sourcePath, tempPath);
            await app.vault.adapter.rename(tempPath, destPath);
        } else {
             await app.vault.adapter.rename(sourcePath, destPath);
        }

        if (currentFlowId === oldFlowId) {
            setCurrentFlowId(newFlowId);
        }
        await loadSavedFlows();
        return true;
    } catch (e) {
        console.error("Failed to rename flow:", e);
        new Notice("Error: Could not rename the flow.");
        await loadSavedFlows();
        return false;
    }
  }, [currentFlowId, savedFlows, loadSavedFlows]);

  const createNewUntitledFlow = useCallback(async () => {
    pushHistory(snapshot());
    const newId = `Untitled-${Date.now()}.json`;
    setNodes([]);
    setEdges([]);
    setCurrentFlowId(newId);
    setSelected({ type: null, id: null });
    setSelectedNodeIds([]);
    setFlowGeneration(g => g + 1);
    
    await saveFlowData(newId, [], []);
    await loadSavedFlows();
  }, [snapshot, saveFlowData, loadSavedFlows]);

  const handleNewFlow = useCallback(async () => {
    await createNewUntitledFlow();
  }, [createNewUntitledFlow]);
  
  const handleLoadFlow = useCallback(async (flowId, isInitialLoad = false) => {
    if (isFlowsLoading && !isInitialLoad) {
        console.warn("Blocked a flow load because another is already in progress.");
        return;
    }
    if (currentFlowId === flowId && !isInitialLoad) return;

    setIsFlowsLoading(true);
    try {
      const content = JSON.parse(await app.vault.adapter.read(Constants.BASE_FLOW_DIR + flowId));
      const upNodes = normalizeNodesForLoad(content.nodes || []);
      const upEdges = normalizeEdgesForLoad(content.edges || []);
      if (!isInitialLoad) {
          pushHistory(snapshot());
      }
      setNodes(upNodes);
      setEdges(upEdges);
      setCurrentFlowId(flowId);
      setSelected({ type: null, id: null });
      setSelectedNodeIds([]);
      setFlowGeneration(g => g + 1);
    } catch (e) {
      console.error("Failed to load flow:", e);
      new Notice(`Error loading flow "${flowId.replace('.json','')}". A new flow was created.`);
      await createNewUntitledFlow();
    } finally {
        setIsFlowsLoading(false);
    }
  }, [currentFlowId, pushHistory, snapshot, createNewUntitledFlow, isFlowsLoading]);

  const handleDeleteFlow = useCallback(async (flowId) => {
    if (!confirm(`Are you sure you want to delete the flow "${flowId.replace('.json', '')}"? This cannot be undone.`)) return;
    
    try {
      const wasCurrentFlow = currentFlowId === flowId;
      await app.vault.adapter.remove(Constants.BASE_FLOW_DIR + flowId);
      const remainingFlows = await loadSavedFlows();

      if (wasCurrentFlow) {
        if (remainingFlows.length > 0) {
          await handleLoadFlow(remainingFlows[0].id);
        } else {
          await createNewUntitledFlow();
        }
      }
      new Notice(`Flow "${flowId.replace('.json','')}" deleted.`);
    } catch (e) {
      console.error("Failed to delete flow:", e);
      new Notice("Error: Could not delete the flow file.");
      await loadSavedFlows();
    }
  }, [currentFlowId, loadSavedFlows, createNewUntitledFlow, handleLoadFlow]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    const initialize = async () => {
        const existingFlows = await loadSavedFlows();
        
        const flowIdToLoad = currentFlowId;
        const flowExists = flowIdToLoad ? existingFlows.some(f => f.id === flowIdToLoad) : false;

        if (flowIdToLoad && flowExists) {
            await handleLoadFlow(flowIdToLoad, true);
        } else if (existingFlows.length > 0) {
            await handleLoadFlow(existingFlows[0].id, true);
        } else {
            await createNewUntitledFlow();
        }
    };

    initialize();
  }, [loadSavedFlows, handleLoadFlow, createNewUntitledFlow, currentFlowId]);

  useEffect(() => { const { innerWidth, innerHeight } = window; if (orbPos.x < 0 || orbPos.y < 0 || orbPos.x > innerWidth - 44 || orbPos.y > innerHeight - 44) { setOrbPos({ x: 20, y: 20 }); } }, []);
  useEffect(() => { clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => setSearch(Logic.parseQuery(searchRaw)), 80); return () => clearTimeout(debounceRef.current); }, [searchRaw]);
  
  useEffect(() => {
    const isPanInvalid = pan === null || !isFinite(pan.x) || !isFinite(pan.y);
    const isScaleInvalid = scale === null || !isFinite(scale) || scale <= 0;

    if (isPanInvalid || isScaleInvalid) {
        console.warn("Canvas position state was corrupted. Resetting to default.", { pan, scale });
        if (isPanInvalid) setPan({ x: 0, y: 0 });
        if (isScaleInvalid) setScale(1);
    }
  }, [pan, scale, setPan, setScale]);

  const removeSelection = useCallback(() => {
    if (selectedNodeIds.length === 0 && selected.type !== "edge") {
        return; // Nothing to remove
    }

    pushHistory(snapshot());
    
    if (selectedNodeIds.length > 0) {
        const sel = new Set(selectedNodeIds);
        setEdges(e => e.filter(ed => !sel.has(edgeEndId(ed.from)) && !sel.has(edgeEndId(ed.to))));
        setNodes(n => n.filter(nn => !sel.has(nn.id)));
        setSelectedNodeIds([]);
        setSelected({ type: null, id: null });
        return;
    }
    if (selected.type === "edge") {
        setEdges(e => e.filter(ed => ed.id !== selected.id));
        setSelected({ type: null, id: null });
    }
  }, [selected, selectedNodeIds, pushHistory, snapshot]);

  const nudgeSelection = useCallback((dx, dy) => {
    if (!selectedNodeIds.length) return;
    pushHistory(snapshot());
    setNodes(v => v.map(n => new Set(selectedNodeIds).has(n.id) ? { ...n, x: snap ? Math.round((n.x + dx) / GRID) * GRID : n.x + dx, y: snap ? Math.round((n.y + dy) / GRID) * GRID : n.y + dy } : n));
  }, [selectedNodeIds, snap, pushHistory, snapshot]);

  const copySelectionJSON = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    const selectionSet = new Set(selectedNodeIds);
    const selectedNodes = nodes.filter(n => selectionSet.has(n.id));
    
    const internalEdges = edges.filter(e => 
      selectionSet.has(edgeEndId(e.from)) && selectionSet.has(edgeEndId(e.to))
    );

    const snippet = {
      nodes: selectedNodes,
      edges: internalEdges,
    };
    
    navigator.clipboard?.writeText(JSON.stringify(snippet, jsonReplacer, 2)).catch(() => {});
    log(`📋 Copied ${selectedNodes.length} node(s) and ${internalEdges.length} edge(s)`);
  }, [nodes, edges, selectedNodeIds]);
  
  const pasteSelectionJSON = useCallback(() => {
    console.log("Attempting to paste from clipboard...");
    navigator.clipboard?.readText?.().then(txt => {
        if (!txt || txt.trim() === "") {
            log("📋 Clipboard is empty.", { kind: "warning" });
            console.log("Paste failed: Clipboard is empty.");
            return;
        }

        const cleanTxt = txt.trim();
        
        let parsedObject;
        try {
            parsedObject = JSON.parse(cleanTxt);
        } catch (e) {
            console.error("Paste error: Failed to parse JSON from clipboard.", e);
            log(`❌ Failed to paste. Invalid JSON format.`, { kind: "error" });
            log(`📋 Check developer console (Ctrl+Shift+I) for the full error.`, { kind: "info" });
            return;
        }
        
        try {
            const nodesToPaste = Array.isArray(parsedObject) ? parsedObject : parsedObject.nodes;
            const edgesToPaste = Array.isArray(parsedObject) ? [] : parsedObject.edges || [];

            if (!Array.isArray(nodesToPaste) || nodesToPaste.length === 0) {
                log(`📋 Paste content was not a valid node snippet.`, { kind: "warning" });
                console.log("Paste failed: Parsed object is not a valid node array/snippet.");
                return;
            }
            
            pushHistory(snapshot());

            const idMap = new Map();
            const newNodes = nodesToPaste.map(n => {
                const newId = Utils.uid("n");
                idMap.set(n.id, newId); 
                const r = rect(n);
                return {
                    params: [], 
                    group: "Pasted", 
                    inputs: [], 
                    outputs: [], 
                    ...n, 
                    id: newId, 
                    x: (n.x ?? 0) + 20,
                    y: (n.y ?? 0) + 20,
                    w: r.w,
                    height: r.h,
                };
            });

            const newEdges = edgesToPaste
                .filter(e => idMap.has(edgeEndId(e.from)) && idMap.has(edgeEndId(e.to)))
                .map(e => ({
                    ...e,
                    id: Utils.uid("e"),
                    from: { id: idMap.get(edgeEndId(e.from)) },
                    to: { id: idMap.get(edgeEndId(e.to)) },
                }));

            setNodes(v => [...v, ...newNodes]);
            setEdges(v => [...v, ...newEdges]);
            
            const newSelectedIds = newNodes.map(n => n.id);
            setSelectedNodeIds(newSelectedIds);
            setSelected({ type: "node", id: newSelectedIds[0] || null });
            log(`📋 Pasted ${newNodes.length} node(s) and ${newEdges.length} edge(s)`);

        } catch (e) {
            console.error("Paste error: Failed while processing the parsed data.", e);
            log(`❌ An error occurred while adding pasted nodes to the canvas.`, { kind: "error" });
        }
    });
  }, [edges, pushHistory, snapshot]);

  const importJSON = useCallback(() => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = async () => {
            try {
                const obj = JSON.parse(r.result);
                await createNewUntitledFlow();
                const upNodes = normalizeNodesForLoad(obj.nodes || []);
                const upEdges = normalizeEdgesForLoad(obj.edges || []);
                setNodes(upNodes);
                setEdges(upEdges);

            } catch {}
        };
        r.readAsText(f);
    };
    inp.click();
  }, [pushHistory, snapshot, createNewUntitledFlow]);
  
  const bindings = useMemo(() => ({
    "Ctrl+k": () => { searchRef.current?.focus(); searchRef.current?.select(); setShowSuggest(true); },
    "delete": removeSelection,
    "backspace": removeSelection,
    "Ctrl+z": () => { const hist = history.current; if (!hist.past.length) return; const prev = hist.past.pop(); hist.future.push(snapshot()); setNodes(prev.nodes); setEdges(prev.edges); setSelected({ type: null, id: null }); setSelectedNodeIds([]); },
    "Ctrl+shift+z": () => { const hist = history.current; if (!hist.future.length) return; const next = hist.future.pop(); hist.past.push(snapshot()); setNodes(next.nodes); setEdges(next.edges); setSelected({ type: null, id: null }); setSelectedNodeIds([]); },
    "+": () => setScale(s => Utils.clamp(s + 0.1, 0.3, 2)),
    "-": () => setScale(s => Utils.clamp(s - 0.1, 0.3, 2)),
    "0": () => { setScale(1); setPan({ x: 0, y: 0 }); },
    "Ctrl+a": () => { setSelectedNodeIds(nodes.map(n => n.id)); if (nodes[0]) setSelected({ type: "node", id: nodes[0].id }); },
    "enter": () => { if (selected.type === "node") { runFromNode(selected.id); } },
    "Escape": () => { setConnecting(null); setMarquee(null); setConnectionDrag(null); setConnectionMenu(null); },
    "Ctrl+s": (e) => { e.preventDefault(); handleSaveFlow(); },
    "Ctrl+o": importJSON,
    "Ctrl+Alt+l": () => setShowLeft(v => !v),
    "Ctrl+Alt+r": () => setShowRight(v => !v),
    "g": () => setSnap(s => !s),
    "ArrowUp": () => nudgeSelection(0, -GRID),
    "ArrowDown": () => nudgeSelection(0, GRID),
    "ArrowLeft": () => nudgeSelection(-GRID, 0),
    "ArrowRight": () => nudgeSelection(GRID, 0),
    "Ctrl+c": copySelectionJSON,
    "Ctrl+v": pasteSelectionJSON
  }), [nodes, handleSaveFlow, removeSelection, nudgeSelection, copySelectionJSON, pasteSelectionJSON, importJSON, snapshot]);
  
  Hooks.useKeybinds({ rootRef, utils: Utils, bindings });
  
  useEffect(() => { const down = (e) => { if (Utils.isEditableTarget(e)) return; if (e.code === "Space" && !e.repeat) { spaceDownRef.current = true; document.body.style.cursor = 'grab'; } }; const up = (e) => { if (e.code === "Space") { spaceDownRef.current = false; document.body.style.cursor = ''; } }; document.addEventListener("keydown", down); document.addEventListener("keyup", up); return () => { document.removeEventListener("keydown", down); document.removeEventListener("keyup", up); }; }, []);

  const paletteAll = useMemo(() => {
    const merged = Logic.mergeAndGroupPalette(Constants.ACTIONS_PRESET, dynamicCommands, recentCommandIds);
    let list = merged.flat;
    for (const t of search.tokens) {
      if (t.k === "type") list = list.filter(x => (x.type || "").toLowerCase().includes(t.v.toLowerCase()));
      if (t.k === "group") list = list.filter(x => (x.group || "").toLowerCase().includes(t.v.toLowerCase()));
    }
    const text = search.text;
    if (!text && search.tokens.length === 0) return { ...merged, searchList: [] };
    const ranked = list
      .map(x => ({ item: x, score: Utils.fuzzyScore(text, x.label || "") * 3 + Utils.fuzzyScore(text, `${x.type} ${x.group}`) }))
      .filter(r => r.score > 0 || (text === "" && search.tokens.length > 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 80);
    const filtered = {};
    const seen = new Set();
    for (const r of ranked) {
      const g = r.item.group || "Misc";
      if (!filtered[g]) filtered[g] = [];
      filtered[g].push(r.item);
      seen.add(g);
    }
    const order = Array.from(seen).sort((a, b) => a.localeCompare(b));
    return { groups: filtered, order, searchList: ranked.map(r => r.item) };
  }, [dynamicCommands, recentCommandIds, search]);

  useEffect(() => {
    if (Object.keys(openGroups).length === 0) {
      const init = {};
      for (const g of (paletteAll.order?.length ? paletteAll.order : ["Core App", "Data", "Arrays", "Logic", "Control Flow", "Hotkeys", "Settings", "Network", "Utilities", "Scripts"]).slice(0, 6)) init[g] = true;
      setOpenGroups(init);
    }
  }, [paletteAll.order]);

  const [ctxMenu, setCtxMenu] = Hooks.useContextMenu();

    // ========================================================================= //
    // ================== START: CORE EXECUTION LOGIC ========================== //
    // ========================================================================= //

    const summarizeDataForLog = (data, maxLength = 70) => {
        if (data === undefined) return 'undefined';
        if (data === null) return 'null';
        if (typeof data === 'boolean' || typeof data === 'number') return JSON.stringify(data);
        if (Array.isArray(data)) return `Array[${data.length}]`;
        if (typeof data === 'object' && Object.keys(data).length > 0) return `Object{${Object.keys(data).slice(0,3).join(', ')}...}`;
        if (typeof data === 'object') return 'Object{}';
        if (typeof data === 'string') {
            const str = data.replace(/\s+/g, ' ');
            if (str.length > maxLength) return `"${str.substring(0, maxLength - 3)}..."`;
            return `"${str}"`;
        }
        return String(data);
    };

    const log = useCallback((message, details = {}) => {
        const { kind = "info", data, nodeId } = details;
        setRunLog(v => [{ t: Date.now(), kind, message, data, nodeId }, ...v]);
    }, []);


    async function runNode(node, ctx) {
        if (cancelRunRef.current.cancel) throw new Error("Cancelled");
        
        log(`Input: ${summarizeDataForLog(ctx.last)}`, { kind: 'debug', data: ctx.last, nodeId: node.id });

        const p = (key, def = null) => {
            const param = node.params.find(x => x.key === key);
            const rawValue = param?.value;
            const resolvedValue = Logic.resolveValue(rawValue, ctx) ?? def;

            if (param) { // Only log if param exists
                const rawSummary = summarizeDataForLog(rawValue, 40);
                const resolvedSummary = summarizeDataForLog(resolvedValue, 40);
                if (rawSummary !== resolvedSummary) {
                     log(`Param '${key}': ${rawSummary} -> ${resolvedSummary}`, { kind: 'debug', data: { raw: rawValue, resolved: resolvedValue }, nodeId: node.id });
                } else {
                     log(`Param '${key}': ${resolvedSummary}`, { kind: 'debug', data: { resolved: resolvedValue }, nodeId: node.id });
                }
            }
            return resolvedValue;
        };

        switch (node.type) {
            case 'datacore.query': return dc.api.query(p('query'));
            case 'command': await app.commands.executeCommandById(p('commandId')); return ctx.last;
            case 'wait': await new Promise(r => setTimeout(r, p('ms', 1000))); return ctx.last;
            case 'script': {
                const code = p('code', '');
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const fn = new AsyncFunction("ctx", "dc", "app", '"use strict";' + code);
                return await fn(ctx, dc, app);
            }
            case 'debug.log': {
                const message = p('message', 'Log message');
                const dataToLog = p('data', ctx.last);
                const level = p('level', 'info');
                const target = p('target', 'console');
                const logContext = p('logContext', false);

                const finalMessage = String(message);

                let finalData;
                if (logContext) {
                    finalData = {
                        message: finalMessage,
                        context: {
                            vars: ctx.vars,
                            last: ctx.last,
                            item: ctx.item, // will be undefined if not in a loop.forEach
                        },
                    };
                } else {
                    finalData = dataToLog;
                }

                if (target === 'console' || target === 'both') {
                    const kindMap = { log: 'info', warn: 'warning' };
                    const logKind = kindMap[level] || level;
                    log(finalMessage, { kind: logKind, data: finalData, nodeId: node.id });
                }

                if (target === 'electron' || target === 'both') {
                    const electronLogFn = console[level] || console.log;
                    electronLogFn(`[FlowBuilder Node: ${node.label || node.id}] ${finalMessage}`, finalData);
                }
                return ctx.last;
            }
            case 'fs.listFiles': {
                const path = p('path', '');
                if (!path) throw new Error("Path parameter is required for List Files node.");
                const { files } = await app.vault.adapter.list(path);
                return files;
            }
            case 'obsidian': {
                const path = p('path');
                if (Array.isArray(path)) {
                    throw new Error("'path' parameter cannot be an array. It received an array of paths. Use a 'For Each' loop to open multiple files.");
                }
                if (!path && path !== 0) {
                    throw new Error("Path parameter is required for Open File node.");
                }
                const openMode = p('openMode', 'tab-fg');
                
                let newLeaf = true; 
                const openState = { active: true }; 

                switch (openMode) {
                    case 'current': newLeaf = false; break;
                    case 'split': newLeaf = 'split'; break;
                    case 'window': newLeaf = 'window'; break;
                    case 'tab-bg': newLeaf = true; openState.active = false; break;
                    case 'tab-fg': default: newLeaf = true; openState.active = true; break;
                }
                
                try {
                    await app.workspace.openLinkText(String(path), '', newLeaf, openState);
                } catch (e) {
                    log(`Error opening file: ${e.message}`, { kind: "error" });
                }

                return ctx.last;
            }
            case 'data.format': 
                return p('expression');
            case 'data.editFields': {
                const data = ctx.last;
                if (!Array.isArray(data)) {
                    log("Edit Fields expects an array input.", { kind: "warning" });
                    return data;
                }
                const ops = Logic.tryJson(p('operations', '[]'));
                if (!Array.isArray(ops)) {
                     log("Edit Fields 'operations' parameter is not a valid JSON array.", { kind: "error" });
                     return data;
                }

                return data.map(item => {
                    let newItem = { ...item };
                    const itemCtx = { ...ctx, item: newItem, last: item };

                    for (const op of ops) {
                        const resolve = (val) => Logic.resolveValue(val, itemCtx);
                        switch (op.type) {
                            case 'set':
                                newItem[op.field] = resolve(op.value);
                                break;
                            case 'remove':
                                (op.field || "").split(',').forEach(f => delete newItem[f.trim()]);
                                break;
                            case 'rename':
                                if (newItem.hasOwnProperty(op.old)) {
                                    newItem[op.new] = newItem[op.old];
                                    delete newItem[op.old];
                                }
                                break;
                        }
                    }
                    return newItem;
                });
            }
            case 'http': {
                const url = p('url');
                const method = p('method', 'GET');
                const headers = Logic.tryJson(p('headers', '{}'));
                const body = p('body', null);
                const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : null });
                if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
                return await res.json();
            }
            case 'var.set': ctx.vars[p('name')] = p('value'); return ctx.last;
            case 'var.get': return ctx.vars[p('name')] ?? p('default');
            case 'expr': return p('expr');
            case 'json.filter': {
                const data = ctx.last;
                if (!Array.isArray(data)) {
                    log("Filter expects an array input, but got something else. Passing through.", { kind: "warning" });
                    return data;
                }
                const field = p('field');
                const op = p('op');
                const value = p('value');
                return data.filter(item => {
                    const itemValue = Utils.getDeepValue(item, field);
                    switch (op) {
                        case '==': return itemValue == value;
                        case '!=': return itemValue != value;
                        case '>': return itemValue > value;
                        case '>=': return itemValue >= value;
                        case '<': return itemValue < value;
                        case '<=': return itemValue <= value;
                        case '.contains': return String(itemValue).includes(String(value));
                        default: return false;
                    }
                });
            }
            case 'array.flatten': {
                const list = p('list', ctx.last);
                if (!Array.isArray(list)) {
                    log("Flatten node expects an array input. Passing data through.", { kind: "warning", nodeId: node.id });
                    return list;
                }
                return list.flat();
            }
            case 'array.group': {
                const list = p('list', []);
                const mode = p('mode', 'fixedSize');
                const value = p('value');
                
                if (!Array.isArray(list)) {
                    throw new Error('Group Array node requires an array as input for the "list" parameter.');
                }

                switch (mode) {
                    case 'fixedSize': {
                        const size = parseInt(value, 10);
                        if (isNaN(size) || size < 1) {
                            throw new Error('For Fixed Size grouping, the value must be a positive number.');
                        }
                        const result = [];
                        for (let i = 0; i < list.length; i += size) {
                            result.push(list.slice(i, i + size));
                        }
                        return result;
                    }

                    case 'property': {
                        const propertyPath = String(value || '');
                        if (!propertyPath) {
                            throw new Error('For Property Value grouping, a property path must be provided.');
                        }
                        const result = {};
                        for (const item of list) {
                            const key = Utils.getDeepValue(item, propertyPath) ?? 'undefined';
                            if (!result[key]) {
                                result[key] = [];
                            }
                            result[key].push(item);
                        }
                        return result;
                    }

                    case 'expression': {
                        const expression = String(value || '');
                         if (!expression.startsWith('=')) {
                            throw new Error('For Expression grouping, the value must be a valid expression starting with "=".');
                        }
                        const result = {};
                        for (const item of list) {
                             const itemCtx = { ...ctx, item: item, last: item };
                             const key = Logic.resolveValue(expression, itemCtx) ?? 'undefined';
                             if (!result[key]) {
                                result[key] = [];
                             }
                             result[key].push(item);
                        }
                        return result;
                    }

                    default:
                        throw new Error(`Unknown grouping mode: ${mode}`);
                }
            }
            case 'if': {
                const cond = p('cond');
                const branch = !!cond ? 'true' : 'false';
                log(`Condition result: ${branch}`, { kind: 'info', nodeId: node.id });
                return { _branch: branch };
            }
            case 'loop.forEach': {
                const list = p('list');
                if (!Array.isArray(list)) throw new Error('For Each node requires an array input.');
                
                if (list.length > 0 && Array.isArray(list[0])) {
                    log(
                        "Input appears to be a nested array. Each 'item' in the loop will be an array. Consider using an 'Array: Flatten' node first if you intend to loop over individual elements.",
                        { kind: "warning", nodeId: node.id }
                    );
                }

                return {
                    _loop: {
                        type: 'forEach',
                        items: list,
                        itemName: p('itemName', 'item'),
                        indexName: p('indexName', 'index'),
                    }
                };
            }
            case 'loop.for': {
                const count = parseInt(p('count', 10), 10);
                if (isNaN(count) || count < 0) throw new Error('For Loop node requires a non-negative number for "count".');
                return {
                    _loop: {
                        type: 'for',
                        count: count,
                        indexName: p('indexName', 'index'),
                    }
                };
            }
            case 'data.json': {
                const rawData = p('data', '{}');
                return Logic.tryJson(rawData);
            }
            case 'fs.read': {
                const path = p('path', ctx.last);
                if (!path) throw new Error("Path parameter is required for Read File node.");
                const content = await app.vault.adapter.read(path);
                return content;
            }
            case 'obsidian.getActiveFile': {
                const file = app.workspace.getActiveFile();
                if (!file) {
                    log("No active file open.", { kind: "warning", nodeId: node.id });
                    return null;
                }
                return dc.api.page(file.path);
            }
            case 'data.select': {
                const data = ctx.last;
                const fieldsStr = p('fields', '');
                const fields = fieldsStr.split(',').map(f => f.trim()).filter(f => f);
                
                if (fields.length === 0) {
                    log("Select Fields: no fields specified, passing data through.", { kind: "warning", nodeId: node.id });
                    return data;
                }
                
                const pick = (obj) => fields.reduce((acc, key) => {
                    acc[key] = Utils.getDeepValue(obj, key);
                    return acc;
                }, {});
                
                if (Array.isArray(data)) return data.map(pick);
                return pick(data);
            }
            case 'array.sort': {
                const data = ctx.last;
                if (!Array.isArray(data)) {
                    log("Sort Array expects an array input.", { kind: "warning", nodeId: node.id });
                    return data;
                }
                const field = p('field');
                const direction = p('direction', 'asc');
                const multiplier = direction === 'asc' ? 1 : -1;
                
                return [...data].sort((a, b) => {
                    const valA = Utils.getDeepValue(a, field);
                    const valB = Utils.getDeepValue(b, field);
                    if (valA < valB) return -1 * multiplier;
                    if (valA > valB) return 1 * multiplier;
                    return 0;
                });
            }
            case 'flow.merge': {
                return ctx.last;
            }
            case 'flow.stop': {
                throw new Error('_STOP_EXECUTION_');
            }
            case 'fs.write': {
                const path = p('path');
                if (!path) throw new Error("Path parameter is required for Write File node.");
                const content = p('content', ctx.last);
                const overwrite = p('overwrite', false);
                
                const fileExists = await app.vault.adapter.exists(path);
                if (fileExists && !overwrite) {
                    throw new Error(`File ${path} already exists. Set 'overwrite' to true to replace it.`);
                }
                
                await app.vault.adapter.write(path, String(content));
                log(`File written: ${path}`, { kind: "success", nodeId: node.id });
                return ctx.last;
            }
            case 'fs.append': {
                const path = p('path');
                if (!path) throw new Error("Path parameter is required for Append to File node.");
                const content = p('content', ctx.last);
                const addNewline = p('addNewline', true);
                
                const fileExists = await app.vault.adapter.exists(path);
                if (!fileExists) {
                    throw new Error(`File ${path} does not exist. Use Write File node to create it first.`);
                }
                
                const existing = await app.vault.adapter.read(path);
                const newContent = existing + (addNewline ? '\n' : '') + String(content);
                await app.vault.adapter.write(path, newContent);
                log(`Content appended to: ${path}`, { kind: "success", nodeId: node.id });
                return ctx.last;
            }
            case 'obsidian.notice': {
                const message = p('message', ctx.last);
                new Notice(String(message));
                return ctx.last;
            }
            case 'obsidian.prompt': {
                const title = p('title', 'Enter value');
                const placeholder = p('placeholder', '');
                
                return new Promise((resolve, reject) => {
                    const modal = new PromptModal(app, title, placeholder, (result) => {
                        if (result !== null) {
                            resolve(result);
                        } else {
                            reject(new Error('User cancelled prompt'));
                        }
                    });
                    modal.open();
                });
            }
            case 'output.display':
            case 'output.viewer':
                return ctx.last;
            default:
                log(`Unknown node type: ${node.type}`, { kind: "warning" });
                return ctx.last;
        }
    }

    async function runSingleNode(nodeId) {
        if (isRunning) { log("A flow is already running.", { kind: "warning" }); return; }
        const node = nodes.find(n => n.id === nodeId);
        if (!node) { log(`Node ${nodeId} not found.`, { kind: "error" }); return; }
        
        setIsRunning(true);
        setRunLog([]);
        setNodeRunStatus({ [nodeId]: { status: 'running' } });
        log(`▶ Running single node: ${node.label}`);
        
        const ctx = { vars: {}, last: undefined, log };

        try {
            const result = await runNode(node, ctx);
            setNodeOutputData({ [nodeId]: result });
            log(`Output: ${summarizeDataForLog(result)}`, { kind: 'debug', data: result, nodeId: nodeId });
            if (node.type === 'output.display') {
                 setNodes(ns => ns.map(n => n.id === node.id ? { ...n, persistedOutput: result } : n));
            }
            log(`✔ Node '${node.label}' finished successfully.`, { kind: "success" });
            setNodeRunStatus({ [nodeId]: { status: 'success' } });
        } catch (e) {
            if (e.message === '_STOP_EXECUTION_') {
                log(`⏹ Node '${node.label}' stopped execution`, { kind: 'info' });
                setNodeRunStatus({ [nodeId]: { status: 'success' } });
            } else {
                log(`❌ Error in node '${node.label}': ${e.message}`, { kind: "error" });
                setNodeRunStatus({ [nodeId]: { status: 'error' } });
            }
        } finally {
            setIsRunning(false);
        }
    }

    const executeFlowRecursive = useCallback(async (nodeId, input, context) => {
        if (cancelRunRef.current.cancel) return;

        const node = nodes.find(n => n.id === nodeId);
        if (!node) {
            log(`Node ${nodeId} not found in graph.`, { kind: "error" });
            return;
        }
        
        if (node.type === 'comment') { return; }

        const nodeContext = { ...context, last: input };
        setNodeRunStatus(s => ({ ...s, [nodeId]: { status: 'running' } }));

        try {
            log(`> Running node '${node.label}'`, { kind: 'info', nodeId: nodeId });
            const result = await runNode(node, nodeContext);
            log(`< Output: ${summarizeDataForLog(result)}`, { kind: 'debug', data: result, nodeId: nodeId });
            
            setNodeOutputData(d => ({ ...d, [nodeId]: result }));
            if (node.type === 'output.display') {
                setNodes(ns => ns.map(n => n.id === node.id ? { ...n, persistedOutput: result } : n));
            }
            setNodeRunStatus(s => ({ ...s, [nodeId]: { status: 'success' } }));
            log(`✔ Node '${node.label}' finished.`, { kind: 'success', nodeId: nodeId });

            const outgoingEdges = edges.filter(e => edgeEndId(e.from) === nodeId);

            if (result?._branch) {
                const branch = result._branch;
                const trueEdge = outgoingEdges[0];
                const falseEdge = outgoingEdges[1];
                log(`Branching to '${branch}'`, { kind: 'info', nodeId: nodeId });
                if (branch === 'true' && trueEdge) await executeFlowRecursive(edgeEndId(trueEdge.to), input, context);
                if (branch === 'false' && falseEdge) await executeFlowRecursive(edgeEndId(falseEdge.to), input, context);
            } else if (result?._loop) {
                const loop = result._loop;
                
                const bodyEdge = outgoingEdges[0];
                const doneEdge = outgoingEdges[1];

                if (loop.type === 'forEach' && bodyEdge && loop.items.length > 0) {
                    log(`λού Looping for each, ${loop.items.length} items...`, { kind: 'info', nodeId: nodeId });
                    for (let i = 0; i < loop.items.length; i++) {
                        if (cancelRunRef.current.cancel) break;
                        const item = loop.items[i];
                        const loopScope = Object.create(context.vars);
                        loopScope[loop.itemName] = item;
                        loopScope[loop.indexName] = i;
                        const loopCtx = { ...context, vars: loopScope };
                        await executeFlowRecursive(edgeEndId(bodyEdge.to), item, loopCtx);
                    }
                    log(`λού Loop finished.`, { kind: 'info', nodeId: nodeId });
                } else if (loop.type === 'for' && bodyEdge && loop.count > 0) {
                     log(`λού Looping ${loop.count} times...`, { kind: 'info', nodeId: nodeId });
                    for (let i = 0; i < loop.count; i++) {
                        if (cancelRunRef.current.cancel) break;
                        const loopScope = Object.create(context.vars);
                        loopScope[loop.indexName] = i;
                        const loopCtx = { ...context, vars: loopScope };
                        await executeFlowRecursive(edgeEndId(bodyEdge.to), i, loopCtx);
                    }
                    log(`λού Loop finished.`, { kind: 'info', nodeId: nodeId });
                }
                
                if (doneEdge) {
                    log(`Found 'Done' edge. Continuing execution.`, { kind: 'info', nodeId: nodeId });
                    const doneInput = loop.type === 'forEach' ? loop.items : loop.count;
                    await executeFlowRecursive(edgeEndId(doneEdge.to), doneInput, context);
                }
            } else {
                 if (outgoingEdges.length > 1) {
                    log(`|| Splitting execution into ${outgoingEdges.length} parallel branches.`, { kind: 'info', nodeId: nodeId });
                }
                const promises = outgoingEdges.map(edge => {
                    const branchContext = { ...context, vars: Object.create(context.vars) };
                    return executeFlowRecursive(edgeEndId(edge.to), result, branchContext);
                });
                await Promise.all(promises);
            }

        } catch (e) {
            if (e.message === '_STOP_EXECUTION_') {
                log(`⏹ Node '${node.label}' stopped execution`, { kind: 'info', nodeId: nodeId });
                setNodeRunStatus(s => ({ ...s, [nodeId]: { status: 'success' } }));
                return;
            }
            log(`❌ Error in node '${node.label}': ${e.message}`, { kind: "error", nodeId: nodeId });
            setNodeRunStatus(s => ({ ...s, [nodeId]: { status: 'error' } }));
        }
    }, [nodes, edges, log]);

    async function executeFrom(startId) {
        if (isRunning) {
            log("A flow is already running.", { kind: "warning" });
            return;
        }

        setIsRunning(true);
        setRunLog([]);
        setNodeRunStatus({});
        setNodeOutputData({});
        cancelRunRef.current.cancel = false;
        
        const startNode = nodes.find(n => n.id === startId);
        log(`▶ Starting execution from '${startNode?.label || startId}'`, { kind: 'info' });
        
        const globalCtx = { vars: {}, log };
        
        try {
            await executeFlowRecursive(startId, undefined, globalCtx);
        } catch(e) {
            log(`FATAL: Unhandled execution error: ${e.message}`, { kind: "error" });
            console.error("Fatal Flow Execution Error:", e);
        } finally {
            log('✅ Execution finished.', { kind: 'success' });
            setIsRunning(false);
        }
    }
    
    async function executeAllRoots() {
        if (isRunning) { log("A flow is already running.", { kind: "warning" }); return; }
        
        const allNodeIds = new Set(nodes.map(n => n.id).filter(id => nodes.find(n => n.id === id)?.type !== 'comment'));
        const nodesWithInputs = new Set(edges.map(e => edgeEndId(e.to)));
        const rootNodeIds = [...allNodeIds].filter(id => !nodesWithInputs.has(id));
        
        if (rootNodeIds.length === 0 && nodes.filter(n => n.type !== 'comment').length > 0) {
            log("No root nodes found to start execution.", { kind: "warning" });
            return;
        }

        setIsRunning(true);
        setRunLog([]);
        setNodeRunStatus({});
        setNodeOutputData({});
        cancelRunRef.current.cancel = false;
        log(`▶ Starting execution from ${rootNodeIds.length} root node(s).`, { kind: 'info' });

        const globalCtx = { vars: {}, log };
        
        const rootPromises = rootNodeIds.map(rootId => executeFlowRecursive(rootId, undefined, globalCtx));
        
        try {
            await Promise.all(rootPromises);
        } catch (e) {
            log(`FATAL: Unhandled execution error from roots: ${e.message}`, { kind: "error" });
            console.error("Fatal Flow Execution Error:", e);
        } finally {
             log('✅ Execution finished.', { kind: 'success' });
             setIsRunning(false);
        }
    }

    function runFromNode(id) { executeFrom(id); }
    function runAll() { executeAllRoots(); }
    function stopRun() { cancelRunRef.current.cancel = true; }

    // ========================================================================= //
    // =================== END: CORE EXECUTION LOGIC =========================== //
    // ========================================================================= //

    function openNodeMenu(e, id) { 
        e.preventDefault?.(); 
        e.stopPropagation?.(); 
        const { clientX, clientY } = e; 
        setCtxMenu({ left: clientX, top: clientY, nodeId: id, opening: true }); 
        setTimeout(() => setCtxMenu(m => m ? ({ ...m, opening: false }) : m), 0); 
    }
    function duplicateNode(id) { const n = nodes.find(n => n.id === id); if (!n) return; pushHistory(snapshot()); const id_new = Utils.uid("n"); const r = rect(n); const n_new = { ...n, id: id_new, x: n.x + 20, y: n.y + 20, w: r.w, height: r.h }; setNodes(v => [...v, n_new]); }
    
    function deleteNodeById(id) {
        pushHistory(snapshot());
        setEdges(e => e.filter(ed => edgeEndId(ed.from) !== id && edgeEndId(ed.to) !== id));
        setNodes(v => v.filter(n => n.id !== id));
        setSelected(sel => (sel.type === 'node' && sel.id === id) ? { type: null, id: null } : sel);
        setSelectedNodeIds(ids => ids.filter(selectedId => selectedId !== id));
    }

    function bringToFront(id) { setNodes(v => [...v.filter(n => n.id !== id), v.find(n => n.id === id)].filter(Boolean)); }
    function sendToBack(id) { setNodes(v => [v.find(n => n.id === id), ...v.filter(n => n.id !== id)].filter(Boolean)); }
    function copyNodeJSON(id) { const n = nodes.find(n => n.id === id); if (!n) return; navigator.clipboard?.writeText(JSON.stringify(n, jsonReplacer, 2)).catch(() => {}); }
    
    function addNode(a, x, y) {
        pushHistory(snapshot());
        const id = Utils.uid("n");
        let finalX = isFinite(x) ? x : 0;
        let finalY = isFinite(y) ? y : 0;
        
        // Check if there's a ghost node
        if (ghostNode) {
            finalX = ghostNode.x;
            finalY = ghostNode.y;
        }
        
        const newNode = { id, ...a, x: finalX, y: finalY, _justSpawned: true };
        setNodes(v => [...v, newNode]);
        setSelected({ type: 'node', id });
        setSelectedNodeIds([id]);
        
        // Remove the spawn flag after animation completes
        setTimeout(() => {
            setNodes(v => v.map(n => n.id === id ? { ...n, _justSpawned: false } : n));
        }, 400);
        
        // If ghost node exists, create edge and clear ghost
        if (ghostNode) {
            setEdges(currentEdges => [
                ...currentEdges, 
                { 
                    id: Utils.uid("e"), 
                    from: { id: ghostNode.fromNodeId }, 
                    to: { id: id } 
                }
            ]);
            setGhostNode(null);
        }
    }

    const exportJSON = useCallback(() => { const data = JSON.stringify({ nodes, edges }, jsonReplacer, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'flow.json'; a.click(); URL.revokeObjectURL(url); }, [nodes, edges]);
    const validate = useCallback(() => { const issues = []; const ids = new Set(nodes.map(n => n.id)); for (const e of edges) { if (!ids.has(edgeEndId(e.from)) || !ids.has(edgeEndId(e.to))) issues.push(`Broken edge ${e.id}`); } new Notice(issues.length ? `Issues:\n${issues.join("\n")}` : "Looks good!"); }, [nodes, edges]);
    function zoomToFit(pad = 40) { if (!nodes.length) return; let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; nodes.forEach(n => { const r = rect(n); minX = Math.min(minX, r.x); minY = Math.min(minY, r.y); maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h); }); const crect = canvasRef.current.getBoundingClientRect(); const contentW = maxX - minX, contentH = maxY - minY; if (contentW <= 0 || contentH <= 0) return; const scaleX = (crect.width - pad * 2) / contentW, scaleY = (crect.height - pad * 2) / contentH; const newScale = Utils.clamp(Math.min(scaleX, scaleY), 0.3, 2); setScale(newScale); const newPanX = -minX * newScale + (crect.width - contentW * newScale) / 2; const newPanY = -minY * newScale + (crect.height - contentH * newScale) / 2; setPan({ x: newPanX, y: newPanY }); }
    function centerOnSelection() { const sel = nodes.filter(n => selectedSet.has(n.id)); if (!sel.length) return; let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; sel.forEach(n => { const r = rect(n); minX = Math.min(minX, r.x); minY = Math.min(minY, r.y); maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h); }); const crect = canvasRef.current.getBoundingClientRect(); const contentW = maxX - minX, contentH = maxY - minY; setPan({ x: -minX * scale + (crect.width - contentW * scale) / 2, y: -minY * scale + (crect.height - contentH * scale) / 2 }); }

    const handleLeftDragStart = () => { initialSizesRef.current = { left: panelSizes.left }; };
    const handleLeftDragMove = (dx) => { if (!showLeft) { if (dx > 10) { setShowLeft(true); setPanelSizes(s => ({ ...s, left: Math.max(dx, 220) })); } return; } if (initialSizesRef.current?.left === undefined) return; const newWidth = initialSizesRef.current.left + dx; if (newWidth < 200) { setShowLeft(false); } else { const w = Utils.clamp(newWidth, 220, 540); setPanelSizes(s => ({ ...s, left: w })); } };
    const handleRightDragStart = () => { initialSizesRef.current = { right: panelSizes.right }; };
    const handleRightDragMove = (dx) => { if (!showRight) { if (dx < -10) { setShowRight(true); setPanelSizes(s => ({ ...s, right: Math.max(-dx, 280) })); } return; } if (initialSizesRef.current?.right === undefined) return; const newWidth = initialSizesRef.current.right - dx; if (newWidth < 200) { setShowRight(false); } else { const w = Utils.clamp(newWidth, 280, 640); setPanelSizes(s => ({ ...s, right: w })); } };

    function viewToWorldMemo(px, py) { return viewToWorld(px, py); }

    useEffect(() => {
        const vc = canvasRef.current;
        if (!vc) return;
        const onKey = (e) => { if (e.code === 'Space') { vc.spaceKeyHack = e.type === 'keydown'; } };
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('keyup', onKey);
        };
    }, []);

    useEffect(() => {
        if (!connectionMenu) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setConnectionMenu(null);
        };
        const handleClick = (e) => {
            if (!e.target.closest('.ctxmenu')) setConnectionMenu(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleClick);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClick);
        };
    }, [connectionMenu]);

    const leftPanelWidth = showLeft ? panelSizes.left : 0;
    const rightPanelWidth = showRight ? panelSizes.right : 0;
    const cols = `${leftPanelWidth}px 10px 1fr 10px ${rightPanelWidth}px`;

    const paletteAllMemo = paletteAll;
    const searchState = { raw: searchRaw, parsed: search, ref: searchRef, dragging };
    const setSearchState = (fn) => { 
        const next = typeof fn === 'function' ? fn({ raw: searchRaw, parsed: search, ref: searchRef, dragging }) : fn; 
        if (next.raw !== undefined && next.raw !== searchRaw) setSearchRaw(next.raw);
    };

    const leftPanelProps = {
        canvasRef, paletteAll: paletteAllMemo, openGroups, setOpenGroups, pinnedGroups, setPinnedGroups,
        addNode, searchState, setSearchState, setShowSuggest, showSuggest, activeSuggest, setActiveSuggest,
        viewToWorld: viewToWorldMemo, savedFlows, currentFlowId, onLoadFlow: handleLoadFlow, onNewFlow: handleNewFlow,
        onDeleteFlow: handleDeleteFlow, onSaveFlow: handleSaveFlow, isFlowsLoading, nodes,
        onRenameFlow: handleRenameFlow,
        activeTab: leftPanelTab, setActiveTab: setLeftPanelTab,
        ghostNode, setGhostNode,
        setDragging,
    };

    return (
        <div ref={rootRef} tabIndex={-1} onMouseDown={() => rootRef.current?.focus()} style={{ height: "100%", width: "100%", display: "grid", gridTemplateColumns: cols, background: '#1c1c1c', padding: 10, boxSizing: 'border-box', overflow: "hidden", position: "relative" }}>
        <style>{`.grid-bg { background-image: radial-gradient(#333 1px, transparent 0); background-size: 16px 16px; background-position: -8px -8px; } .node { position:absolute; background:#111; border:1px solid #2a2a2a; border-radius:12px; font-size:13px; color:#eaeaea; cursor:grab; } .node.selected { border-color:#8b5cf6; box-shadow:0 0 16px #8b5cf644; } .node.running { border-color:#ebcb8b; } .node.success { border-color:#81C784; } .node.error { border-color:#E57373; } .node-header { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:#181818; border-bottom:1px solid #2a2a2a; border-radius:11px 11px 0 0; } .node-b { padding:8px 10px; } .node-resize { position:absolute; right:-2px; bottom:-2px; width:14px; height:14px; background:#151515; border:1px solid #2a2a2a; cursor:nwse-resize; border-radius:0 0 10px 4px; } .port { width:16px; height:16px; background:#121212; border:1px solid #2a2a2a; border-radius:999px; } .port.in { } .port.out { cursor:crosshair; } .marquee { position:absolute; border:1px dashed #8b5cf6; background:rgba(139,92,246,0.1); } .btn { height:30px; padding:0 12px; border-radius:6px; border:1px solid #2a2a2a; background:#1a1a1a; color:#eaeaea; cursor:pointer; } .btn:hover { background:#222; } .suggest { position:absolute; top:100%; left:0; right:0; max-height:400px; overflow-y:auto; background:#0f0f0f; border:1px solid #2a2a2a; border-top:none; border-radius:0 0 8px 8px; z-index:100; } .suggest-item { display:flex; justify-content:space-between; padding:8px 10px; cursor:pointer; } .suggest-item[aria-selected=true] { background:#8b5cf6; } .ctxmenu { position:fixed; z-index:2000; background:#101010; border:1px solid #2a2a2a; border-radius:8px; padding:6px; min-width:180px; box-shadow:0 8px 24px rgba(0,0,0,0.5); transition:transform 80ms ease, opacity 80ms ease; } .ctx-item { padding:8px 12px; border-radius:5px; cursor:pointer; } .ctx-item:hover { background:#8b5cf6; } .loop-container { border: 2px dashed rgba(129, 199, 132, 0.4); border-radius: 20px; position: absolute; pointer-events: none; z-index: 1; } .minimap { position:absolute; right:12px; bottom:20px; z-index:20; background:rgba(12,12,12,0.7); border:1px solid #2a2a2a; border-radius:10px; padding:6px; backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); } .node-viewer-content { height: 100%; display: flex; flex-direction: column; gap: 4px; font-size: 11px; } .canvas-viewer-header { display: flex; flex-shrink: 0; background-color: #00000022; border-radius: 6px; padding: 2px; } .canvas-viewer-btn { flex: 1; background: transparent; border: none; color: #999; padding: 2px 4px; font-size: 10px; border-radius: 4px; cursor: pointer; } .canvas-viewer-btn.active { background-color: #8b5cf6; color: #eee; font-weight: bold; } .canvas-viewer-body { flex: 1; overflow: auto; padding: 4px; background-color: #00000022; border-radius: 6px; } .canvas-viewer-message { color: #888; text-align: center; padding-top: 8px; } .cv-value-null { color: #ff99cc; } .cv-value-true { color: #81C784; } .cv-value-false { color: #E57373; } .summary-list-item { border-bottom: 1px solid #282828; padding: 4px 0; } .summary-list-item:last-child { border-bottom: none; } .summary-list-header { display: flex; align-items: center; cursor: pointer; padding: 3px 0; } .summary-list-icon { margin-right: 4px; width: 12px; } .summary-list-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .summary-list-details { background-color: #00000044; border-radius: 4px; margin: 4px 0; padding: 4px; }
        .inspector-resizer { height: 10px; cursor: row-resize; background: #0d0d0d; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .inspector-resizer-bar { width: 40px; height: 2px; background: #3a3a3a; border-radius: 2px; }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes nodeSpawn { 
          0% { opacity: 0; transform: scale(0.3) translateY(-20px); } 
          60% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1) translateY(0); } 
        }
        .node.spawning { animation: nodeSpawn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .node.comment { font-family: 'Comic Sans MS', 'Chalkduster', 'cursive'; color: #333; box-shadow: 5px 5px 10px rgba(0,0,0,0.2); z-index: 4; }
        .node.comment.color-yellow { --c-bg: #fff9c4; --c-border: #fbc02d; background: var(--c-bg); border-color: var(--c-border); }
        .node.comment.color-blue   { --c-bg: #b3e5fc; --c-border: #0288d1; background: var(--c-bg); border-color: var(--c-border); }
        .node.comment.color-green  { --c-bg: #c8e6c9; --c-border: #388e3c; background: var(--c-bg); border-color: var(--c-border); }
        .node.comment.color-pink   { --c-bg: #f8bbd0; --c-border: #c2185b; background: var(--c-bg); border-color: var(--c-border); }
        .node.comment.color-purple { --c-bg: #e1bee7; --c-border: #7b1fa2; background: var(--c-bg); border-color: var(--c-border); }
        .node.comment.color-grey   { --c-bg: #e0e0e0; --c-border: #616161; background: var(--c-bg); border-color: var(--c-border); }
        .comment-textarea { width: 100%; height: 100%; border: none; background: transparent; padding: 8px; box-sizing: border-box; resize: none; outline: none; font-family: inherit; color: inherit; font-size: 14px; }
        `}</style>

        <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            {!showLeft && (
                <button 
                    onClick={() => setShowLeft(true)}
                    style={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        zIndex: 100, 
                        width: '32px', 
                        height: '80px', 
                        background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)', 
                        border: '1px solid #9d71f6', 
                        borderLeft: 'none',
                        borderRadius: '0 8px 8px 0', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '2px 0 8px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.width = '36px'}
                    onMouseLeave={e => e.currentTarget.style.width = '32px'}
                >
                    <dc.Icon icon="panel-left-open" style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                </button>
            )}
            {showLeft && <LeftPanel {...leftPanelProps} />}
        </div>

        <ResizeHandle onDragStart={handleLeftDragStart} onDragMove={handleLeftDragMove} />

        <CanvasView
            key={flowGeneration}
            nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges}
            selected={selected} setSelected={setSelected} selectedNodeIds={selectedNodeIds}
            setSelectedNodeIds={setSelectedNodeIds} snap={snap} GRID={GRID}
            canvasRef={canvasRef} contentRef={contentRef} pan={pan} setPan={setPan}
            scale={scale} setScale={setScale} connecting={connecting} setConnecting={setConnecting}
            connectionDrag={connectionDrag} setConnectionDrag={setConnectionDrag}
            connectionMenu={connectionMenu} setConnectionMenu={setConnectionMenu}
            ghostNode={ghostNode} setGhostNode={setGhostNode}
            marquee={marquee} setMarquee={setMarquee} mouseWorld={mouseWorld}
            setMouseWorld={setMouseWorld} zoomToFit={zoomToFit} centerOnSelection={centerOnSelection}
            openNodeMenu={openNodeMenu} viewToWorld={viewToWorldMemo}
            onSummonOrb={() => setOrbPos({ x: 20, y: 20 })}
            nodeRunStatus={nodeRunStatus} nodeOutputData={nodeOutputData}
            pushHistory={pushHistory} snapshot={snapshot}
            setShowLeft={setShowLeft} setLeftPanelTab={setLeftPanelTab}
        />

        <ResizeHandle onDragStart={handleRightDragStart} onDragMove={handleRightDragMove} />

        <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            {!showRight && (
                <button 
                    onClick={() => setShowRight(true)}
                    style={{ 
                        position: 'absolute', 
                        right: 0, 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        zIndex: 100, 
                        width: '32px', 
                        height: '80px', 
                        background: 'linear-gradient(270deg, #8b5cf6 0%, #7c3aed 100%)', 
                        border: '1px solid #9d71f6', 
                        borderRight: 'none',
                        borderRadius: '8px 0 0 8px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '-2px 0 8px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.width = '36px'}
                    onMouseLeave={e => e.currentTarget.style.width = '32px'}
                >
                    <dc.Icon icon="panel-right-open" style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                </button>
            )}
            {showRight && <InspectorPanel selected={selected} nodes={nodes} setNodes={setNodes} runLog={runLog} setRunLog={setRunLog} jsonReplacer={jsonReplacer} />}
        </div>
        
        <FloatingOrb
            pos={orbPos}
            setPos={setOrbPos}
            hostRef={rootRef}
            onRunAll={runAll}
            onRunSelection={() => selectedNodeIds[0] && runFromNode(selectedNodeIds[0])}
            onRunSingle={() => selectedNodeIds[0] && runSingleNode(selectedNodeIds[0])}
            onStop={stopRun}
            onFit={zoomToFit}
            onCenter={centerOnSelection}
            onSnapToggle={() => setSnap(s => !s)}
            snap={snap}
            screenHelperRef={screenHelperRef}
            showLeft={showLeft}
            setShowLeft={setShowLeft}
            showRight={showRight}
            setShowRight={setShowRight}
            openNodeMenu={openNodeMenu}
            selectedNodeIds={selectedNodeIds}
            runFromNode={runFromNode}
            duplicateNode={duplicateNode}
            bringToFront={bringToFront}
            sendToBack={sendToBack}
            copyNodeJSON={copyNodeJSON}
            deleteNodeById={deleteNodeById}
        />

        
        {connectionMenu && (
            <div 
                className="ctxmenu" 
                style={{ 
                    left: connectionMenu.left, 
                    top: connectionMenu.top, 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    minWidth: '280px'
                }}
                onMouseDown={e => e.stopPropagation()}
            >
                <div style={{ padding: '8px', borderBottom: '1px solid #2a2a2a', fontSize: 13, fontWeight: 600, color: '#9a9a9a' }}>
                    Select node to connect
                </div>
                {[
                    { type: 'datacore.query', label: 'Datacore Query', icon: 'database', group: 'Input' },
                    { type: 'data.json', label: 'Manual Data', icon: 'file-text', group: 'Input' },
                    { type: 'fs.read', label: 'Read File', icon: 'file', group: 'Input' },
                    { type: 'expr', label: 'Expression', icon: 'zap', group: 'Process' },
                    { type: 'json.filter', label: 'Filter', icon: 'filter', group: 'Process' },
                    { type: 'data.editFields', label: 'Edit Fields', icon: 'edit-3', group: 'Process' },
                    { type: 'array.sort', label: 'Sort', icon: 'arrow-up-down', group: 'Process' },
                    { type: 'if', label: 'If', icon: 'git-branch', group: 'Control' },
                    { type: 'loop.forEach', label: 'For Each', icon: 'repeat', group: 'Control' },
                    { type: 'flow.merge', label: 'Merge', icon: 'git-merge', group: 'Control' },
                    { type: 'fs.write', label: 'Write File', icon: 'save', group: 'Actions' },
                    { type: 'obsidian', label: 'Open File', icon: 'external-link', group: 'Actions' },
                    { type: 'var.set', label: 'Set Var', icon: 'download', group: 'Variables' },
                    { type: 'var.get', label: 'Get Var', icon: 'upload', group: 'Variables' },
                    { type: 'output.display', label: 'Display', icon: 'eye', group: 'Debug' },
                    { type: 'debug.log', label: 'Log', icon: 'bug', group: 'Debug' },
                    { type: 'comment', label: 'Comment', icon: 'message-square', group: 'Debug' }
                ].map((nodeType, idx) => (
                    <div 
                        key={idx}
                        className="ctx-item" 
                        onClick={() => {
                            pushHistory(snapshot());
                            const pos = connectionMenu.releasePos;
                            const newNodeId = Utils.uid("n");
                            const finalX = pos.x - 110;
                            const finalY = pos.y - 48;
                            const newNode = { id: newNodeId, ...nodeType, x: finalX, y: finalY };
                            
                            // Add node and edge together
                            setNodes(v => [...v, newNode]);
                            setEdges(currentEdges => [
                                ...currentEdges, 
                                { 
                                    id: Utils.uid("e"), 
                                    from: { id: connectionMenu.fromNodeId }, 
                                    to: { id: newNodeId } 
                                }
                            ]);
                            setSelected({ type: 'node', id: newNodeId });
                            setSelectedNodeIds([newNodeId]);
                            
                            setConnectionMenu(null);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        <dc.Icon icon={nodeType.icon} style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{nodeType.label}</div>
                            <div style={{ fontSize: 11, color: '#666' }}>{nodeType.group}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        <PromptModal
            isOpen={promptState.isOpen}
            title={promptState.title}
            placeholder={promptState.placeholder}
            initialValue={promptState.initialValue}
            onSubmit={(value) => {
                promptState.onResolve?.(value);
                setPromptState({ isOpen: false });
            }}
            onClose={() => {
                promptState.onResolve?.(null);
                setPromptState({ isOpen: false });
            }}
        />
      </div>
    );
  };


Components.FlowBuilder = FlowBuilder;

// =================================================================================
//  FlowBuilderHost (Wrapper for screen modes)
// =================================================================================
const FlowBuilderHost = () => {
  const containerRef = useRef(null);
  const screenHelperRef = useRef(null);
  const originalParentRefForWindow = useRef(null);
  const originalParentRefForPiP = useRef(null);
  const [showLeft, setShowLeft] = Hooks.usePersistentState("fb.ui.left.visible", true);
  const [showRight, setShowRight] = Hooks.usePersistentState("fb.ui.right.visible", true);
  const [dragging, setDragging] = useState(null);
  useEffect(() => { const vc = containerRef.current?.closest('.view-content'); let prev; if (vc) { prev = vc.style.overflow; vc.style.overflow = 'hidden'; } const parent = containerRef.current?.parentElement; let prevP; if (parent) { prevP = parent.style.overflow; parent.style.overflow = 'hidden'; } return () => { if (vc) vc.style.overflow = prev || ''; if (parent) parent.style.overflow = prevP || ''; }; }, []);
  useEffect(() => { const t = setTimeout(() => { screenHelperRef.current?.toggleMode?.("fullTab"); }, 100); return () => clearTimeout(t); }, []);
  Hooks.useScreenModeHelper({ helperRef: screenHelperRef, containerRef, originalParentRefForWindow, originalParentRefForPiP });
  
  // Calculate container-relative position for drag preview
  const dragPreviewPos = useMemo(() => {
    if (!dragging || !containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: dragging.x - rect.left,
      y: dragging.y - rect.top
    };
  }, [dragging]);
  
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100dvh', maxHeight: '100dvh', minHeight: '400px', backgroundColor: '#1c1c1c', overflow: 'hidden' }}>
      <Components.FlowBuilder hostRef={containerRef} screenHelperRef={screenHelperRef} showLeft={showLeft} setShowLeft={setShowLeft} showRight={showRight} setShowRight={setShowRight} dragging={dragging} setDragging={setDragging} />
      
      {dragPreviewPos && (
        <div style={{ 
          position: "absolute", 
          left: dragPreviewPos.x - 24,
          top: dragPreviewPos.y - 24,
          pointerEvents: "none", 
          zIndex: 99999
        }}>
          <div style={{ 
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            border: "3px solid #a78bfa",
            boxShadow: "0 4px 16px rgba(139, 92, 246, 0.6), 0 0 0 8px rgba(139, 92, 246, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 1.5s ease-in-out infinite"
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#fff",
              opacity: 0.9
            }} />
          </div>
        </div>
      )}
    </div>
  );
};
Components.FlowBuilderHost = FlowBuilderHost;

return { FlowBuilder: Components.FlowBuilderHost };
```

# CanvasComponents

```jsx
const { useState, useRef, useEffect, useMemo } = dc;
const filename = dc.resolvePath("D.q.actionsmanager.component.md");
const { Utils } = await dc.require(dc.headerLink(filename, "Logic"));
const { CanvasViewerContent } = await dc.require(dc.headerLink(filename, "NodeComponents"));

// A set of node types known to primarily output arrays, used for smart connections.
const ARRAY_OUTPUT_NODE_TYPES = new Set([
  'datacore.query',
  'fs.listFiles',
  'data.editFields',
  'json.filter',
  'array.new'
]);

function getNodeRect(n) {
  const x = n.x ?? 0;
  const y = n.y ?? 0;
  const w = n.w ?? n.width ?? (n.type === 'comment' ? 200 : 240);
  const h = n.height ?? n.h ?? (n.type === 'comment' ? 120 : 100);

  return {
    x: isFinite(x) ? x : 0,
    y: isFinite(y) ? y : 0,
    w: isFinite(w) ? w : (n.type === 'comment' ? 200 : 240),
    h: isFinite(h) ? h : (n.type === 'comment' ? 120 : 100)
  };
}
function portPoint(n, side) {
  const r = getNodeRect(n);
  const x = side === "out" ? r.x + r.w : r.x;
  const y = r.y + r.h / 2;
  return { x, y };
}
function pathBetween(a, b) {
  const dx = Math.max(60, Math.abs(b.x - a.x) * 0.5);
  const c1x = a.x + dx, c1y = a.y, c2x = b.x - dx, c2y = b.y;
  return `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
}
function edgeEndId(end) {
  return typeof end === "string" ? end : end?.id;
}

function findLoopBodyNodes(loopNodeId, nodes, edges) {
  const adj = new Map();
  edges.forEach(e => {
    const from = edgeEndId(e.from);
    const to = edgeEndId(e.to);
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
  });

  const startNode = nodes.find(n => n.id === loopNodeId);
  if (!startNode || (startNode.type !== 'loop.forEach' && startNode.type !== 'while' && startNode.type !== 'loop.for')) return new Set();

  const outgoing = edges.filter(e => edgeEndId(e.from) === loopNodeId);
  const bodyEdge = outgoing[0]; // Conventionally the first edge is the body
  if (!bodyEdge) return new Set();

  const bodyStartNodeId = edgeEndId(bodyEdge.to);
  if (!bodyStartNodeId) return new Set();

  const bodyNodes = new Set();
  const q = [bodyStartNodeId];
  const visited = new Set([loopNodeId]);
  let safety = 0;
  const maxSteps = nodes.length + 5;
  while (q.length > 0 && safety++ < maxSteps) {
    const currentId = q.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    bodyNodes.add(currentId);
    const children = adj.get(currentId) || [];
    for (const childId of children) {
      if (childId !== loopNodeId) q.push(childId);
    }
  }
  return bodyNodes;
}


function findInnermostParentLoop(nodeId, nodes, edges) {
  const loopNodes = nodes.filter(n => n.type === 'loop.forEach' || n.type === 'while' || n.type === 'loop.for');
  if (loopNodes.length === 0) return null;

  const loopBodyCache = new Map();
  const getBodyNodes = (loopId) => {
    if (!loopBodyCache.has(loopId)) {
      loopBodyCache.set(loopId, findLoopBodyNodes(loopId, nodes, edges));
    }
    return loopBodyCache.get(loopId);
  };

  const parentLoops = loopNodes.filter(loop => {
    if (loop.id === nodeId) return false;
    const bodyNodes = getBodyNodes(loop.id);
    return bodyNodes.has(nodeId);
  });

  if (parentLoops.length === 0) return null;
  if (parentLoops.length === 1) return parentLoops[0];

  let innermostLoop = null;
  for (const p1 of parentLoops) {
    let isInnermost = true;
    for (const p2 of parentLoops) {
      if (p1.id === p2.id) continue;
      const p1Body = getBodyNodes(p1.id);
      if (p1Body.has(p2.id)) {
        isInnermost = false;
        break;
      }
    }
    if (isInnermost) {
      innermostLoop = p1;
      break;
    }
  }
  return innermostLoop || parentLoops[0];
}

const CanvasView = ({
  nodes, setNodes, edges, setEdges, selected, setSelected, selectedNodeIds, setSelectedNodeIds,
  snap, GRID, canvasRef, contentRef, pan, setPan, scale, setScale, connecting,
  setConnecting, connectionDrag, setConnectionDrag, connectionMenu, setConnectionMenu,
  ghostNode, setGhostNode, marquee, setMarquee, mouseWorld, setMouseWorld, zoomToFit,
  centerOnSelection, openNodeMenu, viewToWorld, onSummonOrb, nodeRunStatus, nodeOutputData,
  pushHistory, snapshot, setShowLeft, setLeftPanelTab
}) => {
  const rafMove = useRef(null);
  const [debugMode, setDebugMode] = useState(false);
  const interactionHistoryPushed = useRef(false);
  const commentColorMap = useMemo(() => ({ yellow: '#fff9c4', blue: '#b3e5fc', green: '#c8e6c9', pink: '#f8bbd0', purple: '#e1bee7', grey: '#e0e0e0' }), []);
  
  const loopContainers = useMemo(() => {
    const containers = [];
    const loopNodes = nodes.filter(n => n.type === 'loop.forEach' || n.type === 'while' || n.type === 'loop.for');

    for (const loopNode of loopNodes) {
      const bodyNodeIds = findLoopBodyNodes(loopNode.id, nodes, edges);
      const allNodesForBounds = [loopNode, ...nodes.filter(n => bodyNodeIds.has(n.id))];

      if (allNodesForBounds.length > 1) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const node of allNodesForBounds) {
          const r = getNodeRect(node);
          minX = Math.min(minX, r.x);
          minY = Math.min(minY, r.y);
          maxX = Math.max(maxX, r.x + r.w);
          maxY = Math.max(maxY, r.y + r.h);
        }

        if (isFinite(minX)) {
          const padding = 24;
          containers.push({
              id: loopNode.id,
              x: minX - padding,
              y: minY - padding,
              w: (maxX - minX) + padding * 2,
              h: (maxY - minY) + padding * 2,
          });
        }
      }
    }
    return containers;
  }, [nodes, edges]);

  // ... (onWheel, startPan, onNodePointerDown, handleStartConnect remain unchanged)
  function onWheel(e) {
    const isZoom = e.ctrlKey || e.metaKey;
    if (isZoom) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      setScale(prev => {
        const next = Utils.clamp(e.deltaY < 0 ? prev * 1.1 : prev / 1.1, 0.3, 2);
        setPan(p => {
          const wx = (px - p.x) / prev, wy = (py - p.y) / prev;
          return { x: px - wx * next, y: py - wy * next };
        });
        return next;
      });
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }

  function startPan(e) {
    if (e.button === 1 || e.spaceKeyHack || e.currentTarget.spaceKeyHack) {
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY;
      const sp = { ...pan };
      const move = (ev) => {
        if (rafMove.current) return;
        rafMove.current = requestAnimationFrame(() => {
          rafMove.current = null;
          setPan({ x: sp.x + (ev.clientX - sx), y: sp.y + (ev.clientY - sy) });
        });
      };
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      return;
    }
    if (e.button !== 0) return;
    if (e.target.closest("[data-node]") || e.target.closest('.port') || e.target.closest('[data-edge-hitbox]')) return;
    const start = viewToWorld(e.clientX, e.clientY);
    setMarquee({ start, end: start });
    let hasMoved = false;
    
    const move = (ev) => {
      hasMoved = true;
      const end = viewToWorld(ev.clientX, ev.clientY);
      setMarquee(m => m ? ({ ...m, end }) : m);
      
      // Update selection in real-time as marquee changes
      const selRect = Utils.rectFromPoints(start, end);
      const picked = nodes
        .filter(n => {
          const r = getNodeRect(n);
          return Utils.rectIntersects({ x: r.x, y: r.y, w: r.w, h: r.h }, selRect);
        })
        .map(n => n.id);
      setSelectedNodeIds(picked);
      if (picked[0]) setSelected({ type: "node", id: picked[0] });
    };
    const up = () => {
      setMarquee(null);
      // If no movement, it was just a click - deselect all
      if (!hasMoved) {
        setSelectedNodeIds([]);
        setSelected({ type: null, id: null });
      }
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function onNodePointerDown(e, id) {
    if (e.target.closest(".port") || e.target.closest(".comment-textarea")) return;
    e.stopPropagation();

    const currentSelection = new Set(selectedNodeIds);
    const isSelected = currentSelection.has(id);
    let nextSelectedNodeIds = [...selectedNodeIds];
    let selectionChanged = false;

    if (e.shiftKey) {
        if (isSelected) {
            nextSelectedNodeIds = selectedNodeIds.filter(selectedId => selectedId !== id);
        } else {
            nextSelectedNodeIds.push(id);
        }
        selectionChanged = true;
        setSelectedNodeIds(nextSelectedNodeIds);
    } else if (!isSelected) {
        // Only change selection if clicking on an unselected node
        nextSelectedNodeIds = [id];
        selectionChanged = true;
        setSelectedNodeIds(nextSelectedNodeIds);
    }
    // If clicking on an already-selected node, keep all selections for dragging

    setSelected({ type: "node", id });
    if (e.button !== 0) return;

    const startDrag = viewToWorld(e.clientX, e.clientY);
    const startPos = new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }]));
    const selSet = new Set(nextSelectedNodeIds);
    let hasMoved = false;

    const move = (ev) => {
      hasMoved = true;
      if (!interactionHistoryPushed.current) {
        pushHistory(snapshot());
        interactionHistoryPushed.current = true;
      }
      const cur = viewToWorld(ev.clientX, ev.clientY);
      const dx = cur.x - startDrag.x, dy = cur.y - startDrag.y;
      setNodes(v => v.map(n => {
        if (selSet.has(n.id)) {
          const b = startPos.get(n.id);
          const nx = snap ? Math.round((b.x + dx) / GRID) * GRID : b.x + dx;
          const ny = snap ? Math.round((b.y + dy) / GRID) * GRID : b.y + dy;
          return { ...n, x: nx, y: ny };
        }
        return n;
      }));
    };
    const up = () => {
        // If no movement occurred and multiple nodes were selected, select only this one
        if (!hasMoved && isSelected && currentSelection.size > 1 && !e.shiftKey) {
            setSelectedNodeIds([id]);
        }
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        interactionHistoryPushed.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }


  function handleStartConnect(e, fromNodeId) {
    e.stopPropagation();
    setConnecting({ from: fromNodeId });

    const handlePointerUp = (upEvent) => {
      window.removeEventListener('pointerup', handlePointerUp);
      const targetNodeEl = upEvent.target.closest('[data-node-id]');

      if (targetNodeEl) {
        const toNodeId = targetNodeEl.getAttribute('data-node-id');
        if (toNodeId && toNodeId !== fromNodeId) {

          const fromNode = nodes.find(n => n.id === fromNodeId);
          const toNode = nodes.find(n => n.id === toNodeId);

          if (fromNode && toNode) {
            if (ARRAY_OUTPUT_NODE_TYPES.has(fromNode.type) && toNode.type === 'loop.forEach') {
              setNodes(currentNodes => currentNodes.map(n => {
                  if (n.id === toNodeId) {
                    const paramExists = n.params.some(p => p.key === 'list');
                    const newParams = paramExists
                      ? n.params.map(p => p.key === 'list' ? { ...p, value: '=last' } : p)
                      : [...n.params, { key: 'list', value: '=last' }];
                    return { ...n, params: newParams };
                  }
                  return n;
                }));
            }
            else if (fromNode.type === 'loop.forEach' && toNode.type === 'obsidian') {
                const itemName = fromNode.params.find(p => p.key === 'itemName')?.value || 'item';
                const expression = `=vars.${itemName}`;

                setNodes(currentNodes => currentNodes.map(n => {
                    if (n.id === toNodeId) {
                        const paramExists = n.params.some(p => p.key === 'path');
                        const newParams = paramExists
                            ? n.params.map(p => p.key === 'path' ? { ...p, value: expression } : p)
                            : [...n.params, { key: 'path', value: expression }];
                        return { ...n, params: newParams };
                    }
                    return n;
                }));
            }
          }

          setEdges(currentEdges => {
            const exists = currentEdges.some(edge => edgeEndId(edge.from) === fromNodeId && edgeEndId(edge.to) === toNodeId);
            if (exists) return currentEdges;
            if (pushHistory && snapshot) pushHistory(snapshot());
            return [...currentEdges, { id: Utils.uid("e"), from: { id: fromNodeId }, to: { id: toNodeId } }];
          });
        }
      }
      setConnecting(null);
    };
    window.addEventListener('pointerup', handlePointerUp);
  }

  function handleConnectionDragStart(e, fromNodeId) {
    e.stopPropagation();
    const fromNode = nodes.find(n => n.id === fromNodeId);
    if (!fromNode) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const startWorld = viewToWorld(e.clientX, e.clientY);
    
    setConnectionDrag({
      fromNodeId,
      startPos: startWorld,
      currentPos: startWorld
    });

    const handlePointerMove = (moveEvent) => {
      const currentWorld = viewToWorld(moveEvent.clientX, moveEvent.clientY);
      setConnectionDrag(prev => prev ? { ...prev, currentPos: currentWorld } : null);
    };

    const handlePointerUp = (upEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      const releaseWorld = viewToWorld(upEvent.clientX, upEvent.clientY);
      
      // Check if released on an existing node
      const targetEl = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const targetNodeEl = targetEl?.closest('[data-node-id]');
      
      if (targetNodeEl) {
        const toNodeId = targetNodeEl.getAttribute('data-node-id');
        if (toNodeId && toNodeId !== fromNodeId) {
          // Connect to existing node
          pushHistory(snapshot());
          setEdges(currentEdges => {
            const exists = currentEdges.some(edge => edgeEndId(edge.from) === fromNodeId && edgeEndId(edge.to) === toNodeId);
            if (exists) return currentEdges;
            return [...currentEdges, { id: Utils.uid("e"), from: { id: fromNodeId }, to: { id: toNodeId } }];
          });
          setConnectionDrag(null);
          return;
        }
      }
      
      // Create ghost node at release position
      const ghostId = Utils.uid("ghost");
      setGhostNode({
        id: ghostId,
        fromNodeId: fromNodeId,
        x: releaseWorld.x - 110,
        y: releaseWorld.y - 48
      });
      
      // Open left panel to palette
      setShowLeft(true);
      setLeftPanelTab('palette');
      
      setConnectionDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  return (
    <div
      ref={canvasRef}
      className="grid-bg"
      onWheel={onWheel}
      onPointerDown={startPan}
      onPointerMove={(e) => setMouseWorld(viewToWorld(e.clientX, e.clientY))}
      style={{ height: "100%", border: "1px solid #2a2a2a", borderRadius: 12, position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, zIndex: 20 }}>
        <button className="btn" onClick={() => { setShowLeft(true); setLeftPanelTab('palette'); }} style={{background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", border: '1px solid #9d71f6', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'}}>
          <dc.Icon icon="plus-circle" style={{ width: '18px', height: '18px' }} />
          Add Node
        </button>
        <button className="btn" onClick={zoomToFit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <dc.Icon icon="maximize-2" style={{ width: '16px', height: '16px' }} />
          View All
        </button>
        <button className="btn" onClick={onSummonOrb} style={{background: "#5b21b6", display: 'flex', alignItems: 'center', gap: '6px'}}>
          <dc.Icon icon="sparkles" style={{ width: '16px', height: '16px' }} />
          Summon Orb
        </button>
        <button className="btn" onClick={() => setDebugMode(d => !d)} style={{background: debugMode ? "#8b5cf6" : "#2a2a2a", display: 'flex', alignItems: 'center', gap: '6px'}}>
          <dc.Icon icon={debugMode ? "bug" : "bug-off"} style={{ width: '16px', height: '16px' }} />
          Debug {debugMode ? 'On' : 'Off'}
        </button>
      </div>

      <div
        ref={contentRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%"
        }}
      >
        {loopContainers.map(c => (
          <div key={c.id} className="loop-container" style={{ left: c.x, top: c.y, width: c.w, height: c.h }} />
        ))}

        <svg width="100%" height="100%" style={{ position: "absolute", left: 0, top: 0, zIndex: 2, pointerEvents: "none", overflow: "visible" }} >
          {edges.map(ed => {
            const logicalFromId = edgeEndId(ed.from);
            const visualFromId = ed.originalFromId || logicalFromId;
            const toId = edgeEndId(ed.to);
            
            const logicalFromNode = nodes.find(n => n.id === logicalFromId);
            const visualFromNode = nodes.find(n => n.id === visualFromId);
            const toNode = nodes.find(n => n.id === toId);

            if (!logicalFromNode || !visualFromNode || !toNode) return null;

            const p1 = portPoint(visualFromNode, "out");
            const p2 = portPoint(toNode, "in");
            let stroke = "#a78bfa", strokeWidth = 2, strokeDasharray = "none";
            
            const isFromLoopNode = logicalFromNode.type === 'loop.forEach' || logicalFromNode.type === 'while' || logicalFromNode.type === 'loop.for';

            if (isFromLoopNode) {
                const outgoing = edges.filter(e => edgeEndId(e.from) === logicalFromId);
                if (outgoing[0]?.id === ed.id) {
                    stroke = "#c4b5fd"; // Body (lighter purple)
                    strokeDasharray = "8 4";
                } else {
                    stroke = "#7c3aed"; // Done (darker purple)
                }
            }

            return (
              <g key={ed.id}>
                <path d={pathBetween(p1, p2)} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} fill="none" vectorEffect="non-scaling-stroke" />
                <path
                  data-edge-hitbox
                  d={pathBetween(p1, p2)}
                  stroke="transparent"
                  strokeWidth={16}
                  fill="none"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onPointerDown={(e) => {
                      e.stopPropagation();
                      console.groupCollapsed(`[Edge Click] Edge ID: ${ed.id}`);
                      console.log("Edge Data:", ed);

                      let actionToTake;
                      const fromNode = logicalFromNode;
                      const isFromLoopNode = fromNode.type === 'loop.forEach' || fromNode.type === 'while' || fromNode.type === 'loop.for';
                      
                      const outgoingFromLoop = isFromLoopNode ? edges.filter(edge => edgeEndId(edge.from) === fromNode.id) : [];
                      const isBodyEdge = isFromLoopNode && outgoingFromLoop.length > 0 && ed.id === outgoingFromLoop[0].id;
                      
                      if(isBodyEdge) {
                          console.log("%cAction: Ignored. Clicked on a loop's main 'body' link.", "color: grey;");
                          actionToTake = null;
                      } else {
                          const parentLoop = findInnermostParentLoop(fromNode.id, nodes, edges);
                          if(parentLoop) {
                              console.log(`%cCASE 1: Link is from a node inside a loop. Action will be 'promote'.`, "font-weight: bold; color: #34a853;");
                              actionToTake = { type: 'promote', edgeId: ed.id, newFromId: parentLoop.id, originalFromId: fromNode.id };
                          } else {
                              console.log("%cCASE 2: Link is at base level or is a 'Done' link. Action will be 'delete'.", "font-weight: bold; color: #d93025;");
                              actionToTake = { type: 'delete', edgeId: ed.id };
                          }
                      }
                      
                      if (!actionToTake) {
                          console.groupEnd();
                          return;
                      }
                      
                      const handlePointerUp = () => {
                          window.removeEventListener('pointerup', handlePointerUp);
                          console.groupCollapsed(`[PointerUp] Executing Action: ${actionToTake.type.toUpperCase()}`);
                          console.log("Action Details:", actionToTake);
                          
                          pushHistory(snapshot());

                          if (actionToTake.type === 'promote') {
                               setEdges(prevEdges => {
                                  return prevEdges.map(edge => {
                                      if (edge.id === actionToTake.edgeId) {
                                          return {
                                              ...edge,
                                              from: { id: actionToTake.newFromId },
                                              originalFromId: actionToTake.originalFromId,
                                          };
                                      }
                                      return edge;
                                  });
                              });
                          } else if (actionToTake.type === 'delete') {
                              setEdges(prev => prev.filter(edge => edge.id !== actionToTake.edgeId));
                          }
                          
                          console.log("Action complete.");
                          console.groupEnd(); 
                          console.groupEnd(); 
                      };
                      
                      window.addEventListener('pointerup', handlePointerUp, { once: true });
                  }}
                />
              </g>
            );
          })}
          {connecting && (() => {
            const a = nodes.find(x => x.id === connecting.from);
            if (!a) return null;
            const p1 = portPoint(a, "out");
            return ( <path d={pathBetween(p1, mouseWorld)} stroke="#c4b5fd" strokeWidth={2} fill="none" opacity={0.6} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" /> );
          })()}
          {connectionDrag && (() => {
            const fromNode = nodes.find(x => x.id === connectionDrag.fromNodeId);
            if (!fromNode) return null;
            const r = getNodeRect(fromNode);
            const startPoint = { x: r.x + r.w + 8, y: r.y + r.h / 2 };
            const endPoint = connectionDrag.currentPos;
            return ( <path d={pathBetween(startPoint, endPoint)} stroke="#a78bfa" strokeWidth={3} fill="none" opacity={0.8} vectorEffect="non-scaling-stroke" /> );
          })()}
        </svg>

        {nodes.map(n => {
          const isSel = new Set(selectedNodeIds).has(n.id);
          const status = nodeRunStatus[n.id]?.status;
          const statusClass = status ? ` ${status}` : '';
          const isViewerNode = n.type === 'output.viewer' || n.type === 'output.display';
          const r = getNodeRect(n);

          if (n.type === 'comment') {
              const text = n.params.find(p => p.key === 'text')?.value || '';
              const color = n.params.find(p => p.key === 'color')?.value || 'yellow';

              const updateText = (newText) => {
                  setNodes(nodes => nodes.map(node => {
                      if (node.id === n.id) {
                          const hasParam = node.params.some(p => p.key === 'text');
                          const newParams = hasParam
                              ? node.params.map(p => p.key === 'text' ? { ...p, value: newText } : p)
                              : [...node.params, { key: 'text', value: newText }];
                          return { ...node, params: newParams };
                      }
                      return node;
                  }));
              };

              return (
                  <div
                      key={n.id}
                      data-node
                      data-node-id={n.id}
                      onPointerDown={(e) => onNodePointerDown(e, n.id)}
                      className={`node comment color-${color}` + (isSel ? " selected" : "") + (n._justSpawned ? " spawning" : "")}
                      style={{ left: r.x, top: r.y, width: r.w, height: r.h, position: "absolute" }}
                  >
                      <textarea
                          value={text}
                          onChange={e => updateText(e.target.value)}
                          onPointerDown={e => e.stopPropagation()}
                          className="comment-textarea"
                          placeholder="Type your comment..."
                      />
                  </div>
              );
          }

          return (
            <div
              key={n.id}
              data-node
              data-node-id={n.id}
              onPointerDown={(e) => onNodePointerDown(e, n.id)}
              onDoubleClick={() => setSelected({ type: "node", id: n.id })}
              className={"node shadow-soft" + (isSel ? " selected" : "") + statusClass + (n._justSpawned ? " spawning" : "")}
              style={{
                left: r.x, top: r.y, width: r.w, height: r.h,
                display: 'flex', flexDirection: 'column', zIndex: 5,
                outline: debugMode ? '1px solid yellow' : 'none',
                position: "absolute"
              }}
            >
              <div className="node-header">
                <div style={{ fontSize: 12, fontWeight: 700 }}>{n.label}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {n.type !== 'datacore.query' && <div className="port in" data-node-id={n.id} />}
                  {(n.outputs || []).length !== 0 && <div className="port out" onPointerDown={(e) => handleStartConnect(e, n.id)} data-node-id={n.id} />}
                </div>
              </div>
              <div className="node-b" style={{ fontSize: 12, color: "#9a9a9a", flex: '1 1 0', minHeight: 0 }}>
                <div style={{ fontSize: 11, color: '#666', fontFamily: 'monospace', marginBottom: '4px' }}>{n.type}</div>
                {!isViewerNode &&
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: '8px' }}>
                    {(n.params || []).slice(0, 3).map((p, i) => (
                      <div key={i} style={{ padding: "2px 6px", borderRadius: 6, background: "#151515", border: "1px solid #222" }}>
                        {p.key || "param"}:{String(p.value)}
                      </div>
                    ))}
                  </div>
                }
                {isViewerNode &&
                  <CanvasViewerContent
                    node={n}
                    data={nodeOutputData[n.id] ?? n.persistedOutput}
                  />
                }
              </div>
              {isSel && (
                <div
                  onPointerDown={(e) => handleConnectionDragStart(e, n.id)}
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: '2px solid #1c1c1c',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.5)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.2)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.5)';
                  }}
                />
              )}
            </div>
          );
        })}

        {ghostNode && (
          <div
            style={{
              position: 'absolute',
              left: ghostNode.x,
              top: ghostNode.y,
              width: 240,
              height: 100,
              border: '2px dashed #8b5cf6',
              borderRadius: 12,
              background: 'rgba(139, 92, 246, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b5cf6',
              fontSize: 14,
              fontWeight: 600,
              zIndex: 10,
              pointerEvents: 'none',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            Select node type from palette →
          </div>
        )}

        {marquee && (() => {
          const r = Utils.rectFromPoints(marquee.start, marquee.end);
          return <div className="marquee" style={{ left: r.x, top: r.y, width: r.w, height: r.h, zIndex: 100 }} />;
        })()}
      </div>

      <div
        className="minimap"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left - 6; // Account for padding
          const y = e.clientY - rect.top - 6;
          
          // Calculate bounds of all nodes
          if (nodes.length === 0) return;
          const bounds = nodes.reduce((acc, n) => {
            const r = getNodeRect(n);
            return {
              minX: Math.min(acc.minX, r.x),
              minY: Math.min(acc.minY, r.y),
              maxX: Math.max(acc.maxX, r.x + r.w),
              maxY: Math.max(acc.maxY, r.y + r.h)
            };
          }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
          
          // Add padding around bounds for context
          const padding = 400;
          const boundsWidth = (bounds.maxX - bounds.minX) + padding * 2;
          const boundsHeight = (bounds.maxY - bounds.minY) + padding * 2;
          const boundsMinX = bounds.minX - padding;
          const boundsMinY = bounds.minY - padding;
          
          const minimapWidth = 200;
          const minimapHeight = 140;
          const scaleX = minimapWidth / boundsWidth;
          const scaleY = minimapHeight / boundsHeight;
          const ms = Math.min(scaleX, scaleY);
          
          const worldX = boundsMinX + (x / ms);
          const worldY = boundsMinY + (y / ms);
          setPan({ x: (canvasRef.current.clientWidth / 2) - worldX * scale, y: (canvasRef.current.clientHeight / 2) - worldY * scale });
        }}
      >
        <div style={{ width: 200, height: 140, position: "relative", background: "#0b0b0b", border: "1px solid #1f1f1f", borderRadius: 8, overflow: "hidden" }}>
          {(() => {
            if (nodes.length === 0) return null;
            
            // Calculate bounds of all nodes
            const bounds = nodes.reduce((acc, n) => {
              const r = getNodeRect(n);
              return {
                minX: Math.min(acc.minX, r.x),
                minY: Math.min(acc.minY, r.y),
                maxX: Math.max(acc.maxX, r.x + r.w),
                maxY: Math.max(acc.maxY, r.y + r.h)
              };
            }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
            
            // Add padding around bounds for context
            const padding = 400;
            const boundsWidth = (bounds.maxX - bounds.minX) + padding * 2;
            const boundsHeight = (bounds.maxY - bounds.minY) + padding * 2;
            const boundsMinX = bounds.minX - padding;
            const boundsMinY = bounds.minY - padding;
            
            const minimapWidth = 200;
            const minimapHeight = 140;
            
            // Calculate scale to fit all nodes in minimap - much smaller now
            const scaleX = minimapWidth / boundsWidth;
            const scaleY = minimapHeight / boundsHeight;
            const ms = Math.min(scaleX, scaleY); // No cap, let it scale down as needed
            
            // Calculate viewport rectangle
            const canvasWidth = canvasRef.current?.clientWidth || 800;
            const canvasHeight = canvasRef.current?.clientHeight || 600;
            const viewportWorldX = -pan.x / scale;
            const viewportWorldY = -pan.y / scale;
            const viewportWorldWidth = canvasWidth / scale;
            const viewportWorldHeight = canvasHeight / scale;
            
            const viewportMinimapX = (viewportWorldX - boundsMinX) * ms;
            const viewportMinimapY = (viewportWorldY - boundsMinY) * ms;
            const viewportMinimapW = viewportWorldWidth * ms;
            const viewportMinimapH = viewportWorldHeight * ms;
            
            return (<>
              {nodes.map(n => {
                const r = getNodeRect(n);
                let minimapBg = "#2a2a2a";
                if (n.type === 'comment') {
                    const colorName = n.params.find(p => p.key === 'color')?.value || 'yellow';
                    minimapBg = commentColorMap[colorName] || commentColorMap.yellow;
                }
                return (
                  <div
                    key={n.id}
                    style={{
                      position: "absolute",
                      left: (r.x - boundsMinX) * ms,
                      top: (r.y - boundsMinY) * ms,
                      width: r.w * ms,
                      height: r.h * ms,
                      background: minimapBg,
                      borderRadius: 1,
                      opacity: new Set(selectedNodeIds).has(n.id) ? 1 : 0.5
                    }}
                  />
                );
              })}
              <div
                style={{
                  position: "absolute",
                  left: viewportMinimapX,
                  top: viewportMinimapY,
                  width: viewportMinimapW,
                  height: viewportMinimapH,
                  border: "2px solid #a78bfa",
                  borderRadius: 4,
                  pointerEvents: "none",
                  boxShadow: "0 0 8px rgba(167, 139, 250, 0.5)"
                }}
              />
            </>);
          })()}
        </div>
      </div>
    </div>
  );
};

return { CanvasView };
```

# NodeComponents

```jsx
// =================================================================================
//  MODULE: NodeComponents
//  Desc:   Contains components rendered within canvas nodes (Editors, Viewers).
// =================================================================================
const { useState, useRef, useEffect, useMemo } = dc;
const filename = dc.resolvePath("D.q.actionsmanager.component.md");

// Import necessary dependencies from other modules
const { 
    ResultItem, TagHelper, FolderHelper, FileHelper,
    GenericPropertyHelper, ComparisonOperatorHelper, jsonReplacer 
} = await dc.require(dc.headerLink(filename, "UI_Components"));


const DatacoreQueryEditor = function DatacoreQueryEditor({ node, setNodes }) {
  const initialQuery = useMemo(() => node.params.find(p => p.key === 'query')?.value || '', [node.params]);
  const initialFilePath = useMemo(() => node.params.find(p => p.key === 'outputFilePath')?.value || '', [node.params]);

  const [inputValue, setInputValue] = useState(initialQuery);
  const [outputFilePath, setOutputFilePath] = useState(initialFilePath);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });

  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const textareaRef = useRef(null);
  const inputAreaRef = useRef(null);

  const [helperState, setHelperState] = useState({ type: null, step: null, searchTerm: '', startIndex: 0, context: {}, position: { top: 0 } });

  const [addonOpen, setAddonOpen] = useState(false);
  const addonTimer = useRef(null);
  const addonRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => { setNodes(nodes => nodes.map(n => { if (n.id !== node.id) return n; const hasQ = n.params.some(p => p.key === 'query'); const params = hasQ ? n.params.map(p => p.key === 'query' ? { ...p, value: inputValue } : p) : [...n.params, { key: 'query', value: inputValue }]; return { ...n, params }; })); }, 250); return () => clearTimeout(t); }, [inputValue, node.id, setNodes]);
  useEffect(() => { const t = setTimeout(() => { setNodes(nodes => nodes.map(n => { if (n.id !== node.id) return n; const has = n.params.some(p => p.key === 'outputFilePath'); const params = has ? n.params.map(p => p.key === 'outputFilePath' ? { ...p, value: outputFilePath } : p) : [...n.params, { key: 'outputFilePath', value: outputFilePath }]; return { ...n, params }; })); }, 250); return () => clearTimeout(t); }, [outputFilePath, node.id, setNodes]);
  useEffect(() => { setLoading(true); const t = setTimeout(() => { const q = inputValue.trim(); if (!q) { setResults(null); setLoading(false); setError(null); return; } try { const queryResult = dc.api.query(q); setResults(queryResult); setError(null); setCurrentPage(1); } catch (e) { setError(e); setResults(null); } setLoading(false); }, 250); return () => clearTimeout(t); }, [inputValue]);

  function tidy(q) { return q.replace(/\s+/g, ' ').replace(/\s*(AND|OR)\s*/g, ' $1 ').replace(/^\s*(AND|OR)\s*/i, '').replace(/\s*(AND|OR)\s*$/i, '').replace(/\s{2,}/g, ' ').trim(); }
  function removeByRegex(q, rx) { const once = q.replace(rx, ' '); return tidy(once); }

  const parsed = useMemo(() => { const q = inputValue || ''; const chips = []; const baseType = (q.match(/@[\w-]+(?:-list)?/i) || [])[0]; if (baseType) chips.push({ kind: 'base', label: baseType, remove: () => setInputValue(tidy(q.replace(baseType, ''))) }); q.replace(/#([\w-]+)/g, (m) => { chips.push({ kind: 'tag', label: m, remove: () => setInputValue(removeByRegex(q, new RegExp(`(^|\\s)(AND\\s+|OR\\s+)?${m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s+(AND|OR))?(?=\\s|$)`, 'i'))) }); return m; }); q.replace(/path\("([^"]*)"\)/g, (m) => { chips.push({ kind: 'path', label: m, remove: () => setInputValue(removeByRegex(q, new RegExp(m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'))) }); return m; }); q.replace(/exists\(([^)]*)\)/g, (m) => { chips.push({ kind: 'exists', label: m, remove: () => setInputValue(removeByRegex(q, new RegExp(m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'))) }); return m; }); q.replace(/(connected|linkedto|linkedfrom)\(\[\[([^\]]+)\]\]\)/g, (m) => { chips.push({ kind: 'link', label: m, remove: () => setInputValue(removeByRegex(q, new RegExp(m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'))) }); return m; }); q.replace(/(parentof|childof|supertree|subtree)\((@[a-z\-]+)\)/ig, (m) => { chips.push({ kind: 'struct', label: m, remove: () => setInputValue(removeByRegex(q, new RegExp(m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'))) }); return m; }); if (/\$completed\b/i.test(q)) { chips.push({ kind: 'flag', label: '$completed', remove: () => setInputValue(removeByRegex(q, /\$completed\b/i)) }); } return { baseType, chips }; }, [inputValue]);
  const addOns = [ { g: 'Common', label: 'Tag', value: '#', helper: 'tag', selection: { start_offset: 0, length: 0 }, desc: 'Add a #tag' }, { g: 'Common', label: 'Path', value: 'path("")', helper: 'folder', selection: { start_offset: -2, length: 0 }, desc: 'path("Folder/Sub")' }, { g: 'Common', label: 'Exists', value: 'exists()', helper: 'property', selection: { start_offset: -1, length: 0 }, desc: 'exists(field)' }, { g: 'Links', label: 'Connected', value: 'connected([[]])', helper: 'file', selection: { start_offset: -3, length: 0 } }, { g: 'Links', label: 'Linked To', value: 'linkedto([[]])', helper: 'file', selection: { start_offset: -3, length: 0 } }, { g: 'Links', label: 'Linked From', value: 'linkedfrom([[]])', helper: 'file', selection: { start_offset: -3, length: 0 } }, { g: 'Structure', label: 'Parent Of', value: 'parentof(@page)', selection: { start_offset: -6, length: 5 } }, { g: 'Structure', label: 'Child Of', value: 'childof(@page)', selection: { start_offset: -6, length: 5 } }, { g: 'Structure', label: 'Supertree', value: 'supertree(@codeblock)', selection: { start_offset: -6, length: 9 } }, { g: 'Structure', label: 'Subtree', value: 'subtree(@page)', selection: { start_offset: -6, length: 5 } }, { g: 'Flags', label: '$completed', value: '$completed' }, { g: 'Filter', label: 'Field Query…', isWizard: true } ];
  const baseTypes = [ '@page', '@task', '@file', '@section', '@block', '@block-list', '@codeblock', '@datablock', '@list-item' ];
  const focusAndMaybeHelper = (fragment, helperType, selection) => { const currentQuery = inputValue.trim(); const prefix = currentQuery === "" ? "" : currentQuery + " AND "; const newQuery = prefix + fragment; setInputValue(newQuery); setTimeout(() => { const textarea = textareaRef.current; if (!textarea) return; textarea.focus(); if (selection) { const selectionStart = newQuery.length + selection.start_offset; const selectionEnd = selectionStart + selection.length; textarea.setSelectionRange(selectionStart, selectionEnd); } else { textarea.setSelectionRange(newQuery.length, newQuery.length); } if (helperType) { const startIndex = prefix.length; let context = { fullMatch: fragment }; if (helperType === 'file') { context.function = fragment.substring(0, fragment.indexOf('(')); } setHelperState({ type: helperType, step: null, searchTerm: '', startIndex, context, position: { top: textarea.offsetHeight + 2 } }); } else { setHelperState({ type: null }); } }, 0); };
  const checkAndSetHelpers = (query, cursorPosition) => { const textarea = textareaRef.current; if (!textarea) return; const currentPosition = { top: textarea.offsetHeight + 2 }; const triggerChar = query[cursorPosition - 1]; const textBeforeTrigger = query.substring(0, cursorPosition - 1).trim(); if (triggerChar === '$' && (textBeforeTrigger === '' || textBeforeTrigger.endsWith('AND') || textBeforeTrigger.endsWith('OR'))) { const newQuery = query.slice(0, cursorPosition - 1) + query.slice(cursorPosition); setInputValue(newQuery); setHelperState({ type: 'filter', step: 'select_property', searchTerm: '', startIndex: cursorPosition - 1, context: {}, position: currentPosition }); setTimeout(() => textarea.focus(), 0); return; } const fileRegex = /(connected|linkedto|linkedfrom)\(\[\[([^\]]*)\]\]\)/g; let match; while ((match = fileRegex.exec(query)) !== null) { const contentStartIndex = match.index + match[1].length + 3; const contentEndIndex = match.index + match[0].length - 2; if (cursorPosition >= contentStartIndex && cursorPosition <= contentEndIndex) { const currentSearchTerm = query.substring(contentStartIndex, contentEndIndex); setHelperState({ type: 'file', searchTerm: currentSearchTerm, startIndex: match.index, context: { function: match[1], fullMatch: match[0] }, position: currentPosition }); return; } } const pathRegex = /path\("([^"]*)"\)/g; while ((match = pathRegex.exec(query)) !== null) { const contentStartIndex = match.index + 6; const contentEndIndex = match.index + match[0].length - 2; if (cursorPosition >= contentStartIndex && cursorPosition <= contentEndIndex) { const currentSearchTerm = query.substring(contentStartIndex, contentEndIndex); setHelperState({ type: 'folder', searchTerm: currentSearchTerm, startIndex: match.index, context: { fullMatch: match[0] }, position: currentPosition }); return; } } const existsRegex = /exists\(([^)]*)\)/g; while ((match = existsRegex.exec(query)) !== null) { const contentStartIndex = match.index + 7; const contentEndIndex = match.index + match[0].length - 1; if (cursorPosition >= contentStartIndex && cursorPosition <= contentEndIndex) { const currentSearchTerm = query.substring(contentStartIndex, contentEndIndex); setHelperState({ type: 'property', searchTerm: currentSearchTerm, startIndex: match.index, context: { fullMatch: match[0] }, position: currentPosition }); return; } } const textBeforeCursor = query.substring(0, cursorPosition); if (helperState.type === 'filter') return; const fileMatch = textBeforeCursor.match(/(connected|linkedto|linkedfrom)\(\[\[([^\]]*)$/); if (fileMatch) { setHelperState({ type: 'file', searchTerm: fileMatch[2], startIndex: fileMatch.index, context: { function: fileMatch[1], fullMatch: fileMatch[0] }, position: currentPosition }); return; } const pathMatch = textBeforeCursor.match(/path\("([^"]*)$/); if (pathMatch) { setHelperState({ type: 'folder', searchTerm: pathMatch[1], startIndex: pathMatch.index, context: { fullMatch: pathMatch[0] }, position: currentPosition }); return; } const existsMatch = textBeforeCursor.match(/\bexists\(([^)]*)$/); if (existsMatch) { setHelperState({ type: 'property', searchTerm: existsMatch[1], startIndex: existsMatch.index, context: { fullMatch: existsMatch[0] }, position: currentPosition }); return; } const tagMatch = textBeforeCursor.match(/#([\w-]*)$/); if (tagMatch) { setHelperState({ type: 'tag', searchTerm: tagMatch[1], startIndex: tagMatch.index, context: { fullMatch: tagMatch[0] }, position: currentPosition }); return; } setHelperState({ type: null }); };
  const handleInputChange = (e) => { const { value, selectionStart } = e.target; setInputValue(value); if (helperState.type === 'filter' && helperState.step === 'select_property') { const newSearchTerm = value.substring(helperState.startIndex, selectionStart); setHelperState(s => ({ ...s, searchTerm: newSearchTerm })); } };
  const handleCursorMove = (e) => { checkAndSetHelpers(e.target.value, e.target.selectionStart); };
  const handleHelperSelect = (selectedValue, type) => { const { startIndex, context } = helperState; let replacement = ''; if (type === 'tag') replacement = `#${selectedValue} `; else if (type === 'folder') replacement = `path("${selectedValue}") `; else if (type === 'file') replacement = `${context.function}([[${selectedValue}]]) `; else if (type === 'property') replacement = `exists(${selectedValue}) `; const textBeforeFragment = inputValue.substring(0, startIndex); const endOfReplacementIndex = context.fullMatch ? startIndex + context.fullMatch.length : textareaRef.current.selectionEnd; const textAfterFragment = inputValue.substring(endOfReplacementIndex); const newQuery = textBeforeFragment + replacement + textAfterFragment; setInputValue(tidy(newQuery)); setHelperState({ type: null }); setTimeout(() => { const newCursorPos = (textBeforeFragment + replacement).length; textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos); }, 0); };
  const handleStartFilterWizard = () => { const textarea = textareaRef.current; if (!textarea) return; setInputValue(currentVal => { const trimmed = currentVal.trim(); const newQuery = (trimmed === "" || /\b(AND|OR)\s*$/.test(trimmed)) ? currentVal : currentVal + " AND "; setHelperState({ type: 'filter', step: 'select_property', searchTerm: '', startIndex: newQuery.length, context: {}, position: { top: textarea.offsetHeight + 2 } }); setTimeout(() => textarea.focus(), 0); return newQuery; }); };
  const handleFilterWizardStep = (selectedValue) => { const { step, startIndex } = helperState; if (step === 'select_property') { const propertyText = selectedValue.includes(' ') ? `row["${selectedValue}"]` : selectedValue; const textBefore = inputValue.substring(0, startIndex); const textAfter = inputValue.substring(startIndex + helperState.searchTerm.length); const newQuery = textBefore + propertyText + textAfter; setInputValue(newQuery); setHelperState(s => ({ ...s, step: 'select_operator', context: { ...s.context, property: propertyText }, startIndex: (textBefore + propertyText).length })); } else if (step === 'select_operator') { let textToInsert; let newCursorOffset = 0; if (selectedValue === '.contains') { textToInsert = '.contains()'; newCursorOffset = -1; } else { textToInsert = ` ${selectedValue} `; } const newQuery = inputValue + textToInsert; setInputValue(newQuery); setHelperState({ type: null }); setTimeout(() => { const newCursorPos = newQuery.length + newCursorOffset; textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos); }, 0); } };
  const setBaseType = (bt) => { if (!bt) return; const q = inputValue; const rx = /@[\w-]+(?:-list)?/i; if (rx.test(q)) setInputValue(tidy(q.replace(rx, bt))); else setInputValue(tidy(bt + (q.trim() ? ' AND ' + q.trim() : ''))); };
  const handleRunAndSave = async () => { const query = inputValue.trim(); const path = outputFilePath.trim(); if (!query) { setStatusMessage({ text: 'Query is empty.', type: 'error' }); return; } if (!path) { setStatusMessage({ text: 'Output file path is empty.', type: 'error' }); return; } if (!path.endsWith('.json')) { setStatusMessage({ text: 'Output file path must end with .json', type: 'error'}); return; } setStatusMessage({ text: 'Running query...', type: 'info' }); try { const lastSlashIndex = path.lastIndexOf('/'); if (lastSlashIndex > -1) { const dirPath = path.substring(0, lastSlashIndex); if (dirPath && !(await app.vault.adapter.exists(dirPath))) { setStatusMessage({ text: `Creating directory '${dirPath}'...`, type: 'info' }); await app.vault.adapter.mkdir(dirPath); } } const queryResult = dc.api.query(query); const newContent = JSON.stringify(queryResult, jsonReplacer, 2); let oldContent = null; if (await app.vault.adapter.exists(path)) oldContent = await app.vault.adapter.read(path); if (newContent === oldContent) { setStatusMessage({ text: `No changes detected. File '${path}' not updated.`, type: 'info' }); } else { await app.vault.adapter.write(path, newContent); setStatusMessage({ text: `Successfully saved ${queryResult.length} items to '${path}'.`, type: 'success' }); } } catch (e) { setStatusMessage({ text: `Error: ${e.message}`, type: 'error' }); console.error("Datacore Node Save Error:", e); } };
  const styles = { container: { display: 'flex', flexDirection: 'column', gap: 8, color: '#ddd', height: '100%' }, label: { display: 'block', marginBottom: 6, fontWeight: 700 }, inputWrapper: { position: 'relative' }, textarea: { width: '100%', minHeight: 92, padding: 10, background: '#111', border: '1px solid #222', borderRadius: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace', color: '#eaeaea', fontSize: 13, resize: 'vertical', outline: 'none' }, helperContainer: { position: 'absolute', width: '100%', left: 0, zIndex: 20, marginTop: 6 }, bar: { display: 'flex', gap: 8, alignItems: 'center', background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 8, padding: 8 }, select: { appearance: 'none', background: '#121212', border: '1px solid #222', color: '#eaeaea', borderRadius: 6, padding: '6px 10px', fontSize: 12 }, addBtn: { height: 28, padding: '0 10px', background: '#121212', border: '1px solid #222', color: '#eaeaea', borderRadius: 6, cursor: 'pointer' }, pop: { position: 'absolute', top: '100%', right: 0, marginTop: 6, minWidth: 280, background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, padding: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.45)', zIndex: 40 }, popRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }, pill: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', background: '#141414', border: '1px solid #222', color: '#cfcfcf', borderRadius: 999, fontSize: 12 }, pillX: { border: 'none', background: 'transparent', color: '#999', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }, chipWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }, outputContainer: { marginTop: 6, padding: 10, border: '1px solid #222', borderRadius: 8, background: '#0e0e0e', display: 'flex', flexDirection: 'column', gap: 8 }, outputInput: { width: '100%', padding: '6px 8px', backgroundColor: '#121212', border: '1px solid #222', borderRadius: '6px', color: '#eee', fontFamily: 'monospace' }, primary: { padding: '6px 12px', backgroundColor: '#8b5cf6', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: 600 }, statusMessage: { fontSize: 12, margin: 0, padding: '4px 0', minHeight: '1.2em' }, listWrap: { flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #222', borderRadius: 8, overflow: 'hidden', minHeight: 0 }, list: { flex: 1, overflowY: 'auto' }, pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 10, borderTop: '1px solid #222', background: '#0e0e0e' }, pageBtn: { padding: '4px 12px', margin: '0 10px', background: '#121212', border: '1px solid #222', borderRadius: 6, color: '#eee', cursor: 'pointer' }, pageBtnDis: { background: '#0c0c0c', color: '#666', cursor: 'not-allowed' }, };
  const statusColors = { info: '#888', success: '#4CAF50', error: '#F44336' };
  const openAddons = () => { clearTimeout(addonTimer.current); setAddonOpen(true); };
  const closeAddonsSoon = () => { addonTimer.current = setTimeout(() => setAddonOpen(false), 120); };

  const renderResults = () => { if (loading) return <p style={{ textAlign: 'center', padding: 20 }}>Loading...</p>; if (error) return <pre style={{ color: '#ff8a8a', background: '#281b1b', padding: 10 }}><strong>Query Error:</strong> {error.message}</pre>; if (!results) return <p style={{ textAlign: 'center', padding: 20 }}>Type a query to see a live preview.</p>; if (results.length === 0) return <p style={{ textAlign: 'center', padding: 20 }}>No results found.</p>; const totalPages = Math.ceil(results.length / itemsPerPage); const startIndex = (currentPage - 1) * itemsPerPage; const currentItems = results.slice(startIndex, (startIndex + itemsPerPage)); return ( <div style={styles.listWrap}> <div style={styles.list}> {currentItems.map((item, index) => (<ResultItem key={startIndex + index} item={item} />))} </div> {totalPages > 1 && ( <div style={styles.pagination}> <button style={{ ...styles.pageBtn, ...(currentPage === 1 && styles.pageBtnDis) }} onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1}>Previous</button> <span style={{ minWidth: 100, textAlign: 'center' }}>Page {currentPage} of {totalPages}</span> <button style={{ ...styles.pageBtn, ...(currentPage >= totalPages && styles.pageBtnDis) }} onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage >= totalPages}>Next</button> </div> )} </div> ); };

  return (
    <div style={styles.container}>
      <div>
        <label htmlFor="query-input" style={styles.label}>Datacore Query</label>
        <div style={styles.bar}>
          <select value={parsed.baseType || ''} onChange={(e) => setBaseType(e.target.value)} style={styles.select}>
            <option value="">{parsed.baseType ? '(remove base type)' : '-- Base Type --'}</option>
            {baseTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
          </select>
          <div style={styles.chipWrap}>
            {parsed.chips.map((c, i) => (
              <span key={i} style={styles.pill}>
                {c.label}
                <button aria-label="remove" title="Remove" style={styles.pillX} onClick={c.remove}>×</button>
              </span>
            ))}
          </div>
          <div onMouseEnter={openAddons} onMouseLeave={closeAddonsSoon} style={{ position: 'relative' }} ref={addonRef}>
            <button style={styles.addBtn}>＋ Add</button>
            {addonOpen && (
              <div style={styles.pop} onMouseEnter={openAddons} onMouseLeave={closeAddonsSoon}>
                {['Common','Links','Structure','Flags','Filter'].map(group => {
                  const items = addOns.filter(a => a.g === group);
                  if (!items.length) return null;
                  return (
                    <div key={group} style={{ padding: 6 }}>
                      <div style={{ fontSize: 11, color: '#888', margin: '2px 2px 6px' }}>{group}</div>
                      <div style={styles.popRow}>
                        {items.map((a, idx) => (
                          <button key={idx} title={a.desc || a.label} onClick={() => { setAddonOpen(false); if (a.isWizard) { handleStartFilterWizard(); return; } focusAndMaybeHelper(a.value, a.helper, a.selection); }} style={{ height: 28, borderRadius: 6, border: '1px solid #222', background: '#121212', color: '#eaeaea', cursor: 'pointer', padding: '0 10px', textAlign: 'left' }}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div style={{ ...styles.inputWrapper, marginTop: 6 }} ref={inputAreaRef}>
          <textarea ref={textareaRef} id="query-input" style={styles.textarea} value={inputValue} onChange={handleInputChange} onClick={handleCursorMove} onKeyUp={handleCursorMove} placeholder='Type a query or use Add…' />
          {helperState.type && (
            <div style={{ ...styles.helperContainer, top: `${helperState.position.top}px` }}>
              {helperState.type === 'tag' && <TagHelper searchTerm={helperState.searchTerm} onTagSelect={(val) => handleHelperSelect(val, 'tag')} />}
              {helperState.type === 'folder' && <FolderHelper searchTerm={helperState.searchTerm} onFolderSelect={(val) => handleHelperSelect(val, 'folder')} />}
              {helperState.type === 'file' && <FileHelper searchTerm={helperState.searchTerm} onFileSelect={(val) => handleHelperSelect(val, 'file')} />}
              {helperState.type === 'property' && <GenericPropertyHelper searchTerm={helperState.searchTerm} onPropertySelect={(val) => handleHelperSelect(val, 'property')} />}
              {helperState.type === 'filter' && helperState.step === 'select_property' && (<GenericPropertyHelper searchTerm={helperState.searchTerm} onPropertySelect={handleFilterWizardStep} />)}
              {helperState.type === 'filter' && helperState.step === 'select_operator' && (<ComparisonOperatorHelper onOperatorSelect={handleFilterWizardStep} />)}
            </div>
          )}
        </div>
      </div>
      <div style={styles.outputContainer}>
        <label htmlFor="output-path" style={{ fontSize: 12, fontWeight: 'bold' }}>Output File Path (optional)</label>
        <input id="output-path" type="text" style={styles.outputInput} value={outputFilePath} onChange={e => setOutputFilePath(e.target.value)} placeholder="e.g., data/my-query-results.json" />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.primary} onClick={handleRunAndSave}>Run & Save</button>
        </div>
        <p style={{ ...styles.statusMessage, color: statusColors[statusMessage.type] }}>{statusMessage.text}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <h3 style={{ margin: '8px 0 10px 0', flexShrink: 0 }}>Live Preview {results ? `(${results.length})` : ''}</h3>
        {renderResults()}
      </div>
    </div>
  );
};


const OutputViewerNode = function OutputViewerNode({ node, setNodes }) { const filePath = node.params.find(p => p.key === 'filePath')?.value || ''; const updateParam = (key, newValue) => { setNodes(nodes => nodes.map(n => { if (n.id === node.id) { const hasParam = n.params.some(p => p.key === key); const newParams = hasParam ? n.params.map(p => p.key === key ? { ...p, value: newValue } : p) : [...n.params, { key, value: newValue }]; return { ...n, params: newParams }; } return n; })); }; return ( <div style={{display:"flex",flexDirection:"column",gap:12}}> <div style={{fontWeight:700,fontSize:14}}>Viewer Inspector</div> <div style={{display:"flex",flexDirection:"column",gap:6}}> <label style={{fontSize:12, color: '#aaa'}}>File Path (for static view)</label> <input value={filePath} onChange={e => updateParam('filePath', e.target.value)} placeholder="e.g., data/results.json" style={{ background:"#151515", border:"1px solid #2a2a2a", borderRadius:6, padding:"6px 8px", color:"#eaeaea" }} /> <p style={{fontSize:11, color: '#888', margin: '4px 0 0 0'}}>Displays live data from its input when a flow is run. Can also display a static JSON file if the path is provided and the flow is not running.</p> </div> </div> );};

// ===========================================================================
// START OF CHANGED BLOCK in NodeComponents.jsx
// ===========================================================================
const SummaryListItem = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getDisplayName = (data) => {
        if (typeof data !== 'object' || data === null) return String(data);
        if (data.$name) return String(data.$name);
        if (data.name) return String(data.name);
        if (data.$path) return data.$path;
        if (data.path) return data.path;
        if (data.file?.path) return data.file.path;
        if (data.$text) { 
            const text = String(data.$text); 
            return text.length > 80 ? text.substring(0, 77) + '...' : text; 
        }
        if (typeof data === 'string') return data;
        return "Untitled Item";
    };

    const displayName = getDisplayName(item);

    return (
        <div className="summary-list-item">
            <div className="summary-list-header" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="summary-list-icon">{isExpanded ? '▾' : '▸'}</span>
                <span className="summary-list-name" title={displayName}>{displayName}</span>
            </div>
            {isExpanded && (
                <pre className="summary-list-details">
                    <code>{JSON.stringify(item, jsonReplacer, 2)}</code>
                </pre>
            )}
        </div>
    );
};

const CanvasViewerContent = function CanvasViewerContent({ node, data }) { 
    const [viewMode, setViewMode] = useState('summary'); 
    const [fileContent, setFileContent] = useState({ state: 'idle', content: null }); 
    
    const displayData = data !== undefined ? data : fileContent.content; 
    const isLoading = data === undefined && fileContent.state === 'loading'; 
    const error = fileContent.state === 'error' ? fileContent.content : null; 
    
    const scrollContainerRef = useRef(null);

    const headers = useMemo(() => {
        if (!Array.isArray(displayData) || displayData.length === 0) return [];
        const headSet = new Set(); 
        displayData.slice(0, 50).forEach(item => { 
            if (typeof item === 'object' && item !== null) { 
                Object.keys(item).forEach(key => headSet.add(key)); 
            } 
        }); 
        return Array.from(headSet); 
    }, [displayData]);

    useEffect(() => { 
        const loadStaticFile = async () => { 
            const filePath = node.params.find(p => p.key === 'filePath')?.value; 
            if (data !== undefined || !filePath) { 
                setFileContent({ state: 'idle', content: null }); 
                return; 
            } 
            setFileContent({ state: 'loading', content: null }); 
            try { 
                if (await app.vault.adapter.exists(filePath)) { 
                    const raw = await app.vault.adapter.read(filePath); 
                    const parsed = JSON.parse(raw); 
                    setFileContent({ state: 'loaded', content: parsed }); 
                } else { 
                    setFileContent({ state: 'error', content: 'File not found.' }); 
                } 
            } catch (e) { 
                setFileContent({ state: 'error', content: 'Invalid JSON or read error.' }); 
            } 
        }; 
        loadStaticFile(); 
    }, [data, node.params]); 

    const renderValue = (val) => { 
        if (val === null) return <span className="cv-value-null">null</span>; 
        if (typeof val === 'string') return `"${val}"`; 
        if (typeof val === 'boolean') return <span className={`cv-value-${val}`}>{String(val)}</span>; 
        if (typeof val === 'object') return '{...}'; 
        return String(val); 
    }; 
    
    const SummaryView = () => {
        const [scrollTop, setScrollTop] = useState(0);
        const ITEM_HEIGHT_ESTIMATE = 30;
        const BUFFER_ITEMS = 8;
        
        if (!Array.isArray(displayData)) {
            if (typeof displayData === 'object' && displayData !== null) {
                 return <div>Object with <strong>{Object.keys(displayData).length}</strong> key(s). View in JSON tab for details.</div>;
            }
            return <div>Primitive value: {renderValue(displayData)}</div>;
        }
        if (displayData.length === 0) {
            return <div className="canvas-viewer-message">Empty Array (0 items)</div>;
        }
        
        const containerHeight = scrollContainerRef.current?.clientHeight || 0;
        const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT_ESTIMATE) - BUFFER_ITEMS);
        const visibleItemCount = Math.ceil(containerHeight / ITEM_HEIGHT_ESTIMATE) + (2 * BUFFER_ITEMS);
        const endIndex = Math.min(displayData.length, startIndex + visibleItemCount);

        const visibleItems = displayData.slice(startIndex, endIndex);

        const handleScroll = (e) => setScrollTop(e.currentTarget.scrollTop);

        return (
            <div ref={scrollContainerRef} onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto' }}>
                <div style={{
                    height: displayData.length * ITEM_HEIGHT_ESTIMATE,
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute',
                        top: startIndex * ITEM_HEIGHT_ESTIMATE,
                        left: 0,
                        right: 0,
                    }}>
                        {visibleItems.map((item, index) => (
                            <SummaryListItem key={startIndex + index} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };
    
    // =================== FIX START =====================
    // The previous error `TypeError: h is not a function` was caused by a variable
    // naming collision during minification. Using 'h' as a variable name is risky.
    // This has been definitively changed to 'header' to ensure stability.
    // ===================================================
    const renderTable = () => { 
        if (!Array.isArray(displayData) || displayData.length === 0) { 
            return <div className="canvas-viewer-message">Table view requires an array of objects.</div>; 
        }
        return ( 
            <table className="canvas-viewer-table"> 
                <thead> 
                    <tr>
                        {headers.map(header => <th key={header}>{header}</th>)}
                    </tr> 
                </thead> 
                <tbody> 
                    {displayData.map((row, i) => ( 
                        <tr key={i}> 
                            {headers.map(header => <td key={header} title={JSON.stringify(row[header])}>{renderValue(row[header])}</td>)} 
                        </tr> 
                    ))} 
                </tbody> 
            </table> 
        ); 
    }; 
    // =================== FIX END =====================
    
    const renderCards = () => { if (!Array.isArray(displayData) || displayData.length === 0) { return <div className="canvas-viewer-message">Cards view requires an array.</div>; } return ( <div className="canvas-viewer-cards-grid"> {displayData.map((item, i) => ( <div key={i} className="cv-card"> <div className="cv-card-header">Item {i}</div> <div className="cv-card-content"> { (typeof item === 'object' && item !== null) ? Object.entries(item).map(([k,v]) => ( <div key={k} className="cv-card-kv"> <div className="cv-card-key" title={k}>{k}</div> <div className="cv-card-value" title={JSON.stringify(v)}>{renderValue(v)}</div> </div> )) : <div className="cv-card-value solo">{renderValue(item)}</div> } </div> </div> ))} </div> ); }; 
    const renderJson = () => { return <pre><code>{JSON.stringify(displayData, jsonReplacer, 2)}</code></pre>; }; 
    
    const renderContent = () => { 
        if (isLoading) return <div className="canvas-viewer-message">Loading...</div>; 
        if (error) return <div className="canvas-viewer-message error">{error}</div>; 
        if (displayData === undefined) { 
            const msg = node.type === 'output.viewer' ? 'Run flow or provide file path' : 'Run flow to see output'; 
            return <div className="canvas-viewer-message">{msg}</div>;
        } 
        switch(viewMode) { 
            case 'summary': return <SummaryView />; 
            case 'table': return renderTable(); 
            case 'cards': return renderCards(); 
            case 'json': return renderJson(); 
            default: return <SummaryView />; 
        } 
    }; 
    
    const ViewButton = ({ mode, label }) => ( <button className={`canvas-viewer-btn ${viewMode === mode ? 'active' : ''}`} onClick={() => setViewMode(mode)}> {label} </button> ); 
    
    return ( 
        <div className="node-viewer-content" onPointerDown={e => e.stopPropagation()}> 
            <div className="canvas-viewer-header"> 
                <ViewButton mode="summary" label="Summ" /> 
                <ViewButton mode="table" label="Table" /> 
                <ViewButton mode="cards" label="Cards" /> 
                <ViewButton mode="json" label="JSON" /> 
            </div> 
            <div className="canvas-viewer-body"> 
                {renderContent()} 
            </div> 
        </div> 
    ); 
};
// ===========================================================================
// END OF CHANGED BLOCK
// ===========================================================================

return {
    DatacoreQueryEditor,
    OutputViewerNode,
    CanvasViewerContent,
};
```


# PanelComponents

```jsx
// =================================================================================
//  MODULE: PanelComponents
//  Desc:   Contains major UI panels like the Left Panel and Inspector.
// =================================================================================
const { useState, useRef, useEffect } = dc;
const filename = dc.resolvePath("D.q.actionsmanager.component.md");

const { Utils } = await dc.require(dc.headerLink(filename, "Logic"));
const { Hooks } = await dc.require(dc.headerLink(filename, "Hooks"));
const {
    DatacoreQueryEditor, OutputViewerNode
} = await dc.require(dc.headerLink(filename, "NodeComponents"));


const PalettePanel = ({ canvasRef, paletteAll, openGroups, setOpenGroups, pinnedGroups, setPinnedGroups, addNode, searchState, setSearchState, setShowSuggest, showSuggest, activeSuggest, setActiveSuggest, viewToWorld, ghostNode, setDragging }) => { const isPinned = (g) => pinnedGroups.includes(g); const setPinned = (g, val) => setPinnedGroups(prev => val ? [g, ...prev.filter(x => x !== g)].slice(0, 10) : prev.filter(x => x !== g)); const toggleGroup = (g) => setOpenGroups(s => ({ ...s, [g]: !s[g] })); const setAllGroups = (state) => { const next = {}; const all = (paletteAll.order?.length ? paletteAll.order : Object.keys(paletteAll.groups || {})); for (const g of all) next[g] = state; setOpenGroups(next); }; const pd = (e) => e.stopPropagation(); return (<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: 8 }}> <div style={{ flexShrink: 0 }}> <div style={{ display: "flex", gap: 8 }}> <div style={{ position: "relative", flex: 1 }}> <input ref={searchState.ref} value={searchState.raw} onChange={e => setSearchState(s => ({ ...s, raw: e.target.value }))} onPointerDown={pd} onMouseDown={pd} onFocus={() => setShowSuggest(true)} onBlur={() => setTimeout(() => setShowSuggest(false), 120)} onKeyDown={(e) => { if (!showSuggest) return; if (["ArrowDown", "Tab"].includes(e.key)) { e.preventDefault(); setActiveSuggest(i => Math.min(i + 1, (paletteAll.searchList?.length || 1) - 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setActiveSuggest(i => Math.max(i - 1, 0)); } if (e.key === "Enter") { e.preventDefault(); if (paletteAll.searchList?.length) { const a = paletteAll.searchList[activeSuggest] || paletteAll.searchList[0]; const rect = canvasRef.current?.getBoundingClientRect(); const cx = (rect?.width || 0) / 2, cy = (rect?.height || 0) / 2; const c = viewToWorld((canvasRef.current?.getBoundingClientRect().left || 0) + cx, (canvasRef.current?.getBoundingClientRect().top || 0) + cy); addNode(a, c.x - 110, c.y - 48); setShowSuggest(false); setSearchState(s => ({ ...s, raw: "" })); searchState.ref.current?.focus(); } } e.stopPropagation(); }} placeholder="Search (tokens: type:expr)" style={{ width: "100%", height: 34, borderRadius: showSuggest ? "8px 8px 0 0" : 8, border: "1px solid #2a2a2a", background: "#111", color: "#eaeaea", padding: "0 34px 0 10px" }} /> {searchState.raw && (<button className="btn" onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearchState(s => ({ ...s, raw: "" })); setActiveSuggest(0); searchState.ref.current?.focus(); }} style={{ position: "absolute", right: 4, top: 4, height: 26, padding: "0 8px" }}>Clear</button>)} {showSuggest && (paletteAll.searchList?.length || 0) > 0 && (<div className="suggest" onMouseDown={pd}> {paletteAll.searchList.map((it, idx) => (<div key={`${it.type}:${it.label}:${idx}`} className="suggest-item" aria-selected={idx === activeSuggest} onMouseEnter={() => setActiveSuggest(idx)} onMouseDown={(e) => { e.preventDefault(); const rect = canvasRef.current?.getBoundingClientRect(); const cx = (rect?.width || 0) / 2, cy = (rect?.height || 0) / 2; const c = viewToWorld((canvasRef.current?.getBoundingClientRect().left || 0) + cx, (canvasRef.current?.getBoundingClientRect().top || 0) + cy); addNode(it, c.x - 110, c.y - 48); }}> <div className="markwrap" style={{ color: "#eaeaea" }} dangerouslySetInnerHTML={{ __html: Utils.highlightMatch(it.label, searchState.parsed.text) }} /> <div style={{ fontSize: 11, color: "#9a9a9a", flexShrink: 0 }}>{it.group}</div> </div>))} </div>)} </div> <button className="btn" onClick={() => setAllGroups(true)} style={{ width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Expand All"><dc.Icon icon="chevrons-down" style={{ width: '16px', height: '16px' }} /></button> <button className="btn" onClick={() => setAllGroups(false)} style={{ width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Collapse All"><dc.Icon icon="chevrons-up" style={{ width: '16px', height: '16px' }} /></button> </div> </div> <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", paddingRight: '4px' }}> <div style={{ display: "grid", gridAutoRows: 'min-content', gap: 8 }}> {((paletteAll.order?.length ? paletteAll.order : Object.keys(paletteAll.groups || {}))).map(g => { const items = (paletteAll.groups && paletteAll.groups[g]) || []; const open = !!openGroups[g]; return (<div key={g}> <div role="button" tabIndex={0} onClick={() => toggleGroup(g)} onKeyDown={(e) => { if (["Enter", " ", "ArrowRight", "ArrowLeft"].includes(e.key)) { e.preventDefault(); toggleGroup(g); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#121212", border: "1px solid #242424", borderRadius: 8, padding: "8px 10px", cursor: "pointer", marginBottom: open ? 8 : 0 }}> <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 18, height: 18, display: "grid", placeItems: "center", border: "1px solid #2a2a2a", borderRadius: 4, background: "#0f0f0f" }}>{open ? "▾" : "▸"}</div><div style={{ fontWeight: 700 }}>{g}</div><div style={{ fontSize: 11, color: "#9a9a9a" }}>({items.length})</div></div> <button className="btn" style={{ height: 24, width: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); setPinned(g, !isPinned(g)); }} title={isPinned(g) ? "Unpin" : "Pin"}><dc.Icon icon={isPinned(g) ? "pin-off" : "pin"} style={{ width: '14px', height: '14px' }} /></button> </div> {open && (<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, paddingLeft: '40px' }}> {items.map((a, idx) => (<div key={`${a.type}:${a.label}:${idx}`} onPointerDown={e => { e.stopPropagation(); if (ghostNode) { addNode(a, ghostNode.x, ghostNode.y); return; } const start = { x: e.clientX, y: e.clientY }; setDragging({ a, x: start.x, y: start.y }); const mm = (ev) => { setDragging(prev => prev ? { ...prev, x: ev.clientX, y: ev.clientY } : null); }; const up = (ev) => { const world = viewToWorld(ev.clientX, ev.clientY); if (canvasRef.current.contains(document.elementFromPoint(ev.clientX, ev.clientY))) { addNode(a, world.x - 110, world.y - 48); } setDragging(null); window.removeEventListener("pointermove", mm); window.removeEventListener("pointerup", up); }; window.addEventListener("pointermove", mm); window.addEventListener("pointerup", up); }} onDoubleClick={() => { const rect = canvasRef.current?.getBoundingClientRect(); const cx = (rect?.width || 0) / 2, cy = (rect?.height || 0) / 2; const c = viewToWorld((canvasRef.current?.getBoundingClientRect().left || 0) + cx, (canvasRef.current?.getBoundingClientRect().top || 0) + cy); addNode(a, c.x - 110, c.y - 48); }} style={{ border: "1px solid #242424", borderRadius: 10, padding: 10, background: "#121212", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "space-between" }}> <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><div style={{ fontWeight: 600 }}>{a.label}</div><div style={{ fontSize: 11, color: "#666", fontFamily: 'monospace', paddingLeft: '4px' }}>{a.type}</div></div> <div style={{ fontSize: 12, color: "#7a7a7a" }}>Drag</div> </div>))} {items.length === 0 && <div style={{ fontSize: 12, color: "#8a8a8a", padding: "8px 4px" }}>No items</div>} </div>)} </div>); })} </div> </div> </div>); };

const FsListFilesInspector = ({ node, setNodes }) => {
    const path = node.params.find(p => p.key === 'path')?.value || '';
    const updateParam = (key, newValue) => { setNodes(v => v.map(nn => nn.id === node.id ? { ...nn, params: nn.params.map(p => p.key === key ? { ...p, value: newValue } : p).concat(node.params.some(p => p.key === key) ? [] : [{ key, value: newValue }]) } : nn)); };
    return (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>List Files Inspector</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: '#aaa' }}>Folder Path</label>
            <input value={path} onChange={e => updateParam('path', e.target.value)} placeholder="data/inbox" style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} />
        </div>
    </div>);
};

const ObsidianNodeInspector = ({ node, setNodes }) => {
    const path = node.params.find(p => p.key === 'path')?.value || '';
    const openMode = node.params.find(p => p.key === 'openMode')?.value || 'tab-fg';
    const updateParam = (key, newValue) => { setNodes(v => v.map(nn => nn.id === node.id ? { ...nn, params: nn.params.map(p => p.key === key ? { ...p, value: newValue } : p).concat(node.params.some(p => p.key === key) ? [] : [{ key, value: newValue }]) } : nn)); };
    return (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Open File Inspector</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: '#aaa' }}>File Path</label>
            <input value={path} onChange={e => updateParam('path', e.target.value)} placeholder="=vars.item" style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: '#aaa' }}>Open Mode</label>
            <select value={openMode} onChange={e => updateParam('openMode', e.target.value)} style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea", height: 32 }}>
                <option value="current">Current Tab</option>
                <option value="tab-fg">New Tab (Foreground)</option>
                <option value="tab-bg">New Tab (Background)</option>
                <option value="split">New Split</option>
                <option value="window">New Window</option>
            </select>
        </div>
    </div>);
};

const ArrayGroupInspector = ({ node, setNodes }) => {
    const list = node.params.find(p => p.key === 'list')?.value || '=last';
    const mode = node.params.find(p => p.key === 'mode')?.value || 'fixedSize';
    const value = node.params.find(p => p.key === 'value')?.value || '';

    const updateParam = (key, newValue) => {
        setNodes(v => v.map(n => {
            if (n.id !== node.id) return n;

            const existingParam = n.params.find(p => p.key === key);
            let newParams;

            if (existingParam) {
                newParams = n.params.map(p => p.key === key ? { ...p, value: newValue } : p);
            } else {
                newParams = [...n.params, { key, value: newValue }];
            }

            // When mode changes, reset value to a sensible default
            if (key === 'mode') {
                const valueParamIndex = newParams.findIndex(p => p.key === 'value');
                const newDefault = newValue === 'fixedSize' ? '10' : newValue === 'property' ? 'file.folder' : '=item.$tags[0]';
                if (valueParamIndex > -1) {
                    newParams[valueParamIndex] = { ...newParams[valueParamIndex], value: newDefault };
                } else {
                    newParams.push({ key: 'value', value: newDefault });
                }
            }

            return { ...n, params: newParams };
        }));
    };

    const renderModeSpecificInput = () => {
        switch (mode) {
            case 'fixedSize':
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, color: '#aaa' }}>Group Size</label>
                        <input
                            type="number"
                            value={value}
                            onChange={e => updateParam('value', e.target.value)}
                            placeholder="10"
                            min="1"
                            style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }}
                        />
                        <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0 0' }}>The number of items to include in each group. Output is an array of arrays.</p>
                    </div>
                );
            case 'property':
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, color: '#aaa' }}>Property Path</label>
                        <input
                            type="text"
                            value={value}
                            onChange={e => updateParam('value', e.target.value)}
                            placeholder="e.g., status or file.folder"
                            style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }}
                        />
                        <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0 0' }}>Groups items by the value of this property. Output is an object.</p>
                    </div>
                );
            case 'expression':
                 return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 12, color: '#aaa' }}>Grouping Expression</label>
                        <textarea
                            value={value}
                            onChange={e => updateParam('value', e.target.value)}
                            placeholder="=item.file.ctime.toFormat('yyyy-MM')"
                            style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea", minHeight: '60px', fontFamily: 'monospace', resize: 'vertical' }}
                        />
                        <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0 0' }}>Evaluates the expression for each item to get a group key. Output is an object.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Array: Group Inspector</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Input Array</label>
                <input
                    value={list}
                    onChange={e => updateParam('list', e.target.value)}
                    placeholder="=last"
                    style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }}
                />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Group By</label>
                <select value={mode} onChange={e => updateParam('mode', e.target.value)} style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea", height: 32 }}>
                    <option value="fixedSize">Fixed Size (Chunking)</option>
                    <option value="property">Property Value</option>
                    <option value="expression">Custom Expression</option>
                </select>
            </div>
            
            {renderModeSpecificInput()}
        </div>
    );
};

const ForLoopInspector = ({ node, setNodes }) => {
    const count = node.params.find(p => p.key === 'count')?.value || '10';
    const indexName = node.params.find(p => p.key === 'indexName')?.value || 'index';

    const updateParam = (key, newValue) => {
        setNodes(v => v.map(n => {
            if (n.id !== node.id) return n;
            const hasParam = n.params.some(p => p.key === key);
            const newParams = hasParam
                ? n.params.map(p => p.key === key ? { ...p, value: newValue } : p)
                : [...n.params, { key, value: newValue }];
            return { ...n, params: newParams };
        }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>For Loop Inspector</div>
            
            <p style={{fontSize:12, color: '#aaa', margin: 0, lineHeight: 1.5}}>
                Executes the nodes connected to its 'body' output a specific number of times.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Number of Iterations</label>
                <input 
                    type="number"
                    value={count} 
                    onChange={e => updateParam('count', e.target.value)} 
                    placeholder="10" 
                    min="0"
                    style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} 
                />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Index Variable Name</label>
                <input 
                    type="text"
                    value={indexName} 
                    onChange={e => updateParam('indexName', e.target.value)} 
                    placeholder="index"
                    style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} 
                />
                <p style={{fontSize:11, color: '#888', margin: '4px 0 0 0'}}>
                    The current loop number (0, 1, 2...) will be available in this variable inside the loop body. Use it with `=vars.{indexName}`.
                </p>
            </div>
        </div>
    );
};

const ForEachInspector = ({ node, setNodes }) => {
    const list = node.params.find(p => p.key === 'list')?.value || '=last';
    const itemName = node.params.find(p => p.key === 'itemName')?.value || 'item';
    const indexName = node.params.find(p => p.key === 'indexName')?.value || 'index';

    const updateParam = (key, newValue) => {
        setNodes(v => v.map(n => {
            if (n.id !== node.id) return n;
            const hasParam = n.params.some(p => p.key === key);
            const newParams = hasParam
                ? n.params.map(p => p.key === key ? { ...p, value: newValue } : p)
                : [...n.params, { key, value: newValue }];
            return { ...n, params: newParams };
        }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>For Each Loop Inspector</div>

            <p style={{ fontSize: 12, color: '#aaa', margin: 0, lineHeight: 1.5 }}>
                Iterates over each item in an array and executes the 'body' branch for every item.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Input Array</label>
                <input
                    value={list}
                    onChange={e => updateParam('list', e.target.value)}
                    placeholder="=last"
                    style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }}
                />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Item Variable Name</label>
                <input
                    value={itemName}
                    onChange={e => updateParam('itemName', e.target.value)}
                    placeholder="item"
                    style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }}
                />
                 <p style={{fontSize:11, color: '#888', margin: '4px 0 0 0'}}>
                    The current item from the array will be available in this variable. Use it with `=vars.{itemName}`. The input to the loop body will also be this item.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Index Variable Name</label>
                <input
                    value={indexName}
                    onChange={e => updateParam('indexName', e.target.value)}
                    placeholder="index"
                    style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }}
                />
                 <p style={{fontSize:11, color: '#888', margin: '4px 0 0 0'}}>
                    The current item's index (0, 1, 2...) will be available here. Use it with `=vars.{indexName}`.
                </p>
            </div>
        </div>
    );
};

const DebugLogInspector = ({ node, setNodes }) => {
    const message = node.params.find(p => p.key === 'message')?.value || '';
    const data = node.params.find(p => p.key === 'data')?.value || '=last';
    const level = node.params.find(p => p.key === 'level')?.value || 'info';
    const target = node.params.find(p => p.key === 'target')?.value || 'console';
    const logContext = node.params.find(p => p.key === 'logContext')?.value || false;

    const updateParam = (key, newValue) => {
        setNodes(v => v.map(n => {
            if (n.id !== node.id) return n;
            const hasParam = n.params.some(p => p.key === key);
            const newParams = hasParam
                ? n.params.map(p => p.key === key ? { ...p, value: newValue } : p)
                : [...n.params, { key, value: newValue }];
            return { ...n, params: newParams };
        }));
    };

    const style = {
        wrapper: { display: "flex", flexDirection: "column", gap: 16 },
        header: { fontWeight: 700, fontSize: 14 },
        fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
        label: { fontSize: 12, color: '#aaa' },
        input: { background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" },
        inputDisabled: { opacity: 0.5, cursor: 'not-allowed' },
        textarea: { minHeight: '60px', fontFamily: 'monospace', resize: 'vertical' },
        select: { height: 32 },
        helpText: { fontSize: 11, color: '#888', margin: '4px 0 0 0' },
        checkboxWrapper: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' },
        checkbox: { width: '16px', height: '16px' }
    };

    return (
        <div style={style.wrapper}>
            <div style={style.header}>Debug: Log Message Inspector</div>
            
            <div style={style.fieldGroup}>
                <label style={style.label}>Message</label>
                <textarea
                    value={message}
                    onChange={e => updateParam('message', e.target.value)}
                    placeholder='="Value is: " + last'
                    style={{ ...style.input, ...style.textarea, ...(logContext && style.inputDisabled) }}
                    disabled={logContext}
                />
                <p style={style.helpText}>To mix text and variables, start with `=` and use `+`. Ex: `="File: " + vars.item`</p>
            </div>

            <div style={style.fieldGroup}>
                <label style={style.label}>Data to Log (optional)</label>
                <input
                    value={data}
                    onChange={e => updateParam('data', e.target.value)}
                    placeholder="=last"
                    style={{ ...style.input, ...(logContext && style.inputDisabled) }}
                    disabled={logContext}
                />
            </div>
            
            <label style={style.checkboxWrapper} onClick={() => updateParam('logContext', !logContext)}>
                <input type="checkbox" checked={logContext} readOnly style={style.checkbox} />
                <span>Log Full Context (vars, last, item)</span>
            </label>
            <p style={style.helpText}>When checked, this logs all available data and disables the Message/Data fields above.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={style.fieldGroup}>
                    <label style={style.label}>Level</label>
                    <select value={level} onChange={e => updateParam('level', e.target.value)} style={{ ...style.input, ...style.select }}>
                        <option value="log">Log</option>
                        <option value="info">Info</option>
                        <option value="warn">Warning</option>
                        <option value="error">Error</option>
                        <option value="debug">Debug</option>
                    </select>
                </div>

                <div style={style.fieldGroup}>
                    <label style={style.label}>Target</label>
                    <select value={target} onChange={e => updateParam('target', e.target.value)} style={{ ...style.input, ...style.select }}>
                        <option value="console">Flow Console</option>
                        <option value="electron">Browser Console</option>
                        <option value="both">Both</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

const CommentNodeInspector = ({ node, setNodes }) => {
    const text = node.params.find(p => p.key === 'text')?.value || '';
    const color = node.params.find(p => p.key === 'color')?.value || 'yellow';

    const updateParam = (key, newValue) => {
        setNodes(v => v.map(n => {
            if (n.id !== node.id) return n;
            const hasParam = n.params.some(p => p.key === key);
            const newParams = hasParam
                ? n.params.map(p => p.key === key ? { ...p, value: newValue } : p)
                : [...n.params, { key, value: newValue }];
            return { ...n, params: newParams };
        }));
    };
    
    const colors = ['yellow', 'blue', 'green', 'pink', 'purple', 'grey'];
    const colorVars = { yellow: '#fff9c4', blue: '#b3e5fc', green: '#c8e6c9', pink: '#f8bbd0', purple: '#e1bee7', grey: '#e0e0e0' };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Comment Inspector</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Comment Text</label>
                <textarea
                    value={text}
                    onChange={e => updateParam('text', e.target.value)}
                    style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea", minHeight: '120px', resize: 'vertical' }}
                />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, color: '#aaa' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {colors.map(c => (
                        <div key={c} title={c} onClick={() => updateParam('color', c)} style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            backgroundColor: colorVars[c] || '#333',
                            cursor: 'pointer',
                            border: color === c ? '2px solid #fff' : '2px solid transparent',
                            boxShadow: '0 0 0 1px #2a2a2a'
                        }} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const InspectorPanel = ({ selected, nodes, setNodes, runLog, setRunLog, jsonReplacer }) => {
    const [inspectorHeight, setInspectorHeight] = Hooks.usePersistentState("fb.ui.inspectorHeight", 250);
    const panelRef = useRef(null);
    const consoleLogRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = (e) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const LogEntry = ({ logItem }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const { t, kind, message, data } = logItem;
        const hasExpandableData = data !== undefined && ((typeof data === 'object' && data !== null) || Array.isArray(data) || (typeof data === 'string' && data.length > 100));
        const colorMap = { error: "#E57373", success: "#81C784", warning: "#ebcb8b", debug: "#888", info: "#E5E5E5" };
        const iconMap = { error: "❌", success: "✅", warning: "⚠️", debug: "•", info: "ℹ️" };
        const styles = {
            line: { display: 'flex', alignItems: 'flex-start', padding: '2px 4px', borderRadius: '4px', transition: 'background-color 0.1s ease', color: colorMap[kind] || colorMap.info, minHeight: 21 },
            timestamp: { color: '#666', marginRight: '8px', flexShrink: 0, userSelect: 'none' },
            icon: { marginRight: '6px', flexShrink: 0, userSelect: 'none' },
            message: { flexGrow: 1, wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
            expander: { cursor: 'pointer', marginLeft: '8px', color: '#8b5cf6', userSelect: 'none' },
            details: { marginTop: '4px', backgroundColor: '#00000044', padding: '8px', borderRadius: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '11px', color: '#ccc', maxHeight: '300px', overflow: 'auto', border: '1px solid #282828' }
        };
        return (
            <div>
                <div style={styles.line}>
                    <span style={styles.timestamp}>{new Date(t).toLocaleTimeString([], { hour12: false })}</span>
                    <span style={styles.icon}>{iconMap[kind] || '•'}</span>
                    <span style={styles.message}>{message}</span>
                    {hasExpandableData && <span onClick={() => setIsExpanded(!isExpanded)} style={styles.expander}>{isExpanded ? '[-]' : '[+]'}</span>}
                </div>
                {isExpanded && hasExpandableData && <pre style={styles.details}><code>{JSON.stringify(data, jsonReplacer, 2)}</code></pre>}
            </div>
        );
    };

     const handleCopyLog = () => {
        if (runLog.length === 0) { new Notice("Console is empty."); return; }
        const logText = [...runLog].reverse().map(l => {
            let line = `[${new Date(l.t).toISOString()}] [${(l.kind || 'info').toUpperCase()}] ${l.message}`;
            if (l.data !== undefined) line += `\n--- DATA ---\n${JSON.stringify(l.data, jsonReplacer, 2)}\n------------`;
            return line;
        }).join('\n\n');
        navigator.clipboard.writeText(logText).then(() => new Notice("Detailed console log copied to clipboard.")).catch(err => { console.error("Failed to copy log:", err); new Notice("Error: Could not copy log."); });
    };

    const handleResizerPointerDown = (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY; const startHeight = panelRef.current.getBoundingClientRect().height;
        const handlePointerMove = (me) => { const dy = me.clientY - startY; const newHeight = Utils.clamp(startHeight + dy, 100, window.innerHeight - 200); setInspectorHeight(newHeight); };
        const handlePointerUp = () => { window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerup', handlePointerUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none';
    };

    const ITEM_HEIGHT_ESTIMATE = 22;
    const RENDER_BUFFER = 10;

    return (
        <div onKeyDown={e => e.stopPropagation()} style={{ height: "100%", border: "1px solid #2a2a2a", borderRadius: 8, background: "linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)", display: "flex", flexDirection: "column", minWidth: 0, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            <div ref={panelRef} style={{ height: inspectorHeight, minHeight: 100, padding: 12, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#aaa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <dc.Icon icon="settings" style={{ width: '16px', height: '16px' }} />
                    Node Inspector
                </div>
                <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', border: "1px solid #1a1a1a", borderRadius: 8, padding: 12, background: "#080808" }}>
                    {selected.type === "node" ? (() => {
                        const n = nodes.find(x => x.id === selected.id);
                        if (!n) return <div style={{ color: "#888" }}>No selection</div>;
                        if (n.type === 'comment') return <CommentNodeInspector node={n} setNodes={setNodes} />;
                        if (n.type === 'datacore.query') return <DatacoreQueryEditor node={n} setNodes={setNodes} />;
                        if (n.type === 'output.viewer') return <OutputViewerNode node={n} setNodes={setNodes} />;
                        if (n.type === 'obsidian') return <ObsidianNodeInspector node={n} setNodes={setNodes} />;
                        if (n.type === 'fs.listFiles') return <FsListFilesInspector node={n} setNodes={setNodes} />;
                        if (n.type === 'array.group') return <ArrayGroupInspector node={n} setNodes={setNodes} />;
                        if (n.type === 'loop.for') return <ForLoopInspector node={n} setNodes={setNodes} />;
                        if (n.type === 'loop.forEach') return <ForEachInspector node={n} setNodes={setNodes} />;
                        if (n.type === 'debug.log') return <DebugLogInspector node={n} setNodes={setNodes} />;
                        if (n.type === 'output.display') { return ( <div style={{ display: "flex", flexDirection: "column", gap: 12 }}> <div style={{ fontWeight: 700, fontSize: 14 }}>Display Inspector</div> <p style={{fontSize:12, color: '#aaa', margin: 0}}> This node displays the data it receives from its input. </p> <p style={{fontSize:12, color: '#aaa', margin: 0}}> The last received data is saved with the flow and shown on the canvas node. Run the flow to update it. </p> </div> ); }
                        if (n.type === 'json.filter') { const ops = ['==', '!=', '>', '>=', '<', '<=', '.contains']; const field = n.params.find(p => p.key === 'field')?.value || ''; const op = n.params.find(p => p.key === 'op')?.value || '=='; const value = n.params.find(p => p.key === 'value')?.value || ''; const updateParam = (key, newValue) => { setNodes(v => v.map(nn => nn.id === n.id ? { ...nn, params: nn.params.map(p => p.key === key ? { ...p, value: newValue } : p).concat(n.params.some(p => p.key === key) ? [] : [{ key, value: newValue }]) } : nn)); }; return (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}> <div style={{ fontWeight: 700, fontSize: 14 }}>Filter Inspector</div> <div style={{ display: "flex", flexDirection: "column", gap: 6 }}> <label style={{ fontSize: 12, color: '#aaa' }}>Field Path</label> <input value={field} onChange={e => updateParam('field', e.target.value)} placeholder="e.g., file.name" style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} /> </div> <div style={{ display: "flex", flexDirection: "column", gap: 6 }}> <label style={{ fontSize: 12, color: '#aaa' }}>Operator</label> <select value={op} onChange={e => updateParam('op', e.target.value)} style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea", height: 32 }}> {ops.map(o => <option key={o} value={o}>{o}</option>)} </select> </div> <div style={{ display: "flex", flexDirection: "column", gap: 6 }}> <label style={{ fontSize: 12, color: '#aaa' }}>Value</label> <input value={value} onChange={e => updateParam('value', e.target.value)} placeholder="e.g., done or =$vars.myValue" style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} /> </div> </div>); }
                        return (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}> <div style={{ fontWeight: 700, fontSize: 14 }}>Inspector</div> <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 6, alignItems: "center" }}><div>Label</div><input value={n.label} onChange={e => setNodes(v => v.map(nn => nn.id === n.id ? { ...nn, label: e.target.value } : nn))} style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} /></div> <div style={{ fontWeight: 600, marginTop: 4 }}>Params</div> <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{n.params.map((p, i) => (<div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr 24px", gap: 6, alignItems: "center" }}> <input value={p.key} onChange={e => setNodes(v => v.map(nn => nn.id === n.id ? { ...nn, params: nn.params.map((pp, j) => j === i ? { ...pp, key: e.target.value } : pp) } : nn))} style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} /> <input value={p.value} onChange={e => setNodes(v => v.map(nn => nn.id === n.id ? { ...nn, params: nn.params.map((pp, j) => j === i ? { ...pp, value: e.target.value } : pp) } : nn))} style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 8px", color: "#eaeaea" }} /> <button onClick={() => setNodes(v => v.map(nn => nn.id === n.id ? { ...nn, params: nn.params.filter((_, j) => j !== i) } : nn))} style={{ height: 28, borderRadius: 6, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#bbb" }}>×</button> </div>))} <button onClick={() => setNodes(v => v.map(nn => nn.id === n.id ? { ...nn, params: [...nn.params, { key: "", value: "" }] } : nn))} style={{ height: 32, borderRadius: 6, border: "1px solid #2a2a2a", background: "#111", color: "#eaeaea" }}>Add Param</button> </div> </div>);
                    })() : selected.type === "edge" ? (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}><div style={{ fontWeight: 700, fontSize: 14 }}>Inspector</div><div>Edge: {selected.id}</div></div>) : <div style={{ color: "#888" }}>No selection</div>}
                </div>
            </div>
            <div className="inspector-resizer" onPointerDown={handleResizerPointerDown}><div className="inspector-resizer-bar" /></div>
            <div style={{ flex: '1 1 0', minHeight: 0, padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, border: "1px solid #1a1a1a", borderRadius: 8, background: "#080808", display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 13, padding: '10px 12px', color: "#aaa", flexShrink: 0, borderBottom: '1px solid #1a1a1a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <dc.Icon icon="terminal" style={{ width: '16px', height: '16px' }} />
                            <span>Run Console</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn" onClick={handleCopyLog} style={{height: 24, padding: '0 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: '4px'}}>
                                <dc.Icon icon="copy" style={{ width: '12px', height: '12px' }} />
                                Copy
                            </button>
                            <button className="btn" onClick={() => setRunLog([])} style={{height: 24, padding: '0 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: '4px'}}>
                                <dc.Icon icon="trash-2" style={{ width: '12px', height: '12px' }} />
                                Clear
                            </button>
                        </div>
                    </div>
                    <div ref={consoleLogRef} onScroll={handleScroll} style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "#050505", position: 'relative', fontFamily:'monospace', fontSize:12, lineHeight:1.5 }}>
                        {runLog.length > 0 ? (
                            <div style={{ height: runLog.length * ITEM_HEIGHT_ESTIMATE, position: 'relative' }}>
                                {(() => {
                                    const containerHeight = consoleLogRef.current?.clientHeight || 0;
                                    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT_ESTIMATE) - RENDER_BUFFER);
                                    const endIndex = Math.min(runLog.length, startIndex + Math.ceil(containerHeight / ITEM_HEIGHT_ESTIMATE) + (2 * RENDER_BUFFER));
                                    const visibleItems = runLog.slice(startIndex, endIndex);
                                    return (
                                        <div style={{ position: 'absolute', top: startIndex * ITEM_HEIGHT_ESTIMATE, left: 0, right: 0, padding: '4px' }}>
                                            {visibleItems.map((logItem, i) => <LogEntry key={`${logItem.t}-${startIndex + i}`} logItem={logItem} />)}
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div style={{textAlign: 'center', color: '#888', fontStyle: 'italic', paddingTop: '20px' }}>
                                Console is empty. Run a flow to see logs.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SavedFlowsPanel = ({ savedFlows, currentFlowId, onLoadFlow, onNewFlow, onSaveFlow, onDeleteFlow, onRenameFlow, isFlowsLoading, nodes }) => {
    const [editingState, setEditingState] = useState({ id: null, text: '' });
    const editInputRef = useRef(null);
    const originalNameOnEdit = useRef("");

    const sortedFlows = [...savedFlows].sort((a, b) => {
        const aIsUntitled = a.title.startsWith('Untitled-');
        const bIsUntitled = b.title.startsWith('Untitled-');
        if (aIsUntitled && !bIsUntitled) return 1;
        if (!aIsUntitled && bIsUntitled) return -1;
        return a.title.localeCompare(b.title);
    });

    const startEditing = (flow) => {
        const isUntitled = flow.title.startsWith('Untitled-');
        const nameToEdit = isUntitled ? '' : flow.title;
        originalNameOnEdit.current = nameToEdit;
        setEditingState({ id: flow.id, text: nameToEdit });
    };
    
    const handleSaveRename = async () => {
        const { id, text } = editingState;
        if (!id) {
            setEditingState({ id: null, text: '' });
            return;
        }
        
        const newName = text.trim();
        const originalName = originalNameOnEdit.current;

        if (!newName || newName === originalName) {
            setEditingState({ id: null, text: '' });
            return;
        }

        const success = await onRenameFlow(id, newName);
        
        if (success) {
            setEditingState({ id: null, text: '' });
        } else {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }
    };
    
    useEffect(() => {
        if (editingState.id && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingState.id]);


    return (
        <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: '10px 0', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
                {currentFlowId && (
                    <div style={{ 
                        padding: '8px 12px', 
                        marginBottom: '12px', 
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)', 
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <dc.Icon icon="file-text" style={{ width: '14px', height: '14px', color: '#8b5cf6' }} />
                        <div style={{ flex: 1, fontSize: '12px' }}>
                            <div style={{ color: '#9a9a9a', fontSize: '10px', marginBottom: '2px' }}>Current Workflow</div>
                            <div style={{ color: '#eaeaea', fontWeight: 500 }}>
                                {currentFlowId.replace('.json', '').startsWith('Untitled-') 
                                    ? 'Untitled Flow' 
                                    : currentFlowId.replace('.json', '')}
                            </div>
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" onClick={onNewFlow} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <dc.Icon icon="plus" style={{ width: '16px', height: '16px' }} />
                        New
                    </button>
                    <button className="btn" onClick={onSaveFlow} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <dc.Icon icon="save" style={{ width: '16px', height: '16px' }} />
                        Save
                    </button>
                </div>
            </div>
            <div style={{ flex: '1 1 0', overflowY: 'auto', minHeight: 0, paddingTop: '8px' }}>
                {isFlowsLoading ? <div style={{ padding: '10px', color: '#888', textAlign: 'center' }}>Loading flows...</div> 
                : (
                    <>
                        {sortedFlows.length === 0 && <div style={{ padding: '10px', color: '#888', textAlign: 'center' }}>No saved flows found.</div>}
                        
                        {sortedFlows.map(flow => {
                            const isUntitled = flow.title.startsWith('Untitled-');
                            const displayTitle = isUntitled ? 'Untitled Flow' : flow.title;
                            const isEditing = editingState.id === flow.id;

                            return (
                                <div 
                                    key={flow.id}
                                    tabIndex={0}
                                    onClick={() => { if (!isEditing) onLoadFlow(flow.id); }}
                                    onDoubleClick={() => startEditing(flow)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !isEditing) startEditing(flow); }}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', 
                                        background: currentFlowId === flow.id ? '#8b5cf6' : 'transparent', 
                                        marginBottom: '4px',
                                        outline: 'none',
                                    }} 
                                    onMouseOver={e => { if (currentFlowId !== flow.id) e.currentTarget.style.backgroundColor = '#242424'; }} 
                                    onMouseOut={e => { if (currentFlowId !== flow.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    {isEditing ? (
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editingState.text}
                                            onClick={e => e.stopPropagation()}
                                            onMouseDown={e => e.stopPropagation()}
                                            onChange={e => setEditingState(s => ({ ...s, text: e.target.value }))}
                                            onBlur={handleSaveRename}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    e.target.blur(); // Trigger onBlur to save, preventing race condition
                                                }
                                                if (e.key === 'Escape') {
                                                    e.preventDefault();
                                                    setEditingState({ id: null, text: '' }); // Cancel edit
                                                }
                                                e.stopPropagation();
                                            }}
                                            style={{
                                                width: '100%',
                                                background: '#8b5cf6',
                                                border: '1px solid #a78bfa',
                                                color: 'white',
                                                borderRadius: '4px',
                                                padding: '2px 6px',
                                                marginRight: '8px'
                                            }}
                                        />
                                    ) : (
                                        <span style={{ 
                                            flex: 1,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            fontStyle: isUntitled ? 'italic' : 'normal',
                                            color: isUntitled ? '#a0c8f0' : 'inherit',
                                        }} title={flow.title}>
                                            {displayTitle}
                                        </span>
                                    )}

                                    {!isEditing && (
                                        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                            <button title="Delete" className="btn" style={{ height: 24, width: 24, padding: 0, flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); onDeleteFlow(flow.id); }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

const LeftPanel = (props) => { 
    const { activeTab = 'flows', setActiveTab } = props;
    const tabStyle = (tabName) => ({ flex: 1, padding: '10px 12px', border: 'none', borderBottom: activeTab === tabName ? '2px solid #8b5cf6' : '2px solid transparent', background: activeTab === tabName ? '#1a1a1a' : 'transparent', color: activeTab === tabName ? '#ffffff' : '#888', cursor: 'pointer', fontWeight: '500', fontSize: '13px', transition: 'all 0.2s ease' }); 
    
    return (
        <div style={{ height: "100%", border: "1px solid #2a2a2a", borderRadius: 8, background: "linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)", display: "flex", flexDirection: "column", overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}> 
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', flexShrink: 0, background: '#0d0d0d' }}> 
                <button style={tabStyle('flows')} onClick={() => setActiveTab('flows')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <dc.Icon icon="workflow" style={{ width: '14px', height: '14px' }} />
                        <span>Flows</span>
                    </span>
                </button> 
                <button style={tabStyle('palette')} onClick={() => setActiveTab('palette')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <dc.Icon icon="package" style={{ width: '14px', height: '14px' }} />
                        <span>Palette</span>
                    </span>
                </button> 
                <button style={{...tabStyle('llm'), opacity: 0.5, cursor: 'not-allowed'}} disabled>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <dc.Icon icon="sparkles" style={{ width: '14px', height: '14px' }} />
                        <span>LLM</span>
                    </span>
                </button> 
            </div> 
            <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative', padding: '12px' }}> 
                <div style={{ position: 'absolute', inset: '12px', visibility: activeTab === 'palette' ? 'visible' : 'hidden' }}> 
                    <PalettePanel {...props} /> 
                </div> 
                <div style={{ position: 'absolute', inset: '12px', visibility: activeTab === 'flows' ? 'visible' : 'hidden' }}> 
                    <SavedFlowsPanel {...props} /> 
                </div> 
                <div style={{ position: 'absolute', inset: '12px', display: activeTab === 'llm' ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#666', gap: '8px' }}> 
                    <dc.Icon icon="sparkles" style={{ width: '32px', height: '32px', opacity: 0.4 }} />
                    <span style={{ fontSize: '14px' }}>Coming Soon...</span> 
                </div> 
            </div> 
        </div>
    ); 
};

return {
    PalettePanel,
    InspectorPanel,
    SavedFlowsPanel,
    LeftPanel,
};
```

# UI_Components

```jsx
// =================================================================================
//  MODULE: UI_Components
//  Desc:   Contains shared, general-purpose UI components like helpers, modals, etc.
// =================================================================================
const { useState, useRef, useEffect, useMemo, useCallback } = dc;
const { createPortal } = ReactDOM; 
const filename = dc.resolvePath("D.q.actionsmanager.component.md");

const { Utils } = await dc.require(dc.headerLink(filename, "Logic"));

// This replacer is specifically designed to handle Datacore's object structure safely.
function jsonReplacer(key, value) {
  if (key === '$parent' || key === '$sections' || key === '$blocks' || key === 'file') {
    if (value && value.$path) return `[Reference to ${value.$path}]`;
    return `[Circular Reference]`;
  }
  if (value && value.isLuxonDateTime) return value.toISO();
  return value;
}

const ResultItem = function ResultItem({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFields, setShowFields] = useState(false);

  const getDisplayName = (data) => {
    if (typeof data !== 'object' || data === null) return String(data);
    if (data.$name) return String(data.$name);
    if (data.$text) { const text = String(data.text); return text.length > 80 ? text.substring(0, 77) + '...' : text; }
    if (data.$path) return data.$path;
    if (data.file?.path) return data.file.path;
    return "Untitled Item";
  };

  const displayName = getDisplayName(item);
  const itemStyles = { container: { padding: '10px 12px', borderBottom: '1px solid #2a2a2a', backgroundColor: '#141414', color: '#ddd' }, header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }, name: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px', fontSize: '13px' }, buttonContainer: { display: 'flex', gap: '8px', flexShrink: 0 }, button: { padding: '2px 8px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '4px', color: '#ccc', cursor: 'pointer', fontSize: '11px' }, pre: { marginTop: '8px', backgroundColor: '#0e0e0e', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '300px', overflow: 'auto', fontSize: '11px' }, fieldsHeader: { fontSize: '12px', color: '#999', marginTop: '12px', marginBottom: '4px', fontFamily: 'monospace' } };
  
  const fields = useMemo(() => {
    if (!showFields || typeof item.fields !== 'function') return null;
    try {
      return item.fields();
    } catch (e) {
      console.error("Failed to call item.fields()", e);
      return [{ key: "Error", value: "Could not load fields." }];
    }
  }, [showFields, item]);

  return (
    <div style={itemStyles.container}>
      <div style={itemStyles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={itemStyles.name} title={displayName}>{displayName}</span>
        <div style={itemStyles.buttonContainer}>
          {typeof item.fields === 'function' && <button style={itemStyles.button} onClick={(e) => { e.stopPropagation(); setShowFields(!showFields); }}>{showFields ? 'Hide Fields' : 'Show Fields'}</button>}
          <button style={itemStyles.button}>{isExpanded ? 'Collapse' : 'Expand'}</button>
        </div>
      </div>
      {showFields && fields && (
        <div>
          <h4 style={itemStyles.fieldsHeader}>Available Fields (via item.fields()):</h4>
          <pre style={itemStyles.pre}><code>{JSON.stringify(fields, (k, v) => (k === '$parent' ? '[Ref]' : v), 2)}</code></pre>
        </div>
      )}
      {isExpanded && (
        <div>
          <h4 style={itemStyles.fieldsHeader}>Raw Data Object:</h4>
          <pre style={itemStyles.pre}><code>{JSON.stringify(item, jsonReplacer, 2)}</code></pre>
        </div>
      )}
    </div>
  );
};
const TagHelper = function TagHelper({ searchTerm, onTagSelect }) { const [allTags, setAllTags] = useState(null); useEffect(() => { try { const pages = dc.api.query("@page"); const tagSet = new Set(); for (const note of pages) { for (const rawTag of note.$tags || []) { tagSet.add(rawTag.replace(/^#/, "")); } } setAllTags(Array.from(tagSet).sort()); } catch (e) { console.error("Datacore Explorer: Failed to fetch tags.", e); setAllTags([]); } }, []); const filteredTags = useMemo(() => { if (allTags === null) return null; if (!searchTerm) return allTags; return allTags.filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())); }, [allTags, searchTerm]); const styles = { container: { backgroundColor: '#181818', padding: '8px', borderRadius: '6px', border: '1px solid #2a2a2a' }, list: { maxHeight: '150px', overflowY: 'auto' }, button: { width: '100%', textAlign: 'left', padding: '4px 8px', border: 'none', background: 'none', color: '#b0e0e6', cursor: 'pointer', borderRadius: '3px', marginBottom: '2px', fontFamily: 'monospace' }, hover: { backgroundColor: '#2a2a2a' }, message: { color: '#888', fontSize: '12px', textAlign: 'center', margin: '5px 0' } }; return ( <div style={styles.container}> <div style={styles.list}> {filteredTags === null ? <p style={styles.message}>Loading tags...</p> : filteredTags.length > 0 ? filteredTags.map(tag => ( <button key={tag} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onTagSelect(tag)}>#{tag}</button> )) : <p style={styles.message}>{searchTerm ? "No tags match." : "No tags found."}</p>} </div> </div> ); };
const FolderHelper = function FolderHelper({ searchTerm, onFolderSelect }) { const [allFolders, setAllFolders] = useState(null); useEffect(() => { try { const pages = dc.api.query("@page"); const folderSet = new Set(); for (const page of pages) { const path = page.$path; const lastSlashIndex = path.lastIndexOf('/'); if (lastSlashIndex > -1) folderSet.add(path.substring(0, lastSlashIndex)); } setAllFolders(Array.from(folderSet).sort()); } catch (e) { console.error("Datacore Explorer: Failed to fetch folders.", e); setAllFolders([]); } }, []); const filteredFolders = useMemo(() => { if (allFolders === null) return null; if (!searchTerm) return allFolders; return allFolders.filter(folder => folder.toLowerCase().includes(searchTerm.toLowerCase())); }, [allFolders, searchTerm]); const styles = { container: { backgroundColor: '#181818', padding: '8px', borderRadius: '6px', border: '1px solid #2a2a2a' }, list: { maxHeight: '150px', overflowY: 'auto' }, button: { width: '100%', textAlign: 'left', padding: '4px 8px', border: 'none', background: 'none', color: '#a3be8c', cursor: 'pointer', borderRadius: '3px', marginBottom: '2px', fontFamily: 'monospace' }, hover: { backgroundColor: '#2a2a2a' }, message: { color: '#888', fontSize: '12px', textAlign: 'center', margin: '5px 0' } }; return ( <div style={styles.container}> <div style={styles.list}> {filteredFolders === null ? <p style={styles.message}>Loading folders...</p> : filteredFolders.length > 0 ? filteredFolders.map(folder => ( <button key={folder} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onFolderSelect(folder)}>📁 {folder}</button> )) : <p style={styles.message}>{searchTerm ? "No folders match." : "No folders found."}</p>} </div> </div> ); };
const FileHelper = function FileHelper({ searchTerm, onFileSelect }) { const [allFiles, setAllFiles] = useState(null); useEffect(() => { try { const pages = dc.api.query("@page"); setAllFiles(pages.map(p => p.$path).sort()); } catch (e) { console.error("Datacore Explorer: Failed to fetch files.", e); setAllFiles([]); } }, []); const filteredFiles = useMemo(() => { if (allFiles === null) return null; if (!searchTerm) return allFiles; const lowerCaseSearch = searchTerm.toLowerCase(); return allFiles.filter(file => file.toLowerCase().includes(lowerCaseSearch)); }, [allFiles, searchTerm]); const styles = { container: { backgroundColor: '#181818', padding: '8px', borderRadius: '6px', border: '1px solid #2a2a2a' }, list: { maxHeight: '150px', overflowY: 'auto' }, button: { width: '100%', textAlign: 'left', padding: '4px 8px', border: 'none', background: 'none', color: '#d8b9ff', cursor: 'pointer', borderRadius: '3px', marginBottom: '2px', fontFamily: 'monospace' }, hover: { backgroundColor: '#2a2a2a' }, message: { color: '#888', fontSize: '12px', textAlign: 'center', margin: '5px 0' } }; return (<div style={styles.container}><div style={styles.list}>{filteredFiles === null ? <p style={styles.message}>Loading files...</p> : filteredFiles.length > 0 ? filteredFiles.map(file => (<button key={file} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onFileSelect(file)}>📄 {file}</button>)) : <p style={styles.message}>{searchTerm ? "No files match." : "No files found."}</p>}</div></div>); };
const GenericPropertyHelper = function GenericPropertyHelper({ searchTerm, onPropertySelect }) { const [allProperties, setAllProperties] = useState(null); useEffect(() => { try { const allItems = dc.api.query("@page OR @task"); const propertySet = new Set(); const ignoredKeys = new Set(['$parent', '$blocks', '$sections', '$frontmatter', 'file', 'text', '$name', '$path']); for (const item of allItems) { for (const key of Object.keys(item)) { if (!ignoredKeys.has(key)) propertySet.add(key); } if (item.$frontmatter && typeof item.$frontmatter === 'object') { for (const key of Object.keys(item.$frontmatter)) { if (!ignoredKeys.has(key)) propertySet.add(key); } } } setAllProperties(Array.from(propertySet).sort()); } catch (e) { console.error("Datacore Explorer: Failed to fetch properties.", e); setAllProperties([]); } }, []); const filteredProperties = useMemo(() => { if (allProperties === null) return null; if (!searchTerm) return allProperties; const lowerCaseSearch = searchTerm.toLowerCase(); return allProperties.filter(prop => prop.toLowerCase().includes(lowerCaseSearch)); }, [allProperties, searchTerm]); const styles = { container: { backgroundColor: '#181818', padding: '8px', borderRadius: '6px', border: '1px solid #2a2a2a' }, list: { maxHeight: '150px', overflowY: 'auto' }, button: { width: '100%', textAlign: 'left', padding: '4px 8px', border: 'none', background: 'none', color: '#ebcb8b', cursor: 'pointer', borderRadius: '3px', marginBottom: '2px', fontFamily: 'monospace' }, hover: { backgroundColor: '#2a2a2a' }, message: { color: '#888', fontSize: '12px', textAlign: 'center', margin: '5px 0' } }; return ( <div style={styles.container}> <div style={styles.list}> {filteredProperties === null ? <p style={styles.message}>Loading fields...</p> : filteredProperties.length > 0 ? filteredProperties.map(prop => ( <button key={prop} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onPropertySelect(prop)}> {prop.startsWith('$') ? `⚡ ${prop}` : `🔑 ${prop}`} </button> )) : <p style={styles.message}>{searchTerm ? "No fields match." : "No fields found."}</p>} </div> </div> ); };
const ComparisonOperatorHelper = function ComparisonOperatorHelper({ onOperatorSelect }) { const operators = ['==', '!=', '>', '>=', '<', '<=', '.contains']; const styles = { container: { backgroundColor: '#181818', padding: '8px', borderRadius: '6px', border: '1px solid #2a2a2a' }, list: { display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }, button: { padding: '4px 10px', border: '1px solid #333', background: '#222', color: '#b48ead', cursor: 'pointer', borderRadius: '3px', fontFamily: 'monospace', fontSize: '14px' }, hover: { backgroundColor: '#333' }, message: { color: '#888', fontSize: '12px', textAlign: 'center', margin: '5px 0', width: '100%' } }; return ( <div style={styles.container}> <p style={styles.message}>Select an operator or method:</p> <div style={styles.list}> {operators.map(op => ( <button key={op} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = styles.button.background} onClick={() => onOperatorSelect(op)}>{op}</button> ))} </div> </div> ); };
const PromptModal = function PromptModal({ isOpen, title, placeholder, initialValue = '', onSubmit, onClose }) { 
    const [inputValue, setInputValue] = useState(initialValue); 
    const inputRef = useRef(null); 
    
    // CHANGE: This useEffect now correctly resets the inputValue state
    // every time the modal is opened with a new initialValue prop.
    useEffect(() => { 
        if (isOpen) { 
            setInputValue(initialValue);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50); 
        } 
    }, [isOpen, initialValue]); 

    if (!isOpen) return null; 
    
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(inputValue); }; 
    const styles = { overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }, modal: { background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', width: 'clamp(300px, 50vw, 450px)' }, title: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }, input: { width: '100%', background: '#252526', border: '1px solid #444', borderRadius: '4px', padding: '8px 10px', color: '#eee', marginBottom: '16px' }, buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }, button: { padding: '6px 14px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: '#eee', cursor: 'pointer' }, submitButton: { background: '#007acc', borderColor: '#007acc', color: 'white' }, }; 
    
    return createPortal( 
        <div style={styles.overlay} onMouseDown={onClose}> 
            <div style={styles.modal} onMouseDown={e => e.stopPropagation()}> 
                <h3 style={styles.title}>{title}</h3> 
                <form onSubmit={handleSubmit}> 
                    <input ref={inputRef} type="text" style={styles.input} value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={placeholder} /> 
                    <div style={styles.buttonContainer}> 
                        <button type="button" style={styles.button} onClick={onClose}>Cancel</button> 
                        <button type="submit" style={{...styles.button, ...styles.submitButton}}>Save</button> 
                    </div> 
                </form> 
            </div> 
        </div>, document.body 
    ); 
};
const ResizeHandle = ({ onDragStart, onDragMove }) => { 
    const [isHovered, setIsHovered] = useState(false);
    const onDown = (e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        const startX = e.clientX; 
        onDragStart?.(); 
        const move = (me) => { 
            me.preventDefault(); 
            const dx = me.clientX - startX; 
            onDragMove?.(dx); 
        }; 
        const up = () => { 
            window.removeEventListener('pointermove', move); 
            window.removeEventListener('pointerup', up); 
            document.body.style.cursor = ''; 
            document.body.style.userSelect = ''; 
        }; 
        window.addEventListener('pointermove', move); 
        window.addEventListener('pointerup', up); 
        document.body.style.cursor = 'col-resize'; 
        document.body.style.userSelect = 'none'; 
    }; 
    return ( 
        <div 
            style={{ 
                width: '10px', 
                cursor: 'col-resize', 
                background: isHovered ? '#2a2a2a' : '#1c1c1c', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                transition: 'background 0.2s ease'
            }} 
            onPointerDown={onDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        > 
            <div style={{ 
                width: '3px', 
                height: isHovered ? '60px' : '40px', 
                background: isHovered ? '#8b5cf6' : '#3a3a3a', 
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                boxShadow: isHovered ? '0 0 8px rgba(139, 92, 246, 0.5)' : 'none'
            }} />
            {isHovered && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}>
                    <div style={{ width: '3px', height: '3px', background: '#8b5cf6', borderRadius: '50%' }} />
                    <div style={{ width: '3px', height: '3px', background: '#8b5cf6', borderRadius: '50%' }} />
                    <div style={{ width: '3px', height: '3px', background: '#8b5cf6', borderRadius: '50%' }} />
                </div>
            )}
        </div> 
    );
};
const FloatingOrb = ({ pos, setPos, hostRef, onRunAll, onRunSelection, onRunSingle, onStop, onFit, onCenter, onSnapToggle, snap, screenHelperRef, setShowLeft, setShowRight, showLeft, showRight, openNodeMenu, selectedNodeIds, runFromNode, duplicateNode, bringToFront, sendToBack, copyNodeJSON, deleteNodeById }) => { const [open, setOpen] = useState(false); const [showQuickAdd, setShowQuickAdd] = useState(false); const orbRef = useRef(null); const menuRef = useRef(null); const quickAddRef = useRef(null); const [menuPos, setMenuPos] = useState({ left: 0, top: 0, origin: "left" }); const stateRef = useRef({ dragging: false, moved: false, pointerId: null, startX: 0, startY: 0, originX: 0, originY: 0 }); const DRAG = 4; function hostBounds() { const el = hostRef?.current || orbRef.current?.parentElement; if (!el) return { w: window.innerWidth, h: window.innerHeight }; const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; } function calcMenuPos() { if (!open) return; const pad = 8, orbW = 44; const bounds = hostBounds(); const mw = menuRef.current?.offsetWidth || 240, mh = menuRef.current?.offsetHeight || 140; let left = pos.x + orbW + 8, top = pos.y, origin = "left"; if (left + mw + pad > bounds.w) { left = pos.x - mw - 8; origin = "right"; } if (left < pad) left = pad; if (left + mw > bounds.w - pad) left = bounds.w - mw - pad; if (top + mh + pad > bounds.h) top = bounds.h - mh - pad; if (top < pad) top = pad; setMenuPos({ left, top, origin }); } useEffect(() => { if (open) { requestAnimationFrame(() => requestAnimationFrame(calcMenuPos)); } }, [open]); const pd = (e) => { e.stopPropagation(); e.preventDefault(); }; const onDown = (e) => { pd(e); const s = stateRef.current; s.dragging = true; s.moved = false; s.pointerId = e.pointerId; s.startX = e.clientX; s.startY = e.clientY; s.originX = pos.x; s.originY = pos.y; orbRef.current?.setPointerCapture?.(e.pointerId); }; const onMove = (e) => { const s = stateRef.current; if (!s.dragging) return; const dx = e.clientX - s.startX, dy = e.clientY - s.startY; if (!s.moved && (Math.abs(dx) > DRAG || Math.abs(dy) > DRAG)) s.moved = true; if (s.moved) { const b = hostBounds(); setPos({ x: Utils.clamp(s.originX + dx, 6, b.w - 50), y: Utils.clamp(s.originY + dy, 6, b.h - 50) }); if (open) requestAnimationFrame(calcMenuPos); } }; const onUp = (e) => { const s = stateRef.current; if (!s.dragging) return; orbRef.current?.releasePointerCapture?.(s.pointerId); const moved = s.moved; s.dragging = false; s.moved = false; s.pointerId = null; if (!moved) setOpen(o => !o); }; 
    
    const hasSelection = selectedNodeIds && selectedNodeIds.length > 0;
    const firstSelectedId = selectedNodeIds?.[0];
    
    const quickAddNodes = [
        { type: 'datacore.query', label: 'Datacore Query', icon: 'database', group: 'Input & Data' },
        { type: 'data.json', label: 'Manual Data', icon: 'file-text', group: 'Input & Data' },
        { type: 'expr', label: 'Expression', icon: 'zap', group: 'Data Processing' },
        { type: 'json.filter', label: 'Filter Array', icon: 'filter', group: 'Data Processing' },
        { type: 'loop.forEach', label: 'For Each', icon: 'repeat', group: 'Control Flow' },
        { type: 'if', label: 'If Condition', icon: 'git-branch', group: 'Control Flow' },
        { type: 'output.display', label: 'Display', icon: 'eye', group: 'Debug' },
        { type: 'debug.log', label: 'Debug Log', icon: 'bug', group: 'Debug' },
        { type: 'comment', label: 'Comment', icon: 'message-square', group: 'Debug' }
    ];
    
    const handleQuickAdd = (nodeType) => {
        const bounds = hostBounds();
        const centerX = bounds.w / 2;
        const centerY = bounds.h / 2;
        openNodeMenu?.({ clientX: centerX, clientY: centerY }, nodeType);
        setShowQuickAdd(false);
        setOpen(false);
    };
    
    const Item = useMemo(() => ({ label, onClick, icon, isPrimary }) => (<button className="btn" onMouseDown={pd} onClick={(e) => { pd(e); onClick?.(); setOpen(false); }} style={{ height: 28, textAlign: "left", width: "100%", display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: isPrimary ? '#8b5cf6' : '#1a1a1a', color: isPrimary ? '#ffffff' : '#eaeaea' }}>{icon && <dc.Icon icon={icon} style={{ width: '14px', height: '14px', flexShrink: 0 }} />}{label}</button>), []); const transformOrigin = menuPos.origin === "right" ? "top right" : "top left"; return (<> <div ref={orbRef} style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 3000, width: 44, height: 44, borderRadius: 9999, border: "1px solid #4a4a4a", background: "linear-gradient(135deg,#2a2a3a,#1a1a28)", boxShadow: "0 8px 20px rgba(0,0,0,0.45)", display: "grid", placeItems: "center", cursor: "grab" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onContextMenu={pd}><div style={{ width: 12, height: 12, borderRadius: 999, background: snap ? "#a78bfa" : "#6b6b7b" }} /></div> {open && ( <div ref={menuRef} onMouseDown={pd} onClick={pd} style={{ position: "fixed", left: menuPos.left, top: menuPos.top, zIndex: 3001, background: "#101010", border: "1px solid #2a2a2a", borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 6, minWidth: 220, boxShadow: "0 12px 28px rgba(0,0,0,0.5)", transformOrigin }}> 
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}> 
            <Item label="Quick Add Node" onClick={() => { setShowQuickAdd(!showQuickAdd); }} icon="plus-circle" isPrimary={showQuickAdd} /> 
            <Item label="Run All" onClick={onRunAll} icon="play-circle" isPrimary /> 
            <Item label="Run From Sel." onClick={onRunSelection} icon="play" isPrimary /> 
            <Item label="Stop" onClick={onStop} icon="square" isPrimary /> 
            <Item label="Fit" onClick={onFit} icon="maximize-2" /> 
            <Item label={snap ? "Snap: On" : "Snap: Off"} onClick={onSnapToggle} icon="grid-3x3" /> 
        </div> 
        {showQuickAdd && (
            <>
                <div style={{ height: 1, background: "#2a2a2a", margin: "4px 0" }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '200px', overflowY: 'auto' }}>
                    {quickAddNodes.map(node => (
                        <button 
                            key={node.type}
                            className="btn" 
                            onMouseDown={pd}
                            onClick={(e) => { pd(e); handleQuickAdd(node.type); }}
                            style={{ 
                                height: 32, 
                                textAlign: "left", 
                                width: "100%", 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                backgroundColor: '#1a1a1a',
                                color: '#eaeaea',
                                padding: '0 10px'
                            }}
                        >
                            <dc.Icon icon={node.icon} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                            {node.label}
                        </button>
                    ))}
                </div>
            </>
        )}
        {hasSelection && (
            <>
                <div style={{ height: 1, background: "#2a2a2a", margin: "4px 0" }} />
                <div style={{ fontSize: 11, color: '#666', padding: '4px 0' }}>Selected Node Actions</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}> 
                    <Item label="Run From" onClick={() => { firstSelectedId && runFromNode?.(firstSelectedId); setOpen(false); }} icon="play" isPrimary />
                    <Item label="Duplicate" onClick={() => { firstSelectedId && duplicateNode?.(firstSelectedId); setOpen(false); }} icon="copy" />
                    <Item label="To Front" onClick={() => { firstSelectedId && bringToFront?.(firstSelectedId); setOpen(false); }} icon="bring-to-front" />
                    <Item label="To Back" onClick={() => { firstSelectedId && sendToBack?.(firstSelectedId); setOpen(false); }} icon="send-to-back" />
                    <Item label="Copy JSON" onClick={() => { firstSelectedId && copyNodeJSON?.(firstSelectedId); setOpen(false); }} icon="clipboard" />
                    <Item label="Delete" onClick={() => { firstSelectedId && deleteNodeById?.(firstSelectedId); setOpen(false); }} icon="trash-2" />
                </div>
            </>
        )}
        <div style={{ height: 1, background: "#2a2a2a", margin: "4px 0" }} /> 
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}> 
            <Item label={showLeft ? "Hide Left" : "Show Left"} onClick={() => setShowLeft(v => !v)} icon={showLeft ? "panel-left-close" : "panel-left-open"} /> 
            <Item label={showRight ? "Hide Right" : "Show Right"} onClick={() => setShowRight(v => !v)} icon={showRight ? "panel-right-close" : "panel-right-open"} /> 
        </div> 
        <div style={{ height: 1, background: "#2a2a2a", margin: "4px 0" }} /> 
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}> 
            <Item label="Tab Mode" onClick={() => screenHelperRef.current?.toggleMode("fullTab")} icon="columns-2" /> 
            <Item label="Window" onClick={() => screenHelperRef.current?.toggleMode("window")} icon="rectangle-horizontal" /> 
            <Item label="Fullscreen" onClick={() => screenHelperRef.current?.toggleMode("browser")} icon="maximize" /> 
            <Item label="Float" onClick={() => screenHelperRef.current?.toggleMode("character")} icon="move" /> 
        </div> 
        <div style={{ height: 1, background: "#2a2a2a", margin: "4px 0" }} /> 
        <Item label="Reset Orb Position" onClick={() => setPos({ x: 20, y: 20 })} icon="rotate-ccw" /> 
    </div> )} </>);};

return {
    jsonReplacer, ResultItem, TagHelper, FolderHelper, FileHelper,
    GenericPropertyHelper, ComparisonOperatorHelper, PromptModal,
    ResizeHandle, FloatingOrb,
};
```





# Hooks

```jsx
const { useState, useRef, useEffect, useMemo, useCallback } = dc;


// =================================================================================
//  MODULE: Hooks
//  Desc:   Custom React hooks for state management and side effects.
// =================================================================================
const Hooks = {
  usePersistentState: (key, initial, normalizer) => { 
    const [v, setV] = useState(() => { 
      try { 
        const s = localStorage.getItem(key); 
        if (!s) return initial;
        const parsed = JSON.parse(s);
        return normalizer ? normalizer(parsed) : parsed;
      } catch { 
        return initial; 
      } 
    }); 
    useEffect(() => { 
      try { 
        localStorage.setItem(key, JSON.stringify(v)); 
      } catch {} 
    }, [key, v]); 
    return [v, setV]; 
  },
  
  // CHANGE: The hook now correctly handles events inside editable fields.
  // It only processes global shortcuts if they use a modifier key (Ctrl/Cmd/Alt),
  // allowing default browser behavior like Ctrl+A to work in text inputs.
  useKeybinds: ({ bindings, rootRef, utils }) => {
    const bindingsRef = useRef(bindings);

    useEffect(() => {
      bindingsRef.current = bindings;
    }, [bindings]);

    useEffect(() => {
      const el = rootRef.current;
      if (!el || !utils) return;

      const onKey = (e) => {
        const isEditable = utils.isEditableTarget(e);
        
        // If in an editable field, only process keybinds that use a modifier key.
        // This prevents single-character keys (like 'g') from triggering global actions
        // while allowing shortcuts like Ctrl+S or Ctrl+A to be handled.
        if (isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
            return;
        }

        const k = [e.ctrlKey || e.metaKey ? "Ctrl" : "", e.shiftKey ? "Shift" : "", e.altKey ? "Alt" : "", (e.key || "").toLowerCase()].filter(Boolean).join("+");
        
        const fn = bindingsRef.current[k];
        
        if (typeof fn === "function") {
          // Allow default browser behavior for common text editing shortcuts.
          if (isEditable && (k === "Ctrl+a" || k === "Ctrl+c" || k === "Ctrl+v" || k === "Ctrl+x" || k === "Ctrl+z")) {
            // Don't prevent default for these specific cases in editable fields
          } else {
             e.preventDefault();
          }
          e.stopPropagation();
          fn(e);
        }
      };
      
      el.addEventListener("keydown", onKey);
      return () => el.removeEventListener("keydown", onKey);

    }, [rootRef, utils]);
  },

  useContextMenu: () => { const [menu, setMenu] = useState(null); useEffect(() => { if (!menu) return; const close = () => setMenu(null); setTimeout(() => { document.addEventListener("mousedown", close, { once: true }); }, 0); return () => document.removeEventListener("mousedown", close, { once: true }); }, [menu]); return [menu, setMenu]; },
  
  useScreenModeHelper: ({ helperRef, containerRef, originalParentRefForWindow, originalParentRefForPiP }) => {
    function _SMH_findNearestAncestorWithClass(el, cls) { if (!el) return null; let cur = el.parentNode; while (cur) { if (cur.classList && cur.classList.contains(cls)) return cur; cur = cur.parentNode; } return null; }
    function _SMH_findDirectChildByClass(parent, cls) { if (!parent) return null; for (const ch of parent.children) { if (ch.classList && ch.classList.contains(cls)) return ch; } return null; }
    function _SMH_applyBrowserMode(container) { if (!document.fullscreenElement) { (container.requestFullscreen || container.webkitRequestFullscreen)?.call(container); } else if (document.fullscreenElement === container) { document.exitFullscreen?.(); } }
    function _SMH_applyWindowStyle(container) { Object.assign(container.style, { position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", zIndex: "2147483647", backgroundColor: "#1c1c1c", overflow: "auto", pointerEvents: "auto" }); }
    function _SMH_leaf(container) { return _SMH_findNearestAncestorWithClass(container, "workspace-leaf-content"); }
    function _SMH_applyFullTabStyle(container, leafRef, parentPosRef, placeholderRef) { const target = _SMH_findDirectChildByClass(leafRef, "view-content") || leafRef; const curParent = container.parentNode; if (!curParent) return; const placeholder = document.createElement("div"); placeholder.style.display = "none"; if (container.nextSibling) curParent.insertBefore(placeholder, container.nextSibling); else curParent.appendChild(placeholder); placeholderRef.current = placeholder; parentPosRef.current = { element: target, originalInlinePosition: target.style.position }; if (getComputedStyle(target).position === "static") target.style.position = "relative"; curParent.removeChild(container); target.appendChild(container); Object.assign(container.style, { position: "absolute", inset: "0", zIndex: "2147483646", backgroundColor: "#1c1c1c", overflow: "auto", pointerEvents: "auto" }); }
    function _SMH_reset(container, activeMode, leafRef, parentPosRef, placeholderRef, originalParentRefForWindow, originalParentRefForPiP) { if (document.fullscreenElement === container) { document.exitFullscreen?.(); } if (leafRef.current && activeMode === "fullTab") { const placeholder = placeholderRef.current; if (placeholder?.parentNode) { placeholder.parentNode.replaceChild(container, placeholder); } const t = parentPosRef.current?.element; if (t) { t.style.position = parentPosRef.current.originalInlinePosition || ""; } leafRef.current = null; parentPosRef.current = null; placeholderRef.current = null; } if (container.parentNode === document.body) { let target = null; if (activeMode === "window" && originalParentRefForWindow.current) target = originalParentRefForWindow.current; else if (activeMode === "character" && originalParentRefForPiP.current) target = originalParentRefForPiP.current; if (target) { document.body.removeChild(container); target.appendChild(container); } } container.style.cssText = ""; container.style.display = "block"; }

    const [activeMode, setActiveMode] = useState("default");
    const leafRef = useRef(null);
    const parentPosRef = useRef(null);
    const placeholderRef = useRef(null);

    const toggleMode = useCallback(async (mode) => {
        const container = containerRef.current;
        if (!container) return;
        const next = (activeMode === mode) ? "default" : mode;
        if (activeMode !== "default") {
            _SMH_reset(container, activeMode, leafRef, parentPosRef, placeholderRef, originalParentRefForWindow, originalParentRefForPiP);
        }
        setActiveMode(next);
        if (next === "browser") _SMH_applyBrowserMode(container);
        if (next === "window") { if (!originalParentRefForWindow.current) originalParentRefForWindow.current = container.parentNode; if (container.parentNode !== document.body) document.body.appendChild(container); _SMH_applyWindowStyle(container); }
        if (next === "fullTab") { const leaf = _SMH_leaf(container); if (leaf) { leafRef.current = leaf; _SMH_applyFullTabStyle(container, leaf, parentPosRef, placeholderRef); } else setActiveMode("default"); }
        if (next === "character") { if (!originalParentRefForPiP.current) originalParentRefForPiP.current = container.parentNode; if (container.parentNode !== document.body) document.body.appendChild(container); Object.assign(container.style, { position: "fixed", top: "calc(100% - 400px - 20px)", left: "calc(100% - 600px - 20px)", width: "600px", height: "400px", zIndex: "2147483647", backgroundColor: "#1c1c1c", border: "1px solid #444", borderRadius: "8px", boxSizing: "border-box", overflow: "hidden", boxShadow: "0 8px 20px rgba(0,0,0,0.25)", pointerEvents: "auto" }); }
    }, [activeMode, containerRef]);

    useEffect(() => { if (helperRef) helperRef.current = { toggleMode, getActiveMode: () => activeMode }; }, [helperRef, toggleMode, activeMode]);
    useEffect(() => { const fs = () => { if (!document.fullscreenElement && activeMode === "browser") toggleMode("browser"); }; document.addEventListener("fullscreenchange", fs); return () => document.removeEventListener("fullscreenchange", fs); }, [activeMode, toggleMode]);
  },
};


return { Hooks };
```



# Logic


```jsx
// =================================================================================
//  MODULE: Constants
//  Desc:   Static data and presets used throughout the application.
// =================================================================================
const Constants = {
    BASE_FLOW_DIR: ".datacore/flows/",
    ACTIONS_PRESET: [
        // ═══════════════════════════════════════════════════════════════════
        // INPUT & DATA SOURCES - Entry points for workflows
        // ═══════════════════════════════════════════════════════════════════
        { type: "data.json", label: "Manual Data", icon: "file-text", params: [{ key: "data", value: '{"example": "data"}' }], group: "Input & Data", inputs: [], outputs: [{ name: "data" }], description: "Manually input JSON or text data for testing" },
        { type: "datacore.query", label: "Datacore Query", icon: "database", params: [{ key: "query", value: "@page" }], group: "Input & Data", inputs: [], outputs: [{ name: "data" }], description: "Fetch data from Datacore index with DQL queries" },
        { type: "fs.read", label: "Read File", icon: "file", params: [{ key: "path", value: "" }], group: "Input & Data", inputs: ["flow"], outputs: [{ name: "data" }], description: "Read the contents of a specific file" },
        { type: "fs.listFiles", label: "List Files", icon: "folder", params: [{ key: "path", value: "" }], group: "Input & Data", inputs: ["flow"], outputs: [{ name: "data" }], description: "Get list of all files in a folder" },
        { type: "obsidian.getActiveFile", label: "Get Active File", icon: "target", params: [], group: "Input & Data", inputs: [], outputs: [{ name: "data" }], description: "Get information about the currently open file" },
        
        // ═══════════════════════════════════════════════════════════════════
        // DATA PROCESSING - Transform and manipulate data
        // ═══════════════════════════════════════════════════════════════════
        { type: "expr", label: "Expression", icon: "zap", params: [{ key: "expr", value: "=last" }], group: "Data Processing", inputs: ["flow"], outputs: [{ name: "data" }], description: "Evaluate any JavaScript expression (Swiss Army knife)" },
        { type: "json.filter", label: "Filter Array", icon: "filter", params: [{ key: "field", value: "" }, { key: "op", value: "==" }, { key: "value", value: "" }], group: "Data Processing", inputs: ["data"], outputs: [{ name: "data" }], description: "Filter array of objects by field condition" },
        { type: "data.editFields", label: "Edit Fields", icon: "edit-3", params: [{ key: "operations", value: "[]" }], group: "Data Processing", inputs: ["data"], outputs: [{ name: "data" }], description: "Set, remove, or rename fields on objects" },
        { type: "data.select", label: "Select Fields", icon: "check-square", params: [{ key: "fields", value: "file.name, status" }], group: "Data Processing", inputs: ["data"], outputs: [{ name: "data" }], description: "Pick only specific fields from objects" },
        { type: "array.sort", label: "Sort Array", icon: "arrow-up-down", params: [{ key: "field", value: "file.name" }, { key: "direction", value: "asc" }], group: "Data Processing", inputs: ["data"], outputs: [{ name: "data" }], description: "Sort array of objects by field" },
        { type: "array.flatten", label: "Flatten Array", icon: "list", params: [{ key: "list", value: "=last" }], group: "Data Processing", inputs: ["data"], outputs: [{ name: "data" }], description: "Flatten nested arrays into single level" },
        { type: "array.group", label: "Group Array", icon: "package", params: [ { key: "list", value: "=last" }, { key: "mode", value: "fixedSize" }, { key: "value", value: "10" } ], group: "Data Processing", inputs: ["data"], outputs: [{ name: "data" }], description: "Split array into groups (chunks)" },
        { type: "data.format", label: "Format Data", icon: "paintbrush", params: [{ key: "expression", value: "=last" }], group: "Data Processing", inputs: ["data"], outputs: [{ name: "data" }], description: "Transform data with custom formatting" },
        
        // ═══════════════════════════════════════════════════════════════════
        // CONTROL FLOW - Direct execution paths
        // ═══════════════════════════════════════════════════════════════════
        { type: "if", label: "If Condition", icon: "git-branch", params: [{ key: "cond", value: "=vars.count > 5" }], group: "Control Flow", inputs: ["flow"], outputs: [{ name: "true" }, { name: "false" }], description: "Branch execution based on true/false condition" },
        { type: "loop.forEach", label: "For Each Loop", icon: "repeat", params: [{ key: "list", value: "=last" }, { key: "itemName", value: "item" }, { key: "indexName", value: "index" }], group: "Control Flow", inputs: ["flow"], outputs: [{ name: "body" }, { name: "done" }], description: "Iterate over array, run sub-flow for each item" },
        { type: "loop.for", label: "For Loop", icon: "hash", params: [{ key: "count", value: "10" }, { key: "indexName", value: "index" }], group: "Control Flow", inputs: ["flow"], outputs: [{ name: "body" }, { name: "done" }], description: "Run sub-flow N times with counter" },
        { type: "while", label: "While Loop", icon: "rotate-cw", params: [{ key: "cond", value: "=vars.i < 5" }, { key: "counterName", value: "i" }], group: "Control Flow", inputs: ["flow"], outputs: [{ name: "body" }, { name: "done" }], description: "Loop while condition is true (be careful!)" },
        { type: "flow.merge", label: "Merge Paths", icon: "git-merge", params: [], group: "Control Flow", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Join multiple execution paths into one stream" },
        { type: "flow.stop", label: "Stop Execution", icon: "square", params: [], group: "Control Flow", inputs: ["flow"], outputs: [], description: "Terminate current branch" },
        
        // ═══════════════════════════════════════════════════════════════════
        // ACTIONS & SIDE EFFECTS - Interact with Obsidian/files
        // ═══════════════════════════════════════════════════════════════════
        { type: "fs.write", label: "Write File", icon: "save", params: [{ key: "path", value: "" }, { key: "content", value: "=last" }, { key: "overwrite", value: "false" }], group: "Actions", inputs: ["data"], outputs: [{ name: "data" }], description: "Create new file or overwrite existing one" },
        { type: "fs.append", label: "Append to File", icon: "file-plus", params: [{ key: "path", value: "" }, { key: "content", value: "=last" }, { key: "addNewline", value: "true" }], group: "Actions", inputs: ["data"], outputs: [{ name: "data" }], description: "Add content to end of existing file" },
        { type: "obsidian.notice", label: "Show Notice", icon: "message-circle", params: [{ key: "message", value: "=last" }], group: "Actions", inputs: ["data"], outputs: [{ name: "data" }], description: "Display popup notification in Obsidian" },
        { type: "obsidian", label: "Open File", icon: "external-link", params: [ { key: "path", value: "" }, { key: "openMode", value: "tab-fg" } ], group: "Actions", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Open file in Obsidian editor" },
        { type: "obsidian.prompt", label: "Prompt Input", icon: "edit", params: [{ key: "title", value: "Enter value" }, { key: "placeholder", value: "" }], group: "Actions", inputs: ["flow"], outputs: [{ name: "data" }], description: "Show modal to get user input mid-flow" },
        { type: "command", label: "Run Command", icon: "terminal", params: [{ key: "commandId", value: "" }], group: "Actions", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Execute any Obsidian command" },
        
        // ═══════════════════════════════════════════════════════════════════
        // VARIABLES & STATE - Manage workflow state
        // ═══════════════════════════════════════════════════════════════════
        { type: "var.set", label: "Set Variable", icon: "download", params: [{ key: "name", value: "myVar" }, { key: "value", value: "=last" }], group: "Variables", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Store data in workflow variable (global state)" },
        { type: "var.get", label: "Get Variable", icon: "upload", params: [{ key: "name", value: "myVar" }, { key: "default", value: "" }], group: "Variables", inputs: ["flow"], outputs: [{ name: "data" }], description: "Retrieve stored variable value" },
        { type: "array.new", label: "New Array", icon: "layers", params: [{ key: "name", value: "arr" }, { key: "items", value: "=[1,2,3]" }], group: "Variables", inputs: ["flow"], outputs: [{ name: "data" }], description: "Create new array variable" },
        { type: "array.push", label: "Array Push", icon: "corner-down-right", params: [{ key: "name", value: "arr" }, { key: "value", value: "=last" }], group: "Variables", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Add item to end of array variable" },
        { type: "array.get", label: "Array Get", icon: "search", params: [{ key: "name", value: "arr" }, { key: "index", value: "=0" }], group: "Variables", inputs: ["flow"], outputs: [{ name: "data" }], description: "Get item from array by index" },
        { type: "array.set", label: "Array Set", icon: "edit-2", params: [{ key: "name", value: "arr" }, { key: "index", value: "=0" }, { key: "value", value: "=123" }], group: "Variables", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Update item in array at index" },
        { type: "array.length", label: "Array Length", icon: "ruler", params: [{ key: "name", value: "arr" }], group: "Variables", inputs: ["flow"], outputs: [{ name: "data" }], description: "Get number of items in array" },
        { type: "compare", label: "Compare", icon: "git-compare", params: [{ key: "op", value: "==" }, { key: "lhs", value: "=vars.foo" }, { key: "rhs", value: "=3" }], group: "Variables", inputs: ["flow"], outputs: [{ name: "data" }], description: "Compare two values (returns true/false)" },
        
        // ═══════════════════════════════════════════════════════════════════
        // DEBUG & OUTPUT - Inspect and display data
        // ═══════════════════════════════════════════════════════════════════
        { type: "debug.log", label: "Debug Log", icon: "bug", params: [ { key: "message", value: "Log message" }, { key: "data", value: "=last" }, { key: "level", value: "info" }, { key: "target", value: "console" }, { key: "logContext", value: false } ], group: "Debug", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Print data to console panel for inspection" },
        { type: "output.display", label: "Display Output", icon: "eye", params: [], group: "Debug", inputs: ["data"], outputs: [], description: "Show data directly on canvas (final output)" },
        { type: "comment", label: "Comment", icon: "message-square", params: [{ key: "text", value: "Add notes here..." }, { key: "color", value: "yellow" }], group: "Debug", w: 200, height: 120, inputs: [], outputs: [], description: "Add sticky note to canvas (documentation)" },
        { type: "conditional", label: "Condition Check", icon: "help-circle", params: [{ key: "field", value: "status" }, { key: "op", value: "==" }, { key: "value", value: "done" }], group: "Debug", inputs: ["data"], outputs: [{ name: "data" }], description: "Test condition and pass data through" },
        { type: "output.viewer", label: "Viewer (File)", icon: "book-open", params: [{ key: "filePath", value: "" }], group: "Debug", inputs: ["data"], outputs: [], description: "Display file content in viewer" },
        
        // ═══════════════════════════════════════════════════════════════════
        // ADVANCED & UTILITIES
        // ═══════════════════════════════════════════════════════════════════
        { type: "wait", label: "Wait", icon: "clock", params: [{ key: "ms", value: "1000" }], group: "Utilities", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Pause execution for specified milliseconds" },
        { type: "script", label: "Custom Script", icon: "code", params: [{ key: "code", value: "" }], group: "Utilities", inputs: ["flow"], outputs: [{ name: "flow" }, { name: "data" }], description: "Execute custom JavaScript code" },
        { type: "http", label: "HTTP Request", icon: "globe", params: [{ key: "method", value: "GET" }, { key: "url", value: "" }], group: "Utilities", inputs: ["flow"], outputs: [{ name: "flow" }, { name: "data" }], description: "Make HTTP request to external API" },
        { type: "hotkey", label: "Send Hotkey", icon: "keyboard", params: [{ key: "combo", value: "Ctrl+P" }], group: "Utilities", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Simulate keyboard shortcut" },
        { type: "setting", label: "Toggle Setting", icon: "settings", params: [{ key: "key", value: "" }, { key: "value", value: "on" }], group: "Utilities", inputs: ["flow"], outputs: [{ name: "flow" }], description: "Change Obsidian setting programmatically" },
    ],
};

// =================================================================================
//  MODULE: Utils
//  Desc:   General-purpose helper functions.
// =================================================================================
const Utils = {
    uid: (p = "id") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    titleize: (s) => (s || "").replace(/[-]+/g, " ").replace(/\b\w/g, m => m.toUpperCase()),
    rectFromPoints: (a, b) => { const rx = Math.min(a.x, b.x), ry = Math.min(a.y, b.y); const wSpan = Math.abs(a.x - b.x), hSpan = Math.abs(a.y - b.y); return { x: rx, y: ry, w: wSpan, h: hSpan }; },
    rectIntersects: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    isEditableTarget: (e) => { const t = e.target; if (!t) return false; if (t.isContentEditable) return true; const tag = (t.tagName || "").toUpperCase(); return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"; },
    fuzzyScore: (q, s) => { if (!q) return 0; let qi = 0, score = 0, last = -2; const qs = q.toLowerCase(), ss = (s || "").toLowerCase(); for (let i = 0; i < ss.length && qi < qs.length; i++) { if (ss[i] === qs[qi]) { score += 1; if (i === last + 1) score += 1; if (i === 0) score += 1; last = i; qi++; } } return qi === qs.length ? score : 0; },
    escapeHtml: (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    highlightMatch: (s, q) => { const str = String(s || ""); const term = String(q || "").trim().toLowerCase(); if (!term) return Utils.escapeHtml(str); const i = str.toLowerCase().indexOf(term); if (i < 0) return Utils.escapeHtml(str); const a = Utils.escapeHtml(str.slice(0, i)), b = Utils.escapeHtml(str.slice(i, i + term.length)), c = Utils.escapeHtml(str.slice(i + term.length)); return `${a}<mark>${b}</mark>${c}`; },
    timeAgo: (isoString) => { const date = new Date(isoString); const seconds = Math.floor((new Date() - date) / 1000); let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + "y ago"; interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + "mo ago"; interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "d ago"; interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h ago"; interval = seconds / 60; if (interval > 1) return Math.floor(interval) + "m ago"; return "just now"; },
    getDeepValue: (obj, path) => {
        if (!path || typeof path !== 'string') return undefined;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    },
};

// =================================================================================
//  MODULE: Logic
//  Desc:   Application-specific logic for data manipulation and flow control.
// =================================================================================
const Logic = {
    derivePluginGroupFromCommandId: (id) => { if (!id || typeof id !== "string") return "Core App"; const prefix = (id.split(":")[0] || "").toLowerCase(); if (!prefix || prefix === "app" || prefix === "obsidian") return "Core App"; if (prefix.indexOf("excalidraw") === 0) return "Excalidraw"; return Utils.titleize(prefix); },
    buildDynamicCommandBlocks: () => { const out = []; try { const cmds = dc.app?.commands?.commands || {}; for (const k of Object.keys(cmds)) { const c = cmds[k]; if (!c?.name) continue; out.push({ type: "command", label: c.name, params: [{ key: "commandId", value: c.id }], group: Logic.derivePluginGroupFromCommandId(c.id), inputs: ["flow"], outputs: ["flow"] }); } } catch { } return out; },
    mergeAndGroupPalette: (base, dynamic, recentIds) => {
        const all = [...base, ...dynamic];
        const grouped = new Map();
        for (const a of all) {
            const g = a.group || "Misc";
            if (!grouped.has(g)) grouped.set(g, []);
            grouped.get(g).push(a);
        }
        const recent = [];
        const seen = new Set();
        for (const id of recentIds) {
            const it = all.find(x => x.type === "command" && x.params?.[0]?.key === "commandId" && x.params?.[0]?.value === id);
            if (it && !seen.has(id)) {
                recent.push(it);
                seen.add(id);
            }
        }
        const order = [...(recent.length ? ["Recent"] : []), ...Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b))];
        const obj = {};
        if (recent.length) obj["Recent"] = recent;
        for (const k of grouped.keys()) obj[k] = grouped.get(k).sort((a, b) => (a.label || "").localeCompare(b.label || ""));
        return { groups: obj, order, flat: all };
    },
    parseQuery: (str) => { const tokens = []; const parts = (str || "").trim().split(/\s+/).filter(Boolean); const rest = []; for (const part of parts) { const m = part.match(/^(\w+):(.*)$/); if (m) tokens.push({ k: m[1].toLowerCase(), v: m[2] }); else rest.push(part); } return { text: rest.join(" ").trim(), tokens }; },
    tryJson: (val) => { try { return JSON.parse(val); } catch { return val; } },
    
    resolveValue: (raw, ctx) => {
        if (typeof raw !== 'string') return raw;

        const s = raw.trim();
        if (!s.startsWith('=')) {
            return Logic.tryJson(raw);
        }

        let expr = s.slice(1);

        // Recursively resolve nested expressions like `...[=vars.index]`
        const resolveNested = (subExpr) => {
            const nestedRegex = /\[\s*=\s*([^\]]+?)\s*\]/g;
            return subExpr.replace(nestedRegex, (match, innerExpr) => {
                const fn = new Function("vars", "last", "dc", "item", '"use strict"; return (' + innerExpr + ');');
                const val = fn(ctx.vars, ctx.last, dc, ctx.item);
                // Return a string-safe version for property access
                return typeof val === 'string' ? `["${val}"]` : `[${val}]`;
            }).replace(/\["([^"]+)"\]/g, '["$1"]'); // Consolidate back to standard bracket notation
        };

        expr = resolveNested(expr);
        
        try {
            const fn = new Function("vars", "last", "dc", "item", '"use strict"; return (' + expr + ');');
            return fn(ctx.vars, ctx.last, dc, ctx.item);
        } catch (e) {
            ctx.log && ctx.log(`Expression error in "${expr}": ${e.message}`, { kind: "error", data: { original: raw, context: ctx } });
            console.error("Expression evaluation failed:", { expression: expr, original: raw, context: ctx, error: e });
            return undefined;
        }
    },
};

return { Constants, Utils, Logic };
```
