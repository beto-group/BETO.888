# IntegratedDevelopmentSuite_v18

```jsx
const { useEffect, useState, useMemo, useRef, useCallback } = dc;

// --- ROBUST PATH RESOLUTION ---
const CURRENT_FILE = dc.resolvePath("IntegratedDevelopmentSuite.md");
const DASH_ROOT = CURRENT_FILE.split('/').slice(0, -2).join('/'); // Goes up from src/
const { ICONS } = await dc.require(dc.headerLink(`${DASH_ROOT}/src/ICONS.md`, "ICONS"));

// --- UTILITY TO LOAD A SCRIPT FROM THE VAULT ---
// --- ROBUST SCRIPT LOADER (URL & CACHE SUPPORT) ---
async function loadScript(src, globalCheck) {
    if (globalCheck && window[globalCheck]) return Promise.resolve();
    const cacheDir = ".datacore/script_cache";
    return new Promise(async (resolve, reject) => {
        const adapter = dc.app.vault.adapter;
        try {
            const safeFilename = src.replace(/^https?:\/\//, "").replace(/[\/\\?%*:|"<>]/g, "_") + ".js";
            const cachePath = `${cacheDir}/${safeFilename}`;
            let scriptText = null;
            if (await adapter.exists(cachePath)) {
                scriptText = await adapter.read(cachePath);
            } else {
                const response = await fetch(src);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                scriptText = await response.text();
                if (!(await adapter.exists(cacheDir))) await adapter.mkdir(cacheDir);
                await adapter.write(cachePath, scriptText);
            }
            const scriptElement = document.createElement("script");
            scriptElement.textContent = scriptText;
            scriptElement.id = `script-${safeFilename}`;
            document.body.appendChild(scriptElement);
            resolve();
        } catch (e) {
            console.error(`Failed to load script: ${src}`, e);
            reject(e);
        }
    });
}


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- COMPONENT FOR EXECUTING LIVE DATCOREJSX (FINAL ROBUST VERSION) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const DatacoreJSXRenderer = ({ code, babel }) => {
    const [RenderedComponent, setRenderedComponent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const executeCode = async () => {
            setIsLoading(true);
            setError(null);
            setRenderedComponent(null);
            
            if (!babel) {
                setIsLoading(false); 
                return;
            }

            try {
                // This creates a true async function from a string, which can handle `await`.
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

                // Transpile the JSX into standard JS that uses React.createElement
                const transformedCode = babel.transform(code, { presets: ['react'] }).code;
                
                // We create a function body that makes all React hooks available, then runs the transpiled code.
                const functionBody = `
                    const { useEffect, useState, useMemo, useRef, Fragment } = React;
                    ${transformedCode}
                `;

                // Create the executor function, injecting the necessary scope (dc and React)
                const executor = new AsyncFunction('dc', 'React', functionBody);
                
                // Execute the code and wait for the result
                const result = await executor(dc, React);
                
                if (React.isValidElement(result)) {
                    setRenderedComponent(() => result);
                } else {
                    throw new Error("The executed code did not return a valid React element.");
                }
            } catch (e) {
                console.error("Error executing datacorejsx:", e);
                setError(e.stack);
            } finally {
                setIsLoading(false);
            }
        };
        executeCode();
    }, [code, babel]);

    if (isLoading) {
        return (
            <div style={{ 
                padding: '48px', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                color: 'var(--glow)' 
            }}>
                {OverlayLogo && <OverlayLogo size={40} animated={true} />}
                <span style={{ 
                    animation: 'pulse 1.5s infinite', 
                    fontVariant: 'small-caps', 
                    letterSpacing: '3px',
                    fontSize: '11px',
                    opacity: 0.7
                }}>[ LOADING ]</span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '16px', margin: '1em 0', backgroundColor: 'rgba(255, 80, 80, 0.1)', border: '1px solid var(--text-error)', borderRadius: '8px' }}>
                <h5 style={{ margin: '0 0 8px 0', color: 'var(--text-error)', textTransform: 'uppercase', fontSize: '11px' }}>Component Error</h5>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--text-normal)', fontSize: '13px' }}>{error}</pre>
            </div>
        );
    }
    
    if (!babel && !error) {
         return <div style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>Waiting for transpiler...</div>;
    }

    return RenderedComponent ? <div className="datacore-jsx-wrapper">{RenderedComponent}</div> : null;
};


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- SECTION 1: CORE UTILITIES & DATA FETCHING ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

async function getMediaResourcePath(filePathOrName) { if (!filePathOrName) return null; const normalize = (p) => p.trim().replace(/\\/g, '/').replace(/^\/+/, ''); const path = normalize(filePathOrName); let file = dc.app.vault.getAbstractFileByPath(path); if (file) return dc.app.vault.getResourcePath(file); const allFiles = dc.app.vault.getFiles(); const foundFile = allFiles.find(f => f.path.endsWith(path)); if (foundFile) return dc.app.vault.getResourcePath(foundFile); console.warn(`Media resource not found: ${filePathOrName}`); return null; }
const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
// --- GLOBAL CACHE FOR MODULE SCAN ---
let GLOBAL_MODULE_CACHE = null;

const useShallowModuleScan = (enabled = true) => {
    const [data, setData] = useState(GLOBAL_MODULE_CACHE);
    const [isLoading, setIsLoading] = useState(!GLOBAL_MODULE_CACHE);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled) return;
        
        const scanFiles = async () => {
            if (!GLOBAL_MODULE_CACHE) setIsLoading(true);
            try {
                const currentFilePath = dc.resolvePath("IntegratedDevelopmentSuite.md");
                const dashRoot = currentFilePath.includes('/') ? currentFilePath.split('/').slice(0, -2).join('/') : "";
                const skillsPath = dashRoot ? `${dashRoot}/_resources/content/SKILLS.bet8.md` : "_resources/content/SKILLS.bet8.md";
                
                console.log("[Docs Scanner] Current File:", currentFilePath);
                console.log("[Docs Scanner] Dashboard Root:", dashRoot);
                console.log("[Docs Scanner] Skills Path:", skillsPath);
                
                const modulesByCategory = {};
                
                const normalizePath = (path) => {
                    const parts = path.split('/');
                    const result = [];
                    for (const p of parts) {
                        if (p === '..') result.pop();
                        else if (p !== '.' && p !== '') result.push(p);
                    }
                    return result.join('/');
                };

                const newLinkRegex = /###### \[([^\]]+)\]\(([^)]+)\)/;
                const oldLinkRegex = /###### \[\[([^|\]]+)(?:\|([^\]]+))?\]\]/;

                // 1. Scan SKILLS.bet8.md
                const skillsFile = dc.app.vault.getAbstractFileByPath(skillsPath);
                if (skillsFile) {
                    console.log("[Docs Scanner] Found Skills file:", skillsFile.path);
                    const content = await dc.app.vault.read(skillsFile);
                    const lines = content.split('\n');
                    const basePath = skillsFile.path.substring(0, skillsFile.path.lastIndexOf('/'));
                    let currentMajorCategory = null;

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('##')) {
                            currentMajorCategory = trimmedLine.substring(2).trim();
                            if (!modulesByCategory[currentMajorCategory]) modulesByCategory[currentMajorCategory] = [];
                            continue;
                        }
                        if (currentMajorCategory && trimmedLine.startsWith('######')) {
                            let match = trimmedLine.match(newLinkRegex);
                            let moduleData = null;
                            if (match) {
                                const displayName = match[1].trim().replace(/ info$/i, '');
                                const filePath = normalizePath(`${basePath}/${decodeURIComponent(match[2].trim())}`);
                                moduleData = { displayName, majorCategory: currentMajorCategory, filePath, id: filePath };
                            } else {
                                match = trimmedLine.match(oldLinkRegex);
                                if (match) {
                                    const displayName = (match[2] || match[1]).trim().replace(/ info$/i, '');
                                    const filePath = normalizePath(`${basePath}/${decodeURIComponent(match[1].trim())}.md`);
                                    moduleData = { displayName, majorCategory: currentMajorCategory, filePath, id: filePath };
                                }
                            }
                            if (moduleData) {
                                try {
                                    const fileObj = dc.app.vault.getAbstractFileByPath(moduleData.filePath);
                                    if (fileObj) {
                                        const cache = dc.app.metadataCache.getFileCache(fileObj);
                                        moduleData.icon = cache?.frontmatter?.icon || cache?.frontmatter?.Icon || null;
                                        moduleData.cover = cache?.frontmatter?.cover || cache?.frontmatter?.Cover || null;
                                        moduleData.video = cache?.frontmatter?.video || cache?.frontmatter?.Video || null;
                                    }
                                } catch (e) {}
                                modulesByCategory[currentMajorCategory].push(moduleData);
                            }
                        }
                    }
                } else {
                    console.warn("[Docs Scanner] Skills file NOT found at path:", skillsPath);
                }


                GLOBAL_MODULE_CACHE = modulesByCategory;
                setData(modulesByCategory);
                setIsLoading(false);
            } catch (e) {
                console.error("[Docs Scanner] FATAL ERROR:", e);
                setError(e.stack);
            } finally {
                setIsLoading(false);
            }
        };

        scanFiles();
    }, [enabled]);

    return { data, isLoading, error };
};

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- SECTION 2: VIEW COMPONENTS ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const useInView = (options) => {  const [isInView, setIsInView] = useState(false); const ref = useRef(null); useEffect(() => { const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsInView(true); if (ref.current) observer.unobserve(ref.current); } }, { ...options }); if (ref.current) observer.observe(ref.current); return () => { if (ref.current) observer.unobserve(ref.current); }; }, [options]); return [ref, isInView]; };
const AnimatedIcon = ({ svgString, isActive, isInView }) => {  const iconRef = useRef(null); const [hasRevealed, setHasRevealed] = useState(false); const drawableElementsRef = useRef([]); const fadeableElementsRef = useRef([]); const animationLoopId = useRef(null); const DURATION = 0.88; useEffect(() => { const container = iconRef.current; if (!container || !svgString) return; container.innerHTML = ''; drawableElementsRef.current = []; fadeableElementsRef.current = []; container.innerHTML = svgString.replace(/stroke="none"/g, '').replace(/stroke-width="0"/g, ''); const svgElement = container.querySelector('svg'); if (!svgElement) return; svgElement.style.width = '100%'; svgElement.style.height = '100%'; svgElement.style.display = 'block'; const allShapes = svgElement.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon'); allShapes.forEach(el => { if (typeof el.getTotalLength === 'function' && el.getTotalLength() > 0) { const length = el.getTotalLength(); el.style.strokeDasharray = length; el.style.strokeDashoffset = length; el.style.stroke = 'white'; el.style.strokeWidth = '1.5px'; el.style.fill = 'transparent'; drawableElementsRef.current.push(el); } else { el.style.opacity = '0'; el.style.fill = 'black'; fadeableElementsRef.current.push(el); } }); }, [svgString]); useEffect(() => { if (isInView && !hasRevealed) { const drawables = drawableElementsRef.current; const fadeables = fadeableElementsRef.current; let totalAnimationTime = 0; drawables.forEach((el, index) => { const delay = 0.1 * index * DURATION; el.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay + (DURATION * 0.2)}s`; el.style.strokeDashoffset = '0'; el.style.fill = 'black'; totalAnimationTime = Math.max(totalAnimationTime, (delay + DURATION) * 1000); }); fadeables.forEach((el, index) => { const delay = 0.1 * (index + drawables.length) * DURATION; el.style.transition = `opacity ${DURATION * 0.7}s ease ${delay}s`; el.style.opacity = '1'; totalAnimationTime = Math.max(totalAnimationTime, (delay + DURATION * 0.7) * 1000); }); setTimeout(() => setHasRevealed(true), totalAnimationTime); } }, [isInView, hasRevealed]); useEffect(() => { clearTimeout(animationLoopId.current); if (!isActive || !hasRevealed) { const allElements = [...drawableElementsRef.current, ...fadeableElementsRef.current]; allElements.forEach(el => el.style.transition = 'none'); drawableElementsRef.current.forEach(el => { el.style.strokeDashoffset = '0'; el.style.fill = 'black'; }); fadeableElementsRef.current.forEach(el => { el.style.opacity = '1'; }); return; } const drawables = drawableElementsRef.current; const fadeables = fadeableElementsRef.current; const calculateTotalTime = () => { const drawableTime = drawables.length > 0 ? (0.1 * (drawables.length - 1) * DURATION + DURATION) * 1000 : 0; const fadeableTime = fadeables.length > 0 ? (0.1 * (fadeables.length - 1 + drawables.length) * DURATION + DURATION * 0.7) * 1000 : 0; return Math.max(drawableTime, fadeableTime); }; const animationDuration = calculateTotalTime(); const overlapTransitionTime = animationDuration * 0.85; const animateErase = () => { drawables.forEach((el, index) => { const delay = 0.1 * index * DURATION; el.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay}s`; el.style.strokeDashoffset = el.getTotalLength(); el.style.fill = 'transparent'; }); fadeables.forEach((el, index) => { const delay = 0.1 * (index + drawables.length) * DURATION; el.style.transition = `opacity ${DURATION * 0.7}s ease ${delay}s`; el.style.opacity = '0'; }); }; const animateDraw = () => { drawables.forEach((el, index) => { const delay = 0.1 * index * DURATION; el.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay + (DURATION * 0.2)}s`; el.style.strokeDashoffset = '0'; el.style.fill = 'black'; }); fadeables.forEach((el, index) => { const delay = 0.1 * (index + drawables.length) * DURATION; el.style.transition = `opacity ${DURATION * 0.7}s ease ${delay}s`; el.style.opacity = '1'; }); }; const loop = () => { animateErase(); animationLoopId.current = setTimeout(() => { animateDraw(); animationLoopId.current = setTimeout(loop, overlapTransitionTime); }, overlapTransitionTime); }; loop(); return () => { clearTimeout(animationLoopId.current); }; }, [isActive, hasRevealed]); return (<div ref={iconRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />); };
const CollapsibleSection = ({ title, children, initialCollapsed = false, headerClass = '', ...rest }) => {  
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed); 
    const toggleCollapse = () => setIsCollapsed(!isCollapsed); 
    return (
        <div {...rest} className={`collapsible-wrapper ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}> 
            <div className={`collapsible-header ${headerClass}`} onClick={toggleCollapse}> 
                <h3 className="collapsible-title">{title}</h3> 
                <span className="collapsible-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span> 
            </div> 
            {!isCollapsed && <div className="collapsible-content anim-fade-in-now">{children}</div>} 
        </div>
    ); 
};
const MarkdownRenderer = ({ markdown, codeHighlighter, sourcePath, babel, localTheme, openModal, onModuleSelect, groupedModules }) => {
    const [renderedContent, setRenderedContent] = useState([]);
    const containerRef = useRef(null);
    const renderCountRef = useRef(0);

    useEffect(() => {
        const currentRenderId = ++renderCountRef.current;
        const render = async () => {
            if (!markdown) {
                setRenderedContent([]);
                return;
            }

            let processedMarkdown = markdown.trim();
            // Strip YAML Frontmatter
            if (processedMarkdown.startsWith('---')) {
                const nextSeparator = processedMarkdown.indexOf('---', 3);
                if (nextSeparator !== -1) {
                    processedMarkdown = processedMarkdown.substring(nextSeparator + 3).trim();
                }
            }
            
            try {
            const datacoreJsxRegex = /^```datacorejsx\r?\n([\s\S]*?)\r?\n```\s*$/gm;
            const calloutRegex = /^>\s?\[\!(\w+)\]([+-])?(.*)(?:\r?\n((?:^>.*\r?\n?)*))?/gm;
            
            const liveComponents = [];
            let calloutCounter = 0;
            const calloutData = [];

            // 1. Identify Callouts and replace with placeholders
            let processedHtml = processedMarkdown.replace(calloutRegex, (match, type, collapse, title, content) => {
                const id = calloutCounter++;
                calloutData.push({ type, collapse, title, content });
                return `__CALLOUT_REACT_COMPONENT_${id}__`;
            });

            // 2. Identify DatacoreJSX
            processedHtml = processedHtml.replace(datacoreJsxRegex, (match, code) => {
                const id = liveComponents.length;
                liveComponents.push(<DatacoreJSXRenderer key={`jsx_${id}`} code={code} babel={babel} />);
                return `__DATACORE_JSX_COMPONENT_${id}__`;
            });

            const isLightMode = localTheme === 'theme-light' || 
                                document.body.classList.contains('theme-light') || 
                                window.getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)';
            const shikiTheme = isLightMode ? 'github-light' : 'one-dark-pro';

            const codeBlockPlaceholder = (index) => `__CODE_BLOCK_${index}__`;
            const codeBlockRegex = /^[ \t]*(`{3,})([^\n]*)\n([\s\S]*?)\n[ \t]*\1[ \t]*$/gm;
            const codeMatches = [...processedHtml.matchAll(codeBlockRegex)].filter(m => m[3].trim().length > 0);
            const codeBlockHtmlPromises = codeMatches.map(async (match) => {
                let lang = (match[2] || 'txt').trim().toLowerCase();
                const code = match[3].trim();
                let encodedCode = '';
                try {
                    encodedCode = btoa(unescape(encodeURIComponent(code)));
                } catch (e) {
                    encodedCode = '';
                }
                const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="check-icon"><path d="M20 6L9 17l-5-5"></path></svg>`;
                const copyButton = `<button class="copy-code-btn" data-code="${encodedCode}" title="Copy code">${copyIcon}${checkIcon}</button>`;
                let highlightedCode = '';
                try {
                    const langIdentifier = lang.split(' ')[0];
                    highlightedCode = codeHighlighter ? await codeHighlighter(code, langIdentifier, shikiTheme) : `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
                } catch (e) {
                    highlightedCode = `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
                }
                return `<details class="code-block-wrapper" open><summary class="code-block-header"><div class="code-block-header-left"><div class="code-block-lang-pill"></div><span class="language-label">${lang}</span></div>${copyButton}</summary><div class="code-block-content">${highlightedCode}</div></details>`;
            });
            processedHtml = processedHtml.replace(codeBlockRegex, (match, backticks, langInfo, code, offset) => {
                const idx = codeMatches.findIndex(m => m.index === offset);
                return codeBlockPlaceholder(idx);
            });

            const processMarkdownChunk = async (chunk) => {
                if (!chunk) return '';
                let processed = chunk.trim();

                // Horizontal Rules - Handle with more flexibility for neighboring blocks
                processed = processed.replace(/^[ \t]*([-*_])\s*(?:\1\s*){2,}[ \t]*$/gm, '<hr/>');

                const mediaEmbedRegex = /!\[\[([^\]]+)\]\]/g;
                const mediaMatches = [...processed.matchAll(mediaEmbedRegex)];
                for (const match of mediaMatches) {
                    const fullSyntax = match[0];
                    const mediaPath = match[1];
                    const resolvedSrc = await getMediaResourcePath(mediaPath);

                    if (resolvedSrc) {
                        const lowerCasePath = mediaPath.toLowerCase();
                        let replacementHtml = '';

                        if (lowerCasePath.endsWith('.mp4') || lowerCasePath.endsWith('.webm')) {
                            replacementHtml = `<video src="${resolvedSrc}" controls autoplay loop muted playsinline class="markdown-embed"></video>`;
                        } else {
                            replacementHtml = `<img src="${resolvedSrc}" alt="${mediaPath}" class="markdown-embed" />`;
                        }
                        
                        processed = processed.replace(fullSyntax, replacementHtml);
                    }
                }

                const internalLinkRegex = /(?<!!)\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
                processed = processed.replace(internalLinkRegex, (match, linkTarget, alias) => {
                    const linkText = alias ? alias.trim() : linkTarget.trim();
                    return `<a href="#" class="internal-link" data-internal-link="${linkTarget.trim()}" data-source-path="${sourcePath || ''}">↳ ${linkText}</a>`;
                });

                processed = processed.replace(/^###### (.*$)/gim, '<h6>$1</h6>').replace(/^##### (.*$)/gim, '<h5>$1</h5>').replace(/^#### (.*$)/gim, '<h4>$1</h4>').replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>');
                processed = processed.replace(/^\s*>\s?(.*)/gim, '<blockquote>$1</blockquote>');

                const tableRegex = /((?:^|\n)(?:[^\n]*\|[^\n]*)(?:\n(?:[ \t]*[:\- |]+)+)(?:\n(?:[^\n]*\|[^\n]*))*)/g;
                processed = processed.replace(tableRegex, (match) => {
                    const lines = match.trim().split('\n');
                    if (lines.length < 2) return match;
                    
                    const parseRow = (row) => {
                        let cells = row.split('|');
                        if (cells.length > 1 && cells[0].trim() === '') cells.shift();
                        if (cells.length > 1 && cells[cells.length - 1].trim() === '') cells.pop();
                        return cells.map(c => c.trim());
                    };

                    const headers = parseRow(lines[0]);
                    const rows = lines.slice(2).map(rowLine => parseRow(rowLine));
                    
                    const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
                    const tbody = `<tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
                    return `<table>${thead}${tbody}</table>`;
                });

                // Improved Unordered List Parsing (handles Task Lists and continuation)
                processed = processed.replace(/((?:^[ \t]*[-*+]\s+.*\n?(?:(?:\n|\r\n?)*[ \t]{2,}.*\n?)*)+)/gm, (match) => {
                    const items = match.split(/^[ \t]*[-*+]\s+/m).filter(Boolean);
                    const listItems = items.map(item => {
                        let content = item.trim();
                        if (content.startsWith('[ ] ')) {
                            return `<li class="task-list-item"><input type="checkbox" disabled /><div class="task-list-content">${content.substring(4)}</div></li>`;
                        } else if (content.startsWith('[x] ')) {
                            return `<li class="task-list-item"><input type="checkbox" checked disabled /><div class="task-list-content">${content.substring(4)}</div></li>`;
                        }
                        return `<li>${content}</li>`;
                    }).join('');
                    return `<ul>${listItems}</ul>`;
                });

                // Improved Numbered List Parsing (handles indented continuation and grouping + start index)
                processed = processed.replace(/((?:^[ \t]*\d+\.\s+.*\n?(?:(?:\n|\r\n?)*[ \t]{2,}.*\n?)*)+)/gm, (match) => {
                    const firstNumMatch = match.match(/^[ \t]*(\d+)\.\s+/m);
                    const startNum = firstNumMatch ? firstNumMatch[1] : '1';
                    const items = match.split(/^[ \t]*\d+\.\s+/m).filter(Boolean);
                    const listItems = items.map(item => `<li>${item.trim()}</li>`).join('');
                    return `<ol start="${startNum}">${listItems}</ol>`;
                });

                processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                        const isInternal = !url.startsWith('http') && (url.endsWith('.md') || !url.includes('.'));
                        if (isInternal) {
                            return `<a href="#" class="internal-link" data-internal-link="${url}" data-source-path="${sourcePath || ''}">↳ ${text}</a>`;
                        }
                        return `<a href="${url}" target="_blank">${text}</a>`;
                    })
                    .replace(/`([^`]+)`/g, '<code>$1</code>')
                    .replace(/(?<!["'>(])(https?:\/\/[^\s<"']+)(?![^<]*>|[^<>]*<\/a>)/g, '<a href="$1" target="_blank">$1</a>');

                return processed.split('\n').map(line => {
                    const trimmed = line.trim();
                    if (trimmed === '') return '';
                    if (trimmed.match(/^__(DATACORE_JSX_COMPONENT|CODE_BLOCK|CALLOUT)_\d+__$/)) {
                        return line;
                    }
                    // Handle cases where placeholder might be surrounded by spaces but is the only thing on the line
                    if (line.match(/^\s*__(DATACORE_JSX_COMPONENT|CODE_BLOCK|CALLOUT)_\d+__\s*$/)) {
                        return line;
                    }
                    if (line.match(/<(h[1-6]|ul|ol|li|blockquote|hr|pre|table|img|div|details|video)/)) return line;
                    return `<p>${line}</p>`;
                }).join('');
            };

            // 3. Render Callout Components
            const renderedCallouts = await Promise.all(calloutData.map(async (data, index) => {
                const calloutType = data.type.toLowerCase() || 'note';
                const titleText = data.title.trim();
                const innerContent = (data.content || '').replace(/^>\s?/gm, '');
                const renderedInnerContent = await processMarkdownChunk(innerContent);
                
                const typeColors = {
                    note: '110, 130, 255',      /* Deep Blue */
                    tip: '34, 197, 94',         /* Emerald Green */
                    info: '59, 130, 246',       /* Blue */
                    important: '217, 70, 239',  /* Magenta */
                    warning: '245, 158, 11',    /* Amber */
                    danger: '239, 68, 68',      /* Red */
                    todo: '20, 184, 166',       /* Teal */
                    caution: '249, 115, 22'     /* Orange */
                };
                const calloutIcons = {
                    note: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8h.01"/><path d="M11 12h1v4h1"/><circle cx="12" cy="12" r="10"/></svg>`,
                    tip: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
                    info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
                    important: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4"/><path d="M12 16h.01"/><circle cx="12" cy="12" r="10"/></svg>`,
                    warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
                    danger: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
                    todo: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12a9 9 0 1 1-9-9c1.64 0 3.19.45 4.5 1.24"/></svg>`,
                    caution: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
                };
                const accentColor = typeColors[calloutType] || typeColors.note;
                const iconSvg = calloutIcons[calloutType] || calloutIcons.note;

                return (
                    <div key={`callout_${index}`} className={`ids-callout ids-callout-${calloutType}`}>
                        <div className="ids-callout-header">
                            <div className="ids-callout-icon-container">
                                <span className="ids-callout-icon" dangerouslySetInnerHTML={{ __html: iconSvg }} />
                            </div>
                            <span className="ids-callout-title-text">{titleText || calloutType.toUpperCase()}</span>
                        </div>
                        <div className="ids-callout-content" dangerouslySetInnerHTML={{ __html: renderedInnerContent }} />
                    </div>
                );
            }));

            let finalHtmlString = await processMarkdownChunk(processedHtml);
            
            // Handle code blocks
            const resolvedCodeBlocks = await Promise.all(codeBlockHtmlPromises);
            resolvedCodeBlocks.forEach((html, index) => {
                finalHtmlString = finalHtmlString.replace(codeBlockPlaceholder(index), html);
            });

            const finalContentArray = [];
            // Split by BOTH types of placeholders
            const parts = finalHtmlString.split(/(__DATACORE_JSX_COMPONENT_\d+__|__CALLOUT_REACT_COMPONENT_\d+__)/g);
            
            parts.forEach((part, index) => {
                if (!part) return;
                
                if (part.startsWith('__DATACORE_JSX_COMPONENT_')) {
                    const id = parseInt(part.match(/\d+/)[0]);
                    if (liveComponents[id]) finalContentArray.push(liveComponents[id]);
                } else if (part.startsWith('__CALLOUT_REACT_COMPONENT_')) {
                    const id = parseInt(part.match(/\d+/)[0]);
                    if (renderedCallouts[id]) finalContentArray.push(renderedCallouts[id]);
                } else {
                    finalContentArray.push(<div key={`html_${index}`} dangerouslySetInnerHTML={{ __html: part }} />);
                }
            });
            if (renderCountRef.current !== currentRenderId) return;
            setRenderedContent(finalContentArray);
            } catch (err) {
                if (renderCountRef.current !== currentRenderId) return;
                setRenderedContent([<div key="error" style={{ color: 'var(--text-error)', padding: '12px', border: '1px solid var(--text-error)', borderRadius: '8px', fontSize: '12px' }}>[ RENDER ERROR ] {err.message}</div>]);
            }
        };
        render();
    }, [markdown, codeHighlighter, sourcePath, babel]);

    useEffect(() => {
        const handleCopy = async (e) => {
            const btn = e.target.closest('.copy-code-btn');
            if (!btn) return;
            
            const encoded = btn.getAttribute('data-code');
            if (!encoded) return;
            
            try {
                const code = decodeURIComponent(escape(atob(encoded)));
                await navigator.clipboard.writeText(code);
                
                btn.classList.add('copied');
                setTimeout(() => btn.classList.remove('copied'), 2000);
            } catch (err) {}
        };

        const handleLinkClick = async (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            const internalTarget = link.getAttribute('data-internal-link');
            const href = link.getAttribute('href');
            
            if (internalTarget || (href && !href.startsWith('http'))) {
                e.preventDefault();
                e.stopPropagation();
                const rawTarget = internalTarget || href;
                const source = link.getAttribute('data-source-path') || '';
                
                try {
                    // Utility for aggressive fuzzy matching (strips IDs, spaces, and special chars)
                    const getCoreName = (str) => (str || '').toLowerCase().replace(/^\d+[\s\._-]*/, '').replace(/[^a-z0-9]/g, '').trim();
                    const targetCore = getCoreName(rawTarget.split('/').pop());

                    // --- NEW: MODULE REGISTRY RESOLUTION ---
                    if (groupedModules) {
                        const allModulesFlat = Object.values(groupedModules).flat();
                        const matchingModule = allModulesFlat.find(m => 
                            getCoreName(m.name) === targetCore || 
                            getCoreName(m.displayName || '') === targetCore ||
                            getCoreName(m.title || '') === targetCore
                        );
                        
                        if (matchingModule) {
                            dc.app.workspace.openLinkText(matchingModule.filePath, source, true);
                            return;
                        }
                    }

                    // --- FALLBACK: DIRECT FILE RESOLUTION ---
                    const vaultFiles = dc.app.vault.getMarkdownFiles();
                    
                    // 1. Exact Name Match (Preferred)
                    const exactFile = vaultFiles.find(f => getCoreName(f.basename) === targetCore && !f.name.includes('.viewer') && !f.name.includes('.extract'));
                    if (exactFile) {
                        dc.app.workspace.openLinkText(exactFile.path, source, true);
                        return;
                    }

                    // 2. Folder-based Core Matching (for DataCore structures)
                    if (rawTarget.includes(' ') || rawTarget.match(/^\d+/)) {
                        const baseDir = `_RESOURCES/DATACORE/${rawTarget.includes('/') ? rawTarget.split('/')[0] : rawTarget}`;
                        if (await dc.app.vault.adapter.exists(baseDir)) {
                            const files = await dc.app.vault.adapter.list(baseDir);
                            // Prioritize the file that matches core name but isn't a viewer/extract
                            const bestMatch = files.files.find(f => {
                                const fName = getCoreName(f.split('/').pop());
                                const rawName = f.split('/').pop().toLowerCase();
                                return fName === targetCore && !rawName.includes('.extract') && !rawName.includes('.viewer');
                            }) || files.files.find(f => {
                                const fName = getCoreName(f.split('/').pop());
                                return fName === targetCore;
                            });

                            if (bestMatch) {
                                dc.app.workspace.openLinkText(bestMatch, source, true);
                                return;
                            }
                        }
                    }

                    // 3. Standard cache lookup
                    let file = dc.app.metadataCache.getFirstLinkpathDest(rawTarget, source);
                    
                    // 4. Try with .md if missing
                    if (!file && !rawTarget.includes('.')) {
                        file = dc.app.metadataCache.getFirstLinkpathDest(rawTarget + ".md", source);
                    }

                    // 3. Vault-wide "Core" scan (handles ID shifts like 111 -> 103)
                    if (!file) {
                        const allMarkdownFiles = dc.app.vault.getMarkdownFiles();
                        
                        // First pass: try to find exact name anywhere
                        const searchName = rawTarget.split('/').pop().toLowerCase();
                        file = allMarkdownFiles.find(f => f.basename.toLowerCase() === searchName);
                        
                        // Second pass: try core matching (stripping numbers)
                        if (!file) {
                            const coreMatches = allMarkdownFiles.filter(f => getCoreName(f.basename) === targetCore);
                            if (coreMatches.length > 0) {
                                // Prioritize files that AREN'T .extract or .viewer if multiple core matches exist
                                // Unless the target specifically asked for a viewer
                                file = coreMatches.find(f => !f.name.toLowerCase().includes('.extract') && !f.name.toLowerCase().includes('.viewer')) || 
                                       coreMatches.find(f => f.name.toLowerCase().includes('.viewer')) ||
                                       coreMatches[0];
                            }
                        }

                        // Third pass: check if it matches a folder name
                        if (!file) {
                            const allFiles = dc.app.vault.getAllLoadedFiles();
                            const folder = allFiles.find(f => f.children && getCoreName(f.name) === targetCore);
                            if (folder) {
                                // Prioritize .md files that match the folder name core
                                file = folder.children.find(c => c.extension === 'md' && !c.name.toLowerCase().includes('.extract')) ||
                                       folder.children.find(c => c.extension === 'md');
                            }
                        }
                    }
                    
                    if (file) {
                        await dc.app.workspace.getLeaf(true).openFile(file);
                    }
                } catch (err) {
                    // Silently fail link resolution
                }
                return;
            }

            // For external links, let them open in new tab if target="_blank"
            if (link.getAttribute('target') === '_blank' || link.href.startsWith('http')) {
                // Browser handles this if we don't preventDefault
                return;
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('click', handleCopy);
            container.addEventListener('click', handleLinkClick);
            return () => {
                container.removeEventListener('click', handleCopy);
                container.removeEventListener('click', handleLinkClick);
            };
        }
    }, [renderedContent]);

    return <div ref={containerRef} className="markdown-rendered-content">{renderedContent}</div>;
};
const ObsidianIcon = ({ name, size = 36, isHovering }) => {
    const iconRef = useRef(null);
    const svgRef = useRef(null);

    // Initial Load & Setup
    useEffect(() => {
        if (!iconRef.current) return;
        try {
            const { getIcon } = window.require('obsidian');
            const iconSvg = getIcon(name) || getIcon('file');
            if (iconSvg) {
                iconSvg.style.width = `${size}px`;
                iconSvg.style.height = `${size}px`;
                iconSvg.style.overflow = 'visible';
                iconSvg.setAttribute('stroke-width', '2');
                
                iconRef.current.innerHTML = '';
                iconRef.current.appendChild(iconSvg);
                svgRef.current = iconSvg;
                
                // Prepare paths for animation
                const paths = iconSvg.querySelectorAll('path, circle, line, polyline, polygon, ellipse, rect');
                paths.forEach((path) => {
                    try {
                        const length = (typeof path.getTotalLength === 'function') ? path.getTotalLength() : 100;
                        path.style.strokeDasharray = length;
                        path.style.strokeDashoffset = '0'; // Start fully visible
                    } catch (e) {
                        path.style.strokeDasharray = '1000';
                        path.style.strokeDashoffset = '0';
                    }
                });
            }
        } catch (e) {
            console.error("Failed to load icon", name, e);
        }
    }, [name, size]);

    // Animation Update
    useEffect(() => {
        if (!svgRef.current) return;
        const paths = svgRef.current.querySelectorAll('path, circle, line, polyline, polygon, ellipse, rect');
        
        paths.forEach((path, i) => {
            if (isHovering) {
                const length = parseFloat(path.style.strokeDasharray) || 100;
                path._drawingAnim = path.animate([
                    { strokeDashoffset: '0', offset: 0 },
                    { strokeDashoffset: length, offset: 0.5 },
                    { strokeDashoffset: '0', offset: 1 }
                ], {
                    duration: 2500,
                    iterations: Infinity,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    delay: i * 50 // 50ms stagger
                });
            } else {
                if (path._drawingAnim) {
                    path._drawingAnim.cancel();
                    path._drawingAnim = null;
                }
                path.style.strokeDashoffset = '0';
            }
        });
        
        // Cleanup if component unmounts while animating
        return () => {
            paths.forEach(path => {
                if (path._drawingAnim) {
                    path._drawingAnim.cancel();
                }
            });
        };
    }, [isHovering]);
    
    return <div ref={iconRef} style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isHovering ? 'var(--text-bright)' : 'var(--text-muted)',
        transition: 'color 0.2s ease, transform 0.2s ease',
        transform: isHovering ? 'scale(1.1)' : 'scale(1)',
        pointerEvents: 'none'
    }} />;
};

