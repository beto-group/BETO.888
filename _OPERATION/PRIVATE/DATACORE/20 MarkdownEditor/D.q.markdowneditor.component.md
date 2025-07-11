
# ViewComponent

```jsx
const { useState, useEffect, useRef } = dc;

const headingStyles = {
  sizes: ['', '1.5em', '1.4em', '1.3em', '1.2em', '1.1em', '1.05em'],
  margins: ['', '8px 0', '8px 0', '8px 0', '8px 0', '8px 0', '8px 0'],
};

function renderHeading(line, asBlock = false) {
  const match = line.match(/^(#{1,6})\s+(.*)$/);
  if (!match) return null;
  const [, hashes, text] = match;
  const lvl = hashes.length;
  const size = headingStyles.sizes[lvl];
  const margin = headingStyles.margins[lvl];

  if (asBlock) {
    return `<span style="display: block; font-size: ${size}; font-weight: bold;">${text}</span>`;
  }

  return `<h${lvl} style="margin:${margin};font-size:${size};">${text}</h${lvl}>`;
}

function renderEditModeContent(content) {
  const lines = content.split('\n');
  return `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 1em; margin: 0; padding:0;"><code>` +
    lines.map(line => {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const [, , text] = match;
        const lvl = match[1].length;
        const size = headingStyles.sizes[lvl] || '1em';
        return `<span style="font-weight: bold; font-size: ${size};">${text}</span>`;
      }
      return line;
    }).join('\n') +
  `</code></pre>`;
}

function renderMarkdownLine(line) {
  return renderHeading(line);
}

