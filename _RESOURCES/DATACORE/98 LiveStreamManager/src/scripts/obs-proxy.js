/**
 * OBS WebSocket Proxy (Node.js)
 * Bypasses browser WebSocket/Security restrictions.
 * Communication: JSON over stdin/stdout
 */

const WebSocket = require('ws');
const crypto = require('crypto');

let ws = null;
let config = { host: '', port: '', password: '' };

function log(msg) {
    try {
        process.stdout.write(JSON.stringify({ type: 'log', message: msg }) + '\n');
    } catch (e) { }
}

function sendStatus(status) {
    try {
        process.stdout.write(JSON.stringify({ type: 'status', status }) + '\n');
    } catch (e) { }
}

async function sha256(str) {
    return crypto.createHash('sha256').update(Buffer.from(str, 'utf8')).digest('base64');
}

const net = require('net');

async function connect() {
    if (ws) {
        log('Closing previous connection...');
        try { ws.terminate(); } catch (e) { }
        ws = null;
    }

    const { host, port, password } = config;
    if (!host || !port) {
        log('Missing host or port, skipping connect.');
        return;
    }

    const url = `ws://${host}:${port}`;
    log(`Connecting to ${url}...`);
    sendStatus('connecting');

    // Pre-flight TCP check
    const socket = new net.Socket();
    socket.setTimeout(3000);

    socket.on('connect', () => {
        log('TCP Connection established. Upgrading to WebSocket...');
        socket.destroy();
        startWebSocket(url, password);
    });

    socket.on('timeout', () => {
        log('TCP Connection Timed Out (3s)');
        sendStatus('refused');
        socket.destroy();
    });

    socket.on('error', (err) => {
        log(`TCP Connection Failed: ${err.message}`);
        sendStatus('refused');
        socket.destroy();
    });

    socket.connect(port, host);
}

function startWebSocket(url, password) {
    try {
        ws = new WebSocket(url);

        const connectTimeout = setTimeout(() => {
            if (ws && ws.readyState !== WebSocket.OPEN) {
                log(`WebSocket Handshake Timed Out. State: ${ws.readyState}`);
                sendStatus('refused');
                ws.terminate();
                ws = null;
            }
        }, 10000);

        ws.on('open', () => {
            clearTimeout(connectTimeout);
            log('WebSocket Opened. Awaiting Hello...');
        });

        ws.on('close', (code, reason) => {
            clearTimeout(connectTimeout);
            log(`Socket Closed. Code: ${code}, Reason: ${reason || 'none'}`);
            if (code === 4009) {
                log('AUTHENTICATION FAILED (4009)');
                sendStatus('error');
            } else if (code === 1006) {
                log('Connection refused / abnormal closure (1006)');
                sendStatus('refused');
            } else {
                sendStatus('disconnected');
            }
        });

        ws.on('error', (err) => {
            clearTimeout(connectTimeout);
            log(`WebSocket Error: ${err.message}`);
            sendStatus('refused');
        });

        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString());

                if (msg.op === 0) { // Hello
                    const { authentication, rpcVersion } = msg.d;
                    log(`Received Hello (RPC ${rpcVersion}). Auth Required: ${!!authentication}`);

                    const identify = {
                        op: 1,
                        d: {
                            rpcVersion: rpcVersion || 1,
                            eventSubscriptions: (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6) | (1 << 7) | (1 << 8) | (1 << 9) | (1 << 10)
                        }
                    };

                    if (authentication) {
                        const { salt, challenge } = authentication;
                        const pass = (password || '');
                        const secret = await sha256(pass + salt);
                        identify.d.authentication = await sha256(secret + challenge);
                    }

                    ws.send(JSON.stringify(identify));
                } else if (msg.op === 2) { // Identified
                    log('SUCCESS: Identified by OBS!');
                    sendStatus('connected');

                    // Request Initial State
                    request('GetSceneList');
                    request('GetStreamStatus');
                    request('GetRecordStatus');
                    request('GetCurrentProgramScene');

                } else if (msg.op === 5) { // Event
                    const { eventType, eventData } = msg.d;
                    process.stdout.write(JSON.stringify({ type: 'event', eventType, eventData }) + '\n');

                } else if (msg.op === 7) { // RequestResponse
                    const { requestType, requestStatus, responseData } = msg.d;
                    if (requestStatus.result) {
                        process.stdout.write(JSON.stringify({ type: 'response', requestType, responseData }) + '\n');
                    } else {
                        log(`[!] Request Failed [${requestType}]: ${requestStatus.comment || 'No detail'}`);
                    }
                }
            } catch (err) {
                log(`Message Processing Error: ${err.message}`);
            }
        });
    } catch (err) {
        log(`WebSocket Initialization Error: ${err.message}`);
        sendStatus('refused');
    }
}

function request(type, data = {}, customId = null) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify({
                op: 6,
                d: {
                    requestType: type,
                    requestId: customId || (type + '-' + Date.now()),
                    requestData: data
                }
            }));
        } catch (e) {
            log(`Request Error (${type}): ${e.message}`);
        }
    } else {
        log(`Cannot send request (${type}): WebSocket not connected.`);
    }
}

let stdinBuffer = '';
process.stdin.on('data', async (data) => {
    stdinBuffer += data.toString();
    const lines = stdinBuffer.split('\n');
    stdinBuffer = lines.pop(); // Keep partial line

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const cmd = JSON.parse(line);
            if (cmd.type === 'init') {
                config = cmd.config;
                connect();
            } else if (cmd.type === 'switchScene') {
                log(`Switching to scene: ${cmd.scene}`);
                request('SetCurrentProgramScene', { sceneName: cmd.scene });
            } else if (cmd.type === 'startStream') {
                log('Starting Stream...');
                request('StartStream');
            } else if (cmd.type === 'stopStream') {
                log('Stopping Stream...');
                request('StopStream');
            } else if (cmd.type === 'startRecord') {
                log('Starting Record...');
                request('StartRecord');
            } else if (cmd.type === 'stopRecord') {
                log('Stopping Record...');
                request('StopRecord');
            } else if (cmd.type === 'request') {
                log(`Generic Request: ${cmd.requestType}`);
                request(cmd.requestType, cmd.requestData || {}, cmd.requestId);
            }
        } catch (err) {
            log(`Stdin JSON Parse Error: ${err.message}`);
        }
    }
});

// Auto-exit if parent dies
process.stdin.on('end', () => {
    log('Stdin closed, exiting...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, exiting...');
    process.exit(0);
});

// Silent start
// log(`[VERSION] OBS Proxy v1.6 - PID: ${process.pid} - ${new Date().toLocaleTimeString()}`);
