

# ViewComponent

```jsx
const { useState, useEffect, useRef } = dc;

// ============================================================================
//  LoadScript Utility (Embedded - Self-Contained)
// ============================================================================

/**
 * Loads a script from CDN with caching and global deduplication.
 */
async function loadScript(dc, src, options = {}) {
  const {
    type = 'script',
    globalName = null,
    cache = true,
    onload = null,
    onerror = null
  } = options;

  if (!dc || !dc.app || !dc.app.vault || !dc.app.vault.adapter) {
    const error = new Error("Datacore context 'dc' with vault adapter is required.");
    if (onerror) onerror(error);
    throw error;
  }

  const adapter = dc.app.vault.adapter;
  const cacheDir = ".datacore/script_cache";
  const isUrl = /^https?:\/\//.test(src);

  // Global deduplication check
  if (globalName && window[globalName]) {
    // console.log(`[LoadScript] ✓ ${globalName} already available`);
    return type === 'module' ? window[globalName] : Promise.resolve();
  }

  // Global promise tracking
  window.__scriptPromises = window.__scriptPromises || {};
  const promiseKey = `${type}:${src}`;
  
  if (window.__scriptPromises[promiseKey]) {
    // console.log(`[LoadScript] ⏳ ${src} already loading, reusing promise...`);
    return window.__scriptPromises[promiseKey];
  }

//   console.log(`[LoadScript] 📥 Loading ${type} from ${isUrl ? 'URL' : 'local'}: ${src}`);

  const loadPromise = (async () => {
    try {
      let scriptContent = null;

      if (isUrl) {
        const safeFilename = src
          .replace(/^https?:\/\//, '')
          .replace(/[\/\\?%*:|"<>]/g, '_') + '.js';
        const cachePath = `${cacheDir}/${safeFilename}`;

        // Check cache first
        if (cache && await adapter.exists(cachePath)) {
        //   console.log(`[LoadScript] 📦 Loading from cache: ${cachePath}`);
          try {
            scriptContent = await adapter.read(cachePath);
          } catch (readError) {
            console.warn(`[LoadScript] ⚠️ Cache read failed, refetching:`, readError);
          }
        }

        // Fetch from network if not cached
        if (scriptContent === null) {
        //   console.log(`[LoadScript] 🌐 Fetching from network: ${src}`);
          const response = await fetch(src);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          scriptContent = await response.text();
          
          // Cache for future use
          if (cache) {
            try {
              if (!(await adapter.exists(cacheDir))) {
                await adapter.mkdir(cacheDir);
              }
              await adapter.write(cachePath, scriptContent);
            //   console.log(`[LoadScript] 💾 Cached to: ${cachePath}`);
            } catch (writeError) {
              console.warn(`[LoadScript] ⚠️ Cache write failed:`, writeError);
            }
          }
        }
      } else {
        // console.log(`[LoadScript] 📁 Reading from vault: ${src}`);
        if (!(await adapter.exists(src))) {
          throw new Error(`Local file not found: ${src}`);
        }
        scriptContent = await adapter.read(src);
      }

      // Execute based on type
      let result;

      if (type === 'module') {
        // console.log(`[LoadScript] 🎭 Loading as ESM module...`);
        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        
        try {
          const moduleExports = await import(blobUrl);
          URL.revokeObjectURL(blobUrl);
          
          if (globalName) {
            window[globalName] = moduleExports;
          }
          
          result = moduleExports;
        } catch (importError) {
          URL.revokeObjectURL(blobUrl);
          throw new Error(`Module import failed: ${importError.message}`);
        }
      } else {
        console.log(`[LoadScript] 📜 Loading as classic script...`);
        
        // For inline scripts, we need to execute and then poll for the global
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptContent;
        console.log(`[LoadScript] Appending script to document body (${scriptContent.length} chars)`);
        document.body.appendChild(scriptElement);
        console.log(`[LoadScript] Script appended and executed inline`);
        
        // Now wait for the global variable if specified
        if (globalName) {
          const maxWaitTime = 5000; // 5 seconds
          const checkInterval = 50; // Check every 50ms
          const startTime = Date.now();
          
          console.log(`[LoadScript] Polling for ${globalName} to be available...`);
          while (!window[globalName] && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(r => setTimeout(r, checkInterval));
          }
          
          if (window[globalName]) {
            console.log(`[LoadScript] ✓ ${globalName} is now available after ${Date.now() - startTime}ms`);
            result = window[globalName];
          } else {
            console.error(`[LoadScript] ✗ Timeout waiting for ${globalName}`);
            throw new Error(`Timeout waiting for ${globalName} to be available`);
          }
        } else {
          result = scriptElement;
        }
      }

      if (onload) onload(result);
    //   console.log(`[LoadScript] 🎉 Load complete: ${src}`);
      return result;

    } catch (error) {
      console.error(`[LoadScript] 💥 Failed to load ${src}:`, error);
      if (onerror) onerror(error);
      throw error;
    } finally {
      delete window.__scriptPromises[promiseKey];
    }
  })();

  window.__scriptPromises[promiseKey] = loadPromise;
  return loadPromise;
}

// ============================================================================
//  DOM Traversal Utilities for Full-Tab Mode
// ============================================================================

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

// ============================================================================
//  Main OCR Reader Component
// ============================================================================

function BasicView() {
  // OCR process states
  const [ocrText, setOcrText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [tesseractLoaded, setTesseractLoaded] = useState(false);

  // Image source state: 'vault', 'upload', or 'paste'
  const [imageSource, setImageSource] = useState('vault');

  // Vault image selection states
  const [selectedVaultFilePath, setSelectedVaultFilePath] = useState('');
  const [vaultImageFiles, setVaultImageFiles] = useState([]);

  // Upload/Paste image states
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageName, setUploadedImageName] = useState('');

  // Image preview URL
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Full-tab mode state
  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const fullTabStateRefs = useRef({}).current;
  const uniqueWrapperClass = `ocrreader-wrapper-${useRef(Math.random().toString(36).substr(2, 9)).current}`;
  
  const fileInputRef = useRef(null);
  const currentBlobUrl = useRef(null);

  // --- Load Tesseract.js on mount ---
  useEffect(() => {
    let mounted = true;
    
    const initTesseract = async () => {
      try {
        // Check if already loaded
        if (window.Tesseract) {
          console.log('[OCR] Tesseract.js already available');
          if (mounted) setTesseractLoaded(true);
          return;
        }
        
        console.log('[OCR] Loading Tesseract.js from CDN...');
        const result = await loadScript(dc, 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', {
          globalName: 'Tesseract',
          type: 'script'
        });
        
        console.log('[OCR] loadScript returned:', result ? 'success' : 'no result', 'window.Tesseract exists:', !!window.Tesseract);
        
        if (window.Tesseract && mounted) {
          console.log('[OCR] Tesseract.js loaded successfully');
          setTesseractLoaded(true);
        } else if (!window.Tesseract) {
          throw new Error('Tesseract object not found after script load');
        }
      } catch (err) {
        console.error('[OCR] Failed to load Tesseract.js:', err);
        if (mounted) {
          setError(`Failed to load OCR library: ${err.message}`);
        }
      }
    };
    
    initTesseract();
    
    return () => {
      mounted = false;
    };
  }, []);

  // --- Load vault image files ---
  useEffect(() => {
    const allFiles = dc.app.vault.getFiles();
    const imageFiles = allFiles.filter(file => {
      const ext = file.extension.toLowerCase();
      return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
    });
    imageFiles.sort((a, b) => a.path.localeCompare(b.path));
    setVaultImageFiles(imageFiles);
    
    // Set default image - remove the filename from the path
    const currentPath = dc.useCurrentPath();
    const dirPath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    const defaultImagePath = dirPath + '_resources/images/ocr_reader.webp';
    const defaultImage = imageFiles.find(f => f.path === defaultImagePath);
    
    if (defaultImage) {
      setSelectedVaultFilePath(defaultImagePath);
    } else if (imageFiles.length > 0 && !selectedVaultFilePath) {
      setSelectedVaultFilePath(imageFiles[0].path);
    }
  }, []);

  // --- Blob URL Cleanup ---
  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
        currentBlobUrl.current = null;
      }
    };
  }, [imagePreviewUrl]);

  // --- Handle Vault File Selection & Preview ---
  useEffect(() => {
    const updateVaultImage = async () => {
      if (selectedVaultFilePath && imageSource === 'vault') {
        const file = dc.app.vault.getAbstractFileByPath(selectedVaultFilePath);
        if (file && typeof file.extension === 'string') {
          try {
            const arrayBuffer = await dc.app.vault.readBinary(file);
            
            // Convert to base64 data URL (works better with Tesseract in Electron)
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < uint8Array.byteLength; i++) {
              binary += String.fromCharCode(uint8Array[i]);
            }
            const base64 = btoa(binary);
            const mimeType = file.extension === 'svg' ? 'image/svg+xml' : `image/${file.extension}`;
            const dataUrl = `data:${mimeType};base64,${base64}`;
            
            if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
            currentBlobUrl.current = null;
            setImagePreviewUrl(dataUrl);
            //console.log(`[OCR] Preview generated for vault file: ${file.path}`);
          } catch (err) {
            console.error(`[OCR] Failed to generate preview:`, err);
            setImagePreviewUrl(null);
          }
        } else {
          setImagePreviewUrl(null);
        }
        // Clear upload states when switching to vault
        setUploadedImage(null);
        setUploadedImageName('');
        setOcrText("");
        setError(null);
      }
    };
    updateVaultImage();
  }, [selectedVaultFilePath, imageSource]);

  // --- Handle Image Upload/Paste ---
  useEffect(() => {
    if (uploadedImage && (imageSource === 'upload' || imageSource === 'paste')) {
      setImagePreviewUrl(uploadedImage);
      setOcrText("");
      setError(null);
    }
  }, [uploadedImage, imageSource]);

  // --- Full-tab mode effect ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isFullTab) {
      if (!container.parentNode) {
        setTimeout(() => setIsFullTab(true), 50);
        return;
      }
      const targetPaneContent = findNearestAncestorWithClass(container, 'workspace-leaf-content');
      if (!targetPaneContent) {
        console.error("[OCR] Full tab mode failed");
        setIsFullTab(false);
        return;
      }
      const contentWrapper = findDirectChildByClass(targetPaneContent, 'view-content') || targetPaneContent;
      
      fullTabStateRefs.originalParent = container.parentNode;
      fullTabStateRefs.placeholder = document.createElement('div');
      fullTabStateRefs.placeholder.style.display = 'none';
      container.parentNode.insertBefore(fullTabStateRefs.placeholder, container);
      
      const computedParentPosition = window.getComputedStyle(contentWrapper).position;
      fullTabStateRefs.parentPositionInfo = {
        element: contentWrapper,
        originalInlinePosition: contentWrapper.style.position
      };
      if (computedParentPosition === 'static') {
        contentWrapper.style.position = "relative";
      }
      
      contentWrapper.appendChild(container);
      Object.assign(container.style, {
        position: "absolute", top: "0px", left: "0px",
        width: "100%", height: "100%", zIndex: "9998",
        overflow: "auto"
      });
    }

    return () => {
      if (!fullTabStateRefs.originalParent) return;
      if (fullTabStateRefs.placeholder?.parentNode) {
        fullTabStateRefs.placeholder.parentNode.replaceChild(container, fullTabStateRefs.placeholder);
      } else {
        fullTabStateRefs.originalParent.appendChild(container);
      }
      if (fullTabStateRefs.parentPositionInfo?.element) {
        fullTabStateRefs.parentPositionInfo.element.style.position = fullTabStateRefs.parentPositionInfo.originalInlinePosition || '';
      }
      container.removeAttribute("style");
      Object.keys(fullTabStateRefs).forEach(key => fullTabStateRefs[key] = null);
    };
  }, [isFullTab]);

  // ============================================================================
  //  Event Handlers
  // ============================================================================

  /**
   * Handles OCR processing using Tesseract.js
   */
  const handleOcr = async () => {
    if (!tesseractLoaded) {
      setError("Tesseract.js library is not loaded yet. Please wait...");
      return;
    }

    if (!imagePreviewUrl) {
      setError("No image selected for OCR.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOcrText("");
    setProgress(0);

    try {
      //console.log('[OCR] Starting text recognition...');
      
      const result = await window.Tesseract.recognize(
        imagePreviewUrl,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const progressPercent = Math.round(m.progress * 100);
              setProgress(progressPercent);
              console.log(`[OCR] Progress: ${progressPercent}%`);
            }
          }
        }
      );
      
      const extractedText = result.data.text;
     // console.log('[OCR] Text extraction complete');
    //   console.log('[OCR] Confidence:', result.data.confidence?.toFixed(2));
    //   console.log('[OCR] Words found:', result.data.words.length);
      
      if (extractedText && extractedText.trim().length > 0) {
        setOcrText(extractedText);
      } else {
        setOcrText("");
        setError("OCR completed, but no text was detected in the image.");
      }
    } catch (err) {
      console.error('[OCR] Processing failed:', err);
      setError(`OCR failed: ${err.message}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  /**
   * Handles file input change for image upload
   */
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setUploadedImageName(file.name);
        setImageSource('upload');
        // console.log(`[OCR] Image uploaded: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("Please select a valid image file.");
    }
  };

  /**
   * Handles paste event for images
   */
  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        event.preventDefault();
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImage(e.target.result);
          setUploadedImageName('Pasted Image');
          setImageSource('paste');
        //   console.log('[OCR] Image pasted from clipboard');
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  /**
   * Handles drag and drop
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImage(e.target.result);
          setUploadedImageName(file.name);
          setImageSource('upload');
        //   console.log(`[OCR] Image dropped: ${file.name}`);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please drop an image file');
      }
    }
  };

  /**
   * Copy OCR text to clipboard
   */
  const copyToClipboard = () => {
    if (ocrText) {
      navigator.clipboard.writeText(ocrText);
      alert('Text copied to clipboard!');
    }
  };

  // ============================================================================
  //  Styles - Black on Black with Purple Accents
  // ============================================================================

  const styles = {
    container: {
      height: '100%',
      width: '100%',
      padding: '24px',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'var(--font-interface)',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      overflowY: 'auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      margin: 0,
      fontSize: '28px',
      fontWeight: '300',
      color: '#ffffff',
      letterSpacing: '2px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    section: {
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(155, 135, 245, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      letterSpacing: '1px'
    },
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: 'rgba(155, 135, 245, 0.15)',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      justifyContent: 'center',
      border: '1px solid rgba(155, 135, 245, 0.3)'
    },
    buttonHover: {
      backgroundColor: 'rgba(155, 135, 245, 0.25)',
      borderColor: 'rgba(155, 135, 245, 0.5)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(155, 135, 245, 0.2)'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    radioGroup: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px'
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#ffffff',
      padding: '10px 16px',
      backgroundColor: '#0a0a0a',
      borderRadius: '8px',
      border: '1px solid rgba(155, 135, 245, 0.2)',
      transition: 'all 0.2s ease'
    },
    radioLabelActive: {
      backgroundColor: 'rgba(155, 135, 245, 0.15)',
      borderColor: 'rgba(155, 135, 245, 0.5)'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid rgba(155, 135, 245, 0.3)',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      fontSize: '14px',
      marginBottom: '16px',
      cursor: 'pointer',
      fontFamily: 'var(--font-interface)',
      fontWeight: '400'
    },
    imagePreview: {
      width: '100%',
      maxHeight: '500px',
      objectFit: 'contain',
      border: '2px solid rgba(155, 135, 245, 0.3)',
      borderRadius: '12px',
      backgroundColor: '#0a0a0a',
      boxShadow: '0 0 20px rgba(155, 135, 245, 0.1)'
    },
    dropZone: {
      padding: '60px 40px',
      border: '2px dashed rgba(155, 135, 245, 0.3)',
      borderRadius: '12px',
      textAlign: 'center',
      backgroundColor: '#0a0a0a',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    dropZoneActive: {
      borderColor: 'rgba(155, 135, 245, 0.6)',
      backgroundColor: 'rgba(155, 135, 245, 0.05)',
      transform: 'scale(1.02)'
    },
    dropZoneContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      color: '#ffffff'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: 'rgba(155, 135, 245, 0.1)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '16px',
      border: '1px solid rgba(155, 135, 245, 0.2)'
    },
    progressFill: {
      height: '100%',
      backgroundColor: 'rgba(155, 135, 245, 0.8)',
      transition: 'width 0.3s ease',
      boxShadow: '0 0 10px rgba(155, 135, 245, 0.5)'
    },
    textArea: {
      width: '100%',
      minHeight: '250px',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid rgba(155, 135, 245, 0.3)',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontSize: '13px',
      fontFamily: 'var(--font-monospace)',
      resize: 'vertical',
      boxSizing: 'border-box',
      lineHeight: '1.6'
    },
    error: {
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 82, 82, 0.1)',
      border: '1px solid rgba(255, 82, 82, 0.3)',
      color: '#ff5252',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px'
    },
    info: {
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: 'rgba(155, 135, 245, 0.1)',
      border: '1px solid rgba(155, 135, 245, 0.3)',
      color: '#ffffff',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  };

  // ============================================================================
  //  Render
  // ============================================================================

  return (
    <div ref={containerRef} style={styles.container} className={uniqueWrapperClass}>
      <style>{`
        .${uniqueWrapperClass}:hover .exit-fulltab-icon,
        .${uniqueWrapperClass}:hover .enter-fulltab-icon { 
          opacity: 1; 
          transform: scale(1); 
        }
        .${uniqueWrapperClass} .exit-fulltab-icon,
        .${uniqueWrapperClass} .enter-fulltab-icon {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Full Tab Toggle Icon */}
      {isFullTab ? (
        <span 
          style={{
            position: "absolute", top: "15px", right: "20px", 
            fontSize: "20px", color: "rgba(155, 135, 245, 0.6)", userSelect: "none",
            cursor: "pointer", zIndex: 10,
          }}
          className="exit-fulltab-icon"
          title="Exit Full Tab"
          onClick={(e) => { e.stopPropagation(); setIsFullTab(false); }}
        >
          <dc.Icon icon="minimize-2" />
        </span>
      ) : (
        <span 
          style={{
            position: "absolute", top: "15px", right: "20px",
            fontSize: "20px", color: "rgba(155, 135, 245, 0.6)", userSelect: "none",
            cursor: "pointer", zIndex: 10,
          }}
          className="enter-fulltab-icon"
          title="Expand to Full Tab"
          onClick={(e) => { e.stopPropagation(); setIsFullTab(true); }}
        >
          <dc.Icon icon="maximize-2" />
        </span>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          <dc.Icon icon="scan-text" style={{fontSize: '28px', color: 'rgba(155, 135, 245, 0.8)'}} />
          OCR TEXT EXTRACTOR
        </h2>
      </div>

      {/* Tesseract Loading Status */}
      {!tesseractLoaded && !error && (
        <div style={styles.info}>
          <dc.Icon icon="loader" className="spin" style={{fontSize: '16px'}} />
          <span>Loading OCR library from CDN...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={styles.error}>
          <dc.Icon icon="alert-triangle" style={{fontSize: '16px'}} />
          <span>{error}</span>
        </div>
      )}

      {/* Image Source Selection */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <dc.Icon icon="image" style={{color: 'rgba(155, 135, 245, 0.8)'}} />
          1. Select Image Source
        </h3>
        
        <div style={styles.radioGroup}>
          <label style={{
            ...styles.radioLabel,
            ...(imageSource === 'vault' ? styles.radioLabelActive : {})
          }}>
            <input 
              type="radio" 
              name="imageSource" 
              value="vault" 
              checked={imageSource === 'vault'}
              onChange={() => setImageSource('vault')}
            />
            <dc.Icon icon="folder-open" style={{fontSize: '16px', color: 'rgba(155, 135, 245, 0.8)'}} />
            <span>From Vault</span>
          </label>
          <label style={{
            ...styles.radioLabel,
            ...(imageSource === 'upload' ? styles.radioLabelActive : {})
          }}>
            <input 
              type="radio" 
              name="imageSource" 
              value="upload" 
              checked={imageSource === 'upload'}
              onChange={() => setImageSource('upload')}
            />
            <dc.Icon icon="upload" style={{fontSize: '16px', color: 'rgba(155, 135, 245, 0.8)'}} />
            <span>Upload Image</span>
          </label>
        </div>

        {imageSource === 'vault' && (
          <div style={{position: 'relative', width: '100%', marginTop: '8px', marginBottom: '16px'}}>
            <select 
              style={{
                width: '100%',
                height: '48px',
                padding: '0 40px 0 16px',
                margin: 0,
                borderRadius: '8px',
                border: '1px solid rgba(155, 135, 245, 0.3)',
                backgroundColor: '#1e1e1e',
                color: '#ffffff',
                fontSize: '15px',
                lineHeight: '48px',
                cursor: 'pointer',
                fontFamily: 'var(--font-interface)',
                fontWeight: '500',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                display: 'block'
              }}
              value={selectedVaultFilePath}
              onChange={(e) => setSelectedVaultFilePath(e.target.value)}
            >
              <option value="" style={{backgroundColor: '#1e1e1e', color: '#ffffff', padding: '12px'}}>
                Select an image from vault...
              </option>
              {vaultImageFiles.map(file => (
                <option key={file.path} value={file.path} style={{backgroundColor: '#1e1e1e', color: '#ffffff', padding: '12px'}}>
                  {file.path}
                </option>
              ))}
            </select>
            <div style={{
              position: 'absolute', 
              right: '16px', 
              top: '16px',
              fontSize: '16px',
              color: 'rgba(155, 135, 245, 0.8)',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <dc.Icon icon="chevron-down" />
            </div>
          </div>
        )}

        {imageSource === 'upload' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{display: 'none'}}
            />
            
            <div
              style={{
                ...styles.dropZone,
                ...(isDragging ? styles.dropZoneActive : {})
              }}
              onClick={() => fileInputRef.current?.click()}
              onPaste={handlePaste}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              tabIndex={0}
            >
              {uploadedImage ? (
                <div style={styles.dropZoneContent}>
                  <dc.Icon icon="check-circle" style={{fontSize: '40px', color: 'rgba(155, 135, 245, 0.8)', marginBottom: '8px'}} />
                  <div style={{fontSize: '15px', fontWeight: '600', marginBottom: '6px', color: '#ffffff'}}>
                    {uploadedImageName}
                  </div>
                  <div style={{fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <dc.Icon icon="mouse-pointer-click" style={{fontSize: '14px'}} />
                    Click to change, or paste a new image
                  </div>
                </div>
              ) : (
                <div style={styles.dropZoneContent}>
                  <dc.Icon icon="upload-cloud" style={{fontSize: '48px', color: 'rgba(155, 135, 245, 0.4)', marginBottom: '12px'}} />
                  <div style={{fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#ffffff'}}>
                    Click to upload or drag & drop
                  </div>
                  <div style={{fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <dc.Icon icon="clipboard" style={{fontSize: '14px'}} />
                    You can also paste an image (Ctrl/Cmd+V)
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Image Preview */}
      {imagePreviewUrl && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <dc.Icon icon="eye" style={{color: 'rgba(155, 135, 245, 0.8)'}} />
            2. Image Preview
          </h3>
          <img 
            src={imagePreviewUrl} 
            alt="Image to process" 
            style={styles.imagePreview}
          />
        </div>
      )}

      {/* OCR Button */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <dc.Icon icon="wand-2" style={{color: 'rgba(155, 135, 245, 0.8)'}} />
          2. Extract Text
        </h3>
        
        <button
          style={{
            ...styles.button,
            width: '100%',
            ...(isLoading || !tesseractLoaded || !imagePreviewUrl ? styles.buttonDisabled : {})
          }}
          onClick={handleOcr}
          disabled={isLoading || !tesseractLoaded || !imagePreviewUrl}
          onMouseEnter={(e) => {
            if (!isLoading && tesseractLoaded && imagePreviewUrl) {
              Object.assign(e.currentTarget.style, styles.buttonHover);
            }
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, {
              backgroundColor: 'rgba(155, 135, 245, 0.15)',
              borderColor: 'rgba(155, 135, 245, 0.3)',
              transform: 'translateY(0)',
              boxShadow: 'none'
            });
          }}
        >
          {isLoading ? (
            <>
              <dc.Icon icon="loader" className="spin" style={{fontSize: '16px'}} />
              Processing... {progress}%
            </>
          ) : (
            <>
              <dc.Icon icon="scan-text" style={{fontSize: '16px'}} />
              Extract Text from Image
            </>
          )}
        </button>

        {isLoading && (
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress}%`}} />
          </div>
        )}
      </div>

      {/* OCR Results */}
      {ocrText && (
        <div style={styles.section}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h3 style={{...styles.sectionTitle, margin: 0}}>
              <dc.Icon icon="file-text" style={{color: 'rgba(155, 135, 245, 0.8)'}} />
              4. Extracted Text
            </h3>
            <button
              style={styles.button}
              onClick={copyToClipboard}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  backgroundColor: 'rgba(155, 135, 245, 0.15)',
                  borderColor: 'rgba(155, 135, 245, 0.3)',
                  transform: 'translateY(0)',
                  boxShadow: 'none'
                });
              }}
            >
              <dc.Icon icon="copy" style={{fontSize: '14px'}} />
              Copy to Clipboard
            </button>
          </div>
          
          <textarea
            style={styles.textArea}
            value={ocrText}
            readOnly
            placeholder="Extracted text will appear here..."
          />
        </div>
      )}
    </div>
  );
}

return { View: BasicView };
```
