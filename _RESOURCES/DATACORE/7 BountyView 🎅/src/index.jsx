/**
 * 7 BountyView - Radial Header Navigation
 * Consolidated Master Protocol (Rule #13)
 */
async function View({ folderPath }) {
    const { useState, useEffect, useRef, useMemo } = dc;

    // 1. Safe Agent Layer (Rule #10)
    const Agent = {
        timer: null,
        start: (fPath, onReload) => {
            const cmdFile = fPath + '/mcp_commands.json';
            Agent.timer = setInterval(async () => {
                try {
                    const adapter = dc.app.vault.adapter;
                    if (!(await adapter.exists(cmdFile))) return;
                    const content = await adapter.read(cmdFile);
                    const cmd = JSON.parse(content);
                    if (cmd && cmd.executed === false && cmd.action === 'reload') {
                        cmd.executed = true;
                        cmd.executedAt = new Date().toISOString();
                        await adapter.write(cmdFile, JSON.stringify(cmd, null, 2));
                        onReload();
                    }
                } catch (e) {}
            }, 1000);
            return () => clearInterval(Agent.timer);
        }
    };

    /* ---------------------- UTILITIES ---------------------- */
    const parseHeaderName = (str) => {
        let cleaned = str.replace(/\[\[|\]\]/g, "").trim();
        if (cleaned.includes("|")) cleaned = cleaned.split("|").pop().trim();
        return cleaned;
    };

    const angleDiff = (a, b) => {
        let diff = a - b;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        return diff;
    };

    const pickClosestSlot = (availableSlots, targetAngle) => {
        let bestSlot = availableSlots[0];
        let bestDiff = Math.abs(angleDiff(bestSlot, targetAngle));
        for (let i = 1; i < availableSlots.length; i++) {
            const d = Math.abs(angleDiff(availableSlots[i], targetAngle));
            if (d < bestDiff) { bestSlot = availableSlots[i]; bestDiff = d; }
        }
        return bestSlot;
    };

    /* ---------------------- SUB-COMPONENTS ---------------------- */

    const GetImagesPlaceholders = ({ iconName = "PHYSICAL", size = 42, x = 0, y = 0 }) => {
        const files = dc.useQuery(`@file and endswith($path, "${iconName}.svg")`);
        if (files && files.length > 0) {
            return (
                <foreignObject x={x} y={y} width={size} height={size} style={{ overflow: "visible" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <dc.Markdown content={`![[${files[0].$path}]]`} />
                    </div>
                </foreignObject>
            );
        }
        return (
            <svg x={x} y={y} width={size} height={size} viewBox="0 0 1920 1920" style={{ outline: "none" }}>
                <path fill="#fff" opacity="0.1" d="M1052.08,802.24c-5.22,0-10.37-2.41-13.67-6.95-5.49-7.54-3.83-18.11,3.71-23.61,56.28-40.98,72.42-117.43,37.55-177.82-18.16-31.46-47.49-53.96-82.57-63.36-35.09-9.4-71.73-4.58-103.19,13.59-31.46,18.16-53.96,47.49-63.36,82.58-9.4,35.09-4.58,71.74,13.58,103.19,9.38,16.25,21.71,30.11,36.64,41.19,7.49,5.56,9.06,16.15,3.5,23.64-5.56,7.5-16.14,9.06-23.64,3.5-18.66-13.85-34.06-31.16-45.77-51.44-46.81-81.08-18.93-185.12,62.15-231.93,39.28-22.68,85.04-28.7,128.83-16.96,43.81,11.74,80.42,39.83,103.1,79.11,43.53,75.4,23.36,170.85-46.93,222.04-3,2.19-6.48,3.24-9.93,3.24Z"/>
            </svg>
        );
    };

    const CenterNode = ({ label, radius, onMiddleClick }) => {
        const icon = parseHeaderName(label).replace(".namzu", "");
        return (
            <g onClick={onMiddleClick} style={{ cursor: "pointer" }}>
                <circle r={radius} fill="#000" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <GetImagesPlaceholders iconName={icon} size={radius * 1.5} x={-radius * 0.75} y={-radius * 0.75} />
                <text fill="#fff" fontSize={radius / 3} fontWeight="900" textAnchor="middle" dy=".3em" style={{ letterSpacing: '0.1em' }}>{icon.toUpperCase()}</text>
            </g>
        );
    };

    const OuterNode = ({ header, radius, angle, onClick, ring = 2 }) => {
        const [hover, setHover] = useState(false);
        const label = parseHeaderName(header);
        const scale = hover ? (ring === 2 ? 1.2 : 1.4) : 1;
        const color = hover ? "#8b5cf6" : "#fff";

        return (
            <g 
                style={{ cursor: "pointer", transition: "all 0.2s" }} 
                transform={`scale(${scale})`}
                onMouseEnter={() => setHover(true)} 
                onMouseLeave={() => setHover(false)}
                onClick={() => onClick(label.endsWith(".namzu") ? label : `${label}.namzu`)}
            >
                <circle r={radius} fill="#000" stroke={hover ? "#8b5cf6" : "rgba(255,255,255,0.1)"} />
                <GetImagesPlaceholders iconName={label} size={radius * 1.4} x={-radius * 0.7} y={-radius * 0.7} />
                {hover && (
                    <text x={radius + 10} fill="#fff" fontSize="10" fontWeight="900" alignmentBaseline="middle">{label.toUpperCase()}</text>
                )}
            </g>
        );
    };

    /* ---------------------- MAIN VIEW ---------------------- */

    function BountyView() {
        const rootRef = useRef(null);
        const [center, setCenter] = useState("888.namzu");
        const [history, setHistory] = useState([]);
        const [isFullTab, setIsFullTab] = useState(true);

        const data = dc.useQuery(`@page and endswith($path, "${center}.md")`);
        const file = data?.[0];

        // FullTab Effect
        useEffect(() => {
            const container = rootRef.current;
            if (!container) return;
            const targetView = container.closest('.workspace-leaf-content');
            if (!targetView) return;
            const viewContent = targetView.querySelector('.view-content');
            if (viewContent) {
                const originalParent = container.parentNode;
                viewContent.appendChild(container);
                container.style.position = 'absolute';
                container.style.inset = '0';
                container.style.zIndex = '10';
                return () => { if (originalParent) originalParent.appendChild(container); };
            }
        }, []);

        const ring2Headers = useMemo(() => {
            if (!file) return [];
            const sections = file.$sections || [];
            return sections.filter(s => s.$level === 6).map(s => parseHeaderName(s.$title)).filter(t => !t.toLowerCase().includes("navigate"));
        }, [file]);

        const back = () => {
            if (history.length > 0) {
                const prev = history[history.length - 1];
                setHistory(history.slice(0, -1));
                setCenter(prev);
            }
        };

        const navigate = (next) => {
            setHistory([...history, center]);
            setCenter(next);
        };

        const width = 1000, height = 1000;
        const centerR = 60, ring2R = 200, ring2NodeR = 30;

        return (
            <div ref={rootRef} style={{ width: '100%', height: '100%', backgroundColor: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: '32px', position: 'absolute', top: 0, left: 0, zIndex: 20 }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button style={{ background: 'transparent', border: '1px solid #333', color: '#fff', padding: '10px 16px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.2em', cursor: 'pointer' }} onClick={() => { setCenter("888.namzu"); setHistory([]); }}>HOME</button>
                        {history.length > 0 && <button style={{ background: 'transparent', border: '1px solid #333', color: '#fff', padding: '10px 16px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.2em', cursor: 'pointer' }} onClick={back}>BACK</button>}
                    </div>
                </header>

                <svg width="100%" height="100%" viewBox={`-500 -500 1000 1000`}>
                    <defs>
                        <style>{`@keyframes rotateRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </defs>

                    {/* Ring 2 Lines */}
                    {ring2Headers.map((h, i) => {
                        const angle = (2 * Math.PI * i) / ring2Headers.length;
                        return <line key={i} x1="0" y1="0" x2={ring2R * Math.cos(angle)} y2={ring2R * Math.sin(angle)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
                    })}

                    {/* Ring 2 Nodes */}
                    {ring2Headers.map((h, i) => {
                        const angle = (2 * Math.PI * i) / ring2Headers.length;
                        return (
                            <g key={i} transform={`translate(${ring2R * Math.cos(angle)}, ${ring2R * Math.sin(angle)})`}>
                                <OuterNode header={h} radius={ring2NodeR} angle={angle} onClick={navigate} />
                            </g>
                        );
                    })}

                    {/* Center Node */}
                    <CenterNode label={center} radius={centerR} onMiddleClick={back} />
                </svg>

                <footer style={{ position: 'absolute', bottom: '32px', right: '32px', textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#333', fontWeight: '900', letterSpacing: '0.3em' }}>BETO GROUP RADIAL ENGINE v2.1</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '900' }}>{center.toUpperCase()}</div>
                </footer>
            </div>
        );
    }

    const SafeRoot = () => {
        const [key, setKey] = useState(0);
        useEffect(() => {
            return Agent.start(folderPath, () => {
                if (dc.app.workspace.activeLeaf?.rebuildView) dc.app.workspace.activeLeaf.rebuildView();
                else setKey(k => k + 1);
            });
        }, []);
        return <BountyView key={key} />;
    };

    return <SafeRoot />;
}

return { View };
