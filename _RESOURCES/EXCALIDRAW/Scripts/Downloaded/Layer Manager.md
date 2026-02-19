/*
# Layer Manager X (Production-Ready Patch: Bound Text De-dup + Pure-ish Tree Builder + Delegated UI)
Fix:
- Excalidraw represents “text inside a shape” as a separate text element with `containerId`.
- Previously, the script rendered the container (rectangle) AND the bound text as separate rows → duplicates.
Now:
- Bound text is merged into its container node’s `node.elements` (so actions select/lock/hide/delete both),
- Bound text is skipped as its own row everywhere (top-level + inside groups/frames),
- Create-group-from-selection ignores bound text for the “at least two” check, but still groups it together with its container.
*/
if (!ea.verifyMinimumPluginVersion || !ea.verifyMinimumPluginVersion("2.0.0")) {
  new Notice("This script requires a newer version of Excalidraw. Please install the latest version.");
  return;
}

// -----------------------------------------------------------------------------
// 1) Settings & State
// -----------------------------------------------------------------------------
const SETTING_KEY_X = "win_x";
const SETTING_KEY_Y = "win_y";
const SETTING_KEY_W = "win_w";
const SETTING_KEY_H = "win_h";
const SETTING_GROUP_STROKES = "group_strokes";
const SETTING_DEBUG = "debug";

const DEFAULTS = {
  [SETTING_KEY_X]: 100,
  [SETTING_KEY_Y]: 100,
  [SETTING_KEY_W]: 350,
  [SETTING_KEY_H]: 500,
  [SETTING_GROUP_STROKES]: true,
  [SETTING_DEBUG]: true,
};

let settings = ea.getScriptSettings?.() ?? {};
let dirty = false;

const ensureSetting = (key, value, description) => {
  if (!settings[key] || settings[key].value === undefined) {
    settings[key] = { value };
    if (description) settings[key].description = description;
    dirty = true;
  }
};

ensureSetting(SETTING_KEY_X, DEFAULTS[SETTING_KEY_X]);
ensureSetting(SETTING_KEY_Y, DEFAULTS[SETTING_KEY_Y]);
ensureSetting(SETTING_KEY_W, DEFAULTS[SETTING_KEY_W]);
ensureSetting(SETTING_KEY_H, DEFAULTS[SETTING_KEY_H]);
ensureSetting(
  SETTING_GROUP_STROKES,
  DEFAULTS[SETTING_GROUP_STROKES],
  "Group consecutive freedraw strokes?"
);
ensureSetting(
  SETTING_DEBUG,
  DEFAULTS[SETTING_DEBUG],
  "Enable debug logging in the console (Layer Manager X)"
);

