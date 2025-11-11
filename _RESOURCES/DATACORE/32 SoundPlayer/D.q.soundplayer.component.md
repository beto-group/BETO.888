



# ViewComponent

```jsx
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
//  SOUND PLAYER COMPONENT
// =================================================================================
function BasicView() {
  const instanceId = dc.useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `sound-player-wrapper-${instanceId}`;

  // Get current file path and build relative path to music
  const currentPath = dc.resolvePath("D.q.soundplayer.component");
  const defaultSongPath = currentPath 
    ? `${currentPath.substring(0, currentPath.lastIndexOf('/'))}/_resources/music/beto.minigame.soundtrack.wav`
    : null;
  
  // Audio state
  const audioRef = dc.useRef(null);
  const [isPlaying, setIsPlaying] = dc.useState(false);
  const [currentTime, setCurrentTime] = dc.useState(0);
  const [duration, setDuration] = dc.useState(0);
  const [volume, setVolume] = dc.useState(0.7);
  const [audioSrc, setAudioSrc] = dc.useState(null);
  const [fileName, setFileName] = dc.useState("BETO.MINIGAME.SOUNDTRACK");
  const [isDragging, setIsDragging] = dc.useState(false);

  // Initialize with default song
  dc.useEffect(() => {
    if (defaultSongPath) {
      const defaultSrc = app.vault.adapter.getResourcePath(defaultSongPath);
      setAudioSrc(defaultSrc);
    }
  }, [defaultSongPath]);

  // Full-tab state
  const [isFullTab, setIsFullTab] = dc.useState(true);
  const containerRef = dc.useRef(null);
  const stateRefs = dc.useRef({}).current;

  // Styles
  const STYLES = {
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
      .${uniqueWrapperClass} .subtle-icon:hover .exit-tooltip {
        visibility: visible;
        opacity: 1;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes ripple {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    `,
    fullTabWrapper: {
      position: "relative",
      height: "100%",
      width: "100%",
      padding: "40px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "30px",
      backgroundColor: "#000000",
      color: "white",
    },
    exitIcon: {
      position: "absolute",
      top: "20px",
      right: "30px",
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#6b7280",
      userSelect: "none",
      cursor: "pointer",
      zIndex: 10,
    },
    tooltip: {
      visibility: "hidden",
      opacity: 0,
      backgroundColor: "#1a1a1a",
      color: "white",
      textAlign: "center",
      borderRadius: "4px",
      padding: "6px 12px",
      position: "absolute",
      zIndex: 1,
      top: "50%",
      right: "120%",
      transform: "translateY(-50%)",
      fontSize: "12px",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      border: "1px solid #8b5cf6",
    },
    playerContainer: {
      width: "100%",
      maxWidth: "600px",
      display: "flex",
      flexDirection: "column",
      gap: "25px",
      padding: "40px",
      backgroundColor: "#0a0a0a",
      border: "1px solid #2d2d2d",
      borderRadius: "12px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
      transition: "all 0.3s ease",
    },
    dropZone: {
      width: "100%",
      padding: "30px",
      border: "2px dashed #2d2d2d",
      borderRadius: "8px",
      backgroundColor: "#000000",
      textAlign: "center",
      color: "#6b7280",
      fontSize: "13px",
      fontFamily: "monospace",
      transition: "all 0.3s ease",
      cursor: "pointer",
    },
    dropZoneActive: {
      border: "2px dashed #8b5cf6",
      backgroundColor: "#1a1a1a",
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
      color: "#8b5cf6",
    },
    title: {
      fontSize: "28px",
      fontWeight: "300",
      color: "white",
      textAlign: "center",
      marginBottom: "10px",
      letterSpacing: "2px",
      fontFamily: "monospace",
    },
    subtitle: {
      fontSize: "12px",
      color: "#6b7280",
      textAlign: "center",
      letterSpacing: "4px",
      textTransform: "uppercase",
      marginBottom: "20px",
    },
    playButton: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      border: "2px solid #8b5cf6",
      backgroundColor: "#1a1a1a",
      color: "#8b5cf6",
      fontSize: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
      alignSelf: "center",
      position: "relative",
    },
    progressContainer: {
      width: "100%",
      height: "4px",
      backgroundColor: "#1a1a1a",
      borderRadius: "2px",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#8b5cf6",
      borderRadius: "2px",
      transition: "width 0.1s linear",
      boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)",
    },
    timeDisplay: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "11px",
      color: "#6b7280",
      fontFamily: "monospace",
      letterSpacing: "1px",
    },
    volumeContainer: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      justifyContent: "center",
    },
    volumeSlider: {
      width: "120px",
      height: "4px",
      backgroundColor: "#1a1a1a",
      borderRadius: "2px",
      cursor: "pointer",
      position: "relative",
    },
    volumeBar: {
      height: "100%",
      backgroundColor: "#8b5cf6",
      borderRadius: "2px",
      transition: "width 0.1s ease",
    },
    compactWrapper: {
    },
    volumeIcon: {
      fontSize: "18px",
      color: "#8b5cf6",
    },
    compactWrapper: {
      padding: "20px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "15px",
      border: "1px solid #2d2d2d",
      borderRadius: "8px",
      backgroundColor: "#0a0a0a",
    },
    compactText: {
      margin: 0,
      color: "#6b7280",
      fontSize: "14px",
      fontFamily: "monospace",
    },
    button: {
      padding: "10px 20px",
      fontSize: "13px",
      fontWeight: "500",
      color: "white",
      backgroundColor: "#1a1a1a",
      border: "1px solid #8b5cf6",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)",
    },
  };

  // Audio event handlers
  dc.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, percent));
    setVolume(newVolume);
    audio.volume = newVolume;
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Try to get file from Obsidian's drag data
    const dragData = e.dataTransfer.getData('text/plain');

    // Check for files in dataTransfer
    const files = e.dataTransfer.files;

    // If Obsidian is dragging a file, it might be in the text data as a path
    if (dragData) {
      // Remove any markdown link syntax if present
      let filePath = dragData.replace(/^\[\[/, '').replace(/\]\]$/, '');
      
      // Check if it's an audio file
      const fileExt = filePath.split('.').pop().toLowerCase();
      
      if (!['wav', 'mp3', 'mp4'].includes(fileExt)) {
        return;
      }

      // Stop current playback
      const audio = audioRef.current;
      if (audio && isPlaying) {
        audio.pause();
        setIsPlaying(false);
      }

      // Try to find the file in vault
      const file = app.vault.getAbstractFileByPath(filePath);
      
      if (file) {
        const resourcePath = app.vault.adapter.getResourcePath(file.path);
        setAudioSrc(resourcePath);
        setFileName(file.name.replace(/\.[^/.]+$/, "").toUpperCase());
        setCurrentTime(0);
        setDuration(0);
      }
    } else if (files.length > 0) {
      const file = files[0];
      
      const fileExt = file.name.split('.').pop().toLowerCase();
      
      if (!['wav', 'mp3', 'mp4'].includes(fileExt)) {
        return;
      }

      // Stop current playback
      const audio = audioRef.current;
      if (audio && isPlaying) {
        audio.pause();
        setIsPlaying(false);
      }

      // Create object URL from the file
      const objectUrl = URL.createObjectURL(file);
      setAudioSrc(objectUrl);
      setFileName(file.name.replace(/\.[^/.]+$/, "").toUpperCase());
      setCurrentTime(0);
      setDuration(0);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Full-tab effect
  dc.useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;

    const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
    if (!targetPaneContent) {
      setIsFullTab(false);
      return;
    }

    const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
    
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
        stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
      }
      if (stateRefs.parentPositionInfo?.element) {
        stateRefs.parentPositionInfo.element.style.position =
          stateRefs.parentPositionInfo.original === "static" ? "" : stateRefs.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs).forEach((key) => (stateRefs[key] = null));
    };
  }, [isFullTab]);

  const handleExitFullTab = (e) => {
    e.stopPropagation();
    setIsFullTab(false);
  };

  const handleEnterFullTab = () => setIsFullTab(true);

  // Compact mode
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={STYLES.compactWrapper}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <dc.Icon icon="music" style={{ fontSize: "16px", color: "#8b5cf6" }} />
          <p style={STYLES.compactText}>Sound Player</p>
        </div>
        <button 
          style={STYLES.button} 
          onClick={handleEnterFullTab}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <dc.Icon icon="maximize" style={{ fontSize: "14px" }} />
            <span>Enter Full Tab</span>
          </div>
        </button>
      </div>
    );
  }

  // Full-tab mode
  return (
    <div ref={containerRef}>
      <style>{STYLES.hoverEffectStyle}</style>
      <div style={STYLES.fullTabWrapper} className={uniqueWrapperClass}>
        <div
          style={STYLES.exitIcon}
          className="subtle-icon"
          onClick={handleExitFullTab}
        >
          <dc.Icon icon="minimize" style={{ fontSize: "20px" }} />
          <span className="exit-tooltip" style={STYLES.tooltip}>
            Close Full Mode
          </span>
        </div>

        <div style={STYLES.playerContainer}>
          <div>
            <div style={STYLES.title}>⦿ SOUND PLAYER ⦿</div>
            <div style={STYLES.subtitle}>B E T O . 8 8 8</div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            style={{
              ...STYLES.dropZone,
              ...(isDragging ? STYLES.dropZoneActive : {})
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div style={{ fontSize: "32px", marginBottom: "10px", color: isDragging ? "#8b5cf6" : "#6b7280" }}>
              {isDragging ? (
                <dc.Icon icon="circle-dot" style={{ fontSize: "32px" }} />
              ) : (
                <dc.Icon icon="upload" style={{ fontSize: "32px" }} />
              )}
            </div>
            <div style={{ letterSpacing: "2px" }}>
              {isDragging ? "DROP FILE HERE" : "DRAG & DROP AUDIO FILE"}
            </div>
            <div style={{ fontSize: "11px", marginTop: "8px", color: "#4b5563", display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
              <dc.Icon icon="file-audio" style={{ fontSize: "12px" }} />
              <span>.WAV • .MP3 • .MP4</span>
            </div>
          </div>

          {/* Current Track */}
          <div style={{ 
            textAlign: "center", 
            color: "#8b5cf6", 
            fontSize: "13px", 
            fontFamily: "monospace",
            letterSpacing: "1px",
            padding: "10px",
            backgroundColor: "#000000",
            borderRadius: "6px",
            border: "1px solid #2d2d2d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px"
          }}>
            <dc.Icon icon="music" style={{ fontSize: "16px" }} />
            <span>NOW PLAYING: {fileName}</span>
          </div>

          {/* Play/Pause Button */}
          <div
            style={{
              ...STYLES.playButton,
              ...(isPlaying ? {
                backgroundColor: "#2d1f3d",
                boxShadow: "0 0 30px rgba(139, 92, 246, 0.6)",
              } : {})
            }}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <dc.Icon icon="pause" style={{ fontSize: "28px" }} />
            ) : (
              <dc.Icon icon="play" style={{ fontSize: "28px", marginLeft: "4px" }} />
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div style={STYLES.progressContainer} onClick={handleProgressClick}>
              <div
                style={{
                  ...STYLES.progressBar,
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
            <div style={STYLES.timeDisplay}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div style={STYLES.volumeContainer}>
            <dc.Icon icon="volume-2" style={{ fontSize: "18px", color: "#8b5cf6" }} />
            <div style={STYLES.volumeSlider} onClick={handleVolumeChange}>
              <div
                style={{
                  ...STYLES.volumeBar,
                  width: `${volume * 100}%`,
                }}
              />
            </div>
            <span style={{ fontSize: "12px", color: "#6b7280", fontFamily: "monospace", minWidth: "40px" }}>
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Hidden audio element */}
          <audio ref={audioRef} src={audioSrc} />
        </div>
      </div>
    </div>
  );
}

return { BasicView };
```

