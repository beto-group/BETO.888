



# ViewComponent

```jsx
// ocr_component.js (Updated with Initial Image Loading)

const { useState, useEffect, useRef } = dc;

// --- CONFIGURATION ---
// Set the path to an image in your vault here if you want it to load automatically.
// Set to null or an empty string to use the default behavior (first image in the vault).
const INITIAL_IMAGE_PATH_TO_LOAD = "_RESOURCES/IMAGES/license_agreement.webp"; // Example: "Images/MyScannedReceipt.png"

/**
 * Gets the Text Extractor plugin's API.
 * @returns {object | undefined} The API object if the plugin is enabled, otherwise undefined.
 */
function getTextExtractor() {
  return app?.plugins?.plugins?.['text-extractor']?.api;
}

/**
 * The main view component for OCR.
 * @param {object} props - The component props.
 * @param {string | null} props.initialImagePath - The path to an image in the vault to load on component mount.
 */
function BasicView({ initialImagePath = null }) {
  // Plugin readiness state
  const [textExtractorApi, setTextExtractorApi] = useState(null);
  const [pluginError, setPluginError] = useState(null);

  // OCR process states
  const [ocrText, setOcrText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Image source state: 'vault' or 'custom'
  const [imageSource, setImageSource] = useState('vault');

  // Vault image selection states
  const [selectedVaultFilePath, setSelectedVaultFilePath] = useState('');
  const [selectedVaultTFile, setSelectedVaultTFile] = useState(null);

  // Custom image selection states
  const [customFile, setCustomFile] = useState(null);
  const [tempVaultFilePath, setTempVaultFilePath] = useState(null);
  const [tempVaultTFile, setTempVaultTFile] = useState(null);

  // Image preview URL
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Ref for cleanup of blob URLs
  const currentBlobUrl = useRef(null);

  // --- Initial Setup: Check Plugin & Load Initial/Vault Files ---
  useEffect(() => {
    const api = getTextExtractor();
    if (api) {
      setTextExtractorApi(api);
      setPluginError(null);
      console.log("Text Extractor plugin API loaded successfully.");
    } else {
      setPluginError("Text Extractor plugin is not installed or enabled. Please install it and enable it to use OCR features.");
      console.error("Text Extractor plugin API not found.");
    }

    // Get all image files from the vault
    const allFiles = dc.app.vault.getFiles();
    const imageFiles = allFiles.filter(file => {
      const ext = file.extension.toLowerCase();
      return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
    });
    imageFiles.sort((a, b) => a.path.localeCompare(b.path));

    // --- MODIFIED LOGIC: Determine which image to load initially ---
    let pathToLoad = '';
    // 1. Prioritize the initialImagePath prop if it's valid
    if (initialImagePath && imageFiles.some(f => f.path === initialImagePath)) {
        pathToLoad = initialImagePath;
        console.log(`Component initialized with provided image: ${initialImagePath}`);
    } else {
        if (initialImagePath) {
             console.warn(`Provided initial image path "${initialImagePath}" not found or invalid. Falling back to default.`);
        }
        // 2. Fallback to the first image in the vault
        if (imageFiles.length > 0) {
            pathToLoad = imageFiles[0].path;
        }
    }
    
    setSelectedVaultFilePath(pathToLoad);
    // If we are loading a specific image, ensure the source is 'vault'
    if (pathToLoad) {
      setImageSource('vault');
    }

  }, []); // Run once on mount

  // --- Effect for Blob URL Cleanup on Unmount / Change ---
  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
        currentBlobUrl.current = null;
      }
    };
  }, [imagePreviewUrl]);

  // --- Effect to Handle Vault File Selection & Preview ---
  useEffect(() => {
    const updateVaultImage = async () => {
        if (selectedVaultFilePath && imageSource === 'vault') {
            const file = dc.app.vault.getAbstractFileByPath(selectedVaultFilePath);
            if (file && typeof file.extension === 'string') {
                setSelectedVaultTFile(file);
                try {
                    const arrayBuffer = await dc.app.vault.readBinary(file);
                    const blob = new Blob([arrayBuffer], { type: `image/${file.extension}` });
                    const url = URL.createObjectURL(blob);
                    if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
                    currentBlobUrl.current = url;
                    setImagePreviewUrl(url);
                    console.log(`Generated preview for vault file ${file.path}: ${url}`);
                } catch (err) {
                    console.error(`Failed to generate preview for vault file (${file.path}):`, err);
                    setImagePreviewUrl(null);
                }
            } else {
                setSelectedVaultTFile(null);
                setImagePreviewUrl(null);
            }
            // Clear custom file states when switching back to vault
            setCustomFile(null);
            setTempVaultFilePath(null);
            setTempVaultTFile(null);
            setOcrText("");
            setError(null);
            setIsLoading(false);
        }
    };
    updateVaultImage();
  }, [selectedVaultFilePath, imageSource, dc.app.vault]);

  // --- Effect to Handle Custom File Upload & Temporary Vault File Creation ---
  useEffect(() => {
    const createTempVaultFile = async () => {
        if (customFile && imageSource === 'custom') {
            setIsLoading(true);
            setError(null);
            setOcrText("");
            setTempVaultTFile(null);
            setTempVaultFilePath(null);

            const timestamp = Date.now();
            const uniqueFilename = `temp_ocr_${timestamp}.${customFile.name.split('.').pop()}`;
            const tempDir = '.datacore/temp_ocr_images';
            const fullTempPath = `${tempDir}/${uniqueFilename}`;

            try {
                if (!(await dc.app.vault.adapter.exists(tempDir))) {
                    await dc.app.vault.adapter.mkdir(tempDir);
                    console.log(`Created temp OCR image directory: ${tempDir}`);
                }
                const arrayBuffer = await customFile.arrayBuffer();
                const newTFile = await dc.app.vault.createBinaryFile(fullTempPath, arrayBuffer);
                console.log(`Created temporary vault file: ${newTFile.path}`);
                setTempVaultFilePath(newTFile.path);
                setTempVaultTFile(newTFile);
                const url = URL.createObjectURL(customFile);
                if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
                currentBlobUrl.current = url;
                setImagePreviewUrl(url);
                console.log(`Generated preview for custom file ${customFile.name}: ${url}`);
            } catch (err) {
                console.error("Failed to create temporary vault file for custom image:", err);
                setError(`Could not process custom image: ${err.message}.`);
                setImagePreviewUrl(null);
                setTempVaultFilePath(null);
                setTempVaultTFile(null);
            } finally {
                setIsLoading(false);
                setSelectedVaultFilePath('');
                setSelectedVaultTFile(null);
            }
        }
    };
    createTempVaultFile();
  }, [customFile, imageSource, dc.app.vault]);


  // --- Event Handlers ---
  const handleSourceChange = (event) => {
    setImageSource(event.target.value);
    setOcrText("");
    setError(null);
    setIsLoading(false);
  };

  const handleVaultFileChange = (event) => {
    setSelectedVaultFilePath(event.target.value);
  };

  const handleCustomFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCustomFile(file);
    } else {
      setCustomFile(null);
      setImagePreviewUrl(null);
      setTempVaultFilePath(null);
      setTempVaultTFile(null);
      setOcrText("");
      setError(null);
      setIsLoading(false);
    }
  };

  // Function to perform OCR using Text Extractor plugin
  const performOcr = async () => {
    if (!textExtractorApi) {
      setError("Text Extractor plugin API is not available.");
      return;
    }

    let fileToOcr = null;
    if (imageSource === 'vault' && selectedVaultTFile) {
        fileToOcr = selectedVaultTFile;
    } else if (imageSource === 'custom' && tempVaultTFile) {
        fileToOcr = tempVaultTFile;
    }

    if (!fileToOcr) {
      setError("No valid image file selected for OCR.");
      return;
    }

    setIsLoading(true);
    setOcrText("");
    setError(null);
    setProgress(0);

    try {
      console.log(`Attempting to extract text from: ${fileToOcr.path}`);
      const text = await textExtractorApi.extractText(fileToOcr);

      if (text && text.trim().length > 0) {
        setOcrText(text);
        console.log("Text extracted successfully.");
      } else {
        setOcrText("No text recognized from this image.");
        console.warn("Text Extractor recognized no text or only whitespace.");
      }

    } catch (err) {
      console.error("Text Extraction Error:", err);
      setError(`Failed to extract text: ${err.message || "Unknown error"}. Ensure the file is supported and not corrupted.`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Determine button disabled state and text
  const isButtonDisabled = isLoading || !textExtractorApi ||
                          (imageSource === 'vault' && !selectedVaultTFile) ||
                          (imageSource === 'custom' && !tempVaultTFile);

  const buttonText = isLoading
    ? "Extracting Text..."
    : !textExtractorApi
      ? "Text Extractor Plugin Not Ready"
      : "Extract Text";

  // Get all image files in the vault for the dropdown
  const allVaultImageFiles = dc.app.vault.getFiles().filter(file => {
      const ext = file.extension.toLowerCase();
      return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
  }).sort((a, b) => a.path.localeCompare(b.path));


  return (
    <div
      style={{
        height: "88vh",
        width: "100%",
        padding: "10px",
        border: "2px solid var(--interactive-accent-rgb, 2px solid white)",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        overflow: "auto",
        backgroundColor: "var(--background-secondary)",
        color: "var(--text-normal)",
      }}
    >
      <h2 style={{ margin: "0", paddingBottom: "5px", borderBottom: "1px solid var(--background-modifier-border)" }}>Vault Image OCR (Text Extractor)</h2>

      {pluginError && (
        <p style={{ color: "var(--text-error)", backgroundColor: "var(--background-modifier-error)", padding: "10px", borderRadius: "5px", border: "1px solid var(--text-error)" }}>
          <strong>Plugin Error:</strong> {pluginError}
        </p>
      )}

      <p style={{ color: "var(--text-faint)", fontSize: "0.9em", margin: "0" }}>
        OCR Language: Configured in <span style={{ color: "var(--interactive-accent)", cursor: "pointer" }} onClick={() => app.setting.open()}>Obsidian Settings</span> > Community Plugins > Text Extractor.
      </p>

      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>Image Source:</label>
        <select
          onChange={handleSourceChange}
          value={imageSource}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "4px",
            backgroundColor: "var(--background-primary)",
            color: "var(--text-normal)",
            marginBottom: "10px"
          }}
        >
          <option value="vault">From Vault</option>
          <option value="custom">Upload Custom File</option>
        </select>
      </div>

      {imageSource === 'vault' && (
        <div>
          <label htmlFor="ocr-file-select" style={{ display: "block", marginBottom: "5px" }}>
            Select an image from your vault:
          </label>
          {allVaultImageFiles.length > 0 ? (
            <select
              id="ocr-file-select"
              onChange={handleVaultFileChange}
              value={selectedVaultFilePath}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--background-modifier-border)",
                borderRadius: "4px",
                backgroundColor: "var(--background-primary)",
                color: "var(--text-normal)",
              }}
            >
              {allVaultImageFiles.map(file => (
                <option key={file.path} value={file.path}>
                  {file.path}
                </option>
              ))}
            </select>
          ) : (
            <p style={{ color: "var(--text-faint)" }}>No image files found in your vault. Please add some to your vault.</p>
          )}
        </div>
      )}

      {imageSource === 'custom' && (
        <div>
          <label htmlFor="ocr-custom-file-upload" style={{ display: "block", marginBottom: "5px" }}>
            Upload a custom image:
          </label>
          <input
            id="ocr-custom-file-upload"
            type="file"
            accept="image/*"
            onChange={handleCustomFileChange}
            disabled={isLoading}
            style={{ width: "100%", padding: "8px", border: "1px solid var(--background-modifier-border)", borderRadius: "4px", backgroundColor: "var(--background-primary)", color: "var(--text-normal)" }}
          />
          {customFile && <p style={{ color: "var(--text-faint)", fontSize: "0.9em", marginTop: "5px" }}>Selected: {customFile.name}</p>}
          {tempVaultFilePath && <p style={{ color: "var(--text-faint)", fontSize: "0.9em", marginTop: "5px" }}>Temp Vault Path: {tempVaultFilePath}</p>}
        </div>
      )}

      {imagePreviewUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
          <h3>Preview:</h3>
          <img
            src={imagePreviewUrl}
            alt="Image for OCR"
            style={{
              maxWidth: "100%",
              maxHeight: "200px",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "4px",
              objectFit: "contain",
            }}
          />
          <button
            onClick={performOcr}
            disabled={isButtonDisabled}
            style={{
              padding: "10px 20px",
              backgroundColor: isButtonDisabled ? "var(--background-modifier-button-hover)" : "var(--interactive-accent)",
              color: "var(--text-on-accent)",
              border: "none",
              borderRadius: "5px",
              cursor: isButtonDisabled ? "not-allowed" : "pointer",
              fontSize: "1rem",
              marginTop: "10px",
              opacity: isButtonDisabled ? 0.7 : 1,
            }}
          >
            {buttonText}
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: "var(--text-error)", backgroundColor: "var(--background-modifier-error)", padding: "10px", borderRadius: "5px", border: "1px solid var(--text-error)" }}>
          <strong>Extraction Error:</strong> {error}
        </p>
      )}

      {isLoading && (
        <p style={{ color: "var(--text-faint)", fontSize: "0.9em", margin: "0" }}>
          Status: {buttonText}
        </p>
      )}

      {ocrText && (
        <div>
          <h3>Extracted Text:</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              border: "1px solid var(--background-modifier-border)",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: "var(--background-modifier-box-shadow)",
              color: "var(--text-normal)",
              minHeight: "100px",
              maxHeight: "25vh",
              overflowY: "auto",
            }}
          >
            {ocrText}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(ocrText)}
            style={{
              padding: "8px 15px",
              backgroundColor: "var(--background-modifier-success)",
              color: "var(--text-on-accent)",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "0.9rem",
              marginTop: "5px",
            }}
          >
            Copy Text
          </button>
        </div>
      )}
    </div>
  );
}

// Pass the configured initial image path to the component when exporting.
// This is how the component receives the value defined at the top of the file.
return {
  BasicView: () => <BasicView initialImagePath={INITIAL_IMAGE_PATH_TO_LOAD} />
};
```


