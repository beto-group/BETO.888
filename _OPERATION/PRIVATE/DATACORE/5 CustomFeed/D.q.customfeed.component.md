




# ViewComponent

```jsx
const componentFile = "_OPERATION/PRIVATE/DATACORE/5 CustomFeed/D.q.customfeed.component.md";

// Import the guidelines and required modules
const { getIframesGuidelines } = await dc.require(
  dc.headerLink(componentFile, "IframesGuidelines")
);
const { FileSectionsProvider } = await dc.require(
  dc.headerLink(componentFile, "FileSectionsProvider")
);
const {
  transformUrl,
  getGuidelinesForUrl,
  useResizeObserver,
  useWindowResize,
  IframeControls,
  IframeContainer,
} = await dc.require(dc.headerLink(componentFile, "UtilityFunctions"));

/**
 * Main View Component
 *
 * Combines the iFrame viewer with navigation controls and a hamburger
 * drawer for inline editing.
 */
function View({ title = "PHYSICAL.enigmas" }) {
  const { useState, useEffect, useMemo, useRef } = dc;
  const fileName = `${title}..md`;

  // ------------------------------
  // Container & iFrame states
  // ------------------------------
  const [width, setWidth] = useState(800); // Container Width (C.W)
  const [height, setHeight] = useState(600); // Container Height (C.H)
  const [isContainerManual, setIsContainerManual] = useState(false);
  const isContainerManualRef = useRef(isContainerManual);
  useEffect(() => {
    isContainerManualRef.current = isContainerManual;
  }, [isContainerManual]);

  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeWidth, setIframeWidth] = useState(800); // Iframe Width (I.W)
  const [iframeHeight, setIframeHeight] = useState(666); // Iframe Height (I.H)
  const [iframeScale, setIframeScale] = useState(1);     // Iframe Scale (I.S)
  const [iframeLeft, setIframeLeft] = useState(10);        // Iframe Left (I.L)
  const [iframeTop, setIframeTop] = useState(10);          // Iframe Top (I.T)
  const [disableIframeInteraction, setDisableIframeInteraction] = useState(true);

  const containerRef = useRef(null);
  const iframeWrapperRef = useRef(null);

  // Hamburger menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Fine controls visibility toggle (edit component)
  const [showFineControls, setShowFineControls] = useState(false);

  // ------------------------------
  // File Sections & Navigation Logic
  // ------------------------------
  const [sections, setSections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // State for the numeric input (1-indexed)
  const [entryInput, setEntryInput] = useState("1");

  // Update the entry input when currentIndex changes
  useEffect(() => {
    setEntryInput(String(currentIndex + 1));
  }, [currentIndex]);

  // ------------------------------
  // Title ref and header click simulation with press delay
  // ------------------------------
  const titleRef = useRef(null);
  // Compute header text from fileName
  const headerText = useMemo(() => {
    const parts = fileName.split("..md");
    return parts[0] || fileName.replace(/\.[^/.]+$/, "");
  }, [fileName]);

  /**
   * simulateTitleClickWithPressDelay simulates a header click by:
   * 1. Dispatching a mousedown event.
   * 2. Waiting for a press delay (default 200ms).
   * 3. Dispatching mouseup and click events.
   */
  function simulateTitleClickWithPressDelay(pressDelay = 10000) {
    if (titleRef.current) {
      const mouseDownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      titleRef.current.dispatchEvent(mouseDownEvent);

      setTimeout(() => {
        const mouseUpEvent = new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        titleRef.current.dispatchEvent(mouseUpEvent);

        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        titleRef.current.dispatchEvent(clickEvent);
      }, pressDelay);
    }
  }

  /**
   * simulateTitleClickDelayed waits for an overall delay (default 500ms)
   * before calling the simulated press with a press delay.
   */
  function simulateTitleClickDelayed(delay = 500, pressDelay = 200) {
    setTimeout(() => {
      simulateTitleClickWithPressDelay(pressDelay);
    }, delay);
  }

  // When currentIndex changes, wait 500ms then simulate the header press.
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateTitleClickWithPressDelay();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Navigation functions with boundary handling.
  const goNext = () => {
    setCurrentIndex((prev) => {
      if (prev < sections.length - 1) {
        return prev + 1;
      } else {
        // At the last video, simulate a header press with delay.
        simulateTitleClickDelayed();
        return prev;
      }
    });
  };
  const goPrev = () => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      } else {
        // At the first video, simulate a header press with delay.
        simulateTitleClickDelayed();
        return prev;
      }
    });
  };

  // Update currentIndex based on numeric input value.
  function updateCurrentIndexFromInput() {
    const parsed = parseInt(entryInput, 10);
    if (!isNaN(parsed) && sections.length > 0) {
      let newIndex = parsed - 1; // Convert to 0-index
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= sections.length) newIndex = sections.length - 1;
      setCurrentIndex(newIndex);
    }
  }

  // Handle numeric input key events.
  function handleEntryInputKeyDown(e) {
    if (e.key === "Enter") {
      updateCurrentIndexFromInput();
    }
  }
  function handleEntryInputBlur() {
    updateCurrentIndexFromInput();
  }

  // ------------------------------
  // Global keydown and wheel event handlers
  // ------------------------------
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (showFineControls && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        return;
      }

      if (!showFineControls) {
        if (e.key === "ArrowRight" || e.key === "d") {
          setMenuOpen(true);
          e.preventDefault();
        } else if (e.key === "ArrowLeft" || e.key === "a") {
          setMenuOpen(false);
          e.preventDefault();
        } else if (e.key === "ArrowUp" || e.key === "w") {
          goPrev();
          e.preventDefault();
        } else if (e.key === "ArrowDown" || e.key === "s") {
          goNext();
          e.preventDefault();
        } else if (e.key === " ") {
          setDisableIframeInteraction((prev) => !prev);
          e.preventDefault();
        } else if (e.key === "v") {
          openCurrentLink();
          e.preventDefault();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFineControls, goPrev, goNext]);

  useEffect(() => {
    function handleWheel(e) {
      if (!showFineControls) return;

      const baseFactor = 0.2;
      const ilitFactor = 0.5;
      const scaleFactor = 0.001;

      // COMMAND + OPTION + SHIFT: Adjust I.L and I.T.
      if (e.metaKey && e.altKey && e.shiftKey) {
        if (e.deltaX !== 0) {
          setIframeLeft((prev) => prev + e.deltaX * ilitFactor);
        }
        if (e.deltaY !== 0) {
          setIframeTop((prev) => prev + e.deltaY * ilitFactor);
        }
        e.preventDefault();
      }
      // COMMAND + OPTION (without SHIFT): Adjust I.S (iframe scale) with finer increments.
      else if (e.metaKey && e.altKey && !e.shiftKey) {
        if (e.deltaY !== 0) {
          setIframeScale((prev) => {
            const newScale = Math.max(0.1, prev + (e.deltaY > 0 ? -scaleFactor : scaleFactor));
            return parseFloat(newScale.toFixed(3));
          });
          e.preventDefault();
        }
      }
      // COMMAND + SHIFT (without OPTION): Adjust container dimensions.
      else if (e.metaKey && e.shiftKey && !e.altKey) {
        if (e.deltaX !== 0) {
          setWidth((prev) => Math.max(10, prev + e.deltaX * baseFactor));
          e.preventDefault();
        }
        if (e.deltaY !== 0) {
          setHeight((prev) => Math.max(10, prev + e.deltaY * baseFactor));
          e.preventDefault();
        }
      }
      // COMMAND only: Adjust I.W and I.H.
      else if (e.metaKey && !e.shiftKey && !e.altKey) {
        if (e.deltaX !== 0) {
          setIframeWidth((prev) => Math.max(10, prev + e.deltaX * baseFactor));
          e.preventDefault();
        }
        if (e.deltaY !== 0) {
          setIframeHeight((prev) => Math.max(10, prev + e.deltaY * baseFactor));
          e.preventDefault();
        }
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [showFineControls]);

  // Open the current iFrame link in a new tab.
  function openCurrentLink() {
    if (iframeSrc) {
      window.open(iframeSrc, "_blank");
    }
  }

  // ------------------------------
  // Resize Handling
  // ------------------------------
  const updateDimensions = (newWidth) => {
    setWidth(newWidth);
    setIframeWidth(newWidth);
  };
  const observerRef = useResizeObserver(
    containerRef,
    isContainerManualRef,
    updateDimensions
  );
  useWindowResize(isContainerManual, updateDimensions);

  // Apply guidelines based on the URL.
  const applyGuidelines = (url) => {
    const guidelines = getGuidelinesForUrl(url, getIframesGuidelines);
    if (guidelines) {
      setIsContainerManual(true);
      isContainerManualRef.current = true;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      setWidth(guidelines.containerWidth);
      setHeight(guidelines.containerHeight);
      setIframeWidth(guidelines.iframeWidth);
      setIframeHeight(guidelines.iframeHeight);
      setIframeScale(guidelines.iframeScale);
      setIframeLeft(guidelines.iframeLeft);
      setIframeTop(guidelines.iframeTop);
      setDisableIframeInteraction(guidelines.disableIframeInteraction);
    }
  };

  // Update iFrame URL and guidelines when the carousel changes.
  useEffect(() => {
    if (sections.length > 0 && sections[currentIndex]) {
      const newUrl = sections[currentIndex].iframeSrc;
      if (newUrl) {
        setIframeSrc(newUrl);
        applyGuidelines(newUrl);
      } else {
        setIframeSrc("");
      }
    }
  }, [currentIndex, sections]);

  // Simulate a click in the iFrame if interaction is disabled.
  const handleContainerClick = (e) => {
    if (!disableIframeInteraction) return;
    window.requestAnimationFrame(() => {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;
      if (
        clickX >= iframeLeft &&
        clickX <= iframeLeft + iframeWidth &&
        clickY >= iframeTop &&
        clickY <= iframeTop + iframeHeight
      ) {
        const relativeX = (clickX - iframeLeft) / iframeScale;
        const relativeY = (clickY - iframeTop) / iframeScale;
        if (iframeWrapperRef.current) {
          const iframe = iframeWrapperRef.current.querySelector("iframe");
          if (iframe) {
            try {
              const iframeDoc =
                iframe.contentDocument || iframe.contentWindow.document;
              const targetElement = iframeDoc.elementFromPoint(
                relativeX,
                relativeY
              );
              if (targetElement) {
                const simulatedClick = new MouseEvent("click", {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: relativeX,
                  clientY: relativeY,
                });
                targetElement.dispatchEvent(simulatedClick);
              }
            } catch (error) {
              console.error("Unable to simulate click in iframe:", error);
            }
          }
        }
      }
    });
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* iFrame viewer area with header and controls */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{ flex: "1 1 auto", overflow: "hidden", position: "relative" }}
      >
        <dc.Stack style={{ padding: "10px" }}>
          <div>
            <p></p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Title element with ref for simulating mouse press */}
            <h1 ref={titleRef} style={{ margin: 0, fontSize: "1.2em" }}>
              {headerText}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                disabled={showFineControls}
                style={{
                  fontSize: "1em",
                  cursor: showFineControls ? "not-allowed" : "pointer",
                  padding: "4px 8px",
                  opacity: showFineControls ? 0.5 : 1,
                  visibility: currentIndex > 0 ? "visible" : "hidden",
                }}
                onClick={!showFineControls ? goPrev : undefined}
              >
                ↑
              </button>
              <button
                disabled={showFineControls}
                style={{
                  fontSize: "1em",
                  cursor: showFineControls ? "not-allowed" : "pointer",
                  padding: "4px 8px",
                  opacity: showFineControls ? 0.5 : 1,
                  visibility:
                    currentIndex < sections.length - 1 ? "visible" : "hidden",
                }}
                onClick={!showFineControls ? goNext : undefined}
              >
                ↓
              </button>
              {sections.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="number"
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    onKeyDown={handleEntryInputKeyDown}
                    onBlur={handleEntryInputBlur}
                    style={{ width: "50px", textAlign: "center" }}
                  />
                  <span>of {sections.length}</span>
                </div>
              )}
              <button
                style={{
                  fontSize: "1em",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
                onClick={() =>
                  setDisableIframeInteraction(!disableIframeInteraction)
                }
              >
                {disableIframeInteraction ? "ENABLE" : "DISABLE"}
              </button>
              <button
                style={{
                  fontSize: "1em",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
                onClick={openCurrentLink}
              >
                🔗
              </button>
              <button
                style={{
                  fontSize: "1em",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                ☰
              </button>
              <button
                style={{
                  fontSize: "1em",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
                onClick={() => setShowFineControls((prev) => !prev)}
              >
                EDIT
              </button>
            </div>
          </div>
          {/* Fine controls row */}
          {showFineControls && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "10px",
                alignItems: "center",
              }}
            >
              <label>
                C.W
                <input
                  type="number"
                  value={width}
                  onChange={(e) =>
                    setWidth(parseFloat(e.target.value) || 0)
                  }
                  style={{ width: "60px", marginLeft: "4px" }}
                />
              </label>
              <label>
                C.H
                <input
                  type="number"
                  value={height}
                  onChange={(e) =>
                    setHeight(parseFloat(e.target.value) || 0)
                  }
                  style={{ width: "60px", marginLeft: "4px" }}
                />
              </label>
              <label>
                I.W
                <input
                  type="number"
                  value={iframeWidth}
                  onChange={(e) =>
                    setIframeWidth(parseFloat(e.target.value) || 0)
                  }
                  style={{ width: "60px", marginLeft: "4px" }}
                />
              </label>
              <label>
                I.H
                <input
                  type="number"
                  value={iframeHeight}
                  onChange={(e) =>
                    setIframeHeight(parseFloat(e.target.value) || 0)
                  }
                  style={{ width: "60px", marginLeft: "4px" }}
                />
              </label>
              <label>
                I.S
                <input
                  type="number"
                  step="0.001"
                  value={iframeScale.toFixed(3)}
                  onChange={(e) =>
                    setIframeScale(parseFloat(e.target.value) || 1)
                  }
                  style={{ width: "60px", marginLeft: "4px" }}
                />
              </label>
              <label>
                I.L
                <input
                  type="number"
                  value={iframeLeft}
                  onChange={(e) =>
                    setIframeLeft(parseFloat(e.target.value) || 0)
                  }
                  style={{ width: "60px", marginLeft: "4px" }}
                />
              </label>
              <label>
                I.T
                <input
                  type="number"
                  value={iframeTop}
                  onChange={(e) =>
                    setIframeTop(parseFloat(e.target.value) || 0)
                  }
                  style={{ width: "60px", marginLeft: "4px" }}
                />
              </label>
            </div>
          )}
        </dc.Stack>

        {iframeSrc && (
          <dc.Stack style={{ padding: "10px" }}>
            <IframeContainer
              width={width}
              height={height}
              iframeSrc={iframeSrc}
              iframeWidth={iframeWidth}
              iframeHeight={iframeHeight}
              iframeScale={iframeScale}
              iframeLeft={iframeLeft}
              iframeTop={iframeTop}
              disableIframeInteraction={disableIframeInteraction}
              iframeWrapperRef={iframeWrapperRef}
            />
          </dc.Stack>
        )}

        {/* Hidden preloading container for next video */}
        {sections[currentIndex + 1] && (
          <div
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
              overflow: "hidden"
            }}
          >
            <iframe
              src={transformUrl(sections[currentIndex + 1].iframeSrc)}
              title="Preloading next video"
              width={1}
              height={1}
              style={{ border: "none" }}
              loading="lazy"
            ></iframe>
          </div>
        )}
      </div>

      {/* FileSectionsProvider loads sections based on the dynamic fileName */}
      <FileSectionsProvider fileName={fileName} onSectionsLoaded={setSections} />

      {/* Hamburger drawer for inline editing */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "300px",
            height: "100%",
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(5px)",
            borderLeft: "1px solid var(--background-modifier-border)",
            padding: "20px",
            overflowY: "auto",
            zIndex: 999999,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}></h2>
            <button
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: "1.5em", cursor: "pointer", padding: "6px 12px" }}
            >
              X
            </button>
          </div>
          <FileSectionsProvider
            fileName={fileName}
            editable={true}
            currentSectionIndex={currentIndex}
            onSectionUpdate={(newText) => {
              const newSections = [...sections];
              newSections[currentIndex].text = newText;
              setSections(newSections);
            }}
          />
        </div>
      )}
    </div>
  );
}

return { View };

```


