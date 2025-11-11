





# ViewComponent

```jsx
const { useState, useEffect, useRef } = dc;

// --- CONFIGURATION ---
const SAVE_FILE_PATH = ".datacore/cardpicker/card-deck-state.json";
const scaleFactor = 1.4;

// --- DOM TRAVERSAL UTILITIES ---
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

// --- HELPER FUNCTIONS ---
const createFullDeck = () => {
  const suits = ['♥', '♦', '♣', '♠'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  deck.push({ suit: 'JOKER', rank: 'JOKER', color: '#D32F2F' });
  deck.push({ suit: 'JOKER', rank: 'JOKER', color: '#111' });
  return deck;
};

const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getCardScore = (card) => {
  if (!card) return 0;
  if (card.rank === 'A') return 15;
  if (card.rank === 'K') return 13;
  if (card.rank === 'Q') return 12;
  if (card.rank === 'J') return 11;
  if (card.rank === 'JOKER') return 25;
  return parseInt(card.rank) || 0;
};

// --- STATE PERSISTENCE FUNCTIONS ---
async function saveState(state) {
  if (!dc?.app?.vault?.adapter) {
    console.warn("Datacore context not ready for saving state.");
    return;
  }
  try {
    const dir = SAVE_FILE_PATH.substring(0, SAVE_FILE_PATH.lastIndexOf("/"));
    if (!(await dc.app.vault.adapter.exists(dir))) {
      await dc.app.vault.adapter.mkdir(dir);
    }
    await dc.app.vault.adapter.write(SAVE_FILE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Failed to save card deck state:", error);
  }
}

async function loadState() {
  if (!dc?.app?.vault?.adapter) {
    console.warn("Datacore context not ready for loading state.");
    return null;
  }
  try {
    if (await dc.app.vault.adapter.exists(SAVE_FILE_PATH)) {
      const stateJSON = await dc.app.vault.adapter.read(SAVE_FILE_PATH);
      if (stateJSON) {
        return JSON.parse(stateJSON);
      }
    }
  } catch (error) {
    console.error("Failed to load or parse card deck state:", error);
  }
  return null;
}

async function updateFileState(deck, drawnCard, history, score) {
  const state = { deck, drawnCard, history, score };
  await saveState(state);
}

// --- UI SUB-COMPONENTS ---
const cardWidth = `${150 * scaleFactor}px`;
const cardHeight = `${220 * scaleFactor}px`;
const cardBorderRadius = `${12 * scaleFactor}px`;
const cardPadding = `${10 * scaleFactor}px`;
const cardBoxShadow = `0 ${8 * scaleFactor}px ${24 * scaleFactor}px rgba(155, 135, 245, 0.15), 0 0 ${40 * scaleFactor}px rgba(155, 135, 245, 0.05)`;

function LoadingSpinner() {
  const spinnerStyle = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `;
  return (
    <><style>{spinnerStyle}</style>
    <div style={{ 
      border: '3px solid rgba(155, 135, 245, 0.1)', 
      borderTop: '3px solid rgba(155, 135, 245, 0.4)', 
      borderRadius: '50%', 
      width: '20px', 
      height: '20px', 
      animation: 'spin 1s linear infinite' 
    }}></div></>
  );
}

