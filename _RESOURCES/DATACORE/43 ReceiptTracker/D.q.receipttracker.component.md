



# ViewComponent

```jsx
const { useState, useEffect, useRef, useCallback, useMemo } = dc;

const filename = dc.resolvePath("D.q.receipttracker.component");

// Import all component parts
const { ScreenModeHelper } = await dc.require(dc.headerLink(filename, "ScreenModeHelper"));
const { DashboardView } = await dc.require(dc.headerLink(filename, "DashboardView"));
const { getStyles } = await dc.require(dc.headerLink(filename, "ViewStyles"));

// Instantiate the styles
const viewerStyles = getStyles();

// =================================================================================
// LOAD SCRIPT UTILITY
// =================================================================================
async function loadScript(dc, src, options = {}) {
  const { type = 'script', globalName = null, cache = true, onload = null, onerror = null } = options;
  if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
    const error = new Error("Datacore context 'dc' with vault adapter is required.");
    if (onerror) onerror(error);
    throw error;
  }
  const adapter = dc.app.vault.adapter;
  const cacheDir = ".datacore/script_cache";
  const isUrl = /^https?:\/\//.test(src);
  if (globalName && window[globalName]) return type === 'module' ? window[globalName] : Promise.resolve();
  window.__scriptPromises = window.__scriptPromises || {};
  const promiseKey = `${type}:${src}`;
  if (window.__scriptPromises[promiseKey]) return window.__scriptPromises[promiseKey];
  const loadPromise = (async () => {
    try {
      let scriptContent = null;
      if (isUrl) {
        const safeFilename = src.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>]/g, '_') + '.js';
        const cachePath = `${cacheDir}/${safeFilename}`;
        if (cache && await adapter.exists(cachePath)) {
          try { scriptContent = await adapter.read(cachePath); } 
          catch (readError) { console.warn(`[LoadScript] Cache read failed, refetching:`, readError); }
        }
        if (scriptContent === null) {
          const response = await fetch(src);
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          scriptContent = await response.text();
          if (cache) {
            try {
              if (!(await adapter.exists(cacheDir))) await adapter.mkdir(cacheDir);
              await adapter.write(cachePath, scriptContent);
            } catch (writeError) { console.warn(`[LoadScript] Cache write failed:`, writeError); }
          }
        }
      } else {
        if (!(await adapter.exists(src))) throw new Error(`Local file not found: ${src}`);
        scriptContent = await adapter.read(src);
      }
      let result;
      if (type === 'module') {
        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        try {
          const moduleExports = await import(blobUrl);
          URL.revokeObjectURL(blobUrl);
          if (globalName) window[globalName] = moduleExports;
          result = moduleExports;
        } catch (importError) {
          URL.revokeObjectURL(blobUrl);
          throw new Error(`Module import failed: ${importError.message}`);
        }
      } else {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptContent;
        document.body.appendChild(scriptElement);
        if (globalName) {
          const maxWaitTime = 5000;
          const checkInterval = 50;
          const startTime = Date.now();
          while (!window[globalName] && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(r => setTimeout(r, checkInterval));
          }
          if (window[globalName]) {
            result = window[globalName];
          } else {
            throw new Error(`Timeout waiting for ${globalName} to be available`);
          }
        } else {
          result = scriptElement;
        }
      }
      if (onload) onload(result);
      return result;
    } catch (error) {
      console.error(`[LoadScript] Failed to load ${src}:`, error);
      if (onerror) onerror(error);
      throw error;
    } finally {
      delete window.__scriptPromises[promiseKey];
    }
  })();
  window.__scriptPromises[promiseKey] = loadPromise;
  return loadPromise;
}

// =================================================================================
// HELPER COMPONENTS & ICONS
// =================================================================================

const ApiKeyManagerPopover = ({
    isOpen,
    onClose,
    anchorRef,
    editedKeys,
    onAddKey,
    onDeleteKey,
    onSave,
    onCancel,
    hasUnsavedChanges,
    availableModels,
    selectedModel,
    onModelChange,
    isLoadingModels
}) => {
    const popoverRef = useRef(null);
    const [newApiKeyInput, setNewApiKeyInput] = useState("");
    const [position, setPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (isOpen && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const containerRect = anchorRef.current.closest('.view-container')?.getBoundingClientRect() || { top: 0, left: 0 };
            setPosition({
                top: rect.bottom - containerRect.top + 4,
                right: containerRect.right - rect.right,
            });
        }
    }, [isOpen, anchorRef]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target) && anchorRef.current && !anchorRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose, anchorRef]);

    const handleAddClick = () => {
        onAddKey(newApiKeyInput);
        setNewApiKeyInput("");
    };

    if (!isOpen) return null;

    return (
        <div ref={popoverRef} className="api-key-content-wrapper is-open" style={{ top: `${position.top}px`, right: `${position.right}px` }}>
            <div className="api-key-content">
                <p>Manage Groq API keys and model selection. Changes must be saved.</p>
                
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        AI Model {isLoadingModels && '(Loading...)'}
                    </label>
                    <select 
                        value={selectedModel} 
                        onChange={(e) => onModelChange(e.target.value)}
                        disabled={isLoadingModels || availableModels.length === 0}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: 'var(--background-primary)',
                            border: '1px solid var(--background-modifier-border)',
                            borderRadius: '4px',
                            color: 'var(--text-normal)',
                            fontSize: '13px'
                        }}
                    >
                        {availableModels.length === 0 ? (
                            <option value="">Add API key to load models</option>
                        ) : (
                            availableModels.map(model => (
                                <option key={model.id} value={model.id}>
                                    {model.name} {model.owned_by ? `(${model.owned_by})` : ''}
                                </option>
                            ))
                        )}
                    </select>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {availableModels.length > 0 ? `${availableModels.length} models available` : 'No models loaded'}
                    </div>
                </div>
                
                <div className="api-key-list">
                    {editedKeys.length > 0 ? (
                        editedKeys.map((key, index) => (
                            <div key={index} className="api-key-item">
                                <span className="api-key-masked">{maskApiKey(key)}</span>
                                <button className="delete-key-btn" title="Remove key" onClick={() => onDeleteKey(index)}>×</button>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-small">No API keys added.</div>
                    )}
                </div>
                <div className="add-key-form">
                    <input
                        type="text"
                        value={newApiKeyInput}
                        onChange={e => setNewApiKeyInput(e.target.value)}
                        placeholder="Add new key (gsk_...)"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
                    />
                    <button onClick={handleAddClick} disabled={!newApiKeyInput.trim()}>Add</button>
                </div>
                <div className="api-key-actions">
                    <button onClick={onCancel}>Cancel</button>
                    <button className="primary" onClick={onSave} disabled={!hasUnsavedChanges}>Save Keys</button>
                </div>
            </div>
        </div>
    );
};

const GROQ_API_KEY_PATH = ".datacore/chatllm/.secret/groq_api_key.txt";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";
const EXTRACTION_PROMPT = `You are an expert financial assistant specializing in parsing text from receipts. Your task is to extract key information from the provided text and return it ONLY as a valid JSON object. Do not include any other text, greetings, or explanations. Just the JSON. The JSON object should have the following schema: { "merchant_name": "string | null", "transaction_date": "string (YYYY-MM-DD format) | null", "total_amount": "number | null", "currency": "string (e.g., USD, EUR) | null", "items": [ { "description": "string", "quantity": "number", "price": "number" } ] }. If you cannot find a value for a field, use null. For 'total_amount', extract the final, grand total. It should be a number, not a string. For 'transaction_date', do your best to convert it to YYYY-MM-DD format. For 'items', list all purchased items. If you can't parse individual items, return an empty array []. Here is the receipt text to parse: ---`;

// Helper function to get relative path from current component location
const getRelativePath = (currentPath, relativePath) => {
  if (!currentPath) return relativePath;
  // Get the directory containing the component file
  const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
  // Build the path from the component's directory
  return currentDir + '/' + relativePath;
};
// Using dc.Icons
const ProcessIcon = () => <dc.Icon icon="refresh-cw" style={{ fontSize: '16px' }} />;
const CheckCircleIcon = () => <dc.Icon icon="check-circle" style={{ fontSize: '16px', color: '#10b981' }} />;
const XCircleIcon = () => <dc.Icon icon="x-circle" style={{ fontSize: '16px', color: '#ef4444' }} />;
const ChevronRightIcon = () => <dc.Icon icon="chevron-right" style={{ fontSize: '16px' }} />;
const ChevronDownIcon = () => <dc.Icon icon="chevron-down" style={{ fontSize: '16px' }} />;
const EyeIcon = () => <dc.Icon icon="eye" style={{ fontSize: '16px' }} />;
const EditIcon = () => <dc.Icon icon="edit-3" style={{ fontSize: '16px' }} />;
const FullscreenIcon = () => <dc.Icon icon="maximize-2" style={{ fontSize: '16px' }} />;
const ExpandIcon = () => <dc.Icon icon="maximize" style={{ fontSize: '16px' }} />;
const MinimizeIcon = () => <dc.Icon icon="minimize" style={{ fontSize: '16px' }} />;