# FileSectionsProvider

```jsx
/**
 * editFileSegment
 *
 * Updates a segment of a file by replacing the original text with the new text.
 */
async function editFileSegment(filePath, originalSegment, newSegment) {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    throw new Error("File not found: " + filePath);
  }
  const fileContent = await app.vault.read(file);
  const index = fileContent.indexOf(originalSegment);
  if (index === -1) {
    throw new Error("Original segment not found in the file content.");
  }
  const updatedContent =
    fileContent.substring(0, index) +
    newSegment +
    fileContent.substring(index + originalSegment.length);
  await app.vault.modify(file, updatedContent);
  return updatedContent;
}

/**
 * EditableSectionUI Component
 *
 * Renders a single section with inline editing functionality.
 */
function EditableSectionUI({ sectionText, filePath, onSectionUpdate }) {
  const { useState, useRef, useEffect } = dc;
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef(null);

  // Shared style for both display and editing
  const boxStyle = {
    width: "100%",
    height: "544px", // fixed height so both modes match
    fontFamily: "monospace",
    fontSize: "1.1em",
    lineHeight: "1.5",
    background: "none",
    padding: "0.5rem",
    boxSizing: "border-box",
    overflow: "auto",
    border: "none",
  };

  // When not editing, add a global keydown listener for Enter/Return.
  useEffect(() => {
    if (!editing) {
      const handleGlobalKeyDown = (e) => {
        // Only trigger if no input or textarea is focused
        const tag = document.activeElement.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        if (e.key === "Enter" || e.key === "Return") {
          e.preventDefault();
          setEditing(true);
          // After enabling editing, wait a tick and focus the textarea
          setTimeout(() => {
            textareaRef.current && textareaRef.current.focus();
          }, 0);
        }
      };

      window.addEventListener("keydown", handleGlobalKeyDown);
      return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [editing]);

  // When in edit mode, catch Enter (without Shift) to save changes.
  const handleTextareaKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === "Return") && !e.shiftKey) {
      e.preventDefault();
      const originalSegment = sectionText;
      const newText = textareaRef.current.value;
      editFileSegment(filePath, originalSegment, newText)
        .then(() => {
          onSectionUpdate(newText);
          setEditing(false);
        })
        .catch((error) => console.error("Error updating file:", error));
    }
  };

  return (
    <div style={{ padding: "0.5rem", marginBottom: "10px", background: "none" }}>
      {editing ? (
        <>
          <textarea
            defaultValue={sectionText}
            ref={textareaRef}
            onKeyDown={handleTextareaKeyDown}
            style={{
              ...boxStyle,
              resize: "vertical",
            }}
          />
          <div style={{ marginTop: "0.5rem" }}>
            <button
              style={{ marginRight: "0.5rem" }}
              onClick={async () => {
                const originalSegment = sectionText;
                const newText = textareaRef.current.value;
                try {
                  await editFileSegment(filePath, originalSegment, newText);
                  onSectionUpdate(newText);
                  setEditing(false);
                } catch (error) {
                  console.error("Error updating file:", error);
                }
              }}
            >
              Save
            </button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <pre style={{ ...boxStyle, whiteSpace: "pre-wrap" }}>
            {sectionText}
          </pre>
          <button style={{ marginTop: "0.5rem" }} onClick={() => setEditing(true)}>
            Edit Section
          </button>
        </>
      )}
    </div>
  );
}



/**
 * FileSectionsProvider
 *
 * Loads a file specified by fileName, splits its content into sections, and if
 * the "editable" prop is true, renders an inline editing UI for the current section.
 */
function FileSectionsProvider({
  fileName,
  onSectionsLoaded,
  editable = false,
  currentSectionIndex = 0,
  onSectionUpdate,
}) {
  const { useMemo, useEffect, useState } = dc;

  const queryString = useMemo(
    () => `@page and endswith($path, "${fileName}")`,
    [fileName]
  );
  const pages = dc.useQuery(queryString);

  // Filter for an exact match by comparing the file name from the path
  const targetPage = useMemo(() => {
    if (!pages || pages.length === 0) return null;
    const exactMatch = pages.find((page) => {
      const segments = page.$path.split("/");
      const currentFileName = segments[segments.length - 1];
      return currentFileName === fileName;
    });
    return exactMatch || pages[0];
  }, [pages, fileName]);

  const [filePath, setFilePath] = useState("");
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (targetPage) {
      setFilePath(targetPage.$path);
      const file = app.vault.getAbstractFileByPath(targetPage.$path);
      if (file) {
        app.vault.read(file).then((content) => {
          let fullText = content || "";

          // Optional: remove up to a marker
          const headerMarker = "#### [[ENIGMAS]]";
          const markerIndex = fullText.indexOf(headerMarker);
          if (markerIndex !== -1) {
            fullText = fullText.substring(markerIndex + headerMarker.length);
          }

          // Split into sections by lines of dashes (preserving newlines)
          const rawSections = fullText
            .split(/^\s*-{3,}\s*$/m)
            .filter((section) => section.replace(/\s+/g, "") !== "");

          // Regexes to detect the iframe tag and src
          const iframeTagRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/i;
          const srcRegex = /<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i;

          // Function to remove leading/trailing blank lines and indentation
          function cleanLines(text) {
            const lines = text.split(/\r?\n/);
            while (lines.length && /^\s*$/.test(lines[0])) {
              lines.shift();
            }
            while (lines.length && /^\s*$/.test(lines[lines.length - 1])) {
              lines.pop();
            }
            return lines.map((line) => line.replace(/^\s+/, "")).join("\n");
          }

          const sectionsData = rawSections.map((originalSection) => {
            // Clean the section text first
            const finalText = cleanLines(originalSection);

            // Regexes to detect the iframe tag and src
            const iframeTagRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/i;
            const srcRegex = /<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i;
            let iframeTag = "";
            let iframeSrc = "";

            // Try to capture an iframe tag
            const iframeTagMatch = originalSection.match(iframeTagRegex);
            if (iframeTagMatch) {
                iframeTag = iframeTagMatch[0];
                const srcMatch = iframeTag.match(srcRegex);
                if (srcMatch) {
                iframeSrc = srcMatch[1];
                }
            } else {
                // If no iframe tag is found, check for a URL starting with "https://"
                const urlRegex = /(https:\/\/[^\s]+)/;
                const urlMatch = finalText.match(urlRegex);
                if (urlMatch) {
                iframeSrc = urlMatch[1];
                }
            }

            // New logic for YouTube:
            // If the iframeSrc is a YouTube embed URL, search the full text for an alternative URL that is not the embed version.
            if (iframeSrc && iframeSrc.includes("youtube.com/embed/")) {
                const youtubeUrlRegex = /(https:\/\/(?:www\.)?youtube\.com\/(?!embed)[^"'\s]+)/;
                const youtubeMatch = finalText.match(youtubeUrlRegex);
                if (youtubeMatch) {
                iframeSrc = youtubeMatch[1];
                }
            }

            // New logic for Instagram:
            // If the URL is for Instagram and ends with "/embed" or "/embed/", remove that trailing part.
            if (iframeSrc && iframeSrc.includes("instagram.com")) {
                iframeSrc = iframeSrc.replace(/\/embed\/?$/, '');
            }

            return {
                text: finalText,
                iframeTag,
                iframeSrc,
            };
            });




          setSections(sectionsData);
          if (onSectionsLoaded) onSectionsLoaded(sectionsData);
        });
      } else {
        console.error("File not found at path:", targetPage.$path);
      }
    } else {
      console.error("No target page found for file:", fileName);
    }
  }, [targetPage, fileName, onSectionsLoaded]);

  // When in editable mode, render the inline editing UI for the current section.
  if (editable && sections.length > 0) {
    const currentSection = sections[currentSectionIndex];
    return (
      <EditableSectionUI
        sectionText={currentSection.text}
        filePath={filePath}
        onSectionUpdate={(newText) => {
          const newSections = [...sections];
          newSections[currentSectionIndex].text = newText;
          setSections(newSections);
          if (onSectionUpdate) onSectionUpdate(newText);
        }}
      />
    );
  }
  return null;
}

return { EditableSectionUI, FileSectionsProvider };

```




