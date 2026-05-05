const { useEffect, useRef, useState, useCallback, useMemo } = dc;

// --- ICON MAPPING ---
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

const ObsidianIcon = ({ name, size = 36, isHovering }) => {
    const iconRef = useRef(null);
    const svgRef = useRef(null);

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
                const paths = iconSvg.querySelectorAll('path, circle, line, polyline, polygon, ellipse, rect');
                paths.forEach((path) => {
                    const length = (typeof path.getTotalLength === 'function') ? path.getTotalLength() : 100;
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = '0';
                });
            }
        } catch (e) { console.error("Failed to load icon", name, e); }
    }, [name, size]);

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
                    delay: i * 50
                });
            } else if (path._drawingAnim) {
                path._drawingAnim.cancel();
                path._drawingAnim = null;
                path.style.strokeDashoffset = '0';
            }
        });
        return () => paths.forEach(path => path._drawingAnim?.cancel());
    }, [isHovering]);

    return <div ref={iconRef} style={{
        width: `${size}px`, height: `${size}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isHovering ? 'var(--text-bright)' : 'var(--text-muted)',
        transition: 'color 0.2s ease, transform 0.2s ease',
        transform: isHovering ? 'scale(1.1)' : 'scale(1)',
        pointerEvents: 'none'
    }} />;
};

const DocCard = ({ mod, onSelect, dc }) => {
    const [isHovering, setIsHovering] = useState(false);
    return (
        <div
            className="docs-card"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => onSelect(mod)}
        >
            <ObsidianIcon name={LUCIDE_ALIAS_MAP[mod.name.toUpperCase()] || 'file-text'} size={110} isHovering={isHovering} />
            <div className="docs-card-title">{mod.name}</div>
        </div>
    );
};


function DocsSection(props) {
    const { dc, isActive, OverlayLogo, MarkdownViewer, localTheme } = props;
    const [containerWidth, setContainerWidth] = useState(window.innerWidth);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!rootRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                const w = entry.contentRect.width;
                setContainerWidth(w);
            }
        });
        ro.observe(rootRef.current);
        return () => ro.disconnect();
    }, []);

    const [groupedModules, setGroupedModules] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedModuleMeta, setSelectedModuleMeta] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [detailContent, setDetailContent] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const modalContentRef = useRef(null);
    const [babel, setBabel] = useState(null);
    const [highlighter, setHighlighter] = useState(null);

    const modalWrapRef = useRef(null);
    const [modalWidth, setModalWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape' && selectedModuleMeta) setSelectedModuleMeta(null); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedModuleMeta]);

    useEffect(() => {
        if (!selectedModuleMeta || !modalWrapRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                const w = entry.contentRect.width;
                console.log(`[DocsModal] Container Width: ${w}px`);
                setModalWidth(w);
            }
        });
        ro.observe(modalWrapRef.current);
        return () => ro.disconnect();
    }, [selectedModuleMeta]);

    useEffect(() => {
        if (!isActive) return;
        const init = async () => {
            if (!window.Babel) {
                const s = document.createElement("script");
                s.src = "https://unpkg.com/@babel/standalone/babel.min.js";
                s.onload = () => setBabel(window.Babel);
                document.body.appendChild(s);
            } else setBabel(window.Babel);

            try {
                const { codeToHtml } = await import('https://esm.sh/shiki@1.6.0');
                const theme = localTheme === 'theme-light' ? 'github-light' : 'one-dark-pro';
                setHighlighter(() => (c, l) => codeToHtml(c, { lang: l, theme }));
            } catch (e) { console.error("Shiki Error", e); }
        };
        init();
    }, [isActive, localTheme]);

    useEffect(() => {
        if (!isActive) return;
        const scan = async () => {
            setIsScanning(true);
            try {
                const skillsPath = "_RESOURCES/DATACORE/53.1 Dashboard888/_resources/content/SKILLS.bet8.md";
                const file = dc.app.vault.getAbstractFileByPath(skillsPath);
                if (!file) return;
                const content = await dc.app.vault.read(file);
                const modules = {};
                let currentCat = null;
                content.split('\n').forEach(line => {
                    const t = line.trim();
                    if (t.startsWith('# ') && !t.startsWith('##')) {
                        currentCat = t.substring(2).trim();
                        modules[currentCat] = [];
                    } else if (currentCat && t.startsWith('######')) {
                        const m = t.match(/###### \[([^\]]+)\]\(([^)]+)\)/);
                        if (m) modules[currentCat].push({ name: m[1].trim(), path: dc.resolvePath(m[2].trim(), skillsPath.substring(0, skillsPath.lastIndexOf('/'))), category: currentCat });
                    }
                });
                setGroupedModules(modules);
                if (Object.keys(modules).length > 0 && !activeCategory) setActiveCategory(Object.keys(modules)[0]);
            } finally { setIsScanning(false); }
        };
        scan();
    }, [isActive, dc]);

    useEffect(() => {
        if (!selectedModuleMeta) return;
        const load = async () => {
            setIsDetailLoading(true);
            try {
                const f = dc.app.vault.getAbstractFileByPath(selectedModuleMeta.path);
                if (f) setDetailContent(await dc.app.vault.read(f));
            } finally { setIsDetailLoading(false); }
        };
        load();
    }, [selectedModuleMeta]);

    useEffect(() => {
        if (!selectedModuleMeta) {
            setShowScrollTop(false);
        }
    }, [selectedModuleMeta]);

    const handleScroll = (e) => {
        setShowScrollTop(e.target.scrollTop > 300);
    };

    const scrollToTop = () => {
        if (modalContentRef.current) {
            modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGlobalClick = (e) => {
        const btn = e.target.closest('.copy-code-btn');
        if (btn) {
            const encoded = btn.getAttribute('data-code');
            if (encoded) {
                try {
                    const code = decodeURIComponent(escape(atob(encoded)));
                    navigator.clipboard.writeText(code);
                    btn.classList.add('copied');
                    setTimeout(() => btn.classList.remove('copied'), 2000);
                } catch (e) {
                    console.error("[DocsSection] Copy failed", e);
                }
            }
        }
        const link = e.target.closest('.internal-link');
        if (link) {
            e.preventDefault();
            const rawTarget = link.dataset.internalLink;
            const sourcePath = link.dataset.sourcePath || '';

            const resolve = (path) => dc.app.metadataCache.getFirstLinkpathDest(path, sourcePath);

            // Try sequence: literal -> name-based folder -> batch-based folder -> deep search
            let file = resolve(rawTarget);
            const cleanTarget = rawTarget.replace(/^[\d.]+\s*/, "");
            const searchName = cleanTarget.toLowerCase();

            if (!file) {
                const dcFolder = dc.app.vault.getAbstractFileByPath("_RESOURCES/DATACORE");
                if (dcFolder && dcFolder.children) {
                    const folder = dcFolder.children.find(f => f.name.toLowerCase().includes(searchName));
                    if (folder) {
                        const folderFiles = dc.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folder.path));
                        const utilityPatterns = ['.extract', '.viewer', '.generated', 'd.q.'];
                        const isUtility = (f) => utilityPatterns.some(p => f.basename.toLowerCase().includes(p));
                        const mainDocs = folderFiles.filter(f => !isUtility(f));

                        file = mainDocs.find(f => f.basename.toLowerCase() === searchName) ||
                            mainDocs.find(f => f.basename.toLowerCase().includes(searchName)) ||
                            mainDocs[0] ||
                            folderFiles[0];
                    }
                }
            }

            if (!file) {
                const numMatch = rawTarget.match(/^(\d+)(?:\.\d+)?/);
                if (numMatch) {
                    const batchNum = numMatch[1];
                    const dcFolder = dc.app.vault.getAbstractFileByPath("_RESOURCES/DATACORE");
                    if (dcFolder && dcFolder.children) {
                        const folder = dcFolder.children.find(f => f.name.startsWith(batchNum) && (f.name === batchNum || f.name[batchNum.length] === ' ' || f.name[batchNum.length] === '.'));
                        if (folder) {
                            const folderFiles = dc.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folder.path));
                            file = folderFiles[0];
                        }
                    }
                }
            }

            if (!file) {
                file = dc.app.vault.getMarkdownFiles().find(f => f.basename.toLowerCase() === searchName);
            }

            if (file) {
                dc.app.workspace.getLeaf('tab').openFile(file);
            } else {
                dc.app.workspace.openLinkText(rawTarget, sourcePath, true);
            }
        }
    };

    const CSS = `
        .docs-root { 
            width: 100%; display: flex; flex-direction: column; gap: 32px; 
            --glow: oklch(0.82 0.21 300); /* Matched to BETO Design System */
            --glow-faint: oklch(from var(--glow) l c h / 12%);
            --glow-med: oklch(from var(--glow) l c h / 40%);
            --text-on-accent: #0b0713;
            filter: none !important;
        }
        .theme-light .docs-root {
            --glow: oklch(0.6 0.21 300);
            --glow-faint: oklch(from var(--glow) l c h / 10%);
            --glow-med: oklch(from var(--glow) l c h / 8%);
            --text-on-accent: #ffffff;
            filter: none !important;
        }
        .docs-header { display: flex; gap: 12px; border-bottom: 1px solid var(--glow-faint); padding-bottom: 16px; overflow-x: auto; scrollbar-width: none; }
        .docs-cat-btn { padding: 8px 22px; background: rgba(var(--text-muted-rgb), 0.1); border: 1px solid var(--glow-faint); color: var(--text-muted); border-radius: 12px; cursor: pointer; font-size: 11px; font-weight: 800; font-variant: small-caps; letter-spacing: 2px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; backdrop-filter: blur(8px); filter: none !important; }
        .docs-cat-btn:hover { background: rgba(var(--text-muted-rgb), 0.2); color: var(--text-normal); border-color: var(--glow-med); }
        .docs-cat-btn.active { background: var(--glow) !important; color: var(--text-on-accent) !important; border-color: var(--glow) !important; box-shadow: 0 8px 20px oklch(from var(--glow) l c h / 30%); transform: translateY(-2px); filter: none !important; }
        
        .theme-light .docs-cat-btn { background: rgba(0, 0, 0, 0.05); border-color: rgba(0, 0, 0, 0.1); color: #1d1d1f; }
        .theme-light .docs-cat-btn:hover { background: rgba(0, 0, 0, 0.1); color: #000000; }
        .theme-light .docs-cat-btn.active { background: var(--glow) !important; color: #ffffff !important; }

        .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
        .docs-card { padding: 48px 24px; background: rgba(var(--background-primary-rgb), 0.2); backdrop-filter: blur(10px); border: 1px solid var(--glow-faint); border-radius: 20px; cursor: pointer; transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); display: flex; flex-direction: column; align-items: center; gap: 24px; position: relative; }
        .docs-card:hover { transform: translateY(-12px); border-color: var(--glow); background: rgba(var(--background-primary-rgb), 0.4); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6); }
        
        .theme-light .docs-card { background: rgba(255, 255, 255, 0.5); border-color: rgba(0, 0, 0, 0.08); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .theme-light .docs-card:hover { background: rgba(255, 255, 255, 0.8); box-shadow: 0 15px 30px rgba(0,0,0,0.08); }

        .docs-card-title { font-size: 12px; font-weight: 800; color: var(--text-muted); text-align: center; font-variant: small-caps; letter-spacing: 2px; }
        .docs-modal-overlay { position: absolute; inset: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); backdrop-filter: blur(15px); z-index: 2000; display: flex; align-items: center; justifyContent: center; padding: 40px; transition: padding 0.3s ease; }
        .docs-modal-container { background: var(--background-primary-alt); border: 1px solid var(--glow-faint); border-radius: 24px; width: 100%; max-width: 1100px; height: 100%; display: flex; flex-direction: column; position: relative; transition: all 0.3s ease; }
        .docs-modal-overlay.is-small { padding: 12px; }
        .docs-modal-overlay.is-small .docs-modal-container { border-radius: 20px; }
        .docs-modal-overlay.is-mobile { padding: 0; }
        .docs-modal-overlay.is-mobile .docs-modal-container { border-radius: 0; border: none; }
        .docs-modal-close { 
            position: absolute; 
            top: 24px; 
            right: 24px; 
            width: 44px; 
            height: 44px; 
            border-radius: 50% !important; 
            border: 2px solid rgba(255,255,255,0.2) !important; 
            background: #000000 !important; 
            color: #ffffff !important; 
            cursor: pointer; 
            display: grid; 
            place-items: center; 
            z-index: 1000; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
        }
        .docs-modal-close:hover {
            background: #222222 !important;
            transform: rotate(90deg) scale(1.1);
            border-color: #ffffff !important;
            box-shadow: 0 0 20px rgba(255,255,255,0.2), 0 12px 30px rgba(0,0,0,0.6) !important;
        }
        .theme-light .docs-modal-close {
            background: #000000 !important;
            border-color: rgba(255,255,255,0.2) !important;
            color: #ffffff !important;
        }
        .docs-modal-overlay.is-mobile .docs-modal-close { top: 12px; right: 12px; width: 36px; height: 36px; }
        .docs-modal-overlay.is-mobile .docs-modal-top { top: 12px; right: 60px; width: 36px; height: 36px; }
        .docs-modal-top { 
            position: absolute; 
            top: 24px; 
            right: 80px; 
            width: 44px; 
            height: 44px; 
            border-radius: 50% !important; 
            border: 2px solid rgba(255,255,255,0.1) !important; 
            background: rgba(0,0,0,0.6) !important; 
            color: #ffffff !important; 
            cursor: pointer; 
            display: grid; 
            place-items: center; 
            z-index: 1000; 
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            opacity: 0;
            transform: translateY(10px);
            pointer-events: none;
        }
        .docs-modal-top.visible { 
            opacity: 1; 
            transform: translateY(0); 
            pointer-events: auto;
            border-color: rgba(255,255,255,0.2) !important;
            background: #000000 !important;
        }
        .docs-modal-top:hover {
            background: #222222 !important;
            transform: scale(1.1);
            border-color: #ffffff !important;
            box-shadow: 0 0 20px rgba(255,255,255,0.2);
        }
        .docs-modal-content { flex: 1; overflow-y: auto; padding: 60px; scroll-behavior: smooth; transition: padding 0.3s ease; }
        .docs-modal-overlay.is-small .docs-modal-content { padding: 40px; }
        .docs-modal-overlay.is-mobile .docs-modal-content { padding: 32px 20px; }
        
        /* Premium Markdown Styles */
        .markdown-rendered-content { line-height: 1.6; color: var(--text-normal); font-size: 15px; }
        .markdown-rendered-content h1 { font-size: 2.5em; font-weight: 900; color: var(--text-bright); margin: 1.5em 0 0.8em; font-variant: small-caps; }
        .markdown-rendered-content h2 { font-size: 1.8em; color: var(--text-bright); border-bottom: 1px solid var(--glow-faint); padding-bottom: 8px; margin: 2em 0 1em; font-variant: small-caps; }
        .markdown-rendered-content h3 { font-size: 1.4em; color: var(--glow); margin: 1.5em 0 0.8em; font-variant: small-caps; }
        .markdown-rendered-content p { margin-bottom: 1.2em; }
        .markdown-rendered-content blockquote { padding: 1em 1.5em; background: rgba(var(--background-primary-rgb), 0.5); border-left: 4px solid var(--glow); border-radius: 4px; font-style: italic; margin: 1.5em 0; }
        .markdown-rendered-content code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: var(--text-bright); border: 1px solid var(--glow-faint); }
        .internal-link { color: var(--glow); text-decoration: none; font-weight: 700; cursor: pointer; }
        .internal-link:hover { text-decoration: underline; }
        
        .code-block-wrapper { border: 2px solid var(--glow-faint); border-radius: 16px; margin: 2.5em 0; background: #0b0b0f; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.4); transition: border-color 0.3s ease; }
        .code-block-wrapper:hover { border-color: var(--glow-med); }
        .theme-light .code-block-wrapper { background: #ffffff !important; border: 2px solid rgba(0,0,0,0.1) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important; }
        .code-block-header { display: flex; justify-content: space-between; padding: 12px 20px; background: rgba(255,255,255,0.03); border-bottom: 2px solid var(--glow-faint); }
        .theme-light .code-block-header { background: #f8f8f9 !important; border-bottom: 2px solid rgba(0,0,0,0.06) !important; }
        .copy-code-btn { background: rgba(255,255,255,0.05); border: 1.5px solid var(--glow-faint); color: var(--text-muted); border-radius: 10px; cursor: pointer; width: 34px; height: 34px; display: grid; place-items: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
        .theme-light .copy-code-btn { background: #fff !important; border-color: rgba(0,0,0,0.12) !important; color: #6e6e73 !important; }
        .copy-code-btn:hover { background: var(--glow-faint); color: var(--glow); border-color: var(--glow); transform: translateY(-2px); }
        .theme-light .copy-code-btn:hover { background: #f2f2f3 !important; transform: scale(1.05); }
        .copy-code-btn .check-icon { display: none; color: currentColor; stroke-width: 3; }
        .copy-code-btn.copied .copy-icon { display: none !important; }
        .copy-code-btn.copied .check-icon { display: block !important; color: #22c55e !important; animation: nf-scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .theme-light .copy-code-btn.copied .check-icon { color: #16a34a !important; }
        .copy-code-btn.copied { border-color: #22c55e !important; background: rgba(34, 197, 94, 0.15) !important; color: #4ade80 !important; }
        .theme-light .copy-code-btn.copied { background: #f0fdf4 !important; border-color: #22c55e !important; color: #16a34a !important; }

        .copy-code-btn::after { content: 'COPIED'; position: absolute; right: 40px; background: #22c55e; color: white; font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 6px; opacity: 0; pointer-events: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateX(10px); letter-spacing: 1px; }
        .copy-code-btn.copied::after { opacity: 1; transform: translateX(0); }

        .language-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
        .theme-light .language-label { color: #444 !important; font-weight: 700 !important; }
        
        @keyframes nf-scaleIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        
        /* --- ULTRA-RESILIENT CALLOUT SYSTEM --- */
        .callout {
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
        .callout-header,
        .callout-title {
            display: flex !important;
            align-items: center !important;
            gap: 18px !important;
            padding: 20px 28px !important;
            background: rgba(var(--callout-accent), 0.12) !important;
            border-bottom: 1.5px solid rgba(var(--callout-accent), 0.25) !important;
            margin: 0 !important;
        }
        .callout-icon-container,
        .callout-title .callout-icon {
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
        .callout-icon-container .callout-icon { 
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important; 
            width: 22px !important; 
            height: 22px !important;
        }
        .callout-icon svg,
        .callout-title .callout-icon svg { 
            width: 22px !important; 
            height: 22px !important; 
            stroke-width: 3px !important; 
            display: block !important;
        }
        .callout-title-text,
        .callout-title-inner {
            font-size: 14px !important;
            font-weight: 900 !important;
            letter-spacing: 0.15em !important;
            text-transform: uppercase !important;
            color: rgb(var(--callout-accent)) !important;
            filter: brightness(1.4) saturate(1.2) !important;
            font-variant: small-caps !important;
            margin: 0 !important;
        }
        .callout-content {
            padding: 28px 32px !important;
            font-size: 15px !important;
            line-height: 1.8 !important;
            color: var(--text-normal) !important;
            background: transparent !important;
            margin: 0 !important;
        }
        .callout-content p { margin-bottom: 1.2em !important; }
        .callout-content p:last-child { margin-bottom: 0 !important; }

        /* --- LIGHT MODE HARDENING (ULTRA-SPECIFIC) --- */
        .theme-light .callout {
            background: #ffffff !important;
            background-image: linear-gradient(135deg, color-mix(in srgb, var(--callout-accent) 15%, #ffffff), color-mix(in srgb, var(--callout-accent) 5%, #ffffff)) !important;
            border: 1.5px solid color-mix(in srgb, var(--callout-accent) 40%, transparent) !important;
            box-shadow: 0 12px 40px color-mix(in srgb, var(--callout-accent) 15%, transparent) !important;
            backdrop-filter: none !important;
        }
        .theme-light .callout-header,
        .theme-light .callout-title {
            background: color-mix(in srgb, var(--callout-accent) 20%, #ffffff) !important;
            border-bottom: 1.5px solid color-mix(in srgb, var(--callout-accent) 25%, transparent) !important;
        }
        .theme-light .callout-title-text,
        .theme-light .callout-title-inner {
            color: color-mix(in srgb, var(--callout-accent) 50%, #000000) !important;
            filter: none !important;
        }
        .theme-light .callout-content {
            color: #111 !important;
        }
        .theme-light .callout-icon-container,
        .theme-light .callout-title .callout-icon {
            box-shadow: 0 4px 12px color-mix(in srgb, var(--callout-accent) 40%, transparent) !important;
        }
        
        .markdown-embed { width: 100%; border-radius: 12px; margin: 1.5em 0; border: 1px solid var(--glow-faint); }
    `;

    return (
        <div ref={rootRef} className={`docs-root ${containerWidth < 1024 ? 'is-small' : ''} ${containerWidth < 768 ? 'is-mobile' : ''}`} onClick={handleGlobalClick}>
            <style>{CSS}</style>
            <div className="docs-header">
                {groupedModules && Object.keys(groupedModules).map(cat => (
                    <button key={cat} className={`docs-cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                ))}
            </div>
            <div className="docs-grid">
                {activeCategory && groupedModules[activeCategory]?.map(mod => (
                    <DocCard key={mod.path} mod={mod} onSelect={setSelectedModuleMeta} dc={dc} />
                ))}
            </div>
            {selectedModuleMeta && (
                <div ref={modalWrapRef} className={`docs-modal-overlay ${modalWidth < 1024 ? 'is-small' : ''} ${modalWidth < 768 ? 'is-mobile' : ''}`} onClick={() => setSelectedModuleMeta(null)}>
                    <div className="docs-modal-container" onClick={e => { e.stopPropagation(); handleGlobalClick(e); }}>
                        <button className="docs-modal-close" title="Close" onClick={() => setSelectedModuleMeta(null)}><dc.Icon icon="x" /></button>
                        <button className={`docs-modal-top ${showScrollTop ? 'visible' : ''}`} title="Scroll to Top" onClick={scrollToTop}><dc.Icon icon="arrow-up" /></button>
                        <div className="docs-modal-content" ref={modalContentRef} onScroll={handleScroll}>
                            {isDetailLoading ? <div style={{ textAlign: 'center', padding: '40px' }}><OverlayLogo size={40} animated={true} /></div> : (
                                <MarkdownViewer markdown={detailContent} sourcePath={selectedModuleMeta.path} babel={babel} codeHighlighter={highlighter} dc={dc} OverlayLogo={OverlayLogo} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

return DocsSection;