const maskApiKey = (key) => { if (typeof key !== 'string' || key.length < 12) return "Invalid Key"; return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`; };
const getProcessedMdFileName = (fileName) => { const baseName = fileName.substring(0, fileName.lastIndexOf('.')).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'); return `${baseName}.md`; };
const saveExtractedDataToMarkdown = async (receiptFile, extractedJson, ocrText, processedFolderPath) => {
    console.log('[Save] Starting save process...');
    console.log('[Save] Receipt file:', receiptFile.name);
    console.log('[Save] Processed folder path:', processedFolderPath);
    
    const mdFileName = getProcessedMdFileName(receiptFile.name);
    const mdFilePath = `${processedFolderPath}/${mdFileName}`;
    console.log('[Save] Target MD file path:', mdFilePath);
    
    const cleanMerchantName = extractedJson?.merchant_name || 'Unnamed Merchant';
    const cleanDate = extractedJson?.transaction_date || 'Unknown Date';
    let markdownContent = `---
receiptImage: "[[${receiptFile.name}]]"\n`;
    for (const key in extractedJson) {
        if (extractedJson.hasOwnProperty(key) && key !== 'items') {
            let value = extractedJson[key];
            if (typeof value === 'string' && value.includes(':')) value = JSON.stringify(value);
            markdownContent += `${key}: ${value}\n`;
        }
    }
    markdownContent += `---\n\n# Processed Receipt: ${cleanMerchantName} (${cleanDate})\n\n## Extracted Data\n\`\`\`json\n${JSON.stringify(extractedJson, null, 2)}\n\`\`\`\n\n## Raw OCR Text\n\`\`\`text\n${ocrText || 'No OCR text available.'}\n\`\`\`\n`;
    
    console.log('[Save] Markdown content length:', markdownContent.length);
    
    try {
        const folderExists = await app.vault.adapter.exists(processedFolderPath);
        console.log('[Save] Processed folder exists?', folderExists);
        
        if (!folderExists) {
            console.log('[Save] Creating folder:', processedFolderPath);
            await app.vault.adapter.mkdir(processedFolderPath);
            console.log('[Save] ✓ Folder created successfully');
        }
        
        console.log('[Save] Writing file to:', mdFilePath);
        await app.vault.adapter.write(mdFilePath, markdownContent);
        console.log('[Save] ✓ File written successfully!');
    } catch (err) { 
        console.error('[Save] ❌ Save failed:', err);
        throw new Error(`Could not save processed data to ${mdFilePath}: ${err.message}`); 
    }
};
const parseMdContent = (content, filePath) => {
    try {
        const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
        let frontmatterData = {};
        if (frontmatterMatch?.[1]) {
            try { if (window.DataviewAPI?.parseYaml) frontmatterData = window.DataviewAPI.parseYaml(frontmatterMatch[1]); } 
            catch (yamlErr) { console.warn(`Error parsing YAML for ${filePath}:`, yamlErr); }
        }
        const jsonCodeBlockMatch = content.match(/```json\n([\s\S]*?)\n```/);
        let jsonBlockData = {};
        if (jsonCodeBlockMatch?.[1]) try { jsonBlockData = JSON.parse(jsonCodeBlockMatch[1]); } 
        catch (jsonErr) { console.warn(`Error parsing JSON block for ${filePath}:`, jsonErr); }
        const ocrCodeBlockMatch = content.match(/```text\n([\s\S]*?)\n```/);
        return { json: Object.keys(jsonBlockData).length > 0 ? jsonBlockData : frontmatterData, ocr: ocrCodeBlockMatch ? ocrCodeBlockMatch[1] : '' };
    } catch (err) { return { error: `Could not parse data from ${filePath}: ${err.message}` }; }
};
const loadProcessedDataFromMarkdown = async (receiptFile, processedFolderPath) => {
    const mdFileName = getProcessedMdFileName(receiptFile.name);
    const mdFilePath = `${processedFolderPath}/${mdFileName}`;
    try {
        if (!await app.vault.adapter.exists(mdFilePath)) return null;
        const content = await app.vault.adapter.read(mdFilePath);
        return parseMdContent(content, mdFilePath);
    } catch (err) { return { error: `Could not load data from ${mdFilePath}: ${err.message}` }; }
};
const EmptyStatePlaceholder = ({ iconName, title, message }) => (
    <div className="empty-state-placeholder">
        <dc.Icon icon={iconName || "file-text"} style={{ fontSize: '48px' }} />
        <h4>{title}</h4>
        <p>{message}</p>
    </div>
);
const EditReceiptModal = ({ isOpen, onClose, initialData, onSave }) => {
    const [editedJsonString, setEditedJsonString] = useState(JSON.stringify(initialData?.json || {}, null, 2));
    const [editError, setEditError] = useState(null);
    useEffect(() => { setEditedJsonString(JSON.stringify(initialData?.json || {}, null, 2)); setEditError(null); }, [initialData, isOpen]);
    const handleSave = () => { try { const parsedJson = JSON.parse(editedJsonString); onSave(parsedJson, initialData.ocr); setEditError(null); onClose(); } catch (err) { setEditError("Invalid JSON: " + err.message); } };
    if (!isOpen) return null;
    return (
        <div className="receipt-edit-modal-overlay" onClick={onClose}>
            <div className="receipt-edit-modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="receipt-edit-modal-close" onClick={onClose}>×</span>
                <h3>Edit Receipt Data for {initialData.file.name}</h3>
                {editError && <div className="notice is-error">{editError}</div>}
                <div className="modal-form-group">
                    <label>Extracted JSON:</label>
                    <textarea value={editedJsonString} onChange={(e) => setEditedJsonString(e.target.value)} spellCheck="false" className="modal-json-textarea"></textarea>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button className="primary" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// =================================================================================
// MAIN COMPONENT
// =================================================================================
function ReceiptHandlerView() {
  // Get current file path for relative path calculation
  const currentPath = dc.resolvePath("D.q.receipttracker.component");
  
  const [tesseractLoaded, setTesseractLoaded] = useState(false);
  const [groqApiKeys, setGroqApiKeys] = useState([]);
  const [editedApiKeys, setEditedApiKeys] = useState([]);
  const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [receiptFolderPath, setReceiptFolderPath] = useState("");
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState({});
  const [allProcessedData, setAllProcessedData] = useState([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('json');
  const [isApiKeyPopoverOpen, setIsApiKeyPopoverOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const [mainView, setMainView] = useState('processor');
  const [focusedPanel, setFocusedPanel] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLanguage, setOcrLanguage] = useState('auto');
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  
  const currentBlobUrl = useRef(null);
  const containerRef = useRef(null);
  const screenModeHelperRef = useRef(null);
  const apiButtonRef = useRef(null);
  const tesseractWorkerRef = useRef(null);
  const currentWorkerLangRef = useRef(null);
  
  // Calculate default relative paths based on component location
  const defaultReceiptsFolderPath = useMemo(() => {
    return getRelativePath(currentPath, '_resources/receipts');
  }, [currentPath]);
  
  const processedFolderPath = useMemo(() => {
    // Always calculate processed path based on the current receiptFolderPath
    if (!receiptFolderPath) return getRelativePath(currentPath, '_resources/receipts/_processed');
    return receiptFolderPath + '/_processed';
  }, [currentPath, receiptFolderPath]);
  
  // Initialize receiptFolderPath only once when component first mounts
  useEffect(() => {
    if (defaultReceiptsFolderPath && !receiptFolderPath) {
      setReceiptFolderPath(defaultReceiptsFolderPath);
    }
  }, [defaultReceiptsFolderPath]); // Only depend on defaultReceiptsFolderPath, not receiptFolderPath
  
  // Tesseract supported languages (most common ones)
  const OCR_LANGUAGES = [
    { code: 'auto', name: '🤖 Auto-detect' },
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'chi_tra', name: 'Chinese (Traditional)' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
    { code: 'tha', name: 'Thai' },
    { code: 'vie', name: 'Vietnamese' },
    { code: 'nld', name: 'Dutch' },
    { code: 'pol', name: 'Polish' },
    { code: 'tur', name: 'Turkish' },
    { code: 'swe', name: 'Swedish' },
    { code: 'nor', name: 'Norwegian' },
    { code: 'dan', name: 'Danish' },
    { code: 'fin', name: 'Finnish' },
    { code: 'ces', name: 'Czech' },
    { code: 'hun', name: 'Hungarian' },
    { code: 'ron', name: 'Romanian' },
    { code: 'ukr', name: 'Ukrainian' },
    { code: 'bul', name: 'Bulgarian' },
    { code: 'hrv', name: 'Croatian' },
    { code: 'srp', name: 'Serbian' },
    { code: 'slk', name: 'Slovak' },
    { code: 'slv', name: 'Slovenian' },
    { code: 'ell', name: 'Greek' },
    { code: 'heb', name: 'Hebrew' },
    { code: 'ind', name: 'Indonesian' },
    { code: 'msa', name: 'Malay' },
    { code: 'fil', name: 'Filipino' }
  ];

  const hasUnsavedChanges = useMemo(() => JSON.stringify(groqApiKeys) !== JSON.stringify(editedApiKeys), [groqApiKeys, editedApiKeys]);
  
  const handlePanelFocus = (panelName) => { setFocusedPanel(prev => (prev === panelName ? null : panelName)); };
  
  const panelLayoutStyles = useMemo(() => {
    switch (focusedPanel) {
      case 'files': return { wrapper: { gridTemplateRows: 'auto 1fr' }, mainGrid: { gridTemplateColumns: '1fr 0px', gap: 0 }, summaryPanel: { maxHeight: '0px', padding: 0, border: 'none' } };
      case 'processing': return { wrapper: { gridTemplateRows: 'auto 1fr' }, mainGrid: { gridTemplateColumns: '0px 1fr', gap: 0 }, summaryPanel: { maxHeight: '0px', padding: 0, border: 'none' } };
      case 'summary': return { wrapper: { gridTemplateRows: '0px 1fr', gap: 0 }, mainGrid: { maxHeight: '0px', padding: 0, border: 'none' }, summaryPanel: { maxHeight: '100%' } };
      default: return { wrapper: { gridTemplateRows: '1fr auto' }, mainGrid: { gridTemplateColumns: '280px 1fr', gap: '16px' }, summaryPanel: { maxHeight: '25vh' } };
    }
  }, [focusedPanel]);

  useEffect(() => { const timer = setTimeout(() => screenModeHelperRef.current?.toggleMode('fullTab'), 100); return () => clearTimeout(timer); }, []);

  const loadAllDashboardData = useCallback(async () => {
    if (!processedFolderPath) {
      console.log('[Dashboard] No processed folder path set');
      return;
    }
    
    console.log('[Dashboard] Loading data from:', processedFolderPath);
    const dashboardData = [];
    
    try {
      // Check if folder exists first
      const exists = await app.vault.adapter.exists(processedFolderPath);
      if (!exists) {
        console.warn('[Dashboard] Processed folder does not exist:', processedFolderPath);
        console.log('[Dashboard] Creating _processed folder...');
        
        try {
          await app.vault.adapter.mkdir(processedFolderPath);
          console.log('[Dashboard] ✓ Successfully created _processed folder');
          // Folder is now empty, so return empty array
          setAllProcessedData([]);
          return;
        } catch (mkdirError) {
          console.error('[Dashboard] Failed to create _processed folder:', mkdirError);
          setAllProcessedData([]);
          return;
        }
      }
      
      const folder = app.vault.getAbstractFileByPath(processedFolderPath);
      console.log('[Dashboard] Folder object:', folder);
      
      if (folder?.children) {
        const mdFiles = folder.children.filter(f => f.extension && f.extension.toLowerCase() === 'md');
        console.log('[Dashboard] Found', mdFiles.length, 'markdown files');
        
        for (const file of mdFiles) {
          try {
            const content = await app.vault.adapter.read(file.path);
            const parsed = parseMdContent(content, file.path);
            if (parsed && !parsed.error && parsed.json) {
              dashboardData.push({ ...parsed, path: file.path });
            } else {
              console.warn('[Dashboard] Failed to parse or invalid data:', file.path, parsed);
            }
          } catch(e) { console.error(`[Dashboard] Failed to load or parse ${file.path}`, e)}
        }
      } else {
        console.warn('[Dashboard] Folder has no children or is invalid:', processedFolderPath);
      }
    } catch (err) {
      console.error('[Dashboard] Error loading dashboard data:', err);
    }
    
    console.log('[Dashboard] Loaded', dashboardData.length, 'receipts');
    setAllProcessedData(dashboardData);
  }, [processedFolderPath]);
  
  // Load Tesseract.js on mount
  useEffect(() => {
    let mounted = true;
    const initTesseract = async () => {
      try {
        if (window.Tesseract) {
          if (mounted) setTesseractLoaded(true);
          return;
        }
        await loadScript(dc, 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', {
          globalName: 'Tesseract',
          type: 'script'
        });
        if (window.Tesseract && mounted) {
          setTesseractLoaded(true);
        } else if (!window.Tesseract) {
          throw new Error('Tesseract object not found after script load');
        }
      } catch (err) {
        console.error('[Receipt OCR] Failed to load Tesseract.js:', err);
        if (mounted) {
          setError(`Failed to load OCR library: ${err.message}`);
        }
      }
    };
    initTesseract();
    return () => { 
      mounted = false;
      // Cleanup worker on unmount
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate().catch(e => console.warn('Worker cleanup failed:', e));
        tesseractWorkerRef.current = null;
      }
    };
  }, []);
  
  // Fetch available Groq models
  const fetchAvailableModels = useCallback(async () => {
    // Only fetch if we have a valid API key
    if (groqApiKeys.length === 0 || !groqApiKeys[0]) {
      console.log('[Models] No API key available, skipping model fetch');
      return;
    }
    
    setIsLoadingModels(true);
    const apiKey = groqApiKeys[0].trim();
    console.log('[Models] Fetching available models...');
    console.log('[Models] API key length:', apiKey.length);
    console.log('[Models] API key preview:', apiKey.substring(0, 10) + '...');
    try {
      const response = await fetch(GROQ_MODELS_URL, {
        method: 'GET',
        

        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[Models] Failed to fetch models:', response.status);
        console.warn('[Models] Error response:', errorText);
        return;
      }
      
      const data = await response.json();
      // Filter for active models only
      const models = (data.data || [])
        .filter(m => m.active)
        .map(m => ({
          id: m.id,
          name: m.id,
          owned_by: m.owned_by,
          context_window: m.context_window
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('[Models] Loaded', models.length, 'available models');
      setAvailableModels(models);
      
      // Auto-select a free model if current selection isn't available
      if (models.length > 0 && !models.find(m => m.id === selectedModel)) {
        // Prefer llama models that are free
        const freeModel = models.find(m => 
          m.id.includes('llama') || 
          m.id.includes('mixtral') || 
          m.id.includes('gemma')
        ) || models[0];
        setSelectedModel(freeModel.id);
        console.log('[Models] Auto-selected model:', freeModel.id);
      }
    } catch (err) {
      console.error('[Models] Error fetching models:', err);
    } finally {
      setIsLoadingModels(false);
    }
  }, [groqApiKeys, selectedModel]);
  
  useEffect(() => {
    if (processedFolderPath) {
      loadAllDashboardData();
    }
    (async () => {
      let keyFound = false;
      try {
        if (await app.vault.adapter.exists(GROQ_API_KEY_PATH)) {
          const keysContent = await app.vault.adapter.read(GROQ_API_KEY_PATH);
          const keys = keysContent.split('\n').map(k => k.trim()).filter(Boolean);
          if (keys.length > 0) {
            setGroqApiKeys(keys); setEditedApiKeys(keys); keyFound = true;
          }
        }
      } catch (err) { setError("Error loading Groq API key file."); }
      if (!keyFound) setIsApiKeyPopoverOpen(true);
    })();
  }, [processedFolderPath, loadAllDashboardData]);
  
  // Fetch models when API keys change
  useEffect(() => {
    if (groqApiKeys.length > 0) {
      fetchAvailableModels();
    }
  }, [groqApiKeys, fetchAvailableModels]);

  // =======================================================================
  // === MODIFIED `useEffect` FOR ROBUST FOLDER LOADING ====================
  // =======================================================================
  useEffect(() => {
    const loadFilesAndData = async () => {
      setError(null); // Clear previous folder errors
      if (!receiptFolderPath || !processedFolderPath) {
        setReceiptFiles([]);
        setProcessedData({});
        return;
      }
      try {
        console.log('[Dashboard] Checking folder path:', receiptFolderPath);
        console.log('[Dashboard] Using vault:', dc.app.vault.getName());
        const folder = dc.app.vault.getAbstractFileByPath(receiptFolderPath);
        console.log('[Dashboard] Got folder object:', folder);
        if (folder?.children) {
          const imageFiles = folder.children
            .filter(f => f.extension && ['png', 'jpg', 'jpeg', 'webp'].includes(f.extension.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
          setReceiptFiles(imageFiles);

          const newProcessedData = {};
          for (const file of imageFiles) {
            const loadedData = await loadProcessedDataFromMarkdown(file, processedFolderPath);
            if (loadedData) newProcessedData[file.path] = loadedData;
          }
          setProcessedData(newProcessedData);
        } else {
          // Path is valid but not a folder or is empty
          setError(`Folder not found or is empty: "${receiptFolderPath}"`);
          setReceiptFiles([]);
          setProcessedData({});
        }
      } catch (err) {
        // Catch any unexpected errors during file access
        console.error("Error loading receipt folder:", err);
        setError(`Invalid folder path: "${receiptFolderPath}". Please check the path.`);
        setReceiptFiles([]);
        setProcessedData({});
      } finally {
        // Reset current selection regardless of outcome
        setCurrentReceipt(null);
        setImagePreviewUrl(null);
      }
    };
    loadFilesAndData();
  }, [receiptFolderPath, processedFolderPath]);
  
  useEffect(() => { 
    if (!currentReceipt) { 
      console.log('[Preview] No current receipt, clearing preview');
      setImagePreviewUrl(null); 
      return; 
    } 
    
    console.log('[Preview] Loading preview for:', currentReceipt.name);
    console.log('[Preview] File path:', currentReceipt.path);
    console.log('[Preview] File extension:', currentReceipt.extension);
    
    (async () => { 
      try { 
        console.log('[Preview] Reading file:', currentReceipt.name);
        console.log('[Preview] File path:', currentReceipt.path);
        console.log('[Preview] File vault:', currentReceipt.vault?.getName());
        
        // Read binary and create blob URL (same as working ImageRender approach)
        const buffer = await dc.app.vault.readBinary(currentReceipt);
        console.log('[Preview] Read buffer, size:', buffer.byteLength);
        
        const blob = new Blob([buffer], { type: `image/${currentReceipt.extension}` });
        const blobUrl = URL.createObjectURL(blob);
        console.log('[Preview] Created blob URL:', blobUrl);
        
        setImagePreviewUrl(blobUrl); 
        console.log('[Preview] ✓ Blob URL set successfully');
      } catch (err) { 
        console.error('[Preview] ❌ Failed to load preview:', err);
        console.error('[Preview] Error message:', err.message);
        console.error('[Preview] Error stack:', err.stack);
        setError("Could not load image preview."); 
      } 
    })(); 
  }, [currentReceipt]);
  
  const handleAddKey = (key) => { if (key.trim()) { setEditedApiKeys([...editedApiKeys, key.trim()]); } };
  const handleDeleteKey = (indexToDelete) => { setEditedApiKeys(editedApiKeys.filter((_, index) => index !== indexToDelete)); };
  const handleCancelEditKeys = () => { setEditedApiKeys(groqApiKeys); setIsApiKeyPopoverOpen(false); };
  const handleSaveApiKeys = async () => {
    try {
        const dir = GROQ_API_KEY_PATH.substring(0, GROQ_API_KEY_PATH.lastIndexOf("/"));
        if (!await app.vault.adapter.exists(dir)) {
          console.log('[API Keys] Creating directory:', dir);
          await app.vault.adapter.mkdir(dir);
        }
        
        console.log('[API Keys] Saving keys to:', GROQ_API_KEY_PATH);
        await app.vault.adapter.write(GROQ_API_KEY_PATH, editedApiKeys.join('\n'));
        
        setGroqApiKeys(editedApiKeys); 
        setCurrentApiKeyIndex(0); 
        setError(null); 
        setIsApiKeyPopoverOpen(false);
        console.log('[API Keys] ✓ Successfully saved API keys');
    } catch (err) { 
      console.error('[API Keys] Failed to save:', err);
      setError("Could not save the API keys."); 
    }
  };
  const performOcr = async (file) => {
    if (!tesseractLoaded) throw new Error("Tesseract.js not loaded yet.");
    
    // Determine which language(s) to use
    let languageToUse = ocrLanguage;
    let langDisplayName = OCR_LANGUAGES.find(l => l.code === ocrLanguage)?.name || ocrLanguage;
    
    if (ocrLanguage === 'auto') {
      // Use multiple language families for comprehensive auto-detection
      // Includes: Western European, Cyrillic, Asian (CJK), Arabic, and Thai
      languageToUse = 'eng+spa+fra+deu+rus+jpn+chi_sim+kor+ara+tha';
      langDisplayName = '🤖 Auto-detecting';
    }
    
    setCurrentStatus(`(1/2) Extracting text with OCR (${langDisplayName})...`);
    setOcrProgress(0);
    setDetectedLanguage(null);
    
    try {
      // Read binary and create blob URL (ensures we use correct vault)
      console.log(`[OCR] 1. Reading binary for: ${file.name}`);
      const buffer = await dc.app.vault.readBinary(file);
      console.log(`[OCR] 2. Read ${buffer.byteLength} bytes`);
      
      const blob = new Blob([buffer], { type: `image/${file.extension}` });
      const imageSrc = URL.createObjectURL(blob);
      console.log(`[OCR] 3. Created blob URL: ${imageSrc}`);
      
      // Preprocess image for faster OCR (resize if too large)
      try {
        console.log(`[OCR] 4. Creating Image object...`);
        const img = new Image();
        
        const loadPromise = new Promise((resolve, reject) => {
          img.onload = () => {
            console.log(`[OCR] 5. ✓ Image loaded successfully!`);
            console.log(`[OCR] 5a. Image dimensions: ${img.width}x${img.height}`);
            resolve();
          };
          img.onerror = (e) => {
            console.error(`[OCR] 5. ❌ Image load ERROR!`);
            console.error(`[OCR] 5a. Error event:`, e);
            reject(e);
          };
          
          console.log(`[OCR] 4a. Setting img.src to blob URL...`);
          img.src = imageSrc;
        });
        
        await loadPromise;
        console.log(`[OCR] 6. Image loaded successfully, proceeding...`);
        
        // If image is very large, resize it for faster processing
        // OCR doesn't need ultra high resolution
        const MAX_DIMENSION = 2000;
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          console.log(`[OCR] 7. Image is large (${img.width}x${img.height}), will resize...`);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = (height * MAX_DIMENSION) / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = (width * MAX_DIMENSION) / height;
              height = MAX_DIMENSION;
            }
          }
          
          console.log(`[OCR] 7a. Resizing to: ${width}x${height}`);
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          console.log(`[OCR] 7b. Drew image on canvas`);
          
          // Convert to grayscale for faster processing
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = data[i + 1] = data[i + 2] = gray;
          }
          ctx.putImageData(imageData, 0, 0);
          console.log(`[OCR] 7c. Applied grayscale`);
          
          // Revoke the original blob URL since we're replacing it
          URL.revokeObjectURL(imageSrc);
          imageSrc = canvas.toDataURL('image/jpeg', 0.9);
          console.log(`[OCR] 7d. Converted to JPEG data URL for OCR processing`);
        } else {
          console.log(`[OCR] 7. Image size OK (${img.width}x${img.height}), using blob URL directly`);
        }
      } catch (preprocessErr) {
        console.error('[OCR] ❌ PREPROCESSING FAILED!');
        console.error('[OCR] Error:', preprocessErr);
        console.error('[OCR] Error message:', preprocessErr.message);
        console.error('[OCR] Error stack:', preprocessErr.stack);
        console.warn('[OCR] Will try to continue with blob URL...');
        // Continue with original blob URL if preprocessing fails
      }
      
      let downloadProgress = 0;
      
      // Reuse worker if same language, otherwise create new one
      let worker = tesseractWorkerRef.current;
      const needsNewWorker = !worker || currentWorkerLangRef.current !== languageToUse;
      
      if (needsNewWorker) {
        // Terminate old worker if exists
        if (worker) {
          try { await worker.terminate(); } catch (e) {}
          tesseractWorkerRef.current = null;
        }
        
        // Create a new worker for better performance
        worker = await window.Tesseract.createWorker(languageToUse, 1, {
          logger: (m) => {
            // Track both download and recognition progress
            if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
              setCurrentStatus(`(1/2) Initializing OCR engine...`);
            } else if (m.status === 'loading language traineddata') {
              downloadProgress = Math.round(m.progress * 50); // 0-50% for download
              setOcrProgress(downloadProgress);
              setCurrentStatus(`(1/2) Downloading language data... (${downloadProgress}%)`);
            } else if (m.status === 'initializing api') {
              setCurrentStatus(`(1/2) Preparing OCR (${langDisplayName})...`);
              setOcrProgress(50);
            } else if (m.status === 'recognizing text') {
              const progressPercent = 50 + Math.round(m.progress * 50); // 50-100% for recognition
              setOcrProgress(progressPercent);
              setCurrentStatus(`(1/2) Extracting text (${langDisplayName})...`);
            }
          },
          errorHandler: (err) => {
            console.error('[Tesseract Error]', err);
          }
        });
        
        // Set parameters for faster processing
        // PSM 3 = Fully automatic page segmentation (faster than default)
        // OEM 1 = Neural nets LSTM engine only (faster and more accurate)
        await worker.setParameters({
          tessedit_pageseg_mode: window.Tesseract.PSM.AUTO,
          tessedit_ocr_engine_mode: window.Tesseract.OEM.LSTM_ONLY,
        });
        
        // Cache the worker
        tesseractWorkerRef.current = worker;
        currentWorkerLangRef.current = languageToUse;
      } else {
        // Reusing existing worker - much faster!
        setCurrentStatus(`(1/2) Extracting text (${langDisplayName})...`);
        setOcrProgress(50);
      }
      
      const result = await worker.recognize(imageSrc);
      
      const text = result.data.text;
      console.log(`[OCR] ✓ Recognition complete! Extracted ${text.length} characters`);
      
      // Try to detect the primary language from confidence data
      if (ocrLanguage === 'auto' && result.data.blocks && result.data.blocks.length > 0) {
        const langConfidence = {};
        const textSample = result.data.text.substring(0, 500); // Check first 500 chars
        
        // More comprehensive character range detection
        const charCounts = {
          chinese: (textSample.match(/[\u4e00-\u9fff]/g) || []).length,
          arabic: (textSample.match(/[\u0600-\u06ff]/g) || []).length,
          japanese_hiragana: (textSample.match(/[\u3040-\u309f]/g) || []).length,
          japanese_katakana: (textSample.match(/[\u30a0-\u30ff]/g) || []).length,
          korean: (textSample.match(/[\uac00-\ud7af]/g) || []).length,
          cyrillic: (textSample.match(/[\u0400-\u04ff]/g) || []).length,
          thai: (textSample.match(/[\u0e00-\u0e7f]/g) || []).length,
          latin: (textSample.match(/[a-zA-Z]/g) || []).length,
        };
        
        // Determine primary script
        let detectedScript = null;
        const totalChars = Object.values(charCounts).reduce((a, b) => a + b, 0);
        
        if (totalChars > 0) {
          // Japanese uses both hiragana and katakana
          const japaneseTotal = charCounts.japanese_hiragana + charCounts.japanese_katakana;
          
          if (charCounts.chinese > totalChars * 0.3) detectedScript = '🇨🇳 Chinese';
          else if (japaneseTotal > totalChars * 0.2 || (charCounts.japanese_hiragana > 0 && charCounts.japanese_katakana > 0)) detectedScript = '🇯🇵 Japanese';
          else if (charCounts.korean > totalChars * 0.3) detectedScript = '🇰🇷 Korean';
          else if (charCounts.arabic > totalChars * 0.3) detectedScript = '🇸🇦 Arabic';
          else if (charCounts.thai > totalChars * 0.3) detectedScript = '🇹🇭 Thai';
          else if (charCounts.cyrillic > totalChars * 0.3) detectedScript = '🇷🇺 Russian/Cyrillic';
          else if (charCounts.latin > totalChars * 0.5) detectedScript = '🌍 Latin/Western';
          
          if (detectedScript) {
            setDetectedLanguage(detectedScript);
          }
        }
      }
      
      if (!text?.trim()) throw new Error("OCR completed, but no text was detected. The image may be too blurry or not contain readable text.");
      return text;
    } catch (err) {
      // Better error messages for common issues
      if (err.message?.includes('cors') || err.message?.includes('fetch')) {
        throw new Error(`Failed to download OCR language data. Check your internet connection. Original error: ${err.message}`);
      } else if (err.message?.includes('traineddata')) {
        throw new Error(`Failed to load language data for '${languageToUse}'. Try selecting a specific language instead of auto-detect.`);
      }
      throw err;
    } finally {
      setOcrProgress(0);
    }
  };
  
  // Helper to check if extraction result is mostly N/A
  const hasLowQualityData = (jsonData) => {
    if (!jsonData) return true;
    const naCount = [
      jsonData.merchant_name,
      jsonData.transaction_date,
      jsonData.total_amount,
      jsonData.currency
    ].filter(val => val === null || val === 'N/A' || val === undefined).length;
    return naCount >= 3; // If 3+ key fields are N/A, consider it low quality
  };
  
  const analyzeTextWithGroq = async (ocrText, isRetry = false) => {
    if (groqApiKeys.length === 0) { throw new Error("Groq API key is not set. Please add an API key in the API Config."); }
    
    // Use enhanced prompt for retry
    const systemPrompt = isRetry 
      ? `You are an expert financial assistant specializing in parsing receipts from ANY language. The text may be in English, Spanish, French, German, Russian, Chinese, Japanese, Korean, Arabic, Thai, or other languages. Your task:

1. TRANSLATE the text to English first if it's in another language
2. Extract key information and return ONLY a valid JSON object
3. Be VERY thorough - look for ANY numbers that could be totals, ANY text that could be merchant names, ANY date-like patterns
4. For dates: look for patterns like DD/MM/YYYY, YYYY-MM-DD, MM-DD-YYYY, or text like "January 15, 2024"
5. For amounts: look for currency symbols (¥, ₽, ฿, €, $, etc.) followed by numbers, or just prominent numbers
6. For merchants: look for business names, usually at the top of receipts
7. DO NOT return null unless you absolutely cannot find the information

JSON schema: { "merchant_name": "string | null", "transaction_date": "string (YYYY-MM-DD format) | null", "total_amount": "number | null", "currency": "string (e.g., USD, EUR, RUB, CNY, JPY, THB) | null", "items": [ { "description": "string", "quantity": "number", "price": "number" } ] }

Receipt text to parse (may be in any language): ---`
      : EXTRACTION_PROMPT;
    
    setCurrentStatus(isRetry ? "(2/2) Re-analyzing with enhanced extraction..." : "(2/2) Analyzing text with AI...");
    let lastError = null;
    let lastErrorDetails = null;
    
    for (let i = 0; i < groqApiKeys.length; i++) {
      const keyIndexToTry = (currentApiKeyIndex + i) % groqApiKeys.length;
      const apiKey = groqApiKeys[keyIndexToTry];
      try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST", 
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: selectedModel,
              messages: [
                { role: "system", content: systemPrompt }, 
                { role: "user", content: ocrText }
              ], 
              temperature: isRetry ? 0.3 : 0.1, // Slightly higher temp for retry to be more creative
              response_format: { type: "json_object" } 
            }),
        });
        
        if (response.ok) { 
          const data = await response.json(); 
          setCurrentApiKeyIndex(keyIndexToTry); 
          return JSON.parse(data.choices[0].message.content); 
        }
        
        // Parse error response
        const errorText = await response.text();
        let errorObj = null;
        try {
          errorObj = JSON.parse(errorText);
        } catch (e) {
          errorObj = { error: { message: errorText } };
        }
        
        // Extract error details
        const errorMessage = errorObj?.error?.message || errorText || "Unknown error";
        const errorCode = errorObj?.error?.code;
        const errorType = errorObj?.error?.type;
        
        // Build detailed error message
        let detailedError = `Key #${keyIndexToTry + 1} (Status ${response.status})`;
        if (errorCode) detailedError += ` [${errorCode}]`;
        detailedError += `: ${errorMessage}`;
        
        lastError = detailedError;
        lastErrorDetails = { status: response.status, code: errorCode, type: errorType, message: errorMessage };
        
        // Handle specific error cases
        if (errorCode === 'model_decommissioned') {
          throw new Error(`Model '${selectedModel}' has been decommissioned. Please select a different model. Visit https://console.groq.com/docs/deprecations for alternatives.`);
        }
        
        if (errorCode === 'invalid_api_key' || response.status === 401) {
          console.warn(`Invalid API key #${keyIndexToTry + 1}, trying next...`);
          continue;
        }
        
        // Retry on rate limits, auth errors, or server errors
        if (response.status === 429 || response.status === 403 || response.status >= 500) { 
          console.warn(`${detailedError} - Trying next key...`);
          continue; 
        } 
        
        // For other 4xx errors, don't retry with other keys
        throw new Error(detailedError);
        
      } catch (err) { 
        // If it's our thrown error, re-throw it
        if (err.message.includes('decommissioned') || err.message.includes('Key #')) {
          throw err;
        }
        // Network or fetch error
        lastError = `Network error with Key #${keyIndexToTry + 1}: ${err.message}`;
        console.warn(lastError, "- Trying next key...");
      }
    }
    
    // All keys failed
    let finalError = `All ${groqApiKeys.length} API key${groqApiKeys.length > 1 ? 's' : ''} failed.`;
    if (lastErrorDetails) {
      finalError += `\n\nLast error: ${lastError}`;
      if (lastErrorDetails.code === 'model_decommissioned') {
        finalError += `\n\n⚠️ The model '${selectedModel}' is no longer supported. Please select a different model from the dropdown.`;
      } else if (lastErrorDetails.status === 401 || lastErrorDetails.code === 'invalid_api_key') {
        finalError += `\n\n⚠️ All API keys appear to be invalid. Please check your keys in API Config.`;
      } else if (lastErrorDetails.status === 429) {
        finalError += `\n\n⚠️ Rate limit exceeded on all keys. Please try again later.`;
      }
    } else {
      finalError += ` Last error: ${lastError}`;
    }
    
    throw new Error(finalError);
  };

  const handleProcessReceipt = async (receiptFile) => { 
    if (!receiptFile || isLoading) return; 
    setIsLoading(true); 
    setError(null); 
    setCurrentReceipt(receiptFile); 
    let ocrText = ''; 
    let extractedJson = {}; 
    
    try { 
      ocrText = await performOcr(receiptFile); 
      extractedJson = await analyzeTextWithGroq(ocrText, false);
      
      // Check if result is low quality (mostly N/A values)
      if (hasLowQualityData(extractedJson)) {
        console.log('[Receipt] Low quality data detected, retrying with enhanced prompt...');
        setCurrentStatus("(2/2) First attempt incomplete, retrying with enhanced extraction...");
        
        try {
          // Retry with enhanced prompt
          const enhancedJson = await analyzeTextWithGroq(ocrText, true);
          
          // Use enhanced result if it's better
          if (!hasLowQualityData(enhancedJson)) {
            console.log('[Receipt] Enhanced extraction successful!');
            extractedJson = enhancedJson;
          } else {
            console.log('[Receipt] Enhanced extraction also returned N/A, using original result');
          }
        } catch (retryErr) {
          console.warn('[Receipt] Enhanced extraction failed:', retryErr);
          // Continue with original result if retry fails
        }
      }
      
      await saveExtractedDataToMarkdown(receiptFile, extractedJson, ocrText, processedFolderPath); 
      setProcessedData(prev => ({ ...prev, [receiptFile.path]: { ocr: ocrText, json: extractedJson } })); 
      setActiveTab('json'); 
      loadAllDashboardData(); 
    } catch (err) { 
      setError(`Failed on ${receiptFile.name}: ${err.message}`); 
      setProcessedData(prev => ({ ...prev, [receiptFile.path]: { error: err.message, ocr: ocrText, json: extractedJson } })); 
    } finally { 
      setIsLoading(false); 
      setCurrentStatus(""); 
    } 
  };
  const handleProcessAll = async () => { if (isLoading) return; setIsLoading(true); let finalError = null; for (const file of receiptFiles) { if (!processedData[file.path] || processedData[file.path].error) { setError(null); await handleProcessReceipt(file); const updatedDataForThisFile = await loadProcessedDataFromMarkdown(file, processedFolderPath); if (updatedDataForThisFile?.error) { finalError = `Processing stopped due to error with ${file.name}: ${updatedDataForThisFile.error}`; break; } } } loadAllDashboardData(); setIsLoading(false); setCurrentStatus(""); setError(finalError); };
  const handleOpenEditModal = (file, data) => { setEditModalData({ file, json: data.json, ocr: data.ocr }); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setEditModalData(null); };
  const handleSaveEditedData = async (editedJson, originalOcr) => { if (!editModalData?.file) return; try { await saveExtractedDataToMarkdown(editModalData.file, editedJson, originalOcr, processedFolderPath); setProcessedData(prev => ({ ...prev, [editModalData.file.path]: { json: editedJson, ocr: originalOcr } })); loadAllDashboardData(); setError(null); } catch (err) { setError(`Failed to save edited data for ${editModalData.file.name}: ${err.message}`); } finally { handleCloseEditModal(); } };
  const handleCloseImageModal = () => { if (modalImageUrl) URL.revokeObjectURL(modalImageUrl); setModalImageUrl(null); };
  const currentReceiptData = currentReceipt ? processedData[currentReceipt.path] : null;

  return (
    <div ref={containerRef} className="view-container">
      <style>{viewerStyles.globalCss}</style>
      <ScreenModeHelper helperRef={screenModeHelperRef} containerRef={containerRef} />
      <ApiKeyManagerPopover 
        isOpen={isApiKeyPopoverOpen} 
        onClose={() => setIsApiKeyPopoverOpen(false)} 
        anchorRef={apiButtonRef} 
        editedKeys={editedApiKeys} 
        onAddKey={handleAddKey} 
        onDeleteKey={handleDeleteKey} 
        onSave={handleSaveApiKeys} 
        onCancel={handleCancelEditKeys} 
        hasUnsavedChanges={hasUnsavedChanges}
        availableModels={availableModels}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        isLoadingModels={isLoadingModels}
      />
      {modalImageUrl && ( <div className="image-modal-overlay" onClick={handleCloseImageModal}> <span className="image-modal-close" onClick={handleCloseImageModal}>×</span> <img src={modalImageUrl} alt="Enlarged receipt" className="image-modal-content" onClick={(e) => e.stopPropagation()} /> </div> )}
      {isEditModalOpen && editModalData && ( <EditReceiptModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} initialData={editModalData} onSave={handleSaveEditedData} /> )}
      
      <header className="view-header">
        <div className="header-left">
            <h2 style={viewerStyles.headerTitle}>🧾 Receipt Handler</h2>
            <div className="main-view-tabs">
                <button onClick={() => setMainView('processor')} className={`main-view-tab ${mainView === 'processor' ? 'active' : ''}`}>Processor</button>
                <button onClick={() => setMainView('dashboard')} className={`main-view-tab ${mainView === 'dashboard' ? 'active' : ''}`}>Dashboard</button>
            </div>
        </div>
        <div className="header-right">
            <div className="api-config-container">
                <button ref={apiButtonRef} onClick={() => setIsApiKeyPopoverOpen(p => !p)} className="api-config-toggle">API Config ({groqApiKeys.length} keys) {isApiKeyPopoverOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}</button>
            </div>
            <button className="icon-button" onClick={() => screenModeHelperRef.current?.cycleMode()} title="Toggle Full Tab View"><FullscreenIcon /></button>
        </div>
      </header>

      {mainView === 'processor' && (
        <>
            <div className="view-controls">
                <label htmlFor="folder-path-input">Receipts Folder:</label>
                <input id="folder-path-input" type="text" value={receiptFolderPath} onChange={e => setReceiptFolderPath(e.target.value)} placeholder="Relative to component location" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="ocr-language-select" style={{ color: '#888888', whiteSpace: 'nowrap' }}>OCR Language:</label>
                    <select 
                        id="ocr-language-select"
                        value={ocrLanguage} 
                        onChange={e => setOcrLanguage(e.target.value)}
                        style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#ffffff',
                            fontSize: '14px',
                            minWidth: '150px'
                        }}
                    >
                        {OCR_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{backgroundColor: '#1a1a1a', color: '#ffffff'}}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="primary" onClick={handleProcessAll} disabled={isLoading || !receiptFiles.length || !tesseractLoaded || groqApiKeys.length === 0}>
                    <ProcessIcon /> {isLoading ? (ocrProgress > 0 ? `OCR: ${ocrProgress}%` : 'Processing...') : 'Process All'}
                </button>
            </div>
            
            {currentPath && (
                <div style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#1a1a1a', 
                    borderRadius: '6px', 
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: '#888888',
                    lineHeight: '1.6'
                }}>
                    <div><strong style={{ color: '#9b87f5' }}>Component:</strong> {currentPath}</div>
                    <div><strong style={{ color: '#9b87f5' }}>Default Receipts:</strong> {defaultReceiptsFolderPath}</div>
                    <div><strong style={{ color: '#9b87f5' }}>Current Receipts:</strong> {receiptFolderPath}</div>
                    <div><strong style={{ color: '#9b87f5' }}>Processed Output:</strong> {processedFolderPath}</div>
                </div>
            )}
            
            <div className="processor-content-wrapper" style={panelLayoutStyles.wrapper}>
                <div className="main-grid" style={panelLayoutStyles.mainGrid}>
                    <div className="panel file-list-panel">
                        <div className="panel-header is-clickable" onClick={() => handlePanelFocus('files')}>
                            <h4>Receipts ({receiptFiles.length})</h4>
                            <button className="icon-button panel-focus-button" title={focusedPanel === 'files' ? 'Restore Layout' : 'Expand Panel'}>{focusedPanel === 'files' ? <MinimizeIcon/> : <ExpandIcon/>}</button>
                        </div>
                        <div className="file-list">{receiptFiles.length > 0 ? receiptFiles.map(file => (<div key={file.path} onClick={() => setCurrentReceipt(file)} className={`file-list-item ${currentReceipt?.path === file.path ? 'is-active' : ''}`} title={file.name}><span className="file-name">{file.name}</span><span className="file-status">{processedData[file.path]?.json && <CheckCircleIcon />}{processedData[file.path]?.error && <XCircleIcon />}</span></div>)) : <div className="empty-state">No receipts found.</div>}</div>
                    </div>

                    <div className="panel processing-panel rh-panel">
                        <div className="panel-header is-clickable" onClick={() => handlePanelFocus('processing')}>
                            <h3>{currentReceipt ? currentReceipt.name : 'Processing Details'}</h3>
                            <div className="panel-header-actions">
                                <button onClick={(e) => { e.stopPropagation(); handleProcessReceipt(currentReceipt); }} disabled={isLoading || !currentReceipt || !tesseractLoaded || groqApiKeys.length === 0}>Process</button>
                                <button className="icon-button panel-focus-button" onClick={(e) => { e.stopPropagation(); handlePanelFocus('processing'); }} title={focusedPanel === 'processing' ? 'Restore Layout' : 'Expand Panel'}>{focusedPanel === 'processing' ? <MinimizeIcon/> : <ExpandIcon/>}</button>
                            </div>
                        </div>
                        <div className="panel-content-grid">{!tesseractLoaded && !error && <div className="notice is-info">Loading OCR library from CDN...</div>}{error && <div className="notice is-error">{error}</div>}{isLoading && <div className="notice is-info">{currentStatus} {ocrProgress > 0 && `- ${ocrProgress}%`}{detectedLanguage && <span style={{ marginLeft: '8px', color: '#9b87f5' }}>• Detected: {detectedLanguage}</span>}</div>}{!currentReceipt ? (<EmptyStatePlaceholder iconName="file-text" title="Select a Receipt" message="Choose a receipt from the list on the left to view details."/>) : (<div className="card-grid"><div className="card"><h5>Image Preview</h5>{imagePreviewUrl ? <img src={imagePreviewUrl} alt="Receipt preview" className="preview-image" onLoad={() => console.log('[Preview IMG] ✓ Image rendered successfully in browser')} onError={(e) => { console.error('[Preview IMG] ❌ Browser failed to render image'); console.error('[Preview IMG] Error event:', e); console.error('[Preview IMG] Img src:', e.target?.src); }} onClick={async () => { const buffer = await app.vault.readBinary(currentReceipt); setModalImageUrl(URL.createObjectURL(new Blob([buffer]))); }}/> : 'Loading...'}</div><div className="card"><div className="tab-bar"><button onClick={() => setActiveTab('json')} className={activeTab === 'json' ? 'active' : ''}>Extracted Data</button><button onClick={() => setActiveTab('ocr')} className={activeTab === 'ocr' ? 'active' : ''}>Raw OCR Text</button></div><div className="tab-content">{activeTab === 'json' && <pre className="data-pre">{currentReceiptData?.json ? JSON.stringify(currentReceiptData.json, null, 2) : currentReceiptData?.error ? `Error: ${currentReceiptData.error}` : 'Not processed.'}</pre>}{activeTab === 'ocr' && <pre className="data-pre">{currentReceiptData?.ocr || 'No OCR text.'}</pre>}</div></div></div>)}</div>
                    </div>
                </div>

                <div className="panel summary-panel" style={panelLayoutStyles.summaryPanel}>
                    <div className="panel-header is-clickable" onClick={() => handlePanelFocus('summary')}>
                        <h4>Processed Summary (Current Folder)</h4>
                        <button className="icon-button panel-focus-button" title={focusedPanel === 'summary' ? 'Restore Layout' : 'Expand Panel'}>{focusedPanel === 'summary' ? <MinimizeIcon/> : <ExpandIcon/>}</button>
                    </div>
                    <div className="table-container"><table className="summary-table"><thead><tr><th>File</th><th>Merchant</th><th>Date</th><th style={viewerStyles.tableCellRight}>Total</th><th>Actions</th></tr></thead><tbody>{Object.keys(processedData).length > 0 ? Object.entries(processedData).map(([path, data]) => { const file = receiptFiles.find(f => f.path === path); if (!file) return null; return (<tr key={path}><td title={path}>{file.name}</td><td>{data.json?.merchant_name || 'N/A'}</td><td>{data.json?.transaction_date || 'N/A'}</td><td style={viewerStyles.tableCellRightBold}>{data.json?.total_amount != null ? `${data.json.total_amount.toFixed(2)} ${data.json.currency || ''}` : 'N/A'}</td><td className="table-actions"><button className="icon-button" title="View Image" onClick={async () => { try { const buffer = await app.vault.readBinary(file); setModalImageUrl(URL.createObjectURL(new Blob([buffer]))); } catch(err) {} }}><EyeIcon /></button>{(data.json || data.error) && <button className="icon-button" onClick={() => handleOpenEditModal(file, data)} title="Edit Data"><EditIcon /></button>}</td></tr>);}) : <tr><td colSpan="5" style={viewerStyles.tableCellCenter}>No receipts processed in this folder.</td></tr>}</tbody></table></div>
                </div>
            </div>
        </>
      )}
      {mainView === 'dashboard' && (
        <>
          {processedFolderPath && (
            <div style={{ 
              padding: '8px 16px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '6px', 
              margin: '16px',
              fontSize: '12px',
              color: '#888888',
              lineHeight: '1.6'
            }}>
              <div><strong style={{ color: '#9b87f5' }}>Loading from:</strong> {processedFolderPath}</div>
              <div><strong style={{ color: '#9b87f5' }}>Receipts found:</strong> {allProcessedData.length}</div>
            </div>
          )}
          <DashboardView dashboardData={allProcessedData} />
        </>
      )}
    </div>
  );
}

