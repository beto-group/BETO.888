

# ViewComponent

```jsx
// BottomCornerButton.component.jsx

const { useRef, useEffect, useState, useCallback, useMemo } = dc;

// Assume ScreenModeHelper is available as a separate module.
const { ScreenModeHelper } = await dc.require(
  dc.headerLink("_RESOURCES/DATACORE/39 MobileMusicPlayer/D.q.mobilemusicplayer.component.md", "ScreenModeHelper")
);
// Import MusicPlayer component with the correct path
const { MusicPlayer } = await dc.require(
  dc.headerLink("_RESOURCES/DATACORE/39 MobileMusicPlayer/D.q.mobilemusicplayer.component.md", "MusicPlayer") // Or wherever MusicPlayer.component.jsx is
);

function BottomCornerButton() {
  const containerRef = useRef(null); 
  const originalParentRefForWindow = useRef(null); 
  const originalParentRefForPiP = useRef(null); 
  const screenModeHelperInstanceRef = useRef(null); 

  const obsidianApp = dc.app; 

  const [showSecondaryButtons, setShowSecondaryButtons] = useState(false); 
  const [isMusicPlayerActive, setIsMusicPlayerActive] = useState(false);     // Controls if MusicPlayer is mounted
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);             // State from MusicPlayer
  const [isPipActuallyVisible, setIsPipActuallyVisible] = useState(false); // State from MusicPlayer
  const [triggerPipReopen, setTriggerPipReopen] = useState(false);         // To signal MusicPlayer to show PIP

  // --- Button Dimensions and Positioning ---
  const mainButtonSize = 60; 
  const secondaryButtonSize = 48; 
  const secondaryButtonRadius = 80; 
  const mainButtonOffsetFromEdge = 40; 
  const indicatorSize = 16; 

  const containerEffectiveWidth = secondaryButtonRadius + (mainButtonSize / 2) + (secondaryButtonSize / 2) + 10; 
  const containerEffectiveHeight = secondaryButtonRadius + (mainButtonSize / 2) + (secondaryButtonSize / 2) + 10; 

  const buttonContainerWindowStyle = {
    position: "fixed",
    bottom: `${mainButtonOffsetFromEdge}px`, 
    right: `${mainButtonOffsetFromEdge}px`,  
    zIndex: 9999, 
    width: `${containerEffectiveWidth}px`,
    height: `${containerEffectiveHeight}px`,
    display: "block", 
  };

  function styleObjectToCssString(styleObj) {
    return Object.entries(styleObj)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
        return `${cssKey}: ${value};`;
      })
      .join(" ");
  }

  const stylesByMode = {
    window: styleObjectToCssString(buttonContainerWindowStyle),
  };

  const defaultModeOuterContainerStyle = {
    position: "relative",
    width: "fit-content",
    height: "fit-content",
    display: "block",
  };
  const defaultModeOuterContainerStyleString = styleObjectToCssString(defaultModeOuterContainerStyle);

  // --- HANDLERS FOR SECONDARY BUTTONS ---
  const handleNewNoteClick = useCallback(() => { setShowSecondaryButtons(false); }, []);
  const handleAttachFileClick = useCallback(() => { setShowSecondaryButtons(false); }, []);
  const handleSettingsClick = useCallback(() => { setShowSecondaryButtons(false); }, []);
  
  // This button now serves both to activate the player AND show its PIP
  const handleMusicPlayerClick = useCallback(() => { 
    setIsMusicPlayerActive(true); // Ensure the MusicPlayer component is mounted
    setTriggerPipReopen(true);    // Signal MusicPlayer to make its PIP visible
    setShowSecondaryButtons(false); 
  }, []);

  // Dynamically build secondary buttons data.
  // The "Reopen Player" specific button is removed.
  const secondaryButtonsData = useMemo(() => {
    return [
      { id: 'btn1', icon: '📝', action: handleNewNoteClick },
      { id: 'btn2', icon: '📎', action: handleAttachFileClick },
      { id: 'btn3', icon: '⚙️', action: handleSettingsClick },
      // The music player button now uses the same icon and handles both initial launch and re-open
      { id: 'btn4', icon: '🎵', action: handleMusicPlayerClick }, 
    ];
  }, [handleNewNoteClick, handleAttachFileClick, handleSettingsClick, handleMusicPlayerClick]);


  const handleMainButtonClick = () => {
    setShowSecondaryButtons(prev => !prev);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.pointerEvents = showSecondaryButtons ? 'auto' : 'none';
    }
  }, [showSecondaryButtons]);

  if (!obsidianApp) {
    return (
      <div style={{ padding: "20px", border: "1px solid #ff6b6b", borderRadius: "8px", backgroundColor: "#2c1d1d", color: "#ffcccc", fontFamily: "sans-serif" }}>
        <h3 style={{color: "#ff8080", marginTop: 0}}>Error: Obsidian App Object Missing</h3>
        <p>This component requires `dc.app` (Obsidian's app object) to function correctly with ScreenModeHelper.</p>
      </div>
    );
  }

  const calculateSecondaryButtonPosition = (index, totalButtons) => {
    const mainButtonCenterX_in_container = containerEffectiveWidth - (mainButtonSize / 2);
    const mainButtonCenterY_in_container = containerEffectiveHeight - (mainButtonSize / 2);
    const startAngle = Math.PI / 2; 
    const endAngle = Math.PI;       
    const angleRange = endAngle - startAngle; 
    const angle = totalButtons === 1 ? (startAngle + endAngle) / 2 : startAngle + (angleRange / (totalButtons - 1)) * index;
    const offsetX_from_main_center = secondaryButtonRadius * Math.cos(angle);
    const offsetY_from_main_center = secondaryButtonRadius * Math.sin(angle);
    const left = mainButtonCenterX_in_container + offsetX_from_main_center - (secondaryButtonSize / 2);
    const top = mainButtonCenterY_in_container - offsetY_from_main_center - (secondaryButtonSize / 2);
    return { left: `${left}px`, top: `${top}px` };
  };

  // Calculate position for the music playing indicator
  const indicatorStyle = {
    position: 'fixed', // Position relative to viewport, same as the main container
    // Place it just outside the top-right corner of the main button
    // Main button's area (fixed) is:
    // right: [mainButtonOffsetFromEdge] to [mainButtonOffsetFromEdge + mainButtonSize]
    // bottom: [mainButtonOffsetFromEdge] to [mainButtonOffsetFromEdge + mainButtonSize]
    // To place indicator (size 16px) 2px outside main button's top-right corner:
    right: `${mainButtonOffsetFromEdge - indicatorSize - 2}px`, 
    bottom: `${mainButtonOffsetFromEdge + mainButtonSize - indicatorSize - 2}px`,  
    width: `${indicatorSize}px`,
    height: `${indicatorSize}px`,
    borderRadius: '50%',
    backgroundColor: '#8e24aa', // A vibrant purple
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: `${indicatorSize * 0.7}px`, 
    pointerEvents: 'none', 
    zIndex: 10000, 
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    animation: 'pulse 1.5s infinite ease-out', 
  };

  const indicatorKeyframes = `
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }
  `;

  return (
    <div ref={containerRef}>
      {/* Add indicator styles globally or as a style tag */}
      <style>{indicatorKeyframes}</style>

      {/* Music Playing Indicator */}
      {isMusicPlayerActive && isPlayingMusic && !isPipActuallyVisible && !showSecondaryButtons && (
        <div style={indicatorStyle} title="Music is playing in the background">
          🎵
        </div>
      )}

      {showSecondaryButtons && secondaryButtonsData.map((btn, index) => {
        const { left, top } = calculateSecondaryButtonPosition(index, secondaryButtonsData.length);
        return (
          <button
            key={btn.id}
            onClick={btn.action} 
            style={{
              position: 'absolute', left: left, top: top, width: `${secondaryButtonSize}px`,
              height: `${secondaryButtonSize}px`, borderRadius: '50%', 
              backgroundColor: '#7b1fa2', // Darker purple for secondary buttons
              color: 'white', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: '1.2em', opacity: showSecondaryButtons ? 1 : 0, 
              transform: showSecondaryButtons ? 'scale(1)' : 'scale(0.5)', 
              transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
              transitionDelay: `${index * 0.05}s`, pointerEvents: 'auto', 
            }}
          >
            {btn.icon} 
          </button>
        );
      })}

      <button
        onClick={handleMainButtonClick}
        style={{
          position: 'absolute', bottom: '0', right: '0', width: `${mainButtonSize}px`,
          height: `${mainButtonSize}px`, borderRadius: '50%', 
          backgroundColor: showSecondaryButtons ? '#9c27b0' : '#5d3eff', // Purple colors for main button
          color: 'white', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontSize: '1.5em', transition: 'background-color 0.3s ease, transform 0.2s ease-out',
          transform: showSecondaryButtons ? 'rotate(45deg)' : 'rotate(0deg)', 
          pointerEvents: 'auto', 
        }}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d={showSecondaryButtons ? "M19 13H5v-2h14v2z" : "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"}/>
        </svg>
      </button>

      {/* MusicPlayer is mounted if `isMusicPlayerActive` is true */}
      {isMusicPlayerActive && (
        <MusicPlayer 
          initialPipMode={true} 
          onPlayStatusChange={setIsPlayingMusic}       // Pass setter for playing status
          onPipVisibilityChange={setIsPipActuallyVisible} // Pass setter for PIP visibility
          triggerPipReopen={triggerPipReopen}          // Pass the trigger state
          setTriggerPipReopen={setTriggerPipReopen}    // Pass the setter for the trigger
        />
      )}

      <ScreenModeHelper
        helperRef={screenModeHelperInstanceRef}
        initialMode={"window"} 
        containerRef={containerRef}
        originalParentRefForWindow={originalParentRefForWindow}
        originalParentRefForPiP={originalParentRefForPiP}
        allowedScreenModes={["window"]} 
        engine={null} 
        defaultStyle={defaultModeOuterContainerStyleString}
        stylesByMode={stylesByMode}
        hideToggleButtons={true} 
      />
    </div>
  );
}

return { BottomCornerButton };
```