// Sanity check to avoid “grey line” / broken modal size
const w0 = parseInt(settings[SETTING_KEY_W].value, 10);
const h0 = parseInt(settings[SETTING_KEY_H].value, 10);
if (!Number.isFinite(w0) || !Number.isFinite(h0) || w0 < 120 || h0 < 120) {
  settings[SETTING_KEY_X].value = DEFAULTS[SETTING_KEY_X];
  settings[SETTING_KEY_Y].value = DEFAULTS[SETTING_KEY_Y];
  settings[SETTING_KEY_W].value = DEFAULTS[SETTING_KEY_W];
  settings[SETTING_KEY_H].value = DEFAULTS[SETTING_KEY_H];
  dirty = true;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const STATE = {
  expandedNodes: new Set(),
  autoRefresh: true,
  // Stops keyup/pointerup refresh while Obsidian prompt is open
  promptOpen: false,
  // Suppress auto-refresh for a short window after prompt closes
  suppressAutoRefreshUntil: 0,
  editingNodeId: null,
  hiddenStash: null,
  lastFilePath: null,
};

// UX sizing knobs
const UI = {
  TOGGLE_BOX_PX: 22,
  TOGGLE_FONT_PX: 18,
  INDENT_PX: 16,
};

// Debug logging
const DEBUG = !!settings[SETTING_DEBUG]?.value;
const logger = (() => {
  const prefix = "[LMX]";
  return {
    log: (...args) => { if (DEBUG) console.log(prefix, ...args); },
    warn: (...args) => { if (DEBUG) console.warn(prefix, ...args); },
    error: (...args) => { console.error(prefix, ...args); },
  };
})();

const prompt = async (title, desc, defaultValue) => {
  STATE.promptOpen = true;
  try {
    return await utils.inputPrompt(title, desc, defaultValue);
  } finally {
    STATE.promptOpen = false;
    STATE.suppressAutoRefreshUntil = Date.now() + 300;
  }
};

const suggester = async (displayItems, items) => {
  STATE.promptOpen = true;
  try {
    return await utils.suggester(displayItems, items);
  } finally {
    STATE.promptOpen = false;
    STATE.suppressAutoRefreshUntil = Date.now() + 300;
  }
};

// View activity guard
const hasActiveView = () => {
  if (!ea?.targetView) return false;
  if (!ea.targetView.ownerWindow) return false;
  return true;
};

// -----------------------------------------------------------------------------
// 2) CustomData Namespace
// -----------------------------------------------------------------------------
const LMX_NS = "lmx"; // customData.lmx = { layerName, groupNames: { [groupId]: name } }

const getLMX = (el) =>
  (el?.customData && el.customData[LMX_NS]) ? el.customData[LMX_NS] : {};

const setLMX = (eaEl, patch) => {
  if (!eaEl) return;
  const cur = getLMX(eaEl);
  eaEl.customData = {
    ...(eaEl.customData ?? {}),
    [LMX_NS]: { ...cur, ...(patch ?? {}) },
  };
};

// --- Hidden Element Storage (Vault) ---
// --- Hidden Element Storage (Frontmatter) ---
// We use excalidraw-onload-script because it's an official key that survives plugin saves
const HIDDEN_FM_KEY = "excalidraw-onload-script";

const getHiddenStash = () => {
  const file = ea.targetView?.file;
  if (!file) return {};
  
  // If we switched files, clear the cache
  if (STATE.lastFilePath !== file.path) {
    STATE.hiddenStash = null;
    STATE.lastFilePath = file.path;
  }

  // If cache exists, use it
  if (STATE.hiddenStash !== null) {
      return STATE.hiddenStash;
  }

  // Otherwise load from frontmatter
  const cache = app.metadataCache.getFileCache(file);
  const rawData = cache?.frontmatter?.[HIDDEN_FM_KEY];
  
  let stash = {};
  if (rawData && typeof rawData === "string") {
    try {
      // Look for our prefix and parse the JSON following it
      if (rawData.startsWith("//LMX_STASH:")) {
        const jsonPart = rawData.substring("//LMX_STASH:".length);
        stash = JSON.parse(jsonPart);
      } else {
        // Fallback for migration or if it's just raw JSON from a previous partial save
        stash = JSON.parse(rawData);
      }
    } catch (e) {
      // If it's not JSON, maybe it's an actual script the user added. 
      // We don't want to overwrite it if it's not ours, but for now we assume we own this key.
      // logger.debug("Frontmatter key exists but isn't our stash format");
    }
  }
  
  STATE.hiddenStash = stash;
  return stash;
};

const saveHiddenStash = async (stash) => {
  const file = ea.targetView?.file;
  if (!file) return;

  // Update local cache immediately
  STATE.hiddenStash = stash;
  STATE.lastFilePath = file.path;

  // Write to frontmatter asynchronously
  await app.fileManager.processFrontMatter(file, (fm) => {
    if (!stash || Object.keys(stash).length === 0) {
      delete fm[HIDDEN_FM_KEY];
    } else {
      // We prefix with // to make it a valid JS comment in case it's executed as a script
      fm[HIDDEN_FM_KEY] = "//LMX_STASH:" + JSON.stringify(stash);
    }
  });
};

// Backwards compatible fallback: customData.layerName
const getLayerName = (el) => getLMX(el)?.layerName ?? el?.customData?.layerName ?? null;
const setLayerName = (eaEl, name) => setLMX(eaEl, { layerName: name });

const getGroupNameFromElements = (groupElements, groupId) => {
  for (const el of groupElements ?? []) {
    const lmx = getLMX(el);
    if (lmx?.groupNames && typeof lmx.groupNames[groupId] === "string" && lmx.groupNames[groupId]) {
      return lmx.groupNames[groupId];
    }
    // legacy fallback
    if (el?.customData?.groupNames && typeof el.customData.groupNames[groupId] === "string") {
      return el.customData.groupNames[groupId];
    }
  }
  return null;
};

// -----------------------------------------------------------------------------
// 3) Icons & Display Helpers
// -----------------------------------------------------------------------------
const ICONS = {
  EYE: ea.obsidian.getIcon("eye"),
  EYE_OFF: ea.obsidian.getIcon("eye-off"),
  LOCK: ea.obsidian.getIcon("lock"),
  UNLOCK: ea.obsidian.getIcon("unlock"),
  REFRESH: ea.obsidian.getIcon("refresh-cw"),
  SETTINGS: ea.obsidian.getIcon("settings"),
  PLUS: ea.obsidian.getIcon("plus"),
  ARROW_UP: ea.obsidian.getIcon("arrow-up"),
  ARROW_DOWN: ea.obsidian.getIcon("arrow-down"),
  TYPE_FRAME: ea.obsidian.getIcon("layout"),
  TYPE_GROUP: ea.obsidian.getIcon("layers"),
  TYPE_TEXT: ea.obsidian.getIcon("type"),
  TYPE_IMAGE: ea.obsidian.getIcon("image"),
  TYPE_SHAPE: ea.obsidian.getIcon("box"),
  TYPE_LINE: ea.obsidian.getIcon("pen-tool"),
  CLOSE: ea.obsidian.getIcon("x"),
  MORE_VERTICAL: ea.obsidian.getIcon("more-vertical"),
};

const iconHTML = (iconEl) => (iconEl ? iconEl.outerHTML : "•");
const normHidden = (el) => getLMX(el)?.hidden === true;
const normLocked = (el) => el?.locked === true;

const getTypeIcon = (type) => {
  switch (type) {
    case "frame": return ICONS.TYPE_FRAME;
    case "text": return ICONS.TYPE_TEXT;
    case "image": return ICONS.TYPE_IMAGE;
    case "arrow":
    case "line":
    case "bucket": return ICONS.TYPE_LINE; // Use line icon for stroke buckets
    case "freedraw": return ICONS.TYPE_LINE;
    case "group": return ICONS.TYPE_GROUP;
    default: return ICONS.TYPE_SHAPE;
  }
};

const getElementDisplayName = (el) => {
  if (!el) return "Unknown";
  const ln = getLayerName(el);
  if (ln) return ln;
  if (el.type === "frame" && el.name) return el.name;
  if (el.type === "text" && typeof el.text === "string") {
    const t = el.text.replace(/\n/g, " ");
    return t.substring(0, 20) + (t.length > 20 ? "..." : "");
  }
  if (el.link && typeof el.link === "string" && el.link.startsWith("[[")) return el.link;
  return el.type ? (el.type.charAt(0).toUpperCase() + el.type.slice(1)) : "Element";
};

const makeGroupNodeId = (groupId) => `group:${groupId}`;
const makeBucketId = (firstElId) => `bucket:${firstElId}`;

// -----------------------------------------------------------------------------
// 4) Node Type + Constructors
// -----------------------------------------------------------------------------
/**
 * @typedef {Object} LMXNode
 * @property {string} id
 * @property {string} type
 * @property {any} element
 * @property {any[]} elements
 * @property {LMXNode[]} children
 * @property {boolean} canExpand
 * @property {boolean} isExpanded
 * @property {string|null} [groupId]
 * @property {string|null} [containerFrameId]
 */
const Node = (() => {
  /** @param {Partial<LMXNode>} patch */
  const base = (patch) => ({
    id: "",
    type: "unknown",
    element: null,
    elements: [],
    children: [],
    canExpand: false,
    isExpanded: false,
    groupId: null,
    parentGroupId: null,
    containerFrameId: null,
    ...patch,
  });

  const makeFrameNode = (frameEl, isExpanded) => base({
    id: frameEl.id,
    type: "frame",
    element: frameEl,
    elements: [frameEl],
    children: [],
    canExpand: true,
    isExpanded: !!isExpanded,
    containerFrameId: null,
  });

  // PATCH: allow extra elements (e.g. bound text) to travel with the container
  const makeElementNode = (el, extraElements = []) => base({
    id: el.id,
    type: el.type,
    element: el,
    elements: [el, ...(extraElements ?? [])],
    children: [],
    canExpand: false,
    isExpanded: false,
    containerFrameId: el.frameId ?? null,
  });

  const makeBucketNode = (bucket) => {
    const el = bucket[0];
    const type = el.type;
    return base({
      id: makeBucketId(el.id),
      type: "bucket", 
      element: el,
      elements: bucket,
      children: [],
      canExpand: false,
      isExpanded: false,
      bucketType: type,
      containerFrameId: el.frameId ?? null,
    });
  };

  const makeGroupNode = ({ groupId, parentGroupId, elements, rep, containerFrameId }, children, isExpanded) => base({
    id: makeGroupNodeId(groupId),
    type: "group",
    groupId,
    parentGroupId: parentGroupId ?? null,
    element: rep,
    elements: elements ?? [],
    children: children ?? [],
    canExpand: true,
    isExpanded: !!isExpanded,
    containerFrameId: containerFrameId ?? null,
  });

  const makeGroupChildNode = ({ groupId, parentGroupId, rep, elements }, children, isExpanded) => base({
    id: makeGroupNodeId(groupId),
    type: "group",
    groupId,
    parentGroupId: parentGroupId ?? null,
    element: rep,
    elements: elements ?? [],
    children: children ?? [],
    canExpand: true,
    isExpanded: !!isExpanded,
    containerFrameId: null,
  });

  const collectDeepElements = (node) => {
    const m = new Map(); // id -> element
    const walk = (n) => {
      if (!n) return;
      (n.elements ?? []).forEach((el) => { if (el?.id) m.set(el.id, el); });
      (n.children ?? []).forEach(walk);
    };
    walk(node);
    return [...m.values()];
  };

  return {
    makeFrameNode,
    makeElementNode,
    makeBucketNode,
    makeGroupNode,
    makeGroupChildNode,
    collectDeepElements,
  };
})();

// -----------------------------------------------------------------------------
// 5) EA Edit Lifecycle Helper
// -----------------------------------------------------------------------------
const withEAEdit = async (viewElements, mutatorFn) => {
  if (!Array.isArray(viewElements) || viewElements.length === 0) return;
  if (!hasActiveView()) return;

  ea.copyViewElementsToEAforEditing(viewElements);
  const api = { getEAElement: (id) => ea.getElement(id) };
  await mutatorFn(api);
  await ea.addElementsToView(false, true); // Enable save to persist isDeleted and other changes
};

// -----------------------------------------------------------------------------
// 6) Naming Strategy
// -----------------------------------------------------------------------------
const Naming = (() => {
  /** @param {any[]} elements */
  const getLoggableOrder = (elements) => {
    const list = elements.map(el => {
        const name = getLayerName(el) || el.text?.substring(0, 10) || el.type;
        const idSuffix = el.id ? `#${el.id.slice(-4)}` : '';
        return `${name}${idSuffix}${getLMX(el).hidden ? '(H)' : ''}`;
    }).join(" > ");
    return `[TOP] ${list} [BOTTOM]`;
  };

  const getNodeDisplayName = (node) => {
    if (!node) return "Unknown";
    if (node.type === "group") {
      const n = getGroupNameFromElements(node.elements, node.groupId);
      return n || `Group (${node.elements?.length ?? 0})`;
    }
    if (node.type === "bucket") {
      const cnt = node.elements?.length ?? 0;
      const typeLabel = node.bucketType ? (node.bucketType.charAt(0).toUpperCase() + node.bucketType.slice(1)) : "Items";
      return `${typeLabel}s (${cnt})`;
    }

    const container = node.element;
    if (container && !getLayerName(container)) {
      const bound = (node.elements ?? []).find(
        (e) => e?.type === "text" && e?.containerId === container.id && typeof e.text === "string"
      );
      if (bound) {
        const t = bound.text.replace(/\n/g, " ").trim();
        if (t) return t.substring(0, 20) + (t.length > 20 ? "..." : "");
      }
    }
    return getElementDisplayName(node.element);
  };

  const getRenameSeed = (node) => {
    if (!node) return "";
    if (node.type === "frame") return getElementDisplayName(node.element);
    if (node.type === "group") {
      return getGroupNameFromElements(node.elements, node.groupId) || `Group (${node.elements?.length ?? 0})`;
    }
    return getNodeDisplayName(node);
  };

  const getRenameTitle = (node) => {
    if (!node) return "Rename";
    if (node.type === "frame") return "Rename Frame";
    if (node.type === "group") return "Rename Group Layer";
    return "Rename Layer";
  };

  const setGroupNameOnElements = async (viewElements, groupId, name) => {
    if (!viewElements || viewElements.length === 0) return;
    if (!hasActiveView()) return;
    await withEAEdit(viewElements, ({ getEAElement }) => {
      for (const el of viewElements) {
        const eaEl = getEAElement(el.id);
        if (!eaEl) continue;
        const lmx = getLMX(eaEl);
        const groupNames = { ...(lmx.groupNames ?? {}) };
        groupNames[groupId] = name;
        setLMX(eaEl, { groupNames });
      }
    });
  };

  const setNodeName = async (node, nextName) => {
    if (!node || !nextName) return;
    if (!hasActiveView()) return;

    if (node.type === "frame") {
      await withEAEdit([node.element], ({ getEAElement }) => {
        const frame = getEAElement(node.element.id);
        if (frame) frame.name = nextName;
      });
      return;
    }
    if (node.type === "group") {
      await setGroupNameOnElements(node.elements, node.groupId, nextName);
      return;
    }
    await withEAEdit(node.elements, ({ getEAElement }) => {
      for (const el of node.elements) {
        const eaEl = getEAElement(el.id);
        if (!eaEl) continue;
        setLayerName(eaEl, nextName);
      }
    });
  };

  return { getNodeDisplayName, getRenameSeed, getRenameTitle, setNodeName, setGroupNameOnElements, getLoggableOrder };
})();

// -----------------------------------------------------------------------------
// 7) Tree Building (PATCHED: Bound Text De-dup)
// -----------------------------------------------------------------------------
const TreeBuilder = (() => {
  const computeZIndex = (elements) => {
    const zIndex = new Map();
    for (let i = 0; i < elements.length; i++) zIndex.set(elements[i].id, i);
    return zIndex;
  };

  // PATCH: Bound text index (text elements with containerId)
  const buildBoundTextIndex = (elements) => {
    const elementIds = new Set();
    for (const el of elements ?? []) if (el?.id) elementIds.add(el.id);

    const containerToTexts = new Map(); // containerId -> textEl[]
    const boundTextIds = new Set();     // textEl.id set

    for (const el of elements ?? []) {
      if (!el || el.type !== "text") continue;
      const cid = el.containerId;
      if (!cid || !elementIds.has(cid)) continue;

      boundTextIds.add(el.id);
      const arr = containerToTexts.get(cid) ?? [];
      arr.push(el);
      containerToTexts.set(cid, arr);
    }

    const isBoundText = (el) =>
      !!(el && el.type === "text" && el.containerId && elementIds.has(el.containerId));

    const getForContainer = (containerEl) =>
      containerToTexts.get(containerEl?.id) ?? [];

    return { elementIds, boundTextIds, containerToTexts, isBoundText, getForContainer };
  };

  const computeMaxGroups = (elements, zIndex, maxGroups) => {
    const elToMaxGroup = new Map();
    for (const g of maxGroups ?? []) {
      const outerGroupId = g?.[0]?.groupIds?.[g?.[0]?.groupIds?.length - 1];
      if (!outerGroupId) continue;
      let rep = g[0];
      for (const e of g) {
        if ((zIndex.get(e.id) ?? -1) > (zIndex.get(rep.id) ?? -1)) rep = e;
      }
      const frameIds = new Set(g.map((e) => e.frameId ?? null));
      const containerFrameId = frameIds.size === 1 ? [...frameIds][0] : null;
      const info = { groupId: outerGroupId, parentGroupId: null, elements: g, rep, containerFrameId };
      for (const e of g) elToMaxGroup.set(e.id, info);
    }
    return elToMaxGroup;
  };

  const buildFrameBuckets = (elements, expandedNodes) => {
    const buckets = {};
    for (const el of elements) {
      if (el.type !== "frame") continue;
      buckets[el.id] = Node.makeFrameNode(el, expandedNodes.has(el.id));
    }
    return buckets;
  };

  const getPathInsideOuter = (el, outerGroupId) => {
    const gids = Array.isArray(el.groupIds) ? el.groupIds : [];
    if (gids.length === 0) return [];
    const idx = gids.lastIndexOf(outerGroupId);
    if (idx < 0) return [];
    const inner = gids.slice(0, idx);
    return inner.slice().reverse(); // outer->inner
  };

  // PATCH: group children also skip bound-text rows; merge into container nodes
  const buildGroupChildren = (outerGroupId, groupElements, ctx, boundText) => {
    const idsInThisGroup = new Set((groupElements ?? []).map((e) => e?.id).filter(Boolean));

    const root = { children: [], __childGroupMap: new Map() };
    const getOrCreateGroupChild = (parent, groupId, repEl) => {
      const parentGroupId = parent.groupId ?? null;
      const map = parent.__childGroupMap ?? (parent.__childGroupMap = new Map());
      if (map.has(groupId)) return map.get(groupId);
      const node = Node.makeGroupChildNode(
        { groupId, parentGroupId, rep: repEl, elements: [] },
        [],
        ctx.expandedNodes.has(makeGroupNodeId(groupId))
      );
      node.__childGroupMap = new Map();
      parent.children.push(node);
      map.set(groupId, node);
      return node;
    };

    for (const el of groupElements) {
      // Skip bound text as its own row if its container is present in this group scope.
      if (boundText?.isBoundText?.(el) && idsInThisGroup.has(el.containerId)) {
        continue;
      }

      let parent = root;
      const path = getPathInsideOuter(el, outerGroupId);
      for (const gid of path) {
        const childGroup = getOrCreateGroupChild(parent, gid, el);
        childGroup.elements.push(el);
        parent = childGroup;
      }

      const extras = boundText?.getForContainer?.(el) ?? [];
      parent.children.push(Node.makeElementNode(el, extras));
    }

    const stripMaps = (n) => {
      delete n.__childGroupMap;
      for (const c of n.children ?? []) stripMaps(c);
    };
    stripMaps(root);
    return root.children;
  };

  const placeNode = (node, tree, frameBuckets) => {
    if (!node) return;
    if (node.type === "group" && node.containerFrameId && frameBuckets[node.containerFrameId]) {
      frameBuckets[node.containerFrameId].children.push(node);
      return;
    }
    const rep = node.element;
    if (node.type !== "frame" && rep?.frameId && frameBuckets[rep.frameId]) {
      frameBuckets[rep.frameId].children.push(node);
    } else {
      tree.push(node);
    }
  };

  const isBucketable = (el) =>
    (el?.type === "freedraw") &&
    (!Array.isArray(el.groupIds) || el.groupIds.length === 0);

  const collectBucket = (elements, startIndex, processed) => {
    const first = elements[startIndex];
    const frameId = first.frameId ?? null;
    const type = first.type; // Group only same types together
    const bucket = [first];
    processed.add(first.id);
    let j = startIndex - 1;
    while (j >= 0) {
      const e2 = elements[j];
      if (!e2?.id || processed.has(e2.id)) { j--; continue; }
      if (!isBucketable(e2)) break;
      if (e2.type !== type) break; // Break if type switches (e.g. Line -> Arrow)
      if ((e2.frameId ?? null) !== frameId) break;
      bucket.push(e2);
      processed.add(e2.id);
      j--;
    }
    return { bucket, nextIndex: j + 1 };
  };

  const buildLayerTree = (ctx) => {
    if (!ctx || !Array.isArray(ctx.elements)) return [];
    const elements = ctx.elements;

    const zIndex = computeZIndex(elements);
    const boundText = buildBoundTextIndex(elements);

    const maxGroups = ea.getMaximumGroups?.(elements) ?? [];
    const elToMaxGroup = computeMaxGroups(elements, zIndex, maxGroups);
    const frameBuckets = buildFrameBuckets(elements, ctx.expandedNodes);

    const tree = [];
    const processed = new Set();

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (!el?.id || processed.has(el.id)) continue;
      
      // Filter out genuinely deleted elements, but KEEP lmx-hidden elements
      if (el.isDeleted && !getLMX(el).hidden) continue;

      // PATCH: never render bound text as a standalone row; it is merged into its container node
      if (boundText.isBoundText(el)) {
        processed.add(el.id);
        continue;
      }

      if (el.type === "frame") {
        processed.add(el.id);
        placeNode(frameBuckets[el.id], tree, frameBuckets);
        continue;
      }

      if (elToMaxGroup.has(el.id)) {
        const gi = elToMaxGroup.get(el.id);
        const expanded = ctx.expandedNodes.has(makeGroupNodeId(gi.groupId));
        const groupOrdered = [...gi.elements].sort(
          (a, b) => (zIndex.get(b.id) ?? 0) - (zIndex.get(a.id) ?? 0)
        );

        const children = expanded ? buildGroupChildren(gi.groupId, groupOrdered, ctx, boundText) : [];
        const groupNode = Node.makeGroupNode(gi, children, expanded);
        gi.elements.forEach((e) => processed.add(e.id));
        placeNode(groupNode, tree, frameBuckets);
        continue;
      }

      if (ctx.groupStrokes && isBucketable(el)) {
        const { bucket, nextIndex } = collectBucket(elements, i, processed);
        // Only bucket if there's more than 1 item, or if it's freedraw (usually nice to hide even 1)
        // Actually, logic above always returns at least 1. 
        // Let's bucket them if count > 1 OR if type is freedraw. 
        // If it's a single line, maybe just show as specific line? 
        // Current logic: strict bucketing for all enabled types.
        if (bucket.length > 1 || el.type === "freedraw") {
           placeNode(Node.makeBucketNode(bucket), tree, frameBuckets);
           i = nextIndex;
           continue;
        }
        // If it was just 1 line/arrow, fall through to normal render?
        // But we added to processed... wait, collectBucket adds to processed.
        // If we want to fallback, we must remove from processed.
        // Actually simpler: Just always bucket if enabled. A "Lines (1)" is fine.
        placeNode(Node.makeBucketNode(bucket), tree, frameBuckets);
        i = nextIndex;
        continue;
      }

      processed.add(el.id);
      placeNode(Node.makeElementNode(el, boundText.getForContainer(el)), tree, frameBuckets);
    }

    for (const fId in frameBuckets) {
      frameBuckets[fId].canExpand = (frameBuckets[fId].children?.length ?? 0) > 0;
    }

    logger.log("buildLayerTree", {
      elementCount: elements.length,
      frameCount: Object.keys(frameBuckets).length,
      expandedCount: ctx.expandedNodes.size,
      groupStrokes: ctx.groupStrokes,
    });

    return tree;
  };

  return { buildLayerTree, buildBoundTextIndex };
})();

