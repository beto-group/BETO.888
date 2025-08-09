

### Tab: Card Picker

- **Description**: An interactive virtual card deck simulator. This component allows users to draw cards from a standard 54-card deck (including two jokers), tracks a running score, and maintains a history of drawn cards. The entire state of the deck is saved automatically, so you can leave and return to your game exactly as you left it.
    
- **Does**:    
    - Initializes with a full, shuffled 54-card deck.
    - Persists the deck's state (remaining cards, last drawn card, history, score) to a JSON file, so progress is saved across sessions.
    - Allows a user to draw one card at a time, which is then displayed in the "Last Drawn" area.
    - Calculates and displays a running score based on the value of each drawn card (Joker=25, A=15, K=13, etc.).
    - Keeps a visual history of all drawn cards, which can be toggled on and off.
    - The history view is a horizontally scrollable list where hovering over a card enlarges it for a better view.
    - Provides a "Shuffle & Reset" button to start over with a fresh, full deck.
    - Displays the number of cards remaining in the deck.
    - Shows loading and shuffling indicators to provide feedback during operations.

- **Can’t**:    
    - Play a specific, rule-based card game (like Poker or Solitaire); it is only a deck simulator.
    - Allow users to manually select or reorder cards in the deck.
    - Undo a draw; once a card is drawn, it can only be returned to the deck by resetting.
    - Support multiple decks or custom-configured decks from the UI.
    - Be used for multiplayer games as it's a single-user, single-state component.
    - Change the scoring rules.
        

![alt text](/_RESOURCES/IMAGES/card_picker.webp)

###### [Card Picker Viewer](D.q.cardpicker.viewer.md)

###### [Card Picker Component](D.q.cardpicker.component.md)

