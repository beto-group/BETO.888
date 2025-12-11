

# ViewComponent

```jsx
const { useEffect, useRef, useState } = dc;

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

// =================================================================================
//  CHAT LLM COMPONENT (OpenAI-Style UI & Full-Tab Logic)
// =================================================================================
function ChatLLM() {
    const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
    const uniqueWrapperClass = `chat-wrapper-${instanceId}`;

    // Full-tab state
    const [isFullTab, setIsFullTab] = useState(true);
    const containerRef = useRef(null);
    const stateRefs = useRef({}).current;

    // Chat state
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeys, setApiKeys] = useState({});
    const [showSettings, setShowSettings] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [provider, setProvider] = useState('openai');
    const [model, setModel] = useState('gpt-4o');
    const [chatHistory, setChatHistory] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [attachedImages, setAttachedImages] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [availableModels, setAvailableModels] = useState({});
    const [isLoadingModels, setIsLoadingModels] = useState({});
    
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputAreaRef = useRef(null);

    const SECRET_DIR = ".datacore/chatllm/.secret/";
    const CHAT_HISTORY_DIR = ".datacore/chatllm/history/";

    // Provider configurations
    const PROVIDERS = {
        openai: {
            id: 'openai',
            name: 'OpenAI',
            apiKeyFile: SECRET_DIR + 'openai_api_key.txt',
            baseUrl: 'https://api.openai.com/v1',
            models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            defaultModel: 'gpt-4o',
        },
        gemini: {
            id: 'gemini',
            name: 'Google Gemini',
            apiKeyFile: SECRET_DIR + 'gemini_api_key.txt',
            baseUrl: 'https://generativelanguage.googleapis.com',
            models: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro'],
            defaultModel: 'gemini-1.5-flash-latest',
        },
        anthropic: {
            id: 'anthropic',
            name: 'Anthropic Claude',
            apiKeyFile: SECRET_DIR + 'anthropic_api_key.txt',
            baseUrl: 'https://api.anthropic.com',
            models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
            defaultModel: 'claude-3-5-sonnet-20241022',
        },
        groq: {
            id: 'groq',
            name: 'Groq',
            apiKeyFile: SECRET_DIR + 'groq_api_key.txt',
            baseUrl: 'https://api.groq.com/openai/v1',
            models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
            defaultModel: 'llama-3.3-70b-versatile',
        },
        ollama: {
            id: 'ollama',
            name: 'Ollama (Local)',
            apiKeyFile: SECRET_DIR + 'ollama_host.txt',
            baseUrl: 'http://localhost:11434',
            models: ['llama3', 'mistral', 'codellama'],
            defaultModel: 'llama3',
        },
        openrouter: {
            id: 'openrouter',
            name: 'OpenRouter',
            apiKeyFile: SECRET_DIR + 'openrouter_api_key.txt',
            baseUrl: 'https://openrouter.ai/api/v1',
            models: ['google/gemini-pro', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b'],
            defaultModel: 'google/gemini-pro',
        },
        cerebrium: {
            id: 'cerebrium',
            name: 'Cerebrium',
            apiKeyFile: SECRET_DIR + 'cerebrium_api_key.txt',
            baseUrl: 'https://api.cortex.cerebrium.ai/v4',
            models: ['custom-model'],
            defaultModel: 'custom-model',
        },
    };

    // Fetch available models from provider APIs
    const fetchModelsForProvider = async (providerId, explicitKey = null) => {
        const config = PROVIDERS[providerId];
        const apiKey = explicitKey || apiKeys[providerId];
        
        if (!apiKey && providerId !== 'ollama') return;
        
        setIsLoadingModels(prev => ({ ...prev, [providerId]: true }));
        
        try {
            let models = [];

            // Helper to use Obsidian's requestUrl to bypass CORS
            const makeRequest = async (url, headers = {}) => {
                if (window.requestUrl) {
                    const response = await window.requestUrl({
                        url,
                        headers
                    });
                    return response.json;
                } else {
                    const response = await fetch(url, { headers });
                    if (!response.ok) throw new Error('Fetch failed');
                    return await response.json();
                }
            };
            
            if (providerId === 'openai') {
                const data = await makeRequest(`${config.baseUrl}/models`, { 
                    'Authorization': `Bearer ${apiKey}` 
                });
                models = data.data
                    .filter(m => m.id.startsWith('gpt') || m.id.startsWith('o1'))
                    .map(m => m.id)
                    .sort();
            } else if (providerId === 'gemini') {
                const data = await makeRequest(`${config.baseUrl}/v1beta/models?key=${apiKey}`);
                models = data.models
                    .filter(m => m.name.includes('gemini'))
                    .map(m => m.name.replace('models/', ''))
                    .sort();
            } else if (providerId === 'anthropic') {
                const data = await makeRequest(`${config.baseUrl}/v1/models`, { 
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                });
                models = data.data.map(m => m.id).sort();
            } else if (providerId === 'groq') {
                const data = await makeRequest(`${config.baseUrl}/models`, { 
                    'Authorization': `Bearer ${apiKey}` 
                });
                models = data.data.map(m => m.id).sort();
            } else if (providerId === 'ollama') {
                const host = apiKey || config.baseUrl;
                const response = await fetch(`${host}/api/tags`);
                if (response.ok) {
                    const data = await response.json();
                    models = data.models.map(m => m.name).sort();
                }
            } else if (providerId === 'openrouter') {
                const data = await makeRequest(`${config.baseUrl}/models`, { 
                    'Authorization': `Bearer ${apiKey}` 
                });
                models = data.data.map(m => m.id).sort();
            } else if (providerId === 'cerebrium') {
                // Cerebrium uses custom models, keep hardcoded
                models = config.models;
            }
            
            if (models.length > 0) {
                setAvailableModels(prev => ({ ...prev, [providerId]: models }));
                // If current model is not in the list, set to first available
                if (providerId === provider && !models.includes(model)) {
                    setModel(models[0]);
                }
            }
        } catch (error) {
            console.error(`Failed to fetch models for ${providerId}:`, error);
            // Fallback to default models
            setAvailableModels(prev => ({ ...prev, [providerId]: config.models }));
        } finally {
            setIsLoadingModels(prev => ({ ...prev, [providerId]: false }));
        }
    };

    // Load API keys and chat history on mount
    useEffect(() => {
        const loadKeys = async () => {
            try {
                const loadedKeys = {};
                for (const [id, config] of Object.entries(PROVIDERS)) {
                    if (await app.vault.adapter.exists(config.apiKeyFile)) {
                        const key = await app.vault.adapter.read(config.apiKeyFile);
                        loadedKeys[id] = key.trim();
                    }
                }
                setApiKeys(loadedKeys);
                // Fetch models for all providers with keys
                for (const [id, key] of Object.entries(loadedKeys)) {
                    if (key) {
                        fetchModelsForProvider(id, key);
                    }
                }
                // Also fetch for ollama even without key
                fetchModelsForProvider('ollama');
            } catch (e) {
                console.error('Failed to load API keys:', e);
            }
        };
        loadKeys();
        loadChatHistory();
    }, []);

    // Load all chat history from all providers
    const loadChatHistory = async () => {
        setIsHistoryLoading(true);
        try {
            if (!await app.vault.adapter.exists(CHAT_HISTORY_DIR)) {
                await app.vault.adapter.mkdir(CHAT_HISTORY_DIR);
            }
            const { files } = await app.vault.adapter.list(CHAT_HISTORY_DIR);
            const historyItems = await Promise.all(
                files.map(async (file) => {
                    try {
                        const content = await app.vault.adapter.read(file);
                        const chat = JSON.parse(content);
                        const fileName = file.split('/').pop();
                        const [timestamp, providerId] = fileName.replace('.json', '').split('_');
                        
                        // Get first user message as title
                        const firstUserMsg = chat.messages?.find(m => m.role === 'user');
                        let title = 'Untitled Chat';
                        if (firstUserMsg?.content) {
                            title = firstUserMsg.content.substring(0, 50);
                            if (firstUserMsg.content.length > 50) title += '...';
                        }
                        
                        return {
                            id: fileName.replace('.json', ''),
                            title,
                            provider: providerId || 'openai',
                            timestamp: parseInt(timestamp),
                            messages: chat.messages || [],
                        };
                    } catch (e) {
                        return null;
                    }
                })
            );
            const validChats = historyItems.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
            setChatHistory(validChats);
        } catch (e) {
            console.error('Failed to load chat history:', e);
        }
        setIsHistoryLoading(false);
    };

    // Save current chat
    const saveCurrentChat = async () => {
        if (messages.length === 0) return;
        
        try {
            if (!await app.vault.adapter.exists(CHAT_HISTORY_DIR)) {
                await app.vault.adapter.mkdir(CHAT_HISTORY_DIR);
            }
            
            const chatId = currentChatId || `${Date.now()}_${provider}`;
            const chatData = {
                messages,
                provider,
                model,
                timestamp: Date.now(),
            };
            
            await app.vault.adapter.write(
                `${CHAT_HISTORY_DIR}${chatId}.json`,
                JSON.stringify(chatData, null, 2)
            );
            
            if (!currentChatId) {
                setCurrentChatId(chatId);
                loadChatHistory();
            }
        } catch (e) {
            console.error('Failed to save chat:', e);
        }
    };

    // Load a specific chat
    const loadChat = async (chatId) => {
        try {
            const content = await app.vault.adapter.read(`${CHAT_HISTORY_DIR}${chatId}.json`);
            const chat = JSON.parse(content);
            setMessages(chat.messages || []);
            setProvider(chat.provider || 'openai');
            setModel(chat.model || PROVIDERS[chat.provider || 'openai'].defaultModel);
            setCurrentChatId(chatId);
            setShowSidebar(false);
        } catch (e) {
            console.error('Failed to load chat:', e);
        }
    };

    // Delete a chat
    const deleteChat = async (chatId, e) => {
        e.stopPropagation();
        try {
            await app.vault.adapter.delete(`${CHAT_HISTORY_DIR}${chatId}.json`);
            if (currentChatId === chatId) {
                setMessages([]);
                setCurrentChatId(null);
            }
            loadChatHistory();
        } catch (e) {
            console.error('Failed to delete chat:', e);
        }
    };

    // Save chat after messages change
    useEffect(() => {
        if (messages.length > 0) {
            const timer = setTimeout(() => {
                saveCurrentChat();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    // Save API key for a provider
    const saveApiKey = async (providerId, key) => {
        try {
            if (!await app.vault.adapter.exists(SECRET_DIR)) {
                await app.vault.adapter.mkdir(SECRET_DIR);
            }
            await app.vault.adapter.write(PROVIDERS[providerId].apiKeyFile, key);
            setApiKeys(prev => ({ ...prev, [providerId]: key }));
            // Fetch available models for this provider
            if (key) {
                fetchModelsForProvider(providerId, key);
            }
        } catch (e) {
            console.error('Failed to save API key:', e);
        }
    };

    // Change provider and model
    const changeProvider = (newProvider) => {
        setProvider(newProvider);
        setModel(PROVIDERS[newProvider].defaultModel);
    };

    // Start new chat
    const startNewChat = () => {
        setMessages([]);
        setCurrentChatId(null);
        setInput('');
        setShowSidebar(false);
    };

    // Full-tab effect
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isFullTab) return;
        const targetPaneContent = findNearestAncestorWithClass(
            container,
            "workspace-leaf-content"
        );
        if (!targetPaneContent) {
            setIsFullTab(false);
            return;
        }
        const contentWrapper =
            findDirectChildByClass(targetPaneContent, "view-content") ||
            targetPaneContent;
        stateRefs.originalParent = container.parentNode;
        stateRefs.placeholder = document.createElement("div");
        stateRefs.placeholder.style.display = "none";
        container.parentNode.insertBefore(stateRefs.placeholder, container);
        stateRefs.parentPositionInfo = {
            element: contentWrapper,
            original: window.getComputedStyle(contentWrapper).position,
        };
        if (stateRefs.parentPositionInfo.original === "static") {
            contentWrapper.style.position = "relative";
        }
        contentWrapper.appendChild(container);
        Object.assign(container.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "9998",
            overflow: "auto",
        });
        return () => {
            if (stateRefs.placeholder?.parentNode) {
                stateRefs.placeholder.parentNode.replaceChild(
                    container,
                    stateRefs.placeholder
                );
            }
            if (stateRefs.parentPositionInfo?.element) {
                stateRefs.parentPositionInfo.element.style.position =
                    stateRefs.parentPositionInfo.original === "static"
                        ? ""
                        : stateRefs.parentPositionInfo.original;
            }
            container.removeAttribute("style");
            Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
        };
    }, [isFullTab]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Handle paste for images
    useEffect(() => {
        const handlePaste = (e) => {
            const items = Array.from(e.clipboardData.items);
            const imageItems = items.filter(item => item.type.startsWith('image/'));
            
            if (imageItems.length > 0) {
                e.preventDefault();
                imageItems.forEach(item => {
                    const file = item.getAsFile();
                    if (file) {
                        addImageFile(file);
                    }
                });
            }
        };

        const inputArea = inputAreaRef.current;
        if (inputArea) {
            inputArea.addEventListener('paste', handlePaste);
            return () => inputArea.removeEventListener('paste', handlePaste);
        }
    }, []);

    // Handle drag and drop
    useEffect(() => {
        const handleDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === chatContainerRef.current) {
                setIsDragging(false);
            }
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );

            files.forEach(file => addImageFile(file));
        };

        const chatArea = chatContainerRef.current;
        if (chatArea) {
            chatArea.addEventListener('dragover', handleDragOver);
            chatArea.addEventListener('dragleave', handleDragLeave);
            chatArea.addEventListener('drop', handleDrop);

            return () => {
                chatArea.removeEventListener('dragover', handleDragOver);
                chatArea.removeEventListener('dragleave', handleDragLeave);
                chatArea.removeEventListener('drop', handleDrop);
            };
        }
    }, []);

    // Add image file
    const addImageFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setAttachedImages(prev => [...prev, {
                file,
                preview: e.target.result,
                base64: e.target.result.split(',')[1]
            }]);
        };
        reader.readAsDataURL(file);
    };

    // Remove image
    const removeImage = (index) => {
        setAttachedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Handle file input
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files).filter(file => 
            file.type.startsWith('image/')
        );
        files.forEach(file => addImageFile(file));
        e.target.value = null; // Reset input
    };

    // Check if provider supports vision
    const supportsVision = ['openai', 'gemini', 'anthropic', 'openrouter'].includes(provider);

    const handleSend = async () => {
        const currentProvider = PROVIDERS[provider];
        const currentApiKey = apiKeys[provider];
        
        if ((!input.trim() && attachedImages.length === 0) || isLoading) return;
        if (!currentApiKey && provider !== 'ollama') return;

        // Create user message with text and images
        const userMessage = { 
            role: 'user', 
            content: input,
            images: attachedImages.length > 0 ? attachedImages.map(img => img.preview) : undefined
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        const currentImages = [...attachedImages];
        setAttachedImages([]);
        setIsLoading(true);

        try {
            let url, headers, body, responseData;

            if (provider === 'openai' || provider === 'groq' || provider === 'openrouter' || provider === 'cerebrium') {
                url = `${currentProvider.baseUrl}/chat/completions`;
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`
                };
                if (provider === 'openrouter') {
                    headers['HTTP-Referer'] = 'https://obsidian.md';
                }
                
                // Format messages with images if present
                const formattedMessages = newMessages.map((m, idx) => {
                    if (m.images && m.images.length > 0 && idx === newMessages.length - 1) {
                        // Last message with images
                        const content = [
                            { type: 'text', text: m.content || 'What do you see in these images?' }
                        ];
                        currentImages.forEach(img => {
                            content.push({
                                type: 'image_url',
                                image_url: { url: img.preview }
                            });
                        });
                        return { role: m.role, content };
                    }
                    return { role: m.role, content: m.content };
                });
                
                body = JSON.stringify({
                    model: model,
                    messages: formattedMessages,
                    temperature: 0.7
                });

                const response = await fetch(url, { method: 'POST', headers, body });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'API request failed');
                }
                responseData = await response.json();
                const assistantMessage = {
                    role: 'assistant',
                    content: responseData.choices[0].message.content
                };
                setMessages([...newMessages, assistantMessage]);

            } else if (provider === 'gemini') {
                url = `${currentProvider.baseUrl}/v1beta/models/${model}:generateContent?key=${currentApiKey}`;
                headers = { 'Content-Type': 'application/json' };
                
                const contents = newMessages.map((m, idx) => {
                    const parts = [{ text: m.content || 'Analyze these images' }];
                    
                    // Add images if present (only for last message)
                    if (m.images && m.images.length > 0 && idx === newMessages.length - 1) {
                        currentImages.forEach(img => {
                            parts.push({
                                inlineData: {
                                    mimeType: img.file.type,
                                    data: img.base64
                                }
                            });
                        });
                    }
                    
                    return {
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts
                    };
                });
                
                body = JSON.stringify({ contents });

                const response = await fetch(url, { method: 'POST', headers, body });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'API request failed');
                }
                responseData = await response.json();
                const assistantMessage = {
                    role: 'assistant',
                    content: responseData.candidates[0].content.parts[0].text
                };
                setMessages([...newMessages, assistantMessage]);

            } else if (provider === 'anthropic') {
                url = `${currentProvider.baseUrl}/v1/messages`;
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': currentApiKey,
                    'anthropic-version': '2023-06-01'
                };
                
                const formattedMessages = newMessages.map((m, idx) => {
                    if (m.images && m.images.length > 0 && idx === newMessages.length - 1) {
                        const content = [
                            { type: 'text', text: m.content || 'Analyze these images' }
                        ];
                        currentImages.forEach(img => {
                            content.push({
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: img.file.type,
                                    data: img.base64
                                }
                            });
                        });
                        return {
                            role: m.role === 'assistant' ? 'assistant' : 'user',
                            content
                        };
                    }
                    return {
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.content
                    };
                });
                
                body = JSON.stringify({
                    model: model,
                    messages: formattedMessages,
                    max_tokens: 4096
                });

                const response = await fetch(url, { method: 'POST', headers, body });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'API request failed');
                }
                responseData = await response.json();
                const assistantMessage = {
                    role: 'assistant',
                    content: responseData.content[0].text
                };
                setMessages([...newMessages, assistantMessage]);

            } else if (provider === 'ollama') {
                url = `${currentProvider.baseUrl}/api/chat`;
                headers = { 'Content-Type': 'application/json' };
                body = JSON.stringify({
                    model: model,
                    messages: newMessages.map(m => ({
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.content
                    })),
                    stream: false
                });

                const response = await fetch(url, { method: 'POST', headers, body });
                if (!response.ok) {
                    throw new Error('Ollama API request failed');
                }
                responseData = await response.json();
                const assistantMessage = {
                    role: 'assistant',
                    content: responseData.message.content
                };
                setMessages([...newMessages, assistantMessage]);
            }

        } catch (error) {
            console.error('API Error:', error);
            setMessages([...newMessages, {
                role: 'assistant',
                content: `Error: ${error.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleExitFullTab = (e) => {
        e.stopPropagation();
        setIsFullTab(false);
    };

    const handleEnterFullTab = () => setIsFullTab(true);

    // Compact mode
    if (!isFullTab) {
        return (
            <div ref={containerRef} style={{
                padding: "16px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                border: "1px dashed rgba(155, 135, 245, 0.3)",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
            }}>
                <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>Chat component in compact mode</p>
                <button 
                    style={{
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#fff",
                        backgroundColor: "rgba(155, 135, 245, 0.8)",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                    onClick={handleEnterFullTab}
                >
                    Enter Full Tab
                </button>
            </div>
        );
    }

    // Full UI
    return (
        <div ref={containerRef} className={uniqueWrapperClass} style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            backgroundColor: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <style>{`
                .${uniqueWrapperClass}:hover .header-icon {
                    opacity: 0.7;
                }
                .${uniqueWrapperClass} .header-icon {
                    opacity: 0;
                    transition: opacity 0.2s ease-in-out;
                }
                .${uniqueWrapperClass} .header-icon:hover {
                    opacity: 1 !important;
                }
                .${uniqueWrapperClass} .message-bubble {
                    animation: fadeIn 0.3s ease-in;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .${uniqueWrapperClass} pre {
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 6px;
                    padding: 12px;
                    overflow-x: auto;
                    margin: 8px 0;
                }
                .${uniqueWrapperClass} code {
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 13px;
                    color: #e0e0e0;
                }
                .${uniqueWrapperClass} p {
                    margin: 8px 0;
                    line-height: 1.6;
                }
            `}</style>

            {/* Sidebar */}
            {showSidebar && (
                <>
                    {/* Overlay */}
                    <div
                        onClick={() => setShowSidebar(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 9999,
                        }}
                    />
                    {/* Sidebar Panel */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '280px',
                        height: '100%',
                        backgroundColor: '#0a0a0a',
                        borderRight: '1px solid #2a2a2a',
                        zIndex: 10000,
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'slideIn 0.2s ease-out',
                    }}>
                        {/* Sidebar Header */}
                        <div style={{
                            padding: '16px',
                            borderBottom: '1px solid #2a2a2a',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                                Chat History
                            </h3>
                            <span
                                onClick={() => setShowSidebar(false)}
                                style={{ cursor: 'pointer', color: '#999', fontSize: '18px' }}
                            >
                                <dc.Icon icon="x" />
                            </span>
                        </div>

                        {/* New Chat Button */}
                        <div style={{ padding: '12px' }}>
                            <button
                                onClick={startNewChat}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: 'rgba(155, 135, 245, 0.8)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                <dc.Icon icon="plus" style={{ fontSize: '16px' }} />
                                New Chat
                            </button>
                        </div>

                        {/* Chat List */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '8px 12px',
                        }}>
                            {isHistoryLoading ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Loading...
                                </div>
                            ) : chatHistory.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                                    No chat history yet
                                </div>
                            ) : (
                                chatHistory.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => loadChat(chat.id)}
                                        style={{
                                            padding: '12px',
                                            marginBottom: '8px',
                                            backgroundColor: currentChatId === chat.id ? '#1a1a1a' : 'transparent',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: '1px solid ' + (currentChatId === chat.id ? '#2a2a2a' : 'transparent'),
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (currentChatId !== chat.id) {
                                                e.currentTarget.style.backgroundColor = '#0f0f0f';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (currentChatId !== chat.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div style={{
                                            color: '#fff',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {chat.title}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}>
                                            <span style={{
                                                color: '#666',
                                                fontSize: '11px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}>
                                                <span style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(155, 135, 245, 0.6)',
                                                }} />
                                                {PROVIDERS[chat.provider]?.name || chat.provider}
                                            </span>
                                            <span
                                                onClick={(e) => deleteChat(chat.id, e)}
                                                style={{
                                                    color: '#666',
                                                    fontSize: '14px',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = '#ff6b6b';
                                                    e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = '#666';
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <dc.Icon icon="trash-2" style={{ fontSize: '12px' }} />
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid #2a2a2a',
                backgroundColor: '#0a0a0a',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Burger Menu */}
                    <span
                        className="header-icon"
                        onClick={() => setShowSidebar(!showSidebar)}
                        style={{
                            cursor: 'pointer',
                            color: 'rgba(155, 135, 245, 0.8)',
                            fontSize: '20px',
                        }}
                        title="Chat History"
                    >
                        <dc.Icon icon="menu" />
                    </span>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                        {PROVIDERS[provider].name}
                    </h3>
                    <span style={{ color: '#666', fontSize: '13px' }}>{model}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span
                        className="header-icon"
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            cursor: 'pointer',
                            color: 'rgba(155, 135, 245, 0.8)',
                            fontSize: '18px',
                        }}
                        title="Settings"
                    >
                        <dc.Icon icon="settings" />
                    </span>
                    <span
                        className="header-icon"
                        onClick={startNewChat}
                        style={{
                            cursor: 'pointer',
                            color: 'rgba(155, 135, 245, 0.8)',
                            fontSize: '18px',
                        }}
                        title="New Chat"
                    >
                        <dc.Icon icon="plus" />
                    </span>
                    <span
                        className="header-icon"
                        onClick={handleExitFullTab}
                        style={{
                            cursor: 'pointer',
                            color: 'rgba(155, 135, 245, 0.8)',
                            fontSize: '18px',
                        }}
                        title="Exit Full Tab"
                    >
                        <dc.Icon icon="minimize-2" />
                    </span>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '20px',
                    width: '360px',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    padding: '20px',
                    zIndex: 10000,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>Settings</h4>
                        <span
                            onClick={() => setShowSettings(false)}
                            style={{ cursor: 'pointer', color: '#999', fontSize: '18px' }}
                        >
                            <dc.Icon icon="x" />
                        </span>
                    </div>

                    {/* Provider Selection */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#999', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
                            Provider
                        </label>
                        <select
                            value={provider}
                            onChange={(e) => changeProvider(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: '#0a0a0a',
                                border: '1px solid #2a2a2a',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                height: '44px',
                                boxSizing: 'border-box',
                            }}
                        >
                            {Object.entries(PROVIDERS).map(([id, config]) => (
                                <option key={id} value={id} style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '8px' }}>
                                    {config.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* API Key Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#999', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
                            {provider === 'ollama' ? 'Host URL' : 'API Key'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type={provider === 'ollama' ? 'text' : 'password'}
                                value={apiKeys[provider] || ''}
                                onChange={(e) => saveApiKey(provider, e.target.value)}
                                placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'Enter API key...'}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid #2a2a2a',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {apiKeys[provider] && (
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '8px',
                                        color: 'rgba(76, 175, 80, 0.8)',
                                        fontSize: '18px',
                                    }}
                                >
                                    <dc.Icon icon="check" />
                                </span>
                            )}
                        </div>
                        {!apiKeys[provider] && provider !== 'ollama' && (
                            <p style={{ margin: '6px 0 0 0', color: '#ff6b6b', fontSize: '11px' }}>
                                API key required
                            </p>
                        )}
                    </div>

                    {/* Model Selection */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', color: '#999', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
                            Model {isLoadingModels[provider] && '(Loading...)'}
                        </label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            disabled={isLoadingModels[provider]}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: '#0a0a0a',
                                border: '1px solid #2a2a2a',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                cursor: isLoadingModels[provider] ? 'wait' : 'pointer',
                                height: '44px',
                                boxSizing: 'border-box',
                            }}
                        >
                            {(availableModels[provider] || PROVIDERS[provider].models).map(m => (
                                <option key={m} value={m} style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '8px' }}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        {availableModels[provider] && (
                            <p style={{ margin: '6px 0 0 0', color: 'rgba(76, 175, 80, 0.8)', fontSize: '11px' }}>
                                ✓ {availableModels[provider].length} models available
                            </p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div style={{
                        backgroundColor: 'rgba(155, 135, 245, 0.1)',
                        border: '1px solid rgba(155, 135, 245, 0.3)',
                        borderRadius: '6px',
                        padding: '12px',
                        marginTop: '20px',
                    }}>
                        <p style={{ margin: 0, color: '#999', fontSize: '11px', lineHeight: '1.5' }}>
                            💡 API keys are stored locally in <code style={{ 
                                backgroundColor: '#0a0a0a', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                fontSize: '10px',
                            }}>.datacore/chatllm/.secret/</code>
                        </p>
                    </div>
                </div>
            )}

            {/* Messages Container */}
            <div
                ref={chatContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}
            >
                {messages.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: '16px',
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(155, 135, 245, 0.2), rgba(155, 135, 245, 0.05))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <dc.Icon icon="message-square" style={{ fontSize: '24px', color: 'rgba(155, 135, 245, 0.8)' }} />
                        </div>
                        <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '600', margin: 0 }}>
                            How can I help you today?
                        </h2>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            {(apiKeys[provider] || provider === 'ollama') 
                                ? `Start a conversation with ${PROVIDERS[provider].name}` 
                                : 'Please add your API key in settings'}
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className="message-bubble"
                            style={{
                                display: 'flex',
                                gap: '12px',
                                maxWidth: '800px',
                                alignSelf: 'center',
                                width: '100%',
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: msg.role === 'user' ? 'rgba(155, 135, 245, 0.2)' : '#1a1a1a',
                                border: msg.role === 'assistant' ? '1px solid #2a2a2a' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <dc.Icon
                                    icon={msg.role === 'user' ? 'user' : 'bot'}
                                    style={{
                                        fontSize: '16px',
                                        color: msg.role === 'user' ? 'rgba(155, 135, 245, 0.8)' : '#999'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1, paddingTop: '4px' }}>
                                <div style={{
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    marginBottom: '6px',
                                }}>
                                    {msg.role === 'user' ? 'You' : PROVIDERS[provider].name}
                                </div>
                                
                                {/* Display images if present */}
                                {msg.images && msg.images.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        marginBottom: '12px',
                                    }}>
                                        {msg.images.map((imgSrc, imgIdx) => (
                                            <img
                                                key={imgIdx}
                                                src={imgSrc}
                                                alt="Attached"
                                                style={{
                                                    maxWidth: '200px',
                                                    maxHeight: '200px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #2a2a2a',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                                
                                <div
                                    style={{
                                        color: '#e0e0e0',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word',
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: msg.content
                                            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                                            .replace(/`([^`]+)`/g, '<code style="background: #1a1a1a; padding: 2px 6px; border-radius: 4px; font-size: 13px;">$1</code>')
                                            .replace(/\n/g, '<br/>')
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div
                        style={{
                            display: 'flex',
                            gap: '12px',
                            maxWidth: '800px',
                            alignSelf: 'center',
                            width: '100%',
                        }}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <dc.Icon icon="bot" style={{ fontSize: '16px', color: '#999' }} />
                        </div>
                        <div style={{ flex: 1, paddingTop: '12px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(155, 135, 245, 0.6)',
                                    animation: 'pulse 1.4s ease-in-out infinite',
                                }} />
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(155, 135, 245, 0.6)',
                                    animation: 'pulse 1.4s ease-in-out 0.2s infinite',
                                }} />
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(155, 135, 245, 0.6)',
                                    animation: 'pulse 1.4s ease-in-out 0.4s infinite',
                                }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div 
                ref={inputAreaRef}
                style={{
                    padding: '20px',
                    borderTop: '1px solid #2a2a2a',
                    backgroundColor: '#0a0a0a',
                    position: 'relative',
                }}
            >
                {/* Drag and Drop Overlay */}
                {isDragging && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(155, 135, 245, 0.1)',
                        border: '2px dashed rgba(155, 135, 245, 0.5)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        pointerEvents: 'none',
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <dc.Icon icon="image" style={{ fontSize: '48px', color: 'rgba(155, 135, 245, 0.8)', marginBottom: '12px' }} />
                            <p style={{ color: 'rgba(155, 135, 245, 0.8)', fontSize: '16px', fontWeight: '500', margin: 0 }}>
                                Drop images here
                            </p>
                        </div>
                    </div>
                )}

                {/* Image Preview Area */}
                {attachedImages.length > 0 && (
                    <div style={{
                        maxWidth: '800px',
                        margin: '0 auto 12px auto',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                    }}>
                        {attachedImages.map((img, idx) => (
                            <div key={idx} style={{
                                position: 'relative',
                                width: '80px',
                                height: '80px',
                            }}>
                                <img
                                    src={img.preview}
                                    alt="Preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '1px solid #2a2a2a',
                                    }}
                                />
                                <button
                                    onClick={() => removeImage(idx)}
                                    style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        right: '-6px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ff6b6b',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0,
                                    }}
                                >
                                    <dc.Icon icon="x" style={{ fontSize: '12px', color: '#fff' }} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-end',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    border: '1px solid #2a2a2a',
                }}>
                    {/* Image Upload Button */}
                    {supportsVision && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!apiKeys[provider] && provider !== 'ollama'}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: (apiKeys[provider] || provider === 'ollama') ? 'pointer' : 'not-allowed',
                                    flexShrink: 0,
                                }}
                                title="Attach images (or paste/drag & drop)"
                            >
                                <dc.Icon
                                    icon="paperclip"
                                    style={{
                                        fontSize: '18px',
                                        color: (apiKeys[provider] || provider === 'ollama') ? '#999' : '#555'
                                    }}
                                />
                            </button>
                        </>
                    )}
                    
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={(apiKeys[provider] || provider === 'ollama') ? `Message ${PROVIDERS[provider].name}...` : "Add API key to start"}
                        disabled={!apiKeys[provider] && provider !== 'ollama'}
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '14px',
                            resize: 'none',
                            minHeight: '24px',
                            maxHeight: '200px',
                            fontFamily: 'inherit',
                            lineHeight: '1.5',
                        }}
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={((!input.trim() && attachedImages.length === 0) || isLoading || (!apiKeys[provider] && provider !== 'ollama'))}
                        style={{
                            backgroundColor: ((input.trim() || attachedImages.length > 0) && !isLoading && (apiKeys[provider] || provider === 'ollama')) ? 'rgba(155, 135, 245, 0.8)' : '#2a2a2a',
                            border: 'none',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: ((input.trim() || attachedImages.length > 0) && !isLoading && (apiKeys[provider] || provider === 'ollama')) ? 'pointer' : 'not-allowed',
                            transition: 'background-color 0.2s',
                            flexShrink: 0,
                        }}
                    >
                        <dc.Icon
                            icon={isLoading ? "loader" : "send"}
                            style={{
                                fontSize: '16px',
                                color: ((input.trim() || attachedImages.length > 0) && !isLoading && (apiKeys[provider] || provider === 'ollama')) ? '#fff' : '#666'
                            }}
                        />
                    </button>
                </div>
                <p style={{
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '12px',
                    marginTop: '12px',
                    marginBottom: 0,
                }}>
                    AI can make mistakes. Check important info.
                </p>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

return { ChatLLM };
```
