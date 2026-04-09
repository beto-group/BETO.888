const https = require('https');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Helper to log in a structured way for the parent process
const log = (type, data) => {
    console.log(JSON.stringify({ type, ...data }));
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let currentVideoId = null;
let continuationToken = null;
let apiKey = null;
let clientName = 'WEB';
let clientVersion = '2.20240115.01.00';
let pollInterval = null;
let storagePath = null;

const request = (url, options, body = null) => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: data }));
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
};

const extractValue = (text, regex) => {
    const match = text.match(regex);
    return match ? match[1] : null;
};

let sendParams = null;
let visitorData = null;

// Helper to find a specific key deep within an object, handling arrays
const findDeepKey = (obj, targetKey) => {
    if (!obj || typeof obj !== 'object') return null;
    if (obj[targetKey] !== undefined) return obj[targetKey];

    if (Array.isArray(obj)) {
        for (const item of obj) {
            const found = findDeepKey(item, targetKey);
            if (found) return found;
        }
    } else {
        for (const key in obj) {
            const found = findDeepKey(obj[key], targetKey);
            if (found) return found;
        }
    }
    return null;
};

const fetchInitialInfo = async (videoId, oauthToken = null) => {
    try {
        log('status', { msg: `Fetching initial info for ${videoId}...` });

        const urls = [
            `https://www.youtube.com/live_chat?v=${videoId}`,
            `https://www.youtube.com/watch?v=${videoId}`
        ];

        let lastText = null;

        for (const url of urls) {
            log('status', { msg: `Trying to extract info from: ${url}` });
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            };
            if (oauthToken) headers['Authorization'] = `Bearer ${oauthToken}`;

            const resp = await request(url, { headers });
            if (resp.status !== 200) continue;

            const text = resp.text;
            lastText = text;

            apiKey = apiKey || extractValue(text, /"INNERTUBE_API_KEY":"(.*?)"/);
            visitorData = visitorData || extractValue(text, /"visitorData":"(.*?)"/);

            // Multi-layered robust regex for sendParams
            const patterns = [
                /"sendLiveChatMessageEndpoint":\s*\{[^]*?"params":\s*"(.*?)"/,
                /"sendLiveChatMessageRenderer":\s*\{[^]*?"params":\s*"(.*?)"/,
                /"params":\s*"(.*?)"[^]*?"sendLiveChatMessageEndpoint"/,
                /sendLiveChatMessageEndpoint[^]*?params[^]*?["'](.*?)["']/,
                /"params":\s*"(.*?)"[^]*?"key":\s*"send_message"/,
                /send_message[^]*?params[^]*?["'](.*?)["']/
            ];

            for (const p of patterns) {
                const found = extractValue(text, p);
                if (found) {
                    sendParams = sendParams || found;
                    log('status', { msg: `SendParams found via regex: ${p.source.substring(0, 40)}...` });
                    break;
                }
            }

            // Extract continuation
            let mainCont = extractValue(text, /"liveChatRenderer":\{[^]*?"continuation":"(.*?)"/);
            if (!mainCont) mainCont = extractValue(text, /"continuation":"(.*?)"/);
            if (mainCont) continuationToken = continuationToken || mainCont;

            // Deep Search in JSON structures - Greedier Regex
            const jsonPatterns = [
                /window\["ytInitialData"\]\s*=\s*(\{[\s\S]*?\});[ \t]*\n/,
                /ytInitialData\s*=\s*(\{[\s\S]*?\});[ \t]*\n/,
                /ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});[ \t]*\n/,
                /ytcfg\.set\((\{[\s\S]*?\})\);/
            ];

            for (const jp of jsonPatterns) {
                const match = text.match(jp);
                if (match) {
                    try {
                        const parsed = JSON.parse(match[1]);

                        // Look for sendParams deep
                        if (!sendParams) {
                            const endpoint = findDeepKey(parsed, 'sendLiveChatMessageEndpoint');
                            if (endpoint && endpoint.params) {
                                sendParams = endpoint.params;
                                log('status', { msg: 'SendParams found via deep endpoint search' });
                            }
                        }

                        if (!sendParams) {
                            const inputRenderer = findDeepKey(parsed, 'liveChatTextMessageInputRenderer');
                            if (inputRenderer) {
                                if (inputRenderer.prompt?.webRenderer?.sendLiveChatMessageEndpoint?.params) {
                                    sendParams = inputRenderer.prompt.webRenderer.sendLiveChatMessageEndpoint.params;
                                    log('status', { msg: 'SendParams found via prompt.webRenderer' });
                                }

                                if (!sendParams) {
                                    const endpoint = findDeepKey(inputRenderer, 'sendLiveChatMessageEndpoint');
                                    if (endpoint && endpoint.params) {
                                        sendParams = endpoint.params;
                                        log('status', { msg: 'SendParams found via deep inputRenderer search' });
                                    }
                                }
                            }
                        }

                        // Extract initial actions if this is a live chat page
                        if (url.includes('live_chat')) {
                            const contents = parsed.contents?.liveChatRenderer?.actions || [];
                            if (contents.length > 0) {
                                log('status', { msg: `Found ${contents.length} initial actions.` });
                                contents.forEach(action => processAction(action));
                            }
                        }

                        // --- Force "Live Chat" (All messages) instead of "Top Chat" ---
                        try {
                            const header = parsed.contents?.liveChatRenderer?.header?.liveChatHeaderRenderer;
                            const subMenu = header?.viewSelector?.sortFilterSubMenuRenderer;
                            if (subMenu && subMenu.subMenuItems) {
                                for (const item of subMenu.subMenuItems) {
                                    const title = item.title?.simpleText || item.title; // simpleText or just string
                                    if (title && /live chat/i.test(title)) {
                                        const cont = item.continuation?.reloadContinuationData?.continuation;
                                        if (cont) {
                                            continuationToken = cont;
                                            log('status', { msg: 'Switched to LIVE CHAT mode (All messages).' });
                                            break;
                                        }
                                    }
                                }
                            }
                        } catch (e) { /* ignore */ }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }

            if (apiKey && sendParams && continuationToken) {
                log('status', { msg: `Successfully extracted all keys from ${url.split('?')[0]}` });
                break;
            }
        }

        // --- DEBUG DUMP IF MISSING ---
        if (!sendParams && lastText && storagePath) {
            try {
                const debugFile = path.join(storagePath, `debug_${Date.now()}.html`);
                fs.writeFileSync(debugFile, lastText);
                log('error', { msg: `SendParams missing. Dumped HTML to ${debugFile}` });

                // Brute force check for params-like strings.
                // Regex matches "params":"(CA...)"
                // Send params are usually LONG. View selector params like CAEQAA== are too short.
                // We enforce a minimum length of 50 to avoid picking up filter params.
                const potential = lastText.match(/"params":"(CA[^"]{50,})"/g);
                if (potential && potential.length > 0) {
                    // Extract value from the first match
                    const candidate = potential[0].split('"')[3];
                    if (candidate) {
                        sendParams = candidate;
                        log('status', { msg: `SendParams found via BRUTE FORCE: ${candidate.substring(0, 20)}...` });
                    }
                }
            } catch (err) {
                log('error', { msg: `Failed to dump debug file: ${err.message}` });
            }
        }

        // Validate SendParams length
        if (sendParams && sendParams.length < 40) {
            log('error', { msg: `Extracted SendParams is suspiciously short (${sendParams.length} chars): ${sendParams}. Discarding.` });
            sendParams = null;
        }

        log('status', { msg: `Extraction Summary: APIKey=${apiKey ? 'Yes' : 'No'}, SendParams=${sendParams ? 'Yes' : 'No'}, ContToken=${continuationToken ? 'Yes' : 'No'}, VisitorData=${visitorData ? 'Yes' : 'No'}` });

        if (!apiKey || !continuationToken) {
            log('error', { msg: 'Critical Failure: Missing API Key or Continuation Token.' });
            return false;
        }

        log('status', { msg: 'InnerTube Connection Ready', videoId });
        return true;
    } catch (e) {
        log('error', { msg: `Initial fetch error: ${e.message}` });
        return false;
    }
};

const processedMessageIds = new Set();

const processAction = (action) => {
    const addChatItemAction = action.addChatItemAction;
    if (!addChatItemAction) return;

    const item = addChatItemAction.item?.liveChatTextMessageRenderer;
    if (!item) return;

    if (processedMessageIds.has(item.id)) return;
    processedMessageIds.add(item.id);

    const message = {
        id: item.id,
        author: item.authorName?.simpleText || 'Unknown',
        text: item.message?.runs?.map(r => r.text).join('') || '',
        publishedAt: (item.timestampUsec ? new Date(parseInt(item.timestampUsec) / 1000).toISOString() : new Date().toISOString()),
        profileImageUrl: item.authorPhoto?.thumbnails?.[0]?.url,
        isOwner: item.authorBadges?.some(b => b.liveChatAuthorBadgeRenderer?.tooltip?.toLowerCase().includes('owner')),
        isModerator: item.authorBadges?.some(b => b.liveChatAuthorBadgeRenderer?.tooltip?.toLowerCase().includes('moderator')),
        isVerified: item.authorBadges?.some(b => b.liveChatAuthorBadgeRenderer?.tooltip?.toLowerCase().includes('verified'))
    };

    log('chat', { message });

    // Save to MD file
    if (storagePath && currentVideoId) {
        try {
            const filePath = path.join(storagePath, `${currentVideoId}.md`);
            if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

            const time = new Date(message.publishedAt).toLocaleTimeString();
            const line = `> **${message.author}** [${time}]: ${message.text} <!-- id:${message.id} -->\n\n`;
            fs.appendFileSync(filePath, line);
        } catch (e) {
            log('error', { msg: `Failed to save message: ${e.message}` });
        }
    }
};

const prefetchHistoryIds = (sPath, vid) => {
    if (!sPath || !vid) return;
    try {
        const filePath = path.join(sPath, `${vid}.md`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const idRegex = /<!-- id:(.*?) -->/g;
            let match;
            let count = 0;
            while ((match = idRegex.exec(content)) !== null) {
                processedMessageIds.add(match[1]);
                count++;
            }
            log('status', { msg: `Prefetched ${count} IDs from history file.` });
        }
    } catch (e) {
        log('error', { msg: `History prefetch failed: ${e.message}` });
    }
};

const pollChat = async () => {
    if (!apiKey || !continuationToken) {
        log('error', { msg: 'Missing API Key or Continuation Token' });
        return;
    }

    try {
        const payload = JSON.stringify({
            context: {
                client: {
                    clientName: clientName,
                    clientVersion: clientVersion,
                    utcOffsetMinutes: 0,
                    visitorData: visitorData
                }
            },
            continuation: continuationToken
        });

        const resp = await request(`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://www.youtube.com',
                'Referer': `https://www.youtube.com/live_chat?v=${currentVideoId}`
            }
        }, payload);

        if (resp.status !== 200) {
            log('error', { msg: `Poll failed: ${resp.status}` });
            pollInterval = setTimeout(pollChat, 10000);
            return;
        }

        let data;
        try {
            data = JSON.parse(resp.text);
        } catch (e) {
            log('error', { msg: `JSON parse error in poll: ${e.message}` });
            pollInterval = setTimeout(pollChat, 10000);
            return;
        }

        const renderer = data.continuationContents?.liveChatContinuation;
        if (!renderer) {
            pollInterval = setTimeout(pollChat, 1000);
            return;
        }

        let nextCont = null;
        if (renderer.continuations) {
            const cont = renderer.continuations[0];
            nextCont = cont.invalidationContinuationData?.continuation ||
                cont.timedContinuationData?.continuation ||
                cont.liveChatReplayContinuationData?.continuation;
        }

        if (nextCont) continuationToken = nextCont;

        const actions = renderer.actions || [];
        actions.forEach(action => processAction(action));

        let nextPollMs =
            renderer.continuations?.[0]?.timedContinuationData?.timeoutMs ||
            renderer.continuations?.[0]?.invalidationContinuationData?.timeoutMs ||
            renderer.continuations?.[0]?.liveChatReplayContinuationData?.timeoutMs ||
            1000;

        nextPollMs = parseInt(nextPollMs);
        if (isNaN(nextPollMs)) nextPollMs = 1000;

        log('status', { msg: `Polled ${actions.length} actions. Next poll in ${nextPollMs}ms` });

        if (pollInterval) clearTimeout(pollInterval);
        pollInterval = setTimeout(pollChat, Math.max(500, nextPollMs));

    } catch (e) {
        log('error', { msg: `Poll error: ${e.message}` });
        pollInterval = setTimeout(pollChat, 10000);
    }
};

const sendChatMessage = async (text, oauthToken) => {
    if (!apiKey || !sendParams || !oauthToken) {
        let missing = [];
        if (!apiKey) missing.push("InnerTube Key");
        if (!sendParams) missing.push("SendParams");
        if (!oauthToken) missing.push("OAuthToken");
        log('error', { msg: `Cannot send: Missing ${missing.join(', ')}` });
        return { error: 'Missing credentials' };
    }

    try {
        // Fix for Double-Encoded Params
        let actualParams = sendParams;
        if (actualParams.includes('%')) {
            try {
                actualParams = decodeURIComponent(actualParams);
                log('status', { msg: `Decoded SendParams: ${actualParams.substring(0, 20)}...` });
            } catch (e) {
                log('error', { msg: `Failed to decode params: ${e.message}` });
            }
        }

        const payload = JSON.stringify({
            params: actualParams,
            clientMessageId: `msg_${Date.now()}`,
            richMessage: {
                textSegments: [{ text }]
            },
            context: {
                client: {
                    clientName: clientName,
                    clientVersion: clientVersion,
                    utcOffsetMinutes: 0,
                    visitorData: visitorData
                },
                request: {
                    sessionId: "",
                    internalExperimentFlags: [],
                    consistencyTokenJars: []
                },
                user: {
                    onBehalfOfUser: null
                }
            }
        });

        log('status', { msg: `Sending message via InnerTube... Key=${apiKey?.substring(0, 10)}... Params=${actualParams?.substring(0, 10)}...` });
        const resp = await request(`https://www.youtube.com/youtubei/v1/live_chat/send_message?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${oauthToken}`,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://www.youtube.com',
                'Referer': `https://www.youtube.com/live_chat?v=${currentVideoId}`
            }
        }, payload);

        if (resp.status === 200) {
            log('status', { msg: 'Message sent successfully' });
            return { success: true, response: resp.text?.substring(0, 100) };
        } else {
            log('error', { msg: `Send failed: ${resp.status} - ${resp.text?.substring(0, 200)}` });
            return { error: `Send failed (${resp.status})`, details: resp.text?.substring(0, 200) };
        }
    } catch (e) {
        log('error', { msg: `Send error: ${e.message}` });
        return { error: e.message };
    }
};

rl.on('line', async (line) => {
    try {
        const msg = JSON.parse(line);

        if (msg.type === 'connect') {
            const { videoId, storagePath: sPath, oauthToken } = msg;

            if (!videoId) {
                log('error', { msg: 'No videoId provided' });
                return;
            }

            if (pollInterval) clearTimeout(pollInterval);
            currentVideoId = videoId;
            storagePath = sPath;

            log('status', { msg: `Proxy Configured. Video: ${videoId}, Storage: ${storagePath}` });

            // Load existing IDs to prevent duplicates
            prefetchHistoryIds(storagePath, currentVideoId);

            const ok = await fetchInitialInfo(videoId, oauthToken);
            if (ok) {
                pollChat();
            }
        } else if (msg.type === 'send') {
            const { text, oauthToken } = msg;
            const res = await sendChatMessage(text, oauthToken);
            log('send_result', res);
        } else if (msg.type === 'stop') {
            if (pollInterval) clearTimeout(pollInterval);
            pollInterval = null;
        }
    } catch (err) {
        // Ignore
    }
});

// log('status', { msg: 'InnerTube Chat Proxy Started' });

// Keep process alive
setInterval(() => { }, 1000);
