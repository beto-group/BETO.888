





# ViewComponent

```jsx
const { useState, useEffect, useMemo, useRef } = dc;

// =====================================================================
// UTILITY & RENDERER COMPONENTS
// =====================================================================

function jsonReplacer(key, value) {
  if (key === '$parent' || key === '$sections' || key === '$blocks' || key === 'file') {
    if (value && value.$path) return `[Reference to ${value.$path}]`;
    return `[Circular Reference]`;
  }
  if (value && value.isLuxonDateTime) return value.toISO();
  return value;
}

function ResultItem({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const getDisplayName = (data) => {
    if (typeof data !== 'object' || data === null) return String(data);
    if (data.$name) return String(data.$name);
    if (data.text) { const text = String(data.text); return text.length > 80 ? text.substring(0, 77) + '...' : text; }
    if (data.file?.path) return data.file.path;
    return "Untitled Item";
  };
  const displayName = getDisplayName(item);
  const itemStyles = { container: { padding: '10px 12px', borderBottom: '1px solid #444', backgroundColor: '#2c2c2e', color: '#ddd' }, header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }, name: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }, buttonContainer: { display: 'flex', gap: '8px', flexShrink: 0 }, button: { padding: '2px 8px', backgroundColor: '#555', border: 'none', borderRadius: '3px', color: '#eee', cursor: 'pointer' }, pre: { marginTop: '8px', backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '300px', overflow: 'auto' }, fieldsHeader: { fontSize: '12px', color: '#999', marginTop: '12px', marginBottom: '4px', fontFamily: 'monospace' } };
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
}

// =====================================================================
// HELPER COMPONENTS
// =====================================================================

function TagHelper({ searchTerm, onTagSelect }) { const [allTags, setAllTags] = useState(null); useEffect(() => { try { const pages = dc.api.query("@page"); const tagSet = new Set(); for (const note of pages) { for (const rawTag of note.$tags || []) { tagSet.add(rawTag.replace(/^#/, "")); } } setAllTags(Array.from(tagSet).sort()); } catch (e) { console.error("Datacore Explorer: Failed to fetch tags.", e); setAllTags([]); } }, []); const filteredTags = useMemo(() => { if (allTags === null) return null; if (!searchTerm) return allTags; return allTags.filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())); }, [allTags, searchTerm]); const styles = { container: { backgroundColor: '#3c3c3c', padding: '8px', borderRadius: '4px', border: '1px solid #555' }, list: { maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }, button: { width: '100%', textAlign: 'left', padding: '4px 8px', border: 'none', background: 'none', color: '#b0e0e6', cursor: 'pointer', borderRadius: '3px', marginBottom: '2px', fontFamily: 'monospace' }, hover: { backgroundColor: '#555' }, message: { color: '#999', fontSize: '12px', textAlign: 'center', margin: '5px 0' } }; return ( <div style={styles.container}> <div style={styles.list}> {filteredTags === null ? <p style={styles.message}>Loading tags...</p> : filteredTags.length > 0 ? filteredTags.map(tag => ( <button key={tag} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onTagSelect(tag)}>#{tag}</button> )) : <p style={styles.message}>{searchTerm ? "No tags match." : "No tags found."}</p>} </div> </div> ); }
function FolderHelper({ searchTerm, onFolderSelect }) { const [allFolders, setAllFolders] = useState(null); useEffect(() => { try { const pages = dc.api.query("@page"); const folderSet = new Set(); for (const page of pages) { const path = page.$path; const lastSlashIndex = path.lastIndexOf('/'); if (lastSlashIndex > -1) folderSet.add(path.substring(0, lastSlashIndex)); } setAllFolders(Array.from(folderSet).sort()); } catch (e) { console.error("Datacore Explorer: Failed to fetch folders.", e); setAllFolders([]); } }, []); const filteredFolders = useMemo(() => { if (allFolders === null) return null; if (!searchTerm) return allFolders; return allFolders.filter(folder => folder.toLowerCase().includes(searchTerm.toLowerCase())); }, [allFolders, searchTerm]); const styles = { container: { backgroundColor: '#3c3c3c', padding: '8px', borderRadius: '4px', border: '1px solid #555' }, list: { maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }, button: { width: '100%', textAlign: 'left', padding: '4px 8px', border: 'none', background: 'none', color: '#a3be8c', cursor: 'pointer', borderRadius: '3px', marginBottom: '2px', fontFamily: 'monospace' }, hover: { backgroundColor: '#555' }, message: { color: '#999', fontSize: '12px', textAlign: 'center', margin: '5px 0' } }; return ( <div style={styles.container}> <div style={styles.list}> {filteredFolders === null ? <p style={styles.message}>Loading folders...</p> : filteredFolders.length > 0 ? filteredFolders.map(folder => ( <button key={folder} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onFolderSelect(folder)}>📁 {folder}</button> )) : <p style={styles.message}>{searchTerm ? "No folders match." : "No folders found."}</p>} </div> </div> ); }
function FileHelper({ searchTerm, onFileSelect }) { const [allFiles, setAllFiles] = useState(null); useEffect(() => { try { const pages = dc.api.query("@page"); setAllFiles(pages.map(p => p.$path).sort()); } catch (e) { console.error("Datacore Explorer: Failed to fetch files.", e); setAllFiles([]); } }, []); const filteredFiles = useMemo(() => { if (allFiles === null) return null; if (!searchTerm) return allFiles; const lowerCaseSearch = searchTerm.toLowerCase(); return allFiles.filter(file => file.toLowerCase().includes(lowerCaseSearch)); }, [allFiles, searchTerm]); const styles = { container: { backgroundColor: '#3c3c3c', padding: '8px', borderRadius: '4px', border: '1px solid #555' }, list: { maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }, button: { width: '100%', textAlign: 'left', padding: '4px 8px', border: 'none', background: 'none', color: '#d8b9ff', cursor: 'pointer', borderRadius: '3px', marginBottom: '2px', fontFamily: 'monospace' }, hover: { backgroundColor: '#555' }, message: { color: '#999', fontSize: '12px', textAlign: 'center', margin: '5px 0' } }; return (<div style={styles.container}><div style={styles.list}>{filteredFiles === null ? <p style={styles.message}>Loading files...</p> : filteredFiles.length > 0 ? filteredFiles.map(file => (<button key={file} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onFileSelect(file)}>📄 {file}</button>)) : <p style={styles.message}>{searchTerm ? "No files match." : "No files found."}</p>}</div></div>); }
function GenericPropertyHelper({ searchTerm, onPropertySelect }) { const [allProperties, setAllProperties] = useState(null); useEffect(() => { try { const allItems = dc.api.query("@page OR @task"); const propertySet = new Set(); const ignoredKeys = new Set(['$parent', '$blocks', '$sections', '$frontmatter', 'file', 'text', '$name', '$path']); for (const item of allItems) { for (const key of Object.keys(item)) { if (!ignoredKeys.has(key)) propertySet.add(key); } if (item.$frontmatter && typeof item.$frontmatter === 'object') { for (const key of Object.keys(item.$frontmatter)) { if (!ignoredKeys.has(key)) propertySet.add(key); } } } setAllProperties(Array.from(propertySet).sort()); } catch (e) { console.error("Datacore Explorer: Failed to fetch properties.", e); setAllProperties([]); } }, []); const filteredProperties = useMemo(() => { if (allProperties === null) return null; if (!searchTerm) return allProperties; const lowerCaseSearch = searchTerm.toLowerCase(); return allProperties.filter(prop => prop.toLowerCase().includes(lowerCaseSearch)); }, [allProperties, searchTerm]); const styles = { container: { backgroundColor: '#3c3c3c', padding: '8px', borderRadius: '4px', border: '1px solid #555' }, list: { maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }, button: { width: '100%', textAlign: 'left', padding: '4px 8px', border: 'none', background: 'none', color: '#ebcb8b', cursor: 'pointer', borderRadius: '3px', marginBottom: '2px', fontFamily: 'monospace' }, hover: { backgroundColor: '#555' }, message: { color: '#999', fontSize: '12px', textAlign: 'center', margin: '5px 0' } }; return ( <div style={styles.container}> <div style={styles.list}> {filteredProperties === null ? <p style={styles.message}>Loading fields...</p> : filteredProperties.length > 0 ? filteredProperties.map(prop => ( <button key={prop} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onPropertySelect(prop)}> {prop.startsWith('$') ? `⚡ ${prop}` : `🔑 ${prop}`} </button> )) : <p style={styles.message}>{searchTerm ? "No fields match." : "No fields found."}</p>} </div> </div> ); }
function ComparisonOperatorHelper({ onOperatorSelect }) { const operators = ['==', '!=', '>', '>=', '<', '<=', '.contains']; const styles = { container: { backgroundColor: '#3c3c3c', padding: '8px', borderRadius: '4px', border: '1px solid #555' }, list: { display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }, button: { padding: '4px 10px', border: '1px solid #777', background: '#5a5a5a', color: '#b48ead', cursor: 'pointer', borderRadius: '3px', fontFamily: 'monospace', fontSize: '14px' }, hover: { backgroundColor: '#6f6f6f' }, message: { color: '#999', fontSize: '12px', textAlign: 'center', margin: '5px 0', width: '100%' } }; return ( <div style={styles.container}> <p style={styles.message}>Select an operator or method:</p> <div style={styles.list}> {operators.map(op => ( <button key={op} style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = styles.button.background} onClick={() => onOperatorSelect(op)}>{op}</button> ))} </div> </div> ); }

// =====================================================================
// INTERACTIVE UI & TOOLBAR COMPONENTS
// =====================================================================

function OperatorSelector({ top, left, onSelect, onClose, isNegated }) { const styles = { container: { position: 'absolute', top: `${top}px`, left: `${left}px`, backgroundColor: '#3c3c3e', border: '1px solid #666', borderRadius: '4px', zIndex: 20, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }, button: { padding: '6px 12px', background: 'none', border: 'none', color: '#eee', cursor: 'pointer', textAlign: 'left', fontFamily: 'monospace' }, hover: { backgroundColor: '#5a5a5a' }, separator: { borderBottom: '1px solid #555', margin: '2px 6px' } }; const ref = useRef(null); useEffect(() => { const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) { onClose(); } }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [onClose]); return ( <div ref={ref} style={styles.container}> <button style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onSelect('AND')}>AND</button> <button style={styles.button} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onSelect('OR')}>OR</button> <div style={styles.separator}></div> <button style={{...styles.button, color: isNegated ? '#a3be8c' : '#ff8a8a' }} onMouseOver={e => e.currentTarget.style.backgroundColor = styles.hover.backgroundColor} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onSelect('!not')}> {isNegated ? 'is not' : '!not'} </button> </div> ); }
function getCoordsFromIndex(textarea, index) { if (!textarea) return { top: 0, left: 0 }; const properties = [ 'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-transform', 'word-spacing', 'text-indent', 'padding-top', 'padding-left', 'padding-right', 'padding-bottom', 'border-top-width', 'border-left-width', 'border-right-width', 'border-bottom-width' ]; const computedStyle = window.getComputedStyle(textarea); const div = document.createElement('div'); div.id = 'input-mirror-div'; document.body.appendChild(div); properties.forEach(prop => { div.style[prop] = computedStyle[prop]; }); div.style.position = 'absolute'; div.style.top = '-9999px'; div.style.left = '0px'; div.style.whiteSpace = 'pre-wrap'; div.style.wordWrap = 'break-word'; div.style.width = `${textarea.clientWidth}px`; div.textContent = textarea.value.substring(0, index); const span = document.createElement('span'); span.textContent = textarea.value.substring(index) || '.'; div.appendChild(span); const coords = { top: span.offsetTop - textarea.scrollTop, left: span.offsetLeft - textarea.scrollLeft }; document.body.removeChild(div); return coords; }
function QueryControls({ onBaseTypeChange, onAppend, onStartFilterWizard }) { const styles = { container: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', padding: '10px', backgroundColor: '#252526', borderRadius: '4px', border: '1px solid #444' }, select: { padding: '6px', backgroundColor: '#5a5a5a', border: '1px solid #777', borderRadius: '4px', color: '#eee', fontFamily: 'monospace' }, button: { padding: '6px 12px', backgroundColor: '#5a5a5a', border: '1px solid #777', borderRadius: '4px', color: '#eee', cursor: 'pointer', fontFamily: 'monospace' }, separator: { borderLeft: '1px solid #555', height: '20px', margin: '0 4px' } }; const baseTypes = [ '@page', '@task', '@file', '@section', '@block', '@block-list', '@codeblock', '@datablock', '@list-item' ]; const addOns = [ { label: '#', value: '#', helper: 'tag', selection: { start_offset: 0, length: 0 }, description: 'Find items with a specific tag.\nExample: #work' }, { label: 'path()', value: 'path("")', helper: 'folder', selection: { start_offset: -2, length: 0 }, description: 'Find items within a specific folder path.\nExample: path("Projects/Active")' }, { label: 'exists()', value: 'exists()', helper: 'property', selection: { start_offset: -1, length: 0 }, description: 'Find items where a specific property exists.\nExample: exists(due)' }, { type: 'separator' }, { label: 'parentof()', value: 'parentof(@page)', selection: { start_offset: -6, length: 5 }, description: 'Find the parents of items matching a sub-query.\nExample: parentof(@task and #urgent)' }, { label: 'childof()', value: 'childof(@page)', selection: { start_offset: -6, length: 5 }, description: 'Find the children of items matching a sub-query.\nExample: childof(@page)' }, { label: 'supertree()', value: 'supertree(@page)', selection: { start_offset: -6, length: 5 }, description: 'Find items and all their parents (inclusive).\nExample: supertree(@codeblock)' }, { label: 'subtree()', value: 'subtree(@page)', selection: { start_offset: -6, length: 5 }, description: 'Find items and all their children (inclusive).\nExample: subtree(@page)' }, { type: 'separator' }, { label: 'connected()', value: 'connected([[]])', helper: 'file', selection: { start_offset: -3, length: 0 }, description: 'Find items linked TO or FROM a specific file.\nExample: connected([[/projects/roadmap]])' }, { label: 'linkedto()', value: 'linkedto([[]])', helper: 'file', selection: { start_offset: -3, length: 0 }, description: 'Find items that link TO a specific file.\nExample: linkedto([[/goals/q3]])' }, { label: 'linkedfrom()', value: 'linkedfrom([[]])', helper: 'file', selection: { start_offset: -3, length: 0 }, description: 'Find items that a specific file links FROM.\nExample: linkedfrom([[/meetings/2023-10-26]])' }, { type: 'separator' }, { label: '$completed', value: '$completed', description: 'Find tasks that are marked as complete.\nExample: @task AND $completed' }, { isFilterWizard: true, label: 'Field Query...', description: 'Build a custom filter for a field.\nExample: rating >= 7\nAlso handles fields with spaces: row["last reviewed"]\nPro-tip: Type `$` to trigger this wizard.' }, ]; return ( <div style={styles.container}> <select style={styles.select} title="Select the base object type for the query (i.e., @page, @task, etc.)" onChange={(e) => onBaseTypeChange(e.target.value)}> <option value="">-- Select Base Type --</option> {baseTypes.map(type => <option key={type} value={type}>{type}</option>)} </select> <div style={styles.separator}></div> {addOns.map((addon, index) => { if (addon.type === 'separator') return <div key={`sep-${index}`} style={styles.separator}></div>; if (addon.isFilterWizard) return <button key={index} style={styles.button} title={addon.description} onClick={onStartFilterWizard}>{addon.label}</button>; return <button key={index} style={styles.button} title={addon.description} onClick={() => onAppend(addon)}>{addon.label}</button>; })} </div> ); }

// =====================================================================
// MAIN APPLICATION COMPONENT
// =====================================================================

function DatacoreQueryExplorer() {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const textareaRef = useRef(null);
  const inputAreaRef = useRef(null);
  const [helperState, setHelperState] = useState({ type: null, step: null, searchTerm: '', startIndex: 0, context: {}, position: { top: 0 } });
  const [operators, setOperators] = useState([]);
  const [activeOperator, setActiveOperator] = useState(null);

  // --- Effects ---
  useEffect(() => { setLoading(true); const handler = setTimeout(() => { const queryToRun = inputValue.trim(); if (!queryToRun) { setResults(null); setLoading(false); setError(null); return; } setError(null); setCurrentPage(1); try { const queryResult = dc.api.query(queryToRun); setResults(queryResult); } catch (e) { setError(e); setResults(null); } setLoading(false); }, 250); return () => clearTimeout(handler); }, [inputValue]);
  useEffect(() => { if (!textareaRef.current) return; const regex = /\b(AND|OR)\b/g; const newOperators = []; let match; while ((match = regex.exec(inputValue)) !== null) { const position = getCoordsFromIndex(textareaRef.current, match.index); const opEndIndex = match.index + match[0].length; const nextChar = inputValue.substring(opEndIndex).trimStart()[0]; newOperators.push({ index: match.index, value: match[0], isNegated: nextChar === '!', position: position }); } setOperators(newOperators); }, [inputValue, textareaRef.current]);
  useEffect(() => { const handleClickOutside = (event) => { if (helperState.type && inputAreaRef.current && !inputAreaRef.current.contains(event.target)) { if (!event.target.closest('[title="Click to change operator"]')) { setHelperState({ type: null }); } } }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [helperState.type]);

  // --- Handlers ---
  const checkAndSetHelpers = (query, cursorPosition) => {
    const textarea = textareaRef.current; if (!textarea) return;
    const currentPosition = { top: textarea.offsetHeight + 2 };

    const triggerChar = query[cursorPosition - 1];
    const textBeforeTrigger = query.substring(0, cursorPosition - 1).trim();
    if (triggerChar === '$' && (textBeforeTrigger === '' || textBeforeTrigger.endsWith('AND') || textBeforeTrigger.endsWith('OR'))) {
        const newQuery = query.slice(0, cursorPosition - 1) + query.slice(cursorPosition);
        setInputValue(newQuery);
        setHelperState({ type: 'filter', step: 'select_property', searchTerm: '', startIndex: cursorPosition - 1, context: {}, position: currentPosition });
        setTimeout(() => textarea.focus(), 0);
        return;
    }
    
    const fileRegex = /(connected|linkedto|linkedfrom)\(\[\[([^\]]*)\]\]\)/g; let match; while ((match = fileRegex.exec(query)) !== null) { const contentStartIndex = match.index + match[1].length + 3; const contentEndIndex = match.index + match[0].length - 2; if (cursorPosition >= contentStartIndex && cursorPosition <= contentEndIndex) { const currentSearchTerm = query.substring(contentStartIndex, contentEndIndex); setHelperState({ type: 'file', searchTerm: currentSearchTerm, startIndex: match.index, context: { function: match[1], fullMatch: match[0] }, position: currentPosition }); return; } } const pathRegex = /path\("([^"]*)"\)/g; while ((match = pathRegex.exec(query)) !== null) { const contentStartIndex = match.index + 6; const contentEndIndex = match.index + match[0].length - 2; if (cursorPosition >= contentStartIndex && cursorPosition <= contentEndIndex) { const currentSearchTerm = query.substring(contentStartIndex, contentEndIndex); setHelperState({ type: 'folder', searchTerm: currentSearchTerm, startIndex: match.index, context: { fullMatch: match[0] }, position: currentPosition }); return; } } const existsRegex = /exists\(([^)]*)\)/g; while ((match = existsRegex.exec(query)) !== null) { const contentStartIndex = match.index + 7; const contentEndIndex = match.index + match[0].length - 1; if (cursorPosition >= contentStartIndex && cursorPosition <= contentEndIndex) { const currentSearchTerm = query.substring(contentStartIndex, contentEndIndex); setHelperState({ type: 'property', searchTerm: currentSearchTerm, startIndex: match.index, context: { fullMatch: match[0] }, position: currentPosition }); return; } }
    const textBeforeCursor = query.substring(0, cursorPosition);
    if (helperState.type === 'filter') return;
    const fileMatch = textBeforeCursor.match(/(connected|linkedto|linkedfrom)\(\[\[([^\]]*)$/); if (fileMatch) { setHelperState({ type: 'file', searchTerm: fileMatch[2], startIndex: fileMatch.index, context: { function: fileMatch[1], fullMatch: fileMatch[0] }, position: currentPosition }); return; }
    const pathMatch = textBeforeCursor.match(/path\("([^"]*)$/); if (pathMatch) { setHelperState({ type: 'folder', searchTerm: pathMatch[1], startIndex: pathMatch.index, context: { fullMatch: pathMatch[0] }, position: currentPosition }); return; }
    const existsMatch = textBeforeCursor.match(/\bexists\(([^)]*)$/); if (existsMatch) { setHelperState({ type: 'property', searchTerm: existsMatch[1], startIndex: existsMatch.index, context: { fullMatch: existsMatch[0] }, position: currentPosition }); return; }
    const tagMatch = textBeforeCursor.match(/#([\w-]*)$/); if (tagMatch) { setHelperState({ type: 'tag', searchTerm: tagMatch[1], startIndex: tagMatch.index, context: { fullMatch: tagMatch[0] }, position: currentPosition }); return; }
    
    setHelperState({ type: null });
  };
  
  const handleBaseTypeChange = (newBase) => { if (!newBase) return; setInputValue(currentQuery => { const baseTypeRegex = /@\w+(-list)?/g; return baseTypeRegex.test(currentQuery) ? currentQuery.replace(baseTypeRegex, newBase) : newBase + (currentQuery.trim() ? " AND " + currentQuery.trim() : ""); }); setHelperState({ type: null }); };
  const handleAppend = (addon) => { const { value: fragment, helper: helperType, selection } = addon; const currentQuery = inputValue.trim(); const prefix = currentQuery === "" ? "" : currentQuery + " AND "; const newQuery = prefix + fragment; setInputValue(newQuery); setTimeout(() => { const textarea = textareaRef.current; if (!textarea) return; textarea.focus(); if (selection) { const selectionStart = newQuery.length + selection.start_offset; const selectionEnd = selectionStart + selection.length; textarea.setSelectionRange(selectionStart, selectionEnd); } else { textarea.setSelectionRange(newQuery.length, newQuery.length); } if (helperType) { const startIndex = prefix.length; let context = { fullMatch: fragment }; if (helperType === 'file') { context.function = fragment.substring(0, fragment.indexOf('(')); } setHelperState({ type: helperType, step: null, searchTerm: '', startIndex: startIndex, context: context, position: { top: textarea.offsetHeight + 2 } }); } else { setHelperState({ type: null }); } }, 0); };
  const handleInputChange = (e) => { const { value, selectionStart } = e.target; setActiveOperator(null); setInputValue(value); if (helperState.type === 'filter' && helperState.step === 'select_property') { const newSearchTerm = value.substring(helperState.startIndex, selectionStart); setHelperState(s => ({ ...s, searchTerm: newSearchTerm })); } };
  const handleCursorMove = (e) => { checkAndSetHelpers(e.target.value, e.target.selectionStart); };
  const handleTextareaScroll = () => { if (!textareaRef.current) return; const regex = /\b(AND|OR)\b/g; const newOperators = []; let match; while ((match = regex.exec(inputValue)) !== null) { const position = getCoordsFromIndex(textareaRef.current, match.index); const opEndIndex = match.index + match[0].length; const nextChar = inputValue.substring(opEndIndex).trimStart()[0]; newOperators.push({ index: match.index, value: match[0], isNegated: nextChar === '!', position: position }); } setOperators(newOperators); setActiveOperator(null); };
  const handleOperatorChange = (newOperatorValue) => { if (!activeOperator) return; const { index, value, isNegated } = activeOperator; let newQuery; const beforeOperator = inputValue.substring(0, index); const afterOperator = inputValue.substring(index + value.length); if (newOperatorValue === 'AND' || newOperatorValue === 'OR') { if (isNegated) { newQuery = beforeOperator + newOperatorValue + afterOperator.trimStart().substring(1); } else { newQuery = beforeOperator + newOperatorValue + afterOperator; } } else if (newOperatorValue === '!not') { if (isNegated) { newQuery = beforeOperator + value + afterOperator.trimStart().substring(1); } else { newQuery = beforeOperator + value + " !" + afterOperator.trimStart(); } } setInputValue(newQuery); setActiveOperator(null); setTimeout(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(index, index); }, 0); };
  const handleHelperSelect = (selectedValue, type) => { const { startIndex, context } = helperState; let replacement = ''; if (type === 'tag') { replacement = `#${selectedValue} `; } else if (type === 'folder') { replacement = `path("${selectedValue}") `; } else if (type === 'file') { replacement = `${context.function}([[${selectedValue}]]) `; } else if (type === 'property') { replacement = `exists(${selectedValue}) `; } const textBeforeFragment = inputValue.substring(0, startIndex); const endOfReplacementIndex = context.fullMatch ? startIndex + context.fullMatch.length : textareaRef.current.selectionEnd; const textAfterFragment = inputValue.substring(endOfReplacementIndex); const newQuery = textBeforeFragment + replacement + textAfterFragment; setInputValue(newQuery); setHelperState({ type: null }); setTimeout(() => { const newCursorPos = (textBeforeFragment + replacement).length; textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos); }, 0); };
  const handleStartFilterWizard = () => { const textarea = textareaRef.current; if (!textarea) return; setInputValue(currentVal => { const trimmed = currentVal.trim(); const newQuery = (trimmed === "" || trimmed.endsWith("AND") || trimmed.endsWith("OR")) ? currentVal : currentVal + " AND "; setHelperState({ type: 'filter', step: 'select_property', searchTerm: '', startIndex: newQuery.length, context: {}, position: { top: textarea.offsetHeight + 2 } }); setTimeout(() => textarea.focus(), 0); return newQuery; }); };
  const handleFilterWizardStep = (selectedValue) => { const { step, context, startIndex } = helperState; if (step === 'select_property') { const propertyText = selectedValue.includes(' ') ? `row["${selectedValue}"]` : selectedValue; const textBefore = inputValue.substring(0, startIndex); const textAfter = inputValue.substring(startIndex + helperState.searchTerm.length); const newQuery = textBefore + propertyText + textAfter; setInputValue(newQuery); setHelperState(s => ({ ...s, step: 'select_operator', context: { ...s.context, property: propertyText }, startIndex: (textBefore + propertyText).length })); } else if (step === 'select_operator') { let textToInsert; let newCursorOffset = 0; if (selectedValue === '.contains') { textToInsert = '.contains()'; newCursorOffset = -1; } else { textToInsert = ` ${selectedValue} `; } const newQuery = inputValue + textToInsert; setInputValue(newQuery); setHelperState({ type: null }); setTimeout(() => { const newCursorPos = newQuery.length + newCursorOffset; textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos); }, 0); } };

  // --- Styles & Render Logic ---
  const styles = { container: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', backgroundColor: '#1e1e1e', color: '#ddd', minHeight: '80vh' }, title: { margin: 0, color: 'white', borderBottom: '1px solid #444', paddingBottom: '10px' }, inputWrapper: { position: 'relative' }, textarea: { width: '100%', minHeight: '80px', padding: '10px', backgroundColor: '#252526', border: '1px solid #444', borderRadius: '4px', fontFamily: 'monospace', color: '#ddd', fontSize: '14px', resize: 'vertical' }, helperContainer: { position: 'absolute', width: '100%', left: 0, zIndex: 10, marginTop: '2px' }, resultsContainer: { flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #666', borderRadius: '4px', overflow: 'hidden' }, list: { flex: 1, overflowY: 'auto' }, paginationControls: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', borderTop: '1px solid #666', backgroundColor: '#252526', flexShrink: 0 }, pageButton: { padding: '4px 12px', margin: '0 10px', backgroundColor: '#555', border: '1px solid #777', borderRadius: '3px', color: '#eee', cursor: 'pointer' }, pageButtonDisabled: { backgroundColor: '#333', color: '#777', cursor: 'not-allowed' }, pageInfo: { minWidth: '100px', textAlign: 'center' }, operatorOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', padding: '10px', border: '1px solid transparent', fontFamily: 'monospace', fontSize: '14px' }, operatorHotspot: { position: 'absolute', cursor: 'pointer', pointerEvents: 'auto', color: '#80cbc4', backgroundColor: 'rgba(128, 203, 196, 0.15)', borderRadius: '3px', borderBottom: '1px dashed #80cbc4' } };
  const renderResults = () => { if (loading) return <p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p>; if (error) return <pre style={{ color: '#ff8a8a', backgroundColor: '#4d2323', padding: '10px' }}><strong>Query Error:</strong> {error.message}</pre>; if (!results) return <p style={{ textAlign: 'center', padding: '20px' }}>Select a base type or type a query to begin.</p>; if (results.length === 0) return <p style={{ textAlign: 'center', padding: '20px' }}>No results found.</p>; const totalPages = Math.ceil(results.length / itemsPerPage); const startIndex = (currentPage - 1) * itemsPerPage; const currentItems = results.slice(startIndex, (startIndex + itemsPerPage)); return ( <div style={styles.resultsContainer}> <div style={styles.list}> {currentItems.map((item, index) => ( <ResultItem key={startIndex + index} item={item} /> ))} </div> {totalPages > 1 && ( <div style={styles.paginationControls}> <button style={{...styles.pageButton, ...(currentPage === 1 && styles.pageButtonDisabled)}} onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1}>Previous</button> <span style={styles.pageInfo}>Page {currentPage} of {totalPages}</span> <button style={{...styles.pageButton, ...(currentPage >= totalPages && styles.pageButtonDisabled)}} onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage >= totalPages}>Next</button> </div> )} </div> ); };
  
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Datacore Query Explorer</h1>
      <div>
        <label htmlFor="query-input" style={{display: 'block', marginBottom: '6px'}}><strong>Live Datacore Query</strong></label>
        <div style={styles.inputWrapper} ref={inputAreaRef}>
          <textarea
            ref={textareaRef}
            id="query-input"
            style={styles.textarea}
            value={inputValue}
            onChange={handleInputChange}
            onScroll={handleTextareaScroll}
            onClick={handleCursorMove}
            onKeyUp={handleCursorMove}
            placeholder='Type a query, or use the buttons below...'
          />
          <div style={styles.operatorOverlay}>{operators.map((op, i) => ( <span key={i} style={{...styles.operatorHotspot, top: `${op.position.top}px`, left: `${op.position.left}px`, width: `${op.value.length}ch`, height: '1.2em' }} onClick={(e) => { e.stopPropagation(); setActiveOperator(op); }} title="Click to change operator"><span style={{opacity: 0}}>{op.value}</span></span> ))}</div>
          {activeOperator && ( <OperatorSelector top={activeOperator.position.top + 20} left={activeOperator.position.left} onSelect={handleOperatorChange} onClose={() => setActiveOperator(null)} isNegated={activeOperator.isNegated} /> )}
          {helperState.type && (
            <div style={{ ...styles.helperContainer, top: `${helperState.position.top}px` }}>
              {helperState.type === 'tag' && <TagHelper searchTerm={helperState.searchTerm} onTagSelect={(val) => handleHelperSelect(val, 'tag')} />}
              {helperState.type === 'folder' && <FolderHelper searchTerm={helperState.searchTerm} onFolderSelect={(val) => handleHelperSelect(val, 'folder')} />}
              {helperState.type === 'file' && <FileHelper searchTerm={helperState.searchTerm} onFileSelect={(val) => handleHelperSelect(val, 'file')} />}
              {helperState.type === 'property' && <GenericPropertyHelper searchTerm={helperState.searchTerm} onPropertySelect={(val) => handleHelperSelect(val, 'property')} />}
              {helperState.type === 'filter' && helperState.step === 'select_property' && ( <GenericPropertyHelper searchTerm={helperState.searchTerm} onPropertySelect={handleFilterWizardStep} /> )}
              {helperState.type === 'filter' && helperState.step === 'select_operator' && ( <ComparisonOperatorHelper onOperatorSelect={handleFilterWizardStep} /> )}
            </div>
          )}
        </div>
      </div>
      <QueryControls onBaseTypeChange={handleBaseTypeChange} onAppend={handleAppend} onStartFilterWizard={handleStartFilterWizard} />
      <div>
        <h3 style={{ margin: '16px 0 10px 0' }}>Results {results ? `(${results.length})` : ''}</h3>
        {renderResults()}
      </div>
    </div>
  );
}

return { BasicView: DatacoreQueryExplorer };
```