// -----------------------------------------------------------------------------
// 8) Actions + Safe UI refresh
// -----------------------------------------------------------------------------
let _refreshScheduled = false;

const getOwnerWindowSafe = () =>
  window.excalidrawLayerManager?.ownerWindow ??
  window.excalidrawLayerManager?.modal?.modalEl?.ownerDocument?.defaultView ??
  ea.targetView?.ownerWindow ??
  window;

const scheduleRefreshUI = () => {
  if (_refreshScheduled) return;
  _refreshScheduled = true;

  const w = getOwnerWindowSafe();
  const raf = w.requestAnimationFrame
    ? w.requestAnimationFrame.bind(w)
    : (fn) => setTimeout(fn, 16);

  raf(async () => {
    _refreshScheduled = false;

    const app = window.excalidrawLayerManager;
    if (!app) return;

    if (!app.modal?.modalEl?.isConnected) return;

    if (!hasActiveView()) {
      try { app.modal?.close?.(); } catch (_) {}
      return;
    }

    const ctx = createTreeContext();
    if (!ctx) return;

    const tree = TreeBuilder.buildLayerTree(ctx);
    await app.render(tree);
  });
};

const Actions = (() => {
  const deepTargets = (node) => Node.collectDeepElements(node);

  const toggleVisibility = async (node) => {
    if (!hasActiveView()) return;
    const targets = deepTargets(node);
    if (targets.length === 0) return;
    const anyHidden = targets.some((el) => normHidden(el));
    const allElements = ea.getViewElements();
    const stash = getHiddenStash();

    if (anyHidden) {
      // UNHIDE: Move from stash back to canvas
      const restored = [];
      for (const nodeEl of targets) {
        if (stash[nodeEl.id]) {
          try {
            const data = typeof stash[nodeEl.id] === 'string' ? JSON.parse(stash[nodeEl.id]) : stash[nodeEl.id];
            data.isDeleted = false;
            if (data.customData?.[LMX_NS]) data.customData[LMX_NS].hidden = false;
            restored.push(data);
            delete stash[nodeEl.id];
          } catch (e) { logger.error("Restore failed", nodeEl.id, e); }
        }
      }
      
      if (restored.length > 0) {
        // 1. Update stash first (Frontmatter)
        await saveHiddenStash(stash);
        // Small delay to let Obsidian metadata cache settle before plugin save
        await sleep(200);

        // 2. Prep EA buffer
        ea.clear();
        const api = ea.getExcalidrawAPI();
        const fullSceneElements = api.getSceneElementsIncludingDeleted();
        const restoredIds = new Set(restored.map(r => r.id));
        
        // 3. Mark existing memory elements as visible
        const inScene = fullSceneElements.filter(el => restoredIds.has(el.id));
        for (const el of inScene) {
          el.isDeleted = false;
          if (el.customData?.[LMX_NS]) el.customData[LMX_NS].hidden = false;
          // Must clone into EA to make addElementsToView aware of the update
          ea.copyViewElementsToEAforEditing([el]);
        }
        
        // 4. Add truly missing elements
        const notInScene = restored.filter(r => !inScene.some(el => el.id === r.id));
        if (notInScene.length > 0) {
          ea.copyViewElementsToEAforEditing(notInScene);
        }
        
        // 5. Initial commit (Reveals them)
        await ea.addElementsToView(false, true, false); 

        // 6. Restore Z-Index
        restored.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        for (const el of restored) {
          if (typeof el.zIndex === "number") {
             ea.moveViewElementToZIndex(el.id, el.zIndex);
          }
        }
        
        // 7. Final Body Save
        await ea.addElementsToView(false, true);
      }
    } else {
      // HIDE: Move from canvas to stash
      ea.clear();
      for (const el of targets) {
        const zIndex = allElements.findIndex(e => e.id === el.id);
        ea.copyViewElementsToEAforEditing([el]);
        const eaEl = ea.getElement(el.id);
        if (eaEl) {
          eaEl.isDeleted = true;
          setLMX(eaEl, { hidden: true });
          stash[el.id] = JSON.stringify({ ...eaEl, zIndex });
        }
      }
      // Body save (Hide them)
      await ea.addElementsToView(false, true);
      // Stash save (Frontmatter)
      await saveHiddenStash(stash);
    }

    logger.log("toggleVisibility complete", { nodeId: node?.id, anyHidden, count: targets.length });
    scheduleRefreshUI();
  };

  const toggleLock = async (node) => {
    if (!hasActiveView()) return;
    const targets = deepTargets(node);
    if (targets.length === 0) return;
    const allLocked = targets.every((el) => normLocked(el));

    await withEAEdit(targets, ({ getEAElement }) => {
      for (const el of targets) {
        const eaEl = getEAElement(el.id);
        if (!eaEl) continue;
        eaEl.locked = !allLocked;
      }
    });

    logger.log("toggleLock", { nodeId: node?.id, allLocked, count: targets.length });
    scheduleRefreshUI();
  };

  const rename = (node) => {
    if (!node) return;
    if (!hasActiveView()) return;
    STATE.editingNodeId = node.id;
    logger.log("startRename", { nodeId: node.id, type: node.type });
    scheduleRefreshUI();
  };

  const commitRename = async (node, nextName) => {
    if (!node) return;
    if (!hasActiveView()) return;
    const current = Naming.getRenameSeed(node);
    if (!nextName || nextName === current) {
      STATE.editingNodeId = null;
      scheduleRefreshUI();
      return;
    }
    await Naming.setNodeName(node, nextName);
    STATE.editingNodeId = null;
    logger.log("commitRename", { nodeId: node.id, type: node.type, from: current, to: nextName });
    scheduleRefreshUI();
  };

  const move = async (node, direction) => {
    if (!hasActiveView()) return;
    const targets = deepTargets(node);
    if (targets.length === 0) return;
    const api = ea.getExcalidrawAPI?.();
    if (!api) {
      new Notice("Excalidraw API not available for reordering.");
      return;
    }
    try {
      // direction 1 = Move Up (List) = Front (Z) = bringForward
      // direction -1 = Move Down (List) = Back (Z) = sendBackward
      if (direction === 1 && typeof api.bringForward === "function") api.bringForward(targets);
      else if (direction === -1 && typeof api.sendBackward === "function") api.sendBackward(targets);
      else {
          // Fallback if methods missing (older Excalidraw versions?)
          // But strictly, we should have them.
          new Notice("Reorder not supported by this API.");
      }
    } catch (err) {
      // console.error(err);
      new Notice("Reorder failed. See console.");
    }
    // console.log("move", { nodeId: node?.id, direction, count: targets.length });
    setTimeout(scheduleRefreshUI, 60);
  };





  const select = (node, opts = {}) => {
    if (!hasActiveView()) return;
    const targets = deepTargets(node);
    const targetIds = targets.map((el) => el.id);

    if (opts.toggle) {
      const current = new Set(ea.getViewSelectedElements().map((e) => e.id));
      const allSelected = targetIds.every((id) => current.has(id));
      
      if (allSelected) {
        // Deselect
        targetIds.forEach((id) => current.delete(id));
      } else {
        // Select
        targetIds.forEach((id) => current.add(id));
      }
      ea.selectElementsInView([...current]);
    } else {
      // Replace
      ea.selectElementsInView(targetIds);
    }

    logger.log("select", { nodeId: node?.id, count: targets.length, toggle: opts.toggle });
    if (opts.refreshUI !== false) scheduleRefreshUI();
  };

  const remove = async (node) => {
    if (!hasActiveView()) return;
    const targets = deepTargets(node);
    if (targets.length === 0) return;
    await withEAEdit(targets, ({ getEAElement }) => {
      for (const el of targets) {
        const eaEl = getEAElement(el.id);
        if (!eaEl) continue;
        eaEl.isDeleted = true;
      }
    });
    logger.log("delete", { nodeId: node?.id, count: targets.length });
    scheduleRefreshUI();
  };

  const duplicate = async (node) => {
    if (!hasActiveView()) return;
    const targets = deepTargets(node);
    if (targets.length === 0) return;

    const idMap = new Map();
    const groupRemap = new Map();
    
    // 1. Generate new IDs and Group IDs
    targets.forEach(el => idMap.set(el.id, ea.generateElementId()));
    targets.forEach(el => {
      (el.groupIds ?? []).forEach(gid => {
        if (!groupRemap.has(gid)) groupRemap.set(gid, ea.generateElementId());
      });
    });

    // 2. Clone and Remap
    const clones = targets.map(el => {
      const clone = JSON.parse(JSON.stringify(el));
      clone.id = idMap.get(el.id);
      clone.x += 20;
      clone.y += 20;
      
      if (clone.containerId && idMap.has(clone.containerId)) {
        clone.containerId = idMap.get(clone.containerId);
      }
      
      if (Array.isArray(clone.groupIds)) {
        clone.groupIds = clone.groupIds.map(gid => groupRemap.get(gid) ?? gid);
      }
      
      if (clone.boundElements) {
         clone.boundElements = clone.boundElements.map(be => {
           if (idMap.has(be.id)) return { ...be, id: idMap.get(be.id) };
           return be;
         });
      }
      return clone;
    });

    // 3. Add to view
    ea.copyViewElementsToEAforEditing(clones);
    await ea.addElementsToView(false, true);
    
    // Select the clones
    ea.selectElementsInView(clones.map(c => c.id));
    
    logger.log("duplicate", { nodeId: node?.id, count: clones.length });
    scheduleRefreshUI();
  };

  const moveNode = async (draggedNode, targetNode, position, moveAsBlock = true) => {
    if (!hasActiveView() || !draggedNode || !targetNode) return;
    if (draggedNode.id === targetNode.id) return;

    // 1. Get all elements in View (Standard Excalidraw is Bottom-to-Top / Back-to-Front)
    // We reverse it to Top-to-Bottom (Front-to-Back) to match UI list order.
    let allElements = ea.getViewElements();
    allElements.reverse(); // Now index 0 is Front (Top)

    // 2. Resolve Element IDs
    // draggedNode and targetNode might be strict elements or groups.
    // We need the actual element IDs.
    const draggedIds = new Set(Node.collectDeepElements(draggedNode).map(e => e.id));
    
    // If we can't find the dragged elements, abort
    if (draggedIds.size === 0) {
        console.warn("LMX.moveNode: No elements found for dragged node", draggedNode);
        return;
    }

    // 3. Extract Dragged Elements (preserve their relative order)
    const draggedElements = [];
    const remainingElements = [];
    
    for (const el of allElements) {
        if (draggedIds.has(el.id)) {
            draggedElements.push(el);
        } else {
            remainingElements.push(el);
        }
    }

    // 4. Find Insertion Point in Remaining Elements
    // We need to find where the target is in the *remaining* list.
    // Note: targetNode's elements might also be dragging? No, dragged != target.
    
    // We use the first element of the targetNode as the anchor.
    // For a group target, "above" means above its first element. "below" means below its last element.
    const targetElIds = new Set(Node.collectDeepElements(targetNode).map(e => e.id));
    
    // Find indices of target elements in the remaining list
    const targetIndices = [];
    remainingElements.forEach((el, idx) => {
        if (targetElIds.has(el.id)) targetIndices.push(idx);
    });

    if (targetIndices.length === 0) {
        console.warn("LMX.moveNode: Target elements not found in view", targetNode);
        return;
    }

    const targetStart = Math.min(...targetIndices);
    const targetEnd = Math.max(...targetIndices);

    let insertIndex = -1;

    if (position === "above") {
        insertIndex = targetStart;
    } else if (position === "below") {
        insertIndex = targetEnd + 1;
    } else if (position === "into") {
        // "Into" usually implies becoming the top-most child of the group
        // In our Top-to-Bottom list, that means inserting just after the group start? 
        // Or actually, if we want to be "in" the group, we just need to be adjacent to its members
        // and adopt its group ID.
        // Visually, "into" creates a hierarchy. 
        // Let's Insert at top of target (targetStart) so it renders first in the group.
        insertIndex = targetStart; 
    }

    // Sanity check
    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > remainingElements.length) insertIndex = remainingElements.length;

    // 5. Update Hierarchy (Groups / Frames)
    // Determine target parent context
    let newGroupId = null;
    let newFrameId = null;

    if (position === "into") {
        // We are entering the target.
        // If target is Group: new parent is target.id
        // If target is Frame: new parent is target.id
        if (targetNode.type === "group") {
             // For groups, the ID in the node tree often has "group:" prefix or is just the raw ID
             // The raw group ID is needed. 
             // node.id for a group node is usually the group string.
             // But let's check the element's groupIds.
             // Actually, if I drop INTO a group, I should add that group's ID to my groupIds.
             newGroupId = targetNode.groupId || targetNode.id.replace("group:", "");
        } else if (targetNode.type === "frame") {
             newFrameId = targetNode.id;
        }
    } else {
        // "above" or "below": We adopt the parent of the target.
        newGroupId = targetNode.parentGroupId; // Might be null (root)
        newFrameId = targetNode.containerFrameId; // Might be null
    }

    // Apply updates to dragged elements
    draggedElements.forEach(el => {
        // GROUPS
        // If we are moving to a new group context:
        // 1. Remove old parent group ID (if it exists and is different)
        // 2. Add new parent group ID (if not present)
        // Note: Excalidraw elements can have multiple group IDs (nested). 
        // We assume we are changing the *immediate* parent.
        
        let gids = Array.isArray(el.groupIds) ? [...el.groupIds] : [];
        const oldParentId = draggedNode.parentGroupId;
        
        // Remove old parent if we are leaving it
        if (oldParentId && oldParentId !== newGroupId) {
            gids = gids.filter(g => g !== oldParentId);
        }
        
        // Add new parent if we are joining it
        if (newGroupId && !gids.includes(newGroupId)) {
            gids.push(newGroupId);
        }
        
        el.groupIds = gids;

        // FRAMES
        el.frameId = newFrameId;
    });

    // 6. Splice back together
    remainingElements.splice(insertIndex, 0, ...draggedElements);

    // 7. Save to Excalidraw
    // The list is currently Top-to-Bottom (Visual Order).
    // Excalidraw expects Bottom-to-Top (Z-Index Order).
    const finalExcalidrawOrder = remainingElements.reverse(); // Now index 0 is Back, N is Front.

    // We must pass these to EA.
    // ea.copyViewElementsToEAforEditing handles the heavy lifting, but we need to ensure local Z-index is correct?
    // Actually, simply deleting and re-adding, or just updating them in place?
    // Safest is to use `ea.copyViewElementsToEAforEditing` w/ updates, then maybe `addElementsToView`.
    // But reordering usually implies changing the array order.
    // `ea.setViewElements(finalExcalidrawOrder)` would be ideal if it existed.
    // Instead we delete all and re-add? No, that's destructive/slow.
    // We can use `ea.moveViewElementToZIndex` loop?
    
    // Better strategy:
    // 1. Copy modified elements (dragged) to EA to update their props (groups/frames).
    ea.copyViewElementsToEAforEditing(draggedElements);
    
    // 2. Update the view's element list order manually? 
    // EA doesn't have a direct "reorder all" helper that I recall, 
    // but `addElementsToView` typically appends. 
    // However, if we simply delete the dragged items and re-add them, they go to the top.
    // We need arbitrary order.
    
    // Let's try likely the most robust way available in this constrained environment:
    // Iterate and force move to Z.
    // But since we have the full list `finalExcalidrawOrder`, we know exactly where everyone belongs.
    // We can just set the elements array if we have access, but we don't directly.
    
    // WORKAROUND:
    // We will use `ea.copyViewElementsToEAforEditing` to update props.
    // Then we will use a loop of `ea.moveViewElementToZIndex`? No, that's O(N^2) potentially.
    // Actually, Excalidraw API `updateScene` takes `elements`.
    // We can use `ea.addElementsToView` with `reposition=false`?
    
    // Let's use `ea.getExcalidrawAPI().updateScene({ elements: finalExcalidrawOrder })`.
    // This is the direct API and is usually safe for reordering if we pass the full list.
    
    try {
        const api = ea.getExcalidrawAPI();
        if (api) {
            // Commit to history? No, updateScene handles it if we pass the flag.
             api.updateScene({ elements: finalExcalidrawOrder, commitToHistory: true });
        }
        
        // We also need to ensure EA's internal view elements are updated if we want to validly save stash?
        // Actually, updateScene updates the scene.
        // We might need to sync EA?
        ea.clear();
        ea.copyViewElementsToEAforEditing(finalExcalidrawOrder);
        // await ea.addElementsToView(false, true); // This might be redundant if updateScene works, but let's keep it for safety if updateScene is partial.
        // Actually, if we use updateScene, we shouldn't mix EA methods unless necessary.
        // But we DO need to update the hidden stash which relies on `newElements`.
        
        // Stash update
        const currentStash = getHiddenStash();
        const nextStash = { ...currentStash };
        
        // We need to update zIndex in stash for hidden elements
        finalExcalidrawOrder.forEach((el, idx) => {
            if (el && el.id && getLMX(el).hidden) {
                const zRank = idx;
                nextStash[el.id] = JSON.stringify({ ...el, isDeleted: true, zIndex: zRank });
            } else if (el && el.id && nextStash[el.id]) {
                delete nextStash[el.id];
            }
        });
        await saveHiddenStash(nextStash);

        // Select the dragged items
        if (api) {
             api.selectElements(Array.from(draggedIdSet).map(id => ({ id })));
        }

        // console.log("LMX REORDER SUCCESS");
        scheduleRefreshUI();
    } catch (err) {
        console.error("LMX.moveNode FAILED", err);
        new Notice("Move failed. See console.");
    }
  };




  // PATCH: ignore bound text for minimum count; still group it with its container
  const createGroupFromSelection = async () => {
    if (!hasActiveView()) return;

    const selected = ea.getViewSelectedElements?.() ?? [];
    const viewEls = ea.getViewElements?.() ?? [];
    const boundText = TreeBuilder.buildBoundTextIndex(viewEls);

    // Remove frames first
    const selectedNonFrames = selected.filter((el) => el?.type !== "frame");

    // Count “real” selectable items excluding bound text
    const primarySelection = selectedNonFrames.filter((el) => !boundText.isBoundText(el));

    if (primarySelection.length < 1) {
      new Notice("Select at least one object to add to a group.");
      return;
    }

    // Include bound text of selected containers
    const toGroupMap = new Map();
    for (const el of primarySelection) {
      if (!el?.id) continue;
      toGroupMap.set(el.id, el);
      const extras = boundText.getForContainer(el) ?? [];
      for (const t of extras) if (t?.id) toGroupMap.set(t.id, t);
    }

    // 1. Create a new Group ID
    const groupId = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const finalGroupName = "Group";
    const isNewGroup = true;

    const toGroupElements = Array.from(toGroupMap.values());
    
    // CONSOLIDATED TRANSACTION: Handle naming and group assignment in one go
    await withEAEdit(toGroupElements, ({ getEAElement }) => {
      for (const el of toGroupElements) {
        const eaEl = getEAElement(el.id);
        if (!eaEl) continue;

        // 1. If new group, set the metadata name
        if (isNewGroup && finalGroupName) {
          const lmx = getLMX(eaEl);
          const groupNames = { ...(lmx.groupNames ?? {}) };
          groupNames[groupId] = finalGroupName;
          setLMX(eaEl, { groupNames });
        }

        // 2. Add to group
        const gids = Array.isArray(eaEl.groupIds) ? [...eaEl.groupIds] : [];
        if (!gids.includes(groupId)) {
          gids.push(groupId);
          eaEl.groupIds = gids;
        }
      }
    });

    // 3. Ensure Z-Index Contiguity
    // Move all elements in the group to the position of the top-most element in the selection
    const sortedGroup = toGroupElements.slice().sort((a,b) => {
       return viewEls.findIndex(e => e.id === a.id) - viewEls.findIndex(e => e.id === b.id);
    });
    
    // Find the highest z-index among the group
    const maxZ = Math.max(...sortedGroup.map(el => viewEls.findIndex(e => e.id === el.id)));
    
    // Move them one by one to just below maxZ
    for (let i = sortedGroup.length - 1; i >= 0; i--) {
       ea.moveViewElementToZIndex(sortedGroup[i].id, maxZ);
    }

    ea.selectElementsInView(primarySelection.map((e) => e.id));
    STATE.expandedNodes.add(makeGroupNodeId(groupId));
    logger.log("createGroupFromSelection", { groupId, name: finalGroupName, count: toGroupElements.length });
    scheduleRefreshUI();
  };

  return { toggleVisibility, toggleLock, rename, commitRename, move, select, remove, duplicate, createGroupFromSelection, moveNode };
  })();