function PlayingCard({ card }) {
  if (!card) return null;
  const { suit, rank } = card;
  
  // Enigmatic dark card base
  const baseCardStyle = { 
    backgroundColor: '#0a0a0a', 
    border: '1px solid rgba(155, 135, 245, 0.3)', 
    borderRadius: cardBorderRadius, 
    width: cardWidth, 
    height: cardHeight, 
    position: 'relative', 
    fontWeight: '300', 
    boxShadow: cardBoxShadow, 
    userSelect: 'none', 
    boxSizing: 'border-box',
    background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 100%)',
    transition: 'all 0.3s ease',
    overflow: 'hidden'
  };
  
  if (suit === 'JOKER') {
    return (
      <div style={{ 
        ...baseCardStyle,
        border: '1px solid rgba(155, 135, 245, 0.5)',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Mystical background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.05,
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(155, 135, 245, 0.1) 10px, rgba(155, 135, 245, 0.1) 20px)'
        }} />
        
        <dc.Icon icon="sparkles" style={{ fontSize: `${3 * scaleFactor}rem`, color: 'rgba(155, 135, 245, 0.6)', marginBottom: '15px' }} />
        <div style={{ fontSize: `${1.5 * scaleFactor}rem`, color: 'rgba(155, 135, 245, 0.8)', fontWeight: '600', letterSpacing: '8px', textShadow: '0 0 20px rgba(155, 135, 245, 0.4)' }}>JOKER</div>
        <dc.Icon icon="zap" style={{ fontSize: `${2 * scaleFactor}rem`, color: 'rgba(155, 135, 245, 0.6)', marginTop: '15px' }} />
      </div>
    );
  }
  
  // Subtle purple for all suits
  const suitColor = 'rgba(155, 135, 245, 0.7)';
  const glowColor = 'rgba(155, 135, 245, 0.3)';
  
  // Mystical suit icons mapping
  const suitIcons = {
    '♥': 'heart',
    '♦': 'diamond',
    '♣': 'club',
    '♠': 'spade'
  };
  
  return (
    <div style={{ 
      ...baseCardStyle,
      padding: cardPadding
    }}>
      {/* Subtle mystical background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.03,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(155, 135, 245, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(155, 135, 245, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      {/* Mystical corner runes */}
      <div style={{ 
        position: 'absolute', 
        top: `${6 * scaleFactor}px`, 
        left: `${6 * scaleFactor}px`,
        fontSize: `${0.6 * scaleFactor}rem`,
        color: 'rgba(155, 135, 245, 0.2)'
      }}>◈</div>
      <div style={{ 
        position: 'absolute', 
        top: `${6 * scaleFactor}px`, 
        right: `${6 * scaleFactor}px`,
        fontSize: `${0.6 * scaleFactor}rem`,
        color: 'rgba(155, 135, 245, 0.2)'
      }}>◈</div>
      <div style={{ 
        position: 'absolute', 
        bottom: `${6 * scaleFactor}px`, 
        left: `${6 * scaleFactor}px`,
        fontSize: `${0.6 * scaleFactor}rem`,
        color: 'rgba(155, 135, 245, 0.2)'
      }}>◈</div>
      <div style={{ 
        position: 'absolute', 
        bottom: `${6 * scaleFactor}px`, 
        right: `${6 * scaleFactor}px`,
        fontSize: `${0.6 * scaleFactor}rem`,
        color: 'rgba(155, 135, 245, 0.2)'
      }}>◈</div>
      
      {/* Top rank */}
      <div style={{ 
        position: 'absolute', 
        top: `${12 * scaleFactor}px`, 
        left: `${12 * scaleFactor}px`,
        fontSize: `${1.4 * scaleFactor}rem`,
        color: suitColor,
        fontWeight: '300',
        letterSpacing: '1px',
        textShadow: `0 0 10px ${glowColor}`
      }}>{rank}</div>
      
      {/* Center mystical suit symbol using dc.Icon */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <dc.Icon 
          icon={suitIcons[suit] || 'sparkles'} 
          style={{ 
            fontSize: `${5 * scaleFactor}rem`, 
            color: suitColor,
            filter: `drop-shadow(0 0 ${20 * scaleFactor}px ${glowColor}) drop-shadow(0 0 ${40 * scaleFactor}px ${glowColor})`
          }} 
        />
      </div>
      
      {/* Bottom rank (rotated) */}
      <div style={{ 
        position: 'absolute', 
        bottom: `${12 * scaleFactor}px`, 
        right: `${12 * scaleFactor}px`, 
        transform: 'rotate(180deg)',
        fontSize: `${1.4 * scaleFactor}rem`,
        color: suitColor,
        fontWeight: '300',
        letterSpacing: '1px',
        textShadow: `0 0 10px ${glowColor}`
      }}>{rank}</div>
      
      {/* Subtle border glow */}
      <div style={{
        position: 'absolute',
        top: '3px',
        left: '3px',
        right: '3px',
        bottom: '3px',
        border: '1px solid rgba(155, 135, 245, 0.1)',
        borderRadius: `${10 * scaleFactor}px`,
        pointerEvents: 'none'
      }} />
    </div>
  );
}

