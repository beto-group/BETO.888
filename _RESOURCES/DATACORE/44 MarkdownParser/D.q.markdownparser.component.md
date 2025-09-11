


# ViewComponent


```jsx
const { useEffect, useState, useMemo, useRef } = dc;

// --- FINAL FIX ---
// 1. Define the file path ONCE at the top level as a constant.
const ICON_FILE_PATH = "_RESOURCES/DATACORE/45 SVGAnimations/D.q.svganimations.component.md";

// 2. Use this constant for the reliable initial load.
const { ICONS } = await dc.require(dc.headerLink(ICON_FILE_PATH, "ICONS"));

// --- UTILITY TO LOAD A SCRIPT FROM THE VAULT ---
async function loadScriptFromVault(filePath) {
    const scriptId = `script-${filePath.replace(/[^a-zA-Z0-9]/g, '')}`;
    if (document.getElementById(scriptId) || (filePath.includes('babel') && window.Babel)) {
        return;
    }
    const resourcePath = await getMediaResourcePath(filePath);
    if (!resourcePath) throw new Error(`Script file not found in vault at path: ${filePath}`);
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = resourcePath;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${filePath}`));
        document.body.appendChild(script);
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
        return <div style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>Loading Live Component...</div>;
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
const useShallowModuleScan = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const scanMasterFile = async () => {
            try {
                // Configuration remains the same, though the regex part is now handled internally.
                const CONFIG = {
                    sourceFilePath: "_RESOURCES/DOCS/DOCS.bet8.md"
                };

                const sourceFile = dc.app.vault.getAbstractFileByPath(CONFIG.sourceFilePath);
                if (!sourceFile) throw new Error(`Master file not found: ${CONFIG.sourceFilePath}`);

                const sourceContent = await dc.app.vault.read(sourceFile);
                const lines = sourceContent.split('\n');
                const basePath = sourceFile.path.substring(0, sourceFile.path.lastIndexOf('/'));
                
                // Define regex for both the new Markdown link format and the old Wikilink format.
                const newLinkRegex = /###### \[([^\]]+)\]\(([^)]+)\)/;
                const oldLinkRegex = /###### \[\[([^|\]]+)(?:\|([^\]]+))?\]\]/;

                const modulesByCategory = {};
                let currentMajorCategory = null;

                for (const line of lines) {
                    const trimmedLine = line.trim();

                    // Detect a new major category (e.g., "# GENERAL", "# DATACORE")
                    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('##')) {
                        currentMajorCategory = trimmedLine.substring(2).trim();
                        if (!modulesByCategory[currentMajorCategory]) {
                            modulesByCategory[currentMajorCategory] = [];
                        }
                        continue; // Move to the next line
                    }

                    // Process module links only if we are inside a major category
                    if (currentMajorCategory && trimmedLine.startsWith('######')) {
                        let moduleData = null;
                        
                        // Try to match the new Markdown link format first
                        let match = trimmedLine.match(newLinkRegex);
                        if (match) {
                            const displayName = match[1].trim().replace(/ info$/i, '');
                            const relativePath = match[2].trim();
                            const filePath = `${basePath}/${decodeURIComponent(relativePath)}`;
                            moduleData = { displayName, majorCategory: currentMajorCategory, filePath, id: filePath };
                        } 
                        
                        // If it fails, try to match the old Wikilink format
                        else {
                            match = trimmedLine.match(oldLinkRegex);
                            if (match) {
                                const filePathPart = match[1].trim();
                                const displayName = (match[2] || match[1]).trim().replace(/ info$/i, '');
                                const filePath = `${basePath}/${decodeURIComponent(filePathPart)}.md`;
                                moduleData = { displayName, majorCategory: currentMajorCategory, filePath, id: filePath };
                            }
                        }

                        // If a module was successfully parsed, add it to the current category
                        if (moduleData) {
                            modulesByCategory[currentMajorCategory].push(moduleData);
                        }
                    }
                }

                setData(modulesByCategory);
            } catch (e) {
                console.error("[Docs Scanner] FATAL ERROR:", e);
                setError(e.stack);
            } finally {
                setIsLoading(false);
            }
        };

        scanMasterFile();
    }, []);

    return { data, isLoading, error };
};

// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- SECTION 2: VIEW COMPONENTS ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const useInView = (options) => {  const [isInView, setIsInView] = useState(false); const ref = useRef(null); useEffect(() => { const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsInView(true); if (ref.current) observer.unobserve(ref.current); } }, { ...options }); if (ref.current) observer.observe(ref.current); return () => { if (ref.current) observer.unobserve(ref.current); }; }, [options]); return [ref, isInView]; };
const AnimatedIcon = ({ svgString, isActive, isInView }) => {  const iconRef = useRef(null); const [hasRevealed, setHasRevealed] = useState(false); const drawableElementsRef = useRef([]); const fadeableElementsRef = useRef([]); const animationLoopId = useRef(null); const DURATION = 0.88; useEffect(() => { const container = iconRef.current; if (!container || !svgString) return; container.innerHTML = ''; drawableElementsRef.current = []; fadeableElementsRef.current = []; container.innerHTML = svgString.replace(/stroke="none"/g, '').replace(/stroke-width="0"/g, ''); const svgElement = container.querySelector('svg'); if (!svgElement) return; svgElement.style.width = '100%'; svgElement.style.height = '100%'; svgElement.style.display = 'block'; const allShapes = svgElement.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon'); allShapes.forEach(el => { if (typeof el.getTotalLength === 'function' && el.getTotalLength() > 0) { const length = el.getTotalLength(); el.style.strokeDasharray = length; el.style.strokeDashoffset = length; el.style.stroke = 'white'; el.style.strokeWidth = '1.5px'; el.style.fill = 'transparent'; drawableElementsRef.current.push(el); } else { el.style.opacity = '0'; el.style.fill = 'black'; fadeableElementsRef.current.push(el); } }); }, [svgString]); useEffect(() => { if (isInView && !hasRevealed) { const drawables = drawableElementsRef.current; const fadeables = fadeableElementsRef.current; let totalAnimationTime = 0; drawables.forEach((el, index) => { const delay = 0.1 * index * DURATION; el.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay + (DURATION * 0.2)}s`; el.style.strokeDashoffset = '0'; el.style.fill = 'black'; totalAnimationTime = Math.max(totalAnimationTime, (delay + DURATION) * 1000); }); fadeables.forEach((el, index) => { const delay = 0.1 * (index + drawables.length) * DURATION; el.style.transition = `opacity ${DURATION * 0.7}s ease ${delay}s`; el.style.opacity = '1'; totalAnimationTime = Math.max(totalAnimationTime, (delay + DURATION * 0.7) * 1000); }); setTimeout(() => setHasRevealed(true), totalAnimationTime); } }, [isInView, hasRevealed]); useEffect(() => { clearTimeout(animationLoopId.current); if (!isActive || !hasRevealed) { const allElements = [...drawableElementsRef.current, ...fadeableElementsRef.current]; allElements.forEach(el => el.style.transition = 'none'); drawableElementsRef.current.forEach(el => { el.style.strokeDashoffset = '0'; el.style.fill = 'black'; }); fadeableElementsRef.current.forEach(el => { el.style.opacity = '1'; }); return; } const drawables = drawableElementsRef.current; const fadeables = fadeableElementsRef.current; const calculateTotalTime = () => { const drawableTime = drawables.length > 0 ? (0.1 * (drawables.length - 1) * DURATION + DURATION) * 1000 : 0; const fadeableTime = fadeables.length > 0 ? (0.1 * (fadeables.length - 1 + drawables.length) * DURATION + DURATION * 0.7) * 1000 : 0; return Math.max(drawableTime, fadeableTime); }; const animationDuration = calculateTotalTime(); const overlapTransitionTime = animationDuration * 0.85; const animateErase = () => { drawables.forEach((el, index) => { const delay = 0.1 * index * DURATION; el.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay}s`; el.style.strokeDashoffset = el.getTotalLength(); el.style.fill = 'transparent'; }); fadeables.forEach((el, index) => { const delay = 0.1 * (index + drawables.length) * DURATION; el.style.transition = `opacity ${DURATION * 0.7}s ease ${delay}s`; el.style.opacity = '0'; }); }; const animateDraw = () => { drawables.forEach((el, index) => { const delay = 0.1 * index * DURATION; el.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay + (DURATION * 0.2)}s`; el.style.strokeDashoffset = '0'; el.style.fill = 'black'; }); fadeables.forEach((el, index) => { const delay = 0.1 * (index + drawables.length) * DURATION; el.style.transition = `opacity ${DURATION * 0.7}s ease ${delay}s`; el.style.opacity = '1'; }); }; const loop = () => { animateErase(); animationLoopId.current = setTimeout(() => { animateDraw(); animationLoopId.current = setTimeout(loop, overlapTransitionTime); }, overlapTransitionTime); }; loop(); return () => { clearTimeout(animationLoopId.current); }; }, [isActive, hasRevealed]); return (<div ref={iconRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />); };
const CollapsibleSection = ({ title, children, initialCollapsed = false, headerClass = '', ...rest }) => {  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed); const toggleCollapse = () => setIsCollapsed(!isCollapsed); return (<div {...rest} className={`collapsible-wrapper ${isCollapsed ? 'is-collapsed' : ''}`}> <div className={`collapsible-header ${headerClass}`} onClick={toggleCollapse}> <span className="collapsible-icon">▼</span> <h3 className="collapsible-title">{title}</h3> </div> <div className="collapsible-content">{children}</div> </div>); };
const MarkdownRenderer = ({ markdown, codeHighlighter, sourcePath, babel }) => {
    const [renderedContent, setRenderedContent] = useState([]);

    useEffect(() => {
        const render = async () => {
            if (!markdown) {
                setRenderedContent([]);
                return;
            }

            const componentPlaceholder = (index) => `__DATACORE_JSX_COMPONENT_${index}__`;
            const datacoreJsxRegex = /^```datacorejsx\r?\n([\s\S]*?)\r?\n```\s*$/gm;
            const liveComponents = [];
            let processedHtml = markdown.replace(datacoreJsxRegex, (match, code) => {
                const componentIndex = liveComponents.length;
                liveComponents.push(<DatacoreJSXRenderer key={`live_${componentIndex}`} code={code.trim()} babel={babel} />);
                return componentPlaceholder(componentIndex);
            });

            const codeBlockPlaceholder = (index) => `__CODE_BLOCK_${index}__`;
            const codeBlockRegex = /^```(.*)\r?\n([\s\S]*?)\r?\n```\s*$/gm;
            const codeMatches = [...processedHtml.matchAll(codeBlockRegex)];
            const codeBlockHtmlPromises = codeMatches.map(async (match) => {
                let lang = (match[1] || 'txt').trim().toLowerCase();
                const code = match[2].trim();
                const encodedCode = btoa(unescape(encodeURIComponent(code)));
                const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>`;
                const copyButton = `<button class="copy-code-btn" data-code="${encodedCode}" title="Copy code"><span class="copy-icon">${copyIcon}</span><span class="check-icon">${checkIcon}</span></button>`;
                let highlightedCode = '';
                try {
                    const langIdentifier = lang.split(' ')[0];
                    highlightedCode = codeHighlighter ? await codeHighlighter(code, langIdentifier) : `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
                } catch (e) {
                    highlightedCode = `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
                }
                return `<details class="code-block-wrapper" open><summary class="code-block-header"><span class="language-label">${lang}</span>${copyButton}</summary><div class="code-block-content">${highlightedCode}</div></details>`;
            });
            processedHtml = processedHtml.replace(codeBlockRegex, (match, lang, code, offset) => codeBlockPlaceholder(codeMatches.findIndex(m => m.index === offset)));

            const processMarkdownChunk = async (chunk) => {
                if (!chunk) return '';
                let processed = chunk;

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
                processed = processed.replace(/^-{3,}/gim, '<hr/>').replace(/^\s*>\s?(.*)/gim, '<blockquote>$1</blockquote>');

                const tableRegex = /^\|(.+)\r?\n\|( *[-:]+[-| :]*)\r?\n((?:\|.*(?:\r?\n|$))*)/gm;
                processed = processed.replace(tableRegex, (match, headerLine, separatorLine, bodyLines) => {
                    const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
                    const rows = bodyLines.trim().split('\n').map(rowLine => rowLine.split('|').map(c => c.trim()).filter(Boolean));
                    const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
                    const tbody = `<tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
                    return `<table>${thead}${tbody}</table>`;
                });

                processed = processed.replace(/((?:^\s*[-*+].*\n?)+)/gm, (match) => {
                    const listItems = match.trim().split('\n').map(line => `<li>${line.replace(/^\s*[-*+]\s+/, '')}</li>`).join('');
                    return `<ul>${listItems}</ul>`;
                });

                processed = processed.replace(/((?:^\s*\d+\.\s*\n?)+)/gm, (match) => {
                    const listItems = match.trim().split('\n').map(line => `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
                    return `<ol>${listItems}</ol>`;
                });

                processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>').replace(/`([^`]+)`/g, '<code>$1</code>');

                return processed.split('\n').map(line => {
                    if (line.trim() === '') return '';
                    if (line.trim().match(/^__(DATACORE_JSX_COMPONENT|CODE_BLOCK)_\d+__$/)) {
                        return line;
                    }
                    if (line.match(/<(h[1-6]|ul|ol|li|blockquote|hr|pre|table|img|div|details|video)/)) return line;
                    return `<p>${line}</p>`;
                }).join('');
            };

            const calloutPlaceholder = (index) => `__CALLOUT_${index}__`;
            const calloutRegex = /^>\s?\[\!(\w+)\]([+-])?(.*)\r?\n((?:^>.*\r?\n?)*)/gm;
            const calloutMatches = [...processedHtml.matchAll(calloutRegex)];
            const calloutHtmlPromises = calloutMatches.map(async (match) => {
                const [_, type, collapse, title, content] = match;
                const calloutType = type.toLowerCase() || 'note';
                const isCollapsed = collapse === '-';
                const titleText = title.trim();
                const innerContent = content.replace(/^>\s?/gm, '');
                const renderedInnerContent = await processMarkdownChunk(innerContent);
                const openAttr = isCollapsed ? '' : 'open';
                return `<details class="callout callout-${calloutType}" ${openAttr}><summary class="callout-title"><span class="callout-icon">${ICONS[calloutType.toUpperCase()]?.svg || '💡'}</span><span class="callout-title-text">${titleText || calloutType.charAt(0).toUpperCase() + calloutType.slice(1)}</span></summary><div class="callout-content">${renderedInnerContent}</div></details>`;
            });
            processedHtml = processedHtml.replace(calloutRegex, (match, ...args) => calloutPlaceholder(calloutMatches.findIndex(m => m[0] === match)));

            let finalHtmlString = await processMarkdownChunk(processedHtml);

            const resolvedCodeBlocks = await Promise.all(codeBlockHtmlPromises);
            resolvedCodeBlocks.forEach((html, index) => {
                finalHtmlString = finalHtmlString.replace(codeBlockPlaceholder(index), html);
            });

            const resolvedCallouts = await Promise.all(calloutHtmlPromises);
            resolvedCallouts.forEach((html, index) => {
                finalHtmlString = finalHtmlString.replace(calloutPlaceholder(index), html);
            });

            const finalContentArray = [];
            const htmlChunks = finalHtmlString.split(/__DATACORE_JSX_COMPONENT_\d+__/g);
            htmlChunks.forEach((chunk, index) => {
                if (chunk) {
                    finalContentArray.push(<div key={`html_${index}`} dangerouslySetInnerHTML={{ __html: chunk }} />);
                }
                if (liveComponents[index]) {
                    finalContentArray.push(liveComponents[index]);
                }
            });
            setRenderedContent(finalContentArray);
        };
        render();
    }, [markdown, codeHighlighter, sourcePath, babel]);

    return <div className="markdown-rendered-content">{renderedContent}</div>;
};
const ModuleTile = ({ module, onSelect, svgString, styles }) => {  const [isHovering, setIsHovering] = useState(false); const [tileRef, isInView] = useInView({ threshold: 0.1 }); const tileStyle = { ...styles.tile, borderColor: isHovering ? 'var(--glow-med)' : 'var(--glow-faint)', backgroundColor: isHovering ? 'var(--glow-med)' : 'var(--surface-primary)' }; const svgContainerStyle = { position: 'absolute', top: '12px', left: '12px', right: '12px', bottom: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }; const nameStyle = { ...styles.tileName, color: isHovering ? 'var(--text-bright)' : 'var(--text-muted)' }; return (<div ref={tileRef} style={tileStyle} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} onClick={() => onSelect(module)}> <div style={svgContainerStyle}> {svgString ? (<AnimatedIcon svgString={svgString} isActive={isHovering} isInView={isInView} />) : (<p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>ICON<br />N/A</p>)} </div> <p style={nameStyle}>{module.displayName}</p> </div>); };
const ModuleGridView = ({ modules, onSelect, styles, iconMap, aliasMap }) => {  return (<div className="anim-fade-in-now" style={styles.gridContainer}> {modules.map(module => { const baseKey = module.displayName.toUpperCase(); const finalLookupKey = aliasMap[baseKey] || baseKey; return (<ModuleTile key={module.id} module={module} onSelect={onSelect} svgString={iconMap[finalLookupKey]} styles={styles} />); })} </div>); };
const ModuleNavItem = ({ module, isActive, onClick, iconMap, aliasMap }) => {  const [isHovering, setIsHovering] = useState(false); const [selfRef, isInView] = useInView({ threshold: 0.1 }); const styles = { wrapper: { position: 'relative', width: '64px', height: '64px' }, container: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-primary)', border: '1px solid var(--glow-faint)', borderRadius: '10px', cursor: 'pointer', flexShrink: 0, width: '64px', height: '64px', borderColor: isActive ? 'var(--glow)' : 'var(--glow-faint)', backgroundColor: isActive ? 'var(--glow-med)' : 'var(--surface-primary)', transform: isHovering ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s ease, background-color 0.2s ease, border-color 0.2s ease', zIndex: isHovering ? 2 : 1, }, iconContainer: { width: '36px', height: '36px' }, text: { position: 'absolute', bottom: '-22px', left: '50%', transform: `translateX(-50%) scale(${isHovering ? 1 : 0.8})`, opacity: isHovering ? 1 : 0, transition: 'opacity 0.3s ease, transform 0.3s ease', pointerEvents: 'none', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--text-normal)', textAlign: 'center' } }; const baseKey = module.displayName.toUpperCase(); const finalLookupKey = aliasMap[baseKey] || baseKey; const svgString = iconMap[finalLookupKey]; return (<div ref={selfRef} style={styles.wrapper} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}><div style={styles.container} onClick={() => onClick(module)}><div style={styles.iconContainer}>{svgString ? (<AnimatedIcon svgString={svgString} isActive={isHovering || isActive} isInView={isInView} />) : (<div style={{ color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center' }}>N/A</div>)}</div></div><span style={styles.text}>{module.displayName}</span></div>); };
const DetailRenderer = ({ detailKey, detailValue, codeHighlighter, sourcePath, babel }) => { if (!detailValue || (Array.isArray(detailValue) && detailValue.length === 0)) return null; const rendererStyles = { wrapper: { marginBottom: '1.5em' }, key: { fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5em', letterSpacing: '0.05em' } }; const renderContent = () => { if (detailKey === 'Table' && Array.isArray(detailValue)) { return <MarkdownRenderer markdown={String(detailValue)} codeHighlighter={codeHighlighter} sourcePath={sourcePath} babel={babel} />; } if (['Signature', 'Code', 'Conceptual Example'].includes(detailKey)) { const language = (detailKey === 'Signature') ? 'typescript' : 'jsx'; const markdown = `\`\`\`${language}\n${String(detailValue).trim()}\n\`\`\``; return <MarkdownRenderer markdown={markdown} codeHighlighter={codeHighlighter} sourcePath={sourcePath} babel={babel}/>; } return <MarkdownRenderer markdown={String(detailValue)} codeHighlighter={codeHighlighter} sourcePath={sourcePath} babel={babel}/>; }; return (<div style={rendererStyles.wrapper}><h5 style={rendererStyles.key}>{detailKey}</h5>{renderContent()}</div>); };
const OutlineNav = ({ items, activeId, styles, navRef, handleNavClick }) => {if (!items || items.length === 0) return null; const renderItems = (itemList, level = 0) => (<ul style={{ ...styles.outlineList, paddingLeft: `${level * 16}px` }}> {itemList.map(item => (<li key={item.id} style={styles.outlineListItem}> <a href={`#${item.id}`} onClick={(e) => handleNavClick(e, item.id)} style={{ ...styles.outlineLink, ...(activeId === item.id && styles.outlineLinkActive) }} data-id={item.id}> {item.title} </a> {item.children && item.children.length > 0 && renderItems(item.children, level + 1)} </li>))} </ul>); return (<nav ref={navRef} style={styles.outlineNav}>{renderItems(items)}</nav>); };
const ScrollIndicator = ({ items, activeId, progress, styles, handleNavClick, hoveredId, setHoveredId }) => { if (!items || items.length === 0) return null; return (<div style={styles.indicatorTrack}> <div style={{ ...styles.indicatorProgress, height: `${progress}%` }}></div> {items.map(item => { const isActive = activeId === item.id; const isHovered = hoveredId === item.id; return (<div key={item.id} title={item.title} style={{ ...styles.indicatorDot, top: `${item.percentPosition}%`, ...(isHovered && !isActive && styles.indicatorDotHover), ...(isActive && styles.indicatorDotActive) }} onClick={(e) => handleNavClick(e, item.id)} onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)} ></div>) })} </div>); };
const ModuleDetailView = ({ moduleMetadata, content, isLoading, error, modulesInCategory, onModuleSelect, onBack, codeHighlighter, styles, iconMap, aliasMap, contentRef, babel }) => {  const activeItemRef = useRef(null); useEffect(() => { setTimeout(() => { activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }, 100); }, [moduleMetadata.id]); const detailStyles = { header: { paddingBottom: '1em', borderBottom: '1px solid var(--glow-faint)' }, title: { margin: '0', fontSize: '28px', fontWeight: 700, color: 'var(--glow)' }, description: { margin: '1em 0 2em 0', color: 'var(--text-normal)', fontSize: '16px', maxWidth: '75ch' }, section: { marginBottom: '3em', scrollMarginTop: '80px' }, sectionTitle: { fontSize: '22px', margin: '0 0 1.2em 0', color: 'var(--glow)', paddingBottom: '0.5em', borderBottom: '1px solid var(--glow-faint)' } }; return (<div ref={contentRef}><div style={styles.detailControlBar}><button onClick={onBack} style={styles.backButton}>← Back to Grid View</button></div> {modulesInCategory && modulesInCategory.length > 1 && (<div style={styles.iconNavigationArea}><div style={styles.horizontalScroller}>{modulesInCategory.map(module => { const isActive = module.id === moduleMetadata.id; return (<div key={module.id} ref={isActive ? activeItemRef : null}><ModuleNavItem module={module} isActive={isActive} onClick={onModuleSelect} iconMap={iconMap} aliasMap={aliasMap} /></div>) })}</div></div>)} <header style={detailStyles.header}><h1 style={detailStyles.title}>{moduleMetadata.displayName}</h1></header> {isLoading && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px' }}>Loading...</div>} {error && <div style={{ color: 'var(--text-error)' }}>Error: {error}</div>} {content && !isLoading && (<div className="anim-fade-in-now"> {content.moduleDescription && <div style={detailStyles.description}><MarkdownRenderer markdown={content.moduleDescription} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel}/></div>} {content.catalogMarkdown && (<CollapsibleSection title="Conceptual Outline" initialCollapsed={false} headerClass="conceptual-outline-header"><MarkdownRenderer markdown={content.catalogMarkdown} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel} /></CollapsibleSection>)} {content.components.map((comp, i) => (<section key={i} id={comp.id} data-outline-target style={detailStyles.section}><h2 style={detailStyles.sectionTitle}>{comp.section}</h2> {comp.info && <CollapsibleSection title="Info"><MarkdownRenderer markdown={comp.info} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel}/></CollapsibleSection>} {comp.useWhen && <CollapsibleSection title="Use When"><MarkdownRenderer markdown={comp.useWhen} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel}/></CollapsibleSection>} {comp.subComponents.map((sub, j) => (<CollapsibleSection key={j} title={sub.name} initialCollapsed={true} headerClass="sub-component-header" id={sub.id} data-outline-target>{Object.entries(sub.details).map(([key, value]) => (<DetailRenderer key={key} detailKey={key} detailValue={value} codeHighlighter={codeHighlighter} sourcePath={moduleMetadata.filePath} babel={babel}/>))}</CollapsibleSection>))}</section>))}</div>)}</div>); };


// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// --- SECTION 3: MAIN COMPONENT (WITH CORRECTED ALIAS MAP) ---
// =-=--=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function IntegratedDevelopmentSuite() {
    const { data: groupedModules, isLoading: isScanning, error: scanError } = useShallowModuleScan();
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedModuleMeta, setSelectedModuleMeta] = useState(null);
    const [codeHighlighter, setCodeHighlighter] = useState(null);
    const [babel, setBabel] = useState(null);
    const wrapperRef = useRef(null);
    const [detailContent, setDetailContent] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [isOutlineOpen, setIsOutlineOpen] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [outlineWithPositions, setOutlineWithPositions] = useState([]);
    const [hoveredId, setHoveredId] = useState(null);
    const [isHoveringOutline, setIsHoveringOutline] = useState(false);
    const contentRef = useRef(null);
    const outlineNavRef = useRef(null);
    const autoScrollTimeoutRef = useRef(null);

    const [iconMap, setIconMap] = useState(() => 
        ICONS ? ICONS.reduce((acc, icon) => ({ ...acc, [icon.name.toUpperCase()]: icon.svg }), {}) : {}
    );

    useEffect(() => {
        const reloadIconsFromFile = async (file) => {
            console.log("Icon source file modified. Reloading icons...");
            try {
                const rawContent = await dc.app.vault.read(file);
                const iconRegex = /## ICONS\s*```javascript\s*([\s\S]*?)\s*```/;
                const match = rawContent.match(iconRegex);
                
                if (match && match[1]) {
                    const codeBlockContent = match[1];
                    const newIconsArray = new Function(`return ${codeBlockContent}`)();
                    
                    if (Array.isArray(newIconsArray)) {
                         const newIconMap = newIconsArray.reduce((acc, icon) => ({ ...acc, [icon.name.toUpperCase()]: icon.svg }), {});
                         setIconMap(newIconMap);
                         console.log("Icons reloaded successfully.", Object.keys(newIconMap));
                    }
                } else {
                    console.warn("Could not find ICONS code block in modified file.");
                }
            } catch (e) {
                console.error("Failed to dynamically reload icons:", e);
            }
        };

        const onFileModify = (file) => {
            if (file.path === ICON_FILE_PATH) {
                reloadIconsFromFile(file);
            }
        };

        dc.app.vault.on('modify', onFileModify);

        return () => {
            dc.app.vault.off('modify', onFileModify);
        };
    }, []); 


    useEffect(() => { const wrapper = wrapperRef.current; if (!wrapper) return; const handleClick = (e) => { const copyBtn = e.target.closest('.copy-code-btn'); if (copyBtn && !copyBtn.classList.contains('copied')) { const encodedCode = copyBtn.dataset.code; if (encodedCode) { const decodedCode = decodeURIComponent(escape(atob(encodedCode))); navigator.clipboard.writeText(decodedCode).then(() => { copyBtn.classList.add('copied'); setTimeout(() => { copyBtn.classList.remove('copied'); }, 2000); }); } } }; wrapper.addEventListener('click', handleClick); return () => wrapper.removeEventListener('click', handleClick); }, []);
    
    useEffect(() => {
        const init = async () => {
            try {
                if (!codeHighlighter) {
                    const { codeToHtml } = await import('https://esm.sh/shiki@1.6.0');
                    const highlighter = (c, l) => codeToHtml(c, { lang: l, theme: 'one-dark-pro' });
                    setCodeHighlighter(() => highlighter);
                }
            } catch (e) { console.error("Failed to load dependencies:", e); }
        };
        init();
    }, []);

    // --- FIX APPLIED HERE ---
    // This map connects the displayName from your DOCS file (in uppercase)
    // to the icon name from your SVG file (in uppercase).
    const ALIAS_MAP = { 
        'DATA': 'DATAQUERY', 
        'SCENE': 'VISUAL ENGINE', 
        
        // Aliases for your "General" category modules
        'MANIFESTO' : 'MANIFESTO',
        'UTILITY'   : 'UTILITY',
        'HOME.OLD'  : 'HOME.OLD' // Or whatever the icon is actually named, e.g., 'HOME'
    };
    
    const parseModuleFileContent = (rawContent) => {  const structuredDocRegex = /^#\s*.*\r?\n\r?\n([\s\S]*?)\r?\n\r?\n---/; const isStructuredDoc = structuredDocRegex.test(rawContent); if (isStructuredDoc) { const module = { title: '', moduleDescription: '', outline: [], components: [], catalogMarkdown: '' }; const titleMatch = rawContent.match(/^#\s*(.*)/); module.title = titleMatch ? titleMatch[1].trim() : ''; const descMatch = rawContent.match(structuredDocRegex); module.moduleDescription = descMatch ? descMatch[1].trim() : ''; const catalogRegex = /\n## Catalog\s*\n([\s\S]*?)(?=\n(?:---|\n## |$))/; const catalogMatch = rawContent.match(catalogRegex); let contentToParse = rawContent; if (catalogMatch) { const catalogContent = catalogMatch[1]; module.catalogMarkdown = catalogContent.trim(); contentToParse = rawContent.replace(catalogMatch[0], ''); const lines = catalogContent.split('\n').filter(line => line.trim().startsWith('*')); const outlineItems = []; let lastParent = null; lines.forEach(line => { const isSubItem = /^\s{2,}\*/.test(line); const title = line.replace(/^\s*\*\s*/, '').replace(/(\*\*|`|\[\[|\]\])/g, '').split('|')[0].trim(); const id = slugify(title); const item = { id, title, children: [] }; if (isSubItem && lastParent) { lastParent.children.push(item); } else { outlineItems.push(item); lastParent = item; } }); module.outline = outlineItems; } const sections = contentToParse.split(/\n## /g).filter(s => s.trim() !== '').slice(1); for (const section of sections) { const sectionTitleMatch = section.match(/^(.*)/); const sectionTitle = sectionTitleMatch ? sectionTitleMatch[1].trim() : 'Untitled Section'; const sectionId = slugify(sectionTitle); const sectionContent = section.substring(sectionTitleMatch ? sectionTitleMatch[0].length : 0).trim(); const subComponentBlocks = sectionContent.split(/\n### /g); const infoBlock = subComponentBlocks.shift() || ''; const infoMatch = infoBlock.match(/\*\*INFO\*\*\s*\n\n([\s\S]*?)(?=\n\*\*Use when\*\*|\n###|\n##|\n---|$)/); const useWhenMatch = infoBlock.match(/\*\*Use when\*\*\s*\n\n([\s\S]*?)(?=\n###|\n##|\n---|$)/); let sectionInfo = ''; if (infoMatch) { sectionInfo = infoMatch[1].trim(); } else if (!useWhenMatch && infoBlock.trim()) { sectionInfo = infoBlock.trim(); } const componentData = { id: sectionId, section: sectionTitle, info: sectionInfo, useWhen: useWhenMatch ? useWhenMatch[1].trim() : '', subComponents: subComponentBlocks.map(block => { const subTitleMatch = block.match(/^(.*)/); const subTitle = subTitleMatch ? subTitleMatch[1].trim() : 'Untitled'; const subId = slugify(subTitle); const parseComponentSection = (originalContent) => { let content = originalContent; const details = {}; const tableRegex = /(\|.*\|(?:\r?\n|\r)(?:\|[-| :]*\|)(?:(?:\r?\n|\r)\|.*\|)*)/g; const tableMatch = content.match(tableRegex); if (tableMatch && tableMatch[0]) { details.Table = tableMatch[0]; content = content.replace(tableRegex, '').trim(); } const blockRegex = /\*\*([A-Z][a-zA-Z\s]+)\*\*\s*([\s\S]*?)(?=\n\*\*|$(?![\r\n]))/g; let match; while ((match = blockRegex.exec(content)) !== null) { const key = (match[1] || '').trim(); if (!key) continue; let value = (match[2] || '').trim(); const codeMatch = value.match(/^```(?:\w+)?\n([\s\S]+)\n```$/); details[key] = codeMatch ? codeMatch[1].trim() : value; } return details; }; return { id: subId, name: subTitle, details: parseComponentSection(block.substring(subTitleMatch ? subTitleMatch[0].length : 0).trim()) }; }) }; module.components.push(componentData); } return module; } else { const module = { title: '', moduleDescription: rawContent, outline: [], components: [], catalogMarkdown: '' }; const titleMatch = rawContent.match(/^#\s*(.*)/); if (titleMatch) { module.title = titleMatch[1].trim(); } return module; } };
    useEffect(() => { const loadContent = async () => { if (!selectedModuleMeta) { setDetailContent(null); return; } setIsDetailLoading(true); setDetailContent(null); setDetailError(null); try { const file = dc.app.vault.getAbstractFileByPath(selectedModuleMeta.filePath); if (!file) throw new Error(`File not found: ${selectedModuleMeta.filePath}`); const rawContent = await dc.app.vault.read(file); setDetailContent(parseModuleFileContent(rawContent)); } catch (e) { setDetailError(e.message); } finally { setIsDetailLoading(false); } }; loadContent(); }, [selectedModuleMeta]);
    useEffect(() => {  if (!detailContent || !contentRef.current || !detailContent.outline) return; const flattenAndGetPositions = (items, container) => { const totalHeight = container.scrollHeight; if (totalHeight === 0) return []; let flatList = []; items.forEach(item => { const el = document.getElementById(item.id); if (el) { flatList.push({ id: item.id, title: item.title, percentPosition: (el.offsetTop / totalHeight) * 100 }); } if (item.children && item.children.length > 0) { flatList = flatList.concat(flattenAndGetPositions(item.children, container)); } }); return flatList; }; const calculatePositions = () => { const container = contentRef.current; if (!container) return; const hierarchicalOutline = detailContent.outline; const flatOutlineForIndicator = flattenAndGetPositions(hierarchicalOutline, container); setOutlineWithPositions({ nav: hierarchicalOutline, indicator: flatOutlineForIndicator }); }; const timeoutId = setTimeout(calculatePositions, 200); return () => clearTimeout(timeoutId); }, [detailContent]);
    useEffect(() => {  const contentEl = contentRef.current; if (!detailContent || !contentEl) return; const handleScroll = () => { const { offsetTop, offsetHeight } = contentEl; const scrollableDist = offsetHeight - window.innerHeight; if (scrollableDist <= 0) { setScrollProgress(window.scrollY > offsetTop ? 100 : 0); return; } const scrolledWithin = window.scrollY - offsetTop; const progress = (scrolledWithin / scrollableDist) * 100; setScrollProgress(Math.max(0, Math.min(100, progress))); }; const observer = new IntersectionObserver((entries) => { const intersectingEntries = entries.filter(e => e.isIntersecting); if (intersectingEntries.length > 0) { intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top); setActiveSectionId(intersectingEntries[0].target.id); } }, { rootMargin: "-20% 0px -75% 0px", threshold: 0 }); window.addEventListener('scroll', handleScroll, { passive: true }); const headings = contentEl.querySelectorAll('[data-outline-target]'); headings.forEach(heading => observer.observe(heading)); return () => { window.removeEventListener('scroll', handleScroll); headings.forEach(heading => observer.unobserve(heading)); }; }, [detailContent]);
    useEffect(() => {  clearTimeout(autoScrollTimeoutRef.current); autoScrollTimeoutRef.current = setTimeout(() => { if (isHoveringOutline || !isOutlineOpen || !outlineNavRef.current || !activeSectionId) { return; } const navElement = outlineNavRef.current; const activeLink = navElement.querySelector(`a[data-id="${activeSectionId}"]`); if (activeLink) { const navRect = navElement.getBoundingClientRect(); const linkRect = activeLink.getBoundingClientRect(); const isAbove = linkRect.top < navRect.top; const isBelow = linkRect.bottom > navRect.bottom; if (isAbove || isBelow) { activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } } }, 100); return () => clearTimeout(autoScrollTimeoutRef.current); }, [activeSectionId, isOutlineOpen, isHoveringOutline]);
    const handleNavClick = (e, targetId) => {  e.preventDefault(); const targetElement = document.getElementById(targetId); if (targetElement) { const y = targetElement.getBoundingClientRect().top + window.pageYOffset - 80; window.scrollTo({ top: y, behavior: 'smooth' }); } };
    
    // Set initial category on load
    useEffect(() => {  if (groupedModules) { const cats = Object.keys(groupedModules); if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0]); } }, [groupedModules, activeCategory]);
    
    // Sync active category when a module is selected
    useEffect(() => { if (selectedModuleMeta) { setActiveCategory(selectedModuleMeta.majorCategory); } }, [selectedModuleMeta]);

    const handleViewSource = () => dc.app.workspace.openLinkText("_RESOURCES/DOCS/DOCS.bet8.md", '', true);

    const fullStyles = {  
        wrapper: { width: "100%", maxWidth: "1280px", margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch', fontFamily: 'var(--font-sans)' }, 
        mainLayout: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }, 
        mainContentArea: { flex: 1, minWidth: 0, maxWidth: '820px', margin: '0 auto' }, 
        stickyHeader: { position: 'sticky', top: '0', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backdropFilter: 'blur(12px)', background: 'oklch(from var(--bg-primary) l c h / 75%)', borderBottom: '1px solid var(--glow-faint)', marginBottom: '24px' },
        sourceButton: { background: 'transparent', border: '1px solid var(--glow-faint)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }, 
        tabBar: { display: 'flex', gap: '16px', flexWrap: 'wrap' }, 
        tab: { fontSize: '14px', padding: '4px 8px', cursor: 'pointer', userSelect: 'none', background: 'transparent', border: 'none', color: 'var(--text-muted)', transition: 'color 0.2s ease-in-out', fontVariant: 'small-caps' }, 
        activeTab: { color: 'var(--glow)' }, 
        content: { padding: '0 16px', minHeight: '400px' }, 
        gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }, 
        tile: { position: 'relative', width: '100%', aspectRatio: '1 / 1', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', background: 'var(--surface-primary)', border: '1px solid var(--glow-faint)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 8px 30px rgba(0,0,0,.25)' }, 
        tileName: { position: 'relative', margin: 0, color: 'var(--text-muted)', fontSize: 'clamp(12px, 4vw, 14px)', textAlign: 'center', fontWeight: 600, transition: 'color 0.2s ease' }, 
        backButton: { background: 'transparent', border: '1px solid var(--glow-faint)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s ease' }, 
        detailControlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px' }, 
        iconNavigationArea: { position: 'relative', margin: '16px 0', borderBottom: '1px solid var(--glow-faint)' }, 
        horizontalScroller: { display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px 4px 24px 4px', scrollbarWidth: 'none', '::-webkit-scrollbar': { display: 'none' } }, 
        outlineContainer: { position: 'fixed', top: '80px', right: 'max(24px, calc(50% - 680px))', height: 'auto', maxHeight: 'calc(100vh - 100px)', zIndex: 1000, transition: 'width 0.3s ease-in-out', width: '40px', flexShrink: 0, pointerEvents: 'none', background: 'oklch(from var(--surface-primary) l c h / 75%)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid var(--glow-faint)', boxShadow: '0 8px 30px rgba(0,0,0,.25)', }, 
        outlineContent: { pointerEvents: 'auto', padding: '8px', boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column' }, 
        outlineContainerOpen: { width: '240px' }, 
        outlineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 0 0 8px', overflow: 'hidden' }, 
        outlineTitle: { fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.05em', whiteSpace: 'nowrap', transition: 'opacity 0.2s ease' }, 
        outlineToggleBtn: { background: 'none', border: '1px solid transparent', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }, 
        outlineNav: { overflowY: 'auto', maxHeight: '100%', flex: 1, paddingRight: '8px', borderLeft: '1px solid var(--glow-faint)', marginLeft: '8px' }, 
        outlineList: { listStyle: 'none', padding: 0, margin: 0 }, 
        outlineListItem: { marginBottom: '8px' }, 
        outlineLink: { textDecoration: 'none', color: 'var(--text-muted)', fontSize: '13px', display: 'block', transition: 'all 0.2s ease', borderLeft: '2px solid transparent', padding: '4px 0 4px 12px', marginLeft: '-1px', whiteSpace: 'nowrap' }, 
        outlineLinkActive: { color: 'var(--text-bright)', fontWeight: 600, borderLeft: '2px solid var(--glow)' }, 
        indicatorTrack: { position: 'relative', width: '2px', height: 'calc(100% - 30px)', background: 'var(--glow-faint)', margin: '16px auto 0 auto' }, 
        indicatorProgress: { position: 'absolute', top: 0, left: 0, width: '100%', background: 'var(--glow)', transition: 'height 0.1s linear' }, 
        indicatorDot: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', transition: 'all 0.2s ease', cursor: 'pointer' }, 
        indicatorDotHover: { background: 'var(--text-bright)', transform: 'translateX(-50%) scale(1.2)'}, 
        indicatorDotActive: { background: 'var(--glow)', transform: 'translateX(-50%) scale(1.5)' }, 
    };
    
    if (isScanning) return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Scanning documentation index...</div>;
    if (scanError) return <div style={{ padding: '24px', color: 'var(--text-error)' }}><h3>Datacore Script Error</h3><pre>{scanError}</pre></div>;

    return (
      <div style={fullStyles.wrapper} ref={wrapperRef}>
          <style>{`
              :root { --font-sans: 'Inter', sans-serif; --glow: oklch(0.8 0.2 300); --glow-faint: oklch(from var(--glow) l c h / 18%); --glow-med: oklch(from var(--glow) l c h / 12%); --color-orange: #ff9800; --bg-primary: #050208; --surface-primary: #100a18; --text-normal: #c5c1ce; --text-bright: #ffffff; --text-muted: #7a7385; --text-error: #ff6b6b; }
              html { scroll-behavior: smooth; }
              body { background-color: var(--bg-primary); }
              .anim-fade-in-now { animation: fadeIn .5s ease-out; }
              @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
              .source-button:hover, .outline-toggle-btn:hover { background: var(--glow-med); color: var(--text-bright); border-color: var(--glow-faint); }
              .collapsible-wrapper { transition: all 0.3s ease; }
              .collapsible-header { display: flex; align-items: center; gap: 8px; cursor: pointer; border-bottom: 1px solid transparent; padding: 8px; margin: 0 -8px 16px -8px; border-radius: 6px; }
              .collapsible-header:hover { background-color: var(--glow-med); border-bottom-color: transparent; }
              .collapsible-title { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-normal); }
              .collapsible-icon { transition: transform 0.3s ease; font-size: 10px; }
              .collapsible-wrapper.is-collapsed .collapsible-icon { transform: rotate(-90deg); }
              .collapsible-wrapper.is-collapsed .collapsible-content { display: none; }
              .sub-component-header { border-bottom: 1px solid var(--glow-faint); margin-bottom: 1em; padding-bottom: 1em; }
              .sub-component-header .collapsible-title { font-size: 18px; color: var(--text-bright); }
              .conceptual-outline-header { margin-top: 2em; margin-bottom: 2em; padding-bottom: 1em; border-bottom: 1px solid var(--glow-faint); }
              .conceptual-outline-header .collapsible-title { font-size: 18px; color: var(--text-bright); font-variant: small-caps; letter-spacing: 0.05em; }
              .conceptual-outline-header + div > section:first-of-type { margin-top: 2em; }
              :root { --glow-hue: 300; --callout-note: 175, 157, 194; --callout-info: 163, 163, 237; --callout-tip: 241, 162, 222; --callout-warning: 255, 152, 220; --callout-danger: 255, 127, 200; }
              .callout { margin: 1.5em 0; border-radius: 8px; border-left: 4px solid; overflow: hidden; background-color: rgba(128, 128, 128, 0.1); }
              .callout-title { display: flex; align-items: center; gap: 10px; padding: 12px 16px; font-weight: 600; cursor: pointer; user-select: none; background-color: rgba(128, 128, 128, 0.1); }
              .callout-title::-webkit-details-marker { display: none; }
              .callout-title::before { content: '▼'; font-size: 0.7em; transition: transform 0.2s ease-in-out; }
              .callout[open] > .callout-title::before { transform: rotate(0deg); }
              .callout:not([open]) > .callout-title::before { transform: rotate(-90deg); }
              .callout-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
              .callout-icon svg { width: 100%; height: 100%; }
              .callout-content { padding: 4px 16px 16px 16px; }
              .callout-content > *:first-child { margin-top: 0; } .callout-content > *:last-child { margin-bottom: 0; }
              .callout-note { border-color: rgb(var(--callout-note)); } .callout-note > .callout-title { color: rgb(var(--callout-note)); background-color: rgba(var(--callout-note), 0.1); } .callout-note .callout-icon { color: rgb(var(--callout-note)); }
              .callout-info { border-color: rgb(var(--callout-info)); } .callout-info > .callout-title { color: rgb(var(--callout-info)); background-color: rgba(var(--callout-info), 0.1); } .callout-info .callout-icon { color: rgb(var(--callout-info)); }
              .callout-tip, .callout-success { border-color: rgb(var(--callout-tip)); } .callout-tip > .callout-title, .callout-success > .callout-title { color: rgb(var(--callout-tip)); background-color: rgba(var(--callout-tip), 0.1); } .callout-tip .callout-icon, .callout-success .callout-icon { color: rgb(var(--callout-tip)); }
              .callout-warning { border-color: rgb(var(--callout-warning)); } .callout-warning > .callout-title { color: rgb(var(--callout-warning)); background-color: rgba(var(--callout-warning), 0.1); } .callout-warning .callout-icon { color: rgb(var(--callout-warning)); }
              .callout-danger, .callout-error { border-color: rgb(var(--callout-danger)); } .callout-danger > .callout-title, .callout-error > .callout-title { color: rgb(var(--callout-danger)); background-color: rgba(var(--callout-danger), 0.1); } .callout-danger .callout-icon, .callout-error .callout-icon { color: rgb(var(--callout-danger)); }
              .code-block-wrapper { background-color: var(--surface-primary); border: 1px solid var(--glow-faint); border-radius: 8px; margin: 1.5em 0; overflow: hidden; transition: all 0.2s ease; }
              .code-block-wrapper:hover { border-color: var(--glow-med); }
              .code-block-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 8px 8px 12px; background-color: oklch(from var(--surface-primary) l-0.03 c h); border-bottom: 1px solid var(--glow-faint); cursor: pointer; user-select: none; }
              .code-block-header::-webkit-details-marker { display: none; }
              .code-block-header::before { content: '▼'; font-size: 0.7em; color: var(--text-muted); transition: transform 0.2s ease-in-out; }
              .code-block-wrapper[open] > .code-block-header::before { transform: rotate(0deg); }
              .code-block-wrapper:not([open]) > .code-block-header::before { transform: rotate(-90deg); }
              .code-block-wrapper:not([open]) > .code-block-header { border-bottom-color: transparent; }
              .language-label { font-family: var(--font-sans); font-size: 11px; color: var(--text-muted); font-weight: bold; text-transform: uppercase; margin-left: 8px; }
              .code-block-content { padding: 0; font-size: 14px; line-height: 1.6; }
              .code-block-content pre { margin: 0; padding: 16px !important; border-radius: 0; background: transparent !important; overflow-x: auto; }
              .copy-code-btn { position: relative; background: transparent; border: none; color: var(--text-muted); padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
              .copy-code-btn:hover { background-color: var(--glow-med); color: var(--text-bright); }
              .copy-code-btn .check-icon { display: none; color: var(--color-orange); }
              .copy-code-btn.copied .copy-icon { display: none; }
              .copy-code-btn.copied .check-icon { display: block; }
              .datacore-jsx-wrapper { margin: 1.5em 0; border: 1px solid var(--glow-faint); border-radius: 8px; padding: 16px; background-color: var(--surface-primary); }
              .code-block-content pre::-webkit-scrollbar, .outline-nav::-webkit-scrollbar { width: 6px; height: 6px; }
              .code-block-content pre::-webkit-scrollbar-track, .outline-nav::-webkit-scrollbar-track { background: transparent; }
              .code-block-content pre::-webkit-scrollbar-thumb, .outline-nav::-webkit-scrollbar-thumb { background: var(--glow-faint); border-radius: 6px; }
              .code-block-content pre::-webkit-scrollbar-thumb:hover, .outline-nav::-webkit-scrollbar-thumb:hover { background: var(--glow-med); }
              .markdown-rendered-content { font-variant-caps: all-small-caps; letter-spacing: 0.025em; }
              .markdown-rendered-content code, .markdown-rendered-content pre, .markdown-rendered-content .code-block-wrapper, .markdown-rendered-content .language-label { font-variant-caps: normal; letter-spacing: normal; }
          `}</style>
          
          <div style={fullStyles.stickyHeader}>
              <div style={fullStyles.tabBar}>
                  {groupedModules && Object.keys(groupedModules).map(category => (
                      <div 
                          key={category} 
                          style={{ ...fullStyles.tab, ...(activeCategory === category && fullStyles.activeTab) }} 
                          onClick={() => { 
                              setSelectedModuleMeta(null); 
                              setDetailContent(null);
                              setActiveCategory(category); 
                          }}>
                          [ {category} ]
                      </div>
                  ))}
              </div>
              <button style={fullStyles.sourceButton} onClick={handleViewSource} title="View the raw markdown for this component">View Source</button>
          </div>
          
          <div style={fullStyles.mainLayout}>
              <div style={fullStyles.mainContentArea}>
              {selectedModuleMeta ? (
                  <ModuleDetailView moduleMetadata={selectedModuleMeta} content={detailContent} isLoading={isDetailLoading} error={detailError} modulesInCategory={groupedModules?.[selectedModuleMeta.majorCategory] || []} onModuleSelect={setSelectedModuleMeta} onBack={() => {setSelectedModuleMeta(null); setDetailContent(null)}} codeHighlighter={codeHighlighter} styles={fullStyles} iconMap={iconMap} aliasMap={ALIAS_MAP} contentRef={contentRef} babel={babel}/>
              ) : (
                  activeCategory && groupedModules?.[activeCategory] && (
                       <ModuleGridView modules={groupedModules[activeCategory]} onSelect={setSelectedModuleMeta} styles={fullStyles} iconMap={iconMap} aliasMap={ALIAS_MAP} />
                  )
              )}
              </div>
          </div>

          {selectedModuleMeta && !isDetailLoading && detailContent && outlineWithPositions?.nav?.length > 0 && (
              <div style={{...fullStyles.outlineContainer, ...(isOutlineOpen ? fullStyles.outlineContainerOpen : {})}} onMouseEnter={() => setIsHoveringOutline(true)} onMouseLeave={() => setIsHoveringOutline(false)}>
                  <div style={fullStyles.outlineContent}>
                      <div style={fullStyles.outlineHeader}>{isOutlineOpen && <h4 style={fullStyles.outlineTitle}>On this page</h4>}<button onClick={() => setIsOutlineOpen(!isOutlineOpen)} style={fullStyles.outlineToggleBtn} title={isOutlineOpen ? "Collapse Outline" : "Expand Outline"}>{isOutlineOpen ? '✕' : '☰'}</button></div>
                      {isOutlineOpen ? (<OutlineNav navRef={outlineNavRef} items={outlineWithPositions.nav} activeId={activeSectionId} styles={fullStyles} handleNavClick={handleNavClick} />) : (<ScrollIndicator items={outlineWithPositions.indicator} activeId={activeSectionId} progress={scrollProgress} styles={fullStyles} handleNavClick={handleNavClick} hoveredId={hoveredId} setHoveredId={setHoveredId} />)}
                  </div>
              </div>
          )}
      </div>
    );
}

return { IntegratedDevelopmentSuite };
```