# ScreenModeHelper

```jsx
// ScreenModeHelper.jsx
// No changes needed for this file. It remains as is from your original code.

const { useState, useRef, useEffect, useCallback } = dc;

// Helper to apply a CSS string to an element's style
function applyCssText(element, cssText) {
  if (element && cssText && typeof cssText === 'string') {
    element.style.cssText = cssText;
  } else if (element) {
    element.style.cssText = 'display: block; position: relative;';
    console.warn("[ScreenModeHelper] applyCssText called with no cssText for element (fallback applied):", element);
  }
}

function reparentToOriginal(container, originalParentRef) {
  if (!container || !originalParentRef || !originalParentRef.current) { // Removed .isConnected check for simplicity during unmount
    if (container && container.parentNode === document.body && (!originalParentRef || !originalParentRef.current)) {
        console.warn("[ScreenModeHelper] Container in body, but no valid original parent ref to reparent to. Will remain in body.");
    }
    return;
  }

  // Check if originalParentRef.current is still in the document, might have been removed if parent component unmounted
  if (!originalParentRef.current.isConnected) {
    console.warn("[ScreenModeHelper] Original parent for reparenting is no longer connected to the document. Container might be orphaned or removed by browser from body.", originalParentRef.current);
    // If container is in body, we might still want to remove it.
    if (container.parentNode === document.body) {
        try { document.body.removeChild(container); }
        catch(e) { console.error("[ScreenModeHelper] Error removing container from body when original parent was disconnected:", e); }
    }
    return;
  }


  if (container.parentNode === document.body) {
    console.log("[ScreenModeHelper] Reparenting container from body to:", originalParentRef.current);
    try {
      // It's possible document.body.removeChild(container) fails if container was already removed by other means.
      // So, only append if it was successfully removed or not in body to begin with.
      if (container.parentNode === document.body) document.body.removeChild(container);
      originalParentRef.current.appendChild(container);
    } catch (e) {
      console.error("[ScreenModeHelper] Error reparenting container:", e, container, originalParentRef.current);
    }
  } else if (container.parentNode !== originalParentRef.current) {
      console.warn("[ScreenModeHelper] Container not in body, but also not in its designated original parent. Current parent:", container.parentNode, "Expected:", originalParentRef.current);
  }
}

const ScreenModeHelper = ({
  helperRef,
  initialMode = "default",
  containerRef,
  originalParentRefForWindow,
  originalParentRefForPiP,
  allowedScreenModes = ["window"],
  engine,
  defaultStyle,
  stylesByMode,
  hideToggleButtons = false, // MODIFIED: New prop
}) => {
  const [activeMode, setActiveMode] = useState(() => {
    if (allowedScreenModes.includes(initialMode) && (initialMode === "default" || (stylesByMode && stylesByMode[initialMode]))) {
      return initialMode;
    }
    console.warn(`[ScreenModeHelper] Initial mode '${initialMode}' not allowed or styles not defined. Falling back to 'default'. Allowed: ${allowedScreenModes.join(', ')}`);
    return "default";
  });

  const initialStylesAppliedRef = useRef(false);
  const capturedActiveModeForCleanup = useRef(activeMode); // To capture mode for cleanup

  useEffect(() => {
    capturedActiveModeForCleanup.current = activeMode;
  }, [activeMode]);


  useEffect(() => {
    const container = containerRef.current;
    if (!container || initialStylesAppliedRef.current) return;

    console.log(`[ScreenModeHelper] Applying initial styles for mode: ${activeMode}`);
    if (activeMode === "default") {
      if (defaultStyle) {
        applyCssText(container, defaultStyle);
      } else {
        console.warn("[ScreenModeHelper] Initial mode is 'default' but no defaultStyle provided.");
        applyCssText(container, 'display: block; position: relative;');
      }
    } else if (stylesByMode && stylesByMode[activeMode]) {
      const parentRefForMode = activeMode === 'window' ? originalParentRefForWindow :
                               activeMode === 'pip' ? originalParentRefForPiP : null;

      if (parentRefForMode && !parentRefForMode.current && container.parentNode && container.parentNode !== document.body) {
        console.log("[ScreenModeHelper] Storing initial original parent:", container.parentNode, "for mode", activeMode);
        parentRefForMode.current = container.parentNode;
      } else if (parentRefForMode && !parentRefForMode.current && container.parentNode === document.body) {
        // This case is unlikely if it starts elsewhere, but good to log
        console.warn("[ScreenModeHelper] Container initially in document.body for mode", activeMode, "original parent ref not set yet.");
      }


      if (container.parentNode !== document.body) {
        if (container.parentNode) { // Ensure it has a parent before trying to remove
             try { container.parentNode.removeChild(container); }
             catch(e) { console.error("[ScreenModeHelper] Error removing container from initial parent:", e, container.parentNode); }
        }
        document.body.appendChild(container);
        console.log("[ScreenModeHelper] Moved container to document.body for initial mode:", activeMode);
      }
      applyCssText(container, stylesByMode[activeMode]);
    }
    initialStylesAppliedRef.current = true;

    if (engine?.resize) setTimeout(() => engine.resize(), 50);

  }, [containerRef, activeMode, initialMode, defaultStyle, stylesByMode, allowedScreenModes, engine, originalParentRefForWindow, originalParentRefForPiP]);


  const toggleMode = useCallback((requestedMode) => {
    // This function will likely not be called if hideToggleButtons is true,
    // but keeping it for completeness or future use.
    console.log(`[ScreenModeHelper] toggleMode. Current: '${activeMode}', Requested: '${requestedMode}'`);
    const container = containerRef.current;
    if (!container) {
      console.error("[ScreenModeHelper] Container ref is not set.");
      return;
    }

    // If buttons are hidden, disallow toggling away from the initial setup
    if (hideToggleButtons) {
        console.warn("[ScreenModeHelper] Toggle buttons are hidden. Mode toggling is disabled.");
        return;
    }

    const currentActualActiveMode = activeMode;
    let newEffectiveMode = requestedMode;

    if (currentActualActiveMode === requestedMode && requestedMode !== "default") {
      newEffectiveMode = "default";
    } else if (currentActualActiveMode === requestedMode && requestedMode === "default") {
      console.log("[ScreenModeHelper] Already in default mode and default requested. Re-applying default style.");
      if (defaultStyle) applyCssText(container, defaultStyle);
      else applyCssText(container, 'display: block; position: relative;');
      return;
    }

    console.log(`[ScreenModeHelper] Transitioning from '${currentActualActiveMode}' to '${newEffectiveMode}'`);

    if (currentActualActiveMode !== "default") {
      console.log(`[ScreenModeHelper] Resetting from current mode: ${currentActualActiveMode}`);
      const parentRefToUseForReset = currentActualActiveMode === 'window' ? originalParentRefForWindow :
                                     currentActualActiveMode === 'pip' ? originalParentRefForPiP : null;
      if (parentRefToUseForReset) {
        reparentToOriginal(container, parentRefToUseForReset);
      } else {
        console.warn(`[ScreenModeHelper] No specific originalParentRef for mode ${currentActualActiveMode} during reset.`);
      }
    }

    setActiveMode(newEffectiveMode);

    if (newEffectiveMode === "default") {
      if (defaultStyle) {
        console.log("[ScreenModeHelper] Applying defaultStyle for 'default' mode.");
        applyCssText(container, defaultStyle);
      } else {
        console.warn("[ScreenModeHelper] No defaultStyle provided for 'default' mode. Applying fallback.");
        applyCssText(container, 'display: block; position: relative;');
      }
      const expectedDefaultParentRef = originalParentRefForWindow; 
      if (expectedDefaultParentRef && expectedDefaultParentRef.current && container.parentNode !== expectedDefaultParentRef.current) {
        if (container.parentNode === document.body) {
            reparentToOriginal(container, expectedDefaultParentRef);
        }
      }
    } else if (stylesByMode && stylesByMode[newEffectiveMode]) {
      console.log(`[ScreenModeHelper] Applying styles for '${newEffectiveMode}' mode.`);
      const parentRefForNewMode = newEffectiveMode === 'window' ? originalParentRefForWindow :
                                 newEffectiveMode === 'pip' ? originalParentRefForPiP : null;

      if (parentRefForNewMode && !parentRefForNewMode.current && container.parentNode && container.parentNode !== document.body) {
        console.log("[ScreenModeHelper] Storing original parent:", container.parentNode, "for mode", newEffectiveMode);
        parentRefForNewMode.current = container.parentNode;
      }

      if (container.parentNode !== document.body) {
        if (container.parentNode) {
          try { container.parentNode.removeChild(container); }
          catch (e) { console.error("[ScreenModeHelper] Error removing container from its current parent:", container.parentNode, e); }
        }
        document.body.appendChild(container);
        console.log("[ScreenModeHelper] Moved container to document.body for mode:", newEffectiveMode);
      }
      applyCssText(container, stylesByMode[newEffectiveMode]);
    } else {
      console.warn(`[ScreenModeHelper] No styles defined in stylesByMode for mode: '${newEffectiveMode}'. Falling back to default.`);
       setActiveMode("default");
       if (defaultStyle) applyCssText(container, defaultStyle);
       else applyCssText(container, 'display: block; position: relative;');
    }

    if (engine?.resize) setTimeout(() => engine.resize(), 100);

  }, [activeMode, containerRef, originalParentRefForWindow, originalParentRefForPiP, engine, defaultStyle, stylesByMode, hideToggleButtons]);


  useEffect(() => {
    if (helperRef) {
      helperRef.current = {
        toggleMode: hideToggleButtons ? () => console.warn("[ScreenModeHelper] Mode toggling disabled.") : toggleMode,
        getActiveMode: () => activeMode,
      };
    }
  }, [helperRef, toggleMode, activeMode, hideToggleButtons]);

  useEffect(() => {
    if (!containerRef.current || !engine?.resize) return;
    const observer = new ResizeObserver(() => {
      if (engine && typeof engine.resize === 'function') {
        engine.resize();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, engine]);

  useEffect(() => {
    const currentContainer = containerRef.current;
    // Use the ref for active mode at the time of unmount setup
    // const currentActiveModeOnUnmount = activeMode; // This would be stale
    const modeAtUnmountSetup = capturedActiveModeForCleanup.current;


    return () => {
      console.log(`[ScreenModeHelper] Unmount cleanup. Mode was: ${modeAtUnmountSetup}`);
      if (currentContainer && modeAtUnmountSetup !== 'default') {
        const modesRequiringReset = ["window", "pip"];
        if (modesRequiringReset.includes(modeAtUnmountSetup)) {
          console.log(`[ScreenModeHelper] Unmounting: Attempting to reset from ${modeAtUnmountSetup}.`);
          
          const parentRefToUseForReset = modeAtUnmountSetup === 'window' ? originalParentRefForWindow :
                                         modeAtUnmountSetup === 'pip' ? originalParentRefForPiP : null;

          if (parentRefToUseForReset && parentRefToUseForReset.current) {
             console.log("[ScreenModeHelper] Unmounting: Original parent ref found:", parentRefToUseForReset.current);
             reparentToOriginal(currentContainer, parentRefToUseForReset);
             // After reparenting, apply default styles
             if (defaultStyle) {
                applyCssText(currentContainer, defaultStyle);
                console.log("[ScreenModeHelper] Unmounting: Applied default style after reparenting.");
             } else {
                applyCssText(currentContainer, 'display: block; position: relative;');
                console.warn("[ScreenModeHelper] Unmounting: Applied fallback style (no defaultStyle) after reparenting.");
             }
          } else if (currentContainer.parentNode === document.body) {
             console.warn("[ScreenModeHelper] Unmounting from body, but no original parent ref to return to. Attempting to remove from body.");
             try {
                document.body.removeChild(currentContainer);
                console.log("[ScreenModeHelper] Unmounting: Removed container from document.body.");
             } catch (e) {
                console.error("[ScreenModeHelper] Unmounting: Error removing container from document.body:", e);
             }
          } else {
            console.warn("[ScreenModeHelper] Unmounting: Container not in body and no original parent ref. State:", currentContainer.parentNode);
          }
        }
      } else if (currentContainer && modeAtUnmountSetup === 'default') {
          console.log("[ScreenModeHelper] Unmounting: Was in default mode. No special DOM cleanup needed by ScreenModeHelper besides what React/Preact does.");
      } else if (!currentContainer) {
          console.warn("[ScreenModeHelper] Unmounting: ContainerRef was null. Cannot perform cleanup.");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, defaultStyle, originalParentRefForWindow, originalParentRefForPiP]); // capturedActiveModeForCleanup is NOT a dep here. We want the value at mount time.

  // MODIFIED: Conditionally render buttons
  if (hideToggleButtons) {
    return null; // Or an empty fragment: dc.preact.h(dc.preact.Fragment, null)
  }

  const buttonContainerStyle = {
    position: "absolute",
    top: '10px',
    right: '10px',
    zIndex: 1,
    display: "flex",
    gap: "5px"
  };

  if (activeMode !== "default" && containerRef.current) {
      const containerZIndex = parseInt(window.getComputedStyle(containerRef.current).zIndex);
      if (!isNaN(containerZIndex) && containerZIndex >= 1) {
          buttonContainerStyle.zIndex = containerZIndex + 1;
      } else if (activeMode === 'window') {
          buttonContainerStyle.zIndex = 10001;
      }
  }

  return dc.preact.h('div', {
    className: 'screen-mode-controls',
    style: buttonContainerStyle
  },
    allowedScreenModes
      .filter(modeKey => modeKey !== "default" && modeKey !== "none" && stylesByMode && stylesByMode[modeKey])
      .map(modeKey => {
        const isCurrentActive = activeMode === modeKey;
        let modeLabel;
        switch(modeKey) {
          case "window": modeLabel = isCurrentActive ? "Exit Win" : "Win"; break;
          case "pip": modeLabel = isCurrentActive ? "Exit PiP" : "PiP"; break;
          default: modeLabel = modeKey.charAt(0).toUpperCase() + modeKey.slice(1);
        }

        return dc.preact.h('button', {
          key: modeKey,
          onClick: () => toggleMode(modeKey),
          style: {
            minWidth: "38px", height: "38px", padding: "0 8px", cursor: "pointer",
            backgroundColor: isCurrentActive ? "#dc3545" : "#007bff",
            color: "white",
            border: `1px solid ${isCurrentActive ? "#bd2130" : "#0056b3"}`,
            borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: "bold", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "background-color 0.15s ease-in-out, border-color 0.15s ease-in-out",
          },
          title: isCurrentActive ? `Exit ${modeKey} Mode (Return to Default)` : `Activate ${modeKey} Mode`
        }, modeLabel);
      })
  );
};

return { ScreenModeHelper };
```



