---
author: beto.group
name.official: Card Picker
price: "0"
category:
  - visualization
tags:
  - game
  - cards
  - randomizer
  - interactive
  - persistent
  - ui
  - simulation
desc: An interactive, visually stunning digital card deck simulator with persistent state, history tracking, and scoring.
status: stable
complexity: plug-n-play
id: 40
resources:
  - cardpicker.clip.webm
  - card_picker.webp
longDesc: An interactive and visually stunning digital card deck component with a mystical, enigmatic theme. It allows a user to draw cards from a shuffled deck, view the drawn card, and browse a history of previously drawn cards. The component features a persistent state, saving the deck's progress so the user can continue their session later.
does: '[  {    "content": "Full 54-Card Deck: Simulates a standard 54-card deck, including two distinct Jokers."  },  {    "title": "Interactive Card Drawing",    "children": [      {        "content": "Displays a deck of face-down cards. Clicking the deck \"draws\" the top card."      },      {        "content": "The drawn card is revealed in a separate \"Last Drawn\" area."      },      {        "content": "The remaining card count is always visible on the deck."      }    ]  },  {    "title": "Persistent State",    "children": [      {        "content": "Automatically saves the state of the game after every action (drawing or resetting)."      },      {        "content": "The current deck, the last drawn card, the history, and the score are saved to a JSON file (.datacore/cardpicker/card-deck-state.json) in the vault."      },      {        "content": "Automatically loads the saved state when the component is re-opened, allowing the user to seamlessly resume their session."      }    ]  },  {    "title": "Scoring & History",    "children": [      {        "content": "Calculates a score based on the value of each drawn card (Jokers are highest)."      },      {        "content": "Includes a \"Show History\" toggle that reveals a scrollable, horizontal timeline of all cards drawn in the current session. Cards in the history can be hovered over for a larger preview."      }    ]  },  {    "title": "Shuffle & Reset",    "content": "A \"Shuffle & Reset\" button shuffles a full, fresh deck, clears the history and score, and saves the new state. The button shows a loading animation during the shuffling process."  },  {    "title": "Immersive Theming & UI",    "children": [      {        "content": "Features a polished, dark, \"enigmatic\" theme with glowing purple accents and subtle background patterns."      },      {        "content": "The playing cards are custom-designed with mystical icons and a clean, modern aesthetic."      },      {        "content": "All interactions are accompanied by smooth animations and hover effects."      }    ]  },  {    "title": "Full-Tab Experience",    "content": "Designed to run in an immersive, full-pane mode that takes over the entire Obsidian view, with a compact fallback option."  }]'
cant: '[  {    "title": "Play Any Specific Card Game",    "content": "It is a simple card drawing simulator. It does not contain the logic for any specific card game like Poker or Blackjack."  },  {    "title": "Support Multiple Decks or Players",    "content": "It manages a single, shared deck state. It is not a multiplayer component and does not support separate decks for different users or notes."  },  {    "title": "Be Customized via Props",    "content": "The appearance of the cards, the deck composition, and the scoring rules are all hard-coded within the component and cannot be changed through properties."  }]'
version.obsidian: 1.4.11
version: 2.0.1
---


### Tab: Card Picker

- **Description**: An interactive and visually stunning digital card deck component with a mystical, enigmatic theme. It allows a user to draw cards from a shuffled deck, view the drawn card, and browse a history of previously drawn cards. The component features a persistent state, saving the deck's progress so the user can continue their session later.
   
- **Does**:

    - **Full 54-Card Deck**: Simulates a standard 54-card deck, including two distinct Jokers.
    - **Interactive Card Drawing**:
        - Displays a deck of face-down cards. Clicking the deck "draws" the top card.
        - The drawn card is revealed in a separate "Last Drawn" area.
        - The remaining card count is always visible on the deck.
    - **Persistent State**:
        - **Automatically saves** the state of the game after every action (drawing or resetting).
        - The current deck, the last drawn card, the history, and the score are saved to a JSON file (.datacore/cardpicker/card-deck-state.json) in the vault.
        - **Automatically loads** the saved state when the component is re-opened, allowing the user to seamlessly resume their session.
    - **Scoring & History**:
        - Calculates a score based on the value of each drawn card (Jokers are highest).
        - Includes a "Show History" toggle that reveals a scrollable, horizontal timeline of all cards drawn in the current session. Cards in the history can be hovered over for a larger preview.
    - **Shuffle & Reset**: A "Shuffle & Reset" button shuffles a full, fresh deck, clears the history and score, and saves the new state. The button shows a loading animation during the shuffling process.
    - **Immersive Theming & UI**:
        - Features a polished, dark, "enigmatic" theme with glowing purple accents and subtle background patterns.
        - The playing cards are custom-designed with mystical icons and a clean, modern aesthetic.
        - All interactions are accompanied by smooth animations and hover effects.
    - **Full-Tab Experience**: Designed to run in an immersive, full-pane mode that takes over the entire Obsidian view, with a compact fallback option.

- **Can’t**:
   
    - **Play Any Specific Card Game**: It is a simple card drawing simulator. It does not contain the logic for any specific card game like Poker or Blackjack.    
    - **Support Multiple Decks or Players**: It manages a single, shared deck state. It is not a multiplayer component and does not support separate decks for different users or notes.
    - **Be Customized via Props**: The appearance of the cards, the deck composition, and the scoring rules are all hard-coded within the component and cannot be changed through properties.


----

![cardpicker.clip.webm](_resources/videos/cardpicker.clip.webm)


![card_picker.webp](_resources/images/card_picker.webp)



### Components


###### [Card Picker Viewer](D.q.cardpicker.viewer.md)

###### [Card Picker Component](D.q.cardpicker.component.md)

