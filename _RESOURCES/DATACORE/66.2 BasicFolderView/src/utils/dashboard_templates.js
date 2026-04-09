const getStyles = () => `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
            :root {
                --accent: #8b5cf6;
                --accent-glow: rgba(139, 92, 246, 0.3);
                --bg: #09090b;
                --surface: #18181b;
                --surface-highlight: #27272a;
                --text: #e4e4e7;
                --text-dim: #a1a1aa;
                --border: #3f3f46;
                --success: #10b981;
                --error: #ef4444;
                --warning: #f59e0b;
            }
            body { 
                font-family: 'Inter', sans-serif; 
                background: var(--bg); 
                color: var(--text); 
                margin: 0; 
                display: flex; 
                height: 100vh;
                overflow: hidden;
                font-size: 14px;
            }
            
            /* Layout */
            .main-dash { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
            .content-area { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
            
            /* Header */
            .header { 
                padding: 16px 24px; 
                border-bottom: 1px solid var(--border); 
                background: rgba(9, 9, 11, 0.8);
                backdrop-filter: blur(12px);
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                z-index: 10;
            }
            .brand { display: flex; align-items: center; gap: 12px; }
            .brand h1 { margin: 0; font-weight: 700; font-size: 16px; letter-spacing: -0.5px; color: #fff; }
            .badge { 
                background: var(--accent); 
                color: white; 
                padding: 2px 8px; 
                border-radius: 4px; 
                font-weight: 600; 
                font-size: 10px; 
                box-shadow: 0 0 10px var(--accent-glow);
            }
            
            /* Status Bar */
            .meta-bar { display: flex; gap: 16px; align-items: center; font-size: 12px; font-family: 'JetBrains Mono'; color: var(--text-dim); }
            .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 8px var(--success); }
            .sync-time { color: var(--accent); font-weight: 600; animation: flash 1s ease-out; }
            @keyframes flash { 0% { color: white; text-shadow: 0 0 10px white; } 100% { color: var(--accent); } }

            /* Tabs */
            .tabs { display: flex; gap: 4px; background: var(--surface); padding: 4px; border-radius: 8px; border: 1px solid var(--border); }
            .tab-btn { 
                border: none; 
                background: transparent; 
                color: var(--text-dim); 
                padding: 6px 16px; 
                cursor: pointer; 
                font-size: 12px; 
                font-weight: 500; 
                border-radius: 6px; 
                transition: all 0.2s; 
            }
            .tab-btn:hover { color: var(--text); background: var(--surface-highlight); }
            .tab-btn.active { background: var(--surface-highlight); color: white; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
            
            .tab-content { display: none; flex-direction: column; gap: 12px; }
            .tab-content.active { display: flex; }
            
            /* Feeds */
            .feed-container { display: flex; flex-direction: column; gap: 8px; }
            .log-entry { 
                background: var(--surface); 
                border: 1px solid var(--border); 
                border-radius: 6px; 
                padding: 10px 14px; 
                font-family: 'JetBrains Mono'; 
                font-size: 12px;
                display: grid;
                grid-template-columns: 80px 100px 1fr;
                align-items: center;
                gap: 12px;
                animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes slideIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            
            .log-time { color: var(--text-dim); font-size: 11px; }
            .log-type { font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-align: center; }
            .type-info { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
            .type-warn { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }
            .type-error { background: rgba(239, 68, 68, 0.1); color: #f87171; }
            .log-msg { color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            
            /* Telegram Panel */
            .telegram-panel { display: flex; flex-direction: column; gap: 16px; height: 100%; }
            .login-form { display: flex; flex-direction: column; gap: 12px; background: var(--surface); padding: 20px; border-radius: 8px; border: 1px solid var(--border); }
            .login-form input { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 10px; border-radius: 4px; font-family: 'JetBrains Mono'; }
            .login-form button { background: #229ED9; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: 600; }
            .login-form button:hover { background: #1b8ec5; }
            .hint { font-size: 11px; color: var(--text-dim); margin-top: 4px; }
            .otp-box { display: flex; gap: 8px; }
            .otp-box input { flex: 1; }
            
            .msg-entry { background: var(--surface); padding: 12px; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
            .msg-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-dim); }
            .msg-sender { color: #229ED9; font-weight: 700; }
            .msg-text { font-size: 13px; line-height: 1.4; }

            /* Controls */
            .controls-bar { 
                padding: 12px 16px; 
                border-top: 1px solid var(--border); 
                background: var(--surface); 
                display: flex; 
                gap: 8px;
                align-items: center;
                flex-wrap: wrap; /* Allow wrapping on tiny screens */
            }
            .controls-start { flex: 1; min-width: 0; display:flex; align-items:center; gap:8px; color:var(--text-dim); font-size:11px; white-space:nowrap; overflow:hidden; }
            .controls-end { display: flex; gap: 8px; flex-shrink: 0; }
            
            button.action-btn { 
                background: var(--surface-highlight); 
                border: 1px solid var(--border); 
                color: var(--text); 
                padding: 6px 10px; 
                border-radius: 6px; 
                cursor: pointer; 
                font-weight: 500;
                font-size: 11px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
                height: 28px; /* Fixed height for consistency */
                white-space: nowrap;
            }
            button.action-btn:hover { background: var(--border); color: white; border-color: var(--text-dim); }
            button.icon-only { padding: 6px; width: 28px; justify-content: center; } 
            
            button.primary { background: var(--accent); border-color: var(--accent); color: white; }
            button.primary:hover { background: #7c3aed; border-color: #7c3aed; }
            
            /* Side Panel */
            .side-panel { 
                width: 320px; 
                background: var(--surface); 
                border-left: 1px solid var(--border); 
                display: flex; 
                flex-direction: column; 
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                overflow: hidden;
            }
            .side-panel.collapsed { width: 0; border: none; }
            
            .panel-header { 
                padding: 16px; 
                border-bottom: 1px solid var(--border); 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                background: var(--surface-highlight);
            }
            .panel-title { font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim); }
            .test-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
            
            .test-item { 
                padding: 10px; 
                border-radius: 6px; 
                font-size: 13px; 
                display: flex; 
                align-items: center; 
                gap: 10px; 
                background: rgba(255,255,255,0.02);
                border: 1px solid transparent;
                transition: all 0.2s;
            }
            .test-item:hover { background: rgba(255,255,255,0.05); }
            .test-item.pass { border-left: 3px solid var(--success); }
            .test-item.fail { border-left: 3px solid var(--error); background: rgba(239, 68, 68, 0.05); }
            .icon-pass { color: var(--success); }
            .icon-fail { color: var(--error); }

            /* Scrollbars */
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

            /* Details Animation */
            details > summary { list-style: none; }
            details > summary::-webkit-details-marker { display: none; }
            details > summary .arrow { transition: transform 0.2s; }
            details[open] > summary .arrow { transform: rotate(180deg); }
            
            .cmd-card { background: var(--surface-highlight); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display:flex; flex-direction:column; gap:8px; transition:transform 0.2s; }
            .cmd-card:hover { transform: translateY(-2px); border-color: var(--accent); }
            .cmd-header { display:flex; justify-content:space-between; align-items:center; }
            .cmd-name { font-family:'JetBrains Mono'; font-weight:700; color:var(--accent); background:rgba(139,92,246,0.1); padding:2px 6px; border-radius:4px; }
            .cmd-desc { color:var(--text-dim); font-size:12px; margin:0; line-height:1.4; flex:1; }
            .badgex { font-size:10px; text-transform:uppercase; color:var(--text-dim); letter-spacing:0.5px; border:1px solid var(--border); padding:2px 4px; border-radius:3px;}
            .action-btn.x-small { font-size:10px; padding:4px 8px; align-self:flex-start; margin-top:8px;}
            .cmd-usage { background:rgba(0,0,0,0.3); padding:8px; border-radius:4px; font-family:'JetBrains Mono'; font-size:10px; color:var(--text-dim); margin-top:8px; white-space:pre-wrap; }
            
            /* Modal Styles */
            .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 100; justify-content: center; align-items: center; }
            .modal.visible { display: flex; animation: fadeIn 0.15s ease-out; }
            .modal-content { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; width: 90%; max-width: 400px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.4); overflow: hidden; }
            .modal-header { padding: 12px 16px; background:var(--surface-highlight); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
            .modal-header h3 { margin: 0; font-size: 13px; color: var(--text); font-weight:600; }
            .close-btn { background: none; border: none; color: var(--text-dim); font-size: 18px; cursor: pointer; padding:0; line-height:1; }
            .modal-body { padding: 0; overflow-y: auto; }
            .modal-footer { padding: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; background:var(--surface); }
            
            .detail-hero { padding: 16px; background: linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%); border-bottom:1px solid var(--border); text-align:center; }
            .hero-label { font-size:9px; text-transform:uppercase; letter-spacing:1px; color:var(--accent); font-weight:700; margin-bottom:4px; display:block; }
            .hero-action { font-size:18px; font-family:'JetBrains Mono'; font-weight:700; color:white; }
            
            .detail-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background:var(--border); }
            .detail-row { background: var(--surface); padding: 8px 16px; display: grid; grid-template-columns: 80px 1fr; gap: 12px; align-items: baseline; font-size: 12px; }
            @keyframes fadeIn { from { opacity: 0; transform:scale(0.98); } to { opacity: 1; transform:scale(1); } }
`;

