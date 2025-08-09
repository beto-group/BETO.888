



# ViewComponent

```jsx
const { useState, useEffect, useRef, useCallback, useMemo } = dc;

const filename = "_RESOURCES/DATACORE/43 ReceiptTracker/D.q.receipttracker.component.md"

// Import all component parts
const { ScreenModeHelper } = await dc.require(dc.headerLink(filename, "ScreenModeHelper"));
const { DashboardView } = await dc.require(dc.headerLink(filename, "DashboardView"));
const { getStyles } = await dc.require(dc.headerLink(filename, "ViewStyles"));

// Instantiate the styles
const viewerStyles = getStyles();

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
    hasUnsavedChanges
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
                <p>Manage Groq API keys. Changes must be saved.</p>
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
const GROQ_MODEL = "llama3-8b-8192";
const PROCESSED_RECEIPT_MD_FOLDER = "_RESOURCES/DATACORE/43 ReceiptTracker/Receipts/_Processed";
const EXTRACTION_PROMPT = `You are an expert financial assistant specializing in parsing text from receipts. Your task is to extract key information from the provided text and return it ONLY as a valid JSON object. Do not include any other text, greetings, or explanations. Just the JSON. The JSON object should have the following schema: { "merchant_name": "string | null", "transaction_date": "string (YYYY-MM-DD format) | null", "total_amount": "number | null", "currency": "string (e.g., USD, EUR) | null", "items": [ { "description": "string", "quantity": "number", "price": "number" } ] }. If you cannot find a value for a field, use null. For 'total_amount', extract the final, grand total. It should be a number, not a string. For 'transaction_date', do your best to convert it to YYYY-MM-DD format. For 'items', list all purchased items. If you can't parse individual items, return an empty array []. Here is the receipt text to parse: ---`;
function getTextExtractor() { return app?.plugins?.plugins?.['text-extractor']?.api; }
const ProcessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={viewerStyles.iconGreen}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={viewerStyles.iconRed}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const FullscreenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>;
const ExpandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>;
const MinimizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>;

