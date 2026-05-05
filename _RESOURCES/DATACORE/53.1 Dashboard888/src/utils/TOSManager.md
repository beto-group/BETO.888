# TOSManager

```jsx
const { useState, useEffect, useRef } = dc;

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

/**
 * Loads a script from a URL and caches it in the vault.
 */
async function loadScript(dc, src, globalCheck) {
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
    
    try {
        if (!window.Fuse) {
            await loadScript(
                dc,
                "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js",
                "Fuse"
            );
        }
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
    try {
        const cached = localStorage.getItem(TOS_LOCALSTORAGE_KEY);
        if (cached === "1") {
            setTimeout(async () => {
                const hit = await findTosApprovalFile();
                if (!hit || !hit.file) {
                    localStorage.setItem(TOS_LOCALSTORAGE_KEY, "0");
                    return;
                }
                try {
                    const txt = await dc.app.vault.read(hit.file);
                    const allTasksRegex = /^\s*-\s*\[(x|\s)\]/gim;
                    const completedTasksRegex = /^\s*-\s*\[x\]/gim;
                    const totalTasks = (txt.match(allTasksRegex) || []).length;
                    const completedTasks = (txt.match(completedTasksRegex) || []).length;
                    const approved = totalTasks > 0 && totalTasks === completedTasks;
                    if (!approved) {
                        localStorage.setItem(TOS_LOCALSTORAGE_KEY, "0");
                    }
                } catch (e) {
                    console.error("BETO: Could not read the TOS approval file.", e);
                }
            }, 0);
            return true;
        }
    } catch { }
    
    const hit = await findTosApprovalFile();
    if (!hit || !hit.file) {
        try {
            localStorage.setItem(TOS_LOCALSTORAGE_KEY, "0");
        } catch { }
        return false;
    }

    let txt = "";
    try {
        txt = await dc.app.vault.read(hit.file);
    } catch (e) {
        console.error("BETO: Could not read the TOS approval file.", e);
        return false;
    }

    if (typeof txt !== 'string') txt = '';
    const allTasksRegex = /^\s*-\s*\[(x|\s)\]/gim;
    const completedTasksRegex = /^\s*-\s*\[x\]/gim;
    const totalTasks = (txt.match(allTasksRegex) || []).length;
    const completedTasks = (txt.match(completedTasksRegex) || []).length;

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

function TOSScreen({ onAgree, STYLES, MatrixRain, localTheme }) {
    const [isAgreed, setIsAgreed] = useState(false);
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);
    const [iframeRefreshKey, setIframeRefreshKey] = useState(0);
    const handleIframeLoad = () => setIsIframeLoaded(true);
    const handleRefreshIframe = () => {
        setIsIframeLoaded(false);
        setIframeRefreshKey((k) => k + 1);
    };

    const isLight = localTheme === 'theme-light';
    const GLOW = isLight ? "oklch(0.45 0.15 300)" : "oklch(0.82 0.21 300)";
    const FADE = isLight ? "rgba(245, 245, 247, 0.15)" : "rgba(11, 7, 19, 0.15)";
    const BG_SHELL = isLight ? "#f5f5f7" : "#0b0713";
    const BG_MODAL = isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(18, 12, 22, 0.85)";
    const BORDER = isLight ? "var(--background-modifier-border)" : "var(--glow-faint)";
    const TEXT_NORMAL = "var(--text-normal)";
    const TEXT_MUTED = "var(--text-muted)";

    return (
        <div style={{ ...STYLES.shell, background: BG_SHELL, transition: 'background 0.4s ease' }}>
            <MatrixRain
                mainColor={GLOW}
                leadColor={isLight ? "oklch(0.25 0.1 300)" : "oklch(0.95 0.08 300)"}
                fadeColor={FADE}
                frequency={0.8}
            />
            <div className="fx-stage">
                <div className="fx-grid" style={{ opacity: isLight ? 0.05 : 0.2 }}></div>
                <div className="fx-scanlines" style={{ opacity: isLight ? 0.02 : 0.05 }}></div>
                <div className="fx-vignette" style={{ background: isLight ? "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.05) 100%)" : undefined }}></div>
            </div>
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
                        border: `1px solid ${BORDER}`,
                        background: BG_MODAL,
                        backdropFilter: "blur(40px)",
                        boxShadow: isLight ? "0 20px 60px rgba(0,0,0,0.08)" : "0 30px 100px rgba(0,0,0,0.5)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.3s ease",
                    }}
                >
                    <div
                        style={{
                            padding: "18px 24px",
                            borderBottom: `1px solid ${BORDER}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(var(--background-primary-alt-rgb), 0.4)"
                        }}
                    >
                        <h2
                            className="headline glitch-text"
                            data-text="Terms of Service"
                            style={{ 
                                ...STYLES.h1, 
                                margin: 0, 
                                fontSize: "24px", 
                                color: GLOW,
                                letterSpacing: '1px',
                                fontWeight: '900'
                            }}
                        >
                            Terms of Service
                        </h2>
                        <span style={{ fontSize: "12px", color: TEXT_MUTED, fontWeight: '800' }}>
                            {isIframeLoaded
                                ? "// SYSTEM READY"
                                : "// INITIALIZING..."}
                        </span>
                    </div>
                    <div style={{ position: "relative", background: "var(--background-primary)" }}>
                        <div
                            style={{
                                maxHeight: "55vh",
                                minHeight: "280px",
                                overflowY: "auto",
                                padding: "18px 18px 18px 18px",
                                borderBottom: `1px solid ${BORDER}`,
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
                                        background: 'rgba(var(--background-primary-rgb), 0.6)',
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
                                    style={{ 
                                        width: "100%", 
                                        height: "100%", 
                                        border: "none",
                                        filter: isLight ? 'invert(1) hue-rotate(180deg) brightness(1.2) contrast(1.1)' : 'none',
                                        transition: 'filter 0.5s ease'
                                    }}
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
                                    Loading terms… Please wait to interact.
                                </p>
                            )}
                        </div>
                    </div>
                    <div
                        style={{
                            padding: "20px 24px 0 24px",
                            maxHeight: "28vh",
                            overflowY: "auto",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 10px",
                                marginBottom: "8px",
                                border: `1px solid var(--glow-faint)`,
                                borderLeft: `4px solid ${isAgreed
                                    ? GLOW
                                    : BORDER
                                    }`,
                                borderRadius: "8px",
                                background: "rgba(var(--background-primary-rgb), 0.6)",
                                opacity: isIframeLoaded ? 1 : 0.7,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isAgreed}
                                disabled={!isIframeLoaded}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                style={{
                                    width: "18px",
                                    height: "18px",
                                    cursor: isIframeLoaded ? "pointer" : "default",
                                }}
                            />
                            <label style={{ fontSize: "12px", color: TEXT_NORMAL, fontWeight: '700' }}>
                                I AGREE TO THE TERMS OF SERVICE
                            </label>
                        </div>
                    </div>
                    <div
                        style={{
                            padding: "16px 24px 24px",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "12px",
                            background: "rgba(var(--background-primary-alt-rgb), 0.4)"
                        }}
                    >
                        <button
                            className="btn"
                            style={{
                                ...STYLES.btn,
                                background: "rgba(var(--background-primary-alt-rgb), 0.4)",
                                color: GLOW,
                                borderColor: BORDER,
                                fontSize: '11px',
                                fontWeight: '700',
                                fontVariant: 'small-caps'
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
                                opacity: isAgreed ? 1 : 0.6,
                                cursor: isAgreed ? "pointer" : "not-allowed",
                            }}
                            disabled={!isAgreed}
                            onClick={() => {
                                if (isAgreed) onAgree();
                            }}
                            title={isAgreed ? "Proceed" : "Check the box above to proceed"}
                        >
                            [ I Agree & Continue ]
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

return {
    TOSScreen,
    isTosApproved,
    writeTosApproval,
    subscribeToTosApprovalChanges
};
```