const LUCIDE_ALIAS_MAP = {
    'DATACORE API': 'database',
    'REFERENCE': 'book',
    'AUTOMATION': 'cpu',
    'PROMPT ENGINEERING': 'sparkles',
    'ARCHITECTURE': 'layers',
    'DEVELOPMENT': 'code',
    'OBSIDIAN DEV ELITE': 'gem',
    'OBSIDIAN OPS PRO': 'server',
    'OBSIDIAN FORMATS': 'file-json',
    'OBSIDIAN REF': 'library',
    'BEST PRACTICES': 'check-circle',
    'ANTI-PATTERNS': 'alert-triangle',
    'INTEGRATIONS': 'blocks',
    'DESIGN BIBLE': 'palette',
    'PHILOSOPHY & META': 'brain'
};

const ModuleTile = ({ module, onSelect, styles }) => {  
    const [isHovering, setIsHovering] = useState(false); 
    const baseKey = module.displayName.toUpperCase();
    const iconName = module.icon || LUCIDE_ALIAS_MAP[baseKey] || 'file-text';

    return (
        <div 
            style={{
                ...styles.tile,
                transform: isHovering ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                borderColor: isHovering ? 'var(--glow)' : 'var(--glow-faint)',
                background: isHovering ? 'rgba(255,255,255,0.06)' : 'var(--surface-primary)',
                boxShadow: isHovering ? '0 12px 40px rgba(0,0,0,0.4), 0 0 20px oklch(from var(--glow) l c h / 10%)' : '0 8px 30px rgba(0,0,0,.25)'
            }} 
            onMouseEnter={() => setIsHovering(true)} 
            onMouseLeave={() => setIsHovering(false)} 
            onClick={() => onSelect(module)}
        >
            <div style={{...styles.tileGlow, opacity: isHovering ? 0.8 : 0}}></div>
            
            <div style={styles.tileIconCentered}>
                 <ObsidianIcon name={iconName} size={64} isHovering={isHovering} />
            </div>
            
            <div style={styles.tileFooter}>
                <h4 style={{
                    ...styles.tileName,
                    color: isHovering ? 'var(--text-bright)' : 'var(--text-muted)',
                }}>{module.displayName}</h4>
            </div>
        </div>
    ); 
};

