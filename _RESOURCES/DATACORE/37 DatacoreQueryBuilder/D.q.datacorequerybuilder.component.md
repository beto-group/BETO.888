



# ViewComponent

```jsx
const { useState, useEffect, useMemo, useRef } = dc;

// =====================================================================
// UTILITY & RENDERER COMPONENTS
// =====================================================================

function jsonReplacer(key, value) {
  if (
    key === "$parent" ||
    key === "$sections" ||
    key === "$blocks" ||
    key === "file"
  ) {
    if (value && value.$path) return `[Reference to ${value.$path}]`;
    return `[Circular Reference]`;
  }
  if (value && value.isLuxonDateTime) return value.toISO();
  return value;
}

function ResultItem({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const getDisplayName = (data) => {
    if (typeof data !== "object" || data === null) return String(data);
    if (data.$name) return String(data.$name);
    if (data.text) {
      const text = String(data.text);
      return text.length > 80 ? text.substring(0, 77) + "..." : text;
    }
    if (data.file?.path) return data.file.path;
    return "Untitled Item";
  };
  const displayName = getDisplayName(item);
  const itemStyles = {
    container: {
      padding: "10px 12px",
      borderBottom: "1px solid #1a1a1a",
      backgroundColor: "#0a0a0a",
      color: "#ffffff",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
    },
    name: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      marginRight: "10px",
    },
    buttonContainer: { display: "flex", gap: "8px", flexShrink: 0 },
    button: {
      padding: "2px 8px",
      backgroundColor: "#1a1a1a",
      border: "1px solid #9b87f5",
      borderRadius: "3px",
      color: "#ffffff",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    pre: {
      marginTop: "8px",
      backgroundColor: "#000000",
      padding: "10px",
      borderRadius: "4px",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
      maxHeight: "300px",
      overflow: "auto",
      border: "1px solid #1a1a1a",
      userSelect: "text",
      cursor: "text",
    },
    fieldsHeader: {
      fontSize: "12px",
      color: "#9b87f5",
      marginTop: "12px",
      marginBottom: "4px",
      fontFamily: "monospace",
    },
  };
  const fields = useMemo(() => {
    if (!showFields || typeof item.fields !== "function") return null;
    try {
      return item.fields();
    } catch (e) {
      console.error("Failed to call item.fields()", e);
      return [{ key: "Error", value: "Could not load fields." }];
    }
  }, [showFields, item]);

  return (
    <div style={itemStyles.container}>
      <div style={itemStyles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={itemStyles.name} title={displayName}>
          {displayName}
        </span>
        <div style={itemStyles.buttonContainer}>
          {typeof item.fields === "function" && (
            <button
              style={itemStyles.button}
              onClick={(e) => {
                e.stopPropagation();
                setShowFields(!showFields);
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#9b87f5";
                e.currentTarget.style.color = "#000000";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
                e.currentTarget.style.color = "#ffffff";
              }}
            >
              <dc.Icon
                icon={showFields ? "eye-off" : "eye"}
                style={{ fontSize: "12px" }}
              />
              {showFields ? "Hide Fields" : "Show Fields"}
            </button>
          )}
          <button
            style={itemStyles.button}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#9b87f5";
              e.currentTarget.style.color = "#000000";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#1a1a1a";
              e.currentTarget.style.color = "#ffffff";
            }}
          >
            <dc.Icon
              icon={isExpanded ? "chevron-up" : "chevron-down"}
              style={{ fontSize: "12px" }}
            />
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      {showFields && fields && (
        <div>
          <h4 style={itemStyles.fieldsHeader}>
            Available Fields (via item.fields()):
          </h4>
          <pre style={itemStyles.pre}>
            <code>
              {JSON.stringify(
                fields,
                (k, v) => (k === "$parent" ? "[Ref]" : v),
                2
              )}
            </code>
          </pre>
        </div>
      )}
      {isExpanded && (
        <div>
          <h4 style={itemStyles.fieldsHeader}>Raw Data Object:</h4>
          <pre style={itemStyles.pre}>
            <code>{JSON.stringify(item, jsonReplacer, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// HELPER COMPONENTS
// =====================================================================

function TagHelper({ searchTerm, onTagSelect }) {
  const [allTags, setAllTags] = useState(null);
  useEffect(() => {
    try {
      const pages = dc.api.query("@page");
      const tagSet = new Set();
      for (const note of pages) {
        for (const rawTag of note.$tags || []) {
          tagSet.add(rawTag.replace(/^#/, ""));
        }
      }
      setAllTags(Array.from(tagSet).sort());
    } catch (e) {
      console.error("Datacore Explorer: Failed to fetch tags.", e);
      setAllTags([]);
    }
  }, []);
  const filteredTags = useMemo(() => {
    if (allTags === null) return null;
    if (!searchTerm) return allTags;
    return allTags.filter((tag) =>
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTags, searchTerm]);
  const styles = {
    container: {
      backgroundColor: "#0a0a0a",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #9b87f5",
    },
    list: { maxHeight: "150px", overflowY: "auto", paddingRight: "5px" },
    button: {
      width: "100%",
      textAlign: "left",
      padding: "4px 8px",
      border: "none",
      background: "none",
      color: "#ffffff",
      cursor: "pointer",
      borderRadius: "3px",
      marginBottom: "2px",
      fontFamily: "monospace",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    hover: { backgroundColor: "#1a1a1a", color: "#9b87f5" },
    message: {
      color: "#9b87f5",
      fontSize: "12px",
      textAlign: "center",
      margin: "5px 0",
    },
  };
  return (
    <div style={styles.container}>
      {" "}
      <div style={styles.list}>
        {" "}
        {filteredTags === null ? (
          <p style={styles.message}>Loading tags...</p>
        ) : filteredTags.length > 0 ? (
          filteredTags.map((tag) => (
            <button
              key={tag}
              style={styles.button}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  styles.hover.backgroundColor;
                e.currentTarget.style.color = styles.hover.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#ffffff";
              }}
              onClick={() => onTagSelect(tag)}
            >
              <dc.Icon icon="hash" style={{ fontSize: "12px" }} />
              {tag}
            </button>
          ))
        ) : (
          <p style={styles.message}>
            {searchTerm ? "No tags match." : "No tags found."}
          </p>
        )}{" "}
      </div>{" "}
    </div>
  );
}
function FolderHelper({ searchTerm, onFolderSelect }) {
  const [allFolders, setAllFolders] = useState(null);
  useEffect(() => {
    try {
      const pages = dc.api.query("@page");
      const folderSet = new Set();
      for (const page of pages) {
        const path = page.$path;
        const lastSlashIndex = path.lastIndexOf("/");
        if (lastSlashIndex > -1)
          folderSet.add(path.substring(0, lastSlashIndex));
      }
      setAllFolders(Array.from(folderSet).sort());
    } catch (e) {
      console.error("Datacore Explorer: Failed to fetch folders.", e);
      setAllFolders([]);
    }
  }, []);
  const filteredFolders = useMemo(() => {
    if (allFolders === null) return null;
    if (!searchTerm) return allFolders;
    return allFolders.filter((folder) =>
      folder.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFolders, searchTerm]);
  const styles = {
    container: {
      backgroundColor: "#0a0a0a",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #9b87f5",
    },
    list: { maxHeight: "150px", overflowY: "auto", paddingRight: "5px" },
    button: {
      width: "100%",
      textAlign: "left",
      padding: "4px 8px",
      border: "none",
      background: "none",
      color: "#ffffff",
      cursor: "pointer",
      borderRadius: "3px",
      marginBottom: "2px",
      fontFamily: "monospace",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    hover: { backgroundColor: "#1a1a1a", color: "#9b87f5" },
    message: {
      color: "#9b87f5",
      fontSize: "12px",
      textAlign: "center",
      margin: "5px 0",
    },
  };
  return (
    <div style={styles.container}>
      {" "}
      <div style={styles.list}>
        {" "}
        {filteredFolders === null ? (
          <p style={styles.message}>Loading folders...</p>
        ) : filteredFolders.length > 0 ? (
          filteredFolders.map((folder) => (
            <button
              key={folder}
              style={styles.button}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  styles.hover.backgroundColor;
                e.currentTarget.style.color = styles.hover.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#ffffff";
              }}
              onClick={() => onFolderSelect(folder)}
            >
              <dc.Icon icon="folder" style={{ fontSize: "12px" }} />
              {folder}
            </button>
          ))
        ) : (
          <p style={styles.message}>
            {searchTerm ? "No folders match." : "No folders found."}
          </p>
        )}{" "}
      </div>{" "}
    </div>
  );
}
function FileHelper({ searchTerm, onFileSelect }) {
  const [allFiles, setAllFiles] = useState(null);
  useEffect(() => {
    try {
      const pages = dc.api.query("@page");
      setAllFiles(pages.map((p) => p.$path).sort());
    } catch (e) {
      console.error("Datacore Explorer: Failed to fetch files.", e);
      setAllFiles([]);
    }
  }, []);
  const filteredFiles = useMemo(() => {
    if (allFiles === null) return null;
    if (!searchTerm) return allFiles;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allFiles.filter((file) =>
      file.toLowerCase().includes(lowerCaseSearch)
    );
  }, [allFiles, searchTerm]);
  const styles = {
    container: {
      backgroundColor: "#0a0a0a",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #9b87f5",
    },
    list: { maxHeight: "150px", overflowY: "auto", paddingRight: "5px" },
    button: {
      width: "100%",
      textAlign: "left",
      padding: "4px 8px",
      border: "none",
      background: "none",
      color: "#ffffff",
      cursor: "pointer",
      borderRadius: "3px",
      marginBottom: "2px",
      fontFamily: "monospace",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    hover: { backgroundColor: "#1a1a1a", color: "#9b87f5" },
    message: {
      color: "#9b87f5",
      fontSize: "12px",
      textAlign: "center",
      margin: "5px 0",
    },
  };
  return (
    <div style={styles.container}>
      <div style={styles.list}>
        {filteredFiles === null ? (
          <p style={styles.message}>Loading files...</p>
        ) : filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <button
              key={file}
              style={styles.button}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  styles.hover.backgroundColor;
                e.currentTarget.style.color = styles.hover.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#ffffff";
              }}
              onClick={() => onFileSelect(file)}
            >
              <dc.Icon icon="file-text" style={{ fontSize: "12px" }} />
              {file}
            </button>
          ))
        ) : (
          <p style={styles.message}>
            {searchTerm ? "No files match." : "No files found."}
          </p>
        )}
      </div>
    </div>
  );
}
function GenericPropertyHelper({ searchTerm, onPropertySelect }) {
  const [allProperties, setAllProperties] = useState(null);
  const intrinsicFields = [
    "$path",
    "$ctime",
    "$mtime",
    "$extension",
    "$size",
    "$position",
    "$lineCount",
    "$name",
    "$link",
    "$tags",
    "$sections",
    "$frontmatter",
    "$infields",
    "$ordinal",
    "$title",
    "$level",
    "$type",
    "$blockId",
    "$completed",
    "$status",
    "$languages",
    "$elements",
    "$text",
    "$cleantext",
    "$parentLine",
    "$symbol",
    "$links",
  ];
  useEffect(() => {
    try {
      const allItems = dc.api.query("@page OR @task");
      const propertySet = new Set();
      intrinsicFields.forEach((f) => propertySet.add(f));
      const ignoredKeys = new Set(["$parent", "$blocks", "file"]);
      for (const item of allItems) {
        for (const key of Object.keys(item)) {
          if (!ignoredKeys.has(key) && !key.startsWith("$"))
            propertySet.add(key);
        }
        if (item.$frontmatter && typeof item.$frontmatter === "object") {
          for (const key of Object.keys(item.$frontmatter)) {
            if (!ignoredKeys.has(key)) propertySet.add(key);
          }
        }
      }
      setAllProperties(
        Array.from(propertySet).sort((a, b) => {
          const aIntrinsic = a.startsWith("$");
          const bIntrinsic = b.startsWith("$");
          if (aIntrinsic && !bIntrinsic) return -1;
          if (!aIntrinsic && bIntrinsic) return 1;
          return a.localeCompare(b);
        })
      );
    } catch (e) {
      console.error("Datacore Explorer: Failed to fetch properties.", e);
      setAllProperties([]);
    }
  }, []);
  const filteredProperties = useMemo(() => {
    if (allProperties === null) return null;
    if (!searchTerm) return allProperties;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allProperties.filter((prop) =>
      prop.toLowerCase().includes(lowerCaseSearch)
    );
  }, [allProperties, searchTerm]);
  const styles = {
    container: {
      backgroundColor: "#0a0a0a",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #9b87f5",
    },
    list: { maxHeight: "150px", overflowY: "auto", paddingRight: "5px" },
    button: {
      width: "100%",
      textAlign: "left",
      padding: "4px 8px",
      border: "none",
      background: "none",
      color: "#ffffff",
      cursor: "pointer",
      borderRadius: "3px",
      marginBottom: "2px",
      fontFamily: "monospace",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    hover: { backgroundColor: "#1a1a1a", color: "#9b87f5" },
    message: {
      color: "#9b87f5",
      fontSize: "12px",
      textAlign: "center",
      margin: "5px 0",
    },
  };
  return (
    <div style={styles.container}>
      {" "}
      <div style={styles.list}>
        {" "}
        {filteredProperties === null ? (
          <p style={styles.message}>Loading fields...</p>
        ) : filteredProperties.length > 0 ? (
          filteredProperties.map((prop) => (
            <button
              key={prop}
              style={styles.button}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  styles.hover.backgroundColor;
                e.currentTarget.style.color = styles.hover.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#ffffff";
              }}
              onClick={() => onPropertySelect(prop)}
            >
              {" "}
              <dc.Icon
                icon={prop.startsWith("$") ? "zap" : "key"}
                style={{ fontSize: "12px" }}
              /> {prop}{" "}
            </button>
          ))
        ) : (
          <p style={styles.message}>
            {searchTerm ? "No fields match." : "No fields found."}
          </p>
        )}{" "}
      </div>{" "}
    </div>
  );
}
function ComparisonOperatorHelper({ onOperatorSelect, fieldName }) {
  const arrayFields = [
    "$tags",
    "tags",
    "$links",
    "links",
    "$sections",
    "sections",
    "$elements",
    "elements",
    "$languages",
    "languages",
    "$infields",
    "infields",
  ];
  const dateFields = ["$ctime", "$mtime", "ctime", "mtime"];
  const isArrayField = arrayFields.includes(fieldName);
  const isDateField = dateFields.includes(fieldName);
  let operators;
  let message;
  if (isArrayField) {
    operators = [".contains"];
    message = `Array field: use .contains() to check if array contains a value`;
  } else if (isDateField) {
    operators = ["==", "!=", ">", ">=", "<", "<="];
    message = `Date field: use comparison operators (avoid .contains())`;
  } else {
    operators = ["==", "!=", ">", ">=", "<", "<=", ".contains"];
    message = `Select an operator or method:`;
  }
  const styles = {
    container: {
      backgroundColor: "#0a0a0a",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #9b87f5",
    },
    list: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      justifyContent: "center",
    },
    button: {
      padding: "4px 10px",
      border: "1px solid #9b87f5",
      background: "#1a1a1a",
      color: "#ffffff",
      cursor: "pointer",
      borderRadius: "3px",
      fontFamily: "monospace",
      fontSize: "14px",
      transition: "all 0.2s",
    },
    hover: { backgroundColor: "#9b87f5", color: "#000000" },
    message: {
      color: "#9b87f5",
      fontSize: "12px",
      textAlign: "center",
      margin: "5px 0",
      width: "100%",
    },
  };
  return (
    <div style={styles.container}>
      {" "}
      <p style={styles.message}>{message}</p> <div style={styles.list}>
        {" "}
        {operators.map((op) => (
          <button
            key={op}
            style={styles.button}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                styles.hover.backgroundColor;
              e.currentTarget.style.color = styles.hover.color;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = styles.button.background;
              e.currentTarget.style.color = styles.button.color;
            }}
            onClick={() => onOperatorSelect(op)}
          >
            {op}
          </button>
        ))}{" "}
      </div>{" "}
    </div>
  );
}
function AISettingsModal({
  onClose,
  onSave,
  currentProvider,
  currentApiKey,
  isInline = false,
}) {
  const [provider, setProvider] = useState(currentProvider || "gemini");
  const [apiKey, setApiKey] = useState(currentApiKey || "");
  const [isSaving, setIsSaving] = useState(false);
  const providers = [
    {
      id: "gemini",
      name: "Google Gemini",
      model: "gemini-2.0-flash-exp",
      icon: "sparkles",
      placeholder: "Enter your Gemini API key",
      docs: "https://ai.google.dev/gemini-api/docs/api-key",
    },
    {
      id: "openai",
      name: "OpenAI",
      model: "gpt-4o",
      icon: "bot",
      placeholder: "Enter your OpenAI API key (sk-...)",
      docs: "https://platform.openai.com/api-keys",
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      model: "claude-3-5-sonnet-20241022",
      icon: "brain",
      placeholder: "Enter your Anthropic API key (sk-ant-...)",
      docs: "https://console.anthropic.com/settings/keys",
    },
    {
      id: "groq",
      name: "Groq",
      model: "llama-3.3-70b-versatile",
      icon: "zap",
      placeholder: "Enter your Groq API key (gsk_...)",
      docs: "https://console.groq.com/keys",
    },
  ];
  const selectedProvider = providers.find((p) => p.id === provider);
  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert("Please enter an API key");
      return;
    }
    setIsSaving(true);
    await onSave(provider, apiKey.trim());
    setIsSaving(false);
  };
  const styles = {
    overlay: {
      position: isInline ? "absolute" : "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isInline ? "rgba(0,0,0,0.95)" : "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: isInline ? 100 : 10000,
    },
    modal: {
      backgroundColor: "#0a0a0a",
      border: "2px solid #9b87f5",
      borderRadius: "8px",
      padding: isInline ? "20px" : "24px",
      maxWidth: isInline ? "90%" : "500px",
      width: isInline ? "90%" : "90%",
      maxHeight: isInline ? "80%" : "90vh",
      overflowY: "auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    title: {
      margin: 0,
      color: "#ffffff",
      fontSize: "20px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    closeBtn: {
      background: "none",
      border: "none",
      color: "#9b87f5",
      fontSize: "24px",
      cursor: "pointer",
      padding: "4px 8px",
    },
    section: { marginBottom: "20px" },
    label: {
      display: "block",
      color: "#9b87f5",
      fontSize: "14px",
      fontWeight: "bold",
      marginBottom: "8px",
    },
    providerGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: "10px",
      marginBottom: "20px",
    },
    providerCard: {
      padding: "16px",
      backgroundColor: "#1a1a1a",
      border: "2px solid #2d2d2d",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.2s",
      textAlign: "center",
    },
    providerCardActive: { borderColor: "#9b87f5", backgroundColor: "#2d1f3d" },
    providerIcon: { fontSize: "32px", marginBottom: "8px" },
    providerName: { fontSize: "13px", color: "#ffffff", fontWeight: "bold" },
    providerModel: { fontSize: "10px", color: "#9b87f5", marginTop: "4px" },
    input: {
      width: "100%",
      padding: "10px",
      backgroundColor: "#1a1a1a",
      border: "1px solid #9b87f5",
      borderRadius: "4px",
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: "13px",
      boxSizing: "border-box",
    },
    helperText: {
      fontSize: "11px",
      color: "#666",
      marginTop: "6px",
      lineHeight: "1.4",
    },
    link: { color: "#9b87f5", textDecoration: "underline", cursor: "pointer" },
    buttonGroup: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "24px",
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#9b87f5",
      border: "none",
      borderRadius: "4px",
      color: "#000000",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: "14px",
    },
    cancelButton: {
      backgroundColor: "#1a1a1a",
      color: "#ffffff",
      border: "1px solid #9b87f5",
    },
  };
  return (
    <div style={styles.overlay} onClick={onClose}>
      {" "}
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {" "}
        <div style={styles.header}>
          {" "}
          <h3 style={styles.title}>
            <dc.Icon icon="settings" style={{ fontSize: "20px" }} />
            AI Provider Settings
          </h3> <button style={styles.closeBtn} onClick={onClose}>
            ×
          </button>{" "}
        </div> <div style={styles.section}>
          {" "}
          <label style={styles.label}>Select AI Provider:</label> <div
            style={styles.providerGrid}
          >
            {" "}
            {providers.map((p) => (
              <div
                key={p.id}
                style={{
                  ...styles.providerCard,
                  ...(provider === p.id ? styles.providerCardActive : {}),
                }}
                onClick={() => setProvider(p.id)}
              >
                {" "}
                <div style={styles.providerIcon}>
                  <dc.Icon icon={p.icon} />
                </div> <div style={styles.providerName}>{p.name}</div> <div
                  style={styles.providerModel}
                >
                  {p.model}
                </div>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </div> <div style={styles.section}>
          {" "}
          <label style={styles.label}>
            API Key for {selectedProvider.name}:
          </label> <input
            type="password"
            style={styles.input}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={selectedProvider.placeholder}
          /> <div style={styles.helperText}>
            {" "}
            Get your API key from <a
              style={styles.link}
              href={selectedProvider.docs}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.open(selectedProvider.docs);
              }}
            >
              {" "}
              {selectedProvider.name} Dashboard{" "}
            </a>{" "}
          </div>{" "}
        </div> <div style={styles.buttonGroup}>
          {" "}
          <button
            style={{ ...styles.button, ...styles.cancelButton }}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button> <button
            style={styles.button}
            onClick={handleSave}
            disabled={isSaving}
          >
            {" "}
            {isSaving ? "Saving..." : "Save & Continue"}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}

function AIQueryAssistant({
  onQueryGenerated,
  onClose,
  currentQuery,
  isDrawerMode = false,
}) {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-1.5-flash-latest");
  const [apiKey, setApiKey] = useState(null);
  const [learnings, setLearnings] = useState([]);
  const [systemPromptAdditions, setSystemPromptAdditions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const chatContainerRef = useRef(null);
  const PROVIDER_MODELS = {
    gemini: [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro-latest",
      "gemini-2.0-flash-exp",
    ],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    anthropic: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
    groq: [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
  };
  const currentPath = dc.useCurrentPath();
  const getHelperDir = () => {
    if (!currentPath) return null;
    const dirPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    return `${dirPath}/_resources/prompt_helper`;
  };
  const SECRET_DIR = ".datacore/chatllm/.secret/";
  const PROVIDER_SETTINGS_FILE =
    ".datacore/datacorequery/provider_settings.json";
  const getLearningsFile = () => {
    const helperDir = getHelperDir();
    return helperDir
      ? `${helperDir}/query_learnings.json`
      : ".datacore/datacorequery/query_learnings.json";
  };
  const getSystemAdditionsFile = () => {
    const helperDir = getHelperDir();
    return helperDir
      ? `${helperDir}/datacore_query_knowledge.md`
      : ".datacore/datacorequery/system_prompt_additions.json";
  };
  useEffect(() => {
    const loadProviderAndKey = async () => {
      try {
        if (await app.vault.adapter.exists(PROVIDER_SETTINGS_FILE)) {
          const settings = JSON.parse(
            await app.vault.adapter.read(PROVIDER_SETTINGS_FILE)
          );
          const savedProvider = settings.provider || "gemini";
          const savedModel =
            settings.model ||
            (PROVIDER_MODELS[savedProvider]
              ? PROVIDER_MODELS[savedProvider][0]
              : "gemini-1.5-flash-latest");
          setProvider(savedProvider);
          setModel(savedModel);
          const keyPath = SECRET_DIR + `${savedProvider}_api_key.txt`;
          if (await app.vault.adapter.exists(keyPath)) {
            const key = (await app.vault.adapter.read(keyPath)).trim();
            setApiKey(key);
            console.log(
              "Loaded API key for provider:",
              savedProvider,
              "Key length:",
              key.length
            );
          } else {
            console.log("No API key found at:", keyPath);
            setShowSettings(true);
          }
        } else {
          console.log("No provider settings file found");
          setShowSettings(true);
        }
      } catch (e) {
        console.error("Failed to load provider settings:", e);
        setShowSettings(true);
      }
    };
    loadProviderAndKey();
    const loadLearnings = async () => {
      const learningsFile = getLearningsFile();
      if (!learningsFile) return;
      if (await app.vault.adapter.exists(learningsFile)) {
        try {
          setLearnings(JSON.parse(await app.vault.adapter.read(learningsFile)));
        } catch (e) {
          console.error("Failed to load learnings:", e);
        }
      }
    };
    const loadSystemAdditions = async () => {
      const additionsFile = getSystemAdditionsFile();
      if (!additionsFile) return;
      if (await app.vault.adapter.exists(additionsFile)) {
        try {
          const content = await app.vault.adapter.read(additionsFile);
          const lines = content
            .split("\n")
            .filter((line) => line.trim() && !line.startsWith("#"));
          const additions = lines.map((line) => {
            const match = line.match(/^\[([^\]]+)\]\s*(.+)$/);
            if (match) {
              return {
                content: match[2].trim(),
                category: match[1].toLowerCase(),
                timestamp: Date.now(),
              };
            }
            return {
              content: line,
              category: "general",
              timestamp: Date.now(),
            };
          });
          setSystemPromptAdditions(additions);
        } catch (e) {
          console.error("Failed to load system additions:", e);
        }
      }
    };
    loadProviderAndKey();
    loadLearnings();
    loadSystemAdditions();
  }, [currentPath]);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showModelSelector && !e.target.closest("[data-model-selector]")) {
        setShowModelSelector(false);
      }
    };
    if (showModelSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModelSelector]);
  const saveLearning = async (userQuery, generatedQuery, feedback) => {
    const newLearning = {
      timestamp: Date.now(),
      userQuery,
      generatedQuery,
      feedback,
      success: feedback === "positive",
    };
    const updatedLearnings = [...learnings, newLearning];
    try {
      const learningsFile = getLearningsFile();
      if (!learningsFile) return;
      const helperDir = getHelperDir();
      if (helperDir && !(await app.vault.adapter.exists(helperDir))) {
        await app.vault.adapter.mkdir(helperDir);
      }
      await app.vault.adapter.write(
        learningsFile,
        JSON.stringify(updatedLearnings, null, 2)
      );
      setLearnings(updatedLearnings);
    } catch (e) {
      console.error("Failed to save learning:", e);
    }
  };
  const saveSystemAddition = async (addition) => {
    const newAddition = {
      timestamp: Date.now(),
      content: addition,
      category: detectCategory(addition),
    };
    const updatedAdditions = [...systemPromptAdditions, newAddition];
    try {
      const additionsFile = getSystemAdditionsFile();
      if (!additionsFile) return;
      const helperDir = getHelperDir();
      if (helperDir && !(await app.vault.adapter.exists(helperDir))) {
        await app.vault.adapter.mkdir(helperDir);
      }
      const lines = updatedAdditions.map(
        (add) => `[${add.category.toUpperCase()}] ${add.content}`
      );
      const content = `# Datacore Query Knowledge Base\n\n` + lines.join("\n");
      await app.vault.adapter.write(additionsFile, content);
      setSystemPromptAdditions(updatedAdditions);
    } catch (e) {
      console.error("Failed to save system addition:", e);
    }
  };
  const detectCategory = (text) => {
    const lower = text.toLowerCase();
    if (
      lower.includes("cannot") ||
      lower.includes("not support") ||
      lower.includes("limitation")
    )
      return "limitations";
    if (lower.includes("error") || lower.includes("issue")) return "errors";
    if (
      lower.includes("should") ||
      lower.includes("must") ||
      lower.includes("rule")
    )
      return "rules";
    return "general";
  };
  const extractAndSaveKnowledge = async (aiText) => {
    const limitationRegex = /\[LIMITATION:([^\]]+)\]/g;
    const ruleRegex = /\[RULE:([^\]]+)\]/g;
    const errorRegex = /\[ERROR:([^\]]+)\]/g;
    let match;
    while ((match = limitationRegex.exec(aiText)) !== null) {
      await saveSystemAddition(match[1].trim());
    }
    while ((match = ruleRegex.exec(aiText)) !== null) {
      await saveSystemAddition(match[1].trim());
    }
    while ((match = errorRegex.exec(aiText)) !== null) {
      await saveSystemAddition(match[1].trim());
    }
  };
  const buildSystemPrompt = () => {
    const basePrompt = `You are an expert Datacore query language assistant in a CONTINUOUS CONVERSATION. Remember the full context of our discussion.

RESPONSE MODES:
1. When user asks for a query directly: Respond conversationally AND provide the query in a code block
2. When discussing/explaining: Respond naturally and mark learnings:
   - [LIMITATION: text] for things Datacore cannot do
   - [RULE: text] for important rules discovered
   - [ERROR: text] for common mistakes identified

These markers are extracted and saved to improve future help. You are an expert Datacore query language assistant. Help users build queries for their Obsidian vault.

DATACORE QUERY LANGUAGE REFERENCE:

**Base Types:**
- @page - markdown pages
- @task - task items  
- @file - all files
- @section - sections
- @block - blocks
- @block-list - list blocks
- @codeblock - code blocks
- @datablock - YAML datablocks
- @list-item - list items

**Operators:**
- AND, OR, !not (NOT operator)
- ==, !=, >, >=, <, <= (comparison)
- .contains() - for arrays/strings

**Intrinsic Fields (use $ prefix):**
$path, $ctime, $mtime, $name, $tags, $title, $type, $completed, $status, $size, $extension, $links, $sections

**Functions:**
- path("folder/path") - items in folder
- exists(field) - items where field exists
- connected([[link]]) - connected items
- linkedto([[link]]) - items linking to
- linkedfrom([[link]]) - items linked from
- parentof(query) - parents of results
- childof(query) - children of results
- subtree(query) - item and descendants
- supertree(query) - item and ancestors

**Important Rules:**
1. Array fields ($tags, $links, $sections, etc.) MUST use .contains() not ==
2. Date fields ($ctime, $mtime) use comparison operators, NOT .contains()
3. String fields can use .contains() or ==
4. Combine with AND/OR, use !not for negation
5. For custom frontmatter fields without spaces, use field name directly
6. For fields with spaces, use row["field name"] syntax

**Examples:**
- Find pages with tag: @page AND $tags.contains("project")
- Recent incomplete tasks: @task AND $completed = false AND $ctime > date("2024-01-01")
- Pages in folder: @page AND path("Projects/Active")
- Items with rating: @page AND exists(rating) AND rating >= 7
- Connected items: @page AND connected([[My Note]])`;

    let additions = "";
    if (systemPromptAdditions.length > 0) {
      const byCategory = {};
      systemPromptAdditions.forEach((add) => {
        if (!byCategory[add.category]) byCategory[add.category] = [];
        byCategory[add.category].push(add.content);
      });
      additions = "\n\n**LEARNED KNOWLEDGE:**\n";
      for (const [cat, items] of Object.entries(byCategory)) {
        additions +=
          `\n*${cat.toUpperCase()}:*\n` +
          items.map((i) => `- ${i}`).join("\n") +
          "\n";
      }
    }
    const successfulExamples = learnings.filter((l) => l.success).slice(-5);
    if (successfulExamples.length > 0) {
      return (
        basePrompt +
        additions +
        `\n\n**LEARNED FROM USER (Recent Successful Queries):**\n` +
        successfulExamples
          .map((l) => `User: "${l.userQuery}"\nQuery: ${l.generatedQuery}`)
          .join("\n\n")
      );
    }
    return basePrompt + additions;
  };
  const saveProviderConfig = async (newProvider, newApiKey) => {
    try {
      if (!(await app.vault.adapter.exists(SECRET_DIR))) {
        await app.vault.adapter.mkdir(SECRET_DIR);
      }
      const keyPath = SECRET_DIR + `${newProvider}_api_key.txt`;
      await app.vault.adapter.write(keyPath, newApiKey);
      const datacoreDir = ".datacore/datacorequery";
      if (!(await app.vault.adapter.exists(datacoreDir))) {
        await app.vault.adapter.mkdir(datacoreDir);
      }
      const defaultModel = PROVIDER_MODELS[newProvider]
        ? PROVIDER_MODELS[newProvider][0]
        : "gemini-1.5-flash-latest";
      const providerSettings = {
        provider: newProvider,
        model: defaultModel,
        updated: Date.now(),
      };
      await app.vault.adapter.write(
        PROVIDER_SETTINGS_FILE,
        JSON.stringify(providerSettings, null, 2)
      );
      setProvider(newProvider);
      setModel(defaultModel);
      setApiKey(newApiKey);
      setShowSettings(false);
      console.log(
        "Saved provider config:",
        newProvider,
        "Model:",
        defaultModel,
        "Key length:",
        newApiKey.length
      );
    } catch (e) {
      console.error("Failed to save provider config:", e);
    }
  };
  const saveModelChange = async (newModel) => {
    try {
      const datacoreDir = ".datacore/datacorequery";
      if (!(await app.vault.adapter.exists(datacoreDir))) {
        await app.vault.adapter.mkdir(datacoreDir);
      }
      if (await app.vault.adapter.exists(PROVIDER_SETTINGS_FILE)) {
        const settings = JSON.parse(
          await app.vault.adapter.read(PROVIDER_SETTINGS_FILE)
        );
        settings.model = newModel;
        settings.updated = Date.now();
        await app.vault.adapter.write(
          PROVIDER_SETTINGS_FILE,
          JSON.stringify(settings, null, 2)
        );
      }
      setModel(newModel);
      setShowModelSelector(false);
      console.log("Saved model change:", newModel);
    } catch (e) {
      console.error("Failed to save model change:", e);
    }
  };
  useEffect(() => {
    if (currentQuery && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `I see you're working on this query:\n\n\`\`\`\n${currentQuery}\n\`\`\`\n\nHow can I help you improve or modify it?`,
        },
      ]);
    }
  }, [currentQuery]);
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    if (!apiKey) {
      setError(
        "No API key configured. Click the settings button to set up your AI provider."
      );
      setShowSettings(true);
      return;
    }
    const userMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);
    setError(null);
    try {
      const systemPrompt = buildSystemPrompt();
      let url, body, headers, responseData;
      if (provider === "gemini") {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const conversationHistory = messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));
        conversationHistory.push({
          role: "user",
          parts: [{ text: userInput }],
        });
        body = {
          contents: conversationHistory,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7 },
        };
        headers = { "Content-Type": "application/json" };
      } else if (provider === "openai" || provider === "groq") {
        url =
          provider === "openai"
            ? "https://api.openai.com/v1/chat/completions"
            : "https://api.groq.com/openai/v1/chat/completions";
        const conversationHistory = [{ role: "system", content: systemPrompt }];
        messages.forEach((msg) =>
          conversationHistory.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          })
        );
        conversationHistory.push({ role: "user", content: userInput });
        body = {
          model: model,
          messages: conversationHistory,
          temperature: 0.7,
        };
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };
      } else if (provider === "anthropic") {
        url = "https://api.anthropic.com/v1/messages";
        const conversationHistory = [];
        messages.forEach((msg) =>
          conversationHistory.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          })
        );
        conversationHistory.push({ role: "user", content: userInput });
        body = {
          model: model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: conversationHistory,
          temperature: 0.7,
        };
        headers = {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        };
      }
      if (window.app && window.app.requestUrl) {
        const response = await window.app.requestUrl({
          url,
          method: "POST",
          headers,
          body: JSON.stringify(body),
          throw: false,
        });
        responseData = response.json;
        if (response.status >= 400)
          throw new Error(
            responseData?.error?.message || `API Error (${response.status})`
          );
      } else {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        responseData = await response.json();
        if (!response.ok)
          throw new Error(responseData?.error?.message || "API call failed");
      }
      let aiText;
      if (provider === "gemini") {
        aiText = responseData.candidates[0].content.parts[0].text.trim();
      } else if (provider === "openai" || provider === "groq") {
        aiText = responseData.choices[0].message.content.trim();
      } else if (provider === "anthropic") {
        aiText = responseData.content[0].text.trim();
      }
      const aiMessage = { role: "assistant", content: aiText };
      setMessages((prev) => [...prev, aiMessage]);
      await extractAndSaveKnowledge(aiText);
    } catch (err) {
      console.error("AI Error:", err);
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  const extractQuery = (text) => {
    const codeBlockMatch = text.match(/```(?:datacore)?\n?(.*?)\n?```/s);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("@")) return line.trim();
    }
    return null;
  };
  const handleUseQuery = (queryText) => {
    const extractedQuery = extractQuery(queryText);
    if (extractedQuery) {
      onQueryGenerated(extractedQuery);
      const lastUserMsg = messages.filter((m) => m.role === "user").pop();
      if (lastUserMsg) {
        saveLearning(lastUserMsg.content, extractedQuery, "positive");
      }
    }
  };
  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },
    modal: {
      backgroundColor: "#0a0a0a",
      border: "2px solid #9b87f5",
      borderRadius: "8px",
      padding: 0,
      maxWidth: "700px",
      width: "90%",
      maxHeight: "85vh",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderBottom: "2px solid #9b87f5",
      flexShrink: 0,
    },
    title: {
      margin: 0,
      color: "#ffffff",
      fontSize: "18px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    headerButtons: { display: "flex", gap: "8px" },
    button: {
      padding: "8px 16px",
      backgroundColor: "#9b87f5",
      border: "none",
      borderRadius: "4px",
      color: "#000000",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.2s",
      fontSize: "12px",
    },
    closeBtn: {
      background: "none",
      border: "none",
      color: "#9b87f5",
      fontSize: "24px",
      cursor: "pointer",
      padding: "4px 8px",
    },
    chatContainer: {
      flex: 1,
      overflowY: "auto",
      padding: "20px",
      minHeight: 0,
    },
    message: {
      marginBottom: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    userMessage: {
      alignSelf: "flex-end",
      maxWidth: "80%",
      backgroundColor: "#9b87f5",
      color: "#000000",
      padding: "10px 14px",
      borderRadius: "12px 12px 2px 12px",
      fontSize: "14px",
    },
    assistantMessage: {
      alignSelf: "flex-start",
      maxWidth: "85%",
      backgroundColor: "#1a1a1a",
      color: "#ffffff",
      padding: "12px 16px",
      borderRadius: "12px 12px 12px 2px",
      fontSize: "14px",
      lineHeight: "1.6",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    queryBlock: {
      backgroundColor: "#000000",
      border: "1px solid #9b87f5",
      borderRadius: "4px",
      padding: "10px",
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9b87f5",
      margin: "8px 0",
      wordBreak: "break-all",
    },
    useQueryBtn: {
      padding: "6px 12px",
      backgroundColor: "#9b87f5",
      border: "none",
      borderRadius: "4px",
      color: "#000000",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: "11px",
      marginTop: "8px",
    },
    inputArea: {
      borderTop: "1px solid #9b87f5",
      padding: "16px",
      display: "flex",
      gap: "10px",
      flexShrink: 0,
    },
    textarea: {
      flex: 1,
      padding: "10px",
      backgroundColor: "#1a1a1a",
      border: "1px solid #9b87f5",
      borderRadius: "4px",
      color: "#ffffff",
      fontFamily: "inherit",
      fontSize: "14px",
      resize: "none",
      minHeight: "40px",
      maxHeight: "100px",
    },
    error: {
      color: "#ff6b6b",
      padding: "12px",
      textAlign: "center",
      fontSize: "13px",
    },
    info: {
      padding: "8px 20px",
      color: "#9b87f5",
      fontSize: "11px",
      borderTop: "1px solid #9b87f5",
      textAlign: "center",
      flexShrink: 0,
    },
    emptyState: {
      textAlign: "center",
      color: "#666",
      padding: "40px 20px",
      fontSize: "14px",
    },
    loading: {
      textAlign: "center",
      color: "#9b87f5",
      padding: "12px",
      fontSize: "14px",
      fontStyle: "italic",
    },
  };

  // When in drawer mode, render without overlay
  if (isDrawerMode) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        {showSettings && (
          <AISettingsModal
            onClose={() => setShowSettings(false)}
            onSave={saveProviderConfig}
            currentProvider={provider}
            currentApiKey={apiKey}
            isInline={true}
          />
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #9b87f5",
            flexShrink: 0,
          }}
        >
          {" "}
          <h3
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <dc.Icon icon="sparkles" style={{ fontSize: "16px" }} />
            AI Query Assistant
          </h3> <div style={{ display: "flex", gap: "8px" }}>
            {" "}
            {messages.length > 0 && (
              <button
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#1a1a1a",
                  color: "#9b87f5",
                  border: "1px solid #9b87f5",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
                onClick={handleClearChat}
              >
                Clear Chat
              </button>
            )} <button
              style={{
                padding: "6px 12px",
                backgroundColor: "#1a1a1a",
                color: "#9b87f5",
                border: "1px solid #9b87f5",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onClick={() => setShowSettings(true)}
            >
              <dc.Icon icon="settings" style={{ fontSize: "12px" }} />
              Settings
            </button>{" "}
          </div>{" "}
        </div> <div
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid #2d2d2d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0f0f0f",
            position: "relative",
          }}
        >
          {" "}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "#9b87f5",
            }}
            data-model-selector
          >
            {" "}
            <dc.Icon
              icon={
                provider === "gemini"
                  ? "sparkles"
                  : provider === "openai"
                  ? "bot"
                  : provider === "anthropic"
                  ? "brain"
                  : "zap"
              }
              style={{ fontSize: "14px" }}
            /> <span
              style={{ fontWeight: "bold", textTransform: "capitalize" }}
            >
              {provider}
            </span> <span style={{ color: "#666" }}>•</span> <button
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "11px",
                padding: "2px 6px",
                borderRadius: "3px",
                transition: "all 0.2s",
              }}
              onClick={() => setShowModelSelector(!showModelSelector)}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#1a1a1a")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {" "}
              {model} <dc.Icon
                icon={showModelSelector ? "chevron-up" : "chevron-down"}
                style={{ fontSize: "10px", marginLeft: "4px" }}
              />{" "}
            </button>{" "}
          </div> {apiKey && (
            <div style={{ fontSize: "10px", color: "#666" }}>
              🔑 API key configured
            </div>
          )} {showModelSelector && (
            <div
              data-model-selector
              style={{
                position: "absolute",
                top: "100%",
                right: "16px",
                backgroundColor: "#0a0a0a",
                border: "1px solid #9b87f5",
                borderRadius: "4px",
                padding: "8px",
                zIndex: 200,
                minWidth: "200px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {" "}
              {PROVIDER_MODELS[provider]?.map((m) => (
                <button
                  key={m}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 10px",
                    background: model === m ? "#9b87f5" : "none",
                    border: "none",
                    color: model === m ? "#000000" : "#ffffff",
                    cursor: "pointer",
                    borderRadius: "3px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    marginBottom: "2px",
                  }}
                  onClick={() => saveModelChange(m)}
                  onMouseOver={(e) => {
                    if (model !== m)
                      e.currentTarget.style.backgroundColor = "#1a1a1a";
                  }}
                  onMouseOut={(e) => {
                    if (model !== m)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {" "}
                  {m} {model === m && " ✓"}{" "}
                </button>
              ))}{" "}
            </div>
          )}{" "}
        </div> <div
          ref={chatContainerRef}
          style={{ flex: 1, overflowY: "auto", padding: "16px", minHeight: 0 }}
        >
          {" "}
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#666",
                padding: "20px 16px",
                fontSize: "13px",
              }}
            >
              {" "}
              👋 Ask me anything about building Datacore queries!
              <br />
              <br /> I can help you understand syntax, fix errors, and build complex
              queries.
              <br />I learn from our conversation to provide better help.{" "}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {" "}
                {msg.role === "user" ? (
                  <div
                    style={{
                      alignSelf: "flex-end",
                      maxWidth: "80%",
                      backgroundColor: "#9b87f5",
                      color: "#000000",
                      padding: "8px 12px",
                      borderRadius: "12px 12px 2px 12px",
                      fontSize: "13px",
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div>
                    {" "}
                    <div
                      style={{
                        alignSelf: "flex-start",
                        maxWidth: "85%",
                        backgroundColor: "#1a1a1a",
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "12px 12px 12px 2px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.content.replace(
                        /\[LIMITATION:[^\]]+\]|\[RULE:[^\]]+\]|\[ERROR:[^\]]+\]/g,
                        ""
                      )}
                    </div> {extractQuery(msg.content) && (
                      <button
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#9b87f5",
                          border: "none",
                          borderRadius: "4px",
                          color: "#000000",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "11px",
                          marginTop: "6px",
                        }}
                        onClick={() => handleUseQuery(msg.content)}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.opacity = "0.8")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                      >
                        {" "}
                        ✓ Use This Query{" "}
                      </button>
                    )}{" "}
                  </div>
                )}{" "}
              </div>
            ))
          )} {isLoading && (
            <div
              style={{
                textAlign: "center",
                color: "#9b87f5",
                padding: "10px",
                fontSize: "13px",
                fontStyle: "italic",
              }}
            >
              🤖 Thinking...
            </div>
          )} {error && (
            <div
              style={{
                color: "#ff6b6b",
                padding: "10px",
                textAlign: "center",
                fontSize: "12px",
              }}
            >
              ⚠️ {error}
            </div>
          )}{" "}
        </div> <div
          style={{
            borderTop: "1px solid #9b87f5",
            padding: "12px 16px",
            display: "flex",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {" "}
          <textarea
            style={{
              flex: 1,
              padding: "8px",
              backgroundColor: "#1a1a1a",
              border: "1px solid #9b87f5",
              borderRadius: "4px",
              color: "#ffffff",
              fontFamily: "inherit",
              fontSize: "13px",
              resize: "none",
              minHeight: "36px",
              maxHeight: "80px",
            }}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask a question or describe what you want to query..."
            disabled={isLoading}
          /> <button
            style={{
              padding: "8px 16px",
              backgroundColor: "#9b87f5",
              border: "none",
              borderRadius: "4px",
              color: "#000000",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "12px",
            }}
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {" "}
            Send{" "}
          </button>{" "}
        </div> <div
          style={{
            padding: "8px 16px",
            color: "#9b87f5",
            fontSize: "10px",
            borderTop: "1px solid #9b87f5",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {" "}
          💡 {systemPromptAdditions.length > 0 &&
            `Learned ${systemPromptAdditions.length} rules | `} {
            learnings.filter((l) => l.success).length
          } successful queries learned{" "}
        </div>{" "}
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      {" "}
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {" "}
        <div style={styles.header}>
          {" "}
          <h3 style={styles.title}>
            <dc.Icon icon="sparkles" style={{ fontSize: "18px" }} />
            AI Query Assistant
          </h3> <div style={styles.headerButtons}>
            {" "}
            {messages.length > 0 && (
              <button
                style={{
                  ...styles.button,
                  backgroundColor: "#1a1a1a",
                  color: "#9b87f5",
                  border: "1px solid #9b87f5",
                }}
                onClick={handleClearChat}
              >
                Clear Chat
              </button>
            )} <button style={styles.closeBtn} onClick={onClose}>
              ×
            </button>{" "}
          </div>{" "}
        </div> <div ref={chatContainerRef} style={styles.chatContainer}>
          {" "}
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              {" "}
              👋 Ask me anything about building Datacore queries!
              <br />
              <br /> I can help you understand syntax, fix errors, and build complex
              queries.
              <br />I learn from our conversation to provide better help.{" "}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} style={styles.message}>
                {" "}
                {msg.role === "user" ? (
                  <div style={styles.userMessage}>{msg.content}</div>
                ) : (
                  <div>
                    {" "}
                    <div style={styles.assistantMessage}>
                      {msg.content.replace(
                        /\[LIMITATION:[^\]]+\]|\[RULE:[^\]]+\]|\[ERROR:[^\]]+\]/g,
                        ""
                      )}
                    </div> {extractQuery(msg.content) && (
                      <button
                        style={styles.useQueryBtn}
                        onClick={() => handleUseQuery(msg.content)}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.opacity = "0.8")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                      >
                        {" "}
                        ✓ Use This Query{" "}
                      </button>
                    )}{" "}
                  </div>
                )}{" "}
              </div>
            ))
          )} {isLoading && (
            <div style={styles.loading}>🤖 Thinking...</div>
          )} {error && <div style={styles.error}>⚠️ {error}</div>}{" "}
        </div> <div style={styles.inputArea}>
          {" "}
          <textarea
            style={styles.textarea}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask a question or describe what you want to query..."
            disabled={isLoading}
          /> <button
            style={{ ...styles.button, padding: "10px 16px" }}
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {" "}
            Send{" "}
          </button>{" "}
        </div> <div style={styles.info}>
          {" "}
          💡 {systemPromptAdditions.length > 0 &&
            `Learned ${systemPromptAdditions.length} rules | `} {
            learnings.filter((l) => l.success).length
          } successful queries learned{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
function FieldValueHelper({ searchTerm, onValueSelect, fieldName, operator }) {
  const [allValues, setAllValues] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  useEffect(() => {
    console.log(
      "[FieldValueHelper] Starting value extraction for field:",
      fieldName
    );
    try {
      const allItems = dc.api.query("@page OR @task OR @section OR @block");
      console.log("[FieldValueHelper] Query returned items:", allItems.length);
      const valueSet = new Set();
      let extractedField = fieldName;
      if (fieldName.startsWith('row["')) {
        const match = fieldName.match(/row\["([^"]+)"\]/);
        extractedField = match?.[1] || fieldName;
        console.log(
          "[FieldValueHelper] Extracted field from row syntax:",
          extractedField
        );
      }
      const lookupFields = [fieldName];
      if (!fieldName.startsWith("$")) lookupFields.push("$" + fieldName);
      if (!fieldName.startsWith('row["'))
        lookupFields.push(`row["${fieldName}"]`);
      console.log("[FieldValueHelper] Will try lookup fields:", lookupFields);
      for (const item of allItems) {
        let value = null;
        try {
          for (const lookup of lookupFields) {
            if (lookup.startsWith('row["')) {
              const match = lookup.match(/row\["([^"]+)"\]/);
              const prop = match?.[1] || lookup;
              value = item[prop];
            } else if (lookup.startsWith("$")) {
              value = item[lookup];
            } else {
              value = item[lookup];
            }
            if (value !== null && value !== undefined) {
              console.log(
                "[FieldValueHelper] Found value with lookup:",
                lookup,
                "Type:",
                typeof value,
                Array.isArray(value) ? "Array" : ""
              );
              break;
            }
          }
          if (!value && item.$frontmatter) {
            value =
              item.$frontmatter[extractedField] ||
              item.$frontmatter[extractedField.toLowerCase()];
          }
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach((v) => {
                let strVal = String(v).replace(/^#/, "");
                if (typeof v === "object" && v.$path) strVal = v.$path;
                else if (v instanceof Date) strVal = v.toISOString();
                if (strVal && strVal !== "[object Object]")
                  valueSet.add(strVal);
              });
            } else if (typeof value === "string") {
              const cleaned = value.replace(/^#/, "");
              if (cleaned) valueSet.add(cleaned);
            } else if (
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              valueSet.add(String(value));
            } else if (value instanceof Date) {
              valueSet.add(value.toISOString());
            } else if (value && typeof value === "object") {
              if (value.$path) valueSet.add(value.$path);
              else if (value.toISOString) valueSet.add(value.toISOString());
              else if (value.toString && value.toString() !== "[object Object]")
                valueSet.add(value.toString());
            }
          }
        } catch (itemErr) {
          console.warn("[FieldValueHelper] Error processing item:", itemErr);
        }
      }
      const valuesArray = Array.from(valueSet).sort().slice(0, 100);
      console.log(
        "[FieldValueHelper] Found unique values:",
        valuesArray.length,
        "Sample:",
        valuesArray.slice(0, 5)
      );
      const isDateField = ["$ctime", "$mtime", "ctime", "mtime"].includes(
        extractedField
      );
      const dateHint = isDateField
        ? " ⚠️ Dates: use >, <, == not .contains()"
        : "";
      setDebugInfo(
        `Field: ${extractedField} | Items: ${allItems.length} | Values: ${valuesArray.length}${dateHint}`
      );
      setAllValues(valuesArray);
    } catch (e) {
      console.error("[FieldValueHelper] Failed to fetch field values:", e);
      setDebugInfo(`Error: ${e.message}`);
      setAllValues([]);
    }
  }, [fieldName]);
  const filteredValues = useMemo(() => {
    if (allValues === null) return null;
    if (!searchTerm) return allValues;
    return allValues.filter((val) =>
      val.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allValues, searchTerm]);
  const styles = {
    container: {
      backgroundColor: "#0a0a0a",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #9b87f5",
    },
    list: { maxHeight: "150px", overflowY: "auto", paddingRight: "5px" },
    button: {
      width: "100%",
      textAlign: "left",
      padding: "4px 8px",
      border: "none",
      background: "none",
      color: "#ffffff",
      cursor: "pointer",
      borderRadius: "3px",
      marginBottom: "2px",
      fontFamily: "monospace",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "11px",
    },
    hover: { backgroundColor: "#1a1a1a", color: "#9b87f5" },
    message: {
      color: "#9b87f5",
      fontSize: "12px",
      textAlign: "center",
      margin: "5px 0",
    },
    header: {
      color: "#9b87f5",
      fontSize: "11px",
      marginBottom: "6px",
      fontFamily: "monospace",
    },
  };
  return (
    <div style={styles.container}>
      {debugInfo && (
        <div
          style={{
            color: "#9b87f5",
            fontSize: "10px",
            marginBottom: "4px",
            padding: "4px",
            backgroundColor: "#1a1a1a",
            borderRadius: "3px",
          }}
        >
          🔍 {debugInfo}
        </div>
      )}{" "}
      <div style={styles.header}>
        Available values for <strong>{fieldName}</strong>:
      </div>{" "}
      <div style={styles.list}>
        {" "}
        {filteredValues === null ? (
          <p style={styles.message}>Loading values...</p>
        ) : filteredValues.length > 0 ? (
          filteredValues.map((val) => (
            <button
              key={val}
              style={styles.button}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  styles.hover.backgroundColor;
                e.currentTarget.style.color = styles.hover.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#ffffff";
              }}
              onClick={() => onValueSelect(val)}
            >
              <dc.Icon icon="corner-down-right" style={{ fontSize: "10px" }} />
              {val}
            </button>
          ))
        ) : (
          <p style={styles.message}>
            {searchTerm ? "No values match." : "No values found."}
          </p>
        )}{" "}
      </div>{" "}
    </div>
  );
}

