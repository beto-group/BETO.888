

const { useState, useEffect, useRef } = dc;

// --- DOM Traversal Utilities ---
function findNearestAncestorWithClass(element, className) {
    if (!element) return null;
    let current = element.parentNode;
    while (current) {
        if (current.classList && current.classList.contains(className)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}

function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (const child of parent.children) {
        if (child.classList && child.classList.contains(className)) {
            return child;
        }
    }
    return null;
}

function applyBrowserMode(container) {
    if (!document.fullscreenElement) {
        (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen)?.call(container)
            .catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
    } else if (document.fullscreenElement === container) {
        document.exitFullscreen?.();
    }
}

// --- Smart Lookup Utility ---
const resolveSmart = (name, header = null) => {
    const raw = dc.resolvePath(name) || name;
    const absolute = raw.startsWith('/') ? raw : '/' + raw;
    if (header) {
        // Try to find if we are in a bundle named D.q.animationtool.component
        const selfPath = dc.resolvePath("D.q.recap2025.component.md") || dc.resolvePath("D.q.recap2025.component");
        if (selfPath) return dc.headerLink(selfPath, header);
    }
    return absolute;
};

// Robust Component Loader
const { NodeGraph } = await dc.require(dc.resolvePath('71 Recap2025/src/components/NodeGraph.jsx') || dc.resolvePath('NodeGraph.jsx'));


function AnimationTool({ folderPath }) {
    const [isFullTab, setIsFullTab] = useState(true);
    const [isAutoPlayActive, setIsAutoPlayActive] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [isCinematicReady, setIsCinematicReady] = useState(false); // Delayed Animation State
    const [graphData, setGraphData] = useState(null);

    // Load and Parse Data
    useEffect(() => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        async function loadData() {
            try {
                const vault = dc.app.vault;
                const adapter = vault.adapter;

                // Prioritize local resource path if folderPath is available
                // This ensures relocation stability (D.q.animationtool.viewer doesn't need to be in dist)
                const localRecapPath = folderPath ? (folderPath + '/recap.md') : null;
                const recapPath = localRecapPath || dc.resolvePath('recap.md');

                let text = null;
                if (recapPath && await adapter.exists(recapPath)) {
                    text = await adapter.read(recapPath);
                    console.log(`AnimationTool: Loaded data from ${recapPath}`);
                }

                // Fallback: If resolvePath failed (unlikely if file exists), try manual search
                if (!text) {
                    const files = vault.getFiles();
                    const recapFile = files.find(f => f.name === 'recap.md');
                    if (recapFile) {
                        text = await vault.read(recapFile);
                        console.log(`AnimationTool: Found recap.md via global search at ${recapFile.path}`);
                    }
                }

                if (!text) throw new Error("Could not locate recap.md in vault");

                // --- Enhanced Robust Indentation-Aware Parser ---
                const yearsMap = {};
                const yearLines = text.split('\n');
                let currentYear = "2025";
                let currentMonth = null;
                let currentItem = null;
                let currentMediaEntry = null;

                // Emoji Mapping (Lucide Equivalents)
                const EMOJI_TO_ICON = {
                    '🔥': 'flame', '👀': 'eye', '❤️': 'heart', '🤍': 'heart',
                    '⭐️': 'star', '👏': 'sparkles', '👍': 'thumbs-up',
                    '🚀': 'rocket', '🎮': 'gamepad-2', '🎵': 'music', '✨': 'sparkles',
                    '🏆': 'trophy', '💎': 'gem', '🍀': 'clover', '💬': 'message-square',
                    '⬆️': 'arrow-big-up', '⬇️': 'arrow-big-down',
                    '🫡': 'check-circle', '🤯': 'zap', '💯': 'check-check', '✅': 'check',
                    '💥': 'zap', '⚡️': 'zap'
                };

                // Tracking state
                let inCommentsMode = false;
                let inEmojiMode = false;
                let lastParentByIndent = {};
                let lastMediaIndent = -1;
                let idCounter = 0; // For unique IDs
                let groupOrders = {}; // Track order of custom groups per year

                for (const line of yearLines) {
                    if (!line.trim()) continue;

                    // 1. Year Header (# 2025 Recap OR # 2025)
                    const yearMatch = line.match(/^\s*#\s+(\d{4})(.*)/i);
                    if (yearMatch) {
                        currentYear = yearMatch[1];
                        console.log(`[ParserDebug] Year Shift: ${currentYear}`);
                        if (!yearsMap[currentYear]) {
                            yearsMap[currentYear] = {};
                            groupOrders[currentYear] = [];
                        }
                        currentMonth = null;
                        continue;
                    }

                    // 1b. Catch-all for non-year Top Headers
                    const topHeaderMatch = line.match(/^\s*#\s+([^0-9#\n].+)/);
                    if (topHeaderMatch) {
                        const title = topHeaderMatch[1].trim();
                        // For 2026, use the title as the "month" key for custom grouping
                        if (currentYear === "2026") {
                            currentMonth = title;
                        } else {
                            // If no month is set yet, and it's not 2026, we don't default to January.
                            // The group will be created based on the first actual month header or item.
                        }

                        if (!yearsMap[currentYear][currentMonth]) {
                            const mArr = []; mArr.comments = [];
                            yearsMap[currentYear][currentMonth] = mArr;
                            if (groupOrders[currentYear] && !groupOrders[currentYear].includes(currentMonth)) {
                                groupOrders[currentYear].push(currentMonth);
                            }
                        }

                        currentItem = { id: `special-${idCounter++}`, title, desc: "", media: [], emojis: [] };
                        yearsMap[currentYear][currentMonth].push(currentItem);
                        continue;
                    }

                    // 2. Month Header (## January / ## Jan)
                    const monthMatch = line.match(/^\s*##\s+([a-z]+)/i);
                    if (monthMatch) {
                        const mRaw = monthMatch[1].toLowerCase();
                        const mIdx = monthNames.findIndex(mn => mn.toLowerCase().startsWith(mRaw));
                        if (mIdx !== -1) {
                            currentMonth = monthNames[mIdx];
                            console.log(`[ParserDebug] Found Month: ${currentMonth}`);
                            if (!yearsMap[currentYear]) yearsMap[currentYear] = {};
                            if (!yearsMap[currentYear][currentMonth]) {
                                const mArr = [];
                                mArr.comments = []; // Attach comments array to the month array
                                yearsMap[currentYear][currentMonth] = mArr;
                                if (groupOrders[currentYear] && !groupOrders[currentYear].includes(currentMonth)) {
                                    groupOrders[currentYear].push(currentMonth);
                                }
                            }
                        }
                        inCommentsMode = false;
                        inEmojiMode = false;
                        currentItem = null; // New month starts fresh
                        currentMediaEntry = null; // Clear media context
                        lastMediaIndent = -1;
                        continue;
                    }

                    // 3. Robust Bullet Processor (Handles -, *, +)
                    const bulletMatch = line.match(/^(\s*)([-*+])\s+(.+)/);
                    if (bulletMatch && currentMonth) {
                        const indent = bulletMatch[1] || "";
                        const content = bulletMatch[3].trim();
                        const indentLevel = indent.replace(/\t/g, '    ').length; // Standardize tab to 4 spaces

                        lastParentByIndent[indentLevel] = content;

                        // Section Detection
                        const lowerContent = content.toLowerCase();
                        if (lowerContent === 'comments' && indentLevel === 0) {
                            inCommentsMode = true; inEmojiMode = false; continue;
                        }
                        if (lowerContent === 'emoji' && indentLevel > 0) {
                            inEmojiMode = true; continue;
                        }

                        // Exit Modes
                        if (indentLevel === 0) {
                            inCommentsMode = false;
                            inEmojiMode = false;
                            // RESET PARSER CONTEXT
                            // If we hit root indent, previous media chains are broken.
                            currentMediaEntry = null;
                            lastMediaIndent = -1;
                        }
                        // If we are deep indent and in emoji mode, reset it if we jump back up
                        if (inEmojiMode && indentLevel <= (currentMediaEntry ? 4 : (currentItem ? 4 : 0))) {
                            // This is a bit complex, let's just use the indent logic:
                            // If it's not an emoji line (X x Y), it's probably something else.
                        }

                        if (inCommentsMode && indentLevel > 0) {
                            // Struct: Platform (4), Username (8), Text (12)
                            const currentMonthObj = yearsMap[currentYear][currentMonth];
                            if (indentLevel >= 12) {
                                let platform = "General";
                                let username = "Anonymous";
                                Object.keys(lastParentByIndent).forEach(ind => {
                                    const val = parseInt(ind);
                                    if (val < indentLevel) {
                                        if (val >= 4 && val < 8) platform = lastParentByIndent[ind];
                                        if (val >= 8 && val < 12) username = lastParentByIndent[ind];
                                    }
                                });
                                const cleanText = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
                                currentMonthObj.comments.push({ platform: platform.trim(), user: username.trim(), text: cleanText });
                            }
                            continue;
                        }

                        if (inEmojiMode && indentLevel > 0) {
                            // Format: 🔥 x 5
                            const reactionMatch = content.match(/([^\s]+)\s+x\s+(\d+)/);
                            if (reactionMatch) {
                                const emoji = reactionMatch[1];
                                const count = reactionMatch[2];
                                const icon = EMOJI_TO_ICON[emoji] || 'zap';
                                const target = currentMediaEntry || currentItem;
                                if (target) {
                                    if (!target.emojis) target.emojis = [];
                                    target.emojis.push({ icon, count, original: emoji });
                                }
                                continue;
                            }
                        }

                        const isUrl = content.match(/^https?:\/\//i) || content.match(/\.(png|jpg|jpeg|gif|mp4|webm|mov|ogg|m4v|mkv)$/i) || content.startsWith('[[');

                        if (isUrl) {
                            // Media Entry
                            let finalUrl = content;

                            // Smart Vault Search (Relocation-Proof)
                            const findVaultFile = async (searchStr) => {
                                const clean = searchStr.replace(/[\[\]]/g, '').trim();
                                const fileName = clean.split('/').pop();

                                // Helper to check existence
                                const verifyExists = async (path) => {
                                    if (!path) return false;
                                    return await adapter.exists(path);
                                };

                                // 1. Try Local Resource Directories first (Relocation-Proof)
                                if (folderPath) {
                                    // Normalize folderPath to be relative to vault root for getAbstractFileByPath
                                    // This assumes folderPath might be absolute on some systems
                                    const base = folderPath.startsWith('/') ? folderPath.substring(1) : folderPath;

                                    const localPaths = [
                                        `${base}/_resources/videos/${fileName}`,
                                        `${base}/_resources/images/${fileName}`,
                                        `${base}/_resources/${fileName}`,
                                        `${base}/${clean}`
                                    ].map(p => p.replace(/\/\//g, '/')); // Cleanup double slashes

                                    for (const lp of localPaths) {
                                        // Try relative path first
                                        const relativeLp = lp.startsWith('/') ? lp.substring(1) : lp;
                                        if (await verifyExists(relativeLp)) {
                                            const file = vault.getAbstractFileByPath(relativeLp);
                                            if (file) {
                                                console.log(`[ParserDebug] Local Match Found: ${file.path}`);
                                                return file;
                                            }
                                        }
                                        // Try absolute as fallback for adapter
                                        if (lp.startsWith('/') && await verifyExists(lp)) {
                                            // We still need a TFile, so we might need to search or just rely on the relative match above
                                        }
                                    }
                                }

                                // 2. Try Datacore's Native Robust Resolution
                                try {
                                    const resolvedPath = dc.resolvePath(clean);
                                    if (resolvedPath) {
                                        const file = vault.getAbstractFileByPath(resolvedPath);
                                        if (file && await verifyExists(file.path)) {
                                            console.log(`[ParserDebug] dc.resolvePath found: ${file.path}`);
                                            return file;
                                        }
                                    }
                                } catch (e) { }

                                // 3. Fallback: Desperate Global Search
                                const fileNameOnly = fileName.toLowerCase();
                                const allFiles = vault.getFiles();
                                const desperateMatch = allFiles.find(f => f.name.toLowerCase() === fileNameOnly);
                                if (desperateMatch && await verifyExists(desperateMatch.path)) {
                                    console.log(`[ParserDebug] Desperate Match Found: ${desperateMatch.path}`);
                                    return desperateMatch;
                                }

                                return null;
                            };





                            let resolvedFile = null;

                            if (content.startsWith('[[') || (!content.startsWith('http') && content.match(/\./))) {
                                const file = await findVaultFile(content);
                                if (file) {
                                    // Use Obsidian's resource path
                                    finalUrl = vault.getResourcePath(file);
                                    // Remove trailing ? modification hashes which break video demuxer
                                    if (finalUrl.match(/\.(webm|mp4|mov|mkv|m4v|avi)/i)) {
                                        finalUrl = finalUrl.split('?')[0];
                                    }
                                    resolvedFile = file;
                                    console.log(`[ParserDebug] Resolved ${content} -> ${finalUrl}`);
                                } else {
                                    console.warn(`[ParserDebug] Failed to resolve file: ${content}`);
                                    const fuzzy = content.replace(/[\[\]]/g, '').trim().replace(/_/g, ' ');
                                    const file2 = await findVaultFile(fuzzy);
                                    if (file2) {
                                        finalUrl = vault.getResourcePath(file2).split('?')[0]; // Clean fuzzy too
                                        resolvedFile = file2;
                                        console.log(`[ParserDebug] Fuzzy Resolved ${content} -> ${finalUrl}`);
                                    }
                                }
                            }

                            // DEBUG: Trace February Item
                            if (content.includes('Mo4Qssx3JXE') || content.includes('Remaster')) {
                                console.log(`[FebDebug] Processing: "${content}" | Indent: ${indentLevel} | LastMediaIndent: ${lastMediaIndent} | HasEntry: ${!!currentMediaEntry} | IsUrl: ${isUrl}`);
                            }

                            // NESTED MEDIA LOGIC (Youtube -> Local Video)
                            const isYoutubeParent = currentMediaEntry && (currentMediaEntry.url.includes('youtube.com') || currentMediaEntry.url.includes('youtu.be'));
                            // Remove '$' anchor to handle query params (e.g. video.webm?123) and support wiki-links
                            const isLocalChild = finalUrl.match(/\.(webm|mp4|mov|mkv|avi|m4v)/i) || (content.startsWith('[[') && content.match(/\.(webm|mp4|mov|mkv|avi|m4v)/i));

                            // SMART MERGE: 
                            // 1. Stricter Indent: Standard nested items
                            // 2. Sibling/Loose Indent: If we have a pending YouTube link and this is a local video, 
                            //    it almost certainly belongs to it. Ignore strict indent to fix user formatting issues.
                            const shouldMerge = currentMediaEntry && (
                                indentLevel > lastMediaIndent ||
                                ((isYoutubeParent && isLocalChild))
                            );

                            if (shouldMerge) {
                                // This is a child media (e.g. Local Video inside Youtube Link bullet)
                                // We attach it to the parent media entry
                                console.log(`[ParserDebug] MERGING: Video ${finalUrl} into Parent ${currentMediaEntry.url}`);
                                currentMediaEntry.videoSrc = finalUrl;
                                // CRITICAL FIX: Also capture the file path so Direct Read works!
                                if (resolvedFile) {
                                    currentMediaEntry.filePath = resolvedFile.path;
                                } else if (finalUrl.startsWith('app://') || !finalUrl.startsWith('http')) {
                                    // Fallback: If findVaultFile failed but it's a local path, try to use it as filePath
                                    // This helps with direct app:// links
                                    currentMediaEntry.filePath = finalUrl;
                                }
                                // We do NOT update currentMediaEntry to this child, so subsequent labels apply to the parent bundle
                                // We do NOT push a new entry
                            } else {
                                // New Sibling Media

                                // AUTO-SPLIT LOGIC:
                                // If we are at Indent 0, and the previous item is "populated" (media, desc, or BETO),
                                // we treat this new URL as a separate sibling Node.
                                // We only attach if the previous item is a "fresh header" (Title only).
                                const isPopulated = currentItem && (
                                    currentItem.media.length > 0 ||
                                    (currentItem.desc && currentItem.desc.length > 0) ||
                                    (currentItem.title || '').toUpperCase() === 'BETO.888'
                                );

                                if (indentLevel === 0 && isPopulated) {
                                    currentItem = null; // Force creation of new item below
                                }

                                currentMediaEntry = {
                                    url: finalUrl,
                                    label: "",
                                    emojis: [],
                                    videoSrc: null,
                                    filePath: resolvedFile ? resolvedFile.path : null
                                };
                                console.log(`[ParserDebug] NEW ENTRY: ${finalUrl}`);
                                lastMediaIndent = indentLevel;

                                if (currentItem) {
                                    currentItem.media.push({ ...currentMediaEntry });
                                    // RE-LINK: Since we cloned, we need currentMediaEntry to point to the live one in the array
                                    // so subsequent labels/videosSrc apply to the same object.
                                    currentMediaEntry = currentItem.media[currentItem.media.length - 1];
                                } else {
                                    // Orphaned media
                                    let smartTitle = "TACTICAL_VISUAL";
                                    try {
                                        if (finalUrl.startsWith('http')) {
                                            smartTitle = new URL(finalUrl).hostname.replace('www.', '').toUpperCase();
                                        } else {
                                            const match = finalUrl.match(/\/([^\/]+)\.\w+$/);
                                            if (match) smartTitle = match[1].replace(/[_-]/g, ' ').toUpperCase();
                                        }
                                    } catch (e) { }

                                    currentItem = {
                                        id: `item-${idCounter++}`,
                                        title: smartTitle,
                                        desc: "",
                                        media: [{ ...currentMediaEntry }],
                                        emojis: []
                                    };
                                    currentMediaEntry = currentItem.media[0];
                                    yearsMap[currentYear][currentMonth].push(currentItem);
                                }
                            }
                            inEmojiMode = false; // Reset for new entry
                        } else {
                            // 1. Check for timestamp (e.g. 0:33, 1:45)
                            const timeMatch = content.match(/^(\d+):(\d{2})$/);
                            if (timeMatch && currentMediaEntry && indentLevel > 0) {
                                const mins = parseInt(timeMatch[1], 10);
                                const secs = parseInt(timeMatch[2], 10);
                                currentMediaEntry.startTime = mins * 60 + secs;
                                console.log(`AnimationTool: Found startTime ${currentMediaEntry.startTime}s for ${currentMediaEntry.url}`);
                                continue;
                            }

                            // 2. Check for Flight Path (e.g. Canada -> Japan)
                            const flightMatch = content.match(/^(.+?)\s*->\s*(.+?)$/);
                            if (flightMatch && currentItem && indentLevel > 0) {
                                currentItem.media.push({
                                    type: 'flight',
                                    from: flightMatch[1].trim(),
                                    to: flightMatch[2].trim(),
                                    label: content.toUpperCase(),
                                    emojis: []
                                });
                                continue;
                            }

                            // Label or New Item
                            if (currentMediaEntry && indentLevel > 0) {
                                if (!currentMediaEntry.label) currentMediaEntry.label = content;
                            } else if (currentItem && indentLevel > 0) {
                                // AGGREGATION: Append non-media indented bullets to the item's description
                                // This makes "Goals" into one slide with a list.
                                if (currentItem.desc) currentItem.desc += "\n";
                                currentItem.desc += `• ${content}`;
                            } else {
                                // New Item Validation
                                if (!currentMonth) continue;

                                // Ensure Array Exists (Double Check)
                                if (!yearsMap[currentYear][currentMonth]) {
                                    yearsMap[currentYear][currentMonth] = [];
                                    yearsMap[currentYear][currentMonth].comments = [];
                                }

                                // AGGREGATION: Append bullets to description in 2026
                                if (currentYear === "2026" && currentItem) {
                                    if (currentItem.desc) currentItem.desc += "\n";
                                    currentItem.desc += `• ${content}`;
                                    continue;
                                }

                                currentItem = {
                                    id: `item-${idCounter++}`,
                                    title: content,
                                    desc: ``,
                                    media: [],
                                    emojis: []
                                };
                                currentMediaEntry = null;
                                lastMediaIndent = -1; // FORCE RESET to prevent ghost merges
                                yearsMap[currentYear][currentMonth].push(currentItem);
                            }
                        }
                    } else if (line.match(/^\s*##\s+(.+)/) && currentYear === "2026") {
                        // Support custom "## Heading" as distinct slide titles in 2026
                        const title = line.replace(/^\s*##\s+/, '').trim();
                        currentMonth = title; // Use title as dynamic group key
                        if (!yearsMap[currentYear][currentMonth]) {
                            const mArr = []; mArr.comments = [];
                            yearsMap[currentYear][currentMonth] = mArr;
                            if (groupOrders[currentYear] && !groupOrders[currentYear].includes(currentMonth)) {
                                groupOrders[currentYear].push(currentMonth);
                            }
                        }
                        currentItem = { id: `item-finale-${idCounter++}`, title, desc: "", media: [], emojis: [] };
                        yearsMap[currentYear][currentMonth].push(currentItem);
                    } else if (line.match(/^[-*+]\s+/) && currentMonth) {
                        // Special 2026 Aggregation for non-indented bullets
                        if (currentYear === "2026" && currentItem) {
                            const content = line.trim().replace(/^[-*+]\s+/, '');
                            if (currentItem.desc) currentItem.desc += "\n";
                            currentItem.desc += `• ${content}`;
                            continue;
                        }

                        const content = line.trim().replace(/^[-*+]\s+/, '');
                        currentItem = {
                            id: `item-${idCounter++}`,
                            title: content,
                            desc: ``,
                            media: [],
                            emojis: []
                        };
                        currentMediaEntry = null;
                        yearsMap[currentYear][currentMonth].push(currentItem);
                    }
                }

                // Final Assembly
                const targetYears = ["2025", "2026"];
                const finalYears = targetYears.map(y => {
                    const sortedGroups = (y === "2026" && groupOrders[y]?.length) ? groupOrders[y] : monthNames.filter(m => yearsMap[y] && yearsMap[y][m] && yearsMap[y][m].length > 0);

                    const groups = sortedGroups.map(m => {
                        const monthData = (yearsMap[y] && yearsMap[y][m]) ? yearsMap[y][m] : [];
                        const items = Array.from(monthData);
                        const comments = monthData.comments || [];
                        return { name: m.toUpperCase(), items, comments };
                    });
                    return { year: y, groups };
                });

                setGraphData({ years: finalYears });
            } catch (e) {
                console.warn("AnimationTool: Data load failure, using mock fallback", e);
                // Resilient Mock Fallback
                const mockRecap = {
                    years: [
                        {
                            year: "2025",
                            groups: monthNames.map(m => {
                                if (m === "January") return {
                                    name: "JANUARY 2025",
                                    items: [{
                                        title: "TRAVEL SETUP",
                                        desc: "Initial deployment synchronized.",
                                        media: [{ type: 'flight', from: 'Canada', to: 'Japan' }]
                                    }]
                                };
                                if (m === "February") return {
                                    name: "FEBRUARY 2025",
                                    items: [{
                                        title: "REMASTER DATACORE",
                                        desc: "Flexilis enhancement module active.",
                                        media: []
                                    }]
                                };
                                return { name: `${m.toUpperCase()} 2025`, items: [] };
                            })
                        }
                    ]
                };
                setGraphData(mockRecap);
            }
        }
        loadData();
    }, []);

    // Full Tab Logic
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `animationtool-fulltab-${instanceId}`;

    const autoPlayStateRef = useRef(false);
    useEffect(() => {
        autoPlayStateRef.current = isAutoPlayActive;
    }, [isAutoPlayActive]);

    // CINEMATIC FULLSCREEN INTEGRATION (from ScreenModeHelper)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (isAutoPlayActive) {
            if (!document.fullscreenElement) {
                applyBrowserMode(container);
            }
        } else {
            if (document.fullscreenElement === container) {
                document.exitFullscreen?.();
            }
        }

        const handleFsChange = () => {
            // Only deactivate if we are NOT in fullscreen anymore 
            // AND we actually wanted to be in fullscreen.
            if (!document.fullscreenElement) {
                setIsAutoPlayActive(false);
                setIsCinematicReady(false); // Reset animation state on exit
            } else {
                // ENTERING FULLSCREEN:
                // Wait for browser transition to finish, then trigger "Scene Build"
                setTimeout(() => {
                    if (isAutoPlayActive) setIsCinematicReady(true);
                }, 400); // 400ms delay for smoothness
            }
        };

        const eventName = document.webkitFullscreenElement !== undefined ? 'webkitfullscreenchange' : 'fullscreenchange';
        document.addEventListener(eventName, handleFsChange);
        return () => document.removeEventListener(eventName, handleFsChange);
    }, [isAutoPlayActive]);

    // Auto-Hide Header on Cinematic Mode
    useEffect(() => {
        if (isAutoPlayActive) {
            setShowHeader(false);
        } else {
            setShowHeader(true);
        }
    }, [isAutoPlayActive]);

    useEffect(() => {
        const hk = e => {
            if (e.code === 'Space') {
                e.preventDefault();
                console.log("AnimationTool: Space toggle from App");
                setIsAutoPlayActive(prev => !prev);
            } else if (autoPlayStateRef.current) {
                // Ignore Arrow Keys (let NodeGraph handle them)
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') return;

                console.log("AnimationTool: Key interrupt from App");
                setIsAutoPlayActive(false);
            }
        };
        window.addEventListener('keydown', hk);
        return () => window.removeEventListener('keydown', hk);
    }, []); // Run once

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (isFullTab) {
            if (!container.parentNode) {
                setTimeout(() => setIsFullTab(true), 50);
                return;
            }

            const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
            if (!targetPaneContent) {
                // Fallback or retry if DOM isn't ready
                setIsFullTab(false);
                return;
            }

            const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
            stateRefs.originalParent = container.parentNode;
            stateRefs.placeholder = document.createElement('div');
            stateRefs.placeholder.style.display = 'none';
            container.parentNode.insertBefore(stateRefs.placeholder, container);

            const computedParentPosition = window.getComputedStyle(contentWrapper).position;
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position
            };

            if (computedParentPosition === 'static') {
                contentWrapper.style.position = "relative";
            }

            contentWrapper.appendChild(container);
            Object.assign(container.style, {
                position: "absolute",
                top: "0px",
                left: "0px",
                width: "100%",
                height: "100%",
                zIndex: "9998",
                overflow: "hidden" // Animation tool usually needs hidden overflow
            });
        }

        // Cleanup
        return () => {
            if (!stateRefs.originalParent) return;
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
            } else {
                stateRefs.originalParent.appendChild(container);
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position = stateRefs.parentPositionInfo.originalInlinePosition || '';
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
        };
    }, [isFullTab]);

    // Styles
    const compactWrapperStyle = {
        padding: '16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        border: '1px dashed #2d2d2d',
        borderRadius: '8px',
        backgroundColor: '#0a0a0a',
        color: '#888'
    };

    if (!isFullTab) {
        return (
            <div ref={containerRef} style={compactWrapperStyle}>
                <p>Animation Tool in compact mode.</p>
                <button onClick={() => setIsFullTab(true)}>Enter Full Tab</button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={uniqueWrapperClass} style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000000',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header / Navigation - Hidden in Cinematic Mode for immersion */}
            {/* Hover Trigger Zone (Top Left) */}
            <div
                style={{
                    position: 'absolute', top: 0, left: 0, width: '200px', height: '60px',
                    zIndex: 9999, // Above header (conceptually) but header needs higher zIndex to key events when visible
                    pointerEvents: showHeader ? 'none' : 'auto', // Only active when header is hidden
                }}
                onMouseEnter={() => setShowHeader(true)}
            />

            {/* Retractable Header */}
            <div style={{
                height: '50px',
                padding: '0 20px',
                borderBottom: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10000,
                backgroundColor: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(10px)',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%', justifyContent: 'flex-end' }}>
                    <h2 style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.5px', fontSize: '18px' }}>Animation Tool Showcase</h2>

                    <button
                        onClick={() => setShowHeader(false)}
                        title="Hide Header"
                        style={{
                            background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '4px', display: 'flex'
                        }}
                    >
                        {/* Chevron Up Icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                    </button>

                    <button
                        onClick={() => setIsFullTab(false)}
                        style={{
                            background: 'transparent',
                            border: '1px solid #333',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            marginLeft: '10px'
                        }}
                    >
                        Exit Full Tab
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {/* Main Content Area */}
            <div className={`${isAutoPlayActive ? "cinematic-mode-active" : ""} ${isCinematicReady ? "cinematic-ready" : ""}`} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes pulse { 0% { opacity: 1; box-shadow: 0 0 10px #a855f7; } 50% { opacity: 0.5; box-shadow: 0 0 4px #a855f7; } 100% { opacity: 1; box-shadow: 0 0 10px #a855f7; } }
                    
                    /* --- Cinematic Mode Transitions --- */
                    .cinematic-wrapper {
                        width: 100%; height: 100%;
                        transition: transform 1.5s cubic-bezier(0.1, 0.6, 0.2, 1), opacity 0.5s ease;
                        transform: scale(1);
                        transform-origin: center center;
                    }
                    /* Trigger only when READY (in fullscreen) */
                    .cinematic-mode-active.cinematic-ready .cinematic-wrapper {
                        transform: scale(0.95); /* Zoom OUT slightly to frame content within bars */
                    }

                    /* Letterbox Bars */
                    .letterbox-bar {
                        position: absolute; left: 0; width: 100%; height: 0;
                        background: #000;
                        z-index: 9000;
                        transition: height 1.2s cubic-bezier(0.65, 0, 0.35, 1);
                        pointer-events: none;
                    }
                    .letterbox-top { top: 0; }
                    .letterbox-bottom { bottom: 0; }
                    
                    /* Triggers on READY */
                    .cinematic-mode-active.cinematic-ready .letterbox-bar {
                        height: 8vh; /* Reduced height to minimize obstruction */
                    }

                    /* Vignette Overlay */
                    .vignette-overlay {
                        position: absolute; inset: 0;
                        background: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 120%);
                        opacity: 0;
                        transition: opacity 1.5s ease-in-out;
                        pointer-events: none;
                        z-index: 500;
                    }
                    .cinematic-mode-active.cinematic-ready .vignette-overlay {
                        opacity: 1;
                    }

                    /* Tech Grid Background (Scene Build) */
                    .tech-grid {
                        position: absolute; inset: 0;
                        background-image:
                            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                        background-size: 80px 80px;
                        opacity: 0;
                        transform: scale(1.2);
                        transition: opacity 2s ease, transform 2s cubic-bezier(0.1, 0.6, 0.2, 1);
                        pointer-events: none;
                        z-index: 1;
                        mix-blend-mode: overlay;
                    }
                    .cinematic-mode-active.cinematic-ready .tech-grid {
                        opacity: 1;
                        transform: scale(1.0);
                    }
                `}</style>

                {/* Overlays */}
                <div className="letterbox-bar letterbox-top" />
                <div className="letterbox-bar letterbox-bottom" />
                <div className="vignette-overlay" />
                <div className="tech-grid" />

                {/* Content */}
                <div className="cinematic-wrapper">
                    <NodeGraph
                        data={graphData}
                        isAutoPlayActive={isAutoPlayActive}
                        setIsAutoPlayActive={setIsAutoPlayActive}
                        folderPath={folderPath}
                    />
                </div>
            </div>
        </div>
    );
}

return { AnimationTool };