# MusicPlayer

```jsx
// MusicPlayer.component.jsx

// ====================================================================================
// --- IMPORTS ---
// ====================================================================================
const { useState, useRef, useEffect, useCallback, useMemo } = dc; 

// ====================================================================================
// --- GLOBAL CONSTANTS ---
// ====================================================================================
const DEFAULT_PIP_HEIGHT = 150;
const EXPANDED_PIP_HEIGHT = 500;

// SVG Icon Paths (from Material Design Icons, simplified for embedding)
const SHUFFLE_PATH = "M16.5 3c2.485 0 4.5 2.015 4.5 4.5 0 1.256-.523 2.39-1.365 3.195l-1.851-1.85c.143-.377.216-.789.216-1.22 0-1.654-1.346-3-3-3s-3 1.346-3 3c0 .878.375 1.674.981 2.24L11.2 13l-1.85-1.85c.142-.377.215-.789.215-1.22 0-1.654-1.346-3-3-3s-3 1.346-3 3c0 .878.375 1.674.981 2.24L2.8 17.5l-.854-.854c.783-.783 1.298-1.782 1.498-2.88l-1.5-1.5c-1.396 1.396-2.244 3.325-2.244 5.384 0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5c0-1.503-.44-2.893-1.196-4.06l1.5-1.5c1.11 1.099 1.94 2.455 2.39 3.96h-2.19c-.382-1.5-1.125-2.78-2.19-3.79l.5-.5c1.45-1.45 2.215-3.35 2.215-5.32 0-2.06-1.19-3.87-2.91-4.75z";
const LOOP_ALL_PATH = "M17 17H7v-3l-4 4 4 4v-3h12v-6h-2v4zM7 7h10v3l4-4-4-4v3H5v6h2V7z";
const LOOP_ONE_PATH = "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zM13 15V9h-1l-2 1v4h3z";
const PLAY_ALL_FAVS_PATH = "M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm14.5-5L22 12l-3.5 2V9z";

// ====================================================================================
// --- PROVIDERS, API, and UTILS ---
// (No changes here, kept for context)
// ====================================================================================
const providers = {};
providers.youtube = (() => { const NAME = 'YouTube'; const SOURCE_ID = 'youtube'; const getBaseUrl = (url) => url.trim().replace(/\/+$/, ''); const search = async (query, utils, settings) => { const pipedInstances = settings?.pipedInstances || []; const invidiousInstances = settings?.invidiousInstances || []; if (pipedInstances.length > 0) { for (const instance of pipedInstances) { try { const baseUrl = getBaseUrl(instance); const url = `${baseUrl}/search?q=${encodeURIComponent(query)}&filter=videos`; const data = await utils.fetchApi(url); const adaptedResults = (data.items || []).map(item => ({ videoId: new URLSearchParams(item.url.split('?')[1]).get('v'), title: item.title, author: item.uploaderName })); return adaptedResults; } catch (e) { console.warn(`[YouTube Provider - Piped] Search failed for instance ${instance}:`, e); } } } if (invidiousInstances.length > 0) { for (const instance of invidiousInstances) { try { const baseUrl = getBaseUrl(instance); const url = `${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`; const results = await utils.fetchApi(url); return Array.isArray(results) ? results : []; } catch (e) { console.warn(`[YouTube Provider - Invidious] Search failed for instance ${instance}:`, e); } } } throw new Error("All YouTube search providers (Piped & Invidious) failed."); }; const getStreamUrl = async (track, utils, settings) => { const pipedInstances = settings?.pipedInstances || []; const invidiousInstances = settings?.invidiousInstances || []; const videoId = track.videoId; if (!videoId) throw new Error("Could not determine video ID from track data."); if (pipedInstances.length > 0) { for (const instance of pipedInstances) { try { const baseUrl = getBaseUrl(instance); const url = `${baseUrl}/streams/${videoId}`; const data = await utils.fetchApi(url); if (data?.audioStreams?.length > 0) { const bestStream = data.audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0]; if (bestStream?.url) return bestStream.url; } throw new Error("No suitable audio stream found."); } catch (e) { console.warn(`[YouTube Provider - Piped] Stream URL fetch failed for instance ${instance}:`, e); } } } if (invidiousInstances.length > 0) { for (const instance of invidiousInstances) { try { const baseUrl = getBaseUrl(instance); const url = `${baseUrl}/api/v1/videos/${videoId}`; const data = await utils.fetchApi(url); if (data?.adaptiveFormats?.length > 0) { const audioStreams = data.adaptiveFormats.filter(f => f.type.includes("audio")); if (audioStreams.length > 0) { const bestStream = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0]; if (bestStream?.url) return bestStream.url; } } throw new Error("No suitable audio stream found."); } catch (e) { console.warn(`[YouTube Provider - Invidious] Stream URL fetch failed for instance ${instance}:`, e); } } } try { const cobaltApiUrl = "https://co.wuk.sh/api/json"; const response = await utils.request({ url: cobaltApiUrl, method: 'POST', contentType: 'application/json', body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, isAudioOnly: true }) }); const data = JSON.parse(response.text); if (data.status === 'stream') return data.url; throw new Error(`Cobalt returned status '${data.status}'.`); } catch (e) { console.warn(`[YouTube Provider - Cobalt] Stream URL fetch failed:`, e); throw new Error("All stream providers (Piped, Invidious & Cobalt) failed."); } }; const normalize = (track) => ({ id: `yt-${track.videoId}`, title: track.title, author: track.author, url: null, _raw: track, _source: SOURCE_ID, }); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.funkwhale = (() => { const NAME = 'Funkwhale'; const search = async () => []; const getStreamUrl = async () => { throw new Error("Funkwhale is disabled."); }; const normalize = (t) => ({}); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.emanate = (() => { const NAME = 'Emanate'; const search = async () => []; const getStreamUrl = async () => { throw new Error("Emanate is disabled."); }; const normalize = (t) => ({}); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.napster = (() => { const NAME = 'Napster'; const search = async () => []; const getStreamUrl = async () => { throw new Error("Napster is disabled."); }; const normalize = (t) => ({}); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.audius = (() => { const NAME = 'Audius', APP_NAME = "DatacoreMusicPlayer"; const search = (q, utils) => utils.fetchApi(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=${APP_NAME}`).then(r => r.data || []); const getStreamUrl = (t, utils) => Promise.resolve(`https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=${APP_NAME}`); const normalize = (t) => ({ id: t.id, title: t.title, artist: t.user.name, url: null, _raw: t, _source: 'audius' }); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.jamendo = (() => { const NAME = 'Jamendo', CLIENT_ID = "836523a7"; const search = (q, utils) => utils.fetchApi(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&search=${encodeURIComponent(q)}`).then(r => r.results || []); const getStreamUrl = (t, utils) => Promise.resolve(t.audio); const normalize = (t) => ({ id: `jam-${t.id}`, title: t.name, artist: t.artist_name, url: null, _raw: t, _source: 'jamendo' }); return { name: NAME, search, getStreamUrl, normalize }; })();
providers.odysee = (() => { const NAME = 'Odysee', API_URL = "https://api.odysee.com/api/v3/sdk"; const search = async (q, utils) => { const res = await utils.fetchApi(API_URL, { method: 'POST', contentType: 'application/json', body: JSON.stringify({ method: "claim_search", params: { text: q, stream_type: ["audio", "video"], has_source: true, page_size: 20 } }) }); return (res.result?.items || []).filter(item => item.value?.source?.media_type?.startsWith('audio/')); }; const getStreamUrl = (t, utils) => Promise.resolve(`https://player.odysee.live/content/claims/${t.name}/${t.claim_id}/stream`); const normalize = (t) => ({ id: `odysee-${t.claim_id}`, title: t.value?.title || t.name, artist: t.signing_channel?.name || 'Unknown', url: null, _raw: t, _source: 'odysee' }); return { name: NAME, search, getStreamUrl, normalize }; })();

const MusicAPI = (() => { 
    const _providers = {}; 
    const _utils = { 
        // Prioritize dc.app.requestUrl for Obsidian compatibility, fall back to window.requestUrl
        request: (dc.app && dc.app.requestUrl) ? dc.app.requestUrl : window.requestUrl, 
        fetchApi: async (url, options = {}) => {
            if (!((dc.app && dc.app.requestUrl) || window.requestUrl)) {
                console.error("[MusicAPI] Neither dc.app.requestUrl nor window.requestUrl is available.");
                throw new Error("Network request function is not available.");
            }

            console.log(`[MusicAPI] Attempting fetch: ${url}`, options); // Log fetch attempt
            let response;
            try {
                response = await _utils.request({
                    url, 
                    method: options.method || 'GET', 
                    headers: options.headers || {},
                    body: options.body,
                    contentType: options.contentType,
                    // Note: dc.app.requestUrl inherently handles some mobile network specifics,
                    // but external network issues or strict firewalls can still cause failures.
                });
                console.log(`[MusicAPI] Response status for ${url}: ${response.status}`); // Log response status
            } catch (e) {
                console.error(`[MusicAPI] Network request to ${url} failed:`, e); // Log detailed network error
                throw new Error(`Network request to ${url} failed: ${e.message || e.toString()}. Please check your internet connection or network security settings.`);
            }

            if (response.status !== 200) {
                console.error(`[MusicAPI] API responded with non-200 status for ${url}: ${response.status}`, response.text);
                throw new Error(`API response error, status ${response.status}: ${response.text ? response.text.substring(0, 200) + '...' : 'No response text'}`);
            }
            
            try {
                return JSON.parse(response.text);
            } catch (e) {
                console.error(`[MusicAPI] Failed to parse JSON response from ${url}:`, response.text, e);
                throw new Error(`Failed to parse API response from ${url}: ${e.message || e.toString()}. Received: "${response.text ? response.text.substring(0, 200) + '...' : 'empty response'}"`);
            }
        } 
    }; 
    const registerProvider = (id, provider) => { _providers[id] = provider; }; 
    const search = async (query, activeProviderIds, settings) => { 
        const providersToSearch = Object.entries(_providers).filter(([id]) => activeProviderIds.has(id)); 
        const settledResults = await Promise.allSettled(providersToSearch.map(([id, provider]) => provider.search(query, _utils, settings?.[id]))); 
        return settledResults.flatMap((res, i) => { 
            const [id, provider] = providersToSearch[i]; 
            if (res.status === 'fulfilled' && Array.isArray(res.value)) { 
                return res.value.map(track => provider.normalize(track)); 
            } else { 
                console.warn(`[MusicAPI] Provider '${provider.name}' search failed:`, res.reason); 
                return []; 
            } 
        }); 
    }; 
    const getStreamUrl = async (track, settings) => { 
        const provider = _providers[track._source]; 
        if (!provider) throw new Error(`Provider "${track._source}" not found.`); 
        return provider.getStreamUrl(track._raw || track, _utils, settings?.[track._source]); 
    }; 
    return { registerProvider, search, getStreamUrl }; 
})();
const FileUtils = { LIKED_SONGS_PATH: ".datacore/musicplayer/liked-songs.json", loadLikedSongs: async (vaultAdapter) => { try { if (await vaultAdapter.exists(FileUtils.LIKED_SONGS_PATH)) { return JSON.parse(await vaultAdapter.read(FileUtils.LIKED_SONGS_PATH)); } } catch (error) { console.error("Error loading liked songs:", error); } return {}; }, saveLikedSongs: async (vaultAdapter, songs) => { const dir = FileUtils.LIKED_SONGS_PATH.substring(0, FileUtils.LIKED_SONGS_PATH.lastIndexOf('/')); try { if (!(await vaultAdapter.exists(dir))) await vaultAdapter.mkdir(dir); await vaultAdapter.write(FileUtils.LIKED_SONGS_PATH, JSON.stringify(songs, null, 2)); } catch (error) { console.error("Error saving liked songs:", error); } } };

// ====================================================================================
// --- PipHelper COMPONENT (MODIFIED HTML & CSS for PIP border color) ---
// ====================================================================================
const PipHelper = ({ 
    onMount, onClose, track, isPlaying, isLiked, onPlayPause, onNext, onPrev, onLike, 
    currentTime, duration, onSeek, volume, onVolumeChange, formatTime, 
    isExpanded, onToggleExpand, 
    isShuffle, onToggleShuffle, loopMode, onCycleLoopMode, 
    playAllLikedSongs, isPlayingAllLiked, likedSongsCount,
    isVisible // <--- NEW PROP
}) => {
    const pipWindowRef = useRef(null);
    const activeDrag = useRef(null);
    const callbacksRef = useRef();
    useEffect(() => { callbacksRef.current = { 
        onClose, onPlayPause, onNext, onPrev, onLike, onSeek, onVolumeChange, 
        onToggleExpand, onToggleShuffle, onCycleLoopMode, playAllLikedSongs 
    }; });

    useEffect(() => {
        const pipWindow = document.createElement('div');
        pipWindowRef.current = pipWindow;
        pipWindow.innerHTML = `
            <style>
                .pip-player-container { position: relative; width: 100%; height: 100%; color: white; display: flex; flex-direction: column; padding: 10px 15px; box-sizing: border-box; font-family: sans-serif; gap: 8px; user-select: none; -webkit-user-select: none; }
                .pip-close-btn { position: absolute; top: 2px; right: 5px; cursor: pointer; background: none; border: none; color: #aaa; font-size: 28px; line-height: 1; padding: 0; z-index: 10; }
                .pip-track-info { text-align: center; min-height: 0; }
                .pip-track-info .title { font-size: 1.1em; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .pip-track-info .artist { font-size: 0.9em; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
                .pip-progress-container { display: flex; align-items: center; gap: 8px; font-size: 0.8em; color: #ccc; }
                .pip-custom-progress-container { flex-grow: 1; height: 15px; display: flex; align-items: center; cursor: pointer; padding: 5px 0; }
                .pip-custom-progress-track { position: relative; width: 100%; height: 5px; background-color: #444; border-radius: 5px; }
                .pip-custom-progress-filled { position: absolute; top: 0; left: 0; height: 100%; background-color: #fff; border-radius: 5px; pointer-events: none; }
                .pip-custom-progress-handle { position: absolute; top: 50%; width: 14px; height: 14px; background-color: #fff; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
                
                /* --- MODIFIED CONTROL STYLES --- */
                .pip-controls { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    width: 100%; 
                }
                .pip-volume-wrapper { position: relative; flex-shrink: 0; }
                .main-playback-controls { 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    flex-shrink: 0; 
                }
                .pip-right-action-controls { 
                    display: flex; 
                    align-items: center; 
                    gap: 5px; 
                    flex-shrink: 0; 
                }
                .pip-controls button { 
                    background: none; 
                    border: none; 
                    color: white; 
                    cursor: pointer; 
                    transition: color 0.2s, transform 0.1s; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    padding: 5px; 
                }
                .pip-controls button:hover { transform: scale(1.1); }
                .pip-controls button:disabled { opacity: 0.5; cursor: not-allowed; }
                
                /* Specific button sizing */
                .main-playback-controls button { font-size: 22px; }
                .main-playback-controls .pip-play-pause-btn { font-size: 30px; }
                .pip-right-action-controls button { font-size: 18px; color: #aaa; }
                .pip-volume-btn { font-size: 22px; } 

                .pip-right-action-controls .pip-like-btn { font-size: 22px; color: white; } 
                .pip-right-action-controls .pip-like-btn.liked { color: #e44d6b; }
                .pip-right-action-controls .pip-shuffle-btn.active, 
                .pip-right-action-controls .pip-loop-btn.active { color: #5d3eff; }
                
                /* SVG icon styling */
                .pip-icon { width: 24px; height: 24px; fill: currentColor; }
                .pip-play-all-favs-btn .pip-icon { width: 22px; height: 22px; } /* Slightly smaller play all icon */

                .pip-volume-popup { position: absolute; bottom: calc(100% + 5px); left: 0px; width: 40px; height: 120px; background: rgba(30, 30, 30, 0.95); border: 1px solid #555; border-radius: 20px; display: flex; justify-content: center; align-items: center; transition: opacity 0.2s, visibility 0.2s; }
                .pip-volume-popup.hidden { opacity: 0; visibility: hidden; }
                .pip-custom-volume-container { width: 15px; height: 100px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
                .pip-custom-volume-track { position: relative; height: 100%; width: 5px; background-color: #666; border-radius: 5px; }
                .pip-custom-volume-filled { position: absolute; bottom: 0; left: 0; width: 100%; background-color: #fff; border-radius: 5px; pointer-events: none; }
                .pip-custom-volume-handle { position: absolute; left: 50%; width: 15px; height: 15px; background-color: #fff; border-radius: 50%; transform: translate(-50%, 50%); pointer-events: none; }
                
                .pip-full-player-mount { flex-grow: 1; overflow-y: auto; min-height: 0; display: none; background-color: #181818; border-radius: 8px; margin-top: 10px; }
                .pip-full-player-mount .app-container { padding: 0; display: flex; flex-direction: column; height: 100%; gap: 10px; }
                .main-tabs { display: flex; border-bottom: 1px solid #333; flex-shrink: 0; }
                .main-tabs button { flex: 1; background: transparent; color: #aaa; border: none; padding: 10px; font-size: 0.9em; font-weight: bold; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s ease; }
                .main-tabs button:hover { background: #2a2a2a; color: white; }
                .main-tabs button.active { color: white; border-bottom-color: #5d3eff; }
                .tab-content { flex-grow: 1; overflow-y: auto; padding: 0 10px; }
            </style>
            <div class="pip-player-container">
                <button class="pip-close-btn" title="Close">×</button>
                <div class="pip-full-player-mount" id="pip-full-player-mount-point"></div> 
                <div class="pip-track-info"><div class="title"></div><div class="artist"></div></div>
                <div class="pip-progress-container">
                    <span class="pip-current-time">0:00</span>
                    <div class="pip-custom-progress-container">
                        <div class="pip-custom-progress-track"><div class="pip-custom-progress-filled"></div><div class="pip-custom-progress-handle"></div></div>
                    </div>
                    <span class="pip-duration">0:00</span>
                </div>

                <div class="pip-controls">
                    <!-- Left Group: Volume -->
                    <div class="pip-volume-wrapper">
                        <button class="pip-volume-btn" title="Volume">🔊</button>
                        <div class="pip-volume-popup hidden">
                            <div class="pip-custom-volume-container">
                                <div class="pip-custom-volume-track">
                                    <div class="pip-custom-volume-filled"></div>
                                    <div class="pip-custom-volume-handle"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Middle Group: Playback Controls -->
                    <div class="main-playback-controls">
                        <button class="pip-prev-btn" title="Previous">«</button>
                        <button class="pip-play-pause-btn" title="Play/Pause"></button>
                        <button class="pip-next-btn" title="Next">»</button>
                    </div>

                    <!-- Right Group: Shuffle, Loop, Play All Favorites, Like, Expand -->
                    <div class="pip-right-action-controls">
                        <button class="pip-shuffle-btn" title="Toggle Shuffle">
                            <svg class="pip-icon" viewBox="0 0 24 24"><path d="${SHUFFLE_PATH}"/></svg>
                        </button>
                        <button class="pip-loop-btn" title="Cycle Loop Mode">
                            <svg class="pip-icon pip-loop-icon" viewBox="0 0 24 24"><path d="${LOOP_ALL_PATH}"/></svg>
                        </button>
                        <button class="pip-play-all-favs-btn" title="Play All Favorites">
                            <svg class="pip-icon" viewBox="0 0 24 24"><path d="${PLAY_ALL_FAVS_PATH}"/></svg>
                        </button>
                        <button class="pip-like-btn" title="Like">♥</button>
                        <button class="pip-expand-btn" title="Expand/Collapse Full Player">↔</button> 
                    </div>
                </div>
            </div>`;
        const pipWidth = 350;
        Object.assign(pipWindow.style, { 
            position: "fixed", 
            top: `calc(100% - ${DEFAULT_PIP_HEIGHT}px - 20px)`, 
            left: `calc(100% - ${pipWidth}px - 20px)`, 
            width: `${pipWidth}px`, 
            height: `${DEFAULT_PIP_HEIGHT}px`, 
            zIndex: "10001", 
            backgroundColor: "#1e1e1e", 
            border: "2px solid #5d3eff", // Updated to a vibrant purple
            borderRadius: "8px", 
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)', 
            cursor: 'grab', 
            display: isVisible ? 'flex' : 'none', 
            flexDirection: 'column', 
            transition: 'height 0.2s ease-out, top 0.2s ease-out' 
        }); 
        document.body.appendChild(pipWindow);
        const mountPoint = pipWindow.querySelector('#pip-full-player-mount-point');
        if (onMount) onMount(mountPoint);
        const get = (sel) => pipWindow.querySelector(sel);
        let startX, startY, startTop, startLeft;
        const onWindowDragMove = (e) => { if (isExpanded && e.target.closest('.pip-full-player-mount')) return; if (!activeDrag.current) { pipWindow.style.top = `${startTop + (e.clientY - startY)}px`; pipWindow.style.left = `${startLeft + (e.clientX - startX)}px`; } };
        const onWindowDragEnd = () => { pipWindow.style.cursor = 'grab'; document.body.style.userSelect = ''; window.removeEventListener("mousemove", onWindowDragMove); window.removeEventListener("mouseup", onWindowDragEnd); };
        const onWindowDragStart = (e) => { if (e.target.closest('button, .pip-custom-progress-container, .pip-custom-volume-container, .pip-expand-btn, #pip-full-player-mount-point')) return; e.preventDefault(); startX = e.clientX; startY = e.clientY; const computed = getComputedStyle(pipWindow); startTop = parseInt(computed.top, 10) || 0; startLeft = parseInt(computed.left, 10) || 0; pipWindow.style.cursor = 'grabbing'; document.body.style.userSelect = 'none'; window.addEventListener("mousemove", onWindowDragMove); window.addEventListener("mouseup", onWindowDragEnd); };
        pipWindow.addEventListener("mousedown", onWindowDragStart);
        const progressContainer = get('.pip-custom-progress-container');
        const volumeContainer = get('.pip-custom-volume-container');
        const handleProgressSeek = (e) => { const rect = progressContainer.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); callbacksRef.current.onSeek({ target: { value: (pipWindowRef.current?.__current_duration || 0) * p } }); };
        const handleVolumeSeek = (e) => { const rect = volumeContainer.getBoundingClientRect(); const v = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height))); callbacksRef.current.onVolumeChange({ target: { value: v } }); };
        const onSliderMouseMove = (e) => { if (activeDrag.current === 'progress') handleProgressSeek(e); else if (activeDrag.current === 'volume') handleVolumeSeek(e); };
        const onSliderMouseUp = () => { activeDrag.current = null; document.removeEventListener('mousemove', onSliderMouseMove); document.removeEventListener('mouseup', onSliderMouseUp); };
        const onSliderMouseDown = (e, type) => { e.stopPropagation(); activeDrag.current = type; if (type === 'progress') handleProgressSeek(e); if (type === 'volume') handleVolumeSeek(e); document.addEventListener('mousemove', onSliderMouseMove); document.addEventListener('mouseup', onSliderMouseUp); };
        progressContainer.addEventListener('mousedown', (e) => onSliderMouseDown(e, 'progress'));
        volumeContainer.addEventListener('mousedown', (e) => onSliderMouseDown(e, 'volume'));
        const handleAndStop = (handler) => (e) => { e.stopPropagation(); handler(e); };
        get('.pip-close-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onClose()));
        get('.pip-prev-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onPrev()));
        get('.pip-play-pause-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onPlayPause()));
        get('.pip-next-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onNext()));
        get('.pip-like-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onLike()));
        get('.pip-expand-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onToggleExpand())); 
        get('.pip-shuffle-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onToggleShuffle()));
        get('.pip-loop-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.onCycleLoopMode()));
        get('.pip-play-all-favs-btn').addEventListener('click', handleAndStop(() => callbacksRef.current.playAllLikedSongs())); // New listener
        const volumePopup = get('.pip-volume-popup');
        get('.pip-volume-btn').addEventListener('click', handleAndStop(() => volumePopup.classList.toggle('hidden')));
        const handleClickOutside = (e) => { if (!volumePopup.classList.contains('hidden') && !e.target.closest('.pip-volume-popup, .pip-volume-btn')) volumePopup.classList.add('hidden'); };
        document.addEventListener('mousedown', handleClickOutside, true);
        
        return () => {
            pipWindow.removeEventListener("mousedown", onWindowDragStart);
            window.removeEventListener("mousemove", onWindowDragMove);
            window.removeEventListener("mouseup", onWindowDragEnd);
            document.removeEventListener('mousemove', onSliderMouseMove);
            document.removeEventListener('mouseup', onSliderMouseUp);
            document.removeEventListener('mousedown', handleClickOutside, true);
            if (onMount) onMount(null);
            if (pipWindow.parentNode) pipWindow.parentNode.removeChild(pipWindow);
        };
    }, []); 

    // NEW useEffect to control visibility dynamically
    useEffect(() => {
        if (pipWindowRef.current) {
            pipWindowRef.current.style.display = isVisible ? 'flex' : 'none';
        }
    }, [isVisible]);


    useEffect(() => {
        const pipWindow = pipWindowRef.current;
        if (!pipWindow) return; 
        
        pipWindow.__current_duration = duration;

        const get = (sel) => pipWindow.querySelector(sel);
        const titleEl = get('.pip-track-info .title');
        titleEl.innerText = track?.title || "No Track Selected";
        titleEl.title = track?.title || "No Track Selected";
        const artistEl = get('.pip-track-info .artist');
        artistEl.innerText = track?.artist || "Use main player to search"; 
        artistEl.title = track?.artist || "Use main player to search";
        get('.pip-play-pause-btn').innerText = isPlaying ? '❚❚' : '►';
        get('.pip-like-btn').classList.toggle('liked', isLiked);
        get('.pip-volume-btn').innerText = volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔇';
        get('.pip-current-time').innerText = formatTime(currentTime);
        get('.pip-duration').innerText = formatTime(duration);
        const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
        get('.pip-custom-progress-filled').style.width = `${progressPercent}%`;
        get('.pip-custom-progress-handle').style.left = `${progressPercent}%`;
        get('.pip-custom-volume-filled').style.height = `${volume * 100}%`;
        get('.pip-custom-volume-handle').style.bottom = `${volume * 100}%`;
        const expandBtn = get('.pip-expand-btn');
        if (expandBtn) expandBtn.innerText = isExpanded ? '⇩' : '↔'; 
        
        get('.pip-shuffle-btn').classList.toggle('active', isShuffle);
        
        // Update the SVG path for loop button
        const loopPathEl = get('.pip-loop-icon path'); 
        if (loopPathEl) {
            loopPathEl.setAttribute('d', loopMode === 'one' ? LOOP_ONE_PATH : LOOP_ALL_PATH);
        }
        get('.pip-loop-btn').classList.toggle('active', loopMode !== 'none');

        // Update Play All Favorites button state
        const playAllFavsBtn = get('.pip-play-all-favs-btn');
        if (playAllFavsBtn) {
            playAllFavsBtn.disabled = isPlayingAllLiked || likedSongsCount === 0;
            // You can add a loading spinner or other visual feedback here if desired
            // For now, it just gets disabled.
        }

        const oldHeight = parseFloat(getComputedStyle(pipWindow).height); 
        const newHeight = isExpanded ? EXPANDED_PIP_HEIGHT : DEFAULT_PIP_HEIGHT;

        if (Math.abs(oldHeight - newHeight) > 1) { 
            const currentTop = parseFloat(getComputedStyle(pipWindow).top);
            const heightDifference = newHeight - oldHeight;
            pipWindow.style.top = `${currentTop - heightDifference}px`;
        }
        
        pipWindow.style.height = `${newHeight}px`;

        const fullPlayerMountPoint = pipWindow.querySelector('#pip-full-player-mount-point');
        if (fullPlayerMountPoint) { fullPlayerMountPoint.style.display = isExpanded ? 'flex' : 'none'; fullPlayerMountPoint.style.flexDirection = 'column'; }
    }, [track, isPlaying, isLiked, currentTime, duration, volume, formatTime, isExpanded, isShuffle, loopMode, isPlayingAllLiked, likedSongsCount]); // Add new dependencies

    return null;
};

// ====================================================================================
// --- CustomProgressBar COMPONENT (No changes) ---
// ====================================================================================
const CustomProgressBar = ({ duration, currentTime, onSeek, isDisabled }) => { const progressBarRef = useRef(null); const [isSeeking, setIsSeeking] = useState(false); const handleSeekInteraction = (e) => { if (isDisabled || !progressBarRef.current) return; const rect = progressBarRef.current.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clickPosition = clientX - rect.left; const barWidth = rect.width; const progress = Math.max(0, Math.min(1, clickPosition / barWidth)); const newTime = progress * duration; onSeek({ target: { value: newTime } }); }; const handleMouseDown = (e) => { if (isDisabled) return; setIsSeeking(true); handleSeekInteraction(e); }; useEffect(() => { const handleMouseMove = (e) => { if (isSeeking) { handleSeekInteraction(e); } }; const handleMouseUp = () => { setIsSeeking(false); }; if (isSeeking) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); window.addEventListener('touchmove', handleMouseMove); window.addEventListener('touchend', handleMouseUp); } return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); window.removeEventListener('touchmove', handleMouseMove); window.removeEventListener('touchend', handleMouseUp); }; }, [isSeeking, duration, onSeek, isDisabled]); const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0; return ( <div ref={progressBarRef} className={`custom-progress-container ${isDisabled ? 'disabled' : ''}`} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}> <div className="custom-progress-track"> <div className="custom-progress-filled" style={{ width: `${progressPercent}%` }}></div> <div className="custom-progress-handle" style={{ left: `${progressPercent}%` }}></div> </div> </div> ); };

// ====================================================================================
// --- PipExpandedView COMPONENT (Modified: Shuffle restored with SVG) ---
// ====================================================================================
const NowPlayingIcon = () => (
    <svg className="now-playing-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect className="bar" x="4" y="8" width="4" height="12"></rect>
        <rect className="bar" x="10" y="4" width="4" height="16"></rect>
        <rect className="bar" x="16" y="10" width="4" height="10"></rect>
    </svg>
);

function PipExpandedView(props) {
    const {
        onSearch, 
        isLoading,
        preparingTrackId,
        searchResults, 
        addToQueue, 
        playTrackNow,
        removeFromQueue,
        likedSongs, handleToggleLike, statusMessage,
        activeTab, setActiveTab, playlist, currentTrackIndex, playTrackAtIndex,
        isShuffle, toggleShuffle, 
        loopMode, cycleLoopMode,   
    } = props;
    
    const [internalQuery, setInternalQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(internalQuery);
    };
    
    const getLoopIcon = () => {
        if (loopMode === 'one') return LOOP_ONE_PATH; 
        if (loopMode === 'all') return LOOP_ALL_PATH; 
        return LOOP_ALL_PATH; 
    };
    
    const likedSongsCount = Object.keys(likedSongs).length;

    return (
        <div className="app-container">
  
            <div className="main-tabs">
                <button className={`tab-button ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>Search</button>
                <button className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>Queue ({playlist.length})</button>
                <button className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>Favorites ({likedSongsCount})</button>
            </div>
            <div className="tab-content">
                {activeTab === 'search' && (
                    <div className="search-panel">
                        <form onSubmit={handleSubmit} className="search-form">
                            <input 
                                name="query" 
                                type="text" 
                                value={internalQuery} 
                                onChange={(e) => setInternalQuery(e.target.value)} 
                                placeholder="Search for music..." 
                            />
                            <button type="submit" disabled={isLoading}>{isLoading ? '...' : 'Go'}</button>
                        </form>
                        <div className="search-results-container">
                            {isLoading ? <div className="status-message">Searching...</div> 
                            : searchResults.length > 0 ? searchResults.map(track => {
                                const isPreparing = preparingTrackId === track.id;
                                return (
                                <div key={track.id} className={`result-item ${isPreparing ? 'preparing' : ''}`}>
                                    <div className="result-info">
                                        <div className="result-text">
                                            <div className="title">{track.title}</div>
                                            <div className="artist">{track.artist}</div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        {isPreparing ? (
                                            <div className="loader"></div>
                                        ) : (
                                            <>
                                                <button className={`like-button ${likedSongs[track.id]?'liked':''}`} onClick={() => handleToggleLike(track)} title="Like">♥</button>
                                                <button className="add-queue-button" onClick={() => addToQueue(track)} title="Add to Queue">+</button>
                                                <button className="play-now-button" onClick={() => playTrackNow(track)} title="Play Now">▸</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                );
                            }) : <div className="status-message">{statusMessage}</div>}
                        </div>
                    </div>
                )}
                {activeTab === 'queue' && (
                    <div className="playlist-panel">
                        <div className="playlist">
                            {playlist.length > 0 ? playlist.map((track, index) => {
                                const isActive = index === currentTrackIndex;
                                return (
                                <div key={`${track.id}-${index}`} className={`result-item ${isActive ? 'active' : ''}`}>
                                    <div className="result-info" onClick={() => playTrackAtIndex(index)} style={{cursor: 'pointer'}}>
                                        {isActive && <NowPlayingIcon />}
                                        <div className="result-text">
                                            <div className="title">{track.title}</div>
                                            <div className="artist">{track.artist}</div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        <button className={`like-button ${likedSongs[track.id]?'liked':''}`} onClick={() => handleToggleLike(track)} title="Like">♥</button>
                                        <button className="remove-queue-button" onClick={() => removeFromQueue(index)} title="Remove from Queue">×</button>
                                    </div>
                                </div>
                                );
                            }) : <p style={{ textAlign: 'center', padding: '20px' }}>Queue is empty.</p>}
                        </div>
                    </div>
                )}
                {activeTab === 'favorites' && (
                    <div className="playlist-panel">
                        <div className="playlist">
                            {Object.values(likedSongs).length > 0 ? Object.values(likedSongs).map(track => (
                                <div key={track.id} className="result-item">
                                    <div className="result-info">
                                        <div className="result-text">
                                            <div className="title">{track.title}</div>
                                            <div className="artist">{track.artist}</div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        <button className="like-button liked" onClick={() => handleToggleLike(track)} title="Unlike">♥</button>
                                        <button className="add-queue-button" onClick={() => addToQueue(track)} title="Add to Queue">+</button>
                                        <button className="play-now-button" onClick={() => playTrackNow(track)} title="Play Now">▸</button>
                                    </div>
                                </div>
                            )) : <p style={{ textAlign: 'center', padding: '20px' }}>No favorites yet.</p>}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .playback-controls-header { display: flex; justify-content: flex-end; align-items: center; gap: 8px; padding: 5px 10px 5px; }
                .control-button { background: transparent; border: none; color: #aaa; font-size: 18px; cursor: pointer; padding: 5px; border-radius: 4px; line-height: 1; }
                .control-button:hover { background-color: #2a2a2a; color: white; }
                .control-button.active { color: #5d3eff; }
                
                .favorites-play-header { padding: 5px 10px 10px; }
                .play-all-favorites-button { width: 100%; padding: 10px; background-color: #1DB954; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background-color 0.2s ease; }
                .play-all-favorites-button:hover:not(:disabled) { background-color: #1ed760; }
                .play-all-favorites-button:disabled { background-color: #333; color: #888; cursor: not-allowed; }

                .playlist-header { padding: 5px 0 10px; }
                .add-all-button { width: 100%; padding: 8px; background-color: #5d3eff; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
                .add-all-button:hover:not(:disabled) { background-color: #4b2cde; }
                .add-all-button:disabled { background-color: #333; color: #888; cursor: not-allowed; }
                .result-item { display: flex; align-items: center; justify-content: space-between; transition: opacity 0.2s, background-color 0.2s; padding: 4px; border-radius: 4px; }
                .result-item.preparing { opacity: 0.5; cursor: not-allowed; }
                .result-item.active { background-color: #2a2a2a; }
                .result-info { flex-grow: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
                .result-actions { display: flex; align-items: center; gap: 5px; min-width: 65px; justify-content: flex-end; }
                .search-panel .result-actions { min-width: 105px; }
                .result-actions button { background: #333; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
                .result-actions button.play-now-button { font-size: 20px; line-height: 1; }
                .result-actions button.add-queue-button { font-size: 22px; line-height: 1; }
                .result-actions button.remove-queue-button { font-size: 22px; line-height: 1; color: #aaa; }
                .result-actions button:hover { background: #444; }
                .result-actions button.remove-queue-button:hover { color: #fff; background-color: #c82333; }
                .loader { border: 3px solid #f3f3f3; border-top: 3px solid #5d3eff; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .now-playing-icon .bar { animation: bounce 1.2s ease-in-out infinite; transform-origin: bottom; }
                .now-playing-icon .bar:nth-child(2) { animation-delay: -0.2s; }
                .now-playing-icon .bar:nth-child(3) { animation-delay: -0.4s; }
                @keyframes bounce { 0%, 40%, 100% { transform: scaleY(0.4); } 20% { transform: scaleY(1.0); } }
            `}</style>
        </div>
    );
}

// ====================================================================================
// --- MusicPlayer CORE COMPONENT (Modified) ---
// ====================================================================================
// ADDED NEW PROPS
function MusicPlayer({ initialPipMode = false, onPlayStatusChange, onPipVisibilityChange, triggerPipReopen, setTriggerPipReopen }) { 
    const ALL_PROVIDER_IDS = useMemo(() => Object.keys(providers), []);
    const HARD_DISABLED_PROVIDERS = useMemo(() => new Set(['napster', 'funkwhale', 'emanate', 'odysee']), []); 
    const ENABLED_PROVIDERS = useMemo(() => ALL_PROVIDER_IDS.filter(id => !HARD_DISABLED_PROVIDERS.has(id)), [ALL_PROVIDER_IDS, HARD_DISABLED_PROVIDERS]);
    useEffect(() => { ALL_PROVIDER_IDS.forEach(id => MusicAPI.registerProvider(id, providers[id])); }, [ALL_PROVIDER_IDS]);
    const [playlist, setPlaylist] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [preparingTrackId, setPreparingTrackId] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Search for music...");
    const [likedSongs, setLikedSongs] = useState({});
    const [activeTab, setActiveTab] = useState('search'); 
    const [activeProviders, setActiveProviders] = useState(() => new Set(ENABLED_PROVIDERS)); 
    
    // isPipVisible controls the actual display of the PIP UI
    const [isPipVisible, setIsPipVisible] = useState(initialPipMode); 
    
    const [isExpandedInPip, setIsExpandedInPip] = useState(false); 
    const [volume, setVolume] = useState(1);
    const audioRef = useRef(null);
    const vaultAdapter = dc.app.vault.adapter;
    const currentTrack = currentTrackIndex !== null && currentTrackIndex < playlist.length ? playlist[currentTrackIndex] : null;
    const [providerSettings, setProviderSettings] = useState(() => { try { const savedSettings = localStorage.getItem('datacore-music-player-settings'); if (savedSettings) return JSON.parse(savedSettings); } catch (e) {} return { youtube: { invidiousInstances: [ "https://yewtu.be", "https://iv.melmac.space" ], pipedInstances: [ "https://pipedapi.kavin.rocks", "https://pipedapi.smnz.de" ] } }; });
    
    const [isShuffle, setIsShuffle] = useState(false);
    const [loopMode, setLoopMode] = useState('none');
    const [isAddingAllLiked, setIsAddingAllLiked] = useState(false);
    const [isPlayingAllLiked, setIsPlayingAllLiked] = useState(false);
    
    useEffect(() => { FileUtils.loadLikedSongs(vaultAdapter).then(setLikedSongs); }, [vaultAdapter]);
    useEffect(() => { try { localStorage.setItem('datacore-music-player-settings', JSON.stringify(providerSettings)); } catch(e) {} }, [providerSettings]);
    useEffect(() => { 
        if (audioRef.current) { 
            audioRef.current.volume = volume; 
            const newSrc = currentTrack?.url || ""; 
            if (audioRef.current.src !== newSrc) { 
                audioRef.current.src = newSrc; 
                if (newSrc) { 
                    audioRef.current.load(); 
                    if (isPlaying) { 
                        audioRef.current.play().catch(e => {
                            console.error("Autoplay failed:", e);
                            setIsPlaying(false); // Stop playing if autoplay fails
                            setStatusMessage("Autoplay blocked. Click play to resume.");
                        }); 
                    } 
                } 
            } 
        } 
    }, [currentTrack, isPlaying, volume]);

    useEffect(() => { 
        if (!audioRef.current || !currentTrack) return; 
        if (isPlaying) { 
            audioRef.current.play().catch(e => {
                console.error("Play failed:", e);
                setIsPlaying(false);
                setStatusMessage("Could not play track. Autoplay blocked or media error.");
            }); 
        } else { 
            audioRef.current.pause(); 
        } 
    }, [isPlaying, currentTrack]);
    
    // NEW: Report isPlaying state to parent (BottomCornerButton)
    useEffect(() => {
        if (onPlayStatusChange) {
            onPlayStatusChange(isPlaying);
        }
    }, [isPlaying, onPlayStatusChange]);

    // NEW: Report isPipVisible state to parent (BottomCornerButton)
    useEffect(() => {
        if (onPipVisibilityChange) {
            onPipVisibilityChange(isPipVisible);
        }
    }, [isPipVisible, onPipVisibilityChange]);

    // NEW: Handle external trigger to reopen PIP
    useEffect(() => {
        if (triggerPipReopen) {
            setIsPipVisible(true);
            setIsExpandedInPip(false); // Reset expansion when reopening
            if (setTriggerPipReopen) {
                setTriggerPipReopen(false); // Reset the trigger immediately
            }
        }
    }, [triggerPipReopen, setTriggerPipReopen]);


    const handleSearch = useCallback(async (query) => { 
        if (!query || activeProviders.size === 0) {
            setStatusMessage("Please enter a search query and enable at least one music provider.");
            return;
        }
        setIsLoading(true);
        setStatusMessage(`Searching for "${query}"...`);
        setSearchResults([]);
        try { 
            const r = await MusicAPI.search(query, activeProviders, providerSettings); 
            setSearchResults(r); 
            setStatusMessage(r.length > 0 ? "" : `No results found for "${query}".`); 
        } catch (err) { 
            setStatusMessage(`Search failed: ${err.message || err.toString()}`); 
            console.error("Music search error:", err); 
        } finally { 
            setIsLoading(false); 
        } 
    }, [activeProviders, providerSettings]);
    
    const playTrackAtIndex = useCallback((i) => { 
        if (i < 0 || i >= playlist.length) return; 
        setCurrentTime(0); 
        setCurrentTrackIndex(i); 
        setIsPlaying(true); 
    }, [playlist.length]);
    const removeFromQueue = useCallback((indexToRemove) => { 
        const trackToRemove = playlist[indexToRemove]; 
        const newPlaylist = playlist.filter((_, i) => i !== indexToRemove); 
        if (indexToRemove === currentTrackIndex) { 
            setIsPlaying(false); 
            setCurrentTrackIndex(null); 
        } else if (indexToRemove < currentTrackIndex) { 
            setCurrentTrackIndex(prevIndex => prevIndex - 1); 
        } 
        setPlaylist(newPlaylist); 
        setStatusMessage(`Removed "${trackToRemove.title}" from queue.`); 
    }, [playlist, currentTrackIndex]);
    
    const prepareTrack = useCallback(async (track) => { 
        if (track.url) return track; 
        try { 
            const url = await MusicAPI.getStreamUrl(track, providerSettings); 
            return { ...track, url, _raw: null }; 
        } catch (e) { 
            setStatusMessage(`Error loading track "${track.title}": ${e.message || e.toString()}`); 
            console.error("Error preparing track:", e); 
            return null; 
        } 
    }, [providerSettings]);
    
    const addToQueue = useCallback(async (track) => { 
        const existingIndex = playlist.findIndex(t => t.id === track.id); 
        if (existingIndex > -1) { 
            setStatusMessage(`"${track.title}" is already in the queue.`); 
            return; 
        } 
        setPreparingTrackId(track.id); 
        setStatusMessage(`Adding "${track.title}" to queue...`); 
        try { 
            const preparedTrack = await prepareTrack(track); 
            if (preparedTrack) { 
                const newPlaylist = [...playlist, preparedTrack]; 
                setPlaylist(newPlaylist); 
                setStatusMessage(`Added "${preparedTrack.title}" to queue.`); 
                if (currentTrackIndex === null) { 
                    setCurrentTrackIndex(playlist.length); 
                    setIsPlaying(true); 
                } 
            } else {
                setStatusMessage(`Failed to add "${track.title}" to queue.`);
            }
        } finally { 
            setPreparingTrackId(null); 
        } 
    }, [playlist, prepareTrack, currentTrackIndex]);
    
    const playTrackNow = useCallback(async (track) => { 
        setPreparingTrackId(track.id); 
        setStatusMessage(`Loading "${track.title}"...`);
        try { 
            const existingIndex = playlist.findIndex(t => t.id === track.id); 
            if (existingIndex > -1) { 
                playTrackAtIndex(existingIndex); 
                setActiveTab('queue'); 
            } else { 
                const preparedTrack = await prepareTrack(track); 
                if (preparedTrack) { 
                    const newPlaylist = [...playlist, preparedTrack]; 
                    setPlaylist(newPlaylist); 
                    setCurrentTrackIndex(playlist.length); 
                    setIsPlaying(true); 
                    setActiveTab('queue'); 
                } else {
                    setStatusMessage(`Failed to play "${track.title}".`);
                }
            } 
        } finally { 
            setPreparingTrackId(null); 
        } 
    }, [playlist, prepareTrack, playTrackAtIndex]);
    
    const handleToggleLike = useCallback((t) => { if (!t) return; setLikedSongs(n => { const newLikedSongs = { ...n }; if (newLikedSongs[t.id]) delete newLikedSongs[t.id]; else { const { _raw, ...r } = t; newLikedSongs[t.id] = r; } FileUtils.saveLikedSongs(vaultAdapter, newLikedSongs); return newLikedSongs; }); }, [vaultAdapter]);
    const handlePlayPause = useCallback(() => { 
        if (!currentTrack || !audioRef.current) return; 
        if (isPlaying) { 
            audioRef.current.pause(); 
            setIsPlaying(false); 
        } else { 
            audioRef.current.play().then(() => setIsPlaying(true)).catch(e => {
                console.error("Failed to play audio:", e);
                setIsPlaying(false);
                setStatusMessage("Failed to play. Autoplay blocked or media error.");
            }); 
        } 
    }, [currentTrack, isPlaying]);
    const handleNext = useCallback(() => { 
        if (playlist.length === 0) return; 
        if (playlist.length === 1 && loopMode !== 'all') { 
            if (loopMode === 'none') setIsPlaying(false); return; 
        } 
        if (isShuffle) { 
            let nextIndex; 
            do { nextIndex = Math.floor(Math.random() * playlist.length); 
            } while (playlist.length > 1 && nextIndex === currentTrackIndex); 
            playTrackAtIndex(nextIndex); 
        } else { 
            const nextIndex = currentTrackIndex + 1; 
            if (nextIndex >= playlist.length) { 
                if (loopMode === 'all') playTrackAtIndex(0); 
                else setIsPlaying(false); 
            } else { 
                playTrackAtIndex(nextIndex); 
            } 
        } 
    }, [playlist.length, currentTrackIndex, playTrackAtIndex, isShuffle, loopMode]);
    const handlePrev = useCallback(() => { 
        if (!playlist.length || !audioRef.current) return; 
        if (audioRef.current.currentTime > 3) { 
            audioRef.current.currentTime = 0; 
        } else { 
            const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length; 
            playTrackAtIndex(prevIndex); 
        } 
    }, [playlist.length, currentTrackIndex, playTrackAtIndex]);
    const handleTrackEnd = useCallback(() => { 
        if (loopMode === 'one' && audioRef.current) { 
            audioRef.current.currentTime = 0; 
            audioRef.current.play(); 
        } else { 
            handleNext(); 
        } 
    }, [loopMode, handleNext]);
    const toggleShuffle = useCallback(() => setIsShuffle(prev => !prev), []);
    const cycleLoopMode = useCallback(() => { setLoopMode(prev => { if (prev === 'none') return 'all'; if (prev === 'all') return 'one'; return 'none'; }); }, []);
    
    const addAllLikedToQueue = useCallback(async () => { 
        if (isAddingAllLiked) return; 
        const likedTracks = Object.values(likedSongs); 
        if (likedTracks.length === 0) { setStatusMessage("You have no liked songs to add."); return; } 
        const playlistIds = new Set(playlist.map(t => t.id)); 
        const tracksToAdd = likedTracks.filter(t => !playlistIds.has(t.id)); 
        if (tracksToAdd.length === 0) { setStatusMessage("All liked songs are already in queue."); setActiveTab('queue'); return; } 
        
        setIsAddingAllLiked(true); 
        setStatusMessage(`Preparing to add ${tracksToAdd.length} songs...`); 
        try {
            const preparedTracks = await Promise.all(tracksToAdd.map(track => prepareTrack(track))); 
            const successfullyPrepared = preparedTracks.filter(Boolean); 
            const newPlaylist = [...playlist, ...successfullyPrepared]; 
            setPlaylist(newPlaylist); 
            if (successfullyPrepared.length > 0) { 
                setStatusMessage(`Added ${successfullyPrepared.length} songs to queue.`); 
                if (currentTrackIndex === null) { 
                    setCurrentTrackIndex(playlist.length); 
                    setIsPlaying(true); 
                } 
                setActiveTab('queue'); 
            } else { 
                setStatusMessage("Could not load any of the new liked songs."); 
            } 
        } catch (error) {
            console.error("Error adding all liked songs to queue:", error);
            setStatusMessage(`Failed to add liked songs: ${error.message || error.toString()}`);
        } finally { 
            setIsAddingAllLiked(false); 
        } 
    }, [likedSongs, playlist, prepareTrack, isAddingAllLiked, currentTrackIndex]);
    
    const playAllLikedSongs = useCallback(async () => { 
        if (isPlayingAllLiked || Object.keys(likedSongs).length === 0) return; 
        
        setIsPlayingAllLiked(true); 
        setStatusMessage("Preparing your favorite songs..."); 
        try { 
            const likedTracks = Object.values(likedSongs); 
            const preparedTracks = await Promise.all(likedTracks.map(track => prepareTrack(track))); 
            const successfullyPrepared = preparedTracks.filter(Boolean); 
            
            if (successfullyPrepared.length === 0) { 
                setStatusMessage("Could not load any of your favorite songs."); 
                return; 
            } 
            setPlaylist(successfullyPrepared); 
            setCurrentTrackIndex(0); 
            setIsPlaying(true); 
            setActiveTab('queue'); 
            setStatusMessage(`Now playing ${successfullyPrepared.length} favorite songs.`); 
        } catch (error) { 
            console.error("Error playing all liked songs:", error); 
            setStatusMessage(`An error occurred while preparing your favorites: ${error.message || error.toString()}`); 
        } finally { 
            setIsPlayingAllLiked(false); 
        } 
    }, [likedSongs, prepareTrack, isPlayingAllLiked]);
    
    const handleTimeUpdate = useCallback(() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }, []);
    const handleLoadedMetadata = useCallback(() => { if (audioRef.current) setDuration(audioRef.current.duration); }, []);
    const handleSeek = useCallback((e) => { if(audioRef.current) audioRef.current.currentTime = e.target.value; setCurrentTime(e.target.value); }, []);
    const formatTime = useCallback((s) => !s || isNaN(s) ? "0:00" : `${Math.floor(s / 60)}:${('0' + Math.floor(s % 60)).slice(-2)}`, []);
    const handleVolumeChange = useCallback((e) => { setVolume(parseFloat(e.target.value)); }, []);
    const handleToggleExpandedInPip = useCallback(() => { setIsExpandedInPip(prev => !prev); }, []);
    
    const pipPlayerMountNode = useRef(null);
    
    useEffect(() => {
        const mountNode = pipPlayerMountNode.current;
        if (!mountNode) return;

        const pipViewProps = {
            onSearch: handleSearch, isLoading, preparingTrackId, searchResults, addToQueue, playTrackNow,
            removeFromQueue, likedSongs, handleToggleLike, statusMessage, activeTab, setActiveTab, 
            playlist, currentTrackIndex, playTrackAtIndex,
            isShuffle, toggleShuffle, 
            loopMode, cycleLoopMode,   
        };

        if (isExpandedInPip) { dc.preact.render(<PipExpandedView {...pipViewProps} />, mountNode); } 
        else { dc.preact.render(null, mountNode); }
        
        return () => { if (mountNode) { try { dc.preact.render(null, mountNode); } catch (e) {} } };
    }, [
        isExpandedInPip, isLoading, preparingTrackId, searchResults, likedSongs, statusMessage, 
        activeTab, playlist, currentTrackIndex, handleSearch, addToQueue, playTrackNow, 
        handleToggleLike, setActiveTab, playTrackAtIndex, removeFromQueue,
        isShuffle, toggleShuffle, loopMode, cycleLoopMode, 
    ]);

    return (
        <div className="datacore-music-player-wrapper" style={{ display: 'none' }}>
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleTrackEnd}></audio>
            
            <PipHelper 
                onMount={(node) => pipPlayerMountNode.current = node}
                track={currentTrack} 
                isPlaying={isPlaying} 
                isLiked={!!likedSongs[currentTrack?.id]} 
                onPlayPause={handlePlayPause} 
                onNext={handleNext} 
                onPrev={handlePrev} 
                onLike={() => handleToggleLike(currentTrack)} 
                onClose={() => { setIsPipVisible(false); setIsExpandedInPip(false); }} 
                currentTime={currentTime} 
                duration={duration} 
                onSeek={handleSeek} 
                volume={volume} 
                onVolumeChange={handleVolumeChange} 
                formatTime={formatTime}
                isExpanded={isExpandedInPip} 
                onToggleExpand={handleToggleExpandedInPip}
                isShuffle={isShuffle}
                onToggleShuffle={toggleShuffle}
                loopMode={loopMode}
                onCycleLoopMode={cycleLoopMode}
                playAllLikedSongs={playAllLikedSongs}
                isPlayingAllLiked={isPlayingAllLiked}
                likedSongsCount={Object.keys(likedSongs).length}
                isVisible={isPipVisible} 
            /> 
        </div>
    );
}

// ====================================================================================
// --- FINAL EXPORT ---
// ====================================================================================
return { MusicPlayer };
```