return { ReceiptHandlerView };
```





# DashboardView


```jsx
const { useState, useMemo, useRef, useEffect } = dc;


// =================================================================================
// HELPER & ICONS
// =================================================================================

// A helper function to format currency using the browser's internationalization API
const formatCurrency = (amount, currencyCode) => {
    if (amount == null || !currencyCode) return 'N/A';
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(amount);
    } catch (e) {
        // Fallback for unrecognized currency codes
        return `${amount.toFixed(2)} ${currencyCode}`;
    }
};

const DollarSignIcon = () => <dc.Icon icon="dollar-sign" style={{ fontSize: '24px' }} />;
const ReceiptStatIcon = () => <dc.Icon icon="receipt" style={{ fontSize: '24px' }} />;
const HashIcon = () => <dc.Icon icon="hash" style={{ fontSize: '24px' }} />;

const StatCard = ({ title, value, icon }) => (
    <div className="stat-card">
        <div className="stat-card-icon">{icon}</div>
        <div className="stat-card-info">
            <div className="stat-card-title">{title}</div>
            <div className="stat-card-value">{value}</div>
        </div>
    </div>
);

const useD3 = () => {
    const [isD3Loaded, setIsD3Loaded] = useState(!!window.d3);
    useEffect(() => {
        if (isD3Loaded) return;
        const script = document.createElement("script");
        script.src = "https://d3js.org/d3.v7.min.js";
        script.async = true;
        script.onload = () => setIsD3Loaded(true);
        script.onerror = () => console.error("D3.js failed to load.");
        document.head.appendChild(script);
        return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }, [isD3Loaded]);
    return isD3Loaded;
};

