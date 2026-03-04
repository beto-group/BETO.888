const { useRef, useState, useEffect } = dc;

/**
 * Optical Illusion UI Component
 */
function OpticalIllusionComponent({ onCodeReloadRequest, isFullTab, onToggleFullTab, domUtils, styles, ControlsMenu }) {
  const STYLES = styles;

  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `interactive-wrapper-${instanceId}`;
  const scrollContainerRef = useRef(null);

  const opticalIllusionStyle = `
  .${uniqueWrapperClass} {
    --clr-bg: #000000;
    --stripe-col: #ffffff;
    background-color: var(--clr-bg);
    font-family: "Jura", system-ui, sans-serif;
    color: white;
    height: 100%;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  /* Scrollable layer */
  .${uniqueWrapperClass} .scroll-container {
    height: 100%;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-timeline-name: --optical-scroll;
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .${uniqueWrapperClass} .scroll-container::-webkit-scrollbar {
    display: none;
  }

  @property --x{
    syntax: "<percentage>";
    inherits: true;
    initial-value: 0%;
  }

  .${uniqueWrapperClass} .optical {
    position: sticky;
    top: 50%;
    transform: translateY(-50%);
    margin: 0 auto;
    width: 400px;
    aspect-ratio: 1;
    background-size: cover;
    background-repeat: no-repeat;
    filter: invert(1) hue-rotate(180deg);
  
    animation-name: --body-scroll;
    animation-duration: 1ms;
    animation-timing-function: linear;
    animation-timeline: --optical-scroll;
  }

  /* ground level */
  .${uniqueWrapperClass} .optical::before {
    content: '';
    position: absolute;
    inset: auto -50px var(--ground-y, 0);
    height: 1px;
    background: radial-gradient(rgba(202, 172, 241, 0.8), transparent);
    z-index: 2;
  }

  /* stripes */
  .${uniqueWrapperClass} .optical::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
      90deg,
      var(--stripe-col) 0 80%,
      transparent 0 100%
    );
    background-size: var(--stripe-px) 100%;
    background-repeat: repeat;
    background-position-x: var(--x);
  }

  @keyframes --body-scroll {
    from { --x: 0%; }
    to   { --x: 100%; }
  }

  .${uniqueWrapperClass}:has(#option-1-${instanceId}:checked) .optical {
    --stripe-px: 6px;
    --ground-y: -1px;
    aspect-ratio: 1;
    background-image: url("https://raw.githubusercontent.com/cbolson/assets/refs/heads/main/codepen/optical/man-running.png");
  }
  .${uniqueWrapperClass}:has(#option-2-${instanceId}:checked) .optical {
     --stripe-px: 7.2px;
    --ground-y: 30px;
    aspect-ratio: 6/4;
    background-image: url("https://raw.githubusercontent.com/cbolson/assets/refs/heads/main/codepen/optical/cat-running.png");
  }
  .${uniqueWrapperClass}:has(#option-3-${instanceId}:checked) .optical {
     --stripe-px: 7px;
    --ground-y: 10px;
    aspect-ratio: 6/4;
    background-image: url("https://raw.githubusercontent.com/cbolson/assets/refs/heads/main/codepen/optical/bmx.png");
  }

  /* Controls layer */
  .${uniqueWrapperClass} .controls {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 1.5rem;
    font-size: .9rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: .5em 1.5em;
    background-color: rgba(20, 20, 20, 0.8); 
    border-radius: 8px;
    backdrop-filter: blur(4px);
    z-index: 100;
  }
  .${uniqueWrapperClass} .controls label {
    display: flex;
    align-items: center;
    gap: .4rem;
    transition: color 150ms ease-in-out;
    cursor: pointer;
  }
  .${uniqueWrapperClass} .controls label:hover {
    color: #4da6ff;
  }

  .${uniqueWrapperClass} .mouse {
    position: absolute;
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
    display: none;
    width: 40px;
    height: 40px;
    opacity: 1;
    color: rgba(255, 255, 255, 0.6);
    animation-name: mouse-fade;
    animation-duration: 1s;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
    animation-timeline: --optical-scroll;
    z-index: 10;
    pointer-events: none;
  }

  @supports (animation-timeline: scroll()) {
    .${uniqueWrapperClass} .mouse {
      display: block;
    }
  }

  @keyframes mouse-fade {
    75% { opacity: 1; }
    100% { opacity: 0; }
  }

  .controls-menu {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    z-index: 1000;
  }
  .controls-menu:hover {
    opacity: 1;
  }

  `;

  // Infinite Scroll Logic
  useEffect(() => {
    if (!isFullTab) return;
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

      // If we reach the bottom, instantly jump back towards the top
      // We leave a small buffer so the transition feels seamless
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        scrollContainer.scrollTop = 100;
      }
      // If we scroll to the very top, jump down
      else if (scrollTop <= 10) {
        scrollContainer.scrollTop = scrollHeight - clientHeight - 100;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    // Initial jump to allow scrolling up
    scrollContainer.scrollTop = 100;

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isFullTab]);

  if (!isFullTab) {
    return (
      <div style={STYLES.compactWrapper} className={uniqueWrapperClass}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={STYLES.subtitle}><strong>Optical Illusion</strong> ({instanceId})</span>
          <div
            style={STYLES.iconButton}
            onClick={onToggleFullTab}
            title="Enter Full Mode"
          >
            <dc.Icon icon="maximize" style={{ width: "16px", height: "16px" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <style>{opticalIllusionStyle}</style>
      <div className={uniqueWrapperClass}>

        {/* Top Right Controls from Boilerplate */}
        <ControlsMenu
          onReload={onCodeReloadRequest}
          onToggle={onToggleFullTab}
          styles={STYLES}
        />

        {/* Fixed controls layer (UI) */}
        <div className="controls">
          <label htmlFor={`option-1-${instanceId}`}>
            <input type="radio" id={`option-1-${instanceId}`} name={`img-${instanceId}`} defaultChecked />
            Runner
          </label>
          <label htmlFor={`option-2-${instanceId}`}>
            <input type="radio" id={`option-2-${instanceId}`} name={`img-${instanceId}`} />
            Cheetah
          </label>
          <label htmlFor={`option-3-${instanceId}`}>
            <input type="radio" id={`option-3-${instanceId}`} name={`img-${instanceId}`} />
            BMX Tricks
          </label>
        </div>

        {/* Mouse scroll indicator */}
        <div className="mouse">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M6 3m0 4a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-4a4 4 0 0 1 -4 -4z" />
            <path d="M12 7l0 4" />
            <path d="M8 26l4 4l4 -4">
              <animateTransform attributeType="XML" attributeName="transform" type="translate" values="0 0; 0 4; 0 0" dur="1s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>

        {/* Scrollable Document Layer */}
        <div className="scroll-container" ref={scrollContainerRef}>
          <div className="optical"></div>
          {/* Extremely tall invisible element to force scrolling */}
          <div style={{ height: '500vh', width: '100%' }}></div>
        </div>

      </div>
    </div>
  );
}

return { OpticalIllusionComponent };