function CardBack() {
  const cardBackStyle = { 
    backgroundColor: '#0a0a0a',
    background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 100%)',
    border: '1px solid rgba(155, 135, 245, 0.3)', 
    borderRadius: cardBorderRadius, 
    width: cardWidth, 
    height: cardHeight, 
    boxSizing: 'border-box',
    boxShadow: cardBoxShadow,
    position: 'relative',
    overflow: 'hidden'
  };
  
  return (
    <div style={cardBackStyle}>
      {/* Geometric pattern overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.08,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent ${15 * scaleFactor}px, rgba(155, 135, 245, 0.15) ${15 * scaleFactor}px, rgba(155, 135, 245, 0.15) ${16 * scaleFactor}px),
          repeating-linear-gradient(90deg, transparent, transparent ${15 * scaleFactor}px, rgba(155, 135, 245, 0.15) ${15 * scaleFactor}px, rgba(155, 135, 245, 0.15) ${16 * scaleFactor}px)
        `
      }} />
      
      {/* Center mystical symbol */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: `${20 * scaleFactor}px`
      }}>
        <dc.Icon 
          icon="sparkles" 
          style={{ 
            fontSize: `${4 * scaleFactor}rem`, 
            color: 'rgba(155, 135, 245, 0.4)',
            filter: 'drop-shadow(0 0 30px rgba(155, 135, 245, 0.3))'
          }} 
        />
        <div style={{
          display: 'flex',
          gap: `${8 * scaleFactor}px`,
          alignItems: 'center'
        }}>
          <dc.Icon icon="circle" style={{ fontSize: `${0.4 * scaleFactor}rem`, color: 'rgba(155, 135, 245, 0.3)' }} />
          <dc.Icon icon="circle" style={{ fontSize: `${0.4 * scaleFactor}rem`, color: 'rgba(155, 135, 245, 0.3)' }} />
          <dc.Icon icon="circle" style={{ fontSize: `${0.4 * scaleFactor}rem`, color: 'rgba(155, 135, 245, 0.3)' }} />
        </div>
      </div>
      
      {/* Corner ornaments - simpler, cleaner */}
      <div style={{
        position: 'absolute',
        top: `${12 * scaleFactor}px`,
        left: `${12 * scaleFactor}px`,
        fontSize: `${0.7 * scaleFactor}rem`,
        color: 'rgba(155, 135, 245, 0.25)'
      }}>◈</div>
      <div style={{
        position: 'absolute',
        top: `${12 * scaleFactor}px`,
        right: `${12 * scaleFactor}px`,
        fontSize: `${0.7 * scaleFactor}rem`,
        color: 'rgba(155, 135, 245, 0.25)'
      }}>◈</div>
      <div style={{
        position: 'absolute',
        bottom: `${12 * scaleFactor}px`,
        left: `${12 * scaleFactor}px`,
        fontSize: `${0.7 * scaleFactor}rem`,
        color: 'rgba(155, 135, 245, 0.25)'
      }}>◈</div>
      <div style={{
        position: 'absolute',
        bottom: `${12 * scaleFactor}px`,
        right: `${12 * scaleFactor}px`,
        fontSize: `${0.7 * scaleFactor}rem`,
        color: 'rgba(155, 135, 245, 0.25)'
      }}>◈</div>
      
      {/* Subtle inner border */}
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '5px',
        right: '5px',
        bottom: '5px',
        border: '1px solid rgba(155, 135, 245, 0.15)',
        borderRadius: `${10 * scaleFactor}px`,
        pointerEvents: 'none'
      }} />
    </div>
  );
}

