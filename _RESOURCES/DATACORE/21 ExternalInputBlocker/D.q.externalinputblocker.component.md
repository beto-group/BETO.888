

# ViewComponent


```jsx
const { useEffect, useRef, useState } = dc;

function BlockerView() {
  const viewRef = useRef(null);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  const commandStateRef = useRef({
    originalCommands: null,
    originalExecuteCommand: null,
    originalExecute: null
  }).current;
  
  // Cache settings path
  const CACHE_DIR = ".datacore/input_blocker_cache";
  const CACHE_FILE = `${CACHE_DIR}/settings.json`;
  
  const [isFullTab, setIsFullTab] = useState(true); // Start in full-tab mode
  const [isFocused, setIsFocused] = useState(false);
  const [stats, setStats] = useState({ blocked: 0, allowed: 0 });
  const [whitelistedShortcuts, setWhitelistedShortcuts] = useState([]);
  const [lastBlockedShortcut, setLastBlockedShortcut] = useState(null);
  const [captureMode, setCaptureMode] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Helper functions for DOM manipulation
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

  // Helper to add activity log entry
  const addLogEntry = (type, shortcut, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLog(prev => [{
      type, // 'blocked', 'allowed', 'whitelisted', 'removed'
      shortcut,
      message,
      timestamp,
      id: Date.now()
    }, ...prev].slice(0, 50)); // Keep last 50 entries
  };

  // Cache management functions
  const saveToCache = async () => {
    if (!dc.app?.vault?.adapter) return;
    
    const adapter = dc.app.vault.adapter;
    const settings = {
      whitelistedShortcuts,
      stats,
      activityLog,
      lastBlockedShortcut,
      savedAt: new Date().toISOString()
    };

    try {
      // Create cache directory if it doesn't exist
      if (!(await adapter.exists(CACHE_DIR))) {
        console.log(`[InputBlocker] Creating cache directory: ${CACHE_DIR}`);
        await adapter.mkdir(CACHE_DIR);
      }
      
      // Save settings as JSON
      console.log(`[InputBlocker] Saving settings to cache: ${CACHE_FILE}`);
      await adapter.write(CACHE_FILE, JSON.stringify(settings, null, 2));
      console.log('[InputBlocker] Settings saved successfully');
    } catch (error) {
      console.error('[InputBlocker] Failed to save settings to cache:', error);
    }
  };

  const loadFromCache = async () => {
    if (!dc.app?.vault?.adapter) return false;
    
    const adapter = dc.app.vault.adapter;

    try {
      // Check if cache file exists
      if (await adapter.exists(CACHE_FILE)) {
        console.log(`[InputBlocker] Loading settings from cache: ${CACHE_FILE}`);
        const data = await adapter.read(CACHE_FILE);
        const settings = JSON.parse(data);
        
        // Restore settings
        if (settings.whitelistedShortcuts) {
          setWhitelistedShortcuts(settings.whitelistedShortcuts);
          console.log(`[InputBlocker] Restored ${settings.whitelistedShortcuts.length} whitelisted shortcuts`);
        }
        if (settings.stats) {
          setStats(settings.stats);
          console.log(`[InputBlocker] Restored stats: ${settings.stats.blocked} blocked, ${settings.stats.allowed} allowed`);
        }
        if (settings.activityLog) {
          setActivityLog(settings.activityLog);
          console.log(`[InputBlocker] Restored ${settings.activityLog.length} activity log entries`);
        }
        if (settings.lastBlockedShortcut) {
          setLastBlockedShortcut(settings.lastBlockedShortcut);
        }
        
        console.log(`[InputBlocker] Settings loaded from cache (saved at: ${settings.savedAt})`);
        return true;
      } else {
        console.log('[InputBlocker] No cached settings found, starting fresh');
        return false;
      }
    } catch (error) {
      console.error('[InputBlocker] Failed to load settings from cache:', error);
      return false;
    }
  };

  const handleKeyDown = (event) => {
    if (!isFocused) return;

    // Check if typing in component's input
    const isTypingInInput = event.target && event.target.tagName === 'INPUT';
    const isInputInComponent = isTypingInInput && containerRef.current && containerRef.current.contains(event.target);
    
    // Allow typing ONLY in this component's inputs (no modifiers)
    if (isInputInComponent && !event.metaKey && !event.ctrlKey && !event.altKey) {
      setStats(prev => ({ ...prev, allowed: prev.allowed + 1 }));
      return;
    }

    // Build the shortcut string
    const shortcut = [
      event.metaKey ? 'Cmd' : '',
      event.ctrlKey ? 'Ctrl' : '',
      event.altKey ? 'Alt' : '',
      event.shiftKey ? 'Shift' : '',
      event.key
    ].filter(Boolean).join('+');

    // Check if this shortcut is whitelisted
    if (whitelistedShortcuts.includes(shortcut)) {
      console.log('BlockerView: Allowing whitelisted shortcut:', shortcut);
      setStats(prev => ({ ...prev, allowed: prev.allowed + 1 }));
      addLogEntry('allowed', shortcut, 'Shortcut allowed (whitelisted)');
      return; // Allow it through
    }

    // BLOCK and capture
    console.log('BlockerView: BLOCKED:', shortcut);
    setLastBlockedShortcut(shortcut);
    setStats(prev => ({ ...prev, blocked: prev.blocked + 1 }));
    addLogEntry('blocked', shortcut, 'Shortcut blocked');
    
    // Triple stop
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  };

  const handleFocus = () => {
    if (!dc.app || !dc.app.commands) {
      console.warn('BlockerView: dc.app or dc.app.commands unavailable');
      return;
    }
    setIsFocused(true);
    console.log('BlockerView: Component focused, applying blocking');

    // Store original command state - INCLUDING THE COMMANDS REGISTRY
    commandStateRef.originalCommands = dc.app.commands.commands || {};
    commandStateRef.originalExecuteCommand = dc.app.commands.executeCommandById;
    commandStateRef.originalExecute = dc.app.commands.execute;

    // CLEAR THE COMMANDS REGISTRY - This prevents the command palette from showing commands
    dc.app.commands.commands = {};
    console.log('BlockerView: Commands registry cleared');

    // Override executeCommandById to block execution
    dc.app.commands.executeCommandById = (commandId) => {
      console.log('BlockerView: Blocking command:', commandId);
      setStats(prev => ({ ...prev, blocked: prev.blocked + 1 }));
      return false;
    };

    // Override execute to block execution
    dc.app.commands.execute = (command) => {
      console.log('BlockerView: Blocking command via execute:', command?.id);
      setStats(prev => ({ ...prev, blocked: prev.blocked + 1 }));
      return false;
    };
  };

  const handleBlur = (e) => {
    // Check if focus is moving to an element inside the component
    const newFocusTarget = e?.relatedTarget;
    const focusStayingInside = containerRef.current && 
                               newFocusTarget && 
                               containerRef.current.contains(newFocusTarget);
    
    if (focusStayingInside) {
      console.log('BlockerView: Focus moved to input inside component - staying active');
      return; // Don't deactivate, focus is still inside
    }
    
    restoreCommands();
  };

  // Helper function to restore commands
  const restoreCommands = () => {
    if (!isFocused) return; // Already restored
    
    setIsFocused(false);
    console.log('BlockerView: Deactivating - removing blocking');

    // Restore EVERYTHING - commands registry AND functions
    if (dc.app && dc.app.commands && commandStateRef.originalCommands) {
      dc.app.commands.commands = commandStateRef.originalCommands;
      dc.app.commands.executeCommandById = commandStateRef.originalExecuteCommand;
      dc.app.commands.execute = commandStateRef.originalExecute;
      console.log('BlockerView: Commands restored');
      
      // Clear the stored refs
      commandStateRef.originalCommands = null;
      commandStateRef.originalExecuteCommand = null;
      commandStateRef.originalExecute = null;
    }
  };

  // Click outside detection
  const handleDocumentClick = (e) => {
    if (!isFocused) return;
    
    // Check if click is outside the component
    const clickedInside = containerRef.current && containerRef.current.contains(e.target);
    
    if (!clickedInside) {
      console.log('BlockerView: Clicked outside - deactivating');
      if (viewRef.current) {
        viewRef.current.blur();
      }
    }
  };

  // Load cache on component mount
  useEffect(() => {
    loadFromCache().then((loaded) => {
      setCacheLoaded(true);
      if (loaded) {
        addLogEntry('whitelisted', 'Cache', 'Settings restored from cache');
      }
    });
  }, []);

  // Auto-save to cache whenever settings change
  useEffect(() => {
    if (!cacheLoaded) return; // Don't save during initial load
    
    // Debounce saving to avoid excessive writes
    const timeoutId = setTimeout(() => {
      saveToCache();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [whitelistedShortcuts, stats, activityLog, lastBlockedShortcut, cacheLoaded]);

  // Full-tab mode setup
  useEffect(() => {
    if (!isFullTab || !containerRef.current) return;

    const container = containerRef.current;
    const targetPaneContent = findNearestAncestorWithClass(
      container,
      "workspace-leaf-content"
    );

    if (!targetPaneContent) {
      console.warn('BlockerView: No workspace-leaf-content found');
      return;
    }

    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;

    // Save original state
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

    // Move container to full-tab
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

    console.log('BlockerView: Full-tab mode activated');

    // Cleanup on unmount or when exiting full-tab
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
      console.log('BlockerView: Full-tab mode deactivated');
    };
  }, [isFullTab]);

  // Focus/blur listeners + visibility change detection
  useEffect(() => {
    if (!dc.app) {
      console.warn('BlockerView: dc.app is not available');
      return;
    }
    if (!dc.app.commands) {
      console.warn('BlockerView: dc.app.commands is undefined');
      return;
    }

    const view = viewRef.current;
    if (!view) return;

    // Track if we were focused before losing focus
    let wasBlockingBeforeBlur = false;

    // Custom blur handler that remembers state
    const handleBlurWithMemory = (e) => {
      wasBlockingBeforeBlur = isFocused;
      handleBlur(e);
    };

    // Window focus handler - re-activate if we were blocking before
    const handleWindowFocus = () => {
      if (wasBlockingBeforeBlur && !isFocused && view) {
        console.log('BlockerView: Window re-focused - re-activating blocker');
        setTimeout(() => {
          view.focus();
          handleFocus();
        }, 50);
      }
    };

    // Visibility change handler - restore commands when tab becomes hidden (switching tabs)
    const handleVisibilityChange = () => {
      if (document.hidden && isFocused) {
        console.log('BlockerView: Tab hidden - auto-restoring commands');
        restoreCommands();
        wasBlockingBeforeBlur = false;
      }
    };

    view.addEventListener('focus', handleFocus);
    view.addEventListener('blur', handleBlurWithMemory);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      view.removeEventListener('focus', handleFocus);
      view.removeEventListener('blur', handleBlurWithMemory);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Final cleanup - restore commands if still active
      if (isFocused && dc.app && dc.app.commands && commandStateRef.originalCommands) {
        dc.app.commands.commands = commandStateRef.originalCommands;
        dc.app.commands.executeCommandById = commandStateRef.originalExecuteCommand;
        dc.app.commands.execute = commandStateRef.originalExecute;
        console.log('BlockerView: Cleanup - Commands restored');
      }
    };
  }, [isFocused]);

  // Global keyboard listener - AGGRESSIVE BLOCKING
  useEffect(() => {
    if (!isFocused) return;

    // Create a super aggressive blocker function
    const aggressiveBlocker = (event) => {
      // Check if typing in an input field within the component
      const isTypingInInput = event.target && event.target.tagName === 'INPUT';
      const isInputInComponent = isTypingInInput && containerRef.current && containerRef.current.contains(event.target);
      
      // Allow normal typing ONLY in input fields inside THIS component (no modifiers)
      if (isInputInComponent && !event.metaKey && !event.ctrlKey && !event.altKey) {
        return true;
      }

      // Build the shortcut string
      const shortcut = [
        event.metaKey ? 'Cmd' : '',
        event.ctrlKey ? 'Ctrl' : '',
        event.altKey ? 'Alt' : '',
        event.shiftKey ? 'Shift' : '',
        event.key
      ].filter(Boolean).join('+');

      // Check if this shortcut is whitelisted
      if (whitelistedShortcuts.includes(shortcut)) {
        if (event.type === 'keydown') {
          console.log('BlockerView: Allowing whitelisted shortcut:', shortcut);
          setStats(prev => ({ ...prev, allowed: prev.allowed + 1 }));
          addLogEntry('allowed', shortcut, 'Shortcut allowed (whitelisted)');
        }
        return true; // Allow it through
      }

      // BLOCK EVERYTHING ELSE
      // Only log on keydown to avoid spam
      if (event.type === 'keydown') {
        console.log('BlockerView: BLOCKED:', shortcut);
        setLastBlockedShortcut(shortcut);
        setStats(prev => ({ ...prev, blocked: prev.blocked + 1 }));
        addLogEntry('blocked', shortcut, 'Shortcut blocked');
      }
      
      // Triple prevention - stop ALL propagation
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    };

    // Add listeners for ALL keyboard event types with capture
    document.addEventListener('keydown', aggressiveBlocker, { capture: true, passive: false });
    document.addEventListener('keypress', aggressiveBlocker, { capture: true, passive: false });
    document.addEventListener('keyup', aggressiveBlocker, { capture: true, passive: false });
    
    // Also block at window level for extra coverage
    window.addEventListener('keydown', aggressiveBlocker, { capture: true, passive: false });
    window.addEventListener('keypress', aggressiveBlocker, { capture: true, passive: false });
    window.addEventListener('keyup', aggressiveBlocker, { capture: true, passive: false });
    
    console.log('BlockerView: AGGRESSIVE keyboard blocking enabled - ALL INPUT BLOCKED');

    return () => {
      document.removeEventListener('keydown', aggressiveBlocker, { capture: true });
      document.removeEventListener('keypress', aggressiveBlocker, { capture: true });
      document.removeEventListener('keyup', aggressiveBlocker, { capture: true });
      window.removeEventListener('keydown', aggressiveBlocker, { capture: true });
      window.removeEventListener('keypress', aggressiveBlocker, { capture: true });
      window.removeEventListener('keyup', aggressiveBlocker, { capture: true });
      console.log('BlockerView: Keyboard blocking removed');
    };
  }, [isFocused, whitelistedShortcuts]);

  // Click-outside detection
  useEffect(() => {
    if (!isFocused) return;

    // Small delay to avoid triggering on activation click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleDocumentClick, { capture: true });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleDocumentClick, { capture: true });
    };
  }, [isFocused]);

  const handleExitFullTab = () => {
    console.log('BlockerView: Exiting full-tab mode');
    if (isFocused && viewRef.current) {
      viewRef.current.blur();
    }
    setIsFullTab(false);
  };

  const handleEnterFullTab = () => {
    console.log('BlockerView: Entering full-tab mode');
    setIsFullTab(true);
  };

  const handleWhitelistLastBlocked = () => {
    if (lastBlockedShortcut && !whitelistedShortcuts.includes(lastBlockedShortcut)) {
      setWhitelistedShortcuts(prev => [...prev, lastBlockedShortcut]);
      console.log('BlockerView: Whitelisted shortcut:', lastBlockedShortcut);
      addLogEntry('whitelisted', lastBlockedShortcut, 'Added to whitelist');
      setLastBlockedShortcut(null);
    }
  };

  const handleRemoveShortcut = (shortcut) => {
    setWhitelistedShortcuts(prev => prev.filter(s => s !== shortcut));
    console.log('BlockerView: Removed whitelisted shortcut:', shortcut);
    addLogEntry('removed', shortcut, 'Removed from whitelist');
  };

  // Compact mode
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: '40px 20px',
        background: '#000',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <dc.Icon icon="shield-off" style={{ fontSize: '48px', color: 'rgba(139, 92, 246, 0.4)', marginBottom: '16px' }} />
        <h3 style={{ color: '#fff', marginBottom: '12px', fontWeight: '600' }}>Input Blocker</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '20px' }}>
          Click to enter full-tab mode
        </p>
        <button 
          onClick={handleEnterFullTab}
          style={{
            padding: '12px 24px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            color: '#8b5cf6',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <dc.Icon icon="maximize" style={{ fontSize: '16px' }} />
          Enter Full Tab
        </button>
      </div>
    );
  }

  // Full-tab mode
  return (
    <div ref={containerRef} style={{
      height: '100%',
      width: '100%',
      background: '#000000',
      color: '#ffffff',
      overflow: 'auto',
      position: 'relative',
    }}>
      {/* Exit Button */}
      <button
        onClick={handleExitFullTab}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '8px',
          padding: '10px 18px',
          color: 'rgba(139, 92, 246, 0.8)',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '13px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
        }}
      >
        <dc.Icon icon="minimize" style={{ fontSize: '14px' }} />
        Exit
      </button>

      {/* Main Content Area with Overlay */}
      <div
        ref={viewRef}
        tabIndex={0}
        style={{
          minHeight: '100%',
          padding: '60px 40px 40px 40px',
          outline: 'none',
          position: 'relative',
        }}
      >
        {/* Hidden Activation Overlay - Only shows when NOT focused */}
        {!isFocused && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              console.log('Overlay clicked - activating blocker');
              // Directly call handleFocus instead of relying on focus event
              handleFocus();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'transparent',
              zIndex: 5,
              cursor: 'pointer',
            }}
            title="Click to activate blocker"
          />
        )}

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <dc.Icon icon="shield" style={{ fontSize: '56px', color: 'rgba(139, 92, 246, 0.6)' }} />
          </div>
          <h1 style={{
            fontSize: '2.5em',
            fontWeight: '600',
            margin: '0 0 20px 0',
            color: '#fff',
            letterSpacing: '-0.5px',
          }}>
            Input Blocker
          </h1>
          
          {/* Status Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            background: isFocused ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isFocused ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '20px',
          }}>
            <dc.Icon 
              icon={isFocused ? 'shield-check' : 'shield-off'} 
              style={{ 
                fontSize: '16px',
                color: isFocused ? '#8b5cf6' : 'rgba(255, 255, 255, 0.3)'
              }} 
            />
            <span style={{
              color: isFocused ? '#8b5cf6' : 'rgba(255, 255, 255, 0.5)',
              fontWeight: '500',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {isFocused ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
          maxWidth: '800px',
          margin: '0 auto 40px auto',
        }}>
          <div style={{
            background: '#000',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <dc.Icon icon="shield-x" style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '12px' }} />
            <div style={{ fontSize: '2.5em', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
              {stats.blocked}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Blocked
            </div>
          </div>
          
          <div style={{
            background: '#000',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <dc.Icon icon="shield-check" style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.3)', marginBottom: '12px' }} />
            <div style={{ fontSize: '2.5em', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
              {stats.allowed}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Allowed
            </div>
          </div>
        </div>

        {/* Last Blocked Shortcut */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: '#000',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <dc.Icon icon="alert-circle" style={{ fontSize: '20px', color: 'rgba(239, 68, 68, 0.6)' }} />
            <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: '500' }}>Last Blocked Shortcut</h3>
          </div>
          
          {lastBlockedShortcut ? (
            <div>
              <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px', marginBottom: '12px' }}>
                The following keyboard shortcut was just blocked:
              </p>
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}>
                <dc.Icon icon="keyboard" style={{ fontSize: '24px', color: 'rgba(239, 68, 68, 0.5)' }} />
                <code style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                  {lastBlockedShortcut}
                </code>
              </div>
              <button
                onClick={handleWhitelistLastBlocked}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <dc.Icon icon="plus-circle" style={{ fontSize: '16px', color: 'rgba(16, 185, 129, 0.6)' }} />
                Whitelist This Shortcut
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <dc.Icon icon="info" style={{ fontSize: '32px', color: 'rgba(255, 255, 255, 0.2)', marginBottom: '12px' }} />
              <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                No shortcuts blocked yet. Try pressing Cmd+P or any other keyboard shortcut...
              </p>
            </div>
          )}
        </div>

        {/* Whitelisted Shortcuts */}
        {whitelistedShortcuts.length > 0 && (
          <div style={{
            maxWidth: '600px',
            margin: '20px auto 0 auto',
            background: '#000',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <dc.Icon icon="check-circle" style={{ fontSize: '20px', color: 'rgba(16, 185, 129, 0.6)' }} />
              <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: '500' }}>
                Whitelisted Shortcuts ({whitelistedShortcuts.length})
              </h3>
            </div>
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
            }}>
              {whitelistedShortcuts.map((shortcut, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  marginBottom: idx < whitelistedShortcuts.length - 1 ? '6px' : '0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <dc.Icon icon="keyboard" style={{ fontSize: '16px', color: 'rgba(16, 185, 129, 0.5)' }} />
                    <code style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                      {shortcut}
                    </code>
                  </div>
                  <button
                    onClick={() => handleRemoveShortcut(shortcut)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <dc.Icon icon="x" style={{ fontSize: '12px', color: 'rgba(239, 68, 68, 0.5)' }} />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div style={{
          maxWidth: '600px',
          margin: '20px auto 0 auto',
          background: '#000',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <dc.Icon icon="activity" style={{ fontSize: '20px', color: 'rgba(139, 92, 246, 0.6)' }} />
              <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: '500' }}>
                Activity Log
              </h3>
            </div>
            {activityLog.length > 0 && (
              <button
                onClick={() => setActivityLog([])}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <dc.Icon icon="trash-2" style={{ fontSize: '12px' }} />
                Clear
              </button>
            )}
          </div>
          
          {activityLog.length > 0 ? (
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
              {activityLog.map((entry) => {
                const iconConfig = {
                  blocked: { icon: 'shield-x', color: 'rgba(239, 68, 68, 0.6)' },
                  allowed: { icon: 'shield-check', color: 'rgba(16, 185, 129, 0.6)' },
                  whitelisted: { icon: 'plus-circle', color: 'rgba(139, 92, 246, 0.6)' },
                  removed: { icon: 'minus-circle', color: 'rgba(245, 158, 11, 0.6)' }
                }[entry.type];

                return (
                  <div key={entry.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    fontSize: '13px',
                  }}>
                    <dc.Icon 
                      icon={iconConfig.icon} 
                      style={{ 
                        fontSize: '16px', 
                        color: iconConfig.color,
                        flexShrink: 0
                      }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <code style={{ 
                          color: '#fff', 
                          fontWeight: '500',
                          fontSize: '12px'
                        }}>
                          {entry.shortcut}
                        </code>
                        <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
                          {entry.message}
                        </span>
                      </div>
                    </div>
                    <span style={{ 
                      color: 'rgba(255, 255, 255, 0.3)', 
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      flexShrink: 0
                    }}>
                      {entry.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <dc.Icon icon="inbox" style={{ fontSize: '48px', color: 'rgba(255, 255, 255, 0.1)', marginBottom: '12px' }} />
              <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                No activity yet. Activate blocking and try some shortcuts...
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          maxWidth: '800px',
          margin: '40px auto 0 auto',
          background: '#000',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <dc.Icon icon="book-open" style={{ fontSize: '20px', color: 'rgba(139, 92, 246, 0.6)' }} />
            <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: '500' }}>How to Use</h3>
          </div>
          <ul style={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.8', paddingLeft: '24px', listStyle: 'none' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <dc.Icon icon="mouse-pointer-click" style={{ fontSize: '16px', color: 'rgba(139, 92, 246, 0.5)', marginTop: '2px', flexShrink: 0 }} />
              <span><strong style={{ color: '#fff' }}>Activate blocking</strong> - click the overlay</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <dc.Icon icon="keyboard" style={{ fontSize: '16px', color: 'rgba(139, 92, 246, 0.5)', marginTop: '2px', flexShrink: 0 }} />
              <span><strong style={{ color: '#fff' }}>Press a shortcut</strong> - try Cmd+P, Cmd+K, Cmd+W, etc.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <dc.Icon icon="shield-x" style={{ fontSize: '16px', color: 'rgba(239, 68, 68, 0.5)', marginTop: '2px', flexShrink: 0 }} />
              <span><strong style={{ color: '#fff' }}>Shortcut gets blocked</strong> - shows up in blocked section</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <dc.Icon icon="plus-circle" style={{ fontSize: '16px', color: 'rgba(16, 185, 129, 0.5)', marginTop: '2px', flexShrink: 0 }} />
              <span><strong style={{ color: '#fff' }}>Click "Whitelist"</strong> - that exact shortcut is now allowed</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <dc.Icon icon="check" style={{ fontSize: '16px', color: 'rgba(139, 92, 246, 0.5)', marginTop: '2px', flexShrink: 0 }} />
              <span><strong style={{ color: '#fff' }}>Use it again</strong> - whitelisted shortcuts work!</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <dc.Icon icon="x" style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.3)', marginTop: '2px', flexShrink: 0 }} />
              <span><strong style={{ color: '#fff' }}>Remove anytime</strong> - click Remove to block it again</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', fontSize: '12px', fontStyle: 'italic' }}>
              <dc.Icon icon="alert-triangle" style={{ fontSize: '14px', color: 'rgba(245, 158, 11, 0.6)', marginTop: '2px', flexShrink: 0 }} />
              <span><strong style={{ color: 'rgba(245, 158, 11, 0.8)' }}>Note:</strong> <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>macOS system shortcuts (Cmd+Shift+4) are handled by the OS and cannot be blocked</span></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', fontSize: '12px', fontStyle: 'italic' }}>
              <dc.Icon icon="database" style={{ fontSize: '14px', color: 'rgba(139, 92, 246, 0.6)', marginTop: '2px', flexShrink: 0 }} />
              <span><strong style={{ color: 'rgba(139, 92, 246, 0.8)' }}>Auto-save:</strong> <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>All settings are automatically saved to cache and restored on reload</span></span>
            </li>
          </ul>
        </div>

        {/* Cache Management */}
        <div style={{
          maxWidth: '800px',
          margin: '20px auto 0 auto',
          background: '#000',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <dc.Icon icon="database" style={{ fontSize: '20px', color: 'rgba(139, 92, 246, 0.6)' }} />
            <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: '500' }}>Settings Cache</h3>
            {cacheLoaded && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '12px',
                color: 'rgba(16, 185, 129, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <dc.Icon icon="check-circle" style={{ fontSize: '14px' }} />
                Auto-saving enabled
              </span>
            )}
          </div>
          
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', marginBottom: '16px' }}>
            Your whitelisted shortcuts, stats, and activity log are automatically saved to the vault.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                await saveToCache();
                addLogEntry('whitelisted', 'Cache', 'Settings manually saved');
              }}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: '1',
                minWidth: '150px',
                justifyContent: 'center',
              }}
              title="Manually save current settings to cache"
            >
              <dc.Icon icon="save" style={{ fontSize: '14px', color: 'rgba(139, 92, 246, 0.6)' }} />
              Save Settings
            </button>
            
            <button
              onClick={async () => {
                const loaded = await loadFromCache();
                if (loaded) {
                  addLogEntry('whitelisted', 'Cache', 'Settings restored from cache');
                } else {
                  addLogEntry('removed', 'Cache', 'No cached settings found');
                }
              }}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: '1',
                minWidth: '150px',
                justifyContent: 'center',
              }}
              title="Restore settings from cache"
            >
              <dc.Icon icon="refresh-cw" style={{ fontSize: '14px', color: 'rgba(16, 185, 129, 0.6)' }} />
              Restore Settings
            </button>
          
            <button
              onClick={async () => {
                if (confirm('Clear all cached settings? This will remove your whitelisted shortcuts and activity log from cache.')) {
                  const adapter = dc.app.vault.adapter;
                  try {
                    if (await adapter.exists(CACHE_FILE)) {
                      await adapter.remove(CACHE_FILE);
                      console.log('[InputBlocker] Cache cleared');
                      addLogEntry('removed', 'Cache', 'Cache file deleted');
                    }
                  } catch (error) {
                    console.error('[InputBlocker] Failed to clear cache:', error);
                  }
                }
              }}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: '1',
                minWidth: '150px',
                justifyContent: 'center',
              }}
              title="Delete cached settings file"
            >
              <dc.Icon icon="trash-2" style={{ fontSize: '14px', color: 'rgba(239, 68, 68, 0.5)' }} />
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

return { BasicView: BlockerView };

```