function renderContentByMode(content, mode, strictLineBreaks) {
  if (mode === 'source') {
    let output = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    if (content.endsWith('\n')) output += '<br data-trailing-line />';
    return output;
  }

  if (mode === 'edit') {
    let html = renderEditModeContent(content);
    if (content.endsWith('\n')) html += '<br data-trailing-line />';
    return html;
  }

  const commonParagraphStyle = `white-space: normal; margin-bottom: 28px; word-wrap: break-word;`;
  const truncateStyle = `overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; text-overflow: ellipsis;`;

  if (!strictLineBreaks) {
    return content.split('\n').map(line => {
      const parsed = renderMarkdownLine(line);
      if (parsed) return parsed;
      const escaped = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div style="${commonParagraphStyle} ${truncateStyle}">${escaped}</div>`;
    }).join('');
  }

  const paragraphs = content.split(/\n{2,}/).map(paragraph => {
    const lines = paragraph.split('\n');
    if (lines.length === 0 || lines.every(line => line.trim() === '')) return '';

    let paragraphHtml = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = renderMarkdownLine(line);
      if (parsed) {
        paragraphHtml += parsed;
        continue;
      }

      let escaped = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const hasTrailingSpaces = /\s{2,}$/.test(line);
      if (hasTrailingSpaces) {
        paragraphHtml += `<div class="soft-break">${escaped}</div>`;
      } else {
        paragraphHtml += escaped;
        if (i < lines.length - 1 && line.trim() !== '') paragraphHtml += ' ';
      }
    }

    if (paragraphHtml.trim() === '' || paragraphHtml.trim() === '<br>') return '';
    return `<div style="${commonParagraphStyle}">${paragraphHtml}</div>`;
  }).filter(p => p !== '');

  return paragraphs.join('');
}

async function getRawContent(path) {
  let file = app.vault.getAbstractFileByPath(path);
  if (!file) {
    const name = path.split('/').pop();
    const matches = app.vault.getMarkdownFiles().filter(f => f.name === name);
    if (matches.length > 1) console.warn(`Multiple files found with name ${name}. Using the first match.`);
    file = matches[0];
  }
  if (!file) throw new Error('File not found: ' + path);
  return await app.vault.read(file);
}

async function setRawContent(path, content) {
  let file = app.vault.getAbstractFileByPath(path);
  if (!file) {
    const name = path.split('/').pop();
    const matches = app.vault.getMarkdownFiles().filter(f => f.name === name);
    if (matches.length > 1) console.warn(`Multiple files found with name ${name}. Using the first match.`);
    file = matches[0];
  }
  if (!file) throw new Error('File not found: ' + path);
  return await app.vault.modify(file, content);
}

function applyWindowStyle(container) {
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: 10000,
    backgroundColor: '#222'
  });
}

function applyScreenMode(isWindow, container, originalParentRef) {
  if (isWindow) {
    if (!originalParentRef.current) originalParentRef.current = container.parentNode;
    document.body.appendChild(container);
    applyWindowStyle(container);
  } else if (originalParentRef.current) {
    originalParentRef.current.appendChild(container);
    originalParentRef.current = null;
  }
}

const ScreenModeHelper = ({ isWindow, onToggleWindow }) => (
  <button
    onClick={() => onToggleWindow(prev => !prev)}
    title="Toggle Fullscreen"
    style={{
      padding: '4px 8px',
      background: '#444',
      color: '#fff',
      border: 'none',
      borderRadius: 4,
      cursor: 'pointer',
      zIndex: 10001
    }}
  >⛶</button>
);

function BasicView() {
  const containerRef = useRef(null);
  const originalParentRef = useRef(null);
  const contentRef = useRef(null);

  const [fileName, setFileName] = useState('TestFile');
  const [isWindow, setIsWindow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rawContent, setRawContentState] = useState('');
  const [mode, setMode] = useState('source');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [strictLineBreaks, setStrictLineBreaks] = useState(false);

  const files = dc.useQuery(`@page and $name = "${fileName}"`);

  useEffect(() => {
    const setting = app.vault.getConfig("strictLineBreaks");
    setStrictLineBreaks(!!setting);
  }, []);

  useEffect(() => {
    (async () => {
      if (files.length) {
        try {
          const md = await getRawContent(files[0].$path);
          setRawContentState(md);
        } catch (e) {
          console.error('Failed to load file:', e);
          setRawContentState('');
        }
      }
    })();
  }, [files, fileName]);

  useEffect(() => {
    if (containerRef.current) {
      Object.assign(containerRef.current.style, {
        height: '66vh',
        width: '100%',
        padding: 0,
        border: '2px solid white',
        borderRadius: 8,
        position: 'relative',
        backgroundColor: 'transparent',
        boxSizing: 'border-box',
        overflow: 'hidden'
      });
      applyScreenMode(isWindow, containerRef.current, originalParentRef);
    }
  }, [isWindow]);

  const save = async () => {
    if (!files.length) return;
    setSaving(true);
    try {
      await setRawContent(files[0].$path, rawContent);
    } catch (e) {
      console.error('Save failed:', e);
    }
    setSaving(false);
  };

  const extractContentFromHtml = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const processNode = (node, result = []) => {
      if (node.nodeType === 3) {
        result.push(node.textContent);
      } else if (node.nodeName === 'BR') {
        result.push('\n');
      } else {
        for (const child of node.childNodes) {
          processNode(child, result);
        }
        if (['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName) &&
            node.nextSibling &&
            !['BR'].includes(node.nextSibling.nodeName)) {
          result.push('\n');
        }
      }
      return result;
    };
    return processNode(tempDiv).join('');
  };

  const getCaretPosition = (editableDiv) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableDiv);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const setCaretPosition = (editableDiv, pos) => {
    const setPosition = (node, remaining) => {
      if (!node || remaining <= 0) return [remaining, false];
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent.length;
        if (textLength >= remaining) {
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(node, remaining);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          return [0, true];
        } else {
          return [remaining - textLength, false];
        }
      }
      for (let child of node.childNodes) {
        const [newRemaining, done] = setPosition(child, remaining);
        if (done) return [newRemaining, done];
        remaining = newRemaining;
      }
      return [remaining, false];
    };
    setPosition(editableDiv, pos);
  };

  const themeClass = isDarkMode ? 'local-dark-mode' : 'local-light-mode';

  return (
    <div ref={containerRef} className={themeClass} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: isDarkMode ? '#333' : '#f3f3f3', padding: '8px', borderBottom: `1px solid ${isDarkMode ? '#555' : '#ccc'}` }}>
        <input
          type='text'
          value={fileName}
          onInput={e => setFileName(e.target.value)}
          placeholder='Filename'
          style={{ padding: 4, borderRadius: 4, border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`, background: isDarkMode ? '#222' : '#fff', color: isDarkMode ? '#e0e0e0' : '#000', width: 150 }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ padding: '4px 8px', background: '#0078d4', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >{saving ? 'Saving…' : 'Save'}</button>
          <button
            onClick={() => console.log('[Current content]:', rawContent)}
            style={{ padding: '4px 8px', background: '#666', color: '#fff', border: 'none', borderRadius: 4 }}
          >Debug</button>
          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            style={{ padding: '4px 8px', background: isDarkMode ? '#444' : '#eee', color: isDarkMode ? '#fff' : '#000', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >{isDarkMode ? '🌙' : '☀️'}</button>
          <ScreenModeHelper isWindow={isWindow} onToggleWindow={setIsWindow} />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ padding: '4px 8px', background: isDarkMode ? '#444' : '#eee', color: isDarkMode ? '#fff' : '#000', border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`, borderRadius: 4, cursor: 'pointer' }}
          >
            <option value="source">Source</option>
            <option value="edit">Edit</option>
            <option value="preview">Preview</option>
          </select>
        </div>
      </div>
      <div
        ref={contentRef}
        contentEditable={mode !== 'preview'}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: renderContentByMode(rawContent, mode, strictLineBreaks) }}
        style={{
          flex: 1,
          width: isWindow ? '77%' : '100%',
          margin: isWindow ? 'auto' : undefined,
          padding: '16px',
          background: isDarkMode ? '#1e1e1e' : '#fff',
          color: isDarkMode ? '#e0e0e0' : '#000',
          overflow: 'auto',
          boxSizing: 'border-box',
          whiteSpace: mode === 'preview' ? 'normal' : 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '1em',
          outline: 'none'
        }}
        onInput={(e) => {
            if (mode === 'preview') return;

            const caretPos = getCaretPosition(e.currentTarget);
            let newContent;

            if (mode === 'source') {
                newContent = extractContentFromHtml(e.currentTarget.innerHTML);
                const hasTrailingLine = e.currentTarget.querySelector('[data-trailing-line]') !== null;
                if (hasTrailingLine && !newContent.endsWith('\n')) newContent += '\n';
            } else if (mode === 'edit') {
                newContent = e.currentTarget.textContent;
                const lastNode = contentRef.current?.lastChild;
                if (lastNode?.nodeType === 1 && lastNode.getAttribute('data-trailing-line') !== null) {
                newContent += '\n';
                }
            }

            if (newContent !== rawContent) {
                setRawContentState(newContent);
                setTimeout(() => {
                if (contentRef.current && caretPos !== null) {
                    setCaretPosition(contentRef.current, caretPos);
                }
                }, 0);
            }
        }}
      />
    </div>
  );
}


return { BasicView };
```