const MonthlySpendingChart = ({ data, currency }) => {
    const chartRef = useRef(null);
    const isD3Loaded = useD3();
    useEffect(() => {
        if (!isD3Loaded || !data || !chartRef.current) return;
        const d3 = window.d3;
        const container = d3.select(chartRef.current);
        container.selectAll("*").remove();
        const { width } = chartRef.current.getBoundingClientRect();
        const height = 300, margin = { top: 40, right: 30, bottom: 40, left: 70 };
        const svg = container.append("svg").attr("viewBox", [0, 0, width, height]);
        const x = d3.scaleBand(data.map(d => d.month), [margin.left, width - margin.right]).padding(0.2);
        const y = d3.scaleLinear([0, d3.max(data, d => d.total)], [height - margin.bottom, margin.top]).nice();
        const currencyFormatter = (value) => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: 'compact' }).format(value); } catch { return d3.format("$,.0f")(value); }};
        svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickSizeOuter(0));
        svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(currencyFormatter));
        svg.selectAll(".domain, .tick line").style("stroke", "#2a2a2a");
        svg.selectAll("text").style("fill", "#888888");
        const purpleGradient = svg.append("defs").append("linearGradient").attr("id", "purpleGradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
        purpleGradient.append("stop").attr("offset", "0%").style("stop-color", "rgba(155, 135, 245, 0.9)").style("stop-opacity", 1);
        purpleGradient.append("stop").attr("offset", "100%").style("stop-color", "rgba(236, 72, 153, 0.9)").style("stop-opacity", 1);
        svg.append("g").attr("fill", "url(#purpleGradient)").selectAll("rect").data(data).join("rect").attr("x", d => x(d.month)).attr("y", d => y(d.total)).attr("height", d => y(0) - y(d.total)).attr("width", x.bandwidth()).attr("rx", 4);
        svg.append("text").attr("x", width / 2).attr("y", margin.top / 2).attr("text-anchor", "middle").style("font-size", "14px").style("fill", "#ffffff").text("Spending Over Time");
    }, [isD3Loaded, data, currency]);
    return <div ref={chartRef} className="chart-container"></div>;
};

