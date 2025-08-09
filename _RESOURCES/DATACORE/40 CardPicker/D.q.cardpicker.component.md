





# ViewComponent

```jsx
const { useState, useEffect } = dc;

// --- CONFIGURATION ---
const SAVE_FILE_PATH = ".datacore/cardpicker/card-deck-state.json";
const scaleFactor = 1.4;

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
const cardBoxShadow = `0 ${8 * scaleFactor}px ${16 * scaleFactor}px rgba(0,0,0,0.3)`;

function LoadingSpinner() {
  const spinnerStyle = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  return (<><style>{spinnerStyle}</style><div style={{ border: '4px solid rgba(255, 255, 255, 0.3)', borderTop: '4px solid #fff', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}></div></>);
}

function PlayingCard({ card }) {
  if (!card) return null;
  const { suit, rank, color: jokerColor } = card;
  const baseCardStyle = { backgroundColor: 'white', border: '1px solid #ccc', borderRadius: cardBorderRadius, width: cardWidth, height: cardHeight, position: 'relative', fontWeight: 'bold', boxShadow: cardBoxShadow, userSelect: 'none', boxSizing: 'border-box' };
  if (suit === 'JOKER') {
    return (<div style={{ ...baseCardStyle, color: jokerColor, padding: cardPadding, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}><div style={{ fontSize: `${1.2 * scaleFactor}rem` }}>J</div><div style={{ fontSize: `${1.2 * scaleFactor}rem` }}>O</div><div style={{ fontSize: `${1.2 * scaleFactor}rem` }}>K</div><div style={{ fontSize: `${1.2 * scaleFactor}rem` }}>E</div><div style={{ fontSize: `${1.2 * scaleFactor}rem` }}>R</div></div>);
  }
  const color = ['♥', '♦'].includes(suit) ? '#D32F2F' : '#111';
  return (
    <div style={{ ...baseCardStyle, color: color, padding: cardPadding, fontSize: `${1.8 * scaleFactor}rem` }}>
      <div style={{ position: 'absolute', top: `${10 * scaleFactor}px`, left: `${15 * scaleFactor}px` }}>{rank}</div>
      <div style={{ position: 'absolute', top: `${38 * scaleFactor}px`, left: `${15 * scaleFactor}px` }}>{suit}</div>
      <div style={{ fontSize: `${5 * scaleFactor}rem`, textAlign: 'center', lineHeight: cardHeight }}>{suit}</div>
      <div style={{ position: 'absolute', bottom: `${10 * scaleFactor}px`, right: `${15 * scaleFactor}px`, transform: 'rotate(180deg)' }}>{rank}</div>
      <div style={{ position: 'absolute', bottom: `${38 * scaleFactor}px`, right: `${15 * scaleFactor}px`, transform: 'rotate(180deg)' }}>{suit}</div>
    </div>
  );
}

function CardBack() {
  const cardBackStyle = { backgroundColor: '#2A52BE', border: '1px solid #ccc', borderRadius: cardBorderRadius, width: cardWidth, height: cardHeight, boxSizing: 'border-box', backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,0.1) 25%, #2A52BE 25%)', backgroundSize: `${15 * scaleFactor}px ${15 * scaleFactor}px`, boxShadow: cardBoxShadow };
  return <div style={cardBackStyle}></div>;
}

// --- MAIN VIEW COMPONENT ---
// FIX #1: The function no longer expects `dc` as a prop.
function BasicView() {
  const [deck, setDeck] = useState([]);
  const [drawnCard, setDrawnCard] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // FIX #2: The dependency array is now empty, so this runs exactly once.
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
    .history-scroll-container::-webkit-scrollbar { height: 8px; }
    .history-scroll-container::-webkit-scrollbar-track { background: #2d2d2d; border-radius: 4px; }
    .history-scroll-container::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    .history-scroll-container::-webkit-scrollbar-thumb:hover { background: #777; }
    .history-card-wrapper { margin-left: -${150 * scaleFactor * 0.75}px; transition: transform 0.3s ease-out; transform-origin: center bottom; }
    .history-card-wrapper:first-child { margin-left: 0; }
    .history-card-wrapper:hover { transform: translateY(-60px); z-index: 100; }
    .history-card-inner { transform: scale(0.5); transform-origin: center bottom; transition: transform 0.3s ease-out; }
    .history-card-wrapper:hover .history-card-inner { transform: scale(1); }
  `;

  return (
    <div style={{ height: "auto", width: "100%", padding: "20px", border: "2px solid white", borderRadius: "8px", display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', fontFamily: 'sans-serif' }}>
      <style>{historyCardStyle}</style>
      <div style={{ display: 'flex', gap: '15px', paddingBottom: '20px', borderBottom: '1px solid #444', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={handleDraw} disabled={isDisabled || deck.length === 0}>Draw Card</button>
        <button onClick={handleReset} disabled={isDisabled} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '180px', minHeight: '36px' }}>
          {isShuffling ? <LoadingSpinner /> : 'Shuffle & Reset Deck'}
        </button>
        <button onClick={() => setShowHistory(!showHistory)} disabled={isDisabled || history.length === 0}>
          {showHistory ? 'Hide' : 'Show'} History ({history.length})
        </button>
        <div style={{fontSize: "1.2rem", fontWeight: "bold"}}>Score: {score}</div>
      </div>
      {isLoading ? (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}><LoadingSpinner /></div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: `${80 * scaleFactor}px`, justifyContent: 'center', alignItems: 'center', flexGrow: 1, paddingBottom: '20px', width: '100%' }}>
            <div style={{ textAlign: 'center', opacity: isShuffling ? 0.5 : 1, transition: 'opacity 0.3s' }}>
              <h4>Deck ({deck.length} left)</h4>
              <div style={{ cursor: deck.length > 0 && !isDisabled ? 'pointer' : 'default' }} onClick={handleDraw}>
                {deck.length > 0 ? <CardBack /> : <div style={{ width: cardWidth, height: cardHeight, border: '2px dashed #555', borderRadius: cardBorderRadius }}></div>}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4>Last Drawn</h4>
              {isShuffling ? <div style={{ width: cardWidth, height: cardHeight }}></div> : <PlayingCard card={drawnCard} />}
            </div>
          </div>
          {showHistory && (
            <div style={{width: "100%", paddingTop: "20px", borderTop: '1px solid #444'}}>
              <h4 style={{textAlign: "center"}}>Drawn Card History</h4>
              <div className="history-scroll-container" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden', padding: '80px 20px 20px 20px', margin: '0 -20px', minHeight: `${120 * scaleFactor}px` }}>
                {history.slice().reverse().map((card, index) => (
                  <div key={index} className="history-card-wrapper">
                    <div className="history-card-inner">
                      <PlayingCard card={card} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

return { BasicView };
```