// =====================================================================
// INTERACTIVE UI & TOOLBAR COMPONENTS
// =====================================================================

function OperatorSelector({ top, left, onSelect, onClose, isNegated }) {
  const styles = {
    container: {
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
      backgroundColor: "#0a0a0a",
      border: "1px solid #9b87f5",
      borderRadius: "4px",
      zIndex: 20,
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 4px 8px rgba(155,135,245,0.3)",
    },
    button: {
      padding: "6px 12px",
      background: "none",
      border: "none",
      color: "#ffffff",
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "monospace",
      transition: "all 0.2s",
    },
    hover: { backgroundColor: "#1a1a1a", color: "#9b87f5" },
    separator: { borderBottom: "1px solid #9b87f5", margin: "2px 6px" },
  };
  const ref = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);
  return (
    <div ref={ref} style={styles.container}>
      {" "}
      <button
        style={styles.button}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = styles.hover.backgroundColor;
          e.currentTarget.style.color = styles.hover.color;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#ffffff";
        }}
        onClick={() => onSelect("AND")}
      >
        AND
      </button> <button
        style={styles.button}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = styles.hover.backgroundColor;
          e.currentTarget.style.color = styles.hover.color;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#ffffff";
        }}
        onClick={() => onSelect("OR")}
      >
        OR
      </button> <div style={styles.separator}></div>{" "}
      <button
        style={{ ...styles.button, color: isNegated ? "#9b87f5" : "#ffffff" }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = styles.hover.backgroundColor;
          e.currentTarget.style.color = styles.hover.color;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = isNegated ? "#9b87f5" : "#ffffff";
        }}
        onClick={() => onSelect("!not")}
      >
        {" "}
        {isNegated ? "is not" : "!not"}{" "}
      </button>{" "}
    </div>
  );
}
function getCoordsFromIndex(textarea, index) {
  if (!textarea) return { top: 0, left: 0 };
  const properties = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "letter-spacing",
    "line-height",
    "text-transform",
    "word-spacing",
    "text-indent",
    "padding-top",
    "padding-left",
    "padding-right",
    "padding-bottom",
    "border-top-width",
    "border-left-width",
    "border-right-width",
    "border-bottom-width",
  ];
  const computedStyle = window.getComputedStyle(textarea);
  const div = document.createElement("div");
  div.id = "input-mirror-div";
  document.body.appendChild(div);
  properties.forEach((prop) => {
    div.style[prop] = computedStyle[prop];
  });
  div.style.position = "absolute";
  div.style.top = "-9999px";
  div.style.left = "0px";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.width = `${textarea.clientWidth}px`;
  div.textContent = textarea.value.substring(0, index);
  const span = document.createElement("span");
  span.textContent = textarea.value.substring(index) || ".";
  div.appendChild(span);
  const coords = {
    top: span.offsetTop - textarea.scrollTop,
    left: span.offsetLeft - textarea.scrollLeft,
  };
  document.body.removeChild(div);
  return coords;
}
function QueryControls({ onBaseTypeChange, onAppend, onStartFilterWizard }) {
  const styles = {
    container: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      alignItems: "center",
      padding: "10px",
      backgroundColor: "#000000",
      borderRadius: "4px",
      border: "1px solid #9b87f5",
    },
    select: {
      padding: "8px",
      backgroundColor: "#1a1a1a",
      border: "1px solid #9b87f5",
      borderRadius: "4px",
      color: "#ffffff",
      fontFamily: "monospace",
      transition: "all 0.2s",
      cursor: "pointer",
    },
    button: {
      padding: "6px 12px",
      backgroundColor: "#1a1a1a",
      border: "1px solid #9b87f5",
      borderRadius: "4px",
      color: "#ffffff",
      cursor: "pointer",
      fontFamily: "monospace",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
    },
    separator: {
      borderLeft: "1px solid #9b87f5",
      height: "20px",
      margin: "0 4px",
    },
    categoryLabel: {
      width: "100%",
      fontSize: "10px",
      color: "#9b87f5",
      fontWeight: "bold",
      textTransform: "uppercase",
      marginTop: "8px",
      marginBottom: "0",
      fontFamily: "monospace",
      letterSpacing: "1px",
    },
  };
  const baseTypes = [
    {
      value: "@page",
      label: "@page",
      icon: "file-text",
      desc: "All markdown pages",
    },
    {
      value: "@task",
      label: "@task",
      icon: "check-square",
      desc: "All task items",
    },
    { value: "@file", label: "@file", icon: "file", desc: "All files" },
    {
      value: "@section",
      label: "@section",
      icon: "heading",
      desc: "All sections",
    },
    { value: "@block", label: "@block", icon: "box", desc: "All blocks" },
    {
      value: "@block-list",
      label: "@block-list",
      icon: "list",
      desc: "List blocks",
    },
    {
      value: "@codeblock",
      label: "@codeblock",
      icon: "code",
      desc: "All codeblocks",
    },
    {
      value: "@datablock",
      label: "@datablock",
      icon: "database",
      desc: "YAML datablocks",
    },
    {
      value: "@list-item",
      label: "@list-item",
      icon: "list-ordered",
      desc: "All list items",
    },
  ];
  const addOns = [
    { type: "category", label: "FILTERS" },
    {
      label: "#tag",
      value: "#",
      helper: "tag",
      icon: "hash",
      selection: { start_offset: 0, length: 0 },
      description: "Find items with a specific tag.\nExample: #work",
    },
    {
      label: "path()",
      value: 'path("")',
      helper: "folder",
      icon: "folder",
      selection: { start_offset: -2, length: 0 },
      description:
        'Find items within a specific folder path.\nExample: path("Projects/Active")',
    },
    {
      label: "exists()",
      value: "exists()",
      helper: "property",
      icon: "check-circle",
      selection: { start_offset: -1, length: 0 },
      description:
        "Find items where a specific property exists.\nExample: exists(due)",
    },
    { type: "separator" },
    { type: "category", label: "HIERARCHY" },
    {
      label: "parentof()",
      value: "parentof(@page)",
      icon: "arrow-up-circle",
      selection: { start_offset: -6, length: 5 },
      description:
        "Find the parents of items matching a sub-query.\nExample: parentof(@task and #urgent)",
    },
    {
      label: "childof()",
      value: "childof(@page)",
      icon: "arrow-down-circle",
      selection: { start_offset: -6, length: 5 },
      description:
        "Find the children of items matching a sub-query.\nExample: childof(@page)",
    },
    {
      label: "supertree()",
      value: "supertree(@page)",
      icon: "git-branch",
      selection: { start_offset: -6, length: 5 },
      description:
        "Find items and all their parents (inclusive).\nExample: supertree(@codeblock)",
    },
    {
      label: "subtree()",
      value: "subtree(@page)",
      icon: "git-merge",
      selection: { start_offset: -6, length: 5 },
      description:
        "Find items and all their children (inclusive).\nExample: subtree(@page)",
    },
    { type: "separator" },
    { type: "category", label: "LINKS" },
    {
      label: "connected()",
      value: "connected([[]])",
      helper: "file",
      icon: "link-2",
      selection: { start_offset: -3, length: 0 },
      description:
        "Find items linked TO or FROM a specific file.\nExample: connected([[/projects/roadmap]])",
    },
    {
      label: "linkedto()",
      value: "linkedto([[]])",
      helper: "file",
      icon: "arrow-right",
      selection: { start_offset: -3, length: 0 },
      description:
        "Find items that link TO a specific file.\nExample: linkedto([[/goals/q3]])",
    },
    {
      label: "linkedfrom()",
      value: "linkedfrom([[]])",
      helper: "file",
      icon: "arrow-left",
      selection: { start_offset: -3, length: 0 },
      description:
        "Find items that a specific file links FROM.\nExample: linkedfrom([[/meetings/2023-10-26]])",
    },
    { type: "separator" },
    { type: "category", label: "SPECIAL" },
    {
      label: "$completed",
      value: "$completed",
      icon: "check",
      description:
        "Find tasks that are marked as complete.\nExample: @task AND $completed",
    },
    {
      isFilterWizard: true,
      label: "Field Query...",
      icon: "filter",
      description:
        'Build a custom filter for a field.\nExample: rating >= 7\nAlso handles fields with spaces: row["last reviewed"]\nPro-tip: Type `$` to trigger this wizard.',
    },
  ];
  return (
    <div style={styles.container}>
      {" "}
      <select
        style={styles.select}
        title="Select the base object type for the query"
        onChange={(e) => onBaseTypeChange(e.target.value)}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#9b87f5")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
      >
        {" "}
        <option value="">-- Select Base Type --</option> {baseTypes.map(
          (type) => (
            <option key={type.value} value={type.value} title={type.desc}>
              {type.label}
            </option>
          )
        )}{" "}
      </select> <div style={styles.separator}></div>{" "}
      {addOns.map((addon, index) => {
        if (addon.type === "separator")
          return <div key={`sep-${index}`} style={styles.separator}></div>;
        if (addon.type === "category")
          return (
            <div key={`cat-${index}`} style={styles.categoryLabel}>
              {addon.label}
            </div>
          );
        if (addon.isFilterWizard)
          return (
            <button
              key={index}
              style={styles.button}
              title={addon.description}
              onClick={onStartFilterWizard}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#9b87f5";
                e.currentTarget.style.color = "#000000";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
                e.currentTarget.style.color = "#ffffff";
              }}
            >
              {addon.icon && (
                <dc.Icon icon={addon.icon} style={{ fontSize: "12px" }} />
              )}
              {addon.label}
            </button>
          );
        return (
          <button
            key={index}
            style={styles.button}
            title={addon.description}
            onClick={() => onAppend(addon)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#9b87f5";
              e.currentTarget.style.color = "#000000";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#1a1a1a";
              e.currentTarget.style.color = "#ffffff";
            }}
          >
            {addon.icon && (
              <dc.Icon icon={addon.icon} style={{ fontSize: "12px" }} />
            )}
            {addon.label}
          </button>
        );
      })}{" "}
    </div>
  );
}