const SpendingByMerchantChart = ({ data, currency }) => {
    const chartRef = useRef(null);
    const isD3Loaded = useD3();
    useEffect(() => {
        if (!isD3Loaded || !data || !chartRef.current) return;
        const d3 = window.d3;
        const container = d3.select(chartRef.current);
        container.selectAll("*").remove();
        const { width } = chartRef.current.getBoundingClientRect();
        const height = 300, radius = Math.min(width, height) / 2.5;
        const svg = container.append("svg").attr("viewBox", [-width / 2, -height / 2, width, height]);
        const customColors = ["rgba(155, 135, 245, 0.9)", "rgba(236, 72, 153, 0.9)", "rgba(255, 255, 255, 0.9)", "rgba(167, 139, 250, 0.8)", "rgba(244, 114, 182, 0.8)", "rgba(219, 39, 119, 0.8)", "rgba(139, 92, 246, 0.8)", "rgba(232, 121, 249, 0.8)", "rgba(192, 132, 252, 0.8)", "rgba(251, 207, 232, 0.8)"];
        const color = d3.scaleOrdinal(customColors);
        const pie = d3.pie().sort(null).value(d => d.total);
        const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
        const arcs = pie(data);
        svg.append("g").attr("stroke", "#1a1a1a").attr("stroke-width", 2).selectAll("path").data(arcs).join("path").attr("fill", d => color(d.data.merchant)).attr("d", arc).append("title").text(d => `${d.data.merchant}: ${formatCurrency(d.data.total, currency)}`);
        svg.append("text").attr("text-anchor", "middle").style("font-size", "14px").style("fill", "#ffffff").attr("y", -height/2 + 20).text("Top Spending by Merchant");
    }, [isD3Loaded, data, currency]);
    return <div ref={chartRef} className="chart-container"></div>;
};

