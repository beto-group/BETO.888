



# ViewComponent

```jsx
// FILE: ViewComponent.jsx
// (Using the last known good version from our previous exchanges)
const componentFile = "_OPERATION/PRIVATE/DATACORE/19 IframePlayer/D.q.iframeplayer.component.md"; // Or v2.md if you named the file that

const { getIframesGuidelines } = await dc.require(
  dc.headerLink(componentFile, "IframesGuidelines")
);
const {
  getGuidelinesForUrl,
  useResizeObserver,
  useWindowResize,
  IframeContainer,
} = await dc.require(dc.headerLink(componentFile, "UtilityFunctions")); // Or whatever your utility file is named

/**
 * Main View Component
 */
function View({ initialUrl = "https://www.youtube.com/watch?v=KHh5dXmaBmw" }) { // <--- initialUrl is a prop
  const { useState, useEffect, useRef, useCallback } = dc;

  // ... (rest of the component logic remains the same)
  // It will use the 'initialUrl' prop passed to it.
  // If no prop is passed, it will use the default value.

  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(600);
  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeIntrinsicWidth, setIframeIntrinsicWidth] = useState(800);
  const [iframeIntrinsicHeight, setIframeIntrinsicHeight] = useState(600);
  const [iframeScale, setIframeScale] = useState(1);
  const [iframeLeft, setIframeLeft] = useState(0);
  const [iframeTop, setIframeTop] = useState(0);

  const viewContainerRef = useRef(null);
  const iframeWrapperRef = useRef(null);
  const originalGuidelineValuesRef = useRef(null);
  const guidelinesAppliedRef = useRef(false);
  const isMountedRef = useRef(false);

  const updateDimensions = useCallback((newObservedContainerWidth) => {
    if (!isMountedRef.current || newObservedContainerWidth <= 0) return;

    if (guidelinesAppliedRef.current && originalGuidelineValuesRef.current) {
      const {
        containerWidth: origCW, containerHeight: origCH,
        iframeWidth: origIW, iframeHeight: origIH,
        iframeScale: origIS, iframeLeft: origIL, iframeTop: origIT,
      } = originalGuidelineValuesRef.current;

      if (origCW <= 0) {
        guidelinesAppliedRef.current = false;
        originalGuidelineValuesRef.current = null;
        updateDimensions(newObservedContainerWidth);
        return;
      }

      const widthRatio = newObservedContainerWidth / origCW;
      setContainerWidth(newObservedContainerWidth);
      setContainerHeight(Math.round(origCH * widthRatio));
      setIframeIntrinsicWidth(origIW);
      setIframeIntrinsicHeight(origIH);
      setIframeScale(parseFloat((origIS * widthRatio).toFixed(3)));
      setIframeLeft(Math.round(origIL * widthRatio));
      setIframeTop(Math.round(origIT * widthRatio));
    } else {
      const defaultAspectRatio = 9 / 16;
      const newContainerH = Math.round(newObservedContainerWidth * defaultAspectRatio);
      setContainerWidth(newObservedContainerWidth);
      setContainerHeight(newContainerH);
      setIframeIntrinsicWidth(newObservedContainerWidth);
      setIframeIntrinsicHeight(newContainerH);
      setIframeScale(1);
      setIframeLeft(0);
      setIframeTop(0);
    }
  }, []);

  const applyGuidelines = useCallback((urlToLoad) => {
    const guidelines = getGuidelinesForUrl(urlToLoad, getIframesGuidelines);

    if (guidelines) {
      originalGuidelineValuesRef.current = { ...guidelines };
      guidelinesAppliedRef.current = true;
      setContainerWidth(guidelines.containerWidth);
      setContainerHeight(guidelines.containerHeight);
      setIframeIntrinsicWidth(guidelines.iframeWidth);
      setIframeIntrinsicHeight(guidelines.iframeHeight);
      setIframeScale(guidelines.iframeScale);
      setIframeLeft(guidelines.iframeLeft);
      setIframeTop(guidelines.iframeTop);

      const currentObservedWidth = viewContainerRef.current?.offsetWidth;
      if (isMountedRef.current && currentObservedWidth && currentObservedWidth > 0) {
          updateDimensions(currentObservedWidth);
      } else if (isMountedRef.current) {
          updateDimensions(document.documentElement.clientWidth || window.innerWidth || guidelines.containerWidth);
      }
    } else {
      guidelinesAppliedRef.current = false;
      originalGuidelineValuesRef.current = null;
      if (isMountedRef.current) {
        const currentObservedWidth = viewContainerRef.current?.offsetWidth;
        if (currentObservedWidth && currentObservedWidth > 0) {
          updateDimensions(currentObservedWidth);
        } else {
          updateDimensions(document.documentElement.clientWidth || window.innerWidth || 800);
        }
      }
    }
  }, [updateDimensions]);

  useEffect(() => {
    isMountedRef.current = true;

    if (initialUrl) { // This 'initialUrl' is the prop
      setIframeSrc(initialUrl);
      applyGuidelines(initialUrl);
    } else {
      setIframeSrc("");
      guidelinesAppliedRef.current = false;
      originalGuidelineValuesRef.current = null;
      const currentObservedWidth = viewContainerRef.current?.offsetWidth;
      if (currentObservedWidth && currentObservedWidth > 0) {
        updateDimensions(currentObservedWidth);
      } else {
        updateDimensions(document.documentElement.clientWidth || window.innerWidth || 800);
      }
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [initialUrl, applyGuidelines, updateDimensions]); // 'initialUrl' is a dependency

  useResizeObserver(viewContainerRef, updateDimensions);
  useWindowResize(updateDimensions);

  return (
    <div
      ref={viewContainerRef}
      style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}
    >
      <div style={{ flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "10px 0" }}>
        {iframeSrc && (
          <IframeContainer
            width={containerWidth} height={containerHeight}
            iframeSrc={iframeSrc}
            iframeWidth={iframeIntrinsicWidth} iframeHeight={iframeIntrinsicHeight}
            iframeScale={iframeScale} iframeLeft={iframeLeft} iframeTop={iframeTop}
            iframeWrapperRef={iframeWrapperRef}
          />
        )}
      </div>
    </div>
  );
}
// Make sure you are exporting View from this file correctly for dc.require
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
const componentFile = "_OPERATION/PRIVATE/DATACORE/19 IframePlayer/D.q.iframeplayer.component.md";

// Import the guidelines (remains unchanged)
// Renamed for clarity if used locally, or use original name if preferred
const { getIframesGuidelines: getIframesGuidelinesImport } = await dc.require(dc.headerLink(componentFile, "IframesGuidelines"));

/** Utility Functions **/

function transformUrl(url) {
  if (!url) return "";
  const lower = url.toLowerCase();
  try {
    if (lower.includes("youtube.com/watch")) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (videoId) return "https://www.youtube.com/embed/" + videoId;
    } else if (lower.includes("youtu.be/")) {
      const parts = url.split("/");
      const videoId = parts[parts.length - 1];
      if (videoId) return "https://www.youtube.com/embed/" + videoId;
    }
  } catch (e) {
    console.error("URL transformation error:", e);
  }
  return url;
}

// Pass the actual guidelines getter function
function getGuidelinesForUrl(url, guidelinesGetter) {
  const guidelines = guidelinesGetter(); // Call the passed getter
  const lowerUrl = url.toLowerCase();
  let key = "WEBSITES";

  if (lowerUrl.includes("facebook.com/reel") || lowerUrl.includes("facebook.com/plugins/vid")) key = "FACEBOOK.reel";
  else if (lowerUrl.includes("facebook.com/watch?v=")) key = "FACEBOOK.video";
  else if (lowerUrl.includes("facebook.com")) key = "FACEBOOK";
  else if (lowerUrl.includes("warpcast")) key = "WARPCAST";
  else if (lowerUrl.includes("snapchat.com")) key = "SNAPCHAT";
  else if ((lowerUrl.includes("youtube.com") && lowerUrl.includes("/shorts")) || (lowerUrl.includes("youtu.be") && lowerUrl.includes("shorts"))) key = "YOUTUBE.shorts";
  else if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) key = "YOUTUBE";
  else if (lowerUrl.includes("tiktok.com/embed")) key = "TIKTOK.embed";
  else if (lowerUrl.includes("tiktok.com")) key = "TIKTOK";
  else if (lowerUrl.includes("reddit.com")) key = "REDDIT";
  else if (lowerUrl.includes("linkedin.com")) key = "LINKEDIN";
  else if (lowerUrl.includes("instagram.com/reel") && lowerUrl.endsWith("/embed")) key = "INSTAGRAM.embed";
  else if (lowerUrl.includes("instagram.com/p") && lowerUrl.endsWith("/embed")) key = "INSTAGRAM.p.embed";
  else if (lowerUrl.includes("instagram.com/p")) key = "INSTAGRAM.p";
  else if (lowerUrl.includes("instagram.com")) key = "INSTAGRAM";
  else if (lowerUrl.includes("platform.twitter.com/embed") || lowerUrl.includes("platform.x.com/embed")) key = "X.platform.embed";
  else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) key = "X";
  
  return guidelines[key];
}

/** Custom Hooks **/

function useResizeObserver(containerRef, updateDimensions) {
  const { useEffect, useRef } = dc;
  const observerInstanceRef = useRef(null); 

  useEffect(() => {
    // Ensure updateDimensions is a function before proceeding
    if (typeof updateDimensions !== 'function') {
        // console.warn("useResizeObserver: updateDimensions is not a function.");
        return;
    }

    if (containerRef.current && typeof ResizeObserver !== "undefined") {
      // console.log("Attaching ResizeObserver");
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.contentRect.width > 0) {
            // console.log("ResizeObserver: new container width =", entry.contentRect.width);
            updateDimensions(entry.contentRect.width); // Call the passed callback
          }
        }
      });
      observer.observe(containerRef.current);
      observerInstanceRef.current = observer;
      return () => {
        // console.log("Disconnecting ResizeObserver.");
        observer.disconnect();
        observerInstanceRef.current = null;
      };
    }
  }, [containerRef, updateDimensions]); // Key dependencies

  // No need to return observerInstanceRef if ViewComponent doesn't use it
}

function useWindowResize(updateDimensions) {
  const { useEffect } = dc;
  useEffect(() => {
    // Ensure updateDimensions is a function
    if (typeof updateDimensions !== 'function') {
        // console.warn("useWindowResize: updateDimensions is not a function.");
        return;
    }

    const handleResize = () => {
      const newWidth = document.documentElement.clientWidth || window.innerWidth;
      if (newWidth > 0) {
        // console.log("Window resize: new width =", newWidth);
        updateDimensions(newWidth); // Call the passed callback
      }
    };
    
    window.addEventListener("resize", handleResize);
    // Initial call to set dimensions based on current window size
    // This might be slightly delayed due to hook execution order,
    // ensure it's called after updateDimensions is stable.
    // updateDimensions should be memoized in the parent.
    handleResize(); 

    return () => {
      // console.log("Removing window resize listener.");
      window.removeEventListener("resize", handleResize);
    };
  }, [updateDimensions]); // Key dependency
}

/** Sub‑Components **/
function IframeContainer({
  width, height, iframeSrc, iframeWidth, iframeHeight,
  iframeScale, iframeLeft, iframeTop,
  // disableIframeInteraction prop is not used for pointer-events logic here
  iframeWrapperRef
}) {
  return (
    <div
      style={{
        position: "relative",
        width: width + "px",
        height: height + "px",
        border: "1px solid var(--background-modifier-border, #ccc)",
        backgroundColor: "var(--background-primary, white)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        margin: "0 auto" // Centers the IframeContainer if its parent is wider
      }}
    >
      <div
        ref={iframeWrapperRef}
        style={{
          position: "absolute",
          left: iframeLeft + "px",
          top: iframeTop + "px",
          width: iframeWidth + "px",    // This is the unscaled intrinsic width of the iframe content
          height: iframeHeight + "px",  // This is the unscaled intrinsic height
          pointerEvents: "auto",        // Always allow interaction
          transform: `scale(${iframeScale})`,
          transformOrigin: "top left",
        }}
      >
        {transformUrl(iframeSrc) ? (
          <iframe
            src={transformUrl(iframeSrc)}
            title="Controlled iFrame"
            // These width/height attributes set the iframe document's viewport size.
            // For responsive scaling via CSS transform, these often match the `iframeWidth` and `iframeHeight` above.
            width={iframeWidth} 
            height={iframeHeight}
            loading="lazy"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{
              border: "none",
              // The iframe should fill its wrapper, which is being scaled.
              display: "block", // Good practice for iframes
              width: "100%", 
              height: "100%",
            }}
          ></iframe>
        ) : null}
      </div>
    </div>
  );
}

return { transformUrl, getGuidelinesForUrl, useResizeObserver, useWindowResize, IframeContainer };
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