const ModuleGridView = ({ modules, onSelect, styles }) => {  
    return (
        <div className="anim-fade-in-now" style={styles.gridContainer}> 
            {modules.map(module => (
                <ModuleTile key={module.id} module={module} onSelect={onSelect} styles={styles} />
            ))} 
        </div>
    ); 
};
const ModuleNavItem = ({ module, isActive, onClick }) => {  
    const [isHovering, setIsHovering] = useState(false); 
    const [selfRef, isInView] = useInView({ threshold: 0.1 }); 
    const styles = { 
        wrapper: { position: 'relative', width: '64px', height: '64px' }, 
        container: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-primary)', border: '1px solid var(--glow-faint)', borderRadius: '10px', cursor: 'pointer', flexShrink: 0, width: '64px', height: '64px', borderColor: isActive ? 'var(--glow)' : 'var(--glow-faint)', backgroundColor: isActive ? 'var(--glow-med)' : 'var(--surface-primary)', transform: isHovering ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s ease, background-color 0.2s ease, border-color 0.2s ease', zIndex: isHovering ? 2 : 1, }, 
        iconContainer: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, 
        text: { position: 'absolute', bottom: '-22px', left: '50%', transform: `translateX(-50%) scale(${isHovering ? 1 : 0.8})`, opacity: isHovering ? 1 : 0, transition: 'opacity 0.3s ease, transform 0.3s ease', pointerEvents: 'none', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--text-normal)', textAlign: 'center' } 
    }; 
    
    const baseKey = module.displayName.toUpperCase(); 
    const iconName = LUCIDE_ALIAS_MAP[baseKey] || 'file-text';

    return (
        <div ref={selfRef} style={styles.wrapper} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <div style={styles.container} onClick={() => onClick(module)}>
                <div style={styles.iconContainer}>
                    <ObsidianIcon name={iconName} size={28} isHovering={isHovering || isActive} />
                </div>
            </div>
            <span style={styles.text}>{module.displayName}</span>
        </div>
    ); 
};
const DetailRenderer = ({ detailKey, detailValue, codeHighlighter, sourcePath, babel, localTheme, openModal, onModuleSelect, groupedModules }) => { if (!detailValue || (Array.isArray(detailValue) && detailValue.length === 0)) return null; const rendererStyles = { wrapper: { marginBottom: '1.5em' }, key: { fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5em', letterSpacing: '0.05em' } }; const renderContent = () => { if (detailKey === 'Table' && Array.isArray(detailValue)) { return <MarkdownRenderer markdown={String(detailValue)} codeHighlighter={codeHighlighter} sourcePath={sourcePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={groupedModules} />; } if (['Signature', 'Code', 'Conceptual Example'].includes(detailKey)) { const language = (detailKey === 'Signature') ? 'typescript' : 'jsx'; const markdown = `\`\`\`${language}\n${String(detailValue).trim()}\n\`\`\``; return <MarkdownRenderer markdown={markdown} codeHighlighter={codeHighlighter} sourcePath={sourcePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={groupedModules} />; } return <MarkdownRenderer markdown={String(detailValue)} codeHighlighter={codeHighlighter} sourcePath={sourcePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={groupedModules} />; }; return (<div style={rendererStyles.wrapper}><h5 style={rendererStyles.key}>{detailKey}</h5>{renderContent()}</div>); };
const OutlineNav = ({ items, activeId, styles, navRef, handleNavClick }) => {if (!items || items.length === 0) return null; const renderItems = (itemList, level = 0) => (<ul style={{ ...styles.outlineList, paddingLeft: `${level * 16}px` }}> {itemList.map(item => (<li key={item.id} style={styles.outlineListItem}> <a href={`#${item.id}`} onClick={(e) => handleNavClick(e, item.id)} style={{ ...styles.outlineLink, ...(activeId === item.id && styles.outlineLinkActive) }} data-id={item.id}> {item.title} </a> {item.children && item.children.length > 0 && renderItems(item.children, level + 1)} </li>))} </ul>); return (<nav ref={navRef} style={styles.outlineNav}>{renderItems(items)}</nav>); };
const ScrollIndicator = ({ items, activeId, progress, styles, handleNavClick, hoveredId, setHoveredId }) => { if (!items || items.length === 0) return null; return (<div style={styles.indicatorTrack}> <div style={{ ...styles.indicatorProgress, height: `${progress}%` }}></div> {items.map(item => { const isActive = activeId === item.id; const isHovered = hoveredId === item.id; return (<div key={item.id} title={item.title} style={{ ...styles.indicatorDot, top: `${item.percentPosition}%`, ...(isHovered && !isActive && styles.indicatorDotHover), ...(isActive && styles.indicatorDotActive) }} onClick={(e) => handleNavClick(e, item.id)} onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)} ></div>) })} </div>); };
const ModuleDetailView = ({ moduleMetadata, content, isLoading, error, modulesInCategory, activeCategory, onModuleSelect, onCategorySelect, categories, codeHighlighter, styles = {}, iconMap, aliasMap, contentRef, babel, localTheme, openModal, allModules, OverlayLogo }) => {  
    if (!moduleMetadata && isLoading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px' }}>Loading Module...</div>;
    if (!moduleMetadata) return null;
    const activeItemRef = useRef(null); 
    useEffect(() => { 
        setTimeout(() => { activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }, 100); 
    }, [moduleMetadata?.id]); 
    
    const detailStyles = { 
        header: { marginBottom: '2.5em', display: 'flex', flexDirection: 'column', gap: '8px' }, 
        breadcrumb: { fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'oklch(from var(--glow) l c h / 50%)', display: 'flex', alignItems: 'center', gap: '8px' },
        title: { margin: '0', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }, 
        description: { margin: '1em 0 2em 0', color: 'var(--text-normal)', fontSize: '16px', maxWidth: '75ch' }, 
        section: { marginBottom: '3em', scrollMarginTop: '80px' }, 
        sectionTitle: { fontSize: '28px', fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '0.02em', margin: '0 0 1.2em 0', color: 'var(--glow)', paddingBottom: '0.6em', borderBottom: '2px solid var(--glow-faint)', fontVariant: 'small-caps' } 
    }; 
    
    const layoutStyles = {
        detailControlBar: styles.detailControlBar || { marginBottom: '24px', borderBottom: '1px solid var(--glow-faint)', paddingBottom: '16px' },
        tabBar: styles.tabBar || { display: 'flex', gap: '12px', flexWrap: 'wrap' },
        iconNavigationArea: styles.iconNavigationArea || { margin: '24px 0', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glow-faint)' },
        horizontalScroller: styles.horizontalScroller || { display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }
    };
    return (
        <div ref={contentRef} className="module-detail-view" style={{ minHeight: '100%' }}>
            <style>{`
                /* Inject necessary styles for modal rendering */
                .premium-tab { 
                    padding: 8px 22px; 
                    border-radius: 12px; 
                    background: var(--premium-tab-bg, rgba(255, 255, 255, 0.05)); 
                    border: 1px solid var(--premium-tab-border, oklch(0.8 0.2 300 / 18%)); 
                    color: var(--text-muted); 
                    cursor: pointer; 
                    font-size: 11px; 
                    font-weight: 800; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                    font-variant: small-caps; 
                    letter-spacing: 0.12em; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    min-width: 120px; 
                    backdrop-filter: blur(10px); 
                    filter: none !important;
                }
                .premium-tab.active { 
                    background: var(--glow, oklch(0.8 0.2 300)) !important; 
                    color: var(--text-on-accent, #0b0713) !important; 
                    border-color: var(--glow, oklch(0.8 0.2 300)) !important; 
                    box-shadow: 0 8px 20px oklch(from var(--glow, oklch(0.8 0.2 300)) l c h / 30%); 
                    transform: translateY(-2px);
                }
                .theme-light .premium-tab.active { color: #ffffff !important; }
                
                .internal-link { color: var(--glow, oklch(0.8 0.2 300)); text-decoration: none; transition: opacity 0.2s ease; }
                .internal-link:hover { opacity: 0.7; }
                
                .markdown-rendered-content {
                    font-family: var(--font-sans);
                    line-height: 1.7;
                    color: var(--text-normal);
                    font-size: 15px;
                    font-variant: small-caps;
                    letter-spacing: 0.03em;
                }
                .markdown-rendered-content p {
                    margin-bottom: 1.2em;
                }
                .markdown-rendered-content h1, .markdown-rendered-content h2, .markdown-rendered-content h3 {
                    font-family: 'Outfit', sans-serif;
                    letter-spacing: 0.05em;
                    margin-top: 2em;
                    margin-bottom: 0.8em;
                    font-variant: small-caps;
                    text-transform: none;
                }
                .markdown-rendered-content blockquote {
                    margin: 1.5em 0;
                    padding: 12px 24px;
                    background: rgba(var(--background-primary-alt-rgb), 0.5);
                    border-left: 4px solid var(--glow);
                    border-radius: 0 12px 12px 0;
                    color: var(--text-normal);
                    font-style: italic;
                    font-size: 14px;
                }
                /* --- PREMIUM COLLAPSIBLE STYLING --- */
                .collapsible-wrapper {
                    margin-bottom: 2em;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1.5px solid var(--glow-faint);
                    border-radius: 18px;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    backdrop-filter: blur(10px);
                }
                .collapsible-wrapper.is-expanded {
                    border-color: var(--glow-med);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 15px oklch(from var(--glow) l c h / 5%);
                }
                .collapsible-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 28px;
                    cursor: pointer;
                    background: linear-gradient(to right, rgba(255,255,255,0.05), transparent);
                    transition: all 0.3s ease;
                    user-select: none;
                }
                .collapsible-header:hover {
                    background: linear-gradient(to right, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
                }
                .collapsible-header:hover .collapsible-title {
                    color: var(--glow);
                    transform: translateX(4px);
                }
                .collapsible-title {
                    margin: 0 !important;
                    font-size: 13px !important;
                    font-weight: 900 !important;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    font-variant: small-caps;
                    transition: all 0.3s ease;
                }
                .is-expanded .collapsible-title {
                    color: var(--text-bright);
                }
                .collapsible-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .is-expanded .collapsible-icon {
                    transform: rotate(180deg);
                    color: var(--glow);
                }
                .collapsible-content {
                    padding: 28px;
                    border-top: 1.5px solid var(--glow-faint);
                    background: rgba(0, 0, 0, 0.2);
                    animation: sectionSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes sectionSlideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes nf-slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .theme-light .collapsible-wrapper { background: #fff; border-color: rgba(0,0,0,0.18) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
                .theme-light .collapsible-header { background: linear-gradient(to right, #fcfcfd, #f5f5f7) !important; border-bottom: 1px solid rgba(0,0,0,0.15) !important; }
                .theme-light .collapsible-header:hover { background: #f0f0f3 !important; }
                .theme-light .collapsible-title { color: #444 !important; }
                .theme-light .collapsible-content { background: #ffffff !important; border-top-color: rgba(0,0,0,0.15) !important; }
                .theme-light .is-expanded .collapsible-title { color: var(--glow) !important; }

                /* --- ULTRA-RESILIENT CALLOUT SYSTEM (CUSTOM NAMESPACE) --- */
                .markdown-rendered-content .ids-callout-note { --callout-accent: 110, 130, 255; }
                .markdown-rendered-content .ids-callout-tip { --callout-accent: 34, 197, 94; }
                .markdown-rendered-content .ids-callout-info { --callout-accent: 59, 130, 246; }
                .markdown-rendered-content .ids-callout-important { --callout-accent: 217, 70, 239; }
                .markdown-rendered-content .ids-callout-warning { --callout-accent: 245, 158, 11; }
                .markdown-rendered-content .ids-callout-danger { --callout-accent: 239, 68, 68; }
                .markdown-rendered-content .ids-callout-todo { --callout-accent: 20, 184, 166; }
                .markdown-rendered-content .ids-callout-caution { --callout-accent: 249, 115, 22; }

                .markdown-rendered-content .ids-callout {
                    margin: 2.5em 0 !important;
                    padding: 0 !important;
                    border-radius: 20px !important;
                    background: linear-gradient(135deg, rgba(var(--callout-accent), 0.15), rgba(var(--callout-accent), 0.05)) !important;
                    border: 1.5px solid rgba(var(--callout-accent), 0.3) !important;
                    overflow: hidden !important;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3) !important;
                    position: relative !important;
                    backdrop-filter: blur(15px) !important;
                    display: block !important;
                }
                .markdown-rendered-content .ids-callout-header {
                    display: flex !important;
                    align-items: center !important;
                    gap: 18px !important;
                    padding: 20px 28px !important;
                    background: rgba(var(--callout-accent), 0.12) !important;
                    border-bottom: 1.5px solid rgba(var(--callout-accent), 0.25) !important;
                    margin: 0 !important;
                }
                .markdown-rendered-content .ids-callout-icon-container {
                    width: 40px !important;
                    height: 40px !important;
                    background: rgb(var(--callout-accent)) !important;
                    border-radius: 12px !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    color: white !important;
                    box-shadow: 0 6px 20px rgba(var(--callout-accent), 0.45) !important;
                    flex-shrink: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .markdown-rendered-content .ids-callout-icon-container .ids-callout-icon { 
                    display: flex !important; 
                    align-items: center !important; 
                    justify-content: center !important; 
                    width: 22px !important; 
                    height: 22px !important;
                }
                .markdown-rendered-content .ids-callout-icon svg { 
                    width: 22px !important; 
                    height: 22px !important; 
                    stroke-width: 3px !important; 
                    display: block !important;
                }
                .markdown-rendered-content .ids-callout-title-text {
                    font-size: 14px !important;
                    font-weight: 900 !important;
                    letter-spacing: 0.15em !important;
                    text-transform: uppercase !important;
                    color: rgb(var(--callout-accent)) !important;
                    filter: brightness(1.4) saturate(1.2) !important;
                    font-variant: small-caps !important;
                    margin: 0 !important;
                }
                .markdown-rendered-content .ids-callout-content {
                    padding: 28px 32px !important;
                    font-size: 15px !important;
                    line-height: 1.8 !important;
                    color: var(--text-normal) !important;
                    background: transparent !important;
                    margin: 0 !important;
                }
                .markdown-rendered-content .ids-callout-content p { margin-bottom: 1.2em !important; }
                .markdown-rendered-content .ids-callout-content p:last-child { margin-bottom: 0 !important; }

                /* --- LIGHT MODE HARDENING (ULTRA-SPECIFIC) --- */
                .theme-light .markdown-rendered-content .ids-callout {
                    background: #ffffff !important;
                    background-image: linear-gradient(135deg, rgba(var(--callout-accent), 0.15), rgba(var(--callout-accent), 0.05)) !important;
                    border: 1.5px solid rgba(var(--callout-accent), 0.7) !important;
                    box-shadow: 0 12px 40px rgba(var(--callout-accent), 0.15) !important;
                    backdrop-filter: none !important;
                }
                .theme-light .markdown-rendered-content .ids-callout-header {
                    background: rgba(var(--callout-accent), 0.15) !important;
                    border-bottom: 1.5px solid rgba(var(--callout-accent), 0.4) !important;
                }
                .theme-light .markdown-rendered-content .ids-callout-title-text {
                    color: rgb(var(--callout-accent)) !important;
                    filter: brightness(0.45) saturate(1.5) !important;
                }
                .theme-light .markdown-rendered-content .ids-callout-content {
                    color: #111 !important;
                }
                .theme-light .markdown-rendered-content .ids-callout-icon-container {
                    box-shadow: 0 4px 12px rgba(var(--callout-accent), 0.4) !important;
                }

                /* --- TASK LISTS --- */
                .task-list-item {
                    list-style-type: none !important;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 8px;
                    padding-left: 0 !important;
                }
                .task-list-item input[type="checkbox"] {
                    margin-top: 5px;
                    width: 16px;
                    height: 16px;
                    accent-color: var(--glow);
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .task-list-content {
                    font-size: 14px;
                    color: var(--text-normal);
                }
                .theme-light .task-list-content { color: #333; }

                /* --- GLOBAL LIGHT MODE REFINEMENTS --- */
                .theme-light {
                    --background-primary: #f5f5f7;
                    --background-primary-alt: #ffffff;
                    --text-normal: #1d1d1f;
                    --text-muted: #86868b;
                }
            `}</style>
            <div style={layoutStyles.detailControlBar}>
                <div style={layoutStyles.tabBar}>
                    {categories.map(category => (
                        <div 
                            key={category} 
                            className={`premium-tab ${activeCategory === category ? 'active' : ''}`}
                            style={{ 
                                ...(styles.premiumTab || {}), 
                                ...(activeCategory === category && (styles.premiumTabActive || {})) 
                            }} 
                            onClick={() => onCategorySelect(category)}
                        >
                            [ {category} ]
                        </div>
                    ))}
                </div>
            </div>

            {modulesInCategory && modulesInCategory.length > 1 && (
                <div style={layoutStyles.iconNavigationArea}>
                    <div style={layoutStyles.horizontalScroller}>
                        {modulesInCategory.map(module => { 
                            const isActive = module.id === moduleMetadata.id; 
                            return (
                                <div key={module.id} ref={isActive ? activeItemRef : null}>
                                    <ModuleNavItem module={module} isActive={isActive} onClick={onModuleSelect} />
                                </div>
                            ) 
                        })}
                    </div>
                </div>
            )} 

            <header style={detailStyles.header}>
                <div style={detailStyles.breadcrumb}>
                    <span>{activeCategory}</span>
                    <span style={{ opacity: 0.3 }}>/</span>
                    <span style={{ color: 'var(--text-faint)' }}>{moduleMetadata.displayName}</span>
                </div>
            </header> 

            {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
                    <OverlayLogo size={40} animated={true} />
                    <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--glow)', opacity: 0.7 }}>[ ANALYZING DOCUMENTATION ]</span>
                </div>
            )}
            
            {error && <div style={{ padding: '24px', color: 'var(--text-error)', background: 'rgba(255,0,0,0.05)', borderRadius: '12px', border: '1px solid var(--text-error)' }}>{error}</div>}
            
            {content && !isLoading && (
                <div className="anim-fade-in-now"> 
                    {content.moduleDescription && <div style={detailStyles.description}><MarkdownRenderer markdown={content.moduleDescription} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={allModules}/></div>} 
                    {content.catalogMarkdown && (
                        <CollapsibleSection title="Conceptual Outline" initialCollapsed={false} headerClass="conceptual-outline-header">
                            <MarkdownRenderer markdown={content.catalogMarkdown} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={allModules}/>
                        </CollapsibleSection>
                    )} 
                    {content.components.map((comp, i) => (
                        <section key={i} id={comp.id} data-outline-target style={detailStyles.section}>
                            <h2 style={detailStyles.sectionTitle}>{comp.section}</h2> 
                            {comp.body && <div style={{ marginBottom: '2em' }}><MarkdownRenderer markdown={comp.body} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={allModules}/></div>}
                            {comp.info && <CollapsibleSection title="Info"><MarkdownRenderer markdown={comp.info} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={allModules}/></CollapsibleSection>} 
                            {comp.useWhen && <CollapsibleSection title="Use When"><MarkdownRenderer markdown={comp.useWhen} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={allModules}/></CollapsibleSection>} 
                            {comp.subComponents.map((sub, j) => (
                                <CollapsibleSection 
                                    key={j} 
                                    title={sub.name} 
                                    id={sub.id} 
                                    data-outline-target 
                                    style={{ marginBottom: '1.5em', border: '1px solid var(--glow-faint)', borderRadius: '12px', overflow: 'hidden' }}
                                    headerClass="sub-component-header"
                                >
                                    {sub.body && <div style={{ padding: '20px', borderBottom: '1px solid var(--glow-faint)', background: 'rgba(var(--background-primary-rgb), 0.2)' }}><MarkdownRenderer markdown={sub.body} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel} localTheme={localTheme} openModal={openModal} onModuleSelect={onModuleSelect} groupedModules={allModules}/></div>}
                                    {Object.entries(sub.details).map(([key, value]) => (
                                        <DetailRenderer 
                                            key={key} 
                                            detailKey={key} 
                                            detailValue={value} 
                                            codeHighlighter={codeHighlighter} 
                                            sourcePath={moduleMetadata.filePath} 
                                            babel={babel}
                                            localTheme={localTheme}
                                            openModal={openModal}
                                            onModuleSelect={onModuleSelect}
                                            groupedModules={allModules}
                                        />
                                    ))}
                                </CollapsibleSection>
                            ))}
                        </section>
                    ))}
                </div>
            )}
        </div>
    ); 
};


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- SECTION 3: MAIN COMPONENT (WITH CORRECTED ALIAS MAP) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function IntegratedDevelopmentSuite({ isActive = false, openModal, OverlayLogo, localTheme }) {
    const { data: groupedModules, isLoading: isScanning, error: scanError } = useShallowModuleScan(isActive);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedModuleMeta, setSelectedModuleMeta] = useState(null);
    const [codeHighlighter, setCodeHighlighter] = useState(null);
    const [babel, setBabel] = useState(null);
    const wrapperRef = useRef(null);

    // Sync categories
    useEffect(() => {
        if (groupedModules && !activeCategory) {
            const cats = Object.keys(groupedModules);
            if (cats.length > 0) setActiveCategory(cats[0]);
        }
    }, [groupedModules, activeCategory]);

    // Handle dependency loading
    useEffect(() => {
        if (!isActive) return;
        const init = async () => {
            try {
                if (!codeHighlighter) {
                    const { codeToHtml } = await import('https://esm.sh/shiki@1.6.0');
                    const highlighter = (c, l, theme = 'one-dark-pro') => codeToHtml(c, { lang: l, theme });
                    setCodeHighlighter(() => highlighter);
                }
                if (!window.Babel) {
                    await loadScript('https://unpkg.com/@babel/standalone/babel.min.js', 'Babel');
                }
                if (window.Babel && !babel) {
                    setBabel(window.Babel);
                }
            } catch (e) { console.error("Failed to load dependencies:", e); }
        };
        init();
    }, [isActive]);

    // Handle module selection -> Global Modal
    useEffect(() => {
        if (selectedModuleMeta) {
            const slides = [];
            if (selectedModuleMeta.cover) slides.push({ src: selectedModuleMeta.cover, type: 'image' });
            if (selectedModuleMeta.video) slides.push({ src: selectedModuleMeta.video, type: 'video' });

            // Fetch module content
            const loadContent = async () => {
                const file = dc.app.vault.getAbstractFileByPath(selectedModuleMeta.filePath);
                const content = await parseModuleFileContent(file);
                
                openModal({
                    title: selectedModuleMeta.displayName,
                    subtitle: selectedModuleMeta.majorCategory,
                    slides: slides,
                    isDocs: true,
                    moduleMetadata: selectedModuleMeta,
                    modulesInCategory: groupedModules?.[activeCategory] || [],
                    categories: Object.keys(groupedModules || {}),
                    allModules: groupedModules,
                    activeCategory: activeCategory,
                    codeHighlighter: codeHighlighter,
                    localTheme: localTheme,
                    content: content,
                    loading: false
                });
            };
            
            openModal({ 
                open: true, 
                loading: true, 
                isDocs: true,
                isDatacore: false,
                title: selectedModuleMeta.displayName,
                subtitle: selectedModuleMeta.majorCategory,
                moduleMetadata: selectedModuleMeta // Pass this too so breadcrumbs don't flicker
            });
            loadContent();
            
            setSelectedModuleMeta(null);
        }
    }, [selectedModuleMeta, groupedModules, activeCategory, openModal]);

    const handleViewSource = () => dc.app.workspace.openLinkText(dc.resolvePath("../_resources/content/SKILLS.bet8.md"), '', true);

    if (scanError) return <div style={{ padding: '24px', color: 'var(--text-error)' }}><h3>Docs Scanner Error</h3><pre>{scanError}</pre></div>;

    if (isScanning && !groupedModules) return (
        <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', color: 'var(--glow)', width: '100%' }}>
            {OverlayLogo && <OverlayLogo size={80} animated={true} />}
            <span style={{ animation: 'pulse 1.5s infinite', fontVariant: 'small-caps', letterSpacing: '4px', fontSize: '14px', opacity: 0.8 }}>[ LOADING ]</span>
        </div>
    );

    return (
      <div className={`ids-container ${localTheme}`} ref={wrapperRef}>
          <style>{`
              .ids-container { 
                  --font-sans: 'Inter', sans-serif; 
                  --glow: oklch(0.82 0.21 300); 
                  --glow-faint: oklch(from var(--glow) l c h / 18%); 
                  --glow-med: oklch(from var(--glow) l c h / 12%); 
                  --premium-tab-bg: rgba(255, 255, 255, 0.05);
                  --premium-tab-border: var(--glow-faint);
                  --text-error: #ff6b6b; 
                  width: 100%; 
                  max-width: 1280px; 
                  margin: 0 auto; 
                  display: flex; 
                  flex-direction: column; 
                  align-items: stretch; 
                  font-family: var(--font-sans); 
                  filter: none !important; /* Shield from global theme inversion */
              }
              .theme-light .ids-container,
              .ids-container.theme-light {
                  --glow: oklch(0.6 0.2 300); /* More vibrant purple for light mode */
                  --glow-faint: oklch(from var(--glow) l c h / 12%);
                  --glow-med: oklch(from var(--glow) l c h / 10%);
                  --premium-tab-bg: rgba(0, 0, 0, 0.04);
                  --premium-tab-border: rgba(0, 0, 0, 0.08);
                  filter: none !important;
              }
              .theme-light .markdown-rendered-content { color: #1a1a1a !important; }
              .theme-light .markdown-rendered-content h1 { color: #000000 !important; }
              .theme-light .markdown-rendered-content h2 { color: var(--glow) !important; border-bottom-color: rgba(0,0,0,0.06) !important; }
              .theme-light .markdown-rendered-content blockquote { background: rgba(0,0,0,0.03) !important; border-left-color: var(--glow) !important; }
              .theme-light .internal-link { color: var(--glow) !important; }
              .theme-light .code-block-wrapper { background: #ffffff !important; border: 2px solid rgba(0,0,0,0.1) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important; margin: 2.5em 0 !important; }
              .theme-light .code-block-header { background: #f8f8f9 !important; border-bottom: 2px solid rgba(0,0,0,0.06) !important; }
              .theme-light .code-block-content pre { background: transparent !important; color: #1a1a1a !important; padding: 24px !important; }
              .theme-light .language-label { color: #444 !important; font-weight: 700 !important; }
              .theme-light .copy-code-btn { border: 1.5px solid rgba(0,0,0,0.12) !important; color: #6e6e73 !important; background: #fff !important; }
              .theme-light .copy-code-btn:hover { background: #f2f2f3 !important; color: var(--glow) !important; border-color: var(--glow) !important; transform: scale(1.05); }
              .theme-light .copy-code-btn.copied { background: oklch(from var(--glow) l c h / 10%) !important; border-color: var(--glow) !important; color: var(--glow) !important; }
              
              .theme-light .source-button { background: rgba(0,0,0,0.04) !important; border-color: rgba(0,0,0,0.08) !important; color: #555 !important; }
              .theme-light .source-button:hover { background: var(--glow-faint) !important; color: var(--glow) !important; border-color: var(--glow) !important; }
              
              .premium-tab { 
                  padding: 8px 22px; 
                  border-radius: 12px; 
                  background: var(--premium-tab-bg); 
                  border: 1px solid var(--premium-tab-border); 
                  color: var(--text-muted); 
                  cursor: pointer; 
                  font-size: 11px; 
                  font-weight: 800; 
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                  font-variant: small-caps; 
                  letter-spacing: 0.12em; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  min-width: 120px; 
                  backdrop-filter: blur(10px); 
                  filter: none !important;
              }
              .premium-tab.active { 
                  background: var(--glow) !important; 
                  color: var(--text-on-accent) !important; 
                  border-color: var(--glow) !important; 
                  box-shadow: 0 8px 20px oklch(from var(--glow) l c h / 30%); 
                  transform: translateY(-2px);
              }
              .theme-light .premium-tab.active {
                  color: #ffffff !important;
                  filter: none !important;
              }
              
              .code-block-wrapper { border: 2px solid var(--glow-faint); border-radius: 16px; margin: 2.5em 0; background: #0b0b0f; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.4); transition: border-color 0.3s ease; }
              .code-block-wrapper:hover { border-color: var(--glow-med); }
              .code-block-header { display: flex; justify-content: space-between; padding: 12px 20px; background: rgba(255,255,255,0.03); border-bottom: 2px solid var(--glow-faint); }
              .code-block-content pre { background: transparent !important; padding: 24px !important; margin: 0 !important; font-family: 'JetBrains Mono', ui-monospace, monospace !important; font-size: 14px !important; line-height: 1.5 !important; text-transform: none !important; font-variant: normal !important; white-space: pre-wrap !important; word-break: break-word !important; }
              .code-block-content pre code { background: transparent !important; padding: 0 !important; border-radius: 0 !important; }
              .language-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; font-variant: small-caps; }
              .copy-code-btn { background: rgba(255,255,255,0.05); border: 1.5px solid var(--glow-faint); color: var(--text-muted); border-radius: 10px; cursor: pointer; width: 34px; height: 34px; display: grid; place-items: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
              .copy-code-btn:hover { background: var(--glow-faint); color: var(--glow); border-color: var(--glow); transform: translateY(-2px); }
              .copy-code-btn.copied { border-color: var(--glow) !important; background: oklch(from var(--glow) l c h / 15%) !important; color: var(--glow) !important; }
              .copy-code-btn .check-icon { display: none; stroke: currentColor; stroke-width: 3; }
              .copy-code-btn.copied .copy-icon { display: none !important; }
              .copy-code-btn.copied .check-icon { display: block !important; color: var(--glow) !important; animation: nf-scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
              .theme-light .copy-code-btn.copied .check-icon { color: var(--glow) !important; }
              
              .copy-code-btn::after { content: 'COPIED'; position: absolute; right: 40px; background: var(--glow); color: var(--text-on-accent); font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 6px; opacity: 0; pointer-events: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateX(10px); letter-spacing: 1px; }
              .copy-code-btn.copied::after { opacity: 1; transform: translateX(0); }
              
              /* --- PREMIUM TABLE SYSTEM --- */
              .markdown-rendered-content table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 2em 0; 
                  border-radius: 12px; 
                  overflow: hidden; 
                  border: 1px solid var(--glow-faint);
                  background: rgba(255,255,255,0.02);
                  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
              }
              .markdown-rendered-content th { 
                  background: oklch(from var(--glow) l c h / 10%);
                  color: var(--glow); 
                  font-weight: 800; 
                  text-align: left; 
                  padding: 14px 20px; 
                  font-size: 11px; 
                  text-transform: uppercase; 
                  letter-spacing: 0.1em; 
                  border-bottom: 2px solid var(--glow-faint);
                  font-variant: small-caps;
              }
              .markdown-rendered-content td { 
                  padding: 14px 20px; 
                  font-size: 13px; 
                  border-bottom: 1px solid oklch(from var(--glow) l c h / 5%);
                  line-height: 1.6;
                  color: var(--text-normal);
              }
              .markdown-rendered-content tr:last-child td { border-bottom: none; }
              .markdown-rendered-content tr:nth-child(even) { background: rgba(255,255,255,0.01); }
              .markdown-rendered-content tr:hover { background: oklch(from var(--glow) l c h / 4%); }

              .theme-light .markdown-rendered-content table { background: #fff; border-color: rgba(0,0,0,0.08); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
              .theme-light .markdown-rendered-content th { background: #f8f8f9; color: var(--glow); border-bottom-color: rgba(0,0,0,0.1); }
              .theme-light .markdown-rendered-content td { border-bottom-color: rgba(0,0,0,0.05); color: #333; }
              .theme-light .markdown-rendered-content tr:nth-child(even) { background: #fafafa; }
              .theme-light .markdown-rendered-content tr:hover { background: var(--glow-faint); }
              
              @keyframes nf-scaleIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
              .ids-sticky-header { 
                  position: sticky; 
                  top: 0; 
                  z-index: 100; 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center; 
                  padding: 12px 16px; 
                  backdrop-filter: blur(20px); 
                  background: var(--background-primary-alt);
                  border-bottom: 1px solid var(--glow-faint); 
                  margin-bottom: 24px; 
              }
              .source-button { 
                  background: transparent; 
                  border: 1px solid var(--glow-faint); 
                  color: var(--text-muted); 
                  padding: 8px 16px; 
                  border-radius: 8px; 
                  cursor: pointer; 
                  font-size: 13px; 
                  transition: all 0.2s ease; 
                  white-space: nowrap; 
                  font-variant: small-caps; 
              }
              .source-button:hover {
                  background: var(--glow-faint);
                  color: var(--text-bright);
              }
              .ids-horizontal-scroll { 
                  width: 100%;
                  overflow-x: auto;
                  scrollbar-width: thin;
                  scrollbar-color: var(--glow-faint) transparent;
              }
              .ids-horizontal-scroll::-webkit-scrollbar { height: 6px; }
              .ids-horizontal-scroll::-webkit-scrollbar-thumb { background: var(--glow-faint); border-radius: 10px; }
              @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
              .anim-fade-in-now { animation: fadeIn .5s ease-out; }
          `}</style>
          
          <div className="ids-sticky-header">
               <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {groupedModules && Object.keys(groupedModules).map(category => (
                      <div 
                          key={category} 
                          className={`premium-tab ${activeCategory === category ? 'active' : ''}`}
                          onClick={() => setActiveCategory(category)}
                      >
                          [ {category} ]
                      </div>
                  ))}
               </div>
               <button 
                  onClick={handleViewSource}
                  className="source-button"
               >
                  Vault Archive
               </button>
          </div>

          <div className="ids-module-grid-wrapper anim-fade-in-now" style={{ width: '100%', perspective: '1000px' }}>
              {groupedModules && activeCategory && (
                  <ModuleGridView 
                    modules={groupedModules[activeCategory]} 
                    onSelect={setSelectedModuleMeta} 
                    styles={{
                        gridContainer: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '28px', padding: '24px 32px', justifyContent: 'flex-start', width: '100%', boxSizing: 'border-box' },
                        tile: { position: 'relative', width: '220px', height: '220px', padding: '28px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-primary)', border: '1.5px solid var(--glow-faint)', borderRadius: '32px', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 12px 40px rgba(0,0,0,.3)', overflow: 'hidden', flexShrink: 0, backdropFilter: 'blur(12px)' },
                        tileGlow: { position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, oklch(from var(--glow) l c h / 12%) 0%, transparent 60%)', opacity: 0, transition: 'opacity 0.4s ease', pointerEvents: 'none', zIndex: 1 },
                        tileIconCentered: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '32px', opacity: 0.85 },
                        tileFooter: { position: 'absolute', bottom: '28px', left: 0, right: 0, textAlign: 'center', zIndex: 2, padding: '0 20px' },
                        tileName: { margin: 0, fontSize: '13px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'color 0.3s ease', fontVariant: 'small-caps' }
                    }} 
                  />
              )}
          </div>
      </div>
    );
}

