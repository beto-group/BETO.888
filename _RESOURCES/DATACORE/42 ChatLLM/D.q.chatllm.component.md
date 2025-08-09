



# ViewComponent

```jsx
// ViewComponent

// --- The Definitive Multimodal Gemini Chat View with Full Settings Panel ---

// --- HELPER COMPONENTS & ICONS ---
function HistoryIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 9h10"/><path d="M7 13h10"/><path d="M7 17h10"/></svg>; }
function SettingsIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>; }
function PlusIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>; }
function EditIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>; }
function RerunIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>; }
function TrashIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>; }
function ChevronDownIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>; }
function CloseIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>; }


// --- HELPER & UI COMPONENTS ---
function AIMessage({ content }) {
    const [isMarkedLoaded, setIsMarkedLoaded] = dc.useState(false);
    const messageRef = dc.useRef(null);
    dc.useEffect(() => {
        if (!window.marked) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
            script.onload = () => setIsMarkedLoaded(true);
            document.body.appendChild(script);
            return () => { if (script.parentNode) script.parentNode.removeChild(script); };
        } else { setIsMarkedLoaded(true); }
    }, []);
    dc.useEffect(() => {
        if (!isMarkedLoaded || !messageRef.current) return;
        messageRef.current.querySelectorAll('pre').forEach(pre => {
            if (pre.parentNode.classList.contains('code-block-wrapper')) return;
            const wrapper = document.createElement('div'); wrapper.className = 'code-block-wrapper'; pre.parentNode.insertBefore(wrapper, pre); wrapper.appendChild(pre);
            const button = document.createElement('button'); button.innerText = 'Copy'; button.className = 'copy-button'; const code = pre.querySelector('code');
            if (code) { button.onclick = () => navigator.clipboard.writeText(code.innerText).then(() => { button.innerText = 'Copied!'; setTimeout(() => { button.innerText = 'Copy'; }, 2000); }); } else { button.disabled = true; }
            wrapper.appendChild(button);
        });
    }, [content, isMarkedLoaded]);
    if (!isMarkedLoaded) return <div className="ai-message-bubble">Loading Markdown...</div>;
    return <div ref={messageRef} className="ai-message-bubble" dangerouslySetInnerHTML={{ __html: window.marked.parse(content || '') }} />;
}

function ToggleSwitch({ label, isEnabled, onToggle, isDisabled = false, title = "" }) {
    const id = `toggle-${label.replace(/\s+/g, '-')}`;
    return (
        <div className="setting-row" title={title}>
            <label htmlFor={id} className={isDisabled ? "disabled-label" : ""}>{label}</label>
            <label className="toggle-switch">
                <input id={id} type="checkbox" checked={isEnabled} onChange={onToggle} disabled={isDisabled} />
                <span className="slider"></span>
            </label>
        </div>
    );
}

function ApiKeyManager({ providerConfig, currentApiKey, onSave, onReset }) {
    const [inputValue, setInputValue] = dc.useState('');
    const isHost = providerConfig.id === 'ollama';
    const placeholderText = currentApiKey 
        ? (isHost ? currentApiKey : `sk-...${currentApiKey.slice(-4)}`)
        : `Enter ${providerConfig.displayName} ${isHost ? 'Host' : 'Key'}`;
    
    return (
        <div className="api-key-manager">
            <label>{providerConfig.displayName} {isHost ? 'Host' : 'API Key'}</label>
            <div className="api-key-controls">
                <input 
                    type={isHost ? 'text' : 'password'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholderText}
                    className="api-key-input"
                />
                <button onClick={() => { onSave(providerConfig.id, inputValue); setInputValue(''); }} disabled={!inputValue.trim()}>Save</button>
                <button onClick={() => onReset(providerConfig.id)} disabled={!currentApiKey}>Reset</button>
            </div>
        </div>
    );
}

function ModelFetcher({ providerConfig, settings, apiKey, onUpdateModels }) {
    const [isFetching, setIsFetching] = dc.useState(false);
    const [fetchError, setFetchError] = dc.useState(null);

    const handleFetchModels = async () => {
        if (!apiKey && providerConfig.id !== 'ollama') {
            setFetchError('API key is required to fetch models.');
            return;
        }
        setIsFetching(true);
        setFetchError(null);

        const { endpoint, parser, getHeaders } = providerConfig.modelFetchConfig;
        const endpointPath = typeof endpoint === 'function' ? endpoint(apiKey) : endpoint;
        const baseUrl = settings.baseUrl.endsWith('/') ? settings.baseUrl.slice(0, -1) : settings.baseUrl;
        const url = `${baseUrl}${endpointPath}`;
        const headers = getHeaders(apiKey);

        try {
            let responseData;
            if (window.app && window.app.requestUrl) {
                const response = await window.app.requestUrl({ url, headers, throw: false });
                responseData = response.json;
                if (response.status >= 400) throw new Error(responseData?.error?.message || responseData?.detail || `Server returned status ${response.status}`);
            } else {
                const response = await fetch(url, { headers });
                responseData = await response.json();
                if (!response.ok) throw new Error(responseData?.error?.message || 'Failed to fetch models.');
            }

            if (!responseData) throw new Error("Received empty response from server.");

            const fetchedModels = parser(responseData);
            const modelMap = new Map(settings.models.map(m => [m.id, m]));
            fetchedModels.forEach(m => modelMap.set(m.id, m));
            const newModelList = Array.from(modelMap.values()).sort((a, b) => a.name.localeCompare(b.name));
            onUpdateModels(newModelList);
        } catch (e) {
            setFetchError(e.message);
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className="model-fetcher">
            <button onClick={handleFetchModels} disabled={isFetching}>
                {isFetching ? 'Fetching...' : 'Fetch Available Models'}
            </button>
            {fetchError && <p className="fetch-error">Error: {fetchError}</p>}
        </div>
    );
}

function ModelManager({ models, onUpdateModels }) {
    const [newModelId, setNewModelId] = dc.useState('');
    const [newModelName, setNewModelName] = dc.useState('');
    
    const handleAddModel = () => {
        if (!newModelId.trim() || !newModelName.trim()) return;
        onUpdateModels([...models, { id: newModelId.trim(), name: newModelName.trim() }]);
        setNewModelId(''); setNewModelName('');
    };

    const handleRemoveModel = (idToRemove) => {
        if (models.length <= 1) { alert("Cannot remove the last model."); return; }
        onUpdateModels(models.filter(m => m.id !== idToRemove));
    };

    return (
        <div className="model-manager">
            {models.map(model => (
                <div key={model.id} className="model-entry">
                    <span>{model.name} ({model.id})</span>
                    <button onClick={() => handleRemoveModel(model.id)} title="Remove Model"><TrashIcon/></button>
                </div>
            ))}
            <div className="model-add-form">
                <input value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="Display Name (e.g., Llama 3 8B)" />
                <input value={newModelId} onChange={e => setNewModelId(e.target.value)} placeholder="Model ID (e.g., llama3)" />
                <button onClick={handleAddModel}>Add Model</button>
            </div>
        </div>
    );
}

function ProviderSettingsEditor({ providerConfig, settings, apiKey, updateSetting, handleSaveKey, handleResetKey }) {
    return (
        <>
            <ApiKeyManager 
                providerConfig={providerConfig} 
                currentApiKey={apiKey} 
                onSave={handleSaveKey} 
                onReset={handleResetKey}
            />
            {providerConfig.id !== 'ollama' && (
                <div className="setting-group">
                    <label>Base URL</label>
                    <input 
                        type="text" 
                        value={settings.baseUrl} 
                        onChange={e => updateSetting('baseUrl', e.target.value)} 
                    />
                </div>
            )}
            {providerConfig.settingsComponents(settings, (k, v) => updateSetting(k, v))}
            <details className="model-manager-details">
                <summary>Manage Models</summary>
                {providerConfig.modelFetchConfig && (
                     <ModelFetcher 
                        providerConfig={providerConfig} 
                        settings={settings}
                        apiKey={apiKey}
                        onUpdateModels={(newModels) => updateSetting('models', newModels)}
                     />
                )}
                <ModelManager 
                    models={settings.models} 
                    onUpdateModels={(newModels) => {
                        if (!newModels.some(m => m.id === settings.model)) {
                            updateSetting('model', newModels[0]?.id || '');
                        }
                        updateSetting('models', newModels);
                    }}
                />
            </details>
        </>
    );
}

// --- MAIN CHAT COMPONENT ---
function GeminiChatView() {
  const BASE_CHAT_HISTORY_DIR = ".datacore/chatllm/";
  const SECRET_DIR = ".datacore/chatllm/.secret/";
  const PROVIDER_SETTINGS_FILE = ".datacore/chatllm/provider_settings.json";

  const DEFAULT_PROVIDER_CONFIG = {
      gemini: {
          id: 'gemini', displayName: 'Google Gemini', apiKeyFile: SECRET_DIR + "gemini_api_key.txt",
          getHeaders: (apiKey) => ({ "Content-Type": "application/json" }),
          toProviderMessages: (history) => history,
          parseResponse: (data) => {
              if (!data.candidates || data.candidates.length === 0) throw new Error("No response candidates from Gemini API.");
              return { content: data.candidates[0].content.parts[0].text, usage: data.usageMetadata ? { totalTokens: data.usageMetadata.totalTokens } : null, rawResponse: data.candidates[0].content };
          },
          settingsComponents: (currentSettings, updateSetting) => (<div className="setting-group"><h5>Tools</h5><ToggleSwitch label="Code execution" isEnabled={currentSettings.isCodeExecutionEnabled} onToggle={() => updateSetting('isCodeExecutionEnabled', !currentSettings.isCodeExecutionEnabled)} /><ToggleSwitch label="Grounding with Google Search" isEnabled={currentSettings.isGoogleSearchEnabled} onToggle={() => updateSetting('isGoogleSearchEnabled', !currentSettings.isGoogleSearchEnabled)} /></div>),
          modelFetchConfig: {
              endpoint: (apiKey) => `/v1beta/models?key=${apiKey}`,
              getHeaders: () => ({}),
              parser: (data) => data.models.map(m => ({ id: m.name.split('/')[1], name: m.displayName }))
          },
          supportsVision: true, supportsYoutube: true,
      },
      openai: {
          id: 'openai', displayName: 'OpenAI', apiKeyFile: SECRET_DIR + "openai_api_key.txt",
          getHeaders: (apiKey) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }),
          toProviderMessages: (history) => history.map(msg => msg.role === 'user' ? { role: 'user', content: msg.parts.map(p => p.text ? {type: 'text', text: p.text} : {type: 'image_url', image_url: {url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`}}) } : { role: 'assistant', content: msg.parts[0].text }).filter(Boolean),
          parseResponse: (data) => {
              if (!data.choices || data.choices.length === 0) throw new Error("No response choices from OpenAI API.");
              return { content: data.choices[0].message.content, usage: data.usage ? { totalTokens: data.usage.total_tokens } : null, rawResponse: { role: 'model', parts: [{ text: data.choices[0].message.content }] } };
          },
          settingsComponents: (currentSettings, updateSetting) => (<div className="setting-group"><div><label>Presence Penalty: {currentSettings.presencePenalty}</label><input type="range" min="-2" max="2" step="0.1" value={currentSettings.presencePenalty} onChange={e => updateSetting('presencePenalty', e.target.value)} /></div><div><label>Frequency Penalty: {currentSettings.frequencyPenalty}</label><input type="range" min="-2" max="2" step="0.1" value={currentSettings.frequencyPenalty} onChange={e => updateSetting('frequencyPenalty', e.target.value)} /></div><div className="setting-row"><span>Response Format</span><select value={currentSettings.responseFormat} onChange={e => updateSetting('responseFormat', e.target.value)}><option value="text">Text</option><option value="json_object">JSON Object</option></select></div></div>),
          modelFetchConfig: {
              endpoint: '/models',
              getHeaders: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
              parser: (data) => data.data.map(m => ({ id: m.id, name: m.id })).sort((a,b) => a.name.localeCompare(b.name))
          },
          supportsVision: true, supportsYoutube: false,
      },
      anthropic: {
          id: 'anthropic', displayName: 'Anthropic Claude', apiKeyFile: SECRET_DIR + "anthropic_api_key.txt",
          getHeaders: (apiKey) => ({ "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }),
          toProviderMessages: (history) => history.map(msg => msg.role === 'user' ? { role: 'user', content: msg.parts.map(p => p.text ? {type: 'text', text: p.text} : {type: 'image', source: { type: 'base64', media_type: p.inlineData.mimeType, data: p.inlineData.data }}) } : { role: 'assistant', content: [{ type: 'text', text: msg.parts[0].text }] }),
          parseResponse: (data) => {
              if (!data.content || data.content.length === 0) throw new Error("No response content from Anthropic API.");
              return { content: data.content[0].text, usage: data.usage ? { totalTokens: data.usage.input_tokens + data.usage.output_tokens } : null, rawResponse: { role: 'model', parts: [{ text: data.content[0].text }] } };
          },
          settingsComponents: (currentSettings, updateSetting) => (<div className="setting-group"><label>Max Tokens (Required): {currentSettings.maxTokens}</label><input type="range" min="1" max="8192" step="1" value={currentSettings.maxTokens} onChange={e => updateSetting('maxTokens', e.target.value)} /></div>),
          modelFetchConfig: {
              endpoint: '/v1/models',
              getHeaders: (apiKey) => ({ "x-api-key": apiKey, "anthropic-version": "2023-06-01" }),
              parser: (data) => data.data.map(m => ({ id: m.id, name: m.name }))
          },
          supportsVision: true, supportsYoutube: false,
      },
      ollama: {
          id: 'ollama', displayName: 'Ollama (Local)', apiKeyFile: SECRET_DIR + "ollama_host.txt",
          getHeaders: () => ({ "Content-Type": "application/json" }),
          toProviderMessages: (history) => history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : msg.role, content: msg.parts.find(p => p.text)?.text || '[File content not supported by Ollama]' })),
          parseResponse: (data) => {
              if (!data.message?.content) throw new Error("No response content from Ollama API.");
              return { content: data.message.content, usage: { totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0) }, rawResponse: { role: 'model', parts: [{ text: data.message.content }] } };
          },
          settingsComponents: (currentSettings, updateSetting) => (<div className="setting-group"><label>Context Window (num_ctx): {currentSettings.numCtx}</label><input type="range" min="512" max="32768" step="512" value={currentSettings.numCtx} onChange={e => updateSetting('numCtx', e.target.value)} /></div>),
          modelFetchConfig: {
              endpoint: '/api/tags',
              getHeaders: () => ({}),
              parser: (data) => data.models.map(m => ({ id: m.name, name: m.name.split(':')[0] }))
          },
          supportsVision: false, supportsYoutube: false,
      },
      groq: {
          id: 'groq', displayName: 'GROQ', apiKeyFile: SECRET_DIR + "groq_api_key.txt",
          getHeaders: (apiKey) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }),
          toProviderMessages: (history) => DEFAULT_PROVIDER_CONFIG.openai.toProviderMessages(history),
          parseResponse: (data) => DEFAULT_PROVIDER_CONFIG.openai.parseResponse(data),
          settingsComponents: () => null, 
          modelFetchConfig: {
              endpoint: '/models',
              getHeaders: (apiKey) => ({ 
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json" 
              }),
              parser: (data) => data.data.map(m => ({ id: m.id, name: m.id })).sort((a, b) => a.name.localeCompare(b.name))
          },
          supportsVision: false, supportsYoutube: false,
      },
      openrouter: {
          id: 'openrouter', displayName: 'OpenRouter', apiKeyFile: SECRET_DIR + "openrouter_api_key.txt",
          getHeaders: (apiKey) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": "https://obsidian.md" }),
          toProviderMessages: (history) => DEFAULT_PROVIDER_CONFIG.openai.toProviderMessages(history),
          parseResponse: (data) => DEFAULT_PROVIDER_CONFIG.openai.parseResponse(data),
          settingsComponents: () => null,
          modelFetchConfig: {
              endpoint: '/models',
              getHeaders: () => ({}),
              parser: (data) => data.data.map(m => ({ id: m.id, name: m.name || m.id }))
          },
          supportsVision: true, supportsYoutube: false,
      },
      cerebrium: {
          id: 'cerebrium', displayName: 'Cerebrium', apiKeyFile: SECRET_DIR + "cerebrium_api_key.txt",
          getHeaders: (apiKey) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }),
          toProviderMessages: (history) => DEFAULT_PROVIDER_CONFIG.openai.toProviderMessages(history),
          parseResponse: (data) => DEFAULT_PROVIDER_CONFIG.openai.parseResponse(data),
          settingsComponents: () => (<div className="settings-info-box warning"><p><strong>CORS Notice:</strong> This component uses Obsidian's native request function to avoid common CORS errors when calling external APIs.</p><p>Ensure your <strong>Base URL</strong> is the full endpoint for your app, e.g.,<br/><code>https://api.cortex.cerebrium.ai/v4/p-ID/app-name</code></p></div>),
          supportsVision: false, supportsYoutube: false,
      },
  };
    
  const DEFAULT_SETTINGS = {
      gemini: { baseUrl: 'https://generativelanguage.googleapis.com/', models: [{ id: "gemini-1.5-pro-latest", name: "1.5 Pro" }], model: "gemini-1.5-flash-latest", temperature: 1, stopSequence: "", isCodeExecutionEnabled: false, isGoogleSearchEnabled: false, },
      openai: { baseUrl: 'https://api.openai.com/v1/', models: [{ id: "gpt-4o", name: "GPT-4o" }], model: "gpt-4o", temperature: 0.7, stopSequence: "", presencePenalty: 0, frequencyPenalty: 0, responseFormat: "text" },
      anthropic: { baseUrl: 'https://api.anthropic.com/v1/', models: [{ id: "claude-3-opus-20240229", name: "Claude 3 Opus" }], model: "claude-3-opus-20240229", temperature: 0.7, stopSequence: "", maxTokens: 4096, },
      ollama: { baseUrl: 'http://localhost:11434/', models: [{ id: "llama3", name: "Llama 3" }], model: "llama3", temperature: 0.7, stopSequence: "", numCtx: 4096, },
      groq: { baseUrl: 'https://api.groq.com/openai/v1/', models: [{ id: "llama3-8b-8192", name: "Llama 3 8B" }], model: "llama3-8b-8192", temperature: 0.7, stopSequence: "" },
      openrouter: { baseUrl: 'https://openrouter.ai/api/v1', models: [{ id: "google/gemini-pro", name: "Gemini Pro" }], model: "google/gemini-pro", temperature: 0.7, stopSequence: "" },
      cerebrium: { baseUrl: 'https://api.cortex.cerebrium.ai/v4/', models: [{ id: "your-model", name: "Your Deployed Model" }], model: "your-model", temperature: 0.7, stopSequence: "" },
  };
  
  const [apiKeys, setApiKeys] = dc.useState({});
  const [providerSettings, setProviderSettings] = dc.useState(null);
  const [isAppLoading, setIsAppLoading] = dc.useState(true);
  const [activeProvider, setActiveProvider] = dc.useState('gemini');
  const [messages, setMessages] = dc.useState([]);
  const [currentInput, setCurrentInput] = dc.useState("");
  const [isLoading, setIsLoading] = dc.useState(false);
  const [error, setError] = dc.useState(null);
  const [attachedFiles, setAttachedFiles] = dc.useState([]);
  const [youtubeUrl, setYoutubeUrl] = dc.useState(null);
  const [showAssetMenu, setShowAssetMenu] = dc.useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = dc.useState(false);
  const [youtubeInput, setYoutubeInput] = dc.useState("");
  const [editingMessageIndex, setEditingMessageIndex] = dc.useState(null);
  const [editingText, setEditingText] = dc.useState("");
  const [chatHistory, setChatHistory] = dc.useState([]);
  const [currentChatId, setCurrentChatId] = dc.useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = dc.useState(true);
  const [showHistory, setShowHistory] = dc.useState(true);
  const [showSettings, setShowSettings] = dc.useState(false);
  const [lastTokenCount, setLastTokenCount] = dc.useState(null);
  const [openSettingsAccordion, setOpenSettingsAccordion] = dc.useState(null);

  const activeProviderConfig = DEFAULT_PROVIDER_CONFIG[activeProvider];
  const currentSettings = providerSettings ? providerSettings[activeProvider] : null;

  const chatContainerRef = dc.useRef(null);
  const viewContainerRef = dc.useRef(null);
  const textareaRef = dc.useRef(null);
  const fileInputRef = dc.useRef(null);
  const editingTextareaRef = dc.useRef(null);
  const debounceTimer = dc.useRef(null);

  dc.useEffect(() => {
    const loadApp = async () => {
        const loadedKeys = {};
        for (const providerId in DEFAULT_PROVIDER_CONFIG) {
            const filePath = DEFAULT_PROVIDER_CONFIG[providerId].apiKeyFile;
            if (await app.vault.adapter.exists(filePath)) {
                const key = (await app.vault.adapter.read(filePath)).trim();
                if (key) loadedKeys[providerId] = key;
            }
        }
        setApiKeys(loadedKeys);
        
        let loadedSettings;
        if (await app.vault.adapter.exists(PROVIDER_SETTINGS_FILE)) {
            try {
                loadedSettings = JSON.parse(await app.vault.adapter.read(PROVIDER_SETTINGS_FILE));
                for (const providerId in DEFAULT_SETTINGS) {
                    if (!loadedSettings[providerId]) {
                        loadedSettings[providerId] = DEFAULT_SETTINGS[providerId];
                    }
                }
            } catch (e) { loadedSettings = DEFAULT_SETTINGS; }
        } else { loadedSettings = DEFAULT_SETTINGS; }
        setProviderSettings(loadedSettings);
        setIsAppLoading(false);
    };
    loadApp();
  }, []);

  dc.useEffect(() => {
    if (!providerSettings || isAppLoading) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
        try {
            if (!await app.vault.adapter.exists(BASE_CHAT_HISTORY_DIR)) await app.vault.adapter.mkdir(BASE_CHAT_HISTORY_DIR);
            await app.vault.adapter.write(PROVIDER_SETTINGS_FILE, JSON.stringify(providerSettings, null, 2));
        } catch(e) { console.error("Failed to save provider settings:", e); }
    }, 1000);
  }, [providerSettings, isAppLoading]);
  
  // Proactively fetch models when the provider changes or the app loads
  dc.useEffect(() => {
      if (isAppLoading) return;
      if (apiKeys[activeProvider] || activeProvider === 'ollama') { 
          loadChatHistory(); 
          fetchModelsForProvider(activeProvider);
      } 
      else { 
          setMessages([]); 
          setChatHistory([]); 
          setCurrentChatId(null); 
      }
  }, [apiKeys, activeProvider, isAppLoading]);
  
  dc.useEffect(() => {
      const handleEscape = (event) => {
          if (event.key === 'Escape') {
              if (showSettings) setShowSettings(false);
              if (showHistory) setShowHistory(false);
          }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
  }, [showSettings, showHistory]);

  dc.useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [messages, isLoading]);
  dc.useEffect(() => {
    const handlePaste = (event) => {
      if (!activeProviderConfig.supportsVision) return;
      const item = Array.from(event.clipboardData.items).find(i => i.type.startsWith("image/"));
      if (item) { event.preventDefault(); clearAssets(false); setAttachedFiles(prev => [...prev, { file: item.getAsFile(), previewUrl: URL.createObjectURL(item.getAsFile()) }]); }
    };
    const container = viewContainerRef.current;
    if (container) container.addEventListener('paste', handlePaste);
    return () => { if (container) container.removeEventListener('paste', handlePaste); };
  }, [viewContainerRef.current, activeProviderConfig.supportsVision]);
  dc.useEffect(() => { const textarea = textareaRef.current; if (textarea) { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight}px`; } }, [currentInput]);
  dc.useEffect(() => { const textarea = editingTextareaRef.current; if (textarea) { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight}px`; textarea.focus(); textarea.select(); } }, [editingMessageIndex]);
  
  const updateProviderSetting = (providerId, key, value) => {
    setProviderSettings(prev => ({ ...prev, [providerId]: { ...prev[providerId], [key]: value } }));
  };

  const getChatHistoryDir = () => `${BASE_CHAT_HISTORY_DIR}${activeProvider}/`;

  const loadChatHistory = async () => {
    setIsHistoryLoading(true);
    const currentHistoryDir = getChatHistoryDir();
    if (!await app.vault.adapter.exists(currentHistoryDir)) await app.vault.adapter.mkdir(currentHistoryDir);
    const { files } = await app.vault.adapter.list(currentHistoryDir);
    const historyItems = await Promise.all(files.map(async (file) => {
        try {
            const conversation = JSON.parse(await app.vault.adapter.read(file));
            const firstUserMessage = conversation.find(m => m.role === 'user');
            let title = "Untitled Chat";
            if (firstUserMessage) {
                const textPart = firstUserMessage.parts?.find(p => p.text);
                if (textPart?.text) title = textPart.text.substring(0, 50) + (textPart.text.length > 50 ? '...' : '');
                else if (firstUserMessage.parts?.some(p => p.inlineData || p.fileData)) title = "[Multimodal Input]...";
            }
            return { id: file.split('/').pop(), title };
        } catch (e) { return null; }
    }));
    setChatHistory(historyItems.filter(Boolean).sort((a, b) => parseInt(b.id) - parseInt(a.id)));
    setIsHistoryLoading(false);
  };
  
  const fetchModelsForProvider = async (providerId) => {
      if (!providerSettings) return;

      const providerConfig = DEFAULT_PROVIDER_CONFIG[providerId];
      const settings = providerSettings[providerId];
      const apiKey = apiKeys[providerId];

      if (!providerConfig.modelFetchConfig) return; // Can't fetch if no config
      if (!apiKey && providerConfig.id !== 'ollama') return; // No key, no fetch

      const { endpoint, parser, getHeaders } = providerConfig.modelFetchConfig;
      const endpointPath = typeof endpoint === 'function' ? endpoint(apiKey) : endpoint;
      const baseUrl = settings.baseUrl.endsWith('/') ? settings.baseUrl.slice(0, -1) : settings.baseUrl;
      const url = `${baseUrl}${endpointPath}`;
      const headers = getHeaders(apiKey);

      try {
          let responseData;
          if (window.app && window.app.requestUrl) {
              const response = await window.app.requestUrl({ url, headers, throw: false });
              responseData = response.json;
              if (response.status >= 400) throw new Error(responseData?.error?.message || `Server returned status ${response.status}`);
          } else {
              const response = await fetch(url, { headers });
              responseData = await response.json();
              if (!response.ok) throw new Error(responseData?.error?.message || 'Failed to fetch models.');
          }

          if (!responseData) throw new Error("Received empty response from server.");

          const fetchedModels = parser(responseData);
          const modelMap = new Map(settings.models.map(m => [m.id, m]));
          fetchedModels.forEach(m => modelMap.set(m.id, m));
          const newModelList = Array.from(modelMap.values()).sort((a, b) => a.name.localeCompare(b.name));

          // Only update if the models list is different
          if (JSON.stringify(settings.models) !== JSON.stringify(newModelList)) {
              updateProviderSetting(providerId, 'models', newModelList);
          }

      } catch (e) {
          console.error(`Failed to automatically fetch models for ${providerId}:`, e.message);
          // Don't pop an error to the user for a background fetch
      }
  };

  const handleSaveKeyOrHost = async (providerId, valueToSave) => {
    if (!valueToSave) return;
    const filePath = DEFAULT_PROVIDER_CONFIG[providerId].apiKeyFile;
    try {
        if (!await app.vault.adapter.exists(SECRET_DIR)) await app.vault.adapter.mkdir(SECRET_DIR);
        await app.vault.adapter.write(filePath, valueToSave);
        setApiKeys(prev => ({ ...prev, [providerId]: valueToSave }));
        if (providerId === 'ollama') {
            updateProviderSetting('ollama', 'baseUrl', valueToSave);
        }
        setError(null);
    } catch (e) { setError(`Could not save key/host for ${providerId}.`); }
  };

  const handleResetKeyOrHost = async (providerId) => {
      const filePath = DEFAULT_PROVIDER_CONFIG[providerId].apiKeyFile;
      try {
          if (await app.vault.adapter.exists(filePath)) await app.vault.adapter.delete(filePath);
          setApiKeys(prev => { const newKeys = { ...prev }; delete newKeys[providerId]; return newKeys; });
          if (providerId === 'ollama') {
              updateProviderSetting('ollama', 'baseUrl', DEFAULT_SETTINGS.ollama.baseUrl);
          }
          setError(null);
      } catch(e) { setError(`Could not delete key/host file for ${providerId}.`); }
  };
  
  const getFilePart = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ inlineData: { mimeType: file.type, data: reader.result.split(',')[1] } }); reader.onerror = reject; reader.readAsDataURL(file); });
  const clearAssets = (all = true) => { attachedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl)); setAttachedFiles([]); if (all) setYoutubeUrl(null); };
  const handleRemoveFile = (index) => { URL.revokeObjectURL(attachedFiles[index].previewUrl); setAttachedFiles(prev => prev.filter((_, i) => i !== index)); };
  const handleAttachFile = () => { setShowAssetMenu(false); fileInputRef.current.click(); };
  const handleFileSelected = (e) => { const files = Array.from(e.target.files); if (files.length > 0) { clearAssets(false); setAttachedFiles(p => [...p, ...files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }))]); } e.target.value = null; };
  const handleAddYoutubeUrl = () => { setShowAssetMenu(false); setYoutubeInput(""); setShowYoutubeModal(true); };
  const handleConfirmYoutubeUrl = () => { const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([\w-]{11})/; if (youtubeInput && regex.test(youtubeInput)) { clearAssets(true); setYoutubeUrl(youtubeInput); } else if (youtubeInput) { setError("Invalid YouTube URL."); } setShowYoutubeModal(false); setYoutubeInput(""); };
  const handleEditClick = (index) => { setEditingText(messages[index].parts.find(p => p.text)?.text || ""); setEditingMessageIndex(index); };
  const handleNewChat = () => { setCurrentChatId(null); setMessages([]); setError(null); clearAssets(true); setCurrentInput(""); setLastTokenCount(null); };
  const handleLoadChat = async (chatId) => { try { setMessages(JSON.parse(await app.vault.adapter.read(getChatHistoryDir() + chatId))); setCurrentChatId(chatId); setError(null); setLastTokenCount(null); } catch (e) { setError("Could not load chat."); } };
  const saveChat = async (chatId, conversation) => { try { await app.vault.adapter.write(getChatHistoryDir() + chatId, JSON.stringify(conversation, null, 2)); } catch (e) { setError("Failed to save chat history."); } };

  const callLLMAPI = async (history, chatIdToUpdate) => {
    setIsLoading(true); setError(null);
    const apiKey = apiKeys[activeProvider];
    if (!apiKey && activeProvider !== 'ollama') { setError(`${activeProviderConfig.displayName} API Key not set.`); setIsLoading(false); return; }

    try {
        const headers = activeProviderConfig.getHeaders(apiKey);
        const transformedMessages = activeProviderConfig.toProviderMessages(history);
        let url, body;
        if (activeProvider === 'gemini') {
            const apiVersion = currentSettings.model.includes('preview') || currentSettings.model.includes('latest') ? 'v1beta' : 'v1';
            url = `${currentSettings.baseUrl}${apiVersion}/models/${currentSettings.model}:generateContent?key=${apiKey}`;
            body = { contents: transformedMessages, generationConfig: { temperature: Number(currentSettings.temperature), ...(currentSettings.stopSequence && { stopSequences: [currentSettings.stopSequence] }) } };
            const tools = [];
            if (currentSettings.isCodeExecutionEnabled) tools.push({ "code_execution": {} });
            if (currentSettings.isGoogleSearchEnabled) tools.push({ "google_search_retrieval": {} });
            if (tools.length > 0) body.tools = tools;
        } else if (activeProvider === 'ollama') {
            url = `${currentSettings.baseUrl}api/chat`;
            body = { model: currentSettings.model, messages: transformedMessages, stream: false, options: { temperature: Number(currentSettings.temperature), num_ctx: Number(currentSettings.numCtx), ...(currentSettings.stopSequence && { stop: [currentSettings.stopSequence] }) } };
        } else {
            url = `${currentSettings.baseUrl.endsWith('/') ? currentSettings.baseUrl : currentSettings.baseUrl + '/'}chat/completions`;
            body = { model: currentSettings.model, messages: transformedMessages, temperature: Number(currentSettings.temperature) };
            if (currentSettings.stopSequence) body.stop = [currentSettings.stopSequence];
            if (activeProvider === 'anthropic') { body.stop_sequences = body.stop; delete body.stop; body.max_tokens = Number(currentSettings.maxTokens); }
            if (activeProvider === 'openai' || activeProvider === 'groq') { body.presence_penalty = Number(currentSettings.presencePenalty); body.frequency_penalty = Number(currentSettings.frequencyPenalty); if (currentSettings.responseFormat === 'json_object') body.response_format = { type: 'json_object' }; }
        }

        let responseData;
        if (window.app && window.app.requestUrl) {
            const response = await window.app.requestUrl({ url, method: 'POST', headers, contentType: 'application/json', body: JSON.stringify(body), throw: false });
            responseData = response.json;
            if (response.status >= 400) throw new Error(responseData?.error?.message || responseData?.detail || JSON.stringify(responseData) || `API Error (${response.status})`);
        } else {
            const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
            responseData = await response.json();
            if (!response.ok) throw new Error(responseData?.error?.message || responseData?.detail || JSON.stringify(responseData) || `API Error (${response.status})`);
        }
        
        const { content, usage, rawResponse } = activeProviderConfig.parseResponse(responseData);
        setLastTokenCount(usage);
        const updatedHistory = [...history, rawResponse || { role: 'model', parts: [{ text: content }] }];
        setMessages(updatedHistory);
        let newChatId = chatIdToUpdate;
        if (!newChatId) {
            newChatId = `${Date.now()}.json`; setCurrentChatId(newChatId);
            const firstUserMessage = history.find(m => m.role === 'user');
            let title = firstUserMessage?.parts?.find(p => p.text)?.text.substring(0, 50) || "[Multimodal Input]";
            setChatHistory(prev => [{ id: newChatId, title }, ...prev]);
        }
        await saveChat(newChatId, updatedHistory);
    } catch (err) { console.error("API Call Error:", err); setError(err.message); setMessages(history); } finally { setIsLoading(false); }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!currentInput.trim() && attachedFiles.length === 0 && !youtubeUrl) || isLoading) return;

    const userParts = [];
    if (currentInput.trim()) userParts.push({ text: currentInput.trim() });
    if (attachedFiles.length > 0) {
      if (!activeProviderConfig.supportsVision) { setError(`Image attachments not supported by ${activeProviderConfig.displayName}.`); return; }
      try { userParts.push(...await Promise.all(attachedFiles.map(f => getFilePart(f.file)))); } catch (err) { setError("Failed to process file(s)."); return; }
    }
    if (youtubeUrl) {
      if (!activeProviderConfig.supportsYoutube) { setError(`YouTube URLs not supported by ${activeProviderConfig.displayName}.`); return; }
      userParts.push({ fileData: { mimeType: 'video/youtube', fileUri: youtubeUrl } });
    }
    if (userParts.length === 0) return;
    const newHistory = [...messages, { role: "user", parts: userParts }];
    setMessages(newHistory); setCurrentInput(""); clearAssets(true);
    await callLLMAPI(newHistory, currentChatId);
  };

  const handleSaveAndRerun = async (index) => {
    const historyToEdit = messages.slice(0, index);
    const editedMessage = { ...messages[index], parts: [...messages[index].parts.filter(p => !p.text), { text: editingText }] };
    const newHistory = [...historyToEdit, editedMessage];
    setEditingMessageIndex(null); setEditingText(""); setMessages(newHistory);
    await callLLMAPI(newHistory, currentChatId);
  };

  const handleSimpleRerun = async (aiMessageIndex) => { const historyToRerun = messages.slice(0, aiMessageIndex); setMessages(historyToRerun); await callLLMAPI(historyToRerun, currentChatId); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
  const isSendDisabled = isLoading || (!apiKeys[activeProviderConfig.id] && activeProviderConfig.id !== 'ollama') || (!currentInput.trim() && attachedFiles.length === 0 && !youtubeUrl);

  if (isAppLoading) return <div style={{ padding: "20px", textAlign: "center", color: '#ddd' }}>Loading Chat Engine...</div>;
  
  return (
    <div ref={viewContainerRef} className={`chat-view-wrapper ${showHistory ? '' : 'history-hidden'} ${showSettings ? '' : 'settings-hidden'}`}>
      <style>{`
        :root {
            --bg-deep: #21252b; --bg-medium: #282c34; --bg-light: #3a3f47; --bg-lighter: #444c56;
            --border-color: #444; --text-primary: #e6edf3; --text-secondary: #b0b8c2;
            --accent-primary: #007acc; --accent-primary-hover: #0095ff; --accent-primary-text: #ffffff;
            --accent-danger: #f44336; --accent-warning-bg: #4d4d00; --accent-warning-border: #999900;
            --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --border-radius: 8px; --panel-width: 260px; --settings-width: 420px; --transition-speed: 0.3s;
        }
        .chat-view-wrapper { display: flex; height: 85vh; width: 100%; background-color: var(--bg-medium); font-family: var(--font-family); color: var(--text-primary); border-radius: var(--border-radius); border: 1px solid var(--border-color); overflow: hidden; position: relative; }
        .history-panel, .settings-panel { background-color: var(--bg-deep); display: flex; flex-direction: column; transition: transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease, width var(--transition-speed) ease, min-width var(--transition-speed) ease; z-index: 20; }
        .chat-main { display: flex; flex-direction: column; flex-grow: 1; min-width: 0; }
        @media (min-width: 1025px) {
            .history-panel { width: var(--panel-width); border-right: 1px solid var(--border-color); }
            .chat-view-wrapper.history-hidden .history-panel { width: 0; min-width: 0; overflow: hidden; border-right: none; }
            .settings-panel { width: var(--settings-width); border-left: 1px solid var(--border-color); }
            .chat-view-wrapper.settings-hidden .settings-panel { width: 0; min-width: 0; overflow: hidden; border-left: none; }
        }
        @media (max-width: 1024px) {
            .history-panel, .settings-panel { position: absolute; top: 0; bottom: 0; box-shadow: 0 0 20px rgba(0,0,0,0.3); }
            .history-panel { left: 0; width: var(--panel-width); transform: translateX(-100%); }
            .chat-view-wrapper:not(.history-hidden) .history-panel { transform: translateX(0); }
            .settings-panel { right: 0; width: var(--settings-width); max-width: 90vw; transform: translateX(100%); }
            .chat-view-wrapper:not(.settings-hidden) .settings-panel { transform: translateX(0); }
            .panel-overlay-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 19; opacity: 0; pointer-events: none; transition: opacity var(--transition-speed); }
            .chat-view-wrapper:not(.history-hidden) .panel-overlay-backdrop, .chat-view-wrapper:not(.settings-hidden) .panel-overlay-backdrop { opacity: 1; pointer-events: all; }
        }
        .chat-header { padding: 10px 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
        .header-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex-wrap: wrap; }
        .header-btn, .panel-close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 5px; transition: background-color 0.2s, color 0.2s; }
        .header-btn:hover, .panel-close-btn:hover { background-color: var(--bg-light); color: var(--text-primary); }
        .header-title { margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 1.1em; flex-grow: 1; min-width: 50px; }
        .provider-select, .model-select { padding: 6px 10px; background-color: var(--bg-light); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 5px; font-size: 0.9em; max-width: 150px; }
        .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
        .panel-header h4 { margin: 0; font-size: 1.1em; }
        .new-chat-btn { width: 100%; padding: 10px 15px; background-color: var(--bg-light); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; cursor: pointer; text-align: left; font-size: 1em; transition: background-color 0.2s; }
        .history-list { flex-grow: 1; overflow-y: auto; padding: 10px; }
        .history-item { padding: 10px; border-radius: 5px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: background-color 0.2s; }
        .history-item:hover { background-color: var(--bg-light); }
        .history-item.active { background-color: var(--accent-primary); color: var(--accent-primary-text); }
        .chat-container { flex-grow: 1; padding: 20px; overflow-y: auto; }
        .message-container { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
        .message-container.user { justify-content: flex-end; }
        .user-message-bubble { background-color: var(--accent-primary); color: var(--accent-primary-text); }
        .ai-message-bubble { background-color: var(--bg-lighter); color: var(--text-primary); }
        .ai-message-bubble, .user-message-bubble { max-width: 90%; padding: 10px 15px; border-radius: 15px; line-height: 1.6; word-break: break-word; }
        .action-button-wrapper { display: flex; flex-direction: column; gap: 8px; position: sticky; bottom: 10px; align-self: flex-end; flex-shrink: 0; z-index: 10; opacity: 0; transition: opacity 0.2s; }
        .message-container:hover .action-button-wrapper { opacity: 1; }
        .action-button { background-color: rgba(58, 58, 58, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); color: #d0d0d0; cursor: pointer; padding: 4px; border-radius: 6px; }
        .chat-input-area { padding: 15px; border-top: 1px solid var(--border-color); flex-shrink: 0; }
        .input-form { display: flex; align-items: flex-end; gap: 10px; }
        .main-textarea { flex-grow: 1; padding: 12px; border-radius: var(--border-radius); background-color: var(--bg-deep); color: var(--text-primary); border: 1px solid var(--border-color); font-family: inherit; font-size: 1em; line-height: 1.4; resize: none; max-height: 150px; overflow-y: auto; }
        .main-textarea:disabled { background-color: var(--bg-light); cursor: not-allowed; }
        .send-button { padding: 10px 20px; border-radius: var(--border-radius); border: none; background-color: var(--accent-primary); color: var(--accent-primary-text); cursor: pointer; transition: background-color 0.2s; font-weight: 500; }
        .send-button:disabled { background-color: var(--bg-light); cursor: not-allowed; }
        .settings-panel-content { flex-grow: 1; overflow-y: auto; padding: 20px; }
        .settings-panel-content h4 { margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
        .settings-divider { border-top: 2px solid var(--border-color); margin: 20px 0; }
        .setting-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .settings-panel-content input, .settings-panel-content select { padding: 8px; background-color: var(--bg-deep); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 5px; box-sizing: border-box; width: 100%; }
        .setting-group { margin-bottom: 15px; }
        .setting-group label, h5 { display: block; font-weight: bold; margin-bottom: 8px; }
        .settings-info-box.warning { background-color: var(--accent-warning-bg); border: 1px solid var(--accent-warning-border); padding: 15px; border-radius: var(--border-radius); font-size: 0.9em; color: var(--text-primary); margin-top: 10px; }
        .provider-accordion-header { background-color: var(--bg-light); padding: 12px 15px; border-radius: var(--border-radius); cursor: pointer; display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .provider-accordion-header svg { transition: transform var(--transition-speed); }
        .provider-accordion-header.open svg { transform: rotate(180deg); }
        .provider-accordion-content { max-height: 0; overflow: hidden; transition: max-height var(--transition-speed) ease-out, padding var(--transition-speed) ease-out; background-color: var(--bg-deep); padding: 0 15px; border: 1px solid transparent; border-top: none; border-radius: 0 0 var(--border-radius) var(--border-radius); }
        .provider-accordion-content.open { max-height: 1000px; padding: 15px; border-color: var(--border-color); }
        .api-key-manager { margin-bottom: 15px; }
        .api-key-controls { display: flex; gap: 8px; align-items: center; }
        .api-key-controls button { background-color: var(--accent-primary); border: none; }
        .model-manager-details summary { cursor: pointer; font-weight: bold; margin-top: 15px; }
        .model-fetcher { margin-bottom: 15px; }
        .model-fetcher button { width: 100%; }
        .fetch-error { color: var(--accent-danger); font-size: 0.9em; }
        .model-entry { display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-deep); padding: 5px 8px; border-radius: 4px; margin: 5px 0; }
        .model-entry button { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
        .model-add-form { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-light); transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--accent-primary); }
        input:checked + .slider:before { transform: translateX(20px); }
      `}</style>
      
      <div className="panel-overlay-backdrop" onClick={() => { setShowHistory(false); setShowSettings(false); }}></div>
      
      <div className="history-panel">
          <div className="panel-header">
              <h4>Chat History</h4>
              <button onClick={() => setShowHistory(false)} className="panel-close-btn" title="Close History (Esc)"><CloseIcon /></button>
          </div>
          <div style={{padding: '10px 15px', borderBottom: '1px solid var(--border-color)'}}><button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button></div>
          <div className="history-list">
            {isHistoryLoading ? <div style={{padding: '10px', color: 'var(--text-secondary)'}}>Loading...</div> :
             chatHistory.length === 0 ? <div style={{padding: '10px', color: '#888', textAlign: 'center'}}>No chats for {activeProviderConfig.displayName}.</div> :
             chatHistory.map(chat => <div key={chat.id} className={`history-item ${currentChatId === chat.id ? 'active' : ''}`} onClick={() => {handleLoadChat(chat.id); setShowHistory(false);}} title={chat.title}>{chat.title}</div>)
            }
          </div>
        </div>

      <div className="chat-main">
        <div className="chat-header">
          <div className="header-left">
            <button onClick={() => setShowHistory(true)} className="header-btn" title="Toggle History"><HistoryIcon /></button>
            <select value={activeProvider} onChange={(e) => { setActiveProvider(e.target.value); handleNewChat(); }} className="provider-select">
                {Object.values(DEFAULT_PROVIDER_CONFIG).map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
            {currentSettings && currentSettings.models.length > 0 && (
                 <select value={currentSettings.model} onChange={e => updateProviderSetting(activeProvider, 'model', e.target.value)} className="model-select">
                    {currentSettings.models.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
            )}
            <h3 className="header-title">{currentChatId ? chatHistory.find(c => c.id === currentChatId)?.title || "Chat" : "New Chat"}</h3>
          </div>
          <button onClick={() => setShowSettings(true)} className="header-btn" title="Toggle Settings"><SettingsIcon /></button>
        </div>
        
        <div ref={chatContainerRef} className="chat-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message-container ${msg.role}`}>
              {editingMessageIndex === index ? (
                <div className="edit-prompt-container">
                  <textarea ref={editingTextareaRef} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                  <div className="edit-prompt-buttons">
                    <button onClick={() => setEditingMessageIndex(null)}>Cancel</button>
                    <button onClick={() => handleSaveAndRerun(index)}>Save & Rerun</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={msg.role === 'user' ? 'user-message-bubble' : ''} style={{minWidth: 0, flexShrink: 1}}>
                    {msg.role === 'user' ? (
                      <div>{msg.parts?.map((part, partIndex) => {
                          if (part.text) return <div key={partIndex}>{part.text}</div>;
                          if (part.inlineData) {
                            const src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            if (part.inlineData.mimeType.startsWith('image/')) return <img key={partIndex} src={src} style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '5px' }} alt="User upload" />;
                            if (part.inlineData.mimeType.startsWith('audio/')) return <audio key={partIndex} src={src} controls style={{filter: 'invert(1)', marginTop: '5px'}}/>;
                            return <div key={partIndex} style={{ fontStyle: 'italic' }}>[File: {part.inlineData.mimeType}]</div>
                          }
                          if (part.fileData) return <div key={partIndex} style={{ fontStyle: 'italic' }}>[YouTube Video Attached]</div>
                          return null;
                        })}</div>
                    ) : (<AIMessage content={msg.parts?.[0]?.text} />)}
                  </div>
                  <div className="action-button-wrapper">
                    {msg.role === 'user' && !isLoading && <button className="action-button" onClick={() => handleEditClick(index)} title="Edit"><EditIcon /></button>}
                    {msg.role === 'model' && !isLoading && (index === messages.length - 1) && <button className="action-button" onClick={() => handleSimpleRerun(index)} title="Rerun"><RerunIcon /></button>}
                  </div>
                </>
              )}
            </div>
          ))}
          {isLoading && <div style={{ textAlign: "center", color: "var(--text-secondary)" }}><i>{activeProviderConfig.displayName} is thinking...</i></div>}
          {error && <div style={{ backgroundColor: "var(--accent-danger)", color: "white", padding: "10px", borderRadius: "var(--border-radius)", margin: '10px 0' }}><strong>Error:</strong> {error}</div>}
        </div>
        
        <div className="chat-input-area">
            <div style={{ marginBottom: attachedFiles.length > 0 || youtubeUrl ? '10px' : '0' }}>
              {youtubeUrl && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-deep)', padding: '5px 10px', borderRadius: '5px' }}><span>📺 {youtubeUrl}</span><button onClick={() => setYoutubeUrl(null)} style={{ background:'none', border:'none', color:'var(--text-primary)', cursor:'pointer', fontSize:'1.2em' }}>×</button></div>}
              {attachedFiles.length > 0 && ( <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {attachedFiles.map((item, index) => (
                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                      {item.file.type.startsWith('image/') ? <img src={item.previewUrl} style={{ height: '70px', borderRadius: '8px', border: '1px solid #555' }} alt="Asset preview" /> :
                       item.file.type.startsWith('audio/') ? <audio src={item.previewUrl} controls style={{height: '50px', filter: 'invert(1)'}} /> :
                       <div style={{height: '70px', width: '70px', backgroundColor: '#3a3a3a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8em', padding: '5px', textAlign: 'center', overflow: 'hidden'}}>{item.file.name}</div>}
                      <button onClick={() => handleRemoveFile(index)} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#333', color: 'white', border: '2px solid #282c34', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' }}>×</button>
                    </div>
                  ))}
                </div>)}
            </div>
            <form onSubmit={handleSendMessage} className="input-form">
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setShowAssetMenu(!showAssetMenu)} className="header-btn"><PlusIcon /></button>
                {showAssetMenu && (<div className="asset-menu" style={{ position: 'absolute', bottom: '55px', left: 0, background: 'var(--bg-lighter)', borderRadius: 'var(--border-radius)', padding: '5px', boxShadow: '0 4px 8px rgba(0,0,0,0.3)', width: '220px', zIndex: 100 }}>
                    {activeProviderConfig.supportsVision && <button onClick={handleAttachFile} style={{ display:'block', width:'100%', padding:'8px 12px', background:'none', border:'none', color:'var(--text-primary)', textAlign:'left', cursor:'pointer', borderRadius: '4px' }}>📎 Attach File</button>}
                    {activeProviderConfig.supportsYoutube && <button onClick={handleAddYoutubeUrl} style={{ display:'block', width:'100%', padding:'8px 12px', background:'none', border:'none', color:'var(--text-primary)', textAlign:'left', cursor:'pointer', borderRadius: '4px' }}>📺 Add YouTube Video</button>}
                  </div>)}
              </div>
              <textarea ref={textareaRef} value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={handleKeyDown} 
                placeholder={!apiKeys[activeProviderConfig.id] && activeProviderConfig.id !== 'ollama' ? `Please add a ${activeProviderConfig.displayName} API key in Settings` : "Ask a question or paste an asset..."} 
                disabled={isLoading || (!apiKeys[activeProviderConfig.id] && activeProviderConfig.id !== 'ollama')} 
                rows="1" className="main-textarea"/>
              <button type="submit" disabled={isSendDisabled} className="send-button">Send</button>
            </form>
        </div>
      </div>
      
      <div className="settings-panel">
          <div className="panel-header">
              <h4>Settings</h4>
              <button onClick={() => setShowSettings(false)} className="panel-close-btn" title="Close Settings (Esc)"><CloseIcon /></button>
          </div>
        {currentSettings && (
            <div className="settings-panel-content">
                <h4>Run Settings: {activeProviderConfig.displayName}</h4>
                <div className="setting-group">
                    <label>Model</label>
                    <select value={currentSettings.model} onChange={e => updateProviderSetting(activeProvider, 'model', e.target.value)}>
                        {currentSettings.models.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                    </select>
                </div>
                <div className="setting-row"><span>Token count</span><span>{lastTokenCount ? `${lastTokenCount.totalTokens}` : 'N/A'}</span></div>
                <div className="setting-group">
                    <label>Temperature: {currentSettings.temperature}</label>
                    <input type="range" min="0" max={activeProviderConfig.id === 'anthropic' ? '1' : '2'} step="0.1" value={currentSettings.temperature} onChange={e => updateProviderSetting(activeProvider, 'temperature', e.target.value)} />
                </div>
                <div className="setting-group">
                    <label>Stop sequence</label>
                    <input type="text" value={currentSettings.stopSequence} onChange={e => updateProviderSetting(activeProvider, 'stopSequence', e.target.value)} placeholder="e.g., '##'" />
                </div>
                
                <div className="settings-divider"></div>

                <h4>Provider Configurations</h4>
                {Object.values(DEFAULT_PROVIDER_CONFIG).map(provider => {
                    const isOpen = openSettingsAccordion === provider.id;
                    return (
                        <div key={provider.id} className="provider-accordion">
                            <button className={`provider-accordion-header ${isOpen ? 'open' : ''}`} onClick={() => setOpenSettingsAccordion(isOpen ? null : provider.id)}>
                                <span>{provider.displayName}</span>
                                <ChevronDownIcon />
                            </button>
                            <div className={`provider-accordion-content ${isOpen ? 'open' : ''}`}>
                                <ProviderSettingsEditor 
                                    providerConfig={provider}
                                    settings={providerSettings[provider.id]}
                                    apiKey={apiKeys[provider.id]}
                                    updateSetting={(key, value) => updateProviderSetting(provider.id, key, value)}
                                    handleSaveKey={handleSaveKeyOrHost}
                                    handleResetKey={handleResetKeyOrHost}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </div>

       <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} multiple />
       {showYoutubeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-medium)', padding: '25px', borderRadius: 'var(--border-radius)', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', width: '90%', maxWidth: '500px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Enter YouTube Video URL</h4>
            <input type="text" value={youtubeInput} onChange={(e) => setYoutubeInput(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #555', backgroundColor: '#333', color: 'white', marginBottom: '20px' }} autoFocus />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowYoutubeModal(false)} style={{ padding: '8px 16px', borderRadius: '5px', border: '1px solid #555', background: '#3a3a3a', color: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConfirmYoutubeUrl} style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', background: '#007acc', color: 'white', cursor: 'pointer' }}>Add Video</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

return { GeminiChatView };
```