// =====================================================================
// DOM TRAVERSAL UTILITIES
// =====================================================================

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

// =====================================================================
// MAIN APPLICATION COMPONENT
// =====================================================================

function DatacoreQueryExplorer() {
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `query-explorer-${instanceId}`;
  const [isFullTab, setIsFullTab] = useState(true);
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;

  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const textareaRef = useRef(null);
  const inputAreaRef = useRef(null);
  const [helperState, setHelperState] = useState({
    type: null,
    step: null,
    searchTerm: "",
    startIndex: 0,
    context: {},
    position: { top: 0 },
  });
  const [operators, setOperators] = useState([]);
  const [activeOperator, setActiveOperator] = useState(null);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [manualMode, setManualMode] = useState(false); // Toggle for disabling auto query builder

  // --- Full Tab Effect ---
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
      height: "1;;00%",
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

  // --- Effects ---
  useEffect(() => {
    setLoading(true);
    const handler = setTimeout(() => {
      const queryToRun = inputValue.trim();
      if (!queryToRun) {
        setResults(null);
        setLoading(false);
        setError(null);
        return;
      }
      setError(null);
      setCurrentPage(1);
      try {
        const queryResult = dc.api.query(queryToRun);
        setResults(queryResult);
      } catch (e) {
        setError(e);
        setResults(null);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(handler);
  }, [inputValue]);
  useEffect(() => {
    if (!textareaRef.current) return;
    const regex = /\b(AND|OR)\b/g;
    const newOperators = [];
    let match;
    while ((match = regex.exec(inputValue)) !== null) {
      const position = getCoordsFromIndex(textareaRef.current, match.index);
      const opEndIndex = match.index + match[0].length;
      const nextChar = inputValue.substring(opEndIndex).trimStart()[0];
      newOperators.push({
        index: match.index,
        value: match[0],
        isNegated: nextChar === "!",
        position: position,
      });
    }
    setOperators(newOperators);
  }, [inputValue, textareaRef.current]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        helperState.type &&
        inputAreaRef.current &&
        !inputAreaRef.current.contains(event.target)
      ) {
        if (!event.target.closest('[title="Click to change operator"]')) {
          setHelperState({ type: null });
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [helperState.type]);

  // --- Handlers ---
  const checkAndSetHelpers = (query, cursorPosition) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const currentPosition = { top: textarea.offsetHeight + 2 };

    const triggerChar = query[cursorPosition - 1];
    const textBeforeTrigger = query.substring(0, cursorPosition - 1).trim();
    if (
      triggerChar === "$" &&
      (textBeforeTrigger === "" ||
        textBeforeTrigger.endsWith("AND") ||
        textBeforeTrigger.endsWith("OR"))
    ) {
      const newQuery =
        query.slice(0, cursorPosition - 1) + query.slice(cursorPosition);
      setInputValue(newQuery);
      setHelperState({
        type: "filter",
        step: "select_property",
        searchTerm: "",
        startIndex: cursorPosition - 1,
        context: {},
        position: currentPosition,
      });
      setTimeout(() => textarea.focus(), 0);
      return;
    }

    const fileRegex = /(connected|linkedto|linkedfrom)\(\[\[([^\]]*)\]\]\)/g;
    let match;
    while ((match = fileRegex.exec(query)) !== null) {
      const contentStartIndex = match.index + match[1].length + 3;
      const contentEndIndex = match.index + match[0].length - 2;
      if (
        cursorPosition >= contentStartIndex &&
        cursorPosition <= contentEndIndex
      ) {
        const currentSearchTerm = query.substring(
          contentStartIndex,
          contentEndIndex
        );
        setHelperState({
          type: "file",
          searchTerm: currentSearchTerm,
          startIndex: match.index,
          context: { function: match[1], fullMatch: match[0] },
          position: currentPosition,
        });
        return;
      }
    }
    const pathRegex = /path\("([^"]*)"\)/g;
    while ((match = pathRegex.exec(query)) !== null) {
      const contentStartIndex = match.index + 6;
      const contentEndIndex = match.index + match[0].length - 2;
      if (
        cursorPosition >= contentStartIndex &&
        cursorPosition <= contentEndIndex
      ) {
        const currentSearchTerm = query.substring(
          contentStartIndex,
          contentEndIndex
        );
        setHelperState({
          type: "folder",
          searchTerm: currentSearchTerm,
          startIndex: match.index,
          context: { fullMatch: match[0] },
          position: currentPosition,
        });
        return;
      }
    }
    const existsRegex = /exists\(([^)]*)\)/g;
    while ((match = existsRegex.exec(query)) !== null) {
      const contentStartIndex = match.index + 7;
      const contentEndIndex = match.index + match[0].length - 1;
      if (
        cursorPosition >= contentStartIndex &&
        cursorPosition <= contentEndIndex
      ) {
        const currentSearchTerm = query.substring(
          contentStartIndex,
          contentEndIndex
        );
        setHelperState({
          type: "property",
          searchTerm: currentSearchTerm,
          startIndex: match.index,
          context: { fullMatch: match[0] },
          position: currentPosition,
        });
        return;
      }
    }
    const textBeforeCursor = query.substring(0, cursorPosition);
    if (helperState.type === "filter") return;
    const fileMatch = textBeforeCursor.match(
      /(connected|linkedto|linkedfrom)\(\[\[([^\]]*)$/
    );
    if (fileMatch) {
      setHelperState({
        type: "file",
        searchTerm: fileMatch[2],
        startIndex: fileMatch.index,
        context: { function: fileMatch[1], fullMatch: fileMatch[0] },
        position: currentPosition,
      });
      return;
    }
    const pathMatch = textBeforeCursor.match(/path\("([^"]*)$/);
    if (pathMatch) {
      setHelperState({
        type: "folder",
        searchTerm: pathMatch[1],
        startIndex: pathMatch.index,
        context: { fullMatch: pathMatch[0] },
        position: currentPosition,
      });
      return;
    }
    const existsMatch = textBeforeCursor.match(/\bexists\(([^)]*)$/);
    if (existsMatch) {
      setHelperState({
        type: "property",
        searchTerm: existsMatch[1],
        startIndex: existsMatch.index,
        context: { fullMatch: existsMatch[0] },
        position: currentPosition,
      });
      return;
    }
    const tagMatch = textBeforeCursor.match(/#([\w-]*)$/);
    if (tagMatch) {
      setHelperState({
        type: "tag",
        searchTerm: tagMatch[1],
        startIndex: tagMatch.index,
        context: { fullMatch: tagMatch[0] },
        position: currentPosition,
      });
      return;
    }

    setHelperState({ type: null });
  };

  const handleBaseTypeChange = (newBase) => {
    if (!newBase) return;
    setInputValue((currentQuery) => {
      const baseTypeRegex = /@\w+(-list)?/g;
      return baseTypeRegex.test(currentQuery)
        ? currentQuery.replace(baseTypeRegex, newBase)
        : newBase + (currentQuery.trim() ? " AND " + currentQuery.trim() : "");
    });
    setHelperState({ type: null });
  };
  const handleAppend = (addon) => {
    const { value: fragment, helper: helperType, selection } = addon;
    const currentQuery = inputValue.trim();
    const prefix = currentQuery === "" ? "" : currentQuery + " AND ";
    const newQuery = prefix + fragment;
    setInputValue(newQuery);
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      if (selection) {
        const selectionStart = newQuery.length + selection.start_offset;
        const selectionEnd = selectionStart + selection.length;
        textarea.setSelectionRange(selectionStart, selectionEnd);
      } else {
        textarea.setSelectionRange(newQuery.length, newQuery.length);
      }
      if (helperType) {
        const startIndex = prefix.length;
        let context = { fullMatch: fragment };
        if (helperType === "file") {
          context.function = fragment.substring(0, fragment.indexOf("("));
        }
        setHelperState({
          type: helperType,
          step: null,
          searchTerm: "",
          startIndex: startIndex,
          context: context,
          position: { top: textarea.offsetHeight + 2 },
        });
      } else {
        setHelperState({ type: null });
      }
    }, 0);
  };
  const handleInputChange = (e) => {
    const { value, selectionStart } = e.target;
    setActiveOperator(null);
    setInputValue(value);
    
    // Skip auto-building if manual mode is enabled
    if (manualMode) {
      return;
    }
    
    if (
      helperState.type === "filter" &&
      helperState.step === "select_property"
    ) {
      const newSearchTerm = value.substring(
        helperState.startIndex,
        selectionStart
      );
      setHelperState((s) => ({ ...s, searchTerm: newSearchTerm }));
    } else if (
      helperState.type === "filter" &&
      helperState.step === "select_value"
    ) {
      const newSearchTerm = value
        .substring(helperState.startIndex, selectionStart)
        .replace(/^"|"$/g, "");
      setHelperState((s) => ({ ...s, searchTerm: newSearchTerm }));
    } else if (helperState.type && !helperState.step) {
      const startIdx = helperState.startIndex;
      let endIdx = selectionStart;
      if (helperState.type === "tag") {
        const beforeCursor = value.substring(0, selectionStart);
        const tagMatch = beforeCursor.match(/#([\w-]*)$/);
        if (tagMatch) {
          setHelperState((s) => ({ ...s, searchTerm: tagMatch[1] }));
        } else {
          setHelperState({ type: null });
        }
      } else if (helperState.type === "folder") {
        const beforeCursor = value.substring(0, selectionStart);
        const pathMatch = beforeCursor.match(/path\("([^"]*)$/);
        if (pathMatch) {
          setHelperState((s) => ({ ...s, searchTerm: pathMatch[1] }));
        } else {
          setHelperState({ type: null });
        }
      } else if (helperState.type === "file") {
        const beforeCursor = value.substring(0, selectionStart);
        const fileMatch = beforeCursor.match(
          /(connected|linkedto|linkedfrom)\(\[\[([^\]]*)$/
        );
        if (fileMatch) {
          setHelperState((s) => ({ ...s, searchTerm: fileMatch[2] }));
        } else {
          setHelperState({ type: null });
        }
      } else if (helperState.type === "property") {
        const beforeCursor = value.substring(0, selectionStart);
        const existsMatch = beforeCursor.match(/\bexists\(([^)]*)$/);
        if (existsMatch) {
          setHelperState((s) => ({ ...s, searchTerm: existsMatch[1] }));
        } else {
          setHelperState({ type: null });
        }
      }
    }
  };
  const handleCursorMove = (e) => {
    // Skip helper detection if manual mode is enabled
    if (manualMode) {
      return;
    }
    checkAndSetHelpers(e.target.value, e.target.selectionStart);
  };
  const handleTextareaScroll = () => {
    if (!textareaRef.current) return;
    const regex = /\b(AND|OR)\b/g;
    const newOperators = [];
    let match;
    while ((match = regex.exec(inputValue)) !== null) {
      const position = getCoordsFromIndex(textareaRef.current, match.index);
      const opEndIndex = match.index + match[0].length;
      const nextChar = inputValue.substring(opEndIndex).trimStart()[0];
      newOperators.push({
        index: match.index,
        value: match[0],
        isNegated: nextChar === "!",
        position: position,
      });
    }
    setOperators(newOperators);
    setActiveOperator(null);
  };
  const handleOperatorChange = (newOperatorValue) => {
    if (!activeOperator) return;
    const { index, value, isNegated } = activeOperator;
    let newQuery;
    const beforeOperator = inputValue.substring(0, index);
    const afterOperator = inputValue.substring(index + value.length);
    if (newOperatorValue === "AND" || newOperatorValue === "OR") {
      if (isNegated) {
        newQuery =
          beforeOperator +
          newOperatorValue +
          afterOperator.trimStart().substring(1);
      } else {
        newQuery = beforeOperator + newOperatorValue + afterOperator;
      }
    } else if (newOperatorValue === "!not") {
      if (isNegated) {
        newQuery =
          beforeOperator + value + afterOperator.trimStart().substring(1);
      } else {
        newQuery = beforeOperator + value + " !" + afterOperator.trimStart();
      }
    }
    setInputValue(newQuery);
    setActiveOperator(null);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(index, index);
    }, 0);
  };
  const handleHelperSelect = (selectedValue, type) => {
    const { startIndex, context } = helperState;
    let replacement = "";
    if (type === "tag") {
      replacement = `#${selectedValue} `;
    } else if (type === "folder") {
      replacement = `path("${selectedValue}") `;
    } else if (type === "file") {
      replacement = `${context.function}([[${selectedValue}]]) `;
    } else if (type === "property") {
      replacement = `exists(${selectedValue}) `;
    }
    const textBeforeFragment = inputValue.substring(0, startIndex);
    const endOfReplacementIndex = context.fullMatch
      ? startIndex + context.fullMatch.length
      : textareaRef.current.selectionEnd;
    const textAfterFragment = inputValue.substring(endOfReplacementIndex);
    const newQuery = textBeforeFragment + replacement + textAfterFragment;
    setInputValue(newQuery);
    setHelperState({ type: null });
    setTimeout(() => {
      const newCursorPos = (textBeforeFragment + replacement).length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  const handleStartFilterWizard = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setInputValue((currentVal) => {
      const trimmed = currentVal.trim();
      const newQuery =
        trimmed === "" || trimmed.endsWith("AND") || trimmed.endsWith("OR")
          ? currentVal
          : currentVal + " AND ";
      setHelperState({
        type: "filter",
        step: "select_property",
        searchTerm: "",
        startIndex: newQuery.length,
        context: {},
        position: { top: textarea.offsetHeight + 2 },
      });
      setTimeout(() => textarea.focus(), 0);
      return newQuery;
    });
  };
  const handleFilterWizardStep = (selectedValue) => {
    const { step, context, startIndex } = helperState;
    if (step === "select_property") {
      const propertyText = selectedValue.includes(" ")
        ? `row["${selectedValue}"]`
        : selectedValue;
      const textBefore = inputValue.substring(0, startIndex);
      const textAfter = inputValue.substring(
        startIndex + helperState.searchTerm.length
      );
      const newQuery = textBefore + propertyText + textAfter;
      setInputValue(newQuery);
      setHelperState((s) => ({
        ...s,
        step: "select_operator",
        context: {
          ...s.context,
          property: propertyText,
          propertyName: selectedValue,
        },
        startIndex: (textBefore + propertyText).length,
      }));
    } else if (step === "select_operator") {
      const needsValueHelper = [".contains", "==", "!="].includes(
        selectedValue
      );
      if (needsValueHelper) {
        let textToInsert =
          selectedValue === ".contains"
            ? '.contains("")'
            : ` ${selectedValue} `;
        const newQuery = inputValue + textToInsert;
        setInputValue(newQuery);
        const cursorOffset = selectedValue === ".contains" ? -2 : 0;
        setHelperState((s) => ({
          ...s,
          step: "select_value",
          operator: selectedValue,
          searchTerm: "",
          startIndex: newQuery.length + cursorOffset,
          position: { top: textareaRef.current?.offsetHeight + 2 },
        }));
        setTimeout(() => {
          const newCursorPos = newQuery.length + cursorOffset;
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        let textToInsert = ` ${selectedValue} `;
        const newQuery = inputValue + textToInsert;
        setInputValue(newQuery);
        setHelperState({ type: null });
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(
            newQuery.length,
            newQuery.length
          );
        }, 0);
      }
    }
  };
  const handleValueSelect = (selectedValue) => {
    const { startIndex } = helperState;
    const textBefore = inputValue.substring(0, startIndex);
    const textAfter = inputValue.substring(startIndex);
    const charBefore = textBefore[textBefore.length - 1];
    const charAfter = textAfter[0];
    const alreadyInQuotes =
      charBefore === '"' &&
      (charAfter === '"' || textAfter.indexOf('"') !== -1);
    const valueToInsert = alreadyInQuotes
      ? selectedValue
      : `"${selectedValue}"`;
    const newQuery = textBefore + valueToInsert + textAfter;
    setInputValue(newQuery);
    setHelperState({ type: null });
    setTimeout(() => {
      const newCursorPos = (textBefore + valueToInsert).length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // --- Styles & Render Logic ---
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      padding: "16px",
      backgroundColor: "#000000",
      color: "#ffffff",
      height: "100%",
      width: "100%",
      boxSizing: "border-box",
      position: "relative",
    },
    title: {
      margin: 0,
      color: "#ffffff",
      borderBottom: "2px solid #9b87f5",
      paddingBottom: "10px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    inputWrapper: { position: "relative" },
    textarea: {
      width: "100%",
      minHeight: "80px",
      padding: "10px",
      backgroundColor: "#0a0a0a",
      border: "1px solid #9b87f5",
      borderRadius: "4px",
      fontFamily: "monospace",
      color: "#ffffff",
      fontSize: "14px",
      resize: "vertical",
      transition: "all 0.2s",
    },
    helperContainer: {
      position: "absolute",
      width: "100%",
      left: 0,
      zIndex: 10,
      marginTop: "2px",
    },
    resultsContainer: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      border: "1px solid #9b87f5",
      borderRadius: "4px",
      overflow: "hidden",
      backgroundColor: "#0a0a0a",
    },
    list: { flex: 1, overflowY: "auto" },
    paginationControls: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "12px",
      padding: "10px",
      borderTop: "1px solid #9b87f5",
      backgroundColor: "#000000",
      flexShrink: 0,
    },
    pageButton: {
      padding: "6px 16px",
      backgroundColor: "#1a1a1a",
      border: "1px solid #9b87f5",
      borderRadius: "3px",
      color: "#ffffff",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    pageButtonDisabled: {
      backgroundColor: "#0a0a0a",
      color: "#555",
      cursor: "not-allowed",
      borderColor: "#555",
    },
    pageInfo: {
      minWidth: "120px",
      textAlign: "center",
      color: "#9b87f5",
      fontFamily: "monospace",
    },
    operatorOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      padding: "10px",
      border: "1px solid transparent",
      fontFamily: "monospace",
      fontSize: "14px",
    },
    operatorHotspot: {
      position: "absolute",
      cursor: "pointer",
      pointerEvents: "auto",
      color: "#9b87f5",
      backgroundColor: "rgba(155, 135, 245, 0.15)",
      borderRadius: "3px",
      borderBottom: "1px dashed #9b87f5",
    },
    exitIcon: {
      position: "absolute",
      top: "15px",
      right: "20px",
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#9b87f5",
      userSelect: "none",
      cursor: "pointer",
      opacity: 0,
      transform: "scale(0.9)",
      transition: "opacity 0.2s, transform 0.2s",
      zIndex: 10,
    },
    compactWrapper: {
      padding: "16px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      border: "1px dashed #9b87f5",
      borderRadius: "8px",
      backgroundColor: "#0a0a0a",
    },
    compactText: { margin: 0, color: "#9b87f5", fontSize: "14px" },
    compactButton: {
      padding: "8px 16px",
      fontSize: "12px",
      fontWeight: "500",
      color: "#000000",
      backgroundColor: "#9b87f5",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
  };
  const renderResults = () => {
    if (loading)
      return (
        <p style={{ textAlign: "center", padding: "20px", color: "#9b87f5" }}>
          Loading...
        </p>
      );
    if (error)
      return (
        <pre
          style={{
            color: "#ffffff",
            backgroundColor: "#1a1a1a",
            padding: "10px",
            border: "1px solid #9b87f5",
            borderRadius: "4px",
          }}
        >
          <strong style={{ color: "#9b87f5" }}>Query Error:</strong>{" "}
          {error.message}
        </pre>
      );
    if (!results)
      return (
        <p style={{ textAlign: "center", padding: "20px", color: "#9b87f5" }}>
          Select a base type or type a query to begin.
        </p>
      );
    if (results.length === 0)
      return (
        <p style={{ textAlign: "center", padding: "20px", color: "#9b87f5" }}>
          No results found.
        </p>
      );
    const totalPages = Math.ceil(results.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = results.slice(startIndex, startIndex + itemsPerPage);
    return (
      <div style={styles.resultsContainer}>
        {" "}
        <div style={styles.list}>
          {" "}
          {currentItems.map((item, index) => (
            <ResultItem key={startIndex + index} item={item} />
          ))}{" "}
        </div> {totalPages > 1 && (
          <div style={styles.paginationControls}>
            {" "}
            <button
              style={{
                ...styles.pageButton,
                ...(currentPage === 1 && styles.pageButtonDisabled),
              }}
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              disabled={currentPage === 1}
              onMouseOver={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = "#9b87f5";
                  e.currentTarget.style.color = "#000000";
                }
              }}
              onMouseOut={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = "#1a1a1a";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
            >
              <dc.Icon icon="chevron-left" style={{ fontSize: "14px" }} />
              Previous
            </button> <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span> <button
              style={{
                ...styles.pageButton,
                ...(currentPage >= totalPages && styles.pageButtonDisabled),
              }}
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              disabled={currentPage >= totalPages}
              onMouseOver={(e) => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.backgroundColor = "#9b87f5";
                  e.currentTarget.style.color = "#000000";
                }
              }}
              onMouseOut={(e) => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.backgroundColor = "#1a1a1a";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
            >
              Next
              <dc.Icon icon="chevron-right" style={{ fontSize: "14px" }} />
            </button>{" "}
          </div>
        )}{" "}
      </div>
    );
  };

  // Example queries for quick start
  const exampleQueries = [
    {
      label: "All pages with rating ≥ 7",
      query: "@page and rating >= 7",
      icon: "star",
    },
    {
      label: "Incomplete tasks",
      query: "@task and $completed = false",
      icon: "square",
    },
    {
      label: "Pages in folder",
      query: '@page and path("Projects")',
      icon: "folder-open",
    },
    { label: "Recent pages", query: "@page", icon: "clock" },
    { label: "Tagged items", query: "#game", icon: "tag" },
    {
      label: "Datablocks with rating",
      query: "@datablock and exists(rating)",
      icon: "database",
    },
  ];

  // Compact mode render
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={styles.compactWrapper}>
        <p style={styles.compactText}>Query Explorer is in compact mode.</p>
        <button
          style={styles.compactButton}
          onClick={() => setIsFullTab(true)}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.color = "#000000";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#9b87f5";
            e.currentTarget.style.color = "#000000";
          }}
        >
          <dc.Icon
            icon="maximize-2"
            style={{ fontSize: "14px", marginRight: "6px" }}
          />
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%" }}>
      <style>{`
        .${uniqueWrapperClass}:hover .exit-full-tab-icon {
          opacity: 0.7;
          transform: scale(1);
        }
        .${uniqueWrapperClass} .exit-full-tab-icon:hover {
          opacity: 1;
        }
      `}</style>
      <div style={styles.container} className={uniqueWrapperClass}>
        <span
          style={styles.exitIcon}
          className="exit-full-tab-icon"
          onClick={() => setIsFullTab(false)}
          title="Exit Full Tab"
        >
          <dc.Icon icon="minimize-2" style={{ fontSize: "18px" }} />
        </span>
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "60px",
            display: "flex",
            gap: "10px",
            opacity: 0,
          }}
          className="exit-full-tab-icon"
        >
          <span
            style={{ ...styles.exitIcon, position: "static", opacity: 1 }}
            onClick={() => setShowAIAssistant(true)}
            title="AI Query Assistant"
          >
            <dc.Icon icon="sparkles" style={{ fontSize: "18px" }} />
          </span>
          <span
            style={{ 
              ...styles.exitIcon, 
              position: "static", 
              opacity: 1,
              color: manualMode ? "#9b87f5" : "inherit"
            }}
            onClick={() => setManualMode(!manualMode)}
            title={manualMode ? "Manual Mode (Auto-builder disabled)" : "Enable Manual Mode"}
          >
            <dc.Icon
              icon={manualMode ? "pencil" : "wand"}
              style={{ fontSize: "18px" }}
            />
          </span>
          <span
            style={{ ...styles.exitIcon, position: "static", opacity: 1 }}
            onClick={() => setShowCheatsheet(!showCheatsheet)}
            title="Toggle Syntax Help"
          >
            <dc.Icon
              icon={showCheatsheet ? "book-open" : "book"}
              style={{ fontSize: "18px" }}
            />
          </span>
        </div>
        <h1 style={styles.title}>
          <dc.Icon
            icon="search"
            style={{ fontSize: "28px", color: "#9b87f5" }}
          />
          Datacore Query Explorer
        </h1>
        {showAIAssistant && (
          <AIQueryAssistant
            currentQuery={inputValue}
            onQueryGenerated={(query) => {
              setInputValue(query);
              setShowAIAssistant(false);
            }}
            onClose={() => setShowAIAssistant(false)}
          />
        )}
        <div>
          <label
            htmlFor="query-input"
            style={{ display: "block", marginBottom: "6px", color: "#9b87f5" }}
          >
            <strong>Live Datacore Query</strong>
            {manualMode && (
              <span style={{ 
                marginLeft: "12px", 
                fontSize: "11px", 
                color: "#9b87f5",
                backgroundColor: "rgba(155, 135, 245, 0.15)",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: "normal"
              }}>
                <dc.Icon icon="pencil" style={{ fontSize: "10px", marginRight: "4px" }} />
                Manual Mode
              </span>
            )}
          </label>
          <div style={{ marginBottom: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setManualMode(!manualMode)}
              style={{
                padding: "6px 12px",
                backgroundColor: manualMode ? "#9b87f5" : "rgba(155, 135, 245, 0.15)",
                border: "1px solid #9b87f5",
                borderRadius: "4px",
                color: manualMode ? "#0a0a0a" : "#9b87f5",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
            >
              <dc.Icon icon={manualMode ? "pencil" : "wand"} style={{ fontSize: "14px" }} />
              {manualMode ? "Manual Mode (Auto-builder OFF)" : "Enable Manual Mode"}
            </button>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {manualMode 
                ? "Type freely without auto-completions or helpers" 
                : "Click to disable auto query builder"}
            </span>
          </div>
          <div style={styles.inputWrapper} ref={inputAreaRef}>
            <textarea
              ref={textareaRef}
              id="query-input"
              style={styles.textarea}
              value={inputValue}
              onChange={handleInputChange}
              onScroll={handleTextareaScroll}
              onClick={handleCursorMove}
              onKeyUp={handleCursorMove}
              placeholder="Type a query, or use the buttons below..."
            />
            <div style={styles.operatorOverlay}>
              {operators.map((op, i) => (
                <span
                  key={i}
                  style={{
                    ...styles.operatorHotspot,
                    top: `${op.position.top}px`,
                    left: `${op.position.left}px`,
                    width: `${op.value.length}ch`,
                    height: "1.2em",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveOperator(op);
                  }}
                  title="Click to change operator"
                >
                  <span style={{ opacity: 0 }}>{op.value}</span>
                </span>
              ))}
            </div>
            {activeOperator && (
              <OperatorSelector
                top={activeOperator.position.top + 20}
                left={activeOperator.position.left}
                onSelect={handleOperatorChange}
                onClose={() => setActiveOperator(null)}
                isNegated={activeOperator.isNegated}
              />
            )}
            {helperState.type && (
              <div
                style={{
                  ...styles.helperContainer,
                  top: `${helperState.position.top}px`,
                }}
              >
                {helperState.type === "tag" && (
                  <TagHelper
                    searchTerm={helperState.searchTerm}
                    onTagSelect={(val) => handleHelperSelect(val, "tag")}
                  />
                )}
                {helperState.type === "folder" && (
                  <FolderHelper
                    searchTerm={helperState.searchTerm}
                    onFolderSelect={(val) => handleHelperSelect(val, "folder")}
                  />
                )}
                {helperState.type === "file" && (
                  <FileHelper
                    searchTerm={helperState.searchTerm}
                    onFileSelect={(val) => handleHelperSelect(val, "file")}
                  />
                )}
                {helperState.type === "property" && (
                  <GenericPropertyHelper
                    searchTerm={helperState.searchTerm}
                    onPropertySelect={(val) =>
                      handleHelperSelect(val, "property")
                    }
                  />
                )}
                {helperState.type === "filter" &&
                  helperState.step === "select_property" && (
                    <GenericPropertyHelper
                      searchTerm={helperState.searchTerm}
                      onPropertySelect={handleFilterWizardStep}
                    />
                  )}
                {helperState.type === "filter" &&
                  helperState.step === "select_operator" && (
                    <ComparisonOperatorHelper
                      fieldName={
                        helperState.context.propertyName ||
                        helperState.context.property
                      }
                      onOperatorSelect={handleFilterWizardStep}
                    />
                  )}
                {helperState.type === "filter" &&
                  helperState.step === "select_value" && (
                    <FieldValueHelper
                      searchTerm={helperState.searchTerm}
                      onValueSelect={handleValueSelect}
                      fieldName={helperState.context.property}
                      operator={helperState.operator}
                    />
                  )}
              </div>
            )}
          </div>
        </div>
        <QueryControls
          onBaseTypeChange={handleBaseTypeChange}
          onAppend={handleAppend}
          onStartFilterWizard={handleStartFilterWizard}
        />
        {showCheatsheet && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#0a0a0a",
              border: "1px solid #9b87f5",
              borderRadius: "4px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            <h4
              style={{
                margin: "0 0 8px 0",
                color: "#9b87f5",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <dc.Icon icon="book-open" style={{ fontSize: "14px" }} />
              Query Syntax Reference
            </h4>
            <div
              style={{
                display: "grid",
                gap: "8px",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
            >
              <div>
                <strong style={{ color: "#9b87f5" }}>Combinators:</strong>{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                  }}
                >
                  AND
                </code>{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                  }}
                >
                  OR
                </code>{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                  }}
                >
                  !not
                </code>
              </div>
              <div>
                <strong style={{ color: "#9b87f5" }}>Operators:</strong>{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                  }}
                >
                  ==
                </code>{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                  }}
                >
                  !=
                </code>{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                  }}
                >
                  &gt;=
                </code>{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                  }}
                >
                  &lt;=
                </code>{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                  }}
                >
                  .contains()
                </code>
              </div>
              <div>
                <strong style={{ color: "#9b87f5" }}>Intrinsic Fields:</strong>{" "}
                $path, $name, $tags, $completed, $status, $mtime, $ctime...
              </div>
              <div>
                <strong style={{ color: "#9b87f5" }}>Examples:</strong>
              </div>
              <div style={{ marginLeft: "10px", color: "#9b87f5" }}>
                •{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                    color: "#ffffff",
                  }}
                >
                  @page and rating &gt;= 7
                </code>
              </div>
              <div style={{ marginLeft: "10px", color: "#9b87f5" }}>
                •{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                    color: "#ffffff",
                  }}
                >
                  @task and !$completed
                </code>
              </div>
              <div style={{ marginLeft: "10px", color: "#9b87f5" }}>
                •{" "}
                <code
                  style={{
                    background: "#1a1a1a",
                    padding: "2px 4px",
                    borderRadius: "2px",
                    color: "#ffffff",
                  }}
                >
                  row["field name"] == "value"
                </code>
              </div>
            </div>
          </div>
        )}
        {!inputValue.trim() && !showCheatsheet && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#0a0a0a",
              border: "1px solid #9b87f5",
              borderRadius: "4px",
            }}
          >
            <h4
              style={{
                margin: "0 0 8px 0",
                color: "#9b87f5",
                fontSize: "12px",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <dc.Icon icon="zap" style={{ fontSize: "14px" }} />
              Quick Start Examples
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {exampleQueries.map((ex, i) => (
                <button
                  key={i}
                  style={{
                    padding: "6px 10px",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #9b87f5",
                    borderRadius: "3px",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s",
                  }}
                  onClick={() => setInputValue(ex.query)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#9b87f5";
                    e.currentTarget.style.color = "#000000";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#1a1a1a";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  title={ex.query}
                >
                  <dc.Icon icon={ex.icon} style={{ fontSize: "12px" }} />
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <h3
            style={{
              margin: "16px 0 10px 0",
              color: "#9b87f5",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <dc.Icon icon="database" style={{ fontSize: "20px" }} />
            Results {results ? `(${results.length})` : ""}
          </h3>
          {renderResults()}
        </div>
      </div>
      <AIQueryLauncher />
    </div>
  );
}

// ====================================================================================
// --- AI QUERY LAUNCHER (PiP-style Floating Window) ---
// ====================================================================================

function AIQueryLauncher() {
  const [isAIWindowOpen, setIsAIWindowOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const portalContainerRef = useRef(null);
  const aiWindowRef = useRef(null);

  // Create a portal container that attaches directly to document.body
  useEffect(() => {
    const portalDiv = document.createElement("div");
    portalDiv.id = "ai-query-launcher-portal";
    portalDiv.style.cssText =
      "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 99998;";
    document.body.appendChild(portalDiv);
    portalContainerRef.current = portalDiv;

    return () => {
      if (portalDiv && document.body.contains(portalDiv)) {
        document.body.removeChild(portalDiv);
      }
    };
  }, []);

  const mainButtonSize = 60;
  const mainButtonOffsetFromEdge = 20;

  const handleOpenAI = () => {
    setIsAIWindowOpen(true);
  };

  const handleCloseAI = () => {
    setIsAIWindowOpen(false);
  };

  const handleQueryGenerated = (query) => {
    // Copy to clipboard and show notification
    navigator.clipboard.writeText(query);
    setNotification("Query copied to clipboard!");
    setTimeout(() => setNotification(null), 3000);
  };

  // Create the draggable PiP window
  useEffect(() => {
    if (!isAIWindowOpen) {
      if (aiWindowRef.current && aiWindowRef.current.parentNode) {
        aiWindowRef.current.parentNode.removeChild(aiWindowRef.current);
        aiWindowRef.current = null;
      }
      return;
    }

    const aiWindow = document.createElement("div");
    aiWindowRef.current = aiWindow;

    const aiWidth = 500;
    const aiHeight = 600;

    Object.assign(aiWindow.style, {
      position: "fixed",
      bottom: "100px",
      right: "20px",
      width: `${aiWidth}px`,
      height: `${aiHeight}px`,
      background: "#0a0a0a",
      border: "2px solid #9b87f5",
      borderRadius: "12px",
      boxShadow: "0 8px 32px rgba(155, 135, 245, 0.4)",
      zIndex: "10000",
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      cursor: "grab",
    });

    aiWindow.innerHTML = `
      <div class="ai-window-header" style="
        background: linear-gradient(135deg, #9b87f5, #7a6bc7);
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: grab;
        flex-shrink: 0;
      ">
        <div style="display: flex; align-items: center; gap: 8px; color: #000; font-weight: bold; font-size: 14px;">
          <span class="ai-header-icon"></span>
          <span>AI Query Assistant</span>
        </div>
        <button class="ai-close-btn" style="
          background: none;
          border: none;
          color: #000;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justifyContent: center;
        ">×</button>
      </div>
      <div class="ai-window-content" style="
        flex: 1;
        overflow: hidden;
        display: flex;
        flexDirection: column;
      "></div>
    `;

    document.body.appendChild(aiWindow);

    // Render header icon
    const headerIconContainer = aiWindow.querySelector(".ai-header-icon");
    dc.preact.render(
      <dc.Icon icon="sparkles" style={{ fontSize: "16px" }} />,
      headerIconContainer
    );

    // Make it draggable
    let startX, startY, startTop, startRight;
    let isDragging = false;

    const onWindowDragMove = (e) => {
      if (!isDragging) {
        const newRight = startRight - (e.clientX - startX);
        const newTop = startTop + (e.clientY - startY);
        aiWindow.style.right = `${Math.max(
          0,
          Math.min(window.innerWidth - aiWidth, newRight)
        )}px`;
        aiWindow.style.top = `${Math.max(
          0,
          Math.min(window.innerHeight - aiHeight, newTop)
        )}px`;
        aiWindow.style.bottom = "auto";
      }
    };

    const onWindowDragEnd = () => {
      isDragging = false;
      aiWindow.style.cursor = "grab";
      aiWindow.querySelector(".ai-window-header").style.cursor = "grab";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onWindowDragMove);
      window.removeEventListener("mouseup", onWindowDragEnd);
    };

    const onWindowDragStart = (e) => {
      if (
        !e.target.closest(".ai-window-header") ||
        e.target.closest(".ai-close-btn")
      )
        return;
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const computed = getComputedStyle(aiWindow);
      startTop = parseInt(computed.top, 10) || 0;
      startRight = parseInt(computed.right, 10) || 0;
      aiWindow.style.cursor = "grabbing";
      aiWindow.querySelector(".ai-window-header").style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onWindowDragMove);
      window.addEventListener("mouseup", onWindowDragEnd);
    };

    aiWindow.addEventListener("mousedown", onWindowDragStart);

    // Close button handler
    aiWindow
      .querySelector(".ai-close-btn")
      .addEventListener("click", handleCloseAI);

    // Render AIQueryAssistant into the content area
    const contentArea = aiWindow.querySelector(".ai-window-content");
    dc.preact.render(
      <AIQueryAssistant
        currentQuery={""}
        onQueryGenerated={handleQueryGenerated}
        onClose={handleCloseAI}
        isDrawerMode={true}
      />,
      contentArea
    );

    return () => {
      aiWindow.removeEventListener("mousedown", onWindowDragStart);
      if (aiWindow.parentNode) {
        aiWindow.parentNode.removeChild(aiWindow);
      }
    };
  }, [isAIWindowOpen]);

  // Render the main button
  const renderMainButton = () => {
    if (isAIWindowOpen) return null;

    return (
      <button
        className="ai-launcher-main-btn"
        onClick={handleOpenAI}
        style={{
          position: "fixed",
          bottom: `${mainButtonOffsetFromEdge}px`,
          right: `${mainButtonOffsetFromEdge}px`,
          width: `${mainButtonSize}px`,
          height: `${mainButtonSize}px`,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #9b87f5, #7a6bc7)",
          border: "2px solid #9b87f5",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(155, 135, 245, 0.5)",
          transition: "all 0.3s ease",
          zIndex: 10001,
          pointerEvents: "auto",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow =
            "0 6px 30px rgba(155, 135, 245, 0.7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow =
            "0 4px 20px rgba(155, 135, 245, 0.5)";
        }}
      >
        <dc.Icon icon="sparkles" style={{ fontSize: "28px" }} />
      </button>
    );
  };

  // Render notification
  const renderNotification = () => {
    if (!notification) return null;

    return (
      <div
        style={{
          position: "fixed",
          bottom: "100px",
          right: "20px",
          background: "#9b87f5",
          color: "#000",
          padding: "12px 20px",
          borderRadius: "8px",
          boxShadow: "0 4px 16px rgba(155, 135, 245, 0.6)",
          zIndex: 10002,
          pointerEvents: "auto",
          fontSize: "14px",
          fontWeight: "bold",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        {notification}
      </div>
    );
  };

  // Render button and notification to portal
  useEffect(() => {
    if (!portalContainerRef.current) return;

    const PortalContent = () => (
      <>
        {renderMainButton()}
        {renderNotification()}
      </>
    );

    dc.preact.render(<PortalContent />, portalContainerRef.current);

    return () => {
      if (portalContainerRef.current) {
        dc.preact.render(null, portalContainerRef.current);
      }
    };
  }, [isAIWindowOpen, notification]);

  return (
    <style>{`
      @keyframes ai-pulse {
        0%, 100% {
          box-shadow: 0 4px 20px rgba(155, 135, 245, 0.5);
        }
        50% {
          box-shadow: 0 4px 30px rgba(155, 135, 245, 0.8);
        }
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .ai-launcher-main-btn {
        animation: ai-pulse 2s infinite ease-in-out;
      }
    `}</style>
  );
}

// ====================================================================================
// --- QUERY BUILDER WRAPPER (Main export with mode support) ---
// ====================================================================================

function DatacoreQueryBuilder({ mode = "default" }) {
  // If mode is "ai-launcher", render the AI launcher instead
  if (mode === "ai-launcher") {
    return <AIQueryLauncher />;
  }

  // Otherwise, render the full query builder
  return <DatacoreQueryExplorer />;
}

return { BasicView: DatacoreQueryBuilder };
```