# UtilityFunctions


```jsx
const componentFile = "_OPERATION/PRIVATE/DATACORE/5 CustomFeed/D.q.customfeed.component.md";

// Import the guidelines (remains unchanged)
const { getIframesGuidelines } = await dc.require(dc.headerLink(componentFile, "IframesGuidelines"));

/** Utility Functions **/

// Transforms URLs (for example, converts YouTube URLs to embed links)
function transformUrl(url) {
  if (!url) return "";
  const lower = url.toLowerCase();
  try {
    if (lower.includes("youtube.com/watch")) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (videoId) {
        return "https://www.youtube.com/embed/" + videoId;
      }
    } else if (lower.includes("youtu.be/")) {
      const parts = url.split("/");
      const videoId = parts[parts.length - 1];
      if (videoId) {
        return "https://www.youtube.com/embed/" + videoId;
      }
    }
  } catch (e) {
    console.error("URL transformation error:", e);
  }
  return url;
}

// Returns guidelines based on the entered URL.
function getGuidelinesForUrl(url, getIframesGuidelines) {
  const guidelines = getIframesGuidelines();
  const lowerUrl = url.toLowerCase();
  let key = "WEBSITES"; // default guideline

  if (lowerUrl.includes("facebook.com/reel") || lowerUrl.includes("facebook.com/plugins/vid")) {
    key = "FACEBOOK.reel";
  } else if (lowerUrl.includes("facebook.com/watch?v=")) {
    key = "FACEBOOK.video";
  } else if (lowerUrl.includes("facebook.com")) {
    key = "FACEBOOK";
  } else if (lowerUrl.includes("warpcast")) {
    key = "WARPCAST";
  } else if (lowerUrl.includes("snapchat.com")) {
    key = "SNAPCHAT";
  } else if (
    (lowerUrl.includes("youtube.com") && lowerUrl.includes("/shorts")) ||
    (lowerUrl.includes("youtu.be") && lowerUrl.includes("shorts"))
  ) {
    key = "YOUTUBE.shorts";
  } else if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    key = "YOUTUBE";
  } else if (lowerUrl.includes("tiktok.com/embed")) {
    key = "TIKTOK.embed";
  } else if (lowerUrl.includes("tiktok.com")) {
    key = "TIKTOK";
  } else if (lowerUrl.includes("reddit.com")) {
    key = "REDDIT";
  } else if (lowerUrl.includes("linkedin.com")) {
    key = "LINKEDIN";
  } else if (lowerUrl.includes("instagram.com/reel") && lowerUrl.endsWith("/embed")) {
    key = "INSTAGRAM.embed";
  } else if (lowerUrl.includes("instagram.com/p") && lowerUrl.endsWith("/embed")) {
    key = "INSTAGRAM.p.embed";
  } else if (lowerUrl.includes("instagram.com/p")) {
    key = "INSTAGRAM.p";
  } else if (lowerUrl.includes("instagram.com")) {
    key = "INSTAGRAM";
  } else if (lowerUrl.includes("platform.twitter.com/embed") || lowerUrl.includes("platform.x.com/embed")) {
    key = "X.platform.embed";
  } else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    key = "X";
  }
  return guidelines[key];
}

/** Custom Hooks **/

// Sets up a ResizeObserver on the container and calls the updateDimensions callback
function useResizeObserver(containerRef, isContainerManualRef, updateDimensions) {
  const { useEffect, useRef } = dc;
  const observerRef = useRef(null);

  useEffect(() => {
    if (
      !isContainerManualRef.current &&
      containerRef.current &&
      typeof ResizeObserver !== "undefined"
    ) {
      console.log(
        "Attaching ResizeObserver. isContainerManual:",
        isContainerManualRef.current
      );
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const newWidth = entry.contentRect.width;
          console.log(
            "ResizeObserver: new container width =",
            newWidth,
            "(isContainerManualRef.current:",
            isContainerManualRef.current,
            ")"
          );
          if (!isContainerManualRef.current) {
            updateDimensions(newWidth);
          } else {
            console.log("Skipped ResizeObserver update because container is manual.");
          }
        }
      });
      observer.observe(containerRef.current);
      observerRef.current = observer;
      return () => {
        console.log("Disconnecting ResizeObserver.");
        observer.disconnect();
        observerRef.current = null;
      };
    } else {
      console.log(
        "ResizeObserver not attached. isContainerManual:",
        isContainerManualRef.current
      );
    }
  }, [isContainerManualRef.current, containerRef.current]);

  return observerRef;
}

// Fallback window resize listener when ResizeObserver is not available.
function useWindowResize(isContainerManual, updateDimensions) {
  const { useEffect } = dc;
  useEffect(() => {
    if (!isContainerManual) {
      console.log("Attaching window resize listener. isContainerManual:", isContainerManual);
      const handleResize = () => {
        const newWidth = window.innerWidth;
        console.log("Window resize: new width =", newWidth, "(isContainerManual:", isContainerManual, ")");
        updateDimensions(newWidth);
      };
      window.addEventListener("resize", handleResize);
      return () => {
        console.log("Removing window resize listener.");
        window.removeEventListener("resize", handleResize);
      };
    } else {
      console.log("Window resize listener not attached. isContainerManual:", isContainerManual);
    }
  }, [isContainerManual]);
}

/** Sub‑Components **/

// Component for toggling iFrame interaction (moved to header, URL input removed)
function IframeControls({ disableIframeInteraction, toggleIframeInteraction }) {
  return (
    <div style={{ padding: "10px" }}>
      <button onClick={toggleIframeInteraction}>
        {disableIframeInteraction ? "ENABLE" : "DISABLE"}
      </button>
    </div>
  );
}

// Component for rendering the container, inner content, and the iFrame.
function IframeContainer({
  width,
  height,
  iframeSrc,
  iframeWidth,
  iframeHeight,
  iframeScale,
  iframeLeft,
  iframeTop,
  disableIframeInteraction,
  iframeWrapperRef
}) {
  return (
    <div
      style={{
        position: "relative",
        width: width + "px",
        height: height + "px",
        border: "1px solid #ccc",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        margin: "0 auto"
      }}
    >
      <p>HELLO WORLD</p>
      <div
        ref={iframeWrapperRef}
        style={{
          position: "absolute",
          left: iframeLeft + "px",
          top: iframeTop + "px",
          width: iframeWidth + "px",
          height: iframeHeight + "px",
          overflow: "hidden",
          pointerEvents: disableIframeInteraction ? "none" : "auto"
        }}
      >
        {transformUrl(iframeSrc) ? (
          <iframe
            src={transformUrl(iframeSrc)}
            title="Controlled iFrame"
            width={iframeWidth}
            height={iframeHeight}
            loading="lazy"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{
              border: "1px solid #ccc",
              transform: `scale(${iframeScale})`,
              transformOrigin: "top left"
            }}
          ></iframe>
        ) : null}
      </div>
    </div>
  );
}

return { transformUrl, getGuidelinesForUrl, useResizeObserver, useWindowResize, IframeControls, IframeContainer };

```



