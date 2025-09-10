




# ViewComponent

```jsx
 const { useEffect, useRef, useState, useCallback, useMemo } = dc;


const { IntegratedDevelopmentSuite } = await dc.require(
    dc.headerLink("_RESOURCES/DATACORE/44 MarkdownParser/D.q.markdownparser.component.md", "ViewComponent")
);


const { ICONS } = await dc.require(
    dc.headerLink("_RESOURCES/DATACORE/45 SVGAnimations/D.q.svganimations.component.md", "ICONS")
);

const { AssetsLibrary } = await dc.require(
    dc.headerLink("_RESOURCES/DATACORE/52 AssetsLibrary/D.q.assetslibrary.component.md", "ViewComponent")
);
const { UpdateManager } = await dc.require(
    dc.headerLink("_RESOURCES/DATACORE/46 VaultUpdater/D.q.vaultupdater.component.md", "ViewComponent")
);


// =================================================<===================
// CORE HELPER FUNCTIONS (Unchanged)
// ====================================================================

function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className))
            return current;
        current = current.parentNode;
    }
    return null;
}
function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) return child;
    }
    return null;
}
async function loadScript(dc, src, globalCheck) {
    if (globalCheck && window[globalCheck]) {
        return Promise.resolve();
    }
    const cacheDir = ".datacore/script_cache";
    const isUrl = /^https?:\/\//.test(src);
    if (!isUrl) {
        throw new Error(
            "This loadScript implementation currently only supports caching for external URLs."
        );
    }
    const executeScriptContent = (scriptContent) => {
        try {
            const scriptElement = document.createElement("script");
            scriptElement.textContent = scriptContent;
            document.body.appendChild(scriptElement);
            document.body.removeChild(scriptElement);
        } catch (execError) {
            console.error(`Error executing script content from ${src}:`, execError);
            throw execError;
        }
    };
    return new Promise(async (resolve, reject) => {
        if (!dc || !dc.app?.vault?.adapter) {
            return reject(
                new Error(
                    "Datacore context 'dc' with vault adapter is required for loadScript."
                )
            );
        }
        const adapter = dc.app.vault.adapter;
        try {
            const safeFilename =
                src.replace(/^https?:\/\//, "").replace(/[\/\\?%*:|"<>]/g, "_") + ".js";
            const cachePath = `${cacheDir}/${safeFilename}`;
            let scriptText = null;
            if (await adapter.exists(cachePath)) {
                try {
                    scriptText = await adapter.read(cachePath);
                } catch (readError) {
                    console.warn(
                        `[Cache] Failed to read cached script, re-fetching. Error:`,
                        readError
                    );
                }
            }
            if (scriptText === null) {
                const response = await fetch(src);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${src}`);
                }
                scriptText = await response.text();
                try {
                    if (!(await adapter.exists(cacheDir))) {
                        await adapter.mkdir(cacheDir);
                    }
                    await adapter.write(cachePath, scriptText);
                } catch (writeError) {
                    console.warn(
                        `[Cache] Failed to write script to cache. Error:`,
                        writeError
                    );
                }
            }
            executeScriptContent(scriptText);
            resolve();
        } catch (error) {
            console.error(`Failed to load script ${src}:`, error);
            reject(error);
        }
    });
}
async function fuzzyFindFile(filename) {
    await loadScript(
        dc,
        "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js",
        "Fuse"
    );
    const files = app.vault.getFiles();
    const fuse = new Fuse(files, {
        keys: ["name"],
        includeScore: true,
        threshold: 0.4,
    });
    const results = fuse.search(filename);
    return results.length > 0 ? results[0].item : null;
}
const IMG_EXTS = ["webp", "png", "jpg", "jpeg", "svg", "gif"];
const VID_EXTS = ["webm", "mp4", "mov"];
function normalizeVaultPath(input) {
    if (!input) return "";
    let s = String(input).trim();
    s = s.replace(/^\[\[|\]\]$/g, "");
    s = s.replace(/\|.*$/, "");
    s = s.replace(/#.*$/, "");
    s = s
        .replace(/^\/+/, "")
        .replace(/\\/g, "/")
        .replace(/\/{2,}/g, "/");
    try {
        s = decodeURIComponent(s);
    } catch (_) { }
    return s;
}
async function getMediaResourcePath(filePathOrName, opts = {}) {
    const preferExts = opts.preferExts || [...IMG_EXTS, ...VID_EXTS];
    const preferDir = opts.preferDir
        ? normalizeVaultPath(opts.preferDir).replace(/\/$/, "")
        : "";
    const q = normalizeVaultPath(filePathOrName);
    if (!q) return null;
    const hasExt = /\.[a-z0-9]+$/i.test(q);
    const qBase = hasExt ? q.replace(/\.[^/.]+$/, "") : q;
    const qName = qBase.split("/").pop();
    let f = dc.app.vault.getAbstractFileByPath(q);
    if (f) return dc.app.vault.getResourcePath(f);
    const dirFromQ = qBase.includes("/")
        ? qBase.split("/").slice(0, -1).join("/")
        : "";
    const dirs = [
        ...new Set([preferDir, dirFromQ].filter(Boolean).map(normalizeVaultPath)),
    ];
    if (!dirs.length) dirs.push("");
    const exts = hasExt ? [q.split(".").pop()] : preferExts;
    for (const dir of dirs) {
        for (const ext of exts) {
            const p = (dir ? `${dir}/` : "") + `${qName}.${ext}`;
            f = dc.app.vault.getAbstractFileByPath(p);
            if (f) return dc.app.vault.getResourcePath(f);
        }
    }
    const files = dc.app.vault.getFiles();
    const nameCandidates = hasExt
        ? [qName]
        : exts.map((ext) => `${qName}.${ext}`);
    f = files.find((x) =>
        nameCandidates.some((n) => x.name.toLowerCase() === n.toLowerCase())
    );
    if (f) return dc.app.vault.getResourcePath(f);
    await loadScript(
        dc,
        "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js",
        "Fuse"
    );
    try {
        const fuse = new Fuse(files, {
            keys: ["path", "name"],
            threshold: 0.32,
            ignoreLocation: true,
            minMatchCharLength: 2,
        });
        const res = fuse.search(qName);
        if (res?.length) return dc.app.vault.getResourcePath(res[0].item);
    } catch (_) { }
    console.warn(
        `Media file "${filePathOrName}" not found via exact path or fuzzy search.`
    );
    return null;
}

// ====================================================================
// --- NEW: CENTRALIZED CONTENT RENDERING MANAGER ---
// ====================================================================

const ContentRenderer = {
    /**
     * Asynchronously converts a markdown string to an HTML string.
     * Handles standard markdown and resolves Obsidian-style `![[image.png]]` links.
     * @param {string} markdown - The raw markdown content.
     * @returns {Promise<string>} A promise that resolves to the rendered HTML string.
     */
    async renderMarkdown(markdown) {
        if (!markdown) return "";

        let html = markdown;

        // --- Step 1: Handle block-level elements first ---
        // Code blocks ```...```
        html = html.replace(
            /```([\s\S]*?)```/g,
            (match, code) => `<pre><code>${code.trim()}</code></pre>`
        );
        // Headers (e.g., ### Title)
        html = html.replace(/^###### (.*$)/gim, "<h6>$1</h6>");
        html = html.replace(/^##### (.*$)/gim, "<h5>$1</h5>");
        html = html.replace(/^#### (.*$)/gim, "<h4>$1</h4>");
        html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
        html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
        html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
        // Blockquotes > text
        html = html.replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>");
        // Horizontal Rule
        html = html.replace(/^-{3,}/gim, "<hr/>");
        // Lists (unordered and ordered)
        html = html.replace(/^\s*[-*] (.*)/gim, "<li>$1</li>");
        html = html.replace(/^\s*\d+\. (.*)/gim, "<li>$1</li>"); // Treat ordered same as unordered for simplicity
        html = html.replace(/<\/li>\s*<li>/g, "</li><li>"); // Compact list items
        html = html.replace(/(<li>.*<\/li>)/gis, "<ul>$1</ul>"); // Wrap in <ul>
        html = html.replace(/<\/ul>\s*<ul>/g, ""); // Fix multiple list blocks

        // --- Step 2: Handle inline elements ---
        // Bold and Italic combinations
        html = html.replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>");
        html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
        html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");
        // Links [text](url)
        html = html.replace(
            /\[([^\]]+)\]\(([^)]+)\)/gim,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        // Inline code `code`
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

        // --- Step 3: Asynchronously handle Obsidian image embeds ---
        const imageRegex = /!\[\[([^\]]+)\]\]/g;
        const matches = [...html.matchAll(imageRegex)];
        for (const match of matches) {
            const fullSyntax = match[0];
            const imagePath = match[1];
            const resolvedSrc = await getMediaResourcePath(imagePath);
            if (resolvedSrc) {
                const imgTag = `<img src="${resolvedSrc}" alt="${imagePath}" class="markdown-embed" />`;
                html = html.replace(fullSyntax, imgTag);
            }
        }

        // --- Step 4: Wrap remaining lines in <p> tags ---
        // Avoid wrapping elements that are already block-level
        return html
            .split("\n")
            .map((line) => {
                if (line.trim() === "") return "";
                if (line.match(/<(h[1-6]|ul|li|blockquote|hr|pre|img)/)) return line;
                return `<p>${line}</p>`;
            })
            .join("");
    },
};

// ====================================================================
// SELF-CONTAINED SUB-COMPONENTS (Unchanged, unless specified)
// ====================================================================

const MatrixRain = ({
    mainColor = 'oklch(0.82 0.21 300)', // The color of the fading trail
    leadColor = 'oklch(0.95 0.08 300)', // The color of the bright, leading character
    charSet = "癸 őt ABCD 𒈹 EFGH 𒎓 IJKL MNOP QRST UVWX YZ 𒀭 0123 4567 89 𒄭 𒉍 𒀏 𒅆 𒍑 𒇻 {} vattabb USD $ @ # 𒅖 𒍪 𒈨 findIndex fetchAll API",
    fontSize = 16,
    spacingFactor = 2.5, // Controls average stream density. Smaller number = more streams.
    frequency = 0.5,      // Controls speed and refresh rate (0 to 1)
}) => {
    const wrapperRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const streamsRef = useRef([]); // Renamed from columnsRef for clarity
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

    // --- CHANGE START ---
    // If frequency is 0, return a static background without the rain effect.
    if (frequency === 0) {
        return (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#0b0713' }} />
        );
    }
    // --- CHANGE END ---

    const safeCharSet = String(charSet);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // --- Derive animation parameters from props ---
        const clampedFrequency = Math.max(0.01, Math.min(1, frequency));
        const minSpeed = 0.2 + (clampedFrequency * 0.5);
        const maxSpeed = 0.5 + (clampedFrequency * 1.0);
        const resetHeightMultiplier = 50 - (clampedFrequency * 48);

        const init = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = wrapper.clientWidth;
            const h = wrapper.clientHeight;

            if (w === 0 || h === 0) return;

            sizeRef.current = { w, h, dpr };
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';

            ctx.scale(dpr, dpr);
            ctx.textBaseline = 'top';
            ctx.font = `${fontSize}px monospace`;

            const streamCount = Math.floor(w / (fontSize * Math.max(0.5, spacingFactor)));

            streamsRef.current = Array.from({ length: streamCount }, () => ({
                x: Math.random() * w, // Each stream starts at a random X position
                y: -Math.random() * h, // Start at a random position above the screen
                speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
                resetAt: h + (Math.random() * h * 0.5),
            }));
        };

        const draw = () => {
            const { w, h } = sizeRef.current;
            if (w === 0 || h === 0) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            ctx.fillStyle = 'rgba(11, 7, 19, 0.12)';
            ctx.fillRect(0, 0, w, h);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < streamsRef.current.length; i++) {
                const stream = streamsRef.current[i];

                const yPx = Math.floor(stream.y);
                const randomChar = safeCharSet[Math.floor(Math.random() * safeCharSet.length)];

                ctx.fillStyle = mainColor;
                ctx.fillText(randomChar, stream.x, yPx);

                ctx.fillStyle = leadColor;
                ctx.fillText(randomChar, stream.x, yPx);

                stream.y += stream.speed * fontSize * 0.2; // Adjust speed based on font size

                if (stream.y > stream.resetAt) {
                    stream.y = -Math.random() * resetHeightMultiplier * fontSize;
                    stream.x = Math.random() * w; // Re-randomize X position to break the grid
                    stream.speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
                }
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        let isInitialized = false;
        const start = () => {
            cancelAnimationFrame(rafRef.current);
            init();
            if (streamsRef.current.length > 0) {
                if (!isInitialized) {
                    const { w, h } = sizeRef.current;
                    ctx.fillStyle = '#0b0713';
                    ctx.fillRect(0, 0, w, h);
                    isInitialized = true;
                }
                draw();
            }
        };

        const ro = new ResizeObserver(start);
        ro.observe(wrapper);

        start();

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [mainColor, leadColor, safeCharSet, spacingFactor, fontSize, frequency]);

    return (
        <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#0b0713' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
};

const GlobalVideoPlayer = ({ media, onClose }) => {
    const [renderableSrc, setRenderableSrc] = useState(null);
    useEffect(() => {
        let cancelled = false;
        if (media?.type === "video") {
            getMediaResourcePath(media.src).then((p) => {
                if (!cancelled) setRenderableSrc(p);
            });
        }
        return () => {
            cancelled = true;
        };
    }, [media]);
    if (!media || !media.src) return null;
    const playerStyle = {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 10000,
        width: "320px",
        height: "180px",
        background: "black",
        border: "2px solid var(--glow)",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.5), 0 0 20px var(--glow-faint)",
        willChange: "transform, opacity",
    };
    const closeButtonStyle = {
        position: "absolute",
        top: "5px",
        right: "5px",
        background: "rgba(27,15,48,0.8)",
        border: "1px solid var(--glow)",
        borderRadius: "50%",
        color: "var(--glow)",
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold",
    };
    return (
        <div style={playerStyle}>
            {media.type === "video" && renderableSrc && (
                <video
                    key={renderableSrc}
                    controls
                    autoPlay
                    loop
                    muted
                    src={renderableSrc}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            )}
            {media.type === "youtube" && (
                <iframe
                    src={`https://www.youtube.com/embed/${media.src}?autoplay=1&mute=1&loop=1&playlist=${media.src}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            )}
            <button
                onClick={onClose}
                style={closeButtonStyle}
                title="Close Video Player"
            >
                X
            </button>
        </div>
    );
};

// ====================================================================
// STYLE DEFINITIONS & TOS LOGIC (Unchanged)
// ====================================================================

function applyCssText(element, cssText) {
    if (element && cssText && typeof cssText === "string") {
        element.style.cssText = cssText;
    } else if (element) {
        element.style.cssText = "display: block; position: relative;";
    }
}
function reparentToOriginal(container, originalParentRef) {
    if (!container || !originalParentRef || !originalParentRef.current) return;
    if (!originalParentRef.current.isConnected) {
        if (container.parentNode === document.body) {
            try {
                document.body.removeChild(container);
            } catch (e) {
                console.error(
                    "[ScreenModeHelper] Error removing container from body:",
                    e
                );
            }
        }
        return;
    }
    if (container.parentNode === document.body) {
        try {
            document.body.removeChild(container);
            originalParentRef.current.appendChild(container);
        } catch (e) {
            console.error("[ScreenModeHelper] Error reparenting container:", e);
        }
    }
}
const ScreenModeHelper = ({
    helperRef,
    initialMode = "default",
    containerRef,
    originalParentRefForWindow,
    originalParentRefForPiP,
    stylesByMode,
    defaultStyle,
    hideToggleButtons = false,
}) => {
    const [activeMode, setActiveMode] = useState(initialMode);
    const initialStylesAppliedRef = useRef(false);
    const capturedActiveModeForCleanup = useRef(activeMode);
    useEffect(() => {
        capturedActiveModeForCleanup.current = activeMode;
    }, [activeMode]);
    useEffect(() => {
        const container = containerRef.current;
        if (!container || initialStylesAppliedRef.current) return;
        if (activeMode === "default") {
            applyCssText(container, defaultStyle);
        } else if (stylesByMode && stylesByMode[activeMode]) {
            const parentRefForMode =
                activeMode === "window"
                    ? originalParentRefForWindow
                    : originalParentRefForPiP;
            if (
                parentRefForMode &&
                !parentRefForMode.current &&
                container.parentNode &&
                container.parentNode !== document.body
            ) {
                parentRefForMode.current = container.parentNode;
            }
            if (container.parentNode !== document.body) {
                if (container.parentNode) {
                    try {
                        container.parentNode.removeChild(container);
                    } catch (e) {
                        console.error(
                            "[ScreenModeHelper] Error removing container from initial parent:",
                            e
                        );
                    }
                }
                document.body.appendChild(container);
            }
            applyCssText(container, stylesByMode[activeMode]);
        }
        initialStylesAppliedRef.current = true;
    }, [
        containerRef,
        activeMode,
        initialMode,
        defaultStyle,
        stylesByMode,
        originalParentRefForWindow,
        originalParentRefForPiP,
    ]);
    const toggleMode = useCallback(() => {
        /* Toggling disabled when buttons are hidden */
    }, []);
    useEffect(() => {
        if (helperRef) {
            helperRef.current = {
                toggleMode: hideToggleButtons ? () => { } : toggleMode,
                getActiveMode: () => activeMode,
            };
        }
    }, [helperRef, toggleMode, activeMode, hideToggleButtons]);
    useEffect(() => {
        const currentContainer = containerRef.current;
        const modeAtUnmountSetup = capturedActiveModeForCleanup.current;
        return () => {
            if (currentContainer && modeAtUnmountSetup !== "default") {
                const parentRefToUseForReset =
                    modeAtUnmountSetup === "window"
                        ? originalParentRefForWindow
                        : originalParentRefForPiP;
                if (parentRefToUseForReset && parentRefToUseForReset.current) {
                    reparentToOriginal(currentContainer, parentRefToUseForReset);
                    applyCssText(currentContainer, defaultStyle);
                } else if (currentContainer.parentNode === document.body) {
                    try {
                        document.body.removeChild(currentContainer);
                    } catch (e) {
                        console.error(
                            "[ScreenModeHelper] Unmounting: Error removing container from body:",
                            e
                        );
                    }
                }
            }
        };
    }, [
        containerRef,
        defaultStyle,
        originalParentRefForWindow,
        originalParentRefForPiP,
    ]);
    return null;
};
const TOS_LOCALSTORAGE_KEY = "BETO_TOS_ACCEPTED_v1";
const TOS_BASENAMES = [
    "TERMS OF SERVICE.approval.md",
    "Terms Of Service.approval.md",
    "Terms of Service.approval.md",
    "TOS.approval.md",
    "TOS Approval.md",
    "TERMS.approval.md",
];
function _basename(p) {
    return (p || "").split("/").pop() || "";
}
async function findTosApprovalFile() {
    const files = dc.app.vault.getFiles().filter((f) => /\.md$/i.test(f.path));
    let hit = files.find((f) =>
        TOS_BASENAMES.some(
            (b) => _basename(f.path).toLowerCase() === b.toLowerCase()
        )
    );
    if (hit) return { file: hit, path: hit.path };
    hit = files.find((f) => {
        const n = _basename(f.path);
        return (
            /approval\.md$/i.test(n) && (/terms.*service/i.test(n) || /^tos/i.test(n))
        );
    });
    if (hit) return { file: hit, path: hit.path };
    await loadScript(
        dc,
        "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js",
        "Fuse"
    );
    try {
        const fuse = new Fuse(files, {
            keys: ["name", "path"],
            threshold: 0.32,
            ignoreLocation: true,
            minMatchCharLength: 2,
        });
        const res = fuse.search("terms service approval md");
        if (res?.length) {
            hit = res[0].item;
            return { file: hit, path: hit.path };
        }
    } catch { }
    return null;
}
async function isTosApproved() {
    const hit = await findTosApprovalFile();

    // If the approval file doesn't exist, TOS is not approved.
    if (!hit || !hit.file) {
        try {
            localStorage.setItem(TOS_LOCALSTORAGE_KEY, "0");
        } catch { }
        return false;
    }

    let txt = "";
    try {
        // MODIFICATION: Switched to dc.app.vault.read(hit.file) which is often more reliable
        // for getting fresh file content compared to adapter.read(hit.path).
        txt = await dc.app.vault.read(hit.file);
    } catch (e) {
        console.error("BETO: Could not read the TOS approval file.", e);
        // If we can't read the file, we can't confirm approval.
        return false;
    }

    // Ensure txt is a string, even if the file is empty.
    if (typeof txt !== 'string') {
        txt = '';
    }

    const allTasksRegex = /^\s*-\s*\[(x|\s)\]/gim;
    const completedTasksRegex = /^\s*-\s*\[x\]/gim;

    const totalTasks = (txt.match(allTasksRegex) || []).length;
    const completedTasks = (txt.match(completedTasksRegex) || []).length;

    // CORE LOGIC: If the file contains no tasks, it cannot be considered approved.
    // This correctly handles the case where a user removes the task lines.
    if (totalTasks === 0) {
        try {
            localStorage.setItem(TOS_LOCALSTORAGE_KEY, "0");
        } catch { }
        return false;
    }

    const approved = totalTasks > 0 && totalTasks === completedTasks;
    try {
        localStorage.setItem(TOS_LOCALSTORAGE_KEY, approved ? "1" : "0");
    } catch { }
    return approved;
}
async function writeTosApproval() {
    const today = new Date().toISOString().slice(0, 10);
    const hit = await findTosApprovalFile();
    if (hit) {
        let txt = await dc.app.vault.read(hit.file);
        if (!/^\s*-\s*\[[xX]\]/m.test(txt)) {
            if (/^\s*-\s*\[\s\]/m.test(txt)) {
                txt = txt.replace(/^\s*-\s*\[\s\]/m, `- [x] ${today}`);
            } else {
                txt = `- [x] ${today}\n\n` + txt;
            }
            await dc.app.vault.modify(hit.file, txt);
        }
    } else {
        const dir = "_RESOURCES/DATACORE";
        const body = `## Terms of Service — Approval\n- [x] ${today}\n`;
        try {
            await dc.app.vault.create(`${dir}/TERMS OF SERVICE.approval.md`, body);
        } catch {
            await dc.app.vault.create("TERMS OF SERVICE.approval.md", body);
        }
    }
    try {
        localStorage.setItem(TOS_LOCALSTORAGE_KEY, "1");
    } catch { }
    return true;
}
function subscribeToTosApprovalChanges(onChange) {
    const vault = dc?.app?.vault;
    const mc = dc?.app?.metadataCache;
    if (!vault) return () => { };
    let destroyed = false;
    const current = { path: null };
    const refreshPath = async () => {
        const hit = await findTosApprovalFile();
        current.path = hit?.path || null;
    };
    const matchTos = (file) => {
        if (!file) return false;
        const n = (file.name || "").toLowerCase();
        return (
            (current.path && file.path === current.path) ||
            TOS_BASENAMES.some((b) => n === b.toLowerCase()) ||
            (/approval\.md$/i.test(n) &&
                (/terms.*service/i.test(n) || /^tos/i.test(n)))
        );
    };
    const check = async () => {
        if (destroyed) return;
        const approved = await isTosApproved();
        if (!destroyed) onChange(approved);
    };
    const onTouched = async (file) => {
        if (!destroyed && matchTos(file)) {
            check();
        }
    };
    const onAny = async () => {
        if (!destroyed) {
            await refreshPath();
            check();
        }
    };
    const refs = [
        vault.on("modify", onTouched),
        vault.on("rename", onAny),
        vault.on("delete", onAny),
        vault.on("create", onAny),
        mc?.on?.("changed", onTouched),
    ].filter(Boolean);
    refreshPath().then(check);
    const poll = setInterval(check, 4000);
    return () => {
        destroyed = true;
        try {
            refs.forEach((r) => vault.offref?.(r) || mc?.offref?.(r));
        } catch { }
        clearInterval(poll);
    };
}

// ====================================================================
// MAIN VIEW COMPONENT
// ====================================================================

function BasicView() {
    const uniqueWrapperClass =
        "terminal-wrapper-" +
        useRef(Math.random().toString(36).substr(2, 9)).current;
    const [displayMode, setDisplayMode] = useState("welcome");
    const [welcomeStep, setWelcomeStep] = useState("intro");
    const [section, setSection] = useState("home");
    const [globalVideoPlayer, setGlobalVideoPlayer] = useState({
        media: null,
        isVisible: false,
    });
    const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const componentMediaCache = useRef({});
    const contentLayerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const scrollPosRef = useRef(0);
    const [hasPassedWelcome, setHasPassedWelcome] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isReadyToLoad, setIsReadyToLoad] = useState(false);

    const preloadComponentMedia = useCallback(async (componentPath) => {
        if (componentMediaCache.current[componentPath])
            return componentMediaCache.current[componentPath];
        try {
            const file = dc.app.vault.getAbstractFileByPath(componentPath);
            if (!file) return null;
            const content = await dc.app.vault.read(file);
            const imageRegexG = /!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
            const rawImgs = [];
            let m;
            while ((m = imageRegexG.exec(content)) !== null)
                rawImgs.push(m[1] || m[2]);
            const imageSrcs = [];
            for (const raw of rawImgs) {
                const fn = raw.includes("/")
                    ? raw.substring(raw.lastIndexOf("/") + 1)
                    : raw;
                const p =
                    (await getMediaResourcePath(raw)) || (await getMediaResourcePath(fn));
                if (p) {
                    imageSrcs.push(p);
                    const img = new Image();
                    img.decoding = "async";
                    img.src = p;
                }
            }
            const youtubeMatch = content.match(
                /<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([^"]+)"/i
            );
            const iframeMatch = content.match(/<iframe[^>]*src="([^"]+)"/i);
            const youtubeId = youtubeMatch ? youtubeMatch[1] : null;
            const iframeSrc = !youtubeId && iframeMatch ? iframeMatch[1] : null;
            let videoFileName = null,
                videoSrc = null;
            if (rawImgs.length) {
                const lastBase = (
                    rawImgs[rawImgs.length - 1].split("/").pop() || ""
                ).replace(/\.[^.]+$/, "");
                for (const ext of [".mp4", ".webm"]) {
                    const candidate = `${lastBase}${ext}`;
                    const vpath = await getMediaResourcePath(candidate);
                    if (vpath) {
                        videoFileName = candidate;
                        videoSrc = vpath;
                        break;
                    }
                }
            }
            const details = {
                imageSrcs,
                youtubeId,
                iframeSrc,
                videoFileName,
                videoSrc,
                rawContent: content,
            };
            componentMediaCache.current[componentPath] = details;
            return details;
        } catch {
            return null;
        }
    }, []);
    const parseShowcaseForPreload = useCallback(async () => {
        const showcasePath = "_RESOURCES/DATACORE/DATACORE.showcase.md";
        const file = dc.app.vault.getAbstractFileByPath(showcasePath);
        if (!file) return [];
        const basePath = showcasePath.substring(0, showcasePath.lastIndexOf("/"));
        const content = await dc.app.vault.read(file);
        const categories = [];
        const categoryRegex = /^## \*\*(.*)\*\*/;
        const componentLinkRegex = /^###### \[([^\]]+)\]\(([^)]+)\)/;
        let current = null;
        for (const raw of content.split("\n")) {
            const line = raw.trim();
            const cm = line.match(categoryRegex);
            const lm = line.match(componentLinkRegex);
            if (cm) {
                current = [];
                categories.push(current);
            } else if (lm && current) {
                current.push(`${basePath}/${decodeURIComponent(lm[2])}`);
            }
        }
        return categories.flat();
    }, []);
    const preloadShowcaseMedia = useCallback(async (config) => {
        for (const slide of config.slides) {
            try {
                await getMediaResourcePath(`${config.videoDir}/${slide.file}`, {
                    preferDir: config.videoDir,
                    preferExts: VID_EXTS,
                });
                const thumbName = config.getThumbName(slide);
                const thumbPath = await getMediaResourcePath(
                    `${config.imageDir}/${thumbName}`,
                    { preferDir: config.imageDir, preferExts: ["webp", ...IMG_EXTS] }
                );
                if (thumbPath) {
                    const img = new Image();
                    img.decoding = "async";
                    img.src = thumbPath;
                }
            } catch (e) { }
        }
    }, []);
    const preloadStartedRef = useRef(false);
    const startBackgroundPreload = useCallback(async () => {
        if (preloadStartedRef.current) return;
        preloadStartedRef.current = true;
        preloadShowcaseMedia({
            slides: [
                { file: "DOC" },
                { file: "DATACORE" },
                { file: "ASSETS" },
                { file: "DEVLOG" },
            ],
            videoDir: "_RESOURCES/VIDEOS",
            imageDir: "_RESOURCES/IMAGES",
            getThumbName: (slide) => `${slide.file}.webp`,
        });
        preloadShowcaseMedia({
            slides: [
                { file: "devlog_1" },
                { file: "devlog_2" },
                { file: "devlog_3" },
                { file: "devlog_4" },
            ],
            videoDir: "_RESOURCES/VIDEOS",
            imageDir: "_RESOURCES/IMAGES",
            getThumbName: (slide) => `DEVLOG_${slide.file.split("_")[1]}.webp`,
        });
        return new Promise(async (resolve) => {
            const paths = await parseShowcaseForPreload();
            const queue = [...paths];
            const pump = async () => {
                const batch = queue.splice(0, 1);
                if (batch.length > 0) {
                    await Promise.all(batch.map(preloadComponentMedia));
                }
                if (queue.length > 0) {
                    if ("requestIdleCallback" in window) {
                        requestIdleCallback(pump, { timeout: 2000 });
                    } else {
                        setTimeout(pump, 300);
                    }
                } else {
                    resolve();
                }
            };
            setTimeout(pump, 2500);
        });
    }, [parseShowcaseForPreload, preloadComponentMedia, preloadShowcaseMedia]);
    const beginFullTransition = useCallback(() => {
        const reduce = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches;
        if (!reduce) setShowWelcomeOverlay(true);
        setHasPassedWelcome(true);
        setDisplayMode("full");
        if (!reduce) setTimeout(() => setShowWelcomeOverlay(false), 480);
    }, []);

    useEffect(() => {
        if (displayMode === "full" && !preloadStartedRef.current) {
            setIsReadyToLoad(true);
        }
    }, [displayMode]);
    useEffect(() => {
        if (isReadyToLoad) {
            const loadInitialData = async () => {
                setIsSyncing(true);
                await startBackgroundPreload();
                setIsSyncing(false);
            };
            loadInitialData();
        }
    }, [isReadyToLoad]);
        
    // --- MODIFICATION START ---
    // This effect now correctly handles TOS state changes without hijacking the initial load.
    useEffect(() => {
        const unsub = subscribeToTosApprovalChanges((approved) => {
            // Only force the UI back to the TOS screen if the user has ALREADY passed the welcome flow
            // and is in the main application. This handles the case where TOS is revoked during use.
            if (!approved && hasPassedWelcome) {
                setHasPassedWelcome(false); // Reset the flag
                setDisplayMode("welcome");
                setWelcomeStep("tos");
            }
        });

        return () => {
            unsub && unsub();
        };
    }, [hasPassedWelcome]); // Depend on `hasPassedWelcome` to re-evaluate the subscription logic
    // --- MODIFICATION END ---
    
    useEffect(() => {
        const contentEl = contentLayerRef.current;
        if (contentEl) {
            if (isModalOpen) {
                scrollPosRef.current = contentEl.scrollTop;
                contentEl.style.overflow = "hidden";
            } else {
                contentEl.style.overflow = "auto";
                requestAnimationFrame(() => {
                    contentEl.scrollTop = scrollPosRef.current;
                });
            }
        }
    }, [isModalOpen]);

    const LoadingIndicator = ({ isSyncing }) => {
        const STYLES_SYNC = {
            indicator: {
                position: "fixed",
                top: "12px",
                right: "12px",
                zIndex: "100001",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(16, 10, 24, 0.9)",
                backdropFilter: "blur(5px)",
                border: "1px solid var(--glow-faint)",
                borderRadius: "8px",
                padding: "6px 12px",
                color: "var(--text-muted)",
                fontSize: "12px",
                fontVariant: "small-caps",
                transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
                opacity: isSyncing ? 1 : 0,
                transform: isSyncing ? "translateY(0)" : "translateY(-10px)",
                pointerEvents: isSyncing ? "auto" : "none",
            },
            spinner: {
                width: "14px",
                height: "14px",
                border: "2px solid var(--glow-faint)",
                borderTopColor: "var(--glow)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
            },
        };
        return (
            <div style={STYLES_SYNC.indicator}>
                <div style={STYLES_SYNC.spinner}></div>
                <span>Syncing Data...</span>
            </div>
        );
    };

    const CSS = generateCSS(uniqueWrapperClass);

    // ====================================================================
    // Tightly-Coupled Sub-components (defined inside to access state)
    // ====================================================================

    const Pill = ({ id, label }) => (
        <span
            className="pill"
            style={STYLES.pill}
            data-active={section === id ? 1 : 0}
            onClick={() => setSection(id)}
        >
            {label}
        </span>
    );
    const Header = () => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
            }}
        >
            <h1
                className="headline glitch-text"
                style={STYLES.h1}
                data-text="B.E.T.O.888"
            >
                BETO . 888
            </h1>
            {displayMode === "full" && (
                <>
                    <p className="anim-typewriter" style={STYLES.sub}>
            // Accessing Mainframe... Select enigmas to access.
                    </p>
                    <div style={STYLES.pillbar}>
                        <Pill id="home" label="[ Home ]" />{" "}
                        <Pill id="docs" label="[ Docs ]" />
                        <Pill id="datacore" label="[ Datacore ]" />{" "}
                        <Pill id="assets" label="[ Assets ]" />
                        <Pill id="devlog" label="[ Dev Log ]" />
                    </div>
                </>
            )}
        </div>
    );
    const WelcomeCover = () => {
        const reduce = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches;
        return (
            <div className="welcome-cover">
                <div style={{ ...STYLES.shell }}>
                    <MatrixRain
                        spacingFactor={0}
                        mainColor="oklch(0.75 0.01 100)"
                        leadColor="oklch(0.98 0.01 100)"
                        frequency={0.1}
                    />
                    <div className="fx-stage">
                        <div className="fx-grid"></div>
                        <div className="fx-scanlines"></div>
                        <div className="fx-vignette"></div>
                    </div>
                    <div
                        style={{
                            position: "relative",
                            zIndex: 10,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Header />
                    </div>
                </div>
            </div>
        );
    };

    // Showcase component and its sub-components remain unchanged as they are complex UI logic.
    const Showcase = ({
        slides,
        onButtonClick,
        buttonTextTemplate,
        imageDir,
        videoDir,
        getThumbName,
    }) => {
        const TIMER_DURATION = 8000;
        const [activeId, setActiveId] = useState(() => slides?.[0]?.id || null);
        const [isPaused, setIsPaused] = useState(false);
        const [mediaMap, setMediaMap] = useState({});
        const slideIntervalRef = useRef(null);
        const activeVideoRef = useRef(null);
        const wrapperRef = useRef(null);
        const navRef = useRef(null);
        const trackRef = useRef(null);
        const position = useRef(0);
        const velocity = useRef(0);
        const animationFrameId = useRef(null);
        const isAutoScrolling = useRef(true);
        const touchStartPos = useRef(0);
        const lastDelta = useRef(0);
        const [containerDimension, setContainerDimension] = useState(0);
        const snapTimeoutId = useRef(null);
        const snapTarget = useRef(null);
        const isSnapping = useRef(false);
        const slideMetrics = useRef([]);
        const [isMobileLayout, setIsMobileLayout] = useState(() => {
            if (typeof window !== "undefined") {
                return window.innerWidth < 768;
            }
            return false;
        });
        useEffect(() => {
            const element = wrapperRef.current;
            if (!element) return;
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setIsMobileLayout(entry.contentRect.width < 768);
                }
            });
            observer.observe(element);
            return () => observer.disconnect();
        }, []);
        useEffect(() => {
            const track = trackRef.current;
            const navEl = navRef.current;
            if (
                !track ||
                !navEl ||
                track.children.length === 0 ||
                slides.length === 0
            )
                return;
            const isVertical = !isMobileLayout;
            const slideElements = Array.from(track.children).slice(0, slides.length);
            if (slideElements.length === 0) return;
            slideMetrics.current = slideElements.map((el) => {
                const style = window.getComputedStyle(el);
                const margin = isVertical
                    ? parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10)
                    : parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);
                return {
                    offset: isVertical ? el.offsetTop : el.offsetLeft,
                    size: (isVertical ? el.offsetHeight : el.offsetWidth) + margin,
                };
            });
            const slideBlockDimension = slideMetrics.current.reduce(
                (sum, metric) => sum + metric.size,
                0
            );
            const currentContainerDimension = isVertical
                ? navEl.clientHeight
                : navEl.clientWidth;
            setContainerDimension(currentContainerDimension);
            if (currentContainerDimension === 0 || slideBlockDimension === 0) return;
            const worldDimension = slideBlockDimension + currentContainerDimension;
            const calculateInitialPosition = () => {
                if (slideMetrics.current.length === 0) return 0;
                const viewportCenter = currentContainerDimension / 2;
                const firstSlideMetric = slideMetrics.current[0];
                const firstSlideCenter =
                    firstSlideMetric.offset + firstSlideMetric.size / 2;
                return viewportCenter - firstSlideCenter;
            };
            const initialPosition = calculateInitialPosition();
            position.current = initialPosition;
            velocity.current = 0;
            isAutoScrolling.current = true;
            if (isMobileLayout) {
                isAutoScrolling.current = false;
            }
            const stopAnimation = () => {
                if (animationFrameId.current) {
                    cancelAnimationFrame(animationFrameId.current);
                    animationFrameId.current = null;
                }
            };
            const animate = () => {
                if (isSnapping.current && snapTarget.current !== null) {
                    const distance = snapTarget.current - position.current;
                    if (Math.abs(distance) < 0.1) {
                        position.current = snapTarget.current;
                        isSnapping.current = false;
                        snapTarget.current = null;
                        velocity.current = 0;
                    } else {
                        position.current += distance * 0.15;
                    }
                } else {
                    if (!isAutoScrolling.current) {
                        velocity.current *= 0.92;
                    }
                    position.current += velocity.current;
                }
                if (position.current < -worldDimension) {
                    position.current += worldDimension;
                } else if (position.current > 0) {
                    position.current -= worldDimension;
                }
                const transformValue = isVertical
                    ? `translateY(${position.current}px)`
                    : `translateX(${position.current}px)`;
                track.style.transform = transformValue;
                if (
                    isSnapping.current ||
                    Math.abs(velocity.current) > 0.01 ||
                    (isAutoScrolling.current && isVertical)
                ) {
                    animationFrameId.current = requestAnimationFrame(animate);
                } else {
                    stopAnimation();
                }
            };
            const startAnimation = () => {
                if (!animationFrameId.current) {
                    animationFrameId.current = requestAnimationFrame(animate);
                }
            };
            track.style.transform = isVertical
                ? `translateY(${initialPosition}px)`
                : `translateX(${initialPosition}px)`;
            startAnimation();
            const triggerSnapToCenter = () => {
                clearTimeout(snapTimeoutId.current);
                snapTimeoutId.current = setTimeout(() => {
                    const viewportCenter = currentContainerDimension / 2;
                    let minDistance = Infinity;
                    let bestSnapTarget = null;
                    const currentPosition = position.current;
                    const allPossibleTargets = [];
                    slideMetrics.current.forEach((metric) => {
                        const itemCenter = metric.offset + metric.size / 2;
                        allPossibleTargets.push(viewportCenter - itemCenter);
                        allPossibleTargets.push(
                            viewportCenter - (itemCenter + worldDimension)
                        );
                    });
                    allPossibleTargets.forEach((target) => {
                        const distance = Math.abs(currentPosition - target);
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestSnapTarget = target;
                        }
                    });
                    if (bestSnapTarget !== null) {
                        snapTarget.current = bestSnapTarget;
                        isSnapping.current = true;
                        startAnimation();
                    }
                }, 100);
            };
            if (isAutoScrolling.current && isVertical) {
                setTimeout(() => {
                    if (isAutoScrolling.current && isVertical) {
                        velocity.current = -0.3;
                        startAnimation();
                    }
                }, 1500);
            }
            const handleInteractionStart = () => {
                isAutoScrolling.current = false;
                isSnapping.current = false;
                snapTarget.current = null;
                clearTimeout(snapTimeoutId.current);
                stopAnimation();
            };
            const handleInteractionEnd = () => {
                triggerSnapToCenter();
            };
            const handleWheel = (e) => {
                handleInteractionStart();
                const scrollDelta = isVertical ? e.deltaY : e.deltaX + e.deltaY;
                velocity.current += scrollDelta * 0.05;
                startAnimation();
                triggerSnapToCenter();
            };
            const handleTouchStart = (e) => {
                handleInteractionStart();
                touchStartPos.current = isVertical
                    ? e.touches[0].clientY
                    : e.touches[0].clientX;
                lastDelta.current = 0;
            };
            const handleTouchMove = (e) => {
                const currentPos = isVertical
                    ? e.touches[0].clientY
                    : e.touches[0].clientX;
                const delta = currentPos - touchStartPos.current;
                const moveDelta = delta - lastDelta.current;
                position.current += moveDelta;
                lastDelta.current = delta;
                velocity.current = moveDelta;
                startAnimation();
            };
            navEl.addEventListener("wheel", handleWheel, { passive: true });
            navEl.addEventListener("touchstart", handleTouchStart, { passive: true });
            navEl.addEventListener("touchmove", handleTouchMove, { passive: true });
            navEl.addEventListener("touchend", handleInteractionEnd, {
                passive: true,
            });
            navEl.addEventListener("touchcancel", handleInteractionEnd, {
                passive: true,
            });
            return () => {
                stopAnimation();
                clearTimeout(snapTimeoutId.current);
                navEl.removeEventListener("wheel", handleWheel);
                navEl.removeEventListener("touchstart", handleTouchStart);
                navEl.removeEventListener("touchmove", handleTouchMove);
                navEl.removeEventListener("touchend", handleInteractionEnd);
                navEl.removeEventListener("touchcancel", handleInteractionEnd);
            };
        }, [isMobileLayout, slides.length]);
        const reduceMotion = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches;
        const saveData = navigator.connection?.saveData === true;
        const allowVideo = !reduceMotion && !saveData;
        const resolveFor = useCallback(
            async (slide) => {
                const base = slide.file;
                const thumbName = getThumbName(slide);
                const vid = await getMediaResourcePath(`${videoDir}/${base}`, {
                    preferDir: videoDir,
                    preferExts: VID_EXTS,
                });
                const thumb = await getMediaResourcePath(`${imageDir}/${thumbName}`, {
                    preferDir: imageDir,
                    preferExts: ["webp", ...IMG_EXTS],
                });
                return { vid, thumb };
            },
            [imageDir, videoDir, getThumbName]
        );
        const ensureMedia = useCallback(
            async (id) => {
                if (mediaMap[id]) return;
                const slide = slides.find((s) => s.id === id);
                if (!slide) return;
                const resolved = await resolveFor(slide);
                setMediaMap((m) => ({ ...m, [id]: resolved }));
            },
            [mediaMap, resolveFor, slides]
        );
        useEffect(() => {
            if (slides.length > 0) slides.forEach((slide) => ensureMedia(slide.id));
        }, [slides, ensureMedia]);
        const stopAutoSlide = useCallback(
            () => clearInterval(slideIntervalRef.current),
            []
        );
        const startAutoSlide = useCallback(() => {
            stopAutoSlide();
            if (isPaused || slides.length < 2) return;
            slideIntervalRef.current = setInterval(() => {
                setActiveId((currentId) => {
                    const currentIndex = slides.findIndex((s) => s.id === currentId);
                    return slides[(currentIndex + 1) % slides.length].id;
                });
            }, TIMER_DURATION);
        }, [isPaused, slides, stopAutoSlide]);
        useEffect(() => {
            activeVideoRef.current?.play().catch(() => { });
            startAutoSlide();
            return stopAutoSlide;
        }, [activeId, isPaused, startAutoSlide, stopAutoSlide]);
        const handleMouseEnter = () => setIsPaused(true);
        const handleMouseLeave = () => setIsPaused(false);
        const activeSlide = slides.find((s) => s.id === activeId);
        if (!activeSlide) return <div className="homeShowcase">Loading...</div>;
        return (
            <div
                ref={wrapperRef}
                className={`homeShowcase ${isMobileLayout ? "is-mobile-layout" : ""}`}
            >
                <div
                    className="showcaseFeatured"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div style={STYLES.showcaseMedia}>
                        <div
                            key={activeSlide.id + "-media"}
                            className="showcase-media-anim"
                            style={{ width: "100%", height: "100%" }}
                        >
                            {allowVideo && mediaMap[activeId]?.vid ? (
                                <video
                                    ref={activeVideoRef}
                                    key={mediaMap[activeId].vid}
                                    src={mediaMap[activeId].vid}
                                    style={{
                                        ...STYLES.showcaseMediaAsset,
                                        transform: activeSlide.flipMedia ? "scaleX(-1)" : "none",
                                    }}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : mediaMap[activeId]?.thumb ? (
                                <img
                                    src={mediaMap[activeId].thumb}
                                    style={{
                                        ...STYLES.showcaseMediaAsset,
                                        transform: activeSlide.flipMedia ? "scaleX(-1)" : "none",
                                    }}
                                    alt={activeSlide.title}
                                    loading="eager"
                                />
                            ) : (
                                <div
                                    style={{
                                        display: "grid",
                                        placeContent: "center",
                                        height: "100%",
                                        color: "var(--text-faint)",
                                    }}
                                >
                                    Loading Media...
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={STYLES.showcaseMediaOverlay}></div>
                    <div
                        key={activeSlide.id + "-content"}
                        className="showcase-content-anim"
                        style={STYLES.showcaseContent}
                    >
                        <h2
                            style={{
                                ...STYLES.h1,
                                fontSize: "clamp(2rem, 5vw, 2.75rem)",
                                margin: 0,
                                color: "var(--glow)",
                                fontVariant: "small-caps",
                            }}
                        >
                            {activeSlide.title}
                        </h2>
                        <p
                            style={{
                                fontSize: "1rem",
                                color: "var(--text-normal)",
                                margin: "12px 0 24px 0",
                                lineHeight: 1.6,
                            }}
                        >
                            {activeSlide.description}
                        </p>
                        <button
                            className="btn"
                            style={{ ...STYLES.btn, fontVariant: "small-caps" }}
                            onClick={() => onButtonClick(activeSlide)}
                        >
                            {buttonTextTemplate(activeSlide.title)}
                        </button>
                    </div>
                </div>
                <div ref={navRef} className="showcaseNav">
                    <div
                        className={`showcaseNav-center-debug-line ${isMobileLayout ? "is-horizontal" : "is-vertical"
                            }`}
                    />
                    <div ref={trackRef} className="showcaseNav-track">
                        {slides.map((slide, index) => {
                            const isActive = slide.id === activeId;
                            return (
                                <div
                                    key={`${slide.id}-${index}`}
                                    className={`showcaseNavItem ${isActive ? "is-active" : ""}`}
                                    onClick={() => setActiveId(slide.id)}
                                >
                                    {mediaMap[slide.id]?.thumb ? (
                                        <img
                                            src={mediaMap[slide.id].thumb}
                                            className="navItemThumb"
                                            style={{
                                                transform: slide.flipMedia ? "scaleX(-1)" : "none",
                                            }}
                                            alt={`${slide.title} thumbnail`}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div
                                            className="navItemThumb"
                                            style={{ background: "#111" }}
                                        ></div>
                                    )}
                                    <div className="navItemText">
                                        <h3
                                            style={{
                                                ...STYLES.h2,
                                                fontSize: "14px",
                                                margin: 0,
                                                fontVariant: "small-caps",
                                            }}
                                        >
                                            {slide.title}
                                        </h3>
                                        {!isMobileLayout && (
                                            <p
                                                style={{
                                                    fontSize: "12px",
                                                    margin: "4px 0 0 0",
                                                    fontVariant: "small-caps",
                                                }}
                                            >
                                                {slide.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    {isActive && (
                                        <div
                                            key={`${activeId}-${index}`}
                                            className="navProgress"
                                            style={{
                                                animation: `progress ${TIMER_DURATION / 1000
                                                    }s linear forwards`,
                                                animationPlayState: isPaused ? "paused" : "running",
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        <div
                            style={{
                                [isMobileLayout
                                    ? "width"
                                    : "height"]: `${containerDimension}px`,
                                flexShrink: 0,
                            }}
                        />
                        {slides.map((slide, index) => {
                            const isActive = slide.id === activeId;
                            return (
                                <div
                                    key={`clone-${slide.id}-${index}`}
                                    className={`showcaseNavItem ${isActive ? "is-active" : ""}`}
                                    onClick={() => setActiveId(slide.id)}
                                >
                                    {mediaMap[slide.id]?.thumb ? (
                                        <img
                                            src={mediaMap[slide.id].thumb}
                                            className="navItemThumb"
                                            style={{
                                                transform: slide.flipMedia ? "scaleX(-1)" : "none",
                                            }}
                                            alt={`${slide.title} thumbnail`}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div
                                            className="navItemThumb"
                                            style={{ background: "#111" }}
                                        ></div>
                                    )}
                                    <div className="navItemText">
                                        <h3
                                            style={{
                                                ...STYLES.h2,
                                                fontSize: "14px",
                                                margin: 0,
                                                fontVariant: "small-caps",
                                            }}
                                        >
                                            {slide.title}
                                        </h3>
                                        {!isMobileLayout && (
                                            <p
                                                style={{
                                                    fontSize: "12px",
                                                    margin: "4px 0 0 0",
                                                    fontVariant: "small-caps",
                                                }}
                                            >
                                                {slide.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    {isActive && (
                                        <div
                                            key={`clone-${activeId}-${index}`}
                                            className="navProgress"
                                            style={{
                                                animation: `progress ${TIMER_DURATION / 1000
                                                    }s linear forwards`,
                                                animationPlayState: isPaused ? "paused" : "running",
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const Home = ({ setSection }) => {
        const slides = [
            {
                id: "docs",
                title: "Docs",
                subtitle: "Access System Manuals",
                description: (
                    <>
                        Further Enhance Your{" "}
                        <span className="flicker-text" data-original-text="Knowledge">
                            Knowledge
                        </span>
                    </>
                ),
                file: "DOC",
            },
            {
                id: "datacore",
                title: "Datacore",
                subtitle: "Browse Interactive Components",
                description: "Components to enhance your Obsidian vault",
                file: "DATACORE",
            },
            {
                id: "assets",
                title: "Assets Library",
                subtitle: "Visual Resources Collection",
                description: "Collection of SVG created utilizing Excalidraw",
                file: "ASSETS",
            },
            {
                id: "devlog",
                title: "Dev Log",
                subtitle: "Review System Updates",
                description: (
                    <>
                        Monthly Expansions with{" "}
                        <span className="new-toy-glow">New Shiny Toys</span>
                    </>
                ),
                file: "DEVLOG",
                flipMedia: true,
            },
        ];
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    alignItems: "center",
                    gap: "24px",
                }}
            >
                <Showcase
                    slides={slides}
                    onButtonClick={(slide) => setSection(slide.id)}
                    buttonTextTemplate={(title) => `[ Access ${title} ]`}
                    imageDir="_RESOURCES/IMAGES"
                    videoDir="_RESOURCES/VIDEOS"
                    getThumbName={(slide) => `${slide.file}.webp`}
                />
                <UpdateManager />
            </div>
        );
    };


    // DevLog, Assets, NFModal, and DataCore components remain unchanged
    const DevLog = ({ setIsSyncing }) => {
        const [logs, setLogs] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);
        const [modalState, setModalState] = useState({
            open: false,
            details: null,
            loading: false,
        });
        const mountedRef = useRef(true);

        const extractDevlogDetails = useCallback(async (slide) => {
            const basePath = "_OPERATION/PUBLIC/DEVLOG/ITI/";
            const completeFileName = slide.fileBasename.endsWith(".md")
                ? slide.fileBasename
                : `${slide.fileBasename}.md`;
            const fullPath = `${basePath}${completeFileName}`;

            const file = dc.app.vault.getAbstractFileByPath(fullPath);
            if (!file) {
                new Notice(`Could not find devlog file: ${completeFileName}`, 3000);
                return null;
            }

            const content = await dc.app.vault.read(file);
            const renderedHtml = await ContentRenderer.renderMarkdown(content);
            const imageRegexG = /!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
            const rawImgs = [];
            let m;
            while ((m = imageRegexG.exec(content)) !== null)
                rawImgs.push(m[1] || m[2]);

            const imageSlides = (
                await Promise.all(
                    rawImgs.map(async (raw) => {
                        const p = await getMediaResourcePath(raw);
                        return p ? { type: "image", src: p } : null;
                    })
                )
            ).filter(Boolean);

            const thumbPath = await getMediaResourcePath(
                `_RESOURCES/IMAGES/DEVLOG_${slide.file.split("_")[1]}.webp`
            );
            const allSlides = [];
            if (thumbPath) allSlides.push({ type: "image", src: thumbPath });
            allSlides.push(...imageSlides);

            return {
                title: slide.title,
                description: renderedHtml,
                slides: allSlides,
            };
        }, []);

        const onOpenModal = useCallback(
            async (slide) => {
                setModalState({ open: true, details: null, loading: true });
                const details = await extractDevlogDetails(slide);
                if (mountedRef.current) {
                    if (details) {
                        setModalState({ open: true, details, loading: false });
                    } else {
                        setModalState({ open: false, details: null, loading: false });
                    }
                }
            },
            [extractDevlogDetails]
        );

        const onCloseModal = useCallback(() => {
            setModalState({ open: false, details: null, loading: false });
        }, []);

        useEffect(() => {
            const fetchDevlogList = async () => {
                setIsLoading(true);
                try {
                    const MASTER_DEVLOG_PATH = "_OPERATION/PUBLIC/DEVLOG/DEVLOG.md";
                    const masterFile =
                        dc.app.vault.getAbstractFileByPath(MASTER_DEVLOG_PATH);
                    if (!masterFile)
                        throw new Error(
                            `Master devlog file missing at: "${MASTER_DEVLOG_PATH}"`
                        );
                    const masterContent = await dc.app.vault.read(masterFile);
                    const linkRegex = /^###### \[\[([^|\]]+)\|?([^\]]*)\]\]/gm;
                    const entryLinks = [];
                    let match;
                    while ((match = linkRegex.exec(masterContent)) !== null) {
                        entryLinks.push({
                            fileName: match[1].trim(),
                            displayName: match[2].trim() || match[1].trim(),
                        });
                    }
                    if (entryLinks.length === 0)
                        throw new Error("No devlog links found in master file.");
                    const sortedLogs = entryLinks
                        .map((link) => {
                            const nameParts = link.displayName.toLowerCase().split("-");
                            const logNumber = parseInt(nameParts[1], 10);
                            return {
                                id: link.displayName,
                                title: link.displayName,
                                fileBasename: link.fileName,
                                subtitle: "",
                                description: "",
                                file: `devlog_${logNumber + 1}`,
                                flipMedia: nameParts[0] === "red",
                            };
                        })
                        .sort((a, b) => {
                            const numA = parseInt(a.id.split("-")[1], 10);
                            const numB = parseInt(b.id.split("-")[1], 10);
                            return numB - numA;
                        });
                    if (mountedRef.current) setLogs(sortedLogs);
                } catch (e) {
                    if (mountedRef.current) setError(e.message);
                } finally {
                    if (mountedRef.current) setIsLoading(false);
                    setIsSyncing(false);
                }
            };
            fetchDevlogList();
            return () => {
                mountedRef.current = false;
            };
        }, [setIsSyncing]);

        if (isLoading) {
            return (
                <div style={{ ...STYLES.tile, width: "100%", maxWidth: "1080px" }}>
                    Loading Dev Logs...
                </div>
            );
        }
        if (error) {
            return (
                <div
                    style={{
                        ...STYLES.tile,
                        width: "100%",
                        maxWidth: "1080px",
                        textAlign: "center",
                        alignItems: "center",
                    }}
                >
                    <h2 style={{ ...STYLES.h2, color: "oklch(0.75 0.22 25)" }}>
                        Failed to Load Dev Logs
                    </h2>
                    <p
                        style={{
                            margin: "8px 0 0 0",
                            whiteSpace: "pre-wrap",
                            color: "var(--text-muted)",
                            maxWidth: "600px",
                        }}
                    >
                        {error}
                    </p>
                </div>
            );
        }

        return (
            <>
                <Showcase
                    slides={logs}
                    onButtonClick={onOpenModal}
                    buttonTextTemplate={(title) => `[ View ${title} Details ]`}
                    imageDir="_RESOURCES/IMAGES"
                    videoDir="_RESOURCES/VIDEOS"
                    getThumbName={(slide) => `DEVLOG_${slide.file.split("_")[1]}.webp`}
                />
                <NFModal state={modalState} onClose={onCloseModal} />
            </>
        );
    };
    const Assets = () => {
        return (
            <div style={{height: "60vh"}}>
                <AssetsLibrary />
            </div>)
      };
    const NFModal = ({ state, onClose }) => {
        const [idx, setIdx] = useState(0);
        const [isPaused, setIsPaused] = useState(false);
        const [showNav, setShowNav] = useState(false);
        const [hintActive, setHintActive] = useState(false);
        const hintTimerRef = useRef(null);
        const open = !!state?.open;
        const details = state?.details;
        const slides = useMemo(() => {
            if (!details?.slides?.length) return [];
            const imgs = details.slides.filter((s) => s.type === "image");
            const ifr = details.slides.filter((s) => s.type === "iframe");
            return ifr.length ? [...imgs, ifr[ifr.length - 1]] : imgs;
        }, [details]);
        const len = slides.length;
        const currentSlideType = useMemo(() => slides[idx]?.type, [slides, idx]);
        useEffect(() => {
            if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
            setHintActive(true);
            hintTimerRef.current = setTimeout(() => setHintActive(false), 2500);
            const isVideo = slides[idx]?.type === "iframe";
            if (!open || len < 2 || isPaused || isVideo) {
                return;
            }
            const intervalId = setInterval(() => setIdx((i) => (i + 1) % len), 8000);
            return () => clearInterval(intervalId);
        }, [open, len, isPaused, idx, slides]);
        useEffect(() => {
            setIdx(0);
            setIsPaused(false);
            setShowNav(false);
        }, [open, details]);
        useEffect(() => {
            if (!open) return;
            const onKey = (e) => {
                if (e.key === "Escape") onClose();
            };
            document.addEventListener("keydown", onKey);
            return () => {
                document.removeEventListener("keydown", onKey);
            };
        }, [open, onClose]);
        const advance = (dir) => setIdx((i) => (i + dir + len) % len);
        const prev = () => advance(-1);
        const next = () => advance(1);
        const t0 = useRef(0),
            dx = useRef(0);
        const onTouchStart = (e) => {
            t0.current = e.touches?.[0]?.clientX || 0;
            dx.current = 0;
        };
        const onTouchMove = (e) => {
            const x = e.touches?.[0]?.clientX || 0;
            dx.current = x - t0.current;
        };
        const onTouchEnd = () => {
            if (Math.abs(dx.current) > 50) {
                dx.current > 0 ? prev() : next();
            }
        };
        const handleMouseMove = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const isVideo = currentSlideType === "iframe";
            const activationZone = isVideo ? 0.08 : 0.35;
            if (x < activationZone || x > 1 - activationZone) {
                setShowNav(true);
            } else {
                setShowNav(false);
            }
        };
        const openWiki = async (pathOrName) => {
            const base = (pathOrName || "").split("/").pop() || "";
            const name = base.replace(/\.md$/i, "");
            try {
                dc.app.workspace.openLinkText(`${name}`, "", true);
                return;
            } catch (_) { }
            try {
                const exact = dc.app.vault.getAbstractFileByPath(pathOrName);
                if (exact) return dc.app.workspace.getLeaf(true).openFile(exact);
                if (window.fuzzyFindFile) {
                    const byName = await fuzzyFindFile(`${name}.md`);
                    if (byName) return dc.app.workspace.getLeaf(true).openFile(byName);
                }
            } catch {
                new Notice(`Could not open: ${name}`, 3000);
            }
        };
        const openAllComponents = () =>
            details?.comps?.forEach((c) => openWiki(c.path));
        if (!open) return null;
        return (
            <div
                className="panel-wrap"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <style>{`.panel-wrap{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:clamp(16px,3vw,32px);backdrop-filter:blur(14px) saturate(1.2);background:oklch(0 0 0/.65);animation:fadeIn .35s cubic-bezier(.25,1,.5,1)}.panel{display:flex;flex-direction:column;width:min(96vw,1400px);height:min(94vh,1000px);background:rgba(18,12,22,.85);border:1px solid rgba(255,255,255,.12);border-radius:18px;box-shadow:0 30px 120px rgba(0,0,0,.55);animation:scaleIn .35s cubic-bezier(.25,1,.5,1);position:relative; overflow-y: auto;}.nf-sticky-header{position:sticky;top:0;z-index:10; background:rgba(18,12,22,.95); backdrop-filter: blur(8px);}.nf-top-close{position:absolute;top:14px;left:18px;border:1px solid var(--glow);background:rgba(10,6,16,.65);color:var(--glow);width:36px;height:36px;border-radius:10px;cursor:pointer;display:grid;place-items:center;z-index:15;}.nf-actions{display:flex;gap:12px;align-items:center;padding:14px 18px 14px 64px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0)); overflow-x: auto; white-space: nowrap;}.nf-actions::-webkit-scrollbar { height: 4px; }.nf-actions::-webkit-scrollbar-thumb { background: var(--glow-faint); border-radius: 4px; }.nf-btn{padding:10px 14px;border-radius:12px;border:1px solid var(--glow);background:var(--glow-med);color:var(--text-on-accent);font-size:13px;font-weight:800;cursor:pointer;transition:transform .2s,box-shadow .2s,background .2s}.nf-btn:hover{background:var(--glow);color:#0b0713;box-shadow:var(--elev);transform:translateY(-1px)}.nf-chip{padding:8px 12px;border-radius:12px;font-size:12px;border:1px solid var(--glow-faint);background:rgba(255,255,255,.05);color:var(--text-normal);cursor:pointer;white-space:nowrap}.nf-chip:hover{border-color:var(--glow);color:var(--glow)}.panel-img-box{position:relative;width:100%;background:#050505}.nf-modal-media{position:relative;width:100%;aspect-ratio:16/9;--pad:clamp(16px,3vw,32px)}.nf-safe{position:absolute;top:var(--pad);left:var(--pad);right:var(--pad);bottom:var(--pad);border-radius:16px;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)}.nf-slide{position:absolute;inset:0;opacity:0;transition:opacity .28s ease}.nf-slide.active{opacity:1}.nf-slide img,.nf-slide iframe{width:100%;height:100%;object-fit:contain;border:0;background:#000}.nf-dots{position:absolute;bottom:calc(var(--pad) - 2px);left:50%;transform:translateX(-50%);display:flex;gap:8px;pointer-events:none}.nf-dot{width:10px;height:10px;border-radius:50%;background:oklch(from var(--glow) l c h/.28)}.nf-dot.active{background:var(--glow)}.nf-edge{position:absolute;top:0;bottom:0;width:clamp(52px, 15%, 180px);display:flex;align-items:center;justify-content:center;color:var(--glow);cursor:pointer;pointer-events:auto;opacity:0;transition:opacity 0.3s ease, transform 0.3s ease;background:linear-gradient(to right, rgba(0,0,0,.5), transparent);}.nf-left-edge{left:0; background: linear-gradient(to right, rgba(0,0,0,.5), transparent); transform: translateX(-20px);}.nf-right-edge{right:0; background: linear-gradient(to left, rgba(0,0,0,.5), transparent); transform: translateX(20px);}.nf-edge.nav-visible { opacity:1; transform: translateX(0); }.nf-left-edge.hint-active { animation: hint-left 2.5s ease-in-out; }.nf-right-edge.hint-active { animation: hint-right 2.5s ease-in-out; }.nf-edge svg{width:34px;height:34px;}.panel-controls{display:flex;gap:18px;align-items:center;padding:16px 18px;border-top:1px solid rgba(255,255,255,.1)}.panel-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}.panel-title{font-size:20px;font-weight:900;color:rgba(240,230,255,.96);letter-spacing:.25px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nf-transcript{padding:16px 18px 22px 18px;}.nf-callout{border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.04);margin-top:14px;overflow:hidden}.nf-callout-head{all:unset;display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;cursor:pointer}.nf-callout-icon{font-size:16px;color:var(--glow)}.nf-callout-title{font-size:14px;font-weight:900;color:var(--text-normal);letter-spacing:.3px}.nf-callout-body{padding:12px 16px 16px 16px}.nf-callout-body p{margin:0 0 1em 0}.nf-callout-body p:last-child{margin-bottom:0}.nf-callout-body .markdown-embed{max-width:100%;height:auto;border-radius:4px;margin:0.5em 0}.nf-list{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px}.nf-list li{font-size:13.5px;line-height:1.6}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{transform:scale(.965);opacity:0}to{transform:scale(1);opacity:1}}@keyframes hint-left { 0%, 100% { opacity: 0; transform: translateX(-20px); } 20%, 80% { opacity: 1; transform: translateX(0); } }@keyframes hint-right { 0%, 100% { opacity: 0; transform: translateX(20px); } 20%, 80% { opacity: 1; transform: translateX(0); } }`}</style>
                <div className="panel" onClick={(e) => e.stopPropagation()}>
                    <div className="nf-sticky-header">
                        <div style={{ position: "relative" }}>
                            <button
                                className="nf-top-close"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                            <div className="nf-actions">
                                <button
                                    className="nf-btn"
                                    onClick={openAllComponents}
                                    disabled={!details?.comps?.length}
                                >
                                    Open Components
                                    {details?.comps?.length ? ` (${details.comps.length})` : ""}
                                </button>
                                {details?.comps?.map((c, i) => (
                                    <button
                                        key={i}
                                        className="nf-chip"
                                        onClick={() => openWiki(c.path)}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="panel-img-box">
                            <div
                                className="nf-modal-media"
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                            >
                                <div
                                    className="nf-safe"
                                    onMouseEnter={() => setIsPaused(true)}
                                    onMouseLeave={() => {
                                        setIsPaused(false);
                                        setShowNav(false);
                                    }}
                                    onMouseMove={handleMouseMove}
                                >
                                    {len === 0 ? (
                                        <div className="nf-slide active" />
                                    ) : (
                                        <>
                                            {slides.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className={`nf-slide ${i === idx ? "active" : ""}`}
                                                >
                                                    {s.type === "image" ? (
                                                        <img src={s.src} alt="" />
                                                    ) : (
                                                        <iframe
                                                            src={s.src}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            {len > 1 && (
                                                <>
                                                    <div
                                                        className={`nf-edge nf-left-edge ${showNav ? "nav-visible" : ""
                                                            } ${hintActive ? "hint-active" : ""}`}
                                                        onClick={prev}
                                                        aria-label="Previous"
                                                    >
                                                        <svg viewBox="0 0 24 24">
                                                            <polyline points="15 18 9 12 15 6" />
                                                        </svg>
                                                    </div>
                                                    <div
                                                        className={`nf-edge nf-right-edge ${showNav ? "nav-visible" : ""
                                                            } ${hintActive ? "hint-active" : ""}`}
                                                        onClick={next}
                                                        aria-label="Next"
                                                    >
                                                        <svg viewBox="0 0 24 24">
                                                            <polyline points="9 18 15 12 9 6" />
                                                        </svg>
                                                    </div>
                                                    <div className="nf-dots">
                                                        {" "}
                                                        {slides.map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`nf-dot ${i === idx ? "active" : ""
                                                                    }`}
                                                            />
                                                        ))}{" "}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div
                            className="panel-controls"
                            style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}
                        >
                            <div className="panel-info">
                                <div className="panel-title">{details?.title || "Entry"}</div>
                            </div>
                        </div>
                    </div>
                    <div className="nf-transcript">
                        {details?.description ? (
                            <div className="nf-callout open">
                                <div className="nf-callout-head" style={{ cursor: "default" }}>
                                    <span className="nf-callout-icon">ℹ️</span>
                                    <span className="nf-callout-title">Overview</span>
                                </div>
                                <div
                                    className="nf-callout-body"
                                    dangerouslySetInnerHTML={{ __html: details.description }}
                                />
                            </div>
                        ) : null}
                        {details?.doesBlock?.length ? (
                            <div className="nf-callout">
                                <button
                                    className="nf-callout-head"
                                    onClick={(e) => {
                                        const b = e.currentTarget.nextElementSibling;
                                        b.style.display =
                                            b.style.display === "none" ? "block" : "none";
                                    }}
                                >
                                    <span className="nf-callout-icon">▸</span>
                                    <span className="nf-callout-title">Does</span>
                                </button>
                                <div className="nf-callout-body">
                                    <ul className="nf-list">
                                        {details.doesBlock.map((d, i) => (
                                            <li key={i}>{d}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : null}
                        {details?.cantBlock?.length ? (
                            <div className="nf-callout">
                                <button
                                    className="nf-callout-head"
                                    onClick={(e) => {
                                        const b = e.currentTarget.nextElementSibling;
                                        b.style.display =
                                            b.style.display === "none" ? "block" : "none";
                                    }}
                                >
                                    <span className="nf-callout-icon">▸</span>
                                    <span className="nf-callout-title">Can’t</span>
                                </button>
                                <div className="nf-callout-body">
                                    <ul className="nf-list">
                                        {details.cantBlock.map((d, i) => (
                                            <li key={i}>{d}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };
    const DataCore = () => {
        const [categories, setCategories] = useState([]);
        const [heroItems, setHeroItems] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);
        const mountedRef = useRef(true);
        const [modalState, setModalState] = useState({
            open: false,
            comp: null,
            details: null,
            loading: false,
        });

         const parseShowcaseContent = useCallback((markdownContent, basePath) => {
            const lines = markdownContent.split("\n");
            const parsedCategories = [];
            let currentCategory = null;
            const categoryRegex = /^## \*\*(.*)\*\*/;
            const componentLinkRegex = /^###### \[([^\]]+)\]\(([^)]+)\)(.*)/;
            const colorMap = {
                BLACK: "var(--text-muted)",
                RED: "oklch(0.75 0.22 25)",
                BLUE: "oklch(0.75 0.2 250)",
                YELLOW: "oklch(0.85 0.2 90)",
            };
            for (const line of lines) {
                const trimmed = line.trim();
                const categoryMatch = trimmed.match(categoryRegex);
                const componentMatch = trimmed.match(componentLinkRegex);
                if (categoryMatch) {
                    const rawName = categoryMatch[1];
                    const nameParts = rawName.match(/^(BLACK|RED|BLUE|YELLOW)-(.+)/i);
                    let color = "var(--text-normal)";
                    let displayName = rawName;
                    if (nameParts) {
                        color = colorMap[nameParts[1].toUpperCase()] || color;
                        displayName = nameParts[2].trim();
                    }
                    currentCategory = { name: displayName, color: color, components: [] };
                    parsedCategories.push(currentCategory);
                } else if (componentMatch && currentCategory) {
                    const name = componentMatch[1];
                    const path = decodeURIComponent(componentMatch[2]);
                    const tagsRaw = componentMatch[3] || "";
                    
                    const hasNewTag = tagsRaw.includes("{ NEW }");
                    const hasPrototypeTag = tagsRaw.includes("{ PROTOTYPE }"); // New tag check
                    const hasFeaturedTag =
                        tagsRaw.includes("{ FEATURE }") || tagsRaw.includes("{ FEATURED }");
                    
                    currentCategory.components.push({
                        name: name.replace(/ { ?(NEW|FEATURED?|PROTOTYPE) ?}/g, "").trim(),
                        path: `${basePath}/${path}`,
                        isNew: hasNewTag,
                        isPrototype: hasPrototypeTag, // New property
                        isFeatured: hasFeaturedTag,
                    });
                }
            }
            return parsedCategories;
        }, []);
        const fetchAndCacheComponentMedia = useCallback(async (componentPath) => {
            if (componentMediaCache.current[componentPath])
                return componentMediaCache.current[componentPath];
            try {
                const file = dc.app.vault.getAbstractFileByPath(componentPath);
                if (!file) return null;
                const content = await dc.app.vault.read(file);
                const imageRegexG = /!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
                const images = [];
                let m;
                while ((m = imageRegexG.exec(content)) !== null) {
                    const candidate = m[1] || m[2];
                    if (candidate) images.push(candidate);
                }
                const imgPaths = [];
                for (const raw of images) {
                    const p = await getMediaResourcePath(raw);
                    if (p) imgPaths.push(p);
                }
                const details = { imageSrcs: imgPaths };
                componentMediaCache.current[componentPath] = details;
                return details;
            } catch (e) {
                return null;
            }
        }, []);

        const extractEntryData = useCallback(
            async (componentPath) => {
                const file = dc.app.vault.getAbstractFileByPath(componentPath);
                if (!file) return null;

                const content = await dc.app.vault.read(file);
                const titleMatch = content.match(/^###\s*Tab:\s*(.+)$/m);
                const title = titleMatch
                    ? titleMatch[1].trim()
                    : content.match(/^#\s*(.+)$/m)?.[1]?.trim() || "Entry";

                const descMatch = content.match(
                    /-\s*\*\*Description\*\*:\s*([\s\S]*?)(?:\n-{2,}|(?:\n-\s*\*\*)|(?:\n###)|$)/i
                );
                const rawDescription = descMatch ? descMatch[1].trim() : "";
                const description = await ContentRenderer.renderMarkdown(
                    rawDescription
                );

                const doesBlock = (() => {
                    const m = content.match(/-\s*\*\*Does\*\*:\s*\n((?:\s*-\s.*\n?)+)/i);
                    if (!m) return [];
                    return m[1]
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => s.replace(/^-+\s*/, ""));
                })();
                const cantBlock = (() => {
                    const m = content.match(
                        /-\s*\*\*(?:Can(?:'|’)?t)\*\*:\s*\n((?:\s*-\s.*\n?)+)/i
                    );
                    if (!m) return [];
                    return m[1]
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => s.replace(/^-+\s*/, ""));
                })();
                const comps = [];
                const compRegex = /^###### \[([^\]]+)\]\(([^)]+)\)/gm;
                let c;
                while ((c = compRegex.exec(content)) !== null) {
                    comps.push({ name: c[1].trim(), path: decodeURIComponent(c[2]) });
                }
                const media = await fetchAndCacheComponentMedia(componentPath);
                const slides = [];
                if (media?.imageSrcs?.length) {
                    for (const src of media.imageSrcs)
                        slides.push({ type: "image", src });
                }
                const youtubeRegex =
                    /<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([^"]+)"[^>]*>.*?<\/iframe>/i;
                const iframeRegex = /<iframe[^>]*src="([^"]+)"[^>]*>.*?<\/iframe>/i;
                const yMatch = content.match(youtubeRegex);
                const iMatch = content.match(iframeRegex);
                if (yMatch?.[1]) {
                    slides.push({
                        type: "iframe",
                        src: `https://www.youtube.com/embed/${yMatch[1]}?autoplay=0&mute=0`,
                    });
                } else if (iMatch?.[1]) {
                    slides.push({ type: "iframe", src: iMatch[1] });
                }
                return {
                    title,
                    description,
                    doesBlock,
                    cantBlock,
                    comps,
                    slides,
                    rawContent: content,
                };
            },
            [fetchAndCacheComponentMedia]
        );

        useEffect(() => {
            mountedRef.current = true;
            const run = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const showcasePath = "_RESOURCES/DATACORE/DATACORE.showcase.md";
                    const file = dc.app.vault.getAbstractFileByPath(showcasePath);
                    if (!file)
                        throw new Error(`Showcase file not found at: "${showcasePath}"`);
                    const basePath = showcasePath.substring(
                        0,
                        showcasePath.lastIndexOf("/")
                    );
                    const content = await dc.app.vault.read(file);
                    const parsedCategories = parseShowcaseContent(content, basePath);
                    const allComponents = parsedCategories.flatMap((c) => c.components);
                    const featured = allComponents.filter((c) => c.isFeatured);
                    const itemsForHero = featured.length > 0 ? featured : allComponents;
                    const itemsToPreload = itemsForHero.slice(0, 10);
                    await Promise.all(
                        itemsToPreload.map((comp) => fetchAndCacheComponentMedia(comp.path))
                    );
                    if (mountedRef.current) {
                        setCategories(parsedCategories);
                        setHeroItems(itemsForHero);
                        setIsLoading(false);
                        setIsSyncing(false);
                    }
                } catch (e) {
                    if (mountedRef.current) {
                        setError(e.message);
                        setIsLoading(false);
                    }
                }
            };
            run();
            return () => {
                mountedRef.current = false;
            };
        }, [parseShowcaseContent, fetchAndCacheComponentMedia, setIsSyncing]);
        const onOpenModal = useCallback(
            async (comp) => {
                setModalState((s) => ({
                    ...s,
                    open: true,
                    comp,
                    details: null,
                    loading: true,
                }));
                const details = await extractEntryData(comp.path);
                if (mountedRef.current) {
                    setModalState((s) => ({ ...s, details, loading: false }));
                }
            },
            [extractEntryData]
        );
        const onCloseModal = useCallback(() => {
            setModalState({ open: false, comp: null, details: null, loading: false });
        }, []);
        const HeroCarousel = ({ items, onOpenModal }) => {
            const [idx, setIdx] = useState(0);
            const [isPaused, setIsPaused] = useState(false);
            const [isHovered, setIsHovered] = useState(false);
            const len = items.length;
            useEffect(() => {
                if (!isPaused && len > 1) {
                    const intervalId = setInterval(
                        () => setIdx((i) => (i + 1) % len),
                        8000
                    );
                    return () => clearInterval(intervalId);
                }
            }, [isPaused, len, idx]);
            const advance = (dir) => setIdx((i) => (i + dir + len) % len);
            const prev = (e) => {
                e.stopPropagation();
                advance(-1);
            };
            const next = (e) => {
                e.stopPropagation();
                advance(1);
            };
            if (len === 0) {
                return (
                    <div className="nf-hero">
                        <div className="nf-hero-media">
                            <div className="nf-skel" />
                        </div>
                        <div className="nf-hero-grad" />
                        <div className="nf-hero-content">
                            <div className="nf-hero-title">Datacore Components</div>
                        </div>
                    </div>
                );
            }
            const activeItem = items[idx];
            return (
                <div
                    className="nf-hero"
                    onMouseEnter={() => {
                        setIsPaused(true);
                        setIsHovered(true);
                    }}
                    onMouseLeave={() => {
                        setIsPaused(false);
                        setIsHovered(false);
                    }}
                    onClick={() => onOpenModal(activeItem)}
                >
                    <div className="nf-hero-media">
                        {items.map((item, i) => {
                            const media = componentMediaCache.current[item.path];
                            const isActive = i === idx;
                            return (
                                <div
                                    key={item.path}
                                    className={`nf-hero-slide ${isActive ? "active" : ""}`}
                                >
                                    {media?.imageSrcs?.[0] ? (
                                        <img src={media.imageSrcs[0]} alt={item.name} />
                                    ) : (
                                        <div className="nf-skel" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="nf-hero-grad" />
                    <div
                        key={activeItem.path}
                        className="nf-hero-content anim-fade-in-now"
                    >
                        <div className="nf-hero-title">{activeItem.name}</div>
                    </div>
                    {len > 1 && (
                        <>
                            <button
                                className={`nf-row-edge nf-row-left-edge ${isHovered ? "nav-visible" : ""
                                    }`}
                                onClick={prev}
                                aria-label="Previous"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <button
                                className={`nf-row-edge nf-row-right-edge ${isHovered ? "nav-visible" : ""
                                    }`}
                                onClick={next}
                                aria-label="Next"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                            <div className="nf-hero-dots">
                                {items.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`nf-dot ${i === idx ? "active" : ""}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            );
        };
        const NFCard = ({ comp, onOpenModal }) => {
            const cardRef = useRef(null);
            const [media, setMedia] = useState(
                componentMediaCache.current[comp.path]
            );
            useEffect(() => {
                const node = cardRef.current;
                if (!node) return;
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            observer.disconnect();
                            fetchAndCacheComponentMedia(comp.path).then((fetchedMedia) => {
                                if (mountedRef.current) setMedia(fetchedMedia);
                            });
                        }
                    },
                    { threshold: 0.1 }
                );
                observer.observe(node);
                return () => observer.disconnect();
            }, [comp.path]);

            // Dynamically build class names for multiple tags
            const cardClasses = ['nf-card'];
            if (comp.isNew) cardClasses.push('nf-badge-new');
            if (comp.isPrototype) cardClasses.push('nf-badge-prototype');

            return (
                <div
                    ref={cardRef}
                    className={cardClasses.join(' ')}
                    onClick={() => onOpenModal(comp)}
                    role="button"
                    tabIndex={0}
                >
                    <div className="nf-card-media">
                        {media?.imageSrcs?.[0] ? (
                            <img
                                key={media.imageSrcs[0]}
                                src={media.imageSrcs[0]}
                                alt={comp.name}
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <div className="nf-skel" />
                        )}
                    </div>
                    <div className="nf-card-overlay">
                        <div className="nf-card-title">{comp.name}</div>
                    </div>
                </div>
            );
        };
        const Row = ({ title, color, items }) => {
            const scrollerRef = useRef(null);
            const [atStart, setAtStart] = useState(true);
            const [atEnd, setAtEnd] = useState(false);
            const [isHovered, setIsHovered] = useState(false);
            const updateArrows = useCallback(() => {
                const el = scrollerRef.current;
                if (!el) return;
                const s = el.scrollLeft;
                const max = el.scrollWidth - el.clientWidth;
                setAtStart(s <= 1);
                setAtEnd(s >= max - 1);
            }, []);
            const scrollByAmount = (dir) => {
                const el = scrollerRef.current;
                if (!el) return;
                const amount = Math.floor(el.clientWidth * 0.85);
                el.scrollBy({ left: dir * amount, behavior: "smooth" });
            };
            useEffect(() => {
                const el = scrollerRef.current;
                if (!el) return;
                const onScroll = () => updateArrows();
                el.addEventListener("scroll", onScroll, { passive: true });
                const ro = new ResizeObserver(updateArrows);
                ro.observe(el);
                updateArrows();
                return () => {
                    el.removeEventListener("scroll", onScroll);
                    ro.disconnect();
                };
            }, [updateArrows]);
            const sortedItems = useMemo(() => {
                return [...items].sort((a, b) => b.isNew - a.isNew);
            }, [items]);
            return (
                <div className="nf-row">
                    <div className="nf-row-header">
                        <h3 className="nf-row-title" style={{ color }}>
                            {title}
                        </h3>
                    </div>
                    <div
                        className="nf-row-body"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {!atStart && (
                            <button
                                className={`nf-row-edge nf-row-left-edge ${isHovered ? "nav-visible" : ""
                                    }`}
                                onClick={() => scrollByAmount(-1)}
                                aria-label="Scroll left"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                        )}
                        <div className="nf-scroller" ref={scrollerRef}>
                            {sortedItems.map((comp) => (
                                <NFCard key={comp.path} comp={comp} onOpenModal={onOpenModal} />
                            ))}
                        </div>
                        {!atEnd && (
                            <button
                                className={`nf-row-edge nf-row-right-edge ${isHovered ? "nav-visible" : ""
                                    }`}
                                onClick={() => scrollByAmount(1)}
                                aria-label="Scroll right"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            );
        };
       const CSS_NF = `.${uniqueWrapperClass} .nf-root{width:100%;max-width:1280px;display:flex;flex-direction:column;gap:28px}.${uniqueWrapperClass} .nf-hero{position:relative;width:100%;height:clamp(260px,40vw,520px);border-radius:12px;overflow:hidden;border:1px solid var(--glow-faint);background:#0d0d0d; cursor: pointer;}.${uniqueWrapperClass} .nf-hero-media{position:absolute;inset:0; background: #000;}.${uniqueWrapperClass} .nf-hero-media img{width:100%;height:100%;object-fit:contain;border:0}.${uniqueWrapperClass} .nf-hero-slide{position:absolute;inset:0;opacity:0;transition:opacity .4s ease-in-out;}.${uniqueWrapperClass} .nf-hero-slide.active{opacity:1;}.${uniqueWrapperClass} .nf-hero-grad{position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.9) 100%), linear-gradient(to top, rgba(13,13,13,0.5) 0%, transparent 30%); pointer-events:none;}.${uniqueWrapperClass} .nf-hero-content{position:absolute;left:clamp(16px,4vw,40px);bottom:clamp(16px,4vw,40px);display:flex;flex-direction:column;gap:12px;max-width:min(70%,820px);z-index:2; pointer-events: none;}.${uniqueWrapperClass} .nf-hero-title{font-size:clamp(24px,4.5vw,48px);font-weight:900;letter-spacing:.5px;color:var(--glow); text-shadow: 0 0 12px rgba(0,0,0,0.8);}.${uniqueWrapperClass} .nf-hero-dots{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:3;display:flex;gap:8px; pointer-events: none;}.${uniqueWrapperClass} .nf-dot{width:10px;height:10px;border-radius:50%;background:oklch(from var(--glow) l c h/.28);transition:background .3s ease;}.${uniqueWrapperClass} .nf-dot.active{background:var(--glow)}.${uniqueWrapperClass} .nf-row{position:relative;width:100%}.${uniqueWrapperClass} .nf-row-header{padding:0 4px 8px 4px}.${uniqueWrapperClass} .nf-row-title{font-size:18px;font-weight:800;color:var(--text-normal);margin:0; font-variant: small-caps; letter-spacing: 0.5px;}.${uniqueWrapperClass} .nf-row-body{position:relative}.${uniqueWrapperClass} .nf-scroller{display:flex;gap:10px;overflow-x:auto;scroll-behavior:smooth;padding:4px 0 12px 0;scrollbar-width:none}.${uniqueWrapperClass} .nf-scroller::-webkit-scrollbar{display:none}.${uniqueWrapperClass} .nf-row-edge{position:absolute;top:0;bottom:0;height:100%;width:clamp(52px,15%,180px);z-index:5;color:var(--glow);cursor:pointer;border:none;padding:0;display:flex;align-items:center;justify-content:center;background:transparent;opacity:0;transition:opacity .3s ease,transform .3s ease}.${uniqueWrapperClass} .nf-row-edge svg{width:34px;height:34px;pointer-events:none}.${uniqueWrapperClass} .nf-row-left-edge{left:0;height:100%;background:linear-gradient(to right,rgba(0,0,0,0.5),transparent);transform:translateX(-20px)}.${uniqueWrapperClass} .nf-row-right-edge{right:0;height:100%;background:linear-gradient(to left,rgba(0,0,0,0.5),transparent);transform:translateX(20px)}.${uniqueWrapperClass} .nf-row-edge.nav-visible{opacity:1;transform:translateX(0)}.${uniqueWrapperClass} .nf-card{position:relative;flex:0 0 clamp(160px,22vw,240px);aspect-ratio:16/9;border-radius:8px;overflow:hidden;border:1px solid var(--glow-faint);background:#000;cursor:pointer;transform-origin:center;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.${uniqueWrapperClass} .nf-card:hover{transform:scale(1.07);border-color:var(--glow);box-shadow:0 20px 60px rgba(0,0,0,.5);z-index:2}.${uniqueWrapperClass} .nf-card-media{position:absolute;inset:0}.${uniqueWrapperClass} .nf-card-media img, .${uniqueWrapperClass} .nf-card-media video{width:100%;height:100%;object-fit:contain;}.${uniqueWrapperClass} .nf-card-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.8) 100%);opacity:0;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;padding:10px;transition:opacity .2s ease}.${uniqueWrapperClass} .nf-card:hover .nf-card-overlay{opacity:1}.${uniqueWrapperClass} .nf-card-title{font-size:12px;color:#fff;font-weight:700;letter-spacing:.2px}.${uniqueWrapperClass} .nf-badge-new::after{content:"NEW";position:absolute;top:8px;right:8px;background:var(--glow);color:#0b0713;font-size:10px;font-weight:900;padding:3px 7px;border-radius:4px;z-index:2;}.${uniqueWrapperClass} .nf-badge-prototype::after{content:"PROTOTYPE";position:absolute;top:8px;left:8px;background:oklch(0.88 0.22 288);;color:#0b0713;font-size:10px;font-weight:900;padding:3px 7px;border-radius:4px;z-index:2;}.${uniqueWrapperClass} .nf-skel{width:100%;height:100%;background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.12) 37%,rgba(255,255,255,0.06) 63%);background-size:400% 100%;animation:nf-shimmer 1.2s ease-in-out infinite}@keyframes nf-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}`;
       
       
        if (isLoading)
            return <div style={STYLES.tile}>Loading Datacore Showcase...</div>;
        if (error) return <div style={STYLES.tile}>Error: {error}</div>;
        return (
            <div className="nf-root" style={{ width: "100%" }}>
                <style>{CSS_NF}</style>
                <HeroCarousel items={heroItems} onOpenModal={onOpenModal} />
                {categories.map((cat) => (
                    <Row
                        key={cat.name}
                        title={cat.name}
                        color={cat.color}
                        items={cat.components}
                    />
                ))}
                <NFModal state={modalState} onClose={onCloseModal} />
            </div>
        );
    };

    const memoizedSectionContent = useMemo(() => {
        switch (section) {
            case "home":
                return <Home setSection={setSection} />;
            case "docs":
                return <IntegratedDevelopmentSuite />;
            case "datacore":
                return <DataCore setIsSyncing={setIsSyncing} />;
            case "assets":
                return <Assets />;
            case "devlog":
                return <DevLog setIsSyncing={setIsSyncing} />;
            default:
                return null;
        }
    }, [section]);

    useEffect(() => {
        const c = containerRef.current;
        if (!c) return;
        const resetToStandby = () => {
            if (!stateRefs.originalParent) return;
            c.removeAttribute("style");
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(c, stateRefs.placeholder);
            } else {
                stateRefs.originalParent.appendChild(c);
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.originalInlinePosition || "";
            }
            Object.keys(stateRefs).forEach((k) => delete stateRefs[k]);
        };
        if (displayMode === "welcome" || displayMode === "full") {
            if (!stateRefs.originalParent) {
                if (!c.parentNode) {
                    setTimeout(() => setDisplayMode(displayMode), 50);
                    return;
                }
                stateRefs.originalParent = c.parentNode;
                stateRefs.placeholder = document.createElement("div");
                c.parentNode.insertBefore(stateRefs.placeholder, c);
            }
            if (displayMode === "welcome") {
                if (c.parentNode !== document.body) document.body.appendChild(c);
                Object.assign(c.style, {
                    position: "fixed",
                    inset: "0px",
                    zIndex: "99999",
                    overflow: "hidden",
                });
            } else {
                const t = findNearestAncestorWithClass(c, "workspace-leaf-content");
                if (!t) {
                    setDisplayMode("standby");
                    return;
                }
                const w = findDirectChildByClass(t, "view-content") || t;
                const p = window.getComputedStyle(w).position;
                if (!stateRefs.parentPositionInfo) {
                    stateRefs.parentPositionInfo = {
                        element: w,
                        originalInlinePosition: w.style.position,
                    };
                }
                if (p === "static") w.style.position = "relative";
                if (c.parentNode !== w) w.appendChild(c);
                Object.assign(c.style, {
                    position: "absolute",
                    inset: "0px",
                    zIndex: "9998",
                    overflow: "hidden",
                });
            }
        } else {
            resetToStandby();
        }
        return () => {
            resetToStandby();
        };
    }, [displayMode]);
    function TOSScreen({ onAgree }) {
        const obsidianApp =
            typeof dc !== "undefined" && dc.app
                ? dc.app
                : typeof app !== "undefined"
                    ? app
                    : null;
        const targetFileNameOnly = "TERMS OF SERVICE.approval.md";
        const taskQueryString = `@task and ($file = "${targetFileNameOnly}" or $file.contains("/${targetFileNameOnly}"))`;
        const queryResult = dc.useQuery(taskQueryString);
        const tasks = Array.isArray(queryResult) ? queryResult : [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t && t.$completed).length;
        const allDone = totalTasks > 0 && completedTasks === totalTasks;
        const [isIframeLoaded, setIsIframeLoaded] = useState(false);
        const [iframeRefreshKey, setIframeRefreshKey] = useState(0);
        const handleIframeLoad = () => setIsIframeLoaded(true);
        const handleRefreshIframe = () => {
            setIsIframeLoaded(false);
            setIframeRefreshKey((k) => k + 1);
        };
        const handleToggleTask = async (task) => {
            if (!isIframeLoaded) {
                if (typeof Notice === "function")
                    new Notice("Please wait for the terms to load.", 2500);
                return;
            }
            if (
                !obsidianApp?.vault?.read ||
                !obsidianApp?.vault?.modify ||
                !obsidianApp?.vault?.getAbstractFileByPath
            ) {
                if (typeof Notice === "function")
                    new Notice("Cannot update task: Obsidian APIs not available.", 4000);
                return;
            }
            const filePath = task.$file;
            const lineNumber = task.$line;
            if (typeof filePath !== "string" || typeof lineNumber !== "number") {
                if (typeof Notice === "function")
                    new Notice("Task data incomplete.", 3000);
                return;
            }
            const file = obsidianApp.vault.getAbstractFileByPath(filePath);
            if (!file) {
                if (typeof Notice === "function")
                    new Notice(`File not found: ${filePath}`, 4000);
                return;
            }
            try {
                const content = await obsidianApp.vault.read(file);
                const lines = content.split("\n");
                if (lineNumber < 0 || lineNumber >= lines.length) {
                    if (typeof Notice === "function")
                        new Notice("Task line out of sync; refresh.", 3000);
                    return;
                }
                const rx = /^(\s*-\s*\[)([^\]])(\]\s*.*)$/;
                const m = lines[lineNumber].match(rx);
                if (!m) {
                    if (typeof Notice === "function")
                        new Notice("Line format not a markdown task.", 3000);
                    return;
                }
                const newStatus = m[2] === " " || m[2] === "?" ? "x" : " ";
                lines[lineNumber] = `${m[1]}${newStatus}${m[3]}`;
                await obsidianApp.vault.modify(file, lines.join("\n"));
            } catch (e) {
                console.error(e);
                if (typeof Notice === "function")
                    new Notice(`Error updating task: ${e.message}`, 4000);
            }
        };
        return (
            <div style={{ ...STYLES.shell }}>
                <MatrixRain
                    mainColor="oklch(0.75 0.01 100)"
                    leadColor="oklch(0.98 0.01 100)"
                    frequency={0.9}

                />
                <div className="fx-stage">
                    <div className="fx-grid"></div>
                    <div className="fx-scanlines"></div>
                    <div className="fx-vignette"></div>
                </div>
                {/* --- MODIFICATION START: Removed the veil --- */}
                {/* <div style={STYLES.veil} /> */}
                {/* --- MODIFICATION END --- */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        height: "100%",
                        width: "100%",
                        display: "grid",
                        placeItems: "center",
                        padding: "24px",
                    }}
                >
                    <div
                        style={{
                            width: "min(100%, 960px)",
                            border: "1px solid var(--glow-faint)",
                            background: "rgba(16,10,24,0.82)",
                            boxShadow: "0 30px 120px rgba(0,0,0,.55)",
                            borderRadius: "16px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                padding: "16px 18px",
                                borderBottom: "1px solid var(--glow-faint)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <h2
                                className="headline glitch-text"
                                data-text="Authorization Required"
                                style={{ ...STYLES.h1, margin: 0, fontSize: "20px" }}
                            >
                                Terms of Service
                            </h2>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                {isIframeLoaded
                                    ? "Review and check all items to proceed"
                                    : "Loading…"}
                            </span>
                        </div>
                        <div style={{ position: "relative", background: "#0b0713" }}>
                            <div
                                style={{
                                    maxHeight: "55vh",
                                    minHeight: "280px",
                                    overflow: "hidden",
                                    padding: "18px 18px 6px 18px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "515px",
                                        minHeight: "250px",
                                        border: "1px solid var(--glow-faint)",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        position: "relative",
                                    }}
                                >
                                    <button
                                        onClick={handleRefreshIframe}
                                        title="Refresh"
                                        style={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            zIndex: 2,
                                            background: "rgba(10,6,16,0.6)",
                                            color: "var(--glow)",
                                            border: "1px solid var(--glow)",
                                            borderRadius: 6,
                                            padding: "6px 10px",
                                            cursor: "pointer",
                                            fontSize: 12,
                                        }}
                                    >
                                        ↻
                                    </button>
                                    <iframe
                                        key={iframeRefreshKey}
                                        src="https://www.beto.group/terms_of_service"
                                        style={{ width: "100%", height: "100%", border: "none" }}
                                        title="Terms of Service"
                                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                        onLoad={handleIframeLoad}
                                    />
                                </div>
                                {!isIframeLoaded && (
                                    <p
                                        style={{
                                            textAlign: "center",
                                            color: "orange",
                                            fontStyle: "italic",
                                            margin: "10px 0 0",
                                        }}
                                    >
                                        Loading terms… Please wait to interact with tasks.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div
                            style={{
                                padding: "10px 18px 0 18px",
                                maxHeight: "28vh",
                                overflowY: "auto",
                            }}
                        >
                            {totalTasks > 0 ? (
                                <ul
                                    style={{
                                        listStyle: "none",
                                        padding: 0,
                                        margin: 0,
                                        opacity: isIframeLoaded ? 1 : 0.7,
                                    }}
                                >
                                    {[...tasks]
                                        .sort((a, b) => {
                                            const ta = a?.$ctime
                                                ? new Date(a.$ctime).getTime()
                                                : Infinity;
                                            const tb = b?.$ctime
                                                ? new Date(b.$ctime).getTime()
                                                : Infinity;
                                            return ta - tb;
                                        })
                                        .map((t, i) => {
                                            const key = t.$id || `${t.$file}:${t.$line}:${i}`;
                                            const isChecked = !!t.$completed;
                                            return (
                                                <li
                                                    key={key}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        padding: "8px 10px",
                                                        marginBottom: "8px",
                                                        border: `1px solid var(--glow-faint)`,
                                                        borderLeft: `4px solid ${isChecked
                                                            ? "oklch(0.8 0.2 300)"
                                                            : "rgba(255,255,255,.25)"
                                                            }`,
                                                        borderRadius: "6px",
                                                        background: "rgba(16,10,24,0.74)",
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        disabled={!isIframeLoaded}
                                                        onChange={() => handleToggleTask(t)}
                                                        style={{
                                                            transform: "scale(1.2)",
                                                            cursor: isIframeLoaded
                                                                ? "pointer"
                                                                : "not-allowed",
                                                        }}
                                                        title={
                                                            isIframeLoaded
                                                                ? "Toggle"
                                                                : "Wait for terms to load"
                                                        }
                                                    />
                                                    <div
                                                        style={{
                                                            color: isChecked
                                                                ? "var(--text-muted)"
                                                                : "var(--text-normal)",
                                                        }}
                                                    >
                                                        {t.$text}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                </ul>
                            ) : (
                                <p
                                    style={{
                                        color: "var(--text-muted)",
                                        fontStyle: "italic",
                                        margin: 0,
                                    }}
                                >
                                    No tasks found in “{targetFileNameOnly}”. Make sure that file
                                    exists and contains markdown tasks like{" "}
                                    <code>- [ ] I agree</code>.
                                </p>
                            )}
                        </div>
                        <div
                            style={{
                                padding: "14px 18px",
                                borderTop: "1px solid var(--glow-faint)",
                                display: "flex",
                                gap: "10px",
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                className="btn"
                                style={{
                                    ...STYLES.btn,
                                    background: "rgba(10,6,16,0.4)",
                                    color: "var(--glow)",
                                }}
                                onClick={() => {
                                    const u = "https://www.beto.group/terms_of_service";
                                    const w = window.open(u, "_blank", "noopener,noreferrer");
                                    if (!w) navigator.clipboard?.writeText(u);
                                }}
                            >
                                [ Open Full Page ]
                            </button>
                            <button
                                className="btn"
                                style={{
                                    ...STYLES.btn,
                                    opacity: allDone ? 1 : 0.6,
                                    cursor: allDone ? "pointer" : "not-allowed",
                                }}
                                disabled={!allDone}
                                onClick={() => {
                                    if (allDone) onAgree();
                                }}
                                title={allDone ? "Proceed" : "Check all items above to proceed"}
                            >
                                [ I Agree & Continue ]
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    const WelcomeScreen = ({ onContinue }) => {
        useEffect(() => {
            const handle = () => onContinue();
            window.addEventListener("keydown", handle, { once: true });
            window.addEventListener("click", handle, { once: true });
            return () => {
                window.removeEventListener("keydown", handle);
                window.removeEventListener("click", handle);
            };
        }, [onContinue]);
        const reduce = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        )?.matches;
        return (
            <div style={{ ...STYLES.shell, cursor: "pointer" }}>
                {!reduce && (
                    <MatrixRain
                        mainColor="oklch(0.75 0.01 100)"
                        leadColor="oklch(0.98 0.01 100)"
                        spacingFactor={32}
                        frequency={0.9}
                    />
                )}
                <div className="fx-stage">
                    <div className="fx-grid"></div>
                    <div className="fx-scanlines"></div>
                    <div className="fx-vignette"></div>
                </div>
                {/* --- MODIFICATION START: Removed the veil --- */}
                {/* <div style={STYLES.veil} /> */}
                {/* --- MODIFICATION END --- */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Header />
                    {/* --- FIX: The rogue MatrixRain component that was here has been removed --- */}
                    <div
                        style={{
                            fontSize: "14px",
                            color: "var(--text-muted)",
                            marginTop: "24px",
                            animation: reduce ? undefined : "pulse 2s infinite",
                        }}
                    >
                        [ PROCEED AT YOUR OWN RISK 🫡 ]
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (displayMode) {
            case "welcome":
                if (welcomeStep === "intro") {
                    return (
                        <WelcomeScreen
                            onContinue={async () => {
                                const ok = await isTosApproved();
                                if (ok) {
                                    beginFullTransition();
                                } else {
                                    setWelcomeStep("tos");
                                }
                            }}
                        />
                    );
                }
                if (welcomeStep === "tos") {
                    return (
                        <TOSScreen
                            onAgree={async () => {
                                await writeTosApproval();
                                beginFullTransition();
                            }}
                        />
                    );
                }
            case "full":
                return (
                    <div className="anim-boot-in" style={{ ...STYLES.shell }}>
                        <MatrixRain frequency={0.01} spacingFactor={64} />
                        <div
                            ref={contentLayerRef}
                            className="anim-fade-in-now"
                            style={{ ...STYLES.contentLayer }}
                        >
                            <Header />
                            <div
                                key={section}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                {memoizedSectionContent}
                            </div>
                        </div>
                        {showWelcomeOverlay && <WelcomeCover />}
                        <div
                            className="icon-hotspot"
                            title="Exit Full Tab"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDisplayMode("standby");
                            }}
                        >
                            <span className="icon">[ X ]</span>
                        </div>
                    </div>
                );
            case "standby":
            default:
                return (
                    <div
                        style={{
                            padding: "16px",
                            border: "1px solid var(--glow-faint)",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                            background: "rgba(10,6,16,0.8)",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                color: "var(--text-muted)",
                                fontSize: "14px",
                            }}
                        >
              // System in standby mode.
                        </p>
                        <button
                            className="btn"
                            style={STYLES.btn}
                            onClick={() => setDisplayMode("full")}
                        >
                            INITIATE FULL UI
                        </button>
                    </div>
                );
        }
    };

    return (
        <div
            ref={containerRef}
            className={uniqueWrapperClass}
            style={STYLES.wrapper}
        >
            <style>{CSS}</style>
            <LoadingIndicator isSyncing={isSyncing} />
            {renderContent()}
            {globalVideoPlayer.isVisible && (
                <GlobalVideoPlayer
                    media={globalVideoPlayer.media}
                    onClose={() =>
                        setGlobalVideoPlayer({ media: null, isVisible: false })
                    }
                />
            )}
        </div>
    );
}






// STYLES and generateCSS function remain unchanged
const STYLES = {
    wrapper: {
        position: "relative",
        height: "100%",
        width: "100%",
        fontFamily:
            "ui-monospace, 'JetBrains Mono', 'Fira Code', SFMono-Regular, Menlo, monospace",
    },
    shell: {
        position: "relative",
        height: "100%",
        width: "100%",
        background: "transparent",
        color: "var(--text-normal)",
        overflow: "hidden",
    },
    contentLayer: {
        position: "relative",
        zIndex: 3,
        width: "100%",
        height: "100%",
        padding: "24px",
        paddingTop: "clamp(2rem, 8vh, 6rem)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "64px",
        overflowY: "auto",
    },
    veil: {
        position: "absolute",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        background:
            "radial-gradient(1200px 700px at 50% -10%, rgba(6,4,10,0.58), rgba(6,4,10,0.40) 35%, rgba(6,4,10,0.62) 100%)",
    },
    h1: { fontSize: "33px", fontWeight: 800, letterSpacing: "1.5px", margin: 0 },
    h2: { fontSize: "16px", fontWeight: 700, margin: 0 },
    sub: {
        fontSize: "13px",
        color: "var(--text-muted)",
        margin: 0,
        textAlign: "center",
        maxWidth: "760px",
        fontStyle: "italic",
        whiteSpace: "nowrap",
        overflow: "hidden",
        borderRight: "2px solid var(--glow-faint)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        width: "100%",
        maxWidth: "1280px",
        justifyContent: "center",
    },
    card: {
        position: "relative",
        borderRadius: "8px",
        border: "1px solid var(--glow-faint)",
        background: "rgba(16,10,24,0.74)",
        backdropFilter: "blur(4px)",
        cursor: "pointer",
        boxShadow: "0 12px 50px rgba(0,0,0,.45)",
        overflow: "hidden",
        height: "160px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        willChange: "transform",
    },
    pillbar: {
        display: "inline-flex",
        gap: "4px",
        border: "1px solid var(--glow-faint)",
        padding: "4px",
        borderRadius: "8px",
        background: "rgba(10,6,16,0.6)",
        backdropFilter: "blur(3px)",
    },
    pill: {
        fontSize: "12px",
        padding: "6px 10px",
        cursor: "pointer",
        userSelect: "none",
        lineHeight: 1,
        whiteSpace: "nowrap",
    },
    btn: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid var(--glow)",
        background: "var(--glow-med)",
        color: "var(--text-on-accent)",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
    },
    tile: {
        padding: "14px",
        borderRadius: "8px",
        border: "1px solid var(--glow-faint)",
        background: "rgba(16,10,24,0.74)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: "0 12px 50px rgba(0,0,0,.45)",
    },
    logEntry: {
        display: "flex",
        alignItems: "baseline",
        gap: "12px",
        padding: "4px 0",
        borderBottom: "1px solid rgba(var(--glow-rgb), 0.1)",
    },
    categoryHeader: {
        fontSize: "20px",
        color: "var(--glow)",
        width: "100%",
        maxWidth: "1280px",
        textAlign: "left",
        borderBottom: "1px solid var(--glow-faint)",
        paddingBottom: "12px",
        marginBottom: "4px",
    },
    homeShowcase: {
        display: "flex",
        width: "100%",
        maxWidth: "1280px",
        height: "100%",
        minHeight: "500px",
        background: "#0D0D0D",
        borderRadius: "12px",
        border: "1px solid var(--glow-faint)",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,.5)",
    },
    showcaseFeatured: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "clamp(1.5rem, 4vw, 3rem)",
    },
    showcaseMedia: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
    },
    showcaseMediaAsset: { width: "100%", height: "100%", objectFit: "cover" },
    showcaseMediaOverlay: {
        position: "absolute",
        inset: 0,
        background:
            "linear-gradient(to top, rgba(13, 13, 13, 0.9) 15%, rgba(13, 13, 13, 0.4) 50%, transparent 80%)",
        zIndex: 1,
    },
    showcaseContent: {
        position: "relative",
        zIndex: 2,
        color: "#FFF",
        maxWidth: "85%",
    },
    showcaseNav: {
        width: "350px",
        background: "rgba(10, 6, 16, 0.5)",
        backdropFilter: "blur(5px)",
        borderLeft: "1px solid var(--glow-faint)",
        display: "flex",
        flexDirection: "column",
    },
    showcaseNavItem: {
        position: "relative",
        display: "flex",
        gap: "12px",
        padding: "16px",
        cursor: "pointer",
        borderBottom: "1px solid var(--glow-faint)",
        borderTop: "1px solid var(--glow-faint)",
        overflow: "hidden",
        background: "rgba(28, 28, 28, 0.2)",
        flexGrow: 1,
        alignItems: "center",
    },
    navItemThumb: {
        width: "100px",
        height: "56px",
        objectFit: "cover",
        borderRadius: "4px",
        filter: "grayscale(50%)",
        transition: "filter 0.3s ease",
    },
    navItemText: {
        flex: 1,
        color: "var(--text-muted)",
        transition: "color 0.3s ease",
    },
    navProgress: {
        position: "absolute",
        bottom: 0,
        left: 0,
        height: "3px",
        background: "var(--glow)",
        width: "0%",
        transformOrigin: "left",
    },
};
const generateCSS = (uniqueWrapperClass) =>
    `.${uniqueWrapperClass}{--glow-raw: 0.95 0.01 100;--glow-accent-purple: oklch(0.8 0.2 300);--glow: oklch(var(--glow-raw));--glow-faint: oklch(from var(--glow) l c h / 28%); --glow-rgb: 180, 100, 255; --glow-med: oklch(from var(--glow) l c h / 16%);--elev: 0 0 24px oklch(from var(--glow) l c h / 22%);--ease-out: cubic-bezier(0.25, 1, 0.5, 1);font-variant: small-caps;}.${uniqueWrapperClass} .fx-stage{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}.${uniqueWrapperClass} .glitch-text {position: relative;display: inline-block;}.${uniqueWrapperClass} .glitch-text::before, .${uniqueWrapperClass} .glitch-text::after {content: attr(data-text);position: absolute;inset: 0;pointer-events: none;color: var(--glow);background: transparent;}.${uniqueWrapperClass} .glitch-text::before {left: 2px;text-shadow: 2px 0 var(--glow-accent-purple);clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);animation: glitch-anim1 3.5s infinite linear alternate-reverse;}.${uniqueWrapperClass} .glitch-text::after {left: -2px;text-shadow: -2px 0 oklch(from var(--glow-accent-purple) l c h / 70%);clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);animation: glitch-anim2 4s infinite linear alternate-reverse;}.${uniqueWrapperClass} .headline{color:var(--glow);animation:textFlicker 5s linear infinite}.${uniqueWrapperClass} .btn:hover{background:var(--glow);color:#0b0713;box-shadow:var(--elev);transform:translateY(-2px)}@keyframes textFlicker {0%,100% { opacity: 1; } 2% { opacity: .85; } 4% { opacity: 1; } 6% { opacity: .55; } 8% { opacity: 1; }}@keyframes glitch-anim1 {0% { clip-path: polygon(0 2%, 100% 2%, 100% 33%, 0 33%); } 50% { clip-path: polygon(0 40%, 100% 40%, 100% 60%, 0 60%); } 100% { clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%); }}@keyframes glitch-anim2 {0% { clip-path: polygon(0 67%, 100% 67%, 100% 90%, 0 90%); } 50% { clip-path: polygon(0 10%, 100% 10%, 100% 28%, 0 28%); } 100% { clip-path: polygon(0 15%, 100% 15%, 100% 33%, 0 33%); }}.${uniqueWrapperClass} .homeShowcase {display: grid;grid-template-columns: minmax(0, 1fr) clamp(280px, 30%, 400px);grid-template-rows: minmax(0, 1fr);width: 100%;max-width: 1280px;height: 500px;border: 1px solid var(--glow-faint);border-radius: 12px;overflow: hidden;gap: 0;}.${uniqueWrapperClass} .showcaseFeatured {min-width: 0;position: relative;overflow: hidden;display: flex;flex-direction: column;justify-content: flex-end;padding: clamp(1.5rem, 4vw, 3rem);}.${uniqueWrapperClass} .showcaseContent > p {transition: opacity 0.3s ease, max-height 0.3s ease, margin 0.3s ease;max-height: 100px;}.${uniqueWrapperClass} .showcaseNav {background: rgba(10, 6, 16, 0.5);backdrop-filter: blur(5px);overflow: hidden; position: relative;touch-action: none; border-left: 1px solid var(--glow-faint); }.${uniqueWrapperClass} .showcaseNav-track {display: flex;flex-direction: column;will-change: transform;}.${uniqueWrapperClass} .showcaseNavItem {position: relative;display: flex;gap: 12px;padding: 16px;cursor: pointer;border-bottom: 1px solid var(--glow-faint);border-top: 1px solid var(--glow-faint);align-items: center;transition: background 0.3s ease;flex-shrink: 0;}.${uniqueWrapperClass} .navItemThumb {width: 100px;height: 56px;object-fit: cover;border-radius: 4px;filter: grayscale(50%);transition: filter 0.3s ease, transform 0.3s ease;flex-shrink: 0;}.${uniqueWrapperClass} .navItemText { flex: 1; color: var(--text-muted); transition: color 0.3s ease; min-width: 0; }.${uniqueWrapperClass} .navProgress { position: absolute; bottom: 0; left: 0; height: 3px; background: var(--glow); }.${uniqueWrapperClass} .showcaseNavItem:hover, .${uniqueWrapperClass} .showcaseNavItem.is-active { background: rgba(28, 28, 28, 0.8); }.${uniqueWrapperClass} .showcaseNavItem:hover .navItemText, .${uniqueWrapperClass} .showcaseNavItem.is-active .navItemText { color: var(--text-normal); }.${uniqueWrapperClass} .showcaseNavItem:hover .navItemThumb, .${uniqueWrapperClass} .showcaseNavItem.is-active .navItemThumb { filter: grayscale(0%); transform: scale(1.1); }.${uniqueWrapperClass} .showcase-content-anim { animation: fadeIn .6s var(--ease-out) forwards; }.${uniqueWrapperClass} .showcase-media-anim { animation: mediaZoom .6s var(--ease-out) forwards; }@keyframes fadeIn{from{opacity:0; transform:translateY(15px)} to{opacity:1; transform:translateY(0)}}@keyframes mediaZoom { from { opacity: 0.5; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }@keyframes progress { from { width: 0%; } to { width: 100%; } }.${uniqueWrapperClass} .is-mobile-layout {display: flex;flex-direction: column;height: auto;}.${uniqueWrapperClass} .is-mobile-layout .showcaseFeatured {order: 1; height: 320px;min-height: 260px;}.${uniqueWrapperClass} .is-mobile-layout .showcaseNav {order: 2; width: 100%;height: auto; padding: 0 12px;box-sizing: border-box;border-left: none; border-top: 1px solid var(--glow-faint);}.${uniqueWrapperClass} .is-mobile-layout .showcaseNav-track {flex-direction: row;}.${uniqueWrapperClass} .is-mobile-layout .showcaseNavItem {flex: 0 0 120px;flex-direction: column; justify-content: center;text-align: center;gap: 8px; padding: 12px 8px;border-bottom: none;border-right: 1px solid var(--glow-faint);}.${uniqueWrapperClass} .is-mobile-layout .navItemThumb {width: 80px;height: 45px;}.${uniqueWrapperClass} .is-mobile-layout .navItemText {flex: 0 1 auto; }@media (max-width: 400px) {.${uniqueWrapperClass} .showcaseContent > p {opacity: 0;max-height: 0;margin: 0;overflow: hidden;}}.${uniqueWrapperClass} .icon-hotspot {position: absolute;top: 0;right: 0;width: 60px;height: 60px;display: flex;align-items: center;justify-content: center;cursor: pointer;z-index: 50; }.${uniqueWrapperClass} .icon-hotspot .icon {opacity: 0;font-size: 14px;color: var(--text-muted);transition: opacity 0.3s ease-out, color 0.2s ease-out;}.${uniqueWrapperClass} .icon-hotspot:hover .icon {opacity: 1; color: var(--glow);}}@keyframes spin { to { transform: rotate(360deg); } }.showcaseNav-group-header {padding: 10px 16px 6px 16px;background: rgba(0, 0, 0, 0.4);color: var(--text-muted);font-size: 12px;font-weight: 600;text-transform: uppercase;letter-spacing: 0.5px;position: sticky;top: 0;left: 0;z-index: 10;flex-shrink: 0;}.showcaseNav-group-header + .showcaseNavItem {border-top: none;}.is-mobile-layout .showcaseNav-group-header {writing-mode: vertical-rl;text-orientation: mixed;padding: 16px 6px;text-align: center;border-right: 1px solid var(--glow-faint);border-bottom: none;}.is-mobile-layout .showcaseNav-group-header + .showcaseNavItem {border-top: none; border-left: none; }
    
     .${uniqueWrapperClass} .pill {
        transition: all 0.25s var(--ease-out);
    }
    .${uniqueWrapperClass} .pill[data-active="1"] {
        color: #0b0713;
        background: var(--glow-accent-purple);  /* Using a defined variable */
        box-shadow: var(--elev);
        position: relative;
        opacity: 22%;
        fontColor: white;
    }
    .${uniqueWrapperClass} .pill[data-active="1"]::after {
        content: "_";
        position: absolute;
        right: 8px;
        animation: blink 1s steps(1) infinite;
    }
    .${uniqueWrapperClass} .pill:not([data-active="1"]):hover {
        background: var(--glow-med);
        color: var(--glow);
    }
    @keyframes blink {
        50% {
            opacity: 0;
            border-color: transparent;
        }
    }
    
    `;

return { BasicView };

```





# UpdateDashboard

```jsx

const { useEffect, useRef, useState } = dc;

// --- UTILITY FUNCTIONS & COMPONENTS ---
function findNearestAncestorWithClass(element, className) { if (!element) return null; let current = element.parentNode; while (current) { if (current.classList && current.classList.contains(className)) { return current; } current = current.parentNode; } return null; }
function findDirectChildByClass(parent, className) { if (!parent) return null; for (const child of parent.children) { if (child.classList && child.classList.contains(className)) { return child; } } return null; }
const ICONS = {
    BELL: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path class="svg-elem-1" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path class="svg-elem-2" d="M13.73 21a2 2 0 0 1-3.46 0"></path><path class="svg-elem-3" d="M19 8a3 3 0 0 0-6 0"></path></svg>`,
    HEART: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    KOFI: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.584 6.334C22.259 5.864 21.706 5.633 21.119 5.633H5.733C5.146 5.633 4.593 5.864 4.268 6.334C3.618 7.274 4.076 8.124 4.076 8.124L5.617 13.337C6.014 14.577 7.158 15.367 8.449 15.367H15.62C16.911 15.367 18.055 14.577 18.452 13.337L20 8.124C20 8.124 20.458 7.274 19.808 6.334H22.584zM7.525 16.5C6.865 16.5 6.33 17.035 6.33 17.695V19.06C6.33 19.72 6.865 20.255 7.525 20.255H16.545C17.205 20.255 17.74 19.72 17.74 19.06V17.695C17.74 17.035 17.205 16.5 16.545 16.5H7.525z"></path></svg>`,
    PATREON: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15.385 0.23C11.246 0.23 7.854 3.621 7.854 7.76C7.854 11.899 11.246 15.29 15.385 15.29C19.524 15.29 22.915 11.899 22.915 7.76C22.915 3.621 19.523 0.23 15.385 0.23zM1.085 23.77H5.56V0.23H1.085V23.77z"></path></svg>`,
    CHECKLIST: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h10M8 12h10M8 18h10M4 6h.01M4 12h.01M4 18h.01"/></svg>`,
    X_CLOSE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const AnimatedIcon = ({ svgString, isActive, isInView }) => { const iconRef = useRef(null); const intervalRef = useRef(null); const timeoutRef = useRef(null); const pathsRef = useRef([]); const [hasRevealed, setHasRevealed] = useState(false); const DURATION = 1.0; useEffect(() => { const container = iconRef.current; if (!container || !svgString) return; container.innerHTML = svgString; const svgElement = container.querySelector('svg'); if (!svgElement) return; pathsRef.current = svgElement.querySelectorAll('[class*="svg-elem-"]'); pathsRef.current.forEach((path, index) => { const delay = 0.1 * index; const length = path.getTotalLength(); if (length > 0) { path.style.strokeDasharray = length; path.style.strokeDashoffset = length; path.style.stroke = 'var(--text-normal)'; path.style.strokeWidth = '1.5px'; path.style.fill = 'transparent'; path.style.transition = `stroke-dashoffset ${DURATION}s ease ${delay}s, fill ${DURATION * 0.7}s ease ${delay + (DURATION * 0.2)}s`; } }); }, [svgString]); useEffect(() => { if (isInView && !hasRevealed) { const paths = pathsRef.current; if (!paths || paths.length === 0) return; const maxDelay = 0.1 * (paths.length - 1); const totalRevealTime = (DURATION + maxDelay) * 1000; paths.forEach(path => { path.style.strokeDashoffset = '0'; path.style.fill = 'var(--interactive-accent-tint)'; }); setTimeout(() => setHasRevealed(true), totalRevealTime); } }, [isInView, hasRevealed]); useEffect(() => { if (!hasRevealed) return; const paths = pathsRef.current; if (!paths || paths.length === 0) return; const maxDelay = 0.1 * (paths.length - 1); const totalAnimationTime = (DURATION + maxDelay) * 1000; const runAnimationCycle = () => { paths.forEach(path => { path.style.strokeDashoffset = path.getTotalLength(); path.style.fill = 'transparent'; }); timeoutRef.current = setTimeout(() => { paths.forEach(path => { path.style.strokeDashoffset = '0'; path.style.fill = 'var(--interactive-accent-tint)'; }); }, totalAnimationTime * 0.88); }; if (isActive) { runAnimationCycle(); intervalRef.current = setInterval(runAnimationCycle, totalAnimationTime * 2); } else { paths.forEach(path => { path.style.strokeDashoffset = '0'; path.style.fill = 'var(--interactive-accent-tint)'; }); } return () => { clearInterval(intervalRef.current); clearTimeout(timeoutRef.current); }; }, [isActive, hasRevealed]); return <div ref={iconRef} style={{ width: '100%', height: '100%' }} />; };

// =================================================================================
// --- UPDATER LOGIC ---
// =================================================================================

const GITHUB_OWNER = 'beto-group';
const GITHUB_REPO = 'VAULT-UPDATE';
const GITHUB_BRANCH = 'main';
const LOG_PREFIX = '[VaultUpdater]';
const FILENAME = 'CHANGE LOG.md';

function compareSemVer(a, b) { const partsA = a.split('.').map(Number); const partsB = b.split('.').map(Number); const len = Math.max(partsA.length, partsB.length); for (let i = 0; i < len; i++) { const numA = partsA[i] || 0; const numB = partsB[i] || 0; if (numA > numB) return 1; if (numA < numB) return -1; } return 0; }
function parseVersionFromYaml(markdownContent) { if (!markdownContent) return null; const yamlMatch = markdownContent.match(/^---\s*([\s\S]*?)\s*---/); if (!yamlMatch) return null; const yaml = yamlMatch[1]; const versionMatch = yaml.match(/^version:\s*["']?(.+?)["']?$/m); return versionMatch ? versionMatch[1] : null; }
function parseLatestChangelogEntry(markdownContent) { if (!markdownContent) return null; try { const footerMarker = '>[!example]- GENERAL INFO'; const footerIndex = markdownContent.indexOf(footerMarker); let content = footerIndex !== -1 ? markdownContent.substring(0, footerIndex) : markdownContent; const firstEntryIndex = content.search(/^## [A-Z]+-\d+/m); if (firstEntryIndex === -1) return null; content = content.substring(firstEntryIndex); const entries = content.split(/\n----\n/); return entries[0].trim(); } catch (error) { console.error(`${LOG_PREFIX} Failed to parse changelog:`, error); return "Could not parse changelog. Please check the `CHANGE LOG.md` file."; } }

async function checkForUpdates() { try { const remoteUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${encodeURIComponent(FILENAME)}?cache-bust=${new Date().getTime()}`; const response = await requestUrl({ url: remoteUrl, method: 'GET' }); if (response.status !== 200) { throw new Error(`Failed to fetch ${FILENAME}. Status: ${response.status}`); } const remoteContent = response.text; const remoteVersion = parseVersionFromYaml(remoteContent); if (!remoteVersion) throw new Error(`Could not find version in remote ${FILENAME}`); let localVersion = '0.0.0'; const localFile = dc.app.vault.getAbstractFileByPath(FILENAME); if (localFile) { const localContent = await dc.app.vault.read(localFile); localVersion = parseVersionFromYaml(localContent) || '0.0.0'; } const updateAvailable = compareSemVer(remoteVersion, localVersion) > 0; return { updateAvailable, remoteVersion, localVersion, remoteContent }; } catch (error) { console.error(`${LOG_PREFIX} Error during update check:`, error); new Notice("Could not check for updates. See console for details.", 4000); return { updateAvailable: false, remoteVersion: 'unknown', localVersion: 'unknown', remoteContent: null }; } }
async function downloadLatestFromRepo() { const treeUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1&cache-bust=${new Date().getTime()}`; let treeData; try { const treeResponse = await requestUrl({ url: treeUrl, method: 'GET' }); if (treeResponse.status !== 200) throw new Error(`Failed to fetch file tree. Status: ${treeResponse.status}`); treeData = treeResponse.json; if (!treeData || !treeData.tree) throw new Error("Invalid tree data from GitHub API."); } catch (e) { console.error(`${LOG_PREFIX} Failed to fetch repo file tree.`, e); throw new Error("Could not retrieve file list from repository."); } const filesToDownload = treeData.tree.filter(item => item.type === 'blob'); const filePromises = filesToDownload.map(async (file) => { try { const contentUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${file.path}?cache-bust=${new Date().getTime()}`; const contentResponse = await requestUrl({ url: contentUrl, method: 'GET' }); if (contentResponse.status !== 200) { console.error(`${LOG_PREFIX} Failed to download ${file.path}. Status: ${contentResponse.status}`); return null; } return { path: file.path, content: contentResponse.text }; } catch (error) { console.error(`${LOG_PREFIX} Failed to download file: ${file.path}`, error); return null; } }); const downloadedFiles = (await Promise.all(filePromises)).filter(Boolean); if (downloadedFiles.length !== filesToDownload.length) new Notice("Warning: Some files failed to download.", 4000); return downloadedFiles; }
async function getCurrentVaultState(trackedFilePaths) { const vaultFiles = []; for (const path of trackedFilePaths) { try { const content = await dc.app.vault.adapter.read(path); vaultFiles.push({ path, content }); } catch (error) { } } return vaultFiles; }

function compareVersions(latestFiles, currentFiles) {
    const latestFileMap = new Map(latestFiles.map(f => [f.path, f.content]));
    const currentFileMap = new Map(currentFiles.map(f => [f.path, f.content]));
    const newFiles = [];
    const updatedFiles = [];
    const deletedFiles = [];

    for (const [path, content] of latestFileMap.entries()) {
        if (!currentFileMap.has(path)) {
            newFiles.push({ path, content });
        } else if (currentFileMap.get(path) !== content) {
            updatedFiles.push({ path, content });
        }
    }
    for (const [path, content] of currentFileMap.entries()) {
        if (!latestFileMap.has(path)) {
            deletedFiles.push({ path, content });
        }
    }
    return { newFiles, updatedFiles, deletedFiles };
}

// =================================================================================
// --- Main View Component ---
// =================================================================================
function UpdateDashboard({ onReloadRequest }) {
  const uniqueWrapperClass = "interactive-wrapper-" + useRef(Math.random().toString(36).substr(2, 9)).current;

  const SimpleMarkdownParser = ({ text }) => { if (!text) return null; const markdownStyles = { h3: { fontSize: '1.1em', fontWeight: 600, color: 'var(--text-normal)', marginTop: '15px', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid var(--background-modifier-border)', fontVariant: 'small-caps' }, p: { margin: '0 0 8px 0', lineHeight: '1.5', fontVariant: 'small-caps' }, ul: { margin: '0 0 10px 0', paddingLeft: '20px', listStyleType: 'disc' }, li: { marginBottom: '4px', fontVariant: 'small-caps' }, code: { backgroundColor: 'var(--background-modifier-hover)', borderRadius: '4px', padding: '2px 5px', fontSize: '0.9em', fontFamily: 'var(--font-monospace, monospace)', color: 'var(--text-muted)' } }; const renderLine = (line) => { const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g); return parts.map((part, index) => { if (part.startsWith('**') && part.endsWith('**')) { return <strong key={index}>{part.slice(2, -2)}</strong>; } if (part.startsWith('`') && part.endsWith('`')) { return <code key={index} style={markdownStyles.code}>{part.slice(1, -1)}</code>; } return part; }); }; const elements = []; let listItems = []; const flushList = (key) => { if (listItems.length > 0) { elements.push(<ul key={key} style={markdownStyles.ul}>{listItems}</ul>); listItems = []; } }; text.split('\n').forEach((line, index) => { if (line.startsWith('## ')) { flushList(`ul-${index}`); elements.push(<h3 key={index} style={markdownStyles.h3}>{line.substring(3)}</h3>); } else if (line.startsWith('- ') || line.startsWith('* ')) { listItems.push(<li key={index} style={markdownStyles.li}>{renderLine(line.substring(2))}</li>); } else { flushList(`ul-${index}`); if (line.trim() !== '') { elements.push(<p key={index} style={markdownStyles.p}>{renderLine(line)}</p>); } } }); flushList('ul-last'); return <>{elements}</>; };

  const STYLES = {
    injectedStyles: `
      .${uniqueWrapperClass}:hover .subtle-icon, .${uniqueWrapperClass}:hover .reload-button { opacity: 0.7; transform: scale(1); }
      .${uniqueWrapperClass} .promo-banner:hover { transform: scale(1.02); box-shadow: 0 0 90px -15px rgba(200, 160, 255, 0.4); }
      .reload-button:hover { background-color: var(--background-modifier-hover); opacity: 1; transform: scale(1.05); }
      .reload-button:active { transform: scale(0.95); }
      .changelog-toggle:hover { background-color: var(--background-modifier-hover); border-color: var(--background-modifier-border-hover); }
      .changelog-content::-webkit-scrollbar { width: 6px; }
      .changelog-content::-webkit-scrollbar-track { background: transparent; }
      .changelog-content::-webkit-scrollbar-thumb { background-color: rgba(150, 100, 255, 0.3); border-radius: 10px; }
      .changelog-content::-webkit-scrollbar-thumb:hover { background-color: rgba(150, 100, 255, 0.5); }
      .support-button:hover { background-color: var(--background-modifier-hover); border-color: var(--interactive-accent-hover); }
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes scaleIn { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      .modal-fade-in { animation: fadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1); } .modal-scale-in { animation: scaleIn 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
      @keyframes betReveal { 0% { opacity: 0; transform: scale(0.7) rotate(-10deg); } 70% { opacity: 1; transform: scale(1.1) rotate(5deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
      .bet-reveal { animation: betReveal 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }`,
    fullTabWrapper: { position: 'relative', height: "100%", width: "100%", padding: "20px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "25px", backgroundColor: "var(--background-secondary)", border: "1px solid var(--background-modifier-border)", borderRadius: "8px", color: "var(--text-normal)", transition: "background-color 0.2s ease", },
    icon: { position: "absolute", top: "15px", right: "20px", fontFamily: "monospace", fontSize: "14px", color: "var(--text-faint)", userSelect: "none", cursor: "pointer", opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out", zIndex: 10, },
    reloadButton: { position: "absolute", top: "12px", right: "50px", zIndex: 10, width: "30px", height: "30px", borderRadius: "50%", border: "none", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", color: "var(--text-faint)", backgroundColor: 'transparent', outline: "none", padding: 0, opacity: 0, transform: "scale(0.9)", transition: "opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease", },
    title: { fontSize: "2em", fontWeight: "600", color: "var(--text-normal)", fontVariant: 'small-caps' },
    subtitle: { fontSize: "1em", color: "var(--text-muted)", maxWidth: "400px", textAlign: "center", fontVariant: 'small-caps' },
    promoBanner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: "20px 30px", borderRadius: "16px", width: 'min(100%, 500px)', background: 'rgba(24, 15, 28, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 0 80px -20px rgba(200, 160, 255, 0.3)', cursor: 'pointer', transition: 'transform 0.3s ease, box-shadow 0.3s ease', },
    promoIconContainer: { width: '48px', height: '48px', flexShrink: 0, },
    bannerTextContainer: { textAlign: 'left', },
    bannerTitle: { margin: '0 0 5px 0', fontSize: '1.2em', fontWeight: 600, color: 'var(--text-normal)', fontVariant: 'small-caps' },
    bannerText: { margin: 0, color: 'var(--text-muted)', fontSize: '0.9em', fontVariant: 'small-caps' },
    modalOverlay: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px) saturate(1.2)', zIndex: 9999, },
    modalContent: { display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: 'min(100%, 95vw)', maxWidth: '500px', minHeight: '220px', justifyContent: 'center', padding: '30px', boxSizing: 'border-box', background: 'rgba(24, 15, 28, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', boxShadow: '0 0 80px -20px rgba(200, 160, 255, 0.3)', overflow: 'hidden', textAlign: 'left' },
    modalTitle: { margin: 0, fontSize: '1.5em', fontWeight: 600, color: 'var(--text-normal)', textAlign: 'center', fontVariant: 'small-caps' },
    modalText: { margin: '0 0 10px 0', color: 'var(--text-muted)', textAlign: 'center', fontVariant: 'small-caps' },
    changelogContent: { backgroundColor: 'var(--background-primary)', border: '1px solid var(--interactive-accent)', borderRadius: '8px', padding: '15px', width: '100%', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-monospace, monospace)', fontSize: '13px', color: 'var(--text-normal)', transition: 'max-height 0.4s ease-in-out, opacity 0.4s ease', },
    changelogToggle: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', borderRadius: '6px', backgroundColor: 'transparent', transition: 'background-color 0.2s ease, border-color 0.2s ease', width: '100%', border: '1px solid var(--background-modifier-border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px', justifyContent: 'space-between', fontVariant: 'small-caps' },
    hoverRevealText: { color: 'var(--text-faint)', fontSize: '12px', fontStyle: 'italic', height: '15px', textAlign: 'center', transition: 'opacity 0.3s ease, transform 0.3s ease', opacity: 0, transform: 'translateY(5px)', fontVariant: 'small-caps' },
    betText: { fontSize: '3.5em', fontWeight: 'bold', color: 'var(--text-normal)', userSelect: 'none', fontVariant: 'small-caps' },
    compactWrapper: { padding: "16px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", border: "1px dashed var(--background-modifier-border)", borderRadius: "8px", backgroundColor: "var(--background-primary-alt)", },
    compactText: { margin: 0, color: "var(--text-muted)", fontSize: "14px", fontVariant: 'small-caps' },
    buttonGroup: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" },
    button: { padding: "8px 16px", fontSize: "12px", fontWeight: "500", color: "var(--text-on-accent)", backgroundColor: "var(--interactive-accent)", border: "none", borderRadius: "6px", cursor: "pointer", fontVariant: 'small-caps' },
    secondaryButton: { backgroundColor: "var(--background-modifier-hover)", color: "var(--text-muted)", },
    fileChangesContainer: { width: '100%', backgroundColor: 'var(--background-secondary)', border: '1px solid var(--interactive-accent)', borderRadius: '12px', padding: '15px 20px', fontFamily: 'var(--font-monospace)', marginTop: '10px' },
    fileChangeHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 8px', backgroundColor: 'var(--background-modifier-hover)', borderRadius: '6px', marginBottom: '10px'},
    iconButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'background-color 0.2s, color 0.2s' },
    fileChangeCategoryTitle: { fontWeight: '600', color: 'var(--text-normal)', margin: '10px 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px', fontVariant: 'small-caps', fontSize: '1.1em' },
    fileChangeList: { listStyleType: 'none', padding: 0, margin: 0 },
    fileChangeListItem: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', color: 'var(--text-accent)', fontSize: '0.95em', position: 'relative', padding: '2px 0' },
    fileChangeListItemSelectable: { cursor: 'pointer' },
    fileChangePath: { cursor: 'pointer', flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'},
    fileChangePrefix: { fontWeight: 'bold', fontFamily: 'monospace' },
    fileInfoPreview: { position: 'absolute', bottom: '100%', left: '15px', marginBottom: '5px', backgroundColor: 'var(--background-secondary)', color: 'var(--text-normal)', padding: '5px 10px', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 1000, whiteSpace: 'nowrap', fontSize: '12px' },
    supportButtonContainer: { display: 'flex', gap: '20px', justifyContent: 'center', width: '100%', marginTop: '15px' },
    supportButton: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', border: '1px solid var(--background-modifier-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: 'var(--background-primary-alt)', color: 'var(--text-normal)', transition: 'all 0.2s ease', padding: '10px' },
    supportButtonIcon: { width: '48px', height: '48px', marginBottom: '10px' },
    supportButtonText: { fontVariant: 'small-caps', fontWeight: '500' },
    previewModalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, backdropFilter: 'blur(5px)', },
    previewModalContent: { backgroundColor: 'var(--background-secondary)', border: '1px solid var(--background-modifier-border)', borderRadius: '12px', boxShadow: '0 5px 25px rgba(0,0,0,0.5)', width: 'clamp(300px, 80vw, 900px)', height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    previewModalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid var(--background-modifier-border)', flexShrink: 0, backgroundColor: 'var(--background-primary-alt)' },
    previewModalTitle: { fontFamily: 'var(--font-monospace)', fontSize: '14px', color: 'var(--text-normal)' },
    previewModalCloseButton: { background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1, padding: '0 5px' },
    previewModalBody: { padding: '15px', overflow: 'auto', flexGrow: 1, backgroundColor: 'var(--background-primary)', margin: 0, },
    previewModalCode: { whiteSpace: 'pre', fontFamily: 'var(--font-monospace)', fontSize: '13px', color: 'var(--text-normal)', }
  };

  const CONTENT = { title: "VAULT UPDATER", subtitle: "This component keeps your vault structure up-to-date.", modalTitle: "Confirm Update", };
  const [isFullTab, setIsFullTab] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState('confirmation');
  const [isConfirmHovered, setIsConfirmHovered] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [updateResult, setUpdateResult] = useState(null);
  const [updateCheck, setUpdateCheck] = useState({ status: 'checking', info: null });
  const [latestChangelog, setLatestChangelog] = useState('');
  const [isChangelogVisible, setIsChangelogVisible] = useState(false);
  const [isFileChangesVisible, setIsFileChangesVisible] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  useEffect(() => { const container = containerRef.current; if (!container) return; if (isFullTab) { if (!container.parentNode) { setTimeout(() => setIsFullTab(true), 50); return; } const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content'); if (!targetPaneContent) { console.error("[UpdateDashboard] Full tab mode failed."); setIsFullTab(false); return; } const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent; stateRefs.originalParent = container.parentNode; stateRefs.placeholder = document.createElement('div'); stateRefs.placeholder.style.display = 'none'; container.parentNode.insertBefore(stateRefs.placeholder, container); const computedParentPosition = window.getComputedStyle(contentWrapper).position; stateRefs.parentPositionInfo = { element: contentWrapper, originalInlinePosition: contentWrapper.style.position }; if (computedParentPosition === 'static') { contentWrapper.style.position = "relative"; } contentWrapper.appendChild(container); Object.assign(container.style, { position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: "9998", overflow: "auto" }); } return () => { if (!stateRefs.originalParent) return; if (stateRefs.placeholder?.parentNode) { stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder); } else { stateRefs.originalParent.appendChild(container); } if (stateRefs.parentPositionInfo?.element) { stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || ''; } container.removeAttribute("style"); Object.keys(stateRefs).forEach(key => stateRefs[key] = null); }; }, [isFullTab]);
  useEffect(() => { if (!isModalOpen) return; const handleKeyDown = (event) => { if (event.key === 'Escape') { handleCloseModal(); } }; document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [isModalOpen]);
  
  useEffect(() => {
    async function doUpdateCheck() {
        const result = await checkForUpdates();
        setUpdateCheck({ status: 'checked', info: result });
        if (result.remoteContent) {
            const entry = parseLatestChangelogEntry(result.remoteContent);
            setLatestChangelog(entry || "Could not parse changelog entry.");
        }
    }
    doUpdateCheck();
  }, []);
  
  const handleOpenUpdateModal = async () => {
    new Notice('Re-checking for updates...', 2000);
    const result = await checkForUpdates();
    setUpdateCheck({ status: 'checked', info: result });
    if (result.remoteContent) {
        const entry = parseLatestChangelogEntry(result.remoteContent);
        setLatestChangelog(entry || "Could not parse changelog entry.");
    }

    if (result.updateAvailable) {
        setIsChangelogVisible(false);
        setModalStage('confirmation');
        setIsModalOpen(true);
    } else {
        new Notice('You are already up-to-date!', 4000);
    }
  };
  
  const handleOpenSupportModal = () => {
    setModalStage('support');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setIsMultiSelectMode(false);
      setSelectedFiles([]);
  };
  
  const handleGoToGitHub = () => {
    const repoUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStartUpdate = async () => {
    setModalStage('bet');
    await sleep(1000);
    try {
        setModalStage('processing');
        setUpdateStatus('downloading');
        const latestFiles = await downloadLatestFromRepo();
        setUpdateStatus('comparing');
        const changelogFile = latestFiles.find(f => f.path === FILENAME);
        const changelogEntry = changelogFile ? parseLatestChangelogEntry(changelogFile.content) : null;
        
        const allFilePaths = [...new Set([...latestFiles.map(f => f.path), ...dc.app.vault.getFiles().map(f => f.path)])];
        const currentFiles = await getCurrentVaultState(allFilePaths);
        
        const results = compareVersions(latestFiles, currentFiles);
        setUpdateResult({ ...results, changelogEntry, currentFiles });
        
        setUpdateStatus('writing');
        const allFilesToWrite = [...results.newFiles, ...results.updatedFiles];
        for (const file of allFilesToWrite) {
            const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
            if (parentDir && !await dc.app.vault.adapter.exists(parentDir)) { await dc.app.vault.createFolder(parentDir); }
            await dc.app.vault.adapter.write(file.path, file.content);
        }
        for (const file of results.deletedFiles) {
             const fileToDelete = dc.app.vault.getAbstractFileByPath(file.path);
             if (fileToDelete) {
                await dc.app.vault.delete(fileToDelete);
             }
        }
        
        new Notice(`Update to v${updateCheck.info.remoteVersion} complete!`, 5000);
        setUpdateStatus('success');
        setModalStage('results');
    } catch (error) {
        console.error("Update process failed:", error);
        setUpdateStatus('error');
        new Notice("Update process failed. Check the console for details.", 5000);
        handleCloseModal();
    }
  };

  const handleRevertChanges = async (filesToRevertPaths) => {
    if (!updateResult || filesToRevertPaths.length === 0) return;
    const { newFiles, updatedFiles, deletedFiles, currentFiles } = updateResult;
    try {
        for (const filePath of filesToRevertPaths) {
            const isNew = newFiles.some(f => f.path === filePath);
            const isUpdated = updatedFiles.some(f => f.path === filePath);
            const isDeleted = deletedFiles.some(f => f.path === filePath);

            if (isNew) {
                const fileToDelete = dc.app.vault.getAbstractFileByPath(filePath);
                if (fileToDelete) await dc.app.vault.delete(fileToDelete);
            } else if (isUpdated) {
                const originalFile = currentFiles.find(f => f.path === filePath);
                if (originalFile) await dc.app.vault.adapter.write(filePath, originalFile.content);
            } else if (isDeleted) {
                const originalFile = currentFiles.find(f => f.path === filePath);
                if (originalFile) {
                    const parentDir = originalFile.path.substring(0, originalFile.path.lastIndexOf('/'));
                    if (parentDir && !await dc.app.vault.adapter.exists(parentDir)) {
                        await dc.app.vault.createFolder(parentDir);
                    }
                    await dc.app.vault.adapter.write(originalFile.path, originalFile.content);
                }
            }
        }
        new Notice(`${filesToRevertPaths.length} file(s) reverted.`, 4000);
        handleCloseModal();
    } catch (error) {
        console.error("Failed to revert changes:", error);
        new Notice("Error reverting files. See console for details.", 5000);
    }
};

  const handleExitFullTab = (e) => { e.stopPropagation(); setIsFullTab(false); };
  const handleEnterFullTab = () => setIsFullTab(true);
  const handleCopyPath = () => { try { const activeFile = dc.app.workspace.getActiveFile(); if (activeFile) { navigator.clipboard.writeText(activeFile.path); new Notice(`Path copied`, 3000); } else { new Notice("Could not determine path.", 3000); } } catch (error) { new Notice("Error copying path.", 3000); } };
  const renderBannerContent = () => { if (updateCheck.status === 'checking') { return { title: "Checking for Updates...", text: "Please wait a moment." }; } if (updateCheck.info?.updateAvailable) { return { title: `Update Available: v${updateCheck.info.remoteVersion}`, text: `You are on v${updateCheck.info.localVersion}. Click to upgrade.` }; } return { title: "You are Up-to-Date!", text: `You have the latest version: v${updateCheck.info.localVersion}` }; };
  
  const FilePreviewModal = ({ file, onClose }) => {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!file) return null;

    return (
        <div style={STYLES.previewModalOverlay} className="modal-fade-in" onClick={onClose}>
            <div style={STYLES.previewModalContent} className="modal-scale-in" onClick={e => e.stopPropagation()}>
                <div style={STYLES.previewModalHeader}>
                    <span style={STYLES.previewModalTitle}>{file.path}</span>
                    <button style={STYLES.previewModalCloseButton} onClick={onClose}>&times;</button>
                </div>
                <pre style={STYLES.previewModalBody}>
                    <code style={STYLES.previewModalCode}>{file.content || '(File is new and empty or content is unavailable)'}</code>
                </pre>
            </div>
        </div>
    );
  };
  
  const CollapsibleSection = ({ title, children, isVisible, onToggle }) => {
    return (
        <div style={{width: '100%', marginBottom: '10px'}}>
            <button style={STYLES.changelogToggle} onClick={onToggle} className="changelog-toggle">
                <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>{title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform: isVisible ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease', flexShrink: 0}}><polyline points="15 6 9 12 15 18"></polyline></svg>
            </button>
            {isVisible && (
                <div className="changelog-content" style={{...STYLES.changelogContent, maxHeight: '25vh', marginTop: '10px'}}>
                    {children}
                </div>
            )}
        </div>
    );
  };

  const renderModalContent = () => {
    switch (modalStage) {
      case 'confirmation': return (<>
        <h3 style={STYLES.modalTitle}>{CONTENT.modalTitle}</h3>
        <p style={STYLES.modalText}>You are about to update from <b>v{updateCheck.info.localVersion}</b> to <b>v{updateCheck.info.remoteVersion}</b>. This will overwrite, add, and delete files.</p>
        <CollapsibleSection title="View what's new" isVisible={isChangelogVisible} onToggle={() => setIsChangelogVisible(!isChangelogVisible)}>
            <SimpleMarkdownParser text={latestChangelog} />
        </CollapsibleSection>
        <div style={STYLES.buttonGroup}>
            <button style={{...STYLES.button, ...STYLES.secondaryButton}} onClick={handleCloseModal}>Cancel</button>
            <button style={{...STYLES.button, ...STYLES.secondaryButton}} onClick={handleGoToGitHub} title="See changes on the official repository">View on GitHub</button>
            <button style={STYLES.button} onClick={handleStartUpdate} onMouseEnter={() => setIsConfirmHovered(true)} onMouseLeave={() => setIsConfirmHovered(false)}>Confirm Update</button>
        </div>
        <p style={{ ...STYLES.hoverRevealText, opacity: isConfirmHovered ? 1 : 0, transform: isConfirmHovered ? 'translateY(0)' : 'translateY(5px)' }}>bro you trust me ?</p>
      </>);
      case 'bet': return <div className="bet-reveal"><h1 style={STYLES.betText}>BET 🫡</h1></div>;
      case 'processing': return (<> <h3 style={STYLES.modalTitle}>Upgrading...</h3> <p style={STYLES.modalText}>{updateStatus === 'downloading' ? 'Downloading latest version...' : (updateStatus === 'comparing' ? 'Comparing files...' : 'Applying changes...')}</p> </>);
      case 'results':
          const { newFiles = [], updatedFiles = [], deletedFiles = [], changelogEntry } = updateResult || {};
          const excludedFiles = ['.obsidian/workspace.json'];
          const filtered = {
              updated: updatedFiles.filter(f => !excludedFiles.includes(f.path)),
              added: newFiles.filter(f => !excludedFiles.includes(f.path)),
              deleted: deletedFiles.filter(f => !excludedFiles.includes(f.path)),
          };
          const allChangedFiles = [...filtered.updated, ...filtered.added, ...filtered.deleted];
          const handleFileSelect = (filePath) => setSelectedFiles(prev => prev.includes(filePath) ? prev.filter(p => p !== filePath) : [...prev, filePath]);
          const handleSelectAll = (e) => setSelectedFiles(e.target.checked ? allChangedFiles.map(f => f.path) : []);
          const handleEnterMultiSelect = () => setIsMultiSelectMode(true);
          const handleExitMultiSelect = () => { setIsMultiSelectMode(false); setSelectedFiles([]); };

          const FileLink = ({ file, type }) => {
              const [isHovering, setIsHovering] = useState(false);
              const symbols = { added: '+', updated: '=', deleted: '-' };
              const colors = { added: 'var(--color-green)', updated: 'var(--color-yellow)', deleted: 'var(--color-red)' };
              const handlePreviewClick = (e) => {
                  e.stopPropagation();
                  setFilePreview({ path: file.path, content: file.content });
              };

              return (
                  <li style={{...STYLES.fileChangeListItem, ...(isMultiSelectMode && STYLES.fileChangeListItemSelectable)}}
                      onClick={isMultiSelectMode ? () => handleFileSelect(file.path) : handlePreviewClick}
                      onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
                      
                      {isHovering && <div style={STYLES.fileInfoPreview}>{file.path}</div>}
                      
                      {isMultiSelectMode && <input type="checkbox" readOnly checked={selectedFiles.includes(file.path)} style={{flexShrink: 0}} />}
                      
                      <span style={{ ...STYLES.fileChangePrefix, flexShrink: 0, cursor: 'pointer' }} onClick={handlePreviewClick}>{symbols[type]}</span>
                      
                      <span style={STYLES.fileChangePath} onClick={handlePreviewClick}>
                          {file.path}
                      </span>
                  </li>
              );
          };

          return (<>
              <h3 style={STYLES.modalTitle}>Update to v{updateCheck.info.remoteVersion} Complete!</h3>
              <CollapsibleSection title="What's New" isVisible={isChangelogVisible} onToggle={() => setIsChangelogVisible(!isChangelogVisible)}>
                  <SimpleMarkdownParser text={changelogEntry || "No changelog entry found."} />
              </CollapsibleSection>
              <CollapsibleSection title="File Changes" isVisible={isFileChangesVisible} onToggle={() => setIsFileChangesVisible(!isFileChangesVisible)}>
                  <div style={{...STYLES.fileChangesContainer, border: 'none', padding: 0, marginTop: 0}}>
                      <div style={STYLES.fileChangeHeader}>
                          {isMultiSelectMode ? (<>
                              <input type="checkbox" onChange={handleSelectAll} checked={selectedFiles.length === allChangedFiles.length && allChangedFiles.length > 0} id="select-all-checkbox" />
                              <label htmlFor="select-all-checkbox" style={{cursor: 'pointer', fontVariant: 'small-caps'}}>Select All</label>
                              <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                  {selectedFiles.length > 0 && <button style={{...STYLES.button, ...STYLES.secondaryButton, padding: '4px 10px', fontSize: '11px'}} onClick={() => handleRevertChanges(selectedFiles)}>Revert ({selectedFiles.length})</button>}
                                  <button onClick={handleExitMultiSelect} className="icon-button" style={STYLES.iconButton} title="Cancel Selection"><div style={{width: '16px', height: '16px'}} dangerouslySetInnerHTML={{ __html: ICONS.X_CLOSE }} /></button>
                              </div>
                          </>) : (<>
                              <h4 style={{...STYLES.fileChangeCategoryTitle, margin: 0, flexGrow: 1, fontSize: '1em'}}>Summary</h4>
                              {allChangedFiles.length > 0 && <button onClick={handleEnterMultiSelect} className="icon-button" style={STYLES.iconButton} title="Select files to revert"><div style={{width: '18px', height: '18px'}} dangerouslySetInnerHTML={{ __html: ICONS.CHECKLIST }} /></button>}
                          </>)}
                      </div>
                      {filtered.updated.length > 0 && <><h4 style={STYLES.fileChangeCategoryTitle}>Modified</h4><ul style={STYLES.fileChangeList}>{filtered.updated.map((f, i) => <FileLink key={`mod-${i}`} file={f} type="updated" />)}</ul></>}
                      {filtered.added.length > 0 && <><h4 style={STYLES.fileChangeCategoryTitle}>Added</h4><ul style={STYLES.fileChangeList}>{filtered.added.map((f, i) => <FileLink key={`new-${i}`} file={f} type="added" />)}</ul></>}
                      {filtered.deleted.length > 0 && <><h4 style={STYLES.fileChangeCategoryTitle}>Deleted</h4><ul style={STYLES.fileChangeList}>{filtered.deleted.map((f, i) => <FileLink key={`del-${i}`} file={f} type="deleted" />)}</ul></>}
                  </div>
              </CollapsibleSection>
              <div style={{...STYLES.buttonGroup, marginTop: '15px'}}>
                  <button style={STYLES.button} onClick={handleCloseModal}>Done</button>
              </div>
          </>);
      case 'support': return(<>
        <h3 style={STYLES.modalTitle}>Support the Developer</h3>
        <p style={STYLES.modalText}>Thank you for using this tool! If you find it helpful, please consider supporting its continued development.</p>
        <div style={STYLES.supportButtonContainer}>
            <button className="support-button" style={STYLES.supportButton} onClick={() => window.open('https://ko-fi.com/betogroup', '_blank')}>
                <div style={STYLES.supportButtonIcon} dangerouslySetInnerHTML={{ __html: ICONS.KOFI }}></div>
                <span style={STYLES.supportButtonText}>Ko-fi</span>
            </button>
            {/*
            <button className="support-button" style={STYLES.supportButton} onClick={() => window.open('https://patreon.com/yourusername', '_blank')}>
                 <div style={STYLES.supportButtonIcon} dangerouslySetInnerHTML={{ __html: ICONS.PATREON }}></div>
                <span style={STYLES.supportButtonText}>Patreon</span>
            </button>
            */}
        </div>
        <div style={{...STYLES.buttonGroup, marginTop: '20px'}}>
            <button style={{...STYLES.button, ...STYLES.secondaryButton}} onClick={handleCloseModal}>Maybe Later</button>
        </div>
      </>);
      default: return null;
    }
  }
  
  const bannerContent = renderBannerContent();

  const UpToDateCard = () => (
      <div
        style={{ ...STYLES.promoBanner, cursor: 'pointer' }}
        className="promo-banner"
        onClick={handleOpenSupportModal}
      >
        <div style={STYLES.promoIconContainer}>
            <AnimatedIcon svgString={ICONS.HEART} isActive={true} isInView={true} />
        </div>
        <div style={STYLES.bannerTextContainer}>
          <h3 style={STYLES.bannerTitle}>You Are Up-To-Date!</h3>
          <p style={STYLES.bannerText}>Consider supporting the developer if you find this tool helpful.</p>
        </div>
      </div>
  );

  return (
    <div ref={containerRef}>
      <style>{STYLES.injectedStyles} {`.icon-button:hover { background-color: var(--background-modifier-border); color: var(--text-normal); }`}</style>
      {isModalOpen && 
        <div style={STYLES.modalOverlay} className="modal-fade-in" onClick={handleCloseModal}>
          <div style={STYLES.modalContent} className="modal-scale-in" onClick={e => e.stopPropagation()}>
            {renderModalContent()}
          </div>
        </div>
      }
      {filePreview && <FilePreviewModal file={filePreview} onClose={() => setFilePreview(null)} />}
      {isFullTab ? (
        <div style={STYLES.fullTabWrapper} className={uniqueWrapperClass}>
          <span style={STYLES.icon} className="subtle-icon" title="Exit Full Tab" onClick={handleExitFullTab}>&lt;/&gt;</span>
          <button onClick={onReloadRequest} className="reload-button" style={STYLES.reloadButton} aria-label="Reload Component" title="Reload Component">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(60deg)' }}>
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          <h2 style={STYLES.title}>{CONTENT.title}</h2>
          <p style={STYLES.subtitle}>{CONTENT.subtitle}</p>
          
          {updateCheck.status === 'checked' ? (
              updateCheck.info?.updateAvailable ? (
                <div style={{...STYLES.promoBanner, cursor: 'pointer' }} className="promo-banner" onClick={handleOpenUpdateModal}>
                    <div style={STYLES.promoIconContainer}><AnimatedIcon svgString={ICONS.BELL} isActive={true} isInView={true} /></div>
                    <div style={STYLES.bannerTextContainer}>
                        <h3 style={STYLES.bannerTitle}>{bannerContent.title}</h3>
                        <p style={STYLES.bannerText}>{bannerContent.text}</p>
                    </div>
                </div>
              ) : (
                <UpToDateCard />
              )
          ) : (
            <div style={{...STYLES.promoBanner, opacity: 0.7, cursor: 'default' }}>
                <div style={STYLES.promoIconContainer}><AnimatedIcon svgString={ICONS.BELL} isActive={false} isInView={true} /></div>
                <div style={STYLES.bannerTextContainer}>
                    <h3 style={STYLES.bannerTitle}>Checking for Updates...</h3>
                    <p style={STYLES.bannerText}>Please wait a moment.</p>
                </div>
            </div>
          )}
        </div>
      ) : (
        <div style={STYLES.compactWrapper}>
          <p style={STYLES.compactText}>Component is in compact mode.</p>
          <div style={STYLES.buttonGroup}>
            <button style={STYLES.button} onClick={handleEnterFullTab}>Enter Full Tab</button>
            <button style={{...STYLES.button, ...STYLES.secondaryButton}} onClick={handleCopyPath}>Find Codeblock</button>
          </div>
        </div>
      )}
    </div>
  );
};

function UpdateDashboardView() {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleHardReset = () => { new Notice('Reloading component...'); setRefreshKey(prevKey => prevKey + 1); };
    return <BasicView key={refreshKey} onReloadRequest={handleHardReset} />;
}


return {Manager : UpdateDashboardView  };

```