const getBody = (fPath) => `
        <!-- Main Area -->
        <div class="main-dash">
            <div class="header">
                <div class="brand">
                    <span class="badge">66.6</span>
                    <!-- H1 hidden on tiny screens -->
                    <h1 style="display:none">Console</h1> 
                </div>
                
                <div class="tabs">
                    <button class="tab-btn active" onclick="window.showTab('activity', this)">Activity</button>
                    <!-- <button class="tab-btn" onclick="window.showTab('logs', this)">System Logs</button> -->
                    <button class="tab-btn" onclick="window.showTab('docs', this)">Docs</button>
                    <button class="tab-btn" onclick="window.showTab('telegram', this)">Telegram</button>
                </div>

                <div class="meta-bar">
                    <div id="bridge-status" style="display:flex;align-items:center;gap:6px">
                        <div class="status-dot" style="background:var(--text-dim); box-shadow:none"></div>
                        <span>SYNCING...</span>
                    </div>
                </div>
            </div>
            
            <div class="content-area">
                <div id="activity-tab" class="tab-content active">
                    <div id="activity-feed" class="feed-container">
                        <!-- JS injected -->
                        <div style="text-align:center; padding:40px; color:var(--text-dim)">
                            <div style="font-size:24px; margin-bottom:8px">📡</div>
                            Waiting for agent...
                        </div>
                    </div>
                </div>

                <div id="logs-tab" class="tab-content">
                    <div id="log-feed" class="feed-container">
                        <!-- JS injected -->
                    </div>
                </div>

                <div id="docs-tab" class="tab-content">
                    <div style="padding:0 12px">
                        <h2 style="margin-top:0; font-size:16px; color:var(--accent)">MCP Command Reference</h2>
                        <div id="docs-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-top:16px;">
                            <!-- Injected via JS -->
                        </div>
                    </div>
                </div>

                <div id="telegram-tab" class="tab-content">
                    <div id="telegram-root" class="telegram-panel">
                        
                        <!-- Configuration Section -->
                        <details id="tg-config-details" open style="background:var(--surface); border:1px solid var(--border); border-radius:8px; overflow:hidden;">
                            <summary style="padding:12px 16px; cursor:pointer; font-weight:600; background:var(--surface-highlight); outline:none; list-style:none; display:flex; justify-content:space-between; align-items:center;">
                                <span>🔐 Configuration</span>
                                <span class="arrow" style="font-size:10px; opacity:0.5">▼</span>
                            </summary>
                            
                            <div id="tg-login" class="login-form" style="border:none; border-top:1px solid var(--border); border-radius:0;">
                                <h3 style="margin:0">Telegram Login</h3>
                                <div style="display:flex; gap:12px; margin-bottom:8px; font-size:12px;">
                                    <label style="display:flex; gap:4px; align-items:center; cursor:pointer">
                                        <input type="radio" name="login-mode" value="user" checked onchange="toggleLoginMode()" /> User
                                    </label>
                                    <label style="display:flex; gap:4px; align-items:center; cursor:pointer">
                                        <input type="radio" name="login-mode" value="bot" onchange="toggleLoginMode()" /> Bot
                                    </label>
                                </div>

                                <input id="tg-api-id" placeholder="API ID" type="text" oninput="autoSaveCreds()" />
                                <input id="tg-api-hash" placeholder="API Hash" type="password" oninput="autoSaveCreds()" />
                                
                                <div id="mode-user-fields">
                                    <input id="tg-phone" placeholder="Phone (+1...)" type="text" style="width:100%; box-sizing:border-box; margin-bottom:10px" oninput="autoSaveCreds()" />
                                </div>
                                
                                <div id="mode-bot-fields" style="display:none">
                                    <input id="tg-bot-token" placeholder="Bot Token (1234:AbCd...)" type="password" style="width:100%; box-sizing:border-box; margin-bottom:10px" oninput="autoSaveCreds()" />
                                </div>

                                <label style="font-size:11px; color:var(--text-dim); display:flex; gap:6px; align-items:center; cursor:pointer; margin-top:4px">
                                    <input type="checkbox" id="tg-save-creds" checked /> Save to Obsidian Keychain 🔒
                                </label>
                                <div id="tg-otp-area" class="otp-box" style="display:none">
                                    <input id="tg-code" placeholder="Enter OTP Code" />
                                    <button onclick="submitTgCode()">Verify</button>
                                </div>
                                <button id="tg-connect-btn" onclick="startTgLogin()">Connect</button>
                                <div id="tg-status" class="hint"></div>
                            </div>
                        </details>
                        
                        <!-- Persistent Feed Section -->
                        <div id="tg-feed" style="display:flex; flex-direction:column; gap:8px; flex:1; min-height:0; margin-top:16px;">
                             <div class="status-bar" style="background:rgba(34,158,217,0.1); color:#229ED9; padding:8px; border-radius:4px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
                                <span id="tg-connection-status">● Offline</span>
                                <label style="display:flex; gap:6px; align-items:center; cursor:pointer">
                                    <input type="checkbox" id="tg-auto-fwd" checked onchange="toggleAutoFwd()"> 
                                    Auto-Forward Prompts
                                </label>
                            </div>
                            <div style="font-weight:600; font-size:12px; color:var(--text-dim); margin-top:8px;">Live Messages</div>
                            <div id="tg-messages" style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; padding-bottom:10px;"></div>
                        </div>

                        <!-- Compose Section -->
                         <div style="padding:12px; background:var(--surface); border-top:1px solid var(--border); display:flex; gap:8px; align-items:center; border-radius:8px;">
                            <input id="tg-recipient" placeholder="@username" style="width:120px; background:var(--bg); border:1px solid var(--border); color:var(--text); padding:8px; border-radius:4px; font-family:'JetBrains Mono';" />
                            <input id="tg-msg-content" placeholder="Type a message..." style="flex:1; background:var(--bg); border:1px solid var(--border); color:var(--text); padding:8px; border-radius:4px;" onkeydown="if(event.key==='Enter') sendTgMessage()" />
                            <button id="tg-send-btn" onclick="sendTgMessage()" class="action-btn primary" style="height:34px;">Send</button>
                        </div>
                         <div style="padding:0 12px 12px 12px; display:flex; justify-content:flex-end; gap:8px;">
                             <button onclick="nuclearReset()" class="action-btn" style="font-size:10px; opacity:0.7; color:var(--error); border-color: rgba(239, 68, 68, 0.3)" title="Delete session files & force code reload">☢️ Nuclear Reset</button>
                             <button onclick="resetTgSession()" class="action-btn" style="font-size:10px; opacity:0.7">Reset Bridge Session</button>
                             <button onclick="testTgConnection()" class="action-btn" style="font-size:10px; opacity:0.7">Test Connection (GetMe)</button>
                         </div>
                        
                        <!-- Debug Console -->
                        <div style="padding:12px; border-top:1px solid var(--border);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <div style="font-size:11px; font-weight:600; color:var(--text-dim);">Debug Console</div>
                                <button onclick="document.getElementById('debug-console').innerHTML=''" class="action-btn x-small" style="font-size:9px; padding:2px 6px; height:auto;">Clear</button>
                            </div>
                            <div id="debug-console" style="height:100px; background:#000; border:1px solid var(--border); border-radius:4px; padding:8px; overflow-y:auto; font-family:'JetBrains Mono'; font-size:10px; color:#aaa; white-space:pre-wrap;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Details Modal -->
            <div id="detail-modal" class="modal" onclick="closeModal(event)">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detailed View</h3>
                        <button class="close-btn" onclick="closeModal()">×</button>
                    </div>
                    <div id="modal-body" class="modal-body"></div>
                    <div class="modal-footer">
                        <button id="retry-btn" class="action-btn" onclick="retryCurrentAction()">↻ Retry Action</button>
                    </div>
                </div>
            </div>

            <div class="controls-bar">
                <div class="controls-start">
                    <span style="width:6px; height:6px; background:var(--success); border-radius:50%"></span>
                    <strong style="color:var(--text); text-overflow:ellipsis; overflow:hidden;">${fPath.split('/').pop()}</strong>
                </div>
                <div class="controls-end">
                    <button class="action-btn icon-only" title="Clear History" onclick="clearHistory()">🗑️</button>
                    <button class="action-btn icon-only" title="Settings" onclick="triggerAction('open_settings')">⚙️</button>
                    <button class="action-btn icon-only" title="Inspect" onclick="triggerAction('devtools')">🔍</button>
                    <button class="action-btn" title="Reload Frame" onclick="triggerAction('reload')">⚡ Reload</button>
                    <button class="action-btn primary" title="Run Unit Tests" onclick="triggerAction('run_tests')">▶ Test</button>
                </div>
            </div>
                </div>
            </div>
`;

