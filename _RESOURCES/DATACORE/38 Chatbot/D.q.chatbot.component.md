






# ViewComponent

```jsx
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

function TelegramBotSender() {
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `telegram-bot-${instanceId}`;
  
  const [messageContent, setMessageContent] = useState("");
  const [status, setStatus] = useState({ type: 'ready', message: 'Ready to send message to Telegram' });
  const [isSending, setIsSending] = useState(false);
  const [workerUrl, setWorkerUrl] = useState("https://your-installation-setup-😜.cloudflare-748.workers.dev");
  const [showSettings, setShowSettings] = useState(false);
  const [isFullTab, setIsFullTab] = useState(true);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;

  const WORKER_URL_PATH = ".datacore/chatbot/.secret/telegram_worker_url.txt";

  // Full-tab effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;
    
    const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }
    
    const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
    stateRefs.originalParent = container.parentNode;
    stateRefs.placeholder = document.createElement('div');
    stateRefs.placeholder.style.display = 'none';
    container.parentNode.insertBefore(stateRefs.placeholder, container);
    
    stateRefs.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    
    if (stateRefs.parentPositionInfo.original === 'static') {
      contentWrapper.style.position = 'relative';
    }
    
    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '9998',
      overflow: 'auto',
    });
    
    return () => {
      if (stateRefs.placeholder?.parentNode) {
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position = 
          stateRefs.parentPositionInfo.original === 'static' ? '' : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute('style');
      Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
    };
  }, [isFullTab]);

  // Load saved worker URL
  useEffect(() => {
    const loadWorkerUrl = async () => {
      try {
        if (await app.vault.adapter.exists(WORKER_URL_PATH)) {
          const url = (await app.vault.adapter.read(WORKER_URL_PATH)).trim();
          setWorkerUrl(url);
        }
      } catch (e) {
        console.error('Failed to load worker URL:', e);
      }
    };
    loadWorkerUrl();
  }, []);

  // Save worker URL
  const saveWorkerUrl = async () => {
    try {
      const dir = ".datacore/chatbot/.secret";
      if (!await app.vault.adapter.exists(dir)) {
        await app.vault.adapter.mkdir(dir);
      }
      await app.vault.adapter.write(WORKER_URL_PATH, workerUrl.trim());
      setStatus({ type: 'success', message: 'Worker URL saved successfully' });
      setShowSettings(false);
    } catch (e) {
      setStatus({ type: 'error', message: 'Failed to save worker URL: ' + e.message });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      setStatus({ type: 'error', message: 'Message cannot be empty' });
      return;
    }

    setIsSending(true);
    setStatus({ type: 'sending', message: 'Sending message to Telegram...' });

    try {
      const response = await fetch(`${workerUrl}/send-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageContent }),
        mode: "no-cors"
      });

      setStatus({ type: 'success', message: 'Message sent! Check your Telegram bot' });
      setMessageContent("");
      
      // Focus back on textarea
      setTimeout(() => textareaRef.current?.focus(), 100);

    } catch (error) {
      console.error("Telegram send error:", error);
      setStatus({ type: 'error', message: 'Failed to send message. Check worker URL and try again.' });
    } finally {
      setIsSending(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to send
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = () => {
    switch (status.type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'sending': return 'loader';
      default: return 'info';
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case 'success': return '#4caf50';
      case 'error': return '#ff6b6b';
      case 'sending': return '#9b87f5';
      default: return '#666';
    }
  };

  const styles = {
    hoverEffectStyle: `
      .${uniqueWrapperClass} .subtle-icon {
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
      }
      .${uniqueWrapperClass}:hover .subtle-icon {
        opacity: 0.7;
        transform: scale(1);
      }
      .${uniqueWrapperClass} .subtle-icon:hover {
        opacity: 1;
      }
    `,
    container: {
      width: '100%',
      padding: '20px',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative'
    },
    exitIcon: {
      position: 'absolute',
      top: '15px',
      right: '20px',
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#9b87f5',
      userSelect: 'none',
      cursor: 'pointer',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'all 0.2s'
    },
    compactWrapper: {
      padding: '16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      border: '1px dashed #2d2d2d',
      borderRadius: '8px',
      backgroundColor: '#1a1a1a'
    },
    compactText: {
      margin: 0,
      color: '#666',
      fontSize: '14px'
    },
    enterButton: {
      padding: '8px 16px',
      fontSize: '12px',
      fontWeight: '500',
      color: '#000000',
      backgroundColor: '#9b87f5',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    header: {
      borderBottom: '2px solid #9b87f5',
      paddingBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    titleIcon: {
      color: '#9b87f5',
      fontSize: '32px'
    },
    settingsButton: {
      padding: '8px 16px',
      backgroundColor: '#1a1a1a',
      border: '1px solid #9b87f5',
      borderRadius: '4px',
      color: '#9b87f5',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s'
    },
    statusBar: {
      backgroundColor: '#1a1a1a',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '6px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px'
    },
    statusIcon: {
      color: getStatusColor(),
      fontSize: '18px',
      animation: status.type === 'sending' ? 'spin 1s linear infinite' : 'none'
    },
    statusText: {
      color: getStatusColor(),
      flex: 1
    },
    card: {
      backgroundColor: '#1a1a1a',
      border: '1px solid #2d2d2d',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#9b87f5',
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    textarea: {
      width: '100%',
      minHeight: '200px',
      padding: '14px',
      backgroundColor: '#0a0a0a',
      border: '1px solid #9b87f5',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '15px',
      fontFamily: 'inherit',
      resize: 'vertical',
      outline: 'none',
      lineHeight: '1.6',
      boxSizing: 'border-box'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      alignItems: 'center'
    },
    sendButton: {
      padding: '12px 24px',
      backgroundColor: '#9b87f5',
      border: 'none',
      borderRadius: '6px',
      color: '#000000',
      cursor: isSending ? 'not-allowed' : 'pointer',
      fontSize: '15px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      opacity: isSending ? 0.6 : 1
    },
    clearButton: {
      padding: '12px 20px',
      backgroundColor: '#1a1a1a',
      border: '1px solid #2d2d2d',
      borderRadius: '6px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s'
    },
    hint: {
      fontSize: '12px',
      color: '#666',
      fontFamily: 'monospace'
    },
    settingsModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    },
    settingsContent: {
      backgroundColor: '#0a0a0a',
      border: '2px solid #9b87f5',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '600px',
      width: '90%',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    settingsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #2d2d2d',
      paddingBottom: '12px'
    },
    settingsTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#9b87f5',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '4px'
    },
    input: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#1a1a1a',
      border: '1px solid #9b87f5',
      borderRadius: '4px',
      color: '#ffffff',
      fontSize: '14px',
      fontFamily: 'monospace',
      boxSizing: 'border-box'
    },
    label: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#9b87f5',
      marginBottom: '8px',
      display: 'block'
    },
    helpText: {
      fontSize: '12px',
      color: '#666',
      lineHeight: '1.5',
      marginTop: '8px'
    },
    saveButton: {
      padding: '10px 20px',
      backgroundColor: '#9b87f5',
      border: 'none',
      borderRadius: '4px',
      color: '#000000',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px'
    },
    exitIcon: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 10px',
      backgroundColor: 'transparent',
      border: '1px solid #333',
      borderRadius: '4px',
      color: '#9b87f5',
      cursor: 'pointer',
      fontSize: '14px',
      opacity: 0,
      transform: 'scale(0.95)',
      transition: 'all 0.2s ease',
      zIndex: 10000
    },
    compactWrapper: {
      padding: '40px',
      backgroundColor: '#0a0a0a',
      borderRadius: '8px',
      border: '1px solid #333',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    },
    compactText: {
      color: '#999',
      fontSize: '14px',
      margin: 0
    },
    enterButton: {
      padding: '12px 24px',
      backgroundColor: '#9b87f5',
      border: 'none',
      borderRadius: '6px',
      color: '#000000',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s ease'
    }
  };

  // Compact mode view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={styles.compactWrapper}>
        <p style={styles.compactText}>Telegram Bot in compact mode</p>
        <button 
          style={styles.enterButton} 
          onClick={() => setIsFullTab(true)}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#7a6bc7'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#9b87f5'}
        >
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <style>{`
        ${styles.hoverEffectStyle}
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={styles.container} className={uniqueWrapperClass}>
        {/* Exit Full Tab Icon */}
        <div 
          style={styles.exitIcon}
          className="subtle-icon"
          onClick={() => setIsFullTab(false)}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Exit Full Tab"
        >
          <dc.Icon icon="x" style={{ fontSize: '16px' }} />
          <span style={{ fontSize: '12px' }}>&lt;/&gt;</span>
        </div>

        {/* Header */}
        <div style={styles.header}>
        <h1 style={styles.title}>
          <dc.Icon icon="send" style={styles.titleIcon} />
          Telegram Bot Sender
        </h1>
        <button
          style={styles.settingsButton}
          onClick={() => setShowSettings(true)}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
        >
          <dc.Icon icon="settings" style={{ fontSize: '16px' }} />
          Settings
        </button>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <dc.Icon icon={getStatusIcon()} style={styles.statusIcon} />
        <span style={styles.statusText}>{status.message}</span>
      </div>

      {/* Message Composer */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <dc.Icon icon="message-square" style={{ fontSize: '20px' }} />
          Compose Message
        </div>

        <textarea
          ref={textareaRef}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message to send to Telegram...&#10;&#10;💡 Tip: Press Cmd/Ctrl + Enter to send"
          style={styles.textarea}
          disabled={isSending}
        />

        <div style={styles.buttonGroup}>
          <span style={styles.hint}>
            {messageContent.length} characters
          </span>
          
          {messageContent && (
            <button
              style={styles.clearButton}
              onClick={() => setMessageContent("")}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#2d2d2d'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
            >
              <dc.Icon icon="x" style={{ fontSize: '14px' }} />
              Clear
            </button>
          )}

          <button
            style={styles.sendButton}
            onClick={handleSendMessage}
            disabled={isSending || !messageContent.trim()}
            onMouseOver={e => {
              if (!isSending && messageContent.trim()) {
                e.currentTarget.style.backgroundColor = '#7a6bc7';
              }
            }}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#9b87f5'}
          >
            <dc.Icon icon={isSending ? 'loader' : 'send'} style={{ fontSize: '16px' }} />
            {isSending ? 'Sending...' : 'Send to Telegram'}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <dc.Icon icon="info" style={{ fontSize: '20px' }} />
          Quick Info
        </div>
        <div style={{ fontSize: '14px', color: '#999', lineHeight: '1.8' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong style={{ color: '#9b87f5' }}>Worker URL:</strong> <code style={{ 
              backgroundColor: '#0a0a0a', 
              padding: '2px 6px', 
              borderRadius: '3px',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>{workerUrl}</code>
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong style={{ color: '#9b87f5' }}>Keyboard Shortcut:</strong> Cmd/Ctrl + Enter to send
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#9b87f5' }}>Note:</strong> Using <code style={{ 
              backgroundColor: '#0a0a0a', 
              padding: '2px 6px', 
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>no-cors</code> mode - response verification is not available
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={styles.settingsModal} onClick={() => setShowSettings(false)}>
          <div style={styles.settingsContent} onClick={e => e.stopPropagation()}>
            <div style={styles.settingsHeader}>
              <h2 style={styles.settingsTitle}>
                <dc.Icon icon="settings" />
                Telegram Bot Settings
              </h2>
              <button style={styles.closeButton} onClick={() => setShowSettings(false)}>
                ×
              </button>
            </div>

            <div>
              <label style={styles.label}>Cloudflare Worker URL</label>
              <input
                type="text"
                style={styles.input}
                value={workerUrl}
                onChange={(e) => setWorkerUrl(e.target.value)}
                placeholder="https://your-worker.workers.dev"
              />
              <div style={styles.helpText}>
                Enter your Cloudflare Worker URL that handles Telegram messages.
                <br />
                Format: <code>https://your-worker-name.workers.dev</code> (no trailing slash)
              </div>
            </div>

            <button style={styles.saveButton} onClick={saveWorkerUrl}>
              Save Configuration
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

return { BasicView: TelegramBotSender };
```


