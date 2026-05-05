# MarkdownViewer

```jsx
const { useEffect, useRef, useState, useCallback, useMemo } = dc;

/**
 * Universal High-Fidelity Markdown Viewer
 * Ported from the 'Perfect' legacy version.
 * Supports: Obsidian Callouts, Wikilinks, Shiki Highlighting, DatacoreJSX, and Media Embeds.
 */
function MarkdownViewer(props) {
    const { 
        markdown, 
        sourcePath, 
        babel, 
        OverlayLogo,
        dc,
        localTheme,
        codeHighlighter: providedHighlighter
    } = props;

    const [renderedContent, setRenderedContent] = useState([]);
    const [localHighlighter, setLocalHighlighter] = useState(null);
    const containerRef = useRef(null);

    // Initialize Shiki if not provided
    useEffect(() => {
        if (providedHighlighter) return;
        const initShiki = async () => {
            try {
                const { codeToHtml } = await import('https://esm.sh/shiki@1.6.0');
                const theme = localTheme === 'theme-light' ? 'github-light' : 'one-dark-pro';
                setLocalHighlighter(() => (c, l) => codeToHtml(c, { lang: l, theme }));
            } catch (e) { console.warn("Failed to load Shiki globally", e); }
        };
        initShiki();
    }, [providedHighlighter, localTheme]);

    const highlighter = providedHighlighter || localHighlighter;

    useEffect(() => {
        let isCurrent = true;
        const render = async () => {
            if (!markdown) { setRenderedContent([]); return; }
            if (typeof markdown !== 'string') {
                setRenderedContent([<div key="err" style={{ color: 'var(--text-error)', padding: '12px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px', fontSize: '11px' }}>[ ERROR ] Markdown must be a string. Received: {typeof markdown}</div>]);
                return;
            }
            try {
                let processedMarkdown = markdown.trim();
            
            // Strip Metadata/YAML
            if (processedMarkdown.startsWith('---')) {
                const nextSeparator = processedMarkdown.indexOf('---', 3);
                if (nextSeparator !== -1) processedMarkdown = processedMarkdown.substring(nextSeparator + 3).trim();
            }

            // 1. Extract DatacoreJSX
            const componentPlaceholder = (index) => `__DATACORE_JSX_COMPONENT_${index}__`;
            const liveComponents = [];
            let processedHtml = processedMarkdown.replace(/^```datacorejsx\r?\n([\s\S]*?)\r?\n```\s*$/gm, (match, code) => {
                const componentIndex = liveComponents.length;
                liveComponents.push(<div key={`live_${componentIndex}`} style={{ margin: '24px 0' }}><DatacoreJSXRenderer code={code.trim()} babel={babel} dc={dc} OverlayLogo={OverlayLogo} /></div>);
                return componentPlaceholder(componentIndex);
            });

            // 2. Extract & Highlight Code Blocks
            const codeBlockPlaceholder = (index) => `__CODE_BLOCK_${index}__`;
            const codeBlockRegex = /^[ \t]*(`{3,})([^\n]*)\n([\s\S]*?)\n[ \t]*\1[ \t]*$/gm;
            const codeMatches = [...processedHtml.matchAll(codeBlockRegex)].filter(m => m[3].trim().length > 0);
            const codeBlockHtmlPromises = codeMatches.map(async (match) => {
                let lang = (match[2] || 'txt').trim().toLowerCase();
                const code = match[3].trim();
                const encodedCode = btoa(unescape(encodeURIComponent(code)));
                const copyButton = `<button class="copy-code-btn" data-code="${encodedCode}" title="Copy code"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="check-icon"><path d="M20 6L9 17l-5-5"></path></svg></button>`;
                let highlightedCode = '';
                try {
                    highlightedCode = highlighter ? await highlighter(code, lang.split(' ')[0]) : `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
                } catch (e) { highlightedCode = `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`; }
                return `<details class="code-block-wrapper" open><summary class="code-block-header"><div class="code-block-header-left"><div class="code-block-lang-pill"></div><span class="language-label">${lang}</span></div>${copyButton}</summary><div class="code-block-content">${highlightedCode}</div></details>`;
            });
            processedHtml = processedHtml.replace(codeBlockRegex, (match, backticks, langInfo, code, offset) => {
                const idx = codeMatches.findIndex(m => m.index === offset);
                return codeBlockPlaceholder(idx);
            });

            // 3. Recursive Markdown Processing
            const processMarkdownChunk = async (chunk) => {
                if (!chunk) return '';
                let processed = chunk.trim();
                
                // Horizontal Rule
                processed = processed.replace(/^[ \t]*([-*_])\s*(?:\1\s*){2,}[ \t]*$/gm, '<hr/>');
                
                // Media Embeds
                const mediaRegex = /!\[\[([^\]]+)\]\]/g;
                const mediaMatches = [...processed.matchAll(mediaRegex)];
                for (const m of mediaMatches) {
                    const resolved = await dc.app.vault.adapter.getResourcePath(m[1]);
                    if (resolved) {
                        const isVideo = m[1].toLowerCase().match(/\.(mp4|webm)$/);
                        processed = processed.replace(m[0], isVideo ? `<video src="${resolved}" controls autoplay loop muted playsinline class="markdown-embed"></video>` : `<img src="${resolved}" class="markdown-embed" />`);
                    }
                }

                // Wikilinks
                processed = processed.replace(/(?<!!)\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (match, target, alias) => {
                    const text = alias ? alias.trim() : target.trim();
                    return `<a href="#" class="internal-link" data-internal-link="${target.trim()}" data-source-path="${sourcePath || ''}">↳ ${text}</a>`;
                });

                // Headings
                processed = processed.replace(/^###### (.*$)/gim, '<h6>$1</h6>')
                                     .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
                                     .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
                                     .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                                     .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                                     .replace(/^# (.*$)/gim, '<h1>$1</h1>');

                // Blockquotes
                processed = processed.replace(/^\s*>\s?(.*)/gim, '<blockquote>$1</blockquote>');
                
                // Lists (Basic handling)
                processed = processed.replace(/((?:^[ \t]*[-*+]\s+.*\n?(?:(?:\n|\r\n?)*[ \t]{2,}.*\n?)*)+)/gm, (match) => {
                    const items = match.split(/^[ \t]*[-*+]\s+/m).filter(Boolean).map(item => `<li>${item.trim()}</li>`).join('');
                    return `<ul>${items}</ul>`;
                });
                
                // Emphasis & Inline Code
                processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
                                     .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                     .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                     .replace(/`([^`]+)`/g, '<code>$1</code>');
                
                // Final wrapping
                return processed.split('\n').map(line => {
                    if (line.trim() === '' || line.trim().match(/^__(DATACORE_JSX_COMPONENT|CODE_BLOCK|CALLOUT)_\d+__$/)) return line;
                    if (line.match(/<(h[1-6]|ul|ol|li|blockquote|hr|pre|table|img|div|details|video)/)) return line;
                    return `<p>${line}</p>`;
                }).join('');
            };

            // 4. Callout Extraction
            const calloutPlaceholder = (index) => `__CALLOUT_${index}__`;
            const calloutRegex = /^>\s?\[\!(\w+)\]([+-])?(.*)\r?\n((?:^>.*\r?\n?)*)/gm;
            const calloutMatches = [...processedHtml.matchAll(calloutRegex)];
            const calloutHtmlPromises = calloutMatches.map(async (match) => {
                const [_, type, collapse, title, content] = match;
                const calloutType = type.toLowerCase();
                const inner = content.replace(/^>\s?/gm, '');
                const renderedInner = await processMarkdownChunk(inner);
                const colors = { note: 'var(--glow)', tip: '#00ffd5', info: '#00a2ff', warning: '#ffcc00', danger: '#ff4444', success: '#00ffd5', bug: '#ff4444' };
                return `
                    <details class="callout callout-${calloutType}" ${collapse === '-' ? '' : 'open'} style="--callout-accent: ${colors[calloutType] || 'var(--glow)'}">
                        <summary class="callout-title">
                            <span class="callout-title-text">${title.trim() || calloutType.toUpperCase()}</span>
                        </summary>
                        <div class="callout-content">${renderedInner}</div>
                    </details>
                `;
            });

            // 5. Final Assembly
            processedHtml = processedHtml.replace(calloutRegex, (match, ...args) => calloutPlaceholder(calloutMatches.findIndex(m => m[0] === match)));
            let finalHtml = await processMarkdownChunk(processedHtml);
            
            const resolvedBlocks = await Promise.all(codeBlockHtmlPromises);
            resolvedBlocks.forEach((html, i) => finalHtml = finalHtml.replace(codeBlockPlaceholder(i), html));
            
            const resolvedCallouts = await Promise.all(calloutHtmlPromises);
            resolvedCallouts.forEach((html, i) => finalHtml = finalHtml.replace(calloutPlaceholder(i), html));

            const chunks = finalHtml.split(/__DATACORE_JSX_COMPONENT_\d+__/g);
            const finalArr = [];
            chunks.forEach((c, i) => {
                if (c && isCurrent) finalArr.push(<div key={`html_${i}`} dangerouslySetInnerHTML={{ __html: c }} />);
                if (liveComponents[i] && isCurrent) finalArr.push(liveComponents[i]);
            });
            if (isCurrent) setRenderedContent(finalArr);
            } catch (e) {
                console.error("MarkdownViewer Error", e);
                if (isCurrent) setRenderedContent([<div key="err" style={{ color: 'var(--text-error)', padding: '12px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px', fontSize: '11px' }}>[ RENDER ERROR ] {e.message}</div>]);
            }
        };
        render();
        return () => { isCurrent = false; };
    }, [markdown, highlighter, sourcePath, babel]);

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
            } catch (err) {
                console.error("[MarkdownViewer] Failed to copy code:", err);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('click', handleCopy);
            return () => container.removeEventListener('click', handleCopy);
        }
    }, [renderedContent]);

    return <div ref={containerRef} className="markdown-rendered-content">{renderedContent}</div>;
}

// --- SUB-COMPONENT: DATACORE JSX RENDERER ---
const DatacoreJSXRenderer = ({ code, babel, dc, OverlayLogo }) => {
    const [Comp, setComp] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!babel) return;
        let isCurrent = true;
        const execute = async () => {
            try {
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const transformed = babel.transform(code, { presets: ['react'] }).code;
                const executor = new AsyncFunction('dc', 'React', `const { useEffect, useState, useMemo, useRef, Fragment } = React; ${transformed}`);
                const res = await executor(dc, React);
                if (isCurrent && React.isValidElement(res)) setComp(() => res);
            } catch (e) { if (isCurrent) setError(e.message); }
        };
        execute();
        return () => { isCurrent = false; };
    }, [code, babel]);

    if (error) return <div style={{ color: 'var(--text-error)', padding: '12px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px', fontSize: '11px' }}>[ JSX ERROR ] {error}</div>;
    return Comp ? <div className="datacore-jsx-wrapper">{Comp}</div> : (OverlayLogo ? <div style={{ textAlign: 'center', padding: '20px' }}><OverlayLogo size={20} animated={true} /></div> : null);
};

return { MarkdownViewer };
```