# IframesGuidelines

```jsx
function getIframesGuidelines() {
  return {
    WEBSITES: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 640,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    FACEBOOK: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "FACEBOOK.reel": {
      containerWidth: 339,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1137,
      iframeScale: 0.526,
      iframeLeft: 1,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "FACEBOOK.plugins": {
      containerWidth: 629,
      containerHeight: 355,
      iframeWidth: 888,
      iframeHeight: 766,
      iframeScale: 0.705,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "FACEBOOK.watch": {
      containerWidth: 629,
      containerHeight: 355,
      iframeWidth: 888,
      iframeHeight: 766,
      iframeScale: 0.793,
      iframeLeft: 0,
      iframeTop: -90,
      disableIframeInteraction: false
    },
    WARPCAST: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    SNAPCHAT: {
      containerWidth: 396,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1111,
      iframeScale: 0.615,
      iframeLeft: 0,
      iframeTop: 44,
      disableIframeInteraction: false
    },
    YOUTUBE: {
      containerWidth: 640,
      containerHeight: 367,
      iframeWidth: 1270,
      iframeHeight: 730,
      iframeScale: 0.5,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    TIKTOK: {
      containerWidth: 340,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 0.92,
      iframeLeft: -124,
      iframeTop: -8,
      disableIframeInteraction: false
    },
    REDDIT: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 600,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    LINKEDIN: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 600,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "YOUTUBE.shorts": {
      containerWidth: 333,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1.04,
      iframeLeft: -155,
      iframeTop: -42,
      disableIframeInteraction: false
    },
    INSTAGRAM: {
      containerWidth: 338,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.528,
      iframeLeft: 0,
      iframeTop: -70,
      disableIframeInteraction: false
    },
    "INSTAGRAM.embed": {
      containerWidth: 340,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.75,
      iframeLeft: -71,
      iframeTop: -41,
      disableIframeInteraction: false
    },
    "TIKTOK.embed": {
      containerWidth: 303,
      containerHeight: 600,
      iframeWidth: 333,
      iframeHeight: 666,
      iframeScale: 0.92,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "INSTAGRAM.p.embed": {
      containerWidth: 503,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.782,
      iframeLeft: 0,
      iframeTop: -69,
      disableIframeInteraction: false
    },
    "INSTAGRAM.p": {
      containerWidth: 479,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.745,
      iframeLeft: 0,
      iframeTop: -87,
      disableIframeInteraction: false
    },
    "X.platform.embed": {
      containerWidth: 514,
      containerHeight: 600,
      iframeWidth: 550,
      iframeHeight: 640,
      iframeScale: 0.935,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "X": {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 744,
      iframeHeight: 640,
      iframeScale: 1.054,
      iframeLeft: -105,
      iframeTop: 0,
      disableIframeInteraction: false
    }
  };
}

return { getIframesGuidelines };

```