const RecentTransactions = ({ receipts }) => (
    <div className="recent-transactions-card">
        <h4>Recent Transactions (All Currencies)</h4>
        <div className="recent-transactions-list">
            {receipts.length > 0 ? (
                receipts.map(r => (
                    <div key={r.path} className="transaction-item">
                        <div className="transaction-info">
                            <span className="transaction-merchant">{r.json.merchant_name || 'Unknown'}</span>
                            <span className="transaction-date">{r.json.transaction_date || 'N/A'}</span>
                        </div>
                        <div className="transaction-amount">{formatCurrency(r.json.total_amount, r.json.currency)}</div>
                    </div>
                ))
            ) : <p className="dashboard-placeholder-small">No transactions found.</p>}
        </div>
    </div>
);


const DashboardView = ({ dashboardData }) => {
    const [dateFilter, setDateFilter] = useState('this_year');
    const [selectedCurrency, setSelectedCurrency] = useState('ALL');
    const [baseCurrency, setBaseCurrency] = useState('USD');
    const [exchangeRates, setExchangeRates] = useState(null);
    const [ratesStatus, setRatesStatus] = useState('idle');

    useEffect(() => {
        const fetchRates = async () => {
            if (selectedCurrency !== 'ALL') return;
            setRatesStatus('loading');
            try {
                const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setExchangeRates({ ...data.rates, [baseCurrency]: 1 }); // Add base currency to rates
                setRatesStatus('success');
            } catch (error) {
                console.error("Failed to fetch exchange rates:", error);
                setRatesStatus('error');
                setExchangeRates(null);
            }
        };
        fetchRates();
    }, [baseCurrency, selectedCurrency]);

    const dateFilteredReceipts = useMemo(() => {
        const now = new Date();
        let startDate;
        if (dateFilter === 'this_month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (dateFilter === 'last_30_days') { startDate = new Date(); startDate.setDate(now.getDate() - 30); }
        else if (dateFilter === 'this_year') startDate = new Date(now.getFullYear(), 0, 1);
        else startDate = new Date(0); // 'all_time'
        
        return dashboardData
            .filter(d => d.json?.transaction_date && d.json.total_amount != null && d.json.currency)
            .filter(d => { try { return new Date(d.json.transaction_date + "T00:00:00") >= startDate; } catch { return false; } })
            .sort((a, b) => new Date(b.json.transaction_date) - new Date(a.json.transaction_date));
    }, [dashboardData, dateFilter]);
    
    const detectedCurrencies = useMemo(() => {
        const allCurrencies = new Set(dateFilteredReceipts.map(r => r.json.currency));
        return Array.from(allCurrencies).sort();
    }, [dateFilteredReceipts]);

    const dashboardStats = useMemo(() => {
        let receiptsToProcess;
        let currencyForDisplay = selectedCurrency;

        if (selectedCurrency === 'ALL') {
            if (ratesStatus !== 'success' || !exchangeRates) {
                 return { totalSpend: 0, receiptCount: 0, avgSpend: 0, topMerchants: [], monthlyData: [], currencyForDisplay: baseCurrency };
            }
            // Convert all amounts to the base currency
            receiptsToProcess = dateFilteredReceipts
                .map(r => {
                    const rate = exchangeRates[r.json.currency];
                    // Only include if we have a conversion rate
                    if (rate) {
                        return { ...r, convertedAmount: r.json.total_amount / rate };
                    }
                    return null;
                })
                .filter(Boolean); // Remove nulls
            currencyForDisplay = baseCurrency;

        } else {
            // Filter by a single currency
            receiptsToProcess = dateFilteredReceipts
                .filter(r => r.json.currency === selectedCurrency)
                .map(r => ({ ...r, convertedAmount: r.json.total_amount })); // Use original amount
        }

        const totalSpend = receiptsToProcess.reduce((sum, r) => sum + (r.convertedAmount || 0), 0);
        const receiptCount = receiptsToProcess.length;
        const avgSpend = receiptCount > 0 ? totalSpend / receiptCount : 0;
        
        const merchantSpending = receiptsToProcess.reduce((acc, r) => { 
            const merchant = r.json.merchant_name || 'Unknown'; 
            acc[merchant] = (acc[merchant] || 0) + (r.convertedAmount || 0); 
            return acc; 
        }, {});
        
        const topMerchants = Object.entries(merchantSpending).map(([merchant, total]) => ({merchant, total})).sort((a,b) => b.total - a.total).slice(0, 10);
        
        const monthlySpending = receiptsToProcess.reduce((acc, r) => { 
            try { 
                const monthKey = r.json.transaction_date.substring(0, 7); 
                acc[monthKey] = (acc[monthKey] || 0) + (r.convertedAmount || 0); 
            } catch {} return acc; 
        }, {});

        const monthlyData = Object.entries(monthlySpending).map(([month, total]) => ({month, total})).sort((a,b) => a.month.localeCompare(b.month));

        return { totalSpend, receiptCount, avgSpend, topMerchants, monthlyData, currencyForDisplay };
    }, [dateFilteredReceipts, selectedCurrency, exchangeRates, ratesStatus, baseCurrency]);

    const allTimeRecentReceipts = useMemo(() => {
        return dashboardData
            .filter(d => d.json?.transaction_date)
            .sort((a, b) => new Date(b.json.transaction_date) - new Date(a.json.transaction_date))
            .slice(0, 15);
    }, [dashboardData]);

    const statCards = [
        { title: "Total Spending", value: formatCurrency(dashboardStats.totalSpend, dashboardStats.currencyForDisplay), icon: <DollarSignIcon /> },
        { title: `Receipts Processed`, value: dashboardStats.receiptCount, icon: <ReceiptStatIcon /> },
        { title: "Average per Receipt", value: formatCurrency(dashboardStats.avgSpend, dashboardStats.currencyForDisplay), icon: <HashIcon /> },
    ];
    
    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h3>Financial Overview</h3>
                <div className="dashboard-filters">
                    <div className="filter-group">
                        <span className="filter-label">Period:</span>
                        <div className="filter-controls">
                            <button onClick={() => setDateFilter('this_month')} className={dateFilter === 'this_month' ? 'active' : ''}>This Month</button>
                            <button onClick={() => setDateFilter('last_30_days')} className={dateFilter === 'last_30_days' ? 'active' : ''}>Last 30 Days</button>
                            <button onClick={() => setDateFilter('this_year')} className={dateFilter === 'this_year' ? 'active' : ''}>This Year</button>
                            <button onClick={() => setDateFilter('all_time')} className={dateFilter === 'all_time' ? 'active' : ''}>All Time</button>
                        </div>
                    </div>
                    {detectedCurrencies.length > 0 && (
                        <div className="filter-group">
                             <span className="filter-label">Currency:</span>
                            <div className="filter-controls">
                                 <button onClick={() => setSelectedCurrency('ALL')} className={selectedCurrency === 'ALL' ? 'active' : ''}>All</button>
                                {detectedCurrencies.map(currency => ( <button key={currency} onClick={() => setSelectedCurrency(currency)} className={selectedCurrency === currency ? 'active' : ''}> {currency} </button> ))}
                            </div>
                        </div>
                    )}
                    {selectedCurrency === 'ALL' && detectedCurrencies.length > 0 && (
                        <div className="filter-group">
                            <span className="filter-label">Convert to:</span>
                             <select className="base-currency-select" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
                                {detectedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {ratesStatus === 'loading' && <span className="rates-status">Loading rates...</span>}
                            {ratesStatus === 'error' && <span className="rates-status error">Failed to load rates.</span>}
                        </div>
                    )}
                </div>
            </div>
            {dashboardData.length === 0 ? <div className="dashboard-placeholder">No processed receipts found.</div> : 
             dashboardStats.receiptCount === 0 ? <div className="dashboard-placeholder">No data for the selected filters.</div> :
            (<>
                <div className="stats-grid">{statCards.map(s => <StatCard key={s.title} {...s} />)}</div>
                <div className="charts-grid">
                    <div className="dashboard-card"><MonthlySpendingChart data={dashboardStats.monthlyData} currency={dashboardStats.currencyForDisplay} /></div>
                    <div className="dashboard-card"><SpendingByMerchantChart data={dashboardStats.topMerchants} currency={dashboardStats.currencyForDisplay} /></div>
                </div>
                <RecentTransactions receipts={allTimeRecentReceipts} />
            </>)}
        </div>
    );
};

return { DashboardView }
```



# ScreenModeHelper


```jsx
const { useState, useEffect, useRef, useCallback } = dc;


// =================================================================================
// SCREEN MODE HELPER (Unchanged)
// =================================================================================
const ScreenModeHelper = ({ helperRef, containerRef }) => {
  const [activeMode, setActiveMode] = useState("default");
  const originalParentRefForFullTab = useRef(null);
  const originalParentPositionRefForFullTab = useRef(null);
  const originalPositionPlaceholderRef = useRef(null);

  const findNearestAncestorWithClass = (element, className) => {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
      if (current.classList && current.classList.contains(className)) return current;
      current = current.parentNode;
    }
    return null;
  };

  const findDirectChildByClass = (parent, className) => {
    if (!parent) return null;
    for (const child of parent.children) {
      if (child.classList && child.classList.contains(className)) return child;
    }
    return null;
  };

  const applyFullTabStyle = (container) => {
    if (!container) return;
    const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
    if (!targetPaneContent) return;
    const currentParent = container.parentNode;
    if (!currentParent) return;
    const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
    originalParentRefForFullTab.current = currentParent;
    const placeholder = document.createElement('div');
    placeholder.className = 'screen-mode-placeholder';
    placeholder.style.display = 'none';
    currentParent.insertBefore(placeholder, container.nextSibling || null);
    originalPositionPlaceholderRef.current = placeholder;
    currentParent.removeChild(container);
    contentWrapper.appendChild(container);
    const computedParentPosition = window.getComputedStyle(contentWrapper).position;
    originalParentPositionRefForFullTab.current = { element: contentWrapper, originalInlinePosition: contentWrapper.style.position };
    if (computedParentPosition === 'static') {
      contentWrapper.style.position = "relative";
    }
    Object.assign(container.style, { position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", margin: "0", border: "none", borderRadius: "0", zIndex: 100 });
  };

  const revertFullTabStyle = useCallback(() => {
    const container = containerRef.current;
    if (!container || !originalParentRefForFullTab.current || !originalPositionPlaceholderRef.current) return;
    const originalParent = originalParentRefForFullTab.current;
    const placeholder = originalPositionPlaceholderRef.current;
    if (container.parentNode) container.parentNode.removeChild(container);
    originalParent.insertBefore(container, placeholder);
    originalParent.removeChild(placeholder);
    if (originalParentPositionRefForFullTab.current?.element) {
      originalParentPositionRefForFullTab.current.element.style.position = originalParentPositionRefForFullTab.current.originalInlinePosition;
    }
    Object.assign(container.style, { position: '', top: '', left: '', width: '', height: '', zIndex: '', margin: '', border: '', borderRadius: '' });
    originalParentRefForFullTab.current = null;
    originalPositionPlaceholderRef.current = null;
    originalParentPositionRefForFullTab.current = null;
  }, [containerRef]);

  const toggleMode = useCallback((requestedMode) => {
    const container = containerRef.current;
    if (!container || activeMode === requestedMode) return;
    if (activeMode === 'fullTab') revertFullTabStyle();
    if (requestedMode === 'fullTab') applyFullTabStyle(container);
    setActiveMode(requestedMode);
  }, [activeMode, containerRef, revertFullTabStyle]);

  const cycleMode = useCallback(() => {
    toggleMode(activeMode === 'fullTab' ? 'default' : 'fullTab');
  }, [activeMode, toggleMode]);

  useEffect(() => {
    if (helperRef) helperRef.current = { toggleMode, cycleMode };
  }, [helperRef, toggleMode, cycleMode]);

  return null;
};

return { ScreenModeHelper}
```


# ViewStyles

```jsx
function getStyles() {
  const globalCss = `
    .view-container { 
      display: flex; flex-direction: column; gap: 16px; padding: 16px; 
      background-color: #0a0a0a; height: 100%; box-sizing: border-box;
      position: relative; color: #ffffff;
    }
    
    /* --- MODERN DASHBOARD STYLES --- */
    .dashboard-container { padding: 16px 0; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; flex-grow: 1; min-height: 0; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .dashboard-header h3 { margin: 0; font-size: 1.5em; color: #ffffff; }
    .dashboard-filters { display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; }
    .filter-group { display: flex; align-items: center; gap: 8px; }
    .filter-label { color: #888888; font-size: 0.9em; font-weight: 500; }
    .filter-controls { display: flex; gap: 8px; background-color: #1a1a1a; border-radius: 6px; padding: 4px; }
    .filter-controls button { background: none; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; color: #888888; font-weight: 500; transition: all 0.2s ease; }
    .filter-controls button:hover { color: #ffffff; background-color: #2a2a2a; }
    .filter-controls button.active { color: #ffffff; background-color: rgba(155, 135, 245, 0.8); }
    .base-currency-select { 
      background-color: #1a1a1a; border: 1px solid #2a2a2a; 
      border-radius: 6px; padding: 6px 10px; color: #ffffff; font-weight: 500;
    }
    .rates-status { font-size: 0.85em; color: #666666; font-style: italic; }
    .rates-status.error { color: #ef4444; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card { background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 16px; }
    .stat-card-icon { color: rgba(155, 135, 245, 0.8); background-color: rgba(155, 135, 245, 0.1); border-radius: 50%; padding: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-card-title { font-size: 0.9em; color: #888888; margin-bottom: 4px; }
    .stat-card-value { font-size: 1.4em; font-weight: 600; color: #ffffff; }
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .dashboard-card { background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px; min-height: 340px; display: flex; flex-direction: column; }
    .chart-container { width: 100%; height: 100%; flex-grow: 1; }
    .recent-transactions-card { background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; }
    .recent-transactions-card h4 { margin: 0 0 12px 0; color: #ffffff; }
    .recent-transactions-list { overflow-y: auto; max-height: 250px; }
    .transaction-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 8px; border-top: 1px solid #2a2a2a; }
    .transaction-item:first-child { border-top: none; }
    .transaction-info { display: flex; flex-direction: column; gap: 2px; }
    .transaction-merchant { font-weight: 500; color: #ffffff; }
    .transaction-date { font-size: 0.85em; color: #888888; }
    .transaction-amount { font-weight: 600; font-family: var(--font-monospace); color: #ffffff; }
    .dashboard-placeholder { display: flex; align-items: center; justify-content: center; height: 300px; width: 100%; color: #666666; font-style: italic; background-color: #1a1a1a; border: 2px dashed #2a2a2a; border-radius: 8px; text-align: center; padding: 20px; }
    .dashboard-placeholder-small { text-align: center; padding: 20px; color: #666666; }
    
    /* --- CORE COMPONENT STYLES --- */
    input, button, select { font-family: var(--font-sans); font-size: var(--font-ui-small); }
    input[type="text"], input[type="password"] { background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 8px 12px; color: #ffffff; }
    button { background-color: #1a1a1a; border: 1px solid #2a2a2a; color: #ffffff; border-radius: 6px; padding: 8px 14px; cursor: pointer; transition: all 0.2s ease; }
    button:hover { background-color: #2a2a2a; }
    button.primary { background-color: rgba(155, 135, 245, 0.8); border-color: rgba(155, 135, 245, 0.8); }
    button.primary:hover { background-color: rgba(155, 135, 245, 1); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .view-header { display: flex; align-items: center; gap: 16px; flex-shrink: 0; justify-content: space-between; width: 100%; padding-bottom: 16px; border-bottom: 1px solid #2a2a2a; }
    .header-left { display: flex; align-items: center; gap: 24px; flex-grow: 1; overflow: hidden; }
    .header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .main-view-tabs { display: flex; align-items: center; background-color: #1a1a1a; border-radius: 6px; padding: 4px; }
    .main-view-tab { background: none; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; color: #888888; font-weight: 500; }
    .main-view-tab.active { color: #ffffff; background-color: rgba(155, 135, 245, 0.8); }
    .image-modal-overlay, .receipt-edit-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .image-modal-content { max-width: 90vw; max-height: 90vh; width: auto; height: auto; object-fit: contain; }
    .image-modal-close, .receipt-edit-modal-close { position: absolute; top: 20px; right: 35px; color: #fff; font-size: 40px; cursor: pointer; }
    .receipt-edit-modal-content { background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; gap: 15px; overflow: hidden; position: relative; cursor: default; }
    .receipt-edit-modal-content h3 { color: #ffffff; margin: 0 0 10px 0; }
    .modal-form-group { display: flex; flex-direction: column; gap: 8px; flex-grow: 1; min-height: 0; }
    .modal-form-group label { color: #888888; font-weight: 500; }
    .modal-json-textarea { flex-grow: 1; min-height: 150px; background-color: #0a0a0a; font-family: var(--font-monospace); resize: vertical; overflow-y: auto; white-space: pre-wrap; border-radius: 4px; padding: 10px; border: 1px solid #2a2a2a; color: #ffffff; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    
    /* --- API CONFIG STYLES --- */
    .api-config-toggle { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 8px 12px; cursor: pointer; color: #ffffff; font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .api-config-toggle:hover { background-color: #2a2a2a; }
    .api-key-content-wrapper { position: absolute; width: 350px; background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); z-index: 1000; }
    .api-key-content { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
    .api-key-content p { margin: 0; color: #888888; font-size: 0.9em; }
    .api-key-list { display: flex; flex-direction: column; gap: 6px; max-height: 150px; overflow-y: auto; background-color: #0a0a0a; border-radius: 4px; padding: 8px; }
    .api-key-item { display: flex; justify-content: space-between; align-items: center; background-color: #1a1a1a; padding: 6px 10px; border-radius: 4px; }
    .api-key-masked { font-family: var(--font-monospace); font-size: 0.9em; color: #ffffff; }
    .delete-key-btn { background: none; border: none; color: #888888; font-weight: bold; font-size: 1.2em; cursor: pointer; padding: 0 8px; border-radius: 4px; line-height: 1; }
    .delete-key-btn:hover { background-color: #ef4444; color: #ffffff; }
    .empty-state-small { padding: 12px; text-align: center; color: #666666; font-style: italic; font-size: 0.9em; }
    .add-key-form { display: flex; gap: 8px; }
    .add-key-form input { flex-grow: 1; }
    .api-key-actions { display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #2a2a2a; padding-top: 12px; margin-top: 4px; }
    
    /* --- PROCESSOR VIEW STYLES & FOCUS MODE --- */
    .view-controls { display: flex; gap: 16px; align-items: center; flex-shrink: 0; }
    .view-controls label { color: #888888; }
    .view-controls input { flex-grow: 1; }
    
    .processor-content-wrapper {
      flex-grow: 1;
      min-height: 0;
      display: grid;
      gap: 16px;
      grid-template-rows: 1fr auto;
      transition: grid-template-rows 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .main-grid { 
      display: grid; 
      gap: 16px; 
      overflow: hidden; 
      min-height: 0;
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .panel { 
      display: flex; flex-direction: column; 
      background-color: #1a1a1a; 
      border: 1px solid #2a2a2a; 
      border-radius: 8px; 
      overflow: hidden;
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .panel-header { 
      padding: 10px 15px; background-color: #0a0a0a; 
      border-bottom: 1px solid #2a2a2a; 
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
      transition: background-color 0.3s ease;
    }
    .panel-header.is-clickable { cursor: pointer; }
    .panel-header.is-clickable:hover { background-color: #2a2a2a; }
    .panel-header h4, .panel-header h3 { margin: 0; flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ffffff; }
    .panel-header-actions { display: flex; align-items: center; gap: 8px; }
    .panel-focus-button { margin-left: auto; }
    .file-list { overflow-y: auto; padding: 8px; flex-grow: 1; }
    .file-list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 5px; cursor: pointer; white-space: nowrap; color: #ffffff; }
    .file-list-item:hover { background-color: #2a2a2a; }
    .file-list-item.is-active { background-color: rgba(155, 135, 245, 0.8); color: #ffffff; }
    .file-name { text-overflow: ellipsis; overflow: hidden; }
    .file-status { display: flex; align-items: center; }
    .panel-content-grid { padding: 15px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; flex-grow: 1; min-height: 0; opacity: 1; transition: opacity 0.4s ease; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
    .card { padding: 15px; background-color: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 6px; transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(155, 135, 245, 0.2); }
    .card h5 { margin: 0 0 10px 0; color: #ffffff; }
    .preview-image { width: 100%; height: 250px; object-fit: contain; cursor: zoom-in; background-color: #0a0a0a; }
    .data-pre { white-space: pre-wrap; word-break: break-word; background-color: #0a0a0a; max-height: 250px; overflow-y: auto; padding: 10px; border-radius: 4px; color: #ffffff; border: 1px solid #2a2a2a; }
    .notice { padding: 12px; border-radius: 6px; margin-bottom: 10px; white-space: pre-wrap; word-wrap: break-word; line-height: 1.5; }
    .notice.is-error { background-color: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ff6b6b; }
    .notice.is-info { background-color: rgba(155, 135, 245, 0.1); border: 1px solid rgba(155, 135, 245, 0.5); color: rgba(155, 135, 245, 1); }
    .table-container { flex-grow: 1; overflow-y: auto; opacity: 1; transition: opacity 0.4s ease; }
    .summary-table { width: 100%; border-collapse: collapse; }
    .summary-table th { padding: 12px 15px; text-align: left; border-top: 1px solid #2a2a2a; background-color: #0a0a0a; color: #888888; font-weight: 600; }
    .summary-table td { padding: 12px 15px; text-align: left; border-top: 1px solid #2a2a2a; color: #ffffff; transition: background-color 0.2s ease; }
    .summary-table tbody tr:hover td { background-color: #1a1a1a; }
    .table-actions { display: flex; gap: 8px; }
    .icon-button { background: none; border: none; padding: 5px; border-radius: 4px; cursor: pointer; color: #888888; }
    .icon-button:hover { background-color: #2a2a2a; color: #ffffff; }
    .empty-state { padding: 20px; text-align: center; color: #666666; }
    .empty-state-placeholder { text-align: center; color: #666666; padding: 40px 20px; }
    .empty-state-placeholder h4 { color: #888888; margin: 16px 0 8px 0; }
    .empty-state-placeholder p { color: #666666; margin: 0; }
    .tab-bar { display: flex; border-bottom: 1px solid #2a2a2a; margin-bottom: 10px; }
    .tab-bar button { background: none; border: none; padding: 10px 15px; cursor: pointer; color: #888888; border-bottom: 2px solid transparent; }
    .tab-bar button.active { border-bottom-color: rgba(155, 135, 245, 0.8); color: #ffffff; font-weight: 500; }
    .tab-content { color: #ffffff; }
  `;

  return {
    headerTitle: { margin: 0, alignSelf: 'center', whiteSpace: 'nowrap', color: '#ffffff' },
    flexRow: { display: 'flex', gap: '8px' },
    panelHeaderSpaceBetween: { justifyContent: 'space-between' },
    tableCellRight: { textAlign: 'right' },
    tableCellRightBold: { textAlign: 'right', fontWeight: '500', color: '#ffffff' },
    tableCellCenter: { textAlign: 'center', padding: '20px', color: '#666666' },
    iconGreen: { color: "#10b981" },
    iconRed: { color: "#ef4444" },
    globalCss: globalCss,
  };
}

return { getStyles };
```