const getScript = (fPath, results) => `
                // Global Error Handler
                window.onerror = function(msg, url, line) {
                    const err = "Script Error: " + msg + " (" + line + ")";
                    alert(err); // Visual alert for the user
                    console.error(err);
                };

                // Tab Logic (Hoisted)
                window.showTab = function(tab, btn) {
                    console.log("Switching to tab:", tab);
                    try {
                        const allContents = document.querySelectorAll('.tab-content');
                        const allBtns = document.querySelectorAll('.tab-btn');
                        
                        allContents.forEach(c => c.style.display = 'none');
                        allBtns.forEach(b => b.classList.remove('active'));
                        
                        const target = document.getElementById(tab + '-tab');
                        if (target) {
                            target.style.display = 'flex';
                            target.classList.add('active'); // Keep class for potential CSS usage
                        } else {
                           alert("Tab not found: " + tab);
                        }

                        if (btn) btn.classList.add('active');
                    } catch(e) { 
                        alert("Tab Error: " + e.message);
                        console.error(e); 
                    }
                };

                let fs, path, FOLDER_PATH, ACTIVITY_FILE, LOGS_FILE, COMMAND_FILE, SCHEMA_FILE;
                let currentLogDetails = null;
                // tgBridge removed - using MCP calls
                let tgAutoPush = true;

                // Helper to send commands and wait for result
                async function sendMcpCommand(action, data = {}) {
                    const cmd = { action, ...data, executed: false, id: Date.now() };
                    try {
                        fs.writeFileSync(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                    } catch(e) { throw new Error("Failed to write command: " + e.message); }
                    
                    return new Promise((resolve, reject) => {
                        let checks = 0;
                        const interval = setInterval(() => {
                            checks++;
                            if (checks > 60) { // 30s timeout for login flows
                                clearInterval(interval);
                                reject(new Error("Timeout waiting for MCP Bridge"));
                                return;
                            }
                            try {
                                const content = fs.readFileSync(COMMAND_FILE, 'utf8');
                                const curr = JSON.parse(content);
                                if (curr.id === cmd.id && curr.executed) {
                                    clearInterval(interval);
                                    if (curr.result && typeof curr.result === 'string' && curr.result.startsWith('Error')) reject(new Error(curr.result));
                                    else resolve(curr.result);
                                }
                            } catch(e) {}
                        }, 500);
                    });
                }

                // Console Override
                const debugConsole = document.getElementById('debug-console');
                if (debugConsole) {
                    ['log', 'warn', 'error'].forEach(method => {
                        const original = console[method];
                        console[method] = (...args) => {
                            if (original) original.apply(console, args);
                            if (debugConsole) {
                                const msg = args.map(a => {
                                    if (a instanceof Error) return a.toString();
                                    return typeof a === 'object' ? JSON.stringify(a) : String(a)
                                }).join(' ');
                                const line = document.createElement('div');
                                line.style.color = method === 'error' ? '#ff5555' : (method === 'warn' ? '#ffb86c' : '#aaa');
                                line.style.marginBottom = '2px';
                                line.textContent = '> ' + msg;
                                debugConsole.appendChild(line);
                                debugConsole.scrollTop = debugConsole.scrollHeight;
                            }
                        };
                    });
                }

                // Telegram Logic
                function toggleLoginMode() {
                    const isBot = document.querySelector('input[name="login-mode"]:checked').value === 'bot';
                    document.getElementById('mode-user-fields').style.display = isBot ? 'none' : 'block';
                    document.getElementById('mode-bot-fields').style.display = isBot ? 'block' : 'none';
                }

                async function startTgLogin() {
                    const apiId = document.getElementById('tg-api-id').value;
                    const apiHash = document.getElementById('tg-api-hash').value;
                    const status = document.getElementById('tg-status');
                    const saveCreds = document.getElementById('tg-save-creds').checked;
                    
                    const isBot = document.querySelector('input[name="login-mode"]:checked').value === 'bot';
                    const phone = document.getElementById('tg-phone').value;
                    const botToken = document.getElementById('tg-bot-token').value;

                    if (!apiId || !apiHash || (!isBot && !phone) || (isBot && !botToken)) {
                        status.innerText = "Please fill all fields";
                        status.style.color = "var(--error)";
                        return;
                    }
                    
                    if (saveCreds) {
                        status.innerText = "Saving to Keychain...";
                        await saveToKeychain(apiId, apiHash, phone, botToken);
                    }

                    status.innerText = "Initiating Connection...";
                    status.style.color = "var(--text-dim)";

                    try {
                        const result = await sendMcpCommand('telegram_connect', { apiId, apiHash, phone, botToken });
                        status.innerText = result;
                        status.style.color = "var(--success)";
                        
                        if (result.includes("Waiting for Code")) {
                             document.getElementById('tg-otp-area').style.display = 'flex';
                             document.getElementById('tg-connect-btn').style.display = 'none';
                        } else {
                             // Success immediately (bot)
                             showTgFeed();
                        }
                    } catch (e) {
                        status.innerText = "Error: " + e.message;
                        status.style.color = "var(--error)";
                        console.error(e);
                    }
                }

                async function sendTgMessage() {
                    const recipient = document.getElementById('tg-recipient').value;
                    const content = document.getElementById('tg-msg-content').value;
                    const btn = document.getElementById('tg-send-btn');
                    
                    if (!recipient || !content) return;

                    try {
                        btn.innerText = "Sending...";
                        btn.disabled = true;
                        
                        await sendMcpCommand('telegram_send', { to: recipient, text: content });
                        
                        document.getElementById('tg-msg-content').value = "";
                        btn.innerText = "Send";
                        btn.disabled = false;
                        
                        // Optimistically declare success
                        addLogEntry('telegram', 'SENT', 'Sent to ' + recipient);
                    } catch (e) {
                        alert("Failed to send: " + e.message);
                        btn.innerText = "Send";
                        btn.disabled = false;
                    }
                }

                async function testTgConnection() {
                    const status = document.getElementById('tg-status');
                    try {
                        status.innerText = "Testing connection...";
                        const result = await sendMcpCommand('telegram_status');
                        alert(result);
                        status.innerText = "Connection verified ✓";
                    } catch(e) {
                         alert("Connection Test Failed: " + e.message);
                         status.innerText = "Connection Failed ✗";
                         status.style.color = "var(--error)";
                    }
                }

                async function saveToKeychain(apiId, apiHash, phone, botToken) {
                    const cmd = { 
                        action: 'save_telegram_creds', 
                        apiId, apiHash, phone, botToken,
                        executed: false 
                    };
                    fs.writeFileSync(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                }

                async function resetTgSession() {
                    const status = document.getElementById('tg-status');
                    status.innerText = "Resetting local session...";
                    try {
                        await sendMcpCommand('telegram_disconnect');
                        alert("Local Bridge Disconnected. Please restart the project view.");
                        location.reload();
                    } catch(e) {
                        alert("Reset failed: " + e.message);
                    }
                }

                async function nuclearReset() {
                    if (!confirm("☢️ NUCLEAR RESET: This will delete ALL session files and force a full reload of the bridge script. Use this to fix AUTH_KEY_DUPLICATED errors. Proceed?")) return;
                    
                    const status = document.getElementById('tg-status');
                    status.innerText = "Executing Nuclear Reset...";
                    try {
                        await sendMcpCommand('telegram_nuclear_reset');
                        alert("Nuclear Reset Complete. The dashboard will now reload to re-inject the bridge logic.");
                        location.reload();
                    } catch(e) {
                        alert("Nuclear Reset failed: " + e.message);
                    }
                }
                
                async function loadFromKeychain() {
                    const cmd = { action: 'get_telegram_creds', executed: false };
                    fs.writeFileSync(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                    
                    const status = document.getElementById('tg-status');
                    status.innerText = "Checking Keychain...";
                    
                    let attempts = 0;
                    const poll = setInterval(() => {
                        attempts++;
                        if (attempts > 10) { clearInterval(poll); status.innerText = ""; return; }
                        
                        try {
                            const content = fs.readFileSync(COMMAND_FILE, 'utf8');
                            const data = JSON.parse(content);
                            if (data.action === 'get_telegram_creds' && data.executed) {
                                clearInterval(poll);
                                if (data.result && data.result !== "{}") {
                                    try {
                                        const creds = JSON.parse(data.result);
                                        if (creds.apiId) {
                                            document.getElementById('tg-api-id').value = creds.apiId;
                                            document.getElementById('tg-api-hash').value = creds.apiHash;
                                            document.getElementById('tg-phone').value = creds.phone || '';
                                            document.getElementById('tg-bot-token').value = creds.botToken || '';
                                            
                                            // Switch mode based on what we found
                                            if (creds.botToken) {
                                                document.querySelector('input[name="login-mode"][value="bot"]').checked = true;
                                                toggleLoginMode();
                                            }
                                            
                                            status.innerText = "Credentials loaded from Obsidian Keychain 🔒";
                                            // Auto-close configuration on success
                                            document.getElementById('tg-config-details').removeAttribute('open');
                                            
                                            setTimeout(() => {
                                                status.innerText = "";
                                                // Only auto-connect if NOT already online
                                                const currentStatus = document.getElementById('tg-connection-status')?.innerText || '';
                                                if (!currentStatus.includes("Online")) {
                                                    startTgLogin().catch(console.error);
                                                }
                                            }, 1000);
                                        }
                                    } catch(e) { console.error("Bad creds json", e); }
                                } else {
                                    status.innerText = "";
                                }
                            }
                        } catch(e) {}
                    }, 500);
                }


                let saveTimeout;
                function autoSaveCreds() {
                    const saveCheckbox = document.getElementById('tg-save-creds');
                    if (!saveCheckbox || !saveCheckbox.checked) return;

                    const apiId = document.getElementById('tg-api-id').value;
                    const apiHash = document.getElementById('tg-api-hash').value;
                    const phone = document.getElementById('tg-phone').value;
                    const botToken = document.getElementById('tg-bot-token').value;

                    // Debounce save
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        saveToKeychain(apiId, apiHash, phone, botToken);
                        const status = document.getElementById('tg-status');
                        status.innerText = "Auto-saving to Keychain...";
                        setTimeout(() => { 
                             if(status.innerText === "Auto-saving to Keychain...") status.innerText = ""; 
                        }, 1000);
                    }, 1000);
                }

                async function submitTgCode() {
                    const code = document.getElementById('tg-code').value;
                    const status = document.getElementById('tg-status');
                    status.innerText = "Submitting code...";
                    
                    try {
                        const res = await sendMcpCommand('telegram_submit_code', { code });
                        status.innerText = res;
                        status.style.color = "var(--success)";
                        document.getElementById('tg-otp-area').style.display = 'none';
                        showTgFeed();
                    } catch(e) {
                        status.innerText = "Code Error: " + e.message;
                        status.style.color = "var(--error)";
                    }
                }

                function showTgFeed() {
                    // Collapse configuration
                    document.getElementById('tg-config-details').removeAttribute('open');
                    // Show feed
                    document.getElementById('tg-feed').style.display = 'flex';
                    startTgPolling();
                }

                function toggleAutoFwd() {
                    tgAutoPush = document.getElementById('tg-auto-fwd').checked;
                }

                function startTgPolling() {
                    setInterval(() => {
                         if (!fs.existsSync(ACTIVITY_FILE)) return;
                         
                         // 1. Sync State
                         const stateFile = path.join(FOLDER_PATH, '_resources/mcp/mcp_state.json');
                         if (fs.existsSync(stateFile)) {
                            try {
                                const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                                if (state.telegram) {
                                    const connStatus = document.getElementById('tg-connection-status');
                                    if (connStatus) {
                                        if (state.telegram.status === 'online') {
                                            connStatus.innerText = "● Online";
                                            connStatus.style.color = "var(--success)";
                                        } else {
                                            connStatus.innerText = "● Offline";
                                            connStatus.style.color = "var(--text-dim)";
                                        }
                                    }
                                }

                                // 1b. Bridge Heartbeat Check
                                const bridgeEl = document.getElementById('bridge-status');
                                if (bridgeEl && state.timestamp) {
                                    const lastSeen = new Date(state.timestamp).getTime();
                                    const now = Date.now();
                                    const isAlive = (now - lastSeen) < 10000; // 10s threshold
                                    
                                    const dot = bridgeEl.querySelector('.status-dot');
                                    const label = bridgeEl.querySelector('span');
                                    
                                    if (isAlive) {
                                        dot.style.background = 'var(--success)';
                                        dot.style.boxShadow = '0 0 8px var(--success)';
                                        label.innerText = 'BRIDGE ACTIVE';
                                    } else {
                                        dot.style.background = 'var(--error)';
                                        dot.style.boxShadow = '0 0 8px var(--error)';
                                        label.innerText = 'BRIDGE INACTIVE (Closed)';
                                        label.style.color = 'var(--error)';
                                    }
                                }
                            } catch(e) {}
                         }

                         // 2. Sync Messages
                         try {
                             const activities = JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8'));
                             const tgMsgs = activities.filter(a => a.source === 'telegram').slice(0, 20);
                             
                             const feed = document.getElementById('tg-messages');
                              feed.innerHTML = tgMsgs.map(m => {
                                 const hasColon = m.result.includes(\x27:\x27);
                                 const [sender, ...rest] = hasColon ? m.result.split(\x27:\x27) : [m.result, \x27\x27];
                                 const msgText = rest.join(\x27:\x27).trim();
                                 const isTrigger = m.action === \x27telegram_trigger\x27 || sender.includes(\x27Remote Trigger\x27);
                                 
                                 return \`
                                 <div class="msg-entry \${isTrigger ? \x27trigger-msg\x27 : \x27\x27}">
                                     <div class="msg-meta">
                                         <span class="msg-sender">\${sender}</span>
                                         <span>\${new Date(m.timestamp).toLocaleTimeString()}</span>
                                     </div>
                                     <div class="msg-text">\${msgText || \x27\x27}</div>
                                 </div>
                              \`;
                              }).join(\x27\x27);
                         } catch(e) {}

                    }, 2000);
                }

                
                try {
                    fs = require('fs');
                    path = require('path');
                    FOLDER_PATH = "${fPath.replace(/\\/g, '\\\\')}";
                    ACTIVITY_FILE = path.join(FOLDER_PATH, '_resources/mcp/mcp_activity.json');
                    LOGS_FILE = path.join(FOLDER_PATH, '_resources/mcp/mcp_logs.json');
                    COMMAND_FILE = path.join(FOLDER_PATH, '_resources/mcp/mcp_commands.json');
                    SCHEMA_FILE = path.join(FOLDER_PATH, '_resources/mcp/mcp_schema.json');
                    
                    document.getElementById('activity-feed').innerHTML = \`
                        <div style="text-align:center;padding:20px;color:var(--text-dim)">
                            Initializing...<br>
                        </div>
                    \`;
                    
                    // Load Schema for Docs
                    if (fs.existsSync(SCHEMA_FILE)) {
                        const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
                        const grid = document.getElementById('docs-grid');
                        grid.innerHTML = schema.map(cmd => {
                            const usage = JSON.stringify(cmd.usage || { action: cmd.action }, null, 2);
                            return \`
                                <div class="cmd-card">
                                    <div class="cmd-header">
                                        <code class="cmd-name">\${cmd.action}</code>
                                        <span class="badgex">\${cmd.category || 'Core'}</span>
                                    </div>
                                    <p class="cmd-desc">\${cmd.description}</p>
                                    <div class="cmd-usage">\${usage}</div>
                                    \${cmd.hasTest ? 
                                        \`<button class="action-btn x-small" onclick="triggerAction('\${cmd.action}')">Test Command</button>\` : 
                                        '<div style="font-size:10px; opacity:0.5; margin-top:8px">Manual Trigger Only</div>'
                                    }
                                </div>
                            \`;
                        }).join('');
                    }
                } catch (e) {
                    // ... Error ...
                }

                function toggleSidebar() {
                    const panel = document.getElementById('side-panel');
                    panel.classList.toggle('collapsed');
                }

                async function triggerAction(action) {
                    const cmd = { action, executed: false };
                    fs.writeFileSync(COMMAND_FILE, JSON.stringify(cmd, null, 2));
                    addLogEntry('local', 'ACTION', 'Triggered: ' + action);
                }
                
                function retryCurrentAction() {
                    if (currentLogDetails && currentLogDetails.action) {
                        triggerAction(currentLogDetails.action);
                        closeModal();
                    }
                }

                function showDetails(logData) {
                    currentLogDetails = logData;
                    const modal = document.getElementById('detail-modal');
                    const body = document.getElementById('modal-body');
                    const retryBtn = document.getElementById('retry-btn');
                    
                    retryBtn.style.display = logData.action ? 'block' : 'none';
                    if (logData.action) retryBtn.innerText = '↻ Retry ' + logData.action;

                    let html = '';
                    if (logData.action) {
                        html += \`
                            <div class="detail-hero">
                                <span class="hero-label">Command</span>
                                <div class="hero-action">\${logData.action}</div>
                            </div>
                        \`;
                    }

                    html += '<div class="detail-grid">';
                    for (const [key, value] of Object.entries(logData)) {
                        if (key === 'action') continue;
                        let displayVal = value;
                        let isCode = false;

                        if (typeof value === 'object') {
                            displayVal = JSON.stringify(value, null, 2);
                            isCode = true;
                        }
                        
                        html += \`
                            <div class="detail-row">
                                <span class="detail-key">\${key}</span>
                                <span class="detail-val \${isCode ? 'val-code' : ''}">\${displayVal}</span>
                            </div>
                        \`;
                    }
                    html += '</div>';

                    body.innerHTML = html;
                    modal.classList.add('visible');
                }

            function closeModal(e) {
                if (e && e.target.id !== 'detail-modal' && e.target.className !== 'close-btn') return;
                document.getElementById('detail-modal').classList.remove('visible');
            }

            function addLogEntry(source, type, msg) {
                const feed = document.getElementById('activity-feed');
                const div = document.createElement('div');
                div.className = 'log-entry';
                div.style.cursor = 'pointer';
                const ts = new Date().toISOString(); 
                // Store safe data
                const logData = { source, type, msg, timestamp: ts, action: (type === 'ACTION' ? msg.replace('Triggered: ', '') : undefined) };
                const dataStr = encodeURIComponent(JSON.stringify(logData));
                
                div.setAttribute('data-log', dataStr);
                div.onclick = function() {
                    const data = JSON.parse(decodeURIComponent(this.getAttribute('data-log')));
                    showDetails(data);
                };
                
                const time = new Date().toLocaleTimeString().split(' ')[0];
                let typeClass = 'type-info';
                if (type === 'ERROR') typeClass = 'type-error';
                
                div.innerHTML = \`
                    <div class="log-time">\${time}</div>
                    <div class="log-type \${typeClass}">\${type}</div>
                    <div class="log-msg">\${msg}</div>
                \`;
                if (feed.children.length > 50) feed.removeChild(feed.lastChild);
                feed.prepend(div);
            }

            function refresh() {
                try {
                    if (!fs) return;

                    if (fs.existsSync(ACTIVITY_FILE)) {
                        const content = fs.readFileSync(ACTIVITY_FILE, 'utf8');
                        const activities = JSON.parse(content);
                        const feed = document.getElementById('activity-feed');
                        
                        if (feed.getAttribute('data-count') != activities.length) {
                             feed.innerHTML = activities.map(l => {
                                const t = new Date(l.timestamp).toLocaleTimeString().split(' ')[0];
                                let tClass = 'type-info';
                                if (l.status === 'error') tClass = 'type-error';
                                else if (l.status === 'executing') tClass = 'type-warn';
                                
                                const dataStr = encodeURIComponent(JSON.stringify(l));

                                return \`
                                    <div class="log-entry" style="cursor:pointer" data-log="\${dataStr}" onclick="showDetails(JSON.parse(decodeURIComponent(this.getAttribute('data-log'))))">
                                        <div class="log-time">\${t}</div>
                                        <div class="log-type \${tClass}">\${l.action}</div>
                                        <div class="log-msg">\${l.result || l.status}</div>
                                    </div>
                                \`;
                            }).join('');
                            feed.setAttribute('data-count', activities.length);
                        }
                    }

                    if (fs.existsSync(LOGS_FILE)) {
                        const content = fs.readFileSync(LOGS_FILE, 'utf8');
                        const logs = JSON.parse(content);
                        const feed = document.getElementById('log-feed');
                        
                        if (feed.getAttribute('data-count') != logs.length) {
                             feed.innerHTML = logs.reverse().map(l => {
                                const t = new Date(l.timestamp).toLocaleTimeString().split(' ')[0];
                                let tClass = 'type-info';
                                
                                const dataStr = encodeURIComponent(JSON.stringify(l));

                                return \`
                                    <div class="log-entry" style="cursor:pointer" data-log="\${dataStr}" onclick="showDetails(JSON.parse(decodeURIComponent(this.getAttribute('data-log'))))">
                                        <div class="log-time">\${t}</div>
                                        <div class="log-type \${tClass}">\${l.type}</div>
                                        <div class="log-msg" title="\${l.message}">\${l.message}</div>
                                    </div>
                                \`;
                            }).join('');
                            feed.setAttribute('data-count', logs.length);
                        }
                    }
                } catch (e) {
                     // Silent fail
                }
            }

            function updateTests(results) {
                 // ... same ...
            }

            function clearHistory() {
                if (!fs) return;
                try {
                    fs.writeFileSync(ACTIVITY_FILE, '[]');
                    fs.writeFileSync(LOGS_FILE, '[]');
                    document.getElementById('activity-feed').innerHTML = '';
                    document.getElementById('log-feed').innerHTML = '';
                    addLogEntry('local', 'CLEARED', 'History cleared');
                } catch (e) {}
            }

            setInterval(refresh, 1000);
            window.__UPDATE_TESTS__ = updateTests;
            refresh();
            updateTests(${JSON.stringify(results)});
            loadFromKeychain();
`;

function generateHTML(fPath, results) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>${getStyles()}</style>
    </head>
    <body class="dark-theme">
        ${getBody(fPath)}
        <script>
            ${getScript(fPath, results)}
        </script>
    </body>
    </html>
    `;
}

return { generateHTML };