// -----------------------------------------------------------------------------
// 9) Render Context Helpers
// -----------------------------------------------------------------------------
const createTreeContext = () => {
  if (!hasActiveView()) return null;
  const api = ea.getExcalidrawAPI();
  const canvasElements = api?.getSceneElementsIncludingDeleted() ?? ea.getViewElements();
  const stashedData = getHiddenStash();
  
  const elementsMap = new Map();
  const orderIndex = new Map();
  
  canvasElements.forEach((el, idx) => {
    if (!el.isDeleted || !getLMX(el).hidden) {
       elementsMap.set(el.id, el);
    }
    orderIndex.set(el.id, idx);
  });

  for (const id in stashedData) {
    if (elementsMap.has(id) && !elementsMap.get(id).isDeleted) continue;
    try {
      const data = stashedData[id];
      const el = typeof data === "string" ? JSON.parse(data) : data;
      if (el && el.id) {
          el.isDeleted = false;
          elementsMap.set(el.id, el);
      }
    } catch (e) {}
  }

  const allElements = Array.from(elementsMap.values()).filter(el => !!el?.id);
  allElements.sort((a, b) => {
    // UNIFIED RANK (Preferred)
    const ra = getLMX(a).z;
    const rb = getLMX(b).z;
    if (typeof ra === "number" && typeof rb === "number") {
       if (ra !== rb) return rb - ra; // Top-to-Bottom (High rank is TOP)
    }

    // FALLBACK: Canvas order or historic stash Z
    const za = getLMX(a).hidden ? (a.zIndex ?? -1) : (orderIndex.get(a.id) ?? -1);
    const zb = getLMX(b).hidden ? (b.zIndex ?? -1) : (orderIndex.get(b.id) ?? -1);
    
    if (za !== zb) return zb - za; 
    return b.id.localeCompare(a.id);
  });

  return {
    elements: allElements,
    expandedNodes: STATE.expandedNodes,
    groupStrokes: !!settings[SETTING_GROUP_STROKES]?.value,
  };
};