const parseModuleFileContent = async (file) => {
    if (!file) return null;
    try {
        const content = await dc.app.vault.read(file);
        const cache = dc.app.metadataCache.getFileCache(file);
        const frontmatter = cache?.frontmatter || {};
        const lines = content.split('\n');

        const moduleDescription = frontmatter.description || "";
        const catalogMarkdown = frontmatter.catalog || "";
        const components = [];
        let currentSection = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('## ')) {
                currentSection = {
                    section: line.substring(3).trim(),
                    id: slugify(line.substring(3).trim()),
                    info: "",
                    useWhen: "",
                    body: "",
                    subComponents: []
                };
                components.push(currentSection);
            } else if (currentSection) {
                if (line.startsWith('### ')) {
                    const subName = line.substring(4).trim();
                    const subId = slugify(subName);
                    const subComponent = { name: subName, id: subId, details: {}, body: "" };
                    currentSection.subComponents.push(subComponent);

                    let j = i + 1;
                    let currentDetailKey = null;
                    while (j < lines.length && !lines[j].trim().startsWith('##')) {
                        const subLine = lines[j].trim();
                        if (subLine.startsWith('#### ')) {
                            currentDetailKey = subLine.substring(5).trim();
                            subComponent.details[currentDetailKey] = "";
                        } else if (subLine.startsWith('### ')) {
                            // Hit another subcomponent, stop this loop
                            break;
                        } else if (currentDetailKey) {
                            subComponent.details[currentDetailKey] += lines[j] + '\n';
                        } else {
                            subComponent.body += lines[j] + '\n';
                        }
                        j++;
                    }
                    i = j - 1;
                } else if (line.startsWith('**Info:**')) {
                    currentSection.info = line.substring(9).trim();
                } else if (line.startsWith('**Use When:**')) {
                    currentSection.useWhen = line.substring(13).trim();
                } else {
                    currentSection.body += lines[i] + '\n';
                }
            }
        }
        return { moduleDescription, catalogMarkdown, components };
    } catch (e) {
        console.error("Failed to parse module content", e);
        return null;
    }
};

return { 
    IntegratedDevelopmentSuite_v18: IntegratedDevelopmentSuite, 
    DocsDetailView: ModuleDetailView,
    MarkdownRenderer,
    DetailRenderer,
    parseModuleFileContent
};