const maskApiKey = (key) => { if (typeof key !== 'string' || key.length < 12) return "Invalid Key"; return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`; };
const getProcessedMdFileName = (fileName) => { const baseName = fileName.substring(0, fileName.lastIndexOf('.')).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'); return `${baseName}.md`; };
const saveExtractedDataToMarkdown = async (receiptFile, extractedJson, ocrText) => {
    const mdFileName = getProcessedMdFileName(receiptFile.name);
    const mdFilePath = `${PROCESSED_RECEIPT_MD_FOLDER}/${mdFileName}`;
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
    try {
        if (!await app.vault.adapter.exists(PROCESSED_RECEIPT_MD_FOLDER)) await app.vault.adapter.mkdir(PROCESSED_RECEIPT_MD_FOLDER);
        await app.vault.adapter.write(mdFilePath, markdownContent);
    } catch (err) { throw new Error(`Could not save processed data to ${mdFilePath}: ${err.message}`); }
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
const loadProcessedDataFromMarkdown = async (receiptFile) => {
    const mdFileName = getProcessedMdFileName(receiptFile.name);
    const mdFilePath = `${PROCESSED_RECEIPT_MD_FOLDER}/${mdFileName}`;
    try {
        if (!await app.vault.adapter.exists(mdFilePath)) return null;
        const content = await app.vault.adapter.read(mdFilePath);
        return parseMdContent(content, mdFilePath);
    } catch (err) { return { error: `Could not load data from ${mdFilePath}: ${err.message}` }; }
};
const EmptyStatePlaceholder = ({ iconPath, title, message }) => (
    <div className="empty-state-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPath}></path></svg>
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
  const [textExtractorApi, setTextExtractorApi] = useState(null);
  const [groqApiKeys, setGroqApiKeys] = useState([]);
  const [editedApiKeys, setEditedApiKeys] = useState([]);
  const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);
  const [receiptFolderPath, setReceiptFolderPath] = useState("_RESOURCES/DATACORE/43 ReceiptTracker/Receipts");
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
  
  const currentBlobUrl = useRef(null);
  const containerRef = useRef(null);
  const screenModeHelperRef = useRef(null);
  const apiButtonRef = useRef(null);

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
    const dashboardData = [];
    const folder = app.vault.getAbstractFileByPath(PROCESSED_RECEIPT_MD_FOLDER);
    if (folder?.children) {
      const mdFiles = folder.children.filter(f => f.extension && f.extension.toLowerCase() === 'md');
      for (const file of mdFiles) {
        try {
          const content = await app.vault.adapter.read(file.path);
          const parsed = parseMdContent(content, file.path);
          if (parsed && !parsed.error && parsed.json) {
            dashboardData.push({ ...parsed, path: file.path });
          }
        } catch(e) { console.error(`Failed to load or parse ${file.path}`, e)}
      }
    }
    setAllProcessedData(dashboardData);
  }, [app.vault]);
  
  useEffect(() => {
    const api = getTextExtractor();
    if (api) { setTextExtractorApi(api); } else { setError("Text Extractor plugin not enabled."); }
    loadAllDashboardData();
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
  }, [loadAllDashboardData]);

  // =======================================================================
  // === MODIFIED `useEffect` FOR ROBUST FOLDER LOADING ====================
  // =======================================================================
  useEffect(() => {
    const loadFilesAndData = async () => {
      setError(null); // Clear previous folder errors
      if (!receiptFolderPath) {
        setReceiptFiles([]);
        setProcessedData({});
        return;
      }
      try {
        const folder = app.vault.getAbstractFileByPath(receiptFolderPath);
        if (folder?.children) {
          const imageFiles = folder.children
            .filter(f => f.extension && ['png', 'jpg', 'jpeg', 'webp'].includes(f.extension.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
          setReceiptFiles(imageFiles);

          const newProcessedData = {};
          for (const file of imageFiles) {
            const loadedData = await loadProcessedDataFromMarkdown(file);
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
  }, [receiptFolderPath, app.vault]);
  
  useEffect(() => { if (!currentReceipt) { setImagePreviewUrl(null); return; } (async () => { try { const buffer = await app.vault.readBinary(currentReceipt); const url = URL.createObjectURL(new Blob([buffer], { type: `image/${currentReceipt.extension}`})); if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current); currentBlobUrl.current = url; setImagePreviewUrl(url); } catch (err) { setError("Could not load image preview."); } })(); return () => { if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current); currentBlobUrl.current = null; } }, [currentReceipt]);
  
  const handleAddKey = (key) => { if (key.trim()) { setEditedApiKeys([...editedApiKeys, key.trim()]); } };
  const handleDeleteKey = (indexToDelete) => { setEditedApiKeys(editedApiKeys.filter((_, index) => index !== indexToDelete)); };
  const handleCancelEditKeys = () => { setEditedApiKeys(groqApiKeys); setIsApiKeyPopoverOpen(false); };
  const handleSaveApiKeys = async () => {
    try {
        const dir = GROQ_API_KEY_PATH.substring(0, GROQ_API_KEY_PATH.lastIndexOf("/"));
        if (!await app.vault.adapter.exists(dir)) await app.vault.adapter.mkdir(dir);
        await app.vault.adapter.write(editedApiKeys.join('\n'));
        setGroqApiKeys(editedApiKeys); setCurrentApiKeyIndex(0); setError(null); setIsApiKeyPopoverOpen(false);
    } catch (err) { setError("Could not save the API keys."); }
  };
  const performOcr = async (file) => { if (!textExtractorApi) throw new Error("Text Extractor not ready."); setCurrentStatus(`(1/2) Extracting text...`); const text = await textExtractorApi.extractText(file); if (!text?.trim()) throw new Error("OCR failed: No text was recognized."); return text; };
  
  const analyzeTextWithGroq = async (ocrText) => {
    if (groqApiKeys.length === 0) { throw new Error("Groq API key is not set."); }
    setCurrentStatus("(2/2) Analyzing text with AI...");
    let lastError = null;
    for (let i = 0; i < groqApiKeys.length; i++) {
      const keyIndexToTry = (currentApiKeyIndex + i) % groqApiKeys.length;
      const apiKey = groqApiKeys[keyIndexToTry];
      try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "system", content: EXTRACTION_PROMPT }, { role: "user", content: ocrText }], temperature: 0.1, response_format: { type: "json_object" } }),
        });
        if (response.ok) { const data = await response.json(); setCurrentApiKeyIndex(keyIndexToTry); return JSON.parse(data.choices[0].message.content); }
        const errorText = await response.text();
        lastError = `Groq API error (Key #${keyIndexToTry + 1}, Status: ${response.status}): ${errorText || "Unknown error"}`;
        if (response.status === 429 || response.status === 403 || response.status >= 500) { console.warn(lastError, "Trying next key..."); continue; } 
        else { throw new Error(lastError); }
      } catch (err) { lastError = `Network or fetch error with Key #${keyIndexToTry + 1}: ${err.message}`; console.warn(lastError, "Trying next key..."); }
    }
    throw new Error(`All API keys failed. Last error: ${lastError}`);
  };

  const handleProcessReceipt = async (receiptFile) => { if (!receiptFile || isLoading) return; setIsLoading(true); setError(null); setCurrentReceipt(receiptFile); let ocrText = ''; let extractedJson = {}; try { ocrText = await performOcr(receiptFile); extractedJson = await analyzeTextWithGroq(ocrText); await saveExtractedDataToMarkdown(receiptFile, extractedJson, ocrText); setProcessedData(prev => ({ ...prev, [receiptFile.path]: { ocr: ocrText, json: extractedJson } })); setActiveTab('json'); loadAllDashboardData(); } catch (err) { setError(`Failed on ${receiptFile.name}: ${err.message}`); setProcessedData(prev => ({ ...prev, [receiptFile.path]: { error: err.message, ocr: ocrText, json: extractedJson } })); } finally { setIsLoading(false); setCurrentStatus(""); } };
  const handleProcessAll = async () => { if (isLoading) return; setIsLoading(true); let finalError = null; for (const file of receiptFiles) { if (!processedData[file.path] || processedData[file.path].error) { setError(null); await handleProcessReceipt(file); const updatedDataForThisFile = await loadProcessedDataFromMarkdown(file); if (updatedDataForThisFile?.error) { finalError = `Processing stopped due to error with ${file.name}: ${updatedDataForThisFile.error}`; break; } } } loadAllDashboardData(); setIsLoading(false); setCurrentStatus(""); setError(finalError); };
  const handleOpenEditModal = (file, data) => { setEditModalData({ file, json: data.json, ocr: data.ocr }); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setEditModalData(null); };
  const handleSaveEditedData = async (editedJson, originalOcr) => { if (!editModalData?.file) return; try { await saveExtractedDataToMarkdown(editModalData.file, editedJson, originalOcr); setProcessedData(prev => ({ ...prev, [editModalData.file.path]: { json: editedJson, ocr: originalOcr } })); loadAllDashboardData(); setError(null); } catch (err) { setError(`Failed to save edited data for ${editModalData.file.name}: ${err.message}`); } finally { handleCloseEditModal(); } };
  const handleCloseImageModal = () => { if (modalImageUrl) URL.revokeObjectURL(modalImageUrl); setModalImageUrl(null); };
  const currentReceiptData = currentReceipt ? processedData[currentReceipt.path] : null;

  return (
    <div ref={containerRef} className="view-container">
      <style>{viewerStyles.globalCss}</style>
      <ScreenModeHelper helperRef={screenModeHelperRef} containerRef={containerRef} />
      <ApiKeyManagerPopover isOpen={isApiKeyPopoverOpen} onClose={() => setIsApiKeyPopoverOpen(false)} anchorRef={apiButtonRef} editedKeys={editedApiKeys} onAddKey={handleAddKey} onDeleteKey={handleDeleteKey} onSave={handleSaveApiKeys} onCancel={handleCancelEditKeys} hasUnsavedChanges={hasUnsavedChanges} />
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
                <input id="folder-path-input" type="text" value={receiptFolderPath} onChange={e => setReceiptFolderPath(e.target.value)} placeholder="Path from vault root" />
                <button className="primary" onClick={handleProcessAll} disabled={isLoading || !receiptFiles.length || !textExtractorApi || groqApiKeys.length === 0}>
                    <ProcessIcon /> {isLoading ? 'Processing...' : 'Process All'}
                </button>
            </div>
            
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
                                <button onClick={(e) => { e.stopPropagation(); handleProcessReceipt(currentReceipt); }} disabled={isLoading || !currentReceipt || !textExtractorApi || groqApiKeys.length === 0}>Process</button>
                                <button className="icon-button panel-focus-button" onClick={(e) => { e.stopPropagation(); handlePanelFocus('processing'); }} title={focusedPanel === 'processing' ? 'Restore Layout' : 'Expand Panel'}>{focusedPanel === 'processing' ? <MinimizeIcon/> : <ExpandIcon/>}</button>
                            </div>
                        </div>
                        <div className="panel-content-grid">{error && <div className="notice is-error">{error}</div>}{isLoading && <div className="notice is-info">{currentStatus}</div>}{!currentReceipt ? (<EmptyStatePlaceholder iconPath="M5 12h14" title="Select a Receipt" message="Choose a receipt from the list on the left to view details."/>) : (<div className="card-grid"><div className="card"><h5>Image Preview</h5>{imagePreviewUrl ? <img src={imagePreviewUrl} alt="Receipt preview" className="preview-image" onClick={async () => { const buffer = await app.vault.readBinary(currentReceipt); setModalImageUrl(URL.createObjectURL(new Blob([buffer]))); }}/> : 'Loading...'}</div><div className="card"><div className="tab-bar"><button onClick={() => setActiveTab('json')} className={activeTab === 'json' ? 'active' : ''}>Extracted Data</button><button onClick={() => setActiveTab('ocr')} className={activeTab === 'ocr' ? 'active' : ''}>Raw OCR Text</button></div><div className="tab-content">{activeTab === 'json' && <pre className="data-pre">{currentReceiptData?.json ? JSON.stringify(currentReceiptData.json, null, 2) : currentReceiptData?.error ? `Error: ${currentReceiptData.error}` : 'Not processed.'}</pre>}{activeTab === 'ocr' && <pre className="data-pre">{currentReceiptData?.ocr || 'No OCR text.'}</pre>}</div></div></div>)}</div>
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
      {mainView === 'dashboard' && (<DashboardView dashboardData={allProcessedData} />)}
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

const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const ReceiptStatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path></svg>;
const HashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>;

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
        svg.selectAll(".domain, .tick line").style("stroke", "var(--background-modifier-border)");
        svg.selectAll("text").style("fill", "var(--text-muted)");
        svg.append("g").attr("fill", "var(--interactive-accent)").selectAll("rect").data(data).join("rect").attr("x", d => x(d.month)).attr("y", d => y(d.total)).attr("height", d => y(0) - y(d.total)).attr("width", x.bandwidth());
        svg.append("text").attr("x", width / 2).attr("y", margin.top / 2).attr("text-anchor", "middle").style("font-size", "14px").style("fill", "var(--text-normal)").text("Spending Over Time");
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
        const color = d3.scaleOrdinal(d3.schemeTableau10);
        const pie = d3.pie().sort(null).value(d => d.total);
        const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
        const arcs = pie(data);
        svg.append("g").attr("stroke", "var(--background-primary)").selectAll("path").data(arcs).join("path").attr("fill", d => color(d.data.merchant)).attr("d", arc).append("title").text(d => `${d.data.merchant}: ${formatCurrency(d.data.total, currency)}`);
        svg.append("text").attr("text-anchor", "middle").style("font-size", "14px").style("fill", "var(--text-normal)").attr("y", -height/2 + 20).text("Top Spending by Merchant");
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
      background-color: var(--background-secondary); height: 100%; box-sizing: border-box;
      position: relative; 
    }
    
    /* --- MODERN DASHBOARD STYLES --- */
    .dashboard-container { padding: 16px 0; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; flex-grow: 1; min-height: 0; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .dashboard-header h3 { margin: 0; font-size: 1.5em; }
    .dashboard-filters { display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; }
    .filter-group { display: flex; align-items: center; gap: 8px; }
    .filter-label { color: var(--text-muted); font-size: 0.9em; font-weight: 500; }
    .filter-controls { display: flex; gap: 8px; background-color: var(--background-secondary-alt); border-radius: 6px; padding: 4px; }
    .filter-controls button { background: none; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; color: var(--text-muted); font-weight: 500; transition: all 0.2s ease; }
    .filter-controls button:hover { color: var(--text-normal); background-color: var(--background-modifier-hover); }
    .filter-controls button.active { color: var(--text-on-accent); background-color: var(--interactive-accent); }
    .base-currency-select { 
      background-color: var(--background-secondary-alt); border: 1px solid var(--background-modifier-border); 
      border-radius: 6px; padding: 6px 10px; color: var(--text-normal); font-weight: 500;
    }
    .rates-status { font-size: 0.85em; color: var(--text-faint); font-style: italic; }
    .rates-status.error { color: var(--color-red); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card { background-color: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 16px; }
    .stat-card-icon { color: var(--interactive-accent); background-color: hsla(var(--interactive-accent-hsl), 0.1); border-radius: 50%; padding: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-card-title { font-size: 0.9em; color: var(--text-muted); margin-bottom: 4px; }
    .stat-card-value { font-size: 1.4em; font-weight: 600; color: var(--text-normal); }
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .dashboard-card { background-color: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 16px; min-height: 340px; display: flex; flex-direction: column; }
    .chart-container { width: 100%; height: 100%; flex-grow: 1; }
    .recent-transactions-card { background-color: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; }
    .recent-transactions-card h4 { margin: 0 0 12px 0; }
    .recent-transactions-list { overflow-y: auto; max-height: 250px; }
    .transaction-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 8px; border-top: 1px solid var(--background-modifier-border); }
    .transaction-item:first-child { border-top: none; }
    .transaction-info { display: flex; flex-direction: column; gap: 2px; }
    .transaction-merchant { font-weight: 500; color: var(--text-normal); }
    .transaction-date { font-size: 0.85em; color: var(--text-muted); }
    .transaction-amount { font-weight: 600; font-family: var(--font-monospace); color: var(--text-normal); }
    .dashboard-placeholder { display: flex; align-items: center; justify-content: center; height: 300px; width: 100%; color: var(--text-faint); font-style: italic; background-color: var(--background-primary); border: 2px dashed var(--background-modifier-border); border-radius: 8px; text-align: center; padding: 20px; }
    .dashboard-placeholder-small { text-align: center; padding: 20px; color: var(--text-faint); }
    
    /* --- CORE COMPONENT STYLES --- */
    input, button, select { font-family: var(--font-sans); font-size: var(--font-ui-small); }
    input[type="text"], input[type="password"] { background-color: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 8px 12px; color: var(--text-normal); }
    .view-header { display: flex; align-items: center; gap: 16px; flex-shrink: 0; justify-content: space-between; width: 100%; padding-bottom: 16px; border-bottom: 1px solid var(--background-modifier-border); }
    .header-left { display: flex; align-items: center; gap: 24px; flex-grow: 1; overflow: hidden; }
    .header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .main-view-tabs { display: flex; align-items: center; background-color: var(--background-secondary-alt); border-radius: 6px; padding: 4px; }
    .main-view-tab { background: none; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; color: var(--text-muted); font-weight: 500; }
    .main-view-tab.active { color: var(--text-on-accent); background-color: var(--interactive-accent); }
    .image-modal-overlay, .receipt-edit-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .image-modal-content { max-width: 90vw; max-height: 90vh; width: auto; height: auto; object-fit: contain; }
    .image-modal-close, .receipt-edit-modal-close { position: absolute; top: 20px; right: 35px; color: #fff; font-size: 40px; cursor: pointer; }
    .receipt-edit-modal-content { background-color: var(--background-primary); border-radius: 8px; padding: 20px; width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; gap: 15px; overflow: hidden; position: relative; cursor: default; }
    .modal-form-group { display: flex; flex-direction: column; gap: 8px; flex-grow: 1; min-height: 0; }
    .modal-json-textarea { flex-grow: 1; min-height: 150px; background-color: var(--background-secondary-alt); font-family: var(--font-monospace); resize: vertical; overflow-y: auto; white-space: pre-wrap; border-radius: 4px; padding: 10px; border: 1px solid var(--background-modifier-border); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    
    /* --- API CONFIG STYLES --- */
    .api-config-toggle { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 8px 12px; cursor: pointer; color: var(--text-normal); font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .api-key-content-wrapper { position: absolute; width: 350px; background-color: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; box-shadow: var(--shadow-l); z-index: 1000; }
    .api-key-content { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
    .api-key-content p { margin: 0; color: var(--text-muted); font-size: 0.9em; }
    .api-key-list { display: flex; flex-direction: column; gap: 6px; max-height: 150px; overflow-y: auto; background-color: var(--background-secondary); border-radius: 4px; padding: 8px; }
    .api-key-item { display: flex; justify-content: space-between; align-items: center; background-color: var(--background-primary-alt); padding: 6px 10px; border-radius: 4px; }
    .api-key-masked { font-family: var(--font-monospace); font-size: 0.9em; color: var(--text-normal); }
    .delete-key-btn { background: none; border: none; color: var(--text-muted); font-weight: bold; font-size: 1.2em; cursor: pointer; padding: 0 8px; border-radius: 4px; line-height: 1; }
    .delete-key-btn:hover { background-color: var(--background-modifier-error); color: var(--text-on-accent); }
    .empty-state-small { padding: 12px; text-align: center; color: var(--text-faint); font-style: italic; font-size: 0.9em; }
    .add-key-form { display: flex; gap: 8px; }
    .add-key-form input { flex-grow: 1; }
    .api-key-actions { display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--background-modifier-border); padding-top: 12px; margin-top: 4px; }
    
    /* --- PROCESSOR VIEW STYLES & FOCUS MODE --- */
    .view-controls { display: flex; gap: 16px; align-items: center; flex-shrink: 0; }
    .view-controls input { flex-grow: 1; }
    
    .processor-content-wrapper {
      flex-grow: 1;
      min-height: 0;
      display: grid;
      gap: 16px;
      grid-template-rows: 1fr auto;
      transition: grid-template-rows 0.4s ease-in-out;
    }
    .main-grid { 
      display: grid; 
      gap: 16px; 
      overflow: hidden; 
      min-height: 0;
      transition: all 0.4s ease-in-out;
    }
    .panel { 
      display: flex; flex-direction: column; 
      background-color: var(--background-primary); 
      border: 1px solid var(--background-modifier-border); 
      border-radius: 8px; 
      overflow: hidden;
      transition: all 0.4s ease-in-out;
    }
    .panel-header { 
      padding: 10px 15px; background-color: var(--background-secondary-alt); 
      border-bottom: 1px solid var(--background-modifier-border); 
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    .panel-header.is-clickable { cursor: pointer; }
    .panel-header.is-clickable:hover { background-color: var(--background-modifier-hover); }
    .panel-header h4, .panel-header h3 { margin: 0; flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .panel-header-actions { display: flex; align-items: center; gap: 8px; }
    .panel-focus-button { margin-left: auto; }
    .file-list { overflow-y: auto; padding: 8px; flex-grow: 1; }
    .file-list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 5px; cursor: pointer; white-space: nowrap; }
    .file-list-item:hover { background-color: var(--background-modifier-hover); }
    .file-list-item.is-active { background-color: var(--interactive-accent); color: var(--text-on-accent); }
    .file-name { text-overflow: ellipsis; overflow: hidden; }
    .panel-content-grid { padding: 15px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; flex-grow: 1; min-height: 0; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
    .card { padding: 15px; background-color: var(--background-secondary); border-radius: 6px; }
    .preview-image { width: 100%; height: 250px; object-fit: contain; cursor: zoom-in; }
    .data-pre { white-space: pre-wrap; word-break: break-word; background-color: var(--background-secondary-alt); max-height: 250px; overflow-y: auto; padding: 10px; border-radius: 4px; }
    .notice.is-error { background-color: var(--background-modifier-error); }
    .notice.is-info { background-color: var(--background-modifier-info); }
    .table-container { flex-grow: 1; overflow-y: auto; }
    .summary-table { width: 100%; border-collapse: collapse; }
    .summary-table th, .summary-table td { padding: 12px 15px; text-align: left; border-top: 1px solid var(--background-modifier-border); }
    .icon-button { background: none; border: none; padding: 5px; border-radius: 4px; cursor: pointer; color: var(--text-muted); }
    .icon-button:hover { background-color: var(--background-modifier-hover); color: var(--text-normal); }
    .empty-state { padding: 20px; text-align: center; color: var(--text-faint); }
    .empty-state-placeholder { text-align: center; color: var(--text-faint); padding: 40px 20px; }
    .empty-state-placeholder svg { margin-bottom: 16px; }
    .tab-bar { display: flex; border-bottom: 1px solid var(--background-modifier-border); margin-bottom: 10px; }
    .tab-bar button { background: none; border: none; padding: 10px 15px; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; }
    .tab-bar button.active { border-bottom-color: var(--interactive-accent); color: var(--text-normal); font-weight: 500; }
  `;

  return {
    headerTitle: { margin: 0, alignSelf: 'center', whiteSpace: 'nowrap' },
    flexRow: { display: 'flex', gap: '8px' },
    panelHeaderSpaceBetween: { justifyContent: 'space-between' },
    tableCellRight: { textAlign: 'right' },
    tableCellRightBold: { textAlign: 'right', fontWeight: '500' },
    tableCellCenter: { textAlign: 'center', padding: '20px', color: 'var(--text-faint)' },
    iconGreen: { color: "var(--color-green)" },
    iconRed: { color: "var(--color-red)" },
    globalCss: globalCss,
  };
}

return { getStyles };
```