const createRenderContext = (tree) => {
  const selectedIds = new Set((ea.getViewSelectedElements?.() ?? []).map((e) => e.id));
  const deepCache = new Map();
  const nodeIndex = new Map();
  const elementToNode = new Map();

  const getDeepElements = (node) => {
    if (!node?.id) return [];
    if (deepCache.has(node.id)) return deepCache.get(node.id);
    const deep = Node.collectDeepElements(node);
    deepCache.set(node.id, deep);
    return deep;
  };

  const walk = (nodes) => {
    for (const n of nodes ?? []) {
      if (n?.id) {
        nodeIndex.set(n.id, n);
        const deep = getDeepElements(n);
        for (const el of deep) {
            elementToNode.set(el.id, n);
        }
      }
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    }
  };
  walk(tree);

  return {
    selectedIds,
    getDeepElements,
    nodeIndex,
    elementToNode,
    icons: ICONS,
    ui: UI,
    state: STATE,
    settings,
    logger,
  };
};

// -----------------------------------------------------------------------------
// 10) UI Renderer
// -----------------------------------------------------------------------------
const LMXStyles = (() => {
  const STYLE_ID = "lmx-style-v2";
  const inject = (ownerWindow) => {
    const doc = ownerWindow?.document ?? document;
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --lmx-bg-translucent: rgba(var(--background-primary-rgb), 0.85);
        --lmx-accent: var(--interactive-accent);
        --lmx-accent-subtle: rgba(var(--interactive-accent-rgb), 0.15);
        --lmx-row-height: 34px;
        --lmx-border-radius: 6px;
        --lmx-font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .lmx-root {
        height: 100% !important;
        width: 100% !important;
        max-width: none !important;
        max-height: none !important;
        box-sizing: border-box !important;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 0 !important;
        margin: 0 !important;
        background-color: var(--lmx-bg-translucent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        font-family: var(--lmx-font-ui);
        color: var(--text-normal);
      }

      .lmx-header {
        flex-shrink: 0;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0;
        height: 48px;
        border-bottom: 1px solid var(--background-modifier-border);
        user-select: none;
        background: rgba(var(--background-secondary-rgb), 0.5);
      }

      .lmx-title {
        font-weight: 600;
        font-size: 14px;
        flex-grow: 1;
        cursor: move;
        letter-spacing: -0.01em;
      }

      .lmx-list {
        flex-grow: 1;
        overflow-y: overlay;
        overflow-x: hidden;
        padding: 0 !important;
        margin: 0 !important;
        display: block;
        position: relative;
        width: 100% !important;
        /* contain: strict removed to allow scrolling calc */
      }

      /* Virtualization Core */
      /* No-op spacers, relying on direct DOM manipulation in _renderVirtualSlice */

      /* Custom Scrollbar for WebKit */
      .lmx-list::-webkit-scrollbar { width: 6px; }
      .lmx-list::-webkit-scrollbar-track { background: transparent; }
      .lmx-list::-webkit-scrollbar-thumb {
        background-color: var(--scrollbar-thumb-bg);
        border-radius: 3px;
      }

      .lmx-footer {
        flex-shrink: 0;
        padding: 4px 6px;
        border-top: 1px solid var(--background-modifier-border);
        font-size: 11px;
        color: var(--text-muted);
        text-align: center;
        background: rgba(var(--background-secondary-rgb), 0.3);
      }

      /* Fix: Reset global Obsidian styles for clickable-icon to prevent "weird white background" */
      .lmx-root.clickable-icon:hover {
        background-color: var(--lmx-bg-translucent) !important;
        box-shadow: none !important;
        color: var(--text-normal) !important;
      }
      .lmx-root .clickable-icon:hover {
        background-color: transparent !important;
        box-shadow: none !important;
      }

      .lmx-row {
        display: flex; align-items: center;
        height: var(--lmx-row-height);
        padding: 0 !important;
        margin: 0 !important;
        cursor: pointer;
        user-select: none;
        box-sizing: border-box !important;
        width: 100% !important;
        font-size: 13px;
        border-radius: var(--lmx-border-radius);
        transition: background-color 0.15s ease;
        position: relative;
      }

      .lmx-row:hover {
        background-color: var(--background-modifier-hover);
      }

      .lmx-row[data-selected="1"] {
        background-color: var(--lmx-accent-subtle) !important;
        color: var(--text-normal);
      }
      
      /* Active border indicator for selection */
      .lmx-row[data-selected="1"]::before {
        content: "";
        position: absolute;
        left: 0; top: 4px; bottom: 4px;
        width: 3px;
        background-color: var(--lmx-accent);
        border-radius: 0 2px 2px 0;
      }

      .lmx-indent { flex-shrink: 0; width: 16px; height: 100%; display: inline-block;}
      /* Optional guide lines for hierarchy */
      /* .lmx-indent { border-right: 1px solid var(--background-modifier-border); opacity: 0.3; } */

      .lmx-toggle {
        width: 20px; height: 20px;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px;
        color: var(--text-muted);
        flex-shrink: 0;
        border-radius: 4px;
        transition: background-color 0.1s;
      }
      .lmx-toggle.can-toggle:hover {
        color: var(--text-normal);
      }

      .lmx-icon {
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        color: var(--text-muted);
        border-radius: 4px;
        flex-shrink: 0;
      }
      .lmx-icon svg { width: 14px; height: 14px; stroke-width: 2px; }
      .lmx-icon:hover {
        color: var(--text-accent-hover);
        opacity: 1 !important;
      }

      .lmx-header .lmx-icon { width: 28px; height: 28px; }
      .lmx-header .lmx-icon svg { width: 16px; height: 16px; }

      .lmx-type { margin-right: 6px; color: var(--text-muted); }
      
      .lmx-name {
        flex-grow: 1;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        padding-left: 4px;
        font-weight: 500;
        min-width: 0;
      }

      .lmx-name-input {
        flex-grow: 1;
        margin-left: 6px;
        font-size: 13px;
        padding: 4px 6px;
        border: 1px solid var(--interactive-accent);
        background-color: var(--background-primary);
        color: var(--text-normal);
        border-radius: 4px;
        outline: none;
      }

      .lmx-controls {
        display: flex; gap: 2px;
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        align-items: center;
        padding-right: 4px;
        background: linear-gradient(to right, transparent, var(--background-secondary) 20%);
        opacity: 0; /* Hidden by default */
        transition: opacity 0.1s ease;
      }
      
      .lmx-row:hover .lmx-controls,
      .lmx-row[data-selected="1"] .lmx-controls {
        opacity: 1;
      }

      /* Drag & Drop Indicators */
      .lmx-row.dragging { opacity: 0.3; }

      /* Drop Above */
      .lmx-row.drag-over-top {
        box-shadow: 0 -2px 0 var(--lmx-accent);
      }
      
      /* Drop Below */
      .lmx-row.drag-over-bottom {
        box-shadow: 0 2px 0 var(--lmx-accent);
      }

      /* Drop Into */
      .lmx-row.drag-over-into {
        background-color: var(--lmx-accent-subtle) !important;
        box-shadow: inset 0 0 0 2px var(--lmx-accent);
      }

      /* Resize Handles */
      .lmx-resize-handle {
        position: absolute;
        width: 16px; height: 16px;
        z-index: 2000;
        background: transparent;
      }
      .lmx-resize-nw { top: 0; left: 0; cursor: nwse-resize; }
      .lmx-resize-ne { top: 0; right: 0; cursor: nesw-resize; }
      .lmx-resize-sw { bottom: 0; left: 0; cursor: nesw-resize; }
      .lmx-resize-se { bottom: 0; right: 0; cursor: nwse-resize; }
    `;
    doc.head.appendChild(style);
  };
  return { inject };
})();

let _lmxInstance = null;

class LMXUIRenderer {
  constructor(modal) {
    this.modal = modal;
    this.headerEl = null;
    this.listEl = null;
    this.footerEl = null;
    this._scrollTop = 0;
    _lmxInstance = this;
    this._ctx = null;
    this._ownerWindow = null;
    this._onListClick = this._onListClick.bind(this);
    this._onListDblClick = this._onListDblClick.bind(this);
    this._onDragStart = this._onDragStart.bind(this);
    this._onDragOver = this._onDragOver.bind(this);
    this._onDragLeave = this._onDragLeave.bind(this);
    this._onDrop = this._onDrop.bind(this);
    this._draggedNodeId = null;

    // Virtualization State
    this._flatList = [];
    this._rowHeight = 34; // matches --lmx-row-height
    this._resizeObserver = null;
  }

  static getInstance() {
    return _lmxInstance;
  }


  setOwnerWindow(ownerWindow) { this._ownerWindow = ownerWindow ?? null; }

  _getOwnerWindow() {
    return (
      this._ownerWindow ??
      ea.targetView?.ownerWindow ??
      this.modal?.modalEl?.ownerDocument?.defaultView ??
      window
    );
  }

  mount() {
    const ownerWindow = this._getOwnerWindow();
    LMXStyles.inject(ownerWindow);
    this._ensureSkeleton();
    this._wireDelegatedEvents();
  }

  _ensureSkeleton() {
    const content = this.modal.contentEl;
    if (
      this.headerEl && this.headerEl.isConnected &&
      this.listEl && this.listEl.isConnected &&
      this.footerEl && this.footerEl.isConnected
    ) return;

    content.empty();
    content.classList.add("lmx-root");
    // CRITICAL: Adding clickable-icon to the root tells FloatingModal to ignore clicks here for dragging!
    content.classList.add("clickable-icon");

    const header = content.createDiv({ cls: "lmx-header lmx-drag-handle" });
    const title = header.createEl("div", { cls: "lmx-title", text: "Layer Manager" });
    
    // Enable drag on the entire header
    header.style.pointerEvents = "all";
    this._enableDrag(header);

    const btnRefresh = header.createEl("div", { cls: "clickable-icon lmx-icon" });
    btnRefresh.innerHTML = iconHTML(ICONS.REFRESH);
    btnRefresh.title = "Refresh";
    btnRefresh.onclick = (e) => { e.preventDefault(); e.stopPropagation(); scheduleRefreshUI(); };

    const btnAdd = header.createEl("div", { cls: "clickable-icon lmx-icon" });
    btnAdd.innerHTML = iconHTML(ICONS.PLUS) || "+";
    btnAdd.title = "Create group layer from current selection";
    btnAdd.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      Actions.createGroupFromSelection().catch((err) => {
        logger.error(err); new Notice("Create group failed. See console.");
      });
    };

    const btnSettings = header.createEl("div", { cls: "clickable-icon lmx-icon" });
    btnSettings.innerHTML = iconHTML(ICONS.SETTINGS);
    btnSettings.title = "Toggle stroke bucketing (Freedraw)";
    btnSettings.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this._toggleStrokeBucketing(); };

    const btnClose = header.createEl("div", { cls: "clickable-icon lmx-icon" });
    btnClose.innerHTML = iconHTML(ICONS.CLOSE);
    btnClose.title = "Close";
    btnClose.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.modal.close(); };

    const list = content.createDiv({ cls: "lmx-list" });
    // BRUTE FORCE STYLES: Ensure list is scrollable and positioned
    list.style.cssText = "flex-grow:1; position:relative; overflow-y:overlay; overflow-x:hidden; display:block; height:100%; width:100% !important; padding:0 !important; margin:0 !important;";

    list.addEventListener("scroll", () => {
        this._scrollTop = list.scrollTop;
        if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
        this._animationFrameId = requestAnimationFrame(() => this._renderVirtualSlice());
    }, { passive: true });

    const footer = content.createDiv({ cls: "lmx-footer" });
    this.debugEl = footer.createDiv({ cls: "lmx-debug" });

    this.headerEl = header;
    this.listEl = list;
    this.footerEl = footer;
  }

  _wireDelegatedEvents() {
    if (!this.listEl) return;
    this.listEl.removeEventListener("dblclick", this._onListDblClick, true);
    this.listEl.removeEventListener("click", this._onListClick, true);
    this.listEl.addEventListener("click", this._onListClick, true);
    this.listEl.addEventListener("dblclick", this._onListDblClick, true);
    
    // Drag and Drop listeners
    this.listEl.removeEventListener("dragstart", this._onDragStart);
    this.listEl.removeEventListener("dragover", this._onDragOver);
    this.listEl.removeEventListener("dragleave", this._onDragLeave);
    this.listEl.removeEventListener("drop", this._onDrop);

    this.listEl.addEventListener("dragstart", this._onDragStart);
    this.listEl.addEventListener("dragover", this._onDragOver);
    this.listEl.addEventListener("dragleave", this._onDragLeave);
    this.listEl.addEventListener("drop", this._onDrop);

    // Stop pointerdown propagation to prevent FloatingModal from initiating window drag
    // when interacting with the list (e.g. selecting rows, dragging items)
    this.listEl.addEventListener("pointerdown", (e) => e.stopPropagation());

    // RESIZE OBSERVER: Detect when modal attaches and gains height
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target === this.listEl) {
                if (this.listEl.clientHeight > 0) {
                     // console.log("LMX: Resize detected", this.listEl.clientHeight);
                     requestAnimationFrame(() => this._renderVirtualSlice());
                }
            }
        }
    });
    this._resizeObserver.observe(this.listEl);
  }

  _toggleStrokeBucketing() {
    const v = !!settings[SETTING_GROUP_STROKES].value;
    settings[SETTING_GROUP_STROKES].value = !v;
    ea.setScriptSettings(settings);
    new Notice(`Stroke bucketing: ${!v ? "ON" : "OFF"}`);
    scheduleRefreshUI();
  }

  _enableDrag(handleEl) {
    const ownerWindow = this._getOwnerWindow();
    const modalEl = this.modal.modalEl;

    handleEl.style.cursor = "move";

    const startDrag = (e) => {
      // Allow interacting with buttons inside the header
      // FIX: Use .lmx-icon to avoid matching the parent container which has .clickable-icon
      if (e.target.closest(".lmx-icon, button, input")) return;

      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = modalEl.offsetLeft;
      const startTop = modalEl.offsetTop;

      const onMove = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        const dx = evt.clientX - startX;
        const dy = evt.clientY - startY;
        modalEl.style.left = `${startLeft + dx}px`;
        modalEl.style.top = `${startTop + dy}px`;
      };

      const onUp = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        ownerWindow.removeEventListener("pointermove", onMove, true);
        ownerWindow.removeEventListener("pointerup", onUp, true);
        
        // Save position
        settings[SETTING_KEY_X].value = Math.round(modalEl.offsetLeft);
        settings[SETTING_KEY_Y].value = Math.round(modalEl.offsetTop);
        ea.setScriptSettings(settings);
      };

      ownerWindow.addEventListener("pointermove", onMove, true);
      ownerWindow.addEventListener("pointerup", onUp, true);
    };

    handleEl.addEventListener("pointerdown", startDrag, true);
  }

  _setSelectedRow(rowEl) {
    if (this._selectedRowEl && this._selectedRowEl.isConnected && this._selectedRowEl !== rowEl) {
      this._selectedRowEl.dataset.selected = "0";
    }
    this._selectedRowEl = rowEl;
    if (rowEl) rowEl.dataset.selected = "1";
  }

  _getNodeFromEvent(evt) {
    const row = evt.target?.closest?.(".lmx-row");
    if (!row) return { row: null, node: null };
    const nodeId = row.dataset.nodeId;
    const node = this._ctx?.nodeIndex?.get?.(nodeId) ?? null;
    return { row, node };
  }

  _onDragStart(evt) {
    const { row, node } = this._getNodeFromEvent(evt);
    if (!row || !node) {
        evt.preventDefault();
        return;
    }
    this._draggedNodeId = node.id;
    row.classList.add("dragging");
    // Required for Firefox
    evt.dataTransfer.effectAllowed = "move";
    evt.dataTransfer.setData("text/plain", node.id);
  }

  _onDragOver(evt) {
    evt.preventDefault();
    const { row, node } = this._getNodeFromEvent(evt);
    if (!row || !node) return;
    
    // Don't allowing dropping on self or children (if we had improved hierarchy logic)
    if (node.id === this._draggedNodeId) return;

    const rect = row.getBoundingClientRect();
    const canAcceptChildren = ["group", "frame", "bucket"].includes(node.type);
    
    // Choose zone thresholds: 1/3 for containers, 1/2 for elements
    const topThreshold = canAcceptChildren ? rect.height / 3 : rect.height / 2;
    const bottomThreshold = canAcceptChildren ? (rect.height * 2) / 3 : rect.height / 2;
    const offset = evt.clientY - rect.top;
    
    // Remove existing classes from all rows (costly? maybe scope to virtual set)
    // Optimization: Only clear classes on rows that have them, or just rely on this event loop.
    this.listEl.querySelectorAll(".drag-over-top, .drag-over-bottom, .drag-over-into").forEach(el => {
        if (el !== row) {
            el.classList.remove("drag-over-top", "drag-over-bottom", "drag-over-into");
        }
    });

    if (offset < topThreshold) {
        row.classList.remove("drag-over-bottom", "drag-over-into");
        row.classList.add("drag-over-top");
    } else if (offset > bottomThreshold) {
        row.classList.remove("drag-over-top", "drag-over-into");
        row.classList.add("drag-over-bottom");
    } else if (canAcceptChildren) {
        row.classList.remove("drag-over-top", "drag-over-bottom");
        row.classList.add("drag-over-into");
    }
  }

  _onDragLeave(evt) {
    const { row } = this._getNodeFromEvent(evt);
    if (row) {
        row.classList.remove("drag-over-top", "drag-over-bottom", "drag-over-into");
    }
  }


  async _onDrop(evt) {
    evt.preventDefault();
    const { row, node } = this._getNodeFromEvent(evt);
    
    // Cleanup visuals
    this.listEl.querySelectorAll(".drag-over-top, .drag-over-bottom, .drag-over-into").forEach(el => {
        el.classList.remove("drag-over-top", "drag-over-bottom", "drag-over-into");
    });
    this.listEl.querySelectorAll(".dragging").forEach(el => el.classList.remove("dragging"));

    if (!row || !node || !this._draggedNodeId) return;
    if (node.id === this._draggedNodeId) return;

    const rect = row.getBoundingClientRect();
    const canAcceptChildren = ["group", "frame", "bucket"].includes(node.type);
    const topThreshold = canAcceptChildren ? rect.height / 3 : rect.height / 2;
    const bottomThreshold = canAcceptChildren ? (rect.height * 2) / 3 : rect.height / 2;
    const offset = evt.clientY - rect.top;
    
    let position = "into";
    if (offset < topThreshold) position = "above";
    else if (offset > bottomThreshold) position = "below";
    else if (!canAcceptChildren) position = "above"; // Fallback to above for elements if somehow middle hit
    
    const draggedNode = this._ctx.nodeIndex.get(this._draggedNodeId);
    if (draggedNode) {
        await Actions.moveNode(draggedNode, node, position);
    }
    this._draggedNodeId = null;
  }

  async _onListClick(evt) {
    if (!this._ctx) return;
    const { row, node } = this._getNodeFromEvent(evt);
    if (!row || !node) return;

    const actionEl = evt.target?.closest?.("[data-action]");
    evt.preventDefault();
    evt.stopPropagation();

    if (actionEl) {
      const action = actionEl.dataset.action;
      try {
        switch (action) {
          case "toggle": {
            const id = node.id;
            if (STATE.expandedNodes.has(id)) STATE.expandedNodes.delete(id);
            else STATE.expandedNodes.add(id);
            scheduleRefreshUI();
            return;
          }
          case "visibility": await Actions.toggleVisibility(node); return;
          case "lock": await Actions.toggleLock(node); return;
          case "move-up": await Actions.move(node, -1); return; // Inverted per user request
          case "move-down": await Actions.move(node, 1); return; // Inverted per user request
          case "more": {
            const options = ["Rename", "Duplicate", "Delete"];
            const choices = ["rename", "duplicate", "delete"];
            const choice = await suggester(options, choices);
            if (!choice) return;
            
            switch(choice) {
              case "rename": Actions.rename(node); break;
              case "duplicate": await Actions.duplicate(node); break;
              case "delete": await Actions.remove(node); break;
            }
            return;
          }
          default: return;
        }
      } catch (err) {
        logger.error(err);
        new Notice("Action failed. See console.");
        return;
      }
    }

    const isMulti = evt.metaKey || evt.ctrlKey || evt.shiftKey;
    Actions.select(node, { refreshUI: false, toggle: isMulti });
    
    // Optimistic UI update for the clicked row
    // (Actual state sync happens on next scheduled refresh)
    if (!isMulti) {
       // Clear others if not multi-select
       const all = this.listEl.querySelectorAll('.lmx-row[data-selected="1"]');
       all.forEach(el => el.dataset.selected = "0");
       this._setSelectedRow(row);
    } else {
       // Toggle visual state roughly (can be wrong if partial, but fixed next frame)
       const isSel = row.dataset.selected === "1";
       row.dataset.selected = isSel ? "0" : "1";
    }
  }

  async _onListDblClick(evt) {
    if (!this._ctx) return;
    // Allow double clicking specifically on the name or the row background
    const { row, node } = this._getNodeFromEvent(evt);
    if (!row || !node) return;
    
    // Ignore double clicks on icons/controls
    const onIcon = evt.target?.closest?.(".clickable-icon");
    if (onIcon) return;
    
    evt.preventDefault();
    evt.stopPropagation();
    Actions.rename(node);
  }

  async _onNameKeyDown(evt, node) {
    if (evt.key === "Enter") {
      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation(); // Ensure no other handlers catch this
      // Commit explicitly
      await Actions.commitRename(node, evt.target.value);
    } else if (evt.key === "Escape") {
      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation();
      STATE.editingNodeId = null;
      scheduleRefreshUI();
    }
  }

  async _onNameBlur(evt, node) {
    if (STATE.editingNodeId === node.id) {
      await Actions.commitRename(node, evt.target.value);
    }
  }

  // --- Virtualization Helpers ---

  // Flatten tree into a list of visible nodes (respecting expanded state)
  _flattenTree(nodes, level = 0, result = []) {
    if (level === 0) ; // console.log("LMX: start flatten", nodes?.length);
    for (const node of nodes) {
      result.push({ node, level });
      if (node.isExpanded && node.children && node.children.length > 0) {
        this._flattenTree(node.children, level + 1, result);
      }
    }
    return result;
  }

  async render(tree) {
    this.mount();
    const list = this.listEl;
    if (!list) return;

    // ROBUST VIRTUALIZATION
    // 1. Initial render is SYNCHRONOUS (guarantees visibility).
    // 2. Scroll updates are ASYNC (performance).
    
    this._ctx = createRenderContext(tree);
    this._flatList = this._flattenTree(tree);
    
    if (this.footerEl) {
       this.footerEl.innerText = hasActiveView() ? `${ea.getViewElements().length} objects` : "";
    }

    this._rowHeight = 28; 

    // FORCE SYNCHRONOUS RENDER on first load
    this._renderVirtualSlice(true);
  }

  _renderVirtualSlice(forceSync = false) {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    
    const renderLogic = () => {
        if (!this.listEl || !this._flatList.length) {
            if (this.listEl) this.listEl.replaceChildren();
            return;
        }

        const list = this.listEl;
        const scrollTop = list.scrollTop;
        // Fallback to 500px if clientHeight is 0 (detached/hidden) to ensure we render SOMETHING
        const viewportHeight = list.clientHeight || 500;
        
        const startIdx = Math.floor(scrollTop / this._rowHeight);
        const endIdx = Math.ceil((scrollTop + viewportHeight) / this._rowHeight);
        
        const buffer = 5;
        const safeStart = Math.max(0, startIdx - buffer);
        const safeEnd = Math.min(this._flatList.length, endIdx + buffer);
        
        const slice = this._flatList.slice(safeStart, safeEnd);
        const topHeight = safeStart * this._rowHeight;
        const bottomHeight = (this._flatList.length - safeEnd) * this._rowHeight;
        
        // DOM Assembly
        const fragment = document.createDocumentFragment();

        // 1. Top Spacer
        if (topHeight > 0) {
            const topSpacer = document.createElement("div");
            topSpacer.style.height = `${topHeight}px`;
            topSpacer.style.width = "1px";
            fragment.appendChild(topSpacer);
        }
        
        // 2. Rows
        const ctx = this._ctx;
        const isNodeSelected = (node) => ctx.getDeepElements(node).some((el) => el?.id && ctx.selectedIds.has(el.id));
        const isNodeVisible = (node) => ctx.getDeepElements(node).every((el) => !normHidden(el));
        const isNodeLocked = (node) => ctx.getDeepElements(node).every((el) => normLocked(el));

        for (const item of slice) {
            this._renderRow(fragment, item.node, item.level, isNodeSelected, isNodeVisible, isNodeLocked);
        }
        
        // 3. Bottom Spacer
        if (bottomHeight > 0) {
            const bottomSpacer = document.createElement("div");
            bottomSpacer.style.height = `${bottomHeight}px`;
            bottomSpacer.style.width = "1px";
            fragment.appendChild(bottomSpacer);
        }

        list.replaceChildren(fragment);
        
        // DEBUG
        if (forceSync) ; // console.log("LMX: SYNC Render Complete", slice.length);
    };

    if (forceSync) {
        renderLogic();
    } else {
        this._rafId = requestAnimationFrame(renderLogic);
    }
  }

  _renderRow(container, node, level, isNodeSelected, isNodeVisible, isNodeLocked) {
        const row = container.createDiv({ cls: "lmx-row" });
        // STYLING: Compact, Responsive, High Performance
        // flex-shrink: 0 is CRITICAL to prevent squashing in flex containers
        row.style.cssText = `
            display: flex; 
            position: relative; /* CRITICAL for absolute controls */
            align-items: center;  
            height: ${this._rowHeight}px; 
            width: 100%; 
            padding: 0; 
            box-sizing: border-box;
            color: var(--text-normal);
            border-bottom: 1px solid rgba(var(--text-normal-rgb), 0.05);
            flex-shrink: 0; 
            contain: content; /* Performance optimization */
        `;
        
        if (isNodeSelected(node)) {
            row.style.backgroundColor = "var(--interactive-accent-opacity)";
        }
        
        row.draggable = true; 
        row.dataset.nodeId = node.id;
        row.dataset.selected = isNodeSelected(node) ? "1" : "0";

        // Indent
        if (level > 0) {
          const indent = row.createSpan({ cls: "lmx-indent" });
          indent.style.width = `${level * 12}px`; // Slightly tighter indent
          indent.style.flexShrink = "0";
        }

        // Toggle
        const canToggle = !!node.canExpand || ((node.children?.length ?? 0) > 0);
        const toggle = row.createDiv({ cls: "lmx-toggle" });
        toggle.style.flexShrink = "0";
        toggle.style.width = "20px";
        toggle.style.textAlign = "center";
        toggle.style.cursor = "pointer";
        if (canToggle) {
          toggle.classList.add("can-toggle", "clickable-icon");
          toggle.dataset.action = "toggle";
          toggle.innerText = node.isExpanded ? "▾" : "▸";
        } else toggle.innerText = "";

        // Visibility / Lock Controls (Left side for quick access)
        const visible = isNodeVisible(node);
        const eye = row.createDiv({ cls: "clickable-icon lmx-icon" });
        eye.dataset.action = "visibility";
        eye.innerHTML = iconHTML(visible ? ICONS.EYE : ICONS.EYE_OFF);
        eye.style.opacity = visible ? "0.7" : "0.3";
        eye.style.flexShrink = "0";
        eye.style.width = "24px";

        const locked = isNodeLocked(node);
        const lock = row.createDiv({ cls: "clickable-icon lmx-icon" });
        lock.dataset.action = "lock";
        lock.innerHTML = iconHTML(locked ? ICONS.LOCK : ICONS.UNLOCK);
        lock.style.opacity = locked ? "0.8" : "0.2";
        lock.style.flexShrink = "0";
        lock.style.width = "24px";

        // Type Icon
        const type = row.createDiv({ cls: "lmx-type" });
        type.innerHTML = iconHTML(getTypeIcon(node.type));
        type.style.flexShrink = "0";
        type.style.width = "24px";
        type.style.marginLeft = "4px";

        // Name (Responsive Flex Grow)
        if (STATE.editingNodeId === node.id) {
          const input = row.createEl("input", {
            cls: "lmx-name-input",
            value: Naming.getRenameSeed(node),
          });
          input.style.flex = "1 1 auto";
          input.style.minWidth = "0"; // CSS Flexbox truncate fix
          input.focus();
          input.select();
          input.select();
          // Use keyup/keydown carefully. Keydown is better for preventing default Enter behavior.
          input.addEventListener("keydown", (e) => this._onNameKeyDown(e, node));
          input.addEventListener("blur", (e) => this._onNameBlur(e, node));
          input.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); });
          input.addEventListener("dblclick", (e) => { e.stopPropagation(); e.preventDefault(); });
        } else {
          const name = row.createDiv({ cls: "lmx-name" });
          name.innerText = Naming.getNodeDisplayName(node);
          name.style.flex = "1 1 auto";
          name.style.minWidth = "0";
          name.style.whiteSpace = "nowrap";
          name.style.overflow = "hidden";
          name.style.textOverflow = "ellipsis";
          name.style.paddingLeft = "8px";
          name.style.textOverflow = "ellipsis";
          name.style.paddingLeft = "8px";
          name.style.fontSize = "12px"; // UX: Better readability
          name.addEventListener("dblclick", (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              Actions.rename(node);
          });
        }

        // Action Controls (Right side - Absolute Positioning)
        const controls = row.createDiv({ cls: "lmx-controls" });
        // INLINE FORCE: CSS classes are proving unreliable, so we force position here.
        controls.style.cssText = `
            display: flex;
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            align-items: center;
            padding-right: 4px;
            background: linear-gradient(90deg, transparent, var(--background-primary) 20%);
            gap: 2px;
            z-index: 10;
        `;
        
        // Only show controls on hover or if selected (CSS handled usually, but we inline for safety)
        // For now, simpler: opacity 0.4
        const moveUp = controls.createDiv({ cls: "clickable-icon lmx-icon" });
        moveUp.dataset.action = "move-up";
        moveUp.innerHTML = iconHTML(ICONS.ARROW_UP);
        moveUp.style.opacity = "0.4";

        const moveDown = controls.createDiv({ cls: "clickable-icon lmx-icon" });
        moveDown.dataset.action = "move-down";
        moveDown.innerHTML = iconHTML(ICONS.ARROW_DOWN);
        moveDown.style.opacity = "0.4";

        const more = controls.createDiv({ cls: "clickable-icon lmx-icon" });
        more.dataset.action = "more";
        more.innerHTML = iconHTML(ICONS.MORE_VERTICAL);
        more.style.opacity = "0.6";
  }


}

// -----------------------------------------------------------------------------
// 11) App (modal lifecycle + auto refresh)
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// 11) App (modal lifecycle + auto refresh)
// -----------------------------------------------------------------------------

class FloatingModal {
  constructor(app) {
    this.app = app;
    // Defensive Scope creation
    try {
        if (ea.obsidian && this.app && this.app.scope) {
             this.scope = new ea.obsidian.Scope(this.app.scope);
        } else {
             this.scope = null;
             console.warn("[LMX] ea.obsidian or app.scope missing");
        }
    } catch (e) {
        console.error("[LMX] Scope creation failed", e);
        this.scope = null;
    }

    this.containerEl = document.createElement("div");
    this.modalEl = document.createElement("div");
    this.containerEl.appendChild(this.modalEl);
    this.contentEl = document.createElement("div");
    this.modalEl.appendChild(this.contentEl);
    
    this.modalEl.className = "lmx-modal";
    this.contentEl.className = "lmx-modal-content";
    
    // Ensure content fills the modal (critical for internal scrolling)
    this.contentEl.style.flex = "1 1 auto";
    this.contentEl.style.minHeight = "0";
    this.contentEl.style.display = "flex";
    this.contentEl.style.flexDirection = "column";
    this.contentEl.style.padding = "0";
    this.contentEl.style.margin = "0";
    this.contentEl.style.width = "100%";
    this.contentEl.style.height = "100%";
    this.contentEl.style.boxSizing = "border-box";

    // Default styles for the modal box (will be overridden/positioned by app logic)
    // But we need some baseline so it's not invisible
    this.modalEl.style.position = "absolute";
    this.modalEl.style.zIndex = "100";
    this.modalEl.style.background = "var(--background-primary)"; // Explicit background
    this.modalEl.style.border = "1px solid var(--background-modifier-border)";
  }

  open() {
    // We don't attach automatically; the app logic handles attachment to view/body
    if (this.onOpen) this.onOpen();
  }

  close() {
    if (this.onClose) this.onClose();
    this.containerEl.remove();
    this.scope = null;
  }
}

class LayerManagerApp {
  constructor() {
    const obApp = ea.plugin?.app ?? app;
    this.modal = new FloatingModal(obApp);
    this.renderer = new LMXUIRenderer(this.modal);
    this.refreshHandler = null;

    this.ownerWindow = null;
    this._listenerWindow = null;

    this.modal.onOpen = () => {
      this.ownerWindow =
        ea.targetView?.ownerWindow ??
        this.modal?.modalEl?.ownerDocument?.defaultView ??
        window;

      // Prevent Esc from closing the modal (so it can be used for canvas deselect)
      if (this.modal.scope) {
        this.modal.scope.register([], "Esc", (e) => {
           e.preventDefault(); 
           return false;
        });
      }

      // Hack: FloatingModal adds a capture-phase keydown listener that closes on Esc.
      // We must remove it to allow Esc to pass through (or correspond to Deselect).
      // It is added in a setTimeout(0), so we use a slightly longer timeout.
      setTimeout(() => {
        if (this.modal.escListener) {
           const doc = this.modal.modalEl?.ownerDocument ?? document;
           doc.removeEventListener("keydown", this.modal.escListener, { capture: true });
           // Also remove from our cached ownerWindow
           this.ownerWindow.document.removeEventListener("keydown", this.modal.escListener, { capture: true });
        }
      }, 50);

      this._listenerWindow = this.ownerWindow;
      this.renderer.setOwnerWindow(this.ownerWindow);

      const modalEl = this.modal.modalEl;
      const contentEl = ea.targetView?.contentEl;

      // Force bottom-right positioning after a short delay
      setTimeout(() => {
        // REPARENTING: Attach to Excalidraw view if available
        if (contentEl && this.modal.containerEl) {
          contentEl.appendChild(this.modal.containerEl);
          this.modal.containerEl.style.position = "absolute";
          this.modal.containerEl.style.zIndex = "5"; // Above canvas
          this.modal.containerEl.style.top = "0";
          this.modal.containerEl.style.left = "0";
          this.modal.containerEl.style.width = "100%";
          this.modal.containerEl.style.height = "100%";
          this.modal.containerEl.style.pointerEvents = "none"; // Let clicks pass through container
        
          // RESIZE OBSERVER: Keep modal within bounds & anchor to sides
          let prevParentRect = null;

          this.resizeObserver = new ResizeObserver((entries) => {
             for (const entry of entries) {
               if (!modalEl) continue;
               const parentRect = entry.contentRect;
               
               // First run or valid update
               if (!prevParentRect) {
                  prevParentRect = parentRect;
                  // Just apply constraints
                  modalEl.style.maxHeight = `${parentRect.height - 20}px`;
                  modalEl.style.maxWidth = `${parentRect.width - 20}px`;
                  return;
               }

               const dW = parentRect.width - prevParentRect.width;
               const dH = parentRect.height - prevParentRect.height;
               
               const currentLeft = modalEl.offsetLeft;
               const currentTop = modalEl.offsetTop;
               const currentW = modalEl.offsetWidth;
               const currentH = modalEl.offsetHeight;

               let nextLeft = currentLeft;
               let nextTop = currentTop;

               // Smart Anchor Logic:
               // If we are in the right half, stick to right.
               // If we are in the bottom half, stick to bottom.
               const midX = currentLeft + (currentW / 2);
               const midY = currentTop + (currentH / 2);
               
               if (midX > prevParentRect.width / 2) {
                  nextLeft += dW;
               }
               
               if (midY > prevParentRect.height / 2) {
                  nextTop += dH;
               }

               // Clamp (Safety Net)
               // Clamp Right
               if (nextLeft + currentW > parentRect.width) {
                  nextLeft = Math.max(0, parentRect.width - currentW - 10);
               }
               // Clamp Bottom
               if (nextTop + currentH > parentRect.height) {
                  nextTop = Math.max(0, parentRect.height - currentH - 10);
               }
               
               // Clamp Left/Top (0)
               if (nextLeft < 0) nextLeft = 0;
               if (nextTop < 0) nextTop = 0;

               if (nextLeft !== currentLeft || nextTop !== currentTop) {
                  modalEl.style.left = `${nextLeft}px`;
                  modalEl.style.top = `${nextTop}px`;
               }
               
               // Constraints
               modalEl.style.maxHeight = `${parentRect.height - 20}px`;
               modalEl.style.maxWidth = `${parentRect.width - 20}px`;
               
               prevParentRect = parentRect;
             }
          });
          this.resizeObserver.observe(contentEl);
        }

        const win = this.ownerWindow ?? window;
        const w = parseInt(settings[SETTING_KEY_W].value, 10) || 350;
        const h = parseInt(settings[SETTING_KEY_H].value, 10) || 500;
        
        // If attached to contentEl, use its bounds. If not, use window.
        const parentRect = contentEl ? contentEl.getBoundingClientRect() : { width: win.innerWidth, height: win.innerHeight };
        const winW = parentRect.width;
        const winH = parentRect.height;
        
        const x = winW - w - 40; // 40px padding from right
        const y = winH - h - 40; // 40px padding from bottom

        if (modalEl) {
          modalEl.style.position = "absolute";
          modalEl.style.margin = "0";
          modalEl.style.transform = "none";
          modalEl.style.left = `${Math.max(0, x)}px`;
          modalEl.style.top = `${Math.max(0, y)}px`;
          modalEl.style.width = `${w}px`;
          modalEl.style.height = `${h}px`;
          modalEl.style.display = "flex";
          modalEl.style.flexDirection = "column";
          modalEl.style.alignItems = "stretch"; /* CRITICAL: Ensure children stretch */
          modalEl.style.justifyContent = "stretch";
          modalEl.style.padding = "0";
          modalEl.style.overflow = "hidden"; /* Hide overflow from handles if they were outside, but now they are inside so this is safe/good */
          modalEl.style.resize = "none";     // Disable default resize
          modalEl.style.pointerEvents = "auto"; // Re-enable pointer events for the modal itself
          
          modalEl.style.zIndex = "95";
          modalEl.style.backgroundColor = "var(--background-primary)";
          modalEl.style.border = "1px solid var(--background-modifier-border)";
          modalEl.style.boxShadow = "var(--shadow-l)";
          modalEl.style.boxSizing = "border-box"; /* Ensure border doesn't add to width */
          
          this.hideNativeCloseButton(modalEl);
          this._enableCustomResize(modalEl);
        }
      }, 100);

      this.renderer.mount();
      
      // BLOCK native dragging/jumping by stopping propagation on the content wrapper
      if (this.renderer.listEl) {
         // We do this on the root element injected into contentEl
         const root = this.modal.contentEl.querySelector(".lmx-root");
         if (root) {
            root.addEventListener("pointerdown", (e) => e.stopPropagation());
         }
      }

      const ctx = createTreeContext();
      const tree = TreeBuilder.buildLayerTree(ctx);
      this.render(tree);

      this.setupAutoRefresh();
    };

    this.modal.onClose = () => this.cleanup();
  }

  _enableCustomResize(modalEl) {
    const directions = ["nw", "ne", "sw", "se"];
    const ownerWindow = this.ownerWindow ?? window;
    
    // Cleanup old handles
    modalEl.querySelectorAll(".lmx-resize-handle").forEach(el => el.remove());

    directions.forEach(dir => {
        // Adding clickable-icon class to handles to trick FloatingModal into ignoring them for drag
        const handle = modalEl.createDiv({ cls: `lmx-resize-handle lmx-resize-${dir} clickable-icon` });
        
        handle.addEventListener("pointerdown", (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation(); // BLOCK FloatModal drag
            e.stopImmediatePropagation();

            const startX = e.clientX;
            const startY = e.clientY;
            
            const startLeft = modalEl.offsetLeft;
            const startTop = modalEl.offsetTop;
            const startW = modalEl.offsetWidth;
            const startH = modalEl.offsetHeight;

            const onMove = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                
                const dx = evt.clientX - startX;
                const dy = evt.clientY - startY;
                
                let newLeft = startLeft;
                let newTop = startTop;
                let newW = startW;
                let newH = startH;

                if (dir.includes("e")) newW = Math.max(150, startW + dx);
                if (dir.includes("w")) {
                     const limit = startW - 150;
                     const clampedDx = Math.min(dx, limit);
                     newW = startW - clampedDx;
                     newLeft = startLeft + clampedDx;
                }
                if (dir.includes("s")) newH = Math.max(150, startH + dy);
                if (dir.includes("n")) {
                     const limit = startH - 150;
                     const clampedDy = Math.min(dy, limit);
                     newH = startH - clampedDy;
                     newTop = startTop + clampedDy;
                }

                modalEl.style.left = `${newLeft}px`;
                modalEl.style.top = `${newTop}px`;
                modalEl.style.width = `${newW}px`;
                modalEl.style.height = `${newH}px`;
                
                settings[SETTING_KEY_X].value = Math.round(newLeft);
                settings[SETTING_KEY_Y].value = Math.round(newTop);
                settings[SETTING_KEY_W].value = Math.round(newW);
                settings[SETTING_KEY_H].value = Math.round(newH);
            };
            
            const onUp = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                ownerWindow.removeEventListener("pointermove", onMove, true);
                ownerWindow.removeEventListener("pointerup", onUp, true);
                ea.setScriptSettings(settings); // Persist on release
            };

            ownerWindow.addEventListener("pointermove", onMove, true);
            ownerWindow.addEventListener("pointerup", onUp, true);
        });
    });
  }

  hideNativeCloseButton(modalEl) {
    const btn = modalEl.querySelector(".modal-close-button");
    if (btn) btn.style.display = "none";
    const aria = modalEl.querySelector('button[aria-label="Close"]');
    if (aria) aria.style.display = "none";
  }

  open() { this.modal.open(); }

  async render(tree) { await this.renderer.render(tree); }

  setupAutoRefresh() {
    const ownerWindow = this.ownerWindow ?? ea.targetView?.ownerWindow ?? window;
    this._listenerWindow = ownerWindow;

    const eventCameFromModal = (evt) => {
      const modalEl = this.modal?.modalEl;
      if (!modalEl) return false;
      const path = typeof evt.composedPath === "function" ? evt.composedPath() : null;
      if (Array.isArray(path) && path.includes(modalEl)) return true;
      const t = evt.target;
      return !!(t && modalEl.contains(t));
    };

    if (this.refreshHandler) {
      ownerWindow.removeEventListener("pointerup", this.refreshHandler, true);
      ownerWindow.removeEventListener("keyup", this.refreshHandler, true);
    }

    this.refreshHandler = (evt) => {
      if (!STATE.autoRefresh) return;

      if (!hasActiveView()) {
        try { this.modal?.close?.(); } catch (_) {}
        return;
      }

      if (STATE.promptOpen) return;
      if (Date.now() < (STATE.suppressAutoRefreshUntil || 0)) return;
      if (eventCameFromModal(evt)) return;

      scheduleRefreshUI();
    };

    ownerWindow.addEventListener("pointerup", this.refreshHandler, true);
    ownerWindow.addEventListener("keyup", this.refreshHandler, true);
  }

  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    const modalEl = this.modal?.modalEl;
    if (modalEl) {
      const rect = modalEl.getBoundingClientRect();
      if (rect.width > 80 && rect.height > 80) {
        settings[SETTING_KEY_X].value = Math.round(rect.left);
        settings[SETTING_KEY_Y].value = Math.round(rect.top);
        settings[SETTING_KEY_W].value = Math.round(rect.width);
        settings[SETTING_KEY_H].value = Math.round(rect.height);
        ea.setScriptSettings(settings);
      }
    }

    const ownerWindow =
      this._listenerWindow ??
      this.ownerWindow ??
      ea.targetView?.ownerWindow ??
      window;

    if (this.refreshHandler) {
      ownerWindow.removeEventListener("pointerup", this.refreshHandler, true);
      ownerWindow.removeEventListener("keyup", this.refreshHandler, true);
    }

    this.refreshHandler = null;
    this._listenerWindow = null;
    this.ownerWindow = null;

    window.excalidrawLayerManager = null;
  }
}

// -----------------------------------------------------------------------------
// 12) Execution
// -----------------------------------------------------------------------------
if (window.excalidrawLayerManager) {
  try { window.excalidrawLayerManager.modal.close(); } catch (_) {}
}
try {
    window.excalidrawLayerManager = new LayerManagerApp();
    window.excalidrawLayerManager.open();
} catch (error) {
    new Notice("Layer Manager Fatal Error:\n" + error.message);
    console.error(error);
}