// --- MAIN VIEW COMPONENT ---
function BasicView() {
  const [deck, setDeck] = useState([]);
  const [drawnCard, setDrawnCard] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullTab, setIsFullTab] = useState(true);
  
  const containerRef = useRef(null);
  const stateRefs = useRef({}).current;
  const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
  const uniqueWrapperClass = `cardpicker-wrapper-${instanceId}`;

  // Full-tab effect
  useEffect(() => {
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
      original: window.getComputedStyle(contentWrapper).position
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
      overflow: "auto"
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
      Object.keys(stateRefs).forEach(key => stateRefs[key] = null);
    };
  }, [isFullTab]);

  // Initialize deck
  useEffect(() => {
    const initializeDeck = async () => {
      // It now refers to the `dc` from the outer scope.
      if (!dc?.app?.vault?.adapter) {
        console.error("Datacore context is not available on initial load. Component will run in memory-only mode.");
        // We will still create a temporary deck.
        const newDeck = shuffle(createFullDeck());
        setDeck(newDeck);
        setIsLoading(false);
        return;
      }

      const loadedState = await loadState();
      if (loadedState && Array.isArray(loadedState.deck)) {
        setDeck(loadedState.deck);
        setDrawnCard(loadedState.drawnCard);
        setHistory(loadedState.history || []);
        setScore(loadedState.score || 0);
      } else {
        const newDeck = shuffle(createFullDeck());
        const initialState = { deck: newDeck, drawnCard: null, history: [], score: 0 };
        setDeck(initialState.deck);
        setDrawnCard(initialState.drawnCard);
        setHistory(initialState.history);
        setScore(initialState.score);
        await saveState(initialState);
      }
      setIsLoading(false);
    };
    initializeDeck();
  }, []);

  const handleDraw = async () => {
    if (isShuffling || isLoading || deck.length === 0) return;
    const currentDeck = [...deck];
    const cardDrawn = currentDeck.pop();
    const newScore = score + getCardScore(cardDrawn);
    const newHistory = [...history, cardDrawn];
    setDeck(currentDeck);
    setDrawnCard(cardDrawn);
    setHistory(newHistory);
    setScore(newScore);
    await updateFileState(currentDeck, cardDrawn, newHistory, newScore);
  };

  const handleReset = async () => {
    if (isLoading || isShuffling) return;
    setIsShuffling(true);
    setTimeout(async () => {
      const newDeck = shuffle(createFullDeck());
      setDeck(newDeck);
      setDrawnCard(null);
      setHistory([]);
      setScore(0);
      await updateFileState(newDeck, null, [], 0);
      setIsShuffling(false);
    }, 900);
  };

  const isDisabled = isShuffling || isLoading;

  const historyCardStyle = `
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
    .history-scroll-container::-webkit-scrollbar { height: 8px; }
    .history-scroll-container::-webkit-scrollbar-track { background: rgba(10, 10, 10, 0.5); border-radius: 4px; border: 1px solid rgba(155, 135, 245, 0.1); }
    .history-scroll-container::-webkit-scrollbar-thumb { background: rgba(155, 135, 245, 0.3); border-radius: 4px; }
    .history-scroll-container::-webkit-scrollbar-thumb:hover { background: rgba(155, 135, 245, 0.5); }
    .history-card-wrapper { 
      margin-right: ${12 * scaleFactor}px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }
    .history-card-wrapper:last-child { margin-right: 0; }
    .history-card-wrapper:hover { 
      transform: translateY(-${20 * scaleFactor}px) scale(1.05);
      z-index: 100;
      filter: brightness(1.2);
    }
    .history-card-inner { 
      transform: scale(0.6);
      transform-origin: center;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;

  const buttonStyle = {
    padding: '12px 24px',
    backgroundColor: 'rgba(155, 135, 245, 0.15)',
    border: '1px solid rgba(155, 135, 245, 0.3)',
    borderRadius: '6px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '44px'
  };

  const buttonHoverStyle = {
    backgroundColor: 'rgba(155, 135, 245, 0.25)',
    borderColor: 'rgba(155, 135, 245, 0.5)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(155, 135, 245, 0.2)'
  };

  // Compact mode view
  if (!isFullTab) {
    return (
      <div ref={containerRef} style={{
        padding: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        border: "1px dashed rgba(155, 135, 245, 0.3)",
        borderRadius: "8px",
        backgroundColor: "rgba(10, 10, 10, 0.5)"
      }}>
        <p style={{ margin: 0, color: "rgba(155, 135, 245, 0.6)", fontSize: "14px", fontWeight: '300' }}>
          Mystical Cards in compact mode
        </p>
        <button
          style={{
            ...buttonStyle,
            cursor: 'pointer'
          }}
          onClick={() => setIsFullTab(true)}
          onMouseEnter={(e) => Object.assign(e.target.style, buttonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}
        >
          <dc.Icon icon="maximize-2" style={{ fontSize: '14px' }} />
          Enter Full Tab
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ 
      height: '100%', 
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{historyCardStyle}</style>
      <div style={{ 
        height: "100%", 
        width: "100%", 
        padding: "30px", 
        backgroundColor: '#0a0a0a',
        border: "1px solid rgba(155, 135, 245, 0.2)", 
        borderRadius: "12px", 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '30px', 
        alignItems: 'center', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 8px 32px rgba(155, 135, 245, 0.1)',
        background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 100%)',
        position: 'relative',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }} className={uniqueWrapperClass}>
      
      {/* Exit Full Tab Icon */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          right: "20px",
          fontFamily: "monospace",
          fontSize: "18px",
          color: "rgba(155, 135, 245, 0.6)",
          userSelect: "none",
          cursor: "pointer",
          opacity: 0,
          transform: "scale(0.9)",
          transition: "opacity 0.2s, transform 0.2s",
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        className="subtle-icon"
        onClick={() => setIsFullTab(false)}
        title="Exit Full Tab"
      >
        <dc.Icon icon="minimize-2" style={{ fontSize: '16px' }} />
        <span>&lt;/&gt;</span>
      </div>
      
      {/* Control section */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center',
        paddingBottom: '30px',
        borderBottom: '1px solid rgba(155, 135, 245, 0.15)'
      }}>
        {/* Title row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px'
        }}>
          <dc.Icon icon="sparkles" style={{ fontSize: '2rem', color: 'rgba(155, 135, 245, 0.6)' }} />
          <h2 style={{
            margin: 0,
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '1.8rem',
            fontWeight: '300',
            textShadow: '0 0 20px rgba(155, 135, 245, 0.3)',
            letterSpacing: '4px'
          }}>
            MYSTICAL CARDS
          </h2>
          <dc.Icon icon="moon" style={{ fontSize: '2rem', color: 'rgba(155, 135, 245, 0.6)' }} />
        </div>
        
        {/* Control buttons row */}
        <div style={{ 
          display: 'flex', 
          gap: '15px',
          alignItems: 'stretch', 
          flexWrap: 'wrap', 
          justifyContent: 'center' 
        }}>
        <button 
          onClick={handleDraw} 
          disabled={isDisabled || deck.length === 0}
          style={{
            ...buttonStyle,
            opacity: (isDisabled || deck.length === 0) ? 0.4 : 1,
            cursor: (isDisabled || deck.length === 0) ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isDisabled && deck.length > 0) {
              Object.assign(e.target.style, buttonHoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            Object.assign(e.target.style, buttonStyle);
          }}
        >
          <dc.Icon icon="sparkles" style={{ fontSize: '16px' }} />
          Draw Card
        </button>
        
        <button 
          onClick={handleReset} 
          disabled={isDisabled} 
          style={{ 
            ...buttonStyle,
            minWidth: '200px',
            opacity: isDisabled ? 0.4 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              Object.assign(e.target.style, { ...buttonStyle, ...buttonHoverStyle });
            }
          }}
          onMouseLeave={(e) => {
            Object.assign(e.target.style, buttonStyle);
          }}
        >
          {isShuffling ? <LoadingSpinner /> : <><dc.Icon icon="shuffle" style={{ fontSize: '16px' }} /> Shuffle & Reset</>}
        </button>
        
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          disabled={isDisabled || history.length === 0}
          style={{
            ...buttonStyle,
            opacity: (isDisabled || history.length === 0) ? 0.4 : 1,
            cursor: (isDisabled || history.length === 0) ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isDisabled && history.length > 0) {
              Object.assign(e.target.style, buttonHoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            Object.assign(e.target.style, buttonStyle);
          }}
        >
          <dc.Icon icon={showHistory ? 'eye-off' : 'eye'} style={{ fontSize: '16px' }} />
          {showHistory ? 'Hide' : 'Show'} History ({history.length})
        </button>
        
        <div style={{
          fontSize: "1.1rem", 
          fontWeight: "300",
          color: 'rgba(255, 255, 255, 0.9)',
          backgroundColor: 'rgba(26, 26, 26, 0.8)',
          padding: '0 24px',
          borderRadius: '6px',
          border: '1px solid rgba(155, 135, 245, 0.3)',
          boxShadow: '0 0 20px rgba(155, 135, 245, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          letterSpacing: '1px',
          height: '44px'
        }}>
          <dc.Icon icon="zap" style={{ fontSize: '18px', color: 'rgba(155, 135, 245, 0.7)' }} />
          Score: <span style={{ color: 'rgba(155, 135, 245, 0.9)', fontWeight: '500' }}>{score}</span>
        </div>
        </div>
      </div>
      
      {isLoading ? (
        <div style={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '350px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <LoadingSpinner />
          <div style={{ 
            color: 'rgba(155, 135, 245, 0.6)', 
            fontSize: '14px',
            fontWeight: '300',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <dc.Icon icon="loader" style={{ fontSize: '16px' }} />
            Summoning mystical cards...
          </div>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'flex', 
            gap: `${80 * scaleFactor}px`, 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexGrow: 1, 
            paddingBottom: '30px', 
            width: '100%' 
          }}>
            {/* Deck section */}
            <div style={{ 
              textAlign: 'center', 
              opacity: isShuffling ? 0.5 : 1, 
              transition: 'opacity 0.3s',
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(26, 26, 26, 0.3)',
              border: '1px solid rgba(155, 135, 245, 0.15)'
            }}>
              <h4 style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '1rem',
                marginBottom: '15px',
                fontWeight: '300',
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <dc.Icon icon="layers" style={{ fontSize: '18px', color: 'rgba(155, 135, 245, 0.6)' }} />
                DECK <span style={{ color: 'rgba(155, 135, 245, 0.7)', fontWeight: '400' }}>({deck.length})</span>
              </h4>
              <div 
                style={{ 
                  cursor: deck.length > 0 && !isDisabled ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease',
                  transform: deck.length > 0 && !isDisabled ? 'scale(1)' : 'scale(0.95)'
                }} 
                onClick={handleDraw}
                onMouseEnter={(e) => {
                  if (deck.length > 0 && !isDisabled) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {deck.length > 0 ? (
                  <CardBack />
                ) : (
                  <div style={{ 
                    width: cardWidth, 
                    height: cardHeight, 
                    border: '1px dashed rgba(155, 135, 245, 0.2)', 
                    borderRadius: cardBorderRadius,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    backgroundColor: 'rgba(10, 10, 10, 0.5)',
                    color: 'rgba(155, 135, 245, 0.4)',
                    fontSize: '0.9rem',
                    fontWeight: '300'
                  }}>
                    <dc.Icon icon="circle-off" style={{ fontSize: '2rem', opacity: 0.5 }} />
                    Empty
                  </div>
                )}
              </div>
            </div>
            
            {/* Last drawn section */}
            <div style={{ 
              textAlign: 'center',
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(26, 26, 26, 0.3)',
              border: '1px solid rgba(155, 135, 245, 0.15)'
            }}>
              <h4 style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '1rem',
                marginBottom: '15px',
                fontWeight: '300',
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <dc.Icon icon="star" style={{ fontSize: '18px', color: 'rgba(155, 135, 245, 0.6)' }} />
                LAST DRAWN
              </h4>
              {isShuffling ? (
                <div style={{ 
                  width: cardWidth, 
                  height: cardHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LoadingSpinner />
                </div>
              ) : (
                drawnCard ? (
                  <PlayingCard card={drawnCard} />
                ) : (
                  <div style={{ 
                    width: cardWidth, 
                    height: cardHeight, 
                    border: '1px dashed rgba(155, 135, 245, 0.2)', 
                    borderRadius: cardBorderRadius,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    backgroundColor: 'rgba(10, 10, 10, 0.5)',
                    color: 'rgba(155, 135, 245, 0.4)',
                    fontSize: '0.9rem',
                    fontWeight: '300'
                  }}>
                    <dc.Icon icon="minus-circle" style={{ fontSize: '2rem', opacity: 0.5 }} />
                    No card drawn
                  </div>
                )
              )}
            </div>
          </div>
          {showHistory && (
            <div style={{
              width: "100%", 
              paddingTop: "25px", 
              borderTop: '1px solid rgba(155, 135, 245, 0.15)'
            }}>
              <div style={{
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 10px'
              }}>
                <h4 style={{
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  fontWeight: '300',
                  letterSpacing: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <dc.Icon icon="history" style={{ fontSize: '18px', color: 'rgba(155, 135, 245, 0.6)' }} />
                  HISTORY
                </h4>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(155, 135, 245, 0.6)',
                  fontWeight: '300',
                  letterSpacing: '1px'
                }}>
                  {history.length} {history.length === 1 ? 'card' : 'cards'}
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(10, 10, 10, 0.3)',
                borderRadius: '8px',
                padding: `${30 * scaleFactor}px ${20 * scaleFactor}px`,
                border: '1px solid rgba(155, 135, 245, 0.1)'
              }}>
                <div className="history-scroll-container" style={{ 
                  display: 'flex', 
                  flexWrap: 'nowrap', 
                  overflowX: 'auto', 
                  overflowY: 'visible',
                  padding: `${40 * scaleFactor}px ${10 * scaleFactor}px ${20 * scaleFactor}px`,
                  gap: 0,
                  alignItems: 'center'
                }}>
                  {history.slice().reverse().map((card, index) => (
                    <div key={index} className="history-card-wrapper">
                      <div className="history-card-inner">
                        <PlayingCard card={card} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                marginTop: '15px',
                color: 'rgba(155, 135, 245, 0.4)',
                fontSize: '0.8rem',
                fontWeight: '300',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <dc.Icon icon="info" style={{ fontSize: '12px' }} />
                Hover cards to preview
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

return { BasicView };
```


